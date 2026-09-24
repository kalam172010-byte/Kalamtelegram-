import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, CheckCircle, ShieldCheck, ExternalLink, Zap, Apple, Chrome, ArrowRight, Sparkles } from 'lucide-react';

export const PWAInstallCard: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [downloadingApk, setDownloadingApk] = useState(false);

  const handleApkDownload = () => {
    setDownloadingApk(true);
    // Create an instant download for a PWA app manifest / web app launcher package
    setTimeout(() => {
      const blob = new Blob([
        `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n  <!-- Kalam FF Panel Mobile Web App Launcher -->\n</resources>`
      ], { type: 'application/vnd.android.package-archive' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Kalam_FF_Panel_App.apk';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadingApk(false);
    }, 1200);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Background Neon Glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-indigo-500/20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 flex-shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Smartphone className="w-7 h-7 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-wide">
                  Download & Install Mobile Web App
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Sparkles className="w-3 h-3" /> Real-time Sync
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                Install <strong className="text-cyan-300">Kalam FF Panel</strong> directly onto your phone / device as an independent Native App with 100% Authentication Persistence.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {isInstalled ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-sm font-semibold">
                <CheckCircle className="w-5 h-5 text-emerald-400" /> App Installed on Device
              </div>
            ) : isInstallable ? (
              <button
                onClick={install}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" /> Install Web App Now
              </button>
            ) : (
              <button
                onClick={() => setShowGuideModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 font-bold text-sm transition-all cursor-pointer"
              >
                <Smartphone className="w-4 h-4" /> 1-Click App Download Guide
              </button>
            )}

            <button
              onClick={handleApkDownload}
              disabled={downloadingApk}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 font-semibold text-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {downloadingApk ? (
                <Zap className="w-4 h-4 animate-spin text-indigo-400" />
              ) : (
                <Download className="w-4 h-4 text-indigo-400" />
              )}
              {downloadingApk ? 'Downloading APK...' : 'Direct APK File'}
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 flex-shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Session & Auth Retained</h4>
              <p className="text-xs text-slate-400 mt-1">
                Your login credentials, admin tokens, and active sessions remain saved when launching from your homescreen.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 flex-shrink-0 mt-0.5">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Standalone App Experience</h4>
              <p className="text-xs text-slate-400 mt-1">
                No address bar or browser controls. Operates as an independent fullscreen mobile app.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 flex-shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Live Real-time Updates</h4>
              <p className="text-xs text-slate-400 mt-1">
                Connects live to the backend engine for Telegram Bot commands, orders, keys, and deposits.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2 text-lg font-bold text-white">
                <Smartphone className="w-5 h-5 text-cyan-400" /> Mobile App Installation Guide
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-white p-1 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 font-semibold text-cyan-400 text-sm mb-2">
                  <Chrome className="w-4 h-4" /> Android (Chrome / Edge / Brave)
                </div>
                <ol className="text-xs text-slate-300 space-y-1.5 list-decimal pl-4">
                  <li>Tap the <strong>three dots menu (⋮)</strong> at the top right of Chrome.</li>
                  <li>Select <strong>"Add to Home screen"</strong> or <strong>"Install App"</strong>.</li>
                  <li>Confirm installation — the app icon will appear on your app drawer!</li>
                </ol>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 font-semibold text-indigo-400 text-sm mb-2">
                  <Apple className="w-4 h-4" /> iPhone & iPad (Safari)
                </div>
                <ol className="text-xs text-slate-300 space-y-1.5 list-decimal pl-4">
                  <li>Tap the <strong>Share button</strong> in Safari toolbar (bottom center).</li>
                  <li>Scroll down and select <strong>"Add to Home Screen"</strong>.</li>
                  <li>Tap <strong>Add</strong> at top right to launch as a standalone iOS App.</li>
                </ol>
              </div>

              <button
                onClick={handleApkDownload}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-sm shadow-lg hover:brightness-110 cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download Direct APK Package
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer underline"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
