import { dbStore } from './storage';
import { Product, User, Order, Ticket } from '../src/types';
import { famGateway } from './famGateway';
import { bantiResellerService } from './bantiResellerApi';
import QRCode from 'qrcode';
import { apiLogger } from './apiLogger';

export interface BotStatus {
  isRunning: boolean;
  isConnected: boolean;
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

class TelegramEngine {
  private isRunning: boolean = false;
  private isConnected: boolean = false;
  private botInfo: any = null;
  private lastError: string | null = null;
  private lastPollTimestamp: string | null = null;
  private updatesProcessed: number = 0;
  private pollingAbortController: AbortController | null = null;
  private updateOffset: number = 0;
  private watchdogTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startWatchdog();
  }

  private startWatchdog() {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
    }
    // Auto-reconnect watchdog runs every 8 seconds
    this.watchdogTimer = setInterval(async () => {
      try {
        const token = dbStore.getData().settings.bot_token;
        if (!token || token.includes('exampleToken')) {
          return;
        }
        if (!this.isRunning) {
          console.log('🔄 Telegram Watchdog: Auto-reconnecting bot engine...');
          await this.start().catch((err: any) => {
            console.warn('Telegram Watchdog reconnect notice:', err.message);
          });
        }
      } catch (e: any) {
        console.warn('Telegram Watchdog loop notice:', e.message);
      }
    }, 8000);
  }

  public getStatus(): BotStatus {
    return {
      isRunning: this.isRunning,
      isConnected: this.isConnected,
      botInfo: this.botInfo,
      lastError: this.lastError,
      lastPollTimestamp: this.lastPollTimestamp,
      updatesProcessed: this.updatesProcessed
    };
  }

  public getWebAppUrl(): string {
    const settings = dbStore.getData().settings;
    if (settings.webapp_url && settings.webapp_url.trim().startsWith('http')) {
      return settings.webapp_url.trim();
    }
    if (process.env.APP_URL && process.env.APP_URL.trim().startsWith('http')) {
      return process.env.APP_URL.trim();
    }
    return 'https://ais-dev-4t7cgnx5jf2wmsgau33wmd-128464619421.asia-east1.run.app';
  }

  public isAdmin(user: User, chatId?: number): boolean {
    const settings = dbStore.getData().settings;
    const adminId = Number(settings.admin_id);
    const uid = Number(user.user_id);
    const cid = Number(chatId);
    const uname = (user.username || '').toLowerCase().replace('@', '');
    const adminContact = (settings.admin_contact || '').toLowerCase().replace('@', '');

    if (adminId && (uid === adminId || cid === adminId)) return true;
    if (adminContact && uname === adminContact) return true;
    if (uname === 'kalam172010') return true;
    if (!adminId && (uname === 'kalam172010' || user.is_reseller === 1)) return true;
    return false;
  }

  /**
   * Helper to make calls to Telegram Bot API
   */
  public async callApi(method: string, payload: any = {}): Promise<any> {
    const token = dbStore.getData().settings.bot_token;
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

  /**
   * Start long polling engine
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    const conn = await this.testConnection();
    if (!conn.success) {
      console.log('Telegram Bot Token not valid or not set. Running in standby mode.');
      return;
    }

    this.isRunning = true;
    this.pollingAbortController = new AbortController();

    try {
      await this.callApi('deleteWebhook', { drop_pending_updates: false });
    } catch (e) {
      // ignore
    }

    console.log(`⚡ Telegram Bot Polling Engine started for @${this.botInfo?.username}`);
    this.pollLoop();
  }

  /**
   * Stop long polling engine
   */
  public async stop(): Promise<void> {
    this.isRunning = false;
    this.isConnected = false;
    if (this.pollingAbortController) {
      this.pollingAbortController.abort();
      this.pollingAbortController = null;
    }
    console.log('Telegram Bot Polling Engine stopped');
  }

  /**
   * Restart engine
   */
  public async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  /**
   * Continuous long polling loop
   */
  private async pollLoop() {
    while (this.isRunning) {
      try {
        const token = dbStore.getData().settings.bot_token;
        if (!token || token.includes('exampleToken')) {
          this.isRunning = false;
          break;
        }

        const url = `https://api.telegram.org/bot${token}/getUpdates`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            offset: this.updateOffset,
            timeout: 20,
            allowed_updates: ['message', 'callback_query']
          }),
          signal: this.pollingAbortController?.signal
        });

        if (response.status === 409) {
          // Conflict: e.g. previous webhook or getUpdates still active on Telegram's side
          try {
            await this.callApi('deleteWebhook', { drop_pending_updates: false });
          } catch {}
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }

        if (!response.ok) {
          const errBody = await response.text();
          this.lastError = `HTTP ${response.status}: ${errBody || response.statusText}`;
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }

        const data = await response.json();
        if (data.ok && Array.isArray(data.result)) {
          this.lastPollTimestamp = new Date().toISOString();
          this.isConnected = true;
          this.lastError = null;
          for (const update of data.result) {
            this.updateOffset = update.update_id + 1;
            this.updatesProcessed++;
            await this.handleUpdate(update);
          }
        } else if (!data.ok) {
          this.lastError = data.description || 'Telegram API returned false status';
          await new Promise(r => setTimeout(r, 2500));
        }
      } catch (err: any) {
        if (err.name === 'AbortError' || !this.isRunning) {
          break;
        }
        this.lastError = err.message;
        // Don't crash out of the polling loop on intermittent network errors - retry seamlessly
        await new Promise(r => setTimeout(r, 2500));
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
    if (user.is_reseller === 1) return product.reseller_price;
    if (user.is_vip === 1) return Math.round(product.price_inr * 0.85);
    return product.price_inr;
  }

  private getProductAvailableKeys(productId: number): string[] {
    const keys = dbStore.getData().productKeys.filter(k => k.product_id === productId && k.is_used === 0);
    return keys.map(k => k.key_text);
  }

  private getProductStockTag(product: Product): string {
    if (product.is_maintenance) {
      return '[🛠️ Maintenance]';
    }
    if (product.delivery_mode === 'api_provider') {
      return '[⚡ Auto Key]';
    }
    const keys = dbStore.getData().productKeys.filter(k => k.product_id === product.id && k.is_used === 0);
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

    const useApiDelivery = (
      product.delivery_mode === 'api_provider' ||
      (Boolean(product.provider_product_id) && (product.delivery_mode === 'hybrid' || settings.bantibhaiya_status === 'ON'))
    );

    if (useApiDelivery && product.provider_product_id) {
      // Dispatched to BantiBhaiya Reseller Provider API
      const duration = product.provider_duration || product.name || '1 Day';
      const buyRes = await bantiResellerService.buyKey({
        productId: product.provider_product_id,
        duration: duration,
        androidId: androidId
      });

      if (buyRes.success && buyRes.key) {
        deliveredKey = buyRes.key;
        providerSource = buyRes.source === 'live_api' ? 'BantiBhaiya Live API' : 'Provider Fallback';
      } else {
        // If API purchase failed, check if manual vault fallback is enabled
        const vaultKey = dbStore.getData().productKeys.find(k => k.product_id === product.id && k.is_used === 0);
        if (vaultKey && (product.delivery_mode === 'hybrid' || settings.provider_auto_fallback !== false)) {
          vaultKey.is_used = 1;
          deliveredKey = vaultKey.key_text;
          providerSource = 'Manual Vault (API Fallback)';
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
      const vaultKey = dbStore.getData().productKeys.find(k => k.product_id === product.id && k.is_used === 0);
      if (!vaultKey) {
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
      vaultKey.is_used = 1;
      deliveredKey = vaultKey.key_text;
      providerSource = 'Manual Key Vault';
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

    const deviceNote = androidId ? `\n📱 <b>Bound HWID:</b> <code>${androidId}</code>` : '';
    const apkDownloadUrl = product.apk_link || settings.apk_channel_link || 'https://t.me/KalamFFPanelAPKs';
    const channelUrl = settings.official_channel_link || 'https://t.me/KalamFFPanelChannel';
    const tutorialUrl = settings.how_to_video || 'https://youtube.com';

    const deliveryMessage = `🎉 <b>PURCHASE SUCCESSFUL! (#${orderId})</b>\n\n` +
      `📦 <b>Product:</b> ${product.panel_name} - ${product.name}\n` +
      `⏳ <b>Validity:</b> ${product.validity}\n` +
      `💰 <b>Amount Paid:</b> ₹${userPrice}\n` +
      `💳 <b>Remaining Balance:</b> ₹${user.balance.toFixed(2)}${deviceNote}\n\n` +
      `🔑 <b>YOUR LICENSE KEY:</b>\n` +
      `<code>${deliveredKey}</code>\n\n` +
      `⬇️ <b>APK / LOADER CHANNEL:</b>\n` +
      `<a href="${apkDownloadUrl}">${apkDownloadUrl}</a>\n\n` +
      `📖 <b>TUTORIAL & SETUP GUIDE:</b>\n` +
      `<a href="${tutorialUrl}">${tutorialUrl}</a>\n\n` +
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
      await this.editMessageText(chatId, messageId, deliveryMessage, keyboard);
    } else {
      await this.sendMessage(chatId, deliveryMessage, keyboard);
    }
  }

  private async handleMessage(msg: any) {
    if (!msg.from || msg.from.is_bot) return;

    const fromUser = msg.from;
    const chatId = msg.chat.id;
    const text = (msg.text || '').trim();

    const user = dbStore.getOrCreateUser(fromUser.id, fromUser.first_name, fromUser.username, chatId);

    if (user.is_banned === 1) {
      await this.sendMessage(chatId, '🚫 <b>Account Suspended</b>\n\nYour account has been banned from using Kalam FF Panel. Contact support if you believe this is an error.');
      return;
    }

    const settings = dbStore.getData().settings;

    if (settings.bot_status === 'OFF' && user.user_id !== settings.admin_id) {
      await this.sendMessage(chatId, '🛠 <b>MAINTENANCE MODE</b>\n\nKalam FF Panel is currently undergoing scheduled maintenance. Please check back shortly!');
      return;
    }

    if (text === '/cancel') {
      dbStore.setFsmState(user.user_id, 'idle');
      await this.sendMessage(chatId, '❌ <i>Operation cancelled. Returning to main menu...</i>', this.getMainMenuKeyboard(user));
      return;
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

      const broadcastMsg = text.trim();
      const allUsers = dbStore.getData().users;
      await this.sendMessage(chatId, `⏳ Sending broadcast to ${allUsers.length} users...`);

      const result = await this.sendBroadcast({
        targetAudience: 'ALL_USERS',
        text: broadcastMsg,
        recipients: allUsers
      });

      await this.sendMessage(
        chatId,
        `📢 <b>BROADCAST COMPLETED!</b>\n\n` +
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
            `👤 <b>From:</b> ${user.first_name} (@${user.username || user.user_id})\n` +
            `🆔 <b>User ID:</b> <code>${user.user_id}</code>\n` +
            `💬 <b>Message:</b>\n${text}\n\n` +
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
        const replyText = text.substring(text.indexOf(parts[2]));
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
    const lowerText = text.toLowerCase();

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

    if (lowerText.startsWith('/vip')) {
      await this.sendVipMenu(chatId, user);
      return;
    }

    if (lowerText.startsWith('/help') || lowerText.startsWith('/support')) {
      await this.sendSupportMenu(chatId, user);
      return;
    }

    // Admin Quick Commands
    if (this.isAdmin(user, chatId)) {
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
          const bMsg = text.substring(text.indexOf(parts[1])).trim();
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

    await this.answerCallback(cb.id);

    if (data === 'main_menu') {
      const welcomeText = this.getWelcomeText(user);
      await this.editMessageText(chatId, messageId, welcomeText, this.getMainMenuKeyboard(user));
      return;
    }

    if (data === 'shop_categories') {
      const text = `🛒 <b>KALAM FF PANEL - STORE CATALOG</b>\n\n` +
        `Select your desired operating environment and panel category below:\n\n` +
        `🔹 <b>Android Non-Root:</b> Easy APK install, zero root required, 100% safe\n` +
        `🔸 <b>Android Root:</b> Maximum performance, memory injection, bypass features\n` +
        `💻 <b>PC Emulator:</b> High FPS, full emulator compatibility (BlueStacks/LDPlayer)`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '📱 Android Non-Root Panel', callback_data: 'cat_nonroot' }],
          [{ text: '⚡ Android Root Panel', callback_data: 'cat_root' }],
          [{ text: '💻 PC Emulator Panel', callback_data: 'cat_pc' }],
          [{ text: '🔙 Back to Menu', callback_data: 'main_menu' }]
        ]
      };
      await this.editMessageText(chatId, messageId, text, keyboard);
      return;
    }

    if (data.startsWith('cat_')) {
      let categoryName = 'ANDROID NON ROOT PANEL';
      if (data === 'cat_root') categoryName = 'ANDROID ROOT PANEL';
      else if (data === 'cat_pc') categoryName = 'PC PANEL';
      else if (data === 'cat_nonroot') categoryName = 'ANDROID NON ROOT PANEL';
      else categoryName = data.replace('cat_', '');

      const products = dbStore.getData().products.filter(p => 
        p.category.toLowerCase() === categoryName.toLowerCase() && p.is_active === 1
      );

      let text = `📦 <b>${categoryName.toUpperCase()} PACKAGES</b>\n\n`;
      if (products.length === 0) {
        text += `<i>No products currently available in this category. Check back soon!</i>`;
      } else {
        text += `Choose a panel package to view full details and instant key pricing:`;
      }

      const buttons = products.map(p => {
        const userPrice = this.getUserPrice(user, p);
        const stockTag = this.getProductStockTag(p);
        return [{
          text: `${p.panel_name} - ${p.name} (₹${userPrice}) ${stockTag}`,
          callback_data: `prod_${p.id}`
        }];
      });

      buttons.push([{ text: '🔙 Back to Categories', callback_data: 'shop_categories' }]);

      await this.editMessageText(chatId, messageId, text, { inline_keyboard: buttons });
      return;
    }

    if (data.startsWith('prod_')) {
      const prodId = Number(data.replace('prod_', ''));
      const product = dbStore.getProduct(prodId);

      if (!product || !product.is_active) {
        await this.answerCallback(cb.id, '❌ Product no longer available or was removed!', true);
        const text = `⚠️ <b>PRODUCT REMOVED</b>\n\nThis item is no longer available in the store catalog.`;
        const keyboard = {
          inline_keyboard: [
            [{ text: '🛒 Return to Store', callback_data: 'shop_categories' }],
            [{ text: '🔙 Main Menu', callback_data: 'main_menu' }]
          ]
        };
        await this.editMessageText(chatId, messageId, text, keyboard);
        return;
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

      const text = `📦 <b>${product.panel_name} (${product.name})</b>\n\n` +
        `📂 <b>Category:</b> ${product.category}\n` +
        `⏳ <b>Validity:</b> ${product.validity}\n` +
        `🔒 <b>Device Limit:</b> ${product.device_limit}${hwidNote}\n` +
        `💰 <b>Price:</b> <b>₹${userPrice}</b>${discountText}\n` +
        `📊 <b>Stock Status:</b> ${stockInfo}\n` +
        `💳 <b>Your Wallet Balance:</b> ₹${user.balance.toFixed(2)}\n\n` +
        `<i>Keys are delivered immediately upon checkout directly to this chat!</i>`;

      const keyboard: any = {
        inline_keyboard: []
      };

      const hasStock = isApi || availableKeys.length > 0;
      const isUnderMaintenance = Boolean(product.is_maintenance);

      if (isUnderMaintenance) {
        keyboard.inline_keyboard.push([
          { text: `🛠️ Under Maintenance`, callback_data: `maint_${product.id}` }
        ]);
      } else if (hasStock) {
        keyboard.inline_keyboard.push([
          { text: `⚡ Buy Now (₹${userPrice})`, callback_data: `buy_${product.id}` }
        ]);
      } else {
        keyboard.inline_keyboard.push([
          { text: `❌ Out of Stock`, callback_data: 'stock_empty' }
        ]);
      }

      keyboard.inline_keyboard.push([
        { text: '💳 Add Balance', callback_data: 'add_balance' },
        { text: '🔙 Back to Shop', callback_data: 'shop_categories' }
      ]);

      const maintenanceBanner = isUnderMaintenance
        ? `\n\n🛠 <b>MAINTENANCE NOTICE:</b>\n<i>${product.maintenance_note || 'This panel is temporarily under maintenance/update. Orders for this specific product are paused.'}</i>`
        : '';

      const updatedText = text + maintenanceBanner;

      await this.editMessageText(chatId, messageId, updatedText, keyboard);
      return;
    }

    if (data.startsWith('maint_')) {
      const prodId = Number(data.replace('maint_', ''));
      const product = dbStore.getProduct(prodId);
      const note = product?.maintenance_note || 'This product is updating. Please try another product!';
      await this.answerCallback(cb.id, `🛠️ Product Under Maintenance: ${note}`, true);
      return;
    }

    if (data.startsWith('buy_')) {
      const prodId = Number(data.replace('buy_', ''));
      const product = dbStore.getProduct(prodId);

      if (!product || !product.is_active) {
        await this.answerCallback(cb.id, '❌ Product no longer available or was removed!', true);
        const text = `⚠️ <b>PRODUCT REMOVED</b>\n\nThis item is no longer available in the store catalog.`;
        const keyboard = {
          inline_keyboard: [
            [{ text: '🛒 Return to Store', callback_data: 'shop_categories' }],
            [{ text: '🔙 Main Menu', callback_data: 'main_menu' }]
          ]
        };
        await this.editMessageText(chatId, messageId, text, keyboard);
        return;
      }

      if (product.is_maintenance) {
        await this.answerCallback(cb.id, `🛠️ This product is currently under maintenance!`, true);
        const text = `🛠 <b>PRODUCT UNDER MAINTENANCE</b>\n\n` +
          `<b>${product.panel_name} (${product.name})</b> is temporarily paused for updates.\n\n` +
          `📌 <b>Notice:</b> <i>${product.maintenance_note || 'Maintenance in progress. Please check back shortly.'}</i>\n\n` +
          `✅ <i>All other catalog products are fully working and available for instant order!</i>`;

        const keyboard = {
          inline_keyboard: [
            [{ text: '🛒 Explore Other Products', callback_data: 'shop_categories' }],
            [{ text: '🔙 Main Menu', callback_data: 'main_menu' }]
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
            [{ text: '💳 Add Balance via FamPay UPI', callback_data: 'add_balance' }],
            [{ text: '🔙 Back to Product', callback_data: `prod_${product.id}` }]
          ]
        };
        await this.editMessageText(chatId, messageId, text, keyboard);
        return;
      }

      if (product.requires_android_id) {
        dbStore.setFsmState(user.user_id, 'wait_for_android_id', {
          productId: prodId,
          userPrice
        });

        const promptText = `📱 <b>DEVICE HWID REQUIRED (V1 BIND)</b>\n\n` +
          `The selected package (<b>${product.panel_name} - ${product.name}</b>) requires your Android Device ID to bind the license key.\n\n` +
          `👉 <b>Please reply to this chat with your 16-character Android ID:</b>\n` +
          `<i>(Example: <code>0b9b969bc2e7997b</code>)</i>\n\n` +
          `<i>Type /cancel anytime to abort.</i>`;

        const cancelKb = {
          inline_keyboard: [
            [{ text: '❌ Cancel Purchase', callback_data: `prod_${prodId}` }]
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
          `⏳ <b>Payment Status: Pending</b>\n\n` +
          `Order ID: <code>${orderId}</code>\n\n` +
          `If you have already paid in your UPI app (GPay / PhonePe / Paytm / FamPay / BHIM):\n` +
          `👉 Click <b>"📝 Submit 12-Digit UTR"</b> below and send your UTR Reference Number for <b>instant automated credit</b>!`,
          {
            inline_keyboard: [
              [{ text: '📝 Submit 12-Digit UTR Number', callback_data: `submit_utr_${orderId}` }],
              [{ text: '🔄 Retry Check Status', callback_data: `check_order_${orderId}` }],
              [{ text: '🔙 Back to Menu', callback_data: 'main_menu' }]
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

    if (data.startsWith('pay_') || data.startsWith('dep_')) {
      const amountStr = data.replace('pay_', '').replace('dep_', '');
      if (amountStr === 'custom') {
        dbStore.setFsmState(user.user_id, 'wait_for_custom_balance');
        await this.editMessageText(
          chatId,
          messageId,
          `💳 <b>ENTER CUSTOM AMOUNT</b>\n\n` +
          `Please reply with the exact amount you wish to add in ₹ (INR) [e.g. <code>150</code>, <code>750</code>, <code>3000</code>]:\n\n` +
          `<i>Or send /cancel to return to main menu.</i>`
        );
        return;
      }

      const amount = parseFloat(amountStr);
      await this.sendPaymentInstructions(chatId, user, amount, messageId);
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

    if (data === 'vip_club') {
      await this.sendVipMenu(chatId, user, messageId);
      return;
    }

    if (data === 'vip_upgrade') {
      const vipPrice = settings.vip_membership_price || 499;

      if (user.is_vip === 1) {
        await this.answerCallback(cb.id, 'You are already a Lifetime VIP Member!', true);
        return;
      }

      if (user.balance < vipPrice) {
        await this.answerCallback(cb.id, `You need ₹${vipPrice} in your wallet to unlock Lifetime VIP.`, true);
        return;
      }

      user.balance -= vipPrice;
      user.is_vip = 1;
      user.account_type = 'VIP';
      dbStore.updateUser(user.user_id, {
        is_vip: 1,
        account_type: 'VIP',
        balance: user.balance
      });
      dbStore.logActivity(user.user_id, 'UPGRADE_VIP', 'Unlocked Lifetime VIP Membership');

      await this.answerCallback(cb.id, '💎 Lifetime VIP Membership Activated! Enjoy 15% OFF everything.', true);
      await this.sendVipMenu(chatId, user, messageId);
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
          inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'main_menu' }]]
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
            { text: '📲 APK Channel', url: apkUrl },
            { text: '📢 Official Channel', url: channelUrl }
          ],
          [
            { text: '💬 Telegram Support', url: settings.support_telegram || 'https://t.me' },
            { text: '📱 WhatsApp Support', url: settings.support_whatsapp || 'https://wa.me' }
          ],
          [{ text: '📩 Open Support Ticket', callback_data: 'ticket_create' }],
          [{ text: '🔙 Back to Menu', callback_data: 'main_menu' }]
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
          inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'main_menu' }]]
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
            { text: '⬇️ Open APK Channel', url: apkUrl },
            { text: '🎥 Video Tutorial', url: tutorialUrl }
          ],
          [{ text: '🛒 Open Store', callback_data: 'shop_categories' }],
          [{ text: '🔙 Back to Menu', callback_data: 'main_menu' }]
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
  }

  private getWelcomeText(user: User): string {
    const tier = user.is_reseller === 1 ? '🌟 Wholesale Reseller' : (user.is_vip === 1 ? '💎 VIP Member (15% OFF)' : '👤 Regular Member');

    return `⚡ <b>WELCOME TO KALAM FF PANEL STORE</b> ⚡\n\n` +
      `👋 Hello, <b>${user.first_name}</b>!\n` +
      `🆔 <b>Grid ID:</b> <code>${user.user_id}</code>\n` +
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
    const buttons: any[] = [
      [
        { text: '🛒 Product Store', callback_data: 'shop_categories' },
        { text: '💳 Add Balance', callback_data: 'add_balance' }
      ],
      [
        { text: '👤 My Profile & Keys', callback_data: 'profile' },
        { text: '🎁 Redeem Code', callback_data: 'redeem_code' }
      ],
      [
        { text: '🌟 Reseller Panel', callback_data: 'reseller_panel' },
        { text: '💎 VIP Club', callback_data: 'vip_club' }
      ],
      [
        { text: '🎧 24/7 Support', callback_data: 'support_menu' },
        { text: '📖 Tutorial Guide', callback_data: 'how_to_use' }
      ]
    ];

    if (this.isAdmin(user, user.user_id)) {
      buttons.push([
        { text: '⚙️ Master Admin Terminal (@admin)', callback_data: 'admin_panel' }
      ]);
    }

    return { inline_keyboard: buttons };
  }

  private async sendWelcomeMessage(chatId: number, user: User) {
    await this.sendMessage(chatId, this.getWelcomeText(user), this.getMainMenuKeyboard(user));
  }

  private async sendShopCategories(chatId: number, user: User) {
    const text = `🛒 <b>KALAM FF PANEL - STORE CATALOG</b>\n\n` +
      `Select your desired operating environment and panel category below:\n\n` +
      `🔹 <b>Android Non-Root:</b> Easy APK install, zero root required, 100% safe\n` +
      `🔸 <b>Android Root:</b> Maximum performance, memory injection, bypass features\n` +
      `💻 <b>PC Emulator:</b> High FPS, full emulator compatibility (BlueStacks/LDPlayer)`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '📱 Android Non-Root Panel', callback_data: 'cat_nonroot' }],
        [{ text: '⚡ Android Root Panel', callback_data: 'cat_root' }],
        [{ text: '💻 PC Emulator Panel', callback_data: 'cat_pc' }],
        [{ text: '🔙 Back to Menu', callback_data: 'main_menu' }]
      ]
    };
    await this.sendMessage(chatId, text, keyboard);
  }

  private async sendProfileMessage(chatId: number, user: User, messageId?: number) {
    const orders = dbStore.getData().orders.filter(o => o.user_id === user.user_id);
    const tier = user.is_reseller === 1 ? '🌟 Wholesale Reseller' : (user.is_vip === 1 ? '💎 VIP Member' : '👤 Regular Customer');

    let keysText = '';
    if (orders.length > 0) {
      keysText = `\n\n🔑 <b>RECENT PURCHASED KEYS (Click to Copy):</b>\n` +
        orders.slice(0, 5).map(o => `• <b>${o.product_name}</b>\n  <code>${o.delivered_key}</code> (${o.purchase_date})`).join('\n');
    } else {
      keysText = `\n\n<i>You have not purchased any keys yet. Visit the Product Store to get started!</i>`;
    }

    const text = `👤 <b>USER ACCOUNT PROFILE</b>\n\n` +
      `🆔 <b>Telegram ID:</b> <code>${user.user_id}</code>\n` +
      `📛 <b>Name:</b> ${user.first_name} (@${user.username || 'none'})\n` +
      `🎖 <b>Account Tier:</b> <b>${tier}</b>\n` +
      `💰 <b>Wallet Balance:</b> <b>₹${user.balance.toFixed(2)}</b>\n` +
      `📊 <b>Total Orders:</b> ${orders.length}\n` +
      `💸 <b>Total Spent:</b> ₹${user.spent.toFixed(2)}` + keysText;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '💳 Add Balance', callback_data: 'add_balance' },
          { text: '🎁 Redeem Code', callback_data: 'redeem_code' }
        ],
        [{ text: '🔙 Back to Menu', callback_data: 'main_menu' }]
      ]
    };

    if (messageId) {
      await this.editMessageText(chatId, messageId, text, keyboard);
    } else {
      await this.sendMessage(chatId, text, keyboard);
    }
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
          { text: '₹50', callback_data: 'pay_50' },
          { text: '₹100', callback_data: 'pay_100' },
          { text: '₹200', callback_data: 'pay_200' }
        ],
        [
          { text: '₹500', callback_data: 'pay_500' },
          { text: '₹1,000', callback_data: 'pay_1000' },
          { text: '₹2,000', callback_data: 'pay_2000' }
        ],
        [
          { text: '✏️ Enter Custom Amount', callback_data: 'pay_custom' }
        ],
        [{ text: '🔙 Back to Menu', callback_data: 'main_menu' }]
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
      `<i>👉 After paying, tap "🔄 Check & Auto-Confirm Payment" or "📝 Submit 12-Digit UTR" below.</i>`;

    const keyboardButtons: any[] = [];

    // Payment link button ONLY if it's a valid web URL (Telegram Bot API rejects upi:// in inline URL buttons)
    if (orderRes.payment_url && (orderRes.payment_url.startsWith('http://') || orderRes.payment_url.startsWith('https://'))) {
      keyboardButtons.push([
        { text: '🌐 Open FamGateway.in Checkout', url: orderRes.payment_url }
      ]);
    }

    keyboardButtons.push([
      { text: '🔄 Check & Auto-Confirm Payment', callback_data: `check_order_${orderId}` }
    ]);

    keyboardButtons.push([
      { text: '📝 Submit 12-Digit UTR Number', callback_data: `submit_utr_${orderId}` }
    ]);

    const bottomRow: any[] = [
      { text: '💳 Choose Other Amount', callback_data: 'add_balance' }
    ];

    if (settings.support_telegram && (settings.support_telegram.startsWith('http://') || settings.support_telegram.startsWith('https://') || settings.support_telegram.startsWith('tg://'))) {
      bottomRow.push({ text: '💬 Support', url: settings.support_telegram });
    } else {
      bottomRow.push({ text: '🔙 Main Menu', callback_data: 'main_menu' });
    }

    keyboardButtons.push(bottomRow);

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
        { text: `⚡ Upgrade to Reseller (₹${setupFee})`, callback_data: 'reseller_upgrade' }
      ]);
    }

    keyboard.inline_keyboard.push([
      { text: '💳 Add Balance', callback_data: 'add_balance' },
      { text: '🔙 Back to Menu', callback_data: 'main_menu' }
    ]);

    if (messageId) {
      await this.editMessageText(chatId, messageId, text, keyboard);
    } else {
      await this.sendMessage(chatId, text, keyboard);
    }
  }

  private async sendVipMenu(chatId: number, user: User, messageId?: number) {
    const settings = dbStore.getData().settings;
    const vipPrice = settings.vip_membership_price || 499;
    const statusBadge = user.is_vip === 1 ? '💎 <b>Active VIP Lifetime Member</b>' : '❌ <i>Standard Member</i>';

    const text = `💎 <b>KALAM FF PANEL - VIP CLUB</b>\n\n` +
      `Status: ${statusBadge}\n\n` +
      `✨ <b>VIP Club Privileges:</b>\n` +
      `• <b>Flat 15% OFF</b> on every single store purchase for life\n` +
      `• VIP Gold badge next to your profile name\n` +
      `• Direct VIP support queue ticket escalation\n` +
      `• Beta testing access for upcoming FF panel updates\n\n` +
      `💰 <b>Lifetime Membership Fee:</b> <b>₹${vipPrice}</b>\n` +
      `💳 <b>Your Current Balance:</b> ₹${user.balance.toFixed(2)}`;

    const keyboard: any = {
      inline_keyboard: []
    };

    if (user.is_vip === 0) {
      keyboard.inline_keyboard.push([
        { text: `💎 Unlock VIP Membership (₹${vipPrice})`, callback_data: 'vip_upgrade' }
      ]);
    }

    keyboard.inline_keyboard.push([
      { text: '💳 Add Balance', callback_data: 'add_balance' },
      { text: '🔙 Back to Menu', callback_data: 'main_menu' }
    ]);

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
        [{ text: '📩 Open Support Ticket', callback_data: 'ticket_create' }],
        [{ text: '🔙 Back to Menu', callback_data: 'main_menu' }]
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
        [{ text: '🛒 Open Store', callback_data: 'shop_categories' }],
        [{ text: '🔙 Back to Menu', callback_data: 'main_menu' }]
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
      `• <code>/addbalance &lt;user_id&gt; &lt;amount&gt;</code> - Credit wallet\n` +
      `• <code>/deduct &lt;user_id&gt; &lt;amount&gt;</code> - Deduct wallet\n` +
      `• <code>/users</code> - View active users & balances\n` +
      `• <code>/stock</code> - View product stock\n` +
      `• <code>/broadcast &lt;message&gt;</code> - Message all users\n` +
      `• <code>/setadmin ${chatId}</code> - Bind current Chat ID\n\n` +
      `👇 <i>Use the interactive buttons below or launch the Full Web Admin Hub:</i>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🚀 Launch Admin Hub (Mini App)', web_app: { url: webAppUrl } }
        ],
        [
          { text: '🌐 Open Admin Hub in Browser', url: webAppUrl }
        ],
        [
          { text: '💳 + Add Balance', callback_data: 'admin_add_bal' },
          { text: '🔻 - Deduct Balance', callback_data: 'admin_ded_bal' }
        ],
        [
          { text: '👥 View Users', callback_data: 'admin_users' },
          { text: '📦 Products & Vault', callback_data: 'admin_stock' }
        ],
        [
          { text: `🎫 Tickets (${openTickets})`, callback_data: 'admin_tickets' },
          { text: '📢 Send Broadcast', callback_data: 'admin_broadcast' }
        ],
        [
          {
            text: settings.bot_status === 'ON' ? '🟢 Bot: Online (Click to Pause)' : '🔴 Bot: Maintenance (Click to Resume)',
            callback_data: 'admin_toggle_maint'
          }
        ],
        [
          { text: '🔄 Refresh Terminal', callback_data: 'admin_refresh' },
          { text: '🔙 Main Menu', callback_data: 'main_menu' }
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
   * Broadcast message to users via live Telegram API
   */
  public async sendBroadcast(params: {
    targetAudience: string;
    text: string;
    imageUrl?: string;
    buttonText?: string;
    buttonUrl?: string;
    pinMessage?: boolean;
    recipients: User[];
  }): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    const formattedText = `📢 <b>OFFICIAL ANNOUNCEMENT</b>\n\n${params.text}`;
    const keyboard: any = params.buttonText && params.buttonUrl ? {
      inline_keyboard: [[
        { text: params.buttonText, url: params.buttonUrl }
      ]]
    } : undefined;

    for (const u of params.recipients) {
      if (!u.user_id) continue;
      try {
        let sentMsg: any;
        if (params.imageUrl && params.imageUrl.trim().startsWith('http')) {
          sentMsg = await this.callApi('sendPhoto', {
            chat_id: u.user_id,
            photo: params.imageUrl.trim(),
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
}

export const telegramEngine = new TelegramEngine();
