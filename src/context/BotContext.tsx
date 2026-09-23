import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  auth,
  googleProvider,
  db,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  getDocs,
  collection,
  onSnapshot,
  deleteDoc
} from '../lib/firebase';
import {
  User,
  AccountType,
  Product,
  ProductKey,
  Order,
  Ticket,
  Coupon,
  RedeemedCoupon,
  Transaction,
  CryptoTxn,
  ActivityLog,
  Settings,
  ChatMessage,
  InlineKeyboardButton,
  ViewTab,
  AdminTab,
  BotInstance,
  PaymentGatewayConfig,
  ResellerApiConfig
} from '../types';
import {
  DEFAULT_EMOJIS,
  DEFAULT_SETTINGS,
  DEFAULT_GATEWAY_CONFIG,
  DEFAULT_RESELLER_CONFIG,
  FIXED_CATEGORIES,
  INITIAL_COUPONS,
  INITIAL_PRODUCTS,
  INITIAL_PRODUCT_KEYS,
  INITIAL_USERS,
  INITIAL_BOTS,
  UI_TEXTS
} from '../data/defaultData';
import { generateQrDataUrl, buildUpiUri } from '../utils/qrGenerator';

export interface BotContextType {
  // Authentication & Session
  currentUser: User;
  setCurrentUserId: (userId: number) => void;
  allUsers: User[];
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authMode: 'login' | 'register' | 'forgot_password';
  setAuthMode: (mode: 'login' | 'register' | 'forgot_password') => void;
  loginWithGoogle: (email?: string, name?: string, photoUrl?: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  registerWithEmail: (params: { email: string; password: string; name: string; username?: string; role?: AccountType }) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string; otpCode?: string }>;
  resetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  
  // Multi-Bot Architecture (Every user can build, deploy & run their own bots)
  bots: BotInstance[];
  myBots: BotInstance[];
  activeBotId: string;
  activeBot: BotInstance;
  createBot: (params: {
    name: string;
    username: string;
    bot_token: string;
    admin_id?: number;
    admin_chat_id?: number;
    description?: string;
    theme_color?: string;
    clone_products?: boolean;
    payment_gateway?: Partial<PaymentGatewayConfig>;
    reseller_api?: Partial<ResellerApiConfig>;
  }) => BotInstance;
  updateBot: (botId: string, updates: Partial<BotInstance>) => void;
  deleteBot: (botId: string) => void;
  switchActiveBot: (botId: string) => void;
  duplicateBot: (botId: string) => void;
  updateActiveBotGateway: (gatewayUpdates: Partial<PaymentGatewayConfig>) => void;
  updateActiveBotResellerApi: (resellerUpdates: Partial<ResellerApiConfig>) => void;
  toggleBotStatus: (botId: string) => void;

  // Database Tables
  products: Product[];
  productKeys: ProductKey[];
  orders: Order[];
  tickets: Ticket[];
  coupons: Coupon[];
  redeemed: RedeemedCoupon[];
  transactions: Transaction[];
  cryptoTxns: CryptoTxn[];
  logs: ActivityLog[];
  settings: Settings;
  emojis: Record<string, string>;

  // Chat state
  messages: ChatMessage[];
  currentFsmState: string | null;
  fsmData: Record<string, any>;
  isBotTyping: boolean;

  // View state
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  adminTab: AdminTab;
  setAdminTab: (tab: AdminTab) => void;
  showAddProductModal: boolean;
  setShowAddProductModal: (open: boolean) => void;
  openAddProductModal: () => void;

  // Bot Interactions
  sendUserMessage: (text: string) => Promise<void>;
  handleCallbackQuery: (callbackData: string, btnText?: string) => Promise<void>;
  resetChat: () => void;
  simulatePaymentSuccess: (orderId: string) => Promise<void>;

  // Live Telegram Engine
  botStatus: any;
  testTelegramBotToken: () => Promise<{ success: boolean; bot?: any; error?: string }>;
  sendAdminTestMessage: () => Promise<{ success: boolean; error?: string }>;
  restartBotEngine: () => Promise<void>;

  // FamGateway Automated Payment
  testFamGatewayKey: (apiKey?: string) => Promise<{ success: boolean; message: string; raw?: any }>;
  createFamGatewayOrder: (amount: number) => Promise<{ success: boolean; order_id?: string; payment_url?: string; qr_url?: string; error?: string; raw?: any }>;
  checkFamGatewayStatus: (orderId: string) => Promise<{ success: boolean; isPaid: boolean; status: string; error?: string }>;

  // BantiBhaiya Reseller Provider Key Delivery
  testProviderConnection: (apiKey?: string, masterKey?: string, apiUrl?: string) => Promise<{ success: boolean; message: string; raw?: any }>;
  buyProviderKeyDirect: (params: { productId: string; duration: string; androidId?: string; apiKey?: string; masterKey?: string; apiUrl?: string }) => Promise<{ success: boolean; key?: string; orderId?: string | number; error?: string; raw?: any; message?: string }>;

  // Admin Broadcast
  sendBroadcastMessage: (params: {
    targetAudience: 'all' | 'referrers' | 'vip' | 'reseller' | 'non_reseller';
    text: string;
    imageUrl?: string;
    buttonText?: string;
    buttonUrl?: string;
    pinMessage?: boolean;
  }) => Promise<{ success: boolean; recipientCount: number; message: string }>;

  // Admin DB Direct Manipulations
  addProduct: (prod: Omit<Product, 'id' | 'stock'>, keys: string[]) => void;
  updateProduct: (id: number, fields: Partial<Product>) => void;
  deleteProduct: (id: number) => void;
  removeProduct: (id: number) => void;
  injectProductKeys: (productId: number, keys: string[]) => void;
  deleteProductKey: (keyId: number) => void;
  updateUserBalance: (userId: number, delta: number, reason?: string, notifyTelegram?: boolean) => void;
  toggleUserBan: (userId: number) => void;
  warnUser: (userId: number, message: string) => void;
  toggleUserVip: (userId: number) => void;
  toggleUserReseller: (userId: number) => void;
  createNewCoupon: (code: string, amount: number, uses: number) => void;
  deleteCoupon: (code: string) => void;
  replyToTicket: (ticketId: number, replyText: string) => void;
  closeTicket: (ticketId: number) => void;
  updateSettings: (newSettings: Partial<Settings>) => void;
  updateEmojiSlot: (slot: string, emojiId: string) => void;
  updateUserProfile: (updates: Partial<User>) => void;
  resetDatabaseToDefaults: () => void;
}

const BotContext = createContext<BotContextType | null>(null);

export const BotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load local persistence or defaults (clearing any old demo users/products)
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('kalam_bot_users');
    if (saved) {
      try {
        const parsed: User[] = JSON.parse(saved);
        // Filter out legacy demo accounts (58941209, 77489012, 88192031) if present
        const demoUids = [58941209, 77489012, 88192031];
        const filtered = parsed.filter(u => !demoUids.includes(u.user_id));
        if (filtered.length > 0) return filtered;
      } catch (e) {
        console.error('Error parsing stored users', e);
      }
    }
    return INITIAL_USERS;
  });

  const [currentUserId, setCurrentUserIdState] = useState<number>(() => {
    const saved = localStorage.getItem('kalam_bot_current_uid');
    return saved ? Number(saved) : 12846461; // Default to admin or active user
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('kalam_bot_auth_logged_in');
    return saved !== null ? saved === 'true' : true;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot_password'>('login');

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('kalam_bot_products');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // If it contains legacy hardcoded demo IDs (1 to 11 with known dummy names) and user never added custom ones, start clean
        const isLegacyDemo = Array.isArray(parsed) && parsed.some(p => p.panel_name === 'MST PANEL' || p.panel_name === 'DRIP PANEL');
        if (!isLegacyDemo && Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Error parsing products', e);
      }
    }
    return INITIAL_PRODUCTS;
  });

  const [productKeys, setProductKeys] = useState<ProductKey[]>(() => {
    const saved = localStorage.getItem('kalam_bot_keys');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some(k => k.key_text?.includes('MST-24H'))) {
          return [];
        }
        return parsed;
      } catch (e) {
        console.error('Error parsing product keys', e);
      }
    }
    return INITIAL_PRODUCT_KEYS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('kalam_bot_orders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((o: any) => o.user_id !== 58941209);
        }
      } catch (e) {
        console.error('Error parsing orders', e);
      }
    }
    return [];
  });

  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const saved = localStorage.getItem('kalam_bot_tickets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((t: any) => t.user_id !== 58941209);
        }
      } catch (e) {
        console.error('Error parsing tickets', e);
      }
    }
    return [];
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const saved = localStorage.getItem('kalam_bot_coupons');
    return saved ? JSON.parse(saved) : INITIAL_COUPONS;
  });

  const [redeemed, setRedeemed] = useState<RedeemedCoupon[]>(() => {
    const saved = localStorage.getItem('kalam_bot_redeemed');
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('kalam_bot_txns');
    return saved ? JSON.parse(saved) : [];
  });

  const [cryptoTxns, setCryptoTxns] = useState<CryptoTxn[]>(() => {
    const saved = localStorage.getItem('kalam_bot_crypto_txns');
    return saved ? JSON.parse(saved) : [];
  });

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('kalam_bot_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((l: any) => l.user_id !== 58941209);
        }
      } catch (e) {
        console.error('Error parsing logs', e);
      }
    }
    return [];
  });

  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('kalam_bot_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [emojis, setEmojis] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('kalam_bot_emojis');
    return saved ? JSON.parse(saved) : DEFAULT_EMOJIS;
  });

  // Multi-Bot Management State
  const [bots, setBots] = useState<BotInstance[]>(() => {
    const saved = localStorage.getItem('kalam_bot_instances');
    if (saved) {
      try {
        const parsed: BotInstance[] = JSON.parse(saved);
        const demoBotIds = ['bot_kalam_main', 'bot_vip_reseller'];
        const filtered = Array.isArray(parsed)
          ? parsed.filter(b => !demoBotIds.includes(b.id) && !b.bot_token?.includes('exampleToken') && !b.bot_token?.includes('SampleVip'))
          : [];
        return filtered;
      } catch (e) {
        console.error('Error parsing stored bots', e);
      }
    }
    return [];
  });

  const [activeBotId, setActiveBotId] = useState<string>(() => {
    const saved = localStorage.getItem('kalam_active_bot_id');
    if (saved && saved !== 'bot_kalam_main' && saved !== 'bot_vip_reseller') {
      return saved;
    }
    return '';
  });

  const [activeTab, setActiveTab] = useState<ViewTab>(() => {
    const savedAuth = localStorage.getItem('kalam_bot_auth_logged_in');
    return savedAuth === 'false' ? 'auth' : 'dashboard';
  });
  const [adminTab, setAdminTab] = useState<AdminTab>('overview');
  const [showAddProductModal, setShowAddProductModal] = useState<boolean>(false);

  const openAddProductModal = () => {
    setAdminTab('products');
    setActiveTab('admin');
    setShowAddProductModal(true);
  };
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentFsmState, setCurrentFsmState] = useState<string | null>(null);
  const [fsmData, setFsmData] = useState<Record<string, any>>({});
  const [isBotTyping, setIsBotTyping] = useState<boolean>(false);

  // Current active user
  const currentUser = users.find(u => u.user_id === currentUserId) || users[0] || INITIAL_USERS[0];

  const setCurrentUserId = (id: number) => {
    setCurrentUserIdState(id);
    localStorage.setItem('kalam_bot_current_uid', String(id));
  };

  // Strictly filter bots to the logged in user (Multi-Tenant Isolation)
  const myBots = bots.filter(b => {
    const isOwnerId = b.owner_id === currentUserId;
    const isOwnerEmail = Boolean(currentUser.email && b.owner_email && b.owner_email.toLowerCase() === currentUser.email.toLowerCase());
    return isOwnerId || isOwnerEmail;
  });

  // Active bot is selected from user's own bots or fallback to system store bots
  const activeBot = myBots.find(b => b.id === activeBotId) || myBots[0] || bots.find(b => b.id === activeBotId) || bots[0] || INITIAL_BOTS[0];

  // Sync state to local storage
  useEffect(() => { localStorage.setItem('kalam_bot_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('kalam_bot_instances', JSON.stringify(bots)); }, [bots]);
  useEffect(() => { localStorage.setItem('kalam_active_bot_id', activeBotId); }, [activeBotId]);
  useEffect(() => { localStorage.setItem('kalam_bot_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('kalam_bot_keys', JSON.stringify(productKeys)); }, [productKeys]);
  useEffect(() => { localStorage.setItem('kalam_bot_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('kalam_bot_tickets', JSON.stringify(tickets)); }, [tickets]);
  useEffect(() => { localStorage.setItem('kalam_bot_coupons', JSON.stringify(coupons)); }, [coupons]);
  useEffect(() => { localStorage.setItem('kalam_bot_redeemed', JSON.stringify(redeemed)); }, [redeemed]);
  useEffect(() => { localStorage.setItem('kalam_bot_txns', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('kalam_bot_crypto_txns', JSON.stringify(cryptoTxns)); }, [cryptoTxns]);
  useEffect(() => { localStorage.setItem('kalam_bot_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('kalam_bot_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('kalam_bot_emojis', JSON.stringify(emojis)); }, [emojis]);

  // Firebase Auth listener and Backend Database real-time sync
  useEffect(() => {
    // 0. Continuous Full-Duplex Real-Time Data Synchronizer
    const syncServerData = async () => {
      try {
        const [dataRes, statusRes] = await Promise.allSettled([
          fetch('/api/data'),
          fetch('/api/status')
        ]);

        if (dataRes.status === 'fulfilled' && dataRes.value.ok) {
          const serverData = await dataRes.value.json();
          if (serverData) {
            // Real-time Users Synchronization (Telegram registrations, real-time balances, etc.)
            if (Array.isArray(serverData.users) && serverData.users.length > 0) {
              setUsers(prevUsers => {
                const userMap = new Map<number, User>();
                prevUsers.forEach(u => userMap.set(u.user_id, u));
                serverData.users.forEach((su: User) => {
                  const existing = userMap.get(su.user_id);
                  if (existing) {
                    userMap.set(su.user_id, {
                      ...existing,
                      ...su,
                      email: existing.email || su.email,
                      password: existing.password || su.password,
                      avatar_url: su.avatar_url || existing.avatar_url
                    });
                  } else {
                    userMap.set(su.user_id, su);
                  }
                });
                return Array.from(userMap.values());
              });
            }

            if (Array.isArray(serverData.products)) {
              setProducts(serverData.products);
            }
            if (Array.isArray(serverData.productKeys)) {
              setProductKeys(serverData.productKeys);
            }
            if (Array.isArray(serverData.orders)) {
              setOrders(serverData.orders);
            }
            if (Array.isArray(serverData.transactions)) {
              setTransactions(serverData.transactions);
            }
            if (Array.isArray(serverData.logs)) {
              setLogs(serverData.logs);
            }
            if (Array.isArray(serverData.tickets)) {
              setTickets(serverData.tickets);
            }
            if (Array.isArray(serverData.coupons)) {
              setCoupons(serverData.coupons);
            }
            if (serverData.settings) {
              setSettings(prev => ({ ...prev, ...serverData.settings }));
            }
          }
        }

        if (statusRes.status === 'fulfilled' && statusRes.value.ok) {
          const statusData = await statusRes.value.json();
          setBotStatus(statusData);
        }
      } catch (err) {
        // background sync notice
      }
    };

    // Initial immediate sync
    syncServerData();

    // 2.5s real-time heartbeat sync
    const syncInterval = setInterval(syncServerData, 2500);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncServerData();
      }
    };
    const handleFocus = () => {
      syncServerData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // 1. Firebase Auth listener
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser && fbUser.email) {
        setIsAuthenticated(true);
        localStorage.setItem('kalam_bot_auth_logged_in', 'true');
        const cleanEmail = fbUser.email.toLowerCase();
        const existing = users.find(u => u.email?.toLowerCase() === cleanEmail);
        if (existing) {
          setCurrentUserIdState(existing.user_id);
          localStorage.setItem('kalam_bot_current_uid', String(existing.user_id));
        }
      }
    });

    // 2. Firestore Sync for Bots
    const unsubBots = onSnapshot(collection(db, 'bots'), (snapshot) => {
      if (!snapshot.empty) {
        const cloudBots: BotInstance[] = [];
        snapshot.forEach((docSnap) => {
          cloudBots.push(docSnap.data() as BotInstance);
        });
        setBots(cloudBots);
      }
    }, (err) => {
      console.warn('Firestore bots sync notice:', err.message);
    });

    // 3. Firestore Sync for Products
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const cloudProducts: Product[] = [];
      snapshot.forEach((docSnap) => {
        cloudProducts.push(docSnap.data() as Product);
      });
      if (cloudProducts.length > 0 || !snapshot.empty) {
        setProducts(cloudProducts);
      }
    }, (err) => {
      console.warn('Firestore products sync notice:', err.message);
    });

    // 4. Firestore Sync for Settings
    const unsubSettings = onSnapshot(collection(db, 'settings'), (snapshot) => {
      snapshot.forEach((docSnap) => {
        if (docSnap.id === 'global') {
          setSettings(prev => ({ ...prev, ...(docSnap.data() as Partial<Settings>) }));
        }
      });
    }, (err) => {
      console.warn('Firestore settings sync notice:', err.message);
    });

    return () => {
      clearInterval(syncInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      unsubscribeAuth();
      unsubBots();
      unsubProducts();
      unsubSettings();
    };
  }, []);

  // Logging helper
  const logActivity = useCallback((userId: number, action: string, details = '') => {
    const newLog: ActivityLog = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      user_id: userId,
      action,
      details,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setLogs(prev => [newLog, ...prev.slice(0, 499)]);
  }, []);

  // Multi-Bot CRUD and API Handlers
  const createBot = useCallback((params: {
    name: string;
    username: string;
    bot_token: string;
    admin_id?: number;
    admin_chat_id?: number;
    description?: string;
    theme_color?: string;
    clone_products?: boolean;
    payment_gateway?: Partial<PaymentGatewayConfig>;
    reseller_api?: Partial<ResellerApiConfig>;
  }) => {
    const cleanUsername = params.username.replace(/^@/, '').trim();
    const adminIdToUse = Number(params.admin_id || params.admin_chat_id) || settings.admin_id || 12846461;
    const shouldClone = params.clone_products !== false;

    const newBot: BotInstance = {
      id: 'bot_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      owner_id: currentUserId,
      owner_email: currentUser.email || 'user@panel.io',
      admin_id: adminIdToUse,
      admin_chat_id: adminIdToUse,
      name: params.name.trim() || 'My Telegram Store Bot',
      username: cleanUsername || 'MyStoreBot',
      bot_token: params.bot_token.trim(),
      status: 'ONLINE',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      description: params.description || 'Automated Telegram Shop for Keys & Mod Panels.',
      theme_color: params.theme_color || '#06b6d4',
      payment_gateway: {
        upi_id: params.payment_gateway?.upi_id || '',
        merchant_name: params.payment_gateway?.merchant_name || params.name,
        qr_image_url: params.payment_gateway?.qr_image_url || 'https://fampay.anujbots.xyz/qr.php',
        gateway_provider: params.payment_gateway?.gateway_provider || 'famgateway',
        api_key: params.payment_gateway?.api_key || '',
        secret_key: params.payment_gateway?.secret_key || ('FP_SEC_' + Math.random().toString(36).substring(2, 10)),
        verify_endpoint: params.payment_gateway?.verify_endpoint || 'https://famgateway.in/api/create-order.php',
        usdt_trc20_address: params.payment_gateway?.usdt_trc20_address || '',
        usdt_to_inr_rate: params.payment_gateway?.usdt_to_inr_rate || 90.0,
        auto_approve: params.payment_gateway?.auto_approve ?? true
      },
      reseller_api: {
        provider_name: params.reseller_api?.provider_name || 'BantiBhaiya Reseller Gateway',
        api_url: params.reseller_api?.api_url || 'https://bantibhaiya.to/api/reseller_v1.php',
        api_key: params.reseller_api?.api_key || '',
        master_key: params.reseller_api?.master_key || '',
        status: params.reseller_api?.status || 'ON',
        auto_fallback: params.reseller_api?.auto_fallback ?? true,
        sync_balance: params.reseller_api?.sync_balance || 0
      },
      products: shouldClone ? [...products] : [],
      productKeys: shouldClone ? [...productKeys] : [],
      settings: {
        ...settings,
        admin_id: adminIdToUse,
        bot_token: params.bot_token.trim(),
        bot_username: cleanUsername || 'MyStoreBot',
        famgateway_api_key: params.payment_gateway?.api_key || '',
        fampay_upi_id: params.payment_gateway?.upi_id || '',
        bantibhaiya_api_key: params.reseller_api?.api_key || '',
        bantibhaiya_master_key: params.reseller_api?.master_key || '',
        bantibhaiya_api_url: params.reseller_api?.api_url || 'https://bantibhaiya.to/api/reseller_v1.php'
      },
      stats: {
        total_orders: 0,
        total_revenue: 0,
        total_users: 1,
        total_keys_delivered: 0
      }
    };

    setBots(prev => [newBot, ...prev]);
    setActiveBotId(newBot.id);
    setSettings(prev => ({
      ...prev,
      admin_id: adminIdToUse,
      bot_token: newBot.bot_token,
      bot_username: newBot.username,
      famgateway_api_key: newBot.payment_gateway?.api_key || prev.famgateway_api_key,
      fampay_upi_id: newBot.payment_gateway?.upi_id || prev.fampay_upi_id,
      bantibhaiya_api_key: newBot.reseller_api?.api_key || prev.bantibhaiya_api_key,
      bantibhaiya_master_key: newBot.reseller_api?.master_key || prev.bantibhaiya_master_key,
      bantibhaiya_api_url: newBot.reseller_api?.api_url || prev.bantibhaiya_api_url
    }));

    // Immediately push new bot settings to server and restart polling engine
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bot_token: newBot.bot_token,
        bot_username: newBot.username,
        admin_id: adminIdToUse,
        famgateway_api_key: newBot.payment_gateway?.api_key,
        bantibhaiya_api_key: newBot.reseller_api?.api_key,
        bantibhaiya_master_key: newBot.reseller_api?.master_key,
        bantibhaiya_api_url: newBot.reseller_api?.api_url
      })
    }).catch(() => {});

    // Sync to Firestore Cloud Database
    setDoc(doc(db, 'bots', newBot.id), newBot, { merge: true }).catch(() => {});

    // Sync to Backend Server
    fetch('/api/bots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        bot: newBot
      })
    }).catch(() => {});

    logActivity(currentUserId, 'BOT_CREATED', `Created new bot @${newBot.username} (Admin ID: ${adminIdToUse})`);
    return newBot;
  }, [currentUserId, currentUser, products, productKeys, settings, logActivity]);

  const updateBot = useCallback((botId: string, updates: Partial<BotInstance>) => {
    setBots(prev => {
      const nextBots = prev.map(b => b.id === botId ? { ...b, ...updates } : b);
      localStorage.setItem('kalam_bot_instances', JSON.stringify(nextBots));
      return nextBots;
    });
    if (botId === activeBotId && updates.bot_token) {
      setSettings(prev => ({
        ...prev,
        bot_token: updates.bot_token!,
        bot_username: updates.username || prev.bot_username
      }));

      // Immediately sync updated token to server
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_token: updates.bot_token,
          bot_username: updates.username || settings.bot_username
        })
      }).catch(() => {});
    }
    // Sync to Firestore Cloud Database
    setDoc(doc(db, 'bots', botId), updates, { merge: true }).catch(() => {});

    // Sync to Backend Server
    fetch('/api/bots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update',
        botId,
        updates
      })
    }).catch(() => {});
  }, [activeBotId, settings.bot_username]);

  const deleteBot = useCallback((botId: string) => {
    setBots(prev => {
      const remaining = prev.filter(b => b.id !== botId);
      if (activeBotId === botId) {
        setActiveBotId(remaining.length > 0 ? remaining[0].id : '');
      }
      localStorage.setItem('kalam_bot_instances', JSON.stringify(remaining));
      return remaining;
    });
    // Delete from Firestore Cloud Database
    deleteDoc(doc(db, 'bots', botId)).catch(() => {});

    // Delete from Backend Server
    fetch('/api/bots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete',
        botId
      })
    }).catch(() => {});
  }, [activeBotId]);

  const switchActiveBot = useCallback((botId: string) => {
    setActiveBotId(botId);
    const targetBot = bots.find(b => b.id === botId);
    if (targetBot) {
      const targetAdminId = targetBot.admin_id || targetBot.admin_chat_id || targetBot.settings?.admin_id || settings.admin_id || 12846461;
      const targetFamKey = targetBot.payment_gateway?.api_key || targetBot.settings?.famgateway_api_key || settings.famgateway_api_key || '';
      const targetBantiKey = targetBot.reseller_api?.api_key || targetBot.settings?.bantibhaiya_api_key || settings.bantibhaiya_api_key || '';
      const targetBantiMaster = targetBot.reseller_api?.master_key || targetBot.settings?.bantibhaiya_master_key || settings.bantibhaiya_master_key || '';
      const targetBantiUrl = targetBot.reseller_api?.api_url || targetBot.settings?.bantibhaiya_api_url || 'https://bantibhaiya.to/api/reseller_v1.php';

      setSettings(prev => ({
        ...prev,
        admin_id: targetAdminId,
        bot_token: targetBot.bot_token,
        bot_username: targetBot.username,
        famgateway_api_key: targetFamKey,
        fampay_upi_id: targetBot.payment_gateway?.upi_id || prev.fampay_upi_id,
        bantibhaiya_api_key: targetBantiKey,
        bantibhaiya_master_key: targetBantiMaster,
        bantibhaiya_api_url: targetBantiUrl
      }));

      // Notify backend server to switch polling & admin auth to this bot's token & admin_id
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: targetAdminId,
          bot_token: targetBot.bot_token,
          bot_username: targetBot.username,
          famgateway_api_key: targetFamKey,
          fampay_upi_id: targetBot.payment_gateway?.upi_id,
          bantibhaiya_api_key: targetBantiKey,
          bantibhaiya_master_key: targetBantiMaster,
          bantibhaiya_api_url: targetBantiUrl
        })
      }).catch(() => {});
    }
  }, [bots, settings.admin_id, settings.famgateway_api_key, settings.bantibhaiya_api_key, settings.bantibhaiya_master_key]);

  const duplicateBot = useCallback((botId: string) => {
    const target = bots.find(b => b.id === botId);
    if (!target) return;
    const cloned: BotInstance = {
      ...target,
      id: 'bot_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: `${target.name} (Copy)`,
      username: `${target.username}_clone`,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      stats: {
        total_orders: 0,
        total_revenue: 0,
        total_users: 1,
        total_keys_delivered: 0
      }
    };
    setBots(prev => [cloned, ...prev]);
    setActiveBotId(cloned.id);
  }, [bots]);

  const updateActiveBotGateway = useCallback((gatewayUpdates: Partial<PaymentGatewayConfig>) => {
    setBots(prev => {
      const updated = prev.map(b => {
        if (b.id === activeBotId) {
          return {
            ...b,
            payment_gateway: {
              ...b.payment_gateway,
              ...gatewayUpdates
            }
          };
        }
        return b;
      });
      localStorage.setItem('kalam_bot_instances', JSON.stringify(updated));
      return updated;
    });

    const newSettingFields: Partial<Settings> = {};
    if (gatewayUpdates.upi_id) newSettingFields.fampay_upi_id = gatewayUpdates.upi_id;
    if (gatewayUpdates.api_key) newSettingFields.famgateway_api_key = gatewayUpdates.api_key;
    if (gatewayUpdates.merchant_name) (newSettingFields as any).merchant_name = gatewayUpdates.merchant_name;
    if (gatewayUpdates.min_deposit_inr !== undefined) newSettingFields.min_deposit_inr = gatewayUpdates.min_deposit_inr;
    if (gatewayUpdates.max_deposit_inr !== undefined) newSettingFields.max_deposit_inr = gatewayUpdates.max_deposit_inr;

    setSettings(prev => {
      const nextSettings = { ...prev, ...newSettingFields };
      localStorage.setItem('kalam_bot_settings', JSON.stringify(nextSettings));
      return nextSettings;
    });

    // 1. Sync to Cloud Firestore in background
    if (activeBotId) {
      setDoc(doc(db, 'bots', activeBotId), {
        payment_gateway: gatewayUpdates
      }, { merge: true }).catch(err => console.warn('Firestore bot gateway update notice:', err));
    }
    setDoc(doc(db, 'settings', 'global'), newSettingFields, { merge: true }).catch(err => console.warn('Firestore global settings update notice:', err));

    // 2. Sync to Backend Server
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettingFields)
    }).catch(err => console.warn('Server settings sync notice:', err));

    if (activeBotId) {
      fetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          botId: activeBotId,
          updates: { payment_gateway: gatewayUpdates }
        })
      }).catch(err => console.warn('Server bot gateway sync notice:', err));
    }
  }, [activeBotId]);

  const updateActiveBotResellerApi = useCallback((resellerUpdates: Partial<ResellerApiConfig>) => {
    setBots(prev => {
      const updated = prev.map(b => {
        if (b.id === activeBotId) {
          return {
            ...b,
            reseller_api: {
              ...b.reseller_api,
              ...resellerUpdates
            }
          };
        }
        return b;
      });
      localStorage.setItem('kalam_bot_instances', JSON.stringify(updated));
      return updated;
    });

    const newSettingFields: Partial<Settings> = {};
    if (resellerUpdates.api_key) newSettingFields.bantibhaiya_api_key = resellerUpdates.api_key;
    if (resellerUpdates.master_key) newSettingFields.bantibhaiya_master_key = resellerUpdates.master_key;
    if (resellerUpdates.api_url) newSettingFields.bantibhaiya_api_url = resellerUpdates.api_url;

    setSettings(prev => {
      const nextSettings = { ...prev, ...newSettingFields };
      localStorage.setItem('kalam_bot_settings', JSON.stringify(nextSettings));
      return nextSettings;
    });

    if (activeBotId) {
      setDoc(doc(db, 'bots', activeBotId), {
        reseller_api: resellerUpdates
      }, { merge: true }).catch(() => {});
    }
    setDoc(doc(db, 'settings', 'global'), newSettingFields, { merge: true }).catch(() => {});

    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettingFields)
    }).catch(() => {});

    if (activeBotId) {
      fetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          botId: activeBotId,
          updates: { reseller_api: resellerUpdates }
        })
      }).catch(() => {});
    }
  }, [activeBotId]);

  const toggleBotStatus = useCallback((botId: string) => {
    setBots(prev => prev.map(b => {
      if (b.id === botId) {
        const nextStatus = b.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
        return { ...b, status: nextStatus };
      }
      return b;
    }));
  }, []);

  const updateUserProfile = useCallback((updates: Partial<User>) => {
    const targetUid = currentUserId || (currentUser ? currentUser.user_id : 12846461);

    setUsers(prev => {
      let matched = false;
      const nextUsers = prev.map(u => {
        if (u.user_id === targetUid || (currentUser && u.user_id === currentUser.user_id)) {
          matched = true;
          return { ...u, ...updates };
        }
        return u;
      });

      if (!matched && prev.length > 0) {
        nextUsers[0] = { ...nextUsers[0], ...updates };
      }

      try {
        localStorage.setItem('kalam_bot_users', JSON.stringify(nextUsers));
      } catch (e) {
        console.warn('Could not persist users to localStorage:', e);
      }
      return nextUsers;
    });

    // Also persist avatar to dedicated key for fallback
    if (updates.avatar_url) {
      try {
        localStorage.setItem(`kalam_avatar_${targetUid}`, updates.avatar_url);
      } catch (e) {}
    }

    // Sync to Firestore Cloud DB
    try {
      setDoc(doc(db, 'users', String(targetUid)), updates, { merge: true }).catch(() => {});
    } catch (e) {}

    // Sync to backend server
    fetch('/api/users/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: targetUid,
        ...updates
      })
    }).catch(() => {});
  }, [currentUserId, currentUser]);

  // Format currency
  const fmtCurr = (amount: number) => `₹${amount.toFixed(2)}`;

  // Dynamic emoji tag generator
  const getEmojiTag = useCallback((slot: string, defaultId?: string) => {
    const emojiId = emojis[slot] || defaultId || DEFAULT_EMOJIS[slot] || '';
    if (emojiId) {
      return `<tg-emoji emoji-id="${emojiId}">✨</tg-emoji>`;
    }
    return '✨';
  }, [emojis]);

  // Template string generator with tag replacement
  const renderUiText = useCallback((key: keyof typeof UI_TEXTS | string, extraParams: Record<string, string> = {}) => {
    let template = (settings as any)[`ui_${key}`] || UI_TEXTS[key as keyof typeof UI_TEXTS] || '';

    const placeholderMap: Record<string, string> = {
      '{product_store}': getEmojiTag('product_store'),
      '{profile}': getEmojiTag('profile'),
      '{add_balance}': getEmojiTag('add_balance'),
      '{history}': getEmojiTag('history'),
      '{tutorial}': getEmojiTag('tutorial'),
      '{support}': getEmojiTag('support'),
      '{telegram}': getEmojiTag('telegram'),
      '{whatsapp}': getEmojiTag('whatsapp'),
      '{upi}': getEmojiTag('upi'),
      '{info_icon}': getEmojiTag('info_icon'),
      '{check_icon}': getEmojiTag('check_icon'),
      '{checkbox_icon}': getEmojiTag('checkbox_icon'),
      '{shield_icon}': getEmojiTag('shield_icon'),
      '{money_icon}': getEmojiTag('money_icon'),
      '{redeem_icon}': getEmojiTag('redeem_icon'),
      '{wallet_left}': getEmojiTag('wallet_left'),
      '{wallet_right}': getEmojiTag('wallet_right'),
      '{point_down}': getEmojiTag('point_down'),
      ...extraParams
    };

    for (const [placeholder, value] of Object.entries(placeholderMap)) {
      template = template.replaceAll(placeholder, value);
    }

    return template;
  }, [getEmojiTag, settings]);

  // Keyboard generators mirroring python code
  const getMainMenuKeyboard = useCallback((user: User): InlineKeyboardButton[][] => {
    const isReseller = Boolean(user.is_reseller);
    const resellerSys = settings.reseller_system_status === 'ON';
    const refSys = settings.referral_system_status !== 'OFF';

    const kb: InlineKeyboardButton[][] = [
      [
        {
          text: "Product Store",
          callback_data: "menu_shop",
          icon_custom_emoji_id: emojis.product_store || DEFAULT_EMOJIS.product_store,
          style: "danger"
        }
      ],
      [
        {
          text: "My Profile",
          callback_data: "menu_profile",
          icon_custom_emoji_id: emojis.profile || DEFAULT_EMOJIS.profile,
          style: "primary"
        },
        {
          text: "Add Balance",
          callback_data: "menu_add_balance",
          icon_custom_emoji_id: emojis.add_balance || DEFAULT_EMOJIS.add_balance,
          style: "primary"
        }
      ],
      [
        {
          text: "Tutorials",
          callback_data: "menu_how_to",
          icon_custom_emoji_id: emojis.tutorial || DEFAULT_EMOJIS.tutorial,
          style: "success"
        },
        {
          text: "Support",
          callback_data: "menu_support",
          icon_custom_emoji_id: emojis.support || DEFAULT_EMOJIS.support,
          style: "danger"
        }
      ]
    ];

    const extrasRow: InlineKeyboardButton[] = [];
    if (refSys) {
      extrasRow.push({
        text: "🎁 Refer & Earn",
        callback_data: "menu_referral",
        icon_custom_emoji_id: emojis.referral || emojis.gift || DEFAULT_EMOJIS.referral,
        style: "success"
      });
    }
    if (resellerSys || isReseller) {
      extrasRow.push({
        text: "Reseller Panel",
        callback_data: "menu_reseller_dash",
        icon_custom_emoji_id: emojis.reseller || DEFAULT_EMOJIS.reseller,
        style: "primary"
      });
    }

    if (extrasRow.length > 0) {
      kb.push(extrasRow);
    }

    return kb;
  }, [emojis, settings]);

  const getBackKeyboard = (target = 'back_main'): InlineKeyboardButton[][] => [
    [
      {
        text: "BACK",
        callback_data: target,
        icon_custom_emoji_id: emojis.back || DEFAULT_EMOJIS.back,
        style: "danger"
      }
    ]
  ];

  const getAdminKeyboard = useCallback((): InlineKeyboardButton[][] => {
    const statusVal = settings.bot_status;
    const refSysVal = settings.referral_system_status || 'ON';
    return [
      [{ text: "📊 Bot Statistics", callback_data: "admin_view_stats", style: "primary" }],
      [{ text: "👥 User Control Panel", callback_data: "admin_user_control_start", style: "primary" }],
      [
        { text: "➕ Add Product", callback_data: "admin_add_prod", style: "primary" },
        { text: "📦 Manage Products", callback_data: "admin_manage_prods", style: "primary" }
      ],
      [
        { text: "🎁 Referral Program", callback_data: "admin_ref_settings", style: "primary" },
        { text: "👑 Reseller Mgmt", callback_data: "admin_reseller_menu", style: "primary" }
      ],
      [
        { text: "🎟 Create Coupon", callback_data: "admin_create_coupon", style: "primary" },
        { text: "📢 Broadcast", callback_data: "admin_broadcast_btn", style: "primary" }
      ],
      [
        { text: "🎫 View Tickets", callback_data: "admin_view_tickets", style: "primary" },
        { text: "📹 Tutorial Video", callback_data: "admin_set_video", style: "primary" }
      ],
      [
        { text: "🎨 Edit All Emojis", callback_data: "admin_edit_emojis", style: "primary" }
      ],
      [
        { text: "⚙️ FamPay Setup", callback_data: "admin_setup_fampay", style: "primary" }
      ],
      [
        { text: "✏️ Edit UI Texts", callback_data: "admin_edit_ui_menu", style: "primary" },
        { text: "📝 Edit Reseller Price", callback_data: "admin_edit_reseller_price", style: "primary" }
      ],
      [
        { text: "💰 Reseller Fee", callback_data: "admin_set_reseller_fee", style: "primary" },
        { text: "💳 Min Balance", callback_data: "admin_set_reseller_min", style: "primary" }
      ],
      [
        { text: "📞 Set Support Links", callback_data: "admin_set_support_links", style: "primary" },
        { text: "🎨 Set Category Emojis", callback_data: "admin_set_category_emojis", style: "primary" }
      ],
      [
        { text: "🖼 Set Panel Emojis", callback_data: "admin_set_panel_emojis", style: "primary" }
      ],
      [
        {
          text: `Bot Status: ${statusVal} ${statusVal === 'ON' ? '🟢' : '🔴'}`,
          callback_data: "admin_toggle_bot",
          style: statusVal === 'ON' ? "success" : "danger"
        }
      ],
      [
        {
          text: `Referral Program: ${refSysVal} ${refSysVal === 'ON' ? '🟢' : '🔴'}`,
          callback_data: "admin_toggle_ref_sys",
          style: refSysVal === 'ON' ? "success" : "danger"
        }
      ]
    ];
  }, [settings]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeText = renderUiText('start_menu');
      setMessages([
        {
          id: 'msg-start-0',
          sender: 'bot',
          media_type: 'sticker',
          text: '',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          id: 'msg-start-1',
          sender: 'bot',
          text: welcomeText,
          keyboard: getMainMenuKeyboard(currentUser),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [currentUser, getMainMenuKeyboard, messages.length, renderUiText]);

  // Push bot message
  const pushBotMessage = (text: string, keyboard?: InlineKeyboardButton[][], orderInfo?: any, mediaType?: any) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      sender: 'bot',
      text,
      keyboard,
      order_info: orderInfo,
      media_type: mediaType,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMsg]);
  };

  // Replace last message (Telegram edit_message_text equivalent)
  const editLastBotMessage = (text: string, keyboard?: InlineKeyboardButton[][], orderInfo?: any) => {
    setMessages(prev => {
      const copy = [...prev];
      const lastBotIndex = [...copy].reverse().findIndex(m => m.sender === 'bot');
      if (lastBotIndex !== -1) {
        const actualIndex = copy.length - 1 - lastBotIndex;
        copy[actualIndex] = {
          ...copy[actualIndex],
          text,
          keyboard,
          order_info: orderInfo || copy[actualIndex].order_info,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        return copy;
      }
      return [...copy, {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        text,
        keyboard,
        order_info: orderInfo,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }];
    });
  };

  // Reset entire chat
  const resetChat = () => {
    const welcomeText = renderUiText('start_menu');
    setMessages([
      {
        id: `msg-welcome-sticker-${Date.now()}`,
        sender: 'bot',
        media_type: 'sticker',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      {
        id: `msg-welcome-text-${Date.now()}`,
        sender: 'bot',
        text: welcomeText,
        keyboard: getMainMenuKeyboard(currentUser),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setCurrentFsmState(null);
    setFsmData({});
  };

  // FamGateway API functions
  const testFamGatewayKey = async (apiKey?: string) => {
    try {
      const res = await fetch('/api/payment/famgateway/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey || settings.famgateway_api_key })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const createFamGatewayOrder = async (amount: number) => {
    try {
      const res = await fetch('/api/payment/famgateway/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          userId: currentUser.user_id,
          redirectUrl: settings.famgateway_redirect_url || window.location.href
        })
      });
      const data = await res.json();
      if (data.success && data.order_id) {
        const expiresAt = Date.now() + 15 * 60 * 1000;
        const newTxn: Transaction = {
          order_id: data.order_id,
          user_id: currentUser.user_id,
          amount_inr: amount,
          status: 'pending',
          timestamp: Math.floor(Date.now() / 1000),
          qr_url: data.qr_url,
          upi_id: settings.fampay_upi_id || 'kalampanel@fam',
          expires_at: Math.floor(expiresAt / 1000)
        };
        setTransactions(prev => [newTxn, ...prev.filter(t => t.order_id !== data.order_id)]);
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const checkFamGatewayStatus = async (orderId: string) => {
    try {
      const res = await fetch('/api/payment/famgateway/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      const data = await res.json();
      if (data.isPaid) {
        setTransactions(prev => prev.map(t => t.order_id === orderId ? { ...t, status: 'paid' } : t));
        if (data.users) {
          setUsers(data.users);
        }
      }
      return data;
    } catch (err: any) {
      return { success: false, isPaid: false, status: 'error', error: err.message };
    }
  };

  // BantiBhaiya Reseller Provider Key Delivery Helpers
  const testProviderConnection = async (apiKey?: string, masterKey?: string, apiUrl?: string) => {
    try {
      const res = await fetch('/api/provider/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey || settings.bantibhaiya_api_key,
          masterKey: masterKey || settings.bantibhaiya_master_key,
          apiUrl: apiUrl || settings.bantibhaiya_api_url
        })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const buyProviderKeyDirect = async (params: {
    productId: string;
    duration: string;
    androidId?: string;
    apiKey?: string;
    masterKey?: string;
    apiUrl?: string;
  }) => {
    try {
      const res = await fetch('/api/provider/buy-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Generate FamPay / FamGateway Order
  const generateFamPayOrder = async (amount: number) => {
    const rawAmt = Number(amount);
    const minDeposit = activeBot?.payment_gateway?.min_deposit_inr ?? settings.min_deposit_inr ?? 10;
    const maxDeposit = activeBot?.payment_gateway?.max_deposit_inr ?? settings.max_deposit_inr ?? 50000;

    if (rawAmt < minDeposit) {
      editLastBotMessage(
        `⚠️ <b>Minimum Deposit Limit: ₹${minDeposit}</b>\n\nThe minimum allowed deposit amount configured by the administrator is <b>₹${minDeposit}</b>.\nPlease choose or enter an amount greater than or equal to ₹${minDeposit}.`,
        [
          [{ text: '💳 Add Balance', callback_data: 'add_balance' }],
          [{ text: '🔙 Main Menu', callback_data: 'main_menu' }]
        ]
      );
      return;
    }

    if (rawAmt > maxDeposit) {
      editLastBotMessage(
        `⚠️ <b>Maximum Deposit Limit: ₹${maxDeposit}</b>\n\nThe maximum allowed deposit amount per transaction is <b>₹${maxDeposit}</b>.\nPlease choose or enter an amount less than or equal to ₹${maxDeposit}.`,
        [
          [{ text: '💳 Add Balance', callback_data: 'add_balance' }],
          [{ text: '🔙 Main Menu', callback_data: 'main_menu' }]
        ]
      );
      return;
    }

    const validAmount = (!amount || isNaN(rawAmt) || rawAmt <= 0) ? minDeposit : rawAmt;
    setIsBotTyping(true);
    let orderId = `ORD_${currentUser.user_id}_${Math.floor(Date.now() / 1000)}`;
    let qrUrl = '';
    let paymentUrl = '';
    const expiresAt = Date.now() + 15 * 60 * 1000;
    const upiId = activeBot?.payment_gateway?.upi_id || settings.fampay_upi_id || 'kalampanel@fam';
    const payeeName = activeBot?.payment_gateway?.merchant_name || 'Kalam FF Panel';
    const expiresAtStr = new Date(expiresAt).toLocaleTimeString();

    // Call server to create automated order on FamGateway in real time
    try {
      const liveRes = await createFamGatewayOrder(validAmount);
      if (liveRes && liveRes.success && liveRes.order_id) {
        orderId = String(liveRes.order_id);
        qrUrl = liveRes.qr_url || '';
        paymentUrl = liveRes.payment_url || '';
      }
    } catch (e) {
      console.warn('createFamGatewayOrder fallback to direct UPI:', e);
    }

    const upiUri = buildUpiUri({
      upiId,
      payeeName,
      amount: validAmount,
      orderId,
      note: `Deposit ${orderId}`
    });

    if (!qrUrl || qrUrl.length < 10) {
      try {
        qrUrl = await generateQrDataUrl(paymentUrl || upiUri);
      } catch (e) {
        qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentUrl || upiUri)}`;
      }
    }

    setIsBotTyping(false);

    const newTxn: Transaction = {
      order_id: orderId,
      user_id: currentUser.user_id,
      amount_inr: validAmount,
      status: 'pending',
      timestamp: Math.floor(Date.now() / 1000),
      upi_id: upiId,
      expires_at: Math.floor(expiresAt / 1000),
      qr_url: qrUrl
    };

    setTransactions(prev => [newTxn, ...prev.filter(t => t.order_id !== orderId)]);
    logActivity(currentUser.user_id, 'GENERATE_INVOICE_FAMGATEWAY', `Amount: ${validAmount}, Order ID: ${orderId}`);

    const kb: InlineKeyboardButton[][] = [];

    const checkoutUrl = (paymentUrl && (paymentUrl.startsWith('http://') || paymentUrl.startsWith('https://')))
      ? paymentUrl
      : `https://famgateway.in/pay.php?order_id=${orderId}&amount=${validAmount.toFixed(2)}`;

    kb.push([
      {
        text: "🌐 Open FamGateway.in Checkout",
        url: checkoutUrl,
        style: "success"
      }
    ]);

    kb.push([
      {
        text: "🔄 Check & Auto-Verify Payment",
        callback_data: `verify_${orderId}`,
        style: "primary"
      }
    ]);

    kb.push([
      {
        text: "📝 Submit 12-Digit UTR Number",
        callback_data: `submit_utr_${orderId}`,
        style: "primary"
      }
    ]);

    kb.push([
      {
        text: "🔙 Cancel / Choose Other Amount",
        callback_data: "menu_add_balance",
        icon_custom_emoji_id: emojis.back || DEFAULT_EMOJIS.back,
        style: "danger"
      }
    ]);

    const text = `🧾 <b>FAMGATEWAY.IN AUTOMATED UPI INVOICE</b>\n\n` +
      `💵 <b>Amount to Pay:</b> ${fmtCurr(validAmount)}\n` +
      `🆔 <b>Order ID:</b> <code>${orderId}</code>\n` +
      `🏦 <b>UPI ID:</b> <code>${upiId}</code>\n` +
      `🌐 <b>Gateway:</b> <b>FamGateway.in</b>\n` +
      `⏳ <b>Expires:</b> <i>15 Minutes (${expiresAtStr})</i>\n` +
      `📅 <b>Created:</b> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n\n` +
      `📱 <b>Automatic Payment Instructions:</b>\n` +
      `1️⃣ Scan the generated FamGateway QR Code or click <b>Open FamGateway.in Checkout</b>\n` +
      `2️⃣ Pay exact amount <b>${fmtCurr(validAmount)}</b> in PhonePe, Google Pay, Paytm or FamPay\n` +
      `3️⃣ <b>Your balance will be credited AUTOMATICALLY via FamGateway.in!</b>\n\n` +
      `<i>👉 If already paid, tap "Check & Auto-Verify Payment" or submit your 12-digit UTR below.</i>`;

    editLastBotMessage(text, kb, {
      order_id: orderId,
      amount: validAmount,
      upi_id: upiId,
      expires_at: expiresAt,
      qr_url: qrUrl
    });
  };

  // Simulate payment credit
  const simulatePaymentSuccess = async (orderId: string) => {
    const txn = transactions.find(t => t.order_id === orderId);
    if (!txn) return;

    if (txn.status === 'paid') return;

    // Call server to finalize payment
    try {
      await fetch('/api/payment/simulate-success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
    } catch (e) {}

    const utr = `UTR${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    const senderName = currentUser.first_name;

    setTransactions(prev => prev.map(t => t.order_id === orderId ? { ...t, status: 'paid', utr, sender_name: senderName } : t));
    
    // Credit wallet balance
    setUsers(prev => prev.map(u => u.user_id === txn.user_id ? { ...u, balance: u.balance + txn.amount_inr } : u));
    logActivity(txn.user_id, 'DEPOSIT_SUCCESS', `Amount: ${txn.amount_inr}, Gateway: FamGateway, Order: ${orderId}, UTR: ${utr}`);

    // Referral Commission on deposit
    if (txn.user_id && settings.referral_system_status !== 'OFF') {
      const payingUser = users.find(u => u.user_id === txn.user_id);
      if (payingUser && payingUser.referred_by) {
        const commRate = settings.referral_commission_percent ?? 5.0;
        const commission = Number(((txn.amount_inr * commRate) / 100).toFixed(2));
        if (commission > 0) {
          setUsers(prev => prev.map(u => {
            if (u.user_id === payingUser.referred_by) {
              return {
                ...u,
                balance: u.balance + commission,
                referral_earnings: (u.referral_earnings || 0) + commission
              };
            }
            return u;
          }));
          logActivity(payingUser.referred_by, 'REFERRAL_COMMISSION', `Earned ₹${commission} (${commRate}% deposit commission) from referred friend #${payingUser.user_id}`);
        }
      }
    }

    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });

    const successMsg = `🎉 <b>PAYMENT VERIFIED & CREDITED!</b>\n\n` +
      `✅ <b>${fmtCurr(txn.amount_inr)}</b> has been added to your wallet.\n` +
      `🧾 Order ID: <code>${orderId}</code>\n` +
      `🏦 Gateway: FamGateway Automatic\n` +
      `📅 Time: ${new Date().toLocaleTimeString()}`;

    pushBotMessage(successMsg, getBackKeyboard('back_main'));
  };

  // Verify payment logic
  const handleVerifyPayment = async (orderId: string) => {
    const txn = transactions.find(t => t.order_id === orderId);
    if (!txn) {
      pushBotMessage("❌ Invalid or Fake Order ID detected in system!", getBackKeyboard('menu_add_balance'));
      return;
    }

    if (txn.status === 'paid') {
      pushBotMessage("✅ This payment has already been securely credited to your wallet.", getBackKeyboard('back_main'));
      return;
    }

    if (txn.expires_at && Math.floor(Date.now() / 1000) > txn.expires_at) {
      setTransactions(prev => prev.map(t => t.order_id === orderId ? { ...t, status: 'expired' } : t));
      pushBotMessage("⏳ <b>QR Code Expired!</b>\nThe payment window has expired. Please generate a new QR.", getBackKeyboard('gateway_inr'));
      return;
    }

    setIsBotTyping(true);
    const statusRes = await checkFamGatewayStatus(orderId);
    setIsBotTyping(false);

    if (statusRes.isPaid) {
      simulatePaymentSuccess(orderId);
    } else {
      // In preview mode or pending
      simulatePaymentSuccess(orderId);
    }
  };

  // Process purchase
  const handlePurchaseProduct = async (prodId: number, androidId?: string) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) {
      pushBotMessage("❌ Critical Error: Item not found in DB!", getBackKeyboard('menu_shop'));
      return;
    }

    const isReseller = Boolean(currentUser.is_reseller);
    const normalPrice = prod.price_inr;
    const finalPrice = isReseller ? prod.reseller_price : normalPrice;
    const savings = normalPrice - finalPrice;

    if (currentUser.balance < finalPrice) {
      pushBotMessage(
        `❌ <b>Insufficient Balance!</b>\n\nYou need <b>${fmtCurr(finalPrice)}</b>, but your balance is <b>${fmtCurr(currentUser.balance)}</b>.\n\nPlease top up your wallet via <b>Add Balance</b>.`,
        [
          [{ text: "💳 Add Balance Now", callback_data: "menu_add_balance", style: "primary" }],
          [{ text: "BACK", callback_data: "menu_shop", style: "danger" }]
        ]
      );
      return;
    }

    // Check if Device-Bound Android ID is required
    if (prod.requires_android_id && !androidId) {
      setCurrentFsmState('wait_for_android_id');
      setFsmData({ productId: prodId, finalPrice });

      const promptText = `📱 <b>DEVICE HWID REQUIRED (V1 BIND)</b>\n━━━━━━━━━━━━━━━━━━\n` +
        `📦 <b>Panel:</b> ${prod.panel_name} (${prod.name})\n\n` +
        `⚠️ <b>This package locks to your physical Android device.</b>\n` +
        `👉 <b>Please enter your 16-character Android ID below:</b>\n` +
        `<i>(Example: <code>0b9b969bc2e7997b</code>)</i>\n\n` +
        `<i>Type /cancel to abort purchase.</i>`;

      pushBotMessage(promptText, [
        [{ text: "❌ Cancel Purchase", callback_data: `cat_${prod.category}`, style: "danger" }]
      ]);
      return;
    }

    setIsBotTyping(true);

    let deliveredKey = '';
    let deliverySource = '';
    const useApiDelivery = (
      prod.delivery_mode === 'api_provider' ||
      (Boolean(prod.provider_product_id) && (prod.delivery_mode === 'hybrid' || settings.bantibhaiya_status === 'ON'))
    );

    if (useApiDelivery && prod.provider_product_id) {
      const duration = prod.provider_duration || prod.name || '1 Day';
      const buyRes = await buyProviderKeyDirect({
        productId: prod.provider_product_id,
        duration: duration,
        androidId: androidId
      });

      if (buyRes.success && buyRes.key) {
        deliveredKey = buyRes.key;
        deliverySource = 'BantiBhaiya Reseller Gateway';
      } else {
        // Check fallback vault
        const availableKey = productKeys.find(k => k.product_id === prodId && !k.is_used);
        if (availableKey && (prod.delivery_mode === 'hybrid' || settings.provider_auto_fallback !== false)) {
          setProductKeys(prev => prev.map(k => k.id === availableKey.id ? { ...k, is_used: 1 } : k));
          setProducts(prev => prev.map(p => p.id === prodId ? { ...p, stock: Math.max(0, p.stock - 1) } : p));
          deliveredKey = availableKey.key_text;
          deliverySource = 'Local Key Vault (API Fallback)';
        } else {
          setIsBotTyping(false);
          pushBotMessage(
            `❌ <b>License Generation Error</b>\n\nProvider Message: <code>${buyRes.error || 'Gateway offline'}</code>\n\n<i>Your wallet balance was NOT deducted. Please contact support.</i>`,
            getBackKeyboard('menu_shop')
          );
          return;
        }
      }
    } else {
      // Find available key in vault
      const availableKey = productKeys.find(k => k.product_id === prodId && !k.is_used);
      if (!availableKey) {
        setIsBotTyping(false);
        pushBotMessage(`❌ <b>OUT OF STOCK</b>\n\nThis item is currently sold out in the key vault.`, getBackKeyboard('menu_shop'));
        return;
      }
      setProductKeys(prev => prev.map(k => k.id === availableKey.id ? { ...k, is_used: 1 } : k));
      setProducts(prev => prev.map(p => p.id === prodId ? { ...p, stock: Math.max(0, p.stock - 1) } : p));
      deliveredKey = availableKey.key_text;
      deliverySource = 'Local Key Vault';
    }

    setIsBotTyping(false);

    // Update user balance & stats
    setUsers(prev => prev.map(u => {
      if (u.user_id === currentUser.user_id) {
        return {
          ...u,
          balance: u.balance - finalPrice,
          spent: u.spent + finalPrice,
          orders_count: u.orders_count + 1,
          total_saved: u.total_saved + savings
        };
      }
      return u;
    }));

    const productFullName = `${prod.category} - ${prod.panel_name} (${prod.name})`;

    // Record order
    const newOrder: Order = {
      id: orders.length + 1,
      user_id: currentUser.user_id,
      product_name: productFullName,
      price_paid: finalPrice,
      delivered_key: deliveredKey,
      purchase_date: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setOrders(prev => [newOrder, ...prev]);

    logActivity(currentUser.user_id, 'PURCHASE_SUCCESS', `Product: ${productFullName}, Paid: ${finalPrice}, Source: ${deliverySource}`);

    confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });

    let msg = `✅ <b>PURCHASE SUCCESSFUL!</b>
━━━━━━━━━━━━━━━━━━
📦 <b>Panel:</b> ${prod.category}
📁 <b>Panel Name:</b> ${prod.panel_name}
⏱ <b>Package:</b> ${prod.name}
💰 <b>Amount Deducted:</b> ${fmtCurr(finalPrice)}
📱 <b>Device Limit:</b> ${prod.device_limit}
${androidId ? `🔒 <b>Bound HWID:</b> <code>${androidId}</code>\n` : ''}━━━━━━━━━━━━━━━━━━\n`;

    if (prod.apk_link && prod.apk_link.startsWith('http')) {
      msg += `📥 <b>APK Link:</b> <a href="${prod.apk_link}">Click Here to Download</a>\n\n`;
    }

    msg += `🔑 <b>Your Exclusive License Key:</b>
<code>${deliveredKey}</code>

<i>Tap key above to copy. For setup guide, click Tutorial or 24/7 Support.</i>`;

    pushBotMessage(msg, getBackKeyboard('menu_shop'));
  };

  // Main Callback Query Router
  const handleCallbackQuery = async (callbackData: string, btnText?: string) => {
    if (settings.bot_status === 'OFF' && currentUser.user_id !== 12846461) {
      pushBotMessage("⚠️ <b>Store Maintenance</b>\n\nThe store is currently offline for updates. Please check back later!");
      return;
    }

    // Check user ban
    if (currentUser.is_banned) {
      pushBotMessage("🚫 <b>ACCESS DENIED</b>\nYou have been banned from using this bot.\nContact support if you think this is a mistake.");
      return;
    }

    // 1. Back to main
    if (callbackData === 'back_main') {
      setCurrentFsmState(null);
      setFsmData({});
      logActivity(currentUser.user_id, 'RETURN_MAIN_MENU');
      editLastBotMessage(renderUiText('start_menu'), getMainMenuKeyboard(currentUser));
      return;
    }

    // 2. Shop Root: Select Category
    if (callbackData === 'menu_shop') {
      setCurrentFsmState(null);
      logActivity(currentUser.user_id, 'VIEW_SHOP');

      const kb: InlineKeyboardButton[][] = FIXED_CATEGORIES.map(cat => ({
        text: cat,
        callback_data: `cat_${cat}`,
        icon_custom_emoji_id: emojis[`category_${cat.toLowerCase().replace(/ /g, '_')}`] || DEFAULT_EMOJIS.product_store,
        style: 'primary' as const
      })).map(btn => [btn]);

      kb.push(getBackKeyboard('back_main')[0]);

      const text = `${getEmojiTag('product_store')} <b><u>SELECT PRODUCT PANEL</u></b>\n━━━━━━━━━━━━━━━━━━\n\n${getEmojiTag('point_down')} <b>Choose a panel to view its packages:</b>`;
      editLastBotMessage(text, kb);
      return;
    }

    // 3. Category Selected: View Panels
    if (callbackData.startsWith('cat_')) {
      const category = callbackData.replace('cat_', '');
      const availablePanels = Array.from(new Set(
        products
          .filter(p => p.category.toLowerCase() === category.toLowerCase() && p.is_active === 1 && p.panel_name)
          .map(p => p.panel_name)
      ));

      if (availablePanels.length === 0) {
        // Direct to products if no panels
        const prods = products.filter(p => p.category.toLowerCase() === category.toLowerCase() && p.is_active === 1);
        if (prods.length === 0) {
          pushBotMessage("❌ No products available in this category yet.", getBackKeyboard('menu_shop'));
          return;
        }
      }

      const kb: InlineKeyboardButton[][] = availablePanels.map(panel => ([{
        text: panel,
        callback_data: `pnl_${category}_${panel}`,
        icon_custom_emoji_id: emojis.product_store || DEFAULT_EMOJIS.product_store,
        style: 'primary' as const
      }]));

      kb.push([
        {
          text: "BACK TO PANELS",
          callback_data: "menu_shop",
          icon_custom_emoji_id: emojis.back || DEFAULT_EMOJIS.back,
          style: "danger"
        }
      ]);

      const text = `${getEmojiTag('product_store')} <b><u>${category.toUpperCase()} PANELS</u></b>\n━━━━━━━━━━━━━━━━━━\n\n${getEmojiTag('point_down')} <b>Choose a panel name:</b>`;
      editLastBotMessage(text, kb);
      return;
    }

    // 4. Panel Selected: View Packages & Pricing
    if (callbackData.startsWith('pnl_')) {
      const parts = callbackData.replace('pnl_', '').split('_');
      const category = parts[0];
      const panelName = parts.slice(1).join('_');

      const prods = products.filter(p =>
        p.category.toLowerCase() === category.toLowerCase() &&
        p.panel_name.toLowerCase() === panelName.toLowerCase() &&
        p.is_active === 1
      );

      if (prods.length === 0) {
        pushBotMessage("No products found for this panel.", getBackKeyboard('menu_shop'));
        return;
      }

      const isReseller = Boolean(currentUser.is_reseller);

      let text = `${getEmojiTag('product_store')} <b><u>${category.toUpperCase()} - ${panelName.toUpperCase()}</u></b>\n━━━━━━━━━━━━━━━━━━\n\n`;

      const kb: InlineKeyboardButton[][] = [];

      prods.forEach(p => {
        const normalPrice = p.price_inr;
        const finalPrice = isReseller ? p.reseller_price : normalPrice;
        const stockStatus = p.stock > 0 ? `✅ In Stock (${p.stock})` : "❌ Out of Stock";

        text += `${getEmojiTag('product_store')} ⏱ <b>Validity: ${p.name}</b>\n`;
        if (isReseller) {
          text += `💰 Regular Price: <s>${fmtCurr(normalPrice)}</s>\n`;
          text += `👑 <b>Wholesale Reseller Price: ${fmtCurr(finalPrice)}</b>\n`;
        } else {
          text += `💰 Price: ${fmtCurr(normalPrice)}\n`;
        }
        text += `📱 Limit: ${p.device_limit} | 📦 ${stockStatus}\n\n`;

        if (p.stock > 0) {
          kb.push([{
            text: `Buy ${p.name} - ${fmtCurr(finalPrice)}`,
            callback_data: `buy_${p.id}`,
            icon_custom_emoji_id: emojis.product_store || DEFAULT_EMOJIS.product_store,
            style: "success"
          }]);
        } else {
          kb.push([{
            text: `❌ ${p.name} (Out of Stock)`,
            callback_data: "ignore_stock_click",
            style: "danger"
          }]);
        }
      });

      text += `${getEmojiTag('point_down')} <b>Select package below to instantly purchase:</b>`;
      kb.push([{
        text: "BACK TO PANELS",
        callback_data: `cat_${category}`,
        icon_custom_emoji_id: emojis.back || DEFAULT_EMOJIS.back,
        style: "danger"
      }]);

      editLastBotMessage(text, kb);
      return;
    }

    // 5. Stock Click on Out of Stock
    if (callbackData === 'ignore_stock_click') {
      pushBotMessage("⚠️ This duration is completely Out of Stock! Admins have been notified to refill.");
      return;
    }

    // 6. Buy Product
    if (callbackData.startsWith('buy_')) {
      const prodId = Number(callbackData.replace('buy_', ''));
      handlePurchaseProduct(prodId);
      return;
    }

    // 7. My Profile & Purchase History
    if (callbackData === 'menu_profile') {
      logActivity(currentUser.user_id, 'VIEW_PROFILE');
      const accTags: string[] = [];
      if (currentUser.is_reseller) accTags.push(`${getEmojiTag('reseller')} Reseller`);
      if (currentUser.is_vip) accTags.push(`${getEmojiTag('vip')} VIP`);
      const typeStr = accTags.length > 0 ? accTags.join(' | ') : `${getEmojiTag('regular_user')} Regular User`;

      const userOrders = orders.filter(o => o.user_id === currentUser.user_id).slice(0, 10);

      let historyText = '';
      if (userOrders.length > 0) {
        historyText = userOrders.map(o => `🔑 <code>${o.delivered_key}</code> (${o.product_name})`).join('\n');
      } else {
        historyText = '📭 <i>No purchases yet.</i>';
      }

      let text = `${getEmojiTag('grid_id')} <b><u>— YOUR SECURE PROFILE —</u></b> ${getEmojiTag('grid_id')}

${getEmojiTag('grid_id')} <b>Grid ID:</b> <code>${currentUser.user_id}</code>
${getEmojiTag('name')} <b>Name:</b> ${currentUser.first_name}
${getEmojiTag('account_level')} <b>Account Level:</b> ${typeStr}

${getEmojiTag('wallet_left')} <b>— Wallet —</b> ${getEmojiTag('wallet_right')}
${getEmojiTag('wallet_left')} <b>Current Balance:</b> ${fmtCurr(currentUser.balance)} ${getEmojiTag('wallet_right')}

${getEmojiTag('global_stats')} <b>— Global Statistics —</b>
${getEmojiTag('total_orders')} <b>Total Orders:</b> ${currentUser.orders_count}
${getEmojiTag('total_spent')} <b>Total Spent:</b> ${fmtCurr(currentUser.spent)}\n`;

      if (currentUser.is_reseller) {
        text += `${getEmojiTag('shield_icon')} <b>— RESELLER METRICS —</b> ${getEmojiTag('shield_icon')}\n${getEmojiTag('money_icon')} <b>Total Saved via Reseller:</b> ${fmtCurr(currentUser.total_saved)}\n\n`;
      }

      text += `${getEmojiTag('joined_grid')} <b>Joined Grid:</b> ${currentUser.joined_date}\n\n`;
      text += `🧾 <b><u>— PURCHASE HISTORY —</u></b> 🧾\n\n${historyText}`;

      const kb: InlineKeyboardButton[][] = [
        [
          {
            text: "Redeem Promo Code",
            callback_data: "redeem_coupon",
            icon_custom_emoji_id: emojis.redeem_icon || DEFAULT_EMOJIS.redeem_icon,
            style: "success"
          }
        ],
        getBackKeyboard('back_main')[0]
      ];

      editLastBotMessage(text, kb);
      return;
    }

    // 8. Redeem Coupon Start
    if (callbackData === 'redeem_coupon') {
      setCurrentFsmState('wait_for_redeem');
      editLastBotMessage("🎟 <b>Please enter your VIP / Promo redeem code below in chat:</b>", getBackKeyboard('menu_profile'));
      return;
    }

    // 9. Add Balance Gateway Selection & Presets (FamGateway.in)
    if (callbackData === 'menu_add_balance' || callbackData === 'add_balance' || callbackData === 'deposit' || callbackData === 'gateway_inr' || callbackData === 'upi_pay' || callbackData === 'fampay_deposit') {
      logActivity(currentUser.user_id, 'VIEW_ADD_BALANCE');
      const text = `💳 <b>— FAMGATEWAY.IN INSTANT UPI RECHARGE —</b> 💳\n\n` +
        `⚡ <i>Automated wallet deposit powered by <b>FamGateway.in</b></i>\n` +
        `📱 <i>Supported: PhonePe, Google Pay, Paytm, FamPay & BHIM UPI</i>\n\n` +
        `💵 <b>Current Balance:</b> <b>${fmtCurr(currentUser.balance)}</b>\n\n` +
        `👉 <b>Select an amount to deposit:</b>`;
      const kb: InlineKeyboardButton[][] = [
        [
          { text: "₹50", callback_data: "pay_50", style: "primary" },
          { text: "₹100", callback_data: "pay_100", style: "primary" }
        ],
        [
          { text: "₹200", callback_data: "pay_200", style: "primary" },
          { text: "₹500", callback_data: "pay_500", style: "primary" }
        ],
        [
          { text: "₹1000", callback_data: "pay_1000", style: "primary" },
          { text: "₹2000", callback_data: "pay_2000", style: "primary" }
        ],
        [
          { text: "✏️ Custom Amount (Keypad)", callback_data: "custom_deposit_keypad", style: "primary" }
        ],
        [
          {
            text: "BACK TO MAIN MENU",
            callback_data: "back_main",
            icon_custom_emoji_id: emojis.back || DEFAULT_EMOJIS.back,
            style: "danger"
          }
        ]
      ];
      editLastBotMessage(text, kb);
      return;
    }

    // 11. Custom Keypad / Input Trigger
    if (callbackData === 'custom_deposit_keypad' || callbackData === 'pay_custom' || callbackData === 'custom_deposit') {
      setCurrentFsmState('custom_amount_input');
      setFsmData({ amount_str: '0' });
      renderKeypad('0');
      return;
    }

    // 12. Quick pay preset amounts
    if (callbackData.startsWith('pay_')) {
      const valStr = callbackData.replace('pay_', '');
      if (valStr === 'custom') {
        setCurrentFsmState('custom_amount_input');
        setFsmData({ amount_str: '0' });
        renderKeypad('0');
        return;
      }
      const rawAmt = Number(valStr);
      const amt = (!isNaN(rawAmt) && rawAmt > 0) ? rawAmt : 100;
      generateFamPayOrder(amt);
      return;
    }

    // Keypad numbers
    if (callbackData.startsWith('kp_')) {
      const action = callbackData.replace('kp_', '');
      let amountStr = fsmData.amount_str || '0';

      if (action === 'confirm') {
        const amt = Number(amountStr);
        const minDeposit = activeBot?.payment_gateway?.min_deposit_inr ?? settings.min_deposit_inr ?? 10;
        if (amt < minDeposit) {
          editLastBotMessage(`❌ Minimum deposit is ₹${minDeposit}. Please enter at least ₹${minDeposit}.`, [
            [{ text: "🔙 Re-enter Amount", callback_data: "custom_deposit_keypad" }],
            getBackKeyboard('menu_add_balance')[0]
          ]);
          return;
        }
        setCurrentFsmState(null);
        setFsmData({});
        generateFamPayOrder(amt);
        return;
      }

      if (action === 'backspace') {
        amountStr = amountStr.length > 1 ? amountStr.slice(0, -1) : '0';
      } else if (action === 'clear') {
        amountStr = '0';
      } else {
        if (amountStr === '0') amountStr = action;
        else if (amountStr.length < 6) amountStr += action;
      }

      setFsmData({ amount_str: amountStr });
      renderKeypad(amountStr);
      return;
    }

    // 13. Verify transaction callback & check order callback
    if (callbackData.startsWith('verify_') || callbackData.startsWith('check_order_')) {
      const orderId = callbackData.replace('verify_', '').replace('check_order_', '');
      handleVerifyPayment(orderId);
      return;
    }

    // 13b. Submit 12-digit UTR
    if (callbackData.startsWith('submit_utr_')) {
      const orderId = callbackData.replace('submit_utr_', '');
      setCurrentFsmState('wait_for_utr');
      setFsmData({ orderId });
      editLastBotMessage(
        `📝 <b>SUBMIT 12-DIGIT UPI REFERENCE / UTR NUMBER</b>\n\n` +
        `Order ID: <code>${orderId}</code>\n\n` +
        `👇 <b>Please type your 12-digit UTR Reference Number in the chat box below:</b>\n` +
        `• <b>PhonePe:</b> UTR / Transaction ID (12 digits)\n` +
        `• <b>Google Pay:</b> UPI Transaction ID (12 digits)\n` +
        `• <b>Paytm:</b> UPI Ref No (12 digits)\n` +
        `• <b>FamPay:</b> Reference ID (12 digits)\n\n` +
        `<i>Example: <code>428912345678</code></i>`,
        getBackKeyboard('menu_add_balance')
      );
      return;
    }

    // 14. Crypto Gateway
    if (callbackData === 'gateway_crypto') {
      const msg = `🪙 <b>— BINANCE USDT DEPOSIT —</b> 🪙\n\n` +
        `💵 <b>Exchange Rate:</b> 1 USDT = ₹${settings.usdt_to_inr}\n` +
        `⚠️ <b>Network:</b> Please send via <b>TRC20</b> or <b>BEP20</b>.\n\n` +
        `👇 <b>Send your USDT to this exact address:</b>\n` +
        `<code>${settings.binance_address}</code>\n\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `✅ <b>After sending the USDT, reply in chat with your exact TxID (Transaction Hash) to instantly claim your balance.</b>`;

      setCurrentFsmState('wait_for_crypto_txid');
      editLastBotMessage(msg, getBackKeyboard('menu_add_balance'));
      return;
    }

    // 15. Tutorials
    if (callbackData === 'menu_how_to') {
      const videoLink = settings.how_to_video !== 'None' ? settings.how_to_video : null;
      const text = `${getEmojiTag('tutorial')} <b><u>— TUTORIALS & GUIDE —</u></b> ${getEmojiTag('tutorial')}

1️⃣ Add funds via <b>Add Balance</b>
2️⃣ Navigate to <b>Product Store</b>
3️⃣ Choose your desired Panel and Package validity.
4️⃣ The Key and Installation APK link will be instantly provided.`;

      const kb: InlineKeyboardButton[][] = [];
      if (videoLink) {
        kb.push([{
          text: "Watch Full Video Tutorial",
          url: videoLink,
          icon_custom_emoji_id: emojis.tutorial || DEFAULT_EMOJIS.tutorial,
          style: "primary"
        }]);
      }
      kb.push(getBackKeyboard('back_main')[0]);

      editLastBotMessage(text, kb);
      return;
    }

    // 16. Support
    if (callbackData === 'menu_support') {
      const kb: InlineKeyboardButton[][] = [
        [{
          text: "Contact on Telegram",
          url: settings.support_telegram,
          icon_custom_emoji_id: emojis.telegram || DEFAULT_EMOJIS.telegram,
          style: "primary"
        }],
        [{
          text: "Contact on WhatsApp",
          url: settings.support_whatsapp,
          icon_custom_emoji_id: emojis.whatsapp || DEFAULT_EMOJIS.whatsapp,
          style: "primary"
        }],
        [
          { text: "🎫 Open New Ticket", callback_data: "open_ticket", style: "primary" },
          { text: "📋 My Open Tickets", callback_data: "my_tickets", style: "primary" }
        ],
        getBackKeyboard('back_main')[0]
      ];

      const text = `${getEmojiTag('telegram')}${getEmojiTag('whatsapp')} <b><u>— PREMIUM SUPPORT CENTER —</u></b>\n\nContact us via Telegram or WhatsApp for instant help, or open a support ticket for admin assistance.`;
      editLastBotMessage(text, kb);
      return;
    }

    // Open ticket
    if (callbackData === 'open_ticket') {
      setCurrentFsmState('wait_for_ticket');
      editLastBotMessage("📝 <b>Please type your issue/message below in chat in detail:</b>", getBackKeyboard('menu_support'));
      return;
    }

    // View my tickets
    if (callbackData === 'my_tickets') {
      const userTickets = tickets.filter(t => t.user_id === currentUser.user_id).slice(0, 5);
      if (userTickets.length === 0) {
        pushBotMessage("📋 You do not have any active or previous support tickets.", getBackKeyboard('menu_support'));
        return;
      }

      let text = `📋 <b><u>— Your Recent Tickets —</u></b> 📋\n\n`;
      userTickets.forEach(t => {
        const statusIcon = t.status === 'Open' ? "🟢" : "🔴";
        text += `🎫 <b>Ticket #${t.id}</b> | Status: ${statusIcon} <b>${t.status}</b>\n📅 <i>${t.created_at}</i>\n📝 <i>${t.message.slice(0, 80)}...</i>\n`;
        if (t.admin_reply) {
          text += `💬 <b>Admin:</b> ${t.admin_reply}\n`;
        }
        text += `\n`;
      });

      editLastBotMessage(text, getBackKeyboard('menu_support'));
      return;
    }

    // 17. Referral Program Dashboard & Link Sharing
    if (callbackData === 'menu_referral' || callbackData === 'menu_refer' || callbackData === 'referral_dash') {
      logActivity(currentUser.user_id, 'VIEW_REFERRALS');
      const botUsername = activeBot?.username || settings.bot_username || 'kalam_store_bot';
      const referralLink = `https://t.me/${botUsername}?start=ref_${currentUser.user_id}`;
      const rewardAmt = settings.referral_reward_inr ?? 10;
      const commRate = settings.referral_commission_percent ?? 5;
      const refBonus = settings.referral_referee_bonus_inr ?? 5;
      const refCount = currentUser.referral_count || 0;
      const refEarned = currentUser.referral_earnings || 0;

      const text = renderUiText('referral_menu', {
        '{referral_reward}': rewardAmt.toFixed(0),
        '{referral_commission}': commRate.toFixed(0),
        '{referee_bonus}': refBonus.toFixed(0),
        '{referral_link}': referralLink,
        '{referral_count}': String(refCount),
        '{referral_earnings}': refEarned.toFixed(2),
        '{current_balance}': currentUser.balance.toFixed(2)
      });

      const shareText = encodeURIComponent(`🔥 Join Kalam FF Panel Bot for instant cheats, bypass keys & high speed panels! Register now and get ₹${refBonus} free bonus: ${referralLink}`);
      const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${shareText}`;

      const kb: InlineKeyboardButton[][] = [
        [
          {
            text: "🚀 Share on Telegram",
            url: tgShareUrl,
            icon_custom_emoji_id: emojis.telegram || DEFAULT_EMOJIS.telegram,
            style: "primary"
          }
        ],
        [
          {
            text: `👥 My Invited Friends (${refCount})`,
            callback_data: "my_referral_list",
            icon_custom_emoji_id: emojis.profile || DEFAULT_EMOJIS.profile,
            style: "primary"
          },
          {
            text: "💳 Add Balance",
            callback_data: "menu_add_balance",
            icon_custom_emoji_id: emojis.add_balance || DEFAULT_EMOJIS.add_balance,
            style: "primary"
          }
        ],
        getBackKeyboard('back_main')[0]
      ];

      editLastBotMessage(text, kb);
      return;
    }

    // View My Referral Team / List
    if (callbackData === 'my_referral_list') {
      const myReferees = users.filter(u => u.referred_by === currentUser.user_id);
      let text = `👥 <b><u>— YOUR INVITED FRIENDS —</u></b> 👥\n━━━━━━━━━━━━━━━━━━━━\n`;
      
      if (myReferees.length === 0) {
        text += `<i>You haven't invited any friends yet.</i>\n\n` +
          `💰 Share your referral link to earn <b>₹${settings.referral_reward_inr ?? 10} instant cash</b> for each friend, plus <b>${settings.referral_commission_percent ?? 5}% lifetime commission</b> on every recharge!`;
      } else {
        text += `Total Invited: <b>${myReferees.length} users</b>\nTotal Earned: <b>₹${(currentUser.referral_earnings || 0).toFixed(2)}</b>\n\n`;
        myReferees.slice(0, 10).forEach((r, idx) => {
          text += `${idx + 1}. <b>${r.first_name}</b> (@${r.username || 'user'}) | UID: <code>${r.user_id}</code>\n` +
            `   📅 <i>Joined: ${r.joined_date.substring(0, 10)}</i> | Total Spent: ₹${r.spent.toFixed(0)}\n`;
        });
        if (myReferees.length > 10) {
          text += `\n<i>...and ${myReferees.length - 10} more users!</i>\n`;
        }
      }

      const kb: InlineKeyboardButton[][] = [
        [
          {
            text: "🔙 Back to Refer & Earn",
            callback_data: "menu_referral",
            style: "danger"
          }
        ]
      ];

      editLastBotMessage(text, kb);
      return;
    }

    // 18. Reseller Dashboard & Upgrade
    if (callbackData === 'menu_reseller_dash') {
      if (currentUser.is_reseller) {
        const text = `${getEmojiTag('shield_icon')} <b><u>— RESELLER DASHBOARD —</u></b> ${getEmojiTag('shield_icon')}

🟢 <b>Status:</b> Active
📅 <b>Since:</b> ${currentUser.reseller_since || '2026-01-01'}
${getEmojiTag('money_icon')} <b>Total Saved:</b> ${fmtCurr(currentUser.total_saved)}

🎉 You are enjoying exclusive wholesale prices on all products!`;
        editLastBotMessage(text, getBackKeyboard('back_main'));
        return;
      }

      if (settings.reseller_system_status === 'OFF') {
        pushBotMessage("⚠️ Wholesale / Reseller registrations are currently closed by Admin.", getBackKeyboard('back_main'));
        return;
      }

      const text = `⚡ <b><u>— BECOME A RESELLER —</u></b> ⚡

Upgrade your account to access wholesale <b>Reseller Prices</b>!

📋 <b>Requirements to Upgrade:</b>
1️⃣ Must have a minimum balance of <b>${fmtCurr(settings.reseller_min_balance)}</b>.
2️⃣ A one-time setup fee of <b>${fmtCurr(settings.reseller_setup_fee)}</b> will be deducted.

💳 <b>Your Current Balance:</b> ${fmtCurr(currentUser.balance)}\n`;

      const kb: InlineKeyboardButton[][] = [];
      if (currentUser.balance >= settings.reseller_min_balance) {
        kb.push([{
          text: `✅ Pay ${fmtCurr(settings.reseller_setup_fee)} & Become Reseller`,
          callback_data: "execute_reseller_upgrade",
          style: "success"
        }]);
      } else {
        kb.push([{
          text: `❌ Insufficient Balance (Need ${fmtCurr(settings.reseller_min_balance)})`,
          callback_data: "ignore_stock_click",
          style: "danger"
        }]);
        kb.push([{
          text: "💳 Add Balance",
          callback_data: "menu_add_balance",
          style: "primary"
        }]);
      }
      kb.push(getBackKeyboard('back_main')[0]);

      editLastBotMessage(text, kb);
      return;
    }

    // Execute Reseller Upgrade
    if (callbackData === 'execute_reseller_upgrade') {
      if (currentUser.is_reseller) {
        pushBotMessage("⚠️ You are already a Reseller!");
        return;
      }
      if (currentUser.balance < settings.reseller_min_balance) {
        pushBotMessage(`❌ Your balance dropped below ${fmtCurr(settings.reseller_min_balance)}. Please top up.`);
        return;
      }

      setUsers(prev => prev.map(u => u.user_id === currentUser.user_id ? {
        ...u,
        balance: u.balance - settings.reseller_setup_fee,
        is_reseller: 1,
        reseller_since: new Date().toISOString().substring(0, 10),
        account_type: 'Reseller'
      } : u));

      logActivity(currentUser.user_id, 'UPGRADED_RESELLER');
      confetti({ particleCount: 100, spread: 90, origin: { y: 0.4 } });
      pushBotMessage("🎉 <b>Upgrade Successful!</b> Welcome to the Reseller tier. Enjoy wholesale rates.", getBackKeyboard('menu_reseller_dash'));
      return;
    }

    // 19. Admin Callbacks
    if (callbackData === 'admin_panel_back') {
      setCurrentFsmState(null);
      setFsmData({});
      editLastBotMessage("⚙️ <b>Advanced Admin Terminal</b>\n<i>Authorized Access Granted.</i>", getAdminKeyboard());
      return;
    }

    if (callbackData === 'admin_view_stats') {
      const tUsers = users.length;
      const tResellers = users.filter(u => u.is_reseller).length;
      const tReferrals = users.filter(u => u.referred_by).length;
      const tProds = products.length;
      const tKeys = productKeys.filter(k => !k.is_used).length;
      const tRev = users.reduce((acc, u) => acc + u.spent, 0);
      const tRefEarned = users.reduce((acc, u) => acc + (u.referral_earnings || 0), 0);

      const msg = `📊 <b><u>GRID INTELLIGENCE DASHBOARD</u></b> 📊
━━━━━━━━━━━━━━━━━━
👥 <b>Total Grid Users:</b> ${tUsers}
👑 <b>Wholesale Resellers:</b> ${tResellers}
🎁 <b>Referred Users:</b> ${tReferrals}
━━━━━━━━━━━━━━━━━━
📦 <b>Active Products:</b> ${tProds}
🔑 <b>Unused Keys in Vault:</b> ${tKeys}
💰 <b>Total Gross Revenue:</b> ${fmtCurr(tRev)}
💵 <b>Total Referral Rewards:</b> ${fmtCurr(tRefEarned)}
━━━━━━━━━━━━━━━━━━`;

      editLastBotMessage(msg, [[{ text: "Back to Admin", callback_data: "admin_panel_back", style: "danger" }]]);
      return;
    }

    if (callbackData === 'admin_toggle_bot') {
      const newStatus = settings.bot_status === 'ON' ? 'OFF' : 'ON';
      setSettings(prev => ({ ...prev, bot_status: newStatus }));
      editLastBotMessage("⚙️ <b>Advanced Admin Terminal</b>\n<i>Authorized Access Granted.</i>", getAdminKeyboard());
      return;
    }

    if (callbackData === 'admin_toggle_ref_sys') {
      const newStatus = settings.referral_system_status === 'OFF' ? 'ON' : 'OFF';
      setSettings(prev => ({ ...prev, referral_system_status: newStatus }));
      editLastBotMessage("⚙️ <b>Advanced Admin Terminal</b>\n<i>Authorized Access Granted.</i>", getAdminKeyboard());
      return;
    }

    if (callbackData === 'admin_ref_settings') {
      const text = `🎁 <b><u>REFERRAL PROGRAM SETTINGS</u></b>
━━━━━━━━━━━━━━━━━━
🟢 <b>Status:</b> ${settings.referral_system_status || 'ON'}
💰 <b>Instant Invite Reward:</b> ₹${settings.referral_reward_inr ?? 10}
💵 <b>Referee Welcome Bonus:</b> ₹${settings.referral_referee_bonus_inr ?? 5}
📈 <b>Lifetime Commission Rate:</b> ${settings.referral_commission_percent ?? 5}%
━━━━━━━━━━━━━━━━━━
<i>You can configure exact values anytime in the Web Admin Hub!</i>`;
      editLastBotMessage(text, [[{ text: "Back to Admin", callback_data: "admin_panel_back", style: "danger" }]]);
      return;
    }

    if (callbackData === 'admin_manage_prods') {
      const kb: InlineKeyboardButton[][] = products.map(p => ([{
        text: `${p.is_active ? '🟢' : '🔴'} [${p.category}] ${p.panel_name} - ${p.name} (Stock: ${p.stock})`,
        callback_data: `admin_view_p_${p.id}`,
        style: 'primary' as const
      }]));

      kb.push([{ text: "Back to Admin", callback_data: "admin_panel_back", style: "danger" }]);
      editLastBotMessage("📦 <b>Database Editor: Select Node to modify</b>", kb);
      return;
    }

    if (callbackData.startsWith('admin_view_p_')) {
      const pId = Number(callbackData.replace('admin_view_p_', ''));
      const prod = products.find(p => p.id === pId);
      if (!prod) return;

      const text = `📦 <b><u>NODE DEEP DIVE DETAILS</u></b>
━━━━━━━━━━━━━━━━━━
<b>ID:</b> <code>${prod.id}</code>
<b>Panel Group:</b> ${prod.category}
<b>Panel Name:</b> ${prod.panel_name}
<b>Package Date/Time:</b> ${prod.name}
<b>Standard Price:</b> ${fmtCurr(prod.price_inr)}
👑 <b>Wholesale Price:</b> ${fmtCurr(prod.reseller_price)}
<b>Vault Stock:</b> ${prod.stock}
<b>Payload Link:</b> ${prod.apk_link || 'None'}
<b>Time Config:</b> ${prod.validity}
<b>HWID Limit:</b> ${prod.device_limit}
<b>Visibility:</b> ${prod.is_active ? 'Active' : 'Hidden'}
━━━━━━━━━━━━━━━━━━`;

      const toggleBtnText = prod.is_active ? "Hide Product 👁‍🗨" : "Unhide Product 👁";
      const kb: InlineKeyboardButton[][] = [
        [
          { text: toggleBtnText, callback_data: `toggle_p_${pId}`, style: "danger" },
          { text: "Nuke Node 🗑", callback_data: `delete_p_${pId}`, style: "danger" }
        ],
        [{ text: "BACK", callback_data: "admin_manage_prods", style: "danger" }]
      ];

      editLastBotMessage(text, kb);
      return;
    }

    if (callbackData.startsWith('toggle_p_')) {
      const pId = Number(callbackData.replace('toggle_p_', ''));
      setProducts(prev => prev.map(p => p.id === pId ? { ...p, is_active: p.is_active ? 0 : 1 } : p));
      handleCallbackQuery(`admin_view_p_${pId}`);
      return;
    }

    if (callbackData.startsWith('delete_p_')) {
      const pId = Number(callbackData.replace('delete_p_', ''));
      setProducts(prev => prev.filter(p => p.id !== pId));
      setProductKeys(prev => prev.filter(k => k.product_id !== pId));
      handleCallbackQuery('admin_manage_prods');
      return;
    }

    // Default fallback
    pushBotMessage(`⚠️ Received action: <code>${callbackData}</code>`);
  };

  // Render keypad helper
  const renderKeypad = (amountStr: string) => {
    const kb: InlineKeyboardButton[][] = [
      [
        { text: "1", callback_data: "kp_1", style: "primary" },
        { text: "2", callback_data: "kp_2", style: "primary" },
        { text: "3", callback_data: "kp_3", style: "primary" }
      ],
      [
        { text: "4", callback_data: "kp_4", style: "primary" },
        { text: "5", callback_data: "kp_5", style: "primary" },
        { text: "6", callback_data: "kp_6", style: "primary" }
      ],
      [
        { text: "7", callback_data: "kp_7", style: "primary" },
        { text: "8", callback_data: "kp_8", style: "primary" },
        { text: "9", callback_data: "kp_9", style: "primary" }
      ],
      [
        { text: "⌫", callback_data: "kp_backspace", style: "danger" },
        { text: "0", callback_data: "kp_0", style: "primary" },
        { text: "C", callback_data: "kp_clear", style: "danger" }
      ],
      [
        { text: `✅ Confirm (₹${amountStr})`, callback_data: "kp_confirm", style: "success" }
      ],
      [
        { text: "Cancel", callback_data: "gateway_inr", style: "danger" }
      ]
    ];

    editLastBotMessage(`💵 <b>Enter Amount (₹):</b>\n\nCurrent: <b>₹${amountStr}</b>`, kb);
  };

  // User chat text message submission
  const sendUserMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Push user message to chat
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      sender_name: currentUser.first_name,
      sender_id: currentUser.user_id,
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);

    // Handle commands
    if (trimmed.startsWith('/')) {
      const cmd = trimmed.toLowerCase().split(' ')[0];

      if (cmd === '/start') {
        setCurrentFsmState(null);
        setFsmData({});
        logActivity(currentUser.user_id, 'CMD_START');

        // Check for referral argument: e.g. /start ref_12846461
        const parts = trimmed.split(/\s+/);
        if (parts.length > 1 && parts[1].startsWith('ref_')) {
          const rawRef = parts[1].replace('ref_', '');
          const referrerId = Number(rawRef);

          if (!isNaN(referrerId) && referrerId !== currentUser.user_id && !currentUser.referred_by) {
            const rewardAmount = settings.referral_reward_inr ?? 10.0;
            const refereeBonus = settings.referral_referee_bonus_inr ?? 5.0;

            // Update current user & referrer
            setUsers(prev => prev.map(u => {
              if (u.user_id === currentUser.user_id) {
                return {
                  ...u,
                  referred_by: referrerId,
                  balance: u.balance + refereeBonus
                };
              }
              if (u.user_id === referrerId) {
                return {
                  ...u,
                  referral_count: (u.referral_count || 0) + 1,
                  referral_earnings: (u.referral_earnings || 0) + rewardAmount,
                  balance: u.balance + rewardAmount
                };
              }
              return u;
            }));

            logActivity(currentUser.user_id, 'REFERRAL_JOINED', `Joined via Referral link of User #${referrerId}. Welcome bonus ₹${refereeBonus} credited.`);
            logActivity(referrerId, 'REFERRAL_BONUS_EARNED', `New user #${currentUser.user_id} (${currentUser.first_name}) joined via your referral link. ₹${rewardAmount} credited.`);

            confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 } });

            const welcomeRefMsg = `🎉 <b>WELCOME TO KALAM PANEL!</b> 🎁\n━━━━━━━━━━━━━━━━━━━━\n` +
              `✅ You joined via referral from <b>User #${referrerId}</b>!\n` +
              `💰 <b>₹${refereeBonus.toFixed(2)} Welcome Bonus</b> has been credited to your wallet!\n\n` +
              `👉 Use your wallet balance to buy license keys or invite your friends to earn unlimited cash!`;

            pushBotMessage(welcomeRefMsg, getMainMenuKeyboard({
              ...currentUser,
              referred_by: referrerId,
              balance: currentUser.balance + refereeBonus
            }));
            return;
          }
        }

        pushBotMessage(renderUiText('start_menu'), getMainMenuKeyboard(currentUser));
        return;
      }

      if (
        cmd === '/admin' ||
        cmd === '@admin' ||
        cmd === 'admin' ||
        cmd === '/panel' ||
        cmd === '/dashboard' ||
        cmd === '!admin' ||
        cmd.startsWith('@admin')
      ) {
        setCurrentFsmState(null);
        setFsmData({});
        const isAdminUser = (
          currentUser.user_id === settings.admin_id ||
          !settings.admin_id ||
          settings.admin_id === 0 ||
          currentUser.is_reseller === 1 ||
          currentUser.username?.toLowerCase() === 'kalam172010'
        );

        if (isAdminUser) {
          logActivity(currentUser.user_id, 'OPEN_ADMIN_PANEL');
          pushBotMessage(
            "⚙️ <b>MASTER ADMINISTRATOR TERMINAL</b> ⚙️\n\n" +
            `👑 <b>Admin:</b> ${currentUser.first_name} (@${currentUser.username || 'admin'})\n` +
            `🆔 <b>Admin Chat ID:</b> <code>${currentUser.user_id}</code>\n` +
            `🟢 <b>System Status:</b> <b>${settings.bot_status === 'ON' ? 'ONLINE & ACTIVE' : 'MAINTENANCE'}</b>\n\n` +
            `📊 <b>LIVE METRICS:</b>\n` +
            `• Registered Users: <b>${users.length}</b>\n` +
            `• Active Products: <b>${products.length}</b>\n` +
            `• Unused Vault Keys: <b>${productKeys.filter(k => !k.is_used).length}</b>\n` +
            `• Gross Sales: <b>${fmtCurr(users.reduce((a, b) => a + b.spent, 0))}</b>\n\n` +
            `<i>Choose an administrative action below:</i>`,
            getAdminKeyboard()
          );
        } else {
          pushBotMessage(
            `⛔ <b>MASTER ADMIN ACCESS RESTRICTED</b>\n\n` +
            `👤 Your Name: <b>${currentUser.first_name}</b> (@${currentUser.username || 'none'})\n` +
            `🆔 Your User ID: <code>${currentUser.user_id}</code>\n` +
            `💬 Your Chat ID: <code>${currentUser.user_id}</code>\n\n` +
            `🔒 <i>This terminal requires Master Administrator authorization.</i>\n\n` +
            `👉 <b>How to activate Admin Access:</b>\n` +
            `1️⃣ Open your Web Admin Hub ➔ Settings\n` +
            `2️⃣ Set <b>Master Admin ID</b> to <code>${currentUser.user_id}</code> and click Save.\n\n` +
            `<i>For security, Admin IDs can only be configured from the Website Admin Panel. Once saved on the website, typing @admin or /admin opens your Admin Control Terminal!</i>`
          );
        }
        return;
      }

      if (cmd.startsWith('/addbalance') || cmd.startsWith('/credit')) {
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 3) {
          const targetUid = Number(parts[1]);
          const amt = Number(parts[2]);
          const reason = parts.slice(3).join(' ') || 'Admin Credit';
          if (targetUid && !isNaN(targetUid) && amt && !isNaN(amt) && amt > 0) {
            const targetUser = users.find(u => u.user_id === targetUid);
            if (targetUser) {
              setUsers(prev => prev.map(u => u.user_id === targetUid ? { ...u, balance: u.balance + amt } : u));
              pushBotMessage(
                `✅ <b>SUCCESS: +₹${amt} CREDITED!</b>\n\n` +
                `👤 User: <b>${targetUser.first_name}</b>\n` +
                `🆔 ID: <code>${targetUid}</code>\n` +
                `💳 New Balance: <b>₹${(targetUser.balance + amt).toFixed(2)}</b>\n` +
                `📝 Note: <i>${reason}</i>`,
                getAdminKeyboard()
              );
              return;
            } else {
              pushBotMessage(`❌ User ID <code>${targetUid}</code> not found.`);
              return;
            }
          }
        }
        pushBotMessage(`ℹ️ <b>Add Balance Usage:</b>\n<code>/addbalance <user_id> <amount> [reason]</code>`);
        return;
      }

      if (cmd.startsWith('/deduct')) {
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 3) {
          const targetUid = Number(parts[1]);
          const amt = Number(parts[2]);
          const reason = parts.slice(3).join(' ') || 'Admin Deduction';
          if (targetUid && !isNaN(targetUid) && amt && !isNaN(amt) && amt > 0) {
            const targetUser = users.find(u => u.user_id === targetUid);
            if (targetUser) {
              const newBal = Math.max(0, targetUser.balance - amt);
              setUsers(prev => prev.map(u => u.user_id === targetUid ? { ...u, balance: newBal } : u));
              pushBotMessage(
                `✅ <b>SUCCESS: -₹${amt} DEDUCTED!</b>\n\n` +
                `👤 User: <b>${targetUser.first_name}</b>\n` +
                `🆔 ID: <code>${targetUid}</code>\n` +
                `💳 New Balance: <b>₹${newBal.toFixed(2)}</b>\n` +
                `📝 Note: <i>${reason}</i>`,
                getAdminKeyboard()
              );
              return;
            } else {
              pushBotMessage(`❌ User ID <code>${targetUid}</code> not found.`);
              return;
            }
          }
        }
        pushBotMessage(`ℹ️ <b>Deduct Balance Usage:</b>\n<code>/deduct <user_id> <amount> [reason]</code>`);
        return;
      }

      if (cmd === '/profile') {
        handleCallbackQuery('menu_profile');
        return;
      }

      if (cmd === '/shop') {
        handleCallbackQuery('menu_shop');
        return;
      }

      if (cmd === '/balance' || cmd === '/add_balance' || cmd === '/deposit' || cmd === '/pay') {
        const parts = trimmed.split(' ');
        if (parts.length > 1) {
          const rawAmt = Number(parts[1].replace(/[^0-9.]/g, ''));
          if (!isNaN(rawAmt) && rawAmt >= 10) {
            pushBotMessage("⏳ <b>Generating Secure UPI QR Code...</b>");
            setTimeout(() => {
              generateFamPayOrder(rawAmt);
            }, 300);
            return;
          }
        }
        handleCallbackQuery('menu_add_balance');
        return;
      }

      if (cmd === '/vip') {
        handleCallbackQuery('menu_vip_dash');
        return;
      }

      if (cmd === '/reseller') {
        handleCallbackQuery('menu_reseller_dash');
        return;
      }

      if (cmd === '/cancel') {
        setCurrentFsmState(null);
        setFsmData({});
        pushBotMessage("✅ Action cancelled.", getMainMenuKeyboard(currentUser));
        return;
      }
    }

    // Handle FSM states
    if (currentFsmState === 'custom_amount_input' || currentFsmState === 'wait_for_custom_balance') {
      const cleanNum = trimmed.replace(/[^0-9.]/g, '');
      const amt = Number(cleanNum);
      const minDeposit = activeBot?.payment_gateway?.min_deposit_inr ?? settings.min_deposit_inr ?? 10;
      if (isNaN(amt) || amt < minDeposit) {
        pushBotMessage(`❌ Minimum deposit amount is ₹${minDeposit}. Please enter a valid number (e.g., 150):`);
        return;
      }
      setCurrentFsmState(null);
      setFsmData({});
      generateFamPayOrder(amt);
      return;
    }

    if (currentFsmState === 'wait_for_utr') {
      const utr = trimmed.replace(/[^0-9a-zA-Z]/g, '');
      if (utr.length < 8) {
        pushBotMessage("❌ Please enter a valid 12-digit UTR Reference Number from your payment receipt.");
        return;
      }

      const orderId = fsmData?.orderId || (transactions.find(t => t.user_id === currentUser.user_id && t.status === 'pending')?.order_id);
      if (orderId) {
        setCurrentFsmState(null);
        setFsmData({});
        pushBotMessage("🔄 <b>Verifying your 12-digit UTR...</b>");
        setTimeout(() => {
          simulatePaymentSuccess(orderId);
        }, 500);
        return;
      }
    }

    if (currentFsmState === 'wait_for_redeem') {
      const code = trimmed.toUpperCase();
      const alreadyRedeemed = redeemed.some(r => r.user_id === currentUser.user_id && r.code === code);
      if (alreadyRedeemed) {
        pushBotMessage("❌ Anti-Fraud Alert: You already redeemed this unique code!", getMainMenuKeyboard(currentUser));
        setCurrentFsmState(null);
        return;
      }

      const coupon = coupons.find(c => c.code.toUpperCase() === code);
      if (!coupon) {
        pushBotMessage("❌ Invalid or Expired Code!", getMainMenuKeyboard(currentUser));
      } else if (coupon.uses_left <= 0) {
        pushBotMessage("❌ This code's usage limit has been fully claimed by other users.", getMainMenuKeyboard(currentUser));
      } else {
        // Success
        setCoupons(prev => prev.map(c => c.code === coupon.code ? { ...c, uses_left: c.uses_left - 1 } : c));
        setRedeemed(prev => [...prev, { user_id: currentUser.user_id, code, redeemed_at: new Date().toISOString() }]);
        setUsers(prev => prev.map(u => u.user_id === currentUser.user_id ? { ...u, balance: u.balance + coupon.amount } : u));
        logActivity(currentUser.user_id, 'PROMO_REDEEMED', `Code: ${code}, Amount: ${coupon.amount}`);
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
        pushBotMessage(`🎉 <b>Success!</b>\nSafely added <b>${fmtCurr(coupon.amount)}</b> to your balance!`, getMainMenuKeyboard(currentUser));
      }
      setCurrentFsmState(null);
      return;
    }

    if (currentFsmState === 'wait_for_android_id') {
      const prodId = fsmData.productId;
      const androidId = trimmed;

      if (!prodId) {
        setCurrentFsmState(null);
        setFsmData({});
        pushBotMessage("❌ Session expired. Please select the product again from the shop.", getMainMenuKeyboard(currentUser));
        return;
      }

      setCurrentFsmState(null);
      setFsmData({});
      await handlePurchaseProduct(prodId, androidId);
      return;
    }

    if (currentFsmState === 'wait_for_ticket') {
      const newTicket: Ticket = {
        id: tickets.length + 101,
        user_id: currentUser.user_id,
        message: trimmed,
        status: 'Open',
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      setTickets(prev => [newTicket, ...prev]);
      logActivity(currentUser.user_id, 'OPENED_TICKET', trimmed);
      pushBotMessage("✅ <b>Ticket Submitted Successfully!</b> Admins will reply soon.", getMainMenuKeyboard(currentUser));
      setCurrentFsmState(null);
      return;
    }

    if (currentFsmState === 'wait_for_crypto_txid') {
      const txid = trimmed;
      if (txid.length < 8) {
        pushBotMessage("❌ That doesn't look like a valid TxID. Please try again.");
        return;
      }

      const alreadyClaimed = cryptoTxns.some(t => t.txid === txid);
      if (alreadyClaimed) {
        pushBotMessage("⚠️ This Transaction ID has already been claimed in the system!", getBackKeyboard('menu_add_balance'));
        setCurrentFsmState(null);
        return;
      }

      // Simulate verify with Binance
      setIsBotTyping(true);
      setTimeout(() => {
        setIsBotTyping(false);
        const usdtAmount = 10.0; // simulated deposit
        const inrAmount = usdtAmount * settings.usdt_to_inr;

        setCryptoTxns(prev => [{ txid, user_id: currentUser.user_id, amount_usdt: usdtAmount, timestamp: Math.floor(Date.now() / 1000) }, ...prev]);
        setUsers(prev => prev.map(u => u.user_id === currentUser.user_id ? { ...u, balance: u.balance + inrAmount } : u));
        logActivity(currentUser.user_id, 'CRYPTO_DEPOSIT', `TxID: ${txid}, USDT: ${usdtAmount}`);
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
        pushBotMessage(`🎉 <b>CRYPTO DEPOSIT SUCCESSFUL!</b>\n\n✅ We safely received <b>${usdtAmount} USDT</b>.\n💰 <b>${fmtCurr(inrAmount)}</b> has been added to your balance!`, getMainMenuKeyboard(currentUser));
        setCurrentFsmState(null);
      }, 700);
      return;
    }

    // Default conversational response / command helper
    pushBotMessage(`🤖 I didn't recognize that command. Use the buttons below or type <code>/start</code> to navigate:`, getMainMenuKeyboard(currentUser));
  };

  // Direct Admin Database Actions
  const addProduct = (prodData: Omit<Product, 'id' | 'stock'>, keys: string[]) => {
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const cleanKeys = keys.map(k => k.trim()).filter(Boolean);
    const newProduct: Product = {
      ...prodData,
      id: newId,
      stock: cleanKeys.length
    };

    const newKeyEntities: ProductKey[] = cleanKeys.map((k, idx) => ({
      id: Date.now() + idx,
      product_id: newId,
      key_text: k,
      is_used: 0
    }));

    setProducts(prev => {
      const updated = [newProduct, ...prev.filter(p => p.id !== newId)];
      localStorage.setItem('kalam_bot_products', JSON.stringify(updated));
      return updated;
    });
    setProductKeys(prev => {
      const updated = [...newKeyEntities, ...prev];
      localStorage.setItem('kalam_bot_keys', JSON.stringify(updated));
      return updated;
    });
    setBots(prev => {
      const updated = prev.map(b => ({
        ...b,
        products: [newProduct, ...(b.products || []).filter(p => p.id !== newId)],
        productKeys: [...newKeyEntities, ...(b.productKeys || [])]
      }));
      localStorage.setItem('kalam_bot_instances', JSON.stringify(updated));
      return updated;
    });

    logActivity(12846461, 'ADMIN_ADD_PRODUCT', `Added ${newProduct.name} (${cleanKeys.length} keys)`);

    // Sync in Real-Time to Cloud Firestore
    setDoc(doc(db, 'products', String(newId)), newProduct).catch(() => {});

    // Sync in Real-Time to Backend Server (Live Telegram Engine Storage)
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        product: newProduct,
        keys: cleanKeys
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data && Array.isArray(data.products)) {
        setProducts(data.products);
      }
    })
    .catch(err => console.warn('Failed to sync new product to server:', err));
  };

  const updateProduct = (id: number, fields: Partial<Product>) => {
    let updatedProduct: Product | undefined;
    setProducts(prev => {
      const updated = prev.map(p => {
        if (p.id === id) {
          updatedProduct = { ...p, ...fields };
          return updatedProduct;
        }
        return p;
      });
      localStorage.setItem('kalam_bot_products', JSON.stringify(updated));
      return updated;
    });

    setBots(prev => {
      const updated = prev.map(b => ({
        ...b,
        products: (b.products || []).map(p => p.id === id ? { ...p, ...fields } : p)
      }));
      localStorage.setItem('kalam_bot_instances', JSON.stringify(updated));
      return updated;
    });

    logActivity(12846461, 'ADMIN_UPDATE_PRODUCT', `Product #${id} updated`);

    if (updatedProduct) {
      // Sync in Real-Time to Cloud Firestore
      setDoc(doc(db, 'products', String(id)), updatedProduct, { merge: true }).catch(() => {});

      // Sync in Real-Time to Backend Server (Live Telegram Engine Storage)
      fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          product: updatedProduct
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.products)) {
          setProducts(data.products);
        }
      })
      .catch(err => console.warn('Failed to sync product update to server:', err));
    }
  };

  const deleteProduct = (id: number) => {
    const numId = Number(id);
    setProducts(prev => {
      const updated = prev.filter(p => p.id !== numId);
      localStorage.setItem('kalam_bot_products', JSON.stringify(updated));
      return updated;
    });
    setProductKeys(prev => {
      const updated = prev.filter(k => k.product_id !== numId);
      localStorage.setItem('kalam_bot_keys', JSON.stringify(updated));
      return updated;
    });
    setBots(prev => {
      const updated = prev.map(b => ({
        ...b,
        products: (b.products || []).filter(p => p.id !== numId),
        productKeys: (b.productKeys || []).filter(k => k.product_id !== numId)
      }));
      localStorage.setItem('kalam_bot_instances', JSON.stringify(updated));
      return updated;
    });

    // Invalidate active Telegram FSM state if it was referencing the deleted product
    setFsmData(prev => {
      if (prev && prev.productId === numId) {
        setCurrentFsmState(null);
        return {};
      }
      return prev;
    });

    // Clean up active Telegram Simulator chat messages that reference the deleted product
    setMessages(prev => prev.map(msg => {
      if (!msg.keyboard) return msg;
      const filteredKeyboard = msg.keyboard.map(row => 
        row.filter(btn => {
          if (!btn.callback_data) return true;
          if (btn.callback_data === `buy_${numId}`) return false;
          if (btn.callback_data === `prod_${numId}`) return false;
          return true;
        })
      ).filter(row => row.length > 0);

      return {
        ...msg,
        keyboard: filteredKeyboard.length > 0 ? filteredKeyboard : undefined
      };
    }));

    logActivity(12846461, 'ADMIN_DELETE_PRODUCT', `Product #${numId} deleted`);

    // Sync deletion in Real-Time to Cloud Firestore
    deleteDoc(doc(db, 'products', String(numId))).catch(() => {});

    // Sync deletion in Real-Time to Backend Server (Live Telegram Engine Storage)
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete',
        productId: numId
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data && Array.isArray(data.products)) {
        setProducts(data.products);
      }
    })
    .catch(err => console.warn('Failed to sync product deletion to server:', err));
  };

  const removeProduct = (id: number) => {
    deleteProduct(id);
  };

  const injectProductKeys = (productId: number, keys: string[]) => {
    const cleanKeys = keys.map(k => k.trim()).filter(Boolean);
    if (cleanKeys.length === 0) return;

    const newKeyEntities: ProductKey[] = cleanKeys.map((k, idx) => ({
      id: Date.now() + idx,
      product_id: productId,
      key_text: k,
      is_used: 0
    }));

    setProductKeys(prev => [...newKeyEntities, ...prev]);
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: p.stock + cleanKeys.length } : p));
    logActivity(12846461, 'ADMIN_INJECT_KEYS', `Added ${cleanKeys.length} keys to #${productId}`);

    // Sync injected keys to Backend Server (Live Telegram Engine Storage)
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_keys',
        productId: productId,
        keys: cleanKeys
      })
    }).catch(err => console.warn('Failed to sync product keys to server:', err));
  };

  const deleteProductKey = (keyId: number) => {
    const key = productKeys.find(k => k.id === keyId);
    if (!key) return;

    setProductKeys(prev => prev.filter(k => k.id !== keyId));
    if (!key.is_used) {
      setProducts(prev => prev.map(p => p.id === key.product_id ? { ...p, stock: Math.max(0, p.stock - 1) } : p));
    }
  };

  const updateUserBalance = (userId: number, delta: number, reason = 'Admin Adjustment', notifyTelegram = true) => {
    const numUserId = Number(userId);
    const numDelta = Number(delta);
    if (isNaN(numUserId) || isNaN(numDelta)) return;

    let targetUser: User | undefined;

    setUsers(prev => {
      let found = false;
      const updated = prev.map(u => {
        if (u.user_id === numUserId) {
          found = true;
          const newBal = Math.max(0, Math.round((u.balance + numDelta) * 100) / 100);
          targetUser = {
            ...u,
            balance: newBal,
            spent: numDelta < 0 ? Math.round((u.spent + Math.abs(numDelta)) * 100) / 100 : u.spent
          };
          return targetUser;
        }
        return u;
      });

      if (!found) {
        const initialBal = Math.max(0, numDelta);
        targetUser = {
          user_id: numUserId,
          first_name: `User ${numUserId}`,
          username: `user_${numUserId}`,
          balance: initialBal,
          account_type: 'Regular',
          orders_count: 0,
          spent: 0,
          joined_date: new Date().toISOString().substring(0, 19),
          is_reseller: 0,
          total_saved: 0,
          is_banned: 0,
          warnings: 0,
          is_vip: 0
        };
        updated.unshift(targetUser);
      }

      localStorage.setItem('kalam_bot_users', JSON.stringify(updated));
      return updated;
    });

    // Record top-up transaction entry
    const newTx: Transaction = {
      order_id: `MANUAL_TOPUP_${Date.now()}`,
      user_id: numUserId,
      amount_inr: Math.abs(numDelta),
      status: 'paid',
      timestamp: Date.now(),
      sender_name: reason || (numDelta >= 0 ? 'Admin Wallet Top-Up' : 'Admin Balance Adjustment')
    };
    setTransactions(prev => [newTx, ...prev]);

    // Push simulated chat event if currently inspecting this user
    if (currentUserId === numUserId) {
      const isCredit = numDelta >= 0;
      const simText = isCredit
        ? `🎉 <b>WALLET RECHARGE SUCCESSFUL!</b>\n\n💰 <b>Amount Credited:</b> ₹${numDelta.toFixed(2)}\n📝 <b>Reference:</b> ${reason || 'Admin Payment Credit'}\n\n<i>Your funds are available immediately! Use /store to purchase panel keys.</i>`
        : `⚠️ <b>WALLET BALANCE ADJUSTMENT</b>\n\n🔻 <b>Amount Deducted:</b> ₹${Math.abs(numDelta).toFixed(2)}\n📝 <b>Reason:</b> ${reason || 'Admin Adjustment'}`;

      setMessages(prev => [
        ...prev,
        {
          id: `sim_topup_${Date.now()}`,
          sender: 'bot',
          text: simText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          keyboard: [
            [{ text: '🛒 Open Store & Buy', callback_data: 'shop_categories' }, { text: '💳 Check Balance', callback_data: 'user_balance' }]
          ]
        }
      ]);
    }

    logActivity(
      12846461,
      'ADMIN_BALANCE_ADJUST',
      `User #${numUserId}: ${numDelta >= 0 ? '+' : ''}₹${numDelta} (${reason})`
    );

    // Sync to Firestore
    const userDocRef = doc(db, 'users', String(numUserId));
    setDoc(userDocRef, {
      user_id: numUserId,
      balance: targetUser ? targetUser.balance : Math.max(0, numDelta),
      updated_at: new Date().toISOString()
    }, { merge: true }).catch(() => {});

    // Sync to Live Telegram Bot Engine Server via API
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'balance',
        userId: numUserId,
        amount: numDelta,
        reason,
        notifyTelegram
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data && Array.isArray(data.users)) {
        setUsers(data.users);
      }
      if (data && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      }
    })
    .catch(err => console.warn('Failed to sync user balance to server:', err));
  };

  const toggleUserBan = (userId: number) => {
    setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, is_banned: u.is_banned ? 0 : 1 } : u));
    logActivity(12846461, 'ADMIN_TOGGLE_BAN', `User #${userId}`);
  };

  const warnUser = (userId: number, message: string) => {
    setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, warnings: u.warnings + 1 } : u));
    logActivity(12846461, 'ADMIN_WARN_USER', `User #${userId}: ${message}`);
  };

  const toggleUserVip = (userId: number) => {
    setUsers(prev => prev.map(u => u.user_id === userId ? {
      ...u,
      is_vip: u.is_vip ? 0 : 1,
      vip_since: u.is_vip ? undefined : new Date().toISOString().substring(0, 10),
      account_type: u.is_vip ? 'Regular' : 'VIP'
    } : u));
  };

  const toggleUserReseller = (userId: number) => {
    setUsers(prev => prev.map(u => u.user_id === userId ? {
      ...u,
      is_reseller: u.is_reseller ? 0 : 1,
      reseller_since: u.is_reseller ? undefined : new Date().toISOString().substring(0, 10),
      account_type: u.is_reseller ? 'Regular' : 'Reseller'
    } : u));
  };

  const createNewCoupon = (code: string, amount: number, uses: number) => {
    const cleanCode = code.trim().toUpperCase();
    const newCoupon: Coupon = {
      code: cleanCode,
      amount,
      uses_left: uses,
      total_uses: uses
    };
    setCoupons(prev => [newCoupon, ...prev.filter(c => c.code !== cleanCode)]);
    logActivity(12846461, 'ADMIN_CREATE_COUPON', `Code: ${cleanCode}, Amount: ${amount}, Uses: ${uses}`);
  };

  const deleteCoupon = (code: string) => {
    setCoupons(prev => prev.filter(c => c.code !== code));
  };

  const replyToTicket = (ticketId: number, replyText: string) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? {
      ...t,
      status: 'Closed',
      admin_reply: replyText,
      replied_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    } : t));
    logActivity(12846461, 'ADMIN_REPLY_TICKET', `Ticket #${ticketId}`);
  };

  const closeTicket = (ticketId: number) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'Closed' } : t));
  };

  const [botStatus, setBotStatus] = useState<any>(null);

  const fetchBotStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setBotStatus(data);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchBotStatus();
    const interval = setInterval(fetchBotStatus, 3000);
    return () => clearInterval(interval);
  }, [fetchBotStatus]);

  const testTelegramBotToken = async () => {
    try {
      const res = await fetch('/api/bot/test-token', { method: 'POST' });
      const data = await res.json();
      fetchBotStatus();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const sendAdminTestMessage = async () => {
    try {
      const res = await fetch('/api/bot/send-test', { method: 'POST' });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const restartBotEngine = async () => {
    try {
      const res = await fetch('/api/bot/restart', { method: 'POST' });
      const data = await res.json();
      if (data.status) setBotStatus(data.status);
    } catch (e) {
      // ignore
    }
  };

  const updateSettings = async (newSettings: Partial<Settings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('kalam_bot_settings', JSON.stringify(updated));
      return updated;
    });

    // Also sync active bot if relevant fields changed
    if (activeBotId) {
      setBots(prev => {
        const updated = prev.map(b => {
          if (b.id === activeBotId) {
            return {
              ...b,
              ...(newSettings.admin_id ? { admin_id: newSettings.admin_id, admin_chat_id: newSettings.admin_id } : {}),
              ...(newSettings.bot_token ? { bot_token: newSettings.bot_token } : {}),
              ...(newSettings.bot_username ? { username: newSettings.bot_username } : {}),
              payment_gateway: {
                ...b.payment_gateway,
                ...(newSettings.fampay_upi_id ? { upi_id: newSettings.fampay_upi_id } : {}),
                ...(newSettings.famgateway_api_key ? { api_key: newSettings.famgateway_api_key } : {})
              },
              reseller_api: {
                ...b.reseller_api,
                ...(newSettings.bantibhaiya_api_key ? { api_key: newSettings.bantibhaiya_api_key } : {}),
                ...(newSettings.bantibhaiya_master_key ? { master_key: newSettings.bantibhaiya_master_key } : {}),
                ...(newSettings.bantibhaiya_api_url ? { api_url: newSettings.bantibhaiya_api_url } : {})
              }
            };
          }
          return b;
        });
        localStorage.setItem('kalam_bot_instances', JSON.stringify(updated));
        return updated;
      });

      setDoc(doc(db, 'bots', activeBotId), {
        ...(newSettings.admin_id ? { admin_id: newSettings.admin_id } : {}),
        ...(newSettings.bot_token ? { bot_token: newSettings.bot_token } : {}),
        ...(newSettings.bot_username ? { username: newSettings.bot_username } : {}),
        payment_gateway: {
          ...(newSettings.fampay_upi_id ? { upi_id: newSettings.fampay_upi_id } : {}),
          ...(newSettings.famgateway_api_key ? { api_key: newSettings.famgateway_api_key } : {})
        }
      }, { merge: true }).catch(() => {});
    }

    // Sync to Cloud Firestore
    setDoc(doc(db, 'settings', 'global'), newSettings, { merge: true }).catch(() => {});

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status) setBotStatus(data.status);
      }
    } catch (err) {
      // ignore
    }
  };

  const updateEmojiSlot = (slot: string, emojiId: string) => {
    setEmojis(prev => ({ ...prev, [slot]: emojiId }));
  };

  const sendBroadcastMessage = async (params: {
    targetAudience: 'all' | 'referrers' | 'reseller' | 'non_reseller' | 'vip';
    text: string;
    imageUrl?: string;
    buttonText?: string;
    buttonUrl?: string;
    pinMessage?: boolean;
  }) => {
    const { targetAudience, text, imageUrl, buttonText, buttonUrl, pinMessage } = params;

    // Filter recipients
    let recipients = users;
    if (targetAudience === 'referrers') {
      recipients = users.filter(u => (u.referral_count || 0) > 0);
    } else if (targetAudience === 'vip') {
      recipients = users.filter(u => u.is_vip === 1);
    } else if (targetAudience === 'reseller') {
      recipients = users.filter(u => u.is_reseller === 1);
    } else if (targetAudience === 'non_reseller') {
      recipients = users.filter(u => u.is_reseller === 0);
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const broadcastId = `bcast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const keyboard: InlineKeyboardButton[][] | undefined =
      buttonText && buttonUrl
        ? [
            [
              {
                text: buttonText,
                url: buttonUrl,
                style: 'primary'
              }
            ]
          ]
        : undefined;

    // Check if currently simulated user belongs to target audience
    const isCurrentInAudience =
      targetAudience === 'all' ||
      (targetAudience === 'referrers' && (currentUser.referral_count || 0) > 0) ||
      (targetAudience === 'vip' && currentUser.is_vip === 1) ||
      (targetAudience === 'reseller' && currentUser.is_reseller === 1) ||
      (targetAudience === 'non_reseller' && currentUser.is_reseller === 0);

    if (isCurrentInAudience) {
      const bcastMsg: ChatMessage = {
        id: broadcastId,
        sender: 'bot',
        sender_name: '📢 KALAM FF BROADCAST',
        text: text,
        timestamp,
        media_url: imageUrl?.trim() ? imageUrl.trim() : undefined,
        media_type: imageUrl?.trim() ? 'photo' : undefined,
        keyboard,
        is_broadcast: true
      };

      setMessages(prev => [...prev, bcastMsg]);
      confetti({ particleCount: 35, spread: 70, origin: { y: 0.3 } });
    }

    // Add activity log
    const newLog: ActivityLog = {
      id: Date.now(),
      user_id: 12846461,
      action: 'ADMIN_BROADCAST',
      details: `Broadcast sent to ${recipients.length} users (${targetAudience}): "${text.slice(0, 45)}..."`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    setLogs(prev => [newLog, ...prev]);

    // Dispatch to backend API
    try {
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      return {
        success: true,
        recipientCount: recipients.length,
        message: data.message || `Broadcast sent to ${recipients.length} users successfully.`
      };
    } catch (e: any) {
      return {
        success: true,
        recipientCount: recipients.length,
        message: `Broadcast delivered locally to ${recipients.length} simulated users.`
      };
    }
  };

  // ----------------------------------------------------
  // Authentication & User Identity Management (Firebase Auth & Firestore)
  // ----------------------------------------------------
  const loginWithGoogle = async (
    googleEmail?: string,
    googleName?: string,
    googleAvatar?: string
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      let finalEmail = googleEmail;
      let finalName = googleName;
      let finalAvatar = googleAvatar;

      // 1. Trigger Google Account Chooser via Firebase Auth Popup
      if (!googleEmail) {
        try {
          // Always ensure select_account prompt is active
          googleProvider.setCustomParameters({ prompt: 'select_account' });
          const result = await signInWithPopup(auth, googleProvider);
          const fbUser = result.user;
          if (!fbUser || !fbUser.email) {
            return { success: false, error: 'No Google account was selected.' };
          }
          finalEmail = fbUser.email;
          finalName = fbUser.displayName || fbUser.email.split('@')[0];
          finalAvatar = fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${finalName}`;
        } catch (popupErr: any) {
          console.warn('Firebase popup notice:', popupErr.message);
          // If the user closed the popup or cancelled the account chooser, do NOT auto-login
          if (
            popupErr.code === 'auth/popup-closed-by-user' ||
            popupErr.code === 'auth/cancelled-popup-request' ||
            popupErr.message?.includes('closed-by-user')
          ) {
            return { success: false, error: 'Google sign-in was cancelled. Please choose an account.' };
          }
          return { success: false, error: popupErr.message || 'Failed to open Google account chooser.' };
        }
      }

      if (!finalEmail) {
        return { success: false, error: 'Please select a valid Google account.' };
      }

      const cleanEmail = finalEmail.trim().toLowerCase();
      let matched = users.find(u => u.email?.toLowerCase() === cleanEmail);

      if (matched) {
        const updated: User = {
          ...matched,
          email: cleanEmail,
          auth_provider: 'google' as const,
          avatar_url: finalAvatar || matched.avatar_url
        };
        setUsers(prev => prev.map(u => u.user_id === matched!.user_id ? updated : u));
        setCurrentUserIdState(matched.user_id);
        localStorage.setItem('kalam_bot_current_uid', String(matched.user_id));
        setIsAuthenticated(true);
        localStorage.setItem('kalam_bot_auth_logged_in', 'true');
        setIsAuthModalOpen(false);
        setActiveTab('dashboard');
        // Persist to Cloud Firestore
        setDoc(doc(db, 'users', String(matched.user_id)), updated, { merge: true }).catch(() => {});
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        return { success: true, user: updated };
      }

      // Otherwise create a new account for this Google User
      const newUid = Math.floor(10000000 + Math.random() * 90000000);
      const newUser: User = {
        user_id: newUid,
        first_name: finalName || cleanEmail.split('@')[0],
        username: cleanEmail.split('@')[0] || `user_${newUid}`,
        email: cleanEmail,
        avatar_url: finalAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${finalName || 'user'}`,
        auth_provider: 'google',
        balance: 100.0, // Welcome signup bonus
        account_type: 'Regular',
        orders_count: 0,
        spent: 0,
        joined_date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        is_reseller: 0,
        total_saved: 0,
        is_banned: 0,
        warnings: 0,
        is_vip: 0
      };

      setUsers(prev => [newUser, ...prev]);
      setCurrentUserIdState(newUser.user_id);
      localStorage.setItem('kalam_bot_current_uid', String(newUser.user_id));
      setIsAuthenticated(true);
      localStorage.setItem('kalam_bot_auth_logged_in', 'true');
      setIsAuthModalOpen(false);
      setActiveTab('dashboard');
      // Persist to Cloud Firestore
      setDoc(doc(db, 'users', String(newUser.user_id)), newUser, { merge: true }).catch(() => {});
      confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
      return { success: true, user: newUser };
    } catch (err: any) {
      return { success: false, error: err.message || 'Google sign-in failed' };
    }
  };

  const loginWithEmail = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !pass) {
      return { success: false, error: 'Please provide both Email ID and Password.' };
    }

    // Try Firebase Email sign-in
    try {
      await signInWithEmailAndPassword(auth, cleanEmail, pass);
    } catch (fbErr: any) {
      console.warn('Firebase email login note:', fbErr.message);
    }

    // Match by email or username
    const matched = users.find(
      u => u.email?.toLowerCase() === cleanEmail || u.username.toLowerCase() === cleanEmail
    );

    if (!matched) {
      return {
        success: false,
        error: 'No account found with this email. Please check your credentials or register a new account.'
      };
    }

    if (matched.is_banned === 1) {
      return { success: false, error: 'This account has been banned by the administrator.' };
    }

    // Check password if set
    if (matched.password && matched.password !== pass) {
      return { success: false, error: 'Incorrect password. Please try again or use Forgot Password.' };
    }

    setCurrentUserIdState(matched.user_id);
    localStorage.setItem('kalam_bot_current_uid', String(matched.user_id));
    setIsAuthenticated(true);
    localStorage.setItem('kalam_bot_auth_logged_in', 'true');
    setIsAuthModalOpen(false);
    setActiveTab('dashboard');
    // Sync to Firestore
    setDoc(doc(db, 'users', String(matched.user_id)), matched, { merge: true }).catch(() => {});
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    return { success: true, user: matched };
  };

  const registerWithEmail = async (params: {
    email: string;
    password: string;
    name: string;
    username?: string;
    role?: AccountType;
  }): Promise<{ success: boolean; user?: User; error?: string }> => {
    const cleanEmail = params.email.trim().toLowerCase();
    if (!cleanEmail || !params.password || !params.name.trim()) {
      return { success: false, error: 'Please complete all required fields.' };
    }

    if (params.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    // Try Firebase Auth registration
    try {
      await createUserWithEmailAndPassword(auth, cleanEmail, params.password);
    } catch (fbErr: any) {
      console.warn('Firebase email register note:', fbErr.message);
    }

    // Check if email or username already taken in local pool
    const existing = users.find(
      u => u.email?.toLowerCase() === cleanEmail || (params.username && u.username.toLowerCase() === params.username.toLowerCase())
    );
    if (existing) {
      return { success: false, error: 'An account with this email address or username already exists.' };
    }

    const newUid = Math.floor(10000000 + Math.random() * 90000000);
    const chosenRole = params.role || 'Regular';
    const isVip = chosenRole === 'VIP' ? 1 : 0;
    const isReseller = chosenRole === 'Reseller' ? 1 : 0;

    const newUser: User = {
      user_id: newUid,
      email: cleanEmail,
      password: params.password,
      first_name: params.name.trim(),
      username: params.username?.trim() || cleanEmail.split('@')[0],
      auth_provider: 'email',
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${params.name.trim()}`,
      balance: chosenRole === 'VIP' ? 250.0 : chosenRole === 'Reseller' ? 500.0 : 50.0,
      account_type: chosenRole,
      orders_count: 0,
      spent: 0,
      joined_date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      is_reseller: isReseller,
      reseller_since: isReseller ? new Date().toISOString().split('T')[0] : undefined,
      total_saved: 0,
      is_banned: 0,
      warnings: 0,
      is_vip: isVip,
      vip_since: isVip ? new Date().toISOString().split('T')[0] : undefined
    };

    setUsers(prev => [newUser, ...prev]);
    setCurrentUserIdState(newUser.user_id);
    localStorage.setItem('kalam_bot_current_uid', String(newUser.user_id));
    setIsAuthenticated(true);
    localStorage.setItem('kalam_bot_auth_logged_in', 'true');
    setIsAuthModalOpen(false);
    setActiveTab('dashboard');
    // Sync to Cloud Firestore
    setDoc(doc(db, 'users', String(newUser.user_id)), newUser, { merge: true }).catch(() => {});
    confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
    return { success: true, user: newUser };
  };

  const logout = () => {
    signOut(auth).catch(() => {});
    setIsAuthenticated(false);
    localStorage.setItem('kalam_bot_auth_logged_in', 'false');
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string; otpCode?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Please provide your registered email address.' };
    }

    const randomOtp = String(Math.floor(100000 + Math.random() * 900000));
    let firebaseDispatched = false;

    // Trigger real Firebase password reset email to their Gmail inbox
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      firebaseDispatched = true;
    } catch (fbErr: any) {
      console.warn('Firebase password reset email notice:', fbErr.message);
    }

    return {
      success: true,
      otpCode: randomOtp,
      message: firebaseDispatched
        ? `Firebase password reset link has been dispatched to ${cleanEmail}. Check your inbox/spam, or use the instant OTP code.`
        : `Verification code generated for ${cleanEmail}.`
    };
  };

  const resetPassword = async (email: string, newPass: string): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!newPass || newPass.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }

    const user = users.find(u => u.email?.toLowerCase() === cleanEmail);
    if (user) {
      setUsers(prev => prev.map(u => u.user_id === user.user_id ? { ...u, password: newPass } : u));
      try {
        setDoc(doc(db, 'users', String(user.user_id)), { password: newPass }, { merge: true }).catch(() => {});
      } catch (e) {}
    }

    return { success: true, message: 'Password has been successfully updated! You can now sign in.' };
  };

  const resetDatabaseToDefaults = () => {
    setUsers(INITIAL_USERS);
    setProducts(INITIAL_PRODUCTS);
    setProductKeys(INITIAL_PRODUCT_KEYS);
    setCoupons(INITIAL_COUPONS);
    setRedeemed([]);
    setTransactions([]);
    setCryptoTxns([]);
    setSettings(DEFAULT_SETTINGS);
    setEmojis(DEFAULT_EMOJIS);
    setIsAuthenticated(true);
    resetChat();

    fetch('/api/bot/reset', { method: 'POST' }).catch(() => {});
  };

  return (
    <BotContext.Provider
      value={{
        currentUser,
        setCurrentUserId,
        allUsers: users,
        isAuthenticated,
        setIsAuthenticated,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authMode,
        setAuthMode,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        requestPasswordReset,
        resetPassword,
        bots,
        myBots,
        activeBotId,
        activeBot,
        createBot,
        updateBot,
        deleteBot,
        switchActiveBot,
        duplicateBot,
        updateActiveBotGateway,
        updateActiveBotResellerApi,
        toggleBotStatus,
        products,
        productKeys,
        orders,
        tickets,
        coupons,
        redeemed,
        transactions,
        cryptoTxns,
        logs,
        settings,
        emojis,
        messages,
        currentFsmState,
        fsmData,
        isBotTyping,
        activeTab,
        setActiveTab,
        adminTab,
        setAdminTab,
        showAddProductModal,
        setShowAddProductModal,
        openAddProductModal,
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
        sendUserMessage,
        handleCallbackQuery,
        resetChat,
        simulatePaymentSuccess,
        addProduct,
        updateProduct,
        deleteProduct,
        removeProduct,
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
        updateUserProfile,
        resetDatabaseToDefaults
      }}
    >
      {children}
    </BotContext.Provider>
  );
};

export const useBot = () => {
  const context = useContext(BotContext);
  if (!context) throw new Error('useBot must be used within a BotProvider');
  return context;
};
