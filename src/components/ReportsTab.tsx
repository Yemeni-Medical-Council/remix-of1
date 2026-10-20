import { useMemo, useState } from "react";
import { BarChart3, CalendarDays, FileText, UserRound, Wallet, Coins } from "lucide-react";
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
type ReportRow = Record<string, string | number>;

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
// تُعيد "tawfiq" إذا كان البيان خاصاً بعهدة الداعي/توفيق الداعي
// وتُعيد "youssef" إذا كان البيان يحتوي على كلمة عهدة (بدون ذكر الداعي)
// وتُعيد "other" لبقية السجلات
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

// أنماط طباعة مخصصة للتقارير
const reportsTabPrintCss = `
  thead th, thead th {
    background: #9e3513 !important;
    color: #fff !important;
    font-weight: 800 !important;
    border: 1px solid #0369a1 !important;
    white-space: nowrap !important;
  }
 tbody td {
    color: #000000 !important;
    font-weight: 900 !important;
    border: 1px solid #cbd5e1 !important;
  }
  .total-row td {
    background: #0284c7 !important;
    color: #ffffff !important;
    font-weight: 900 !important;
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
  const traineeOptions = useMemo(() => Array.from(new Set(hafiza.map((row) => String(row.name || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, "ar")), [hafiza]);
  const feeOptions = useMemo(() => Array.from(new Set(hafiza
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
        // يُقرأ فقط السجلات التي بيانها يحتوي على كلمة "عهدة" (وليست خاصة بالداعي)
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
      // حسب طلبك: الدائن (المسدد) = مبلغ الحافظة، والمدين (المنصرف) = الإيرادات
      const credit = amountValue(row.hafizaAmount);   // دائن (المسدد) من عمود مبلغ الحافظة
      const debit  = amountValue(row.income);         // مدين (المنصرف) من عمود الإيرادات
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

    // سطر الإجمالي
    result.push({
      date: "—",
      docNo: "—",
      description: "الإجمالي وصافي الرصيد المتبقي",
      name: "—",
      debit: sumDebit,
      credit: sumCredit,
      balance: running,
      summaryLevel: "total",
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
        // يُقرأ فقط السجلات التي بيانها يحتوي على "عهدة الداعي" أو "توفيق الداعي"
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
      // حسب طلبك: الدائن (المسدد) = مبلغ الحافظة، والمدين (المنصرف) = الإيرادات
      const credit = amountValue(row.hafizaAmount);   // دائن (المسدد) من عمود مبلغ الحافظة
      const debit  = amountValue(row.income);         // مدين (المنصرف) من عمود الإيرادات
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

    // سطر الإجمالي
    result.push({
      date: "—",
      docNo: "—",
      description: "الإجمالي وصافي العهدة المتبقية",
      name: "—",
      debit: sumDebit,
      credit: sumCredit,
      balance: running,
      summaryLevel: "total",
    });

    return result;
  }, [accounts, tawfiqOpeningBalance, period, year, selectedMonthSet]);

  const hafizaRows = useMemo<ReportRow[]>(() => hafiza.filter((row) => inPeriod(row.date)).map((row) => ({
    date: row.date,
    description: row.description || "—",
    name: row.name || "—",
    hafizaNo: row.hafizaNo || "—",
    amount: amountValue(row.hafizaAmount),
    income: amountValue(row.income ?? row.notifyAmount)
  })), [hafiza, year, selectedMonthSet, period]);

  const accountRows = useMemo<ReportRow[]>(() => accounts.filter((row) => inPeriod(row.date)).sort((a, b) => String(a.date).localeCompare(String(b.date))).map((row) => ({
    date: row.date,
    description: row.description || "—",
    name: row.name || "—",
    income: amountValue(row.income),
    expense: amountValue(row.expense)
  })), [accounts, year, selectedMonthSet, period]);

  const expenseRows = useMemo<ReportRow[]>(() => accountRows.filter((row) => Number(row.expense) > 0).map((row) => ({
    date: row.date,
    item: row.description,
    name: row.name,
    expense: amountValue(row.expense)
  })), [accountRows]);

  const revenueRows = useMemo<ReportRow[]>(() => Object.entries(revenue).map(([key, amount]) => {
    const parts = key.split("-");
    const rowYear = Number(parts[0]);
    const rowMonth = Number(parts[1]) - 1;
    return { date: `${MONTHS[rowMonth] || parts[1]} ${rowYear}`, item: revenueName(key), amount: amountValue(amount), _year: rowYear, _month: rowMonth };
  }).filter((row) => (period === "all" ? row._year >= 2026 : row._year === year && selectedMonthSet.has(row._month as number))).map(({ _year, _month, ...row }) => row), [revenue, year, selectedMonthSet, period]);

  const traineeRows = useMemo<ReportRow[]>(() => {
    const payments = hafiza.flatMap((row) => {
      const date = normalizeDate(row.date);
      const trainee = String(row.name || "").trim();
      const category = canonicalFeeCategory(row.description);
      const amount = amountValue(row.hafizaAmount);
      if (!date || date.getFullYear() < 2024 || !trainee || amount <= 0 || (selectedTrainee !== "all" && trainee !== selectedTrainee) || (selectedFee !== "all" && category !== selectedFee)) return [];
      const p = traineeGrouping === "year" ? String(date.getFullYear()) : `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
      return [{ date: row.date, year: date.getFullYear(), period: p, trainee, category, description: String(row.description || "رسوم أخرى").trim(), source: "حوافظ التوريد", amount }];
    });

    const categories = Array.from(new Set(payments.map((row) => String(row.category)))).sort((a, b) => a.localeCompare(b, "ar"));
    const result: ReportRow[] = [];

    categories.forEach((category) => {
      const categoryPayments = payments.filter((row) => row.category === category).sort((a, b) => String(a.date).localeCompare(String(b.date)));
      if (traineeDisplayMode === "detail" || traineeDisplayMode === "both") {
        result.push(...categoryPayments.map((row) => ({ ...row, displayType: "تفصيلي", summaryLevel: "detail" })));
      }
      if (traineeDisplayMode === "summary" || traineeDisplayMode === "both") {
        const grouped = new Map<string, ReportRow>();
        categoryPayments.forEach((row) => {
          const key = `${row.year}|${row.period}`;
          const current = grouped.get(key);
          if (current) {
            current.amount = amountValue(current.amount) + amountValue(row.amount);
          } else {
            grouped.set(key, {
              year: row.year,
              period: row.period,
              trainee: row.trainee,
              category,
              description: "إجمالي الفترة",
              source: "حوافظ التوريد",
              amount: row.amount,
              displayType: "إجمالي الفترة",
              notes: "إجمالي الفترة",
              summaryLevel: "period"
            });
          }
        });
        result.push(...Array.from(grouped.values()));
      }
      result.push({
        period: `إجمالي ${category}`,
        trainee: selectedTrainee === "all" ? "جميع المتدربين" : selectedTrainee,
        category,
        description: "إجمالي الرسم",
        source: "حوافظ التوريد",
        amount: categoryPayments.reduce((sum, row) => sum + amountValue(row.amount), 0),
        displayType: "إجمالي الرسم",
        notes: "إجمالي الرسم",
        summaryLevel: "fee"
      });
    });
    return result;
  }, [hafiza, selectedTrainee, selectedFee, traineeGrouping, traineeDisplayMode]);

  const feeTotalsRows = useMemo<ReportRow[]>(() => {
    const totals = new Map<string, number>();
    hafiza.forEach((row) => {
      const name = String(row.name || "").trim();
      const amount = amountValue(row.hafizaAmount);
      if (amount <= 0 || !normalizeDate(row.date) || normalizeDate(row.date)!.getFullYear() < 2024) return;
      if (selectedTrainee !== "all" && name !== selectedTrainee) return;
      const category = canonicalFeeCategory(row.description);
      totals.set(category, (totals.get(category) || 0) + amount);
    });
    const rows = Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({ category, source: "حوافظ التوريد", amount }));
    const grandTotal = rows.reduce((sum, row) => sum + amountValue(row.amount), 0);
    return grandTotal > 0 ? [...rows, { category: "الإجمالي الكلي لجميع الرسوم", source: "حوافظ التوريد", amount: grandTotal, total: "نعم" }] : rows;
  }, [hafiza, selectedTrainee]);

  const sourceConfig = useMemo(() => {
    if (source === "youssefLoan") {
      return {
        title: "كشف حساب سلفة د/ يوسف",
        columns: [
          { key: "date", label: "التاريخ" },
          { key: "docNo", label: "رقم المستند / الشيك" },
          { key: "description", label: "البيان" },
          { key: "name", label: "الاسم" },
          { key: "debit", label: "مدين (المنصرف)" },
          { key: "credit", label: "دائن (المسدد)" },
          { key: "balance", label: "الرصيد المتبقي" },
        ] satisfies TabCol[],
      };
    }
    if (source === "tawfiqCustody") {
      return {
        title: "كشف حساب عهدة توفيق الداعي",
        columns: [
          { key: "date", label: "التاريخ" },
          { key: "docNo", label: "رقم المستند / الشيك" },
          { key: "description", label: "البيان" },
          { key: "name", label: "الاسم" },
          { key: "debit", label: "مدين (المنصرف)" },
          { key: "credit", label: "دائن (المسدد)" },
          { key: "balance", label: "الرصيد المتبقي" },
        ] satisfies TabCol[],
      };
    }
    if (source === "trainee") return { title: "كشف مدفوعات المتدربين من حوافظ التوريد", columns: [{ key: "year", label: "السنة" }, { key: "period", label: "الشهر / السنة" }, { key: "trainee", label: "اسم المتدرب" }, { key: "description", label: "البيان الأصلي" }, { key: "category", label: "التصنيف الموحد" }, { key: "displayType", label: "نوع السجل" }, { key: "source", label: "المصدر" }, { key: "amount", label: "المبلغ" }] satisfies TabCol[] };
    if (source === "feeTotals") return { title: "إجماليات الرسوم حسب النوع", columns: [{ key: "category", label: "نوع الرسم" }, { key: "source", label: "المصدر" }, { key: "amount", label: "الإجمالي" }] satisfies TabCol[] };
    if (source === "hafiza") return { title: "تقرير حوافظ التوريد", columns: [{ key: "date", label: "التاريخ" }, { key: "hafizaNo", label: "رقم الحافظة" }, { key: "description", label: "البيان" }, { key: "name", label: "الاسم" }, { key: "amount", label: "المبلغ" }, { key: "income", label: "الإيرادات" }] satisfies TabCol[] };
    if (source === "account") return { title: "تقرير الحساب الجاري", columns: [{ key: "date", label: "التاريخ" }, { key: "description", label: "البيان" }, { key: "name", label: "الاسم" }, { key: "income", label: "الإيرادات" }, { key: "expense", label: "المصروفات" }] satisfies TabCol[] };
    if (source === "expenses") return { title: "تقرير المصروفات", columns: [{ key: "date", label: "التاريخ" }, { key: "item", label: "بند المصروف" }, { key: "name", label: "الاسم" }, { key: "expense", label: "المبلغ" }] satisfies TabCol[] };
    if (source === "revenue") return { title: "تقرير الإيرادات", columns: [{ key: "date", label: "الشهر" }, { key: "item", label: "اسم بند الإيراد" }, { key: "amount", label: "المبلغ" }] satisfies TabCol[] };
    return { title: "تقرير مالي مجمّع", columns: [{ key: "source", label: "المصدر" }, { key: "date", label: "التاريخ / الفترة" }, { key: "description", label: "البيان / البند" }, { key: "income", label: "الإيرادات" }, { key: "expense", label: "المصروفات" }, { key: "amount", label: "المبلغ" }] satisfies TabCol[] };
  }, [source]);

  const reportRows = useMemo<ReportRow[]>(() => {
    if (source === "youssefLoan") return youssefRows;
    if (source === "tawfiqCustody") return tawfiqRows;
    if (source === "trainee") return traineeRows;
    if (source === "feeTotals") return feeTotalsRows;
    if (source === "hafiza") return hafizaRows;
    if (source === "account") return accountRows;
    if (source === "expenses") return expenseRows;
    if (source === "revenue") return revenueRows;
    return [
      ...hafizaRows.map((row) => ({ source: "حوافظ التوريد", date: row.date, description: row.description, income: row.income, amount: row.amount })),
      ...accountRows.map((row) => ({ source: "الحساب الجاري", date: row.date, description: row.description, income: row.income, expense: row.expense })),
      ...expenseRows.map((row) => ({ source: "المصروفات", date: row.date, description: row.item, expense: row.expense })),
      ...revenueRows.map((row) => ({ source: "الإيرادات", date: row.date, description: row.item, amount: row.amount }))
    ];
  }, [source, youssefRows, tawfiqRows, hafizaRows, accountRows, expenseRows, revenueRows, traineeRows, feeTotalsRows]);

  const title = source === "trainee"
    ? `كشف مدفوعات ${selectedTrainee === "all" ? "جميع المتدربين" : selectedTrainee} — ${selectedFee === "all" ? "كل الرسوم" : selectedFee} — ${traineeDisplayMode === "detail" ? "تفصيلي" : traineeDisplayMode === "summary" ? "إجمالي" : "تفصيلي وإجمالي"} — تجميع ${traineeGrouping === "month" ? "شهري" : "سنوي"}`
    : source === "feeTotals"
    ? `إجماليات الرسوم حسب النوع — ${selectedTrainee === "all" ? "جميع المتدربين" : selectedTrainee} — من 2024`
    : `${sourceConfig.title} — ${periodLabel(period, month, year)}`;

  const numericKeys =
    source === "youssefLoan" || source === "tawfiqCustody"
      ? ["debit", "credit", "balance"]
      : source === "hafiza"
      ? ["amount", "income"]
      : source === "account"
      ? ["income", "expense"]
      : source === "expenses"
      ? ["expense"]
      : source === "revenue"
      ? ["amount"]
      : source === "trainee" || source === "feeTotals"
      ? ["amount"]
      : ["income", "expense", "amount"];

  const isLoanOrCustody = source === "youssefLoan" || source === "tawfiqCustody";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-sky-50 to-indigo-50 p-2 sm:p-4" dir="rtl">
      <section className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-sky-200 bg-white shadow-xl">
        <header className="bg-gradient-to-l from-[#2e6b8a] via-[#3d7fa0] to-[#2e6b8a] p-4 text-white sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
              {isLoanOrCustody ? <Wallet className="h-6 w-6" /> : <BarChart3 className="h-6 w-6" />}
            </span>
            <div>
              <h1 className="text-xl font-black sm:text-2xl">التقارير</h1>
              <p className="text-xs font-semibold text-sky-100 sm:text-sm">
                تقارير السلف والعهد وكشوف الحسابات والإيرادات والمصروفات قابلة للطباعة والتنزيل
              </p>
            </div>
          </div>
        </header>

        {/* فلاتر واختيارات التقرير */}
        <div className="grid gap-3 border-b border-slate-200 bg-slate-50 p-3 sm:grid-cols-4 sm:p-4">
          <label className="flex flex-col gap-1 text-xs font-black text-slate-700">
            مصدر التقرير
            <select
              value={source}
              onChange={(event) => setSource(event.target.value as ReportSource)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-sky-600"
            >
              {SOURCES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          {/* حقل الرصيد الافتتاحي اليدوي لسلفة د/يوسف وعهدة توفيق الداعي */}
 {source === "youssefLoan" && (
            <label className="flex flex-col gap-1 text-xs font-black text-amber-900 bg-amber-50/80 p-1.5 rounded-xl border border-amber-200">
              <span className="flex items-center gap-1 font-black">
                <Coins className="w-3.5 h-3.5 text-amber-600" />
                الرصيد الافتتاحي لسلفة د/ يوسف (ريال)
              </span>
              <input
                type="number"
                value={youssefOpeningBalance || ""}
                onChange={(e) => handleYoussefOpeningChange(Number(e.target.value) || 0)}
                placeholder="0"
                className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-900 outline-none focus:border-amber-600 font-mono"
              />
            </label>
          )}

          {source === "tawfiqCustody" && (
            <label className="flex flex-col gap-1 text-xs font-black text-emerald-900 bg-emerald-50/80 p-1.5 rounded-xl border border-emerald-200">
              <span className="flex items-center gap-1 font-black">
                <Coins className="w-3.5 h-3.5 text-emerald-600" />
                الرصيد الافتتاحي لعهدة توفيق الداعي (ريال)
              </span>
              <input
                type="number"
                value={tawfiqOpeningBalance || ""}
                onChange={(e) => handleTawfiqOpeningChange(Number(e.target.value) || 0)}
                placeholder="0"
                className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-600 font-mono"
              />
            </label>
          )}

          {source === "trainee" || source === "feeTotals" ? (
            <>
              <label className="flex flex-col gap-1 text-xs font-black text-slate-700">
                المتدرب
                <select
                  value={selectedTrainee}
                  onChange={(event) => setSelectedTrainee(event.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-sky-600"
                >
                  <option value="all">كل المتدربين</option>
                  {traineeOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs font-black text-slate-700">
                طريقة التجميع
                <select
                  value={traineeGrouping}
                  onChange={(event) => setTraineeGrouping(event.target.value as TraineeGrouping)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-sky-600"
                >
                  <option value="month">إجمالي كل شهر</option>
                  <option value="year">إجمالي كل سنة</option>
                </select>
              </label>

              {source === "trainee" && (
                <>
                  <label className="flex flex-col gap-1 text-xs font-black text-slate-700">
                    نوع الرسم
                    <select
                      value={selectedFee}
                      onChange={(event) => setSelectedFee(event.target.value)}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-sky-600"
                    >
                      <option value="all">كل الرسوم</option>
                      {feeOptions.map((fee) => (
                        <option key={fee} value={fee}>{fee}</option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-xs font-black text-slate-700">
                    نمط التقرير
                    <select
                      value={traineeDisplayMode}
                      onChange={(event) => setTraineeDisplayMode(event.target.value as TraineeDisplayMode)}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-sky-600"
                    >
                      <option value="detail">تفصيلي فقط</option>
                      <option value="summary">إجمالي فقط</option>
                      <option value="both">تفصيلي وإجمالي</option>
                    </select>
                  </label>
                </>
              )}
            </>
          ) : (
            <>
              <label className="flex flex-col gap-1 text-xs font-black text-slate-700">
                نوع الفترة
                <select
                  value={period}
                  onChange={(event) => setPeriod(event.target.value as PeriodType)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-sky-600"
                >
                  {PERIODS.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>

              {period !== "all" && (
                <label className="flex flex-col gap-1 text-xs font-black text-slate-700">
                  السنة
                  <select
                    value={year}
                    onChange={(event) => setYear(Number(event.target.value))}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-sky-600"
                  >
                    {years.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>
              )}

              {period !== "all" && period !== "year" && (
                <label className="flex flex-col gap-1 text-xs font-black text-slate-700">
                  الشهر / بداية الفترة
                  <select
                    value={month}
                    onChange={(event) => setMonth(Number(event.target.value))}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-sky-600"
                  >
                    {MONTHS.map((item, index) => (
                      <option key={item} value={index}>{item}</option>
                    ))}
                  </select>
                </label>
              )}
            </>
          )}
        </div>

        {/* شريط الإجراءات والطباعة والتصدير */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-3 sm:p-4">
          <div className="flex items-center gap-2 text-sm font-black text-slate-800">
            {source === "trainee" ? (
              <UserRound className="h-5 w-5 text-sky-700" />
            ) : isLoanOrCustody ? (
              <Wallet className="h-5 w-5 text-[#1f5f7a]" />
            ) : (
              <CalendarDays className="h-5 w-5 text-sky-700" />
            )}
            <span>{title}</span>
            <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-800">
              {reportRows.length} سجل
            </span>
          </div>

          <TabActions
            title={title}
            rows={reportRows}
            columns={sourceConfig.columns}
            fileName={
              source === "youssefLoan"
                ? `كشف-حساب-سلفة-د-يوسف-${year}`
                : source === "tawfiqCustody"
                ? `كشف-حساب-عهدة-توفيق-الداعي-${year}`
                : `تقرير-${source}-${year}`
            }
            numericKeys={numericKeys}
            pdfLayout="wide-centered"
            pdfOrientation={isLoanOrCustody ? "landscape" : "landscape"}
            pdfCss={reportsTabPrintCss}
            className="w-full sm:w-auto"
          />
        </div>

        {/* جدول عرض التقرير */}
        <div className="overflow-x-auto p-3 sm:p-4">
          {reportRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm font-bold text-white">
              <FileText className="mx-auto mb-2 h-8 w-8 text-slate-400" />
              لا توجد حركات مسجلة للخيارات المحددة في الحساب الجاري.
            </div>
          ) : (
            <table className="w-full min-w-[860px] border-collapse overflow-hidden rounded-2xl text-center text-xs sm:text-sm">
              <thead className="bg-[#0f283a] text-white">
                <tr>
                  <th className="border border-[#1f5f7a] px-3 py-2.5 font-bold">م</th>
                  {sourceConfig.columns.map((column) => (
                    <th key={column.key} className="border border-[#1f5f7a] px-3 py-2.5 font-bold">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportRows.map((row, index) => {
                  const isTotal = row.summaryLevel === "total";
                  const isOpening = row.summaryLevel === "opening";

                  let rowStyle = "bg-white text-slate-900";
                  if (isTotal) {
                    rowStyle = "bg-[#1f5f7a] text-white font-bold";
                  } else if (isOpening) {
                    rowStyle = "bg-amber-100/80 text-amber-950 font-black";
                  } else if (row.summaryLevel === "fee") {
                    rowStyle = "bg-sky-200 font-black text-sky-950";
                  } else if (row.summaryLevel === "period") {
                    rowStyle = "bg-amber-200 font-black text-amber-950";
                  } else if (index % 2 === 1) {
                    rowStyle = "bg-slate-50/80 text-slate-900";
                  }

                  return (
                    <tr
                      key={`${String(row.date)}-${String(row.trainee || row.name || "")}-${index}`}
                      className={`transition-colors ${rowStyle}`}
                    >
                      <td className="border border-slate-200 px-2 py-2 font-bold">
                        {isTotal ? "★" : index + 1}
                      </td>
                      {sourceConfig.columns.map((column) => {
                        const val = row[column.key];
                        const isNum = numericKeys.includes(column.key);
                        return (
                          <td
                            key={column.key}
                            className={`border border-slate-200 px-3 py-2 font-semibold ${
                              isNum ? "font-mono" : ""
                            }`}
                          >
                            {typeof val === "number" ? val.toLocaleString() : (val ?? "—")}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}