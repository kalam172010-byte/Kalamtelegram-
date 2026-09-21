import { dbStore } from './storage';
import { Product, User, Order, Ticket } from '../src/types';
import { famGateway } from './famGateway';
import { bantiResellerService } from './bantiResellerApi';

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

  /**
   * Helper to make calls to Telegram Bot API
   */
  public async callApi(method: string, payload: any = {}): Promise<any> {
    const token = dbStore.getData().settings.bot_token;
    if (!token || token.includes('exampleToken')) {
      throw new Error('Valid Telegram Bot Token is required');
    }

    const url = `https://api.telegram.org/bot${token}/${method}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!result.ok) {
      throw new Error(result.description || `Telegram API error on ${method}`);
    }
    return result.result;
  }

  /**
   * Test current bot token
   */
  public async testConnection(): Promise<any> {
    try {
      const me = await this.callApi('getMe');
      this.botInfo = me;
      this.isConnected = true;
      this.lastError = null;
      dbStore.logActivity(12846461, 'TG_CONNECT_SUCCESS', `Connected to Telegram Bot: @${me.username} (${me.first_name})`);
      return { success: true, bot: me };
    } catch (err: any) {
      this.isConnected = false;
      this.lastError = err.message;
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

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.ok && Array.isArray(data.result)) {
          this.lastPollTimestamp = new Date().toISOString();
          for (const update of data.result) {
            this.updateOffset = update.update_id + 1;
            this.updatesProcessed++;
            await this.handleUpdate(update);
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          break;
        }
        this.lastError = err.message;
        await new Promise(r => setTimeout(r, 3000));
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

    const deliveryMessage = `🎉 <b>PURCHASE SUCCESSFUL! (#${orderId})</b>\n\n` +
      `📦 <b>Product:</b> ${product.panel_name} - ${product.name}\n` +
      `⏳ <b>Validity:</b> ${product.validity}\n` +
      `💰 <b>Amount Paid:</b> ₹${userPrice}\n` +
      `💳 <b>Remaining Balance:</b> ₹${user.balance.toFixed(2)}${deviceNote}\n\n` +
      `🔑 <b>YOUR LICENSE KEY:</b>\n` +
      `<code>${deliveredKey}</code>\n\n` +
      `⬇️ <b>DOWNLOAD APK / LOADER:</b>\n` +
      `<a href="${product.apk_link}">${product.apk_link}</a>\n\n` +
      `📖 <b>TUTORIAL & SETUP GUIDE:</b>\n` +
      `<a href="${settings.how_to_video}">${settings.how_to_video}</a>\n\n` +
      `<i>Click on the key above to copy it directly to your clipboard. Enjoy playing!</i>`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '👤 View in My Profile', callback_data: 'profile' }],
        [{ text: '🛒 Continue Shopping', callback_data: 'shop_categories' }]
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

    const user = dbStore.getOrCreateUser(fromUser.id, fromUser.first_name, fromUser.username);

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
      const amount = parseFloat(text);
      if (isNaN(amount) || amount < 10 || amount > 100000) {
        await this.sendMessage(chatId, `❌ <b>Invalid Amount</b>\nPlease enter a valid numerical deposit between ₹10 and ₹1,00,000.\n\nUse /cancel to abort.`, this.getMainMenuKeyboard(user));
        return;
      }

      await this.sendPaymentInstructions(chatId, user, amount);
      return;
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

    if (lowerText.startsWith('/balance') || lowerText.startsWith('/wallet') || lowerText.startsWith('/deposit')) {
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

    if (lowerText.startsWith('/admin')) {
      if (user.user_id === settings.admin_id) {
        await this.sendAdminPanel(chatId, user);
      } else {
        await this.sendMessage(chatId, '⛔ <b>Access Denied</b>\nYou do not have master administrator privileges.');
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

    const user = dbStore.getOrCreateUser(fromUser.id, fromUser.first_name, fromUser.username);
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

    if (data === 'cat_nonroot' || data === 'cat_root' || data === 'cat_pc') {
      let categoryName = 'ANDROID NON ROOT PANEL';
      if (data === 'cat_root') categoryName = 'ANDROID ROOT PANEL';
      if (data === 'cat_pc') categoryName = 'PC PANEL';

      const products = dbStore.getData().products.filter(p => p.category === categoryName && p.is_active === 1);

      let text = `📦 <b>${categoryName} PACKAGES</b>\n\n`;
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

      if (!product) {
        await this.answerCallback(cb.id, 'Product not found!', true);
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

      if (hasStock) {
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

      await this.editMessageText(chatId, messageId, text, keyboard);
      return;
    }

    if (data.startsWith('buy_')) {
      const prodId = Number(data.replace('buy_', ''));
      const product = dbStore.getProduct(prodId);

      if (!product) {
        await this.answerCallback(cb.id, 'Product not found!', true);
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

    if (data === 'profile') {
      await this.sendProfileMessage(chatId, user, messageId);
      return;
    }

    if (data === 'add_balance') {
      await this.sendAddBalanceMenu(chatId, user, messageId);
      return;
    }

    if (data.startsWith('check_order_')) {
      const orderId = data.replace('check_order_', '');
      await this.answerCallback(cb.id, '🔄 Checking payment status with FamGateway...', false);

      const statusRes = await famGateway.checkOrderStatus(orderId);
      if (statusRes.isPaid) {
        await famGateway.processSuccessfulPayment(orderId, statusRes.amount);
        const updatedUser = dbStore.getUser(user.user_id) || user;
        await this.answerCallback(cb.id, '🎉 Payment Verified! Balance added to your wallet.', true);
        await this.sendProfileMessage(chatId, updatedUser, messageId);
      } else {
        await this.answerCallback(cb.id, '⏳ Payment is still pending. Please complete the transaction in your UPI app and retry.', true);
      }
      return;
    }

    if (data.startsWith('pay_')) {
      const amountStr = data.replace('pay_', '');
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
      await this.editMessageText(chatId, messageId, text, keyboard);
      return;
    }

    if (data === 'admin_panel' && user.user_id === settings.admin_id) {
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
    const settings = dbStore.getData().settings;
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

    if (user.user_id === settings.admin_id) {
      buttons.push([
        { text: '⚙️ Master Admin Terminal', callback_data: 'admin_panel' }
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
    const text = `💳 <b>ADD WALLET BALANCE (FAMPAY UPI)</b>\n\n` +
      `Instant, automated wallet deposits via FamPay, PhonePe, GooglePay & Paytm.\n\n` +
      `💵 <b>Current Balance:</b> <b>₹${user.balance.toFixed(2)}</b>\n\n` +
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
    const settings = dbStore.getData().settings;
    const redirectUrl = settings.famgateway_redirect_url || `https://t.me/${settings.bot_username || 'KalamFFPanelBot'}`;

    // Create automated order via FamGateway
    const orderRes = await famGateway.createOrder({
      amount,
      userId: user.user_id,
      redirectUrl
    });

    const orderId = orderRes.order_id || 'ORD_' + Math.floor(100000 + Math.random() * 900000);
    const upiId = settings.fampay_upi_id || 'kalampanel@fam';
    const qrUrl = orderRes.qr_url || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(orderRes.payment_url || upiId)}`;

    const text = `⚡ <b>AUTOMATIC PAYMENT (FAMGATEWAY UPI)</b> ⚡\n\n` +
      `💰 <b>Amount:</b> <b>₹${amount.toFixed(2)}</b>\n` +
      `🆔 <b>Order ID:</b> <code>${orderId}</code>\n` +
      `🏦 <b>UPI ID:</b> <code>${upiId}</code>\n` +
      `⏳ <b>Status:</b> 🟡 <i>Awaiting Payment (Auto-Detect)...</i>\n\n` +
      `📱 <b>HOW TO PAY:</b>\n` +
      `1️⃣ Click the <b>"💳 Pay Now (FamPay / UPI)"</b> button below, or scan the QR code.\n` +
      `2️⃣ Complete the payment using FamPay, PhonePe, Paytm, or GooglePay.\n` +
      `3️⃣ <b>Your balance will be credited AUTOMATICALLY</b> in seconds without manual proof!\n\n` +
      `<i>You can also click "🔄 Check Payment Status" below to verify immediately.</i>\n` +
      `<a href="${qrUrl}">View Payment QR Code</a>`;

    const keyboardButtons: any[] = [];

    if (orderRes.payment_url && (orderRes.payment_url.startsWith('http://') || orderRes.payment_url.startsWith('https://'))) {
      keyboardButtons.push([
        { text: '💳 Pay Now (FamPay / UPI / GPay)', url: orderRes.payment_url }
      ]);
    }

    keyboardButtons.push([
      { text: '🔄 Check Payment Status', callback_data: `check_order_${orderId}` }
    ]);

    keyboardButtons.push([
      { text: '💬 Contact Support', url: settings.support_telegram },
      { text: '🔙 Back to Menu', callback_data: 'main_menu' }
    ]);

    const keyboard = { inline_keyboard: keyboardButtons };

    if (messageId) {
      await this.editMessageText(chatId, messageId, text, keyboard);
    } else {
      await this.sendMessage(chatId, text, keyboard);
    }
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
    const totalRevenue = data.users.reduce((acc, u) => acc + u.spent, 0);
    const totalKeys = data.productKeys.filter(k => k.is_used === 0).length;
    const openTickets = data.tickets.filter(t => t.status === 'Open').length;

    const text = `⚙️ <b>MASTER ADMINISTRATOR TERMINAL</b>\n\n` +
      `📊 <b>System Statistics:</b>\n` +
      `• Total Users: <b>${data.users.length}</b>\n` +
      `• Gross Sales: <b>₹${totalRevenue.toLocaleString()}</b>\n` +
      `• Keys in Vault: <b>${totalKeys} ready</b>\n` +
      `• Total Orders: <b>${data.orders.length}</b>\n` +
      `• Open Support Tickets: <b>${openTickets}</b>\n\n` +
      `<i>Full administrative workstation available at your Web Admin Dashboard.</i>`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🔙 Back to Menu', callback_data: 'main_menu' }]
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
