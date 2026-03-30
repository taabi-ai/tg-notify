require("dotenv").config();

const express = require("express");
const { sendMessage, sendVideo } = require("./telegramClient");

const app = express();
const port = Number(process.env.PORT || 8080);

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "tg-notify-server" });
});

app.post("/api/telegram/send-message", async (req, res) => {
  try {
    const { chatId, text, botToken } = req.body || {};
    const result = await sendMessage({ chatId, text, botToken });
    res.json({ ok: true, result });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ok: false,
      error: error.message || "Unexpected error",
      details: error.details || null
    });
  }
});

app.post("/api/telegram/send-video", async (req, res) => {
  try {
    const { chatId, videoUrl, caption, supportsStreaming, botToken } = req.body || {};
    const result = await sendVideo({
      chatId,
      videoUrl,
      caption,
      supportsStreaming,
      botToken
    });
    res.json({ ok: true, result });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      ok: false,
      error: error.message || "Unexpected error",
      details: error.details || null
    });
  }
});

app.post("/api/telegram/send-batch", async (req, res) => {
  try {
    const { groups, items } = req.body || {};

    if (!Array.isArray(groups) || groups.length === 0) {
      return res.status(400).json({ ok: false, error: "groups[] is required" });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ ok: false, error: "items[] is required" });
    }

    const results = [];

    for (const group of groups) {
      const { chatId, botToken } = group || {};

      for (const item of items) {
        const { mode = "video", text, videoUrl, caption } = item || {};

        try {
          let result;
          if (mode === "message") {
            result = await sendMessage({ chatId, text, botToken });
          } else {
            result = await sendVideo({ chatId, videoUrl, caption, botToken });
          }

          results.push({ ok: true, chatId, mode, result });
        } catch (error) {
          results.push({
            ok: false,
            chatId,
            mode,
            error: error.message || "Failed",
            details: error.details || null
          });
        }
      }
    }

    res.json({ ok: true, results });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message || "Unexpected error" });
  }
});

app.listen(port, () => {
  console.log(`tg-notify-server listening on http://localhost:${port}`);
});
