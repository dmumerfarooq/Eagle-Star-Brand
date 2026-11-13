/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../../context/AppContext';

export interface EagleStarLogoProps {
  variant?: 'icon' | 'horizontal' | 'vertical' | 'hero' | 'print' | 'badge' | 'full';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  lang?: 'en' | 'ur' | 'both';
  isDarkBackground?: boolean;
  customNameEn?: string;
  customNameUr?: string;
  customSubtitle?: string;
  customLogoUrl?: string;
}

export const EagleStarLogo: React.FC<EagleStarLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  showSubtitle = true,
  className = '',
  isDarkBackground = false,
  customNameEn,
  customNameUr,
  customSubtitle,
  customLogoUrl
}) => {
  const { settings } = useApp();

  const defaultLogoSrc = '/assets/aistudio/Eagle_Star_Monochrome_Emblem_53d4a1d8.png';
  const logoSrc =
    customLogoUrl !== undefined
      ? customLogoUrl || defaultLogoSrc
      : settings?.customLogoUrl || defaultLogoSrc;

  const brandNameEn = customNameEn || settings?.businessNameEn || 'Eagle Star Brand';
  const brandNameUr = customNameUr || settings?.businessNameUr || 'ایگل ایس بی';
  const subtitleText =
    customSubtitle ||
    settings?.branchEn ||
    'Dubai ⇌ Pakistan Financial Services';

  // Size configurations - generously sized to compensate for image padding and ensure clear visibility
  const sizeMap = {
    sm: { imgH: 'h-11 sm:h-12', box: 'w-11 h-11', textMain: 'text-sm sm:text-base', textUr: 'text-sm sm:text-base', sub: 'text-[10px]' },
    md: { imgH: 'h-12 sm:h-14', box: 'w-12 h-12 sm:w-14 sm:h-14', textMain: 'text-base sm:text-lg', textUr: 'text-base sm:text-lg', sub: 'text-[10px]' },
    lg: { imgH: 'h-20 sm:h-24', box: 'w-20 h-20 sm:w-24 sm:h-24', textMain: 'text-xl sm:text-2xl', textUr: 'text-xl sm:text-2xl', sub: 'text-xs' },
    xl: { imgH: 'h-28 sm:h-32', box: 'w-28 h-28 sm:w-32 sm:h-32', textMain: 'text-2xl sm:text-3xl', textUr: 'text-2xl sm:text-3xl', sub: 'text-sm' }
  };

  const currentSize = sizeMap[size];
  const invertClass = isDarkBackground && logoSrc === defaultLogoSrc ? 'brightness-0 invert' : '';

  // 1. Icon Only
  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        <img
          src={logoSrc}
          alt={brandNameEn}
          className={`${currentSize.box} object-contain scale-110 ${invertClass} transition-transform`}
          crossOrigin="anonymous"
          loading="eager"
        />
      </div>
    );
  }

  // 2. Full official graphic badge (Eagle + STAR text lockup)
  if (variant === 'full') {
    return (
      <div className={`inline-flex flex-col items-center justify-center ${className}`}>
        <img
          src={logoSrc}
          alt={brandNameEn}
          className={`${currentSize.imgH} w-auto object-contain scale-105 ${invertClass}`}
          crossOrigin="anonymous"
          loading="eager"
        />
      </div>
    );
  }

  // 3. Print Version for Receipts & Musaffah Slips
  if (variant === 'print') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <img
          src={logoSrc}
          alt={brandNameEn}
          className="h-8 sm:h-9 max-h-9 w-auto object-contain shrink-0"
          style={{ maxHeight: '36px', maxWidth: '120px' }}
          crossOrigin="anonymous"
          loading="eager"
        />
        <div className="flex flex-col text-slate-900 text-start">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-brand-en text-base sm:text-lg font-black tracking-wide text-slate-900 uppercase">
              {brandNameEn}
            </span>
            <span className="font-brand-urdu text-base sm:text-lg text-slate-900 font-bold" dir="rtl">
              {brandNameUr}
            </span>
          </div>
          {showSubtitle && (
            <span className="text-[9px] tracking-wider text-slate-700 font-bold uppercase">
              {customSubtitle || settings?.branchEn || 'Financial Record Management · Dubai ⇌ Pakistan'}
            </span>
          )}
        </div>
      </div>
    );
  }

  // 4. Hero / Vertical layout (e.g. Login, Welcome card)
  if (variant === 'vertical' || variant === 'hero') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <img
          src={logoSrc}
          alt={brandNameEn}
          className={`${currentSize.imgH} w-auto object-contain mb-3 ${invertClass}`}
          crossOrigin="anonymous"
          loading="eager"
        />
        <div className="flex flex-col items-center space-y-0.5">
          <h1 className={`font-brand-en text-xl sm:text-2xl md:text-3xl font-black tracking-wide uppercase ${
            isDarkBackground ? 'text-white' : 'text-slate-950'
          }`}>
            {brandNameEn}
          </h1>
          <span
            className={`font-brand-urdu text-lg sm:text-xl font-bold ${
              isDarkBackground ? 'text-white' : 'text-slate-950'
            }`}
            dir="rtl"
          >
            {brandNameUr}
          </span>
        </div>
        {showSubtitle && (
          <div className="mt-2 flex items-center gap-2">
            <span className="h-px w-6 sm:w-10 bg-slate-400 opacity-60"></span>
            <span className="font-brand-sub text-[10px] sm:text-xs text-slate-700 tracking-wider uppercase font-bold">
              {subtitleText}
            </span>
            <span className="h-px w-6 sm:w-10 bg-slate-400 opacity-60"></span>
          </div>
        )}
      </div>
    );
  }

  // 5. Default Horizontal Lockup (for Top Header & Navbars)
  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 ${className}`}>
      <img
        src={logoSrc}
        alt={brandNameEn}
        className={`${currentSize.imgH} w-auto object-contain shrink-0 ${invertClass}`}
        crossOrigin="anonymous"
        loading="eager"
      />
      <div className="flex flex-col min-w-0 text-start">
        <div className="flex items-center gap-2 truncate">
          <span
            className={`font-brand-en ${currentSize.textMain} font-extrabold tracking-wide uppercase truncate ${
              isDarkBackground ? 'text-white' : 'text-slate-950'
            }`}
          >
            {brandNameEn}
          </span>
          <span
            className={`font-brand-urdu ${currentSize.textUr} font-bold ${
              isDarkBackground ? 'text-white' : 'text-slate-950'
            } hidden sm:inline shrink-0`}
            dir="rtl"
          >
            {brandNameUr}
          </span>
        </div>
        {showSubtitle && (
          <span
            className={`font-brand-sub ${currentSize.sub} tracking-wide font-bold truncate ${
              isDarkBackground ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            {subtitleText}
          </span>
        )}
      </div>
    </div>
  );
};
