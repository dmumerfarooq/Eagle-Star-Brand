/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Customer,
  Receiver,
  MoneyTransfer,
  Payout,
  Loan,
  LoanRepayment,
  AmanatAccount,
  AmanatEntry,
  LedgerEntry,
  BusinessSettings,
  AppUser,
  Station,
  PaymentMethod,
  StationTransactionType,
  StationLedgerEntry
} from '../types';
import { generateMySQLDump } from './mysqlExporter';

const STORAGE_KEYS = {
  CUSTOMERS: 'pk_dubai_customers_v1',
  RECEIVERS: 'pk_dubai_receivers_v1',
  TRANSFERS: 'pk_dubai_transfers_v1',
  LOANS: 'pk_dubai_loans_v1',
  AMANAT: 'pk_dubai_amanat_v1',
  LEDGER: 'pk_dubai_ledger_v1',
  SETTINGS: 'pk_dubai_settings_v1',
  LANG: 'pk_dubai_lang_v1',
  USERS: 'pk_dubai_users_v1',
  AUTH_USER: 'pk_dubai_auth_user_v1',
  STATIONS: 'pk_dubai_stations_v1',
  SAVED_BANKS: 'pk_dubai_banks_v1'
};

export const defaultSavedBanks: string[] = [
  'Meezan Bank (میزان بینک)',
  'HBL (حبیب بینک لمیٹڈ)',
  'UBL (یونائیٹڈ بینک لمیٹڈ)',
  'MCB (مسلم کمرشل بینک)',
  'Allied Bank (الائیڈ بینک)',
  'Bank Alfalah (بینک الفلاح)',
  'NBP (نیشنل بینک آف پاکستان)',
  'Askari Bank (عسکری بینک)',
  'Faysal Bank (فیصل بینک)',
  'Bank AL Habib (بینک الحبیب)',
  'Dubai Islamic Bank (دبئی اسلامک بینک)',
  'Bank of Punjab BOP (بینک آف پنجاب)',
  'Standard Chartered (سٹینڈرڈ چارٹرڈ)',
  'JS Bank (جے ایس بینک)',
  'Soneri Bank (سونری بینک)',
  'JazzCash (جیز کیش)',
  'EasyPaisa (ایزی پیسہ)',
  'NayaPay (نیا پیسہ)',
  'SadaPay (سدا پیسہ)',
  'Raast ID (راست)'
];

export const defaultSettings: BusinessSettings = {
  businessNameEn: 'Eagle Star Brand',
  businessNameUr: 'ایگل اسٹار برانڈ',
  branchEn: 'Deira Branch, Dubai, UAE',
  branchUr: 'دیرہ برانچ، دبئی، متحدہ عرب امارات',
  addressEn: 'Shop 14, Al-Sabkha Road, Deira, Dubai',
  addressUr: 'دکان نمبر 14، الصبخہ روڈ، دیرہ، دبئی',
  phoneEn: '+971 50 123 4567',
  phoneUr: '+971 50 123 4567',
  whatsapp: '+971501234567',
  email: 'info@eaglestarbrand.com',
  defaultExchangeRate: 77.50,
  manualRateUpdatedAt: '2026-10-27T10:00:00Z',
  manualRateUpdatedBy: 'Super Admin (dsumerf@gmail.com)',
  defaultCommissionPct: 1.0,
  commissionBase: 'AED',
  receiptPrefix: 'REC',
  orderNumberPrefix: '109',
  defaultLanguage: 'en',
  receiptFooterEn: 'اپنی رقم 5 دنوں کے اندر وصول کر لیں، بصورتِ دیگر ہم ذمہ دار نہیں ہوں گے۔',
  receiptFooterUr: 'اپنی رقم 5 دنوں کے اندر وصول کر لیں، بصورتِ دیگر ہم ذمہ دار نہیں ہوں گے۔',
  receiptFooterCashJamahUr: 'ایگل اسٹار برانڈ - پیسہ جمع و تحویل میں رکھی گئی رقم بوقت ضرورت فوری قابل واپسی ہے۔',
  receiptFooterCashJamahEn: 'Thank you for trusting Eagle Star Brand Cash Jamah Safekeeping. Funds available on demand.',
  receiptFooterDepositUr: 'ایگل اسٹار برانڈ - کیش جمع شدگی و کاؤنٹر فنڈز ڈپازٹ رسید۔ آپ کے اعتماد کا شکریہ!',
  receiptFooterDepositEn: 'Thank you for your trust in Eagle Star Brand - Official Cash Deposit Receipt',
  receiptFooterLoanUr: 'ایگل اسٹار برانڈ - ادھار کھاتہ و قرضہ واپسی باقاعدگی سے ادا کریں۔ آپ کے تعاون کا شکریہ!',
  receiptFooterLoanEn: 'Eagle Star Brand - Please settle credit khata dues on agreed due date. Thank you.',
  receiptHeaderTitleUr: 'رسید آرڈر',
  receiptCustomerLabelUr: 'مصفح کسٹمر نمبر'
};

export const defaultStations: Station[] = [
  {
    id: 'st-mirali',
    code: 'MR-01',
    nameUr: 'میرعلی',
    nameEn: 'Mir Ali',
    city: 'North Waziristan',
    category: 'counter',
    inCharge: 'Tariq Cashier (Mirali)',
    phone: '03001234567',
    address: 'Main Bazar Mirali, North Waziristan',
    status: 'active',
    notes: 'Main cash payout counter for Mir Ali and North Waziristan',
    createdAt: '2026-01-01T00:00:00Z',
    currentBalancePKR: 65000,
    entries: [
      {
        id: 'st-tx-101',
        stationId: 'st-mirali',
        stationNameUr: 'میرعلی',
        date: '2026-10-01',
        type: 'deposit_topup',
        amountPKR: 100000,
        paymentMethod: 'Hawala / Station Counter',
        referenceNo: 'DEP-MR-101',
        relatedParty: 'Eagle Star Dubai Office',
        previousBalancePKR: 0,
        newBalancePKR: 100000,
        description: 'کاؤنٹر کے ابتدائی کیش کاؤنٹر فنڈز کی فراہمی (Initial Top-Up)',
        receiptNo: 'VOUCH-1001',
        createdAt: '2026-10-01T08:00:00Z'
      },
      {
        id: 'st-tx-102',
        stationId: 'st-mirali',
        stationNameUr: 'میرعلی',
        date: '2026-10-26',
        type: 'transfer_payout',
        amountPKR: 20000,
        paymentMethod: 'Cash',
        referenceNo: '10913-2026',
        relatedParty: 'Sameer Khan s/o Arif Jan',
        previousBalancePKR: 100000,
        newBalancePKR: 80000,
        description: 'ٹرانسفر کیش ادائیگی برائے سامیرخان (آرڈر #10913-2026)',
        receiptNo: 'PAY-10913',
        createdAt: '2026-10-26T10:30:00Z'
      },
      {
        id: 'st-tx-103',
        stationId: 'st-mirali',
        stationNameUr: 'میرعلی',
        date: '2026-10-26',
        type: 'transfer_payout',
        amountPKR: 15000,
        paymentMethod: 'Cash',
        referenceNo: '10914-2026',
        relatedParty: 'Gul Faraz Khan',
        previousBalancePKR: 80000,
        newBalancePKR: 65000,
        description: 'جزوی کیش ادائیگی برائے گل فراز خان (آرڈر #10914-2026)',
        receiptNo: 'PAY-10914-A',
        createdAt: '2026-10-26T12:00:00Z'
      }
    ]
  },
  {
    id: 'st-easypaisa',
    code: 'EP-01',
    nameUr: 'ایزی پیسہ',
    nameEn: 'EasyPaisa',
    city: 'All Pakistan',
    category: 'wallet',
    inCharge: 'Automated Wallet System',
    phone: '03039578106',
    address: 'Telenor Bank Network',
    status: 'active',
    notes: 'Direct CNIC & mobile wallet instant transfer',
    createdAt: '2026-01-01T00:00:00Z',
    currentBalancePKR: -20000,
    entries: [
      {
        id: 'st-tx-201',
        stationId: 'st-easypaisa',
        stationNameUr: 'ایزی پیسہ',
        date: '2026-10-01',
        type: 'deposit_topup',
        amountPKR: 50000,
        paymentMethod: 'EasyPaisa',
        referenceNo: 'DEP-EP-201',
        relatedParty: 'EasyPaisa Wallet 03039578106',
        previousBalancePKR: 0,
        newBalancePKR: 50000,
        description: 'ایزی پیسہ والیٹ فنڈز ڈپازٹ',
        receiptNo: 'VOUCH-1002',
        createdAt: '2026-10-01T09:00:00Z'
      },
      {
        id: 'st-tx-202',
        stationId: 'st-easypaisa',
        stationNameUr: 'ایزی پیسہ',
        date: '2026-10-26',
        type: 'transfer_payout',
        amountPKR: 70000,
        paymentMethod: 'EasyPaisa',
        referenceNo: '10909-2026',
        relatedParty: 'Abdul Khalid (EasyPaisa 03039578106)',
        previousBalancePKR: 50000,
        newBalancePKR: -20000,
        description: 'ایزی پیسہ ٹرانسفر کیش ادائیگی برائے عبدالخالد (آرڈر #10909-2026)',
        receiptNo: 'PAY-10909',
        createdAt: '2026-10-26T11:15:00Z'
      }
    ]
  },
  {
    id: 'st-jazzcash',
    code: 'JC-01',
    nameUr: 'جیز کیش',
    nameEn: 'JazzCash',
    city: 'All Pakistan',
    category: 'wallet',
    inCharge: 'Automated Wallet System',
    phone: '03459876543',
    address: 'Mobilink Microfinance Bank',
    status: 'active',
    notes: 'Direct mobile wallet instant transfer',
    createdAt: '2026-01-01T00:00:00Z',
    currentBalancePKR: -25000,
    entries: [
      {
        id: 'st-tx-301',
        stationId: 'st-jazzcash',
        stationNameUr: 'جیز کیش',
        date: '2026-10-27',
        type: 'transfer_payout',
        amountPKR: 25000,
        paymentMethod: 'JazzCash',
        referenceNo: '10915-2026',
        relatedParty: 'Noor Muhammad (JazzCash 03459876543)',
        previousBalancePKR: 0,
        newBalancePKR: -25000,
        description: 'جیز کیش ٹرانسفر ادائیگی (اسٹیشن کی ذاتی رقم سے کیش) (آرڈر #10915-2026)',
        receiptNo: 'PAY-10915-1',
        createdAt: '2026-10-27T05:20:00Z'
      }
    ]
  },
  {
    id: 'st-bank',
    code: 'BK-01',
    nameUr: 'بینک ٹرانسفر',
    nameEn: 'Bank Transfer',
    city: 'All Pakistan',
    category: 'bank',
    inCharge: 'Bank Clearing Desk',
    phone: '03129876543',
    address: 'HBL, Meezan, UBL, MCB Clearing',
    status: 'active',
    notes: 'Interbank funds transfer (IBFT) all Pakistan branches',
    createdAt: '2026-01-01T00:00:00Z',
    currentBalancePKR: 40000,
    entries: [
      {
        id: 'st-tx-401',
        stationId: 'st-bank',
        stationNameUr: 'بینک ٹرانسفر',
        date: '2026-10-01',
        type: 'deposit_topup',
        amountPKR: 100000,
        paymentMethod: 'Bank Transfer',
        referenceNo: 'DEP-BK-401',
        relatedParty: 'Bank Clearing Account',
        previousBalancePKR: 0,
        newBalancePKR: 100000,
        description: 'بینک اکاؤنٹ کلئیرنگ فنڈز ڈپازٹ',
        receiptNo: 'VOUCH-1003',
        createdAt: '2026-10-01T10:00:00Z'
      },
      {
        id: 'st-tx-402',
        stationId: 'st-bank',
        stationNameUr: 'بینک ٹرانسفر',
        date: '2026-10-27',
        type: 'transfer_payout',
        amountPKR: 60000,
        paymentMethod: 'Bank Transfer',
        referenceNo: '10918-2026',
        relatedParty: 'Muhammad Usman HBL A/C 0123456789',
        previousBalancePKR: 100000,
        newBalancePKR: 40000,
        description: 'بینک اکاؤنٹ رقم ادائیگی برائے محمد عثمان (آرڈر #10918-2026)',
        receiptNo: 'PAY-10918',
        createdAt: '2026-10-27T07:00:00Z'
      }
    ]
  },
  {
    id: 'st-bannu',
    code: 'BN-01',
    nameUr: 'بنوں',
    nameEn: 'Bannu',
    city: 'Bannu',
    category: 'branch',
    inCharge: 'Haji Gulzar Bannu',
    phone: '03017654321',
    address: 'Chowk Bazar, Bannu City',
    status: 'active',
    notes: 'Bannu city cash dispatch & delivery desk',
    createdAt: '2026-01-10T00:00:00Z',
    currentBalancePKR: 150000,
    entries: [
      {
        id: 'st-tx-501',
        stationId: 'st-bannu',
        stationNameUr: 'بنوں',
        date: '2026-10-10',
        type: 'deposit_topup',
        amountPKR: 150000,
        paymentMethod: 'Cash',
        referenceNo: 'DEP-BN-501',
        relatedParty: 'Haji Gulzar Bannu',
        previousBalancePKR: 0,
        newBalancePKR: 150000,
        description: 'بنوں برانچ کیش فنڈز ڈپازٹ',
        receiptNo: 'VOUCH-1004',
        createdAt: '2026-10-10T11:00:00Z'
      }
    ]
  },
  {
    id: 'st-peshawar',
    code: 'PSH-01',
    nameUr: 'پشاور',
    nameEn: 'Peshawar',
    city: 'Peshawar',
    category: 'branch',
    inCharge: 'Khyber Remittance Desk',
    phone: '03339123456',
    address: 'Karkhano Market, Jamrud Road, Peshawar',
    status: 'active',
    notes: 'Peshawar & surrounding districts branch',
    createdAt: '2026-01-15T00:00:00Z',
    currentBalancePKR: 80000,
    entries: [
      {
        id: 'st-tx-601',
        stationId: 'st-peshawar',
        stationNameUr: 'پشاور',
        date: '2026-10-15',
        type: 'deposit_topup',
        amountPKR: 80000,
        paymentMethod: 'Cash',
        referenceNo: 'DEP-PSH-601',
        relatedParty: 'Khyber Remittance Desk',
        previousBalancePKR: 0,
        newBalancePKR: 80000,
        description: 'پشاور کاؤنٹر فنڈز ڈپازٹ',
        receiptNo: 'VOUCH-1005',
        createdAt: '2026-10-15T12:00:00Z'
      }
    ]
  },
  {
    id: 'st-miranshah',
    code: 'MSH-01',
    nameUr: 'میرانشاہ',
    nameEn: 'Miranshah',
    city: 'North Waziristan',
    category: 'counter',
    inCharge: 'Malik Zafar',
    phone: '03028889911',
    address: 'Civil Bazar, Miranshah',
    status: 'active',
    notes: 'Miranshah town cash pickup counter',
    createdAt: '2026-02-01T00:00:00Z',
    currentBalancePKR: 50000,
    entries: [
      {
        id: 'st-tx-701',
        stationId: 'st-miranshah',
        stationNameUr: 'میرانشاہ',
        date: '2026-10-20',
        type: 'deposit_topup',
        amountPKR: 50000,
        paymentMethod: 'Cash',
        referenceNo: 'DEP-MSH-701',
        relatedParty: 'Malik Zafar',
        previousBalancePKR: 0,
        newBalancePKR: 50000,
        description: 'میرانشاہ ڈیسک فنڈز ڈپازٹ',
        receiptNo: 'VOUCH-1006',
        createdAt: '2026-10-20T14:00:00Z'
      }
    ]
  }
];

export const defaultUsers: AppUser[] = [
  {
    id: 'user-superadmin',
    username: 'dsumerf@gmail.com',
    password: 'Umer@321!Farooq',
    fullName: 'Umer Farooq',
    fullNameUr: 'عمر فاروق (سپر ایڈمن - مکمل اختیارات)',
    role: 'super_admin',
    stationAccess: 'all',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    lastLogin: '2026-11-02T20:40:00Z',
    permissions: {
      canEditExchangeRate: true,
      canManageStations: true,
      canDeleteTransfers: true,
      canViewReports: true,
      canManageCustomers: true,
      canManageKhata: true,
      canManageAmanat: true,
      canManageUsers: true
    }
  },
  {
    id: 'user-admin',
    username: 'admin',
    password: 'Eagle@321!Brand',
    fullName: 'System Administrator',
    fullNameUr: 'ایڈمنسٹریٹر (کاروباری ڈیٹا اختیارات)',
    role: 'admin',
    stationAccess: 'all',
    status: 'active',
    createdAt: '2026-01-05T00:00:00Z',
    lastLogin: '2026-11-02T20:40:00Z',
    permissions: {
      canEditExchangeRate: false,
      canManageStations: true,
      canDeleteTransfers: false,
      canViewReports: true,
      canManageCustomers: true,
      canManageKhata: true,
      canManageAmanat: true,
      canManageUsers: false
    }
  },
  {
    id: 'user-manager',
    username: 'manager',
    password: 'mgr123',
    fullName: 'Branch Manager Khan',
    fullNameUr: 'برانچ منیجر خان',
    role: 'manager',
    stationAccess: 'all',
    status: 'active',
    createdAt: '2026-01-15T00:00:00Z',
    lastLogin: '2026-10-25T14:20:00Z'
  },
  {
    id: 'user-cashier',
    username: 'cashier',
    password: 'cash123',
    fullName: 'Tariq Cashier (Mirali)',
    fullNameUr: 'طارق کیشئر (میرعلی کاؤنٹر)',
    role: 'cashier',
    stationAccess: 'میرعلی',
    status: 'active',
    createdAt: '2026-02-01T00:00:00Z',
    lastLogin: '2026-10-26T18:10:00Z'
  }
];

export const demoCustomers: Customer[] = [
  {
    id: 'cust-1',
    customerCode: 'CUST-101',
    name: 'Shawar Khan',
    nameUr: 'شاورخان',
    phone: '+971551238901',
    address: 'Naif, Deira',
    city: 'Dubai',
    country: 'United Arab Emirates',
    dateAdded: '2026-08-15',
    notes: 'Regular sender to Mirali branch'
  },
  {
    id: 'cust-2',
    customerCode: 'CUST-102',
    name: 'Shah Alam',
    nameUr: 'شاہ عالم',
    phone: '+971508823419',
    address: 'Al Quoz Industrial 3',
    city: 'Dubai',
    country: 'United Arab Emirates',
    dateAdded: '2026-09-02',
    notes: 'Frequent EasyPaisa remittance'
  },
  {
    id: 'cust-3',
    customerCode: 'CUST-103',
    name: 'Haji Rasool Khan',
    nameUr: 'حاجی رسول خان',
    phone: '+971529944312',
    address: 'Sonapur Camp',
    city: 'Dubai',
    country: 'United Arab Emirates',
    dateAdded: '2026-07-10',
    notes: 'Has Amanat account & transfers'
  },
  {
    id: 'cust-4',
    customerCode: 'CUST-104',
    name: 'Malik Jahangir',
    nameUr: 'ملک جہانگیر',
    phone: '+971567711200',
    address: 'Sharjah Industrial',
    city: 'Sharjah',
    country: 'United Arab Emirates',
    dateAdded: '2026-10-01',
    notes: 'Khata borrower'
  }
];

export const demoReceivers: Receiver[] = [
  {
    id: 'rec-1',
    customerId: 'cust-1',
    name: 'Sameer Khan s/o Arif Jan',
    nameUr: 'سامیرخان والد عارف جان',
    phone: '03001234567',
    address: 'Main Bazar Mirali',
    city: 'North Waziristan',
    province: 'Khyber Pakhtunkhwa',
    station: 'میرعلی',
    country: 'Pakistan'
  },
  {
    id: 'rec-2',
    customerId: 'cust-2',
    name: 'Abdul Khalid (EasyPaisa)',
    nameUr: 'عبدالخالد 03039578106 ایزی پیسہ',
    phone: '03039578106',
    address: 'Bannu Road',
    city: 'Bannu',
    province: 'Khyber Pakhtunkhwa',
    station: 'ایزی پیسہ',
    country: 'Pakistan'
  },
  {
    id: 'rec-3',
    customerId: 'cust-3',
    name: 'Noor Muhammad (JazzCash)',
    nameUr: 'نور محمد 03459876543 جیز کیش',
    phone: '03459876543',
    address: 'Karkhano Market',
    city: 'Peshawar',
    province: 'Khyber Pakhtunkhwa',
    station: 'جیز کیش',
    country: 'Pakistan'
  },
  {
    id: 'rec-4',
    customerId: 'cust-1',
    name: 'Gul Faraz Khan',
    nameUr: 'گل فراز خان',
    phone: '03019871122',
    address: 'Miranshah Road',
    city: 'Mirali',
    province: 'Khyber Pakhtunkhwa',
    station: 'میرعلی',
    country: 'Pakistan'
  },
  {
    id: 'rec-5',
    customerId: 'cust-4',
    name: 'Muhammad Usman (HBL Bank)',
    nameUr: 'محمد عثمان HBL بینک اکاؤنٹ 0123456789',
    phone: '03129876543',
    address: 'Mall Road',
    city: 'Lahore',
    province: 'Punjab',
    station: 'بینک ٹرانسفر',
    country: 'Pakistan'
  }
];

export const demoTransfers: MoneyTransfer[] = [
  {
    id: 'tr-1',
    orderNumber: '10913-2026',
    receiptNumber: 'REC-26101',
    date: '2026-10-26',
    time: '14:30',
    senderId: 'cust-1',
    senderName: 'Shawar Khan',
    senderPhone: '+971551238901',
    senderCity: 'Dubai',
    senderCountry: 'United Arab Emirates',
    receiverId: 'rec-1',
    receiverName: 'Sameer Khan s/o Arif Jan',
    receiverPhone: '03001234567',
    receiverCity: 'North Waziristan',
    station: 'میرعلی',
    amountAED: 270,
    exchangeRate: 74.07,
    amountPKR: 20000,
    commissionType: 'percentage',
    commissionRate: 0,
    commissionBase: 'AED',
    commissionAmount: 0,
    additionalCharges: 0,
    totalCollectedAED: 270,
    netPayablePKR: 20000,
    amountPaidPKR: 20000,
    remainingBalancePKR: 0,
    status: 'Completed',
    payouts: [
      {
        id: 'pay-1',
        transferId: 'tr-1',
        date: '2026-10-26',
        receiverName: 'Sameer Khan s/o Arif Jan',
        amountPKR: 20000,
        paymentMethod: 'Cash',
        referenceNo: 'COUNTER-MR-1',
        station: 'میرعلی',
        notes: 'Handed over cash at Mirali office counter',
        receiptNo: 'PAY-10913'
      }
    ],
    notes: 'Sample order matching printed receipt format',
    createdAt: '2026-10-26T10:30:00Z'
  },
  {
    id: 'tr-2',
    orderNumber: '10909-2026',
    receiptNumber: 'REC-26102',
    date: '2026-10-26',
    time: '15:15',
    senderId: 'cust-2',
    senderName: 'Shah Alam',
    senderPhone: '+971508823419',
    senderCity: 'Dubai',
    senderCountry: 'United Arab Emirates',
    receiverId: 'rec-2',
    receiverName: 'Abdul Khalid 03039578106',
    receiverPhone: '03039578106',
    receiverCity: 'Bannu',
    station: 'ایزی پیسہ',
    amountAED: 925,
    exchangeRate: 75.67,
    amountPKR: 70000,
    commissionType: 'percentage',
    commissionRate: 0,
    commissionBase: 'AED',
    commissionAmount: 0,
    additionalCharges: 0,
    totalCollectedAED: 925,
    netPayablePKR: 70000,
    amountPaidPKR: 70000,
    remainingBalancePKR: 0,
    status: 'Completed',
    payouts: [
      {
        id: 'pay-2',
        transferId: 'tr-2',
        date: '2026-10-26',
        receiverName: 'Abdul Khalid 03039578106',
        amountPKR: 70000,
        paymentMethod: 'EasyPaisa',
        referenceNo: 'EP-TRX-994102',
        station: 'ایزی پیسہ',
        notes: 'Transferred directly via EasyPaisa mobile account',
        receiptNo: 'PAY-10909'
      }
    ],
    notes: 'Matching 2nd row on printed register sheet',
    createdAt: '2026-10-26T11:15:00Z'
  },
  {
    id: 'tr-3',
    orderNumber: '10914-2026',
    receiptNumber: 'REC-26103',
    date: '2026-10-26',
    time: '16:00',
    senderId: 'cust-1',
    senderName: 'Shawar Khan',
    senderPhone: '+971551238901',
    senderCity: 'Dubai',
    senderCountry: 'United Arab Emirates',
    receiverId: 'rec-4',
    receiverName: 'Gul Faraz Khan',
    receiverPhone: '03019871122',
    receiverCity: 'Mirali',
    station: 'میرعلی',
    amountAED: 400,
    exchangeRate: 75.00,
    amountPKR: 30000,
    commissionType: 'percentage',
    commissionRate: 1.0,
    commissionBase: 'AED',
    commissionAmount: 4,
    additionalCharges: 0,
    totalCollectedAED: 404,
    netPayablePKR: 30000,
    amountPaidPKR: 15000,
    remainingBalancePKR: 15000,
    status: 'Partially Paid',
    payouts: [
      {
        id: 'pay-3',
        transferId: 'tr-3',
        date: '2026-10-26',
        receiverName: 'Gul Faraz Khan',
        amountPKR: 15000,
        paymentMethod: 'Cash',
        referenceNo: 'COUNTER-MR-2',
        station: 'میرعلی',
        notes: 'Partial payout collected, remaining 15,000 PKR pending',
        receiptNo: 'PAY-10914-A'
      }
    ],
    notes: 'Two-phase installment payout',
    createdAt: '2026-10-26T12:00:00Z'
  },
  {
    id: 'tr-4',
    orderNumber: '10915-2026',
    receiptNumber: 'REC-26104',
    date: '2026-10-27',
    time: '09:20',
    senderId: 'cust-3',
    senderName: 'Haji Rasool Khan',
    senderPhone: '+971529944312',
    senderCity: 'Dubai',
    senderCountry: 'United Arab Emirates',
    receiverId: 'rec-3',
    receiverName: 'Noor Muhammad (JazzCash)',
    receiverPhone: '03459876543',
    receiverCity: 'Peshawar',
    station: 'جیز کیش',
    amountAED: 1000,
    exchangeRate: 75.00,
    amountPKR: 75000,
    commissionType: 'percentage',
    commissionRate: 1.0,
    commissionBase: 'AED',
    commissionAmount: 10,
    additionalCharges: 0,
    totalCollectedAED: 1010,
    netPayablePKR: 75000,
    amountPaidPKR: 25000,
    remainingBalancePKR: 50000,
    status: 'Partially Paid',
    payouts: [
      {
        id: 'pay-4',
        transferId: 'tr-4',
        date: '2026-10-27',
        receiverName: 'Noor Muhammad',
        amountPKR: 25000,
        paymentMethod: 'JazzCash',
        referenceNo: 'JC-881239',
        station: 'جیز کیش',
        notes: 'Testing workflow: AED 1000 @ 75 = 75,000 PKR, partial payout 25,000, remaining 50,000 PKR',
        receiptNo: 'PAY-10915-1'
      }
    ],
    notes: 'Matches master prompt workflow test scenario 1',
    createdAt: '2026-10-27T05:20:00Z'
  },
  {
    id: 'tr-5',
    orderNumber: '10918-2026',
    receiptNumber: 'REC-26105',
    date: '2026-10-27',
    time: '11:00',
    senderId: 'cust-4',
    senderName: 'Naveed Akhtar',
    senderPhone: '+971543321908',
    senderCity: 'Dubai',
    senderCountry: 'United Arab Emirates',
    receiverId: 'rec-5',
    receiverName: 'Muhammad Usman HBL Bank 0123456789',
    receiverPhone: '03129876543',
    receiverCity: 'Lahore',
    station: 'بینک ٹرانسفر',
    amountAED: 800,
    exchangeRate: 75.00,
    amountPKR: 60000,
    commissionType: 'percentage',
    commissionRate: 0,
    commissionBase: 'AED',
    commissionAmount: 0,
    additionalCharges: 0,
    totalCollectedAED: 800,
    netPayablePKR: 60000,
    amountPaidPKR: 60000,
    remainingBalancePKR: 0,
    status: 'Completed',
    payouts: [
      {
        id: 'pay-5',
        transferId: 'tr-5',
        date: '2026-10-27',
        receiverName: 'Muhammad Usman HBL A/C 0123456789',
        amountPKR: 60000,
        paymentMethod: 'Bank Transfer',
        referenceNo: 'HBL-FT-99120',
        station: 'بینک ٹرانسفر',
        notes: 'Direct online bank deposit to HBL Lahore branch account',
        receiptNo: 'PAY-10918'
      }
    ],
    notes: 'Online inter-bank remittance voucher',
    createdAt: '2026-10-27T07:00:00Z'
  }
];

export const demoLoans: Loan[] = [
  {
    id: 'loan-1',
    loanNo: 'LN-2026-001',
    borrowerName: 'Malik Jahangir',
    borrowerPhone: '+971567711200',
    borrowerAddress: 'Industrial Area 10, Sharjah',
    loanDate: '2026-01-01',
    originalAmount: 100000,
    currency: 'PKR',
    dueDate: '2026-04-01',
    expectedDuration: '3_months',
    purpose: 'Urgent family medical emergency in Peshawar',
    agreedTerms: 'To be repaid in 2 to 3 installments within 3 months',
    receiptNo: 'LN-REC-01',
    totalRepaid: 50000,
    remainingBalance: 50000,
    status: 'Partially Repaid',
    repayments: [
      {
        id: 'rep-1',
        loanId: 'loan-1',
        date: '2026-02-15',
        amount: 20000,
        currency: 'PKR',
        paymentMethod: 'Cash',
        referenceNo: 'CSH-REP-01',
        receiptNo: 'REP-101',
        notes: 'First installment received at Deira shop'
      },
      {
        id: 'rep-2',
        loanId: 'loan-1',
        date: '2026-03-20',
        amount: 30000,
        currency: 'PKR',
        paymentMethod: 'Bank Transfer',
        referenceNo: 'HBL-DEP-492',
        receiptNo: 'REP-102',
        notes: 'Second installment paid directly into Pakistan account'
      }
    ],
    notes: 'Exact match with Master Prompt Section 19 Khata Test: 100k lent, 20k + 30k repaid, 50k remaining.'
  },
  {
    id: 'loan-2',
    loanNo: 'LN-2026-002',
    borrowerName: 'Tariq Mehmood',
    borrowerPhone: '+971504938271',
    borrowerAddress: 'Hor Al Anz, Dubai',
    loanDate: '2026-08-01',
    originalAmount: 40000,
    currency: 'PKR',
    dueDate: '2026-09-01',
    expectedDuration: '1_month',
    purpose: 'Shop rent support',
    agreedTerms: 'Monthly clearance',
    receiptNo: 'LN-REC-02',
    totalRepaid: 0,
    remainingBalance: 40000,
    status: 'Overdue',
    repayments: [],
    notes: 'Past due date. Follow up with borrower.'
  }
];

export const demoAmanatAccounts: AmanatAccount[] = [
  {
    id: 'amn-1',
    accountNo: 'AMN-801',
    ownerName: 'Haji Rasool Khan',
    ownerPhone: '+971529944312',
    ownerAddress: 'Sonapur Camp Room 42, Dubai',
    city: 'Dubai',
    currency: 'PKR',
    openedDate: '2026-09-01',
    currentBalance: 80000,
    notes: 'Safekeeping account - Master Prompt scenario: 100k initial + 50k deposit - 70k third party = 80k balance.',
    entries: [
      {
        id: 'ame-1',
        accountId: 'amn-1',
        date: '2026-09-01',
        type: 'initial_deposit',
        amount: 100000,
        currency: 'PKR',
        description: 'Initial deposit kept for safekeeping',
        previousBalance: 0,
        newBalance: 100000,
        receiptNo: 'AMN-VOUCH-01',
        notes: 'Received cash in Dubai office'
      },
      {
        id: 'ame-2',
        accountId: 'amn-1',
        date: '2026-09-08',
        type: 'additional_deposit',
        amount: 50000,
        currency: 'PKR',
        description: 'Second week additional deposit',
        previousBalance: 100000,
        newBalance: 150000,
        receiptNo: 'AMN-VOUCH-02',
        notes: 'Additional cash handed over'
      },
      {
        id: 'ame-3',
        accountId: 'amn-1',
        date: '2026-09-22',
        type: 'third_party_payment',
        amount: 70000,
        currency: 'PKR',
        description: 'Sent to third party per owner instruction',
        relatedPerson: 'Kareem Ullah (Peshawar)',
        previousBalance: 150000,
        newBalance: 80000,
        receiptNo: 'AMN-VOUCH-03',
        notes: 'Paid via EasyPaisa to Kareem Ullah on Haji Rasool phone request'
      }
    ]
  },
  {
    id: 'amn-2',
    accountNo: 'AMN-802',
    ownerName: 'Umar Farooq',
    ownerPhone: '+971556633211',
    ownerAddress: 'Bur Dubai',
    city: 'Dubai',
    currency: 'AED',
    openedDate: '2026-10-05',
    currentBalance: 3500,
    notes: 'AED safekeeping ledger',
    entries: [
      {
        id: 'ame-4',
        accountId: 'amn-2',
        date: '2026-10-05',
        type: 'initial_deposit',
        amount: 5000,
        currency: 'AED',
        description: 'Kept during annual vacation',
        previousBalance: 0,
        newBalance: 5000,
        receiptNo: 'AMN-VOUCH-04'
      },
      {
        id: 'ame-5',
        accountId: 'amn-2',
        date: '2026-10-18',
        type: 'partial_withdrawal',
        amount: 1500,
        currency: 'AED',
        description: 'Partial withdrawal before departure',
        previousBalance: 5000,
        newBalance: 3500,
        receiptNo: 'AMN-VOUCH-05'
      }
    ]
  }
];

export const demoLedger: LedgerEntry[] = [
  {
    id: 'led-1',
    date: '2026-10-26',
    type: 'cash_in',
    category: 'transfer_received',
    amount: 270,
    currency: 'AED',
    referenceId: '10913-2026',
    partyName: 'Shawar Khan',
    paymentMethod: 'Cash',
    description: 'Received for transfer to Sameer Khan (Mirali)'
  },
  {
    id: 'led-2',
    date: '2026-10-26',
    type: 'cash_in',
    category: 'transfer_received',
    amount: 925,
    currency: 'AED',
    referenceId: '10909-2026',
    partyName: 'Shah Alam',
    paymentMethod: 'Cash',
    description: 'Received for transfer to Abdul Khalid (EasyPaisa)'
  },
  {
    id: 'led-3',
    date: '2026-10-26',
    type: 'cash_out',
    category: 'transfer_payout',
    amount: 20000,
    currency: 'PKR',
    referenceId: 'PAY-10913',
    partyName: 'Sameer Khan',
    paymentMethod: 'Cash',
    description: 'Cash payout at Mirali station counter'
  },
  {
    id: 'led-4',
    date: '2026-10-26',
    type: 'cash_out',
    category: 'transfer_payout',
    amount: 70000,
    currency: 'PKR',
    referenceId: 'PAY-10909',
    partyName: 'Abdul Khalid',
    paymentMethod: 'EasyPaisa',
    description: 'EasyPaisa transfer to 03039578106'
  }
];

class StorageService {
  private load<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return fallback;
      return JSON.parse(data) as T;
    } catch {
      return fallback;
    }
  }

  private save<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      if (key !== STORAGE_KEYS.AUTH_USER && key !== STORAGE_KEYS.LANG) {
        fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, data })
        }).catch(() => {
          // Offline or static fallback: localStorage remains authoritative
        });
      }
    } catch (e) {
      console.error(`Error saving to localStorage key ${key}:`, e);
    }
  }

  async syncWithServer(): Promise<boolean> {
    try {
      const res = await fetch('/api/state');
      if (!res.ok) return false;
      const payload = await res.json();
      const serverStore = payload?.store as Record<string, unknown> | undefined;
      if (!serverStore) return false;

      const syncKeys = [
        STORAGE_KEYS.CUSTOMERS,
        STORAGE_KEYS.RECEIVERS,
        STORAGE_KEYS.TRANSFERS,
        STORAGE_KEYS.LOANS,
        STORAGE_KEYS.AMANAT,
        STORAGE_KEYS.LEDGER,
        STORAGE_KEYS.SETTINGS,
        STORAGE_KEYS.USERS,
        STORAGE_KEYS.STATIONS,
        STORAGE_KEYS.SAVED_BANKS
      ];

      const hasServerData = syncKeys.some(k => serverStore[k] !== undefined);
      if (hasServerData) {
        for (const k of syncKeys) {
          if (serverStore[k] !== undefined) {
            localStorage.setItem(k, JSON.stringify(serverStore[k]));
          }
        }
        return true;
      } else {
        // Seed the Node.js server store with current client state
        const initialStore: Record<string, unknown> = {
          [STORAGE_KEYS.CUSTOMERS]: this.getCustomers(),
          [STORAGE_KEYS.RECEIVERS]: this.getReceivers(),
          [STORAGE_KEYS.TRANSFERS]: this.getTransfers(),
          [STORAGE_KEYS.LOANS]: this.getLoans(),
          [STORAGE_KEYS.AMANAT]: this.getAmanatAccounts(),
          [STORAGE_KEYS.LEDGER]: this.getLedgerEntries(),
          [STORAGE_KEYS.SETTINGS]: this.getSettings(),
          [STORAGE_KEYS.USERS]: this.getUsers(),
          [STORAGE_KEYS.STATIONS]: this.getStations(),
          [STORAGE_KEYS.SAVED_BANKS]: this.getSavedBanks()
        };
        await fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ store: initialStore })
        });
        return false;
      }
    } catch {
      return false;
    }
  }

  // Customers
  getCustomers(): Customer[] {
    return this.load<Customer[]>(STORAGE_KEYS.CUSTOMERS, demoCustomers);
  }

  saveCustomer(customer: Customer): Customer {
    const list = this.getCustomers();
    const existingIndex = list.findIndex(c => c.id === customer.id);
    let updated: Customer[];
    if (existingIndex >= 0) {
      const oldCust = list[existingIndex];
      updated = [...list];
      updated[existingIndex] = customer;

      // Propagate updated customer name/phone/city to linked MoneyTransfer history
      if (
        oldCust.name !== customer.name ||
        oldCust.phone !== customer.phone ||
        oldCust.city !== customer.city
      ) {
        const allTransfers = this.getTransfers();
        let trChanged = false;
        const syncedTransfers = allTransfers.map(t => {
          if (t.senderId === customer.id) {
            trChanged = true;
            return {
              ...t,
              senderName: customer.name,
              senderPhone: customer.phone,
              senderCity: customer.city || t.senderCity
            };
          }
          return t;
        });
        if (trChanged) {
          this.save(STORAGE_KEYS.TRANSFERS, syncedTransfers);
        }
      }
    } else {
      updated = [customer, ...list];
    }
    this.save(STORAGE_KEYS.CUSTOMERS, updated);
    return customer;
  }

  deleteCustomer(id: string): void {
    const list = this.getCustomers().filter(c => c.id !== id);
    this.save(STORAGE_KEYS.CUSTOMERS, list);
  }

  // Receivers
  getReceivers(): Receiver[] {
    const list = this.load<Receiver[]>(STORAGE_KEYS.RECEIVERS, demoReceivers);
    if (list.length > 0 && !list.some(r => r.id === 'rec-5')) {
      const r5 = demoReceivers.find(r => r.id === 'rec-5');
      if (r5 && list.length <= 4) {
        const merged = [...list, r5];
        this.save(STORAGE_KEYS.RECEIVERS, merged);
        return merged;
      }
    }
    return list;
  }

  saveReceiver(receiver: Receiver): Receiver {
    const list = this.getReceivers();
    const existingIndex = list.findIndex(r => r.id === receiver.id);
    let updated: Receiver[];
    if (existingIndex >= 0) {
      const oldRec = list[existingIndex];
      updated = [...list];
      updated[existingIndex] = receiver;

      // Propagate updated receiver details to linked MoneyTransfer history
      if (
        oldRec.name !== receiver.name ||
        oldRec.phone !== receiver.phone ||
        oldRec.cnic !== receiver.cnic ||
        oldRec.address !== receiver.address
      ) {
        const allTransfers = this.getTransfers();
        let trChanged = false;
        const syncedTransfers = allTransfers.map(t => {
          if (t.receiverId === receiver.id) {
            trChanged = true;
            return {
              ...t,
              receiverName: receiver.name,
              receiverPhone: receiver.phone,
              receiverCnic: receiver.cnic ?? t.receiverCnic,
              receiverAddress: receiver.address ?? t.receiverAddress
            };
          }
          return t;
        });
        if (trChanged) {
          this.save(STORAGE_KEYS.TRANSFERS, syncedTransfers);
        }
      }
    } else {
      updated = [receiver, ...list];
    }
    this.save(STORAGE_KEYS.RECEIVERS, updated);
    return receiver;
  }

  deleteReceiver(id: string): void {
    const list = this.getReceivers().filter(r => r.id !== id);
    this.save(STORAGE_KEYS.RECEIVERS, list);
  }

  // Helper: Deterministically recalculate all running balances in a Station's ledger entries
  recalculateStationLedger(
    entries: StationLedgerEntry[],
    initialOpeningBalance?: number
  ): { entries: StationLedgerEntry[]; currentBalancePKR: number } {
    if (!entries || entries.length === 0) {
      return { entries: [], currentBalancePKR: initialOpeningBalance ?? 0 };
    }
    let runningBal =
      initialOpeningBalance !== undefined
        ? initialOpeningBalance
        : entries[0].previousBalancePKR || 0;

    const recalculated = entries.map(e => {
      const isCredit = e.type === 'deposit_topup' || e.type === 'settlement_repayment';
      const prevBal = runningBal;
      const newBal = isCredit ? prevBal + (e.amountPKR || 0) : prevBal - (e.amountPKR || 0);
      runningBal = newBal;
      return {
        ...e,
        previousBalancePKR: prevBal,
        newBalancePKR: newBal
      };
    });

    return {
      entries: recalculated,
      currentBalancePKR: runningBal
    };
  }

  // Helper: Deterministically recalculate all running balances in an Amanat (Cash Jama) account
  recalculateAmanatEntries(
    entries: AmanatEntry[]
  ): { entries: AmanatEntry[]; currentBalance: number } {
    if (!entries || entries.length === 0) {
      return { entries: [], currentBalance: 0 };
    }
    let runningBal = 0;
    const recalculated = entries.map(e => {
      const prevBal = runningBal;
      const isDeposit = e.type === 'initial_deposit' || e.type === 'additional_deposit';
      const newBal = isDeposit ? prevBal + (e.amount || 0) : prevBal - (e.amount || 0);
      runningBal = newBal;
      return {
        ...e,
        previousBalance: prevBal,
        newBalance: newBal
      };
    });
    return {
      entries: recalculated,
      currentBalance: runningBal
    };
  }

  // Transfers
  getTransfers(): MoneyTransfer[] {
    const list = this.load<MoneyTransfer[]>(STORAGE_KEYS.TRANSFERS, demoTransfers);
    if (list.length > 0 && !list.some(t => t.id === 'tr-5')) {
      const tr5 = demoTransfers.find(t => t.id === 'tr-5');
      if (tr5 && list.length <= 4) {
        const merged = [...list, tr5];
        this.save(STORAGE_KEYS.TRANSFERS, merged);
        return merged;
      }
    }
    return list;
  }

  saveTransfer(transfer: MoneyTransfer): MoneyTransfer {
    const list = this.getTransfers();
    const existingIndex = list.findIndex(t => t.id === transfer.id);
    const stations = this.getStations();
    const findMatchingStation = (stationName?: string) =>
      stations.find(
        s =>
          s.nameUr === stationName ||
          s.nameEn === stationName ||
          s.code === stationName
      );

    let finalTransfer: MoneyTransfer = { ...transfer };

    if (existingIndex >= 0) {
      finalTransfer.updatedAt = new Date().toISOString();
      const oldTransfer = list[existingIndex];
      const newAmount = finalTransfer.netPayablePKR || finalTransfer.amountPKR || 0;

      if (oldTransfer.station === finalTransfer.station) {
        const st = findMatchingStation(finalTransfer.station);
        if (st) {
          const existingStEntries = st.entries || [];
          const hasMatchingEntry = existingStEntries.some(
            e => e.referenceNo === finalTransfer.orderNumber || e.referenceNo === oldTransfer.orderNumber
          );
          const openingBaseline =
            existingStEntries.length > 0
              ? existingStEntries[0].previousBalancePKR
              : (st.currentBalancePKR || 0) + (oldTransfer.netPayablePKR || oldTransfer.amountPKR || 0);

          let rawEntries: StationLedgerEntry[];
          if (hasMatchingEntry) {
            rawEntries = existingStEntries.map(e =>
              e.referenceNo === finalTransfer.orderNumber || e.referenceNo === oldTransfer.orderNumber
                ? {
                    ...e,
                    date: finalTransfer.date,
                    amountPKR: newAmount,
                    amountAED: finalTransfer.amountAED,
                    exchangeRate: finalTransfer.exchangeRate,
                    paymentMethod: finalTransfer.payoutMethod || e.paymentMethod,
                    bankName: finalTransfer.bankName || e.bankName,
                    accountNumber: finalTransfer.accountNumber || e.accountNumber,
                    relatedParty: finalTransfer.receiverName,
                    updatedAt: finalTransfer.updatedAt
                  }
                : e
            );
          } else {
            rawEntries = [
              ...existingStEntries,
              {
                id: `st-tx-${Date.now()}`,
                stationId: st.id,
                stationNameUr: st.nameUr,
                date: finalTransfer.date,
                time: finalTransfer.time,
                type: 'transfer_payout',
                amountPKR: newAmount,
                amountAED: finalTransfer.amountAED,
                exchangeRate: finalTransfer.exchangeRate,
                paymentMethod: finalTransfer.payoutMethod || 'Cash',
                bankName: finalTransfer.bankName,
                accountNumber: finalTransfer.accountNumber,
                referenceNo: finalTransfer.orderNumber,
                relatedParty: finalTransfer.receiverName,
                previousBalancePKR: st.currentBalancePKR || 0,
                newBalancePKR: (st.currentBalancePKR || 0) - newAmount,
                description: `ٹرانسفر آرڈر #${finalTransfer.orderNumber} برائے ${finalTransfer.receiverName}`,
                receiptNo: finalTransfer.receiptNumber,
                createdAt: new Date().toISOString()
              }
            ];
          }

          const recalc = this.recalculateStationLedger(rawEntries, openingBaseline);
          const finalEntries = recalc.entries.map(e =>
            e.referenceNo === finalTransfer.orderNumber
              ? {
                  ...e,
                  description:
                    e.newBalancePKR < 0
                      ? `ٹرانسفر آرڈر #${finalTransfer.orderNumber} برائے ${finalTransfer.receiverName} (منفی بقایا: ${e.newBalancePKR.toLocaleString()} PKR - اسٹیشن کی طرف سے ادائیگی)`
                      : `ٹرانسفر آرڈر #${finalTransfer.orderNumber} برائے ${finalTransfer.receiverName} (بقایا: ${e.newBalancePKR.toLocaleString()} PKR)`
                }
              : e
          );

          const targetEntry = finalEntries.find(e => e.referenceNo === finalTransfer.orderNumber);
          finalTransfer = {
            ...finalTransfer,
            stationBalanceDeducted: true,
            stationPreviousBalancePKR: targetEntry ? targetEntry.previousBalancePKR : finalTransfer.stationPreviousBalancePKR,
            stationNewBalancePKR: targetEntry ? targetEntry.newBalancePKR : recalc.currentBalancePKR
          };

          this.saveStation({
            ...st,
            currentBalancePKR: recalc.currentBalancePKR,
            entries: finalEntries
          });
        }
      } else {
        // Station changed: remove from old station & recalculate, then add to new station & recalculate
        const oldSt = findMatchingStation(oldTransfer.station);
        if (oldSt) {
          const oldEntries = oldSt.entries || [];
          const oldBaseline =
            oldEntries.length > 0
              ? oldEntries[0].previousBalancePKR
              : (oldSt.currentBalancePKR || 0) + (oldTransfer.netPayablePKR || oldTransfer.amountPKR || 0);
          const filteredOldEntries = oldEntries.filter(
            e => e.referenceNo !== oldTransfer.orderNumber && e.referenceNo !== finalTransfer.orderNumber
          );
          const recalcOld = this.recalculateStationLedger(filteredOldEntries, oldBaseline);
          this.saveStation({
            ...oldSt,
            currentBalancePKR: recalcOld.currentBalancePKR,
            entries: recalcOld.entries
          });
        }

        const newSt = findMatchingStation(finalTransfer.station);
        if (newSt) {
          const prevBal = newSt.currentBalancePKR || 0;
          const newBal = prevBal - newAmount;
          finalTransfer = {
            ...finalTransfer,
            stationBalanceDeducted: true,
            stationPreviousBalancePKR: prevBal,
            stationNewBalancePKR: newBal
          };

          const stEntry: StationLedgerEntry = {
            id: `st-tx-${Date.now()}`,
            stationId: newSt.id,
            stationNameUr: newSt.nameUr,
            date: finalTransfer.date,
            time: finalTransfer.time,
            type: 'transfer_payout',
            amountPKR: newAmount,
            amountAED: finalTransfer.amountAED,
            exchangeRate: finalTransfer.exchangeRate,
            paymentMethod: finalTransfer.payoutMethod || 'Cash',
            bankName: finalTransfer.bankName,
            accountNumber: finalTransfer.accountNumber,
            referenceNo: finalTransfer.orderNumber,
            relatedParty: finalTransfer.receiverName,
            previousBalancePKR: prevBal,
            newBalancePKR: newBal,
            description:
              newBal < 0
                ? `ٹرانسفر آرڈر #${finalTransfer.orderNumber} برائے ${finalTransfer.receiverName} (منفی بقایا: ${newBal.toLocaleString()} PKR - اسٹیشن کی طرف سے ادائیگی)`
                : `ٹرانسفر آرڈر #${finalTransfer.orderNumber} برائے ${finalTransfer.receiverName} (بقایا: ${newBal.toLocaleString()} PKR)`,
            receiptNo: finalTransfer.receiptNumber,
            createdAt: new Date().toISOString()
          };

          const existingNewEntries = newSt.entries || [];
          const newBaseline = existingNewEntries.length > 0 ? existingNewEntries[0].previousBalancePKR : prevBal;
          const recalcNew = this.recalculateStationLedger([...existingNewEntries, stEntry], newBaseline);

          this.saveStation({
            ...newSt,
            currentBalancePKR: recalcNew.currentBalancePKR,
            entries: recalcNew.entries
          });
        }
      }

      // Sync linked Amanat (Cash Jama) entry if this transfer was funded from an Amanat account
      const amanatList = this.getAmanatAccounts();
      amanatList.forEach(acc => {
        const matchIdx = (acc.entries || []).findIndex(
          e =>
            e.receiptNo === finalTransfer.receiptNumber ||
            e.receiptNo === oldTransfer.receiptNumber ||
            (e.type === 'third_party_payment' && e.description.includes(finalTransfer.orderNumber))
        );
        if (matchIdx >= 0) {
          const updatedAmanatEntries = [...acc.entries];
          const updatedAmt =
            acc.currency === 'AED'
              ? finalTransfer.totalCollectedAED || finalTransfer.amountAED
              : finalTransfer.netPayablePKR || finalTransfer.amountPKR;
          updatedAmanatEntries[matchIdx] = {
            ...updatedAmanatEntries[matchIdx],
            date: finalTransfer.date,
            amount: updatedAmt,
            relatedPerson: `${finalTransfer.receiverName} (${finalTransfer.receiverPhone})`,
            updatedAt: finalTransfer.updatedAt
          };
          const recalcAmanat = this.recalculateAmanatEntries(updatedAmanatEntries);
          this.saveAmanatAccount({
            ...acc,
            currentBalance: recalcAmanat.currentBalance,
            entries: recalcAmanat.entries
          });
        }
      });

      // Sync central Cash Book Ledger entry for this transfer
      const ledgerEntries = this.getLedgerEntries();
      let ledgerChanged = false;
      const updatedLedger = ledgerEntries.map(le => {
        if (
          le.referenceId === finalTransfer.orderNumber ||
          le.referenceId === finalTransfer.receiptNumber ||
          le.referenceId === oldTransfer.orderNumber
        ) {
          ledgerChanged = true;
          return {
            ...le,
            date: finalTransfer.date,
            amount: le.currency === 'AED' ? (finalTransfer.totalCollectedAED || finalTransfer.amountAED) : newAmount,
            partyName: le.category === 'transfer_received' ? finalTransfer.senderName : finalTransfer.receiverName,
            paymentMethod: finalTransfer.payoutMethod || le.paymentMethod,
            description:
              le.category === 'transfer_received'
                ? `Transfer Order #${finalTransfer.orderNumber} from ${finalTransfer.senderName} to ${finalTransfer.receiverName} (${finalTransfer.station})`
                : `Payout for Order #${finalTransfer.orderNumber} to ${finalTransfer.receiverName} (${finalTransfer.station})`,
            updatedAt: finalTransfer.updatedAt
          };
        }
        return le;
      });
      if (ledgerChanged) {
        this.save(STORAGE_KEYS.LEDGER, updatedLedger);
      }

      const updated = [...list];
      updated[existingIndex] = finalTransfer;
      this.save(STORAGE_KEYS.TRANSFERS, updated);
      return finalTransfer;
    } else {
      // New transfer: automatically deduct transfer amount from Station's running balance
      const targetStation = findMatchingStation(finalTransfer.station);
      const deductPKR = finalTransfer.netPayablePKR || finalTransfer.amountPKR || 0;

      if (targetStation && !finalTransfer.stationBalanceDeducted && deductPKR > 0) {
        const prevBal = targetStation.currentBalancePKR || 0;
        const newBal = prevBal - deductPKR;

        finalTransfer = {
          ...finalTransfer,
          stationBalanceDeducted: true,
          stationPreviousBalancePKR: prevBal,
          stationNewBalancePKR: newBal
        };

        const stEntry: StationLedgerEntry = {
          id: `st-tx-${Date.now()}`,
          stationId: targetStation.id,
          stationNameUr: targetStation.nameUr,
          date: finalTransfer.date,
          time: finalTransfer.time,
          type: 'transfer_payout',
          amountPKR: deductPKR,
          amountAED: finalTransfer.amountAED,
          exchangeRate: finalTransfer.exchangeRate,
          paymentMethod: finalTransfer.payoutMethod || 'Cash',
          bankName: finalTransfer.bankName,
          accountNumber: finalTransfer.accountNumber,
          referenceNo: finalTransfer.orderNumber,
          relatedParty: finalTransfer.receiverName,
          previousBalancePKR: prevBal,
          newBalancePKR: newBal,
          description:
            newBal < 0
              ? `ٹرانسفر آرڈر #${finalTransfer.orderNumber} برائے ${finalTransfer.receiverName} (منفی بقایا: ${newBal.toLocaleString()} PKR - اسٹیشن کی طرف سے ادائیگی)`
              : `ٹرانسفر آرڈر #${finalTransfer.orderNumber} برائے ${finalTransfer.receiverName} (بقایا: ${newBal.toLocaleString()} PKR)`,
          receiptNo: finalTransfer.receiptNumber,
          createdAt: new Date().toISOString()
        };

        const existingEntries = targetStation.entries || [];
        const baseline = existingEntries.length > 0 ? existingEntries[0].previousBalancePKR : prevBal;
        const recalc = this.recalculateStationLedger([...existingEntries, stEntry], baseline);

        this.saveStation({
          ...targetStation,
          currentBalancePKR: recalc.currentBalancePKR,
          entries: recalc.entries
        });
      }

      // Also record central Cash Book Ledger entry for the incoming AED transfer
      this.addLedgerEntry({
        id: `led-tr-${Date.now()}`,
        date: finalTransfer.date,
        type: 'cash_in',
        category: 'transfer_received',
        amount: finalTransfer.totalCollectedAED || finalTransfer.amountAED,
        currency: 'AED',
        referenceId: finalTransfer.orderNumber,
        partyName: finalTransfer.senderName,
        paymentMethod: 'Cash',
        description: `Transfer Order #${finalTransfer.orderNumber} from ${finalTransfer.senderName} to ${finalTransfer.receiverName} (${finalTransfer.station})`
      });

      const updated = [finalTransfer, ...list];
      this.save(STORAGE_KEYS.TRANSFERS, updated);
      return finalTransfer;
    }
  }

  deleteTransfer(id: string): void {
    const list = this.getTransfers();
    const tr = list.find(t => t.id === id);
    if (tr) {
      // 1. Restore Station balance & recalculate all remaining entries in that station
      const stations = this.getStations();
      const st = stations.find(
        s => s.nameUr === tr.station || s.nameEn === tr.station || s.code === tr.station
      );
      if (st) {
        const stEntries = st.entries || [];
        const hasLedgerEntry = stEntries.some(e => e.referenceNo === tr.orderNumber);
        if (tr.stationBalanceDeducted || hasLedgerEntry) {
          const baseline =
            stEntries.length > 0
              ? stEntries[0].previousBalancePKR
              : (st.currentBalancePKR || 0) + (tr.netPayablePKR || tr.amountPKR || 0);
          const remainingEntries = stEntries.filter(e => e.referenceNo !== tr.orderNumber);
          const recalc = this.recalculateStationLedger(remainingEntries, baseline);
          this.saveStation({
            ...st,
            currentBalancePKR: recalc.currentBalancePKR,
            entries: recalc.entries
          });
        }
      }

      // 2. Restore Amanat (Cash Jama) account if this transfer was funded from Amanat
      const amanatList = this.getAmanatAccounts();
      amanatList.forEach(acc => {
        const hadEntry = (acc.entries || []).some(
          e =>
            e.receiptNo === tr.receiptNumber ||
            (e.type === 'third_party_payment' && e.description.includes(tr.orderNumber))
        );
        if (hadEntry) {
          const remainingAmanat = (acc.entries || []).filter(
            e =>
              e.receiptNo !== tr.receiptNumber &&
              !(e.type === 'third_party_payment' && e.description.includes(tr.orderNumber))
          );
          const recalcAmanat = this.recalculateAmanatEntries(remainingAmanat);
          this.saveAmanatAccount({
            ...acc,
            currentBalance: recalcAmanat.currentBalance,
            entries: recalcAmanat.entries
          });
        }
      });

      // 3. Remove linked Central Cash Ledger entries
      const payoutReceipts = new Set((tr.payouts || []).map(p => p.receiptNo));
      const filteredLedger = this.getLedgerEntries().filter(
        le =>
          le.referenceId !== tr.orderNumber &&
          le.referenceId !== tr.receiptNumber &&
          (!le.referenceId || !payoutReceipts.has(le.referenceId))
      );
      this.save(STORAGE_KEYS.LEDGER, filteredLedger);
    }
    const filtered = list.filter(t => t.id !== id);
    this.save(STORAGE_KEYS.TRANSFERS, filtered);
  }

  addPayout(transferId: string, payout: Payout): MoneyTransfer | null {
    const list = this.getTransfers();
    const transfer = list.find(t => t.id === transferId);
    if (!transfer) return null;

    const newAmountPaid = transfer.amountPaidPKR + payout.amountPKR;
    const remaining = Math.max(0, transfer.netPayablePKR - newAmountPaid);
    
    let newStatus = transfer.status;
    if (remaining === 0) {
      newStatus = 'Completed';
    } else if (newAmountPaid > 0) {
      newStatus = 'Partially Paid';
    }

    // Deduct from Station Running Balance ONLY if not already deducted when the transfer was created
    const targetStationName = payout.station || transfer.station;
    const stations = this.getStations();
    const targetStation = stations.find(
      s => s.nameUr === targetStationName || s.nameEn === targetStationName || s.code === targetStationName
    );

    const alreadyDeductedInStation =
      Boolean(transfer.stationBalanceDeducted) ||
      Boolean(targetStation?.entries?.some(e => e.referenceNo === transfer.orderNumber));

    let prevBal = transfer.stationPreviousBalancePKR;
    let newBal = transfer.stationNewBalancePKR;

    if (targetStation && !alreadyDeductedInStation) {
      prevBal = targetStation.currentBalancePKR || 0;
      newBal = prevBal - payout.amountPKR;
      const stEntry: StationLedgerEntry = {
        id: `st-tx-${Date.now()}`,
        stationId: targetStation.id,
        stationNameUr: targetStation.nameUr,
        date: payout.date,
        type: 'transfer_payout',
        amountPKR: payout.amountPKR,
        paymentMethod: payout.paymentMethod,
        referenceNo: transfer.orderNumber,
        relatedParty: payout.receiverName,
        previousBalancePKR: prevBal,
        newBalancePKR: newBal,
        description: `ٹرانسفر کیش ادائیگی برائے ${payout.receiverName} (آرڈر #${transfer.orderNumber})`,
        receiptNo: payout.receiptNo,
        createdAt: new Date().toISOString()
      };

      const existingEntries = targetStation.entries || [];
      const baseline = existingEntries.length > 0 ? existingEntries[0].previousBalancePKR : prevBal;
      const recalc = this.recalculateStationLedger([...existingEntries, stEntry], baseline);

      this.saveStation({
        ...targetStation,
        currentBalancePKR: recalc.currentBalancePKR,
        entries: recalc.entries
      });
    }

    const updatedTransfer: MoneyTransfer = {
      ...transfer,
      amountPaidPKR: newAmountPaid,
      remainingBalancePKR: remaining,
      status: newStatus,
      stationBalanceDeducted: true,
      stationPreviousBalancePKR: prevBal,
      stationNewBalancePKR: newBal,
      payouts: [...(transfer.payouts || []), payout],
      updatedAt: new Date().toISOString()
    };

    const idx = list.findIndex(t => t.id === transferId);
    if (idx >= 0) {
      const updatedList = [...list];
      updatedList[idx] = updatedTransfer;
      this.save(STORAGE_KEYS.TRANSFERS, updatedList);
    }

    // Also record in central cash ledger
    this.addLedgerEntry({
      id: `led-${Date.now()}`,
      date: payout.date,
      type: 'cash_out',
      category: 'transfer_payout',
      amount: payout.amountPKR,
      currency: 'PKR',
      referenceId: payout.receiptNo,
      partyName: payout.receiverName,
      paymentMethod: payout.paymentMethod,
      description: `Payout for order ${transfer.orderNumber} to ${payout.receiverName}`
    });

    return updatedTransfer;
  }

  // Loans (Khata)
  getLoans(): Loan[] {
    return this.load<Loan[]>(STORAGE_KEYS.LOANS, demoLoans);
  }

  saveLoan(loan: Loan): Loan {
    const list = this.getLoans();
    const idx = list.findIndex(l => l.id === loan.id);
    const totalRepaid = (loan.repayments || []).reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const remainingBalance = Math.max(0, (Number(loan.originalAmount) || 0) - totalRepaid);
    const computedStatus =
      remainingBalance === 0 && (Number(loan.originalAmount) || 0) > 0
        ? 'Fully Repaid'
        : totalRepaid > 0
        ? 'Partially Repaid'
        : loan.status === 'Fully Repaid' || loan.status === 'Partially Repaid'
        ? 'Outstanding'
        : loan.status;

    const normalizedLoan: Loan = {
      ...loan,
      totalRepaid,
      remainingBalance,
      status: computedStatus,
      updatedAt: idx >= 0 ? new Date().toISOString() : loan.updatedAt
    };

    let updated: Loan[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = normalizedLoan;

      // Sync central Cash Ledger entry for this loan
      const ledgerList = this.getLedgerEntries();
      let ledChanged = false;
      const syncedLedger = ledgerList.map(le => {
        if (le.referenceId === normalizedLoan.receiptNo || le.referenceId === normalizedLoan.loanNo) {
          ledChanged = true;
          return {
            ...le,
            date: normalizedLoan.loanDate,
            amount: normalizedLoan.originalAmount,
            currency: normalizedLoan.currency,
            partyName: normalizedLoan.borrowerName,
            description: `Khata Loan (${normalizedLoan.loanNo}) disbursed to ${normalizedLoan.borrowerName}: ${normalizedLoan.purpose}`,
            updatedAt: normalizedLoan.updatedAt
          };
        }
        return le;
      });
      if (ledChanged) {
        this.save(STORAGE_KEYS.LEDGER, syncedLedger);
      }
    } else {
      updated = [normalizedLoan, ...list];
      this.addLedgerEntry({
        id: `led-ln-${Date.now()}`,
        date: normalizedLoan.loanDate,
        type: 'cash_out',
        category: 'loan_disbursed',
        amount: normalizedLoan.originalAmount,
        currency: normalizedLoan.currency,
        referenceId: normalizedLoan.receiptNo || normalizedLoan.loanNo,
        partyName: normalizedLoan.borrowerName,
        paymentMethod: 'Cash',
        description: `Khata Loan (${normalizedLoan.loanNo}) disbursed to ${normalizedLoan.borrowerName}: ${normalizedLoan.purpose}`
      });
    }
    this.save(STORAGE_KEYS.LOANS, updated);
    return normalizedLoan;
  }

  deleteLoan(id: string): void {
    const loans = this.getLoans();
    const target = loans.find(l => l.id === id);
    if (target) {
      const repReceiptIds = new Set((target.repayments || []).map(r => r.receiptNo));
      const filteredLedger = this.getLedgerEntries().filter(
        le =>
          le.referenceId !== target.receiptNo &&
          le.referenceId !== target.loanNo &&
          (!le.referenceId || !repReceiptIds.has(le.referenceId))
      );
      this.save(STORAGE_KEYS.LEDGER, filteredLedger);
    }
    const list = loans.filter(l => l.id !== id);
    this.save(STORAGE_KEYS.LOANS, list);
  }

  addLoanRepayment(loanId: string, repayment: LoanRepayment): Loan | null {
    const loans = this.getLoans();
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return null;

    const updatedRepayments = [...(loan.repayments || []), repayment];
    const totalRepaid = updatedRepayments.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const remaining = Math.max(0, loan.originalAmount - totalRepaid);
    const newStatus = remaining === 0 ? 'Fully Repaid' : 'Partially Repaid';

    const updatedLoan: Loan = {
      ...loan,
      totalRepaid,
      remainingBalance: remaining,
      status: newStatus,
      repayments: updatedRepayments,
      updatedAt: new Date().toISOString()
    };

    this.saveLoan(updatedLoan);

    // Cash ledger
    this.addLedgerEntry({
      id: `led-${Date.now()}`,
      date: repayment.date,
      type: 'cash_in',
      category: 'loan_repayment',
      amount: repayment.amount,
      currency: repayment.currency,
      referenceId: repayment.receiptNo,
      partyName: loan.borrowerName,
      paymentMethod: repayment.paymentMethod,
      description: `Loan repayment received from ${loan.borrowerName} (${loan.loanNo})`
    });

    return updatedLoan;
  }

  updateLoanRepayment(
    loanId: string,
    repaymentId: string,
    updatedData: Partial<LoanRepayment>
  ): Loan | null {
    const loans = this.getLoans();
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return null;

    const targetRep = (loan.repayments || []).find(r => r.id === repaymentId);
    if (!targetRep) return null;

    const updatedRepayments = (loan.repayments || []).map(r =>
      r.id === repaymentId
        ? {
            ...r,
            ...updatedData,
            amount: Number(updatedData.amount ?? r.amount),
            updatedAt: new Date().toISOString()
          }
        : r
    );

    const updatedLoan = this.saveLoan({
      ...loan,
      repayments: updatedRepayments
    });

    // Sync central Cash Ledger entry for this repayment
    const ledgerList = this.getLedgerEntries();
    const syncedLedger = ledgerList.map(le =>
      le.referenceId === targetRep.receiptNo
        ? {
            ...le,
            date: updatedData.date || le.date,
            amount: Number(updatedData.amount ?? le.amount),
            paymentMethod: updatedData.paymentMethod || le.paymentMethod,
            description: `Loan repayment received from ${loan.borrowerName} (${loan.loanNo})`,
            updatedAt: new Date().toISOString()
          }
        : le
    );
    this.save(STORAGE_KEYS.LEDGER, syncedLedger);

    return updatedLoan;
  }

  deleteLoanRepayment(loanId: string, repaymentId: string): Loan | null {
    const loans = this.getLoans();
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return null;

    const targetRep = (loan.repayments || []).find(r => r.id === repaymentId);
    const updatedRepayments = (loan.repayments || []).filter(r => r.id !== repaymentId);

    const updatedLoan = this.saveLoan({
      ...loan,
      repayments: updatedRepayments
    });

    if (targetRep?.receiptNo) {
      const filteredLedger = this.getLedgerEntries().filter(le => le.referenceId !== targetRep.receiptNo);
      this.save(STORAGE_KEYS.LEDGER, filteredLedger);
    }

    return updatedLoan;
  }

  // Amanat (Safekeeping / Cash Jama)
  getAmanatAccounts(): AmanatAccount[] {
    return this.load<AmanatAccount[]>(STORAGE_KEYS.AMANAT, demoAmanatAccounts);
  }

  saveAmanatAccount(account: AmanatAccount): AmanatAccount {
    const list = this.getAmanatAccounts();
    const idx = list.findIndex(a => a.id === account.id);
    const recalc = this.recalculateAmanatEntries(account.entries || []);
    const normalizedAccount: AmanatAccount = {
      ...account,
      currentBalance: account.entries && account.entries.length > 0 ? recalc.currentBalance : account.currentBalance,
      entries: account.entries && account.entries.length > 0 ? recalc.entries : (account.entries || [])
    };

    let updated: AmanatAccount[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = normalizedAccount;
    } else {
      updated = [normalizedAccount, ...list];
    }
    this.save(STORAGE_KEYS.AMANAT, updated);
    return normalizedAccount;
  }

  deleteAmanatAccount(accountId: string): void {
    const accounts = this.getAmanatAccounts();
    const target = accounts.find(a => a.id === accountId);
    if (target) {
      const receiptSet = new Set((target.entries || []).map(e => e.receiptNo));
      const filteredLedger = this.getLedgerEntries().filter(
        le => !le.referenceId || !receiptSet.has(le.referenceId)
      );
      this.save(STORAGE_KEYS.LEDGER, filteredLedger);
    }
    const filtered = accounts.filter(a => a.id !== accountId);
    this.save(STORAGE_KEYS.AMANAT, filtered);
  }

  addAmanatEntry(accountId: string, entry: Omit<AmanatEntry, 'id' | 'previousBalance' | 'newBalance'>): AmanatAccount | null {
    const accounts = this.getAmanatAccounts();
    const account = accounts.find(a => a.id === accountId);
    if (!account) return null;

    const prevBal = account.currentBalance;
    let newBal = prevBal;

    if (entry.type === 'initial_deposit' || entry.type === 'additional_deposit') {
      newBal = prevBal + entry.amount;
    } else if (
      entry.type === 'partial_withdrawal' ||
      entry.type === 'full_withdrawal' ||
      entry.type === 'third_party_payment' ||
      entry.type === 'returned_to_owner'
    ) {
      newBal = prevBal - entry.amount;
    }

    const fullEntry: AmanatEntry = {
      ...entry,
      id: `ame-${Date.now()}`,
      previousBalance: prevBal,
      newBalance: newBal
    };

    const recalc = this.recalculateAmanatEntries([...(account.entries || []), fullEntry]);

    const updatedAccount: AmanatAccount = {
      ...account,
      currentBalance: recalc.currentBalance,
      entries: recalc.entries
    };

    this.saveAmanatAccount(updatedAccount);

    // Cash movement record
    const isCashIn = entry.type === 'initial_deposit' || entry.type === 'additional_deposit';
    this.addLedgerEntry({
      id: `led-${Date.now()}`,
      date: entry.date,
      type: isCashIn ? 'cash_in' : 'cash_out',
      category: isCashIn ? 'amanat_deposit' : (entry.type === 'third_party_payment' ? 'amanat_third_party' : 'amanat_withdrawal'),
      amount: entry.amount,
      currency: entry.currency,
      referenceId: entry.receiptNo,
      partyName: account.ownerName,
      paymentMethod: entry.paymentMethod || 'Cash',
      description: `Amanat: ${entry.description} (${account.ownerName})${entry.bankName ? ` - ${entry.bankName}` : ''}`
    });

    return updatedAccount;
  }

  updateAmanatEntry(
    accountId: string,
    entryId: string,
    updatedData: Partial<AmanatEntry>
  ): AmanatAccount | null {
    const accounts = this.getAmanatAccounts();
    const account = accounts.find(a => a.id === accountId);
    if (!account || !account.entries) return null;

    const targetEntry = account.entries.find(e => e.id === entryId);
    if (!targetEntry) return null;

    const rawEntries = account.entries.map(e =>
      e.id === entryId
        ? {
            ...e,
            ...updatedData,
            amount: Number(updatedData.amount ?? e.amount),
            updatedAt: new Date().toISOString()
          }
        : e
    );

    const recalc = this.recalculateAmanatEntries(rawEntries);
    const updatedAccount = this.saveAmanatAccount({
      ...account,
      currentBalance: recalc.currentBalance,
      entries: recalc.entries
    });

    const editedEntry = recalc.entries.find(e => e.id === entryId);
    if (editedEntry) {
      const isCashIn = editedEntry.type === 'initial_deposit' || editedEntry.type === 'additional_deposit';
      const ledgerList = this.getLedgerEntries();
      const syncedLedger = ledgerList.map(le =>
        le.referenceId === editedEntry.receiptNo
          ? {
              ...le,
              date: editedEntry.date,
              type: (isCashIn ? 'cash_in' : 'cash_out') as 'cash_in' | 'cash_out',
              category: (isCashIn
                ? 'amanat_deposit'
                : editedEntry.type === 'third_party_payment'
                ? 'amanat_third_party'
                : 'amanat_withdrawal') as LedgerEntry['category'],
              amount: editedEntry.amount,
              paymentMethod: editedEntry.paymentMethod || le.paymentMethod,
              description: `Amanat: ${editedEntry.description} (${account.ownerName})${editedEntry.bankName ? ` - ${editedEntry.bankName}` : ''}`,
              updatedAt: editedEntry.updatedAt
            }
          : le
      );
      this.save(STORAGE_KEYS.LEDGER, syncedLedger);
    }

    return updatedAccount;
  }

  deleteAmanatEntry(accountId: string, entryId: string): AmanatAccount | null {
    const accounts = this.getAmanatAccounts();
    const account = accounts.find(a => a.id === accountId);
    if (!account || !account.entries) return null;

    const targetEntry = account.entries.find(e => e.id === entryId);
    const remainingEntries = account.entries.filter(e => e.id !== entryId);
    const recalc = this.recalculateAmanatEntries(remainingEntries);

    const updatedAccount = this.saveAmanatAccount({
      ...account,
      currentBalance: recalc.currentBalance,
      entries: recalc.entries
    });

    if (targetEntry?.receiptNo) {
      const filteredLedger = this.getLedgerEntries().filter(le => le.referenceId !== targetEntry.receiptNo);
      this.save(STORAGE_KEYS.LEDGER, filteredLedger);
    }

    return updatedAccount;
  }

  // Ledger
  getLedgerEntries(): LedgerEntry[] {
    return this.load<LedgerEntry[]>(STORAGE_KEYS.LEDGER, demoLedger);
  }

  addLedgerEntry(entry: LedgerEntry): void {
    const list = this.getLedgerEntries();
    this.save(STORAGE_KEYS.LEDGER, [entry, ...list]);
  }

  updateLedgerEntry(entry: LedgerEntry): LedgerEntry {
    const list = this.getLedgerEntries();
    const idx = list.findIndex(e => e.id === entry.id);
    const updatedEntry: LedgerEntry = { ...entry, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      const updated = [...list];
      updated[idx] = updatedEntry;
      this.save(STORAGE_KEYS.LEDGER, updated);
    } else {
      this.save(STORAGE_KEYS.LEDGER, [updatedEntry, ...list]);
    }
    return updatedEntry;
  }

  deleteLedgerEntry(id: string): void {
    const list = this.getLedgerEntries().filter(e => e.id !== id);
    this.save(STORAGE_KEYS.LEDGER, list);
  }

  // Settings
  getSettings(): BusinessSettings {
    const settings = this.load<BusinessSettings>(STORAGE_KEYS.SETTINGS, defaultSettings);
    if (
      !settings.businessNameEn ||
      settings.businessNameEn.includes('Al-Madina')
    ) {
      const updated: BusinessSettings = {
        ...defaultSettings,
        ...settings,
        businessNameEn: 'Eagle Star Brand',
        businessNameUr: 'ایگل اسٹار برانڈ',
        email: 'info@eaglestarbrand.com',
        receiptFooterEn:
          settings.receiptFooterEn && !settings.receiptFooterEn.includes('Al-Madina')
            ? settings.receiptFooterEn
            : defaultSettings.receiptFooterEn,
        receiptFooterUr:
          settings.receiptFooterUr && settings.receiptFooterUr.includes('5 دنوں')
            ? settings.receiptFooterUr
            : defaultSettings.receiptFooterUr
      };
      this.save(STORAGE_KEYS.SETTINGS, updated);
      return updated;
    }
    return {
      ...defaultSettings,
      ...settings
    };
  }

  saveSettings(settings: BusinessSettings): void {
    this.save(STORAGE_KEYS.SETTINGS, settings);
  }

  // Language
  getLanguage(): 'en' | 'ur' {
    return this.load<'en' | 'ur'>(STORAGE_KEYS.LANG, 'en');
  }

  saveLanguage(lang: 'en' | 'ur'): void {
    this.save(STORAGE_KEYS.LANG, lang);
  }

  // Users & Access Control (RBAC)
  getUsers(): AppUser[] {
    let list = this.load<AppUser[]>(STORAGE_KEYS.USERS, defaultUsers);
    let changed = false;

    // Clean up legacy 'superadmin' username and ensure 'dsumerf@gmail.com' is the master Super Admin
    const oldSuperIndex = list.findIndex(u => u.username.toLowerCase() === 'superadmin');
    if (oldSuperIndex !== -1) {
      list.splice(oldSuperIndex, 1);
      changed = true;
    }

    const superAdminIndex = list.findIndex(u => u.username.toLowerCase() === 'dsumerf@gmail.com');
    if (superAdminIndex === -1) {
      list = [defaultUsers[0], ...list];
      changed = true;
    } else {
      const currentSA = list[superAdminIndex];
      if (
        currentSA.role !== 'super_admin' ||
        currentSA.password !== 'Umer@321!Farooq' ||
        currentSA.status !== 'active'
      ) {
        list[superAdminIndex] = {
          ...currentSA,
          username: 'dsumerf@gmail.com',
          role: 'super_admin',
          password: 'Umer@321!Farooq',
          fullName: 'Umer Farooq',
          fullNameUr: 'عمر فاروق (سپر ایڈمن - مکمل اختیارات)',
          status: 'active',
          stationAccess: 'all',
          permissions: {
            canEditExchangeRate: true,
            canManageStations: true,
            canDeleteTransfers: true,
            canViewReports: true,
            canManageCustomers: true,
            canManageKhata: true,
            canManageAmanat: true,
            canManageUsers: true
          }
        };
        changed = true;
      }
    }

    // Ensure 'admin' user exists with password 'Eagle@321!Brand' and role 'admin'
    const adminIndex = list.findIndex(u => u.username.toLowerCase() === 'admin');
    if (adminIndex === -1) {
      list = [...list, defaultUsers[1]];
      changed = true;
    } else {
      const currentAdmin = list[adminIndex];
      if (currentAdmin.role !== 'admin' || currentAdmin.password !== 'Eagle@321!Brand') {
        list[adminIndex] = {
          ...currentAdmin,
          role: 'admin',
          password: 'Eagle@321!Brand',
          fullName: 'System Administrator',
          fullNameUr: 'ایڈمنسٹریٹر (کاروباری ڈیٹا اختیارات)',
          status: 'active'
        };
        changed = true;
      }
    }

    // Enforce: ONLY Super Admin can have canDeleteTransfers = true
    list = list.map(u => {
      const isSA = u.role === 'super_admin' || u.username.toLowerCase() === 'dsumerf@gmail.com';
      if (!isSA && u.permissions?.canDeleteTransfers) {
        changed = true;
        return {
          ...u,
          permissions: {
            ...u.permissions,
            canDeleteTransfers: false
          }
        };
      }
      return u;
    });

    if (changed) {
      this.save(STORAGE_KEYS.USERS, list);
    }
    return list;
  }

  saveUser(user: AppUser): AppUser {
    const list = this.getUsers();
    const existingIndex = list.findIndex(u => u.id === user.id || u.username.toLowerCase() === user.username.toLowerCase());
    let updated: AppUser[];
    if (existingIndex >= 0) {
      updated = [...list];
      updated[existingIndex] = { ...list[existingIndex], ...user };
    } else {
      updated = [...list, user];
    }
    this.save(STORAGE_KEYS.USERS, updated);
    return user;
  }

  deleteUser(id: string): boolean {
    const list = this.getUsers();
    const user = list.find(u => u.id === id);
    if (
      !user ||
      user.username.toLowerCase() === 'dsumerf@gmail.com' ||
      user.username.toLowerCase() === 'admin' ||
      user.role === 'super_admin'
    ) {
      return false; // Cannot delete primary master superadmin or core admin
    }
    const filtered = list.filter(u => u.id !== id);
    this.save(STORAGE_KEYS.USERS, filtered);
    return true;
  }

  getAuthUser(): AppUser | null {
    const user = this.load<AppUser | null>(STORAGE_KEYS.AUTH_USER, null);
    if (!user) return null;
    const users = this.getUsers();
    const lookupUsername = user.username.toLowerCase() === 'superadmin' ? 'dsumerf@gmail.com' : user.username.toLowerCase();
    const latest = users.find(u => u.id === user.id || u.username.toLowerCase() === lookupUsername);
    return latest || null;
  }

  saveAuthUser(user: AppUser | null): void {
    if (user) {
      this.save(STORAGE_KEYS.AUTH_USER, user);
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    }
  }

  // Stations Management
  getStations(): Station[] {
    const list = this.load<Station[]>(STORAGE_KEYS.STATIONS, defaultStations);
    if (!list || list.length === 0) {
      this.save(STORAGE_KEYS.STATIONS, defaultStations);
      return defaultStations;
    }
    return list;
  }

  saveStation(station: Station): Station {
    const list = this.getStations();
    const existingIndex = list.findIndex(s => s.id === station.id || (s.code && s.code === station.code));
    let updated: Station[];
    if (existingIndex >= 0) {
      const oldStation = list[existingIndex];
      const oldNameUr = oldStation.nameUr;
      const oldNameEn = oldStation.nameEn;
      const newNameUr = station.nameUr;

      // Sync stationNameUr in entries if station name was edited
      const syncedEntries = (station.entries || oldStation.entries || []).map(e => ({
        ...e,
        stationNameUr: newNameUr
      }));

      updated = [...list];
      updated[existingIndex] = { ...oldStation, ...station, entries: syncedEntries };

      // If station name changed, propagate to linked transfers and receivers so Order List stays in sync
      if (oldNameUr && newNameUr && oldNameUr !== newNameUr) {
        const allTransfers = this.getTransfers();
        let trChanged = false;
        const updatedTransfers = allTransfers.map(t => {
          if (t.station === oldNameUr || t.station === oldNameEn) {
            trChanged = true;
            return { ...t, station: newNameUr };
          }
          return t;
        });
        if (trChanged) {
          this.save(STORAGE_KEYS.TRANSFERS, updatedTransfers);
        }

        const allReceivers = this.getReceivers();
        let recChanged = false;
        const updatedReceivers = allReceivers.map(r => {
          if (r.station === oldNameUr || r.station === oldNameEn) {
            recChanged = true;
            return { ...r, station: newNameUr };
          }
          return r;
        });
        if (recChanged) {
          this.save(STORAGE_KEYS.RECEIVERS, updatedReceivers);
        }
      }
    } else {
      updated = [...list, station];
    }
    this.save(STORAGE_KEYS.STATIONS, updated);
    return station;
  }

  deleteStation(id: string): boolean {
    const list = this.getStations();
    const station = list.find(s => s.id === id);
    if (!station) return false;
    const filtered = list.filter(s => s.id !== id);
    this.save(STORAGE_KEYS.STATIONS, filtered);
    return true;
  }

  // Saved & Custom Bank Names Management
  getSavedBanks(): string[] {
    const list = this.load<string[]>(STORAGE_KEYS.SAVED_BANKS, defaultSavedBanks);
    if (!list || list.length === 0) {
      this.save(STORAGE_KEYS.SAVED_BANKS, defaultSavedBanks);
      return defaultSavedBanks;
    }
    return list;
  }

  addSavedBank(bankName: string): string[] {
    const clean = bankName.trim();
    if (!clean) return this.getSavedBanks();
    const list = this.getSavedBanks();
    if (!list.some(b => b.toLowerCase() === clean.toLowerCase())) {
      const updated = [clean, ...list];
      this.save(STORAGE_KEYS.SAVED_BANKS, updated);
      return updated;
    }
    return list;
  }

  updateSavedBank(oldName: string, newName: string): string[] {
    const cleanNew = newName.trim();
    if (!cleanNew) return this.getSavedBanks();
    const list = this.getSavedBanks();
    const updated = list.map(b => (b === oldName ? cleanNew : b));
    // Ensure uniqueness
    const unique = Array.from(new Set(updated));
    this.save(STORAGE_KEYS.SAVED_BANKS, unique);
    return unique;
  }

  deleteSavedBank(bankName: string): string[] {
    const list = this.getSavedBanks().filter(b => b !== bankName);
    this.save(STORAGE_KEYS.SAVED_BANKS, list);
    return list;
  }

  recordStationDeposit(
    stationId: string,
    entryData: {
      date: string;
      amountPKR: number;
      amountAED?: number;
      exchangeRate?: number;
      paymentMethod?: PaymentMethod;
      bankName?: string;
      accountNumber?: string;
      referenceNo?: string;
      relatedParty?: string;
      description: string;
      notes?: string;
      receiptNo: string;
      type?: StationTransactionType;
    }
  ): Station | null {
    const stations = this.getStations();
    const station = stations.find(s => s.id === stationId);
    if (!station) return null;

    if (entryData.bankName && entryData.bankName.trim()) {
      this.addSavedBank(entryData.bankName.trim());
    }

    const prevBal = station.currentBalancePKR || 0;
    const txType = entryData.type || 'deposit_topup';
    const isCredit = txType === 'deposit_topup' || txType === 'settlement_repayment';
    // When prevBal is negative (minus), adding entryData.amountPKR automatically deducts the minus balance
    // and deposits the remaining amount as the new positive balance!
    const newBal = isCredit ? prevBal + entryData.amountPKR : prevBal - entryData.amountPKR;

    const minusDeducted = isCredit && prevBal < 0 ? Math.min(entryData.amountPKR, Math.abs(prevBal)) : 0;
    const channelSuffix = entryData.bankName
      ? ` [${entryData.paymentMethod || 'Bank Transfer'}: ${entryData.bankName}${entryData.accountNumber ? ` - ${entryData.accountNumber}` : ''}]`
      : entryData.paymentMethod && entryData.paymentMethod !== 'Cash'
      ? ` [${entryData.paymentMethod}${entryData.accountNumber ? ` - ${entryData.accountNumber}` : ''}]`
      : '';

    const baseDesc = entryData.description.includes('[')
      ? entryData.description
      : `${entryData.description}${channelSuffix}`;

    const finalDescription =
      minusDeducted > 0
        ? `${baseDesc} (منفی بقایا ${minusDeducted.toLocaleString()} PKR منہا، بقایا خالص جمع: ${newBal.toLocaleString()} PKR)`
        : baseDesc;

    const defaultRate = this.getSettings().defaultExchangeRate || 77.5;
    const effectiveRate = entryData.exchangeRate || defaultRate;
    const effectiveAed =
      entryData.amountAED !== undefined
        ? entryData.amountAED
        : Number((entryData.amountPKR / effectiveRate).toFixed(2));

    const fullEntry: StationLedgerEntry = {
      id: `st-tx-${Date.now()}`,
      stationId: station.id,
      stationNameUr: station.nameUr,
      date: entryData.date,
      type: txType,
      amountPKR: entryData.amountPKR,
      amountAED: effectiveAed,
      exchangeRate: effectiveRate,
      paymentMethod: entryData.paymentMethod || 'Bank Transfer',
      bankName: entryData.bankName?.trim() || undefined,
      accountNumber: entryData.accountNumber?.trim() || undefined,
      referenceNo: entryData.referenceNo,
      relatedParty: entryData.relatedParty || 'Eagle Star Head Office Deposit',
      previousBalancePKR: prevBal,
      newBalancePKR: newBal,
      description: finalDescription,
      notes: entryData.notes,
      receiptNo: entryData.receiptNo,
      createdAt: new Date().toISOString()
    };

    const updatedStation: Station = {
      ...station,
      currentBalancePKR: newBal,
      entries: [...(station.entries || []), fullEntry]
    };

    this.saveStation(updatedStation);

    // Record central cash ledger
    this.addLedgerEntry({
      id: `led-${Date.now()}`,
      date: entryData.date,
      type: isCredit ? 'cash_out' : 'cash_in',
      category: 'adjustment',
      amount: entryData.amountPKR,
      currency: 'PKR',
      referenceId: entryData.receiptNo,
      partyName: station.nameUr,
      paymentMethod: entryData.paymentMethod || 'Bank Transfer',
      description: `Station Funds (${station.nameUr}): ${baseDesc}`
    });

    return updatedStation;
  }

  updateStationDeposit(
    stationId: string,
    entryId: string,
    entryData: {
      date: string;
      amountPKR: number;
      amountAED?: number;
      exchangeRate?: number;
      paymentMethod?: PaymentMethod;
      bankName?: string;
      accountNumber?: string;
      referenceNo?: string;
      relatedParty?: string;
      description: string;
      notes?: string;
      type?: StationTransactionType;
    }
  ): Station | null {
    const stations = this.getStations();
    const station = stations.find(s => s.id === stationId);
    if (!station || !station.entries) return null;

    if (entryData.bankName && entryData.bankName.trim()) {
      this.addSavedBank(entryData.bankName.trim());
    }

    const entries = [...station.entries];
    const targetIdx = entries.findIndex(e => e.id === entryId);
    if (targetIdx === -1) return null;

    const channelSuffix = entryData.bankName
      ? ` [${entryData.paymentMethod || 'Bank Transfer'}: ${entryData.bankName}${entryData.accountNumber ? ` - ${entryData.accountNumber}` : ''}]`
      : entryData.paymentMethod && entryData.paymentMethod !== 'Cash'
      ? ` [${entryData.paymentMethod}${entryData.accountNumber ? ` - ${entryData.accountNumber}` : ''}]`
      : '';

    const cleanBaseDesc = entryData.description.replace(/\s*\[.*?\]/g, '').replace(/\s*\(منفی بقایا.*?\)/g, '').trim();
    const baseDesc = `${cleanBaseDesc}${channelSuffix}`;

    const defaultRate = this.getSettings().defaultExchangeRate || 77.5;
    const effectiveRate = entryData.exchangeRate || entries[targetIdx].exchangeRate || defaultRate;
    const effectiveAed =
      entryData.amountAED !== undefined
        ? entryData.amountAED
        : Number((entryData.amountPKR / effectiveRate).toFixed(2));

    entries[targetIdx] = {
      ...entries[targetIdx],
      date: entryData.date,
      amountPKR: entryData.amountPKR,
      amountAED: effectiveAed,
      exchangeRate: effectiveRate,
      paymentMethod: entryData.paymentMethod || entries[targetIdx].paymentMethod,
      bankName: entryData.bankName?.trim() || undefined,
      accountNumber: entryData.accountNumber?.trim() || undefined,
      referenceNo: entryData.referenceNo ?? entries[targetIdx].referenceNo,
      relatedParty: entryData.relatedParty ?? entries[targetIdx].relatedParty,
      description: baseDesc,
      notes: entryData.notes ?? entries[targetIdx].notes,
      type: entryData.type || entries[targetIdx].type
    };

    // Recalculate running balances sequentially from the edited entry onwards
    let runningBal = targetIdx === 0 ? entries[0].previousBalancePKR : entries[targetIdx - 1].newBalancePKR;
    for (let i = targetIdx; i < entries.length; i++) {
      const e = entries[i];
      const isCredit = e.type === 'deposit_topup' || e.type === 'settlement_repayment';
      const prevBal = runningBal;
      const newBal = isCredit ? prevBal + e.amountPKR : prevBal - e.amountPKR;
      entries[i] = {
        ...e,
        previousBalancePKR: prevBal,
        newBalancePKR: newBal
      };
      runningBal = newBal;
    }

    const updatedStation: Station = {
      ...station,
      currentBalancePKR: runningBal,
      entries
    };

    this.saveStation(updatedStation);

    // Sync central Cash Ledger entry for this station deposit/entry
    const targetReceiptNo = entries[targetIdx].receiptNo;
    if (targetReceiptNo) {
      const isCredit = entries[targetIdx].type === 'deposit_topup' || entries[targetIdx].type === 'settlement_repayment';
      const ledgerList = this.getLedgerEntries();
      const syncedLedger = ledgerList.map(le =>
        le.referenceId === targetReceiptNo
          ? {
              ...le,
              date: entryData.date,
              type: (isCredit ? 'cash_out' : 'cash_in') as 'cash_in' | 'cash_out',
              amount: entryData.amountPKR,
              paymentMethod: entryData.paymentMethod || le.paymentMethod,
              description: `Station Funds (${station.nameUr}): ${baseDesc}`,
              updatedAt: new Date().toISOString()
            }
          : le
      );
      this.save(STORAGE_KEYS.LEDGER, syncedLedger);
    }

    // If this entry is linked to a transfer order, sync the transfer order as well
    const refNo = entries[targetIdx].referenceNo;
    if (refNo) {
      const allTransfers = this.getTransfers();
      const trIdx = allTransfers.findIndex(t => t.orderNumber === refNo);
      if (trIdx !== -1) {
        const oldTr = allTransfers[trIdx];
        const updatedTransfers = [...allTransfers];
        updatedTransfers[trIdx] = {
          ...oldTr,
          date: entryData.date,
          amountPKR: entryData.amountPKR,
          netPayablePKR: entryData.amountPKR,
          amountPaidPKR: oldTr.status === 'Completed' ? entryData.amountPKR : oldTr.amountPaidPKR,
          amountAED: effectiveAed,
          exchangeRate: effectiveRate,
          totalCollectedAED: effectiveAed + (oldTr.commissionAmount || 0),
          receiverName: entryData.relatedParty || oldTr.receiverName,
          payoutMethod: entryData.paymentMethod || oldTr.payoutMethod,
          bankName: entryData.bankName || oldTr.bankName,
          accountNumber: entryData.accountNumber || oldTr.accountNumber,
          stationPreviousBalancePKR: entries[targetIdx].previousBalancePKR,
          stationNewBalancePKR: entries[targetIdx].newBalancePKR,
          updatedAt: new Date().toISOString()
        };
        this.save(STORAGE_KEYS.TRANSFERS, updatedTransfers);
      }
    }

    return updatedStation;
  }

  deleteStationEntry(stationId: string, entryId: string): Station | null {
    const stations = this.getStations();
    const station = stations.find(s => s.id === stationId);
    if (!station || !station.entries) return null;

    const targetIdx = station.entries.findIndex(e => e.id === entryId);
    if (targetIdx === -1) return null;

    const deletedEntry = station.entries[targetIdx];
    const basePrevBal =
      targetIdx === 0
        ? station.entries[0].previousBalancePKR
        : station.entries[targetIdx - 1].newBalancePKR;

    const remainingEntries = station.entries.filter(e => e.id !== entryId);
    let runningBal = basePrevBal;

    for (let i = targetIdx; i < remainingEntries.length; i++) {
      const e = remainingEntries[i];
      const isCredit = e.type === 'deposit_topup' || e.type === 'settlement_repayment';
      const prevBal = runningBal;
      const newBal = isCredit ? prevBal + e.amountPKR : prevBal - e.amountPKR;
      remainingEntries[i] = {
        ...e,
        previousBalancePKR: prevBal,
        newBalancePKR: newBal
      };
      runningBal = newBal;
    }

    if (remainingEntries.length > 0 && targetIdx > 0) {
      runningBal = remainingEntries[remainingEntries.length - 1].newBalancePKR;
    }

    const updatedStation: Station = {
      ...station,
      currentBalancePKR: runningBal,
      entries: remainingEntries
    };

    this.saveStation(updatedStation);

    // Also remove linked Central Cash Ledger entry if present
    if (deletedEntry?.receiptNo) {
      const filteredLedger = this.getLedgerEntries().filter(le => le.referenceId !== deletedEntry.receiptNo);
      this.save(STORAGE_KEYS.LEDGER, filteredLedger);
    }

    return updatedStation;
  }

  // Full backup & restore
  exportAllData(): string {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      customers: this.getCustomers(),
      receivers: this.getReceivers(),
      transfers: this.getTransfers(),
      loans: this.getLoans(),
      amanat: this.getAmanatAccounts(),
      ledger: this.getLedgerEntries(),
      settings: this.getSettings(),
      users: this.getUsers(),
      stations: this.getStations()
    };
    return JSON.stringify(data, null, 2);
  }

  importAllData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.customers) this.save(STORAGE_KEYS.CUSTOMERS, data.customers);
      if (data.receivers) this.save(STORAGE_KEYS.RECEIVERS, data.receivers);
      if (data.transfers) this.save(STORAGE_KEYS.TRANSFERS, data.transfers);
      if (data.loans) this.save(STORAGE_KEYS.LOANS, data.loans);
      if (data.amanat) this.save(STORAGE_KEYS.AMANAT, data.amanat);
      if (data.ledger) this.save(STORAGE_KEYS.LEDGER, data.ledger);
      if (data.settings) this.save(STORAGE_KEYS.SETTINGS, data.settings);
      if (data.users) this.save(STORAGE_KEYS.USERS, data.users);
      if (data.stations) this.save(STORAGE_KEYS.STATIONS, data.stations);
      return true;
    } catch (e) {
      console.error('Failed to import JSON data:', e);
      return false;
    }
  }

  clearAllData(): void {
    this.save(STORAGE_KEYS.CUSTOMERS, []);
    this.save(STORAGE_KEYS.RECEIVERS, []);
    this.save(STORAGE_KEYS.TRANSFERS, []);
    this.save(STORAGE_KEYS.LOANS, []);
    this.save(STORAGE_KEYS.AMANAT, []);
    this.save(STORAGE_KEYS.LEDGER, []);
  }

  resetToDemo(): void {
    this.save(STORAGE_KEYS.CUSTOMERS, demoCustomers);
    this.save(STORAGE_KEYS.RECEIVERS, demoReceivers);
    this.save(STORAGE_KEYS.TRANSFERS, demoTransfers);
    this.save(STORAGE_KEYS.LOANS, demoLoans);
    this.save(STORAGE_KEYS.AMANAT, demoAmanatAccounts);
    this.save(STORAGE_KEYS.LEDGER, demoLedger);
    this.save(STORAGE_KEYS.SETTINGS, defaultSettings);
    this.save(STORAGE_KEYS.USERS, defaultUsers);
    this.save(STORAGE_KEYS.STATIONS, defaultStations);
  }

  exportMySQLDump(): string {
    return generateMySQLDump({
      users: this.getUsers(),
      settings: this.getSettings(),
      savedBanks: this.getSavedBanks(),
      stations: this.getStations(),
      customers: this.getCustomers(),
      receivers: this.getReceivers(),
      transfers: this.getTransfers(),
      loans: this.getLoans(),
      amanat: this.getAmanatAccounts(),
      ledger: this.getLedgerEntries()
    });
  }
}

export const storage = new StorageService();
