/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { EagleStarLogo } from '../common/EagleStarLogo';
import {
  Languages,
  Menu,
  TrendingUp,
  Clock,
  Shield
} from 'lucide-react';

interface HeaderProps {
  onOpenNewTransfer?: () => void;
  onOpenNewLoan?: () => void;
  onOpenNewAmanat?: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
  const {
    language,
    toggleLanguage,
    sidebarOpen,
    setSidebarOpen,
    settings
  } = useApp();

  return (
    <header className="no-print bg-white text-slate-900 border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Hamburger (Mobile) + Official Eagle Star Brand Lockup */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition lg:hidden"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Official Eagle Star Brand Crest */}
            <div className="flex items-center gap-3">
              <EagleStarLogo
                variant="horizontal"
                size="md"
                showSubtitle={true}
                isDarkBackground={false}
              />
              <span className="hidden xl:inline-block h-6 w-px bg-slate-200 mx-1"></span>
              <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-[11px] font-bold text-slate-700 uppercase tracking-wider font-mono">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                {language === 'ur' ? 'دبئی ⇌ خیبر پختونخوا ترسیلات نیٹ ورک' : 'Dubai ⇌ KPK Remittance Network'}
              </span>
            </div>
          </div>

          {/* Right: Exchange Rate Pill, Live Date, and Language Toggle */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Live Exchange Rate Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50/60 border border-emerald-200 rounded-xl shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900">
                <span className="text-emerald-800 font-sans font-bold">
                  {language === 'ur' ? 'شرحِ تبادلہ:' : 'Rate:'}
                </span>
                <span className="text-emerald-950 font-black">
                  {language === 'ur'
                    ? `1 درہم = ${Number(settings.defaultExchangeRate || 77.50).toFixed(2)} روپے`
                    : `1 AED = ${Number(settings.defaultExchangeRate || 77.50).toFixed(2)} PKR`}
                </span>
              </div>
            </div>

            {/* System Date Display */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 font-semibold font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {new Date().toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-800 px-3 py-1.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer"
              title="Switch Language / زبان تبدیل کریں"
            >
              <Languages className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className={language === 'en' ? 'text-emerald-700 font-extrabold underline' : 'text-slate-600 font-semibold'}>
                  EN
                </span>
                <span className="text-slate-300">/</span>
                <span className={language === 'ur' ? 'text-emerald-700 font-extrabold underline font-urdu-ui' : 'text-slate-600 font-semibold font-urdu-ui'}>
                  اردو
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
