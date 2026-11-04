/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Station, StationLedgerEntry } from '../../types';
import { EagleStarLogo } from '../common/EagleStarLogo';
import {
  X,
  Printer,
  Search,
  Filter,
  Calendar,
  Building2,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  Download,
  FileSpreadsheet,
  Pencil,
  Landmark,
  Trash2
} from 'lucide-react';

interface StationStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  station: Station | null;
  onOpenDeposit: (station: Station) => void;
  onEditDeposit?: (station: Station, entry: StationLedgerEntry) => void;
}

export const StationStatementModal: React.FC<StationStatementModalProps> = ({
  isOpen,
  onClose,
  station,
  onOpenDeposit,
  onEditDeposit
}) => {
  const { stations, transfers, language, formatMoney, formatNum, openReceipt, settings, deleteStationEntry, isSuperAdmin } = useApp();
  const defaultRate = settings.defaultExchangeRate || 77.5;

  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen || !station) return null;

  const liveStation = stations.find(s => s.id === station.id) || station;
  const entries: StationLedgerEntry[] = liveStation.entries || [];

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    // Type filter
    if (typeFilter !== 'all' && entry.type !== typeFilter) return false;

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchDesc = entry.description.toLowerCase().includes(q);
      const matchRef = (entry.referenceNo || '').toLowerCase().includes(q);
      const matchParty = (entry.relatedParty || '').toLowerCase().includes(q);
      const matchRcpt = (entry.receiptNo || '').toLowerCase().includes(q);
      if (!matchDesc && !matchRef && !matchParty && !matchRcpt) return false;
    }

    // Date range
    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return entry.date === today;
    }
    if (dateFilter === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const sevenDaysAgo = d.toISOString().split('T')[0];
      return entry.date >= sevenDaysAgo;
    }
    if (dateFilter === 'month') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      return entry.date >= firstDay;
    }
    if (dateFilter === 'custom') {
      if (startDate && entry.date < startDate) return false;
      if (endDate && entry.date > endDate) return false;
    }

    return true;
  });

  // Calculate totals for filtered subset
  const totalDeposited = filteredEntries
    .filter(e => e.type === 'deposit_topup' || e.type === 'settlement_repayment')
    .reduce((sum, e) => sum + e.amountPKR, 0);

  const totalPayouts = filteredEntries
    .filter(e => e.type === 'transfer_payout' || e.type === 'adjustment')
    .reduce((sum, e) => sum + e.amountPKR, 0);

  const netBalance = liveStation.currentBalancePKR || 0;

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'deposit_topup':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <ArrowDownLeft className="w-3 h-3 text-emerald-700" />
            <span>{language === 'ur' ? 'ڈپازٹ / ٹاپ اپ' : 'Deposit'}</span>
          </span>
        );
      case 'transfer_payout':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <ArrowUpRight className="w-3 h-3 text-amber-700" />
            <span>{language === 'ur' ? 'ترسیل کیش ادائیگی' : 'Payout'}</span>
          </span>
        );
      case 'settlement_repayment':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-100 text-teal-900 border border-teal-300">
            <RotateCcw className="w-3 h-3 text-teal-700" />
            <span>{language === 'ur' ? 'واجب الادا سیٹلمنٹ' : 'Settlement'}</span>
          </span>
        );
      case 'adjustment':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
            <span>{language === 'ur' ? 'ایڈجسٹمنٹ' : 'Adjustment'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
            {type}
          </span>
        );
    }
  };

  const handlePrintStatement = () => {
    openReceipt({
      format: 'E',
      reportTitle: `Station Statement: ${liveStation.nameEn} (${liveStation.nameUr})`,
      reportDateRange: dateFilter === 'all' ? 'Complete History' : `${startDate || 'Start'} to ${endDate || 'Today'}`,
      filterStation: liveStation.nameUr
    });
  };

  const handlePrintOrderList = () => {
    const stTransfers = transfers.filter(
      tr =>
        tr.station === liveStation.nameUr ||
        tr.station?.toLowerCase() === liveStation.nameEn.toLowerCase() ||
        tr.station?.toLowerCase() === liveStation.code.toLowerCase()
    );
    openReceipt({
      format: 'B',
      batchTransfers: stTransfers,
      filterStation: liveStation.nameUr
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
      dir={language === 'ur' ? 'rtl' : 'ltr'}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full my-6 overflow-hidden flex flex-col border border-slate-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg sm:text-xl font-urdu-heading">
                  {liveStation.nameUr} ({liveStation.nameEn}) - {language === 'ur' ? 'تفصیلی کاؤنٹر لیجر (PKR & AED)' : 'Counter Account Statement (PKR & AED)'}
                </h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-800 text-emerald-400 rounded border border-slate-700">
                  {liveStation.code}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-urdu-body mt-0.5">
                {liveStation.city || 'Pakistan'} | {language === 'ur' ? 'انچارج:' : 'In-Charge:'} {liveStation.inCharge || '-'} ({liveStation.phone || '-'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintOrderList}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition border border-slate-600 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>{language === 'ur' ? 'پرنٹ آرڈر لسٹ' : 'Print Order List'}</span>
            </button>
            <button
              onClick={handlePrintStatement}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'ur' ? 'پرنٹ اسٹیٹمنٹ' : 'Print Statement'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Balance & Quick Action Bar */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {language === 'ur' ? 'موجودہ کاؤنٹر بیلنس (PKR / AED)' : 'Current Net Running Balance'}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-2xl font-extrabold font-mono ${
                  netBalance < 0 ? 'text-red-600' : 'text-emerald-700'
                }`}>
                  {formatMoney(netBalance, 'PKR')}
                </span>
                <span className="text-xs font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200" dir="ltr">
                  ≈ {Math.round(netBalance / defaultRate).toLocaleString()} AED
                </span>
                {netBalance < 0 ? (
                  <span className="text-xs font-bold bg-red-100 text-red-900 px-2.5 py-1 rounded-full border border-red-300 font-urdu-body">
                    {language === 'ur' ? 'واجب الادا (Station Paid Own Money)' : 'Overdue Liability'}
                  </span>
                ) : (
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-full border border-emerald-300 font-urdu-body">
                    {language === 'ur' ? 'کیش دستیاب' : 'Funds Available'}
                  </span>
                )}
              </div>
            </div>

            <div className="border-r border-slate-300 pr-6 pl-2 hidden sm:block">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {language === 'ur' ? 'مجموعی جمع فنڈز' : 'Total Deposited'}
              </span>
              <span className="text-base font-extrabold text-emerald-700 font-mono">
                +{formatMoney(totalDeposited, 'PKR')}
              </span>
            </div>

            <div className="hidden sm:block">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {language === 'ur' ? 'مجموعی ادا شدہ ترسیلات' : 'Total Disbursed'}
              </span>
              <span className="text-base font-extrabold text-amber-700 font-mono">
                -{formatMoney(totalPayouts, 'PKR')}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenDeposit(liveStation);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5 font-urdu-heading cursor-pointer"
          >
            <Wallet className="w-4 h-4" />
            <span>{language === 'ur' ? '+ کیش ڈپازٹ / انٹری شامل کریں' : '+ Add Entry / Deposit'}</span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-white border-b border-slate-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={language === 'ur' ? 'واؤچر، آرڈر نمبر، شخص کا نام یا تفصیل تلاش کریں...' : 'Search voucher, order #, name, description...'}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
            </div>

            {/* Date Quick Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setDateFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                  dateFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'ur' ? 'تمام ریکارڈز' : 'All History'}
              </button>
              <button
                onClick={() => setDateFilter('today')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                  dateFilter === 'today' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'ur' ? 'آج' : 'Today'}
              </button>
              <button
                onClick={() => setDateFilter('7days')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                  dateFilter === '7days' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'ur' ? 'پچھلے 7 دن' : 'Last 7 Days'}
              </button>
              <button
                onClick={() => setDateFilter('month')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                  dateFilter === 'month' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'ur' ? 'اس ماہ' : 'This Month'}
              </button>
              <button
                onClick={() => setDateFilter('custom')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                  dateFilter === 'custom' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'ur' ? 'مخصوص تاریخ' : 'Custom Dates'}
              </button>
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
            >
              <option value="all">{language === 'ur' ? 'تمام لین دین' : 'All Transactions'}</option>
              <option value="deposit_topup">{language === 'ur' ? 'صرف کیش ڈپازٹ' : 'Deposits Only'}</option>
              <option value="transfer_payout">{language === 'ur' ? 'صرف ترسیل ادا شدہ' : 'Payouts Only'}</option>
              <option value="settlement_repayment">{language === 'ur' ? 'صرف سیٹلمنٹ' : 'Settlements Only'}</option>
              <option value="adjustment">{language === 'ur' ? 'صرف ایڈجسٹمنٹ' : 'Adjustments Only'}</option>
            </select>
          </div>

          {/* Custom Date Inputs if active */}
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-3 pt-1 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600 font-bold">{language === 'ur' ? 'از:' : 'From:'}</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-mono text-xs"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600 font-bold">{language === 'ur' ? 'تا:' : 'To:'}</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-mono text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Statement Table */}
        <div className="p-4 overflow-y-auto max-h-[55vh]">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-montserrat uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-2.5 text-start">{language === 'ur' ? 'تاریخ' : 'Date'}</th>
                <th className="py-2.5 px-2.5 text-center">{language === 'ur' ? 'قسم' : 'Type'}</th>
                <th className="py-2.5 px-2.5 text-start">{language === 'ur' ? 'حوالہ / آرڈر #' : 'Ref / Order #'}</th>
                <th className="py-2.5 px-2.5 text-start">{language === 'ur' ? 'تفصیل، بینک و متعلقہ شخص' : 'Particulars, Bank & Party'}</th>
                <th className="py-2.5 px-2.5 text-right">{language === 'ur' ? 'درہم (AED)' : 'AED'}</th>
                <th className="py-2.5 px-2.5 text-right">{language === 'ur' ? 'جمع (+) PKR' : 'Credit (+) PKR'}</th>
                <th className="py-2.5 px-2.5 text-right">{language === 'ur' ? 'بنام (-) PKR' : 'Debit (-) PKR'}</th>
                <th className="py-2.5 px-2.5 text-right">{language === 'ur' ? 'رننگ بیلنس' : 'Running Balance'}</th>
                <th className="py-2.5 px-2.5 text-center">{language === 'ur' ? 'ترمیم / پرنٹ / حذف' : 'Edit / Print / Delete'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500 font-urdu-body">
                    {language === 'ur' ? 'انتخاب کے مطابق کوئی رکارڈ نہیں ملا۔' : 'No transactions found for the selected period.'}
                  </td>
                </tr>
              ) : (
                filteredEntries.map(entry => {
                  const isCredit = entry.type === 'deposit_topup' || entry.type === 'settlement_repayment';
                  const entryAED = entry.amountAED || Math.round(entry.amountPKR / (entry.exchangeRate || defaultRate));
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-2.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {entry.date}
                      </td>
                      <td className="py-3 px-2.5 text-center whitespace-nowrap">
                        {getTypeBadge(entry.type)}
                      </td>
                      <td className="py-3 px-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {entry.referenceNo || entry.receiptNo || '-'}
                      </td>
                      <td className="py-3 px-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-950 font-urdu-heading text-xs">
                            {entry.description}
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            {(entry.paymentMethod || entry.bankName) && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-bold">
                                <Landmark className="w-2.5 h-2.5 text-blue-700" />
                                <span>
                                  {entry.paymentMethod || 'Bank Transfer'}
                                  {entry.bankName && entry.bankName !== entry.paymentMethod ? ` • ${entry.bankName}` : ''}
                                  {entry.accountNumber ? ` (${entry.accountNumber})` : ''}
                                </span>
                              </span>
                            )}
                            {entry.relatedParty && (
                              <span className="text-[11px] text-slate-500 font-medium">
                                {language === 'ur' ? 'متعلقہ:' : 'Party:'} {entry.relatedParty}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      {/* AED Equivalent */}
                      <td className="py-3 px-2.5 text-right font-mono font-bold text-blue-800 whitespace-nowrap" dir="ltr">
                        {entryAED.toLocaleString()} AED
                      </td>
                      {/* Credit (+ Deposit) */}
                      <td className="py-3 px-2.5 text-right font-mono font-bold text-emerald-700 whitespace-nowrap" dir="ltr">
                        {isCredit ? `+${formatNum(entry.amountPKR)}` : '-'}
                      </td>
                      {/* Debit (- Payout) */}
                      <td className="py-3 px-2.5 text-right font-mono font-bold text-amber-700 whitespace-nowrap" dir="ltr">
                        {!isCredit ? `-${formatNum(entry.amountPKR)}` : '-'}
                      </td>
                      {/* Balance */}
                      <td className="py-3 px-2.5 text-right font-mono font-black whitespace-nowrap" dir="ltr">
                        <span className={entry.newBalancePKR < 0 ? 'text-red-700' : 'text-slate-950'}>
                          {formatMoney(entry.newBalancePKR, 'PKR')}
                        </span>
                      </td>
                      {/* Action (Edit / Print / Delete on ALL entries) */}
                      <td className="py-3 px-2.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {onEditDeposit && (
                            <button
                              type="button"
                              onClick={() => onEditDeposit(liveStation, entry)}
                              title={language === 'ur' ? 'اس انٹری میں ترمیم کریں' : 'Edit Entry'}
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const minusDeducted =
                                isCredit && entry.previousBalancePKR < 0
                                  ? Math.min(entry.amountPKR, Math.abs(entry.previousBalancePKR))
                                  : 0;
                              openReceipt({
                                format: 'A',
                                depositEntry: {
                                  receiptNo: entry.receiptNo,
                                  date: entry.date,
                                  stationName: liveStation.nameUr || liveStation.nameEn,
                                  amountPKR: entry.amountPKR,
                                  previousBalancePKR: entry.previousBalancePKR,
                                  newBalancePKR: entry.newBalancePKR,
                                  deductedOverdraftPKR: minusDeducted,
                                  paymentMethod: entry.paymentMethod,
                                  bankName: entry.bankName,
                                  accountNumber: entry.accountNumber,
                                  referenceNo: entry.referenceNo,
                                  relatedParty: entry.relatedParty,
                                  description: entry.description,
                                  notes: entry.notes,
                                  txType: entry.type
                                }
                              });
                            }}
                            title={language === 'ur' ? 'واؤچر رسید پرنٹ کریں' : 'Print Voucher Slip'}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => deleteStationEntry(liveStation.id, entry.id)}
                              title={language === 'ur' ? 'ریکارڈ حذف کریں (صرف سپر ایڈمن)' : 'Delete Entry (Super Admin Only)'}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono">
            {filteredEntries.length} {language === 'ur' ? 'اندرجات ظاہر ہو رہے ہیں' : 'transactions listed'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition cursor-pointer"
          >
            {language === 'ur' ? 'بند کریں' : 'Close Statement'}
          </button>
        </div>
      </div>
    </div>
  );
};
