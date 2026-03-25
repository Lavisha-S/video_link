# VideoLink — Setup & Run Manual

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Git | any | `git --version` |
| A Twilio account | free trial OK | https://twilio.com |

---

## Step 1 — Get Your Twilio Credentials

1. Sign up or log in at https://console.twilio.com
2. From the dashboard, copy your **Account SID** (starts with `AC`)
3. Go to **Account → API Keys & Tokens → API Keys → Create API Key**
4. Choose type **Standard**, give it any name (e.g. "videolink-dev")
5. Copy the **SID** (this is your `TWILIO_API_KEY`, starts with `SK`)
6. Copy the **Secret** (shown ONCE — save it immediately, this is your `TWILIO_API_SECRET`)

---

## Step 2 — Set Up the Backend (server/)

```bash
# 1. Open a terminal and go into the server folder
cd twilio-video-app/server

# 2. Install dependencies
npm install

# 3. Create your environment file from the example
cp .env.example .env
```

Now open `server/.env` in any text editor and fill in your credentials:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_SECRET=your_secret_here
PORT=5000
ALLOWED_ORIGINS=http://localhost:3000
```

```bash
# 4. Start the backend server (development mode with auto-restart)
npm run dev

# You should see:
# ✅ [timestamp] [INFO] Server running on http://localhost:5000
# ✅ [timestamp] [INFO] Allowed origins: http://localhost:3000
```

**Verify the server is running:**
```bash
curl http://localhost:5000/health
# Expected: {"status":"ok","timestamp":"..."}
```

---

## Step 3 — Set Up the Frontend (client/)

Open a **second terminal** (keep the server running in the first):

```bash
# 1. Go into the client folder
cd twilio-video-app/client

# 2. Install dependencies
npm install

# 3. Create the environment file
cp .env.local.example .env.local
```

Open `client/.env.local` — it should already have the right value:

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:5000
```

```bash
# 4. Start the frontend
npm run dev

# You should see:
# ▲ Next.js 14.x.x
# - Local: http://localhost:3000
```

---

## Step 4 — Open and Use the App

1. Open your browser and go to **http://localhost:3000**
2. Enter your name (or use the random one generated)
3. Enter a room name (e.g. `my-room`)
4. Click **Join Room →**
5. Allow camera and microphone when the browser asks
6. You're in! Share the room name with someone else to call them

**To test with two participants on the same machine:**
- Open a second browser window (or incognito tab)
- Go to http://localhost:3000
- Use a **different name** but the **same room name**
- Both windows should connect and see each other

---

## Keyboard Shortcuts (inside a room)

| Key | Action |
|-----|--------|
| `M` | Toggle mute / unmute |
| `V` | Toggle camera on / off |
| `Esc` | Leave room |

---

## Running the Backend Tests

```bash
cd twilio-video-app/server
npm install   # if not done already
npm test

# Expected output:
# PASS  index.test.js
#   GET /health
#     ✓ returns 200 with status ok
#   POST /generate-token
#     ✓ returns 200 and a token for valid input
#     ✓ returns 400 when identity is missing
#     ✓ returns 400 when roomName is missing
#     ✓ returns 400 when identity is empty string
#     ✓ returns 400 for identity with special characters
#     ✓ returns 400 when identity exceeds 100 chars
#     ✓ returns 400 when body is empty
#     ✓ returns 404 for unknown routes
```

---

## Building for Production

### Backend
```bash
cd server
npm start        # runs node index.js directly (no nodemon)
```

### Frontend
```bash
cd client
npm run build    # creates optimized production build in .next/
npm start        # serves the production build on port 3000
```

---

## Environment Variables Reference

### server/.env

| Variable | Required | Description |
|----------|----------|-------------|
| `TWILIO_ACCOUNT_SID` | ✅ | Your Twilio Account SID (starts with AC) |
| `TWILIO_API_KEY` | ✅ | Your Twilio API Key SID (starts with SK) |
| `TWILIO_API_SECRET` | ✅ | Your Twilio API Key Secret |
| `PORT` | ❌ | Server port (default: 5000) |
| `ALLOWED_ORIGINS` | ❌ | Comma-separated allowed CORS origins (default: http://localhost:3000) |

### client/.env.local

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SERVER_URL` | ✅ | URL of your backend server (default: http://localhost:5000) |

---

## Common Errors & Fixes

### "Missing environment variables" on server start
→ You haven't created `server/.env`. Run `cp .env.example .env` and fill it in.

### "Cannot reach the server" in the browser
→ Make sure the backend is running (`npm run dev` in the server folder). Check it responds at http://localhost:5000/health

### "Camera and microphone access was denied"
→ Click the camera icon in your browser's address bar and allow permissions, then refresh.

### "No camera or microphone found"
→ Connect a webcam/mic. On a Mac, check System Preferences → Security & Privacy → Camera/Microphone.

### "Camera is already in use"
→ Close any other app using your camera (Zoom, Teams, FaceTime, etc.) and try again.

### Port 5000 already in use
→ Change `PORT=5001` in `server/.env` and update `NEXT_PUBLIC_SERVER_URL=http://localhost:5001` in `client/.env.local`.

### Port 3000 already in use
→ Next.js will automatically try port 3001, 3002, etc. Watch the terminal output for the actual URL.

---

## Project Structure

```
twilio-video-app/
├── client/                          # Next.js 14 frontend (TypeScript)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx             # Home page — join room form
│   │   │   ├── room/
│   │   │   │   └── page.tsx         # /room route — video call page
│   │   │   ├── components/
│   │   │   │   └── VideoRoom.tsx    # Main video UI + controls
│   │   │   ├── globals.css          # Global styles + CSS variables
│   │   │   └── layout.tsx           # Root layout + fonts
│   │   ├── components/
│   │   │   ├── VideoTile.tsx        # Local video tile component
│   │   │   └── RemoteParticipantTile.tsx  # Remote participant tile
│   │   ├── hooks/
│   │   │   └── useVideoRoom.ts      # Core Twilio logic (connect, disconnect, mute, etc.)
│   │   └── lib/
│   │       ├── api.ts               # fetchToken() with full error handling
│   │       └── validation.ts        # Client-side input validation helpers
│   ├── .env.local.example
│   ├── next.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── server/                          # Node.js + Express backend
│   ├── utils/
│   │   ├── tokenGenerator.js        # Twilio token generation logic
│   │   ├── validateEnv.js           # Startup env var validation
│   │   └── logger.js                # Structured console logger
│   ├── index.js                     # Express app (CORS, rate limit, /generate-token)
│   ├── index.test.js                # Jest + Supertest API tests
│   ├── .env.example
│   └── package.json
│
├── SETUP_AND_RUN.md                 # This file
├── README.md                        # Full project documentation
└── .gitignore
```

---

## Security Notes

- **Never commit `.env` or `.env.local`** — they're in `.gitignore`
- Twilio credentials only live on the server — the frontend never sees them
- The `/generate-token` endpoint is rate-limited to 20 requests/minute per IP
- All inputs are validated with Joi (server) and inline checks (client)
- CORS is restricted to `ALLOWED_ORIGINS` only

---

## Deploying (Optional)

### Backend → Railway / Render / Fly.io
1. Push `server/` to a repo or connect directly
2. Set all env vars in the platform dashboard
3. Set `ALLOWED_ORIGINS` to your frontend's production URL (e.g. `https://my-app.vercel.app`)
4. The `npm start` command runs `node index.js`

### Frontend → Vercel
1. Connect your repo to Vercel
2. Set **Root Directory** to `client`
3. Add env var: `NEXT_PUBLIC_SERVER_URL=https://your-backend.railway.app`
4. Deploy — Vercel auto-detects Next.js

