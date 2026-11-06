/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Station, StationCategory, StationLedgerEntry } from '../../types';
import { StationModal } from '../modals/StationModal';
import { StationDepositModal } from '../modals/StationDepositModal';
import { StationStatementModal } from '../modals/StationStatementModal';
import { EagleStarLogo } from '../common/EagleStarLogo';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  MapPin,
  Phone,
  User,
  ArrowRightLeft,
  Wallet,
  AlertTriangle,
  RotateCcw,
  FileText,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  Printer
} from 'lucide-react';

export const StationsView: React.FC = () => {
  const {
    stations,
    transfers,
    deleteStation,
    updateStationStatus,
    language,
    formatMoney,
    formatNum,
    setCurrentScreen,
    isSuperAdmin,
    canDeleteRecords,
    openReceipt,
    setSelectedOrderListStation
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [stationToEdit, setStationToEdit] = useState<Station | null>(null);

  // Deposit & Statement Modal State
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [stationForDeposit, setStationForDeposit] = useState<Station | null>(null);
  const [depositEntryToEdit, setDepositEntryToEdit] = useState<StationLedgerEntry | null>(null);

  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [stationForStatement, setStationForStatement] = useState<Station | null>(null);

  // Delete confirmation modal state
  const [stationToDelete, setStationToDelete] = useState<Station | null>(null);

  // Calculate station metrics
  const getStationMetrics = (station: Station) => {
    const linkedTransfers = transfers.filter(
      t => t.station === station.nameUr || t.station === station.nameEn || t.station === station.code
    );
    const totalPkr = linkedTransfers.reduce((sum, t) => sum + (t.amountPaidPKR || t.amountPKR || 0), 0);
    const totalAed = linkedTransfers.reduce((sum, t) => sum + (t.amountAED || 0), 0);
    return {
      count: linkedTransfers.length,
      totalPkr,
      totalAed
    };
  };

  const filteredStations = stations.filter(st => {
    if (selectedCategory !== 'all' && st.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && st.status !== selectedStatus) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase().trim();
    return (
      st.nameUr.toLowerCase().includes(q) ||
      st.nameEn.toLowerCase().includes(q) ||
      st.code.toLowerCase().includes(q) ||
      (st.city && st.city.toLowerCase().includes(q)) ||
      (st.inCharge && st.inCharge.toLowerCase().includes(q)) ||
      (st.phone && st.phone.includes(q))
    );
  });

  const totalStations = stations.length;
  const activeStations = stations.filter(s => s.status === 'active').length;
  const totalNetBalancePkr = stations.reduce((sum, s) => sum + (s.currentBalancePKR || 0), 0);
  const totalOverduePayablePkr = stations
    .filter(s => (s.currentBalancePKR || 0) < 0)
    .reduce((sum, s) => sum + Math.abs(s.currentBalancePKR || 0), 0);

  const handleOpenAdd = () => {
    setStationToEdit(null);
    setIsStationModalOpen(true);
  };

  const handleOpenEdit = (st: Station) => {
    setStationToEdit(st);
    setIsStationModalOpen(true);
  };

  const handleOpenDeposit = (st: Station) => {
    setDepositEntryToEdit(null);
    setStationForDeposit(st);
    setIsDepositModalOpen(true);
  };

  const handleOpenStatement = (st: Station) => {
    setStationForStatement(st);
    setIsStatementModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (stationToDelete) {
      deleteStation(stationToDelete.id);
      setStationToDelete(null);
    }
  };

  const getCategoryLabel = (cat: StationCategory) => {
    switch (cat) {
      case 'counter':
        return language === 'ur' ? 'کاؤنٹر / کیش جگہ' : 'Cash Counter';
      case 'wallet':
        return language === 'ur' ? 'ٹرانسفر بذریعہ ایزی پیسہ / جیز کیش' : 'Transfer via EasyPaisa / JazzCash';
      case 'bank':
        return language === 'ur' ? 'ٹرانسفر بذریعہ بینک' : 'Transfer via Bank';
      case 'branch':
        return language === 'ur' ? 'برانچ دفتر' : 'Main Branch';
    }
  };

  const getCategoryColor = (cat: StationCategory) => {
    switch (cat) {
      case 'counter':
        return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'wallet':
        return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      case 'bank':
        return 'bg-purple-100 text-purple-900 border-purple-200';
      case 'branch':
        return 'bg-slate-200 text-slate-900 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <EagleStarLogo variant="icon" size="md" isDarkBackground={false} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-montserrat">
                {language === 'ur' ? 'اسٹیشنز و کاؤنٹرز کا انتظام و کیش ہسٹری' : 'Station & Counter Cash Ledger'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white font-mono">
                {totalStations}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 font-urdu">
              {language === 'ur'
                ? 'میرعلی، بنوں، ایزی پیسہ و تمام کاؤنٹرز کے ڈپازٹ فنڈز، خودکار کٹوتی، واجب الادا رقم اور تفصیلی حساب'
                : 'Manage station deposit funds, automatic transfer deductions, overdue liabilities & date-wise statements'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setDepositEntryToEdit(null);
              setStationForDeposit(null);
              setIsDepositModalOpen(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition font-urdu-heading cursor-pointer"
          >
            <Wallet className="w-4 h-4 text-emerald-200" />
            <span>{language === 'ur' ? '+ کیش ڈپازٹ کریں' : '+ Add Station Deposit'}</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-slate-950 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition font-urdu-heading cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>{language === 'ur' ? 'نیا اسٹیشن شامل کریں' : 'Add New Station'}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {language === 'ur' ? 'کل اسٹیشنز' : 'Total Stations'}
          </p>
          <p className="text-2xl font-extrabold text-slate-900 font-montserrat mt-1">
            {formatNum(totalStations)}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {activeStations} {language === 'ur' ? 'فعال کاؤنٹرز' : 'active counters'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
            {language === 'ur' ? 'کاؤنٹرز کا مجموعی نیٹ بیلنس' : 'Total Station Net Balance'}
          </p>
          <p className={`text-xl sm:text-2xl font-extrabold font-montserrat mt-1 ${
            totalNetBalancePkr < 0 ? 'text-red-700' : 'text-emerald-700'
          }`}>
            {formatMoney(totalNetBalancePkr, 'PKR')}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {language === 'ur' ? 'تمام کاؤنٹرز کے پاس موجودہ کیش' : 'Total net liquidity across stations'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-red-700 uppercase tracking-wider">
            {language === 'ur' ? 'اسٹیشنز کی واجب الادا رقم' : 'Station Overdue Payable'}
          </p>
          <p className="text-2xl font-extrabold text-red-700 font-montserrat mt-1">
            {formatMoney(totalOverduePayablePkr, 'PKR')}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {language === 'ur' ? 'اسٹیشنوں نے اپنے پاس سے رقم ادا کی' : 'Station paid using own cash funds'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">
            {language === 'ur' ? 'کل ترسیل ادائیگی والیم' : 'Disbursed Remittance'}
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-blue-900 font-montserrat mt-1">
            {formatMoney(transfers.reduce((sum, t) => sum + (t.amountPaidPKR || 0), 0), 'PKR')}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {transfers.length} {language === 'ur' ? 'آرڈرز کیش ادا ہوئے' : 'orders disbursed'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={language === 'ur' ? 'اسٹیشن، نام، کوڈ یا شہر تلاش کریں...' : 'Search station code, name, city, phone...'}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 text-xs font-semibold">{language === 'ur' ? 'قسم:' : 'Category:'}</span>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">{language === 'ur' ? 'تمام اقسام' : 'All Categories'}</option>
              <option value="counter">{language === 'ur' ? 'کاؤنٹر' : 'Counter'}</option>
              <option value="wallet">{language === 'ur' ? 'ٹرانسفر بذریعہ ایزی پیسہ / جیز کیش' : 'Transfer via EasyPaisa/JazzCash'}</option>
              <option value="bank">{language === 'ur' ? 'ٹرانسفر بذریعہ بینک' : 'Transfer via Bank'}</option>
              <option value="branch">{language === 'ur' ? 'برانچ' : 'Branch'}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 text-xs font-semibold">{language === 'ur' ? 'حالت:' : 'Status:'}</span>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">{language === 'ur' ? 'تمام' : 'All'}</option>
              <option value="active">{language === 'ur' ? 'فعال (Active)' : 'Active'}</option>
              <option value="inactive">{language === 'ur' ? 'غیر فعال (Inactive)' : 'Inactive'}</option>
            </select>
          </div>
        </div>

        {(searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedStatus('all');
            }}
            className="text-xs text-slate-600 hover:text-slate-900 font-semibold underline flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'ur' ? 'فلٹرز صاف کریں' : 'Clear Filters'}</span>
          </button>
        )}
      </div>

      {/* Stations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-900 text-white font-montserrat uppercase text-[11px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 text-center">{language === 'ur' ? 'کوڈ' : 'Code'}</th>
                <th className="py-3 px-4">{language === 'ur' ? 'اسٹیشن کا نام' : 'Station Name'}</th>
                <th className="py-3 px-4">{language === 'ur' ? 'قسم' : 'Category'}</th>
                <th className="py-3 px-4">{language === 'ur' ? 'آرڈرز والیم (PKR & AED)' : 'Orders Volume (PKR & AED)'}</th>
                <th className="py-3 px-4 text-right">{language === 'ur' ? 'موجودہ کاؤنٹر بیلنس (PKR / AED)' : 'Current Balance (PKR / AED)'}</th>
                <th className="py-3 px-4 text-center">{language === 'ur' ? 'حالت' : 'Status'}</th>
                <th className="py-3 px-4 text-center">{language === 'ur' ? 'ترمیم، ڈپازٹ و حساب' : 'Edit, Deposit & Statement'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                    {language === 'ur' ? 'کوئی اسٹیشن نہیں ملا۔' : 'No stations found matching criteria.'}
                  </td>
                </tr>
              ) : (
                filteredStations.map(st => {
                  const metrics = getStationMetrics(st);
                  const isMirAli = st.nameUr === 'میرعلی';
                  const bal = st.currentBalancePKR || 0;

                  return (
                    <tr
                      key={st.id}
                      className={`hover:bg-emerald-50/60 transition ${
                        st.status === 'inactive' ? 'opacity-60 bg-slate-50/50' : ''
                      }`}
                    >
                      {/* Code */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-900 px-2.5 py-1 rounded-md border border-slate-300">
                          {st.code}
                        </span>
                      </td>

                      {/* Name - Standard Single Station Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-urdu font-bold text-base text-slate-950">
                              {st.nameUr || st.nameEn}
                            </span>
                            {isMirAli && (
                              <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                                {language === 'ur' ? 'بنیادی کاؤنٹر' : 'Primary'}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-slate-600">
                            {st.nameEn} {st.city ? `• ${st.city}` : ''} {st.inCharge ? `(${st.inCharge})` : ''}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${getCategoryColor(
                            st.category
                          )}`}
                        >
                          {getCategoryLabel(st.category)}
                        </span>
                      </td>

                      {/* Orders Volume (PKR & AED) */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col text-xs font-mono">
                          <span className="font-bold text-slate-900">
                            {metrics.count} {language === 'ur' ? 'آرڈرز' : 'Orders'}
                          </span>
                          <span className="text-blue-800 font-bold" dir="ltr">
                            {formatNum(metrics.totalAed)} AED
                          </span>
                          <span className="text-emerald-800 font-bold" dir="ltr">
                            {formatNum(metrics.totalPkr)} PKR
                          </span>
                        </div>
                      </td>

                      {/* Running Cash Balance */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className={`text-base font-extrabold font-mono ${
                            bal < 0 ? 'text-red-700' : 'text-emerald-800'
                          }`}>
                            {formatMoney(bal, 'PKR')}
                          </span>
                          {bal < 0 ? (
                            <span className="text-[10px] font-bold bg-red-100 text-red-900 px-2 py-0.2 rounded border border-red-300 font-urdu-body mt-0.5">
                              {language === 'ur' ? 'واجب الادا (Station Paid Own Money)' : 'Overdue Liability'}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.2 rounded border border-emerald-300 font-urdu-body mt-0.5">
                              {language === 'ur' ? 'کیش فنڈز دستیاب' : 'Funds Available'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => updateStationStatus(st.id, st.status === 'active' ? 'inactive' : 'active')}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition border ${
                            st.status === 'active'
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {st.status === 'active' ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{language === 'ur' ? 'فعال' : 'Active'}</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-slate-400" />
                              <span>{language === 'ur' ? 'غیر فعال' : 'Inactive'}</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Deposit / Entry Button */}
                          <button
                            onClick={() => handleOpenDeposit(st)}
                            title={language === 'ur' ? 'کیش فنڈز ڈپازٹ یا ایڈجسٹمنٹ کریں' : 'Deposit or Adjust Station Funds'}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition flex items-center gap-1 cursor-pointer font-urdu-heading"
                          >
                            <Wallet className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{language === 'ur' ? '+ کیش جمع / ترمیم' : '+ Entry'}</span>
                          </button>

                          {/* Statement Button */}
                          <button
                            onClick={() => handleOpenStatement(st)}
                            title={language === 'ur' ? 'تفصیلی کاؤنٹر لیجر و حساب دیکھیں' : 'View Station Statement'}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-300 transition flex items-center gap-1 cursor-pointer font-urdu-heading"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-700" />
                            <span>{language === 'ur' ? 'تفصیلی حساب' : 'Statement'}</span>
                          </button>

                          {/* Order List Button */}
                          <button
                            onClick={() => {
                              setSelectedOrderListStation(st.nameUr);
                              setCurrentScreen('orderRegister');
                            }}
                            title={language === 'ur' ? 'اسٹیشن آرڈر لسٹ کھولیں' : 'Open Station Order List'}
                            className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-300 transition cursor-pointer font-urdu-heading"
                          >
                            <span>{language === 'ur' ? 'آرڈر لسٹ' : 'Orders'}</span>
                          </button>

                          {/* Direct Print Station Order List (Transfers + Jama + Balance) */}
                          <button
                            onClick={() => {
                              const stTransfers = transfers.filter(
                                tr =>
                                  tr.station === st.nameUr ||
                                  tr.station?.toLowerCase() === st.nameEn.toLowerCase() ||
                                  tr.station?.toLowerCase() === st.code.toLowerCase()
                              );
                              openReceipt({
                                format: 'B',
                                batchTransfers: stTransfers,
                                filterStation: st.nameUr
                              });
                            }}
                            title={
                              language === 'ur'
                                ? 'اسٹیشن آرڈر لسٹ، جمع اور بقایا بیلنس پرنٹ کریں'
                                : 'Print Station Order List, Jama & Balance'
                            }
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 transition flex items-center gap-1 cursor-pointer font-urdu-heading"
                          >
                            <Printer className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{language === 'ur' ? 'پرنٹ لسٹ' : 'Print List'}</span>
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => handleOpenEdit(st)}
                            title={language === 'ur' ? 'اسٹیشن و بیلنس میں ترمیم کریں' : 'Edit station & balance'}
                            className="p-1.5 rounded-lg text-amber-800 bg-amber-50 hover:bg-amber-100 transition border border-amber-300 cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete button (Admin / Super Admin) */}
                          {canDeleteRecords && (
                            <button
                              onClick={() => setStationToDelete(st)}
                              title={language === 'ur' ? 'اسٹیشن حذف کریں' : 'Delete station'}
                              className="p-1.5 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 transition border border-red-200 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
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
      </div>

      {/* Delete Confirmation Modal */}
      {stationToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900 font-montserrat">
                {language === 'ur' ? 'اسٹیشن حذف کرنے کی تصدیق' : 'Confirm Delete Station'}
              </h3>
              <p className="text-sm text-slate-600">
                {language === 'ur' ? (
                  <>
                    کیا آپ واقعی اسٹیشن <strong className="text-slate-900">{stationToDelete.nameUr} ({stationToDelete.nameEn})</strong> کو حذف کرنا چاہتے ہیں؟
                  </>
                ) : (
                  <>
                    Are you sure you want to delete station <strong className="text-slate-900">{stationToDelete.nameEn} ({stationToDelete.nameUr})</strong>?
                  </>
                )}
              </p>
              {getStationMetrics(stationToDelete).count > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 text-left font-medium">
                  Notice: This station is currently linked with {getStationMetrics(stationToDelete).count} recorded transfer(s). Existing transfer history will retain their text notes.
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStationToDelete(null)}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                {language === 'ur' ? 'منسوخ کریں' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 text-xs sm:text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow transition"
              >
                {language === 'ur' ? 'ہاں، حذف کریں' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Station Modal for Add / Edit */}
      <StationModal
        isOpen={isStationModalOpen}
        onClose={() => {
          setIsStationModalOpen(false);
          setStationToEdit(null);
        }}
        stationToEdit={stationToEdit}
      />

      {/* Station Cash Deposit Modal */}
      <StationDepositModal
        isOpen={isDepositModalOpen}
        onClose={() => {
          setIsDepositModalOpen(false);
          setStationForDeposit(null);
          setDepositEntryToEdit(null);
        }}
        selectedStation={stationForDeposit}
        entryToEdit={depositEntryToEdit}
      />

      {/* Station Detailed Statement Modal */}
      <StationStatementModal
        isOpen={isStatementModalOpen}
        onClose={() => {
          setIsStatementModalOpen(false);
          setStationForStatement(null);
        }}
        station={stationForStatement}
        onOpenDeposit={st => {
          setDepositEntryToEdit(null);
          setStationForDeposit(st);
          setIsDepositModalOpen(true);
        }}
        onEditDeposit={(st, entry) => {
          setStationForDeposit(st);
          setDepositEntryToEdit(entry);
          setIsDepositModalOpen(true);
        }}
      />
    </div>
  );
};
