/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp, NavScreen } from '../../context/AppContext';
import { EagleStarLogo } from '../common/EagleStarLogo';
import {
  LayoutDashboard,
  ArrowRightLeft,
  FileSpreadsheet,
  Users,
  BookOpen,
  ShieldCheck,
  Wallet,
  BarChart3,
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    currentScreen,
    setCurrentScreen,
    sidebarOpen,
    setSidebarOpen,
    t,
    language,
    currentUser,
    logout,
    isSuperAdmin,
    canAccessTransfers,
    canAccessOrderList,
    canManageStations,
    canManageCustomers,
    canManageKhata,
    canManageAmanat,
    canAccessCashLedger,
    canViewReports,
    canAccessSettings,
    settings
  } = useApp();

  const allNavItems: { id: NavScreen; labelKey: string; icon: React.ReactNode; badge?: string; allowed: boolean }[] = [
    {
      id: 'dashboard',
      labelKey: 'dashboard',
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
      allowed: true
    },
    {
      id: 'transfers',
      labelKey: 'moneyTransfers',
      icon: <ArrowRightLeft className="w-5 h-5 shrink-0" />,
      allowed: canAccessTransfers
    },
    {
      id: 'orderRegister',
      labelKey: 'orderRegister',
      icon: <FileSpreadsheet className="w-5 h-5 shrink-0" />,
      allowed: canAccessOrderList
    },
    {
      id: 'stations',
      labelKey: 'stations',
      icon: <Building2 className="w-5 h-5 shrink-0" />,
      allowed: canManageStations
    },
    {
      id: 'customers',
      labelKey: 'customers',
      icon: <Users className="w-5 h-5 shrink-0" />,
      allowed: canManageCustomers
    },
    {
      id: 'khata',
      labelKey: 'khata',
      icon: <BookOpen className="w-5 h-5 shrink-0" />,
      allowed: canManageKhata
    },
    {
      id: 'amanat',
      labelKey: 'amanat',
      icon: <ShieldCheck className="w-5 h-5 shrink-0" />,
      allowed: canManageAmanat
    },
    {
      id: 'cashLedger',
      labelKey: 'cashLedger',
      icon: <Wallet className="w-5 h-5 shrink-0" />,
      allowed: canAccessCashLedger
    },
    {
      id: 'reports',
      labelKey: 'reports',
      icon: <BarChart3 className="w-5 h-5 shrink-0" />,
      allowed: canViewReports
    },
    {
      id: 'settings',
      labelKey: 'settings',
      icon: <Settings className="w-5 h-5 shrink-0" />,
      badge: isSuperAdmin ? (language === 'ur' ? 'سپر ایڈمن' : 'Super Admin') : undefined,
      allowed: isSuperAdmin || canAccessSettings
    }
  ];

  const navItems = allNavItems.filter(item => isSuperAdmin || item.allowed);

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`no-print bg-white border-r border-slate-200 text-slate-800 flex flex-col shrink-0 transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-72 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'
        } fixed inset-y-0 ${language === 'ur' ? 'right-0 border-l border-slate-200 border-r-0' : 'left-0'} lg:static pt-16 lg:pt-0 shadow-lg`}
      >
        {/* Sidebar Top Header & Mobile Close */}
        {sidebarOpen ? (
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3 overflow-hidden">
              <EagleStarLogo variant="icon" size="md" isDarkBackground={false} />
              <div className="flex flex-col min-w-0">
                <span className="font-brand-en text-xs font-black tracking-widest text-slate-950 uppercase truncate">
                  {settings.businessNameEn || 'Eagle Star Brand'}
                </span>
                <span className="font-urdu-ui text-[13px] text-slate-950 font-bold -mt-0.5 truncate" dir="rtl">
                  {settings.businessNameUr || 'ایگل اسٹار برانڈ'}
                </span>
              </div>
            </div>

            {/* Desktop collapse button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="hidden lg:flex items-center justify-center p-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-200 transition shrink-0 cursor-pointer"
              aria-label="Collapse sidebar"
              title={language === 'ur' ? 'مینیو بند کریں' : 'Collapse Menu'}
            >
              {language === 'ur' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>

            {/* Mobile close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-200 transition ml-auto"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          /* Collapsed State Top Header: Large Visible Logo + Expand Button Stacked Cleanly */
          <div className="flex flex-col items-center justify-center gap-2 py-3 px-2 border-b border-slate-200 bg-slate-50">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-emerald-400 transition cursor-pointer"
              title={language === 'ur' ? 'ایگل اسٹار برانڈ - مینیو کھولیں' : 'Eagle Star Brand - Expand Menu'}
            >
              <EagleStarLogo variant="icon" size="md" isDarkBackground={false} />
            </button>

            <button
              onClick={() => setSidebarOpen(true)}
              className="hidden lg:flex items-center justify-center w-10 h-7 rounded-lg bg-slate-200/80 hover:bg-gradient-to-r hover:from-emerald-600 hover:to-teal-600 text-slate-800 hover:text-white transition cursor-pointer"
              aria-label="Expand sidebar"
              title={language === 'ur' ? 'مینیو کھولیں' : 'Expand Menu'}
            >
              {language === 'ur' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* Navigation List - Large Crisp Icons & High Contrast Readable Urdu Text */}
        <nav className="flex-1 px-3 py-3 space-y-1.5 overflow-y-auto">
          {navItems.map(item => {
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentScreen(item.id);
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center ${
                  sidebarOpen ? 'gap-3 px-3 py-2' : 'justify-center py-2.5 px-2'
                } rounded-xl transition-all duration-150 cursor-pointer group ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md shadow-emerald-700/25'
                    : 'text-slate-800 hover:text-emerald-950 hover:bg-emerald-50/70 font-semibold'
                }`}
                title={t(item.labelKey)}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100 group-hover:text-emerald-800'
                  }`}
                >
                  {item.icon}
                </div>
                {sidebarOpen && (
                  <div className="flex-1 flex items-center justify-between text-start min-w-0">
                    <span
                      className={`truncate ${
                        language === 'ur'
                          ? 'font-urdu-ui text-[15.5px] font-bold leading-normal py-0.5'
                          : 'font-sans text-sm font-bold tracking-wide'
                      } ${isActive ? 'text-white' : 'text-slate-900'}`}
                    >
                      {t(item.labelKey)}
                    </span>
                    {item.badge && (
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 shadow-2xs ${
                          isActive
                            ? 'bg-white/25 text-white border border-white/30'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        } ${language === 'ur' ? 'font-urdu-ui' : 'font-mono'}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Active Admin Profile & Logout Box in the bottom left menu */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 shrink-0">
          {currentUser ? (
            <div>
              {sidebarOpen ? (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center font-black text-xs uppercase shadow-sm">
                        {currentUser.username.slice(0, 2)}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold text-slate-950 truncate ${language === 'ur' ? 'font-urdu-ui' : 'font-sans'}`}>
                        {language === 'ur' && currentUser.fullNameUr ? currentUser.fullNameUr : currentUser.fullName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                            currentUser.role === 'super_admin'
                              ? 'bg-slate-900 text-white'
                              : currentUser.role === 'manager'
                              ? 'bg-blue-600 text-white'
                              : 'bg-emerald-700 text-white'
                          }`}
                        >
                          {t(currentUser.role)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono font-medium truncate">
                          @{currentUser.username}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sign Out / لاگ آؤٹ Button */}
                  <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 hover:border-red-200 text-xs font-bold transition shadow-xs cursor-pointer"
                    title={language === 'ur' ? 'اکاؤنٹ سے لاگ آؤٹ کریں' : 'Sign out from this terminal'}
                  >
                    <LogOut className="w-4 h-4 text-red-600" />
                    <span className={language === 'ur' ? 'font-urdu-ui text-xs font-bold' : ''}>
                      {language === 'ur' ? 'لاگ آؤٹ (ایڈمن)' : 'Admin Logout'}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2.5 py-1">
                  <div className="relative" title={currentUser.fullName || currentUser.username}>
                    <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center font-black text-xs uppercase shadow-sm">
                      {currentUser.username.slice(0, 2)}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                  </div>
                  <button
                    onClick={logout}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition shadow-xs cursor-pointer"
                    title={language === 'ur' ? 'لاگ آؤٹ کریں' : 'Admin Logout'}
                  >
                    <LogOut className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              {sidebarOpen ? (
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{language === 'ur' ? 'ایڈمن لاگ ان' : 'Admin Login'}</span>
                </button>
              ) : (
                <div className="flex justify-center">
                  <button
                    onClick={logout}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
                    title="Login"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
