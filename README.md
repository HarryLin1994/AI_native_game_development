# Photo Character Lab MVP

本地可跑的簡版 MVP：用真實照片 + 玩家回答，生成遊戲人物、真正 AI 修飾稿、戰鬥卡牌封面、角色數值與技能。

這個版本有兩種圖像模式：

- 真正 AI 修飾：需要 `OPENAI_API_KEY`，照片會送到 OpenAI Image Edit API。
- 本機預覽：不需要 API Key，所有圖片處理都在瀏覽器用 Canvas 完成，照片不會上傳。

## Run

### Mac 雙擊啟動

For true AI mode, create `.env.local` with:

```text
OPENAI_API_KEY=your_api_key_here
OPENAI_IMAGE_MODEL=gpt-image-1
```

Double-click:

```text
start-mac.command
```

Then open:

```text
http://127.0.0.1:5173
```

### Terminal

```bash
npm run dev
```

Open `http://127.0.0.1:5173`.

## Current Scope

- Browser-only image upload and camera capture.
- Canvas-based visual feature extraction: dominant colors, brightness, contrast, saturation, edge density, center focus, symmetry, and optional OCR text seed.
- Player questions: age impression, occupation, visible traits, combat style, and card mood.
- Deterministic character spec generation from image features.
- True AI retouched portrait through the local Node proxy when `OPENAI_API_KEY` is configured.
- Local Canvas preview fallback when AI is not configured.
- Battle card cover generated locally with Canvas.
- Local character library saved in `localStorage`.
- Turn-based battle loop with XP, wins, losses, and level ups.

## Not Yet Included

- Real OCR engine.
- Person identity recognition.
- Server-authoritative battle validation.
- Account system and multiplayer matchmaking.
- Real OCR engine integration.

The MVP intentionally avoids identity recognition. Later phases should use consent-based, privacy-first analysis and only store required non-sensitive features unless a player explicitly chooses otherwise.
