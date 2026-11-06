/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MoneyTransfer, Payout, PaymentMethod } from '../../types';
import { X, HandCoins, AlertCircle } from 'lucide-react';

interface RecordPayoutModalProps {
  transfer: MoneyTransfer | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RecordPayoutModal: React.FC<RecordPayoutModalProps> = ({
  transfer,
  isOpen,
  onClose
}) => {
  const { recordPayout, openReceipt, stations, settings, t, language, formatMoney } = useApp();

  const [payoutDate, setPayoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [payoutCurrency, setPayoutCurrency] = useState<'PKR' | 'AED'>('PKR');
  const [payoutAmount, setPayoutAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedStation, setSelectedStation] = useState(transfer?.station || '');

  if (!isOpen || !transfer) return null;

  const rate = transfer.exchangeRate || settings.defaultExchangeRate || 77.50;
  const maxPayable = transfer.remainingBalancePKR;
  const rawInput = typeof payoutAmount === 'number' ? payoutAmount : Number(payoutAmount) || 0;
  const numPayout = payoutCurrency === 'AED' ? Math.round(rawInput * rate) : rawInput;
  const isOverpaying = numPayout > maxPayable;

  const handleSubmit = (printImmediately: boolean) => {
    if (numPayout <= 0 || isOverpaying) return;

    const receiptNo = `PAY-${transfer.orderNumber}-${Math.floor(100 + Math.random() * 900)}`;

    const payout: Payout = {
      id: `pay-${Date.now()}`,
      transferId: transfer.id,
      date: payoutDate || new Date().toISOString().split('T')[0],
      receiverName: transfer.receiverName,
      amountPKR: numPayout,
      paymentMethod,
      referenceNo,
      station: selectedStation || transfer.station,
      receiptNo,
      notes
    };

    recordPayout(transfer.id, payout);
    onClose();

    if (printImmediately) {
      openReceipt({
        format: 'D',
        transfer,
        payout
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full my-8 overflow-hidden flex flex-col border border-slate-200">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-lg font-urdu-heading">{t('recordPayout')}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-sm">
          {/* Order Details summary */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">{t('orderNumber')}:</span>
              <strong className="font-mono">{transfer.orderNumber}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('receiverName')}:</span>
              <strong>{transfer.receiverName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('station')}:</span>
              <strong className="text-blue-700">{transfer.station}</strong>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5">
              <span className="text-slate-500">{t('netPayablePkr')}:</span>
              <span className="font-mono">{formatMoney(transfer.netPayablePKR, 'PKR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('amountPaidPkr')}:</span>
              <span className="font-mono text-emerald-700">{formatMoney(transfer.amountPaidPKR, 'PKR')}</span>
            </div>
            <div className="flex justify-between font-bold text-red-600 text-base">
              <span>{t('remainingBalancePkr')}:</span>
              <span className="font-mono">{formatMoney(maxPayable, 'PKR')}</span>
            </div>
          </div>

          {/* Custom Date & Currency Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {language === 'ur' ? 'ادائیگی کی تاریخ (Custom Date)' : 'Payout Date (Custom Date)'}
              </label>
              <input
                type="date"
                value={payoutDate}
                onChange={e => setPayoutDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {language === 'ur' ? 'کرنسی منتخب کریں (Currency)' : 'Select Currency'}
              </label>
              <select
                value={payoutCurrency}
                onChange={e => setPayoutCurrency(e.target.value as 'PKR' | 'AED')}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-bold"
              >
                <option value="PKR">PKR (پاکستانی روپے)</option>
                <option value="AED">AED (درہم)</option>
              </select>
            </div>
          </div>

          {/* Form */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                {t('payoutAmount')} ({payoutCurrency}) *
              </label>
              <button
                type="button"
                onClick={() =>
                  setPayoutAmount(
                    payoutCurrency === 'PKR'
                      ? maxPayable
                      : Number((maxPayable / rate).toFixed(2))
                  )
                }
                className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                {language === 'ur' ? 'مکمل بقایا رقم درج کریں' : 'Fill Full Remaining'}
              </button>
            </div>
            <input
              type="number"
              min="1"
              step="any"
              value={payoutAmount}
              onChange={e => setPayoutAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder={language === 'ur' ? 'ادائیگی کی رقم' : 'Payout Amount'}
              className={`w-full bg-white border rounded-lg p-2.5 font-mono text-base font-bold ${
                isOverpaying ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'
              }`}
            />
            {payoutCurrency === 'AED' && rawInput > 0 && (
              <p className="text-xs font-mono font-bold text-emerald-700 mt-1">
                = {formatMoney(numPayout, 'PKR')} (@ {rate.toFixed(2)})
              </p>
            )}
            {isOverpaying && (
              <div className="flex items-center gap-1 text-red-600 text-xs mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>
                  {language === 'ur'
                    ? 'ادائیگی کی رقم کل واجب الادا بقایا سے زیادہ نہیں ہو سکتی!'
                    : 'Payout cannot exceed the remaining balance!'}
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
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-urdu-body font-bold"
            >
              <option value="Cash">{language === 'ur' ? 'نقد کیش کاؤنٹر (Cash Desk)' : 'Cash'}</option>
              <option value="EasyPaisa">EasyPaisa (ایزی پیسہ)</option>
              <option value="JazzCash">JazzCash (جیز کیش)</option>
              <option value="NayaPay">NayaPay (نیا پیسہ)</option>
              <option value="SadaPay">SadaPay (سدا پیسہ)</option>
              <option value="Raast">Raast ID (راست)</option>
              <option value="Bank Transfer">{language === 'ur' ? 'بینک ٹرانسفر (Bank Transfer)' : 'Bank Transfer'}</option>
              <option value="Hawala / Station Counter">{language === 'ur' ? 'حوالہ / اسٹیشن کاؤنٹر' : 'Hawala / Station Counter'}</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1 font-urdu-heading">
              {language === 'ur' ? 'ادائیگی کا کاؤنٹر / اسٹیشن' : 'Payout Station / Counter'}
            </label>
            <select
              value={selectedStation || transfer.station}
              onChange={e => setSelectedStation(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-urdu-body font-bold"
            >
              {stations.map(st => (
                <option key={st.id} value={st.nameUr}>
                  {st.nameUr || st.nameEn} - {language === 'ur' ? 'کیش بیلنس:' : 'Balance:'} {formatMoney(st.currentBalancePKR || 0, 'PKR')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600 block mb-1">
              {t('referenceNumber')}
            </label>
            <input
              type="text"
              value={referenceNo}
              onChange={e => setReferenceNo(e.target.value)}
              placeholder={language === 'ur' ? 'ریفرنس نمبر' : 'Reference Number'}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 block mb-1">{t('notes')}</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={language === 'ur' ? 'نوٹس' : 'Notes'}
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
            disabled={isOverpaying || numPayout <= 0}
            onClick={() => handleSubmit(false)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-lg text-xs sm:text-sm font-semibold transition"
          >
            {t('save')}
          </button>
          <button
            type="button"
            disabled={isOverpaying || numPayout <= 0}
            onClick={() => handleSubmit(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs sm:text-sm font-semibold transition"
          >
            {language === 'ur' ? 'محفوظ و پرنٹ سلپ' : 'Save & Print Slip'}
          </button>
        </div>
      </div>
    </div>
  );
};
