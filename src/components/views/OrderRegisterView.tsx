/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { EagleStarLogo } from '../common/EagleStarLogo';
import { MoneyTransfer } from '../../types';
import {
  Printer,
  Filter,
  CheckSquare,
  Square,
  Building2,
  Plus,
  Pencil,
  Trash2,
  FileText,
  Coins,
  Search,
  Check,
  X
} from 'lucide-react';

export const OrderRegisterView: React.FC = () => {
  const {
    transfers,
    openReceipt,
    openNewTransferModal,
    openEditTransferModal,
    saveTransfer,
    deleteTransfer,
    language,
    t,
    settings,
    stations: appStations,
    setCurrentScreen,
    currentUser,
    isSuperAdmin,
    canEditTransfers,
    canDeleteTransfers,
    selectedOrderListStation,
    setSelectedOrderListStation
  } = useApp();

  const userStationRestriction =
    !isSuperAdmin && currentUser?.stationAccess && currentUser.stationAccess !== 'all'
      ? currentUser.stationAccess
      : 'all';

  const initialStation =
    userStationRestriction !== 'all'
      ? userStationRestriction
      : selectedOrderListStation || 'all';

  const [selectedStation, setSelectedStation] = useState<string>(initialStation);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | '7days' | 'month' | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currencyMode, setCurrencyMode] = useState<'both' | 'PKR' | 'AED'>('both');
  // Track excluded IDs so newly created/updated station orders are automatically selected
  const [excludedOrderIds, setExcludedOrderIds] = useState<string[]>([]);

  useEffect(() => {
    if (userStationRestriction === 'all' && selectedOrderListStation) {
      setSelectedStation(selectedOrderListStation);
    }
  }, [selectedOrderListStation, userStationRestriction]);

  const handleSelectStation = (st: string) => {
    setSelectedStation(st);
    setSelectedOrderListStation(st);
  };

  // Quick inline edit state for station order (Date, AED, Rate, PKR, Station)
  const [quickEditOrder, setQuickEditOrder] = useState<MoneyTransfer | null>(null);
  const [qeDate, setQeDate] = useState<string>('');
  const [qeStation, setQeStation] = useState<string>('');
  const [qeAed, setQeAed] = useState<string>('');
  const [qeRate, setQeRate] = useState<string>('');
  const [qePkr, setQePkr] = useState<string>('');
  const [orderToDelete, setOrderToDelete] = useState<MoneyTransfer | null>(null);

  // Registered stations list (strictly Station-based)
  const registeredStationNames = appStations.map(s => s.nameUr);
  const findCanonicalStationName = (rawStation?: string): string | null => {
    if (!rawStation) return null;
    const trimmed = rawStation.trim();
    const matched = appStations.find(
      s =>
        s.nameUr === trimmed ||
        s.nameEn.toLowerCase() === trimmed.toLowerCase() ||
        s.code.toLowerCase() === trimmed.toLowerCase()
    );
    if (matched) return matched.nameUr;
    // Also include if it's a non-empty station string
    return trimmed || null;
  };

  // Strictly station-assigned orders only
  const stationTransfers = transfers.filter(tr => {
    const stName = findCanonicalStationName(tr.station);
    if (!stName) return false;
    if (userStationRestriction !== 'all' && stName !== userStationRestriction) {
      return false;
    }
    return true;
  });

  // Distinct station names from registered stations + active station orders
  const stationsList = Array.from(
    new Set([
      ...(userStationRestriction === 'all' ? registeredStationNames : [userStationRestriction]),
      ...stationTransfers.map(tr => findCanonicalStationName(tr.station) || tr.station).filter(Boolean)
    ])
  );

  // Filter station transfers by selected station, date preset / custom date, and search query
  const todayStr = new Date().toISOString().split('T')[0];
  const filteredTransfers = stationTransfers.filter(tr => {
    const canonicalSt = findCanonicalStationName(tr.station) || tr.station;
    if (selectedStation !== 'all' && canonicalSt !== selectedStation) return false;
    if (datePreset === 'today' && tr.date !== todayStr) return false;
    if (datePreset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      if (tr.date < d.toISOString().split('T')[0]) return false;
    }
    if (datePreset === 'month') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      if (tr.date < firstDay) return false;
    }
    if (selectedDate && tr.date !== selectedDate) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchOrder = tr.orderNumber.toLowerCase().includes(q);
      const matchSender = tr.senderName.toLowerCase().includes(q);
      const matchReceiver = tr.receiverName.toLowerCase().includes(q);
      const matchSt = canonicalSt.toLowerCase().includes(q);
      if (!matchOrder && !matchSender && !matchReceiver && !matchSt) return false;
    }
    return true;
  });

  // Active selected transfers for register printout
  const activeTransfersToPrint = filteredTransfers.filter(tr => !excludedOrderIds.includes(tr.id));

  // Toggle select all
  const handleToggleSelectAll = () => {
    if (activeTransfersToPrint.length === filteredTransfers.length) {
      setExcludedOrderIds(filteredTransfers.map(tr => tr.id));
    } else {
      setExcludedOrderIds([]);
    }
  };

  const handleToggleOrder = (id: string) => {
    if (excludedOrderIds.includes(id)) {
      setExcludedOrderIds(excludedOrderIds.filter(i => i !== id));
    } else {
      setExcludedOrderIds([...excludedOrderIds, id]);
    }
  };

  // Group strictly by Station (also include selectedStation even if 0 transfers so Jama/Balance can still be viewed & printed)
  const groupedOrders: Record<string, MoneyTransfer[]> = {};
  if (selectedStation !== 'all') {
    groupedOrders[selectedStation] = [];
  }
  activeTransfersToPrint.forEach(tr => {
    const st = findCanonicalStationName(tr.station) || tr.station;
    if (!st) return;
    if (!groupedOrders[st]) groupedOrders[st] = [];
    groupedOrders[st].push(tr);
  });

  const grandTotalAed = activeTransfersToPrint.reduce((s, o) => s + (Number(o.amountAED) || 0), 0);
  const grandTotalPkr = activeTransfersToPrint.reduce((s, o) => s + (Number(o.amountPKR) || 0), 0);

  const handleLaunchPrint = () => {
    openReceipt({
      format: 'B',
      batchTransfers: activeTransfersToPrint,
      filterStation: selectedStation !== 'all' ? selectedStation : undefined,
      filterDate: selectedDate || undefined
    });
  };

  const handleStartQuickEdit = (ord: MoneyTransfer, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickEditOrder(ord);
    setQeDate(ord.date || new Date().toISOString().split('T')[0]);
    setQeStation(findCanonicalStationName(ord.station) || ord.station);
    setQeAed(String(ord.amountAED || 0));
    setQeRate(String(ord.exchangeRate || settings.defaultExchangeRate || 77.5));
    setQePkr(String(ord.amountPKR || 0));
  };

  const handleSaveQuickEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEditOrder) return;
    const parsedAed = Math.max(0, parseFloat(qeAed) || 0);
    const parsedRate = Math.max(0.01, parseFloat(qeRate) || settings.defaultExchangeRate || 77.5);
    const parsedPkr = Math.max(0, Math.round(parseFloat(qePkr) || parsedAed * parsedRate));

    const updatedOrder: MoneyTransfer = {
      ...quickEditOrder,
      date: qeDate || quickEditOrder.date,
      station: qeStation,
      amountAED: Number(parsedAed.toFixed(2)),
      exchangeRate: Number(parsedRate.toFixed(2)),
      amountPKR: parsedPkr,
      netPayablePKR: parsedPkr,
      totalCollectedAED: Number((parsedAed + (quickEditOrder.commissionAmount || 0)).toFixed(2)),
      amountPaidPKR: quickEditOrder.status === 'Completed' ? parsedPkr : quickEditOrder.amountPaidPKR,
      remainingBalancePKR:
        quickEditOrder.status === 'Completed'
          ? 0
          : Math.max(0, parsedPkr - (quickEditOrder.amountPaidPKR || 0))
    };

    saveTransfer(updatedOrder);
    setQuickEditOrder(null);
  };

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <EagleStarLogo variant="icon" size="md" isDarkBackground={false} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-urdu-heading">
                {language === 'ur' ? 'اسٹیشن آرڈر لسٹ مصفح (پاکستانی روپے اور درہم)' : 'Station Order List (PKR & AED)'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 font-urdu-heading">
                {language === 'ur' ? 'صرف اسٹیشنز کے لیے' : 'Stations Only'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 font-urdu-body">
              {language === 'ur'
                ? 'تمام رجسٹرڈ اسٹیشنز کے آرڈرز — پاکستانی روپے (PKR) اور درہم (AED) دونوں میں مکمل تفصیل، ترمیم اور پرنٹنگ'
                : 'Dedicated Station Order Register with dual currency support (Pakistani Rupees PKR & UAE Dirhams AED), instant editing & printing'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openNewTransferModal}
            className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer font-urdu-heading"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>{language === 'ur' ? '+ نیا اسٹیشن آرڈر' : '+ New Station Order'}</span>
          </button>

          <button
            onClick={() => setCurrentScreen('stations')}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-950 text-slate-800 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition border border-slate-300 cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-emerald-700" />
            <span>{language === 'ur' ? 'اسٹیشنز کا انتظام' : 'Manage Stations'}</span>
          </button>

          <button
            onClick={handleLaunchPrint}
            disabled={activeTransfersToPrint.length === 0 && selectedStation === 'all' && appStations.length === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{t('printOrderList')}</span>
          </button>
        </div>
      </div>

      {/* Station Quick Selector Cards (Strictly Station-Based Overview) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 font-urdu-heading flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-emerald-700" />
            <span>
              {language === 'ur'
                ? 'اسٹیشن منتخب کریں (ہر اسٹیشن کا درہم اور پاکستانی روپے کا حساب):'
                : 'Select Station (Station-wise AED & PKR Summary):'}
            </span>
          </span>
          <span className="text-xs font-mono font-bold text-slate-500">
            {stationsList.length} {language === 'ur' ? 'اسٹیشنز' : 'Stations'}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {userStationRestriction === 'all' && (
            <button
              type="button"
              onClick={() => handleSelectStation('all')}
              className={`px-3.5 py-2 rounded-xl border text-left transition shrink-0 cursor-pointer ${
                selectedStation === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-300'
              }`}
            >
              <div className="font-bold text-xs font-urdu-heading">
                {language === 'ur' ? 'تمام اسٹیشنز (All Stations)' : 'All Stations'}
              </div>
              <div className="text-[11px] font-mono mt-0.5 opacity-85">
                {stationTransfers.length} Orders • {stationTransfers.reduce((s, o) => s + (o.amountAED || 0), 0).toLocaleString()} AED •{' '}
                {stationTransfers.reduce((s, o) => s + (o.amountPKR || 0), 0).toLocaleString()} PKR
              </div>
            </button>
          )}

          {stationsList.map(stName => {
            const stOrders = stationTransfers.filter(
              tr => (findCanonicalStationName(tr.station) || tr.station) === stName
            );
            const stAed = stOrders.reduce((s, o) => s + (o.amountAED || 0), 0);
            const stPkr = stOrders.reduce((s, o) => s + (o.amountPKR || 0), 0);
            const isSelected = selectedStation === stName;

            return (
              <button
                key={stName}
                type="button"
                onClick={() => handleSelectStation(stName)}
                className={`px-3.5 py-2 rounded-xl border text-left transition shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                    : 'bg-slate-50 hover:bg-emerald-50/60 text-slate-900 border-slate-300'
                }`}
              >
                <div className="font-bold text-xs font-urdu-heading flex items-center justify-between gap-2">
                  <span>{stName}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {stOrders.length}
                  </span>
                </div>
                <div className="text-[11px] font-mono mt-0.5 opacity-90">
                  {stAed.toLocaleString()} AED | {stPkr.toLocaleString()} PKR
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter, Currency Mode & Selection Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Filter className="w-4 h-4 text-emerald-700" />
            <span className="font-bold">{t('filter')}:</span>
          </div>

          {/* Search Order / Sender / Receiver */}
          <div className="relative min-w-[180px]">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={language === 'ur' ? 'آرڈر نمبر، نام تلاش کریں...' : 'Search order #, sender, receiver...'}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:border-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
          </div>

          {/* Station Dropdown */}
          <select
            value={selectedStation}
            onChange={e => handleSelectStation(e.target.value)}
            disabled={userStationRestriction !== 'all'}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-urdu-body font-bold text-slate-900 focus:border-emerald-500"
          >
            {userStationRestriction === 'all' && (
              <option value="all">{language === 'ur' ? 'تمام اسٹیشنز' : 'All Stations'}</option>
            )}
            {stationsList.map(st => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Quick Date Preset Buttons */}
          <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-300">
            {(
              [
                { id: 'all', ur: 'تمام', en: 'All' },
                { id: 'today', ur: 'آج', en: 'Today' },
                { id: '7days', ur: '7 دن', en: '7 Days' },
                { id: 'month', ur: 'اس ماہ', en: 'Month' }
              ] as const
            ).map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setDatePreset(p.id);
                  setSelectedDate('');
                }}
                className={`px-2 py-1 rounded text-xs font-bold transition cursor-pointer ${
                  datePreset === p.id && !selectedDate
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                {language === 'ur' ? p.ur : p.en}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <input
            type="date"
            value={selectedDate}
            onChange={e => {
              setSelectedDate(e.target.value);
              if (e.target.value) setDatePreset('custom');
              else setDatePreset('all');
            }}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-xs focus:border-emerald-500"
            placeholder={t('filterByDate')}
          />

          {(selectedDate || datePreset !== 'all' || searchQuery.trim()) && (
            <button
              type="button"
              onClick={() => {
                setSelectedDate('');
                setDatePreset('all');
                setSearchQuery('');
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition cursor-pointer"
            >
              {language === 'ur' ? 'صاف کریں' : 'Reset'}
            </button>
          )}

          {/* Currency Display Toggle: Both PKR & AED, PKR Only, AED Only */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-300">
            <Coins className="w-3.5 h-3.5 text-emerald-700 mx-1" />
            <button
              type="button"
              onClick={() => setCurrencyMode('both')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                currencyMode === 'both'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              {language === 'ur' ? 'پاکستانی + درہم (Both)' : 'PKR + AED Both'}
            </button>
            <button
              type="button"
              onClick={() => setCurrencyMode('PKR')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                currencyMode === 'PKR'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              {language === 'ur' ? 'صرف پاکستانی (PKR)' : 'PKR Only'}
            </button>
            <button
              type="button"
              onClick={() => setCurrencyMode('AED')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                currencyMode === 'AED'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              {language === 'ur' ? 'صرف درہم (AED)' : 'AED Only'}
            </button>
          </div>

          {(selectedStation !== userStationRestriction || selectedDate || searchQuery) && (
            <button
              onClick={() => {
                handleSelectStation(userStationRestriction);
                setSelectedDate('');
                setSearchQuery('');
              }}
              className="text-xs text-emerald-700 hover:text-emerald-900 hover:underline font-bold cursor-pointer"
            >
              {t('reset')}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleSelectAll}
            className="flex items-center gap-1.5 text-slate-800 hover:text-slate-950 font-bold cursor-pointer"
          >
            {activeTransfersToPrint.length === filteredTransfers.length && filteredTransfers.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-emerald-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>
              {t('selectAll')} ({activeTransfersToPrint.length} / {filteredTransfers.length})
            </span>
          </button>
        </div>
      </div>

      {/* Quick Inline Order Edit Bar (when editing an order directly from Order List) */}
      {quickEditOrder && (
        <form
          onSubmit={handleSaveQuickEdit}
          className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 shadow-md space-y-3"
          dir={language === 'ur' ? 'rtl' : 'ltr'}
        >
          <div className="flex items-center justify-between border-b border-amber-300 pb-2">
            <div className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-amber-800" />
              <span className="font-bold text-sm text-amber-950 font-urdu-heading">
                {language === 'ur'
                  ? `فوری ترمیم آرڈر #${quickEditOrder.orderNumber} (${quickEditOrder.senderName} ← ${quickEditOrder.receiverName})`
                  : `Quick Edit Station Order #${quickEditOrder.orderNumber}`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setQuickEditOrder(null)}
              className="text-amber-800 hover:text-amber-950 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                {language === 'ur' ? 'تاریخ (Custom Date)' : 'Date'}
              </label>
              <input
                type="date"
                value={qeDate}
                onChange={e => setQeDate(e.target.value)}
                className="w-full bg-white border border-amber-400 rounded-lg p-2 font-mono font-bold text-slate-950"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                {language === 'ur' ? 'اسٹیشن (Station)' : 'Station'}
              </label>
              <select
                value={qeStation}
                onChange={e => setQeStation(e.target.value)}
                className="w-full bg-white border border-amber-400 rounded-lg p-2 font-urdu-body font-bold text-slate-950"
              >
                {stationsList.map(st => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                {language === 'ur' ? 'درہم (AED Amount)' : 'Amount (AED)'}
              </label>
              <input
                type="number"
                step="0.01"
                value={qeAed}
                onChange={e => {
                  const val = e.target.value;
                  setQeAed(val);
                  const numAed = parseFloat(val) || 0;
                  const numRate = parseFloat(qeRate) || settings.defaultExchangeRate || 77.5;
                  setQePkr(String(Math.round(numAed * numRate)));
                }}
                className="w-full bg-white border border-amber-400 rounded-lg p-2 font-mono font-bold text-slate-950"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                {language === 'ur' ? 'شرح تبادلہ (Rate)' : 'Exchange Rate'}
              </label>
              <input
                type="number"
                step="0.01"
                value={qeRate}
                onChange={e => {
                  const val = e.target.value;
                  setQeRate(val);
                  const numRate = parseFloat(val) || 0;
                  const numAed = parseFloat(qeAed) || 0;
                  if (numAed > 0 && numRate > 0) {
                    setQePkr(String(Math.round(numAed * numRate)));
                  }
                }}
                className="w-full bg-white border border-amber-400 rounded-lg p-2 font-mono font-bold text-slate-950"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                {language === 'ur' ? 'پاکستانی روپے (PKR Amount)' : 'Amount (PKR)'}
              </label>
              <input
                type="number"
                value={qePkr}
                onChange={e => {
                  const val = e.target.value;
                  setQePkr(val);
                  const numPkr = parseFloat(val) || 0;
                  const numRate = parseFloat(qeRate) || settings.defaultExchangeRate || 77.5;
                  if (numRate > 0) {
                    setQeAed(String(Number((numPkr / numRate).toFixed(2))));
                  }
                }}
                className="w-full bg-white border border-amber-400 rounded-lg p-2 font-mono font-bold text-slate-950"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{language === 'ur' ? 'محفوظ کریں' : 'Save'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = quickEditOrder;
                  setQuickEditOrder(null);
                  openEditTransferModal(target);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-3 rounded-lg cursor-pointer"
              >
                {language === 'ur' ? 'مکمل فارم' : 'Full Edit'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Sheet Preview Container */}
      <div className="bg-slate-200/80 p-3 sm:p-8 rounded-2xl border border-slate-300 shadow-inner flex justify-center overflow-x-auto">
        <div
          className="bg-white text-slate-900 shadow-xl border-2 border-slate-700 p-5 sm:p-10 w-full max-w-6xl"
          dir="rtl"
        >
          {/* Official Letterhead & Main Title Calligraphy */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between pb-3 mb-2 border-b border-slate-200 gap-2">
              <EagleStarLogo
                variant="print"
                size="sm"
                showSubtitle={true}
                customNameEn={settings.businessNameEn}
                customNameUr={settings.businessNameUr}
                customSubtitle={settings.branchEn}
              />
              <div className="text-right sm:text-left text-[11px] text-slate-600 font-mono" dir="ltr">
                <p className="font-bold text-slate-800">{settings.businessNameEn} — {settings.branchEn}</p>
                <p>{settings.addressEn}</p>
                <p>Helpline: {settings.phoneEn} {settings.phoneUr && settings.phoneUr !== settings.phoneEn ? `| ${settings.phoneUr}` : ''}</p>
              </div>
            </div>

            <div className="text-center pt-1">
              <h2 className="text-3xl sm:text-5xl font-bold font-musaffah-title text-slate-950 tracking-normal pb-1">
                آرڈر لسٹ و کھاتہ مصفح {selectedStation !== 'all' ? `- ${selectedStation}` : ''}
              </h2>
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-700 mt-2 px-1 gap-2">
                <span className="font-bold text-slate-900">
                  {settings.businessNameUr || 'ایگل اسٹار برانڈ'} - مکمل اسٹیشن آرڈر لسٹ، جمع، ٹرانسفر اور بقایا بیلنس (PKR & AED)
                </span>
                <span className="font-mono font-bold">
                  {selectedDate ? `تاریخ: ${selectedDate}` : `تاریخ: ${new Date().toISOString().split('T')[0]}`}
                </span>
                <span className="font-bold">{settings.branchUr}</span>
              </div>
            </div>
          </div>

          {/* Render Each Station Block */}
          {Object.keys(groupedOrders).length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-urdu-body space-y-3">
              <p>{t('noDataFound')}</p>
              <button
                type="button"
                onClick={openNewTransferModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'ur' ? 'نیا اسٹیشن آرڈر شامل کریں' : 'Add First Station Order'}</span>
              </button>
            </div>
          ) : (
            Object.entries(groupedOrders).map(([stationName, orders]) => {
              const stationPkr = orders.reduce((s, o) => s + (Number(o.amountPKR) || 0), 0);
              const stationAed = orders.reduce((s, o) => s + (Number(o.amountAED) || 0), 0);
              const matchedStationObj = appStations.find(
                s => s.nameUr === stationName || s.nameEn.toLowerCase() === stationName.toLowerCase() || s.code.toLowerCase() === stationName.toLowerCase()
              );

              const allStationEntries = matchedStationObj?.entries || [];
              const stationEntries = allStationEntries.filter(
                e => !selectedDate || e.date === selectedDate
              );
              const totalJamaPkr = allStationEntries
                .filter(e => e.type === 'deposit_topup' || e.type === 'settlement_repayment')
                .reduce((sum, e) => sum + (e.amountPKR || 0), 0);
              const totalPaidOutPkr =
                allStationEntries
                  .filter(e => e.type === 'transfer_payout' || e.type === 'adjustment')
                  .reduce((sum, e) => sum + (e.amountPKR || 0), 0) || stationPkr;
              const currentBalPkr = matchedStationObj ? matchedStationObj.currentBalancePKR || 0 : -stationPkr;
              const openingBalPkr =
                allStationEntries.length > 0
                  ? allStationEntries[allStationEntries.length - 1].previousBalancePKR || 0
                  : currentBalPkr - totalJamaPkr + totalPaidOutPkr;
              const defaultRate = settings.defaultExchangeRate || 77.5;
              const currentBalAed = Math.round((currentBalPkr / defaultRate) * 100) / 100;

              return (
                <div key={stationName} className="mb-10 overflow-x-auto">
                  {/* Station Header & Complete Urdu Financial Summary (Opening, Jama, Transfer, Balance) */}
                  <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-3 sm:p-4 mb-4">
                    <div className="flex flex-wrap items-center justify-between border-b border-slate-300 pb-2 mb-3 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl font-bold font-musaffah-title text-slate-950">
                          اسٹیشن: {stationName} {matchedStationObj ? `(${matchedStationObj.nameEn})` : ''}
                        </span>
                        {matchedStationObj?.code && (
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-xs font-bold">
                            {matchedStationObj.code}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold font-musaffah-title text-slate-800 flex items-center gap-3">
                        {matchedStationObj?.inCharge && <span>انچارج: {matchedStationObj.inCharge}</span>}
                        {matchedStationObj?.phone && <span className="font-mono" dir="ltr">{matchedStationObj.phone}</span>}
                        <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-300">
                          تاریخ: {selectedDate || new Date().toISOString().split('T')[0]}
                        </span>
                      </div>
                    </div>

                    {/* 4-Column Urdu Financial Summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center font-musaffah-title">
                      <div className="bg-white border border-slate-300 rounded-lg p-2">
                        <div className="text-xs text-slate-600 font-bold">سابقہ بقایا (Opening)</div>
                        <div className="text-sm sm:text-base font-extrabold font-mono text-slate-900 mt-0.5" dir="ltr">
                          {openingBalPkr.toLocaleString()} PKR
                        </div>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-400 rounded-lg p-2">
                        <div className="text-xs text-emerald-950 font-bold">کل جمع رقم (Total Jama +)</div>
                        <div className="text-sm sm:text-base font-extrabold font-mono text-emerald-800 mt-0.5" dir="ltr">
                          +{totalJamaPkr.toLocaleString()} PKR
                        </div>
                      </div>
                      <div className="bg-amber-50 border border-amber-400 rounded-lg p-2">
                        <div className="text-xs text-amber-950 font-bold">کل ٹرانسفر / بنام (Transfers -)</div>
                        <div className="text-sm sm:text-base font-extrabold font-mono text-amber-900 mt-0.5" dir="ltr">
                          -{totalPaidOutPkr.toLocaleString()} PKR
                        </div>
                      </div>
                      <div
                        className={`border-2 rounded-lg p-2 ${
                          currentBalPkr < 0
                            ? 'bg-red-50 border-red-600 text-red-900'
                            : 'bg-emerald-100/80 border-emerald-700 text-emerald-950'
                        }`}
                      >
                        <div className="text-xs font-bold">
                          موجودہ بقایا بیلنس ({currentBalPkr < 0 ? 'منفی واجب الادا' : 'جمع بیلنس'})
                        </div>
                        <div className="text-sm sm:text-base font-extrabold font-mono mt-0.5" dir="ltr">
                          {currentBalPkr.toLocaleString()} PKR ({currentBalAed.toLocaleString()} AED)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 1: Station Transfers Table */}
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-bold font-musaffah-title text-base text-slate-950">
                      1. تفصیل ٹرانسفر آرڈرز ({stationName}) — کل آرڈرز: {orders.length}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-700" dir="ltr">
                      Total Transfers: {stationAed.toLocaleString()} AED | {stationPkr.toLocaleString()} PKR
                    </span>
                  </div>

                  <table className="w-full text-right text-xs sm:text-sm border-collapse border border-slate-400 mb-5">
                    <thead>
                      <tr className="border-t-2 border-b-2 border-slate-900 font-bold font-musaffah-title text-slate-950 text-sm bg-slate-100">
                        <th className="py-2.5 px-2 w-10 text-center font-mono border border-slate-400">#</th>
                        <th className="py-2.5 px-2 w-24 text-center font-mono border border-slate-400">تاریخ</th>
                        <th className="py-2.5 px-2.5 w-24 text-center font-mono border border-slate-400">آرڈر نمبر</th>
                        <th className="py-2.5 px-2.5 border border-slate-400">ارسال کنندہ</th>
                        <th className="py-2.5 px-2.5 border border-slate-400">وصول کنندہ</th>
                        <th className="py-2.5 px-2.5 text-center border border-slate-400">طریقہ ترسیل و بینک</th>
                        <th className="py-2.5 px-2.5 w-24 text-center border border-slate-400">سٹیشن</th>
                        {(currencyMode === 'both' || currencyMode === 'AED') && (
                          <th className="py-2.5 px-2.5 w-24 text-center font-bold text-blue-950 border border-slate-400">درہم (AED)</th>
                        )}
                        {currencyMode === 'both' && (
                          <th className="py-2.5 px-2 w-16 text-center font-mono text-xs border border-slate-400">ریٹ</th>
                        )}
                        {(currencyMode === 'both' || currencyMode === 'PKR') && (
                          <th className="py-2.5 px-2.5 w-28 text-center font-bold text-emerald-950 border border-slate-400">ٹرانسفر (PKR)</th>
                        )}
                        <th className="py-2.5 px-2.5 w-28 text-center font-bold border border-slate-400">بقایا بیلنس (PKR)</th>
                        <th className="py-2.5 px-2 w-28 text-center no-print border border-slate-400">ترمیم / پرنٹ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="py-4 text-center text-slate-500 font-musaffah-title">
                            اس اسٹیشن کے لیے کوئی ٹرانسفر آرڈر منتخب نہیں ہے۔
                          </td>
                        </tr>
                      ) : (
                        orders.map((ord, idx) => {
                          const linkedLedger = matchedStationObj?.entries?.find(
                            e => e.referenceNo === ord.orderNumber || e.receiptNo === ord.receiptNumber
                          );
                          const rowRunningBal =
                            typeof ord.stationNewBalancePKR === 'number'
                              ? ord.stationNewBalancePKR
                              : linkedLedger && typeof linkedLedger.newBalancePKR === 'number'
                              ? linkedLedger.newBalancePKR
                              : null;

                          return (
                            <tr
                              key={ord.id}
                              className="border-b border-slate-400 font-musaffah-title hover:bg-emerald-50/50 cursor-pointer text-slate-900 transition-colors"
                              onClick={() => handleToggleOrder(ord.id)}
                            >
                              <td className="py-2.5 px-2 text-center font-mono font-bold border border-slate-300">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-2 text-center font-mono text-xs font-bold border border-slate-300" dir="ltr">
                                {ord.date}
                              </td>
                              <td className="py-2.5 px-2.5 text-center font-mono font-bold text-slate-950 border border-slate-300">
                                {ord.orderNumber}
                              </td>
                              <td className="py-2.5 px-2.5 border border-slate-300">
                                <span className="font-bold">{ord.senderName}</span>
                                {ord.senderPhone && (
                                  <span className="font-mono text-[11px] text-slate-600 block" dir="ltr">
                                    {ord.senderPhone}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-2.5 font-bold text-slate-950 border border-slate-300">
                                <div>{ord.receiverName}</div>
                                {ord.receiverPhone && (
                                  <span className="font-mono text-[11px] text-slate-600 block" dir="ltr">
                                    {ord.receiverPhone}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-2.5 text-center font-semibold text-xs border border-slate-300">
                                <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-900 font-mono text-[11px] font-bold border border-slate-300">
                                  {ord.payoutMethod === 'Bank Transfer'
                                    ? `بذریعہ بینک ${ord.bankName ? `(${ord.bankName})` : ''}`
                                    : ord.payoutMethod === 'EasyPaisa'
                                    ? 'ایزی پیسہ'
                                    : ord.payoutMethod === 'JazzCash'
                                    ? 'جیز کیش'
                                    : ord.payoutMethod === 'NayaPay'
                                    ? 'نیا پیسہ'
                                    : ord.payoutMethod === 'SadaPay'
                                    ? 'سدا پیسہ'
                                    : ord.payoutMethod === 'Raast'
                                    ? 'راست'
                                    : ord.payoutMethod || 'کاؤنٹر کیش'}
                                </span>
                                {ord.accountNumber && (
                                  <div className="font-mono text-[10px] text-slate-700 mt-0.5" dir="ltr">
                                    A/C: {ord.accountNumber}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-2.5 text-center font-bold border border-slate-300">
                                {findCanonicalStationName(ord.station) || ord.station}
                              </td>
                              {(currencyMode === 'both' || currencyMode === 'AED') && (
                                <td className="py-2.5 px-2.5 text-center font-bold font-mono text-sm sm:text-base text-blue-950 border border-slate-300" dir="ltr">
                                  {(Number(ord.amountAED) || 0).toLocaleString()} AED
                                </td>
                              )}
                              {currencyMode === 'both' && (
                                <td className="py-2.5 px-2 text-center font-mono text-xs font-bold text-slate-700 border border-slate-300" dir="ltr">
                                  {ord.exchangeRate}
                                </td>
                              )}
                              {(currencyMode === 'both' || currencyMode === 'PKR') && (
                                <td className="py-2.5 px-2.5 text-center font-extrabold font-mono text-sm sm:text-base text-slate-950 border border-slate-300" dir="ltr">
                                  {(Number(ord.amountPKR) || 0).toLocaleString()} PKR
                                </td>
                              )}
                              <td
                                className={`py-2.5 px-2.5 text-center font-bold font-mono text-xs sm:text-sm border border-slate-300 ${
                                  rowRunningBal !== null && rowRunningBal < 0 ? 'text-red-700' : 'text-emerald-950'
                                }`}
                                dir="ltr"
                              >
                                {rowRunningBal !== null
                                  ? `${rowRunningBal.toLocaleString()} PKR`
                                  : `${currentBalPkr.toLocaleString()} PKR`}
                              </td>
                              <td
                                className="py-2.5 px-2 text-center no-print border border-slate-300"
                                onClick={e => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  {canEditTransfers && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={e => handleStartQuickEdit(ord, e)}
                                        title={language === 'ur' ? 'فوری ترمیم (درہم / پاکستانی / اسٹیشن)' : 'Quick Edit AED / PKR / Station'}
                                        className="px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-[11px] font-bold transition cursor-pointer"
                                      >
                                        {language === 'ur' ? 'فوری ترمیم' : 'Quick Edit'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openEditTransferModal(ord)}
                                        title={language === 'ur' ? 'مکمل فارم میں ترمیم کریں' : 'Full Edit Order'}
                                        className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition cursor-pointer"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => openReceipt({ format: 'A', transfer: ord })}
                                    title={language === 'ur' ? 'رسید پرنٹ کریں' : 'Print Order Slip'}
                                    className="p-1.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition cursor-pointer"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                  </button>
                                  {(isSuperAdmin || canDeleteTransfers) && (
                                    <button
                                      type="button"
                                      onClick={() => setOrderToDelete(ord)}
                                      title={language === 'ur' ? 'آرڈر حذف کریں (صرف سپر ایڈمن)' : 'Delete Order (Super Admin Only)'}
                                      className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition cursor-pointer"
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
                    {/* Summary row with double line */}
                    <tfoot>
                      <tr className="border-t-4 border-double border-slate-800 font-bold font-musaffah-title text-slate-900 text-sm bg-slate-100">
                        <td className="py-2.5 px-3 text-center" colSpan={3}>
                          تعداد آرڈرز ({stationName}): <span className="font-mono font-bold text-base">{orders.length}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center" colSpan={3}>
                          ٹوٹل ٹرانسفر درہم (AED):{' '}
                          <span className="font-mono font-extrabold text-base text-blue-950" dir="ltr">
                            {stationAed.toLocaleString()} AED
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold" colSpan={3}>
                          ٹوٹل ٹرانسفر پاکستانی (PKR):{' '}
                          <span className="font-mono font-extrabold text-base text-emerald-950" dir="ltr">
                            {stationPkr.toLocaleString()} PKR
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold" colSpan={3}>
                          بقایا بیلنس:{' '}
                          <span
                            className={`font-mono font-extrabold text-base ${
                              currentBalPkr < 0 ? 'text-red-700' : 'text-emerald-950'
                            }`}
                            dir="ltr"
                          >
                            {currentBalPkr.toLocaleString()} PKR
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Section 2: Station Cash Jama & Running Balance Ledger Table */}
                  {stationEntries.length > 0 && (
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="font-bold font-musaffah-title text-base text-slate-950">
                          2. تفصیل کیش جمع اور بنام کھاتہ ({stationName} — جمع، ٹرانسفر اور بقایا بیلنس)
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-700" dir="ltr">
                          Entries: {stationEntries.length}
                        </span>
                      </div>

                      <table className="w-full text-right text-xs sm:text-sm border-collapse border border-slate-400">
                        <thead>
                          <tr className="border-t-2 border-b-2 border-slate-900 font-bold font-musaffah-title text-slate-950 bg-slate-100">
                            <th className="py-2 px-2 w-24 text-center font-mono border border-slate-400">تاریخ</th>
                            <th className="py-2 px-2 w-28 text-center font-mono border border-slate-400">رسید / آرڈر نمبر</th>
                            <th className="py-2 px-2 w-28 text-center border border-slate-400">مد / نوعیت</th>
                            <th className="py-2 px-2.5 border border-slate-400">تفصیل و بینک / طریقہ</th>
                            <th className="py-2 px-2.5 w-32 text-center text-emerald-900 border border-slate-400">جمع (Jama + PKR)</th>
                            <th className="py-2 px-2.5 w-32 text-center text-amber-900 border border-slate-400">ٹرانسفر / بنام (- PKR)</th>
                            <th className="py-2 px-2.5 w-36 text-center border border-slate-400">بقایا بیلنس (Balance PKR)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stationEntries.slice(0, 20).map(ent => {
                            const isCredit = ent.type === 'deposit_topup' || ent.type === 'settlement_repayment';
                            return (
                              <tr key={ent.id} className="border-b border-slate-300 font-musaffah-title text-slate-900">
                                <td className="py-2 px-2 text-center font-mono text-xs font-bold border border-slate-300" dir="ltr">
                                  {ent.date}
                                </td>
                                <td className="py-2 px-2 text-center font-mono text-xs font-bold border border-slate-300" dir="ltr">
                                  {ent.referenceNo || ent.receiptNo || '-'}
                                </td>
                                <td className="py-2 px-2 text-center font-bold border border-slate-300">
                                  {ent.type === 'deposit_topup'
                                    ? 'کیش جمع (Deposit)'
                                    : ent.type === 'settlement_repayment'
                                    ? 'سیٹلمنٹ جمع'
                                    : ent.type === 'transfer_payout'
                                    ? 'ٹرانسفر ادائیگی'
                                    : 'ایڈجسٹمنٹ'}
                                </td>
                                <td className="py-2 px-2.5 border border-slate-300">
                                  <span className="font-bold">{ent.description}</span>
                                  {ent.paymentMethod && (
                                    <span className="font-mono text-xs text-slate-600 mr-2" dir="ltr">
                                      ({ent.paymentMethod}{ent.bankName ? ` - ${ent.bankName}` : ''})
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-2.5 text-center font-mono font-bold text-emerald-800 border border-slate-300" dir="ltr">
                                  {isCredit ? `+${(ent.amountPKR || 0).toLocaleString()}` : '-'}
                                </td>
                                <td className="py-2 px-2.5 text-center font-mono font-bold text-amber-900 border border-slate-300" dir="ltr">
                                  {!isCredit ? `-${(ent.amountPKR || 0).toLocaleString()}` : '-'}
                                </td>
                                <td
                                  className={`py-2 px-2.5 text-center font-mono font-extrabold border border-slate-300 ${
                                    (ent.newBalancePKR || 0) < 0 ? 'text-red-700' : 'text-slate-950'
                                  }`}
                                  dir="ltr"
                                >
                                  {(ent.newBalancePKR || 0).toLocaleString()} PKR
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Grand Summary Strip */}
          {Object.keys(groupedOrders).length > 0 && (
            <div className="space-y-4 mt-4">
              <div className="bg-slate-900 text-white p-3.5 rounded-lg flex flex-wrap justify-between items-center text-sm font-bold font-mono gap-3">
                <span>میزان کل اسٹیشن آرڈرز: {activeTransfersToPrint.length}</span>
                <span>ٹوٹل درہم (Total Dirhams): {grandTotalAed.toLocaleString()} AED</span>
                <span>ٹوٹل پاکستانی روپے (Total PKR): {grandTotalPkr.toLocaleString()} PKR</span>
              </div>

              <div className="bg-slate-50 border border-slate-800 rounded-lg py-2.5 px-4 text-center space-y-1">
                <p className="font-musaffah-title text-sm sm:text-base font-bold text-slate-950" dir="rtl">
                  {settings.receiptFooterUr || 'اپنی رقم 5 دنوں کے اندر وصول کر لیں، بصورتِ دیگر ہم ذمہ دار نہیں ہوں گے۔'}
                </p>
                {settings.receiptFooterEn && (
                  <p className="text-[11px] font-mono text-slate-600" dir="ltr">
                    {settings.receiptFooterEn}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Order Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 font-urdu-heading text-center">
              {language === 'ur' ? 'آرڈر حذف کرنے کی تصدیق' : 'Confirm Delete Station Order'}
            </h3>
            <p className="text-sm text-slate-600 text-center">
              {language === 'ur'
                ? `کیا آپ واقعی آرڈر نمبر #${orderToDelete.orderNumber} (${orderToDelete.amountAED} AED / ${orderToDelete.amountPKR.toLocaleString()} PKR) کو حذف کرنا چاہتے ہیں؟`
                : `Are you sure you want to delete Order #${orderToDelete.orderNumber} (${orderToDelete.amountAED} AED / ${orderToDelete.amountPKR.toLocaleString()} PKR)?`}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteTransfer(orderToDelete.id);
                  setOrderToDelete(null);
                }}
                className="px-5 py-2 text-xs sm:text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow transition cursor-pointer"
              >
                {language === 'ur' ? 'ہاں، حذف کریں' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
