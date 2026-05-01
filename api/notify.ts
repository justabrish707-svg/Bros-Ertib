import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { order } = req.body;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error('Missing Telegram configuration');
    return res.status(500).json({ error: 'Telegram configuration missing' });
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
                url: `${process.env.APP_URL || "https://bros-ertib.vercel.app"}`
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

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Failed to send Telegram notification:", error);
    return res.status(500).json({ error: "Failed to send Telegram notification.", details: error.message });
  }
}
