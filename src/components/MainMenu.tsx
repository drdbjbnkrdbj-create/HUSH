/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Settings, BookOpen, Download, Volume2, VolumeX, Mic, Maximize2 } from 'lucide-react';
import { soundSynth } from '../audio/SoundSynth';

interface MainMenuProps {
  onStartGame: () => void;
  onOpenSettings: () => void;
  onOpenHowToPlay: () => void;
  onOpenGodotExport: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onOpenSettings,
  onOpenHowToPlay,
  onOpenGodotExport,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-6 sm:p-10 select-none bg-radial from-transparent via-black/40 to-black/85">
      {/* Top Bar with Mute Toggle & Platform Badge */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-red-950/80 border border-red-700/60 text-red-400 font-bold text-xs tracking-wider">
            3D STEALTH HORROR • GODOT 4.3 & WEB
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (document.documentElement.requestFullscreen) {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                  if ('orientation' in screen && 'lock' in screen.orientation) {
                    (screen.orientation as unknown as { lock: (orientation: string) => Promise<void> }).lock('landscape').catch(() => {});
                  }
                } else {
                  document.exitFullscreen().catch(() => {});
                }
              }
            }}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-600 text-slate-300 transition-colors"
            title="ملء الشاشة والوضع الأفقي"
          >
            <Maximize2 className="w-5 h-5 text-amber-400" />
          </button>

          <button
            onClick={onToggleMute}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-600 text-slate-300 transition-colors"
            title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Main Title & CTA Center Area */}
      <div className="flex flex-col items-center justify-center text-center my-auto max-w-xl mx-auto">
        {/* Blood Red Horror Title Lockup */}
        <div className="relative mb-3">
          <h1 className="text-7xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 via-red-600 to-red-950 tracking-wider font-horror drop-shadow-[0_10px_25px_rgba(220,38,38,0.5)]">
            HUSH!
          </h1>
          <div className="text-sm sm:text-base font-bold text-red-300/80 tracking-widest mt-1">
            اهـدأ... لا تُصدر أي صوت!
          </div>
        </div>

        <p className="text-slate-300 text-sm sm:text-base mb-6 leading-relaxed max-w-md">
          أنت داخل سوبرماركت مظلم ليلاً. اجمع 5 عناصر أساسية للهروب دون أن يكتشفك حارس الأمن.
          كلما علت نبرة صوتك في الميكروفون، اقترب الحارس منك!
        </p>

        {/* Microphone Notice Badge */}
        <div className="flex items-center gap-2 px-4 py-2 mb-8 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 max-w-sm">
          <Mic className="w-4 h-4 text-red-500 shrink-0" />
          <span>تعتمد اللعبة على لاقط الصوت الحي؛ جميع الحسابات تجري محلياً دون تخزين أي تسجيل.</span>
        </div>

        {/* Menu Buttons Stack */}
        <div className="flex flex-col w-full max-w-xs gap-3">
          <button
            onClick={() => {
              soundSynth.initCtx();
              onStartGame();
            }}
            className="group relative flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-black text-lg shadow-2xl shadow-red-950/80 border border-red-500/50 transition-all hover:scale-105 active:scale-95"
          >
            <Play className="w-6 h-6 fill-white" />
            <span>بدء اللعبة (PLAY)</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center justify-center gap-2.5 py-3 px-6 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 text-slate-200 font-bold text-sm border border-slate-700/80 transition-all hover:border-slate-500"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>الإعدادات والميكروفون</span>
          </button>

          <button
            onClick={onOpenHowToPlay}
            className="flex items-center justify-center gap-2.5 py-3 px-6 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 text-slate-200 font-bold text-sm border border-slate-700/80 transition-all hover:border-slate-500"
          >
            <BookOpen className="w-4 h-4 text-slate-400" />
            <span>طريقة اللعب وقواعد التسلل</span>
          </button>

          <button
            onClick={onOpenGodotExport}
            className="flex items-center justify-center gap-2.5 py-3 px-6 rounded-xl bg-slate-950/90 hover:bg-slate-900 text-emerald-400 font-bold text-xs border border-emerald-800/60 transition-all hover:border-emerald-500 shadow-md"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>تحميل مشروع Godot 4 و APK</span>
          </button>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="text-center text-xs text-slate-500">
        نسخة أساسية أصلية 3D مع ذكاء اصطناعي ودعم التصدير إلى Android و VS Code
      </div>
    </div>
  );
};
