-- ============================================================================
-- EAGLE STAR BRAND (ایگل اسٹار برانڈ)
-- Complete MySQL 8.0+ / MariaDB 10.5+ Relational Database Schema
-- Money Transfer, Station Ledger, Cash Jama (Amanat) & Khata System
-- Designed & Developed by Burraq Digits
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `eagle_star_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `eagle_star_db`;

-- ----------------------------------------------------------------------------
-- 1. USERS & ROLE-BASED ACCESS CONTROL (RBAC)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL,
  `username` VARCHAR(120) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `full_name_ur` VARCHAR(200) DEFAULT NULL,
  `role` ENUM('super_admin', 'admin', 'manager', 'cashier', 'operator') NOT NULL DEFAULT 'cashier',
  `station_access` VARCHAR(120) NOT NULL DEFAULT 'all',
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `permissions_json` JSON DEFAULT NULL,
  `last_login` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. BUSINESS SETTINGS & MANUAL AED EXCHANGE RATE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `business_settings` (
  `id` INT NOT NULL DEFAULT 1,
  `business_name_en` VARCHAR(200) NOT NULL DEFAULT 'Eagle Star Brand',
  `business_name_ur` VARCHAR(200) NOT NULL DEFAULT 'ایگل اسٹار برانڈ',
  `branch_en` VARCHAR(200) DEFAULT NULL,
  `branch_ur` VARCHAR(200) DEFAULT NULL,
  `address_en` VARCHAR(300) DEFAULT NULL,
  `address_ur` VARCHAR(300) DEFAULT NULL,
  `phone_en` VARCHAR(60) DEFAULT NULL,
  `phone_ur` VARCHAR(60) DEFAULT NULL,
  `whatsapp` VARCHAR(60) DEFAULT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `default_exchange_rate` DECIMAL(12, 2) NOT NULL DEFAULT 77.50,
  `manual_rate_updated_at` VARCHAR(64) DEFAULT NULL,
  `manual_rate_updated_by` VARCHAR(150) DEFAULT NULL,
  `default_commission_pct` DECIMAL(8, 2) NOT NULL DEFAULT 1.00,
  `commission_base` ENUM('AED', 'PKR') NOT NULL DEFAULT 'AED',
  `receipt_prefix` VARCHAR(32) NOT NULL DEFAULT 'REC',
  `order_number_prefix` VARCHAR(32) NOT NULL DEFAULT '109',
  `default_language` ENUM('en', 'ur') NOT NULL DEFAULT 'en',
  `receipt_footer_en` TEXT DEFAULT NULL,
  `receipt_footer_ur` TEXT DEFAULT NULL,
  `receipt_footer_cash_jamah_ur` TEXT DEFAULT NULL,
  `receipt_footer_cash_jamah_en` TEXT DEFAULT NULL,
  `receipt_footer_deposit_ur` TEXT DEFAULT NULL,
  `receipt_footer_deposit_en` TEXT DEFAULT NULL,
  `receipt_footer_loan_ur` TEXT DEFAULT NULL,
  `receipt_footer_loan_en` TEXT DEFAULT NULL,
  `custom_logo_url` LONGTEXT DEFAULT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. SAVED BANKS & WALLET CHANNELS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `saved_banks` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `bank_name` VARCHAR(180) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_saved_banks_name` (`bank_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. STATIONS / PAYOUT COUNTERS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stations` (
  `id` VARCHAR(64) NOT NULL,
  `code` VARCHAR(32) NOT NULL,
  `name_ur` VARCHAR(150) NOT NULL,
  `name_en` VARCHAR(150) NOT NULL,
  `city` VARCHAR(120) DEFAULT NULL,
  `category` ENUM('counter', 'wallet', 'bank', 'branch') NOT NULL DEFAULT 'counter',
  `in_charge` VARCHAR(150) DEFAULT NULL,
  `phone` VARCHAR(60) DEFAULT NULL,
  `address` VARCHAR(300) DEFAULT NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `current_balance_pkr` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `notes` TEXT DEFAULT NULL,
  `created_at` VARCHAR(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_stations_code` (`code`),
  KEY `idx_stations_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. STATION LEDGER ENTRIES (DEPOSITS, TOP-UPS & PAYOUT DEDUCTIONS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `station_ledger_entries` (
  `id` VARCHAR(64) NOT NULL,
  `station_id` VARCHAR(64) NOT NULL,
  `station_name_ur` VARCHAR(150) NOT NULL,
  `entry_date` VARCHAR(32) NOT NULL,
  `entry_time` VARCHAR(32) DEFAULT NULL,
  `tx_type` ENUM('deposit_topup', 'transfer_payout', 'settlement_repayment', 'adjustment') NOT NULL DEFAULT 'deposit_topup',
  `amount_pkr` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `payment_method` VARCHAR(64) DEFAULT 'Bank Transfer',
  `bank_name` VARCHAR(180) DEFAULT NULL,
  `account_number` VARCHAR(120) DEFAULT NULL,
  `reference_no` VARCHAR(100) DEFAULT NULL,
  `related_party` VARCHAR(200) DEFAULT NULL,
  `previous_balance_pkr` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `new_balance_pkr` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `description` TEXT NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `receipt_no` VARCHAR(64) NOT NULL,
  `created_at` VARCHAR(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_st_ledger_station` (`station_id`),
  KEY `idx_st_ledger_date` (`entry_date`),
  CONSTRAINT `fk_st_ledger_station` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. CUSTOMERS (SENDERS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `customers` (
  `id` VARCHAR(64) NOT NULL,
  `customer_code` VARCHAR(64) NOT NULL,
  `name` VARCHAR(180) NOT NULL,
  `name_ur` VARCHAR(180) DEFAULT NULL,
  `phone` VARCHAR(60) NOT NULL,
  `secondary_phone` VARCHAR(60) DEFAULT NULL,
  `address` VARCHAR(300) DEFAULT NULL,
  `city` VARCHAR(120) DEFAULT NULL,
  `country` VARCHAR(120) DEFAULT 'UAE',
  `date_added` VARCHAR(32) NOT NULL,
  `notes` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_customers_code` (`customer_code`),
  KEY `idx_customers_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. RECEIVERS (BENEFICIARIES IN PAKISTAN)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `receivers` (
  `id` VARCHAR(64) NOT NULL,
  `customer_id` VARCHAR(64) DEFAULT NULL,
  `name` VARCHAR(180) NOT NULL,
  `name_ur` VARCHAR(180) DEFAULT NULL,
  `phone` VARCHAR(60) NOT NULL,
  `address` VARCHAR(300) DEFAULT NULL,
  `city` VARCHAR(120) DEFAULT NULL,
  `province` VARCHAR(120) DEFAULT NULL,
  `station` VARCHAR(150) NOT NULL,
  `country` VARCHAR(120) DEFAULT 'Pakistan',
  `cnic` VARCHAR(40) DEFAULT NULL,
  `bank_name` VARCHAR(180) DEFAULT NULL,
  `account_number` VARCHAR(120) DEFAULT NULL,
  `payout_method` VARCHAR(64) DEFAULT 'Cash',
  `notes` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_receivers_customer` (`customer_id`),
  KEY `idx_receivers_phone` (`phone`),
  KEY `idx_receivers_station` (`station`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. MONEY TRANSFERS (REMITTANCE ORDERS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `money_transfers` (
  `id` VARCHAR(64) NOT NULL,
  `order_number` VARCHAR(64) NOT NULL,
  `receipt_number` VARCHAR(64) NOT NULL,
  `transfer_date` VARCHAR(32) NOT NULL,
  `transfer_time` VARCHAR(32) DEFAULT NULL,
  `sender_id` VARCHAR(64) DEFAULT NULL,
  `sender_name` VARCHAR(180) NOT NULL,
  `sender_phone` VARCHAR(60) NOT NULL,
  `sender_city` VARCHAR(120) DEFAULT NULL,
  `sender_country` VARCHAR(120) DEFAULT NULL,
  `receiver_id` VARCHAR(64) DEFAULT NULL,
  `receiver_name` VARCHAR(180) NOT NULL,
  `receiver_phone` VARCHAR(60) NOT NULL,
  `receiver_address` VARCHAR(300) DEFAULT NULL,
  `receiver_city` VARCHAR(120) DEFAULT NULL,
  `receiver_cnic` VARCHAR(40) DEFAULT NULL,
  `station` VARCHAR(150) NOT NULL,
  `payout_method` VARCHAR(64) DEFAULT 'Cash',
  `bank_name` VARCHAR(180) DEFAULT NULL,
  `account_number` VARCHAR(120) DEFAULT NULL,
  `amount_aed` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `exchange_rate` DECIMAL(12, 2) NOT NULL DEFAULT 77.50,
  `amount_pkr` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `commission_type` ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
  `commission_rate` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `commission_base` ENUM('AED', 'PKR') NOT NULL DEFAULT 'AED',
  `commission_amount` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `additional_charges` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `total_collected_aed` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `net_payable_pkr` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `amount_paid_pkr` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `remaining_balance_pkr` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `station_balance_deducted` TINYINT(1) NOT NULL DEFAULT 0,
  `station_previous_balance_pkr` DECIMAL(16, 2) DEFAULT NULL,
  `station_new_balance_pkr` DECIMAL(16, 2) DEFAULT NULL,
  `status` ENUM('Draft', 'Received', 'Partially Paid', 'Paid', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Received',
  `notes` TEXT DEFAULT NULL,
  `created_at` VARCHAR(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_transfers_order_no` (`order_number`),
  KEY `idx_transfers_date` (`transfer_date`),
  KEY `idx_transfers_station` (`station`),
  KEY `idx_transfers_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. TRANSFER PAYOUTS (PARTIAL OR FULL DISBURSEMENTS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `transfer_payouts` (
  `id` VARCHAR(64) NOT NULL,
  `transfer_id` VARCHAR(64) NOT NULL,
  `payout_date` VARCHAR(32) NOT NULL,
  `receiver_name` VARCHAR(180) NOT NULL,
  `amount_pkr` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `payment_method` VARCHAR(64) NOT NULL DEFAULT 'Cash',
  `reference_no` VARCHAR(100) DEFAULT NULL,
  `station` VARCHAR(150) DEFAULT NULL,
  `receipt_no` VARCHAR(64) NOT NULL,
  `notes` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_payouts_transfer` (`transfer_id`),
  CONSTRAINT `fk_payouts_transfer` FOREIGN KEY (`transfer_id`) REFERENCES `money_transfers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. KHATA / CREDIT LOANS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `loans` (
  `id` VARCHAR(64) NOT NULL,
  `loan_no` VARCHAR(64) NOT NULL,
  `borrower_name` VARCHAR(180) NOT NULL,
  `borrower_phone` VARCHAR(60) NOT NULL,
  `borrower_address` VARCHAR(300) DEFAULT NULL,
  `loan_date` VARCHAR(32) NOT NULL,
  `original_amount` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `currency` ENUM('AED', 'PKR') NOT NULL DEFAULT 'AED',
  `due_date` VARCHAR(32) NOT NULL,
  `expected_duration` VARCHAR(32) NOT NULL DEFAULT '1_month',
  `purpose` VARCHAR(300) DEFAULT NULL,
  `agreed_terms` TEXT DEFAULT NULL,
  `total_repaid` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `remaining_balance` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('Outstanding', 'Partially Repaid', 'Fully Repaid', 'Overdue', 'Adjusted') NOT NULL DEFAULT 'Outstanding',
  `receipt_no` VARCHAR(64) NOT NULL,
  `notes` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_loans_loan_no` (`loan_no`),
  KEY `idx_loans_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. LOAN REPAYMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `loan_repayments` (
  `id` VARCHAR(64) NOT NULL,
  `loan_id` VARCHAR(64) NOT NULL,
  `repayment_date` VARCHAR(32) NOT NULL,
  `amount` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `currency` ENUM('AED', 'PKR') NOT NULL DEFAULT 'AED',
  `payment_method` VARCHAR(64) NOT NULL DEFAULT 'Cash',
  `reference_no` VARCHAR(100) DEFAULT NULL,
  `receipt_no` VARCHAR(64) NOT NULL,
  `notes` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_repayments_loan` (`loan_id`),
  CONSTRAINT `fk_repayments_loan` FOREIGN KEY (`loan_id`) REFERENCES `loans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 12. CASH JAMA / AMANAT SAFEKEEPING ACCOUNTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `amanat_accounts` (
  `id` VARCHAR(64) NOT NULL,
  `account_no` VARCHAR(64) NOT NULL,
  `owner_name` VARCHAR(180) NOT NULL,
  `owner_phone` VARCHAR(60) NOT NULL,
  `owner_address` VARCHAR(300) DEFAULT NULL,
  `city` VARCHAR(120) DEFAULT NULL,
  `currency` ENUM('AED', 'PKR') NOT NULL DEFAULT 'PKR',
  `opened_date` VARCHAR(32) NOT NULL,
  `current_balance` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `notes` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_amanat_account_no` (`account_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 13. CASH JAMA / AMANAT LEDGER ENTRIES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `amanat_entries` (
  `id` VARCHAR(64) NOT NULL,
  `account_id` VARCHAR(64) NOT NULL,
  `entry_date` VARCHAR(32) NOT NULL,
  `entry_type` ENUM('initial_deposit', 'additional_deposit', 'partial_withdrawal', 'full_withdrawal', 'third_party_payment', 'returned_to_owner', 'adjustment') NOT NULL,
  `amount` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `currency` ENUM('AED', 'PKR') NOT NULL DEFAULT 'PKR',
  `description` TEXT NOT NULL,
  `related_person` VARCHAR(180) DEFAULT NULL,
  `previous_balance` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `new_balance` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `receipt_no` VARCHAR(64) NOT NULL,
  `payment_method` VARCHAR(64) DEFAULT 'Cash',
  `bank_name` VARCHAR(180) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_amanat_entries_account` (`account_id`),
  CONSTRAINT `fk_amanat_entries_account` FOREIGN KEY (`account_id`) REFERENCES `amanat_accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 14. CENTRAL CASH LEDGER (ROZNAMCHA)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cash_ledger` (
  `id` VARCHAR(64) NOT NULL,
  `entry_date` VARCHAR(32) NOT NULL,
  `entry_type` ENUM('cash_in', 'cash_out') NOT NULL,
  `category` VARCHAR(64) NOT NULL,
  `amount` DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
  `currency` ENUM('AED', 'PKR') NOT NULL DEFAULT 'PKR',
  `reference_id` VARCHAR(100) DEFAULT NULL,
  `party_name` VARCHAR(180) DEFAULT NULL,
  `payment_method` VARCHAR(64) NOT NULL DEFAULT 'Cash',
  `description` TEXT NOT NULL,
  `notes` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cash_ledger_date` (`entry_date`),
  KEY `idx_cash_ledger_type` (`entry_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 15. APPLICATION STATE STORE (FOR FAST NODE.JS FULL-STATE SYNC)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `app_kv_store` (
  `store_key` VARCHAR(64) NOT NULL,
  `store_value` LONGTEXT NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`store_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- DEFAULT SEED DATA: SUPER ADMIN & ADMIN ACCOUNTS
-- ----------------------------------------------------------------------------
INSERT INTO `users` (`id`, `username`, `password`, `full_name`, `full_name_ur`, `role`, `station_access`, `status`, `permissions_json`, `created_at`)
VALUES
  (
    'usr-superadmin',
    'dsumerf@gmail.com',
    'Umer@321!Farooq',
    'Umer Farooq',
    'عمر فاروق (سپر ایڈمن - مکمل اختیارات)',
    'super_admin',
    'all',
    'active',
    '{"canEditExchangeRate":true,"canManageStations":true,"canDeleteTransfers":true,"canViewReports":true,"canManageCustomers":true,"canManageKhata":true,"canManageAmanat":true,"canManageUsers":true}',
    NOW()
  ),
  (
    'usr-admin',
    'admin',
    'Eagle@321!Brand',
    'System Administrator',
    'ایڈمنسٹریٹر (کاروباری ڈیٹا اختیارات)',
    'admin',
    'all',
    'active',
    '{"canEditExchangeRate":false,"canManageStations":true,"canDeleteTransfers":true,"canViewReports":true,"canManageCustomers":true,"canManageKhata":true,"canManageAmanat":true,"canManageUsers":false}',
    NOW()
  )
ON DUPLICATE KEY UPDATE
  `password` = VALUES(`password`),
  `role` = VALUES(`role`),
  `status` = VALUES(`status`);

INSERT INTO `business_settings` (
  `id`,
  `business_name_en`,
  `business_name_ur`,
  `branch_en`,
  `branch_ur`,
  `address_en`,
  `address_ur`,
  `phone_en`,
  `phone_ur`,
  `whatsapp`,
  `email`,
  `default_exchange_rate`,
  `default_commission_pct`,
  `commission_base`,
  `receipt_prefix`,
  `order_number_prefix`,
  `default_language`,
  `receipt_footer_en`,
  `receipt_footer_ur`
) VALUES (
  1,
  'Eagle Star Brand',
  'ایگل اسٹار برانڈ',
  'Deira Branch, Dubai, UAE',
  'دیرہ برانچ، دبئی، متحدہ عرب امارات',
  'Shop 14, Al-Sabkha Road, Deira, Dubai',
  'دکان نمبر 14، الصبخہ روڈ، دیرہ، دبئی',
  '+971 50 123 4567',
  '+971 50 123 4567',
  '+971501234567',
  'info@eaglestarbrand.com',
  77.50,
  1.00,
  'AED',
  'REC',
  '109',
  'en',
  'اپنی رقم 5 دنوں کے اندر وصول کر لیں، بصورتِ دیگر ہم ذمہ دار نہیں ہوں گے۔',
  'اپنی رقم 5 دنوں کے اندر وصول کر لیں، بصورتِ دیگر ہم ذمہ دار نہیں ہوں گے۔'
)
ON DUPLICATE KEY UPDATE
  `business_name_en` = VALUES(`business_name_en`),
  `business_name_ur` = VALUES(`business_name_ur`);

SET FOREIGN_KEY_CHECKS = 1;
