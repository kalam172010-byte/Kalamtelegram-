import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Key, Download, Play, Send, Sparkles, ShieldCheck } from 'lucide-react';

// Custom icons mapping for Telegram emoji tags
export const EMOJI_ICON_LOOKUP: Record<string, { symbol: string; label: string; bg: string }> = {
  '6163205892834598715': { symbol: '🛒', label: 'Store', bg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
  '5258011929993026890': { symbol: '👤', label: 'Profile', bg: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  '5985630530111020079': { symbol: '💳', label: 'Add Balance', bg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
  '6032594876506312598': { symbol: '📜', label: 'History', bg: 'bg-purple-500/20 text-purple-400 border border-purple-500/30' },
  '5967280668885913944': { symbol: '🎧', label: 'Support', bg: 'bg-rose-500/20 text-rose-400 border border-rose-500/30' },
  '5877536313623711363': { symbol: '🔙', label: 'Back', bg: 'bg-slate-700 text-slate-300 border border-slate-600' },
  '5807750375033278838': { symbol: '⚡', label: 'UPI', bg: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' },
  '5886505193180239900': { symbol: '👑', label: 'Reseller', bg: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
  '6005986106703613755': { symbol: '📺', label: 'Tutorial', bg: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' },
  '5875465628285931233': { symbol: '✈️', label: 'Telegram', bg: 'bg-sky-500/20 text-sky-400 border border-sky-500/30' },
  '5954224165874569584': { symbol: '💬', label: 'WhatsApp', bg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
  '5994502837327892086': { symbol: '👋', label: 'Welcome', bg: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' },
  '5206607081334906820': { symbol: '🌟', label: 'VIP', bg: 'bg-amber-500/30 text-amber-300 border border-amber-500/40' },
  '6161172706856282588': { symbol: '🤖', label: 'Android Non-Root', bg: 'bg-teal-500/20 text-teal-300 border border-teal-500/30' },
  '6161449831031118974': { symbol: '⚡', label: 'Android Root', bg: 'bg-red-500/20 text-red-300 border border-red-500/30' },
  '5350554349074391003': { symbol: '💻', label: 'PC Panel', bg: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
  '5474625972751837256': { symbol: '🆔', label: 'Grid ID', bg: 'bg-slate-700 text-slate-300 border border-slate-600' },
  '5215399540814781035': { symbol: '📛', label: 'Name', bg: 'bg-slate-700 text-slate-300 border border-slate-600' },
  '6129584162992034014': { symbol: '🔰', label: 'Level', bg: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' },
  '5904630315946611415': { symbol: '👤', label: 'User', bg: 'bg-slate-700 text-slate-300 border border-slate-600' },
  '6210859306602995217': { symbol: '💼', label: 'Wallet', bg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
  '5316711376876485361': { symbol: '💰', label: 'Balance', bg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
  '6161437856662298090': { symbol: '📊', label: 'Stats', bg: 'bg-purple-500/20 text-purple-300 border border-purple-500/30' },
  '6160968017304888311': { symbol: '📦', label: 'Orders', bg: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
  '5197503331215361533': { symbol: '💸', label: 'Spent', bg: 'bg-rose-500/20 text-rose-300 border border-rose-500/30' },
  '5433614043006903194': { symbol: '📅', label: 'Joined', bg: 'bg-slate-700 text-slate-300 border border-slate-600' },
  '6037421444789440735': { symbol: 'ℹ️', label: 'Info', bg: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' },
  '6161241250239356403': { symbol: '✅', label: 'Check', bg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
  '6086672466132865380': { symbol: '🛡️', label: 'Shield', bg: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
  '5890848474563352982': { symbol: '💎', label: 'Money', bg: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
  '5377624166436445368': { symbol: '🎟️', label: 'Redeem', bg: 'bg-pink-500/20 text-pink-300 border border-pink-500/30' },
  '5305699699204837855': { symbol: '👛', label: 'Wallet Right', bg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
  '6161302621027049305': { symbol: '👇', label: 'Point Down', bg: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' },
};

export const CodeSnippet: React.FC<{ codeText: string }> = ({ codeText }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(codeText.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLongKey = codeText.length > 8 && !codeText.includes(' ') && !codeText.startsWith('http');

  if (isLongKey) {
    return (
      <div
        onClick={handleCopy}
        title="Click to copy license key"
        className="my-1.5 p-2.5 rounded-xl bg-gradient-to-r from-cyan-950/80 via-blue-950/80 to-slate-900 border-2 border-cyan-400/80 shadow-lg shadow-cyan-950/50 flex items-center justify-between gap-2 cursor-pointer hover:border-cyan-300 hover:shadow-cyan-500/20 transition-all select-all group ring-1 ring-cyan-500/30"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-300 group-hover:scale-110 transition shrink-0">
            <Key className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="font-mono font-bold text-sm md:text-base text-cyan-200 tracking-wider truncate">
            {codeText}
          </span>
        </div>
        <div className="shrink-0 flex items-center gap-1 bg-cyan-500/20 group-hover:bg-cyan-500/40 text-cyan-300 border border-cyan-400/50 px-2.5 py-1 rounded-lg text-xs font-bold transition">
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-bold">COPIED!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-cyan-300" />
              <span>COPY</span>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <span
      onClick={handleCopy}
      title="Click to copy"
      className="inline-flex items-center gap-1.5 px-2 py-0.5 my-0.5 font-mono text-xs md:text-sm bg-slate-900/90 text-cyan-300 border border-cyan-500/40 rounded-lg cursor-pointer hover:bg-slate-800 hover:border-cyan-300 transition-all select-all group shadow-inner ring-1 ring-cyan-500/20"
    >
      <span className="break-all">{codeText}</span>
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-cyan-400/60 group-hover:text-cyan-300 shrink-0" />
      )}
    </span>
  );
};

export const TgEmojiBadge: React.FC<{ emojiId: string; defaultChar?: string }> = ({ emojiId, defaultChar }) => {
  const found = EMOJI_ICON_LOOKUP[emojiId];
  if (found) {
    return (
      <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-xs font-semibold mx-0.5 align-middle ${found.bg}`}>
        <span className="mr-0.5">{found.symbol}</span>
      </span>
    );
  }
  return <span className="inline-block text-amber-400 mx-0.5">{defaultChar || '✨'}</span>;
};

/**
 * Rich Blockquote Card with vibrant themed neon glass styling for Key Delivery, APK Downloads, Official Channels, and Tutorials
 */
export const RichBlockquoteCard: React.FC<{ rawContent: string }> = ({ rawContent }) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const lower = rawContent.toLowerCase();

  // 1. License Key Delivery Box
  if (lower.includes('license key') || lower.includes('your license') || lower.includes('key (tap to copy)') || lower.includes('🔑')) {
    // Extract key if in code or text
    const keyMatch = rawContent.match(/<code>([\s\S]*?)<\/code>/i) || rawContent.match(/<pre><code>([\s\S]*?)<\/code><\/pre>/i);
    const keyString = keyMatch ? keyMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    const handleCopyKey = () => {
      if (keyString) {
        navigator.clipboard.writeText(keyString);
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
      }
    };

    return (
      <div className="my-2.5 rounded-2xl p-3.5 sm:p-4 bg-gradient-to-br from-cyan-950/90 via-slate-900 to-indigo-950/90 border-2 border-cyan-400 shadow-xl shadow-cyan-950/50 ring-2 ring-cyan-500/30">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-cyan-500/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              <Key className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="font-extrabold text-xs sm:text-sm text-cyan-300 uppercase tracking-wider">
              🔑 YOUR DELIVERED LICENSE KEY
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold uppercase animate-pulse">
            Active
          </span>
        </div>

        {keyString && (
          <div
            onClick={handleCopyKey}
            className="my-2 p-3 rounded-xl bg-slate-950 border border-cyan-400/80 flex items-center justify-between gap-2 cursor-pointer hover:bg-cyan-950/40 hover:border-cyan-300 transition-all group shadow-inner"
          >
            <span className="font-mono font-black text-sm sm:text-base text-cyan-100 tracking-wider break-all select-all">
              {keyString}
            </span>
            <button
              type="button"
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow transition cursor-pointer"
            >
              {copiedKey ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>COPIED!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-white" />
                  <span>TAP TO COPY</span>
                </>
              )}
            </button>
          </div>
        )}

        <p className="text-[11px] sm:text-xs text-cyan-300/80 flex items-center gap-1 mt-1">
          <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
          <span>Tap above to copy key directly into clipboard. Ready to use in loader!</span>
        </p>
      </div>
    );
  }

  // 2. APK Download / Loader Link Box
  if (lower.includes('download apk') || lower.includes('apk / loader') || lower.includes('📥')) {
    const urlMatch = rawContent.match(/href="([^"]+)"/i) || rawContent.match(/(https?:\/\/[^\s<]+)/i);
    const downloadUrl = urlMatch ? urlMatch[1] : '';

    return (
      <div className="my-2.5 rounded-2xl p-3.5 sm:p-4 bg-gradient-to-br from-emerald-950/90 via-slate-900 to-teal-950/90 border-2 border-emerald-400 shadow-xl shadow-emerald-950/50 ring-2 ring-emerald-500/30">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-500/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <Download className="w-4 h-4 text-emerald-400 animate-bounce" />
            </div>
            <span className="font-extrabold text-xs sm:text-sm text-emerald-300 uppercase tracking-wider">
              📥 APK / LOADER DOWNLOAD
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold uppercase">
            100% Anti-Ban
          </span>
        </div>

        <p className="text-xs text-slate-300 mb-2.5">
          Download the latest official panel APK, loader, and injector files directly below:
        </p>

        {downloadUrl && (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition active:scale-[0.98] border border-emerald-300/40"
          >
            <Download className="w-4 h-4 text-white shrink-0" />
            <span>🚀 CLICK HERE TO DOWNLOAD APK 🚀</span>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
          </a>
        )}

        {downloadUrl && (
          <div className="mt-2 text-[11px] font-mono text-emerald-300/80 truncate">
            Link: {downloadUrl}
          </div>
        )}
      </div>
    );
  }

  // 3. Official Channel & Community Box
  if (lower.includes('official channel') || lower.includes('news channel') || lower.includes('📢')) {
    const urlMatch = rawContent.match(/href="([^"]+)"/i) || rawContent.match(/(https?:\/\/[^\s<]+)/i);
    const channelUrl = urlMatch ? urlMatch[1] : '';

    return (
      <div className="my-2.5 rounded-2xl p-3.5 sm:p-4 bg-gradient-to-br from-sky-950/90 via-slate-900 to-blue-950/90 border-2 border-sky-400 shadow-xl shadow-sky-950/50 ring-2 ring-sky-500/30">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-sky-500/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/40">
              <Send className="w-4 h-4 text-sky-400" />
            </div>
            <span className="font-extrabold text-xs sm:text-sm text-sky-300 uppercase tracking-wider">
              📢 OFFICIAL TELEGRAM CHANNEL
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-extrabold uppercase">
            Verified
          </span>
        </div>

        <p className="text-xs text-slate-300 mb-2.5">
          Join for key giveaways, update announcements, and VIP bypass patches:
        </p>

        {channelUrl && (
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-sky-950/60 transition active:scale-[0.98] border border-sky-300/40"
          >
            <Send className="w-4 h-4 text-white shrink-0" />
            <span>📢 JOIN OFFICIAL CHANNEL</span>
            <ExternalLink className="w-3.5 h-3.5 text-sky-200 shrink-0" />
          </a>
        )}
      </div>
    );
  }

  // 4. Tutorial & Setup Video Guide Box
  if (lower.includes('tutorial') || lower.includes('setup guide') || lower.includes('video') || lower.includes('🎥') || lower.includes('📖')) {
    const urlMatch = rawContent.match(/href="([^"]+)"/i) || rawContent.match(/(https?:\/\/[^\s<]+)/i);
    const videoUrl = urlMatch ? urlMatch[1] : '';

    return (
      <div className="my-2.5 rounded-2xl p-3.5 sm:p-4 bg-gradient-to-br from-purple-950/90 via-slate-900 to-violet-950/90 border-2 border-purple-400 shadow-xl shadow-purple-950/50 ring-2 ring-purple-500/30">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-purple-500/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40">
              <Play className="w-4 h-4 text-purple-400" />
            </div>
            <span className="font-extrabold text-xs sm:text-sm text-purple-300 uppercase tracking-wider">
              🎥 VIDEO SETUP & INSTALLATION GUIDE
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-extrabold uppercase">
            Step-by-Step
          </span>
        </div>

        <p className="text-xs text-slate-300 mb-2.5">
          Watch complete step-by-step video on how to inject and play safely:
        </p>

        {videoUrl && (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 hover:from-purple-500 hover:to-violet-500 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-purple-950/60 transition active:scale-[0.98] border border-purple-300/40"
          >
            <Play className="w-4 h-4 text-white fill-white shrink-0" />
            <span>🎥 WATCH FULL SETUP VIDEO 🎥</span>
            <ExternalLink className="w-3.5 h-3.5 text-purple-200 shrink-0" />
          </a>
        )}
      </div>
    );
  }

  // 5. Default Styled Blockquote
  return (
    <div className="my-2 p-3.5 rounded-xl bg-slate-900/90 border-l-4 border-cyan-400 border border-slate-700/60 text-slate-200 shadow-lg">
      <div className="space-y-1">
        {formatTelegramHTML(rawContent.replace(/<\/?blockquote>/gi, ''))}
      </div>
    </div>
  );
};

/**
 * Parses Telegram HTML string (blockquote, pre, b, i, u, s, code, a, tg-emoji) into structured React nodes.
 */
export function formatTelegramHTML(html: string): React.ReactNode {
  if (!html || typeof html !== 'string') return null;

  try {
    // Check if entire text or sections contain <blockquote> tags
    if (html.includes('<blockquote>') || html.includes('&lt;blockquote&gt;')) {
      const bqRegex = /<blockquote>([\s\S]*?)<\/blockquote>/gi;
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      let partKey = 0;

      while ((match = bqRegex.exec(html)) !== null) {
        const textBefore = html.substring(lastIndex, match.index);
        if (textBefore.trim()) {
          parts.push(
            <div key={`txt-before-${partKey++}`} className="space-y-1">
              {renderPlainLines(textBefore)}
            </div>
          );
        }

        const bqContent = match[1];
        parts.push(
          <RichBlockquoteCard key={`bq-card-${partKey++}`} rawContent={bqContent} />
        );

        lastIndex = bqRegex.lastIndex;
      }

      const remaining = html.substring(lastIndex);
      if (remaining.trim()) {
        parts.push(
          <div key={`txt-end-${partKey++}`} className="space-y-1">
            {renderPlainLines(remaining)}
          </div>
        );
      }

      return <div className="space-y-1.5 text-sm md:text-[15px] leading-relaxed break-words">{parts}</div>;
    }

    return renderPlainLines(html);
  } catch {
    return <span className="text-slate-100">{String(html)}</span>;
  }
}

function renderPlainLines(html: string): React.ReactNode {
  const lines = html.split('\n');
  return (
    <div className="space-y-1 text-sm md:text-[15px] leading-relaxed break-words">
      {lines.map((line, lineIdx) => {
        if (!line || !line.trim()) {
          return <div key={lineIdx} className="h-1.5" />;
        }
        return (
          <div key={lineIdx} className="min-h-[1.25rem]">
            {parseTelegramLine(line, lineIdx)}
          </div>
        );
      })}
    </div>
  );
}

function parseTelegramLine(line: string, lineKey: number): React.ReactNode[] {
  if (!line || typeof line !== 'string') return [];
  // Regex to match Telegram HTML tags
  const tagRegex = /(<tg-emoji\s+emoji-id="([^"]+)">([^<]*)<\/tg-emoji>|<pre><code>([\s\S]*?)<\/code><\/pre>|<code>([\s\S]*?)<\/code>|<b>([\s\S]*?)<\/b>|<i>([\s\S]*?)<\/i>|<u>([\s\S]*?)<\/u>|<s>([\s\S]*?)<\/s>|<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>)/g;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyCounter = 0;

  while ((match = tagRegex.exec(line)) !== null) {
    const textBefore = line.substring(lastIndex, match.index);
    if (textBefore) {
      elements.push(<span key={`${lineKey}-txt-${keyCounter++}`}>{textBefore}</span>);
    }

    const [
      fullMatch,
      tgEmojiFull, emojiId, emojiInner,
      preCodeContent,
      codeContent,
      boldContent,
      italicContent,
      underlineContent,
      strikeContent,
      linkHref, linkText
    ] = match;

    if (tgEmojiFull && emojiId) {
      elements.push(<TgEmojiBadge key={`${lineKey}-emoji-${keyCounter++}`} emojiId={emojiId} defaultChar={emojiInner} />);
    } else if (preCodeContent !== undefined) {
      elements.push(<CodeSnippet key={`${lineKey}-precode-${keyCounter++}`} codeText={preCodeContent} />);
    } else if (codeContent !== undefined) {
      elements.push(<CodeSnippet key={`${lineKey}-code-${keyCounter++}`} codeText={codeContent} />);
    } else if (boldContent !== undefined) {
      elements.push(
        <b key={`${lineKey}-b-${keyCounter++}`} className="font-bold text-white tracking-wide">
          {parseTelegramLine(boldContent, lineKey * 100 + keyCounter)}
        </b>
      );
    } else if (italicContent !== undefined) {
      elements.push(
        <i key={`${lineKey}-i-${keyCounter++}`} className="italic text-slate-300">
          {parseTelegramLine(italicContent, lineKey * 100 + keyCounter)}
        </i>
      );
    } else if (underlineContent !== undefined) {
      elements.push(
        <u key={`${lineKey}-u-${keyCounter++}`} className="underline decoration-cyan-400 underline-offset-2 font-semibold text-cyan-200">
          {parseTelegramLine(underlineContent, lineKey * 100 + keyCounter)}
        </u>
      );
    } else if (strikeContent !== undefined) {
      elements.push(
        <s key={`${lineKey}-s-${keyCounter++}`} className="line-through text-slate-400">
          {parseTelegramLine(strikeContent, lineKey * 100 + keyCounter)}
        </s>
      );
    } else if (linkHref !== undefined) {
      elements.push(
        <a
          key={`${lineKey}-a-${keyCounter++}`}
          href={linkHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline font-semibold transition"
        >
          <span>{linkText || linkHref}</span>
          <ExternalLink className="w-3.5 h-3.5 inline shrink-0" />
        </a>
      );
    }

    lastIndex = tagRegex.lastIndex;
  }

  const remaining = line.substring(lastIndex);
  if (remaining) {
    elements.push(<span key={`${lineKey}-end-${keyCounter++}`}>{remaining}</span>);
  }

  return elements.length > 0 ? elements : [<span key={lineKey}>{line}</span>];
}
