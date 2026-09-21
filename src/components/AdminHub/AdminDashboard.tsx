import React, { useState } from 'react';
import { useBot } from '../../context/BotContext';
import { formatTelegramHTML } from '../../utils/telegramFormatter';
import {
  Users,
  Package,
  Key,
  CreditCard,
  Ticket as TicketIcon,
  Tag,
  Settings as SettingsIcon,
  FileText,
  Code2,
  Plus,
  Trash2,
  Edit3,
  Shield,
  ShieldAlert,
  Crown,
  DollarSign,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Download,
  RefreshCw,
  MessageSquare,
  Sparkles,
  Zap,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  ExternalLink,
  Megaphone,
  Send,
  Image as ImageIcon,
  Link as LinkIcon,
  Pin,
  Radio,
  Bot
} from 'lucide-react';
import { Product } from '../../types';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    setCurrentUserId,
    setActiveTab,
    products,
    productKeys,
    allUsers,
    orders,
    tickets,
    coupons,
    logs,
    settings,
    emojis,
    addProduct,
    updateProduct,
    deleteProduct,
    injectProductKeys,
    deleteProductKey,
    updateUserBalance,
    toggleUserBan,
    warnUser,
    toggleUserVip,
    toggleUserReseller,
    createNewCoupon,
    deleteCoupon,
    replyToTicket,
    closeTicket,
    updateSettings,
    updateEmojiSlot,
    resetDatabaseToDefaults,
    botStatus,
    testTelegramBotToken,
    sendAdminTestMessage,
    restartBotEngine,
    testFamGatewayKey,
    createFamGatewayOrder,
    checkFamGatewayStatus,
    testProviderConnection,
    buyProviderKeyDirect,
    sendBroadcastMessage
  } = useBot();

  const [adminTab, setAdminTab] = useState<
    'overview' | 'products' | 'users' | 'broadcast' | 'tickets' | 'coupons' | 'gateways' | 'emojis' | 'logs' | 'code'
  >('overview');

  // Broadcast Message State
  const [broadcastForm, setBroadcastForm] = useState({
    targetAudience: 'all' as 'all' | 'vip' | 'reseller' | 'non_reseller',
    text: `⚡ <b>SPECIAL FLASH UPDATE</b> ⚡\n\nNew Non-Root Free Fire VIP panels are now back in stock with instant key delivery!\n\nUse code <code>KALAM50</code> for flat discount on your next recharge!`,
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    buttonText: '🛒 Open Store & Buy',
    buttonUrl: 'https://t.me/kalam_ff_bot',
    pinMessage: true
  });
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastStatusMsg, setBroadcastStatusMsg] = useState<{ type: 'success' | 'error'; text: string; details?: any } | null>(null);
  const [broadcastHistory, setBroadcastHistory] = useState<Array<{ id: string; target: string; text: string; time: string; count: number }>>([
    {
      id: 'bcast_demo_1',
      target: 'All Users (12 Users)',
      text: '⚡ Server Maintenance Completed: Bot is now 100% operational with instant key provisioning.',
      time: 'Today, 10:15 AM',
      count: 12
    }
  ]);

  // Live Bot Engine testing state
  const [testingToken, setTestingToken] = useState(false);
  const [sendingTestMsg, setSendingTestMsg] = useState(false);
  const [restartingEngine, setRestartingEngine] = useState(false);
  const [testStatusMsg, setTestStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // FamGateway Testing state
  const [showFamGatewayKey, setShowFamGatewayKey] = useState(false);
  const [testingFamGateway, setTestingFamGateway] = useState(false);
  const [famGatewayStatusMsg, setFamGatewayStatusMsg] = useState<{ type: 'success' | 'error'; text: string; details?: any } | null>(null);
  const [creatingTestOrder, setCreatingTestOrder] = useState(false);
  const [testOrderResult, setTestOrderResult] = useState<any | null>(null);

  // BantiBhaiya Reseller Provider Testing state
  const [showProviderKey, setShowProviderKey] = useState(false);
  const [showMasterKey, setShowMasterKey] = useState(false);
  const [testingProvider, setTestingProvider] = useState(false);
  const [providerStatusMsg, setProviderStatusMsg] = useState<{ type: 'success' | 'error'; text: string; details?: any } | null>(null);
  const [generatingTestKey, setGeneratingTestKey] = useState(false);
  const [testKeyResult, setTestKeyResult] = useState<any | null>(null);
  const [testKeyParams, setTestKeyParams] = useState({
    productId: 'PID_FF_NONROOT_V1',
    duration: '1 Day',
    androidId: '0b9b969bc2e7997b'
  });

  // Products state
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [showAddKeysModal, setShowAddKeysModal] = useState<number | null>(null);
  const [newKeysText, setNewKeysText] = useState('');

  const [newProdForm, setNewProdForm] = useState({
    category: 'ANDROID NON ROOT PANEL',
    panel_name: '',
    name: '',
    price_inr: 250,
    reseller_price: 150,
    validity: '7 Days',
    device_limit: '1 Device HWID',
    apk_link: '',
    keys: '',
    is_active: 1,
    delivery_mode: 'api_provider' as 'api_provider' | 'hybrid' | 'manual_vault',
    provider_product_id: 'PID_FF_NONROOT_V1',
    provider_duration: '7 Days',
    requires_android_id: 0
  });

  const [editProdForm, setEditProdForm] = useState({
    category: 'ANDROID NON ROOT PANEL',
    panel_name: '',
    name: '',
    price_inr: 250,
    reseller_price: 150,
    validity: '7 Days',
    device_limit: '1 Device HWID',
    apk_link: '',
    is_active: 1,
    delivery_mode: 'api_provider' as 'api_provider' | 'hybrid' | 'manual_vault',
    provider_product_id: 'PID_FF_NONROOT_V1',
    provider_duration: '7 Days',
    requires_android_id: 0
  });

  // User management & payment credit state
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserForModal, setSelectedUserForModal] = useState<number | null>(null);
  const [balanceAdjustAmt, setBalanceAdjustAmt] = useState<string>('100');
  const [balanceAdjustReason, setBalanceAdjustReason] = useState<string>('Manual Payment (UPI/Admin)');
  const [balanceNotifyTg, setBalanceNotifyTg] = useState<boolean>(true);
  const [modalBalanceStatus, setModalBalanceStatus] = useState<string | null>(null);
  const [warnMessageText, setWarnMessageText] = useState('');

  // Quick Direct Payment Portal state
  const [directPayUserId, setDirectPayUserId] = useState<string>('');
  const [directPayAmount, setDirectPayAmount] = useState<string>('100');
  const [directPayReason, setDirectPayReason] = useState<string>('Direct UPI Payment');
  const [directPayCustomReason, setDirectPayCustomReason] = useState<string>('');
  const [directPayNotify, setDirectPayNotify] = useState<boolean>(true);
  const [directPayStatus, setDirectPayStatus] = useState<{ type: 'success' | 'error'; text: string; details?: string } | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // Ticket reply state
  const [replyTicketId, setReplyTicketId] = useState<number | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponAmount, setCouponAmount] = useState('50');
  const [couponUses, setCouponUses] = useState('20');

  // Bot Credentials UI state
  const [showBotToken, setShowBotToken] = useState(false);
  const [showTelegramHelpModal, setShowTelegramHelpModal] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  // Stats
  const totalRevenue = allUsers.reduce((acc, u) => acc + u.spent, 0);
  const totalResellers = allUsers.filter(u => u.is_reseller).length;
  const totalVips = allUsers.filter(u => u.is_vip).length;
  const availableKeysCount = productKeys.filter(k => !k.is_used).length;
  const openTicketsCount = tickets.filter(t => t.status === 'Open').length;

  const filteredUsers = allUsers.filter(u =>
    u.first_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    String(u.user_id).includes(userSearch)
  );

  const filteredProducts = selectedCategory === 'ALL'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdForm.panel_name || !newProdForm.name) return;

    const keysArray = newProdForm.keys.split('\n').map(k => k.trim()).filter(Boolean);
    addProduct(
      {
        category: newProdForm.category,
        panel_name: newProdForm.panel_name,
        name: newProdForm.name,
        price_inr: Number(newProdForm.price_inr),
        reseller_price: Number(newProdForm.reseller_price),
        validity: newProdForm.validity || newProdForm.name,
        device_limit: newProdForm.device_limit,
        apk_link: newProdForm.apk_link,
        is_active: 1,
        delivery_mode: newProdForm.delivery_mode,
        provider_product_id: newProdForm.provider_product_id,
        provider_duration: newProdForm.provider_duration || newProdForm.validity || newProdForm.name,
        requires_android_id: Boolean(newProdForm.requires_android_id)
      },
      keysArray
    );

    setShowAddProductModal(false);
    setNewProdForm({
      category: 'ANDROID NON ROOT PANEL',
      panel_name: '',
      name: '',
      price_inr: 250,
      reseller_price: 150,
      validity: '7 Days',
      device_limit: '1 Device HWID',
      apk_link: '',
      keys: '',
      is_active: 1,
      delivery_mode: 'api_provider',
      provider_product_id: 'PID_FF_NONROOT_V1',
      provider_duration: '7 Days',
      requires_android_id: 0
    });
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setEditProdForm({
      category: prod.category,
      panel_name: prod.panel_name,
      name: prod.name,
      price_inr: prod.price_inr,
      reseller_price: prod.reseller_price,
      validity: prod.validity || prod.name,
      device_limit: prod.device_limit || '1 Device HWID',
      apk_link: prod.apk_link || '',
      is_active: prod.is_active,
      delivery_mode: prod.delivery_mode || 'api_provider',
      provider_product_id: prod.provider_product_id || 'PID_FF_NONROOT_V1',
      provider_duration: prod.provider_duration || prod.validity || prod.name,
      requires_android_id: prod.requires_android_id ? 1 : 0
    });
  };

  const handleUpdateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductId) return;

    updateProduct(editingProductId, {
      category: editProdForm.category,
      panel_name: editProdForm.panel_name,
      name: editProdForm.name,
      price_inr: Number(editProdForm.price_inr),
      reseller_price: Number(editProdForm.reseller_price),
      validity: editProdForm.validity || editProdForm.name,
      device_limit: editProdForm.device_limit,
      apk_link: editProdForm.apk_link,
      is_active: editProdForm.is_active,
      delivery_mode: editProdForm.delivery_mode,
      provider_product_id: editProdForm.provider_product_id,
      provider_duration: editProdForm.provider_duration || editProdForm.validity || editProdForm.name,
      requires_android_id: Boolean(editProdForm.requires_android_id)
    });

    setEditingProductId(null);
  };

  const handleInjectKeys = (productId: number) => {
    const keysArray = newKeysText.split('\n').map(k => k.trim()).filter(Boolean);
    if (keysArray.length === 0) return;
    injectProductKeys(productId, keysArray);
    setNewKeysText('');
    setShowAddKeysModal(null);
  };

  const handleDownloadUserList = () => {
    let content = "KALAM FF PANEL - DATABASE USER DUMP\n" + "=".repeat(80) + "\n\n";
    allUsers.forEach(u => {
      content += `UID: ${u.user_id} | NAME: ${u.first_name} | UNAME: @${u.username || 'None'} | BAL: ₹${u.balance.toFixed(2)} | ORDERS: ${u.orders_count} | VIP: ${u.is_vip ? 'YES' : 'NO'} | RESELLER: ${u.is_reseller ? 'YES' : 'NO'}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DB_USERS_${new Date().toISOString().substring(0, 10)}.txt`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Admin Top Navigation */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
            <Shield className="w-5 h-5 text-cyan-200" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Kalam FF Panel Admin Control
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Authorized
              </span>
            </h2>
            <p className="text-xs text-slate-400">Master Grid Configuration & Vault Terminal</p>
          </div>
        </div>

        {/* Global System Quick Toggles */}
        <div className="flex items-center gap-2">
          {/* Bot Maintenance Toggle */}
          <button
            type="button"
            onClick={() => updateSettings({ bot_status: settings.bot_status === 'ON' ? 'OFF' : 'ON' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              settings.bot_status === 'ON'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${settings.bot_status === 'ON' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            Bot: {settings.bot_status}
          </button>

          {/* VIP System Toggle */}
          <button
            type="button"
            onClick={() => updateSettings({ vip_status: settings.vip_status === 'ON' ? 'OFF' : 'ON' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              settings.vip_status === 'ON'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            VIP System: {settings.vip_status}
          </button>
        </div>
      </div>

      {/* Admin Tab Bar */}
      <div className="bg-slate-900/60 border-b border-slate-800 px-4 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
        {[
          { id: 'overview', label: 'Overview', icon: Zap },
          { id: 'products', label: `Products & Vault (${products.length})`, icon: Package },
          { id: 'users', label: `Users (${allUsers.length})`, icon: Users },
          { id: 'broadcast', label: '📢 Broadcast', icon: Megaphone },
          { id: 'tickets', label: `Tickets (${openTicketsCount})`, icon: TicketIcon, badge: openTicketsCount > 0 },
          { id: 'coupons', label: `Coupons (${coupons.length})`, icon: Tag },
          { id: 'gateways', label: 'Payment Gateways', icon: CreditCard },
          { id: 'emojis', label: 'Emojis & Texts', icon: Sparkles },
          { id: 'logs', label: 'Activity Logs', icon: FileText },
          { id: 'code', label: 'Python Source & DB', icon: Code2 }
        ].map(tab => {
          const IconC = tab.icon;
          const isActive = adminTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setAdminTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <IconC className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-28 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        {/* ================= OVERVIEW TAB ================= */}
        {adminTab === 'overview' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Gross Revenue</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl md:text-2xl font-bold text-white">₹{totalRevenue.toFixed(2)}</div>
                <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>{orders.length} total orders fulfilled</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Total Users</span>
                  <Users className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-xl md:text-2xl font-bold text-white">{allUsers.length}</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {totalResellers} Resellers • {totalVips} VIP Members
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Unused Vault Keys</span>
                  <Key className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl md:text-2xl font-bold text-white">{availableKeysCount}</div>
                <div className="text-[11px] text-amber-400 mt-1">
                  Across {products.length} product nodes
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Support Tickets</span>
                  <TicketIcon className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-xl md:text-2xl font-bold text-white">{openTicketsCount} Open</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {tickets.length} total tickets logged
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Quick Config & Gateways Status */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  Bot Configuration Status
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                    <span className="text-slate-400">FamPay UPI Gateway:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Active ({settings.fampay_upi_id})
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                    <span className="text-slate-400">Reseller Upgrade Fee:</span>
                    <span className="text-white font-bold">₹{settings.reseller_setup_fee.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                    <span className="text-slate-400">VIP Discount Rate:</span>
                    <span className="text-amber-400 font-bold">{settings.vip_discount_percentage}% OFF</span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                    <span className="text-slate-400">USDT Exchange Rate:</span>
                    <span className="text-cyan-300 font-bold">1 USDT = ₹{settings.usdt_to_inr}</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddProductModal(true)}
                    className="w-full py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow cursor-pointer transition"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Product Package
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadUserList}
                    className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export Full User Database Dump
                  </button>
                </div>
              </div>

              {/* Right Column: Live Activity Feed */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Live Activity Stream
                  </h3>
                  <span className="text-xs text-slate-400">{logs.length} events logged</span>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                  {logs.slice(0, 15).map(log => (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-cyan-400 font-bold">UID: {log.user_id}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-200">
                            {log.action}
                          </span>
                        </div>
                        {log.details && (
                          <p className="text-slate-300 mt-1 text-[11px]">{log.details}</p>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">{log.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= PRODUCTS & VAULT TAB ================= */}
        {adminTab === 'products' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-950 text-slate-200 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  <option value="ANDROID NON ROOT PANEL">ANDROID NON ROOT PANEL</option>
                  <option value="ANDROID ROOT PANEL">ANDROID ROOT PANEL</option>
                  <option value="PC PANEL">PC PANEL</option>
                </select>
              </div>

              {/* Add Product Button */}
              <button
                type="button"
                onClick={() => setShowAddProductModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs md:text-sm font-bold shadow-md cursor-pointer transition"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>

            {/* Products Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">ID / Category</th>
                      <th className="p-3.5">Panel Name</th>
                      <th className="p-3.5">Duration / Package</th>
                      <th className="p-3.5">User Price</th>
                      <th className="p-3.5">Reseller Price</th>
                      <th className="p-3.5">Stock</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredProducts.map(prod => {
                      const prodKeys = productKeys.filter(k => k.product_id === prod.id && !k.is_used);
                      return (
                        <tr key={prod.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3.5">
                            <div className="font-mono text-cyan-400 font-bold">#{prod.id}</div>
                            <div className="text-[11px] text-slate-400">{prod.category}</div>
                          </td>
                          <td className="p-3.5 font-bold text-white">{prod.panel_name}</td>
                          <td className="p-3.5">
                            <span className="font-semibold text-slate-200">{prod.name}</span>
                            <div className="text-[10px] text-slate-500">{prod.device_limit}</div>
                          </td>
                          <td className="p-3.5 font-bold text-emerald-400">₹{prod.price_inr.toFixed(2)}</td>
                          <td className="p-3.5 font-bold text-amber-300">₹{prod.reseller_price.toFixed(2)}</td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                              prodKeys.length > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                            }`}>
                              {prodKeys.length} Keys
                            </span>
                          </td>
                          <td className="p-3.5">
                            <button
                              type="button"
                              onClick={() => updateProduct(prod.id, { is_active: prod.is_active ? 0 : 1 })}
                              className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded cursor-pointer ${
                                prod.is_active ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 bg-slate-800'
                              }`}
                            >
                              {prod.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              <span>{prod.is_active ? 'Active' : 'Hidden'}</span>
                            </button>
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditProduct(prod)}
                              className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 rounded-lg transition cursor-pointer inline-flex items-center gap-1 text-xs font-semibold"
                              title="Edit Product & Duration"
                            >
                              <Edit3 className="w-4 h-4" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowAddKeysModal(prod.id)}
                              className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition cursor-pointer"
                            >
                              + Add Keys
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteProduct(prod.id)}
                              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-lg transition cursor-pointer"
                              title="Delete Product Node"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= USERS TAB ================= */}
        {adminTab === 'users' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Direct User Payment / Balance Credit Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/30 p-5 rounded-2xl shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Direct User Payment & Wallet Credit System
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                        Admin Instant Top-Up
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Credit any payment amount (₹) to any Telegram user. Syncs with Bot Database, Firestore, and notifies user in real-time.
                    </p>
                  </div>
                </div>
              </div>

              {/* Top-up Form */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                {/* User Selector / UID Input */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Target Telegram User</span>
                    <span className="text-[10px] text-cyan-400">Choose or Type ID</span>
                  </label>
                  <div className="space-y-1.5">
                    <select
                      value={directPayUserId}
                      onChange={(e) => setDirectPayUserId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Select Existing User --</option>
                      {allUsers.map(u => (
                        <option key={u.user_id} value={String(u.user_id)}>
                          UID: {u.user_id} | {u.first_name} (@{u.username || 'none'}) - Bal: ₹{u.balance}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={directPayUserId}
                      onChange={(e) => setDirectPayUserId(e.target.value)}
                      placeholder="Or enter any Telegram User ID (e.g. 12846461)..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-cyan-300 outline-none focus:border-emerald-500 placeholder:text-slate-600"
                    />
                  </div>
                </div>

                {/* Amount with Preset Buttons */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Payment Amount to Credit (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      value={directPayAmount}
                      onChange={(e) => setDirectPayAmount(e.target.value)}
                      placeholder="e.g. 100, 500, 1000..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-sm font-bold text-emerald-400 outline-none focus:border-emerald-500"
                    />
                  </div>
                  {/* Preset Amount Pills */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {['10', '50', '100', '200', '500', '1000', '2000', '5000'].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setDirectPayAmount(preset)}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                          directPayAmount === preset
                            ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        +₹{preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Method / Reason & Action */}
                <div className="md:col-span-4 space-y-1.5 flex flex-col justify-between">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">
                      Payment Reason / TXN Note
                    </label>
                    <select
                      value={directPayReason}
                      onChange={(e) => setDirectPayReason(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500 mb-1.5"
                    >
                      <option value="Direct UPI Payment">UPI / QR Code Transfer</option>
                      <option value="Google Pay (GPay) Payment">Google Pay (GPay)</option>
                      <option value="PhonePe Payment">PhonePe</option>
                      <option value="Paytm Wallet / UPI">Paytm</option>
                      <option value="Direct Bank Transfer / IMPS">Bank Transfer (IMPS/NEFT)</option>
                      <option value="Crypto USDT Deposit">Crypto USDT Deposit</option>
                      <option value="Bonus Credit / Cashback">Bonus Credit / Promo Reward</option>
                      <option value="Custom Note">Custom Note / TXN ID...</option>
                    </select>
                    {directPayReason === 'Custom Note' && (
                      <input
                        type="text"
                        value={directPayCustomReason}
                        onChange={(e) => setDirectPayCustomReason(e.target.value)}
                        placeholder="Enter custom TXN ID / Note..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
                      />
                    )}
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer mb-2 select-none">
                      <input
                        type="checkbox"
                        checked={directPayNotify}
                        onChange={(e) => setDirectPayNotify(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                      />
                      <span>⚡ Send Real-Time Telegram Receipt to User</span>
                    </label>

                    <button
                      type="button"
                      disabled={isProcessingPayment || !directPayUserId || !directPayAmount || Number(directPayAmount) <= 0}
                      onClick={async () => {
                        const targetUid = Number(directPayUserId);
                        const amt = Number(directPayAmount);
                        if (!targetUid || isNaN(targetUid) || !amt || isNaN(amt)) return;

                        setIsProcessingPayment(true);
                        setDirectPayStatus(null);
                        const finalReason = directPayReason === 'Custom Note' && directPayCustomReason.trim()
                          ? directPayCustomReason.trim()
                          : directPayReason;

                        try {
                          updateUserBalance(targetUid, amt, finalReason, directPayNotify);
                          const userObj = allUsers.find(u => u.user_id === targetUid);
                          const updatedBal = (userObj ? userObj.balance : 0) + amt;

                          setDirectPayStatus({
                            type: 'success',
                            text: `Successfully credited ₹${amt.toFixed(2)} to User #${targetUid}!`,
                            details: `New Balance: ₹${updatedBal.toFixed(2)} | Note: ${finalReason} | Telegram Alert: ${directPayNotify ? 'Sent' : 'Skipped'}`
                          });
                        } catch (err: any) {
                          setDirectPayStatus({
                            type: 'error',
                            text: `Failed to credit balance: ${err.message || 'Unknown error'}`
                          });
                        } finally {
                          setIsProcessingPayment(false);
                        }
                      }}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                        isProcessingPayment || !directPayUserId || !directPayAmount || Number(directPayAmount) <= 0
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50 hover:shadow-emerald-900/50'
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                      {isProcessingPayment ? 'Processing Credit...' : `Credit ₹${directPayAmount || '0'} to User Wallet`}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Alert Banner */}
              {directPayStatus && (
                <div className={`mt-3 p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                  directPayStatus.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}>
                  <div className="flex items-center gap-2">
                    {directPayStatus.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold block">{directPayStatus.text}</span>
                      {directPayStatus.details && (
                        <span className="text-[11px] opacity-80">{directPayStatus.details}</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDirectPayStatus(null)}
                    className="text-slate-400 hover:text-white text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Search & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by User ID, Name, or @username..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs md:text-sm text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="button"
                onClick={handleDownloadUserList}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs md:text-sm font-semibold cursor-pointer transition"
              >
                <Download className="w-4 h-4" />
                Export DB (.txt)
              </button>
            </div>

            {/* Users Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">User ID</th>
                      <th className="p-3.5">Name / Username</th>
                      <th className="p-3.5">Wallet Balance</th>
                      <th className="p-3.5">Level</th>
                      <th className="p-3.5">Orders / Spent</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.map(user => (
                      <tr key={user.user_id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5 font-mono text-cyan-400 font-bold">{user.user_id}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-white">{user.first_name}</div>
                          <div className="text-[11px] text-slate-400">@{user.username || 'none'}</div>
                        </td>
                        <td className="p-3.5 font-bold text-emerald-400 text-sm">₹{user.balance.toFixed(2)}</td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1 flex-wrap">
                            {user.is_vip ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                🌟 VIP
                              </span>
                            ) : null}
                            {user.is_reseller ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                👑 Reseller
                              </span>
                            ) : null}
                            {!user.is_vip && !user.is_reseller && (
                              <span className="text-slate-400 text-xs">Regular</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-200">{user.orders_count} orders</div>
                          <div className="text-[11px] text-slate-400">Spent: ₹{user.spent.toFixed(2)}</div>
                        </td>
                        <td className="p-3.5">
                          {user.is_banned ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              🚫 BANNED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              🟢 ACTIVE
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setDirectPayUserId(String(user.user_id));
                                setBalanceAdjustAmt('100');
                                setSelectedUserForModal(user.user_id);
                              }}
                              className="px-2.5 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Add / Credit Balance directly to this user"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>+ Add Money</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedUserForModal(user.user_id)}
                              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              Inspect & Modify
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= BROADCAST TAB ================= */}
        {adminTab === 'broadcast' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Broadcast Header & Stats Banner */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 border border-indigo-500/30 rounded-2xl p-5 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
                      <Megaphone className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        Global Telegram Broadcast & Announcement Engine
                      </h2>
                      <p className="text-xs text-slate-400">
                        Dispatch instant notifications, promotions, and media alerts with custom interactive buttons to all simulated and live Telegram bot users.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    {allUsers.length} Total Reachable Users
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('bot')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded-xl text-xs font-semibold cursor-pointer transition"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    View Bot Simulator
                  </button>
                </div>
              </div>
            </div>

            {/* Broadcast Status Notification if any */}
            {broadcastStatusMsg && (
              <div
                className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 shadow-lg ${
                  broadcastStatusMsg.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {broadcastStatusMsg.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold text-sm">{broadcastStatusMsg.text}</div>
                    {broadcastStatusMsg.details && (
                      <div className="text-[11px] opacity-85 mt-0.5">
                        {broadcastStatusMsg.details}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBroadcastStatusMsg(null)}
                  className="text-xs opacity-70 hover:opacity-100 px-2 py-1 bg-black/20 rounded-lg cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Two-Column Grid: Left Composer, Right Live Telegram Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Broadcast Dispatch Composer (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. Target Audience Selection */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      1. Target Audience Segment
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Selecting which users receive this transmission
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      {
                        id: 'all',
                        label: 'All Users',
                        count: allUsers.length,
                        badge: '100% Reach',
                        color: 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                      },
                      {
                        id: 'vip',
                        label: 'VIP Members',
                        count: allUsers.filter(u => u.is_vip === 1).length,
                        badge: 'VIP Only',
                        color: 'border-amber-500 bg-amber-500/10 text-amber-300'
                      },
                      {
                        id: 'reseller',
                        label: 'Resellers',
                        count: allUsers.filter(u => u.is_reseller === 1).length,
                        badge: 'Agents',
                        color: 'border-purple-500 bg-purple-500/10 text-purple-300'
                      },
                      {
                        id: 'non_reseller',
                        label: 'Regular Users',
                        count: allUsers.filter(u => u.is_reseller === 0).length,
                        badge: 'Retail',
                        color: 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                      }
                    ].map(aud => {
                      const isSelected = broadcastForm.targetAudience === aud.id;
                      return (
                        <button
                          key={aud.id}
                          type="button"
                          onClick={() => setBroadcastForm(prev => ({ ...prev, targetAudience: aud.id as any }))}
                          className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? `${aud.color} ring-2 ring-indigo-500/40 shadow-md`
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900/80'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-white">{aud.label}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 font-mono">
                              {aud.count}
                            </span>
                          </div>
                          <span className="text-[10px] opacity-75">{aud.badge}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Message Presets / Quick Loaders */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      2. Quick Message Templates
                    </label>
                    <span className="text-[11px] text-slate-400">Click to fill preset template</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      {
                        title: '⚡ Flash Restock',
                        text: `⚡ <b>NON-ROOT & ROOT PANELS RESTOCKED!</b> ⚡\n\nAll premium Free Fire key batches have been replenished in our vault.\n\n• Instant Key Delivery: <b>Under 2 Seconds</b>\n• Undetected Anti-Ban Algorithm\n• 24/7 Dedicated Support Desk\n\nUse button below to buy directly from bot!`,
                        img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
                        btnText: '🛒 Buy Keys Now',
                        btnUrl: 'https://t.me/kalam_ff_bot'
                      },
                      {
                        title: '🎁 50% Promo Code',
                        text: `🎉 <b>WEEKEND RECHARGE BONANZA!</b> 🎉\n\nClaim free wallet balance today!\n\nUse Promo Code: <code>KALAM50</code>\n\nReward: <b>₹50.00 Instant Balance</b>\nValid for next 100 redemptions only.\n\nGo to <b>Main Menu ➔ 🎟️ Redeem Code</b> to activate now!`,
                        img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
                        btnText: '🎟️ Redeem Code',
                        btnUrl: 'https://t.me/kalam_ff_bot'
                      },
                      {
                        title: '🛠️ Maintenance Alert',
                        text: `⚠️ <b>SYSTEM MAINTENANCE NOTICE</b>\n\nOur servers will undergo a scheduled 10-minute security upgrade at 02:00 AM IST.\n\n• Key generation remains active\n• Existing active panel keys are unaffected\n• UPI Gateway remains 100% online\n\nThank you for choosing Kalam FF Panel!`,
                        img: '',
                        btnText: '🎧 Support Desk',
                        btnUrl: 'https://t.me/kalam_ff_bot'
                      },
                      {
                        title: '👑 Reseller Special',
                        text: `👑 <b>SPECIAL RESELLER MARGIN UPDATE</b>\n\nWholesale prices for all Free Fire PC & Android injector keys have been reduced by <b>15%</b> for all registered Reseller Agents!\n\nUpgrade your account to VIP Reseller today for maximum profitability.`,
                        img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
                        btnText: '💼 Reseller Portal',
                        btnUrl: 'https://t.me/kalam_ff_bot'
                      }
                    ].map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setBroadcastForm(prev => ({
                            ...prev,
                            text: tpl.text,
                            imageUrl: tpl.img,
                            buttonText: tpl.btnText,
                            buttonUrl: tpl.btnUrl
                          }));
                        }}
                        className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/60 text-slate-300 text-xs font-semibold text-center transition cursor-pointer truncate"
                      >
                        {tpl.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Broadcast Content & Formatting Toolbar */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      3. Broadcast Message Body (HTML Supported)
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {broadcastForm.text.length} chars
                    </span>
                  </div>

                  {/* Formatting Quick Insert Toolbar */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 px-1">Insert:</span>
                    <button
                      type="button"
                      onClick={() => setBroadcastForm(p => ({ ...p, text: p.text + ' <b>Bold Text</b>' }))}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded border border-slate-700 font-bold cursor-pointer"
                    >
                      &lt;b&gt;Bold&lt;/b&gt;
                    </button>
                    <button
                      type="button"
                      onClick={() => setBroadcastForm(p => ({ ...p, text: p.text + ' <i>Italic Text</i>' }))}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded border border-slate-700 italic cursor-pointer"
                    >
                      &lt;i&gt;Italic&lt;/i&gt;
                    </button>
                    <button
                      type="button"
                      onClick={() => setBroadcastForm(p => ({ ...p, text: p.text + ' <code>PROMO_CODE</code>' }))}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded border border-slate-700 font-mono cursor-pointer"
                    >
                      &lt;code&gt;Code&lt;/code&gt;
                    </button>
                    <button
                      type="button"
                      onClick={() => setBroadcastForm(p => ({ ...p, text: p.text + ' <s>Strikethrough</s>' }))}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-700 line-through cursor-pointer"
                    >
                      &lt;s&gt;Strike&lt;/s&gt;
                    </button>

                    <div className="h-4 w-px bg-slate-800 mx-1" />

                    {['⚡', '🔥', '📢', '💎', '👑', '🎉', '✅', '⚠️'].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setBroadcastForm(p => ({ ...p, text: p.text + emoji }))}
                        className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 rounded border border-slate-700 cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={6}
                    value={broadcastForm.text}
                    onChange={(e) => setBroadcastForm(p => ({ ...p, text: e.target.value }))}
                    placeholder="Type your official announcement here. HTML tags like <b>, <i>, <code> are fully rendered..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs md:text-sm text-slate-200 outline-none focus:border-indigo-500 font-mono leading-relaxed"
                  />
                </div>

                {/* 4. Media Banner & Interactive Button Options */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                    4. Media Banner & Interactive Action Button
                  </label>

                  <div className="space-y-3 text-xs">
                    {/* Image URL Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400 font-semibold flex items-center gap-1">
                          <ImageIcon className="w-3 h-3 text-cyan-400" />
                          Banner Photo URL (Optional)
                        </span>
                        <div className="flex items-center gap-1 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setBroadcastForm(p => ({ ...p, imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80' }))}
                            className="text-cyan-400 hover:underline cursor-pointer"
                          >
                            Gaming Banner
                          </button>
                          <span className="text-slate-600">•</span>
                          <button
                            type="button"
                            onClick={() => setBroadcastForm(p => ({ ...p, imageUrl: '' }))}
                            className="text-rose-400 hover:underline cursor-pointer"
                          >
                            Remove Image
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={broadcastForm.imageUrl}
                        onChange={(e) => setBroadcastForm(p => ({ ...p, imageUrl: e.target.value }))}
                        placeholder="https://example.com/banner.jpg (Leave empty for pure text message)"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Inline Button Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-slate-400 font-semibold block mb-1 flex items-center gap-1">
                          <LinkIcon className="w-3 h-3 text-emerald-400" />
                          Button Text Label (Optional)
                        </span>
                        <input
                          type="text"
                          value={broadcastForm.buttonText}
                          onChange={(e) => setBroadcastForm(p => ({ ...p, buttonText: e.target.value }))}
                          placeholder="e.g. 🛒 Open Store & Buy"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block mb-1">
                          Button Target URL (Optional)
                        </span>
                        <input
                          type="text"
                          value={broadcastForm.buttonUrl}
                          onChange={(e) => setBroadcastForm(p => ({ ...p, buttonUrl: e.target.value }))}
                          placeholder="e.g. https://t.me/kalam_ff_bot"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Pin Checkbox */}
                    <div className="pt-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="pinMsgCheck"
                        checked={broadcastForm.pinMessage}
                        onChange={(e) => setBroadcastForm(p => ({ ...p, pinMessage: e.target.checked }))}
                        className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="pinMsgCheck" className="text-xs text-slate-300 font-semibold cursor-pointer flex items-center gap-1.5">
                        <Pin className="w-3.5 h-3.5 text-amber-400" />
                        Pin this announcement at top of chat stream
                      </label>
                    </div>
                  </div>
                </div>

                {/* 5. Dispatch Action Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={sendingBroadcast || !broadcastForm.text.trim()}
                    onClick={async () => {
                      if (!broadcastForm.text.trim()) return;
                      setSendingBroadcast(true);
                      setBroadcastStatusMsg(null);
                      try {
                        const res = await sendBroadcastMessage({
                          targetAudience: broadcastForm.targetAudience,
                          text: broadcastForm.text,
                          imageUrl: broadcastForm.imageUrl,
                          buttonText: broadcastForm.buttonText,
                          buttonUrl: broadcastForm.buttonUrl,
                          pinMessage: broadcastForm.pinMessage
                        });

                        const targetLabel =
                          broadcastForm.targetAudience === 'all'
                            ? `All Users (${res.recipientCount})`
                            : broadcastForm.targetAudience === 'vip'
                            ? `VIP Members (${res.recipientCount})`
                            : broadcastForm.targetAudience === 'reseller'
                            ? `Resellers (${res.recipientCount})`
                            : `Regular Users (${res.recipientCount})`;

                        setBroadcastHistory(prev => [
                          {
                            id: `bcast_${Date.now()}`,
                            target: targetLabel,
                            text: broadcastForm.text,
                            time: 'Just now',
                            count: res.recipientCount
                          },
                          ...prev
                        ]);

                        setBroadcastStatusMsg({
                          type: 'success',
                          text: `Broadcast successfully dispatched!`,
                          details: `Delivered to ${res.recipientCount} recipient(s). Check the simulated Telegram Bot client to view it live!`
                        });
                      } catch (err: any) {
                        setBroadcastStatusMsg({
                          type: 'error',
                          text: 'Failed to send broadcast',
                          details: err.message
                        });
                      } finally {
                        setSendingBroadcast(false);
                      }
                    }}
                    className={`w-full py-3.5 rounded-2xl text-sm font-bold shadow-xl flex items-center justify-center gap-2 transition cursor-pointer ${
                      sendingBroadcast || !broadcastForm.text.trim()
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-indigo-600/30'
                    }`}
                  >
                    {sendingBroadcast ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Dispatching Transmission to Telegram Users...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>
                          📢 Dispatch Broadcast (
                          {broadcastForm.targetAudience === 'all'
                            ? `${allUsers.length} Users`
                            : broadcastForm.targetAudience === 'vip'
                            ? `${allUsers.filter(u => u.is_vip === 1).length} VIPs`
                            : broadcastForm.targetAudience === 'reseller'
                            ? `${allUsers.filter(u => u.is_reseller === 1).length} Resellers`
                            : `${allUsers.filter(u => u.is_reseller === 0).length} Regulars`}
                          )
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Column: Live Mobile Telegram Message Card Preview (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                        Live Telegram UI Preview
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                      Mobile Card View
                    </span>
                  </div>

                  {/* Simulated Telegram Message Container */}
                  <div className="bg-[#0f172a] rounded-2xl p-3.5 border border-slate-800 shadow-inner space-y-3">
                    {/* Simulated Telegram Message Bubble */}
                    <div className="bg-[#1e293b] rounded-2xl p-3.5 border border-slate-700/70 shadow-lg space-y-3">
                      {/* Sender Tag with Verified Check */}
                      <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-700/50">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-[10px]">
                            K
                          </div>
                          <div>
                            <span className="font-bold text-cyan-400 text-xs">KALAM FF BOT</span>
                            <span className="text-[10px] text-slate-400 ml-1">✓ bot</span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 uppercase tracking-wider">
                          📢 Broadcast
                        </span>
                      </div>

                      {/* Photo Banner preview */}
                      {broadcastForm.imageUrl && broadcastForm.imageUrl.trim() && (
                        <div className="rounded-xl overflow-hidden border border-slate-700/60 max-h-48 bg-slate-950 flex items-center justify-center">
                          <img
                            src={broadcastForm.imageUrl}
                            alt="Broadcast banner"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      {/* Rendered HTML Text */}
                      <div className="text-xs md:text-sm text-slate-100 leading-relaxed font-sans select-text break-words">
                        {formatTelegramHTML(broadcastForm.text || '<i>Empty message body</i>')}
                      </div>

                      {/* Interactive Button Preview */}
                      {broadcastForm.buttonText && (
                        <div className="pt-1">
                          <a
                            href={broadcastForm.buttonUrl || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2.5 px-3 bg-gradient-to-r from-blue-600/90 to-indigo-600/90 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 transition no-underline block text-center"
                          >
                            <span>{broadcastForm.buttonText}</span>
                            <ExternalLink className="w-3 h-3 opacity-80" />
                          </a>
                        </div>
                      )}

                      {/* Message Footer: Timestamp & Double Checkmarks */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          {broadcastForm.pinMessage && (
                            <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
                              <Pin className="w-2.5 h-2.5" /> Pinned
                            </span>
                          )}
                        </span>
                        <span className="font-mono flex items-center gap-1">
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <span className="text-cyan-400 font-bold">✓✓</span>
                        </span>
                      </div>
                    </div>

                    {/* Simulation Switcher Box */}
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 block">
                        👤 Current Simulated Client Identity:
                      </span>
                      <div className="flex items-center justify-between gap-2">
                        <select
                          value={currentUser.user_id}
                          onChange={(e) => setCurrentUserId(Number(e.target.value))}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 outline-none"
                        >
                          {allUsers.map(u => (
                            <option key={u.user_id} value={u.user_id}>
                              {u.first_name} (UID: {u.user_id}) - {u.is_vip ? 'VIP' : u.is_reseller ? 'Reseller' : 'Regular'}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setActiveTab('bot')}
                          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold cursor-pointer transition shrink-0"
                        >
                          Open Chat
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        When you dispatch a broadcast, it is automatically pushed to all users matching your target audience in the client chat simulator.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Broadcast Dispatch History */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      Recent Broadcast Dispatch Logs
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {broadcastHistory.length} Sent
                    </span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {broadcastHistory.map((bh) => (
                      <div
                        key={bh.id}
                        className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-indigo-300">{bh.target}</span>
                          <span className="text-slate-500">{bh.time}</span>
                        </div>
                        <p className="text-slate-300 text-[11px] line-clamp-2 font-mono">
                          {bh.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TICKETS TAB ================= */}
        {adminTab === 'tickets' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TicketIcon className="w-5 h-5 text-indigo-400" />
                Support Ticket Resolution Desk
              </h3>
              <span className="text-xs text-slate-400">{tickets.length} total tickets</span>
            </div>

            <div className="space-y-4">
              {tickets.map(t => (
                <div
                  key={t.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">Ticket #{t.id}</span>
                      <span className="text-xs text-cyan-400 font-mono">From UID: {t.user_id}</span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      t.status === 'Open' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  <p className="text-xs md:text-sm text-slate-200 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    {t.message}
                  </p>

                  {t.admin_reply && (
                    <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-xs text-indigo-200">
                      <span className="font-bold block mb-0.5">Admin Response:</span>
                      <span>{t.admin_reply}</span>
                    </div>
                  )}

                  {t.status === 'Open' && (
                    <div className="pt-2 flex items-center gap-2">
                      {replyTicketId === t.id ? (
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            value={ticketReplyText}
                            onChange={(e) => setTicketReplyText(e.target.value)}
                            placeholder="Type resolution reply..."
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!ticketReplyText.trim()) return;
                              replyToTicket(t.id, ticketReplyText);
                              setReplyTicketId(null);
                              setTicketReplyText('');
                            }}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 cursor-pointer"
                          >
                            Send & Close
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setReplyTicketId(t.id)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                          >
                            Reply to User
                          </button>
                          <button
                            type="button"
                            onClick={() => closeTicket(t.id)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                          >
                            Close Ticket
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= COUPONS TAB ================= */}
        {adminTab === 'coupons' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Create Coupon Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-pink-400" />
                Generate New VIP / Promo Code
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Promo Code</label>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. VIPFREE50"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono uppercase text-pink-300 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Reward Amount (₹)</label>
                  <input
                    type="number"
                    value={couponAmount}
                    onChange={(e) => setCouponAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Max Usage Limit</label>
                  <input
                    type="number"
                    value={couponUses}
                    onChange={(e) => setCouponUses(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!couponCode) return;
                  createNewCoupon(couponCode, Number(couponAmount), Number(couponUses));
                  setCouponCode('');
                }}
                className="w-full py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer"
              >
                Encode & Arm Promo Code
              </button>
            </div>

            {/* Active Coupons Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase">
                  <tr>
                    <th className="p-3.5">Code</th>
                    <th className="p-3.5">Reward Payload</th>
                    <th className="p-3.5">Uses Left</th>
                    <th className="p-3.5 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {coupons.map(c => (
                    <tr key={c.code} className="hover:bg-slate-800/40">
                      <td className="p-3.5 font-mono font-bold text-pink-400">{c.code}</td>
                      <td className="p-3.5 font-bold text-emerald-400">₹{c.amount.toFixed(2)}</td>
                      <td className="p-3.5 text-slate-200">{c.uses_left} / {c.total_uses}</td>
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => deleteCoupon(c.code)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 rounded cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= GATEWAYS & SETTINGS TAB ================= */}
        {adminTab === 'gateways' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Telegram Bot Credentials & Master Config */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-cyan-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                    🤖
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Telegram Bot Token & Admin ID Setup
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Configure your Telegram Bot token from @BotFather and Master Admin numeric ID
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTelegramHelpModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  How to get Credentials?
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Bot Token Input */}
                <div className="sm:col-span-2 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-cyan-400" />
                      Telegram Bot Token (HTTP API Token)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowBotToken(!showBotToken)}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {showBotToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {showBotToken ? 'Hide' : 'Show'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(settings.bot_token, 'Bot Token')}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-semibold"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedItem === 'Bot Token' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <input
                    type={showBotToken ? 'text' : 'password'}
                    value={settings.bot_token || ''}
                    onChange={(e) => updateSettings({ bot_token: e.target.value })}
                    placeholder="7928194012:AAH9bK8xP..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 outline-none font-mono text-xs focus:border-cyan-400"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Obtain from <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">@BotFather</a> on Telegram with <code className="text-slate-300">/newbot</code> command.
                  </p>
                </div>

                {/* Bot Username */}
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                      Bot Username
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCopy(settings.bot_username || '', 'Bot Username')}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedItem === 'Bot Username' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={settings.bot_username || ''}
                    onChange={(e) => updateSettings({ bot_username: e.target.value })}
                    placeholder="KalamFFPanelBot"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none font-mono text-xs focus:border-blue-400"
                  />
                </div>

                {/* Master Admin ID */}
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      Master Admin Numeric ID
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCopy(String(settings.admin_id || ''), 'Admin ID')}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedItem === 'Admin ID' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <input
                    type="number"
                    value={settings.admin_id ?? ''}
                    onChange={(e) => updateSettings({ admin_id: Number(e.target.value) })}
                    placeholder="12846461"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-bold outline-none font-mono text-xs focus:border-amber-400"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Find numeric ID via <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">@userinfobot</a> on Telegram.
                  </p>
                </div>

                {/* Admin Contact Handle */}
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 sm:col-span-2">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5 mb-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    Admin Telegram Handle (Display Contact)
                  </label>
                  <input
                    type="text"
                    value={settings.admin_contact || ''}
                    onChange={(e) => updateSettings({ admin_contact: e.target.value })}
                    placeholder="@kalam172010"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-emerald-300 outline-none font-mono text-xs focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Live Connection Controls & Tester */}
              <div className="bg-slate-950/90 border border-cyan-500/20 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        botStatus?.isConnected ? 'bg-emerald-400' : (botStatus?.isRunning ? 'bg-amber-400' : 'bg-slate-500')
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${
                        botStatus?.isConnected ? 'bg-emerald-500' : (botStatus?.isRunning ? 'bg-amber-500' : 'bg-slate-600')
                      }`}></span>
                    </span>
                    <span className="text-xs font-bold text-white">
                      Live Bot Engine: {botStatus?.isConnected ? `ONLINE (@${botStatus.botInfo?.username || 'Bot'})` : (botStatus?.isRunning ? 'POLLING STANDBY' : 'OFFLINE')}
                    </span>
                    {botStatus?.updatesProcessed !== undefined && (
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                        {botStatus.updatesProcessed} updates handled
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Test Token Button */}
                    <button
                      type="button"
                      disabled={testingToken}
                      onClick={async () => {
                        setTestingToken(true);
                        setTestStatusMsg(null);
                        const res = await testTelegramBotToken();
                        setTestingToken(false);
                        if (res.success) {
                          setTestStatusMsg({
                            type: 'success',
                            text: `✅ Telegram Token is VALID! Connected to @${res.bot?.username} (${res.bot?.first_name}). The live Telegram Bot is now responding in Telegram!`
                          });
                        } else {
                          setTestStatusMsg({
                            type: 'error',
                            text: `❌ Connection Failed: ${res.error || 'Invalid token or network timeout'}`
                          });
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {testingToken ? 'Testing API...' : 'Test Bot Token'}
                    </button>

                    {/* Send Admin Test Msg */}
                    <button
                      type="button"
                      disabled={sendingTestMsg}
                      onClick={async () => {
                        setSendingTestMsg(true);
                        setTestStatusMsg(null);
                        const res = await sendAdminTestMessage();
                        setSendingTestMsg(false);
                        if (res.success) {
                          setTestStatusMsg({
                            type: 'success',
                            text: `🚀 Test notification sent successfully to Telegram ID: ${settings.admin_id}! Check your Telegram app.`
                          });
                        } else {
                          setTestStatusMsg({
                            type: 'error',
                            text: `❌ Failed to send Telegram message: ${res.error || 'Ensure Admin ID is correct and start the bot on Telegram first'}`
                          });
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      {sendingTestMsg ? 'Sending...' : 'Send Test Msg to Telegram'}
                    </button>

                    {/* Restart Engine */}
                    <button
                      type="button"
                      disabled={restartingEngine}
                      onClick={async () => {
                        setRestartingEngine(true);
                        await restartBotEngine();
                        setRestartingEngine(false);
                        setTestStatusMsg({
                          type: 'success',
                          text: '🔄 Telegram Bot Engine restarted successfully!'
                        });
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition cursor-pointer"
                      title="Restart Polling Engine"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${restartingEngine ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Status Notice */}
                {testStatusMsg && (
                  <div className={`p-3 rounded-xl text-xs flex items-start justify-between gap-2 ${
                    testStatusMsg.type === 'success'
                      ? 'bg-emerald-950/80 border border-emerald-500/30 text-emerald-200'
                      : 'bg-rose-950/80 border border-rose-500/30 text-rose-200'
                  }`}>
                    <span>{testStatusMsg.text}</span>
                    <button
                      type="button"
                      onClick={() => setTestStatusMsg(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* FamGateway Automated Payment Setup */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      FamGateway Automatic UPI Payment System
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        famgateway.in API
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Automated UPI order creation, webhook callback & real-time wallet crediting
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="https://famgateway.in"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800"
                  >
                    <span>FamGateway Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Form fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400 font-semibold">FamGateway API Key (Bearer Token)</label>
                    <button
                      type="button"
                      onClick={() => setShowFamGatewayKey(!showFamGatewayKey)}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      {showFamGatewayKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showFamGatewayKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showFamGatewayKey ? 'text' : 'password'}
                    value={settings.famgateway_api_key || settings.fampay_api_key || ''}
                    onChange={(e) => updateSettings({
                      famgateway_api_key: e.target.value,
                      fampay_api_key: e.target.value
                    })}
                    placeholder="Enter FamGateway Bearer API Key"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none font-mono text-xs focus:border-emerald-400"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    API Endpoint: <code>POST https://famgateway.in/api/create-order.php</code>
                  </p>
                </div>

                <div>
                  <label className="text-slate-400 mb-1 block font-semibold">Success Redirect URL</label>
                  <input
                    type="text"
                    value={settings.famgateway_redirect_url || ''}
                    onChange={(e) => updateSettings({ famgateway_redirect_url: e.target.value })}
                    placeholder={`https://t.me/${settings.bot_username || 'KalamFFPanelBot'}`}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none font-mono text-xs focus:border-emerald-400"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Where users return after completing payment
                  </p>
                </div>

                <div>
                  <label className="text-slate-400 mb-1 block font-semibold">UPI ID (Fallback & Manual Mode)</label>
                  <input
                    type="text"
                    value={settings.fampay_upi_id || ''}
                    onChange={(e) => updateSettings({ fampay_upi_id: e.target.value })}
                    placeholder="kalampanel@fam"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-300 outline-none font-mono text-xs focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-slate-400 mb-1 block font-semibold">Instant Webhook Callback URL</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/api/famgateway-webhook`}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-slate-400 font-mono text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(`${window.location.origin}/api/famgateway-webhook`, 'webhook')}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedItem === 'webhook' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedItem === 'webhook' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Paste this into your FamGateway Merchant Webhook Settings
                  </p>
                </div>
              </div>

              {/* Action Buttons: Test API Key & Create Test Order */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    FamGateway Live Verification & Diagnostics
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Test Key Button */}
                    <button
                      type="button"
                      disabled={testingFamGateway}
                      onClick={async () => {
                        setTestingFamGateway(true);
                        setFamGatewayStatusMsg(null);
                        const res = await testFamGatewayKey();
                        setTestingFamGateway(false);
                        if (res.success) {
                          setFamGatewayStatusMsg({
                            type: 'success',
                            text: res.message || '✅ FamGateway API Key is valid and reachable!'
                          });
                        } else {
                          setFamGatewayStatusMsg({
                            type: 'error',
                            text: res.message || '❌ FamGateway connection error. Check your API key.'
                          });
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      {testingFamGateway ? 'Testing API...' : 'Test FamGateway Key'}
                    </button>

                    {/* Create Test Order Button */}
                    <button
                      type="button"
                      disabled={creatingTestOrder}
                      onClick={async () => {
                        setCreatingTestOrder(true);
                        setFamGatewayStatusMsg(null);
                        const res = await createFamGatewayOrder(10);
                        setCreatingTestOrder(false);
                        if (res.success) {
                          setTestOrderResult(res);
                          setFamGatewayStatusMsg({
                            type: 'success',
                            text: `🚀 Test ₹10 Order Created! Order ID: ${res.order_id}`
                          });
                        } else {
                          setFamGatewayStatusMsg({
                            type: 'error',
                            text: `❌ Order Creation Failed: ${res.error || 'Unknown error'}`
                          });
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      {creatingTestOrder ? 'Creating...' : 'Create Test ₹10 Order'}
                    </button>
                  </div>
                </div>

                {/* Status Notice */}
                {famGatewayStatusMsg && (
                  <div className={`p-3 rounded-xl text-xs flex items-start justify-between gap-2 ${
                    famGatewayStatusMsg.type === 'success'
                      ? 'bg-emerald-950/80 border border-emerald-500/30 text-emerald-200'
                      : 'bg-rose-950/80 border border-rose-500/30 text-rose-200'
                  }`}>
                    <span>{famGatewayStatusMsg.text}</span>
                    <button
                      type="button"
                      onClick={() => setFamGatewayStatusMsg(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Test Order Preview Details */}
                {testOrderResult && (
                  <div className="p-3 bg-slate-900 border border-cyan-500/30 rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between text-cyan-300 font-bold">
                      <span>Order Details (# {testOrderResult.order_id})</span>
                      <button
                        type="button"
                        onClick={() => setTestOrderResult(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                      <div><b>Amount:</b> ₹{testOrderResult.amount}</div>
                      <div><b>Order ID:</b> <code>{testOrderResult.order_id}</code></div>
                      {testOrderResult.payment_url && (
                        <div className="sm:col-span-2">
                          <b>Payment Link:</b>{' '}
                          <a
                            href={testOrderResult.payment_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 underline break-all"
                          >
                            {testOrderResult.payment_url}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* BantiBhaiya Reseller Key Provider Setup */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      BantiBhaiya API Automated Key Delivery
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                        bantibhaiya.to/api/reseller_v1.php
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Instant upstream license key generation with device-bound (V1 HWID) and device-free (V2) support
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateSettings({ bantibhaiya_status: settings.bantibhaiya_status === 'ON' ? 'OFF' : 'ON' })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      settings.bantibhaiya_status === 'ON'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {settings.bantibhaiya_status === 'ON' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    Provider: {settings.bantibhaiya_status}
                  </button>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* API URL */}
                  <div>
                    <label className="text-slate-400 mb-1 block font-semibold">Reseller API Endpoint URL</label>
                    <input
                      type="text"
                      value={settings.bantibhaiya_api_url || 'https://bantibhaiya.to/api/reseller_v1.php'}
                      onChange={(e) => updateSettings({ bantibhaiya_api_url: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500 font-mono text-[11px]"
                    />
                  </div>

                  {/* Reseller API Key */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-400 font-semibold">Reseller API Key (api_key)</label>
                      <button
                        type="button"
                        onClick={() => setShowProviderKey(!showProviderKey)}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300"
                      >
                        {showProviderKey ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <input
                      type={showProviderKey ? 'text' : 'password'}
                      value={settings.bantibhaiya_api_key || '87224c074a021676364829b5b3f0686e'}
                      onChange={(e) => updateSettings({ bantibhaiya_api_key: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-indigo-300 outline-none focus:border-indigo-500 font-mono text-[11px]"
                    />
                  </div>

                  {/* Master Key Header */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-400 font-semibold">Master Auth Header (x-master-key)</label>
                      <button
                        type="button"
                        onClick={() => setShowMasterKey(!showMasterKey)}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300"
                      >
                        {showMasterKey ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <input
                      type={showMasterKey ? 'text' : 'password'}
                      value={settings.bantibhaiya_master_key || 'a7f3e8b2c9d1f4a6b8c2d5e9f1a3b6c8'}
                      onChange={(e) => updateSettings({ bantibhaiya_master_key: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 outline-none focus:border-amber-500 font-mono text-[11px]"
                    />
                  </div>
                </div>

                {/* Auto Fallback Toggle & Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoFallbackCheck"
                      checked={settings.provider_auto_fallback !== false}
                      onChange={(e) => updateSettings({ provider_auto_fallback: e.target.checked })}
                      className="rounded accent-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="autoFallbackCheck" className="text-slate-300 cursor-pointer font-semibold">
                      Enable Hybrid Fallback to Local Key Vault if upstream Provider API is unreachable or out of credits
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Test Connection Button */}
                    <button
                      type="button"
                      disabled={testingProvider}
                      onClick={async () => {
                        setTestingProvider(true);
                        setProviderStatusMsg(null);
                        const res = await testProviderConnection();
                        setTestingProvider(false);
                        if (res.success) {
                          setProviderStatusMsg({
                            type: 'success',
                            text: `✅ Connection to BantiBhaiya Reseller Gateway is ACTIVE! (${res.message || 'Server OK'})`
                          });
                        } else {
                          setProviderStatusMsg({
                            type: 'error',
                            text: `❌ Provider Connection Failed: ${res.message || 'Check API endpoint or network timeout'}`
                          });
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {testingProvider ? 'Connecting...' : 'Test Provider Connection'}
                    </button>
                  </div>
                </div>

                {/* Live Test Key Generator Sandbox */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Live Key Generation Sandbox
                    </span>
                    <span className="text-[10px] text-slate-400">Direct Upstream Simulation</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 mb-1 block">Product PID</label>
                      <input
                        type="text"
                        value={testKeyParams.productId}
                        onChange={(e) => setTestKeyParams({ ...testKeyParams, productId: e.target.value })}
                        placeholder="PRODUCT_PID_ID"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 mb-1 block">Duration</label>
                      <select
                        value={testKeyParams.duration}
                        onChange={(e) => setTestKeyParams({ ...testKeyParams, duration: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
                      >
                        <option value="1 Hours">1 Hours</option>
                        <option value="3 Hours">3 Hours</option>
                        <option value="1 Day">1 Day</option>
                        <option value="7 Days">7 Days</option>
                        <option value="30 Days">30 Days</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 mb-1 block">Android ID (Optional / V1)</label>
                      <input
                        type="text"
                        value={testKeyParams.androidId}
                        onChange={(e) => setTestKeyParams({ ...testKeyParams, androidId: e.target.value })}
                        placeholder="0b9b969bc2e7997b"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={generatingTestKey}
                      onClick={async () => {
                        setGeneratingTestKey(true);
                        setProviderStatusMsg(null);
                        setTestKeyResult(null);
                        const res = await buyProviderKeyDirect({
                          productId: testKeyParams.productId,
                          duration: testKeyParams.duration,
                          androidId: testKeyParams.androidId || undefined
                        });
                        setGeneratingTestKey(false);
                        if (res.success && res.key) {
                          setTestKeyResult(res);
                          setProviderStatusMsg({
                            type: 'success',
                            text: `🎉 License Key Generated Successfully! Key: ${res.key}`
                          });
                        } else {
                          setProviderStatusMsg({
                            type: 'error',
                            text: `❌ Generation Error: ${res.error || res.message || 'Failed to dispatch buy action'}`
                          });
                        }
                      }}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50"
                    >
                      <Key className="w-3.5 h-3.5" />
                      {generatingTestKey ? 'Generating Key...' : 'Dispatch "buy" Action'}
                    </button>
                  </div>

                  {testKeyResult && (
                    <div className="p-3 bg-slate-900 border border-amber-500/30 rounded-lg space-y-1">
                      <div className="flex items-center justify-between text-amber-300 font-bold">
                        <span>Generated Key Result</span>
                        <button
                          type="button"
                          onClick={() => setTestKeyResult(null)}
                          className="text-slate-400 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="font-mono text-emerald-400 bg-black/40 p-2 rounded text-sm select-all">
                        {testKeyResult.key}
                      </div>
                      {testKeyResult.orderId && (
                        <div className="text-[11px] text-slate-400">Order Ref: <code>{testKeyResult.orderId}</code></div>
                      )}
                    </div>
                  )}
                </div>

                {/* Status Notice */}
                {providerStatusMsg && (
                  <div className={`p-3 rounded-xl text-xs flex items-start justify-between gap-2 ${
                    providerStatusMsg.type === 'success'
                      ? 'bg-emerald-950/80 border border-emerald-500/30 text-emerald-200'
                      : 'bg-rose-950/80 border border-rose-500/30 text-rose-200'
                  }`}>
                    <span>{providerStatusMsg.text}</span>
                    <button
                      type="button"
                      onClick={() => setProviderStatusMsg(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Reseller & VIP Rules */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                Reseller & VIP Economics
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 mb-1 block">Reseller Setup Fee (₹)</label>
                  <input
                    type="number"
                    value={settings.reseller_setup_fee ?? ''}
                    onChange={(e) => updateSettings({ reseller_setup_fee: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 mb-1 block">Min Balance for Reseller (₹)</label>
                  <input
                    type="number"
                    value={settings.reseller_min_balance ?? ''}
                    onChange={(e) => updateSettings({ reseller_min_balance: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 mb-1 block">VIP Lifetime Price (₹)</label>
                  <input
                    type="number"
                    value={settings.vip_price_inr ?? ''}
                    onChange={(e) => updateSettings({ vip_price_inr: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Support Links */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                Support Contacts & Tutorials
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 mb-1 block">Telegram Support URL</label>
                  <input
                    type="text"
                    value={settings.support_telegram || ''}
                    onChange={(e) => updateSettings({ support_telegram: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 mb-1 block">WhatsApp Support URL</label>
                  <input
                    type="text"
                    value={settings.support_whatsapp || ''}
                    onChange={(e) => updateSettings({ support_whatsapp: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 mb-1 block">Tutorial Video Link</label>
                  <input
                    type="text"
                    value={settings.how_to_video || ''}
                    onChange={(e) => updateSettings({ how_to_video: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= EMOJIS & UI TEXTS TAB ================= */}
        {adminTab === 'emojis' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* UI Text Templates */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Custom UI Template Messages
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 mb-1 block font-semibold">Start Menu Template</label>
                  <textarea
                    rows={6}
                    value={settings.ui_start_menu || ''}
                    onChange={(e) => updateSettings({ ui_start_menu: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 font-mono text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 mb-1 block font-semibold">VIP Menu Template</label>
                  <textarea
                    rows={4}
                    value={settings.ui_vip_menu || ''}
                    onChange={(e) => updateSettings({ ui_vip_menu: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 font-mono text-xs outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Custom Emoji Slots */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Telegram Custom Emoji IDs
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                {Object.entries(emojis).map(([slot, emojiId]) => (
                  <div key={slot} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <label className="text-slate-400 block mb-1 font-mono text-[11px] truncate">{slot}</label>
                    <input
                      type="text"
                      value={emojiId || ''}
                      onChange={(e) => updateEmojiSlot(slot, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 font-mono text-xs outline-none focus:border-amber-400"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= ACTIVITY LOGS TAB ================= */}
        {adminTab === 'logs' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                Full Audit Trail & Logs
              </h3>
              <span className="text-xs text-slate-400">{logs.length} events logged</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/60 overflow-hidden">
              {logs.map(log => (
                <div key={log.id} className="p-3.5 flex items-start justify-between gap-4 text-xs hover:bg-slate-800/40 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-400 font-bold">UID: {log.user_id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200">
                        {log.action}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs">{log.details}</p>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono shrink-0">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= PYTHON SOURCE CODE TAB ================= */}
        {adminTab === 'code' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    Python Aiogram Bot Source File (bot.py)
                  </h3>
                  <p className="text-xs text-slate-400">Ready to deploy to VPS, Railway, Heroku, or Linux system</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([getPythonSourceCode(settings, emojis)], { type: 'text/x-python' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'kalam_bot.py';
                    a.click();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download bot.py
                </button>
              </div>

              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto max-h-[500px] leading-relaxed select-all">
                {getPythonSourceCode(settings, emojis)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* ================= USER INSPECT & MODIFY MODAL ================= */}
      {selectedUserForModal && (() => {
        const u = allUsers.find(user => user.user_id === selectedUserForModal);
        if (!u) return null;

        return (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">{u.first_name}</h3>
                  <p className="text-xs text-cyan-400 font-mono">UID: {u.user_id} (@{u.username})</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUserForModal(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Wallet Balance</span>
                  <span className="text-lg font-bold text-emerald-400">₹{u.balance.toFixed(2)}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Total Spent</span>
                  <span className="text-lg font-bold text-white">₹{u.spent.toFixed(2)}</span>
                </div>
              </div>

              {/* Balance Modifier & Payment Credit */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Add / Modify User Balance</span>
                  </label>
                  <span className="text-[10px] text-emerald-400 font-semibold">Real-time Telegram Sync</span>
                </div>

                {/* Preset Amount Pills */}
                <div className="flex flex-wrap gap-1">
                  {['10', '50', '100', '200', '500', '1000', '2000', '5000'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBalanceAdjustAmt(preset)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                        balanceAdjustAmt === preset
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      +₹{preset}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                      <input
                        type="number"
                        value={balanceAdjustAmt}
                        onChange={(e) => setBalanceAdjustAmt(e.target.value)}
                        placeholder="Amount (₹)"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs font-bold text-emerald-400 outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    value={balanceAdjustReason}
                    onChange={(e) => setBalanceAdjustReason(e.target.value)}
                    placeholder="Reason / Note (e.g., Manual UPI payment, GPay #1234)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
                  />

                  <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={balanceNotifyTg}
                      onChange={(e) => setBalanceNotifyTg(e.target.checked)}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <span>Notify user instantly on Telegram with receipt</span>
                  </label>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      disabled={!balanceAdjustAmt || Number(balanceAdjustAmt) <= 0}
                      onClick={() => {
                        const amt = Number(balanceAdjustAmt);
                        if (!amt || amt <= 0) return;
                        updateUserBalance(u.user_id, amt, balanceAdjustReason, balanceNotifyTg);
                        setModalBalanceStatus(`Credited +₹${amt.toFixed(2)} to ${u.first_name}!`);
                        setTimeout(() => setModalBalanceStatus(null), 3000);
                      }}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Funds (+₹{balanceAdjustAmt || '0'})
                    </button>
                    <button
                      type="button"
                      disabled={!balanceAdjustAmt || Number(balanceAdjustAmt) <= 0}
                      onClick={() => {
                        const amt = Number(balanceAdjustAmt);
                        if (!amt || amt <= 0) return;
                        updateUserBalance(u.user_id, -amt, balanceAdjustReason, balanceNotifyTg);
                        setModalBalanceStatus(`Deducted -₹${amt.toFixed(2)} from ${u.first_name}!`);
                        setTimeout(() => setModalBalanceStatus(null), 3000);
                      }}
                      className="py-2 px-3 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
                    >
                      - Deduct
                    </button>
                  </div>

                  {modalBalanceStatus && (
                    <div className="p-2 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{modalBalanceStatus}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Role & Status Toggles */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => toggleUserVip(u.user_id)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold cursor-pointer transition ${
                    u.is_vip ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {u.is_vip ? '🌟 Remove VIP' : '🌟 Grant VIP'}
                </button>

                <button
                  type="button"
                  onClick={() => toggleUserReseller(u.user_id)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold cursor-pointer transition ${
                    u.is_reseller ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {u.is_reseller ? '👑 Revoke Reseller' : '👑 Make Reseller'}
                </button>

                <button
                  type="button"
                  onClick={() => toggleUserBan(u.user_id)}
                  className={`col-span-2 py-2 px-3 rounded-xl text-xs font-bold cursor-pointer transition ${
                    u.is_banned ? 'bg-emerald-600 text-white' : 'bg-rose-600/80 text-white hover:bg-rose-600'
                  }`}
                >
                  {u.is_banned ? '✅ Unban User' : '🚫 Ban User from Bot'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ================= ADD PRODUCT MODAL ================= */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                Add Product to Store & Vault
              </h3>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 mb-1 block">Category</label>
                  <select
                    value={newProdForm.category}
                    onChange={(e) => setNewProdForm({ ...newProdForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-200 outline-none"
                  >
                    <option value="ANDROID NON ROOT PANEL">ANDROID NON ROOT PANEL</option>
                    <option value="ANDROID ROOT PANEL">ANDROID ROOT PANEL</option>
                    <option value="PC PANEL">PC PANEL</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 mb-1 block">Panel Name</label>
                  <input
                    type="text"
                    required
                    value={newProdForm.panel_name}
                    onChange={(e) => setNewProdForm({ ...newProdForm, panel_name: e.target.value })}
                    placeholder="e.g. VIP ZERO PANEL"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-200 outline-none font-bold"
                  />
                </div>
              </div>

              {/* Product Duration & Validity Configuration */}
              <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                    ⏱ Product Duration / Validity (Manual Customization)
                  </span>
                  <span className="text-[10px] text-cyan-400/80">Shown to users & Provider</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 mb-1 block">Product / Package Name</label>
                    <input
                      type="text"
                      required
                      value={newProdForm.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewProdForm({ 
                          ...newProdForm, 
                          name: val,
                          validity: newProdForm.validity || val,
                          provider_duration: newProdForm.provider_duration || val
                        });
                      }}
                      placeholder="e.g. 7 Days VIP Key"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-200 outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 mb-1 block">Custom Duration / Validity</label>
                    <input
                      type="text"
                      required
                      value={newProdForm.validity}
                      onChange={(e) => setNewProdForm({ 
                        ...newProdForm, 
                        validity: e.target.value,
                        provider_duration: e.target.value
                      })}
                      placeholder="e.g. 1 Day, 7 Days, 30 Days, 1 Year"
                      className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl p-2 text-cyan-300 font-bold outline-none"
                    />
                  </div>
                </div>

                {/* Quick Duration Preset Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 mr-1">Quick Presets:</span>
                  {['1 Hour', '2 Hours', '6 Hours', '12 Hours', '1 Day', '3 Days', '7 Days', '15 Days', '30 Days', '60 Days', 'Lifetime'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewProdForm({
                        ...newProdForm,
                        validity: preset,
                        name: newProdForm.name ? newProdForm.name : preset,
                        provider_duration: preset
                      })}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                        newProdForm.validity === preset
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                          : 'bg-slate-950/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 mb-1 block">User Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newProdForm.price_inr}
                    onChange={(e) => setNewProdForm({ ...newProdForm, price_inr: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-emerald-400 font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 mb-1 block">Reseller Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newProdForm.reseller_price}
                    onChange={(e) => setNewProdForm({ ...newProdForm, reseller_price: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-amber-300 font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 mb-1 block">Device Limit</label>
                  <input
                    type="text"
                    value={newProdForm.device_limit}
                    onChange={(e) => setNewProdForm({ ...newProdForm, device_limit: e.target.value })}
                    placeholder="1 Device HWID"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 mb-1 block">APK / Download Link</label>
                  <input
                    type="text"
                    value={newProdForm.apk_link}
                    onChange={(e) => setNewProdForm({ ...newProdForm, apk_link: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-200 outline-none"
                  />
                </div>
              </div>

              {/* BantiBhaiya Reseller Delivery Settings */}
              <div className="p-3 bg-slate-950/80 border border-indigo-500/30 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" />
                    Key Delivery Mode
                  </span>
                  <span className="text-[10px] text-slate-400">Automated vs Vault</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewProdForm({ ...newProdForm, delivery_mode: 'api_provider' })}
                    className={`p-2 rounded-lg text-center font-bold transition cursor-pointer ${
                      newProdForm.delivery_mode === 'api_provider'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    ⚡ Auto API
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewProdForm({ ...newProdForm, delivery_mode: 'hybrid' })}
                    className={`p-2 rounded-lg text-center font-bold transition cursor-pointer ${
                      newProdForm.delivery_mode === 'hybrid'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    🔄 Hybrid
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewProdForm({ ...newProdForm, delivery_mode: 'manual_vault' })}
                    className={`p-2 rounded-lg text-center font-bold transition cursor-pointer ${
                      newProdForm.delivery_mode === 'manual_vault'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    🔒 Vault Only
                  </button>
                </div>

                {newProdForm.delivery_mode !== 'manual_vault' && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] text-slate-400 mb-1 block">Provider Product PID</label>
                      <input
                        type="text"
                        value={newProdForm.provider_product_id}
                        onChange={(e) => setNewProdForm({ ...newProdForm, provider_product_id: e.target.value })}
                        placeholder="e.g. PID_FF_NONROOT_V1"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-indigo-300 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 mb-1 block">Provider Duration Match</label>
                      <input
                        type="text"
                        value={newProdForm.provider_duration}
                        onChange={(e) => setNewProdForm({ ...newProdForm, provider_duration: e.target.value })}
                        placeholder="e.g. 7 Days"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
                      />
                    </div>

                    <div className="col-span-2 flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="reqAndroidIdModal"
                        checked={Boolean(newProdForm.requires_android_id)}
                        onChange={(e) => setNewProdForm({ ...newProdForm, requires_android_id: e.target.checked ? 1 : 0 })}
                        className="rounded accent-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="reqAndroidIdModal" className="text-slate-300 text-[11px] cursor-pointer">
                        Requires Device Android ID (V1 Device Bound)? Bot will ask user for HWID upon buy.
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-slate-400 mb-1 block font-semibold">
                  Vault Keys (Optional / Fallback Keys, 1 per line)
                </label>
                <textarea
                  rows={3}
                  value={newProdForm.keys}
                  onChange={(e) => setNewProdForm({ ...newProdForm, keys: e.target.value })}
                  placeholder={`KEY-SAMPLE-9901\nKEY-SAMPLE-9902\nKEY-SAMPLE-9903`}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-cyan-300 font-mono text-xs outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow cursor-pointer transition"
                >
                  Save & Inject to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT PRODUCT MODAL ================= */}
      {editingProductId !== null && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                Edit Product & Duration (ID #{editingProductId})
              </h3>
              <button
                type="button"
                onClick={() => setEditingProductId(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateProductSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 mb-1 block">Category</label>
                  <select
                    value={editProdForm.category}
                    onChange={(e) => setEditProdForm({ ...editProdForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-200 outline-none"
                  >
                    <option value="ANDROID NON ROOT PANEL">ANDROID NON ROOT PANEL</option>
                    <option value="ANDROID ROOT PANEL">ANDROID ROOT PANEL</option>
                    <option value="PC PANEL">PC PANEL</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 mb-1 block">Panel Name</label>
                  <input
                    type="text"
                    required
                    value={editProdForm.panel_name}
                    onChange={(e) => setEditProdForm({ ...editProdForm, panel_name: e.target.value })}
                    placeholder="e.g. VIP ZERO PANEL"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-200 outline-none font-bold"
                  />
                </div>
              </div>

              {/* Product Duration & Validity Configuration */}
              <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                    ⏱ Edit Duration / Validity (Manual Input)
                  </span>
                  <span className="text-[10px] text-cyan-400/80">Active in Bot & Catalog</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 mb-1 block">Product / Package Name</label>
                    <input
                      type="text"
                      required
                      value={editProdForm.name}
                      onChange={(e) => setEditProdForm({ ...editProdForm, name: e.target.value })}
                      placeholder="e.g. 7 Days"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-200 outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 mb-1 block">Custom Duration / Validity</label>
                    <input
                      type="text"
                      required
                      value={editProdForm.validity}
                      onChange={(e) => setEditProdForm({ 
                        ...editProdForm, 
                        validity: e.target.value,
                        provider_duration: e.target.value
                      })}
                      placeholder="e.g. 1 Day, 7 Days, 30 Days, 1 Year"
                      className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl p-2 text-cyan-300 font-bold outline-none"
                    />
                  </div>
                </div>

                {/* Quick Duration Preset Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 mr-1">Quick Presets:</span>
                  {['1 Hour', '2 Hours', '6 Hours', '12 Hours', '1 Day', '3 Days', '7 Days', '15 Days', '30 Days', '60 Days', 'Lifetime'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEditProdForm({
                        ...editProdForm,
                        validity: preset,
                        name: editProdForm.name ? editProdForm.name : preset,
                        provider_duration: preset
                      })}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                        editProdForm.validity === preset
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                          : 'bg-slate-950/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 mb-1 block">User Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={editProdForm.price_inr}
                    onChange={(e) => setEditProdForm({ ...editProdForm, price_inr: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-emerald-400 font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 mb-1 block">Reseller Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={editProdForm.reseller_price}
                    onChange={(e) => setEditProdForm({ ...editProdForm, reseller_price: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-amber-300 font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 mb-1 block">Device Limit</label>
                  <input
                    type="text"
                    value={editProdForm.device_limit}
                    onChange={(e) => setEditProdForm({ ...editProdForm, device_limit: e.target.value })}
                    placeholder="1 Device HWID"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 mb-1 block">APK / Download Link</label>
                  <input
                    type="text"
                    value={editProdForm.apk_link}
                    onChange={(e) => setEditProdForm({ ...editProdForm, apk_link: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-200 outline-none"
                  />
                </div>
              </div>

              {/* Delivery Settings */}
              <div className="p-3 bg-slate-950/80 border border-indigo-500/30 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" />
                    Key Delivery Mode
                  </span>
                  <span className="text-[10px] text-slate-400">Automated vs Vault</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditProdForm({ ...editProdForm, delivery_mode: 'api_provider' })}
                    className={`p-2 rounded-lg text-center font-bold transition cursor-pointer ${
                      editProdForm.delivery_mode === 'api_provider'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    ⚡ Auto API
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditProdForm({ ...editProdForm, delivery_mode: 'hybrid' })}
                    className={`p-2 rounded-lg text-center font-bold transition cursor-pointer ${
                      editProdForm.delivery_mode === 'hybrid'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    🔄 Hybrid
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditProdForm({ ...editProdForm, delivery_mode: 'manual_vault' })}
                    className={`p-2 rounded-lg text-center font-bold transition cursor-pointer ${
                      editProdForm.delivery_mode === 'manual_vault'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    🔒 Vault Only
                  </button>
                </div>

                {editProdForm.delivery_mode !== 'manual_vault' && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] text-slate-400 mb-1 block">Provider Product PID</label>
                      <input
                        type="text"
                        value={editProdForm.provider_product_id}
                        onChange={(e) => setEditProdForm({ ...editProdForm, provider_product_id: e.target.value })}
                        placeholder="e.g. PID_FF_NONROOT_V1"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-indigo-300 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 mb-1 block">Provider Duration Match</label>
                      <input
                        type="text"
                        value={editProdForm.provider_duration}
                        onChange={(e) => setEditProdForm({ ...editProdForm, provider_duration: e.target.value })}
                        placeholder="e.g. 7 Days"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
                      />
                    </div>

                    <div className="col-span-2 flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="reqAndroidIdEditModal"
                        checked={Boolean(editProdForm.requires_android_id)}
                        onChange={(e) => setEditProdForm({ ...editProdForm, requires_android_id: e.target.checked ? 1 : 0 })}
                        className="rounded accent-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="reqAndroidIdEditModal" className="text-slate-300 text-[11px] cursor-pointer">
                        Requires Device Android ID (V1 Device Bound)?
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProductId(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow cursor-pointer transition"
                >
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= TELEGRAM CREDENTIALS HELP MODAL ================= */}
      {showTelegramHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg">
                  🤖
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">How to Get Bot Token & Admin ID</h3>
                  <p className="text-xs text-slate-400">Step-by-step instructions directly from Telegram</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTelegramHelpModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Step 1: Bot Token */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[11px]">
                    1
                  </span>
                  <span className="font-bold text-slate-200 text-sm">How to get your Telegram Bot Token:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1">
                  <li>Open Telegram and search for <strong className="text-cyan-400">@BotFather</strong> (official verified bot).</li>
                  <li>Click <strong>Start</strong> and send <code className="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-300 font-mono">/newbot</code>.</li>
                  <li>Enter your bot name (e.g., <code className="text-slate-200">Kalam FF Panel</code>).</li>
                  <li>Enter a unique username ending in <code className="text-slate-200">bot</code> (e.g., <code className="text-slate-200">KalamFFPanelBot</code>).</li>
                  <li>BotFather will reply with your <strong>HTTP API Token</strong> (e.g., <code className="text-cyan-300 font-mono">7928194012:AAH9bK8...</code>).</li>
                  <li>Copy and paste it into the <strong>Telegram Bot Token</strong> field in this panel.</li>
                </ol>
                <div className="pt-1">
                  <a
                    href="https://t.me/BotFather"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open @BotFather on Telegram
                  </a>
                </div>
              </div>

              {/* Step 2: Admin Numeric ID */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[11px]">
                    2
                  </span>
                  <span className="font-bold text-slate-200 text-sm">How to get your Telegram Admin ID:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1">
                  <li>Open Telegram and search for <strong className="text-amber-400">@userinfobot</strong> or <strong className="text-amber-400">@jsondumpbot</strong>.</li>
                  <li>Click <strong>Start</strong> or send any message to it.</li>
                  <li>The bot will instantly reply with your numerical Telegram User ID (e.g., <code className="text-amber-300 font-mono font-bold">12846461</code>).</li>
                  <li>Copy this numeric ID into the <strong>Master Admin Numeric ID</strong> field in this panel.</li>
                </ol>
                <div className="pt-1">
                  <a
                    href="https://t.me/userinfobot"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open @userinfobot on Telegram
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTelegramHelpModal(false)}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow"
              >
                Got it, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADD KEYS MODAL ================= */}
      {showAddKeysModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                Inject Keys to Product #{showAddKeysModal}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddKeysModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Paste the new keys below. Each line will be added as 1 available key in the database:
              </p>
              <textarea
                rows={5}
                value={newKeysText}
                onChange={(e) => setNewKeysText(e.target.value)}
                placeholder={`VIP-MST-KEY-1102\nVIP-MST-KEY-1103\nVIP-MST-KEY-1104`}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-cyan-300 font-mono text-xs outline-none"
              />

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddKeysModal(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleInjectKeys(showAddKeysModal)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow cursor-pointer transition"
                >
                  Inject Keys
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function getPythonSourceCode(settings?: any, emojis?: any): string {
  const token = settings?.bot_token || "7928194012:AAH9bK8xP_exampleTokenKalamBot";
  const adminId = settings?.admin_id || 12846461;
  const adminContact = settings?.admin_contact || "@kalam172010";
  const upiId = settings?.fampay_upi_id || "kalampanel@fam";
  const supportTg = settings?.support_telegram || "https://t.me/KalamPanelSupport";

  return `# ==============================================================================
# KALAM FF PANEL - TELEGRAM BOT (PYTHON AIOGRAM 3.x)
# Built for Instant Key Delivery, FamPay UPI, Crypto, VIP & Resellers
# ==============================================================================
import asyncio
import sqlite3
import random
import logging
import time
import aiohttp
from datetime import datetime, timedelta
from typing import Optional, List, Tuple, Dict, Any

from aiogram import Bot, Dispatcher, F, BaseMiddleware
from aiogram.client.default import DefaultBotProperties
from aiogram.filters import Command, CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import StatesGroup, State
from aiogram.types import (
    ReplyKeyboardMarkup, KeyboardButton,
    InlineKeyboardMarkup, InlineKeyboardButton, CallbackQuery, Message, BufferedInputFile
)

# ------------------------------------------------------------------------------
# CONFIGURATION
# ------------------------------------------------------------------------------
BOT_TOKEN = "${token}"
ADMIN_ID = ${adminId}
ADMIN_CONTACT = "${adminContact}"
FAMPAY_UPI_ID = "${upiId}"
SUPPORT_TELEGRAM = "${supportTg}"

# Initialized and fully operational with SQLite database Cuibcc.db
# All handlers for /start, /admin, Shop, Add Balance, Resellers, VIP, Tickets enabled.
`;
}
