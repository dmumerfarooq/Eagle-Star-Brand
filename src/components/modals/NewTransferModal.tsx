/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MoneyTransfer, Customer, Receiver, TransferStatus } from '../../types';
import { X, ArrowRightLeft, Calculator, UserPlus, Building2, Plus, Trash2 } from 'lucide-react';
import { StationModal } from './StationModal';
import { normalizeNumericInput } from './NewAmanatModal';

interface NewTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  transferToEdit?: MoneyTransfer | null;
}

export const NewTransferModal: React.FC<NewTransferModalProps> = ({ isOpen, onClose, transferToEdit }) => {
  const {
    customers,
    receivers,
    amanatAccounts,
    settings,
    stations,
    savedBanks,
    addSavedBank,
    saveTransfer,
    deleteTransfer,
    saveCustomer,
    saveReceiver,
    recordAmanatEntry,
    openReceipt,
    selectedTransferForEdit,
    showToast,
    t,
    language,
    formatMoney,
    isSuperAdmin
  } = useApp();

  const activeTransferToEdit = transferToEdit !== undefined ? transferToEdit : selectedTransferForEdit;

  const [senderMode, setSenderMode] = useState<'existing' | 'new' | 'amanat'>('existing');
  const [selectedSenderId, setSelectedSenderId] = useState('');
  const [newSenderName, setNewSenderName] = useState('');
  const [newSenderPhone, setNewSenderPhone] = useState('');
  const [newSenderCity, setNewSenderCity] = useState('Dubai');

  // Amanat Khata funding state
  const [fundingSource, setFundingSource] = useState<'cash' | 'amanat'>('cash');
  const [selectedAmanatId, setSelectedAmanatId] = useState<string>(amanatAccounts[0]?.id || '');

  const [receiverMode, setReceiverMode] = useState<'existing' | 'new'>('existing');
  const [selectedReceiverId, setSelectedReceiverId] = useState('');
  const [newReceiverName, setNewReceiverName] = useState('');
  const [newReceiverPhone, setNewReceiverPhone] = useState('');
  const [newReceiverAddress, setNewReceiverAddress] = useState('');
  const [newReceiverCnic, setNewReceiverCnic] = useState('');
  const [station, setStation] = useState('میرعلی');
  const [selectedChannel, setSelectedChannel] = useState<'mirali' | 'easypaisa' | 'jazzcash' | 'nayapay' | 'sadapay' | 'raast' | 'bank' | 'other'>('mirali');
  const [bankName, setBankName] = useState('Meezan Bank میزان بینک');
  const [bankAccount, setBankAccount] = useState('');
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);

  // Financial inputs
  const [amountAED, setAmountAED] = useState<number | string>('');
  const [exchangeRate, setExchangeRate] = useState<number | string>(Number(settings.defaultExchangeRate || 77.50).toFixed(2));
  const [commissionRate, setCommissionRate] = useState<number | string>('');
  const [initialPayoutPKR, setInitialPayoutPKR] = useState<number | string>('');
  const [notes, setNotes] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const selectedAmanatAcc = amanatAccounts.find(a => a.id === selectedAmanatId) || amanatAccounts[0];

  const [pkrCalculationBasis, setPkrCalculationBasis] = useState<'gross' | 'net'>('gross');

  // Auto-calculated fields
  const numAmountAED = typeof amountAED === 'number' ? amountAED : Number(amountAED) || 0;
  const numExchangeRate = typeof exchangeRate === 'number' ? exchangeRate : Number(exchangeRate) || 77.50;
  const numCommissionRate = typeof commissionRate === 'number' ? commissionRate : Number(commissionRate) || 0;
  const numInitialPayoutPKR = typeof initialPayoutPKR === 'number' ? initialPayoutPKR : Number(initialPayoutPKR) || 0;

  // Commission is deducted from the Dirham amount (1000 AED - 10% = 900 AED)
  const commissionAmount = Math.round((numAmountAED * numCommissionRate) / 100);
  const totalCollectedAED = Math.max(0, numAmountAED - commissionAmount);
  
  // PKR calculation: default on gross amount, or net amount if selected
  const effectiveAedForPkr = pkrCalculationBasis === 'net' && commissionAmount > 0 ? totalCollectedAED : numAmountAED;
  const amountPKR = Math.round(effectiveAedForPkr * numExchangeRate);
  const netPayablePKR = amountPKR;
  const remainingBalancePKR = Math.max(0, netPayablePKR - numInitialPayoutPKR);

  // Station running balance preview
  const selectedStationObj = stations.find(
    s => s.nameUr === station || s.nameEn === station || s.code === station
  );
  const stationPrevBalance = activeTransferToEdit && activeTransferToEdit.station === station
    ? (activeTransferToEdit.stationPreviousBalancePKR ??
        ((selectedStationObj?.currentBalancePKR || 0) + (activeTransferToEdit.netPayablePKR || 0)))
    : (selectedStationObj?.currentBalancePKR || 0);
  const stationNewBalance = stationPrevBalance - netPayablePKR;

  // Calculate how much will be deducted from the selected Amanat account in its native currency
  const amanatDeductionInAccountCurrency = selectedAmanatAcc
    ? selectedAmanatAcc.currency === 'AED'
      ? totalCollectedAED
      : netPayablePKR
    : 0;

  const isAmanatInsufficient = Boolean(
    fundingSource === 'amanat' &&
      selectedAmanatAcc &&
      amanatDeductionInAccountCurrency > selectedAmanatAcc.currentBalance
  );



  // Effect to populate form on edit or reset to defaults
  useEffect(() => {
    if (!isOpen) return;

    if (activeTransferToEdit) {
      // Editing existing transfer
      const existingCust = customers.find(c => c.id === activeTransferToEdit.senderId);
      if (existingCust) {
        setSenderMode('existing');
        setSelectedSenderId(existingCust.id);
      } else {
        setSenderMode('new');
        setNewSenderName(activeTransferToEdit.senderName || '');
        setNewSenderPhone(activeTransferToEdit.senderPhone || '');
        setNewSenderCity(activeTransferToEdit.senderCity || 'Dubai');
      }

      setFundingSource('cash');

      const existingRec = receivers.find(r => r.id === activeTransferToEdit.receiverId);
      if (existingRec) {
        setReceiverMode('existing');
        setSelectedReceiverId(existingRec.id);
      } else {
        setReceiverMode('new');
        setNewReceiverName(activeTransferToEdit.receiverName || '');
        setNewReceiverPhone(activeTransferToEdit.receiverPhone || '');
        setNewReceiverAddress(activeTransferToEdit.receiverAddress || '');
        setNewReceiverCnic(activeTransferToEdit.receiverCnic || '');
      }

      setStation(activeTransferToEdit.station || 'میرعلی');

      if (activeTransferToEdit.payoutMethod === 'EasyPaisa') {
        setSelectedChannel('easypaisa');
      } else if (activeTransferToEdit.payoutMethod === 'JazzCash') {
        setSelectedChannel('jazzcash');
      } else if (activeTransferToEdit.payoutMethod === 'NayaPay') {
        setSelectedChannel('nayapay');
      } else if (activeTransferToEdit.payoutMethod === 'SadaPay') {
        setSelectedChannel('sadapay');
      } else if (activeTransferToEdit.payoutMethod === 'Raast') {
        setSelectedChannel('raast');
      } else if (activeTransferToEdit.payoutMethod === 'Bank Transfer') {
        setSelectedChannel('bank');
      } else {
        setSelectedChannel('mirali');
      }

      setBankName(activeTransferToEdit.bankName || 'Meezan Bank میزان بینک');
      setBankAccount(activeTransferToEdit.accountNumber || '');

      setAmountAED(activeTransferToEdit.amountAED);
      setExchangeRate(Number(activeTransferToEdit.exchangeRate || settings.defaultExchangeRate || 77.50).toFixed(2));
      setCommissionRate(activeTransferToEdit.commissionRate || '');
      setInitialPayoutPKR(activeTransferToEdit.amountPaidPKR || '');
      setNotes(activeTransferToEdit.notes || '');
      setConfirmDelete(false);
    } else {
      // New transfer - reset to clean blank state
      setSenderMode('existing');
      if (customers.length > 0) {
        setSelectedSenderId(customers[0].id);
      }
      setNewSenderName('');
      setNewSenderPhone('');
      setNewSenderCity('Dubai');

      setFundingSource('cash');
      if (amanatAccounts.length > 0) {
        setSelectedAmanatId(amanatAccounts[0].id);
      }

      setReceiverMode('existing');
      if (receivers.length > 0) {
        setSelectedReceiverId(receivers[0].id);
        setStation(receivers[0].station || 'میرعلی');
        if (receivers[0].bankName) setBankName(receivers[0].bankName);
        if (receivers[0].accountNumber) setBankAccount(receivers[0].accountNumber);
      } else {
        setStation('میرعلی');
      }
      setNewReceiverName('');
      setNewReceiverPhone('');
      setNewReceiverAddress('');
      setNewReceiverCnic('');

      setSelectedChannel('mirali');
      setAmountAED('');
      setExchangeRate(Number(settings.defaultExchangeRate || 77.50).toFixed(2));
      setCommissionRate('');
      setInitialPayoutPKR('');
      setNotes('');
      setConfirmDelete(false);
    }
  }, [isOpen, activeTransferToEdit, customers, receivers, amanatAccounts, settings.defaultExchangeRate]);

  // Update station when existing receiver changes
  const handleSelectReceiver = (recId: string) => {
    setSelectedReceiverId(recId);
    const rec = receivers.find(r => r.id === recId);
    if (rec) {
      if (rec.station) setStation(rec.station);
      if (rec.bankName) setBankName(rec.bankName);
      if (rec.accountNumber) setBankAccount(rec.accountNumber);
    }
  };

  if (!isOpen) return null;

  const handleDeleteTransfer = () => {
    if (!activeTransferToEdit) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteTransfer(activeTransferToEdit.id);
    setConfirmDelete(false);
    onClose();
  };

  const handleSubmit = (printImmediately: boolean) => {
    if (isAmanatInsufficient) {
      showToast(
        language === 'ur'
          ? 'امانت کھاتے میں ناکافی بیلنس ہے!'
          : 'Insufficient balance in selected Amanat account!',
        'error'
      );
      return;
    }

    if (!amountAED || numAmountAED <= 0) {
      showToast(
        language === 'ur'
          ? 'برائے مہربانی درہم (AED) کی درست رقم درج کریں!'
          : 'Please enter a valid transfer amount in AED!',
        'error'
      );
      return;
    }

    if (numExchangeRate <= 0) {
      showToast(
        language === 'ur' ? 'برائے مہربانی شرحِ تبادلہ درج کریں!' : 'Please enter exchange rate!',
        'error'
      );
      return;
    }

    if (senderMode === 'new' && !newSenderName.trim()) {
      showToast(
        language === 'ur' ? 'برائے مہربانی بھیجنے والے کا نام درج کریں!' : 'Please enter sender name!',
        'error'
      );
      return;
    }

    if (receiverMode === 'new' && !newReceiverName.trim()) {
      showToast(
        language === 'ur' ? 'برائے مہربانی وصول کنندہ کا نام درج کریں!' : 'Please enter receiver name!',
        'error'
      );
      return;
    }

    let finalSenderId = selectedSenderId;
    let finalSenderName = '';
    let finalSenderPhone = '';

    if (fundingSource === 'amanat' && selectedAmanatAcc) {
      finalSenderId = selectedAmanatAcc.accountNo;
      finalSenderName = selectedAmanatAcc.ownerName;
      finalSenderPhone = selectedAmanatAcc.ownerPhone;
    } else if (senderMode === 'new' && newSenderName.trim()) {
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        customerCode: `CUST-${Math.floor(100 + Math.random() * 900)}`,
        name: newSenderName.trim(),
        phone: newSenderPhone.trim() || '+971500000000',
        address: 'Dubai, UAE',
        city: newSenderCity || 'Dubai',
        country: 'United Arab Emirates',
        dateAdded: new Date().toISOString().split('T')[0]
      };
      saveCustomer(newCust);
      finalSenderId = newCust.id;
      finalSenderName = newCust.name;
      finalSenderPhone = newCust.phone;
    } else {
      const cust = customers.find(c => c.id === selectedSenderId);
      finalSenderName = cust?.name || 'Customer';
      finalSenderPhone = cust?.phone || '';
    }

    let finalReceiverId = selectedReceiverId;
    let finalReceiverName = '';
    let finalReceiverPhone = '';
    let finalReceiverAddress = '';
    let finalReceiverCnic = '';
    let finalBankName = '';
    let finalBankAccount = '';
    let finalPayoutMethod: any = 'Cash';

    if (selectedChannel === 'easypaisa') {
      finalPayoutMethod = 'EasyPaisa';
      finalBankName = 'EasyPaisa (ایزی پیسہ)';
      finalBankAccount = newReceiverPhone.trim();
    } else if (selectedChannel === 'jazzcash') {
      finalPayoutMethod = 'JazzCash';
      finalBankName = 'JazzCash (جیز کیش)';
      finalBankAccount = newReceiverPhone.trim();
    } else if (selectedChannel === 'nayapay') {
      finalPayoutMethod = 'NayaPay';
      finalBankName = 'NayaPay (نیا پیسہ)';
      finalBankAccount = bankAccount.trim() || newReceiverPhone.trim();
    } else if (selectedChannel === 'sadapay') {
      finalPayoutMethod = 'SadaPay';
      finalBankName = 'SadaPay (سدا پیسہ)';
      finalBankAccount = bankAccount.trim() || newReceiverPhone.trim();
    } else if (selectedChannel === 'raast') {
      finalPayoutMethod = 'Raast';
      finalBankName = 'Raast ID (راست)';
      finalBankAccount = bankAccount.trim() || newReceiverPhone.trim();
    } else if (selectedChannel === 'bank') {
      finalPayoutMethod = 'Bank Transfer';
      finalBankName = bankName || 'Meezan Bank میزان بینک';
      finalBankAccount = bankAccount.trim();
    } else {
      finalPayoutMethod = 'Hawala / Station Counter';
      finalBankName = '';
      finalBankAccount = '';
    }

    if (receiverMode === 'new' && newReceiverName.trim()) {
      finalReceiverAddress = newReceiverAddress.trim();
      finalReceiverCnic = newReceiverCnic.trim();

      const newRec: Receiver = {
        id: `rec-${Date.now()}`,
        customerId: finalSenderId,
        name: newReceiverName.trim(),
        phone: newReceiverPhone.trim() || '03000000000',
        address: finalReceiverAddress || 'Pakistan',
        city: 'Pakistan',
        station: station.trim() || 'میرعلی',
        cnic: finalReceiverCnic,
        bankName: finalBankName,
        accountNumber: finalBankAccount,
        payoutMethod: finalPayoutMethod,
        country: 'Pakistan'
      };
      saveReceiver(newRec);
      finalReceiverId = newRec.id;
      finalReceiverName = newRec.name;
      finalReceiverPhone = newRec.phone;
    } else {
      const rec = receivers.find(r => r.id === selectedReceiverId);
      finalReceiverName = rec?.name || 'Receiver';
      finalReceiverPhone = rec?.phone || '';
      finalReceiverAddress = rec?.address || '';
      finalReceiverCnic = rec?.cnic || '';
      finalBankName = rec?.bankName || bankName;
      finalBankAccount = rec?.accountNumber || bankAccount;
      finalPayoutMethod = rec?.payoutMethod || finalPayoutMethod;
    }

    let status: TransferStatus = 'Received';
    if (numInitialPayoutPKR >= netPayablePKR) {
      status = 'Completed';
    } else if (numInitialPayoutPKR > 0) {
      status = 'Partially Paid';
    }

    const transferNote =
      fundingSource === 'amanat' && selectedAmanatAcc
        ? `${notes ? notes + ' — ' : ''}${
            language === 'ur'
              ? `پیسہ جمع کھاتہ (${selectedAmanatAcc.accountNo}) سے کٹوتی شدہ`
              : `Deducted from Cash Jamah Khata (${selectedAmanatAcc.accountNo})`
          }`
        : notes;

    let savedTransferRecord: MoneyTransfer;

    if (activeTransferToEdit) {
      // Editing existing transfer
      savedTransferRecord = {
        ...activeTransferToEdit,
        senderId: finalSenderId,
        senderName: finalSenderName,
        senderPhone: finalSenderPhone,
        senderCity: newSenderCity || 'Dubai',
        receiverId: finalReceiverId,
        receiverName: finalReceiverName,
        receiverPhone: finalReceiverPhone,
        receiverAddress: finalReceiverAddress,
        receiverCnic: finalReceiverCnic,
        station: station || 'میرعلی',
        payoutMethod: finalPayoutMethod,
        bankName: finalBankName,
        accountNumber: finalBankAccount,
        amountAED: numAmountAED,
        exchangeRate: numExchangeRate,
        amountPKR: Number(amountPKR),
        commissionType: 'percentage',
        commissionRate: numCommissionRate,
        commissionBase: 'AED',
        commissionAmount: Number(commissionAmount),
        totalCollectedAED: Number(totalCollectedAED),
        netPayablePKR: Number(netPayablePKR),
        amountPaidPKR: numInitialPayoutPKR,
        remainingBalancePKR: Number(remainingBalancePKR),
        status,
        notes: transferNote
      };

      savedTransferRecord = saveTransfer(savedTransferRecord);

      showToast(
        language === 'ur'
          ? `آرڈر #${savedTransferRecord.orderNumber} میں تبدیلیاں محفوظ ہو گئیں!`
          : `Order #${savedTransferRecord.orderNumber} updated successfully!`,
        'success'
      );
    } else {
      // New Transfer
      const orderNo = `${settings.orderNumberPrefix}${Math.floor(10 + Math.random() * 90)}-2026`;
      const receiptNo = `${settings.receiptPrefix}-${Math.floor(10000 + Math.random() * 90000)}`;

      savedTransferRecord = {
        id: `tr-${Date.now()}`,
        orderNumber: orderNo,
        receiptNumber: receiptNo,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        senderId: finalSenderId,
        senderName: finalSenderName,
        senderPhone: finalSenderPhone,
        senderCity: newSenderCity || 'Dubai',
        senderCountry: 'United Arab Emirates',
        receiverId: finalReceiverId,
        receiverName: finalReceiverName,
        receiverPhone: finalReceiverPhone,
        receiverAddress: finalReceiverAddress,
        receiverCnic: finalReceiverCnic,
        station: station || 'میرعلی',
        payoutMethod: finalPayoutMethod,
        bankName: finalBankName,
        accountNumber: finalBankAccount,
        amountAED: numAmountAED,
        exchangeRate: numExchangeRate,
        amountPKR: Number(amountPKR),
        commissionType: 'percentage',
        commissionRate: numCommissionRate,
        commissionBase: 'AED',
        commissionAmount: Number(commissionAmount),
        additionalCharges: 0,
        totalCollectedAED: Number(totalCollectedAED),
        netPayablePKR: Number(netPayablePKR),
        amountPaidPKR: Number(netPayablePKR),
        remainingBalancePKR: 0,
        payouts: [
          {
            id: `pay-${Date.now()}`,
            transferId: `tr-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            receiverName: finalReceiverName,
            amountPKR: Number(netPayablePKR),
            paymentMethod: finalPayoutMethod,
            station: station || 'میرعلی',
            receiptNo: `PAY-${orderNo}`,
            notes: 'Station transfer payout order'
          }
        ],
        status: 'Completed',
        notes: transferNote,
        createdAt: new Date().toISOString()
      };

      savedTransferRecord = saveTransfer(savedTransferRecord);

      // Automatically deduct from Customer's Saved Amanat Khata if funded from Amanat
      if (fundingSource === 'amanat' && selectedAmanatAcc && amanatDeductionInAccountCurrency > 0) {
        recordAmanatEntry(selectedAmanatAcc.id, {
          accountId: selectedAmanatAcc.id,
          date: new Date().toISOString().split('T')[0],
          type: 'third_party_payment',
          amount: Number(amanatDeductionInAccountCurrency),
          currency: selectedAmanatAcc.currency,
          description:
            language === 'ur'
              ? `منی ٹرانسفر آرڈر #${orderNo} (${station || 'میرعلی'}) کے لیے پیسہ جمع سے خودکار کٹوتی`
              : `Auto-deducted for Money Transfer Order #${orderNo} (${station || 'Mirali'})`,
          relatedPerson: `${finalReceiverName} (${finalReceiverPhone})`,
          receiptNo
        });
      }

      showToast(
        language === 'ur'
          ? `منی ٹرانسفر آرڈر #${savedTransferRecord.orderNumber} محفوظ ہو گیا!`
          : `Money transfer order #${savedTransferRecord.orderNumber} saved successfully!`,
        'success'
      );
    }

    onClose();

    if (printImmediately) {
      openReceipt({
        format: 'A',
        transfer: savedTransferRecord
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-2 sm:p-4 md:py-6 overflow-y-auto"
      dir={language === 'ur' ? 'rtl' : 'ltr'}
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full my-auto max-h-[92vh] sm:max-h-[88vh] overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-lg font-urdu-heading">
              {activeTransferToEdit
                ? (language === 'ur'
                    ? `منی ٹرانسفر میں ترمیم (آرڈر #${activeTransferToEdit.orderNumber})`
                    : `Edit Money Transfer (Order #${activeTransferToEdit.orderNumber})`)
                : t('newTransfer')}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto max-h-[80vh] space-y-6">
          {/* Step 1: Sender (Dubai) & Funding Source */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1. {t('sender')} (Dubai, UAE)
              </label>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSenderMode('existing');
                    setFundingSource('cash');
                  }}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    senderMode === 'existing' && fundingSource === 'cash'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {language === 'ur' ? 'موجودہ گاہک (نقد)' : 'Existing Customer (Cash)'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSenderMode('new');
                    setFundingSource('cash');
                  }}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    senderMode === 'new' && fundingSource === 'cash'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  + {language === 'ur' ? 'نیا گاہک' : 'New Customer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSenderMode('amanat');
                    setFundingSource('amanat');
                  }}
                  className={`px-2.5 py-1 rounded-md font-bold transition ${
                    fundingSource === 'amanat'
                      ? 'bg-cyan-700 text-white shadow-sm'
                      : 'bg-cyan-50 text-cyan-900 border border-cyan-300 hover:bg-cyan-100'
                  }`}
                >
                  {language === 'ur' ? 'پیسہ جمع کھاتہ سے ٹرانسفر' : 'From Saved Cash Jamah'}
                </button>
              </div>
            </div>

            {fundingSource === 'amanat' ? (
              <div className="bg-cyan-50/70 border border-cyan-200 rounded-xl p-3.5 space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    {language === 'ur'
                      ? 'گاہک کا پیسہ جمع کھاتہ منتخب کریں (خودکار کھاتہ کٹوتی):'
                      : 'Select Customer Saved Cash Jamah Khata (Auto-Deduct):'}
                  </label>
                  <select
                    value={selectedAmanatId}
                    onChange={e => {
                      const id = e.target.value;
                      setSelectedAmanatId(id);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-slate-950"
                  >
                    {amanatAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.ownerName} ({acc.accountNo}) — {language === 'ur' ? 'موجودہ پیسہ جمع:' : 'Balance:'}{' '}
                        {acc.currentBalance.toLocaleString()} {acc.currency}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : senderMode === 'existing' ? (
              <div>
                <select
                  value={selectedSenderId}
                  onChange={e => setSelectedSenderId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) - {c.customerCode}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 block mb-1">{t('senderName')} *</label>
                  <input
                    type="text"
                    value={newSenderName}
                    onChange={e => setNewSenderName(e.target.value)}
                    placeholder={language === 'ur' ? 'نام' : 'Name'}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-1">{t('senderPhone')}</label>
                  <input
                    type="text"
                    value={newSenderPhone}
                    onChange={e => setNewSenderPhone(e.target.value)}
                    placeholder={language === 'ur' ? 'موبائل نمبر' : 'Mobile Number'}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Receiver (Pakistan) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                2. {t('receiver')} (Pakistan)
              </label>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setReceiverMode('existing')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    receiverMode === 'existing' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {language === 'ur' ? 'موجودہ وصول کنندہ' : 'Existing Receiver'}
                </button>
                <button
                  type="button"
                  onClick={() => setReceiverMode('new')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    receiverMode === 'new' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  + {language === 'ur' ? 'نیا وصول کنندہ' : 'New Receiver'}
                </button>
              </div>
            </div>

            {/* Payout Channel Quick Options (Bank, EasyPaisa, JazzCash, NayaPay, SadaPay, Raast, Cash) */}
            <div className="pt-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-700 font-bold font-urdu-heading">
                  {language === 'ur' ? 'طریقہ ترسیل (Transfer Via Bank, EasyPaisa, JazzCash, Counter):' : 'Transfer Via (Bank, EasyPaisa, JazzCash, Counter):'}
                </label>
                <button
                  type="button"
                  onClick={() => setIsStationModalOpen(true)}
                  className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 font-urdu"
                >
                  <Plus className="w-3 h-3" />
                  <span>{language === 'ur' ? '+ نیا اسٹیشن' : '+ New Station'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedChannel('mirali');
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-center transition flex items-center justify-center gap-1.5 ${
                    selectedChannel === 'mirali'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>💵</span>
                  <span>{language === 'ur' ? 'کاؤنٹر نقد کیش' : 'Counter Cash'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedChannel('easypaisa');
                    setBankName('EasyPaisa (ایزی پیسہ)');
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-center transition flex items-center justify-center gap-1.5 ${
                    selectedChannel === 'easypaisa'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                      : 'bg-white text-emerald-900 border-slate-300 hover:bg-emerald-50'
                  }`}
                >
                  <span>📱</span>
                  <span>EasyPaisa (ایزی پیسہ)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedChannel('jazzcash');
                    setBankName('JazzCash (جیز کیش)');
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-center transition flex items-center justify-center gap-1.5 ${
                    selectedChannel === 'jazzcash'
                      ? 'bg-red-700 text-white border-red-700 shadow-sm'
                      : 'bg-white text-red-900 border-slate-300 hover:bg-red-50'
                  }`}
                >
                  <span>📱</span>
                  <span>JazzCash (جیز کیش)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedChannel('bank');
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-center transition flex items-center justify-center gap-1.5 ${
                    selectedChannel === 'bank'
                      ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
                      : 'bg-white text-blue-900 border-slate-300 hover:bg-blue-50'
                  }`}
                >
                  <span>🏦</span>
                  <span>{language === 'ur' ? 'بینک ٹرانسفر (Bank)' : 'Bank Transfer'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedChannel('nayapay');
                    setBankName('NayaPay (نیا پیسہ)');
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-center transition flex items-center justify-center gap-1.5 ${
                    selectedChannel === 'nayapay'
                      ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                      : 'bg-white text-orange-900 border-slate-300 hover:bg-orange-50'
                  }`}
                >
                  <span>💳</span>
                  <span>NayaPay (نیا پیسہ)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedChannel('sadapay');
                    setBankName('SadaPay (سدا پیسہ)');
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-center transition flex items-center justify-center gap-1.5 ${
                    selectedChannel === 'sadapay'
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-white text-teal-900 border-slate-300 hover:bg-teal-50'
                  }`}
                >
                  <span>💳</span>
                  <span>SadaPay (سدا پیسہ)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedChannel('raast');
                    setBankName('Raast ID (راست)');
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-center transition flex items-center justify-center gap-1.5 ${
                    selectedChannel === 'raast'
                      ? 'bg-indigo-700 text-white border-indigo-700 shadow-sm'
                      : 'bg-white text-indigo-900 border-slate-300 hover:bg-indigo-50'
                  }`}
                >
                  <span>⚡</span>
                  <span>Raast (راست)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedChannel('other');
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-center transition flex items-center justify-center gap-1.5 ${
                    selectedChannel === 'other'
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>📍</span>
                  <span>{language === 'ur' ? 'دیگر ذریعہ' : 'Other Channel'}</span>
                </button>
              </div>
            </div>

            {receiverMode === 'existing' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs text-slate-700 block mb-1 font-semibold">{t('receiver')}</label>
                  <select
                    value={selectedReceiverId}
                    onChange={e => handleSelectReceiver(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-medium"
                  >
                    {receivers.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.phone}) [{r.station}] {r.bankName ? `- ${r.bankName}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-slate-700 font-semibold">{t('station')}</label>
                    <button
                      type="button"
                      onClick={() => setIsStationModalOpen(true)}
                      className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold"
                    >
                      + {language === 'ur' ? 'نیا اسٹیشن' : 'New Station'}
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <select
                      value={station}
                      onChange={e => setStation(e.target.value)}
                      className="flex-1 bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-urdu-heading font-bold"
                    >
                      {stations.map(st => (
                        <option key={st.id} value={st.nameUr}>
                          {st.nameUr || st.nameEn} - {language === 'ur' ? 'کیش بیلنس:' : 'Balance:'} {formatMoney(st.currentBalancePKR || 0, 'PKR')}
                        </option>
                      ))}
                      {!stations.some(s => s.nameUr === station) && station && (
                        <option value={station}>{station}</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-700 block mb-1 font-bold">
                      {selectedChannel === 'bank' ? 'اکاؤنٹ ہولڈر کا نام (Account Title) *' : `${t('receiverName')} *`}
                    </label>
                    <input
                      type="text"
                      value={newReceiverName}
                      onChange={e => setNewReceiverName(e.target.value)}
                      placeholder={language === 'ur' ? 'نام' : 'Name'}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-bold font-urdu-body"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-700 block mb-1 font-bold">
                      {selectedChannel === 'easypaisa'
                        ? 'ایزی پیسہ موبائل نمبر (EasyPaisa Mobile No) *'
                        : selectedChannel === 'jazzcash'
                        ? 'جیز کیش موبائل نمبر (JazzCash Mobile No) *'
                        : selectedChannel === 'nayapay'
                        ? 'نیا پیسہ والٹ نمبر (NayaPay Mobile No) *'
                        : selectedChannel === 'sadapay'
                        ? 'سدا پیسہ والٹ نمبر (SadaPay Mobile No) *'
                        : t('receiverPhone')}
                    </label>
                    <input
                      type="text"
                      value={newReceiverPhone}
                      onChange={e => setNewReceiverPhone(e.target.value)}
                      placeholder={language === 'ur' ? 'موبائل نمبر' : 'Mobile Number'}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-slate-800 font-bold font-urdu-heading">
                        {language === 'ur' ? 'وصولی اسٹیشن / کاؤنٹر (Destination Station) *' : 'Destination Station *'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsStationModalOpen(true)}
                        className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold"
                      >
                        + {language === 'ur' ? 'نیا اسٹیشن' : 'New Station'}
                      </button>
                    </div>
                    <select
                      value={station}
                      onChange={e => setStation(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-urdu-heading font-bold"
                    >
                      {stations.map(st => (
                        <option key={st.id} value={st.nameUr}>
                          {st.nameUr || st.nameEn}
                        </option>
                      ))}
                      {!stations.some(s => s.nameUr === station) && station && (
                        <option value={station}>{station}</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-700 block mb-1 font-semibold">
                      شناختی کارڈ نمبر (Receiver CNIC / ID No)
                    </label>
                    <input
                      type="text"
                      value={newReceiverCnic}
                      onChange={e => setNewReceiverCnic(e.target.value)}
                      placeholder={language === 'ur' ? 'شناختی کارڈ نمبر' : 'CNIC Number'}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-700 block mb-1 font-semibold">
                    وصول کنندہ کا پتہ / شہر (Address & City)
                  </label>
                  <input
                    type="text"
                    value={newReceiverAddress}
                    onChange={e => setNewReceiverAddress(e.target.value)}
                    placeholder={language === 'ur' ? 'پتہ' : 'Address'}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-sm"
                  />
                </div>

                {/* Bank / Wallet Details Bar */}
                {(selectedChannel === 'bank' || selectedChannel === 'nayapay' || selectedChannel === 'sadapay' || selectedChannel === 'raast' || selectedChannel === 'other') && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-blue-50/70 p-3 rounded-xl border border-blue-200">
                    <div>
                      <label className="text-xs text-slate-800 block mb-1 font-bold">
                        {language === 'ur' ? 'محفوظ بینک منتخب کریں:' : 'Select Saved Bank:'}
                      </label>
                      <select
                        value={savedBanks.includes(bankName) ? bankName : ''}
                        onChange={e => {
                          if (e.target.value) setBankName(e.target.value);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-900"
                      >
                        <option value="">{language === 'ur' ? '-- فہرست سے منتخب کریں --' : '-- Choose from saved --'}</option>
                        {savedBanks.map(b => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-slate-800 font-bold">
                          {language === 'ur' ? 'بینک نام (خود لکھیں / ترمیم):' : 'Bank Name (Manual / Edit):'}
                        </label>
                        {bankName.trim() && !savedBanks.includes(bankName.trim()) && (
                          <button
                            type="button"
                            onClick={() => addSavedBank(bankName.trim())}
                            className="text-[10px] font-bold text-blue-700 hover:underline cursor-pointer"
                          >
                            + {language === 'ur' ? 'فہرست میں محفوظ کریں' : 'Save to list'}
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={bankName}
                        onChange={e => setBankName(e.target.value)}
                        placeholder={language === 'ur' ? 'بینک کا نام لکھیں یا ترمیم کریں' : 'Type or edit bank name'}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-950"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-800 block mb-1 font-bold">
                        اکاؤنٹ نمبر / IBAN / والیٹ ID (Account or IBAN)
                      </label>
                      <input
                        type="text"
                        value={bankAccount}
                        onChange={e => setBankAccount(e.target.value)}
                        placeholder={language === 'ur' ? 'اکاؤنٹ نمبر' : 'Account Number'}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono font-bold"
                      />
                    </div>
                  </div>
                )}

                {/* Receiver Slip Preview Box */}
                <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 text-xs shadow-inner">
                  <span className="text-blue-300 block text-[11px] font-bold mb-1 uppercase tracking-wider">
                    📋 {language === 'ur' ? 'رسید پر پیش نظارہ (Preview on Official Printed Receipt):' : 'Official Receipt Slip Preview:'}
                  </span>
                  <div className="space-y-1 font-urdu-heading">
                    <p className="text-sm font-bold text-emerald-400">
                      {newReceiverName.trim() || 'نام وصول کنندہ'}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-slate-300 text-[11px] font-mono">
                      {newReceiverPhone && <span>📱 {newReceiverPhone}</span>}
                      {newReceiverCnic && <span>🪪 CNIC: {newReceiverCnic}</span>}
                      {newReceiverAddress && <span>📍 {newReceiverAddress}</span>}
                      <span className="text-amber-300 font-bold">🏢 {station}</span>
                    </div>
                    {(selectedChannel === 'bank' || selectedChannel === 'easypaisa' || selectedChannel === 'jazzcash' || selectedChannel === 'nayapay' || selectedChannel === 'sadapay' || selectedChannel === 'raast') && (
                      <p className="text-xs text-cyan-300 font-semibold pt-1 border-t border-slate-800">
                        💳 {bankName} {bankAccount ? `| Account/IBAN: ${bankAccount}` : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Financial Calculations */}
          <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-200/90 space-y-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-700" />
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                3. {language === 'ur' ? 'مالیاتی حساب کتاب اور شرح تبادلہ' : 'Financial & Exchange Calculations'}
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">{t('amountAed')} *</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amountAED}
                  onChange={e => {
                    const cleaned = normalizeNumericInput(e.target.value);
                    setAmountAED(cleaned);
                  }}
                  placeholder="e.g. 1000"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">{t('exchangeRate')} *</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={exchangeRate}
                  onChange={e => {
                    const cleaned = normalizeNumericInput(e.target.value);
                    setExchangeRate(cleaned);
                  }}
                  placeholder="e.g. 77.50"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">{t('commissionPercentage')}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={commissionRate}
                  onChange={e => {
                    const cleaned = normalizeNumericInput(e.target.value);
                    setCommissionRate(cleaned);
                  }}
                  placeholder="0"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm font-mono"
                />
              </div>
            </div>

            {/* Calculated Breakdown Card */}
            <div className="bg-white p-3.5 rounded-lg border border-emerald-200/80 text-xs sm:text-sm space-y-2">
              <div className="flex justify-between items-center text-slate-600">
                <span>{t('pkrEquivalent')}:</span>
                <span className="font-mono font-semibold text-slate-900 text-base">
                  {amountPKR.toLocaleString()} PKR
                </span>
              </div>
              {commissionAmount > 0 && (
                <>
                  <div className="flex justify-between items-center text-rose-600 text-xs font-semibold">
                    <span>
                      {language === 'ur'
                        ? `کمیشن کٹوتی (${numCommissionRate}% منہا):`
                        : `Commission Deducted (${numCommissionRate}% less):`}
                    </span>
                    <span className="font-mono font-bold">- {commissionAmount} AED</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 pb-1 border-t border-dashed border-slate-200">
                    <span className="text-slate-500 font-medium">
                      {language === 'ur' ? 'پاکستانی رقم کا حساب:' : 'Calculate PKR from:'}
                    </span>
                    <div className="inline-flex rounded-md border border-slate-300 p-0.5 bg-slate-50">
                      <button
                        type="button"
                        onClick={() => setPkrCalculationBasis('gross')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                          pkrCalculationBasis === 'gross'
                            ? 'bg-emerald-700 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {language === 'ur'
                          ? `مکمل رقم ${numAmountAED} درہم (${Math.round(numAmountAED * numExchangeRate).toLocaleString()} PKR)`
                          : `Full ${numAmountAED} AED`}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPkrCalculationBasis('net')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                          pkrCalculationBasis === 'net'
                            ? 'bg-emerald-700 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {language === 'ur'
                          ? `منہا رقم ${totalCollectedAED} درہم (${Math.round(totalCollectedAED * numExchangeRate).toLocaleString()} PKR)`
                          : `Net ${totalCollectedAED} AED`}
                      </button>
                    </div>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center border-t border-slate-200 pt-2 text-emerald-800 font-bold">
                <span>{t('netPayablePkr')}:</span>
                <span className="font-mono text-lg">{netPayablePKR.toLocaleString()} PKR</span>
              </div>
              <div className="flex justify-between items-center text-slate-800 text-xs font-bold bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-300">
                <div>
                  <span className="block text-slate-900">
                    {language === 'ur'
                      ? 'کل وصول شدہ / خالص درہم (منہا کٹوتی کے بعد):'
                      : 'Total Collected (AED):'}
                  </span>
                  {commissionAmount > 0 && (
                    <span className="text-[10px] text-slate-500 font-normal">
                      ({numAmountAED} AED - {commissionAmount} AED = {totalCollectedAED} AED)
                    </span>
                  )}
                </div>
                <span className="font-mono font-black text-base text-emerald-950">{totalCollectedAED} AED</span>
              </div>

              {/* Live Station Running Balance Deduction Summary */}
              {selectedStationObj && (
                <div
                  className={`mt-2 pt-2.5 border-t p-3.5 rounded-lg space-y-1.5 ${
                    stationNewBalance < 0
                      ? 'border-rose-300 bg-rose-50/80 text-rose-950'
                      : 'border-blue-200 bg-blue-50/60 text-slate-900'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold">
                      {language === 'ur'
                        ? `اسٹیشن (${selectedStationObj.nameUr || selectedStationObj.nameEn}) کا سابقہ بقایا:`
                        : `Station (${selectedStationObj.nameEn || selectedStationObj.nameUr}) Previous Balance:`}
                    </span>
                    <strong
                      className={`font-mono font-black ${
                        stationPrevBalance < 0 ? 'text-red-700' : 'text-slate-900'
                      }`}
                      dir="ltr"
                    >
                      {stationPrevBalance.toLocaleString()} PKR{' '}
                      {stationPrevBalance < 0 ? (language === 'ur' ? '(منفی)' : '(Minus)') : (language === 'ur' ? '(جمع)' : '(Credit)')}
                    </strong>
                  </div>
                  {netPayablePKR > 0 && (
                    <>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-700 font-semibold">
                          {language === 'ur' ? 'اس ٹرانسفر کی کٹوتی (Payout Deduction):' : 'Transfer Amount Deducted:'}
                        </span>
                        <strong className="font-mono text-amber-800 font-black" dir="ltr">
                          -{netPayablePKR.toLocaleString()} PKR
                        </strong>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/80">
                        <span className="font-bold">
                          {language === 'ur' ? 'ٹرانسفر کے بعد اسٹیشن موجودہ بقایا:' : 'Remaining Station Balance:'}
                        </span>
                        <strong
                          className={`font-mono text-sm font-black ${
                            stationNewBalance < 0 ? 'text-red-700' : 'text-emerald-800'
                          }`}
                          dir="ltr"
                        >
                          {stationNewBalance.toLocaleString()} PKR{' '}
                          {stationNewBalance < 0
                            ? (language === 'ur' ? '(منفی / اسٹیشن اپنے پاس سے ادا کرے گا)' : '(Minus / Station Pays)')
                            : (language === 'ur' ? '(جمع بقایا)' : '(Available)')}
                        </strong>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Amanat Auto-Deduction Summary when funded from Amanat */}
              {fundingSource === 'amanat' && selectedAmanatAcc && (
                <div className="mt-2 pt-2.5 border-t border-cyan-200 bg-cyan-50/70 -mx-3.5 -mb-3.5 p-3.5 rounded-b-lg space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-700 font-semibold">
                      {language === 'ur' ? 'پیسہ جمع کھاتہ سے کٹوتی:' : 'Deducting from Cash Jamah Khata:'}
                    </span>
                    <strong className="font-mono text-rose-700 font-black">
                      - {amanatDeductionInAccountCurrency.toLocaleString()} {selectedAmanatAcc.currency}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-900 font-bold">
                      {language === 'ur' ? 'کٹوتی کے بعد بقایا پیسہ جمع بیلنس:' : 'Remaining Cash Jamah Balance:'}
                    </span>
                    <strong
                      className={`font-mono text-sm font-black ${
                        isAmanatInsufficient ? 'text-red-600' : 'text-emerald-800'
                      }`}
                    >
                      {(selectedAmanatAcc.currentBalance - amanatDeductionInAccountCurrency).toLocaleString()}{' '}
                      {selectedAmanatAcc.currency}
                    </strong>
                  </div>
                </div>
              )}
              {/* End of Financial Calculations */}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 shrink-0">
          <div>
            {activeTransferToEdit && isSuperAdmin && (
              <button
                type="button"
                onClick={handleDeleteTransfer}
                className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  confirmDelete
                    ? 'bg-red-600 hover:bg-red-700 text-white border border-red-700'
                    : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                }`}
                title={language === 'ur' ? 'آرڈر حذف کریں (صرف سپر ایڈمن)' : 'Delete Transfer Order (Super Admin Only)'}
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {confirmDelete
                    ? (language === 'ur' ? 'تصدیق حذف کریں؟' : 'Confirm Delete?')
                    : t('delete')}
                </span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              disabled={isAmanatInsufficient}
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-lg text-xs sm:text-sm font-semibold transition shadow-sm cursor-pointer"
            >
              {activeTransferToEdit ? (language === 'ur' ? 'تبدیلیاں محفوظ کریں' : 'Save Changes') : t('save')}
            </button>
            <button
              type="button"
              disabled={isAmanatInsufficient}
              onClick={() => handleSubmit(true)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg text-xs sm:text-sm font-semibold transition shadow-sm cursor-pointer"
            >
              {language === 'ur' ? 'محفوظ کریں اور پرنٹ رسید' : 'Save & Print Receipt'}
            </button>
          </div>
        </div>
      </div>

      <StationModal
        isOpen={isStationModalOpen}
        onClose={() => setIsStationModalOpen(false)}
      />
    </div>
  );
};
