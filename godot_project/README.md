# HUSH! — Offline 3D Co-op Horror Game Foundation
**محرك اللعبة: Godot Engine 4.3 (Mobile Renderer / Android Target)**

---

## 1. فكرة اللعبة وميكانيكية الرعب (Game Concept)
تدخل سوبرماركت صغير ليلاً؛ مهمتك جمع 5 عناصر غذائية أساسية وتفعيل بوابة الطوارئ للهروب دون أن يمسك بك حارس الأمن المتحكم به بواسطة الذكاء الاصطناعي (AI FSM).
الميزة الجوهرية: **كلما كان صوتك أعلى في الميكروفون الحقيقي أو حركتك، زادت خطورة اكتشافك!**

---

## 2. متطلبات التشغيل والتطوير (Requirements)
- **Godot Engine 4.2+ أو 4.3+** (Standard Edition)
- **Android SDK & OpenJDK 17** (لتصدير APK للهواتف)
- **VS Code** مع إضافة `godot-tools` و `gdscript-toolkit`

---

## 3. تعليمات فتح المشروع في VS Code و Godot Engine
1. انسخ ملفات مجلد `godot_project` إلى جهازك.
2. افتح Godot Engine واضغط على **Import** ثم حدد ملف `project.godot`.
3. لتعديل الأكواد في **VS Code**:
   - افتح مجلد المشروع في VS Code.
   - الإعدادات معدة مسبقاً في `.vscode/settings.json` للاتصال بخادم Godot Language Server على المنفذ `6005`.

---

## 4. إعداد تصدير Android وأذونات الميكروفون (Android APK Export)
1. في Godot Engine: اذهب إلى **Project -> Export**.
2. اختر إعداد التصدير المرفق **Android** الموجود في `export_presets.cfg`.
3. تأكد من تفعيل الصلاحية:
   `android.permission.RECORD_AUDIO = true`
4. حدد مسار ملف الـ APK واضغط على **Export Project**.

---

## 5. اختبار نظام الميكروفون الحقيقي على Android
- تتم معالجة سعة الصوت محلياً (RMS Amplitude) بنسبة 100% داخل ذاكرة الهاتف بدون رفع أي تسجيلات إلى أي خادم خارجي.
- يوفر النظام حماية من التنبيهات الكاذبة عبر نافذة زمنية مؤكدة (EMA Smoothing + 120ms Threshold).
- يمكنك تجربة اللعبة مباشرة على متصفح الجوال أو الحاسوب في AI Studio قبل تصدير ملف الـ APK!
