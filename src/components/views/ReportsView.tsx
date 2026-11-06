/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { EagleStarLogo } from '../common/EagleStarLogo';
import {
  Download,
  Printer,
  Search,
  Calendar,
  RotateCcw,
  ArrowRightLeft,
  BookOpen,
  ShieldCheck,
  Wallet,
  Eye,
  Edit3,
  Trash2
} from 'lucide-react';
import { MoneyTransfer, Loan, AmanatAccount, LedgerEntry, TransferStatus, LoanStatus } from '../../types';

type ReportTab = 'transfers' | 'khata' | 'amanat' | 'cashLedger';

export const ReportsView: React.FC = () => {
  const {
    transfers,
    loans,
    amanatAccounts,
    ledger,
    stations,
    t,
    language,
    formatMoney,
    openReceipt,
    openEditTransferModal,
    deleteTransfer,
    deleteLoan,
    deleteAmanatAccount,
    deleteLedgerEntry,
    isSuperAdmin,
    canEditTransfers
  } = useApp();

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ReportTab>('transfers');
  const [searchTerm, setSearchTerm] = useState('');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'week' | 'month' | '2026' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stationFilter, setStationFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');

  // Today string YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Calculate start/end dates from preset
  const { effectiveStart, effectiveEnd } = useMemo(() => {
    if (datePreset === 'all') return { effectiveStart: '', effectiveEnd: '' };
    if (datePreset === 'today') return { effectiveStart: todayStr, effectiveEnd: todayStr };
    if (datePreset === '2026') return { effectiveStart: '2026-01-01', effectiveEnd: '2026-12-31' };
    if (datePreset === 'month') {
      const now = new Date();
      const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      return { effectiveStart: firstDay, effectiveEnd: todayStr };
    }
    if (datePreset === 'week') {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff)).toISOString().split('T')[0];
      return { effectiveStart: monday, effectiveEnd: todayStr };
    }
    return { effectiveStart: startDate, effectiveEnd: endDate };
  }, [datePreset, startDate, endDate, todayStr]);

  const resetFilters = () => {
    setSearchTerm('');
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
    setStationFilter('all');
    setCurrencyFilter('all');
  };

  // Helper date checker
  const isDateInRange = (itemDate: string) => {
    if (!itemDate) return true;
    const dt = itemDate.slice(0, 10);
    if (effectiveStart && dt < effectiveStart) return false;
    if (effectiveEnd && dt > effectiveEnd) return false;
    return true;
  };

  // 1. FILTERED TRANSFERS
  const filteredTransfers = useMemo(() => {
    return transfers.filter(tr => {
      if (!isDateInRange(tr.date)) return false;
      if (statusFilter !== 'all' && tr.status !== (statusFilter as TransferStatus)) return false;
      if (stationFilter !== 'all' && tr.station !== stationFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          tr.orderNumber.toLowerCase().includes(q) ||
          tr.receiptNumber.toLowerCase().includes(q) ||
          tr.senderName.toLowerCase().includes(q) ||
          tr.senderPhone.includes(q) ||
          tr.receiverName.toLowerCase().includes(q) ||
          tr.receiverPhone.includes(q) ||
          tr.station.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [transfers, effectiveStart, effectiveEnd, statusFilter, stationFilter, searchTerm]);

  // 2. FILTERED KHATA (LOANS)
  const filteredLoans = useMemo(() => {
    return loans.filter(ln => {
      if (!isDateInRange(ln.loanDate)) return false;
      if (statusFilter !== 'all' && ln.status !== (statusFilter as LoanStatus)) return false;
      if (currencyFilter !== 'all' && ln.currency !== currencyFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          ln.loanNo.toLowerCase().includes(q) ||
          ln.borrowerName.toLowerCase().includes(q) ||
          ln.borrowerPhone.includes(q) ||
          (ln.purpose && ln.purpose.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [loans, effectiveStart, effectiveEnd, statusFilter, currencyFilter, searchTerm]);

  // 3. FILTERED AMANAT ACCOUNTS
  const filteredAmanatAccounts = useMemo(() => {
    return amanatAccounts.filter(acct => {
      if (!isDateInRange(acct.openedDate)) return false;
      if (currencyFilter !== 'all' && acct.currency !== currencyFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          acct.accountNo.toLowerCase().includes(q) ||
          acct.ownerName.toLowerCase().includes(q) ||
          acct.ownerPhone.includes(q) ||
          (acct.city && acct.city.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [amanatAccounts, effectiveStart, effectiveEnd, currencyFilter, searchTerm]);

  // 4. FILTERED CASH LEDGER
  const filteredLedger = useMemo(() => {
    return ledger.filter(entry => {
      if (!isDateInRange(entry.date)) return false;
      if (statusFilter !== 'all' && entry.type !== statusFilter) return false;
      if (currencyFilter !== 'all' && entry.currency !== currencyFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const ref = entry.referenceId || '';
        const matches =
          ref.toLowerCase().includes(q) ||
          entry.description.toLowerCase().includes(q) ||
          entry.category.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [ledger, effectiveStart, effectiveEnd, statusFilter, currencyFilter, searchTerm]);

  // Calculations for KPI summaries
  const transferSummary = useMemo(() => {
    const totalAed = filteredTransfers.reduce((s, t) => s + t.amountAED, 0);
    const totalPkr = filteredTransfers.reduce((s, t) => s + t.amountPKR, 0);
    const totalPaidPkr = filteredTransfers.reduce((s, t) => s + t.amountPaidPKR, 0);
    const totalRemainingPkr = filteredTransfers.reduce((s, t) => s + t.remainingBalancePKR, 0);
    const totalCommission = filteredTransfers.reduce((s, t) => s + t.commissionAmount, 0);
    return { totalAed, totalPkr, totalPaidPkr, totalRemainingPkr, totalCommission };
  }, [filteredTransfers]);

  const khataSummary = useMemo(() => {
    const totalLent = filteredLoans.reduce((s, l) => s + l.originalAmount, 0);
    const totalRepaid = filteredLoans.reduce((s, l) => s + l.totalRepaid, 0);
    const totalOutstanding = filteredLoans.reduce((s, l) => s + l.remainingBalance, 0);
    const activeCount = filteredLoans.filter(l => l.status === 'Outstanding' || l.status === 'Partially Repaid').length;
    const overdueCount = filteredLoans.filter(l => l.status === 'Overdue').length;
    const paidCount = filteredLoans.filter(l => l.status === 'Fully Repaid').length;
    return { totalLent, totalRepaid, totalOutstanding, activeCount, overdueCount, paidCount };
  }, [filteredLoans]);

  const amanatSummary = useMemo(() => {
    const totalPkr = filteredAmanatAccounts
      .filter(a => a.currency === 'PKR')
      .reduce((s, a) => s + a.currentBalance, 0);
    const totalAed = filteredAmanatAccounts
      .filter(a => a.currency === 'AED')
      .reduce((s, a) => s + a.currentBalance, 0);
    return { totalPkr, totalAed, totalAccounts: filteredAmanatAccounts.length };
  }, [filteredAmanatAccounts]);

  const ledgerSummary = useMemo(() => {
    const cashIn = filteredLedger
      .filter(e => e.type === 'cash_in')
      .reduce((s, e) => s + e.amount, 0);
    const cashOut = filteredLedger
      .filter(e => e.type === 'cash_out')
      .reduce((s, e) => s + e.amount, 0);
    return { cashIn, cashOut, netBalance: cashIn - cashOut };
  }, [filteredLedger]);

  // Date range label for printout
  const dateSummaryLabel = useMemo(() => {
    if (effectiveStart && effectiveEnd) {
      return `${effectiveStart} تا ${effectiveEnd}`;
    }
    if (effectiveStart) return `از ${effectiveStart}`;
    if (datePreset === 'all') return language === 'ur' ? 'مکمل ریکارڈ (آل ٹائم)' : 'All Records';
    return todayStr;
  }, [effectiveStart, effectiveEnd, datePreset, language, todayStr]);

  // PRINT CURRENT AUDIT REPORT
  const handlePrintReport = () => {
    if (activeTab === 'transfers') {
      openReceipt({
        format: 'B',
        batchTransfers: filteredTransfers,
        reportTitle: language === 'ur' ? 'ترسیلات مکمل رجسٹر و آڈٹ رپورٹ' : 'Complete Transfers Register Report',
        reportDateRange: dateSummaryLabel
      });
    } else if (activeTab === 'khata') {
      openReceipt({
        format: 'H',
        batchLoans: filteredLoans,
        reportTitle: language === 'ur' ? 'ادھار و قرضہ کھاتہ مکمل آڈٹ رپورٹ' : 'Complete Khata / Loans Register',
        reportDateRange: dateSummaryLabel
      });
    } else if (activeTab === 'amanat') {
      openReceipt({
        format: 'G',
        batchAmanat: filteredAmanatAccounts,
        reportTitle: language === 'ur' ? 'امانتیں و تحویل مکمل آڈٹ رجسٹر' : 'Complete Amanat Safekeeping Register',
        reportDateRange: dateSummaryLabel
      });
    } else if (activeTab === 'cashLedger') {
      window.print();
    }
  };

  // EXPORT CSV FOR CURRENT TAB
  const handleExportCsv = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = '';

    if (activeTab === 'transfers') {
      headers = [
        'Order No',
        'Receipt No',
        'Date',
        'Sender Name',
        'Sender Phone',
        'Receiver Name',
        'Receiver Phone',
        'Station',
        'Amount AED',
        'Exchange Rate',
        'PKR Equivalent',
        'Commission AED',
        'Paid PKR',
        'Remaining Balance PKR',
        'Status'
      ];
      rows = filteredTransfers.map(tr => [
        tr.orderNumber,
        tr.receiptNumber,
        tr.date,
        `"${tr.senderName}"`,
        `"${tr.senderPhone}"`,
        `"${tr.receiverName}"`,
        `"${tr.receiverPhone}"`,
        `"${tr.station}"`,
        tr.amountAED,
        tr.exchangeRate,
        tr.amountPKR,
        tr.commissionAmount,
        tr.amountPaidPKR,
        tr.remainingBalancePKR,
        tr.status
      ]);
      filename = `EagleStar_Transfers_${todayStr}.csv`;
    } else if (activeTab === 'khata') {
      headers = [
        'Loan No',
        'Date',
        'Due Date',
        'Borrower Name',
        'Borrower Phone',
        'Original Amount',
        'Currency',
        'Total Repaid',
        'Remaining Balance',
        'Status',
        'Purpose'
      ];
      rows = filteredLoans.map(l => [
        l.loanNo,
        l.loanDate,
        l.dueDate,
        `"${l.borrowerName}"`,
        `"${l.borrowerPhone}"`,
        l.originalAmount,
        l.currency,
        l.totalRepaid,
        l.remainingBalance,
        l.status,
        `"${l.purpose || ''}"`
      ]);
      filename = `EagleStar_Khata_Loans_${todayStr}.csv`;
    } else if (activeTab === 'amanat') {
      headers = [
        'Account No',
        'Created Date',
        'Owner Name',
        'Phone',
        'City',
        'Currency',
        'Total Deposited',
        'Total Withdrawn',
        'Current Balance'
      ];
      rows = filteredAmanatAccounts.map(a => {
        const dep = a.entries
          .filter(e => e.type === 'initial_deposit' || e.type === 'additional_deposit')
          .reduce((s, e) => s + e.amount, 0);
        const wth = a.entries
          .filter(e => e.type !== 'initial_deposit' && e.type !== 'additional_deposit')
          .reduce((s, e) => s + e.amount, 0);
        return [
          a.accountNo,
          a.openedDate,
          `"${a.ownerName}"`,
          `"${a.ownerPhone}"`,
          `"${a.city || ''}"`,
          a.currency,
          dep,
          wth,
          a.currentBalance
        ];
      });
      filename = `EagleStar_Cash_Jama_Accounts_${todayStr}.csv`;
    } else {
      headers = ['Reference No', 'Date', 'Type', 'Category', 'Description', 'Amount', 'Currency'];
      rows = filteredLedger.map(e => [
        e.referenceId || e.id.slice(0, 8),
        e.date,
        e.type,
        `"${e.category}"`,
        `"${e.description}"`,
        e.amount,
        e.currency
      ]);
      filename = `EagleStar_Cash_Ledger_${todayStr}.csv`;
    }

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <EagleStarLogo variant="icon" size="md" isDarkBackground={false} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-urdu-heading">
                {language === 'ur' ? 'مکمل رپورٹ و ہسٹری آڈٹ' : 'Complete Reports & Historical Audit'}
              </h1>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              {language === 'ur'
                ? 'رقم کی منتقلی، ادھار کھاتہ، اور امانتوں کا مکمل ریکارڈ دیکھیں، فلٹر کریں، اور باضابطہ شیٹ پرنٹ کریں'
                : 'View, filter, audit, and print full register statements for Transfers, Khata, Amanat, and Cash Ledger'}
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>{language === 'ur' ? 'مکمل رپورٹ پرنٹ کریں' : 'Print Complete Report'}</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t('exportCsv')}</span>
          </button>
        </div>
      </div>

      {/* 4 Main Module Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab('transfers');
            setStatusFilter('all');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'transfers'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-700/20'
              : 'bg-white text-slate-700 hover:bg-emerald-50/70 hover:border-emerald-300 hover:text-emerald-950 border border-slate-200'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>{language === 'ur' ? 'رقم کی منتقلی ہسٹری' : 'Money Transfers History'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] ${activeTab === 'transfers' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {transfers.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('khata');
            setStatusFilter('all');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'khata'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-700/20'
              : 'bg-white text-slate-700 hover:bg-emerald-50/70 hover:border-emerald-300 hover:text-emerald-950 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{language === 'ur' ? 'ادھار و قرضہ کھاتہ ہسٹری' : 'Khata / Loans History'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] ${activeTab === 'khata' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {loans.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('amanat');
            setStatusFilter('all');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'amanat'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-700/20'
              : 'bg-white text-slate-700 hover:bg-emerald-50/70 hover:border-emerald-300 hover:text-emerald-950 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{language === 'ur' ? 'امانتیں و تحویل ہسٹری' : 'Amanat Safekeeping History'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] ${activeTab === 'amanat' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {amanatAccounts.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('cashLedger');
            setStatusFilter('all');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'cashLedger'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-700/20'
              : 'bg-white text-slate-700 hover:bg-emerald-50/70 hover:border-emerald-300 hover:text-emerald-950 border border-slate-200'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>{language === 'ur' ? 'روزنامچہ کیش بک' : 'Cash Book Ledger'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] ${activeTab === 'cashLedger' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {ledger.length}
          </span>
        </button>
      </div>

      {/* Comprehensive Filter Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Row 1: Search & Date Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={
                language === 'ur'
                  ? 'نام، فون نمبر، واؤچر/آرڈر یا شہر سے تلاش کریں...'
                  : 'Search by name, phone, number, city...'
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-blue-600"
            />
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(
              [
                { id: 'all', label: language === 'ur' ? 'سب وقت' : 'All Time' },
                { id: 'today', label: language === 'ur' ? 'آج' : 'Today' },
                { id: 'week', label: language === 'ur' ? 'اس ہفتے' : 'This Week' },
                { id: 'month', label: language === 'ur' ? 'اس مہینے' : 'This Month' },
                { id: '2026', label: '2026' },
                { id: 'custom', label: language === 'ur' ? 'مخصوص تاریخ' : 'Custom' }
              ] as const
            ).map(preset => (
              <button
                key={preset.id}
                onClick={() => setDatePreset(preset.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  datePreset === preset.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Reset Filters button */}
          {(searchTerm || datePreset !== 'all' || statusFilter !== 'all' || stationFilter !== 'all' || currencyFilter !== 'all') && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-rose-600 hover:text-rose-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{language === 'ur' ? 'فلٹرز ختم کریں' : 'Reset Filters'}</span>
            </button>
          )}
        </div>

        {/* Row 2: Secondary Dropdowns and Custom Date Range */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Custom Date Pickers */}
          {datePreset === 'custom' && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-blue-600 ml-1" />
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-transparent font-mono text-xs text-slate-800 focus:outline-none"
              />
              <span className="text-slate-400">تا</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-transparent font-mono text-xs text-slate-800 focus:outline-none"
              />
            </div>
          )}

          {/* Status filter */}
          {activeTab === 'transfers' && (
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800"
            >
              <option value="all">{language === 'ur' ? 'تمام حالات (Status)' : 'All Statuses'}</option>
              <option value="Completed">{language === 'ur' ? 'مکمل پروسیسڈ (Completed)' : 'Completed'}</option>
              <option value="Cancelled">{language === 'ur' ? 'منسوخ (Cancelled)' : 'Cancelled'}</option>
            </select>
          )}

          {activeTab === 'khata' && (
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800"
            >
              <option value="all">{language === 'ur' ? 'تمام ادھار حالت' : 'All Loan Statuses'}</option>
              <option value="Outstanding">{language === 'ur' ? 'باقی واجب الادا (Outstanding)' : 'Outstanding'}</option>
              <option value="Overdue">{language === 'ur' ? 'میعاد ختم / اوور ڈیو' : 'Overdue'}</option>
              <option value="Fully Repaid">{language === 'ur' ? 'مکمل بے باق (Paid)' : 'Fully Repaid'}</option>
            </select>
          )}

          {activeTab === 'cashLedger' && (
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800"
            >
              <option value="all">{language === 'ur' ? 'آمدن و اخراجات' : 'All Cash Flow'}</option>
              <option value="cash_in">{language === 'ur' ? 'آمدن (Cash In)' : 'Cash In'}</option>
              <option value="cash_out">{language === 'ur' ? 'اخراجات (Cash Out)' : 'Cash Out'}</option>
            </select>
          )}

          {/* Station Filter for transfers */}
          {activeTab === 'transfers' && (
            <select
              value={stationFilter}
              onChange={e => setStationFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800"
            >
              <option value="all">{language === 'ur' ? 'تمام کاؤنٹرز / اسٹیشنز' : 'All Stations'}</option>
              {stations.map(st => (
                <option key={st.id} value={language === 'ur' ? st.nameUr : st.nameEn}>
                  {language === 'ur' ? st.nameUr : st.nameEn} ({st.code})
                </option>
              ))}
            </select>
          )}

          {/* Currency Filter for Khata / Amanat */}
          {(activeTab === 'khata' || activeTab === 'amanat' || activeTab === 'cashLedger') && (
            <select
              value={currencyFilter}
              onChange={e => setCurrencyFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800"
            >
              <option value="all">{language === 'ur' ? 'تمام کرنسیاں' : 'All Currencies'}</option>
              <option value="PKR">PKR (پاکستانی روپیہ)</option>
              <option value="AED">AED (اماراتی درہم)</option>
            </select>
          )}
        </div>
      </div>

      {/* Dynamic Summary Cards for Active Tab */}
      {activeTab === 'transfers' && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-bold block">{language === 'ur' ? 'فلٹر شدہ ترسیلات' : 'Transfers Count'}</span>
            <span className="text-xl font-mono font-extrabold text-slate-900">{filteredTransfers.length}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-bold block">{language === 'ur' ? 'کل موصول رقم (AED)' : 'Total Received (AED)'}</span>
            <span className="text-lg font-mono font-extrabold text-blue-700">{formatMoney(transferSummary.totalAed, 'AED')}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-bold block">{language === 'ur' ? 'کل ترسیل رقم (PKR)' : 'Total Payable (PKR)'}</span>
            <span className="text-lg font-mono font-extrabold text-slate-950">{formatMoney(transferSummary.totalPkr, 'PKR')}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-bold block">{language === 'ur' ? 'ادا شدہ رقم (PKR)' : 'Paid (PKR)'}</span>
            <span className="text-lg font-mono font-extrabold text-emerald-700">{formatMoney(transferSummary.totalPaidPkr, 'PKR')}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-bold block">{language === 'ur' ? 'باقی واجب الادا' : 'Remaining (PKR)'}</span>
            <span className="text-lg font-mono font-extrabold text-rose-700">{formatMoney(transferSummary.totalRemainingPkr, 'PKR')}</span>
          </div>
        </div>
      )}

      {activeTab === 'khata' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-bold block">{language === 'ur' ? 'کل قرض کیسز' : 'Total Loans'}</span>
            <span className="text-xl font-mono font-extrabold text-slate-900">{filteredLoans.length}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-bold block">{language === 'ur' ? 'کل اصل رقم' : 'Total Lent'}</span>
            <span className="text-lg font-mono font-extrabold text-slate-950">{formatMoney(khataSummary.totalLent, 'PKR')}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-bold block">{language === 'ur' ? 'کل وصول شدہ واپسی' : 'Total Repaid'}</span>
            <span className="text-lg font-mono font-extrabold text-emerald-700">{formatMoney(khataSummary.totalRepaid, 'PKR')}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-bold block">{language === 'ur' ? 'باقی واجب الادا قرض' : 'Outstanding Balance'}</span>
            <span className="text-lg font-mono font-extrabold text-rose-700">{formatMoney(khataSummary.totalOutstanding, 'PKR')}</span>
          </div>
        </div>
      )}

      {activeTab === 'amanat' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-bold block">{language === 'ur' ? 'کل پیسہ جمع داران' : 'Total Accounts'}</span>
            <span className="text-2xl font-mono font-extrabold text-slate-900">{amanatSummary.totalAccounts}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-bold block">{language === 'ur' ? 'کل پیسہ جمع محفوظ (PKR)' : 'Total Held (PKR)'}</span>
            <span className="text-xl font-mono font-extrabold text-emerald-800">{formatMoney(amanatSummary.totalPkr, 'PKR')}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-bold block">{language === 'ur' ? 'کل پیسہ جمع محفوظ (AED)' : 'Total Held (AED)'}</span>
            <span className="text-xl font-mono font-extrabold text-blue-800">{formatMoney(amanatSummary.totalAed, 'AED')}</span>
          </div>
        </div>
      )}

      {activeTab === 'cashLedger' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-bold block">{language === 'ur' ? 'کل آمدن (Cash In)' : 'Total Cash In'}</span>
            <span className="text-xl font-mono font-extrabold text-emerald-700">{formatMoney(ledgerSummary.cashIn, 'PKR')}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-bold block">{language === 'ur' ? 'کل اخراجات (Cash Out)' : 'Total Cash Out'}</span>
            <span className="text-xl font-mono font-extrabold text-rose-700">{formatMoney(ledgerSummary.cashOut, 'PKR')}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-bold block">{language === 'ur' ? 'خالص بقایا (Net Balance)' : 'Net Balance'}</span>
            <span className="text-xl font-mono font-extrabold text-slate-950">{formatMoney(ledgerSummary.netBalance, 'PKR')}</span>
          </div>
        </div>
      )}

      {/* Main Historical Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Header Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-slate-900 text-sm font-urdu-heading">
              {activeTab === 'transfers'
                ? (language === 'ur' ? 'ترسیلات مکمل رجسٹر و آڈٹ شیٹ' : 'Transfers Historical Audit Register')
                : activeTab === 'khata'
                ? (language === 'ur' ? 'ادھار کھاتہ مکمل آڈٹ لسٹ' : 'Khata / Loans Audit List')
                : activeTab === 'amanat'
                ? (language === 'ur' ? 'پیسہ جمع کھاتہ داران مکمل شیٹ' : 'Cash Jama Accounts Sheet')
                : (language === 'ur' ? 'روزنامچہ کیش واؤچرز لاگ' : 'Cash Book Ledger Log')}
            </h3>
            <span className="text-xs bg-slate-200 text-slate-800 font-mono font-bold px-2 py-0.5 rounded">
              {activeTab === 'transfers'
                ? filteredTransfers.length
                : activeTab === 'khata'
                ? filteredLoans.length
                : activeTab === 'amanat'
                ? filteredAmanatAccounts.length
                : filteredLedger.length}{' '}
              {language === 'ur' ? 'ریکارڈز' : 'records'}
            </span>
          </div>

          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{language === 'ur' ? 'پرنٹ شیٹ' : 'Print Sheet'}</span>
          </button>
        </div>

        {/* 1. TRANSFERS TABLE */}
        {activeTab === 'transfers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-center w-12">#</th>
                  <th className="p-3">{language === 'ur' ? 'آرڈر نمبر' : 'Order No'}</th>
                  <th className="p-3">{t('date')}</th>
                  <th className="p-3">{t('sender')}</th>
                  <th className="p-3">{t('receiver')}</th>
                  <th className="p-3">{t('station')}</th>
                  <th className="p-3 text-right">{t('amountAed')}</th>
                  <th className="p-3 text-right">{t('rate')}</th>
                  <th className="p-3 text-right">{language === 'ur' ? 'کل رقم PKR' : 'Total PKR'}</th>
                  <th className="p-3 text-center">{t('status')}</th>
                  <th className="p-3 text-center">{language === 'ur' ? 'پرنٹ / رسید' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-8 text-slate-500 font-medium">
                      {language === 'ur' ? 'کوئی ترسیل ریکارڈ دستیاب نہیں ہے' : 'No transfers match current filter'}
                    </td>
                  </tr>
                ) : (
                  filteredTransfers.map((tr, idx) => (
                    <tr key={tr.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-blue-900">{tr.orderNumber}</td>
                      <td className="p-3 font-mono text-slate-600 whitespace-nowrap">{tr.date}</td>
                      <td className="p-3 font-medium">
                        <div>{tr.senderName}</div>
                        <div className="text-[11px] font-mono text-slate-500">{tr.senderPhone}</div>
                      </td>
                      <td className="p-3 font-medium">
                        <div>{tr.receiverName}</div>
                        <div className="text-[11px] font-mono text-slate-500">{tr.receiverPhone}</div>
                      </td>
                      <td className="p-3 text-slate-700 whitespace-nowrap">{tr.station}</td>
                      <td className="p-3 text-right font-mono font-bold text-blue-700">
                        {formatMoney(tr.amountAED, 'AED')}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-600">
                        {tr.exchangeRate.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {formatMoney(tr.amountPKR, 'PKR')}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {t('Completed')}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openReceipt({ transfer: tr, format: 'B' })}
                            className="inline-flex items-center gap-1 text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 px-2 py-1 rounded transition cursor-pointer"
                            title="View Receipt"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-semibold">{language === 'ur' ? 'دیکھیں' : 'View'}</span>
                          </button>
                          {canEditTransfers && (
                            <button
                              onClick={() => openEditTransferModal(tr)}
                              className="p-1 text-amber-700 hover:bg-amber-50 rounded transition cursor-pointer"
                              title={t('edit')}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isSuperAdmin && (
                            <button
                              onClick={() => {
                                if (confirmDeleteId === tr.id) {
                                  deleteTransfer(tr.id);
                                  setConfirmDeleteId(null);
                                } else {
                                  setConfirmDeleteId(tr.id);
                                }
                              }}
                              className={`p-1 rounded transition cursor-pointer flex items-center gap-1 ${
                                confirmDeleteId === tr.id
                                  ? 'bg-red-600 text-white px-1.5 text-[10px] font-bold'
                                  : 'text-slate-500 hover:text-red-700 hover:bg-red-50'
                              }`}
                              title={t('delete')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              {confirmDeleteId === tr.id && (
                                <span>{language === 'ur' ? 'حذف؟' : 'Confirm'}</span>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. KHATA LOANS TABLE */}
        {activeTab === 'khata' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-center w-12">#</th>
                  <th className="p-3">{language === 'ur' ? 'قرض نمبر' : 'Loan No'}</th>
                  <th className="p-3">{language === 'ur' ? 'مقروض' : 'Borrower'}</th>
                  <th className="p-3">{language === 'ur' ? 'فون نمبر' : 'Phone'}</th>
                  <th className="p-3">{language === 'ur' ? 'تاریخ اجرا' : 'Issue Date'}</th>
                  <th className="p-3">{language === 'ur' ? 'آخری تاریخ' : 'Due Date'}</th>
                  <th className="p-3 text-right">{language === 'ur' ? 'اصل قرض' : 'Principal'}</th>
                  <th className="p-3 text-right">{language === 'ur' ? 'وصول شدہ' : 'Repaid'}</th>
                  <th className="p-3 text-right">{language === 'ur' ? 'بقایا قرض' : 'Outstanding'}</th>
                  <th className="p-3 text-center">{t('status')}</th>
                  <th className="p-3 text-center">{language === 'ur' ? 'پرنٹ / رسید' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-8 text-slate-500 font-medium">
                      {language === 'ur' ? 'کوئی ادھار ریکارڈ دستیاب نہیں ہے' : 'No loans match current filter'}
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map((l, idx) => (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-blue-900">{l.loanNo}</td>
                      <td className="p-3 font-bold text-slate-900">{l.borrowerName}</td>
                      <td className="p-3 font-mono text-slate-600">{l.borrowerPhone}</td>
                      <td className="p-3 font-mono text-slate-600 whitespace-nowrap">{l.loanDate}</td>
                      <td className="p-3 font-mono text-rose-700 font-semibold whitespace-nowrap">{l.dueDate || '—'}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {formatMoney(l.originalAmount, l.currency)}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-emerald-700">
                        {formatMoney(l.totalRepaid, l.currency)}
                      </td>
                      <td className="p-3 text-right font-mono font-extrabold text-rose-700">
                        {formatMoney(l.remainingBalance, l.currency)}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            l.status === 'Fully Repaid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : l.status === 'Overdue'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {l.status === 'Fully Repaid'
                            ? (language === 'ur' ? 'ادا شدہ' : 'Fully Repaid')
                            : l.status === 'Overdue'
                            ? (language === 'ur' ? 'واجب الادا' : 'Overdue')
                            : (language === 'ur' ? 'فعال' : 'Outstanding')}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openReceipt({ loan: l, format: 'A' })}
                            className="inline-flex items-center gap-1 text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 px-2 py-1 rounded transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-semibold">{language === 'ur' ? 'دیکھیں' : 'View'}</span>
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={() => {
                                if (confirmDeleteId === l.id) {
                                  deleteLoan(l.id);
                                  setConfirmDeleteId(null);
                                } else {
                                  setConfirmDeleteId(l.id);
                                }
                              }}
                              className={`p-1 rounded transition cursor-pointer flex items-center gap-1 ${
                                confirmDeleteId === l.id
                                  ? 'bg-red-600 text-white px-1.5 text-[10px] font-bold'
                                  : 'text-slate-500 hover:text-red-700 hover:bg-red-50'
                              }`}
                              title={t('delete')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              {confirmDeleteId === l.id && (
                                <span>{language === 'ur' ? 'حذف؟' : 'Confirm'}</span>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. AMANAT SAFEKEEPING TABLE */}
        {activeTab === 'amanat' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-center w-12">#</th>
                  <th className="p-3">{language === 'ur' ? 'کھاتہ نمبر' : 'Account No'}</th>
                  <th className="p-3">{language === 'ur' ? 'کھاتہ دار' : 'Owner'}</th>
                  <th className="p-3">{language === 'ur' ? 'فون نمبر' : 'Phone'}</th>
                  <th className="p-3">{language === 'ur' ? 'شہر / پتہ' : 'City / Address'}</th>
                  <th className="p-3">{language === 'ur' ? 'تاریخ آغاز' : 'Opened Date'}</th>
                  <th className="p-3 text-center">{language === 'ur' ? 'کرنسی' : 'Currency'}</th>
                  <th className="p-3 text-right">{language === 'ur' ? 'کل جمع' : 'Deposits'}</th>
                  <th className="p-3 text-right">{language === 'ur' ? 'کل نکلوائی' : 'Withdrawals'}</th>
                  <th className="p-3 text-right">{language === 'ur' ? 'موجودہ بقایا' : 'Current Balance'}</th>
                  <th className="p-3 text-center">{language === 'ur' ? 'پرنٹ / رسید' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAmanatAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-8 text-slate-500 font-medium">
                      {language === 'ur' ? 'کوئی پیسہ جمع کھاتہ دستیاب نہیں ہے' : 'No Cash Jama accounts found'}
                    </td>
                  </tr>
                ) : (
                  filteredAmanatAccounts.map((acct, idx) => {
                    const dep = acct.entries
                      .filter(e => e.type === 'initial_deposit' || e.type === 'additional_deposit')
                      .reduce((s, e) => s + e.amount, 0);
                    const wth = acct.entries
                      .filter(e => e.type !== 'initial_deposit' && e.type !== 'additional_deposit')
                      .reduce((s, e) => s + e.amount, 0);

                    return (
                      <tr key={acct.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-blue-900">{acct.accountNo}</td>
                        <td className="p-3 font-bold text-slate-900">{acct.ownerName}</td>
                        <td className="p-3 font-mono text-slate-600">{acct.ownerPhone}</td>
                        <td className="p-3 text-slate-600">{acct.city || '—'}</td>
                        <td className="p-3 font-mono text-slate-600 whitespace-nowrap">{acct.openedDate}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              acct.currency === 'AED'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            {acct.currency}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-emerald-700">
                          {formatMoney(dep, acct.currency)}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-rose-700">
                          {formatMoney(wth, acct.currency)}
                        </td>
                        <td className="p-3 text-right font-mono font-extrabold text-slate-950">
                          {formatMoney(acct.currentBalance, acct.currency)}
                        </td>
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => openReceipt({ amanatAccount: acct, format: 'A' })}
                              className="inline-flex items-center gap-1 text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 px-2 py-1 rounded transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-semibold">{language === 'ur' ? 'دیکھیں' : 'View'}</span>
                            </button>
                            {isSuperAdmin && (
                              <button
                                onClick={() => {
                                  if (confirmDeleteId === acct.id) {
                                    deleteAmanatAccount(acct.id);
                                    setConfirmDeleteId(null);
                                  } else {
                                    setConfirmDeleteId(acct.id);
                                  }
                                }}
                                className={`p-1 rounded transition cursor-pointer flex items-center gap-1 ${
                                  confirmDeleteId === acct.id
                                    ? 'bg-red-600 text-white px-1.5 text-[10px] font-bold'
                                    : 'text-slate-500 hover:text-red-700 hover:bg-red-50'
                                }`}
                                title={t('delete')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                {confirmDeleteId === acct.id && (
                                  <span>{language === 'ur' ? 'حذف؟' : 'Confirm'}</span>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. CASH LEDGER TABLE */}
        {activeTab === 'cashLedger' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-center w-12">#</th>
                  <th className="p-3">{language === 'ur' ? 'ریفرنس نمبر' : 'Ref No'}</th>
                  <th className="p-3">{t('date')}</th>
                  <th className="p-3">{t('type')}</th>
                  <th className="p-3">{language === 'ur' ? 'کیٹگری' : 'Category'}</th>
                  <th className="p-3">{language === 'ur' ? 'تفصیل' : 'Description'}</th>
                  <th className="p-3 text-right">{language === 'ur' ? 'رقم' : 'Amount'}</th>
                  {isSuperAdmin && (
                    <th className="p-3 text-center">{t('actions')}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 8 : 7} className="text-center py-8 text-slate-500 font-medium">
                      {language === 'ur' ? 'کوئی کیش لیجر اندراج نہیں ہے' : 'No ledger entries found'}
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((e, idx) => (
                    <tr key={e.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">{e.referenceId || e.id.slice(0, 8)}</td>
                      <td className="p-3 font-mono text-slate-600 whitespace-nowrap">{e.date}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            e.type === 'cash_in'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {e.type === 'cash_in'
                            ? (language === 'ur' ? 'آمدن' : 'Cash In')
                            : (language === 'ur' ? 'اخراجات' : 'Cash Out')}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700">{e.category}</td>
                      <td className="p-3 text-slate-800 font-medium">{e.description}</td>
                      <td className={`p-3 text-right font-mono font-bold ${e.type === 'cash_in' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {e.type === 'cash_in' ? '+' : '-'} {formatMoney(e.amount, e.currency)}
                      </td>
                      {isSuperAdmin && (
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              if (confirmDeleteId === e.id) {
                                deleteLedgerEntry(e.id);
                                setConfirmDeleteId(null);
                              } else {
                                setConfirmDeleteId(e.id);
                              }
                            }}
                            className={`p-1 rounded transition cursor-pointer inline-flex items-center gap-1 ${
                              confirmDeleteId === e.id
                                ? 'bg-red-600 text-white px-1.5 text-[10px] font-bold'
                                : 'text-slate-500 hover:text-red-700 hover:bg-red-50'
                            }`}
                            title={t('delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {confirmDeleteId === e.id && (
                              <span>{language === 'ur' ? 'حذف؟' : 'Confirm'}</span>
                            )}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
