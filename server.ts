import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import Stripe from "stripe";
import axios from "axios";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(cors()); // Enable CORS for all origins
  const PORT = Number(process.env.PORT) || 3000;

  const stripe = process.env.STRIPE_SECRET_KEY 
    ? new Stripe(process.env.STRIPE_SECRET_KEY) 
    : null;

  // Initialize Firebase Admin
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountKey) {
      initializeApp({
        credential: cert(JSON.parse(serviceAccountKey))
      });
    } else {
      initializeApp(); // relies on GOOGLE_APPLICATION_CREDENTIALS
    }
  } catch (err) {
    if ((err as any).code !== 'app/duplicate-app') {
      console.warn("Could not initialize firebase admin, DB webhooks might be disabled:", err);
    }
  }
  
  const dbAdmin = getApps().length > 0 ? getFirestore() : null;

  // Use standard JSON parsing for most routes
  app.use(express.json({
    verify: (req: any, res, buf) => {
      if (req.originalUrl.startsWith('/api/stripe-webhook')) {
        req.rawBody = buf;
      }
    }
  }));

  // API route for Chapa (Telebirr/CBE) Checkout
  app.post("/api/create-chapa-session", async (req, res) => {
    const chapaKey = process.env.CHAPA_SECRET_KEY;
    if (!chapaKey) {
      return res.status(500).json({ error: "Chapa is not configured." });
    }

    const { order } = req.body;
    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;

    try {
      const response = await axios.post(
        "https://api.chapa.co/v1/transaction/initialize",
        {
          amount: order.totalPrice,
          currency: "ETB",
          email: "customer@example.com", // You might want to collect this
          first_name: order.customerName.split(" ")[0] || "Customer",
          last_name: order.customerName.split(" ")[1] || "User",
          tx_ref: `CHAPA-${order.id}-${Date.now()}`,
          callback_url: `${appUrl}/api/chapa-callback`,
          return_url: `${appUrl}?success=true&orderId=${order.id}&method=chapa`,
          customization: {
            title: "Bro's እርጥብ Payment",
            description: `Payment for ${order.itemName}`,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${chapaKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status === "success") {
        res.json({ checkout_url: response.data.data.checkout_url });
      } else {
        throw new Error(response.data.message || "Failed to initialize Chapa");
      }
    } catch (error: any) {
      console.error("Chapa error:", error.response?.data || error.message);
      res.status(500).json({ error: error.response?.data?.message || error.message });
    }
  });

  // Chapa Webhook Callback
  app.post("/api/chapa-callback", async (req, res) => {
    // In production, verify Chapa hash signature here
    const { tx_ref, status } = req.body;
    
    if (status === "success" && tx_ref && tx_ref.startsWith("CHAPA-")) {
      const orderId = tx_ref.split("-")[1];
      
      try {
        if (dbAdmin) {
          await dbAdmin.collection("orders").doc(orderId).update({
            paymentStatus: "paid",
            status: "cooking"
          });
          console.log(`Order ${orderId} marked as paid via Chapa Webhook`);
        } else {
          console.warn("Skipping Chapa DB update; dbAdmin is disabled.");
        }
      } catch (err) {
        console.error("Failed to update order via Chapa webhook:", err);
      }
    }
    res.status(200).send("OK");
  });

  // API route for Stripe Checkout
  app.post("/api/create-checkout-session", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe is not configured." });
    }

    const { order } = req.body;
    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "etb", // Ethiopian Birr
              product_data: {
                name: order.itemName,
                description: `Order for ${order.customerName} at ${order.location}`,
              },
              unit_amount: order.totalPrice * 100, // Stripe expects amount in cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${appUrl}?success=true&orderId=${order.id}`,
        cancel_url: `${appUrl}?canceled=true`,
        metadata: {
          orderId: order.id,
          customerName: order.customerName,
          location: order.location,
        },
      });

      res.json({ id: session.id });
    } catch (error: any) {
      console.error("Stripe error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Stripe Webhook Callback
  app.post("/api/stripe-webhook", async (req: any, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripe || !webhookSecret || !sig) {
      return res.status(400).send("Stripe webhook not configured locally");
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err: any) {
      console.error("Stripe webhook error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const orderId = session.metadata?.orderId;

      if (orderId && dbAdmin) {
        try {
          await dbAdmin.collection("orders").doc(orderId).update({
            paymentStatus: "paid",
            status: "cooking"
          });
          console.log(`Order ${orderId} marked as paid via Stripe Webhook`);
        } catch (err) {
          console.error("Failed to update order via Stripe webhook:", err);
        }
      } else if (!dbAdmin) {
        console.warn("Skipping Stripe DB update; dbAdmin is disabled.");
      }
    }

    res.json({ received: true });
  });

  // Debug Endpoint to test Bot Connectivity directly
  app.get("/api/debug-bot", async (req, res) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    console.log("--- Debug Bot Request ---");
    console.log("Token exists:", !!token);
    console.log("Chat ID exists:", !!chatId);

    if (!token || !chatId) {
      return res.status(500).json({ error: "Missing config in Railway environment variables." });
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "🔧 *Backend Debug Success*\nYour Railway server is correctly talking to Telegram!",
          parse_mode: "Markdown"
        }),
      });
      const data = await response.json();
      res.json({ status: "attempted", telegram_response: data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API route for Telegram notifications
  app.post("/api/notify", async (req, res) => {
    const { order } = req.body;
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      const missing = [];
      if (!token) missing.push("TELEGRAM_BOT_TOKEN");
      if (!chatId) missing.push("TELEGRAM_CHAT_ID");
      console.warn(`Telegram credentials missing: ${missing.join(", ")}`);
      return res.status(500).json({ 
        error: "Telegram credentials not configured.",
        details: `Missing: ${missing.join(", ")}`
      });
    }

    const escapeHtml = (text: string) => {
      if (!text) return "";
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    };

    const message = `
🔥 <b>New Order Received!</b> 🔥
--------------------------
🆔 <b>Order ID:</b> <code>${order.id || "N/A"}</code>
👤 <b>Customer:</b> ${escapeHtml(order.customerName)}
📞 <b>Phone:</b> ${escapeHtml(order.phoneNumber)}
📍 <b>Location:</b> ${escapeHtml(order.location)}
🍔 <b>Item:</b> ${escapeHtml(order.itemName)} (x${order.quantity})
💰 <b>Total:</b> ${order.totalPrice} ETB
📝 <b>Instructions:</b> <i>${escapeHtml(order.specialInstructions || "None")}</i>
--------------------------
<i>Bro is cooking!</i> 👨‍🍳
    `;

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message.trim(),
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "✅ Confirm & View Order",
                  url: `${process.env.APP_URL || "http://localhost:3000"}`
                }
              ]
            ]
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Telegram API error:", errorData);
        return res.status(500).json({ 
          error: "Failed to send Telegram notification.",
          details: errorData.description || JSON.stringify(errorData)
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to send Telegram notification:", error);
      res.status(500).json({ error: "Failed to send Telegram notification." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start interactive Telegram Bot polling
  let lastUpdateId = 0;

  async function pollTelegram() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      setTimeout(pollTelegram, 5000); // Check again later
      return;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`);
      if (response.ok) {
        const data = await response.json();
        for (const update of data.result) {
          lastUpdateId = update.update_id;
          if (update.message && update.message.text) {
            handleTelegramMessage(update.message, token);
          }
        }
      }
    } catch (error) {
      console.error("Telegram polling error:", error);
    }
    
    // Continue polling continuously
    setTimeout(pollTelegram, 1000);
  }

  async function handleTelegramMessage(message: any, token: string) {
    const chatId = message.chat.id;
    const text = message.text || "";

    let reply = "";
    if (text.startsWith("/start")) {
      reply = "🌟 Welcome to Bro's እርጥብ! 🌟\n\nUse /menu to see our delicious options, or /order to place an order.";
    } else if (text.startsWith("/menu")) {
      reply = "🍽️ *Our Menu:*\n1. Bro's Special እርጥብ - 80 ETB\n2. Bro's እርጥብ - 50 ETB\n3. Fries / Chips - 20 ETB\n4. Sambusa / ሳንቡሳ - 25 ETB\n\nType /order to start your order!";
    } else if (text.startsWith("/order")) {
      reply = "Awesome! To order, please reply with your choice, quantity, and location.\n\nExample: *1 Special, 2 Fries, Arba Minch University*";
    } else {
      reply = "We received your message! For direct web orders and full menu, visit our site: " + (process.env.APP_URL || "http://localhost:3000");
    }

    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: reply, parse_mode: "Markdown" })
      });
    } catch (err) {
      console.error("Failed to send telegram reply:", err);
    }
  }

  // Start the bot loop!
  pollTelegram();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
