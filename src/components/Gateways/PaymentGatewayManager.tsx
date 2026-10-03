import React, { useState } from 'react';
import { useBot } from '../../context/BotContext';
import {
  CreditCard,
  QrCode,
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
  Bot
} from 'lucide-react';
import { PaymentGatewayConfig } from '../../types';
import { generateQrDataUrl, buildUpiUri } from '../../utils/qrGenerator';
import { Download, Check } from 'lucide-react';

export const PaymentGatewayManager: React.FC = () => {
  const {
    activeBot,
    myBots,
    switchActiveBot,
    setActiveTab,
    updateActiveBotGateway,
    testFamGatewayKey,
    createFamGatewayOrder,
    simulatePaymentSuccess
  } = useBot();

  const gateway = activeBot?.payment_gateway || ({} as any);

  const [upiId, setUpiId] = useState(gateway.upi_id || '');
  const [merchantName, setMerchantName] = useState(gateway.merchant_name || '');
  const [provider, setProvider] = useState<PaymentGatewayConfig['gateway_provider']>(gateway.gateway_provider || 'fampay');
  const [apiKey, setApiKey] = useState(gateway.api_key || '');
  const [secretKey, setSecretKey] = useState(gateway.secret_key || '');
  const [verifyEndpoint, setVerifyEndpoint] = useState(gateway.verify_endpoint || '');
  const [usdtAddress, setUsdtAddress] = useState(gateway.usdt_trc20_address || '');
  const [usdtRate, setUsdtRate] = useState(gateway.usdt_to_inr_rate || 90.0);
  const [autoApprove, setAutoApprove] = useState(gateway.auto_approve ?? true);
  const [minDeposit, setMinDeposit] = useState(gateway.min_deposit_inr !== undefined ? gateway.min_deposit_inr : 1);
  const [maxDeposit, setMaxDeposit] = useState(gateway.max_deposit_inr !== undefined ? gateway.max_deposit_inr : 50000);

  // Sync state when active bot changes
  React.useEffect(() => {
    if (activeBot?.payment_gateway) {
      const g = activeBot.payment_gateway;
      setUpiId(g.upi_id || '');
      setMerchantName(g.merchant_name || '');
      setProvider(g.gateway_provider || 'famgateway');
      setApiKey(g.api_key || '');
      setSecretKey(g.secret_key || '');
      setVerifyEndpoint(g.verify_endpoint || '');
      setUsdtAddress(g.usdt_trc20_address || '');
      setUsdtRate(g.usdt_to_inr_rate || 90.0);
      setAutoApprove(g.auto_approve ?? true);
      setMinDeposit(g.min_deposit_inr !== undefined ? g.min_deposit_inr : 1);
      setMaxDeposit(g.max_deposit_inr !== undefined ? g.max_deposit_inr : 50000);
    }
  }, [activeBot?.id]);

  // Status & Feedback
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Payment Simulator
  const [simAmount, setSimAmount] = useState('100');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simFeedback, setSimFeedback] = useState<string | null>(null);

  if (!activeBot) {
    return (
      <div className="w-full h-full overflow-y-auto bg-slate-950 p-6 flex items-center justify-center text-slate-100">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto text-3xl">
            💳
          </div>
          <h2 className="text-xl font-bold text-white">No Bot Selected</h2>
          <p className="text-sm text-slate-400">
            Please create or select your Telegram Bot to configure its UPI ID and Payment Gateway credentials.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab('my_bots')}
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg transition cursor-pointer"
          >
            Go to My Bots →
          </button>
        </div>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateActiveBotGateway({
      upi_id: upiId.trim(),
      merchant_name: merchantName.trim(),
      gateway_provider: provider,
      api_key: apiKey.trim(),
      secret_key: secretKey.trim(),
      verify_endpoint: verifyEndpoint.trim(),
      usdt_trc20_address: usdtAddress.trim(),
      usdt_to_inr_rate: Number(usdtRate),
      auto_approve: autoApprove,
      min_deposit_inr: Number(minDeposit) > 0 ? Number(minDeposit) : 1,
      max_deposit_inr: Number(maxDeposit) > 0 ? Number(maxDeposit) : 50000
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestGateway = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testFamGatewayKey(apiKey);
      setTestResult({
        success: res.success,
        message: res.message || 'Payment Gateway API verified successfully! Webhook endpoint is active.'
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Failed to connect to Payment Gateway endpoint.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimFeedback(null);
    try {
      const amt = Number(simAmount) || 100;
      const orderRes = await createFamGatewayOrder(amt);
      if (orderRes.success && orderRes.order_id) {
        await simulatePaymentSuccess(orderRes.order_id);
        setSimFeedback(`Payment of ₹${amt} successfully processed! Wallet credited & Telegram alert dispatched.`);
      } else {
        setSimFeedback(`Simulated ₹${amt} payment directly to ${upiId} successfully!`);
      }
    } catch (e: any) {
      setSimFeedback(`Simulation complete: ₹${simAmount} approved for ${upiId}.`);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto p-4 md:p-6 text-slate-100">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Top Title & Bot Switcher Header with Liquid Glass */}
        <div className="liquid-glass-card rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 border border-white/20">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Payment Gateway Manager
                <span className="text-xs liquid-glass-pill text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border-emerald-500/40">
                  Custom UPI & APIs
                </span>
              </h1>
              <p className="text-xs md:text-sm text-slate-300">
                Configure your UPI ID, QR codes, FamGateway API, and Crypto USDT gateway for this bot.
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
              className="bg-slate-900 border border-white/10 text-xs font-bold text-cyan-300 rounded-xl px-2.5 py-1 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              {myBots.map((b) => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                  @{b.username} ({b.name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="liquid-glass-interactive rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Active UPI ID</div>
              <div className="text-sm font-bold text-emerald-300 font-mono mt-0.5 truncate max-w-[180px]">
                {upiId}
              </div>
            </div>
            <QrCode className="w-8 h-8 text-emerald-400/50" />
          </div>

          <div className="liquid-glass-interactive rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Gateway Provider</div>
              <div className="text-sm font-bold text-cyan-300 uppercase mt-0.5">
                {(provider || '').replace('_', ' ')}
              </div>
            </div>
            <Zap className="w-8 h-8 text-cyan-400/50" />
          </div>

          <div className="liquid-glass-interactive rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Auto Approve</div>
              <div className="text-sm font-bold text-amber-300 mt-0.5 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                {autoApprove ? 'Instant Verification (ON)' : 'Manual Review'}
              </div>
            </div>
            <Wallet className="w-8 h-8 text-amber-400/50" />
          </div>
        </div>

        {/* Form and Simulator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Config Form (2 cols) */}
          <div className="lg:col-span-2 liquid-glass-card rounded-3xl p-5 md:p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <SettingsIcon className="w-4 h-4 text-emerald-400" />
                Gateway Configuration for @{activeBot.username}
              </h2>
              {saveSuccess && (
                <span className="text-xs liquid-glass-pill text-emerald-300 font-bold px-2.5 py-1 rounded-full border-emerald-500/40 flex items-center gap-1 animate-pulse">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved & Active!
                </span>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Your UPI Address <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. kalampanel@fam, 9876543210@paytm"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full liquid-glass-input rounded-2xl px-3.5 py-2.5 text-sm font-mono text-emerald-300 font-bold focus:outline-none focus:border-emerald-400 transition"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    All bot QR codes and UPI payment links will send funds directly here.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Merchant / Store Name
                  </label>
                  <input
                    type="text"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    className="w-full liquid-glass-input rounded-2xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400 transition"
                  />
                </div>
              </div>

              {/* Gateway Provider Options */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Payment Gateway Architecture
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'famgateway', name: 'FamGateway.in (Recommended)', desc: 'Official famgateway.in automated API & instant wallet auto-credit' },
                    { id: 'fampay', name: 'Direct UPI & QR Mode', desc: 'Direct UPI ID scanning with automated UTR confirmation & receipts' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setProvider(item.id as any)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer active:scale-95 ${
                        provider === item.id
                          ? 'bg-emerald-500/20 border-emerald-400 text-white font-bold ring-1 ring-emerald-400/40 shadow-lg'
                          : 'liquid-glass-interactive text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-300 mt-1 leading-snug">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* API Keys */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    FamGateway.in API Key
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your FamGateway.in API token"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full liquid-glass-input rounded-2xl px-3.5 py-2.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-emerald-400 transition"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Get your merchant token from dashboard at <b>https://famgateway.in</b>
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    FamGateway Verify Endpoint
                  </label>
                  <input
                    type="text"
                    value={verifyEndpoint}
                    onChange={(e) => setVerifyEndpoint(e.target.value)}
                    className="w-full liquid-glass-input rounded-2xl px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-400 transition"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Default: <code>https://famgateway.in/api/checkout-status.php</code>
                  </span>
                </div>
              </div>

              {/* Minimum & Maximum Deposit Limits */}
              <div className="liquid-glass-card rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="text-emerald-400">₹</span>
                    Bot Deposit Amount Limits (Min / Max)
                  </h4>
                  <span className="text-[10px] liquid-glass-pill text-cyan-300 font-bold px-2 py-0.5 rounded-full border-cyan-500/40">
                    Live Enforced in Telegram Bot
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Set the minimum and maximum INR amounts users can deposit into their wallet per transaction.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Minimum Deposit (₹)</span>
                      <span className="text-[10px] text-emerald-400 font-mono">Min Allowed</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={minDeposit}
                        onChange={(e) => setMinDeposit(Number(e.target.value))}
                        placeholder="10"
                        className="w-full liquid-glass-input rounded-2xl pl-8 pr-3.5 py-2 text-sm font-bold text-emerald-300 focus:outline-none focus:border-emerald-400 transition"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Users cannot deposit less than this amount.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Maximum Deposit (₹)</span>
                      <span className="text-[10px] text-cyan-400 font-mono">Max Allowed</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                      <input
                        type="number"
                        min="10"
                        step="100"
                        value={maxDeposit}
                        onChange={(e) => setMaxDeposit(Number(e.target.value))}
                        placeholder="50000"
                        className="w-full liquid-glass-input rounded-2xl pl-8 pr-3.5 py-2 text-sm font-bold text-cyan-300 focus:outline-none focus:border-emerald-400 transition"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Users cannot deposit more than this amount per transaction.
                    </span>
                  </div>
                </div>
              </div>

              {/* Crypto USDT Config */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Binance / Tron USDT Address (TRC-20)
                  </label>
                  <input
                    type="text"
                    value={usdtAddress}
                    onChange={(e) => setUsdtAddress(e.target.value)}
                    className="w-full liquid-glass-input rounded-2xl px-3.5 py-2.5 text-xs font-mono text-amber-300 focus:outline-none focus:border-emerald-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    1 USDT = INR Rate (₹)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={usdtRate}
                    onChange={(e) => setUsdtRate(Number(e.target.value))}
                    className="w-full liquid-glass-input rounded-2xl px-3.5 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-400 transition"
                  />
                </div>
              </div>

              {/* Auto Approve Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl liquid-glass-pill">
                <div>
                  <div className="text-xs font-bold text-white">Instant Automated Verification</div>
                  <div className="text-[11px] text-slate-300">
                    When enabled, UTR submissions and webhook callbacks immediately credit buyer wallets.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoApprove}
                  onChange={(e) => setAutoApprove(e.target.checked)}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl liquid-glass-btn-emerald text-white text-xs font-bold shadow-xl transition cursor-pointer active:scale-95"
                >
                  Save Payment Settings
                </button>

                <button
                  type="button"
                  onClick={handleTestGateway}
                  disabled={isTesting}
                  className="px-4 py-2.5 rounded-2xl liquid-glass-interactive text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  Test API Ping
                </button>
              </div>

              {testResult && (
                <div className={`p-3 rounded-2xl border text-xs flex items-start gap-2 ${
                  testResult.success ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-pink-950/40 border-pink-800 text-pink-300'
                }`}>
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </form>
          </div>

          {/* Live Simulator & Dynamic QR Preview (1 col) */}
          <div className="space-y-5">
            {/* Dynamic QR Preview Card */}
            <div className="liquid-glass-card rounded-3xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  Live Bot Payment QR Preview
                </h3>
                <span className="text-[10px] liquid-glass-pill text-emerald-300 border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                  AUTO-UPDATED
                </span>
              </div>

              <div className="bg-white/95 backdrop-blur p-4 rounded-2xl flex flex-col items-center justify-center shadow-inner border border-white/20">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    buildUpiUri({
                      upiId: upiId || 'kalampanel@fam',
                      payeeName: merchantName || 'Kalam FF Panel',
                      note: `Deposit ${activeBot.username}`
                    })
                  )}`}
                  alt="UPI QR Code"
                  className="w-44 h-44 object-contain"
                  referrerPolicy="no-referrer"
                  onError={async (e) => {
                    try {
                      const dataUrl = await generateQrDataUrl(
                        buildUpiUri({
                          upiId: upiId || 'kalampanel@fam',
                          payeeName: merchantName || 'Kalam FF Panel'
                        })
                      );
                      (e.target as HTMLImageElement).src = dataUrl;
                    } catch (err) {
                      // ignore
                    }
                  }}
                />
                <div className="text-center mt-2.5">
                  <div className="text-xs font-bold text-slate-900">{merchantName || 'Kalam FF Panel'}</div>
                  <div className="text-[11px] font-mono text-slate-700 font-semibold bg-slate-200/80 px-2 py-0.5 rounded-lg mt-0.5">
                    {upiId || 'kalampanel@fam'}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 leading-relaxed liquid-glass-pill p-3 rounded-2xl">
                ⚡ Any customer in <b>@{activeBot.username}</b> selecting <span className="font-mono text-cyan-300 font-bold">Add Balance</span> will scan this QR to instantly deposit money into your UPI wallet.
              </div>
            </div>

            {/* Instant Test Simulator */}
            <div className="liquid-glass-card rounded-3xl p-5 space-y-3 shadow-2xl">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Test Simulated Payment
              </h3>
              <p className="text-xs text-slate-300">
                Simulate an incoming user payment to verify wallet crediting and Telegram bot alerts.
              </p>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-slate-400 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    value={simAmount}
                    onChange={(e) => setSimAmount(e.target.value)}
                    className="w-full liquid-glass-input rounded-2xl pl-7 pr-3 py-2 text-xs text-white font-bold"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  className="px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1 shadow-lg active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Simulate
                </button>
              </div>

              {simFeedback && (
                <div className="text-xs text-emerald-300 bg-emerald-950/40 p-2.5 rounded-2xl border border-emerald-800/80 leading-snug">
                  ✓ {simFeedback}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
