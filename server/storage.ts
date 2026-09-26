import fs from 'fs';
import path from 'path';
import {
  loadStateFromFirestore,
  saveStateToFirestore,
  syncProductToFirestore,
  deleteProductFromFirestore,
  deleteProductsFromFirestore,
  isFirestoreAvailable
} from './firebaseSync';
import {
  User,
  Product,
  ProductKey,
  Order,
  Ticket,
  Coupon,
  RedeemedCoupon,
  Transaction,
  ActivityLog,
  Settings,
  BotInstance
} from '../src/types';
import {
  DEFAULT_EMOJIS,
  DEFAULT_SETTINGS,
  INITIAL_COUPONS,
  INITIAL_PRODUCTS,
  INITIAL_PRODUCT_KEYS,
  INITIAL_USERS,
  INITIAL_BOTS
} from '../src/data/defaultData';

export function matchCategoryFlexible(c1Str?: string, c2Str?: string): boolean {
  if (!c1Str || !c2Str) return false;
  const p = (c1Str || '').trim().toLowerCase();
  const t = (c2Str || '').trim().toLowerCase();
  if (p === t) return true;

  const pNorm = (p || '').replace(/[^a-z0-9]/g, '');
  const tNorm = (t || '').replace(/[^a-z0-9]/g, '');
  if (!pNorm || !tNorm) return false;
  if (pNorm === tNorm) return true;

  // Strict Non-Root
  const isNonRootP = pNorm.includes('nonroot') || (pNorm.includes('non') && pNorm.includes('root'));
  const isNonRootT = tNorm.includes('nonroot') || (tNorm.includes('non') && tNorm.includes('root')) || tNorm === 'catnonroot' || tNorm === 'nonroot';
  if (isNonRootP || isNonRootT) {
    return Boolean(isNonRootP && isNonRootT);
  }

  // Strict Root
  const isRootP = pNorm.includes('root') && !pNorm.includes('non');
  const isRootT = (tNorm.includes('root') && !tNorm.includes('non')) || tNorm === 'catroot' || tNorm === 'root';
  if (isRootP || isRootT) {
    return Boolean(isRootP && isRootT);
  }

  // Strict PC / Emulator
  const isPcP = pNorm.includes('pc') || pNorm.includes('emulator') || pNorm.includes('windows');
  const isPcT = tNorm.includes('pc') || tNorm.includes('emulator') || tNorm.includes('windows') || tNorm === 'catpc';
  if (isPcP || isPcT) {
    return Boolean(isPcP && isPcT);
  }

  return pNorm === tNorm;
}

export function matchNameFlexible(n1Str?: string, n2Str?: string): boolean {
  if (!n1Str || !n2Str) return false;
  const n1 = (n1Str || '').trim().toLowerCase();
  const n2 = (n2Str || '').trim().toLowerCase();
  if (n1 === n2) return true;
  const n1Norm = n1.replace(/[^a-z0-9]/g, '');
  const n2Norm = n2.replace(/[^a-z0-9]/g, '');
  if (!n1Norm || !n2Norm) return false;
  return n1Norm === n2Norm;
}

export interface DatabaseSchema {
  users: User[];
  products: Product[];
  productKeys: ProductKey[];
  orders: Order[];
  tickets: Ticket[];
  coupons: Coupon[];
  redeemed: RedeemedCoupon[];
  transactions: Transaction[];
  logs: ActivityLog[];
  settings: Settings;
  emojis: Record<string, string>;
  fsmStates: Record<number, { state: string; data?: any }>;
  bots: BotInstance[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export class DatabaseStore {
  private data: DatabaseSchema;
  private isFirestoreSynced = false;
  public onProductsChange?: (products: Product[], productKeys: ProductKey[]) => void;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadData();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);

        let products: Product[] = Array.isArray(parsed.products) && parsed.products.length > 0 ? parsed.products : INITIAL_PRODUCTS;
        let productKeys: ProductKey[] = Array.isArray(parsed.productKeys) && parsed.productKeys.length > 0 ? parsed.productKeys : INITIAL_PRODUCT_KEYS;

        // Deduplicate and ensure stable unique IDs for all duration plans
        const seenIds = new Set<string | number>();
        products = products.map((p, idx) => {
          let currentId = p.id;
          if (currentId === undefined || currentId === null || seenIds.has(currentId) || String(currentId).trim() === '') {
            currentId = 1000 + idx;
          }
          seenIds.add(currentId);
          return {
            ...p,
            id: currentId,
            is_active: p.is_active !== undefined ? (p.is_active === 0 ? 0 : 1) : 1,
            reseller_price: p.reseller_price ?? p.price_inr,
            reseller_price_inr: p.reseller_price_inr ?? p.price_inr
          };
        });

        productKeys = productKeys.filter(k => products.some(p => String(p.id) === String(k.product_id)));
        if (productKeys.length === 0) {
          productKeys = INITIAL_PRODUCT_KEYS;
        }

        // Preserve bot-specific products, keys, and settings per bot instance
        let bots: BotInstance[] = Array.isArray(parsed.bots) ? parsed.bots : [];
        bots = bots.map(b => ({
          ...b,
          products: Array.isArray(b.products) ? b.products : products.filter(p => !p.bot_id || p.bot_id === b.id),
          productKeys: Array.isArray(b.productKeys) ? b.productKeys : productKeys
        }));

        const data: DatabaseSchema = {
          users: Array.isArray(parsed.users) ? parsed.users : INITIAL_USERS,
          products,
          productKeys,
          orders: Array.isArray(parsed.orders) ? parsed.orders : [],
          tickets: Array.isArray(parsed.tickets) ? parsed.tickets : [],
          coupons: Array.isArray(parsed.coupons) ? parsed.coupons : INITIAL_COUPONS,
          redeemed: Array.isArray(parsed.redeemed) ? parsed.redeemed : [],
          transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
          logs: Array.isArray(parsed.logs) ? parsed.logs : [],
          settings: {
            ...DEFAULT_SETTINGS,
            ...(parsed.settings || {}),
            bot_token: parsed.settings?.bot_token || '',
            bot_username: parsed.settings?.bot_username || '',
            admin_id: parsed.settings?.admin_id || DEFAULT_SETTINGS.admin_id
          },
          emojis: parsed.emojis || DEFAULT_EMOJIS,
          fsmStates: parsed.fsmStates || {},
          bots
        };

        return data;
      }
    } catch (err) {
      console.error('Failed to load database.json, initializing fresh data:', err);
    }

    const initial: DatabaseSchema = {
      users: INITIAL_USERS,
      products: INITIAL_PRODUCTS,
      productKeys: INITIAL_PRODUCT_KEYS,
      orders: [],
      tickets: [],
      coupons: INITIAL_COUPONS,
      redeemed: [],
      transactions: [],
      logs: [],
      settings: {
        ...DEFAULT_SETTINGS,
        bot_token: process.env.TELEGRAM_BOT_TOKEN || DEFAULT_SETTINGS.bot_token,
        admin_id: process.env.TELEGRAM_ADMIN_ID ? Number(process.env.TELEGRAM_ADMIN_ID) : DEFAULT_SETTINGS.admin_id
      },
      emojis: DEFAULT_EMOJIS,
      fsmStates: {},
      bots: INITIAL_BOTS
    };

    this.saveData(initial);
    return initial;
  }

  public saveData(dataToSave?: DatabaseSchema, forceImmediate: boolean = false) {
    try {
      this.ensureDataDir();
      const target = dataToSave || this.data;

      // Ensure each bot preserves its own products, keys, and settings
      if (Array.isArray(target.bots)) {
        target.bots.forEach(b => {
          if (!Array.isArray(b.products)) {
            b.products = (target.products || []).filter(p => !p.bot_id || p.bot_id === b.id);
          }
          if (!Array.isArray(b.productKeys)) {
            b.productKeys = target.productKeys || [];
          }
        });
      }

      fs.writeFileSync(DB_FILE, JSON.stringify(target, null, 2), 'utf-8');
      
      // Notify real-time SSE listeners
      this.onProductsChange?.(target.products || [], target.productKeys || []);

      // Async sync to Cloud Firestore to survive Render auto-deploys & restarts
      if (this.isFirestoreSynced && isFirestoreAvailable()) {
        saveStateToFirestore(target, forceImmediate).catch(err => {
          console.warn('Background Firestore save notice:', err.message);
        });
      }
    } catch (err) {
      console.error('Failed to persist database.json:', err);
    }
  }

  public async syncWithFirestore(): Promise<void> {
    try {
      const remote = await loadStateFromFirestore();
      if (!remote) {
        if (isFirestoreAvailable()) {
          console.log('⚡ Firestore: Initializing cloud backup with current state...');
          this.isFirestoreSynced = true;
          await saveStateToFirestore(this.data, true);
        }
        return;
      }

      console.log('⚡ Firestore: Restoring cloud backup and merging state...');

      // 1. Restore & Merge Settings (Preserves bot_token, admin_id, bot_username)
      if (remote.settings && typeof remote.settings === 'object') {
        this.data.settings = {
          ...this.data.settings,
          ...remote.settings,
          bot_token: remote.settings.bot_token || this.data.settings.bot_token,
          bot_username: remote.settings.bot_username || this.data.settings.bot_username,
          admin_id: remote.settings.admin_id || this.data.settings.admin_id
        };
      }

      // 2. Preserve & Merge Users + Wallet Balances (CRITICAL: User balances must NEVER decrease or reset!)
      if (Array.isArray(remote.users) && remote.users.length > 0) {
        for (const remoteUser of remote.users) {
          const localIdx = this.data.users.findIndex(u => u.user_id === remoteUser.user_id);
          if (localIdx === -1) {
            this.data.users.push(remoteUser);
          } else {
            const localUser = this.data.users[localIdx];
            this.data.users[localIdx] = {
              ...localUser,
              ...remoteUser,
              balance: Math.max(localUser.balance || 0, remoteUser.balance || 0),
              spent: Math.max(localUser.spent || 0, remoteUser.spent || 0),
              is_admin: (localUser.is_admin || remoteUser.is_admin || 0) === 1 ? 1 : 0,
              role: localUser.role === 'admin' || remoteUser.role === 'admin' ? 'admin' : (localUser.role || remoteUser.role || 'Regular')
            };
          }
        }
      }

      // 3. Sync Products & Keys (Do NOT resurrect deleted products if local store explicitly initialized)
      if (Array.isArray(remote.products) && remote.products.length > 0) {
        if (this.data.products === undefined || this.data.products === null) {
          console.log(`⚡ Firestore: Restoring ${remote.products.length} products to fresh disk store...`);
          this.data.products = remote.products.map((p: any, idx: number) => ({
            ...p,
            id: p.id !== undefined && p.id !== null ? p.id : (1000 + idx),
            reseller_price: p.reseller_price ?? p.price_inr,
            reseller_price_inr: p.reseller_price_inr ?? p.price_inr
          }));
        }
      }

      if (Array.isArray(remote.productKeys)) {
        if (!this.data.productKeys || this.data.productKeys.length === 0) {
          const validProductIds = new Set(this.data.products.map(p => String(p.id)));
          this.data.productKeys = remote.productKeys.filter((k: any) => validProductIds.has(String(k.product_id)));
        }
      }

      // 4. Merge Orders, Transactions, Tickets, Bots, Emojis, FSM States
      if (Array.isArray(remote.orders) && remote.orders.length > 0) {
        this.data.orders = remote.orders;
      }
      if (Array.isArray(remote.transactions) && remote.transactions.length > 0) {
        this.data.transactions = remote.transactions;
      }
      if (Array.isArray(remote.tickets) && remote.tickets.length > 0) {
        this.data.tickets = remote.tickets;
      }
      if (Array.isArray(remote.bots) && remote.bots.length > 0) {
        this.data.bots = remote.bots;
      }
      if (remote.fsmStates && typeof remote.fsmStates === 'object') {
        this.data.fsmStates = { ...remote.fsmStates, ...this.data.fsmStates };
      }
      if (remote.emojis && typeof remote.emojis === 'object') {
        this.data.emojis = { ...this.data.emojis, ...remote.emojis };
      }

      this.isFirestoreSynced = true;
      // Persist merged state to local disk
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
      await saveStateToFirestore(this.data, false).catch(() => {});
      console.log('⚡ Firestore: Cloud state restored & products synced across deploy.');
    } catch (e: any) {
      console.warn('⚡ Firestore syncWithFirestore notice:', e.message);
    }
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  public logActivity(userId: number, action: string, details: string) {
    const newLog: ActivityLog = {
      id: Date.now(),
      user_id: userId,
      action,
      details,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    this.data.logs.unshift(newLog);
    if (this.data.logs.length > 200) {
      this.data.logs = this.data.logs.slice(0, 200);
    }
    this.saveData();
  }

  public getOrCreateUser(
    tgId: number,
    firstName: string,
    username?: string,
    chatId?: number,
    botId?: string,
    botUsername?: string,
    ownerId?: number,
    ownerEmail?: string
  ): User {
    let user = this.data.users.find(u => u.user_id === tgId);
    const activeBotId = botId || this.data.settings.bot_username || 'default_bot';
    
    if (!user) {
      user = {
        user_id: tgId,
        chat_id: chatId || tgId,
        bot_id: activeBotId,
        bot_ids: [activeBotId],
        bot_username: botUsername || this.data.settings.bot_username || '',
        owner_id: ownerId,
        owner_email: ownerEmail,
        first_name: firstName,
        username: username || firstName.toLowerCase().replace(/[^a-z0-9]/g, ''),
        balance: 0,
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
      this.data.users.push(user);
      this.logActivity(tgId, 'USER_REGISTERED', `New user @${user.username} (UID: ${tgId}, Bot: ${activeBotId}) joined`);
      this.saveData();
    } else {
      let updated = false;
      if (!user.chat_id && chatId) {
        user.chat_id = chatId;
        updated = true;
      }
      if (user.first_name !== firstName) {
        user.first_name = firstName;
        updated = true;
      }
      if (username && user.username !== username) {
        user.username = username;
        updated = true;
      }
      // Associate with bot
      if (botId) {
        if (!user.bot_id) {
          user.bot_id = botId;
          updated = true;
        }
        if (!user.bot_ids) {
          user.bot_ids = [botId];
          updated = true;
        } else if (!user.bot_ids.includes(botId)) {
          user.bot_ids.push(botId);
          updated = true;
        }
      }
      if (botUsername && !user.bot_username) {
        user.bot_username = botUsername;
        updated = true;
      }
      if (ownerId && !user.owner_id) {
        user.owner_id = ownerId;
        updated = true;
      }
      if (ownerEmail && !user.owner_email) {
        user.owner_email = ownerEmail;
        updated = true;
      }
      if (updated) this.saveData();
    }
    return user;
  }

  public getUsersForBot(botId?: string, ownerId?: number, ownerEmail?: string): User[] {
    if (!botId && !ownerId && !ownerEmail) {
      return this.data.users;
    }
    return this.data.users.filter(u => {
      const matchesBot = botId ? (u.bot_id === botId || (u.bot_ids && u.bot_ids.includes(botId))) : true;
      const matchesOwnerId = ownerId ? (u.owner_id === ownerId || u.user_id === ownerId) : true;
      const matchesOwnerEmail = ownerEmail && u.owner_email ? u.owner_email.toLowerCase() === ownerEmail.toLowerCase() : true;
      return matchesBot || (matchesOwnerId && matchesOwnerEmail);
    });
  }

  public getUser(userId: number): User | undefined {
    return this.data.users.find(u => u.user_id === userId);
  }

  public updateUser(userId: number, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex(u => u.user_id === userId);
    if (idx === -1) return null;
    const current = this.data.users[idx];
    this.data.users[idx] = {
      ...current,
      ...updates,
      balance: updates.balance !== undefined ? updates.balance : (current.balance || 0),
      spent: updates.spent !== undefined ? updates.spent : (current.spent || 0)
    };
    this.saveData();
    return this.data.users[idx];
  }

  public adjustUserBalance(userId: number, delta: number, reason = 'Admin Adjustment'): { user: User; oldBalance: number; newBalance: number } {
    let user = this.data.users.find(u => u.user_id === userId);
    if (!user) {
      user = this.getOrCreateUser(userId, `User ${userId}`, `user_${userId}`);
    }
    const oldBalance = user.balance;
    user.balance = Math.max(0, Math.round((user.balance + delta) * 100) / 100);
    if (delta < 0) {
      user.spent = Math.round((user.spent + Math.abs(delta)) * 100) / 100;
    }

    if (!Array.isArray(this.data.transactions)) {
      this.data.transactions = [];
    }

    this.data.transactions.unshift({
      order_id: `ADMIN_TOPUP_${Date.now()}`,
      user_id: userId,
      amount_inr: Math.abs(delta),
      status: 'paid',
      timestamp: Date.now(),
      sender_name: reason || (delta >= 0 ? 'Admin Wallet Top-Up' : 'Admin Balance Adjustment')
    });

    this.logActivity(
      userId,
      'ADMIN_BALANCE_CREDIT',
      `${delta >= 0 ? '+' : ''}₹${delta} (${reason}) - New Balance: ₹${user.balance}`
    );
    this.saveData();
    return { user, oldBalance, newBalance: user.balance };
  }

  public updateSettings(updates: Partial<Settings>): Settings {
    const cleanUpdates: any = { ...updates };
    
    // Strict bidirectional synchronization of maintenance flags
    if ('maintenance_mode' in cleanUpdates || 'bot_status' in cleanUpdates) {
      const mm = cleanUpdates.maintenance_mode;
      const bs = cleanUpdates.bot_status !== undefined ? String(cleanUpdates.bot_status).trim().toUpperCase() : undefined;
      
      const isExplicitlyOff = mm === false || mm === 'false' || mm === 0 || mm === '0' || mm === 'OFF' || mm === 'off' || bs === 'ON' || bs === 'ONLINE';
      const isExplicitlyOn = mm === true || mm === 'true' || mm === 1 || mm === '1' || mm === 'ON' || mm === 'on' || bs === 'OFF' || bs === 'MAINTENANCE' || bs === 'OFFLINE';

      if (isExplicitlyOff) {
        cleanUpdates.maintenance_mode = false;
        cleanUpdates.bot_status = 'ON';
      } else if (isExplicitlyOn) {
        cleanUpdates.maintenance_mode = true;
        cleanUpdates.bot_status = 'OFF';
      }
    }

    this.data.settings = { ...this.data.settings, ...cleanUpdates };
    this.saveData();
    return this.data.settings;
  }

  public updateEmojis(updates: Record<string, string>): Record<string, string> {
    this.data.emojis = { ...this.data.emojis, ...updates };
    this.saveData();
    return this.data.emojis;
  }

  public getProduct(id: number | string): Product | undefined {
    if (id === undefined || id === null) return undefined;
    let cleanStr = String(id).trim();
    // Strip common callback prefixes if accidentally forwarded
    cleanStr = cleanStr.replace(/^(?:prod_|buy_|pnl_|maint_pnl_|maint_)/, '').trim();
    try {
      cleanStr = decodeURIComponent(cleanStr).trim();
    } catch {
      // keep cleanStr
    }

    const numId = Number(cleanStr);
    // 1. Direct ID match
    const byId = this.data.products.find(p => {
      if (String(p.id).trim() === cleanStr) return true;
      if (!isNaN(numId) && Number(p.id) === numId) return true;
      return false;
    });
    if (byId) return byId;

    // 2. Direct name, panel name, or validity matching
    const lower = cleanStr.toLowerCase();
    const byName = this.data.products.find(p => {
      const pName = (p.name || '').trim().toLowerCase();
      const panelName = (p.panel_name || '').trim().toLowerCase();
      const combined = `${panelName} ${pName}`.trim().toLowerCase();
      return pName === lower || panelName === lower || combined === lower;
    });
    if (byName) return byName;

    return undefined;
  }

  public addProduct(product: Product, keys?: string[]): Product {
    const finalId = (product.id !== undefined && product.id !== null)
      ? product.id
      : (Date.now() + Math.floor(Math.random() * 10000));

    const cleanKeys = Array.isArray(keys) ? keys.map(k => k.trim()).filter(Boolean) : [];
    const stockCount = cleanKeys.length > 0 ? cleanKeys.length : (product.stock || 0);

    const finalProduct: Product = {
      ...product,
      id: finalId,
      panel_name: (product.panel_name || product.name || 'VIP PANEL').trim(),
      name: (product.name || 'Plan').trim(),
      category: (product.category || 'ANDROID NON ROOT PANEL').trim(),
      stock: stockCount,
      is_active: product.is_active !== undefined ? (product.is_active === 0 ? 0 : 1) : 1,
      reseller_price: product.reseller_price ?? product.price_inr,
      reseller_price_inr: product.reseller_price_inr ?? product.price_inr
    };

    const existingIdx = this.data.products.findIndex(p => String(p.id) === String(finalId));
    if (existingIdx !== -1) {
      this.data.products[existingIdx] = finalProduct;
    } else {
      this.data.products.push(finalProduct);
    }

    if (cleanKeys.length > 0) {
      for (const cleanK of cleanKeys) {
        this.data.productKeys.unshift({
          id: Date.now() + Math.floor(Math.random() * 10000),
          product_id: finalProduct.id,
          key_text: cleanK,
          is_used: 0
        });
      }
    }

    syncProductToFirestore(finalProduct).catch(() => {});
    
    // Also sync into target bot's products array if bot_id is present
    if (finalProduct.bot_id && Array.isArray(this.data.bots)) {
      const targetBot = this.data.bots.find(b => b.id === finalProduct.bot_id);
      if (targetBot) {
        if (!Array.isArray(targetBot.products)) targetBot.products = [];
        const bIdx = targetBot.products.findIndex(p => String(p.id) === String(finalId));
        if (bIdx >= 0) targetBot.products[bIdx] = finalProduct;
        else targetBot.products.unshift(finalProduct);
      }
    }

    this.saveData(undefined, true);
    return finalProduct;
  }

  public getBotProducts(botId?: string): Product[] {
    if (!botId) return this.data.products;
    const bot = this.data.bots?.find(b => b.id === botId);
    if (bot && Array.isArray(bot.products) && bot.products.length > 0) {
      return bot.products;
    }
    return this.data.products.filter(p => !p.bot_id || p.bot_id === botId);
  }

  public addProductsBatch(products: Product[], keysMap?: Record<string, string[]>): Product[] {
    const addedProducts: Product[] = [];
    if (!Array.isArray(products) || products.length === 0) return addedProducts;

    for (let i = 0; i < products.length; i++) {
      const prod = products[i];
      const finalId = (prod.id !== undefined && prod.id !== null)
        ? prod.id
        : (Date.now() + i + Math.floor(Math.random() * 10000));

      const rawKeys = keysMap?.[String(prod.id)] || keysMap?.[String(finalId)] || keysMap?.[prod.name] || (prod as any).keys || [];
      const cleanKeys = Array.isArray(rawKeys) ? rawKeys.map(k => String(k).trim()).filter(Boolean) : [];
      const stockCount = cleanKeys.length > 0 ? cleanKeys.length : (prod.stock || 0);

      const finalProduct: Product = {
        ...prod,
        id: finalId,
        panel_name: (prod.panel_name || prod.name || 'VIP PANEL').trim(),
        name: (prod.name || 'Plan').trim(),
        category: (prod.category || 'ANDROID NON ROOT PANEL').trim(),
        stock: stockCount,
        is_active: prod.is_active !== undefined ? (prod.is_active === 0 ? 0 : 1) : 1,
        reseller_price: prod.reseller_price ?? prod.price_inr,
        reseller_price_inr: prod.reseller_price_inr ?? prod.price_inr
      };

      const existingIdx = this.data.products.findIndex(p => String(p.id) === String(finalId));
      if (existingIdx !== -1) {
        this.data.products[existingIdx] = finalProduct;
      } else {
        this.data.products.push(finalProduct);
      }

      if (cleanKeys.length > 0) {
        for (const cleanK of cleanKeys) {
          this.data.productKeys.unshift({
            id: Date.now() + i + Math.floor(Math.random() * 10000),
            product_id: finalProduct.id,
            key_text: cleanK,
            is_used: 0
          });
        }
      }

      syncProductToFirestore(finalProduct).catch(() => {});
      addedProducts.push(finalProduct);
    }

    this.saveData(undefined, true);
    return addedProducts;
  }

  public updateProduct(id: number | string, updates: Partial<Product>): Product | null {
    const idx = this.data.products.findIndex(p => String(p.id) === String(id));
    if (idx === -1) return null;
    this.data.products[idx] = { ...this.data.products[idx], ...updates };
    syncProductToFirestore(this.data.products[idx]).catch(() => {});
    this.saveData(undefined, true);
    return this.data.products[idx];
  }

  public updatePanel(category: string, panelName: string, updates: Partial<Product>): number {
    let updatedCount = 0;
    this.data.products = this.data.products.map(p => {
      const matchCat = matchCategoryFlexible(p.category, category);
      const matchName = matchNameFlexible(p.panel_name || p.name, panelName);
      if (matchCat && matchName) {
        updatedCount++;
        const updated = { ...p, ...updates };
        syncProductToFirestore(updated).catch(() => {});
        return updated;
      }
      return p;
    });
    this.saveData(undefined, true);
    return updatedCount;
  }

  public setPanelMaintenance(category: string, panelName: string, isMaintenance: boolean, note?: string): number {
    const maintVal = isMaintenance ? 1 : 0;
    return this.updatePanel(category, panelName, {
      is_maintenance: maintVal,
      ...(note !== undefined ? { maintenance_note: note } : {})
    });
  }

  public deleteProduct(id: number | string): boolean {
    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter(p => String(p.id) !== String(id));
    this.data.productKeys = this.data.productKeys.filter(k => String(k.product_id) !== String(id));
    deleteProductFromFirestore(id).catch(() => {});
    this.saveData(undefined, true);
    return this.data.products.length < initialLen;
  }

  public deleteProducts(ids: (number | string)[]): number {
    const strIds = new Set(ids.map(id => String(id)));
    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter(p => !strIds.has(String(p.id)));
    this.data.productKeys = this.data.productKeys.filter(k => !strIds.has(String(k.product_id)));
    deleteProductsFromFirestore(ids).catch(() => {});
    this.saveData(undefined, true);
    return initialLen - this.data.products.length;
  }

  public deletePanel(category: string, panelName: string): number {
    const initialLen = this.data.products.length;
    const deletedProductIds = new Set<string>();
    
    const targetCat = (category || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const targetName = (panelName || '').trim().toLowerCase();
    const targetNameNorm = targetName.replace(/[^a-z0-9]/g, '');

    this.data.products = this.data.products.filter(p => {
      const pCat = (p.category || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const pName = (p.panel_name || p.name || '').trim().toLowerCase();
      const pNameNorm = pName.replace(/[^a-z0-9]/g, '');

      const matchCat = !targetCat || pCat === targetCat || matchCategoryFlexible(p.category, category);
      const matchName = pName === targetName || (Boolean(pNameNorm) && pNameNorm === targetNameNorm);

      if (matchCat && matchName) {
        deletedProductIds.add(String(p.id));
        return false;
      }
      return true;
    });

    this.data.productKeys = this.data.productKeys.filter(k => !deletedProductIds.has(String(k.product_id)));
    deleteProductsFromFirestore(Array.from(deletedProductIds)).catch(() => {});
    this.saveData(undefined, true);
    return initialLen - this.data.products.length;
  }

  public injectProductKeys(productId: number, keys: string[]): number {
    let added = 0;
    if (Array.isArray(keys)) {
      for (const k of keys) {
        const cleanK = k.trim();
        if (cleanK) {
          this.data.productKeys.unshift({
            id: Date.now() + Math.floor(Math.random() * 10000) + added,
            product_id: productId,
            key_text: cleanK,
            is_used: 0
          });
          added++;
        }
      }
      const prod = this.data.products.find(p => String(p.id) === String(productId));
      if (prod) {
        prod.stock = (prod.stock || 0) + added;
      }
      this.saveData();
    }
    return added;
  }

  public deleteProductKey(keyId: number): boolean {
    const key = this.data.productKeys.find(k => k.id === keyId);
    if (!key) return false;
    this.data.productKeys = this.data.productKeys.filter(k => k.id !== keyId);
    if (!key.is_used) {
      const prod = this.data.products.find(p => String(p.id) === String(key.product_id));
      if (prod) {
        prod.stock = Math.max(0, (prod.stock || 0) - 1);
      }
    }
    this.saveData();
    return true;
  }

  public addTransaction(transaction: Transaction): Transaction {
    this.data.transactions = [transaction, ...this.data.transactions.filter(t => t.order_id !== transaction.order_id)];
    this.saveData();
    return transaction;
  }

  public setFsmState(userId: number, state: string, data?: any) {
    if (state === 'idle') {
      delete this.data.fsmStates[userId];
    } else {
      this.data.fsmStates[userId] = { state, data };
    }
    this.saveData();
  }

  public getFsmState(userId: number): { state: string; data?: any } | undefined {
    return this.data.fsmStates[userId];
  }

  public getBots(): BotInstance[] {
    if (!Array.isArray(this.data.bots)) {
      this.data.bots = [];
    }
    return this.data.bots;
  }

  public saveBot(bot: BotInstance): BotInstance {
    if (!Array.isArray(this.data.bots)) {
      this.data.bots = [];
    }
    const idx = this.data.bots.findIndex(b => b.id === bot.id);
    if (idx >= 0) {
      this.data.bots[idx] = { ...this.data.bots[idx], ...bot };
    } else {
      this.data.bots.unshift(bot);
    }
    this.saveData();
    return bot;
  }

  public updateBot(botId: string, updates: Partial<BotInstance>): BotInstance | null {
    if (!Array.isArray(this.data.bots)) {
      this.data.bots = [];
    }
    const idx = this.data.bots.findIndex(b => b.id === botId);
    if (idx === -1) return null;
    this.data.bots[idx] = { ...this.data.bots[idx], ...updates };
    this.saveData();
    return this.data.bots[idx];
  }

  public deleteBot(botId: string): boolean {
    if (!Array.isArray(this.data.bots)) {
      this.data.bots = [];
      return false;
    }
    this.data.bots = this.data.bots.filter(b => b.id !== botId);
    this.saveData();
    return true;
  }

  public resetBots(): boolean {
    this.data.bots = [];
    this.saveData();
    return true;
  }

  public resetToDefaults() {
    const prevToken = this.data.settings?.bot_token || process.env.TELEGRAM_BOT_TOKEN || DEFAULT_SETTINGS.bot_token;
    const prevUsername = this.data.settings?.bot_username || DEFAULT_SETTINGS.bot_username;
    const prevAdminId = this.data.settings?.admin_id || (process.env.TELEGRAM_ADMIN_ID ? Number(process.env.TELEGRAM_ADMIN_ID) : DEFAULT_SETTINGS.admin_id);

    this.data = {
      users: INITIAL_USERS,
      products: INITIAL_PRODUCTS,
      productKeys: INITIAL_PRODUCT_KEYS,
      orders: [],
      tickets: [],
      coupons: INITIAL_COUPONS,
      redeemed: [],
      transactions: [],
      logs: [],
      settings: {
        ...DEFAULT_SETTINGS,
        bot_token: prevToken,
        bot_username: prevUsername,
        admin_id: prevAdminId
      },
      emojis: DEFAULT_EMOJIS,
      fsmStates: {},
      bots: []
    };
    this.saveData(undefined, true);
  }
}

export const dbStore = new DatabaseStore();
