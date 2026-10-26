# بناء وتثبيت تطبيق Android

ملف GitHub Actions هو [Build Mizan Android APK](https://github.com/Yemeni-Medical-Council/remix-of1/actions/workflows/android-apk.yml). يبدأ البناء تلقائيًا عند دفع تغييرات إلى `main`، ويمكن تشغيله يدويًا من صفحة Actions عبر **Run workflow**.

بعد اكتمال تشغيل ناجح، افتح صفحة التشغيل في GitHub ونزّل الـArtifact باسم `Mizan-Android-APK`. فك ضغط الملف، ثم ثبّت `Mizan-Android.apk` على هاتف Xiaomi. إذا منع MIUI أو HyperOS التثبيت، اسمح لمتصفح الملفات أو المتصفح الذي نزّل الملف بتثبيت التطبيقات من هذا المصدر، ثم أعد فتح ملف APK.

يبني الـAction نسخة Debug موقّعة تلقائيًا بمفتاح Android الافتراضي؛ وهي مناسبة للتثبيت اليدوي، لكنها ليست نسخة متجر Google Play. ولإصدار تحديثات فوق النسخة المثبتة دون إزالتها، ينبغي إعداد مفتاح توقيع إصدار ثابت وحفظه بأمان في GitHub Secrets. ملفات Actions المنزّلة تُحفظ 90 يومًا.

استُخدم ملف workflow الذي أرسله المستخدم مرجعًا، مع تغيير البناء من Release غير موقّع إلى APK Debug يمكن تثبيته، وتحديث Android SDK إلى الإصدار 36 المستخدم في المشروع: [الملف المرجعي](https://github.com/Yemeni-Medical-Council/remix-of1/blob/main/.github/workflows/android-apk.yml).