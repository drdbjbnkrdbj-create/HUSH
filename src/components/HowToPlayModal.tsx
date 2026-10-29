/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Mic, Eye, Shield, Key, Footprints, AlertTriangle } from 'lucide-react';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-bold text-slate-100">طريقة اللعب وقواعد البقاء</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {/* Card 1: Main Objective */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex gap-3 items-start">
            <div className="p-2 rounded-lg bg-red-950/80 border border-red-700/60 text-red-400 shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm mb-1">الهدف: جمع 5 عناصر والهروب</h3>
              <p className="text-slate-400">
                أنت محتجز في السوبرماركت ليلاً. عليك العثور على: 
                <span className="text-slate-200 font-semibold"> حليب معقم، معلبات تونة، منظف أرضيات، بطاريات كشاف، وبطاقة الطوارئ</span>.
                بمجرد جمعها، ستتحول إشارة باب الخروج إلى اللون الأخضر لتتمكن من فتحه والهروب!
              </p>
            </div>
          </div>

          {/* Card 2: Real Microphone Mechanics */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex gap-3 items-start">
            <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-700/60 text-amber-400 shrink-0">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-amber-300 text-sm mb-1">الميكروفون: الصمت هو نجاتك الوحيدة!</h3>
              <p className="text-slate-400">
                الحارس يستمع لأي صوت يصدر منك في الواقع. إذا تحدثت أو ضحكت أو صرخت، سيرصد الحارس موقع صوتك ويتجه نحوك مسرعاً.
                تأكد من مراقبة مقياس الصوت أسفل الشاشة؛ الهمس الخفيف أقل خطورة بكثير من الكلام العادي.
              </p>
            </div>
          </div>

          {/* Card 3: Guard AI & States */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex gap-3 items-start">
            <div className="p-2 rounded-lg bg-blue-950/80 border border-blue-700/60 text-blue-400 shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm mb-1">حالات ذكاء حارس الأمن (AI)</h3>
              <ul className="list-disc list-inside text-slate-400 space-y-1">
                <li><strong className="text-slate-200">دورية (Patrol):</strong> يتجول بهدوء بين الممرات بمصباحه الأصفر.</li>
                <li><strong className="text-slate-200">تحقيق (Investigate):</strong> عند سماع صوت، يتحرك نحو مصدر الصوت.</li>
                <li><strong className="text-slate-200">تفتيش (Search):</strong> يمسح الزوايا برأسه ومصباحه عند وصوله للمكان.</li>
                <li><strong className="text-red-400">مطاردة (Chase):</strong> إذا رآك، سيتحول ضوء مصباحه للأحمر ويركض للإمساك بك!</li>
              </ul>
            </div>
          </div>

          {/* Card 4: Hiding & Stealth */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex gap-3 items-start">
            <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-300 text-sm mb-1">الانحناء والمخابئ الآمنة</h3>
              <p className="text-slate-400">
                الانحناء يخفض خط رؤية الحارس بنسبة 45% ويجعل خطواتك صامتة تماماً.
                استفد من الصناديق في غرفة التخزين الخلفية وخلف منصات المحاسبة؛ يظهر لك مؤشر 
                <span className="text-emerald-400 font-semibold"> "مختبئ في مكان آمن" </span>
                عندما تكون في زاوية لا يستطيع الحارس اختراقها بصرياً.
              </p>
            </div>
          </div>

          {/* Card 5: Controls */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex gap-3 items-start">
            <div className="p-2 rounded-lg bg-purple-950/80 border border-purple-700/60 text-purple-400 shrink-0">
              <Footprints className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm mb-1">عناصر التحكم (Controls)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400">
                <div>
                  <strong className="text-slate-200">على الجوال:</strong>
                  <div>• عصا تحكم افتراضية على اليسار</div>
                  <div>• سحب الشاشة على اليمين للنظر</div>
                  <div>• أزرار الركض والانحناء والكشاف والتفاعل</div>
                </div>
                <div>
                  <strong className="text-slate-200">على الحاسوب:</strong>
                  <div>• WASD: حركة وتسلل</div>
                  <div>• Shift: ركض (يصدر ضوضاء)</div>
                  <div>• C: انحناء | F: تشغيل الكشاف</div>
                  <div>• E: التقاط وتفاعل | Esc: إيقاف</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs transition-colors"
          >
            فهمت، جاهز للعب!
          </button>
        </div>
      </div>
    </div>
  );
};
