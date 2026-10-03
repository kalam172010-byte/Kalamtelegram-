import React, { useState, useMemo } from 'react';
import { useBot } from '../../context/BotContext';
import { Product } from '../../types';
import { sortProductsByDuration, isCategoryMatch, getCanonicalCategory, getCanonicalPanelName } from '../../utils/durationSorter';
import {
  Package,
  Clock,
  ShieldCheck,
  Zap,
  ShoppingBag,
  ExternalLink,
  Check,
  AlertCircle,
  Wrench,
  Key,
  Smartphone,
  Monitor,
  Apple,
  Sparkles
} from 'lucide-react';

interface GroupedPanel {
  panelKey: string;
  category: string;
  panel_name: string;
  apk_link?: string;
  device_limit?: string;
  delivery_mode?: string;
  plans: Product[];
}

export const ProductCatalog: React.FC = () => {
  const {
    products,
    productKeys,
    currentUser,
    handleCallbackQuery,
    setActiveTab,
    openAddProductModal
  } = useBot();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  
  // Keyed state map: [panelKey: string] -> [selectedProductUniqueId: number | string]
  const [selectedDurationMap, setSelectedDurationMap] = useState<Record<string, number | string>>({});
  const [purchasingPlanId, setPurchasingPlanId] = useState<number | string | null>(null);

  // Group active products strictly into distinct panels (strictly canonical categories & panel names)
  const groupedPanels: GroupedPanel[] = useMemo(() => {
    const map = new Map<string, GroupedPanel>();

    products.filter(p => p.is_active !== 0).forEach(prod => {
      const cat = getCanonicalCategory(prod.category);
      const pName = getCanonicalPanelName(prod);
      const key = `${cat}:::${pName.toUpperCase()}`;

      if (!map.has(key)) {
        map.set(key, {
          panelKey: key,
          category: cat,
          panel_name: pName,
          apk_link: prod.apk_link,
          device_limit: prod.device_limit || '1 Device HWID',
          delivery_mode: prod.delivery_mode || 'api_provider',
          plans: []
        });
      }

      map.get(key)!.plans.push({
        ...prod,
        category: cat,
        panel_name: pName
      });
    });

    // Ensure all plans inside each panel are strictly sorted in chronological duration order
    map.forEach(panel => {
      panel.plans = sortProductsByDuration(panel.plans);
    });

    return Array.from(map.values());
  }, [products]);

  // Standard category buckets
  const categoryTabs = useMemo(() => {
    const tabs = [
      { id: 'ALL', label: '🌟 All Products', icon: Sparkles },
      { id: 'ANDROID NON ROOT PANEL', label: '📱 Android Non-Root', icon: Smartphone },
      { id: 'ANDROID ROOT PANEL', label: '⚡ Android Root', icon: Zap },
      { id: 'PC PANEL', label: '💻 PC Emulator', icon: Monitor },
      { id: 'IOS / IPA PANEL', label: '🍏 iOS / IPA', icon: Apple }
    ];

    // Add any unique custom category that is not covered by standard tabs
    const existingCats = new Set(groupedPanels.map(p => p.category));
    for (const cat of existingCats) {
      if (
        !isCategoryMatch(cat, 'nonroot') &&
        !isCategoryMatch(cat, 'root') &&
        !isCategoryMatch(cat, 'pc') &&
        !isCategoryMatch(cat, 'ios') &&
        cat.toUpperCase() !== 'ALL PRODUCTS' &&
        cat.toUpperCase() !== 'ALL' &&
        cat.toUpperCase() !== 'ALL PANELS'
      ) {
        tabs.push({
          id: cat,
          label: `📦 ${cat.toUpperCase()}`,
          icon: Package
        });
      }
    }

    return tabs;
  }, [groupedPanels]);

  // Filter panels based on active category tab
  const filteredPanels = useMemo(() => {
    if (selectedCategory === 'ALL') return groupedPanels;
    return groupedPanels.filter(g => isCategoryMatch(g.category, selectedCategory));
  }, [groupedPanels, selectedCategory]);

  // Group filtered panels by device section for clean hierarchical layout
  const sections = useMemo(() => {
    if (selectedCategory !== 'ALL') {
      const activeTabObj = categoryTabs.find(t => t.id === selectedCategory);
      return [{
        title: activeTabObj?.label || selectedCategory,
        categoryKey: selectedCategory,
        panels: filteredPanels
      }];
    }

    // When "ALL" is selected, group into clean separated sections
    const nonRoot = groupedPanels.filter(p => isCategoryMatch(p.category, 'nonroot'));
    const root = groupedPanels.filter(p => isCategoryMatch(p.category, 'root') && !isCategoryMatch(p.category, 'nonroot'));
    const pc = groupedPanels.filter(p => isCategoryMatch(p.category, 'pc'));
    const ios = groupedPanels.filter(p => isCategoryMatch(p.category, 'ios'));
    const other = groupedPanels.filter(p => 
      !isCategoryMatch(p.category, 'nonroot') &&
      !isCategoryMatch(p.category, 'root') &&
      !isCategoryMatch(p.category, 'pc') &&
      !isCategoryMatch(p.category, 'ios')
    );

    const list = [];
    if (nonRoot.length > 0) list.push({ title: '📱 Android Non-Root Panels', categoryKey: 'ANDROID NON ROOT PANEL', panels: nonRoot });
    if (root.length > 0) list.push({ title: '⚡ Android Root Panels', categoryKey: 'ANDROID ROOT PANEL', panels: root });
    if (pc.length > 0) list.push({ title: '💻 PC Emulator Panels', categoryKey: 'PC PANEL', panels: pc });
    if (ios.length > 0) list.push({ title: '🍏 iOS / IPA Panels', categoryKey: 'IOS / IPA PANEL', panels: ios });
    if (other.length > 0) list.push({ title: '📦 Custom Device Panels', categoryKey: 'OTHER', panels: other });

    return list;
  }, [selectedCategory, groupedPanels, filteredPanels, categoryTabs]);

  const handleSelectDuration = (panelKey: string, plan: Product) => {
    setSelectedDurationMap(prev => ({
      ...prev,
      [panelKey]: plan.id
    }));
  };

  const handleBuy = async (plan: Product) => {
    setPurchasingPlanId(plan.id);
    try {
      await handleCallbackQuery(`buy_${plan.id}`, `BUY ${plan.name}`);
    } finally {
      setPurchasingPlanId(null);
    }
  };

  const isReseller = Boolean(currentUser.is_reseller);

  return (
    <div className="space-y-6">
      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl backdrop-blur-md">
        {categoryTabs.map(tab => {
          const Icon = tab.icon;
          const isSelected = selectedCategory === tab.id;
          const count = tab.id === 'ALL'
            ? groupedPanels.length
            : groupedPanels.filter(p => isCategoryMatch(p.category, tab.id)).length;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Panels Content */}
      {groupedPanels.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center text-slate-400 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto text-2xl">
            📦
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white">No Products Available</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Your store currently has no active products. Add new panels and packages using the button below.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddProductModal}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg inline-flex items-center gap-2 cursor-pointer"
          >
            <span>+ Add Product Now</span>
          </button>
        </div>
      ) : sections.length === 0 || sections.every(s => s.panels.length === 0) ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 space-y-3">
          <Package className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold">No products available in this category.</p>
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            View All Categories
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {sections.map(section => {
            if (section.panels.length === 0) return null;

            return (
              <div key={section.title} className="space-y-4">
                {/* Section Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <h4 className="text-sm sm:text-base font-black text-white tracking-wide">
                      {section.title}
                    </h4>
                    <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full font-bold">
                      {section.panels.length} {section.panels.length === 1 ? 'Panel' : 'Panels'}
                    </span>
                  </div>
                </div>

                {/* Panel Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {section.panels.map(panel => {
                    const activePlanId = selectedDurationMap[panel.panelKey];
                    const activePlan = panel.plans.find(p => String(p.id) === String(activePlanId)) || panel.plans[0];

                    if (!activePlan) return null;

                    const normalPrice = activePlan.price_inr;
                    const finalPrice = isReseller
                      ? (activePlan.reseller_price ?? activePlan.reseller_price_inr ?? normalPrice)
                      : (currentUser.is_vip ? Math.round(normalPrice * 0.85) : normalPrice);

                    const isMaint = Boolean(activePlan.is_maintenance);
                    const planKeys = productKeys.filter(k => String(k.product_id) === String(activePlan.id) && !k.is_used);
                    const inStock = activePlan.delivery_mode === 'api_provider' || Boolean(activePlan.provider_product_id) || planKeys.length > 0 || (activePlan.stock || 0) > 0;
                    const hasSufficientBalance = currentUser.balance >= finalPrice;
                    const isPurchasing = purchasingPlanId === activePlan.id;

                    return (
                      <div
                        key={panel.panelKey}
                        className="bg-slate-900/90 border border-slate-800/90 hover:border-cyan-500/40 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-xl backdrop-blur-md transition group"
                      >
                        <div>
                          {/* Top Tag & Limit */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
                              {panel.category}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full">
                              {panel.device_limit}
                            </span>
                          </div>

                          {/* Panel Title */}
                          <h3 className="text-base font-black text-white group-hover:text-cyan-200 transition">
                            {panel.panel_name}
                          </h3>

                          {panel.apk_link && (
                            <a
                              href={panel.apk_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold mt-1"
                            >
                              <span>Download APK</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}

                          {/* Duration Selection (Keyed Buttons) */}
                          <div className="mt-3.5 space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                              <span>Select Duration Plan:</span>
                              <span className="text-cyan-300 font-mono">{activePlan.validity || activePlan.name}</span>
                            </label>

                            <div className="grid grid-cols-2 gap-1.5">
                              {panel.plans.map(plan => {
                                const isSelected = String(plan.id) === String(activePlan.id);
                                const isPlanMaint = Boolean(plan.is_maintenance);
                                const planPrice = isReseller
                                  ? (plan.reseller_price ?? plan.reseller_price_inr ?? plan.price_inr)
                                  : (currentUser.is_vip ? Math.round(plan.price_inr * 0.85) : plan.price_inr);

                                return (
                                  <button
                                    key={`plan-btn-${panel.panelKey}-${plan.id}`}
                                    type="button"
                                    onClick={() => handleSelectDuration(panel.panelKey, plan)}
                                    className={`p-2 rounded-xl text-left transition flex flex-col justify-between border cursor-pointer active:scale-95 ${
                                      isSelected
                                        ? isPlanMaint
                                          ? 'bg-amber-500/20 border-amber-400/80 text-white shadow-md shadow-amber-500/20 ring-1 ring-amber-400/50'
                                          : 'bg-cyan-500/20 border-cyan-400/80 text-white shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400/50'
                                        : isPlanMaint
                                        ? 'bg-amber-950/20 border-amber-800/50 text-amber-300 hover:bg-amber-900/30'
                                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-xs font-bold font-mono truncate">{plan.name}</span>
                                      {isPlanMaint ? (
                                        <span className="text-[10px] text-amber-400 font-bold shrink-0">🛠️</span>
                                      ) : isSelected ? (
                                        <Check className="w-3 h-3 text-cyan-300 shrink-0" />
                                      ) : null}
                                    </div>
                                    <span className={`text-[11px] font-black font-mono mt-0.5 ${isPlanMaint ? 'text-amber-400 line-through opacity-80' : 'text-emerald-400'}`}>
                                      ₹{planPrice}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Price & Action Bottom Section */}
                        <div className="pt-3.5 border-t border-slate-800/80 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-slate-400 block">Total Price:</span>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-lg font-black text-emerald-300 font-mono">
                                  ₹{finalPrice}
                                </span>
                                {isReseller ? (
                                  <span className="text-[10px] text-amber-300 line-through">₹{normalPrice}</span>
                                ) : currentUser.is_vip ? (
                                  <span className="text-[10px] text-cyan-300 line-through">₹{normalPrice}</span>
                                ) : null}
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block">Stock:</span>
                              <span className={`text-[11px] font-bold ${
                                isMaint
                                  ? 'text-amber-400'
                                  : inStock
                                  ? 'text-emerald-400'
                                  : 'text-rose-400'
                              }`}>
                                {isMaint
                                  ? '🛠 Maintenance'
                                  : activePlan.delivery_mode === 'api_provider'
                                  ? '⚡ Instant API'
                                  : `${planKeys.length} In Vault`}
                              </span>
                            </div>
                          </div>

                          {/* Action Button */}
                          {isMaint ? (
                            <button
                              type="button"
                              disabled
                              className="w-full py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
                            >
                              <Wrench className="w-3.5 h-3.5" />
                              <span>Under Maintenance</span>
                            </button>
                          ) : !hasSufficientBalance ? (
                            <button
                              type="button"
                              onClick={() => setActiveTab('gateways')}
                              className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-lg shadow-amber-500/10"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>Low Balance (Add Funds)</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleBuy(activePlan)}
                              disabled={!inStock || isPurchasing}
                              className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-lg active:scale-95 cursor-pointer ${
                                inStock && !isPurchasing
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/20 border border-emerald-400/40'
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                              }`}
                            >
                              {isPurchasing ? (
                                <>
                                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  <span>Processing Order...</span>
                                </>
                              ) : inStock ? (
                                <>
                                  <Key className="w-3.5 h-3.5" />
                                  <span>Buy Key Now (₹{finalPrice})</span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span>Out of Stock</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
