import React, { useState } from 'react';
import { BotProvider, useBot } from './context/BotContext';
import { TelegramHeader } from './components/TelegramClient/TelegramHeader';
import { TelegramBotView } from './components/TelegramClient/TelegramBotView';
import { AdminDashboard } from './components/AdminHub/AdminDashboard';
import { AuthPortal } from './components/Auth/AuthPortal';
import { UserProfileModal } from './components/Auth/UserProfileModal';
import { UserDashboard } from './components/Dashboard/UserDashboard';
import { MyBotsDashboard } from './components/BotManager/MyBotsDashboard';
import { PaymentGatewayManager } from './components/Gateways/PaymentGatewayManager';
import { ResellerApiManager } from './components/ResellerAPI/ResellerApiManager';
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
  ChevronDown
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
    switchActiveBot
  } = useBot();

  const [isMobileFrame, setIsMobileFrame] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Check if current authenticated user is Platform Master Admin
  const isMasterAdmin =
    currentUser.user_id === 12846461 ||
    currentUser.email?.toLowerCase() === 'kalam172010@gmail.com' ||
    currentUser.email?.toLowerCase() === 'kk7953926@gmail.com';

  // If user is not authenticated, show the login/registration page
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-y-auto">
        <header className="bg-slate-900/90 border-b border-slate-800 px-4 md:px-6 py-3 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-extrabold text-white shadow-md shadow-cyan-500/20 text-sm">
              ⚡
            </div>
            <div>
              <span className="font-bold text-sm md:text-base text-white tracking-tight">
                KALAM FF PANEL
              </span>
              <span className="text-[10px] ml-2 bg-cyan-500/10 text-cyan-300 font-semibold px-2 py-0.5 rounded border border-cyan-500/20">
                Multi-Bot Creator Hub
              </span>
            </div>
          </div>
          <div className="text-xs text-slate-400 hidden sm:block">
            Sign in with Google or Email to manage your Telegram Store Bots.
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <AuthPortal />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden select-none">
      {/* Top Application Navigation Bar */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800/90 px-3 md:px-5 py-2 md:py-2.5 flex items-center justify-between gap-2 shrink-0 z-30 shadow-md">
        {/* Brand & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-white shadow-lg shadow-cyan-500/25 text-sm md:text-base shrink-0">
            ⚡
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 md:gap-2">
              <span className="font-extrabold text-xs md:text-base text-white tracking-tight truncate">
                KALAM FF PANEL
              </span>
              {/* Active Bot Quick Switcher on Desktop */}
              {myBots.length > 0 ? (
                <div className="hidden lg:flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-slate-400 font-medium">Bot:</span>
                  <select
                    value={activeBot?.id || ''}
                    onChange={(e) => switchActiveBot(e.target.value)}
                    className="bg-transparent font-bold text-cyan-400 focus:outline-none cursor-pointer"
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
                  className="hidden sm:flex items-center gap-1.5 bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30 px-2.5 py-1 rounded-lg border border-cyan-500/30 text-xs font-bold transition"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>+ Create Your Bot</span>
                </button>
              )}
            </div>
            {/* Mobile subtitle indicator */}
            <div className="flex sm:hidden items-center gap-1.5 text-[10px] text-slate-400 leading-tight">
              {activeBot ? (
                <span className="text-cyan-400 font-bold truncate">@{activeBot.username}</span>
              ) : (
                <span className="text-slate-400">Store Bot Creator</span>
              )}
            </div>
          </div>
        </div>

        {/* Center Primary Tab Toggle (Desktop) */}
        <div className="hidden sm:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs md:text-sm font-semibold overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition cursor-pointer shrink-0 ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-cyan-300" />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('my_bots')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition cursor-pointer shrink-0 ${
              activeTab === 'my_bots'
                ? 'bg-cyan-600 text-white shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4 text-cyan-300" />
            <span>My Bots ({myBots.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bot')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition cursor-pointer shrink-0 ${
              activeTab === 'bot'
                ? 'bg-cyan-600 text-white shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Bot Simulator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gateways')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition cursor-pointer shrink-0 ${
              activeTab === 'gateways'
                ? 'bg-emerald-600 text-white shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-300" />
            <span>Payment Gateway</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reseller_api')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition cursor-pointer shrink-0 ${
              activeTab === 'reseller_api'
                ? 'bg-purple-600 text-white shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 text-purple-300" />
            <span>Reseller API</span>
          </button>

          {isMasterAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition cursor-pointer shrink-0 ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin Hub</span>
            </button>
          )}
        </div>

        {/* Right User Status & Actions */}
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Mobile Active Bot Switcher Dropdown if multiple bots */}
          {myBots.length > 1 && (
            <div className="sm:hidden flex items-center bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-[11px]">
              <select
                value={activeBot?.id || ''}
                onChange={(e) => switchActiveBot(e.target.value)}
                className="bg-transparent font-bold text-cyan-400 focus:outline-none cursor-pointer max-w-[85px] truncate"
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
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold text-emerald-400 text-xs font-mono">
              ₹{currentUser.balance.toFixed(0)}
            </span>
          </div>

          {/* User Account / Profile Button */}
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 active:scale-95 border border-slate-700/80 text-xs md:text-sm font-semibold text-slate-200 transition cursor-pointer min-h-[38px]"
          >
            <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 overflow-hidden flex items-center justify-center text-xs text-white font-bold shrink-0">
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
            <div className="text-left hidden md:block truncate max-w-[100px]">
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
            className="p-2 md:p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-slate-400 hover:text-slate-200 text-xs transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col bg-slate-950">
        {activeTab === 'dashboard' ? (
          <div className="w-full h-full overflow-y-auto pb-24 sm:pb-8">
            <UserDashboard />
          </div>
        ) : activeTab === 'my_bots' ? (
          <div className="w-full h-full overflow-y-auto pb-24 sm:pb-8">
            <MyBotsDashboard />
          </div>
        ) : activeTab === 'bot' ? (
          <div className="w-full h-full flex flex-col overflow-hidden pb-14 sm:pb-0">
            <div
              className={`w-full h-full flex flex-col mx-auto transition-all duration-300 ${
                isMobileFrame
                  ? 'max-w-md h-full md:my-3 md:rounded-3xl md:border md:border-slate-800 md:shadow-2xl md:ring-8 md:ring-slate-900/60 overflow-hidden'
                  : 'w-full h-full'
              }`}
            >
              {/* Phone Speaker Notch if Mobile Frame on Desktop */}
              {isMobileFrame && (
                <div className="hidden md:flex justify-center items-center py-1 bg-slate-900 border-b border-slate-800">
                  <div className="w-16 h-1 bg-slate-700 rounded-full"></div>
                </div>
              )}

              <TelegramHeader
                isMobileFrame={isMobileFrame}
                setIsMobileFrame={setIsMobileFrame}
              />
              <div className="flex-1 overflow-hidden relative">
                <TelegramBotView />
              </div>
            </div>
          </div>
        ) : activeTab === 'gateways' ? (
          <div className="w-full h-full overflow-y-auto pb-24 sm:pb-8">
            <PaymentGatewayManager />
          </div>
        ) : activeTab === 'reseller_api' ? (
          <div className="w-full h-full overflow-y-auto pb-24 sm:pb-8">
            <ResellerApiManager />
          </div>
        ) : activeTab === 'admin' && isMasterAdmin ? (
          <div className="w-full h-full overflow-y-auto pb-24 sm:pb-8">
            <AdminDashboard />
          </div>
        ) : (
          <div className="w-full h-full overflow-y-auto pb-24 sm:pb-8">
            <UserDashboard />
          </div>
        )}
      </main>

      {/* Bottom Mobile Navigation Dock (Native App Bar) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/90 px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom),0.5rem)] flex items-center justify-around shrink-0 z-40 select-none shadow-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl text-[10px] font-bold transition active:scale-95 cursor-pointer min-h-[44px] ${
            activeTab === 'dashboard'
              ? 'text-cyan-400 bg-cyan-950/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className={`w-4 h-4 transition ${activeTab === 'dashboard' ? 'scale-110 text-cyan-400' : ''}`} />
          <span className="mt-0.5 tracking-tight">Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my_bots')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl text-[10px] font-bold transition active:scale-95 cursor-pointer min-h-[44px] ${
            activeTab === 'my_bots'
              ? 'text-cyan-400 bg-cyan-950/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Bot className={`w-4 h-4 transition ${activeTab === 'my_bots' ? 'scale-110 text-cyan-400' : ''}`} />
            {myBots.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-cyan-500 text-slate-950 text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {myBots.length}
              </span>
            )}
          </div>
          <span className="mt-0.5 tracking-tight">My Bots</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bot')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl text-[10px] font-bold transition active:scale-95 cursor-pointer min-h-[44px] ${
            activeTab === 'bot'
              ? 'text-cyan-400 bg-cyan-950/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className={`w-4 h-4 transition ${activeTab === 'bot' ? 'scale-110 text-cyan-400' : ''}`} />
          <span className="mt-0.5 tracking-tight">Bot Chat</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gateways')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl text-[10px] font-bold transition active:scale-95 cursor-pointer min-h-[44px] ${
            activeTab === 'gateways'
              ? 'text-emerald-400 bg-emerald-950/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className={`w-4 h-4 transition ${activeTab === 'gateways' ? 'scale-110 text-emerald-400' : ''}`} />
          <span className="mt-0.5 tracking-tight">Gateways</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reseller_api')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl text-[10px] font-bold transition active:scale-95 cursor-pointer min-h-[44px] ${
            activeTab === 'reseller_api'
              ? 'text-purple-400 bg-purple-950/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className={`w-4 h-4 transition ${activeTab === 'reseller_api' ? 'scale-110 text-purple-400' : ''}`} />
          <span className="mt-0.5 tracking-tight">Reseller</span>
        </button>

        {isMasterAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl text-[10px] font-bold transition active:scale-95 cursor-pointer min-h-[44px] ${
              activeTab === 'admin'
                ? 'text-indigo-400 bg-indigo-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className={`w-4 h-4 transition ${activeTab === 'admin' ? 'scale-110 text-indigo-400' : ''}`} />
            <span className="mt-0.5 tracking-tight">Admin</span>
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

