import React, { useState, useRef, useEffect } from 'react';
import { useBot } from '../../context/BotContext';
import { InlineKeyboardRenderer } from './InlineKeyboardRenderer';
import { formatTelegramHTML } from '../../utils/telegramFormatter';
import { FamPayModal } from '../PaymentModal/FamPayModal';
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  CheckCheck,
  Menu,
  Terminal,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  CreditCard,
  Crown,
  HelpCircle,
  Megaphone,
  X
} from 'lucide-react';

export const TelegramBotView: React.FC = () => {
  const {
    messages,
    sendUserMessage,
    handleCallbackQuery,
    isBotTyping,
    currentUser,
    currentFsmState,
    activeBot,
    setActiveTab
  } = useBot();

  const [inputText, setInputText] = useState('');
  const [showCommandsMenu, setShowCommandsMenu] = useState(false);
  const [selectedQrOrder, setSelectedQrOrder] = useState<any | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBotTyping]);

  if (!activeBot) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0e1621] p-6 text-center text-slate-200 space-y-5">
        <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-4xl shadow-xl">
          🤖
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-xl md:text-2xl font-black text-white">Create Your Telegram Bot</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Welcome, <span className="text-cyan-300 font-bold">{currentUser.first_name || 'Store Owner'}</span>! Connect your own Telegram Bot Token from @BotFather, your own UPI Gateway, and Reseller API keys.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('my_bots')}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 flex items-center gap-2 transition cursor-pointer"
        >
          <Bot className="w-5 h-5" />
          <span>Go to My Bots & Create</span>
        </button>
      </div>
    );
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendUserMessage(inputText);
    setInputText('');
  };

  const quickCommands = [
    { cmd: '/start', label: 'Main Menu', icon: Sparkles },
    { cmd: '/shop', label: 'Product Store', icon: ShoppingBag },
    { cmd: '/balance', label: 'Add Balance', icon: CreditCard },
    { cmd: '/profile', label: 'My Profile', icon: UserIcon },
    { cmd: '/reseller', label: 'Reseller Panel', icon: Crown },
    { cmd: '/vip', label: 'VIP Club', icon: Crown },
    { cmd: '/admin', label: 'Admin Terminal', icon: Terminal },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0e1621] relative overflow-hidden">
      {/* Telegram Chat Wallpaper Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#38bdf8 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 z-10 scrollbar-thin scrollbar-thumb-slate-700">
        {messages.map((msg) => {
          const isBot = msg.sender === 'bot';

          // Render Welcome Sticker if specified
          if (msg.media_type === 'sticker') {
            return (
              <div key={msg.id} className="flex justify-start my-3">
                <div className="bg-gradient-to-br from-indigo-900/70 to-purple-900/70 border border-indigo-500/40 rounded-2xl p-4 shadow-xl flex items-center gap-3.5 max-w-sm animate-in zoom-in-95 duration-200">
                  <div className="text-3xl p-2.5 bg-indigo-500/20 rounded-2xl">⚡</div>
                  <div>
                    <h4 className="text-sm font-bold text-indigo-100 tracking-wider">KALAM FF OFFICIAL</h4>
                    <p className="text-xs text-indigo-300">Welcome to Instant Delivery Panel</p>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex w-full ${isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[94%] sm:max-w-[85%] md:max-w-[80%] rounded-2xl p-4 md:p-5 shadow-lg transition-all ${
                  isBot
                    ? 'bg-[#182533] text-slate-100 rounded-tl-xs border border-slate-700/60'
                    : 'bg-[#2b5278] text-white rounded-tr-xs'
                }`}
              >
                {/* Sender Name in Bot Group Context */}
                {isBot && (
                  <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-700/50 text-xs font-bold text-cyan-400">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      <span className="text-sm font-bold">{msg.sender_name || 'KALAM FF BOT'}</span>
                    </div>
                    {msg.is_broadcast && (
                      <span className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider">
                        <Megaphone className="w-3 h-3" /> Broadcast
                      </span>
                    )}
                  </div>
                )}

                {/* Optional Media Image Banner */}
                {msg.media_url && (
                  <div className="mb-3 rounded-xl overflow-hidden border border-slate-700 max-h-72 bg-black/40 flex items-center justify-center">
                    <img
                      src={msg.media_url}
                      alt="Broadcast Media"
                      className="w-full h-auto object-cover max-h-72"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Message Body */}
                {msg.text && (
                  <div className="text-slate-100 text-sm sm:text-base leading-relaxed selection:bg-cyan-500/30">
                    {formatTelegramHTML(msg.text)}
                  </div>
                )}

                {/* Embedded QR Preview if Order Info Present */}
                {msg.order_info && (
                  <div className="mt-3.5 p-3.5 bg-slate-950/90 rounded-xl border border-cyan-500/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl">
                        <QrCode className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs md:text-sm font-bold text-white">FamPay UPI Invoice</div>
                        <div className="text-xs md:text-sm text-emerald-400 font-bold">₹{msg.order_info.amount.toFixed(2)}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedQrOrder(msg.order_info)}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs md:text-sm font-bold shadow-md cursor-pointer transition"
                    >
                      Open QR
                    </button>
                  </div>
                )}

                {/* Inline Keyboards */}
                {msg.keyboard && (
                  <InlineKeyboardRenderer
                    keyboard={msg.keyboard}
                    onButtonClick={(cbData, text) => handleCallbackQuery(cbData, text)}
                  />
                )}

                {/* Message Timestamp */}
                <div className="flex items-center justify-end gap-1.5 mt-2 text-[11px] text-slate-400 select-none">
                  <span>{msg.timestamp}</span>
                  {!isBot && <CheckCheck className="w-3.5 h-3.5 text-cyan-300" />}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isBotTyping && (
          <div className="flex justify-start">
            <div className="bg-[#182533] text-slate-300 rounded-2xl rounded-tl-xs px-4 py-3 flex items-center gap-2 text-sm border border-slate-700/50 shadow-md">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse delay-150"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse delay-300"></span>
              <span className="ml-1.5 text-xs text-slate-300 font-medium">Bot is typing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Quick Action Chips Drawer */}
      {showCommandsMenu && (
        <div className="absolute bottom-16 left-3 right-3 bg-slate-900/98 backdrop-blur-md border border-slate-700 rounded-2xl p-4 shadow-2xl z-20 animate-in slide-in-from-bottom-2 duration-150 max-h-72 overflow-y-auto">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <span className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              Bot Quick Commands Menu
            </span>
            <button
              type="button"
              onClick={() => setShowCommandsMenu(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {quickCommands.map((q, idx) => {
              const IconComp = q.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    sendUserMessage(q.cmd);
                    setShowCommandsMenu(false);
                  }}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-left text-xs font-medium text-slate-200 transition active:scale-[0.98] border border-slate-700/60 cursor-pointer shadow-sm"
                >
                  <IconComp className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="truncate">
                    <span className="block text-white font-bold text-xs">{q.label}</span>
                    <span className="text-[11px] text-cyan-300/80 font-mono">{q.cmd}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-2.5 sm:p-3 md:p-4 bg-[#17212b] border-t border-slate-800 shrink-0 z-10 pb-[max(env(safe-area-inset-bottom),0.65rem)]">
        {currentFsmState && (
          <div className="mb-2 px-3 py-1.5 bg-cyan-950/90 border border-cyan-500/40 rounded-xl flex items-center justify-between text-xs text-cyan-200">
            <span className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0"></span>
              <span className="truncate">Input for: <b>{currentFsmState.replace(/_/g, ' ')}</b></span>
            </span>
            <button
              type="button"
              onClick={() => sendUserMessage('/cancel')}
              className="text-xs font-bold underline text-rose-300 hover:text-rose-200 cursor-pointer ml-2 shrink-0"
            >
              Cancel
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2 max-w-5xl mx-auto">
          {/* Commands toggle button */}
          <button
            type="button"
            onClick={() => setShowCommandsMenu(!showCommandsMenu)}
            title="Bot Commands Menu"
            className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-800 text-slate-200 hover:text-cyan-400 active:scale-95 transition cursor-pointer shrink-0 border border-slate-700/60 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText || ''}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={currentFsmState ? "Type your input here..." : "Type a message or /command..."}
            className="flex-1 bg-slate-900 text-slate-100 placeholder:text-slate-500 text-sm md:text-base px-3.5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-700/80 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition shadow-inner min-h-[44px]"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* QR Code Popup Modal */}
      {selectedQrOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm">
            <button
              type="button"
              onClick={() => setSelectedQrOrder(null)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white z-10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <FamPayModal
              orderInfo={selectedQrOrder}
              onClose={() => setSelectedQrOrder(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
