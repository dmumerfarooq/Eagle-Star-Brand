/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Loan, Currency } from '../../types';
import { X, BookOpen, Calendar, Coins, Printer, Save } from 'lucide-react';

interface NewLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewLoanModal: React.FC<NewLoanModalProps> = ({ isOpen, onClose }) => {
  const { saveLoan, openReceipt, t, language } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [borrowerAddress, setBorrowerAddress] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>('PKR');
  const [loanDate, setLoanDate] = useState(todayStr);
  const [customDueDate, setCustomDueDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [agreedTerms, setAgreedTerms] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      const now = new Date().toISOString().split('T')[0];
      setBorrowerName('');
      setBorrowerPhone('');
      setBorrowerAddress('');
      setAmount('');
      setCurrency('PKR');
      setLoanDate(now);
      setCustomDueDate('');
      setPurpose('');
      setAgreedTerms('');
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const numAmount = Number(amount) || 0;

  const handleSubmit = (printImmediately: boolean) => {
    if (!borrowerName.trim() || numAmount <= 0) return;

    const loanNo = `LN-2026-${Math.floor(100 + Math.random() * 900)}`;
    const receiptNo = `LN-REC-${Math.floor(1000 + Math.random() * 9000)}`;

    const newLoan: Loan = {
      id: `loan-${Date.now()}`,
      loanNo,
      borrowerName: borrowerName.trim(),
      borrowerPhone: borrowerPhone.trim(),
      borrowerAddress: borrowerAddress.trim(),
      loanDate: loanDate || todayStr,
      initialAmount: numAmount,
      originalAmount: numAmount,
      currency,
      dueDate: customDueDate.trim(),
      expectedDuration: 'custom',
      purpose: purpose.trim() || 'انفرادی قرضہ کھاتہ',
      agreedTerms: agreedTerms.trim(),
      receiptNo,
      totalRepaid: 0,
      remainingBalance: numAmount,
      status: 'Outstanding',
      repayments: [],
      notes: notes.trim()
    };

    const saved = saveLoan(newLoan);
    onClose();

    if (printImmediately) {
      openReceipt({
        format: 'F',
        loan: saved
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
      dir={language === 'ur' ? 'rtl' : 'ltr'}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full my-8 overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg font-urdu-heading">
                نیا قرضہ کھاتہ درج کریں (درہم AED یا پاکستانی روپے PKR)
              </h3>
              <p className="text-[11px] text-slate-400 font-urdu-body">
                قرض کی رقم، کرنسی، قرض کی تاریخ اور واپسی کی تاریخ (اختیاری) درج کریں
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs sm:text-sm max-h-[76vh] overflow-y-auto">
          {/* Currency Selection Bar: PKR or AED */}
          <div className="bg-emerald-50/80 border-2 border-emerald-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5 font-urdu-heading">
                <Coins className="w-4 h-4 text-emerald-700" />
                <span>قرض کی کرنسی منتخب کریں (PKR پاکستانی روپے یا AED درہم):</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrency('PKR')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition border cursor-pointer ${
                    currency === 'PKR'
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50'
                  }`}
                >
                  🇵🇰 PKR (پاکستانی روپے)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('AED')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition border cursor-pointer ${
                    currency === 'AED'
                      ? 'bg-blue-700 text-white border-blue-800 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-blue-50'
                  }`}
                >
                  🇦🇪 AED (اماراتی درہم)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-800 block mb-1 font-urdu-heading">
                  {`قرض کی رقم (${currency === 'PKR' ? 'پاکستانی روپے PKR' : 'اماراتی درہم AED'}) *`}
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder=""
                  className="w-full bg-white border-2 border-emerald-500 rounded-xl p-2.5 font-mono text-base sm:text-lg font-black text-slate-950 outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1 font-urdu-body">
                  کرنسی (Currency)
                </label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value as Currency)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-extrabold text-slate-950 cursor-pointer"
                >
                  <option value="PKR">PKR (پاکستانی روپے)</option>
                  <option value="AED">AED (اماراتی درہم)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Borrower Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 font-urdu-body">
                قرض لینے والے کا نام (Borrower Name) *
              </label>
              <input
                type="text"
                value={borrowerName}
                onChange={e => setBorrowerName(e.target.value)}
                placeholder="قرض لینے والے کا نام (Borrower Name)"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-950 font-urdu-body"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 font-urdu-body">
                فون نمبر (Phone Number)
              </label>
              <input
                type="text"
                value={borrowerPhone}
                onChange={e => setBorrowerPhone(e.target.value)}
                placeholder="فون نمبر (Phone Number)"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-mono text-slate-950"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1 font-urdu-body">
              پتہ / شہر (Address / City)
            </label>
            <input
              type="text"
              value={borrowerAddress}
              onChange={e => setBorrowerAddress(e.target.value)}
              placeholder="پتہ / شہر (Address / City)"
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm text-slate-950 font-urdu-body"
            />
          </div>

          {/* Custom Loan Issue Date & Optional Custom Return Date */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1 mb-1 font-urdu-heading">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  <span>قرض لینے کی تاریخ (Loan Date) *</span>
                </label>
                <input
                  type="date"
                  value={loanDate}
                  onChange={e => setLoanDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-sm font-mono font-bold text-slate-950"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-extrabold text-amber-950 flex items-center gap-1 font-urdu-heading">
                    <Calendar className="w-3.5 h-3.5 text-amber-700" />
                    <span>واپسی کی تاریخ (اختیاری / Optional Return Date)</span>
                  </label>
                  {customDueDate && (
                    <button
                      type="button"
                      onClick={() => setCustomDueDate('')}
                      className="text-[11px] font-bold text-rose-600 hover:underline font-urdu-body cursor-pointer"
                    >
                      ختم کریں (Clear)
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  value={customDueDate}
                  onChange={e => setCustomDueDate(e.target.value)}
                  className="w-full bg-white border border-amber-400 rounded-xl p-2 text-sm font-mono font-bold text-slate-950"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 font-urdu-body">
                قرض کا مقصد / تفصیل (Purpose)
              </label>
              <input
                type="text"
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                placeholder="قرض کا مقصد / تفصیل (Purpose)"
                className="w-full bg-white border border-slate-300 rounded-xl p-2 text-sm font-urdu-body"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 font-urdu-body">
                طے شدہ شرائط / نوٹس (Terms / Notes)
              </label>
              <input
                type="text"
                value={agreedTerms}
                onChange={e => setAgreedTerms(e.target.value)}
                placeholder="طے شدہ شرائط / نوٹس (Terms / Notes)"
                className="w-full bg-white border border-slate-300 rounded-xl p-2 text-sm font-urdu-body"
              />
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="bg-slate-50 px-6 py-4 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            disabled={!borrowerName.trim() || numAmount <= 0}
            onClick={() => handleSubmit(false)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{t('save')}</span>
          </button>
          <button
            type="button"
            disabled={!borrowerName.trim() || numAmount <= 0}
            onClick={() => handleSubmit(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{language === 'ur' ? 'محفوظ کریں اور پرنٹ واؤچر' : 'Save & Print Statement'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
