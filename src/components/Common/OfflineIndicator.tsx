import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { offlineStorage } from '../../utils/offlineStorage';
import { WifiOff, ShieldCheck } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  const lastSync = offlineStorage.getLastSyncTime();
  const formattedSync = lastSync ? new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <aside
      aria-label="Offline Mode Notification"
      className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-amber-500/95 backdrop-blur-md text-slate-950 font-medium text-xs shadow-2xl shadow-amber-500/30 border border-amber-400/50 animate-bounce-short"
    >
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-slate-950/15 text-slate-950">
          <WifiOff className="w-4 h-4" />
        </div>
        <div>
          <p className="font-bold text-slate-950 flex items-center gap-1">
            Offline Mode Active
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" />
          </p>
          <p className="text-slate-900 text-[11px] leading-tight">
            Product catalog & balances loaded from offline cache{formattedSync ? ` (${formattedSync})` : ''}.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-950/10 text-[10px] font-bold text-slate-950 uppercase tracking-wider">
        Cached
      </div>
    </aside>
  );
};
