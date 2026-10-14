import React, { useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { useReportDate } from "@/lib/reportDate";
import { buildMonthlyStatementRows, exportMonthlyStatement, normName, parseJournalDateForReport } from "@/lib/exportImport";
import monthlySchema from "@/data/monthlyStatement.json";
import { toast } from "sonner";
import { Printer } from "lucide-react";
import { openBrowserPrintPreview } from "@/lib/browserPrintPreview";
import ImportButton from "./ImportButton";
import {
  getPeriodRange,
  getReportMovementLabel,
  getReportPeriodLabel,
  type ReportPeriodMode,
} from "@/lib/reportPeriods";
import {
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  Sparkles,
  Layers,
  TrendingUp,
} from "lucide-react";

type StatementGroup = { title: string; accounts: string[] };
const GROUPS: StatementGroup[] = (monthlySchema as any).groups;
const ALL_ACCOUNTS = GROUPS.flatMap((g) => g.accounts);

const MONTHS_NAMES = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

// ── تنظيف وتوحيد النصوص العربية وتجاوز كافة الفوارق الإملائية ─────────────────
export const cleanArabic = (s: string) => {
  return String(s || "")
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "") // التشكيل والتطويل
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ء/g, "")
    .replace(/\u062D\s*[\/\\]\s*/g, "حساب ") // ح/ -> حساب
    .replace(/[()[\]./\\،,:\-_+]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

// استخراج جوهر اسم الحساب بحذف كلمة (حساب / حسابات / ح)
export const coreAccountName = (s: string) => {
  return cleanArabic(s)
    .replace(/^(حساب|حسابات|ح)\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
};

// ── قاموس المرادفات الموسع للأبواب والحسابات الشائعة ─────────────────────────
const EXACT_ALIASES: Record<string, string> = {
  // ── الباب الأول والباب الثاني (الاستخدامات) ──
  [cleanArabic("الباب الاول")]: "الاستخدامات",
  [cleanArabic("الباب الأول")]: "الاستخدامات",
  [cleanArabic("باب اول")]: "الاستخدامات",
  [cleanArabic("باب أول")]: "الاستخدامات",
  [cleanArabic("الباب 1")]: "الاستخدامات",
  [cleanArabic("باب 1")]: "الاستخدامات",
  [cleanArabic("الباب1")]: "الاستخدامات",
  [cleanArabic("الأجور والمرتبات")]: "الاستخدامات",
  [cleanArabic("الاجور والمرتبات")]: "الاستخدامات",
  [cleanArabic("اجور ومرتبات")]: "الاستخدامات",
  [cleanArabic("مرتبات واجور")]: "الاستخدامات",
  [cleanArabic("نفقات الباب الاول")]: "الاستخدامات",
  [cleanArabic("استخدامات الباب الاول")]: "الاستخدامات",
  [cleanArabic("الاستخدامات - الباب الاول")]: "الاستخدامات",

  [cleanArabic("الباب الثاني")]: "الاستخدامات",
  [cleanArabic("باب ثاني")]: "الاستخدامات",
  [cleanArabic("الباب 2")]: "الاستخدامات",
  [cleanArabic("باب 2")]: "الاستخدامات",
  [cleanArabic("الباب2")]: "الاستخدامات",
  [cleanArabic("النفقات التشغيلية")]: "الاستخدامات",
  [cleanArabic("نفقات تشغيلية")]: "الاستخدامات",
  [cleanArabic("نفقات التشغيل")]: "الاستخدامات",
  [cleanArabic("مصاريف تشغيلية")]: "الاستخدامات",
  [cleanArabic("نفقات الباب الثاني")]: "الاستخدامات",
  [cleanArabic("استخدامات الباب الثاني")]: "الاستخدامات",
  [cleanArabic("الاستخدامات - الباب الثاني")]: "الاستخدامات",

  [cleanArabic("الباب الاول والثاني")]: "الاستخدامات",
  [cleanArabic("الباب الأول والثاني")]: "الاستخدامات",
  [cleanArabic("الباب الاول والباب الثاني")]: "الاستخدامات",

  // ── الباب الثالث (الموارد) ──
  [cleanArabic("الباب الثالث")]: "الموارد",
  [cleanArabic("باب ثالث")]: "الموارد",
  [cleanArabic("الباب 3")]: "الموارد",
  [cleanArabic("باب 3")]: "الموارد",
  [cleanArabic("الباب3")]: "الموارد",
  [cleanArabic("الدعم والموارد")]: "الموارد",
  [cleanArabic("دعم وموارد")]: "الموارد",
  [cleanArabic("الموارد")]: "الموارد",
  [cleanArabic("موارد الباب الثالث")]: "الموارد",
  [cleanArabic("الايرادات")]: "الموارد",
  [cleanArabic("الإيرادات")]: "الموارد",

  // ── الباب الرابع (اكتساب الأصول غير المالية) ──
  [cleanArabic("الباب الرابع")]: "حساب اكتساب الأصول غير المالية",
  [cleanArabic("باب رابع")]: "حساب اكتساب الأصول غير المالية",
  [cleanArabic("الباب 4")]: "حساب اكتساب الأصول غير المالية",
  [cleanArabic("باب 4")]: "حساب اكتساب الأصول غير المالية",
  [cleanArabic("الباب4")]: "حساب اكتساب الأصول غير المالية",
  [cleanArabic("اكتساب الأصول غير المالية")]: "حساب اكتساب الأصول غير المالية",
  [cleanArabic("اكتساب الاصول غير الماليه")]: "حساب اكتساب الأصول غير المالية",
  [cleanArabic("شراء أصول")]: "حساب اكتساب الأصول غير المالية",
  [cleanArabic("شراء اصول")]: "حساب اكتساب الأصول غير المالية",
  [cleanArabic("الاصول غير المالية")]: "حساب اكتساب الأصول غير المالية",

  // ── النقدية والبنوك والحسابات الوسيطة ──
  [cleanArabic("النقدية")]: "حساب النقدية",
  [cleanArabic("نقدية")]: "حساب النقدية",
  [cleanArabic("نقدية بالصندوق")]: "حساب النقدية",
  [cleanArabic("صندوق المركز")]: "حساب النقدية",
  [cleanArabic("الصندوق")]: "حساب النقدية",
  [cleanArabic("صندوق")]: "حساب النقدية",

  [cleanArabic("البنك موارد")]: "حساب البنك موارد",
  [cleanArabic("بنك موارد")]: "حساب البنك موارد",
  [cleanArabic("البنك موارد محلية")]: "حساب البنك موارد محلية",
  [cleanArabic("بنك موارد محلية")]: "حساب البنك موارد محلية",
  [cleanArabic("البنك استخدامات")]: "حساب البنك استخدامات",
  [cleanArabic("بنك استخدامات")]: "حساب البنك استخدامات",
  [cleanArabic("البنك نفقات تشغيلية محلية")]: "حساب البنك نفقات تشغيلية محلية",
  [cleanArabic("بنك نفقات تشغيلية")]: "حساب البنك نفقات تشغيلية محلية",
  [cleanArabic("البنك اكتساب اصول غير مالية محلية")]: "حساب البنك اكتساب أصول غير مالية محلية",
  [cleanArabic("البنك موارد عامة مشتركة")]: "حساب البنك موارد عامة مشتركة",
  [cleanArabic("البنك موارد مشتركة")]: "حساب البنك موارد مشتركة",
  [cleanArabic("البنك حسابات جارية")]: "حساب البنك حسابات جارية",
  [cleanArabic("البنك مساهمات ذاتية")]: "حساب البنك مساهمات ذاتية",
  [cleanArabic("البنك امانات")]: "حساب البنك أمانات",

  [cleanArabic("السلف المؤقتة")]: "حساب السلف المؤقتة",
  [cleanArabic("سلف مؤقتة")]: "حساب السلف المؤقتة",
  [cleanArabic("سلف الحسابات الجارية")]: "حساب سلف الحسابات الجارية",
  [cleanArabic("السلف على الأجور")]: "حساب السلف على الأجور",
  [cleanArabic("سلف الأجور")]: "حساب السلف على الأجور",
  [cleanArabic("المدينين مالية")]: "حساب المدينين (مالية)",
  [cleanArabic("مدينين مالية")]: "حساب المدينين (مالية)",
  [cleanArabic("الدائنين مالية")]: "حساب الدائنين (مالية)",
  [cleanArabic("دائنين مالية")]: "حساب الدائنين (مالية)",
  [cleanArabic("التأمينات المتنوعة")]: "حساب التأمينات المتنوعة",
  [cleanArabic("تامينات متنوعة")]: "حساب التأمينات المتنوعة",
  [cleanArabic("مرتجع الأجور")]: "حساب مرتجع الأجور",
  [cleanArabic("مرتجع اجور")]: "حساب مرتجع الأجور",
  [cleanArabic("تسوية المنصرف بالزيادة")]: "حساب تسوية المنصرف بالزيادة",
  [cleanArabic("المبالغ الدائنة تحت التسوية")]: "حساب المبالغ الدائنة تحت التسوية",
  [cleanArabic("مبالغ دائنة تحت التسوية")]: "حساب المبالغ الدائنة تحت التسوية",
  [cleanArabic("دائنة تحت التسوية")]: "حساب المبالغ الدائنة تحت التسوية",
  [cleanArabic("الامانات المتنوعة")]: "حساب الأمانات المتنوعة",
  [cleanArabic("أمانات متنوعة")]: "حساب الأمانات المتنوعة",
  [cleanArabic("امانات متنوعة")]: "حساب الأمانات المتنوعة",
  [cleanArabic("أمانات")]: "حساب الأمانات المتنوعة",
  [cleanArabic("امانات")]: "حساب الأمانات المتنوعة",
};

// ── مطابقة ذكية فائقة المرونة لأسماء الحسابات ──────────────────────────────
export const matchToSchemaAccount = (rawName: string): string | null => {
  if (!rawName) return null;
  const cleaned = cleanArabic(rawName);

  if (EXACT_ALIASES[cleaned]) return EXACT_ALIASES[cleaned];

  const exactMatch = ALL_ACCOUNTS.find((acc) => cleanArabic(acc) === cleaned);
  if (exactMatch) return exactMatch;

  const rawCore = coreAccountName(rawName);
  const coreMatch = ALL_ACCOUNTS.find((acc) => coreAccountName(acc) === rawCore);
  if (coreMatch) return coreMatch;

  const foundSubstring = ALL_ACCOUNTS.find((acc) => {
    const accCore = coreAccountName(acc);
    return (
      (rawCore.length >= 3 && accCore.includes(rawCore)) ||
      (accCore.length >= 3 && rawCore.includes(accCore))
    );
  });
  if (foundSubstring) return foundSubstring;

  const rawWords = rawCore.split(" ").filter((w) => w.length > 2);
  let bestAccount: string | null = null;
  let maxMatchedWords = 0;

  for (const acc of ALL_ACCOUNTS) {
    const accWords = coreAccountName(acc).split(" ");
    const matchedCount = rawWords.filter((rw) => accWords.some((aw) => aw.includes(rw) || rw.includes(aw))).length;
    if (matchedCount > maxMatchedWords) {
      maxMatchedWords = matchedCount;
      bestAccount = acc;
    }
  }

  if (maxMatchedWords >= 2 || (maxMatchedWords === 1 && rawWords.length === 1)) {
    return bestAccount;
  }

  return null;
};

export default function MonthlyStatementTab() {
  const { journal } = useStore();
  const { reportDate } = useReportDate();
  const tableRef = useRef<HTMLTableElement>(null);

  const [periodMode, setPeriodMode] = useState<ReportPeriodMode>("monthly");
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const d = new Date(reportDate);
    return isNaN(d.getTime()) ? 1 : d.getMonth() + 1;
  });
  const [selectedQuarter, setSelectedQuarter] = useState<number>(() => {
    const d = new Date(reportDate);
    return isNaN(d.getTime()) ? 1 : Math.floor(d.getMonth() / 3) + 1;
  });

  const parsedDate = new Date(reportDate);
  const year = isNaN(parsedDate.getTime()) ? new Date().getFullYear() : parsedDate.getFullYear();

  const periodRange = useMemo(
    () => getPeriodRange(periodMode, selectedMonth, selectedQuarter),
    [periodMode, selectedMonth, selectedQuarter]
  );
  const periodLabel = useMemo(
    () => getReportPeriodLabel(periodMode, selectedMonth, selectedQuarter, year),
    [periodMode, selectedMonth, selectedQuarter, year]
  );
  const movementLabel = useMemo(
    () => getReportMovementLabel(periodMode, selectedMonth, selectedQuarter),
    [periodMode, selectedMonth, selectedQuarter]
  );

  const statementRows = useMemo(() => {
    return buildMonthlyStatementRows(journal, year, periodRange.fromMonth, periodRange.toMonth);
  }, [journal, year, periodRange.fromMonth, periodRange.toMonth]);

  const { rowsByAccount, totals, matchedEntriesCount } = useMemo(() => {
    const map: Record<string, any> = {};
    for (const r of statementRows) {
      map[normName(r.accountName)] = r;
    }
    const t = statementRows.reduce(
      (acc, r) => ({
        prevDebit: acc.prevDebit + (r.prevDebit || 0),
        prevCredit: acc.prevCredit + (r.prevCredit || 0),
        curDebit: acc.curDebit + (r.curDebit || 0),
        curCredit: acc.curCredit + (r.curCredit || 0),
      }),
      { prevDebit: 0, prevCredit: 0, curDebit: 0, curCredit: 0 }
    );
    const active = new Set<number>();
    journal.forEach((entry) => {
      const parsed = parseJournalDateForReport(entry.date);
      if (parsed?.year === year) active.add(parsed.month);
    });
    const matched = Object.values(map).filter((row: any) =>
      Boolean(row.prevDebit || row.prevCredit || row.curDebit || row.curCredit)
    ).length;

    return { rowsByAccount: map, totals: t, matchedEntriesCount: matched };
  }, [statementRows, journal, year]);

  const handlePrint = async () => {
    const node = tableRef.current;
    if (!node) return;
    const opened = await openBrowserPrintPreview({
      title: `كشف الحساب الشهري - ${periodLabel}`,
      subtitle: "المجلس اليمني للاختصاصات الطبية - النظام المالي",
      bodyHtml: node.outerHTML,
      defaultOrientation: "landscape",
      defaultPageSize: "A4",
      defaultMarginMm: 3,
      contentCss: `
        table { width:100% !important; border-collapse:collapse !important; table-layout:auto !important; background:#fff; }
        th,td { border:1px solid #000 !important; padding:4px 5px !important; text-align:center !important; vertical-align:middle !important; color:#000 !important; font-family:Cairo,Arial,sans-serif !important; font-weight:700 !important; white-space:normal !important; }
        th { background:#dbeafe !important; font-weight:900 !important; }
        tbody tr:nth-child(even) td { background:#f8fafc !important; }
        tbody tr td:first-child { text-align:right !important; font-weight:800 !important; }
        tfoot td { background:#1e3a8a !important; color:#fff !important; font-weight:900 !important; }
      `,
    });
    if (!opened) toast.error("تم منع فتح نافذة الطباعة، يرجى السماح بالنوافذ المنبثقة");
  };

  return (
    <div
      className="w-full space-y-6 p-2 sm:p-5 min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/50 to-indigo-50/40 text-slate-800"
      dir="rtl"
    >
      {/* ══ الترويسة الرئيسية والبطاقات بتصميم فاتح ناصع ══ */}
      <div className="rounded-3xl border border-sky-200/70 bg-white/90 p-4 sm:p-6 shadow-xl shadow-sky-100/60 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25">
              <FileSpreadsheet className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black bg-gradient-to-r from-sky-700 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  كشف الحساب الشهري
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-sky-700 border border-sky-200">
                  <Sparkles className="h-3 w-3 text-sky-500" /> ترحيل فوري
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ترحيل ذكي لكافة القيود اليومية حسب الأبواب والحسابات تلقائياً
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ImportButton kind="monthly" />
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-100 to-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all"
              title="طباعة كشف الحساب الشهري"
            >
              <Printer className="h-4 w-4" /> طباعة
            </button>
            <button
              type="button"
              onClick={() => void exportMonthlyStatement(journal, year, reportDate)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-100 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all"
              title="تصدير إلى Excel"
            >
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </button>
          </div>
        </div>

        {/* ══ مؤشرات الحالة اللحظية (KPI Cards الفاتحة الناعمة) ══ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {/* قيود مرحلة */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white p-3.5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-xs text-emerald-800 mb-1.5 font-bold">
              <span>قيود مرحّلة</span>
              <div className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-800 tracking-tight font-mono">
              {matchedEntriesCount}
            </div>
            <span className="text-[10px] text-emerald-600 font-medium mt-1 block">حسابات بها حركة في الفترة</span>
          </div>

          {/* مدين الفترة */}
          <div className="relative overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-blue-50/40 to-white p-3.5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-xs text-sky-800 mb-1.5 font-bold">
              <span>مدين الفترة</span>
              <div className="p-1.5 rounded-xl bg-sky-500/15 text-sky-600">
                <ArrowDownLeft className="h-4 w-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-sky-800 tracking-tight font-mono">
              {totals.curDebit.toLocaleString()}
            </div>
            <span className="text-[10px] text-sky-600 font-medium mt-1 block">إجمالي حركة الجانب المدين</span>
          </div>

          {/* دائن الفترة */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50/40 to-white p-3.5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-xs text-amber-800 mb-1.5 font-bold">
              <span>دائن الفترة</span>
              <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-600">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-800 tracking-tight font-mono">
              {totals.curCredit.toLocaleString()}
            </div>
            <span className="text-[10px] text-amber-600 font-medium mt-1 block">إجمالي حركة الجانب الدائن</span>
          </div>

          {/* التوازن المحاسبي */}
          <div className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-blue-50/40 to-white p-3.5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-xs text-indigo-800 mb-1.5 font-bold">
              <span>التوازن المحاسبي</span>
              <div className="p-1.5 rounded-xl bg-indigo-500/15 text-indigo-600">
                <Scale className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-base sm:text-lg font-black text-indigo-900 mt-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {totals.curDebit === totals.curCredit ? "متزن تماماً" : "فرق توقيت/قيود"}
            </div>
            <span className="text-[10px] text-indigo-600 font-medium mt-1 block font-mono">
              الفرق: {Math.abs(totals.curDebit - totals.curCredit).toLocaleString()}
            </span>
          </div>
        </div>

        {/* ══ شريط خيارات الفترة المالية ══ */}
        <div className="flex flex-wrap items-center gap-3 pt-4 mt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-sky-600" />
            <span className="text-xs font-bold text-slate-700">نوع الفترة:</span>
          </div>

          <div className="inline-flex rounded-xl border border-sky-200 bg-sky-50/50 p-1 text-xs">
            <button
              type="button"
              onClick={() => setPeriodMode("monthly")}
              className={`rounded-lg px-3 py-1 font-bold transition-all ${
                periodMode === "monthly"
                  ? "bg-white text-sky-700 shadow-sm"
                  : "text-slate-600 hover:text-sky-700"
              }`}
            >
              شهري
            </button>
            <button
              type="button"
              onClick={() => setPeriodMode("quarterly")}
              className={`rounded-lg px-3 py-1 font-bold transition-all ${
                periodMode === "quarterly"
                  ? "bg-white text-sky-700 shadow-sm"
                  : "text-slate-600 hover:text-sky-700"
              }`}
            >
              ربعي
            </button>
            <button
              type="button"
              onClick={() => setPeriodMode("yearly")}
              className={`rounded-lg px-3 py-1 font-bold transition-all ${
                periodMode === "yearly"
                  ? "bg-white text-sky-700 shadow-sm"
                  : "text-slate-600 hover:text-sky-700"
              }`}
            >
              سنوي
            </button>
          </div>

          {periodMode === "monthly" && (
            <div className="flex items-center gap-2">
              <label htmlFor="month-select" className="text-xs font-bold text-slate-600">
                الشهر:
              </label>
              <select
                id="month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="rounded-xl border border-sky-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none"
              >
                {MONTHS_NAMES.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {periodMode === "quarterly" && (
            <div className="flex items-center gap-2">
              <label htmlFor="quarter-select" className="text-xs font-bold text-slate-600">
                الربع:
              </label>
              <select
                id="quarter-select"
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                className="rounded-xl border border-sky-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none"
              >
                <option value={1}>الربع الأول (يناير - مارس)</option>
                <option value={2}>الربع الثاني (أبريل - يونيو)</option>
                <option value={3}>الربع الثالث (يوليو - سبتمبر)</option>
                <option value={4}>الربع الرابع (أكتوبر - ديسمبر)</option>
              </select>
            </div>
          )}

          <div className="mr-auto flex items-center gap-2">
            <span className="text-xs font-black text-sky-900 bg-sky-100/60 px-3 py-1 rounded-xl border border-sky-200/80">
              {periodLabel}
            </span>
          </div>
        </div>
      </div>

      {/* ══ جدول كشف الحساب الشهري ══ */}
      <div className="overflow-x-auto rounded-3xl border border-sky-200 bg-white shadow-xl shadow-sky-100/40">
        <table ref={tableRef} className="w-full border-collapse text-center text-xs">
          <thead>
            {/* الصف الأول من الهيدر */}
            <tr className="border-b border-sky-200 bg-gradient-to-r from-sky-50 via-indigo-50/50 to-sky-50 text-slate-700 font-bold">
              <th rowSpan={2} className="p-3 border-l border-sky-200 text-right pr-4 min-w-[200px] text-sky-950 font-black">
                الأبواب والحسابات
              </th>
              <th colSpan={2} className="p-2 border-l border-slate-200 bg-slate-100/70 font-bold text-slate-800">
                الأشهر السابقة
              </th>
              <th colSpan={2} className="p-2 border-l border-slate-200 bg-sky-100/70 font-bold text-sky-900">
                حركة {movementLabel}
              </th>
              <th colSpan={2} className="p-2 border-l border-slate-200 bg-indigo-100/70 font-bold text-indigo-900">
                إجمالي حركة الفترة
              </th>
              <th colSpan={2} className="p-2 bg-emerald-100/70 font-bold text-emerald-900">
                الرصيد في نهاية {movementLabel}
              </th>
            </tr>
            {/* الصف الثاني من الهيدر */}
            <tr className="border-b border-sky-200 bg-slate-50/90 text-slate-600 font-bold text-[11px]">
              <th className="p-2 border-l border-slate-200">مدين</th>
              <th className="p-2 border-l border-slate-200">دائن</th>
              <th className="p-2 border-l border-slate-200 text-sky-900 bg-sky-50/40">مدين</th>
              <th className="p-2 border-l border-slate-200 text-sky-900 bg-sky-50/40">دائن</th>
              <th className="p-2 border-l border-slate-200 text-indigo-900 bg-indigo-50/40">مدين</th>
              <th className="p-2 border-l border-slate-200 text-indigo-900 bg-indigo-50/40">دائن</th>
              <th className="p-2 border-l border-slate-200 text-emerald-900 bg-emerald-50/40">مدين</th>
              <th className="p-2 text-emerald-900 bg-emerald-50/40">دائن</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {GROUPS.map((group, gIdx) => {
              let gPrevD = 0, gPrevC = 0, gCurD = 0, gCurC = 0;

              return (
                <React.Fragment key={gIdx}>
                  {/* شريط عنوان المجموعة / الباب الرئيسي */}
                  <tr className="bg-gradient-to-r from-sky-100/80 via-blue-50 to-indigo-50 font-black text-sky-950 border-t-2 border-sky-200">
                    <td colSpan={9} className="text-right px-4 py-2.5 text-xs sm:text-sm font-black flex items-center gap-2">
                      <Layers className="h-4 w-4 text-sky-700 inline" />
                      <span>{group.title}</span>
                    </td>
                  </tr>

                  {/* حسابات المجموعة */}
                  {group.accounts.map((accName, aIdx) => {
                    const row = rowsByAccount[normName(accName)] || {
                      prevDebit: 0,
                      prevCredit: 0,
                      curDebit: 0,
                      curCredit: 0,
                    };

                    const prevD = row.prevDebit || 0;
                    const prevC = row.prevCredit || 0;
                    const curD = row.curDebit || 0;
                    const curC = row.curCredit || 0;

                    gPrevD += prevD;
                    gPrevC += prevC;
                    gCurD += curD;
                    gCurC += curC;

                    const totD = prevD + curD;
                    const totC = prevC + curC;
                    const balD = Math.max(0, totD - totC);
                    const balC = Math.max(0, totC - totD);
                    const hasMovement = Boolean(prevD || prevC || curD || curC);

                    return (
                      <tr
                        key={aIdx}
                        className={`hover:bg-sky-50/40 transition-colors ${
                          hasMovement ? "bg-white font-medium" : "bg-slate-50/30 text-slate-400"
                        }`}
                      >
                        <td className="px-3 py-2 text-right pr-6 border-l border-slate-100 text-slate-800 font-bold">
                          {accName}
                        </td>
                        <td className="px-2 py-2 border-l border-slate-100 font-mono">
                          {prevD ? prevD.toLocaleString() : "-"}
                        </td>
                        <td className="px-2 py-2 border-l border-slate-100 font-mono">
                          {prevC ? prevC.toLocaleString() : "-"}
                        </td>
                        <td className="px-2 py-2 border-l border-slate-100 font-mono font-bold text-sky-700 bg-sky-50/20">
                          {curD ? curD.toLocaleString() : "-"}
                        </td>
                        <td className="px-2 py-2 border-l border-slate-100 font-mono font-bold text-sky-700 bg-sky-50/20">
                          {curC ? curC.toLocaleString() : "-"}
                        </td>
                        <td className="px-2 py-2 border-l border-slate-100 font-mono text-slate-700">
                          {totD ? totD.toLocaleString() : "-"}
                        </td>
                        <td className="px-2 py-2 border-l border-slate-100 font-mono text-slate-700">
                          {totC ? totC.toLocaleString() : "-"}
                        </td>
                        <td className="px-2 py-2 border-l border-slate-100 font-mono font-bold text-emerald-700">
                          {balD ? balD.toLocaleString() : "-"}
                        </td>
                        <td className="px-2 py-2 font-mono font-bold text-emerald-700">
                          {balC ? balC.toLocaleString() : "-"}
                        </td>
                      </tr>
                    );
                  })}

                  {/* إجمالي المجموعة */}
                  <tr className="bg-sky-50/70 font-bold text-sky-900 border-t border-b border-sky-200">
                    <td className="px-3 py-2 text-right pr-6 border-l border-slate-200">
                      مجموع {group.title}
                    </td>
                    <td className="px-2 py-2 border-l border-slate-200 font-mono">
                      {gPrevD.toLocaleString()}
                    </td>
                    <td className="px-2 py-2 border-l border-slate-200 font-mono">
                      {gPrevC.toLocaleString()}
                    </td>
                    <td className="px-2 py-2 border-l border-slate-200 font-mono text-sky-800 font-bold">
                      {gCurD.toLocaleString()}
                    </td>
                    <td className="px-2 py-2 border-l border-slate-200 font-mono text-sky-800 font-bold">
                      {gCurC.toLocaleString()}
                    </td>
                    <td className="px-2 py-2 border-l border-slate-200 font-mono text-indigo-800">
                      {(gPrevD + gCurD).toLocaleString()}
                    </td>
                    <td className="px-2 py-2 border-l border-slate-200 font-mono text-indigo-800">
                      {(gPrevC + gCurC).toLocaleString()}
                    </td>
                    <td className="px-2 py-2 border-l border-slate-200 font-mono text-emerald-800 font-bold">
                      {Math.max(0, gPrevD + gCurD - (gPrevC + gCurC)).toLocaleString()}
                    </td>
                    <td className="px-2 py-2 font-mono text-emerald-800 font-bold">
                      {Math.max(0, gPrevC + gCurC - (gPrevD + gCurD)).toLocaleString()}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>

          {/* الإجمالي العام بشريط فاتح فخم وعالي التباين */}
          <tfoot>
            <tr className="bg-gradient-to-r from-sky-900 via-blue-900 to-indigo-800 font-black text-white text-xs sm:text-sm border-t-2 border-sky-500 shadow-md">
              <td className="px-3 py-3.5 text-right pr-4 border-l border-white/10">
                الإجمالي العام لكافة الحسابات
              </td>
              <td className="px-2 py-3.5 border-l border-white/10 font-mono text-sky-100">
                {totals.prevDebit.toLocaleString()}
              </td>
              <td className="px-2 py-3.5 border-l border-white/10 font-mono text-sky-100">
                {totals.prevCredit.toLocaleString()}
              </td>
              <td className="px-2 py-3.5 border-l border-white/10 font-mono text-yellow-300 font-black text-sm">
                {totals.curDebit.toLocaleString()}
              </td>
              <td className="px-2 py-3.5 border-l border-white/10 font-mono text-amber-200 font-black text-sm">
                {totals.curCredit.toLocaleString()}
              </td>
              <td className="px-2 py-3.5 border-l border-white/10 font-mono text-white font-black">
                {(totals.prevDebit + totals.curDebit).toLocaleString()}
              </td>
              <td className="px-2 py-3.5 border-l border-white/10 font-mono text-white font-black">
                {(totals.prevCredit + totals.curCredit).toLocaleString()}
              </td>
              <td className="px-2 py-3.5 border-l border-white/10 font-mono text-emerald-300 font-black">
                {Math.max(
                  0,
                  totals.prevDebit + totals.curDebit - (totals.prevCredit + totals.curCredit)
                ).toLocaleString()}
              </td>
              <td className="px-2 py-3.5 font-mono text-emerald-300 font-black">
                {Math.max(
                  0,
                  totals.prevCredit + totals.curCredit - (totals.prevDebit + totals.curDebit)
                ).toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
