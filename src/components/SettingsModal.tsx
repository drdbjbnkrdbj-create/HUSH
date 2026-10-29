/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Mic, Volume2, Sliders, Smartphone, Check, AlertCircle } from 'lucide-react';
import { micDetector } from '../audio/MicNoiseDetector';
import { soundSynth } from '../audio/SoundSynth';
import { PlayerController } from '../game/PlayerController';

interface SettingsModalProps {
  onClose: () => void;
  player: PlayerController | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, player }) => {
  const [masterVol, setMasterVol] = useState(soundSynth.masterVolume);
  const [sfxVol, setSfxVol] = useState(soundSynth.sfxVolume);
  const [sensitivity, setSensitivity] = useState(player ? player.sensitivity * 1000 : 2.2);
  const [micSensitivity, setMicSensitivity] = useState(micDetector.settings.sensitivity);
  const [micState, setMicState] = useState(micDetector.permissionState);
  const [testAmplitude, setTestAmplitude] = useState(0);
  const [graphicsQuality, setGraphicsQuality] = useState<'low' | 'medium' | 'high'>('medium');

  // Mic test update interval
  useEffect(() => {
    const interval = setInterval(() => {
      setTestAmplitude(micDetector.currentAmplitude);
      setMicState(micDetector.permissionState);
    }, 60);
    return () => clearInterval(interval);
  }, []);

  const handleRequestMic = async () => {
    const granted = await micDetector.requestMicAccess();
    setMicState(granted ? 'granted' : 'denied');
  };

  const handleMasterVolChange = (v: number) => {
    setMasterVol(v);
    soundSynth.setMasterVolume(v);
  };

  const handleSfxVolChange = (v: number) => {
    setSfxVol(v);
    soundSynth.setSfxVolume(v);
  };

  const handleSensitivityChange = (v: number) => {
    setSensitivity(v);
    if (player) {
      player.sensitivity = v / 1000;
    }
  };

  const handleMicSensitivityChange = (v: number) => {
    setMicSensitivity(v);
    micDetector.settings.sensitivity = v;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-bold text-slate-100">الإعدادات والميكروفون</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Content */}
        <div className="py-4 space-y-6 text-sm">
          {/* 1. Microphone Setup & Live Test */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <Mic className="w-4 h-4 text-red-400" />
                <span>حالة الميكروفون المباشر</span>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                  micState === 'granted'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : micState === 'denied'
                    ? 'bg-red-950 text-red-400 border border-red-800'
                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}
              >
                {micState === 'granted'
                  ? 'مفعل وجاهز ✓'
                  : micState === 'denied'
                  ? 'تم الرفض ✕'
                  : 'في انتظار الإذن'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              الميكروفون جوهر لعبة HUSH! حيث يسمعك حارس الأمن في حال تحدثت أو صرخت. لا يتم رفع أي تسجيلات إلى الإنترنت ويتم القياس في الذاكرة المحلية فقط.
            </p>

            {micState !== 'granted' && (
              <button
                onClick={handleRequestMic}
                className="w-full py-2.5 px-4 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
              >
                <Mic className="w-4 h-4" />
                <span>تفعيل الميكروفون واختبار الصوت الآن</span>
              </button>
            )}

            {/* Live Audio Test Gauge */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>اختبار مستوى التقاط الصوت الحي:</span>
                <span className="font-mono text-slate-300">
                  {Math.round(testAmplitude * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 flex">
                <div
                  className={`h-full transition-all duration-75 ${
                    testAmplitude > 0.65
                      ? 'bg-red-500'
                      : testAmplitude > 0.35
                      ? 'bg-amber-500'
                      : testAmplitude > 0.15
                      ? 'bg-yellow-400'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.round(testAmplitude * 100))}%` }}
                />
              </div>
            </div>

            {/* Mic Sensitivity Slider */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>حساسية لاقط الصوت:</span>
                <span className="font-mono text-slate-300">{micSensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={micSensitivity}
                onChange={(e) => handleMicSensitivityChange(parseFloat(e.target.value))}
                className="w-full accent-red-600 bg-slate-950 h-2 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* 2. Audio Volumes */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Volume2 className="w-4 h-4 text-slate-400" />
              <span>مستويات الصوت (Volume)</span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>الصوت الرئيسي (Master):</span>
                <span className="font-mono text-slate-300">{Math.round(masterVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={masterVol}
                onChange={(e) => handleMasterVolChange(parseFloat(e.target.value))}
                className="w-full accent-red-600 bg-slate-950 h-2 rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>المؤثرات الصوتية والأقدام (SFX):</span>
                <span className="font-mono text-slate-300">{Math.round(sfxVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={sfxVol}
                onChange={(e) => handleSfxVolChange(parseFloat(e.target.value))}
                className="w-full accent-red-600 bg-slate-950 h-2 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* 3. Mobile Touch & Camera Sensitivity */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Smartphone className="w-4 h-4 text-slate-400" />
              <span>حساسية اللمس والكاميرا</span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>سرعة دوران الكاميرا:</span>
                <span className="font-mono text-slate-300">{sensitivity.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.2"
                value={sensitivity}
                onChange={(e) => handleSensitivityChange(parseFloat(e.target.value))}
                className="w-full accent-red-600 bg-slate-950 h-2 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* 4. Graphics Quality Preset */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300">جودة الرسوميات (Android Preset)</span>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => setGraphicsQuality(q)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                    graphicsQuality === q
                      ? 'bg-red-950 border-red-600 text-red-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {q === 'low' ? 'منخفضة (30fps)' : q === 'medium' ? 'متوازنة (60fps)' : 'عالية (ظلال ناعمة)'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            حفظ وإغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
