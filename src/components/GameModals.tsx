/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, RotateCcw, Home, Settings, Award, Skull, Key, Download } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onOpenSettings,
  onMainMenu,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-none">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col text-center">
        <h2 className="text-2xl font-black text-slate-100 mb-1">اللعبة متوقفة مؤقتاً</h2>
        <p className="text-xs text-slate-400 mb-6">الحارس ينتظرك في الظلام...</p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onResume}
            className="w-full py-3.5 px-4 rounded-xl bg-red-700 hover:bg-red-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>متابعة التسلل (RESUME)</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>إعادة تشغيل المرحلة (RESTART)</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-800 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>الإعدادات والميكروفون</span>
          </button>

          <button
            onClick={onMainMenu}
            className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-400 font-bold text-xs flex items-center justify-center gap-2 border border-slate-800/80 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>العودة للقائمة الرئيسية</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface GameOverModalProps {
  onRestart: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ onRestart, onMainMenu }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/40 backdrop-blur-md select-none animate-in fade-in duration-300">
      <div className="bg-slate-950 border-2 border-red-600/80 rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-950 border border-red-600 flex items-center justify-center text-red-400 mb-4 shadow-xl">
          <Skull className="w-9 h-9" />
        </div>

        <h2 className="text-3xl font-black text-red-500 mb-2 font-horror tracking-wider">
          تم الإمساك بك!
        </h2>
        <p className="text-slate-300 text-xs sm:text-sm mb-6 max-w-xs leading-relaxed">
          سمع حارس الأمن صوتك أو رآك تتسلل بين الرفوف! تذكر: الصمت هو مفتاح النجاة في السوبرماركت.
        </p>

        <div className="flex flex-col w-full gap-3">
          <button
            onClick={onRestart}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-red-950/80 transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>إعادة المحاولة مجدداً</span>
          </button>

          <button
            onClick={onMainMenu}
            className="w-full py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 border border-slate-800 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>العودة للقائمة الرئيسية</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface VictoryModalProps {
  onRestart: () => void;
  onMainMenu: () => void;
  onOpenGodotExport: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  onRestart,
  onMainMenu,
  onOpenGodotExport,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/30 backdrop-blur-md select-none animate-in fade-in duration-300">
      <div className="bg-slate-950 border-2 border-emerald-500/80 rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-950 border border-emerald-500 flex items-center justify-center text-emerald-400 mb-4 shadow-xl">
          <Award className="w-9 h-9" />
        </div>

        <h2 className="text-3xl font-black text-emerald-400 mb-2 font-horror tracking-wider">
          نجحت في الهروب!
        </h2>
        <p className="text-slate-300 text-xs sm:text-sm mb-6 max-w-xs leading-relaxed">
          أحسنت! تمكنت من جمع العناصر الخمسة بهدوء وتفعيل مخرج الطوارئ والهروب دون أن يمسك بك حارس الأمن.
        </p>

        <div className="flex flex-col w-full gap-3">
          <button
            onClick={onRestart}
            className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/80 transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>العب مجدداً في السوبرماركت</span>
          </button>

          <button
            onClick={onOpenGodotExport}
            className="w-full py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 border border-emerald-800/60 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>تحميل ملفات Godot 4 و APK</span>
          </button>

          <button
            onClick={onMainMenu}
            className="w-full py-3 px-6 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-400 font-bold text-xs flex items-center justify-center gap-2 border border-slate-800/80 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>العودة للقائمة الرئيسية</span>
          </button>
        </div>
      </div>
    </div>
  );
};
