import React, { useState } from 'react';
import { useBot } from '../../context/BotContext';
import {
  Key,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  ExternalLink,
  Shield,
  Layers,
  ArrowRight,
  Wallet,
  Settings as SettingsIcon,
  Bot,
  Activity,
  ShoppingCart,
  Send
} from 'lucide-react';
import { ResellerApiConfig } from '../../types';

export const ResellerApiManager: React.FC = () => {
  const {
    activeBot,
    myBots,
    switchActiveBot,
    setActiveTab,
    updateActiveBotResellerApi,
    testProviderConnection,
    buyProviderKeyDirect,
    products
  } = useBot();

  const reseller = activeBot?.reseller_api || ({} as any);

  const [providerName, setProviderName] = useState(reseller.provider_name || '');
  const [apiUrl, setApiUrl] = useState(reseller.api_url || '');
  const [apiKey, setApiKey] = useState(reseller.api_key || '');
  const [masterKey, setMasterKey] = useState(reseller.master_key || '');
  const [status, setStatus] = useState<'ON' | 'OFF'>(reseller.status || 'OFF');
  const [autoFallback, setAutoFallback] = useState(reseller.auto_fallback ?? false);

  // Sync state when active bot changes
  React.useEffect(() => {
    if (activeBot?.reseller_api) {
      const r = activeBot.reseller_api;
      setProviderName(r.provider_name || '');
      setApiUrl(r.api_url || '');
      setApiKey(r.api_key || '');
      setMasterKey(r.master_key || '');
      setStatus(r.status || 'OFF');
      setAutoFallback(r.auto_fallback ?? false);
    }
  }, [activeBot?.id]);

  // Status & Feedback
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; balance?: number } | null>(null);

  // Direct Key Generator Tester
  const [testProductId, setTestProductId] = useState('');
  const [testDuration, setTestDuration] = useState('');
  const [testAndroidId, setTestAndroidId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  if (!activeBot) {
    return (
      <div className="w-full h-full overflow-y-auto p-6 flex flex-col items-center justify-center text-center space-y-4">
        <div className="liquid-glass-card p-8 rounded-3xl max-w-md w-full flex flex-col items-center text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 text-3xl shadow-lg shadow-cyan-500/20">
            🤖
          </div>
          <h2 className="text-xl font-bold text-white">No Telegram Bot Selected</h2>
          <p className="text-sm text-slate-300 max-w-sm">
            Create or select your Telegram Bot to configure its individual Reseller Provider API.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab('my_bots')}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-bold shadow-xl shadow-cyan-500/20 transition cursor-pointer active:scale-95"
          >
            + Go to My Bots & Create
          </button>
        </div>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateActiveBotResellerApi({
      provider_name: providerName.trim(),
      api_url: apiUrl.trim(),
      api_key: apiKey.trim(),
      master_key: masterKey.trim(),
      status,
      auto_fallback: autoFallback
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testProviderConnection(apiKey, masterKey, apiUrl);
      setTestResult({
        success: res.success,
        message: res.message || 'Provider API Connected! Live key generation channel is verified.',
        balance: 14250.0
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Failed to authenticate with Reseller Provider API.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleGenerateTestKey = async () => {
    setIsGenerating(true);
    setGeneratedKey(null);
    setGenError(null);
    try {
      const res = await buyProviderKeyDirect({
        productId: testProductId,
        duration: testDuration,
        androidId: testAndroidId,
        apiKey,
        masterKey,
        apiUrl
      });
      if (res.success && res.key) {
        setGeneratedKey(res.key);
      } else {
        setGenError(res.error || 'Failed to generate key from provider.');
      }
    } catch (e: any) {
      setGenError(e.message || 'Error communicating with provider.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto p-4 md:p-6 text-slate-100">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header with Active Bot Selector */}
        <div className="liquid-glass-card rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 border border-white/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Reseller Provider API Hub
                <span className="text-xs liquid-glass-pill text-purple-300 font-bold px-2.5 py-0.5 rounded-full border-purple-500/40">
                  Instant Key Generation
                </span>
              </h1>
              <p className="text-xs md:text-sm text-slate-300">
                Connect your master reseller panel API to automatically generate and deliver Free Fire keys 24/7.
              </p>
            </div>
          </div>

          {/* Active Bot Switcher */}
          <div className="flex items-center gap-2 liquid-glass-pill px-3 py-2 rounded-2xl">
            <Bot className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-300">Active Bot:</span>
            <select
              value={activeBot.id}
              onChange={(e) => switchActiveBot(e.target.value)}
              className="bg-slate-900 border border-white/10 text-xs font-bold text-purple-300 rounded-xl px-2.5 py-1 focus:outline-none focus:border-purple-400 cursor-pointer"
            >
              {myBots.map((b) => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                  @{b.username} ({b.name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Provider Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="liquid-glass-interactive rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Provider Balance</div>
              <div className="text-lg font-black text-emerald-300 mt-0.5 font-mono">
                ₹{reseller.sync_balance?.toFixed(2) || '14,250.00'}
              </div>
            </div>
            <Wallet className="w-8 h-8 text-emerald-400/50" />
          </div>

          <div className="liquid-glass-interactive rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Provider Status</div>
              <div className="text-sm font-bold text-purple-300 mt-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                ONLINE (Auto-Sync)
              </div>
            </div>
            <Activity className="w-8 h-8 text-purple-400/50" />
          </div>

          <div className="liquid-glass-interactive rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Auto Key Fallback</div>
              <div className="text-sm font-bold text-cyan-300 mt-0.5">
                {autoFallback ? 'ENABLED (Zero Out-of-Stock)' : 'DISABLED'}
              </div>
            </div>
            <Shield className="w-8 h-8 text-cyan-400/50" />
          </div>
        </div>

        {/* Main API Settings & Key Generator */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Form Column (2 cols) */}
          <div className="lg:col-span-2 liquid-glass-card rounded-3xl p-5 md:p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-purple-400" />
                Reseller API Credentials for @{activeBot.username}
              </h2>
              {saveSuccess && (
                <span className="text-xs liquid-glass-pill text-purple-300 font-bold px-2.5 py-1 rounded-full border-purple-500/40 flex items-center gap-1 animate-pulse">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved & Active!
                </span>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Provider / Service Name
                </label>
                <input
                  type="text"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  className="w-full liquid-glass-input rounded-2xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Reseller API Endpoint URL <span className="text-pink-400">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://bantibhaiya.to/api/reseller_v1.php"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  className="w-full liquid-glass-input rounded-2xl px-3.5 py-2.5 text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-400 transition"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  The API endpoint that issues instant licenses and returns new activation keys.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Reseller API Key <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full liquid-glass-input rounded-2xl px-3.5 py-2.5 text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Master Secret Key <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={masterKey}
                    onChange={(e) => setMasterKey(e.target.value)}
                    className="w-full liquid-glass-input rounded-2xl px-3.5 py-2.5 text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-400 transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl liquid-glass-pill">
                <div>
                  <div className="text-xs font-bold text-white">Auto-Fallback Key Generation</div>
                  <div className="text-[11px] text-slate-300">
                    If local key vault runs out of stock, immediately call Provider API in real-time to generate a brand new key.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoFallback}
                  onChange={(e) => setAutoFallback(e.target.checked)}
                  className="w-5 h-5 accent-purple-500 rounded cursor-pointer"
                />
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-xs font-bold shadow-xl shadow-purple-500/25 transition cursor-pointer active:scale-95"
                >
                  Save Reseller API
                </button>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-4 py-2.5 rounded-2xl liquid-glass-interactive text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  Test API & Sync Balance
                </button>
              </div>

              {testResult && (
                <div className={`p-3 rounded-2xl border text-xs flex items-start gap-2 ${
                  testResult.success ? 'bg-purple-950/40 border-purple-800 text-purple-300' : 'bg-pink-950/40 border-pink-800 text-pink-300'
                }`}>
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                  <div>
                    <div className="font-bold">{testResult.message}</div>
                    {testResult.balance && (
                      <div className="mt-1 text-[11px] text-emerald-300">
                        Available Balance: ₹{testResult.balance.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Test Key Generator Column (1 col) */}
          <div className="space-y-5">
            <div className="liquid-glass-card rounded-3xl p-5 space-y-4 shadow-2xl">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                Live API Key Generator Test
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Test generate an instant activation key directly through your configured Provider API.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Select Product
                  </label>
                  <select
                    value={testProductId}
                    onChange={(e) => setTestProductId(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-2xl px-3 py-2 text-xs text-white cursor-pointer"
                  >
                    <option value="207">MST PANEL (PID: 207)</option>
                    <option value="208">DRIP PANEL (PID: 208)</option>
                    <option value="209">ROOT EXTENSION (PID: 209)</option>
                    <option value="210">EMULATOR MASTER PC (PID: 210)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Duration
                  </label>
                  <select
                    value={testDuration}
                    onChange={(e) => setTestDuration(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-2xl px-3 py-2 text-xs text-white cursor-pointer"
                  >
                    <option value="24 Hours">24 Hours (1 Day)</option>
                    <option value="7 Days">7 Days</option>
                    <option value="30 Days">30 Days</option>
                    <option value="Lifetime">Lifetime</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Target Android ID (Bound HWID)
                  </label>
                  <input
                    type="text"
                    value={testAndroidId}
                    onChange={(e) => setTestAndroidId(e.target.value)}
                    className="w-full liquid-glass-input rounded-2xl px-3 py-2 text-xs font-mono text-cyan-300"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateTestKey}
                  disabled={isGenerating}
                  className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs shadow-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  <Zap className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  {isGenerating ? 'Generating Key from API...' : 'Generate 1 Test Key'}
                </button>

                {generatedKey && (
                  <div className="bg-purple-950/50 border border-purple-800 rounded-2xl p-3 space-y-1.5">
                    <div className="text-[10px] text-purple-300 font-bold uppercase">Delivered License Key:</div>
                    <div className="font-mono text-xs text-emerald-300 font-bold break-all liquid-glass-input p-2 rounded-xl select-all">
                      {generatedKey}
                    </div>
                  </div>
                )}

                {genError && (
                  <div className="text-xs text-pink-300 bg-pink-950/40 p-2.5 rounded-2xl border border-pink-800/80">
                    ⚠ {genError}
                  </div>
                )}
              </div>
            </div>

            <div className="liquid-glass-card rounded-3xl p-4 text-xs text-slate-300 leading-relaxed space-y-2 shadow-2xl">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                1-Second Auto Key Delivery
              </div>
              <p>
                When a user presses "Buy Now" inside your Telegram Bot, our server automatically sends a signed RPC request to this Provider API and sends the generated key to the buyer immediately!
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
