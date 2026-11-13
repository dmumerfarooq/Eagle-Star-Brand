/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer, Receiver, MoneyTransfer, Loan, AmanatAccount, AmanatEntry } from '../../types';
import { EagleStarLogo } from '../common/EagleStarLogo';
import {
  Plus,
  Search,
  Phone,
  MapPin,
  ArrowRightLeft,
  BookOpen,
  X,
  Edit3,
  Trash2,
  Printer,
  Receipt,
  Calendar,
  RotateCcw,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  User,
  CreditCard
} from 'lucide-react';

export interface CustomersViewProps {
  onOpenNewTransfer?: () => void;
  onEditTransfer?: (transfer: MoneyTransfer) => void;
  onOpenNewAmanat?: (account?: AmanatAccount, mode?: 'new_account' | 'add_entry' | 'withdraw_entry') => void;
  onOpenNewLoan?: () => void;
  onRecordRepayment?: (loan: Loan) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  onOpenNewTransfer,
  onEditTransfer,
  onOpenNewAmanat,
  onOpenNewLoan,
  onRecordRepayment
}) => {
  const {
    customers,
    receivers,
    transfers,
    loans,
    amanatAccounts,
    saveCustomer,
    deleteCustomer,
    saveReceiver,
    deleteReceiver,
    deleteTransfer,
    deleteLoan,
    deleteAmanatEntry,
    openReceipt,
    openEditTransferModal,
    t,
    language,
    formatMoney,
    isSuperAdmin,
    canManageCustomers,
    canEditTransfers,
    canDeleteTransfers,
    canDeleteRecords
  } = useApp();

  const [activeTab, setActiveTab] = useState<'senders' | 'receivers'>('senders');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Filter inside customer statement modal
  const [statementSubTab, setStatementSubTab] = useState<'all' | 'transfers' | 'amanat' | 'loans'>('all');
  const [statementSearch, setStatementSearch] = useState('');
  const [statementDatePreset, setStatementDatePreset] = useState<'all' | 'today' | '7days' | 'month' | 'custom'>('all');
  const [statementDateFrom, setStatementDateFrom] = useState('');
  const [statementDateTo, setStatementDateTo] = useState('');

  // New / Edit Customer Modal
  const [isNewCustOpen, setIsNewCustOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [custName, setCustName] = useState('');
  const [custNameUr, setCustNameUr] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custCity, setCustCity] = useState('Dubai');
  const [custAddress, setCustAddress] = useState('');

  // New / Edit Receiver Modal
  const [isNewRecOpen, setIsNewRecOpen] = useState(false);
  const [editingReceiver, setEditingReceiver] = useState<Receiver | null>(null);
  const [recName, setRecName] = useState('');
  const [recNameUr, setRecNameUr] = useState('');
  const [recPhone, setRecPhone] = useState('');
  const [recStation, setRecStation] = useState('میرعلی');
  const [recCity, setRecCity] = useState('North Waziristan');

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteTransferId, setConfirmDeleteTransferId] = useState<string | null>(null);
  const [confirmDeleteLoanId, setConfirmDeleteLoanId] = useState<string | null>(null);
  const [confirmDeleteAmanatEntryId, setConfirmDeleteAmanatEntryId] = useState<string | null>(null);

  // Helper matching functions for Customer associations
  const getCustomerTransfers = (cust: Customer): MoneyTransfer[] => {
    return transfers.filter(
      tr =>
        tr.senderId === cust.id ||
        (tr.senderPhone && cust.phone && tr.senderPhone === cust.phone) ||
        tr.senderName.trim().toLowerCase() === cust.name.trim().toLowerCase()
    );
  };

  const getCustomerAmanat = (cust: Customer): AmanatAccount | undefined => {
    return amanatAccounts.find(
      a =>
        a.id === cust.id ||
        (a.ownerPhone && cust.phone && a.ownerPhone === cust.phone) ||
        a.ownerName.trim().toLowerCase() === cust.name.trim().toLowerCase() ||
        a.accountNo === cust.customerCode
    );
  };

  const getCustomerLoans = (cust: Customer): Loan[] => {
    return loans.filter(
      l =>
        l.borrowerName.trim().toLowerCase() === cust.name.trim().toLowerCase() ||
        (l.borrowerPhone && cust.phone && l.borrowerPhone === cust.phone)
    );
  };

  const filteredCustomers = customers.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.nameUr && c.nameUr.toLowerCase().includes(term)) ||
      c.phone.includes(term) ||
      c.customerCode.toLowerCase().includes(term) ||
      (c.city && c.city.toLowerCase().includes(term))
    );
  });

  const filteredReceivers = receivers.filter(r => {
    const term = searchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(term) ||
      (r.nameUr && r.nameUr.toLowerCase().includes(term)) ||
      r.phone.includes(term) ||
      r.station.toLowerCase().includes(term)
    );
  });

  // Top overall KPI computations
  const totalHeldAmanatPkr = amanatAccounts
    .filter(a => a.currency === 'PKR')
    .reduce((sum, a) => sum + a.currentBalance, 0);
  const totalOutstandingLoanPkr = loans
    .filter(l => l.status !== 'Fully Repaid' && l.remainingBalance > 0 && l.currency === 'PKR')
    .reduce((sum, l) => sum + l.remainingBalance, 0);

  const openAddCustomer = () => {
    setEditingCustomer(null);
    setCustName('');
    setCustNameUr('');
    setCustPhone('');
    setCustCity('Dubai');
    setCustAddress('');
    setIsNewCustOpen(true);
  };

  const openEditCustomer = (cust: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCustomer(cust);
    setCustName(cust.name);
    setCustNameUr(cust.nameUr || '');
    setCustPhone(cust.phone);
    setCustCity(cust.city || 'Dubai');
    setCustAddress(cust.address || '');
    setIsNewCustOpen(true);
  };

  const handleCreateOrSaveCustomer = () => {
    if (!custName.trim()) return;
    if (editingCustomer) {
      const updated: Customer = {
        ...editingCustomer,
        name: custName.trim(),
        nameUr: custNameUr.trim() || undefined,
        phone: custPhone.trim() || editingCustomer.phone,
        city: custCity || 'Dubai',
        address: custAddress.trim()
      };
      saveCustomer(updated);
      if (selectedCustomer && selectedCustomer.id === updated.id) {
        setSelectedCustomer(updated);
      }
    } else {
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        customerCode: `CUST-${Math.floor(100 + Math.random() * 900)}`,
        name: custName.trim(),
        nameUr: custNameUr.trim() || undefined,
        phone: custPhone.trim() || '+971500000000',
        city: custCity || 'Dubai',
        address: custAddress.trim(),
        country: 'United Arab Emirates',
        dateAdded: new Date().toISOString().split('T')[0]
      };
      saveCustomer(newCust);
    }
    setIsNewCustOpen(false);
    setEditingCustomer(null);
  };

  const openAddReceiver = () => {
    setEditingReceiver(null);
    setRecName('');
    setRecNameUr('');
    setRecPhone('');
    setRecStation('میرعلی');
    setRecCity('North Waziristan');
    setIsNewRecOpen(true);
  };

  const openEditReceiver = (rec: Receiver) => {
    setEditingReceiver(rec);
    setRecName(rec.name);
    setRecNameUr(rec.nameUr || '');
    setRecPhone(rec.phone);
    setRecStation(rec.station);
    setRecCity(rec.city || 'Pakistan');
    setIsNewRecOpen(true);
  };

  const handleCreateOrSaveReceiver = () => {
    if (!recName.trim()) return;
    if (editingReceiver) {
      saveReceiver({
        ...editingReceiver,
        name: recName.trim(),
        nameUr: recNameUr.trim() || undefined,
        phone: recPhone.trim() || editingReceiver.phone,
        station: recStation.trim() || editingReceiver.station,
        city: recCity || 'Pakistan'
      });
    } else {
      const newRec: Receiver = {
        id: `rec-${Date.now()}`,
        name: recName.trim(),
        nameUr: recNameUr.trim() || undefined,
        phone: recPhone.trim() || '03000000000',
        station: recStation.trim() || 'میرعلی',
        city: recCity || 'Pakistan',
        country: 'Pakistan'
      };
      saveReceiver(newRec);
    }
    setIsNewRecOpen(false);
    setEditingReceiver(null);
  };

  // Associated records for currently selected customer in modal
  const activeMatchedTransfers = selectedCustomer ? getCustomerTransfers(selectedCustomer) : [];
  const activeMatchedAmanat = selectedCustomer ? getCustomerAmanat(selectedCustomer) : undefined;
  const activeMatchedLoans = selectedCustomer ? getCustomerLoans(selectedCustomer) : [];

  // Filter statement entries by search and date range
  const filterByDateRange = (dateStr: string): boolean => {
    if (statementDatePreset === 'all') return true;
    const today = new Date().toISOString().split('T')[0];
    if (statementDatePreset === 'today') return dateStr === today;
    if (statementDatePreset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return dateStr >= d.toISOString().split('T')[0];
    }
    if (statementDatePreset === 'month') {
      const currentMonth = today.substring(0, 7);
      return dateStr.startsWith(currentMonth);
    }
    if (statementDatePreset === 'custom') {
      if (statementDateFrom && dateStr < statementDateFrom) return false;
      if (statementDateTo && dateStr > statementDateTo) return false;
      return true;
    }
    return true;
  };

  const filteredTransfersForModal = activeMatchedTransfers.filter(tr => {
    if (!filterByDateRange(tr.date)) return false;
    if (statementSearch) {
      const term = statementSearch.toLowerCase();
      return (
        tr.orderNumber.toLowerCase().includes(term) ||
        tr.receiverName.toLowerCase().includes(term) ||
        tr.receiverPhone.includes(term) ||
        tr.station.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const filteredAmanatEntriesForModal = (activeMatchedAmanat?.entries || []).filter(e => {
    if (!filterByDateRange(e.date)) return false;
    if (statementSearch) {
      const term = statementSearch.toLowerCase();
      return (
        e.description.toLowerCase().includes(term) ||
        (e.receiptNo && e.receiptNo.toLowerCase().includes(term)) ||
        (e.relatedPerson && e.relatedPerson.toLowerCase().includes(term))
      );
    }
    return true;
  });

  const filteredLoansForModal = activeMatchedLoans.filter(l => {
    if (!filterByDateRange(l.loanDate)) return false;
    if (statementSearch) {
      const term = statementSearch.toLowerCase();
      return (
        l.loanNo.toLowerCase().includes(term) ||
        (l.purpose && l.purpose.toLowerCase().includes(term)) ||
        (l.receiptNo && l.receiptNo.toLowerCase().includes(term))
      );
    }
    return true;
  });

  // Calculate totals for active customer
  const custTotalTransfersAED = activeMatchedTransfers.reduce(
    (sum, tr) => sum + (tr.totalCollectedAED || tr.amountAED || 0),
    0
  );
  const custTotalTransfersPKR = activeMatchedTransfers.reduce(
    (sum, tr) => sum + (tr.netPayablePKR || tr.amountPKR || 0),
    0
  );
  const custAmanatBalance = activeMatchedAmanat?.currentBalance || 0;
  const custAmanatCurrency = activeMatchedAmanat?.currency || 'PKR';
  const custOutstandingLoan = activeMatchedLoans.reduce((sum, l) => sum + Math.max(0, l.remainingBalance), 0);
  const custLoanExtraCredit = activeMatchedLoans.reduce(
    (sum, l) => sum + (l.remainingBalance < 0 ? Math.abs(l.remainingBalance) : 0),
    0
  );

  // Trigger Print Complete Statement (Format J)
  const handlePrintCustomerStatement = (cust: Customer) => {
    const custTransfers = getCustomerTransfers(cust);
    const custAmanat = getCustomerAmanat(cust);
    const custLoans = getCustomerLoans(cust);

    const dateRangeLabel =
      statementDatePreset === 'today'
        ? (language === 'ur' ? 'صرف آج کی تاریخ' : 'Today Only')
        : statementDatePreset === '7days'
        ? (language === 'ur' ? 'گزشتہ 7 دن' : 'Last 7 Days')
        : statementDatePreset === 'month'
        ? (language === 'ur' ? 'رواں ماہ' : 'Current Month')
        : statementDatePreset === 'custom' && (statementDateFrom || statementDateTo)
        ? `${statementDateFrom || 'شروع'} → ${statementDateTo || 'آج'}`
        : (language === 'ur' ? 'مکمل تاریخی ریکارڈ' : 'Complete All-Time History');

    openReceipt({
      format: 'J',
      customer: cust,
      customerTransfers: custTransfers,
      customerAmanat: custAmanat,
      customerLoans: custLoans,
      reportTitle: language === 'ur' ? `گاہک جامع کھاتہ اسٹیٹمنٹ (${cust.name})` : `Customer Comprehensive Statement (${cust.name})`,
      reportDateRange: dateRangeLabel
    });
  };

  // Build combined chronological ledger for "All" tab
  type CombinedTransaction = {
    id: string;
    date: string;
    type: 'transfer' | 'amanat_deposit' | 'amanat_withdrawal' | 'loan_disbursed' | 'loan_repaid';
    refNo: string;
    title: string;
    details: string;
    channel: string;
    amountIn?: number;
    amountOut?: number;
    currency: string;
    rawRecord: any;
  };

  const combinedTimeline: CombinedTransaction[] = [];

  filteredTransfersForModal.forEach(tr => {
    combinedTimeline.push({
      id: tr.id,
      date: tr.date,
      type: 'transfer',
      refNo: tr.orderNumber,
      title: language === 'ur' ? 'منی ٹرانسفر ارسال' : 'Money Transfer Sent',
      details: `${tr.receiverName} (${tr.station}) - ${tr.amountAED} AED @ ${tr.exchangeRate}`,
      channel: tr.payoutMethod || 'Cash',
      amountOut: tr.netPayablePKR || tr.amountPKR,
      currency: 'PKR',
      rawRecord: tr
    });
  });

  filteredAmanatEntriesForModal.forEach(ae => {
    const isDep = ae.type === 'initial_deposit' || ae.type === 'additional_deposit';
    combinedTimeline.push({
      id: ae.id,
      date: ae.date,
      type: isDep ? 'amanat_deposit' : 'amanat_withdrawal',
      refNo: ae.receiptNo || 'AMN-ENTRY',
      title:
        ae.type === 'initial_deposit'
          ? (language === 'ur' ? 'پیسہ جمع (ابتدائی جمع)' : 'Cash Jama (Initial)')
          : ae.type === 'additional_deposit'
          ? (language === 'ur' ? 'پیسہ جمع (مزید رقم جمع)' : 'Cash Jama (Deposit)')
          : ae.type === 'third_party_payment'
          ? (language === 'ur' ? 'منی ٹرانسفر خودکار کٹوتی (-)' : 'Transfer Auto-Deduction (-)')
          : (language === 'ur' ? 'رقم واپسی / نکلوائی (-)' : 'Cash Returned to Owner (-)'),
      details: ae.description + (ae.relatedPerson ? ` (${ae.relatedPerson})` : ''),
      channel: ae.paymentMethod || 'Cash',
      amountIn: isDep ? ae.amount : undefined,
      amountOut: !isDep ? ae.amount : undefined,
      currency: ae.currency,
      rawRecord: ae
    });
  });

  filteredLoansForModal.forEach(l => {
    combinedTimeline.push({
      id: l.id,
      date: l.loanDate,
      type: 'loan_disbursed',
      refNo: l.loanNo,
      title: language === 'ur' ? 'ادھار / قرض دیا گیا' : 'Udhar / Loan Disbursed',
      details: l.purpose || (language === 'ur' ? 'ادھار رقم' : 'Loan amount'),
      channel: 'Cash',
      amountOut: l.originalAmount,
      currency: l.currency,
      rawRecord: l
    });

    (l.repayments || []).forEach(rp => {
      combinedTimeline.push({
        id: rp.id,
        date: rp.date,
        type: 'loan_repaid',
        refNo: rp.receiptNo,
        title:
          rp.entryType === 'additional_loan'
            ? (language === 'ur' ? 'مزید ادھار رقم دی گئی (+)' : 'Additional Loan Given (+)')
            : (language === 'ur' ? 'ادھار واپسی قسط وصول (-)' : 'Loan Repayment Received (-)'),
        details: rp.notes || (rp.receivedBy ? `وصول کنندہ: ${rp.receivedBy}` : 'قسط واپسی'),
        channel: rp.paymentMethod || 'Cash',
        amountIn: rp.entryType !== 'additional_loan' ? rp.amount : undefined,
        amountOut: rp.entryType === 'additional_loan' ? rp.amount : undefined,
        currency: rp.currency,
        rawRecord: rp
      });
    });
  });

  // Sort chronological descending
  combinedTimeline.sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <EagleStarLogo variant="icon" size="md" isDarkBackground={false} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-urdu-heading">
                {t('customers')} & {t('receivers')}
              </h1>
              <span className="text-xs bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold px-2.5 py-0.5 rounded-full font-mono">
                {customers.length} {language === 'ur' ? 'گاہک' : 'Customers'}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              {language === 'ur'
                ? 'ارسال کنندگان دبئی اور پاکستان اسٹیشنز کے وصول کنندگان کا مکمل ریکارڈ و 360° اسٹیٹمنٹ'
                : 'Complete directory of Dubai senders and Pakistan station receivers with 360° statement'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'senders' ? (
            <button
              onClick={openAddCustomer}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="font-urdu-heading">{t('addCustomer')}</span>
            </button>
          ) : (
            <button
              onClick={openAddReceiver}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="font-urdu-heading">{t('addReceiver')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Financial Overview KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-b from-blue-50/70 via-white to-white p-4 rounded-2xl border border-blue-200 shadow-sm space-y-1">
          <span className="text-xs text-blue-950 font-bold block uppercase tracking-wider">
            {language === 'ur' ? 'کل گاہک (ارسال کنندگان)' : 'Total Customers (Senders)'}
          </span>
          <div className="text-2xl font-black font-mono text-blue-950">{customers.length}</div>
          <span className="text-xs text-slate-600 font-medium block">
            {language === 'ur' ? 'دبئی سے رقم بھیجنے والے' : 'Active Dubai customer accounts'}
          </span>
        </div>

        <div className="bg-gradient-to-b from-emerald-50/70 via-white to-white p-4 rounded-2xl border border-emerald-200 shadow-sm space-y-1">
          <span className="text-xs text-emerald-950 font-bold block uppercase tracking-wider">
            {language === 'ur' ? 'پیسہ جمع واجب الادا (Cash Jama)' : 'Total Cash Jama Liabilities'}
          </span>
          <div className="text-2xl font-black font-mono text-emerald-950">
            {formatMoney(totalHeldAmanatPkr, 'PKR')}
          </div>
          <span className="text-xs text-emerald-900 font-bold block">
            {amanatAccounts.length} {language === 'ur' ? 'گاہکوں کی امانت جمع شدہ' : 'Depositors with funds'}
          </span>
        </div>

        <div className="bg-gradient-to-b from-rose-50/70 via-white to-white p-4 rounded-2xl border border-rose-200 shadow-sm space-y-1">
          <span className="text-xs text-rose-950 font-bold block uppercase tracking-wider">
            {language === 'ur' ? 'واجب الادا ادھار کھاتہ (Udhar)' : 'Total Outstanding Udhar'}
          </span>
          <div className="text-2xl font-black font-mono text-rose-950">
            {formatMoney(totalOutstandingLoanPkr, 'PKR')}
          </div>
          <span className="text-xs text-rose-900 font-bold block">
            {loans.filter(l => l.status !== 'Fully Repaid' && l.remainingBalance > 0).length} {language === 'ur' ? 'گاہکوں کا بقایا ادھار' : 'Borrowers with balance'}
          </span>
        </div>

        <div className="bg-gradient-to-b from-slate-50 via-white to-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-800 font-bold block uppercase tracking-wider">
            {language === 'ur' ? 'وصول کنندگان (Receivers)' : 'Total Receivers'}
          </span>
          <div className="text-2xl font-black font-mono text-slate-950">{receivers.length}</div>
          <span className="text-xs text-slate-600 font-medium block">
            {language === 'ur' ? 'پاکستان کے مختلف اسٹیشنز' : 'Receivers across stations'}
          </span>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('senders')}
            className={`px-4 py-1.5 rounded-md font-bold transition cursor-pointer font-urdu-heading ${
              activeTab === 'senders'
                ? 'bg-white text-emerald-950 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-emerald-900'
            }`}
          >
            {t('customers')} ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('receivers')}
            className={`px-4 py-1.5 rounded-md font-bold transition cursor-pointer font-urdu-heading ${
              activeTab === 'receivers'
                ? 'bg-white text-emerald-950 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-emerald-900'
            }`}
          >
            {t('receivers')} ({receivers.length})
          </button>
        </div>

        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 rtl:right-3 rtl:left-auto" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={
              language === 'ur'
                ? 'نام، فون نمبر، کسٹمر کوڈ یا شہر تلاش کریں...'
                : 'Search name, phone, customer code, city...'
            }
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 rtl:pr-9 rtl:pl-3 text-xs focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* List */}
      {activeTab === 'senders' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 font-bold">
              {t('noRecordsFound')}
            </div>
          ) : (
            filteredCustomers.map(cust => {
              const custTransfers = getCustomerTransfers(cust);
              const custAmanat = getCustomerAmanat(cust);
              const custLoans = getCustomerLoans(cust);
              const custRemainingLoan = custLoans.reduce((sum, l) => sum + l.remainingBalance, 0);

              return (
                <div
                  key={cust.id}
                  onClick={() => setSelectedCustomer(cust)}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md cursor-pointer transition flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] text-emerald-700 font-mono font-bold block">
                          {cust.customerCode}
                        </span>
                        <h3 className="font-black text-slate-950 text-base font-urdu-heading">
                          {cust.name}
                        </h3>
                        {cust.nameUr && (
                          <span className="font-urdu-heading text-xs text-slate-600 block">
                            {cust.nameUr}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
                          {cust.city || 'Dubai'}
                        </span>
                        {canManageCustomers && (
                          <button
                            onClick={e => openEditCustomer(cust, e)}
                            className="p-1 text-amber-700 hover:bg-amber-50 rounded transition cursor-pointer"
                            title={t('edit')}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(isSuperAdmin || canDeleteRecords) && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              if (confirmDeleteId === cust.id) {
                                deleteCustomer(cust.id);
                                setConfirmDeleteId(null);
                              } else {
                                setConfirmDeleteId(cust.id);
                              }
                            }}
                            className={`p-1 rounded transition cursor-pointer flex items-center gap-1 ${
                              confirmDeleteId === cust.id
                                ? 'bg-red-600 text-white px-1.5 text-[10px] font-bold'
                                : 'text-slate-400 hover:text-red-700 hover:bg-red-50'
                            }`}
                            title={t('delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {confirmDeleteId === cust.id && (
                              <span>{language === 'ur' ? 'حذف؟' : 'Confirm'}</span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono font-bold" dir="ltr">
                          {cust.phone}
                        </span>
                      </div>
                      {cust.address && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cust.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Financial Stat Badges */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                      {custAmanat && custAmanat.currentBalance > 0 ? (
                        <span className="bg-emerald-50 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded font-bold">
                          💰 پیسہ جمع: {custAmanat.currentBalance.toLocaleString()} {custAmanat.currency}
                        </span>
                      ) : custAmanat && custAmanat.currentBalance < 0 ? (
                        <span className="bg-rose-50 text-rose-900 border border-rose-300 px-2 py-0.5 rounded font-bold">
                          ⚠ پیسہ جمع منفی: {custAmanat.currentBalance.toLocaleString()} {custAmanat.currency}
                        </span>
                      ) : (
                        <span className="bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded">
                          کوئی پیسہ جمع نہیں
                        </span>
                      )}

                      <span className="bg-blue-50 text-blue-900 border border-blue-200 px-2 py-0.5 rounded font-bold">
                        💸 {custTransfers.length} {language === 'ur' ? 'ٹرانسفرز' : 'Trx'}
                      </span>

                      {custRemainingLoan > 0 ? (
                        <span className="bg-rose-50 text-rose-950 border border-rose-300 px-2 py-0.5 rounded font-bold">
                          📋 ادھار بقایا: {custRemainingLoan.toLocaleString()}
                        </span>
                      ) : custRemainingLoan < 0 ? (
                        <span className="bg-teal-50 text-teal-900 border border-teal-300 px-2 py-0.5 rounded font-bold">
                          💰 ادھار اضافی جمع: +{Math.abs(custRemainingLoan).toLocaleString()}
                        </span>
                      ) : (
                        <span className="bg-slate-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                          صاف ادھار ✓
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                    <span className="text-emerald-700 flex items-center gap-1 font-urdu-heading">
                      <span>{language === 'ur' ? 'کھاتہ اسٹیٹمنٹ و تفصیل' : 'View History & Statement'}</span>
                      <span>→</span>
                    </span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handlePrintCustomerStatement(cust);
                      }}
                      className="p-1 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded transition flex items-center gap-1"
                      title={language === 'ur' ? 'اسٹیٹمنٹ پرنٹ کریں' : 'Print Statement'}
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[11px] font-urdu-heading">پرنٹ</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReceivers.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 font-bold">
              {t('noRecordsFound')}
            </div>
          ) : (
            filteredReceivers.map(rec => (
              <div
                key={rec.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base font-urdu-heading">
                      {rec.name}
                    </h3>
                    {rec.nameUr && (
                      <span className="font-urdu-heading text-xs text-slate-600 block">
                        {rec.nameUr}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs bg-emerald-100 text-emerald-950 font-bold px-2 py-0.5 rounded font-urdu-heading border border-emerald-200">
                      {rec.station}
                    </span>
                    {canManageCustomers && (
                      <button
                        onClick={() => openEditReceiver(rec)}
                        className="p-1 text-amber-700 hover:bg-amber-50 rounded transition cursor-pointer"
                        title={t('edit')}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {(isSuperAdmin || canDeleteRecords) && (
                      <button
                        onClick={() => {
                          if (confirmDeleteId === rec.id) {
                            deleteReceiver(rec.id);
                            setConfirmDeleteId(null);
                          } else {
                            setConfirmDeleteId(rec.id);
                          }
                        }}
                        className={`p-1 rounded transition cursor-pointer flex items-center gap-1 ${
                          confirmDeleteId === rec.id
                            ? 'bg-red-600 text-white px-1.5 text-[10px] font-bold'
                            : 'text-slate-400 hover:text-red-700 hover:bg-red-50'
                        }`}
                        title={t('delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {confirmDeleteId === rec.id && (
                          <span>{language === 'ur' ? 'حذف؟' : 'Confirm'}</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono font-bold" dir="ltr">
                      {rec.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {rec.city}, {rec.country}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* COMPREHENSIVE CUSTOMER STATEMENT & HISTORY MODAL */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-950/75 backdrop-blur-sm p-2 sm:p-4 md:py-6 overflow-y-auto"
          dir={language === 'ur' ? 'rtl' : 'ltr'}
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-5xl w-full my-auto max-h-[92vh] sm:max-h-[88vh] overflow-hidden flex flex-col border border-slate-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-400 font-mono font-bold">
                      {selectedCustomer.customerCode}
                    </span>
                    <h3 className="font-black text-lg sm:text-xl font-urdu-heading">
                      {selectedCustomer.name}
                      {selectedCustomer.nameUr && (
                        <span className="text-slate-300 font-normal text-sm mr-2">
                          ({selectedCustomer.nameUr})
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="text-xs text-slate-300 flex items-center gap-3 font-mono mt-0.5">
                    <span dir="ltr">{selectedCustomer.phone}</span>
                    <span>·</span>
                    <span>
                      {selectedCustomer.city || 'Dubai'}, {selectedCustomer.address || ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Modal Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintCustomerStatement(selectedCustomer)}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer"
                  title="گاہک کی مکمل 360° اسٹیٹمنٹ پرنٹ کریں"
                >
                  <Printer className="w-4 h-4 text-emerald-200" />
                  <span className="font-urdu-heading">
                    {language === 'ur' ? 'مکمل اسٹیٹمنٹ پرنٹ کریں' : 'Print Statement'}
                  </span>
                </button>

                {canManageCustomers && (
                  <button
                    type="button"
                    onClick={() => openEditCustomer(selectedCustomer)}
                    className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
                    title={t('edit')}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{t('edit')}</span>
                  </button>
                )}

                {(isSuperAdmin || canDeleteRecords) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirmDeleteId === selectedCustomer.id) {
                        deleteCustomer(selectedCustomer.id);
                        setSelectedCustomer(null);
                        setConfirmDeleteId(null);
                      } else {
                        setConfirmDeleteId(selectedCustomer.id);
                      }
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      confirmDeleteId === selectedCustomer.id
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800 text-rose-300 hover:bg-rose-950'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{confirmDeleteId === selectedCustomer.id ? 'تصدیق حذف؟' : t('delete')}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Financial Summary KPI Cards Inside Modal */}
            <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 shrink-0 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                {/* 1. Cash Jama (Amanat) Card */}
                <div className="bg-white p-3.5 rounded-xl border border-emerald-300 shadow-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-950 flex items-center gap-1">
                      <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{language === 'ur' ? 'پیسہ جمع بقایا' : 'Cash Jama Balance'}</span>
                    </span>
                    {onOpenNewAmanat && (
                      <button
                        onClick={() => {
                          setSelectedCustomer(null);
                          onOpenNewAmanat(activeMatchedAmanat, 'add_entry');
                        }}
                        className="text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer"
                      >
                        {activeMatchedAmanat ? '+ جمع / واپسی' : '+ نیا کھاتہ'}
                      </button>
                    )}
                  </div>
                  <div className="text-xl font-black font-mono text-emerald-950">
                    {custAmanatBalance.toLocaleString()} {custAmanatCurrency}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium block">
                    {activeMatchedAmanat
                      ? `کھاتہ نمبر: ${activeMatchedAmanat.accountNo} (${activeMatchedAmanat.entries.length} اندراجات)`
                      : 'کوئی پیسہ جمع کھاتہ نہیں'}
                  </span>
                </div>

                {/* 2. Money Transfers Sent Card */}
                <div className="bg-white p-3.5 rounded-xl border border-blue-300 shadow-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-950 flex items-center gap-1">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                      <span>{language === 'ur' ? 'کل منی ٹرانسفرز' : 'Total Transfers Sent'}</span>
                    </span>
                    {onOpenNewTransfer && (
                      <button
                        onClick={() => {
                          setSelectedCustomer(null);
                          onOpenNewTransfer();
                        }}
                        className="text-[10px] text-blue-700 font-bold hover:underline cursor-pointer"
                      >
                        + نیا ٹرانسفر
                      </button>
                    )}
                  </div>
                  <div className="text-xl font-black font-mono text-blue-950">
                    {custTotalTransfersAED.toLocaleString()} AED
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium block">
                    {activeMatchedTransfers.length} {language === 'ur' ? 'آرڈرز' : 'Orders'} (
                    {custTotalTransfersPKR.toLocaleString()} PKR)
                  </span>
                </div>

                {/* 3. Udhar / Loans Khata Card */}
                <div className="bg-white p-3.5 rounded-xl border border-rose-300 shadow-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-rose-950 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-rose-600" />
                      <span>
                        {custLoanExtraCredit > 0 && custOutstandingLoan === 0
                          ? language === 'ur'
                            ? 'ادھار کھاتہ اضافی جمع'
                            : 'Khata Extra Credit'
                          : language === 'ur'
                          ? 'واجب الادا ادھار'
                          : 'Pending Udhar / Loan'}
                      </span>
                    </span>
                    {onOpenNewLoan && (
                      <button
                        onClick={() => {
                          setSelectedCustomer(null);
                          onOpenNewLoan();
                        }}
                        className="text-[10px] text-rose-700 font-bold hover:underline cursor-pointer"
                      >
                        + ادھار کھاتہ
                      </button>
                    )}
                  </div>
                  <div
                    className={`text-xl font-black font-mono ${
                      custLoanExtraCredit > 0 && custOutstandingLoan === 0
                        ? 'text-emerald-700'
                        : 'text-rose-950'
                    }`}
                  >
                    {custLoanExtraCredit > 0 && custOutstandingLoan === 0
                      ? `+${custLoanExtraCredit.toLocaleString()}`
                      : custOutstandingLoan.toLocaleString()}{' '}
                    {activeMatchedLoans[0]?.currency || 'PKR'}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium block">
                    {activeMatchedLoans.length} {language === 'ur' ? 'قرضہ کھاتے' : 'Loans'}
                    {custLoanExtraCredit > 0 && custOutstandingLoan > 0
                      ? ` (+${custLoanExtraCredit.toLocaleString()} جمع)`
                      : ''}
                  </span>
                </div>

                {/* 4. Net Customer Position */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                    <span>{language === 'ur' ? 'صافی مالیاتی پوزیشن' : 'Net Financial Position'}</span>
                  </span>
                  {(() => {
                    const netPos = custAmanatBalance + custLoanExtraCredit - custOutstandingLoan;
                    return (
                      <>
                        <div
                          className={`text-xl font-black font-mono ${
                            netPos >= 0 ? 'text-emerald-950' : 'text-rose-950'
                          }`}
                        >
                          {netPos.toLocaleString()} {custAmanatCurrency}
                        </div>
                        <span className="text-[10px] text-slate-600 font-bold block">
                          {netPos >= 0
                            ? '✓ ہمارے پاس جمع شدہ فاضل فنڈز'
                            : '⚠ گاہک کے ذمے خالص واجب الادا'}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Sub-Tabs and Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200 text-xs">
                {/* Sub Tabs */}
                <div className="flex bg-slate-200/80 p-0.5 rounded-lg font-urdu-heading font-bold">
                  <button
                    onClick={() => setStatementSubTab('all')}
                    className={`px-3 py-1 rounded-md transition cursor-pointer ${
                      statementSubTab === 'all'
                        ? 'bg-white text-slate-950 shadow-xs'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    {language === 'ur' ? 'تمام مشترکہ لیجر' : 'All Combined'} ({combinedTimeline.length})
                  </button>
                  <button
                    onClick={() => setStatementSubTab('transfers')}
                    className={`px-3 py-1 rounded-md transition cursor-pointer ${
                      statementSubTab === 'transfers'
                        ? 'bg-white text-blue-950 shadow-xs'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    {language === 'ur' ? 'منی ٹرانسفرز' : 'Transfers'} ({filteredTransfersForModal.length})
                  </button>
                  <button
                    onClick={() => setStatementSubTab('amanat')}
                    className={`px-3 py-1 rounded-md transition cursor-pointer ${
                      statementSubTab === 'amanat'
                        ? 'bg-white text-emerald-950 shadow-xs'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    {language === 'ur' ? 'پیسہ جمع کھاتہ' : 'Cash Jama'} ({filteredAmanatEntriesForModal.length})
                  </button>
                  <button
                    onClick={() => setStatementSubTab('loans')}
                    className={`px-3 py-1 rounded-md transition cursor-pointer ${
                      statementSubTab === 'loans'
                        ? 'bg-white text-rose-950 shadow-xs'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    {language === 'ur' ? 'ادھار / لون' : 'Udhar / Loans'} ({filteredLoansForModal.length})
                  </button>
                </div>

                {/* Date presets & search inside modal */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="relative w-44">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2 rtl:right-2 rtl:left-auto" />
                    <input
                      type="text"
                      value={statementSearch}
                      onChange={e => setStatementSearch(e.target.value)}
                      placeholder={language === 'ur' ? 'آرڈر / تفصیل تلاش...' : 'Search...'}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-7 pr-2 py-1 rtl:pr-7 rtl:pl-2 text-xs"
                    />
                  </div>

                  {(
                    [
                      { id: 'all', label: language === 'ur' ? 'سب' : 'All' },
                      { id: 'today', label: language === 'ur' ? 'آج' : 'Today' },
                      { id: '7days', label: language === 'ur' ? '7 دن' : '7 Days' },
                      { id: 'month', label: language === 'ur' ? 'ماہ' : 'Month' },
                      { id: 'custom', label: language === 'ur' ? 'مخصوص' : 'Custom' }
                    ] as const
                  ).map(p => (
                    <button
                      key={p.id}
                      onClick={() => setStatementDatePreset(p.id)}
                      className={`px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                        statementDatePreset === p.id
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}

                  {statementDatePreset === 'custom' && (
                    <div className="flex items-center gap-1 bg-white border border-slate-300 px-1.5 py-0.5 rounded text-[11px]">
                      <Calendar className="w-3 h-3 text-emerald-600" />
                      <input
                        type="date"
                        value={statementDateFrom}
                        onChange={e => setStatementDateFrom(e.target.value)}
                        className="bg-transparent text-[11px] font-mono"
                      />
                      <span>→</span>
                      <input
                        type="date"
                        value={statementDateTo}
                        onChange={e => setStatementDateTo(e.target.value)}
                        className="bg-transparent text-[11px] font-mono"
                      />
                    </div>
                  )}

                  {(statementSearch || statementDatePreset !== 'all') && (
                    <button
                      onClick={() => {
                        setStatementSearch('');
                        setStatementDatePreset('all');
                        setStatementDateFrom('');
                        setStatementDateTo('');
                      }}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                      title="فلٹر ری سیٹ کریں"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Body: Active Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs sm:text-sm">
              {/* TAB 1: ALL COMBINED TIMELINE */}
              {statementSubTab === 'all' && (
                <div className="space-y-2">
                  {combinedTimeline.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 font-bold bg-slate-50 rounded-xl border border-slate-200">
                      اس دورانیہ میں گاہک کی کوئی ٹرانزیکشن موجود نہیں ہے۔
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full border-collapse text-start text-xs">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold font-urdu-heading">
                            <th className="py-2.5 px-3 text-start">تاریخ</th>
                            <th className="py-2.5 px-3 text-start">قسم ٹرانزیکشن</th>
                            <th className="py-2.5 px-3 text-start">نمبر حوالہ</th>
                            <th className="py-2.5 px-3 text-start">تفصیل</th>
                            <th className="py-2.5 px-3 text-start">طریقہ</th>
                            <th className="py-2.5 px-3 text-start text-emerald-800">جمع (+)</th>
                            <th className="py-2.5 px-3 text-start text-rose-700">کٹوتی / ادائیگی (-)</th>
                            <th className="py-2.5 px-3 text-center">کارروائی</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {combinedTimeline.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2 px-3 font-mono text-slate-700 font-medium">
                                {item.date}
                              </td>
                              <td className="py-2 px-3">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-urdu-heading ${
                                    item.type === 'transfer'
                                      ? 'bg-blue-100 text-blue-950 border border-blue-300'
                                      : item.type === 'amanat_deposit'
                                      ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                                      : item.type === 'amanat_withdrawal'
                                      ? 'bg-amber-100 text-amber-950 border border-amber-300'
                                      : item.type === 'loan_disbursed'
                                      ? 'bg-rose-100 text-rose-950 border border-rose-300'
                                      : 'bg-teal-100 text-teal-950 border border-teal-300'
                                  }`}
                                >
                                  {item.title}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-mono font-bold text-slate-900">
                                {item.refNo}
                              </td>
                              <td className="py-2 px-3 text-slate-800 font-medium">
                                {item.details}
                              </td>
                              <td className="py-2 px-3 text-slate-600 font-medium">
                                {item.channel}
                              </td>
                              <td className="py-2 px-3 font-mono font-extrabold text-emerald-800">
                                {item.amountIn ? `+${item.amountIn.toLocaleString()} ${item.currency}` : '—'}
                              </td>
                              <td className="py-2 px-3 font-mono font-extrabold text-rose-700">
                                {item.amountOut ? `-${item.amountOut.toLocaleString()} ${item.currency}` : '—'}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {item.type === 'transfer' ? (
                                  <button
                                    onClick={() =>
                                      openReceipt({
                                        format: 'A',
                                        transfer: item.rawRecord
                                      })
                                    }
                                    className="p-1 text-slate-600 hover:text-emerald-700 rounded transition"
                                    title="رسید پرنٹ کریں"
                                  >
                                    <Receipt className="w-4 h-4" />
                                  </button>
                                ) : item.type === 'amanat_deposit' || item.type === 'amanat_withdrawal' ? (
                                  <button
                                    onClick={() =>
                                      openReceipt({
                                        format: 'A',
                                        amanatAccount: activeMatchedAmanat,
                                        amanatEntry: item.rawRecord
                                      })
                                    }
                                    className="p-1 text-slate-600 hover:text-emerald-700 rounded transition"
                                    title="واؤچر پرنٹ کریں"
                                  >
                                    <Receipt className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      openReceipt({
                                        format: 'A',
                                        loan: item.rawRecord
                                      })
                                    }
                                    className="p-1 text-slate-600 hover:text-rose-700 rounded transition"
                                    title="لون سلپ پرنٹ کریں"
                                  >
                                    <Receipt className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: MONEY TRANSFERS */}
              {statementSubTab === 'transfers' && (
                <div className="space-y-3">
                  {filteredTransfersForModal.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 font-bold bg-slate-50 rounded-xl border border-slate-200">
                      کوئی منی ٹرانسفر ریکارڈ موجود نہیں ہے۔
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full border-collapse text-start text-xs">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold font-urdu-heading">
                            <th className="py-2.5 px-3 text-start">آرڈر نمبر</th>
                            <th className="py-2.5 px-3 text-start">تاریخ</th>
                            <th className="py-2.5 px-3 text-start">وصول کنندہ (پاکستان)</th>
                            <th className="py-2.5 px-3 text-start">اسٹیشن</th>
                            <th className="py-2.5 px-3 text-start">چینل</th>
                            <th className="py-2.5 px-3 text-start text-blue-900">رقم درہم (AED)</th>
                            <th className="py-2.5 px-3 text-start">ریٹ</th>
                            <th className="py-2.5 px-3 text-start text-emerald-800">رقم روپیہ (PKR)</th>
                            <th className="py-2.5 px-3 text-center">اسٹیٹس</th>
                            <th className="py-2.5 px-3 text-center">کارروائی</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredTransfersForModal.map(tr => (
                            <tr key={tr.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                {tr.orderNumber}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-700">{tr.date}</td>
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900">{tr.receiverName}</div>
                                <div className="text-[10px] text-slate-500 font-mono" dir="ltr">
                                  {tr.receiverPhone}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-urdu-heading font-bold text-emerald-950">
                                {tr.station}
                              </td>
                              <td className="py-2.5 px-3 text-slate-700">{tr.payoutMethod || 'Cash'}</td>
                              <td className="py-2.5 px-3 font-mono font-black text-blue-900">
                                {(tr.totalCollectedAED || tr.amountAED).toLocaleString()} AED
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-600">{tr.exchangeRate}</td>
                              <td className="py-2.5 px-3 font-mono font-black text-emerald-900">
                                {(tr.netPayablePKR || tr.amountPKR).toLocaleString()} PKR
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="bg-emerald-100 text-emerald-950 font-bold px-2 py-0.5 rounded text-[10px]">
                                  {tr.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() =>
                                      openReceipt({
                                        format: 'A',
                                        transfer: tr
                                      })
                                    }
                                    className="p-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                                    title="رسید پرنٹ کریں"
                                  >
                                    <Receipt className="w-4 h-4" />
                                  </button>
                                  {canEditTransfers && (
                                    <button
                                      onClick={() => {
                                        setSelectedCustomer(null);
                                        if (onEditTransfer) {
                                          onEditTransfer(tr);
                                        } else {
                                          openEditTransferModal(tr);
                                        }
                                      }}
                                      className="p-1 text-amber-700 hover:bg-amber-50 rounded"
                                      title="ترمیم کریں"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                  )}
                                  {(isSuperAdmin || canDeleteTransfers) && (
                                    <button
                                      onClick={() => {
                                        if (confirmDeleteTransferId === tr.id) {
                                          deleteTransfer(tr.id);
                                          setConfirmDeleteTransferId(null);
                                        } else {
                                          setConfirmDeleteTransferId(tr.id);
                                        }
                                      }}
                                      className={`p-1 rounded transition ${
                                        confirmDeleteTransferId === tr.id
                                          ? 'bg-rose-600 text-white text-[10px] px-1.5 font-bold'
                                          : 'text-slate-400 hover:text-rose-700 hover:bg-rose-50'
                                      }`}
                                      title="حذف کریں"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      {confirmDeleteTransferId === tr.id && <span>حذف؟</span>}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CASH JAMA (AMANAT) KHATA */}
              {statementSubTab === 'amanat' && (
                <div className="space-y-3">
                  {!activeMatchedAmanat ? (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <p className="text-slate-500 font-bold">
                        اس گاہک کا کوئی علیحدہ پیسہ جمع کھاتہ نہیں ہے۔
                      </p>
                      {onOpenNewAmanat && (
                        <button
                          onClick={() => {
                            setSelectedCustomer(null);
                            onOpenNewAmanat(undefined, 'new_account');
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
                        >
                          + نیا پیسہ جمع کھاتہ کھولیں
                        </button>
                      )}
                    </div>
                  ) : filteredAmanatEntriesForModal.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 font-bold bg-slate-50 rounded-xl border border-slate-200">
                      اس دورانیہ میں پیسہ جمع کا کوئی اندراج نہیں ہے۔
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full border-collapse text-start text-xs">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold font-urdu-heading">
                            <th className="py-2.5 px-3 text-start">تاریخ</th>
                            <th className="py-2.5 px-3 text-start">رسید نمبر</th>
                            <th className="py-2.5 px-3 text-start">قسم اندراج</th>
                            <th className="py-2.5 px-3 text-start">تفصیل / متعلقہ شخص</th>
                            <th className="py-2.5 px-3 text-start">چینل</th>
                            <th className="py-2.5 px-3 text-start text-emerald-800">جمع (+)</th>
                            <th className="py-2.5 px-3 text-start text-rose-700">کٹوتی / واپسی (-)</th>
                            <th className="py-2.5 px-3 text-start">بقایا بیلنس</th>
                            <th className="py-2.5 px-3 text-center">کارروائی</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredAmanatEntriesForModal.map(entry => {
                            const isDep =
                              entry.type === 'initial_deposit' || entry.type === 'additional_deposit';
                            return (
                              <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-2.5 px-3 font-mono text-slate-700">{entry.date}</td>
                                <td className="py-2.5 px-3 font-mono font-bold text-blue-900">
                                  {entry.receiptNo || '—'}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-urdu-heading ${
                                      isDep
                                        ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                                        : 'bg-rose-100 text-rose-950 border border-rose-300'
                                    }`}
                                  >
                                    {entry.type === 'initial_deposit'
                                      ? 'ابتدائی جمع'
                                      : entry.type === 'additional_deposit'
                                      ? 'مزید جمع'
                                      : entry.type === 'third_party_payment'
                                      ? 'منی ٹرانسفر کٹوتی'
                                      : 'رقم واپسی'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-900 font-medium font-urdu-body">
                                  {entry.description}
                                  {entry.relatedPerson && (
                                    <span className="block text-[10px] text-slate-500 font-bold">
                                      {isDep ? 'جمع کرانے والا: ' : 'وصول کنندہ: '}
                                      {entry.relatedPerson}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-slate-700">
                                  {entry.paymentMethod === 'Cash' || !entry.paymentMethod
                                    ? 'نقد کیش'
                                    : entry.bankName || entry.paymentMethod}
                                </td>
                                <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">
                                  {isDep ? `+${entry.amount.toLocaleString()} ${entry.currency}` : '—'}
                                </td>
                                <td className="py-2.5 px-3 font-mono font-bold text-rose-700">
                                  {!isDep ? `-${entry.amount.toLocaleString()} ${entry.currency}` : '—'}
                                </td>
                                <td
                                  className={`py-2.5 px-3 font-mono font-black ${
                                    entry.newBalance < 0 ? 'text-rose-700' : 'text-slate-950'
                                  }`}
                                >
                                  {entry.newBalance.toLocaleString()} {entry.currency}
                                  {entry.newBalance < 0 && (
                                    <span className="block text-[10px] font-bold font-urdu-body">
                                      (منفی واجب الادا)
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() =>
                                        openReceipt({
                                          format: 'A',
                                          amanatAccount: activeMatchedAmanat,
                                          amanatEntry: entry
                                        })
                                      }
                                      className="p-1 text-slate-600 hover:text-emerald-700 rounded transition"
                                      title="واؤچر پرنٹ کریں"
                                    >
                                      <Receipt className="w-4 h-4" />
                                    </button>
                                    {(isSuperAdmin || canDeleteRecords) && (
                                      <button
                                        onClick={() => {
                                          if (confirmDeleteAmanatEntryId === entry.id) {
                                            deleteAmanatEntry(activeMatchedAmanat.id, entry.id);
                                            setConfirmDeleteAmanatEntryId(null);
                                          } else {
                                            setConfirmDeleteAmanatEntryId(entry.id);
                                          }
                                        }}
                                        className={`p-1 rounded transition ${
                                          confirmDeleteAmanatEntryId === entry.id
                                            ? 'bg-rose-600 text-white text-[10px] px-1.5 font-bold'
                                            : 'text-slate-400 hover:text-rose-700'
                                        }`}
                                        title="انٹری حذف کریں"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        {confirmDeleteAmanatEntryId === entry.id && <span>حذف؟</span>}
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: UDHAR / LOANS KHATA */}
              {statementSubTab === 'loans' && (
                <div className="space-y-4">
                  {filteredLoansForModal.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 font-bold bg-slate-50 rounded-xl border border-slate-200">
                      اس گاہک کے ذمے کوئی ادھار یا قرضہ ریکارڈ نہیں ہے۔
                    </div>
                  ) : (
                    filteredLoansForModal.map(loanItem => (
                      <div
                        key={loanItem.id}
                        className="bg-white border border-slate-300 rounded-xl overflow-hidden shadow-xs space-y-2"
                      >
                        <div className="bg-slate-100 p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-bold border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-blue-900 font-bold">{loanItem.loanNo}</span>
                            <span>·</span>
                            <span>تاریخ اجرا: {loanItem.loanDate}</span>
                            {loanItem.dueDate && (
                              <>
                                <span>·</span>
                                <span className="text-rose-700">واپسی تاریخ: {loanItem.dueDate}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-slate-700">
                              کل قرض: {loanItem.originalAmount.toLocaleString()} {loanItem.currency}
                            </span>
                            <span className="font-mono text-emerald-800">
                              واپسی ادا کی: {loanItem.totalRepaid.toLocaleString()}
                            </span>
                            <span
                              className={`font-mono font-black text-sm ${
                                loanItem.remainingBalance < 0 ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {loanItem.remainingBalance < 0
                                ? `اضافی جمع (کریڈٹ): +${Math.abs(loanItem.remainingBalance).toLocaleString()} ${loanItem.currency}`
                                : `بقایا واجب الادا: ${loanItem.remainingBalance.toLocaleString()} ${loanItem.currency}`}
                            </span>
                            {onRecordRepayment && (
                              <button
                                onClick={() => {
                                  setSelectedCustomer(null);
                                  onRecordRepayment(loanItem);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold"
                              >
                                + واپسی / مزید قرض
                              </button>
                            )}
                            <button
                              onClick={() =>
                                openReceipt({
                                  format: 'K',
                                  loan: loanItem
                                })
                              }
                              className="p-1 text-slate-600 hover:text-slate-900"
                              title="مکمل کھاتہ اسٹیٹمنٹ پرنٹ کریں"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            {(isSuperAdmin || canDeleteRecords) && (
                              <button
                                onClick={() => {
                                  if (confirmDeleteLoanId === loanItem.id) {
                                    deleteLoan(loanItem.id);
                                    setConfirmDeleteLoanId(null);
                                  } else {
                                    setConfirmDeleteLoanId(loanItem.id);
                                  }
                                }}
                                className={`p-1 rounded ${
                                  confirmDeleteLoanId === loanItem.id
                                    ? 'bg-rose-600 text-white text-[10px] px-1.5'
                                    : 'text-slate-400 hover:text-rose-700'
                                }`}
                                title="قرضہ حذف کریں"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                {confirmDeleteLoanId === loanItem.id && <span>حذف؟</span>}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Repayments Sub Table */}
                        {loanItem.repayments && loanItem.repayments.length > 0 && (
                          <div className="p-3 pt-0">
                            <span className="text-[11px] font-bold text-slate-700 block mb-1">
                              واپسی اقساط ہسٹری:
                            </span>
                            <table className="w-full border-collapse text-[11px]">
                              <thead>
                                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                                  <th className="py-1 px-2 text-start">اندراج #</th>
                                  <th className="py-1 px-2 text-start">تاریخ</th>
                                  <th className="py-1 px-2 text-start">رسید نمبر</th>
                                  <th className="py-1 px-2 text-start">قسم و رقم</th>
                                  <th className="py-1 px-2 text-start">طریقہ</th>
                                  <th className="py-1 px-2 text-start">وصول کنندہ</th>
                                  <th className="py-1 px-2 text-start">صافی بقایا</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {loanItem.repayments.map((rp, rIdx) => {
                                  const isAdd = rp.entryType === 'additional_loan';
                                  const nb = rp.newBalance ?? 0;
                                  return (
                                    <tr key={rp.id || rIdx}>
                                      <td className="py-1 px-2 font-mono text-slate-600">{rIdx + 1}</td>
                                      <td className="py-1 px-2 font-mono text-slate-700">{rp.date}</td>
                                      <td className="py-1 px-2 font-mono font-bold text-blue-900">
                                        {rp.receiptNo}
                                      </td>
                                      <td className={`py-1 px-2 font-mono font-bold ${isAdd ? 'text-rose-700' : 'text-emerald-800'}`}>
                                        {isAdd ? '+' : '-'}
                                        {rp.amount.toLocaleString()} {rp.currency}{' '}
                                        <span className="text-[10px] font-urdu-body">
                                          ({isAdd ? 'مزید قرض' : 'واپسی/جمع'})
                                        </span>
                                      </td>
                                      <td className="py-1 px-2">{rp.paymentMethod || 'Cash'}</td>
                                      <td className="py-1 px-2">{rp.receivedBy || 'آفس'}</td>
                                      <td className={`py-1 px-2 font-mono font-bold ${nb < 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                                        {nb < 0 ? `+${Math.abs(nb).toLocaleString()} (جمع)` : nb.toLocaleString()}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 sm:px-6 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-600 font-medium">
                {language === 'ur'
                  ? `گاہک ریکارڈ مکمل محفوظ ہے (${selectedCustomer.customerCode})`
                  : `Customer record securely saved (${selectedCustomer.customerCode})`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  {t('close')}
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintCustomerStatement(selectedCustomer)}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === 'ur' ? 'پرنٹ مکمل اسٹیٹمنٹ' : 'Print Statement'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New / Edit Customer Modal */}
      {isNewCustOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h3 className="font-black text-lg font-urdu-heading">
              {editingCustomer
                ? language === 'ur'
                  ? 'گاہک کی معلومات میں ترمیم'
                  : 'Edit Customer'
                : t('addCustomer')}
            </h3>
            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block mb-1 font-semibold">{t('senderName')} (English) *</label>
                <input
                  type="text"
                  value={custName}
                  onChange={e => setCustName(e.target.value)}
                  placeholder="e.g. Umer Khan"
                  className="w-full border rounded-lg p-2 text-xs"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">گاہک کا نام (اردو) - اختیاری</label>
                <input
                  type="text"
                  value={custNameUr}
                  onChange={e => setCustNameUr(e.target.value)}
                  placeholder="مثلاً عمر خان"
                  className="w-full border rounded-lg p-2 text-xs font-urdu-heading"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">{t('senderPhone')} *</label>
                <input
                  type="text"
                  value={custPhone}
                  onChange={e => setCustPhone(e.target.value)}
                  placeholder="+971501234567"
                  className="w-full border rounded-lg p-2 text-xs font-mono"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">{t('senderCity')}</label>
                <input
                  type="text"
                  value={custCity}
                  onChange={e => setCustCity(e.target.value)}
                  placeholder="Dubai"
                  className="w-full border rounded-lg p-2 text-xs"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">{t('address')}</label>
                <input
                  type="text"
                  value={custAddress}
                  onChange={e => setCustAddress(e.target.value)}
                  placeholder="Sonapur / Deira / Al Quoz"
                  className="w-full border rounded-lg p-2 text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewCustOpen(false)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleCreateOrSaveCustomer}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New / Edit Receiver Modal */}
      {isNewRecOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h3 className="font-black text-lg font-urdu-heading">
              {editingReceiver
                ? language === 'ur'
                  ? 'وصول کنندہ کی معلومات میں ترمیم'
                  : 'Edit Receiver'
                : t('addReceiver')}
            </h3>
            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block mb-1 font-semibold">{t('receiverName')} (English) *</label>
                <input
                  type="text"
                  value={recName}
                  onChange={e => setRecName(e.target.value)}
                  placeholder="e.g. Rasool Khan"
                  className="w-full border rounded-lg p-2 text-xs"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">وصول کنندہ کا نام (اردو) - اختیاری</label>
                <input
                  type="text"
                  value={recNameUr}
                  onChange={e => setRecNameUr(e.target.value)}
                  placeholder="مثلاً رسول خان"
                  className="w-full border rounded-lg p-2 text-xs font-urdu-heading"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">{t('receiverPhone')}</label>
                <input
                  type="text"
                  value={recPhone}
                  onChange={e => setRecPhone(e.target.value)}
                  placeholder="03001234567"
                  className="w-full border rounded-lg p-2 text-xs font-mono"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">{t('station')} *</label>
                <input
                  type="text"
                  value={recStation}
                  onChange={e => setRecStation(e.target.value)}
                  placeholder="میرعلی / ایزی پیسہ / جیز کیش / بنوں"
                  className="w-full border rounded-lg p-2 text-xs font-urdu-heading"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewRecOpen(false)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleCreateOrSaveReceiver}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
