/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EagleStarLogo } from '../common/EagleStarLogo';
import {
  Lock,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  Languages,
  CheckCircle2,
  AlertCircle,
  Building2,
  ArrowRight,
  Receipt,
  FileSpreadsheet,
  MessageCircle,
  BadgeCheck,
  LockKeyhole
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, language, toggleLanguage, settings } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim()) {
      setErrorMsg(
        language === 'ur'
          ? 'برائے مہربانی یوزر نام یا ای میل درج کریں'
          : 'Please enter your username or email'
      );
      return;
    }
    if (!password) {
      setErrorMsg(
        language === 'ur'
          ? 'برائے مہربانی پاس ورڈ درج کریں'
          : 'Please enter your password'
      );
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = login(username, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMsg(
          res.error ||
            (language === 'ur'
              ? 'لاگ ان کی تفصیلات درست نہیں ہیں!'
              : 'Invalid login credentials!')
        );
      }
    }, 350);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/50 flex flex-col justify-between p-4 sm:p-6 lg:p-8 text-slate-900 relative overflow-hidden font-sans"
      dir={language === 'ur' ? 'rtl' : 'ltr'}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 -left-20 w-[550px] h-[550px] bg-blue-200/35 blur-[140px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 -right-20 w-[500px] h-[500px] bg-emerald-200/30 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-slate-200/40 blur-[160px] rounded-full pointer-events-none"></div>

      {/* Top Header */}
      <header className="relative z-20 flex items-center justify-between max-w-7xl mx-auto w-full pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <EagleStarLogo
            variant="horizontal"
            size="md"
            showSubtitle={true}
            isDarkBackground={false}
          />
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-200 rtl:border-r rtl:border-l-0 rtl:pr-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-mono font-bold text-slate-700">
              Dubai ⇌ Pakistan Financial Network
            </span>
          </div>
        </div>

        {/* Top Controls: Exchange Rate & Language Switcher */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-xl shadow-xs">
            <span className="text-xs text-slate-600 font-bold">Live Rate:</span>
            <span className="text-xs font-mono font-black text-blue-900">
              1 AED = {Number(settings.defaultExchangeRate || 77.50).toFixed(2)} PKR
            </span>
          </div>

          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer"
            title="Switch Language / زبان تبدیل کریں"
          >
            <Languages className="w-4 h-4 text-blue-600" />
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span
                className={
                  language === 'en'
                    ? 'text-blue-800 font-extrabold underline'
                    : 'text-slate-600 font-medium'
                }
              >
                EN
              </span>
              <span className="text-slate-300">/</span>
              <span
                className={
                  language === 'ur'
                    ? 'text-blue-800 font-extrabold underline font-urdu-heading'
                    : 'text-slate-600 font-medium font-urdu-heading'
                }
              >
                اردو
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto w-full my-auto py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Visual Brand & Network Architecture */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/90 border border-blue-200 text-blue-900 text-xs font-bold font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                <span>
                  {language === 'ur'
                    ? 'مرکزی محفوظ مالیاتی سسٹم'
                    : 'Enterprise Remittance & Khata Engine'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                {language === 'ur' ? (
                  <span className="font-urdu-heading leading-normal">
                    دبئی سے خیبر پختونخوا و پاکستان <br />
                    <span className="text-blue-700">بااعتماد تیز ترین ترسیلِ زر</span>
                  </span>
                ) : (
                  <>
                    Executive Remittance <br />
                    <span className="text-blue-700">& Ledger Management Portal</span>
                  </>
                )}
              </h1>

              <p className="text-xs sm:text-sm text-slate-700 font-semibold max-w-xl leading-relaxed">
                {language === 'ur'
                  ? 'میرعلی، بنوں، پشاور، ایزی پیسہ اور تمام برانچوں کے لیے مصدقہ رسیدیں، کھاتہ ادھار، اور امانتوں کا فوری حساب کتاب۔'
                  : 'Authorized direct money transfers, live PKR exchange rate calculation, authentic Urdu Musaffah register receipts, and full RBAC counter controls.'}
              </p>
            </div>

            {/* Network Diagram Graphic */}
            <div className="relative w-full rounded-3xl bg-gradient-to-b from-white/95 to-slate-50/90 border-2 border-slate-200/90 shadow-xl p-6 sm:p-8 overflow-hidden min-h-[320px] flex items-center justify-center">
              <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

              <svg viewBox="0 0 600 280" className="w-full h-full max-h-[280px] select-none">
                <defs>
                  <linearGradient id="corridorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="50%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>

                  <filter id="shadowBlur" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow
                      dx="0"
                      dy="4"
                      stdDeviation="6"
                      floodColor="#1e3a8a"
                      floodOpacity="0.15"
                    />
                  </filter>
                </defs>

                {/* Primary Transfer Arc */}
                <path
                  d="M 90 200 C 180 70, 420 70, 510 200"
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M 90 200 C 180 70, 420 70, 510 200"
                  fill="none"
                  stroke="url(#corridorGrad)"
                  strokeWidth="3.5"
                  strokeDasharray="16 12"
                  className="animate-dash-flow"
                  strokeLinecap="round"
                />

                {/* Dubai Hub */}
                <g transform="translate(90, 200)" filter="url(#shadowBlur)">
                  <circle r="36" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2.5" />
                  <rect x="-6" y="-20" width="12" height="30" rx="2" fill="#1e40af" />
                  <polygon points="0,-26 -4,-20 4,-20" fill="#1d4ed8" />
                  <circle cx="0" cy="0" r="3" fill="#ffffff" />
                  <text
                    x="0"
                    y="24"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="800"
                    fill="#0f172a"
                    fontFamily="Montserrat"
                  >
                    DUBAI (AED)
                  </text>
                </g>

                {/* Eagle Star Center Node */}
                <g transform="translate(300, 115)" filter="url(#shadowBlur)">
                  <circle r="40" fill="#ffffff" stroke="#0f172a" strokeWidth="3" />
                  <polygon
                    points="300,100 304,110 315,111 307,118 309,129 300,123 291,129 293,118 285,111 296,110"
                    transform="translate(-300, -115)"
                    fill="#1e293b"
                  />
                  <text
                    x="0"
                    y="24"
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="900"
                    fill="#0f172a"
                    letterSpacing="1"
                  >
                    EAGLE STAR
                  </text>
                </g>

                {/* Pakistan Distribution Hub */}
                <g transform="translate(510, 200)" filter="url(#shadowBlur)">
                  <circle r="36" fill="#f0fdf4" stroke="#10b981" strokeWidth="2.5" />
                  <path d="M -10 10 L -10 -12 Q 0 -24 10 -12 L 10 10 Z" fill="#047857" />
                  <circle cx="0" cy="0" r="3" fill="#ffffff" />
                  <text
                    x="0"
                    y="24"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="800"
                    fill="#0f172a"
                    fontFamily="Montserrat"
                  >
                    PAKISTAN (PKR)
                  </text>
                </g>

                {/* Branches */}
                <g transform="translate(220, 225)">
                  <rect
                    x="-35"
                    y="-10"
                    width="70"
                    height="20"
                    rx="6"
                    fill="#f8fafc"
                    stroke="#cbd5e1"
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="700"
                    fill="#334155"
                  >
                    میرعلی کاؤنٹر
                  </text>
                </g>

                <g transform="translate(380, 225)">
                  <rect
                    x="-35"
                    y="-10"
                    width="70"
                    height="20"
                    rx="6"
                    fill="#f8fafc"
                    stroke="#cbd5e1"
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="700"
                    fill="#334155"
                  >
                    بنوں / پشاور
                  </text>
                </g>
              </svg>

              {/* Floating Status Pill */}
              <div className="absolute top-4 left-4 sm:top-5 sm:left-5 bg-white/95 backdrop-blur-md p-3 rounded-2xl border-2 border-blue-200/90 shadow-md max-w-[210px] hidden sm:block">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="text-[10px] font-mono font-bold text-slate-800 uppercase">
                      Direct Network
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                    Operational
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs font-mono font-black text-slate-950">
                  <span>Dubai Desk</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 inline mx-1" />
                  <span className="text-emerald-800">PK Counters</span>
                </div>
              </div>

              {/* Floating Musaffah Slip Pill */}
              <div className="absolute bottom-4 right-4 sm:bottom-5 sm:right-5 bg-white/95 backdrop-blur-md p-3 rounded-2xl border-2 border-emerald-200/90 shadow-md max-w-[210px] hidden sm:block">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-950 block font-urdu-heading">
                      مصفح رسید کھاتہ
                    </span>
                    <span className="text-[10px] font-bold text-emerald-900 block font-mono">
                      Print & PDF Ready
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom 3 Highlights */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/85 backdrop-blur-xs p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-800 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-950 block">256-Bit SSL</span>
                  <span className="text-[10px] text-slate-600 font-semibold block">
                    Encrypted Session
                  </span>
                </div>
              </div>

              <div className="bg-white/85 backdrop-blur-xs p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-950 block">Urdu Receipts</span>
                  <span className="text-[10px] text-slate-600 font-semibold block">
                    Official Musaffah
                  </span>
                </div>
              </div>

              <div className="bg-white/85 backdrop-blur-xs p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-800 shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-950 block">Multi-Station</span>
                  <span className="text-[10px] text-slate-600 font-semibold block">
                    Mirali & Bannu
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Professional Corporate Login Terminal */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-white text-slate-900 rounded-3xl shadow-2xl border-2 border-slate-200/90 p-7 sm:p-9 relative overflow-hidden">
              {/* Top brand accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-emerald-600 to-slate-900"></div>

              {/* Brand Header */}
              <div className="text-center mb-6 pt-2">
                <div className="flex justify-center mb-3">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
                    <EagleStarLogo variant="icon" size="lg" isDarkBackground={false} />
                  </div>
                </div>

                <h2 className="font-brand-en text-xl sm:text-2xl font-black tracking-wider uppercase text-slate-950">
                  Eagle Star Brand
                </h2>

                <p
                  className="font-brand-urdu text-lg sm:text-xl font-black text-slate-950 -mt-0.5"
                  dir="rtl"
                >
                  ایگل اسٹار برانڈ
                </p>

                <p className="text-xs text-slate-600 font-bold mt-1 uppercase tracking-wider font-mono">
                  {language === 'ur' ? 'مرکزی لاگ ان ٹرمینل' : 'Authorized Access Portal'}
                </p>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="mb-4 p-3.5 bg-red-50 border border-red-300 rounded-xl text-xs font-bold text-red-950 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-700" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5 font-urdu-heading">
                    {language === 'ur'
                      ? 'یوزر نام یا ای میل (Username / Email)'
                      : 'Username or Email'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={
                        language === 'ur'
                          ? 'اپنا یوزر نام یا ای میل درج کریں...'
                          : 'Enter your username or email...'
                      }
                      required
                      autoComplete="username"
                      className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3.5 py-3 text-sm text-slate-950 font-bold focus:bg-white focus:border-emerald-600 focus:outline-hidden transition shadow-2xs"
                    />
                    <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 rtl:left-3.5 rtl:right-auto pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5 font-urdu-heading">
                    {language === 'ur' ? 'پاس ورڈ (Password)' : 'Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        language === 'ur'
                          ? 'اپنا پاس ورڈ درج کریں...'
                          : 'Enter your password...'
                      }
                      required
                      autoComplete="current-password"
                      className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3.5 py-3 text-sm text-slate-950 font-bold focus:bg-white focus:border-emerald-600 focus:outline-hidden transition shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 rtl:left-3.5 rtl:right-auto text-slate-500 hover:text-slate-950 transition cursor-pointer"
                      tabIndex={-1}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-3.5 px-4 rounded-xl shadow-md hover:shadow-emerald-700/25 transition-all duration-150 flex items-center justify-center gap-2 mt-4 disabled:opacity-50 active:scale-[0.99] cursor-pointer"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-bold">
                        {language === 'ur' ? 'تصدیق ہو رہی ہے...' : 'Authenticating...'}
                      </span>
                    </div>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-white" />
                      <span className="text-sm sm:text-base font-black">
                        {language === 'ur' ? 'لاگ ان کریں (سائن ان)' : 'Sign In to Terminal'}
                      </span>
                      <ArrowRight className="w-4 h-4 text-emerald-100 rtl:rotate-180" />
                    </>
                  )}
                </button>
              </form>

              {/* Professional Security Seal */}
              <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-center gap-2 text-slate-600 text-[11px] font-semibold text-center">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {language === 'ur'
                    ? 'محفوظ 256-بٹ SSL انکرپٹڈ سیشن • صرف مجاز عملے کے لیے'
                    : '256-Bit SSL Encrypted • Authorized Personnel Only'}
                </span>
              </div>

              {/* Developer & Support Link under the Login Card */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-center text-xs text-slate-600 font-medium">
                <span>Designed & Developed by </span>
                <strong className="text-slate-900 font-bold">Burraq Digits</strong>
                <span className="mx-2 text-slate-300">|</span>
                <a
                  href="https://wa.me/923202019118"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition"
                  title="Contact Support on WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 inline" />
                  <span>Contact IT Support</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="relative z-10 text-center text-xs text-slate-600 py-3 font-semibold border-t border-slate-200/80 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© {new Date().getFullYear()} Eagle Star Brand (ایگل اسٹار برانڈ). All Rights Reserved.</p>
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600">
          <span>Designed & Developed by </span>
          <strong className="text-slate-800 font-bold">Burraq Digits</strong>
          <span className="text-slate-300">•</span>
          <a
            href="https://wa.me/923202019118"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition"
            title="Chat with IT Support"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Contact IT Support</span>
          </a>
        </div>
      </footer>
    </div>
  );
};
