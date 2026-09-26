export type AccountType = 'Regular' | 'Reseller';

export interface PaymentGatewayConfig {
  upi_id: string;
  merchant_name: string;
  qr_image_url: string;
  gateway_provider: 'upi_manual' | 'fampay' | 'famgateway' | 'paytm_business' | 'crypto_usdt' | 'custom_webhook';
  api_key: string;
  secret_key: string;
  verify_endpoint: string;
  usdt_trc20_address: string;
  usdt_to_inr_rate: number;
  auto_approve: boolean;
  min_deposit_inr?: number;
  max_deposit_inr?: number;
  payment_qr_dark_color?: string;
  payment_qr_light_color?: string;
}

export interface ResellerApiConfig {
  provider_name: string;
  api_url: string;
  api_key: string;
  master_key: string;
  status: 'ON' | 'OFF';
  auto_fallback: boolean;
  sync_balance: number;
}

export interface BotInstance {
  id: string;
  owner_id: number;
  owner_email?: string;
  admin_id?: number;
  admin_chat_id?: number;
  name: string;
  username: string;
  bot_token: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  created_at: string;
  description: string;
  theme_color: string;
  payment_gateway: PaymentGatewayConfig;
  reseller_api: ResellerApiConfig;
  products: Product[];
  productKeys: ProductKey[];
  settings: Settings;
  stats: {
    total_orders: number;
    total_revenue: number;
    total_users: number;
    total_keys_delivered: number;
  };
}

export interface ReferralRecord {
  id: string;
  referrer_id: number;
  referrer_name?: string;
  referee_id: number;
  referee_name: string;
  reward_amount: number;
  commission_earned: number;
  created_at: string;
  status: 'completed' | 'pending';
}

export interface User {
  user_id: number;
  chat_id?: number;
  bot_id?: string;        // ID of the bot where user was registered/interacted
  bot_ids?: string[];     // All bot IDs user is associated with
  bot_username?: string;  // Username of the bot e.g. @KalamFFPanelBot
  owner_id?: number;      // Store owner user ID
  owner_email?: string;   // Store owner email
  phone?: string;
  email?: string;
  password?: string;
  avatar_url?: string;
  auth_provider?: 'google' | 'email' | 'telegram';
  first_name: string;
  username: string;
  balance: number;
  account_type: AccountType;
  orders_count: number;
  spent: number;
  spin_count?: number;
  last_spin?: string;
  joined_date: string;
  last_login?: string;
  login_at?: string;
  is_reseller: number; // 0 or 1
  reseller_since?: string;
  total_saved: number;
  is_banned: number; // 0 or 1
  warnings: number;
  is_vip?: number;
  vip_since?: string;
  referral_code?: string;
  referred_by?: number;
  referral_count?: number;
  referral_earnings?: number;
  is_admin?: number;
  role?: string;
}

export interface Product {
  id: number;
  bot_id?: string; // ID of the bot this product belongs to
  owner_id?: number; // User ID of the bot owner
  owner_email?: string; // Email of the bot owner
  category: string; // 'ANDROID NON ROOT PANEL' | 'ANDROID ROOT PANEL' | 'PC PANEL' | string
  panel_name: string; // e.g., 'MST PANEL', 'DRIP PANEL', 'VIP ZERO'
  name: string; // Package/duration e.g., '24 Hours', '7 Days', '1 Month', 'Lifetime'
  duration?: string;
  price_inr: number;
  reseller_price: number;
  reseller_price_inr?: number;
  stock?: number;
  apk_link: string;
  validity: string;
  device_limit: string;
  is_active: number; // 0 or 1
  delivery_mode?: 'manual_vault' | 'api_provider' | 'hybrid';
  provider_product_id?: string; // Exact Product PID on provider
  provider_duration?: string; // Duration string e.g. '1 Hours', '3 Hours', '1 Day', '7 Days', '30 Days'
  requires_android_id?: boolean; // Required ONLY for Device-Bound / V1 Products
  is_maintenance?: boolean | number; // Individual maintenance mode (0 or 1, false or true)
  maintenance_note?: string; // Optional maintenance reason / update note
}

export interface ProductKey {
  id: number | string;
  product_id: number;
  key_text?: string;
  key_string?: string;
  is_used: number; // 0 or 1
  created_at?: string;
}

export interface Order {
  id: number;
  order_id?: string;
  user_id: number;
  product_id?: number | string;
  product_name: string;
  price_paid: number;
  price_inr?: number;
  delivered_key: string;
  android_id?: string;
  purchase_date: string;
}

export interface Ticket {
  id: number;
  user_id: number;
  message: string;
  status: 'Open' | 'Closed';
  created_at: string;
  admin_reply?: string;
  replied_at?: string;
}

export interface Coupon {
  code: string;
  amount: number;
  uses_left: number;
  total_uses: number;
}

export interface RedeemedCoupon {
  user_id: number;
  code: string;
  redeemed_at: string;
}

export interface Transaction {
  order_id: string;
  user_id: number;
  amount_inr: number;
  status: 'pending' | 'paid' | 'expired' | 'failed';
  timestamp: number;
  qr_url?: string;
  upi_id?: string;
  expires_at?: number;
  utr?: string;
  sender_name?: string;
  product_id?: number | string;
  user_price?: number;
}

export interface CryptoTxn {
  txid: string;
  user_id: number;
  amount_usdt: number;
  timestamp: number;
}

export interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  details: string;
  timestamp: string;
}

export interface ApiLog {
  id: string;
  timestamp: string;
  service: 'TELEGRAM' | 'FAMGATEWAY' | 'RESELLER_API' | 'WEBHOOK' | 'DATABASE' | string;
  endpoint: string;
  method: 'GET' | 'POST' | 'POLL' | 'WEBHOOK' | string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  http_code?: number;
  duration_ms?: number;
  message: string;
  error?: string;
  payload?: any;
}

export interface FailedTransaction {
  order_id: string;
  user_id: number;
  amount_inr: number;
  reason: string;
  error_details?: string;
  timestamp: number;
  status: 'failed' | 'expired' | 'pending' | 'paid' | string;
}

export interface SystemHealthData {
  summary: {
    telegramPing: { timestamp: number; latencyMs: number; ok: boolean; error?: string };
    gatewayPing: { timestamp: number; latencyMs: number; ok: boolean; statusText?: string; error?: string };
    totalLogs: number;
    errorLogsCount: number;
    warningLogsCount: number;
    failedTransactionsCount: number;
  };
  telegram: {
    isRunning: boolean;
    botName?: string;
    username?: string;
    tokenConfigured: boolean;
  };
  famgateway: {
    configured: boolean;
    upiId: string;
    payeeName: string;
    apiKeyMasked?: string;
  };
  resellerApi: {
    configured: boolean;
    apiUrl?: string;
    hasMasterKey: boolean;
  };
  logs: ApiLog[];
  failedTransactions: FailedTransaction[];
}

export interface Settings {
  bot_token: string;
  bot_username: string;
  admin_id: number;
  admin_contact: string;
  reseller_system_status: 'ON' | 'OFF';
  referral_system_status?: 'ON' | 'OFF';
  referral_reward_inr?: number;
  referral_commission_percent?: number;
  referral_referee_bonus_inr?: number;
  bot_status: 'ON' | 'OFF';
  maintenance_mode?: boolean;
  maintenance_message?: string;
  maintenance_reason?: string;
  how_to_video: string;
  fampay_api_key: string;
  fampay_upi_id: string;
  fampay_qr_url: string;
  fampay_verify_url: string;
  famgateway_api_key?: string;
  famgateway_redirect_url?: string;
  bantibhaiya_api_url?: string;
  bantibhaiya_api_key?: string;
  bantibhaiya_master_key?: string;
  bantibhaiya_status?: 'ON' | 'OFF';
  provider_auto_fallback?: boolean;
  binance_api: string;
  binance_secret: string;
  binance_address: string;
  vip_status?: 'ON' | 'OFF';
  reseller_setup_fee: number;
  reseller_min_balance: number;
  support_telegram: string;
  support_whatsapp: string;
  apk_channel_link?: string;
  official_channel_link?: string;
  ui_start_menu: string;
  ui_referral_menu?: string;
  ui_vip_menu?: string;
  ui_add_balance_menu: string;
  usdt_to_inr: number;
  vip_discount_percentage?: number;
  vip_price_inr?: number;
  min_deposit_inr?: number;
  max_deposit_inr?: number;
  payment_qr_logo_url?: string;
  payment_qr_dark_color?: string;
  payment_qr_light_color?: string;
  [key: string]: any;
}

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
  icon_custom_emoji_id?: string;
  style?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  sender_name?: string;
  sender_id?: number;
  text?: string;
  timestamp: string;
  keyboard?: InlineKeyboardButton[][];
  is_loading?: boolean;
  loading_text?: string;
  loading_step?: number;
  media_type?: 'sticker' | 'qr_image' | 'video' | 'document' | 'photo';
  media_url?: string;
  is_broadcast?: boolean;
  order_info?: {
    order_id: string;
    amount: number;
    upi_id: string;
    expires_at: number;
    qr_url?: string;
  };
}

export type ViewTab = 'dashboard' | 'my_bots' | 'create_bot' | 'admin' | 'auth' | 'gateways' | 'reseller_api' | 'database' | 'code' | 'logs';

export type AdminTab = 'overview' | 'appinstall' | 'bots' | 'health' | 'products' | 'purchases' | 'users' | 'referrals' | 'resellers' | 'broadcast' | 'tickets' | 'support' | 'coupons' | 'gateways' | 'emojis' | 'settings' | 'texts' | 'logs' | 'code' | 'botcommands' | 'bot_engine';

export interface ProviderBalanceState {
  success: boolean;
  balance: number;
  currency: string;
  formatted: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'UNCONFIGURED';
  latencyMs: number;
  lastChecked: string;
  message: string;
  apiUrl?: string;
  apiKeyMasked?: string;
  raw?: any;
  error?: string;
}

