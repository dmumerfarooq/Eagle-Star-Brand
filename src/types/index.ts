/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'en' | 'ur';

export type Currency = 'AED' | 'PKR';

export type TransferStatus = 'Draft' | 'Received' | 'Partially Paid' | 'Paid' | 'Completed' | 'Cancelled';

export type LoanStatus = 'Outstanding' | 'Partially Repaid' | 'Fully Repaid' | 'Overdue' | 'Adjusted';

export type AmanatEntryType = 
  | 'initial_deposit'
  | 'additional_deposit'
  | 'partial_withdrawal'
  | 'full_withdrawal'
  | 'third_party_payment'
  | 'returned_to_owner'
  | 'adjustment';

export type PaymentMethod =
  | 'Cash'
  | 'EasyPaisa'
  | 'JazzCash'
  | 'NayaPay'
  | 'SadaPay'
  | 'Raast'
  | 'Bank Transfer'
  | 'Hawala / Station Counter'
  | 'Cheque'
  | 'Other';

export interface Customer {
  id: string;
  customerCode: string; // e.g. CUST-1042
  name: string;
  nameUr?: string;
  phone: string;
  secondaryPhone?: string;
  address: string;
  city: string;
  country: string;
  dateAdded: string;
  notes?: string;
}

export interface Receiver {
  id: string;
  customerId?: string; // Associated primary sender if any
  name: string;
  nameUr?: string;
  phone: string;
  address?: string;
  city: string;
  province?: string;
  station: string; // e.g. "میرعلی", "ایزی پیسہ", "جیز کیش", "بینک ٹرانسفر", "نیا پیسہ"
  country: string;
  cnic?: string; // Receiver CNIC / ID
  bankName?: string; // e.g. HBL, Meezan Bank, EasyPaisa, NayaPay
  accountNumber?: string; // IBAN, Account or Wallet Mobile #
  payoutMethod?: PaymentMethod;
  notes?: string;
}

export type StationCategory = 'counter' | 'wallet' | 'bank' | 'branch';

export type StationTransactionType = 
  | 'deposit_topup'       // Head office deposited cash to station (+ balance)
  | 'transfer_payout'     // Remittance payout paid by station (- balance)
  | 'settlement_repayment'// Settlement paid to station (+ balance)
  | 'adjustment';         // Manual balance adjustment (+/- balance)

export interface StationLedgerEntry {
  id: string;
  stationId: string;
  stationNameUr: string;
  date: string;
  time?: string;
  type: StationTransactionType;
  amountPKR: number;
  amountAED?: number;
  exchangeRate?: number;
  paymentMethod?: PaymentMethod;
  bankName?: string;      // Manual or saved bank/wallet name (e.g. Meezan Bank, HBL, JazzCash)
  accountNumber?: string; // Bank account, IBAN, or wallet mobile number
  referenceNo?: string;   // Order #, Receipt #, or Cash Voucher #
  relatedParty?: string;  // Receiver name or Depositor name
  previousBalancePKR: number;
  newBalancePKR: number;
  description: string;
  notes?: string;
  receiptNo: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Station {
  id: string;
  code: string; // e.g. "MR-01", "EP-01", "JC-01"
  nameUr: string; // Urdu label e.g. "میرعلی", "ایزی پیسہ", "جیز کیش"
  nameEn: string; // English label e.g. "Mir Ali", "EasyPaisa", "JazzCash"
  city?: string;
  category: StationCategory;
  inCharge?: string; // Counter manager / contact person
  phone?: string;
  address?: string;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: string;

  // Financial Liquidity & Running Balance
  currentBalancePKR: number; // Positive = Cash available at station, Negative = Overdue/Payable to station
  entries?: StationLedgerEntry[];
}

export interface Payout {
  id: string;
  transferId: string;
  date: string;
  receiverName: string;
  amountPKR: number;
  paymentMethod: PaymentMethod;
  referenceNo?: string;
  station?: string;
  notes?: string;
  receiptNo: string;
}

export interface MoneyTransfer {
  id: string;
  orderNumber: string; // e.g. "10913-2026", "10909-2026"
  receiptNumber: string; // e.g. "REC-8921"
  date: string; // YYYY-MM-DD
  time?: string;
  senderId: string;
  senderName: string;
  senderPhone: string;
  senderCity?: string;
  senderCountry?: string;
  
  receiverId: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress?: string;
  receiverCity?: string;
  receiverCnic?: string;
  station: string; // e.g. "میرعلی", "ایزی پیسہ", "جیز کیش", "بینک ٹرانسفر"
  payoutMethod?: PaymentMethod;
  bankName?: string;
  accountNumber?: string;
  
  // Financial calculation fields
  amountAED: number;
  exchangeRate: number; // e.g. 74.07, 75.50
  amountPKR: number; // AED * rate
  commissionType: 'percentage' | 'fixed';
  commissionRate: number; // e.g. 1.5%
  commissionBase: 'AED' | 'PKR';
  commissionAmount: number;
  additionalCharges: number;
  totalCollectedAED: number; // AED + commission (if charged to sender)
  netPayablePKR: number; // PKR to be paid to receiver
  
  // Payout tracking
  amountPaidPKR: number;
  remainingBalancePKR: number;
  payouts: Payout[];

  // Station running balance tracking at the time of transfer
  stationBalanceDeducted?: boolean;
  stationPreviousBalancePKR?: number;
  stationNewBalancePKR?: number;
  
  status: TransferStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LoanRepayment {
  id: string;
  loanId: string;
  date: string;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  referenceNo?: string;
  receiptNo: string;
  notes?: string;
  updatedAt?: string;
}

export interface Loan {
  id: string;
  loanNo: string; // e.g. "LN-501"
  borrowerName: string;
  borrowerPhone: string;
  borrowerAddress?: string;
  loanDate: string;
  originalAmount: number;
  currency: Currency;
  dueDate: string;
  expectedDuration: '1_month' | '3_months' | '6_months' | 'custom';
  purpose: string;
  agreedTerms?: string;
  repayments: LoanRepayment[];
  totalRepaid: number;
  remainingBalance: number;
  status: LoanStatus;
  receiptNo: string;
  notes?: string;
  updatedAt?: string;
}

export interface AmanatEntry {
  id: string;
  accountId: string;
  date: string;
  type: AmanatEntryType;
  amount: number;
  currency: Currency;
  description: string;
  relatedPerson?: string; // recipient or intermediary
  previousBalance: number;
  newBalance: number;
  receiptNo: string;
  paymentMethod?: PaymentMethod;
  bankName?: string;
  notes?: string;
  updatedAt?: string;
}

export interface AmanatAccount {
  id: string;
  accountNo: string; // e.g. "AMN-301"
  ownerName: string;
  ownerPhone: string;
  ownerAddress?: string;
  city: string;
  currency: Currency;
  openedDate: string;
  currentBalance: number;
  entries: AmanatEntry[];
  notes?: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  type: 'cash_in' | 'cash_out';
  category: 
    | 'transfer_received'
    | 'transfer_payout'
    | 'commission_income'
    | 'loan_disbursed'
    | 'loan_repayment'
    | 'amanat_deposit'
    | 'amanat_withdrawal'
    | 'amanat_third_party'
    | 'expense'
    | 'adjustment';
  amount: number;
  currency: Currency;
  referenceId?: string;
  partyName?: string;
  paymentMethod: PaymentMethod;
  description: string;
  notes?: string;
  updatedAt?: string;
}

export interface BusinessSettings {
  businessNameEn: string;
  businessNameUr: string;
  branchEn: string;
  branchUr: string;
  addressEn: string;
  addressUr: string;
  phoneEn: string;
  phoneUr: string;
  whatsapp: string;
  email: string;
  defaultExchangeRate: number;
  manualRateUpdatedAt?: string;
  manualRateUpdatedBy?: string;
  defaultCommissionPct: number;
  commissionBase: 'AED' | 'PKR';
  receiptPrefix: string;
  orderNumberPrefix: string;
  defaultLanguage: Language;
  receiptFooterEn: string;
  receiptFooterUr: string;
  receiptFooterCashJamahUr?: string;
  receiptFooterCashJamahEn?: string;
  receiptFooterDepositUr?: string;
  receiptFooterDepositEn?: string;
  receiptFooterLoanUr?: string;
  receiptFooterLoanEn?: string;
  receiptHeaderTitleUr?: string;
  receiptCustomerLabelUr?: string;
  customLogoUrl?: string;
}

export interface AppUserPermissions {
  canAccessTransfers?: boolean;
  canEditTransfers?: boolean;
  canDeleteTransfers?: boolean;
  canAccessOrderList?: boolean;
  canManageStations?: boolean;
  canManageCustomers?: boolean;
  canManageKhata?: boolean;
  canManageAmanat?: boolean;
  canAccessCashLedger?: boolean;
  canViewReports?: boolean;
  canAccessSettings?: boolean;
  canEditExchangeRate?: boolean;
  canManageUsers?: boolean;
}

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'cashier' | 'operator';

export interface AppUser {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  fullNameUr?: string;
  role: UserRole;
  stationAccess: string; // 'all' or specific station like 'میرعلی', 'ایزی پیسہ', 'جیز کیش', 'بینک ٹرانسفر'
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
  permissions?: AppUserPermissions;
}
