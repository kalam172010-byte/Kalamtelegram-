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

  add_balance_menu: `{add_balance} <b>ADD BALANCE</b> {info_icon}

{info_icon} Select your preferred payment method. {check_icon}

┣ {upi} UPI — Fast Indian payments {checkbox_icon}

{shield_icon} Payments are verified securely. {check_icon}`
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
  ui_start_menu: UI_TEXTS.start_menu,
  ui_vip_menu: UI_TEXTS.vip_menu,
  ui_add_balance_menu: UI_TEXTS.add_balance_menu,
  usdt_to_inr: 90.0,
  vip_discount_percentage: 15.0,
  vip_price_inr: 299.0,
};

export const INITIAL_USERS: User[] = [
  {
    user_id: 12846461,
    phone: '+91 98765 43210',
    email: 'kalam172010@gmail.com',
    password: 'password123',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    auth_provider: 'google',
    first_name: 'Kalam (Admin)',
    username: 'kalam172010',
    balance: 15450.0,
    account_type: 'VIP',
    orders_count: 42,
    spent: 8900.0,
    joined_date: '2026-01-10 10:00:00',
    is_reseller: 1,
    reseller_since: '2026-01-15',
    total_saved: 2450.0,
    is_banned: 0,
    warnings: 0,
    is_vip: 1,
    vip_since: '2026-01-12'
  },
  {
    user_id: 58941209,
    phone: '+91 91234 56789',
    email: 'rahul.gamer@gmail.com',
    password: 'password123',
    avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
    auth_provider: 'email',
    first_name: 'Rahul Gamer',
    username: 'rahul_ff99',
    balance: 850.0,
    account_type: 'Regular',
    orders_count: 3,
    spent: 650.0,
    joined_date: '2026-02-14 14:22:10',
    is_reseller: 0,
    total_saved: 0.0,
    is_banned: 0,
    warnings: 0,
    is_vip: 0
  },
  {
    user_id: 77489012,
    phone: '+91 99887 76655',
    email: 'viper.reseller@gmail.com',
    password: 'password123',
    avatar_url: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=200&q=80',
    auth_provider: 'email',
    first_name: 'Viper Reseller',
    username: 'viper_reseller',
    balance: 2400.0,
    account_type: 'Reseller',
    orders_count: 18,
    spent: 4200.0,
    joined_date: '2026-01-28 09:15:30',
    is_reseller: 1,
    reseller_since: '2026-02-01',
    total_saved: 980.0,
    is_banned: 0,
    warnings: 0,
    is_vip: 0
  },
  {
    user_id: 88192031,
    phone: '+91 98111 22334',
    email: 'aarav.vip@gmail.com',
    password: 'password123',
    avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
    auth_provider: 'google',
    first_name: 'Aarav Sharma',
    username: 'aarav_vip_ff',
    balance: 3120.0,
    account_type: 'VIP',
    orders_count: 24,
    spent: 5400.0,
    joined_date: '2026-01-18 16:40:00',
    is_reseller: 0,
    total_saved: 810.0,
    is_banned: 0,
    warnings: 0,
    is_vip: 1,
    vip_since: '2026-01-20'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  // ANDROID NON ROOT
  {
    id: 1,
    category: 'ANDROID NON ROOT PANEL',
    panel_name: 'MST PANEL',
    name: '24 Hours',
    price_inr: 60.0,
    reseller_price: 35.0,
    stock: 8,
    apk_link: 'https://download.kalampanel.store/mst_v5.2.apk',
    validity: '24 Hours',
    device_limit: '1 Device HWID',
    is_active: 1,
    delivery_mode: 'api_provider',
    provider_product_id: 'MST_V2_PID',
    provider_duration: '1 Day',
    requires_android_id: false
  },
  {
    id: 2,
    category: 'ANDROID NON ROOT PANEL',
    panel_name: 'MST PANEL',
    name: '7 Days',
    price_inr: 250.0,
    reseller_price: 160.0,
    stock: 5,
    apk_link: 'https://download.kalampanel.store/mst_v5.2.apk',
    validity: '7 Days',
    device_limit: '1 Device HWID',
    is_active: 1,
    delivery_mode: 'api_provider',
    provider_product_id: 'MST_V2_PID',
    provider_duration: '7 Days',
    requires_android_id: false
  },
  {
    id: 3,
    category: 'ANDROID NON ROOT PANEL',
    panel_name: 'MST PANEL',
    name: '30 Days',
    price_inr: 650.0,
    reseller_price: 420.0,
    stock: 4,
    apk_link: 'https://download.kalampanel.store/mst_v5.2.apk',
    validity: '30 Days',
    device_limit: '1 Device HWID',
    is_active: 1,
    delivery_mode: 'api_provider',
    provider_product_id: 'MST_V2_PID',
    provider_duration: '30 Days',
    requires_android_id: false
  },
  {
    id: 4,
    category: 'ANDROID NON ROOT PANEL',
    panel_name: 'DRIP PANEL',
    name: '7 Days',
    price_inr: 280.0,
    reseller_price: 180.0,
    stock: 6,
    apk_link: 'https://download.kalampanel.store/drip_mod_safe.apk',
    validity: '7 Days',
    device_limit: '1 Device HWID',
    is_active: 1,
    delivery_mode: 'hybrid',
    provider_product_id: 'DRIP_V1_PID',
    provider_duration: '7 Days',
    requires_android_id: true
  },
  {
    id: 5,
    category: 'ANDROID NON ROOT PANEL',
    panel_name: 'DRIP PANEL',
    name: '1 Month',
    price_inr: 700.0,
    reseller_price: 450.0,
    stock: 3,
    apk_link: 'https://download.kalampanel.store/drip_mod_safe.apk',
    validity: '30 Days',
    device_limit: '1 Device HWID',
    is_active: 1,
    delivery_mode: 'hybrid',
    provider_product_id: 'DRIP_V1_PID',
    provider_duration: '30 Days',
    requires_android_id: true
  },

  // ANDROID ROOT PANEL
  {
    id: 6,
    category: 'ANDROID ROOT PANEL',
    panel_name: 'VIP EXTREME ROOT',
    name: '7 Days',
    price_inr: 320.0,
    reseller_price: 210.0,
    stock: 7,
    apk_link: 'https://download.kalampanel.store/root_vip_extreme.zip',
    validity: '7 Days',
    device_limit: '1 Root Device',
    is_active: 1
  },
  {
    id: 7,
    category: 'ANDROID ROOT PANEL',
    panel_name: 'VIP EXTREME ROOT',
    name: '1 Month',
    price_inr: 850.0,
    reseller_price: 550.0,
    stock: 4,
    apk_link: 'https://download.kalampanel.store/root_vip_extreme.zip',
    validity: '30 Days',
    device_limit: '1 Root Device',
    is_active: 1
  },
  {
    id: 8,
    category: 'ANDROID ROOT PANEL',
    panel_name: 'SNIPER X MAGISK',
    name: '30 Days',
    price_inr: 900.0,
    reseller_price: 600.0,
    stock: 5,
    apk_link: 'https://download.kalampanel.store/sniper_magisk_module.zip',
    validity: '30 Days',
    device_limit: 'Magisk KernelSU',
    is_active: 1
  },

  // PC PANEL
  {
    id: 9,
    category: 'PC PANEL',
    panel_name: 'EMULATOR MASTER PC',
    name: '7 Days',
    price_inr: 400.0,
    reseller_price: 260.0,
    stock: 4,
    apk_link: 'https://download.kalampanel.store/pc_emulator_hook.exe',
    validity: '7 Days',
    device_limit: '1 PC HWID',
    is_active: 1
  },
  {
    id: 10,
    category: 'PC PANEL',
    panel_name: 'EMULATOR MASTER PC',
    name: '1 Month',
    price_inr: 950.0,
    reseller_price: 650.0,
    stock: 5,
    apk_link: 'https://download.kalampanel.store/pc_emulator_hook.exe',
    validity: '30 Days',
    device_limit: '1 PC HWID',
    is_active: 1
  },
  {
    id: 11,
    category: 'PC PANEL',
    panel_name: 'BYPASS STREAMER EDITION',
    name: 'Lifetime',
    price_inr: 2500.0,
    reseller_price: 1800.0,
    stock: 2,
    apk_link: 'https://download.kalampanel.store/pc_streamer_bypass.exe',
    validity: 'Lifetime',
    device_limit: '1 PC HWID Lock',
    is_active: 1
  }
];

export const INITIAL_PRODUCT_KEYS: ProductKey[] = [
  { id: 1, product_id: 1, key_text: 'MST-24H-7A9B-X102', is_used: 0 },
  { id: 2, product_id: 1, key_text: 'MST-24H-8B3C-Y881', is_used: 0 },
  { id: 3, product_id: 1, key_text: 'MST-24H-9C4D-Z992', is_used: 0 },
  { id: 4, product_id: 2, key_text: 'MST-7D-AK91-PL54', is_used: 0 },
  { id: 5, product_id: 2, key_text: 'MST-7D-BR22-MM90', is_used: 0 },
  { id: 6, product_id: 3, key_text: 'MST-30D-PREM-9912-KLM', is_used: 0 },
  { id: 7, product_id: 4, key_text: 'DRIP-7D-NOIRE-8841-K', is_used: 0 },
  { id: 8, product_id: 5, key_text: 'DRIP-30D-FIRE-5512-Z', is_used: 0 },
  { id: 9, product_id: 6, key_text: 'ROOT-EXT-7D-MAG-1029', is_used: 0 },
  { id: 10, product_id: 7, key_text: 'ROOT-EXT-30D-MAG-8891', is_used: 0 },
  { id: 11, product_id: 8, key_text: 'SNIPER-30D-KSU-9988', is_used: 0 },
  { id: 12, product_id: 9, key_text: 'PC-EMU-7D-WIN64-1188', is_used: 0 },
  { id: 13, product_id: 10, key_text: 'PC-EMU-30D-WIN64-9920', is_used: 0 },
  { id: 14, product_id: 11, key_text: 'PC-BYPASS-LIFE-KALAM-9999', is_used: 0 }
];

export const INITIAL_COUPONS: Coupon[] = [
  { code: 'KALAM50', amount: 50.0, uses_left: 45, total_uses: 50 },
  { code: 'WELCOME100', amount: 100.0, uses_left: 18, total_uses: 25 },
  { code: 'VIPBONUS', amount: 200.0, uses_left: 8, total_uses: 10 }
];

export const DEFAULT_GATEWAY_CONFIG: PaymentGatewayConfig = {
  upi_id: 'kalampanel@fam',
  merchant_name: 'Kalam FF Store Pay',
  qr_image_url: 'https://fampay.anujbots.xyz/qr.php',
  gateway_provider: 'fampay',
  api_key: 'FP_LIVE_99481a8c3d11ef420b991',
  secret_key: 'FP_SEC_7718921a990',
  verify_endpoint: 'https://fampay.anujbots.xyz/verify.php',
  usdt_trc20_address: 'TXu8KalamUSDT9912083TronNetwork',
  usdt_to_inr_rate: 90.0,
  auto_approve: true
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
    products: INITIAL_PRODUCTS,
    productKeys: INITIAL_PRODUCT_KEYS,
    settings: DEFAULT_SETTINGS,
    stats: {
      total_orders: 142,
      total_revenue: 28450.0,
      total_users: 85,
      total_keys_delivered: 142
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
    products: INITIAL_PRODUCTS.slice(0, 6),
    productKeys: INITIAL_PRODUCT_KEYS.slice(0, 8),
    settings: {
      ...DEFAULT_SETTINGS,
      bot_username: 'VIPDirectKeysBot'
    },
    stats: {
      total_orders: 48,
      total_revenue: 12800.0,
      total_users: 32,
      total_keys_delivered: 48
    }
  }
];
