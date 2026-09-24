import { Product, User } from '../types';

const OFFLINE_PRODUCTS_KEY = 'kalam_offline_products_v2';
const OFFLINE_USER_BALANCES_KEY = 'kalam_offline_balances_v2';
const OFFLINE_SYNC_TIMESTAMP_KEY = 'kalam_offline_last_sync';

export interface CachedBalance {
  userId: number;
  balance: number;
  lastUpdated: string;
}

export const offlineStorage = {
  saveProducts: (products: Product[]) => {
    try {
      if (Array.isArray(products) && products.length > 0) {
        localStorage.setItem(OFFLINE_PRODUCTS_KEY, JSON.stringify(products));
        localStorage.setItem(OFFLINE_SYNC_TIMESTAMP_KEY, new Date().toISOString());
      }
    } catch (e) {
      console.warn('[OfflineStorage] Failed to save products cache', e);
    }
  },

  getProducts: (): Product[] => {
    try {
      const data = localStorage.getItem(OFFLINE_PRODUCTS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('[OfflineStorage] Failed to retrieve products cache', e);
    }
    return [];
  },

  saveUserBalances: (users: User[]) => {
    try {
      if (Array.isArray(users) && users.length > 0) {
        const balances: Record<number, number> = {};
        users.forEach(u => {
          balances[u.user_id] = u.balance;
        });
        localStorage.setItem(OFFLINE_USER_BALANCES_KEY, JSON.stringify(balances));
      }
    } catch (e) {
      console.warn('[OfflineStorage] Failed to save user balances cache', e);
    }
  },

  getUserBalance: (userId: number): number | null => {
    try {
      const data = localStorage.getItem(OFFLINE_USER_BALANCES_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed[userId] !== undefined) {
          return Number(parsed[userId]);
        }
      }
    } catch (e) {
      console.warn('[OfflineStorage] Failed to retrieve user balance', e);
    }
    return null;
  },

  getLastSyncTime: (): string | null => {
    return localStorage.getItem(OFFLINE_SYNC_TIMESTAMP_KEY);
  }
};
