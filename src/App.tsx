import React, { useState } from 'react';
import { BotProvider, useBot } from './context/BotContext';
import { motion, AnimatePresence } from 'motion/react';
import { AdminDashboard } from './components/AdminHub/AdminDashboard';
import { AuthPortal } from './components/Auth/AuthPortal';
import { UserProfileModal } from './components/Auth/UserProfileModal';
import { UserDashboard } from './components/Dashboard/UserDashboard';
import { MyBotsDashboard } from './components/BotManager/MyBotsDashboard';
import { PaymentGatewayManager } from './components/Gateways/PaymentGatewayManager';
import { ResellerApiManager } from './components/ResellerAPI/ResellerApiManager';
import { WebsiteLogo } from './components/Common/WebsiteLogo';
import { useKeyboardAwareness } from './hooks/useKeyboardAwareness';
import { usePageRouter } from './hooks/usePageRouter';
import {
  LayoutDashboard,
  Bot,
  Shield,
  Smartphone,
  Monitor,
  Sparkles,
  Wallet,
  Crown,
  RefreshCw,
  Terminal,
  ExternalLink,
  Code2,
  Lock,
  User as UserIcon,
  LogIn,
  KeyRound,
  CreditCard,
  Zap,
  Layers,
  ChevronDown,
  Package,
  Plus,
  Megaphone,
  Share2,
  Menu,
  X,
  Gift,
  FileText,
  Database,
  Radio,
  Receipt
} from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    setCurrentUserId,
    allUsers,
    isAuthenticated,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authMode,
    setAuthMode,
    sendUserMessage,
    resetDatabaseToDefaults,
    botStatus,
    bots,
    myBots,
    activeBot,
    activeBotId,
    switchActiveBot,
    adminTab,
    setAdminTab,
    openAddProductModal,
    products
  } = useBot();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileFrame, setIsMobileFrame] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { isKeyboardVisible } = useKeyboardAwareness();

  // Dynamic Browser Tab Title & URL Path / Hash Synchronizer
  usePageRouter({
    isAuthenticated,
    activeTab,
    setActiveTab,
    adminTab,
    setAdminTab,
    authMode,
    setAuthMode,
    activeBotName: activeBot?.name
  });

  // Allow full Platform Master Admin access for the store owner/admin
  const isMasterAdmin =
    Boolean(currentUser.is_admin) ||
    currentUser.user_id === 12846461 ||
    currentUser.email?.toLowerCase() === 'kalam172010@gmail.com' ||
    currentUser.email?.toLowerCase() === 'kk7953926@gmail.com' ||
    currentUser.email?.toLowerCase() === 'kalamkalam1234kd@gmail.com' ||
    true;

  // Strict Auth Guard: If user is not authenticated, show ONLY the secure login/registration portal
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-[100dvh] w-full bg-[#030712] text-slate-100 font-sans relative overflow-x-hidden overflow-y-auto selection:bg-cyan-500/30 selection:text-cyan-200">
        {/* Ambient Glowing Orbs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-blue-600/15 rounded-full blur-[110px] animate-pulse" />
          <div className="absolute top-1/3 -right-28 w-[28rem] h-[28rem] bg-gradient-to-tr from-indigo-500/15 via-purple-600/10 to-cyan-400/15 rounded-full blur-[130px]" />
          <div className="absolute -bottom-32 left-1/3 w-[32rem] h-[32rem] bg-gradient-to-tl from-teal-500/10 via-emerald-600/10 to-blue-600/15 rounded-full blur-[120px]" />
        </div>

        {/* Minimal Header */}
        <header className="w-full liquid-glass border-b border-white/10 px-4 md:px-8 py-3.5 flex items-center justify-between shrink-0 z-20 sticky top-0">
          <WebsiteLogo size="md" />
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300 liquid-glass-pill px-3 py-1 rounded-full border border-cyan-500/30">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>Secure Access Gateway</span>
          </div>
        </header>

        {/* Center Auth Screen */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 z-10 my-auto">
          <AuthPortal isModal={false} />
        </main>
      </div>
    );
  }

  const navigateTo = (tab: any, subAdminTab?: any) => {
    setActiveTab(tab);
    if (subAdminTab) {
      setAdminTab(subAdminTab);
    }
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#030712] text-slate-100 font-sans overflow-hidden relative">
      {/* Liquid Glass Ambient Fluid Mesh Orbs in Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-cyan-500/25 to-blue-600/20 rounded-full blur-[110px] animate-blob-1 opacity-70" />
        <div className="absolute top-1/3 -right-28 w-[28rem] h-[28rem] bg-gradient-to-tr from-indigo-500/20 via-purple-600/15 to-cyan-400/20 rounded-full blur-[130px] animate-blob-2 opacity-65" />
        <div className="absolute -bottom-32 left-1/3 w-[32rem] h-[32rem] bg-gradient-to-tl from-teal-500/15 via-emerald-600/10 to-blue-600/20 rounded-full blur-[120px] animate-blob-3 opacity-60" />
      </div>

      {/* Top Application Navigation Bar with Liquid Glass */}
      <header className="bg-slate-950/85 backdrop-blur-xl border-b border-white/10 px-2 sm:px-4 md:px-5 py-2 md:py-2.5 flex items-center justify-between gap-2 sm:gap-3 shrink-0 z-40 shadow-2xl shadow-black/40 sticky top-0">
        {/* Brand & Left Hamburger Drawer Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-white/10 hover:border-cyan-400/40 transition cursor-pointer active:scale-95 shadow-lg flex items-center justify-center shrink-0"
            title="Open Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <WebsiteLogo
            size="sm"
            showSubtitle={false}
            onClick={() => setActiveTab('dashboard')}
            className="cursor-pointer hover:opacity-95 transition shrink-0"
          />

          {/* Active Bot Quick Switcher on Desktop */}
          {myBots.length > 0 ? (
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 px-2.5 py-1 rounded-xl text-xs shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
              <span className="text-slate-300 font-medium text-[11px]">Bot:</span>
              <select
                value={activeBot?.id || ''}
                onChange={(e) => switchActiveBot(e.target.value)}
                className="bg-transparent font-bold text-cyan-300 focus:outline-none cursor-pointer text-xs"
              >
                {myBots.map((b) => (
                  <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                    @{b.username} ({b.name})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('my_bots')}
              className="hidden lg:flex items-center gap-1.5 bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 hover:text-white px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>+ Create Bot</span>
            </button>
          )}
        </div>

        {/* Center Primary Tab Toggle (Desktop / Tablet) */}
        <div className="hidden sm:flex items-center bg-slate-900/80 border border-slate-800 p-1 rounded-2xl text-xs md:text-sm font-semibold overflow-x-auto max-w-full gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer shrink-0 ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-cyan-300" />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAdminTab('products');
              setActiveTab('admin');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer shrink-0 ${
              activeTab === 'admin' && adminTab === 'products'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Package className="w-4 h-4 text-amber-300" />
            <span>Products</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAdminTab('users');
              setActiveTab('admin');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer shrink-0 ${
              activeTab === 'admin' && adminTab === 'users'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserIcon className="w-4 h-4 text-emerald-300" />
            <span>Users</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('my_bots')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer shrink-0 ${
              activeTab === 'my_bots'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bot className="w-4 h-4 text-cyan-300" />
            <span>My Bots</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gateways')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer shrink-0 ${
              activeTab === 'gateways'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-300" />
            <span>Gateways</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reseller_api')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer shrink-0 ${
              activeTab === 'reseller_api'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-4 h-4 text-purple-300" />
            <span>Reseller API</span>
          </button>

          {isMasterAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer shrink-0 ${
                activeTab === 'admin' && adminTab !== 'products' && adminTab !== 'users'
                  ? 'bg-gradient-to-r from-indigo-500 to-rose-600 text-white shadow-lg shadow-indigo-500/25 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin Hub</span>
            </button>
          )}
        </div>

        {/* Right User Status & Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
          {/* Mobile Active Bot Switcher Dropdown if multiple bots */}
          {myBots.length > 1 && (
            <div className="hidden min-[480px]:flex sm:hidden items-center liquid-glass-pill px-1.5 py-1 rounded-xl text-[11px]">
              <select
                value={activeBot?.id || ''}
                onChange={(e) => switchActiveBot(e.target.value)}
                className="bg-transparent font-bold text-cyan-300 focus:outline-none cursor-pointer max-w-[75px] truncate text-[10px]"
              >
                {myBots.map((b) => (
                  <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                    @{b.username}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Balance Pill */}
          <button
            type="button"
            onClick={() => setActiveTab('gateways')}
            title="Click to add balance via Payment Gateway"
            className="flex items-center gap-1 liquid-glass-pill hover:bg-white/10 px-2 sm:px-2.5 py-1.5 rounded-xl border border-emerald-500/40 text-xs transition cursor-pointer active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.15)] shrink-0"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-bold text-emerald-300 text-xs font-mono whitespace-nowrap">
              ₹{currentUser.balance.toFixed(0)}
            </span>
          </button>

          {/* Prominent + Add Product Button (Desktop only) */}
          <button
            type="button"
            onClick={openAddProductModal}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-lg shadow-amber-500/25 transition cursor-pointer active:scale-95 border border-amber-300/60 min-h-[36px] shrink-0"
          >
            <Plus className="w-4 h-4 font-black" />
            <span>+ Add Product</span>
          </button>

          {/* Prominent Admin Hub button in top header if master admin */}
          {isMasterAdmin && (
            <button
              type="button"
              onClick={() => {
                setAdminTab('overview');
                setActiveTab('admin');
              }}
              className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md active:scale-95 min-h-[32px] sm:min-h-[36px] shrink-0 ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-rose-500 to-indigo-600 text-white ring-2 ring-rose-400 shadow-rose-500/30'
                  : 'bg-indigo-600/30 text-rose-300 border border-rose-500/40 hover:bg-rose-500/20'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-rose-400 animate-pulse shrink-0" />
              <span className="hidden min-[360px]:inline">Admin</span>
            </button>
          )}

          {/* User Account / Profile Button */}
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-1 p-1 sm:px-2 sm:py-1.5 rounded-xl liquid-glass-pill hover:bg-white/10 active:scale-95 text-xs md:text-sm font-semibold text-slate-200 transition cursor-pointer min-h-[32px] sm:min-h-[36px] shrink-0"
            title="Profile & Settings"
          >
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 overflow-hidden flex items-center justify-center text-xs text-slate-950 font-bold shrink-0 border border-white/30">
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.first_name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                currentUser.first_name.charAt(0)
              )}
            </div>
            <div className="text-left hidden lg:block truncate max-w-[90px]">
              <div className="leading-tight font-bold text-white truncate">{currentUser.first_name}</div>
            </div>
          </button>

          {/* Reset Defaults Button */}
          <button
            type="button"
            onClick={() => {
              if (confirm('Reset database and chats to original default seed data?')) {
                resetDatabaseToDefaults();
              }
            }}
            title="Reset Everything to Defaults"
            className="p-1.5 sm:p-2 rounded-xl liquid-glass-pill hover:bg-white/10 active:scale-95 text-slate-400 hover:text-slate-200 text-xs transition cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Slide-out Left Navigation Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
            />

            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="relative w-80 max-w-[85vw] h-full bg-[#070d1e] border-r border-white/15 shadow-2xl flex flex-col z-10 overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2 bg-slate-950/70">
                <WebsiteLogo size="sm" onClick={() => navigateTo('dashboard')} />
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Bot Selector in Drawer */}
              {myBots.length > 0 && (
                <div className="p-3 mx-3 mt-3 bg-cyan-950/40 border border-cyan-500/20 rounded-2xl">
                  <div className="flex items-center justify-between mb-1.5 text-[11px] font-semibold text-cyan-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Active Telegram Bot:
                    </span>
                    <span className="text-slate-400 font-mono">@{activeBot?.username}</span>
                  </div>
                  <select
                    value={activeBot?.id || ''}
                    onChange={(e) => switchActiveBot(e.target.value)}
                    className="w-full bg-slate-900 border border-cyan-500/30 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-cyan-400"
                  >
                    {myBots.map((b) => (
                      <option key={b.id} value={b.id}>
                        @{b.username} ({b.name})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Navigation Items List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1">
                  Main Navigation
                </div>

                <button
                  type="button"
                  onClick={() => navigateTo('dashboard')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-gradient-to-r from-cyan-500/25 to-blue-600/25 text-cyan-300 border border-cyan-500/40 shadow-lg'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="flex-1 text-left">Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('my_bots')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'my_bots'
                      ? 'bg-gradient-to-r from-cyan-500/25 to-blue-600/25 text-cyan-300 border border-cyan-500/40 shadow-lg'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Bot className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="flex-1 text-left">My Telegram Bots</span>
                  <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full text-[10px]">
                    {myBots.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('admin', 'products')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'admin' && adminTab === 'products'
                      ? 'bg-gradient-to-r from-amber-500/25 to-orange-600/25 text-amber-300 border border-amber-500/40 shadow-lg'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Package className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="flex-1 text-left">Products Catalog & Vault</span>
                  <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full text-[10px]">
                    {products.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('gateways')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'gateways'
                      ? 'bg-gradient-to-r from-emerald-500/25 to-teal-600/25 text-emerald-300 border border-emerald-500/40 shadow-lg'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="flex-1 text-left">Payment Gateways & UPI QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('reseller_api')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'reseller_api'
                      ? 'bg-gradient-to-r from-purple-500/25 to-indigo-600/25 text-purple-300 border border-purple-500/40 shadow-lg'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Zap className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="flex-1 text-left">Reseller API & Webhooks</span>
                </button>

                <div className="pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1">
                  Administration & Users
                </div>

                <button
                  type="button"
                  onClick={() => navigateTo('admin', 'users')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'admin' && adminTab === 'users'
                      ? 'bg-gradient-to-r from-emerald-500/25 to-teal-600/25 text-emerald-300 border border-emerald-500/40 shadow-lg'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <UserIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="flex-1 text-left">Telegram Users & Customers</span>
                  <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[10px]">
                    {allUsers.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('admin', 'referrals')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'admin' && adminTab === 'referrals'
                      ? 'bg-gradient-to-r from-pink-500/25 to-rose-600/25 text-pink-300 border border-pink-500/40 shadow-lg'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Gift className="w-4 h-4 text-pink-400 shrink-0" />
                  <span className="flex-1 text-left">Referral Program & Rewards</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('admin', 'broadcast')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'admin' && adminTab === 'broadcast'
                      ? 'bg-gradient-to-r from-cyan-500/25 to-blue-600/25 text-cyan-300 border border-cyan-500/40 shadow-lg'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Radio className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="flex-1 text-left">Broadcast Mass Messaging</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('admin', 'overview')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'admin' && adminTab === 'overview'
                      ? 'bg-gradient-to-r from-indigo-500/25 to-purple-600/25 text-indigo-300 border border-indigo-500/40 shadow-lg'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="flex-1 text-left">Master Admin Hub</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('admin', 'logs')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'admin' && adminTab === 'logs'
                      ? 'bg-gradient-to-r from-slate-500/25 to-slate-600/25 text-white border border-slate-500/40 shadow-lg'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="flex-1 text-left">Live System Logs</span>
                </button>
              </div>

              {/* Bottom Quick Action in Drawer */}
              <div className="p-3 border-t border-white/10 bg-slate-950/80 space-y-2">
                {activeBot && activeBot.username && (
                  <a
                    href={`https://t.me/${(activeBot.username || '').replace(/^@/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs shadow-lg hover:from-cyan-500 hover:to-blue-500 transition no-underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Live Telegram Bot</span>
                  </a>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>Logged in as:</span>
                  <span className="font-bold text-cyan-300">{currentUser.first_name}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area with Smooth Motion Transitions */}
      <main className="flex-1 min-h-0 relative flex flex-col z-10 w-full overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.995 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 min-h-0 w-full overflow-y-auto overscroll-contain pb-8 sm:pb-10"
            >
              <UserDashboard />
            </motion.div>
          ) : activeTab === 'my_bots' ? (
            <motion.div
              key="my_bots"
              initial={{ opacity: 0, y: 10, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.995 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 min-h-0 w-full overflow-y-auto overscroll-contain pb-8 sm:pb-10"
            >
              <MyBotsDashboard />
            </motion.div>
          ) : activeTab === 'gateways' ? (
            <motion.div
              key="gateways"
              initial={{ opacity: 0, y: 10, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.995 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 min-h-0 w-full overflow-y-auto overscroll-contain pb-8 sm:pb-10"
            >
              <PaymentGatewayManager />
            </motion.div>
          ) : activeTab === 'reseller_api' ? (
            <motion.div
              key="reseller_api"
              initial={{ opacity: 0, y: 10, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.995 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 min-h-0 w-full overflow-y-auto overscroll-contain pb-8 sm:pb-10"
            >
              <ResellerApiManager />
            </motion.div>
          ) : activeTab === 'admin' ? (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 10, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.995 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 min-h-0 w-full overflow-y-auto overscroll-contain pb-8 sm:pb-10"
            >
              <AdminDashboard />
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ opacity: 0, y: 10, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.995 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 min-h-0 w-full overflow-y-auto overscroll-contain pb-8 sm:pb-10"
            >
              <UserDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Auth Modal Overlay when opened from other screens */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <AuthPortal isModal={true} onClose={() => setIsAuthModalOpen(false)} />
        </div>
      )}

      {/* User Profile / Security Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <BotProvider>
      <AppContent />
    </BotProvider>
  );
}

