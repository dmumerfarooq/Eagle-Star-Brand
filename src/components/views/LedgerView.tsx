/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LedgerEntry, Currency, PaymentMethod } from '../../types';
import { EagleStarLogo } from '../common/EagleStarLogo';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  RotateCcw,
  X,
  Save
} from 'lucide-react';

export const LedgerView: React.FC = () => {
  const {
    ledger,
    addLedgerEntry,
    updateLedgerEntry,
    deleteLedgerEntry,
    t,
    language,
    formatMoney,
    isSuperAdmin,
    canAccessCashLedger
  } = useApp();

  const [typeFilter, setTypeFilter] = useState<'all' | 'cash_in' | 'cash_out'>('all');
  const [currencyFilter, setCurrencyFilter] = useState<'all' | 'AED' | 'PKR'>('all');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | '7days' | 'month' | 'custom'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Add / Edit Cash Book Entry Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [entryType, setEntryType] = useState<'cash_in' | 'cash_out'>('cash_in');
  const [entryCategory, setEntryCategory] = useState<LedgerEntry['category']>('adjustment');
  const [entryDesc, setEntryDesc] = useState('');
  const [entryPartyName, setEntryPartyName] = useState('');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryCurrency, setEntryCurrency] = useState<Currency>('PKR');
  const [entryMethod, setEntryMethod] = useState<PaymentMethod>('Cash');
  const [entryRef, setEntryRef] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const openNewEntryModal = () => {
    setEditingEntry(null);
    setEntryDate(todayStr);
    setEntryType('cash_in');
    setEntryCategory('adjustment');
    setEntryDesc('');
    setEntryPartyName('');
    setEntryAmount('');
    setEntryCurrency('PKR');
    setEntryMethod('Cash');
    setEntryRef(`CB-${Math.floor(1000 + Math.random() * 9000)}`);
    setIsModalOpen(true);
  };

  const openEditEntryModal = (entry: LedgerEntry) => {
    setEditingEntry(entry);
    setEntryDate(entry.date);
    setEntryType(entry.type);
    setEntryCategory(entry.category);
    setEntryDesc(entry.description);
    setEntryPartyName(entry.partyName || '');
    setEntryAmount(String(entry.amount));
    setEntryCurrency(entry.currency);
    setEntryMethod(entry.paymentMethod || 'Cash');
    setEntryRef(entry.referenceId || '');
    setIsModalOpen(true);
  };

  const handleSaveEntry = () => {
    const amt = Math.max(0, Number(entryAmount) || 0);
    if (!amt || !entryDesc.trim()) return;
    if (editingEntry) {
      updateLedgerEntry({
        ...editingEntry,
        date: entryDate || editingEntry.date,
        type: entryType,
        category: entryCategory,
        description: entryDesc.trim(),
        partyName: entryPartyName.trim() || undefined,
        amount: amt,
        currency: entryCurrency,
        paymentMethod: entryMethod,
        referenceId: entryRef.trim() || undefined
      });
    } else {
      addLedgerEntry({
        id: `led-${Date.now()}`,
        date: entryDate || todayStr,
        type: entryType,
        category: entryCategory,
        description: entryDesc.trim(),
        partyName: entryPartyName.trim() || undefined,
        amount: amt,
        currency: entryCurrency,
        paymentMethod: entryMethod,
        referenceId: entryRef.trim() || undefined
      });
    }
    setIsModalOpen(false);
  };

  const filteredEntries = ledger.filter(entry => {
    if (typeFilter !== 'all' && entry.type !== typeFilter) return false;
    if (currencyFilter !== 'all' && entry.currency !== currencyFilter) return false;

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

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchDesc = entry.description.toLowerCase().includes(term);
      const matchParty = (entry.partyName || '').toLowerCase().includes(term);
      const matchRef = (entry.referenceId || '').toLowerCase().includes(term);
      if (!matchDesc && !matchParty && !matchRef) return false;
    }
    return true;
  });

  const totalInAed = filteredEntries
    .filter(e => e.type === 'cash_in' && e.currency === 'AED')
    .reduce((s, e) => s + e.amount, 0);
  const totalInPkr = filteredEntries
    .filter(e => e.type === 'cash_in' && e.currency === 'PKR')
    .reduce((s, e) => s + e.amount, 0);

  const totalOutAed = filteredEntries
    .filter(e => e.type === 'cash_out' && e.currency === 'AED')
    .reduce((s, e) => s + e.amount, 0);
  const totalOutPkr = filteredEntries
    .filter(e => e.type === 'cash_out' && e.currency === 'PKR')
    .reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <EagleStarLogo variant="icon" size="md" isDarkBackground={false} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-urdu-heading">
                {t('cashLedger')}
              </h1>
              <span className="text-xs bg-slate-200 text-slate-900 font-bold px-2.5 py-0.5 rounded-full font-mono">
                {filteredEntries.length} {language === 'ur' ? 'اندراجات' : 'Entries'}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              {language === 'ur'
                ? 'داخلی روزنامچہ و نقدی کا حساب کتاب (ترسیلات، ادھار، پیسہ جمع اور آمدنی)'
                : 'Internal cash movements, remittances received, disbursements, loans, and Cash Jama safekeeping'}
            </p>
          </div>
        </div>

        {canAccessCashLedger && (
          <button
            onClick={openNewEntryModal}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="font-urdu-heading">
              {language === 'ur' ? 'نیا کیش بک اندراج' : 'New Cash Entry'}
            </span>
          </button>
        )}
      </div>

      {/* Cash Movement Totals with High Contrast & Gradients */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-b from-emerald-50/70 via-white to-white p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-2">
          <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
            <ArrowDownLeft className="w-4 h-4 text-emerald-700" />
            <span>{t('cashReceivedTotal')} (AED)</span>
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-800">
            {formatMoney(totalInAed, 'AED')}
          </div>
          <span className="text-xs text-emerald-900 font-bold block">
            {language === 'ur' ? 'آمد درہم' : 'Cash Inflow (AED)'}
          </span>
        </div>

        <div className="bg-gradient-to-b from-emerald-50/70 via-white to-white p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-2">
          <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
            <ArrowDownLeft className="w-4 h-4 text-emerald-700" />
            <span>{t('cashReceivedTotal')} (PKR)</span>
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-800">
            {formatMoney(totalInPkr, 'PKR')}
          </div>
          <span className="text-xs text-emerald-900 font-bold block">
            {language === 'ur' ? 'آمد روپے' : 'Cash Inflow (PKR)'}
          </span>
        </div>

        <div className="bg-gradient-to-b from-rose-50/70 via-white to-white p-5 rounded-2xl border border-rose-200 shadow-sm space-y-2">
          <span className="text-xs font-bold text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
            <ArrowUpRight className="w-4 h-4 text-rose-700" />
            <span>{t('cashPaidTotal')} (AED)</span>
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-800">
            {formatMoney(totalOutAed, 'AED')}
          </div>
          <span className="text-xs text-rose-900 font-bold block">
            {language === 'ur' ? 'اخراج درہم' : 'Cash Outflow (AED)'}
          </span>
        </div>

        <div className="bg-gradient-to-b from-rose-50/70 via-white to-white p-5 rounded-2xl border border-rose-200 shadow-sm space-y-2">
          <span className="text-xs font-bold text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
            <ArrowUpRight className="w-4 h-4 text-rose-700" />
            <span>{t('cashPaidTotal')} (PKR)</span>
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-800">
            {formatMoney(totalOutPkr, 'PKR')}
          </div>
          <span className="text-xs text-rose-900 font-bold block">
            {language === 'ur' ? 'اخراج روپے' : 'Cash Outflow (PKR)'}
          </span>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs sm:text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[260px] relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 rtl:right-3 rtl:left-auto" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t('search')}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 rtl:pr-9 rtl:pl-3 text-xs text-slate-950 font-medium placeholder:text-slate-500 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={currencyFilter}
              onChange={e => setCurrencyFilter(e.target.value as 'all' | 'AED' | 'PKR')}
              className="bg-slate-50 border border-slate-300 text-slate-950 font-bold rounded-xl px-3 py-2 text-xs"
            >
              <option value="all">{language === 'ur' ? 'تمام کرنسیاں' : 'All Currencies'}</option>
              <option value="PKR">PKR (پاکستانی روپیہ)</option>
              <option value="AED">AED (اماراتی درہم)</option>
            </select>

            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-300">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  typeFilter === 'all' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-700 hover:text-emerald-900'
                }`}
              >
                {t('all')}
              </button>
              <button
                onClick={() => setTypeFilter('cash_in')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  typeFilter === 'cash_in' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                {t('cashIn')}
              </button>
              <button
                onClick={() => setTypeFilter('cash_out')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  typeFilter === 'cash_out' ? 'bg-rose-700 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                {t('cashOut')}
              </button>
            </div>
          </div>
        </div>

        {/* Date Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: language === 'ur' ? 'تمام تاریخیں' : 'All Dates' },
                { id: 'today', label: language === 'ur' ? 'آج' : 'Today' },
                { id: '7days', label: language === 'ur' ? '7 دن' : '7 Days' },
                { id: 'month', label: language === 'ur' ? 'اس ماہ' : 'This Month' },
                { id: 'custom', label: language === 'ur' ? 'مخصوص تاریخ' : 'Custom Date' }
              ] as const
            ).map(preset => (
              <button
                key={preset.id}
                onClick={() => setDatePreset(preset.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  datePreset === preset.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}

            {datePreset === 'custom' && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 px-2.5 py-1 rounded-lg">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="bg-transparent text-xs font-mono"
                />
                <span>→</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="bg-transparent text-xs font-mono"
                />
              </div>
            )}
          </div>

          {(searchTerm || typeFilter !== 'all' || currencyFilter !== 'all' || datePreset !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
                setCurrencyFilter('all');
                setDatePreset('all');
                setDateFrom('');
                setDateTo('');
              }}
              className="flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg border border-rose-200 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{language === 'ur' ? 'ری سیٹ' : 'Reset'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Ledger Table with High Contrast */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b-2 border-slate-300 text-slate-800 font-bold font-urdu-body">
                <th className="py-3 px-4 text-start">{t('date')}</th>
                <th className="py-3 px-4 text-start">{t('type')}</th>
                <th className="py-3 px-4 text-start">{t('category')}</th>
                <th className="py-3 px-4 text-start">{t('notes')}</th>
                <th className="py-3 px-4 text-start">{t('party')}</th>
                <th className="py-3 px-4 text-start">{t('amount')}</th>
                <th className="py-3 px-4 text-start">{language === 'ur' ? 'طریقہ کار / حوالہ' : 'Method / Ref'}</th>
                <th className="py-3 px-4 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500 font-bold">
                    {t('noRecordsFound')}
                  </td>
                </tr>
              ) : (
                filteredEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-emerald-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-700 font-medium">
                      {entry.date}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold font-urdu-heading ${
                          entry.type === 'cash_in'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-rose-100 text-rose-900 border border-rose-300'
                        }`}
                      >
                        {entry.type === 'cash_in' ? t('cashIn') : t('cashOut')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-bold font-urdu-heading">
                      {t(entry.category)}
                    </td>
                    <td className="py-3 px-4 text-slate-900 font-medium font-urdu-body">
                      {entry.description}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-950">
                      {entry.partyName || '-'}
                    </td>
                    <td
                      className={`py-3 px-4 font-mono font-extrabold ${
                        entry.type === 'cash_in' ? 'text-emerald-800' : 'text-rose-800'
                      }`}
                    >
                      {entry.type === 'cash_in' ? '+' : '-'} {formatMoney(entry.amount, entry.currency)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 font-urdu-body">
                      {t(entry.paymentMethod)} {entry.referenceId ? `(${entry.referenceId})` : ''}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {canAccessCashLedger && (
                          <button
                            onClick={() => openEditEntryModal(entry)}
                            className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            title={t('edit')}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {isSuperAdmin && (
                          <button
                            onClick={() => {
                              if (confirmDeleteId === entry.id) {
                                deleteLedgerEntry(entry.id);
                                setConfirmDeleteId(null);
                              } else {
                                setConfirmDeleteId(entry.id);
                              }
                            }}
                            className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                              confirmDeleteId === entry.id
                                ? 'bg-red-600 text-white px-2 text-[11px] font-bold'
                                : 'text-slate-500 hover:text-red-700 hover:bg-red-50'
                            }`}
                            title={t('delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                            {confirmDeleteId === entry.id && (
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
      </div>

      {/* Add / Edit Cash Book Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base font-urdu-heading">
                {editingEntry
                  ? language === 'ur'
                    ? 'روزنامچہ کیش اندراج میں ترمیم'
                    : 'Edit Cash Book Entry'
                  : language === 'ur'
                  ? 'نیا روزنامچہ کیش اندراج'
                  : 'New Cash Book Entry'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
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
                    onChange={e => setEntryType(e.target.value as 'cash_in' | 'cash_out')}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
                  >
                    <option value="cash_in">{t('cashIn')}</option>
                    <option value="cash_out">{t('cashOut')}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('amount')} *</label>
                  <input
                    type="number"
                    value={entryAmount}
                    onChange={e => setEntryAmount(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('currency')}</label>
                  <select
                    value={entryCurrency}
                    onChange={e => setEntryCurrency(e.target.value as Currency)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold"
                  >
                    <option value="PKR">PKR (پاکستانی روپیہ)</option>
                    <option value="AED">AED (اماراتی درہم)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('notes')} *</label>
                <input
                  type="text"
                  value={entryDesc}
                  onChange={e => setEntryDesc(e.target.value)}
                  placeholder={language === 'ur' ? 'اندراج کی تفصیل لکھیں...' : 'Enter description...'}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('party')}</label>
                  <input
                    type="text"
                    value={entryPartyName}
                    onChange={e => setEntryPartyName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ur' ? 'حوالہ نمبر' : 'Reference ID'}
                  </label>
                  <input
                    type="text"
                    value={entryRef}
                    onChange={e => setEntryRef(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 border border-slate-300 rounded-lg text-xs font-bold"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSaveEntry}
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
