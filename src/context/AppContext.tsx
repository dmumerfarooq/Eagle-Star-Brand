/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Language,
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
  UserRole,
  Station,
  PaymentMethod,
  StationTransactionType
} from '../types';
import { translations, formatCurrency, formatNumber } from '../i18n/translations';
import { storage } from '../services/storage';

export type NavScreen =
  | 'dashboard'
  | 'transfers'
  | 'orderRegister'
  | 'customers'
  | 'receivers'
  | 'khata'
  | 'amanat'
  | 'cashLedger'
  | 'reports'
  | 'settings'
  | 'stations';

export type ReceiptModalState = {
  isOpen: boolean;
  format: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'DEP' | 'I' | 'J';
  transfer?: MoneyTransfer;
  payout?: Payout;
  loan?: Loan;
  repayment?: LoanRepayment;
  amanatAccount?: AmanatAccount;
  amanatEntry?: AmanatEntry;
  filteredAmanatEntries?: AmanatEntry[];
  customer?: Customer;
  customerTransfers?: MoneyTransfer[];
  customerLoans?: Loan[];
  customerAmanat?: AmanatAccount;
  depositEntry?: {
    receiptNo: string;
    date: string;
    stationName: string;
    amountPKR: number;
    previousBalancePKR?: number;
    newBalancePKR?: number;
    deductedOverdraftPKR?: number;
    paymentMethod?: string;
    bankName?: string;
    accountNumber?: string;
    referenceNo?: string;
    relatedParty?: string;
    description: string;
    notes?: string;
    txType?: string;
  };
  batchTransfers?: MoneyTransfer[];
  batchLoans?: Loan[];
  batchAmanat?: AmanatAccount[];
  reportTitle?: string;
  reportDateRange?: string;
  filterStation?: string;
  filterDate?: string;
};

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
  formatMoney: (amount: number, currency: 'AED' | 'PKR') => string;
  formatNum: (num: number) => string;
  
  // Navigation
  currentScreen: NavScreen;
  setCurrentScreen: (screen: NavScreen) => void;
  selectedOrderListStation: string;
  setSelectedOrderListStation: (station: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // Data
  customers: Customer[];
  receivers: Receiver[];
  transfers: MoneyTransfer[];
  loans: Loan[];
  amanatAccounts: AmanatAccount[];
  ledger: LedgerEntry[];
  settings: BusinessSettings;
  stations: Station[];
  savedBanks: string[];
  
  // Actions
  saveCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  saveReceiver: (receiver: Receiver) => void;
  deleteReceiver: (id: string) => void;
  saveTransfer: (transfer: MoneyTransfer) => MoneyTransfer;
  deleteTransfer: (id: string) => void;
  recordPayout: (transferId: string, payout: Payout) => void;
  saveLoan: (loan: Loan) => Loan;
  deleteLoan: (id: string) => void;
  recordLoanRepayment: (loanId: string, repayment: LoanRepayment) => Loan | null;
  updateLoanRepayment: (loanId: string, repaymentId: string, updatedData: Partial<LoanRepayment>) => void;
  deleteLoanRepayment: (loanId: string, repaymentId: string) => void;
  saveAmanatAccount: (account: AmanatAccount) => AmanatAccount;
  deleteAmanatAccount: (accountId: string) => void;
  recordAmanatEntry: (accountId: string, entry: Omit<AmanatEntry, 'id' | 'previousBalance' | 'newBalance'>) => AmanatAccount | null;
  updateAmanatEntry: (accountId: string, entryId: string, updatedData: Partial<AmanatEntry>) => void;
  deleteAmanatEntry: (accountId: string, entryId: string) => void;
  addLedgerEntry: (entry: LedgerEntry) => void;
  updateLedgerEntry: (entry: LedgerEntry) => void;
  deleteLedgerEntry: (id: string) => void;
  saveStation: (station: Station) => void;
  deleteStation: (id: string) => { success: boolean; error?: string };
  updateStationStatus: (id: string, status: 'active' | 'inactive') => void;
  recordStationDeposit: (
    stationId: string,
    entry: {
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
  ) => void;
  updateStationDeposit: (
    stationId: string,
    entryId: string,
    entry: {
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
  ) => void;
  deleteStationEntry: (stationId: string, entryId: string) => void;
  addSavedBank: (bankName: string) => void;
  updateSavedBank: (oldName: string, newName: string) => void;
  deleteSavedBank: (bankName: string) => void;
  updateSettings: (settings: BusinessSettings) => void;
  updateManualAedRate: (rate: number) => { success: boolean; error?: string };
  refreshData: () => void;
  resetDemoData: () => void;
  clearAllData: () => void;
  
  // Auth & RBAC
  currentUser: AppUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  users: AppUser[];
  saveUser: (user: AppUser) => void;
  deleteUser: (userId: string) => { success: boolean; error?: string };
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isCashier: boolean;
  canManageUsers: boolean;
  canEditSettings: boolean;
  canDeleteRecords: boolean;
  canViewReports: boolean;
  canEditExchangeRate: boolean;
  canManageStations: boolean;
  canAccessTransfers: boolean;
  canEditTransfers: boolean;
  canDeleteTransfers: boolean;
  canAccessOrderList: boolean;
  canManageCustomers: boolean;
  canManageKhata: boolean;
  canManageAmanat: boolean;
  canAccessCashLedger: boolean;
  canAccessSettings: boolean;

  // Transfer modal
  isTransferModalOpen: boolean;
  selectedTransferForEdit: MoneyTransfer | null;
  openNewTransferModal: () => void;
  openEditTransferModal: (transfer: MoneyTransfer) => void;
  closeTransferModal: () => void;

  // Receipts modal
  receiptModal: ReceiptModalState;
  openReceipt: (options: Omit<ReceiptModalState, 'isOpen'>) => void;
  closeReceipt: () => void;

  // Toast
  toast: { message: string; type: 'success' | 'info' | 'error' } | null;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => storage.getLanguage());
  const [currentScreen, setCurrentScreen] = useState<NavScreen>('dashboard');
  const [selectedOrderListStation, setSelectedOrderListStation] = useState<string>('all');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Core state
  const [customers, setCustomers] = useState<Customer[]>(() => storage.getCustomers());
  const [receivers, setReceivers] = useState<Receiver[]>(() => storage.getReceivers());
  const [transfers, setTransfers] = useState<MoneyTransfer[]>(() => storage.getTransfers());
  const [loans, setLoans] = useState<Loan[]>(() => storage.getLoans());
  const [amanatAccounts, setAmanatAccounts] = useState<AmanatAccount[]>(() => storage.getAmanatAccounts());
  const [ledger, setLedger] = useState<LedgerEntry[]>(() => storage.getLedgerEntries());
  const [settings, setSettings] = useState<BusinessSettings>(() => storage.getSettings());
  const [stations, setStations] = useState<Station[]>(() => storage.getStations());
  const [savedBanks, setSavedBanks] = useState<string[]>(() => storage.getSavedBanks());

  // Users & Auth state
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => storage.getAuthUser());
  const [users, setUsers] = useState<AppUser[]>(() => storage.getUsers());

  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [selectedTransferForEdit, setSelectedTransferForEdit] = useState<MoneyTransfer | null>(null);

  const openNewTransferModal = () => {
    setSelectedTransferForEdit(null);
    setIsTransferModalOpen(true);
  };

  const openEditTransferModal = (transfer: MoneyTransfer) => {
    setSelectedTransferForEdit(transfer);
    setIsTransferModalOpen(true);
  };

  const closeTransferModal = () => {
    setIsTransferModalOpen(false);
    setSelectedTransferForEdit(null);
  };

  // Receipt Modal
  const [receiptModal, setReceiptModal] = useState<ReceiptModalState>({
    isOpen: false,
    format: 'A'
  });

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const refreshData = () => {
    setCustomers(storage.getCustomers());
    setReceivers(storage.getReceivers());
    setTransfers(storage.getTransfers());
    setLoans(storage.getLoans());
    setAmanatAccounts(storage.getAmanatAccounts());
    setLedger(storage.getLedgerEntries());
    setSettings(storage.getSettings());
    setUsers(storage.getUsers());
    setStations(storage.getStations());
    setSavedBanks(storage.getSavedBanks());
  };

  useEffect(() => {
    storage.syncWithServer().then(didUpdate => {
      if (didUpdate) {
        refreshData();
      }
    });
  }, []);

  // Auth & RBAC handlers
  const login = (username: string, password: string): { success: boolean; error?: string } => {
    const trimmedUser = username.trim().toLowerCase();
    const userList = storage.getUsers();
    const foundUser = userList.find(u => u.username.toLowerCase() === trimmedUser);

    if (!foundUser) {
      return {
        success: false,
        error: language === 'ur' ? 'غلط یوزر نام درج کیا گیا ہے!' : 'Invalid username entered!'
      };
    }

    if (foundUser.password && foundUser.password !== password) {
      return {
        success: false,
        error: language === 'ur' ? 'غلط پاس ورڈ درج کیا گیا ہے!' : 'Incorrect password!'
      };
    }

    if (foundUser.status === 'inactive') {
      return {
        success: false,
        error: language === 'ur' ? 'یہ اکاؤنٹ غیر فعال (Inactive) کر دیا گیا ہے۔ براہ کرم سپر ایڈمن سے رابطہ کریں۔' : 'This account has been deactivated. Please contact the Super Admin.'
      };
    }

    const updatedUser: AppUser = {
      ...foundUser,
      lastLogin: new Date().toISOString()
    };

    storage.saveUser(updatedUser);
    storage.saveAuthUser(updatedUser);
    setCurrentUser(updatedUser);
    setUsers(storage.getUsers());
    showToast(
      language === 'ur' ? `خوش آمدید، ${updatedUser.fullName}` : `Welcome back, ${updatedUser.fullName}`,
      'success'
    );
    return { success: true };
  };

  const logout = () => {
    storage.saveAuthUser(null);
    setCurrentUser(null);
    showToast(language === 'ur' ? 'کامیابی سے لاگ آؤٹ ہو گئے۔' : 'Logged out successfully', 'info');
  };

  const saveUser = (user: AppUser) => {
    if (!isSuperAdmin) {
      showToast(
        language === 'ur'
          ? 'صارفین بنانا یا اختیارات تبدیل کرنا صرف سپر ایڈمن (Super Admin) کے اختیار میں ہے!'
          : 'Only Super Admin can create or modify users!',
        'error'
      );
      return;
    }
    storage.saveUser(user);
    setUsers(storage.getUsers());
    if (currentUser && (currentUser.id === user.id || currentUser.username === user.username)) {
      setCurrentUser(user);
      storage.saveAuthUser(user);
    }
    showToast(language === 'ur' ? 'صارف کا ریکارڈ محفوظ ہو گیا۔' : 'User saved successfully', 'success');
  };

  const deleteUser = (userId: string): { success: boolean; error?: string } => {
    if (!isSuperAdmin) {
      return {
        success: false,
        error: language === 'ur' ? 'صارفین کو حذف کرنا صرف سپر ایڈمن کے اختیار میں ہے!' : 'Only Super Admin can delete users!'
      };
    }
    if (currentUser && currentUser.id === userId) {
      return {
        success: false,
        error: language === 'ur' ? 'آپ اپنے جاری اکاؤنٹ کو حذف نہیں کر سکتے!' : 'You cannot delete your own active account!'
      };
    }
    const success = storage.deleteUser(userId);
    if (success) {
      setUsers(storage.getUsers());
      showToast(language === 'ur' ? 'صارف کو کامیابی سے خارج کر دیا گیا۔' : 'User removed successfully', 'info');
      return { success: true };
    } else {
      return {
        success: false,
        error: language === 'ur' ? 'بنیادی سپر ایڈمن (dsumerf@gmail.com) یا ایڈمن (admin) کو حذف کرنا ممنوع ہے!' : 'Primary super admin (dsumerf@gmail.com) or admin cannot be deleted!'
      };
    }
  };

  // RBAC Permission indicators
  const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.username.toLowerCase() === 'dsumerf@gmail.com';
  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const isCashier = currentUser?.role === 'cashier';

  // Super Admin exclusive controls & granular user permissions granted by Super Admin
  const canEditSettings = isSuperAdmin;
  const canManageUsers = isSuperAdmin || (currentUser?.permissions?.canManageUsers ?? false);
  const canAccessSettings = isSuperAdmin || (currentUser?.permissions?.canAccessSettings ?? false);

  // Granular rights: Exchange rate and delete actions
  const canEditExchangeRate = isSuperAdmin || (currentUser?.permissions?.canEditExchangeRate ?? false);
  const canAccessTransfers = isSuperAdmin || (currentUser?.permissions?.canAccessTransfers ?? true);
  const canEditTransfers = isSuperAdmin || (currentUser?.permissions?.canEditTransfers ?? (isAdmin || isManager || isCashier));
  const canDeleteTransfers = isSuperAdmin || isAdmin || (currentUser?.permissions?.canDeleteTransfers ?? false);
  const canDeleteRecords = isSuperAdmin || isAdmin || (currentUser?.permissions?.canDeleteTransfers ?? false);
  const canAccessOrderList = isSuperAdmin || (currentUser?.permissions?.canAccessOrderList ?? true);
  const canManageStations = isSuperAdmin || (currentUser?.permissions?.canManageStations ?? (isAdmin || isManager));
  const canManageCustomers = isSuperAdmin || (currentUser?.permissions?.canManageCustomers ?? true);
  const canManageKhata = isSuperAdmin || (currentUser?.permissions?.canManageKhata ?? (isAdmin || isManager || isCashier));
  const canManageAmanat = isSuperAdmin || (currentUser?.permissions?.canManageAmanat ?? (isAdmin || isManager || isCashier));
  const canAccessCashLedger = isSuperAdmin || (currentUser?.permissions?.canAccessCashLedger ?? (isAdmin || isManager || isCashier));
  const canViewReports = isSuperAdmin || (currentUser?.permissions?.canViewReports ?? (isAdmin || isManager));

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    storage.saveLanguage(lang);
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ur' ? 'rtl' : 'ltr');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ur' : 'en');
  };

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', language === 'ur' ? 'rtl' : 'ltr');
    const brandTitle =
      language === 'ur'
        ? settings.businessNameUr || 'ایگل اسٹار برانڈ'
        : settings.businessNameEn || 'Eagle Star Brand';
    document.title = `${brandTitle} - Money Transfer & Khata Ledger`;
  }, [language, settings.businessNameEn, settings.businessNameUr]);

  const t = (key: string): string => {
    const langDict = translations[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to English
    return translations.en[key] || key;
  };

  const formatMoney = (amount: number, currency: 'AED' | 'PKR'): string => {
    return formatCurrency(amount, currency, language);
  };

  const formatNum = (num: number): string => {
    return formatNumber(num, language);
  };

  const denyDeleteIfNotSuperAdmin = (): boolean => {
    if (!isSuperAdmin && !isAdmin && !currentUser?.permissions?.canDeleteTransfers) {
      showToast(
        language === 'ur'
          ? 'ڈیٹا حذف (Delete) کرنے کا اختیار صرف ایڈمنسٹریٹر کے پاس ہے!'
          : 'Only Administrator has permission to delete records!',
        'error'
      );
      return true;
    }
    return false;
  };

  // Mutators
  const saveCustomer = (customer: Customer) => {
    storage.saveCustomer(customer);
    setCustomers(storage.getCustomers());
    setTransfers(storage.getTransfers());
    showToast(t('customerSaved'), 'success');
  };

  const deleteCustomer = (id: string) => {
    if (denyDeleteIfNotSuperAdmin()) return;
    storage.deleteCustomer(id);
    setCustomers(storage.getCustomers());
    showToast(language === 'ur' ? 'ریکارڈ کامیابی سے حذف کر دیا گیا' : 'Deleted successfully', 'info');
  };

  const saveReceiver = (receiver: Receiver) => {
    storage.saveReceiver(receiver);
    setReceivers(storage.getReceivers());
    setTransfers(storage.getTransfers());
    showToast(t('receiverSaved'), 'success');
  };

  const deleteReceiver = (id: string) => {
    if (denyDeleteIfNotSuperAdmin()) return;
    storage.deleteReceiver(id);
    setReceivers(storage.getReceivers());
    showToast(language === 'ur' ? 'ریکارڈ کامیابی سے حذف کر دیا گیا' : 'Deleted successfully', 'info');
  };

  const saveTransfer = (transfer: MoneyTransfer): MoneyTransfer => {
    const saved = storage.saveTransfer(transfer);
    setTransfers(storage.getTransfers());
    setLedger(storage.getLedgerEntries());
    setStations(storage.getStations());
    setAmanatAccounts(storage.getAmanatAccounts());
    showToast(t('transferSaved'), 'success');
    return saved;
  };

  const deleteTransfer = (id: string) => {
    if (denyDeleteIfNotSuperAdmin()) return;
    storage.deleteTransfer(id);
    setTransfers(storage.getTransfers());
    setStations(storage.getStations());
    setAmanatAccounts(storage.getAmanatAccounts());
    setLedger(storage.getLedgerEntries());
    showToast(language === 'ur' ? 'ٹرانسفر ریکارڈ حذف کر دیا گیا اور بیلنس اپ ڈیٹ ہو گیا' : 'Deleted and balances recalculated', 'info');
  };

  const recordPayout = (transferId: string, payout: Payout) => {
    const updated = storage.addPayout(transferId, payout);
    if (updated) {
      setTransfers(storage.getTransfers());
      setLedger(storage.getLedgerEntries());
      setStations(storage.getStations());
      showToast(t('payoutSaved').replace('{amount}', formatNumber(payout.amountPKR, language)), 'success');
    }
  };

  const saveLoan = (loan: Loan): Loan => {
    const saved = storage.saveLoan(loan);
    setLoans(storage.getLoans());
    setLedger(storage.getLedgerEntries());
    showToast(t('loanSaved'), 'success');
    return saved;
  };

  const deleteLoan = (id: string) => {
    if (denyDeleteIfNotSuperAdmin()) return;
    storage.deleteLoan(id);
    setLoans(storage.getLoans());
    setLedger(storage.getLedgerEntries());
    showToast(language === 'ur' ? 'قرضہ ریکارڈ حذف کر دیا گیا' : 'Deleted successfully', 'info');
  };

  const recordLoanRepayment = (loanId: string, repayment: LoanRepayment): Loan | null => {
    const updated = storage.addLoanRepayment(loanId, repayment);
    if (updated) {
      setLoans(storage.getLoans());
      setLedger(storage.getLedgerEntries());
      if (repayment.entryType === 'additional_loan') {
        showToast(
          language === 'ur'
            ? 'مزید قرض شامل ہو گیا اور بقایا کھاتہ اپ ڈیٹ کر دیا گیا!'
            : 'Additional loan recorded and balance updated!',
          'success'
        );
      } else {
        showToast(t('repaymentSaved'), 'success');
      }
    }
    return updated;
  };

  const updateLoanRepayment = (loanId: string, repaymentId: string, updatedData: Partial<LoanRepayment>) => {
    const updated = storage.updateLoanRepayment(loanId, repaymentId, updatedData);
    if (updated) {
      setLoans(storage.getLoans());
      setLedger(storage.getLedgerEntries());
      showToast(
        language === 'ur'
          ? 'قرض واپسی ریکارڈ اپ ڈیٹ ہو گیا اور بقایا بیلنس درست کر دیا گیا!'
          : 'Repayment updated and loan balance recalculated!',
        'success'
      );
    }
  };

  const deleteLoanRepayment = (loanId: string, repaymentId: string) => {
    if (denyDeleteIfNotSuperAdmin()) return;
    const updated = storage.deleteLoanRepayment(loanId, repaymentId);
    if (updated) {
      setLoans(storage.getLoans());
      setLedger(storage.getLedgerEntries());
      showToast(
        language === 'ur'
          ? 'قرض واپسی انٹری حذف کر کے بقایا قرض اپ ڈیٹ کر دیا گیا!'
          : 'Repayment entry deleted and loan balance recalculated!',
        'info'
      );
    }
  };

  const saveAmanatAccount = (account: AmanatAccount): AmanatAccount => {
    const saved = storage.saveAmanatAccount(account);
    setAmanatAccounts(storage.getAmanatAccounts());
    setLedger(storage.getLedgerEntries());
    showToast(t('amanatSaved'), 'success');
    return saved;
  };

  const deleteAmanatAccount = (accountId: string) => {
    if (denyDeleteIfNotSuperAdmin()) return;
    storage.deleteAmanatAccount(accountId);
    setAmanatAccounts(storage.getAmanatAccounts());
    setLedger(storage.getLedgerEntries());
    showToast(
      language === 'ur' ? 'پیسہ جمع کھاتہ کامیابی سے حذف کر دیا گیا' : 'Cash Jama account deleted successfully',
      'info'
    );
  };

  const recordAmanatEntry = (accountId: string, entry: Omit<AmanatEntry, 'id' | 'previousBalance' | 'newBalance'>): AmanatAccount | null => {
    const updated = storage.addAmanatEntry(accountId, entry);
    if (updated) {
      setAmanatAccounts(storage.getAmanatAccounts());
      setLedger(storage.getLedgerEntries());
      showToast(t('amanatSaved'), 'success');
    }
    return updated;
  };

  const updateAmanatEntry = (accountId: string, entryId: string, updatedData: Partial<AmanatEntry>) => {
    const updated = storage.updateAmanatEntry(accountId, entryId, updatedData);
    if (updated) {
      setAmanatAccounts(storage.getAmanatAccounts());
      setLedger(storage.getLedgerEntries());
      showToast(
        language === 'ur'
          ? 'پیسہ جمع ہسٹری اپ ڈیٹ ہو گئی اور کھاتہ بیلنس خودکار طور پر درست ہو گیا!'
          : 'Cash Jama history entry updated and running balances recalculated!',
        'success'
      );
    }
  };

  const deleteAmanatEntry = (accountId: string, entryId: string) => {
    if (denyDeleteIfNotSuperAdmin()) return;
    const updated = storage.deleteAmanatEntry(accountId, entryId);
    if (updated) {
      setAmanatAccounts(storage.getAmanatAccounts());
      setLedger(storage.getLedgerEntries());
      showToast(
        language === 'ur'
          ? 'پیسہ جمع انٹری حذف کر دی گئی اور موجودہ بیلنس اپ ڈیٹ ہو گیا!'
          : 'Cash Jama entry deleted and running balances recalculated!',
        'info'
      );
    }
  };

  const addLedgerEntry = (entry: LedgerEntry) => {
    storage.addLedgerEntry(entry);
    setLedger(storage.getLedgerEntries());
    showToast(language === 'ur' ? 'کیش بک انٹری محفوظ ہو گئی' : 'Cash book entry saved', 'success');
  };

  const updateLedgerEntry = (entry: LedgerEntry) => {
    storage.updateLedgerEntry(entry);
    setLedger(storage.getLedgerEntries());
    showToast(language === 'ur' ? 'کیش بک ہسٹری اپ ڈیٹ ہو گئی' : 'Cash book entry updated', 'success');
  };

  const deleteLedgerEntry = (id: string) => {
    if (denyDeleteIfNotSuperAdmin()) return;
    storage.deleteLedgerEntry(id);
    setLedger(storage.getLedgerEntries());
    showToast(language === 'ur' ? 'کیش بک انٹری حذف کر دی گئی' : 'Cash book entry deleted', 'info');
  };

  const updateSettings = (newSettings: BusinessSettings) => {
    // If user is not super admin, prevent unauthorized changes to default exchange rate
    if (!isSuperAdmin) {
      newSettings = {
        ...newSettings,
        defaultExchangeRate: settings.defaultExchangeRate,
        manualRateUpdatedAt: settings.manualRateUpdatedAt,
        manualRateUpdatedBy: settings.manualRateUpdatedBy
      };
    }
    storage.saveSettings(newSettings);
    setSettings(newSettings);
    showToast(
      language === 'ur' ? 'تمام ترتیبات کامیابی سے محفوظ ہو گئیں!' : 'Settings saved successfully!',
      'success'
    );
  };

  const updateManualAedRate = (rate: number): { success: boolean; error?: string } => {
    if (!isSuperAdmin) {
      const errorMsg =
        language === 'ur'
          ? 'درہم کی شرح تبادلہ صرف سپر ایڈمن (Super Admin) ہی تبدیل کر سکتے ہیں!'
          : 'Only Super Admin can update the manual AED exchange rate!';
      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }

    if (isNaN(rate) || rate <= 0) {
      const errorMsg =
        language === 'ur'
          ? 'برائے مہربانی درست درہم ریٹ درج کریں (مثلاً 77.50)'
          : 'Please enter a valid AED exchange rate (e.g. 77.50)';
      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }

    const roundedRate = Number(rate.toFixed(2));
    const updated: BusinessSettings = {
      ...settings,
      defaultExchangeRate: roundedRate,
      manualRateUpdatedAt: new Date().toISOString(),
      manualRateUpdatedBy: currentUser?.fullName || currentUser?.username || 'Super Admin'
    };

    storage.saveSettings(updated);
    setSettings(updated);
    showToast(
      language === 'ur'
        ? `درہم کی شرح تبادلہ کامیابی سے تبدیل ہو کر ${roundedRate.toFixed(2)} PKR ہو گئی!`
        : `AED Exchange Rate updated to ${roundedRate.toFixed(2)} PKR successfully!`,
      'success'
    );
    return { success: true };
  };

  const saveStation = (station: Station) => {
    storage.saveStation(station);
    setStations(storage.getStations());
    setTransfers(storage.getTransfers());
    setReceivers(storage.getReceivers());
    showToast(
      language === 'ur'
        ? `اسٹیشن "${station.nameUr || station.nameEn}" کامیابی سے محفوظ ہو گیا!`
        : `Station "${station.nameEn || station.nameUr}" saved successfully!`,
      'success'
    );
  };

  const deleteStation = (id: string): { success: boolean; error?: string } => {
    if (denyDeleteIfNotSuperAdmin()) {
      return { success: false, error: 'Only Super Admin can delete stations' };
    }
    const target = stations.find(s => s.id === id);
    if (!target) return { success: false, error: 'Station not found' };

    const success = storage.deleteStation(id);
    if (success) {
      setStations(storage.getStations());
      setLedger(storage.getLedgerEntries());
      showToast(
        language === 'ur'
          ? `اسٹیشن "${target.nameUr || target.nameEn}" حذف کر دیا گیا`
          : `Station "${target.nameEn || target.nameUr}" deleted successfully`,
        'info'
      );
      return { success: true };
    }
    return { success: false, error: 'Failed to delete station' };
  };

  const updateStationStatus = (id: string, status: 'active' | 'inactive') => {
    const target = stations.find(s => s.id === id);
    if (!target) return;
    const updated: Station = { ...target, status };
    storage.saveStation(updated);
    setStations(storage.getStations());
    showToast(
      language === 'ur'
        ? `اسٹیشن "${target.nameUr}" کی حالت ${status === 'active' ? 'فعال' : 'غیر فعال'} کر دی گئی`
        : `Station status set to ${status}`,
      'success'
    );
  };

  const recordStationDeposit = (
    stationId: string,
    entry: {
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
  ) => {
    const updated = storage.recordStationDeposit(stationId, entry);
    if (updated) {
      setStations(storage.getStations());
      setTransfers(storage.getTransfers());
      setLedger(storage.getLedgerEntries());
      setSavedBanks(storage.getSavedBanks());
      showToast(
        language === 'ur'
          ? `اسٹیشن "${updated.nameUr}" کے کیش کھاتے میں ${formatNumber(entry.amountPKR, language)} PKR کا اندراج ہو گیا!`
          : `Station deposit of ${formatNumber(entry.amountPKR, language)} PKR recorded successfully!`,
        'success'
      );
    }
  };

  const updateStationDeposit = (
    stationId: string,
    entryId: string,
    entry: {
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
  ) => {
    const updated = storage.updateStationDeposit(stationId, entryId, entry);
    if (updated) {
      setStations(storage.getStations());
      setTransfers(storage.getTransfers());
      setLedger(storage.getLedgerEntries());
      setSavedBanks(storage.getSavedBanks());
      showToast(
        language === 'ur'
          ? `اسٹیشن "${updated.nameUr}" کا ریکارڈ کامیابی سے اپ ڈیٹ ہو گیا اور تمام بیلنس درست کر دیے گئے!`
          : `Station ledger record updated and all dependent balances recalculated!`,
        'success'
      );
    }
  };

  const deleteStationEntry = (stationId: string, entryId: string) => {
    if (denyDeleteIfNotSuperAdmin()) return;
    const updated = storage.deleteStationEntry(stationId, entryId);
    if (updated) {
      setStations(storage.getStations());
      setTransfers(storage.getTransfers());
      setLedger(storage.getLedgerEntries());
      showToast(
        language === 'ur'
          ? `اسٹیشن "${updated.nameUr}" کا انٹری ریکارڈ حذف کر کے بیلنس اپ ڈیٹ کر دیا گیا!`
          : `Station entry deleted and running balance recalculated!`,
        'info'
      );
    }
  };

  const addSavedBank = (bankName: string) => {
    const clean = bankName.trim();
    if (!clean) return;
    const updated = storage.addSavedBank(clean);
    setSavedBanks(updated);
    showToast(
      language === 'ur' ? `بینک / چینل "${clean}" فہرست میں شامل کر دیا گیا!` : `Bank "${clean}" added to saved list!`,
      'success'
    );
  };

  const updateSavedBank = (oldName: string, newName: string) => {
    const clean = newName.trim();
    if (!clean) return;
    const updated = storage.updateSavedBank(oldName, clean);
    setSavedBanks(updated);
    showToast(
      language === 'ur' ? `بینک کا نام "${clean}" اپ ڈیٹ ہو گیا!` : `Bank name updated to "${clean}"!`,
      'success'
    );
  };

  const deleteSavedBank = (bankName: string) => {
    if (denyDeleteIfNotSuperAdmin()) return;
    const updated = storage.deleteSavedBank(bankName);
    setSavedBanks(updated);
    showToast(
      language === 'ur' ? `بینک "${bankName}" فہرست سے ہٹا دیا گیا` : `Bank "${bankName}" removed from list`,
      'info'
    );
  };

  const resetDemoData = async () => {
    if (denyDeleteIfNotSuperAdmin()) return;
    await storage.resetToDemo();
    refreshData();
    showToast(t('dataReset'), 'info');
  };

  const clearAllData = async () => {
    if (denyDeleteIfNotSuperAdmin()) return;
    await storage.clearAllData();
    refreshData();
    showToast(
      language === 'ur' ? 'تمام ریکارڈز کامیابی سے صاف کر دیے گئے' : 'All records cleared',
      'info'
    );
  };

  const openReceipt = (options: Omit<ReceiptModalState, 'isOpen'>) => {
    setReceiptModal({
      ...options,
      isOpen: true
    });
  };

  const closeReceipt = () => {
    setReceiptModal(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        formatMoney,
        formatNum,
        currentScreen,
        setCurrentScreen,
        selectedOrderListStation,
        setSelectedOrderListStation,
        sidebarOpen,
        setSidebarOpen,
        customers,
        receivers,
        transfers,
        loans,
        amanatAccounts,
        ledger,
        settings,
        stations,
        savedBanks,
        saveCustomer,
        deleteCustomer,
        saveReceiver,
        deleteReceiver,
        saveTransfer,
        deleteTransfer,
        recordPayout,
        saveLoan,
        deleteLoan,
        recordLoanRepayment,
        updateLoanRepayment,
        deleteLoanRepayment,
        saveAmanatAccount,
        deleteAmanatAccount,
        recordAmanatEntry,
        updateAmanatEntry,
        deleteAmanatEntry,
        addLedgerEntry,
        updateLedgerEntry,
        deleteLedgerEntry,
        saveStation,
        deleteStation,
        updateStationStatus,
        recordStationDeposit,
        updateStationDeposit,
        deleteStationEntry,
        addSavedBank,
        updateSavedBank,
        deleteSavedBank,
        updateSettings,
        updateManualAedRate,
        refreshData,
        resetDemoData,
        clearAllData,
        // Transfer modal
        isTransferModalOpen,
        selectedTransferForEdit,
        openNewTransferModal,
        openEditTransferModal,
        closeTransferModal,
        // Receipt modal
        receiptModal,
        openReceipt,
        closeReceipt,
        toast,
        showToast,
        // Auth & RBAC
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        logout,
        users,
        saveUser,
        deleteUser,
        isSuperAdmin,
        isAdmin,
        isManager,
        isCashier,
        canManageUsers,
        canEditSettings,
        canDeleteRecords,
        canViewReports,
        canEditExchangeRate,
        canManageStations,
        canAccessTransfers,
        canEditTransfers,
        canDeleteTransfers,
        canAccessOrderList,
        canManageCustomers,
        canManageKhata,
        canManageAmanat,
        canAccessCashLedger,
        canAccessSettings
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
