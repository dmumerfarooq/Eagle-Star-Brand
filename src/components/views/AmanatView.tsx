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
  Save,
  ArrowDownLeft,
  ArrowUpRight
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
    canManageAmanat,
    canDeleteRecords
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
  const [accOpenedDate, setAccOpenedDate] = useState('');
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

  const handlePrintIndividualStatement = () => {
    if (!selectedAccount) return;
    openReceipt({
      format: 'I',
      amanatAccount: selectedAccount,
      filteredAmanatEntries: filteredEntries,
      reportTitle: `انفرادی پیسہ جمع کھاتہ اسٹیٹمنٹ: ${selectedAccount.ownerName} (${selectedAccount.accountNo})`,
      reportDateRange:
        datePreset === 'all'
          ? 'مکمل ہسٹری (All History)'
          : datePreset === 'today'
          ? `آج کی تاریخ (${todayStr})`
          : datePreset === 'custom'
          ? `${dateFrom || 'آغاز'} تا ${dateTo || 'آج'}`
          : datePreset === '7days'
          ? 'پچھلے 7 دن (Last 7 Days)'
          : 'موجودہ ماہ (This Month)'
    });
  };

  const handlePrintSlip = () => {
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
    setAccCity(selectedAccount.city || selectedAccount.ownerAddress || '');
    setAccOpenedDate(selectedAccount.openedDate || todayStr);
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
      ownerAddress: accCity.trim() || selectedAccount.ownerAddress,
      openedDate: accOpenedDate || selectedAccount.openedDate,
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

  const handleSaveEntryChanges = (printAfterSave = false) => {
    if (!selectedAccount || !editingEntry) return;
    const amt = Math.max(0, Number(entryAmount) || 0);
    if (amt <= 0) return;
    const updatedPayload: Partial<AmanatEntry> = {
      date: entryDate || editingEntry.date,
      type: entryType,
      amount: amt,
      description: entryDesc.trim() || editingEntry.description,
      relatedPerson: entryRelatedPerson.trim(),
      paymentMethod: entryPaymentMethod,
      bankName: entryPaymentMethod === 'Cash' ? undefined : entryBankName.trim() || undefined
    };
    updateAmanatEntry(selectedAccount.id, editingEntry.id, updatedPayload);
    if (printAfterSave) {
      const updatedEntryObj: AmanatEntry = {
        ...editingEntry,
        ...updatedPayload,
        amount: amt
      };
      openReceipt({
        format: 'A',
        amanatAccount: selectedAccount,
        amanatEntry: updatedEntryObj
      });
    }
    setEditingEntry(null);
  };

  const getEntryTypeUrduLabel = (type: AmanatEntryType) => {
    switch (type) {
      case 'initial_deposit':
        return 'ابتدائی جمع رقم (+)';
      case 'additional_deposit':
        return 'مزید جمع رقم (+)';
      case 'returned_to_owner':
        return 'مالک کو رقم واپسی (-)';
      case 'partial_withdrawal':
        return 'جزوی رقم واپسی (-)';
      case 'full_withdrawal':
        return 'مکمل بقایا واپسی (-)';
      case 'third_party_payment':
        return 'منی ٹرانسفر کٹوتی (-)';
      default:
        return 'کھاتہ ایڈجسٹمنٹ';
    }
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
                ? 'انفرادی پیسہ جمع کھاتہ: جب کوئی شخص امانت رقم جمع کرائے یا واپس لے (اسٹیشن سے مکمل طور پر الگ ذاتی کھاتہ)'
                : 'Individual Cash Jama Khata: separate personal ledger when someone deposits or takes/returns money (no station deduction)'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {selectedAccount && (
            <>
              <button
                onClick={() => onOpenNewAmanat(selectedAccount, 'add_entry')}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer"
              >
                <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                <span className="font-urdu-heading">
                  {language === 'ur' ? '+ رقم جمع کریں (Deposit)' : '+ Deposit Cash'}
                </span>
              </button>
              <button
                onClick={() => onOpenNewAmanat(selectedAccount, 'withdraw_entry')}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                <span className="font-urdu-heading">
                  {language === 'ur' ? '- رقم واپسی / نکالیں (Return)' : '- Return / Take Cash'}
                </span>
              </button>
            </>
          )}
          <button
            onClick={() =>
              openReceipt({
                format: 'G',
                batchAmanat: filteredAccounts,
                reportTitle: language === 'ur' ? 'انفرادی پیسہ جمع کھاتہ رجسٹر شیٹ' : 'Individual Cash Jama Khata Register Sheet'
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
            onClick={() => onOpenNewAmanat(undefined, 'new_account')}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="font-urdu-heading">
              {language === 'ur' ? '+ نیا انفرادی کھاتہ' : '+ New Individual Khata'}
            </span>
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
                    {(isSuperAdmin || canDeleteRecords) && (
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
                    onClick={handlePrintIndividualStatement}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-slate-950 hover:bg-slate-900 px-3.5 py-1.5 rounded-lg border border-slate-900 transition shadow-sm cursor-pointer"
                    title={language === 'ur' ? 'مکمل کھاتہ یا تاریخ وار اسٹیٹمنٹ پرنٹ کریں' : 'Print Full / Date-wise Khata Statement'}
                  >
                    <Printer className="w-4 h-4 text-emerald-400" />
                    <span>{language === 'ur' ? 'کھاتہ اسٹیٹمنٹ پرنٹ' : 'Print Statement'}</span>
                  </button>
                  <button
                    onClick={handlePrintSlip}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-900 px-3 py-1.5 rounded-lg border border-slate-300 transition shadow-sm cursor-pointer"
                    title={language === 'ur' ? 'آخری واؤچر رسید پرنٹ کریں' : 'Print Slip'}
                  >
                    <Receipt className="w-4 h-4 text-emerald-700" />
                    <span>{language === 'ur' ? 'انفرادی رسید' : 'Print Slip'}</span>
                  </button>
                  <button
                    onClick={() => onOpenNewAmanat(selectedAccount, 'add_entry')}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition shadow-sm cursor-pointer"
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>
                      {language === 'ur' ? '+ رقم جمع کریں' : '+ Deposit Cash'}
                    </span>
                  </button>
                  <button
                    onClick={() => onOpenNewAmanat(selectedAccount, 'withdraw_entry')}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-lg transition shadow-sm cursor-pointer"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>{language === 'ur' ? '- رقم واپسی / نکالیں' : '- Return Cash'}</span>
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
                    <tr className="bg-slate-100/90 border-b-2 border-slate-300 text-slate-800 font-bold font-urdu-heading">
                      <th className="py-2.5 px-3 text-start">تاریخ (Date)</th>
                      <th className="py-2.5 px-3 text-start">قسم اندراج (Type)</th>
                      <th className="py-2.5 px-3 text-start">تفصیل / وصول کنندہ</th>
                      <th className="py-2.5 px-3 text-start">رقم (Amount)</th>
                      <th className="py-2.5 px-3 text-start">بقایا بیلنس (Balance)</th>
                      <th className="py-2.5 px-3 text-center">کارروائی (Actions)</th>
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
                      filteredEntries.map(entry => {
                        const isDep =
                          entry.type === 'initial_deposit' || entry.type === 'additional_deposit';
                        return (
                          <tr key={entry.id} className="hover:bg-emerald-50/60 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-slate-700 font-medium">
                              {entry.date}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold font-urdu-heading ${
                                  isDep
                                    ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                                    : 'bg-rose-100 text-rose-950 border border-rose-300'
                                }`}
                              >
                                {getEntryTypeUrduLabel(entry.type)}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-900 font-medium font-urdu-body">
                              {entry.description}
                              {(entry.bankName || entry.paymentMethod) && (
                                <span className="block text-[11px] font-bold text-emerald-950 mt-0.5 font-urdu-heading">
                                  {entry.paymentMethod === 'Cash'
                                    ? '💵 نقد کیش (Cash)'
                                    : `🏦 ${entry.bankName || entry.paymentMethod}`}
                                </span>
                              )}
                              {entry.relatedPerson && (
                                <span className="block text-[11px] text-slate-700 font-bold font-urdu-heading">
                                  {isDep ? 'جمع کرانے والا (Deposited By)' : 'وصول کنندہ (Received By)'}:{' '}
                                  {entry.relatedPerson}
                                </span>
                              )}
                            </td>
                            <td
                              className={`py-2.5 px-3 font-mono font-extrabold ${
                                isDep ? 'text-emerald-800' : 'text-rose-700'
                              }`}
                            >
                              {isDep ? '+' : '-'}
                              {formatMoney(entry.amount, entry.currency)}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-extrabold text-slate-950">
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
                                  title="اردو رسید پرنٹ کریں / Print Receipt"
                                >
                                  <Receipt className="w-4 h-4" />
                                </button>
                                {canManageAmanat && (
                                  <button
                                    onClick={() => openEditEntryModal(entry)}
                                    className="p-1 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded transition cursor-pointer"
                                    title="ترمیم کریں / Edit Entry"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                )}
                                {(isSuperAdmin || canDeleteRecords) && (
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
                                    title="حذف کریں / Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    {confirmDeleteEntryId === entry.id && (
                                      <span>حذف؟</span>
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
                پیسہ جمع کھاتہ دار معلومات میں ترمیم (Edit Khata Account)
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
                <label className="block font-bold text-slate-700 mb-1 font-urdu-heading">
                  کھاتہ دار کا نام (Account Holder Name) *
                </label>
                <input
                  type="text"
                  value={accOwnerName}
                  onChange={e => setAccOwnerName(e.target.value)}
                  placeholder="کھاتہ دار کا نام (Account Holder Name)"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1 font-urdu-heading">
                  موبائل نمبر (Phone Number)
                </label>
                <input
                  type="text"
                  value={accOwnerPhone}
                  onChange={e => setAccOwnerPhone(e.target.value)}
                  placeholder="موبائل نمبر (Phone Number)"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1 font-urdu-heading">
                  شہر / پتہ (City / Address)
                </label>
                <input
                  type="text"
                  value={accCity}
                  onChange={e => setAccCity(e.target.value)}
                  placeholder="شہر / پتہ (City / Address)"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 font-urdu-heading">
                    کھاتہ آغاز تاریخ (Opening Date)
                  </label>
                  <input
                    type="date"
                    value={accOpenedDate}
                    onChange={e => setAccOpenedDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 font-urdu-heading">
                    کرنسی (Currency)
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
            </div>
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setIsEditingAccount(false)}
                className="px-4 py-1.5 border border-slate-300 rounded-lg text-xs font-bold font-urdu-heading"
              >
                منسوخ کریں (Cancel)
              </button>
              <button
                onClick={handleSaveAccountDetails}
                className="flex items-center gap-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer font-urdu-heading"
              >
                <Save className="w-3.5 h-3.5" />
                <span>محفوظ کریں (Save)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Single Amanat Entry Modal */}
      {editingEntry && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base font-urdu-heading">
                پیسہ جمع اندراج میں ترمیم (Edit Cash Jama Entry)
              </h3>
              <button
                onClick={() => setEditingEntry(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 font-urdu-heading">
                    تاریخ اندراج (Custom Date) *
                  </label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={e => setEntryDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 font-urdu-heading">
                    قسم اندراج (Entry Type) *
                  </label>
                  <select
                    value={entryType}
                    onChange={e => setEntryType(e.target.value as AmanatEntryType)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold font-urdu-heading"
                  >
                    <option value="initial_deposit">ابتدائی جمع رقم (Initial Deposit +)</option>
                    <option value="additional_deposit">مزید جمع رقم (Deposit +)</option>
                    <option value="returned_to_owner">رقم واپسی (Return Money -)</option>
                    <option value="third_party_payment">تیسرے فریق کو ادائیگی (Third Party -)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1 font-urdu-heading">
                  رقم ({selectedAccount.currency}) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={entryAmount}
                  onChange={e => setEntryAmount(e.target.value)}
                  placeholder={`رقم (${selectedAccount.currency})`}
                  className="w-full border-2 border-emerald-500 rounded-lg px-3 py-2 font-mono font-bold text-base"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 font-urdu-heading">
                    ادائیگی کا طریقہ (Payment Method)
                  </label>
                  <select
                    value={entryPaymentMethod}
                    onChange={e => setEntryPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
                  >
                    <option value="Cash">نقد کیش (Cash)</option>
                    <option value="Bank Transfer">بینک ٹرانسفر (Bank Transfer)</option>
                    <option value="EasyPaisa">ایزی پیسہ (EasyPaisa)</option>
                    <option value="JazzCash">جاز کیش (JazzCash)</option>
                    <option value="NayaPay">نیا پے (NayaPay)</option>
                    <option value="SadaPay">سدا پے (SadaPay)</option>
                    <option value="Raast">راست (Raast)</option>
                    <option value="Cheque">چیک (Cheque)</option>
                    <option value="Other">دیگر (Other)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 font-urdu-heading">
                    {entryType === 'initial_deposit' || entryType === 'additional_deposit'
                      ? 'جمع کرانے والا (Deposited By)'
                      : 'وصول کنندہ (Received By)'}
                  </label>
                  <input
                    type="text"
                    value={entryRelatedPerson}
                    onChange={e => setEntryRelatedPerson(e.target.value)}
                    placeholder={
                      entryType === 'initial_deposit' || entryType === 'additional_deposit'
                        ? 'جمع کرانے والا (Deposited By)'
                        : 'وصول کنندہ (Received By)'
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-semibold"
                  />
                </div>
              </div>
              {entryPaymentMethod !== 'Cash' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1 font-urdu-heading">
                    بینک / والٹ نام (Bank / Wallet Name)
                  </label>
                  <input
                    type="text"
                    value={entryBankName}
                    onChange={e => setEntryBankName(e.target.value)}
                    placeholder="بینک / والٹ نام (Bank / Wallet Name)"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
              )}
              <div>
                <label className="block font-bold text-slate-700 mb-1 font-urdu-heading">
                  تفصیل / نوٹس (Description / Notes)
                </label>
                <input
                  type="text"
                  value={entryDesc}
                  onChange={e => setEntryDesc(e.target.value)}
                  placeholder="تفصیل / نوٹس (Description / Notes)"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex flex-wrap justify-end gap-2">
              <button
                onClick={() => setEditingEntry(null)}
                className="px-4 py-1.5 border border-slate-300 rounded-lg text-xs font-bold font-urdu-heading"
              >
                منسوخ کریں (Cancel)
              </button>
              <button
                onClick={() => handleSaveEntryChanges(false)}
                className="flex items-center gap-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer font-urdu-heading"
              >
                <Save className="w-3.5 h-3.5" />
                <span>محفوظ کریں (Save)</span>
              </button>
              <button
                onClick={() => handleSaveEntryChanges(true)}
                className="flex items-center gap-1 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer font-urdu-heading"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>محفوظ کریں اور رسید پرنٹ کریں (Save & Print)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
