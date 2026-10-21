import { downloadRenderedReportPdf, reportContainmentCss } from "@/lib/reportPdf";
import { escapeHtml, REPORT_LETTERHEAD_SRC } from "@/lib/printTableHtml";

export interface BrowserPreviewOptions {
  title: string;
  reportDateLabel?: string;
  tableHtml: string;
  contentCss?: string;
  defaultOrientation?: "portrait" | "landscape";
  defaultPageSize?: "A4" | "A3" | "Letter";
  defaultMarginMm?: number;
}

export function openBrowserPrintPreview({
  title,
  reportDateLabel = "",
  tableHtml,
  contentCss = "",
  defaultOrientation = "portrait",
  defaultPageSize = "A4",
  defaultMarginMm = 3,
}: BrowserPreviewOptions): boolean {
  const newWin = window.open("", "_blank");
  if (!newWin) {
    return false;
  }

  const hasEmbeddedLetterhead = tableHtml.includes("report-letterhead");
  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>معاينة طباعة: ${escapeHtml(title)} - ${escapeHtml(reportDateLabel)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      background: #e2e8f0;
      font-family: 'Cairo', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0f172a;
      direction: rtl;
    }

    .preview-toolbar {
width: 100%;
max-width: auto;
      position: sticky;
      top: 0;
      z-index: 9999;
      background: #0f283a;
      color: #fff;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 8px 14px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      border-bottom: 2px solid #1f5f7a;
    }

    .preview-toolbar .title-box {
    width: auto;
      display: block;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 700;
      color: #e0f2fe;
    }

    .preview-toolbar .controls-group {
      display: block;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
    }

    .preview-toolbar select, .preview-toolbar input[type="date"], .preview-toolbar button {
      font-family: inherit;
      font-size: 12px;
      font-weight: 700;
      padding: 5px 8px;
      border-radius: 6px;
      border: 1px solid #336d88;
      background: #173b50;
      color: #fff;
      cursor: pointer;
      outline: none;
      transition: all 0.15s ease;
    }

    .preview-toolbar input[type="date"] {
      cursor: text;
      background: #0b1f2d;
      border-color: #38bdf8;
      color: #f8fafc;
      padding: 3px 6px;
      font-family: monospace, 'Cairo';
    }

    .preview-toolbar select:hover, .preview-toolbar button:hover {
      background: #1e4b65;
      border-color: #38bdf8;
    }

    .filter-box {
    width:100%;
   max-width: auto;
      display: inline-block;
      align-items: center;
      gap: 13px;
      background: rgba(255, 255, 255, 0.08);
      padding: 4px 8px;
      border-radius: 8px;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }

    .preview-toolbar button.btn-apply-filter {
      background: #0284c7;
      border-color: #38bdf8;
      padding: 4px 10px;
    }
    .preview-toolbar button.btn-reset-filter {
      background: #475569;
      border-color: #64748b;
      padding: 4px 8px;
    }

    .preview-toolbar button.btn-print {
      background: #059669;
      border-color: #10b981;
      padding: 6px 14px;
      font-size: 13px;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(5, 150, 105, 0.4);
    }
    .preview-toolbar button.btn-print:hover {
      background: #10b981;
    }

    .preview-toolbar button.btn-download-pdf {
      background: #0284c7;
      border-color: #38bdf8;
      padding: 6px 12px;
      font-size: 13px;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(2, 132, 199, 0.4);
    }
    .preview-toolbar button.btn-download-pdf:hover {
      background: #0369a1;
    }

    .preview-toolbar button.btn-close {
      background: #dc2626;
      border-color: #ef4444;
    }
    .preview-toolbar button.btn-close:hover {
      background: #ef4444;
    }

    .sheet-viewport {
      display: flex;
      justify-content: center;
      padding: 10px 10px 20px;
      overflow-x: auto;
    }

    .sheet-paper {
      background: #ffffff;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      border: 1px solid #000;
      border-radius: 2px;
      box-sizing: border-box;
      transition: all 0.2s ease;
      transform-origin: top center;
    }

    .sheet-paper.portrait {
      width: 210mm;
      min-height: 297mm;
      padding: 3mm;
    }

    .sheet-paper.landscape {
      width: 297mm;
      min-height: 210mm;
      padding: 3mm;
    }

    .report-letterhead-block {
      display: flex;
      width: 100%;
      height: 26mm;
      max-height: 26mm;
      align-items: stretch;
      justify-content: center;
      margin: 0 auto 3mm;
    }

    .report-letterhead-image {
      width: 100%;
      max-width: 100%;
      height: 100%;
      object-fit: fill;
      object-position: top;
    }

    table {
      width: 100%;
      max-width: auto;
      border-collapse: collapse;
      table-layout: auto;
      margin: 0 auto;
      color: #000;
  text-align: center !important;

    }

    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    tr { page-break-inside: avoid; break-inside: avoid; }

    /* تنسيق الخلايا العام: منع الالتفاف كقاعدة عامة */
    th, td {
  border: 1px solid #000 !important; 
      text-align: center;
      vertical-align: middle;
      padding: 4px 5px;
      box-sizing: border-box;
word-break: break-word !important;

    }

    /* رؤوس الأعمدة: خلفية غامقة بخط أبيض عريض */
    thead th {
  min-width: auto;
      background: gold !important;
      color: #000 !important;
      font-weight: 800 !important;
      font-size: 14.5px !important;
      padding: 6px 4px !important;
      white-space: normal !important;
      word-break: break-word !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    thead th .pdf-cell-text, th .pdf-cell-text {
        min-width: auto;
  font-weight: 800 !importat;
      font-size: 16.5px !important;
      padding: 6px 4px !important;
      white-space: normal !important;
  word-break: break-word !important;
-webkit-print-color-adjust: exact!important;
print-color-adjust: exact!important;

    }

    /* عمود البيان فقط: التفاف تلقائي للنص ومحاذاة لليمين */
      tbody td.specialty-cell,
    tbody td.batch-cell,
    tbody td[data-col-key = "specialty"],
    tbody td[data-col-key = "batch"] {
      white-space: normal !important;
      word-break: break-word !important;
      overflow-wrap: normal !important;
    text-align: center !important;
    width: 100px !important;

    }

    td.desc-cell .pdf-cell-text,
    td.details-cell .pdf-cell-text,
    td.description-cell .pdf-cell-text {
      white-space: normal !important;
      word-break: break-word !important;
      overflow-wrap: normal !important;
      text-align: center !important;
    width: 500px !important;

    }

    /* الأرقام والتواريخ والمعرفات: تظل في سطر واحد دون التفاف */
    .num, .numeric-cell, .date-cell, .idx, [data-numeric="true"],
    td.compact-cell, td.text-cell {
  text-align: center !important;
 white-space: nowrap !important;
      word-break: keep-all !important;
      overflow-wrap: nowrap !important;
      font-family: Cairo !important;
      direction: ltr !important;
      font-weight: 800 !important;
      font-size: 12px;
      color: #000;
      padding: 3px 5px !important;
    }

    .num .pdf-cell-text,
    .numeric-cell .pdf-cell-text,
    .date-cell .pdf-cell-text,
    .idx .pdf-cell-text,
    .compact-cell .pdf-cell-text,
    td.text-cell .pdf-cell-text {
      white-space: nowrap !important;
      word-break: keep-all !important;
      font-weight: 800 !important;
text-align: center !important;
    }

    /* صف الإجمالي */
    .total-row td {
      background: #52ff00 !important;
      font-weight: 900 !important;
      font-size: 12px !important;
      border-top: 2px solid #000 !important;
      color: #000 !important;
      white-space: nowrap !important;
    }

    ${contentCss}
    ${reportContainmentCss}

    /* قواعد نهائية موحدة في المعاينة والطباعة: التفاف البيان دون سواه */
    .sheet-paper table { width:100% !important; max-width:auto !important; table-layout:auto !important; }
    .sheet-paper tbody td:not(.desc-cell):not(.details-cell):not(.description-cell):not([data-col-key="description"]),
    .sheet-paper tbody td:not(.desc-cell):not(.details-cell):not(.description-cell):not([data-col-key="description"]) .pdf-cell-text {
      white-space:nowrap !important; word-break:keep-all !important; overflow-wrap:normal !important;
      min-width: auto !important;
    }
    .sheet-paper tbody td.desc-cell,
    .sheet-paper tbody td.details-cell,
    .sheet-paper tbody td.description-cell,
    .sheet-paper tbody td[data-col-key="description"],
    .sheet-paper tbody td.desc-cell .pdf-cell-text,
    .sheet-paper tbody td.details-cell .pdf-cell-text,
    .sheet-paper tbody td.description-cell .pdf-cell-text,
    .sheet-paper tbody td[data-col-key="description"] .pdf-cell-text {
      white-space: normal !important; word-break:normal !important; overflow-wrap: normal !important;
      min-width:0 !important; text-align: center !important;
    }
    .sheet-paper thead th {
white-space: normal !important;
    overflow-wrap: anywhere !important; }
    /* تحسين وضوح النسخة المطبوعة مع الحفاظ على المساحة المتاحة للجدول */
    .sheet-paper .report-page-content table {
      width:100% !important;
      max-width:100% !important;
      table-layout:auto !important;
  font-family: Cairo !important;
    }
    .sheet-paper .report-page-content th,
    .sheet-paper .report-page-content td,
    .sheet-paper .report-page-content .pdf-cell-text {
      font-family:'Cairo',sans-serif !important;
      text-align:center !important;
      vertical-align:middle !important;
  font-size: 14px !important;
      line-height:1.4 !important;
    }
    .sheet-paper .report-page-content th,
    .sheet-paper .report-page-content td {
      padding: 5px 6px !important;
    }
    .sheet-paper .report-page-content thead th {
      font-size: 15px !important;
      font-weight:800 !important;
      padding:6px 5px !important;
    }
    .sheet-paper .report-page-content tbody td[data-col-key="description"],
    .sheet-paper .report-page-content tbody td[data-col-key="description"] .pdf-cell-text {
      text-align:center !important;
    }

    .sheet-paper, .sheet-paper * {
      max-width: 100%;
    }
    .sheet-paper table {
      width: 100% !important;
    }

    @media print {
      .preview-toolbar {
        display: none !important;
      }
      body {
font-family: Cairo !important;
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;

      }
      thead th, th {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .sheet-viewport {
        padding: 0 !important;
        margin: 0 !important;
        overflow: visible !important;
      }
      .sheet-paper {
        border: none !important;
        box-shadow: none !important;
        width: 100% !important;
    min-height: auto !important;
        padding: 0 !important;
        margin: 0 !important;
        transform: none !important;
      }
    }
  </style>

  <style id="dynamic-page-rule">
    @page {
      size: ${defaultPageSize} ${defaultOrientation};
      margin: ${defaultMarginMm}mm;
    }
  </style>
</head>
<body>

  <div class="preview-toolbar">
    <div class="title-box">
      <span>📄 ${escapeHtml(title)}</span>
      ${reportDateLabel ? `<span style="opacity:0.8; font-size:12px;">(${escapeHtml(reportDateLabel)})</span>` : ""}
    </div>

    <div class="controls-group">
      <div class="filter-box">
        <span style="font-size:11px; font-weight:bold; color:#7dd3fc;">الفترة:</span>
        <label style="font-size:11px;">من <input type="date" id="dateFrom" /></label>
        <label style="font-size:11px;">إلى <input type="date" id="dateTo" /></label>
        <button type="button" class="btn-apply-filter" id="btnFilter">تطبيق</button>
        <button type="button" class="btn-reset-filter" id="btnResetFilter" title="إلغاء الفلترة">إلغاء</button>
      </div>

      <label style="font-size: 11px; font-weight: bold;">
        الاتجاه:
        <select id="selOrientation">
          <option value="portrait" ${defaultOrientation === "portrait" ? "selected" : ""}>طولي</option>
          <option value="landscape" ${defaultOrientation === "landscape" ? "selected" : ""}>عرضي</option>
        </select>
      </label>

      <label style="font-size: 11px; font-weight: bold;">
        الحجم:
        <select id="selPageSize">
          <option value="A4" ${defaultPageSize === "A4" ? "selected" : ""}>A4</option>
          <option value="A3" ${defaultPageSize === "A3" ? "selected" : ""}>A3</option>
          <option value="Letter" ${defaultPageSize === "Letter" ? "selected" : ""}>Letter</option>
        </select>
      </label>

      <label style="font-size: 11px; font-weight: bold;">
        الهوامش:
        <select id="selMargin">
          <option value="0mm"${defaultMarginMm === 0 ? " selected" : ""}>بدون</option>
          <option value="3mm"${defaultMarginMm === 3 ? " selected" : ""}>3 مم</option>
          <option value="5mm"${defaultMarginMm === 5 ? " selected" : ""}>5 مم</option>
          <option value="8mm">8 مم</option>
          <option value="12mm">12 مم</option>
        </select>
      </label>

      <label style="font-size: 11px; font-weight: bold;">
        الملاءمة:
        <select id="selScale">
          <option value="1">100%</option>
          <option value="0.95">95%</option>
          <option value="0.90">90%</option>
          <option value="0.85">85%</option>
          <option value="0.80">80%</option>
          <option value="0.75">75%</option>
        </select>
      </label>

      <button type="button" class="btn-print" id="btnPrint">
        🖨️ طباعة
      </button>

      <button type="button" class="btn-download-pdf" id="btnDownloadPdf">
        📥 تنزيل PDF
      </button>

      <button type="button" class="btn-close" id="btnClose">
        ✕
      </button>
    </div>
  </div>

  <div class="sheet-viewport">
    <div id="paperContainer" class="sheet-paper ${defaultOrientation}">
      ${hasEmbeddedLetterhead ? "" : `<div class="report-letterhead-block">
        <img class="report-letterhead-image" src="${REPORT_LETTERHEAD_SRC}" alt="الترويسة الرسمية" />
      </div>`}
      <div id="tableContainer" class="preview-report-content report-page-content">
        ${tableHtml}
      </div>
    </div>
  </div>

  <script>
    (function() {
      const selOrientation = document.getElementById('selOrientation');
      const selPageSize = document.getElementById('selPageSize');
      const selMargin = document.getElementById('selMargin');
      const selScale = document.getElementById('selScale');
      const paperContainer = document.getElementById('paperContainer');
      const dynamicRule = document.getElementById('dynamic-page-rule');
      const btnPrint = document.getElementById('btnPrint');
      const btnDownloadPdf = document.getElementById('btnDownloadPdf');
      const btnClose = document.getElementById('btnClose');
      const dateFrom = document.getElementById('dateFrom');
      const dateTo = document.getElementById('dateTo');
      const btnFilter = document.getElementById('btnFilter');
      const btnResetFilter = document.getElementById('btnResetFilter');
      const subTitleEl = document.querySelector('.sub');
      const originalSubText = subTitleEl ? subTitleEl.textContent : '';

      let printInProgress = false;

      function toLatinDigits(str) {
        if (!str) return '';
        const arabic = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
        return String(str).replace(/[٠-٩]/g, function(d) {
          return arabic.indexOf(d);
        });
      }

      function parseRowDate(raw) {
        if (!raw) return null;
        const text = toLatinDigits(raw.trim());
        
        let m = text.match(/(\\d{4})[-\\/](\\d{1,2})[-\\/](\\d{1,2})/);
        if (m) {
          return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
        }

        m = text.match(/(\\d{1,2})[-\\/](\\d{1,2})[-\\/](\\d{4})/);
        if (m) {
          return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
        }

        const d = new Date(text);
        return isNaN(d.getTime()) ? null : d;
      }

      function findDateColumnIndex(table) {
        const ths = Array.from(table.querySelectorAll('thead th'));
        // المرحلة 1: مطابقة دقيقة على نص الرأس (مع تجاهل المسافات والزخارف)
        const exactPatterns = [
          /^التاريخ$/,
          /^تاريخ$/,
          /^date$/i
        ];
        for (let idx = 0; idx < ths.length; idx++) {
          const raw = ths[idx].textContent || '';
          const clean = raw.replace(/[\\u200f\\u200e\\u202a-\\u202e]/g, '').trim();
          if (exactPatterns.some(function(p) { return p.test(clean); })) {
            return idx;
          }
        }
        // المرحلة 2: مطابقة مرنة (يحتوي على كلمة تاريخ/date)
        for (let idx = 0; idx < ths.length; idx++) {
          const clean = (ths[idx].textContent || '').replace(/\\s+/g, ' ').trim();
          if (/التاريخ|تاريخ|date/i.test(clean)) {
            return idx;
          }
        }
        // المرحلة 3: فحص بيانات أول صف لاكتشاف العمود الذي يحتوي على تواريخ
        const firstBodyRow = table.querySelector('tbody tr:not(.total-row)');
        if (firstBodyRow) {
          for (let idx = 0; idx < firstBodyRow.cells.length; idx++) {
            const cellText = (firstBodyRow.cells[idx].textContent || '').trim();
            if (parseRowDate(cellText)) {
              return idx;
            }
          }
        }
        return -1;
      }

      function readCellDate(cell) {
        if (!cell) return null;
        // أولوية 1: data-date / datetime
        const dataAttr = cell.getAttribute('data-date') || cell.getAttribute('datetime');
        if (dataAttr) {
          const d = parseRowDate(dataAttr);
          if (d) return d;
        }
        // أولوية 2: نص الخلية (يدعم .pdf-cell-text)
        const textEl = cell.querySelector('.pdf-cell-text') || cell;
        return parseRowDate((textEl.textContent || '').trim());
      }

      function formatNum(num) {
        return Number(num).toLocaleString('en-US');
      }

      function applyDateFilter() {
        const fromStr = dateFrom.value;
        const toStr = dateTo.value;
        const fromVal = fromStr ? new Date(fromStr + 'T00:00:00') : null;
        const toVal = toStr ? new Date(toStr + 'T23:59:59') : null;

        const table = document.querySelector('.sheet-paper table');
        if (!table) return;

        const dateColIdx = findDateColumnIndex(table);

        const numericColIndices = [];
        const totalRow = table.querySelector('.total-row');
        if (totalRow) {
          Array.from(totalRow.cells).forEach(function(cell, idx) {
            if (cell.classList.contains('numeric-cell') || cell.classList.contains('num')) {
              if (idx > 0) numericColIndices.push(idx);
            }
          });
        }

        const colTotals = {};
        numericColIndices.forEach(function(idx) { colTotals[idx] = 0; });

        const rows = Array.from(table.querySelectorAll('tbody tr')).filter(function(r) {
          return !r.classList.contains('total-row');
        });
        
        let visibleCount = 0;

        rows.forEach(function(row) {
          let rowDate = null;
          if (dateColIdx >= 0 && row.cells[dateColIdx]) {
            rowDate = readCellDate(row.cells[dateColIdx]);
          }

          let show = true;
          if (fromVal || toVal) {
            if (rowDate) {
              if (fromVal && rowDate < fromVal) show = false;
              if (toVal && rowDate > toVal) show = false;
            } else {
              // إذا طُلب نطاق زمني والصف لا يحتوي على تاريخ في عمود التاريخ نعتبره خارج النطاق
              show = false;
            }
          }

          row.style.display = show ? '' : 'none';
          if (show) {
            visibleCount++;
            if (row.cells[0]) {
              const idxSpan = row.cells[0].querySelector('.pdf-cell-text') || row.cells[0];
              idxSpan.textContent = visibleCount;
            }

            numericColIndices.forEach(function(colIdx) {
              if (row.cells[colIdx]) {
                const rawVal = toLatinDigits(row.cells[colIdx].textContent).replace(/[^0-9.-]/g, '');
                const num = parseFloat(rawVal) || 0;
                colTotals[colIdx] += num;
              }
            });
          }
        });

        if (totalRow) {
          numericColIndices.forEach(function(colIdx) {
            if (totalRow.cells[colIdx]) {
              const span = totalRow.cells[colIdx].querySelector('.pdf-cell-text') || totalRow.cells[colIdx];
              span.textContent = formatNum(colTotals[colIdx]);
            }
          });
        }

        if (subTitleEl) {
          if (fromVal || toVal) {
            const rangeStr = (fromVal ? 'من ' + fromStr : '') + (toVal ? ' إلى ' + toStr : '');
            subTitleEl.textContent = originalSubText + ' • الفترة المحددة: ' + rangeStr + ' (السجلات: ' + visibleCount + ')';
          } else {
            subTitleEl.textContent = originalSubText;
          }
        }
      }

      btnFilter.addEventListener('click', applyDateFilter);
      btnResetFilter.addEventListener('click', function() {
        dateFrom.value = '';
        dateTo.value = '';
        applyDateFilter();
      });

      function printOnce() {
        if (printInProgress) return;
        printInProgress = true;
        window.print();
        window.setTimeout(function() { printInProgress = false; }, 1000);
      }

      function updatePageSettings() {
        const orientation = selOrientation.value;
        const pageSize = selPageSize.value;
        const margin = selMargin.value;
        const scale = parseFloat(selScale.value) || 1;

        paperContainer.classList.remove('portrait', 'landscape');
        paperContainer.classList.add(orientation);

        if (pageSize === 'A3') {
          paperContainer.style.width = orientation === 'portrait' ? '297mm' : '420mm';
        } else if (pageSize === 'Letter') {
          paperContainer.style.width = orientation === 'portrait' ? '216mm' : '279mm';
        } else {
          paperContainer.style.width = orientation === 'portrait' ? '210mm' : '297mm';
        }

        paperContainer.style.padding = margin;
        const heights = pageSize === 'A3' ? [420, 297] : pageSize === 'Letter' ? [279.4, 215.9] : [297, 210];
        paperContainer.style.minHeight = heights[orientation === 'portrait' ? 0 : 1] + 'mm';
        paperContainer.style.transform = 'none';
        const pageWidthMm = pageSize === 'A3'
          ? (orientation === 'portrait' ? 297 : 420)
          : pageSize === 'Letter'
            ? (orientation === 'portrait' ? 215.9 : 279.4)
            : (orientation === 'portrait' ? 210 : 297);
        const table = paperContainer.querySelector('table');
        const headerRow = table && table.tHead && table.tHead.rows[table.tHead.rows.length - 1];
        const columnCount = headerRow ? headerRow.cells.length : 1;
        const pageFactor = pageWidthMm >= 290 ? 1 : 0;
        const fontSize = Math.max(12, 15 + pageFactor - Math.max(0, columnCount - 8) * 0.28);
        const horizontalPadding = columnCount > 12 ? 4 : 6;
        paperContainer.style.setProperty('--print-cell-font-size', fontSize.toFixed(1) + 'px');
        paperContainer.style.setProperty('--print-header-font-size', (fontSize + 1).toFixed(1) + 'px');
        paperContainer.style.setProperty('--print-cell-padding', '5px ' + horizontalPadding + 'px');
        const tableContainer = document.getElementById('tableContainer');
        tableContainer.style.zoom = String(scale);
        dynamicRule.innerHTML = '@page { size: ' + pageSize + ' ' + orientation + '; margin: ' + margin + '; }';
        window.requestAnimationFrame(function() {
          const table = tableContainer.querySelector('table');
          if (!table) return;
          tableContainer.style.zoom = '1';
          const availableWidth = Math.max(1, paperContainer.clientWidth -
            parseFloat(getComputedStyle(paperContainer).paddingLeft) -
            parseFloat(getComputedStyle(paperContainer).paddingRight));
          const naturalWidth = Math.max(table.scrollWidth, table.getBoundingClientRect().width);
          const fitScale = Math.max(0.9, Math.min(1, availableWidth / Math.max(1, naturalWidth)));
          tableContainer.style.zoom = String(scale * fitScale);
        });
      }

      async function downloadDirectPdf() {
        btnDownloadPdf.disabled = true;
        btnDownloadPdf.innerText = 'جارٍ إنشاء PDF...';
        try {
          await window.downloadReportFromPreview({
            pageSize: selPageSize.value,
            orientation: selOrientation.value,
            marginMm: parseFloat(selMargin.value)
          });
        } catch (err) {
          console.error(err);
          alert('تعذر تنزيل PDF؛ يمكنك استخدام خيار الحفظ كـ PDF من نافذة الطباعة');
        } finally {
          btnDownloadPdf.disabled = false;
          btnDownloadPdf.innerText = '📥 تنزيل PDF';
        }
      }

      selOrientation.addEventListener('change', updatePageSettings);
      selPageSize.addEventListener('change', updatePageSettings);
      selMargin.addEventListener('change', updatePageSettings);
      selScale.addEventListener('change', updatePageSettings);

      btnPrint.addEventListener('click', printOnce);
      btnDownloadPdf.addEventListener('click', downloadDirectPdf);
      btnClose.addEventListener('click', function() { window.close(); });

      window.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
          e.preventDefault();
          printOnce();
        } else if (e.key === 'Escape') {
          window.close();
        }
      });
      updatePageSettings();
    })();
  </script>
</body>
</html>`;

  (newWin as any).downloadReportFromPreview = async (settings: any) => {
    const paper = newWin.document.getElementById("paperContainer");
    if (!paper) throw new Error("تعذر تحديد الورقة");
    await downloadRenderedReportPdf(paper, { ...settings, fileName: `${title.replace(/[\\/:*?"<>|]/g, "-")}.pdf` });
  };
  newWin.document.open();
  newWin.document.write(html);
  newWin.document.close();
  return true;
}