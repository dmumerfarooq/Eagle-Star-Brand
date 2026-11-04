/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Loan, LoanRepayment, PaymentMethod } from '../../types';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

interface RecordRepaymentModalProps {
  loan: Loan | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RecordRepaymentModal: React.FC<RecordRepaymentModalProps> = ({
  loan,
  isOpen,
  onClose
}) => {
  const { recordLoanRepayment, openReceipt, t, language, formatMoney } = useApp();

  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen || !loan) return null;

  const maxRepayable = loan.remainingBalance;
  const numAmount = typeof amount === 'number' ? amount : Number(amount) || 0;
  const isOverpaying = numAmount > maxRepayable;

  const handleSubmit = (printImmediately: boolean) => {
    if (numAmount <= 0 || isOverpaying) return;

    const receiptNo = `REP-${loan.loanNo}-${Math.floor(100 + Math.random() * 900)}`;

    const repayment: LoanRepayment = {
      id: `rep-${Date.now()}`,
      loanId: loan.id,
      date: new Date().toISOString().split('T')[0],
      amount: numAmount,
      currency: loan.currency,
      paymentMethod,
      referenceNo,
      receiptNo,
      notes
    };

    recordLoanRepayment(loan.id, repayment);
    onClose();

    if (printImmediately) {
      openReceipt({
        format: 'F',
        loan
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full my-8 overflow-hidden flex flex-col border border-slate-200">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-lg font-urdu-heading">{t('recordRepayment')}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-sm">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">{t('loanNumber')}:</span>
              <strong className="font-mono">{loan.loanNo}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('borrowerName')}:</span>
              <strong>{loan.borrowerName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('originalAmount')}:</span>
              <span className="font-mono">{formatMoney(loan.originalAmount, loan.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('totalRepaidPkr')}:</span>
              <span className="font-mono text-emerald-700">{formatMoney(loan.totalRepaid, loan.currency)}</span>
            </div>
            <div className="flex justify-between font-bold text-red-600 text-base border-t border-slate-200 pt-1.5">
              <span>{t('remainingLoanPkr')}:</span>
              <span className="font-mono">{formatMoney(maxRepayable, loan.currency)}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {t('repaymentAmount')} *
            </label>
            <input
              type="number"
              min="1"
              max={maxRepayable}
              value={amount}
              onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder={t('repaymentAmount')}
              className={`w-full bg-white border rounded-lg p-2.5 font-mono text-base font-bold ${
                isOverpaying ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'
              }`}
            />
            {isOverpaying && (
              <div className="flex items-center gap-1 text-red-600 text-xs mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>
                  {language === 'ur'
                    ? 'واپسی کی رقم باقی واجب الادا رقم سے زیادہ نہیں ہو سکتی!'
                    : 'Repayment cannot exceed the remaining balance!'}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {t('paymentMethod')}
            </label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-urdu-body"
            >
              <option value="Cash">{t('Cash')}</option>
              <option value="Bank Transfer">{t('Bank Transfer')}</option>
              <option value="EasyPaisa">{t('EasyPaisa')}</option>
              <option value="JazzCash">{t('JazzCash')}</option>
              <option value="Cheque">{t('Cheque')}</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600 block mb-1">{t('referenceNumber')}</label>
            <input
              type="text"
              value={referenceNo}
              onChange={e => setReferenceNo(e.target.value)}
              placeholder={t('referenceNumber')}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 block mb-1">{t('notes')}</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t('notes')}
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
            disabled={isOverpaying || numAmount <= 0}
            onClick={() => handleSubmit(false)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs sm:text-sm font-semibold transition"
          >
            {t('save')}
          </button>
          <button
            type="button"
            disabled={isOverpaying || numAmount <= 0}
            onClick={() => handleSubmit(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs sm:text-sm font-semibold transition"
          >
            {language === 'ur' ? 'محفوظ و پرنٹ رسید' : 'Save & Print Receipt'}
          </button>
        </div>
      </div>
    </div>
  );
};
