/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { UserModal } from '../modals/UserModal';
import { StationModal } from '../modals/StationModal';
import { EagleStarLogo } from '../common/EagleStarLogo';
import { AppUser, UserRole, Station, CurrencyConfig } from '../../types';
import {
  Settings,
  Save,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  Building,
  Building2,
  MapPin,
  Plus,
  Phone,
  Calculator,
  FileText,
  ShieldCheck,
  UserPlus,
  KeyRound,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  UserCog,
  Star,
  Users,
  Lock,
  Search,
  Image as ImageIcon,
  Coins,
  TrendingUp,
  Check,
  Clock
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    updateManualAedRate,
    resetDemoData,
    clearAllData,
    showToast,
    t,
    language,
    setLanguage,
    currentUser,
    users,
    saveUser,
    deleteUser,
    isSuperAdmin,
    stations,
    deleteStation,
    updateStationStatus,
    transfers,
    formatMoney,
    refreshData
  } = useApp();

  const [activeTab, setActiveTab] = useState<'business' | 'receipts' | 'stations' | 'users' | 'backup'>('business');
  const [formData, setFormData] = useState(settings);
  const [importJson, setImportJson] = useState('');

  // AED Manual Rate local state
  const [manualRateInput, setManualRateInput] = useState<string>(
    settings.defaultExchangeRate ? settings.defaultExchangeRate.toFixed(2) : '77.50'
  );
  const [isSavingRate, setIsSavingRate] = useState(false);

  // Sync formData and manualRateInput whenever settings change (e.g. after reset or import)
  useEffect(() => {
    setFormData(settings);
    if (settings.defaultExchangeRate) {
      setManualRateInput(settings.defaultExchangeRate.toFixed(2));
    }
  }, [settings]);

  const handleUpdateManualRate = (customRateVal?: number) => {
    if (!isSuperAdmin) {
      showToast(
        language === 'ur'
          ? 'درہم کی شرح تبادلہ صرف سپر ایڈمن (Super Admin) ہی تبدیل کر سکتے ہیں!'
          : 'Only Super Admin can update the manual AED exchange rate!',
        'error'
      );
      return;
    }
    const rateToApply = customRateVal !== undefined ? customRateVal : parseFloat(manualRateInput);
    if (isNaN(rateToApply) || rateToApply <= 0) {
      showToast(
        language === 'ur'
          ? 'برائے مہربانی درست شرح تبادلہ درج کریں (مثلاً 77.50)'
          : 'Please enter a valid rate (e.g. 77.50)',
        'error'
      );
      return;
    }

    setIsSavingRate(true);
    const result = updateManualAedRate(rateToApply);
    if (result.success) {
      setManualRateInput(rateToApply.toFixed(2));
      setFormData(prev => ({ ...prev, defaultExchangeRate: Number(rateToApply.toFixed(2)) }));
    }
    setTimeout(() => setIsSavingRate(false), 400);
  };

  // Currency Management State (Change Currency & Edit/Update Currencies)
  const defaultCurrenciesFallback: CurrencyConfig[] = [
    { code: 'AED', nameEn: 'UAE Dirham', nameUr: 'اماراتی درہم', symbol: 'AED', rateToPKR: settings.defaultExchangeRate || 77.50 },
    { code: 'PKR', nameEn: 'Pakistani Rupee', nameUr: 'پاکستانی روپیہ', symbol: 'PKR', rateToPKR: 1 },
    { code: 'SAR', nameEn: 'Saudi Riyal', nameUr: 'سعودی ریال', symbol: 'SAR', rateToPKR: 74.20 },
    { code: 'USD', nameEn: 'US Dollar', nameUr: 'امریکی ڈالر', symbol: 'USD', rateToPKR: 278.50 },
    { code: 'OMR', nameEn: 'Omani Rial', nameUr: 'عمانی ریال', symbol: 'OMR', rateToPKR: 723.00 },
    { code: 'GBP', nameEn: 'British Pound', nameUr: 'برطانوی پاؤنڈ', symbol: 'GBP', rateToPKR: 352.00 },
  ];

  const activeCurrencies: CurrencyConfig[] =
    formData.currencies && formData.currencies.length > 0
      ? formData.currencies
      : defaultCurrenciesFallback;

  const [editingCurrencyCode, setEditingCurrencyCode] = useState<string | null>(null);
  const [isAddingCurrency, setIsAddingCurrency] = useState(false);
  const [currCode, setCurrCode] = useState('');
  const [currNameEn, setCurrNameEn] = useState('');
  const [currNameUr, setCurrNameUr] = useState('');
  const [currRate, setCurrRate] = useState('');

  const handleSetDefaultCurrency = (code: string) => {
    const updatedSettings = {
      ...formData,
      defaultTransferCurrency: code,
      currencies: activeCurrencies
    };
    setFormData(updatedSettings);
    updateSettings(updatedSettings);
    showToast(
      language === 'ur'
        ? `بنیادی کرنسی (${code}) کامیابی سے منتخب ہو گئی!`
        : `Default transfer currency changed to ${code}!`,
      'success'
    );
  };

  const handleStartEditCurrency = (curr: CurrencyConfig) => {
    setIsAddingCurrency(false);
    setEditingCurrencyCode(curr.code);
    setCurrCode(curr.code);
    setCurrNameEn(curr.nameEn);
    setCurrNameUr(curr.nameUr);
    setCurrRate(curr.rateToPKR.toString());
  };

  const handleStartAddCurrency = () => {
    setEditingCurrencyCode(null);
    setIsAddingCurrency(true);
    setCurrCode('');
    setCurrNameEn('');
    setCurrNameUr('');
    setCurrRate('77.50');
  };

  const handleSaveCurrencyItem = () => {
    const cleanCode = currCode.trim().toUpperCase();
    const rateNum = parseFloat(currRate);
    if (!cleanCode || !currNameEn.trim()) {
      showToast(
        language === 'ur'
          ? 'براہ کرم کرنسی کوڈ اور نام درج کریں'
          : 'Please enter Currency Code and Name',
        'error'
      );
      return;
    }
    if (isNaN(rateNum) || rateNum <= 0) {
      showToast(
        language === 'ur'
          ? 'براہ کرم درست ایکسچینج ریٹ درج کریں'
          : 'Please enter a valid exchange rate',
        'error'
      );
      return;
    }

    if (cleanCode === 'AED' && !isSuperAdmin && rateNum !== settings.defaultExchangeRate) {
      showToast(
        language === 'ur'
          ? 'درہم (AED) کا ریٹ صرف سپر ایڈمن ہی تبدیل کر سکتے ہیں!'
          : 'Only Super Admin can change the AED exchange rate!',
        'error'
      );
      return;
    }

    const updatedItem: CurrencyConfig = {
      code: cleanCode,
      nameEn: currNameEn.trim(),
      nameUr: currNameUr.trim() || currNameEn.trim(),
      symbol: cleanCode,
      rateToPKR: cleanCode === 'PKR' ? 1 : Number(rateNum.toFixed(2)),
    };

    let updatedList: CurrencyConfig[];
    if (editingCurrencyCode) {
      updatedList = activeCurrencies.map(c =>
        c.code === editingCurrencyCode ? updatedItem : c
      );
    } else {
      const exists = activeCurrencies.some(c => c.code === cleanCode);
      if (exists) {
        updatedList = activeCurrencies.map(c =>
          c.code === cleanCode ? updatedItem : c
        );
      } else {
        updatedList = [...activeCurrencies, updatedItem];
      }
    }

    const nextDefaultExchangeRate =
      cleanCode === 'AED' && isSuperAdmin
        ? updatedItem.rateToPKR
        : formData.defaultExchangeRate;

    if (cleanCode === 'AED' && isSuperAdmin) {
      setManualRateInput(updatedItem.rateToPKR.toFixed(2));
    }

    const updatedSettings = {
      ...formData,
      defaultExchangeRate: nextDefaultExchangeRate,
      currencies: updatedList,
    };

    setFormData(updatedSettings);
    updateSettings(updatedSettings);
    setEditingCurrencyCode(null);
    setIsAddingCurrency(false);

    showToast(
      language === 'ur'
        ? `کرنسی (${cleanCode}) کامیابی سے اپڈیٹ اور محفوظ ہو گئی!`
        : `Currency (${cleanCode}) updated and saved!`,
      'success'
    );
  };

  const handleDeleteCurrencyItem = (code: string) => {
    if (code === 'AED' || code === 'PKR') {
      showToast(
        language === 'ur'
          ? 'بنیادی کرنسی (AED / PKR) حذف نہیں کی جا سکتی'
          : 'Core currencies (AED / PKR) cannot be deleted',
        'error'
      );
      return;
    }
    const updatedList = activeCurrencies.filter(c => c.code !== code);
    const updatedDefault =
      formData.defaultTransferCurrency === code ? 'AED' : formData.defaultTransferCurrency;

    const updatedSettings = {
      ...formData,
      defaultTransferCurrency: updatedDefault,
      currencies: updatedList,
    };
    setFormData(updatedSettings);
    updateSettings(updatedSettings);
    showToast(
      language === 'ur'
        ? `کرنسی (${code}) فہرست سے ہٹا دی گئی`
        : `Currency (${code}) removed`,
      'info'
    );
  };

  // User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUserToEdit, setSelectedUserToEdit] = useState<AppUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);

  // System Action Confirmation Modal State
  const [confirmAction, setConfirmAction] = useState<'reset_demo' | 'clear_all' | null>(null);

  // Station Modal State
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [selectedStationToEdit, setSelectedStationToEdit] = useState<Station | null>(null);
  const [stationToDelete, setStationToDelete] = useState<Station | null>(null);
  const [stationSearch, setStationSearch] = useState('');
  const [stationCategoryFilter, setStationCategoryFilter] = useState('all');

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast(
        language === 'ur'
          ? 'لوگو فائل کا سائز 2MB سے کم ہونا چاہیے'
          : 'Logo file size must be under 2MB',
        'error'
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleChange('customLogoUrl', reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBackupFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const text = reader.result;
        setImportJson(text);
        const success = await storage.importAllData(text);
        if (success) {
          refreshData();
          showToast(t('dataImported'), 'success');
        } else {
          showToast(
            language === 'ur'
              ? 'غلط بیک اپ فائل! درست JSON فائل منتخب کریں۔'
              : 'Invalid JSON backup file!',
            'error'
          );
        }
      }
      input.value = '';
    };
    reader.onerror = () => {
      input.value = '';
      showToast(
        language === 'ur'
          ? 'فائل پڑھنے میں خرابی پیش آئی!'
          : 'Failed to read backup file!',
        'error'
      );
    };
    reader.readAsText(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = { ...formData };
    if (!isSuperAdmin) {
      dataToSave.defaultExchangeRate = settings.defaultExchangeRate;
    }
    updateSettings(dataToSave);
    if (dataToSave.defaultLanguage && dataToSave.defaultLanguage !== language) {
      setLanguage(dataToSave.defaultLanguage);
    }
  };

  const handleExportBackup = () => {
    const jsonStr = storage.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Eagle_Star_Brand_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    showToast(t('dataExported'), 'success');
  };

  const handleExportMySQLDump = () => {
    const sqlStr = storage.exportMySQLDump();
    const blob = new Blob([sqlStr], { type: 'application/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Eagle_Star_Brand_MySQL_Dump_${new Date().toISOString().split('T')[0]}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    showToast(
      language === 'ur'
        ? 'مکمل MySQL ڈیٹا بیس ڈمپ (.SQL) فائل ڈاؤن لوڈ ہو گئی!'
        : 'Complete MySQL Database Dump (.SQL) exported successfully!',
      'success'
    );
  };

  const handleDownloadMySQLSchema = () => {
    const a = document.createElement('a');
    a.href = '/mysql_schema.sql';
    a.download = 'Eagle_Star_Brand_MySQL_Schema.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(
      language === 'ur'
        ? 'MySQL ڈیٹا بیس سٹرکچر فائل (mysql_schema.sql) ڈاؤن لوڈ ہو گئی!'
        : 'MySQL Schema Structure (mysql_schema.sql) downloaded!',
      'success'
    );
  };

  const handleImportBackup = async () => {
    if (!importJson.trim()) return;
    const success = await storage.importAllData(importJson);
    if (success) {
      refreshData();
      showToast(
        language === 'ur'
          ? 'بیک اپ ڈیٹا کامیابی سے بحال اور محفوظ ہو گیا!'
          : 'Backup data imported and synchronized successfully!',
        'success'
      );
      setImportJson('');
    } else {
      showToast(
        language === 'ur'
          ? 'خرابی: بیک اپ JSON فائل درست نہیں ہے!'
          : 'Error: Invalid JSON backup file!',
        'error'
      );
    }
  };

  const handleResetDemo = () => {
    setConfirmAction('reset_demo');
  };

  const handleClearAll = () => {
    setConfirmAction('clear_all');
  };

  const handleOpenAddUser = () => {
    setSelectedUserToEdit(null);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: AppUser) => {
    setSelectedUserToEdit(user);
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = (user: AppUser) => {
    if (!isSuperAdmin) {
      showToast(
        language === 'ur'
          ? 'صارفین حذف کرنا صرف سپر ایڈمن (Super Admin) کے اختیار میں ہے!'
          : 'Only Super Admin can delete users!',
        'error'
      );
      return;
    }
    if (user.username === 'superadmin' || user.username === 'admin') {
      showToast(
        language === 'ur'
          ? 'بنیادی سپر ایڈمن یا ایڈمن اکاؤنٹ کو حذف نہیں کیا جا سکتا!'
          : 'Primary super admin or admin account cannot be deleted!',
        'error'
      );
      return;
    }
    setUserToDelete(user);
  };

  const handleToggleUserStatus = (user: AppUser) => {
    if (!isSuperAdmin) {
      showToast(
        language === 'ur'
          ? 'صارفین کی حالت تبدیل کرنا صرف سپر ایڈمن کے اختیار میں ہے!'
          : 'Only Super Admin can toggle user status!',
        'error'
      );
      return;
    }
    if (user.username === 'superadmin') {
      showToast(
        language === 'ur'
          ? 'سپر ایڈمن اکاؤنٹ کو غیر فعال نہیں کیا جا سکتا!'
          : 'Super Admin account cannot be deactivated!',
        'error'
      );
      return;
    }

    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    saveUser({
      ...user,
      status: newStatus
    });
  };

  return (
    <div className="space-y-6 max-w-5xl" dir={language === 'ur' ? 'rtl' : 'ltr'}>
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-urdu-heading">
              {t('settings')}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-urdu-body">
            {language === 'ur'
              ? 'کاروباری معلومات، شرح تبادلہ، رول بیسڈ رسائی کنٹرول اور بیک اپ'
              : 'Business profile, exchange rates, role-based access control (RBAC), and backups'}
          </p>
        </div>

        {/* Current Active User Pill */}
        {currentUser && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px] uppercase">
              {currentUser.username.slice(0, 2)}
            </div>
            <div>
              <span className="font-bold text-slate-900">{currentUser.fullName}</span>
              <span className={`ml-1.5 mr-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                currentUser.role === 'super_admin'
                  ? 'bg-slate-200 text-slate-950 border border-slate-300'
                  : 'bg-emerald-100 text-emerald-950 border border-emerald-300'
              }`}>
                {t(currentUser.role)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs sm:text-sm">
        <button
          onClick={() => setActiveTab('business')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition shrink-0 cursor-pointer ${
            activeTab === 'business'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-700/20'
              : 'text-slate-800 hover:text-emerald-950 hover:bg-emerald-50/70'
          }`}
        >
          <Building className="w-4 h-4" />
          <span className="font-urdu-heading">
            {language === 'ur' ? 'کاروبار و شرح تبادلہ' : 'Business & Exchange Rates'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('receipts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition shrink-0 relative cursor-pointer ${
            activeTab === 'receipts'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-700/20'
              : 'text-slate-800 hover:text-emerald-950 hover:bg-emerald-50/70'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span className="font-urdu-heading">
            {language === 'ur' ? 'رسید و پرنٹ کسٹمائزیشن' : 'Receipt Customization'}
          </span>
          <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded-full border border-amber-300">
            {language === 'ur' ? 'سپر ایڈمن' : 'Super Admin'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('stations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition shrink-0 relative cursor-pointer ${
            activeTab === 'stations'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-700/20'
              : 'text-slate-800 hover:text-emerald-950 hover:bg-emerald-50/70'
          }`}
        >
          <Building2 className="w-4 h-4 text-slate-700" />
          <span className="font-urdu-heading">
            {language === 'ur' ? 'اسٹیشنز و کاؤنٹرز (Stations)' : 'Stations & Counters'}
          </span>
          <span className="text-[10px] bg-slate-200 text-slate-950 font-bold px-1.5 py-0.2 rounded-full border border-slate-300">
            {stations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition shrink-0 relative cursor-pointer ${
            activeTab === 'users'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-700/20'
              : 'text-slate-800 hover:text-emerald-950 hover:bg-emerald-50/70'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-slate-700" />
          <span className="font-urdu-heading">
            {language === 'ur' ? 'صارفین اور رسائی کے حقوق (RBAC)' : 'User Access & Roles (RBAC)'}
          </span>
          <span className="text-[10px] bg-slate-200 text-slate-950 font-bold px-1.5 py-0.2 rounded-full border border-slate-300">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition shrink-0 cursor-pointer ${
            activeTab === 'backup'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-700/20'
              : 'text-slate-800 hover:text-emerald-950 hover:bg-emerald-50/70'
          }`}
        >
          <Download className="w-4 h-4" />
          <span className="font-urdu-heading">
            {language === 'ur' ? 'ڈیٹا بیک اپ و ری سیٹ' : 'Data Backup & Restore'}
          </span>
        </button>
      </div>

      {/* TAB 1: BUSINESS PROFILE & FINANCIAL DEFAULTS */}
      {activeTab === 'business' && (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Executive Brand Preview Showcase & Custom Logo Upload */}
          <div className="bg-slate-50 p-6 sm:p-7 rounded-2xl border border-slate-300 text-slate-950 shadow-sm relative overflow-hidden space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-widest block font-mono">
                {language === 'ur'
                  ? 'لائیو برانڈ ڈسپلے و کسٹم لوگو (Live Preview)'
                  : 'Official Brand Typography & Custom Logo Preview'}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 text-xs font-bold cursor-pointer transition shadow-2xs">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {language === 'ur' ? 'کسٹم لوگو اپلوڈ کریں' : 'Upload Custom Logo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                {formData.customLogoUrl && (
                  <button
                    type="button"
                    onClick={() => handleChange('customLogoUrl', '')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-red-50 text-red-700 border border-red-200 text-xs font-bold transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{language === 'ur' ? 'اصل لوگو بحال کریں' : 'Reset Default Logo'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-1">
              <EagleStarLogo
                variant="horizontal"
                size="lg"
                showSubtitle={true}
                isDarkBackground={false}
                customNameEn={formData.businessNameEn}
                customNameUr={formData.businessNameUr}
                customSubtitle={formData.branchEn}
                customLogoUrl={formData.customLogoUrl || ''}
              />

              <div className="bg-white px-4 py-3 rounded-xl border border-slate-300 text-xs space-y-1 text-center sm:text-right shrink-0 shadow-sm">
                <span className="text-slate-800 block font-semibold">
                  Font: <strong className="text-slate-950 font-brand-en tracking-wider">Montserrat (EN)</strong> +{' '}
                  <strong className="text-slate-950 font-urdu-heading">Noori Nastaleeq (اردو)</strong>
                </span>
                <span className="text-xs text-blue-900 font-bold block">
                  {language === 'ur'
                    ? 'تمام رسیدوں، ہیڈر اور لاگ ان پیج پر خودکار اپڈیٹ ہوگا'
                    : 'Auto-updates across Header, Sidebar, Login & Receipts'}
                </span>
              </div>
            </div>
          </div>

          {/* AED Exchange Rate Management Card (Super Admin Exclusive) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 text-slate-900">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-600" />
                <h2 className="font-bold text-base font-urdu-heading">
                  {language === 'ur' ? 'درہم کی شرحِ تبادلہ (AED Exchange Rate Setting)' : 'AED Exchange Rate Management (Manual Rate)'}
                </h2>
              </div>
              {isSuperAdmin ? (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-xl text-xs font-bold font-mono">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>{language === 'ur' ? 'سپر ایڈمن مجاز' : 'SUPER ADMIN EXCLUSIVE'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold font-mono">
                  <Lock className="w-4 h-4 text-amber-700" />
                  <span>{language === 'ur' ? 'صرف سپر ایڈمن کے لیے مقفل' : 'LOCKED: SUPER ADMIN ONLY'}</span>
                </div>
              )}
            </div>

            {/* Active Rate Showcase Banner */}
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200/90 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 font-mono block mb-1">
                  {language === 'ur' ? 'فعال شرحِ تبادلہ (Active AED Rate)' : 'Current Active AED Rate'}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-slate-700 font-mono">1 AED =</span>
                  <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-700 tracking-tight">
                    {(settings.defaultExchangeRate || 77.50).toFixed(2)}
                  </span>
                  <span className="text-sm sm:text-base font-bold text-slate-800">PKR (پاکستانی روپے)</span>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1 bg-white/90 backdrop-blur-xs px-3.5 py-2.5 rounded-lg border border-emerald-200 shadow-2xs">
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{language === 'ur' ? 'آخری تبدیلی:' : 'Last Updated:'}</span>
                  <span className="font-mono text-slate-900 font-bold">
                    {settings.manualRateUpdatedAt
                      ? `${new Date(settings.manualRateUpdatedAt).toLocaleDateString()} ${new Date(settings.manualRateUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : '27-Oct-2026'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  <span>{language === 'ur' ? 'بذریعہ:' : 'Updated by:'} </span>
                  <strong className="text-slate-800 font-semibold">{settings.manualRateUpdatedBy || 'Super Admin'}</strong>
                </div>
              </div>
            </div>

            {/* Controls: Super Admin Authorized View */}
            {isSuperAdmin ? (
              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                    {language === 'ur'
                      ? 'دستی نیا درہم ریٹ درج کریں (Set Manual AED Rate):'
                      : 'Enter New Manual AED Exchange Rate (PKR per 1 AED):'}
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-500">
                        PKR
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={manualRateInput}
                        onChange={e => setManualRateInput(e.target.value)}
                        placeholder="77.50"
                        className="pl-12 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-mono font-black text-slate-900 w-44 shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUpdateManualRate()}
                      disabled={isSavingRate}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>
                        {isSavingRate
                          ? (language === 'ur' ? 'محفوظ ہو رہا ہے...' : 'Saving...')
                          : (language === 'ur' ? 'درہم ریٹ محفوظ کریں' : 'Save AED Rate')}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-600 block">
                    {language === 'ur' ? 'مارکیٹ کے عام ریٹ (ایک کلک سے منتخب کریں):' : 'Common Market Presets (Click to Select):'}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {[76.50, 77.00, 77.50, 78.00, 78.50, 79.00].map(preset => {
                      const isSelected = parseFloat(manualRateInput) === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setManualRateInput(preset.toFixed(2));
                            handleUpdateManualRate(preset);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                          <span>{preset.toFixed(2)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-950 font-urdu-body flex items-start gap-2">
                  <span className="text-base leading-none">💡</span>
                  <p>
                    {language === 'ur'
                      ? 'نوٹ: جب بھی مارکیٹ میں درہم کا ریٹ اوپر یا نیچے ہو، آپ یہاں سے نیا ریٹ درج یا تبدیل کر سکتے ہیں۔ یہ ریٹ تمام نئی ترسیلات، حوالہ جات، اور کیش جمع کھاتہ پر خودکار لاگو ہوگا۔'
                      : 'Note: Whenever market rates fluctuate, you can adjust the AED rate here anytime. This rate will automatically be used as default for all new transfers and transactions.'}
                  </p>
                </div>
              </div>
            ) : (
              /* Non-Super Admin Locked Notice */
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3 text-amber-950">
                <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm font-urdu-heading">
                    {language === 'ur' ? 'درہم ریٹ تبدیل کرنے کا اختیار مقفل ہے' : 'AED Rate Modification Locked'}
                  </h4>
                  <p className="text-xs font-urdu-body text-amber-900">
                    {language === 'ur'
                      ? 'درہم کی شرحِ تبادلہ (AED Exchange Rate) کو دستی طور پر تبدیل کرنے کا اختیار صرف سپر ایڈمن (dsumerf@gmail.com) کے پاس محفوظ ہے۔ عام ایڈمن یا دیگر عملہ درہم کی قیمت تبدیل نہیں کر سکتا۔'
                      : 'Manual adjustment of the AED exchange rate is strictly restricted to the Super Admin (dsumerf@gmail.com). Standard administrators and staff members are not permitted to change this rate.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Change & Edit Currencies (PKR, AED, SAR, USD, OMR, GBP & Custom Currencies) */}
          <div className="bg-white p-6 rounded-2xl border-2 border-indigo-200 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                  <Coins className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-bold text-base sm:text-lg text-slate-900 font-urdu-heading">
                    {language === 'ur'
                      ? 'کرنسی تبدیل کریں اور کرنسی ریٹ میں ترمیم کریں (Change & Edit Currencies)'
                      : 'Change Default Currency & Edit / Update Currencies'}
                  </h2>
                  <p className="text-xs text-slate-600 font-urdu-body">
                    {language === 'ur'
                      ? 'منی ٹرانسفر کے لیے اپنی پسندیدہ کرنسی (PKR روپیہ، AED درہم، ریال، ڈالر وغیرہ) منتخب کریں یا کسی بھی کرنسی میں ترمیم کریں'
                      : 'Select default currency for Money Transfers (PKR, AED, SAR, USD, etc.) or edit/add currencies and rates'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartAddCurrency}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'ur' ? '+ نئی کرنسی شامل کریں' : '+ Add New Currency'}</span>
              </button>
            </div>

            {/* Default Transfer Currency Selector Bar */}
            <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-950 block font-urdu-heading">
                  {language === 'ur'
                    ? 'منی ٹرانسفر کی ڈیفالٹ کرنسی تبدیل کریں (Default Transfer Currency):'
                    : 'Change Default Money Transfer Currency:'}
                </span>
                <span className="text-[11px] text-indigo-800 font-urdu-body">
                  {language === 'ur'
                    ? 'منتخب کردہ کرنسی نیا ٹرانسفر کھولتے وقت خودکار طور پر سلیکٹ ہو گی (آپ ٹرانسفر فارم میں بھی تبدیل کر سکتے ہیں)'
                    : 'This currency will be pre-selected when opening New Money Transfer (can also be switched inside the transfer form)'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={formData.defaultTransferCurrency || 'AED'}
                  onChange={e => handleSetDefaultCurrency(e.target.value)}
                  className="bg-white border-2 border-indigo-500 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-extrabold text-indigo-950 shadow-2xs outline-hidden cursor-pointer"
                >
                  {activeCurrencies.map(curr => (
                    <option key={curr.code} value={curr.code}>
                      {curr.code} — {curr.nameEn} ({curr.nameUr})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Add / Edit Currency Inline Form */}
            {(isAddingCurrency || editingCurrencyCode) && (
              <div className="bg-amber-50/90 border-2 border-amber-300 rounded-xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <h4 className="text-xs sm:text-sm font-extrabold text-amber-950 flex items-center gap-1.5 font-urdu-heading">
                    <Edit2 className="w-4 h-4 text-amber-700" />
                    <span>
                      {editingCurrencyCode
                        ? (language === 'ur'
                            ? `کرنسی میں ترمیم کریں: ${editingCurrencyCode}`
                            : `Edit Currency: ${editingCurrencyCode}`)
                        : (language === 'ur'
                            ? 'نئی کرنسی شامل کریں (Add New Currency)'
                            : 'Add New Currency')}
                    </span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCurrencyCode(null);
                      setIsAddingCurrency(false);
                    }}
                    className="text-xs text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
                  >
                    ✕ {language === 'ur' ? 'بند کریں' : 'Close'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {language === 'ur' ? 'کرنسی کوڈ (Code) *' : 'Currency Code *'}
                    </label>
                    <input
                      type="text"
                      value={currCode}
                      disabled={editingCurrencyCode === 'AED' || editingCurrencyCode === 'PKR'}
                      onChange={e => setCurrCode(e.target.value.toUpperCase())}
                      placeholder="e.g. AED, PKR, SAR"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 uppercase disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {language === 'ur' ? 'انگریزی نام (English Name) *' : 'Currency Name (English) *'}
                    </label>
                    <input
                      type="text"
                      value={currNameEn}
                      onChange={e => setCurrNameEn(e.target.value)}
                      placeholder="e.g. UAE Dirham"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 font-urdu-heading">
                      {language === 'ur' ? 'اردو نام (Urdu Name)' : 'Currency Name (Urdu)'}
                    </label>
                    <input
                      type="text"
                      value={currNameUr}
                      onChange={e => setCurrNameUr(e.target.value)}
                      placeholder="مثلاً اماراتی درہم"
                      dir="rtl"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-urdu-body font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {language === 'ur' ? 'پاکستانی روپے ریٹ (Rate in PKR) *' : 'Exchange Rate (to PKR) *'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={currCode.toUpperCase() === 'PKR' || (currCode.toUpperCase() === 'AED' && !isSuperAdmin)}
                      value={currCode.toUpperCase() === 'PKR' ? '1' : currRate}
                      onChange={e => setCurrRate(e.target.value)}
                      placeholder="77.50"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-emerald-900 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCurrencyCode(null);
                      setIsAddingCurrency(false);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    {language === 'ur' ? 'منسوخ کریں' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCurrencyItem}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{language === 'ur' ? 'کرنسی محفوظ کریں' : 'Save Currency'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Currencies Table / Cards */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                    <th className="py-2.5 px-3">{language === 'ur' ? 'کرنسی کوڈ' : 'Code'}</th>
                    <th className="py-2.5 px-3">{language === 'ur' ? 'نام (انگریزی / اردو)' : 'Currency Name'}</th>
                    <th className="py-2.5 px-3">{language === 'ur' ? 'پاکستانی روپے ریٹ (PKR Rate)' : 'Rate to PKR'}</th>
                    <th className="py-2.5 px-3">{language === 'ur' ? 'حیثیت (Status)' : 'Default Status'}</th>
                    <th className="py-2.5 px-3 text-right">{language === 'ur' ? 'ترمیم / عمل' : 'Edit / Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {activeCurrencies.map(curr => {
                    const isDefault = (formData.defaultTransferCurrency || 'AED') === curr.code;
                    return (
                      <tr key={curr.code} className={isDefault ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}>
                        <td className="py-2.5 px-3 font-mono font-black text-slate-900 text-sm">
                          {curr.code}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{curr.nameEn}</div>
                          <div className="text-[11px] text-slate-600 font-urdu-body">{curr.nameUr}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">
                          {curr.code === 'PKR' ? '1.00 PKR (Base)' : `1 ${curr.code} = ${Number(curr.rateToPKR).toFixed(2)} PKR`}
                        </td>
                        <td className="py-2.5 px-3">
                          {isDefault ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              <CheckCircle className="w-3 h-3 text-emerald-700" />
                              <span>{language === 'ur' ? 'ڈیفالٹ کرنسی' : 'Default Currency'}</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultCurrency(curr.code)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 border border-slate-300 transition cursor-pointer"
                            >
                              {language === 'ur' ? 'ڈیفالٹ بنائیں' : 'Set as Default'}
                            </button>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEditCurrency(curr)}
                              className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] inline-flex items-center gap-1 border border-amber-300 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>{language === 'ur' ? 'ترمیم (Edit)' : 'Edit'}</span>
                            </button>
                            {curr.code !== 'AED' && curr.code !== 'PKR' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCurrencyItem(curr.code)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                                title="Delete Currency"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Business Profile */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b pb-3 text-slate-900">
              <Building className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-base font-urdu-heading">{t('businessProfile')}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {t('businessNameEn')}
                </label>
                <input
                  type="text"
                  value={formData.businessNameEn}
                  onChange={e => handleChange('businessNameEn', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-semibold text-slate-950"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-urdu-heading">
                  {t('businessNameUr')}
                </label>
                <input
                  type="text"
                  value={formData.businessNameUr}
                  onChange={e => handleChange('businessNameUr', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-urdu-heading font-bold text-slate-950"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {t('branchNameEn')}
                </label>
                <input
                  type="text"
                  value={formData.branchEn}
                  onChange={e => handleChange('branchEn', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-950"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-urdu-heading">
                  {t('branchNameUr')}
                </label>
                <input
                  type="text"
                  value={formData.branchUr}
                  onChange={e => handleChange('branchUr', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-urdu-heading text-slate-950"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {language === 'ur' ? 'دفتر کا پتہ (انگریزی)' : 'Office Address (English)'}
                </label>
                <input
                  type="text"
                  value={formData.addressEn}
                  onChange={e => handleChange('addressEn', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-950"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-urdu-heading">
                  {language === 'ur' ? 'دفتر کا پتہ (اردو)' : 'Office Address (Urdu)'}
                </label>
                <input
                  type="text"
                  value={formData.addressUr}
                  onChange={e => handleChange('addressUr', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-urdu-heading text-slate-950"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">{t('phone')} (UAE / Primary)</label>
                <input
                  type="text"
                  value={formData.phoneEn}
                  onChange={e => handleChange('phoneEn', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-mono text-slate-950"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {language === 'ur' ? 'پاکستان رابطہ نمبر / دوسرا فون' : 'Pakistan Helpline / Secondary Phone'}
                </label>
                <input
                  type="text"
                  value={formData.phoneUr}
                  onChange={e => handleChange('phoneUr', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-mono text-slate-950"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">{t('whatsappNumber')}</label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={e => handleChange('whatsapp', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-mono text-slate-950"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {language === 'ur' ? 'ای میل ایڈریس (Email)' : 'Business Email'}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-mono text-slate-950"
                />
              </div>
            </div>
          </div>

          {/* Financial & Order Numbering Defaults */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b pb-3 text-slate-900">
              <Calculator className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-base font-urdu-heading">{t('financialDefaults')}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-semibold">
                    {t('defaultExchangeRateLabel')}
                  </label>
                  {!isSuperAdmin && (
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-amber-700" />
                      <span>{language === 'ur' ? 'صرف سپر ایڈمن' : 'Super Admin'}</span>
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  disabled={!isSuperAdmin}
                  value={formData.defaultExchangeRate === 0 ? '' : formData.defaultExchangeRate}
                  onChange={e => handleChange('defaultExchangeRate', e.target.value === '' ? ('' as any) : Number(e.target.value))}
                  placeholder="77.50"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-mono font-bold text-slate-950 disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {language === 'ur'
                    ? (isSuperAdmin ? '1 درہم کے برابر پاکستانی روپے (اوپر کارڈ سے تبدیل کریں)' : '1 درہم کے برابر پاکستانی روپے (تبدیلی صرف سپر ایڈمن)')
                    : (isSuperAdmin ? 'PKR per 1 AED (Manage in card above)' : 'PKR per 1 AED (Locked to Super Admin)')}
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {t('defaultCommissionLabel')}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.defaultCommissionPct === 0 ? '' : formData.defaultCommissionPct}
                  onChange={e => handleChange('defaultCommissionPct', e.target.value === '' ? ('' as any) : Number(e.target.value))}
                  placeholder="e.g. 2"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-mono text-slate-950"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {t('commissionBasisLabel')}
                </label>
                <select
                  value={formData.commissionBase}
                  onChange={e => handleChange('commissionBase', e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-semibold text-slate-950"
                >
                  <option value="AED">AED (درہم رقم پر)</option>
                  <option value="PKR">PKR (پاکستانی رقم پر)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {language === 'ur' ? 'آرڈر نمبر پری فکس (Order Prefix)' : 'Order Number Prefix'}
                </label>
                <input
                  type="text"
                  value={formData.orderNumberPrefix}
                  onChange={e => handleChange('orderNumberPrefix', e.target.value)}
                  placeholder="109"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-mono font-bold text-slate-950"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {language === 'ur' ? 'رسید نمبر پری فکس (Receipt Prefix)' : 'Receipt Voucher Prefix'}
                </label>
                <input
                  type="text"
                  value={formData.receiptPrefix}
                  onChange={e => handleChange('receiptPrefix', e.target.value)}
                  placeholder="REC"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-mono font-bold text-slate-950"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {language === 'ur' ? 'سسٹم کی بنیادی زبان (Default Language)' : 'Default System Language'}
                </label>
                <select
                  value={formData.defaultLanguage}
                  onChange={e => handleChange('defaultLanguage', e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-semibold text-slate-950"
                >
                  <option value="en">English (انگریزی)</option>
                  <option value="ur">اردو (Urdu)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {language === 'ur' ? 'ٹرانسفر کی بنیادی کرنسی (Default Currency)' : 'Default Transfer Currency'}
                </label>
                <select
                  value={formData.defaultTransferCurrency || 'AED'}
                  onChange={e => handleChange('defaultTransferCurrency', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-semibold text-slate-950"
                >
                  {activeCurrencies.map(curr => (
                    <option key={curr.code} value={curr.code}>
                      {curr.code} — {curr.nameEn} ({curr.nameUr})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Receipt Customization */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 text-slate-900">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-base font-urdu-heading">{t('receiptSettings')}</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  const disclaimer = 'اپنی رقم 5 دنوں کے اندر وصول کر لیں، بصورتِ دیگر ہم ذمہ دار نہیں ہوں گے۔';
                  handleChange('receiptFooterUr', disclaimer);
                  handleChange('receiptFooterEn', disclaimer);
                }}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200 transition"
              >
                {language === 'ur'
                  ? '5 دن والی لازمی شرط بحال کریں'
                  : 'Restore Mandatory 5-Day Disclaimer'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">{t('receiptFooterEn')}</label>
                <textarea
                  rows={2}
                  value={formData.receiptFooterEn}
                  onChange={e => handleChange('receiptFooterEn', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-950"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1 font-urdu-heading">{t('receiptFooterUr')}</label>
                <textarea
                  rows={2}
                  value={formData.receiptFooterUr}
                  onChange={e => handleChange('receiptFooterUr', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-urdu-heading font-bold text-slate-950"
                  dir="rtl"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition shadow-md shadow-blue-600/30 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{t('saveSettings')}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: RECEIPT & PRINT CUSTOMIZATION */}
      {activeTab === 'receipts' && (
        <div className="space-y-6">
          {/* Status Banner */}
          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center justify-between gap-3 text-emerald-950 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
              <span className="text-xs sm:text-sm font-bold font-urdu-heading">
                {language === 'ur'
                  ? 'رسید برانڈنگ و مواد کسٹمائزیشن: یہاں کی جانے والی ہر تبدیلی تمام پرنٹ رسیدوں اور آرڈر لسٹ پر فوری لاگو ہوگی'
                  : 'Receipt Branding & Content Customization: All changes immediately update across all printed receipts & order lists'}
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded border border-emerald-400 shrink-0">
              LIVE SYNC
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-6">
            {/* Logo & Brand Identity Preview & Brand Name Fields */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-base text-slate-900 font-urdu-heading">
                    {language === 'ur' ? 'کمپنی / برانڈ نام، رسید ہیڈر اور کسٹم لوگو' : 'Brand Name, Receipt Header & Custom Logo'}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{language === 'ur' ? 'لوگو تبدیل کریں' : 'Upload Receipt Logo'}</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  {formData.customLogoUrl && (
                    <button
                      type="button"
                      onClick={() => handleChange('customLogoUrl', '')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{language === 'ur' ? 'ری سیٹ' : 'Reset Logo'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Logo & Header Live Preview Box */}
              <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <EagleStarLogo
                  variant="print"
                  size="sm"
                  showSubtitle={true}
                  customNameEn={formData.businessNameEn}
                  customNameUr={formData.businessNameUr}
                  customSubtitle={formData.branchEn}
                  customLogoUrl={formData.customLogoUrl || ''}
                />
                <div className="text-center sm:text-right text-xs font-mono font-bold text-slate-800 border-t sm:border-t-0 sm:border-l border-slate-300 pt-2 sm:pt-0 sm:pl-4 space-y-0.5">
                  <p className="text-slate-950">{formData.branchEn || 'Deira Branch, Dubai, UAE'}</p>
                  {formData.branchUr && (
                    <p className="text-slate-800 font-urdu-heading text-xs" dir="rtl">
                      {formData.branchUr}
                    </p>
                  )}
                  <p className="text-blue-900">
                    Helpline: {formData.phoneEn || '+971 50 123 4567'}
                    {formData.phoneUr && formData.phoneUr !== formData.phoneEn ? ` | ${formData.phoneUr}` : ''}
                  </p>
                </div>
              </div>

              {/* Brand Name & Receipt Title Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm pt-1">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {language === 'ur' ? 'برانڈ / کمپنی کا نام (انگریزی - رسید ہیڈر)' : 'Brand / Company Name (English - Receipt Header)'}
                  </label>
                  <input
                    type="text"
                    value={formData.businessNameEn}
                    onChange={e => handleChange('businessNameEn', e.target.value)}
                    placeholder="Eagle Star Brand"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-urdu-heading">
                    {language === 'ur' ? 'برانڈ / کمپنی کا نام (اردو - رسید ہیڈر و مہر)' : 'Brand / Company Name (Urdu - Receipt Header & Stamp)'}
                  </label>
                  <input
                    type="text"
                    value={formData.businessNameUr}
                    onChange={e => handleChange('businessNameUr', e.target.value)}
                    placeholder="ایگل ایس بی"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-urdu-heading font-bold text-slate-950"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-urdu-heading">
                    {language === 'ur' ? 'رسید آرڈر سینٹر ٹائٹل بیج (اردو)' : 'Receipt Slip Center Title Badge (Urdu)'}
                  </label>
                  <input
                    type="text"
                    value={formData.receiptHeaderTitleUr || 'رسید آرڈر'}
                    onChange={e => handleChange('receiptHeaderTitleUr', e.target.value)}
                    placeholder="رسید آرڈر"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-urdu-heading font-bold text-slate-950"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-urdu-heading">
                    {language === 'ur' ? 'رسید کسٹمر اکاؤنٹ لیبل (اردو)' : 'Receipt Customer Account Label (Urdu)'}
                  </label>
                  <input
                    type="text"
                    value={formData.receiptCustomerLabelUr || 'مصفح کسٹمر نمبر'}
                    onChange={e => handleChange('receiptCustomerLabelUr', e.target.value)}
                    placeholder="مصفح کسٹمر نمبر"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-urdu-heading font-bold text-slate-950"
                    dir="rtl"
                  />
                </div>
              </div>
            </div>

            {/* Header Address & Helpline Settings */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b pb-3 text-slate-900">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base font-urdu-heading">
                  {language === 'ur' ? 'پرنٹ ہیڈر، برانچ، ایڈریس اور ہیلپ لائن' : 'Print Header Branch, Address & Helpline'}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {language === 'ur' ? 'برانچ / سب ٹائٹل (English - Print Header)' : 'Branch / Subtitle Line (English)'}
                  </label>
                  <input
                    type="text"
                    value={formData.branchEn}
                    onChange={e => handleChange('branchEn', e.target.value)}
                    placeholder="Deira Branch, Dubai, UAE"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-semibold text-slate-950"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-urdu-heading">
                    {language === 'ur' ? 'برانچ کا نام (اردو)' : 'Branch Name (Urdu)'}
                  </label>
                  <input
                    type="text"
                    value={formData.branchUr}
                    onChange={e => handleChange('branchUr', e.target.value)}
                    placeholder="دیرہ برانچ، دبئی، امارات"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-urdu-heading font-bold text-slate-950"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {language === 'ur' ? 'دفتر کا پتہ (انگریزی)' : 'Office Address (English)'}
                  </label>
                  <input
                    type="text"
                    value={formData.addressEn}
                    onChange={e => handleChange('addressEn', e.target.value)}
                    placeholder="Shop 14, Al-Sabkha Road, Deira, Dubai"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-950"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-urdu-heading">
                    {language === 'ur' ? 'دفتر کا پتہ (اردو - رسید پتہ لائن)' : 'Office Address (Urdu - Printed on Receipt)'}
                  </label>
                  <input
                    type="text"
                    value={formData.addressUr}
                    onChange={e => handleChange('addressUr', e.target.value)}
                    placeholder="دکان نمبر 14، الصبخہ روڈ، دیرہ، دبئی"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-urdu-heading font-bold text-slate-950"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {language === 'ur' ? 'پرائمری ہیلپ لائن فون نمبر (Primary Helpline)' : 'Primary Helpline Number'}
                  </label>
                  <input
                    type="text"
                    value={formData.phoneEn}
                    onChange={e => handleChange('phoneEn', e.target.value)}
                    placeholder="+971 50 123 4567"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-mono font-bold text-slate-950"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {language === 'ur' ? 'پاکستان ہیلپ لائن / واٹس ایپ نمبر' : 'Secondary Helpline / WhatsApp'}
                  </label>
                  <input
                    type="text"
                    value={formData.phoneUr}
                    onChange={e => handleChange('phoneUr', e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm font-mono text-slate-950"
                  />
                </div>
              </div>
            </div>

            {/* Receipt Footer Terms & Legal Disclaimer */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 text-slate-900">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-base font-urdu-heading">
                    {language === 'ur' ? 'رسید کا مواد، ڈس کلیمر و شرائط (Receipt Content & Footers)' : 'Receipt Content, Disclaimers & Terms'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const disclaimer = 'اپنی رقم 5 دنوں کے اندر وصول کر لیں، بصورتِ دیگر ہم ذمہ دار نہیں ہوں گے۔';
                    handleChange('receiptFooterUr', disclaimer);
                    handleChange('receiptFooterEn', disclaimer);
                  }}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200 transition cursor-pointer"
                >
                  {language === 'ur' ? '5 دن والی لازمی شرط بحال کریں' : 'Restore Mandatory 5-Day Disclaimer'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                {/* General Disclaimer */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-urdu-heading">
                    {language === 'ur' ? 'رسید پرنٹ کی لازمی شرط (اردو - تمام رسیدوں پر)' : 'Main Receipt Footer Disclaimer (Urdu)'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.receiptFooterUr}
                    onChange={e => handleChange('receiptFooterUr', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-urdu-heading font-bold text-slate-950"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {language === 'ur' ? 'رسید کی شرط (انگریزی / اضافی لائن)' : 'Main Receipt Footer Disclaimer (English)'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.receiptFooterEn}
                    onChange={e => handleChange('receiptFooterEn', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-950"
                  />
                </div>

                {/* Cash Jamah Footer */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-urdu-heading">
                    {language === 'ur' ? 'پیسہ جمع رسید فٹ (اردو)' : 'Cash Jamah Footer (Urdu)'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.receiptFooterCashJamahUr || ''}
                    onChange={e => handleChange('receiptFooterCashJamahUr', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-urdu-heading font-bold text-slate-950"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {language === 'ur' ? 'پیسہ جمع رسید فٹ (انگریزی)' : 'Cash Jamah Footer (English)'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.receiptFooterCashJamahEn || ''}
                    onChange={e => handleChange('receiptFooterCashJamahEn', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-950"
                  />
                </div>

                {/* Deposit Footer */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-urdu-heading">
                    {language === 'ur' ? 'ڈپازٹ رسید فٹ (اردو)' : 'Deposit Footer (Urdu)'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.receiptFooterDepositUr || ''}
                    onChange={e => handleChange('receiptFooterDepositUr', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-urdu-heading font-bold text-slate-950"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {language === 'ur' ? 'ڈپازٹ رسید فٹ (انگریزی)' : 'Deposit Footer (English)'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.receiptFooterDepositEn || ''}
                    onChange={e => handleChange('receiptFooterDepositEn', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-950"
                  />
                </div>

                {/* Loan Footer */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 font-urdu-heading">
                    {language === 'ur' ? 'ادھار/قرضہ رسید فٹ (اردو)' : 'Loan Footer (Urdu)'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.receiptFooterLoanUr || ''}
                    onChange={e => handleChange('receiptFooterLoanUr', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-urdu-heading font-bold text-slate-950"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {language === 'ur' ? 'ادھار/قرضہ رسید فٹ (انگریزی)' : 'Loan Footer (English)'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.receiptFooterLoanEn || ''}
                    onChange={e => handleChange('receiptFooterLoanEn', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-950"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-7 py-3 rounded-xl font-bold text-sm transition shadow-md cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>
                  {language === 'ur'
                    ? 'برانڈنگ اور رسید ترتیبات محفوظ کریں'
                    : 'Save Branding & Receipt Customization'}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB: STATIONS & COUNTERS MANAGEMENT */}
      {activeTab === 'stations' && (
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-300 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-950 font-montserrat">
                  {language === 'ur' ? 'اسٹیشنز و کیش کاؤنٹرز کا انتظام' : 'Station & Delivery Desk Management'}
                </h3>
                <p className="text-xs text-slate-700 font-urdu mt-0.5">
                  {language === 'ur'
                    ? 'میرعلی، ایزی پیسہ، جیز کیش، بینک اور دیگر کاؤنٹرز کا نیا اندراج، ترمیم و ڈیلیٹ کریں'
                    : 'Add new stations, edit details, update status, and manage remittance payout locations'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedStationToEdit(null);
                setIsStationModalOpen(true);
              }}
              className="flex items-center gap-2 bg-slate-950 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>{language === 'ur' ? 'نیا اسٹیشن شامل کریں' : 'Add New Station'}</span>
            </button>
          </div>

          {/* Search & Filter */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
              <div className="relative flex-1 min-w-[180px]">
                <input
                  type="text"
                  value={stationSearch}
                  onChange={e => setStationSearch(e.target.value)}
                  placeholder={language === 'ur' ? 'اسٹیشن، نام، کوڈ یا شہر تلاش کریں...' : 'Search station code, name, city...'}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-slate-900"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
              </div>

              <select
                value={stationCategoryFilter}
                onChange={e => setStationCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs font-medium focus:bg-white"
              >
                <option value="all">{language === 'ur' ? 'تمام اقسام' : 'All Categories'}</option>
                <option value="counter">{language === 'ur' ? 'کاؤنٹر' : 'Counter'}</option>
                <option value="wallet">{language === 'ur' ? 'موبائل والیٹ' : 'Wallet'}</option>
                <option value="bank">{language === 'ur' ? 'بینک ٹرانسفر' : 'Bank'}</option>
                <option value="branch">{language === 'ur' ? 'برانچ' : 'Branch'}</option>
              </select>
            </div>

            <span className="text-slate-600 font-mono font-semibold">
              {stations.length} {language === 'ur' ? 'اسٹیشنز کل' : 'stations registered'}
            </span>
          </div>

          {/* Stations Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-semibold font-montserrat uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4 text-center">{language === 'ur' ? 'کوڈ' : 'Code'}</th>
                    <th className="py-3 px-4 text-start">{language === 'ur' ? 'اسٹیشن کا نام' : 'Station Name'}</th>
                    <th className="py-3 px-4 text-start">{language === 'ur' ? 'قسم' : 'Category'}</th>
                    <th className="py-3 px-4 text-start">{language === 'ur' ? 'شہر / مقام' : 'City / Region'}</th>
                    <th className="py-3 px-4 text-start">{language === 'ur' ? 'انچارج و فون' : 'In-Charge & Phone'}</th>
                    <th className="py-3 px-4 text-center">{language === 'ur' ? 'حالت' : 'Status'}</th>
                    <th className="py-3 px-4 text-center">{language === 'ur' ? 'اقدامات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {stations
                    .filter(st => {
                      if (stationCategoryFilter !== 'all' && st.category !== stationCategoryFilter) return false;
                      if (!stationSearch.trim()) return true;
                      const q = stationSearch.toLowerCase();
                      return (
                        st.nameUr.toLowerCase().includes(q) ||
                        st.nameEn.toLowerCase().includes(q) ||
                        st.code.toLowerCase().includes(q) ||
                        (st.city && st.city.toLowerCase().includes(q))
                      );
                    })
                    .map(st => {
                      const isMirAli = st.nameUr === 'میرعلی';
                      return (
                        <tr key={st.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4 text-center">
                            <span className="font-mono font-bold text-xs bg-slate-100 text-slate-900 px-2 py-0.5 rounded border border-slate-300">
                              {st.code}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-urdu font-bold text-base text-slate-950 flex items-center gap-1.5">
                                {st.nameUr}
                                {isMirAli && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                                    {language === 'ur' ? 'بنیادی' : 'Default'}
                                  </span>
                                )}
                              </span>
                              <span className="text-xs font-semibold text-slate-600 font-montserrat">{st.nameEn}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 font-urdu-heading">
                              {t(st.category)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-800 font-medium">{st.city || '-'}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-900">{st.inCharge || '-'}</span>
                              {st.phone && <span className="text-xs font-mono text-slate-600">{st.phone}</span>}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => updateStationStatus(st.id, st.status === 'active' ? 'inactive' : 'active')}
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border transition ${
                                st.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                              }`}
                            >
                              {st.status === 'active' ? (
                                <>
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  <span>{language === 'ur' ? 'فعال' : 'Active'}</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 text-slate-400" />
                                  <span>{language === 'ur' ? 'غیر فعال' : 'Inactive'}</span>
                                </>
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedStationToEdit(st);
                                  setIsStationModalOpen(true);
                                }}
                                title="Edit Station"
                                className="p-1.5 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-200 transition border border-slate-200"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {isSuperAdmin && (
                                <button
                                  onClick={() => setStationToDelete(st)}
                                  title="Delete Station (Super Admin Only)"
                                  className="p-1.5 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 transition border border-red-200"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Settings Tab */}
      {stationToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900 font-montserrat">
                {language === 'ur' ? 'اسٹیشن حذف کرنے کی تصدیق' : 'Confirm Delete Station'}
              </h3>
              <p className="text-sm text-slate-600">
                {language === 'ur' ? (
                  <>
                    کیا آپ واقعی اسٹیشن <strong className="text-slate-900">{stationToDelete.nameUr} ({stationToDelete.nameEn})</strong> کو حذف کرنا چاہتے ہیں؟
                  </>
                ) : (
                  <>
                    Are you sure you want to delete station <strong className="text-slate-900">{stationToDelete.nameEn} ({stationToDelete.nameUr})</strong>?
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStationToDelete(null)}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                {language === 'ur' ? 'منسوخ کریں' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteStation(stationToDelete.id);
                  setStationToDelete(null);
                }}
                className="px-5 py-2 text-xs sm:text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow transition"
              >
                {language === 'ur' ? 'ہاں، حذف کریں' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Station Modal in Settings */}
      <StationModal
        isOpen={isStationModalOpen}
        onClose={() => {
          setIsStationModalOpen(false);
          setSelectedStationToEdit(null);
        }}
        stationToEdit={selectedStationToEdit}
      />

      {/* TAB 2: ROLE-BASED ACCESS CONTROL (RBAC) & USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Super Admin Notice or Non-Admin Warning */}
          {isSuperAdmin ? (
            <div className="bg-slate-50 border border-slate-300 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  <Star className="w-5 h-5 fill-white text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 font-urdu-heading text-base">
                    {language === 'ur' ? 'سپر ایڈمن اختیارات فعال ہیں' : 'Super Admin Authority Active'}
                  </h3>
                  <p className="text-xs text-slate-700 font-urdu-body font-semibold">
                    {language === 'ur'
                      ? 'آپ نئے صارفین شامل کر سکتے ہیں، برانچ منیجر یا کیشئر کا کردار تفویض کر سکتے ہیں، اور مخصوص سٹیشنز مختص کر سکتے ہیں۔'
                      : 'You can create users, assign roles (Manager, Cashier, Operator), and restrict station access.'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleOpenAddUser}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm font-urdu-heading cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{language === 'ur' ? 'نیا صارف شامل کریں' : 'Add New User'}</span>
              </button>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-xs sm:text-sm text-amber-950">
              <Lock className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold">
                  {language === 'ur' ? 'اختیارات محدود ہیں (صرف سپر ایڈمن کو صارفین بنانے کی اجازت ہے)' : 'Restricted Access (Super Admin Only)'}
                </p>
                <p className="text-amber-900 font-urdu-body text-xs mt-0.5">
                  {language === 'ur'
                    ? 'آپ بطور ایڈمن (admin) لاگ ان ہیں۔ نئے صارفین شامل کرنا، اختیارات دینا یا ترتیبات تبدیل کرنا صرف سپر ایڈمن (dsumerf@gmail.com) کے کنٹرول میں ہے۔ آپ کو تمام کاروباری ڈیٹا، ترسیلات، ادھار، امانتیں اور رپورٹس سنبھالنے کے مکمل اختیارات حاصل ہیں۔'
                    : 'You are signed in as Admin. Creating users, managing permissions, or altering core system settings is restricted exclusively to the Super Admin (dsumerf@gmail.com). You have full operational control over money transfers, loans, amanat accounts, ledger, and reporting.'}
                </p>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-700" />
                <h3 className="font-bold text-base text-slate-900 font-urdu-heading">
                  {language === 'ur' ? 'نظام کے مجاز صارفین کی فہرست' : 'Authorized System Users'}
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {users.length} {language === 'ur' ? 'صارفین' : 'users'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold font-urdu-heading border-b border-slate-200">
                    <th className="py-3 px-4 text-start">{language === 'ur' ? 'صارف' : 'User'}</th>
                    <th className="py-3 px-4 text-start">{language === 'ur' ? 'کردار / رول' : 'Access Role'}</th>
                    <th className="py-3 px-4 text-start">{language === 'ur' ? 'سٹیشن رسائی' : 'Station Access'}</th>
                    <th className="py-3 px-4 text-start">{language === 'ur' ? 'حالت' : 'Status'}</th>
                    <th className="py-3 px-4 text-start">{language === 'ur' ? 'آخری لاگ ان' : 'Last Login'}</th>
                    {isSuperAdmin && (
                      <th className="py-3 px-4 text-end">{language === 'ur' ? 'اقدامات' : 'Actions'}</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      {/* Name & Username */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                            u.role === 'super_admin'
                              ? 'bg-slate-900 text-white'
                              : u.role === 'manager'
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}>
                            {u.username.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-950 font-urdu-heading">
                              {language === 'ur' && u.fullNameUr ? u.fullNameUr : u.fullName}
                            </p>
                              <span className="text-[11px] text-slate-500 font-mono block">
                              @{u.username}
                            </span>
                            {isSuperAdmin && u.password && (
                              <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-mono inline-block mt-0.5">
                                Key: {u.password}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role Badge & Granted Rights */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              u.role === 'super_admin'
                                ? 'bg-slate-200 text-slate-950 border border-slate-400'
                                : u.role === 'admin'
                                ? 'bg-indigo-100 text-indigo-950 border border-indigo-300'
                                : u.role === 'manager'
                                ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                : u.role === 'cashier'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                : 'bg-purple-100 text-purple-900 border border-purple-200'
                            }`}
                          >
                            {u.role === 'super_admin' && <Star className="w-3 h-3 fill-slate-900 text-slate-900" />}
                            {u.role === 'super_admin'
                              ? (language === 'ur' ? 'سپر ایڈمن (تمام ماسٹر کنٹرول)' : 'Super Admin (Full Master Control)')
                              : u.role === 'admin'
                              ? (language === 'ur' ? 'ایڈمن (کاروباری اختیارات)' : 'Admin (Full Operations)')
                              : u.role === 'manager'
                              ? (language === 'ur' ? 'برانچ منیجر' : 'Branch Manager')
                              : u.role === 'cashier'
                              ? (language === 'ur' ? 'کیشئر' : 'Cashier')
                              : (language === 'ur' ? 'آپریٹر' : 'Operator')}
                          </span>

                          {/* Individual Granted Rights list */}
                          <div className="flex flex-wrap items-center gap-1 mt-0.5">
                            {u.role === 'super_admin' ? (
                              <span className="text-[10px] text-slate-700 font-bold font-mono">All Software Controls Unrestricted</span>
                            ) : (
                              <>
                                {u.permissions?.canAccessOrderList !== false && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 font-medium border border-emerald-200">
                                    {language === 'ur' ? 'آرڈر لسٹ' : 'Order List'}
                                  </span>
                                )}
                                {u.permissions?.canManageStations && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-800 font-medium border border-purple-200">
                                    {language === 'ur' ? 'اسٹیشنز' : 'Stations'}
                                  </span>
                                )}
                                {u.permissions?.canEditExchangeRate && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 font-medium border border-amber-200">
                                    {language === 'ur' ? 'شرح تبادلہ' : 'Exchange Rate'}
                                  </span>
                                )}
                                {u.permissions?.canDeleteTransfers && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-50 text-red-700 font-medium border border-red-200">
                                    {language === 'ur' ? 'حذف کرنا' : 'Delete Rights'}
                                  </span>
                                )}
                                {u.permissions?.canViewReports && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-medium border border-blue-200">
                                    {language === 'ur' ? 'رپورٹس' : 'Reports'}
                                  </span>
                                )}
                                {u.permissions?.canAccessSettings && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-800 font-medium border border-slate-300">
                                    {language === 'ur' ? 'ترتیبات' : 'Settings'}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Station Access */}
                      <td className="py-3 px-4 font-urdu-body">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          {u.stationAccess === 'all'
                            ? (language === 'ur' ? 'تمام سٹیشنز' : 'All Stations')
                            : u.stationAccess}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => isSuperAdmin && handleToggleUserStatus(u)}
                          disabled={!isSuperAdmin || u.username === 'dsumerf@gmail.com' || u.role === 'super_admin'}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold transition ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          } ${isSuperAdmin && u.username !== 'dsumerf@gmail.com' && u.role !== 'super_admin' ? 'hover:opacity-80 cursor-pointer' : ''}`}
                          title={isSuperAdmin && u.username !== 'dsumerf@gmail.com' && u.role !== 'super_admin' ? 'Click to toggle status' : ''}
                        >
                          {u.status === 'active' ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>{language === 'ur' ? 'فعال' : 'Active'}</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-red-600" />
                              <span>{language === 'ur' ? 'غیر فعال' : 'Inactive'}</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Last Login */}
                      <td className="py-3 px-4 text-slate-500 text-xs font-mono">
                        {u.lastLogin ? u.lastLogin.split('T')[0] : '—'}
                      </td>

                      {/* Actions */}
                      {isSuperAdmin && (
                        <td className="py-3 px-4 text-end">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title={language === 'ur' ? 'ترمیم کریں' : 'Edit User'}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {u.username !== 'dsumerf@gmail.com' && u.username !== 'admin' && u.role !== 'super_admin' && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title={language === 'ur' ? 'حذف کریں' : 'Delete User'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Role Permissions Guide Matrix */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-base text-slate-900 font-urdu-heading">
                {language === 'ur' ? 'کرداروں کے اختیارات کی تفصیل (RBAC Matrix)' : 'Role Capabilities Matrix'}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-urdu-body">
              {/* Super Admin */}
              <div className="p-4 rounded-xl border-2 border-slate-700 bg-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-950">Super Admin (سپر ایڈمن)</span>
                  <Star className="w-4 h-4 text-slate-900 fill-slate-900" />
                </div>
                <ul className="space-y-1 text-slate-800 list-disc list-inside">
                  <li>{language === 'ur' ? 'مکمل انتظامی اختیارات' : 'Full system master privileges'}</li>
                  <li>{language === 'ur' ? 'نئے صارفین اور پاس ورڈ بنانا' : 'Create & edit users & passwords'}</li>
                  <li>{language === 'ur' ? 'سٹیشن و برانچ رسائی تفویض کرنا' : 'Assign station & branch restrictions'}</li>
                  <li>{language === 'ur' ? 'سسٹم ڈیٹا ری سیٹ و حذف کرنا' : 'Delete records & perform system reset'}</li>
                </ul>
              </div>

              {/* Branch Manager */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
                <span className="font-bold text-sm text-blue-900 block">Branch Manager (برانچ منیجر)</span>
                <ul className="space-y-1 text-slate-700 list-disc list-inside">
                  <li>{language === 'ur' ? 'ترسیلات، کھاتہ اور امانت کا مکمل انتظام' : 'Transfers, Khata, Amanat management'}</li>
                  <li>{language === 'ur' ? 'شرح تبادلہ اور کمیشن میں ترامیم' : 'Exchange rate & commission settings'}</li>
                  <li>{language === 'ur' ? 'مالیاتی آڈٹ اور سالانہ رپورٹس' : 'Financial audits & yearly reports'}</li>
                  <li>{language === 'ur' ? 'صارفین کے اکاؤنٹس بنانے کا اختیار نہیں' : 'Cannot manage user accounts'}</li>
                </ul>
              </div>

              {/* Cashier */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                <span className="font-bold text-sm text-emerald-900 block">Cashier / Teller (کیشئر)</span>
                <ul className="space-y-1 text-slate-700 list-disc list-inside">
                  <li>{language === 'ur' ? 'نئی ترسیلات اور ادائیگیاں درج کرنا' : 'Book money transfers & payouts'}</li>
                  <li>{language === 'ur' ? 'آرڈر لسٹ مصفح اور واؤچرز پرنٹ کرنا' : 'Print register slips & vouchers'}</li>
                  <li>{language === 'ur' ? 'صرف تفویض شدہ سٹیشن تک رسائی' : 'Restricted to assigned station'}</li>
                  <li>{language === 'ur' ? 'ترتیبات تبدیل کرنے کی اجازت نہیں' : 'Settings are locked'}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b pb-3 text-slate-900">
              <Download className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-base font-urdu-heading">{t('exportBackup')}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="border border-slate-200 p-4 rounded-xl space-y-3">
                <h3 className="font-bold text-slate-800">{t('exportBackup')}</h3>
                <p className="text-slate-500 text-xs font-urdu-body">{t('dataBackupDesc')}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t('exportBackup')} (.JSON)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportMySQLDump}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{language === 'ur' ? 'مکمل MySQL ڈیٹا ڈمپ (.SQL)' : 'Export MySQL Dump (.SQL)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadMySQLSchema}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>{language === 'ur' ? 'MySQL سٹرکچر (mysql_schema.sql)' : 'MySQL Structure (.SQL)'}</span>
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-slate-800">{t('importBackup')}</h3>
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 text-xs font-bold cursor-pointer transition">
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>{language === 'ur' ? '.JSON فائل اپلوڈ کریں' : 'Upload .JSON File'}</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleBackupFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  rows={2}
                  value={importJson}
                  onChange={e => setImportJson(e.target.value)}
                  placeholder="Paste JSON backup text here or upload a .JSON file above..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={handleImportBackup}
                  disabled={!importJson.trim()}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{t('importBackup')}</span>
                </button>
              </div>
            </div>

            {isSuperAdmin && (
              <div className="pt-4 border-t border-slate-200 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleResetDemo}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('resetDemoData')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-3.5 py-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  {t('clearDemoData')}
                </button>
              </div>
            )}
          </div>

          {/* Explicit Browser Storage Warning */}
          <div className="bg-slate-100 border border-slate-300 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-xs sm:text-sm text-slate-950">
            <AlertTriangle className="w-5 h-5 text-slate-800 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-slate-950">{t('storageWarning')}</h4>
              <p className="text-slate-800 leading-relaxed font-urdu-body">
                {language === 'ur'
                  ? 'یہ ایپلیکیشن براؤزر کی مقامی میموری (localStorage) پر کام کرتی ہے۔ براؤزر کی ہسٹری یا کوکیز صاف کرنے سے پہلے اوپر دیے گئے بٹن سے باقاعدگی سے بیک اپ JSON فائل ڈاؤن لوڈ کر کے اپنے پاس محفوظ رکھیں۔'
                  : 'This application persists data in browser localStorage. Download regular JSON backup files before clearing browser storage or switching devices.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal for Delete User / Reset Demo / Clear All */}
      {(userToDelete || confirmAction) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900 font-urdu-heading">
                {userToDelete
                  ? language === 'ur'
                    ? 'صارف حذف کرنے کی تصدیق'
                    : 'Confirm Delete User'
                  : confirmAction === 'reset_demo'
                  ? language === 'ur'
                    ? 'ڈیمو ڈیٹا بحال کرنے کی تصدیق'
                    : 'Confirm Reset to Demo Data'
                  : language === 'ur'
                  ? 'تمام ریکارڈز صاف کرنے کی تصدیق'
                  : 'Confirm Clear All Records'}
              </h3>
              <p className="text-sm text-slate-600">
                {userToDelete
                  ? language === 'ur'
                    ? `کیا آپ واقعی صارف "${userToDelete.fullName}" کو حذف کرنا چاہتے ہیں؟`
                    : `Are you sure you want to delete user "${userToDelete.fullName}"?`
                  : confirmAction === 'reset_demo'
                  ? language === 'ur'
                    ? 'کیا آپ واقعی تمام ریکارڈز کو ابتدائی ڈیمو ڈیٹا پر ری سیٹ کرنا چاہتے ہیں؟'
                    : 'Reset all records and settings back to authentic demo sample data?'
                  : language === 'ur'
                  ? 'انتباہ: کیا آپ واقعی تمام کھاتے اور ریکارڈز صاف کرنا چاہتے ہیں؟'
                  : 'Warning: Are you sure you want to clear all transaction records?'}
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setUserToDelete(null);
                  setConfirmAction(null);
                }}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                {language === 'ur' ? 'منسوخ کریں' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (userToDelete) {
                    const res = deleteUser(userToDelete.id);
                    if (!res.success && res.error) {
                      showToast(res.error, 'error');
                    }
                    setUserToDelete(null);
                  } else if (confirmAction === 'reset_demo') {
                    await resetDemoData();
                    setConfirmAction(null);
                  } else if (confirmAction === 'clear_all') {
                    await clearAllData();
                    setConfirmAction(null);
                  }
                }}
                className="px-5 py-2 text-xs sm:text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow transition"
              >
                {language === 'ur' ? 'ہاں، تصدیق کریں' : 'Yes, Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit User Modal */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        userToEdit={selectedUserToEdit}
      />
    </div>
  );
};
