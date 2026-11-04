/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Loan, Currency } from '../../types';
import { X, BookOpen } from 'lucide-react';

interface NewLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewLoanModal: React.FC<NewLoanModalProps> = ({ isOpen, onClose }) => {
  const { saveLoan, openReceipt, t, language, settings } = useApp();

  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [borrowerAddress, setBorrowerAddress] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState<Currency>('PKR');
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState<'1_month' | '3_months' | '6_months' | 'custom'>('3_months');
  const [customDueDate, setCustomDueDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [agreedTerms, setAgreedTerms] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const numAmount = typeof amount === 'number' ? amount : Number(amount) || 0;

  // Calculate default due date based on duration
  const calculateDueDate = (): string => {
    if (duration === 'custom' && customDueDate) return customDueDate;
    const d = new Date(loanDate);
    if (duration === '1_month') d.setMonth(d.getMonth() + 1);
    else if (duration === '3_months') d.setMonth(d.getMonth() + 3);
    else if (duration === '6_months') d.setMonth(d.getMonth() + 6);
    return d.toISOString().split('T')[0];
  };

  const handleSubmit = (printImmediately: boolean) => {
    const numAmount = typeof amount === 'number' ? amount : Number(amount) || 0;
    if (!borrowerName.trim() || numAmount <= 0) return;

    const dueDate = calculateDueDate();
    const loanNo = `LN-2026-${Math.floor(100 + Math.random() * 900)}`;
    const receiptNo = `LN-REC-${Math.floor(1000 + Math.random() * 9000)}`;

    const newLoan: Loan = {
      id: `loan-${Date.now()}`,
      loanNo,
      borrowerName: borrowerName.trim(),
      borrowerPhone: borrowerPhone.trim() || '+971500000000',
      borrowerAddress: borrowerAddress.trim(),
      loanDate,
      originalAmount: numAmount,
      currency,
      dueDate,
      expectedDuration: duration,
      purpose,
      agreedTerms,
      receiptNo,
      totalRepaid: 0,
      remainingBalance: numAmount,
      status: 'Outstanding',
      repayments: [],
      notes
    };

    saveLoan(newLoan);
    onClose();

    if (printImmediately) {
      openReceipt({
        format: 'F',
        loan: newLoan
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full my-8 overflow-hidden flex flex-col border border-slate-200">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-slate-300" />
            <h3 className="font-semibold text-lg font-urdu-heading">{t('recordLoan')}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-sm max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {t('borrowerName')} *
              </label>
              <input
                type="text"
                value={borrowerName}
                onChange={e => setBorrowerName(e.target.value)}
                placeholder={t('borrowerName')}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {t('borrowerPhone')}
              </label>
              <input
                type="text"
                value={borrowerPhone}
                onChange={e => setBorrowerPhone(e.target.value)}
                placeholder={t('borrowerPhone')}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-600 block mb-1">{t('borrowerAddress')}</label>
            <input
              type="text"
              value={borrowerAddress}
              onChange={e => setBorrowerAddress(e.target.value)}
              placeholder={t('borrowerAddress')}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {t('originalAmount')} *
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder={t('originalAmount')}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 font-mono text-base font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {t('currency')}
              </label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value as Currency)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-semibold"
              >
                <option value="PKR">PKR (پاکستانی روپے)</option>
                <option value="AED">AED (درہم)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {t('loanDate')}
              </label>
              <input
                type="date"
                value={loanDate}
                onChange={e => setLoanDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {t('expectedDuration')}
              </label>
              <select
                value={duration}
                onChange={e => setDuration(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm"
              >
                <option value="1_month">{t('duration1Month')}</option>
                <option value="3_months">{t('duration3Months')}</option>
                <option value="6_months">{t('duration6Months')}</option>
                <option value="custom">{t('durationCustom')}</option>
              </select>
            </div>
          </div>

          {duration === 'custom' && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">{t('dueDate')}</label>
              <input
                type="date"
                value={customDueDate}
                onChange={e => setCustomDueDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-slate-600 block mb-1">{t('purpose')}</label>
            <input
              type="text"
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              placeholder={t('purpose')}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 block mb-1">{t('agreedTerms')}</label>
            <input
              type="text"
              value={agreedTerms}
              onChange={e => setAgreedTerms(e.target.value)}
              placeholder={t('agreedTerms')}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm"
            />
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-4 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            disabled={!borrowerName.trim() || numAmount <= 0}
            onClick={() => handleSubmit(false)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs sm:text-sm font-semibold transition shadow-sm"
          >
            {t('save')}
          </button>
          <button
            type="button"
            disabled={!borrowerName.trim() || numAmount <= 0}
            onClick={() => handleSubmit(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs sm:text-sm font-semibold transition shadow-sm"
          >
            {language === 'ur' ? 'محفوظ و پرنٹ واؤچر' : 'Save & Print Voucher'}
          </button>
        </div>
      </div>
    </div>
  );
};
