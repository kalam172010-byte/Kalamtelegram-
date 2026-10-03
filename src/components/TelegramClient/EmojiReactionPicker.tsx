import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Smile, Plus, Search, X, Sparkles, Flame, Heart, ThumbsUp, Crown, Zap } from 'lucide-react';
import { MessageReaction } from '../../types';

export const POPULAR_REACTIONS = ['👍', '❤️', '🔥', '🎉', '🤩', '👏', '😁', '⚡', '💯', '🚀', '👑', '💸'];

export const EXTENDED_EMOJI_CATEGORIES = [
  {
    id: 'popular',
    name: 'Top Telegram',
    icon: Flame,
    emojis: ['👍', '👎', '❤️', '🔥', '🎉', '🤩', '👏', '😁', '⚡', '💯', '🚀', '👑', '💸', '🥰', '😱', '🙏', '💎', '🎯']
  },
  {
    id: 'gaming',
    name: 'Game & Store',
    icon: Zap,
    emojis: ['🎮', '🕹️', '⚡', '👑', '🏆', '🛒', '💳', '💰', '🪙', '🛡️', '🎯', '🎲', '🎰', '🎳', '🏀', '⚽', '🔑', '🏷️']
  },
  {
    id: 'faces',
    name: 'Faces & Expressions',
    icon: Smile,
    emojis: ['😍', '🥳', '😎', '🤔', '🤫', '🫡', '😇', '😈', '🤖', '😴', '🤯', '🥶', '🥵', '👻', '🤡', '💩', '😹', '🤤']
  },
  {
    id: 'symbols',
    name: 'Symbols & Magic',
    icon: Sparkles,
    emojis: ['⭐', '🌟', '✨', '💫', '💎', '🔥', '💥', '🚀', '🤝', '🙌', '✌️', '🤞', '💪', '👀', '💯', '✅', '❤️‍🔥', '⚡']
  }
];

interface EmojiReactionPickerProps {
  messageId: string;
  isBot: boolean;
  reactions?: MessageReaction[];
  onSelectReaction: (emoji: string) => void;
  align?: 'left' | 'right';
}

export const EmojiReactionPicker: React.FC<EmojiReactionPickerProps> = ({
  messageId,
  isBot,
  reactions = [],
  onSelectReaction,
  align = isBot ? 'left' : 'right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('popular');
  const [flyingEmoji, setFlyingEmoji] = useState<{ id: number; emoji: string; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowFullPicker(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const handlePickEmoji = (emoji: string, e?: React.MouseEvent) => {
    onSelectReaction(emoji);

    // Trigger visual celebration for high-energy reactions
    if (['🔥', '🎉', '⚡', '💯', '👑', '💎', '🚀', '❤️'].includes(emoji)) {
      try {
        confetti({
          particleCount: 20,
          spread: 45,
          origin: { y: 0.8 },
          colors: ['#0088cc', '#22d3ee', '#fbbf24', '#f43f5e']
        });
      } catch {}
    }

    // Spawn animated floating emoji particle
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      setFlyingEmoji({
        id: Date.now(),
        emoji,
        x: rect.left + rect.width / 2,
        y: rect.top
      });
      setTimeout(() => setFlyingEmoji(null), 900);
    }

    setIsOpen(false);
    setShowFullPicker(false);
    setSearchQuery('');
  };

  // Filter emojis if search is active
  const filteredEmojis = searchQuery.trim()
    ? EXTENDED_EMOJI_CATEGORIES.flatMap(c => c.emojis).filter((emoji, idx, self) => self.indexOf(emoji) === idx)
    : EXTENDED_EMOJI_CATEGORIES.find(c => c.id === activeTab)?.emojis || POPULAR_REACTIONS;

  return (
    <div ref={containerRef} className="relative inline-block select-none">
      {/* Reaction Badges Container below message */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        {reactions.map((r) => {
          const isUserReacted = r.userReacted;
          return (
            <motion.button
              key={`${r.emoji}-${messageId}`}
              type="button"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={(e) => handlePickEmoji(r.emoji, e)}
              className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm ${
                isUserReacted
                  ? 'bg-gradient-to-r from-cyan-600/50 to-blue-600/50 border border-cyan-400/80 text-cyan-200 ring-2 ring-cyan-500/30'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 text-slate-300'
              }`}
              title={isUserReacted ? `You reacted with ${r.emoji} (click to remove)` : `React with ${r.emoji}`}
            >
              <span className="text-sm transition-transform group-hover:scale-125">{r.emoji}</span>
              <span className={`text-[11px] font-mono ${isUserReacted ? 'text-white font-extrabold' : 'text-slate-400'}`}>
                {r.count}
              </span>
              {isUserReacted && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              )}
            </motion.button>
          );
        })}

        {/* Add Reaction Button trigger on existing badge list */}
        {reactions.length > 0 && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-800/70 hover:bg-slate-700 border border-slate-600/40 text-slate-400 hover:text-cyan-300 transition cursor-pointer text-xs"
            title="Add reaction"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Floating Hover Trigger Button (appears beside message) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity absolute -top-3.5 right-2 p-1.5 rounded-full bg-slate-900/95 border border-cyan-500/40 text-slate-300 hover:text-cyan-300 hover:scale-110 shadow-xl cursor-pointer backdrop-blur z-20"
        title="Add Telegram Reaction"
      >
        <Smile className="w-4 h-4" />
      </button>

      {/* Floating Interactive Reaction Picker Bubble */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 8 }}
            transition={{ type: 'spring', stiffness: 450, damping: 25 }}
            className={`absolute z-40 bottom-full mb-2 ${
              align === 'right' ? 'right-0' : 'left-0'
            } bg-slate-900/98 backdrop-blur-xl border border-cyan-500/40 rounded-2xl shadow-2xl shadow-black/70 p-2.5 min-w-[280px] max-w-[340px] animate-in`}
          >
            {/* Quick Telegram Reaction Bar */}
            {!showFullPicker ? (
              <div>
                <div className="flex items-center justify-between gap-1 mb-2 px-1">
                  <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-cyan-400" /> Reactions
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowFullPicker(true)}
                      className="text-[11px] font-bold text-cyan-300 hover:text-white px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/30 flex items-center gap-1 hover:bg-cyan-900/60 transition cursor-pointer"
                    >
                      <span>More</span>
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="text-slate-400 hover:text-white p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Quick 12 Popular Emojis Grid */}
                <div className="grid grid-cols-6 gap-1.5">
                  {POPULAR_REACTIONS.map((emoji) => (
                    <motion.button
                      key={emoji}
                      type="button"
                      whileHover={{ scale: 1.35, y: -4 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => handlePickEmoji(emoji, e)}
                      className="w-10 h-10 flex items-center justify-center text-xl rounded-xl hover:bg-slate-800/90 active:bg-cyan-950 transition cursor-pointer border border-transparent hover:border-cyan-500/40"
                    >
                      <span>{emoji}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              /* Full Extended Emoji Catalog Drawer */
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Telegram Reaction Palette</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFullPicker(false)}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search reactions..."
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Category Tabs */}
                {!searchQuery && (
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                    {EXTENDED_EMOJI_CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      const isActive = activeTab === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setActiveTab(cat.id)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 whitespace-nowrap transition cursor-pointer ${
                            isActive
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Emoji Grid */}
                <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                  {filteredEmojis.map((emoji, idx) => (
                    <motion.button
                      key={`${emoji}-${idx}`}
                      type="button"
                      whileHover={{ scale: 1.3, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => handlePickEmoji(emoji, e)}
                      className="w-9 h-9 flex items-center justify-center text-lg rounded-xl hover:bg-slate-800 active:bg-cyan-950 transition cursor-pointer border border-transparent hover:border-cyan-500/30"
                    >
                      <span>{emoji}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating flying emoji animation portal */}
      {flyingEmoji && (
        <motion.div
          initial={{ opacity: 1, y: 0, scale: 1 }}
          animate={{ opacity: 0, y: -70, scale: 1.8 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="fixed pointer-events-none z-50 text-2xl"
          style={{ left: flyingEmoji.x, top: flyingEmoji.y }}
        >
          {flyingEmoji.emoji}
        </motion.div>
      )}
    </div>
  );
};
