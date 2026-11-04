/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AmanatAccount, AmanatEntry, AmanatEntryType, Currency, PaymentMethod } from '../../types';
import { EagleStarLogo } from '../common/EagleStarLogo';
import {
  Plus,
  Search,
  Receipt,
  ArrowRightLeft,
  Printer,
  Edit3,
  Trash2,
  Calendar,
  RotateCcw,
  X,
  Save
} from 'lucide-react';
import { AmanatModalMode } from '../modals/NewAmanatModal';

interface AmanatViewProps {
  onOpenNewAmanat: (account?: AmanatAccount, mode?: AmanatModalMode) => void;
}

export const AmanatView: React.FC<AmanatViewProps> = ({ onOpenNewAmanat }) => {
  const {
    amanatAccounts,
    saveAmanatAccount,
    deleteAmanatAccount,
    updateAmanatEntry,
    deleteAmanatEntry,
    openReceipt,
    t,
    language,
    formatMoney,
    isSuperAdmin,
    canManageAmanat
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    amanatAccounts[0]?.id || ''
  );

  // Entry history filters
  const [entrySearch, setEntrySearch] = useState('');
  const [entryTypeFilter, setEntryTypeFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | '7days' | 'month' | 'custom'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Confirm delete states (Super Admin only)
  const [confirmDeleteAccountId, setConfirmDeleteAccountId] = useState<string | null>(null);
  const [confirmDeleteEntryId, setConfirmDeleteEntryId] = useState<string | null>(null);

  // Edit Account Info Modal State
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [accOwnerName, setAccOwnerName] = useState('');
  const [accOwnerPhone, setAccOwnerPhone] = useState('');
  const [accCity, setAccCity] = useState('');
  const [accCurrency, setAccCurrency] = useState<Currency>('PKR');

  // Edit Single Amanat Entry Modal State
  const [editingEntry, setEditingEntry] = useState<AmanatEntry | null>(null);
  const [entryDate, setEntryDate] = useState('');
  const [entryType, setEntryType] = useState<AmanatEntryType>('additional_deposit');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryDesc, setEntryDesc] = useState('');
  const [entryRelatedPerson, setEntryRelatedPerson] = useState('');
  const [entryPaymentMethod, setEntryPaymentMethod] = useState<PaymentMethod>('Cash');
  const [entryBankName, setEntryBankName] = useState('');

  const selectedAccount =
    amanatAccounts.find(a => a.id === selectedAccountId) || amanatAccounts[0];

  const filteredAccounts = amanatAccounts.filter(a => {
    const term = searchTerm.toLowerCase();
    return (
      a.ownerName.toLowerCase().includes(term) ||
      a.ownerPhone.includes(term) ||
      a.accountNo.toLowerCase().includes(term)
    );
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredEntries = useMemo(() => {
    if (!selectedAccount) return [];
    return selectedAccount.entries.filter(entry => {
      const isDeposit =
        entry.type === 'initial_deposit' || entry.type === 'additional_deposit';
      if (entryTypeFilter === 'deposit' && !isDeposit) return false;
      if (entryTypeFilter === 'withdrawal' && isDeposit) return false;

      const eDate = (entry.date || '').slice(0, 10);
      if (datePreset === 'today' && eDate !== todayStr) return false;
      if (datePreset === '7days') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        if (eDate < d.toISOString().split('T')[0]) return false;
      }
      if (datePreset === 'month') {
        if (!eDate.startsWith(todayStr.slice(0, 7))) return false;
      }
      if (datePreset === 'custom') {
        if (dateFrom && eDate < dateFrom) return false;
        if (dateTo && eDate > dateTo) return false;
      }

      if (entrySearch.trim()) {
        const q = entrySearch.toLowerCase();
        const mDesc = entry.description.toLowerCase().includes(q);
        const mPerson = (entry.relatedPerson || '').toLowerCase().includes(q);
        const mBank = (entry.bankName || '').toLowerCase().includes(q);
        if (!mDesc && !mPerson && !mBank) return false;
      }
      return true;
    });
  }, [selectedAccount, entryTypeFilter, datePreset, dateFrom, dateTo, entrySearch, todayStr]);

  const totalHeldPkr = amanatAccounts.reduce(
    (s, a) => s + (a.currency === 'PKR' ? a.currentBalance : 0),
    0
  );
  const totalHeldAed = amanatAccounts.reduce(
    (s, a) => s + (a.currency === 'AED' ? a.currentBalance : 0),
    0
  );

  const handlePrintStatement = () => {
    if (!selectedAccount) return;
    openReceipt({
      format: 'A',
      amanatAccount: selectedAccount,
      amanatEntry: selectedAccount.entries[selectedAccount.entries.length - 1]
    });
  };

  const openEditAccount = () => {
    if (!selectedAccount) return;
    setAccOwnerName(selectedAccount.ownerName);
    setAccOwnerPhone(selectedAccount.ownerPhone);
    setAccCity(selectedAccount.city || '');
    setAccCurrency(selectedAccount.currency);
    setIsEditingAccount(true);
  };

  const handleSaveAccountDetails = () => {
    if (!selectedAccount) return;
    const updated: AmanatAccount = {
      ...selectedAccount,
      ownerName: accOwnerName.trim() || selectedAccount.ownerName,
      ownerPhone: accOwnerPhone.trim() || selectedAccount.ownerPhone,
      city: accCity.trim() || selectedAccount.city,
      currency: accCurrency,
      entries: selectedAccount.entries.map(e => ({ ...e, currency: accCurrency }))
    };
    saveAmanatAccount(updated);
    setIsEditingAccount(false);
  };

  const openEditEntryModal = (entry: AmanatEntry) => {
    setEditingEntry(entry);
    setEntryDate(entry.date);
    setEntryType(entry.type);
    setEntryAmount(String(entry.amount));
    setEntryDesc(entry.description);
    setEntryRelatedPerson(entry.relatedPerson || '');
    setEntryPaymentMethod(entry.paymentMethod || 'Cash');
    setEntryBankName(entry.bankName || '');
  };

  const handleSaveEntryChanges = () => {
    if (!selectedAccount || !editingEntry) return;
    const amt = Math.max(0, Number(entryAmount) || 0);
    updateAmanatEntry(selectedAccount.id, editingEntry.id, {
      date: entryDate || editingEntry.date,
      type: entryType,
      amount: amt,
      description: entryDesc.trim() || editingEntry.description,
      relatedPerson: entryRelatedPerson.trim() || undefined,
      paymentMethod: entryPaymentMethod,
      bankName: entryBankName.trim() || undefined
    });
    setEditingEntry(null);
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
                {t('amanat')}
              </h1>
              <span className="text-xs bg-emerald-100 text-emerald-950 border border-emerald-200 font-bold px-2.5 py-0.5 rounded-full font-mono">
                {filteredAccounts.length} {language === 'ur' ? 'کھاتے' : 'Accounts'}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              {language === 'ur'
                ? 'پیسہ جمع و تحویل میں رکھی گئی رقوم، آدھی یا جزوی رقم ٹرانسفر کٹوتی اور مکمل کھاتہ لیجر'
                : 'Cash Jamah safekeeping ledger: deposits, half/partial transfer auto-deduction, and full Khata history'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {selectedAccount && (
            <button
              onClick={() => onOpenNewAmanat(selectedAccount, 'send_transfer')}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4 stroke-[2.5]" />
              <span className="font-urdu-heading">
                {language === 'ur' ? 'پیسہ جمع سے ٹرانسفر بھیجیں' : 'Send Transfer from Cash Jamah'}
              </span>
            </button>
          )}
          <button
            onClick={() =>
              openReceipt({
                format: 'G',
                batchAmanat: filteredAccounts,
                reportTitle: language === 'ur' ? 'پیسہ جمع و تحویل رجسٹر شیٹ' : 'Cash Jamah Safekeeping Register Sheet'
              })
            }
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span className="font-urdu-heading">
              {language === 'ur' ? 'پرنٹ مکمل رجسٹر' : 'Print Register'}
            </span>
          </button>
          <button
            onClick={() => onOpenNewAmanat(undefined, 'entry')}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="font-urdu-heading">{t('recordAmanat')}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards with Gradients & High Contrast */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-b from-cyan-50/70 via-white to-white p-5 rounded-2xl border border-cyan-200 shadow-sm space-y-2">
          <span className="text-xs text-cyan-950 font-bold block uppercase tracking-wider">
            {t('totalAmanatHeld')} (PKR)
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-900">
            {formatMoney(totalHeldPkr, 'PKR')}
          </div>
          <span className="text-xs text-slate-700 font-bold block">
            {language === 'ur' ? 'پیسہ جمع رقم (پاکستانی روپیہ)' : 'Cash Jamah Liabilities (PKR)'}
          </span>
        </div>

        <div className="bg-gradient-to-b from-blue-50/70 via-white to-white p-5 rounded-2xl border border-blue-200 shadow-sm space-y-2">
          <span className="text-xs text-blue-950 font-bold block uppercase tracking-wider">
            {t('totalAmanatHeld')} (AED)
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-900">
            {formatMoney(totalHeldAed, 'AED')}
          </div>
          <span className="text-xs text-slate-700 font-bold block">
            {language === 'ur' ? 'پیسہ جمع رقم (اماراتی درہم)' : 'Cash Jamah Liabilities (AED)'}
          </span>
        </div>

        <div className="bg-gradient-to-b from-slate-50 via-white to-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs text-slate-700 font-bold block uppercase tracking-wider">{t('activeDepositors')}</span>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-950">
            {amanatAccounts.length}
          </div>
          <span className="text-xs text-slate-700 font-bold block">
            {language === 'ur' ? 'کل پیسہ جمع کھاتے دار گاہک' : 'Active Account Holders'}
          </span>
        </div>
      </div>

      {/* Main Ledger Split Screen: Accounts List + Active Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Account Directory */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
            <h3 className="font-extrabold text-slate-900 font-urdu-heading text-sm">
              {language === 'ur' ? 'پیسہ جمع کھاتہ داران' : 'Cash Jamah Account Holders'}
            </h3>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 rtl:right-3 rtl:left-auto" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={language === 'ur' ? 'نام یا فون تلاش کریں...' : 'Search name or phone...'}
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 rtl:pr-9 rtl:pl-3 text-xs text-slate-950 font-medium placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[520px]">
            {filteredAccounts.map(acc => {
              const isSelected = acc.id === (selectedAccount?.id || '');
              return (
                <div
                  key={acc.id}
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={`p-3.5 cursor-pointer transition ${
                    isSelected
                      ? 'bg-emerald-50/90 border-l-4 border-emerald-600 font-semibold'
                      : 'hover:bg-emerald-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-950 text-sm">{acc.ownerName}</span>
                    <span className="font-mono text-xs font-bold text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                      {acc.currentBalance.toLocaleString()} {acc.currency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600 mt-1 font-mono">
                    <span>{acc.accountNo}</span>
                    <span>{acc.ownerPhone}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Account Ledger Details */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {selectedAccount ? (
            <>
              {/* Ledger Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg text-slate-950 font-urdu-heading">
                      {selectedAccount.ownerName}
                    </span>
                    <span className="text-xs bg-emerald-100 text-emerald-950 font-mono font-bold px-2 py-0.5 rounded border border-emerald-200">
                      {selectedAccount.accountNo}
                    </span>
                    {canManageAmanat && (
                      <button
                        onClick={openEditAccount}
                        className="p-1 text-amber-700 hover:bg-amber-50 rounded transition cursor-pointer"
                        title={language === 'ur' ? 'کھاتہ دار معلومات میں ترمیم' : 'Edit Account Holder Info'}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    {isSuperAdmin && (
                      <button
                        onClick={() => {
                          if (confirmDeleteAccountId === selectedAccount.id) {
                            deleteAmanatAccount(selectedAccount.id);
                            setConfirmDeleteAccountId(null);
                          } else {
                            setConfirmDeleteAccountId(selectedAccount.id);
                          }
                        }}
                        className={`p-1 rounded transition cursor-pointer flex items-center gap-1 ${
                          confirmDeleteAccountId === selectedAccount.id
                            ? 'bg-red-600 text-white px-2 text-[11px] font-bold'
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                        title={language === 'ur' ? 'کھاتہ حذف کریں (صرف سپر ایڈمن)' : 'Delete Account (Super Admin Only)'}
                      >
                        <Trash2 className="w-4 h-4" />
                        {confirmDeleteAccountId === selectedAccount.id && (
                          <span>{language === 'ur' ? 'حذف؟' : 'Confirm'}</span>
                        )}
                      </button>
                    )}
                  </div>
                  <span className="text-xs text-slate-600 font-medium">
                    {selectedAccount.ownerPhone} · {selectedAccount.city || 'KPK'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handlePrintStatement}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-900 px-3 py-1.5 rounded-lg border border-slate-300 transition shadow-sm cursor-pointer"
                  >
                    <Receipt className="w-4 h-4 text-emerald-700" />
                    <span>{language === 'ur' ? 'اسٹیٹمنٹ پرنٹ' : 'Print Statement'}</span>
                  </button>
                  <button
                    onClick={() => onOpenNewAmanat(selectedAccount, 'send_transfer')}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-3 py-1.5 rounded-lg transition shadow-sm cursor-pointer"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>
                      {language === 'ur' ? 'پیسہ جمع سے ٹرانسفر' : 'Send Transfer'}
                    </span>
                  </button>
                  <button
                    onClick={() => onOpenNewAmanat(selectedAccount, 'entry')}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 px-3 py-1.5 rounded-lg transition shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{language === 'ur' ? 'جمع / واپسی درج کریں' : 'Add Entry'}</span>
                  </button>
                </div>
              </div>

              {/* Current Balance Bar */}
              <div className="p-4 bg-slate-100 border-b border-slate-200 text-slate-950 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-800 font-bold uppercase tracking-wider block">
                    {language === 'ur' ? 'موجودہ پیسہ جمع بقایا رقم' : 'Current Cash Jamah Balance'}
                  </span>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-slate-950 mt-0.5">
                    {selectedAccount.currentBalance.toLocaleString()} {selectedAccount.currency}
                  </div>
                </div>
                <div className="text-xs text-slate-700 font-mono text-end font-semibold">
                  <p>کھاتہ آغاز: {selectedAccount.openedDate}</p>
                  <p>کل اندراجات: {selectedAccount.entries.length}</p>
                </div>
              </div>

              {/* History Filter Bar for Selected Account */}
              <div className="p-3 bg-white border-b border-slate-200 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      value={entrySearch}
                      onChange={e => setEntrySearch(e.target.value)}
                      placeholder={language === 'ur' ? 'کھاتہ ہسٹری میں تلاش کریں...' : 'Filter history entries...'}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-2.5 py-1 text-xs"
                    />
                  </div>
                  <select
                    value={entryTypeFilter}
                    onChange={e => setEntryTypeFilter(e.target.value as 'all' | 'deposit' | 'withdrawal')}
                    className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 font-bold text-slate-800"
                  >
                    <option value="all">{language === 'ur' ? 'تمام اندراجات' : 'All Entries'}</option>
                    <option value="deposit">{language === 'ur' ? 'صرف جمع (Deposits)' : 'Deposits Only'}</option>
                    <option value="withdrawal">{language === 'ur' ? 'صرف کٹوتی / واپسی' : 'Withdrawals / Transfers'}</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1">
                    {(
                      [
                        { id: 'all', label: language === 'ur' ? 'سب' : 'All' },
                        { id: 'today', label: language === 'ur' ? 'آج' : 'Today' },
                        { id: '7days', label: language === 'ur' ? '7 دن' : '7 Days' },
                        { id: 'month', label: language === 'ur' ? 'اس ماہ' : 'Month' },
                        { id: 'custom', label: language === 'ur' ? 'مخصوص تاریخ' : 'Custom' }
                      ] as const
                    ).map(p => (
                      <button
                        key={p.id}
                        onClick={() => setDatePreset(p.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                          datePreset === p.id
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                    {datePreset === 'custom' && (
                      <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 px-2 py-0.5 rounded">
                        <Calendar className="w-3 h-3 text-emerald-700" />
                        <input
                          type="date"
                          value={dateFrom}
                          onChange={e => setDateFrom(e.target.value)}
                          className="bg-transparent text-[11px] font-mono"
                        />
                        <span>→</span>
                        <input
                          type="date"
                          value={dateTo}
                          onChange={e => setDateTo(e.target.value)}
                          className="bg-transparent text-[11px] font-mono"
                        />
                      </div>
                    )}
                  </div>
                  {(entrySearch || entryTypeFilter !== 'all' || datePreset !== 'all') && (
                    <button
                      onClick={() => {
                        setEntrySearch('');
                        setEntryTypeFilter('all');
                        setDatePreset('all');
                        setDateFrom('');
                        setDateTo('');
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:text-rose-900"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{language === 'ur' ? 'ری سیٹ' : 'Reset'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Entries Table */}
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-start text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 border-b-2 border-slate-300 text-slate-800 font-bold font-urdu-body">
                      <th className="py-2.5 px-3 text-start">{t('date')}</th>
                      <th className="py-2.5 px-3 text-start">{t('type')}</th>
                      <th className="py-2.5 px-3 text-start">{t('notes')}</th>
                      <th className="py-2.5 px-3 text-start">{t('amount')}</th>
                      <th className="py-2.5 px-3 text-start">{t('balance')}</th>
                      <th className="py-2.5 px-3 text-center">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredEntries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 font-bold">
                          {t('noRecordsFound')}
                        </td>
                      </tr>
                    ) : (
                      filteredEntries.map(entry => (
                        <tr key={entry.id} className="hover:bg-emerald-50/60 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-slate-700 font-medium">
                            {entry.date}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold font-urdu-heading ${
                                entry.type.toLowerCase().includes('deposit')
                                  ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                                  : 'bg-rose-100 text-rose-950 border border-rose-300'
                              }`}
                            >
                              {t(entry.type)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-900 font-medium font-urdu-body">
                            {entry.description}
                            {(entry.bankName || entry.paymentMethod) && (
                              <span className="block text-[11px] font-bold text-emerald-950 mt-0.5 font-mono">
                                {entry.paymentMethod === 'Cash'
                                  ? '💵 نقد کیش (Cash)'
                                  : `🏦 ${entry.bankName || entry.paymentMethod}`}
                              </span>
                            )}
                            {entry.relatedPerson && (
                              <span className="block text-[11px] text-slate-600">
                                {language === 'ur' ? 'وصول کنندہ فریق' : 'Recipient'}: {entry.relatedPerson}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-extrabold text-slate-950">
                            {formatMoney(entry.amount, entry.currency)}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-extrabold text-emerald-950">
                            {formatMoney(entry.newBalance, entry.currency)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() =>
                                  openReceipt({
                                    format: 'A',
                                    amanatAccount: selectedAccount,
                                    amanatEntry: entry
                                  })
                                }
                                className="p-1 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded transition cursor-pointer"
                                title={t('printReceipt')}
                              >
                                <Receipt className="w-4 h-4" />
                              </button>
                              {canManageAmanat && (
                                <button
                                  onClick={() => openEditEntryModal(entry)}
                                  className="p-1 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded transition cursor-pointer"
                                  title={t('edit')}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}
                              {isSuperAdmin && (
                                <button
                                  onClick={() => {
                                    if (confirmDeleteEntryId === entry.id) {
                                      deleteAmanatEntry(selectedAccount.id, entry.id);
                                      setConfirmDeleteEntryId(null);
                                    } else {
                                      setConfirmDeleteEntryId(entry.id);
                                    }
                                  }}
                                  className={`p-1 rounded transition cursor-pointer flex items-center gap-1 ${
                                    confirmDeleteEntryId === entry.id
                                      ? 'bg-red-600 text-white px-2 text-[10px] font-bold'
                                      : 'text-slate-500 hover:text-red-700 hover:bg-red-50'
                                  }`}
                                  title={t('delete')}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  {confirmDeleteEntryId === entry.id && (
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
            </>
          ) : (
            <div className="py-20 text-center text-slate-500 font-bold">
              {t('noDataFound')}
            </div>
          )}
        </div>
      </div>

      {/* Edit Account Info Modal */}
      {isEditingAccount && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base font-urdu-heading">
                {language === 'ur' ? 'پیسہ جمع کھاتہ دار معلومات میں ترمیم' : 'Edit Cash Jama Account Info'}
              </h3>
              <button
                onClick={() => setIsEditingAccount(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'ur' ? 'کھاتہ دار کا نام' : 'Owner Name'} *
                </label>
                <input
                  type="text"
                  value={accOwnerName}
                  onChange={e => setAccOwnerName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'ur' ? 'موبائل نمبر' : 'Phone Number'}
                </label>
                <input
                  type="text"
                  value={accOwnerPhone}
                  onChange={e => setAccOwnerPhone(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'ur' ? 'شہر / پتہ' : 'City / Address'}
                </label>
                <input
                  type="text"
                  value={accCity}
                  onChange={e => setAccCity(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'ur' ? 'کرنسی' : 'Currency'}
                </label>
                <select
                  value={accCurrency}
                  onChange={e => setAccCurrency(e.target.value as Currency)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
                >
                  <option value="PKR">PKR (پاکستانی روپیہ)</option>
                  <option value="AED">AED (اماراتی درہم)</option>
                </select>
              </div>
            </div>
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setIsEditingAccount(false)}
                className="px-4 py-1.5 border border-slate-300 rounded-lg text-xs font-bold"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSaveAccountDetails}
                className="flex items-center gap-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{t('save')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Single Amanat Entry Modal */}
      {editingEntry && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base font-urdu-heading">
                {language === 'ur' ? 'پیسہ جمع اندراج میں ترمیم' : 'Edit Cash Jama History Entry'}
              </h3>
              <button
                onClick={() => setEditingEntry(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('date')}</label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={e => setEntryDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('type')}</label>
                  <select
                    value={entryType}
                    onChange={e => setEntryType(e.target.value as AmanatEntryType)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
                  >
                    <option value="initial_deposit">{t('initial_deposit')}</option>
                    <option value="additional_deposit">{t('additional_deposit')}</option>
                    <option value="partial_withdrawal">{t('partial_withdrawal')}</option>
                    <option value="full_return">{t('full_return')}</option>
                    <option value="transfer_deduction">{t('transfer_deduction')}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t('amount')} ({selectedAccount.currency}) *
                </label>
                <input
                  type="number"
                  value={entryAmount}
                  onChange={e => setEntryAmount(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-base"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('notes')}</label>
                <input
                  type="text"
                  value={entryDesc}
                  onChange={e => setEntryDesc(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ur' ? 'طریقہ کار' : 'Method'}
                  </label>
                  <select
                    value={entryPaymentMethod}
                    onChange={e => setEntryPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
                  >
                    <option value="Cash">Cash (نقد)</option>
                    <option value="Bank">Bank (بینک)</option>
                    <option value="Wallet">Wallet (والٹ)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ur' ? 'بینک / والٹ نام' : 'Bank / Wallet Name'}
                  </label>
                  <input
                    type="text"
                    value={entryBankName}
                    onChange={e => setEntryBankName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'ur' ? 'وصول کنندہ / متعلقہ شخص' : 'Related Person / Recipient'}
                </label>
                <input
                  type="text"
                  value={entryRelatedPerson}
                  onChange={e => setEntryRelatedPerson(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setEditingEntry(null)}
                className="px-4 py-1.5 border border-slate-300 rounded-lg text-xs font-bold"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSaveEntryChanges}
                className="flex items-center gap-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{t('save')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
