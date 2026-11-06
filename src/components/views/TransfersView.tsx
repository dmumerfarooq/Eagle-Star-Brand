/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MoneyTransfer, TransferStatus } from '../../types';
import { EagleStarLogo } from '../common/EagleStarLogo';
import {
  ArrowRightLeft,
  Plus,
  Search,
  Filter,
  Receipt,
  HandCoins,
  Pencil,
  Trash2,
  FileSpreadsheet,
  Building2,
  ArrowUpRight,
  Printer
} from 'lucide-react';

interface TransfersViewProps {
  onOpenNewTransfer: () => void;
  onRecordPayout: (transfer: MoneyTransfer) => void;
  onEditTransfer?: (transfer: MoneyTransfer) => void;
}

export const TransfersView: React.FC<TransfersViewProps> = ({
  onOpenNewTransfer,
  onRecordPayout,
  onEditTransfer
}) => {
  const {
    transfers,
    deleteTransfer,
    openReceipt,
    openEditTransferModal,
    setCurrentScreen,
    t,
    language,
    formatMoney,
    isSuperAdmin,
    canEditTransfers,
    canDeleteTransfers
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stationFilter, setStationFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | 'month' | 'custom'>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const stations = Array.from(new Set(transfers.map(t => t.station).filter(Boolean)));
  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTransfers = transfers.filter(tr => {
    if (statusFilter !== 'all' && tr.status !== statusFilter) return false;
    if (stationFilter !== 'all' && tr.station !== stationFilter) return false;

    if (dateFilter === 'today' && tr.date !== todayStr) return false;
    if (dateFilter === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const sevenDaysAgo = d.toISOString().split('T')[0];
      if (tr.date < sevenDaysAgo) return false;
    }
    if (dateFilter === 'month') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      if (tr.date < firstDay) return false;
    }
    if (dateFilter === 'custom') {
      if (dateFrom && tr.date < dateFrom) return false;
      if (dateTo && tr.date > dateTo) return false;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchOrder = tr.orderNumber.toLowerCase().includes(term);
      const matchReceipt = tr.receiptNumber.toLowerCase().includes(term);
      const matchSender = tr.senderName.toLowerCase().includes(term) || tr.senderPhone.includes(term);
      const matchReceiver = tr.receiverName.toLowerCase().includes(term) || tr.receiverPhone.includes(term);
      const matchStation = tr.station.toLowerCase().includes(term);
      if (!matchOrder && !matchReceipt && !matchSender && !matchReceiver && !matchStation) {
        return false;
      }
    }
    return true;
  });

  const filteredTotalAED = filteredTransfers.reduce((sum, tr) => sum + (tr.amountAED || 0), 0);
  const filteredTotalPKR = filteredTransfers.reduce((sum, tr) => sum + (tr.netPayablePKR || tr.amountPKR || 0), 0);
  const filteredPaidPKR = filteredTransfers.reduce((sum, tr) => sum + (tr.amountPaidPKR || 0), 0);
  const filteredRemainingPKR = filteredTransfers.reduce((sum, tr) => sum + (tr.remainingBalancePKR || 0), 0);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (!isSuperAdmin && !canDeleteTransfers) return;
    if (confirmDeleteId === id) {
      deleteTransfer(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setStationFilter('all');
    setDateFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    statusFilter !== 'all' ||
    stationFilter !== 'all' ||
    dateFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <EagleStarLogo variant="icon" size="md" isDarkBackground={false} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-urdu-heading">
                {t('moneyTransfers')}
              </h1>
              <span className="text-xs bg-emerald-100 text-emerald-950 border border-emerald-200 font-bold px-2.5 py-0.5 rounded-full font-mono">
                {filteredTransfers.length} {language === 'ur' ? 'آرڈرز' : 'Orders'}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              {language === 'ur'
                ? 'دبئی سے پاکستان رقوم کی ترسیل کا مکمل رجسٹر، ادائیگیاں، ہسٹری ترمیم اور مستند رسیدیں'
                : 'Dubai to Pakistan remittance directory, history editing, customer payouts, and official receipts'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() =>
              openReceipt({
                format: 'B',
                batchTransfers: filteredTransfers,
                reportTitle: language === 'ur' ? 'ترسیلات رجسٹر شیٹ' : 'Transfers Register Sheet'
              })
            }
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span className="font-urdu-heading">
              {language === 'ur' ? 'پرنٹ رجسٹر شیٹ' : 'Print Register'}
            </span>
          </button>

          <button
            onClick={() => setCurrentScreen('orderRegister')}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="font-urdu-heading">
              {language === 'ur' ? 'آرڈر لسٹ مصفح شیٹ' : 'Musaffah Sheet'}
            </span>
          </button>

          <button
            onClick={onOpenNewTransfer}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-md shadow-emerald-700/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="font-urdu-heading">{t('newTransfer')}</span>
          </button>
        </div>
      </div>

      {/* Search, Date Range & Station/Status Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs sm:text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[260px] relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 rtl:right-3 rtl:left-auto" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={language === 'ur' ? 'آرڈر نمبر، گاہک، وصول کنندہ یا فون تلاش کریں...' : 'Search order #, sender, receiver, or phone...'}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 rtl:pr-9 rtl:pl-3 text-xs sm:text-sm text-slate-950 font-medium placeholder:text-slate-500 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Date Presets */}
            <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-300">
              {(
                [
                  { id: 'all', ur: 'تمام تواریخ', en: 'All Dates' },
                  { id: 'today', ur: 'آج', en: 'Today' },
                  { id: '7days', ur: '7 دن', en: '7 Days' },
                  { id: 'month', ur: 'اس ماہ', en: 'This Month' },
                  { id: 'custom', ur: 'مخصوص تاریخ', en: 'Custom Date' }
                ] as const
              ).map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setDateFilter(p.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    dateFilter === p.id
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  {language === 'ur' ? p.ur : p.en}
                </button>
              ))}
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-xl px-3 py-2 text-xs focus:bg-white"
            >
              <option value="all">{t('all')} {t('status')}</option>
              <option value="Completed">{t('statusCompleted')}</option>
            </select>

            <select
              value={stationFilter}
              onChange={e => setStationFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-xl px-3 py-2 text-xs font-urdu-body focus:bg-white"
            >
              <option value="all">{t('all')} {t('station')}</option>
              {stations.map(st => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition cursor-pointer"
              >
                {language === 'ur' ? 'فلٹر صاف کریں' : 'Reset'}
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Range Inputs */}
        {dateFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700">{language === 'ur' ? 'شروع تاریخ:' : 'From:'}</span>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700">{language === 'ur' ? 'آخری تاریخ:' : 'To:'}</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-xs"
              />
            </div>
          </div>
        )}

        {/* Filtered Summary Totals Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="font-bold text-amber-950">{language === 'ur' ? 'کل درہم (AED):' : 'Total AED:'}</span>
            <strong className="font-mono text-amber-900 font-black" dir="ltr">
              {formatMoney(filteredTotalAED, 'AED')}
            </strong>
          </div>
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="font-bold text-emerald-950">{language === 'ur' ? 'کل پاکستانی رقم (PKR):' : 'Total Sent PKR:'}</span>
            <strong className="font-mono text-emerald-900 font-black" dir="ltr">
              {formatMoney(filteredTotalPKR, 'PKR')}
            </strong>
          </div>
          <div className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="font-bold text-slate-800">{language === 'ur' ? 'کل ٹرانسفر آرڈرز:' : 'Total Orders:'}</span>
            <strong className="font-mono text-slate-900 font-black" dir="ltr">
              {filteredTransfers.length}
            </strong>
          </div>
        </div>
      </div>

      {/* Transfers Data Table with High Contrast Typography */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b-2 border-slate-300 text-slate-800 font-bold font-urdu-body">
                <th className="py-3 px-4 text-start">{t('orderNumber')}</th>
                <th className="py-3 px-4 text-start">{t('date')}</th>
                <th className="py-3 px-4 text-start">{t('sender')} ({language === 'ur' ? 'دبئی' : 'Dubai'})</th>
                <th className="py-3 px-4 text-start">{t('receiver')} ({language === 'ur' ? 'پاکستان' : 'Pakistan'})</th>
                <th className="py-3 px-4 text-start">{language === 'ur' ? 'طریقہ ترسیل' : 'Transfer Via'}</th>
                <th className="py-3 px-4 text-start">{t('station')}</th>
                <th className="py-3 px-4 text-start">{t('amountAed')}</th>
                <th className="py-3 px-4 text-start">{t('exchangeRate')}</th>
                <th className="py-3 px-4 text-start">{t('payablePkr')}</th>
                <th className="py-3 px-4 text-start">{t('status')}</th>
                <th className="py-3 px-4 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-600 font-bold">
                    {t('noRecordsFound')}
                  </td>
                </tr>
              ) : (
                filteredTransfers.map(tr => (
                  <tr key={tr.id} className="hover:bg-emerald-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-950">
                      {tr.orderNumber}
                      <span className="block text-[11px] text-slate-600 font-normal">
                        {tr.receiptNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {tr.date}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-950 block">{tr.senderName}</span>
                      <span className="text-[11px] text-slate-600 font-mono font-medium block">{tr.senderPhone}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-950 block">{tr.receiverName}</span>
                      <span className="text-[11px] text-slate-600 font-mono font-medium block">{tr.receiverPhone}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-950 font-bold text-xs border border-emerald-200">
                        {tr.payoutMethod === 'Bank Transfer'
                          ? `بذریعہ بینک ${tr.bankName ? `(${tr.bankName})` : ''}`
                          : tr.payoutMethod === 'EasyPaisa'
                          ? 'ایزی پیسہ'
                          : tr.payoutMethod === 'JazzCash'
                          ? 'جیز کیش'
                          : tr.payoutMethod === 'NayaPay'
                          ? 'نیا پیسہ'
                          : tr.payoutMethod === 'SadaPay'
                          ? 'سدا پیسہ'
                          : tr.payoutMethod === 'Raast'
                          ? 'راست'
                          : tr.payoutMethod || 'کاؤنٹر کیش'}
                      </span>
                      {tr.accountNumber && (
                        <span className="block text-[11px] text-slate-500 font-mono mt-0.5" dir="ltr">
                          {tr.accountNumber}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-900 font-bold font-urdu-body text-xs">
                        {tr.station}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-slate-950">
                      <div className="flex items-center gap-1.5">
                        <span>{formatMoney(tr.amountAED, 'AED')}</span>
                        {tr.inputCurrency && tr.inputCurrency !== 'AED' && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-900 font-mono text-[10px] font-bold border border-indigo-200">
                            {tr.inputCurrency}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {Number(tr.exchangeRate || 77.50).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-emerald-800">
                      {formatMoney(tr.netPayablePKR, 'PKR')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-bold font-urdu-heading bg-emerald-100 text-emerald-950 border border-emerald-300">
                        {t('Completed')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openReceipt({ format: 'A', transfer: tr })}
                          className="p-1.5 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          title={t('printReceipt')}
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                        {canEditTransfers && (
                          <button
                            onClick={() => (onEditTransfer ? onEditTransfer(tr) : openEditTransferModal(tr))}
                            className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition cursor-pointer inline-flex items-center gap-1"
                            title={language === 'ur' ? 'آرڈر، تاریخ یا رقم میں ترمیم کریں' : 'Edit Transfer, Date or Currency'}
                          >
                            <Pencil className="w-3.5 h-3.5 text-amber-700" />
                            <span>{language === 'ur' ? 'ترمیم' : 'Edit'}</span>
                          </button>
                        )}
                        {(isSuperAdmin || canDeleteTransfers) && (
                          <button
                            onClick={() => handleDelete(tr.id)}
                            className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                              confirmDeleteId === tr.id
                                ? 'bg-red-600 text-white px-2 text-[11px] font-bold'
                                : 'text-slate-500 hover:text-red-700 hover:bg-red-50'
                            }`}
                            title={language === 'ur' ? 'حذف کریں' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>
    </div>
  );
};
