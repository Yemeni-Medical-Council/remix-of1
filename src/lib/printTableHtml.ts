import { fmt } from "./format";
import { formatReportDate } from "@/lib/reportDate";
import { noteRowClass, noteRowCss } from "@/lib/notesColors";
import reportLetterheadUrl from "@/assets/report-letterhead.png";

export type TableCol = { key: string; label: string };

export const REPORT_LETTERHEAD_SRC = reportLetterheadUrl;

export const reportLetterheadHtml = () => `
  <div class="report-letterhead-block">
    <img class="report-letterhead-image" src="${REPORT_LETTERHEAD_SRC}" alt="ترويسة المجلس اليمني للاختصاصات الطبية" />
  </div>
`;

export const reportLetterheadRowHtml = (columnCount: number) => `
  <tr class="report-letterhead-row">
    <th class="report-letterhead-cell" colspan="${Math.max(1, Math.floor(columnCount))}">
      <img class="report-letterhead-image" src="${REPORT_LETTERHEAD_SRC}" alt="ترويسة المجلس اليمني للاختصاصات الطبية" />
    </th>
  </tr>
`;

/**
 * تكرار ترويسة التقرير في أعلى كل صفحة مطبوعة
 */
export const runningLetterheadCss = `
  @media print {
    .report-letterhead-block {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      width: 100% !important;
      margin: 0 !important;
      z-index: 9;
      background: #fff;
    }
    body { padding-top: 37mm !important; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
  }
`;

export const escapeHtml = (s: any) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * أنماط موحّدة للطباعة ومعاينة PDF وواجهة الجداول
 * تضمن الاحتواء التلقائي وعدم التفاف الأرقام والتواريخ مع التفاف النص فقط لعمود البيان.
 */
export const tablePrintStyles = `
  @page {
    size: A4 portrait;
    margin: 2mm;
  }
  
  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Cairo', -apple-system, sans-serif;
    padding: 3mm 4mm;
    color: #000 !important;
    direction: rtl;
    width: 100%;
    font-weight: 700;
    font-size: 14.5px;
    background: #fff;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  h1 {
    text-align: center;
    color: #000 !important;
    margin: 0 0 3px;
    font-size: 20px;
    font-weight: 900;
  }

  .sub {
    text-align: center;
    color: #000 !important;
    margin-bottom: 6px;
    font-size: 14px;
    font-weight: 700;
    border-bottom: 1px solid #1f5f7a;
    padding-bottom: 4px;
  }
  
  /* احتواء تلقائي كامل للجدول وتكيّف العرض حسب المحتوى */
  table {
    width: 100% !important;
    min-width: auto;
    border-collapse: collapse !important;
    table-layout: auto !important;
    font-size: 16px;
    margin: auto;
  }
  
  th, td {
    border: 1px solid #000 !important;
    padding: 4px 5px !important;
    text-align: center !important;
    vertical-align: middle !important;
    color: #000 !important;
    box-sizing: border-box;
  }

  /* 1. رؤوس الأعمدة: خلفية غامقة وخط أبيض عريض */
  thead th,
  th {
    background: gold !important;
    color: #000 !important;
    font-weight: 800 !important;
    font-size: 14.5px !important;
    line-height: 1.3 !important;
    white-space: normal !important;
    word-break: keep-all !important;
    border: 1px solid #000000 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  thead th .pdf-cell-text,
  th .pdf-cell-text {
    background: gold !important;
    color: #000 !important;
    font-weight: 800 !important;
    white-space: normal !important;
  }

  /* 2. عمود البيان فقط يلتف تلقائياً */
  tbody td.text-cell,
  tbody td.desc-cell,
  tbody td.details-cell,
  .long-text-cell {
    white-space: nowrap !important;
    word-break: break-word !important;
    overflow-wrap: break-word !important;
    text-align: center !important;
    min-width: auto;
    line-height: 1.4 !important;
  }

  tbody td.text-cell .pdf-cell-text,
  tbody td.desc-cell .pdf-cell-text,
  tbody td.details-cell .pdf-cell-text {
    white-space: normal !important;
    word-break: break-word !important;
    text-align: center !important;
    display: inline-block;
    width: 100%;
  }

  tbody td {
    font-weight: 700 !important;
    font-size: 14px !important;
    padding: 3px 4px !important;
  }

  .pdf-cell-text {
    width: 100%;
  min-width: auto;
    text-align: center !important;
    font-family: 'Cairo', sans-serif !important;
    font-weight: 700;
  white-space: normal !important;

  }

  /* الأرقام والتواريخ والأكواد تبقى في سطر واحد دون التفاف */
  .num,
  .numeric-cell,
  .date-cell,
  .compact-cell,
  .idx {
    font-family: 'Cairo', monospace !important;
    direction: ltr !important;
    font-weight: 800 !important;
    font-size: 14px !important;
    white-space: nowrap !important;
    word-break: keep-all !important;
    overflow-wrap: normal !important;
    hyphens: none !important;
  }

  .num .pdf-cell-text,
  .numeric-cell .pdf-cell-text,
  .date-cell .pdf-cell-text,
  .compact-cell .pdf-cell-text,
  .idx .pdf-cell-text {
    white-space: nowrap !important;
    word-break: keep-all !important;
    width: auto;
  }

  tbody tr:nth-child(even) td {
    background: #f8fafc !important;
  }

  .total-row td {
    background: #fef3c7 !important;
    font-weight: 900 !important;
    font-size: 15px !important;
    border-top: 2px solid #000 !important;
    white-space: nowrap !important;
  }
  
  /* ترويسة التقرير المنفصلة والمضمنة */
  .report-letterhead-block {
    display: flex;
    position: relative;
    top: 0;
    width: 100%;
    height: 26mm;
    min-height: 26mm;
    max-height: 26mm;
    align-items: stretch;
    justify-content: center;
    margin: 0 auto 3mm;
    page-break-before: avoid;
    page-break-after: avoid;
    break-before: avoid;
    break-after: avoid;
  }

  .report-letterhead-image {
    display: flex;
    width: 100%;
    max-width: 100%;
    height: 100%;
    max-height: auto;
    object-fit: fill;
    object-position: top;
    margin: 0;
  }

  @media print and (orientation: portrait) {
    .report-letterhead-block { height: 26mm; min-height: 26mm; max-height: 26mm; }
  }

  @media print and (orientation: landscape) {
    .report-letterhead-block { height: 30mm; min-height: 30mm; max-height: 30mm; }
  }

  .report-letterhead-row,
  .doc-title-row {
    page-break-after: avoid;
    break-after: avoid;
  }

  .doc-title-row td.doc-title-cell {
    border: none !important;
    background: #fff !important;
    padding: 2px 0 2px !important;
  }

  .report-letterhead-row .report-letterhead-cell {
    height: 26mm !important;
    min-height: 26mm !important;
    padding: 0 !important;
    border: 0 !important;
    background: #fff !important;
  }

  .report-letterhead-row .report-letterhead-image {
    height: 26mm !important;
    max-height: 26mm !important;
  }

  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
  tr { page-break-inside: avoid; }

  ${noteRowCss}
  ${runningLetterheadCss}
`;

/** يبني ترويسة + جدول التبويب (المستخدم في الطباعة وتنزيل PDF) */
export function buildTableHtml(opts: {
  title: string;
  columns: TableCol[];
  rows: Record<string, any>[];
  numericKeys?: string[];
  subtitle?: string;
  reportDate?: string;
}) {
  const { title, columns, rows, numericKeys = [], subtitle, reportDate } = opts;
  
  const isDateColumn = (c: TableCol) =>
    /date|تاريخ|اليوم|الشهر|السنة|year|month|day/i.test(`${c.key} ${c.label}`);

  const isCompactColumn = (c: TableCol) =>
    /(^|[-_ ])(no|number|code|key|id)([-_ ]|$)|رقم|رمز|كود|الباب|الفصل|البند|النوع|الشهر|السنة/i.test(`${c.key} ${c.label}`);

  const isDescriptionColumn = (c: TableCol) =>
    /بيان|تفاصيل|وصف|desc|statement|details|notes/i.test(`${c.key} ${c.label}`);

  const getCellClass = (c: TableCol, val?: any) => {
    const isNumeric = numericKeys.includes(c.key) || typeof val === "number";
    const isDate = isDateColumn(c);
    const isCompact = isCompactColumn(c);
    const isDesc = isDescriptionColumn(c);

    if (isDesc) return "text-cell desc-cell";

    return [
      (isNumeric || isDate || isCompact) ? "num numeric-cell" : "text-cell",
      isDate ? "date-cell" : "",
      isCompact ? "compact-cell" : "",
    ].filter(Boolean).join(" ");
  };

  const reportDateLabel =
    formatReportDate(reportDate) || new Date().toLocaleDateString("ar-EG-u-nu-latn");

  const sub =
    subtitle ??
    `المجلس اليمني للاختصاصات الطبية - صعدة • تاريخ التقرير: ${reportDateLabel} • عدد السجلات: ${rows.length}`;

  const titleRow = `<tr class="doc-title-row"><td colspan="${columns.length + 1}" class="doc-title-cell">
    <h1>${escapeHtml(title)}</h1>
    <div class="sub">${escapeHtml(sub)}</div>
  </td></tr>`;

  const head = `${titleRow}<tr><th class="idx numeric-cell">م</th>${columns
    .map((c) => `<th class="${getCellClass(c)}"><span class="pdf-cell-text">${escapeHtml(c.label)}</span></th>`)
    .join("")}</tr>`;

  const totals: Record<string, number> = {};
  columns.forEach((c) => {
    if (numericKeys.includes(c.key)) {
      totals[c.key] = rows.reduce((sum, r) => sum + (Number(r[c.key]) || 0), 0);
    }
  });

  const totalRow = `<tr class="total-row"><td class="idx numeric-cell">الإجمالي</td>${columns
    .map((c) =>
      numericKeys.includes(c.key)
        ? `<td class="num numeric-cell"><span class="pdf-cell-text">${escapeHtml(fmt(totals[c.key] || 0))}</span></td>`
        : `<td class="${isDateColumn(c) ? "date-cell" : ""}"><span class="pdf-cell-text"></span></td>`
    )
    .join("")}</tr>`;

  const body = rows
    .map(
      (r, i) =>
        `<tr class="${noteRowClass((r as any).notes)}"><td class="idx numeric-cell"><span class="pdf-cell-text">${i + 1}</span></td>${columns
          .map((c) => {
            const v = r[c.key];
            const isNum = numericKeys.includes(c.key) || typeof v === "number";
            const classes = getCellClass(c, v);
            
            return `<td class="${classes}"><span class="pdf-cell-text">${
              isNum ? escapeHtml(fmt(Number(v) || 0)) : escapeHtml(v)
            }</span></td>`;
          })
          .join("")}</tr>`
    )
    .join("");

  return `<table><thead>${head}</thead><tbody>${body}${totalRow}</tbody></table>`;
}
