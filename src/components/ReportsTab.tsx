import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  FileText,
  UserRound,
  Wallet,
  Coins,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  RotateCcw,
} from "lucide-react";
import { useStore, type Account } from "@/lib/store";
import TabActions, { type TabCol } from "./TabActions";
import revenueSchema from "@/data/revenueTemplate.json";

type ReportSource =
  | "youssefLoan"
  | "tawfiqCustody"
  | "hafiza"
  | "account"
  | "expenses"
  | "revenue"
  | "combined"
  | "trainee"
  | "feeTotals";

type PeriodType = "all" | "month" | "quarter" | "half" | "year";
type TraineeGrouping = "month" | "year";
type TraineeDisplayMode = "detail" | "summary" | "both";
type ReportRow = Record<string, string | number | any>;

const MONTHS: string[] = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

const TRAINEE_REPORT_START_YEAR = 2021;

const PERIODS: Array<{ value: PeriodType; label: string }> = [
  { value: "all", label: "كامل المدة (من 2026)" },
  { value: "year", label: "سنوي" },
  { value: "half", label: "نصف سنوي" },
  { value: "quarter", label: "ربع سنوي" },
  { value: "month", label: "شهري" },
];

const SOURCES: Array<{ value: ReportSource; label: string }> = [
  { value: "youssefLoan", label: "سلفة د/يوسف" },
  { value: "tawfiqCustody", label: "عهدة توفيق الداعي" },
  { value: "account", label: "الحساب الجاري" },
  { value: "hafiza", label: "حوافظ التوريد" },
  { value: "expenses", label: "المصروفات" },
  { value: "revenue", label: "الإيرادات" },
  { value: "combined", label: "تقرير مجمّع لكل التبويبات" },
  { value: "trainee", label: "كشف مدفوعات المتدربين" },
  { value: "feeTotals", label: "إجماليات الرسوم حسب النوع" },
];

const normalizeDate = (value: unknown): Date | null => {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

const periodMonths = (period: PeriodType, month: number) => {
  if (period === "all" || period === "year") return Array.from({ length: 12 }, (_, index) => index);
  if (period === "quarter") return [Math.floor(month / 3) * 3, Math.floor(month / 3) * 3 + 1, Math.floor(month / 3) * 3 + 2];
  if (period === "half") return month < 6 ? [0, 1, 2, 3, 4, 5] : [6, 7, 8, 9, 10, 11];
  return [month];
};

const periodLabel = (period: PeriodType, month: number, year: number) => {
  if (period === "all") return `من عام 2026 حتى تاريخه`;
  if (period === "year") return `السنة المالية ${year}`;
  if (period === "half") return `${month < 6 ? "النصف الأول" : "النصف الثاني"} لعام ${year}`;
  if (period === "quarter") return `الربع ${Math.floor(month / 3) + 1} لعام ${year}`;
  return `شهر ${MONTHS[month]} ${year}`;
};

const getYearOptions = (values: unknown[]) => {
  const years = new Set<number>([2024, 2025, 2026]);
  values.forEach((value) => {
    const date = normalizeDate(value);
    if (date) years.add(date.getFullYear());
  });
  return Array.from(years).sort((a, b) => b - a);
};

const revenueItemNames = (() => {
  const names = new Map<string, string>();
  const schema = revenueSchema as any;
  (schema.chapters || []).forEach((chapter: any) =>
    (chapter.sections || []).forEach((section: any) =>
      (section.items || []).forEach((item: any) =>
        (item.types || []).forEach((type: any) => {
          names.set(`${chapter.no}-${section.no}-${item.no}-${type.no}`, type.title);
          names.set(String(type.no), type.title);
        })
      )
    )
  );
  return names;
})();

const revenueName = (key: string) => {
  const itemKey = key.split("-").slice(2).join("-");
  return revenueItemNames.get(itemKey) || revenueItemNames.get(itemKey.split("-").at(-1) || "") || itemKey || "—";
};

const amountValue = (value: unknown) => Number(value) || 0;

const canonicalFeeCategory = (value: unknown) => {
  const text = String(value || "")
    .trim()
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[إأآ]/g, "ا")
    .replace(/\s+/g, " ");
  if (!text) return "رسوم أخرى";
  if (/(امتحان|اختبار)/.test(text)) return "رسوم الامتحانات";
  if (/(تسجيل|قيد|دراس|دراسه|قسط)/.test(text)) return "أقساط الدراسة والتسجيل";
  return String(value).trim() || "رسوم أخرى";
};

// دالة تصنيف السجل وفق عمود البيان في الحساب الجاري
const classifyCustodyRecord = (description: unknown): "youssef" | "tawfiq" | "other" => {
  const text = String(description || "").trim();
  if (!text) return "other";

  // فحص أولاً سجلات عهدة الداعي / توفيق الداعي
  const isTawfiq = /(عهدة\s*الداعي|توفيق\s*الداعي)/.test(text);
  if (isTawfiq) return "tawfiq";

  // فحص سجلات عهدة د/يوسف: تحتوي على "عهدة" أو "العهدة" أو "عهدة د/يوسف"
  const isYoussef = /(عهدة\s*د\s*\/?\s*يوسف|العهدة|عهدة)/.test(text);
  if (isYoussef) return "youssef";

  return "other";
};

// أنماط طباعة مخصصة للتقارير متطابقة 100% مع نافذة معاينة المتصفح
const reportsTabPrintCss = `
  /* رؤوس الأعمدة: مطابقة للرأس الكحلي في جدول التقارير */
  thead th {
    background: #0f283a !important;
    color: #ffffff !important;
    font-weight: 900 !important;
    font-size: 13.5px !important;
    padding: 6px 4px !important;
    white-space: normal !important;
    word-break: keep-all !important;
    border: 1px solid #1f5f7a !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  thead th .pdf-cell-text,
  th .pdf-cell-text {
    background: transparent !important;
    color: #ffffff !important;
    font-weight: 900 !important;
  }
  /* خلايا البيانات: خط Cairo عريض أسود */
  tbody td {
    color: #000000 !important;
    font-weight: 800 !important;
    border: 1px solid #e2e8f0 !important;
    font-size: 13.5px !important;
    padding: 4px 5px !important;
    text-align: center !important;
  }
  tbody td .pdf-cell-text {
    color: inherit !important;
    background: transparent !important;
  }
  tbody tr:nth-child(even) td {
    background: #f8fafc !important;
  }
  tbody tr.report-row-plain td { background: #ffffff !important; color: #0f172a !important; }
  tbody tr.report-row-striped td { background: #f8fafc !important; color: #0f172a !important; }
  tbody tr.report-opening-row td,
  tbody tr.report-period-row td { background: #fef3c7 !important; color: #451a03 !important; font-weight: 900 !important; }
  tbody tr.report-fee-row td { background: #e0f2fe !important; color: #082f49 !important; font-weight: 900 !important; }

  /* صف الإجمالي الكلي الملون في تقارير العهد والتقارير العامة */
  tbody tr.total-row td {
    background: #0437bb !important;
    color: #ffffff !important;
    font-weight: 900 !important;
    border-color: #1e3a8a !important;
    border-top: 2px solid #1e3a8a !important;
    border-bottom: 2px solid #1e3a8a !important;
    white-space: nowrap !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  tbody tr.total-row td .pdf-cell-text {
    color: #ffffff !important;
    font-weight: 900 !important;
    background: transparent !important;
  }

  /* ===== صفوف ملخص العهدة (الافتتاحي / المنصرف / المتبقي) ===== */
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
    padding: 7px 6px !important;
    font-size: 13px !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    white-space: nowrap !important;
  }
  /* البطاقة 0: الرصيد الافتتاحي (كهرماني/أصفر) */
  .summary-card-0 td {
    background: #fde68a !important;
    color: #451a03 !important;
    border: 1.5px solid #f59e0b !important;
  }
  .summary-card-0 .pdf-cell-text {
    color: #451a03 !important;
    background: transparent !important;
  }
  /* البطاقة 1: المنصرف خلال العام (وردي/أحمر) */
  .summary-card-1 td {
    background: #fecdd3 !important;
    color: #4c0519 !important;
    border: 1.5px solid #f43f5e !important;
  }
  .summary-card-1 .pdf-cell-text {
    color: #4c0519 !important;
    background: transparent !important;
  }
  /* البطاقة 2: المتبقي من العهدة (زمردي/أخضر فاتح) */
  .summary-card-2 td {
    background: #a7f3d0 !important;
    color: #022c22 !important;
    border: 1.5px solid #10b981 !important;
  }
  .summary-card-2 .pdf-cell-text {
    color: #022c22 !important;
    background: transparent !important;
  }
  .report-page-content table thead th {
    background: #0f283a !important;
    border-color: #1f5f7a !important;
  }
  .report-page-content table tbody td { border-color: #e2e8f0 !important; }
  .report-page-content table tbody td .pdf-cell-text { color: inherit !important; background: transparent !important; }
  .report-page-content table tbody tr.report-row-plain td { background: #ffffff !important; color: #0f172a !important; }
  .report-page-content table tbody tr.report-row-striped td { background: #f8fafc !important; color: #0f172a !important; }
  .report-page-content table tbody tr.report-opening-row td,
  .report-page-content table tbody tr.report-period-row td { background: #fef3c7 !important; color: #451a03 !important; font-weight: 900 !important; }
  .report-page-content table tbody tr.report-fee-row td { background: #e0f2fe !important; color: #082f49 !important; font-weight: 900 !important; }
  .report-page-content table tbody tr.report-grand-total-row td {
    background: #0437bb !important;
    color: #ffffff !important;
    border-color: #1e3a8a !important;
    border-top: 2px solid #1e3a8a !important;
    border-bottom: 2px solid #1e3a8a !important;
  }
  .report-page-content table tbody tr.report-grand-total-row td .pdf-cell-text { color: #ffffff !important; }
  .report-page-content table tbody tr.summary-card-0 td { background: #fde68a !important; color: #451a03 !important; border-color: #f59e0b !important; }
  .report-page-content table tbody tr.summary-card-0 .pdf-cell-text { color: #451a03 !important; }
  .report-page-content table tbody tr.summary-card-1 td { background: #fecdd3 !important; color: #4c0519 !important; border-color: #f43f5e !important; }
  .report-page-content table tbody tr.summary-card-1 .pdf-cell-text { color: #4c0519 !important; }
  .report-page-content table tbody tr.summary-card-2 td { background: #a7f3d0 !important; color: #022c22 !important; border-color: #10b981 !important; }
  .report-page-content table tbody tr.summary-card-2 .pdf-cell-text { color: #022c22 !important; }
  /* توحيد الحدود إلى الأسود لجميع خلايا الجدول، بما فيها الرأس والإجمالي والملخص */
  #tableContainer table th,
  #tableContainer table td,
  #report-source table th,
  #report-source table td {
    border: 1px solid #000000 !important;
  }
  @media print {
    #tableContainer table th,
    #tableContainer table td {
      border: 1px solid #000000 !important;
    }
  }
`;

export default function ReportsTab() {
  const hafiza = useStore((state) => state.hafiza);
  const accounts = useStore((state) => state.accounts);
  const revenue = useStore((state) => state.revenue);

  const [source, setSource] = useState<ReportSource>("youssefLoan");
  const [period, setPeriod] = useState<PeriodType>("all");
  const [year, setYear] = useState<number>(2026);
  const [month, setMonth] = useState<number>(0);
  const [selectedTrainee, setSelectedTrainee] = useState<string>("all");
  const [traineeGrouping, setTraineeGrouping] = useState<TraineeGrouping>("month");
  const [selectedFee, setSelectedFee] = useState<string>("all");
  const [traineeDisplayMode, setTraineeDisplayMode] = useState<TraineeDisplayMode>("both");

  // حالة الفرز والبحث والتصفية
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null; // العودة للترتيب الأصلي
    });
  };

  const handleResetFilters = () => {
    setSortConfig(null);
    setSearchTerm("");
  };

  // الرصيد الافتتاحي مع الحفظ التلقائي في المتصفح
  const [youssefOpeningBalance, setYoussefOpeningBalance] = useState<number>(() => {
    const saved = localStorage.getItem("youssef_loan_opening_balance");
    return saved ? Number(saved) || 0 : 0;
  });

  const [tawfiqOpeningBalance, setTawfiqOpeningBalance] = useState<number>(() => {
    const saved = localStorage.getItem("tawfiq_custody_opening_balance");
    return saved ? Number(saved) || 0 : 0;
  });

  const handleYoussefOpeningChange = (val: number) => {
    setYoussefOpeningBalance(val);
    localStorage.setItem("youssef_loan_opening_balance", String(val));
  };

  const handleTawfiqOpeningChange = (val: number) => {
    setTawfiqOpeningBalance(val);
    localStorage.setItem("tawfiq_custody_opening_balance", String(val));
  };

  const selectedMonths = useMemo(() => periodMonths(period, month), [period, month]);
  const selectedMonthSet = useMemo(() => new Set(selectedMonths), [selectedMonths]);
  const years = useMemo(() => getYearOptions([...hafiza.map((row) => row.date), ...accounts.map((row) => row.date)]), [hafiza, accounts]);
  const traineeOptions = useMemo(() => Array.from(new Set(hafiza
    .filter((row) => {
      const date = normalizeDate(row.notifyDate);
      return Boolean(date && date.getFullYear() >= TRAINEE_REPORT_START_YEAR && amountValue(row.notifyAmount) > 0);
    })
    .map((row) => String(row.name || "").trim())
    .filter(Boolean))).sort((a, b) => a.localeCompare(b, "ar")), [hafiza]);
  const feeOptions = useMemo(() => Array.from(new Set(hafiza
    .filter((row) => {
      const date = normalizeDate(row.notifyDate);
      return Boolean(date && date.getFullYear() >= TRAINEE_REPORT_START_YEAR && amountValue(row.notifyAmount) > 0);
    })
    .filter((row) => selectedTrainee === "all" || String(row.name || "").trim() === selectedTrainee)
    .map((row) => canonicalFeeCategory(row.description))
    .filter(Boolean))).sort((a, b) => a.localeCompare(b, "ar")), [hafiza, selectedTrainee]);

  const inPeriod = (dateValue: unknown) => {
    const date = normalizeDate(dateValue);
    if (!date) return false;
    if (period === "all") return date.getFullYear() >= 2026;
    if (period === "year") return date.getFullYear() === year;
    return date.getFullYear() === year && selectedMonthSet.has(date.getMonth());
  };

  // 1. تقرير سلفة د/يوسف (من الحساب الجاري 2026 فما فوق)
  const youssefRows = useMemo<ReportRow[]>(() => {
    const matched = accounts
      .filter((row) => {
        const d = normalizeDate(row.date);
        if (!d || d.getFullYear() < 2026) return false;
        if (!inPeriod(row.date)) return false;
        return classifyCustodyRecord(row.description) === "youssef";
      })
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));

    let running = youssefOpeningBalance;
    const result: ReportRow[] = [];

    // سطر الرصيد الافتتاحي
    result.push({
      date: "2026-01-01",
      docNo: "افتتاحي",
      description: "الرصيد الافتتاحي المدور",
      name: "د/ يوسف",
      debit: youssefOpeningBalance > 0 ? youssefOpeningBalance : 0,
      credit: youssefOpeningBalance < 0 ? Math.abs(youssefOpeningBalance) : 0,
      balance: running,
      summaryLevel: "opening",
    });

    let sumDebit = youssefOpeningBalance > 0 ? youssefOpeningBalance : 0;
    let sumCredit = youssefOpeningBalance < 0 ? Math.abs(youssefOpeningBalance) : 0;

    matched.forEach((row) => {
      const credit = amountValue(row.hafizaAmount);
      const debit = amountValue(row.income);
      running += debit - credit;
      sumDebit += debit;
      sumCredit += credit;

      const docNo = row.checkNo
        ? `شيك: ${row.checkNo}`
        : row.notifyNo
        ? `إشعار: ${row.notifyNo}`
        : row.hafizaNo
        ? `حافظة: ${row.hafizaNo}`
        : "—";

      result.push({
        date: row.date || "—",
        docNo,
        description: row.description || "عهدة د/ يوسف",
        name: row.name || "د/ يوسف",
        debit,
        credit,
        balance: running,
      });
    });

    // صف الإجمالي الكلي الملون لكل الأعمدة
    result.push({
      date: "—",
      docNo: "—",
      description: "الإجمالي الكلي",
      name: "—",
      debit: sumDebit,
      credit: sumCredit,
      balance: running,
      summaryLevel: "total",
    });

    // صفوف ملخص العهدة
    const paidForSummary = sumCredit - (youssefOpeningBalance < 0 ? Math.abs(youssefOpeningBalance) : 0);
    const remainingForSummary = youssefOpeningBalance - paidForSummary;

    result.push({
      __summaryCard: { index: 0, label: "مبلغ العهدة الافتتاحي للعام 2026", value: youssefOpeningBalance },
      description: "مبلغ العهدة الافتتاحي للعام 2026",
      credit: youssefOpeningBalance,
      summaryLevel: "summary-card",
    });
    result.push({
      __summaryCard: { index: 1, label: "المنصرف من العهدة خلال العام", value: paidForSummary },
      description: "المنصرف من العهدة خلال العام",
      credit: paidForSummary,
      summaryLevel: "summary-card",
    });
    result.push({
      __summaryCard: { index: 2, label: "المتبقي من العهدة حتى تاريخ التقرير", value: remainingForSummary },
      description: "المتبقي من العهدة حتى تاريخ التقرير",
      credit: remainingForSummary,
      summaryLevel: "summary-card",
    });

    return result;
  }, [accounts, youssefOpeningBalance, period, year, selectedMonthSet]);

  // 2. تقرير عهدة توفيق الداعي (من الحساب الجاري 2026 فما فوق)
  const tawfiqRows = useMemo<ReportRow[]>(() => {
    const matched = accounts
      .filter((row) => {
        const d = normalizeDate(row.date);
        if (!d || d.getFullYear() < 2026) return false;
        if (!inPeriod(row.date)) return false;
        return classifyCustodyRecord(row.description) === "tawfiq";
      })
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));

    let running = tawfiqOpeningBalance;
    const result: ReportRow[] = [];

    // سطر الرصيد الافتتاحي
    result.push({
      date: "2026-01-01",
      docNo: "افتتاحي",
      description: "الرصيد الافتتاحي للعهدة",
      name: "توفيق الداعي",
      debit: tawfiqOpeningBalance > 0 ? tawfiqOpeningBalance : 0,
      credit: tawfiqOpeningBalance < 0 ? Math.abs(tawfiqOpeningBalance) : 0,
      balance: running,
      summaryLevel: "opening",
    });

    let sumDebit = tawfiqOpeningBalance > 0 ? tawfiqOpeningBalance : 0;
    let sumCredit = tawfiqOpeningBalance < 0 ? Math.abs(tawfiqOpeningBalance) : 0;

    matched.forEach((row) => {
      const credit = amountValue(row.hafizaAmount);
      const debit = amountValue(row.income);
      running += debit - credit;
      sumDebit += debit;
      sumCredit += credit;

      const docNo = row.checkNo
        ? `شيك: ${row.checkNo}`
        : row.notifyNo
        ? `إشعار: ${row.notifyNo}`
        : row.hafizaNo
        ? `حافظة: ${row.hafizaNo}`
        : "—";

      result.push({
        date: row.date || "—",
        docNo,
        description: row.description || "عهدة توفيق الداعي",
        name: row.name || "توفيق الداعي",
        debit,
        credit,
        balance: running,
      });
    });

    // صف الإجمالي الكلي الملون لكل الأعمدة
    result.push({
      date: "—",
      docNo: "—",
      description: "الإجمالي الكلي",
      name: "—",
      debit: sumDebit,
      credit: sumCredit,
      balance: running,
      summaryLevel: "total",
    });

    // صفوف ملخص العهدة
    const paidForSummary = sumCredit - (tawfiqOpeningBalance < 0 ? Math.abs(tawfiqOpeningBalance) : 0);
    const remainingForSummary = tawfiqOpeningBalance - paidForSummary;

    result.push({
      __summaryCard: { index: 0, label: "مبلغ العهدة الافتتاحي للعام 2026", value: tawfiqOpeningBalance },
      description: "مبلغ العهدة الافتتاحي للعام 2026",
      credit: tawfiqOpeningBalance,
   
