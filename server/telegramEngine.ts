import { dbStore } from './storage';
import { Product, User, Order, Ticket } from '../src/types';
import { famGateway } from './famGateway';
import { bantiResellerService } from './bantiResellerApi';
import QRCode from 'qrcode';
import { apiLogger } from './apiLogger';
import { sortProductsByDuration } from '../src/utils/durationSorter';

export interface BotStatus {
  isRunning: boolean;
  isConnected: boolean;
  connectionHealth: 'HEALTHY' | 'STALE' | 'DISCONNECTED' | 'RECONNECTING';
  autoRestartEnabled: boolean;
  autoRestartCount: number;
  lastAutoRestartTime: string | null;
  consecutiveErrors: number;
  botInfo: {
    id: number;
    first_name: string;
    username: string;
    can_join_groups?: boolean;
    can_read_all_group_messages?: boolean;
  } | null;
  lastError: string | null;
  lastPollTimestamp: string | null;
  updatesProcessed: number;
}

function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sanitizeUrl(url?: string, fallback: string = 'https://t.me/KalamFFPanelChannel'): string {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('tg://')) {
    return trimmed;
  }
  return fallback;
}

export function normalizeCategoryName(str: string): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function isCategoryMatch(prodCategory: string, targetCategory: string): boolean {
  if (!targetCategory || !prodCategory) return true;
  const c2 = normalizeCategoryName(targetCategory);
  if (!c2 || c2.includes('all') || c2.includes('general')) return true;
  const c1 = normalizeCategoryName(prodCategory);
  if (!c1) return true;
  if (c1 === c2) return true;

  // Strict non-root vs root separation so Non-Root products never leak into Root categories
  const isNonRoot1 = c1.includes('nonroot') || c1.includes('non');
  const isNonRoot2 = c2.includes('nonroot') || c2.includes('non');
  if (isNonRoot1 && isNonRoot2) return true;
  if (isNonRoot1 !== isNonRoot2) return false;

  const isRoot1 = c1.includes('root');
  const isRoot2 = c2.includes('root');
  if (isRoot1 && isRoot2) return true;

  const isPc1 = c1.includes('pc') || c1.includes('emulator') || c1.includes('windows');
  const isPc2 = c2.includes('pc') || c2.includes('emulator') || c2.includes('windows');
  if (isPc1 && isPc2) return true;

  return c1 === c2 || c1.includes(c2) || c2.includes(c1);
}

class TelegramEngine {
  private isRunning: boolean = false;
  private isStarting: boolean = false;
  private isConnected: boolean = false;
  private currentPollSessionId: number = 0;
  private botInfo: any = null;
  private lastError: string | null = null;
  private lastPollTimestamp: string | null = null;
  private updatesProcessed: number = 0;
  private pollingAbortController: AbortController | null = null;
  private updateOffset: number = 0;
  private watchdogTimer: NodeJS.Timeout | null = null;

  // 24/7 Connection Guard & Auto-Restart Metrics
  private autoRestartCount: number = 0;
  private lastAutoRestartTime: string | null = null;
  private consecutiveErrors: number = 0;

  constructor() {
    this.startWatchdog();
  }

  public getValidTokenFromStore(): string {
    const settings = dbStore.getData().settings;
    if (settings.bot_token && settings.bot_token.trim() && !settings.bot_token.includes('exampleToken')) {
      return settings.bot_token.trim();
    }
    const envToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
    if (envToken && envToken.trim() && !envToken.includes('exampleToken')) {
      dbStore.updateSettings({ bot_token: envToken.trim() });
      return envToken.trim();
    }
    const storedBots = dbStore.getBots();
    const validBot = storedBots.find(b => b.bot_token && b.bot_token.trim() && !b.bot_token.includes('exampleToken'));
    if (validBot) {
      dbStore.updateSettings({
        bot_token: validBot.bot_token.trim(),
        bot_username: validBot.username,
        admin_id: validBot.admin_id || validBot.admin_chat_id || settings.admin_id
      });
      return validBot.bot_token.trim();
    }
    return '';
  }

  private lastCommandsSyncTime = 0;

  private startWatchdog() {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
    }
    // High-frequency 24/7 Connection Guard Watchdog runs every 20 seconds
    this.watchdogTimer = setInterval(async () => {
      try {
        const token = this.getValidTokenFromStore();
        if (!token) {
          return;
        }

        const now = Date.now();
        const lastPollMs = this.lastPollTimestamp ? new Date(this.lastPollTimestamp).getTime() : 0;
        const timeSinceLastPollSec = lastPollMs > 0 ? (now - lastPollMs) / 1000 : 999;

        // Auto-Detect Connection Drop / Timeout / Stopped Loop:
        // 1. If engine is stopped, restart it
        if (!this.isRunning) {
          this.autoRestartCount++;
          this.lastAutoRestartTime = new Date().toISOString();
          this.consecutiveErrors = 0;
          this.lastPollTimestamp = new Date().toISOString();
          console.log(`⚡ Telegram 24/7 Connection Guard: Bot was stopped, auto-starting (Attempt #${this.autoRestartCount})...`);
          await this.start().catch((err: any) => {
            console.warn('Telegram Watchdog auto-start notice:', err.message);
          });
        } else if (timeSinceLastPollSec > 180 && this.consecutiveErrors >= 5) {
          // If stuck for over 3 minutes with NO poll completion AND 5+ consecutive real errors, gently reconnect
          this.autoRestartCount++;
          this.lastAutoRestartTime = new Date().toISOString();
          this.consecutiveErrors = 0;
          this.lastPollTimestamp = new Date().toISOString();
          console.log(`⚡ Telegram 24/7 Connection Guard: Stale poll (${Math.round(timeSinceLastPollSec)}s, errors=${this.consecutiveErrors}). Reconnecting safely...`);
          await this.restart().catch((err: any) => {
            console.warn('Telegram Watchdog reconnect notice:', err.message);
          });
        }
      } catch (e: any) {
        console.warn('Telegram Watchdog loop tick notice:', e.message);
      }
    }, 20000);
  }

  public getStatus(): BotStatus {
    const now = Date.now();
    const lastPollMs = this.lastPollTimestamp ? new Date(this.lastPollTimestamp).getTime() : 0;
    const timeSinceLastPollSec = lastPollMs > 0 ? (now - lastPollMs) / 1000 : 999;

    let connectionHealth: 'HEALTHY' | 'STALE' | 'DISCONNECTED' | 'RECONNECTING' = 'HEALTHY';
    if (!this.isRunning || !this.isConnected) {
      connectionHealth = 'DISCONNECTED';
    } else if (this.consecutiveErrors > 0) {
      connectionHealth = 'RECONNECTING';
    } else if (timeSinceLastPollSec > 15) {
      connectionHealth = 'STALE';
    }

    return {
      isRunning: this.isRunning,
      isConnected: this.isConnected,
      connectionHealth,
      autoRestartEnabled: true,
      autoRestartCount: this.autoRestartCount,
      lastAutoRestartTime: this.lastAutoRestartTime,
      consecutiveErrors: this.consecutiveErrors,
      botInfo: this.botInfo,
      lastError: this.lastError,
      lastPollTimestamp: this.lastPollTimestamp,
      updatesProcessed: this.updatesProcessed
    };
  }

  public isMaintenanceModeActive(): boolean {
    const settings = dbStore.getData().settings;
    if (!settings) return false;
    const mm = settings.maintenance_mode as any;
    if (mm === false || mm === 'false' || mm === 0 || mm === '0' || mm === 'OFF' || mm === 'off') {
      return false;
    }
    if (mm === true || mm === 1 || mm === 'true' || mm === '1' || mm === 'ON' || mm === 'on') {
      return true;
    }
    const botStatus = String(settings.bot_status || '').trim().toUpperCase();
    if (botStatus === 'OFF' || botStatus === 'MAINTENANCE' || botStatus === 'OFFLINE') {
      return true;
    }
    return false;
  }

  public getWebAppUrl(): string {
    const settings = dbStore.getData().settings;
    if (settings.webapp_url && settings.webapp_url.trim().startsWith('http')) {
      return settings.webapp_url.trim();
    }
    if (process.env.APP_URL && process.env.APP_URL.trim().startsWith('http')) {
      return process.env.APP_URL.trim();
    }
    return '';
  }

  public isAdmin(user: User, chatId?: number): boolean {
    const settings = dbStore.getData().settings;
    const adminId = Number(settings.admin_id);
    const uid = Number(user.user_id);
    const cid = Number(chatId);

    // 1. Direct DB user role check
    if (user.is_admin === 1 || user.role === 'admin') {
      return true;
    }

    // 2. Website Admin ID Enforcement
    if (adminId && adminId > 0 && (uid === adminId || cid === adminId)) {
      if (user.is_admin !== 1 || user.role !== 'admin') {
        dbStore.updateUser(uid, { is_admin: 1, role: 'admin' });
      }
      return true;
    }

    // 3. Admin Contact username fallback
    const uname = (user.username || '').toLowerCase().replace('@', '').trim();
    const adminContact = (settings.admin_contact || '').toLowerCase().replace('@', '').trim();
    if (adminContact && uname && (uname === adminContact || adminContact.includes(uname))) {
      if (user.is_admin !== 1 || user.role !== 'admin') {
        dbStore.updateUser(uid, { is_admin: 1, role: 'admin' });
      }
      return true;
    }

    // 4. Auto-bind owner as Admin if settings.admin_id is unconfigured or default placeholder
    if ((!adminId || adminId === 12846461) && uid > 0) {
      dbStore.updateSettings({ admin_id: uid });
      dbStore.updateUser(uid, { is_admin: 1, role: 'admin' });
      return true;
    }

    return false;
  }

  /**
   * Helper to make calls to Telegram Bot API
   */
  public async callApi(method: string, payload: any = {}): Promise<any> {
    const token = this.getValidTokenFromStore();
    if (!token || token.includes('exampleToken')) {
      throw new Error('Valid Telegram Bot Token is required');
    }

    const startTime = Date.now();
    const url = `https://api.telegram.org/bot${token}/${method}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const durationMs = Date.now() - startTime;
      const result = await response.json();
      if (!result.ok) {
        const errorDesc = result.description || `Telegram API error on ${method}`;
        apiLogger.log({
          service: 'TELEGRAM',
          endpoint: method,
          method: 'POST',
          status: 'ERROR',
          http_code: response.status,
          duration_ms: durationMs,
          message: `Telegram API ${method} failed`,
          error: errorDesc
        });
        throw new Error(errorDesc);
      }

      if (method !== 'getUpdates') {
        apiLogger.log({
          service: 'TELEGRAM',
          endpoint: method,
          method: 'POST',
          status: 'SUCCESS',
          http_code: 200,
          duration_ms: durationMs,
          message: `Telegram API call: ${method} (${durationMs}ms)`
        });
      }

      return result.result;
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      const durationMs = Date.now() - startTime;
      apiLogger.log({
        service: 'TELEGRAM',
        endpoint: method,
        method: 'POST',
        status: 'ERROR',
        duration_ms: durationMs,
        message: `Telegram request failed: ${method}`,
        error: err.message
      });
      throw err;
    }
  }

  /**
   * Test current bot token
   */
  public async testConnection(): Promise<any> {
    const startTime = Date.now();
    try {
      const me = await this.callApi('getMe');
      const durationMs = Date.now() - startTime;
      this.botInfo = me;
      this.isConnected = true;
      this.lastError = null;
      apiLogger.updateTelegramPing(true, durationMs);
      dbStore.logActivity(12846461, 'TG_CONNECT_SUCCESS', `Connected to Telegram Bot: @${me.username} (${me.first_name})`);
      return { success: true, bot: me };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      this.isConnected = false;
      this.lastError = err.message;
      apiLogger.updateTelegramPing(false, durationMs, err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Send test message to configured Admin ID on real Telegram
   */
  public async sendAdminTestMessage(): Promise<any> {
    const settings = dbStore.getData().settings;
    if (!settings.admin_id) {
      throw new Error('Admin ID is not configured');
    }

    const text = `⚡ <b>KALAM FF PANEL - TEST NOTIFICATION</b>\n\n` +
      `✅ <b>Status:</b> Live Telegram Bot Engine is successfully connected!\n` +
      `🤖 <b>Bot:</b> @${this.botInfo?.username || 'KalamFFPanelBot'}\n` +
      `👤 <b>Admin ID:</b> <code>${settings.admin_id}</code>\n` +
      `⏰ <b>Server Time:</b> ${new Date().toLocaleString()}\n\n` +
      `<i>All shop purchases, key deliveries, FamPay payments, and support tickets will trigger instant notifications here.</i>`;

    return await this.sendMessage(settings.admin_id, text, {
      inline_keyboard: [
        [
          { text: '🛒 Test Shop', callback_data: 'shop_categories' },
          { text: '⚙️ Admin Panel', callback_data: 'admin_panel' }
        ]
      ]
    });
  }

  public async deleteMyCommands(): Promise<any> {
    const scopes = [
      { type: 'default' },
      { type: 'all_private_chats' },
      { type: 'all_group_chats' },
      { type: 'all_chat_administrators' }
    ];
    let result: any = null;
    for (const scope of scopes) {
      try {
        result = await this.callApi('deleteMyCommands', { scope });
      } catch (e: any) {
        // ignore
      }
    }
    try {
      await this.callApi('deleteMyCommands', {});
    } catch (e) {}

    dbStore.updateSettings({ bot_commands_enabled: false });
    return result || { ok: true };
  }

  public async syncBotCommands(force = false): Promise<any> {
    const settings = dbStore.getData().settings;
    if (settings.bot_commands_enabled === false) {
      return await this.deleteMyCommands();
    }

    const now = Date.now();
    // Throttle setMyCommands to at most once every 5 minutes to prevent Telegram API rate limits (Too Many Requests)
    if (!force && (now - this.lastCommandsSyncTime) < 5 * 60 * 1000) {
      return { ok: true, cached: true };
    }

    try {
      const commands = [
        { command: 'start', description: '✨ Launch Shop & Main Menu' },
        { command: 'shop', description: '🛒 Product Store Catalog & Duration Plans' },
        { command: 'addbalance', description: '💳 Add Wallet Balance via FamPay UPI' },
        { command: 'profile', description: '👤 My Profile & Purchased License Keys' },
        { command: 'reseller', description: '👑 Reseller VIP Wholesale Dashboard' },
        { command: 'referral', description: '🎁 Refer Friends & Earn Cash Bonus' },
        { command: 'help', description: '💬 24/7 Support Channel & Tickets' }
      ];
      dbStore.updateSettings({ bot_commands_enabled: true });

      const token = dbStore.getData().settings.bot_token;
      if (!token || token.includes('exampleToken')) return;

      const res = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands })
      });
      const data = await res.json();
      if (data.ok) {
        this.lastCommandsSyncTime = now;
      } else {
        console.warn('syncBotCommands Telegram notice:', data.description || 'Rate limited');
      }
      return data;
    } catch (e: any) {
      console.warn('setMyCommands notice:', e.message);
    }
  }

  private startPromise: Promise<void> | null = null;

  /**
   * Start long polling engine
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }
    if (this.startPromise) {
      return this.startPromise;
    }

    this.startPromise = (async () => {
      try {
        // Auto-heal missing settings token from bots storage or process.env if available
        this.getValidTokenFromStore();

        this.currentPollSessionId++;
        const sessionId = this.currentPollSessionId;
        this.isRunning = true;

        const conn = await this.testConnection();
        if (!conn.success) {
          console.log('Telegram Bot Token standby mode: Waiting for token configuration...');
        } else {
          try {
            await this.callApi('deleteWebhook', { drop_pending_updates: false });
            const settings = dbStore.getData().settings;
            if (settings.bot_commands_enabled === false) {
              await this.deleteMyCommands().catch(() => {});
            } else {
              await this.syncBotCommands().catch(() => {});
            }
          } catch (e) {
            // ignore
          }
          console.log(`⚡ Telegram Bot Polling Engine started for @${this.botInfo?.username}`);
        }

        // Run poll loop without awaiting so start() completes and reports running
        this.pollLoop(sessionId).catch(err => {
          console.error('Unhandled pollLoop error:', err);
        });
      } finally {
        this.startPromise = null;
      }
    })();

    return this.startPromise;
  }

  /**
   * Stop long polling engine
   */
  public async stop(): Promise<void> {
    this.currentPollSessionId++; // Invalidate active loop
    this.isRunning = false;
    this.isConnected = false;
    if (this.pollingAbortController) {
      try {
        this.pollingAbortController.abort();
      } catch {}
      this.pollingAbortController = null;
    }
    console.log('Telegram Bot Polling Engine stopped');
  }

  /**
   * Restart engine
   */
  public async restart(): Promise<void> {
    await this.stop();
    await new Promise(r => setTimeout(r, 500));
    await this.start();
  }

  /**
   * Continuous long polling loop with 24/7 resilience & auto-recovery
   */
  private async pollLoop(sessionId: number) {
    try {
      while (this.isRunning && this.currentPollSessionId === sessionId) {
        try {
          const token = this.getValidTokenFromStore();
          if (!token) {
            this.isConnected = false;
            await new Promise(r => setTimeout(r, 2000));
            continue;
          }

          this.lastPollTimestamp = new Date().toISOString();
          const url = `https://api.telegram.org/bot${token}/getUpdates`;
          
          this.pollingAbortController = new AbortController();
          const pollSignal = AbortSignal.any
            ? AbortSignal.any([this.pollingAbortController.signal, AbortSignal.timeout(25000)])
            : this.pollingAbortController.signal;

          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              offset: this.updateOffset,
              timeout: 15, // 15 seconds Telegram long polling window
              allowed_updates: ['message', 'callback_query']
            }),
            signal: pollSignal
          });

          // Check if session was invalidated while awaiting network response
          if (this.currentPollSessionId !== sessionId || !this.isRunning) {
            break;
          }

          if (response.status === 409) {
            console.warn('⚠️ Telegram 409 Conflict: Waiting 4s for existing connection release...');
            this.lastPollTimestamp = new Date().toISOString();
            this.consecutiveErrors = 0;
            await new Promise(r => setTimeout(r, 4000));
            continue;
          }

          if (response.status === 429) {
            console.warn('⚠️ Telegram 429 Rate Limit: Polling paused for 5s...');
            this.lastPollTimestamp = new Date().toISOString();
            this.consecutiveErrors = 0;
            await new Promise(r => setTimeout(r, 5000));
            continue;
          }

          if (!response.ok) {
            const errBody = await response.text();
            this.lastError = `HTTP ${response.status}: ${errBody || response.statusText}`;
            this.consecutiveErrors++;
            await new Promise(r => setTimeout(r, 2000));
            continue;
          }

          const data = await response.json();
          if (data.ok && Array.isArray(data.result)) {
            this.lastPollTimestamp = new Date().toISOString();
            this.isConnected = true;
            this.lastError = null;
            this.consecutiveErrors = 0;
            for (const update of data.result) {
              if (this.currentPollSessionId !== sessionId || !this.isRunning) break;
              this.updateOffset = update.update_id + 1;
              this.updatesProcessed++;
              await this.handleUpdate(update);
            }
          } else if (!data.ok) {
            this.consecutiveErrors++;
            this.lastError = data.description || 'Telegram API returned false status';
            await new Promise(r => setTimeout(r, 2000));
          }
        } catch (err: any) {
          if (!this.isRunning || this.currentPollSessionId !== sessionId) {
            break;
          }
          // Normal timeout or abort during long polling is expected and healthy
          const isTimeoutOrAbort = err.name === 'TimeoutError' || err.name === 'AbortError' || (err.message && err.message.toLowerCase().includes('timeout'));
          if (isTimeoutOrAbort) {
            this.lastPollTimestamp = new Date().toISOString();
            this.consecutiveErrors = 0;
            this.isConnected = true;
            // Immediate seamless next poll iteration
            continue;
          }

          this.consecutiveErrors++;
          this.lastError = err.message || 'Polling request interrupted';
          // Seamless retry on network fluctuation
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    } finally {
      // ONLY reset flags if this session is STILL the active session!
      if (this.currentPollSessionId === sessionId) {
        this.isRunning = false;
        this.isConnected = false;
        console.warn('⚠️ Telegram pollLoop exited. 24/7 Watchdog will auto-heal if active token exists.');
      }
    }
  }

  public async handleUpdate(update: any) {
    try {
      if (update.message) {
        await this.handleMessage(update.message);
      } else if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      }
    } catch (err) {
      console.error('Error processing Telegram update:', err);
    }
  }

  public getMinDeposit(): number {
    const settings = dbStore.getData().settings;
    const bots = dbStore.getBots();
    const activeBot = bots.length > 0 ? bots[0] : null;
    const min = activeBot?.payment_gateway?.min_deposit_inr ?? settings.min_deposit_inr ?? 1;
    const num = Number(min);
    return !isNaN(num) && num >= 1 ? num : 1;
  }

  public getMaxDeposit(): number {
    const settings = dbStore.getData().settings;
    const bots = dbStore.getBots();
    const activeBot = bots.length > 0 ? bots[0] : null;
    const max = activeBot?.payment_gateway?.max_deposit_inr ?? settings.max_deposit_inr ?? 50000;
    const num = Number(max);
    return !isNaN(num) && num > 0 ? num : 50000;
  }

  public async sendMessage(chatId: number, text: string, replyMarkup?: any): Promise<any> {
    const payload: any = {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }
    return await this.callApi('sendMessage', payload);
  }

  public async deleteMessage(chatId: number, messageId: number): Promise<any> {
    try {
      return await this.callApi('deleteMessage', { chat_id: chatId, message_id: messageId });
    } catch (e) {
      // ignore
    }
  }

  public async sendPhoto(chatId: number, photoUrl: string, caption?: string, replyMarkup?: any): Promise<any> {
    const payload: any = {
      chat_id: chatId,
      photo: photoUrl,
      parse_mode: 'HTML'
    };
    if (caption) {
      payload.caption = caption.length > 1024 ? caption.substring(0, 1020) + '...' : caption;
    }
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }
    return await this.callApi('sendPhoto', payload);
  }

  public async sendPhotoBuffer(chatId: number, buffer: Buffer, caption?: string, replyMarkup?: any): Promise<any> {
    const token = dbStore.getData().settings.bot_token;
    if (!token || token.includes('exampleToken')) {
      throw new Error('Telegram Bot Token is not configured');
    }

    const uint8 = new Uint8Array(buffer);
    const file = typeof File !== 'undefined'
      ? new File([uint8], 'payment_qr.png', { type: 'image/png' })
      : new Blob([uint8], { type: 'image/png' });

    const formData = new FormData();
    formData.append('chat_id', String(chatId));
    formData.append('photo', file, 'payment_qr.png');
    formData.append('parse_mode', 'HTML');
    if (caption) {
      formData.append('caption', caption.length > 1024 ? caption.substring(0, 1020) + '...' : caption);
    }
    if (replyMarkup) {
      formData.append('reply_markup', typeof replyMarkup === 'string' ? replyMarkup : JSON.stringify(replyMarkup));
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (!result.ok) {
      throw new Error(result.description || 'Failed to send photo buffer');
    }
    return result.result;
  }

  public async editMessageText(chatId: number, messageId: number, text: string, replyMarkup?: any): Promise<any> {
    const payload: any = {
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }
    return await this.callApi('editMessageText', payload);
  }

  public async editMessageMedia(chatId: number, messageId: number, photoUrlOrFileId: string, caption?: string, replyMarkup?: any): Promise<any> {
    const payload: any = {
      chat_id: chatId,
      message_id: messageId,
      media: {
        type: 'photo',
        media: photoUrlOrFileId,
        caption: caption ? (caption.length > 1024 ? caption.substring(0, 1020) + '...' : caption) : '',
        parse_mode: 'HTML'
      }
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }
    return await this.callApi('editMessageMedia', payload);
  }

  public async answerCallback(callbackQueryId: string, text?: string, showAlert: boolean = false): Promise<any> {
    const payload: any = {
      callback_query_id: callbackQueryId,
      show_alert: showAlert
    };
    if (text) {
      payload.text = text;
    }
    return await this.callApi('answerCallbackQuery', payload);
  }

  private getUserPrice(user: User, product: Product): number {
    if (!product) return 0;
    const settings = dbStore.getData().settings;

    // 1. Reseller tier pricing
    if (user.is_reseller === 1) {
      const resellerP = Number(product.reseller_price || (product as any).reseller_price_inr || 0);
      if (resellerP > 0) return resellerP;
    }

    // 2. VIP Member tier pricing (15% discount or configurable percentage)
    if (user.is_vip === 1) {
      const vipPercent = Number(settings.vip_discount_percent) || 15;
      const baseP = Number(product.price_inr) || 0;
      if (baseP > 0) {
        const discounted = baseP * (1 - vipPercent / 100);
        return Math.round(discounted * 100) / 100;
      }
    }

    // 3. Regular retail price
    const price = Number(product.price_inr) || 0;
    return price;
  }

  private getProductAvailableKeys(productId: number | string): string[] {
    const keys = dbStore.getData().productKeys.filter(k => 
      (String(k.product_id) === String(productId) || Number(k.product_id) === Number(productId)) && 
      (k.is_used === 0 || (k.is_used as any) === false || (k.is_used as any) === '0')
    );
    return keys.map(k => k.key_text || k.key_string || '').filter(Boolean);
  }

  private getProductStockTag(product: Product): string {
    if (product.is_maintenance) {
      return '[🛠️ Maintenance]';
    }
    if (product.delivery_mode === 'api_provider') {
      return '[⚡ Auto Key]';
    }
    const keys = this.getProductAvailableKeys(product.id);
    if (product.delivery_mode === 'hybrid') {
      return keys.length > 0 ? `[Stock: ${keys.length}]` : '[⚡ Auto Key]';
    }
    return keys.length > 0 ? `[Stock: ${keys.length}]` : '[SOLD OUT]';
  }

  private async executeProductDelivery(
    chatId: number,
    user: User,
    product: Product,
    userPrice: number,
    messageId?: number,
    androidId?: string
  ) {
    if (product.is_maintenance) {
      const text = `🛠 <b>PRODUCT UNDER MAINTENANCE</b>\n\n` +
        `<b>${product.panel_name} (${product.name})</b> is temporarily under maintenance/updating.\n\n` +
        `📌 <b>Status / Notice:</b> <i>${product.maintenance_note || 'Maintenance in progress. Updating to latest patch.'}</i>\n\n` +
        `⚠️ Orders for this product are temporarily paused. All other products in our store are fully working and available!`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '🛒 Explore Other Products', callback_data: 'shop_categories' }],
          [{ text: '🔙 Main Menu', callback_data: 'main_menu' }]
        ]
      };
      if (messageId) {
        await this.editMessageText(chatId, messageId, text, keyboard);
      } else {
        await this.sendMessage(chatId, text, keyboard);
      }
      return;
    }

    const settings = dbStore.getData().settings;

    if (user.balance < userPrice) {
      const needed = userPrice - user.balance;
      const text = `⚠️ <b>INSUFFICIENT WALLET BALANCE</b>\n\n` +
        `You are trying to purchase: <b>${product.panel_name} (${product.name})</b>\n` +
        `💵 Item Price: <b>₹${userPrice}</b>\n` +
        `💳 Your Current Balance: <b>₹${user.balance.toFixed(2)}</b>\n` +
        `🔻 Balance Needed: <b>₹${needed.toFixed(2)}</b>\n\n` +
        `Please top up your wallet via FamPay UPI or Crypto to complete your order.`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '💳 Add Balance via FamPay UPI', callback_data: 'add_balance' }],
          [{ text: '🔙 Back to Product', callback_data: `prod_${product.id}` }]
        ]
      };
      if (messageId) {
        await this.editMessageText(chatId, messageId, text, keyboard);
      } else {
        await this.sendMessage(chatId, text, keyboard);
      }
      return;
    }

    let deliveredKey = '';
    let providerSource = '';

    const useApiDelivery = Boolean(
      product.delivery_mode === 'api_provider' ||
      (Boolean(product.provider_product_id) && (product.delivery_mode === 'hybrid' || settings.bantibhaiya_status === 'ON')) ||
      (product.delivery_mode !== 'manual_vault' && settings.bantibhaiya_status === 'ON' && Boolean(settings.bantibhaiya_api_key))
    );

    const providerPid = product.provider_product_id || String(product.id);

    if (useApiDelivery) {
      // Dispatched to BantiBhaiya Reseller Provider API
      const duration = product.provider_duration || product.duration || product.name || '1 Day';
      const buyRes = await bantiResellerService.buyKey({
        productId: providerPid,
        duration: duration,
        androidId: androidId
      });

      if (buyRes.success && buyRes.key) {
        deliveredKey = buyRes.key;
        providerSource = buyRes.source === 'live_api' ? 'BantiBhaiya Live API' : 'Provider Fallback';
      } else {
        // If API purchase failed, check if manual vault fallback is enabled
        const vaultKey = dbStore.getData().productKeys.find(k => 
          (String(k.product_id) === String(product.id) || Number(k.product_id) === Number(product.id)) && 
          (k.is_used === 0 || (k.is_used as any) === false || (k.is_used as any) === '0')
        );
        if (vaultKey && (product.delivery_mode === 'hybrid' || settings.provider_auto_fallback !== false)) {
          vaultKey.is_used = 1;
          deliveredKey = vaultKey.key_text || vaultKey.key_string || '';
          providerSource = 'Manual Vault (API Fallback)';
        } else if (settings.provider_auto_fallback !== false || product.delivery_mode === 'api_provider') {
          // Automatic emergency license generation so customer order is never failed or lost
          const randHex = Math.random().toString(36).substring(2, 7).toUpperCase() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
          const cleanPanel = (product.panel_name || 'KALAM').replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
          deliveredKey = `${cleanPanel}-${randHex}`;
          providerSource = 'Auto-Generated Key (Server Fallback)';

          // Alert Admin about provider API error
          if (settings.admin_id) {
            try {
              this.sendMessage(
                settings.admin_id,
                `⚠️ <b>PROVIDER API NOTICE:</b> Provider returned: <code>${buyRes.error || 'Connection error'}</code>\n` +
                `Generated emergency license key <code>${deliveredKey}</code> for user <code>${user.user_id}</code>.`
              ).catch(() => {});
            } catch (e) {}
          }
        } else {
          const failMsg = `❌ <b>LICENSE GENERATION FAILED</b>\n\n` +
            `Provider Error: <code>${buyRes.error || 'Server temporary issue'}</code>\n\n` +
            `<i>Your wallet balance was NOT deducted. Please try again or contact support.</i>`;
          const keyboard = {
            inline_keyboard: [
              [{ text: '🔄 Retry Purchase', callback_data: `buy_${product.id}` }],
              [{ text: '🎧 Contact Support', callback_data: 'support_menu' }],
              [{ text: '🔙 Back to Shop', callback_data: 'shop_categories' }]
            ]
          };
          if (messageId) {
            await this.editMessageText(chatId, messageId, failMsg, keyboard);
          } else {
            await this.sendMessage(chatId, failMsg, keyboard);
          }
          return;
        }
      }
    } else {
      // Vault delivery
      const vaultKey = dbStore.getData().productKeys.find(k => 
        (String(k.product_id) === String(product.id) || Number(k.product_id) === Number(product.id)) && 
        (k.is_used === 0 || (k.is_used as any) === false || (k.is_used as any) === '0')
      );
      if (!vaultKey) {
        if (settings.provider_auto_fallback !== false) {
          const randHex = Math.random().toString(36).substring(2, 7).toUpperCase() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
          const cleanPanel = (product.panel_name || 'KALAM').replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
          deliveredKey = `${cleanPanel}-${randHex}`;
          providerSource = 'Auto-Generated Key (Vault Fallback)';
        } else {
          const outMsg = `❌ <b>OUT OF STOCK</b>\n\nThis item is currently sold out in the key vault. Please check back later or contact admin.`;
          const keyboard = {
            inline_keyboard: [[{ text: '🔙 Back to Shop', callback_data: 'shop_categories' }]]
          };
          if (messageId) {
            await this.editMessageText(chatId, messageId, outMsg, keyboard);
          } else {
            await this.sendMessage(chatId, outMsg, keyboard);
          }
          return;
        }
      } else {
        vaultKey.is_used = 1;
        deliveredKey = vaultKey.key_text || vaultKey.key_string || '';
        providerSource = 'Manual Key Vault';
      }
    }

    // Deduct balance and update user
    user.balance -= userPrice;
    user.spent += userPrice;
    user.orders_count += 1;

    const orderId = Date.now();
    const newOrder: Order = {
      id: orderId,
      user_id: user.user_id,
      product_name: `${product.panel_name} (${product.name})`,
      price_paid: userPrice,
      delivered_key: deliveredKey,
      purchase_date: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    dbStore.getData().orders.unshift(newOrder);
    dbStore.updateUser(user.user_id, {
      balance: user.balance,
      spent: user.spent,
      orders_count: user.orders_count
    });
    dbStore.saveData();

    dbStore.logActivity(
      user.user_id,
      'PRODUCT_PURCHASE',
      `${product.panel_name} (${product.name}) - ₹${userPrice} [${providerSource}]`
    );

    // Notify Admin on Real Telegram
    if (settings.admin_id) {
      try {
        await this.sendMessage(
          settings.admin_id,
          `🚨 <b>NEW ORDER PLACED! (#${orderId})</b>\n\n` +
          `👤 <b>Customer:</b> ${user.first_name} (@${user.username || user.user_id})\n` +
          `📦 <b>Product:</b> ${product.panel_name} - ${product.name}\n` +
          `💰 <b>Amount:</b> ₹${userPrice}\n` +
          `🔑 <b>Key:</b> <code>${deliveredKey}</code>\n` +
          `⚙️ <b>Source:</b> ${providerSource}` +
          (androidId ? `\n📱 <b>Device HWID:</b> <code>${androidId}</code>` : '')
        );
      } catch (e) {
        // ignore
      }
    }

    const deviceNote = androidId ? `\n📱 <b>Bound HWID:</b> <code>${escapeHtml(androidId)}</code>` : '';
    const apkDownloadUrl = sanitizeUrl(product.apk_link || settings.apk_channel_link, 'https://t.me/KalamFFPanelAPKs');
    const channelUrl = sanitizeUrl(settings.official_channel_link, 'https://t.me/KalamFFPanelChannel');
    const tutorialUrl = sanitizeUrl(settings.how_to_video, 'https://youtube.com');

    const safePanel = escapeHtml(product.panel_name);
    const safeName = escapeHtml(product.name);
    const safeValidity = escapeHtml(product.validity);
    const safeKey = escapeHtml(deliveredKey);

    const deliveryMessage = `🎉 <b>PURCHASE SUCCESSFUL! (#${orderId})</b>\n\n` +
      `📦 <b>Product:</b> ${safePanel} - ${safeName}\n` +
      `⏳ <b>Validity:</b> ${safeValidity}\n` +
      `💰 <b>Amount Paid:</b> ₹${userPrice}\n` +
      `💳 <b>Remaining Balance:</b> ₹${user.balance.toFixed(2)}${deviceNote}\n\n` +
      `🔑 <b>YOUR LICENSE KEY:</b>\n` +
      `<code>${safeKey}</code>\n\n` +
      `⬇️ <b>APK / LOADER CHANNEL:</b>\n` +
      `<a href="${apkDownloadUrl}">${escapeHtml(apkDownloadUrl)}</a>\n\n` +
      `📖 <b>TUTORIAL & SETUP GUIDE:</b>\n` +
      `<a href="${tutorialUrl}">${escapeHtml(tutorialUrl)}</a>\n\n` +
      `<i>Click on the key above to copy it directly to your clipboard. Enjoy playing!</i>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '⬇️ Download APK Channel', url: apkDownloadUrl },
          { text: '📢 Official Channel', url: channelUrl }
        ],
        [
          { text: '🎥 Setup Video Guide', url: tutorialUrl }
        ],
        [
          { text: '👤 View in My Profile', callback_data: 'profile' },
          { text: '🛒 Continue Shopping', callback_data: 'shop_categories' }
        ]
      ]
    };

    if (messageId) {
      try {
        await this.editMessageText(chatId, messageId, deliveryMessage, keyboard);
      } catch (e) {
        await this.sendMessage(chatId, deliveryMessage, keyboard);
      }
    } else {
      await this.sendMessage(chatId, deliveryMessage, keyboard);
    }
  }

  private async handleMessage(msg: any) {
    if (!msg.from || msg.from.is_bot) return;

    const fromUser = msg.from;
    const chatId = msg.chat.id;
    const text = (msg.text || '').trim();

    const isExistingUser = dbStore.getUser(fromUser.id);
    const user = dbStore.getOrCreateUser(fromUser.id, fromUser.first_name, fromUser.username, chatId);

    if (user.is_banned === 1) {
      await this.sendMessage(chatId, '🚫 <b>Account Suspended</b>\n\nYour account has been banned from using Kalam FF Panel. Contact support if you believe this is an error.');
      return;
    }

    const settings = dbStore.getData().settings;

    // Check Maintenance Mode (Only Master Admin can bypass)
    const isMaintenanceOn = this.isMaintenanceModeActive();
    const isMasterAdmin = this.isAdmin(user, chatId);

    if (isMaintenanceOn) {
      const lowerText = text.trim().toLowerCase();
      const isExplicitAdminCmd = isMasterAdmin && (
        lowerText === '/admin' ||
        lowerText.startsWith('/reply_') ||
        lowerText.startsWith('/credit_') ||
        lowerText.startsWith('/cancel') ||
        lowerText.startsWith('/broadcast')
      );

      if (!isExplicitAdminCmd) {
        const customTitle = settings.maintenance_message || '🛠 BOT UNDER MAINTENANCE';
        const customReason = settings.maintenance_reason || 'We are currently fixing technical issues & upgrading server infrastructure.';
        const maintenanceNotice = `🚧 <b><u>${customTitle.toUpperCase()}</u></b> 🚧\n━━━━━━━━━━━━━━━━━━━━\n` +
          `⚠️ <b>Notice:</b> ${customReason}\n\n` +
          `⏱ <b>Status:</b> Temporary Service Downtime / Maintenance Mode Active\n` +
          `📢 <i>Please check back shortly or stay tuned to our official support channel for updates.</i>`;

        const kb: any = { inline_keyboard: [] };
        if (settings.support_telegram) {
          kb.inline_keyboard.push([{ text: '💬 Official Support Channel', url: settings.support_telegram }]);
        }
        if (settings.official_channel_link) {
          kb.inline_keyboard.push([{ text: '📢 News Channel', url: settings.official_channel_link }]);
        }
        if (isMasterAdmin) {
          kb.inline_keyboard.push([
            { text: '⚙️ Master Admin Terminal (Bypass)', callback_data: 'admin_panel' }
          ]);
        }

        await this.sendMessage(chatId, maintenanceNotice, kb.inline_keyboard.length > 0 ? kb : undefined);
        return;
      }
    }

    // Check for referral code on first start e.g. /start ref_12846461 or /start 12846461
    if (!isExistingUser && text.toLowerCase().startsWith('/start')) {
      const parts = text.split(/\s+/);
      if (parts.length > 1) {
        const refPayload = parts[1].trim();
        const rawRefId = refPayload.replace(/^ref_/, '');
        const referrerId = Number(rawRefId);
        if (referrerId && !isNaN(referrerId) && referrerId !== user.user_id) {
          const referrer = dbStore.getUser(referrerId);
          if (referrer) {
            const settings = dbStore.getData().settings;
            user.referred_by = referrerId;
            const refReward = Number(settings.referral_reward_inr) || 1.50;
            const welcomeBonus = Number(settings.referral_referee_bonus_inr) || 1.50;

            // Credit referee welcome bonus
            if (welcomeBonus > 0) {
              user.balance += welcomeBonus;
            }

            // Credit referrer invite bonus
            if (refReward > 0) {
              referrer.balance += refReward;
              referrer.referral_count = (referrer.referral_count || 0) + 1;
              referrer.referral_earnings = (referrer.referral_earnings || 0) + refReward;
              dbStore.updateUser(referrer.user_id, {
                balance: referrer.balance,
                referral_count: referrer.referral_count,
                referral_earnings: referrer.referral_earnings
              });
              dbStore.logActivity(
                referrer.user_id,
                'REFERRAL_BONUS',
                `+₹${refReward} for inviting @${user.username || user.user_id}`
              );

              // Notify referrer on Telegram
              try {
                this.sendMessage(
                  referrer.user_id,
                  `🎉 <b>NEW REFERRAL JOINED! (+₹${refReward.toFixed(2)})</b>\n\n` +
                  `👤 <b>Friend:</b> <b>${user.first_name}</b> (@${user.username || user.user_id})\n` +
                  `🆔 <b>Telegram UID:</b> <code>${user.user_id}</code>\n` +
                  `💰 <b>Signup Reward:</b> <b>+₹${refReward.toFixed(2)}</b> credited to your wallet!\n` +
                  `💳 <b>Your New Balance:</b> <b>₹${referrer.balance.toFixed(2)}</b>\n\n` +
                  `📈 <i>You will also earn <b>${settings.referral_commission_percent || 5}% lifetime commission</b> on all their future recharges!</i>`
                ).catch(() => {});
              } catch (e) {}
            }

            dbStore.updateUser(user.user_id, {
              referred_by: referrerId,
              balance: user.balance
            });
            dbStore.logActivity(
              user.user_id,
              'JOINED_VIA_REFERRAL',
              `Referred by UID ${referrerId} (@${referrer.username || referrerId}) - Welcome bonus: +₹${welcomeBonus}`
            );
            dbStore.saveData();
          }
        }
      }
    }

    const lowerText = text.toLowerCase();

    // Any bot command starting with "/" immediately clears any pending FSM state
    if (text.startsWith('/')) {
      dbStore.setFsmState(user.user_id, 'idle');

      if (lowerText === '/cancel') {
        await this.sendMessage(chatId, '❌ <i>Operation cancelled. Returning to main menu...</i>', this.getMainMenuKeyboard(user));
        return;
      }

      if (lowerText.startsWith('/start')) {
        await this.sendWelcomeMessage(chatId, user);
        return;
      }
    }

    const fsm = dbStore.getFsmState(user.user_id);

    if (fsm && fsm.state === 'admin_wait_add_bal') {
      dbStore.setFsmState(user.user_id, 'idle');
      if (!this.isAdmin(user, chatId)) {
        await this.sendMessage(chatId, '⛔ <b>Access Denied</b>', this.getMainMenuKeyboard(user));
        return;
      }
      const parts = text.split(/\s+/);
      const targetUid = Number(parts[0]);
      const amt = Number(parts[1]);
      const reason = parts.slice(2).join(' ') || 'Admin Telegram Credit';

      if (!targetUid || isNaN(targetUid) || !amt || isNaN(amt) || amt <= 0) {
        await this.sendMessage(
          chatId,
          `❌ <b>Invalid Format</b>\n\nUsage format: <code>&lt;User_ID&gt; &lt;Amount&gt; [Reason]</code>\n\nExample:\n<code>${chatId} 500 Promo bonus</code>`,
          { inline_keyboard: [[{ text: '🔙 Back to Admin', callback_data: 'admin_panel' }]] }
        );
        return;
      }

      const targetUser = dbStore.getData().users.find(u => u.user_id === targetUid);
      if (!targetUser) {
        await this.sendMessage(chatId, `❌ User with ID <code>${targetUid}</code> not found in system database.`, { inline_keyboard: [[{ text: '🔙 Back to Admin', callback_data: 'admin_panel' }]] });
        return;
      }

      targetUser.balance += amt;
      dbStore.updateUser(targetUid, { balance: targetUser.balance });
      dbStore.logActivity(targetUid, 'ADMIN_CREDIT', `+₹${amt} by Admin (${reason})`);
      dbStore.saveData();

      // Send telegram receipt to target user
      try {
        await this.sendMessage(
          targetUid,
          `💰 <b>WALLET CREDITED BY ADMIN!</b>\n\n` +
          `✅ Amount Added: <b>+₹${amt.toFixed(2)}</b>\n` +
          `💳 New Balance: <b>₹${targetUser.balance.toFixed(2)}</b>\n` +
          `📝 Note: <i>${reason}</i>`
        );
      } catch (e) {
        // user may not have started bot yet
      }

      await this.sendMessage(
        chatId,
        `✅ <b>SUCCESSFULLY CREDITED!</b>\n\n` +
        `👤 User: <b>${targetUser.first_name}</b> (@${targetUser.username || targetUid})\n` +
        `🆔 User ID: <code>${targetUid}</code>\n` +
        `💵 Amount Added: <b>+₹${amt.toFixed(2)}</b>\n` +
        `💳 Updated Wallet Balance: <b>₹${targetUser.balance.toFixed(2)}</b>\n` +
        `📝 Reason: <i>${reason}</i>`,
        { inline_keyboard: [[{ text: '🔙 Back to Admin Terminal', callback_data: 'admin_panel' }]] }
      );
      return;
    }

    if (fsm && fsm.state === 'admin_wait_ded_bal') {
      dbStore.setFsmState(user.user_id, 'idle');
      if (!this.isAdmin(user, chatId)) {
        await this.sendMessage(chatId, '⛔ <b>Access Denied</b>', this.getMainMenuKeyboard(user));
        return;
      }
      const parts = text.split(/\s+/);
      const targetUid = Number(parts[0]);
      const amt = Number(parts[1]);
      const reason = parts.slice(2).join(' ') || 'Admin Telegram Deduction';

      if (!targetUid || isNaN(targetUid) || !amt || isNaN(amt) || amt <= 0) {
        await this.sendMessage(
          chatId,
          `❌ <b>Invalid Format</b>\n\nUsage format: <code>&lt;User_ID&gt; &lt;Amount&gt; [Reason]</code>\n\nExample:\n<code>${chatId} 100 Adjustment</code>`,
          { inline_keyboard: [[{ text: '🔙 Back to Admin', callback_data: 'admin_panel' }]] }
        );
        return;
      }

      const targetUser = dbStore.getData().users.find(u => u.user_id === targetUid);
      if (!targetUser) {
        await this.sendMessage(chatId, `❌ User with ID <code>${targetUid}</code> not found in system database.`, { inline_keyboard: [[{ text: '🔙 Back to Admin', callback_data: 'admin_panel' }]] });
        return;
      }

      targetUser.balance = Math.max(0, targetUser.balance - amt);
      dbStore.updateUser(targetUid, { balance: targetUser.balance });
      dbStore.logActivity(targetUid, 'ADMIN_DEBIT', `-₹${amt} by Admin (${reason})`);
      dbStore.saveData();

      try {
        await this.sendMessage(
          targetUid,
          `⚠️ <b>WALLET BALANCE ADJUSTMENT</b>\n\n` +
          `🔻 Amount Deducted: <b>-₹${amt.toFixed(2)}</b>\n` +
          `💳 Current Balance: <b>₹${targetUser.balance.toFixed(2)}</b>\n` +
          `📝 Note: <i>${reason}</i>`
        );
      } catch (e) {
        // ignore
      }

      await this.sendMessage(
        chatId,
        `✅ <b>SUCCESSFULLY DEDUCTED!</b>\n\n` +
        `👤 User: <b>${targetUser.first_name}</b> (@${targetUser.username || targetUid})\n` +
        `🆔 User ID: <code>${targetUid}</code>\n` +
        `🔻 Amount Deducted: <b>-₹${amt.toFixed(2)}</b>\n` +
        `💳 Updated Wallet Balance: <b>₹${targetUser.balance.toFixed(2)}</b>\n` +
        `📝 Reason: <i>${reason}</i>`,
        { inline_keyboard: [[{ text: '🔙 Back to Admin Terminal', callback_data: 'admin_panel' }]] }
      );
      return;
    }

    if (fsm && fsm.state === 'admin_wait_broadcast') {
      dbStore.setFsmState(user.user_id, 'idle');
      if (!this.isAdmin(user, chatId)) return;

      const captionText = (msg.caption || text || '').trim();
      let mediaType: 'text' | 'photo' | 'video' | 'voice' | 'audio' = 'text';
      let mediaFileId: string | undefined = undefined;

      if (msg.photo && msg.photo.length > 0) {
        mediaType = 'photo';
        mediaFileId = msg.photo[msg.photo.length - 1].file_id;
      } else if (msg.video) {
        mediaType = 'video';
        mediaFileId = msg.video.file_id;
      } else if (msg.voice) {
        mediaType = 'voice';
        mediaFileId = msg.voice.file_id;
      } else if (msg.audio) {
        mediaType = 'audio';
        mediaFileId = msg.audio.file_id;
      }

      const allUsers = dbStore.getData().users;
      await this.sendMessage(chatId, `⏳ Sending ${mediaType.toUpperCase()} broadcast to ${allUsers.length} users...`);

      const result = await this.sendBroadcast({
        targetAudience: 'ALL_USERS',
        text: captionText,
        mediaType,
        mediaFileId,
        recipients: allUsers
      });

      await this.sendMessage(
        chatId,
        `📢 <b>${mediaType.toUpperCase()} BROADCAST COMPLETED!</b>\n\n` +
        `✅ Successfully Delivered: <b>${result.sent}</b>\n` +
        `❌ Failed / Inactive: <b>${result.failed}</b>`,
        { inline_keyboard: [[{ text: '🔙 Back to Admin Terminal', callback_data: 'admin_panel' }]] }
      );
      return;
    }

    if (fsm && fsm.state === 'wait_for_redeem') {
      dbStore.setFsmState(user.user_id, 'idle');
      const couponCode = text.toUpperCase();
      const coupons = dbStore.getData().coupons;
      const redeemed = dbStore.getData().redeemed;
      const found = coupons.find(c => c.code.toUpperCase() === couponCode);

      if (!found) {
        await this.sendMessage(chatId, `❌ <b>Invalid Promo Code</b>\n\nThe code <code>${couponCode}</code> does not exist or has expired.`, this.getMainMenuKeyboard(user));
        return;
      }

      const alreadyUsed = redeemed.some(r => r.code.toUpperCase() === couponCode && r.user_id === user.user_id);
      if (alreadyUsed) {
        await this.sendMessage(chatId, `⚠️ <b>Already Redeemed</b>\n\nYou have already used this coupon code before.`, this.getMainMenuKeyboard(user));
        return;
      }

      if (found.uses_left <= 0) {
        await this.sendMessage(chatId, `⚠️ <b>Limit Reached</b>\n\nThis promo code has reached its maximum claim limit.`, this.getMainMenuKeyboard(user));
        return;
      }

      found.uses_left -= 1;
      found.total_uses += 1;
      redeemed.push({
        user_id: user.user_id,
        code: found.code,
        redeemed_at: new Date().toISOString()
      });

      user.balance += found.amount;
      dbStore.updateUser(user.user_id, { balance: user.balance });
      dbStore.saveData();

      dbStore.logActivity(user.user_id, 'COUPON_REDEEM', `Claimed ${found.code} for ₹${found.amount}`);

      await this.sendMessage(
        chatId,
        `🎉 <b>PROMO CODE REDEEMED!</b>\n\n` +
        `✅ Code: <code>${found.code}</code>\n` +
        `💰 Reward Added: <b>+₹${found.amount}</b>\n` +
        `💳 New Wallet Balance: <b>₹${user.balance.toFixed(2)}</b>`,
        this.getMainMenuKeyboard(user)
      );
      return;
    }

    if (fsm && fsm.state === 'wait_for_android_id') {
      const { productId, userPrice } = fsm.data || {};
      dbStore.setFsmState(user.user_id, 'idle');

      const androidId = text.trim();
      if (!androidId || androidId.length < 6) {
        await this.sendMessage(
          chatId,
          `⚠️ <b>Invalid Android ID</b>\n\nPlease provide a valid Android device HWID (e.g. <code>0b9b969bc2e7997b</code>).\n\n<i>Purchase was cancelled. Your wallet was not charged.</i>`,
          this.getMainMenuKeyboard(user)
        );
        return;
      }

      const product = dbStore.getProduct(productId);
      if (!product) {
        await this.sendMessage(chatId, '❌ Product not found!', this.getMainMenuKeyboard(user));
        return;
      }

      await this.executeProductDelivery(chatId, user, product, userPrice, undefined, androidId);
      return;
    }

    if (fsm && fsm.state === 'wait_for_ticket') {
      dbStore.setFsmState(user.user_id, 'idle');
      const ticketId = Math.floor(1000 + Math.random() * 9000);
      const newTicket: Ticket = {
        id: ticketId,
        user_id: user.user_id,
        message: text,
        status: 'Open',
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };

      dbStore.getData().tickets.unshift(newTicket);
      dbStore.logActivity(user.user_id, 'TICKET_CREATE', `Ticket #${ticketId}`);
      dbStore.saveData();

      if (settings.admin_id) {
        try {
          await this.sendMessage(
            settings.admin_id,
            `🚨 <b>NEW SUPPORT TICKET: #${ticketId}</b>\n\n` +
            `👤 <b>From:</b> ${escapeHtml(user.first_name)} (@${escapeHtml(user.username || user.user_id)})\n` +
            `🆔 <b>User ID:</b> <code>${user.user_id}</code>\n` +
            `💬 <b>Message:</b>\n${escapeHtml(text)}\n\n` +
            `<i>Reply via the Web Admin Hub or send /reply_${user.user_id}_YourMessage</i>`
          );
        } catch (e) {
          // ignore
        }
      }

      await this.sendMessage(
        chatId,
        `✅ <b>Support Ticket Submitted (#${ticketId})</b>\n\n` +
        `Your message has been sent to our administrative team. We will review and reply as soon as possible.`,
        this.getMainMenuKeyboard(user)
      );
      return;
    }

    if (fsm && fsm.state === 'wait_for_custom_balance') {
      dbStore.setFsmState(user.user_id, 'idle');
      // Clean up string (e.g. ₹150, 150rs, 150.00 -> 150)
      const cleanNum = text.replace(/[^0-9.]/g, '');
      const amount = parseFloat(cleanNum);
      const minDeposit = this.getMinDeposit();
      const maxDeposit = this.getMaxDeposit();
      if (isNaN(amount) || amount < minDeposit || amount > maxDeposit) {
        await this.sendMessage(
          chatId,
          `❌ <b>Invalid Deposit Amount</b>\n\nPlease enter a valid numerical deposit between <b>₹${minDeposit}</b> and <b>₹${maxDeposit.toLocaleString()}</b> (e.g., <code>${minDeposit}</code>, <code>${Math.min(500, maxDeposit)}</code>).\n\n<i>Type /cancel to return to main menu.</i>`,
          this.getMainMenuKeyboard(user)
        );
        return;
      }

      await this.sendPaymentInstructions(chatId, user, amount);
      return;
    }

    if (fsm && fsm.state === 'wait_for_utr') {
      dbStore.setFsmState(user.user_id, 'idle');
      const utr = text.replace(/[^0-9a-zA-Z]/g, '').trim();

      if (!utr || utr.length < 8) {
        await this.sendMessage(
          chatId,
          `❌ <b>Invalid UTR / Reference ID</b>\n\nA standard UPI Reference / UTR Number is 12 digits (e.g., <code>428912345678</code>). Please verify on your UPI app receipt and try again.\n\n<i>Type /cancel to return to main menu.</i>`,
          this.getMainMenuKeyboard(user)
        );
        return;
      }

      const allTxns = dbStore.getData().transactions;
      const alreadyClaimed = allTxns.some(
        t => t.utr && t.utr.toUpperCase() === utr.toUpperCase() && t.status === 'paid'
      );

      if (alreadyClaimed) {
        await this.sendMessage(
          chatId,
          `⚠️ <b>Duplicate UTR Detected</b>\n\nThis UTR Number (<code>${utr}</code>) has already been claimed in the system! If you believe this is an error, please contact admin support.`,
          this.getMainMenuKeyboard(user)
        );
        return;
      }

      // Find the user's pending order
      const orderId = fsm.data?.orderId;
      let txn = orderId ? allTxns.find(t => t.order_id === orderId) : null;
      if (!txn) {
        // Look for any pending transaction for this user in last 1 hour
        const userPending = allTxns
          .filter(t => t.user_id === user.user_id && t.status === 'pending')
          .sort((a, b) => b.timestamp - a.timestamp);
        if (userPending.length > 0) {
          txn = userPending[0];
        }
      }

      const amountToCredit = fsm.data?.amount || txn?.amount_inr || 100;
      const finalOrderId = txn?.order_id || `ORD_${user.user_id}_${Date.now()}`;

      if (!txn) {
        dbStore.addTransaction({
          order_id: finalOrderId,
          user_id: user.user_id,
          amount_inr: amountToCredit,
          status: 'pending',
          timestamp: Date.now()
        });
      }

      await famGateway.processSuccessfulPayment(finalOrderId, amountToCredit, utr);
      return;
    }

    // Auto-detect 12-digit UTR if user pastes it directly in chat without FSM
    const cleanDigits = text.replace(/[^0-9]/g, '');
    if (cleanDigits.length === 12 && !text.startsWith('/')) {
      const allTxns = dbStore.getData().transactions;
      const userPending = allTxns
        .filter(t => t.user_id === user.user_id && t.status === 'pending')
        .sort((a, b) => b.timestamp - a.timestamp);

      if (userPending.length > 0) {
        const txn = userPending[0];
        const alreadyClaimed = allTxns.some(
          t => t.utr && t.utr === cleanDigits && t.status === 'paid'
        );

        if (!alreadyClaimed) {
          await famGateway.processSuccessfulPayment(txn.order_id, txn.amount_inr, cleanDigits);
          return;
        }
      }
    }

    if (user.user_id === settings.admin_id && text.startsWith('/reply_')) {
      const parts = text.split('_');
      if (parts.length >= 3) {
        const targetUserId = Number(parts[1]);
        const prefix = `/reply_${parts[1]}_`;
        const replyText = text.startsWith(prefix) ? text.substring(prefix.length).trim() : parts.slice(2).join('_').trim();
        try {
          await this.sendMessage(
            targetUserId,
            `📩 <b>SUPPORT RESPONSE FROM ADMIN</b>\n\n` +
            `${replyText}\n\n` +
            `<i>If you need further help, feel free to open another ticket.</i>`
          );
          await this.sendMessage(chatId, `✅ Reply sent to User ID <code>${targetUserId}</code>.`);
        } catch (err: any) {
          await this.sendMessage(chatId, `❌ Failed to send reply: ${err.message}`);
        }
        return;
      }
    }

    // Robust Command Parsing (handling /start, /start@BotUsername, deep links, uppercase, etc.)
    if (lowerText.startsWith('/start')) {
      await this.sendWelcomeMessage(chatId, user);
      return;
    }

    if (lowerText.startsWith('/shop') || lowerText.startsWith('/store') || lowerText.startsWith('/products')) {
      await this.sendShopCategories(chatId, user);
      return;
    }

    if (lowerText.startsWith('/pay') || lowerText.startsWith('/deposit') || lowerText.startsWith('/addbalance')) {
      const parts = text.split(/\s+/);
      if (parts.length >= 2) {
        const cleanNum = parts[1].replace(/[^0-9.]/g, '');
        const amount = parseFloat(cleanNum);
        if (!isNaN(amount) && amount >= 10 && amount <= 100000) {
          await this.sendPaymentInstructions(chatId, user, amount);
          return;
        }
      }
      await this.sendAddBalanceMenu(chatId, user);
      return;
    }

    if (lowerText.startsWith('/balance') || lowerText.startsWith('/wallet')) {
      await this.sendAddBalanceMenu(chatId, user);
      return;
    }

    if (lowerText.startsWith('/profile') || lowerText.startsWith('/account') || lowerText.startsWith('/keys')) {
      await this.sendProfileMessage(chatId, user);
      return;
    }

    if (lowerText.startsWith('/reseller')) {
      await this.sendResellerMenu(chatId, user);
      return;
    }

    if (lowerText.startsWith('/referral') || lowerText.startsWith('/ref') || lowerText.startsWith('/invite') || lowerText.startsWith('/affiliate')) {
      await this.sendReferralMenu(chatId, user);
      return;
    }

    if (lowerText.startsWith('/help') || lowerText.startsWith('/support')) {
      await this.sendSupportMenu(chatId, user);
      return;
    }

    // Admin Quick Commands
    if (this.isAdmin(user, chatId)) {
      if (lowerText.startsWith('/addproduct') || lowerText.startsWith('/addprod')) {
        const line = text.replace(/^\/(addproduct|addprod)\s*/i, '').trim();
        if (line.includes('|')) {
          const parts = line.split('|').map((s: string) => s.trim());
          if (parts.length >= 4) {
            const category = parts[0] || 'Android Non-Root';
            const panelName = parts[1] || 'NEW PANEL';
            const planName = parts[2] || '1 Day Plan';
            const price = parseFloat(parts[3]) || 50;
            const resellerPrice = parts[4] ? parseFloat(parts[4]) : Math.round(price * 0.7);
            const validity = parts[5] || '24 Hours';

            const newId = Date.now();
            const newProd: Product = {
              id: newId,
              name: planName,
              panel_name: panelName,
              category: category,
              price_inr: price,
              reseller_price: resellerPrice,
              validity: validity,
              device_limit: '1 Device',
              stock: 0,
              delivery_mode: 'manual_vault',
              is_active: 1,
              is_maintenance: 0,
              requires_android_id: false,
              apk_link: 'https://t.me/KalamFFPanelAPKs'
            };

            const currentProds = dbStore.getData().products;
            currentProds.push(newProd);
            dbStore.saveData();

            await this.sendMessage(
              chatId,
              `🎉 <b>NEW PRODUCT ADDED SUCCESSFULLY!</b>\n━━━━━━━━━━━━━━━━━━━━\n` +
              `🆔 <b>Product ID:</b> <code>${newId}</code>\n` +
              `📂 <b>Category:</b> ${category}\n` +
              `📦 <b>Panel Name:</b> ${panelName}\n` +
              `⏱ <b>Duration Plan:</b> ${planName}\n` +
              `💰 <b>Price:</b> ₹${price}\n` +
              `👑 <b>Reseller Price:</b> ₹${resellerPrice}\n` +
              `⏳ <b>Validity:</b> ${validity}\n\n` +
              `<i>It is now live in the Telegram Bot Store! You can add keys via <code>/addkey ${newId} | YOUR_KEY</code></i>`,
              { inline_keyboard: [[{ text: '⚙️ Admin Terminal', callback_data: 'admin_panel', style: 'danger' }]] }
            );
            return;
          }
        }

        await this.sendMessage(
          chatId,
          `➕ <b>ADD PRODUCT COMMAND USAGE</b>\n━━━━━━━━━━━━━━━━━━━━\n` +
          `Format:\n<code>/addproduct &lt;Category&gt; | &lt;Panel Name&gt; | &lt;Plan Name&gt; | &lt;Price&gt; | &lt;Reseller Price&gt; | &lt;Validity&gt;</code>\n\n` +
          `📌 <b>Example:</b>\n` +
          `<code>/addproduct Android Non-Root | MST PANEL | 1 Day Plan | 50 | 35 | 24 Hours</code>\n\n` +
          `<i>Or launch the Mini App for full visual product creation!</i>`,
          {
            inline_keyboard: [
              [{ text: '🚀 Open Web Admin Hub', web_app: { url: this.getWebAppUrl() }, style: 'primary' }],
              [{ text: '⚙️ Admin Terminal', callback_data: 'admin_panel', style: 'danger' }]
            ]
          }
        );
        return;
      }

      if (lowerText.startsWith('/addkey') || lowerText.startsWith('/addkeys')) {
        const line = text.replace(/^\/(addkey|addkeys)\s*/i, '').trim();
        if (line.includes('|')) {
          const parts = line.split('|').map((s: string) => s.trim());
          const prodId = Number(parts[0]);
          const rawKeys = parts[1] || '';
          if (prodId && rawKeys) {
            const keysList = rawKeys.split(/[\n,]+/).map((k: string) => k.trim()).filter(Boolean);
            const data = dbStore.getData();
            const prod = data.products.find(p => p.id === prodId);
            if (prod) {
              keysList.forEach((kText: string) => {
                data.productKeys.push({
                  id: Date.now() + Math.floor(Math.random() * 1000),
                  product_id: prodId,
                  key_text: kText,
                  is_used: 0,
                  created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
                });
              });
              prod.stock = data.productKeys.filter(k => k.product_id === prodId && k.is_used === 0).length;
              dbStore.saveData();

              await this.sendMessage(
                chatId,
                `✅ <b>SUCCESSFULLY ADDED ${keysList.length} KEYS!</b>\n━━━━━━━━━━━━━━━━━━━━\n` +
                `📦 <b>Product:</b> ${prod.panel_name} (${prod.name})\n` +
                `📊 <b>Updated Vault Stock:</b> ${prod.stock} keys ready`,
                { inline_keyboard: [[{ text: '⚙️ Admin Terminal', callback_data: 'admin_panel', style: 'danger' }]] }
              );
              return;
            }
          }
        }

        await this.sendMessage(
          chatId,
          `🔑 <b>ADD KEYS COMMAND USAGE</b>\n━━━━━━━━━━━━━━━━━━━━\n` +
          `Format:\n<code>/addkey &lt;Product_ID&gt; | &lt;KEY1, KEY2, KEY3&gt;</code>\n\n` +
          `📌 <b>Example:</b>\n` +
          `<code>/addkey 101 | KALAM-ABC1234, KALAM-XYZ5678</code>`,
          { inline_keyboard: [[{ text: '⚙️ Admin Terminal', callback_data: 'admin_panel', style: 'danger' }]] }
        );
        return;
      }

      if (lowerText.startsWith('/addbalance') || lowerText.startsWith('/credit')) {
        const parts = text.split(/\s+/);
        if (parts.length >= 3) {
          const targetUid = Number(parts[1]);
          const amt = Number(parts[2]);
          const reason = parts.slice(3).join(' ') || 'Admin Telegram Command';
          if (targetUid && !isNaN(targetUid) && amt && !isNaN(amt) && amt > 0) {
            const targetUser = dbStore.getData().users.find(u => u.user_id === targetUid);
            if (targetUser) {
              targetUser.balance += amt;
              dbStore.updateUser(targetUid, { balance: targetUser.balance });
              dbStore.logActivity(targetUid, 'ADMIN_CREDIT', `+₹${amt} by Admin (${reason})`);
              dbStore.saveData();
              try {
                await this.sendMessage(
                  targetUid,
                  `💰 <b>WALLET CREDITED BY ADMIN!</b>\n\n` +
                  `✅ Amount Added: <b>+₹${amt.toFixed(2)}</b>\n` +
                  `💳 New Balance: <b>₹${targetUser.balance.toFixed(2)}</b>\n` +
                  `📝 Note: <i>${reason}</i>`
                );
              } catch (e) {}
              await this.sendMessage(
                chatId,
                `✅ <b>SUCCESS: +₹${amt.toFixed(2)} CREDITED!</b>\n\n` +
                `👤 User: <b>${targetUser.first_name}</b> (@${targetUser.username || targetUid})\n` +
                `🆔 User ID: <code>${targetUid}</code>\n` +
                `💳 Updated Balance: <b>₹${targetUser.balance.toFixed(2)}</b>\n` +
                `📝 Note: <i>${reason}</i>`,
                { inline_keyboard: [[{ text: '⚙️ Admin Terminal', callback_data: 'admin_panel' }]] }
              );
              return;
            } else {
              await this.sendMessage(chatId, `❌ User ID <code>${targetUid}</code> not found.`);
              return;
            }
          }
        }
        await this.sendMessage(
          chatId,
          `ℹ️ <b>Add Balance Usage:</b>\n<code>/addbalance &lt;User_ID&gt; &lt;Amount&gt; [Reason]</code>\n\nExample:\n<code>/addbalance ${chatId} 500 Promo</code>`
        );
        return;
      }

      if (lowerText.startsWith('/deduct')) {
        const parts = text.split(/\s+/);
        if (parts.length >= 3) {
          const targetUid = Number(parts[1]);
          const amt = Number(parts[2]);
          const reason = parts.slice(3).join(' ') || 'Admin Telegram Deduction';
          if (targetUid && !isNaN(targetUid) && amt && !isNaN(amt) && amt > 0) {
            const targetUser = dbStore.getData().users.find(u => u.user_id === targetUid);
            if (targetUser) {
              targetUser.balance = Math.max(0, targetUser.balance - amt);
              dbStore.updateUser(targetUid, { balance: targetUser.balance });
              dbStore.logActivity(targetUid, 'ADMIN_DEBIT', `-₹${amt} by Admin (${reason})`);
              dbStore.saveData();
              try {
                await this.sendMessage(
                  targetUid,
                  `⚠️ <b>WALLET BALANCE ADJUSTMENT</b>\n\n` +
                  `🔻 Amount Deducted: <b>-₹${amt.toFixed(2)}</b>\n` +
                  `💳 Current Balance: <b>₹${targetUser.balance.toFixed(2)}</b>\n` +
                  `📝 Note: <i>${reason}</i>`
                );
              } catch (e) {}
              await this.sendMessage(
                chatId,
                `✅ <b>SUCCESS: -₹${amt.toFixed(2)} DEDUCTED!</b>\n\n` +
                `👤 User: <b>${targetUser.first_name}</b> (@${targetUser.username || targetUid})\n` +
                `🆔 User ID: <code>${targetUid}</code>\n` +
                `💳 Updated Balance: <b>₹${targetUser.balance.toFixed(2)}</b>\n` +
                `📝 Note: <i>${reason}</i>`,
                { inline_keyboard: [[{ text: '⚙️ Admin Terminal', callback_data: 'admin_panel' }]] }
              );
              return;
            } else {
              await this.sendMessage(chatId, `❌ User ID <code>${targetUid}</code> not found.`);
              return;
            }
          }
        }
        await this.sendMessage(
          chatId,
          `ℹ️ <b>Deduct Balance Usage:</b>\n<code>/deduct &lt;User_ID&gt; &lt;Amount&gt; [Reason]</code>\n\nExample:\n<code>/deduct ${chatId} 100 Adjustment</code>`
        );
        return;
      }

      if (lowerText.startsWith('/users')) {
        const allUsers = dbStore.getData().users;
        const totalBal = allUsers.reduce((a, b) => a + b.balance, 0);
        let userListText = `👥 <b>ACTIVE SYSTEM USERS (${allUsers.length})</b>\n💰 Total User Funds: ₹${totalBal.toFixed(2)}\n━━━━━━━━━━━━━━━━━━\n`;
        allUsers.slice(0, 10).forEach(u => {
          userListText += `• <b>${u.first_name}</b> (@${u.username || 'none'})\n  🆔 <code>${u.user_id}</code> | 💰 ₹${u.balance.toFixed(2)} | 🛒 ${u.orders_count} orders\n`;
        });
        if (allUsers.length > 10) userListText += `\n<i>...and ${allUsers.length - 10} more in Web Admin Hub.</i>`;
        await this.sendMessage(chatId, userListText, {
          inline_keyboard: [
            [{ text: '🚀 Open Web Admin Hub', web_app: { url: this.getWebAppUrl() } }],
            [{ text: '🔙 Back to Terminal', callback_data: 'admin_panel' }]
          ]
        });
        return;
      }

      if (lowerText.startsWith('/stock')) {
        const data = dbStore.getData();
        const prods = data.products;
        const unusedKeys = data.productKeys.filter(k => k.is_used === 0);
        let stockMsg = `📦 <b>CATALOG & VAULT STOCK</b>\n━━━━━━━━━━━━━━━━━━\n`;
        prods.forEach(p => {
          const avail = unusedKeys.filter(k => k.product_id === p.id).length;
          stockMsg += `• <b>${p.panel_name} (${p.name})</b>\n  Price: ₹${p.price_inr} | Stock: <b>${avail} ready</b>\n`;
        });
        await this.sendMessage(chatId, stockMsg, {
          inline_keyboard: [
            [{ text: '🚀 Open Web Admin Hub', web_app: { url: this.getWebAppUrl() } }],
            [{ text: '🔙 Back to Terminal', callback_data: 'admin_panel' }]
          ]
        });
        return;
      }

      if (lowerText.startsWith('/broadcast')) {
        const parts = text.split(/\s+/);
        if (parts.length >= 2) {
          const bMsg = parts.slice(1).join(' ').trim();
          const allUsers = dbStore.getData().users;
          await this.sendMessage(chatId, `⏳ Sending broadcast to ${allUsers.length} users...`);
          const result = await this.sendBroadcast({
            targetAudience: 'ALL_USERS',
            text: bMsg,
            recipients: allUsers
          });
          await this.sendMessage(
            chatId,
            `📢 <b>BROADCAST SENT!</b>\n\n✅ Delivered: <b>${result.sent}</b> | ❌ Failed: <b>${result.failed}</b>`
          );
          return;
        }
        dbStore.setFsmState(user.user_id, 'admin_wait_broadcast');
        await this.sendMessage(chatId, '📢 <b>Please send your broadcast announcement message text:</b>\n\n<i>Type /cancel to abort.</i>');
        return;
      }
    }

    // Handle Reply Keyboard Button Clicks & Text Triggers
    if (
      lowerText.includes('product store') ||
      lowerText.includes('store') ||
      lowerText.includes('shop') ||
      lowerText.includes('🛒') ||
      lowerText.includes('🛍')
    ) {
      await this.sendShopCategories(chatId, user);
      return;
    }

    if (
      lowerText.includes('add balance') ||
      lowerText.includes('deposit') ||
      lowerText.includes('wallet') ||
      lowerText.includes('💳') ||
      lowerText.includes('💰')
    ) {
      await this.sendAddBalanceMenu(chatId, user);
      return;
    }

    if (
      lowerText.includes('my profile') ||
      lowerText.includes('profile') ||
      lowerText.includes('account') ||
      lowerText.includes('👤')
    ) {
      await this.sendProfileMessage(chatId, user);
      return;
    }

    if (
      lowerText.includes('refer & earn') ||
      lowerText.includes('referral') ||
      lowerText.includes('refer') ||
      lowerText.includes('invite') ||
      lowerText.includes('🎁')
    ) {
      await this.sendReferralMenu(chatId, user);
      return;
    }

    if (
      lowerText.includes('reseller') ||
      lowerText.includes('wholesale') ||
      lowerText.includes('vip') ||
      lowerText.includes('👑')
    ) {
      await this.sendResellerMenu(chatId, user);
      return;
    }

    if (
      lowerText.includes('support') ||
      lowerText.includes('help') ||
      lowerText.includes('ticket') ||
      lowerText.includes('💬')
    ) {
      await this.sendSupportMenu(chatId, user);
      return;
    }

    // Admin Panel Triggers: @admin, /admin, admin, /panel, /dashboard, !admin, @admin_bot, /adminhub
    const isAdminTrigger = (
      lowerText === '@admin' ||
      lowerText.startsWith('@admin ') ||
      lowerText.startsWith('/admin') ||
      lowerText === 'admin' ||
      lowerText === '/panel' ||
      lowerText === '/dashboard' ||
      lowerText === '!admin' ||
      lowerText.startsWith('@admin_bot') ||
      lowerText === '/adminhub'
    );

    if (isAdminTrigger) {
      if (this.isAdmin(user, chatId)) {
        await this.sendAdminPanel(chatId, user);
      } else {
        await this.sendMessage(
          chatId,
          `⛔ <b>MASTER ADMIN ACCESS RESTRICTED</b>\n\n` +
          `👤 Your Telegram Name: <b>${user.first_name}</b> (@${user.username || 'none'})\n` +
          `🆔 Your User ID: <code>${user.user_id}</code>\n` +
          `💬 Your Chat ID: <code>${chatId}</code>\n\n` +
          `🔒 <i>This terminal requires Master Administrator authorization.</i>\n\n` +
          `👉 <b>How to activate Admin Access:</b>\n` +
          `1️⃣ Open your Web Admin Hub ➔ Settings\n` +
          `2️⃣ Set <b>Admin ID</b> to <code>${chatId}</code> and click Save.\n\n` +
          `<i>For security, Admin IDs can only be configured from the Website Admin Panel. Once saved on the website, typing @admin or /admin opens your Admin Control Terminal!</i>`
        );
      }
      return;
    }

    await this.sendWelcomeMessage(chatId, user);
  }

  private async handleCallbackQuery(cb: any) {
    const fromUser = cb.from;
    const data = cb.data;
    const msg = cb.message;
    const chatId = msg.chat.id;
    const messageId = msg.message_id;

    const user = dbStore.getOrCreateUser(fromUser.id, fromUser.first_name, fromUser.username, chatId);
    const settings = dbStore.getData().settings;

    if (user.is_banned === 1) {
      await this.answerCallback(cb.id, 'Your account is suspended.', true);
      return;
    }

    // Check Maintenance Mode for Callback Queries
    const isMaintenanceOn = this.isMaintenanceModeActive();
    const isMasterAdmin = this.isAdmin(user, chatId);

    if (isMaintenanceOn && !data.startsWith('admin_')) {
      const customTitle = settings.maintenance_message || '🛠 BOT UNDER MAINTENANCE';
      const customReason = settings.maintenance_reason || 'We are currently fixing technical issues & upgrading server infrastructure.';
      const maintenanceNotice = `🚧 <b><u>${customTitle.toUpperCase()}</u></b> 🚧\n━━━━━━━━━━━━━━━━━━━━\n` +
        `⚠️ <b>Notice:</b> ${customReason}\n\n` +
        `⏱ <b>Status:</b> Temporary Service Downtime / Maintenance Mode Active\n` +
        `📢 <i>Please check back shortly or stay tuned to our official support channel for updates.</i>`;

      const kb: any = { inline_keyboard: [] };
      if (settings.support_telegram) {
        kb.inline_keyboard.push([{ text: '💬 Official Support Channel', url: settings.support_telegram }]);
      }
      if (settings.official_channel_link) {
        kb.inline_keyboard.push([{ text: '📢 News Channel', url: settings.official_channel_link }]);
      }
      if (isMasterAdmin) {
        kb.inline_keyboard.push([
          { text: '⚙️ Master Admin Terminal (Bypass)', callback_data: 'admin_panel' }
        ]);
      }

      await this.answerCallback(cb.id, `🛠 Bot is under maintenance`);
      if (messageId) {
        await this.editMessageText(chatId, messageId, maintenanceNotice, kb.inline_keyboard.length > 0 ? kb : undefined).catch(() => {});
      } else {
        await this.sendMessage(chatId, maintenanceNotice, kb.inline_keyboard.length > 0 ? kb : undefined).catch(() => {});
      }
      return;
    }

    await this.answerCallback(cb.id);

    if (
      data === 'main_menu' ||
      data === 'back_main' ||
      data === 'menu_main' ||
      data === 'start' ||
      data === 'back_to_main' ||
      data === 'main' ||
      data === 'back'
    ) {
      dbStore.setFsmState(user.user_id, '');
      const welcomeText = this.getWelcomeText(user);
      const mainKb = this.getMainMenuKeyboard(user);
      if (messageId) {
        try {
          await this.editMessageText(chatId, messageId, welcomeText, mainKb);
        } catch (e) {
          // If editing fails (e.g. previous message was photo or deleted), delete and send fresh message
          await this.deleteMessage(chatId, messageId).catch(() => {});
          await this.sendMessage(chatId, welcomeText, mainKb);
        }
      } else {
        await this.sendMessage(chatId, welcomeText, mainKb);
      }
      return;
    }

    if (data === 'check_update') {
      const apkUrl = settings.apk_download_url || settings.official_channel_link || 'https://t.me/KalamFFPanelAPKs';
      const text =
        `⚡ <b>KALAM FF PANEL - SYSTEM STATUS & UPDATES</b> ⚡\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `✅ <b>Bot Engine:</b> <code>v4.8.2-STABLE</code>\n` +
        `🛡 <b>Bypass Status:</b> 100% Anti-Ban Active & Safe\n` +
        `🎮 <b>Free Fire Version:</b> OB48 & FF MAX Supported\n` +
        `⚡ <b>Server Ping:</b> <code>14ms [Ultra Fast]</code>\n` +
        `📥 <b>Latest APK Link:</b> <a href="${apkUrl}">${apkUrl}</a>\n` +
        `💳 <b>Auto UPI Gateway:</b> FamGateway Online (Instant Credit)\n` +
        `🔑 <b>Key Dispenser:</b> 100% Automated Instant Delivery\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `<i>All modules are operating smoothly with 99.9% uptime.</i>`;
      const keyboard = {
        inline_keyboard: [
          [{ text: '📥 Download Latest APK', url: apkUrl, style: 'primary' }],
          [{ text: '🛒 Buy Now', callback_data: 'shop_categories', style: 'danger' }],
          [{ text: '🔙 Back to Menu', callback_data: 'main_menu', style: 'danger' }]
        ]
      };
      await this.editMessageText(chatId, messageId, text, keyboard);
      return;
    }

    if (data === 'daily_gift') {
      const today = new Date().toISOString().slice(0, 10);
      const logs = dbStore.getData().logs;
      const alreadyClaimed = logs.some(
        l => l.user_id === user.user_id && l.action === 'DAILY_GIFT' && new Date(l.timestamp).toISOString().slice(0, 10) === today
      );

      if (alreadyClaimed) {
        await this.answerCallback(cb.id, '⏳ You already claimed your daily gift today! Check back tomorrow.', true);
        return;
      }

      // Random small reward between ₹0.05 and ₹1.00
      const possibleAmounts = [0.05, 0.10, 0.15, 0.20, 0.25, 0.35, 0.45, 0.50, 0.70, 0.85, 0.90, 0.97, 1.00];
      const reward = possibleAmounts[Math.floor(Math.random() * possibleAmounts.length)];

      dbStore.updateUser(user.user_id, { balance: (user.balance || 0) + reward });
      dbStore.logActivity(user.user_id, 'DAILY_GIFT', `Claimed daily reward bonus of ₹${reward.toFixed(2)}`);

      await this.answerCallback(cb.id, `🎉 Daily Gift Claimed: ₹${reward.toFixed(2)} added!`, true);
      const text =
        `🎁 <b>CONGRATULATIONS! DAILY GIFT CLAIMED</b> 🎁\n\n` +
        `🎉 You received <b>₹${reward.toFixed(2)}</b> free wallet balance!\n` +
        `💰 <b>New Balance:</b> <b>₹${((user.balance || 0) + reward).toFixed(2)}</b>\n\n` +
        `<i>Come back every 24 hours to claim your daily bonus!</i>`;
      const keyboard = {
        inline_keyboard: [
          [{ text: '🛒 Buy Now', callback_data: 'shop_categories', style: 'danger' }],
          [{ text: '🔙 Back to Menu', callback_data: 'main_menu', style: 'danger' }]
        ]
      };
      await this.editMessageText(chatId, messageId, text, keyboard);
      return;
    }

    if (data === 'shop_categories') {
      const allActiveProds = dbStore.getData().products.filter(p => p.is_active !== 0);
      const uniqueCats = Array.from(new Set(allActiveProds.map(p => (p.category || '').trim()).filter(Boolean)));

      if (allActiveProds.length === 0) {
        const emptyText = `🛒 <b>KALAM FF PANEL - STORE CATALOG</b>\n\n` +
          `📦 No products are currently available in the catalog.\n` +
          `Please check back soon or contact support!`;
        const emptyKb = {
          inline_keyboard: [
            [{ text: '🏠 Main Menu', callback_data: 'main_menu', style: 'danger' }]
          ]
        };
        await this.editMessageText(chatId, messageId, emptyText, emptyKb);
        return;
      }

      const text = `🛒 <b>KALAM FF PANEL - STORE CATALOG</b>\n\n` +
        `Select your desired operating environment or product category below:\n\n` +
        `🔹 <b>Android Non-Root:</b> Easy APK install, zero root required, 100% safe\n` +
        `🔸 <b>Android Root:</b> Maximum performance, memory injection, bypass features\n` +
        `💻 <b>PC Emulator:</b> High FPS, full emulator compatibility (BlueStacks/LDPlayer)`;

      const hasNonRoot = allActiveProds.some(p => isCategoryMatch(p.category, 'nonroot'));
      const hasRoot = allActiveProds.some(p => isCategoryMatch(p.category, 'root') && !isCategoryMatch(p.category, 'nonroot'));
      const hasPc = allActiveProds.some(p => isCategoryMatch(p.category, 'pc'));

      const inline_keyboard: any[][] = [
        [{ text: '🛍️ All Products Catalog', callback_data: 'cat_all', style: 'primary' }]
      ];

      if (hasNonRoot) {
        inline_keyboard.push([{ text: '📱 Android Non-Root Panel', callback_data: 'cat_nonroot', style: 'success' }]);
      }
      if (hasRoot) {
        inline_keyboard.push([{ text: '⚡ Android Root Panel', callback_data: 'cat_root', style: 'success' }]);
      }
      if (hasPc) {
        inline_keyboard.push([{ text: '💻 PC Emulator Panel', callback_data: 'cat_pc', style: 'success' }]);
      }

      // Add dynamic category buttons for custom categories added by user/admin
      for (const cat of uniqueCats) {
        if (!isCategoryMatch(cat, 'nonroot') && !isCategoryMatch(cat, 'root') && !isCategoryMatch(cat, 'pc')) {
          inline_keyboard.push([
            { text: `📦 ${cat.toUpperCase()}`, callback_data: `cat_${encodeURIComponent(cat)}`, style: 'primary' }
          ]);
        }
      }

      inline_keyboard.push([{ text: '🔙 Back to Menu', callback_data: 'main_menu', style: 'danger' }]);

      await this.editMessageText(chatId, messageId, text, { inline_keyboard });
      return;
    }

    if (data.startsWith('cat_')) {
      let categoryName = 'ANDROID NON ROOT PANEL';
      let catCode = 'cat_nonroot';
      const rawPayload = data.replace('cat_', '');

      if (data === 'cat_all') {
        categoryName = 'ALL PRODUCTS';
        catCode = 'cat_all';
      } else if (data === 'cat_root') {
        categoryName = 'ANDROID ROOT PANEL';
        catCode = 'cat_root';
      } else if (data === 'cat_pc') {
        categoryName = 'PC PANEL';
        catCode = 'cat_pc';
      } else if (data === 'cat_nonroot') {
        categoryName = 'ANDROID NON ROOT PANEL';
        catCode = 'cat_nonroot';
      } else {
        try {
          categoryName = decodeURIComponent(rawPayload);
        } catch {
          categoryName = rawPayload;
        }
        catCode = data;
      }

      let allCatProducts = dbStore.getData().products.filter(p => 
        p.is_active !== 0 && (data === 'cat_all' || isCategoryMatch(p.category, categoryName))
      );

      let text = `📦 <b><u>${categoryName.toUpperCase()}</u></b>\n━━━━━━━━━━━━━━━━━━━━\n\n`;
      if (allCatProducts.length === 0) {
        text += `<i>❌ No products currently available in this category. Check back soon!</i>`;
        const keyboard = {
          inline_keyboard: [
            [{ text: '🔙 Back to Categories', callback_data: 'shop_categories', style: 'danger' }],
            [{ text: '🏠 Main Menu', callback_data: 'main_menu', style: 'danger' }]
          ]
        };
        await this.editMessageText(chatId, messageId, text, keyboard);
        return;
      }

      // Group products by unique panel_name
      const panelMap = new Map<string, typeof allCatProducts>();
      for (const prod of allCatProducts) {
        const pName = prod.panel_name || prod.name || 'VIP PANEL';
        if (!panelMap.has(pName)) {
          panelMap.set(pName, []);
        }
        panelMap.get(pName)!.push(prod);
      }

      // Sort plans inside each panel by duration
      for (const [pName, plans] of panelMap.entries()) {
        panelMap.set(pName, sortProductsByDuration(plans));
      }

      text += `👉 <b>Select a Product / Panel to view its available plan durations:</b>\n\n`;
      
      let pIdx = 1;
      for (const [pName, plans] of panelMap.entries()) {
        const sortedPlans = sortProductsByDuration(plans);
        if (!sortedPlans || sortedPlans.length === 0) continue;
        const isUnderMaint = sortedPlans.some(p => Boolean(p.is_maintenance));
        const lowestPrice = Math.min(...plans.map(p => this.getUserPrice(user, p)));

        if (isUnderMaint) {
          text += `<b>${pIdx}.</b> 🔴 <b>${pName}</b> — <b>[UNDER MAINTENANCE]</b> <i>(Orders Paused)</i>\n`;
        } else {
          text += `<b>${pIdx}.</b> 📁 <b>${pName}</b> (${plans.length} ${plans.length === 1 ? 'Plan' : 'Plans'} • From ₹${lowestPrice})\n`;
        }
        pIdx++;
      }

      const buttons: any[] = [];
      for (const [pName, plans] of panelMap.entries()) {
        const sortedPlans = sortProductsByDuration(plans);
        const firstProd = sortedPlans && sortedPlans.length > 0 ? sortedPlans[0] : null;
        if (!firstProd || firstProd.id === undefined) continue;

        const isUnderMaint = sortedPlans.some(p => Boolean(p.is_maintenance));

        if (isUnderMaint) {
          buttons.push([{
            text: `🔴 [UNDER MAINTENANCE] ${pName}`,
            callback_data: `maint_pnl_${firstProd.id}`,
            style: 'danger'
          }]);
        } else {
          buttons.push([{
            text: `📦 ${pName} (${plans.length} ${plans.length === 1 ? 'Plan' : 'Plans'})`,
            callback_data: `pnl_${firstProd.id}`,
            style: 'primary'
          }]);
        }
      }

      buttons.push([
        { text: '🔙 Back to Categories', callback_data: 'shop_categories', style: 'danger' },
        { text: '🏠 Main Menu', callback_data: 'main_menu', style: 'danger' }
      ]);

      await this.editMessageText(chatId, messageId, text, { inline_keyboard: buttons });
      return;
    }

    if (data.startsWith('pnl_')) {
      const rawProdId = data.replace('pnl_', '');
      console.log(`[TelegramEngine] [TRACE] Panel Selected callback: rawProdId=${rawProdId}`);
      let refProduct = dbStore.getProduct(rawProdId);
      if (!refProduct) {
        refProduct = dbStore.getData().products.find(p => String(p.id) === String(rawProdId) || Number(p.id) === Number(rawProdId));
      }

      // If not found by direct ID, check if rawProdId matches a panel name or category
      if (!refProduct || refProduct.is_active === 0) {
        let decoded = '';
        try { decoded = decodeURIComponent(rawProdId).toLowerCase().trim(); } catch { decoded = rawProdId.toLowerCase().trim(); }

        refProduct = dbStore.getData().products.find(p =>
          p.is_active !== 0 && (
            (p.panel_name || p.name || '').toLowerCase().trim() === decoded ||
            normalizeCategoryName(p.panel_name || p.name || '') === normalizeCategoryName(decoded) ||
            isCategoryMatch(p.category, decoded)
          )
        );
      }

      // If still not found, gracefully open the store catalog instead of showing dead-end error
      if (!refProduct || refProduct.is_active === 0) {
        const anyActive = dbStore.getData().products.find(p => p.is_active !== 0);
        if (anyActive) {
          refProduct = anyActive;
        } else {
          await this.answerCallback(cb.id, '🛒 Opening Store Catalog...', false);
          await this.sendShopCategories(chatId, user, messageId);
          return;
        }
      }

      const targetCategory = refProduct.category;
      const targetPanelName = refProduct.panel_name || refProduct.name;

      let panelPlans = dbStore.getData().products.filter(p =>
        p.is_active !== 0 &&
        (
          (p.panel_name || p.name || '').trim().toLowerCase() === targetPanelName.trim().toLowerCase() ||
          normalizeCategoryName(p.panel_name || p.name || '') === normalizeCategoryName(targetPanelName) ||
          isCategoryMatch(p.category, targetCategory)
        ) &&
        (
          (p.panel_name || p.name || '').trim().toLowerCase() === targetPanelName.trim().toLowerCase() ||
          normalizeCategoryName(p.panel_name || p.name || '') === normalizeCategoryName(targetPanelName)
        )
      );

      if (panelPlans.length === 0) {
        panelPlans = [refProduct];
      }

      // Guarantee strict chronological order (1 Day -> 2 Days -> 3 Days -> 7 Days -> 15 Days -> 30 Days -> Lifetime)
      panelPlans = sortProductsByDuration(panelPlans);

      console.log(`[TelegramEngine] [TRACE] Found ${panelPlans.length} sorted duration plans for panel: "${targetPanelName}":`, panelPlans.map(pl => ({ id: pl.id, name: pl.name, validity: pl.validity, price: pl.price_inr })));

      let catCode = 'cat_nonroot';
      if (targetCategory.toLowerCase().includes('root') && !targetCategory.toLowerCase().includes('non')) {
        catCode = 'cat_root';
      } else if (targetCategory.toLowerCase().includes('pc')) {
        catCode = 'cat_pc';
      } else {
        catCode = `cat_${targetCategory}`;
      }

      const isPanelUnderMaint = panelPlans.some(p => Boolean(p.is_maintenance)) || Boolean(refProduct.is_maintenance);
      if (isPanelUnderMaint) {
        const maintNote = panelPlans.find(p => p.maintenance_note)?.maintenance_note || refProduct.maintenance_note || 'We are currently updating this package to the newest Free Fire version.';
        await this.answerCallback(cb.id, `🔴 ${targetPanelName} is under maintenance!`, true);
        const text = `🔴 <b>[UNDER MAINTENANCE]</b> 🔴\n━━━━━━━━━━━━━━━━━━━━\n` +
          `📦 <b>Product:</b> <b>${targetPanelName}</b>\n` +
          `📂 <b>Category:</b> ${targetCategory}\n\n` +
          `⚠️ <b>Notice:</b> <i>${maintNote}</i>\n\n` +
          `🚫 <b>ACCESS BLOCKED:</b> This product is currently in Maintenance Mode. Duration plans and checkout steps cannot be viewed or accessed right now.\n\n` +
          `✅ <i>Please check back soon or explore our other active products!</i>`;
        const keyboard = {
          inline_keyboard: [
            [{ text: `🔙 Back to ${targetCategory.split(' ')[0]} Products`, callback_data: catCode, style: 'danger' }],
            [{ text: '🛒 Store Catalog', callback_data: 'shop_categories', style: 'primary' }],
            [{ text: '🏠 Main Menu', callback_data: 'main_menu', style: 'danger' }]
          ]
        };
        await this.editMessageText(chatId, messageId, text, keyboard);
        return;
      }

      let text = `📦 <b><u>${targetPanelName.toUpperCase()}</u></b>\n━━━━━━━━━━━━━━━━━━━━\n` +
        `📂 <b>Category:</b> ${targetCategory}\n` +
        `📱 <b>Device Limit:</b> ${refProduct.device_limit || '1 Device HWID'}\n`;

      if (refProduct.apk_link && refProduct.apk_link.startsWith('http')) {
        text += `📥 <b>APK Download:</b> <a href="${refProduct.apk_link}">Click Here to Download</a>\n`;
      }

      text += `━━━━━━━━━━━━━━━━━━━━\n` +
        `⏱ <b>AVAILABLE DURATION PLANS:</b>\n\n`;

      const buttons: any[] = [];
      const isReseller = user.is_reseller === 1;

      for (const plan of panelPlans) {
        const userPrice = this.getUserPrice(user, plan);
        const stockTag = this.getProductStockTag(plan);
        const isMaint = Boolean(plan.is_maintenance);

        text += `⏱ <b>Plan: ${plan.name}</b>\n`;
        if (isReseller) {
          text += `  • Regular: <s>₹${plan.price_inr}</s> | 👑 <b>Reseller: ₹${userPrice}</b>\n`;
        } else if (user.is_vip === 1) {
          text += `  • Regular: <s>₹${plan.price_inr}</s> | 💎 <b>VIP (15% OFF): ₹${userPrice}</b>\n`;
        } else {
          text += `  • Price: <b>₹${userPrice}</b>\n`;
        }
        text += `  • Stock: ${stockTag}\n\n`;

        if (isMaint) {
          buttons.push([{
            text: `🛠️ ${targetPanelName} (${plan.name}) - Under Maintenance 🛠️`,
            callback_data: `maint_${plan.id}`,
            style: 'danger'
          }]);
        } else {
          buttons.push([{
            text: `⚡ ${targetPanelName} - ${plan.name} (₹${userPrice}) ${stockTag}`,
            callback_data: `prod_${plan.id}`,
            style: 'primary'
          }]);
        }
      }

      text += `👇 <i>Select any duration plan above to view full details and instant key purchase:</i>`;

      buttons.push([
        { text: `🔙 Back to ${targetCategory.split(' ')[0]} Panels`, callback_data: catCode, style: 'danger' },
        { text: '🛒 Store Catalog', callback_data: 'shop_categories', style: 'primary' }
      ]);

      await this.editMessageText(chatId, messageId, text, { inline_keyboard: buttons });
      return;
    }

    if (data.startsWith('prod_')) {
      const rawProdId = data.replace('prod_', '');
      console.log(`[TelegramEngine] [TRACE] Duration Plan Clicked: rawProdId="${rawProdId}"`);
      let product = dbStore.getProduct(rawProdId);
      if (!product) {
        product = dbStore.getData().products.find(p => String(p.id) === String(rawProdId) || Number(p.id) === Number(rawProdId));
      }

      if (!product || product.is_active === 0) {
        const anyActive = dbStore.getData().products.find(p => p.is_active !== 0);
        if (anyActive) {
          product = anyActive;
        } else {
          await this.answerCallback(cb.id, '🛒 Opening Store Catalog...', false);
          await this.sendShopCategories(chatId, user, messageId);
          return;
        }
      }

      const userPrice = this.getUserPrice(user, product);
      const availableKeys = this.getProductAvailableKeys(product.id);
      const isApi = product.delivery_mode === 'api_provider' || Boolean(product.provider_product_id);
      const isDeviceBound = Boolean(product.requires_android_id);

      let stockInfo = '';
      if (product.delivery_mode === 'api_provider') {
        stockInfo = `⚡ <code>Instant Auto-Generation (API Key Server)</code>`;
      } else if (product.delivery_mode === 'hybrid') {
        stockInfo = `⚡ <code>${availableKeys.length} Vault Keys + Auto API Fallback</code>`;
      } else {
        stockInfo = `<code>${availableKeys.length} keys ready in Vault</code>`;
      }

      let discountText = '';
      if (user.is_reseller === 1) {
        discountText = `\n🏷 <b>Wholesale Price Applied:</b> ₹${product.reseller_price} (Retail: ₹${product.price_inr})`;
      } else if (user.is_vip === 1) {
        discountText = `\n💎 <b>VIP 15% Discount:</b> ₹${userPrice} (Regular: ₹${product.price_inr})`;
      }

      const hwidNote = isDeviceBound ? `\n📱 <b>Device Lock:</b> <i>Requires Android HWID on purchase</i>` : ``;

      let text = `📦 <b>${product.panel_name || product.name}</b>\n` +
        `⏱ <b>Duration Plan:</b> ${product.name}\n━━━━━━━━━━━━━━━━━━━━\n` +
        `📂 <b>Category:</b> ${product.category}\n` +
        `⏳ <b>Validity:</b> ${product.validity}\n` +
        `🔒 <b>Device Limit:</b> ${product.device_limit}${hwidNote}\n` +
        `💰 <b>Price:</b> <b>₹${userPrice}</b>${discountText}\n` +
        `📊 <b>Stock Status:</b> ${stockInfo}\n` +
        `💳 <b>Your Wallet Balance:</b> ₹${user.balance.toFixed(2)}\n`;

      if (product.apk_link && product.apk_link.startsWith('http')) {
        text += `📥 <b>APK Download Link:</b> <a href="${product.apk_link}">Click Here</a>\n`;
      }

      text += `━━━━━━━━━━━━━━━━━━━━\n` +
        `<i>Keys are delivered immediately upon checkout directly to this chat!</i>`;

      const keyboard: any = {
        inline_keyboard: []
      };

      const hasStock = isApi || availableKeys.length > 0;
      const isUnderMaintenance = Boolean(product.is_maintenance);

      if (isUnderMaintenance) {
        keyboard.inline_keyboard.push([
          { text: `🛠️ Product Under Maintenance`, callback_data: `maint_${product.id}`, style: 'danger' }
        ]);
      } else if (hasStock) {
        keyboard.inline_keyboard.push([
          { text: `⚡ CONFIRM & BUY NOW (₹${userPrice}) ⚡`, callback_data: `buy_${product.id}`, style: 'danger' }
        ]);
      } else {
        keyboard.inline_keyboard.push([
          { text: `❌ Out of Stock`, callback_data: 'stock_empty', style: 'danger' }
        ]);
      }

      keyboard.inline_keyboard.push([
        { text: '💳 Add Wallet Balance', callback_data: 'add_balance', style: 'success' }
      ]);
      keyboard.inline_keyboard.push([
        { text: '🔙 Back to Duration Plans', callback_data: `pnl_${product.id}`, style: 'danger' },
        { text: '🛒 Store Catalog', callback_data: 'shop_categories', style: 'primary' }
      ]);
      keyboard.inline_keyboard.push([
        { text: '🏠 Main Menu', callback_data: 'main_menu', style: 'danger' }
      ]);

      const maintenanceBanner = isUnderMaintenance
        ? `\n\n🛠 <b>MAINTENANCE NOTICE:</b>\n<i>${product.maintenance_note || 'This panel is temporarily under maintenance/update. Orders for this specific product are paused.'}</i>`
        : '';

      const updatedText = text + maintenanceBanner;

      await this.editMessageText(chatId, messageId, updatedText, keyboard);
      return;
    }

    if (data.startsWith('maint_pnl_')) {
      const rawPayload = data.replace('maint_pnl_', '');
      let refProduct = dbStore.getProduct(rawPayload);
      if (!refProduct) {
        refProduct = dbStore.getData().products.find(p => String(p.id) === String(rawPayload) || Number(p.id) === Number(rawPayload));
      }
      const pName = refProduct?.panel_name || refProduct?.name || decodeURIComponent(rawPayload);
      const cat = refProduct?.category || 'ANDROID NON ROOT PANEL';
      const note = refProduct?.maintenance_note || 'We are currently updating this package to the newest Free Fire version.';

      let catCode = 'cat_nonroot';
      if (cat.toLowerCase().includes('root') && !cat.toLowerCase().includes('non')) {
        catCode = 'cat_root';
      } else if (cat.toLowerCase().includes('pc')) {
        catCode = 'cat_pc';
      } else {
        catCode = `cat_${encodeURIComponent(cat)}`;
      }

      await this.answerCallback(cb.id, `🔴 ${pName} is under maintenance!`, true);
      const text = `🔴 <b>[UNDER MAINTENANCE]</b> 🔴\n━━━━━━━━━━━━━━━━━━━━\n` +
        `📦 <b>Product:</b> <b>${pName}</b>\n` +
        `📂 <b>Category:</b> ${cat}\n\n` +
        `⚠️ <b>Maintenance Notice:</b>\n<i>${note}</i>\n\n` +
        `🚫 <b>ACCESS BLOCKED:</b> This product is currently in Maintenance Mode. Duration plans and checkout steps cannot be accessed right now.\n\n` +
        `✅ <i>Please check back later or explore other active products from our catalog!</i>`;
      const keyboard = {
        inline_keyboard: [
          [{ text: `🔙 Back to ${cat.split(' ')[0]} Products`, callback_data: catCode, style: 'danger' }],
          [{ text: '🛒 Store Catalog', callback_data: 'shop_categories', style: 'primary' }],
          [{ text: '🏠 Main Menu', callback_data: 'main_menu', style: 'danger' }]
        ]
      };
      await this.editMessageText(chatId, messageId, text, keyboard);
      return;
    }

    if (data.startsWith('maint_')) {
      const prodId = Number(data.replace('maint_', ''));
      const product = dbStore.getProduct(prodId);
      const pName = product?.panel_name || product?.name || 'Product';
      const note = product?.maintenance_note || 'We are currently updating this package to the newest Free Fire version.';
      await this.answerCallback(cb.id, `🔴 ${pName} is under maintenance!`, true);
      const text = `🔴 <b>[UNDER MAINTENANCE]</b> 🔴\n━━━━━━━━━━━━━━━━━━━━\n` +
        `📦 <b>Product:</b> <b>${pName} (${product?.name || ''})</b>\n\n` +
        `⚠️ <b>Maintenance Notice:</b>\n<i>${note}</i>\n\n` +
        `🚫 <b>Orders Blocked:</b> You cannot proceed to the next step while this product is in maintenance mode.\n\n` +
        `✅ <i>All other catalog products are fully working and available for instant order!</i>`;
      const keyboard = {
        inline_keyboard: [
          [{ text: '🛒 Explore Other Products', callback_data: 'shop_categories', style: 'primary' }],
          [{ text: '🏠 Main Menu', callback_data: 'main_menu', style: 'danger' }]
        ]
      };
      await this.editMessageText(chatId, messageId, text, keyboard);
      return;
    }

    if (data.startsWith('buy_')) {
      const rawProdId = data.replace('buy_', '');
      let product = dbStore.getProduct(rawProdId);
      if (!product) {
        product = dbStore.getData().products.find(p => String(p.id) === String(rawProdId) || Number(p.id) === Number(rawProdId));
      }

      if (!product || product.is_active === 0) {
        const anyActive = dbStore.getData().products.find(p => p.is_active !== 0);
        if (anyActive) {
          product = anyActive;
        } else {
          await this.answerCallback(cb.id, '🛒 Opening Store Catalog...', false);
          await this.sendShopCategories(chatId, user, messageId);
          return;
        }
      }

      if (product.is_maintenance) {
        await this.answerCallback(cb.id, `🛠️ This product is currently under maintenance!`, true);
        const text = `🛠 <b>PRODUCT UNDER MAINTENANCE</b>\n\n` +
          `<b>${product.panel_name} (${product.name})</b> is temporarily paused for updates.\n\n` +
          `📌 <b>Notice:</b> <i>${product.maintenance_note || 'Maintenance in progress. Please check back shortly.'}</i>\n\n` +
          `✅ <i>All other catalog products are fully working and available for instant order!</i>`;

        const keyboard = {
          inline_keyboard: [
            [{ text: '🛒 Explore Other Products', callback_data: 'shop_categories', style: 'primary' }],
            [{ text: '🔙 Main Menu', callback_data: 'main_menu', style: 'danger' }]
          ]
        };
        await this.editMessageText(chatId, messageId, text, keyboard);
        return;
      }

      const userPrice = this.getUserPrice(user, product);

      if (user.balance < userPrice) {
        const needed = userPrice - user.balance;
        await this.answerCallback(cb.id, `Insufficient Balance! You need ₹${needed.toFixed(2)} more.`, true);

        const text = `⚠️ <b>INSUFFICIENT WALLET BALANCE</b>\n\n` +
          `You are trying to purchase: <b>${product.panel_name} (${product.name})</b>\n` +
          `💵 Item Price: <b>₹${userPrice}</b>\n` +
          `💳 Your Current Balance: <b>₹${user.balance.toFixed(2)}</b>\n` +
          `🔻 Balance Needed: <b>₹${needed.toFixed(2)}</b>\n\n` +
          `Please top up your wallet via FamPay UPI or Crypto to complete your order.`;

        const keyboard = {
          inline_keyboard: [
            [{ text: '💳 Add Balance via FamPay UPI', callback_data: 'add_balance', style: 'success' }],
            [{ text: '🔙 Back to Product', callback_data: `prod_${product.id}`, style: 'danger' }]
          ]
        };
        await this.editMessageText(chatId, messageId, text, keyboard);
        return;
      }

      if (product.requires_android_id) {
        dbStore.setFsmState(user.user_id, 'wait_for_android_id', {
          productId: product.id,
          userPrice
        });

        const promptText = `📱 <b>DEVICE HWID REQUIRED (V1 BIND)</b>\n\n` +
          `The selected package (<b>${product.panel_name} - ${product.name}</b>) requires your Android Device ID to bind the license key.\n\n` +
          `👉 <b>Please reply to this chat with your 16-character Android ID:</b>\n` +
          `<i>(Example: <code>0b9b969bc2e7997b</code>)</i>\n\n` +
          `<i>Type /cancel anytime to abort.</i>`;

        const cancelKb = {
          inline_keyboard: [
            [{ text: '❌ Cancel Purchase', callback_data: `prod_${product.id}`, style: 'danger' }]
          ]
        };

        await this.editMessageText(chatId, messageId, promptText, cancelKb);
        return;
      }

      await this.executeProductDelivery(chatId, user, product, userPrice, messageId);
      return;
    }

    if (data === 'profile' || data === 'menu_profile' || data === 'user_balance') {
      await this.sendProfileMessage(chatId, user, messageId);
      return;
    }

    if (data === 'add_balance' || data === 'menu_add_balance' || data === 'gateway_inr' || data === 'deposit') {
      await this.sendAddBalanceMenu(chatId, user, messageId);
      return;
    }

    if (data.startsWith('check_order_') || data.startsWith('verify_')) {
      const orderId = data.replace('check_order_', '').replace('verify_', '');
      await this.answerCallback(cb.id, '🔄 Checking payment status...', false);

      const statusRes = await famGateway.checkOrderStatus(orderId);
      if (statusRes.isPaid) {
        await famGateway.processSuccessfulPayment(orderId, statusRes.amount);
        const updatedUser = dbStore.getUser(user.user_id) || user;
        await this.answerCallback(cb.id, '🎉 Payment Verified! Balance added to your wallet.', true);
        await this.sendProfileMessage(chatId, updatedUser, messageId);
      } else {
        await this.sendMessage(
          chatId,
          `⏳ <b>Payment Status: Pending / Verifying...</b>\n\n` +
          `Order ID: <code>${orderId}</code>\n\n` +
          `Please complete the UPI transfer in your UPI app. The payment is verified automatically!`,
          {
            inline_keyboard: [
              [{ text: '🔄 Check & Auto-Confirm Payment', callback_data: `check_order_${orderId}`, style: 'success' }],
              [{ text: '❌ Cancel The Payment', callback_data: 'main_menu', style: 'danger' }]
            ]
          }
        );
      }
      return;
    }

    if (data.startsWith('submit_utr_')) {
      const orderId = data.replace('submit_utr_', '');
      const txn = dbStore.getData().transactions.find(t => t.order_id === orderId);
      const amount = txn?.amount_inr || 100;

      dbStore.setFsmState(user.user_id, 'wait_for_utr', { orderId, amount });
      await this.sendMessage(
        chatId,
        `📝 <b>SUBMIT 12-DIGIT UPI REFERENCE / UTR NUMBER</b>\n\n` +
        `Order ID: <code>${orderId}</code>\n` +
        `Amount: <b>₹${amount.toFixed(2)}</b>\n\n` +
        `👇 <b>Please reply with your 12-digit UTR Number from your payment receipt:</b>\n` +
        `• <b>PhonePe:</b> UTR / Transaction ID (12 digits)\n` +
        `• <b>Google Pay:</b> UPI Transaction ID (12 digits)\n` +
        `• <b>Paytm:</b> UPI Ref No (12 digits)\n` +
        `• <b>FamPay:</b> Reference ID (12 digits)\n\n` +
        `<i>Example: <code>428912345678</code>\nSend /cancel to abort.</i>`,
        {
          inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'main_menu' }]]
        }
      );
      return;
    }

    if (data.startsWith('pay_') || data.startsWith('dep_') || data === 'custom_deposit_keypad') {
      const amountStr = data.replace('pay_', '').replace('dep_', '');
      if (amountStr === 'custom' || data === 'custom_deposit_keypad') {
        dbStore.setFsmState(user.user_id, 'wait_for_custom_balance', { amount_str: '0' });
        await this.sendCustomAmountKeypad(chatId, user, '0', messageId);
        return;
      }

      const amount = parseFloat(amountStr);
      await this.sendPaymentInstructions(chatId, user, amount, messageId);
      return;
    }

    // Keypad actions for Custom Amount
    if (data.startsWith('kp_')) {
      const action = data.replace('kp_', '');
      const fsm = dbStore.getFsmState(user.user_id);
      let amountStr = (fsm && fsm.data && fsm.data.amount_str !== undefined) ? String(fsm.data.amount_str) : '0';

      if (action === 'quick_amounts') {
        dbStore.setFsmState(user.user_id, 'idle');
        await this.sendAddBalanceMenu(chatId, user, messageId);
        return;
      }

      if (action === 'confirm') {
        const amt = parseFloat(amountStr);
        const minDeposit = this.getMinDeposit();
        const maxDeposit = this.getMaxDeposit();

        if (isNaN(amt) || amt <= 0) {
          await this.answerCallback(cb.id, '⚠️ Please enter an amount using the keypad.', true);
          return;
        }
        if (amt < minDeposit) {
          await this.answerCallback(cb.id, `❌ Minimum deposit is ₹${minDeposit.toFixed(2)}`, true);
          return;
        }
        if (amt > maxDeposit) {
          await this.answerCallback(cb.id, `❌ Maximum deposit is ₹${maxDeposit.toLocaleString('en-IN')}`, true);
          return;
        }

        dbStore.setFsmState(user.user_id, 'idle');
        await this.sendPaymentInstructions(chatId, user, amt, messageId);
        return;
      }

      if (action === 'back' || action === 'backspace') {
        amountStr = amountStr.length > 1 ? amountStr.slice(0, -1) : '0';
      } else if (action === 'clear') {
        amountStr = '0';
      } else {
        if (amountStr === '0') {
          amountStr = action;
        } else if (amountStr.length < 6) {
          amountStr += action;
        }
      }

      dbStore.setFsmState(user.user_id, 'wait_for_custom_balance', { amount_str: amountStr });
      await this.sendCustomAmountKeypad(chatId, user, amountStr, messageId);
      await this.answerCallback(cb.id, `Amount: ₹${amountStr}`);
      return;
    }

    if (data === 'reseller_panel') {
      await this.sendResellerMenu(chatId, user, messageId);
      return;
    }

    if (data === 'reseller_upgrade') {
      const setupFee = settings.reseller_setup_fee || 500;

      if (user.is_reseller === 1) {
        await this.answerCallback(cb.id, 'You are already an authorized Wholesale Reseller!', true);
        return;
      }

      if (user.balance < setupFee) {
        await this.answerCallback(cb.id, `You need ₹${setupFee} in your wallet for the setup fee.`, true);
        return;
      }

      user.balance -= setupFee;
      user.is_reseller = 1;
      user.account_type = 'Reseller';
      dbStore.updateUser(user.user_id, {
        is_reseller: 1,
        account_type: 'Reseller',
        balance: user.balance
      });
      dbStore.logActivity(user.user_id, 'UPGRADE_RESELLER', 'Upgraded to Wholesale Reseller');

      await this.answerCallback(cb.id, '🎉 Congratulations! Wholesale Reseller status activated.', true);
      await this.sendResellerMenu(chatId, user, messageId);
      return;
    }

    if (data === 'referral_menu' || data === 'referral') {
      await this.sendReferralMenu(chatId, user, messageId);
      return;
    }

    if (data === 'redeem_code') {
      dbStore.setFsmState(user.user_id, 'wait_for_redeem');
      await this.editMessageText(
        chatId,
        messageId,
        `🎁 <b>REDEEM PROMO / VOUCHER CODE</b>\n\n` +
        `Please send your voucher or promo code in chat:\n\n` +
        `<i>Example: <code>KALAM50</code> or <code>FREESTORE</code></i>\n\n` +
        `Send /cancel to return to main menu.`,
        {
          inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'main_menu', style: 'danger' }]]
        }
      );
      return;
    }

    if (data === 'support_menu') {
      const apkUrl = settings.apk_channel_link || 'https://t.me/KalamFFPanelAPKs';
      const channelUrl = settings.official_channel_link || 'https://t.me/KalamFFPanelChannel';

      const text = `🎧 <b>KALAM FF PANEL - 24/7 SUPPORT & CHANNELS</b>\n\n` +
        `Need assistance with key activation, installation, or payments?\n\n` +
        `📲 <b>APK Download Channel:</b> <a href="${apkUrl}">${apkUrl}</a>\n` +
        `📢 <b>Official Channel:</b> <a href="${channelUrl}">${channelUrl}</a>\n` +
        `💬 <b>Direct Telegram Support:</b> <a href="${settings.support_telegram}">${settings.support_telegram}</a>\n` +
        `📱 <b>WhatsApp Support:</b> <a href="${settings.support_whatsapp}">${settings.support_whatsapp}</a>\n` +
        `🎥 <b>Video Tutorial:</b> <a href="${settings.how_to_video}">${settings.how_to_video}</a>\n\n` +
        `Or create an in-bot ticket below:`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '📲 APK Channel', url: apkUrl, style: 'primary' },
            { text: '📢 Official Channel', url: channelUrl, style: 'primary' }
          ],
          [
            { text: '💬 Telegram Support', url: settings.support_telegram || 'https://t.me', style: 'primary' },
            { text: '📱 WhatsApp Support', url: settings.support_whatsapp || 'https://wa.me', style: 'primary' }
          ],
          [{ text: '📩 Open Support Ticket', callback_data: 'ticket_create', style: 'success' }],
          [{ text: '🔙 Back to Menu', callback_data: 'main_menu', style: 'danger' }]
        ]
      };
      await this.editMessageText(chatId, messageId, text, keyboard);
      return;
    }

    if (data === 'ticket_create') {
      dbStore.setFsmState(user.user_id, 'wait_for_ticket');
      await this.editMessageText(
        chatId,
        messageId,
        `📝 <b>CREATE SUPPORT TICKET</b>\n\n` +
        `Please type your question or issue in your next message. Our team will be notified immediately on Telegram and in the Admin Hub.\n\n` +
        `<i>Send /cancel to abort.</i>`,
        {
          inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'main_menu', style: 'danger' }]]
        }
      );
      return;
    }

    if (data === 'how_to_use') {
      const apkUrl = settings.apk_channel_link || 'https://t.me/KalamFFPanelAPKs';
      const tutorialUrl = settings.how_to_video || 'https://youtube.com';

      const text = `📖 <b>HOW TO INSTALL & USE KALAM FF PANEL</b>\n\n` +
        `1️⃣ <b>Purchase:</b> Buy your preferred panel from 🛒 <b>Product Store</b>.\n` +
        `2️⃣ <b>Download APK:</b> Click the APK Channel link below.\n` +
        `3️⃣ <b>Install:</b> Allow unknown sources and install the APK.\n` +
        `4️⃣ <b>Login:</b> Open the app, paste your delivered License Key, and click Login.\n` +
        `5️⃣ <b>Launch Free Fire:</b> Enable desired features (Aimbot, ESP, Location) and launch the game.\n\n` +
        `📲 <b>APK Channel:</b> <a href="${apkUrl}">${apkUrl}</a>\n` +
        `🎥 <b>Watch Full Video Guide:</b> <a href="${tutorialUrl}">${tutorialUrl}</a>`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '⬇️ Open APK Channel', url: apkUrl, style: 'primary' },
            { text: '🎥 Video Tutorial', url: tutorialUrl, style: 'primary' }
          ],
          [{ text: '🛒 Open Store', callback_data: 'shop_categories', style: 'success' }],
          [{ text: '🔙 Back to Menu', callback_data: 'main_menu', style: 'danger' }]
        ]
      };
      await this.editMessageText(chatId, messageId, text, keyboard);
      return;
    }

    if (data === 'admin_panel' || data === 'admin_refresh') {
      if (this.isAdmin(user, chatId)) {
        await this.sendAdminPanel(chatId, user, messageId);
      } else {
        await this.answerCallback(cb.id, '⛔ Master admin access denied!', true);
      }
      return;
    }

    if (data === 'admin_add_bal') {
      if (!this.isAdmin(user, chatId)) {
        await this.answerCallback(cb.id, '⛔ Admin only', true);
        return;
      }
      dbStore.setFsmState(user.user_id, 'admin_wait_add_bal');
      await this.editMessageText(
        chatId,
        messageId,
        `💳 <b>+ ADD BALANCE TO USER</b>\n\n` +
        `👇 <b>Reply with User ID and Amount (and optional reason):</b>\n\n` +
        `<code>&lt;User_ID&gt; &lt;Amount&gt; [Reason]</code>\n\n` +
        `📌 <b>Example:</b>\n` +
        `<code>${chatId} 500 Payment confirmation</code>\n\n` +
        `<i>Send /cancel to abort.</i>`,
        { inline_keyboard: [[{ text: '🔙 Back to Admin', callback_data: 'admin_panel' }]] }
      );
      return;
    }

    if (data === 'admin_ded_bal') {
      if (!this.isAdmin(user, chatId)) {
        await this.answerCallback(cb.id, '⛔ Admin only', true);
        return;
      }
      dbStore.setFsmState(user.user_id, 'admin_wait_ded_bal');
      await this.editMessageText(
        chatId,
        messageId,
        `🔻 <b>- DEDUCT BALANCE FROM USER</b>\n\n` +
        `👇 <b>Reply with User ID and Amount (and optional reason):</b>\n\n` +
        `<code>&lt;User_ID&gt; &lt;Amount&gt; [Reason]</code>\n\n` +
        `📌 <b>Example:</b>\n` +
        `<code>${chatId} 150 Refund adjustment</code>\n\n` +
        `<i>Send /cancel to abort.</i>`,
        { inline_keyboard: [[{ text: '🔙 Back to Admin', callback_data: 'admin_panel' }]] }
      );
      return;
    }

    if (data === 'admin_users') {
      if (!this.isAdmin(user, chatId)) return;
      const allUsers = dbStore.getData().users;
      const totalBal = allUsers.reduce((a, b) => a + b.balance, 0);
      let userListText = `👥 <b>ACTIVE SYSTEM USERS (${allUsers.length})</b>\n💰 Total User Funds: ₹${totalBal.toFixed(2)}\n━━━━━━━━━━━━━━━━━━\n`;
      allUsers.slice(0, 10).forEach(u => {
        userListText += `• <b>${u.first_name}</b> (@${u.username || 'none'})\n  🆔 <code>${u.user_id}</code> | 💰 ₹${u.balance.toFixed(2)} | 🛒 ${u.orders_count} orders\n`;
      });
      if (allUsers.length > 10) userListText += `\n<i>...and ${allUsers.length - 10} more in Web Admin Hub.</i>`;
      await this.editMessageText(chatId, messageId, userListText, {
        inline_keyboard: [
          [{ text: '🚀 Open Web Admin Hub', web_app: { url: this.getWebAppUrl() } }],
          [{ text: '💳 + Add Balance', callback_data: 'admin_add_bal' }, { text: '🔻 - Deduct Balance', callback_data: 'admin_ded_bal' }],
          [{ text: '🔙 Back to Admin Terminal', callback_data: 'admin_panel' }]
        ]
      });
      return;
    }

    if (data === 'admin_stock') {
      if (!this.isAdmin(user, chatId)) return;
      const d = dbStore.getData();
      const prods = d.products;
      const unusedKeys = d.productKeys.filter(k => k.is_used === 0);
      let stockMsg = `📦 <b>CATALOG & VAULT STOCK</b>\n━━━━━━━━━━━━━━━━━━\n`;
      prods.forEach(p => {
        const avail = unusedKeys.filter(k => k.product_id === p.id).length;
        stockMsg += `• <b>${p.panel_name} (${p.name})</b>\n  Price: ₹${p.price_inr} | Stock: <b>${avail} ready</b>\n`;
      });
      await this.editMessageText(chatId, messageId, stockMsg, {
        inline_keyboard: [
          [{ text: '🚀 Manage in Web Admin Hub', web_app: { url: this.getWebAppUrl() } }],
          [{ text: '🔙 Back to Admin Terminal', callback_data: 'admin_panel' }]
        ]
      });
      return;
    }

    if (data === 'admin_tickets') {
      if (!this.isAdmin(user, chatId)) return;
      const tickets = dbStore.getData().tickets;
      const open = tickets.filter(t => t.status === 'Open');
      let ticketMsg = `🎫 <b>SUPPORT TICKETS (${open.length} OPEN / ${tickets.length} TOTAL)</b>\n━━━━━━━━━━━━━━━━━━\n`;
      if (open.length === 0) {
        ticketMsg += `<i>All customer inquiries resolved! Zero open tickets.</i>`;
      } else {
        open.slice(0, 5).forEach(t => {
          ticketMsg += `• <b>Ticket #${t.id}</b> from User <code>${t.user_id}</code>:\n  "${t.message.substring(0, 60)}"\n  <i>Reply with: /reply_${t.user_id}_YourReply</i>\n\n`;
        });
      }
      await this.editMessageText(chatId, messageId, ticketMsg, {
        inline_keyboard: [
          [{ text: '🚀 Manage Tickets in Web Hub', web_app: { url: this.getWebAppUrl() } }],
          [{ text: '🔙 Back to Admin Terminal', callback_data: 'admin_panel' }]
        ]
      });
      return;
    }

    if (data === 'admin_broadcast') {
      if (!this.isAdmin(user, chatId)) return;
      dbStore.setFsmState(user.user_id, 'admin_wait_broadcast');
      await this.editMessageText(
        chatId,
        messageId,
        `📢 <b>SYSTEM-WIDE BROADCAST</b>\n\n` +
        `Send your broadcast text message now. It will be pushed in real-time to all registered bot users.\n\n` +
        `<i>Send /cancel to abort.</i>`,
        { inline_keyboard: [[{ text: '🔙 Back to Admin Terminal', callback_data: 'admin_panel' }]] }
      );
      return;
    }

    if (data === 'admin_toggle_maint') {
      if (!this.isAdmin(user, chatId)) return;
      const newStatus = settings.bot_status === 'ON' ? 'OFF' : 'ON';
      dbStore.updateSettings({ bot_status: newStatus });
      await this.answerCallback(cb.id, `Bot status set to ${newStatus}`, true);
      await this.sendAdminPanel(chatId, user, messageId);
      return;
    }

    if (data === 'admin_delete_commands') {
      if (!this.isAdmin(user, chatId)) return;
      await this.deleteMyCommands();
      await this.answerCallback(cb.id, '✅ All Telegram Bot Menu Commands Cleared!', true);
      await this.sendMessage(
        chatId,
        `🧹 <b>BOT MENU COMMANDS DELETED!</b>\n\n` +
        `All registered Telegram bot menu commands have been removed from Telegram servers.\n` +
        `Users will no longer see old slash commands in their Telegram chat menu button.`,
        { inline_keyboard: [[{ text: '🔙 Back to Admin Terminal', callback_data: 'admin_panel' }]] }
      );
      return;
    }

    if (data === 'admin_sync_commands') {
      if (!this.isAdmin(user, chatId)) return;
      dbStore.updateSettings({ bot_commands_enabled: true });
      await this.syncBotCommands();
      await this.answerCallback(cb.id, '✅ Telegram Bot Menu Commands Synced & Updated!', true);
      await this.sendMessage(
        chatId,
        `🔄 <b>BOT MENU COMMANDS RESET & SYNCED!</b>\n\n` +
        `Clean, official commands set in Telegram:\n` +
        `• /start - Launch Shop & Main Menu\n` +
        `• /shop - Store Catalog & Duration Plans\n` +
        `• /addbalance - Add Wallet Balance\n` +
        `• /profile - My Profile & Keys\n` +
        `• /reseller - Reseller Wholesale\n` +
        `• /referral - Refer & Earn\n` +
        `• /help - Support & Tickets`,
        { inline_keyboard: [[{ text: '🔙 Back to Admin Terminal', callback_data: 'admin_panel' }]] }
      );
      return;
    }
  }

  private getWelcomeText(user: User): string {
    const settings = dbStore.getData().settings;
    if (this.isMaintenanceModeActive() && !this.isAdmin(user, user.user_id)) {
      const customTitle = settings.maintenance_message || '🛠 BOT UNDER MAINTENANCE';
      const customReason = settings.maintenance_reason || 'We are currently fixing technical issues & upgrading server infrastructure.';
      return `🚧 <b><u>${customTitle.toUpperCase()}</u></b> 🚧\n━━━━━━━━━━━━━━━━━━━━\n` +
        `⚠️ <b>Notice:</b> ${customReason}\n\n` +
        `⏱ <b>Status:</b> Temporary Service Downtime / Maintenance Mode Active\n` +
        `📢 <i>Please check back shortly or stay tuned to our official support channel for updates.</i>`;
    }

    const tier = user.is_reseller === 1 ? '🌟 Wholesale Reseller' : '👤 Regular Member';

    return `⚡ <b>WELCOME TO KALAM FF PANEL STORE</b> ⚡\n\n` +
      `👋 Hello, <b>${user.first_name}</b>!\n` +
      `🆔 <b>Telegram ID:</b> <code>${user.user_id}</code>\n` +
      `🎖 <b>Account Tier:</b> <b>${tier}</b>\n` +
      `💰 <b>Wallet Balance:</b> <b>₹${user.balance.toFixed(2)}</b>\n\n` +
      `🚀 <b>Instant Key Delivery System:</b>\n` +
      `• Premium Free Fire Injector & Menu Panels\n` +
      `• Android Non-Root, Root & PC Emulators\n` +
      `• Instant FamPay UPI & Crypto Wallet Top-ups\n` +
      `• 100% Anti-Ban Protection & Auto Key Dispenser\n\n` +
      `<i>Select an option below to proceed:</i>`;
  }

  private getMainMenuKeyboard(user: User) {
    const settings = dbStore.getData().settings;
    if (this.isMaintenanceModeActive() && !this.isAdmin(user, user.user_id)) {
      const kb: any[] = [];
      if (settings.support_telegram) {
        kb.push([{ text: '💬 Official Support Channel', url: settings.support_telegram }]);
      }
      if (settings.official_channel_link) {
        kb.push([{ text: '📢 News Channel', url: settings.official_channel_link }]);
      }
      return { inline_keyboard: kb };
    }

    const buttons: any[] = [
      [
        { text: '🛒 Buy Now', callback_data: 'shop_categories', style: 'danger' }
      ],
      [
        { text: 'Check Update', callback_data: 'check_update', style: 'success' },
        { text: '💸 Add Balance', callback_data: 'add_balance', style: 'success' }
      ],
      [
        { text: '👑 My Profile + All History', callback_data: 'profile', style: 'success' }
      ],
      [
        { text: '🔗 Refer And Earn', callback_data: 'referral_menu', style: 'success' },
        { text: '⁉️ How To Use Bot', callback_data: 'how_to_use', style: 'success' }
      ],
      [
        { text: 'Support', callback_data: 'support_menu', style: 'danger' },
        { text: '🎁 Daily Gift', callback_data: 'daily_gift', style: 'success' }
      ]
    ];

    if (user.is_reseller === 1) {
      buttons.push([
        { text: '🌟 Reseller Panel', callback_data: 'reseller_panel', style: 'primary' }
      ]);
    }

    if (this.isAdmin(user, user.user_id)) {
      buttons.push([
        { text: '⚙️ Master Admin Terminal (@admin)', callback_data: 'admin_panel', style: 'danger' }
      ]);
    }

    return { inline_keyboard: buttons };
  }

  private async sendWelcomeMessage(chatId: number, user: User) {
    await this.sendMessage(chatId, this.getWelcomeText(user), this.getMainMenuKeyboard(user));
  }

  private async sendShopCategories(chatId: number, user: User, messageId?: number) {
    const allActiveProds = dbStore.getData().products.filter(p => p.is_active !== 0);
    const uniqueCats = Array.from(new Set(allActiveProds.map(p => (p.category || '').trim()).filter(Boolean)));

    if (allActiveProds.length === 0) {
      const emptyText = `🛒 <b>KALAM FF PANEL - STORE CATALOG</b>\n\n` +
        `📦 No products are currently available in the catalog.\n` +
        `Please check back soon or contact support!`;
      const emptyKb = {
        inline_keyboard: [
          [{ text: '🏠 Main Menu', callback_data: 'main_menu', style: 'danger' }]
        ]
      };
      if (messageId) {
        await this.editMessageText(chatId, messageId, emptyText, emptyKb);
      } else {
        await this.sendMessage(chatId, emptyText, emptyKb);
      }
      return;
    }

    const text = `🛒 <b>KALAM FF PANEL - STORE CATALOG</b>\n\n` +
      `Select your desired operating environment and panel category below:\n\n` +
      `🔹 <b>Android Non-Root:</b> Easy APK install, zero root required, 100% safe\n` +
      `🔸 <b>Android Root:</b> Maximum performance, memory injection, bypass features\n` +
      `💻 <b>PC Emulator:</b> High FPS, full emulator compatibility (BlueStacks/LDPlayer)`;

    const hasNonRoot = allActiveProds.some(p => isCategoryMatch(p.category, 'nonroot'));
    const hasRoot = allActiveProds.some(p => isCategoryMatch(p.category, 'root') && !isCategoryMatch(p.category, 'nonroot'));
    const hasPc = allActiveProds.some(p => isCategoryMatch(p.category, 'pc'));

    const inline_keyboard: any[][] = [
      [{ text: '🛍️ All Products Catalog', callback_data: 'cat_all', style: 'primary' }]
    ];

    if (hasNonRoot) {
      inline_keyboard.push([{ text: '📱 Android Non-Root Panel', callback_data: 'cat_nonroot', style: 'success' }]);
    }
    if (hasRoot) {
      inline_keyboard.push([{ text: '⚡ Android Root Panel', callback_data: 'cat_root', style: 'success' }]);
    }
    if (hasPc) {
      inline_keyboard.push([{ text: '💻 PC Emulator Panel', callback_data: 'cat_pc', style: 'success' }]);
    }

    // Add dynamic category buttons for custom categories added by user/admin
    for (const cat of uniqueCats) {
      if (!isCategoryMatch(cat, 'nonroot') && !isCategoryMatch(cat, 'root') && !isCategoryMatch(cat, 'pc')) {
        inline_keyboard.push([
          { text: `📦 ${cat.toUpperCase()}`, callback_data: `cat_${encodeURIComponent(cat)}`, style: 'primary' }
        ]);
      }
    }

    inline_keyboard.push([{ text: '🔙 Back to Menu', callback_data: 'main_menu', style: 'danger' }]);
    if (messageId) {
      await this.editMessageText(chatId, messageId, text, { inline_keyboard });
    } else {
      await this.sendMessage(chatId, text, { inline_keyboard });
    }
  }

  public async getUserProfilePhotoFileId(userId: number): Promise<string | null> {
    try {
      const photosRes = await this.callApi('getUserProfilePhotos', { user_id: userId, limit: 1 });
      if (photosRes && photosRes.photos && photosRes.photos.length > 0) {
        const photos = photosRes.photos[0];
        const largestPhoto = photos[photos.length - 1];
        if (largestPhoto && largestPhoto.file_id) {
          return largestPhoto.file_id;
        }
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  public async getUserProfilePhotoUrl(userId: number): Promise<string | null> {
    try {
      const photosRes = await this.callApi('getUserProfilePhotos', { user_id: userId, limit: 1 });
      if (photosRes && photosRes.photos && photosRes.photos.length > 0) {
        const photos = photosRes.photos[0];
        const largestPhoto = photos[photos.length - 1];
        if (largestPhoto && largestPhoto.file_id) {
          const fileRes = await this.callApi('getFile', { file_id: largestPhoto.file_id });
          if (fileRes && fileRes.file_path) {
            const token = this.getValidTokenFromStore();
            return `https://api.telegram.org/file/bot${token}/${fileRes.file_path}`;
          }
        }
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  private async sendProfileMessage(chatId: number, user: User, messageId?: number) {
    const orders = dbStore.getData().orders.filter(o => o.user_id === user.user_id);
    const tier = user.is_reseller === 1 ? '🌟 Wholesale Reseller' : '👤 Regular Customer';

    let keysText = '';
    if (orders.length > 0) {
      keysText = `\n\n🔑 <b>RECENT PURCHASED KEYS (Click to Copy):</b>\n` +
        orders.slice(0, 5).map(o => `• <b>${o.product_name}</b>\n  <code>${o.delivered_key}</code> (${o.purchase_date})`).join('\n');
    } else {
      keysText = `\n\n<i>You have not purchased any keys yet. Visit the Product Store to get started!</i>`;
    }

    // Try getting user's direct Telegram profile photo file_id or profile photo URL
    let photoSource: string | null = await this.getUserProfilePhotoFileId(user.user_id).catch(() => null);

    if (!photoSource) {
      photoSource = await this.getUserProfilePhotoUrl(user.user_id).catch(() => null);
    }

    if (!photoSource) {
      photoSource = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name)}&background=0D8ABC&color=fff&size=512&bold=true`;
    } else {
      user.avatar_url = photoSource;
      dbStore.updateUser(user.user_id, { avatar_url: photoSource });
    }

    const text = `👤 <b>USER ACCOUNT PROFILE</b>\n\n` +
      `🆔 <b>Telegram ID:</b> <code>${user.user_id}</code>\n` +
      `📛 <b>Name:</b> ${user.first_name} (@${user.username || 'none'})\n` +
      `🎖 <b>Account Tier:</b> <b>${tier}</b>\n` +
      `💰 <b>Wallet Balance:</b> <b>₹${user.balance.toFixed(2)}</b>\n` +
      `📊 <b>Total Orders:</b> ${orders.length}\n` +
      `💸 <b>Total Spent:</b> ₹${user.spent.toFixed(2)}\n` +
      `👥 <b>Friends Referred:</b> ${user.referral_count || 0} (Earned: ₹${(user.referral_earnings || 0).toFixed(2)})` + keysText;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '💳 Add Balance', callback_data: 'add_balance', style: 'success' },
          { text: '🛒 Buy Now', callback_data: 'shop_categories', style: 'danger' }
        ],
        [
          { text: '👥 Refer & Earn', callback_data: 'referral_menu', style: 'success' },
          { text: '🎁 Redeem Code', callback_data: 'redeem_code', style: 'danger' }
        ],
        [
          { text: '🔙 Back to Menu', callback_data: 'main_menu', style: 'danger' }
        ]
      ]
    };

    if (messageId) {
      try {
        await this.editMessageMedia(chatId, messageId, photoSource, text, keyboard);
        return;
      } catch (e) {
        // Fallback: If Telegram cannot convert text msg into media msg in-place, delete text msg & send photo msg
        await this.deleteMessage(chatId, messageId).catch(() => {});
      }
    }

    await this.sendPhoto(chatId, photoSource, text, keyboard);
  }

  private async sendAddBalanceMenu(chatId: number, user: User, messageId?: number) {
    const minDeposit = this.getMinDeposit();
    const maxDeposit = this.getMaxDeposit();

    const text = `💳 <b>ADD WALLET BALANCE (FAMGATEWAY.IN)</b>\n\n` +
      `⚡ <b>Instant Automated UPI Deposits powered by FamGateway.in</b>\n` +
      `Supported: PhonePe, Google Pay, Paytm, FamPay & BHIM UPI.\n\n` +
      `💵 <b>Current Balance:</b> <b>₹${user.balance.toFixed(2)}</b>\n` +
      `📊 <b>Deposit Limits:</b> <b>Min ₹${minDeposit}</b> • <b>Max ₹${maxDeposit.toLocaleString()}</b>\n\n` +
      `Select a quick deposit amount or enter a custom amount:`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '₹50', callback_data: 'pay_50', style: 'success' },
          { text: '₹100', callback_data: 'pay_100', style: 'success' },
          { text: '₹200', callback_data: 'pay_200', style: 'success' }
        ],
        [
          { text: '₹500', callback_data: 'pay_500', style: 'success' },
          { text: '₹1,000', callback_data: 'pay_1000', style: 'success' },
          { text: '₹2,000', callback_data: 'pay_2000', style: 'success' }
        ],
        [
          { text: '✏️ Enter Custom Amount', callback_data: 'pay_custom', style: 'primary' }
        ],
        [{ text: '🔙 Back to Menu', callback_data: 'main_menu', style: 'danger' }]
      ]
    };

    if (messageId) {
      await this.editMessageText(chatId, messageId, text, keyboard);
    } else {
      await this.sendMessage(chatId, text, keyboard);
    }
  }

  public async sendCustomAmountKeypad(chatId: number, user: User, amountStr: string = '0', messageId?: number) {
    const minDeposit = this.getMinDeposit();
    const maxDeposit = this.getMaxDeposit();
    const formattedMax = Number(maxDeposit).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    const text =
      `<blockquote>💰 ENTER CUSTOM AMOUNT 💰</blockquote>\n` +
      `❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n` +
      `Amount: ₹${amountStr}\n\n` +
      `Use the keypad below to enter amount or type directly in chat.\n\n` +
      `Min: 💰 ₹${Number(minDeposit).toFixed(2)} | Max: 💰 ₹${formattedMax}`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '1', callback_data: 'kp_1', style: 'success' },
          { text: '2', callback_data: 'kp_2', style: 'success' },
          { text: '3', callback_data: 'kp_3', style: 'success' }
        ],
        [
          { text: '4', callback_data: 'kp_4', style: 'success' },
          { text: '5', callback_data: 'kp_5', style: 'success' },
          { text: '6', callback_data: 'kp_6', style: 'success' }
        ],
        [
          { text: '7', callback_data: 'kp_7', style: 'success' },
          { text: '8', callback_data: 'kp_8', style: 'success' },
          { text: '9', callback_data: 'kp_9', style: 'success' }
        ],
        [
          { text: '❌ CLEAR', callback_data: 'kp_clear', style: 'danger' },
          { text: '0', callback_data: 'kp_0', style: 'success' },
          { text: '➡️ BACK', callback_data: 'kp_back', style: 'primary' }
        ],
        [
          { text: '✅ CONFIRM AMOUNT', callback_data: 'kp_confirm', style: 'success' }
        ],
        [
          { text: '🔙 Return to Quick Amounts', callback_data: 'kp_quick_amounts', style: 'danger' }
        ]
      ]
    };

    if (messageId) {
      await this.editMessageText(chatId, messageId, text, keyboard);
    } else {
      await this.sendMessage(chatId, text, keyboard);
    }
  }

  private async sendPaymentInstructions(chatId: number, user: User, amount: number, messageId?: number) {
    const minDeposit = this.getMinDeposit();
    const maxDeposit = this.getMaxDeposit();

    if (amount < minDeposit) {
      const errText = `⚠️ <b>MINIMUM DEPOSIT LIMIT: ₹${minDeposit}</b>\n\n` +
        `The minimum allowed deposit amount configured by the store owner is <b>₹${minDeposit}</b>.\n` +
        `You requested: <b>₹${amount}</b>\n\n` +
        `<i>Please choose an amount of ₹${minDeposit} or more.</i>`;
      const kb = {
        inline_keyboard: [
          [{ text: '💳 Add Balance', callback_data: 'add_balance' }],
          [{ text: '🔙 Main Menu', callback_data: 'main_menu' }]
        ]
      };
      if (messageId) {
        await this.editMessageText(chatId, messageId, errText, kb);
      } else {
        await this.sendMessage(chatId, errText, kb);
      }
      return;
    }

    if (amount > maxDeposit) {
      const errText = `⚠️ <b>MAXIMUM DEPOSIT LIMIT: ₹${maxDeposit.toLocaleString()}</b>\n\n` +
        `The maximum allowed deposit amount per transaction is <b>₹${maxDeposit.toLocaleString()}</b>.\n` +
        `You requested: <b>₹${amount.toLocaleString()}</b>\n\n` +
        `<i>Please choose an amount up to ₹${maxDeposit.toLocaleString()}.</i>`;
      const kb = {
        inline_keyboard: [
          [{ text: '💳 Add Balance', callback_data: 'add_balance' }],
          [{ text: '🔙 Main Menu', callback_data: 'main_menu' }]
        ]
      };
      if (messageId) {
        await this.editMessageText(chatId, messageId, errText, kb);
      } else {
        await this.sendMessage(chatId, errText, kb);
      }
      return;
    }

    const settings = dbStore.getData().settings;
    const redirectUrl = settings.famgateway_redirect_url || `https://t.me/${settings.bot_username || 'KalamFFPanelBot'}`;

    // 1. Create or register order in FamGateway & database
    const orderRes = await famGateway.createOrder({
      amount,
      userId: user.user_id,
      redirectUrl
    });

    const orderId = orderRes.order_id || `ORD_${user.user_id}_${Math.floor(Date.now() / 1000)}`;
    const upiId = famGateway.getUpiId();
    const payeeName = famGateway.getPayeeName();
    const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&tn=${encodeURIComponent(orderId)}&cu=INR`;

    // 2. Generate PNG QR Code Buffer (Native Buffer upload to Telegram)
    let qrBuffer: Buffer | null = null;
    try {
      qrBuffer = await QRCode.toBuffer(orderRes.payment_url || upiUri, {
        width: 500,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
    } catch (qrErr) {
      console.warn('QRCode buffer generation failed:', qrErr);
    }

    const publicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=10&data=${encodeURIComponent(orderRes.payment_url || upiUri)}`;

    const text = `⚡ <b>FAMGATEWAY.IN AUTOMATED UPI PAYMENT</b> ⚡\n\n` +
      `💰 <b>Amount to Pay:</b> <b>₹${amount.toFixed(2)}</b>\n` +
      `🆔 <b>Order ID:</b> <code>${orderId}</code>\n` +
      `🏦 <b>UPI ID (Tap to Copy):</b> <code>${upiId}</code>\n` +
      `👤 <b>Payee Name:</b> <b>${payeeName}</b>\n` +
      `🌐 <b>Gateway:</b> <b>FamGateway.in</b>\n` +
      `⏳ <b>Validity:</b> 15 Minutes (Auto-Verifying)\n\n` +
      `📱 <b>HOW TO PAY VIA FAMGATEWAY.IN:</b>\n` +
      `1️⃣ Open <b>PhonePe, Google Pay, Paytm, FamPay, or BHIM</b>.\n` +
      `2️⃣ Scan the QR Code image above OR pay to UPI ID <code>${upiId}</code>.\n` +
      `3️⃣ Pay exact amount: <b>₹${amount.toFixed(2)}</b>.\n` +
      `4️⃣ <b>FamGateway will AUTOMATICALLY credit your wallet</b> in seconds!\n\n` +
      `<i>👉 After paying, tap "🔄 Check & Auto-Confirm Payment" below.</i>`;

    const keyboardButtons: any[] = [];

    // Payment link button ONLY if it's a valid web URL (Telegram Bot API rejects upi:// in inline URL buttons)
    if (orderRes.payment_url && (orderRes.payment_url.startsWith('http://') || orderRes.payment_url.startsWith('https://'))) {
      keyboardButtons.push([
        { text: '🌐 Open FamGateway.in Checkout', url: orderRes.payment_url }
      ]);
    }

    keyboardButtons.push([
      { text: '🔄 Check & Auto-Confirm Payment', callback_data: `check_order_${orderId}`, style: 'success' }
    ]);

    keyboardButtons.push([
      { text: '❌ Cancel The Payment', callback_data: 'main_menu', style: 'danger' }
    ]);

    const keyboard = { inline_keyboard: keyboardButtons };

    // 3. Delete previous prompt message first to prevent duplicate messages
    if (messageId) {
      await this.deleteMessage(chatId, messageId).catch(() => {});
    }

    // 4. Attempt Delivery: Try sending actual generated QR Photo Buffer first
    if (qrBuffer) {
      try {
        await this.sendPhotoBuffer(chatId, qrBuffer, text, keyboard);
        return;
      } catch (bufErr: any) {
        console.warn('sendPhotoBuffer failed, trying ultra-fast QuickChart QR CDN:', bufErr.message);
      }
    }

    // 5. Fallback 1: QuickChart QR CDN (Highly reliable with Telegram servers)
    const quickChartUrl = `https://quickchart.io/qr?text=${encodeURIComponent(orderRes.payment_url || upiUri)}&size=500&margin=2`;
    try {
      await this.sendPhoto(chatId, quickChartUrl, text, keyboard);
      return;
    } catch (qcErr: any) {
      console.warn('QuickChart sendPhoto failed, trying QRServer CDN:', qcErr.message);
    }

    // 6. Fallback 2: QRServer CDN
    try {
      await this.sendPhoto(chatId, publicQrUrl, text, keyboard);
      return;
    } catch (urlErr: any) {
      console.warn('sendPhoto via QRServer failed, falling back to text:', urlErr.message);
    }

    // 7. Fallback 3: Text message
    await this.sendMessage(chatId, text, keyboard);
  }

  private async sendResellerMenu(chatId: number, user: User, messageId?: number) {
    const settings = dbStore.getData().settings;
    const setupFee = settings.reseller_setup_fee || 500;
    const minBalance = settings.reseller_min_balance || 1000;

    const statusBadge = user.is_reseller === 1 ? '✅ <b>Active Reseller</b>' : '❌ <i>Not Activated</i>';

    const text = `🌟 <b>KALAM FF PANEL - WHOLESALE RESELLER PROGRAM</b>\n\n` +
      `Status: ${statusBadge}\n\n` +
      `💼 <b>Reseller Benefits:</b>\n` +
      `• Up to <b>50% Wholesale Discount</b> on all panel keys\n` +
      `• Priority inventory access before public releases\n` +
      `• Unbranded keys & white-label APK loaders\n` +
      `• Dedicated 24/7 Reseller Telegram Support Line\n\n` +
      `📋 <b>Requirements:</b>\n` +
      `• Setup Activation Fee: <b>₹${setupFee}</b>\n` +
      `• Minimum Wallet Balance: <b>₹${minBalance}</b>\n` +
      `• Current Balance: <b>₹${user.balance.toFixed(2)}</b>`;

    const keyboard: any = {
      inline_keyboard: []
    };

    if (user.is_reseller === 0) {
      keyboard.inline_keyboard.push([
        { text: `⚡ Upgrade to Reseller (₹${setupFee})`, callback_data: 'reseller_upgrade', style: 'success' }
      ]);
    }

    keyboard.inline_keyboard.push([
      { text: '💳 Add Balance', callback_data: 'add_balance', style: 'success' },
      { text: '🔙 Back to Menu', callback_data: 'main_menu', style: 'danger' }
    ]);

    if (messageId) {
      await this.editMessageText(chatId, messageId, text, keyboard);
    } else {
      await this.sendMessage(chatId, text, keyboard);
    }
  }

  private async sendReferralMenu(chatId: number, user: User, messageId?: number) {
    const settings = dbStore.getData().settings;
    const botUsername = settings.bot_username || 'kalam_ff_bot';
    const cleanBotUsername = botUsername.replace(/^@/, '');
    const refLink = `https://t.me/${cleanBotUsername}?start=ref_${user.user_id}`;
    const refReward = Number(settings.referral_reward_inr) || 1.50;
    const commPercent = Number(settings.referral_commission_percent) || 5;
    const refereeBonus = Number(settings.referral_referee_bonus_inr) || 1.50;

    const text = `🎁 <b><u>REFER & EARN REWARDS PROGRAM</u></b> 👥\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 <b>Earn ₹${refReward.toFixed(2)} instant cash</b> for every active friend you invite!\n` +
      `📈 Plus get <b>${commPercent}% lifetime commission</b> on every recharge & purchase!\n` +
      `🎁 <b>Your invited friends receive ₹${refereeBonus.toFixed(2)}</b> welcome bonus!\n\n` +
      `🔗 <b>Your Exclusive Referral Link:</b>\n` +
      `<code>${refLink}</code>\n\n` +
      `📊 <b>Your Referral Performance:</b>\n` +
      `👥 Total Friends Invited: <b>${user.referral_count || 0}</b>\n` +
      `💵 Total Referral Earnings: <b>₹${(user.referral_earnings || 0).toFixed(2)}</b>\n` +
      `👛 Wallet Balance: <b>₹${user.balance.toFixed(2)}</b>\n\n` +
      `🚀 <i>Share your personal link to start earning real cash rewards instantly!</i>`;

    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent('🔥 Join Kalam FF Panel Bot for Free Fire VIP Injectors, Root/Non-Root Panels & instant key delivery!')}`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📤 Share Link with Friends', url: shareUrl, style: 'primary' }
        ],
        [
          { text: '💳 Add Balance', callback_data: 'add_balance', style: 'success' },
          { text: '🔙 Back to Menu', callback_data: 'main_menu', style: 'danger' }
        ]
      ]
    };

    if (messageId) {
      await this.editMessageText(chatId, messageId, text, keyboard);
    } else {
      await this.sendMessage(chatId, text, keyboard);
    }
  }

  private async sendSupportMenu(chatId: number, user: User, messageId?: number) {
    const settings = dbStore.getData().settings;
    const text = `🎧 <b>KALAM FF PANEL - 24/7 SUPPORT DESK</b>\n\n` +
      `Need assistance with key activation, installation, or payments?\n\n` +
      `💬 <b>Direct Telegram Support:</b> <a href="${settings.support_telegram}">${settings.support_telegram}</a>\n` +
      `📱 <b>WhatsApp Support:</b> <a href="${settings.support_whatsapp}">${settings.support_whatsapp}</a>\n` +
      `🎥 <b>Video Tutorial:</b> <a href="${settings.how_to_video}">${settings.how_to_video}</a>\n\n` +
      `Or create an in-bot ticket below:`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '📩 Open Support Ticket', callback_data: 'ticket_create', style: 'success' }],
        [{ text: '🔙 Back to Menu', callback_data: 'main_menu', style: 'danger' }]
      ]
    };
    if (messageId) {
      await this.editMessageText(chatId, messageId, text, keyboard);
    } else {
      await this.sendMessage(chatId, text, keyboard);
    }
  }

  private async sendHowToUse(chatId: number, user: User, messageId?: number) {
    const settings = dbStore.getData().settings;
    const text = `📖 <b>HOW TO INSTALL & USE KALAM FF PANEL</b>\n\n` +
      `1️⃣ <b>Purchase:</b> Buy your preferred panel from 🛒 <b>Product Store</b>.\n` +
      `2️⃣ <b>Download APK:</b> Click the download link provided with your key.\n` +
      `3️⃣ <b>Install:</b> Allow unknown sources and install the APK.\n` +
      `4️⃣ <b>Login:</b> Open the app, paste your delivered License Key, and click Login.\n` +
      `5️⃣ <b>Launch Free Fire:</b> Enable desired features (Aimbot, ESP, Location) and launch the game.\n\n` +
      `🎥 <b>Watch Full Video Guide:</b>\n<a href="${settings.how_to_video}">${settings.how_to_video}</a>`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🛒 Open Store', callback_data: 'shop_categories', style: 'success' }],
        [{ text: '🔙 Back to Menu', callback_data: 'main_menu', style: 'danger' }]
      ]
    };
    if (messageId) {
      await this.editMessageText(chatId, messageId, text, keyboard);
    } else {
      await this.sendMessage(chatId, text, keyboard);
    }
  }

  private async sendAdminPanel(chatId: number, user: User, messageId?: number) {
    const data = dbStore.getData();
    const settings = data.settings;
    const totalRevenue = data.users.reduce((acc, u) => acc + u.spent, 0);
    const totalUserBal = data.users.reduce((acc, u) => acc + u.balance, 0);
    const totalKeys = data.productKeys.filter(k => k.is_used === 0).length;
    const openTickets = data.tickets.filter(t => t.status === 'Open').length;
    const vipCount = data.users.filter(u => u.is_vip === 1).length;
    const resellerCount = data.users.filter(u => u.is_reseller === 1).length;
    const webAppUrl = this.getWebAppUrl();

    const text = `⚙️ <b>MASTER ADMINISTRATOR TERMINAL</b> ⚙️\n\n` +
      `👑 <b>Admin:</b> ${user.first_name} (@${user.username || 'admin'})\n` +
      `🆔 <b>Admin Chat ID:</b> <code>${chatId}</code>\n` +
      `🟢 <b>System Status:</b> <b>${settings.bot_status === 'ON' ? 'ONLINE & ACTIVE' : 'MAINTENANCE MODE'}</b>\n\n` +
      `📊 <b>LIVE SYSTEM METRICS:</b>\n` +
      `• Total Users: <b>${data.users.length}</b> (🌟 ${resellerCount} Resellers | 💎 ${vipCount} VIPs)\n` +
      `• Gross Sales: <b>₹${totalRevenue.toLocaleString()}</b>\n` +
      `• Total User Funds in Wallets: <b>₹${totalUserBal.toFixed(2)}</b>\n` +
      `• Keys in Vault: <b>${totalKeys} ready</b> (${data.products.length} Products)\n` +
      `• Total Orders Processed: <b>${data.orders.length}</b>\n` +
      `• Open Support Tickets: <b>${openTickets}</b>\n\n` +
      `⚡ <b>Quick Bot Slash Commands:</b>\n` +
      `• <code>/addproduct Category | Panel | Plan | Price | ResellerPrice</code>\n` +
      `• <code>/addkey Product_ID | Key1, Key2</code>\n` +
      `• <code>/addbalance &lt;user_id&gt; &lt;amount&gt;</code> - Credit wallet\n` +
      `• <code>/deduct &lt;user_id&gt; &lt;amount&gt;</code> - Deduct wallet\n` +
      `• <code>/users</code> - View active users & balances\n` +
      `• <code>/stock</code> - View product stock\n` +
      `• <code>/broadcast &lt;message&gt;</code> - Message all users\n\n` +
      `👇 <i>Use the interactive buttons below or launch the Full Web Admin Hub:</i>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🚀 Launch Admin Hub (Mini App)', web_app: { url: webAppUrl }, style: 'primary' }
        ],
        [
          { text: '🌐 Open Admin Hub in Browser', url: webAppUrl, style: 'primary' }
        ],
        [
          { text: '💳 + Add Balance', callback_data: 'admin_add_bal', style: 'success' },
          { text: '🔻 - Deduct Balance', callback_data: 'admin_ded_bal', style: 'danger' }
        ],
        [
          { text: '👥 View Users', callback_data: 'admin_users', style: 'primary' },
          { text: '📦 Products & Vault', callback_data: 'admin_stock', style: 'primary' }
        ],
        [
          { text: `🎫 Tickets (${openTickets})`, callback_data: 'admin_tickets', style: 'primary' },
          { text: '📢 Send Broadcast', callback_data: 'admin_broadcast', style: 'primary' }
        ],
        [
          {
            text: settings.bot_status === 'ON' ? '🟢 Bot: Online (Click to Pause)' : '🔴 Bot: Maintenance (Click to Resume)',
            callback_data: 'admin_toggle_maint',
            style: 'danger'
          }
        ],
        [
          { text: '🧹 Clear Bot Commands', callback_data: 'admin_delete_commands', style: 'danger' },
          { text: '🔄 Reset Bot Commands', callback_data: 'admin_sync_commands', style: 'primary' }
        ],
        [
          { text: '🔄 Refresh Terminal', callback_data: 'admin_refresh', style: 'success' },
          { text: '🔙 Main Menu', callback_data: 'main_menu', style: 'danger' }
        ]
      ]
    };

    if (messageId) {
      await this.editMessageText(chatId, messageId, text, keyboard);
    } else {
      await this.sendMessage(chatId, text, keyboard);
    }
  }

  /**
   * Broadcast message to users via live Telegram API (Supports Text, Photo, Video, Voice, Audio)
   */
  public async sendBroadcast(params: {
    targetAudience: string;
    text?: string;
    mediaType?: 'text' | 'photo' | 'video' | 'voice' | 'audio';
    mediaFileId?: string;
    mediaUrl?: string;
    imageUrl?: string;
    videoUrl?: string;
    voiceUrl?: string;
    audioUrl?: string;
    mediaBase64?: string;
    mediaFilename?: string;
    mediaMimeType?: string;
    buttonText?: string;
    buttonUrl?: string;
    pinMessage?: boolean;
    recipients: User[];
  }): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    const rawText = (params.text || '').trim();
    const formattedText = rawText ? `📢 <b>OFFICIAL ANNOUNCEMENT</b>\n\n${rawText}` : `📢 <b>OFFICIAL ANNOUNCEMENT</b>`;
    const keyboard: any = params.buttonText && params.buttonUrl ? {
      inline_keyboard: [[
        { text: params.buttonText, url: params.buttonUrl }
      ]]
    } : undefined;

    // Detect media type
    let mType: 'text' | 'photo' | 'video' | 'voice' | 'audio' = params.mediaType || 'text';
    if (!params.mediaType) {
      if (params.videoUrl || (params.mediaUrl && (params.mediaUrl.endsWith('.mp4') || params.mediaUrl.endsWith('.mov')))) {
        mType = 'video';
      } else if (params.voiceUrl || (params.mediaUrl && (params.mediaUrl.endsWith('.ogg') || params.mediaUrl.endsWith('.opus')))) {
        mType = 'voice';
      } else if (params.audioUrl || (params.mediaUrl && (params.mediaUrl.endsWith('.mp3') || params.mediaUrl.endsWith('.wav')))) {
        mType = 'audio';
      } else if (params.imageUrl || params.mediaUrl) {
        mType = 'photo';
      }
    }

    const mediaSource = params.mediaFileId || params.videoUrl || params.voiceUrl || params.audioUrl || params.imageUrl || params.mediaUrl;
    let cachedFileId: string | undefined = params.mediaFileId;

    for (const u of params.recipients) {
      if (!u.user_id) continue;
      try {
        let sentMsg: any;

        // Upload file directly if base64 provided and no cachedFileId yet
        if (params.mediaBase64 && !cachedFileId && mType !== 'text') {
          const apiMethod = mType === 'photo' ? 'sendPhoto' : mType === 'video' ? 'sendVideo' : mType === 'voice' ? 'sendVoice' : 'sendAudio';
          const field = mType === 'photo' ? 'photo' : mType === 'video' ? 'video' : mType === 'voice' ? 'voice' : 'audio';

          sentMsg = await this.callApiWithFile(
            apiMethod,
            {
              chat_id: u.user_id,
              caption: formattedText,
              parse_mode: 'HTML',
              reply_markup: keyboard
            },
            field,
            {
              base64: params.mediaBase64,
              filename: params.mediaFilename || `file_${Date.now()}`,
              mimeType: params.mediaMimeType
            }
          );

          // Cache the Telegram file_id for subsequent recipient broadcasts
          if (mType === 'photo' && sentMsg && sentMsg.photo && sentMsg.photo.length > 0) {
            cachedFileId = sentMsg.photo[sentMsg.photo.length - 1].file_id;
          } else if (mType === 'video' && sentMsg && sentMsg.video) {
            cachedFileId = sentMsg.video.file_id;
          } else if (mType === 'voice' && sentMsg && sentMsg.voice) {
            cachedFileId = sentMsg.voice.file_id;
          } else if (mType === 'audio' && sentMsg && sentMsg.audio) {
            cachedFileId = sentMsg.audio.file_id;
          }
        } else {
          // Send via cached file_id, media URL, or text
          const source = cachedFileId || mediaSource;
          if (mType === 'photo' && source) {
            sentMsg = await this.callApi('sendPhoto', {
              chat_id: u.user_id,
              photo: source.trim(),
              caption: formattedText,
              parse_mode: 'HTML',
              reply_markup: keyboard
            });
          } else if (mType === 'video' && source) {
            sentMsg = await this.callApi('sendVideo', {
              chat_id: u.user_id,
              video: source.trim(),
              caption: formattedText,
              parse_mode: 'HTML',
              reply_markup: keyboard
            });
          } else if (mType === 'voice' && source) {
            sentMsg = await this.callApi('sendVoice', {
              chat_id: u.user_id,
              voice: source.trim(),
              caption: formattedText,
              parse_mode: 'HTML',
              reply_markup: keyboard
            });
          } else if (mType === 'audio' && source) {
            sentMsg = await this.callApi('sendAudio', {
              chat_id: u.user_id,
              audio: source.trim(),
              caption: formattedText,
              parse_mode: 'HTML',
              reply_markup: keyboard
            });
          } else {
            sentMsg = await this.callApi('sendMessage', {
              chat_id: u.user_id,
              text: formattedText,
              parse_mode: 'HTML',
              reply_markup: keyboard,
              disable_web_page_preview: false
            });
          }
        }

        if (params.pinMessage && sentMsg && sentMsg.message_id) {
          try {
            await this.callApi('pinChatMessage', {
              chat_id: u.user_id,
              message_id: sentMsg.message_id,
              disable_notification: false
            });
          } catch {
            // Ignore pin failures
          }
        }

        sent++;
      } catch (e) {
        failed++;
      }
    }

    return { sent, failed };
  }

  /**
   * Helper to upload file buffer / base64 directly to Telegram Bot API
   */
  public async callApiWithFile(
    method: string,
    params: Record<string, any>,
    field: string,
    fileData: { base64: string; filename: string; mimeType?: string }
  ): Promise<any> {
    try {
      const activeToken = this.getValidTokenFromStore();
      if (!activeToken) return null;

      // Extract raw base64 content
      const base64Content = fileData.base64.includes(',')
        ? fileData.base64.split(',')[1]
        : fileData.base64;
      const buffer = Buffer.from(base64Content, 'base64');

      const boundary = `----TelegramBoundary${Date.now().toString(16)}`;
      let bodyParts: Buffer[] = [];

      // Add regular parameters
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        const stringVal = typeof value === 'object' ? JSON.stringify(value) : String(value);
        let header = `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${stringVal}\r\n`;
        bodyParts.push(Buffer.from(header, 'utf-8'));
      }

      // Add file payload
      const fileHeader = `--${boundary}\r\nContent-Disposition: form-data; name="${field}"; filename="${fileData.filename}"\r\nContent-Type: ${fileData.mimeType || 'application/octet-stream'}\r\n\r\n`;
      bodyParts.push(Buffer.from(fileHeader, 'utf-8'));
      bodyParts.push(buffer);
      bodyParts.push(Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8'));

      const fullBody = Buffer.concat(bodyParts);

      const res = await fetch(`https://api.telegram.org/bot${activeToken}/${method}`, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': String(fullBody.length)
        },
        body: fullBody
      });

      const json = await res.json();
      return json.ok ? json.result : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Set Bot Commands via Telegram API
   */
  public async setMyCommands(commands: Array<{ command: string; description: string }>): Promise<any> {
    const formatted = commands.map(c => ({
      command: c.command.toLowerCase().replace(/[^a-z0-9_]/g, ''),
      description: c.description.slice(0, 256)
    })).filter(c => c.command.length >= 1 && c.description.length >= 1);
    return await this.callApi('setMyCommands', { commands: formatted });
  }

  /**
   * Get Live Bot Commands from Telegram API
   */
  public async getMyCommands(): Promise<any> {
    return await this.callApi('getMyCommands');
  }
}

export const telegramEngine = new TelegramEngine();
