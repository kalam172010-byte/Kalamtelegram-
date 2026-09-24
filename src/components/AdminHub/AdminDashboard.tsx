import React, { useState } from 'react';
import { useBot, isMaintenanceActive } from '../../context/BotContext';
import { motion, AnimatePresence } from 'motion/react';
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
  Gift,
  Share2,
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
  Bot,
  Wrench,
  Activity,
  Clock,
  Video,
  Mic,
  Volume2,
  Globe,
  Smartphone
} from 'lucide-react';
import { Product, BotInstance } from '../../types';
import { SystemHealthWidget } from './SystemHealthWidget';
import { WebsiteLogo } from '../Common/WebsiteLogo';
import { PWAInstallCard } from '../Common/PWAInstallCard';

interface DurationPresetConfig {
  validity: string;
  name: string;
  provider_duration: string;
  price_inr: number;
  reseller_price: number;
}

const DURATION_PRESETS_MAP: Record<string, DurationPresetConfig> = {
  '1 Hour': { validity: '1 Hour', name: '1 Hour', provider_duration: '1 Hour', price_inr: 10, reseller_price: 8 },
  '2 Hours': { validity: '2 Hours', name: '2 Hours', provider_duration: '2 Hours', price_inr: 20, reseller_price: 15 },
  '6 Hours': { validity: '6 Hours', name: '6 Hours', provider_duration: '6 Hours', price_inr: 35, reseller_price: 25 },
  '12 Hours': { validity: '12 Hours', name: '12 Hours', provider_duration: '12 Hours', price_inr: 45, reseller_price: 30 },
  '24 Hours': { validity: '24 Hours', name: '24 Hours', provider_duration: '24 Hours', price_inr: 60, reseller_price: 40 },
  '1 Day': { validity: '1 Day', name: '1 Day', provider_duration: '1 Day', price_inr: 50, reseller_price: 35 },
  '3 Days': { validity: '3 Days', name: '3 Days', provider_duration: '3 Days', price_inr: 120, reseller_price: 80 },
  '7 Days': { validity: '7 Days', name: '7 Days', provider_duration: '7 Days', price_inr: 250, reseller_price: 150 },
  '15 Days': { validity: '15 Days', name: '15 Days', provider_duration: '15 Days', price_inr: 450, reseller_price: 300 },
  '30 Days': { validity: '30 Days', name: '30 Days', provider_duration: '30 Days', price_inr: 750, reseller_price: 500 },
  '60 Days': { validity: '60 Days', name: '60 Days', provider_duration: '60 Days', price_inr: 1200, reseller_price: 850 },
  'Lifetime': { validity: 'Lifetime', name: 'Lifetime', provider_duration: 'Lifetime', price_inr: 2000, reseller_price: 1400 }
};

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    isAdmin,
    setCurrentUserId,
    setActiveTab,
    bots,
    activeBot,
    createBot,
    updateBot,
    deleteBot,
    switchActiveBot,
    duplicateBot,
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
    deleteProducts,
    deletePanel,
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
    updateActiveBotGateway,
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
    sendBroadcastMessage,
    toggleMaintenanceMode,
    adminTab,
    setAdminTab,
    showAddProductModal,
    setShowAddProductModal,
    openAddProductModal
  } = useBot();

  const contentScrollRef = React.useRef<HTMLDivElement>(null);

  const handleTabChange = (newTab: typeof adminTab) => {
    setAdminTab(newTab);
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Bot Cloner & Fleet state
  const [showCreateBotModal, setShowCreateBotModal] = useState(false);
  const [editingBotId, setEditingBotId] = useState<string | null>(null);
  const [botToDelete, setBotToDelete] = useState<BotInstance | null>(null);
  const [copiedBotTokenId, setCopiedBotTokenId] = useState<string | null>(null);
  const [createBotSuccessMsg, setCreateBotSuccessMsg] = useState<string | null>(null);

  const [newBotForm, setNewBotForm] = useState({
    name: 'Kalam VIP Store #2',
    username: 'kalam_vip2_bot',
    bot_token: '',
    admin_id: String(settings.admin_id || 12846461),
    description: 'Automated Telegram Shop with independent API keys and admin authorization.',
    fampay_upi_id: 'kalampanel@fam',
    famgateway_api_key: '',
    bantibhaiya_api_key: '',
    bantibhaiya_master_key: '',
    clone_products: true
  });

  const [editBotForm, setEditBotForm] = useState({
    name: '',
    username: '',
    bot_token: '',
    admin_id: '',
    status: 'ONLINE' as 'ONLINE' | 'OFFLINE' | 'MAINTENANCE',
    fampay_upi_id: '',
    famgateway_api_key: '',
    bantibhaiya_api_key: '',
    bantibhaiya_master_key: ''
  });

  // Broadcast Message State
  const [broadcastForm, setBroadcastForm] = useState({
    targetAudience: 'all' as 'all' | 'referrers' | 'vip' | 'reseller' | 'non_reseller',
    mediaType: 'photo' as 'text' | 'photo' | 'video' | 'voice' | 'audio',
    text: `⚡ <b>SPECIAL FLASH UPDATE</b> ⚡\n\nNew Non-Root Free Fire VIP panels are now back in stock with instant key delivery!\n\nUse code <code>KALAM50</code> for flat discount on your next recharge!`,
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    videoUrl: '',
    voiceUrl: '',
    audioUrl: '',
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

  // Direct Media File & Live Voice Note Recording State
  const [mediaFile, setMediaFile] = useState<{
    file: File | null;
    previewUrl: string;
    base64: string;
    filename: string;
    mimeType: string;
  } | null>(null);

  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<BlobPart[]>([]);
  const recordingTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/ogg;codecs=opus' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setMediaFile({
            file: null,
            previewUrl: audioUrl,
            base64: base64data,
            filename: `voice_note_${Date.now()}.ogg`,
            mimeType: 'audio/ogg'
          });
        };
        reader.readAsDataURL(audioBlob);

        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecordingVoice(true);
      setRecordingSeconds(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } catch (err: any) {
      alert(`Microphone Permission Error: ${err.message || 'Please grant microphone access to record live voice notes.'}`);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingVoice(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const clearVoiceRecording = () => {
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    setRecordedAudioUrl(null);
    setMediaFile(null);
    setRecordingSeconds(0);
  };

  const handleDirectFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setMediaFile({
        file,
        previewUrl,
        base64,
        filename: file.name,
        mimeType: file.type || 'application/octet-stream'
      });
    };
    reader.readAsDataURL(file);
  };

  const formatRecordingTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

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

  // Telegram Bot Slash Commands Manager State
  const [botCommands, setBotCommands] = useState<Array<{ command: string; description: string }>>([
    { command: 'start', description: '⚡ Open Kalam FF Panel Main Store' },
    { command: 'buy', description: '🛒 Browse & Buy Panel Keys' },
    { command: 'check_update', description: '📥 Check Latest APK Updates & Downloads' },
    { command: 'balance', description: '💳 Add Wallet Balance via UPI' },
    { command: 'profile', description: '👤 View Profile & Purchased Keys' },
    { command: 'referral', description: '🔗 Refer Friends & Earn Rewards' },
    { command: 'support', description: '🎧 24/7 Support & Official Channels' },
    { command: 'help', description: '📖 How to Install & Use Panels' }
  ]);
  const [newCmdName, setNewCmdName] = useState('');
  const [newCmdDesc, setNewCmdDesc] = useState('');
  const [syncingCommands, setSyncingCommands] = useState(false);
  const [cmdStatus, setCmdStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    fetch('/api/bot/commands')
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.commands)) {
          setBotCommands(data.commands);
        }
      })
      .catch(() => {});
  }, []);

  const handleSyncCommands = async (cmdsToSend = botCommands) => {
    setSyncingCommands(true);
    setCmdStatus(null);
    try {
      const res = await fetch('/api/bot/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands: cmdsToSend })
      });
      const data = await res.json();
      setSyncingCommands(false);
      if (data.success) {
        setBotCommands(data.commands);
        setCmdStatus({
          type: 'success',
          text: '✅ Telegram Bot Commands updated and synced to Telegram API successfully! Check your bot menu /Menu in Telegram.'
        });
      } else {
        setCmdStatus({
          type: 'error',
          text: `❌ Error syncing commands: ${data.error || 'Failed'}`
        });
      }
    } catch (err: any) {
      setSyncingCommands(false);
      setCmdStatus({
        type: 'error',
        text: `❌ Network Error: ${err.message}`
      });
    }
  };

  const handleClearCommands = async () => {
    if (!confirm('Are you sure you want to DELETE ALL slash commands from your Telegram Bot menu?')) return;
    setSyncingCommands(true);
    setCmdStatus(null);
    try {
      const res = await fetch('/api/bot/commands', { method: 'DELETE' });
      const data = await res.json();
      setSyncingCommands(false);
      if (data.success) {
        setBotCommands([]);
        setCmdStatus({
          type: 'success',
          text: '🗑️ All commands deleted from Telegram Bot API! BotFather / Telegram Menu is now completely cleared.'
        });
      } else {
        setCmdStatus({
          type: 'error',
          text: `❌ Error clearing commands: ${data.error || 'Failed'}`
        });
      }
    } catch (err: any) {
      setSyncingCommands(false);
      setCmdStatus({
        type: 'error',
        text: `❌ Network Error: ${err.message}`
      });
    }
  };

  // Products state
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [productsViewMode, setProductsViewMode] = useState<'grouped' | 'table'>('grouped');
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [showAddKeysModal, setShowAddKeysModal] = useState<number | null>(null);
  const [newKeysText, setNewKeysText] = useState('');

  // Multi-Plan Product Creation Form State
  const [multiProdForm, setMultiProdForm] = useState({
    category: 'ANDROID NON ROOT PANEL',
    panel_name: '',
    apk_link: '',
    device_limit: '1 Device HWID',
    delivery_mode: 'api_provider' as 'api_provider' | 'hybrid' | 'manual_vault',
    provider_product_id: 'PID_FF_NONROOT_V1',
    requires_android_id: 0,
    plans: [
      { id: 'p_1', validity: '1 Day', provider_duration: '1 Day', name: '1 Day', price_inr: 50, reseller_price: 35, keys: '' },
      { id: 'p_2', validity: '7 Days', provider_duration: '7 Days', name: '7 Days', price_inr: 250, reseller_price: 150, keys: '' },
      { id: 'p_3', validity: '30 Days', provider_duration: '30 Days', name: '30 Days', price_inr: 600, reseller_price: 400, keys: '' },
      { id: 'p_4', validity: 'Lifetime', provider_duration: 'Lifetime', name: 'Lifetime', price_inr: 1500, reseller_price: 1000, keys: '' }
    ]
  });

  // Modal to add a single plan to an existing product
  const [showAddPlanToPanelModal, setShowAddPlanToPanelModal] = useState<{
    category: string;
    panel_name: string;
    apk_link?: string;
    device_limit?: string;
    delivery_mode?: 'api_provider' | 'hybrid' | 'manual_vault';
    provider_product_id?: string;
    requires_android_id?: boolean;
  } | null>(null);

  const [singlePlanForm, setSinglePlanForm] = useState({
    validity: '1 Day',
    provider_duration: '1 Day',
    name: '1 Day',
    price_inr: 50,
    reseller_price: 35,
    keys: '',
    is_maintenance: 0,
    maintenance_note: ''
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
    is_maintenance: 0,
    maintenance_note: '',
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
    (u.first_name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.username || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    String(u.user_id || '').includes(userSearch) ||
    String(u.chat_id || u.user_id || '').includes(userSearch)
  );

  const filteredProducts = selectedCategory === 'ALL'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const handleAddPlanRow = () => {
    const newId = 'p_' + Date.now();
    setMultiProdForm(prev => ({
      ...prev,
      plans: [
        ...prev.plans,
        { id: newId, validity: '15 Days', provider_duration: '15 Days', name: '15 Days', price_inr: 400, reseller_price: 260, keys: '' }
      ]
    }));
  };

  const handleRemovePlanRow = (planId: string) => {
    if (multiProdForm.plans.length <= 1) return;
    setMultiProdForm(prev => ({
      ...prev,
      plans: prev.plans.filter(p => p.id !== planId)
    }));
  };

  const handlePlanChange = (planId: string, field: string, value: any) => {
    setMultiProdForm(prev => ({
      ...prev,
      plans: prev.plans.map(p => {
        if (p.id === planId) {
          const updated = { ...p, [field]: value };
          if (field === 'validity') {
            if (!p.name || p.name === p.validity) {
              updated.name = value;
            }
            if (!p.provider_duration || p.provider_duration === p.validity) {
              updated.provider_duration = value;
            }
          }
          return updated;
        }
        return p;
      })
    }));
  };

  const handleLoadStandardPreset = () => {
    setMultiProdForm(prev => ({
      ...prev,
      plans: [
        { id: 'p_1', validity: '1 Day', provider_duration: '1 Day', name: '1 Day', price_inr: 50, reseller_price: 35, keys: '' },
        { id: 'p_2', validity: '7 Days', provider_duration: '7 Days', name: '7 Days', price_inr: 250, reseller_price: 150, keys: '' },
        { id: 'p_3', validity: '30 Days', provider_duration: '30 Days', name: '30 Days', price_inr: 600, reseller_price: 400, keys: '' },
        { id: 'p_4', validity: 'Lifetime', provider_duration: 'Lifetime', name: 'Lifetime', price_inr: 1500, reseller_price: 1000, keys: '' }
      ]
    }));
  };

  const handleLoadHourlyPreset = () => {
    setMultiProdForm(prev => ({
      ...prev,
      plans: [
        { id: 'p_1', validity: '2 Hours', provider_duration: '2 Hours', name: '2 Hours', price_inr: 20, reseller_price: 15, keys: '' },
        { id: 'p_2', validity: '6 Hours', provider_duration: '6 Hours', name: '6 Hours', price_inr: 35, reseller_price: 25, keys: '' },
        { id: 'p_3', validity: '12 Hours', provider_duration: '12 Hours', name: '12 Hours', price_inr: 45, reseller_price: 30, keys: '' },
        { id: 'p_4', validity: '24 Hours', provider_duration: '24 Hours', name: '24 Hours', price_inr: 60, reseller_price: 40, keys: '' }
      ]
    }));
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!multiProdForm.panel_name.trim() || multiProdForm.plans.length === 0) return;

    multiProdForm.plans.forEach((plan, planIdx) => {
      const keysArray = plan.keys.split('\n').map(k => k.trim()).filter(Boolean);
      const uniquePlanId = Date.now() + planIdx + Math.floor(Math.random() * 100000);
      addProduct(
        {
          id: uniquePlanId,
          category: multiProdForm.category,
          panel_name: multiProdForm.panel_name.trim(),
          name: plan.name.trim() || plan.validity.trim(),
          price_inr: Number(plan.price_inr),
          reseller_price: Number(plan.reseller_price),
          validity: plan.validity.trim() || plan.name.trim(),
          device_limit: multiProdForm.device_limit || '1 Device HWID',
          apk_link: multiProdForm.apk_link,
          is_active: 1,
          is_maintenance: 0,
          maintenance_note: '',
          delivery_mode: multiProdForm.delivery_mode,
          provider_product_id: multiProdForm.provider_product_id,
          provider_duration: plan.provider_duration?.trim() || plan.validity?.trim() || plan.name?.trim(),
          requires_android_id: Boolean(multiProdForm.requires_android_id)
        },
        keysArray
      );
    });

    setShowAddProductModal(false);
    setMultiProdForm({
      category: 'ANDROID NON ROOT PANEL',
      panel_name: '',
      apk_link: '',
      device_limit: '1 Device HWID',
      delivery_mode: 'api_provider',
      provider_product_id: 'PID_FF_NONROOT_V1',
      requires_android_id: 0,
      plans: [
        { id: 'p_1', validity: '1 Day', provider_duration: '1 Day', name: '1 Day', price_inr: 50, reseller_price: 35, keys: '' },
        { id: 'p_2', validity: '7 Days', provider_duration: '7 Days', name: '7 Days', price_inr: 250, reseller_price: 150, keys: '' },
        { id: 'p_3', validity: '30 Days', provider_duration: '30 Days', name: '30 Days', price_inr: 600, reseller_price: 400, keys: '' },
        { id: 'p_4', validity: 'Lifetime', provider_duration: 'Lifetime', name: 'Lifetime', price_inr: 1500, reseller_price: 1000, keys: '' }
      ]
    });
  };

  const handleAddPlanToExistingProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddPlanToPanelModal || !singlePlanForm.validity) return;

    const keysArray = singlePlanForm.keys.split('\n').map(k => k.trim()).filter(Boolean);
    addProduct(
      {
        category: showAddPlanToPanelModal.category,
        panel_name: showAddPlanToPanelModal.panel_name,
        name: singlePlanForm.name.trim() || singlePlanForm.validity.trim(),
        price_inr: Number(singlePlanForm.price_inr),
        reseller_price: Number(singlePlanForm.reseller_price),
        validity: singlePlanForm.validity.trim(),
        device_limit: showAddPlanToPanelModal.device_limit || '1 Device HWID',
        apk_link: showAddPlanToPanelModal.apk_link || '',
        is_active: 1,
        is_maintenance: singlePlanForm.is_maintenance ? 1 : 0,
        maintenance_note: singlePlanForm.maintenance_note || '',
        delivery_mode: showAddPlanToPanelModal.delivery_mode || 'api_provider',
        provider_product_id: showAddPlanToPanelModal.provider_product_id || 'PID_FF_NONROOT_V1',
        provider_duration: singlePlanForm.provider_duration?.trim() || singlePlanForm.validity.trim(),
        requires_android_id: Boolean(showAddPlanToPanelModal.requires_android_id)
      },
      keysArray
    );

    setShowAddPlanToPanelModal(null);
    setSinglePlanForm({
      validity: '1 Day',
      provider_duration: '1 Day',
      name: '1 Day',
      price_inr: 50,
      reseller_price: 35,
      keys: '',
      is_maintenance: 0,
      maintenance_note: ''
    });
  };

  const handleDeleteEntirePanel = (category: string, panelName: string) => {
    if (window.confirm(`⚠️ Are you sure you want to delete "${panelName}" (${category}) and ALL of its duration plans?`)) {
      deletePanel(category, panelName);
    }
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setEditProdForm({
      category: prod.category,
      panel_name: prod.panel_name,
      name: prod.name,
      price_inr: prod.price_inr,
      reseller_price: prod.reseller_price ?? prod.reseller_price_inr ?? Math.round(prod.price_inr * 0.7),
      validity: prod.validity || prod.name,
      device_limit: prod.device_limit || '1 Device HWID',
      apk_link: prod.apk_link || '',
      is_active: prod.is_active,
      is_maintenance: prod.is_maintenance ? 1 : 0,
      maintenance_note: prod.maintenance_note || '',
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
      is_maintenance: editProdForm.is_maintenance ? 1 : 0,
      maintenance_note: editProdForm.maintenance_note || '',
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
    <div className="min-h-full w-full text-slate-100 p-2 sm:p-4 md:p-6 pb-28 md:pb-12 space-y-4 max-w-7xl mx-auto flex flex-col">
      {/* Top Admin Header Bar - Compact & Highly Visible */}
      <div className="liquid-glass-card rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-2.5 shrink-0 shadow-2xl">
        <div className="flex items-center gap-3">
          <WebsiteLogo size="md" showSubtitle={false} />
          <div className="border-l border-white/10 pl-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-white">
                Admin Control Hub
              </h2>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.2 rounded-full font-bold">
                Root Auth
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">Admin UID: {settings.admin_id || '12846461'}</p>
          </div>
        </div>

        {/* Quick System Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bot Maintenance Toggle */}
          <button
            type="button"
            onClick={() => toggleMaintenanceMode()}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border min-h-[38px] active:scale-95 shadow-md ${
              !settings.maintenance_mode
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30 animate-pulse'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${!settings.maintenance_mode ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
            <span>Bot: {!settings.maintenance_mode ? 'ONLINE' : 'MAINTENANCE MODE'}</span>
          </button>

          {/* Referral System Toggle */}
          <button
            type="button"
            onClick={() => updateSettings({ referral_system_status: settings.referral_system_status === 'OFF' ? 'ON' : 'OFF' })}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border min-h-[38px] active:scale-95 ${
              settings.referral_system_status !== 'OFF'
                ? 'bg-pink-500/20 text-pink-300 border-pink-500/40 hover:bg-pink-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-pink-400" />
            <span>Referrals: {settings.referral_system_status || 'ON'}</span>
          </button>

          {/* Active Bot Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-xl border border-cyan-500/30 min-h-[38px]">
            <Bot className="w-4 h-4 text-cyan-400 shrink-0" />
            <select
              value={activeBot?.id || bots[0]?.id || ''}
              onChange={(e) => switchActiveBot(e.target.value)}
              className="bg-transparent text-cyan-300 text-xs font-bold outline-none cursor-pointer max-w-[120px] sm:max-w-[160px] truncate"
            >
              {bots.length === 0 ? (
                <option value="" className="bg-slate-900 text-slate-400">
                  No bots (Create +)
                </option>
              ) : (
                bots.map((b, idx) => (
                  <option key={`bot-sel-${b.id || idx}`} value={b.id} className="bg-slate-900 text-slate-200">
                    {b.name} (@{b.username})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Top Mobile-First Command Action Hub (Large Touch Cards - Always at Top & Fully Visible) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 shrink-0">
        {[
          {
            id: 'overview',
            title: 'Overview',
            subtitle: `₹${totalRevenue.toFixed(0)} Rev`,
            icon: Zap,
            color: 'from-cyan-500/20 to-blue-600/20 border-cyan-500/30 text-cyan-300'
          },
          {
            id: 'bots',
            title: 'Bot Fleet',
            subtitle: `${bots.length} Active`,
            icon: Bot,
            badge: `${bots.length}`,
            color: 'from-indigo-500/20 to-purple-600/20 border-indigo-500/30 text-indigo-300'
          },
          {
            id: 'products',
            title: 'Products & Keys',
            subtitle: `${products.length} Panels`,
            icon: Package,
            badge: `${availableKeysCount} keys`,
            color: 'from-amber-500/20 to-orange-600/20 border-amber-500/30 text-amber-300'
          },
          {
            id: 'users',
            title: 'Manage Users',
            subtitle: `${allUsers.length} Users`,
            icon: Users,
            badge: `${allUsers.length}`,
            color: 'from-emerald-500/20 to-teal-600/20 border-emerald-500/30 text-emerald-300'
          },
          {
            id: 'broadcast',
            title: 'Send Broadcast',
            subtitle: 'Instant Alert',
            icon: Megaphone,
            color: 'from-rose-500/20 to-pink-600/20 border-rose-500/30 text-rose-300'
          },
          {
            id: 'gateways',
            title: 'Gateways & APIs',
            subtitle: 'UPI & Provider',
            icon: CreditCard,
            color: 'from-teal-500/20 to-cyan-600/20 border-teal-500/30 text-teal-300'
          },
          {
            id: 'appinstall',
            title: 'App Download',
            subtitle: 'PWA Mobile App',
            icon: Smartphone,
            color: 'from-cyan-500/20 via-indigo-600/20 to-blue-600/20 border-cyan-400/40 text-cyan-300'
          }
        ].map((hub) => {
          const HubIcon = hub.icon;
          const isActive = adminTab === hub.id;
          return (
            <button
              key={hub.id}
              type="button"
              onClick={() => handleTabChange(hub.id as any)}
              className={`p-2.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer active:scale-95 flex flex-col justify-between min-h-[64px] shadow-sm relative overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-br from-cyan-500/30 via-slate-900 to-blue-600/30 border-cyan-400 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400'
                  : `bg-slate-900/90 hover:bg-slate-800/90 bg-gradient-to-br ${hub.color}`
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <HubIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-cyan-300 scale-110' : ''}`} />
                {hub.badge && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full font-black bg-white/10 text-white border border-white/15">
                    {hub.badge}
                  </span>
                )}
              </div>
              <div className="mt-1">
                <div className="text-xs sm:text-sm font-black text-white tracking-tight leading-tight truncate">
                  {hub.title}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">{hub.subtitle}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Secondary Tabs Bar - Scrollable with Big Touch Target Width */}
      <div className="liquid-glass-pill rounded-2xl p-1 flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0 shadow-lg">
        {[
          { id: 'overview', label: '📊 Overview', icon: Zap },
          { id: 'appinstall', label: '📱 App Download (PWA)', icon: Smartphone },
          { id: 'bots', label: `🤖 Bot Fleet (${bots.length})`, icon: Bot },
          { id: 'botcommands', label: '🤖 Bot Commands', icon: Code2 },
          { id: 'products', label: `📦 Products (${products.length})`, icon: Package },
          { id: 'users', label: `👥 Users (${allUsers.length})`, icon: Users },
          { id: 'referrals', label: '🎁 Referral Program', icon: Gift },
          { id: 'broadcast', label: '📢 Broadcast', icon: Megaphone },
          { id: 'gateways', label: '💳 Payment & Settings', icon: CreditCard },
          { id: 'health', label: '⚡ Health & Diagnostics', icon: Activity },
          { id: 'tickets', label: `🎫 Tickets (${openTicketsCount})`, icon: TicketIcon, badge: openTicketsCount > 0 },
          { id: 'coupons', label: `🏷️ Coupons (${coupons.length})`, icon: Tag },
          { id: 'emojis', label: '✨ Custom Emojis', icon: Sparkles },
          { id: 'logs', label: '📜 Live Logs', icon: FileText },
          { id: 'code', label: '💻 Python Source', icon: Code2 }
        ].map((tab) => {
          const isActive = adminTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer active:scale-95 min-h-[38px] ${
                isActive
                  ? 'liquid-glass-btn-cyan text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div
        ref={contentScrollRef}
        className="w-full space-y-6 pb-24 sm:pb-12 pr-0.5 select-auto"
      >
        {/* ================= APP DOWNLOAD & PWA INSTALL TAB ================= */}
        {adminTab === 'appinstall' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <PWAInstallCard />
          </div>
        )}

        {/* ================= OVERVIEW TAB ================= */}
        {adminTab === 'overview' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <PWAInstallCard />
          </div>
        )}

        {/* ================= BOT FLEET & CLONER TAB ================= */}
        {adminTab === 'bots' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header & Clone Call-to-action */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-cyan-500/20 text-cyan-300 font-bold px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                      Multi-Bot Architecture
                    </span>
                    <span className="text-xs bg-purple-500/20 text-purple-300 font-bold px-2.5 py-0.5 rounded-full border border-purple-500/30">
                      Isolated API Keys & Admins
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-white">
                    Telegram Bot Fleet & Instance Cloner
                  </h2>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Clone as many independent bots as you need. Every cloned bot instance runs with its own <b>Telegram Bot Token</b>, <b>Admin Chat ID</b> (which allows running <code className="text-amber-300 font-mono">@admin</code> or <code className="text-amber-300 font-mono">/admin</code> within that specific bot), <b>FamGateway UPI Key</b>, and <b>BantiBhaiya Reseller API Key</b>.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setNewBotForm({
                        name: `Kalam Store Bot #${bots.length + 1}`,
                        username: `kalam_store${bots.length + 1}_bot`,
                        bot_token: '',
                        admin_id: String(activeBot?.admin_id || settings.admin_id || 12846461),
                        description: 'Automated Telegram Shop with independent API keys and admin authorization.',
                        fampay_upi_id: activeBot?.payment_gateway?.upi_id || settings.fampay_upi_id || 'kalampanel@fam',
                        famgateway_api_key: '',
                        bantibhaiya_api_key: '',
                        bantibhaiya_master_key: '',
                        clone_products: true
                      });
                      setShowCreateBotModal(true);
                    }}
                    className="px-5 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-2xl text-xs md:text-sm font-bold shadow-lg shadow-cyan-600/30 flex items-center gap-2 cursor-pointer transition transform active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Clone New Bot Instance</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Currently Active Bot Spotlight Banner */}
            {activeBot && (
              <div className="bg-slate-900 border-2 border-cyan-500/40 rounded-2xl p-5 shadow-lg space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg">
                      🤖
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wider font-bold text-cyan-400">Currently Active Bot</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                          LIVE ENGINE
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white">
                        {activeBot.name} <span className="text-cyan-300 text-xs font-mono">(@{activeBot.username})</span>
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('my_bots')}
                      className="px-3.5 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      Manage Bot Fleet
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminTab('gateways')}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      Configure APIs
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px] mb-1">Admin Chat ID (@admin root):</span>
                    <div className="flex items-center justify-between font-mono text-amber-300 font-bold">
                      <span>{activeBot.admin_id || activeBot.admin_chat_id || settings.admin_id}</span>
                      <span className="text-[10px] bg-amber-500/10 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                        Root Access
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px] mb-1">Bot Token Status:</span>
                    <div className="text-slate-200 font-mono text-[11px] truncate">
                      {activeBot.bot_token ? `${activeBot.bot_token.substring(0, 10)}...` : 'Using Server Token'}
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px] mb-1">FamGateway UPI:</span>
                    <div className="text-slate-200 font-mono text-[11px] truncate">
                      {activeBot.payment_gateway?.upi_id || settings.fampay_upi_id || 'Not set'}
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px] mb-1">Reseller Provider API:</span>
                    <div className="text-indigo-300 font-mono text-[11px] truncate">
                      {activeBot.reseller_api?.api_key ? 'Isolated Key Set ✅' : 'Default Key'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* List of All Bots in Fleet */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-cyan-400" />
                  Your Registered Bot Fleet ({bots.length} Bots)
                </h3>
                <span className="text-xs text-slate-400">Click &quot;Switch Active&quot; to manage any bot&apos;s isolated products and API keys.</span>
              </div>

              {bots.length === 0 ? (
                <div className="bg-slate-900/80 border border-dashed border-slate-700 rounded-3xl p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto text-2xl">
                    🤖
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h4 className="text-base font-bold text-white">No Bots Configured Yet</h4>
                    <p className="text-xs text-slate-400">
                      All demo bots have been removed. Click <b>&quot;+ Clone New Bot Instance&quot;</b> or <b>&quot;Create First Bot&quot;</b> above to connect your real Telegram bot with your bot token and admin ID.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewBotForm({
                        name: 'My Telegram Shop Bot',
                        username: '',
                        bot_token: '',
                        admin_id: String(settings.admin_id || 12846461),
                        description: 'Automated Telegram Shop with independent API keys and admin authorization.',
                        fampay_upi_id: settings.fampay_upi_id || 'kalampanel@fam',
                        famgateway_api_key: '',
                        bantibhaiya_api_key: '',
                        bantibhaiya_master_key: '',
                        clone_products: true
                      });
                      setShowCreateBotModal(true);
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg transition inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Your Bot Now</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bots.map((bot, idx) => {
                    const isActive = activeBot?.id === bot.id;
                    const botAdminId = bot.admin_id || bot.admin_chat_id || settings.admin_id;

                    return (
                      <div
                        key={`fleet-bot-${bot.id || idx}`}
                        className={`bg-slate-900 border rounded-2xl p-5 space-y-4 transition ${
                          isActive
                            ? 'border-cyan-500 shadow-md shadow-cyan-500/10 bg-slate-900/90'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Top Row: Info & Status */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-600 flex items-center justify-center text-white font-bold text-base shadow">
                              🤖
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-white text-sm md:text-base">{bot.name}</h4>
                                {isActive && (
                                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded-full border border-cyan-500/30">
                                    ACTIVE
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-cyan-400 font-mono">@{bot.username}</p>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${
                              bot.status === 'ONLINE'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            ● {bot.status}
                          </span>
                        </div>

                        {/* Bot Parameters & Isolated APIs */}
                        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                          {/* Admin Chat ID (Crucial User Requirement) */}
                          <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
                            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5 text-amber-400" />
                              Admin Chat ID (@admin auth):
                            </span>
                            <span className="font-mono text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              {botAdminId}
                            </span>
                          </div>

                          {/* Bot Token Preview */}
                          <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
                            <span className="text-slate-400 font-semibold">Bot Token:</span>
                            <div className="flex items-center gap-1.5 font-mono text-slate-300 text-[11px]">
                              <span>
                                {bot.bot_token
                                  ? copiedBotTokenId === bot.id
                                    ? bot.bot_token
                                    : `${bot.bot_token.substring(0, 10)}...`
                                  : 'Default Token'}
                              </span>
                              {bot.bot_token && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(bot.bot_token);
                                    setCopiedBotTokenId(bot.id);
                                    setTimeout(() => setCopiedBotTokenId(null), 2000);
                                  }}
                                  className="text-cyan-400 hover:text-cyan-300"
                                >
                                  {copiedBotTokenId === bot.id ? '✓' : <Copy className="w-3 h-3" />}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* FamGateway UPI */}
                          <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
                            <span className="text-slate-400 font-semibold">FamGateway UPI:</span>
                            <span className="font-mono text-slate-300 text-[11px]">
                              {bot.payment_gateway?.upi_id || settings.fampay_upi_id || 'kalampanel@fam'}
                            </span>
                          </div>

                          {/* Reseller API */}
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-semibold">BantiBhaiya API Key:</span>
                            <span className="font-mono text-indigo-300 text-[11px]">
                              {bot.reseller_api?.api_key ? '••••' + bot.reseller_api.api_key.slice(-4) : 'Default Provider'}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-2">
                            {!isActive ? (
                              <button
                                type="button"
                                onClick={() => switchActiveBot(bot.id)}
                                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
                              >
                                <Zap className="w-3.5 h-3.5" />
                                Switch Active
                              </button>
                            ) : (
                              <span className="px-4 py-2 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Active Live Bot
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => duplicateBot(bot.id)}
                              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                              title="Quick duplicate bot"
                            >
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              Clone
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingBotId(bot.id);
                                setEditBotForm({
                                  name: bot.name,
                                  username: bot.username,
                                  bot_token: bot.bot_token,
                                  admin_id: String(bot.admin_id || bot.admin_chat_id || settings.admin_id),
                                  status: bot.status,
                                  fampay_upi_id: bot.payment_gateway?.upi_id || '',
                                  famgateway_api_key: bot.payment_gateway?.api_key || '',
                                  bantibhaiya_api_key: bot.reseller_api?.api_key || '',
                                  bantibhaiya_master_key: bot.reseller_api?.master_key || ''
                                });
                              }}
                              className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-semibold transition cursor-pointer"
                              title="Edit Bot APIs & Admin ID"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setBotToDelete(bot)}
                              className="p-2 bg-slate-800 hover:bg-rose-900/40 text-rose-400 rounded-xl text-xs font-semibold transition cursor-pointer"
                              title="Delete Bot"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

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

            {/* System Health & Outgoing API Diagnostics Widget */}
            <SystemHealthWidget onRefreshParent={() => {}} />

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
                  {logs.slice(0, 15).map((log, idx) => (
                    <div
                      key={`stream-log-${log.id || idx}`}
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

        {/* ================= BOT COMMANDS TAB ================= */}
        {adminTab === 'botcommands' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/40 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 font-bold px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                      Telegram Bot Menu Control
                    </span>
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      Live setMyCommands API
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                    <Bot className="w-6 h-6 text-indigo-400" />
                    Telegram Bot Slash Commands & Menu Manager
                  </h2>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl mt-1">
                    Manage, add, edit, or delete <code className="text-indigo-300 font-bold">/</code> slash commands registered on Telegram API (<code className="text-slate-300">/Menu</code> popup in Telegram). Commands set via API cannot be edited inside BotFather — use this tool to add or wipe them.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={syncingCommands}
                    onClick={() => handleSyncCommands(botCommands)}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs md:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-lg shadow-indigo-600/30"
                  >
                    <Sparkles className="w-4 h-4" />
                    {syncingCommands ? 'Syncing Telegram API...' : '⚡ Sync Commands to Bot'}
                  </button>

                  <button
                    type="button"
                    disabled={syncingCommands}
                    onClick={handleClearCommands}
                    className="px-4 py-2.5 bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600 hover:text-white rounded-xl text-xs md:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>🗑️ Delete / Clear All Commands</span>
                  </button>
                </div>
              </div>

              {/* Status Notification */}
              {cmdStatus && (
                <div className={`p-4 rounded-xl text-xs md:text-sm font-medium flex items-center justify-between gap-2 ${
                  cmdStatus.type === 'success'
                    ? 'bg-emerald-950/90 border border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/90 border border-rose-500/40 text-rose-200'
                }`}>
                  <span>{cmdStatus.text}</span>
                  <button type="button" onClick={() => setCmdStatus(null)} className="text-slate-400 hover:text-white cursor-pointer text-base">✕</button>
                </div>
              )}

              {/* Active Slash Commands List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
                  <span className="flex items-center gap-1.5 text-sm">
                    <Code2 className="w-4 h-4 text-indigo-400" />
                    Registered Slash Commands ({botCommands.length})
                  </span>
                  <span className="text-[11px] text-indigo-400 font-mono">
                    Telegram setMyCommands API Enabled
                  </span>
                </div>

                {botCommands.length === 0 ? (
                  <div className="p-10 text-center bg-slate-950 rounded-2xl border border-dashed border-slate-800 text-slate-400 text-xs space-y-2">
                    <p className="font-bold text-rose-400 text-sm">No active Telegram slash commands!</p>
                    <p className="text-slate-400 text-xs">Click <b>"+ Add Command"</b> below or Sync to register new commands on your Telegram Bot.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {botCommands.map((cmd, idx) => (
                      <div key={idx} className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs transition shadow-md">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-indigo-300 bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-500/40 text-xs">
                              /{cmd.command}
                            </span>
                          </div>
                          <p className="text-slate-200 text-xs truncate mt-1.5 font-medium">
                            {cmd.description}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const updated = botCommands.filter((_, i) => i !== idx);
                            setBotCommands(updated);
                            handleSyncCommands(updated);
                          }}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 rounded-xl transition shrink-0 cursor-pointer border border-transparent hover:border-rose-500/30"
                          title="Delete / Remove this command"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Command Form */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs md:text-sm font-bold text-slate-200 block flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  Add New Slash Command to Telegram Bot Menu
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs">
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={newCmdName}
                      onChange={(e) => setNewCmdName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="command (e.g. redeem)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-indigo-300 outline-none focus:border-indigo-500 font-mono text-xs"
                    />
                  </div>
                  <div className="sm:col-span-6">
                    <input
                      type="text"
                      value={newCmdDesc}
                      onChange={(e) => setNewCmdDesc(e.target.value)}
                      placeholder="Description (e.g. 🎁 Redeem voucher key)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      disabled={!newCmdName.trim() || !newCmdDesc.trim()}
                      onClick={() => {
                        if (!newCmdName.trim() || !newCmdDesc.trim()) return;
                        const updated = [...botCommands, { command: newCmdName.trim(), description: newCmdDesc.trim() }];
                        setBotCommands(updated);
                        setNewCmdName('');
                        setNewCmdDesc('');
                        handleSyncCommands(updated);
                      }}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition cursor-pointer disabled:opacity-50 text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-600/20"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= PRODUCTS & VAULT TAB ================= */}
        {adminTab === 'products' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
              {/* Category Filter & View Mode Toggle */}
              <div className="flex items-center gap-3 flex-wrap">
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

                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setProductsViewMode('grouped')}
                    className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      productsViewMode === 'grouped'
                        ? 'bg-cyan-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Grouped by Product</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductsViewMode('table')}
                    className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      productsViewMode === 'table'
                        ? 'bg-cyan-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Raw Plans Table</span>
                  </button>
                </div>
              </div>

              {/* Add Product & Plans Button */}
              <button
                type="button"
                onClick={() => setShowAddProductModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs md:text-sm font-bold shadow-lg shadow-cyan-600/20 cursor-pointer transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product & Plans</span>
              </button>
            </div>

            {/* ================= GROUPED PRODUCTS VIEW ================= */}
            {productsViewMode === 'grouped' && (
              <div className="space-y-4">
                {(() => {
                  // Compute groups by (Category + Panel Name)
                  const panelMap = new Map<string, {
                    key: string;
                    category: string;
                    panel_name: string;
                    apk_link?: string;
                    device_limit?: string;
                    delivery_mode?: string;
                    provider_product_id?: string;
                    requires_android_id?: boolean;
                    plans: Product[];
                    totalStock: number;
                  }>();

                  filteredProducts.forEach(p => {
                    const groupKey = `${p.category}:::${p.panel_name || p.name}`;
                    if (!panelMap.has(groupKey)) {
                      panelMap.set(groupKey, {
                        key: groupKey,
                        category: p.category,
                        panel_name: p.panel_name || p.name,
                        apk_link: p.apk_link,
                        device_limit: p.device_limit,
                        delivery_mode: p.delivery_mode,
                        provider_product_id: p.provider_product_id,
                        requires_android_id: Boolean(p.requires_android_id),
                        plans: [],
                        totalStock: 0
                      });
                    }
                    const grp = panelMap.get(groupKey)!;
                    grp.plans.push(p);
                    const inStock = productKeys.filter(k => k.product_id === p.id && !k.is_used).length;
                    grp.totalStock += inStock;
                  });

                  const groups = Array.from(panelMap.values());

                  if (groups.length === 0) {
                    return (
                      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-3">
                        <Package className="w-12 h-12 text-slate-600 mx-auto" />
                        <h4 className="text-base font-bold text-slate-300">No Products Found</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          There are no products in this category. Click &quot;Add Product & Plans&quot; above to create your first item!
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowAddProductModal(true)}
                          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          + Create First Product
                        </button>
                      </div>
                    );
                  }

                  return groups.map(group => (
                    <div
                      key={group.key}
                      className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl hover:border-slate-700/80 transition"
                    >
                      {/* Product Header */}
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] uppercase tracking-wider font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                              {group.category}
                            </span>
                            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-mono">
                              {group.plans.length} {group.plans.length === 1 ? 'Duration Plan' : 'Duration Plans'}
                            </span>
                            {group.provider_product_id && (
                              <span className="text-[10px] text-indigo-300 bg-indigo-950/70 border border-indigo-500/40 px-2.5 py-0.5 rounded-full font-mono font-bold">
                                PID: {group.provider_product_id}
                              </span>
                            )}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                              group.totalStock > 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}>
                              {group.totalStock} Total Keys
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                            <span>{group.panel_name}</span>
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                            <span>Limit: <strong className="text-slate-200">{group.device_limit || '1 Device HWID'}</strong></span>
                            {group.apk_link && (
                              <a
                                href={group.apk_link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-cyan-400 hover:text-cyan-300 underline inline-flex items-center gap-1"
                              >
                                <span>APK Download</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Top Group Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddPlanToPanelModal({
                                category: group.category,
                                panel_name: group.panel_name,
                                apk_link: group.apk_link,
                                device_limit: group.device_limit,
                                delivery_mode: (group.delivery_mode as any) || 'api_provider',
                                provider_product_id: group.provider_product_id,
                                requires_android_id: group.requires_android_id
                              });
                            }}
                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Add Duration Plan</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEntirePanel(group.category, group.panel_name)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-xl transition cursor-pointer border border-rose-500/20"
                            title="Delete Entire Product and all duration plans"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Plans Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {group.plans.map((plan, planIdx) => {
                          const planKeys = productKeys.filter(k => String(k.product_id) === String(plan.id) && !k.is_used);
                          const isMaint = Boolean(plan.is_maintenance);
                          return (
                            <div
                              key={`plan-item-${plan.id}-${planIdx}`}
                              className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-2.5 flex flex-col justify-between hover:border-slate-700 transition"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1.5">
                                  <span className="font-bold text-white text-xs sm:text-sm font-mono flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                    <span>{plan.name}</span>
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    planKeys.length > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                                  }`}>
                                    {planKeys.length} Keys
                                  </span>
                                </div>

                                <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800/80 space-y-1 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-400 text-[11px]">User Price:</span>
                                    <span className="font-bold text-emerald-400 font-mono">₹{plan.price_inr.toFixed(2)}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-400 text-[11px]">Reseller Price:</span>
                                    <span className="font-bold text-amber-300 font-mono">₹{(plan.reseller_price ?? plan.reseller_price_inr ?? 0).toFixed(2)}</span>
                                  </div>
                                  {plan.provider_duration && (
                                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/70 text-indigo-300">
                                      <span className="text-slate-400">API Duration:</span>
                                      <span className="font-mono font-semibold bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-500/20">{plan.provider_duration}</span>
                                    </div>
                                  )}
                                </div>

                                {isMaint && (
                                  <div className="mt-1.5 p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[10px] text-amber-300 flex items-center gap-1">
                                    <Wrench className="w-3 h-3 text-amber-400 shrink-0" />
                                    <span className="truncate">Under Maintenance</span>
                                  </div>
                                )}
                              </div>

                              {/* Plan Actions */}
                              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                                <div className="grid grid-cols-2 gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setShowAddKeysModal(plan.id)}
                                    className="py-1.5 px-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                                  >
                                    <Key className="w-3 h-3" />
                                    <span>+ Keys</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditProduct(plan)}
                                    className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 border border-slate-700 cursor-pointer active:scale-95"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                </div>

                                <div className="flex items-center justify-between gap-1">
                                  <button
                                    type="button"
                                    onClick={() => updateProduct(plan.id, { is_active: plan.is_active ? 0 : 1 })}
                                    className={`text-[10px] font-semibold px-2 py-1 rounded flex items-center gap-1 transition cursor-pointer ${
                                      plan.is_active ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 bg-slate-800'
                                    }`}
                                  >
                                    {plan.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                    <span>{plan.is_active ? 'Active' : 'Hidden'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteProduct(plan.id)}
                                    className="text-[10px] font-semibold text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-500/20 transition cursor-pointer"
                                    title="Delete this plan"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}

            {/* ================= RAW PLANS TABLE VIEW ================= */}
            {productsViewMode === 'table' && (
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
                        <th className="p-3.5">Visibility</th>
                        <th className="p-3.5">Maintenance</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredProducts.map((prod, idx) => {
                        const prodKeys = productKeys.filter(k => k.product_id === prod.id && !k.is_used);
                        const isMaint = Boolean(prod.is_maintenance);
                        return (
                          <tr key={`desk-prod-${prod.id || idx}`} className="hover:bg-slate-800/40 transition">
                            <td className="p-3.5">
                              <div className="font-mono text-cyan-400 font-bold">#{prod.id}</div>
                              <div className="text-[11px] text-slate-400">{prod.category}</div>
                            </td>
                            <td className="p-3.5 font-bold text-white">
                              <div className="flex items-center gap-1.5">
                                {isMaint && (
                                  <span className="p-1 rounded bg-amber-500/20 text-amber-300" title="Under Maintenance">
                                    <Wrench className="w-3.5 h-3.5 inline animate-pulse" />
                                  </span>
                                )}
                                <span>{prod.panel_name}</span>
                              </div>
                            </td>
                            <td className="p-3.5">
                              <span className="font-semibold text-slate-200">{prod.name}</span>
                              <div className="text-[10px] text-slate-500">{prod.device_limit}</div>
                            </td>
                            <td className="p-3.5 font-bold text-emerald-400">₹{prod.price_inr.toFixed(2)}</td>
                            <td className="p-3.5 font-bold text-amber-300">₹{(prod.reseller_price ?? prod.reseller_price_inr ?? 0).toFixed(2)}</td>
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
                                className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded cursor-pointer transition ${
                                  prod.is_active ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20' : 'text-slate-400 bg-slate-800 hover:bg-slate-700'
                                }`}
                              >
                                {prod.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                <span>{prod.is_active ? 'Active' : 'Hidden'}</span>
                              </button>
                            </td>
                            <td className="p-3.5">
                              <button
                                type="button"
                                onClick={() => updateProduct(prod.id, { is_maintenance: isMaint ? 0 : 1 })}
                                className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded cursor-pointer transition ${
                                  isMaint
                                    ? 'text-amber-300 bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30'
                                    : 'text-slate-400 bg-slate-800/80 hover:text-slate-200 hover:bg-slate-850'
                                }`}
                              >
                                <Wrench className={`w-3.5 h-3.5 ${isMaint ? 'text-amber-400' : 'text-slate-500'}`} />
                                <span>{isMaint ? 'Maintenance' : 'Live'}</span>
                              </button>
                            </td>
                            <td className="p-3.5 text-right space-x-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEditProduct(prod)}
                                className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 rounded-lg transition cursor-pointer inline-flex items-center gap-1 text-xs font-semibold"
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
            )}
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
                      {allUsers.map((u, idx) => (
                        <option key={`direct-user-${u.user_id || idx}`} value={String(u.user_id)}>
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

                    <div className="flex gap-2">
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
                              text: `Successfully credited +₹${amt.toFixed(2)} to User #${targetUid}!`,
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
                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                          isProcessingPayment || !directPayUserId || !directPayAmount || Number(directPayAmount) <= 0
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50 hover:shadow-emerald-900/50'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        {isProcessingPayment ? 'Processing...' : `+ Add ₹${directPayAmount || '0'}`}
                      </button>

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
                            : (directPayReason + ' (Deduction)');

                          try {
                            updateUserBalance(targetUid, -amt, finalReason, directPayNotify);
                            const userObj = allUsers.find(u => u.user_id === targetUid);
                            const updatedBal = Math.max(0, (userObj ? userObj.balance : 0) - amt);

                            setDirectPayStatus({
                              type: 'success',
                              text: `Successfully deducted -₹${amt.toFixed(2)} from User #${targetUid}!`,
                              details: `New Balance: ₹${updatedBal.toFixed(2)} | Note: ${finalReason} | Telegram Alert: ${directPayNotify ? 'Sent' : 'Skipped'}`
                            });
                          } catch (err: any) {
                            setDirectPayStatus({
                              type: 'error',
                              text: `Failed to deduct balance: ${err.message || 'Unknown error'}`
                            });
                          } finally {
                            setIsProcessingPayment(false);
                          }
                        }}
                        className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          isProcessingPayment || !directPayUserId || !directPayAmount || Number(directPayAmount) <= 0
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-rose-600/80 hover:bg-rose-600 text-white shadow'
                        }`}
                      >
                        - Deduct
                      </button>
                    </div>
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

            {/* Mobile Users Cards (Optimized for One-Handed Phone Operation) */}
            <div className="grid grid-cols-1 gap-3.5 md:hidden">
              {filteredUsers.map((user, idx) => {
                const chatId = user.chat_id || user.user_id;
                return (
                  <div key={`mob-user-${user.user_id || idx}`} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-base font-bold text-white">{user.first_name}</h4>
                          {user.is_vip ? <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold border border-amber-500/30">🌟 VIP</span> : null}
                          {user.is_reseller ? <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-bold border border-indigo-500/30">👑 Reseller</span> : null}
                          {user.is_banned ? <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-bold border border-rose-500/30">🚫 Banned</span> : null}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">@{user.username || 'none'}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px]">Balance</span>
                        <span className="text-base font-black text-emerald-400 font-mono">₹{user.balance.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs font-mono">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        {/* Telegram User ID */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            UID
                          </span>
                          <span className="font-bold text-cyan-300">{user.user_id}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(String(user.user_id), `mob_uid_${user.user_id}`)}
                            className="text-slate-500 hover:text-cyan-400 p-0.5 transition cursor-pointer"
                            title="Copy Telegram UID"
                          >
                            {copiedItem === `mob_uid_${user.user_id}` ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Telegram Chat ID */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            CHAT ID
                          </span>
                          <span className="text-slate-300 font-semibold">{chatId}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(String(chatId), `mob_chat_${user.user_id}`)}
                            className="text-slate-500 hover:text-indigo-400 p-0.5 transition cursor-pointer"
                            title="Copy Telegram Chat ID"
                          >
                            {copiedItem === `mob_chat_${user.user_id}` ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-900 text-slate-400">
                        <span>🛒 {user.orders_count} orders</span>
                        <span>₹{(user.spent || 0).toFixed(2)} spent</span>
                        <span className="text-[10px] opacity-75">{user.joined_date ? user.joined_date.split(' ')[0] : 'Active'}</span>
                      </div>
                    </div>

                    {/* Big Finger-Friendly Mobile Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setDirectPayUserId(String(user.user_id));
                          setBalanceAdjustAmt('100');
                        }}
                        className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95 min-h-[44px]"
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>+ Add Money</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedUserForModal(user.user_id)}
                        className="py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95 min-h-[44px]"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Inspect & Ban</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Users Table */}
            <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Telegram IDs</th>
                      <th className="p-3.5">User / Account</th>
                      <th className="p-3.5">Wallet Balance</th>
                      <th className="p-3.5">Level</th>
                      <th className="p-3.5">Orders / Spent</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.map((user, idx) => {
                      const chatId = user.chat_id || user.user_id;
                      return (
                        <tr key={`desk-user-${user.user_id || idx}`} className="hover:bg-slate-800/40 transition">
                          <td className="p-3.5">
                            <div className="space-y-1">
                              {/* Telegram User ID */}
                              <div className="flex items-center gap-1.5 font-mono">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                                  UID
                                </span>
                                <span className="font-bold text-cyan-300">{user.user_id}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(String(user.user_id), `uid_${user.user_id}`)}
                                  className="text-slate-500 hover:text-cyan-400 p-0.5 transition cursor-pointer"
                                  title="Copy Telegram User ID"
                                >
                                  {copiedItem === `uid_${user.user_id}` ? (
                                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>

                              {/* Telegram Chat ID */}
                              <div className="flex items-center gap-1.5 font-mono">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                                  CHAT ID
                                </span>
                                <span className="text-slate-300 text-[11px]">{chatId}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(String(chatId), `chat_${user.user_id}`)}
                                  className="text-slate-500 hover:text-indigo-400 p-0.5 transition cursor-pointer"
                                  title="Copy Telegram Chat ID"
                                >
                                  {copiedItem === `chat_${user.user_id}` ? (
                                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden shadow">
                                {user.avatar_url ? (
                                  <img src={user.avatar_url} alt={user.first_name} className="w-full h-full object-cover" />
                                ) : (
                                  user.first_name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  <span>{user.first_name}</span>
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono">
                                  @{user.username || 'none'}
                                </div>
                                <div className="text-[10px] text-cyan-400/90 font-mono flex items-center gap-1 mt-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>Login: {user.last_login || user.login_at || user.joined_date.split(' ')[0]}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 font-bold text-emerald-400 text-sm font-mono">₹{user.balance.toFixed(2)}</td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-1 flex-wrap">
                              {user.referral_count && user.referral_count > 0 ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                                  🎁 Promoter ({user.referral_count})
                                </span>
                              ) : null}
                              {user.referred_by ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                  🔗 Ref #{user.referred_by}
                                </span>
                              ) : null}
                              {user.is_reseller ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  👑 Reseller
                                </span>
                              ) : null}
                              {!user.referral_count && !user.referred_by && !user.is_reseller && (
                                <span className="text-slate-400 text-xs">Standard</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-semibold text-slate-200">{user.orders_count} orders</div>
                            <div className="text-[11px] text-slate-400 font-mono">Spent: ₹{user.spent.toFixed(2)}</div>
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
                                className="px-2.5 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
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
                      );
                    })}
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
                    onClick={() => setActiveTab('my_bots')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded-xl text-xs font-semibold cursor-pointer transition"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    Manage Bot Fleet
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
                        id: 'referrers',
                        label: 'Top Promoters',
                        count: allUsers.filter(u => (u.referral_count || 0) > 0).length,
                        badge: 'Promoters',
                        color: 'border-pink-500 bg-pink-500/10 text-pink-300'
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
                        key={`bcast-tpl-${tpl.title || i}`}
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

                {/* 4. Media Type & Banner / Video / Voice / Audio & Action Button */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                      4. Select Media Format & Attachment
                    </span>
                    <span className="text-[10px] text-cyan-400 font-normal">
                      Photos • Videos • Voice Notes • Audio • Text
                    </span>
                  </label>

                  {/* Hidden Native File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={
                      broadcastForm.mediaType === 'photo'
                        ? 'image/*'
                        : broadcastForm.mediaType === 'video'
                        ? 'video/*'
                        : broadcastForm.mediaType === 'audio'
                        ? 'audio/*'
                        : 'audio/*,image/*,video/*'
                    }
                    onChange={handleDirectFileUpload}
                  />

                  {/* Media Type Selector Tabs */}
                  <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setBroadcastForm(p => ({ ...p, mediaType: 'text' }));
                        setMediaFile(null);
                      }}
                      className={`py-2 px-1 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        broadcastForm.mediaType === 'text'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Text</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBroadcastForm(p => ({ ...p, mediaType: 'photo' }))}
                      className={`py-2 px-1 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        broadcastForm.mediaType === 'photo'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBroadcastForm(p => ({ ...p, mediaType: 'video' }))}
                      className={`py-2 px-1 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        broadcastForm.mediaType === 'video'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Video</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBroadcastForm(p => ({ ...p, mediaType: 'voice' }))}
                      className={`py-2 px-1 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        broadcastForm.mediaType === 'voice'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Voice</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBroadcastForm(p => ({ ...p, mediaType: 'audio' }))}
                      className={`py-2 px-1 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        broadcastForm.mediaType === 'audio'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Audio</span>
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* Live Voice Note Recording Studio */}
                    {broadcastForm.mediaType === 'voice' && (
                      <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-300 flex items-center gap-1.5 text-xs">
                            <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />
                            Live In-Browser Voice Note Studio
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Records high quality OGG/OPUS voice note
                          </span>
                        </div>

                        {/* Voice Recording Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                          {isRecordingVoice ? (
                            <div className="flex items-center gap-3">
                              <span className="relative flex h-3.5 w-3.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500" />
                              </span>
                              <span className="font-mono font-bold text-rose-300 text-sm">
                                Recording: {formatRecordingTime(recordingSeconds)}
                              </span>
                            </div>
                          ) : recordedAudioUrl ? (
                            <div className="flex items-center gap-2 text-emerald-300 font-medium text-xs">
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                              <span>Voice Note Recorded Ready ({formatRecordingTime(recordingSeconds)})</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">
                              Click start to record your voice note live via microphone:
                            </span>
                          )}

                          <div className="flex items-center gap-2">
                            {isRecordingVoice ? (
                              <button
                                type="button"
                                onClick={stopVoiceRecording}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1 shadow"
                              >
                                ⏹️ Stop Recording
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={startVoiceRecording}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1 shadow-md shadow-emerald-600/30"
                              >
                                🎙️ {recordedAudioUrl ? 'Re-record Voice' : 'Start Recording'}
                              </button>
                            )}

                            {recordedAudioUrl && !isRecordingVoice && (
                              <button
                                type="button"
                                onClick={clearVoiceRecording}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Audio Playback Preview */}
                        {recordedAudioUrl && (
                          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block">Preview Audio Note:</span>
                            <audio controls src={recordedAudioUrl} className="w-full h-9 accent-emerald-500" />
                          </div>
                        )}

                        <div className="text-center pt-1 border-t border-slate-900">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[11px] text-indigo-400 hover:underline cursor-pointer font-medium"
                          >
                            📁 Or select an existing .ogg / .mp3 audio file from your device
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Direct File Picker for Photo / Video / Audio */}
                    {broadcastForm.mediaType !== 'text' && broadcastForm.mediaType !== 'voice' && (
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                            <Download className="w-4 h-4 text-indigo-400" />
                            Direct Device File Selector
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Select directly from phone gallery / computer files
                          </span>
                        </div>

                        {mediaFile ? (
                          <div className="p-3 bg-slate-900 rounded-xl border border-indigo-500/40 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-indigo-300 text-xs truncate max-w-[200px]">
                                📄 {mediaFile.filename}
                              </span>
                              <button
                                type="button"
                                onClick={() => setMediaFile(null)}
                                className="text-rose-400 hover:text-rose-300 text-xs font-bold cursor-pointer"
                              >
                                ✕ Remove
                              </button>
                            </div>

                            {/* Media File Preview */}
                            {mediaFile.mimeType.startsWith('image/') && (
                              <img src={mediaFile.previewUrl} alt="Preview" className="h-32 object-cover rounded-lg border border-slate-800" />
                            )}
                            {mediaFile.mimeType.startsWith('video/') && (
                              <video controls src={mediaFile.previewUrl} className="h-36 w-full object-cover rounded-lg border border-slate-800" />
                            )}
                            {mediaFile.mimeType.startsWith('audio/') && (
                              <audio controls src={mediaFile.previewUrl} className="w-full accent-indigo-500" />
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-6 bg-slate-900 hover:bg-slate-800/80 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl text-slate-300 transition cursor-pointer flex flex-col items-center justify-center gap-2 group"
                          >
                            <Download className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition" />
                            <span className="font-bold text-xs">
                              Click to select {broadcastForm.mediaType === 'photo' ? 'Photo' : broadcastForm.mediaType === 'video' ? 'Video' : 'Audio'} file from device
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Supports JPG, PNG, WEBP, MP4, MOV, MP3, WAV
                            </span>
                          </button>
                        )}
                      </div>
                    )}

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
                    disabled={sendingBroadcast || (!broadcastForm.text.trim() && !mediaFile)}
                    onClick={async () => {
                      setSendingBroadcast(true);
                      setBroadcastStatusMsg(null);
                      try {
                        const res = await sendBroadcastMessage({
                          targetAudience: broadcastForm.targetAudience,
                          mediaType: broadcastForm.mediaType,
                          text: broadcastForm.text,
                          imageUrl: broadcastForm.imageUrl || undefined,
                          videoUrl: broadcastForm.videoUrl || undefined,
                          voiceUrl: broadcastForm.voiceUrl || undefined,
                          audioUrl: broadcastForm.audioUrl || undefined,
                          mediaBase64: mediaFile?.base64 || undefined,
                          mediaFilename: mediaFile?.filename || undefined,
                          mediaMimeType: mediaFile?.mimeType || undefined,
                          buttonText: broadcastForm.buttonText,
                          buttonUrl: broadcastForm.buttonUrl,
                          pinMessage: broadcastForm.pinMessage
                        });

                        const targetLabel =
                          broadcastForm.targetAudience === 'all'
                            ? `All Users (${res.recipientCount})`
                            : broadcastForm.targetAudience === 'referrers'
                            ? `Top Promoters (${res.recipientCount})`
                            : broadcastForm.targetAudience === 'reseller'
                            ? `Resellers (${res.recipientCount})`
                            : `Regular Users (${res.recipientCount})`;

                        setBroadcastHistory(prev => [
                          {
                            id: `bcast_${Date.now()}`,
                            target: targetLabel,
                            text: `[${broadcastForm.mediaType.toUpperCase()}] ${broadcastForm.text || 'Media Message'}`,
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
                      sendingBroadcast || (!broadcastForm.text.trim() && broadcastForm.mediaType === 'text')
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
                          📢 Dispatch {broadcastForm.mediaType.toUpperCase()} Broadcast (
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
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-mono uppercase font-bold">
                      {broadcastForm.mediaType} Mode
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
                      {broadcastForm.mediaType === 'photo' && broadcastForm.imageUrl && broadcastForm.imageUrl.trim() && (
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

                      {/* Video Media Preview */}
                      {broadcastForm.mediaType === 'video' && (
                        <div className="rounded-xl overflow-hidden border border-slate-700/60 bg-slate-950 p-2 space-y-1">
                          {broadcastForm.videoUrl && broadcastForm.videoUrl.startsWith('http') ? (
                            <video
                              controls
                              src={broadcastForm.videoUrl}
                              className="w-full rounded-lg max-h-48 bg-black object-contain"
                            />
                          ) : (
                            <div className="p-4 flex flex-col items-center justify-center text-purple-400 space-y-1 text-center">
                              <Video className="w-8 h-8 animate-pulse" />
                              <span className="text-xs font-bold">Video Attachment</span>
                              <span className="text-[10px] text-slate-400 font-mono">{broadcastForm.videoUrl || 'Telegram Video File'}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Voice Note Media Preview */}
                      {broadcastForm.mediaType === 'voice' && (
                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-700/60 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                            <Mic className="w-5 h-5 animate-pulse" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
                              <span>🎙️ Voice Message</span>
                              <span className="text-emerald-400 font-mono">0:18</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex items-center gap-0.5 px-1">
                              <div className="h-full bg-emerald-400 w-1/3 rounded-full" />
                              <div className="h-full bg-slate-700 flex-1 rounded-full" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Audio Track Media Preview */}
                      {broadcastForm.mediaType === 'audio' && (
                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-700/60 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/40 flex items-center justify-center shrink-0">
                            <Volume2 className="w-5 h-5 animate-pulse" />
                          </div>
                          <div className="flex-1 space-y-0.5">
                            <span className="text-xs font-bold text-white block">🎵 Audio Track Attachment</span>
                            <span className="text-[10px] text-slate-400 block font-mono truncate">{broadcastForm.audioUrl || 'Telegram Audio Track'}</span>
                          </div>
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
                          {allUsers.map((u, idx) => (
                            <option key={`sim-user-${u.user_id || idx}`} value={u.user_id}>
                              {u.first_name} (UID: {u.user_id}) - {u.is_reseller ? 'Reseller' : 'Regular'}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setActiveTab('my_bots')}
                          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold cursor-pointer transition shrink-0"
                        >
                          View Bots
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        When you dispatch a broadcast, it is automatically pushed in real-time to all live Telegram users matching your target audience.
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
                    {broadcastHistory.map((bh, idx) => (
                      <div
                        key={`bcast-hist-${bh.id || idx}`}
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
              {tickets.map((t, idx) => (
                <div
                  key={`ticket-card-${t.id || idx}`}
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

        {/* ================= REFERRALS TAB ================= */}
        {adminTab === 'referrals' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header & Global Switch */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-pink-500/15 text-pink-300 border border-pink-500/30 flex items-center justify-center shrink-0">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Refer & Earn Program Control Center
                    </h3>
                    <p className="text-xs text-slate-400">
                      Configure viral invite rewards, instant cash bonuses, and lifetime commission rates.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => updateSettings({ referral_system_status: settings.referral_system_status === 'OFF' ? 'ON' : 'OFF' })}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border shadow-sm active:scale-95 ${
                    settings.referral_system_status !== 'OFF'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${settings.referral_system_status !== 'OFF' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  <span>Program: {settings.referral_system_status !== 'OFF' ? 'ACTIVE & LIVE' : 'DISABLED'}</span>
                </button>
              </div>

              {/* KPI Metrics */}
              {(() => {
                const referredUsers = allUsers.filter(u => u.referred_by);
                const activeReferrers = allUsers.filter(u => (u.referral_count || 0) > 0);
                const totalPaidRewards = allUsers.reduce((sum, u) => sum + (u.referral_earnings || 0), 0);

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Referred</span>
                      <span className="text-lg font-black text-white mt-1 block font-mono">{referredUsers.length} Users</span>
                    </div>

                    <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Active Referrers</span>
                      <span className="text-lg font-black text-pink-300 mt-1 block font-mono">{activeReferrers.length} Users</span>
                    </div>

                    <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Rewards Paid</span>
                      <span className="text-lg font-black text-emerald-300 mt-1 block font-mono">₹{totalPaidRewards.toFixed(2)}</span>
                    </div>

                    <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Per-Invite Reward</span>
                      <span className="text-lg font-black text-cyan-300 mt-1 block font-mono">₹{(settings.referral_reward_inr ?? 1.50).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Configuration Settings Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <SettingsIcon className="w-4 h-4 text-cyan-400" />
                Referral Program Payout Rules & Bonuses
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Instant Referrer Reward (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      step="0.10"
                      value={settings.referral_reward_inr ?? 1.50}
                      onChange={(e) => updateSettings({ referral_reward_inr: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs font-bold text-pink-300 outline-none focus:border-pink-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Paid to referrer immediately when new user starts bot.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Referee Welcome Bonus (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      step="0.10"
                      value={settings.referral_referee_bonus_inr ?? 1.50}
                      onChange={(e) => updateSettings({ referral_referee_bonus_inr: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs font-bold text-cyan-300 outline-none focus:border-cyan-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Free test credit credited to the invited friend.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Lifetime Purchase Commission (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={settings.referral_commission_percent ?? 5}
                      onChange={(e) => updateSettings({ referral_commission_percent: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-emerald-400 outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-sm">%</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Percentage cut from every deposit & key purchase.</p>
                </div>
              </div>
            </div>

            {/* Top Referrers Leaderboard Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Top Referrers Leaderboard
                </h4>
                <span className="text-xs text-slate-400 font-mono">
                  {allUsers.filter(u => (u.referral_count || 0) > 0).length} active promoters
                </span>
              </div>

              {(() => {
                const sortedReferrers = [...allUsers]
                  .filter(u => (u.referral_count || 0) > 0 || (u.referral_earnings || 0) > 0)
                  .sort((a, b) => (b.referral_earnings || 0) - (a.referral_earnings || 0));

                if (sortedReferrers.length === 0) {
                  return (
                    <div className="p-8 text-center text-slate-400 text-xs bg-slate-950/60 rounded-xl border border-slate-800">
                      No referral activities recorded yet. When users invite friends using <code>/start ref_USERID</code>, they will appear here.
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="pb-2.5 font-bold uppercase text-[10px]">Rank</th>
                          <th className="pb-2.5 font-bold uppercase text-[10px]">User</th>
                          <th className="pb-2.5 font-bold uppercase text-[10px]">User ID</th>
                          <th className="pb-2.5 font-bold uppercase text-[10px] text-center">Invited Count</th>
                          <th className="pb-2.5 font-bold uppercase text-[10px] text-right">Total Earned (₹)</th>
                          <th className="pb-2.5 font-bold uppercase text-[10px] text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {sortedReferrers.map((user, idx) => (
                          <tr key={`top-ref-${user.user_id}-${idx}`} className="hover:bg-slate-800/40 transition">
                            <td className="py-3 font-bold font-mono">
                              {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                            </td>
                            <td className="py-3">
                              <div className="font-bold text-white">{user.first_name}</div>
                              <div className="text-[11px] text-slate-400">@{user.username || 'user'}</div>
                            </td>
                            <td className="py-3 font-mono text-cyan-300">
                              <code>{user.user_id}</code>
                            </td>
                            <td className="py-3 text-center font-bold text-pink-300 font-mono">
                              {user.referral_count || 0}
                            </td>
                            <td className="py-3 text-right font-extrabold text-emerald-400 font-mono">
                              ₹{(user.referral_earnings || 0).toFixed(2)}
                            </td>
                            <td className="py-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setDirectPayUserId(String(user.user_id));
                                  setDirectPayReason('Bonus Credit / Promo Reward');
                                  handleTabChange('users');
                                }}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                              >
                                View / Credit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Recent Referral Link Signups Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Recent Referred Users Ledger
              </h4>

              {(() => {
                const referredUsers = allUsers.filter(u => u.referred_by);
                if (referredUsers.length === 0) {
                  return (
                    <div className="p-6 text-center text-slate-400 text-xs bg-slate-950/60 rounded-xl border border-slate-800">
                      No referred signups recorded yet.
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="pb-2.5 font-bold uppercase text-[10px]">Referred User</th>
                          <th className="pb-2.5 font-bold uppercase text-[10px]">Referee UID</th>
                          <th className="pb-2.5 font-bold uppercase text-[10px]">Invited By (Referrer UID)</th>
                          <th className="pb-2.5 font-bold uppercase text-[10px]">Joined Date</th>
                          <th className="pb-2.5 font-bold uppercase text-[10px] text-right">Spent (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {referredUsers.map((u, uIdx) => {
                          const referrer = allUsers.find(r => r.user_id === u.referred_by);
                          return (
                            <tr key={`ref-sub-${u.user_id}-${uIdx}`} className="hover:bg-slate-800/40 transition">
                              <td className="py-2.5 font-bold text-white">
                                {u.first_name} <span className="text-slate-400 font-normal">(@{u.username || 'user'})</span>
                              </td>
                              <td className="py-2.5 font-mono text-cyan-300">
                                <code>{u.user_id}</code>
                              </td>
                              <td className="py-2.5 font-mono text-pink-300">
                                <code>#{u.referred_by}</code> {referrer ? `(${referrer.first_name})` : ''}
                              </td>
                              <td className="py-2.5 text-slate-400 font-mono text-[11px]">
                                {u.joined_date.substring(0, 16)}
                              </td>
                              <td className="py-2.5 text-right font-bold text-emerald-400 font-mono">
                                ₹{u.spent.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
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
                  {coupons.map((c, idx) => (
                    <tr key={`coupon-row-${c.code || idx}`} className="hover:bg-slate-800/40">
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
            {/* Active Bot Context Banner */}
            <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow">
                  🤖
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-400">Configuring Active Bot</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      LIVE
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {activeBot?.name || 'Default Bot'} <span className="text-cyan-300 font-mono text-xs">(@{activeBot?.username || settings.bot_username || 'kalam_bot'})</span>
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAdminTab('bots')}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  View All Bots ({bots.length})
                </button>
              </div>
            </div>

            {/* Telegram Bot Global Maintenance Control Center */}
            <div className={`border-2 rounded-2xl p-5 space-y-4 shadow-xl transition-all duration-200 ${
              isMaintenanceActive(settings)
                ? 'bg-rose-950/40 border-rose-500/50 shadow-rose-950/50'
                : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                    isMaintenanceActive(settings)
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">
                        Telegram Bot Maintenance Mode
                      </h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                        isMaintenanceActive(settings)
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}>
                        {isMaintenanceActive(settings) ? '🚧 UNDER MAINTENANCE' : '🟢 ONLINE / ACTIVE'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Instantly pause user operations on the Telegram bot & display a custom maintenance notice with reasoning.
                    </p>
                  </div>
                </div>

                {/* Master Maintenance Mode Switch */}
                <label className="flex items-center gap-2.5 cursor-pointer bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                  <span className="text-xs font-bold text-slate-200">
                    {isMaintenanceActive(settings) ? 'Maintenance Active' : 'Enable Maintenance'}
                  </span>
                  <input
                    type="checkbox"
                    checked={isMaintenanceActive(settings)}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      updateSettings({
                        maintenance_mode: isChecked,
                        bot_status: isChecked ? 'OFF' : 'ON'
                      });
                    }}
                    className="w-5 h-5 rounded accent-rose-500 cursor-pointer"
                  />
                </label>
              </div>

              {/* Maintenance Message & Reason Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                    <span>Maintenance Headline / Title</span>
                    <span className="text-[10px] text-slate-500 font-normal">Shown as bold header</span>
                  </label>
                  <input
                    type="text"
                    value={settings.maintenance_message ?? '🛠 BOT UNDER MAINTENANCE'}
                    onChange={(e) => updateSettings({ maintenance_message: e.target.value })}
                    placeholder="e.g. 🛠 BOT UNDER MAINTENANCE or ⚡ SYSTEM UPGRADE IN PROGRESS"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 outline-none font-bold text-xs focus:border-rose-400"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    This main title will appear in Telegram when users send any message or press buttons.
                  </p>
                </div>

                <div>
                  <label className="text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                    <span>Specific Issue / Reason (Custom Note)</span>
                    <span className="text-[10px] text-slate-500 font-normal">Shown to users</span>
                  </label>
                  <textarea
                    rows={2}
                    value={settings.maintenance_reason ?? 'We are upgrading server systems and restocking fresh panel keys. Will be back shortly!'}
                    onChange={(e) => updateSettings({ maintenance_reason: e.target.value })}
                    placeholder="e.g. Free Fire server update in progress. All key injections paused for 30 minutes."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 outline-none text-xs focus:border-rose-400 resize-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Provide users with the exact problem explanation and estimated return time.
                  </p>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="bg-slate-950/90 rounded-xl p-3.5 border border-slate-800 space-y-1.5 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Live Telegram Notice Preview:
                </span>
                <div className="p-3 bg-slate-900 rounded-lg border border-rose-500/20 font-mono text-[11px] text-slate-300 space-y-1">
                  <div className="text-rose-400 font-bold">
                    🚧 {settings.maintenance_message || '🛠 BOT UNDER MAINTENANCE'} 🚧
                  </div>
                  <div>━━━━━━━━━━━━━━━━━━━━</div>
                  <div className="text-amber-200">
                    ⚠️ <b>Notice:</b> {settings.maintenance_reason || 'We are upgrading server systems and restocking fresh panel keys. Will be back shortly!'}
                  </div>
                  <div className="text-slate-400 pt-1 text-[10px]">
                    ⏱ <b>Status:</b> Temporary Maintenance / Offline
                  </div>
                </div>
              </div>
            </div>

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
                      Master Admin Numeric ID (Chat ID)
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
                  <p className="text-[10px] text-amber-300/90 mt-1.5">
                    ⚡ Type <code>@admin</code> or <code>/admin</code> in Telegram to launch the Admin Terminal directly inside your bot!
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

                <div>
                  <label className="text-slate-400 mb-1 block font-semibold flex items-center justify-between">
                    <span>Minimum Bot Deposit (₹)</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Min Allowed</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500 text-xs font-bold">₹</span>
                    <input
                      type="number"
                      min="1"
                      value={settings.min_deposit_inr !== undefined ? settings.min_deposit_inr : 1}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        updateSettings({ min_deposit_inr: val > 0 ? val : 1 });
                        if (activeBot) {
                          updateActiveBotGateway({ min_deposit_inr: val > 0 ? val : 1 });
                        }
                      }}
                      placeholder="1"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-emerald-300 outline-none font-mono text-xs font-bold focus:border-emerald-400"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Lowest amount a Telegram user can add to their wallet
                  </p>
                </div>

                <div>
                  <label className="text-slate-400 mb-1 block font-semibold flex items-center justify-between">
                    <span>Maximum Bot Deposit (₹)</span>
                    <span className="text-[10px] text-cyan-400 font-mono">Max Allowed</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500 text-xs font-bold">₹</span>
                    <input
                      type="number"
                      min="10"
                      value={settings.max_deposit_inr !== undefined ? settings.max_deposit_inr : 50000}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        updateSettings({ max_deposit_inr: val > 0 ? val : 50000 });
                        if (activeBot) {
                          updateActiveBotGateway({ max_deposit_inr: val > 0 ? val : 50000 });
                        }
                      }}
                      placeholder="50000"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-cyan-300 outline-none font-mono text-xs font-bold focus:border-emerald-400"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Highest amount a Telegram user can add in one deposit
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

            {/* Support Links & Channels */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  Support Contacts, Channels & Web App Links
                </h3>
                <span className="text-[11px] text-emerald-400/90 font-medium">
                  Synced directly to Telegram Bot buttons & messages
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                {/* Admin Hub Mini App Web App URL */}
                <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/40 sm:col-span-2 md:col-span-3">
                  <label className="text-amber-300 font-bold mb-1 flex items-center gap-1.5 text-xs">
                    <Globe className="w-4 h-4 text-amber-400" />
                    Telegram Admin Hub Web App URL (Mini App Link)
                  </label>
                  <input
                    type="text"
                    value={settings.webapp_url || ''}
                    onChange={(e) => updateSettings({ webapp_url: e.target.value })}
                    placeholder="https://your-website-domain.com or https://ais-pre-r6cejgnkl2dpbdqri7c2dv-128464619421.asia-east1.run.app"
                    className="w-full bg-slate-900 border border-amber-500/40 rounded-lg px-3 py-2 text-amber-200 outline-none focus:border-amber-400 font-mono text-xs shadow-inner"
                  />
                  <p className="text-[11px] text-amber-300/80 mt-1 font-medium">
                    This exact URL will be opened when you click <b>"🚀 Launch Admin Hub (Mini App)"</b> or <b>"🌐 Open Admin Hub in Browser"</b> in Telegram Bot.
                  </p>
                </div>

                {/* APK Direct Download URL */}
                <div className="bg-slate-950 p-3 rounded-xl border border-cyan-500/30">
                  <label className="text-cyan-300 font-bold mb-1 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    APK Direct Download URL
                  </label>
                  <input
                    type="text"
                    value={settings.apk_download_url || ''}
                    onChange={(e) => updateSettings({ apk_download_url: e.target.value })}
                    placeholder="https://t.me/KalamFFPanelAPKs/123 or https://example.com/panel.apk"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-cyan-200 outline-none focus:border-cyan-400 font-mono text-xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Direct APK download link shown on "Check Update" and key delivery.
                  </p>
                </div>

                {/* APK Download Channel */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <label className="text-cyan-300 font-bold mb-1 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-cyan-400" />
                    APK Telegram Channel Link
                  </label>
                  <input
                    type="text"
                    value={settings.apk_channel_link || ''}
                    onChange={(e) => updateSettings({ apk_channel_link: e.target.value })}
                    placeholder="https://t.me/KalamFFPanelAPKs"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-cyan-200 outline-none focus:border-cyan-400 font-mono text-xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Link to your APK updates channel on Telegram.
                  </p>
                </div>

                {/* Official Community Channel */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <label className="text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-blue-400" />
                    Official News & Updates Channel
                  </label>
                  <input
                    type="text"
                    value={settings.official_channel_link || ''}
                    onChange={(e) => updateSettings({ official_channel_link: e.target.value })}
                    placeholder="https://t.me/KalamFFPanelChannel"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-blue-200 outline-none focus:border-blue-400 font-mono text-xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Announcement & updates channel for users.
                  </p>
                </div>

                {/* Tutorial Video Link */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <label className="text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                    Tutorial Video / Setup Guide
                  </label>
                  <input
                    type="text"
                    value={settings.how_to_video || ''}
                    onChange={(e) => updateSettings({ how_to_video: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-amber-200 outline-none focus:border-amber-400 font-mono text-xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    YouTube or Telegram guide link shown upon key delivery.
                  </p>
                </div>

                {/* Telegram Support URL */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <label className="text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    Telegram Support Contact
                  </label>
                  <input
                    type="text"
                    value={settings.support_telegram || ''}
                    onChange={(e) => updateSettings({ support_telegram: e.target.value })}
                    placeholder="https://t.me/KalamPanelSupport"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-emerald-200 outline-none focus:border-emerald-400 font-mono text-xs"
                  />
                </div>

                {/* WhatsApp Support URL */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <label className="text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    WhatsApp Support URL
                  </label>
                  <input
                    type="text"
                    value={settings.support_whatsapp || ''}
                    onChange={(e) => updateSettings({ support_whatsapp: e.target.value })}
                    placeholder="https://wa.me/919876543210"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-emerald-200 outline-none focus:border-emerald-400 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Telegram Bot Slash Commands & API Menu Manager */}
            <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-5 space-y-4 shadow-xl shadow-indigo-950/20">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Bot className="w-4 h-4 text-indigo-400" />
                    Telegram Bot Slash Commands Manager (Bot Menu Control)
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Manage, add, edit, or delete <code className="text-indigo-300 font-bold">/</code> slash commands registered on Telegram API (<code className="text-slate-300">/Menu</code> button popup in Telegram).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={syncingCommands}
                    onClick={() => handleSyncCommands(botCommands)}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-600/30"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {syncingCommands ? 'Syncing Telegram API...' : '⚡ Sync Commands to Bot'}
                  </button>

                  <button
                    type="button"
                    disabled={syncingCommands}
                    onClick={handleClearCommands}
                    className="px-3 py-2 bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>🗑️ Delete / Clear All Commands</span>
                  </button>
                </div>
              </div>

              {/* Status Notification */}
              {cmdStatus && (
                <div className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between gap-2 ${
                  cmdStatus.type === 'success'
                    ? 'bg-emerald-950/90 border border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/90 border border-rose-500/40 text-rose-200'
                }`}>
                  <span>{cmdStatus.text}</span>
                  <button type="button" onClick={() => setCmdStatus(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
                </div>
              )}

              {/* Active Slash Commands List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
                  <span className="flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                    Registered Slash Commands ({botCommands.length})
                  </span>
                  <span className="text-[10px] text-indigo-400 font-mono">
                    Telegram setMyCommands API Enabled
                  </span>
                </div>

                {botCommands.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950 rounded-xl border border-dashed border-slate-800 text-slate-400 text-xs space-y-1">
                    <p className="font-bold text-rose-400">No active Telegram slash commands!</p>
                    <p className="text-slate-500 text-[11px]">Click <b>"+ Add Command"</b> below or Sync to register new commands on your Telegram Bot.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {botCommands.map((cmd, idx) => (
                      <div key={idx} className="bg-slate-950 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-3 flex items-center justify-between gap-2 text-xs transition">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/30 text-xs">
                              /{cmd.command}
                            </span>
                          </div>
                          <p className="text-slate-300 text-[11px] truncate mt-1">
                            {cmd.description}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const updated = botCommands.filter((_, i) => i !== idx);
                            setBotCommands(updated);
                            handleSyncCommands(updated);
                          }}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 rounded-lg transition shrink-0 cursor-pointer border border-transparent hover:border-rose-500/30"
                          title="Delete / Remove this command"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Command Form */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-200 block flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  Add New Slash Command to Telegram Bot Menu
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={newCmdName}
                      onChange={(e) => setNewCmdName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="command (e.g. redeem)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-indigo-300 outline-none focus:border-indigo-500 font-mono text-xs"
                    />
                  </div>
                  <div className="sm:col-span-6">
                    <input
                      type="text"
                      value={newCmdDesc}
                      onChange={(e) => setNewCmdDesc(e.target.value)}
                      placeholder="Description (e.g. 🎁 Redeem voucher key)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      disabled={!newCmdName.trim() || !newCmdDesc.trim()}
                      onClick={() => {
                        if (!newCmdName.trim() || !newCmdDesc.trim()) return;
                        const updated = [...botCommands, { command: newCmdName.trim(), description: newCmdDesc.trim() }];
                        setBotCommands(updated);
                        setNewCmdName('');
                        setNewCmdDesc('');
                        handleSyncCommands(updated);
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition cursor-pointer disabled:opacity-50 text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-600/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
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
              {logs.map((log, idx) => (
                <div key={`audit-log-${log.id || idx}`} className="p-3.5 flex items-start justify-between gap-4 text-xs hover:bg-slate-800/40 transition">
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

        {/* ================= SYSTEM HEALTH & LOGS DEDICATED TAB ================= */}
        {adminTab === 'health' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <SystemHealthWidget onRefreshParent={() => {}} />
          </div>
        )}
      </div>

      {/* ================= USER INSPECT & MODIFY MODAL ================= */}
      {selectedUserForModal && (() => {
        const u = allUsers.find(user => user.user_id === selectedUserForModal);
        if (!u) return null;
        const userChatId = u.chat_id || u.user_id;

        return (
          <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-6 overflow-y-auto pb-28 sm:pb-6">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-4 sm:p-5 space-y-4 shadow-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-base shrink-0 overflow-hidden shadow-lg border border-white/20">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt={u.first_name} className="w-full h-full object-cover" />
                    ) : (
                      u.first_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white truncate">{u.first_name}</h3>
                      <span className="text-[11px] text-slate-400 font-mono">@{u.username || 'none'}</span>
                    </div>
                    
                    {/* Telegram IDs Pill Bar */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-lg border border-cyan-500/30 text-[11px] font-mono">
                        <span className="text-cyan-400 font-bold">UID:</span>
                        <span className="text-slate-200 font-semibold">{u.user_id}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(String(u.user_id), 'modal_uid')}
                          className="text-slate-500 hover:text-cyan-400 p-0.5 transition cursor-pointer"
                          title="Copy Telegram UID"
                        >
                          {copiedItem === 'modal_uid' ? (
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-lg border border-indigo-500/30 text-[11px] font-mono">
                        <span className="text-indigo-400 font-bold">CHAT ID:</span>
                        <span className="text-slate-200 font-semibold">{userChatId}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(String(userChatId), 'modal_chat')}
                          className="text-slate-500 hover:text-indigo-400 p-0.5 transition cursor-pointer"
                          title="Copy Telegram Chat ID"
                        >
                          {copiedItem === 'modal_chat' ? (
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUserForModal(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Login & Registration Timing Bar */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Clock className="w-3 h-3 animate-pulse" />
                  <span>Last Login: <b>{u.last_login || u.login_at || 'Active Now'}</b></span>
                </span>
                <span className="text-slate-500">
                  Joined: {u.joined_date ? u.joined_date.split(' ')[0] : 'N/A'}
                </span>
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

      {/* ================= ADD PRODUCT & PLANS MODAL ================= */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[92dvh] sm:max-h-[88dvh] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-800 shrink-0 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-cyan-400" />
                  Create Product & Configure Duration Plans
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Set product details once, configure Reseller API PID, and attach individual duration plans with custom API durations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="create-multi-product-form" onSubmit={handleCreateProduct} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
              {/* Top Row: Category & Panel Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <label className="text-slate-300 mb-1.5 block font-bold text-xs">1. Device Category</label>
                  <select
                    value={multiProdForm.category}
                    onChange={(e) => setMultiProdForm({ ...multiProdForm, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 outline-none font-bold"
                  >
                    <option value="ANDROID NON ROOT PANEL">ANDROID NON ROOT PANEL</option>
                    <option value="ANDROID ROOT PANEL">ANDROID ROOT PANEL</option>
                    <option value="PC PANEL">PC PANEL</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 mb-1.5 block font-bold text-xs">2. Product / Panel Name</label>
                  <input
                    type="text"
                    required
                    value={multiProdForm.panel_name}
                    onChange={(e) => setMultiProdForm({ ...multiProdForm, panel_name: e.target.value })}
                    placeholder="e.g. VIP ZERO PANEL or MST CHEAT"
                    className="w-full bg-slate-900 border border-cyan-500/50 rounded-xl p-2.5 text-cyan-300 outline-none font-bold text-sm shadow-inner"
                  />
                </div>

                <div>
                  <label className="text-slate-400 mb-1 block font-semibold">Device Limit</label>
                  <input
                    type="text"
                    value={multiProdForm.device_limit}
                    onChange={(e) => setMultiProdForm({ ...multiProdForm, device_limit: e.target.value })}
                    placeholder="1 Device HWID"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 mb-1 block font-semibold">APK Download / Channel URL</label>
                  <input
                    type="text"
                    value={multiProdForm.apk_link}
                    onChange={(e) => setMultiProdForm({ ...multiProdForm, apk_link: e.target.value })}
                    placeholder="https://t.me/KyunodaProAPKs or Direct link"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-cyan-200 outline-none focus:border-cyan-400 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Row 3: Reseller & Delivery API settings */}
              <div className="p-3.5 bg-slate-950/80 border border-indigo-500/30 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" />
                    Key Delivery Mode & Reseller API Configuration
                  </span>
                  <span className="text-[10px] text-slate-400">Automated vs Vault</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMultiProdForm({ ...multiProdForm, delivery_mode: 'api_provider' })}
                    className={`p-2 rounded-lg text-center font-bold transition cursor-pointer ${
                      multiProdForm.delivery_mode === 'api_provider'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    ⚡ Auto API
                  </button>

                  <button
                    type="button"
                    onClick={() => setMultiProdForm({ ...multiProdForm, delivery_mode: 'hybrid' })}
                    className={`p-2 rounded-lg text-center font-bold transition cursor-pointer ${
                      multiProdForm.delivery_mode === 'hybrid'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    🔄 Hybrid
                  </button>

                  <button
                    type="button"
                    onClick={() => setMultiProdForm({ ...multiProdForm, delivery_mode: 'manual_vault' })}
                    className={`p-2 rounded-lg text-center font-bold transition cursor-pointer ${
                      multiProdForm.delivery_mode === 'manual_vault'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    🔒 Vault Only
                  </button>
                </div>

                {multiProdForm.delivery_mode !== 'manual_vault' && (
                  <div className="bg-indigo-950/30 p-3 rounded-xl border border-indigo-500/20 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-indigo-300 font-bold mb-1 block">
                          Provider Product PID (Same for all duration plans)
                        </label>
                        <input
                          type="text"
                          value={multiProdForm.provider_product_id}
                          onChange={(e) => setMultiProdForm({ ...multiProdForm, provider_product_id: e.target.value })}
                          placeholder="e.g. PID_FF_NONROOT_V1"
                          className="w-full bg-slate-900 border border-indigo-500/50 rounded-lg p-2 text-xs text-indigo-200 font-mono font-bold"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-2 sm:pt-5">
                        <input
                          type="checkbox"
                          id="multiReqAndroidId"
                          checked={Boolean(multiProdForm.requires_android_id)}
                          onChange={(e) => setMultiProdForm({ ...multiProdForm, requires_android_id: e.target.checked ? 1 : 0 })}
                          className="rounded accent-indigo-500 w-4 h-4 cursor-pointer"
                        />
                        <label htmlFor="multiReqAndroidId" className="text-slate-300 text-[11px] cursor-pointer">
                          Requires Device HWID / Android ID upon buy
                        </label>
                      </div>
                    </div>
                    <p className="text-[10px] text-indigo-300/80">
                      ℹ️ Note: The Provider PID above applies to this entire panel. You can customize the exact Reseller API duration for each duration plan below!
                    </p>
                  </div>
                )}
              </div>

              {/* ================= DURATION PLANS SECTION ================= */}
              <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/30 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/20 pb-2">
                  <div>
                    <span className="font-bold text-cyan-300 flex items-center gap-1.5 text-sm">
                      ⏱ Duration Plans & Reseller API Duration Mapping ({multiProdForm.plans.length})
                    </span>
                    <span className="text-[10px] text-cyan-400/80 block">
                      Each plan has its own display validity, pricing, and independent Reseller API duration string.
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleLoadStandardPreset}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-[10px] font-semibold cursor-pointer"
                    >
                      ⚡ Standard (1D, 7D, 30D, Life)
                    </button>
                    <button
                      type="button"
                      onClick={handleLoadHourlyPreset}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-[10px] font-semibold cursor-pointer"
                    >
                      ⚡ Hourly (2H, 6H, 12H, 24H)
                    </button>
                  </div>
                </div>

                {/* Plan Rows */}
                <div className="space-y-3">
                  {multiProdForm.plans.map((plan, pIdx) => (
                    <div
                      key={`multiprod-plan-${plan.id}-${pIdx}`}
                      className="bg-slate-950/90 border border-slate-800 p-3 rounded-xl space-y-2.5 shadow-inner"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-1.5">
                        <span className="font-bold text-cyan-400 text-xs flex items-center gap-1.5">
                          <span className="bg-cyan-500/20 px-2 py-0.5 rounded text-cyan-300 font-mono">Plan #{pIdx + 1}</span>
                          <span className="text-white font-bold">{plan.validity}</span>
                        </span>
                        {multiProdForm.plans.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePlanRow(plan.id)}
                            className="text-rose-400 hover:text-rose-300 p-1 text-[11px] font-semibold flex items-center gap-1 cursor-pointer hover:bg-rose-500/10 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove Plan</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        <div>
                          <label className="text-slate-300 text-[10px] font-bold mb-1 block">Display Plan Duration</label>
                          <input
                            type="text"
                            required
                            value={plan.validity}
                            onChange={(e) => handlePlanChange(plan.id, 'validity', e.target.value)}
                            placeholder="e.g. 1 Day, 7 Days"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-bold text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-indigo-300 text-[10px] font-bold mb-1 block flex items-center gap-1">
                            <span>Reseller API Duration</span>
                            <span className="text-[9px] text-slate-500 font-normal">(Provider)</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={plan.provider_duration || ''}
                            onChange={(e) => handlePlanChange(plan.id, 'provider_duration', e.target.value)}
                            placeholder="e.g. 1 Day, 7 Days, 30 Days"
                            className="w-full bg-slate-900 border border-indigo-500/40 rounded-lg p-1.5 text-indigo-200 font-mono font-bold text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-emerald-400 text-[10px] font-bold mb-1 block">User Price (₹)</label>
                          <input
                            type="number"
                            required
                            value={plan.price_inr}
                            onChange={(e) => handlePlanChange(plan.id, 'price_inr', Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-emerald-400 font-bold text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-amber-300 text-[10px] font-bold mb-1 block">Reseller Price (₹)</label>
                          <input
                            type="number"
                            required
                            value={plan.reseller_price}
                            onChange={(e) => handlePlanChange(plan.id, 'reseller_price', Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-amber-300 font-bold text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-400 text-[10px] mb-0.5 block">
                          Initial Vault Keys for {plan.validity} (Optional, 1 per line)
                        </label>
                        <textarea
                          rows={2}
                          value={plan.keys}
                          onChange={(e) => handlePlanChange(plan.id, 'keys', e.target.value)}
                          placeholder="KEY-SAMPLE-1234&#10;KEY-SAMPLE-5678"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-cyan-300 font-mono text-[11px] outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddPlanRow}
                  className="w-full py-2.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Another Duration Plan</span>
                </button>
              </div>
            </form>

            {/* Always Visible Fixed Action Footer */}
            <div className="p-3.5 sm:px-6 sm:py-3.5 bg-slate-950/90 border-t border-slate-800 shrink-0 flex items-center justify-between gap-2 z-10">
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Configuring <span className="text-cyan-300 font-bold">{multiProdForm.plans.length}</span> duration {multiProdForm.plans.length === 1 ? 'plan' : 'plans'}
              </span>
              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold cursor-pointer transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="create-multi-product-form"
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-600/30 cursor-pointer transition active:scale-95 text-xs flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Save & Create Product ({multiProdForm.plans.length} Plans)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADD SINGLE PLAN TO EXISTING PRODUCT MODAL ================= */}
      {showAddPlanToPanelModal && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full max-h-[92dvh] sm:max-h-[88dvh] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-800 shrink-0 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-400" />
                  Add Duration Plan to {showAddPlanToPanelModal.panel_name}
                </h3>
                <p className="text-xs text-slate-400">
                  Category: <span className="text-cyan-300 font-semibold">{showAddPlanToPanelModal.category}</span>
                  {showAddPlanToPanelModal.provider_product_id && (
                    <span className="ml-2 font-mono text-indigo-300">PID: {showAddPlanToPanelModal.provider_product_id}</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPlanToPanelModal(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form id="add-single-plan-form" onSubmit={handleAddPlanToExistingProductSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
              <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-xl space-y-2">
                <label className="text-slate-300 mb-1 block font-bold">1. Plan Duration / Display Validity</label>
                <input
                  type="text"
                  required
                  value={singlePlanForm.validity}
                  onChange={(e) => setSinglePlanForm({
                    ...singlePlanForm,
                    validity: e.target.value,
                    name: e.target.value,
                    provider_duration: singlePlanForm.provider_duration === singlePlanForm.validity ? e.target.value : singlePlanForm.provider_duration
                  })}
                  placeholder="e.g. 15 Days, 60 Days, Lifetime"
                  className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl p-2.5 text-cyan-300 font-bold text-sm outline-none"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 mr-1">Quick Presets:</span>
                  {Object.keys(DURATION_PRESETS_MAP).map(presetKey => {
                    const preset = DURATION_PRESETS_MAP[presetKey];
                    return (
                      <button
                        key={presetKey}
                        type="button"
                        onClick={() => setSinglePlanForm(prev => ({
                          ...prev,
                          validity: preset.validity,
                          name: preset.name,
                          provider_duration: preset.provider_duration,
                          price_inr: preset.price_inr,
                          reseller_price: preset.reseller_price
                        }))}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                          singlePlanForm.validity === presetKey
                            ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                            : 'bg-slate-950/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        {presetKey} (₹{preset.price_inr})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reseller API Provider Duration */}
              <div className="p-3 bg-indigo-950/25 border border-indigo-500/30 rounded-xl space-y-1.5">
                <label className="text-indigo-300 mb-0.5 block font-bold flex items-center justify-between">
                  <span>2. Reseller API Duration (Sent to Provider)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Matches Banti Reseller API</span>
                </label>
                <input
                  type="text"
                  required
                  value={singlePlanForm.provider_duration}
                  onChange={(e) => setSinglePlanForm({ ...singlePlanForm, provider_duration: e.target.value })}
                  placeholder="e.g. 1 Day, 7 Days, 30 Days, 1 Month"
                  className="w-full bg-slate-950 border border-indigo-500/50 rounded-xl p-2.5 text-indigo-200 font-mono font-bold text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-emerald-400 mb-1 block font-bold">User Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={singlePlanForm.price_inr}
                    onChange={(e) => setSinglePlanForm({ ...singlePlanForm, price_inr: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-emerald-400 font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-amber-300 mb-1 block font-bold">Reseller Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={singlePlanForm.reseller_price}
                    onChange={(e) => setSinglePlanForm({ ...singlePlanForm, reseller_price: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-amber-300 font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 mb-1 block font-semibold">
                  Initial Vault Keys (Optional, 1 per line)
                </label>
                <textarea
                  rows={3}
                  value={singlePlanForm.keys}
                  onChange={(e) => setSinglePlanForm({ ...singlePlanForm, keys: e.target.value })}
                  placeholder={`KEY-SAMPLE-9901\nKEY-SAMPLE-9902`}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-cyan-300 font-mono text-xs outline-none"
                />
              </div>

            </form>

            <div className="p-3.5 sm:px-5 sm:py-3.5 bg-slate-950/90 border-t border-slate-800 shrink-0 flex justify-end gap-2 items-center z-10">
              <button
                type="button"
                onClick={() => setShowAddPlanToPanelModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-single-plan-form"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow cursor-pointer transition text-xs"
              >
                Add Duration Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT PRODUCT MODAL ================= */}
      {editingProductId !== null && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full max-h-[92dvh] sm:max-h-[88dvh] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-800 shrink-0 flex items-center justify-between">
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

            <form id="edit-single-product-form" onSubmit={handleUpdateProductSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 text-xs">
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
                  {Object.keys(DURATION_PRESETS_MAP).map(presetKey => {
                    const preset = DURATION_PRESETS_MAP[presetKey];
                    return (
                      <button
                        key={presetKey}
                        type="button"
                        onClick={() => setEditProdForm(prev => ({
                          ...prev,
                          validity: preset.validity,
                          name: preset.name,
                          provider_duration: preset.provider_duration,
                          price_inr: preset.price_inr,
                          reseller_price: preset.reseller_price
                        }))}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                          editProdForm.validity === presetKey
                            ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                            : 'bg-slate-950/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        {presetKey} (₹{preset.price_inr})
                      </button>
                    );
                  })}
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
                  <label className="text-slate-400 mb-1 block">APK Download Link or Telegram Channel URL</label>
                  <input
                    type="text"
                    value={editProdForm.apk_link}
                    onChange={(e) => setEditProdForm({ ...editProdForm, apk_link: e.target.value })}
                    placeholder="https://t.me/KyunodaProAPKs or direct download"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-cyan-200 outline-none focus:border-cyan-400 font-mono text-xs"
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

              {/* Maintenance Mode Configuration */}
              <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5" />
                    Individual Maintenance Mode
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-amber-200">
                    <input
                      type="checkbox"
                      checked={Boolean(editProdForm.is_maintenance)}
                      onChange={(e) => setEditProdForm({ ...editProdForm, is_maintenance: e.target.checked ? 1 : 0 })}
                      className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Set Under Maintenance</span>
                  </label>
                </div>
                {Boolean(editProdForm.is_maintenance) && (
                  <div>
                    <label className="text-slate-400 mb-1 block text-[11px]">Maintenance Notice / Custom Note</label>
                    <input
                      type="text"
                      value={editProdForm.maintenance_note}
                      onChange={(e) => setEditProdForm({ ...editProdForm, maintenance_note: e.target.value })}
                      placeholder="e.g. Updating to latest patch. Will be back in 30 mins!"
                      className="w-full bg-slate-950 border border-amber-500/40 rounded-xl p-2 text-amber-300 text-xs outline-none"
                    />
                  </div>
                )}
              </div>

            </form>

            <div className="p-3.5 sm:px-5 sm:py-3.5 bg-slate-950/90 border-t border-slate-800 shrink-0 flex justify-end gap-2 items-center z-10">
              <button
                type="button"
                onClick={() => setEditingProductId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-single-product-form"
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow cursor-pointer transition text-xs"
              >
                Update Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TELEGRAM CREDENTIALS HELP MODAL ================= */}
      {showTelegramHelpModal && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-6 overflow-y-auto pb-28 sm:pb-6">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-5 shadow-2xl max-h-[85vh] overflow-y-auto my-auto">
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

      {/* ================= CREATE / CLONE BOT MODAL ================= */}
      {showCreateBotModal && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-6 overflow-y-auto pb-28 sm:pb-6">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-5 shadow-2xl my-auto max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg">
                  🤖
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Deploy & Clone New Telegram Bot</h3>
                  <p className="text-xs text-slate-400">Configure dedicated API keys & independent Admin Chat ID</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateBotModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {createBotSuccessMsg && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{createBotSuccessMsg}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newBotForm.bot_token.trim()) {
                  alert('Please provide a valid Telegram Bot Token from @BotFather.');
                  return;
                }
                const parsedAdminId = Number(String(newBotForm.admin_id || '').replace(/[^0-9]/g, '')) || 12846461;

                const created = createBot({
                  name: newBotForm.name,
                  username: newBotForm.username,
                  bot_token: newBotForm.bot_token,
                  admin_id: parsedAdminId,
                  admin_chat_id: parsedAdminId,
                  description: newBotForm.description,
                  clone_products: newBotForm.clone_products,
                  payment_gateway: {
                    upi_id: newBotForm.fampay_upi_id,
                    api_key: newBotForm.famgateway_api_key
                  },
                  reseller_api: {
                    api_key: newBotForm.bantibhaiya_api_key,
                    master_key: newBotForm.bantibhaiya_master_key
                  }
                });

                setCreateBotSuccessMsg(`✅ Bot @${created.username} created & activated successfully!`);
                setTimeout(() => {
                  setCreateBotSuccessMsg(null);
                  setShowCreateBotModal(false);
                  setAdminTab('bots');
                }, 1200);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block font-bold mb-1">Bot Display Name *</label>
                  <input
                    type="text"
                    required
                    value={newBotForm.name}
                    onChange={(e) => setNewBotForm({ ...newBotForm, name: e.target.value })}
                    placeholder="e.g. Kalam VIP Store #2"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block font-bold mb-1">Telegram Bot Username *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500 font-mono">@</span>
                    <input
                      type="text"
                      required
                      value={newBotForm.username}
                      onChange={(e) => setNewBotForm({ ...newBotForm, username: e.target.value.replace(/^@/, '') })}
                      placeholder="kalam_vip2_bot"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-cyan-300 font-mono outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Telegram Bot Token */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-bold">Telegram Bot Token (from @BotFather) *</label>
                  <a
                    href="https://t.me/BotFather"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <ExternalLink className="w-3 h-3" /> Get Token
                  </a>
                </div>
                <input
                  type="text"
                  required
                  value={newBotForm.bot_token}
                  onChange={(e) => setNewBotForm({ ...newBotForm, bot_token: e.target.value })}
                  placeholder="e.g. 7928194012:AAH9bK8xP_yourRealTelegramBotToken"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-mono text-[11px] outline-none focus:border-cyan-500"
                />
              </div>

              {/* Admin Chat ID Input (Explicit User Requirement) */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-amber-300 font-bold flex items-center gap-1.5 text-xs">
                    <Shield className="w-4 h-4 text-amber-400" />
                    Admin Telegram Chat ID / User ID *
                  </label>
                  <a
                    href="https://t.me/userinfobot"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" /> Get My ID (@userinfobot)
                  </a>
                </div>
                <input
                  type="text"
                  required
                  value={newBotForm.admin_id}
                  onChange={(e) => setNewBotForm({ ...newBotForm, admin_id: e.target.value })}
                  placeholder="e.g. 12846461"
                  className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold text-xs outline-none focus:border-amber-400"
                />
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  💡 This Telegram User ID will be authorized to access the root <b>@admin</b> and <b>/admin</b> control terminal inside this specific bot instance.
                </p>
              </div>

              {/* Dedicated Payment & Reseller APIs */}
              <div className="border-t border-slate-800 pt-3 space-y-3">
                <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold block">
                  Isolated Payment & Reseller Keys for this Bot
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 block font-semibold mb-1">FamGateway UPI ID</label>
                    <input
                      type="text"
                      value={newBotForm.fampay_upi_id}
                      onChange={(e) => setNewBotForm({ ...newBotForm, fampay_upi_id: e.target.value })}
                      placeholder="kalampanel@fam"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono text-[11px] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block font-semibold mb-1">FamGateway API Key</label>
                    <input
                      type="text"
                      value={newBotForm.famgateway_api_key}
                      onChange={(e) => setNewBotForm({ ...newBotForm, famgateway_api_key: e.target.value })}
                      placeholder="Leave blank to use default"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono text-[11px] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block font-semibold mb-1">BantiBhaiya Reseller API Key</label>
                    <input
                      type="text"
                      value={newBotForm.bantibhaiya_api_key}
                      onChange={(e) => setNewBotForm({ ...newBotForm, bantibhaiya_api_key: e.target.value })}
                      placeholder="Leave blank to use default"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-indigo-300 font-mono text-[11px] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block font-semibold mb-1">BantiBhaiya Master Key</label>
                    <input
                      type="text"
                      value={newBotForm.bantibhaiya_master_key}
                      onChange={(e) => setNewBotForm({ ...newBotForm, bantibhaiya_master_key: e.target.value })}
                      placeholder="Optional master auth"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono text-[11px] outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="cloneProdsCheck"
                    checked={newBotForm.clone_products}
                    onChange={(e) => setNewBotForm({ ...newBotForm, clone_products: e.target.checked })}
                    className="rounded accent-cyan-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="cloneProdsCheck" className="text-slate-300 cursor-pointer font-semibold">
                    Clone current product catalog and key vault into new bot instance
                  </label>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateBotModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-600/30 cursor-pointer transition"
                >
                  🚀 Deploy & Activate Bot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT BOT MODAL ================= */}
      {editingBotId && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-6 overflow-y-auto pb-28 sm:pb-6">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl my-auto max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                Edit Bot Instance Credentials
              </h3>
              <button
                type="button"
                onClick={() => setEditingBotId(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const parsedAdminId = Number(String(editBotForm.admin_id || '').replace(/[^0-9]/g, '')) || 12846461;

                updateBot(editingBotId, {
                  name: editBotForm.name,
                  username: (editBotForm.username || '').replace(/^@/, ''),
                  bot_token: editBotForm.bot_token,
                  admin_id: parsedAdminId,
                  admin_chat_id: parsedAdminId,
                  status: editBotForm.status,
                  payment_gateway: {
                    upi_id: editBotForm.fampay_upi_id,
                    api_key: editBotForm.famgateway_api_key
                  } as any,
                  reseller_api: {
                    api_key: editBotForm.bantibhaiya_api_key,
                    master_key: editBotForm.bantibhaiya_master_key
                  } as any
                });

                setEditingBotId(null);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="text-slate-300 block font-bold mb-1">Bot Name</label>
                <input
                  type="text"
                  required
                  value={editBotForm.name}
                  onChange={(e) => setEditBotForm({ ...editBotForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 block font-bold mb-1">Bot Username</label>
                <input
                  type="text"
                  required
                  value={editBotForm.username}
                  onChange={(e) => setEditBotForm({ ...editBotForm, username: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 block font-bold mb-1">Telegram Bot Token</label>
                <input
                  type="text"
                  required
                  value={editBotForm.bot_token}
                  onChange={(e) => setEditBotForm({ ...editBotForm, bot_token: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-mono text-[11px] outline-none"
                />
              </div>

              {/* Admin Chat ID in Edit Form */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 space-y-1">
                <label className="text-amber-300 font-bold flex items-center gap-1 text-xs">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  Admin Telegram Chat ID (@admin auth)
                </label>
                <input
                  type="text"
                  required
                  value={editBotForm.admin_id}
                  onChange={(e) => setEditBotForm({ ...editBotForm, admin_id: e.target.value })}
                  className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block font-semibold mb-1">FamGateway UPI ID</label>
                  <input
                    type="text"
                    value={editBotForm.fampay_upi_id}
                    onChange={(e) => setEditBotForm({ ...editBotForm, fampay_upi_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono text-[11px] outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block font-semibold mb-1">FamGateway API Key</label>
                  <input
                    type="text"
                    value={editBotForm.famgateway_api_key}
                    onChange={(e) => setEditBotForm({ ...editBotForm, famgateway_api_key: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono text-[11px] outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = bots.find(b => b.id === editingBotId);
                    setEditingBotId(null);
                    if (target) {
                      setBotToDelete(target);
                    }
                  }}
                  className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl font-semibold cursor-pointer transition flex items-center gap-1.5 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Bot
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingBotId(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold cursor-pointer transition shadow text-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE BOT CONFIRMATION MODAL ================= */}
      {botToDelete && (
        <div className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-6 overflow-y-auto pb-28 sm:pb-6">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center font-bold text-xl shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white">Delete Bot Instance?</h3>
                <p className="text-xs text-rose-400/90 font-mono truncate">@{botToDelete.username}</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <p className="text-slate-300">
                Are you sure you want to permanently delete <b className="text-white">{botToDelete.name}</b>?
              </p>
              <p className="text-slate-500 text-[11px]">
                This will purge its dedicated bot token, isolated API credentials, and remove it from your bot fleet immediately.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setBotToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold cursor-pointer text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteBot(botToDelete.id);
                  setBotToDelete(null);
                }}
                className="px-5 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl font-bold shadow-lg shadow-rose-600/30 cursor-pointer text-xs transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADD KEYS MODAL ================= */}
      {showAddKeysModal && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-6 overflow-y-auto pb-28 sm:pb-6">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-4 sm:p-5 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto my-auto">
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
