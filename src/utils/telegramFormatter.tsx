import React, { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

// Custom icons mapping for Telegram emoji tags
export const EMOJI_ICON_LOOKUP: Record<string, { symbol: string; label: string; bg: string }> = {
  '6163205892834598715': { symbol: '🛒', label: 'Store', bg: 'bg-emerald-500/20 text-emerald-400' },
  '5258011929993026890': { symbol: '👤', label: 'Profile', bg: 'bg-blue-500/20 text-blue-400' },
  '5985630530111020079': { symbol: '💳', label: 'Add Balance', bg: 'bg-amber-500/20 text-amber-400' },
  '6032594876506312598': { symbol: '📜', label: 'History', bg: 'bg-purple-500/20 text-purple-400' },
  '5967280668885913944': { symbol: '🎧', label: 'Support', bg: 'bg-rose-500/20 text-rose-400' },
  '5877536313623711363': { symbol: '🔙', label: 'Back', bg: 'bg-slate-700 text-slate-300' },
  '5807750375033278838': { symbol: '⚡', label: 'UPI', bg: 'bg-cyan-500/20 text-cyan-400' },
  '5886505193180239900': { symbol: '👑', label: 'Reseller', bg: 'bg-amber-500/20 text-amber-300' },
  '6005986106703613755': { symbol: '📺', label: 'Tutorial', bg: 'bg-indigo-500/20 text-indigo-400' },
  '5875465628285931233': { symbol: '✈️', label: 'Telegram', bg: 'bg-sky-500/20 text-sky-400' },
  '5954224165874569584': { symbol: '💬', label: 'WhatsApp', bg: 'bg-emerald-500/20 text-emerald-400' },
  '5994502837327892086': { symbol: '👋', label: 'Welcome', bg: 'bg-yellow-500/20 text-yellow-300' },
  '5206607081334906820': { symbol: '🌟', label: 'VIP', bg: 'bg-amber-500/30 text-amber-300' },
  '6161172706856282588': { symbol: '🤖', label: 'Android Non-Root', bg: 'bg-teal-500/20 text-teal-300' },
  '6161449831031118974': { symbol: '⚡', label: 'Android Root', bg: 'bg-red-500/20 text-red-300' },
  '5350554349074391003': { symbol: '💻', label: 'PC Panel', bg: 'bg-blue-500/20 text-blue-300' },
  '5474625972751837256': { symbol: '🆔', label: 'Grid ID', bg: 'bg-slate-700 text-slate-300' },
  '5215399540814781035': { symbol: '📛', label: 'Name', bg: 'bg-slate-700 text-slate-300' },
  '6129584162992034014': { symbol: '🔰', label: 'Level', bg: 'bg-indigo-500/20 text-indigo-300' },
  '5904630315946611415': { symbol: '👤', label: 'User', bg: 'bg-slate-700 text-slate-300' },
  '6210859306602995217': { symbol: '💼', label: 'Wallet', bg: 'bg-emerald-500/20 text-emerald-300' },
  '5316711376876485361': { symbol: '💰', label: 'Balance', bg: 'bg-emerald-500/20 text-emerald-300' },
  '6161437856662298090': { symbol: '📊', label: 'Stats', bg: 'bg-purple-500/20 text-purple-300' },
  '6160968017304888311': { symbol: '📦', label: 'Orders', bg: 'bg-blue-500/20 text-blue-300' },
  '5197503331215361533': { symbol: '💸', label: 'Spent', bg: 'bg-rose-500/20 text-rose-300' },
  '5433614043006903194': { symbol: '📅', label: 'Joined', bg: 'bg-slate-700 text-slate-300' },
  '6037421444789440735': { symbol: 'ℹ️', label: 'Info', bg: 'bg-cyan-500/20 text-cyan-300' },
  '6161241250239356403': { symbol: '✅', label: 'Check', bg: 'bg-emerald-500/20 text-emerald-300' },
  '6086672466132865380': { symbol: '🛡️', label: 'Shield', bg: 'bg-blue-500/20 text-blue-300' },
  '5890848474563352982': { symbol: '💎', label: 'Money', bg: 'bg-amber-500/20 text-amber-300' },
  '5377624166436445368': { symbol: '🎟️', label: 'Redeem', bg: 'bg-pink-500/20 text-pink-300' },
  '5305699699204837855': { symbol: '👛', label: 'Wallet Right', bg: 'bg-emerald-500/20 text-emerald-300' },
  '6161302621027049305': { symbol: '👇', label: 'Point Down', bg: 'bg-yellow-500/20 text-yellow-300' },
};

export const CodeSnippet: React.FC<{ codeText: string }> = ({ codeText }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span
      onClick={handleCopy}
      title="Click to copy key/code"
      className="inline-flex items-center gap-1.5 px-2 py-0.5 my-0.5 font-mono text-xs md:text-sm bg-slate-900/90 text-cyan-300 border border-cyan-500/30 rounded cursor-pointer hover:bg-slate-800 hover:border-cyan-400 transition-all select-all group shadow-inner"
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
 * Parses Telegram HTML string (b, i, u, s, code, a, tg-emoji) into structured React nodes.
 */
export function formatTelegramHTML(html: string): React.ReactNode {
  if (!html || typeof html !== 'string') return null;

  try {
    // Split lines
    const lines = html.split('\n');

    return (
      <div className="space-y-1 text-sm md:text-[15px] leading-relaxed break-words">
        {lines.map((line, lineIdx) => {
          if (!line || !line.trim()) {
            return <div key={lineIdx} className="h-2" />;
          }
          return (
            <div key={lineIdx} className="min-h-[1.25rem]">
              {parseTelegramLine(line, lineIdx)}
            </div>
          );
        })}
      </div>
    );
  } catch {
    return <span className="text-slate-100">{String(html)}</span>;
  }
}

function parseTelegramLine(line: string, lineKey: number): React.ReactNode[] {
  if (!line || typeof line !== 'string') return [];
  // Regex to match Telegram HTML tags
  const tagRegex = /(<tg-emoji\s+emoji-id="([^"]+)">([^<]*)<\/tg-emoji>|<code>([\s\S]*?)<\/code>|<b>([\s\S]*?)<\/b>|<i>([\s\S]*?)<\/i>|<u>([\s\S]*?)<\/u>|<s>([\s\S]*?)<\/s>|<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>)/g;

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
      codeContent,
      boldContent,
      italicContent,
      underlineContent,
      strikeContent,
      linkHref, linkText
    ] = match;

    if (tgEmojiFull && emojiId) {
      elements.push(<TgEmojiBadge key={`${lineKey}-emoji-${keyCounter++}`} emojiId={emojiId} defaultChar={emojiInner} />);
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
        <u key={`${lineKey}-u-${keyCounter++}`} className="underline decoration-cyan-400 underline-offset-2">
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
          className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline font-medium"
        >
          <span>{linkText || linkHref}</span>
          <ExternalLink className="w-3 h-3 inline" />
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
