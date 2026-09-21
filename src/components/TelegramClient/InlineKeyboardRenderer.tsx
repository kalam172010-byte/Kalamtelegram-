import React from 'react';
import { InlineKeyboardButton } from '../../types';
import { TgEmojiBadge } from '../../utils/telegramFormatter';
import { ExternalLink } from 'lucide-react';

interface Props {
  keyboard: InlineKeyboardButton[][];
  onButtonClick: (callbackData: string, text: string) => void;
}

export const InlineKeyboardRenderer: React.FC<Props> = ({ keyboard, onButtonClick }) => {
  if (!keyboard || keyboard.length === 0) return null;

  return (
    <div className="mt-3.5 space-y-2 w-full select-none">
      {keyboard.map((row, rowIdx) => (
        <div key={rowIdx} className="flex flex-wrap gap-2 w-full">
          {row.map((btn, colIdx) => {
            const isUrl = Boolean(btn.url);

            // Style variants matching Telegram Web & Bot themes
            let styleClasses = "bg-slate-800 text-slate-100 hover:bg-slate-700 active:bg-slate-600 border border-slate-700";

            if (btn.style === 'primary') {
              styleClasses = "bg-sky-600/30 text-sky-100 hover:bg-sky-600/50 active:bg-sky-600/60 border border-sky-500/40 font-bold";
            } else if (btn.style === 'danger') {
              styleClasses = "bg-rose-500/25 text-rose-100 hover:bg-rose-500/45 active:bg-rose-500/55 border border-rose-500/40 font-bold";
            } else if (btn.style === 'success') {
              styleClasses = "bg-emerald-500/30 text-emerald-100 hover:bg-emerald-500/50 active:bg-emerald-500/60 border border-emerald-500/40 font-bold";
            }

            if (isUrl) {
              return (
                <a
                  key={colIdx}
                  href={btn.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 min-w-[130px] min-h-[44px] py-2.5 px-3.5 rounded-xl text-sm md:text-base font-semibold flex items-center justify-center gap-2 transition-all shadow-sm ${styleClasses}`}
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
                className={`flex-1 min-w-[120px] min-h-[44px] py-2.5 px-3.5 rounded-xl text-sm md:text-base font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm cursor-pointer ${styleClasses}`}
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
