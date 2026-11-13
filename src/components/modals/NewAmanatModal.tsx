import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  Printer,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  CheckCircle2,
  UserPlus,
  Coins
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AmanatAccount, AmanatEntry, AmanatEntryType, Currency, PaymentMethod } from '../../types';

// Normalize Urdu/Arabic numerals and remove commas/spaces so numeric inputs always parse reliably
export const normalizeNumericInput = (val: string): string => {
  if (!val) return '';
  const arabicIndicMap: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
  };
  return val
    .replace(/[٠-٩۰-۹]/g, ch => arabicIndicMap[ch] || ch)
    .replace(/,/g, '')
    .trim();
};

export const PAKISTAN_BANKS = [
  'Meezan Bank',
  'Habib Bank Limited (HBL)',
  'United Bank Limited (UBL)',
  'MCB Bank',
  'Allied Bank Limited (ABL)',
  'Bank Alfalah',
  'National Bank of Pakistan (NBP)',
  'Faysal Bank',
  'Askari Bank',
  'Bank Al Habib',
  'Standard Chartered Pakistan',
  'Soneri Bank',
  'JS Bank',
  'Bank Islami',
  'Dubai Islamic Bank Pakistan',
  'BOP (Bank of Punjab)',
  'Khyber Bank (BOK)',
  'Other Bank'
];

export const PAYOUT_METHODS: { value: PaymentMethod; labelEn: string; labelUr: string }[] = [
  { value: 'Cash', labelEn: 'Cash (Counter)', labelUr: 'نقد (کاؤنٹر کیش)' },
  { value: 'Bank Transfer', labelEn: 'Bank Account Deposit', labelUr: 'بینک اکاؤنٹ ڈپازٹ' },
  { value: 'JazzCash', labelEn: 'JazzCash Wallet', labelUr: 'جیز کیش اکاؤنٹ' },
  { value: 'EasyPaisa', labelEn: 'EasyPaisa Wallet', labelUr: 'ایزی پیسہ اکاؤنٹ' },
  { value: 'Raast', labelEn: 'Raast ID Transfer', labelUr: 'راست آئی ڈی' }
];

export type AmanatModalMode = 'new_account' | 'add_entry' | 'withdraw_entry' | 'send_transfer';

interface NewAmanatModalProps {
  existingAccount?: AmanatAccount | null;
  initialMode?: AmanatModalMode;
  isOpen: boolean;
  onClose: () => void;
}

export const NewAmanatModal: React.FC<NewAmanatModalProps> = ({
  existingAccount,
  initialMode,
  isOpen,
  onClose
}) => {
  const {
    language,
    amanatAccounts,
    settings,
    saveAmanatAccount,
    recordAmanatEntry,
    openReceipt,
    showToast
  } = useApp();

  const [mode, setMode] = useState<'new_account' | 'add_entry' | 'withdraw_entry'>('new_account');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [accountSearchQuery, setAccountSearchQuery] = useState('');
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  // New Account fields (Individual Khata)
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerCnic, setOwnerCnic] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');
  const [city, setCity] = useState('Dubai');
  const [currency, setCurrency] = useState<Currency>('PKR');
  const [initialAmount, setInitialAmount] = useState<string>('');
  const [aedEquivalentInput, setAedEquivalentInput] = useState<string>('');
  const [conversionRate, setConversionRate] = useState<string>(String(settings.defaultExchangeRate || 77.5));
  const [openedDate, setOpenedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [initialPaymentMethod, setInitialPaymentMethod] = useState<PaymentMethod>('Cash');
  const [initialBankName, setInitialBankName] = useState('Meezan Bank');
  const [initialCustomBank, setInitialCustomBank] = useState('');

  // Ledger Entry fields (Deposit + or Return/Withdraw -)
  const [entryType, setEntryType] = useState<AmanatEntryType>('additional_deposit');
  const [entryAmount, setEntryAmount] = useState<string>('');
  const [entryAedEquivalent, setEntryAedEquivalent] = useState<string>('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [relatedPerson, setRelatedPerson] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [bankName, setBankName] = useState('Meezan Bank');
  const [customBankName, setCustomBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [description, setDescription] = useState('');
  const [entryError, setEntryError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEntryError('');
      setConversionRate(String(settings.defaultExchangeRate || 77.5));

      if (existingAccount) {
        setSelectedAccountId(existingAccount.id);
        setCurrency(existingAccount.currency);
        if (initialMode === 'withdraw_entry' || initialMode === 'send_transfer') {
          setMode('withdraw_entry');
          setEntryType('returned_to_owner');
        } else if (initialMode === 'new_account') {
          setMode('new_account');
        } else {
          setMode('add_entry');
          setEntryType('additional_deposit');
        }
      } else if (initialMode) {
        const resolvedMode =
          initialMode === 'send_transfer' ? 'withdraw_entry' : initialMode;
        setMode(resolvedMode);
        if (amanatAccounts.length > 0) {
          setSelectedAccountId(amanatAccounts[0].id);
          setCurrency(amanatAccounts[0].currency);
        }
        setEntryType(
          resolvedMode === 'withdraw_entry' ? 'returned_to_owner' : 'additional_deposit'
        );
      } else {
        setMode('new_account');
        if (amanatAccounts.length > 0) {
          setSelectedAccountId(amanatAccounts[0].id);
        }
      }

      // Reset fields
      setAccountSearchQuery('');
      setIsAccountDropdownOpen(false);
      setOwnerName('');
      setOwnerPhone('');
      setOwnerCnic('');
      setOwnerAddress('');
      setCity('Dubai');
      if (!existingAccount) {
        setCurrency('PKR');
      }
      setInitialAmount('');
      setAedEquivalentInput('');
      setOpenedDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setInitialPaymentMethod('Cash');
      setInitialBankName('Meezan Bank');
      setInitialCustomBank('');

      setEntryAmount('');
      setEntryAedEquivalent('');
      setEntryDate(new Date().toISOString().split('T')[0]);
      setRelatedPerson('');
      setPaymentMethod('Cash');
      setBankName('Meezan Bank');
      setCustomBankName('');
      setAccountNumber('');
      setDescription('');
    }
  }, [existingAccount, initialMode, isOpen, amanatAccounts, settings.defaultExchangeRate]);

  const targetAccount = useMemo(
    () => amanatAccounts.find(a => a.id === selectedAccountId) || existingAccount || amanatAccounts[0] || null,
    [amanatAccounts, selectedAccountId, existingAccount]
  );

  // Filter accounts for searchable dropdown
  const filteredAccounts = useMemo(() => {
    const q = accountSearchQuery.trim().toLowerCase();
    if (!q) return amanatAccounts;
    return amanatAccounts.filter(
      a =>
        a.ownerName.toLowerCase().includes(q) ||
        a.ownerPhone.toLowerCase().includes(q) ||
        a.accountNo.toLowerCase().includes(q) ||
        (a.city || '').toLowerCase().includes(q)
    );
  }, [amanatAccounts, accountSearchQuery]);

  if (!isOpen) return null;

  const parsedRate = parseFloat(normalizeNumericInput(conversionRate)) || settings.defaultExchangeRate || 77.5;
  const parsedInitialAmount = parseFloat(normalizeNumericInput(initialAmount)) || 0;
  const parsedEntryAmount = parseFloat(normalizeNumericInput(entryAmount)) || 0;

  // Dual-currency bidirectional sync for New Account
  const handleInitialAmountChange = (rawVal: string) => {
    setInitialAmount(rawVal);
    setEntryError('');
    const num = parseFloat(normalizeNumericInput(rawVal));
    if (!isNaN(num) && num > 0 && parsedRate > 0) {
      if (currency === 'PKR') {
        setAedEquivalentInput(String(Math.round((num / parsedRate) * 100) / 100));
      } else {
        setAedEquivalentInput(String(Math.round(num * parsedRate)));
      }
    } else {
      setAedEquivalentInput('');
    }
  };

  const handleAedEquivalentChange = (rawVal: string) => {
    setAedEquivalentInput(rawVal);
    setEntryError('');
    const num = parseFloat(normalizeNumericInput(rawVal));
    if (!isNaN(num) && num > 0 && parsedRate > 0) {
      if (currency === 'PKR') {
        setInitialAmount(String(Math.round(num * parsedRate)));
      } else {
        setInitialAmount(String(Math.round((num / parsedRate) * 100) / 100));
      }
    } else {
      setInitialAmount('');
    }
  };

  // Dual-currency bidirectional sync for Ledger Entry
  const handleEntryAmountChange = (rawVal: string) => {
    setEntryAmount(rawVal);
    setEntryError('');
    const num = parseFloat(normalizeNumericInput(rawVal));
    const acctCurr = targetAccount?.currency || 'PKR';
    if (!isNaN(num) && num > 0 && parsedRate > 0) {
      if (acctCurr === 'PKR') {
        setEntryAedEquivalent(String(Math.round((num / parsedRate) * 100) / 100));
      } else {
        setEntryAedEquivalent(String(Math.round(num * parsedRate)));
      }
    } else {
      setEntryAedEquivalent('');
    }
  };

  const handleEntryEquivalentChange = (rawVal: string) => {
    setEntryAedEquivalent(rawVal);
    setEntryError('');
    const num = parseFloat(normalizeNumericInput(rawVal));
    const acctCurr = targetAccount?.currency || 'PKR';
    if (!isNaN(num) && num > 0 && parsedRate > 0) {
      if (acctCurr === 'PKR') {
        setEntryAmount(String(Math.round(num * parsedRate)));
      } else {
        setEntryAmount(String(Math.round((num / parsedRate) * 100) / 100));
      }
    } else {
      setEntryAmount('');
    }
  };

  // Create New Individual Cash Jama Account
  const handleSaveNewAccount = (printReceipt: boolean) => {
    setEntryError('');
    if (!ownerName.trim()) {
      setEntryError(
        language === 'ur'
          ? 'براہ کرم کھاتہ دار کا نام درج کریں'
          : 'Please enter the account holder name'
      );
      return;
    }

    const amountNum = Math.max(0, parsedInitialAmount);
    const receiptNo = `REC-${Math.floor(10000 + Math.random() * 90000)}`;
    const newAccountId = `AMN-${Date.now()}`;
    const resolvedInitBank =
      initialPaymentMethod === 'Bank Transfer'
        ? initialBankName === 'Other Bank'
          ? initialCustomBank || 'Bank'
          : initialBankName
        : initialPaymentMethod === 'Cash'
        ? undefined
        : initialPaymentMethod;

    const initialEntry: AmanatEntry = {
      id: `AMN-ENT-${Date.now()}`,
      accountId: newAccountId,
      receiptNo,
      date: openedDate || new Date().toISOString().split('T')[0],
      type: 'initial_deposit',
      amount: amountNum,
      currency,
      previousBalance: 0,
      newBalance: amountNum,
      relatedPerson: ownerName.trim(),
      paymentMethod: initialPaymentMethod,
      bankName: resolvedInitBank,
      description:
        notes.trim() ||
        `انفرادی پیسہ جمع کھاتہ — ابتدائی جمع رقم (${currency === 'PKR' ? 'پاکستانی روپے' : 'درہم'})`
    };

    const nextNum = 301 + amanatAccounts.length;
    const newAcc: AmanatAccount = {
      id: newAccountId,
      accountNo: `AMN-${nextNum}`,
      ownerName: ownerName.trim(),
      ownerPhone: ownerPhone.trim() || '—',
      ownerAddress: ownerAddress.trim(),
      city: city.trim() || ownerAddress.trim() || 'پشاور',
      currency,
      currentBalance: amountNum,
      openedDate: openedDate || new Date().toISOString().split('T')[0],
      notes: notes.trim(),
      entries: [initialEntry]
    };

    const savedAcc = saveAmanatAccount(newAcc);
    showToast(
      `نیا انفرادی پیسہ جمع کھاتہ (${savedAcc.accountNo}) محفوظ ہو گیا`,
      'success'
    );

    if (printReceipt) {
      openReceipt({
        format: 'A',
        amanatAccount: savedAcc,
        amanatEntry: savedAcc.entries?.[0] || initialEntry
      });
    }
    onClose();
  };

  // Record Deposit (+) or Return/Withdrawal (-) on Individual Cash Jama Account
  const handleSaveEntry = (printReceipt: boolean) => {
    setEntryError('');
    if (!targetAccount) {
      setEntryError('براہ کرم پہلے کھاتہ منتخب کریں یا نیا کھاتہ بنائیں');
      return;
    }

    const amountNum = parsedEntryAmount;
    if (isNaN(amountNum) || amountNum <= 0) {
      setEntryError('براہ کرم درست رقم درج کریں (صفر سے زیادہ)');
      return;
    }

    const isDeposit = entryType === 'additional_deposit' || entryType === 'initial_deposit';

    const resolvedEntryBank =
      paymentMethod === 'Bank Transfer'
        ? bankName === 'Other Bank'
          ? customBankName || 'بینک ٹرانسفر'
          : bankName
        : paymentMethod === 'Cash'
        ? undefined
        : paymentMethod;

    const prevBal = targetAccount.currentBalance;
    const newBal = isDeposit ? prevBal + amountNum : prevBal - amountNum;
    const receiptNo = `REC-${Math.floor(10000 + Math.random() * 90000)}`;

    const defaultDesc = isDeposit
      ? 'انفرادی کھاتہ میں نقد رقم جمع شدگی'
      : entryType === 'returned_to_owner'
      ? 'کھاتہ دار کو نقد رقم واپسی / ادائیگی'
      : entryType === 'full_withdrawal'
      ? 'انفرادی کھاتہ سے مکمل بقایا رقم واپسی'
      : entryType === 'third_party_payment'
      ? `کھاتہ دار کی ہدایت پر ادائیگی${relatedPerson.trim() ? `: ${relatedPerson.trim()}` : ''}`
      : 'انفرادی کھاتہ سے نقد رقم واپسی';

    const newEntry: AmanatEntry = {
      id: `AMN-ENT-${Date.now()}`,
      accountId: targetAccount.id,
      receiptNo,
      date: entryDate || new Date().toISOString().split('T')[0],
      type: entryType,
      amount: amountNum,
      currency: targetAccount.currency,
      previousBalance: prevBal,
      newBalance: newBal,
      relatedPerson: relatedPerson.trim() || undefined,
      paymentMethod,
      bankName: resolvedEntryBank,
      description: description.trim() || defaultDesc
    };

    const updatedAcc = recordAmanatEntry(targetAccount.id, {
      accountId: targetAccount.id,
      receiptNo: newEntry.receiptNo,
      date: newEntry.date,
      type: newEntry.type,
      amount: newEntry.amount,
      currency: newEntry.currency,
      relatedPerson: newEntry.relatedPerson,
      paymentMethod: newEntry.paymentMethod,
      bankName: newEntry.bankName,
      description: newEntry.description
    });

    showToast(
      isDeposit
        ? `انفرادی کھاتہ میں +${amountNum.toLocaleString()} ${targetAccount.currency} جمع ہو گئے`
        : `انفرادی کھاتہ سے -${amountNum.toLocaleString()} ${targetAccount.currency} واپسی درج ہو گئی`,
      'success'
    );

    if (printReceipt) {
      const latestEntry =
        updatedAcc && updatedAcc.entries.length > 0
          ? updatedAcc.entries[updatedAcc.entries.length - 1]
          : newEntry;
      openReceipt({
        format: 'A',
        amanatAccount: updatedAcc || {
          ...targetAccount,
          currentBalance: newBal,
          entries: [...targetAccount.entries, newEntry]
        },
        amanatEntry: latestEntry
      });
    }

    onClose();
  };

  const isDepositMode = mode === 'add_entry';
  const isWithdrawMode = mode === 'withdraw_entry';
  const previewPrevBal = targetAccount?.currentBalance || 0;
  const previewNewBal = isDepositMode
    ? previewPrevBal + parsedEntryAmount
    : previewPrevBal - parsedEntryAmount;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-4 flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg leading-tight font-urdu-heading">
                انفرادی پیسہ جمع کھاتہ (جمع و واپسی اندراج)
              </h2>
              <p className="text-[11px] text-emerald-300 font-medium font-urdu-body">
                یہ مکمل طور پر الگ انفرادی کھاتہ ہے — کسی اسٹیشن سے منسلک نہیں ہے اور اسٹیشن سے کٹوتی نہیں کرتا
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Tab Mode Switcher: Deposit (+), Return/Withdraw (-), New Individual Khata */}
        <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex flex-wrap gap-1.5 shrink-0">
          {amanatAccounts.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => {
                  setMode('add_entry');
                  setEntryType('additional_deposit');
                  setEntryError('');
                }}
                className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition font-urdu-heading ${
                  mode === 'add_entry'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>+ رقم جمع کریں (Deposit +)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('withdraw_entry');
                  setEntryType('returned_to_owner');
                  setEntryError('');
                }}
                className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition font-urdu-heading ${
                  mode === 'withdraw_entry'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>- رقم واپسی / نکالیں (Return -)</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              setMode('new_account');
              setEntryError('');
            }}
            className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition font-urdu-heading ${
              mode === 'new_account'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>+ نیا انفرادی کھاتہ کھولیے (New Khata)</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {entryError && (
            <div className="bg-rose-50 border border-rose-300 text-rose-800 rounded-xl px-4 py-2.5 text-xs font-bold flex items-center justify-between font-urdu-body">
              <span>{entryError}</span>
              <button onClick={() => setEntryError('')} className="text-rose-500 hover:text-rose-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {mode === 'new_account' ? (
            /* ==================== CREATE NEW INDIVIDUAL CASH JAMA KHATA ==================== */
            <div className="space-y-4">
              {/* Owner Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 font-urdu-heading">
                    کھاتہ دار کا نام (Account Holder Name) *
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    autoFocus
                    onChange={e => setOwnerName(e.target.value)}
                    placeholder="کھاتہ دار کا نام (Account Holder Name)"
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 font-urdu-heading">
                    فون / واٹس ایپ نمبر (Phone Number)
                  </label>
                  <input
                    type="text"
                    value={ownerPhone}
                    onChange={e => setOwnerPhone(e.target.value)}
                    placeholder="فون / واٹس ایپ نمبر (Phone Number)"
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 font-urdu-heading">
                    شناختی کارڈ / ایمریٹس آئی ڈی (CNIC / Emirates ID)
                  </label>
                  <input
                    type="text"
                    value={ownerCnic}
                    onChange={e => setOwnerCnic(e.target.value)}
                    placeholder="شناختی کارڈ / ایمریٹس آئی ڈی (CNIC / ID)"
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-mono"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 font-urdu-heading">
                    پتہ / شہر (Address / City)
                  </label>
                  <input
                    type="text"
                    value={ownerAddress}
                    onChange={e => setOwnerAddress(e.target.value)}
                    placeholder="پتہ / شہر (Address / City)"
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                  />
                </div>
              </div>

              {/* Currency & Date */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5 font-urdu-heading">
                    <Coins className="w-4 h-4 text-emerald-600" />
                    کھاتہ کرنسی اور ابتدائی جمع رقم (اپنی مرضی کی رقم اور تاریخ درج کریں)
                  </span>
                  <div className="flex bg-white rounded-lg p-0.5 border border-emerald-300">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrency('PKR');
                        setInitialAmount('');
                        setAedEquivalentInput('');
                      }}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                        currency === 'PKR'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      PKR (پاکستانی روپے)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrency('AED');
                        setInitialAmount('');
                        setAedEquivalentInput('');
                      }}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                        currency === 'AED'
                          ? 'bg-amber-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      AED (درہم)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1 font-urdu-heading">
                      {`ابتدائی جمع رقم (${currency})`}
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={initialAmount}
                      onChange={e => handleInitialAmountChange(e.target.value)}
                      placeholder={`ابتدائی جمع رقم (${currency})`}
                      className="w-full bg-white border-2 border-emerald-500 rounded-lg p-2.5 text-base font-mono font-bold text-slate-900"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1 font-urdu-heading">
                      {currency === 'PKR' ? 'مساوی درہم (AED)' : 'مساوی پاکستانی (PKR)'}
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={aedEquivalentInput}
                      onChange={e => handleAedEquivalentChange(e.target.value)}
                      placeholder={currency === 'PKR' ? 'مساوی درہم (AED)' : 'مساوی پاکستانی (PKR)'}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-mono font-semibold text-slate-800"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1 font-urdu-heading">
                      کھاتہ کھولنے کی تاریخ (Custom Date)
                    </label>
                    <input
                      type="date"
                      value={openedDate}
                      onChange={e => setOpenedDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Payment Method & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1 font-urdu-heading">
                      رقم وصولی کا طریقہ (Payment Method)
                    </label>
                    <select
                      value={initialPaymentMethod}
                      onChange={e => setInitialPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold"
                    >
                      {PAYOUT_METHODS.map(m => (
                        <option key={m.value} value={m.value}>
                          {m.labelUr} ({m.labelEn})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1 font-urdu-heading">
                      تفصیل / نوٹس (Description / Notes)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="تفصیل / نوٹس (Description / Notes)"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ==================== DEPOSIT (+) OR RETURN/WITHDRAW (-) ON INDIVIDUAL KHATA ==================== */
            <div className="space-y-4">
              {/* Select Individual Khata Account */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <label className="text-xs font-bold text-slate-800 block font-urdu-heading">
                  انفرادی پیسہ جمع کھاتہ منتخب کریں (Select Khata Account):
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-left flex items-center justify-between hover:border-emerald-500 transition"
                  >
                    {targetAccount ? (
                      <div className="flex flex-wrap items-center justify-between w-full gap-2 pr-2">
                        <div>
                          <span className="font-bold text-slate-900 text-sm">
                            {targetAccount.ownerName}
                          </span>
                          <span className="text-xs font-mono text-slate-500 ml-2">
                            ({targetAccount.accountNo})
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-lg font-mono font-bold text-xs ${
                            targetAccount.currentBalance < 0
                              ? 'bg-rose-100 text-rose-900'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          {targetAccount.currentBalance < 0 ? 'منفی بقایا (واجب الادا): ' : 'موجودہ جمع بقایا: '}
                          {targetAccount.currentBalance.toLocaleString()} {targetAccount.currency}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 font-urdu-body">
                        کھاتہ منتخب کریں...
                      </span>
                    )}
                  </button>

                  {isAccountDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-2 space-y-2 max-h-60 overflow-y-auto">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          value={accountSearchQuery}
                          onChange={e => setAccountSearchQuery(e.target.value)}
                          placeholder="نام، فون یا کھاتہ نمبر تلاش کریں..."
                          className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs"
                        />
                      </div>
                      <div className="divide-y divide-slate-100">
                        {filteredAccounts.map(acc => (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={() => {
                              setSelectedAccountId(acc.id);
                              setCurrency(acc.currency);
                              setIsAccountDropdownOpen(false);
                              setEntryError('');
                            }}
                            className={`w-full px-3 py-2 text-left rounded-lg flex items-center justify-between text-xs hover:bg-emerald-50 ${
                              targetAccount?.id === acc.id ? 'bg-emerald-50 font-bold' : ''
                            }`}
                          >
                            <div>
                              <p className="font-bold text-slate-900">{acc.ownerName}</p>
                              <p className="text-[11px] text-slate-500 font-mono">
                                {acc.accountNo} • {acc.ownerPhone}
                              </p>
                            </div>
                            <span
                              className={`font-mono font-bold ${
                                acc.currentBalance < 0 ? 'text-rose-700' : 'text-emerald-700'
                              }`}
                            >
                              {acc.currentBalance.toLocaleString()} {acc.currency}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Amount, Equivalent & Date */}
              <div
                className={`rounded-xl p-4 border space-y-3 ${
                  isDepositMode
                    ? 'bg-emerald-50/70 border-emerald-200'
                    : 'bg-rose-50/70 border-rose-200'
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 font-urdu-heading">
                        {isDepositMode
                          ? `جمع کرنے کی رقم (${targetAccount?.currency || 'PKR'}) *`
                          : `واپسی / نکالنے کی رقم (${targetAccount?.currency || 'PKR'}) *`}
                      </label>
                      {isWithdrawMode && targetAccount && targetAccount.currentBalance > 0 && (
                        <button
                          type="button"
                          onClick={() => handleEntryAmountChange(String(targetAccount.currentBalance))}
                          className="text-[11px] font-bold text-rose-700 hover:underline font-urdu-body cursor-pointer"
                        >
                          مکمل بقایا ({targetAccount.currentBalance.toLocaleString()})
                        </button>
                      )}
                      {isDepositMode && targetAccount && targetAccount.currentBalance < 0 && (
                        <button
                          type="button"
                          onClick={() => handleEntryAmountChange(String(Math.abs(targetAccount.currentBalance)))}
                          className="text-[11px] font-bold text-emerald-700 hover:underline font-urdu-body cursor-pointer"
                        >
                          منفی بقایا پورا کریں ({Math.abs(targetAccount.currentBalance).toLocaleString()})
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={entryAmount}
                      onChange={e => handleEntryAmountChange(e.target.value)}
                      placeholder={
                        isDepositMode
                          ? `جمع کرنے کی رقم (${targetAccount?.currency || 'PKR'})`
                          : `واپسی رقم (${targetAccount?.currency || 'PKR'})`
                      }
                      className={`w-full bg-white border-2 rounded-lg p-2.5 text-base font-mono font-bold text-slate-900 ${
                        isDepositMode ? 'border-emerald-500' : 'border-rose-500'
                      }`}
                      dir="ltr"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1 font-urdu-heading">
                      {targetAccount?.currency === 'AED'
                        ? 'مساوی پاکستانی (PKR)'
                        : 'مساوی درہم (AED)'}
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={entryAedEquivalent}
                      onChange={e => handleEntryEquivalentChange(e.target.value)}
                      placeholder={
                        targetAccount?.currency === 'AED'
                          ? 'مساوی پاکستانی (PKR)'
                          : 'مساوی درہم (AED)'
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-mono font-semibold text-slate-700"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1 font-urdu-heading">
                      تاریخ اندراج (Custom Date)
                    </label>
                    <input
                      type="date"
                      value={entryDate}
                      onChange={e => setEntryDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Method, Related Person & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1 font-urdu-heading">
                      ادائیگی کا طریقہ (Payment Method)
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold"
                    >
                      {PAYOUT_METHODS.map(m => (
                        <option key={m.value} value={m.value}>
                          {m.labelUr} ({m.labelEn})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1 font-urdu-heading">
                      {isDepositMode
                        ? 'جمع کرانے والا (Deposited By)'
                        : 'وصول کنندہ (Received By)'}
                    </label>
                    <input
                      type="text"
                      value={relatedPerson}
                      onChange={e => setRelatedPerson(e.target.value)}
                      placeholder={
                        isDepositMode
                          ? 'جمع کرانے والا (Deposited By)'
                          : 'وصول کنندہ (Received By)'
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1 font-urdu-heading">
                      تفصیل / نوٹس (Description / Notes)
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="تفصیل / نوٹس (Description / Notes)"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>

                {paymentMethod === 'Bank Transfer' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1 font-urdu-heading">
                        بینک کا نام (Bank Name)
                      </label>
                      <select
                        value={bankName}
                        onChange={e => setBankName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold"
                      >
                        {PAKISTAN_BANKS.map(b => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1 font-urdu-heading">
                        اکاؤنٹ نمبر / IBAN (Account Number)
                      </label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={e => setAccountNumber(e.target.value)}
                        placeholder="اکاؤنٹ نمبر / IBAN (Account Number)"
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono"
                        dir="ltr"
                      />
                    </div>
                  </div>
                )}

                {/* Individual Khata Running Balance Preview */}
                {targetAccount && (
                  <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-slate-600 font-bold block font-urdu-heading">
                          سابقہ کھاتہ بقایا (Previous Balance):
                        </span>
                        <span
                          className={`font-mono font-bold text-sm ${
                            previewPrevBal < 0 ? 'text-rose-700' : 'text-slate-800'
                          }`}
                        >
                          {previewPrevBal.toLocaleString()} {targetAccount.currency}{' '}
                          <span className="text-[11px] font-urdu-body">
                            ({previewPrevBal < 0 ? 'منفی / واجب الادا' : previewPrevBal > 0 ? 'جمع' : 'صفر'})
                          </span>
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600 font-bold block font-urdu-heading">
                          {isDepositMode
                            ? 'موجودہ جمع رقم (+):'
                            : 'موجودہ واپسی رقم (-):'}
                        </span>
                        <span
                          className={`font-mono font-bold text-sm ${
                            isDepositMode ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isDepositMode ? '+' : '-'}
                          {parsedEntryAmount.toLocaleString()} {targetAccount.currency}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600 font-bold block font-urdu-heading">
                          نیا صافی کھاتہ بقایا (New Balance):
                        </span>
                        <span
                          className={`font-mono font-black text-base ${
                            previewNewBal < 0
                              ? 'text-rose-700'
                              : previewNewBal > 0
                              ? 'text-emerald-700'
                              : 'text-slate-950'
                          }`}
                        >
                          {previewNewBal.toLocaleString()} {targetAccount.currency}{' '}
                          <span className="text-xs font-bold font-urdu-body">
                            ({previewNewBal < 0 ? 'منفی / واجب الادا' : previewNewBal > 0 ? 'جمع بیلنس' : 'بے باق'})
                          </span>
                        </span>
                      </div>
                    </div>

                    {isDepositMode && previewPrevBal < 0 && parsedEntryAmount > 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-[11px] font-bold text-emerald-900 font-urdu-body">
                        {previewNewBal >= 0
                          ? `خودکار سیٹلمنٹ: سابقہ منفی بقایا (${Math.abs(previewPrevBal).toLocaleString()} ${targetAccount.currency}) منہا ہونے کے بعد ${previewNewBal.toLocaleString()} ${targetAccount.currency} جمع کھاتہ میں شامل ہو جائے گا۔`
                          : `خودکار سیٹلمنٹ: جمع رقم (${parsedEntryAmount.toLocaleString()} ${targetAccount.currency}) سابقہ منفی بقایا سے منہا ہو کر بقایا واجب الادا ${previewNewBal.toLocaleString()} ${targetAccount.currency} رہ جائے گا۔`}
                      </div>
                    )}

                    {isWithdrawMode && previewNewBal < 0 && parsedEntryAmount > 0 && (
                      <div className="bg-rose-50 border border-rose-200 rounded-lg px-3 py-1.5 text-[11px] font-bold text-rose-900 font-urdu-body">
                        نوٹ: جمع بیلنس سے زیادہ واپسی پر کھاتہ منفی ({previewNewBal.toLocaleString()} {targetAccount.currency}) ہو جائے گا — آئندہ رقم جمع کرنے پر یہ منفی خودکار منہا ہو جائے گا۔
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 font-urdu-heading"
          >
            منسوخ کریں (Cancel)
          </button>

          {mode === 'new_account' ? (
            <>
              <button
                type="button"
                onClick={() => handleSaveNewAccount(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 font-urdu-heading"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>کھاتہ محفوظ کریں (Save)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSaveNewAccount(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm font-urdu-heading"
              >
                <Printer className="w-4 h-4" />
                <span>محفوظ کریں اور رسید پرنٹ کریں (Save & Print)</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleSaveEntry(false)}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 font-urdu-heading ${
                  isDepositMode
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isDepositMode
                    ? 'جمع اندراج محفوظ کریں (Save +)'
                    : 'واپسی اندراج محفوظ کریں (Save -)'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleSaveEntry(true)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm font-urdu-heading"
              >
                <Printer className="w-4 h-4" />
                <span>محفوظ کریں اور رسید پرنٹ کریں (Save & Print)</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
