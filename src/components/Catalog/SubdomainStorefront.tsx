import React, { useState, useMemo } from 'react';
import { useBot } from '../../context/BotContext';
import { SubdomainStore, Product } from '../../types';
import { ProductCatalog } from './ProductCatalog';
import { WebPurchaseModal } from './WebPurchaseModal';
import { WebsiteLogo } from '../Common/WebsiteLogo';
import {
  Globe,
  ShoppingBag,
  ExternalLink,
  Copy,
  Check,
  Send,
  Sparkles,
  ShieldCheck,
  Megaphone,
  ArrowLeft,
  Smartphone,
  Zap,
  Package
} from 'lucide-react';
import { motion } from 'motion/react';

interface SubdomainStorefrontProps {
  store: SubdomainStore;
  onExitSubdomain?: () => void;
}

export const SubdomainStorefront: React.FC<SubdomainStorefrontProps> = ({
  store,
  onExitSubdomain
}) => {
  const {
    products,
    currentUser,
    setActiveTab,
    setActiveSubdomainSlug
  } = useBot();

  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedWebPurchaseProduct, setSelectedWebPurchaseProduct] = useState<Product | null>(null);

  // Filter products assigned to this subdomain store (or all active if empty)
  const storeProducts = useMemo(() => {
    if (!store.assigned_product_ids || store.assigned_product_ids.length === 0) {
      return products;
    }
    return products.filter(p => store.assigned_product_ids.map(String).includes(String(p.id)));
  }, [products, store.assigned_product_ids]);

  const currentHost = window.location.hostname;
  const displayDomain = store.custom_domain
    ? store.custom_domain
    : (currentHost.includes('.') && !currentHost.includes('localhost') && !currentHost.includes('127.0.0.1'))
      ? currentHost
      : `${store.subdomain}.${window.location.host}`;

  const fullSubdomainUrl = store.custom_domain
    ? (store.custom_domain.startsWith('http') ? store.custom_domain : `https://${store.custom_domain}`)
    : `${window.location.origin}/?store=${store.subdomain}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullSubdomainUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen w-full bg-[#030712] text-slate-100 font-sans relative overflow-x-hidden pb-20">
      {/* Background Ambient Mesh Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-indigo-600/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-28 w-[28rem] h-[28rem] bg-gradient-to-tr from-purple-500/20 to-cyan-400/15 rounded-full blur-[130px]" />
      </div>

      {/* Top Ambient Border */}
      <div className="h-[2.5px] w-full bg-gradient-to-r from-cyan-400 via-purple-500 to-emerald-400 z-50 shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.8)]" />

      {/* Subdomain Banner */}
      {store.banner_announcement && (
        <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 border-b border-purple-500/30 px-4 py-2 text-xs font-bold text-center text-purple-200 z-40 relative flex items-center justify-center gap-2">
          <Megaphone className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="truncate max-w-4xl">{store.banner_announcement}</span>
        </div>
      )}

      {/* Standalone Subdomain Header */}
      <header className="bg-slate-950/90 backdrop-blur-2xl border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 sticky top-0 z-40 shadow-xl">
        <div className="flex items-center gap-3">
          {store.logo_url ? (
            <img
              src={store.logo_url}
              alt={store.store_name}
              className="w-10 h-10 rounded-xl object-contain border border-purple-500/40 bg-slate-900 p-1"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-indigo-600/30 border border-purple-400/40 text-purple-300 flex items-center justify-center font-black text-lg shadow-inner">
              <ShoppingBag className="w-5 h-5" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                {store.store_name}
              </h1>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 font-extrabold px-2 py-0.5 rounded-full border border-purple-500/30">
                OFFICIAL SUBDOMAIN STORE
              </span>
            </div>
            <div className="text-[11px] font-mono text-cyan-300 flex items-center gap-1.5 mt-0.5">
              <span>{displayDomain}</span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-slate-400 hover:text-cyan-300 transition cursor-pointer p-0.5"
                title="Copy Subdomain Link"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'Link Copied' : 'Share Store Link'}</span>
          </button>
        </div>
      </header>

      {/* Main Subdomain Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 relative z-10">
        {/* Subdomain Hero Welcome Banner */}
        <div className="liquid-glass-card rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-3 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/70 border border-purple-500/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-purple-400 tracking-wider">
                  Verified Storefront
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  ⚡ Instant Key Fulfillment Active
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Welcome to {store.store_name}
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl">
                Browse official Free Fire Injector &amp; Menu Panels below. Select any plan to purchase and receive your license key instantly on your screen!
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {store.support_telegram && (
                <a
                  href={store.support_telegram}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-cyan-600/20"
                >
                  <Send className="w-4 h-4" />
                  <span>Contact Telegram Support</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Subdomain Product Catalog */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-400" />
              Available Panel Packages ({storeProducts.length})
            </h3>
            <span className="text-xs text-slate-400">
              Automated 24/7 Delivery
            </span>
          </div>

          <ProductCatalog />
        </div>
      </main>

      {/* Subdomain Store Footer */}
      <footer className="mt-12 py-8 border-t border-slate-800 text-center space-y-2 relative z-10 text-xs text-slate-400">
        <p className="font-bold text-slate-300">{store.store_name}</p>
        <p className="text-[11px] text-slate-500">
          Powered by Kalam FF Panel Subdomain Store Platform Engine • All Rights Reserved.
        </p>
      </footer>
    </div>
  );
};
