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
  Settings
} from '../src/types';
import {
  DEFAULT_EMOJIS,
  DEFAULT_SETTINGS,
  INITIAL_COUPONS,
  INITIAL_PRODUCTS,
  INITIAL_PRODUCT_KEYS,
  INITIAL_USERS
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
          users: parsed.users || INITIAL_USERS,
          products: parsed.products || INITIAL_PRODUCTS,
          productKeys: parsed.productKeys || INITIAL_PRODUCT_KEYS,
          orders: parsed.orders || [],
          tickets: parsed.tickets || [],
          coupons: parsed.coupons || INITIAL_COUPONS,
          redeemed: parsed.redeemed || [],
          transactions: parsed.transactions || [],
          logs: parsed.logs || [],
          settings: {
            ...DEFAULT_SETTINGS,
            ...(parsed.settings || {}),
            bot_token: process.env.TELEGRAM_BOT_TOKEN || parsed.settings?.bot_token || DEFAULT_SETTINGS.bot_token,
            admin_id: process.env.TELEGRAM_ADMIN_ID ? Number(process.env.TELEGRAM_ADMIN_ID) : (parsed.settings?.admin_id || DEFAULT_SETTINGS.admin_id)
          },
          emojis: parsed.emojis || DEFAULT_EMOJIS,
          fsmStates: parsed.fsmStates || {}
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
      fsmStates: {}
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

  public getOrCreateUser(tgId: number, firstName: string, username?: string): User {
    let user = this.data.users.find(u => u.user_id === tgId);
    if (!user) {
      user = {
        user_id: tgId,
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
      this.logActivity(tgId, 'USER_REGISTERED', `New user @${user.username} joined on Telegram`);
      this.saveData();
    } else {
      let updated = false;
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

  public updateSettings(updates: Partial<Settings>): Settings {
    this.data.settings = { ...this.data.settings, ...updates };
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
      fsmStates: {}
    };
    this.saveData();
  }
}

export const dbStore = new DatabaseStore();
