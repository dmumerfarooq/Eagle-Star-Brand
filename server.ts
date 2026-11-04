/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config';
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'eagle_star_db.json');
const SCHEMA_FILE = path.join(__dirname, 'database', 'mysql_schema.sql');

// Ensure data directory exists for Node.js server persistence
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

type StoreMap = Record<string, unknown>;

function readDiskStore(): StoreMap {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return {};
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    if (!raw.trim()) return {};
    return JSON.parse(raw) as StoreMap;
  } catch (err) {
    console.error('Error reading server disk store:', err);
    return {};
  }
}

function writeDiskStore(store: StoreMap): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing server disk store:', err);
  }
}

// Optional MySQL connection pool for Node.js + MySQL Web Hosting
// Activates automatically when MYSQL_HOST, MYSQL_USER, and MYSQL_DATABASE are set in .env
let mysqlPool: any = null;
let mysqlReady = false;

async function getMySQLPool(): Promise<any> {
  if (mysqlPool) return mysqlPool;
  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const database = process.env.MYSQL_DATABASE;
  if (!host || !user || !database) {
    return null;
  }

  try {
    const pkgName = 'mysql2/promise';
    const mysql: any = await import(/* @vite-ignore */ pkgName);
    mysqlPool = mysql.createPool({
      host,
      port: Number(process.env.MYSQL_PORT || 3306),
      user,
      password: process.env.MYSQL_PASSWORD || '',
      database,
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: 10,
      multipleStatements: true
    });

    if (!mysqlReady) {
      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS \`app_kv_store\` (
          \`store_key\` VARCHAR(64) NOT NULL,
          \`store_value\` LONGTEXT NOT NULL,
          \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`store_key\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      mysqlReady = true;
    }
    return mysqlPool;
  } catch (err) {
    console.warn('MySQL driver not active, using Node.js file persistence:', err);
    return null;
  }
}

async function loadAllState(): Promise<StoreMap> {
  const diskStore = readDiskStore();
  const pool = await getMySQLPool();
  if (!pool) {
    return diskStore;
  }

  try {
    const [rows] = await pool.query('SELECT `store_key`, `store_value` FROM `app_kv_store`');
    if (Array.isArray(rows) && rows.length > 0) {
      const mysqlStore: StoreMap = { ...diskStore };
      for (const row of rows as Array<{ store_key: string; store_value: string }>) {
        try {
          mysqlStore[row.store_key] = JSON.parse(row.store_value);
        } catch {
          // ignore malformed entry
        }
      }
      writeDiskStore(mysqlStore);
      return mysqlStore;
    }
  } catch (err) {
    console.error('MySQL read fallback to disk store:', err);
  }
  return diskStore;
}

async function saveKeyState(key: string, data: unknown): Promise<void> {
  const current = readDiskStore();
  current[key] = data;
  writeDiskStore(current);

  const pool = await getMySQLPool();
  if (pool) {
    try {
      await pool.query(
        'INSERT INTO `app_kv_store` (`store_key`, `store_value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `store_value` = VALUES(`store_value`)',
        [key, JSON.stringify(data)]
      );
    } catch (err) {
      console.error('MySQL save error:', err);
    }
  }
}

async function saveBulkState(store: StoreMap): Promise<void> {
  const current = readDiskStore();
  const merged: StoreMap = { ...current, ...store };
  writeDiskStore(merged);

  const pool = await getMySQLPool();
  if (pool) {
    try {
      for (const [key, value] of Object.entries(store)) {
        await pool.query(
          'INSERT INTO `app_kv_store` (`store_key`, `store_value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `store_value` = VALUES(`store_value`)',
          [key, JSON.stringify(value)]
        );
      }
    } catch (err) {
      console.error('MySQL bulk save error:', err);
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '25mb' }));

  // API: Load full persisted application state
  app.get('/api/state', async (_req: Request, res: Response) => {
    try {
      const store = await loadAllState();
      res.json({ ok: true, store });
    } catch (err) {
      console.error('GET /api/state failed:', err);
      res.status(500).json({ ok: false, error: 'Failed to load server state' });
    }
  });

  // API: Save single key or bulk state to Node.js server & MySQL
  app.post('/api/state', async (req: Request, res: Response) => {
    try {
      const body = req.body || {};
      if (typeof body.key === 'string' && body.data !== undefined) {
        await saveKeyState(body.key, body.data);
        res.json({ ok: true });
        return;
      }
      if (body.store && typeof body.store === 'object') {
        await saveBulkState(body.store as StoreMap);
        res.json({ ok: true });
        return;
      }
      res.status(400).json({ ok: false, error: 'Invalid payload' });
    } catch (err) {
      console.error('POST /api/state failed:', err);
      res.status(500).json({ ok: false, error: 'Failed to persist state' });
    }
  });

  // API: Download MySQL relational schema file
  app.get('/api/mysql-schema', (_req: Request, res: Response) => {
    if (fs.existsSync(SCHEMA_FILE)) {
      res.setHeader('Content-Type', 'application/sql; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="Eagle_Star_Brand_MySQL_Schema.sql"');
      res.sendFile(SCHEMA_FILE);
    } else {
      res.status(404).json({ ok: false, error: 'Schema file not found' });
    }
  });

  const distPath = path.join(__dirname, 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distPath);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Eagle Star Brand server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
