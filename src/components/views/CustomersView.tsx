/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer, Receiver } from '../../types';
import { EagleStarLogo } from '../common/EagleStarLogo';
import {
  Plus,
  Search,
  Phone,
  MapPin,
  ArrowRightLeft,
  BookOpen,
  X,
  Edit3,
  Trash2
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const {
    customers,
    receivers,
    transfers,
    loans,
    saveCustomer,
    deleteCustomer,
    saveReceiver,
    deleteReceiver,
    t,
    language,
    formatMoney,
    isSuperAdmin,
    canManageCustomers
  } = useApp();

  const [activeTab, setActiveTab] = useState<'senders' | 'receivers'>('senders');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // New / Edit Customer Modal
  const [isNewCustOpen, setIsNewCustOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custCity, setCustCity] = useState('Dubai');
  const [custAddress, setCustAddress] = useState('');

  // New / Edit Receiver Modal
  const [isNewRecOpen, setIsNewRecOpen] = useState(false);
  const [editingReceiver, setEditingReceiver] = useState<Receiver | null>(null);
  const [recName, setRecName] = useState('');
  const [recPhone, setRecPhone] = useState('');
  const [recStation, setRecStation] = useState('میرعلی');
  const [recCity, setRecCity] = useState('North Waziristan');

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredCustomers = customers.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      c.customerCode.toLowerCase().includes(term)
    );
  });

  const filteredReceivers = receivers.filter(r => {
    const term = searchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(term) ||
      r.phone.includes(term) ||
      r.station.toLowerCase().includes(term)
    );
  });

  const openAddCustomer = () => {
    setEditingCustomer(null);
    setCustName('');
    setCustPhone('');
    setCustCity('Dubai');
    setCustAddress('');
    setIsNewCustOpen(true);
  };

  const openEditCustomer = (cust: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCustomer(cust);
    setCustName(cust.name);
    setCustPhone(cust.phone);
    setCustCity(cust.city || 'Dubai');
    setCustAddress(cust.address || '');
    setIsNewCustOpen(true);
  };

  const handleCreateOrSaveCustomer = () => {
    if (!custName.trim()) return;
    if (editingCustomer) {
      saveCustomer({
        ...editingCustomer,
        name: custName.trim(),
        phone: custPhone.trim() || editingCustomer.phone,
        city: custCity || 'Dubai',
        address: custAddress.trim()
      });
    } else {
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        customerCode: `CUST-${Math.floor(100 + Math.random() * 900)}`,
        name: custName.trim(),
        phone: custPhone.trim() || '+971500000000',
        city: custCity || 'Dubai',
        address: custAddress.trim(),
        country: 'United Arab Emirates',
        dateAdded: new Date().toISOString().split('T')[0]
      };
      saveCustomer(newCust);
    }
    setIsNewCustOpen(false);
    setEditingCustomer(null);
  };

  const openAddReceiver = () => {
    setEditingReceiver(null);
    setRecName('');
    setRecPhone('');
    setRecStation('میرعلی');
    setRecCity('North Waziristan');
    setIsNewRecOpen(true);
  };

  const openEditReceiver = (rec: Receiver) => {
    setEditingReceiver(rec);
    setRecName(rec.name);
    setRecPhone(rec.phone);
    setRecStation(rec.station);
    setRecCity(rec.city || 'Pakistan');
    setIsNewRecOpen(true);
  };

  const handleCreateOrSaveReceiver = () => {
    if (!recName.trim()) return;
    if (editingReceiver) {
      saveReceiver({
        ...editingReceiver,
        name: recName.trim(),
        phone: recPhone.trim() || editingReceiver.phone,
        station: recStation.trim() || editingReceiver.station,
        city: recCity || 'Pakistan'
      });
    } else {
      const newRec: Receiver = {
        id: `rec-${Date.now()}`,
        name: recName.trim(),
        phone: recPhone.trim() || '03000000000',
        station: recStation.trim() || 'میرعلی',
        city: recCity || 'Pakistan',
        country: 'Pakistan'
      };
      saveReceiver(newRec);
    }
    setIsNewRecOpen(false);
    setEditingReceiver(null);
  };

  // Associated records for selected customer
  const customerTransfers = selectedCustomer
    ? transfers.filter(tr => tr.senderId === selectedCustomer.id || tr.senderPhone === selectedCustomer.phone)
    : [];
  const customerLoans = selectedCustomer
    ? loans.filter(l => l.borrowerName.toLowerCase() === selectedCustomer.name.toLowerCase())
    : [];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <EagleStarLogo variant="icon" size="md" isDarkBackground={false} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-urdu-heading">
                {t('customers')} & {t('receivers')}
              </h1>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              {language === 'ur'
                ? 'دبئی ارسال کنندگان اور پاکستان وصول کنندگان کی مکمل ڈائریکٹری'
                : 'Complete directory of Dubai senders and Pakistan station receivers'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'senders' ? (
            <button
              onClick={openAddCustomer}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addCustomer')}</span>
            </button>
          ) : (
            <button
              onClick={openAddReceiver}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addReceiver')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('senders')}
            className={`px-4 py-1.5 rounded-md font-bold transition cursor-pointer ${
              activeTab === 'senders' ? 'bg-white text-emerald-950 shadow-sm' : 'text-slate-600 hover:text-emerald-900'
            }`}
          >
            {t('customers')} ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('receivers')}
            className={`px-4 py-1.5 rounded-md font-bold transition cursor-pointer ${
              activeTab === 'receivers' ? 'bg-white text-emerald-950 shadow-sm' : 'text-slate-600 hover:text-emerald-900'
            }`}
          >
            {t('receivers')} ({receivers.length})
          </button>
        </div>

        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 rtl:right-3 rtl:left-auto" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={t('search')}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 rtl:pr-9 rtl:pl-3 text-xs focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* List */}
      {activeTab === 'senders' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map(cust => (
            <div
              key={cust.id}
              onClick={() => setSelectedCustomer(cust)}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-400 hover:bg-emerald-50/20 cursor-pointer transition space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] text-emerald-700 font-mono font-bold block">{cust.customerCode}</span>
                  <h3 className="font-bold text-slate-900 text-base">{cust.name}</h3>
                  {cust.nameUr && <span className="font-urdu-heading text-xs text-slate-600 block">{cust.nameUr}</span>}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                    {cust.city}
                  </span>
                  {canManageCustomers && (
                    <button
                      onClick={e => openEditCustomer(cust, e)}
                      className="p-1 text-amber-700 hover:bg-amber-50 rounded transition cursor-pointer"
                      title={t('edit')}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isSuperAdmin && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (confirmDeleteId === cust.id) {
                          deleteCustomer(cust.id);
                          setConfirmDeleteId(null);
                        } else {
                          setConfirmDeleteId(cust.id);
                        }
                      }}
                      className={`p-1 rounded transition cursor-pointer flex items-center gap-1 ${
                        confirmDeleteId === cust.id
                          ? 'bg-red-600 text-white px-1.5 text-[10px] font-bold'
                          : 'text-slate-400 hover:text-red-700 hover:bg-red-50'
                      }`}
                      title={t('delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {confirmDeleteId === cust.id && (
                        <span>{language === 'ur' ? 'حذف؟' : 'Confirm'}</span>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{cust.phone}</span>
                </div>
                {cust.address && (
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cust.address}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-bold">
                <span>{t('viewProfile')} →</span>
                <span className="text-slate-400 text-[11px] font-mono">{cust.dateAdded}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReceivers.map(rec => (
            <div
              key={rec.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{rec.name}</h3>
                  {rec.nameUr && <span className="font-urdu-heading text-xs text-slate-600 block">{rec.nameUr}</span>}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded font-urdu-heading">
                    {rec.station}
                  </span>
                  {canManageCustomers && (
                    <button
                      onClick={() => openEditReceiver(rec)}
                      className="p-1 text-amber-700 hover:bg-amber-50 rounded transition cursor-pointer"
                      title={t('edit')}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isSuperAdmin && (
                    <button
                      onClick={() => {
                        if (confirmDeleteId === rec.id) {
                          deleteReceiver(rec.id);
                          setConfirmDeleteId(null);
                        } else {
                          setConfirmDeleteId(rec.id);
                        }
                      }}
                      className={`p-1 rounded transition cursor-pointer flex items-center gap-1 ${
                        confirmDeleteId === rec.id
                          ? 'bg-red-600 text-white px-1.5 text-[10px] font-bold'
                          : 'text-slate-400 hover:text-red-700 hover:bg-red-50'
                      }`}
                      title={t('delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {confirmDeleteId === rec.id && (
                        <span>{language === 'ur' ? 'حذف؟' : 'Confirm'}</span>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{rec.phone}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{rec.city}, {rec.country}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Customer Profile Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full my-8 overflow-hidden flex flex-col border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div>
                <span className="text-xs text-emerald-400 font-mono font-bold">{selectedCustomer.customerCode}</span>
                <h3 className="font-bold text-lg">{selectedCustomer.name}</h3>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-sm">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-500 block">{t('senderPhone')}:</span>
                  <strong className="font-mono">{selectedCustomer.phone}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">{t('senderCity')}:</span>
                  <strong>{selectedCustomer.city}, {selectedCustomer.country}</strong>
                </div>
              </div>

              {/* Transfers History */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                  <span>{t('moneyTransfers')} ({customerTransfers.length})</span>
                </h4>
                {customerTransfers.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">{t('noDataFound')}</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden text-xs">
                    {customerTransfers.map(tr => (
                      <div key={tr.id} className="p-2.5 flex justify-between items-center bg-white">
                        <div>
                          <strong className="font-mono text-slate-900">{tr.orderNumber}</strong>
                          <span className="text-slate-500 block">{tr.date} → {tr.receiverName} ({tr.station})</span>
                        </div>
                        <div className="text-right">
                          <strong className="font-mono text-slate-900">{tr.amountAED} AED</strong>
                          <span className="block text-emerald-700 font-mono">{formatMoney(tr.netPayablePKR, 'PKR')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Khata Loans */}
              {customerLoans.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-slate-800" />
                    <span>{t('khata')} ({customerLoans.length})</span>
                  </h4>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden text-xs">
                    {customerLoans.map(l => (
                      <div key={l.id} className="p-2.5 flex justify-between items-center bg-white">
                        <div>
                          <strong className="font-mono text-slate-900">{l.loanNo}</strong>
                          <span className="text-slate-500 block">{l.loanDate}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500 block">{t('remainingLoanPkr')}</span>
                          <strong className="font-mono text-red-600">{formatMoney(l.remainingBalance, l.currency)}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New / Edit Customer Modal */}
      {isNewCustOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h3 className="font-bold text-lg">
              {editingCustomer
                ? language === 'ur'
                  ? 'گاہک کی معلومات میں ترمیم'
                  : 'Edit Customer'
                : t('addCustomer')}
            </h3>
            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block mb-1 font-semibold">{t('senderName')} *</label>
                <input
                  type="text"
                  value={custName}
                  onChange={e => setCustName(e.target.value)}
                  placeholder="e.g. Haji Rasool Khan"
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">{t('senderPhone')} *</label>
                <input
                  type="text"
                  value={custPhone}
                  onChange={e => setCustPhone(e.target.value)}
                  placeholder="+971501234567"
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">{t('senderCity')}</label>
                <input
                  type="text"
                  value={custCity}
                  onChange={e => setCustCity(e.target.value)}
                  placeholder="Dubai"
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">{t('address')}</label>
                <input
                  type="text"
                  value={custAddress}
                  onChange={e => setCustAddress(e.target.value)}
                  placeholder="Sonapur / Deira"
                  className="w-full border rounded-lg p-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsNewCustOpen(false)}
                className="px-3 py-1.5 border rounded-lg text-xs font-medium"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleCreateOrSaveCustomer}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New / Edit Receiver Modal */}
      {isNewRecOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h3 className="font-bold text-lg">
              {editingReceiver
                ? language === 'ur'
                  ? 'وصول کنندہ کی معلومات میں ترمیم'
                  : 'Edit Receiver'
                : t('addReceiver')}
            </h3>
            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block mb-1 font-semibold">{t('receiverName')} *</label>
                <input
                  type="text"
                  value={recName}
                  onChange={e => setRecName(e.target.value)}
                  placeholder="e.g. سامیرخان والد عارف جان"
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">{t('receiverPhone')}</label>
                <input
                  type="text"
                  value={recPhone}
                  onChange={e => setRecPhone(e.target.value)}
                  placeholder="03001234567"
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">{t('station')} *</label>
                <input
                  type="text"
                  value={recStation}
                  onChange={e => setRecStation(e.target.value)}
                  placeholder="میرعلی / ایزی پیسہ / جیز کیش / بنوں"
                  className="w-full border rounded-lg p-2 font-urdu-heading"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsNewRecOpen(false)}
                className="px-3 py-1.5 border rounded-lg text-xs font-medium"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleCreateOrSaveReceiver}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
