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
  admin_contact: '',
  reseller_system_status: 'ON',
  referral_system_status: 'ON',
  referral_reward_inr: 0,
  referral_commission_percent: 0,
  referral_referee_bonus_inr: 0,
  bot_status: 'ON',
  how_to_video: '',
  fampay_api_key: '',
  famgateway_api_key: '',
  famgateway_redirect_url: '',
  bantibhaiya_api_url: '',
  bantibhaiya_api_key: '',
  bantibhaiya_master_key: '',
  bantibhaiya_status: 'OFF',
  provider_auto_fallback: false,
  fampay_upi_id: '',
  fampay_qr_url: '',
  fampay_verify_url: '',
  binance_api: '',
  binance_secret: '',
  binance_address: '',
  vip_status: 'OFF',
  reseller_setup_fee: 0,
  reseller_min_balance: 0,
  support_telegram: '',
  support_whatsapp: '',
  apk_channel_link: '',
  official_channel_link: '',
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
    phone: '',
    email: 'kalam2000abc@gmail.com',
    password: '',
    avatar_url: '',
    auth_provider: 'google',
    first_name: 'Kalam (Admin)',
    username: 'kalam2000abc',
    balance: 0,
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
    referral_count: 0,
    referral_earnings: 0
  }
];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_PRODUCT_KEYS: ProductKey[] = [];

export const INITIAL_COUPONS: Coupon[] = [];

export const DEFAULT_GATEWAY_CONFIG: PaymentGatewayConfig = {
  upi_id: '',
  merchant_name: '',
  qr_image_url: '',
  gateway_provider: 'famgateway',
  api_key: '',
  secret_key: '',
  verify_endpoint: '',
  usdt_trc20_address: '',
  usdt_to_inr_rate: 90.0,
  auto_approve: true,
  min_deposit_inr: 1.0,
  max_deposit_inr: 50000.0
};

export const DEFAULT_RESELLER_CONFIG: ResellerApiConfig = {
  provider_name: '',
  api_url: '',
  api_key: '',
  master_key: '',
  status: 'OFF',
  auto_fallback: false,
  sync_balance: 0
};

export const INITIAL_BOTS: BotInstance[] = [];
