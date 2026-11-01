import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";

const legacyStorageKey = "app-report-date-v1";
const storageKeyForYear = (year: number) => `app-report-date-v2-${year}`;

type ReportDateContextValue = {
  reportDate: string;
  reportDateLabel: string;
  setReportDate: (value: string) => void;
};

const validDate = (value: string | null): value is string => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
const dateWithYear = (value: string, year: number) => `${year}-${value.slice(5)}`;
const readForYear = (year: number, fallback: string) => {
  if (typeof window === "undefined") return dateWithYear(fallback, year);
  const stored = window.localStorage.getItem(storageKeyForYear(year));
  if (validDate(stored)) return stored;
  if (year === 2026) {
    const legacy = window.localStorage.getItem(legacyStorageKey);
    if (validDate(legacy)) return legacy;
  }
  return dateWithYear(fallback, year);
};

export const formatReportDate = (value?: string): string => {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  if (!year || !month || !day || Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ar-EG-u-nu-latn", { year: "numeric", month: "2-digit", day: "2-digit" });
};

const ReportDateContext = createContext<ReportDateContextValue | null>(null);

export function ReportDateProvider({ children }: { children: ReactNode }) {
  const selectedYear = useStore((state) => state.selectedYear);
  const setSelectedYear = useStore((state) => state.setSelectedYear);
  const [reportDate, setReportDateState] = useState(() => readForYear(selectedYear, new Date().toISOString().slice(0, 10)));
  const loadedYear = useRef(selectedYear);
  const ready = useRef(true);

  useEffect(() => {
    if (loadedYear.current === selectedYear) return;
    ready.current = false;
    const next = readForYear(selectedYear, reportDate);
    setReportDateState(next);
    loadedYear.current = selectedYear;
    ready.current = true;
  }, [selectedYear]);

  useEffect(() => {
    if (!ready.current || loadedYear.current !== selectedYear) return;
    window.localStorage.setItem(storageKeyForYear(selectedYear), reportDate);
  }, [reportDate, selectedYear]);

  const setReportDate = useCallback((value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
    setReportDateState(value);
    const year = Number(value.slice(0, 4));
    if (year !== selectedYear) setSelectedYear(year);
    if (typeof window !== "undefined") window.localStorage.setItem(storageKeyForYear(year), value);
  }, [selectedYear, setSelectedYear]);

  const value = useMemo(() => ({ reportDate, reportDateLabel: formatReportDate(reportDate), setReportDate }), [reportDate, setReportDate]);
  return <ReportDateContext.Provider value={value}>{children}</ReportDateContext.Provider>;
}

export const useReportDate = (): ReportDateContextValue => {
  const context = useContext(ReportDateContext);
  if (!context) throw new Error("useReportDate must be used within ReportDateProvider");
  return context;
};
