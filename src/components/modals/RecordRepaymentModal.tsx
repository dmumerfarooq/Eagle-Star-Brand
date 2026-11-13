import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Printer, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Loan, LoanRepayment, PaymentMethod } from '../../types';

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
  const { recordLoanRepayment, openReceipt, t, language } = useApp();

  const [entryType, setEntryType] = useState<'repayment' | 'additional_loan'>('repayment');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [receivedBy, setReceivedBy] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (loan && isOpen) {
      setDate(new Date().toISOString().split('T')[0]);
      setEntryType(loan.remainingBalance > 0 ? 'repayment' : 'additional_loan');
      setAmount('');
      setPaymentMethod('Cash');
      setReceivedBy('');
      setReferenceNo('');
      setNotes('');
    }
  }, [loan, isOpen]);

  if (!isOpen || !loan) return null;

  const parsedAmount = parseFloat(amount) || 0;

  const previewNewBalance =
    entryType === 'additional_loan'
      ? loan.remainingBalance + parsedAmount
      : loan.remainingBalance - parsedAmount;

  const handleSave = (printImmediately: boolean) => {
    if (!parsedAmount || parsedAmount <= 0) return;

    const receiptNo = `REC-${Math.floor(10000 + Math.random() * 90000)}`;
    const prevBal = loan.remainingBalance;
    const newBal =
      entryType === 'additional_loan'
        ? prevBal + parsedAmount
        : prevBal - parsedAmount;

    const newRepaymentObj: LoanRepayment = {
      id: `REP-${Date.now()}`,
      loanId: loan.id,
      receiptNo,
      date: date || new Date().toISOString().split('T')[0],
      entryType,
      amount: parsedAmount,
      currency: loan.currency,
      previousBalance: prevBal,
      newBalance: newBal,
      paymentMethod,
      receivedBy: receivedBy.trim() || undefined,
      referenceNo: referenceNo.trim() || undefined,
      notes:
        notes.trim() ||
        (entryType === 'additional_loan'
          ? 'انفرادی قرضہ کھاتہ — مزید رقم دی گئی'
          : 'انفرادی قرضہ کھاتہ — واپسی رقم وصول شدہ')
    };

    const updated = recordLoanRepayment(loan.id, newRepaymentObj);

    if (printImmediately) {
      const savedRepayment =
        updated?.repayments?.[updated.repayments.length - 1] || newRepaymentObj;
      openReceipt({
        format: 'F',
        loan: updated || {
          ...loan,
          remainingBalance: newBal,
          originalAmount:
            entryType === 'additional_loan'
              ? loan.originalAmount + parsedAmount
              : loan.originalAmount,
          totalRepaid:
            entryType === 'repayment'
              ? loan.totalRepaid + parsedAmount
              : loan.totalRepaid
        },
        repayment: savedRepayment
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden my-4">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base flex items-center gap-2 font-urdu-heading">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>انفرادی قرضہ کھاتہ — واپسی یا مزید قرض اندراج</span>
            </h2>
            <p className="text-[11px] text-emerald-300 mt-0.5 font-urdu-body">
              یہ الگ انفرادی کھاتہ ہے — اسٹیشن سے کٹوتی نہیں ہوتی اور پرنٹ میں اسٹیشن نہیں آتا
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toggle: Return Money (-) vs Take More Money (+) */}
        <div className="bg-slate-100 p-2.5 border-b border-slate-200 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setEntryType('repayment')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition font-urdu-body ${
              entryType === 'repayment'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>واپسی رقم جمع (- Return)</span>
          </button>
          <button
            type="button"
            onClick={() => setEntryType('additional_loan')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition font-urdu-body ${
              entryType === 'additional_loan'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>مزید قرض دیں (+ Give Loan)</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Loan Summary Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs font-urdu-body">
            <div className="flex justify-between">
              <span className="text-slate-500">قرض دار / کھاتہ دار:</span>
              <span className="font-bold text-slate-900">
                {loan.borrowerName} ({loan.loanNo})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">کل قرض رقم:</span>
              <span className="font-mono font-semibold text-slate-700">
                {loan.originalAmount.toLocaleString()} {loan.currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">کل واپسی وصول شدہ:</span>
              <span className="font-mono font-semibold text-emerald-600">
                {loan.totalRepaid.toLocaleString()} {loan.currency}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
              <span className="font-bold text-slate-800">
                {loan.remainingBalance < 0
                  ? 'موجودہ اضافی جمع (کریڈٹ بیلنس):'
                  : 'موجودہ بقایا قرض:'}
              </span>
              <span
                className={`font-mono font-bold ${
                  loan.remainingBalance < 0
                    ? 'text-emerald-700'
                    : loan.remainingBalance === 0
                    ? 'text-slate-700'
                    : 'text-rose-600'
                }`}
              >
                {loan.remainingBalance < 0
                  ? `+${Math.abs(loan.remainingBalance).toLocaleString()} ${loan.currency} (جمع)`
                  : `${loan.remainingBalance.toLocaleString()} ${loan.currency}`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 font-urdu-body">
                تاریخ اندراج (Entry Date) *
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 font-urdu-body">
                  {entryType === 'additional_loan'
                    ? `مزید قرض رقم (${loan.currency}) *`
                    : `واپسی رقم (${loan.currency}) *`}
                </label>
                {entryType === 'repayment' && loan.remainingBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount(String(loan.remainingBalance))}
                    className="text-[11px] font-bold text-emerald-600 hover:underline font-urdu-body"
                  >
                    مکمل بقایا
                  </button>
                )}
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={e =>
                  setAmount(e.target.value.replace(/[^0-9.]/g, ''))
                }
                placeholder=""
                className={`w-full border rounded-lg p-2.5 text-sm font-mono font-bold ${
                  entryType === 'additional_loan'
                    ? 'border-rose-400'
                    : 'border-emerald-500'
                }`}
                dir="ltr"
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 font-urdu-body">
                ادائیگی کا طریقہ (Payment Method)
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-urdu-body"
              >
                <option value="Cash">نقد کیش (Cash)</option>
                <option value="Bank Transfer">بینک ٹرانسفر (Bank Transfer)</option>
                <option value="EasyPaisa">ایزی پیسہ (EasyPaisa)</option>
                <option value="JazzCash">جاز کیش (JazzCash)</option>
                <option value="Cheque">چیک (Cheque)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 font-urdu-body">
                {entryType === 'additional_loan'
                  ? 'وصول کنندہ (Received By)'
                  : 'جمع کرانے والا (Deposited By)'}
              </label>
              <input
                type="text"
                value={receivedBy}
                onChange={e => setReceivedBy(e.target.value)}
                placeholder={
                  entryType === 'additional_loan'
                    ? 'وصول کنندہ (Received By)'
                    : 'جمع کرانے والا (Deposited By)'
                }
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-urdu-body"
              />
            </div>
          </div>

          {paymentMethod !== 'Cash' && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 font-urdu-body">
                حوالہ / بینک تفصیل (Ref / Bank Details)
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={e => setReferenceNo(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-urdu-body"
                placeholder="حوالہ / بینک تفصیل (Ref / Bank Details)"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1 font-urdu-body">
              تفصیل / نوٹس (Description / Notes)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-urdu-body"
              placeholder="تفصیل / نوٹس (Description / Notes)"
            />
          </div>

          <div
            className={`rounded-xl p-3 space-y-1.5 text-xs border font-urdu-body ${
              previewNewBalance < 0 || entryType === 'repayment'
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-rose-50 border-rose-200'
            }`}
          >
            <div className="flex justify-between items-center">
              <span
                className={`font-bold ${
                  previewNewBalance < 0
                    ? 'text-emerald-900'
                    : previewNewBalance === 0
                    ? 'text-slate-900'
                    : 'text-rose-900'
                }`}
              >
                {previewNewBalance < 0
                  ? 'اندراج کے بعد اضافی جمع (کریڈٹ بیلنس):'
                  : previewNewBalance === 0
                  ? 'اندراج کے بعد نیا کھاتہ بقایا:'
                  : 'اندراج کے بعد نیا بقایا قرض:'}
              </span>
              <span
                className={`font-mono font-bold text-base ${
                  previewNewBalance < 0
                    ? 'text-emerald-700'
                    : previewNewBalance === 0
                    ? 'text-slate-900'
                    : 'text-rose-700'
                }`}
              >
                {previewNewBalance < 0
                  ? `+${Math.abs(previewNewBalance).toLocaleString()} ${loan.currency} (جمع)`
                  : previewNewBalance === 0
                  ? `0 ${loan.currency} (بے باق)`
                  : `${previewNewBalance.toLocaleString()} ${loan.currency}`}
              </span>
            </div>
            {entryType === 'repayment' && parsedAmount > 0 && loan.remainingBalance > 0 && parsedAmount > loan.remainingBalance && (
              <p className="text-[11px] font-bold text-emerald-800">
                خودکار سیٹلمنٹ: {loan.remainingBalance.toLocaleString()} {loan.currency} قرض بے باق ہو کر باقی{' '}
                {(parsedAmount - loan.remainingBalance).toLocaleString()} {loan.currency} اضافی جمع (کریڈٹ) میں محفوظ ہو جائے گا۔
              </p>
            )}
            {entryType === 'additional_loan' && parsedAmount > 0 && loan.remainingBalance < 0 && (
              <p className="text-[11px] font-bold text-emerald-900">
                خودکار سیٹلمنٹ: سابقہ اضافی جمع ({Math.abs(loan.remainingBalance).toLocaleString()} {loan.currency}) میں سے{' '}
                {Math.min(parsedAmount, Math.abs(loan.remainingBalance)).toLocaleString()} {loan.currency} منہا ہو جائے گا۔
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 font-urdu-body">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
          >
            منسوخ کریں (Cancel)
          </button>
          <button
            type="button"
            disabled={!parsedAmount || parsedAmount <= 0}
            onClick={() => handleSave(false)}
            className={`px-4 py-2 rounded-lg disabled:opacity-50 text-white text-xs font-semibold ${
              entryType === 'additional_loan'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            محفوظ کریں (Save)
          </button>
          <button
            type="button"
            disabled={!parsedAmount || parsedAmount <= 0}
            onClick={() => handleSave(true)}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>محفوظ کریں اور رسید پرنٹ کریں</span>
          </button>
        </div>
      </div>
    </div>
  );
};
