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
        <div key={rowIdx} className="flex gap-2 w-full items-center">
          {row.map((btn, colIdx) => {
            const isUrl = Boolean(btn.url);

            // Style variants matching Telegram mobile app & custom bot themes
            let styleClasses = "bg-slate-800 text-slate-100 hover:bg-slate-700 active:bg-slate-600 border border-slate-700";

            if (btn.style === 'primary') {
              styleClasses = "bg-[#1d6fa5] text-white hover:bg-[#2282c2] active:bg-[#185c89] border border-[#3498db]/40 font-bold shadow-md";
            } else if (btn.style === 'danger') {
              // Rich red button style matching user screenshot (e.g. 🛒 Buy Now, Support)
              styleClasses = "bg-[#9b2828] text-white hover:bg-[#b32e2e] active:bg-[#832222] border border-[#e74c3c]/30 font-bold shadow-md";
            } else if (btn.style === 'success') {
              // Vibrant emerald green button style matching user screenshot (e.g. Check Update, Add Balance, My Profile)
              styleClasses = "bg-[#157934] text-white hover:bg-[#198f3d] active:bg-[#11632a] border border-[#2ecc71]/30 font-bold shadow-md";
            } else if (btn.style === 'secondary') {
              // Olive green button style matching screenshot secondary buttons
              styleClasses = "bg-[#3e782e] text-white hover:bg-[#488936] active:bg-[#346527] border border-[#55a23f]/30 font-bold shadow-md";
            } else if (btn.style === 'warning') {
              styleClasses = "bg-[#a66a3a] text-white hover:bg-[#bd7843] active:bg-[#8f5a32] border border-[#c98552]/40 font-bold shadow-md";
            }

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
