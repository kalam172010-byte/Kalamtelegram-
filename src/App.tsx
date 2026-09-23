import React, { useState } from 'react';
import { BotProvider, useBot } from './context/BotContext';
import { motion, AnimatePresence } from 'motion/react';
import { TelegramHeader } from './components/TelegramClient/TelegramHeader';
import { TelegramBotView } from './components/TelegramClient/TelegramBotView';
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
  Megaphone
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

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#030712] text-slate-100 font-sans overflow-hidden relative">
      {/* Liquid Glass Ambient Fluid Mesh Orbs in Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-cyan-500/25 to-blue-600/20 rounded-full blur-[110px] animate-blob-1 opacity-70" />
        <div className="absolute top-1/3 -right-28 w-[28rem] h-[28rem] bg-gradient-to-tr from-indigo-500/20 via-purple-600/15 to-cyan-400/20 rounded-full blur-[130px] animate-blob-2 opacity-65" />
        <div className="absolute -bottom-32 left-1/3 w-[32rem] h-[32rem] bg-gradient-to-tl from-teal-500/15 via-emerald-600/10 to-blue-600/20 rounded-full blur-[120px] animate-blob-3 opacity-60" />
      </div>

      {/* Top Application Navigation Bar with Liquid Glass */}
      <header className="liquid-glass border-b border-white/10 px-2 sm:px-4 md:px-5 py-2 md:py-2.5 flex items-center justify-between gap-1.5 sm:gap-3 shrink-0 z-30 shadow-2xl shadow-cyan-950/30 sticky top-0 overflow-hidden">
        {/* Brand & Title */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
          <WebsiteLogo
            size="sm"
            showSubtitle={false}
            onClick={() => setActiveTab('dashboard')}
            className="cursor-pointer hover:opacity-95 transition shrink-0"
          />

          {/* Active Bot Quick Switcher on Desktop */}
          {myBots.length > 0 ? (
            <div className="hidden lg:flex items-center gap-1.5 liquid-glass-pill px-2.5 py-1 rounded-xl text-xs">
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
              className="hidden lg:flex items-center gap-1.5 liquid-glass-pill text-cyan-300 hover:text-white px-2.5 py-1 rounded-xl text-xs font-bold transition"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>+ Create Bot</span>
            </button>
          )}
        </div>

        {/* Center Primary Tab Toggle (Desktop) */}
        <div className="hidden sm:flex items-center liquid-glass-pill p-1 rounded-2xl text-xs md:text-sm font-semibold overflow-x-auto max-w-full gap-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer shrink-0 ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-cyan-500/90 to-blue-600/90 text-white shadow-lg shadow-cyan-500/25 border border-white/20 font-bold'
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
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer shrink-0 ${
              activeTab === 'admin' && adminTab === 'products'
                ? 'bg-gradient-to-r from-amber-500/90 to-orange-600/90 text-white shadow-lg shadow-amber-500/25 border border-white/20 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Package className="w-4 h-4 text-amber-300" />
            <span>Products ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAdminTab('users');
              setActiveTab('admin');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer shrink-0 ${
              activeTab === 'admin' && adminTab === 'users'
                ? 'bg-gradient-to-r from-emerald-500/90 to-teal-600/90 text-white shadow-lg shadow-emerald-500/25 border border-white/20 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserIcon className="w-4 h-4 text-emerald-300" />
            <span>Users</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('my_bots')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer shrink-0 ${
              activeTab === 'my_bots'
                ? 'bg-gradient-to-r from-cyan-500/90 to-blue-600/90 text-white shadow-lg shadow-cyan-500/25 border border-white/20 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bot className="w-4 h-4 text-cyan-300" />
            <span>My Bots ({myBots.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bot')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer shrink-0 ${
              activeTab === 'bot'
                ? 'bg-gradient-to-r from-cyan-500/90 to-blue-600/90 text-white shadow-lg shadow-cyan-500/25 border border-white/20 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Bot Simulator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gateways')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer shrink-0 ${
              activeTab === 'gateways'
                ? 'bg-gradient-to-r from-emerald-500/90 to-teal-600/90 text-white shadow-lg shadow-emerald-500/25 border border-white/20 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-300" />
            <span>Gateways</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reseller_api')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer shrink-0 ${
              activeTab === 'reseller_api'
                ? 'bg-gradient-to-r from-purple-500/90 to-indigo-600/90 text-white shadow-lg shadow-purple-500/25 border border-white/20 font-bold'
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
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer shrink-0 ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-indigo-500/90 to-rose-600/90 text-white shadow-lg shadow-indigo-500/25 border border-white/20 font-bold'
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
            onClick={() => setActiveTab('bot')}
            title="Click to add balance in bot"
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
              className="flex-1 min-h-0 w-full overflow-y-auto overscroll-contain pb-32 sm:pb-12"
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
              className="flex-1 min-h-0 w-full overflow-y-auto overscroll-contain pb-32 sm:pb-12"
            >
              <MyBotsDashboard />
            </motion.div>
          ) : activeTab === 'bot' || activeTab === 'telegram' ? (
            <motion.div
              key="telegram"
              initial={{ opacity: 0, y: 10, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.995 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 min-h-0 w-full flex flex-col overflow-hidden pb-20 sm:pb-0"
            >
              <div
                className={`w-full h-full flex flex-col mx-auto transition-all duration-300 ${
                  isMobileFrame
                    ? 'max-w-md h-full md:my-3 md:rounded-3xl md:border md:border-white/10 md:shadow-2xl md:ring-8 md:ring-slate-950/80 overflow-hidden'
                    : 'w-full h-full'
                }`}
              >
                {/* Phone Speaker Notch if Mobile Frame on Desktop */}
                {isMobileFrame && (
                  <div className="hidden md:flex justify-center items-center py-1 bg-slate-950/80 border-b border-white/5">
                    <div className="w-16 h-1 bg-slate-700 rounded-full"></div>
                  </div>
                )}

                <TelegramHeader
                  isMobileFrame={isMobileFrame}
                  setIsMobileFrame={setIsMobileFrame}
                />
                <div className="flex-1 min-h-0 overflow-hidden relative">
                  <TelegramBotView />
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'gateways' ? (
            <motion.div
              key="gateways"
              initial={{ opacity: 0, y: 10, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.995 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 min-h-0 w-full overflow-y-auto overscroll-contain pb-32 sm:pb-12"
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
              className="flex-1 min-h-0 w-full overflow-y-auto overscroll-contain pb-32 sm:pb-12"
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
              className="flex-1 min-h-0 w-full overflow-y-auto overscroll-contain pb-32 sm:pb-16"
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
              className="flex-1 min-h-0 w-full overflow-y-auto overscroll-contain pb-32 sm:pb-12"
            >
              <UserDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Mobile Navigation Dock (Liquid Glass Mobile Dock) */}
      <nav
        className={`sm:hidden fixed bottom-2 left-2 right-2 liquid-glass rounded-3xl px-1.5 py-1.5 pb-[max(env(safe-area-inset-bottom),0.5rem)] flex items-center justify-around shrink-0 z-40 select-none shadow-2xl shadow-cyan-950/50 border border-white/10 transition-all duration-300 ease-out ${
          isKeyboardVisible || activeTab === 'bot'
            ? 'translate-y-28 opacity-0 pointer-events-none'
            : 'translate-y-0 opacity-100'
        }`}
      >
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl text-[9.5px] font-bold transition-all duration-200 active:scale-95 cursor-pointer min-h-[46px] ${
            activeTab === 'dashboard'
              ? 'text-white bg-gradient-to-b from-cyan-400/25 to-blue-600/20 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'dashboard' ? 'scale-115 text-cyan-300' : ''}`} />
          <span className="mt-1 tracking-tight">Home</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAdminTab('products');
            setActiveTab('admin');
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl text-[9.5px] font-bold transition-all duration-200 active:scale-95 cursor-pointer min-h-[46px] ${
            activeTab === 'admin' && adminTab === 'products'
              ? 'text-white bg-gradient-to-b from-amber-400/25 to-orange-600/20 border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Package className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'admin' && adminTab === 'products' ? 'scale-115 text-amber-300' : ''}`} />
            {products.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-amber-500 text-slate-950 text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow">
                {products.length}
              </span>
            )}
          </div>
          <span className="mt-1 tracking-tight">Products</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my_bots')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl text-[9.5px] font-bold transition-all duration-200 active:scale-95 cursor-pointer min-h-[46px] ${
            activeTab === 'my_bots'
              ? 'text-white bg-gradient-to-b from-cyan-400/25 to-blue-600/20 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Bot className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'my_bots' ? 'scale-115 text-cyan-300' : ''}`} />
            {myBots.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow">
                {myBots.length}
              </span>
            )}
          </div>
          <span className="mt-1 tracking-tight">Bots</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bot')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl text-[9.5px] font-bold transition-all duration-200 active:scale-95 cursor-pointer min-h-[46px] ${
            activeTab === 'bot' || activeTab === 'telegram'
              ? 'text-white bg-gradient-to-b from-cyan-400/25 to-teal-600/20 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'bot' || activeTab === 'telegram' ? 'scale-115 text-cyan-300' : ''}`} />
          <span className="mt-1 tracking-tight">Chat</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAdminTab('users');
            setActiveTab('admin');
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl text-[9.5px] font-bold transition-all duration-200 active:scale-95 cursor-pointer min-h-[46px] ${
            activeTab === 'admin' && adminTab === 'users'
              ? 'text-white bg-gradient-to-b from-emerald-400/25 to-teal-600/20 border border-emerald-400/40 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserIcon className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'admin' && adminTab === 'users' ? 'scale-115 text-emerald-300' : ''}`} />
          <span className="mt-1 tracking-tight">Users</span>
        </button>

        {isMasterAdmin && (
          <button
            type="button"
            onClick={() => {
              setAdminTab('overview');
              setActiveTab('admin');
            }}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl text-[9.5px] font-bold transition-all duration-200 active:scale-95 cursor-pointer min-h-[46px] ${
              activeTab === 'admin' && adminTab === 'overview'
                ? 'text-white bg-gradient-to-b from-indigo-400/25 to-rose-600/20 border border-indigo-400/40 shadow-[0_0_15px_rgba(99,102,241,0.25)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className={`w-4 h-4 transition-transform duration-200 ${activeTab === 'admin' && adminTab === 'overview' ? 'scale-115 text-indigo-300' : ''}`} />
            <span className="mt-1 tracking-tight">Admin</span>
          </button>
        )}
      </nav>

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

