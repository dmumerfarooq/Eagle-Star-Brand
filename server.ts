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

type StoreMap = Record<string, any>;

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
    const tmpFile = `${DB_FILE}.tmp.${process.pid}`;
    fs.writeFileSync(tmpFile, JSON.stringify(store, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error('Error writing server disk store:', err);
  }
}

// Optional MySQL connection pool for Node.js + MySQL Web Hosting
// Activates automatically when MYSQL_HOST, MYSQL_USER, and MYSQL_DATABASE are set in .env
let mysqlPool: any = null;
let mysqlReady = false;

async function ensureMySQLRelationalTables(pool: any): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`app_kv_store\` (
      \`store_key\` VARCHAR(64) NOT NULL,
      \`store_value\` LONGTEXT NOT NULL,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`store_key\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` VARCHAR(64) NOT NULL,
      \`username\` VARCHAR(120) NOT NULL,
      \`password\` VARCHAR(255) NOT NULL,
      \`full_name\` VARCHAR(150) NOT NULL,
      \`full_name_ur\` VARCHAR(200) DEFAULT NULL,
      \`role\` VARCHAR(32) NOT NULL DEFAULT 'cashier',
      \`station_access\` VARCHAR(120) NOT NULL DEFAULT 'all',
      \`status\` VARCHAR(32) NOT NULL DEFAULT 'active',
      \`permissions_json\` LONGTEXT DEFAULT NULL,
      \`last_login\` VARCHAR(64) DEFAULT NULL,
      \`created_at\` VARCHAR(64) DEFAULT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_users_username\` (\`username\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS \`business_settings\` (
      \`id\` INT NOT NULL DEFAULT 1,
      \`business_name_en\` VARCHAR(200) NOT NULL DEFAULT 'Eagle Star Brand',
      \`business_name_ur\` VARCHAR(200) NOT NULL DEFAULT 'ایگل ایس بی',
      \`branch_en\` VARCHAR(200) DEFAULT NULL,
      \`branch_ur\` VARCHAR(200) DEFAULT NULL,
      \`address_en\` VARCHAR(300) DEFAULT NULL,
      \`address_ur\` VARCHAR(300) DEFAULT NULL,
      \`phone_en\` VARCHAR(60) DEFAULT NULL,
      \`phone_ur\` VARCHAR(60) DEFAULT NULL,
      \`whatsapp\` VARCHAR(60) DEFAULT NULL,
      \`email\` VARCHAR(150) DEFAULT NULL,
      \`default_exchange_rate\` DECIMAL(12, 2) NOT NULL DEFAULT 77.50,
      \`default_transfer_currency\` VARCHAR(16) NOT NULL DEFAULT 'AED',
      \`currencies_json\` LONGTEXT DEFAULT NULL,
      \`manual_rate_updated_at\` VARCHAR(64) DEFAULT NULL,
      \`manual_rate_updated_by\` VARCHAR(150) DEFAULT NULL,
      \`default_commission_pct\` DECIMAL(8, 2) NOT NULL DEFAULT 1.00,
      \`commission_base\` VARCHAR(16) NOT NULL DEFAULT 'AED',
      \`receipt_prefix\` VARCHAR(32) NOT NULL DEFAULT 'REC',
      \`order_number_prefix\` VARCHAR(32) NOT NULL DEFAULT '109',
      \`default_language\` VARCHAR(16) NOT NULL DEFAULT 'en',
      \`receipt_header_title_ur\` VARCHAR(150) DEFAULT 'رسید آرڈر',
      \`receipt_customer_label_ur\` VARCHAR(150) DEFAULT 'مصفح کسٹمر نمبر',
      \`receipt_footer_en\` TEXT DEFAULT NULL,
      \`receipt_footer_ur\` TEXT DEFAULT NULL,
      \`receipt_footer_cash_jamah_ur\` TEXT DEFAULT NULL,
      \`receipt_footer_cash_jamah_en\` TEXT DEFAULT NULL,
      \`receipt_footer_deposit_ur\` TEXT DEFAULT NULL,
      \`receipt_footer_deposit_en\` TEXT DEFAULT NULL,
      \`receipt_footer_loan_ur\` TEXT DEFAULT NULL,
      \`receipt_footer_loan_en\` TEXT DEFAULT NULL,
      \`custom_logo_url\` LONGTEXT DEFAULT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS \`saved_banks\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`bank_name\` VARCHAR(180) NOT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_saved_banks_name\` (\`bank_name\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS \`stations\` (
      \`id\` VARCHAR(64) NOT NULL,
      \`code\` VARCHAR(32) NOT NULL,
      \`name_ur\` VARCHAR(150) NOT NULL,
      \`name_en\` VARCHAR(150) NOT NULL,
      \`city\` VARCHAR(120) DEFAULT NULL,
      \`category\` VARCHAR(32) NOT NULL DEFAULT 'counter',
      \`in_charge\` VARCHAR(150) DEFAULT NULL,
      \`phone\` VARCHAR(60) DEFAULT NULL,
      \`address\` VARCHAR(300) DEFAULT NULL,
      \`status\` VARCHAR(32) NOT NULL DEFAULT 'active',
      \`current_balance_pkr\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
      \`notes\` TEXT DEFAULT NULL,
      \`created_at\` VARCHAR(64) DEFAULT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS \`station_ledger_entries\` (
      \`id\` VARCHAR(64) NOT NULL,
      \`station_id\` VARCHAR(64) NOT NULL,
      \`station_name_ur\` VARCHAR(150) NOT NULL,
      \`entry_date\` VARCHAR(32) NOT NULL,
      \`entry_time\` VARCHAR(32) DEFAULT NULL,
      \`tx_type\` VARCHAR(64) NOT NULL DEFAULT 'deposit_topup',
      \`amount_pkr\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
      \`amount_aed\` DECIMAL(16, 2) DEFAULT 0.00,
      \`exchange_rate\` DECIMAL(12, 2) DEFAULT 77.50,
      \`payment_method\` VARCHAR(64) DEFAULT 'Bank Transfer',
      \`bank_name\` VARCHAR(180) DEFAULT NULL,
      \`account_number\` VARCHAR(120) DEFAULT NULL,
      \`reference_no\` VARCHAR(100) DEFAULT NULL,
      \`related_party\` VARCHAR(200) DEFAULT NULL,
      \`previous_balance_pkr\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
      \`new_balance_pkr\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
      \`description\` TEXT NOT NULL,
      \`notes\` TEXT DEFAULT NULL,
      \`receipt_no\` VARCHAR(64) NOT NULL,
      \`created_at\` VARCHAR(64) DEFAULT NULL,
      \`updated_at\` VARCHAR(64) DEFAULT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS \`customers\` (
      \`id\` VARCHAR(64) NOT NULL,
      \`customer_code\` VARCHAR(64) NOT NULL,
      \`name\` VARCHAR(180) NOT NULL,
      \`name_ur\` VARCHAR(180) DEFAULT NULL,
      \`phone\` VARCHAR(60) NOT NULL,
      \`secondary_phone\` VARCHAR(60) DEFAULT NULL,
      \`address\` VARCHAR(300) DEFAULT NULL,
      \`city\` VARCHAR(120) DEFAULT NULL,
      \`country\` VARCHAR(120) DEFAULT 'UAE',
      \`date_added\` VARCHAR(32) NOT NULL,
      \`notes\` TEXT DEFAULT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS \`receivers\` (
      \`id\` VARCHAR(64) NOT NULL,
      \`customer_id\` VARCHAR(64) DEFAULT NULL,
      \`name\` VARCHAR(180) NOT NULL,
      \`name_ur\` VARCHAR(180) DEFAULT NULL,
      \`phone\` VARCHAR(60) NOT NULL,
      \`address\` VARCHAR(300) DEFAULT NULL,
      \`city\` VARCHAR(120) DEFAULT NULL,
      \`province\` VARCHAR(120) DEFAULT NULL,
      \`station\` VARCHAR(150) NOT NULL,
      \`country\` VARCHAR(120) DEFAULT 'Pakistan',
      \`cnic\` VARCHAR(40) DEFAULT NULL,
      \`bank_name\` VARCHAR(180) DEFAULT NULL,
      \`account_number\` VARCHAR(120) DEFAULT NULL,
      \`payout_method\` VARCHAR(64) DEFAULT 'Cash',
      \`notes\` TEXT DEFAULT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS \`money_transfers\` (
      \`id\` VARCHAR(64) NOT NULL,
      \`order_number\` VARCHAR(64) NOT NULL,
      \`receipt_number\` VARCHAR(64) NOT NULL,
      \`transfer_date\` VARCHAR(32) NOT NULL,
      \`transfer_time\` VARCHAR(32) DEFAULT NULL,
      \`sender_id\` VARCHAR(64) DEFAULT NULL,
      \`sender_name\` VARCHAR(180) NOT NULL,
      \`sender_phone\` VARCHAR(60) NOT NULL,
      \`sender_city\` VARCHAR(120) DEFAULT NULL,
      \`sender_country\` VARCHAR(120) DEFAULT NULL,
      \`receiver_id\` VARCHAR(64) DEFAULT NULL,
      \`receiver_name\` VARCHAR(180) NOT NULL,
      \`receiver_phone\` VARCHAR(60) NOT NULL,
      \`receiver_address\` VARCHAR(300) DEFAULT NULL,
      \`receiver_city\` VARCHAR(120) DEFAULT NULL,
      \`receiver_cnic\` VARCHAR(40) DEFAULT NULL,
      \`station\` VARCHAR(150) NOT NULL,
      \`payout_method\` VARCHAR(64) DEFAULT 'Cash',
      \`bank_name\` VARCHAR(180) DEFAULT NULL,
      \`account_number\` VARCHAR(120) DEFAULT NULL,
      \`input_currency\` VARCHAR(16) NOT NULL DEFAULT 'AED',
      \`amount_aed\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
      \`exchange_rate\` DECIMAL(12, 2) NOT NULL DEFAULT 77.50,
      \`amount_pkr\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
      \`commission_type\` VARCHAR(32) NOT NULL DEFAULT 'percentage',
      \`commission_rate\` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      \`commission_base\` VARCHAR(16) NOT NULL DEFAULT 'AED',
      \`commission_amount\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
      \`additional_charges\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
      \`total_collected_aed\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
      \`net_payable_pkr\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
      \`amount_paid_pkr\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
      \`remaining_balance_pkr\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
      \`station_balance_deducted\` TINYINT(1) NOT NULL DEFAULT 0,
      \`station_previous_balance_pkr\` DECIMAL(16, 2) DEFAULT NULL,
      \`station_new_balance_pkr\` DECIMAL(16, 2) DEFAULT NULL,
      \`status\` VARCHAR(32) NOT NULL DEFAULT 'Received',
      \`notes\` TEXT DEFAULT NULL,
      \`created_at\` VARCHAR(64) DEFAULT NULL,
      \`updated_at\` VARCHAR(64) DEFAULT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS \`transfer_payouts\` (
      \`id\` VARCHAR(64) NOT NULL,
      \`transfer_id\` VARCHAR(64) NOT NULL,
      \`payout_date\` VARCHAR(32) NOT NULL,
      \`receiver_name\` VARCHAR(180) NOT NULL,
      \`amount_pkr\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
      \`payment_method\` VARCHAR(64) NOT NULL DEFAULT 'Cash',
      \`reference_no\` VARCHAR(100) DEFAULT NULL,
      \`station\` VARCHAR(150) DEFAULT NULL,
      \`receipt_no\` VARCHAR(64) NOT NULL,
      \`notes\` TEXT DEFAULT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS \`loans\` (
      \`id\` VARCHAR(64) NOT NULL,
      \`loan_no\` VARCHAR(64) NOT NULL,
      \`borrower_name\` VARCHAR(180) NOT NULL,
      \`borrower_phone\` VARCHAR(60) NOT NULL,
      \`borrower_address\` VARCHAR(300) DEFAULT NULL,
      \`loan_date\` VARCHAR(32) NOT NULL,
      \`initial_amount\` DECIMAL(16, 2) DEFAULT 0.00,
      \`original_amount\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
      \`currency\` VARCHAR(16) NOT NULL DEFAULT 'PKR',
      \`due_date\` VARCHAR(32) NOT NULL,
      \`expected_duration\` VARCHAR(32) NOT NULL DEFAULT '1_month',
      \`purpose\` VARCHAR(300) DEFAULT NULL,
      \`agreed_terms\` TEXT DEFAULT NULL,
      \`total_repaid\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
      \`remaining_balance\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
      \`status\` VARCHAR(32) NOT NULL DEFAULT 'Outstanding',
      \`receipt_no\` VARCHAR(64) NOT NULL,
      \`notes\` TEXT DEFAULT NULL,
      \`updated_at\` VARCHAR(64) DEFAULT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS \`loan_repayments\` (
      \`id\` VARCHAR(64) NOT NULL,
      \`loan_id\` VARCHAR(64) NOT NULL,
      \`repayment_date\` VARCHAR(32) NOT NULL,
      \`entry_type\` VARCHAR(32) NOT NULL DEFAULT 'repayment',
      \`amount\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
      \`currency\` VARCHAR(16) NOT NULL DEFAULT 'PKR',
      \`payment_method\` VARCHAR(64) NOT NULL DEFAULT 'Cash',
      \`reference_no\` VARCHAR(100) DEFAULT NULL,
      \`receipt_no\` VARCHAR(64) NOT NULL,
      \`previous_balance\` DECIMAL(16, 2) DEFAULT 0.00,
      \`new_balance\` DECIMAL(16, 2) DEFAULT 0.00,
      \`received_by\` VARCHAR(150) DEFAULT NULL,
      \`notes\` TEXT DEFAULT NULL,
      \`updated_at\` VARCHAR(64) DEFAULT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS \`amanat_accounts\` (
      \`id\` VARCHAR(64) NOT NULL,
      \`account_no\` VARCHAR(64) NOT NULL,
      \`owner_name\` VARCHAR(180) NOT NULL,
      \`owner_phone\` VARCHAR(60) NOT NULL,
      \`owner_address\` VARCHAR(300) DEFAULT NULL,
      \`city\` VARCHAR(120) DEFAULT NULL,
      \`currency\` VARCHAR(16) NOT NULL DEFAULT 'PKR',
      \`opened_date\` VARCHAR(32) NOT NULL,
      \`current_balance\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
      \`notes\` TEXT DEFAULT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS \`amanat_entries\` (
      \`id\` VARCHAR(64) NOT NULL,
      \`account_id\` VARCHAR(64) NOT NULL,
      \`entry_date\` VARCHAR(32) NOT NULL,
      \`entry_type\` VARCHAR(64) NOT NULL,
      \`amount\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
      \`currency\` VARCHAR(16) NOT NULL DEFAULT 'PKR',
      \`description\` TEXT NOT NULL,
      \`related_person\` VARCHAR(180) DEFAULT NULL,
      \`previous_balance\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
      \`new_balance\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
      \`receipt_no\` VARCHAR(64) NOT NULL,
      \`payment_method\` VARCHAR(64) DEFAULT 'Cash',
      \`bank_name\` VARCHAR(180) DEFAULT NULL,
      \`notes\` TEXT DEFAULT NULL,
      \`updated_at\` VARCHAR(64) DEFAULT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS \`cash_ledger\` (
      \`id\` VARCHAR(64) NOT NULL,
      \`entry_date\` VARCHAR(32) NOT NULL,
      \`entry_type\` VARCHAR(32) NOT NULL,
      \`category\` VARCHAR(64) NOT NULL,
      \`amount\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
      \`currency\` VARCHAR(16) NOT NULL DEFAULT 'PKR',
      \`reference_id\` VARCHAR(100) DEFAULT NULL,
      \`party_name\` VARCHAR(180) DEFAULT NULL,
      \`payment_method\` VARCHAR(64) NOT NULL DEFAULT 'Cash',
      \`description\` TEXT NOT NULL,
      \`notes\` TEXT DEFAULT NULL,
      \`updated_at\` VARCHAR(64) DEFAULT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Safe schema evolution for pre-existing MySQL databases
  const safeAlters = [
    "ALTER TABLE `business_settings` ADD COLUMN `default_transfer_currency` VARCHAR(16) NOT NULL DEFAULT 'AED'",
    "ALTER TABLE `business_settings` ADD COLUMN `currencies_json` LONGTEXT DEFAULT NULL",
    "ALTER TABLE `business_settings` ADD COLUMN `receipt_header_title_ur` VARCHAR(150) DEFAULT 'رسید آرڈر'",
    "ALTER TABLE `business_settings` ADD COLUMN `receipt_customer_label_ur` VARCHAR(150) DEFAULT 'مصفح کسٹمر نمبر'",
    "ALTER TABLE `business_settings` ADD COLUMN `custom_logo_url` LONGTEXT DEFAULT NULL",
    "ALTER TABLE `money_transfers` ADD COLUMN `input_currency` VARCHAR(16) NOT NULL DEFAULT 'AED'",
    "ALTER TABLE `money_transfers` ADD COLUMN `updated_at` VARCHAR(64) DEFAULT NULL",
    "ALTER TABLE `station_ledger_entries` ADD COLUMN `amount_aed` DECIMAL(16, 2) DEFAULT 0.00",
    "ALTER TABLE `station_ledger_entries` ADD COLUMN `exchange_rate` DECIMAL(12, 2) DEFAULT 77.50",
    "ALTER TABLE `station_ledger_entries` ADD COLUMN `updated_at` VARCHAR(64) DEFAULT NULL",
    "ALTER TABLE `loans` ADD COLUMN `initial_amount` DECIMAL(16, 2) DEFAULT 0.00",
    "ALTER TABLE `loans` ADD COLUMN `updated_at` VARCHAR(64) DEFAULT NULL",
    "ALTER TABLE `loans` MODIFY COLUMN `status` VARCHAR(32) NOT NULL DEFAULT 'Outstanding'",
    "ALTER TABLE `loan_repayments` ADD COLUMN `entry_type` VARCHAR(32) NOT NULL DEFAULT 'repayment'",
    "ALTER TABLE `loan_repayments` ADD COLUMN `previous_balance` DECIMAL(16, 2) DEFAULT 0.00",
    "ALTER TABLE `loan_repayments` ADD COLUMN `new_balance` DECIMAL(16, 2) DEFAULT 0.00",
    "ALTER TABLE `loan_repayments` ADD COLUMN `received_by` VARCHAR(150) DEFAULT NULL",
    "ALTER TABLE `loan_repayments` ADD COLUMN `updated_at` VARCHAR(64) DEFAULT NULL",
    "ALTER TABLE `amanat_entries` ADD COLUMN `updated_at` VARCHAR(64) DEFAULT NULL",
    "ALTER TABLE `cash_ledger` ADD COLUMN `updated_at` VARCHAR(64) DEFAULT NULL"
  ];
  for (const sql of safeAlters) {
    try {
      await pool.query(sql);
    } catch {
      // Column already exists
    }
  }
}

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
      await ensureMySQLRelationalTables(mysqlPool);
      mysqlReady = true;
    }
    return mysqlPool;
  } catch (err) {
    console.warn('MySQL driver not active, using Node.js file persistence:', err);
    return null;
  }
}

// Synchronize specific key data directly into relational MySQL tables
async function syncRelationalKeyToMySQL(pool: any, key: string, data: any): Promise<void> {
  if (!pool || data === undefined || data === null) return;
  try {
    if (key === 'pk_dubai_settings_v1' && typeof data === 'object') {
      const s = data;
      await pool.query(
        `INSERT INTO \`business_settings\` (
          \`id\`, \`business_name_en\`, \`business_name_ur\`, \`branch_en\`, \`branch_ur\`,
          \`address_en\`, \`address_ur\`, \`phone_en\`, \`phone_ur\`, \`whatsapp\`, \`email\`,
          \`default_exchange_rate\`, \`default_transfer_currency\`, \`currencies_json\`,
          \`manual_rate_updated_at\`, \`manual_rate_updated_by\`, \`default_commission_pct\`,
          \`commission_base\`, \`receipt_prefix\`, \`order_number_prefix\`, \`default_language\`,
          \`receipt_header_title_ur\`, \`receipt_customer_label_ur\`,
          \`receipt_footer_en\`, \`receipt_footer_ur\`, \`receipt_footer_cash_jamah_ur\`,
          \`receipt_footer_cash_jamah_en\`, \`receipt_footer_deposit_ur\`, \`receipt_footer_deposit_en\`,
          \`receipt_footer_loan_ur\`, \`receipt_footer_loan_en\`, \`custom_logo_url\`
        ) VALUES (1,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE
          \`business_name_en\`=VALUES(\`business_name_en\`),
          \`business_name_ur\`=VALUES(\`business_name_ur\`),
          \`branch_en\`=VALUES(\`branch_en\`),
          \`branch_ur\`=VALUES(\`branch_ur\`),
          \`address_en\`=VALUES(\`address_en\`),
          \`address_ur\`=VALUES(\`address_ur\`),
          \`phone_en\`=VALUES(\`phone_en\`),
          \`phone_ur\`=VALUES(\`phone_ur\`),
          \`whatsapp\`=VALUES(\`whatsapp\`),
          \`email\`=VALUES(\`email\`),
          \`default_exchange_rate\`=VALUES(\`default_exchange_rate\`),
          \`default_transfer_currency\`=VALUES(\`default_transfer_currency\`),
          \`currencies_json\`=VALUES(\`currencies_json\`),
          \`manual_rate_updated_at\`=VALUES(\`manual_rate_updated_at\`),
          \`manual_rate_updated_by\`=VALUES(\`manual_rate_updated_by\`),
          \`default_commission_pct\`=VALUES(\`default_commission_pct\`),
          \`commission_base\`=VALUES(\`commission_base\`),
          \`receipt_prefix\`=VALUES(\`receipt_prefix\`),
          \`order_number_prefix\`=VALUES(\`order_number_prefix\`),
          \`default_language\`=VALUES(\`default_language\`),
          \`receipt_header_title_ur\`=VALUES(\`receipt_header_title_ur\`),
          \`receipt_customer_label_ur\`=VALUES(\`receipt_customer_label_ur\`),
          \`receipt_footer_en\`=VALUES(\`receipt_footer_en\`),
          \`receipt_footer_ur\`=VALUES(\`receipt_footer_ur\`),
          \`receipt_footer_cash_jamah_ur\`=VALUES(\`receipt_footer_cash_jamah_ur\`),
          \`receipt_footer_cash_jamah_en\`=VALUES(\`receipt_footer_cash_jamah_en\`),
          \`receipt_footer_deposit_ur\`=VALUES(\`receipt_footer_deposit_ur\`),
          \`receipt_footer_deposit_en\`=VALUES(\`receipt_footer_deposit_en\`),
          \`receipt_footer_loan_ur\`=VALUES(\`receipt_footer_loan_ur\`),
          \`receipt_footer_loan_en\`=VALUES(\`receipt_footer_loan_en\`),
          \`custom_logo_url\`=VALUES(\`custom_logo_url\`)`,
        [
          s.businessNameEn || 'Eagle Star Brand',
          s.businessNameUr || 'ایگل ایس بی',
          s.branchEn || null,
          s.branchUr || null,
          s.addressEn || null,
          s.addressUr || null,
          s.phoneEn || null,
          s.phoneUr || null,
          s.whatsapp || null,
          s.email || null,
          Number(s.defaultExchangeRate || 77.5),
          s.defaultTransferCurrency || 'AED',
          s.currencies ? JSON.stringify(s.currencies) : null,
          s.manualRateUpdatedAt || null,
          s.manualRateUpdatedBy || null,
          Number(s.defaultCommissionPct || 0),
          s.commissionBase || 'AED',
          s.receiptPrefix || 'REC',
          s.orderNumberPrefix || '109',
          s.defaultLanguage || 'en',
          s.receiptHeaderTitleUr || 'رسید آرڈر',
          s.receiptCustomerLabelUr || 'مصفح کسٹمر نمبر',
          s.receiptFooterEn || null,
          s.receiptFooterUr || null,
          s.receiptFooterCashJamahUr || null,
          s.receiptFooterCashJamahEn || null,
          s.receiptFooterDepositUr || null,
          s.receiptFooterDepositEn || null,
          s.receiptFooterLoanUr || null,
          s.receiptFooterLoanEn || null,
          s.customLogoUrl || null
        ]
      );
    } else if (key === 'pk_dubai_transfers_v1' && Array.isArray(data)) {
      const ids = data.map((t: any) => t.id).filter(Boolean);
      if (ids.length > 0) {
        await pool.query('DELETE FROM `money_transfers` WHERE `id` NOT IN (?)', [ids]);
        await pool.query('DELETE FROM `transfer_payouts` WHERE `transfer_id` NOT IN (?)', [ids]);
      } else {
        await pool.query('DELETE FROM `transfer_payouts`');
        await pool.query('DELETE FROM `money_transfers`');
      }
      const allPayoutIds: string[] = [];
      for (const tr of data) {
        await pool.query(
          `INSERT INTO \`money_transfers\` (
            \`id\`, \`order_number\`, \`receipt_number\`, \`transfer_date\`, \`transfer_time\`,
            \`sender_id\`, \`sender_name\`, \`sender_phone\`, \`sender_city\`, \`sender_country\`,
            \`receiver_id\`, \`receiver_name\`, \`receiver_phone\`, \`receiver_address\`, \`receiver_city\`, \`receiver_cnic\`,
            \`station\`, \`payout_method\`, \`bank_name\`, \`account_number\`, \`input_currency\`,
            \`amount_aed\`, \`exchange_rate\`, \`amount_pkr\`, \`commission_type\`, \`commission_rate\`,
            \`commission_base\`, \`commission_amount\`, \`additional_charges\`, \`total_collected_aed\`,
            \`net_payable_pkr\`, \`amount_paid_pkr\`, \`remaining_balance_pkr\`,
            \`station_balance_deducted\`, \`station_previous_balance_pkr\`, \`station_new_balance_pkr\`,
            \`status\`, \`notes\`, \`created_at\`, \`updated_at\`
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
          ON DUPLICATE KEY UPDATE
            \`order_number\`=VALUES(\`order_number\`),
            \`transfer_date\`=VALUES(\`transfer_date\`),
            \`sender_name\`=VALUES(\`sender_name\`),
            \`sender_phone\`=VALUES(\`sender_phone\`),
            \`sender_city\`=VALUES(\`sender_city\`),
            \`receiver_name\`=VALUES(\`receiver_name\`),
            \`receiver_phone\`=VALUES(\`receiver_phone\`),
            \`receiver_address\`=VALUES(\`receiver_address\`),
            \`receiver_cnic\`=VALUES(\`receiver_cnic\`),
            \`station\`=VALUES(\`station\`),
            \`payout_method\`=VALUES(\`payout_method\`),
            \`bank_name\`=VALUES(\`bank_name\`),
            \`account_number\`=VALUES(\`account_number\`),
            \`input_currency\`=VALUES(\`input_currency\`),
            \`amount_aed\`=VALUES(\`amount_aed\`),
            \`exchange_rate\`=VALUES(\`exchange_rate\`),
            \`amount_pkr\`=VALUES(\`amount_pkr\`),
            \`total_collected_aed\`=VALUES(\`total_collected_aed\`),
            \`net_payable_pkr\`=VALUES(\`net_payable_pkr\`),
            \`amount_paid_pkr\`=VALUES(\`amount_paid_pkr\`),
            \`remaining_balance_pkr\`=VALUES(\`remaining_balance_pkr\`),
            \`station_previous_balance_pkr\`=VALUES(\`station_previous_balance_pkr\`),
            \`station_new_balance_pkr\`=VALUES(\`station_new_balance_pkr\`),
            \`status\`=VALUES(\`status\`),
            \`notes\`=VALUES(\`notes\`),
            \`updated_at\`=VALUES(\`updated_at\`)`,
          [
            tr.id,
            tr.orderNumber,
            tr.receiptNumber,
            tr.date,
            tr.time || null,
            tr.senderId || null,
            tr.senderName,
            tr.senderPhone,
            tr.senderCity || null,
            tr.senderCountry || null,
            tr.receiverId || null,
            tr.receiverName,
            tr.receiverPhone,
            tr.receiverAddress || null,
            tr.receiverCity || null,
            tr.receiverCnic || null,
            tr.station,
            tr.payoutMethod || 'Cash',
            tr.bankName || null,
            tr.accountNumber || null,
            tr.inputCurrency || 'AED',
            Number(tr.amountAED || 0),
            Number(tr.exchangeRate || 77.5),
            Number(tr.amountPKR || 0),
            tr.commissionType || 'percentage',
            Number(tr.commissionRate || 0),
            tr.commissionBase || 'AED',
            Number(tr.commissionAmount || 0),
            Number(tr.additionalCharges || 0),
            Number(tr.totalCollectedAED || 0),
            Number(tr.netPayablePKR || 0),
            Number(tr.amountPaidPKR || 0),
            Number(tr.remainingBalancePKR || 0),
            tr.stationBalanceDeducted ? 1 : 0,
            tr.stationPreviousBalancePKR ?? null,
            tr.stationNewBalancePKR ?? null,
            tr.status || 'Received',
            tr.notes || null,
            tr.createdAt || null,
            tr.updatedAt || null
          ]
        );
        if (Array.isArray(tr.payouts)) {
          for (const p of tr.payouts) {
            if (p.id) allPayoutIds.push(p.id);
            await pool.query(
              `INSERT INTO \`transfer_payouts\` (
                \`id\`, \`transfer_id\`, \`payout_date\`, \`receiver_name\`, \`amount_pkr\`,
                \`payment_method\`, \`reference_no\`, \`station\`, \`receipt_no\`, \`notes\`
              ) VALUES (?,?,?,?,?,?,?,?,?,?)
              ON DUPLICATE KEY UPDATE
                \`payout_date\`=VALUES(\`payout_date\`),
                \`amount_pkr\`=VALUES(\`amount_pkr\`),
                \`payment_method\`=VALUES(\`payment_method\`),
                \`station\`=VALUES(\`station\`),
                \`notes\`=VALUES(\`notes\`)`,
              [
                p.id,
                tr.id,
                p.date,
                p.receiverName,
                Number(p.amountPKR || 0),
                p.paymentMethod || 'Cash',
                p.referenceNo || null,
                p.station || null,
                p.receiptNo,
                p.notes || null
              ]
            );
          }
        }
      }
      if (allPayoutIds.length > 0) {
        await pool.query('DELETE FROM `transfer_payouts` WHERE `id` NOT IN (?)', [allPayoutIds]);
      } else {
        await pool.query('DELETE FROM `transfer_payouts`');
      }
    } else if (key === 'pk_dubai_stations_v1' && Array.isArray(data)) {
      const stIds = data.map((s: any) => s.id).filter(Boolean);
      if (stIds.length > 0) {
        await pool.query('DELETE FROM `stations` WHERE `id` NOT IN (?)', [stIds]);
      } else {
        await pool.query('DELETE FROM `station_ledger_entries`');
        await pool.query('DELETE FROM `stations`');
      }
      const allEntryIds: string[] = [];
      for (const st of data) {
        await pool.query(
          `INSERT INTO \`stations\` (
            \`id\`, \`code\`, \`name_ur\`, \`name_en\`, \`city\`, \`category\`,
            \`in_charge\`, \`phone\`, \`address\`, \`status\`, \`current_balance_pkr\`, \`notes\`, \`created_at\`
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
          ON DUPLICATE KEY UPDATE
            \`code\`=VALUES(\`code\`),
            \`name_ur\`=VALUES(\`name_ur\`),
            \`name_en\`=VALUES(\`name_en\`),
            \`city\`=VALUES(\`city\`),
            \`category\`=VALUES(\`category\`),
            \`in_charge\`=VALUES(\`in_charge\`),
            \`phone\`=VALUES(\`phone\`),
            \`address\`=VALUES(\`address\`),
            \`status\`=VALUES(\`status\`),
            \`current_balance_pkr\`=VALUES(\`current_balance_pkr\`),
            \`notes\`=VALUES(\`notes\`)`,
          [
            st.id,
            st.code,
            st.nameUr,
            st.nameEn,
            st.city || null,
            st.category || 'counter',
            st.inCharge || null,
            st.phone || null,
            st.address || null,
            st.status || 'active',
            Number(st.currentBalancePKR || 0),
            st.notes || null,
            st.createdAt || null
          ]
        );
        if (Array.isArray(st.entries)) {
          for (const e of st.entries) {
            allEntryIds.push(e.id);
            await pool.query(
              `INSERT INTO \`station_ledger_entries\` (
                \`id\`, \`station_id\`, \`station_name_ur\`, \`entry_date\`, \`entry_time\`,
                \`tx_type\`, \`amount_pkr\`, \`amount_aed\`, \`exchange_rate\`, \`payment_method\`,
                \`bank_name\`, \`account_number\`, \`reference_no\`, \`related_party\`,
                \`previous_balance_pkr\`, \`new_balance_pkr\`, \`description\`, \`notes\`,
                \`receipt_no\`, \`created_at\`, \`updated_at\`
              ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
              ON DUPLICATE KEY UPDATE
                \`station_name_ur\`=VALUES(\`station_name_ur\`),
                \`entry_date\`=VALUES(\`entry_date\`),
                \`tx_type\`=VALUES(\`tx_type\`),
                \`amount_pkr\`=VALUES(\`amount_pkr\`),
                \`amount_aed\`=VALUES(\`amount_aed\`),
                \`exchange_rate\`=VALUES(\`exchange_rate\`),
                \`payment_method\`=VALUES(\`payment_method\`),
                \`bank_name\`=VALUES(\`bank_name\`),
                \`account_number\`=VALUES(\`account_number\`),
                \`reference_no\`=VALUES(\`reference_no\`),
                \`related_party\`=VALUES(\`related_party\`),
                \`previous_balance_pkr\`=VALUES(\`previous_balance_pkr\`),
                \`new_balance_pkr\`=VALUES(\`new_balance_pkr\`),
                \`description\`=VALUES(\`description\`),
                \`notes\`=VALUES(\`notes\`),
                \`updated_at\`=VALUES(\`updated_at\`)`,
              [
                e.id,
                st.id,
                e.stationNameUr || st.nameUr,
                e.date,
                e.time || null,
                e.type || 'deposit_topup',
                Number(e.amountPKR || 0),
                Number(e.amountAED || 0),
                Number(e.exchangeRate || 77.5),
                e.paymentMethod || 'Bank Transfer',
                e.bankName || null,
                e.accountNumber || null,
                e.referenceNo || null,
                e.relatedParty || null,
                Number(e.previousBalancePKR || 0),
                Number(e.newBalancePKR || 0),
                e.description || '',
                e.notes || null,
                e.receiptNo || '',
                e.createdAt || null,
                e.updatedAt || null
              ]
            );
          }
        }
      }
      if (allEntryIds.length > 0) {
        await pool.query('DELETE FROM `station_ledger_entries` WHERE `id` NOT IN (?)', [allEntryIds]);
      } else {
        await pool.query('DELETE FROM `station_ledger_entries`');
      }
    } else if (key === 'pk_dubai_customers_v1' && Array.isArray(data)) {
      const custIds = data.map((c: any) => c.id).filter(Boolean);
      if (custIds.length > 0) {
        await pool.query('DELETE FROM `customers` WHERE `id` NOT IN (?)', [custIds]);
      } else {
        await pool.query('DELETE FROM `customers`');
      }
      for (const c of data) {
        await pool.query(
          `INSERT INTO \`customers\` (
            \`id\`, \`customer_code\`, \`name\`, \`name_ur\`, \`phone\`, \`secondary_phone\`,
            \`address\`, \`city\`, \`country\`, \`date_added\`, \`notes\`
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?)
          ON DUPLICATE KEY UPDATE
            \`customer_code\`=VALUES(\`customer_code\`),
            \`name\`=VALUES(\`name\`),
            \`name_ur\`=VALUES(\`name_ur\`),
            \`phone\`=VALUES(\`phone\`),
            \`secondary_phone\`=VALUES(\`secondary_phone\`),
            \`address\`=VALUES(\`address\`),
            \`city\`=VALUES(\`city\`),
            \`country\`=VALUES(\`country\`),
            \`date_added\`=VALUES(\`date_added\`),
            \`notes\`=VALUES(\`notes\`)`,
          [
            c.id,
            c.customerCode || c.code || c.id,
            c.name || '',
            c.nameUr || null,
            c.phone || '',
            c.secondaryPhone || c.whatsapp || null,
            c.address || null,
            c.city || null,
            c.country || 'UAE',
            c.dateAdded || new Date().toISOString().split('T')[0],
            c.notes || null
          ]
        );
      }
    } else if (key === 'pk_dubai_receivers_v1' && Array.isArray(data)) {
      const recIds = data.map((r: any) => r.id).filter(Boolean);
      if (recIds.length > 0) {
        await pool.query('DELETE FROM `receivers` WHERE `id` NOT IN (?)', [recIds]);
      } else {
        await pool.query('DELETE FROM `receivers`');
      }
      for (const r of data) {
        await pool.query(
          `INSERT INTO \`receivers\` (
            \`id\`, \`customer_id\`, \`name\`, \`name_ur\`, \`phone\`, \`address\`, \`city\`,
            \`province\`, \`station\`, \`country\`, \`cnic\`, \`bank_name\`, \`account_number\`,
            \`payout_method\`, \`notes\`
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
          ON DUPLICATE KEY UPDATE
            \`customer_id\`=VALUES(\`customer_id\`),
            \`name\`=VALUES(\`name\`),
            \`name_ur\`=VALUES(\`name_ur\`),
            \`phone\`=VALUES(\`phone\`),
            \`address\`=VALUES(\`address\`),
            \`city\`=VALUES(\`city\`),
            \`province\`=VALUES(\`province\`),
            \`station\`=VALUES(\`station\`),
            \`country\`=VALUES(\`country\`),
            \`cnic\`=VALUES(\`cnic\`),
            \`bank_name\`=VALUES(\`bank_name\`),
            \`account_number\`=VALUES(\`account_number\`),
            \`payout_method\`=VALUES(\`payout_method\`),
            \`notes\`=VALUES(\`notes\`)`,
          [
            r.id,
            r.customerId || r.linkedSenderId || null,
            r.name || '',
            r.nameUr || null,
            r.phone || '',
            r.address || null,
            r.city || null,
            r.province || null,
            r.station || '',
            r.country || 'Pakistan',
            r.cnic || null,
            r.bankName || null,
            r.accountNumber || null,
            r.payoutMethod || r.preferredPayoutMethod || 'Cash',
            r.notes || null
          ]
        );
      }
    } else if (key === 'pk_dubai_loans_v1' && Array.isArray(data)) {
      const loanIds = data.map((l: any) => l.id).filter(Boolean);
      if (loanIds.length > 0) {
        await pool.query('DELETE FROM `loans` WHERE `id` NOT IN (?)', [loanIds]);
        await pool.query('DELETE FROM `loan_repayments` WHERE `loan_id` NOT IN (?)', [loanIds]);
      } else {
        await pool.query('DELETE FROM `loan_repayments`');
        await pool.query('DELETE FROM `loans`');
      }
      const allRepIds: string[] = [];
      for (const l of data) {
        await pool.query(
          `INSERT INTO \`loans\` (
            \`id\`, \`loan_no\`, \`borrower_name\`, \`borrower_phone\`, \`borrower_address\`,
            \`loan_date\`, \`initial_amount\`, \`original_amount\`, \`currency\`, \`due_date\`,
            \`expected_duration\`, \`purpose\`, \`agreed_terms\`, \`total_repaid\`, \`remaining_balance\`,
            \`status\`, \`receipt_no\`, \`notes\`, \`updated_at\`
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
          ON DUPLICATE KEY UPDATE
            \`loan_no\`=VALUES(\`loan_no\`),
            \`borrower_name\`=VALUES(\`borrower_name\`),
            \`borrower_phone\`=VALUES(\`borrower_phone\`),
            \`borrower_address\`=VALUES(\`borrower_address\`),
            \`loan_date\`=VALUES(\`loan_date\`),
            \`initial_amount\`=VALUES(\`initial_amount\`),
            \`original_amount\`=VALUES(\`original_amount\`),
            \`currency\`=VALUES(\`currency\`),
            \`due_date\`=VALUES(\`due_date\`),
            \`expected_duration\`=VALUES(\`expected_duration\`),
            \`purpose\`=VALUES(\`purpose\`),
            \`agreed_terms\`=VALUES(\`agreed_terms\`),
            \`total_repaid\`=VALUES(\`total_repaid\`),
            \`remaining_balance\`=VALUES(\`remaining_balance\`),
            \`status\`=VALUES(\`status\`),
            \`receipt_no\`=VALUES(\`receipt_no\`),
            \`notes\`=VALUES(\`notes\`),
            \`updated_at\`=VALUES(\`updated_at\`)`,
          [
            l.id,
            l.loanNo || l.id,
            l.borrowerName || '',
            l.borrowerPhone || '',
            l.borrowerAddress || null,
            l.loanDate || new Date().toISOString().split('T')[0],
            Number(l.initialAmount ?? l.originalAmount ?? 0),
            Number(l.originalAmount || 0),
            l.currency || 'PKR',
            l.dueDate || l.loanDate || '',
            l.expectedDuration || '1_month',
            l.purpose || null,
            l.agreedTerms || null,
            Number(l.totalRepaid || 0),
            Number(l.remainingBalance || 0),
            l.status || 'Outstanding',
            l.receiptNo || l.loanNo || '',
            l.notes || null,
            l.updatedAt || null
          ]
        );
        if (Array.isArray(l.repayments)) {
          for (const rep of l.repayments) {
            if (rep.id) allRepIds.push(rep.id);
            await pool.query(
              `INSERT INTO \`loan_repayments\` (
                \`id\`, \`loan_id\`, \`repayment_date\`, \`entry_type\`, \`amount\`, \`currency\`,
                \`payment_method\`, \`reference_no\`, \`receipt_no\`, \`previous_balance\`,
                \`new_balance\`, \`received_by\`, \`notes\`, \`updated_at\`
              ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
              ON DUPLICATE KEY UPDATE
                \`repayment_date\`=VALUES(\`repayment_date\`),
                \`entry_type\`=VALUES(\`entry_type\`),
                \`amount\`=VALUES(\`amount\`),
                \`currency\`=VALUES(\`currency\`),
                \`payment_method\`=VALUES(\`payment_method\`),
                \`reference_no\`=VALUES(\`reference_no\`),
                \`receipt_no\`=VALUES(\`receipt_no\`),
                \`previous_balance\`=VALUES(\`previous_balance\`),
                \`new_balance\`=VALUES(\`new_balance\`),
                \`received_by\`=VALUES(\`received_by\`),
                \`notes\`=VALUES(\`notes\`),
                \`updated_at\`=VALUES(\`updated_at\`)`,
              [
                rep.id,
                l.id,
                rep.date || '',
                rep.entryType || 'repayment',
                Number(rep.amount || 0),
                rep.currency || l.currency || 'PKR',
                rep.paymentMethod || 'Cash',
                rep.referenceNo || null,
                rep.receiptNo || '',
                Number(rep.previousBalance || 0),
                Number(rep.newBalance || 0),
                rep.receivedBy || null,
                rep.notes || null,
                rep.updatedAt || null
              ]
            );
          }
        }
      }
      if (allRepIds.length > 0) {
        await pool.query('DELETE FROM `loan_repayments` WHERE `id` NOT IN (?)', [allRepIds]);
      } else {
        await pool.query('DELETE FROM `loan_repayments`');
      }
    } else if (key === 'pk_dubai_amanat_v1' && Array.isArray(data)) {
      const accIds = data.map((a: any) => a.id).filter(Boolean);
      if (accIds.length > 0) {
        await pool.query('DELETE FROM `amanat_accounts` WHERE `id` NOT IN (?)', [accIds]);
        await pool.query('DELETE FROM `amanat_entries` WHERE `account_id` NOT IN (?)', [accIds]);
      } else {
        await pool.query('DELETE FROM `amanat_entries`');
        await pool.query('DELETE FROM `amanat_accounts`');
      }
      const allAmnEntryIds: string[] = [];
      for (const acc of data) {
        await pool.query(
          `INSERT INTO \`amanat_accounts\` (
            \`id\`, \`account_no\`, \`owner_name\`, \`owner_phone\`, \`owner_address\`,
            \`city\`, \`currency\`, \`opened_date\`, \`current_balance\`, \`notes\`
          ) VALUES (?,?,?,?,?,?,?,?,?,?)
          ON DUPLICATE KEY UPDATE
            \`account_no\`=VALUES(\`account_no\`),
            \`owner_name\`=VALUES(\`owner_name\`),
            \`owner_phone\`=VALUES(\`owner_phone\`),
            \`owner_address\`=VALUES(\`owner_address\`),
            \`city\`=VALUES(\`city\`),
            \`currency\`=VALUES(\`currency\`),
            \`opened_date\`=VALUES(\`opened_date\`),
            \`current_balance\`=VALUES(\`current_balance\`),
            \`notes\`=VALUES(\`notes\`)`,
          [
            acc.id,
            acc.accountNo || acc.id,
            acc.ownerName || '',
            acc.ownerPhone || '',
            acc.ownerAddress || null,
            acc.city || null,
            acc.currency || 'PKR',
            acc.openedDate || new Date().toISOString().split('T')[0],
            Number(acc.currentBalance || 0),
            acc.notes || null
          ]
        );
        if (Array.isArray(acc.entries)) {
          for (const ent of acc.entries) {
            if (ent.id) allAmnEntryIds.push(ent.id);
            await pool.query(
              `INSERT INTO \`amanat_entries\` (
                \`id\`, \`account_id\`, \`entry_date\`, \`entry_type\`, \`amount\`, \`currency\`,
                \`description\`, \`related_person\`, \`previous_balance\`, \`new_balance\`,
                \`receipt_no\`, \`payment_method\`, \`bank_name\`, \`notes\`, \`updated_at\`
              ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
              ON DUPLICATE KEY UPDATE
                \`entry_date\`=VALUES(\`entry_date\`),
                \`entry_type\`=VALUES(\`entry_type\`),
                \`amount\`=VALUES(\`amount\`),
                \`currency\`=VALUES(\`currency\`),
                \`description\`=VALUES(\`description\`),
                \`related_person\`=VALUES(\`related_person\`),
                \`previous_balance\`=VALUES(\`previous_balance\`),
                \`new_balance\`=VALUES(\`new_balance\`),
                \`receipt_no\`=VALUES(\`receipt_no\`),
                \`payment_method\`=VALUES(\`payment_method\`),
                \`bank_name\`=VALUES(\`bank_name\`),
                \`notes\`=VALUES(\`notes\`),
                \`updated_at\`=VALUES(\`updated_at\`)`,
              [
                ent.id,
                acc.id,
                ent.date || '',
                ent.type || 'additional_deposit',
                Number(ent.amount || 0),
                ent.currency || acc.currency || 'PKR',
                ent.description || '',
                ent.relatedPerson || null,
                Number(ent.previousBalance || 0),
                Number(ent.newBalance || 0),
                ent.receiptNo || '',
                ent.paymentMethod || 'Cash',
                ent.bankName || null,
                ent.notes || null,
                ent.updatedAt || null
              ]
            );
          }
        }
      }
      if (allAmnEntryIds.length > 0) {
        await pool.query('DELETE FROM `amanat_entries` WHERE `id` NOT IN (?)', [allAmnEntryIds]);
      } else {
        await pool.query('DELETE FROM `amanat_entries`');
      }
    } else if (key === 'pk_dubai_ledger_v1' && Array.isArray(data)) {
      const ledIds = data.map((le: any) => le.id).filter(Boolean);
      if (ledIds.length > 0) {
        await pool.query('DELETE FROM `cash_ledger` WHERE `id` NOT IN (?)', [ledIds]);
      } else {
        await pool.query('DELETE FROM `cash_ledger`');
      }
      for (const le of data) {
        await pool.query(
          `INSERT INTO \`cash_ledger\` (
            \`id\`, \`entry_date\`, \`entry_type\`, \`category\`, \`amount\`, \`currency\`,
            \`reference_id\`, \`party_name\`, \`payment_method\`, \`description\`, \`notes\`, \`updated_at\`
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
          ON DUPLICATE KEY UPDATE
            \`entry_date\`=VALUES(\`entry_date\`),
            \`entry_type\`=VALUES(\`entry_type\`),
            \`category\`=VALUES(\`category\`),
            \`amount\`=VALUES(\`amount\`),
            \`currency\`=VALUES(\`currency\`),
            \`reference_id\`=VALUES(\`reference_id\`),
            \`party_name\`=VALUES(\`party_name\`),
            \`payment_method\`=VALUES(\`payment_method\`),
            \`description\`=VALUES(\`description\`),
            \`notes\`=VALUES(\`notes\`),
            \`updated_at\`=VALUES(\`updated_at\`)`,
          [
            le.id,
            le.date || '',
            le.type || 'cash_in',
            le.category || 'adjustment',
            Number(le.amount || 0),
            le.currency || 'AED',
            le.referenceId || null,
            le.partyName || null,
            le.paymentMethod || 'Cash',
            le.description || '',
            le.notes || null,
            le.updatedAt || null
          ]
        );
      }
    } else if (key === 'pk_dubai_users_v1' && Array.isArray(data)) {
      const userIds = data.map((u: any) => u.id).filter(Boolean);
      if (userIds.length > 0) {
        await pool.query('DELETE FROM `users` WHERE `id` NOT IN (?)', [userIds]);
      } else {
        await pool.query('DELETE FROM `users`');
      }
      for (const u of data) {
        await pool.query(
          `INSERT INTO \`users\` (
            \`id\`, \`username\`, \`password\`, \`full_name\`, \`full_name_ur\`,
            \`role\`, \`station_access\`, \`status\`, \`permissions_json\`, \`last_login\`, \`created_at\`
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?)
          ON DUPLICATE KEY UPDATE
            \`username\`=VALUES(\`username\`),
            \`password\`=VALUES(\`password\`),
            \`full_name\`=VALUES(\`full_name\`),
            \`full_name_ur\`=VALUES(\`full_name_ur\`),
            \`role\`=VALUES(\`role\`),
            \`station_access\`=VALUES(\`station_access\`),
            \`status\`=VALUES(\`status\`),
            \`permissions_json\`=VALUES(\`permissions_json\`),
            \`last_login\`=VALUES(\`last_login\`)`,
          [
            u.id,
            u.username,
            u.password || '',
            u.fullName || u.username,
            u.fullNameUr || u.fullName || null,
            u.role || 'cashier',
            Array.isArray(u.stationAccess) ? JSON.stringify(u.stationAccess) : (u.stationAccess || 'all'),
            u.status || 'active',
            u.permissions ? JSON.stringify(u.permissions) : null,
            u.lastLogin || null,
            u.createdAt || null
          ]
        );
      }
    } else if (key === 'pk_dubai_banks_v1' && Array.isArray(data)) {
      const bankNames = data.filter((b: any) => typeof b === 'string' && b.trim() !== '');
      if (bankNames.length > 0) {
        await pool.query('DELETE FROM `saved_banks` WHERE `bank_name` NOT IN (?)', [bankNames]);
      } else {
        await pool.query('DELETE FROM `saved_banks`');
      }
      for (const bankName of bankNames) {
        await pool.query(
          'INSERT IGNORE INTO `saved_banks` (`bank_name`) VALUES (?)',
          [bankName]
        );
      }
    }
  } catch (err) {
    console.warn(`MySQL relational table sync warning for key ${key}:`, err);
  }
}

// Authoritative in-memory store synchronized with disk & MySQL so concurrent saves never race
let memoryStore: StoreMap = readDiskStore();

async function loadAllState(): Promise<StoreMap> {
  const pool = await getMySQLPool();
  if (pool) {
    try {
      const [rows] = await pool.query('SELECT `store_key`, `store_value` FROM `app_kv_store`');
      if (Array.isArray(rows) && rows.length > 0) {
        const mysqlStore: StoreMap = {};
        for (const row of rows as Array<{ store_key: string; store_value: string }>) {
          try {
            mysqlStore[row.store_key] = JSON.parse(row.store_value);
          } catch {
            // ignore malformed entry
          }
        }
        memoryStore = mysqlStore;
        writeDiskStore(memoryStore);
        return memoryStore;
      }
    } catch (err) {
      console.error('MySQL read fallback to disk store:', err);
    }
  }

  memoryStore = readDiskStore();
  return memoryStore;
}

let serverWriteQueue: Promise<void> = Promise.resolve();

function enqueueServerWrite(task: () => Promise<void>): Promise<void> {
  const next = serverWriteQueue.then(task, task);
  serverWriteQueue = next.catch(() => undefined);
  return next;
}

async function saveKeyState(key: string, data: unknown): Promise<void> {
  return enqueueServerWrite(async () => {
    const current = readDiskStore();
    current[key] = data;
    memoryStore = current;
    writeDiskStore(memoryStore);

    const pool = await getMySQLPool();
    if (pool) {
      try {
        await pool.query(
          'INSERT INTO `app_kv_store` (`store_key`, `store_value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `store_value` = VALUES(`store_value`)',
          [key, JSON.stringify(data)]
        );
        await syncRelationalKeyToMySQL(pool, key, data);
      } catch (err) {
        console.error('MySQL save error:', err);
      }
    }
  });
}

async function saveBulkState(store: StoreMap): Promise<void> {
  return enqueueServerWrite(async () => {
    const current = readDiskStore();
    for (const [key, value] of Object.entries(store)) {
      current[key] = value;
    }
    memoryStore = current;
    writeDiskStore(memoryStore);

    const pool = await getMySQLPool();
    if (pool) {
      try {
        for (const [key, value] of Object.entries(store)) {
          await pool.query(
            'INSERT INTO `app_kv_store` (`store_key`, `store_value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `store_value` = VALUES(`store_value`)',
            [key, JSON.stringify(value)]
          );
          await syncRelationalKeyToMySQL(pool, key, value);
        }
      } catch (err) {
        console.error('MySQL bulk save error:', err);
      }
    }
  });
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));

  // API: Database & Server Persistence Health Check
  app.get('/api/db-status', async (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    try {
      const pool = await getMySQLPool();
      const diskExists = fs.existsSync(DB_FILE);
      res.json({
        ok: true,
        mysqlConnected: Boolean(pool && mysqlReady),
        mysqlDatabase: process.env.MYSQL_DATABASE || 'eagle_star_db',
        nodeDiskPersistence: true,
        diskFileReady: diskExists,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.json({
        ok: true,
        mysqlConnected: false,
        nodeDiskPersistence: true,
        timestamp: new Date().toISOString()
      });
    }
  });

  // API: Load full persisted application state
  app.get('/api/state', async (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
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
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
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
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    } catch {
      // Fallback on production hosting if NODE_ENV wasn't set to production
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get('*', (_req: Request, res: Response) => {
          res.sendFile(path.join(distPath, 'index.html'));
        });
      }
    }
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
