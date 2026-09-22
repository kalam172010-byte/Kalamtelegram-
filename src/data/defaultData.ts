import { Product, ProductKey, User, Coupon, Settings, BotInstance, PaymentGatewayConfig, ResellerApiConfig } from '../types';

export const FIXED_CATEGORIES = [
  "ANDROID NON ROOT PANEL",
  "ANDROID ROOT PANEL",
  "PC PANEL"
];

export const DEFAULT_EMOJIS: Record<string, string> = {
  product_store: '6163205892834598715',
  profile: '5258011929993026890',
  add_balance: '5985630530111020079',
  history: '6032594876506312598',
  support: '5967280668885913944',
  back: '5877536313623711363',
  upi: '5807750375033278838',
  reseller: '5886505193180239900',
  tutorial: '6005986106703613755',
  telegram: '5875465628285931233',
  whatsapp: '5954224165874569584',
  welcome: '5994502837327892086',
  vip: '5206607081334906820',
  category_android_non_root: '6161172706856282588',
  category_android_root: '6161449831031118974',
  category_pc: '5350554349074391003',
  grid_id: '5474625972751837256',
  name: '5215399540814781035',
  account_level: '6129584162992034014',
  regular_user: '5904630315946611415',
  wallet: '6210859306602995217',
  current_balance: '5316711376876485361',
  global_stats: '6161437856662298090',
  total_orders: '6160968017304888311',
  total_spent: '5197503331215361533',
  joined_grid: '5433614043006903194',
  info_icon: '6037421444789440735',
  check_icon: '6161241250239356403',
  checkbox_icon: '6161437856662298090',
  shield_icon: '6086672466132865380',
  money_icon: '5890848474563352982',
  redeem_icon: '5377624166436445368',
  wallet_left: '6210859306602995217',
  wallet_right: '5305699699204837855',
  point_down: '6161302621027049305',
};

export const UI_TEXTS = {
  start_menu: `✨ <b>KALAM FF PANEL?</b>

{product_store} 𝗣𝗥𝗢𝗗𝗨𝗖𝗧 𝗦𝘁𝗼𝗿𝗲 : 𝗮𝗹𝗹 𝗸𝗲𝘆𝘀 𝗣𝘂𝗿𝗰𝗵𝗮𝘀𝗲  & 𝗶𝗻𝘀𝘁𝗮𝗻𝘁𝗹𝘆 𝗱𝗲𝗹𝗶𝘃𝗲𝗿𝘆
{profile} 𝗠𝘆 𝗽𝗿𝗼𝗳𝗶𝗹𝗲 : 𝗰𝗵𝗲𝗰𝗸 𝘆𝗼𝘂𝗿 𝗮𝗰𝗰𝗼𝘂𝗻𝘁 𝗶𝗻𝗳𝗼𝗿𝗺𝗮𝘁𝗶𝗼𝗻
{add_balance} 𝗔𝗱𝗱 𝗯𝗮𝗹𝗮𝗻𝗰𝗲 : 𝗱𝗲𝗽𝗼𝘀𝗶𝘁𝗲 𝗯𝗮𝗹𝗮𝗻𝗰𝗲 & 𝘀𝗲𝗰𝘂𝗿𝗲 𝘀𝗲𝗿𝘃𝗶𝗰𝗲
{history} 𝗔𝗹𝗹 𝗵𝗶𝘀𝘁𝗼𝗿𝘆 : 𝗰𝗵𝗲𝗰𝗸 𝗮𝗹𝗹 𝗽𝘂𝗿𝗰𝗵𝗮𝘀𝗲 𝗵𝗶𝘀𝘁𝗼𝗿𝘆
{tutorial} 𝗧𝘂𝘁𝗼𝗿𝗶𝗮𝗹 : 𝘃𝗶𝗲𝘄 𝘁𝘂𝘁𝗼𝗿𝗶𝗮𝗹 & 𝘄𝗼𝗿𝗸 𝘁𝗵𝗶𝘀 𝗯𝗼𝘁
{support} 𝗦𝘂𝗽𝗽𝗼𝗿𝘁 : 𝗯𝗼𝘁 𝗽𝗿𝗼𝗯𝗹𝗲𝗺 𝘀𝗼𝗹𝘃𝗲𝗱 𝗳𝗼𝗿 𝘀𝘂𝗽𝗽𝗼𝗿𝘁 𝗮𝗱𝗺𝗶𝗻`,

  vip_menu: `🌟 <b><u>VIP MEMBERSHIP CLUB</u></b> 🌟

Unlock premium benefits and permanent discounts!

💎 <b>VIP Benefits:</b>
• Flat 15% off on ALL products (Stacks with Reseller!)
• Priority Support
• Exclusive VIP-only giveaways

💳 <b>VIP Price:</b> ₹299.00 (Lifetime)
👤 <b>Your Status:</b> {vip_status}`,

  add_balance_menu: `{add_balance} <b>FAMGATEWAY.IN ADD BALANCE</b> {info_icon}

{info_icon} Instant, automated UPI wallet recharge powered by FamGateway.in. {check_icon}

┣ {upi} UPI (PhonePe, GPay, Paytm, FamPay & BHIM) {checkbox_icon}

{shield_icon} Payments are verified & credited automatically in real-time. {check_icon}`
};

export const DEFAULT_SETTINGS: Settings = {
  bot_token: '7928194012:AAH9bK8xP_exampleTokenKalamBot',
  bot_username: 'KalamFFPanelBot',
  admin_id: 12846461,
  admin_contact: '@kalam172010',
  reseller_system_status: 'ON',
  bot_status: 'ON',
  how_to_video: 'https://youtube.com/watch?v=kalam_panel_tutorial',
  fampay_api_key: 'FP_LIVE_99481a8c3d11ef420b991',
  famgateway_api_key: '',
  famgateway_redirect_url: 'https://t.me/KalamFFPanelBot',
  bantibhaiya_api_url: 'https://bantibhaiya.to/api/reseller_v1.php',
  bantibhaiya_api_key: '87224c074a021676364829b5b3f0686e',
  bantibhaiya_master_key: 'a7f3e8b2c9d1f4a6b8c2d5e9f1a3b6c8',
  bantibhaiya_status: 'ON',
  provider_auto_fallback: true,
  fampay_upi_id: 'kalampanel@fam',
  fampay_qr_url: 'https://fampay.anujbots.xyz/qr.php',
  fampay_verify_url: 'https://fampay.anujbots.xyz/verify.php',
  binance_api: 'BN_API_8921849129034',
  binance_secret: 'BN_SEC_991823901923',
  binance_address: 'TXu8KalamUSDT9912083TronNetwork',
  vip_status: 'ON',
  reseller_setup_fee: 200.0,
  reseller_min_balance: 500.0,
  support_telegram: 'https://t.me/KalamPanelSupport',
  support_whatsapp: 'https://wa.me/919876543210',
  apk_channel_link: 'https://t.me/KalamFFPanelAPKs',
  official_channel_link: 'https://t.me/KalamFFPanelChannel',
  ui_start_menu: UI_TEXTS.start_menu,
  ui_vip_menu: UI_TEXTS.vip_menu,
  ui_add_balance_menu: UI_TEXTS.add_balance_menu,
  usdt_to_inr: 90.0,
  vip_discount_percentage: 15.0,
  vip_price_inr: 299.0,
  min_deposit_inr: 10.0,
  max_deposit_inr: 50000.0,
};

export const INITIAL_USERS: User[] = [
  {
    user_id: 12846461,
    chat_id: 12846461,
    phone: '+91 98765 43210',
    email: 'kalam172010@gmail.com',
    password: 'password123',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    auth_provider: 'google',
    first_name: 'Kalam (Admin)',
    username: 'kalam172010',
    balance: 0.0,
    account_type: 'VIP',
    orders_count: 0,
    spent: 0.0,
    joined_date: '2026-01-10 10:00:00',
    is_reseller: 1,
    reseller_since: '2026-01-15',
    total_saved: 0.0,
    is_banned: 0,
    warnings: 0,
    is_vip: 1,
    vip_since: '2026-01-12'
  }
];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_PRODUCT_KEYS: ProductKey[] = [];

export const INITIAL_COUPONS: Coupon[] = [
  { code: 'KALAM50', amount: 50.0, uses_left: 45, total_uses: 50 },
  { code: 'WELCOME100', amount: 100.0, uses_left: 18, total_uses: 25 },
  { code: 'VIPBONUS', amount: 200.0, uses_left: 8, total_uses: 10 }
];

export const DEFAULT_GATEWAY_CONFIG: PaymentGatewayConfig = {
  upi_id: 'kalampanel@fam',
  merchant_name: 'Kalam FF Store (FamGateway)',
  qr_image_url: 'https://famgateway.in/api/qr.php',
  gateway_provider: 'famgateway',
  api_key: '',
  secret_key: '',
  verify_endpoint: 'https://famgateway.in/api/checkout-status.php',
  usdt_trc20_address: 'TXu8KalamUSDT9912083TronNetwork',
  usdt_to_inr_rate: 90.0,
  auto_approve: true,
  min_deposit_inr: 10.0,
  max_deposit_inr: 50000.0
};

export const DEFAULT_RESELLER_CONFIG: ResellerApiConfig = {
  provider_name: 'Bantibhaiya / Kalam Official Reseller API',
  api_url: 'https://bantibhaiya.to/api/reseller_v1.php',
  api_key: '87224c074a021676364829b5b3f0686e',
  master_key: 'a7f3e8b2c9d1f4a6b8c2d5e9f1a3b6c8',
  status: 'ON',
  auto_fallback: true,
  sync_balance: 14250.0
};

export const INITIAL_BOTS: BotInstance[] = [
  {
    id: 'bot_kalam_main',
    owner_id: 12846461,
    owner_email: 'kalam172010@gmail.com',
    name: 'Kalam FF Panel Official Bot',
    username: 'KalamFFPanelBot',
    bot_token: '7928194012:AAH9bK8xP_exampleTokenKalamBot',
    status: 'ONLINE',
    created_at: '2026-01-15 10:30:00',
    description: 'Main flagship Free Fire Panel & Mod Key Store bot with automated UPI & Provider API sync.',
    theme_color: '#06b6d4',
    payment_gateway: DEFAULT_GATEWAY_CONFIG,
    reseller_api: DEFAULT_RESELLER_CONFIG,
    products: [],
    productKeys: [],
    settings: DEFAULT_SETTINGS,
    stats: {
      total_orders: 0,
      total_revenue: 0.0,
      total_users: 1,
      total_keys_delivered: 0
    }
  },
  {
    id: 'bot_vip_reseller',
    owner_id: 12846461,
    owner_email: 'kalam172010@gmail.com',
    name: 'VIP Direct Keys Instant Bot',
    username: 'VIPDirectKeysBot',
    bot_token: '7819203112:AAG-SampleVipToken192',
    status: 'ONLINE',
    created_at: '2026-02-01 14:15:00',
    description: 'Dedicated wholesale discount bot for VIP players and sub-resellers.',
    theme_color: '#8b5cf6',
    payment_gateway: {
      ...DEFAULT_GATEWAY_CONFIG,
      upi_id: 'vipkeys@fam',
      merchant_name: 'VIP Direct Express'
    },
    reseller_api: DEFAULT_RESELLER_CONFIG,
    products: [],
    productKeys: [],
    settings: {
      ...DEFAULT_SETTINGS,
      bot_username: 'VIPDirectKeysBot'
    },
    stats: {
      total_orders: 0,
      total_revenue: 0.0,
      total_users: 1,
      total_keys_delivered: 0
    }
  }
];
