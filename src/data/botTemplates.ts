import { Product } from '../types';

export interface BotTemplatePreset {
  id: string;
  name: string;
  description: string;
  badge: string;
  products: Product[];
}

export const BOT_TEMPLATES: BotTemplatePreset[] = [
  {
    id: 'ff_vip',
    name: '🎯 Free Fire VIP Hack & Mod Store',
    description: 'Preloaded with Non-Root MST, Root Drip, PC AimKill, and iOS Zero panels (1D, 7D, 30D packages)',
    badge: 'HOT 🔥',
    products: [
      {
        id: 2001,
        category: 'ANDROID NON ROOT PANEL',
        panel_name: 'MST VIP PANEL',
        name: '24 Hours VIP Key',
        price_inr: 50,
        reseller_price: 35,
        apk_link: 'https://t.me/kalamvip_channel',
        validity: '24 Hours (1 Day)',
        device_limit: '1 Device',
        is_active: 1
      },
      {
        id: 2002,
        category: 'ANDROID NON ROOT PANEL',
        panel_name: 'MST VIP PANEL',
        name: '7 Days VIP Key',
        price_inr: 250,
        reseller_price: 180,
        apk_link: 'https://t.me/kalamvip_channel',
        validity: '7 Days',
        device_limit: '1 Device',
        is_active: 1
      },
      {
        id: 2003,
        category: 'ANDROID NON ROOT PANEL',
        panel_name: 'MST VIP PANEL',
        name: '30 Days VIP Key',
        price_inr: 650,
        reseller_price: 490,
        apk_link: 'https://t.me/kalamvip_channel',
        validity: '30 Days (1 Month)',
        device_limit: '1 Device',
        is_active: 1
      },
      {
        id: 2004,
        category: 'ANDROID ROOT PANEL',
        panel_name: 'DRIP ROOT VIP',
        name: '7 Days VIP Key',
        price_inr: 350,
        reseller_price: 260,
        apk_link: 'https://t.me/kalamvip_channel',
        validity: '7 Days',
        device_limit: '1 Root Device',
        is_active: 1
      },
      {
        id: 2005,
        category: 'ANDROID ROOT PANEL',
        panel_name: 'DRIP ROOT VIP',
        name: '30 Days VIP Key',
        price_inr: 850,
        reseller_price: 650,
        apk_link: 'https://t.me/kalamvip_channel',
        validity: '30 Days (1 Month)',
        device_limit: '1 Root Device',
        is_active: 1
      },
      {
        id: 2006,
        category: 'PC PANEL',
        panel_name: 'AIMKILL BRUTAL PC',
        name: '7 Days PC License',
        price_inr: 500,
        reseller_price: 380,
        apk_link: 'https://t.me/kalamvip_channel',
        validity: '7 Days',
        device_limit: '1 PC / Emulator',
        is_active: 1
      },
      {
        id: 2007,
        category: 'PC PANEL',
        panel_name: 'AIMKILL BRUTAL PC',
        name: '30 Days PC License',
        price_inr: 1200,
        reseller_price: 900,
        apk_link: 'https://t.me/kalamvip_channel',
        validity: '30 Days (1 Month)',
        device_limit: '1 PC / Emulator',
        is_active: 1
      }
    ]
  },
  {
    id: 'diamonds',
    name: '💎 Free Fire Diamonds & Top-Up Store',
    description: 'Instant Top-Up packages: 100+10💎, 310+31💎, 520+52💎, Weekly & Monthly VIP Memberships',
    badge: 'TOP-UP 💎',
    products: [
      {
        id: 3001,
        category: 'FF DIAMOND TOP-UP',
        panel_name: 'DIRECT TOP-UP',
        name: '100 + 10 Bonus Diamonds',
        price_inr: 80,
        reseller_price: 72,
        apk_link: 'https://t.me/kalamvip_channel',
        validity: 'Instant Delivery via UID',
        device_limit: 'All Servers',
        is_active: 1
      },
      {
        id: 3002,
        category: 'FF DIAMOND TOP-UP',
        panel_name: 'DIRECT TOP-UP',
        name: '310 + 31 Bonus Diamonds',
        price_inr: 240,
        reseller_price: 215,
        apk_link: 'https://t.me/kalamvip_channel',
        validity: 'Instant Delivery via UID',
        device_limit: 'All Servers',
        is_active: 1
      },
      {
        id: 3003,
        category: 'FF DIAMOND TOP-UP',
        panel_name: 'DIRECT TOP-UP',
        name: '520 + 52 Bonus Diamonds',
        price_inr: 400,
        reseller_price: 360,
        apk_link: 'https://t.me/kalamvip_channel',
        validity: 'Instant Delivery via UID',
        device_limit: 'All Servers',
        is_active: 1
      },
      {
        id: 3004,
        category: 'FF MEMBERSHIPS',
        panel_name: 'VIP PASS',
        name: 'Weekly Membership VIP',
        price_inr: 160,
        reseller_price: 145,
        apk_link: 'https://t.me/kalamvip_channel',
        validity: '7 Days Daily Diamonds',
        device_limit: 'All Servers',
        is_active: 1
      },
      {
        id: 3005,
        category: 'FF MEMBERSHIPS',
        panel_name: 'VIP PASS',
        name: 'Monthly Membership VIP',
        price_inr: 790,
        reseller_price: 720,
        apk_link: 'https://t.me/kalamvip_channel',
        validity: '30 Days Daily Diamonds',
        device_limit: 'All Servers',
        is_active: 1
      }
    ]
  },
  {
    id: 'multigame',
    name: '🛡️ Multi-Game VIP Key & Mod Hub',
    description: 'Multi-game support with Free Fire, BGMI, COD Mobile, and 8 Ball Pool VIP Keys',
    badge: 'MULTI-GAME 🎮',
    products: [
      {
        id: 4001,
        category: 'FREE FIRE VIP',
        panel_name: 'FF MAX BRUTAL MOD',
        name: '7 Days VIP Key',
        price_inr: 299,
        reseller_price: 220,
        apk_link: 'https://t.me/kalamvip_channel',
        validity: '7 Days',
        device_limit: '1 Device',
        is_active: 1
      },
      {
        id: 4002,
        category: 'BGMI VIP',
        panel_name: 'BGMI 64-BIT ESP ZERO',
        name: '7 Days VIP License',
        price_inr: 399,
        reseller_price: 310,
        apk_link: 'https://t.me/kalamvip_channel',
        validity: '7 Days',
        device_limit: '1 Device',
        is_active: 1
      },
      {
        id: 4003,
        category: 'COD MOBILE VIP',
        panel_name: 'CODM RADAR & AIM',
        name: '7 Days VIP License',
        price_inr: 349,
        reseller_price: 270,
        apk_link: 'https://t.me/kalamvip_channel',
        validity: '7 Days',
        device_limit: '1 Device',
        is_active: 1
      },
      {
        id: 4004,
        category: '8 BALL POOL VIP',
        panel_name: 'AUTOPLAY GUIDELINE PRO',
        name: '7 Days VIP License',
        price_inr: 199,
        reseller_price: 150,
        apk_link: 'https://t.me/kalamvip_channel',
        validity: '7 Days',
        device_limit: '1 Device',
        is_active: 1
      }
    ]
  }
];

export function getTemplateProducts(templateId: string): Product[] {
  const found = BOT_TEMPLATES.find(t => t.id === templateId);
  return found ? JSON.parse(JSON.stringify(found.products)) : [];
}
