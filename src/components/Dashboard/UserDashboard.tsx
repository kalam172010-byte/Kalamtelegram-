import React, { useState } from 'react';
import { useBot } from '../../context/BotContext';
import {
  Bot,
  Shield,
  CreditCard,
  Zap,
  Crown,
  Wallet,
  Sparkles,
  Smartphone,
  Plus,
  Play,
  Pause,
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  KeyRound,
  Layers,
  Settings,
  User as UserIcon,
  RefreshCw,
  Check,
  ChevronRight,
  ShieldCheck,
  DollarSign,
  Activity,
  Package
} from 'lucide-react';
import { CreateBotWizardModal } from '../BotManager/CreateBotWizardModal';
import { UserProfileModal } from '../Auth/UserProfileModal';

export const UserDashboard: React.FC = () => {
  const {
    currentUser,
    myBots,
    activeBot,
    activeBotId,
    switchActiveBot,
    setActiveTab,
    orders,
    products,
    productKeys,
    botStatus,
    logout
  } = useBot();

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [copiedChatId, setCopiedChatId] = useState(false);

  // Check if current user is Master Admin
  const isMasterAdmin =
    currentUser.user_id === 12846461 ||
    currentUser.email?.toLowerCase() === 'kalam172010@gmail.com' ||
    currentUser.email?.toLowerCase() === 'kk7953926@gmail.com';

  const onlineBotsCount = myBots.filter(b => b.status === 'ONLINE').length;
  const userOrders = orders.filter(o => o.user_id === currentUser.user_id);
  const totalBotRevenue = myBots.reduce((sum, b) => sum + (b.stats?.total_revenue || 0), 0);
  const totalBotOrders = myBots.reduce((sum, b) => sum + (b.stats?.total_orders || 0), 0);

  const handleCopy = (text: string, type: 'token' | 'uid' | 'chat') => {
    navigator.clipboard.writeText(text);
    if (type === 'token') {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } else if (type === 'uid') {
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    } else {
      setCopiedChatId(true);
      setTimeout(() => setCopiedChatId(false), 2000);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-full w-full bg-slate-950 text-slate-100 p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Personalized Header / Welcome Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800/80 rounded-2xl p-5 md:p-7 shadow-xl shadow-cyan-950/10 relative overflow-hidden">
        {/* Subtle Background Glows */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* User Info Block */}
          <div className="flex items-start md:items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={currentUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.username}`}
                alt={currentUser.first_name}
                className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-800 border-2 border-cyan-500/30 p-1 shadow-md object-cover"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  {getGreeting()},{' '}
                  <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
                    {currentUser.first_name || currentUser.username}
                  </span>
                </h1>

                {/* Account Tier Badge */}
                {currentUser.account_type === 'VIP' ? (
                  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    VIP Member
                  </span>
                ) : currentUser.account_type === 'Reseller' ? (
                  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                    <Zap className="w-3.5 h-3.5 text-purple-400" />
                    Reseller Tier
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    Regular Account
                  </span>
                )}

                {isMasterAdmin && (
                  <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                    <Shield className="w-3.5 h-3.5 text-rose-400" />
                    Master Admin
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
                {/* Telegram UID */}
                <span className="flex items-center gap-1 bg-slate-950/70 px-2 py-0.5 rounded-lg border border-cyan-500/25">
                  <span className="text-cyan-400 font-mono font-bold text-[10px]">UID:</span>
                  <span className="font-mono text-cyan-200 font-semibold">{currentUser.user_id}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(String(currentUser.user_id), 'uid')}
                    className="text-slate-400 hover:text-cyan-300 p-0.5 transition cursor-pointer"
                    title="Copy Telegram User ID"
                  >
                    {copiedUid ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </span>

                {/* Telegram Chat ID */}
                <span className="flex items-center gap-1 bg-slate-950/70 px-2 py-0.5 rounded-lg border border-indigo-500/25">
                  <span className="text-indigo-400 font-mono font-bold text-[10px]">CHAT ID:</span>
                  <span className="font-mono text-indigo-200 font-semibold">{currentUser.chat_id || currentUser.user_id}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(String(currentUser.chat_id || currentUser.user_id), 'chat')}
                    className="text-slate-400 hover:text-indigo-300 p-0.5 transition cursor-pointer"
                    title="Copy Telegram Chat ID"
                  >
                    {copiedChatId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </span>

                <span className="text-slate-700">•</span>

                <span>
                  {currentUser.email ? (
                    <span className="text-slate-300 font-medium">{currentUser.email}</span>
                  ) : (
                    <span className="text-slate-400">@{currentUser.username}</span>
                  )}
                </span>

                <span className="text-slate-700">•</span>

                <span className="text-slate-400">
                  Joined: {currentUser.joined_date ? currentUser.joined_date.split(' ')[0] : '2026-02-14'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsWizardOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-600/25 transition text-xs md:text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Deploy New Bot</span>
            </button>

            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold px-3.5 py-2.5 rounded-xl border border-slate-700 transition text-xs md:text-sm cursor-pointer"
            >
              <UserIcon className="w-4 h-4 text-cyan-400" />
              <span>Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Overview Metrics & KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Subscription & Account Status */}
        <div className="bg-slate-900/80 border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-4.5 flex flex-col justify-between transition group shadow-md">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Plan & Status</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-extrabold text-white">
                  {currentUser.account_type === 'VIP'
                    ? 'VIP Pass'
                    : currentUser.account_type === 'Reseller'
                    ? 'Reseller Pro'
                    : 'Standard Free'}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              currentUser.account_type === 'VIP'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : currentUser.account_type === 'Reseller'
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
            }`}>
              {currentUser.account_type === 'VIP' ? (
                <Crown className="w-5 h-5" />
              ) : currentUser.account_type === 'Reseller' ? (
                <Zap className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>
              {currentUser.account_type === 'VIP'
                ? '15% Auto VIP Discount'
                : currentUser.account_type === 'Reseller'
                ? 'Wholesale API Access'
                : 'Standard Store Access'}
            </span>
            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-0.5"
            >
              Details <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 2: Bots Deployed */}
        <div className="bg-slate-900/80 border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-4.5 flex flex-col justify-between transition group shadow-md">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bots Deployed</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-white">{myBots.length}</span>
                <span className="text-xs text-slate-400">instances</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {onlineBotsCount} Active Online
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('my_bots')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-0.5"
            >
              Manage <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 3: Wallet Balance */}
        <div className="bg-slate-900/80 border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-4.5 flex flex-col justify-between transition group shadow-md">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Wallet Balance</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-emerald-400">
                  ₹{currentUser.balance.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Spent: ₹{currentUser.spent.toFixed(2)}</span>
            <button
              type="button"
              onClick={() => setActiveTab('bot')}
              className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-0.5"
            >
              Add Funds <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 4: Orders & Key Volume */}
        <div className="bg-slate-900/80 border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-4.5 flex flex-col justify-between transition group shadow-md">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Purchases</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-white">{currentUser.orders_count || userOrders.length}</span>
                <span className="text-xs text-slate-400">keys received</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Total Saved: ₹{currentUser.total_saved.toFixed(2)}</span>
            <button
              type="button"
              onClick={() => setActiveTab('bot')}
              className="text-purple-400 hover:text-purple-300 font-semibold inline-flex items-center gap-0.5"
            >
              Store <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Active Primary Bot Live Overview / Empty State */}
      {activeBot ? (
        <div className="bg-slate-900/90 border border-cyan-500/20 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            {/* Bot Details */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center font-black text-white shadow-lg shadow-cyan-500/20 text-xl shrink-0">
                🤖
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
                    {activeBot.name}
                  </h2>
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded-md border border-cyan-500/30">
                    @{activeBot.username}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    activeBot.status === 'ONLINE'
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {activeBot.status}
                  </span>
                </div>

                <p className="text-xs md:text-sm text-slate-400 mt-1 line-clamp-1">
                  {activeBot.description || 'Automated Telegram Shop for Keys & Mod Panels.'}
                </p>

                {/* Integration Badges */}
                <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs">
                  <span className="inline-flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-400">Gateway:</span>
                    <strong className="text-slate-200">
                      {activeBot.payment_gateway?.upi_id ? activeBot.payment_gateway.upi_id : 'FamPay / UPI'}
                    </strong>
                  </span>

                  <span className="inline-flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">
                    <Zap className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-slate-400">Reseller API:</span>
                    <strong className="text-slate-200">
                      {activeBot.reseller_api?.api_key ? 'Connected' : 'Standalone'}
                    </strong>
                  </span>

                  <span className="inline-flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-400 font-mono text-[11px]">
                    Token: {activeBot.bot_token ? `${activeBot.bot_token.substring(0, 8)}...` : 'Not Configured'}
                    {activeBot.bot_token && (
                      <button
                        type="button"
                        onClick={() => handleCopy(activeBot.bot_token, 'token')}
                        className="text-slate-400 hover:text-cyan-400 ml-1 transition"
                        title="Copy Bot Token"
                      >
                        {copiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions for this Bot */}
            <div className="flex flex-wrap items-center gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('bot')}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-md shadow-cyan-600/20 text-xs md:text-sm transition cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Launch Simulator</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('gateways')}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3.5 py-2.5 rounded-xl border border-slate-700 text-xs md:text-sm transition cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Gateways</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reseller_api')}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3.5 py-2.5 rounded-xl border border-slate-700 text-xs md:text-sm transition cursor-pointer"
              >
                <Zap className="w-4 h-4 text-purple-400" />
                <span>Reseller API</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('my_bots')}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3.5 py-2.5 rounded-xl border border-slate-700 text-xs md:text-sm transition cursor-pointer"
              >
                <Settings className="w-4 h-4 text-cyan-400" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State Onboarding Card */
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 border border-cyan-500/30 rounded-2xl p-6 md:p-8 text-center shadow-xl relative overflow-hidden">
          <div className="max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-white shadow-xl shadow-cyan-500/25 text-3xl mx-auto">
              ⚡
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                Launch Your First Telegram Store Bot
              </h2>
              <p className="text-slate-400 text-xs md:text-sm mt-1.5">
                Connect your bot token from @BotFather, link your UPI or FamPay gateway, and start selling panel keys automatically 24/7.
              </p>
            </div>

            {/* 3 Step Flow */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left py-2">
              <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-cyan-400 uppercase">Step 1</span>
                <h4 className="text-xs font-bold text-white mt-0.5">Telegram Bot Token</h4>
                <p className="text-[11px] text-slate-400 mt-1">Get API token from @BotFather on Telegram.</p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-emerald-400 uppercase">Step 2</span>
                <h4 className="text-xs font-bold text-white mt-0.5">Payment Gateway</h4>
                <p className="text-[11px] text-slate-400 mt-1">Add your UPI ID or FamPay Key for instant payments.</p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-purple-400 uppercase">Step 3</span>
                <h4 className="text-xs font-bold text-white mt-0.5">Automate Keys</h4>
                <p className="text-[11px] text-slate-400 mt-1">Deliver keys instantly from Vault or Banti Reseller API.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsWizardOpen(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-cyan-500/25 transition text-sm cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>Deploy Telegram Bot Now</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Quick Links to Configurations Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Quick Configuration & Management Hub</span>
          </h3>
          <span className="text-xs text-slate-500">1-click navigation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Link 1: My Bots Hub */}
          <div
            onClick={() => setActiveTab('my_bots')}
            className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 p-4.5 rounded-2xl cursor-pointer transition group hover:bg-slate-900 shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                <Bot className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {myBots.length} Bots
              </span>
            </div>
            <h4 className="font-bold text-white text-sm md:text-base mt-3 group-hover:text-cyan-300 transition">
              My Bots Dashboard
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Deploy, configure, restart, clone, or delete multiple Telegram bot instances with dedicated tokens.
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition">
              <span>Manage Bots</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Link 2: Telegram Bot Simulator */}
          <div
            onClick={() => setActiveTab('bot')}
            className="bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 p-4.5 rounded-2xl cursor-pointer transition group hover:bg-slate-900 shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                Interactive
              </span>
            </div>
            <h4 className="font-bold text-white text-sm md:text-base mt-3 group-hover:text-blue-300 transition">
              Live Bot Simulator
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Test your active store bot in real-time mobile frame with inline keyboards, cart flow, and instant checkout.
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-400 group-hover:translate-x-1 transition">
              <span>Open Simulator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Link 3: Payment Gateway Manager */}
          <div
            onClick={() => setActiveTab('gateways')}
            className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 p-4.5 rounded-2xl cursor-pointer transition group hover:bg-slate-900 shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                UPI / FamPay
              </span>
            </div>
            <h4 className="font-bold text-white text-sm md:text-base mt-3 group-hover:text-emerald-300 transition">
              Payment Gateway Setup
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Connect your UPI ID, QR code, FamPay / FamGateway API, or Crypto USDT TRC-20 automated payment bridge.
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition">
              <span>Configure Gateways</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Link 4: Reseller API Manager */}
          <div
            onClick={() => setActiveTab('reseller_api')}
            className="bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 p-4.5 rounded-2xl cursor-pointer transition group hover:bg-slate-900 shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/30">
                Banti Provider
              </span>
            </div>
            <h4 className="font-bold text-white text-sm md:text-base mt-3 group-hover:text-purple-300 transition">
              Reseller API Integration
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Connect Bantibhaiya or third-party key provider API, test live balance, and enable instant auto-fallback delivery.
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-purple-400 group-hover:translate-x-1 transition">
              <span>Setup Reseller API</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Link 5: Profile & Security */}
          <div
            onClick={() => setIsProfileOpen(true)}
            className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 p-4.5 rounded-2xl cursor-pointer transition group hover:bg-slate-900 shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                <UserIcon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                Security
              </span>
            </div>
            <h4 className="font-bold text-white text-sm md:text-base mt-3 group-hover:text-amber-300 transition">
              Account Profile & Security
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Manage your login credentials, update password, switch active profile, or review your membership tier benefits.
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition">
              <span>Manage Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Link 6: Master Admin Hub (Only for Master Admin) */}
          {isMasterAdmin ? (
            <div
              onClick={() => setActiveTab('admin')}
              className="bg-slate-900/80 border border-indigo-500/30 hover:border-indigo-500/60 p-4.5 rounded-2xl cursor-pointer transition group hover:bg-slate-900 shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-extrabold text-rose-300 bg-rose-950/50 px-2 py-0.5 rounded border border-rose-500/30">
                  Master
                </span>
              </div>
              <h4 className="font-bold text-white text-sm md:text-base mt-3 group-hover:text-indigo-300 transition">
                Platform Admin Hub
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Full platform control center: manage all registered users, global stock keys, broadcasts, and system settings.
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition">
                <span>Open Admin Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ) : (
            /* Telegram Webhook Guide for Standard Users */
            <div className="bg-slate-900/80 border border-slate-800 p-4.5 rounded-2xl flex flex-col justify-between shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                  Cloud Live
                </span>
              </div>
              <h4 className="font-bold text-white text-sm md:text-base mt-3">
                Live Telegram Polling
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Your bot automatically receives `/start` and inline queries via Cloud Server Long Polling engine.
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Engine Active</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Recent Purchases & Delivered Keys Table */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 md:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-white text-sm md:text-base">
              Recent Delivered Keys & Purchases
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('bot')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
          >
            Open Store Simulator
          </button>
        </div>

        {userOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pr-4">Order ID</th>
                  <th className="pb-3 pr-4">Product / Panel</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Delivered Key</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200 font-medium">
                {userOrders.slice(0, 5).map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 pr-4 font-mono text-cyan-400 font-bold">
                      #{ord.id}
                    </td>
                    <td className="py-3 pr-4 text-white font-semibold">
                      {ord.product_name}
                    </td>
                    <td className="py-3 pr-4 text-emerald-400 font-bold">
                      ₹{ord.price_paid.toFixed(2)}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] bg-slate-950 px-2.5 py-1 rounded border border-slate-800 max-w-fit">
                        <span className="text-amber-300 font-semibold select-all">{ord.delivered_key}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(ord.delivered_key);
                          }}
                          className="text-slate-500 hover:text-cyan-300"
                          title="Copy Key"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 text-slate-400 text-[11px]">
                      {ord.purchase_date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
            <Package className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">No purchase transactions recorded yet.</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Purchases made inside the Telegram Bot Simulator will appear here automatically.
            </p>
          </div>
        )}
      </div>

      {/* Create Bot Wizard Modal */}
      <CreateBotWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
};
