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
  referral: '5974026322961501198',
  gift: '5974026322961501198',
};

export const UI_TEXTS = {
  start_menu: `✨ <b>KALAM PANEL BOT</b>

{product_store} 𝗣𝗥𝗢𝗗𝗨𝗖𝗧 𝗦𝘁𝗼𝗿𝗲 : 𝗮𝗹𝗹 𝗸𝗲𝘆𝘀 𝗣𝘂𝗿𝗰𝗵𝗮𝘀𝗲  & 𝗶𝗻𝘀𝘁𝗮𝗻𝘁𝗹𝘆 𝗱𝗲𝗹𝗶𝘃𝗲𝗿𝘆
{profile} 𝗠𝘆 𝗽𝗿𝗼𝗳𝗶𝗹𝗲 : 𝗰𝗵𝗲𝗰𝗸 𝘆𝗼𝘂𝗿 𝗮𝗰𝗰𝗼𝘂𝗻𝘁 𝗶𝗻𝗳𝗼𝗿𝗺𝗮𝘁𝗶𝗼𝗻
{add_balance} 𝗔𝗱𝗱 𝗯𝗮𝗹𝗮𝗻𝗰𝗲 : 𝗱𝗲𝗽𝗼𝘀𝗶𝘁𝗲 𝗯𝗮𝗹𝗮𝗻𝗰𝗲 & 𝘀𝗲𝗰𝘂𝗿𝗲 𝘀𝗲𝗿𝘃𝗶𝗰𝗲
{history} 𝗔𝗹𝗹 𝗵𝗶𝘀𝘁𝗼𝗿𝘆 : 𝗰𝗵𝗲𝗰𝗸 𝗮𝗹𝗹 𝗽𝘂𝗿𝗰𝗵𝗮𝘀𝗲 𝗵𝗶𝘀𝘁𝗼𝗿𝘆
{referral} 𝗥𝗲𝗳𝗲𝗿 & 𝗘𝗮𝗿𝗻 : 𝗶𝗻𝘃𝗶𝘁𝗲 𝗳𝗿𝗶𝗲𝗻𝗱𝘀 & 𝗲𝗮𝗿𝗻 𝘂𝗻𝗹𝗶𝗺𝗶𝘁𝗲𝗱 𝗰𝗮𝘀𝗵
{support} 𝗦𝘂𝗽𝗽𝗼𝗿𝘁 : 𝗯𝗼𝘁 𝗽𝗿𝗼𝗯𝗹𝗲𝗺 𝘀𝗼𝗹𝘃𝗲𝗱 𝗳𝗼𝗿 𝘀𝘂𝗽𝗽𝗼𝗿𝘁 𝗮𝗱𝗺𝗶𝗻`,

  referral_menu: `🎁 <b><u>REFER & EARN REWARDS PROGRAM</u></b> 👥
━━━━━━━━━━━━━━━━━━━━
💰 <b>Earn ₹{referral_reward} instant cash</b> for every active friend you invite!
📈 Plus get <b>{referral_commission}% lifetime commission</b> on every recharge & purchase!
🎁 <b>Your invited friends receive ₹{referee_bonus}</b> welcome bonus!

🔗 <b>Your Exclusive Referral Link:</b>
<code>{referral_link}</code>

📊 <b>Your Referral Performance:</b>
👥 Total Friends Invited: <b>{referral_count}</b>
💵 Total Referral Earnings: <b>₹{referral_earnings}</b>
👛 Wallet Balance: <b>₹{current_balance}</b>

🚀 <i>Share your link with friends to earn real cash rewards!</i>`,

  add_balance_menu: `{add_balance} <b>FAMGATEWAY.IN ADD BALANCE</b> {info_icon}

{info_icon} Instant, automated UPI wallet recharge powered by FamGateway.in. {check_icon}

┣ {upi} UPI (PhonePe, GPay, Paytm, FamPay & BHIM) {checkbox_icon}

{shield_icon} Payments are verified & credited automatically in real-time. {check_icon}`
};

export const DEFAULT_SETTINGS: Settings = {
  bot_token: '',
  bot_username: '',
  admin_id: 12846461,
  admin_contact: '@kalam172010',
  reseller_system_status: 'ON',
  referral_system_status: 'ON',
  referral_reward_inr: 1.50,
  referral_commission_percent: 5.0,
  referral_referee_bonus_inr: 1.50,
  bot_status: 'ON',
  how_to_video: 'https://youtube.com/watch?v=kalam_panel_tutorial',
  fampay_api_key: '',
  famgateway_api_key: '',
  famgateway_redirect_url: '',
  bantibhaiya_api_url: 'https://bantibhaiya.to/api/reseller_v1.php',
  bantibhaiya_api_key: '87224c074a021676364829b5b3f0686e',
  bantibhaiya_master_key: 'a7f3e8b2c9d1f4a6b8c2d5e9f1a3b6c8',
  bantibhaiya_status: 'ON',
  provider_auto_fallback: true,
  fampay_upi_id: 'kalampanel@fam',
  fampay_qr_url: 'https://fampay.anujbots.xyz/qr.php',
  fampay_verify_url: 'https://fampay.anujbots.xyz/verify.php',
  binance_api: '',
  binance_secret: '',
  binance_address: '',
  vip_status: 'OFF',
  reseller_setup_fee: 200.0,
  reseller_min_balance: 500.0,
  support_telegram: 'https://t.me/KalamPanelSupport',
  support_whatsapp: 'https://wa.me/919876543210',
  apk_channel_link: 'https://t.me/KalamFFPanelAPKs',
  official_channel_link: 'https://t.me/KalamFFPanelChannel',
  ui_start_menu: UI_TEXTS.start_menu,
  ui_referral_menu: UI_TEXTS.referral_menu,
  ui_add_balance_menu: UI_TEXTS.add_balance_menu,
  usdt_to_inr: 90.0,
  min_deposit_inr: 1.0,
  max_deposit_inr: 50000.0,
};

export const INITIAL_USERS: User[] = [
  {
    user_id: 12846461,
    chat_id: 12846461,
    phone: '+91 98765 43210',
    email: 'kalam2000abc@gmail.com',
    password: 'password123',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    auth_provider: 'google',
    first_name: 'Kalam (Admin)',
    username: 'kalam2000abc',
    balance: 1000.0,
    account_type: 'Reseller',
    orders_count: 0,
    spent: 0.0,
    joined_date: '2026-01-10 10:00:00',
    is_reseller: 1,
    reseller_since: '2026-01-15',
    total_saved: 0.0,
    is_banned: 0,
    warnings: 0,
    is_vip: 1,
    referral_code: 'ref_12846461',
    referral_count: 3,
    referral_earnings: 150.0
  },
  {
    user_id: 12846462,
    chat_id: 12846462,
    phone: '+91 98765 43211',
    email: 'kalam172010@gmail.com',
    password: 'password123',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    auth_provider: 'google',
    first_name: 'Kalam (Master)',
    username: 'kalam172010',
    balance: 500.0,
    account_type: 'Reseller',
    orders_count: 0,
    spent: 0.0,
    joined_date: '2026-01-10 10:00:00',
    is_reseller: 1,
    reseller_since: '2026-01-15',
    total_saved: 0.0,
    is_banned: 0,
    warnings: 0,
    is_vip: 1,
    referral_code: 'ref_12846462',
    referral_count: 1,
    referral_earnings: 50.0
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  // ANDROID NON ROOT PANEL
  {
    id: 1,
    category: "ANDROID NON ROOT PANEL",
    panel_name: "KALAM NON-ROOT VIP PANEL",
    name: "1 Day Pass",
    duration: "1 Day",
    price_inr: 50.0,
    reseller_price_inr: 35.0,
    is_active: 1,
    is_maintenance: 0,
    apk_link: "https://t.me/KalamFFPanelAPKs",
    device_limit: "1 Device HWID"
  },
  {
    id: 2,
    category: "ANDROID NON ROOT PANEL",
    panel_name: "KALAM NON-ROOT VIP PANEL",
    name: "7 Days Pass",
    duration: "7 Days",
    price_inr: 200.0,
    reseller_price_inr: 140.0,
    is_active: 1,
    is_maintenance: 0,
    apk_link: "https://t.me/KalamFFPanelAPKs",
    device_limit: "1 Device HWID"
  },
  {
    id: 3,
    category: "ANDROID NON ROOT PANEL",
    panel_name: "KALAM NON-ROOT VIP PANEL",
    name: "30 Days Pass",
    duration: "30 Days",
    price_inr: 500.0,
    reseller_price_inr: 350.0,
    is_active: 1,
    is_maintenance: 0,
    apk_link: "https://t.me/KalamFFPanelAPKs",
    device_limit: "1 Device HWID"
  },

  // ANDROID ROOT PANEL
  {
    id: 4,
    category: "ANDROID ROOT PANEL",
    panel_name: "KALAM ROOT ULTRA BYPASS PANEL",
    name: "1 Day Pass",
    duration: "1 Day",
    price_inr: 80.0,
    reseller_price_inr: 55.0,
    is_active: 1,
    is_maintenance: 0,
    apk_link: "https://t.me/KalamFFPanelAPKs",
    device_limit: "1 Device HWID"
  },
  {
    id: 5,
    category: "ANDROID ROOT PANEL",
    panel_name: "KALAM ROOT ULTRA BYPASS PANEL",
    name: "7 Days Pass",
    duration: "7 Days",
    price_inr: 300.0,
    reseller_price_inr: 200.0,
    is_active: 1,
    is_maintenance: 0,
    apk_link: "https://t.me/KalamFFPanelAPKs",
    device_limit: "1 Device HWID"
  },
  {
    id: 6,
    category: "ANDROID ROOT PANEL",
    panel_name: "KALAM ROOT ULTRA BYPASS PANEL",
    name: "30 Days Pass",
    duration: "30 Days",
    price_inr: 750.0,
    reseller_price_inr: 500.0,
    is_active: 1,
    is_maintenance: 0,
    apk_link: "https://t.me/KalamFFPanelAPKs",
    device_limit: "1 Device HWID"
  },

  // PC PANEL
  {
    id: 7,
    category: "PC PANEL",
    panel_name: "KALAM PC EMULATOR INJECTOR",
    name: "1 Day Pass",
    duration: "1 Day",
    price_inr: 100.0,
    reseller_price_inr: 70.0,
    is_active: 1,
    is_maintenance: 0,
    apk_link: "https://t.me/KalamFFPanelAPKs",
    device_limit: "1 Device HWID"
  },
  {
    id: 8,
    category: "PC PANEL",
    panel_name: "KALAM PC EMULATOR INJECTOR",
    name: "7 Days Pass",
    duration: "7 Days",
    price_inr: 400.0,
    reseller_price_inr: 280.0,
    is_active: 1,
    is_maintenance: 0,
    apk_link: "https://t.me/KalamFFPanelAPKs",
    device_limit: "1 Device HWID"
  },
  {
    id: 9,
    category: "PC PANEL",
    panel_name: "KALAM PC EMULATOR INJECTOR",
    name: "30 Days Pass",
    duration: "30 Days",
    price_inr: 900.0,
    reseller_price_inr: 600.0,
    is_active: 1,
    is_maintenance: 0,
    apk_link: "https://t.me/KalamFFPanelAPKs",
    device_limit: "1 Device HWID"
  }
];

export const INITIAL_PRODUCT_KEYS: ProductKey[] = [
  { id: 'key_1_1', product_id: 1, key_string: 'KALAM-NONROOT-1DAY-9A8B7C', is_used: 0, created_at: '2026-01-01' },
  { id: 'key_1_2', product_id: 1, key_string: 'KALAM-NONROOT-1DAY-6F5E4D', is_used: 0, created_at: '2026-01-01' },
  { id: 'key_2_1', product_id: 2, key_string: 'KALAM-NONROOT-7DAYS-112233', is_used: 0, created_at: '2026-01-01' },
  { id: 'key_3_1', product_id: 3, key_string: 'KALAM-NONROOT-30DAYS-445566', is_used: 0, created_at: '2026-01-01' },
  { id: 'key_4_1', product_id: 4, key_string: 'KALAM-ROOT-1DAY-778899', is_used: 0, created_at: '2026-01-01' },
  { id: 'key_5_1', product_id: 5, key_string: 'KALAM-ROOT-7DAYS-AABBCC', is_used: 0, created_at: '2026-01-01' },
  { id: 'key_6_1', product_id: 6, key_string: 'KALAM-ROOT-30DAYS-DDEEFF', is_used: 0, created_at: '2026-01-01' },
  { id: 'key_7_1', product_id: 7, key_string: 'KALAM-PC-1DAY-990011', is_used: 0, created_at: '2026-01-01' },
  { id: 'key_8_1', product_id: 8, key_string: 'KALAM-PC-7DAYS-223344', is_used: 0, created_at: '2026-01-01' },
  { id: 'key_9_1', product_id: 9, key_string: 'KALAM-PC-30DAYS-556677', is_used: 0, created_at: '2026-01-01' }
];

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
  min_deposit_inr: 1.0,
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

export const INITIAL_BOTS: BotInstance[] = [];
