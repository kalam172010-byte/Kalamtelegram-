import React, { useState } from 'react';
import { useBot } from '../../context/BotContext';
import {
  Bot,
  Plus,
  Play,
  Pause,
  Copy,
  Trash2,
  ExternalLink,
  CreditCard,
  Zap,
  Shield,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  BarChart3,
  Key,
  Globe,
  RefreshCw,
  Users
} from 'lucide-react';
import { CreateBotWizardModal } from './CreateBotWizardModal';

export const MyBotsDashboard: React.FC = () => {
  const {
    bots,
    myBots,
    activeBotId,
    activeBot,
    switchActiveBot,
    deleteBot,
    duplicateBot,
    toggleBotStatus,
    setActiveTab,
    currentUser,
    rawUsers,
    allUsers
  } = useBot();

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [copiedTokenBotId, setCopiedTokenBotId] = useState<string | null>(null);

  const handleCopyToken = (botId: string, token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedTokenBotId(botId);
    setTimeout(() => setCopiedTokenBotId(null), 2000);
  };

  const handleOpenGateway = (botId: string) => {
    switchActiveBot(botId);
    setActiveTab('gateways');
  };

  const handleOpenResellerApi = (botId: string) => {
    switchActiveBot(botId);
    setActiveTab('reseller_api');
  };

  return (
    <div className="w-full h-full overflow-y-auto p-4 md:p-6 text-slate-100">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Banner with Liquid Glass */}
        <div className="liquid-glass-card rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full liquid-glass-pill text-cyan-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                Multi-Tenant Telegram Bot Creator Platform
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                My Telegram Store Bots
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Welcome <span className="text-white font-bold">{currentUser.first_name}</span>! You can create, deploy, and manage unlimited Telegram Store Bots. Each bot has its own custom UPI Payment Gateway and Reseller Provider API.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsWizardOpen(true)}
              className="px-6 py-3.5 rounded-2xl liquid-glass-btn-cyan text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition hover:scale-[1.02] active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-5 h-5" />
              <span>Create New Store Bot</span>
            </button>
          </div>
        </div>

        {/* Global Statistics Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="liquid-glass-interactive rounded-2xl p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 flex items-center justify-center font-bold shadow-inner">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">My Deployed Bots</div>
              <div className="text-xl font-black text-white mt-0.5">{myBots.length} Bots</div>
            </div>
          </div>

          <div className="liquid-glass-interactive rounded-2xl p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center font-bold shadow-inner">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Total Bot Sales</div>
              <div className="text-xl font-black text-emerald-300 mt-0.5 font-mono">
                ₹{myBots.reduce((acc, b) => acc + (b.stats?.total_revenue || 0), 0).toFixed(0)}
              </div>
            </div>
          </div>

          <div className="liquid-glass-interactive rounded-2xl p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center font-bold shadow-inner">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Keys Delivered</div>
              <div className="text-xl font-black text-purple-300 mt-0.5">
                {myBots.reduce((acc, b) => acc + (b.stats?.total_keys_delivered || 0), 0)} Keys
              </div>
            </div>
          </div>

          <div className="liquid-glass-interactive rounded-2xl p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center font-bold shadow-inner">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Active Customers</div>
              <div className="text-xl font-black text-amber-300 mt-0.5">
                {myBots.reduce((acc, b) => acc + (b.stats?.total_users || 0), 0)} Users
              </div>
            </div>
          </div>
        </div>

        {/* Bot Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-cyan-400" />
              My Telegram Bot Instances ({myBots.length})
            </h2>
            <span className="text-xs text-slate-400">
              {myBots.length > 0
                ? 'Click any bot to manage its APIs or launch in the Simulator'
                : 'Get started by creating your first store bot'}
            </span>
          </div>

          {myBots.length === 0 ? (
            <div className="liquid-glass-card border-dashed border-white/20 rounded-3xl p-8 md:p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 mx-auto text-3xl shadow-xl">
                🤖
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-lg font-bold text-white">No Telegram Bots Created Yet</h3>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                  Welcome, <span className="text-cyan-300 font-semibold">{currentUser.first_name || 'Store Owner'}</span>! Each store owner enters their own Telegram Bot token, UPI Gateway, and Reseller API keys.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsWizardOpen(true)}
                className="px-6 py-3 rounded-2xl liquid-glass-btn-cyan text-white font-bold text-sm shadow-xl inline-flex items-center gap-2 transition hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                <span>Create Your Store Bot Now</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {myBots.map((bot) => {
                const isActive = bot.id === activeBotId;
                return (
                  <div
                    key={bot.id}
                    className={`liquid-glass-card rounded-3xl transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                      isActive
                        ? 'border-cyan-400/80 shadow-[0_8px_32px_rgba(6,182,212,0.25)] ring-2 ring-cyan-400/40'
                        : 'border-white/10 hover:border-white/20 shadow-xl'
                    }`}
                  >
                    {/* Card Top */}
                    <div className="p-5 space-y-4">
                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            style={{ backgroundColor: bot.theme_color || '#06b6d4' }}
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg text-xl font-bold shrink-0 border border-white/30"
                          >
                            🤖
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold text-white">{bot.name}</h3>
                              {isActive && (
                                <span className="text-[10px] liquid-glass-pill text-cyan-300 border-cyan-400/50 font-bold px-2 py-0.5 rounded-full">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-cyan-300 font-semibold flex items-center gap-1 mt-0.5">
                              <Globe className="w-3 h-3" />
                              @{bot.username}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge & Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleBotStatus(bot.id)}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                            bot.status === 'ONLINE'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                              : 'bg-white/5 text-slate-400 border-white/10'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              bot.status === 'ONLINE' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                            }`}
                          ></span>
                          {bot.status}
                        </button>
                      </div>

                      {/* Bot Description */}
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {bot.description || 'Automated Free Fire Key Store with instant UPI gateway and reseller keys delivery.'}
                      </p>

                      {/* Token Bar */}
                      <div className="liquid-glass-input p-2.5 rounded-2xl border border-white/10 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-slate-400 font-mono truncate max-w-[280px]">
                          <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate text-slate-200">
                            {bot.bot_token ? `${bot.bot_token.substring(0, 12)}•••••••••••••` : 'No token set'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyToken(bot.id, bot.bot_token)}
                          className="text-[11px] text-cyan-300 hover:text-white font-semibold flex items-center gap-1 shrink-0 ml-2 cursor-pointer transition"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedTokenBotId === bot.id ? 'Copied!' : 'Copy'}
                        </button>
                      </div>

                      {/* Integrations Status Pills */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="liquid-glass-pill p-2.5 rounded-2xl">
                          <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                            <CreditCard className="w-3 h-3 text-emerald-400" />
                            UPI Gateway
                          </div>
                          <div className="font-mono text-emerald-300 font-bold mt-1 truncate">
                            {bot.payment_gateway?.upi_id || 'Not Set'}
                          </div>
                        </div>

                        <div className="liquid-glass-pill p-2.5 rounded-2xl">
                          <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                            <Zap className="w-3 h-3 text-purple-400" />
                            Reseller API
                          </div>
                          <div className="text-purple-300 font-bold mt-1 truncate">
                            {bot.reseller_api?.status === 'ON' ? 'API Sync' : 'Vault'}
                          </div>
                        </div>

                        <div className="liquid-glass-pill p-2.5 rounded-2xl">
                          <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                            <Users className="w-3 h-3 text-cyan-400" />
                            Bot Users
                          </div>
                          <div className="text-cyan-300 font-bold mt-1 truncate font-mono">
                            {(() => {
                              const bUsers = (rawUsers || allUsers || []).filter(u =>
                                u.bot_id === bot.id ||
                                (u.bot_id && u.bot_id.replace(/^@/, '').toLowerCase() === (bot.username || '').replace(/^@/, '').toLowerCase()) ||
                                (Array.isArray(u.bot_ids) && (u.bot_ids.includes(bot.id) || u.bot_ids.some(b => b.replace(/^@/, '').toLowerCase() === (bot.username || '').replace(/^@/, '').toLowerCase())))
                              );
                              return `${bUsers.length} Users`;
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Bottom Actions */}
                    <div className="liquid-glass-pill px-5 py-3 border-t border-white/10 flex items-center justify-between gap-2 rounded-b-3xl rounded-t-none">
                      <div className="flex items-center gap-2">
                        {bot.username && (
                          <a
                            href={`https://t.me/${(bot.username || '').replace(/^@/, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl liquid-glass-btn-cyan text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer active:scale-95 no-underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open in Telegram</span>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenGateway(bot.id)}
                          className="px-2.5 py-1.5 rounded-xl liquid-glass-pill hover:bg-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="Configure Payment Gateway"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="hidden sm:inline">Gateway API</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenResellerApi(bot.id)}
                          className="px-2.5 py-1.5 rounded-xl liquid-glass-pill hover:bg-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="Configure Reseller API"
                        >
                          <Zap className="w-3.5 h-3.5 text-purple-400" />
                          <span className="hidden sm:inline">Reseller API</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => duplicateBot(bot.id)}
                          title="Clone Bot"
                          className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete bot @${bot.username}?`)) {
                              deleteBot(bot.id);
                            }
                          }}
                          title="Delete Bot"
                          className="p-2 text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 rounded-xl transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Bot Wizard Modal */}
        <CreateBotWizardModal
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
        />
      </div>
    </div>
  );
};
