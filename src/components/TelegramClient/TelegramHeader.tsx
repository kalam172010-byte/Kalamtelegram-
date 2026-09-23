import React from 'react';
import { useBot } from '../../context/BotContext';
import { RefreshCw, Smartphone, Monitor, Bot as BotIcon, Maximize2, ArrowLeft } from 'lucide-react';
import { WebsiteLogo } from '../Common/WebsiteLogo';

interface Props {
  isMobileFrame: boolean;
  setIsMobileFrame: (val: boolean) => void;
}

export const TelegramHeader: React.FC<Props> = ({ isMobileFrame, setIsMobileFrame }) => {
  const { resetChat, setActiveTab, activeBot, myBots, switchActiveBot } = useBot();

  if (!activeBot) {
    return (
      <div className="bg-slate-900/98 backdrop-blur border-b border-slate-800 px-4 md:px-6 py-3 flex items-center justify-between gap-3 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <WebsiteLogo size="sm" showSubtitle={false} />
          <div>
            <h1 className="text-sm font-bold text-white">No Telegram Bot Selected</h1>
            <p className="text-xs text-slate-400">Create or connect your store bot to start simulating</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('my_bots')}
          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition cursor-pointer"
        >
          + Create Store Bot
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/98 backdrop-blur border-b border-slate-800 px-3 md:px-6 py-2.5 md:py-3 flex items-center justify-between gap-3 shrink-0 select-none">
      {/* Bot Info */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        {/* Mobile Back Button */}
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          title="Back to Dashboard"
          className="sm:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white active:scale-95 transition cursor-pointer shrink-0 border border-slate-700/60"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="relative shrink-0">
          <div
            style={{ backgroundColor: activeBot.theme_color || '#06b6d4' }}
            className="w-9 h-9 md:w-11 md:h-11 rounded-2xl flex items-center justify-center text-white font-black text-sm md:text-lg shadow-lg ring-2 ring-cyan-500/20"
          >
            {activeBot.name ? activeBot.name.substring(0, 2).toUpperCase() : 'KB'}
          </div>
          <span className={`absolute bottom-0 right-0 w-3 h-3 md:w-3.5 md:h-3.5 border-2 border-slate-900 rounded-full ${
            activeBot.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-slate-500'
          }`}></span>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 md:gap-2">
            <h1 className="text-sm md:text-lg font-bold text-white truncate flex items-center gap-1.5">
              {activeBot.name}
              <span className="text-[10px] md:text-[11px] bg-cyan-500/20 text-cyan-300 font-bold px-1.5 py-0.5 rounded-full border border-cyan-500/30">
                BOT
              </span>
            </h1>
          </div>
          <p className="text-[11px] md:text-sm text-slate-400 flex items-center gap-1.5 truncate">
            <span className={activeBot.status === 'ONLINE' ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
              ● {activeBot.status}
            </span>
            <span>• @{activeBot.username}</span>
          </p>
        </div>
      </div>

      {/* Controls & Bot Switcher */}
      <div className="flex items-center gap-2.5">
        {/* Switch Bot Dropdown */}
        {myBots.length > 1 && (
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs md:text-sm">
            <span className="text-slate-400 font-semibold">Bot:</span>
            <select
              value={activeBot?.id || ''}
              onChange={(e) => switchActiveBot(e.target.value)}
              className="bg-transparent text-cyan-400 font-bold outline-none cursor-pointer pr-1"
            >
              {myBots.map(b => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-slate-200">
                  @{b.username}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Viewport Frame Toggle */}
        <button
          type="button"
          onClick={() => setIsMobileFrame(!isMobileFrame)}
          title={isMobileFrame ? "Switch to Full Screen Width" : "Switch to Mobile Phone Frame"}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition cursor-pointer text-xs md:text-sm font-semibold border border-slate-700/60"
        >
          {isMobileFrame ? (
            <>
              <Maximize2 className="w-4 h-4 text-cyan-400" />
              <span className="hidden md:inline">Full Screen</span>
            </>
          ) : (
            <>
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span className="hidden md:inline">Phone Frame</span>
            </>
          )}
        </button>

        {/* My Bots Hub */}
        <button
          type="button"
          onClick={() => setActiveTab('my_bots')}
          title="Go to My Bots Dashboard"
          className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600/30 text-cyan-200 hover:bg-cyan-600/50 border border-cyan-500/30 text-xs md:text-sm font-bold transition cursor-pointer"
        >
          <BotIcon className="w-4 h-4" />
          <span>My Bots</span>
        </button>

        {/* Restart / Reset Chat */}
        <button
          type="button"
          onClick={resetChat}
          title="Restart bot (/start)"
          className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-cyan-300 hover:bg-slate-700 transition cursor-pointer border border-slate-700/60"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
