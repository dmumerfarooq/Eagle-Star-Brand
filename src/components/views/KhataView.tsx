/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Loan, LoanRepayment, Currency } from '../../types';
import { EagleStarLogo } from '../common/EagleStarLogo';
import {
  Plus,
  Search,
  Receipt,
  Trash2,
  Calendar,
  Printer,
  Edit3,
  RotateCcw,
  X,
  Save,
  History
} from 'lucide-react';

interface KhataViewProps {
  onOpenNewLoan: () => void;
  onRecordRepayment: (loan: Loan) => void;
}

export const KhataView: React.FC<KhataViewProps> = ({
  onOpenNewLoan,
  onRecordRepayment
}) => {
  const {
    loans,
    saveLoan,
    deleteLoan,
    updateLoanRepayment,
    deleteLoanRepayment,
    openReceipt,
    t,
    language,
    formatMoney,
    isSuperAdmin,
    canManageKhata,
    canDeleteRecords
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<'all' | 'PKR' | 'AED'>('all');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | '7days' | 'month' | 'custom'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteRepaymentId, setConfirmDeleteRepaymentId] = useState<string | null>(null);

  // Edit Loan & Repayment History Modal State
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const editingLoan = useMemo(
    () => loans.find(l => l.id === editingLoanId) || null,
    [loans, editingLoanId]
  );

  const [editBorrowerName, setEditBorrowerName] = useState('');
  const [editBorrowerPhone, setEditBorrowerPhone] = useState('');
  const [editLoanDate, setEditLoanDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editOriginalAmount, setEditOriginalAmount] = useState('');
  const [editCurrency, setEditCurrency] = useState<Currency>('PKR');
  const [editPurpose, setEditPurpose] = useState('');

  // Inline repayment edit state inside the modal
  const [editingRepaymentId, setEditingRepaymentId] = useState<string | null>(null);
  const [repEditDate, setRepEditDate] = useState('');
  const [repEditType, setRepEditType] = useState<'repayment' | 'additional_loan'>('repayment');
  const [repEditAmount, setRepEditAmount] = useState('');
  const [repEditNotes, setRepEditNotes] = useState('');

  const openEditLoanModal = (loan: Loan) => {
    setEditingLoanId(loan.id);
    setEditBorrowerName(loan.borrowerName);
    setEditBorrowerPhone(loan.borrowerPhone);
    setEditLoanDate(loan.loanDate);
    setEditDueDate(loan.dueDate);
    setEditOriginalAmount(String(loan.originalAmount));
    setEditCurrency(loan.currency);
    setEditPurpose(loan.purpose || '');
    setEditingRepaymentId(null);
    setConfirmDeleteRepaymentId(null);
  };

  const handleSaveLoanDetails = () => {
    if (!editingLoan) return;
    const origAmt = Math.max(0, Number(editOriginalAmount) || 0);
    const sumAdditional = (editingLoan.repayments || [])
      .filter(r => r.entryType === 'additional_loan')
      .reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const updatedInitialAmount = Math.max(0, origAmt - sumAdditional);
    const updated: Loan = {
      ...editingLoan,
      borrowerName: editBorrowerName.trim() || editingLoan.borrowerName,
      borrowerPhone: editBorrowerPhone.trim() || editingLoan.borrowerPhone,
      loanDate: editLoanDate || editingLoan.loanDate,
      dueDate: editDueDate.trim(),
      initialAmount: updatedInitialAmount,
      originalAmount: origAmt,
      currency: editCurrency,
      purpose: editPurpose.trim()
    };
    saveLoan(updated);
    setEditingLoanId(null);
  };

  const startEditRepayment = (rep: LoanRepayment) => {
    setEditingRepaymentId(rep.id);
    setRepEditDate(rep.date);
    setRepEditType(rep.entryType || 'repayment');
    setRepEditAmount(String(rep.amount));
    setRepEditNotes(rep.notes || '');
  };

  const saveEditedRepayment = (rep: LoanRepayment) => {
    if (!editingLoan) return;
    const amt = Math.max(0, Number(repEditAmount) || 0);
    updateLoanRepayment(editingLoan.id, rep.id, {
      date: repEditDate || rep.date,
      entryType: repEditType,
      amount: amt,
      notes: repEditNotes.trim()
    });
    setEditingRepaymentId(null);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredLoans = loans.filter(l => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (currencyFilter !== 'all' && l.currency !== currencyFilter) return false;

    const lDate = (l.loanDate || '').slice(0, 10);
    if (datePreset === 'today' && lDate !== todayStr) return false;
    if (datePreset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const minDate = d.toISOString().split('T')[0];
      if (lDate < minDate) return false;
    }
    if (datePreset === 'month') {
      const monthPrefix = todayStr.slice(0, 7);
      if (!lDate.startsWith(monthPrefix)) return false;
    }
    if (datePreset === 'custom') {
      if (dateFrom && lDate < dateFrom) return false;
      if (dateTo && lDate > dateTo) return false;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = l.borrowerName.toLowerCase().includes(term);
      const matchPhone = l.borrowerPhone.includes(term);
      const matchNo = l.loanNo.toLowerCase().includes(term);
      const matchPurpose = (l.purpose || '').toLowerCase().includes(term);
      if (!matchName && !matchPhone && !matchNo && !matchPurpose) return false;
    }
    return true;
  });

  const totalLent = filteredLoans.reduce((s, l) => s + l.originalAmount, 0);
  const totalRepaid = filteredLoans.reduce((s, l) => s + l.totalRepaid, 0);
  const totalOutstanding = filteredLoans.reduce((s, l) => s + Math.max(0, l.remainingBalance), 0);
  const totalExtraCredit = filteredLoans.reduce(
    (s, l) => s + (l.remainingBalance < 0 ? Math.abs(l.remainingBalance) : 0),
    0
  );

  const handleDelete = (id: string) => {
    if (!isSuperAdmin) return;
    if (confirmDeleteId === id) {
      deleteLoan(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCurrencyFilter('all');
    setDatePreset('all');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <EagleStarLogo variant="icon" size="md" isDarkBackground={false} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 font-urdu-heading">
                {t('khata')}
              </h1>
              <span className="text-xs bg-slate-200 text-slate-950 border border-slate-300 font-bold px-2.5 py-0.5 rounded-full font-mono">
                {filteredLoans.length} {language === 'ur' ? 'کھاتے' : 'Loans'}
              </span>
            </div>
            <p className="text-xs text-slate-700 font-medium mt-0.5">
              {language === 'ur'
                ? 'لوگوں کو دیے گئے قرضے، واپسی کی اقساط، بقایا جات اور مقررہ تاریخوں کا انتظام'
                : 'Record borrowed money, installment repayments, outstanding balances, and due dates'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() =>
              openReceipt({
                format: 'H',
                batchLoans: filteredLoans,
                reportTitle: language === 'ur' ? 'ادھار و قرضہ کھاتہ رجسٹر شیٹ' : 'Khata Loan Register Sheet'
              })
            }
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span className="font-urdu-heading">{language === 'ur' ? 'پرنٹ ادھار رجسٹر' : 'Print Register'}</span>
          </button>
          <button
            onClick={onOpenNewLoan}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="font-urdu-heading">{t('recordLoan')}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards with Gradients & High Contrast */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-b from-slate-50 via-white to-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs text-slate-800 font-bold block uppercase tracking-wider">{t('totalLent')}</span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-950">
            {formatMoney(totalLent, 'PKR')}
          </div>
          <span className="text-xs text-slate-800 font-bold block font-mono">
            {filteredLoans.length} {language === 'ur' ? 'کل قرضے' : 'Filtered Loans'}
          </span>
        </div>

        <div className="bg-gradient-to-b from-emerald-50/70 via-white to-white p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-2">
          <span className="text-xs text-emerald-950 font-bold block uppercase tracking-wider">{t('totalRepayments')}</span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-950">
            {formatMoney(totalRepaid, 'PKR')}
          </div>
          <span className="text-xs text-emerald-900 font-bold block">
            {language === 'ur' ? 'حاصل شدہ واپسی اقساط' : 'Recovered Amount'}
          </span>
        </div>

        <div className="bg-gradient-to-b from-rose-50/70 via-white to-white p-5 rounded-2xl border border-rose-200 shadow-sm space-y-2">
          <span className="text-xs text-rose-950 font-bold block uppercase tracking-wider">{t('outstandingLoans')}</span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-rose-950">
            {formatMoney(totalOutstanding, 'PKR')}
          </div>
          <span className="text-xs text-rose-900 font-bold block">
            {totalExtraCredit > 0
              ? language === 'ur'
                ? `واجب الوصول بقایا | اضافی جمع (کریڈٹ): +${totalExtraCredit.toLocaleString()}`
                : `Receivable | Extra Credit Held: +${totalExtraCredit.toLocaleString()}`
              : language === 'ur'
              ? 'واجب الوصول بقایا رقم'
              : 'Net Receivable Balance'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs sm:text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[260px] relative">
            <Search className="w-4 h-4 text-slate-600 absolute left-3 top-2.5 rtl:right-3 rtl:left-auto" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={language === 'ur' ? 'قرض دار کا نام، فون یا قرض نمبر تلاش کریں...' : 'Search borrower name, phone, or loan no...'}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 rtl:pr-9 rtl:pl-3 text-xs sm:text-sm text-slate-950 font-medium placeholder:text-slate-600 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-950 font-bold rounded-xl px-3 py-2 text-xs focus:bg-white"
            >
              <option value="all">{t('all')} {t('status')}</option>
              <option value="Outstanding">{t('statusOutstanding')}</option>
              <option value="Credit Balance">{t('statusCreditBalance')}</option>
              <option value="Fully Repaid">{t('statusFullyRepaid')}</option>
              <option value="Overdue">{t('statusOverdue')}</option>
            </select>

            <select
              value={currencyFilter}
              onChange={e => setCurrencyFilter(e.target.value as 'all' | 'PKR' | 'AED')}
              className="bg-slate-50 border border-slate-300 text-slate-950 font-bold rounded-xl px-3 py-2 text-xs focus:bg-white"
            >
              <option value="all">{language === 'ur' ? 'تمام کرنسیاں' : 'All Currencies'}</option>
              <option value="PKR">PKR (پاکستانی روپیہ)</option>
              <option value="AED">AED (اماراتی درہم)</option>
            </select>
          </div>
        </div>

        {/* Date Filter Presets */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: language === 'ur' ? 'تمام تاریخیں' : 'All Dates' },
                { id: 'today', label: language === 'ur' ? 'آج' : 'Today' },
                { id: '7days', label: language === 'ur' ? '7 دن' : '7 Days' },
                { id: 'month', label: language === 'ur' ? 'اس ماہ' : 'This Month' },
                { id: 'custom', label: language === 'ur' ? 'مخصوص تاریخ' : 'Custom Date' }
              ] as const
            ).map(preset => (
              <button
                key={preset.id}
                onClick={() => setDatePreset(preset.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  datePreset === preset.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}

            {datePreset === 'custom' && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 px-2.5 py-1 rounded-lg">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="bg-transparent text-xs font-mono text-slate-900 focus:outline-none"
                />
                <span className="text-slate-400">→</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="bg-transparent text-xs font-mono text-slate-900 focus:outline-none"
                />
              </div>
            )}
          </div>

          {(searchTerm || statusFilter !== 'all' || currencyFilter !== 'all' || datePreset !== 'all') && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg border border-rose-200 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{language === 'ur' ? 'ری سیٹ' : 'Reset'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b-2 border-slate-300 text-slate-900 font-bold font-urdu-body">
                <th className="py-3 px-4 text-start">{t('loanNo')}</th>
                <th className="py-3 px-4 text-start">{t('borrower')}</th>
                <th className="py-3 px-4 text-start">{t('loanDate')}</th>
                <th className="py-3 px-4 text-start">{t('dueDate')}</th>
                <th className="py-3 px-4 text-start">{t('originalAmount')}</th>
                <th className="py-3 px-4 text-start">{t('totalRepaid')}</th>
                <th className="py-3 px-4 text-start">{t('remainingBalance')}</th>
                <th className="py-3 px-4 text-start">{t('status')}</th>
                <th className="py-3 px-4 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-700 font-bold">
                    {t('noRecordsFound')}
                  </td>
                </tr>
              ) : (
                filteredLoans.map(loan => (
                  <tr key={loan.id} className="hover:bg-emerald-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-950">
                      {loan.loanNo}
                      {loan.repayments.length > 0 && (
                        <span className="block text-[10px] text-emerald-800 font-sans font-semibold">
                          {loan.repayments.length} {language === 'ur' ? 'اقساط' : 'repayments'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-950 block">{loan.borrowerName}</span>
                      <span className="text-[11px] text-slate-700 font-mono font-semibold block">{loan.borrowerPhone}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium font-mono">
                      {loan.loanDate}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`font-mono font-bold ${
                        loan.status === 'Overdue' ? 'text-red-700 font-black' : 'text-slate-800'
                      }`}>
                        {loan.dueDate || '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-slate-950">
                      {formatMoney(loan.originalAmount, loan.currency)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-emerald-900">
                      {formatMoney(loan.totalRepaid, loan.currency)}
                    </td>
                    <td
                      className={`py-3.5 px-4 font-mono font-black ${
                        loan.remainingBalance < 0
                          ? 'text-emerald-700'
                          : loan.remainingBalance === 0
                          ? 'text-slate-700'
                          : 'text-rose-900'
                      }`}
                    >
                      {loan.remainingBalance < 0 ? (
                        <>
                          +{formatMoney(Math.abs(loan.remainingBalance), loan.currency)}
                          <span className="block text-[10px] font-bold font-urdu-body text-emerald-800">
                            {language === 'ur' ? 'اضافی جمع (کریڈٹ)' : 'Extra Deposit Credit'}
                          </span>
                        </>
                      ) : (
                        formatMoney(loan.remainingBalance, loan.currency)
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold font-urdu-heading ${
                          loan.status === 'Credit Balance'
                            ? 'bg-teal-100 text-teal-950 border border-teal-300'
                            : loan.status === 'Fully Repaid'
                            ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                            : loan.status === 'Overdue'
                            ? 'bg-rose-100 text-rose-950 border border-rose-300'
                            : loan.status === 'Partially Repaid'
                            ? 'bg-slate-200 text-slate-950 border border-slate-400'
                            : 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                        }`}
                      >
                        {t(loan.status)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openReceipt({ format: 'K', loan })}
                          className="p-1.5 text-slate-800 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title={language === 'ur' ? 'مکمل کھاتہ اسٹیٹمنٹ پرنٹ کریں' : 'Print Individual Statement'}
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openReceipt({ format: 'A', loan })}
                          className="p-1.5 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          title={t('printReceipt')}
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                        {canManageKhata && (
                          <button
                            onClick={() => openEditLoanModal(loan)}
                            className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            title={language === 'ur' ? 'ترمیم اور واپسی ہسٹری' : 'Edit Loan & Repayments History'}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onRecordRepayment(loan)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                          title={t('recordRepayment')}
                        >
                          {language === 'ur' ? 'واپسی / مزید قرض' : 'Return / Take'}
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleDelete(loan.id)}
                            className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                              confirmDeleteId === loan.id
                                ? 'bg-red-600 text-white px-2 text-[11px] font-bold'
                                : 'text-slate-500 hover:text-red-700 hover:bg-red-50'
                            }`}
                            title={t('delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                            {confirmDeleteId === loan.id && (
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

      {/* Edit Loan & Repayment History Modal */}
      {editingLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-8">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-emerald-400 font-bold block">{editingLoan.loanNo}</span>
                <h3 className="text-base sm:text-lg font-extrabold font-urdu-heading">
                  {language === 'ur' ? 'قرضہ کھاتہ اور واپسی ہسٹری میں ترمیم' : 'Edit Khata Loan & Repayment History'}
                </h3>
              </div>
              <button
                onClick={() => setEditingLoanId(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
              {/* Loan Details Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ur' ? 'قرض دار کا نام' : 'Borrower Name'} *
                  </label>
                  <input
                    type="text"
                    value={editBorrowerName}
                    onChange={e => setEditBorrowerName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ur' ? 'فون نمبر' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    value={editBorrowerPhone}
                    onChange={e => setEditBorrowerPhone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ur' ? 'اصل رقم قرض' : 'Original Loan Amount'} *
                  </label>
                  <input
                    type="number"
                    value={editOriginalAmount}
                    onChange={e => setEditOriginalAmount(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ur' ? 'کرنسی' : 'Currency'}
                  </label>
                  <select
                    value={editCurrency}
                    onChange={e => setEditCurrency(e.target.value as Currency)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-bold text-slate-900"
                  >
                    <option value="PKR">PKR (پاکستانی روپیہ)</option>
                    <option value="AED">AED (اماراتی درہم)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ur' ? 'تاریخ اجرا' : 'Loan Date'}
                  </label>
                  <input
                    type="date"
                    value={editLoanDate}
                    onChange={e => setEditLoanDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">
                      {language === 'ur' ? 'واپسی کی تاریخ (اختیاری)' : 'Return Date (Optional)'}
                    </label>
                    {editDueDate && (
                      <button
                        type="button"
                        onClick={() => setEditDueDate('')}
                        className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        {language === 'ur' ? 'ختم کریں' : 'Clear'}
                      </button>
                    )}
                  </div>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={e => setEditDueDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ur' ? 'تفصیل / مقصد' : 'Purpose / Notes'}
                  </label>
                  <input
                    type="text"
                    value={editPurpose}
                    onChange={e => setEditPurpose(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              {/* Repayment History Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-700" />
                    <span>
                      {language === 'ur'
                        ? `اقساط و واپسی کی ہسٹری (${editingLoan.repayments.length})`
                        : `Repayment History (${editingLoan.repayments.length})`}
                    </span>
                  </h4>
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                    {language === 'ur' ? 'کل وصول شدہ:' : 'Total Repaid:'}{' '}
                    {formatMoney(editingLoan.totalRepaid, editingLoan.currency)}
                  </span>
                </div>

                {editingLoan.repayments.length === 0 ? (
                  <div className="p-4 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 font-medium">
                    {language === 'ur' ? 'ابھی تک کوئی واپسی قسط درج نہیں ہوئی' : 'No repayments recorded yet'}
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
                    {editingLoan.repayments.map(rep => {
                      const isEditingThis = editingRepaymentId === rep.id;
                      return (
                        <div key={rep.id} className="p-3 bg-white hover:bg-slate-50 transition">
                          {isEditingThis ? (
                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                                  {t('date')}
                                </label>
                                <input
                                  type="date"
                                  value={repEditDate}
                                  onChange={e => setRepEditDate(e.target.value)}
                                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                                  {language === 'ur' ? 'قسم' : 'Type'}
                                </label>
                                <select
                                  value={repEditType}
                                  onChange={e =>
                                    setRepEditType(e.target.value as 'repayment' | 'additional_loan')
                                  }
                                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                                >
                                  <option value="repayment">
                                    {language === 'ur' ? '- واپسی / جمع' : '- Return / Deposit'}
                                  </option>
                                  <option value="additional_loan">
                                    {language === 'ur' ? '+ مزید قرض' : '+ Take More'}
                                  </option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                                  {t('amount')} ({editingLoan.currency})
                                </label>
                                <input
                                  type="number"
                                  value={repEditAmount}
                                  onChange={e => setRepEditAmount(e.target.value)}
                                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                                  {t('notes')}
                                </label>
                                <input
                                  type="text"
                                  value={repEditNotes}
                                  onChange={e => setRepEditNotes(e.target.value)}
                                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                                />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => saveEditedRepayment(rep)}
                                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded text-xs font-bold cursor-pointer"
                                >
                                  {t('save')}
                                </button>
                                <button
                                  onClick={() => setEditingRepaymentId(null)}
                                  className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-bold cursor-pointer"
                                >
                                  {t('cancel')}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-slate-900">{rep.date}</span>
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                      rep.entryType === 'additional_loan'
                                        ? 'bg-rose-100 text-rose-800'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                  >
                                    {rep.entryType === 'additional_loan'
                                      ? language === 'ur'
                                        ? '+ مزید قرض'
                                        : '+ Additional Loan'
                                      : language === 'ur'
                                      ? '- واپسی رقم'
                                      : '- Repayment'}
                                  </span>
                                  <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                                    {rep.paymentMethod}
                                  </span>
                                </div>
                                {rep.notes && (
                                  <p className="text-xs text-slate-600 mt-0.5">{rep.notes}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-end">
                                  <span
                                    className={`font-mono font-extrabold block ${
                                      rep.entryType === 'additional_loan'
                                        ? 'text-rose-700'
                                        : 'text-emerald-700'
                                    }`}
                                  >
                                    {rep.entryType === 'additional_loan' ? '+' : '-'}
                                    {formatMoney(rep.amount, editingLoan.currency)}
                                  </span>
                                  {rep.newBalance !== undefined && (
                                    <span
                                      className={`text-[10px] font-mono font-bold block ${
                                        rep.newBalance < 0 ? 'text-emerald-700' : 'text-slate-500'
                                      }`}
                                    >
                                      {rep.newBalance < 0
                                        ? `جمع: +${Math.abs(rep.newBalance).toLocaleString()}`
                                        : `بقایا: ${rep.newBalance.toLocaleString()}`}
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() =>
                                    openReceipt({
                                      format: 'F',
                                      loan: editingLoan,
                                      repayment: rep
                                    })
                                  }
                                  className="p-1 text-slate-700 hover:bg-slate-100 rounded transition cursor-pointer"
                                  title={language === 'ur' ? 'رسید پرنٹ کریں' : 'Print Receipt'}
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => startEditRepayment(rep)}
                                  className="p-1 text-amber-700 hover:bg-amber-50 rounded transition cursor-pointer"
                                  title={t('edit')}
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                {(isSuperAdmin || canDeleteRecords) && (
                                  <button
                                    onClick={() => {
                                      if (confirmDeleteRepaymentId === rep.id) {
                                        deleteLoanRepayment(editingLoan.id, rep.id);
                                        setConfirmDeleteRepaymentId(null);
                                      } else {
                                        setConfirmDeleteRepaymentId(rep.id);
                                      }
                                    }}
                                    className={`p-1 rounded transition cursor-pointer flex items-center gap-1 ${
                                      confirmDeleteRepaymentId === rep.id
                                        ? 'bg-red-600 text-white px-2 text-[10px] font-bold'
                                        : 'text-red-600 hover:bg-red-50'
                                    }`}
                                    title={t('delete')}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    {confirmDeleteRepaymentId === rep.id && (
                                      <span>{language === 'ur' ? 'حذف؟' : 'Confirm'}</span>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
              <div>
                {(isSuperAdmin || canDeleteRecords) && (
                  <button
                    onClick={() => {
                      deleteLoan(editingLoan.id);
                      setEditingLoanId(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{language === 'ur' ? 'مکمل قرض کھاتہ حذف کریں' : 'Delete Entire Loan'}</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openReceipt({ format: 'K', loan: editingLoan })}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === 'ur' ? 'اسٹیٹمنٹ پرنٹ' : 'Print Statement'}</span>
                </button>
                <button
                  onClick={() => setEditingLoanId(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleSaveLoanDetails}
                  className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{language === 'ur' ? 'تبدیلیاں محفوظ کریں' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
