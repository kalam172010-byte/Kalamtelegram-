import express from 'express';
import path from 'path';
import QRCode from 'qrcode';
import { createServer as createViteServer } from 'vite';
import { dbStore } from './server/storage';
import { telegramEngine } from './server/telegramEngine';
import { famGateway } from './server/famGateway';
import { bantiResellerService } from './server/bantiResellerApi';
import { apiLogger } from './server/apiLogger';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // ---------------------------------------------------------------------------
  // API ROUTES
  // ---------------------------------------------------------------------------

  // Render & Cloud Health Check Endpoints
  const healthCheck = (req: express.Request, res: express.Response) => {
    res.json({
      status: 'ok',
      service: 'Kalam FF Panel Server',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      telegram: telegramEngine.getStatus()
    });
  };

  app.get('/healthz', healthCheck);
  app.get('/api/health', healthCheck);

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

  // 2.1 Bot Management Endpoints
  app.get('/api/bots', (req, res) => {
    res.json({ success: true, bots: dbStore.getBots() });
  });

  app.post('/api/bots', async (req, res) => {
    try {
      const { action, bot, botId, updates } = req.body;

      if (action === 'save' || action === 'create') {
        if (!bot) return res.status(400).json({ success: false, error: 'bot object is required' });
        const saved = dbStore.saveBot(bot);
        const allBots = dbStore.getBots();
        if (allBots.length === 1 || (bot.bot_token && bot.bot_token.trim())) {
          dbStore.updateSettings({
            bot_token: bot.bot_token,
            bot_username: bot.username,
            admin_id: bot.admin_id || bot.admin_chat_id || dbStore.getData().settings.admin_id
          });
          await telegramEngine.restart();
        }
        return res.json({ success: true, bot: saved, bots: allBots, settings: dbStore.getData().settings });
      }

      if (action === 'update') {
        if (!botId || !updates) return res.status(400).json({ success: false, error: 'botId and updates required' });
        const updated = dbStore.updateBot(botId, updates);
        if (updates.bot_token || updates.admin_id) {
          const currentToken = dbStore.getData().settings.bot_token;
          if (updated && (updated.bot_token === currentToken || updates.bot_token)) {
            dbStore.updateSettings({
              bot_token: updated.bot_token,
              bot_username: updated.username,
              admin_id: updated.admin_id || dbStore.getData().settings.admin_id
            });
            await telegramEngine.restart();
          }
        }
        return res.json({ success: true, bot: updated, bots: dbStore.getBots() });
      }

      if (action === 'delete') {
        if (!botId) return res.status(400).json({ success: false, error: 'botId is required' });
        const allBotsBefore = dbStore.getBots();
        const targetBot = allBotsBefore.find(b => b.id === botId);
        dbStore.deleteBot(botId);
        const remainingBots = dbStore.getBots();

        const currentSettings = dbStore.getData().settings;
        const wasActiveToken = targetBot && (targetBot.bot_token === currentSettings.bot_token || targetBot.username === currentSettings.bot_username);

        if (remainingBots.length === 0) {
          dbStore.updateSettings({
            bot_token: '',
            bot_username: ''
          });
          await telegramEngine.stop();
        } else if (wasActiveToken) {
          const nextBot = remainingBots[0];
          dbStore.updateSettings({
            bot_token: nextBot.bot_token,
            bot_username: nextBot.username,
            admin_id: nextBot.admin_id || currentSettings.admin_id
          });
          await telegramEngine.restart();
        } else {
          await telegramEngine.restart();
        }
        return res.json({ success: true, bots: dbStore.getBots(), settings: dbStore.getData().settings });
      }

      if (action === 'delete_all' || action === 'purge_all') {
        dbStore.resetBots?.();
        dbStore.updateSettings({
          bot_token: '',
          bot_username: ''
        });
        await telegramEngine.stop();
        return res.json({ success: true, bots: [], settings: dbStore.getData().settings });
      }

      res.status(400).json({ success: false, error: 'Invalid action' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Update Settings (Bot Token, Admin ID, FamPay, FamGateway, Reseller API, etc.)
  app.post('/api/settings', async (req, res) => {
    try {
      const updates = req.body;
      const newSettings = dbStore.updateSettings(updates);

      dbStore.logActivity(12846461, 'SETTINGS_UPDATE', 'System settings updated by admin');

      // Also sync active bot if bot_token or gateways are updated
      const bots = dbStore.getBots();
      if (bots.length > 0) {
        const firstBot = bots[0];
        const botUpdates: any = {};
        if (updates.bot_token) botUpdates.bot_token = updates.bot_token;
        if (updates.bot_username) botUpdates.username = updates.bot_username;
        if (updates.fampay_upi_id || updates.famgateway_api_key || updates.merchant_name) {
          botUpdates.payment_gateway = {
            ...firstBot.payment_gateway,
            ...(updates.fampay_upi_id ? { upi_id: updates.fampay_upi_id } : {}),
            ...(updates.famgateway_api_key ? { api_key: updates.famgateway_api_key } : {}),
            ...(updates.merchant_name ? { merchant_name: updates.merchant_name } : {})
          };
        }
        if (updates.bantibhaiya_api_key || updates.bantibhaiya_master_key || updates.bantibhaiya_api_url) {
          botUpdates.reseller_api = {
            ...firstBot.reseller_api,
            ...(updates.bantibhaiya_api_key ? { api_key: updates.bantibhaiya_api_key } : {}),
            ...(updates.bantibhaiya_master_key ? { master_key: updates.bantibhaiya_master_key } : {}),
            ...(updates.bantibhaiya_api_url ? { api_url: updates.bantibhaiya_api_url } : {})
          };
        }
        if (Object.keys(botUpdates).length > 0) {
          dbStore.updateBot(firstBot.id, botUpdates);
        }
      }

      // If bot token, admin id, or status/maintenance is provided, restart or start engine
      if (
        updates.bot_token ||
        updates.admin_id ||
        updates.bot_status ||
        updates.maintenance_mode !== undefined ||
        !telegramEngine.getStatus().isRunning
      ) {
        await telegramEngine.restart();
      }

      res.json({ success: true, settings: newSettings, bots: dbStore.getBots(), status: telegramEngine.getStatus() });
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

  // 6b. Update User Profile (Avatar, Name, Username, Last Login)
  app.post('/api/users/profile', (req, res) => {
    try {
      const { userId, avatar_url, first_name, username, last_login } = req.body;
      const numUserId = Number(userId);
      if (!numUserId || isNaN(numUserId)) {
        return res.status(400).json({ success: false, error: 'Valid userId is required' });
      }

      const data = dbStore.getData();
      let user = data.users.find(u => u.user_id === numUserId);
      if (!user) {
        user = dbStore.getOrCreateUser(numUserId, first_name || `User ${numUserId}`, username || `user_${numUserId}`);
      }

      if (avatar_url !== undefined) user.avatar_url = avatar_url;
      if (first_name) user.first_name = first_name;
      if (username) user.username = username.replace(/^@/, '');
      if (last_login) user.last_login = last_login;

      dbStore.saveData();
      res.json({ success: true, user, users: data.users });
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

  // 13b. Send Broadcast (Text, Photo, Video, Voice, Audio)
  app.post('/api/broadcast', async (req, res) => {
    try {
      const { targetAudience, text, mediaType, imageUrl, videoUrl, voiceUrl, audioUrl, mediaUrl, mediaBase64, mediaFilename, mediaMimeType, buttonText, buttonUrl, pinMessage } = req.body;
      const data = dbStore.getData();
      let recipients = data.users;

      if (targetAudience === 'referrers') {
        recipients = data.users.filter(u => (u.referral_count || 0) > 0);
      } else if (targetAudience === 'vip') {
        recipients = data.users.filter(u => u.is_vip === 1);
      } else if (targetAudience === 'reseller') {
        recipients = data.users.filter(u => u.is_reseller === 1);
      } else if (targetAudience === 'non_reseller') {
        recipients = data.users.filter(u => u.is_reseller === 0);
      }

      const result = await telegramEngine.sendBroadcast({
        targetAudience: targetAudience || 'all',
        text,
        mediaType,
        imageUrl,
        videoUrl,
        voiceUrl,
        audioUrl,
        mediaUrl,
        mediaBase64,
        mediaFilename,
        mediaMimeType,
        buttonText,
        buttonUrl,
        pinMessage,
        recipients
      });

      res.json({
        success: true,
        sent: result.sent,
        failed: result.failed,
        recipientCount: recipients.length,
        message: `Broadcast delivered to ${result.sent} users (${result.failed} failed).`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 13c. Telegram Bot Commands Management (Get, Sync, Clear via Telegram API)
  app.get('/api/bot/commands', async (_req, res) => {
    try {
      const savedCommands = dbStore.getData().settings.bot_commands || [
        { command: 'start', description: '⚡ Open Kalam FF Panel Main Store' },
        { command: 'buy', description: '🛒 Browse & Buy Panel Keys' },
        { command: 'check_update', description: '📥 Check Latest APK Updates & Downloads' },
        { command: 'balance', description: '💳 Add Wallet Balance via UPI' },
        { command: 'profile', description: '👤 View Profile & Purchased Keys' },
        { command: 'referral', description: '🔗 Refer Friends & Earn Rewards' },
        { command: 'support', description: '🎧 24/7 Support & Official Channels' },
        { command: 'help', description: '📖 How to Install & Use Panels' }
      ];

      // Try fetching live commands from Telegram API
      let liveCommands = null;
      try {
        const liveRes = await telegramEngine.getMyCommands();
        if (Array.isArray(liveRes)) {
          liveCommands = liveRes;
        }
      } catch (e: any) {
        console.warn('Could not fetch live Telegram commands:', e.message);
      }

      res.json({
        success: true,
        commands: savedCommands,
        liveCommands
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/bot/commands', async (req, res) => {
    try {
      const { commands } = req.body;
      if (!Array.isArray(commands)) {
        return res.status(400).json({ success: false, error: 'Commands must be an array' });
      }

      // Save to local dbStore
      dbStore.updateSettings({ bot_commands: commands });

      // Sync to live Telegram API
      let apiResult = null;
      try {
        apiResult = await telegramEngine.setMyCommands(commands);
      } catch (e: any) {
        console.warn('Telegram API setMyCommands notice:', e.message);
      }

      res.json({
        success: true,
        commands,
        apiResult,
        message: 'Bot commands updated and synced with Telegram API successfully!'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/bot/commands', async (_req, res) => {
    try {
      // Clear from dbStore
      dbStore.updateSettings({ bot_commands: [] });

      // Delete from Telegram API
      let apiResult = null;
      try {
        apiResult = await telegramEngine.deleteMyCommands();
      } catch (e: any) {
        console.warn('Telegram API deleteMyCommands notice:', e.message);
      }

      res.json({
        success: true,
        apiResult,
        message: 'All Telegram Bot commands have been deleted successfully!'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
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
  app.post(['/api/famgateway-webhook', '/api/famgateway/webhook', '/api/payment-webhook', '/api/fampay/webhook'], async (req, res) => {
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

  // 18b. Direct QR Image Rendering Endpoint
  app.get('/api/qr', async (req, res) => {
    try {
      const data = String(req.query.data || '');
      if (!data) {
        return res.status(400).send('Missing QR data parameter');
      }
      const buffer = await QRCode.toBuffer(data, {
        width: 500,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(buffer);
    } catch (err: any) {
      res.status(500).send('Failed to generate QR: ' + err.message);
    }
  });

  // 18c. Direct Web Checkout & UPI Scanner Page
  app.get('/pay/:orderId', async (req, res) => {
    try {
      const orderId = req.params.orderId;
      const data = dbStore.getData();
      const txn = data.transactions.find(t => t.order_id === orderId);

      const amount = txn ? txn.amount_inr : 100;
      const upiId = famGateway.getUpiId();
      const payeeName = famGateway.getPayeeName();
      const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&tn=${encodeURIComponent(orderId)}&cu=INR`;

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pay ₹${amount.toFixed(2)} - ${payeeName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4 font-sans">
  <div class="max-w-md w-full bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-6">
    <div class="text-center space-y-1">
      <div class="inline-flex p-2.5 bg-cyan-500/20 text-cyan-400 rounded-2xl mb-2">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
      </div>
      <h1 class="text-xl font-bold text-white tracking-wide">${payeeName}</h1>
      <p class="text-xs text-slate-400">Order ID: <code class="text-cyan-300">${orderId}</code></p>
    </div>

    <div class="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 flex justify-between items-center">
      <span class="text-sm text-slate-400">Amount to Pay</span>
      <span class="text-2xl font-black text-emerald-400">₹${amount.toFixed(2)}</span>
    </div>

    <div class="bg-white p-4 rounded-2xl shadow-xl flex justify-center items-center">
      <img src="/api/qr?data=${encodeURIComponent(upiUri)}" alt="Scan QR Code" class="w-64 h-64 object-contain rounded-lg" />
    </div>

    <div class="space-y-3 text-center">
      <div class="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
        <div class="text-left text-xs font-mono truncate mr-2">
          <span class="text-slate-400 block text-[10px]">UPI ID:</span>
          <span class="text-cyan-300 font-bold select-all">${upiId}</span>
        </div>
        <button onclick="navigator.clipboard.writeText('${upiId}'); alert('UPI ID copied: ${upiId}');" class="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold shrink-0 transition">
          Copy UPI
        </button>
      </div>

      <div class="grid grid-cols-2 gap-2 pt-2">
        <a href="${upiUri}" class="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow transition">
          <span>PhonePe / GPay</span>
        </a>
        <a href="${upiUri}" class="p-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow transition">
          <span>Paytm / FamPay</span>
        </a>
      </div>
    </div>

    <div class="border-t border-slate-800 pt-4 text-center">
      <p class="text-xs text-slate-400">⚡ After paying, your Telegram balance credits automatically in seconds!</p>
    </div>
  </div>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (err: any) {
      res.status(500).send('Error loading payment page: ' + err.message);
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

  // 22. System Health & Diagnostic Inspection API
  app.get('/api/system/health', async (req, res) => {
    try {
      const data = dbStore.getData();
      const settings = data.settings;
      const tgStatus = telegramEngine.getStatus();
      const gatewayApiKey = famGateway.getApiKey();
      const upiId = famGateway.getUpiId();
      const payeeName = famGateway.getPayeeName();
      const healthSummary = apiLogger.getHealthSummary();
      const logs = apiLogger.getLogs(60);
      const failedTransactions = apiLogger.getFailedTransactions();

      // Find any transactions that have been pending for more than 15 minutes or are marked failed
      const now = Date.now();
      const problematicTxns = data.transactions
        .filter(t => t.status === 'failed' || t.status === 'expired' || (t.status === 'pending' && now - t.timestamp > 15 * 60 * 1000))
        .map(t => {
          let reason = 'Payment pending without completion';
          if (t.status === 'expired') reason = 'Payment session expired';
          if (t.status === 'failed') reason = 'Transaction failed or rejected';
          if (!gatewayApiKey) reason = 'FamGateway API Key not set (UPI Direct Mode - requires manual verification)';

          return {
            order_id: t.order_id,
            user_id: t.user_id,
            amount_inr: t.amount_inr,
            status: t.status,
            reason,
            timestamp: t.timestamp
          };
        });

      // Merge recorded failed transactions with problematic ones
      const combinedFailed = [...failedTransactions];
      for (const p of problematicTxns) {
        if (!combinedFailed.some(f => f.order_id === p.order_id)) {
          combinedFailed.push(p);
        }
      }

      res.json({
        success: true,
        summary: {
          ...healthSummary,
          failedTransactionsCount: combinedFailed.length
        },
        telegram: {
          isRunning: tgStatus.isRunning,
          isConnected: tgStatus.isConnected,
          botName: tgStatus.botInfo?.first_name || settings.bot_name || 'Kalam Bot',
          username: tgStatus.botInfo?.username || settings.bot_username || 'KalamFFPanelBot',
          tokenConfigured: Boolean(settings.bot_token && !settings.bot_token.includes('exampleToken')),
          lastError: tgStatus.lastError
        },
        famgateway: {
          configured: Boolean(gatewayApiKey),
          upiId,
          payeeName,
          apiKeyMasked: gatewayApiKey ? `${gatewayApiKey.slice(0, 4)}...${gatewayApiKey.slice(-4)}` : 'Not Set (Direct UPI Fallback Active)'
        },
        resellerApi: {
          configured: Boolean(settings.bantibhaiya_api_key),
          apiUrl: settings.bantibhaiya_api_url || 'https://bantibhaiya.org/api/',
          hasMasterKey: Boolean(settings.bantibhaiya_master_key)
        },
        logs,
        failedTransactions: combinedFailed
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 23. Filtered API Logs Query
  app.get('/api/system/logs', (req, res) => {
    try {
      const service = req.query.service ? String(req.query.service) : 'ALL';
      const status = req.query.status ? String(req.query.status) : 'ALL';
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const logs = apiLogger.getLogs(limit, service, status);
      res.json({ success: true, logs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 24. Clear Diagnostic API Logs
  app.post('/api/system/logs/clear', (req, res) => {
    try {
      apiLogger.clearLogs();
      res.json({ success: true, logs: apiLogger.getLogs(20) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });


  app.post('/api/system/retry-transaction', async (req, res) => {
    try {
      const { orderId } = req.body;
      if (!orderId) {
        return res.status(400).json({ success: false, error: 'Order ID is required' });
      }

      const statusRes = await famGateway.checkOrderStatus(orderId);
      let autoCredited = false;

      if (statusRes.isPaid) {
        await famGateway.processSuccessfulPayment(orderId, statusRes.amount);
        autoCredited = true;
      }

      const data = dbStore.getData();
      res.json({
        success: true,
        statusResult: statusRes,
        autoCredited,
        transactions: data.transactions,
        users: data.users
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 26. Force Manual Approval of Failed/Pending Transaction
  app.post('/api/system/approve-transaction', async (req, res) => {
    try {
      const { orderId, amount, utr } = req.body;
      if (!orderId) {
        return res.status(400).json({ success: false, error: 'Order ID is required' });
      }

      const result = await famGateway.processSuccessfulPayment(
        orderId,
        amount ? Number(amount) : undefined,
        utr || 'ADMIN_FORCE_APPROVE'
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      apiLogger.log({
        service: 'DATABASE',
        endpoint: '/api/system/approve-transaction',
        method: 'POST',
        status: 'SUCCESS',
        http_code: 200,
        message: `Admin manually approved transaction #${orderId}`
      });

      const data = dbStore.getData();
      res.json({
        success: true,
        user: result.user,
        transactions: data.transactions,
        users: data.users
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 27. Run Instant Health Diagnostics Ping
  app.post('/api/system/test-health', async (req, res) => {
    try {
      const tgResult = await telegramEngine.testConnection();
      const gwResult = await famGateway.testApiKey();
      const settings = dbStore.getData().settings;
      let resellerResult: any = { success: false, message: 'Provider API not configured' };

      if (settings.bantibhaiya_api_key) {
        resellerResult = await bantiResellerService.testConnection(
          settings.bantibhaiya_api_key,
          settings.bantibhaiya_master_key,
          settings.bantibhaiya_api_url
        );
      }

      res.json({
        success: true,
        telegram: tgResult,
        famgateway: gwResult,
        resellerApi: resellerResult,
        timestamp: new Date().toISOString()
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

    // 24/7 Global Keep-Alive Server Heartbeat
    setInterval(() => {
      const status = telegramEngine.getStatus();
      if (!status.isRunning) {
        console.log('⚡ Server Keep-Alive: Restarting standby Telegram Bot Engine...');
        telegramEngine.start().catch(() => {});
      }
    }, 15000);

    // 24/7 Render Anti-Sleep Self-Ping Loop (every 8 minutes)
    setInterval(async () => {
      try {
        const pingUrl = process.env.RENDER_EXTERNAL_URL
          ? `${process.env.RENDER_EXTERNAL_URL}/healthz`
          : process.env.APP_URL
          ? `${process.env.APP_URL}/healthz`
          : `http://127.0.0.1:${PORT}/healthz`;

        await fetch(pingUrl).catch(() => {});
      } catch {}
    }, 8 * 60 * 1000);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
