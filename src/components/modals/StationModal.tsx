/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Station, StationCategory } from '../../types';
import { X, Building2, MapPin, Phone, User, Tag, CheckCircle2, ShieldAlert, ArrowLeft } from 'lucide-react';

interface StationModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationToEdit?: Station | null;
  onStationCreated?: (station: Station) => void;
  returnToLabel?: string;
}

const COMMON_URDU_SUGGESTIONS = [
  { ur: 'میرعلی', en: 'Mir Ali', cat: 'counter' as StationCategory, city: 'North Waziristan' },
  { ur: 'ایزی پیسہ', en: 'EasyPaisa', cat: 'wallet' as StationCategory, city: 'All Pakistan' },
  { ur: 'جیز کیش', en: 'JazzCash', cat: 'wallet' as StationCategory, city: 'All Pakistan' },
  { ur: 'بینک ٹرانسفر', en: 'Bank Transfer', cat: 'bank' as StationCategory, city: 'All Pakistan' },
  { ur: 'بنوں', en: 'Bannu', cat: 'branch' as StationCategory, city: 'Bannu' },
  { ur: 'پشاور', en: 'Peshawar', cat: 'branch' as StationCategory, city: 'Peshawar' },
  { ur: 'میرانشاہ', en: 'Miranshah', cat: 'counter' as StationCategory, city: 'North Waziristan' },
  { ur: 'ڈیرہ اسماعیل خان', en: 'Dera Ismail Khan', cat: 'branch' as StationCategory, city: 'D.I. Khan' },
  { ur: 'کوہاٹ', en: 'Kohat', cat: 'branch' as StationCategory, city: 'Kohat' },
  { ur: 'کراچی', en: 'Karachi', cat: 'branch' as StationCategory, city: 'Karachi' },
  { ur: 'لاہور', en: 'Lahore', cat: 'branch' as StationCategory, city: 'Lahore' },
  { ur: 'راولپنڈی / اسلام آباد', en: 'Rawalpindi / Islamabad', cat: 'branch' as StationCategory, city: 'Rawalpindi' }
];

export const StationModal: React.FC<StationModalProps> = ({
  isOpen,
  onClose,
  stationToEdit,
  onStationCreated,
  returnToLabel
}) => {
  const { saveStation, stations, language, settings } = useApp();

  const [code, setCode] = useState('');
  const [nameUr, setNameUr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState<StationCategory>('counter');
  const [city, setCity] = useState('');
  const [inCharge, setInCharge] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [notes, setNotes] = useState('');
  const [balanceInputPKR, setBalanceInputPKR] = useState('');
  const [balanceInputAED, setBalanceInputAED] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const defaultRate = settings.defaultExchangeRate || 77.5;

  useEffect(() => {
    if (stationToEdit) {
      setCode(stationToEdit.code || '');
      setNameUr(stationToEdit.nameUr || '');
      setNameEn(stationToEdit.nameEn || '');
      setCategory(stationToEdit.category || 'counter');
      setCity(stationToEdit.city || '');
      setInCharge(stationToEdit.inCharge || '');
      setPhone(stationToEdit.phone || '');
      setAddress(stationToEdit.address || '');
      setStatus(stationToEdit.status || 'active');
      setNotes(stationToEdit.notes || '');
      const existingBal = stationToEdit.currentBalancePKR ?? 0;
      setBalanceInputPKR(existingBal !== 0 ? String(existingBal) : '');
      setBalanceInputAED(existingBal !== 0 ? String(Math.round(existingBal / defaultRate)) : '');
    } else {
      const generatedCode = `ST-${String(stations.length + 1).padStart(2, '0')}`;
      setCode(generatedCode);
      setNameUr('');
      setNameEn('');
      setCategory('counter');
      setCity('');
      setInCharge('');
      setPhone('');
      setAddress('');
      setStatus('active');
      setNotes('');
      setBalanceInputPKR('');
      setBalanceInputAED('');
    }
    setErrorMsg('');
  }, [stationToEdit, isOpen, stations.length, defaultRate]);

  if (!isOpen) return null;

  const handleApplyPreset = (item: typeof COMMON_URDU_SUGGESTIONS[0]) => {
    setNameUr(item.ur);
    setNameEn(item.en);
    setCategory(item.cat);
    setCity(item.city);
    if (!stationToEdit) {
      const prefix = item.en.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
      setCode(`${prefix || 'ST'}-${String(stations.length + 1).padStart(2, '0')}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nameUr.trim() && !nameEn.trim()) {
      setErrorMsg(
        language === 'ur'
          ? 'اسٹیشن کا اردو یا انگریزی نام درج کرنا لازمی ہے!'
          : 'Please enter a station name in Urdu or English!'
      );
      return;
    }

    const cleanCode = code.trim().toUpperCase() || `ST-${Date.now().toString().slice(-4)}`;

    // Check code duplication for new stations
    if (!stationToEdit) {
      const exists = stations.some(s => s.code.toUpperCase() === cleanCode);
      if (exists) {
        setErrorMsg(
          language === 'ur'
            ? 'یہ اسٹیشن کوڈ پہلے سے زیرِ استعمال ہے!'
            : 'Station code already exists! Please use a unique code.'
        );
        return;
      }
    }

    const parsedBal = balanceInputPKR.trim() === '' ? 0 : parseFloat(balanceInputPKR);
    const targetBalancePKR = isNaN(parsedBal) ? 0 : Math.round(parsedBal);
    const oldBalancePKR = stationToEdit?.currentBalancePKR || 0;
    let updatedEntries = [...(stationToEdit?.entries || [])];

    // If balance was manually changed or initial balance provided, record an adjustment entry if needed
    if (targetBalancePKR !== oldBalancePKR) {
      const diff = targetBalancePKR - oldBalancePKR;
      const isCredit = diff > 0;
      const absDiff = Math.abs(diff);
      updatedEntries = [
        {
          id: `st-adj-${Date.now()}`,
          receiptNo: `ADJ-${Math.floor(10000 + Math.random() * 90000)}`,
          stationId: stationToEdit ? stationToEdit.id : `st-${Date.now()}`,
          stationNameUr: nameUr.trim() || nameEn.trim(),
          date: new Date().toISOString().split('T')[0],
          type: isCredit ? 'deposit_topup' : 'adjustment',
          amountPKR: absDiff,
          amountAED: Math.round(absDiff / defaultRate),
          exchangeRate: defaultRate,
          previousBalancePKR: oldBalancePKR,
          newBalancePKR: targetBalancePKR,
          description: stationToEdit
            ? 'اسٹیشن بیلنس مینوئل ایڈجسٹمنٹ / تصحیح (Manual Balance Edit)'
            : 'اسٹیشن ابتدائی کاؤنٹر بیلنس (Opening Balance)',
          referenceNo: `BAL-EDIT-${Date.now().toString().slice(-4)}`,
          relatedParty: 'Admin Manual Edit',
          paymentMethod: 'Cash',
          createdAt: new Date().toISOString()
        },
        ...updatedEntries
      ];
    }

    const savedStation: Station = {
      id: stationToEdit ? stationToEdit.id : `st-${Date.now()}`,
      code: cleanCode,
      nameUr: nameUr.trim() || nameEn.trim(),
      nameEn: nameEn.trim() || nameUr.trim(),
      category,
      city: city.trim() || (category === 'wallet' ? 'All Pakistan' : 'Pakistan'),
      inCharge: inCharge.trim(),
      phone: phone.trim(),
      address: address.trim(),
      status,
      notes: notes.trim(),
      createdAt: stationToEdit?.createdAt || new Date().toISOString(),
      currentBalancePKR: targetBalancePKR,
      entries: updatedEntries
    };

    saveStation(savedStation);
    if (onStationCreated) {
      onStationCreated(savedStation);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Header with Prominent Back Option */}
        <div className="bg-slate-900 px-5 sm:px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-slate-700 shrink-0"
              title={returnToLabel || (language === 'ur' ? 'واپس جائیں' : 'Back')}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{returnToLabel || (language === 'ur' ? 'واپس جائیں' : 'Back')}</span>
            </button>
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-white border border-slate-700 shrink-0">
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold font-montserrat tracking-tight text-white flex items-center gap-2">
                <span>{stationToEdit ? (language === 'ur' ? 'اسٹیشن میں ترمیم کریں' : 'Edit Station') : (language === 'ur' ? 'نیا اسٹیشن شامل کریں' : 'Add New Station')}</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-300 font-urdu">
                {language === 'ur'
                  ? 'نیا وصولی اسٹیشن یا کاؤنٹر درج کریں'
                  : 'Add delivery station or payout counter'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-red-900">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Preset Badges */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              {language === 'ur' ? 'مشہور اسٹیشنز کی تیز تر تجاویز (فوری انتخاب):' : 'Quick Suggestions (Click to fill):'}
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
              {COMMON_URDU_SUGGESTIONS.map((s, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleApplyPreset(s)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-900 hover:text-white hover:border-slate-900 font-urdu font-medium text-slate-800 transition shadow-2xs"
                >
                  {s.ur} <span className="text-[10px] opacity-70">({s.en})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Station Name (Standard Single Name) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 font-urdu-heading">
                {language === 'ur' ? 'اسٹیشن / جگہ کا نام (Station Name) *' : 'Station Name / Place *'}
              </label>
              <input
                type="text"
                value={nameUr}
                onChange={e => {
                  setNameUr(e.target.value);
                  if (!nameEn || nameEn === nameUr) {
                    setNameEn(e.target.value);
                  }
                }}
                placeholder={language === 'ur' ? 'اسٹیشن کا نام' : 'Station Name'}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-urdu font-bold focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
                required
              />
            </div>

            {/* Station Name English / Secondary Sync */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {language === 'ur' ? 'انگریزی نام (اختیاری)' : 'English Label (Optional)'}
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={e => setNameEn(e.target.value)}
                placeholder={language === 'ur' ? 'انگریزی نام' : 'English Label'}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Station Code */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {language === 'ur' ? 'اسٹیشن کوڈ' : 'Station Code'}
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder={language === 'ur' ? 'اسٹیشن کوڈ' : 'Station Code'}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-mono font-bold uppercase focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 font-urdu-heading">
                {language === 'ur' ? 'طریقہ ترسیل / قسم' : 'Transfer Method / Category'}
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as StationCategory)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
              >
                <option value="counter">{language === 'ur' ? 'کاؤنٹر / کیش ڈیسک' : 'Cash Counter / Desk'}</option>
                <option value="wallet">{language === 'ur' ? 'ٹرانسفر بذریعہ ایزی پیسہ / جیز کیش' : 'Transfer via EasyPaisa / JazzCash'}</option>
                <option value="bank">{language === 'ur' ? 'ٹرانسفر بذریعہ بینک' : 'Transfer via Bank'}</option>
                <option value="branch">{language === 'ur' ? 'مین برانچ / دفتر' : 'Main Branch / Office'}</option>
              </select>
            </div>

            {/* City / District */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {language === 'ur' ? 'شہر / علاقہ' : 'City / Region'}
              </label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder={language === 'ur' ? 'شہر / علاقہ' : 'City / Region'}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {/* In-Charge Person */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {language === 'ur' ? 'انچارج / رابطہ کار' : 'In-Charge / Manager'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inCharge}
                  onChange={e => setInCharge(e.target.value)}
                  placeholder={language === 'ur' ? 'مینیجر کا نام' : 'Manager Name'}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {language === 'ur' ? 'رابطہ فون نمبر' : 'Contact Phone'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder={language === 'ur' ? 'رابطہ نمبر' : 'Contact'}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-mono font-medium focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Physical Address / Location details */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              {language === 'ur' ? 'مقام / پتہ کی تفصیلات' : 'Physical Address / Counter Location'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder={language === 'ur' ? 'پتہ' : 'Address'}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {language === 'ur' ? 'اسٹیشن کی حالت' : 'Station Status'}
              </label>
              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-300">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-800">
                  <input
                    type="radio"
                    name="stationStatus"
                    value="active"
                    checked={status === 'active'}
                    onChange={() => setStatus('active')}
                    className="accent-slate-900 w-4 h-4"
                  />
                  <span>{language === 'ur' ? 'فعال (Active)' : 'Active'}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600">
                  <input
                    type="radio"
                    name="stationStatus"
                    value="inactive"
                    checked={status === 'inactive'}
                    onChange={() => setStatus('inactive')}
                    className="accent-slate-900 w-4 h-4"
                  />
                  <span>{language === 'ur' ? 'غیر فعال (Inactive)' : 'Inactive'}</span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {language === 'ur' ? 'اضافی نوٹس' : 'Notes / Instructions'}
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={language === 'ur' ? 'نوٹس' : 'Notes'}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
              />
            </div>
          </div>

          {/* Station Opening / Current Balance Edit Box (PKR & AED) */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1 font-urdu-heading">
                {stationToEdit
                  ? language === 'ur'
                    ? 'موجودہ کاؤنٹر بیلنس ترمیم (PKR)'
                    : 'Adjust Current Balance (PKR)'
                  : language === 'ur'
                  ? 'ابتدائی کاؤنٹر بیلنس (Opening Balance PKR)'
                  : 'Opening Balance (PKR)'}
              </label>
              <input
                type="number"
                value={balanceInputPKR}
                onChange={e => {
                  const val = e.target.value;
                  setBalanceInputPKR(val);
                  if (val === '' || val === '-') {
                    setBalanceInputAED('');
                  } else {
                    const numPkr = parseFloat(val);
                    setBalanceInputAED(!isNaN(numPkr) && numPkr !== 0 ? String(Math.round(numPkr / defaultRate)) : '');
                  }
                }}
                placeholder={language === 'ur' ? 'رقم درج کریں (اختیاری)' : 'Enter balance (optional)'}
                className="w-full px-3.5 py-2 bg-white border border-emerald-300 rounded-xl text-slate-950 text-sm font-mono font-black focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1 font-urdu-heading">
                {language === 'ur'
                  ? `مساوی درہم بیلنس (AED @ ${defaultRate.toFixed(2)})`
                  : `Equivalent Dirham (AED @ ${defaultRate.toFixed(2)})`}
              </label>
              <input
                type="number"
                value={balanceInputAED}
                onChange={e => {
                  const val = e.target.value;
                  setBalanceInputAED(val);
                  if (val === '' || val === '-') {
                    setBalanceInputPKR('');
                  } else {
                    const numAed = parseFloat(val);
                    setBalanceInputPKR(!isNaN(numAed) && numAed !== 0 ? String(Math.round(numAed * defaultRate)) : '');
                  }
                }}
                placeholder={language === 'ur' ? 'درہم درج کریں (اختیاری)' : 'Enter AED (optional)'}
                className="w-full px-3.5 py-2 bg-white border border-emerald-300 rounded-xl text-blue-900 text-sm font-mono font-black focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer border border-slate-300"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{returnToLabel || (language === 'ur' ? 'واپس جائیں (منسوخ)' : 'Back / Cancel')}</span>
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-950 hover:bg-slate-900 text-white shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                {stationToEdit
                  ? (language === 'ur' ? 'اسٹیشن اپ ڈیٹ کریں' : 'Update Station')
                  : (language === 'ur' ? 'اسٹیشن محفوظ کریں' : 'Save Station')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
