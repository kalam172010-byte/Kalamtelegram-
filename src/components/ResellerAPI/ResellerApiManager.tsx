import React, { useState, useEffect } from 'react';
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
  Send,
  Code,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ResellerApiConfig } from '../../types';

export const ResellerApiManager: React.FC = () => {
  const {
    activeBot,
    myBots,
    switchActiveBot,
    setActiveTab,
    updateActiveBotResellerApi,
    providerBalance,
    isProviderBalanceLoading,
    fetchProviderBalance,
    testProviderConnection,
    buyProviderKeyDirect,
    products
  } = useBot();

  const reseller = activeBot?.reseller_api || ({} as any);

  const [providerName, setProviderName] = useState(reseller.provider_name || 'BantiBhaiya Gateway');
  const [apiUrl, setApiUrl] = useState(reseller.api_url || 'https://bantibhaiya.to/api/reseller_v1.php');
  const [apiKey, setApiKey] = useState(reseller.api_key || '');
  const [masterKey, setMasterKey] = useState(reseller.master_key || '');
  const [status, setStatus] = useState<'ON' | 'OFF'>(reseller.status || 'ON');
  const [autoFallback, setAutoFallback] = useState(reseller.auto_fallback ?? true);

  // Sync state when active bot changes
  useEffect(() => {
    if (activeBot?.reseller_api) {
      const r = activeBot.reseller_api;
      setProviderName(r.provider_name || 'BantiBhaiya Gateway');
      setApiUrl(r.api_url || 'https://bantibhaiya.to/api/reseller_v1.php');
      setApiKey(r.api_key || '');
      setMasterKey(r.master_key || '');
      setStatus(r.status || 'ON');
      setAutoFallback(r.auto_fallback ?? true);
    }
  }, [activeBot?.id]);

  // Real-time balance refresh on mount and when API key/url changes
  useEffect(() => {
    if (apiKey.trim()) {
      fetchProviderBalance(apiKey.trim(), masterKey.trim(), apiUrl.trim());
    }
  }, [apiKey, masterKey, apiUrl]);

  // Status & Feedback
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    balance?: number;
    formatted?: string;
    latencyMs?: number;
    raw?: any;
    error?: string;
  } | null>(null);
  const [showTestRaw, setShowTestRaw] = useState(false);

  // Direct Key Generator Tester
  const [testProductId, setTestProductId] = useState('207');
  const [customPid, setCustomPid] = useState('');
  const [testDuration, setTestDuration] = useState('24 Hours');
  const [testAndroidId, setTestAndroidId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [genRaw, setGenRaw] = useState<any>(null);
  const [showGenRaw, setShowGenRaw] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

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
            onClick={() => setActiveTab('dashboard')}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-bold shadow-xl shadow-cyan-500/20 transition cursor-pointer active:scale-95"
          >
            Go to Store Dashboard
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
    fetchProviderBalance(apiKey.trim(), masterKey.trim(), apiUrl.trim());
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setShowTestRaw(false);
    try {
      const res = await testProviderConnection(apiKey.trim(), masterKey.trim(), apiUrl.trim());
      setTestResult({
        success: res.success,
        message: res.message || (res.success ? 'Provider API Connected! Live balance verified.' : 'Connection failed'),
        balance: res.balance,
        formatted: res.formatted,
        latencyMs: res.latencyMs,
        raw: res.raw,
        error: res.error
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Failed to authenticate with Reseller Provider API.',
        error: err?.message
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleGenerateTestKey = async () => {
    setIsGenerating(true);
    setGeneratedKey(null);
    setGenError(null);
    setGenRaw(null);
    setShowGenRaw(false);
    setCopiedKey(false);

    const pidToUse = testProductId === 'custom' ? customPid.trim() : testProductId.trim();
    if (!pidToUse) {
      setGenError('Please specify a valid Product ID.');
      setIsGenerating(false);
      return;
    }

    try {
      const res = await buyProviderKeyDirect({
        productId: pidToUse,
        duration: testDuration,
        androidId: testAndroidId.trim() || undefined,
        apiKey: apiKey.trim(),
        masterKey: masterKey.trim(),
        apiUrl: apiUrl.trim()
      });

      setGenRaw(res.raw || res);

      if (res.success && res.key) {
        setGeneratedKey(res.key);
      } else {
        setGenError(res.error || res.message || 'Failed to generate real key from provider API.');
      }
    } catch (e: any) {
      setGenError(e.message || 'Error communicating with provider.');
      setGenRaw({ error: e.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
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
                  Real-Time Live API
                </span>
              </h1>
              <p className="text-xs md:text-sm text-slate-300">
                Connect your master reseller panel (https://bantibhaiya.to) to fetch live real balance & generate Free Fire keys 24/7.
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
          <div className="liquid-glass-interactive rounded-2xl p-4 flex items-center justify-between group">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <span>Real-Time Provider Balance</span>
                <button
                  type="button"
                  onClick={() => fetchProviderBalance(apiKey.trim(), masterKey.trim(), apiUrl.trim())}
                  className="text-cyan-400 hover:text-cyan-300 transition"
                  title="Refresh Real-Time Live Balance"
                >
                  <RefreshCw className={`w-3 h-3 ${isProviderBalanceLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="text-2xl font-black text-emerald-300 mt-1 font-mono">
                {providerBalance.formatted || '₹0.00'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono flex items-center gap-2">
                <span>{providerBalance.latencyMs > 0 ? `${providerBalance.latencyMs}ms Ping` : 'Live Polling'}</span>
                <span>•</span>
                <span className={providerBalance.status === 'CONNECTED' ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                  {providerBalance.status}
                </span>
              </div>
            </div>
            <Wallet className="w-9 h-9 text-emerald-400/60 group-hover:scale-110 transition-transform" />
          </div>

          <div className="liquid-glass-interactive rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Gateway Health Status</div>
              <div className="text-sm font-bold text-purple-300 mt-1 flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${providerBalance.status === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : providerBalance.status === 'ERROR' ? 'bg-rose-500' : 'bg-amber-400'}`}></span>
                {providerBalance.status === 'CONNECTED' ? 'CONNECTED (Live 5s Sync)' : (providerBalance.message || 'Connecting...')}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Last queried: {new Date(providerBalance.lastChecked).toLocaleTimeString()}
              </div>
            </div>
            <Activity className="w-9 h-9 text-purple-400/60" />
          </div>

          <div className="liquid-glass-interactive rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Auto-Delivery & Stock</div>
              <div className="text-sm font-bold text-cyan-300 mt-1">
                {autoFallback ? 'API REAL-TIME DELIVERY' : 'LOCAL VAULT ONLY'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {autoFallback ? 'Direct API Key Issuance Active' : 'Requires Pre-loaded Key Vault'}
              </div>
            </div>
            <Shield className="w-9 h-9 text-cyan-400/60" />
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
                  Official endpoint: <code className="text-cyan-300 font-bold">https://bantibhaiya.to/api/reseller_v1.php</code>
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
                    placeholder="Enter your BantiBhaiya API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full liquid-glass-input rounded-2xl px-3.5 py-2.5 text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Master Secret Key (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Master Key (if provided)"
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
                    If local key vault runs out of stock, immediately query Provider API in real-time to generate a brand new live key.
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
                  Save API Settings
                </button>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-4 py-2.5 rounded-2xl liquid-glass-interactive text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  {isTesting ? 'Testing Real-Time Ping...' : 'Test Live Connection & Balance'}
                </button>
              </div>

              {testResult && (
                <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  testResult.success ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-rose-950/40 border-rose-800 text-rose-300'
                }`}>
                  <div className="flex items-start gap-2">
                    {testResult.success ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />}
                    <div className="flex-1">
                      <div className="font-bold text-sm">{testResult.message}</div>
                      {testResult.balance !== undefined && (
                        <div className="mt-1 text-xs font-mono font-bold text-emerald-200">
                          Real-Time Live Balance: {testResult.formatted || `₹${Number(testResult.balance).toFixed(2)}`}
                          {testResult.latencyMs ? ` (${testResult.latencyMs}ms response time)` : ''}
                        </div>
                      )}
                      {testResult.error && (
                        <div className="mt-1 text-[11px] text-rose-300">
                          Provider Error: {testResult.error}
                        </div>
                      )}
                    </div>
                  </div>

                  {testResult.raw && (
                    <div className="pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setShowTestRaw(!showTestRaw)}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-mono transition"
                      >
                        <Code className="w-3 h-3" />
                        {showTestRaw ? 'Hide Live Provider JSON Payload' : 'View Live Provider JSON Payload'}
                        {showTestRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {showTestRaw && (
                        <pre className="mt-2 p-2.5 bg-slate-950 rounded-xl text-[10px] font-mono text-cyan-300 overflow-x-auto border border-white/10">
                          {JSON.stringify(testResult.raw, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Test Key Generator Column (1 col) */}
          <div className="space-y-5">
            <div className="liquid-glass-card rounded-3xl p-5 space-y-4 shadow-2xl">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                Real-Time Key Generator Test
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Test real key generation directly from your live provider account without simulation or dummy data.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Select Product ID (PID)
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
                    {products.filter(p => p.provider_product_id).map(p => (
                      <option key={p.id} value={p.provider_product_id}>
                        {p.panel_name} - {p.name} (PID: {p.provider_product_id})
                      </option>
                    ))}
                    <option value="custom">✏️ Enter Custom PID...</option>
                  </select>
                </div>

                {testProductId === 'custom' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Custom Provider PID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 207 or MST_VIP"
                      value={customPid}
                      onChange={(e) => setCustomPid(e.target.value)}
                      className="w-full liquid-glass-input rounded-2xl px-3 py-2 text-xs font-mono text-purple-300"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Duration Plan
                  </label>
                  <select
                    value={testDuration}
                    onChange={(e) => setTestDuration(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-2xl px-3 py-2 text-xs text-white cursor-pointer"
                  >
                    <option value="24 Hours">24 Hours (1 Day)</option>
                    <option value="7 Days">7 Days</option>
                    <option value="30 Days">30 Days</option>
                    <option value="60 Days">60 Days</option>
                    <option value="Lifetime">Lifetime</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Bound HWID / Android ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 8a3f9104b2c89012"
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
                  {isGenerating ? 'Querying Live Provider API...' : 'Generate 1 Real Test Key'}
                </button>

                {generatedKey && (
                  <div className="bg-emerald-950/50 border border-emerald-800 rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase flex items-center gap-1">
                        <Check className="w-3 h-3" /> Real Delivered License Key:
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(generatedKey)}
                        className="text-[10px] text-cyan-300 hover:text-white flex items-center gap-1 font-bold"
                      >
                        <Copy className="w-3 h-3" /> {copiedKey ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="font-mono text-xs text-emerald-200 font-bold break-all bg-slate-950/80 p-2.5 rounded-xl border border-emerald-700/50 select-all">
                      {generatedKey}
                    </div>
                  </div>
                )}

                {genError && (
                  <div className="text-xs text-rose-300 bg-rose-950/50 p-3 rounded-2xl border border-rose-800 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      Provider Generation Failed:
                    </div>
                    <div className="text-[11px] text-rose-200">
                      {genError}
                    </div>
                  </div>
                )}

                {genRaw && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowGenRaw(!showGenRaw)}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-mono transition"
                    >
                      <Code className="w-3 h-3" />
                      {showGenRaw ? 'Hide Raw API Response' : 'Inspect Raw API Response'}
                      {showGenRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {showGenRaw && (
                      <pre className="mt-1.5 p-2 bg-slate-950 rounded-xl text-[10px] font-mono text-cyan-300 overflow-x-auto border border-white/10 max-h-40">
                        {JSON.stringify(genRaw, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="liquid-glass-card rounded-3xl p-4 text-xs text-slate-300 leading-relaxed space-y-2 shadow-2xl">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Live Telegram Store Delivery
              </div>
              <p>
                When a user purchases a key inside your Telegram bot, the server sends an instant signed RPC request to <code className="text-cyan-300">bantibhaiya.to</code> and delivers the verified activation key in real time!
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
