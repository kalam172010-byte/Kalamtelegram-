import React, { useState, useMemo } from 'react';
import { useBot } from '../../context/BotContext';
import { Product } from '../../types';
import { sortProductsByDuration } from '../../utils/durationSorter';
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
  Key
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
    setActiveTab
  } = useBot();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  
  // Keyed state map: [panelKey: string] -> [selectedProductUniqueId: number | string]
  const [selectedDurationMap, setSelectedDurationMap] = useState<Record<string, number | string>>({});
  const [purchasingPlanId, setPurchasingPlanId] = useState<number | string | null>(null);

  // Group products into distinct panels
  const groupedPanels: GroupedPanel[] = useMemo(() => {
    const map = new Map<string, GroupedPanel>();

    products.filter(p => p.is_active !== 0).forEach(prod => {
      const cat = prod.category || 'GENERAL';
      const pName = prod.panel_name || prod.name;
      const key = `${cat}__${pName}`;

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

      map.get(key)!.plans.push(prod);
    });

    // Ensure all plans inside each panel are strictly sorted in duration order
    map.forEach(panel => {
      panel.plans = sortProductsByDuration(panel.plans);
    });

    return Array.from(map.values());
  }, [products]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    groupedPanels.forEach(g => set.add(g.category));
    return ['ALL', ...Array.from(set)];
  }, [groupedPanels]);

  const filteredPanels = useMemo(() => {
    if (selectedCategory === 'ALL') return groupedPanels;
    return groupedPanels.filter(g => g.category === selectedCategory);
  }, [groupedPanels, selectedCategory]);

  const handleSelectDuration = (panelKey: string, plan: Product) => {
    console.log(`[ProductCatalog] [DURATION_SELECT] Panel: "${panelKey}", Plan ID: ${plan.id}, Duration: "${plan.validity || plan.name}", Price: ₹${plan.price_inr}`);
    setSelectedDurationMap(prev => ({
      ...prev,
      [panelKey]: plan.id
    }));
  };

  const handleBuy = async (plan: Product) => {
    console.log(`[ProductCatalog] [BUY_CLICK] Purchasing Plan: ID: ${plan.id}, Name: "${plan.name}", Validity: "${plan.validity}", Price: ₹${plan.price_inr}`);
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
      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
              selectedCategory === cat
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/40'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Panels Grid */}
      {filteredPanels.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 space-y-3">
          <Package className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold">No products available in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPanels.map(panel => {
            // Retrieve explicitly selected plan from keyed map or default to first plan
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

            return (
              <div
                key={panel.panelKey}
                className="bg-slate-900/80 border border-slate-800/90 hover:border-cyan-500/40 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-xl backdrop-blur-md transition group"
              >
                <div>
                  {/* Header Tag */}
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
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition cursor-pointer active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5 font-bold" />
                      <span>Low Balance (Add ₹{(finalPrice - currentUser.balance).toFixed(0)})</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={purchasingPlanId === activePlan.id}
                      onClick={() => handleBuy(activePlan)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{purchasingPlanId === activePlan.id ? 'Processing...' : `Buy Key Now (₹${finalPrice})`}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
