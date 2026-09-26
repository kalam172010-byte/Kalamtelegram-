/**
 * Universal Plan Duration Parser & Sorter
 * Accurately parses hours, days, weeks, months, years, and lifetime durations
 * to guarantee that plans are ALWAYS displayed in strict chronological order
 * (e.g., 1 Day -> 2 Days -> 3 Days -> 7 Days -> 15 Days -> 30 Days -> Lifetime),
 * regardless of the order in which they were added or collapsed.
 */

export function getDurationMinutes(validityOrName?: string | null, price: number = 0): number {
  if (!validityOrName) return price > 0 ? price : 99999999;
  const str = String(validityOrName).toLowerCase().trim();

  // 1. Lifetime / Permanent / Unlimited
  if (str.includes('life') || str.includes('perm') || str.includes('unlimit') || str.includes('always')) {
    return 1000000000 + (price || 0);
  }

  // 2. Hours: "1 hour", "2 hrs", "24h", "hour 1", "6 hrs"
  const hrMatch = str.match(/(\d+)\s*(?:hour|hours|hr|hrs|h\b)/i) || str.match(/hour\s*(\d+)/i);
  if (hrMatch) {
    return parseInt(hrMatch[1], 10) * 60;
  }

  // 3. Days: "1 day", "7 days", "15d", "day 1", "day 2", "day 30", "1d"
  const dayPrefixMatch = str.match(/day\s*(\d+)/i);
  if (dayPrefixMatch) {
    return parseInt(dayPrefixMatch[1], 10) * 1440;
  }
  const daySuffixMatch = str.match(/(\d+)\s*(?:day|days|d\b)/i);
  if (daySuffixMatch) {
    return parseInt(daySuffixMatch[1], 10) * 1440;
  }

  // 4. Weeks: "1 week", "2 weeks", "1w"
  const weekMatch = str.match(/(\d+)\s*(?:week|weeks|wk|wks|w\b)/i);
  if (weekMatch) {
    return parseInt(weekMatch[1], 10) * 7 * 1440;
  }

  // 5. Months: "1 month", "2 months", "1 mon", "1m"
  const monthMatch = str.match(/(\d+)\s*(?:month|months|mon|mo\b)/i);
  if (monthMatch) {
    return parseInt(monthMatch[1], 10) * 30 * 1440;
  }

  // 6. Years: "1 year", "2 years", "1 yr", "1y"
  const yearMatch = str.match(/(\d+)\s*(?:year|years|yr|yrs|y\b)/i);
  if (yearMatch) {
    return parseInt(yearMatch[1], 10) * 365 * 1440;
  }

  // 7. Generic number standalone: e.g. "1", "2", "7", "30"
  const rawNum = str.match(/(\d+)/);
  if (rawNum) {
    const val = parseInt(rawNum[1], 10);
    return val * 1440;
  }

  // 8. Fallback to price ascending
  return 500000000 + (price || 0);
}

/**
 * Sorts any array of products or plan objects by duration ascending.
 * Ties are broken by price_inr ascending.
 */
export function sortProductsByDuration<T extends { validity?: string; name?: string; price_inr?: number }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const weightA = getDurationMinutes(a.validity || a.name, a.price_inr || 0);
    const weightB = getDurationMinutes(b.validity || b.name, b.price_inr || 0);
    if (weightA !== weightB) {
      return weightA - weightB;
    }
    return (a.price_inr || 0) - (b.price_inr || 0);
  });
}

export function normalizeCategoryName(str?: string): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function isCategoryMatch(prodCategory?: string, targetCategory?: string): boolean {
  if (!targetCategory || !prodCategory) return false;
  const p = (prodCategory || '').trim().toLowerCase();
  const t = (targetCategory || '').trim().toLowerCase();
  if (p === t) return true;

  const pNorm = normalizeCategoryName(p);
  const tNorm = normalizeCategoryName(t);
  if (!pNorm || !tNorm) return false;
  if (pNorm === tNorm) return true;

  // Strict non-root vs root separation
  const isNonRootP = pNorm.includes('nonroot') || (pNorm.includes('non') && pNorm.includes('root'));
  const isNonRootT = tNorm.includes('nonroot') || (tNorm.includes('non') && tNorm.includes('root')) || tNorm === 'catnonroot' || tNorm === 'nonroot';
  if (isNonRootP || isNonRootT) {
    return Boolean(isNonRootP && isNonRootT);
  }

  // Strict root separation (pure root, NOT non-root)
  const isRootP = pNorm.includes('root') && !pNorm.includes('non');
  const isRootT = (tNorm.includes('root') && !tNorm.includes('non')) || tNorm === 'catroot' || tNorm === 'root';
  if (isRootP || isRootT) {
    return Boolean(isRootP && isRootT);
  }

  // Strict PC / Emulator separation
  const isPcP = pNorm.includes('pc') || pNorm.includes('emulator') || pNorm.includes('windows');
  const isPcT = tNorm.includes('pc') || tNorm.includes('emulator') || tNorm.includes('windows') || tNorm === 'catpc';
  if (isPcP || isPcT) {
    return Boolean(isPcP && isPcT);
  }

  // Custom categories must match exact normalized names
  return pNorm === tNorm;
}

export function getCanonicalCategory(catStr?: string): string {
  if (!catStr) return 'ANDROID NON ROOT PANEL';
  const c = catStr.trim();
  if (isCategoryMatch(c, 'nonroot')) return 'ANDROID NON ROOT PANEL';
  if (isCategoryMatch(c, 'root')) return 'ANDROID ROOT PANEL';
  if (isCategoryMatch(c, 'pc')) return 'PC PANEL';
  if (isCategoryMatch(c, 'ios')) return 'IOS / IPA PANEL';
  const upper = c.toUpperCase();
  if (upper === 'ALL' || upper === 'ALL PRODUCTS' || upper === 'ALL PANELS') {
    return 'ANDROID NON ROOT PANEL';
  }
  return upper;
}

export function getCanonicalPanelName(prod?: { panel_name?: string; name?: string }): string {
  if (!prod) return 'VIP PANEL';
  const rawPanel = (prod.panel_name || '').trim();
  const rawName = (prod.name || '').trim();

  const durationKeywords = [
    '1 day', '2 days', '3 days', '7 days', '15 days', '30 days', 
    'lifetime', '1 month', '2 months', '3 months', '1 year', 
    '1 hour', '2 hours', '3 hours', '5 hours', '6 hours', '12 hours', 'plan'
  ];

  if (rawPanel && !durationKeywords.includes(rawPanel.toLowerCase())) {
    return rawPanel;
  }

  if (rawName.includes(' - ')) {
    return rawName.split(' - ')[0].trim();
  }

  if (rawPanel) return rawPanel;
  return rawName || 'VIP PANEL';
}
