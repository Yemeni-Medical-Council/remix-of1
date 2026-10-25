import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export default function OfflineStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const updateConnectionState = () => setIsOffline(!navigator.onLine);
    updateConnectionState();
    window.addEventListener("offline", updateConnectionState);
    window.addEventListener("online", updateConnectionState);

    return () => {
      window.removeEventListener("offline", updateConnectionState);
      window.removeEventListener("online", updateConnectionState);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-[100] flex min-h-9 items-center justify-center gap-2 bg-[#7f1d1d] px-3 py-2 text-center text-xs font-bold text-white shadow-md sm:text-sm"
      role="status"
      aria-live="polite"
      dir="rtl"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        تعمل الآن دون اتصال بالإنترنت — البيانات المعروضة محفوظة على الجهاز وقد لا تكون محدثة.
      </span>
    </div>
  );
}
