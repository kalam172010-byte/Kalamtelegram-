import { dbStore } from './storage';
import { telegramEngine } from './telegramEngine';
import { Transaction, User } from '../src/types';

export interface FamGatewayOrderResult {
  success: boolean;
  order_id?: string;
  payment_url?: string;
  qr_url?: string;
  upi_intent?: string;
  amount?: number;
  error?: string;
  raw?: any;
}

export interface FamGatewayStatusResult {
  success: boolean;
  isPaid: boolean;
  status: string;
  order_id?: string;
  amount?: number;
  error?: string;
  raw?: any;
}

class FamGatewayService {
  private pollingTimer: NodeJS.Timeout | null = null;
  private isChecking: boolean = false;

  constructor() {
    this.startBackgroundPolling();
  }

  private getApiKey(): string {
    const settings = dbStore.getData().settings;
    return (settings.famgateway_api_key || settings.fampay_api_key || process.env.FAMGATEWAY_API_KEY || '').trim();
  }

  /**
   * Create an automated payment order using FamGateway API
   * POST https://famgateway.in/api/create-order.php
   */
  public async createOrder(params: {
    amount: number;
    userId: number;
    redirectUrl?: string;
    customerMobile?: string;
  }): Promise<FamGatewayOrderResult> {
    const apiKey = this.getApiKey();
    const settings = dbStore.getData().settings;

    if (!apiKey) {
      // Fallback if no API key is provided yet
      const fallbackOrderId = 'ORD_LOCAL_' + Math.floor(100000 + Math.random() * 900000);
      const upiId = settings.fampay_upi_id || 'kalampanel@fam';
      const upiUri = `upi://pay?pa=${upiId}&pn=KalamPanel&am=${params.amount}&tn=${fallbackOrderId}&cu=INR`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUri)}`;

      const newTxn: Transaction = {
        order_id: fallbackOrderId,
        user_id: params.userId,
        amount_inr: params.amount,
        status: 'pending',
        timestamp: Date.now(),
        qr_url: qrUrl,
        upi_id: upiId,
        expires_at: Date.now() + 15 * 60 * 1000
      };
      dbStore.getData().transactions.unshift(newTxn);
      dbStore.saveData();

      return {
        success: true,
        order_id: fallbackOrderId,
        payment_url: upiUri,
        qr_url: qrUrl,
        upi_intent: upiUri,
        amount: params.amount,
        error: 'FamGateway API Key not set. Using UPI Direct mode.'
      };
    }

    const customOrderId = 'ORD_' + Date.now() + '_' + Math.floor(100 + Math.random() * 900);
    const redirectUrl = params.redirectUrl || settings.famgateway_redirect_url || 'https://t.me/KalamFFPanelBot';

    try {
      const payload: any = {
        amount: Number(params.amount.toFixed(2)),
        redirect_url: redirectUrl,
        order_id: customOrderId
      };

      if (params.customerMobile) {
        payload.customer_mobile = params.customerMobile;
      }

      const response = await fetch('https://famgateway.in/api/create-order.php', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      let resData: any = {};
      try {
        resData = JSON.parse(responseText);
      } catch (e) {
        console.warn('Non-JSON response from FamGateway create-order:', responseText);
        resData = { raw: responseText };
      }

      if (!response.ok && !resData.order_id && !resData.payment_url) {
        throw new Error(resData.message || resData.error || `HTTP ${response.status} from FamGateway`);
      }

      const orderId = resData.order_id || resData.id || customOrderId;
      const paymentUrl = resData.payment_url || resData.payment_link || resData.checkout_url || resData.url || '';
      const qrUrl = resData.qr_image || resData.qr_url || resData.qr_code ||
        (paymentUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentUrl)}` : undefined);
      const upiIntent = resData.upi_intent || resData.upi_url || paymentUrl;

      // Save Transaction
      const newTxn: Transaction = {
        order_id: String(orderId),
        user_id: params.userId,
        amount_inr: params.amount,
        status: 'pending',
        timestamp: Date.now(),
        qr_url: qrUrl,
        upi_id: resData.upi_id || settings.fampay_upi_id,
        expires_at: Date.now() + 20 * 60 * 1000
      };

      dbStore.getData().transactions.unshift(newTxn);
      dbStore.logActivity(params.userId, 'FAMGATEWAY_ORDER_CREATED', `Order #${orderId} for ₹${params.amount}`);
      dbStore.saveData();

      return {
        success: true,
        order_id: String(orderId),
        payment_url: paymentUrl,
        qr_url: qrUrl,
        upi_intent: upiIntent,
        amount: params.amount,
        raw: resData
      };
    } catch (err: any) {
      console.error('Failed to create order on FamGateway:', err.message);

      // Fallback to direct UPI so users can still pay seamlessly
      const fallbackOrderId = 'ORD_FB_' + Math.floor(100000 + Math.random() * 900000);
      const upiId = settings.fampay_upi_id || 'kalampanel@fam';
      const upiUri = `upi://pay?pa=${upiId}&pn=KalamPanel&am=${params.amount}&tn=${fallbackOrderId}&cu=INR`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUri)}`;

      const newTxn: Transaction = {
        order_id: fallbackOrderId,
        user_id: params.userId,
        amount_inr: params.amount,
        status: 'pending',
        timestamp: Date.now(),
        qr_url: qrUrl,
        upi_id: upiId,
        expires_at: Date.now() + 15 * 60 * 1000
      };
      dbStore.getData().transactions.unshift(newTxn);
      dbStore.saveData();

      return {
        success: true,
        order_id: fallbackOrderId,
        payment_url: upiUri,
        qr_url: qrUrl,
        upi_intent: upiUri,
        amount: params.amount,
        error: `FamGateway API Error: ${err.message}`
      };
    }
  }

  /**
   * Check status of an order on FamGateway
   */
  public async checkOrderStatus(orderId: string): Promise<FamGatewayStatusResult> {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      return {
        success: false,
        isPaid: false,
        status: 'pending',
        error: 'API key not configured'
      };
    }

    try {
      // 1. Try /api/checkout-status.php
      const response = await fetch('https://famgateway.in/api/checkout-status.php', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ order_id: orderId })
      });

      const responseText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { raw: responseText };
      }

      const rawStatus = String(data.status || data.order_status || data.payment_status || '').toUpperCase();
      const isPaid = rawStatus === 'SUCCESS' || rawStatus === 'PAID' || rawStatus === 'COMPLETED' || data.is_paid === true || data.paid === true;

      return {
        success: true,
        isPaid: isPaid,
        status: isPaid ? 'PAID' : (rawStatus === 'EXPIRED' || rawStatus === 'FAILED' ? rawStatus : 'PENDING'),
        order_id: orderId,
        amount: data.amount ? Number(data.amount) : undefined,
        raw: data
      };
    } catch (err: any) {
      console.error(`Error checking FamGateway status for ${orderId}:`, err.message);
      return {
        success: false,
        isPaid: false,
        status: 'pending',
        error: err.message
      };
    }
  }

  /**
   * Process and finalize a successful payment, crediting the user balance and sending alerts
   */
  public async processSuccessfulPayment(orderId: string, customAmount?: number): Promise<{ success: boolean; user?: User; error?: string }> {
    const data = dbStore.getData();
    const txn = data.transactions.find(t => t.order_id === orderId);

    if (!txn) {
      return { success: false, error: 'Transaction not found in database' };
    }

    if (txn.status === 'paid') {
      const user = data.users.find(u => u.user_id === txn.user_id);
      return { success: true, user };
    }

    // Mark as paid
    txn.status = 'paid';
    const creditAmount = customAmount || txn.amount_inr;

    const user = data.users.find(u => u.user_id === txn.user_id);
    if (!user) {
      return { success: false, error: 'User for this transaction not found' };
    }

    user.balance += creditAmount;
    dbStore.updateUser(user.user_id, { balance: user.balance });
    dbStore.logActivity(user.user_id, 'FAMGATEWAY_AUTO_CREDIT', `Auto-credited +₹${creditAmount.toFixed(2)} (Order #${orderId})`);
    dbStore.saveData();

    // 1. Notify the user immediately on Telegram
    try {
      await telegramEngine.sendMessage(
        user.user_id,
        `🎉 <b>PAYMENT RECEIVED & CONFIRMED!</b> 🎉\n\n` +
        `✅ <b>Status:</b> Payment Successfully Verified\n` +
        `🆔 <b>Order ID:</b> <code>${orderId}</code>\n` +
        `💰 <b>Amount Credited:</b> <b>+₹${creditAmount.toFixed(2)}</b>\n` +
        `💳 <b>New Wallet Balance:</b> <b>₹${user.balance.toFixed(2)}</b>\n\n` +
        `<i>Your wallet is ready. You can now purchase your favorite Free Fire panel keys instantly!</i>`,
        {
          inline_keyboard: [
            [{ text: '🛒 Open Product Store', callback_data: 'shop_categories' }],
            [{ text: '👤 View My Profile', callback_data: 'profile' }]
          ]
        }
      );
    } catch (tgErr: any) {
      console.warn('Could not send Telegram confirmation to user:', tgErr.message);
    }

    // 2. Alert Master Admin on Telegram
    const settings = dbStore.getData().settings;
    if (settings.admin_id) {
      try {
        await telegramEngine.sendMessage(
          settings.admin_id,
          `💰 <b>AUTOMATIC PAYMENT RECEIVED (FAMGATEWAY)</b>\n\n` +
          `👤 <b>Customer:</b> ${user.first_name} (@${user.username || user.user_id})\n` +
          `🆔 <b>Telegram ID:</b> <code>${user.user_id}</code>\n` +
          `💵 <b>Amount:</b> <b>₹${creditAmount.toFixed(2)}</b>\n` +
          `🧾 <b>Order ID:</b> <code>${orderId}</code>\n` +
          `💳 <b>User's New Balance:</b> ₹${user.balance.toFixed(2)}\n` +
          `⏰ <b>Time:</b> ${new Date().toLocaleString()}`
        );
      } catch (adminTgErr: any) {
        console.warn('Could not send Telegram alert to admin:', adminTgErr.message);
      }
    }

    return { success: true, user };
  }

  /**
   * Test API Key connection
   */
  public async testApiKey(apiKeyOverride?: string): Promise<{ success: boolean; message: string; raw?: any }> {
    const key = apiKeyOverride || this.getApiKey();
    if (!key) {
      return { success: false, message: 'API Key is empty. Please enter your FamGateway API Key.' };
    }

    try {
      const response = await fetch('https://famgateway.in/api/create-order.php', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'X-Api-Key': key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: 1.00,
          redirect_url: 'https://t.me/KalamFFPanelBot',
          order_id: 'TEST_' + Date.now()
        })
      });

      const text = await response.text();
      let parsed: any = {};
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        parsed = { raw: text };
      }

      if (response.status === 401 || response.status === 403 || parsed.error === 'Unauthorized') {
        return { success: false, message: 'Invalid FamGateway API Key (Unauthorized).' };
      }

      return {
        success: true,
        message: '✅ FamGateway API Key is valid and active!',
        raw: parsed
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Connection error: ${err.message}`
      };
    }
  }

  /**
   * Background polling loop that monitors pending transactions and auto-credits upon completion
   */
  private startBackgroundPolling() {
    if (this.pollingTimer) return;

    this.pollingTimer = setInterval(async () => {
      if (this.isChecking) return;
      const apiKey = this.getApiKey();
      if (!apiKey) return;

      const transactions = dbStore.getData().transactions;
      const now = Date.now();
      // Check pending orders created in the last 45 minutes
      const pendingTxns = transactions.filter(t => t.status === 'pending' && now - t.timestamp < 45 * 60 * 1000);

      if (pendingTxns.length === 0) return;

      this.isChecking = true;
      try {
        for (const txn of pendingTxns.slice(0, 5)) {
          const statusRes = await this.checkOrderStatus(txn.order_id);
          if (statusRes.isPaid) {
            console.log(`⚡ FamGateway Auto-Poll: Order ${txn.order_id} is PAID! Crediting user ${txn.user_id}`);
            await this.processSuccessfulPayment(txn.order_id, statusRes.amount);
          } else if (statusRes.status === 'EXPIRED') {
            txn.status = 'expired';
            dbStore.saveData();
          }
        }
      } catch (err) {
        console.error('Error in FamGateway background poller:', err);
      } finally {
        this.isChecking = false;
      }
    }, 7000); // Check every 7 seconds
  }
}

export const famGateway = new FamGatewayService();
