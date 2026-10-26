import { useCallback, useEffect, useRef, useState } from "react";
import { Printer, X } from "lucide-react";
import { toast } from "sonner";
import { downloadRenderedReportPdf } from "@/lib/reportPdf";
import { printReportHtml } from "@/lib/nativePrinter";
import { registerNativePreviewCloser } from "@/lib/capacitorNavigation";
import {
  NATIVE_BROWSER_PRINT_PREVIEW_EVENT,
  NATIVE_DOCUMENT_PRINT_PREVIEW_EVENT,
  type NativeBrowserPrintPreviewRequest,
  type NativeDocumentPrintPreviewRequest,
} from "@/lib/nativePrintPreviewEvents";

type PreviewState =
  | ({ kind: "browser" } & NativeBrowserPrintPreviewRequest)
  | ({ kind: "document" } & NativeDocumentPrintPreviewRequest);

type PreviewMessage = {
  source?: string;
  type?: "close" | "print" | "download";
  html?: string;
  settings?: Record<string, unknown>;
};

export default function NativePrintPreviewHost() {
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const previewRef = useRef<PreviewState | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const updatePreview = useCallback((next: PreviewState | null) => {
    previewRef.current = next;
    setPreview(next);
  }, []);

  useEffect(() => {
    const handleBrowserPreview = (event: Event) => {
      const detail = (event as CustomEvent<NativeBrowserPrintPreviewRequest>).detail;
      if (detail?.html) updatePreview({ kind: "browser", ...detail });
    };

    const handleDocumentPreview = (event: Event) => {
      const detail = (event as CustomEvent<NativeDocumentPrintPreviewRequest>).detail;
      if (detail?.html) updatePreview({ kind: "document", ...detail });
    };

    const handleFrameMessage = async (event: MessageEvent) => {
      const activePreview = previewRef.current;
      if (
        !activePreview ||
        activePreview.kind !== "browser" ||
        event.source !== iframeRef.current?.contentWindow
      ) return;

      const message = event.data as PreviewMessage | null;
      if (!message || message.source !== "mizan-print-preview") return;

      if (message.type === "close") {
        updatePreview(null);
        return;
      }

      if (message.type === "print") {
        if (!message.html) return;
        if (!printReportHtml(message.html, activePreview.title)) {
          toast.error("تعذرت طباعة التقرير من المعاينة");
        }
        return;
      }

      if (message.type === "download") {
        try {
          const paper = iframeRef.current?.contentDocument?.getElementById("paperContainer");
          if (!paper) throw new Error("لم يتم العثور على صفحة التقرير");
          await downloadRenderedReportPdf(paper, {
            ...message.settings,
            fileName: activePreview.fileName,
          } as Parameters<typeof downloadRenderedReportPdf>[1]);
          toast.success("تم تنزيل ملف PDF");
        } catch (error) {
          console.error("Native preview PDF download failed:", error);
          toast.error("تعذر تنزيل PDF من المعاينة");
        }
      }
    };

    window.addEventListener(NATIVE_BROWSER_PRINT_PREVIEW_EVENT, handleBrowserPreview);
    window.addEventListener(NATIVE_DOCUMENT_PRINT_PREVIEW_EVENT, handleDocumentPreview);
    window.addEventListener("message", handleFrameMessage);
    return () => {
      window.removeEventListener(NATIVE_BROWSER_PRINT_PREVIEW_EVENT, handleBrowserPreview);
      window.removeEventListener(NATIVE_DOCUMENT_PRINT_PREVIEW_EVENT, handleDocumentPreview);
      window.removeEventListener("message", handleFrameMessage);
    };
  }, [updatePreview]);

  useEffect(() => {
    if (!preview) return;
    return registerNativePreviewCloser(() => {
      updatePreview(null);
      return true;
    });
  }, [preview, updatePreview]);

  if (!preview) return null;

  if (preview.kind === "browser") {
    return (
      <div className="fixed inset-0 z-[10000] h-[100dvh] w-screen overflow-hidden bg-[#525659]">
        <iframe
          ref={iframeRef}
          srcDoc={preview.html}
          title={`معاينة الطباعة - ${preview.title}`}
          className="block h-full w-full border-0 bg-white"
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[10000] flex h-[100dvh] w-screen flex-col bg-slate-800" dir="rtl">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-sky-400/20 bg-[#0d2a3a] px-3 py-2.5 text-white shadow-md sm:px-4">
        <div className="min-w-0 truncate text-sm font-bold text-sky-100">معاينة الطباعة: {preview.title}</div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => printReportHtml(preview.html, preview.title)}
            className="flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow active:scale-95"
          >
            <Printer className="h-4 w-4" />
            <span>طباعة الآن</span>
          </button>
          <button
            type="button"
            onClick={() => updatePreview(null)}
            aria-label="إغلاق المعاينة"
            className="flex min-h-10 min-w-10 items-center justify-center rounded-lg bg-rose-600/90 text-white active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>
      <iframe
        ref={iframeRef}
        srcDoc={preview.html}
        title={`معاينة التقرير - ${preview.title}`}
        className="min-h-0 flex-1 border-0 bg-white"
      />
    </div>
  );
}
