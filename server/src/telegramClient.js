const TELEGRAM_API_BASE = "https://api.telegram.org";

function getTelegramToken(overrideToken) {
  const token = overrideToken || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    const err = new Error("Missing Telegram bot token");
    err.statusCode = 400;
    throw err;
  }
  return token;
}

async function callTelegramApi(method, payload, overrideToken) {
  const token = getTelegramToken(overrideToken);
  const url = `${TELEGRAM_API_BASE}/bot${token}/${method}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    const err = new Error(data.description || "Telegram API request failed");
    err.statusCode = 502;
    err.details = data;
    throw err;
  }

  return data;
}

async function sendMessage({ chatId, text, botToken }) {
  if (!chatId || !text) {
    const err = new Error("chatId and text are required");
    err.statusCode = 400;
    throw err;
  }

  return callTelegramApi(
    "sendMessage",
    {
      chat_id: chatId,
      text,
      disable_web_page_preview: false
    },
    botToken
  );
}

async function sendVideo({ chatId, videoUrl, caption, supportsStreaming = true, botToken }) {
  if (!chatId || !videoUrl) {
    const err = new Error("chatId and videoUrl are required");
    err.statusCode = 400;
    throw err;
  }

  return callTelegramApi(
    "sendVideo",
    {
      chat_id: chatId,
      video: videoUrl,
      caption,
      supports_streaming: Boolean(supportsStreaming)
    },
    botToken
  );
}

module.exports = {
  sendMessage,
  sendVideo
};
