import { fmt } from "./format";
import { formatReportDate } from "@/lib/reportDate";
import { noteRowClass, noteRowCss } from "@/lib/notesColors";
import reportLetterheadUrl from "@/assets/report-letterhead.png";

export type TableCol = { key: string; label: string };

export const REPORT_LETTERHEAD_SRC = reportLetterheadUrl;

/**
 * توليد ترويسة التقارير الرسمية كإطار نصي موحد بدلاً من الصورة
 * الجانب الأيمن: البيانات بالعربية
 * المنتصف: بسم الله الرحمن الرحيم
 * الجانب الأيسر: البيانات بالإنجليزية
 */
export const reportLetterheadHtml = () => `
  <div class="report-letterhead-block">
    <div class="report-letterhead-frame">
      <div class="report-letterhead-side report-letterhead-right">
        <div class="letterhead-title-ar">الجمهورية اليمنية</div>
        <div class="letterhead-sub-ar">وزارة الصحة والبيئة</div>
        <div class="letterhead-sub-ar">المجلس اليمني للاختصاصات الطبية</div>
        <div class="letterhead-branch-ar">فرع صعدة</div>
      </div>
      <div class="report-letterhead-center">
        <div class="letterhead-bismillah">بسم الله الرحمن الرحيم</div>
        <div class="letterhead-center-divider"></div>
      </div>
      <div class="report-letterhead-side report-letterhead-left">
        <div class="letterhead-title-en">Republic of Yemen</div>
        <div class="letterhead-sub-en">Ministry of Public Health &amp; Environment</div>
        <div class="letterhead-sub-en">Yemeni Council for Medical Specializations</div>
        <div class="letterhead-branch-en">Saada Branch</div>
      </div>
    </div>
  </div>
`;

export const reportLetterheadRowHtml = (columnCount: number) => `
  <tr class="report-letterhead-row">
    <th class="report-letterhead-cell" colspan="${Math.max(1, Math.floor(columnCount))}">
      ${reportLetterheadHtml()}
    </th>
  </tr>
`;

/**
 * تكرار ترويسة التقرير في أعلى كل صفحة مطبوعة
 */
export const runningLetterheadCss = `
  @media print {
    .report-letterhead-block {
      display: block !important;
      position: relative !important;
      width: 100% !important;
      margin: 0 auto 3mm !important;
      background: #ffffff !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    thead { display: table-header-group !important; }
    tfoot { display: table-footer-group !important; }
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
 */
export const tablePrintStyles = `
  @page {
    size: A4 portrait;
    margin: 3mm;
  }
  
  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: Cairo !important;
    padding: 3mm 4mm;
    color: #000000 !important;
    direction: rtl;
    width: 100%;
    font-weight: 700;
    background: #ffffff;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  h1 {
    text-align: center;
    color: #000000 !important;
    margin: 0 0 4px;
    font-size: 22px;
    font-weight: 900;
  }

  .sub {
    text-align: center;
    color: #000000 !important;
    margin-bottom: 6px;
    font-size: 18px;
    font-weight: 700;
    border-bottom: 1.5px solid #0f283a;
    padding-bottom: 4px;
  }
  
  /* جدول باحتواء تلقائي متكيف مع أبعاد A4 */
  table {
    width: 100% !important;
    max-width: auto !important;
    border-collapse: collapse !important;
    table-layout: auto !important;
    margin: 0 auto;
    text-align: center !important;
  }
  
  th, td {
    border: 1px solid #000000 !important; 
    padding: 4px 5px !important;
    text-align: center !important;
    vertical-align: middle !important;
    box-sizing: border-box;
  }

  /* رؤوس الأعمدة: خلفية داكنة وخط أبيض عريض */
  thead th {
    background: #028611 !important;
    color: #ffffff !important;
    font-weight: 800 !important;
    font-size: 14px !important;
    padding: 6px 4px !important;
    white-space: normal !important;
    word-break: keep-all !important;
    border: 1px solid #000000 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  thead th .pdf-cell-text,
  th .pdf-cell-text {
    background: transparent !important;
    color: #ffffff !important;
    font-weight: 800 !important;
    white-space: normal !important;
  }

  thead th.desc-cell,
  thead th[data-col-key="description"] {
    background: #174258 !important;
    color: #ffffff !important;
    white-space: normal !important;
  }

  /* القاعدة العامة لصفوف البيانات */
  tbody td {
    color: #000000 !important;
    white-space: normal !important;
    font-weight: 800 !important;
    font-size: 14.5px !important;
    padding: 3px 4px !important;
    text-align: center !important;
    line-height: 1.3 !important;
    word-break: break-word !important;
  }

  .pdf-cell-text {
    background: #2ed6e7 !important;
    color: #000000 !important;
    text-align: center !important;
    font-family: Cairo !important;
    font-weight: 800;
    line-height: 1.4 !important;
    white-space: nowrap !important;
    font-size: 13.5px !important;
  }

  /* استثناء خاص: عمود البيان يلتف تلقائياً */
  td.desc-cell.pdf-cell-text,
  td.details-cell.pdf-cell-text,
  td.description-cell.pdf-cell-text,
  tbody td.desc-cell,
  tbody td.details-cell,
  tbody td.description-cell,
  tbody td[data-col-key="description"] {
    white-space: normal !important;
    word-break: break-word !important;
    overflow-wrap: normal !important;
    text-align: center !important;
    direction: rtl !important;
    padding: 2px 4px !important;
    line-height: 1.35 !important;
    min-width: 180px !important;
  }

  tbody td.desc-cell .pdf-cell-text,
  tbody td.details-cell .pdf-cell-text,
  tbody td.description-cell .pdf-cell-text,
  tbody td[data-col-key="description"] .pdf-cell-text {
    white-space: normal !important;
    word-break: break-word !important;
    overflow-wrap: normal !important;
    display: inline-block;
  }

  /* أعمدة الأسماء: سطر واحد دون التفاف */
  tbody td.name-cell,
  tbody td[data-col-key="name"],
  tbody td.name-cell .pdf-cell-text {
    font-weight: 800 !important;
    color: #000000 !important;
    white-space: nowrap !important;
    word-break: keep-all !important;
    text-align: center !important;
    padding: 3px 6px !important;
  }

  /* أعمدة التخصص والدفعة */
  tbody td.specialty-cell,
  tbody td.batch-cell,
  tbody td[data-col-key="specialty"],
  tbody td[data-col-key="batch"] {
    color: #000000 !important;
    white-space: nowrap !important;
    word-break: keep-all !important;
    text-align: center !important;
  }

  /* الأرقام والتواريخ والمبالغ والأكواد: سطر واحد */
  .num,
  .numeric-cell,
  .date-cell,
  .compact-cell,
  .ref-cell,
  .idx {
    font-family: Cairo !important;
    direction: ltr !important;
    font-weight: 800 !important;
    font-size: 14px !important;
    white-space: nowrap !important;
    word-break: keep-all !important;
    overflow-wrap: normal !important;
    text-align: center !important;
  }

  .num .pdf-cell-text,
  .numeric-cell .pdf-cell-text,
  .date-cell .pdf-cell-text,
  .compact-cell .pdf-cell-text,
  .ref-cell .pdf-cell-text,
  .idx .pdf-cell-text {
    white-space: nowrap !important;
    word-break: keep-all !important;
    text-align: center !important;
  }

  tbody tr:nth-child(even) td {
    background: #f8fafc !important;
  }

  /* صف الإجمالي النهائي */
  .total-row td {
    background: #067601 !important;
    color: #ffffff !important;
    font-weight: 900 !important;
    font-size: 13.5px !important;
    border-top: 2px solid #000000 !important;
    white-space: nowrap !important;
    padding: 5px 4px !important;
  }
  .total-row td .pdf-cell-text {
    color: #ffffff !important;
  }

  /* ===== إطار الترويسة الموحّد والنصوص الرسمية ===== */
  .report-letterhead-block {
    display: block !important;
    position: relative !important;
    width: 100% !important;
    margin: 0 auto 3mm !important;
    page-break-before: avoid !important;
    page-break-after: avoid !important;
    break-before: avoid !important;
    break-after: avoid !important;
  }

  .report-letterhead-frame {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    justify-content: space-between !important;
    width: 100% !important;
    border: 1.5px solid #000000 !important;
    border-radius: 4px !important;
    padding: 5px 12px !important;
    background: #ffffff !important;
    box-sizing: border-box !important;
    color: #000000 !important;
  }

  .report-letterhead-side {
    flex: 1 1 36% !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    color: #000000 !important;
  }

  .report-letterhead-right {
    text-align: right !important;
    direction: rtl !important;
  }

  .letterhead-title-ar {
    font-family: Cairo, sans-serif !important;
    font-size: 13.5px !important;
    font-weight: 900 !important;
    line-height: 1.3 !important;
    color: #000000 !important;
  }

  .letterhead-sub-ar {
    font-family: Cairo, sans-serif !important;
    font-size: 12px !important;
    font-weight: 800 !important;
    line-height: 1.3 !important;
    color: #000000 !important;
  }

  .letterhead-branch-ar {
    font-family: Cairo, sans-serif !important;
    font-size: 12.5px !important;
    font-weight: 900 !important;
    line-height: 1.3 !important;
    color: #000000 !important;
  }

  .report-letterhead-center {
    flex: 0 0 28% !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    text-align: center !important;
    padding: 0 4px !important;
  }

  .letterhead-bismillah {
    font-family: Cairo, sans-serif !important;
    font-size: 14.5px !important;
    font-weight: 900 !important;
    color: #000000 !important;
    white-space: nowrap !important;
    text-align: center !important;
  }

  .letterhead-center-divider {
    width: 75px !important;
    height: 1.5px !important;
    background: #000000 !important;
    margin: 3px auto 0 !important;
  }

  .report-letterhead-left {
    text-align: left !important;
    direction: ltr !important;
  }

  .letterhead-title-en {
    font-family: Arial, Cairo, sans-serif !important;
    font-size: 12px !important;
    font-weight: 900 !important;
    line-height: 1.25 !important;
    color: #000000 !important;
  }

  .letterhead-sub-en {
    font-family: Arial, Cairo, sans-serif !important;
    font-size: 10.5px !important;
    font-weight: 800 !important;
    line-height: 1.25 !important;
    color: #000000 !important;
  }

  .letterhead-branch-en {
    font-family: Arial, Cairo, sans-serif !important;
    font-size: 11px !important;
    font-weight: 900 !important;
    line-height: 1.25 !important;
    color: #000000 !important;
  }

  .report-letterhead-row,
  .doc-title-row {
    page-break-after: avoid;
    break-after: avoid;
  }

  .doc-title-row td.doc-title-cell {
    border: none !important;
    background: #ffffff !important;
    padding: 2px 0 4px !important;
  }

  .report-letterhead-row .report-letterhead-cell {
    padding: 0 !important;
    border: 0 !important;
    background: #ffffff !important;
  }

  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
  tr { page-break-inside: avoid; }

  /* صفوف ملخص العهدة */
  .summary-spacer-row td {
    height: 12px !important;
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
  }
  .summary-card-row td {
    text-align: center !important;
    vertical-align: middle !important;
    font-weight: 900 !important;
    font-size: 13px !important;
    padding: 6px 5px !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    white-space: nowrap !important;
  }
  .summary-card-row .summary-label-cell {
  background: #51c4ec !important;
    text-align: center !important;
    font-weight: 900 !important;
  }
  .summary-card-row .summary-value-cell {
  background: #51c4ec !important;
    text-align: center !important;
    font-family: Cairo !important;
    font-weight: 900 !important;
    direction: ltr !important;
  }
  .summary-card-0 td {
    background: #ffdd66 !important;
    color: #000 !important;
    border: 1px solid #d97706 !important;
  }
  .summary-card-1 td {
    background: #ff5252 !important;
    color: #7f1d1d !important;
    border: 1px solid #dc2626 !important;
  }
  .summary-card-2 td {
    background: #a7f3d0 !important;
    color: #064e3b !important;
    border: 1px solid #059669 !important;
  }

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
  includeTotalRow?: boolean;
}) {
  const { title, columns, rows, numericKeys = [], subtitle, reportDate, includeTotalRow = true } = opts;

  const isDescriptionColumn = (c: TableCol) =>
    c.key === "description" || /^(البيان|بيان|تفاصيل|وصف|الشرح)$/i.test(c.label.trim());

  const isNameColumn = (c: TableCol) =>
    c.key === "name" || /^(الاسم|اسم المتدرب|اسم العميل)$/i.test(c.label.trim());

  const isDateColumn = (c: TableCol) =>
    /date|تاريخ/i.test(c.key) || /تاريخ/i.test(c.label);

  const isRefOrCodeColumn = (c: TableCol) =>
    /(no|num|code|key|id|check|notify|hafiza)/i.test(c.key) ||
    /^(رقم|رمز|كود|شيك|إشعار|اشعار|حافظة|دفعة|الدفعة)/i.test(c.label.trim());

  const isSpecialtyColumn = (c: TableCol) =>
    c.key === "specialty" || /^(التخصص|المساق)$/i.test(c.label.trim());

  const isBatchColumn = (c: TableCol) =>
    c.key === "batch" || /^(الدفعة)$/i.test(c.label.trim());

  const getCellClass = (c: TableCol, val?: any) => {
    if (isDescriptionColumn(c)) {
      return "desc-cell";
    }
    if (isNameColumn(c)) {
      return "name-cell text-cell";
    }
    if (isSpecialtyColumn(c)) {
      return "specialty-cell text-cell";
    }
    if (isBatchColumn(c)) {
      return "batch-cell text-cell";
    }

    const isNumeric = numericKeys.includes(c.key) || typeof val === "number";
    const isDate = isDateColumn(c);
    const isRef = isRefOrCodeColumn(c);

    return [
      isNumeric ? "num numeric-cell amount-cell" : "",
      isDate ? "num date-cell" : "",
      isRef ? "num compact-cell ref-cell" : "",
      !isNumeric && !isDate && !isRef ? "text-cell" : "",
    ]
      .filter(Boolean)
      .join(" ");
  };

  const getReportRowClass = (row: Record<string, any>, index: number) => {
    const level = String(row?.summaryLevel || "");
    return [
      noteRowClass(row?.notes),
      level === "opening" ? "report-opening-row" : "",
      level === "fee" ? "report-fee-row" : "",
      level === "period" ? "report-period-row" : "",
      level === "total" || row?.description === "الإجمالي الكلي" ? "report-grand-total-row" : "",
      index % 2 === 1 ? "report-row-striped" : "report-row-plain",
    ].filter(Boolean).join(" ");
  };

  const formatCellContent = (value: any, isNumeric: boolean) => {
    if (value === undefined || value === null || value === "") return "—";
    return isNumeric ? escapeHtml(fmt(Number(value) || 0)) : escapeHtml(value);
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

  // بناء صف الرؤوس
  const head = `${titleRow}<tr><th class="idx numeric-cell" data-col-key="idx" data-col-name="م">م</th>${columns
    .map(
      (c) =>
        `<th class="${getCellClass(c)}" data-col-key="${escapeHtml(c.key)}" data-col-name="${escapeHtml(
          c.label
        )}"><span class="pdf-cell-text">${escapeHtml(c.label)}</span></th>`
    )
    .join("")}</tr>`;

  // احتساب الإجماليات
  const dataRowsForTotals = rows.filter((r) => r && !r.__summaryCard && r.summaryLevel !== "summary-card" && r.summaryLevel !== "total");
  const totals: Record<string, number> = {};
  columns.forEach((c) => {
    if (numericKeys.includes(c.key)) {
      totals[c.key] = dataRowsForTotals.reduce((sum, r) => sum + (Number(r[c.key]) || 0), 0);
    }
  });

  const totalRow = includeTotalRow ? `<tr class="total-row"><td class="idx numeric-cell">الإجمالي</td>${columns
    .map((c) =>
      numericKeys.includes(c.key)
        ? `<td class="num numeric-cell amount-cell" data-col-key="${escapeHtml(c.key)}"><span class="pdf-cell-text">${escapeHtml(
            fmt(totals[c.key] || 0)
          )}</span></td>`
        : `<td class="${isDateColumn(c) ? "date-cell" : ""}" data-col-key="${escapeHtml(c.key)}"><span class="pdf-cell-text"></span></td>`
    )
    .join("")}</tr>` : "";

  // بناء صفوف البيانات مع دعم صفوف الملخص
  const body = rows
    .map((r, i) => {
      if (r && (r.__summaryCard || r.summaryLevel === "summary-card")) {
        const cardIndex = Number(r.__summaryCard?.index ?? r.summaryCardIndex ?? 0) || 0;
        const label = String(r.__summaryCard?.label ?? r.description ?? "");
        const value = Number(r.__summaryCard?.value ?? r.credit ?? 0) || 0;
        const colorClass = `summary-card-${cardIndex % 3}`;

        const labelSpan = Math.max(1, columns.length - 1);
        const valueSpan = 2;

        return `<tr class="summary-card-row ${colorClass}">
          <td class="summary-label-cell" colspan="${labelSpan}">
            <span class="pdf-cell-text">${escapeHtml(label)}</span>
          </td>
          <td class="summary-value-cell" colspan="${Math.max(1, valueSpan)}">
            <span class="pdf-cell-text">${escapeHtml(fmt(value))}</span>
          </td>
        </tr>`;
      }

      return `<tr class="${getReportRowClass(r, i)}"><td class="idx numeric-cell" data-col-key="idx"><span class="pdf-cell-text">${
        r.summaryLevel === "total" || r.description === "الإجمالي الكلي" ? "★" : i + 1
      }</span></td>${columns
        .map((c) => {
          const v = r[c.key];
          const isNum = numericKeys.includes(c.key) || typeof v === "number";
          const classes = getCellClass(c, v);

          return `<td class="${classes}" data-col-key="${escapeHtml(c.key)}" data-col-name="${escapeHtml(
            c.label
          )}"><span class="pdf-cell-text">${formatCellContent(v, isNum)}</span></td>`;
        })
        .join("")}</tr>`;
    })
    .join("");

  // إدراج فاصل قبل صفوف الملخص إن وُجدت
  const bodyWithSpacer = (() => {
    const hasSummary = rows.some((r) => r && (r.__summaryCard || r.summaryLevel === "summary-card"));
    if (!hasSummary) return body;

    const summaryIndex = rows.findIndex((r) => r && (r.__summaryCard || r.summaryLevel === "summary-card"));
    if (summaryIndex <= 0) return body;

    const spacerHtml = `<tr class="summary-spacer-row"><td colspan="${columns.length + 1}"></td></tr>`;
    const beforeRows = rows.slice(0, summaryIndex);
    const afterRows = rows.slice(summaryIndex);

    const buildRows = (arr: Record<string, any>[], startIndex: number) =>
      arr.map((r, i) => {
        const globalIndex = startIndex + i;
        if (r && (r.__summaryCard || r.summaryLevel === "summary-card")) {
          const cardIndex = Number(r.__summaryCard?.index ?? r.summaryCardIndex ?? 0) || 0;
          const label = String(r.__summaryCard?.label ?? r.description ?? "");
          const value = Number(r.__summaryCard?.value ?? r.credit ?? 0) || 0;
          const colorClass = `summary-card-${cardIndex % 3}`;
          const labelSpan = Math.max(1, columns.length - 1);
          const valueSpan = 2;

          return `<tr class="summary-card-row ${colorClass}">
            <td class="summary-label-cell" colspan="${labelSpan}">
              <span class="pdf-cell-text">${escapeHtml(label)}</span>
            </td>
            <td class="summary-value-cell" colspan="${Math.max(1, valueSpan)}">
              <span class="pdf-cell-text">${escapeHtml(fmt(value))}</span>
            </td>
          </tr>`;
        }

        return `<tr class="${getReportRowClass(r, globalIndex)}"><td class="idx numeric-cell" data-col-key="idx"><span class="pdf-cell-text">${
          r.summaryLevel === "total" || r.description === "الإجمالي الكلي" ? "★" : globalIndex + 1
        }</span></td>${columns
          .map((c) => {
            const v = r[c.key];
            const isNum = numericKeys.includes(c.key) || typeof v === "number";
            const classes = getCellClass(c, v);

            return `<td class="${classes}" data-col-key="${escapeHtml(c.key)}" data-col-name="${escapeHtml(
              c.label
            )}"><span class="pdf-cell-text">${formatCellContent(v, isNum)}</span></td>`;
          })
          .join("")}</tr>`;
      }).join("");

    return buildRows(beforeRows, 0) + spacerHtml + buildRows(afterRows, summaryIndex);
  })();

  return `<table><thead>${head}</thead><tbody>${bodyWithSpacer}${totalRow}</tbody></table>`;
}
