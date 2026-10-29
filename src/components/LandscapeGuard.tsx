/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Smartphone, Maximize2, Check } from 'lucide-react';

interface LandscapeGuardProps {
  onDismiss: () => void;
  onRequestFullscreen: () => void;
}

export const LandscapeGuard: React.FC<LandscapeGuardProps> = ({
  onDismiss,
  onRequestFullscreen,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-md select-none text-center">
      <div className="bg-slate-900 border-2 border-red-600/80 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center animate-in fade-in duration-300">
        {/* Animated Rotating Phone Icon */}
        <div className="relative w-24 h-24 mb-5 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-red-500/50 animate-spin [animation-duration:8s]" />
          <div className="relative w-14 h-20 rounded-2xl border-4 border-slate-200 bg-slate-800 flex items-center justify-center shadow-lg transform rotate-90 transition-transform duration-700">
            <div className="w-8 h-12 rounded-lg bg-red-950/80 border border-red-500/50 flex items-center justify-center">
              <span className="text-[10px] font-black text-red-400">HUSH!</span>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-black text-slate-100 mb-2 font-horror tracking-wider">
          وضع الهاتف العرضي (Landscape Mode)
        </h3>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
          صُممت اللعبة وعصا التحكم الافتراضية وشاشات الرؤية خصيصاً للوضع الأفقي العريض لتمنحك تحكماً مثالياً وتجربة رعب غامرة.
        </p>

        <div className="flex flex-col w-full gap-2.5">
          <button
            onClick={onRequestFullscreen}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-red-950/80 active:scale-95 transition-all"
          >
            <Maximize2 className="w-4 h-4" />
            <span>تفعيل ملء الشاشة الأفقي</span>
          </button>

          <button
            onClick={onDismiss}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-bold text-xs border border-slate-800 transition-colors"
          >
            المتابعة بهذا الوضع
          </button>
        </div>
      </div>
    </div>
  );
};
