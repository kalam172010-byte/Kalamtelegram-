import React, { useState, useRef } from 'react';
import { useBot } from '../../context/BotContext';
import { motion } from 'motion/react';
import {
  Bot,
  Shield,
  CreditCard,
  Zap,
  Gift,
  Share2,
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
  Package,
  Users,
  Megaphone,
  Camera,
  Send
} from 'lucide-react';
import { CreateBotWizardModal } from '../BotManager/CreateBotWizardModal';
import { UserProfileModal } from '../Auth/UserProfileModal';
import { ProductCatalog } from '../Catalog/ProductCatalog';

export const UserDashboard: React.FC = () => {
  const {
    currentUser,
    updateUserProfile,
    myBots,
    activeBot,
    activeBotId,
    switchActiveBot,
    setActiveTab,
    setAdminTab,
    openAddProductModal,
    orders,
    products,
    productKeys,
    allUsers,
    settings,
    botStatus,
    logout
  } = useBot();

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [copiedChatId, setCopiedChatId] = useState(false);
  const [copiedRefLink, setCopiedRefLink] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDirectPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const targetSize = 256;
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;
          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, targetSize, targetSize);
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          updateUserProfile({ avatar_url: compressed });
        } else {
          updateUserProfile({ avatar_url: event.target?.result as string });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Allow full Master Admin access
  const isMasterAdmin =
    Boolean(currentUser.is_admin) ||
    currentUser.user_id === 12846461 ||
    currentUser.email?.toLowerCase() === 'kalam172010@gmail.com' ||
    currentUser.email?.toLowerCase() === 'kk7953926@gmail.com' ||
    currentUser.email?.toLowerCase() === 'kalamkalam1234kd@gmail.com' ||
    true;

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

  const formatLiveDate = (dateStr?: string) => {
    if (!dateStr) return 'Active Now';
    try {
      const d = new Date(dateStr.includes('T') ? dateStr : (dateStr || '').replace(' ', 'T'));
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="min-h-full w-full text-slate-100 p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto"
    >
      {/* 1. Personalized Header / Welcome Hero with Liquid Glass */}
      <motion.div
        whileHover={{ scale: 1.003 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="liquid-glass-card rounded-3xl p-5 md:p-7 shadow-2xl relative overflow-hidden"
      >
        {/* Subtle Background Glows */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* User Info Block */}
          <div className="flex items-start md:items-center gap-4">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleDirectPhotoUpload}
              className="hidden"
            />
            <div
              className="relative shrink-0 cursor-pointer group"
              title="Click photo to upload or change profile image"
            >
              <img
                src={currentUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.username}`}
                alt={currentUser.first_name}
                className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-900/80 border-2 border-white/20 group-hover:border-cyan-400 p-1 shadow-xl object-cover transition"
                onClick={() => setIsProfileOpen(true)}
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center shadow-[0_0_8px_rgba(16,185,129,0.8)]">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="absolute -bottom-1 -left-1 p-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full shadow-lg border border-slate-900 transition cursor-pointer"
                title="Quick Upload Image File"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  {getGreeting()},{' '}
                  <span className="bg-gradient-to-r from-cyan-300 via-teal-200 to-blue-300 bg-clip-text text-transparent">
                    {currentUser.first_name || currentUser.username}
                  </span>
                </h1>

                {/* Account Tier Badge */}
                {currentUser.referral_count && currentUser.referral_count > 0 ? (
                  <span className="inline-flex items-center gap-1 liquid-glass-pill text-pink-300 border-pink-500/40 text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                    <Gift className="w-3.5 h-3.5 text-pink-400" />
                    Top Promoter ({currentUser.referral_count})
                  </span>
                ) : currentUser.account_type === 'Reseller' ? (
                  <span className="inline-flex items-center gap-1 liquid-glass-pill text-purple-300 border-purple-500/40 text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                    <Zap className="w-3.5 h-3.5 text-purple-400" />
                    Reseller Tier
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 liquid-glass-pill text-cyan-300 border-cyan-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    Regular Account
                  </span>
                )}

                {isMasterAdmin && (
                  <span className="inline-flex items-center gap-1 liquid-glass-pill text-rose-300 border-rose-500/40 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                    <Shield className="w-3.5 h-3.5 text-rose-400" />
                    Master Admin
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-2 text-xs text-slate-400">
                {/* Real-time Login Date & Time */}
                <span className="flex items-center gap-1 liquid-glass-pill px-2.5 py-0.5 rounded-xl border border-emerald-500/40 text-emerald-300 font-mono text-[11px] bg-emerald-950/40 shadow-sm">
                  <Clock className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>Login: {formatLiveDate(currentUser.last_login || currentUser.login_at || currentUser.joined_date)}</span>
                </span>

                {/* Telegram UID */}
                <span className="flex items-center gap-1 liquid-glass-pill px-2 py-0.5 rounded-xl border border-cyan-500/30">
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
                <span className="flex items-center gap-1 liquid-glass-pill px-2 py-0.5 rounded-xl border border-indigo-500/30">
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

                <span className="text-slate-600 hidden sm:inline">•</span>

                <span className="hidden sm:inline">
                  {currentUser.email ? (
                    <span className="text-slate-300 font-medium">{currentUser.email}</span>
                  ) : (
                    <span className="text-slate-400">@{currentUser.username}</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons for Hero */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Direct Add Product Button */}
            <button
              type="button"
              onClick={openAddProductModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black shadow-lg shadow-amber-500/25 transition text-xs cursor-pointer active:scale-95 border border-amber-300/60"
            >
              <Plus className="w-4 h-4 font-black" />
              <span>+ Add Product</span>
            </button>

            {/* Direct Products Tab Button */}
            <button
              type="button"
              onClick={() => {
                setAdminTab('products');
                setActiveTab('admin');
              }}
              className="flex items-center gap-1.5 liquid-glass-pill bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-bold px-3.5 py-2.5 rounded-2xl shadow-lg transition text-xs cursor-pointer active:scale-95"
            >
              <Package className="w-3.5 h-3.5 text-amber-300" />
              <span>Products ({products.length})</span>
            </button>

            {/* Direct Users Tab Button */}
            <button
              type="button"
              onClick={() => {
                setAdminTab('users');
                setActiveTab('admin');
              }}
              className="flex items-center gap-1.5 liquid-glass-pill bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 font-bold px-3.5 py-2.5 rounded-2xl shadow-lg transition text-xs cursor-pointer active:scale-95"
            >
              <Users className="w-3.5 h-3.5 text-emerald-300" />
              <span>Users ({allUsers.length})</span>
            </button>

            {activeBot?.username && (
              <a
                href={`https://t.me/${activeBot.username}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 liquid-glass-btn-cyan text-white font-bold px-3.5 py-2.5 rounded-2xl shadow-lg transition text-xs cursor-pointer active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Telegram</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => setIsWizardOpen(true)}
              className="flex items-center gap-1.5 liquid-glass-pill bg-white/10 hover:bg-white/15 text-white font-bold px-3.5 py-2.5 rounded-2xl shadow-lg transition text-xs cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 text-cyan-300" />
              <span>Deploy Bot</span>
            </button>

            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-1.5 liquid-glass-pill hover:bg-white/10 text-slate-200 hover:text-white font-semibold px-3 py-2.5 rounded-2xl transition text-xs cursor-pointer active:scale-95"
            >
              <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Profile</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* 2. Overview Metrics & KPI Cards (Mobile Optimized 2x2 Liquid Glass Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Card 1: Refer & Earn Rewards */}
        <div className="liquid-glass-interactive rounded-3xl p-3.5 sm:p-5 flex flex-col justify-between group">
          <div className="flex items-start justify-between gap-1.5">
            <div>
              <span className="text-[10px] sm:text-xs font-semibold text-pink-400 uppercase tracking-wider flex items-center gap-1">
                <Gift className="w-3 h-3 text-pink-400" />
                Refer & Earn
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg sm:text-2xl font-black text-white font-mono drop-shadow-[0_0_12px_rgba(244,114,182,0.3)]">
                  ₹{(currentUser.referral_earnings || 0).toFixed(0)}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-400">earned</span>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-pink-500/15 text-pink-300 border border-pink-500/30 flex items-center justify-center shrink-0">
              <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          <div className="mt-2.5 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] sm:text-xs text-slate-400">
            <span className="truncate max-w-[90px] sm:max-w-none text-pink-300 font-medium">
              👥 {currentUser.referral_count || 0} Invited
            </span>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('referral-hub-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-pink-300 hover:text-white font-semibold inline-flex items-center gap-0.5 shrink-0 cursor-pointer"
            >
              Share <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 2: Bots Deployed */}
        <div className="liquid-glass-interactive rounded-3xl p-3.5 sm:p-5 flex flex-col justify-between group">
          <div className="flex items-start justify-between gap-1.5">
            <div>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">My Store Bots</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg sm:text-2xl font-black text-white">{myBots.length}</span>
                <span className="text-[10px] sm:text-xs text-slate-400">bots</span>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          <div className="mt-2.5 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] sm:text-xs">
            <span className="flex items-center gap-1 text-emerald-300 font-medium truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              {onlineBotsCount} Online
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('my_bots')}
              className="text-cyan-300 hover:text-white font-semibold inline-flex items-center gap-0.5 shrink-0"
            >
              Manage <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 3: Wallet Balance */}
        <div className="liquid-glass-interactive rounded-3xl p-3.5 sm:p-5 flex flex-col justify-between group">
          <div className="flex items-start justify-between gap-1.5">
            <div>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Wallet Balance</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg sm:text-2xl font-black text-emerald-300 font-mono drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]">
                  ₹{currentUser.balance.toFixed(0)}
                </span>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          <div className="mt-2.5 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] sm:text-xs text-slate-400">
            <span className="truncate">Spent: ₹{currentUser.spent.toFixed(0)}</span>
            <button
              type="button"
              onClick={() => setActiveTab('gateways')}
              className="text-emerald-300 hover:text-white font-semibold inline-flex items-center gap-0.5 shrink-0"
            >
              + Add <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 4: Orders & Key Volume */}
        <div className="liquid-glass-interactive rounded-3xl p-3.5 sm:p-5 flex flex-col justify-between group">
          <div className="flex items-start justify-between gap-1.5">
            <div>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Keys Bought</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg sm:text-2xl font-black text-white">{currentUser.orders_count || userOrders.length}</span>
                <span className="text-[10px] sm:text-xs text-slate-400">keys</span>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          <div className="mt-2.5 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] sm:text-xs text-slate-400">
            <span className="truncate">Saved: ₹{currentUser.total_saved.toFixed(0)}</span>
            <button
              type="button"
              onClick={() => {
                setAdminTab('products');
                setActiveTab('admin');
              }}
              className="text-purple-300 hover:text-white font-semibold inline-flex items-center gap-0.5 shrink-0"
            >
              Catalog <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Active Primary Bot Live Overview / Empty State */}
      {activeBot ? (
        <div className="liquid-glass-card rounded-3xl p-5 md:p-6 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            {/* Bot Details */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-white shadow-xl shadow-cyan-500/30 text-xl shrink-0 border border-white/20">
                🤖
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
                    {activeBot.name}
                  </h2>
                  <span className="text-xs font-mono text-cyan-300 liquid-glass-pill px-2.5 py-0.5 rounded-xl border border-cyan-500/30">
                    @{activeBot.username}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    activeBot.status === 'ONLINE'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {activeBot.status}
                  </span>
                </div>

                <p className="text-xs md:text-sm text-slate-300 mt-1 line-clamp-1">
                  {activeBot.description || 'Automated Telegram Shop for Keys & Mod Panels.'}
                </p>

                {/* Integration Badges */}
                <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs">
                  <span className="inline-flex items-center gap-1.5 liquid-glass-pill px-2.5 py-1 rounded-xl text-slate-300">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-400">Gateway:</span>
                    <strong className="text-slate-200">
                      {activeBot.payment_gateway?.upi_id ? activeBot.payment_gateway.upi_id : 'FamPay / UPI'}
                    </strong>
                  </span>

                  <span className="inline-flex items-center gap-1.5 liquid-glass-pill px-2.5 py-1 rounded-xl text-slate-300">
                    <Zap className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-slate-400">Reseller API:</span>
                    <strong className="text-slate-200">
                      {activeBot.reseller_api?.api_key ? 'Connected' : 'Standalone'}
                    </strong>
                  </span>

                  <span className="inline-flex items-center gap-1.5 liquid-glass-pill px-2.5 py-1 rounded-xl text-slate-400 font-mono text-[11px]">
                    Token: {activeBot.bot_token ? `${activeBot.bot_token.substring(0, 8)}...` : 'Not Configured'}
                    {activeBot.bot_token && (
                      <button
                        type="button"
                        onClick={() => handleCopy(activeBot.bot_token, 'token')}
                        className="text-slate-400 hover:text-cyan-300 ml-1 transition cursor-pointer"
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
            <div className="flex flex-wrap items-center gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/5">
              {activeBot?.username && (
                <a
                  href={`https://t.me/${(activeBot.username || '').replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 liquid-glass-btn-cyan text-white font-bold px-4 py-2.5 rounded-2xl shadow-lg text-xs md:text-sm transition cursor-pointer active:scale-95 no-underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open in Telegram</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('gateways')}
                className="flex items-center gap-2 liquid-glass-pill hover:bg-white/10 text-slate-200 font-semibold px-3.5 py-2.5 rounded-2xl text-xs md:text-sm transition cursor-pointer active:scale-95"
              >
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Gateways</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reseller_api')}
                className="flex items-center gap-2 liquid-glass-pill hover:bg-white/10 text-slate-200 font-semibold px-3.5 py-2.5 rounded-2xl text-xs md:text-sm transition cursor-pointer active:scale-95"
              >
                <Zap className="w-4 h-4 text-purple-400" />
                <span>Reseller API</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('my_bots')}
                className="flex items-center gap-2 liquid-glass-pill hover:bg-white/10 text-slate-200 font-semibold px-3.5 py-2.5 rounded-2xl text-xs md:text-sm transition cursor-pointer active:scale-95"
              >
                <Settings className="w-4 h-4 text-cyan-400" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State Onboarding Card */
        <div className="liquid-glass-card rounded-3xl p-6 md:p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center font-black text-white shadow-xl shadow-cyan-500/30 text-3xl mx-auto border border-white/30">
              ⚡
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                Launch Your First Telegram Store Bot
              </h2>
              <p className="text-slate-300 text-xs md:text-sm mt-1.5">
                Connect your bot token from @BotFather, link your UPI or FamPay gateway, and start selling panel keys automatically 24/7.
              </p>
            </div>

            {/* 3 Step Flow */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left py-2">
              <div className="liquid-glass-pill p-3.5 rounded-2xl">
                <span className="text-[10px] font-bold text-cyan-300 uppercase">Step 1</span>
                <h4 className="text-xs font-bold text-white mt-0.5">Telegram Bot Token</h4>
                <p className="text-[11px] text-slate-300 mt-1">Get API token from @BotFather on Telegram.</p>
              </div>

              <div className="liquid-glass-pill p-3.5 rounded-2xl">
                <span className="text-[10px] font-bold text-emerald-300 uppercase">Step 2</span>
                <h4 className="text-xs font-bold text-white mt-0.5">Payment Gateway</h4>
                <p className="text-[11px] text-slate-300 mt-1">Add your UPI ID or FamPay Key for instant payments.</p>
              </div>

              <div className="liquid-glass-pill p-3.5 rounded-2xl">
                <span className="text-[10px] font-bold text-purple-300 uppercase">Step 3</span>
                <h4 className="text-xs font-bold text-white mt-0.5">Automate Keys</h4>
                <p className="text-[11px] text-slate-300 mt-1">Deliver keys instantly from Vault or Banti Reseller API.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsWizardOpen(true)}
              className="inline-flex items-center gap-2 liquid-glass-btn-cyan text-white font-bold px-6 py-3 rounded-2xl shadow-xl transition text-sm cursor-pointer active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>Deploy Telegram Bot Now</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. 🛒 Products Catalog & Duration Plans */}
      <div className="liquid-glass-card rounded-3xl p-5 md:p-7 shadow-2xl relative overflow-hidden border border-cyan-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-cyan-500/25 shrink-0 border border-cyan-400/40">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg md:text-xl font-black text-white tracking-tight">
                  Product Store & Instant Key Catalog
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Live Stock
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Browse all panels, select your desired duration plan, and buy instant license keys.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openAddProductModal}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        <ProductCatalog />
      </div>

      {/* 5. 🎁 Refer & Earn Rewards Hub */}
      <div id="referral-hub-section" className="liquid-glass-card rounded-3xl p-5 md:p-7 shadow-2xl relative overflow-hidden border border-pink-500/30">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-500/10 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-xl shadow-pink-500/25 shrink-0 border border-pink-400/40">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg md:text-xl font-black text-white tracking-tight">
                    Refer & Earn Rewards Program
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/40">
                    Live Cash Bonus
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Invite friends to Kalam FF Panel Bot and earn real instant cash plus lifetime recharge commissions!
                </p>
              </div>
            </div>

            {/* Total Earnings Pill */}
            <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-2xl border border-pink-500/30 self-start md:self-auto">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Cash Earned</span>
                <span className="text-lg font-black text-pink-300 font-mono">
                  ₹{(currentUser.referral_earnings || 0).toFixed(2)}
                </span>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Friends</span>
                <span className="text-lg font-black text-white font-mono">
                  {currentUser.referral_count || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Referral Link Box & 1-Click Action */}
          {(() => {
            const botUser = activeBot?.username || settings.bot_username || 'kalam_store_bot';
            const referralLink = `https://t.me/${botUser}?start=ref_${currentUser.user_id}`;
            const refereeBonus = Number(settings.referral_referee_bonus_inr ?? 1.50);
            const refReward = Number(settings.referral_reward_inr ?? 1.50);
            const shareText = encodeURIComponent(`🔥 Join Kalam FF Panel Bot for instant cheats, bypass keys & high speed panels! Register now and get ₹${refereeBonus.toFixed(2)} free bonus: ${referralLink}`);
            const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${shareText}`;

            return (
              <div className="bg-slate-950/70 p-4 md:p-5 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                    Your Personal Telegram Referral Link:
                  </span>
                  <span className="text-[11px] text-pink-300 font-semibold">
                    Give ₹{refereeBonus.toFixed(2)} • Get ₹{refReward.toFixed(2)} + {settings.referral_commission_percent || 5}%
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                  <div className="flex-1 bg-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-700/80 font-mono text-xs text-pink-200 truncate flex items-center select-all">
                    {referralLink}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(referralLink);
                      setCopiedRefLink(true);
                      setTimeout(() => setCopiedRefLink(false), 2000);
                    }}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer active:scale-95 border border-slate-600 shrink-0"
                  >
                    {copiedRefLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
                    <span>{copiedRefLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>

                  <a
                    href={tgShareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-400 hover:to-rose-500 text-white font-bold text-xs transition shadow-lg shadow-pink-500/25 cursor-pointer active:scale-95 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span>Share on Telegram</span>
                  </a>
                </div>
              </div>
            );
          })()}

          {/* 3 Step Reward Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="liquid-glass-pill p-4 rounded-2xl border border-pink-500/20 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400">Step 1 • Instant Bonus</span>
                <h4 className="text-sm font-extrabold text-white mt-1">₹{(settings.referral_reward_inr ?? 1.50).toFixed(2)} Per Friend</h4>
                <p className="text-xs text-slate-300 mt-1">
                  Credited directly to your wallet balance the instant your friend opens your link and presses Start!
                </p>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Instant Wallet Credit</span>
              </div>
            </div>

            <div className="liquid-glass-pill p-4 rounded-2xl border border-purple-500/20 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Step 2 • Lifetime Commission</span>
                <h4 className="text-sm font-extrabold text-white mt-1">{settings.referral_commission_percent || 5}% Lifetime Cut</h4>
                <p className="text-xs text-slate-300 mt-1">
                  Earn automated commission every single time any of your referred friends deposit balance or buy keys.
                </p>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-purple-300 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Passive Income 24/7</span>
              </div>
            </div>

            <div className="liquid-glass-pill p-4 rounded-2xl border border-cyan-500/20 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Step 3 • Welcome Bonus</span>
                <h4 className="text-sm font-extrabold text-white mt-1">₹{(settings.referral_referee_bonus_inr ?? 1.50).toFixed(2)} Free for Friends</h4>
                <p className="text-xs text-slate-300 mt-1">
                  Your friends get free wallet cash to test out panels immediately upon clicking your invite link.
                </p>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-cyan-300 flex items-center gap-1">
                <Gift className="w-3.5 h-3.5" />
                <span>Mutual Benefit</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Quick Links to Configurations Grid with Liquid Glass */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Quick Configuration & Management Hub</span>
          </h3>
          <span className="text-xs text-slate-400">1-click navigation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Link 1: My Bots Hub */}
          <div
            onClick={() => setActiveTab('my_bots')}
            className="liquid-glass-interactive p-5 rounded-3xl cursor-pointer group shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition shadow-inner">
                <Bot className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono font-semibold text-cyan-200 liquid-glass-pill px-2.5 py-0.5 rounded-xl">
                {myBots.length} Bots
              </span>
            </div>
            <h4 className="font-bold text-white text-sm md:text-base mt-3 group-hover:text-cyan-300 transition">
              My Bots Dashboard
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              Deploy, configure, restart, clone, or delete multiple Telegram bot instances with dedicated tokens.
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-cyan-300 group-hover:translate-x-1 transition">
              <span>Manage Bots</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Link 2: Payment Gateways & UPI */}
          <div
            onClick={() => setActiveTab('gateways')}
            className="liquid-glass-interactive p-5 rounded-3xl cursor-pointer group shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition shadow-inner">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-emerald-300 liquid-glass-pill px-2.5 py-0.5 rounded-xl border border-emerald-500/30">
                Instant UPI
              </span>
            </div>
            <h4 className="font-bold text-white text-sm md:text-base mt-3 group-hover:text-emerald-300 transition">
              Payment Gateways & QR
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              Configure FamGateway, FamPay UPI QR, merchant webhooks, and automatic wallet recharge verification.
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-300 group-hover:translate-x-1 transition">
              <span>Open Gateways</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Link 3: Payment Gateway Manager */}
          <div
            onClick={() => setActiveTab('gateways')}
            className="liquid-glass-interactive p-5 rounded-3xl cursor-pointer group shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition shadow-inner">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-emerald-200 liquid-glass-pill px-2.5 py-0.5 rounded-xl">
                UPI / FamPay
              </span>
            </div>
            <h4 className="font-bold text-white text-sm md:text-base mt-3 group-hover:text-emerald-300 transition">
              Payment Gateway Setup
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              Connect your UPI ID, QR code, FamPay / FamGateway API, or Crypto USDT TRC-20 automated payment bridge.
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-300 group-hover:translate-x-1 transition">
              <span>Configure Gateways</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Link 4: Reseller API Manager */}
          <div
            onClick={() => setActiveTab('reseller_api')}
            className="liquid-glass-interactive p-5 rounded-3xl cursor-pointer group shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-11 h-11 rounded-2xl bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition shadow-inner">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-purple-300 liquid-glass-pill px-2.5 py-0.5 rounded-xl border border-purple-500/30">
                Banti Provider
              </span>
            </div>
            <h4 className="font-bold text-white text-sm md:text-base mt-3 group-hover:text-purple-300 transition">
              Reseller API Integration
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              Connect Bantibhaiya or third-party key provider API, test live balance, and enable instant auto-fallback delivery.
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-purple-300 group-hover:translate-x-1 transition">
              <span>Setup Reseller API</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Link 5: Profile & Security */}
          <div
            onClick={() => setIsProfileOpen(true)}
            className="liquid-glass-interactive p-5 rounded-3xl cursor-pointer group shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition shadow-inner">
                <UserIcon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-amber-300 liquid-glass-pill px-2.5 py-0.5 rounded-xl border border-amber-500/30">
                Security
              </span>
            </div>
            <h4 className="font-bold text-white text-sm md:text-base mt-3 group-hover:text-amber-300 transition">
              Account Profile & Security
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              Manage your login credentials, update password, switch active profile, or review your membership tier benefits.
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-amber-300 group-hover:translate-x-1 transition">
              <span>Manage Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Link 6: Master Admin Hub (Only for Master Admin) */}
          {isMasterAdmin ? (
            <div
              className="liquid-glass-interactive p-5 rounded-3xl group shadow-xl border-indigo-500/40 space-y-3"
            >
              <div
                onClick={() => {
                  setAdminTab('overview');
                  setActiveTab('admin');
                }}
                className="cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition shadow-inner">
                    <Shield className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-extrabold text-rose-300 liquid-glass-pill px-2.5 py-0.5 rounded-xl border border-rose-500/30">
                    Master Hub
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm md:text-base mt-3 group-hover:text-indigo-300 transition">
                  Platform Admin Hub
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Full platform control center: manage all registered users, global stock keys, broadcasts, and system settings.
                </p>
              </div>

              {/* Direct Quick Jump Action Pills */}
              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAdminTab('products');
                    setActiveTab('admin');
                  }}
                  className="px-2 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                >
                  <Package className="w-3 h-3" />
                  <span>Products</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAdminTab('users');
                    setActiveTab('admin');
                  }}
                  className="px-2 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                >
                  <Users className="w-3 h-3" />
                  <span>Users</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAdminTab('broadcast');
                    setActiveTab('admin');
                  }}
                  className="px-2 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-bold transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                >
                  <Megaphone className="w-3 h-3" />
                  <span>Broadcast</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAdminTab('gateways');
                    setActiveTab('admin');
                  }}
                  className="px-2 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 font-bold transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                >
                  <CreditCard className="w-3 h-3" />
                  <span>Gateways</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAdminTab('bots');
                    setActiveTab('admin');
                  }}
                  className="px-2 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 font-bold transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                >
                  <Bot className="w-3 h-3" />
                  <span>Bot Fleet</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAdminTab('overview');
                    setActiveTab('admin');
                  }}
                  className="px-2 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-bold transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                >
                  <Zap className="w-3 h-3" />
                  <span>Overview</span>
                </button>
              </div>
            </div>
          ) : (
            /* Telegram Webhook Guide for Standard Users */
            <div className="liquid-glass-card p-5 rounded-3xl flex flex-col justify-between shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-500/15 text-teal-300 border border-teal-500/30 flex items-center justify-center shrink-0 shadow-inner">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-emerald-300 liquid-glass-pill px-2.5 py-0.5 rounded-xl border border-emerald-500/30">
                  Cloud Live
                </span>
              </div>
              <h4 className="font-bold text-white text-sm md:text-base mt-3">
                Live Telegram Polling
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                Your bot automatically receives `/start` and inline queries via Cloud Server Long Polling engine.
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span>Engine Active</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Recent Purchases & Delivered Keys with Liquid Glass */}
      <div className="liquid-glass-card rounded-3xl p-4 sm:p-5 md:p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-white text-sm md:text-base">
              Recent Delivered Keys & Purchases
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setAdminTab('products');
              setActiveTab('admin');
            }}
            className="text-xs text-cyan-300 hover:text-white font-semibold cursor-pointer"
          >
            View Products
          </button>
        </div>

        {userOrders.length > 0 ? (
          <div>
            {/* Mobile Native Card View (visible on mobile, hidden on tablet/desktop) */}
            <div className="sm:hidden space-y-2.5">
              {userOrders.slice(0, 5).map((ord, oIdx) => (
                <div
                  key={`user-ord-mob-${ord.id || oIdx}-${oIdx}`}
                  className="liquid-glass-pill rounded-2xl p-3.5 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-cyan-300 liquid-glass-pill px-2 py-0.5 rounded-lg border border-cyan-500/30">
                        #{ord.id}
                      </span>
                      <h4 className="text-xs font-bold text-white mt-1.5">{ord.product_name}</h4>
                    </div>
                    <span className="text-xs font-mono font-extrabold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-xl border border-emerald-500/30">
                      ₹{ord.price_paid.toFixed(0)}
                    </span>
                  </div>

                  {/* Key Box with 1-Tap Copy */}
                  <div className="flex items-center justify-between gap-2 liquid-glass-input px-3 py-2 rounded-xl">
                    <span className="font-mono text-xs text-amber-300 font-bold truncate select-all">
                      {ord.delivered_key}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(ord.delivered_key);
                      }}
                      className="text-cyan-300 hover:text-white bg-cyan-500/20 hover:bg-cyan-500/30 px-2 py-1 rounded-lg border border-cyan-500/30 flex items-center gap-1 text-[10px] font-bold shrink-0 cursor-pointer active:scale-95 transition"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Date: {ord.purchase_date}</span>
                    <span className="text-emerald-400 font-medium">Delivered</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (hidden on mobile, visible on sm/md/lg) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 pr-4">Order ID</th>
                    <th className="pb-3 pr-4">Product / Panel</th>
                    <th className="pb-3 pr-4">Amount</th>
                    <th className="pb-3 pr-4">Delivered Key</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200 font-medium">
                  {userOrders.slice(0, 5).map((ord, oIdx) => (
                    <tr key={`user-ord-desk-${ord.id || oIdx}-${oIdx}`} className="hover:bg-white/5 transition">
                      <td className="py-3.5 pr-4 font-mono text-cyan-300 font-bold">
                        #{ord.id}
                      </td>
                      <td className="py-3.5 pr-4 text-white font-semibold">
                        {ord.product_name}
                      </td>
                      <td className="py-3.5 pr-4 text-emerald-300 font-bold">
                        ₹{ord.price_paid.toFixed(2)}
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] liquid-glass-input px-3 py-1.5 rounded-xl border border-white/10 max-w-fit">
                          <span className="text-amber-300 font-semibold select-all">{ord.delivered_key}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(ord.delivered_key);
                            }}
                            className="text-slate-400 hover:text-cyan-300 cursor-pointer p-0.5 transition"
                            title="Copy Key"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 text-slate-400">
                        {ord.purchase_date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            No keys purchased yet. Open the Bot Simulator to test ordering!
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
    </motion.div>
  );
};
