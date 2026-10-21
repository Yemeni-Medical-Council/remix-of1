import { saveBlobToInternalStorage } from './nativeFileStorage';
import { escapeHtml, reportLetterheadHtml } from './printTableHtml';

export type ReportPaperSize = 'A4' | 'A3' | 'Letter';
export type ReportOrientation = 'portrait' | 'landscape';

export const reportDocumentCss = `
  :root { 
  --report-paper: #ffffff; --report-ink: #172b35; --report-muted: #526773;
    --report-rule:#000; --report-stripe: gold;
    --report-total: #776807; --report-accent: #176b74; }
  * { box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  body { margin:0; padding:0; direction:rtl; background:var(--report-paper);
    color:#000; 
font-family: Cairo !important; font-size: 16px; 
line-height: 1.5; 
font-weight: 1000;
    width: 100% !important;
 height: auto !important;

  }
  h1,h2 { text-align:center; color:#000; font-size:22px; margin:0 0 6px; }
  .sub,.meta { text-align:center; color:#000; font-size:20px; margin-bottom:10px; }
  table {
width:100%; 
    max-width: auto;
border-collapse:collapse; table-layout:auto; text-align:center; 
 font-weight: 1000;
  }
  th,td { padding:5px 6px; text-align:center; vertical-align:middle; }
  thead th { 
  background: gold; 
color:#000; 
font-weight:800;
}
  tbody tr:nth-child(even) td { background: #ffffff; }
  .total-row td { background:var(--report-total); font-weight:800; border-top:2px solid var(--report-accent);
  color:#fff; 
  }
  .doc-title-cell { border:0; background:var(--report-paper); padding:0 0 8px; }
  .report-letterhead-block { width:100%; height:26mm; margin:0 0 3mm; }
  .report-letterhead-image { display:flex; width:100%; min-height:auto; object-fit:fill; }
  .num,.numeric-cell,.date-cell,.idx { direction:ltr; unicode-bidi:isolate; font-variant-numeric:tabular-nums; }
`;

export const reportContainmentCss = `
  .report-page-content { 
  width:100%; 
  max-width: auto; 
  }
.report-page-content th,.report-page-content td {
min-width:auto !important; padding:5px 6px !important;
    margin:0 !important;
  text-align:center !important;
vertical-align:middle !important; 
white-space: nowrap !important;
overflow-wrap: normal !important;
word-break: break-word !important; 
font-family: Cairo !important;
    font-size: 18px !important;
    font-weight:700 !important;
  line-height:1.4 !important;
  }
  .report-page-content thead th { 
  font-size: 16px !important; padding:6px 5px !important; font-weight:800 !important; }
  .report-page-content table {
  width: 100% !important; 
  max-width: auto !important;
table-layout: auto !important; }
  .report-page-content tbody td:not(.desc-cell):not(.details-cell):not(.description-cell):not([data-col-key="description"]),
  .report-page-content tbody td:not(.desc-cell):not(.details-cell):not(.description-cell):not([data-col-key="description"]) .pdf-cell-text {
white-space: normal !important;
word-break: keep-all !important;
overflow-wrap: normal !important;
  }
  .report-page-content tbody td.desc-cell,
  .report-page-content tbody td.details-cell,
  .report-page-content tbody td.description-cell,
  .report-page-content tbody td[data-col-key="description"],
  .report-page-content tbody td.desc-cell .pdf-cell-text,
  .report-page-content tbody td.details-cell .pdf-cell-text,
  .report-page-content tbody td.description-cell .pdf-cell-text,
  .report-page-content tbody td[data-col-key="description"] .pdf-cell-text {
white-space: normal !important;
word-break: normal !important;
overflow-wrap: anywhere !important;
min-width: 400px !important; 
text-align:center !important;
  }
  .report-page-content .num,.report-page-content .numeric-cell,.report-page-content .date-cell,
  .report-page-content .idx,.report-page-content .cell-number { 
  direction:ltr !important; unicode-bidi:isolate;
white-space:nowrap !important; overflow-wrap:normal !important; 
word-break:keep-all !important; }
  .report-page-content .pdf-cell-text {
white-space: normal !important; font-family: Cairo !important;
font-size:14px !important;
  text-align:center !important
vertical-align:middle !important;
    width: 100%  !important;
min-width: auto  !important;
  }
  .report-page-content thead { display:table-header-group; }
  .report-page-content tr { break-inside:avoid; }
  .report-page-content .report-letterhead-cell { background:var(--report-paper) !important; border:solid 1px #000 !important; }
  .report-page-content .report-letterhead-cell img { width: 100%; max-height:auto; object-fit:fill; }
`;

const dimensions = (size: ReportPaperSize, orientation: ReportOrientation) => {
  const [short, long] = size === 'A3' ? [297, 420] : size === 'Letter' ? [215.9, 279.4] : [210, 297];
  return orientation === 'portrait' ? [long, short] : [short, long];
};

async function ready(doc: Document) {
  const fontReady = doc.fonts?.ready ?? Promise.resolve();
  await Promise.race([
    fontReady,
    new Promise < void > ((resolve) => window.setTimeout(resolve, 1500)),
  ]);
  await Promise.all(Array.from(doc.images).map(image => {
    if (image.complete) return Promise.resolve();
    return image.decode().catch(() => undefined);
  }));
}

export async function downloadRenderedReportPdf(source: HTMLElement, options: {
  fileName: string;pageSize ? : ReportPaperSize;orientation ? : ReportOrientation;marginMm ? : number;
}) {
  const { fileName, pageSize = 'A4', orientation = 'portrait', marginMm = 4 } = options;
  const doc = source.ownerDocument;
  await ready(doc);
  const [{ default: html2canvas }, { default: JsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
  const [widthMm, heightMm] = dimensions(pageSize, orientation);
  const pxPerMm = 96 / 25.4;
  const holder = doc.createElement('div');
  holder.style.cssText = 'position:absolute;left:-20000px;top:0;pointer-events:none;';
  const paper = doc.createElement('div');
  paper.style.cssText = `width:${widthMm}cm;min-height:${heightMm}cm;padding:${marginMm}cm;box-sizing:border-box;background:var(--report-paper,#fff);display:flex;flex-direction:column;`;
  const content = source.cloneNode(true) as HTMLElement;
  content.classList.add('report-page-content');
  content.style.cssText = 'width:100%;max-height:auto;height:100%;padding:0;margin:0;border:0;box-shadow:none;transform:none;';
  const footer = doc.createElement('div');
  footer.style.cssText = 'margin-top:10px;padding-top:10px;text-align:center;font-size:22px;color:#000;direction:rtl;background:31f5ff;';
  paper.append(content, footer);
  holder.append(paper);
  doc.body.append(holder);
  
  try {
    const table = Array.from(content.querySelectorAll('table')).sort((a, b) => b.rows.length - a.rows.length)[0];
    const body = table?.tBodies[0];
    
    // استخراج الصفوف الظاهرة فقط (استبعاد المخفية بسبب فلترة التاريخ)
    const allRows = body ? Array.from(body.rows).filter(r => (r as HTMLElement).style.display !== 'none') : [];
    const totalRow = allRows.find(r => r.classList.contains('total-row'));
    const rows = allRows.filter(r => !r.classList.contains('total-row')).map(r => r.cloneNode(true) as HTMLTableRowElement);
    
    if (body) body.replaceChildren();
    
    const maxHeight = (heightMm - marginMm * 2) * pxPerMm - 35;
    const fitWidth = () => {
      content.style.zoom = '1';
      const available = (widthMm - marginMm * 2) * pxPerMm;
      if (content.scrollWidth > available + 1) {
        content.style.zoom = String(Math.max(0.88, available / content.scrollWidth));
      }
    };
    
    const overflows = () => {
      const h = content.offsetHeight || content.getBoundingClientRect().height;
      return h > maxHeight;
    };
    
    const groups: HTMLTableRowElement[][] = [];
    let group: HTMLTableRowElement[] = [];
    
    if (rows.length === 0) {
      groups.push([]);
    } else {
      for (const row of rows) {
        body?.append(row);
        fitWidth();
        if (overflows() && group.length > 0) {
          row.remove();
          groups.push(group);
          group = [];
          body?.replaceChildren(row);
          fitWidth();
        }
        group.push(row);
      }
      if (group.length > 0) {
        groups.push(group);
      }
    }
    
    const pdf = new JsPDF({ unit: 'cm', format: pageSize.toLowerCase(), orientation, compress: true });
    pdf.setProperties({ title: fileName.replace(/\.pdf$/i, ''), subject: 'تقرير مالي', creator: 'المجلس اليمني للاختصاصات الطبية' });
    
    for (let index = 0; index < groups.length; index++) {
      const currentRows = [...groups[index]];
      // إدراج صف الإجمالي في الصفحة الأخيرة قبل صفوف الملخص (إن وُجدت)
      if (index === groups.length - 1 && totalRow) {
        const clonedTotal = totalRow.cloneNode(true) as HTMLTableRowElement;
        const firstSummaryIdx = currentRows.findIndex((r) => r.classList.contains("summary-card-row"));
        if (firstSummaryIdx === -1) {
          currentRows.push(clonedTotal);
        } else {
          currentRows.splice(firstSummaryIdx, 0, clonedTotal);
        }
      }
      if (body) body.replaceChildren(...currentRows);
      fitWidth();
      footer.textContent = `صفحة ${index + 1} من ${groups.length}`;
      
      const canvas = await html2canvas(paper, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: Math.ceil(widthMm * pxPerMm),
        scrollX: 0,
        scrollY: 0,
      });
      if (!canvas.width || !canvas.height) throw new Error('تعذر تجهيز صورة التقرير');
      if (index > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, widthMm, heightMm, undefined, 'FAST');
    }
    
    const blob = pdf.output('blob');
    try {
      await saveBlobToInternalStorage(blob, fileName);
    } catch (error) {
      console.warn('[PDF] Internal storage save failed; using browser download', error);
    }
    const downloadName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = downloadName;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body.append(anchor);
    try {
      anchor.click();
    } catch (error) {
      console.warn('[PDF] Anchor download failed; opening the generated file', error);
      const opened = window.open(url, '_blank');
      if (!opened) throw new Error('تعذر فتح ملف PDF الناتج');
    } finally {
      anchor.remove();
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  } finally {
    holder.remove();
  }
}

export async function downloadReportPdf(options: {
  title: string;body: string;css ? : string;fileName: string;
  pageSize ? : ReportPaperSize;orientation ? : ReportOrientation;marginMm ? : number;
}) {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;left:-20000px;top:20000px;width:2800px;height:2800px;border:0;pointer-events:none;font-family:Cairo';
  document.body.append(frame);
  try {
    const doc = frame.contentDocument;
    if (!doc) throw new Error('تعذر تجهيز التقرير');
    doc.open();
    doc.write(`<!doctype html><html lang=\"ar\" dir=\"rtl\"><head><meta charset=\"utf-8\"><title>${escapeHtml(options.title)}</title>
      <style>${reportDocumentCss}
      ${options.css || ''}
      ${reportContainmentCss}</style></head><body><div id="report-source" class="report-page-content">
      ${options.body.includes('report-letterhead') ? '' : reportLetterheadHtml()}${options.body}</div></body></html>`);
    doc.close();
    const source = doc.getElementById('report-source');
    if (!source) throw new Error('تعذر تحديد محتوى التقرير');
    await new Promise < void > ((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve())));
    await downloadRenderedReportPdf(source, options);
  } finally {
    frame.remove();
  }
}

export async function downloadReportDocumentPdf(html: string, title: string, orientation: ReportOrientation = 'portrait') {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  parsed.querySelectorAll('script').forEach(script => script.remove());
  const css = Array.from(parsed.querySelectorAll('style')).map(style => style.textContent || '').join('\n');
  await downloadReportPdf({
    title,
    body: parsed.body.innerHTML,
    css,
    orientation,
    fileName: `${title.replace(/[\\/:*?"<>|]/g, '-')}.pdf`
  });
}