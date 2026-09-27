import React, { useState } from 'react';
import { useBot } from '../../context/BotContext';
import { SubdomainStore } from '../../types';
import {
  Globe,
  Plus,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  ShoppingBag,
  Sparkles,
  Link,
  Share2
} from 'lucide-react';

export const SubdomainStoreManager: React.FC = () => {
  const {
    subdomainStores,
    createSubdomainStore,
    deleteSubdomainStore,
    products
  } = useBot();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedStoreId, setCopiedStoreId] = useState<string | null>(null);
  const [deleteConfirmStore, setDeleteConfirmStore] = useState<SubdomainStore | null>(null);

  // Form State for creating a new subdomain store
  const [form, setForm] = useState({
    subdomain: '',
    custom_domain: '',
    store_name: '',
    logo_url: '',
    banner_announcement: '',
    theme_color: 'cyan',
    upi_id: '',
    support_telegram: '',
    support_whatsapp: '',
    assigned_product_ids: [] as (number | string)[]
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subdomain.trim() || !form.store_name.trim()) return;

    createSubdomainStore({
      subdomain: form.subdomain,
      custom_domain: form.custom_domain,
      store_name: form.store_name,
      logo_url: form.logo_url,
      banner_announcement: form.banner_announcement,
      theme_color: form.theme_color,
      upi_id: form.upi_id,
      support_telegram: form.support_telegram,
      support_whatsapp: form.support_whatsapp,
      assigned_product_ids: form.assigned_product_ids
    });

    setShowCreateModal(false);
    setForm({
      subdomain: '',
      custom_domain: '',
      store_name: '',
      logo_url: '',
      banner_announcement: '',
      theme_color: 'cyan',
      upi_id: '',
      support_telegram: '',
      support_whatsapp: '',
      assigned_product_ids: []
    });
  };

  const currentHost = window.location.host;

  const getDirectStoreUrl = (store: SubdomainStore) => {
    if (store.custom_domain) {
      return store.custom_domain.startsWith('http') ? store.custom_domain : `https://${store.custom_domain}`;
    }
    return `${window.location.origin}/?store=${store.subdomain}`;
  };

  const handleCopyStoreLink = (store: SubdomainStore) => {
    const fullUrl = getDirectStoreUrl(store);
    navigator.clipboard.writeText(fullUrl);
    setCopiedStoreId(store.id);
    setTimeout(() => setCopiedStoreId(null), 2000);
  };

  const handleOpenStandaloneTab = (store: SubdomainStore) => {
    const fullUrl = getDirectStoreUrl(store);
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  const toggleProductSelection = (productId: number | string) => {
    setForm(prev => {
      const exists = prev.assigned_product_ids.map(String).includes(String(productId));
      const nextIds = exists
        ? prev.assigned_product_ids.filter(id => String(id) !== String(productId))
        : [...prev.assigned_product_ids, productId];
      return { ...prev, assigned_product_ids: nextIds };
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-slate-100">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-cyan-400 tracking-wider">Subdomain &amp; Custom Domain Manager</span>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded-full border border-cyan-500/30">
              {subdomainStores.length} Stores Configured
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 mt-1">
            <Globe className="w-5 h-5 text-cyan-400" />
            Standalone Subdomain Store &amp; Custom Domains
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-600/30 active:scale-95 border border-cyan-400/30"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Subdomain / Custom Domain Website</span>
        </button>
      </div>

      {/* Guidance Notice Box */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-indigo-500/40 rounded-2xl p-4 sm:p-5 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-indigo-300 font-bold">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Dynamic Custom Domain Setup:</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          Stores dynamically detect your exact domain or custom domain (e.g. <b>{currentHost}</b> or <b>kalamvip.com</b>). Copy the URL below to share directly with your customers or open in a new tab!
        </p>
      </div>

      {/* Subdomain Stores List Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span>Your Created Web Stores ({subdomainStores.length})</span>
          <span className="text-[10px] text-cyan-400 font-mono">1-Click Direct Copy &amp; Open</span>
        </div>

        {subdomainStores.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl space-y-3 text-slate-400 text-xs">
            <Globe className="w-10 h-10 text-cyan-400 mx-auto" />
            <p className="font-bold text-white text-sm">No Subdomain Websites Created Yet</p>
            <p className="max-w-md mx-auto text-slate-400">
              Click <b>"+ Create Subdomain Website"</b> above to generate your first custom store URL!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subdomainStores.map(store => {
              const isDefaultAll = !store.assigned_product_ids || store.assigned_product_ids.length === 0;
              const productCount = isDefaultAll ? products.length : store.assigned_product_ids.length;
              const storeDirectUrl = getDirectStoreUrl(store);
              const storeDisplayDomain = store.custom_domain || `${store.subdomain}.${currentHost}`;

              return (
                <div
                  key={store.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between transition group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center font-bold text-lg shrink-0">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-black text-white text-base group-hover:text-cyan-300 transition">
                            {store.store_name}
                          </h3>
                          <span className="font-mono text-xs text-cyan-300 font-bold block">
                            Domain: {storeDisplayDomain}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        store.status === 'LIVE'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}>
                        {store.status}
                      </span>
                    </div>

                    {/* Direct Copyable Web URL Box */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-bold flex items-center gap-1">
                          <Link className="w-3.5 h-3.5 text-cyan-400" />
                          Standalone Direct URL:
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          {productCount} Panels Included
                        </span>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-2 font-mono text-[11px] text-cyan-200 select-all">
                        <span className="truncate flex-1">{storeDirectUrl}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyStoreLink(store)}
                          className="px-2 py-1 bg-cyan-600/30 hover:bg-cyan-600 text-cyan-300 hover:text-white rounded-lg transition text-[10px] font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedStoreId === store.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy URL</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenStandaloneTab(store)}
                      className="px-3.5 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-300" />
                      <span>Open in New Tab ↗</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopyStoreLink(store)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl transition cursor-pointer"
                        title="Copy Subdomain Link"
                      >
                        {copiedStoreId === store.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmStore(store)}
                        className="p-2 bg-rose-950/40 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl transition cursor-pointer"
                        title="Delete Subdomain Website"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE SUBDOMAIN STORE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl my-auto text-slate-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-lg">
                  🌐
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create Subdomain or Custom Domain Store</h3>
                  <p className="text-xs text-slate-400">Generate a custom white-label panel store website</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold mb-1 block">Subdomain Slug (e.g. kalamvip)</label>
                <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2">
                  <input
                    type="text"
                    required
                    value={form.subdomain}
                    onChange={(e) => setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                    placeholder="kalamvip"
                    className="bg-transparent text-cyan-300 font-mono font-bold outline-none flex-1 text-xs"
                  />
                  <span className="text-slate-500 font-mono text-[11px]">.{currentHost}</span>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold mb-1 block">Custom Domain (Optional, e.g. kalamvip.com)</label>
                <input
                  type="text"
                  value={form.custom_domain}
                  onChange={(e) => setForm({ ...form, custom_domain: e.target.value })}
                  placeholder="e.g. kalamvip.com or vip.yourbrand.org"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-mono font-bold outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Optional: If you bought a custom domain, enter it here. Otherwise leave blank!
                </p>
              </div>

              <div>
                <label className="text-slate-300 font-bold mb-1 block">Website Store Display Name</label>
                <input
                  type="text"
                  required
                  value={form.store_name}
                  onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                  placeholder="KALAM VIP STORE"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold mb-1 block">Banner Announcement</label>
                <input
                  type="text"
                  value={form.banner_announcement}
                  onChange={(e) => setForm({ ...form, banner_announcement: e.target.value })}
                  placeholder="🔥 Official Store: Buy Anti-Ban Panels with Instant Delivery!"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 outline-none"
                />
              </div>

              {/* Assigned Products Checklist */}
              <div className="space-y-2">
                <label className="text-slate-300 font-bold block flex items-center justify-between">
                  <span>Select Products for This Subdomain Website:</span>
                  <span className="text-cyan-300 text-[10px]">
                    {form.assigned_product_ids.length === 0 ? 'All Panels Included' : `${form.assigned_product_ids.length} Selected`}
                  </span>
                </label>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-36 overflow-y-auto space-y-1.5">
                  {products.map(p => {
                    const isChecked = form.assigned_product_ids.map(String).includes(String(p.id));
                    return (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300 hover:text-white">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleProductSelection(p.id)}
                          className="accent-purple-500 rounded"
                        />
                        <span className="font-bold text-white">{p.panel_name}</span>
                        <span className="text-slate-500">({p.name || p.validity} - ₹{p.price_inr})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg cursor-pointer transition"
                >
                  🚀 Create Subdomain / Custom Domain Website
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirmStore && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-400" />
              Delete Subdomain Website?
            </h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to delete <b className="text-white">{deleteConfirmStore.store_name}</b> (<code className="text-cyan-300">{deleteConfirmStore.subdomain}</code>)?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmStore(null)}
                className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteSubdomainStore(deleteConfirmStore.id);
                  setDeleteConfirmStore(null);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
