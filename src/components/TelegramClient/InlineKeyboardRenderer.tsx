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

  // Explicit style overrides with rich Telegram themed colors
  if (style === 'danger') {
    return "bg-gradient-to-b from-[#b71c1c] to-[#880e4f] text-white hover:from-[#c62828] hover:to-[#ad1457] active:from-[#7f0000] active:to-[#560027] border border-[#ef5350]/50 font-bold shadow-lg shadow-red-950/40";
  }
  if (style === 'success') {
    return "bg-gradient-to-b from-[#1b5e20] to-[#2e7d32] text-white hover:from-[#2e7d32] hover:to-[#388e3c] active:from-[#0d3b10] active:to-[#1b5e20] border border-[#4caf50]/50 font-bold shadow-lg shadow-emerald-950/40";
  }
  if (style === 'primary') {
    return "bg-gradient-to-b from-[#1b5e20] to-[#2e7d32] text-white hover:from-[#2e7d32] hover:to-[#388e3c] active:from-[#0d3b10] active:to-[#1b5e20] border border-[#4caf50]/50 font-bold shadow-lg shadow-emerald-950/40";
  }
  if (style === 'secondary') {
    return "bg-gradient-to-b from-[#1b5e20] to-[#2e7d32] text-white hover:from-[#2e7d32] hover:to-[#388e3c] active:from-[#0d3b10] active:to-[#1b5e20] border border-[#4caf50]/50 font-bold shadow-lg shadow-emerald-950/40";
  }
  if (style === 'warning') {
    return "bg-gradient-to-b from-[#b71c1c] to-[#c62828] text-white hover:from-[#c62828] hover:to-[#d32f2f] active:from-[#7f0000] active:to-[#880e4f] border border-[#ef5350]/50 font-bold shadow-lg shadow-red-950/40";
  }

  // Dynamic automatic color classification matching the Telegram Bot in video:
  // 1. Shop Now / Primary CTA / Buy / Back / Cancel / Maintenance -> Red / Crimson Highlight
  if (
    text.includes('shop') || text.includes('store product') || text.includes('buy now') ||
    text.includes('confirm') || text.includes('purchase') || text.includes('back') ||
    text.includes('cancel') || text.includes('maintenance') || text.includes('under maintenance') ||
    text.includes('out of stock') || text.includes('sold out') ||
    cb === 'menu_shop' || cb === 'shop_categories' || cb.startsWith('buy_') ||
    cb.startsWith('maint_') || cb.includes('back') || cb.includes('cancel')
  ) {
    return "bg-gradient-to-b from-[#b71c1c] to-[#880e4f] text-white hover:from-[#c62828] hover:to-[#ad1457] active:from-[#7f0000] active:to-[#560027] border border-[#ef5350]/50 font-bold shadow-lg shadow-red-950/40";
  }

  // 2. All products, categories, duration plans, balance, profile, lucky, support, share -> Rich Forest Green
  return "bg-gradient-to-b from-[#1b5e20] to-[#2e7d32] text-white hover:from-[#2e7d32] hover:to-[#388e3c] active:from-[#0d3b10] active:to-[#1b5e20] border border-[#4caf50]/50 font-bold shadow-lg shadow-emerald-950/40";
}

export const InlineKeyboardRenderer: React.FC<Props> = ({ keyboard, onButtonClick }) => {
  if (!keyboard || keyboard.length === 0) return null;

  return (
    <div className="mt-3.5 space-y-2 w-full select-none">
      {keyboard.map((row, rowIdx) => (
        <div key={`tg-row-${rowIdx}`} className="flex gap-2 w-full items-center">
          {row.map((btn, colIdx) => {
            const isUrl = Boolean(btn.url);
            const styleClasses = getButtonStyleClasses(btn, rowIdx, colIdx);
            const btnKey = `tg-btn-${rowIdx}-${colIdx}-${btn.callback_data || btn.url || btn.text || 'btn'}`;

            if (isUrl) {
              return (
                <a
                  key={btnKey}
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
                key={btnKey}
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

