/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { EagleStarLogo } from '../common/EagleStarLogo';
import { Printer, Download, X, FileText, Pencil, Trash2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { MoneyTransfer } from '../../types';

/**
 * Generates a self-contained HTML document with pure Hex/RGB CSS (zero oklch functions)
 * so that both html2canvas (PDF download) and browser printing render the complete receipt
 * without any Tailwind v4 oklch parsing crash or flex/scroll height clipping.
 */
const buildCleanReceiptHtml = (
  innerHtml: string,
  isRtl: boolean,
  paperSize: 'A4' | 'A5',
  orientation: 'landscape' | 'portrait',
  lang: string,
  brandTitle = 'Eagle Star Brand'
) => `
<!DOCTYPE html>
<html lang="${lang}" dir="${isRtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <title>Receipt - ${brandTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@700;800&family=Montserrat:wght@600;700;800;900&family=Noto+Naskh+Arabic:wght@600;700;800;900&family=Noto+Sans+Arabic:wght@600;700;800;900&family=JetBrains+Mono:wght@700;800&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      background-color: #ffffff !important;
      color: #000000 !important;
      font-family: 'Noto Sans Arabic', 'Noto Naskh Arabic', 'Amiri', 'Segoe UI', Tahoma, Arial, sans-serif !important;
      width: 100% !important;
      height: auto !important;
      line-height: 1.65;
      font-weight: 700;
      overflow: visible !important;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility !important;
    }
    .receipt-export-wrapper {
      background-color: #ffffff;
      color: #000000;
      padding: ${paperSize === 'A5' ? '12px 16px 28px 16px' : '18px 24px 34px 24px'};
      width: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: visible !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      font-family: 'Noto Sans Arabic', 'Noto Naskh Arabic', 'Amiri', 'Segoe UI', Tahoma, Arial, sans-serif !important;
    }

    /* Prevent page breaks inside any element */
    .receipt-export-wrapper > *,
    table, tr, td, th, div, header, footer {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    /* Typography */
    .font-musaffah-title {
      font-family: 'Noto Sans Arabic', 'Noto Naskh Arabic', 'Amiri', Arial, sans-serif !important;
      font-weight: 900 !important;
      line-height: 1.65 !important;
      color: #000000 !important;
      letter-spacing: normal !important;
    }
    .font-brand-en {
      font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif;
      letter-spacing: 0.08em;
      font-weight: 900 !important;
      text-transform: uppercase;
      color: #000000 !important;
    }
    .font-brand-urdu {
      font-family: 'Noto Sans Arabic', 'Noto Naskh Arabic', 'Amiri', serif;
      font-weight: 900 !important;
      line-height: 1.65 !important;
      color: #000000 !important;
    }
    .font-mono {
      font-family: 'JetBrains Mono', 'Courier New', ui-monospace, SFMono-Regular, Consolas, monospace !important;
      font-weight: 800 !important;
      letter-spacing: 0.02em;
    }
    .font-bold { font-weight: 800 !important; }
    .font-semibold { font-weight: 700 !important; }
    .font-black { font-weight: 900 !important; }
    .italic { font-style: italic; }
    .uppercase { text-transform: uppercase; }
    .capitalize { text-transform: capitalize; }
    .whitespace-nowrap { white-space: nowrap !important; }
    .text-center { text-align: center !important; }
    .text-right { text-align: right !important; }
    .text-left { text-align: left !important; }
    .text-start { text-align: ${isRtl ? 'right' : 'left'} !important; }

    /* High-contrast, highly legible font sizes that fit comfortably inside the receipt borders */
    .text-\\[9px\\], .text-\\[10px\\], .text-\\[11px\\] {
      font-size: 11px !important;
      font-weight: 700 !important;
      line-height: 1.55 !important;
      color: #000000 !important;
    }
    .text-xs {
      font-size: 13px !important;
      font-weight: 700 !important;
      line-height: 1.6 !important;
      color: #000000 !important;
    }
    .text-sm {
      font-size: 15px !important;
      font-weight: 700 !important;
      line-height: 1.6 !important;
      color: #000000 !important;
    }
    .text-base, .sm\\:text-base {
      font-size: 17px !important;
      font-weight: 800 !important;
      line-height: 1.65 !important;
      color: #000000 !important;
    }
    .text-lg, .sm\\:text-lg {
      font-size: 19px !important;
      font-weight: 800 !important;
      line-height: 1.65 !important;
      color: #000000 !important;
    }
    .text-xl, .sm\\:text-xl {
      font-size: 21px !important;
      font-weight: 900 !important;
      line-height: 1.65 !important;
      color: #000000 !important;
    }
    .text-2xl, .sm\\:text-2xl {
      font-size: 24px !important;
      font-weight: 900 !important;
      line-height: 1.6 !important;
      color: #000000 !important;
    }
    .text-3xl, .sm\\:text-3xl {
      font-size: 27px !important;
      font-weight: 900 !important;
      line-height: 1.55 !important;
      color: #000000 !important;
    }
    .text-4xl, .sm\\:text-4xl, .sm\\:text-5xl {
      font-size: 31px !important;
      font-weight: 900 !important;
      line-height: 1.5 !important;
      color: #000000 !important;
    }

    /* Layout & Flex/Grid */
    .block { display: block; }
    .inline-block { display: inline-block; }
    .flex { display: flex; }
    .inline-flex { display: inline-flex; }
    .flex-row { flex-direction: row; }
    .flex-col { flex-direction: column; }
    .flex-wrap { flex-wrap: wrap; }
    .sm\\:flex-row { flex-direction: row; }
    .items-center { align-items: center; }
    .items-start { align-items: flex-start; }
    .items-end { align-items: flex-end; }
    .items-stretch { align-items: stretch; }
    .items-baseline { align-items: baseline; }
    .justify-start { justify-content: flex-start; }
    .justify-end { justify-content: flex-end; }
    .justify-between { justify-content: space-between; }
    .justify-center { justify-content: center; }
    .gap-1\\.5 { gap: 6px; }
    .gap-2 { gap: 8px; }
    .gap-2\\.5 { gap: 10px; }
    .gap-3 { gap: 12px; }
    .gap-4 { gap: 16px; }
    .gap-5 { gap: 20px; }
    .gap-6 { gap: 24px; }
    .sm\\:gap-8 { gap: 32px; }
    .sm\\:gap-10 { gap: 36px; }
    .grid { display: grid; }
    .grid-cols-2, .sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .grid-cols-3, .sm\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .grid-cols-4, .sm\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }

    /* Spacing */
    .space-y-6 > * + * { margin-top: 18px; }
    .space-y-4 > * + * { margin-top: 14px; }
    .space-y-3 > * + * { margin-top: 10px; }
    .space-y-2\\.5 > * + * { margin-top: 10px; }
    .space-y-2 > * + * { margin-top: 8px; }
    .space-y-1\\.5 > * + * { margin-top: 6px; }
    .space-y-1 > * + * { margin-top: 4px; }
    .space-y-0\\.5 > * + * { margin-top: 2px; }
    .p-1\\.5 { padding: 6px; }
    .p-2 { padding: 8px; }
    .p-2\\.5 { padding: 10px; }
    .p-3 { padding: 12px; }
    .p-3\\.5 { padding: 14px; }
    .p-4, .sm\\:p-4 { padding: 16px; }
    .p-5, .sm\\:p-5 { padding: 18px 22px; }
    .px-1 { padding-left: 4px; padding-right: 4px; }
    .px-2 { padding-left: 8px; padding-right: 8px; }
    .px-3 { padding-left: 12px; padding-right: 12px; }
    .px-4, .sm\\:px-4 { padding-left: 16px; padding-right: 16px; }
    .px-6, .sm\\:px-6 { padding-left: 24px; padding-right: 24px; }
    .px-8, .sm\\:px-8 { padding-left: 32px; padding-right: 32px; }
    .py-1 { padding-top: 4px; padding-bottom: 4px; }
    .py-1\\.5 { padding-top: 6px; padding-bottom: 6px; }
    .py-2 { padding-top: 8px; padding-bottom: 8px; }
    .py-2\\.5 { padding-top: 10px; padding-bottom: 10px; }
    .py-3 { padding-top: 12px; padding-bottom: 12px; }
    .pb-1 { padding-bottom: 4px; }
    .pb-1\\.5 { padding-bottom: 6px; }
    .pb-2 { padding-bottom: 8px; }
    .pb-3 { padding-bottom: 12px; }
    .pb-4 { padding-bottom: 16px; }
    .pt-0\\.5 { padding-top: 2px; }
    .pt-1 { padding-top: 4px; }
    .pt-2 { padding-top: 8px; }
    .pt-2\\.5 { padding-top: 10px; }
    .pt-3 { padding-top: 12px; }
    .pt-4 { padding-top: 16px; }
    .pt-5 { padding-top: 18px; }
    .pt-6 { padding-top: 20px; }
    .pt-8 { padding-top: 28px; }
    .mb-1 { margin-bottom: 4px; }
    .mb-2 { margin-bottom: 8px; }
    .mb-3 { margin-bottom: 12px; }
    .mb-6 { margin-bottom: 18px; }
    .mb-8 { margin-bottom: 22px; }
    .mt-0\\.5 { margin-top: 2px; }
    .mt-1 { margin-top: 4px; }
    .mt-2 { margin-top: 8px; }
    .mt-4 { margin-top: 16px; }
    .mt-8 { margin-top: 24px; }
    .my-3 { margin-top: 12px; margin-bottom: 12px; }
    .ml-2 { margin-left: 8px; }
    .sm\\:pl-4 { padding-left: 16px; }

    /* Dimensions & Positioning */
    .w-full { width: 100%; }
    .w-auto { width: auto; }
    .w-28 { width: 112px; }
    .w-32 { width: 128px; }
    .w-36 { width: 144px; }
    .min-w-\\[130px\\] { min-width: 130px; }
    .w-\\[60\\%\\] { width: 60% !important; }
    .w-\\[40\\%\\] { width: 40% !important; }
    .shrink-0 { flex-shrink: 0 !important; }
    .overflow-hidden { overflow: visible !important; }
    .h-12, .sm\\:h-14 { height: 42px !important; }
    img { max-height: 42px !important; max-width: 140px !important; object-fit: contain !important; }
    .object-contain { object-fit: contain; }
    .relative { position: relative; }
    .absolute { position: absolute; }
    .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }

    /* Crisp Dark Borders */
    .rounded, .rounded-xs { border-radius: 6px; }
    .rounded-lg { border-radius: 8px; }
    .border { border: 1.5px solid #0f172a !important; }
    .border-2 { border: 2px solid #000000 !important; }
    .border-b { border-bottom: 1.5px solid #0f172a !important; }
    .border-b-2 { border-bottom: 2.5px solid #000000 !important; }
    .border-t { border-top: 1.5px solid #0f172a !important; }
    .border-t-2 { border-top: 2px solid #000000 !important; }
    .border-t-4 { border-top: 4px double #000000 !important; }
    .border-r-2 { border-right: 2px solid #000000 !important; }
    .border-l-2 { border-left: 2px solid #000000 !important; }
    .border-double { border-style: double !important; }
    .sm\\:border-l { border-left: 1.5px solid #0f172a !important; }
    .border-slate-200, .border-slate-300, .border-slate-400, .border-slate-500, .border-slate-600, .border-slate-700, .border-slate-800, .border-slate-900, .border-black\\/30 {
      border-color: #0f172a !important;
    }

    /* Pure Black & White Printing Style (Zero Background Fills, Crisp Black Text) */
    .bg-white, .bg-slate-50, .bg-slate-50\\/50, .bg-slate-100, .bg-slate-200, .bg-slate-800, .bg-slate-900, .bg-emerald-50, .bg-emerald-50\\/80, .bg-emerald-100, .bg-emerald-700, .bg-emerald-800, .bg-blue-50, .bg-blue-50\\/50, .bg-blue-100, .bg-blue-600, .bg-blue-700, .bg-blue-800, .bg-amber-50, .bg-amber-100, .bg-rose-50, .bg-rose-100 {
      background-color: #ffffff !important;
      background: #ffffff !important;
    }

    .text-slate-950, .text-slate-900, .text-slate-800, .text-slate-700, .text-slate-600, .text-slate-500, .text-slate-400, .text-emerald-950, .text-emerald-900, .text-emerald-800, .text-emerald-700, .text-blue-950, .text-blue-900, .text-blue-800, .text-blue-700, .text-red-700, .text-red-600, .text-rose-700, .text-rose-800, .text-amber-900, .text-amber-800 {
      color: #000000 !important;
      font-weight: 800 !important;
    }

    .ref-black-badge {
      background-color: #000000 !important;
      background: #000000 !important;
      color: #ffffff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      padding: 6px 26px 11px 26px !important;
      border-radius: 5px !important;
      font-weight: 900 !important;
      line-height: 1.45 !important;
      display: inline-block !important;
    }
    .divide-black > * + * {
      border-color: #000000 !important;
    }
    .border-black {
      border-color: #000000 !important;
    }

    /* Tables - Ultra Crisp, Clean & Professional (Matching Official Reference PDF) */
    table {
      width: 100%;
      border-collapse: collapse !important;
      page-break-inside: avoid !important;
    }
    th {
      background-color: transparent !important;
      color: #000000 !important;
      font-size: 14px !important;
      font-weight: 800 !important;
      padding: 8px 10px 11px 10px !important;
      border-top: 1.5px solid #000000 !important;
      border-bottom: 2.5px solid #000000 !important;
      text-align: center !important;
      line-height: 1.6 !important;
    }
    td {
      padding: 8px 10px 11px 10px !important;
      font-size: 14px !important;
      font-weight: 700 !important;
      border-bottom: 1px solid #cbd5e1 !important;
      color: #000000 !important;
      vertical-align: middle;
      line-height: 1.6 !important;
    }

    /* Strict @page rule to guarantee clean receipt slip printing */
    @page {
      size: auto;
      margin: 4mm;
    }
    @media print {
      html, body {
        width: 100% !important;
        height: auto !important;
        color: #000000 !important;
        overflow: visible !important;
      }
      .receipt-export-wrapper {
        width: 100% !important;
        max-width: 720px !important;
        margin: 0 auto !important;
        overflow: visible !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>
  <div class="receipt-export-wrapper">
    ${innerHtml}
  </div>
</body>
</html>
`;

const formatSlipDateTime = (dateStr: string, timeStr?: string, createdAt?: string) => {
  try {
    let baseDate = dateStr;
    if (!baseDate && createdAt) {
      baseDate = createdAt.split('T')[0];
    }
    const parts = (baseDate || '').split('-');
    let formattedDate = baseDate;
    if (parts.length === 3) {
      const year = parts[0].slice(-2);
      const month = parts[1];
      const day = parts[2];
      formattedDate = `${day}-${month}-${year}`;
    }
    let t = timeStr;
    if (!t && createdAt && createdAt.includes('T')) {
      const cd = new Date(createdAt);
      if (!isNaN(cd.getTime())) {
        t = cd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      }
    }
    return `${formattedDate} ${t || '8:24PM'}`;
  } catch {
    return dateStr;
  }
};

export const ReceiptViewerModal: React.FC = () => {
  const {
    receiptModal,
    closeReceipt,
    openEditTransferModal,
    deleteTransfer,
    language,
    t,
    settings,
    formatMoney,
    showToast,
    customers,
    amanatAccounts,
    stations,
    isSuperAdmin,
    canEditTransfers
  } = useApp();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [activeFormat, setActiveFormat] = useState(
    receiptModal.format || (receiptModal.transfer && (!receiptModal.batchTransfers || receiptModal.batchTransfers.length <= 1) ? 'A' : 'B')
  );
  const [paperSize, setPaperSize] = useState<'A4' | 'A5'>('A4');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');

  const transfer = receiptModal.transfer;
  const payout = receiptModal.payout;
  const loan = receiptModal.loan;
  const amanatAccount = receiptModal.amanatAccount;
  const amanatEntry = receiptModal.amanatEntry;
  const depositEntry = receiptModal.depositEntry;
  const batchTransfers = receiptModal.batchTransfers || (transfer ? [transfer] : []);
  const batchLoans = receiptModal.batchLoans || (loan ? [loan] : []);
  const batchAmanat = receiptModal.batchAmanat || (amanatAccount ? [amanatAccount] : []);
  const reportTitle = receiptModal.reportTitle;
  const reportDateRange = receiptModal.reportDateRange;

  const businessName = language === 'ur' ? settings.businessNameUr : settings.businessNameEn;
  const branchName = language === 'ur' ? settings.branchUr : settings.branchEn;

  // Resolve customer account details and khata balances for Money Transfer & Cash Jama (Universal Format A)
  const senderCustomer = transfer
    ? customers.find(
        c =>
          c.id === transfer.senderId ||
          (c.phone && transfer.senderPhone && c.phone === transfer.senderPhone) ||
          c.name.trim().toLowerCase() === transfer.senderName.trim().toLowerCase()
      )
    : amanatAccount
    ? customers.find(
        c =>
          c.name.trim().toLowerCase() === amanatAccount.ownerName.trim().toLowerCase() ||
          (c.phone && amanatAccount.ownerPhone && c.phone === amanatAccount.ownerPhone)
      )
    : undefined;

  const matchedAmanat = transfer
    ? amanatAccounts.find(
        a =>
          a.ownerName.trim().toLowerCase() === transfer.senderName.trim().toLowerCase() ||
          (a.ownerPhone && transfer.senderPhone && a.ownerPhone === transfer.senderPhone) ||
          (senderCustomer &&
            (a.ownerName.trim().toLowerCase() === senderCustomer.name.trim().toLowerCase() ||
              a.id === senderCustomer.id))
      )
    : amanatAccount;

  const customerCodeNumber = senderCustomer?.customerCode
    ? senderCustomer.customerCode.replace(/^CUST-?/i, '')
    : amanatAccount?.accountNo
    ? amanatAccount.accountNo.replace(/^AMN-?/i, '')
    : depositEntry?.receiptNo
    ? depositEntry.receiptNo.replace(/^DEP-?/i, '')
    : transfer?.senderId
    ? transfer.senderId.replace(/^CUST-?/i, '')
    : transfer?.orderNumber
    ? transfer.orderNumber.split('-')[0]
    : '951';

  const senderFullName =
    senderCustomer?.nameUr ||
    senderCustomer?.name ||
    transfer?.senderName ||
    amanatAccount?.ownerName ||
    depositEntry?.relatedParty ||
    loan?.borrowerName ||
    'خان بابا';

  const senderNameDisplay =
    transfer?.senderName ||
    amanatAccount?.ownerName ||
    depositEntry?.relatedParty ||
    loan?.borrowerName ||
    'خان بابا';

  // Details text with bidirectional isolation so parentheses like (Cash) never invert in RTL and tags like [نقد کیش] never split across lines
  const detailDisplay = transfer ? (
    <span className="inline-flex flex-wrap items-baseline gap-1.5">
      <span dir="auto" style={{ unicodeBidi: 'isolate' }}>{transfer.receiverName}</span>
      <span dir="rtl" className="inline-block whitespace-nowrap" style={{ unicodeBidi: 'isolate' }}>
        {transfer.accountNumber
          ? `اکاؤنٹ ${transfer.accountNumber}`
          : transfer.payoutMethod === 'Bank Transfer'
          ? `(${transfer.bankName || 'بینک'} اکاؤنٹ)`
          : transfer.payoutMethod
          ? `(${
              transfer.payoutMethod === 'JazzCash'
                ? 'جیز کیش اکاؤنٹ'
                : transfer.payoutMethod === 'EasyPaisa'
                ? 'ایزی پیسہ اکاؤنٹ'
                : transfer.payoutMethod
            })`
          : 'اکاؤنٹ'}
      </span>
    </span>
  ) : amanatAccount ? (
    <span className="inline-flex flex-wrap items-baseline gap-1.5">
      <span dir="auto" style={{ unicodeBidi: 'isolate' }}>
        {amanatEntry?.description ||
          (amanatEntry?.type === 'additional_deposit'
            ? 'پیسہ جمع شدگی امانت (نقد کیش)'
            : amanatEntry?.type === 'initial_deposit'
            ? 'پیسہ جمع شدگی ابتدائی اکاؤنٹ (نقد کیش)'
            : 'پیسہ جمع سے رقم واپسی / ادائیگی')}
      </span>
      {amanatEntry?.relatedPerson ? (
        <span dir="auto" style={{ unicodeBidi: 'isolate' }}>
          : {amanatEntry.relatedPerson}
        </span>
      ) : null}
      {amanatEntry?.paymentMethod ? (
        <span dir="rtl" className="inline-block whitespace-nowrap" style={{ unicodeBidi: 'isolate' }}>
          [{amanatEntry.paymentMethod === 'Cash' ? 'نقد کیش' : amanatEntry.bankName || amanatEntry.paymentMethod}]
        </span>
      ) : null}
    </span>
  ) : depositEntry ? (
    <span className="inline-flex flex-wrap items-baseline gap-1.5">
      <span dir="auto" style={{ unicodeBidi: 'isolate' }}>
        {depositEntry.description || 'اسٹیشن کاؤنٹر کیش ڈپازٹ'}
      </span>
      {(depositEntry.bankName || depositEntry.paymentMethod) && (
        <span dir="auto" className="inline-block whitespace-nowrap" style={{ unicodeBidi: 'isolate' }}>
          [{depositEntry.paymentMethod === 'Cash'
            ? 'نقد کیش'
            : `${depositEntry.paymentMethod || 'Bank Transfer'}${
                depositEntry.bankName && depositEntry.bankName !== depositEntry.paymentMethod
                  ? `: ${depositEntry.bankName}`
                  : ''
              }${depositEntry.accountNumber ? ` - ${depositEntry.accountNumber}` : ''}`}]
        </span>
      )}
      <span dir="rtl" className="inline-block whitespace-nowrap" style={{ unicodeBidi: 'isolate' }}>
        ({depositEntry.stationName} کاؤنٹر)
      </span>
    </span>
  ) : loan ? (
    <span className="inline-flex flex-wrap items-baseline gap-1.5">
      <span dir="auto" style={{ unicodeBidi: 'isolate' }}>
        {loan.purpose || 'کھاتہ ادھار ریکارڈ'}
      </span>
      <span dir="rtl" className="inline-block whitespace-nowrap" style={{ unicodeBidi: 'isolate' }}>
        (میعاد: {loan.dueDate})
      </span>
    </span>
  ) : (
    '—'
  );

  const defaultRate = settings.defaultExchangeRate || 77.5;
  const rawRate = transfer ? transfer.exchangeRate : defaultRate;
  const normalizedRate = rawRate > 1000 ? rawRate / 100 : rawRate;
  const rateDisplay = Number(normalizedRate).toFixed(2);

  let slipAmountAED = 0;
  let slipAmountPKR = 0;

  if (transfer) {
    slipAmountAED = transfer.amountAED;
    slipAmountPKR = transfer.amountPKR;
  } else if (amanatEntry) {
    if (amanatEntry.currency === 'AED') {
      slipAmountAED = amanatEntry.amount;
      slipAmountPKR = Math.round(amanatEntry.amount * normalizedRate);
    } else {
      slipAmountPKR = amanatEntry.amount;
      slipAmountAED = Math.round(amanatEntry.amount / normalizedRate);
    }
  } else if (amanatAccount) {
    if (amanatAccount.currency === 'AED') {
      slipAmountAED = amanatAccount.currentBalance;
      slipAmountPKR = Math.round(amanatAccount.currentBalance * normalizedRate);
    } else {
      slipAmountPKR = amanatAccount.currentBalance;
      slipAmountAED = Math.round(amanatAccount.currentBalance / normalizedRate);
    }
  } else if (depositEntry) {
    slipAmountPKR = depositEntry.amountPKR;
    slipAmountAED = Math.round(depositEntry.amountPKR / normalizedRate);
  } else if (loan) {
    if (loan.currency === 'AED') {
      slipAmountAED = loan.originalAmount;
      slipAmountPKR = Math.round(loan.originalAmount * normalizedRate);
    } else {
      slipAmountPKR = loan.originalAmount;
      slipAmountAED = Math.round(loan.originalAmount / normalizedRate);
    }
  }

  // Resolve Station / Account previous and current running balances (supporting negative / minus overdraft & deposit deduction)
  const matchedStation = transfer
    ? stations.find(
        s =>
          s.nameUr === transfer.station ||
          s.nameEn === transfer.station ||
          s.code === transfer.station
      )
    : depositEntry
    ? stations.find(
        s =>
          s.nameUr === depositEntry.stationName ||
          s.nameEn === depositEntry.stationName ||
          s.code === depositEntry.stationName
      )
    : undefined;

  let curBal = 0;
  let prevBal = 0;
  let depositMinusDeducted = 0;

  if (amanatEntry) {
    curBal = amanatEntry.newBalance;
    prevBal = amanatEntry.previousBalance;
  } else if (amanatAccount) {
    curBal = amanatAccount.currentBalance;
    prevBal = amanatAccount.currentBalance;
  } else if (depositEntry) {
    curBal =
      depositEntry.newBalancePKR !== undefined
        ? depositEntry.newBalancePKR
        : matchedStation?.currentBalancePKR ?? depositEntry.amountPKR;
    prevBal =
      depositEntry.previousBalancePKR !== undefined
        ? depositEntry.previousBalancePKR
        : curBal - depositEntry.amountPKR;
    depositMinusDeducted =
      depositEntry.deductedOverdraftPKR !== undefined
        ? depositEntry.deductedOverdraftPKR
        : prevBal < 0
        ? Math.min(depositEntry.amountPKR, Math.abs(prevBal))
        : 0;
  } else if (transfer) {
    const stLedgerEntry = matchedStation?.entries?.find(
      e => e.referenceNo === transfer.orderNumber
    );
    if (
      transfer.stationPreviousBalancePKR !== undefined &&
      transfer.stationNewBalancePKR !== undefined
    ) {
      prevBal = transfer.stationPreviousBalancePKR;
      curBal = transfer.stationNewBalancePKR;
    } else if (stLedgerEntry) {
      prevBal = stLedgerEntry.previousBalancePKR;
      curBal = stLedgerEntry.newBalancePKR;
    } else if (matchedStation) {
      curBal = matchedStation.currentBalancePKR || 0;
      prevBal = curBal + (transfer.netPayablePKR || transfer.amountPKR || 0);
    } else if (matchedAmanat) {
      curBal = matchedAmanat.currentBalance;
      prevBal = curBal + (transfer.amountAED || 0);
    } else {
      curBal = 0;
      prevBal = transfer.netPayablePKR || transfer.amountPKR || 0;
    }
  } else if (loan) {
    curBal = loan.remainingBalance;
    prevBal = loan.originalAmount;
  }

  const slipStation =
    transfer?.station ||
    amanatAccount?.city ||
    depositEntry?.stationName ||
    'میرعلی';

  const slipAddress =
    transfer?.receiverAddress ||
    amanatAccount?.ownerAddress ||
    settings.addressUr ||
    'پشاور';

  const slipPhone =
    transfer?.receiverPhone ||
    transfer?.senderPhone ||
    amanatAccount?.ownerPhone ||
    settings.phoneEn ||
    '09987878';

  const slipDateTime = transfer
    ? formatSlipDateTime(transfer.date, transfer.time, transfer.createdAt)
    : amanatEntry
    ? formatSlipDateTime(amanatEntry.date)
    : depositEntry
    ? formatSlipDateTime(depositEntry.date)
    : loan
    ? formatSlipDateTime(loan.loanDate)
    : formatSlipDateTime(new Date().toISOString().split('T')[0]);

  const slipOrderNumber =
    transfer?.orderNumber ||
    amanatEntry?.receiptNo ||
    amanatAccount?.accountNo ||
    depositEntry?.receiptNo ||
    loan?.loanNo ||
    '10965-2026';

  const badgeTitle = settings.receiptHeaderTitleUr || 'رسید آرڈر';
  const customerLabelUr = settings.receiptCustomerLabelUr || 'مصفح کسٹمر نمبر';
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Helper that dynamically replaces default brand names in custom/default footer strings if user updated brand name in Settings
  const resolveBrandText = (txt?: string, fallback = '') => {
    const raw = txt || fallback;
    if (!raw) return '';
    return raw
      .replace(/ایگل اسٹار برانڈ/g, settings.businessNameUr || 'ایگل اسٹار برانڈ')
      .replace(/Eagle Star Brand/gi, settings.businessNameEn || 'Eagle Star Brand');
  };

  useEffect(() => {
    if (receiptModal.isOpen) {
      if (receiptModal.format === 'G') {
        setActiveFormat('G');
      } else if (receiptModal.format === 'H') {
        setActiveFormat('H');
      } else if (receiptModal.format === 'B') {
        setActiveFormat('B');
      } else if (receiptModal.format === 'E') {
        setActiveFormat('E');
      } else {
        setActiveFormat('A');
      }

      setPaperSize('A4');
      setOrientation('landscape');
      setConfirmDelete(false);
    }
  }, [
    receiptModal.format,
    receiptModal.isOpen,
    receiptModal.transfer,
    receiptModal.batchTransfers,
    receiptModal.batchLoans,
    receiptModal.batchAmanat,
    receiptModal.depositEntry,
    receiptModal.filterStation
  ]);

  if (!receiptModal.isOpen) return null;

  // Helper to wait for all images in a document to finish loading
  const waitForImages = async (doc: Document) => {
    const imgs = Array.from(doc.querySelectorAll('img'));
    await Promise.all(
      imgs.map(
        img =>
          new Promise<void>(resolve => {
            if (img.complete) {
              resolve();
              return;
            }
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
      )
    );
  };

  const isWideRegisterFormat = activeFormat === 'B' || activeFormat === 'E' || activeFormat === 'G' || activeFormat === 'H';

  // Print handler - direct, instant native browser print
  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.warn('Direct print warning:', err);
    }
  };

  // PDF Download handler - renders strictly 1 SINGLE PAGE with zero multi-page split
  const handleDownloadPdf = async () => {
    if (!receiptRef.current) return;
    let iframe: HTMLIFrameElement | null = null;

    try {
      setIsGeneratingPdf(true);
      showToast(
        language === 'ur' ? 'رسید پی ڈی ایف تیار ہو رہی ہے...' : 'Generating receipt PDF file...',
        'info'
      );

      const isRtl = activeFormat === 'A' || activeFormat === 'B' || activeFormat === 'E' || activeFormat === 'G' || activeFormat === 'H' || language === 'ur';

      // Use wider canvas for multi-column Station Order List / Register sheets
      const targetWidth = isWideRegisterFormat ? 1040 : 720;

      iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '0';
      iframe.style.top = '0';
      iframe.style.width = `${targetWidth}px`;
      iframe.style.height = '1200px';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      iframe.style.zIndex = '-9999';
      iframe.style.backgroundColor = '#ffffff';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        throw new Error('Could not initialize PDF render document');
      }

      doc.open();
      doc.write(
        buildCleanReceiptHtml(
          receiptRef.current.innerHTML,
          isRtl,
          paperSize,
          orientation,
          language,
          settings.businessNameEn || 'Eagle Star Brand'
        )
      );
      doc.close();

      await waitForImages(doc);
      if (document.fonts && document.fonts.ready) {
        try {
          await document.fonts.ready;
        } catch (e) {
          console.warn('Font loading wait warning on main doc:', e);
        }
      }
      if (doc.fonts && doc.fonts.ready) {
        try {
          await doc.fonts.ready;
        } catch (e) {
          console.warn('Font loading wait warning on iframe doc:', e);
        }
      }
      await new Promise(r => setTimeout(r, 450));

      const wrapper = (doc.querySelector('.receipt-export-wrapper') as HTMLElement) || doc.body;
      const rect = wrapper.getBoundingClientRect();
      const fullHeight = Math.ceil(Math.max(wrapper.scrollHeight, wrapper.offsetHeight, wrapper.clientHeight, rect.height, 350)) + 28;

      const canvas = await html2canvas(wrapper, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: targetWidth,
        height: fullHeight,
        windowWidth: targetWidth,
        windowHeight: fullHeight,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          const clonedWrapper = clonedDoc.querySelector('.receipt-export-wrapper') as HTMLElement;
          if (clonedWrapper) {
            clonedWrapper.style.fontFamily = "'Noto Sans Arabic', 'Noto Naskh Arabic', 'Amiri', 'Segoe UI', Tahoma, Arial, sans-serif";
            clonedWrapper.style.color = '#000000';
          }
        }
      });

      if (iframe && document.body.contains(iframe)) {
        document.body.removeChild(iframe);
        iframe = null;
      }

      const imgData = canvas.toDataURL('image/png');

      const marginMm = 4;
      const pdfWidthMm = isWideRegisterFormat ? 280 : 160;
      const contentWidthMm = pdfWidthMm - marginMm * 2;
      const contentHeightMm = (canvas.height / canvas.width) * contentWidthMm;
      const pdfHeightMm = contentHeightMm + marginMm * 2;

      const pdf = new jsPDF({
        orientation: pdfWidthMm >= pdfHeightMm ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [pdfWidthMm, pdfHeightMm]
      });

      pdf.addImage(imgData, 'PNG', marginMm, marginMm, contentWidthMm, contentHeightMm, undefined, 'FAST');

      const refNo =
        reportTitle ||
        (activeFormat === 'G'
          ? 'Cash_Jama_Register'
          : activeFormat === 'H'
          ? 'Khata_Register'
          : activeFormat === 'B'
          ? `Station_Order_List_${receiptModal.filterStation || 'All'}`
          : activeFormat === 'E'
          ? `Station_Statement_${receiptModal.filterStation || 'All'}`
          : transfer?.orderNumber || loan?.loanNo || amanatAccount?.accountNo || 'Receipt');
      const cleanBrand = (settings.businessNameEn || 'Eagle_Star').replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanRef = String(refNo).replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${cleanBrand}_${cleanRef}_${new Date().toISOString().split('T')[0]}.pdf`;

      pdf.save(fileName);

      showToast(
        language === 'ur' ? 'رسید پی ڈی ایف کامیابی سے ڈاؤن لوڈ ہو گئی!' : 'Receipt PDF downloaded successfully!',
        'success'
      );
    } catch (error) {
      console.error('PDF generation error:', error);
      if (iframe && document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
      showToast(
        language === 'ur'
          ? 'پرنٹ ڈائیلاگ کھل رہا ہے، وہاں سے Save as PDF منتخب کریں۔'
          : 'Opening Print dialog — select "Save as PDF" to save.',
        'info'
      );
      handlePrint();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Group batch transfers by station for Format B
  const groupedByStation: Record<string, MoneyTransfer[]> = {};
  batchTransfers.forEach(t => {
    const st = t.station || (language === 'ur' ? 'دیگر' : 'Other');
    if (!groupedByStation[st]) groupedByStation[st] = [];
    groupedByStation[st].push(t);
  });

  // Ensure if a specific station was selected for Order List print (even with 0 transfers), its station block still renders
  if (
    receiptModal.filterStation &&
    receiptModal.filterStation !== 'all' &&
    !groupedByStation[receiptModal.filterStation]
  ) {
    groupedByStation[receiptModal.filterStation] = [];
  }

  return (
    <div className="receipt-modal-backdrop fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm p-2 sm:p-6 overflow-y-auto flex items-start justify-center">
      <div className={`receipt-modal-card bg-white rounded-2xl shadow-2xl ${isWideRegisterFormat ? 'max-w-6xl' : 'max-w-4xl'} w-full my-4 sm:my-8 border border-slate-200 flex flex-col overflow-visible`}>
        {/* Top Controls Bar - Clean, minimal, zero confusion */}
        <div className="no-print sticky top-0 z-20 bg-white text-slate-900 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 rounded-t-2xl shadow-xs">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-base sm:text-lg text-slate-950 font-urdu-heading">
              {language === 'ur' ? 'رسید آرڈر و پرنٹ' : 'Receipt Slip & Print'}
            </h3>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {transfer && (
              <>
                {canEditTransfers && (
                  <button
                    onClick={() => {
                      closeReceipt();
                      openEditTransferModal(transfer);
                    }}
                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer"
                    title={language === 'ur' ? 'آرڈر میں ترمیم کریں' : 'Edit Transfer'}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>{t('edit')}</span>
                  </button>
                )}
                {isSuperAdmin && (
                  <button
                    onClick={() => {
                      if (!confirmDelete) {
                        setConfirmDelete(true);
                        return;
                      }
                      deleteTransfer(transfer.id);
                      setConfirmDelete(false);
                      closeReceipt();
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                      confirmDelete
                        ? 'bg-red-600 hover:bg-red-700 text-white border border-red-700'
                        : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                    }`}
                    title={language === 'ur' ? 'حذف کریں (صرف سپر ایڈمن)' : 'Delete (Super Admin Only)'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>
                      {confirmDelete
                        ? (language === 'ur' ? 'تصدیق حذف؟' : 'Confirm?')
                        : t('delete')}
                    </span>
                  </button>
                )}
              </>
            )}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer"
              title="Print document"
            >
              <Printer className="w-4 h-4" />
              <span>{t('print')}</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm disabled:opacity-50 cursor-pointer"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? (language === 'ur' ? 'تیار ہو رہا ہے...' : 'Saving...') : t('downloadPdf')}</span>
            </button>
            <button
              onClick={closeReceipt}
              className="text-slate-500 hover:text-slate-900 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic @page style tag for clean receipt slip printing */}
        <style>{`
          @page {
            size: auto !important;
            margin: 4mm !important;
          }
        `}</style>

        {/* Printable Receipt Canvas - Clean fitted receipt slip */}
        <div className="p-3 sm:p-6 bg-slate-100 block print-container rounded-b-2xl overflow-x-auto">
          <div
            ref={receiptRef}
            data-receipt-root="true"
            className={`print-receipt-paper bg-white text-slate-900 shadow-md border border-slate-300 p-4 sm:p-6 mx-auto transition-all ${
              isWideRegisterFormat ? 'max-w-[1060px]' : 'max-w-[750px]'
            } w-full`}
          >
            {/* FORMAT G: BATCH AMANAT STATEMENT / REGISTER */}
            {activeFormat === 'G' ? (
              <div className="space-y-6 text-slate-900" dir="rtl">
                {/* Official Brand Letterhead Bar */}
                <div className="border-b-2 border-slate-900 pb-3">
                  <div className="flex flex-col sm:flex-row items-center justify-between pb-3 mb-2 border-b border-slate-200 gap-2">
                    <EagleStarLogo
                      variant="print"
                      size="sm"
                      showSubtitle={true}
                      customNameEn={settings.businessNameEn}
                      customNameUr={settings.businessNameUr}
                      customSubtitle={settings.branchEn}
                      customLogoUrl={settings.customLogoUrl}
                    />
                    <div className="text-right sm:text-left text-[11px] text-slate-700 font-mono space-y-0.5" dir="ltr">
                      <p className="font-bold text-slate-900">{settings.branchEn || branchName}</p>
                      {settings.branchUr && (
                        <p className="font-bold text-slate-900 font-musaffah-title" dir="rtl">
                          {settings.branchUr}
                        </p>
                      )}
                      {settings.addressUr && (
                        <p className="font-bold text-slate-800 font-musaffah-title" dir="rtl">
                          {settings.addressUr}
                        </p>
                      )}
                      <p>
                        Helpline: {settings.phoneEn}
                        {settings.phoneUr && settings.phoneUr !== settings.phoneEn ? ` | ${settings.phoneUr}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-center pt-1">
                    <h1 className="text-2xl sm:text-4xl font-bold font-musaffah-title tracking-normal text-slate-950 pb-1">
                      پیسہ جمع و تحویل رجسٹر شیٹ
                    </h1>
                    <p className="text-xs text-slate-600 font-brand-en" dir="ltr">
                      {(settings.businessNameEn || 'EAGLE STAR BRAND').toUpperCase()} - COMPLETE CASH JAMA SAFEKEEPING AUDIT REGISTER
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-600 mt-2 px-2 border-t border-slate-100 pt-1.5">
                      <span className="font-bold text-slate-800">{reportTitle || 'پیسہ جمع کھاتہ مکمل ریکارڈ'}</span>
                      <span>تاریخ رپورٹ: {reportDateRange || new Date().toISOString().split('T')[0]}</span>
                      <span>کل کھاتے: <strong>{batchAmanat.length}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-900 text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold text-center">
                        <th className="border border-slate-700 py-2 px-2 w-10">نمبر شمار</th>
                        <th className="border border-slate-700 py-2 px-2">کھاتہ نمبر</th>
                        <th className="border border-slate-700 py-2 px-2">کھاتہ دار کا نام</th>
                        <th className="border border-slate-700 py-2 px-2">رابطہ نمبر</th>
                        <th className="border border-slate-700 py-2 px-2">شہر / پتہ</th>
                        <th className="border border-slate-700 py-2 px-2">تاریخ آغاز</th>
                        <th className="border border-slate-700 py-2 px-2">کرنسی</th>
                        <th className="border border-slate-700 py-2 px-2 text-right">کل جمع</th>
                        <th className="border border-slate-700 py-2 px-2 text-right">کل نکلوائی</th>
                        <th className="border border-slate-700 py-2 px-2 text-right bg-slate-800">موجودہ بقایا</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchAmanat.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="text-center py-6 text-slate-500 font-bold">
                            کوئی پیسہ جمع کھاتہ دستیاب نہیں ہے
                          </td>
                        </tr>
                      ) : (
                        batchAmanat.map((acct, idx) => {
                          const totalDeposited = acct.entries
                            .filter(e => e.type === 'initial_deposit' || e.type === 'additional_deposit')
                            .reduce((s, e) => s + e.amount, 0);
                          const totalWithdrawn = acct.entries
                            .filter(e => e.type !== 'initial_deposit' && e.type !== 'additional_deposit')
                            .reduce((s, e) => s + e.amount, 0);

                          return (
                            <tr key={acct.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="border border-slate-300 py-2 px-2 text-center font-mono font-bold text-slate-700">
                                {idx + 1}
                              </td>
                              <td className="border border-slate-300 py-2 px-2 font-mono font-bold text-blue-900">
                                {acct.accountNo}
                              </td>
                              <td className="border border-slate-300 py-2 px-2 font-bold text-slate-900">
                                {acct.ownerName}
                              </td>
                              <td className="border border-slate-300 py-2 px-2 font-mono text-slate-600 text-[11px]" dir="ltr">
                                {acct.ownerPhone}
                              </td>
                              <td className="border border-slate-300 py-2 px-2 text-slate-600">
                                {acct.city || '—'}
                              </td>
                              <td className="border border-slate-300 py-2 px-2 font-mono text-slate-600 text-center">
                                {acct.openedDate}
                              </td>
                              <td className="border border-slate-300 py-2 px-2 font-bold text-center">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${acct.currency === 'AED' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}`}>
                                  {acct.currency}
                                </span>
                              </td>
                              <td className="border border-slate-300 py-2 px-2 font-mono font-semibold text-right text-emerald-700">
                                {totalDeposited.toLocaleString()}
                              </td>
                              <td className="border border-slate-300 py-2 px-2 font-mono font-semibold text-right text-rose-700">
                                {totalWithdrawn.toLocaleString()}
                              </td>
                              <td className="border border-slate-300 py-2 px-2 font-mono font-extrabold text-right text-slate-950 bg-slate-100">
                                {acct.currentBalance.toLocaleString()} {acct.currency}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-200 font-extrabold text-slate-900 border-t-2 border-slate-900">
                        <td colSpan={7} className="border border-slate-400 py-2.5 px-3 text-right">
                          میزان کل پیسہ جمع (PKR کھاتے):
                        </td>
                        <td colSpan={3} className="border border-slate-400 py-2.5 px-3 font-mono font-extrabold text-right text-emerald-900 text-sm">
                          {batchAmanat
                            .filter(a => a.currency === 'PKR')
                            .reduce((s, a) => s + a.currentBalance, 0)
                            .toLocaleString()}{' '}
                          PKR
                        </td>
                      </tr>
                      <tr className="bg-slate-200 font-extrabold text-slate-900">
                        <td colSpan={7} className="border border-slate-400 py-2.5 px-3 text-right">
                          میزان کل پیسہ جمع (AED کھاتے):
                        </td>
                        <td colSpan={3} className="border border-slate-400 py-2.5 px-3 font-mono font-extrabold text-right text-blue-900 text-sm">
                          {batchAmanat
                            .filter(a => a.currency === 'AED')
                            .reduce((s, a) => s + a.currentBalance, 0)
                            .toLocaleString()}{' '}
                          AED
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Mandatory Disclaimer & Signatures */}
                <div className="pt-4 border-t border-slate-300 space-y-4">
                  <div className="bg-emerald-50/80 border border-emerald-600 rounded-lg py-2.5 px-4 text-center space-y-0.5">
                    <p className="font-musaffah-title text-sm sm:text-base font-bold text-emerald-950" dir="rtl">
                      {resolveBrandText(
                        settings.receiptFooterCashJamahUr,
                        'ایگل اسٹار برانڈ - پیسہ جمع و تحویل میں رکھی گئی رقم بوقت ضرورت فوری قابل واپسی ہے۔'
                      )}
                    </p>
                    <p className="text-[10px] text-slate-700 font-bold" dir="ltr">
                      {resolveBrandText(
                        settings.receiptFooterCashJamahEn || settings.receiptFooterEn,
                        'Thank you for trusting Eagle Star Brand Cash Jamah Safekeeping. Funds available on demand.'
                      )}
                    </p>
                  </div>
                  <div className="flex justify-between items-end pt-2 text-xs">
                    <div className="text-center">
                      <div className="border-b border-slate-600 w-36 mb-1"></div>
                      <span>تیار کنندہ (Prepared By)</span>
                    </div>
                    <div className="text-center">
                      <div className="border-b border-slate-600 w-36 mb-1"></div>
                      <span>دستخط کیشئر / منیجر</span>
                    </div>
                    <div className="text-center">
                      <div className="border-b border-slate-600 w-36 mb-1"></div>
                      <span>مہر و تصدیق {settings.businessNameUr || 'ایگل اسٹار برانڈ'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeFormat === 'H' ? (
              /* FORMAT H: BATCH KHATA / UDHAR REGISTER */
              <div className="space-y-6 text-slate-900" dir="rtl">
                {/* Official Brand Letterhead Bar */}
                <div className="border-b-2 border-slate-900 pb-3">
                  <div className="flex flex-col sm:flex-row items-center justify-between pb-3 mb-2 border-b border-slate-200 gap-2">
                    <EagleStarLogo
                      variant="print"
                      size="sm"
                      showSubtitle={true}
                      customNameEn={settings.businessNameEn}
                      customNameUr={settings.businessNameUr}
                      customSubtitle={settings.branchEn}
                      customLogoUrl={settings.customLogoUrl}
                    />
                    <div className="text-right sm:text-left text-[11px] text-slate-700 font-mono space-y-0.5" dir="ltr">
                      <p className="font-bold text-slate-900">{settings.branchEn || branchName}</p>
                      {settings.branchUr && (
                        <p className="font-bold text-slate-900 font-musaffah-title" dir="rtl">
                          {settings.branchUr}
                        </p>
                      )}
                      {settings.addressUr && (
                        <p className="font-bold text-slate-800 font-musaffah-title" dir="rtl">
                          {settings.addressUr}
                        </p>
                      )}
                      <p>
                        Helpline: {settings.phoneEn}
                        {settings.phoneUr && settings.phoneUr !== settings.phoneEn ? ` | ${settings.phoneUr}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-center pt-1">
                    <h1 className="text-2xl sm:text-4xl font-bold font-musaffah-title tracking-normal text-slate-950 pb-1">
                      ادھار و قرضہ کھاتہ رجسٹر شیٹ
                    </h1>
                    <p className="text-xs text-slate-600 font-brand-en" dir="ltr">
                      {(settings.businessNameEn || 'EAGLE STAR BRAND').toUpperCase()} - COMPLETE KHATA LOAN AUDIT REGISTER
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-600 mt-2 px-2 border-t border-slate-100 pt-1.5">
                      <span className="font-bold text-slate-800">{reportTitle || 'ادھار کھاتہ مکمل آڈٹ رپورٹ'}</span>
                      <span>تاریخ رپورٹ: {reportDateRange || new Date().toISOString().split('T')[0]}</span>
                      <span>کل قرض کیسز: <strong>{batchLoans.length}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-900 text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold text-center">
                        <th className="border border-slate-700 py-2 px-2 w-10">نمبر شمار</th>
                        <th className="border border-slate-700 py-2 px-2">قرضہ نمبر</th>
                        <th className="border border-slate-700 py-2 px-2">مقروض کا نام</th>
                        <th className="border border-slate-700 py-2 px-2">رابطہ نمبر</th>
                        <th className="border border-slate-700 py-2 px-2">تاریخ اجرا</th>
                        <th className="border border-slate-700 py-2 px-2">آخری تاریخ</th>
                        <th className="border border-slate-700 py-2 px-2 text-right">اصل رقم</th>
                        <th className="border border-slate-700 py-2 px-2 text-right">وصول شدہ</th>
                        <th className="border border-slate-700 py-2 px-2 text-right bg-slate-800">بقایا واجب الادا</th>
                        <th className="border border-slate-700 py-2 px-2 text-center">حالت</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchLoans.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="text-center py-6 text-slate-500 font-bold">
                            کوئی ادھار / قرضہ ریکارڈ دستیاب نہیں ہے
                          </td>
                        </tr>
                      ) : (
                        batchLoans.map((ln, idx) => (
                          <tr key={ln.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            <td className="border border-slate-300 py-2 px-2 text-center font-mono font-bold text-slate-700">
                              {idx + 1}
                            </td>
                            <td className="border border-slate-300 py-2 px-2 font-mono font-bold text-blue-900">
                              {ln.loanNo}
                            </td>
                            <td className="border border-slate-300 py-2 px-2 font-bold text-slate-900">
                              {ln.borrowerName}
                            </td>
                            <td className="border border-slate-300 py-2 px-2 font-mono text-slate-600 text-[11px]" dir="ltr">
                              {ln.borrowerPhone}
                            </td>
                            <td className="border border-slate-300 py-2 px-2 font-mono text-slate-600 text-center">
                              {ln.loanDate}
                            </td>
                            <td className="border border-slate-300 py-2 px-2 font-mono text-rose-700 text-center font-bold">
                              {ln.dueDate}
                            </td>
                            <td className="border border-slate-300 py-2 px-2 font-mono font-bold text-right text-slate-900">
                              {ln.originalAmount.toLocaleString()} {ln.currency}
                            </td>
                            <td className="border border-slate-300 py-2 px-2 font-mono font-semibold text-right text-emerald-700">
                              {ln.totalRepaid.toLocaleString()} {ln.currency}
                            </td>
                            <td className="border border-slate-300 py-2 px-2 font-mono font-extrabold text-right text-rose-700 bg-rose-50/50">
                              {ln.remainingBalance.toLocaleString()} {ln.currency}
                            </td>
                            <td className="border border-slate-300 py-2 px-2 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  ln.status === 'Fully Repaid'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : ln.status === 'Overdue'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {ln.status === 'Fully Repaid' ? 'ادا شدہ' : ln.status === 'Overdue' ? 'واجب الادا' : 'فعال کھاتہ'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-200 font-extrabold text-slate-900 border-t-2 border-slate-900">
                        <td colSpan={6} className="border border-slate-400 py-2 px-3 text-right">
                          میزان کل (Grand Totals):
                        </td>
                        <td className="border border-slate-400 py-2 px-2 font-mono font-extrabold text-right text-slate-950">
                          {batchLoans.reduce((s, l) => s + l.originalAmount, 0).toLocaleString()}
                        </td>
                        <td className="border border-slate-400 py-2 px-2 font-mono font-extrabold text-right text-emerald-800">
                          {batchLoans.reduce((s, l) => s + l.totalRepaid, 0).toLocaleString()}
                        </td>
                        <td className="border border-slate-400 py-2 px-2 font-mono font-extrabold text-right text-rose-800 bg-rose-100">
                          {batchLoans.reduce((s, l) => s + l.remainingBalance, 0).toLocaleString()}
                        </td>
                        <td className="border border-slate-400 py-2 px-2 text-center font-bold text-[11px]">
                          {batchLoans.filter(l => l.status === 'Outstanding' || l.status === 'Partially Repaid').length} فعال
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Mandatory Disclaimer & Signatures */}
                <div className="pt-4 border-t border-slate-300 space-y-4">
                  <div className="bg-emerald-50/80 border border-emerald-600 rounded-lg py-2.5 px-4 text-center space-y-0.5">
                    <p className="font-musaffah-title text-sm sm:text-base font-bold text-emerald-950" dir="rtl">
                      {resolveBrandText(
                        settings.receiptFooterLoanUr,
                        'ایگل اسٹار برانڈ - ادھار کھاتہ و قرضہ واپسی باقاعدگی سے ادا کریں۔ آپ کے تعاون کا شکریہ!'
                      )}
                    </p>
                    <p className="text-[10px] text-slate-700 font-bold" dir="ltr">
                      {resolveBrandText(
                        settings.receiptFooterLoanEn || settings.receiptFooterEn,
                        'Eagle Star Brand - Please settle credit khata dues on agreed due date. Thank you.'
                      )}
                    </p>
                  </div>
                  <div className="flex justify-between items-end pt-2 text-xs">
                    <div className="text-center">
                      <div className="border-b border-slate-600 w-36 mb-1"></div>
                      <span>تیار کنندہ (Prepared By)</span>
                    </div>
                    <div className="text-center">
                      <div className="border-b border-slate-600 w-36 mb-1"></div>
                      <span>دستخط کیشئر / منیجر</span>
                    </div>
                    <div className="text-center">
                      <div className="border-b border-slate-600 w-36 mb-1"></div>
                      <span>مہر و تصدیق {settings.businessNameUr || 'ایگل اسٹار برانڈ'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeFormat === 'B' ? (
              /* FORMAT B: COMPLETE STATION ORDER LIST PRINT (WITH TRANSFERS, JAMA DEPOSITS, RUNNING BALANCE & DATE IN URDU) */
              <div className="space-y-6 text-slate-900" dir="rtl">
                {/* Official Brand Letterhead Bar */}
                <div className="border-b-2 border-slate-900 pb-3">
                  <div className="flex flex-col sm:flex-row items-center justify-between pb-3 mb-2 border-b border-slate-200 gap-2">
                    <EagleStarLogo
                      variant="print"
                      size="sm"
                      showSubtitle={true}
                      customNameEn={settings.businessNameEn}
                      customNameUr={settings.businessNameUr}
                      customSubtitle={settings.branchEn}
                      customLogoUrl={settings.customLogoUrl}
                    />
                    <div className="text-right sm:text-left text-[11px] text-slate-700 font-mono space-y-0.5" dir="ltr">
                      <p className="font-bold text-slate-950">{settings.branchEn || branchName}</p>
                      {settings.branchUr && (
                        <p className="font-bold text-slate-900 font-musaffah-title" dir="rtl">
                          {settings.branchUr}
                        </p>
                      )}
                      {settings.addressUr && (
                        <p className="font-bold text-slate-800 font-musaffah-title" dir="rtl">
                          {settings.addressUr}
                        </p>
                      )}
                      <p>
                        Helpline: {settings.phoneEn}
                        {settings.phoneUr && settings.phoneUr !== settings.phoneEn ? ` | ${settings.phoneUr}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Main Musaffah Heading */}
                  <div className="text-center pt-1">
                    <h1 className="text-2xl sm:text-4xl font-bold font-musaffah-title tracking-normal text-slate-950 pb-1">
                      اسٹیشن آرڈر لسٹ مصفح — مکمل ٹرانسفر، جمع اور بقایا بیلنس
                      {receiptModal.filterStation && receiptModal.filterStation !== 'all'
                        ? ` (${receiptModal.filterStation})`
                        : ''}
                    </h1>
                    <p className="text-xs font-brand-en font-bold text-slate-700" dir="ltr">
                      {(settings.businessNameEn || 'EAGLE STAR BRAND').toUpperCase()} — COMPLETE STATION ORDER LIST, JAMA & BALANCE SHEET
                    </p>
                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-800 mt-2 px-2 border-t border-slate-200 pt-1.5 font-bold">
                      <span>
                        {settings.businessNameUr || 'ایگل اسٹار برانڈ'} - اسٹیشن رجسٹر شیٹ (پاکستانی روپے PKR و درہم AED)
                      </span>
                      <span className="font-mono">
                        تاریخ: {receiptModal.filterDate || transfer?.date || new Date().toISOString().split('T')[0]}
                      </span>
                      <span>دفتر: {settings.branchUr || branchName}</span>
                    </div>
                  </div>
                </div>

                {/* Grouped Tables by Station */}
                {Object.entries(groupedByStation).map(([stationName, orders]) => {
                  const stObj = stations.find(
                    s => s.nameUr === stationName || s.nameEn === stationName || s.code === stationName
                  );
                  const allStEntries = stObj?.entries || [];
                  const stEntries = receiptModal.filterDate
                    ? allStEntries.filter(e => e.date === receiptModal.filterDate)
                    : allStEntries;

                  const stationTotalPkr = orders.reduce((sum, o) => sum + (Number(o.amountPKR) || 0), 0);
                  const stationTotalAed = orders.reduce((sum, o) => sum + (Number(o.amountAED) || 0), 0);

                  const jamaEntries = stEntries.filter(
                    e => e.type === 'deposit_topup' || e.type === 'settlement_repayment'
                  );
                  const debitEntries = stEntries.filter(
                    e => e.type === 'transfer_payout' || e.type === 'adjustment'
                  );

                  const stationTotalJamaPkr = jamaEntries.reduce((sum, e) => sum + (Number(e.amountPKR) || 0), 0);
                  const stationTotalJamaAed = jamaEntries.reduce(
                    (sum, e) =>
                      sum +
                      (Number(e.amountAED) ||
                        Math.round((Number(e.amountPKR) || 0) / (e.exchangeRate || defaultRate))),
                    0
                  );
                  const stationLedgerDebitPkr = debitEntries.reduce((sum, e) => sum + (Number(e.amountPKR) || 0), 0);

                  const stationCurrentBalPkr = stObj
                    ? stObj.currentBalancePKR || 0
                    : stationTotalJamaPkr - stationTotalPkr;
                  const stationCurrentBalAed = Math.round(stationCurrentBalPkr / defaultRate);
                  const stationOpeningBalPkr =
                    stEntries.length > 0
                      ? stEntries[0].previousBalancePKR
                      : stationCurrentBalPkr + stationTotalPkr - stationTotalJamaPkr;

                  return (
                    <div key={stationName} className="mb-8 space-y-4 border-2 border-slate-900 rounded-lg p-3 sm:p-4">
                      {/* Station Header Banner & Complete Urdu Financial Summary (Transfer, Jama, Balance, Date) */}
                      <div className="border-b-2 border-slate-900 pb-3 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl sm:text-2xl font-bold font-musaffah-title text-slate-950">
                              اسٹیشن: {stationName}
                            </span>
                            {stObj?.nameEn && (
                              <span className="text-xs font-mono font-bold text-slate-700" dir="ltr">
                                ({stObj.nameEn} • {stObj.code})
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-800">
                            {stObj?.inCharge && <span>انچارج: {stObj.inCharge}</span>}
                            {stObj?.phone && <span className="font-mono" dir="ltr">فون: {stObj.phone}</span>}
                            <span className="font-mono">
                              تاریخ: {receiptModal.filterDate || new Date().toISOString().split('T')[0]}
                            </span>
                          </div>
                        </div>

                        {/* 4-Column Urdu Summary Strip: Opening Balance, Total Jama, Total Transfer, Current Net Balance */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-musaffah-title">
                          <div className="border border-slate-800 rounded p-2 text-right">
                            <span className="block font-bold text-slate-700">سابقہ بقایا (Opening Bal):</span>
                            <span className="font-mono font-black text-sm text-slate-950 block" dir="ltr">
                              {stationOpeningBalPkr.toLocaleString()} PKR
                            </span>
                            <span className="text-[11px] font-bold">
                              {stationOpeningBalPkr < 0 ? 'منفی (واجب الادا)' : 'جمع'}
                            </span>
                          </div>

                          <div className="border border-slate-800 rounded p-2 text-right">
                            <span className="block font-bold text-slate-700">کل جمع رقم (Total Jama +):</span>
                            <span className="font-mono font-black text-sm text-slate-950 block" dir="ltr">
                              +{stationTotalJamaPkr.toLocaleString()} PKR
                            </span>
                            <span className="text-[11px] font-mono font-bold" dir="ltr">
                              {stationTotalJamaAed.toLocaleString()} AED ({jamaEntries.length} جمع)
                            </span>
                          </div>

                          <div className="border border-slate-800 rounded p-2 text-right">
                            <span className="block font-bold text-slate-700">کل ٹرانسفر / بنام (Transfers -):</span>
                            <span className="font-mono font-black text-sm text-slate-950 block" dir="ltr">
                              -{stationTotalPkr.toLocaleString()} PKR
                            </span>
                            <span className="text-[11px] font-mono font-bold" dir="ltr">
                              {stationTotalAed.toLocaleString()} AED ({orders.length} آرڈرز)
                            </span>
                          </div>

                          <div className="border-2 border-slate-950 rounded p-2 text-right">
                            <span className="block font-black text-slate-950">موجودہ بقایا بیلنس (Net Balance):</span>
                            <span className="font-mono font-black text-base text-slate-950 block" dir="ltr">
                              {stationCurrentBalPkr.toLocaleString()} PKR
                            </span>
                            <span className="text-[11px] font-bold block">
                              {stationCurrentBalPkr < 0
                                ? `منفی بقایا (واجب الادا) ≈ ${stationCurrentBalAed.toLocaleString()} AED`
                                : `جمع بقایا (کیش دستیاب) ≈ ${stationCurrentBalAed.toLocaleString()} AED`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 1. Station Money Transfer Orders Table */}
                      <div>
                        <h3 className="font-musaffah-title font-bold text-sm sm:text-base text-slate-950 mb-1.5">
                          1. تفصیل ٹرانسفر آرڈرز — اسٹیشن: {stationName} (پاکستانی روپے PKR و درہم AED)
                        </h3>
                        <table className="w-full text-right text-xs border-collapse border border-slate-800">
                          <thead>
                            <tr className="border-t border-b-2 border-slate-900 font-bold font-musaffah-title text-slate-950">
                              <th className="py-2 px-1.5 w-8 text-center font-mono">#</th>
                              <th className="py-2 px-2 w-20 text-center font-mono">تاریخ</th>
                              <th className="py-2 px-2 w-24 text-center font-mono">آرڈر نمبر</th>
                              <th className="py-2 px-2">ارسال کنندہ</th>
                              <th className="py-2 px-2">وصول کنندہ</th>
                              <th className="py-2 px-2 text-center">طریقہ ترسیل و بینک</th>
                              <th className="py-2 px-2 w-20 text-center">سٹیشن</th>
                              <th className="py-2 px-2 text-center w-20 font-bold">درہم (AED)</th>
                              <th className="py-2 px-1.5 text-center w-14 font-bold">ریٹ</th>
                              <th className="py-2 px-2 text-center w-24 font-bold">ٹرانسفر (PKR)</th>
                              <th className="py-2 px-2 text-center w-28 font-bold">بقایا بیلنس (PKR)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.length === 0 ? (
                              <tr>
                                <td colSpan={11} className="py-3 px-3 text-center font-musaffah-title font-bold text-slate-700">
                                  اس تاریخ / فلٹر میں کوئی ٹرانسفر آرڈر نہیں ہے
                                </td>
                              </tr>
                            ) : (
                              orders.map((ord, idx) => {
                                const linkedEntry = allStEntries.find(e => e.referenceNo === ord.orderNumber);
                                const rowNewBal =
                                  ord.stationNewBalancePKR !== undefined
                                    ? ord.stationNewBalancePKR
                                    : linkedEntry?.newBalancePKR !== undefined
                                    ? linkedEntry.newBalancePKR
                                    : stationCurrentBalPkr;

                                return (
                                  <tr
                                    key={ord.id}
                                    className="border-b border-slate-400 font-musaffah-title text-slate-900"
                                  >
                                    <td className="py-2 px-1.5 text-center font-mono font-bold">{idx + 1}</td>
                                    <td className="py-2 px-2 text-center font-mono text-xs font-bold" dir="ltr">
                                      {ord.date}
                                    </td>
                                    <td className="py-2 px-2 text-center font-mono font-bold">
                                      {ord.orderNumber}
                                    </td>
                                    <td className="py-2 px-2">
                                      <div className="font-bold">{ord.senderName}</div>
                                      {ord.senderPhone && (
                                        <span className="font-mono text-[10px] block" dir="ltr">
                                          {ord.senderPhone}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2 px-2">
                                      <div className="font-bold text-slate-950">{ord.receiverName}</div>
                                      {ord.receiverPhone && (
                                        <span className="font-mono text-[10px] block" dir="ltr">
                                          {ord.receiverPhone}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2 px-2 text-center font-semibold text-xs">
                                      <div>
                                        {ord.payoutMethod === 'Bank Transfer'
                                          ? `بذریعہ بینک ${ord.bankName ? `(${ord.bankName})` : ''}`
                                          : ord.payoutMethod === 'EasyPaisa'
                                          ? 'ایزی پیسہ'
                                          : ord.payoutMethod === 'JazzCash'
                                          ? 'جیز کیش'
                                          : ord.payoutMethod === 'NayaPay'
                                          ? 'نیا پیسہ'
                                          : ord.payoutMethod === 'SadaPay'
                                          ? 'سدا پیسہ'
                                          : ord.payoutMethod === 'Raast'
                                          ? 'راست'
                                          : ord.payoutMethod || 'کاؤنٹر کیش'}
                                      </div>
                                      {ord.accountNumber && (
                                        <span className="font-mono text-[10px] block" dir="ltr">
                                          A/C: {ord.accountNumber}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2 px-2 text-center font-bold">
                                      {ord.station}
                                    </td>
                                    <td className="py-2 px-2 text-center font-bold text-slate-950 font-mono text-xs" dir="ltr">
                                      {ord.amountAED.toLocaleString()} AED
                                    </td>
                                    <td className="py-2 px-1.5 text-center font-mono text-xs text-slate-800" dir="ltr">
                                      {Number(ord.exchangeRate > 1000 ? ord.exchangeRate / 100 : ord.exchangeRate).toFixed(2)}
                                    </td>
                                    <td className="py-2 px-2 text-center font-bold text-slate-950 font-mono text-xs" dir="ltr">
                                      -{ord.amountPKR.toLocaleString()} PKR
                                    </td>
                                    <td className="py-2 px-2 text-center font-bold text-slate-950 font-mono text-xs" dir="ltr">
                                      <div>{rowNewBal.toLocaleString()} PKR</div>
                                      <span className="font-musaffah-title text-[10px] block" dir="rtl">
                                        {rowNewBal < 0 ? 'منفی (واجب الادا)' : 'جمع'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 border-slate-900 font-bold font-musaffah-title text-slate-950 text-xs">
                              <td className="py-2 px-2 text-center" colSpan={3}>
                                تعداد آرڈرز: <span className="font-mono font-black">{orders.length}</span>
                              </td>
                              <td className="py-2 px-2 text-center" colSpan={4}>
                                کل جمع (Jama): <span className="font-mono font-black" dir="ltr">+{stationTotalJamaPkr.toLocaleString()} PKR</span>
                              </td>
                              <td className="py-2 px-2 text-center font-mono font-black" dir="ltr">
                                {stationTotalAed.toLocaleString()} AED
                              </td>
                              <td className="py-2 px-1.5 text-center">—</td>
                              <td className="py-2 px-2 text-center font-bold font-mono" dir="ltr">
                                -{stationTotalPkr.toLocaleString()} PKR
                              </td>
                              <td className="py-2 px-2 text-center font-black font-mono" dir="ltr">
                                {stationCurrentBalPkr.toLocaleString()} PKR ({stationCurrentBalPkr < 0 ? 'منفی' : 'جمع'})
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* 2. Station Cash Jama (Deposits) & Running Balance Ledger Table in Urdu */}
                      {stEntries.length > 0 && (
                        <div className="pt-2">
                          <h3 className="font-musaffah-title font-bold text-sm sm:text-base text-slate-950 mb-1.5">
                            2. تفصیل کیش جمع (Jama) اور بنام (Transfer) کھاتہ رننگ بیلنس — اسٹیشن: {stationName}
                          </h3>
                          <table className="w-full text-right text-xs border-collapse border border-slate-800">
                            <thead>
                              <tr className="border-t border-b-2 border-slate-900 font-bold font-musaffah-title text-slate-950">
                                <th className="py-2 px-1.5 w-8 text-center font-mono">#</th>
                                <th className="py-2 px-2 w-20 text-center font-mono">تاریخ</th>
                                <th className="py-2 px-2 w-24 text-center font-mono">حوالہ / واؤچر #</th>
                                <th className="py-2 px-2 w-24 text-center">قسم</th>
                                <th className="py-2 px-2">تفصیل، بینک و متعلقہ پارٹی</th>
                                <th className="py-2 px-2 w-20 text-center">درہم (AED)</th>
                                <th className="py-2 px-2 w-24 text-center">جمع (+ Jama PKR)</th>
                                <th className="py-2 px-2 w-24 text-center">ٹرانسفر (- PKR)</th>
                                <th className="py-2 px-2 w-24 text-center">سابقہ بقایا</th>
                                <th className="py-2 px-2 w-28 text-center">موجودہ بقایا بیلنس</th>
                              </tr>
                            </thead>
                            <tbody>
                              {stEntries.map((en, idx) => {
                                const isCred = en.type === 'deposit_topup' || en.type === 'settlement_repayment';
                                const aedEq = en.amountAED || Math.round(en.amountPKR / (en.exchangeRate || defaultRate));
                                return (
                                  <tr key={en.id} className="border-b border-slate-400 font-musaffah-title">
                                    <td className="py-2 px-1.5 text-center font-mono font-bold">{idx + 1}</td>
                                    <td className="py-2 px-2 text-center font-mono" dir="ltr">{en.date}</td>
                                    <td className="py-2 px-2 text-center font-mono font-bold">{en.referenceNo || en.receiptNo}</td>
                                    <td className="py-2 px-2 text-center font-bold">
                                      {en.type === 'deposit_topup'
                                        ? 'کیش جمع (ڈپازٹ)'
                                        : en.type === 'settlement_repayment'
                                        ? 'سیٹلمنٹ جمع'
                                        : en.type === 'transfer_payout'
                                        ? 'ٹرانسفر ادائیگی'
                                        : 'ایڈجسٹمنٹ'}
                                    </td>
                                    <td className="py-2 px-2 font-semibold">
                                      <div>{en.description}</div>
                                      <div className="text-[11px] text-slate-700">
                                        {en.relatedParty ? `پارٹی: ${en.relatedParty}` : ''}
                                        {en.bankName || en.paymentMethod
                                          ? ` | طریقہ: ${en.bankName || en.paymentMethod}${en.accountNumber ? ` (${en.accountNumber})` : ''}`
                                          : ''}
                                      </div>
                                    </td>
                                    <td className="py-2 px-2 text-center font-mono" dir="ltr">
                                      {aedEq.toLocaleString()} AED
                                    </td>
                                    <td className="py-2 px-2 text-center font-mono font-bold" dir="ltr">
                                      {isCred ? `+${en.amountPKR.toLocaleString()} PKR` : '—'}
                                    </td>
                                    <td className="py-2 px-2 text-center font-mono font-bold" dir="ltr">
                                      {!isCred ? `-${en.amountPKR.toLocaleString()} PKR` : '—'}
                                    </td>
                                    <td className="py-2 px-2 text-center font-mono" dir="ltr">
                                      {en.previousBalancePKR.toLocaleString()} PKR
                                    </td>
                                    <td className="py-2 px-2 text-center font-mono font-black" dir="ltr">
                                      <div>{en.newBalancePKR.toLocaleString()} PKR</div>
                                      <span className="font-musaffah-title text-[10px] block" dir="rtl">
                                        {en.newBalancePKR < 0 ? 'منفی (واجب الادا)' : 'جمع (دستیاب)'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="border-t-2 border-slate-900 font-bold font-musaffah-title text-xs">
                                <td colSpan={6} className="py-2 px-2 text-right">
                                  میزان کھاتہ ({stationName}) — کل جمع و ٹرانسفر اور صافی بقایا بیلنس:
                                </td>
                                <td className="py-2 px-2 text-center font-mono font-black" dir="ltr">
                                  +{stationTotalJamaPkr.toLocaleString()} PKR
                                </td>
                                <td className="py-2 px-2 text-center font-mono font-black" dir="ltr">
                                  -{stationLedgerDebitPkr.toLocaleString()} PKR
                                </td>
                                <td className="py-2 px-2 text-center font-mono" dir="ltr">
                                  {stationOpeningBalPkr.toLocaleString()} PKR
                                </td>
                                <td className="py-2 px-2 text-center font-mono font-black" dir="ltr">
                                  {stationCurrentBalPkr.toLocaleString()} PKR ({stationCurrentBalPkr < 0 ? 'منفی واجب الادا' : 'جمع'})
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Overall Summary If Multiple Stations */}
                {Object.keys(groupedByStation).length > 1 && (
                  <div className="bg-slate-50 border-2 border-slate-900 p-3 flex flex-wrap justify-between items-center text-sm font-bold gap-2">
                    <span>کل میزان آرڈرز: {batchTransfers.length}</span>
                    <span>کل ٹرانسفر درہم: {batchTransfers.reduce((s, o) => s + o.amountAED, 0).toLocaleString()} AED</span>
                    <span>کل ٹرانسفر پاکستانی رقم: {batchTransfers.reduce((s, o) => s + o.amountPKR, 0).toLocaleString()} PKR</span>
                    <span>
                      مجموعی اسٹیشنز نیٹ بیلنس:{' '}
                      {stations.reduce((s, st) => s + (st.currentBalancePKR || 0), 0).toLocaleString()} PKR
                    </span>
                  </div>
                )}

                {/* Verification Signature & Mandatory Disclaimer Notice */}
                <div className="pt-4 border-t border-slate-400 mt-6 space-y-4">
                  <div className="bg-slate-50 border border-slate-800 rounded-lg py-2.5 px-4 text-center space-y-1">
                    <p className="font-musaffah-title text-sm sm:text-base font-bold text-slate-950" dir="rtl">
                      {resolveBrandText(
                        settings.receiptFooterUr,
                        'اپنی رقم 5 دنوں کے اندر وصول کر لیں، بصورتِ دیگر ہم ذمہ دار نہیں ہوں گے۔'
                      )}
                    </p>
                    {settings.receiptFooterEn && settings.receiptFooterEn !== settings.receiptFooterUr && (
                      <p className="text-[11px] font-bold text-slate-700" dir="ltr">
                        {resolveBrandText(settings.receiptFooterEn)}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-between items-end text-xs pt-2">
                    <div>
                      <div className="border-b border-slate-600 w-36 mb-1"></div>
                      <span>دستخط اکاؤنٹنٹ / کیشئر</span>
                    </div>
                    <div className="text-center text-slate-800 font-bold">
                      <span>
                        {settings.businessNameUr || 'ایگل اسٹار برانڈ'} ({settings.branchUr || settings.branchEn || 'دبئی تا پاکستان'})
                      </span>
                    </div>
                    <div>
                      <div className="border-b border-slate-600 w-36 mb-1"></div>
                      <span>دستخط برانچ منیجر</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeFormat === 'E' ? (
              /* FORMAT E: STATION COUNTER ACCOUNT STATEMENT (COMPLETE JAMA, TRANSFERS, BALANCE & DATE IN URDU) */
              (() => {
                const stObj =
                  stations.find(
                    s =>
                      s.nameUr === receiptModal.filterStation ||
                      s.nameEn === receiptModal.filterStation ||
                      s.code === receiptModal.filterStation
                  ) || stations[0];
                const stEntries = stObj?.entries || [];
                const stOrders = batchTransfers.length > 0
                  ? batchTransfers
                  : stObj
                  ? stations.length > 0
                    ? []
                    : []
                  : [];
                const totalCredPKR = stEntries
                  .filter(e => e.type === 'deposit_topup' || e.type === 'settlement_repayment')
                  .reduce((sum, e) => sum + e.amountPKR, 0);
                const totalDebPKR = stEntries
                  .filter(e => e.type === 'transfer_payout' || e.type === 'adjustment')
                  .reduce((sum, e) => sum + e.amountPKR, 0);
                const openingBalPKR = stEntries.length > 0 ? stEntries[0].previousBalancePKR : 0;
                const currentBalPKR = stObj?.currentBalancePKR || 0;

                return (
                  <div className="space-y-5 text-slate-900" dir="rtl">
                    <div className="border-b-2 border-slate-900 pb-3">
                      <div className="flex flex-col sm:flex-row items-center justify-between pb-2 mb-2 border-b border-slate-200 gap-2">
                        <EagleStarLogo
                          variant="print"
                          size="sm"
                          showSubtitle={true}
                          customNameEn={settings.businessNameEn}
                          customNameUr={settings.businessNameUr}
                          customSubtitle={settings.branchEn}
                          customLogoUrl={settings.customLogoUrl}
                        />
                        <div className="text-right sm:text-left text-[11px] text-slate-700 font-mono space-y-0.5" dir="ltr">
                          <p className="font-bold text-slate-900">{settings.branchEn || branchName}</p>
                          {settings.branchUr && (
                            <p className="font-bold text-slate-900 font-musaffah-title" dir="rtl">
                              {settings.branchUr}
                            </p>
                          )}
                          <p>
                            Helpline: {settings.phoneEn}
                            {settings.phoneUr && settings.phoneUr !== settings.phoneEn ? ` | ${settings.phoneUr}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-center pt-1">
                        <h1 className="text-2xl sm:text-4xl font-bold font-musaffah-title text-slate-950">
                          اسٹیشن کاؤنٹر لیجر، جمع و ٹرانسفر اور بقایا بیلنس اسٹیٹمنٹ
                        </h1>
                        <div className="flex flex-wrap items-center justify-between text-xs text-slate-800 mt-2 px-2 font-bold">
                          <span>اسٹیشن: {stObj?.nameUr} ({stObj?.nameEn}) [{stObj?.code}]</span>
                          <span>دورانیہ / تاریخ: {reportDateRange || new Date().toISOString().split('T')[0]}</span>
                          <span dir="ltr">
                            موجودہ بقایا بیلنس: {currentBalPKR.toLocaleString()} PKR ({currentBalPKR < 0 ? 'منفی واجب الادا' : 'جمع دستیاب'})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 4-Box Urdu Summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-musaffah-title">
                      <div className="border border-slate-800 rounded p-2 text-right">
                        <span className="block font-bold text-slate-700">سابقہ / ابتدائی بقایا:</span>
                        <span className="font-mono font-black text-sm block" dir="ltr">{openingBalPKR.toLocaleString()} PKR</span>
                      </div>
                      <div className="border border-slate-800 rounded p-2 text-right">
                        <span className="block font-bold text-slate-700">کل جمع رقم (Total Jama +):</span>
                        <span className="font-mono font-black text-sm block" dir="ltr">+{totalCredPKR.toLocaleString()} PKR</span>
                      </div>
                      <div className="border border-slate-800 rounded p-2 text-right">
                        <span className="block font-bold text-slate-700">کل ٹرانسفر / بنام (Total Transfer -):</span>
                        <span className="font-mono font-black text-sm block" dir="ltr">-{totalDebPKR.toLocaleString()} PKR</span>
                      </div>
                      <div className="border-2 border-slate-950 rounded p-2 text-right">
                        <span className="block font-black text-slate-950">موجودہ صافی بقایا بیلنس:</span>
                        <span className="font-mono font-black text-base block" dir="ltr">{currentBalPKR.toLocaleString()} PKR</span>
                        <span className="text-[11px] font-bold">{currentBalPKR < 0 ? 'منفی (واجب الادا)' : 'جمع (کیش دستیاب)'}</span>
                      </div>
                    </div>

                    <table className="w-full text-right text-xs border-collapse border border-slate-800">
                      <thead>
                        <tr className="bg-slate-900 text-white font-bold font-musaffah-title">
                          <th className="border border-slate-400 py-2 px-1.5 w-8 text-center">#</th>
                          <th className="border border-slate-400 py-2 px-2">تاریخ</th>
                          <th className="border border-slate-400 py-2 px-2 text-center">واؤچر / آرڈر #</th>
                          <th className="border border-slate-400 py-2 px-2 text-center">قسم</th>
                          <th className="border border-slate-400 py-2 px-2">تفصیل، بینک و پارٹی</th>
                          <th className="border border-slate-400 py-2 px-2 text-center">درہم (AED)</th>
                          <th className="border border-slate-400 py-2 px-2 text-center">جمع (+ Jama) PKR</th>
                          <th className="border border-slate-400 py-2 px-2 text-center">ٹرانسفر / بنام (-) PKR</th>
                          <th className="border border-slate-400 py-2 px-2 text-center">سابقہ بقایا</th>
                          <th className="border border-slate-400 py-2 px-2 text-center">موجودہ بقایا بیلنس PKR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stEntries.map((en, idx) => {
                          const isCred = en.type === 'deposit_topup' || en.type === 'settlement_repayment';
                          const aedEq = en.amountAED || Math.round(en.amountPKR / (en.exchangeRate || defaultRate));
                          return (
                            <tr key={en.id} className="border-b border-slate-300 font-musaffah-title">
                              <td className="border border-slate-300 py-2 px-1.5 text-center font-mono">{idx + 1}</td>
                              <td className="border border-slate-300 py-2 px-2 font-mono" dir="ltr">{en.date}</td>
                              <td className="border border-slate-300 py-2 px-2 text-center font-mono font-bold">{en.referenceNo || en.receiptNo}</td>
                              <td className="border border-slate-300 py-2 px-2 text-center font-bold">
                                {en.type === 'deposit_topup'
                                  ? 'کیش جمع (ڈپازٹ)'
                                  : en.type === 'settlement_repayment'
                                  ? 'سیٹلمنٹ جمع'
                                  : en.type === 'transfer_payout'
                                  ? 'ٹرانسفر ادائیگی'
                                  : 'ایڈجسٹمنٹ'}
                              </td>
                              <td className="border border-slate-300 py-2 px-2 font-semibold">
                                <div>{en.description}</div>
                                <div className="text-[11px] text-slate-700">
                                  {en.relatedParty ? `پارٹی: ${en.relatedParty}` : ''}
                                  {en.bankName || en.paymentMethod
                                    ? ` | ${en.bankName || en.paymentMethod}${en.accountNumber ? ` (${en.accountNumber})` : ''}`
                                    : ''}
                                </div>
                              </td>
                              <td className="border border-slate-300 py-2 px-2 text-center font-mono" dir="ltr">
                                {aedEq.toLocaleString()} AED
                              </td>
                              <td className="border border-slate-300 py-2 px-2 text-center font-mono font-bold text-emerald-800" dir="ltr">
                                {isCred ? `+${en.amountPKR.toLocaleString()}` : '—'}
                              </td>
                              <td className="border border-slate-300 py-2 px-2 text-center font-mono font-bold text-rose-800" dir="ltr">
                                {!isCred ? `-${en.amountPKR.toLocaleString()}` : '—'}
                              </td>
                              <td className="border border-slate-300 py-2 px-2 text-center font-mono" dir="ltr">
                                {en.previousBalancePKR.toLocaleString()}
                              </td>
                              <td className="border border-slate-300 py-2 px-2 text-center font-mono font-black" dir="ltr">
                                <div>{en.newBalancePKR.toLocaleString()} PKR</div>
                                <span className="font-musaffah-title text-[10px] block" dir="rtl">
                                  {en.newBalancePKR < 0 ? 'منفی (واجب الادا)' : 'جمع (دستیاب)'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100 font-bold border-t-2 border-slate-900 font-musaffah-title">
                          <td colSpan={6} className="border border-slate-400 py-2 px-3 text-right">کل میزان (Totals):</td>
                          <td className="border border-slate-400 py-2 px-2 text-center font-mono text-emerald-900" dir="ltr">
                            +{totalCredPKR.toLocaleString()} PKR
                          </td>
                          <td className="border border-slate-400 py-2 px-2 text-center font-mono text-rose-900" dir="ltr">
                            -{totalDebPKR.toLocaleString()} PKR
                          </td>
                          <td className="border border-slate-400 py-2 px-2 text-center font-mono" dir="ltr">
                            {openingBalPKR.toLocaleString()} PKR
                          </td>
                          <td className="border border-slate-400 py-2 px-2 text-center font-mono font-black" dir="ltr">
                            {currentBalPKR.toLocaleString()} PKR ({currentBalPKR < 0 ? 'منفی' : 'جمع'})
                          </td>
                        </tr>
                      </tfoot>
                    </table>

                    {stOrders.length > 0 && (
                      <div className="pt-2">
                        <h3 className="font-musaffah-title font-bold text-sm text-slate-950 mb-1">
                          منسلک ٹرانسفر آرڈرز ({stOrders.length})
                        </h3>
                      </div>
                    )}

                    {/* Footer Disclaimer & Signatures */}
                    <div className="pt-4 border-t border-slate-400 space-y-4">
                      <div className="bg-slate-50 border border-slate-800 rounded-lg py-2.5 px-4 text-center space-y-1">
                        <p className="font-musaffah-title text-sm sm:text-base font-bold text-slate-950" dir="rtl">
                          {resolveBrandText(
                            settings.receiptFooterDepositUr || settings.receiptFooterUr,
                            'ایگل اسٹار برانڈ - کیش جمع شدگی و کاؤنٹر فنڈز ڈپازٹ رسید۔ آپ کے اعتماد کا شکریہ!'
                          )}
                        </p>
                        {settings.receiptFooterUr && (
                          <p className="font-musaffah-title text-xs font-bold text-slate-800" dir="rtl">
                            {resolveBrandText(settings.receiptFooterUr)}
                          </p>
                        )}
                      </div>
                      <div className="flex justify-between items-end text-xs pt-2">
                        <div>
                          <div className="border-b border-slate-600 w-36 mb-1"></div>
                          <span>دستخط اکاؤنٹنٹ / کیشئر</span>
                        </div>
                        <div className="text-center text-slate-800 font-bold">
                          <span>{settings.businessNameUr || 'ایگل اسٹار برانڈ'} ({settings.branchUr || settings.branchEn})</span>
                        </div>
                        <div>
                          <div className="border-b border-slate-600 w-36 mb-1"></div>
                          <span>دستخط و مہر برانچ منیجر</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              /* UNIVERSAL OFFICIAL REFERENCE RECEIPT SLIP (FOR ALL MONEY TRANSFERS, CASH JAMA, DEPOSITS & LOANS) */
              /* FORMAT A: OFFICIAL MONEY TRANSFER SLIP (MATCHING USER REFERENCE RECEIPT & DYNAMIC SETTINGS) */
              <div 
                className="space-y-4 text-slate-950 w-full max-w-[850px] mx-auto" 
                dir="rtl"
                style={{
                  fontFamily: "'Noto Sans Arabic', 'Noto Naskh Arabic', 'Amiri', 'Segoe UI', Tahoma, Arial, sans-serif",
                  color: '#000000',
                  overflow: 'visible',
                  paddingBottom: '12px'
                }}
              >
                {/* Top Branding / Logo Header (Dynamically synced with Settings) */}
                <div className="text-center pb-3 border-b border-slate-300" style={{ paddingBottom: '14px' }}>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                    <EagleStarLogo
                      variant="print"
                      size="sm"
                      showSubtitle={true}
                      customNameEn={settings.businessNameEn}
                      customNameUr={settings.businessNameUr}
                      customSubtitle={settings.branchEn}
                      customLogoUrl={settings.customLogoUrl}
                    />
                    <div className="text-right sm:text-left text-xs font-mono font-bold text-slate-800 space-y-0.5" dir="ltr" style={{ lineHeight: 1.5 }}>
                      <p className="text-sm font-black text-slate-950">
                        {settings.branchEn || branchName || 'Deira Branch, Dubai, UAE'}
                      </p>
                      {settings.branchUr && (
                        <p className="text-xs font-bold text-slate-900 font-musaffah-title" dir="rtl">
                          {settings.branchUr}
                        </p>
                      )}
                      {settings.addressEn && (
                        <p className="text-[11px] font-bold text-slate-800">
                          {settings.addressEn}
                        </p>
                      )}
                      <p className="font-bold text-[11px]">
                        Helpline: {settings.phoneEn || '+971 50 123 4567'}
                        {settings.phoneUr && settings.phoneUr !== settings.phoneEn ? ` | ${settings.phoneUr}` : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reference Receipt Box matching user image */}
                <div
                  className="border-2 border-black bg-white text-slate-950 rounded-xs"
                  style={{ borderColor: '#000000', backgroundColor: '#ffffff', overflow: 'visible' }}
                >
                  {/* Top Bar: Date/Time (left), Black Badge 'رسید آرڈر' (center), Order Number (right) */}
                  <div
                    className="border-b-2 border-black py-3 px-4 sm:px-6 flex items-center justify-between font-mono bg-white"
                    style={{ borderBottomColor: '#000000', padding: '12px 22px' }}
                  >
                    {/* Left: Date & Time in clean format e.g. 02-11-26 10:51 PM */}
                    <div className="text-left font-mono font-bold text-sm sm:text-base text-slate-950 tracking-tight" dir="ltr" style={{ color: '#000000', lineHeight: 1.5 }}>
                      {slipDateTime}
                    </div>

                    {/* Center: Black Pill Badge with white Urdu text from settings: رسید آرڈر */}
                    <div className="text-center">
                      <span 
                        className="ref-black-badge bg-black text-white px-6 sm:px-8 rounded text-lg sm:text-xl font-black font-musaffah-title tracking-wider shadow-xs"
                        style={{
                          backgroundColor: '#000000',
                          color: '#ffffff',
                          padding: '6px 26px 11px 26px',
                          lineHeight: 1.45,
                          display: 'inline-block'
                        }}
                      >
                        {badgeTitle}
                      </span>
                    </div>

                    {/* Right: Order Reference Number e.g. 10965-2026 */}
                    <div className="text-right font-mono font-bold text-sm sm:text-lg text-slate-950 tracking-wide" dir="ltr" style={{ color: '#000000', lineHeight: 1.5 }}>
                      {slipOrderNumber}
                    </div>
                  </div>

                  {/* Section 1: Sender & Details (Clear Urdu text strictly inside borders with generous bottom clearance) */}
                  <div
                    className="border-b-2 border-black p-4 sm:p-5 space-y-2.5 text-right font-musaffah-title"
                    style={{ borderBottomColor: '#000000', padding: '16px 22px 22px 22px', lineHeight: 1.7 }}
                  >
                    <div className="text-lg sm:text-xl font-black flex items-baseline justify-start gap-3 flex-wrap" style={{ lineHeight: 1.7 }}>
                      <span className="font-black text-slate-950 shrink-0" style={{ color: '#000000' }}>ارسال کنندہ :</span>
                      <span className="font-bold text-slate-950" dir="auto" style={{ color: '#000000', unicodeBidi: 'isolate' }}>{senderNameDisplay}</span>
                    </div>
                    <div className="text-lg sm:text-xl font-black flex items-baseline justify-start gap-3 flex-wrap pt-1" style={{ lineHeight: 1.75, paddingBottom: '4px' }}>
                      <span className="font-black text-slate-950 shrink-0" style={{ color: '#000000' }}>تفصیل :</span>
                      <span className="font-bold text-slate-950" style={{ color: '#000000', lineHeight: 1.75 }}>
                        {detailDisplay}
                      </span>
                    </div>
                  </div>

                  {/* Section 2: Split Rate & Amounts (Dirham & Pakistani on RIGHT 60%, Rate on LEFT 40%) */}
                  <div
                    className="border-b-2 border-black flex flex-row items-stretch justify-between bg-white"
                    style={{ borderBottomColor: '#000000', overflow: 'visible' }}
                  >
                    {/* Right Column in RTL (60% width): Dirham & Pakistani */}
                    <div
                      className="w-[60%] p-4 sm:p-5 space-y-2.5 text-right"
                      style={{ padding: '16px 22px 22px 22px', lineHeight: 1.7 }}
                    >
                      <div className="text-lg sm:text-xl font-black flex items-center justify-start gap-3 font-musaffah-title" style={{ lineHeight: 1.7 }}>
                        <span className="text-slate-950 font-black shrink-0" style={{ color: '#000000' }}>درہم :</span>
                        <span className="font-mono font-black text-lg sm:text-xl tracking-tight text-slate-950" dir="ltr" style={{ color: '#000000' }}>
                          Dhs.{slipAmountAED.toLocaleString()}/-
                        </span>
                      </div>
                      <div className="text-lg sm:text-xl font-black flex items-center justify-start gap-3 font-musaffah-title" style={{ lineHeight: 1.7, paddingBottom: '4px' }}>
                        <span className="text-slate-950 font-black shrink-0" style={{ color: '#000000' }}>پاکستانی :</span>
                        <span className="font-mono font-black text-lg sm:text-xl tracking-tight text-slate-950" dir="ltr" style={{ color: '#000000' }}>
                          Rs.{slipAmountPKR.toLocaleString()}/-
                        </span>
                      </div>
                    </div>

                    {/* Left Column in RTL (40% width): Rate with vertical divider */}
                    <div
                      className="w-[40%] border-r-2 border-black p-4 sm:p-5 flex items-center justify-center shrink-0"
                      style={{ borderRightColor: '#000000', padding: '16px 22px 22px 22px', lineHeight: 1.7 }}
                    >
                      <div className="text-xl sm:text-2xl font-black font-musaffah-title flex items-center justify-center gap-2.5">
                        <span className="font-mono font-black text-2xl sm:text-3xl text-slate-950 tracking-tight" dir="ltr" style={{ color: '#000000' }}>
                          {rateDisplay}
                        </span>
                        <span className="text-slate-950 font-black text-lg sm:text-xl" style={{ color: '#000000' }}>: ریٹ</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Customer Account & Khata Balances (Matching reference image) */}
                  <div
                    className="border-b-2 border-black p-4 sm:p-5 space-y-3 text-right font-musaffah-title"
                    style={{ borderBottomColor: '#000000', padding: '16px 22px 22px 22px', lineHeight: 1.7 }}
                  >
                    <div className="text-lg sm:text-xl font-black flex items-baseline justify-start gap-3 flex-wrap" style={{ lineHeight: 1.7 }}>
                      <span className="font-black text-slate-950 shrink-0" style={{ color: '#000000' }}>اکاؤنٹ :</span>
                      <span className="font-bold text-slate-950" style={{ color: '#000000' }}>
                        {customerLabelUr} <span className="font-mono font-black text-slate-950" dir="ltr" style={{ unicodeBidi: 'isolate' }}>{customerCodeNumber}</span>
                      </span>
                    </div>
                    <div
                      className="text-lg sm:text-xl font-black flex items-baseline justify-start gap-3 flex-wrap pb-2"
                      style={{ lineHeight: 1.75, paddingBottom: '12px' }}
                    >
                      <span className="font-black text-slate-950 shrink-0" style={{ color: '#000000' }}>نام :</span>
                      <span className="font-bold text-slate-950" dir="auto" style={{ color: '#000000', unicodeBidi: 'isolate' }}>{senderFullName}</span>
                    </div>

                    {/* Previous and Current Balances (Supporting positive جمع and negative منفی / واجب الادا) */}
                    <div
                      className="pt-3 space-y-2.5 border-t border-black/30"
                      style={{ paddingTop: '14px', paddingBottom: '4px', borderTop: '1.5px solid #0f172a' }}
                    >
                      <div className="text-lg sm:text-xl font-black flex items-center justify-start gap-3 flex-wrap" style={{ lineHeight: 1.7 }}>
                        <span className="font-black text-slate-950 min-w-[130px]" style={{ color: '#000000' }}>سابقہ بقایا :</span>
                        <span className="font-mono font-black text-lg sm:text-xl text-slate-950" dir="ltr" style={{ color: '#000000', unicodeBidi: 'isolate' }}>
                          {prevBal.toLocaleString()}
                        </span>
                        <span className="text-slate-950 font-bold text-base sm:text-lg" style={{ color: '#000000' }}>
                          {prevBal < 0 ? 'منفی (واجب الادا)' : 'جمع'}
                        </span>
                      </div>

                      {depositEntry && depositMinusDeducted > 0 && (
                        <div className="text-base sm:text-lg font-black flex items-center justify-start gap-3 flex-wrap" style={{ lineHeight: 1.7 }}>
                          <span className="font-black text-slate-950 min-w-[130px]" style={{ color: '#000000' }}>منفی بقایا کٹوتی :</span>
                          <span className="font-mono font-black text-base sm:text-lg text-slate-950" dir="ltr" style={{ color: '#000000', unicodeBidi: 'isolate' }}>
                            -{depositMinusDeducted.toLocaleString()}
                          </span>
                          <span className="text-slate-950 font-bold text-sm sm:text-base" style={{ color: '#000000' }}>
                            منہا (جمع رقم {depositEntry.amountPKR.toLocaleString()} سے کٹوتی)
                          </span>
                        </div>
                      )}

                      <div className="text-lg sm:text-xl font-black flex items-center justify-start gap-3 flex-wrap" style={{ lineHeight: 1.7, paddingBottom: '4px' }}>
                        <span className="font-black text-slate-950 min-w-[130px]" style={{ color: '#000000' }}>موجودہ بقایا :</span>
                        <span className="font-mono font-black text-lg sm:text-xl text-slate-950" dir="ltr" style={{ color: '#000000', unicodeBidi: 'isolate' }}>
                          {curBal.toLocaleString()}
                        </span>
                        <span className="text-slate-950 font-bold text-base sm:text-lg" style={{ color: '#000000' }}>
                          {curBal < 0 ? 'منفی (واجب الادا - اسٹیشن ادائیگی)' : 'جمع'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Station Footer */}
                  <div
                    className="p-3.5 sm:p-4 text-right font-musaffah-title font-bold text-sm sm:text-base flex flex-wrap items-center justify-start gap-5 sm:gap-10 text-slate-950"
                    style={{ padding: '14px 22px 18px 22px', gap: '28px', lineHeight: 1.7 }}
                  >
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-black text-slate-950" style={{ color: '#000000' }}>سٹیشن: </span>
                      <span className="font-bold text-slate-950" dir="auto" style={{ color: '#000000', unicodeBidi: 'isolate' }}>{slipStation}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-black text-slate-950" style={{ color: '#000000' }}>پتہ : </span>
                      <span className="font-bold text-slate-900" dir="auto" style={{ color: '#000000', unicodeBidi: 'isolate' }}>{slipAddress}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-black text-slate-950" style={{ color: '#000000' }}>فون: </span>
                      <span className="font-mono font-bold text-slate-950" dir="ltr" style={{ color: '#000000', unicodeBidi: 'isolate' }}>
                        {slipPhone}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Notice & Signatures (Dynamically synced with Settings) */}
                <div className="pt-3 border-t border-slate-300 text-xs space-y-4" style={{ paddingTop: '14px', paddingBottom: '16px' }}>
                  <div
                    className="bg-slate-50 border border-slate-800 rounded-lg py-3 px-4 text-center space-y-1"
                    style={{ padding: '12px 20px 16px 20px', lineHeight: 1.75 }}
                  >
                    {(amanatAccount || amanatEntry) && settings.receiptFooterCashJamahUr && (
                      <p className="font-musaffah-title text-sm font-bold text-slate-950" dir="rtl" style={{ color: '#000000', lineHeight: 1.7 }}>
                        {resolveBrandText(settings.receiptFooterCashJamahUr)}
                      </p>
                    )}
                    {depositEntry && settings.receiptFooterDepositUr && (
                      <p className="font-musaffah-title text-sm font-bold text-slate-950" dir="rtl" style={{ color: '#000000', lineHeight: 1.7 }}>
                        {resolveBrandText(settings.receiptFooterDepositUr)}
                      </p>
                    )}
                    {loan && settings.receiptFooterLoanUr && (
                      <p className="font-musaffah-title text-sm font-bold text-slate-950" dir="rtl" style={{ color: '#000000', lineHeight: 1.7 }}>
                        {resolveBrandText(settings.receiptFooterLoanUr)}
                      </p>
                    )}
                    <p className="font-musaffah-title text-sm sm:text-base font-bold text-slate-950" dir="rtl" style={{ color: '#000000', lineHeight: 1.75 }}>
                      {resolveBrandText(
                        settings.receiptFooterUr,
                        'اپنی رقم 5 دنوں کے اندر وصول کر لیں، بصورتِ دیگر ہم ذمہ دار نہیں ہوں گے۔'
                      )}
                    </p>
                    {settings.receiptFooterEn && settings.receiptFooterEn !== settings.receiptFooterUr && (
                      <p className="text-[11px] font-semibold text-slate-700" dir="ltr" style={{ color: '#000000', lineHeight: 1.5 }}>
                        {resolveBrandText(settings.receiptFooterEn)}
                      </p>
                    )}
                  </div>
                  <div
                    className="flex justify-between items-end pt-3 pb-3 text-xs"
                    style={{ paddingTop: '14px', paddingBottom: '14px', lineHeight: 1.7 }}
                  >
                    <div className="text-center" style={{ paddingBottom: '4px' }}>
                      <div className="border-b border-slate-600 w-36 mb-2" style={{ marginBottom: '8px' }}></div>
                      <span className="font-bold text-slate-900 inline-block" style={{ lineHeight: 1.7 }}>تیار کنندہ (Prepared By)</span>
                    </div>
                    <div className="text-center font-bold text-slate-800" style={{ paddingBottom: '4px' }}>
                      <span className="inline-block font-musaffah-title" style={{ lineHeight: 1.7 }}>
                        {settings.businessNameUr || 'ایگل اسٹار برانڈ'} ({settings.businessNameEn || 'Eagle Star Brand'})
                      </span>
                    </div>
                    <div className="text-center" style={{ paddingBottom: '4px' }}>
                      <div className="border-b border-slate-600 w-36 mb-2" style={{ marginBottom: '8px' }}></div>
                      <span className="font-bold text-slate-900 inline-block" style={{ lineHeight: 1.7 }}>دستخط و مہر (Signature & Stamp)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
