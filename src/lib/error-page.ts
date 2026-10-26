/* ملف: src/lib/error-page.ts */
export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <title>مِيزان | جاري الاتصال</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body {
        font: 15px/1.6 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
        background: #eef5fb;
        color: #102f46;
        display: grid;
        place-items: center;
        min-height: 100vh;
        margin: 0;
        padding: 1.5rem;
        box-sizing: border-box;
      }
      .card {
        max-width: 26rem;
        width: 100%;
        text-align: center;
        padding: 2.25rem 1.75rem;
        background: #ffffff;
        border-radius: 1.25rem;
        border: 1px solid #b8d4e8;
        box-shadow: 0 10px 25px -5px rgba(46, 107, 138, 0.15);
      }
      .spinner {
        width: 44px;
        height: 44px;
        margin: 0 auto 1.25rem;
        border: 4px solid #b8d4e8;
        border-top-color: #2e6b8a;
        border-radius: 50%;
        animation: spin 0.85s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      h1 {
        font-size: 1.35rem;
        margin: 0 0 0.5rem;
        color: #102f46;
        font-weight: 800;
      }
      p {
        color: #4e6b80;
        font-size: 0.95rem;
        margin: 0 0 1.5rem;
        line-height: 1.6;
      }
      .actions {
        display: flex;
        gap: 0.65rem;
        justify-content: center;
        flex-wrap: wrap;
      }
      a, button {
        padding: 0.6rem 1.25rem;
        border-radius: 0.65rem;
        font: inherit;
        font-weight: 700;
        font-size: 0.9rem;
        cursor: pointer;
        text-decoration: none;
        transition: all 0.15s ease;
      }
      .primary {
        background: #2e6b8a;
        color: #ffffff;
        border: none;
      }
      .primary:hover {
        background: #22516a;
      }
      .secondary {
        background: #f4f9fd;
        color: #2e6b8a;
        border: 1px solid #b8d4e8;
      }
      .secondary:hover {
        background: #e8f2fa;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="spinner"></div>
      <h1>جاري تحميل النظام المالي</h1>
      <p>يتم تجهيز البيانات الآن، جاري الاتصال تلقائياً أو يمكنك الضغط على إعادة المحاولة.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">إعادة المحاولة الآن</button>
        <a class="secondary" href="/">الصفحة الرئيسية</a>
      </div>
    </div>
    <script>
      // إعادة المحاولة الذاتية التلقائية لتفادي التوقف عند أول تشغيل
      try {
        let retries = parseInt(sessionStorage.getItem('mizan_boot_retries') || '0', 10);
        if (retries < 2) {
          sessionStorage.setItem('mizan_boot_retries', String(retries + 1));
          setTimeout(() => location.reload(), 1200);
        } else {
          sessionStorage.removeItem('mizan_boot_retries');
        }
      } catch (e) {}
    </script>
  </body>
</html>`;
}
