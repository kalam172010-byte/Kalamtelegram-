import { useEffect, useRef } from 'react';
import { ViewTab, AdminTab } from '../types';

interface RouterProps {
  isAuthenticated: boolean;
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  adminTab: AdminTab;
  setAdminTab: (tab: AdminTab) => void;
  authMode: 'login' | 'register' | 'forgot_password';
  setAuthMode: (mode: 'login' | 'register' | 'forgot_password') => void;
  activeBotName?: string;
}

export function usePageRouter({
  isAuthenticated,
  activeTab,
  setActiveTab,
  adminTab,
  setAdminTab,
  authMode,
  setAuthMode,
  activeBotName
}: RouterProps) {
  const isInitialSync = useRef(true);

  // 1. On Initial Mount, parse current URL pathname / hash to restore user's intended page
  useEffect(() => {
    if (!isInitialSync.current) return;
    isInitialSync.current = false;

    const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '';
    const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '');
    const currentRoute = hash || path.replace(/^\//, '');

    if (!isAuthenticated) {
      if (currentRoute.includes('register')) {
        setAuthMode('register');
      } else if (currentRoute.includes('forgot') || currentRoute.includes('reset')) {
        setAuthMode('forgot_password');
      } else {
        setAuthMode('login');
      }
      return;
    }

    // Authenticated routes
    if (currentRoute.startsWith('admin')) {
      setActiveTab('admin');
      if (currentRoute.includes('product')) setAdminTab('products');
      else if (currentRoute.includes('user')) setAdminTab('users');
      else if (currentRoute.includes('ticket')) setAdminTab('tickets');
      else if (currentRoute.includes('coupon')) setAdminTab('coupons');
      else if (currentRoute.includes('broadcast')) setAdminTab('broadcast');
      else if (currentRoute.includes('gateway')) setAdminTab('gateways');
      else if (currentRoute.includes('referral')) setAdminTab('referrals');
      else if (currentRoute.includes('health')) setAdminTab('health');
      else if (currentRoute.includes('log')) setAdminTab('logs');
      else if (currentRoute.includes('emoji')) setAdminTab('emojis');
      else if (currentRoute.includes('code')) setAdminTab('code');
      else setAdminTab('overview');
    } else if (currentRoute.startsWith('my_bot') || currentRoute.startsWith('bot') || currentRoute === 'bots') {
      setActiveTab('my_bots');
    } else if (currentRoute.startsWith('gateway')) {
      setActiveTab('gateways');
    } else if (currentRoute.startsWith('reseller') || currentRoute.startsWith('api')) {
      setActiveTab('reseller_api');
    } else {
      setActiveTab('dashboard');
    }
  }, [isAuthenticated, setActiveTab, setAdminTab, setAuthMode]);

  // 2. Listen to Browser Back / Forward buttons (popstate & hashchange)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '';
      const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '');
      const currentRoute = hash || path.replace(/^\//, '');

      if (!isAuthenticated) {
        if (currentRoute.includes('register')) setAuthMode('register');
        else if (currentRoute.includes('forgot')) setAuthMode('forgot_password');
        else setAuthMode('login');
        return;
      }

      if (currentRoute.startsWith('admin')) {
        setActiveTab('admin');
        if (currentRoute.includes('product')) setAdminTab('products');
        else if (currentRoute.includes('user')) setAdminTab('users');
        else if (currentRoute.includes('ticket')) setAdminTab('tickets');
        else if (currentRoute.includes('coupon')) setAdminTab('coupons');
        else if (currentRoute.includes('broadcast')) setAdminTab('broadcast');
        else if (currentRoute.includes('gateway')) setAdminTab('gateways');
        else if (currentRoute.includes('referral')) setAdminTab('referrals');
        else if (currentRoute.includes('health')) setAdminTab('health');
        else if (currentRoute.includes('log')) setAdminTab('logs');
        else if (currentRoute.includes('emoji')) setAdminTab('emojis');
        else if (currentRoute.includes('code')) setAdminTab('code');
        else setAdminTab('overview');
      } else if (currentRoute === 'my_bots' || currentRoute === 'bots' || currentRoute.startsWith('bot')) {
        setActiveTab('my_bots');
      } else if (currentRoute === 'gateways') {
        setActiveTab('gateways');
      } else if (currentRoute === 'reseller_api') {
        setActiveTab('reseller_api');
      } else {
        setActiveTab('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, [isAuthenticated, setActiveTab, setAdminTab, setAuthMode]);

  // 3. Keep Document Title and URL Path / Hash updated whenever active page changes
  useEffect(() => {
    let pageTitle = 'Kalam FF Panel';
    let targetPath = '/';
    let targetHash = '';

    if (!isAuthenticated) {
      if (authMode === 'register') {
        pageTitle = 'Create Account (Register) | Kalam FF Panel';
        targetPath = '/register';
        targetHash = 'register';
      } else if (authMode === 'forgot_password') {
        pageTitle = 'Account Recovery (Reset Password) | Kalam FF Panel';
        targetPath = '/forgot-password';
        targetHash = 'forgot-password';
      } else {
        pageTitle = 'Sign In (Login) | Kalam FF Panel';
        targetPath = '/login';
        targetHash = 'login';
      }
    } else {
      switch (activeTab) {
        case 'admin': {
          const adminSubTitleMap: Record<AdminTab, string> = {
            overview: 'Admin Overview',
            bots: 'Bot Fleet Master Control',
            health: 'System Health & Server Diagnostics',
            products: 'Product Store Management & Key Vault',
            users: 'User Accounts & Balances Directory',
            referrals: 'Affiliate & Referral Network',
            broadcast: 'Telegram Broadcast Engine',
            tickets: 'Customer Support Tickets Helpdesk',
            coupons: 'Gift Codes & Coupon Rewards',
            gateways: 'Payment Gateways & UPI QR Setup',
            emojis: 'Custom Telegram Emojis Editor',
            logs: 'Security & Activity Audit Logs',
            code: 'Live Source Code & Webhook Architecture',
            botcommands: 'Telegram Slash Commands',
            bot_engine: 'Bot Engine Diagnostics'
          };
          const subName = adminSubTitleMap[adminTab] || 'Admin Panel';
          pageTitle = `${subName} | Kalam FF Panel`;
          targetPath = `/admin/${adminTab}`;
          targetHash = `admin/${adminTab}`;
          break;
        }
        case 'my_bots':
          pageTitle = 'Bot Fleet Manager (My Bots) | Kalam FF Panel';
          targetPath = '/bots';
          targetHash = 'bots';
          break;
        case 'gateways':
          pageTitle = 'Payment Gateways & UPI QR | Kalam FF Panel';
          targetPath = '/gateways';
          targetHash = 'gateways';
          break;
        case 'reseller_api':
          pageTitle = 'Reseller API & BantiBhaiya Gateway | Kalam FF Panel';
          targetPath = '/reseller-api';
          targetHash = 'reseller-api';
          break;
        case 'dashboard':
        default:
          pageTitle = 'Home Dashboard | Kalam FF Panel';
          targetPath = '/dashboard';
          targetHash = 'dashboard';
          break;
      }
    }

    // Update Browser Document Title (Visible directly on browser tab right next to URL)
    document.title = pageTitle;

    // Update browser URL without triggering full page reload
    try {
      const newUrl = `${window.location.origin}${targetPath}`;
      if (window.location.pathname !== targetPath && !window.location.pathname.startsWith('/api')) {
        window.history.replaceState({ activeTab, adminTab, authMode }, pageTitle, newUrl);
      }
    } catch {
      // Fallback for sandboxed iframe environments where path rewrite may be restricted
      try {
        if (targetHash && window.location.hash !== `#${targetHash}`) {
          window.location.hash = targetHash;
        }
      } catch {}
    }
  }, [isAuthenticated, activeTab, adminTab, authMode, activeBotName]);
}
