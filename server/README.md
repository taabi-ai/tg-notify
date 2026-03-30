# tg-notify server microservice

Standalone Telegram wrapper service for sending messages/videos.

This service is intentionally not connected to docs/index.html or docs/app.js.

## Quick start

1. Install deps

```bash
cd server
npm install
```

2. Configure env

```bash
cp .env.example .env
# set TELEGRAM_BOT_TOKEN if you want a default token
```

3. Run

```bash
npm run start
```

Server starts at http://localhost:8080 by default.

## Endpoints

- GET /health
- POST /api/telegram/send-message
- POST /api/telegram/send-video
- POST /api/telegram/send-batch

### POST /api/telegram/send-message

```json
{
  "chatId": "-1001234567890",
  "text": "Hello team",
  "botToken": "optional-per-request-token"
}
```

### POST /api/telegram/send-video

```json
{
  "chatId": "-1001234567890",
  "videoUrl": "https://example.com/video.mp4",
  "caption": "Critical update",
  "supportsStreaming": true,
  "botToken": "optional-per-request-token"
}
```

### POST /api/telegram/send-batch

```json
{
  "groups": [
    { "chatId": "-5119382124", "botToken": "token-1" },
    { "chatId": "-5274392721", "botToken": "token-2" }
  ],
  "items": [
    {
      "mode": "video",
      "videoUrl": "https://taabi-ai.github.io/tg-notify/videos/driver-action-recognition.mp4",
      "caption": "Critical issue"
    },
    {
      "mode": "message",
      "text": "Follow-up note"
    }
  ]
}
```

## Notes

- If botToken is omitted in requests, TELEGRAM_BOT_TOKEN from .env is used.
- Keep tokens server-side in production.
- This service is a starter wrapper meant for later integration.
