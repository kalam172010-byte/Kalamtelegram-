import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Key, 
  Clock, 
  User as UserIcon, 
  CheckCircle2, 
  AlertCircle, 
  ArrowDownRight, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Download, 
  RefreshCw, 
  ShieldCheck, 
  Zap, 
  Layers, 
  Coins,
  Flame,
  TrendingUp,
  Activity,
  Terminal,
  Database,
  FileText
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useBot } from '../../context/BotContext';
import { Order, Product, ProductKey, User } from '../../types';
import { db, onSnapshot, collection } from '../../lib/firebase';

export const PurchaseLogs: React.FC = () => {
  const { 
    orders, 
    products, 
    productKeys, 
    allUsers, 
    logs, 
    updateUserBalance 
  } = useBot();

  // Local state for interactive controls
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<'ALL' | 'VAULT' | 'PROVIDER'>('ALL');
  const [revealedKeyIds, setRevealedKeyIds] = useState<Set<number>>(new Set());
  const [copiedKeyId, setCopiedKeyId] = useState<number | null>(null);
  const [isLiveListening, setIsLiveListening] = useState(true);
  const [liveEventCount, setLiveEventCount] = useState(0);
  const [realtimeFirestoreOrders, setRealtimeFirestoreOrders] = useState<Order[]>([]);
  const [lastEventTime, setLastEventTime] = useState<string>(new Date().toLocaleTimeString());

  // Real-time Firestore onSnapshot for Orders & Key Deductions
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'orders'), (snapshot: any) => {
        if (snapshot && !snapshot.empty) {
          const cloudOrders: Order[] = [];
          snapshot.forEach((docSnap: any) => {
            const data = docSnap.data() as Order;
            if (data && data.id) {
              cloudOrders.push(data);
            }
          });
          if (cloudOrders.length > 0) {
            setRealtimeFirestoreOrders(cloudOrders);
            setLiveEventCount(prev => prev + 1);
            setLastEventTime(new Date().toLocaleTimeString());
          }
        }
      }, (err: any) => {
        console.warn('Firestore PurchaseLogs onSnapshot notice:', err?.message || err);
      });

      return () => {
        unsub();
      };
    } catch {
      // Fallback to local BotContext orders
    }
  }, []);

  // Merge Context orders with Firestore real-time orders, prioritizing freshest
  const mergedOrders = useMemo(() => {
    const orderMap = new Map<number, Order>();
    orders.forEach(o => orderMap.set(o.id, o));
    realtimeFirestoreOrders.forEach(o => orderMap.set(o.id, o));
    return Array.from(orderMap.values()).sort((a, b) => {
      const timeA = new Date(a.purchase_date).getTime() || a.id;
      const timeB = new Date(b.purchase_date).getTime() || b.id;
      return timeB - timeA;
    });
  }, [orders, realtimeFirestoreOrders]);

  // Enrich each purchase order with product deduction data and user details
  const enrichedPurchases = useMemo(() => {
    return mergedOrders.map(order => {
      const matchedUser = allUsers.find(u => u.user_id === order.user_id);
      
      // Match product to check stock status
      const matchedProduct = products.find(p => 
        (p.panel_name && order.product_name.toLowerCase().includes(p.panel_name.toLowerCase())) ||
        (order.product_name.toLowerCase().includes(p.name.toLowerCase()))
      );

      const isProviderKey = order.delivered_key?.startsWith('BB-') || 
                            order.delivered_key?.startsWith('API-') || 
                            order.delivered_key?.toLowerCase().includes('reseller');

      // Related activity log entry for wallet balance deduction
      const deductionLog = logs.find(l => 
        l.user_id === order.user_id && 
        (l.action === 'BUY_PRODUCT' || l.action === 'PURCHASE') &&
        Math.abs(new Date(l.timestamp).getTime() - (new Date(order.purchase_date).getTime() || order.id)) < 30000
      );

      return {
        ...order,
        user: matchedUser,
        product: matchedProduct,
        isProviderDelivery: isProviderKey,
        deductionDetails: deductionLog ? deductionLog.details : `Balance deducted: -₹${order.price_paid.toFixed(2)}`,
        currentProductStock: matchedProduct ? (matchedProduct.stock ?? 0) : null
      };
    });
  }, [mergedOrders, allUsers, products, logs]);

  // Filtered purchases
  const filteredPurchases = useMemo(() => {
    return enrichedPurchases.filter(item => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || 
        String(item.id).includes(q) ||
        String(item.user_id).includes(q) ||
        item.product_name.toLowerCase().includes(q) ||
        item.delivered_key.toLowerCase().includes(q) ||
        (item.user?.username && item.user.username.toLowerCase().includes(q)) ||
        (item.user?.first_name && item.user.first_name.toLowerCase().includes(q));

      const matchesCategory = categoryFilter === 'ALL' || (
        item.product?.category && item.product.category.toUpperCase().includes(categoryFilter.toUpperCase())
      );

      const matchesDeliveryType = deliveryTypeFilter === 'ALL' || (
        deliveryTypeFilter === 'PROVIDER' ? item.isProviderDelivery : !item.isProviderDelivery
      );

      return matchesSearch && matchesCategory && matchesDeliveryType;
    });
  }, [enrichedPurchases, searchTerm, categoryFilter, deliveryTypeFilter]);

  // Stats calculation
  const stats = useMemo(() => {
    const totalRevenue = mergedOrders.reduce((sum, o) => sum + (o.price_paid || 0), 0);
    const totalKeys = mergedOrders.length;
    const providerCount = mergedOrders.filter(o => o.delivered_key?.startsWith('BB-') || o.delivered_key?.startsWith('API-')).length;
    const vaultCount = totalKeys - providerCount;
    const uniqueBuyers = new Set(mergedOrders.map(o => o.user_id)).size;

    return {
      totalRevenue,
      totalKeys,
      providerCount,
      vaultCount,
      uniqueBuyers
    };
  }, [mergedOrders]);

  const toggleRevealKey = (id: number) => {
    setRevealedKeyIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const exportAsPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

      // Title & Branding Header
      doc.setFillColor(15, 23, 42); // #0f172a slate-900
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 70, 'F');

      doc.setFontSize(16);
      doc.setTextColor(56, 189, 248); // #38bdf8 cyan-400
      doc.setFont('helvetica', 'bold');
      doc.text("KALAM FF PANEL - OFFICIAL TRANSACTION & PURCHASE AUDIT STATEMENT", 30, 32);

      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.setFont('helvetica', 'normal');
      const timeStr = new Date().toLocaleString('en-IN', { timeZoneName: 'short' });
      doc.text(`Generated: ${timeStr} | Export Filter: ${categoryFilter} | Total Records: ${filteredPurchases.length}`, 30, 52);

      // Financial Summary Box
      doc.setFillColor(30, 41, 59); // slate-800
      doc.roundedRect(30, 80, doc.internal.pageSize.getWidth() - 60, 45, 6, 6, 'F');

      doc.setFontSize(9.5);
      doc.setTextColor(241, 245, 249);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Revenue: INR ${stats.totalRevenue.toFixed(2)}`, 45, 106);
      doc.text(`Total Keys Delivered: ${stats.totalKeys}`, 230, 106);
      doc.text(`Vault Deliveries: ${stats.vaultCount}`, 410, 106);
      doc.text(`API Deliveries: ${stats.providerCount}`, 560, 106);
      doc.text(`Unique Buyers: ${stats.uniqueBuyers}`, 700, 106);

      // Table Content
      const tableHead = [["Order #", "Date & Time (IST)", "Buyer UID", "Username", "Product & Plan", "Type", "Delivered Key", "Paid (INR)"]];
      const tableBody = filteredPurchases.map(p => [
        `#${p.id}`,
        new Date(p.purchase_date).toLocaleString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }),
        String(p.user_id),
        p.user?.username ? `@${p.user.username}` : (p.user?.first_name || 'N/A'),
        p.product_name,
        p.isProviderDelivery ? "Banti API" : "Vault Key",
        p.delivered_key,
        `₹${p.price_paid.toFixed(2)}`
      ]);

      autoTable(doc, {
        head: tableHead,
        body: tableBody,
        startY: 135,
        theme: 'grid',
        headStyles: {
          fillColor: [14, 116, 144], // cyan-700
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.5
        },
        styles: {
          fontSize: 8,
          cellPadding: 4.5,
          overflow: 'linebreak'
        },
        columnStyles: {
          0: { cellWidth: 55, fontStyle: 'bold' },
          1: { cellWidth: 95 },
          2: { cellWidth: 65 },
          3: { cellWidth: 80 },
          4: { cellWidth: 160 },
          5: { cellWidth: 65 },
          6: { cellWidth: 190, font: 'courier' },
          7: { cellWidth: 60, halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] }
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        foot: [[
          "TOTAL",
          "",
          "",
          "",
          "",
          "",
          `${filteredPurchases.length} Orders`,
          `₹${filteredPurchases.reduce((s, p) => s + p.price_paid, 0).toFixed(2)}`
        ]],
        footStyles: {
          fillColor: [15, 23, 42],
          textColor: [56, 189, 248],
          fontStyle: 'bold'
        },
        didDrawPage: () => {
          const pageStr = `Page ${doc.getNumberOfPages()}`;
          doc.setFontSize(8);
          doc.setTextColor(100);
          doc.text("Kalam FF Panel Automated Transaction Ledger • Confidential Accounting Record", 30, doc.internal.pageSize.getHeight() - 15);
          doc.text(pageStr, doc.internal.pageSize.getWidth() - 65, doc.internal.pageSize.getHeight() - 15);
        }
      });

      doc.save(`kalam_purchase_statement_${Date.now()}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    }
  };

  const exportAsJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredPurchases, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `kalam_purchase_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportAsCSV = () => {
    const headers = ["Order ID", "User ID", "Username", "Product Name", "Price Paid (INR)", "Delivered Key", "Delivery Type", "Purchase Date"];
    const rows = filteredPurchases.map(p => [
      p.id,
      p.user_id,
      p.user?.username || 'N/A',
      `"${p.product_name.replace(/"/g, '""')}"`,
      p.price_paid,
      `"${p.delivered_key}"`,
      p.isProviderDelivery ? "BantiBhaiya API" : "Local Vault",
      `"${p.purchase_date}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kalam_purchases_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Live Status Header */}
      <div className="liquid-glass rounded-3xl p-5 sm:p-6 border border-emerald-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <span>Purchase & Key Deduction Logs</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    LIVE FIRESTORE SYNC
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Real-time tracking of product purchases, automatic wallet balance deductions, and key fulfillment delivery events.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Events: <b className="text-emerald-300">{liveEventCount}</b></span>
              <span className="text-slate-600">|</span>
              <span className="text-[10px] text-slate-400">Synced: {lastEventTime}</span>
            </div>

            <button
              onClick={exportAsPDF}
              className="px-3 py-2 bg-gradient-to-r from-rose-600/90 to-red-600/90 hover:from-rose-500 hover:to-red-500 text-white border border-rose-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-600/20 active:scale-95"
              title="Download Statement as PDF"
            >
              <FileText className="w-3.5 h-3.5 text-white" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={exportAsCSV}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Export as CSV"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={exportAsJSON}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Export as JSON"
            >
              <Database className="w-3.5 h-3.5 text-purple-400" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Total Revenue</span>
            </div>
            <div className="text-xl font-black font-mono text-emerald-300 mt-1">
              ₹{stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Deducted from user wallets</div>
          </div>

          <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span>Total Keys Delivered</span>
            </div>
            <div className="text-xl font-black font-mono text-cyan-300 mt-1">
              {stats.totalKeys}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">100% Successful Orders</div>
          </div>

          <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>Delivery Breakdown</span>
            </div>
            <div className="text-sm font-bold font-mono text-purple-300 mt-1 flex items-center gap-2">
              <span className="text-emerald-400">Vault: {stats.vaultCount}</span>
              <span>•</span>
              <span className="text-indigo-400">API: {stats.providerCount}</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Local Vault vs BantiBhaiya</div>
          </div>

          <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-pink-400" />
              <span>Unique Buyers</span>
            </div>
            <div className="text-xl font-black font-mono text-pink-300 mt-1">
              {stats.uniqueBuyers}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Active customer accounts</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="liquid-glass rounded-2xl p-4 border border-slate-800/80 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Order ID, User ID, Username, Product Name, or Key text..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-bold focus:outline-none focus:border-emerald-500 transition cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="NON ROOT">Android Non-Root</option>
            <option value="ROOT">Android Root</option>
            <option value="PC">PC Panel</option>
          </select>

          {/* Delivery Method Filter */}
          <select
            value={deliveryTypeFilter}
            onChange={(e) => setDeliveryTypeFilter(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-bold focus:outline-none focus:border-emerald-500 transition cursor-pointer"
          >
            <option value="ALL">All Delivery Types</option>
            <option value="VAULT">📦 Local Vault Key</option>
            <option value="PROVIDER">⚡ BantiBhaiya Reseller API</option>
          </select>

          {(searchTerm || categoryFilter !== 'ALL' || deliveryTypeFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('ALL');
                setDeliveryTypeFilter('ALL');
              }}
              className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Purchases List */}
      <div className="space-y-3">
        {filteredPurchases.length === 0 ? (
          <div className="liquid-glass rounded-3xl p-12 text-center border border-slate-800/80 space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <ShoppingBag className="w-8 h-8 opacity-40" />
            </div>
            <h3 className="text-base font-bold text-slate-300">No Purchase Logs Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchTerm || categoryFilter !== 'ALL' || deliveryTypeFilter !== 'ALL'
                ? 'No purchases match your selected filters. Try broadening your search.'
                : 'Purchases made through Telegram Bot (@KALAMFFPANEL1BOT) or the web store will appear here in real time.'}
            </p>
          </div>
        ) : (
          filteredPurchases.map((purchase) => {
            const isRevealed = revealedKeyIds.has(purchase.id);
            const isCopied = copiedKeyId === purchase.id;

            return (
              <div
                key={purchase.id}
                className="liquid-glass rounded-2xl p-4 sm:p-5 border border-slate-800/90 hover:border-emerald-500/30 transition-all duration-300 group relative overflow-hidden"
              >
                {/* Accent Top Border */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-60" />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Purchase Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-black">
                        #{purchase.id}
                      </span>

                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        PURCHASE FULFILLED
                      </span>

                      {purchase.isProviderDelivery ? (
                        <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center gap-1">
                          <Zap className="w-3 h-3 text-indigo-400" />
                          BantiBhaiya Reseller API Key
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-lg bg-teal-500/15 border border-teal-500/40 text-teal-300 text-xs font-bold flex items-center gap-1">
                          <Layers className="w-3 h-3 text-teal-400" />
                          Vault Key Auto-Deducted
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(purchase.purchase_date).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    </div>

                    {/* Product & User Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <div className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                          <span>{purchase.product_name}</span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>Price Paid: <b className="text-emerald-300 font-mono">₹{purchase.price_paid.toFixed(2)}</b></span>
                          <span>•</span>
                          <span className="text-rose-400 font-mono font-bold flex items-center gap-0.5">
                            <ArrowDownRight className="w-3 h-3" />
                            -₹{purchase.price_paid.toFixed(2)} Deducted
                          </span>
                        </div>
                      </div>

                      {/* Customer / Telegram User */}
                      <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 flex items-center gap-1">
                            <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
                            Buyer:
                          </span>
                          <span className="font-mono text-slate-200 font-bold">
                            {purchase.user?.username ? `@${purchase.user.username}` : (purchase.user?.first_name || `UID: ${purchase.user_id}`)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <span>Telegram UID: <code>{purchase.user_id}</code></span>
                          {purchase.user && (
                            <span className="text-emerald-400 font-bold">
                              Wallet: ₹{(purchase.user.balance || 0).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Delivered Key & Verification */}
                  <div className="flex flex-col justify-center space-y-2 lg:min-w-[320px] bg-slate-900/90 border border-slate-800/90 p-3 rounded-2xl">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-amber-400" />
                        Delivered License Key:
                      </span>
                      <button
                        onClick={() => toggleRevealKey(purchase.id)}
                        className="text-[11px] text-slate-400 hover:text-cyan-300 font-mono flex items-center gap-1 transition cursor-pointer"
                      >
                        {isRevealed ? (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>Hide</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>Reveal</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2">
                      <code className="text-xs font-mono font-bold text-amber-300 tracking-wider flex-1 select-all overflow-hidden text-ellipsis">
                        {isRevealed
                          ? purchase.delivered_key
                          : purchase.delivered_key.replace(/^(.{6})(.*)(.{4})$/, '$1••••••••$3')
                        }
                      </code>

                      <button
                        onClick={() => copyToClipboard(purchase.delivered_key, purchase.id)}
                        className={`p-1.5 rounded-lg border transition cursor-pointer shrink-0 ${
                          isCopied
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                        }`}
                        title="Copy Key"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Stock & Deduction Verification Check */}
                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <ShieldCheck className="w-3 h-3" />
                        Key Vault Stock Deducted
                      </span>
                      {purchase.currentProductStock !== null && (
                        <span className="font-mono text-slate-500">
                          Current Stock: <b className="text-slate-300">{purchase.currentProductStock} left</b>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
