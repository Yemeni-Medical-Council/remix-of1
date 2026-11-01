import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import seedTrainees from "@/data/trainees.json";
import seedInstallments from "@/data/installments.json";

// ==========================================
// 1. تعريف الأنواع (Types)
// ==========================================

export type Trainee = { name: string; batch: string; specialty: string };

export const INSTALLMENT_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "ابريل",
  "مايو",
  "يونيو",
  "يوليو",
  "اغسطس",
  "سبتمبر",
  "اكتوبر",
  "نوفمبر",
  "ديسمبر",
] as const;

export type InstallmentCustomColumn = {
  name: string;
  type: "text" | "select" | "formula";
  options?: string[];
  formula?: string;
};

export type InstallmentConditionalRule = { text: string; color: string };

export type Installment = {
  no?: number | null;
  name: string;
  batch: string;
  specialty: string;
  fees: number;
  prevDue: number;
  payments: Record<string, number>;
  totalPaid: number;
  remaining: number;
  notes: string;
  phone: string;
  customData?: Record<string, string | number>;
};

export type Hafiza = {
  id: string;
  name: string;
  batch: string;
  specialty: string;
  date: string;
  hafizaNo: string;
  description: string;
  hafizaAmount: number;
  notifyDate?: string;
  notifyNo?: string;
  notifyAmount?: number;
  income?: number;
};

export type Account = {
  id: string;
  date: string;
  hafizaNo: string;
  notifyNo: string;
  notifyDate: string;
  checkNo: string;
  checkDate: string;
  description: string;
  specialty: string;
  name: string;
  hafizaAmount: number;
  income: number;
  expense: number;
  sourceHafizaId?: string;
  sourceExpenseId?: string;
  revenueKey?: string;
};

export type Journal = {
  id: string;
  transactionId?: string;
  date: string;
  formNo: string;
  settlement?: string;
  description: string;
  debit: number;
  credit: number;
  account: string;
  debitAccount?: string;
  creditAccount?: string;
  debitCol?: string;
  creditCol?: string;
};

export type RevenueMap = Record<string, number>;

export type CustomTab = {
  id: string;
  name: string;
  columns: string[];
  rows: Record<string, string | number>[];
};

type AnnualData = {
  hafiza: Hafiza[];
  hafizas: Hafiza[];
  accounts: Account[];
  journal: Journal[];
  installments: Installment[];
  openingBalance: number;
  revenue: RevenueMap;
  customTabs: CustomTab[];
};

export const DEFAULT_FINANCIAL_YEAR = 2026;

// ==========================================
// 2. واجهة حالة المتجر (State Interface)
// ==========================================
type State = {
  selectedYear: number;
  annualData: Record<string, AnnualData>;
  trainees: Trainee[];
  hafiza: Hafiza[];
  hafizas: Hafiza[];
  accounts: Account[];
  journal: Journal[];
  installments: Installment[];
  installments2025: Installment[];
  openingBalance: number;
  revenue: RevenueMap;
  customTabs: CustomTab[];
  installmentCustomColumns2026: InstallmentCustomColumn[];
  installmentConditionalRules2026: InstallmentConditionalRule[];

  addTrainee: (t: Trainee) => void;
  updateTrainee: (index: number, t: Trainee) => void;
  deleteTrainee: (index: number) => void;
  importTrainees: (trainees: Trainee[]) => void;

  addHafiza: (h: Omit<Hafiza, "id">) => Hafiza;
  updateHafiza: (id: string, h: Partial<Hafiza>) => void;
  deleteHafiza: (id: string) => void;
  clearHafiza: () => void;

  addAccount: (a: Omit<Account, "id">) => Account;
  updateAccount: (id: string, a: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  clearAccounts: () => void;

  addJournal: (j: Omit<Journal, "id">) => Journal;
  updateJournal: (id: string, j: Partial<Journal>) => void;
  deleteJournal: (id: string) => void;
  clearJournal: () => void;

  addInstallment: (i: Omit<Installment, "totalPaid" | "remaining">, year?: number | "2025") => void;
  updateInstallment: (index: number, i: Partial<Installment>, year?: number | "2025") => void;
  updateInstallmentPayment: (index: number, month: string, amount: number, year?: number | "2025") => void;
  deleteInstallment: (index: number, year?: number | "2025") => void;
  clearInstallments: (year?: number | "2025") => void;
  recalcAllInstallments: () => void;
  setInstallmentCustomColumns2026: (columns: InstallmentCustomColumn[]) => void;
  setInstallmentConditionalRules2026: (rules: InstallmentConditionalRule[]) => void;

  setOpeningBalance: (n: number) => void;
  setRevenue: (year: number, month: number, itemKey: string, amount: number) => void;
  setSelectedYear: (year: number) => void;

  importData: (d: any) => void;
  exportAllData: () => any;
  clearAll: () => void;
  clearTab: (tab: string) => void;

  addCustomTab: (name: string) => CustomTab;
  renameCustomTab: (id: string, name: string) => void;
  deleteCustomTab: (id: string) => void;
  addCustomColumn: (id: string, col: string) => void;
  removeCustomColumn: (id: string, col: string) => void;
  addCustomRow: (id: string, row: Record<string, string | number>) => void;
  updateCustomRow: (id: string, index: number, row: Record<string, string | number>) => void;
  deleteCustomRow: (id: string, index: number) => void;

  getHafizaById: (id: string) => Hafiza | undefined;
  getAccountById: (id: string) => Account | undefined;
  getTotalIncome: () => number;
  getTotalExpenses: () => number;
  getOverdueInstallments: (year?: number | "2025") => Installment[];
  getInstallmentByIndex: (index: number, year?: number | "2025") => Installment | undefined;

  syncHafizaToAccount: (hafiza: Hafiza) => void;
  syncExpenseToAccount: (expense: {
    sourceExpenseId: string;
    date: string;
    description: string;
    amount: number;
  }) => void;
};

// ==========================================
// 3. دوال مساعدة محلية (Local Helpers)
// ==========================================
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const getToday = () => new Date().toISOString().split("T")[0];

let pendingStorageWrite: { name: string; value: string } | null = null;
let storageWriteTimer: ReturnType<typeof setTimeout> | null = null;
let storageIsNewerVersion = false;
let storageReadFailed = false;
const LEGACY_STORE_NAME = "majlis-yemen-v1";

const reportStorageError = (error: unknown) => {
  console.error("[Storage] Failed to access application data", error);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mizan:storage-error"));
  }
};

const flushStorageWrite = () => {
  if (!pendingStorageWrite || typeof window === "undefined") return;
  const pending = pendingStorageWrite;
  storageWriteTimer = null;
  try {
    window.localStorage.setItem(pending.name, pending.value);
    if (pendingStorageWrite === pending) pendingStorageWrite = null;
  } catch (error) {
    reportStorageError(error);
  }
};

const deferredStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === "undefined") return null;
    try {
      const raw =
        window.localStorage.getItem(name) ??
        (name === "majlis-yemen-v2" ? window.localStorage.getItem(LEGACY_STORE_NAME) : null);
      if (raw === null) return null;
      const decoded: unknown = JSON.parse(raw);
      if (
        !decoded ||
        typeof decoded !== "object" ||
        Array.isArray(decoded) ||
        !("state" in decoded) ||
        !(decoded as { state?: unknown }).state ||
        typeof (decoded as { state?: unknown }).state !== "object"
      ) {
        throw new Error("Persisted state envelope has an invalid shape");
      }
      return raw;
    } catch (error) {
      storageReadFailed = true;
      reportStorageError(error);
      return null;
    }
  },
  setItem: (name, value) => {
    if (storageReadFailed || storageIsNewerVersion) {
      reportStorageError(new Error("Stored data is unreadable or was written by a newer application version"));
      return;
    }
    pendingStorageWrite = { name, value };
    if (storageWriteTimer) clearTimeout(storageWriteTimer);
    storageWriteTimer = setTimeout(flushStorageWrite, 80);
  },
  removeItem: (name) => {
    if (pendingStorageWrite?.name === name) pendingStorageWrite = null;
    if (storageWriteTimer) {
      clearTimeout(storageWriteTimer);
      storageWriteTimer = null;
    }
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(name);
      } catch (error) {
        reportStorageError(error);
      }
    }
  },
};

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flushStorageWrite);
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushStorageWrite();
  });
}

const recalcInstallment = (i: Installment): Installment => {
  const totalPaid = Object.values(i.payments || {}).reduce((s, v) => s + (Number(v) || 0), 0);
  const fees = Number(i.fees) || 0;
  const prevDue = Number(i.prevDue) || 0;
  return { ...i, fees, prevDue, totalPaid, remaining: prevDue - totalPaid };
};

const recalculateRevenueMap = (accounts: Account[]): RevenueMap => {
  const newRevenue: RevenueMap = {};
  accounts.forEach((acc) => {
    if (acc.revenueKey && acc.income > 0) {
      const dateStr = acc.notifyDate || acc.date;
      const d = new Date(dateStr);
      const year = isNaN(d.getFullYear()) ? 2026 : d.getFullYear();
      const month = isNaN(d.getMonth()) ? 1 : d.getMonth() + 1;
      const compositeKey = `${year}-${month}-${acc.revenueKey}`;
      newRevenue[compositeKey] = (newRevenue[compositeKey] || 0) + acc.income;
    }
  });
  return newRevenue;
};

const emptyAnnualData = (customTabs: CustomTab[] = []): AnnualData => ({
  hafiza: [],
  hafizas: [],
  accounts: [],
  journal: [],
  installments: [],
  openingBalance: 0,
  revenue: {},
  customTabs: customTabs.map((tab) => ({ ...tab, columns: [...tab.columns], rows: [] })),
});

const annualDataKey = (year: number) => String(year);

const getYearFromValue = (value: unknown, fallback = DEFAULT_FINANCIAL_YEAR): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value >= 30000 && value <= 60000) {
      return new Date((value - 25569) * 86400000).getUTCFullYear();
    }
    if (value >= 1900 && value <= 2200) return Math.trunc(value);
  }
  const text = String(value ?? "").trim();
  const isoYear = text.match(/^(\d{4})[-/.]/);
  if (isoYear) return Number(isoYear[1]);
  const dayMonthYear = text.match(/^\d{1,2}[-/.]\d{1,2}[-/.](\d{4})$/);
  if (dayMonthYear) return Number(dayMonthYear[1]);
  const parsed = new Date(text);
  return text && Number.isFinite(parsed.getTime()) ? parsed.getFullYear() : fallback;
};

const captureAnnualData = (state: Pick<
  State,
  | "selectedYear"
  | "hafiza"
  | "hafizas"
  | "accounts"
  | "journal"
  | "installments"
  | "installments2025"
  | "openingBalance"
  | "revenue"
  | "customTabs"
>): AnnualData => {
  const hafiza = state.hafiza;
  return {
    hafiza,
    hafizas: hafiza,
    accounts: state.accounts,
    journal: state.journal,
    installments: state.selectedYear === 2025 ? state.installments2025 : state.installments,
    openingBalance: state.openingBalance,
    revenue: state.revenue,
    customTabs: state.customTabs,
  };
};

const splitLegacyAnnualData = (legacy: Record<string, any>): Record<string, AnnualData> => {
  const years: Record<string, AnnualData> = {};
  const ensure = (year: number) => {
    const key = annualDataKey(year);
    years[key] ??= emptyAnnualData();
    return years[key];
  };

  const legacyHafiza = Array.isArray(legacy.hafiza)
    ? legacy.hafiza
    : Array.isArray(legacy.hafizas)
      ? legacy.hafizas
      : [];
  legacyHafiza.forEach((row: Hafiza) => {
    const target = ensure(getYearFromValue(row?.date));
    target.hafiza.push(row);
    target.hafizas = target.hafiza;
  });
  (Array.isArray(legacy.accounts) ? legacy.accounts : []).forEach((row: Account) => {
    ensure(getYearFromValue(row?.date || row?.notifyDate)).accounts.push(row);
  });
  (Array.isArray(legacy.journal) ? legacy.journal : []).forEach((row: Journal) => {
    ensure(getYearFromValue(row?.date)).journal.push(row);
  });

  const genericInstallments = Array.isArray(legacy.installments)
    ? legacy.installments
    : (seedInstallments as Installment[]).map(recalcInstallment);
  ensure(DEFAULT_FINANCIAL_YEAR).installments = genericInstallments;
  if (Array.isArray(legacy.installments2025)) {
    ensure(2025).installments = legacy.installments2025;
  }

  if (legacy.revenue && typeof legacy.revenue === "object" && !Array.isArray(legacy.revenue)) {
    Object.entries(legacy.revenue as Record<string, number>).forEach(([key, value]) => {
      const year = getYearFromValue(key.split("-")[0], DEFAULT_FINANCIAL_YEAR);
      ensure(year).revenue[key] = Number(value) || 0;
    });
  }

  const defaultYear = ensure(DEFAULT_FINANCIAL_YEAR);
  defaultYear.openingBalance = Number(legacy.openingBalance ?? 811664) || 0;
  if (Array.isArray(legacy.customTabs)) defaultYear.customTabs = legacy.customTabs;
  if (!years[annualDataKey(DEFAULT_FINANCIAL_YEAR)]) years[annualDataKey(DEFAULT_FINANCIAL_YEAR)] = emptyAnnualData();
  return years;
};

const isValidFinancialYear = (year: number) => Number.isInteger(year) && year >= 1900 && year <= 2200;

// ==========================================
// 4. إنشاء المتجر (Store Creation)
// ==========================================
export const useStore = create<State>()(
  persist(
    (set, get) => ({
      selectedYear: DEFAULT_FINANCIAL_YEAR,
      annualData: {},
      trainees: seedTrainees as Trainee[],
      hafiza: [],
      hafizas: [],
      accounts: [],
      journal: [],
      installments: (seedInstallments as Installment[]).map(recalcInstallment),
      installments2025: [],
      openingBalance: 811664,
      revenue: {},
      customTabs: [],
      installmentCustomColumns2026: [],
      installmentConditionalRules2026: [],

      setSelectedYear: (year) => {
        const nextYear = Number(year);
        if (!isValidFinancialYear(nextYear)) return;
        set((state) => {
          if (state.selectedYear === nextYear) return state;
          const annualData = {
            ...state.annualData,
            [annualDataKey(state.selectedYear)]: captureAnnualData(state),
          };
          const target =
            annualData[annualDataKey(nextYear)] || emptyAnnualData(state.customTabs);
          return {
            ...target,
            selectedYear: nextYear,
            annualData,
            installments: nextYear === 2025 ? [] : target.installments,
            installments2025: nextYear === 2025 ? target.installments : [],
            hafizas: target.hafiza,
          };
        });
      },

      syncHafizaToAccount: (hafiza: Hafiza) => {
        const year = hafiza.date?.split("-")[0];
        if (year && Number(year) !== get().selectedYear) return;

        let existingAccount = get().accounts.find((acc) => acc.sourceHafizaId === hafiza.id);
        if (!existingAccount && hafiza.hafizaNo) {
          existingAccount = get().accounts.find((acc) => acc.hafizaNo === hafiza.hafizaNo);
          if (existingAccount) {
            set((state) => ({
              accounts: state.accounts.map((acc) =>
                acc.id === existingAccount!.id ? { ...acc, sourceHafizaId: hafiza.id } : acc,
              ),
            }));
          }
        }

        const getNotifyAmount = (h: any): number => {
          const val = h.notifyAmount ?? h.supplyAmount ?? h.tawreedAmount ?? 0;
          const num = Number(val);
          return isNaN(num) ? 0 : num;
        };

        const mappedData = {
          date: hafiza.date,
          hafizaNo: hafiza.hafizaNo || "",
          notifyNo: hafiza.notifyNo || "",
          notifyDate: hafiza.notifyDate || "",
          description: hafiza.description,
          specialty: hafiza.specialty,
          name: hafiza.name,
          hafizaAmount: Number(hafiza.hafizaAmount) || 0,
          income: getNotifyAmount(hafiza),
          sourceHafizaId: hafiza.id,
        };

        if (!existingAccount) {
          const newAccount: Account = {
            id: uid(),
            ...mappedData,
            checkNo: "",
            checkDate: "",
            expense: 0,
            revenueKey: undefined,
          };
          set((state) => {
            const updatedAccounts = [...state.accounts, newAccount];
            return { accounts: updatedAccounts, revenue: recalculateRevenueMap(updatedAccounts) };
          });
        } else {
          const hasDiff =
            existingAccount.date !== mappedData.date ||
            existingAccount.hafizaNo !== mappedData.hafizaNo ||
            existingAccount.notifyNo !== mappedData.notifyNo ||
            existingAccount.notifyDate !== mappedData.notifyDate ||
            existingAccount.description !== mappedData.description ||
            existingAccount.specialty !== mappedData.specialty ||
            existingAccount.name !== mappedData.name ||
            existingAccount.hafizaAmount !== mappedData.hafizaAmount ||
            existingAccount.income !== mappedData.income;
          if (hasDiff) {
            set((state) => {
              const updatedAccounts = state.accounts.map((acc) =>
                acc.id === existingAccount!.id
                  ? {
                      ...acc,
                      ...mappedData,
                      revenueKey: acc.revenueKey,
                      expense: acc.expense,
                      checkNo: acc.checkNo,
                      checkDate: acc.checkDate,
                    }
                  : acc,
              );
              return { accounts: updatedAccounts, revenue: recalculateRevenueMap(updatedAccounts) };
            });
          }
        }
      },

      syncExpenseToAccount: (expense) => {
        const amount = Number(expense.amount) || 0;
        const existingAccount = get().accounts.find(
          (account) => account.sourceExpenseId === expense.sourceExpenseId,
        );

        if (amount <= 0) {
          if (!existingAccount) return;
          set((state) => {
            const updatedAccounts = state.accounts.filter(
              (account) => account.id !== existingAccount.id,
            );
            return { accounts: updatedAccounts, revenue: recalculateRevenueMap(updatedAccounts) };
          });
          return;
        }

        const mappedData = {
          sourceExpenseId: expense.sourceExpenseId,
          date: expense.date,
          description: expense.description,
          hafizaNo: "",
          notifyNo: "",
          notifyDate: "",
          checkNo: "",
          checkDate: "",
          specialty: "",
          name: "",
          hafizaAmount: 0,
          income: 0,
          expense: amount,
          revenueKey: undefined,
        };

        if (!existingAccount) {
          const newAccount: Account = { id: uid(), ...mappedData };
          set((state) => {
            const updatedAccounts = [...state.accounts, newAccount];
            return { accounts: updatedAccounts, revenue: recalculateRevenueMap(updatedAccounts) };
          });
          return;
        }

        const hasDiff =
          existingAccount.date !== mappedData.date ||
          existingAccount.description !== mappedData.description ||
          existingAccount.expense !== mappedData.expense;
        if (!hasDiff) return;

        set((state) => {
          const updatedAccounts = state.accounts.map((account) =>
            account.id === existingAccount.id
              ? {
                  ...account,
                  ...mappedData,
                  checkNo: account.checkNo,
                  checkDate: account.checkDate,
                }
              : account,
          );
          return { accounts: updatedAccounts, revenue: recalculateRevenueMap(updatedAccounts) };
        });
      },

      addTrainee: (t) => set((s) => ({ trainees: [...s.trainees, t] })),
      updateTrainee: (index, t) =>
        set((s) => ({ trainees: s.trainees.map((tr, i) => (i === index ? t : tr)) })),
      deleteTrainee: (index) =>
        set((s) => ({ trainees: s.trainees.filter((_, i) => i !== index) })),
      importTrainees: (trainees) => set((s) => ({ trainees: [...s.trainees, ...trainees] })),

      addHafiza: (h) => {
        const item: Hafiza = {
          ...h,
          id: uid(),
          date: h.date || getToday(),
          hafizaAmount: Number(h.hafizaAmount) || 0,
          notifyAmount: Number(h.notifyAmount) || 0,
        };
        set((s) => {
          const updated = [...s.hafiza, item];
          return { hafiza: updated, hafizas: updated };
        });
        get().syncHafizaToAccount(item);
        return item;
      },
      updateHafiza: (id, h) =>
        set((s) => {
          const updated = s.hafiza.map((x) => (x.id === id ? { ...x, ...h } : x));
          const updatedHafiza = updated.find((x) => x.id === id);
          if (updatedHafiza) {
            setTimeout(() => get().syncHafizaToAccount(updatedHafiza), 0);
          }
          return { hafiza: updated, hafizas: updated };
        }),
      deleteHafiza: (id) => {
        set((state) => {
          const updatedHafiza = state.hafiza.filter((x) => x.id !== id);
          const linkedAccount = state.accounts.find((acc) => acc.sourceHafizaId === id);
          if (linkedAccount) {
            const updatedAccounts = state.accounts.filter((acc) => acc.id !== linkedAccount.id);
            return {
              hafiza: updatedHafiza,
              hafizas: updatedHafiza,
              accounts: updatedAccounts,
              revenue: recalculateRevenueMap(updatedAccounts),
            };
          }
          return { hafiza: updatedHafiza, hafizas: updatedHafiza };
        });
      },
      clearHafiza: () => {
        set((state) => {
          const hafizaIds = state.hafiza.map((h) => h.id);
          const updatedAccounts = state.accounts.filter(
            (acc) => !acc.sourceHafizaId || !hafizaIds.includes(acc.sourceHafizaId),
          );
          return {
            hafiza: [],
            hafizas: [],
            accounts: updatedAccounts,
            revenue: recalculateRevenueMap(updatedAccounts),
          };
        });
      },

      addAccount: (a) => {
        const item: Account = {
          ...a,
          id: uid(),
          date: a.date || getToday(),
          hafizaAmount: Number(a.hafizaAmount) || 0,
          income: Number(a.income) || 0,
          expense: Number(a.expense) || 0,
        };
        set((s) => {
          const newAccounts = [...s.accounts, item];
          return { accounts: newAccounts, revenue: recalculateRevenueMap(newAccounts) };
        });
        return item;
      },
      updateAccount: (id, a) =>
        set((s) => {
          const newAccounts = s.accounts.map((x) => (x.id === id ? { ...x, ...a } : x));
          return { accounts: newAccounts, revenue: recalculateRevenueMap(newAccounts) };
        }),
      deleteAccount: (id) =>
        set((s) => {
          const newAccounts = s.accounts.filter((x) => x.id !== id);
          return { accounts: newAccounts, revenue: recalculateRevenueMap(newAccounts) };
        }),
      clearAccounts: () => set({ accounts: [], revenue: {} }),

      addJournal: (j) => {
        const item: Journal = {
          ...j,
          id: uid(),
          transactionId: j.transactionId || uid(),
          date: j.date || getToday(),
          debit: Number(j.debit) || 0,
          credit: Number(j.credit) || 0,
        };
        set((s) => ({ journal: [...s.journal, item] }));
        return item;
      },
      updateJournal: (id, j) =>
        set((s) => ({
          journal: s.journal.map((x) => (x.id === id ? { ...x, ...j } : x)),
        })),
      deleteJournal: (id) =>
        set((s) => {
          const target = s.journal.find((x) => x.id === id);
          if (target && target.transactionId) {
            return { journal: s.journal.filter((x) => x.transactionId !== target.transactionId) };
          }
          return { journal: s.journal.filter((x) => x.id !== id) };
        }),
      clearJournal: () => set({ journal: [] }),

      addInstallment: (i, year) => {
        const newInst = recalcInstallment({
          ...i,
          payments: {},
          totalPaid: 0,
          remaining: Number(i.prevDue) || 0,
        } as Installment);
        set((s) => {
          const key = Number(year) === 2025 || s.selectedYear === 2025 ? "installments2025" : "installments";
          return { [key]: [...s[key], newInst] };
        });
      },
      updateInstallment: (index, i, year) =>
        set((s) => {
          const key = Number(year) === 2025 || s.selectedYear === 2025 ? "installments2025" : "installments";
          return {
            [key]: s[key].map((inst, idx) =>
              idx === index ? recalcInstallment({ ...inst, ...i }) : inst,
            ),
          };
        }),
      updateInstallmentPayment: (index, month, amount, year) =>
        set((s) => {
          const key = Number(year) === 2025 || s.selectedYear === 2025 ? "installments2025" : "installments";
          return {
            [key]: s[key].map((inst, idx) =>
              idx === index
                ? recalcInstallment({ ...inst, payments: { ...inst.payments, [month]: amount } })
                : inst,
            ),
          };
        }),
      deleteInstallment: (index, year) =>
        set((s) => {
          const key = Number(year) === 2025 || s.selectedYear === 2025 ? "installments2025" : "installments";
          return { [key]: s[key].filter((_, i) => i !== index) };
        }),
      clearInstallments: (year) => {
        if (Number(year) === 2025 || get().selectedYear === 2025) set({ installments2025: [] });
        else set({ installments: [] });
      },
      recalcAllInstallments: () =>
        set((s) =>
          s.selectedYear === 2025
            ? { installments2025: s.installments2025.map(recalcInstallment) }
            : { installments: s.installments.map(recalcInstallment) },
        ),
      setInstallmentCustomColumns2026: (columns) => set({ installmentCustomColumns2026: columns }),
      setInstallmentConditionalRules2026: (rules) =>
        set({ installmentConditionalRules2026: rules }),

      setOpeningBalance: (n) => set({ openingBalance: n }),
      setRevenue: (year, month, itemKey, amount) =>
        set((s) => ({ revenue: { ...s.revenue, [`${year}-${month}-${itemKey}`]: amount } })),

      importData: (d) => {
        if (d?.annualData && typeof d.annualData === "object") {
          set((s) => {
            const annualData = { ...s.annualData };
            Object.entries(d.annualData as Record<string, unknown>).forEach(([key, value]) => {
              const year = Number(key);
              if (!isValidFinancialYear(year) || !value || typeof value !== "object") return;
              const raw = value as Partial<AnnualData>;
              const hafiza = Array.isArray(raw.hafiza) ? raw.hafiza : [];
              annualData[key] = {
                hafiza,
                hafizas: hafiza,
                accounts: Array.isArray(raw.accounts) ? raw.accounts : [],
                journal: Array.isArray(raw.journal) ? raw.journal : [],
                installments: Array.isArray(raw.installments)
                  ? raw.installments.map(recalcInstallment)
                  : [],
                openingBalance: Number(raw.openingBalance) || 0,
                revenue: raw.revenue && typeof raw.revenue === "object" ? raw.revenue : {},
                customTabs: Array.isArray(raw.customTabs) ? raw.customTabs : [],
              };
            });
            const selectedYear = isValidFinancialYear(Number(d.selectedYear))
              ? Number(d.selectedYear)
              : s.selectedYear;
            const active = annualData[annualDataKey(selectedYear)] || emptyAnnualData(s.customTabs);
            return {
              ...active,
              selectedYear,
              annualData,
              trainees: Array.isArray(d.trainees) ? d.trainees : s.trainees,
              installments: selectedYear === 2025 ? [] : active.installments,
              installments2025: selectedYear === 2025 ? active.installments : [],
              hafizas: active.hafiza,
              installmentCustomColumns2026: Array.isArray(d.installmentCustomColumns2026)
                ? d.installmentCustomColumns2026
                : s.installmentCustomColumns2026,
              installmentConditionalRules2026: Array.isArray(d.installmentConditionalRules2026)
                ? d.installmentConditionalRules2026
                : s.installmentConditionalRules2026,
            };
          });
          return;
        }

        set((s) => {
          const importedAccounts = d.accounts
            ? [
                ...s.accounts,
                ...d.accounts.map((a: any) => ({
                  ...a,
                  id: a.id || uid(),
                  hafizaAmount: Number(a.hafizaAmount) || 0,
                  income: Number(a.income) || 0,
                  expense: Number(a.expense) || 0,
                })),
              ]
            : s.accounts;

          const rawHafiza = d.hafiza || d.hafizas || [];
          const importedHafiza = [
            ...s.hafiza,
            ...rawHafiza.map((h: any) => ({
              ...h,
              id: h.id || uid(),
              hafizaAmount: Number(h.hafizaAmount) || 0,
              notifyAmount: Number(h.notifyAmount) || 0,
            })),
          ];

          return {
            trainees: d.trainees ? [...s.trainees, ...d.trainees] : s.trainees,
            journal: d.journal
              ? [
                  ...s.journal,
                  ...d.journal.map((j: any) => ({
                    ...j,
                    id: j.id || uid(),
                    transactionId: j.transactionId || uid(),
                    debit: Number(j.debit) || 0,
                    credit: Number(j.credit) || 0,
                  })),
                ]
              : s.journal,
            hafiza: importedHafiza,
            hafizas: importedHafiza,
            accounts: importedAccounts,
            revenue: d.accounts
              ? recalculateRevenueMap(importedAccounts)
              : d.revenue
                ? { ...s.revenue, ...d.revenue }
                : s.revenue,
            installments: d.installments
              ? [...s.installments, ...d.installments.map(recalcInstallment)]
              : s.installments,
            installments2025: d.installments2025
              ? [...s.installments2025, ...d.installments2025.map(recalcInstallment)]
              : s.installments2025,
            openingBalance: d.openingBalance ?? s.openingBalance,
            installmentCustomColumns2026:
              d.installmentCustomColumns2026 ?? s.installmentCustomColumns2026,
            installmentConditionalRules2026:
              d.installmentConditionalRules2026 ?? s.installmentConditionalRules2026,
          };
        });
      },

      exportAllData: () => {
        const state = get();
        return {
          selectedYear: state.selectedYear,
          annualData: {
            ...state.annualData,
            [annualDataKey(state.selectedYear)]: captureAnnualData(state),
          },
          trainees: state.trainees,
          hafiza: state.hafiza,
          hafizas: state.hafizas,
          accounts: state.accounts,
          journal: state.journal,
          installments: state.installments,
          installments2025: state.installments2025,
          openingBalance: state.openingBalance,
          revenue: state.revenue,
          customTabs: state.customTabs,
          installmentCustomColumns2026: state.installmentCustomColumns2026,
          installmentConditionalRules2026: state.installmentConditionalRules2026,
        };
      },
      clearAll: () =>
        set((s) => ({
          hafiza: [],
          hafizas: [],
          accounts: [],
          journal: [],
          installments: s.selectedYear === 2025 ? s.installments : [],
          installments2025: s.selectedYear === 2025 ? [] : s.installments2025,
          revenue: {},
        })),
      clearTab: (tab) =>
        set((s) => {
          if (tab === "hafiza" || tab === "hafizas") return { ...s, hafiza: [], hafizas: [] };
          return { ...s, [tab]: [] };
        }),

      addCustomTab: (name) => {
        const tab: CustomTab = { id: uid(), name, columns: [], rows: [] };
        set((s) => ({ customTabs: [...s.customTabs, tab] }));
        return tab;
      },
      renameCustomTab: (id, name) =>
        set((s) => ({ customTabs: s.customTabs.map((t) => (t.id === id ? { ...t, name } : t)) })),
      deleteCustomTab: (id) =>
        set((s) => ({ customTabs: s.customTabs.filter((t) => t.id !== id) })),
      addCustomColumn: (id, col) =>
        set((s) => ({
          customTabs: s.customTabs.map((t) =>
            t.id === id && !t.columns.includes(col) ? { ...t, columns: [...t.columns, col] } : t,
          ),
        })),
      removeCustomColumn: (id, col) =>
        set((s) => ({
          customTabs: s.customTabs.map((t) =>
            t.id === id ? { ...t, columns: t.columns.filter((c) => c !== col) } : t,
          ),
        })),
      addCustomRow: (id, row) =>
        set((s) => ({
          customTabs: s.customTabs.map((t) => (t.id === id ? { ...t, rows: [...t.rows, row] } : t)),
        })),
      updateCustomRow: (id, index, row) =>
        set((s) => ({
          customTabs: s.customTabs.map((t) =>
            t.id === id ? { ...t, rows: t.rows.map((r, i) => (i === index ? row : r)) } : t,
          ),
        })),
      deleteCustomRow: (id, index) =>
        set((s) => ({
          customTabs: s.customTabs.map((t) =>
            t.id === id ? { ...t, rows: t.rows.filter((_, i) => i !== index) } : t,
          ),
        })),

      getHafizaById: (id) => get().hafiza.find((h) => h.id === id),
      getAccountById: (id) => get().accounts.find((a) => a.id === id),
      getTotalIncome: () => get().journal.reduce((sum, j) => sum + (j.credit || 0), 0),
      getTotalExpenses: () => get().journal.reduce((sum, j) => sum + (j.debit || 0), 0),
      getOverdueInstallments: (year) => {
        const key = Number(year) === 2025 || get().selectedYear === 2025 ? "installments2025" : "installments";
        return get()[key].filter((i: Installment) => i.remaining > 0);
      },
      getInstallmentByIndex: (index, year) => {
        const key = Number(year) === 2025 || get().selectedYear === 2025 ? "installments2025" : "installments";
        return get()[key][index];
      },
    }),
    {
      name: "majlis-yemen-v2",
      version: 3,
      storage: createJSONStorage(() => deferredStorage),
      migrate: (persistedState, storedVersion) => {
        if (storedVersion > 3) {
          storageIsNewerVersion = true;
          reportStorageError(new Error(`Stored data was written by newer version ${storedVersion}`));
        }
        const persisted = (persistedState && typeof persistedState === "object"
          ? persistedState
          : {}) as Record<string, any>;
        if (storedVersion < 3 || !persisted.annualData) {
          return {
            ...persisted,
            selectedYear: DEFAULT_FINANCIAL_YEAR,
            annualData: splitLegacyAnnualData(persisted),
          };
        }
        return persisted as State;
      },
      merge: (persistedState, currentState) => {
        const persisted = (persistedState && typeof persistedState === "object"
          ? persistedState
          : {}) as Partial<State>;
        const selectedYear = isValidFinancialYear(Number(persisted.selectedYear))
          ? Number(persisted.selectedYear)
          : DEFAULT_FINANCIAL_YEAR;
        const persistedAnnual = persisted.annualData;
        const annualData = persistedAnnual && typeof persistedAnnual === "object"
          ? persistedAnnual
          : splitLegacyAnnualData(persisted as Record<string, any>);
        const active = annualData[annualDataKey(selectedYear)] || emptyAnnualData();
        return {
          ...currentState,
          ...persisted,
          ...active,
          selectedYear,
          annualData,
          installments: selectedYear === 2025 ? [] : active.installments,
          installments2025: selectedYear === 2025 ? active.installments : [],
          hafizas: active.hafiza,
        };
      },
      partialize: (state) => {
        const active = captureAnnualData(state);
        return {
          selectedYear: state.selectedYear,
          annualData: {
            ...state.annualData,
            [annualDataKey(state.selectedYear)]: active,
          },
          trainees: state.trainees,
          ...active,
          installments: state.installments,
          installments2025: state.installments2025,
          installmentCustomColumns2026: state.installmentCustomColumns2026,
          installmentConditionalRules2026: state.installmentConditionalRules2026,
        };
      },
    },
  ),
);

// تصدير الـ Hooks المخصصة
export const useTrainees = () => useStore((s) => s.trainees);
export const useHafiza = () => useStore((s) => s.hafiza);
export const useHafizas = () => useStore((s) => s.hafizas);
export const useAccounts = () => useStore((s) => s.accounts);
export const useJournal = () => useStore((s) => s.journal);
export const useInstallments = () => useStore((s) => s.installments);
export const useInstallments2025 = () => useStore((s) => s.installments2025);
export const useCustomTabs = () => useStore((s) => s.customTabs);
export const useRevenue = () => useStore((s) => s.revenue);
export const useOpeningBalance = () => useStore((s) => s.openingBalance);
