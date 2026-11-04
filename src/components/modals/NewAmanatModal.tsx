/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AmanatAccount,
  AmanatEntry,
  AmanatEntryType,
  Currency,
  MoneyTransfer,
  PaymentMethod,
  Receiver
} from '../../types';
import {
  X,
  ShieldCheck,
  AlertCircle,
  ArrowRightLeft,
  Percent,
  Send,
  BookOpen,
  Calculator,
  CheckCircle2,
  Building2,
  Landmark,
  Wallet
} from 'lucide-react';

const DEFAULT_SAVED_BANKS = [
  'Meezan Bank (میزان بینک)',
  'HBL (حبیب بینک لمیٹڈ)',
  'UBL (یونائیٹڈ بینک لمیٹڈ)',
  'MCB (مسلم کمرشل بینک)',
  'Allied Bank (الائیڈ بینک)',
  'Bank Alfalah (بینک الفلاح)',
  'National Bank of Pakistan NBP (نیشنل بینک)',
  'Askari Bank (عسکری بینک)',
  'Dubai Islamic Bank (دبئی اسلامک بینک)',
  'Faysal Bank (فیصل بینک)',
  'Bank AL Habib (بینک الحبیب)',
  'Standard Chartered (سٹینڈرڈ چارٹرڈ)',
  'EasyPaisa (ایزی پیسہ)',
  'JazzCash (جیز کیش)',
  'NayaPay (نیا پیسہ)',
  'SadaPay (سدا پیسہ)'
];

/**
 * Normalizes input strings typed via Urdu keyboard, Arabic digits, English keypad,
 * or pasted with commas into standard decimal digit string.
 */
export const normalizeNumericInput = (raw: string): string => {
  if (!raw) return '';
  let s = String(raw)
    .replace(/[٠۰]/g, '0')
    .replace(/[١۱]/g, '1')
    .replace(/[٢۲]/g, '2')
    .replace(/[٣۳]/g, '3')
    .replace(/[٤۴]/g, '4')
    .replace(/[٥۵]/g, '5')
    .replace(/[٦۶]/g, '6')
    .replace(/[٧۷]/g, '7')
    .replace(/[٨۸]/g, '8')
    .replace(/[٩۹]/g, '9')
    .replace(/[,،\s]/g, '')
    .replace(/[^\d.]/g, '');
  const dotIndex = s.indexOf('.');
  if (dotIndex !== -1) {
    s = s.slice(0, dotIndex + 1) + s.slice(dotIndex + 1).replace(/\./g, '');
  }
  return s;
};

export type AmanatModalMode = 'entry' | 'send_transfer' | 'new_account';

interface NewAmanatModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingAccount?: AmanatAccount | null;
  initialMode?: AmanatModalMode;
}

export const NewAmanatModal: React.FC<NewAmanatModalProps> = ({
  isOpen,
  onClose,
  existingAccount,
  initialMode
}) => {
  const {
    amanatAccounts,
    receivers,
    stations,
    savedBanks,
    addSavedBank,
    loans,
    settings,
    saveAmanatAccount,
    recordAmanatEntry,
    saveTransfer,
    saveReceiver,
    recordLoanRepayment,
    openReceipt,
    t,
    language,
    formatMoney
  } = useApp();

  const [mode, setMode] = useState<AmanatModalMode>(
    initialMode || (existingAccount ? 'entry' : amanatAccounts.length === 0 ? 'new_account' : 'entry')
  );

  // New Account state
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');
  const [city, setCity] = useState('Dubai');
  const [currency, setCurrency] = useState<Currency>('PKR');
  const [initialDeposit, setInitialDeposit] = useState<string>('');

  // Entry on existing account
  const [selectedAccountId, setSelectedAccountId] = useState(
    existingAccount?.id || (amanatAccounts[0]?.id || '')
  );
  const [entryType, setEntryType] = useState<AmanatEntryType>('additional_deposit');
  const [entryAmount, setEntryAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [relatedPerson, setRelatedPerson] = useState('');

  // Payment / Deposit Method for Cash vs Via Bank
  const [depositPaymentMethod, setDepositPaymentMethod] = useState<PaymentMethod>('Cash');
  const [depositBankName, setDepositBankName] = useState<string>('Meezan Bank (میزان بینک)');
  const [depositReference, setDepositReference] = useState<string>('');

  // Extract saved banks from stations + preset list
  const savedStationBanks = stations
    .filter(s => s.category === 'bank' || s.category === 'wallet' || s.nameUr.includes('بینک') || s.nameEn.toLowerCase().includes('bank'))
    .map(s => s.nameUr);

  const availableBanks = Array.from(new Set([...savedBanks, ...savedStationBanks, ...DEFAULT_SAVED_BANKS]));

  // Immediate Transfer during Deposit (for both new_account and additional_deposit)
  const [sendImmediateTransfer, setSendImmediateTransfer] = useState<boolean>(false);
  const [immediateTransferAmount, setImmediateTransferAmount] = useState<string>('');

  // Dedicated "Send Transfer / Deduct from Saved Amanat" state
  const [deductDestination, setDeductDestination] = useState<'money_transfer' | 'khata_loan'>('money_transfer');
  const [deductAmount, setDeductAmount] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState<number>(settings.defaultExchangeRate || 77.5);
  const [receiverMode, setReceiverMode] = useState<'new' | 'existing'>('new');
  const [selectedReceiverId, setSelectedReceiverId] = useState<string>(receivers[0]?.id || '');
  const [transferReceiverName, setTransferReceiverName] = useState<string>('');
  const [transferReceiverPhone, setTransferReceiverPhone] = useState<string>('');
  const [transferStation, setTransferStation] = useState<string>('میرعلی');
  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const currentAccount = amanatAccounts.find(a => a.id === selectedAccountId) || existingAccount || amanatAccounts[0];
  const outstandingLoans = loans.filter(l => l.remainingBalance > 0);

  // Sync modal state when opened or when existingAccount / initialMode changes
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      const targetAcc = existingAccount || amanatAccounts[0] || null;
      if (targetAcc) {
        setSelectedAccountId(targetAcc.id);
      }
      setDeductAmount('');
      setImmediateTransferAmount('');
      setInitialDeposit('');
      setEntryAmount('');
      if (initialMode) {
        setMode(initialMode);
      } else if (existingAccount) {
        setMode('entry');
      } else if (amanatAccounts.length === 0) {
        setMode('new_account');
      }
      setSendImmediateTransfer(false);
      setExchangeRate(settings.defaultExchangeRate || 77.5);
      if (outstandingLoans.length > 0 && !selectedLoanId) {
        const matchingLoan = targetAcc
          ? outstandingLoans.find(l => l.borrowerName.toLowerCase() === targetAcc.ownerName.toLowerCase())
          : undefined;
        setSelectedLoanId(matchingLoan?.id || outstandingLoans[0].id);
      }
    }
  }, [isOpen, existingAccount, initialMode]);

  // Update selected account when switching account
  const handleAccountChange = (accId: string) => {
    setSelectedAccountId(accId);
    setDeductAmount('');
    const acc = amanatAccounts.find(a => a.id === accId);
    if (acc) {
      const matchingLoan = outstandingLoans.find(
        l => l.borrowerName.toLowerCase() === acc.ownerName.toLowerCase()
      );
      if (matchingLoan) {
        setSelectedLoanId(matchingLoan.id);
      }
    }
  };

  if (!isOpen) return null;

  const numInitialDeposit = typeof initialDeposit === 'number' ? initialDeposit : Number(initialDeposit) || 0;
  const numEntryAmount = typeof entryAmount === 'number' ? entryAmount : Number(entryAmount) || 0;
  const numImmediateTransferAmount = typeof immediateTransferAmount === 'number' ? immediateTransferAmount : Number(immediateTransferAmount) || 0;
  const numDeductAmount = typeof deductAmount === 'number' ? deductAmount : Number(deductAmount) || 0;

  const isDebit =
    entryType === 'partial_withdrawal' ||
    entryType === 'full_withdrawal' ||
    entryType === 'third_party_payment' ||
    entryType === 'returned_to_owner';

  const isOverdrawing = Boolean(
    (mode === 'entry' && isDebit && currentAccount && numEntryAmount > currentAccount.currentBalance) ||
      (mode === 'entry' &&
        entryType === 'additional_deposit' &&
        sendImmediateTransfer &&
        currentAccount &&
        numImmediateTransferAmount > currentAccount.currentBalance + numEntryAmount) ||
      (mode === 'new_account' && sendImmediateTransfer && numImmediateTransferAmount > numInitialDeposit) ||
      (mode === 'send_transfer' && currentAccount && numDeductAmount > currentAccount.currentBalance)
  );

  // Helper to compute AED and PKR amounts for a transfer from a given source amount and currency
  const computeTransferAmounts = (amt: number, sourceCurrency: Currency) => {
    const rate = exchangeRate > 0 ? exchangeRate : 75;
    if (sourceCurrency === 'AED') {
      const aed = Number(amt);
      const pkr = Math.round(aed * rate);
      return { amountAED: aed, amountPKR: pkr };
    } else {
      const pkr = Math.round(Number(amt));
      const aed = Math.round((pkr / rate) * 100) / 100;
      return { amountAED: aed, amountPKR: pkr };
    }
  };

  // Helper to build and save a MoneyTransfer from Amanat
  const createTransferFromAmanat = (
    senderName: string,
    senderPhone: string,
    senderCity: string,
    sourceAmount: number,
    sourceCurrency: Currency,
    amanatAccNo: string
  ): MoneyTransfer => {
    const { amountAED, amountPKR } = computeTransferAmounts(sourceAmount, sourceCurrency);
    let finalReceiverId = selectedReceiverId;
    let finalReceiverName = '';
    let finalReceiverPhone = '';
    let finalStation = transferStation || 'میرعلی';

    if (receiverMode === 'existing' && selectedReceiverId) {
      const rec = receivers.find(r => r.id === selectedReceiverId);
      finalReceiverName = rec?.name || 'Receiver';
      finalReceiverPhone = rec?.phone || '';
      finalStation = rec?.station || finalStation;
    } else {
      finalReceiverName = transferReceiverName.trim() || (language === 'ur' ? 'وصول کنندہ' : 'Receiver');
      finalReceiverPhone = transferReceiverPhone.trim() || '03000000000';
      const newRec: Receiver = {
        id: `rec-${Date.now()}`,
        customerId: `amn-cust-${Date.now()}`,
        name: finalReceiverName,
        phone: finalReceiverPhone,
        city: 'Pakistan',
        station: finalStation,
        country: 'Pakistan'
      };
      saveReceiver(newRec);
      finalReceiverId = newRec.id;
    }

    const orderNo = `${settings.orderNumberPrefix}${Math.floor(10 + Math.random() * 90)}-2026`;
    const receiptNo = `${settings.receiptPrefix}-${Math.floor(10000 + Math.random() * 90000)}`;

    const newTransfer: MoneyTransfer = {
      id: `tr-${Date.now()}`,
      orderNumber: orderNo,
      receiptNumber: receiptNo,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      senderId: amanatAccNo,
      senderName,
      senderPhone: senderPhone || '+971500000000',
      senderCity: senderCity || 'Dubai',
      senderCountry: 'United Arab Emirates',
      receiverId: finalReceiverId,
      receiverName: finalReceiverName,
      receiverPhone: finalReceiverPhone,
      station: finalStation,
      amountAED,
      exchangeRate: Number(exchangeRate),
      amountPKR,
      commissionType: 'fixed',
      commissionRate: 0,
      commissionBase: 'AED',
      commissionAmount: 0,
      additionalCharges: 0,
      totalCollectedAED: amountAED,
      netPayablePKR: amountPKR,
      amountPaidPKR: 0,
      remainingBalancePKR: amountPKR,
      payouts: [],
      status: 'Received',
      notes:
        language === 'ur'
          ? `امانت کھاتہ (${amanatAccNo}) سے کٹوتی کر کے ٹرانسفر بھیجی گئی`
          : `Deducted from Amanat Khata (${amanatAccNo})`,
      createdAt: new Date().toISOString()
    };

    saveTransfer(newTransfer);
    return newTransfer;
  };

  const handleSubmit = (printImmediately: boolean) => {
    setErrorMsg('');
    if (isOverdrawing) return;
    const date = new Date().toISOString().split('T')[0];

    if (mode === 'new_account') {
      if (!ownerName.trim()) {
        setErrorMsg(language === 'ur' ? 'براہِ کرم گاہک کا نام درج کریں' : 'Please enter customer / owner name');
        return;
      }
      if (numInitialDeposit <= 0) {
        setErrorMsg(
          language === 'ur'
            ? 'براہِ کرم درست ابتدائی رقم درج کریں (کم از کم 1 روپے)'
            : 'Please enter a valid initial deposit amount (minimum 1)'
        );
        return;
      }

      const accountId = `amn-${Date.now()}`;
      const accountNo = `AMN-${Math.floor(100 + Math.random() * 900)}`;
      const receiptNo = `AMN-VOUCH-${Math.floor(1000 + Math.random() * 9000)}`;

      const depositMethodLabel =
        depositPaymentMethod === 'Cash'
          ? (language === 'ur' ? 'نقد کیش' : 'Cash')
          : (language === 'ur' ? `بذریعہ بینک (${depositBankName})` : `Via Bank (${depositBankName})`);

      const depositEntry: AmanatEntry = {
        id: `ame-${Date.now()}-1`,
        accountId,
        date,
        type: 'initial_deposit',
        amount: numInitialDeposit,
        currency,
        paymentMethod: depositPaymentMethod,
        bankName: depositPaymentMethod === 'Cash' ? undefined : depositBankName,
        description:
          language === 'ur'
            ? `ابتدائی امانت جمع (${depositMethodLabel})`
            : `Initial deposit (${depositMethodLabel})`,
        previousBalance: 0,
        newBalance: numInitialDeposit,
        receiptNo,
        notes: depositReference ? `Ref: ${depositReference}` : 'Account opened with initial deposit'
      };

      const entries: AmanatEntry[] = [depositEntry];
      let finalBalance = numInitialDeposit;
      let createdTransfer: MoneyTransfer | null = null;

      if (sendImmediateTransfer && numImmediateTransferAmount > 0 && numImmediateTransferAmount <= numInitialDeposit) {
        createdTransfer = createTransferFromAmanat(
          ownerName.trim(),
          ownerPhone.trim() || '+971500000000',
          city || 'Dubai',
          numImmediateTransferAmount,
          currency,
          accountNo
        );

        finalBalance = numInitialDeposit - numImmediateTransferAmount;
        const deductionEntry: AmanatEntry = {
          id: `ame-${Date.now()}-2`,
          accountId,
          date,
          type: 'third_party_payment',
          amount: numImmediateTransferAmount,
          currency,
          description:
            language === 'ur'
              ? `جمع شدہ رقم سے فوری منی ٹرانسفر آرڈر #${createdTransfer.orderNumber} (${createdTransfer.station})`
              : `Immediate Money Transfer Order #${createdTransfer.orderNumber} (${createdTransfer.station})`,
          relatedPerson: `${createdTransfer.receiverName} (${createdTransfer.receiverPhone})`,
          previousBalance: numInitialDeposit,
          newBalance: finalBalance,
          receiptNo: createdTransfer.receiptNumber,
          notes: `Auto-deducted for Transfer ${createdTransfer.orderNumber}`
        };
        entries.push(deductionEntry);
      }

      const newAccount: AmanatAccount = {
        id: accountId,
        accountNo,
        ownerName: ownerName.trim(),
        ownerPhone: ownerPhone.trim() || '+971500000000',
        ownerAddress: ownerAddress.trim(),
        city: city || 'Dubai',
        currency,
        openedDate: date,
        currentBalance: finalBalance,
        entries
      };

      saveAmanatAccount(newAccount);
      onClose();

      if (printImmediately) {
        if (createdTransfer) {
          openReceipt({
            format: 'A',
            transfer: createdTransfer
          });
        } else {
          openReceipt({
            format: 'A',
            amanatAccount: newAccount,
            amanatEntry: entries[entries.length - 1]
          });
        }
      }
    } else if (mode === 'entry') {
      if (!currentAccount) {
        setErrorMsg(language === 'ur' ? 'کوئی کھاتہ منتخب نہیں ہے' : 'No account selected');
        return;
      }
      if (numEntryAmount <= 0) {
        setErrorMsg(
          language === 'ur'
            ? 'براہِ کرم درست رقم درج کریں (کم از کم 1 روپے)'
            : 'Please enter a valid amount (minimum 1)'
        );
        return;
      }
      if (isDebit && numEntryAmount > currentAccount.currentBalance) {
        setErrorMsg(
          language === 'ur'
            ? 'رقم موجودہ پیسہ جمع بیلنس سے زیادہ ہے'
            : 'Amount exceeds current saved Cash Jama balance'
        );
        return;
      }

      const receiptNo = `AMN-VOUCH-${Math.floor(1000 + Math.random() * 9000)}`;
      const methodLabel =
        depositPaymentMethod === 'Cash'
          ? (language === 'ur' ? 'نقد کیش' : 'Cash')
          : (language === 'ur' ? `بذریعہ بینک (${depositBankName})` : `Via Bank (${depositBankName})`);

      const desc =
        description.trim() ||
        (entryType === 'additional_deposit'
          ? language === 'ur'
            ? `مزید امانت جمع (${methodLabel})`
            : `Additional safekeeping deposit (${methodLabel})`
          : entryType === 'partial_withdrawal'
          ? language === 'ur'
            ? `جزوی رقم واپسی (${methodLabel})`
            : `Partial withdrawal handed to owner (${methodLabel})`
          : entryType === 'third_party_payment'
          ? `${language === 'ur' ? 'تیسرے فریق کو ادائیگی' : 'Sent to third party'}: ${relatedPerson || 'Recipient'} (${methodLabel})`
          : language === 'ur'
          ? 'امانت کھاتہ لین دین'
          : 'Safekeeping transaction');

      const balanceAfterFirstEntry = isDebit
        ? currentAccount.currentBalance - numEntryAmount
        : currentAccount.currentBalance + numEntryAmount;

      recordAmanatEntry(currentAccount.id, {
        accountId: currentAccount.id,
        date,
        type: entryType,
        amount: numEntryAmount,
        currency: currentAccount.currency,
        paymentMethod: depositPaymentMethod,
        bankName: depositPaymentMethod === 'Cash' ? undefined : depositBankName,
        description: desc,
        relatedPerson: relatedPerson.trim(),
        receiptNo,
        notes: depositReference ? `Ref: ${depositReference}` : undefined
      });

      let createdTransfer: MoneyTransfer | null = null;
      if (
        entryType === 'additional_deposit' &&
        sendImmediateTransfer &&
        numImmediateTransferAmount > 0 &&
        numImmediateTransferAmount <= balanceAfterFirstEntry
      ) {
        createdTransfer = createTransferFromAmanat(
          currentAccount.ownerName,
          currentAccount.ownerPhone,
          currentAccount.city || 'Dubai',
          numImmediateTransferAmount,
          currentAccount.currency,
          currentAccount.accountNo
        );

        recordAmanatEntry(currentAccount.id, {
          accountId: currentAccount.id,
          date,
          type: 'third_party_payment',
          amount: numImmediateTransferAmount,
          currency: currentAccount.currency,
          description:
            language === 'ur'
              ? `پیسہ جمع سے منی ٹرانسفر آرڈر #${createdTransfer.orderNumber} (${createdTransfer.station})`
              : `Money Transfer Order #${createdTransfer.orderNumber} (${createdTransfer.station})`,
          relatedPerson: `${createdTransfer.receiverName} (${createdTransfer.receiverPhone})`,
          receiptNo: createdTransfer.receiptNumber
        });
      }

      onClose();

      if (printImmediately) {
        if (createdTransfer) {
          openReceipt({
            format: 'A',
            transfer: createdTransfer
          });
        } else {
          openReceipt({
            format: 'A',
            amanatAccount: {
              ...currentAccount,
              currentBalance: balanceAfterFirstEntry
            },
            amanatEntry: {
              id: `ame-tmp`,
              accountId: currentAccount.id,
              date,
              type: entryType,
              amount: Number(entryAmount),
              currency: currentAccount.currency,
              paymentMethod: depositPaymentMethod,
              bankName: depositPaymentMethod === 'Cash' ? undefined : depositBankName,
              description: desc,
              relatedPerson: relatedPerson.trim(),
              previousBalance: currentAccount.currentBalance,
              newBalance: balanceAfterFirstEntry,
              receiptNo,
              notes: depositReference ? `Ref: ${depositReference}` : undefined
            }
          });
        }
      }
    } else if (mode === 'send_transfer') {
      // Dedicated: Deduct from Saved Cash Jama to send Money Transfer OR settle Khata Loan
      if (!currentAccount) {
        setErrorMsg(language === 'ur' ? 'کوئی کھاتہ منتخب نہیں ہے' : 'No account selected');
        return;
      }
      if (numDeductAmount <= 0) {
        setErrorMsg(
          language === 'ur'
            ? 'براہِ کرم کٹوتی کی رقم درج کریں (کم از کم 1 روپے)'
            : 'Please enter deduction amount (minimum 1)'
        );
        return;
      }
      if (numDeductAmount > currentAccount.currentBalance) {
        setErrorMsg(
          language === 'ur'
            ? `کٹوتی کی رقم موجودہ بیلنس (${currentAccount.currentBalance.toLocaleString()} ${currentAccount.currency}) سے زیادہ نہیں ہو سکتی`
            : `Deduction amount cannot exceed balance (${currentAccount.currentBalance.toLocaleString()} ${currentAccount.currency})`
        );
        return;
      }

      const newBalanceAfterDeduct = currentAccount.currentBalance - numDeductAmount;

      if (deductDestination === 'money_transfer') {
        const createdTransfer = createTransferFromAmanat(
          currentAccount.ownerName,
          currentAccount.ownerPhone,
          currentAccount.city || 'Dubai',
          numDeductAmount,
          currentAccount.currency,
          currentAccount.accountNo
        );

        const entryDesc =
          description.trim() ||
          (language === 'ur'
            ? `پیسہ جمع کھاتہ سے منی ٹرانسفر آرڈر #${createdTransfer.orderNumber} (${createdTransfer.station})`
            : `Money Transfer Order #${createdTransfer.orderNumber} (${createdTransfer.station}) from Cash Jamah`);

        recordAmanatEntry(currentAccount.id, {
          accountId: currentAccount.id,
          date,
          type: 'third_party_payment',
          amount: numDeductAmount,
          currency: currentAccount.currency,
          description: entryDesc,
          relatedPerson: `${createdTransfer.receiverName} (${createdTransfer.receiverPhone})`,
          receiptNo: createdTransfer.receiptNumber
        });

        onClose();

        if (printImmediately) {
          openReceipt({
            format: 'A',
            transfer: createdTransfer
          });
        }
      } else {
        // Deduct from Cash Jamah to repay Khata Loan
        const targetLoan = loans.find(l => l.id === selectedLoanId);
        if (!targetLoan) return;

        const receiptNo = `AMN-KHATA-${Math.floor(1000 + Math.random() * 9000)}`;
        const entryDesc =
          description.trim() ||
          (language === 'ur'
            ? `پیسہ جمع کھاتہ سے قرضہ کھاتہ (${targetLoan.loanNo}) میں رقم ایڈجسٹ کی گئی`
            : `Transferred from Cash Jamah to settle Khata Loan (${targetLoan.loanNo})`);

        recordAmanatEntry(currentAccount.id, {
          accountId: currentAccount.id,
          date,
          type: 'partial_withdrawal',
          amount: numDeductAmount,
          currency: currentAccount.currency,
          description: entryDesc,
          relatedPerson: `${targetLoan.borrowerName} (${targetLoan.loanNo})`,
          receiptNo
        });

        // Calculate repayment amount in the loan's currency
        let loanRepayAmount = numDeductAmount;
        if (currentAccount.currency !== targetLoan.currency) {
          const rate = exchangeRate > 0 ? exchangeRate : 77.5;
          if (currentAccount.currency === 'AED' && targetLoan.currency === 'PKR') {
            loanRepayAmount = Math.round(numDeductAmount * rate);
          } else if (currentAccount.currency === 'PKR' && targetLoan.currency === 'AED') {
            loanRepayAmount = Math.round((numDeductAmount / rate) * 100) / 100;
          }
        }
        const cappedRepayAmount = Math.min(targetLoan.remainingBalance, loanRepayAmount);

        recordLoanRepayment(targetLoan.id, {
          id: `rep-${Date.now()}`,
          loanId: targetLoan.id,
          date,
          amount: cappedRepayAmount,
          currency: targetLoan.currency,
          paymentMethod: 'Cash',
          referenceNo: currentAccount.accountNo,
          receiptNo,
          notes:
            language === 'ur'
              ? `پیسہ جمع کھاتہ (${currentAccount.accountNo}) سے کٹوتی`
              : `Auto-adjusted from Cash Jamah (${currentAccount.accountNo})`
        });

        onClose();

        if (printImmediately) {
          openReceipt({
            format: 'A',
            amanatAccount: {
              ...currentAccount,
              currentBalance: newBalanceAfterDeduct
            },
            amanatEntry: {
              id: `ame-tmp`,
              accountId: currentAccount.id,
              date,
              type: 'partial_withdrawal',
              amount: numDeductAmount,
              currency: currentAccount.currency,
              description: entryDesc,
              relatedPerson: `${targetLoan.borrowerName} (${targetLoan.loanNo})`,
              previousBalance: currentAccount.currentBalance,
              newBalance: newBalanceAfterDeduct,
              receiptNo
            }
          });
        }
      }
    }
  };

  // Deposit & Payout Channel Selector: Cash vs Via Bank vs Wallet
  const renderDepositChannelSection = (isDeposit: boolean) => {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1.5 font-urdu-heading">
            {language === 'ur'
              ? isDeposit
                ? 'طریقہ جمع (Deposit via Cash or Bank / Wallet):'
                : 'طریقہ ادائیگی (Payout via Cash or Bank / Wallet):'
              : isDeposit
              ? 'Deposit Channel (Cash or Via Bank / Wallet):'
              : 'Payout Channel (Cash or Via Bank / Wallet):'}
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => setDepositPaymentMethod('Cash')}
              className={`py-2 px-2.5 rounded-lg border text-center transition flex items-center justify-center gap-1.5 cursor-pointer ${
                depositPaymentMethod === 'Cash'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <span>💵</span>
              <span>{language === 'ur' ? 'نقد کیش (Cash)' : 'Cash'}</span>
            </button>
            <button
              type="button"
              onClick={() => setDepositPaymentMethod('Bank Transfer')}
              className={`py-2 px-2.5 rounded-lg border text-center transition flex items-center justify-center gap-1.5 cursor-pointer ${
                depositPaymentMethod === 'Bank Transfer'
                  ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                  : 'bg-white text-blue-900 border-slate-300 hover:bg-blue-50'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>{language === 'ur' ? 'بذریعہ بینک (Bank)' : 'Via Bank'}</span>
            </button>
            <button
              type="button"
              onClick={() => setDepositPaymentMethod('EasyPaisa')}
              className={`py-2 px-2.5 rounded-lg border text-center transition flex items-center justify-center gap-1.5 cursor-pointer ${
                depositPaymentMethod === 'EasyPaisa' || depositPaymentMethod === 'JazzCash' || depositPaymentMethod === 'NayaPay'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                  : 'bg-white text-emerald-900 border-slate-300 hover:bg-emerald-50'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>{language === 'ur' ? 'والیٹ (Wallet)' : 'Wallet'}</span>
            </button>
          </div>
        </div>

        {depositPaymentMethod !== 'Cash' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {language === 'ur' ? 'محفوظ بینک منتخب کریں:' : 'Select Saved Bank:'}
              </label>
              <select
                value={availableBanks.includes(depositBankName) ? depositBankName : ''}
                onChange={e => {
                  if (e.target.value) setDepositBankName(e.target.value);
                }}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900"
              >
                <option value="">{language === 'ur' ? '-- فہرست سے منتخب کریں --' : '-- Choose Bank --'}</option>
                {availableBanks.map(b => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  {language === 'ur' ? 'بینک نام (خود لکھیں / ترمیم):' : 'Bank Name (Manual / Edit):'}
                </label>
                {depositBankName.trim() && !availableBanks.includes(depositBankName.trim()) && (
                  <button
                    type="button"
                    onClick={() => addSavedBank(depositBankName.trim())}
                    className="text-[10px] font-bold text-blue-700 hover:underline cursor-pointer"
                  >
                    + {language === 'ur' ? 'محفوظ کریں' : 'Save'}
                  </button>
                )}
              </div>
              <input
                type="text"
                value={depositBankName}
                onChange={e => setDepositBankName(e.target.value)}
                placeholder={language === 'ur' ? 'بینک یا والیٹ کا نام لکھیں' : 'Type or edit bank name'}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-950"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {language === 'ur' ? 'اکاؤنٹ نمبر / سلپ حوالہ #:' : 'Account # / Slip Ref #:'}
              </label>
              <input
                type="text"
                value={depositReference}
                onChange={e => setDepositReference(e.target.value)}
                placeholder={language === 'ur' ? 'مثلاً: PK36MEZN... یا سلپ نمبر' : 'e.g. Account # or Slip Reference'}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono font-medium text-slate-950"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // Reusable Immediate Transfer Sub-Form (used in both New Account & Additional Deposit)
  const renderImmediateTransferSection = (baseDepositAmount: number | string, baseCurrency: Currency, prevBalance: number) => {
    const numBase = typeof baseDepositAmount === 'number' ? baseDepositAmount : Number(baseDepositAmount) || 0;
    const totalAvailable = prevBalance + numBase;
    const { amountAED, amountPKR } = computeTransferAmounts(numImmediateTransferAmount, baseCurrency);
    const remainingAmanat = Math.max(0, totalAvailable - numImmediateTransferAmount);

    return (
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-3">
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={sendImmediateTransfer}
            onChange={e => {
              setSendImmediateTransfer(e.target.checked);
              if (!e.target.checked) {
                setImmediateTransferAmount('');
              }
            }}
            className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
          />
          <div className="flex-1">
            <span className="font-bold text-slate-950 text-xs sm:text-sm block font-urdu-heading">
              {language === 'ur'
                ? 'اس جمع شدہ رقم میں سے کچھ رقم ابھی پاکستان ٹرانسفر بھیجیں (خودکار کھاتہ کٹوتی)'
                : 'Send part of this deposit as a Money Transfer now (Auto-deduct from Khata)'}
            </span>
            <span className="text-[11px] text-slate-600 block">
              {language === 'ur'
                ? 'درج کردہ رقم فوری طور پر منی ٹرانسفر میں چلی جائے گی اور بقایا رقم پیسہ جمع کھاتہ میں محفوظ رہے گی'
                : 'Automatically creates a Money Transfer and saves the remaining balance in Cash Jamah Khata'}
            </span>
          </div>
        </label>

        {sendImmediateTransfer && (
          <div className="pt-2 border-t border-blue-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {language === 'ur'
                    ? `ٹرانسفر کٹوتی کی رقم (${baseCurrency}) *`
                    : `Transfer Deduction Amount (${baseCurrency}) *`}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={immediateTransferAmount}
                  onChange={e => {
                    setErrorMsg('');
                    setImmediateTransferAmount(normalizeNumericInput(e.target.value));
                  }}
                  placeholder={language === 'ur' ? 'رقم درج کریں...' : 'Enter amount manually...'}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-sm font-bold text-slate-950 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {t('exchangeRate')} *
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={exchangeRate}
                  onChange={e => setExchangeRate(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-sm font-bold text-slate-950"
                />
              </div>
            </div>

            {/* Receiver & Station Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {t('receiverName')} *
                </label>
                <input
                  type="text"
                  value={transferReceiverName}
                  onChange={e => setTransferReceiverName(e.target.value)}
                  placeholder={language === 'ur' ? 'مثلاً: عبدالخالد' : 'e.g. Abdul Khalid'}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {t('receiverPhone')}
                </label>
                <input
                  type="text"
                  value={transferReceiverPhone}
                  onChange={e => setTransferReceiverPhone(e.target.value)}
                  placeholder="03001234567"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {t('station')}
                </label>
                <select
                  value={transferStation}
                  onChange={e => setTransferStation(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold font-urdu-heading text-slate-950"
                >
                  {stations.map(st => (
                    <option key={st.id} value={st.nameUr}>
                      {st.nameUr} ({st.nameEn})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Auto-Updated Khata & Transfer Summary */}
            <div className="bg-white rounded-xl p-3 border border-blue-200 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block">
                  {language === 'ur' ? 'ٹرانسفر ادائیگی (PKR):' : 'Payable in Pakistan:'}
                </span>
                <strong className="font-mono text-sm text-blue-900 font-black">
                  {amountPKR.toLocaleString()} PKR
                </strong>
                <span className="block text-[10px] text-slate-500 font-mono">({amountAED} AED)</span>
              </div>
              <div>
                <span className="text-slate-500 block">
                  {language === 'ur' ? 'پیسہ جمع سے کٹوتی:' : 'Deducted from Cash Jamah:'}
                </span>
                <strong className="font-mono text-sm text-rose-700 font-black">
                  - {Number(immediateTransferAmount || 0).toLocaleString()} {baseCurrency}
                </strong>
              </div>
              <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-100">
                <span className="text-slate-600 font-bold block">
                  {language === 'ur' ? 'نیا بقایا پیسہ جمع کھاتہ:' : 'Net Saved Cash Jamah:'}
                </span>
                <strong className="font-mono text-sm text-emerald-800 font-black">
                  {remainingAmanat.toLocaleString()} {baseCurrency}
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-2 sm:p-4 md:py-6 overflow-y-auto"
      dir={language === 'ur' ? 'rtl' : 'ltr'}
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full my-auto max-h-[92vh] sm:max-h-[88vh] overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg font-urdu-heading leading-tight">
                {language === 'ur'
                  ? 'پیسہ جمع کھاتہ و خودکار منی ٹرانسفر کٹوتی'
                  : 'Cash Jamah Safekeeping & Auto Transfer Deduction'}
              </h3>
              <span className="text-[11px] text-slate-400 font-mono hidden sm:block">
                Eagle Star Brand • Cash Jama Ledger
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-xl transition cursor-pointer"
            title={language === 'ur' ? 'بند کریں' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Mode Tab Bar */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-100/80 text-xs sm:text-sm font-bold shrink-0">
          <button
            type="button"
            onClick={() => setMode('entry')}
            className={`py-3 px-2 text-center transition cursor-pointer ${
              mode === 'entry'
                ? 'border-b-2 border-cyan-700 font-black text-cyan-950 bg-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
            }`}
          >
            {language === 'ur' ? '1. جمع / واپسی اندراج' : '1. Deposit / Withdraw'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('send_transfer');
            }}
            className={`py-3 px-2 text-center transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'send_transfer'
                ? 'border-b-2 border-blue-700 font-black text-blue-950 bg-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
            <span>
              {language === 'ur' ? '2. پیسہ جمع سے ٹرانسفر' : '2. Send Transfer from Cash Jamah'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode('new_account')}
            className={`py-3 px-2 text-center transition cursor-pointer ${
              mode === 'new_account'
                ? 'border-b-2 border-cyan-700 font-black text-cyan-950 bg-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
            }`}
          >
            + {language === 'ur' ? 'نیا پیسہ جمع' : 'New Cash Jama'}
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs sm:text-sm font-bold flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMsg('')}
                className="text-rose-500 hover:text-rose-700 text-sm font-bold px-1.5 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {mode === 'new_account' && (
            /* MODE 3: OPEN NEW AMANAT ACCOUNT */
            <>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {t('ownerName')} *
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={e => {
                    setErrorMsg('');
                    setOwnerName(e.target.value);
                  }}
                  placeholder="e.g. Haji Rasool Khan"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-medium text-slate-950"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {t('ownerPhone')}
                  </label>
                  <input
                    type="text"
                    value={ownerPhone}
                    onChange={e => setOwnerPhone(e.target.value)}
                    placeholder="+97152..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-mono text-slate-950"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {t('address')}
                  </label>
                  <input
                    type="text"
                    value={ownerAddress}
                    onChange={e => setOwnerAddress(e.target.value)}
                    placeholder="Sonapur Camp / Quetta"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      {t('initialDeposit')} *
                    </label>
                    {numInitialDeposit > 0 && (
                      <span className="text-[11px] font-bold text-emerald-800 font-mono">
                        = {numInitialDeposit.toLocaleString()} {currency}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={initialDeposit}
                    onChange={e => {
                      setErrorMsg('');
                      setInitialDeposit(normalizeNumericInput(e.target.value));
                    }}
                    placeholder={language === 'ur' ? 'رقم درج کریں (مثلاً: 50,000)' : 'Enter deposit amount (e.g. 50,000)'}
                    className="w-full bg-white border border-slate-300 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20 rounded-lg p-2.5 font-mono text-base font-bold text-slate-950 outline-none"
                  />
                  {/* Quick Preset Buttons for Instant Selection */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-600 font-semibold">{language === 'ur' ? 'فوری رقم:' : 'Quick:'}</span>
                    {[10000, 25000, 50000, 100000, 200000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setErrorMsg('');
                          setInitialDeposit(String(amt));
                        }}
                        className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-cyan-100 text-slate-800 hover:text-cyan-900 border border-slate-200 transition cursor-pointer"
                      >
                        +{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {t('currency')}
                  </label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value as Currency)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-semibold text-slate-950"
                  >
                    <option value="PKR">PKR (پاکستانی روپے)</option>
                    <option value="AED">AED (درہم)</option>
                  </select>
                </div>
              </div>

              {/* Deposit Method: Cash vs Via Bank Dropdown */}
              {renderDepositChannelSection(true)}

              {/* Option to immediately send half/part of this new deposit as a Money Transfer */}
              {renderImmediateTransferSection(initialDeposit, currency, 0)}
            </>
          )}

          {mode === 'entry' && (
            /* MODE 1: RECORD DEPOSIT OR WITHDRAWAL ON EXISTING ACCOUNT */
            <>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {t('amanat')}
                </label>
                <select
                  value={selectedAccountId}
                  onChange={e => handleAccountChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-semibold text-slate-950"
                >
                  {amanatAccounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.ownerName} ({a.accountNo}) - {language === 'ur' ? 'بیلنس' : 'Balance'}:{' '}
                      {a.currentBalance.toLocaleString()} {a.currency}
                    </option>
                  ))}
                </select>
              </div>

              {currentAccount && (
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex justify-between items-center text-xs sm:text-sm">
                  <div>
                    <span className="text-slate-500 block">{t('ownerName')}:</span>
                    <strong className="text-slate-950 text-base">{currentAccount.ownerName}</strong>
                  </div>
                  <div className="text-end">
                    <span className="text-slate-500 block">
                      {language === 'ur' ? 'موجودہ پیسہ جمع بیلنس' : 'Current Saved Cash Jama'}:
                    </span>
                    <strong className="text-emerald-800 font-mono text-lg font-black">
                      {formatMoney(currentAccount.currentBalance, currentAccount.currency)}
                    </strong>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {t('entryType')}
                </label>
                <select
                  value={entryType}
                  onChange={e => setEntryType(e.target.value as AmanatEntryType)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-semibold text-slate-950"
                >
                  <option value="additional_deposit">{t('additionalDeposit')} (+)</option>
                  <option value="partial_withdrawal">{t('partialWithdrawal')} (-)</option>
                  <option value="third_party_payment">{t('thirdPartyPayment')} (-)</option>
                  <option value="full_withdrawal">{t('fullWithdrawal')} (-)</option>
                  <option value="returned_to_owner">{t('returnedToOwner')} (-)</option>
                  <option value="adjustment">{t('adjustment')}</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    {t('amount')} ({currentAccount?.currency || 'PKR'}) *
                  </label>
                  {numEntryAmount > 0 && (
                    <span className="text-[11px] font-bold text-emerald-800 font-mono">
                      = {numEntryAmount.toLocaleString()} {currentAccount?.currency || 'PKR'}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={entryAmount}
                  onChange={e => {
                    setErrorMsg('');
                    setEntryAmount(normalizeNumericInput(e.target.value));
                  }}
                  placeholder={language === 'ur' ? 'رقم درج کریں (مثلاً: 25,000)' : 'Enter amount manually...'}
                  className={`w-full bg-white border rounded-lg p-2.5 font-mono text-base font-bold text-slate-950 outline-none ${
                    isOverdrawing
                      ? 'border-red-500 ring-1 ring-red-500'
                      : 'border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-600 font-semibold">{language === 'ur' ? 'فوری رقم:' : 'Quick:'}</span>
                  {[5000, 10000, 25000, 50000, 100000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setErrorMsg('');
                        setEntryAmount(String(amt));
                      }}
                      className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-emerald-100 text-slate-800 hover:text-emerald-900 border border-slate-200 transition cursor-pointer"
                    >
                      +{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
                {isOverdrawing && (
                  <div className="flex items-center gap-1 text-red-600 text-xs mt-1 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{t('insufficientFunds')}</span>
                  </div>
                )}
              </div>

              {/* Deposit / Payout Method: Cash vs Via Bank Dropdown */}
              {renderDepositChannelSection(entryType === 'additional_deposit')}

              {/* When depositing money, allow sending part as a Money Transfer immediately */}
              {entryType === 'additional_deposit' &&
                currentAccount &&
                renderImmediateTransferSection(
                  entryAmount,
                  currentAccount.currency,
                  currentAccount.currentBalance
                )}

              {entryType === 'third_party_payment' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {t('recipientName')} *
                  </label>
                  <input
                    type="text"
                    value={relatedPerson}
                    onChange={e => setRelatedPerson(e.target.value)}
                    placeholder="e.g. Kareem Ullah (Peshawar) 0300..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-950"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-slate-600 block mb-1">{t('notes')}</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Sent via EasyPaisa on owner request"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm text-slate-950"
                />
              </div>
            </>
          )}

          {mode === 'send_transfer' && (
            /* MODE 2: SAVED AMANAT -> DEDUCT & SEND AS MONEY TRANSFER OR SETTLE KHATA LOAN */
            <>
              <div className="bg-gradient-to-r from-blue-50 via-cyan-50/60 to-white p-3.5 rounded-xl border border-blue-200 flex items-start gap-3">
                <Send className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-slate-950 font-urdu-heading text-sm">
                    {language === 'ur'
                      ? 'پیسہ جمع کھاتہ سے رقم ٹرانسفر بھیجیں یا قرضہ کھاتہ کلیئر کریں'
                      : 'Send Money Transfer or Settle Khata Loan from Saved Cash Jamah'}
                  </p>
                  <p className="text-slate-600 mt-0.5">
                    {language === 'ur'
                      ? 'گاہک کا پیسہ جمع کھاتہ منتخب کریں اور مطلوبہ رقم درج کریں۔ درج کردہ رقم خودکار طور پر پیسہ جمع بیلنس سے منہا ہو جائے گی۔'
                      : 'Select the customer’s Cash Jamah account and enter the exact deduction amount manually. The balance will automatically update.'}
                  </p>
                </div>
              </div>

              {/* Select Amanat Account */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {language === 'ur' ? 'گاہک کا پیسہ جمع کھاتہ منتخب کریں *' : 'Select Customer Cash Jama Account *'}
                </label>
                <select
                  value={selectedAccountId}
                  onChange={e => handleAccountChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-slate-950"
                >
                  {amanatAccounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.ownerName} ({a.accountNo}) — {language === 'ur' ? 'موجودہ پیسہ جمع:' : 'Saved Balance:'}{' '}
                      {a.currentBalance.toLocaleString()} {a.currency}
                    </option>
                  ))}
                </select>
              </div>

              {currentAccount && (
                <>
                  {/* Clean Manual Deduction Amount & Purpose */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700 font-urdu-heading">
                            {language === 'ur'
                              ? `پیسہ جمع سے کٹوتی کی رقم (${currentAccount.currency}) *`
                              : `Amount to Deduct (${currentAccount.currency}) *`}
                          </label>
                          {numDeductAmount > 0 && (
                            <span className="text-[11px] font-bold text-blue-800 font-mono">
                              = {numDeductAmount.toLocaleString()} {currentAccount.currency}
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={deductAmount}
                          onChange={e => {
                            setErrorMsg('');
                            setDeductAmount(normalizeNumericInput(e.target.value));
                          }}
                          placeholder={
                            language === 'ur'
                              ? `رقم درج کریں (موجودہ: ${currentAccount.currentBalance.toLocaleString()})`
                              : `Enter amount (Max: ${currentAccount.currentBalance.toLocaleString()} ${currentAccount.currency})`
                          }
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono text-base font-black text-slate-950 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setErrorMsg('');
                              setDeductAmount(String(Math.floor(currentAccount.currentBalance / 2)));
                            }}
                            className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition cursor-pointer"
                          >
                            {language === 'ur' ? 'نصف (50%)' : 'Half (50%)'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setErrorMsg('');
                              setDeductAmount(String(currentAccount.currentBalance));
                            }}
                            className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition cursor-pointer"
                          >
                            {language === 'ur' ? 'مکمل (100%)' : 'Full (100%)'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1 font-urdu-heading">
                          {language === 'ur' ? 'کٹوتی کی مد / مقصد منتخب کریں' : 'Select Deduction Purpose'}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setDeductDestination('money_transfer')}
                            className={`py-2.5 px-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                              deductDestination === 'money_transfer'
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span>{language === 'ur' ? 'منی ٹرانسفر بھیجیں' : 'Money Transfer'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeductDestination('khata_loan')}
                            className={`py-2.5 px-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                              deductDestination === 'khata_loan'
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>{language === 'ur' ? 'قرضہ کھاتہ واپسی' : 'Settle Khata Loan'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Live Khata Auto-Update Preview Bar */}
                    <div className="bg-white rounded-xl p-3 border border-slate-200 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block">
                          {language === 'ur' ? 'موجودہ پیسہ جمع:' : 'Saved Cash Jama:'}
                        </span>
                        <strong className="font-mono text-sm text-slate-900 font-bold">
                          {currentAccount.currentBalance.toLocaleString()} {currentAccount.currency}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">
                          {language === 'ur' ? 'ابھی کٹوتی (ٹرانسفر):' : 'Deducting Now:'}
                        </span>
                        <strong className="font-mono text-sm text-rose-700 font-black">
                          - {numDeductAmount.toLocaleString()} {currentAccount.currency}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-700 font-bold block">
                          {language === 'ur' ? 'نیا بقایا کھاتہ بیلنس:' : 'New Khata Balance:'}
                        </span>
                        <strong className="font-mono text-sm text-emerald-800 font-black">
                          {Math.max(0, currentAccount.currentBalance - numDeductAmount).toLocaleString()}{' '}
                          {currentAccount.currency}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {deductDestination === 'money_transfer' ? (
                    /* Destination A: Create Money Transfer to Pakistan */
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-950 font-urdu-heading">
                          {language === 'ur'
                            ? 'وصول کنندہ کی تفصیلات (پاکستان منی ٹرانسفر آرڈر)'
                            : 'Receiver Details (Pakistan Money Transfer Order)'}
                        </span>
                        <div className="flex gap-1.5 text-xs">
                          <button
                            type="button"
                            onClick={() => setReceiverMode('new')}
                            className={`px-2 py-0.5 rounded font-semibold ${
                              receiverMode === 'new'
                                ? 'bg-blue-700 text-white'
                                : 'bg-white text-slate-700 border border-slate-300'
                            }`}
                          >
                            {language === 'ur' ? 'نیا وصول کنندہ' : 'New Receiver'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setReceiverMode('existing')}
                            className={`px-2 py-0.5 rounded font-semibold ${
                              receiverMode === 'existing'
                                ? 'bg-blue-700 text-white'
                                : 'bg-white text-slate-700 border border-slate-300'
                            }`}
                          >
                            {language === 'ur' ? 'موجودہ فہرست' : 'Existing'}
                          </button>
                        </div>
                      </div>

                      {receiverMode === 'existing' ? (
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            {t('receiver')}
                          </label>
                          <select
                            value={selectedReceiverId}
                            onChange={e => setSelectedReceiverId(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-bold text-slate-950"
                          >
                            {receivers.map(r => (
                              <option key={r.id} value={r.id}>
                                {r.name} ({r.phone}) [{r.station}]
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">
                              {t('receiverName')} *
                            </label>
                            <input
                              type="text"
                              value={transferReceiverName}
                              onChange={e => setTransferReceiverName(e.target.value)}
                              placeholder={language === 'ur' ? 'مثلاً: سامیر خان' : 'e.g. Sameer Khan'}
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-950"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">
                              {t('receiverPhone')}
                            </label>
                            <input
                              type="text"
                              value={transferReceiverPhone}
                              onChange={e => setTransferReceiverPhone(e.target.value)}
                              placeholder="03001234567"
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-950"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-700 block mb-1">
                              {t('station')}
                            </label>
                            <select
                              value={transferStation}
                              onChange={e => setTransferStation(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold font-urdu-heading text-slate-950"
                            >
                              {stations.map(st => (
                                <option key={st.id} value={st.nameUr}>
                                  {st.nameUr} ({st.nameEn})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 block mb-1">
                            {t('exchangeRate')} *
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="0.01"
                            value={exchangeRate}
                            onChange={e => setExchangeRate(Number(e.target.value))}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-sm font-bold text-slate-950"
                          />
                        </div>
                        <div className="bg-white rounded-lg p-2.5 border border-emerald-200 flex flex-col justify-center">
                          <span className="text-[11px] text-slate-500">
                            {language === 'ur' ? 'پاکستان میں قابلِ ادائیگی رقم:' : 'Net Payable in Pakistan:'}
                          </span>
                          <strong className="font-mono text-base font-black text-emerald-950">
                            {computeTransferAmounts(numDeductAmount, currentAccount.currency).amountPKR.toLocaleString()}{' '}
                            PKR
                          </strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Destination B: Settle Customer's Khata Loan */
                    <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-3">
                      <span className="text-xs font-bold text-slate-900 block font-urdu-heading">
                        {language === 'ur'
                          ? 'قرضہ کھاتہ منتخب کریں جس میں یہ رقم جمع کرنی ہے:'
                          : 'Select Outstanding Khata Loan to Settle:'}
                      </span>
                      {outstandingLoans.length > 0 ? (
                        <select
                          value={selectedLoanId}
                          onChange={e => setSelectedLoanId(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-bold text-slate-950"
                        >
                          {outstandingLoans.map(l => (
                            <option key={l.id} value={l.id}>
                              {l.borrowerName} ({l.loanNo}) — {language === 'ur' ? 'واجب الوصول:' : 'Remaining:'}{' '}
                              {l.remainingBalance.toLocaleString()} {l.currency}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-xs text-slate-600">
                          {language === 'ur'
                            ? 'اس وقت کوئی بقایا قرضہ کھاتہ موجود نہیں ہے۔'
                            : 'No outstanding Khata loans found.'}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 sm:px-6 py-3.5 sm:py-4 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            disabled={isOverdrawing}
            onClick={() => handleSubmit(false)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-lg text-xs sm:text-sm font-semibold transition shadow-sm"
          >
            {mode === 'send_transfer'
              ? language === 'ur'
                ? 'کھاتہ اپڈیٹ اور ٹرانسفر محفوظ کریں'
                : 'Auto-Update Khata & Save'
              : t('save')}
          </button>
          <button
            type="button"
            disabled={isOverdrawing}
            onClick={() => handleSubmit(true)}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg text-xs sm:text-sm font-semibold transition shadow-sm"
          >
            {language === 'ur' ? 'محفوظ و پرنٹ رسید' : 'Save & Print Receipt'}
          </button>
        </div>
      </div>
    </div>
  );
};
