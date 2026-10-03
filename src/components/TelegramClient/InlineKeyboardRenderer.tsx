import React from 'react';
import { InlineKeyboardButton } from '../../types';
import { TgEmojiBadge } from '../../utils/telegramFormatter';
import {
  ExternalLink,
  Download,
  Send,
  User,
  ShoppingBag,
  Home,
  Play,
  CreditCard,
  Zap,
  ArrowLeft,
  LifeBuoy,
  Gift,
  Key,
  Plus,
  Sparkles,
  Bot,
  Layers,
  BarChart3,
  HelpCircle,
  BookOpen,
  Terminal,
  Activity,
  RefreshCw,
  Megaphone,
  Tag,
  AlertTriangle,
  Power,
  Trash2,
  Flame,
  Gamepad2,
  CheckCircle2,
  XCircle,
  Gem
} from 'lucide-react';

interface Props {
  keyboard: InlineKeyboardButton[][];
  onButtonClick: (callbackData: string, text: string) => void;
  globalButtonTheme?: string;
}

function getButtonIcon(text: string, cb: string, url: string) {
  const t = text.toLowerCase();
  const c = cb.toLowerCase();
  const u = url.toLowerCase();

  // Bot Maker & Creation
  if (t.includes('create new') || t.includes('create bot') || t.includes('new bot') || c === 'cb_newbot_start' || c === 'cb_create_bot') {
    return <Plus className="w-4 h-4 shrink-0 text-fuchsia-200 animate-pulse" />;
  }
  if (t.includes('my created bots') || t.includes('my bots') || c === 'cb_my_bots') {
    return <Bot className="w-4 h-4 shrink-0 text-sky-200" />;
  }
  if (t.includes('manage') || c.startsWith('cb_manage_')) {
    return <Layers className="w-4 h-4 shrink-0 text-sky-200" />;
  }
  if (t.includes('stats') || t.includes('analytics') || c === 'cb_stats' || c.startsWith('cb_bot_stats_')) {
    return <BarChart3 className="w-4 h-4 shrink-0 text-emerald-200" />;
  }
  if (t.includes('template') || c === 'cb_templates') {
    return <Layers className="w-4 h-4 shrink-0 text-amber-200" />;
  }
  if (t.includes('diagnostic') || t.includes('ping') || c === 'cb_diagnostics' || c.startsWith('cb_bot_ping_')) {
    return <Activity className="w-4 h-4 shrink-0 text-cyan-200" />;
  }
  if (t.includes('guide') || t.includes('help') || c === 'cb_guide') {
    return <BookOpen className="w-4 h-4 shrink-0 text-amber-300" />;
  }
  if (t.includes('broadcast') || c.startsWith('cb_bot_bcast_') || c.includes('bcast')) {
    return <Megaphone className="w-4 h-4 shrink-0 text-pink-200" />;
  }
  if (t.includes('coupon') || t.includes('promo') || c.startsWith('cb_bot_coupons_')) {
    return <Tag className="w-4 h-4 shrink-0 text-yellow-300" />;
  }
  if (t.includes('keys') || t.includes('stock key') || c.startsWith('cb_bot_keys_') || t.includes('vault')) {
    return <Key className="w-4 h-4 shrink-0 text-emerald-200" />;
  }
  if (t.includes('reseller') || c.startsWith('cb_bot_res_') || c.includes('reseller')) {
    return <Zap className="w-4 h-4 shrink-0 text-purple-200" />;
  }
  if (t.includes('maintenance') || c.startsWith('cb_bot_toggle_maint_')) {
    return <Power className="w-4 h-4 shrink-0 text-amber-300" />;
  }
  if (t.includes('delete') || c.startsWith('cb_bot_del_') || c.includes('del_')) {
    return <Trash2 className="w-4 h-4 shrink-0 text-rose-200" />;
  }

  // Store Templates
  if (t.includes('free fire') || t.includes('vip hack') || c === 'cb_tmpl_ff') {
    return <Flame className="w-4 h-4 shrink-0 text-orange-300 animate-pulse" />;
  }
  if (t.includes('diamond') || t.includes('top-up') || c === 'cb_tmpl_diamonds') {
    return <Gem className="w-4 h-4 shrink-0 text-cyan-200" />;
  }
  if (t.includes('multi-game') || c === 'cb_tmpl_multigame') {
    return <Gamepad2 className="w-4 h-4 shrink-0 text-indigo-200" />;
  }
  if (t.includes('clone') || c === 'cb_clone_prods') {
    return <Layers className="w-4 h-4 shrink-0 text-teal-200" />;
  }

  // Standard Store Actions
  if (t.includes('apk') || t.includes('download') || u.includes('apk')) {
    return <Download className="w-4 h-4 shrink-0 text-emerald-200 animate-pulse" />;
  }
  if (t.includes('official') || t.includes('channel') || u.includes('t.me') || t.includes('telegram')) {
    return <Send className="w-4 h-4 shrink-0 text-sky-200" />;
  }
  if (t.includes('profile') || t.includes('account') || c.includes('profile') || c === 'my_keys_history') {
    return <User className="w-4 h-4 shrink-0 text-purple-200" />;
  }
  if (t.includes('video') || t.includes('tutorial') || t.includes('guide') || u.includes('youtu')) {
    return <Play className="w-4 h-4 shrink-0 text-rose-200 fill-rose-200" />;
  }
  if (t.includes('continue shopping') || t.includes('buy more') || t.includes('store') || c.includes('shop')) {
    return <ShoppingBag className="w-4 h-4 shrink-0 text-amber-200" />;
  }
  if (t.includes('main menu') || t.includes('home') || c === 'main_menu' || c === 'back_main' || c === 'cb_main_menu') {
    return <Home className="w-4 h-4 shrink-0 text-cyan-300" />;
  }
  if (t.includes('balance') || t.includes('deposit') || t.includes('recharge') || c.includes('balance') || c.includes('pay_') || c.startsWith('cb_bot_gw_')) {
    return <CreditCard className="w-4 h-4 shrink-0 text-emerald-200" />;
  }
  if (t.includes('buy') || t.includes('confirm') || c.startsWith('buy_')) {
    return <Zap className="w-4 h-4 shrink-0 text-yellow-300" />;
  }
  if (t.includes('cancel') || c === 'cb_cancel' || c === 'bot_create_cancel') {
    return <XCircle className="w-4 h-4 shrink-0 text-rose-300" />;
  }
  if (t.includes('back') || c.includes('back')) {
    return <ArrowLeft className="w-4 h-4 shrink-0 text-slate-300" />;
  }
  if (t.includes('support') || t.includes('ticket') || t.includes('help')) {
    return <LifeBuoy className="w-4 h-4 shrink-0 text-cyan-200" />;
  }
  if (t.includes('gift') || t.includes('spin') || t.includes('redeem')) {
    return <Gift className="w-4 h-4 shrink-0 text-pink-200" />;
  }
  if (t.includes('key') || t.includes('vault')) {
    return <Key className="w-4 h-4 shrink-0 text-cyan-200" />;
  }
  return null;
}

function getButtonStyleClasses(btn: InlineKeyboardButton, globalTheme?: string): string {
  const style = btn.style;
  const rawText = btn.text || '';
  const text = rawText.toLowerCase();
  const cb = (btn.callback_data || '').toLowerCase();
  const url = (btn.url || '').toLowerCase();
  const explicitColor = ((btn as any).color || (btn as any).bg_color || '').toLowerCase();

  // Base illuminated key structure: tactile press, bright text, glowing border, top specular glass gloss
  const baseIlluminated = "relative overflow-hidden font-black text-white tracking-wide transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-white/40";

  // Global Button Theme Overrides (if set by user)
  if (globalTheme === 'all_red' || globalTheme === 'laser_red') {
    return `${baseIlluminated} bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 border border-rose-300 ring-1 ring-rose-400/70 shadow-[0_0_20px_rgba(244,63,94,0.65)] hover:shadow-[0_0_30px_rgba(244,63,94,0.95)] hover:border-white`;
  }
  if (globalTheme === 'all_green' || globalTheme === 'matrix_green') {
    return `${baseIlluminated} bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 border border-emerald-300 ring-1 ring-emerald-400/70 shadow-[0_0_20px_rgba(16,185,129,0.65)] hover:shadow-[0_0_30px_rgba(16,185,129,0.95)] hover:border-white`;
  }
  if (globalTheme === 'all_blue' || globalTheme === 'electric_blue') {
    return `${baseIlluminated} bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 border border-sky-300 ring-1 ring-sky-400/70 shadow-[0_0_20px_rgba(14,165,233,0.65)] hover:shadow-[0_0_30px_rgba(14,165,233,0.95)] hover:border-white`;
  }
  if (globalTheme === 'all_purple' || globalTheme === 'neon_purple') {
    return `${baseIlluminated} bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 border border-purple-300 ring-1 ring-purple-400/70 shadow-[0_0_20px_rgba(168,85,247,0.65)] hover:shadow-[0_0_30px_rgba(168,85,247,0.95)] hover:border-white`;
  }
  if (globalTheme === 'all_gold' || globalTheme === 'solar_gold') {
    return `${baseIlluminated} bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 border border-amber-300 ring-1 ring-amber-400/70 shadow-[0_0_20px_rgba(245,158,11,0.65)] hover:shadow-[0_0_30px_rgba(245,158,11,0.95)] hover:border-white`;
  }
  if (globalTheme === 'all_cyan' || globalTheme === 'cyber_cyan') {
    return `${baseIlluminated} bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 border border-cyan-300 ring-1 ring-cyan-400/70 shadow-[0_0_20px_rgba(6,182,212,0.65)] hover:shadow-[0_0_30px_rgba(6,182,212,0.95)] hover:border-white`;
  }
  if (globalTheme === 'all_pink' || globalTheme === 'cyber_pink') {
    return `${baseIlluminated} bg-gradient-to-r from-pink-600 via-fuchsia-600 to-rose-600 border border-pink-300 ring-1 ring-pink-400/70 shadow-[0_0_20px_rgba(236,72,153,0.65)] hover:shadow-[0_0_30px_rgba(236,72,153,0.95)] hover:border-white`;
  }

  // Explicit Colors & Styles
  if (explicitColor === 'purple' || style === 'purple') {
    return `${baseIlluminated} bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 border border-purple-300 ring-1 ring-purple-400/70 shadow-[0_0_20px_rgba(168,85,247,0.65)] hover:shadow-[0_0_30px_rgba(168,85,247,0.95)] hover:border-white`;
  }
  if (explicitColor === 'cyan' || explicitColor === 'aqua' || style === 'cyan' || style === 'aqua') {
    return `${baseIlluminated} bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 border border-cyan-300 ring-1 ring-cyan-400/70 shadow-[0_0_20px_rgba(6,182,212,0.65)] hover:shadow-[0_0_30px_rgba(6,182,212,0.95)] hover:border-white`;
  }
  if (explicitColor === 'fuchsia' || explicitColor === 'magenta' || explicitColor === 'pink' || style === 'fuchsia' || style === 'pink') {
    return `${baseIlluminated} bg-gradient-to-r from-pink-600 via-fuchsia-600 to-rose-600 border border-pink-300 ring-1 ring-pink-400/70 shadow-[0_0_20px_rgba(236,72,153,0.65)] hover:shadow-[0_0_30px_rgba(236,72,153,0.95)] hover:border-white`;
  }
  if (explicitColor === 'indigo' || explicitColor === 'violet' || style === 'indigo' || style === 'violet') {
    return `${baseIlluminated} bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 border border-indigo-300 ring-1 ring-indigo-400/70 shadow-[0_0_20px_rgba(99,102,241,0.65)] hover:shadow-[0_0_30px_rgba(99,102,241,0.95)] hover:border-white`;
  }
  if (explicitColor === 'lime' || explicitColor === 'neon' || style === 'lime' || style === 'neon') {
    return `${baseIlluminated} bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-600 border border-lime-300 ring-1 ring-lime-400/70 shadow-[0_0_20px_rgba(132,204,22,0.65)] hover:shadow-[0_0_30px_rgba(132,204,22,0.95)] hover:border-white`;
  }
  if (explicitColor === 'orange' || explicitColor === 'flame' || style === 'orange' || style === 'flame') {
    return `${baseIlluminated} bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 border border-orange-300 ring-1 ring-orange-400/70 shadow-[0_0_22px_rgba(249,115,22,0.75)] hover:shadow-[0_0_32px_rgba(249,115,22,1)] hover:border-white`;
  }
  if (explicitColor === 'rose' || explicitColor === 'coral' || style === 'rose' || style === 'coral') {
    return `${baseIlluminated} bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 border border-rose-300 ring-1 ring-rose-400/70 shadow-[0_0_20px_rgba(225,29,72,0.65)] hover:shadow-[0_0_30px_rgba(225,29,72,0.95)] hover:border-white`;
  }
  if (explicitColor === 'slate' || explicitColor === 'dark' || style === 'slate' || style === 'dark') {
    return `${baseIlluminated} bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 text-cyan-200 border border-cyan-400/80 ring-1 ring-cyan-400/50 shadow-[0_0_16px_rgba(6,182,212,0.45)] hover:shadow-[0_0_26px_rgba(6,182,212,0.85)] hover:border-cyan-200 hover:text-white`;
  }
  if (explicitColor === 'blue' || style === 'primary') {
    return `${baseIlluminated} bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 border border-sky-300 ring-1 ring-sky-400/70 shadow-[0_0_20px_rgba(14,165,233,0.65)] hover:shadow-[0_0_30px_rgba(14,165,233,0.95)] hover:border-white`;
  }
  if (explicitColor === 'emerald' || explicitColor === 'green' || style === 'success') {
    return `${baseIlluminated} bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 border border-emerald-300 ring-1 ring-emerald-400/70 shadow-[0_0_20px_rgba(16,185,129,0.65)] hover:shadow-[0_0_30px_rgba(16,185,129,0.95)] hover:border-white`;
  }
  if (explicitColor === 'red' || explicitColor === 'crimson' || style === 'danger') {
    return `${baseIlluminated} bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 border border-rose-300 ring-1 ring-rose-400/70 shadow-[0_0_20px_rgba(244,63,94,0.65)] hover:shadow-[0_0_30px_rgba(244,63,94,0.95)] hover:border-white`;
  }
  if (explicitColor === 'amber' || explicitColor === 'yellow' || explicitColor === 'gold' || style === 'warning' || style === 'gold') {
    return `${baseIlluminated} bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 border border-amber-300 ring-1 ring-amber-400/70 shadow-[0_0_20px_rgba(245,158,11,0.65)] hover:shadow-[0_0_30px_rgba(245,158,11,0.95)] hover:border-white`;
  }

  // Emoji-Aware Color Matching (If button starts with colored emoji circle)
  if (rawText.includes('🟣')) {
    return `${baseIlluminated} bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 border border-purple-300 ring-1 ring-purple-400/70 shadow-[0_0_22px_rgba(168,85,247,0.75)] hover:shadow-[0_0_32px_rgba(168,85,247,1)] hover:border-white`;
  }
  if (rawText.includes('🔵')) {
    return `${baseIlluminated} bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 border border-sky-300 ring-1 ring-sky-400/70 shadow-[0_0_22px_rgba(14,165,233,0.75)] hover:shadow-[0_0_32px_rgba(14,165,233,1)] hover:border-white`;
  }
  if (rawText.includes('🟢')) {
    return `${baseIlluminated} bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 border border-emerald-300 ring-1 ring-emerald-400/70 shadow-[0_0_22px_rgba(16,185,129,0.75)] hover:shadow-[0_0_32px_rgba(16,185,129,1)] hover:border-white`;
  }
  if (rawText.includes('🟡')) {
    return `${baseIlluminated} bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 !text-slate-950 border border-yellow-200 ring-1 ring-yellow-400/80 shadow-[0_0_22px_rgba(234,179,8,0.75)] hover:shadow-[0_0_32px_rgba(234,179,8,1)] hover:border-white`;
  }
  if (rawText.includes('🔴') || rawText.includes('🗑️') || text.includes('delete bot') || cb.includes('del_')) {
    return `${baseIlluminated} bg-gradient-to-r from-red-700 via-rose-700 to-red-900 border border-red-400 ring-1 ring-red-500/80 shadow-[0_0_24px_rgba(220,38,38,0.85)] hover:shadow-[0_0_34px_rgba(220,38,38,1)] hover:border-white`;
  }
  if (rawText.includes('🟠')) {
    return `${baseIlluminated} bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 border border-orange-300 ring-1 ring-orange-400/70 shadow-[0_0_22px_rgba(249,115,22,0.75)] hover:shadow-[0_0_32px_rgba(249,115,22,1)] hover:border-white`;
  }

  // 1. Bot Maker Actions — Distinct Colors:
  // 1a. Create New Bot -> Radiant Cyber Purple / Fuchsia Glow
  if (
    text.includes('create new store bot') ||
    text.includes('create your own') ||
    text.includes('create bot') ||
    text.includes('new bot') ||
    cb === 'cb_newbot_start' ||
    cb === 'cb_create_bot' ||
    cb === 'bot_creator_start'
  ) {
    return `${baseIlluminated} bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 border border-purple-300 ring-1 ring-purple-400/70 shadow-[0_0_22px_rgba(168,85,247,0.75)] hover:shadow-[0_0_32px_rgba(168,85,247,1)] hover:border-white animate-pulse`;
  }

  // 1b. My Created Bots / Manage Bots -> Radiant Cobalt Azure Blue Glow
  if (
    text.includes('my created bots') ||
    text.includes('my bots') ||
    text.includes('manage @') ||
    cb === 'cb_my_bots' ||
    cb.startsWith('cb_manage_')
  ) {
    return `${baseIlluminated} bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 border border-sky-300 ring-1 ring-sky-400/70 shadow-[0_0_20px_rgba(14,165,233,0.65)] hover:shadow-[0_0_30px_rgba(14,165,233,0.95)] hover:border-white`;
  }

  // 1c. Network Stats / Analytics -> Radiant Matrix Emerald Green Glow
  if (
    text.includes('stats') ||
    text.includes('analytics') ||
    cb === 'cb_stats' ||
    cb.startsWith('cb_bot_stats_')
  ) {
    return `${baseIlluminated} bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 border border-emerald-300 ring-1 ring-emerald-400/70 shadow-[0_0_20px_rgba(16,185,129,0.65)] hover:shadow-[0_0_30px_rgba(16,185,129,0.95)] hover:border-white`;
  }

  // 1d. Bot Templates Selector -> Radiant Solar Gold & Amber Glow
  if (
    text.includes('template') ||
    cb === 'cb_templates'
  ) {
    return `${baseIlluminated} bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 border border-amber-300 ring-1 ring-amber-400/70 shadow-[0_0_20px_rgba(245,158,11,0.65)] hover:shadow-[0_0_30px_rgba(245,158,11,0.95)] hover:border-white`;
  }

  // 1e. Diagnostics & Ping -> Radiant Electric Aqua & Cyan Glow
  if (
    text.includes('diagnostic') ||
    text.includes('ping') ||
    cb === 'cb_diagnostics' ||
    cb.startsWith('cb_bot_ping_')
  ) {
    return `${baseIlluminated} bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 border border-cyan-300 ring-1 ring-cyan-400/70 shadow-[0_0_20px_rgba(6,182,212,0.65)] hover:shadow-[0_0_30px_rgba(6,182,212,0.95)] hover:border-white`;
  }

  // 1f. Setup Guide & Help -> Radiant Golden Sunburst Glow
  if (
    text.includes('setup guide') ||
    text.includes('guide') ||
    cb === 'cb_guide'
  ) {
    return `${baseIlluminated} bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 !text-slate-950 border border-yellow-200 ring-1 ring-yellow-400/80 shadow-[0_0_22px_rgba(234,179,8,0.75)] hover:shadow-[0_0_32px_rgba(234,179,8,1)] hover:border-white`;
  }

  // 1g. Store Templates — Free Fire VIP Hack Store -> Blazing Flame Crimson
  if (
    text.includes('free fire vip') ||
    text.includes('vip hack store') ||
    cb === 'cb_tmpl_ff'
  ) {
    return `${baseIlluminated} bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 border border-rose-300 ring-1 ring-rose-400/70 shadow-[0_0_22px_rgba(244,63,94,0.75)] hover:shadow-[0_0_32px_rgba(244,63,94,1)] hover:border-white`;
  }

  // 1h. Store Templates — Diamonds & Top-Up -> Brilliant Diamond Cyan
  if (
    text.includes('diamond') ||
    text.includes('top-up store') ||
    cb === 'cb_tmpl_diamonds'
  ) {
    return `${baseIlluminated} bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 border border-cyan-200 ring-1 ring-cyan-400/80 shadow-[0_0_22px_rgba(6,182,212,0.75)] hover:shadow-[0_0_32px_rgba(6,182,212,1)] hover:border-white`;
  }

  // 1i. Store Templates — Multi-Game Key Hub -> Royal Indigo Purple
  if (
    text.includes('multi-game') ||
    cb === 'cb_tmpl_multigame'
  ) {
    return `${baseIlluminated} bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 border border-indigo-300 ring-1 ring-indigo-400/70 shadow-[0_0_20px_rgba(99,102,241,0.65)] hover:shadow-[0_0_30px_rgba(99,102,241,0.95)] hover:border-white`;
  }

  // 1j. Store Templates — Clone Master Catalog -> Matrix Teal
  if (
    text.includes('clone') ||
    cb === 'cb_clone_prods'
  ) {
    return `${baseIlluminated} bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 border border-teal-300 ring-1 ring-teal-400/70 shadow-[0_0_20px_rgba(20,184,166,0.65)] hover:shadow-[0_0_30px_rgba(20,184,166,0.95)] hover:border-white`;
  }

  // 1k. Store Templates — Empty Catalog -> Slate Steel
  if (
    text.includes('empty catalog') ||
    cb === 'cb_empty_prods'
  ) {
    return `${baseIlluminated} bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 border border-slate-500 ring-1 ring-slate-400/50 shadow-[0_0_15px_rgba(148,163,184,0.35)] hover:border-slate-300`;
  }

  // 1l. Add / Manage Stock Keys -> Emerald Vault Glow
  if (
    text.includes('stock key') ||
    text.includes('add key') ||
    cb.startsWith('cb_bot_keys_') ||
    cb.includes('addkeys')
  ) {
    return `${baseIlluminated} bg-gradient-to-r from-emerald-500 via-green-600 to-teal-600 border border-emerald-300 ring-1 ring-emerald-400/70 shadow-[0_0_20px_rgba(16,185,129,0.65)] hover:shadow-[0_0_30px_rgba(16,185,129,0.95)] hover:border-white`;
  }

  // 1m. Broadcast Message -> Radiant Hot Pink & Cyber Magenta
  if (
    text.includes('broadcast') ||
    cb.startsWith('cb_bot_bcast_')
  ) {
    return `${baseIlluminated} bg-gradient-to-r from-pink-600 via-fuchsia-600 to-rose-600 border border-pink-300 ring-1 ring-pink-400/70 shadow-[0_0_20px_rgba(236,72,153,0.65)] hover:shadow-[0_0_30px_rgba(236,72,153,0.95)] hover:border-white`;
  }

  // 1n. Promo Code Coupons -> Radiant Solar Gold Amber
  if (
    text.includes('coupon') ||
    text.includes('promo code') ||
    cb.startsWith('cb_bot_coupons_')
  ) {
    return `${baseIlluminated} bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 !text-slate-950 border border-yellow-200 ring-1 ring-yellow-400/80 shadow-[0_0_22px_rgba(234,179,8,0.75)] hover:shadow-[0_0_32px_rgba(234,179,8,1)] hover:border-white`;
  }

  // 1o. Reseller API -> Radiant Hyper Violet Glow
  if (
    text.includes('reseller') ||
    cb.startsWith('cb_bot_res_') ||
    cb.includes('reseller')
  ) {
    return `${baseIlluminated} bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 border border-purple-300 ring-1 ring-purple-400/70 shadow-[0_0_20px_rgba(168,85,247,0.65)] hover:shadow-[0_0_30px_rgba(168,85,247,0.95)] hover:border-white`;
  }

  // 1p. Maintenance Toggle -> Radiant Amber Coral Glow
  if (
    text.includes('maintenance') ||
    cb.startsWith('cb_bot_toggle_maint_')
  ) {
    return `${baseIlluminated} bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 border border-amber-300 ring-1 ring-amber-400/70 shadow-[0_0_20px_rgba(245,158,11,0.65)] hover:shadow-[0_0_30px_rgba(245,158,11,0.95)] hover:border-white`;
  }

  // 2. Confirm & Buy / Buy Now / Instant Checkout / Buy Key -> Radiant Laser Crimson / Red Neon Glow
  if (
    text.includes('buy now') ||
    text.includes('buy key') ||
    text.includes('confirm') ||
    text.includes('purchase') ||
    cb.startsWith('buy_') ||
    cb.startsWith('upipay_') ||
    cb.startsWith('confirm_')
  ) {
    return `${baseIlluminated} bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 border border-rose-300 ring-1 ring-rose-400/70 shadow-[0_0_20px_rgba(244,63,94,0.65)] hover:shadow-[0_0_30px_rgba(244,63,94,0.95)] hover:border-white animate-[pulse_2.2s_infinite]`;
  }

  // 3. Add Balance / Recharge / Deposit / FamPay UPI / Payment Gateway -> Radiant Matrix Emerald / Teal Neon Glow
  if (
    text.includes('add balance') ||
    text.includes('balance') ||
    text.includes('deposit') ||
    text.includes('recharge') ||
    text.includes('upi') ||
    text.includes('fampay') ||
    text.includes('paytm') ||
    text.includes('phonepe') ||
    text.includes('gpay') ||
    cb === 'add_balance' ||
    cb === 'menu_add_balance' ||
    cb.startsWith('pay_') ||
    cb.startsWith('deposit_') ||
    cb.startsWith('cb_bot_gw_')
  ) {
    return `${baseIlluminated} bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 border border-emerald-300 ring-1 ring-emerald-400/70 shadow-[0_0_20px_rgba(16,185,129,0.65)] hover:shadow-[0_0_30px_rgba(16,185,129,0.95)] hover:border-white`;
  }

  // 4. Download APK / Loader / Updates / Check Update -> Radiant Electric Cyan / Aqua Neon Glow
  if (
    text.includes('apk') ||
    text.includes('download') ||
    text.includes('loader') ||
    text.includes('check update') ||
    text.includes('update') ||
    url.includes('apk') ||
    cb.includes('apk') ||
    cb.includes('download') ||
    cb === 'check_update'
  ) {
    return `${baseIlluminated} bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 border border-cyan-300 ring-1 ring-cyan-400/70 shadow-[0_0_20px_rgba(6,182,212,0.65)] hover:shadow-[0_0_30px_rgba(6,182,212,0.95)] hover:border-white`;
  }

  // 5. Official Channel / Telegram News / Community / Open Bot -> Radiant Electric Sky Blue Neon Glow
  if (
    text.includes('official channel') ||
    text.includes('official') ||
    text.includes('channel') ||
    text.includes('telegram') ||
    text.includes('open @') ||
    text.includes('launch') ||
    url.includes('t.me') ||
    cb.includes('channel')
  ) {
    return `${baseIlluminated} bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 border border-sky-300 ring-1 ring-sky-400/70 shadow-[0_0_20px_rgba(14,165,233,0.65)] hover:shadow-[0_0_30px_rgba(14,165,233,0.95)] hover:border-white`;
  }

  // 6. Daily Gift / Referral Rewards / Refer & Earn / Spin / Bonus -> Radiant Solar Gold / Yellow Neon Glow
  if (
    text.includes('gift') ||
    text.includes('refer') ||
    text.includes('earn') ||
    text.includes('bonus') ||
    text.includes('reward') ||
    text.includes('spin') ||
    text.includes('coins') ||
    cb === 'daily_gift' ||
    cb === 'referral_menu'
  ) {
    return `${baseIlluminated} bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 !text-slate-950 border border-yellow-200 ring-1 ring-yellow-400/80 shadow-[0_0_22px_rgba(234,179,8,0.75)] hover:shadow-[0_0_32px_rgba(234,179,8,1)] hover:border-white`;
  }

  // 7. View Profile / User Account / My Purchased Keys / Vault -> Radiant Ultra Violet / Purple Neon Glow
  if (
    text.includes('view profile') ||
    text.includes('my profile') ||
    text.includes('view in my profile') ||
    text.includes('profile') ||
    text.includes('account') ||
    text.includes('my keys') ||
    text.includes('key history') ||
    text.includes('all history') ||
    cb === 'profile' ||
    cb === 'menu_profile' ||
    cb === 'my_keys_history'
  ) {
    return `${baseIlluminated} bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 border border-purple-300 ring-1 ring-purple-400/70 shadow-[0_0_20px_rgba(168,85,247,0.65)] hover:shadow-[0_0_30px_rgba(168,85,247,0.95)] hover:border-white`;
  }

  // 8. Video Tutorial / Guide / Setup Guide / How to Use -> Radiant Neon Pink / Fuchsia Glow
  if (
    text.includes('video') ||
    text.includes('tutorial') ||
    text.includes('guide') ||
    text.includes('setup') ||
    text.includes('how to use') ||
    url.includes('youtu') ||
    cb === 'how_to_use'
  ) {
    return `${baseIlluminated} bg-gradient-to-r from-pink-600 via-rose-500 to-fuchsia-600 border border-pink-300 ring-1 ring-pink-400/70 shadow-[0_0_20px_rgba(236,72,153,0.65)] hover:shadow-[0_0_30px_rgba(236,72,153,0.95)] hover:border-white`;
  }

  // 9. Product Store / Categories / Browse Catalog / Continue Shopping -> Radiant Flame Amber / Orange Glow
  if (
    text.includes('continue shopping') ||
    text.includes('buy more') ||
    text.includes('shop') ||
    text.includes('store') ||
    text.includes('catalog') ||
    text.includes('products') ||
    cb === 'shop_categories' ||
    cb === 'menu_shop' ||
    cb.startsWith('cb_bot_prods_')
  ) {
    return `${baseIlluminated} bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 border border-amber-300 ring-1 ring-amber-400/70 shadow-[0_0_20px_rgba(245,158,11,0.65)] hover:shadow-[0_0_30px_rgba(245,158,11,0.95)] hover:border-white`;
  }

  // 10. Duration Packages (1 Day, 7 Days, 10 Days, 30 Days, Lifetime) -> Radiant Lime / Neon Green Glow
  if (
    text.includes('day') ||
    text.includes('days') ||
    text.includes('month') ||
    text.includes('lifetime') ||
    text.includes('hour') ||
    text.includes('hours')
  ) {
    return `${baseIlluminated} bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-600 border border-lime-300 ring-1 ring-lime-400/70 shadow-[0_0_20px_rgba(132,204,22,0.65)] hover:shadow-[0_0_30px_rgba(132,204,22,0.95)] hover:border-white`;
  }

  // 11. Support / Ticket / Help / Contact Admin -> Radiant Coral / Deep Red Glow
  if (
    text.includes('support') ||
    text.includes('ticket') ||
    text.includes('help') ||
    cb.includes('support') ||
    cb.includes('ticket')
  ) {
    return `${baseIlluminated} bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 border border-rose-300 ring-1 ring-rose-400/70 shadow-[0_0_20px_rgba(225,29,72,0.65)] hover:shadow-[0_0_30px_rgba(225,29,72,0.95)] hover:border-white`;
  }

  // 12. Navigation: Back / Main Menu / Cancel / Dismiss -> Illuminated Cyber Glass Key with Vivid Cyan Neon Halo
  if (
    text.includes('back') ||
    text.includes('main menu') ||
    text.includes('cancel') ||
    text.includes('dismiss') ||
    cb === 'main_menu' ||
    cb === 'back_main' ||
    cb.includes('back') ||
    cb === 'cb_cancel' ||
    cb === 'cb_main_menu' ||
    cb === 'bot_create_cancel'
  ) {
    return `${baseIlluminated} bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 text-cyan-200 border border-cyan-400/80 ring-1 ring-cyan-400/50 shadow-[0_0_16px_rgba(6,182,212,0.45)] hover:shadow-[0_0_26px_rgba(6,182,212,0.85)] hover:border-cyan-200 hover:text-white`;
  }

  // 13. Default Illuminated Fallback: Radiant Cyan-Teal Neon Key
  return `${baseIlluminated} bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 border border-cyan-300 ring-1 ring-cyan-400/70 shadow-[0_0_20px_rgba(6,182,212,0.65)] hover:shadow-[0_0_30px_rgba(6,182,212,0.95)] hover:border-white`;
}

export const InlineKeyboardRenderer: React.FC<Props> = ({ keyboard, onButtonClick, globalButtonTheme }) => {
  if (!keyboard || keyboard.length === 0) return null;

  return (
    <div className="mt-3.5 space-y-2.5 w-full select-none">
      {keyboard.map((row, rowIdx) => (
        <div key={`tg-row-${rowIdx}`} className="flex gap-2 w-full items-center">
          {row.map((btn, colIdx) => {
            const isUrl = Boolean(btn.url);
            const styleClasses = getButtonStyleClasses(btn, globalButtonTheme);
            const btnIcon = getButtonIcon(btn.text, btn.callback_data || '', btn.url || '');
            const btnKey = `tg-btn-${rowIdx}-${colIdx}-${btn.callback_data || btn.url || btn.text || 'btn'}`;

            if (isUrl) {
              return (
                <a
                  key={btnKey}
                  href={btn.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 min-w-0 min-h-[46px] py-2.5 px-3 sm:px-4 rounded-xl text-sm sm:text-[15px] flex items-center justify-center gap-2 transition-all ${styleClasses}`}
                >
                  {btn.icon_custom_emoji_id ? (
                    <TgEmojiBadge emojiId={btn.icon_custom_emoji_id} />
                  ) : (
                    btnIcon
                  )}
                  <span className="truncate tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">{btn.text}</span>
                  <ExternalLink className="w-4 h-4 shrink-0 opacity-80 ml-0.5 drop-shadow" />
                </a>
              );
            }

            return (
              <button
                key={btnKey}
                type="button"
                onClick={() => btn.callback_data && onButtonClick(btn.callback_data, btn.text)}
                className={`flex-1 min-w-0 min-h-[46px] py-2.5 px-3 sm:px-4 rounded-xl text-sm sm:text-[15px] flex items-center justify-center gap-2 transition-all cursor-pointer ${styleClasses}`}
              >
                {btn.icon_custom_emoji_id ? (
                  <TgEmojiBadge emojiId={btn.icon_custom_emoji_id} />
                ) : (
                  btnIcon
                )}
                <span className="truncate tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">{btn.text}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

