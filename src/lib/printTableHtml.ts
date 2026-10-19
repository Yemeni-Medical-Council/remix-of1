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
 * تعتمد الاحتواء التلقائي الدقيق لأسماء أعمدة حوافظ التوريد والحساب الجاري:
 * رؤوس داكنة بخط أبيض، والتفاف النص فقط لعمود "البيان"، وثبات سطر الأسماء والتواريخ والأرقام.
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
    font-size: 20px;
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
    color: #000000 !important;
  }
  
  th, td {
    border: 1px solid #000000 !important;
    padding: 4px 5px !important;
    text-align: center !important;
    vertical-align: middle !important;
    color: #000000 !important;
    box-sizing: border-box;
  }

  /* 1. رؤوس الأعمدة: خلفية كحلية غامقة وخط أبيض عريض */
  thead th {
    font-weight: 800 !important;
    font-size: 14.5px !important;
    padding: 6px 4px !important;
    white-space: normal !important;
    word-break: keep-all !important;
    border: 1px solid #000000 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  thead th .pdf-cell-text,
  th .pdf-cell-text {
    color: #ffffff !important;
    font-weight: 800 !important;
    white-space: normal !important;
    min-width: auto;

  }

  /* الرأس الخاص بعمود البيان يسمح بالمرونة */
  thead th.desc-cell,
  thead th[data-col-key="description"] {
    white-space: normal !important;
min-width: auto;

  }

  /* 2. القاعدة العامة لصفوف البيانات: منع الالتفاف كقاعدة أساسية */
  tbody td {
    white-space: normal !important;
    font-weight: 700 !important;
    font-size: 13.5px !important;
    padding: 3px 4px !important;
    text-align: center !important;
    line-height: 1.3 !important;
word-break: break-word !important;
    min-width: auto;
  }

  .pdf-cell-text {
text-align: center !important;
  font-family: Cairo !important;
    font-weight: 700;
    line-height: 1.5 !important;
white-space: nowrap !important;
font-size: 13.5px !important;

  }

  /* 3. استثناء خاص وحصري: عمود "البيان" يلتف تلقائياً دون كسر الكلمات الحسابية */
  td.desc-cell.pdf-cell-text,
  td.details-cell.pdf-cell-text,
  td.description-cell.pdf-cell-text {
    white-space: normal !important;
    word-break: break-word !important;
    overflow-wrap: normal !important;
    text-align: center !important;
    direction: rtl !important;
    padding: 2px 2px !important;
    line-height: 1.4 !important;
    width: 330px;
  }

  /* 4. أعمدة الأسماء (الاسم / اسم المتدرب): تتسع لاحتواء الاسم كاملاً دون التفاف */
  tbody td.name-cell,
  tbody td[data-col-key="name"],
  tbody td.name-cell .pdf-cell-text,
  tbody td[data-col-key="date"] .pdf-cell-text {
    white-space: nowrap !important;
 word-break: break-word !important;
    text-align: center !important;
    padding: 3px 6px !important;
    min-width: 50px !important;
  }

  /* 5. أعمدة التخصص والدفعة: سطر واحد واحتواء مباشر */
  tbody td.specialty-cell,
  tbody td.batch-cell,
  tbody td[data-col-key="specialty"],
  tbody td[data-col-key="batch"] {
    white-space: normal !important;
      word-break: break-word !important;.
    text-align: center !important;
    min-width: 50px !important;
  }

  /* 6. الأرقام والتواريخ والمبالغ والأكواد المرجعية: سطر واحد ثابت بخط أوضح */
  .num,
  .numeric-cell,
  .date-cell,
  .compact-cell,
  .ref-cell,
  .idx {
    font-family: Cairo !important;
    direction: ltr !important;
    font-weight: 800 !important;
    font-size: 14.5px !important;
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

  /* تلوين الصفوف الفردية والزوجية لسهولة القراءة */
  tbody tr:nth-child(even) td {
    background: #f8fafc !important;
  }

  /* صف الإجمالي النهائي */
  .total-row td {
    background: #fef3c7 !important;
    color: #000000 !important;
    font-weight: 900 !important;
    font-size: 13px !important;
    border-top: 2px solid #000000 !important;
    white-space: nowrap !important;
    padding: 5px 4px !important;
  }

  /* ترويسة التقرير */
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
    background: #ffffff !important;
    padding: 2px 0 4px !important;
  }

  .report-letterhead-row .report-letterhead-cell {
    height: 26mm !important;
    min-height: 26mm !important;
    padding: 0 !important;
    border: 0 !important;
    background: #ffffff !important;
  }

  .report-letterhead-row .report-letterhead-image {
    height: 26mm !important;
    max-height: 26mm !important;
  }

  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
  tr { page-break-inside: avoid; }

  /* ملاءمة أعمدة تقارير الحوافظ والحساب الجاري: عمود البيان وحده يلتف */
  table {
    width: 100% !important;
    max-width: 100% !important;
    table-layout: auto !important;
  }
  tbody td:not(.desc-cell):not(.details-cell):not(.description-cell):not([data-col-key="description"]) {
    white-space: nowrap !important;
    word-break: keep-all !important;
    overflow-wrap: normal !important;
    min-width: 0 !important;
  }
  tbody td.desc-cell,
  tbody td.details-cell,
  tbody td.description-cell,
  tbody td[data-col-key="description"] {
    white-space: normal !important;
    word-break: normal !important;
    overflow-wrap: anywhere !important;
    min-width: 200px !important;
    text-align: center !important;
  }
  tbody td.desc-cell .pdf-cell-text,
  tbody td.details-cell .pdf-cell-text,
  tbody td.description-cell .pdf-cell-text,
  tbody td[data-col-key="description"] .pdf-cell-text {
    display: block;
    white-space: normal !important;
    word-break: normal !important;
    overflow-wrap: anywhere !important;
    min-width: 0 !important;
    text-align: center !important;
  }
  tbody td:not(.desc-cell):not(.details-cell):not(.description-cell):not([data-col-key="description"]) .pdf-cell-text {
    white-space: nowrap !important;
    word-break: keep-all !important;
    overflow-wrap: normal !important;
  }
  thead th {
    white-space: normal !important;
    word-break: normal !important;
    overflow-wrap: anywhere !important;
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
}) {
  const { title, columns, rows, numericKeys = [], subtitle, reportDate } = opts;

  // فحص نوع العمود بدقة بالاعتماد على أسماء رؤوس الأعمدة المعتمدة ومفاتيحها
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

  const reportDateLabel =
    formatReportDate(reportDate) || new Date().toLocaleDateString("ar-EG-u-nu-latn");

  const sub =
    subtitle ??
    `المجلس اليمني للاختصاصات الطبية - صعدة • تاريخ التقرير: ${reportDateLabel} • عدد السجلات: ${rows.length}`;

  const titleRow = `<tr class="doc-title-row"><td colspan="${columns.length + 1}" class="doc-title-cell">
    <h1>${escapeHtml(title)}</h1>
    <div class="sub">${escapeHtml(sub)}</div>
  </td></tr>`;

  // بناء صف الرؤوس مع تضمين أسماء ومفاتيح الأعمدة
  const head = `${titleRow}<tr><th class="idx numeric-cell" data-col-key="idx" data-col-name="م">م</th>${columns
    .map(
      (c) =>
        `<th class="${getCellClass(c)}" data-col-key="${escapeHtml(c.key)}" data-col-name="${escapeHtml(
          c.label
        )}"><span class="pdf-cell-text">${escapeHtml(c.label)}</span></th>`
    )
    .join("")}</tr>`;

  // احتساب الإجماليات للأعمدة المالية
  const totals: Record<string, number> = {};
  columns.forEach((c) => {
    if (numericKeys.includes(c.key)) {
      totals[c.key] = rows.reduce((sum, r) => sum + (Number(r[c.key]) || 0), 0);
    }
  });

  const totalRow = `<tr class="total-row"><td class="idx numeric-cell">الإجمالي</td>${columns
    .map((c) =>
      numericKeys.includes(c.key)
        ? `<td class="num numeric-cell amount-cell" data-col-key="${escapeHtml(c.key)}"><span class="pdf-cell-text">${escapeHtml(
            fmt(totals[c.key] || 0)
          )}</span></td>`
        : `<td class="${isDateColumn(c) ? "date-cell" : ""}" data-col-key="${escapeHtml(c.key)}"><span class="pdf-cell-text"></span></td>`
    )
    .join("")}</tr>`;

  // بناء صفوف البيانات
  const body = rows
    .map(
      (r, i) =>
        `<tr class="${noteRowClass((r as any).notes)}"><td class="idx numeric-cell" data-col-key="idx"><span class="pdf-cell-text">${
          i + 1
        }</span></td>${columns
          .map((c) => {
            const v = r[c.key];
            const isNum = numericKeys.includes(c.key) || typeof v === "number";
            const classes = getCellClass(c, v);

            return `<td class="${classes}" data-col-key="${escapeHtml(c.key)}" data-col-name="${escapeHtml(
              c.label
            )}"><span class="pdf-cell-text">${
              isNum ? escapeHtml(fmt(Number(v) || 0)) : escapeHtml(v)
            }</span></td>`;
          })
          .join("")}</tr>`
    )
    .join("");

  return `<table><thead>${head}</thead><tbody>${body}${totalRow}</tbody></table>`;
}
