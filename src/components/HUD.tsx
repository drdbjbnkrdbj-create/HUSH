/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameEngineState } from '../game/GameEngine';
import { Mic, Volume2, Shield, Eye, AlertTriangle, Key, Maximize2 } from 'lucide-react';

interface HUDProps {
  state: GameEngineState;
  onPause: () => void;
  onInteract: () => void;
}

export const HUD: React.FC<HUDProps> = ({ state, onPause, onInteract }) => {
  // Determine noise gauge color
  const noisePct = Math.min(100, Math.round(state.micNoiseLevel * 100));
  let noiseColor = 'bg-emerald-500';
  let noiseText = 'صامت';

  if (state.micCategory === 'shout') {
    noiseColor = 'bg-red-600 animate-pulse';
    noiseText = 'صراخ (خطر داهم!)';
  } else if (state.micCategory === 'normal') {
    noiseColor = 'bg-amber-500';
    noiseText = 'كلام عادي (مسموع)';
  } else if (state.micCategory === 'whisper') {
    noiseColor = 'bg-yellow-400';
    noiseText = 'همس خافت';
  }

  // Guard state styling
  const isChase = state.guardState === 'CHASE';
  const isInvestigate = state.guardState === 'INVESTIGATE';
  const isSearch = state.guardState === 'SEARCH';

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Header Cluster */}
      <div className="flex items-start justify-between w-full">
        {/* Top-Right: Objective & Collectibles Counter (Arabic RTL) */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 shadow-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-950/80 border border-red-700/60 flex items-center justify-center text-red-300 font-bold text-sm">
              {state.itemsCollectedCount}/{state.totalItemsCount}
            </div>
            <div>
              <div className="text-xs text-slate-400 font-bold">العناصر المطلوبة للهروب</div>
              <div className="text-sm font-black text-slate-100 flex items-center gap-1.5">
                {state.isExitUnlocked ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Key className="w-4 h-4 text-emerald-400" />
                    الباب مفتوح! توجه للمخرج
                  </span>
                ) : (
                  <span>اجمع البضائع وتجنب الحارس</span>
                )}
              </div>
            </div>
          </div>

          {/* Collectible Item Icons */}
          <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800/80 rounded-lg px-2.5 py-1.5 w-fit">
            {state.items.map((item) => (
              <div
                key={item.id}
                title={item.nameAr}
                className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border transition-all ${
                  item.collected
                    ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900 border-slate-700 text-slate-500'
                }`}
              >
                {item.collected ? '✓' : '•'}
              </div>
            ))}
          </div>
        </div>

        {/* Top-Center: Guard Alert Warning Banner */}
        <div className="flex flex-col items-center">
          {isChase && (
            <div className="bg-red-950/90 border-2 border-red-600 text-white px-5 py-2 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-sm font-extrabold tracking-wide">
                خطر! الحارس رآك ويطاردك الآن!
              </span>
            </div>
          )}

          {isInvestigate && !isChase && (
            <div className="bg-amber-950/90 border border-amber-600/80 text-amber-200 px-4 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold">
                الحارس سمع صوتاً ويتجه للتحقيق...
              </span>
            </div>
          )}

          {isSearch && !isChase && (
            <div className="bg-yellow-950/80 border border-yellow-600/70 text-yellow-200 px-4 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
              <Eye className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-bold">
                الحارس يتفقد الرفوف المحيطة بحثاً عنك
              </span>
            </div>
          )}

          {state.isPlayerHidden && (
            <div className="mt-1 bg-emerald-950/85 border border-emerald-600/80 text-emerald-300 px-3.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>مختبئ في مكان آمن (محمي من الرؤية)</span>
            </div>
          )}
        </div>

        {/* Top-Left: Pause & Fullscreen Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
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
            className="w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-slate-500 text-amber-400 flex items-center justify-center font-bold text-sm shadow-md transition-colors"
            title="ملء الشاشة والوضع العريض"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            onClick={onPause}
            className="w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-slate-500 text-slate-200 flex items-center justify-center font-bold text-sm shadow-md transition-colors"
            title="إيقاف مؤقت (Esc)"
          >
            ⏸
          </button>
        </div>
      </div>

      {/* Center: Interaction prompt banner when close to items/exit */}
      {state.nearbyInteractable && (
        <div className="self-center pointer-events-auto mb-12">
          <button
            onClick={onInteract}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-2.5 rounded-xl border-2 border-amber-300 shadow-2xl flex items-center gap-3 transition-transform hover:scale-105 active:scale-95"
          >
            <span className="bg-slate-950 text-amber-400 px-2 py-0.5 rounded text-xs font-bold">
              [E] أو زر التفاعل
            </span>
            <span className="text-sm">{state.nearbyInteractable}</span>
          </button>
        </div>
      )}

      {/* Bottom Perimeter HUD: Microphone Meter & Stamina */}
      <div className="flex items-end justify-between w-full pointer-events-none">
        {/* Bottom-Right: Microphone Noise Detector Gauge */}
        <div className="bg-slate-950/85 border border-slate-800 rounded-xl p-3 shadow-xl flex flex-col gap-1.5 w-60 pointer-events-auto">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-bold text-slate-300">
              <Mic className="w-3.5 h-3.5 text-red-400" />
              مقياس ضوضاء الميكروفون
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              {noiseText}
            </span>
          </div>

          {/* Loudness Bar */}
          <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800 flex">
            <div
              className={`h-full transition-all duration-75 ${noiseColor}`}
              style={{ width: `${noisePct}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 px-0.5 font-mono">
            <span>هدوء</span>
            <span>همس</span>
            <span>عادي</span>
            <span className="text-red-400 font-bold">خطر!</span>
          </div>
        </div>

        {/* Bottom-Left: Stamina Bar & PC Control hints */}
        <div className="flex flex-col items-start gap-1.5 pointer-events-auto">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 shadow-xl flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-300">طاقة الركض</span>
            <div className="w-28 bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-100 ${
                  state.stamina < 20 ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.round(state.stamina)}%` }}
              />
            </div>
          </div>

          {/* PC Keyboard hints for testing */}
          <div className="hidden sm:flex text-[11px] text-slate-500 bg-slate-950/60 border border-slate-900 px-2.5 py-1 rounded-lg gap-2">
            <span>WASD حركة</span>
            <span>•</span>
            <span>Shift ركض</span>
            <span>•</span>
            <span>C انحناء</span>
            <span>•</span>
            <span>F كشاف</span>
            <span>•</span>
            <span>E تفاعل</span>
          </div>
        </div>
      </div>
    </div>
  );
};
