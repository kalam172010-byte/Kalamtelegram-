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
  Key
} from 'lucide-react';

interface Props {
  keyboard: InlineKeyboardButton[][];
  onButtonClick: (callbackData: string, text: string) => void;
}

function getButtonIcon(text: string, cb: string, url: string) {
  const t = text.toLowerCase();
  const c = cb.toLowerCase();
  const u = url.toLowerCase();

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
  if (t.includes('main menu') || t.includes('home') || c === 'main_menu' || c === 'back_main') {
    return <Home className="w-4 h-4 shrink-0 text-slate-300" />;
  }
  if (t.includes('balance') || t.includes('deposit') || t.includes('recharge') || c.includes('balance') || c.includes('pay_')) {
    return <CreditCard className="w-4 h-4 shrink-0 text-emerald-200" />;
  }
  if (t.includes('buy') || t.includes('confirm') || c.startsWith('buy_')) {
    return <Zap className="w-4 h-4 shrink-0 text-yellow-300" />;
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

function getButtonStyleClasses(btn: InlineKeyboardButton): string {
  const style = btn.style;
  const text = (btn.text || '').toLowerCase();
  const cb = (btn.callback_data || '').toLowerCase();
  const url = (btn.url || '').toLowerCase();

  // 1. Download APK / Loader Link Buttons -> Radiant Emerald / Teal
  if (
    text.includes('apk') ||
    text.includes('download') ||
    url.includes('apk') ||
    text.includes('loader') ||
    cb.includes('apk') ||
    cb.includes('download')
  ) {
    return "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold shadow-lg shadow-emerald-950/60 border border-emerald-400/80 ring-1 ring-emerald-400/40";
  }

  // 2. Official Channel / Telegram Links -> Radiant Sky Blue / Indigo
  if (
    text.includes('official channel') ||
    text.includes('official') ||
    text.includes('channel') ||
    text.includes('telegram') ||
    url.includes('t.me') ||
    cb.includes('channel')
  ) {
    return "bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-500 hover:to-blue-500 text-white font-extrabold shadow-lg shadow-sky-950/60 border border-sky-400/80 ring-1 ring-sky-400/40";
  }

  // 3. View Profile / User Account / Purchased Keys History -> Radiant Purple / Violet
  if (
    text.includes('view profile') ||
    text.includes('my profile') ||
    text.includes('view in my profile') ||
    text.includes('profile') ||
    text.includes('my keys') ||
    cb === 'profile' ||
    cb === 'menu_profile' ||
    cb === 'my_keys_history'
  ) {
    return "bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-700 hover:from-purple-500 hover:to-violet-500 text-white font-extrabold shadow-lg shadow-purple-950/60 border border-purple-400/80 ring-1 ring-purple-400/40";
  }

  // 4. Setup Video Guide / Tutorial -> Radiant Rose / Pink / Purple
  if (
    text.includes('video') ||
    text.includes('tutorial') ||
    text.includes('guide') ||
    text.includes('setup') ||
    url.includes('youtu') ||
    cb === 'how_to_use'
  ) {
    return "bg-gradient-to-r from-rose-600 via-pink-600 to-purple-700 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold shadow-lg shadow-rose-950/60 border border-rose-400/80 ring-1 ring-rose-400/40";
  }

  // 5. Continue Shopping / Browse Store / Catalog -> Radiant Amber / Orange
  if (
    text.includes('continue shopping') ||
    text.includes('buy more') ||
    text.includes('shop') ||
    text.includes('store') ||
    text.includes('catalog') ||
    cb === 'shop_categories' ||
    cb === 'menu_shop'
  ) {
    return "bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold shadow-lg shadow-amber-950/60 border border-amber-400/80 ring-1 ring-amber-400/40";
  }

  // 6. Add Balance / Recharge / Deposit / UPI -> Radiant Green / Teal
  if (
    text.includes('add balance') ||
    text.includes('balance') ||
    text.includes('deposit') ||
    text.includes('recharge') ||
    cb === 'add_balance' ||
    cb === 'menu_add_balance' ||
    cb.startsWith('pay_')
  ) {
    return "bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 hover:from-emerald-500 hover:to-green-500 text-white font-extrabold shadow-lg shadow-emerald-950/60 border border-emerald-400/80 ring-1 ring-emerald-400/40";
  }

  // 7. Confirm & Buy / Buy Now / Instant Purchase -> Radiant Crimson / Red
  if (
    text.includes('buy now') ||
    text.includes('confirm') ||
    text.includes('purchase') ||
    cb.startsWith('buy_') ||
    cb.startsWith('upipay_')
  ) {
    return "bg-gradient-to-r from-red-600 via-rose-600 to-pink-700 hover:from-red-500 hover:to-rose-500 text-white font-extrabold shadow-lg shadow-red-950/60 border border-red-400/80 ring-1 ring-red-400/40 animate-pulse";
  }

  // 8. Explicit Style Overrides
  if (style === 'danger') {
    return "bg-gradient-to-r from-red-700 via-rose-700 to-pink-800 text-white hover:from-red-600 hover:to-rose-600 border border-red-400/70 font-extrabold shadow-lg shadow-red-950/50";
  }
  if (style === 'success') {
    return "bg-gradient-to-r from-emerald-700 via-teal-700 to-green-800 text-white hover:from-emerald-600 hover:to-teal-600 border border-emerald-400/70 font-extrabold shadow-lg shadow-emerald-950/50";
  }
  if (style === 'primary') {
    return "bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white hover:from-blue-600 hover:to-indigo-600 border border-blue-400/70 font-extrabold shadow-lg shadow-blue-950/50";
  }
  if (style === 'warning') {
    return "bg-gradient-to-r from-amber-700 via-orange-700 to-red-800 text-white hover:from-amber-600 hover:to-orange-600 border border-amber-400/70 font-extrabold shadow-lg shadow-amber-950/50";
  }

  // 9. Back / Main Menu / Cancel -> Slate Glass Gradient
  if (
    text.includes('back') ||
    text.includes('main menu') ||
    text.includes('cancel') ||
    cb === 'main_menu' ||
    cb === 'back_main' ||
    cb.includes('back')
  ) {
    return "bg-gradient-to-r from-slate-800 via-slate-800/90 to-slate-900 text-slate-100 hover:from-slate-700 hover:to-slate-800 hover:text-white border border-slate-600/80 font-bold shadow-md";
  }

  // Default Fallback
  return "bg-gradient-to-r from-teal-700 via-emerald-700 to-slate-800 text-white hover:from-teal-600 hover:to-emerald-600 border border-teal-500/60 font-bold shadow-md";
}

export const InlineKeyboardRenderer: React.FC<Props> = ({ keyboard, onButtonClick }) => {
  if (!keyboard || keyboard.length === 0) return null;

  return (
    <div className="mt-3.5 space-y-2.5 w-full select-none">
      {keyboard.map((row, rowIdx) => (
        <div key={`tg-row-${rowIdx}`} className="flex gap-2 w-full items-center">
          {row.map((btn, colIdx) => {
            const isUrl = Boolean(btn.url);
            const styleClasses = getButtonStyleClasses(btn);
            const btnIcon = getButtonIcon(btn.text, btn.callback_data || '', btn.url || '');
            const btnKey = `tg-btn-${rowIdx}-${colIdx}-${btn.callback_data || btn.url || btn.text || 'btn'}`;

            if (isUrl) {
              return (
                <a
                  key={btnKey}
                  href={btn.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 min-w-0 min-h-[46px] py-2.5 px-3 sm:px-4 rounded-xl text-sm sm:text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${styleClasses}`}
                >
                  {btn.icon_custom_emoji_id ? (
                    <TgEmojiBadge emojiId={btn.icon_custom_emoji_id} />
                  ) : (
                    btnIcon
                  )}
                  <span className="truncate tracking-wide">{btn.text}</span>
                  <ExternalLink className="w-4 h-4 shrink-0 opacity-80 ml-0.5" />
                </a>
              );
            }

            return (
              <button
                key={btnKey}
                type="button"
                onClick={() => btn.callback_data && onButtonClick(btn.callback_data, btn.text)}
                className={`flex-1 min-w-0 min-h-[46px] py-2.5 px-3 sm:px-4 rounded-xl text-sm sm:text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer ${styleClasses}`}
              >
                {btn.icon_custom_emoji_id ? (
                  <TgEmojiBadge emojiId={btn.icon_custom_emoji_id} />
                ) : (
                  btnIcon
                )}
                <span className="truncate tracking-wide">{btn.text}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};
