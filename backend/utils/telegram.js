// ── Telegram Notification Helper ─────────────────────────────────────────

require('dotenv').config();

/**
 * Send a notification to a Telegram chat via bot
 * @param {string} message - The message to send (HTML parse_mode)
 * @returns {Promise<boolean>} Whether the message was sent
 */
async function sendTelegramNotification(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  // Skip if not configured or using placeholder values
  if (!token || !chatId || token === 'your_bot_token_here') {
    return false;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });
    return response.ok;
  } catch (error) {
    console.error('Telegram notification failed:', error.message);
    return false;
  }
}

module.exports = { sendTelegramNotification };
