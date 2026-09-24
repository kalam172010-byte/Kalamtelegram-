import React from 'react';
import { InlineKeyboardButton } from '../../types';
import { TgEmojiBadge } from '../../utils/telegramFormatter';
import { ExternalLink } from 'lucide-react';

interface Props {
  keyboard: InlineKeyboardButton[][];
  onButtonClick: (callbackData: string, text: string) => void;
}

function getButtonStyleClasses(btn: InlineKeyboardButton, rowIndex: number, colIndex: number): string {
  const style = btn.style;
  const text = (btn.text || '').toLowerCase();
  const cb = (btn.callback_data || '').toLowerCase();
  const url = (btn.url || '').toLowerCase();

  // Explicit style overrides
  if (style === 'danger') {
    return "bg-[#9b2828] text-white hover:bg-[#b32e2e] active:bg-[#832222] border border-[#e74c3c]/40 font-bold shadow-md shadow-red-950/20";
  }
  if (style === 'success') {
    return "bg-[#157934] text-white hover:bg-[#198f3d] active:bg-[#11632a] border border-[#2ecc71]/40 font-bold shadow-md shadow-emerald-950/20";
  }
  if (style === 'primary') {
    return "bg-[#1d6fa5] text-white hover:bg-[#2282c2] active:bg-[#185c89] border border-[#3498db]/40 font-bold shadow-md shadow-sky-950/20";
  }
  if (style === 'secondary') {
    return "bg-[#3e782e] text-white hover:bg-[#488936] active:bg-[#346527] border border-[#55a23f]/40 font-bold shadow-md shadow-green-950/20";
  }
  if (style === 'warning') {
    return "bg-[#a66a3a] text-white hover:bg-[#bd7843] active:bg-[#8f5a32] border border-[#c98552]/40 font-bold shadow-md shadow-amber-950/20";
  }

  // Dynamic automatic color classification if style is not explicitly set:
  // 1. Buy / Confirm / Purchase / Out of Stock / Cancel / Maintenance -> Red (Danger)
  if (
    text.includes('buy') || text.includes('confirm') || text.includes('purchase') ||
    text.includes('out of stock') || text.includes('sold out') || text.includes('cancel') ||
    text.includes('maintenance') || text.includes('under maintenance') ||
    cb.startsWith('buy_') || cb.startsWith('maint_') || cb.includes('confirm')
  ) {
    return "bg-[#9b2828] text-white hover:bg-[#b32e2e] active:bg-[#832222] border border-[#e74c3c]/40 font-bold shadow-md shadow-red-950/20";
  }

  // 2. Add Balance / Wallet / Deposit / Pay / Recharge / Cash / Redeem / Gift -> Emerald Green (Success)
  if (
    text.includes('balance') || text.includes('wallet') || text.includes('deposit') ||
    text.includes('pay') || text.includes('recharge') || text.includes('upi') ||
    text.includes('redeem') || text.includes('gift') || text.includes('claim') ||
    cb.includes('add_balance') || cb.includes('deposit') || cb.includes('pay') ||
    cb.includes('redeem') || cb.includes('daily_gift') || cb.includes('gateway')
  ) {
    return "bg-[#157934] text-white hover:bg-[#198f3d] active:bg-[#11632a] border border-[#2ecc71]/40 font-bold shadow-md shadow-emerald-950/20";
  }

  // 3. Products / Panels / Categories / Store / Catalog / Duration Plans -> Cyan / Primary Blue
  if (
    text.includes('panel') || text.includes('product') || text.includes('store') ||
    text.includes('catalog') || text.includes('plan') || text.includes('validity') ||
    text.includes('non-root') || text.includes('non root') || text.includes('root') ||
    text.includes('emulator') || text.includes('apk') ||
    cb.startsWith('cat_') || cb.startsWith('pnl_') || cb.startsWith('prod_') || cb.includes('shop')
  ) {
    return "bg-[#1d6fa5] text-white hover:bg-[#2282c2] active:bg-[#185c89] border border-[#3498db]/40 font-bold shadow-md shadow-sky-950/20";
  }

  // 4. Profile / My Account / VIP / Reseller / Referral / History / Stats -> Royal Purple / Indigo
  if (
    text.includes('profile') || text.includes('account') || text.includes('vip') ||
    text.includes('reseller') || text.includes('referral') || text.includes('earn') ||
    text.includes('history') || text.includes('my keys') || text.includes('stats') ||
    cb.includes('profile') || cb.includes('reseller') || cb.includes('referral')
  ) {
    return "bg-[#6b21a8] text-white hover:bg-[#7e22ce] active:bg-[#581c87] border border-[#a855f7]/40 font-bold shadow-md shadow-purple-950/20";
  }

  // 5. Support / Help / Ticket / Tutorial / Video / Channel / Update -> Amber Orange
  if (
    text.includes('support') || text.includes('help') || text.includes('ticket') ||
    text.includes('tutorial') || text.includes('guide') || text.includes('video') ||
    text.includes('update') || text.includes('status') || text.includes('channel') ||
    cb.includes('support') || cb.includes('ticket') || cb.includes('update') ||
    cb.includes('how_to') || url.includes('t.me') || url.includes('youtube')
  ) {
    return "bg-[#a66a3a] text-white hover:bg-[#bd7843] active:bg-[#8f5a32] border border-[#c98552]/40 font-bold shadow-md shadow-amber-950/20";
  }

  // 6. Back / Menu / Return -> Olive Green
  if (
    text.includes('back') || text.includes('main menu') || text.includes('return') ||
    cb.includes('main_menu') || cb.includes('back')
  ) {
    return "bg-[#3e782e] text-white hover:bg-[#488936] active:bg-[#346527] border border-[#55a23f]/40 font-bold shadow-md shadow-green-950/20";
  }

  // Fallback vibrant palette based on row/column so no button is ever dull
  const vibrantPalette = [
    "bg-[#1d6fa5] text-white hover:bg-[#2282c2] active:bg-[#185c89] border border-[#3498db]/40 font-bold shadow-md",
    "bg-[#157934] text-white hover:bg-[#198f3d] active:bg-[#11632a] border border-[#2ecc71]/40 font-bold shadow-md",
    "bg-[#6b21a8] text-white hover:bg-[#7e22ce] active:bg-[#581c87] border border-[#a855f7]/40 font-bold shadow-md",
    "bg-[#3e782e] text-white hover:bg-[#488936] active:bg-[#346527] border border-[#55a23f]/40 font-bold shadow-md",
    "bg-[#a66a3a] text-white hover:bg-[#bd7843] active:bg-[#8f5a32] border border-[#c98552]/40 font-bold shadow-md"
  ];

  return vibrantPalette[(rowIndex + colIndex) % vibrantPalette.length];
}

export const InlineKeyboardRenderer: React.FC<Props> = ({ keyboard, onButtonClick }) => {
  if (!keyboard || keyboard.length === 0) return null;

  return (
    <div className="mt-3.5 space-y-2 w-full select-none">
      {keyboard.map((row, rowIdx) => (
        <div key={rowIdx} className="flex gap-2 w-full items-center">
          {row.map((btn, colIdx) => {
            const isUrl = Boolean(btn.url);
            const styleClasses = getButtonStyleClasses(btn, rowIdx, colIdx);

            if (isUrl) {
              return (
                <a
                  key={colIdx}
                  href={btn.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 min-w-0 min-h-[44px] py-2.5 px-2.5 sm:px-3.5 rounded-xl text-sm md:text-base font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm ${styleClasses}`}
                >
                  {btn.icon_custom_emoji_id && (
                    <TgEmojiBadge emojiId={btn.icon_custom_emoji_id} />
                  )}
                  <span className="truncate">{btn.text}</span>
                  <ExternalLink className="w-4 h-4 shrink-0 opacity-80" />
                </a>
              );
            }

            return (
              <button
                key={colIdx}
                type="button"
                onClick={() => btn.callback_data && onButtonClick(btn.callback_data, btn.text)}
                className={`flex-1 min-w-0 min-h-[44px] py-2.5 px-2 sm:px-3.5 rounded-xl text-sm md:text-base font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-sm cursor-pointer ${styleClasses}`}
              >
                {btn.icon_custom_emoji_id && (
                  <TgEmojiBadge emojiId={btn.icon_custom_emoji_id} />
                )}
                <span className="truncate">{btn.text}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

