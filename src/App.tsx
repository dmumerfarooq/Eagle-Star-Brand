/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/views/DashboardView';
import { OrderRegisterView } from './components/views/OrderRegisterView';
import { TransfersView } from './components/views/TransfersView';
import { CustomersView } from './components/views/CustomersView';
import { KhataView } from './components/views/KhataView';
import { AmanatView } from './components/views/AmanatView';
import { LedgerView } from './components/views/LedgerView';
import { ReportsView } from './components/views/ReportsView';
import { SettingsView } from './components/views/SettingsView';
import { StationsView } from './components/views/StationsView';

import { NewTransferModal } from './components/modals/NewTransferModal';
import { RecordPayoutModal } from './components/modals/RecordPayoutModal';
import { NewLoanModal } from './components/modals/NewLoanModal';
import { RecordRepaymentModal } from './components/modals/RecordRepaymentModal';
import { NewAmanatModal, AmanatModalMode } from './components/modals/NewAmanatModal';
import { ReceiptViewerModal } from './components/receipts/ReceiptViewerModal';
import { LoginView } from './components/auth/LoginView';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { MoneyTransfer, Loan, AmanatAccount } from './types';
import { CheckCircle2, AlertCircle, Info, Lock } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    currentScreen,
    setCurrentScreen,
    toast,
    language,
    isAuthenticated,
    isSuperAdmin,
    canAccessSettings,
    isTransferModalOpen,
    selectedTransferForEdit,
    openNewTransferModal,
    openEditTransferModal,
    closeTransferModal
  } = useApp();

  // Modals state
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [selectedTransferForPayout, setSelectedTransferForPayout] = useState<MoneyTransfer | null>(null);

  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);
  const [selectedLoanForRepayment, setSelectedLoanForRepayment] = useState<Loan | null>(null);

  const [isAmanatModalOpen, setIsAmanatModalOpen] = useState(false);
  const [selectedAmanatAccount, setSelectedAmanatAccount] = useState<AmanatAccount | null>(null);
  const [amanatInitialMode, setAmanatInitialMode] = useState<AmanatModalMode | undefined>(undefined);

  const handleOpenPayout = (tr: MoneyTransfer) => {
    setSelectedTransferForPayout(tr);
    setIsPayoutModalOpen(true);
  };

  const handleOpenRepayment = (loan: Loan) => {
    setSelectedLoanForRepayment(loan);
    setIsRepaymentModalOpen(true);
  };

  const handleOpenAmanat = (account?: AmanatAccount, mode?: AmanatModalMode) => {
    setSelectedAmanatAccount(account || null);
    setAmanatInitialMode(mode);
    setIsAmanatModalOpen(true);
  };

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans antialiased">
      {/* Top Header */}
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl mx-auto w-full">
          {currentScreen === 'dashboard' && (
            <DashboardView
              onOpenNewTransfer={openNewTransferModal}
              onOpenNewLoan={() => setIsLoanModalOpen(true)}
              onOpenNewAmanat={() => handleOpenAmanat()}
              onRecordPayout={handleOpenPayout}
            />
          )}

          {currentScreen === 'transfers' && (
            <TransfersView
              onOpenNewTransfer={openNewTransferModal}
              onRecordPayout={handleOpenPayout}
              onEditTransfer={openEditTransferModal}
            />
          )}

          {currentScreen === 'orderRegister' && <OrderRegisterView />}

          {(currentScreen === 'customers' || currentScreen === 'receivers') && (
            <CustomersView />
          )}

          {currentScreen === 'khata' && (
            <KhataView
              onOpenNewLoan={() => setIsLoanModalOpen(true)}
              onRecordRepayment={handleOpenRepayment}
            />
          )}

          {currentScreen === 'amanat' && (
            <AmanatView onOpenNewAmanat={handleOpenAmanat} />
          )}

          {currentScreen === 'cashLedger' && <LedgerView />}

          {currentScreen === 'reports' && <ReportsView />}

          {currentScreen === 'settings' && (
            isSuperAdmin || canAccessSettings ? (
              <SettingsView />
            ) : (
              <div className="bg-white p-8 rounded-3xl border border-red-200 text-center max-w-lg mx-auto my-12 shadow-sm space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
                  <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-slate-950 font-urdu-heading">
                  {language === 'ur' ? 'رسائی ممنوع ہے (صرف سپر ایڈمن)' : 'Access Restricted (Super Admin Only)'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-urdu-body">
                  {language === 'ur'
                    ? 'سسٹم ترتیبات، شرحِ تبادلہ، برانڈ پروفائل، بیک اپ اور صارفین کے اختیارات تبدیل کرنے کی رسائی صرف سپر ایڈمن (dsumerf@gmail.com) کے پاس ہے۔'
                    : 'Access to system settings, exchange rates, business profile, backups, and user management is exclusively restricted to the Super Admin (dsumerf@gmail.com).'}
                </p>
                <button
                  type="button"
                  onClick={() => setCurrentScreen('dashboard')}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer"
                >
                  {language === 'ur' ? 'مرکزی ڈیش بورڈ پر واپس جائیں' : 'Return to Dashboard'}
                </button>
              </div>
            )
          )}

          {currentScreen === 'stations' && <StationsView />}
        </main>
      </div>

      {/* Action Modals */}
      <NewTransferModal
        isOpen={isTransferModalOpen}
        onClose={closeTransferModal}
        transferToEdit={selectedTransferForEdit}
      />

      <RecordPayoutModal
        transfer={selectedTransferForPayout}
        isOpen={isPayoutModalOpen}
        onClose={() => {
          setIsPayoutModalOpen(false);
          setSelectedTransferForPayout(null);
        }}
      />

      <NewLoanModal
        isOpen={isLoanModalOpen}
        onClose={() => setIsLoanModalOpen(false)}
      />

      <RecordRepaymentModal
        loan={selectedLoanForRepayment}
        isOpen={isRepaymentModalOpen}
        onClose={() => {
          setIsRepaymentModalOpen(false);
          setSelectedLoanForRepayment(null);
        }}
      />

      <NewAmanatModal
        existingAccount={selectedAmanatAccount}
        initialMode={amanatInitialMode}
        isOpen={isAmanatModalOpen}
        onClose={() => {
          setIsAmanatModalOpen(false);
          setSelectedAmanatAccount(null);
          setAmanatInitialMode(undefined);
        }}
      />

      {/* Universal Receipt / Print / PDF / WhatsApp Modal */}
      <ReceiptViewerModal />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-fade-in ${
            language === 'ur' ? 'left-5' : 'right-5'
          } ${
            toast.type === 'error'
              ? 'bg-red-50 text-red-900 border-red-200'
              : toast.type === 'info'
              ? 'bg-blue-50 text-blue-900 border-blue-200'
              : 'bg-emerald-50 text-emerald-900 border-emerald-200'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-600" />
          ) : toast.type === 'info' ? (
            <Info className="w-4 h-4 text-blue-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav onOpenNewTransfer={openNewTransferModal} />
    </div>
  );
};

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error?.message || 'Unexpected error' };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AppErrorBoundary caught:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 font-montserrat">Eagle Star Brand</h2>
            <p className="text-sm text-slate-600">
              The application encountered a minor display issue. Click below to refresh.
            </p>
            <button
              onClick={this.handleReload}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition shadow"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AppErrorBoundary>
  );
}

