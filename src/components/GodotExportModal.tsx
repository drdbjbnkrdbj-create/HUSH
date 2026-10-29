/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Download, Code, FileText, Check, Copy, ExternalLink, Terminal } from 'lucide-react';
import { GODOT_PROJECT_FILES, generateGodotProjectZip } from '../godot/godotFiles';

interface GodotExportModalProps {
  onClose: () => void;
}

export const GodotExportModal: React.FC<GodotExportModalProps> = ({ onClose }) => {
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);

  const currentFile = GODOT_PROJECT_FILES[selectedFileIdx];

  const handleCopy = () => {
    if (!currentFile) return;
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsExportingZip(true);
      const zipBlob = await generateGodotProjectZip();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Hush_Godot4_Android_Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to create ZIP package:', e);
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-4xl p-6 shadow-2xl flex flex-col h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">
                حزمة مشروع Godot 4.3 ومصدر تصدير Android
              </h2>
              <p className="text-xs text-slate-400">
                جميع ملفات المشروع مكتوبة بالكامل وجاهزة للاستيراد في Godot 4 ومتابعة التطوير في VS Code.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              disabled={isExportingZip}
              className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingZip ? 'جارٍ التحزيم...' : 'تحميل المشروع كاملاً (ZIP)'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Instructions banner */}
        <div className="my-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>
              <strong>خطوات التشغيل السريع:</strong> 1) حمّل ملف ZIP 2) افتح Godot 4.3 واختر Import 3) صدّر APK مع إذن الميكروفون
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">Renderer: Mobile</span>
            <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">Target: Android</span>
          </div>
        </div>

        {/* Main Body: File Browser (Left/Right) & Code Viewer */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
          {/* File Explorer List */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 overflow-y-auto space-y-1">
            <div className="text-[11px] font-bold text-slate-400 px-2 pb-1.5 border-b border-slate-800/80 mb-1">
              ملفات المشروع ({GODOT_PROJECT_FILES.length})
            </div>
            {GODOT_PROJECT_FILES.map((f, idx) => (
              <button
                key={f.path}
                onClick={() => setSelectedFileIdx(idx)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                  selectedFileIdx === idx
                    ? 'bg-emerald-950/80 border border-emerald-600/80 text-emerald-300 font-bold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {f.path.endsWith('.gd') ? (
                    <Code className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  ) : f.path.endsWith('.tscn') ? (
                    <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  )}
                  <span className="truncate">{f.path}</span>
                </div>
                <span className="text-[10px] text-slate-500 uppercase">{f.category}</span>
              </button>
            ))}
          </div>

          {/* Code Viewer */}
          <div className="md:col-span-2 bg-slate-950 border border-slate-800 rounded-xl flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {currentFile?.path}
              </span>
              <button
                onClick={handleCopy}
                className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ الكود'}</span>
              </button>
            </div>

            <pre className="flex-1 p-4 font-mono text-xs text-slate-300 overflow-auto bg-slate-950/90 whitespace-pre leading-relaxed select-text">
              {currentFile?.content}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>
            جاهز للاستخدام مع محرك Godot 4.3 الرسمي وتصدير APK للهواتف بدون تعديلات إضافية.
          </span>
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
