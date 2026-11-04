/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Station, PaymentMethod, StationTransactionType, StationLedgerEntry } from '../../types';
import { normalizeNumericInput } from './NewAmanatModal';
import {
  X,
  Wallet,
  CheckCircle2,
  AlertCircle,
  FileText,
  Landmark,
  Plus,
  Pencil,
  Trash2,
  Check
} from 'lucide-react';

interface StationDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStation?: Station | null;
  entryToEdit?: StationLedgerEntry | null;
}

export const StationDepositModal: React.FC<StationDepositModalProps> = ({
  isOpen,
  onClose,
  selectedStation,
  entryToEdit
}) => {
  const {
    stations,
    savedBanks,
    addSavedBank,
    updateSavedBank,
    deleteSavedBank,
    recordStationDeposit,
    updateStationDeposit,
    openReceipt,
    settings,
    isSuperAdmin,
    language,
    t,
    formatMoney
  } = useApp();

  const [stationId, setStationId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [txType, setTxType] = useState<StationTransactionType>('deposit_topup');
  const [currency, setCurrency] = useState<'PKR' | 'AED'>('PKR');
  const [amountInput, setAmountInput] = useState('');
  const [exchangeRate, setExchangeRate] = useState(settings.defaultExchangeRate || 77.50);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [bankName, setBankName] = useState('Meezan Bank (میزان بینک)');
  const [accountNumber, setAccountNumber] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [relatedParty, setRelatedParty] = useState('Eagle Star Dubai Office');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Manual Bank Add / Edit UI State
  const [bankManageMode, setBankManageMode] = useState<'none' | 'add' | 'edit'>('none');
  const [manualBankInput, setManualBankInput] = useState('');

  useEffect(() => {
    if (selectedStation) {
      setStationId(selectedStation.id);
    } else if (stations.length > 0 && !stationId) {
      setStationId(stations[0].id);
    }
  }, [selectedStation, stations, isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (entryToEdit) {
        setStationId(entryToEdit.stationId);
        setDate(entryToEdit.date);
        setTxType(entryToEdit.type || 'deposit_topup');
        setCurrency('PKR');
        setAmountInput(String(entryToEdit.amountPKR));
        setExchangeRate(entryToEdit.exchangeRate || settings.defaultExchangeRate || 77.50);
        setPaymentMethod(entryToEdit.paymentMethod || 'Bank Transfer');
        setBankName(
          entryToEdit.bankName ||
            (entryToEdit.paymentMethod === 'JazzCash'
              ? 'JazzCash (جیز کیش)'
              : entryToEdit.paymentMethod === 'EasyPaisa'
              ? 'EasyPaisa (ایزی پیسہ)'
              : savedBanks[0] || 'Meezan Bank (میزان بینک)')
        );
        setAccountNumber(entryToEdit.accountNumber || '');
        setReferenceNo(entryToEdit.referenceNo || entryToEdit.receiptNo || '');
        setRelatedParty(entryToEdit.relatedParty || 'Eagle Star Dubai Office');
        const cleanDesc = (entryToEdit.description || '')
          .replace(/\s*\[.*?\]/g, '')
          .replace(/\s*\(منفی بقایا.*?\)/g, '')
          .trim();
        setDescription(cleanDesc);
        setNotes(entryToEdit.notes || '');
      } else {
        setDate(new Date().toISOString().split('T')[0]);
        setTxType('deposit_topup');
        setCurrency('PKR');
        setAmountInput('');
        setExchangeRate(settings.defaultExchangeRate || 77.50);
        setPaymentMethod('Bank Transfer');
        setBankName(savedBanks[0] || 'Meezan Bank (میزان بینک)');
        setAccountNumber('');
        setReferenceNo(`DEP-VOUCH-${Math.floor(1000 + Math.random() * 9000)}`);
        setRelatedParty('Eagle Star Dubai Office');
        setDescription(
          language === 'ur'
            ? 'کاؤنٹر کے کیش فنڈز میں رقم کا جمع اور ٹاپ اپ'
            : 'Station Cash Funds Top-Up Deposit'
        );
        setNotes('');
      }
      setBankManageMode('none');
      setManualBankInput('');
      setErrorMsg('');
    }
  }, [isOpen, entryToEdit, language, settings.defaultExchangeRate]);

  if (!isOpen) return null;

  const currentStation = stations.find(s => s.id === stationId);
  const numericAmount = parseFloat(amountInput) || 0;
  const effectiveRate = exchangeRate > 0 ? exchangeRate : (settings.defaultExchangeRate || 77.50);
  const amountPKR = currency === 'AED' ? Math.round(numericAmount * effectiveRate) : numericAmount;
  const amountAED = currency === 'AED' ? numericAmount : Math.round(amountPKR / effectiveRate);

  const prevBalance = entryToEdit
    ? entryToEdit.previousBalancePKR
    : currentStation?.currentBalancePKR || 0;
  const isCredit = txType === 'deposit_topup' || txType === 'settlement_repayment';
  const minusDeducted = isCredit && prevBalance < 0 ? Math.min(amountPKR, Math.abs(prevBalance)) : 0;
  const newBalance = isCredit ? prevBalance + amountPKR : prevBalance - amountPKR;

  const handleSelectChannel = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === 'JazzCash') {
      setBankName('JazzCash (جیز کیش)');
    } else if (method === 'EasyPaisa') {
      setBankName('EasyPaisa (ایزی پیسہ)');
    } else if (method === 'NayaPay') {
      setBankName('NayaPay (نیا پیسہ)');
    } else if (method === 'SadaPay') {
      setBankName('SadaPay (سدا پیسہ)');
    } else if (method === 'Raast') {
      setBankName('Raast ID (راست)');
    } else if (method === 'Bank Transfer' && (bankName.includes('JazzCash') || bankName.includes('EasyPaisa') || !bankName)) {
      setBankName(savedBanks[0] || 'Meezan Bank (میزان بینک)');
    } else if (method === 'Cash') {
      setBankName('');
    }
  };

  const handleSaveManualBank = () => {
    const trimmed = manualBankInput.trim();
    if (!trimmed) return;
    if (bankManageMode === 'add') {
      addSavedBank(trimmed);
      setBankName(trimmed);
    } else if (bankManageMode === 'edit' && bankName) {
      updateSavedBank(bankName, trimmed);
      setBankName(trimmed);
    } else {
      addSavedBank(trimmed);
      setBankName(trimmed);
    }
    setBankManageMode('none');
    setManualBankInput('');
  };

  const handleSubmit = (e: React.FormEvent, printImmediately = false) => {
    e.preventDefault();
    setErrorMsg('');

    if (!stationId) {
      setErrorMsg(language === 'ur' ? 'براہ کرم اسٹیشن منتخب کریں' : 'Please select a station');
      return;
    }

    if (amountPKR <= 0) {
      setErrorMsg(language === 'ur' ? 'براہ کرم درست رقم درج کریں' : 'Please enter a valid amount');
      return;
    }

    const effectiveBankName =
      paymentMethod === 'Cash'
        ? undefined
        : bankName.trim() || paymentMethod;

    const receiptNo = entryToEdit?.receiptNo || `VOUCH-${Math.floor(10000 + Math.random() * 90000)}`;

    if (entryToEdit) {
      updateStationDeposit(stationId, entryToEdit.id, {
        date,
        amountPKR,
        amountAED,
        exchangeRate: effectiveRate,
        paymentMethod,
        bankName: effectiveBankName,
        accountNumber: accountNumber.trim() || undefined,
        referenceNo: referenceNo.trim() || entryToEdit.referenceNo,
        relatedParty: relatedParty.trim() || 'Head Office Deposit',
        description:
          description.trim() ||
          (txType === 'deposit_topup'
            ? 'کیش فنڈز ڈپازٹ'
            : txType === 'settlement_repayment'
            ? 'واجب الادا سیٹلمنٹ'
            : txType === 'transfer_payout'
            ? 'آرڈر کیش ادائیگی'
            : 'کاؤنٹر بیلنس ایڈجسٹمنٹ'),
        notes: notes.trim(),
        type: txType
      });
    } else {
      recordStationDeposit(stationId, {
        date,
        amountPKR,
        amountAED,
        exchangeRate: effectiveRate,
        paymentMethod,
        bankName: effectiveBankName,
        accountNumber: accountNumber.trim() || undefined,
        referenceNo: referenceNo.trim() || `VOUCH-${Date.now().toString().slice(-4)}`,
        relatedParty: relatedParty.trim() || 'Head Office Deposit',
        description:
          description.trim() ||
          (txType === 'deposit_topup'
            ? 'کیش فنڈز ڈپازٹ'
            : txType === 'settlement_repayment'
            ? 'واجب الادا سیٹلمنٹ'
            : txType === 'transfer_payout'
            ? 'آرڈر کیش ادائیگی'
            : 'کاؤنٹر بیلنس ایڈجسٹمنٹ'),
        notes: notes.trim(),
        receiptNo,
        type: txType
      });
    }

    onClose();

    if (printImmediately && currentStation) {
      openReceipt({
        format: 'A',
        depositEntry: {
          receiptNo,
          date,
          stationName: currentStation.nameUr || currentStation.nameEn,
          amountPKR,
          previousBalancePKR: prevBalance,
          newBalancePKR: newBalance,
          deductedOverdraftPKR: minusDeducted,
          paymentMethod,
          bankName: effectiveBankName,
          accountNumber: accountNumber.trim() || undefined,
          referenceNo: referenceNo.trim() || `VOUCH-${Date.now().toString().slice(-4)}`,
          relatedParty: relatedParty.trim() || 'Head Office Deposit',
          description: description.trim() || 'کیش فنڈز جمع اور ٹاپ اپ',
          notes: notes.trim(),
          txType
        }
      });
    }
  };

  const quickChannels: { method: PaymentMethod; labelUr: string; labelEn: string; icon: string; activeClass: string }[] = [
    {
      method: 'Bank Transfer',
      labelUr: 'بینک ٹرانسفر (Bank)',
      labelEn: 'Bank Transfer',
      icon: '🏦',
      activeClass: 'bg-blue-700 text-white border-blue-700 shadow-sm'
    },
    {
      method: 'JazzCash',
      labelUr: 'جیز کیش (JazzCash)',
      labelEn: 'JazzCash',
      icon: '📱',
      activeClass: 'bg-red-700 text-white border-red-700 shadow-sm'
    },
    {
      method: 'EasyPaisa',
      labelUr: 'ایزی پیسہ (EasyPaisa)',
      labelEn: 'EasyPaisa',
      icon: '📱',
      activeClass: 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
    },
    {
      method: 'Raast',
      labelUr: 'راست (Raast ID)',
      labelEn: 'Raast ID',
      icon: '⚡',
      activeClass: 'bg-indigo-700 text-white border-indigo-700 shadow-sm'
    },
    {
      method: 'NayaPay',
      labelUr: 'نیا پیسہ (NayaPay)',
      labelEn: 'NayaPay',
      icon: '💳',
      activeClass: 'bg-orange-600 text-white border-orange-600 shadow-sm'
    },
    {
      method: 'SadaPay',
      labelUr: 'سدا پیسہ (SadaPay)',
      labelEn: 'SadaPay',
      icon: '💳',
      activeClass: 'bg-teal-600 text-white border-teal-600 shadow-sm'
    },
    {
      method: 'Cash',
      labelUr: 'نقد کیش (Cash)',
      labelEn: 'Cash',
      icon: '💵',
      activeClass: 'bg-slate-900 text-white border-slate-900 shadow-sm'
    },
    {
      method: 'Other',
      labelUr: 'دیگر / کسٹم بینک (Other)',
      labelEn: 'Other / Custom',
      icon: '📝',
      activeClass: 'bg-purple-700 text-white border-purple-700 shadow-sm'
    }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto"
      dir={language === 'ur' ? 'rtl' : 'ltr'}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-6 overflow-hidden flex flex-col border border-slate-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg font-urdu-heading">
                {entryToEdit
                  ? language === 'ur'
                    ? 'اسٹیشن ڈپازٹ ریکارڈ میں ترمیم کریں'
                    : 'Edit Station Deposit & Channel'
                  : language === 'ur'
                  ? 'اسٹیشن / کاؤنٹر میں رقم جمع کریں (بینک، جیز کیش، ایزی پیسہ و دیگر)'
                  : 'Station Funds Deposit (Bank Transfer, JazzCash, EasyPaisa & Others)'}
              </h3>
              <p className="text-xs text-slate-300 font-urdu-body">
                {language === 'ur'
                  ? 'کاؤنٹر کے پاس رقم ڈپازٹ کریں، منفی بقایا منہا کریں، اور بینک کا نام منتخب یا خود درج کریں'
                  : 'Deposit funds via Bank Transfer, JazzCash, EasyPaisa or Cash — add or edit bank names manually'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={e => handleSubmit(e, false)} className="p-6 space-y-4 overflow-y-auto max-h-[82vh]">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Select Station */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 font-urdu-heading">
              {language === 'ur' ? 'اسٹیشن / کیش کاؤنٹر منتخب کریں' : 'Target Station / Counter'} *
            </label>
            <select
              value={stationId}
              onChange={e => setStationId(e.target.value)}
              disabled={Boolean(entryToEdit)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm font-urdu-body font-bold text-slate-950 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-70"
              required
            >
              {stations.map(s => (
                <option key={s.id} value={s.id}>
                  {s.nameUr || s.nameEn} - {language === 'ur' ? 'موجودہ بیلنس:' : 'Balance:'} {formatMoney(s.currentBalancePKR || 0, 'PKR')}
                </option>
              ))}
            </select>
          </div>

          {/* Transaction Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 font-urdu-heading">
              {language === 'ur' ? 'لین دین کی قسم (جمع یا کٹوتی / ادائیگی)' : 'Transaction Type (Credit or Debit)'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setTxType('deposit_topup')}
                className={`p-2 rounded-xl border font-bold transition text-center flex flex-col items-center gap-0.5 cursor-pointer ${
                  txType === 'deposit_topup'
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-500 ring-1 ring-emerald-500'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{language === 'ur' ? 'کیش ڈپازٹ (+)' : 'Deposit (+)'}</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  {language === 'ur' ? 'بیلنس بڑھے گا' : 'Credit (+)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTxType('settlement_repayment')}
                className={`p-2 rounded-xl border font-bold transition text-center flex flex-col items-center gap-0.5 cursor-pointer ${
                  txType === 'settlement_repayment'
                    ? 'bg-teal-50 text-teal-950 border-teal-500 ring-1 ring-teal-500'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{language === 'ur' ? 'سیٹلمنٹ (+)' : 'Settlement (+)'}</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  {language === 'ur' ? 'واجب الادا جمع' : 'Clears overdue'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTxType('transfer_payout')}
                className={`p-2 rounded-xl border font-bold transition text-center flex flex-col items-center gap-0.5 cursor-pointer ${
                  txType === 'transfer_payout'
                    ? 'bg-amber-50 text-amber-950 border-amber-500 ring-1 ring-amber-500'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{language === 'ur' ? 'آرڈر ادائیگی (-)' : 'Payout (-)'}</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  {language === 'ur' ? 'کاؤنٹر سے کٹوتی' : 'Debit (-)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTxType('adjustment')}
                className={`p-2 rounded-xl border font-bold transition text-center flex flex-col items-center gap-0.5 cursor-pointer ${
                  txType === 'adjustment'
                    ? 'bg-rose-50 text-rose-950 border-rose-500 ring-1 ring-rose-500'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{language === 'ur' ? 'ایڈجسٹمنٹ (-)' : 'Adjustment (-)'}</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  {language === 'ur' ? 'بیلنس منہا' : 'Deduct (-)'}
                </span>
              </button>
            </div>
          </div>

          {/* Live Balance Impact Preview Box */}
          {currentStation && (
            <div className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
              prevBalance < 0
                ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                : 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
            }`}>
              <div className="flex items-center justify-between font-bold">
                <span>{language === 'ur' ? 'سابقہ کاؤنٹر بیلنس (Previous Balance):' : 'Previous Station Balance:'}</span>
                <span className={`font-mono ${prevBalance < 0 ? 'text-red-700 font-black' : 'text-emerald-800'}`} dir="ltr">
                  {prevBalance.toLocaleString()} PKR
                  {prevBalance < 0 && (
                    <span className="text-[10px] ml-1.5 bg-red-100 text-red-800 px-1.5 py-0.5 rounded border border-red-300">
                      {language === 'ur' ? 'منفی / واجب الادا (Minus)' : 'Minus / Overdue'}
                    </span>
                  )}
                </span>
              </div>

              {amountPKR > 0 && (
                <div className="border-t pt-2 border-slate-300/60 space-y-1.5">
                  <div className="flex items-center justify-between font-semibold text-slate-700">
                    <span>{language === 'ur' ? 'جمع کردہ رقم (Deposit Given):' : 'Deposit Amount Given:'}</span>
                    <span className="font-mono font-bold text-emerald-700" dir="ltr">
                      +{amountPKR.toLocaleString()} PKR
                    </span>
                  </div>

                  {minusDeducted > 0 && (
                    <div className="flex items-center justify-between font-bold text-rose-700 bg-rose-100/70 px-2 py-1 rounded-lg border border-rose-200">
                      <span>{language === 'ur' ? 'منفی بقایا کی خودکار کٹوتی (Minus Deducted):' : 'Minus Balance Auto-Deducted:'}</span>
                      <span className="font-mono font-black" dir="ltr">
                        -{minusDeducted.toLocaleString()} PKR
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between font-bold pt-1 border-t border-slate-200">
                    <span>
                      {minusDeducted > 0
                        ? (language === 'ur' ? 'کٹوتی کے بعد بقایا خالص جمع بیلنس:' : 'Remaining Net Deposit Balance:')
                        : (language === 'ur' ? 'ڈپازٹ کے بعد نیا بیلنس:' : 'New Balance After Deposit:')}
                    </span>
                    <span className={`font-mono text-sm ${newBalance < 0 ? 'text-red-700 font-black' : 'text-emerald-900 font-black'}`} dir="ltr">
                      {newBalance.toLocaleString()} PKR ({newBalance < 0 ? (language === 'ur' ? 'منفی' : 'Minus') : (language === 'ur' ? 'جمع' : 'Credit')})
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Currency & Amount Input */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 font-urdu-heading">
                {language === 'ur' ? 'کرنسی' : 'Currency'}
              </label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="PKR">PKR (پاکستانی روپیہ)</option>
                <option value="AED">AED (درہم)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1 font-urdu-heading">
                {language === 'ur' ? 'جمع کردہ رقم (Amount)' : 'Deposit Amount'} *
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={amountInput}
                onChange={e => setAmountInput(normalizeNumericInput(e.target.value))}
                placeholder="e.g. 100000"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-base font-mono font-black text-slate-950 focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          </div>

          {/* Exchange Rate row if AED */}
          {currency === 'AED' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-950 font-bold">
              <span>{language === 'ur' ? 'شرح تبادلہ (Rate):' : 'Exchange Rate:'}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={exchangeRate}
                  onChange={e => setExchangeRate(parseFloat(e.target.value) || 77.50)}
                  className="w-20 bg-white border border-blue-300 rounded-lg p-1 text-center font-mono text-xs font-black"
                />
                <span>= {formatMoney(amountPKR, 'PKR')}</span>
              </div>
            </div>
          )}

          {/* Deposit Channel Quick Selector Buttons: Bank Transfer, JazzCash, EasyPaisa, Raast, NayaPay, Cash, Other */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 font-urdu-heading">
                {language === 'ur'
                  ? 'ڈپازٹ کا ذریعہ منتخب کریں (Bank Transfer, JazzCash, EasyPaisa & Others):'
                  : 'Deposit Channel (Bank Transfer, JazzCash, EasyPaisa & Others):'}
              </label>
              <select
                value={paymentMethod}
                onChange={e => handleSelectChannel(e.target.value as PaymentMethod)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900"
              >
                <option value="Bank Transfer">Bank Transfer (بینک ٹرانسفر)</option>
                <option value="JazzCash">JazzCash (جیز کیش)</option>
                <option value="EasyPaisa">EasyPaisa (ایزی پیسہ)</option>
                <option value="Raast">Raast ID (راست)</option>
                <option value="NayaPay">NayaPay (نیا پیسہ)</option>
                <option value="SadaPay">SadaPay (سدا پیسہ)</option>
                <option value="Cash">Cash (نقد کیش)</option>
                <option value="Hawala / Station Counter">Hawala / Counter (حوالہ)</option>
                <option value="Cheque">Cheque (چیک)</option>
                <option value="Other">Other / Custom Bank (دیگر)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-bold">
              {quickChannels.map(ch => (
                <button
                  key={ch.method}
                  type="button"
                  onClick={() => handleSelectChannel(ch.method)}
                  className={`py-2 px-2 rounded-xl border text-center transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === ch.method
                      ? ch.activeClass
                      : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>{ch.icon}</span>
                  <span className="truncate">{language === 'ur' ? ch.labelUr : ch.labelEn}</span>
                </button>
              ))}
            </div>

            {/* Bank / Wallet Name Selection + Manual Add / Edit Controls */}
            {paymentMethod !== 'Cash' && (
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-urdu-heading">
                    <Landmark className="w-3.5 h-3.5 text-blue-700" />
                    <span>
                      {language === 'ur'
                        ? 'بینک یا والیٹ کا نام (منتخب کریں یا خود لکھیں / ترمیم کریں):'
                        : 'Bank / Wallet Name (Select, Add or Edit Manually):'}
                    </span>
                  </label>

                  {/* Action Buttons to Add or Edit Saved Bank Names */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setBankManageMode(bankManageMode === 'add' ? 'none' : 'add');
                        setManualBankInput('');
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-300 flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{language === 'ur' ? '+ نیا بینک شامل کریں' : '+ Add New Bank'}</span>
                    </button>

                    {bankName && (
                      <button
                        type="button"
                        onClick={() => {
                          setBankManageMode(bankManageMode === 'edit' ? 'none' : 'edit');
                          setManualBankInput(bankName);
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 flex items-center gap-1 transition cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>{language === 'ur' ? 'بینک نام ترمیم' : 'Edit Bank'}</span>
                      </button>
                    )}

                    {isSuperAdmin && bankName && savedBanks.includes(bankName) && savedBanks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          deleteSavedBank(bankName);
                          const remaining = savedBanks.filter(b => b !== bankName);
                          setBankName(remaining[0] || '');
                        }}
                        title={language === 'ur' ? 'فہرست سے ہٹائیں (صرف سپر ایڈمن)' : 'Remove from saved list (Super Admin Only)'}
                        className="p-1 rounded-lg text-red-600 hover:bg-red-50 border border-red-200 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Add / Edit Saved Bank Name Bar */}
                {bankManageMode !== 'none' && (
                  <div className="p-2.5 bg-blue-50 border border-blue-300 rounded-xl flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-blue-950">
                      {bankManageMode === 'add'
                        ? language === 'ur'
                          ? 'نیا بینک نام درج کریں:'
                          : 'New Bank Name:'
                        : language === 'ur'
                        ? 'بینک کا نام تبدیل کریں:'
                        : 'Edit Bank Name:'}
                    </span>
                    <input
                      type="text"
                      value={manualBankInput}
                      onChange={e => setManualBankInput(e.target.value)}
                      placeholder={
                        language === 'ur'
                          ? 'مثلاً: میزان بینک، حبیب بینک، جیز کیش...'
                          : 'e.g. Meezan Bank, HBL, JazzCash, Al Baraka...'
                      }
                      className="flex-1 min-w-[180px] bg-white border border-blue-400 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-950 outline-none focus:ring-2 focus:ring-blue-600"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveManualBank}
                      className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{language === 'ur' ? 'محفوظ کریں' : 'Save Bank'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBankManageMode('none');
                        setManualBankInput('');
                      }}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                )}

                {/* Saved Bank Dropdown + Manual Bank Name Input + Account/Wallet Number */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      {language === 'ur' ? 'محفوظ بینک فہرست (Saved List):' : 'Select Saved Bank:'}
                    </label>
                    <select
                      value={savedBanks.includes(bankName) ? bankName : '__custom__'}
                      onChange={e => {
                        if (e.target.value === '__custom__') {
                          setBankManageMode('add');
                          setManualBankInput('');
                        } else {
                          setBankName(e.target.value);
                        }
                      }}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-950 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {savedBanks.map(b => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                      <option value="__custom__">
                        {language === 'ur' ? '+ نیا بینک خود درج کریں...' : '+ Type / Add Custom Bank...'}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      {language === 'ur' ? 'بینک نام (خود لکھیں یا ترمیم کریں):' : 'Bank Name (Manual Edit / Type):'}
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                      placeholder={language === 'ur' ? 'بینک یا والیٹ کا نام لکھیں' : 'Type or edit bank name manually'}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-950 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      {language === 'ur' ? 'اکاؤنٹ نمبر / موبائل والٹ #:' : 'Account / IBAN / Wallet #:'}
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value)}
                      placeholder={language === 'ur' ? 'اکاؤنٹ یا جیز کیش نمبر' : 'e.g. 0300... or PK36...'}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono font-bold text-slate-950 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Date, Voucher Ref & Depositor Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 font-urdu-heading">
                {language === 'ur' ? 'تاریخ' : 'Deposit Date'} *
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm font-mono font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 font-urdu-heading">
                {language === 'ur' ? 'واؤچر / حوالہ نمبر' : 'Voucher / Ref No'}
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={e => setReferenceNo(e.target.value)}
                placeholder="DEP-VOUCH-1001"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm font-mono text-slate-950 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 font-urdu-heading">
                {language === 'ur' ? 'فنڈز بھیجنے والا / ہیڈ آفس' : 'Depositor / Source'}
              </label>
              <input
                type="text"
                value={relatedParty}
                onChange={e => setRelatedParty(e.target.value)}
                placeholder="Eagle Star Dubai Office"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm text-slate-950 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Particulars Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 font-urdu-heading">
              {language === 'ur' ? 'تفصیل / وجہ (Description)' : 'Deposit Description'}
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="کاؤنٹر کے کیش فنڈز میں رقم کا جمع اور ٹاپ اپ"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm font-urdu-body text-slate-950 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-sm transition font-urdu-heading cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>
                {entryToEdit
                  ? language === 'ur'
                    ? 'تبدیلیاں محفوظ کریں'
                    : 'Update Deposit'
                  : language === 'ur'
                  ? 'محفوظ کریں'
                  : 'Save Deposit'}
              </span>
            </button>
            <button
              type="button"
              onClick={e => handleSubmit(e, true)}
              className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition shadow-md shadow-emerald-700/30 font-urdu-heading cursor-pointer flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>
                {entryToEdit
                  ? language === 'ur'
                    ? 'اپ ڈیٹ و پرنٹ رسید'
                    : 'Update & Print Slip'
                  : language === 'ur'
                  ? 'محفوظ و پرنٹ جمع رسید'
                  : 'Save & Print Deposit Slip'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

