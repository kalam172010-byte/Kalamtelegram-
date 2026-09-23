import React, { useState } from 'react';
import { useBot } from '../../context/BotContext';
import {
  Bot,
  Key,
  CreditCard,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Zap,
  Globe,
  DollarSign,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { PaymentGatewayConfig, ResellerApiConfig } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateBotWizardModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { createBot, setActiveTab, currentUser } = useBot();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [botName, setBotName] = useState('');
  const [botUsername, setBotUsername] = useState('');
  const [botToken, setBotToken] = useState('');
  const [adminChatId, setAdminChatId] = useState(String(currentUser.chat_id || currentUser.user_id || '12846461'));
  const [description, setDescription] = useState('');
  const [themeColor, setThemeColor] = useState('#06b6d4');

  // Step 2: Payment Gateway
  const [upiId, setUpiId] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [gatewayProvider, setGatewayProvider] = useState<PaymentGatewayConfig['gateway_provider']>('fampay');
  const [fampayApiKey, setFampayApiKey] = useState('');
  const [usdtAddress, setUsdtAddress] = useState('');
  const [autoApprove, setAutoApprove] = useState(true);

  // Step 3: Reseller API
  const [providerName, setProviderName] = useState('Reseller Provider API');
  const [apiUrl, setApiUrl] = useState('https://bantibhaiya.to/api/reseller_v1.php');
  const [resellerApiKey, setResellerApiKey] = useState('');
  const [masterKey, setMasterKey] = useState('');
  const [autoFallback, setAutoFallback] = useState(true);

  // Validation state
  const [isTestingToken, setIsTestingToken] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<{ checked: boolean; valid: boolean; message?: string }>({
    checked: false,
    valid: false
  });

  if (!isOpen) return null;

  const handleTestToken = async () => {
    const trimmed = botToken.trim();
    if (!trimmed) {
      setTokenStatus({ checked: true, valid: false, message: 'Please enter a Telegram Bot Token first.' });
      return;
    }
    setIsTestingToken(true);
    try {
      const res = await fetch(`https://api.telegram.org/bot${trimmed}/getMe`);
      const data = await res.json();
      if (data.ok && data.result) {
        setTokenStatus({
          checked: true,
          valid: true,
          message: `✅ Live Bot Connected: @${data.result.username} (${data.result.first_name})`
        });
        if (!botUsername) {
          setBotUsername(data.result.username);
        }
        if (!botName) {
          setBotName(data.result.first_name);
        }
      } else {
        setTokenStatus({
          checked: true,
          valid: false,
          message: data.description || 'Invalid token. Obtain a valid HTTP API token from @BotFather on Telegram.'
        });
      }
    } catch (err: any) {
      // If CORS or offline, fallback to format check
      if (trimmed.includes(':') && trimmed.length > 20) {
        setTokenStatus({ checked: true, valid: true, message: 'Token format valid! Ready to deploy.' });
      } else {
        setTokenStatus({
          checked: true,
          valid: false,
          message: 'Invalid token format. Must be formatted like: 123456789:ABCdefGHIjk...'
        });
      }
    } finally {
      setIsTestingToken(false);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!botName.trim()) {
      alert('Please enter a Bot Name');
      setStep(1);
      return;
    }

    const cleanUsername = (botUsername || botName.replace(/\s+/g, '') + 'Bot').replace(/^@/, '');
    const cleanToken = botToken.trim() || `7928194${Math.floor(Math.random() * 9000 + 1000)}:AAH9bK8xP_custom_${cleanUsername}`;
    const parsedAdminId = Number(adminChatId.trim()) || currentUser.chat_id || currentUser.user_id || 12846461;

    const newBot = createBot({
      name: botName.trim(),
      username: cleanUsername,
      bot_token: cleanToken,
      admin_id: parsedAdminId,
      admin_chat_id: parsedAdminId,
      description: description.trim() || `Official Telegram Store Bot for ${botName}`,
      theme_color: themeColor,
      payment_gateway: {
        upi_id: upiId.trim() || 'store@fam',
        merchant_name: merchantName.trim() || botName,
        qr_image_url: 'https://fampay.anujbots.xyz/qr.php',
        gateway_provider: gatewayProvider,
        api_key: fampayApiKey.trim(),
        secret_key: 'FP_SEC_' + Math.random().toString(36).substring(2, 10),
        verify_endpoint: 'https://fampay.anujbots.xyz/verify.php',
        usdt_trc20_address: usdtAddress.trim(),
        usdt_to_inr_rate: 90.0,
        auto_approve: autoApprove
      },
      reseller_api: {
        provider_name: providerName.trim(),
        api_url: apiUrl.trim(),
        api_key: resellerApiKey.trim(),
        master_key: masterKey.trim(),
        status: 'ON',
        auto_fallback: autoFallback,
        sync_balance: 10000.0
      }
    });

    onClose();
    setActiveTab('my_bots');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Create Telegram Bot
                <span className="text-[10px] sm:text-[11px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-semibold border border-cyan-500/30">
                  Step {step}/3
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate max-w-[240px] sm:max-w-none">
                Deploy your automated Telegram shop with custom gateway & keys.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progression Bar */}
        <div className="bg-slate-950/80 px-3 sm:px-6 py-2 border-b border-slate-800/80 flex items-center justify-between text-xs shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center gap-1.5 sm:gap-2 font-semibold transition shrink-0 ${
              step === 1 ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step === 1 ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
            }`}>1</span>
            <span className="text-[11px] sm:text-xs">Bot Credentials</span>
          </button>
          <div className="w-4 sm:w-8 h-[1px] bg-slate-800 shrink-0"></div>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`flex items-center gap-1.5 sm:gap-2 font-semibold transition shrink-0 ${
              step === 2 ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step === 2 ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
            }`}>2</span>
            <span className="text-[11px] sm:text-xs">Payment Gateway</span>
          </button>
          <div className="w-4 sm:w-8 h-[1px] bg-slate-800 shrink-0"></div>
          <button
            type="button"
            onClick={() => setStep(3)}
            className={`flex items-center gap-1.5 sm:gap-2 font-semibold transition shrink-0 ${
              step === 3 ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step === 3 ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
            }`}>3</span>
            <span className="text-[11px] sm:text-xs">Reseller API</span>
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleCreateSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 pb-safe">
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-cyan-950/30 border border-cyan-800/40 rounded-xl p-3.5 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs text-cyan-200/90 leading-relaxed">
                  Every user can deploy their own Telegram Bot! Go to <b>@BotFather</b> on Telegram, create a new bot, and paste the API token below.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Bot Name <span className="text-pink-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kalam FF Panel Store, Titan VIP Shop"
                  value={botName || ''}
                  onChange={(e) => setBotName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Telegram @Username <span className="text-pink-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 text-sm">@</span>
                    <input
                      type="text"
                      required
                      placeholder="MyStoreBot"
                      value={botUsername || ''}
                      onChange={(e) => setBotUsername(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Theme Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    {['#06b6d4', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setThemeColor(color)}
                        style={{ backgroundColor: color }}
                        className={`w-7 h-7 rounded-lg transition-transform ${
                          themeColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    Telegram Bot Token (@BotFather) <span className="text-pink-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleTestToken}
                    disabled={isTestingToken || !botToken}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isTestingToken ? 'animate-spin' : ''}`} />
                    Verify Token
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. 7928194012:AAH9bK8xP_exampleTokenKalamBot"
                  value={botToken || ''}
                  onChange={(e) => {
                    setBotToken(e.target.value);
                    setTokenStatus({ checked: false, valid: false });
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 transition"
                />
                {tokenStatus.checked && (
                  <div className={`mt-2 text-xs flex items-center gap-1.5 ${
                    tokenStatus.valid ? 'text-emerald-400' : 'text-pink-400'
                  }`}>
                    {tokenStatus.valid ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{tokenStatus.message}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Bot Master Admin Telegram Chat ID <span className="text-pink-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-indigo-400 font-bold text-xs">CHAT ID</span>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 12846461 or 792819401"
                    value={adminChatId}
                    onChange={(e) => setAdminChatId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-20 pr-3.5 py-2.5 text-sm font-mono font-bold text-indigo-300 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Only this Telegram Chat ID will be granted full Master Admin privileges (/admin, /addbalance, broadcast, etc.) on the bot.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Bot Description / Welcome Note
                </label>
                <textarea
                  rows={2}
                  placeholder="Automated Free Fire Panel keys store with instant delivery & 24/7 support."
                  value={description || ''}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition resize-none"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-3.5 flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-200/90 leading-relaxed">
                  Configure the payment gateway for this bot. All payments made inside this bot will go directly to your configured UPI ID and Gateway API!
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Your UPI ID (GPay / PhonePe / FamPay) <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="yourname@okaxis or yourid@fam"
                    value={upiId || ''}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-emerald-400 font-semibold focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Merchant Name / Business Display
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kalam Store Direct"
                    value={merchantName || ''}
                    onChange={(e) => setMerchantName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Payment Gateway Provider
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'fampay', label: 'FamPay Gateway', desc: 'Fast Dynamic QR' },
                    { id: 'famgateway', label: 'FamGateway API', desc: 'Auto Webhook' },
                    { id: 'crypto_usdt', label: 'Binance USDT', desc: 'TRC-20 Crypto' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setGatewayProvider(item.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        gatewayProvider === item.id
                          ? 'bg-emerald-600/20 border-emerald-500 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-white">{item.label}</div>
                      <div className="text-[10px] text-slate-400">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  FamGateway / FamPay API Key
                </label>
                <input
                  type="text"
                  placeholder="FP_LIVE_99481a8c3d11ef420b991"
                  value={fampayApiKey || ''}
                  onChange={(e) => setFampayApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Binance / Tron USDT Address (Optional)
                </label>
                <input
                  type="text"
                  placeholder="TXu8KalamUSDT9912083TronNetwork"
                  value={usdtAddress || ''}
                  onChange={(e) => setUsdtAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-amber-300 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs">
                  <div className="font-bold text-white">Auto Approve UPI Payments</div>
                  <div className="text-slate-400 text-[11px]">Automatically credit user wallet upon valid UTR submission</div>
                </div>
                <input
                  type="checkbox"
                  checked={autoApprove}
                  onChange={(e) => setAutoApprove(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-purple-950/30 border border-purple-800/40 rounded-xl p-3.5 flex items-start gap-3">
                <Zap className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div className="text-xs text-purple-200/90 leading-relaxed">
                  Connect your Reseller Provider API (Bantibhaiya or your custom FF Panel API). When users buy keys on your bot, keys will be generated instantly in 1-second!
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Provider Name
                </label>
                <input
                  type="text"
                  value={providerName || ''}
                  onChange={(e) => setProviderName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Provider Endpoint URL (API URL) <span className="text-pink-400">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://bantibhaiya.to/api/reseller_v1.php"
                  value={apiUrl || ''}
                  onChange={(e) => setApiUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Reseller API Key <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="87224c074a021676364829b5b3f0686e"
                    value={resellerApiKey || ''}
                    onChange={(e) => setResellerApiKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Master Key / Secret <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="a7f3e8b2c9d1f4a6b8c2d5e9f1a3b6c8"
                    value={masterKey || ''}
                    onChange={(e) => setMasterKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs">
                  <div className="font-bold text-white">Auto-Fallback to Provider API</div>
                  <div className="text-slate-400 text-[11px]">If local key vault runs out of keys, automatically fetch live key from Provider</div>
                </div>
                <input
                  type="checkbox"
                  checked={autoFallback}
                  onChange={(e) => setAutoFallback(e.target.checked)}
                  className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Navigation & Submit Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev - 1) as any)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Back
              </button>
            ) : (
              <div></div>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && !botName.trim()) {
                    alert('Please provide a Bot Name first.');
                    return;
                  }
                  setStep((prev) => (prev + 1) as any);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg transition"
              >
                Continue to Next Step →
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Launch & Deploy Bot Now</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
