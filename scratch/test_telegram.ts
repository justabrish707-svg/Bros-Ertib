import "dotenv/config";

async function testBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error("❌ Error: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing in .env");
    return;
  }

  console.log(`Testing bot with Token: ${token.substring(0, 10)}... (truncated)`);
  console.log(`Target Chat ID: ${chatId}`);

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "🚀 *Bot System Check*\n\nYour Telegram bot is successfully connected to Bro's እርጥብ! Your server is ready for deployment.",
        parse_mode: "Markdown"
      }),
    });

    const data = await response.json();
    if (data.ok) {
      console.log("✅ SUCCESS: Telegram message sent successfully! Check your phone.");
    } else {
      console.error("❌ FAILURE: Telegram API returned an error:");
      console.error(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("❌ ERROR: Connection failed.", error);
  }
}

testBot();
