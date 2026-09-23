import fs from 'fs';
import path from 'path';
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

        return {
          users: Array.isArray(parsed.users) ? parsed.users : INITIAL_USERS,
          products: Array.isArray(parsed.products) ? parsed.products : INITIAL_PRODUCTS,
          productKeys: Array.isArray(parsed.productKeys) ? parsed.productKeys : INITIAL_PRODUCT_KEYS,
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
          bots: Array.isArray(parsed.bots) ? parsed.bots : []
        };
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

  public saveData(dataToSave?: DatabaseSchema) {
    try {
      this.ensureDataDir();
      const target = dataToSave || this.data;
      fs.writeFileSync(DB_FILE, JSON.stringify(target, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database.json:', err);
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

  public getOrCreateUser(tgId: number, firstName: string, username?: string, chatId?: number): User {
    let user = this.data.users.find(u => u.user_id === tgId);
    if (!user) {
      user = {
        user_id: tgId,
        chat_id: chatId || tgId,
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
      this.logActivity(tgId, 'USER_REGISTERED', `New user @${user.username} (UID: ${tgId}, Chat: ${chatId || tgId}) joined`);
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
      if (updated) this.saveData();
    }
    return user;
  }

  public getUser(userId: number): User | undefined {
    return this.data.users.find(u => u.user_id === userId);
  }

  public updateUser(userId: number, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex(u => u.user_id === userId);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
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

  public getProduct(id: number): Product | undefined {
    return this.data.products.find(p => p.id === id);
  }

  public addProduct(product: Product, keys?: string[]): Product {
    const newId = this.data.products.length > 0 ? Math.max(...this.data.products.map(p => p.id)) + 1 : 1;
    const finalProduct: Product = {
      ...product,
      id: product.id || newId
    };
    this.data.products.unshift(finalProduct);

    if (Array.isArray(keys) && keys.length > 0) {
      for (const k of keys) {
        const cleanK = k.trim();
        if (cleanK) {
          this.data.productKeys.unshift({
            id: Date.now() + Math.floor(Math.random() * 10000),
            product_id: finalProduct.id,
            key_text: cleanK,
            is_used: 0
          });
        }
      }
    }

    this.saveData();
    return finalProduct;
  }

  public updateProduct(id: number, updates: Partial<Product>): Product | null {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.data.products[idx] = { ...this.data.products[idx], ...updates };
    this.saveData();
    return this.data.products[idx];
  }

  public deleteProduct(id: number): boolean {
    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter(p => p.id !== id);
    this.data.productKeys = this.data.productKeys.filter(k => k.product_id !== id);
    this.saveData();
    return this.data.products.length < initialLen;
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
      const prod = this.data.products.find(p => p.id === productId);
      if (prod) {
        prod.stock += added;
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
      const prod = this.data.products.find(p => p.id === key.product_id);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - 1);
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
        bot_token: process.env.TELEGRAM_BOT_TOKEN || DEFAULT_SETTINGS.bot_token,
        admin_id: process.env.TELEGRAM_ADMIN_ID ? Number(process.env.TELEGRAM_ADMIN_ID) : DEFAULT_SETTINGS.admin_id
      },
      emojis: DEFAULT_EMOJIS,
      fsmStates: {},
      bots: []
    };
    this.saveData();
  }
}

export const dbStore = new DatabaseStore();
