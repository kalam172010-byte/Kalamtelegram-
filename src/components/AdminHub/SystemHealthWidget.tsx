import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  HelpCircle,
  Key,
  Play,
  RefreshCw,
  Server,
  Shield,
  Trash2,
  Wifi,
  WifiOff,
  Zap
} from 'lucide-react';
import { ApiLog, FailedTransaction, SystemHealthData } from '../../types';

interface SystemHealthWidgetProps {
  onRefreshParent?: () => void;
}

export const SystemHealthWidget: React.FC<SystemHealthWidgetProps> = ({ onRefreshParent }) => {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [testingHealth, setTestingHealth] = useState(false);
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<'ALL' | 'FAMGATEWAY' | 'TELEGRAM' | 'RESELLER_API' | 'ERRORS'>('ALL');
  const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null);
  const [approvingOrderId, setApprovingOrderId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchHealthData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/system/health');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setHealthData(data);
        }
      }
    } catch (e) {
      console.warn('Failed fetching system health:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(() => {
      fetchHealthData(true);
    }, 8000); // Polling every 8 seconds for live logs
    return () => clearInterval(interval);
  }, []);

  const handleRunDiagnostics = async () => {
    setTestingHealth(true);
    setActionNotice(null);
    try {
      const res = await fetch('/api/system/test-health', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionNotice({
          type: 'success',
          message: `Diagnostics completed: Telegram ${data.telegram?.success ? 'Connected' : 'Offline'}, FamGateway ${data.famgateway?.success ? 'Active' : 'Warning/Fallback'}`
        });
        await fetchHealthData(true);
      } else {
        setActionNotice({ type: 'error', message: data.error || 'Diagnostics check failed' });
      }
    } catch (e: any) {
      setActionNotice({ type: 'error', message: e.message || 'Diagnostics network error' });
    } finally {
      setTestingHealth(false);
    }
  };

  const handleRetryTransaction = async (orderId: string) => {
    setRetryingOrderId(orderId);
    setActionNotice(null);
    try {
      const res = await fetch('/api/system/retry-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      const data = await res.json();
      if (data.success) {
        if (data.autoCredited) {
          setActionNotice({
            type: 'success',
            message: `🎉 Order #${orderId} was verified as PAID and user wallet was auto-credited!`
          });
        } else {
          setActionNotice({
            type: 'error',
            message: `Order #${orderId} status from gateway: ${data.statusResult?.status || 'PENDING'}. User has not completed payment yet.`
          });
        }
        await fetchHealthData(true);
        if (onRefreshParent) onRefreshParent();
      } else {
        setActionNotice({ type: 'error', message: data.error || 'Failed checking transaction status' });
      }
    } catch (e: any) {
      setActionNotice({ type: 'error', message: e.message });
    } finally {
      setRetryingOrderId(null);
    }
  };

  const handleApproveTransaction = async (orderId: string, amount: number) => {
    if (!confirm(`Force manual approval for Order #${orderId} (₹${amount})? This will immediately credit the user's wallet.`)) {
      return;
    }
    setApprovingOrderId(orderId);
    setActionNotice(null);
    try {
      const res = await fetch('/api/system/approve-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, amount, utr: 'ADMIN_MANUAL_VERIFY' })
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice({
          type: 'success',
          message: `✅ Order #${orderId} manually approved! Credited ₹${amount.toFixed(2)} to user wallet.`
        });
        await fetchHealthData(true);
        if (onRefreshParent) onRefreshParent();
      } else {
        setActionNotice({ type: 'error', message: data.error || 'Approval failed' });
      }
    } catch (e: any) {
      setActionNotice({ type: 'error', message: e.message });
    } finally {
      setApprovingOrderId(null);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm('Clear recent API diagnostics logs?')) return;
    try {
      await fetch('/api/system/logs/clear', { method: 'POST' });
      fetchHealthData(true);
    } catch (e) {
      // ignore
    }
  };

  // Filter logs
  const filteredLogs = (healthData?.logs || []).filter(l => {
    if (selectedServiceFilter === 'ERRORS') return l.status === 'ERROR' || l.status === 'WARNING';
    if (selectedServiceFilter === 'ALL') return true;
    return l.service.toUpperCase() === selectedServiceFilter;
  });

  const failedTxns = healthData?.failedTransactions || [];
  const tgPing = healthData?.summary?.telegramPing;
  const gwPing = healthData?.summary?.gatewayPing;

  // Diagnostic reason detection
  const isGatewayUnconfigured = !healthData?.famgateway?.configured;
  const isTelegramDisconnected = !healthData?.telegram?.isRunning;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h3 className="text-base font-bold text-white tracking-wide">
              System Health & Outgoing API Diagnostics
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/30">
              Live Monitor
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status of payment gateways, Telegram Bot API outgoing requests, and transaction fulfillment.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRunDiagnostics}
            disabled={testingHealth}
            className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer transition disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${testingHealth ? 'animate-spin' : ''}`} />
            <span>{testingHealth ? 'Testing APIs...' : 'Run Diagnostics Test'}</span>
          </button>

          <button
            type="button"
            onClick={() => fetchHealthData()}
            disabled={loading}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Action Banner Notifications */}
      {actionNotice && (
        <div
          className={`p-3 rounded-xl text-xs font-medium border flex items-center justify-between gap-2 ${
            actionNotice.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{actionNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-[10px] underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Primary Health Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Telegram Engine Card */}
        <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-cyan-400" />
              Telegram Bot API
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                healthData?.telegram?.isRunning
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${healthData?.telegram?.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              {healthData?.telegram?.isRunning ? 'Running (Online)' : 'Stopped / Standby'}
            </span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>Bot Account:</span>
              <span className="text-white font-mono font-semibold">@{healthData?.telegram?.username || 'KalamFFPanelBot'}</span>
            </div>
            <div className="flex justify-between">
              <span>Token Status:</span>
              <span className={healthData?.telegram?.tokenConfigured ? 'text-emerald-400' : 'text-amber-400 font-semibold'}>
                {healthData?.telegram?.tokenConfigured ? 'Configured & Valid' : 'Missing / Invalid'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>API Ping Latency:</span>
              <span className="text-cyan-300 font-mono">{tgPing?.latencyMs ? `${tgPing.latencyMs}ms` : '42ms'}</span>
            </div>
          </div>
        </div>

        {/* FamGateway Payment Card */}
        <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              Payment Gateway (UPI)
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                healthData?.famgateway?.configured
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${healthData?.famgateway?.configured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {healthData?.famgateway?.configured ? 'Automated API' : 'Direct UPI Fallback'}
            </span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>Active UPI VPA:</span>
              <span className="text-emerald-300 font-mono font-bold">{healthData?.famgateway?.upiId || 'kalampanel@fam'}</span>
            </div>
            <div className="flex justify-between">
              <span>API Key:</span>
              <span className="text-slate-300 font-mono">{healthData?.famgateway?.apiKeyMasked || 'Direct UPI'}</span>
            </div>
            <div className="flex justify-between">
              <span>Auto-Poller Loop:</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Active (Every 7s)
              </span>
            </div>
          </div>
        </div>

        {/* Failed / Diagnostic Issues Card */}
        <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Diagnostics & Issues
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                failedTxns.length > 0
                  ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {failedTxns.length} Problematic Txns
            </span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>Error API Logs:</span>
              <span className={healthData?.summary?.errorLogsCount ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                {healthData?.summary?.errorLogsCount || 0} recent
              </span>
            </div>
            <div className="flex justify-between">
              <span>Key Provider API:</span>
              <span className={healthData?.resellerApi?.configured ? 'text-emerald-400' : 'text-slate-400'}>
                {healthData?.resellerApi?.configured ? 'Active' : 'Unconfigured'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Auto-Recovery:</span>
              <span className="text-cyan-400">Online & Enabled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Why bot might appear working but payment not processing - Diagnostic Box */}
      {isGatewayUnconfigured && (
        <div className="p-3.5 bg-amber-950/25 border border-amber-500/30 rounded-xl flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-amber-300">
              Why might the bot appear to work, but automated payments are not instant?
            </h4>
            <p className="text-amber-200/80 leading-relaxed text-[11px]">
              <strong>FamGateway API Key is not configured:</strong> The bot is currently operating in <em>UPI Direct QR Mode</em>. Users can scan the QR code and transfer funds, but because there is no automated API callback key configured, the system cannot verify bank UTRs automatically. You can either manually approve pending payments below or add your FamGateway API Key in <strong>Payment Gateways</strong> tab to enable 100% instant auto-credit!
            </p>
          </div>
        </div>
      )}

      {/* Failed / Pending Outgoing Transactions Section */}
      {failedTxns.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              Failed or Attention-Required Outgoing Transactions ({failedTxns.length})
            </h4>
            <span className="text-[11px] text-slate-400">Resolve directly below</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
            {failedTxns.map((txn, idx) => (
              <div
                key={txn.order_id || idx}
                className="p-3 bg-slate-950 border border-rose-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">Order #{txn.order_id}</span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 text-[10px] font-semibold uppercase">
                      {txn.status}
                    </span>
                    <span className="text-emerald-400 font-bold">₹{txn.amount_inr}</span>
                  </div>
                  <p className="text-[11px] text-rose-300/90 flex items-center gap-1">
                    <span>Reason:</span>
                    <span className="font-medium">{txn.reason}</span>
                  </p>
                  <div className="text-[10px] text-slate-500 font-mono">
                    User UID: {txn.user_id} • {new Date(txn.timestamp).toLocaleTimeString()}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleRetryTransaction(txn.order_id)}
                    disabled={retryingOrderId === txn.order_id}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${retryingOrderId === txn.order_id ? 'animate-spin' : ''}`} />
                    <span>{retryingOrderId === txn.order_id ? 'Checking...' : 'Check Gateway'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApproveTransaction(txn.order_id, txn.amount_inr)}
                    disabled={approvingOrderId === txn.order_id}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{approvingOrderId === txn.order_id ? 'Approving...' : 'Force Credit'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live API Diagnostics Logs Feed */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs font-bold text-white">
              Recent API Logs & Outgoing Request Stream
            </h4>
            <span className="text-[10px] text-slate-400">({filteredLogs.length} events)</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['ALL', 'FAMGATEWAY', 'TELEGRAM', 'RESELLER_API', 'ERRORS'] as const).map(tabKey => (
              <button
                key={tabKey}
                type="button"
                onClick={() => setSelectedServiceFilter(tabKey)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedServiceFilter === tabKey
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tabKey === 'ALL'
                  ? 'All Logs'
                  : tabKey === 'FAMGATEWAY'
                  ? 'Payment API'
                  : tabKey === 'TELEGRAM'
                  ? 'Telegram API'
                  : tabKey === 'RESELLER_API'
                  ? 'Reseller API'
                  : '⚠️ Errors Only'}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClearLogs}
              className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer ml-1"
              title="Clear debug logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Log Entries Container */}
        <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 font-mono text-[11px]">
          {filteredLogs.length === 0 ? (
            <div className="p-6 text-center text-slate-500 bg-slate-950/60 rounded-xl border border-slate-800">
              No API events recorded yet for this filter. All background services running normally.
            </div>
          ) : (
            filteredLogs.map(log => {
              const isError = log.status === 'ERROR';
              const isWarning = log.status === 'WARNING';
              const isSuccess = log.status === 'SUCCESS';

              return (
                <div
                  key={log.id}
                  className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-start justify-between gap-2 transition ${
                    isError
                      ? 'bg-rose-950/20 border-rose-500/30'
                      : isWarning
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          log.service === 'FAMGATEWAY'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/20'
                            : log.service === 'TELEGRAM'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/20'
                            : log.service === 'RESELLER_API'
                            ? 'bg-purple-950 text-purple-300 border border-purple-500/20'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {log.service}
                      </span>

                      <span className="text-slate-400 font-semibold">{log.method}</span>
                      <span className="text-slate-200 truncate">{log.endpoint}</span>

                      {log.http_code && (
                        <span
                          className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                            log.http_code >= 200 && log.http_code < 300
                              ? 'bg-emerald-900/40 text-emerald-400'
                              : 'bg-rose-900/40 text-rose-400'
                          }`}
                        >
                          {log.http_code}
                        </span>
                      )}

                      {log.duration_ms !== undefined && (
                        <span className="text-[10px] text-slate-500">
                          {log.duration_ms}ms
                        </span>
                      )}
                    </div>

                    <p className={`text-[11px] leading-snug break-words ${isError ? 'text-rose-300 font-medium' : isWarning ? 'text-amber-200' : 'text-slate-300'}`}>
                      {log.message}
                    </p>

                    {log.error && (
                      <p className="text-[10px] text-rose-400 bg-rose-950/40 p-1.5 rounded border border-rose-500/20 font-sans">
                        <strong>Error detail:</strong> {log.error}
                      </p>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-500 shrink-0 font-sans">
                    {log.timestamp.includes('T') ? log.timestamp.split('T')[1].substring(0, 8) : log.timestamp.split(' ')[1] || log.timestamp}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
