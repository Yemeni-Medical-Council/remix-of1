export const NATIVE_BROWSER_PRINT_PREVIEW_EVENT = "mizan:native-browser-print-preview";
export const NATIVE_DOCUMENT_PRINT_PREVIEW_EVENT = "mizan:native-document-print-preview";

export interface NativeBrowserPrintPreviewRequest {
  html: string;
  title: string;
  fileName: string;
}

export interface NativeDocumentPrintPreviewRequest {
  html: string;
  title: string;
}
