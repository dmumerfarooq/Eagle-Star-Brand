/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp, NavScreen } from '../../context/AppContext';
import {
  LayoutDashboard,
  ArrowRightLeft,
  FileSpreadsheet,
  BookOpen,
  Menu,
  ShieldCheck,
  Plus
} from 'lucide-react';

interface MobileBottomNavProps {
  onOpenNewTransfer: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenNewTransfer }) => {
  const { currentScreen, setCurrentScreen, sidebarOpen, setSidebarOpen, language } = useApp();

  const navItems: { id: NavScreen; labelUr: string; labelEn: string; icon: React.ReactNode }[] = [
    {
      id: 'dashboard',
      labelUr: 'مرکزی',
      labelEn: 'Home',
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
      id: 'transfers',
      labelUr: 'ترسیلات',
      labelEn: 'Transfers',
      icon: <ArrowRightLeft className="w-5 h-5" />
    },
    {
      id: 'orderRegister',
      labelUr: 'مصفح',
      labelEn: 'Musaffah',
      icon: <FileSpreadsheet className="w-5 h-5" />
    },
    {
      id: 'khata',
      labelUr: 'کھاتہ',
      labelEn: 'Khata',
      icon: <BookOpen className="w-5 h-5" />
    }
  ];

  return (
    <div className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 text-slate-900 pb-safe shadow-lg">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map(item => {
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentScreen(item.id);
                setSidebarOpen(false);
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition ${
                isActive ? 'text-emerald-700 font-black scale-105' : 'text-slate-800 hover:text-emerald-800 font-bold'
              }`}
            >
              <div className="relative">
                {item.icon}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-600 rounded-full shadow-[0_0_6px_#059669]" />
                )}
              </div>
              <span className={`text-[11px] mt-1 truncate max-w-[68px] ${
                language === 'ur' ? 'font-urdu-ui font-bold' : 'font-sans font-bold'
              }`}>
                {language === 'ur' ? item.labelUr : item.labelEn}
              </span>
            </button>
          );
        })}

        {/* Center Quick Add Jewel Button */}
        <button
          onClick={onOpenNewTransfer}
          className="flex flex-col items-center justify-center -mt-6 mx-1 shrink-0"
          title={language === 'ur' ? 'نیا آرڈر درج کریں' : 'New Transfer'}
        >
          <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-700/30 border-2 border-white active:scale-95 transition">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className={`text-[11px] mt-0.5 text-emerald-800 font-bold ${
            language === 'ur' ? 'font-urdu-ui' : 'font-sans'
          }`}>
            {language === 'ur' ? 'نیا آرڈر' : 'New'}
          </span>
        </button>

        {/* More / Menu Drawer toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition ${
            sidebarOpen ? 'text-emerald-700 font-extrabold' : 'text-slate-700 hover:text-emerald-800'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className={`text-[11px] mt-1 truncate max-w-[68px] ${
            language === 'ur' ? 'font-urdu-ui font-bold' : 'font-sans font-semibold'
          }`}>
            {language === 'ur' ? 'مزید مینو' : 'Menu'}
          </span>
        </button>
      </div>
    </div>
  );
};
