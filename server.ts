import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { dbStore } from './server/storage';
import { telegramEngine } from './server/telegramEngine';
import { famGateway } from './server/famGateway';
import { bantiResellerService } from './server/bantiResellerApi';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ---------------------------------------------------------------------------
  // API ROUTES
  // ---------------------------------------------------------------------------

  // 1. Bot Engine Status
  app.get('/api/status', (req, res) => {
    const status = telegramEngine.getStatus();
    res.json(status);
  });

  // 2. Fetch All Data
  app.get('/api/data', (req, res) => {
    const data = dbStore.getData();
    res.json(data);
  });

  // 3. Update Settings (Bot Token, Admin ID, FamPay, etc.)
  app.post('/api/settings', async (req, res) => {
    try {
      const updates = req.body;
      const oldSettings = { ...dbStore.getData().settings };
      const newSettings = dbStore.updateSettings(updates);

      dbStore.logActivity(12846461, 'SETTINGS_UPDATE', 'System settings updated by admin');

      // If bot token, admin id, or status is provided, restart or start engine
      if (
        updates.bot_token ||
        updates.admin_id ||
        updates.bot_status ||
        !telegramEngine.getStatus().isRunning
      ) {
        await telegramEngine.restart();
      }

      res.json({ success: true, settings: newSettings, status: telegramEngine.getStatus() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Update Custom Emojis
  app.post('/api/emojis', (req, res) => {
    try {
      const updates = req.body;
      const emojis = dbStore.updateEmojis(updates);
      res.json({ success: true, emojis });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Manage Products (Add, Edit, Delete, Stock/Key refill)
  app.post('/api/products', (req, res) => {
    try {
      const { action, product, productId, keys, keyId } = req.body;

      if (action === 'create' && product) {
        dbStore.addProduct(product, keys);
        dbStore.logActivity(12846461, 'CREATE_PRODUCT', `Created product: ${product.name}`);
      } else if (action === 'update' && product) {
        dbStore.updateProduct(Number(product.id), product);
        dbStore.logActivity(12846461, 'UPDATE_PRODUCT', `Updated product: ${product.name}`);
      } else if (action === 'delete') {
        const idToDelete = Number(productId);
        dbStore.deleteProduct(idToDelete);
        dbStore.logActivity(12846461, 'DELETE_PRODUCT', `Deleted product ID: ${idToDelete}`);
      } else if (action === 'add_keys') {
        const id = Number(productId);
        dbStore.injectProductKeys(id, keys || []);
        dbStore.logActivity(12846461, 'INJECT_KEYS', `Added ${(keys || []).length} keys to product ID ${id}`);
      } else if (action === 'delete_key') {
        const id = Number(keyId);
        dbStore.deleteProductKey(id);
        dbStore.logActivity(12846461, 'DELETE_KEY', `Deleted key ID ${id}`);
      }

      const currentData = dbStore.getData();
      res.json({ success: true, products: currentData.products, productKeys: currentData.productKeys });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. Manage Users (Balance adjustment, VIP/Reseller toggle, Bans, Warnings)
  app.post('/api/users', async (req, res) => {
    try {
      const { action, userId, amount, is_reseller, is_vip, is_banned, warning_count, reason, notifyTelegram } = req.body;
      const numUserId = Number(userId);

      if (!numUserId) {
        return res.status(400).json({ success: false, error: 'Valid userId is required' });
      }

      if (action === 'balance') {
        const delta = Number(amount);
        const result = dbStore.adjustUserBalance(numUserId, delta, reason || 'Admin Wallet Adjustment');

        // Deliver instant Telegram notification receipt to user
        if (notifyTelegram !== false && telegramEngine) {
          try {
            const isAdd = delta >= 0;
            const notifText = isAdd
              ? `🎉 <b>WALLET RECHARGE SUCCESSFUL!</b>\n\n` +
                `💰 <b>Amount Credited:</b> ₹${delta.toFixed(2)}\n` +
                `💳 <b>New Wallet Balance:</b> ₹${result.newBalance.toFixed(2)}\n` +
                `📝 <b>Reference:</b> ${reason || 'Admin Payment Credit'}\n\n` +
                `<i>Your funds are now active! Use the button below to browse panel keys.</i>`
              : `⚠️ <b>WALLET BALANCE ADJUSTMENT</b>\n\n` +
                `🔻 <b>Amount Deducted:</b> ₹${Math.abs(delta).toFixed(2)}\n` +
                `💳 <b>Updated Balance:</b> ₹${result.newBalance.toFixed(2)}\n` +
                `📝 <b>Reason:</b> ${reason || 'Admin Adjustment'}`;

            const inlineKeyboard = {
              inline_keyboard: [
                [
                  { text: '🛒 Open Store & Buy Keys', callback_data: 'shop_categories' },
                  { text: '💳 Check Wallet', callback_data: 'user_balance' }
                ]
              ]
            };

            await telegramEngine.sendMessage(numUserId, notifText, inlineKeyboard);
          } catch (tgErr: any) {
            console.warn(`Telegram balance notification notice for UID ${numUserId}:`, tgErr.message);
          }
        }

        const data = dbStore.getData();
        return res.json({
          success: true,
          user: result.user,
          users: data.users,
          transactions: data.transactions
        });
      }

      const data = dbStore.getData();
      let user = data.users.find(u => u.user_id === numUserId);

      if (!user) {
        user = dbStore.getOrCreateUser(numUserId, `User ${numUserId}`, `user_${numUserId}`);
      }

      if (action === 'update_role') {
        if (is_reseller !== undefined) user.is_reseller = is_reseller ? 1 : 0;
        if (is_vip !== undefined) user.is_vip = is_vip ? 1 : 0;
        if (is_banned !== undefined) user.is_banned = is_banned ? 1 : 0;
        if (warning_count !== undefined) user.warnings = warning_count;
        dbStore.logActivity(user.user_id, 'USER_ROLE_UPDATE', `Permissions updated by admin`);
      }

      dbStore.saveData();
      res.json({ success: true, user, users: data.users, transactions: data.transactions });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. Manage Support Tickets (Reply directly to Telegram user!)
  app.post('/api/tickets/reply', async (req, res) => {
    try {
      const { ticketId, replyMessage, closeTicket } = req.body;
      const data = dbStore.getData();
      const ticket = data.tickets.find(t => t.id === Number(ticketId));

      if (!ticket) {
        return res.status(404).json({ success: false, error: 'Ticket not found' });
      }

      ticket.admin_reply = replyMessage;
      ticket.replied_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
      if (closeTicket) {
        ticket.status = 'Closed';
      }

      dbStore.logActivity(12846461, 'ADMIN_REPLY_TICKET', `Ticket #${ticketId}`);
      dbStore.saveData();

      // Send the reply directly to the user's real Telegram chat!
      try {
        await telegramEngine.sendMessage(
          ticket.user_id,
          `💬 <b>SUPPORT TICKET UPDATE (#${ticketId})</b>\n\n` +
          `<b>Admin Message:</b>\n${replyMessage}\n\n` +
          `<i>Status: ${ticket.status}</i>`
        );
      } catch (tgErr: any) {
        console.warn('Could not deliver Telegram notification to user:', tgErr.message);
      }

      res.json({ success: true, ticket, tickets: data.tickets });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 8. Manage Coupons
  app.post('/api/coupons', (req, res) => {
    try {
      const { action, coupon, couponCode } = req.body;
      const data = dbStore.getData();

      if (action === 'create') {
        data.coupons.push(coupon);
        dbStore.logActivity(12846461, 'CREATE_COUPON', `Created promo coupon: ${coupon.code} (₹${coupon.amount})`);
      } else if (action === 'delete') {
        data.coupons = data.coupons.filter(c => c.code !== couponCode);
        dbStore.logActivity(12846461, 'DELETE_COUPON', `Deleted coupon: ${couponCode}`);
      }

      dbStore.saveData();
      res.json({ success: true, coupons: data.coupons });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 9. Test Telegram Bot Connection & Credentials
  app.post('/api/bot/test-token', async (req, res) => {
    try {
      const result = await telegramEngine.testConnection();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 10. Send Test Message to Admin ID on Telegram
  app.post('/api/bot/send-test', async (req, res) => {
    try {
      const result = await telegramEngine.sendAdminTestMessage();
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 11. Start/Restart Bot Engine
  app.post('/api/bot/restart', async (req, res) => {
    try {
      await telegramEngine.restart();
      res.json({ success: true, status: telegramEngine.getStatus() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 12. Reset Database to Defaults
  app.post('/api/bot/reset', (req, res) => {
    try {
      dbStore.resetToDefaults();
      res.json({ success: true, data: dbStore.getData() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 13. Telegram Webhook (Optional webhook mode)
  app.post('/api/telegram-webhook', async (req, res) => {
    try {
      await telegramEngine.handleUpdate(req.body);
      res.sendStatus(200);
    } catch (err) {
      res.sendStatus(500);
    }
  });

  // 14. FamGateway Automated Payment: Create Order
  app.post('/api/payment/famgateway/create-order', async (req, res) => {
    try {
      const { amount, userId, redirectUrl, customerMobile } = req.body;
      const result = await famGateway.createOrder({
        amount: Number(amount),
        userId: Number(userId || 12846461),
        redirectUrl,
        customerMobile
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 15. FamGateway Automated Payment: Check Order Status & Auto-Credit
  app.post('/api/payment/famgateway/check-status', async (req, res) => {
    try {
      const { orderId } = req.body;
      if (!orderId) {
        return res.status(400).json({ success: false, error: 'Order ID is required' });
      }

      const statusRes = await famGateway.checkOrderStatus(orderId);
      if (statusRes.isPaid) {
        await famGateway.processSuccessfulPayment(orderId, statusRes.amount);
      }

      const data = dbStore.getData();
      res.json({
        ...statusRes,
        transactions: data.transactions,
        users: data.users
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 16. FamGateway Automated Payment: Test API Key
  app.post('/api/payment/famgateway/test-key', async (req, res) => {
    try {
      const { apiKey } = req.body;
      const result = await famGateway.testApiKey(apiKey);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 17. FamGateway Webhook Handler (Instant Server-to-Server Payment Notification)
  app.post(['/api/famgateway-webhook', '/api/payment-webhook'], async (req, res) => {
    try {
      const body = req.body || {};
      const orderId = body.order_id || body.id || body.orderId;
      const amount = body.amount ? Number(body.amount) : undefined;

      console.log('⚡ FamGateway Webhook received:', body);

      if (orderId) {
        await famGateway.processSuccessfulPayment(String(orderId), amount);
      }
      res.status(200).json({ status: 'ok', received: true });
    } catch (err: any) {
      console.error('FamGateway Webhook error:', err.message);
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // 18. Simulate Payment Success (For live testing preview)
  app.post('/api/payment/simulate-success', async (req, res) => {
    try {
      const { orderId } = req.body;
      const result = await famGateway.processSuccessfulPayment(orderId);
      res.json({ ...result, data: dbStore.getData() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 19. BantiBhaiya Provider: Test Connection & Master Key
  app.post('/api/provider/test-connection', async (req, res) => {
    try {
      const { apiKey, masterKey, apiUrl } = req.body;
      const result = await bantiResellerService.testConnection(apiKey, masterKey, apiUrl);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 20. BantiBhaiya Provider: Buy / Generate Key Direct
  app.post('/api/provider/buy-key', async (req, res) => {
    try {
      const { productId, duration, androidId, apiKey, masterKey, apiUrl } = req.body;
      if (!productId || !duration) {
        return res.status(400).json({ success: false, error: 'Product ID (PID) and duration are required' });
      }

      const result = await bantiResellerService.buyKey({
        productId,
        duration,
        androidId,
        apiKey,
        masterKey,
        apiUrl
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 21. Admin Broadcast Message to All Users
  app.post('/api/broadcast', async (req, res) => {
    try {
      const { targetAudience = 'all', text, imageUrl, buttonText, buttonUrl, pinMessage } = req.body;
      if (!text || !text.trim()) {
        return res.status(400).json({ success: false, error: 'Broadcast message text is required' });
      }

      const data = dbStore.getData();
      let recipients = data.users;
      if (targetAudience === 'vip') {
        recipients = data.users.filter(u => u.is_vip);
      } else if (targetAudience === 'reseller') {
        recipients = data.users.filter(u => u.is_reseller);
      } else if (targetAudience === 'non_reseller') {
        recipients = data.users.filter(u => !u.is_reseller);
      }

      dbStore.logActivity(
        12846461,
        'ADMIN_BROADCAST',
        `Broadcast sent to ${recipients.length} users (${targetAudience}): "${text.slice(0, 45)}..."`
      );

      // If live Telegram bot engine is running, dispatch to real chat channels
      let telegramStats = { sent: 0, failed: 0 };
      if (telegramEngine.getStatus().isRunning) {
        try {
          telegramStats = await telegramEngine.sendBroadcast({
            targetAudience,
            text,
            imageUrl,
            buttonText,
            buttonUrl,
            pinMessage,
            recipients
          });
        } catch (e: any) {
          console.warn('Live telegram broadcast warning:', e.message);
        }
      }

      res.json({
        success: true,
        recipientCount: recipients.length,
        telegramStats,
        message: `Broadcast delivered to ${recipients.length} user(s) successfully.`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // VITE & STATIC FILES
  // ---------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start HTTP Server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Kalam FF Panel Server running on http://0.0.0.0:${PORT}`);
    telegramEngine.start().catch(err => {
      console.error('Failed to start Telegram Engine on boot:', err);
    });
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
