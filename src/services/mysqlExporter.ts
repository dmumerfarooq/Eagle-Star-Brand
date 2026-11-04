/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AppUser,
  BusinessSettings,
  Station,
  Customer,
  Receiver,
  MoneyTransfer,
  Loan,
  AmanatAccount,
  LedgerEntry
} from '../types';

function sqlVal(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') {
    return Number.isFinite(val) ? String(val) : '0';
  }
  if (typeof val === 'boolean') {
    return val ? '1' : '0';
  }
  const str = typeof val === 'string' ? val : JSON.stringify(val);
  const escaped = str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
  return `'${escaped}'`;
}

export interface FullAppStateSnapshot {
  users: AppUser[];
  settings: BusinessSettings;
  savedBanks: string[];
  stations: Station[];
  customers: Customer[];
  receivers: Receiver[];
  transfers: MoneyTransfer[];
  loans: Loan[];
  amanat: AmanatAccount[];
  ledger: LedgerEntry[];
}

export function generateMySQLDump(snapshot: FullAppStateSnapshot): string {
  const lines: string[] = [];
  const nowIso = new Date().toISOString();

  lines.push('-- ============================================================================');
  lines.push('-- EAGLE STAR BRAND (ایگل اسٹار برانڈ) - COMPLETE MYSQL DATABASE DUMP');
  lines.push(`-- Generated At: ${nowIso}`);
  lines.push('-- Target Engine: MySQL 8.0+ / MariaDB 10.5+ (UTF8MB4 Urdu & English)');
  lines.push('-- ============================================================================');
  lines.push('');
  lines.push('SET NAMES utf8mb4;');
  lines.push('SET FOREIGN_KEY_CHECKS = 0;');
  lines.push('');

  // 1. DDL Structure
  lines.push(`CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`username\` VARCHAR(120) NOT NULL,
  \`password\` VARCHAR(255) NOT NULL,
  \`full_name\` VARCHAR(150) NOT NULL,
  \`full_name_ur\` VARCHAR(200) DEFAULT NULL,
  \`role\` ENUM('super_admin', 'admin', 'manager', 'cashier', 'operator') NOT NULL DEFAULT 'cashier',
  \`station_access\` VARCHAR(120) NOT NULL DEFAULT 'all',
  \`status\` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  \`permissions_json\` JSON DEFAULT NULL,
  \`last_login\` VARCHAR(64) DEFAULT NULL,
  \`created_at\` VARCHAR(64) DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_users_username\` (\`username\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  lines.push(`CREATE TABLE IF NOT EXISTS \`business_settings\` (
  \`id\` INT NOT NULL DEFAULT 1,
  \`business_name_en\` VARCHAR(200) NOT NULL DEFAULT 'Eagle Star Brand',
  \`business_name_ur\` VARCHAR(200) NOT NULL DEFAULT 'ایگل اسٹار برانڈ',
  \`branch_en\` VARCHAR(200) DEFAULT NULL,
  \`branch_ur\` VARCHAR(200) DEFAULT NULL,
  \`address_en\` VARCHAR(300) DEFAULT NULL,
  \`address_ur\` VARCHAR(300) DEFAULT NULL,
  \`phone_en\` VARCHAR(60) DEFAULT NULL,
  \`phone_ur\` VARCHAR(60) DEFAULT NULL,
  \`whatsapp\` VARCHAR(60) DEFAULT NULL,
  \`email\` VARCHAR(150) DEFAULT NULL,
  \`default_exchange_rate\` DECIMAL(12, 2) NOT NULL DEFAULT 77.50,
  \`manual_rate_updated_at\` VARCHAR(64) DEFAULT NULL,
  \`manual_rate_updated_by\` VARCHAR(150) DEFAULT NULL,
  \`default_commission_pct\` DECIMAL(8, 2) NOT NULL DEFAULT 1.00,
  \`commission_base\` ENUM('AED', 'PKR') NOT NULL DEFAULT 'AED',
  \`receipt_prefix\` VARCHAR(32) NOT NULL DEFAULT 'REC',
  \`order_number_prefix\` VARCHAR(32) NOT NULL DEFAULT '109',
  \`default_language\` ENUM('en', 'ur') NOT NULL DEFAULT 'en',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  lines.push(`CREATE TABLE IF NOT EXISTS \`saved_banks\` (
  \`id\` INT NOT NULL AUTO_INCREMENT,
  \`bank_name\` VARCHAR(180) NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uk_saved_banks_name\` (\`bank_name\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  lines.push(`CREATE TABLE IF NOT EXISTS \`stations\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`code\` VARCHAR(32) NOT NULL,
  \`name_ur\` VARCHAR(150) NOT NULL,
  \`name_en\` VARCHAR(150) NOT NULL,
  \`city\` VARCHAR(120) DEFAULT NULL,
  \`category\` ENUM('counter', 'wallet', 'bank', 'branch') NOT NULL DEFAULT 'counter',
  \`in_charge\` VARCHAR(150) DEFAULT NULL,
  \`phone\` VARCHAR(60) DEFAULT NULL,
  \`address\` VARCHAR(300) DEFAULT NULL,
  \`status\` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  \`current_balance_pkr\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  \`notes\` TEXT DEFAULT NULL,
  \`created_at\` VARCHAR(64) DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  lines.push(`CREATE TABLE IF NOT EXISTS \`station_ledger_entries\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`station_id\` VARCHAR(64) NOT NULL,
  \`station_name_ur\` VARCHAR(150) NOT NULL,
  \`entry_date\` VARCHAR(32) NOT NULL,
  \`entry_time\` VARCHAR(32) DEFAULT NULL,
  \`tx_type\` ENUM('deposit_topup', 'transfer_payout', 'settlement_repayment', 'adjustment') NOT NULL DEFAULT 'deposit_topup',
  \`amount_pkr\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
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
  PRIMARY KEY (\`id\`),
  KEY \`idx_st_ledger_station\` (\`station_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  lines.push(`CREATE TABLE IF NOT EXISTS \`customers\` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  lines.push(`CREATE TABLE IF NOT EXISTS \`receivers\` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  lines.push(`CREATE TABLE IF NOT EXISTS \`money_transfers\` (
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
  \`amount_aed\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  \`exchange_rate\` DECIMAL(12, 2) NOT NULL DEFAULT 77.50,
  \`amount_pkr\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  \`commission_type\` ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
  \`commission_rate\` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  \`commission_base\` ENUM('AED', 'PKR') NOT NULL DEFAULT 'AED',
  \`commission_amount\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  \`additional_charges\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  \`total_collected_aed\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  \`net_payable_pkr\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  \`amount_paid_pkr\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  \`remaining_balance_pkr\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  \`station_balance_deducted\` TINYINT(1) NOT NULL DEFAULT 0,
  \`station_previous_balance_pkr\` DECIMAL(16, 2) DEFAULT NULL,
  \`station_new_balance_pkr\` DECIMAL(16, 2) DEFAULT NULL,
  \`status\` ENUM('Draft', 'Received', 'Partially Paid', 'Paid', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Received',
  \`notes\` TEXT DEFAULT NULL,
  \`created_at\` VARCHAR(64) DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  lines.push(`CREATE TABLE IF NOT EXISTS \`transfer_payouts\` (
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
  PRIMARY KEY (\`id\`),
  KEY \`idx_payouts_transfer\` (\`transfer_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  lines.push(`CREATE TABLE IF NOT EXISTS \`loans\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`loan_no\` VARCHAR(64) NOT NULL,
  \`borrower_name\` VARCHAR(180) NOT NULL,
  \`borrower_phone\` VARCHAR(60) NOT NULL,
  \`borrower_address\` VARCHAR(300) DEFAULT NULL,
  \`loan_date\` VARCHAR(32) NOT NULL,
  \`original_amount\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  \`currency\` ENUM('AED', 'PKR') NOT NULL DEFAULT 'AED',
  \`due_date\` VARCHAR(32) NOT NULL,
  \`expected_duration\` VARCHAR(32) NOT NULL DEFAULT '1_month',
  \`purpose\` VARCHAR(300) DEFAULT NULL,
  \`agreed_terms\` TEXT DEFAULT NULL,
  \`total_repaid\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  \`remaining_balance\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  \`status\` ENUM('Outstanding', 'Partially Repaid', 'Fully Repaid', 'Overdue', 'Adjusted') NOT NULL DEFAULT 'Outstanding',
  \`receipt_no\` VARCHAR(64) NOT NULL,
  \`notes\` TEXT DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  lines.push(`CREATE TABLE IF NOT EXISTS \`loan_repayments\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`loan_id\` VARCHAR(64) NOT NULL,
  \`repayment_date\` VARCHAR(32) NOT NULL,
  \`amount\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  \`currency\` ENUM('AED', 'PKR') NOT NULL DEFAULT 'AED',
  \`payment_method\` VARCHAR(64) NOT NULL DEFAULT 'Cash',
  \`reference_no\` VARCHAR(100) DEFAULT NULL,
  \`receipt_no\` VARCHAR(64) NOT NULL,
  \`notes\` TEXT DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_repayments_loan\` (\`loan_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  lines.push(`CREATE TABLE IF NOT EXISTS \`amanat_accounts\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`account_no\` VARCHAR(64) NOT NULL,
  \`owner_name\` VARCHAR(180) NOT NULL,
  \`owner_phone\` VARCHAR(60) NOT NULL,
  \`owner_address\` VARCHAR(300) DEFAULT NULL,
  \`city\` VARCHAR(120) DEFAULT NULL,
  \`currency\` ENUM('AED', 'PKR') NOT NULL DEFAULT 'PKR',
  \`opened_date\` VARCHAR(32) NOT NULL,
  \`current_balance\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  \`notes\` TEXT DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  lines.push(`CREATE TABLE IF NOT EXISTS \`amanat_entries\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`account_id\` VARCHAR(64) NOT NULL,
  \`entry_date\` VARCHAR(32) NOT NULL,
  \`entry_type\` ENUM('initial_deposit', 'additional_deposit', 'partial_withdrawal', 'full_withdrawal', 'third_party_payment', 'returned_to_owner', 'adjustment') NOT NULL,
  \`amount\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  \`currency\` ENUM('AED', 'PKR') NOT NULL DEFAULT 'PKR',
  \`description\` TEXT NOT NULL,
  \`related_person\` VARCHAR(180) DEFAULT NULL,
  \`previous_balance\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  \`new_balance\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  \`receipt_no\` VARCHAR(64) NOT NULL,
  \`payment_method\` VARCHAR(64) DEFAULT 'Cash',
  \`bank_name\` VARCHAR(180) DEFAULT NULL,
  \`notes\` TEXT DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_amanat_entries_account\` (\`account_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  lines.push(`CREATE TABLE IF NOT EXISTS \`cash_ledger\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`entry_date\` VARCHAR(32) NOT NULL,
  \`entry_type\` ENUM('cash_in', 'cash_out') NOT NULL,
  \`category\` VARCHAR(64) NOT NULL,
  \`amount\` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  \`currency\` ENUM('AED', 'PKR') NOT NULL DEFAULT 'PKR',
  \`reference_id\` VARCHAR(100) DEFAULT NULL,
  \`party_name\` VARCHAR(180) DEFAULT NULL,
  \`payment_method\` VARCHAR(64) NOT NULL DEFAULT 'Cash',
  \`description\` TEXT NOT NULL,
  \`notes\` TEXT DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  lines.push(`CREATE TABLE IF NOT EXISTS \`app_kv_store\` (
  \`store_key\` VARCHAR(64) NOT NULL,
  \`store_value\` LONGTEXT NOT NULL,
  \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`store_key\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  // 2. DATA INSERTS
  // Users
  if (snapshot.users && snapshot.users.length > 0) {
    lines.push('-- --------------------------------------------------------');
    lines.push('-- DATA: users');
    lines.push('-- --------------------------------------------------------');
    for (const u of snapshot.users) {
      lines.push(
        `INSERT INTO \`users\` (\`id\`, \`username\`, \`password\`, \`full_name\`, \`full_name_ur\`, \`role\`, \`station_access\`, \`status\`, \`permissions_json\`, \`last_login\`, \`created_at\`) VALUES (${sqlVal(u.id)}, ${sqlVal(u.username)}, ${sqlVal(u.password || '')}, ${sqlVal(u.fullName)}, ${sqlVal(u.fullNameUr)}, ${sqlVal(u.role)}, ${sqlVal(u.stationAccess)}, ${sqlVal(u.status)}, ${sqlVal(u.permissions ? JSON.stringify(u.permissions) : null)}, ${sqlVal(u.lastLogin)}, ${sqlVal(u.createdAt)}) ON DUPLICATE KEY UPDATE \`password\`=VALUES(\`password\`), \`full_name\`=VALUES(\`full_name\`), \`full_name_ur\`=VALUES(\`full_name_ur\`), \`role\`=VALUES(\`role\`), \`station_access\`=VALUES(\`station_access\`), \`status\`=VALUES(\`status\`), \`permissions_json\`=VALUES(\`permissions_json\`), \`last_login\`=VALUES(\`last_login\`);`
      );
    }
    lines.push('');
  }

  // Business Settings
  if (snapshot.settings) {
    const s = snapshot.settings;
    lines.push('-- --------------------------------------------------------');
    lines.push('-- DATA: business_settings');
    lines.push('-- --------------------------------------------------------');
    lines.push(
      `INSERT INTO \`business_settings\` (\`id\`, \`business_name_en\`, \`business_name_ur\`, \`branch_en\`, \`branch_ur\`, \`address_en\`, \`address_ur\`, \`phone_en\`, \`phone_ur\`, \`whatsapp\`, \`email\`, \`default_exchange_rate\`, \`manual_rate_updated_at\`, \`manual_rate_updated_by\`, \`default_commission_pct\`, \`commission_base\`, \`receipt_prefix\`, \`order_number_prefix\`, \`default_language\`, \`receipt_footer_en\`, \`receipt_footer_ur\`, \`receipt_footer_cash_jamah_ur\`, \`receipt_footer_cash_jamah_en\`, \`receipt_footer_deposit_ur\`, \`receipt_footer_deposit_en\`, \`receipt_footer_loan_ur\`, \`receipt_footer_loan_en\`, \`custom_logo_url\`) VALUES (1, ${sqlVal(s.businessNameEn)}, ${sqlVal(s.businessNameUr)}, ${sqlVal(s.branchEn)}, ${sqlVal(s.branchUr)}, ${sqlVal(s.addressEn)}, ${sqlVal(s.addressUr)}, ${sqlVal(s.phoneEn)}, ${sqlVal(s.phoneUr)}, ${sqlVal(s.whatsapp)}, ${sqlVal(s.email)}, ${sqlVal(s.defaultExchangeRate)}, ${sqlVal(s.manualRateUpdatedAt)}, ${sqlVal(s.manualRateUpdatedBy)}, ${sqlVal(s.defaultCommissionPct)}, ${sqlVal(s.commissionBase)}, ${sqlVal(s.receiptPrefix)}, ${sqlVal(s.orderNumberPrefix)}, ${sqlVal(s.defaultLanguage)}, ${sqlVal(s.receiptFooterEn)}, ${sqlVal(s.receiptFooterUr)}, ${sqlVal(s.receiptFooterCashJamahUr)}, ${sqlVal(s.receiptFooterCashJamahEn)}, ${sqlVal(s.receiptFooterDepositUr)}, ${sqlVal(s.receiptFooterDepositEn)}, ${sqlVal(s.receiptFooterLoanUr)}, ${sqlVal(s.receiptFooterLoanEn)}, ${sqlVal(s.customLogoUrl)}) ON DUPLICATE KEY UPDATE \`business_name_en\`=VALUES(\`business_name_en\`), \`business_name_ur\`=VALUES(\`business_name_ur\`), \`default_exchange_rate\`=VALUES(\`default_exchange_rate\`), \`manual_rate_updated_at\`=VALUES(\`manual_rate_updated_at\`), \`manual_rate_updated_by\`=VALUES(\`manual_rate_updated_by\`), \`default_commission_pct\`=VALUES(\`default_commission_pct\`), \`custom_logo_url\`=VALUES(\`custom_logo_url\`);`
    );
    lines.push('');
  }

  // Saved Banks
  if (snapshot.savedBanks && snapshot.savedBanks.length > 0) {
    lines.push('-- --------------------------------------------------------');
    lines.push('-- DATA: saved_banks');
    lines.push('-- --------------------------------------------------------');
    for (const bank of snapshot.savedBanks) {
      lines.push(
        `INSERT INTO \`saved_banks\` (\`bank_name\`) VALUES (${sqlVal(bank)}) ON DUPLICATE KEY UPDATE \`bank_name\`=VALUES(\`bank_name\`);`
      );
    }
    lines.push('');
  }

  // Stations & Station Ledger Entries
  if (snapshot.stations && snapshot.stations.length > 0) {
    lines.push('-- --------------------------------------------------------');
    lines.push('-- DATA: stations & station_ledger_entries');
    lines.push('-- --------------------------------------------------------');
    for (const st of snapshot.stations) {
      lines.push(
        `INSERT INTO \`stations\` (\`id\`, \`code\`, \`name_ur\`, \`name_en\`, \`city\`, \`category\`, \`in_charge\`, \`phone\`, \`address\`, \`status\`, \`current_balance_pkr\`, \`notes\`, \`created_at\`) VALUES (${sqlVal(st.id)}, ${sqlVal(st.code)}, ${sqlVal(st.nameUr)}, ${sqlVal(st.nameEn)}, ${sqlVal(st.city)}, ${sqlVal(st.category)}, ${sqlVal(st.inCharge)}, ${sqlVal(st.phone)}, ${sqlVal(st.address)}, ${sqlVal(st.status)}, ${sqlVal(st.currentBalancePKR)}, ${sqlVal(st.notes)}, ${sqlVal(st.createdAt)}) ON DUPLICATE KEY UPDATE \`name_ur\`=VALUES(\`name_ur\`), \`name_en\`=VALUES(\`name_en\`), \`status\`=VALUES(\`status\`), \`current_balance_pkr\`=VALUES(\`current_balance_pkr\`);`
      );
      if (st.entries && st.entries.length > 0) {
        for (const e of st.entries) {
          lines.push(
            `INSERT INTO \`station_ledger_entries\` (\`id\`, \`station_id\`, \`station_name_ur\`, \`entry_date\`, \`entry_time\`, \`tx_type\`, \`amount_pkr\`, \`payment_method\`, \`bank_name\`, \`account_number\`, \`reference_no\`, \`related_party\`, \`previous_balance_pkr\`, \`new_balance_pkr\`, \`description\`, \`notes\`, \`receipt_no\`, \`created_at\`) VALUES (${sqlVal(e.id)}, ${sqlVal(st.id)}, ${sqlVal(e.stationNameUr || st.nameUr)}, ${sqlVal(e.date)}, ${sqlVal(e.time)}, ${sqlVal(e.type)}, ${sqlVal(e.amountPKR)}, ${sqlVal(e.paymentMethod)}, ${sqlVal(e.bankName)}, ${sqlVal(e.accountNumber)}, ${sqlVal(e.referenceNo)}, ${sqlVal(e.relatedParty)}, ${sqlVal(e.previousBalancePKR)}, ${sqlVal(e.newBalancePKR)}, ${sqlVal(e.description)}, ${sqlVal(e.notes)}, ${sqlVal(e.receiptNo)}, ${sqlVal(e.createdAt)}) ON DUPLICATE KEY UPDATE \`amount_pkr\`=VALUES(\`amount_pkr\`), \`payment_method\`=VALUES(\`payment_method\`), \`bank_name\`=VALUES(\`bank_name\`), \`previous_balance_pkr\`=VALUES(\`previous_balance_pkr\`), \`new_balance_pkr\`=VALUES(\`new_balance_pkr\`), \`description\`=VALUES(\`description\`);`
          );
        }
      }
    }
    lines.push('');
  }

  // Customers
  if (snapshot.customers && snapshot.customers.length > 0) {
    lines.push('-- --------------------------------------------------------');
    lines.push('-- DATA: customers');
    lines.push('-- --------------------------------------------------------');
    for (const c of snapshot.customers) {
      lines.push(
        `INSERT INTO \`customers\` (\`id\`, \`customer_code\`, \`name\`, \`name_ur\`, \`phone\`, \`secondary_phone\`, \`address\`, \`city\`, \`country\`, \`date_added\`, \`notes\`) VALUES (${sqlVal(c.id)}, ${sqlVal(c.customerCode)}, ${sqlVal(c.name)}, ${sqlVal(c.nameUr)}, ${sqlVal(c.phone)}, ${sqlVal(c.secondaryPhone)}, ${sqlVal(c.address)}, ${sqlVal(c.city)}, ${sqlVal(c.country)}, ${sqlVal(c.dateAdded)}, ${sqlVal(c.notes)}) ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`), \`phone\`=VALUES(\`phone\`), \`address\`=VALUES(\`address\`), \`city\`=VALUES(\`city\`), \`notes\`=VALUES(\`notes\`);`
      );
    }
    lines.push('');
  }

  // Receivers
  if (snapshot.receivers && snapshot.receivers.length > 0) {
    lines.push('-- --------------------------------------------------------');
    lines.push('-- DATA: receivers');
    lines.push('-- --------------------------------------------------------');
    for (const r of snapshot.receivers) {
      lines.push(
        `INSERT INTO \`receivers\` (\`id\`, \`customer_id\`, \`name\`, \`name_ur\`, \`phone\`, \`address\`, \`city\`, \`province\`, \`station\`, \`country\`, \`cnic\`, \`bank_name\`, \`account_number\`, \`payout_method\`, \`notes\`) VALUES (${sqlVal(r.id)}, ${sqlVal(r.customerId)}, ${sqlVal(r.name)}, ${sqlVal(r.nameUr)}, ${sqlVal(r.phone)}, ${sqlVal(r.address)}, ${sqlVal(r.city)}, ${sqlVal(r.province)}, ${sqlVal(r.station)}, ${sqlVal(r.country)}, ${sqlVal(r.cnic)}, ${sqlVal(r.bankName)}, ${sqlVal(r.accountNumber)}, ${sqlVal(r.payoutMethod)}, ${sqlVal(r.notes)}) ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`), \`phone\`=VALUES(\`phone\`), \`station\`=VALUES(\`station\`), \`bank_name\`=VALUES(\`bank_name\`), \`account_number\`=VALUES(\`account_number\`);`
      );
    }
    lines.push('');
  }

  // Money Transfers & Payouts
  if (snapshot.transfers && snapshot.transfers.length > 0) {
    lines.push('-- --------------------------------------------------------');
    lines.push('-- DATA: money_transfers & transfer_payouts');
    lines.push('-- --------------------------------------------------------');
    for (const tr of snapshot.transfers) {
      lines.push(
        `INSERT INTO \`money_transfers\` (\`id\`, \`order_number\`, \`receipt_number\`, \`transfer_date\`, \`transfer_time\`, \`sender_id\`, \`sender_name\`, \`sender_phone\`, \`sender_city\`, \`sender_country\`, \`receiver_id\`, \`receiver_name\`, \`receiver_phone\`, \`receiver_address\`, \`receiver_city\`, \`receiver_cnic\`, \`station\`, \`payout_method\`, \`bank_name\`, \`account_number\`, \`amount_aed\`, \`exchange_rate\`, \`amount_pkr\`, \`commission_type\`, \`commission_rate\`, \`commission_base\`, \`commission_amount\`, \`additional_charges\`, \`total_collected_aed\`, \`net_payable_pkr\`, \`amount_paid_pkr\`, \`remaining_balance_pkr\`, \`station_balance_deducted\`, \`station_previous_balance_pkr\`, \`station_new_balance_pkr\`, \`status\`, \`notes\`, \`created_at\`) VALUES (${sqlVal(tr.id)}, ${sqlVal(tr.orderNumber)}, ${sqlVal(tr.receiptNumber)}, ${sqlVal(tr.date)}, ${sqlVal(tr.time)}, ${sqlVal(tr.senderId)}, ${sqlVal(tr.senderName)}, ${sqlVal(tr.senderPhone)}, ${sqlVal(tr.senderCity)}, ${sqlVal(tr.senderCountry)}, ${sqlVal(tr.receiverId)}, ${sqlVal(tr.receiverName)}, ${sqlVal(tr.receiverPhone)}, ${sqlVal(tr.receiverAddress)}, ${sqlVal(tr.receiverCity)}, ${sqlVal(tr.receiverCnic)}, ${sqlVal(tr.station)}, ${sqlVal(tr.payoutMethod)}, ${sqlVal(tr.bankName)}, ${sqlVal(tr.accountNumber)}, ${sqlVal(tr.amountAED)}, ${sqlVal(tr.exchangeRate)}, ${sqlVal(tr.amountPKR)}, ${sqlVal(tr.commissionType)}, ${sqlVal(tr.commissionRate)}, ${sqlVal(tr.commissionBase)}, ${sqlVal(tr.commissionAmount)}, ${sqlVal(tr.additionalCharges)}, ${sqlVal(tr.totalCollectedAED)}, ${sqlVal(tr.netPayablePKR)}, ${sqlVal(tr.amountPaidPKR)}, ${sqlVal(tr.remainingBalancePKR)}, ${sqlVal(Boolean(tr.stationBalanceDeducted))}, ${sqlVal(tr.stationPreviousBalancePKR)}, ${sqlVal(tr.stationNewBalancePKR)}, ${sqlVal(tr.status)}, ${sqlVal(tr.notes)}, ${sqlVal(tr.createdAt)}) ON DUPLICATE KEY UPDATE \`amount_aed\`=VALUES(\`amount_aed\`), \`exchange_rate\`=VALUES(\`exchange_rate\`), \`net_payable_pkr\`=VALUES(\`net_payable_pkr\`), \`amount_paid_pkr\`=VALUES(\`amount_paid_pkr\`), \`remaining_balance_pkr\`=VALUES(\`remaining_balance_pkr\`), \`status\`=VALUES(\`status\`);`
      );
      if (tr.payouts && tr.payouts.length > 0) {
        for (const p of tr.payouts) {
          lines.push(
            `INSERT INTO \`transfer_payouts\` (\`id\`, \`transfer_id\`, \`payout_date\`, \`receiver_name\`, \`amount_pkr\`, \`payment_method\`, \`reference_no\`, \`station\`, \`receipt_no\`, \`notes\`) VALUES (${sqlVal(p.id)}, ${sqlVal(tr.id)}, ${sqlVal(p.date)}, ${sqlVal(p.receiverName)}, ${sqlVal(p.amountPKR)}, ${sqlVal(p.paymentMethod)}, ${sqlVal(p.referenceNo)}, ${sqlVal(p.station)}, ${sqlVal(p.receiptNo)}, ${sqlVal(p.notes)}) ON DUPLICATE KEY UPDATE \`amount_pkr\`=VALUES(\`amount_pkr\`);`
          );
        }
      }
    }
    lines.push('');
  }

  // Loans & Repayments
  if (snapshot.loans && snapshot.loans.length > 0) {
    lines.push('-- --------------------------------------------------------');
    lines.push('-- DATA: loans & loan_repayments');
    lines.push('-- --------------------------------------------------------');
    for (const ln of snapshot.loans) {
      lines.push(
        `INSERT INTO \`loans\` (\`id\`, \`loan_no\`, \`borrower_name\`, \`borrower_phone\`, \`borrower_address\`, \`loan_date\`, \`original_amount\`, \`currency\`, \`due_date\`, \`expected_duration\`, \`purpose\`, \`agreed_terms\`, \`total_repaid\`, \`remaining_balance\`, \`status\`, \`receipt_no\`, \`notes\`) VALUES (${sqlVal(ln.id)}, ${sqlVal(ln.loanNo)}, ${sqlVal(ln.borrowerName)}, ${sqlVal(ln.borrowerPhone)}, ${sqlVal(ln.borrowerAddress)}, ${sqlVal(ln.loanDate)}, ${sqlVal(ln.originalAmount)}, ${sqlVal(ln.currency)}, ${sqlVal(ln.dueDate)}, ${sqlVal(ln.expectedDuration)}, ${sqlVal(ln.purpose)}, ${sqlVal(ln.agreedTerms)}, ${sqlVal(ln.totalRepaid)}, ${sqlVal(ln.remainingBalance)}, ${sqlVal(ln.status)}, ${sqlVal(ln.receiptNo)}, ${sqlVal(ln.notes)}) ON DUPLICATE KEY UPDATE \`total_repaid\`=VALUES(\`total_repaid\`), \`remaining_balance\`=VALUES(\`remaining_balance\`), \`status\`=VALUES(\`status\`);`
      );
      if (ln.repayments && ln.repayments.length > 0) {
        for (const rp of ln.repayments) {
          lines.push(
            `INSERT INTO \`loan_repayments\` (\`id\`, \`loan_id\`, \`repayment_date\`, \`amount\`, \`currency\`, \`payment_method\`, \`reference_no\`, \`receipt_no\`, \`notes\`) VALUES (${sqlVal(rp.id)}, ${sqlVal(ln.id)}, ${sqlVal(rp.date)}, ${sqlVal(rp.amount)}, ${sqlVal(rp.currency)}, ${sqlVal(rp.paymentMethod)}, ${sqlVal(rp.referenceNo)}, ${sqlVal(rp.receiptNo)}, ${sqlVal(rp.notes)}) ON DUPLICATE KEY UPDATE \`amount\`=VALUES(\`amount\`);`
          );
        }
      }
    }
    lines.push('');
  }

  // Amanat Accounts & Entries
  if (snapshot.amanat && snapshot.amanat.length > 0) {
    lines.push('-- --------------------------------------------------------');
    lines.push('-- DATA: amanat_accounts & amanat_entries');
    lines.push('-- --------------------------------------------------------');
    for (const acc of snapshot.amanat) {
      lines.push(
        `INSERT INTO \`amanat_accounts\` (\`id\`, \`account_no\`, \`owner_name\`, \`owner_phone\`, \`owner_address\`, \`city\`, \`currency\`, \`opened_date\`, \`current_balance\`, \`notes\`) VALUES (${sqlVal(acc.id)}, ${sqlVal(acc.accountNo)}, ${sqlVal(acc.ownerName)}, ${sqlVal(acc.ownerPhone)}, ${sqlVal(acc.ownerAddress)}, ${sqlVal(acc.city)}, ${sqlVal(acc.currency)}, ${sqlVal(acc.openedDate)}, ${sqlVal(acc.currentBalance)}, ${sqlVal(acc.notes)}) ON DUPLICATE KEY UPDATE \`current_balance\`=VALUES(\`current_balance\`), \`notes\`=VALUES(\`notes\`);`
      );
      if (acc.entries && acc.entries.length > 0) {
        for (const en of acc.entries) {
          lines.push(
            `INSERT INTO \`amanat_entries\` (\`id\`, \`account_id\`, \`entry_date\`, \`entry_type\`, \`amount\`, \`currency\`, \`description\`, \`related_person\`, \`previous_balance\`, \`new_balance\`, \`receipt_no\`, \`payment_method\`, \`bank_name\`, \`notes\`) VALUES (${sqlVal(en.id)}, ${sqlVal(acc.id)}, ${sqlVal(en.date)}, ${sqlVal(en.type)}, ${sqlVal(en.amount)}, ${sqlVal(en.currency)}, ${sqlVal(en.description)}, ${sqlVal(en.relatedPerson)}, ${sqlVal(en.previousBalance)}, ${sqlVal(en.newBalance)}, ${sqlVal(en.receiptNo)}, ${sqlVal(en.paymentMethod)}, ${sqlVal(en.bankName)}, ${sqlVal(en.notes)}) ON DUPLICATE KEY UPDATE \`amount\`=VALUES(\`amount\`), \`new_balance\`=VALUES(\`new_balance\`);`
          );
        }
      }
    }
    lines.push('');
  }

  // Cash Ledger
  if (snapshot.ledger && snapshot.ledger.length > 0) {
    lines.push('-- --------------------------------------------------------');
    lines.push('-- DATA: cash_ledger');
    lines.push('-- --------------------------------------------------------');
    for (const led of snapshot.ledger) {
      lines.push(
        `INSERT INTO \`cash_ledger\` (\`id\`, \`entry_date\`, \`entry_type\`, \`category\`, \`amount\`, \`currency\`, \`reference_id\`, \`party_name\`, \`payment_method\`, \`description\`, \`notes\`) VALUES (${sqlVal(led.id)}, ${sqlVal(led.date)}, ${sqlVal(led.type)}, ${sqlVal(led.category)}, ${sqlVal(led.amount)}, ${sqlVal(led.currency)}, ${sqlVal(led.referenceId)}, ${sqlVal(led.partyName)}, ${sqlVal(led.paymentMethod)}, ${sqlVal(led.description)}, ${sqlVal(led.notes)}) ON DUPLICATE KEY UPDATE \`amount\`=VALUES(\`amount\`), \`description\`=VALUES(\`description\`);`
      );
    }
    lines.push('');
  }

  // App KV Store (for instant Node.js state sync)
  lines.push('-- --------------------------------------------------------');
  lines.push('-- DATA: app_kv_store');
  lines.push('-- --------------------------------------------------------');
  const kvPairs: Array<[string, unknown]> = [
    ['pk_dubai_users_v1', snapshot.users],
    ['pk_dubai_settings_v1', snapshot.settings],
    ['pk_dubai_banks_v1', snapshot.savedBanks],
    ['pk_dubai_stations_v1', snapshot.stations],
    ['pk_dubai_customers_v1', snapshot.customers],
    ['pk_dubai_receivers_v1', snapshot.receivers],
    ['pk_dubai_transfers_v1', snapshot.transfers],
    ['pk_dubai_loans_v1', snapshot.loans],
    ['pk_dubai_amanat_v1', snapshot.amanat],
    ['pk_dubai_ledger_v1', snapshot.ledger]
  ];
  for (const [k, v] of kvPairs) {
    lines.push(
      `INSERT INTO \`app_kv_store\` (\`store_key\`, \`store_value\`) VALUES (${sqlVal(k)}, ${sqlVal(JSON.stringify(v))}) ON DUPLICATE KEY UPDATE \`store_value\`=VALUES(\`store_value\`);`
    );
  }

  lines.push('');
  lines.push('SET FOREIGN_KEY_CHECKS = 1;');
  return lines.join('\n');
}
