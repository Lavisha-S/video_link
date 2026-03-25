# VideoLink — Twilio Video Calling App

A robust, production-grade real-time video calling application built with **Next.js** (frontend) and **Node.js + Express** (backend), integrated with the **Twilio Video API**.

---

## 📁 Project Structure

```
twilio-video-app/
├── client/                     # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx        # Home page (join room form)
│   │   │   ├── room/
│   │   │   │   └── page.tsx    # Video room page (routing /room?identity=&roomName=)
│   │   │   ├── components/
│   │   │   │   └── VideoRoom.tsx  # Main video UI component
│   │   │   ├── globals.css
│   │   │   └── layout.tsx
│   │   └── hooks/
│   │       └── useTwilioVideo.ts  # Core Twilio logic hook
│   ├── .env.local.example
│   ├── next.config.js
│   └── package.json
│
├── server/                     # Node.js + Express backend
│   ├── index.js                # Server entry point
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- A [Twilio account](https://www.twilio.com) (free trial works)

### 1. Get Twilio Credentials

1. Log in to [Twilio Console](https://console.twilio.com)
2. Copy your **Account SID** from the dashboard
3. Go to **Account → API Keys & Tokens → Create API Key**
4. Select **Standard** type, give it a name
5. Copy the **API Key SID** and **API Key Secret** (secret is only shown once!)

### 2. Backend Setup

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env`:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_SECRET=your_api_secret_here
PORT=5000
ALLOWED_ORIGINS=http://localhost:3000
```

Start the server:
```bash
npm run dev    # Development (with nodemon)
npm start      # Production
```

### 3. Frontend Setup

```bash
cd client
npm install
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
next_public_server_url=http://localhost:5000
```

Start the frontend:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🌐 Routes

| Route | Description |
|-------|-------------|
| `/` | Home — enter name and room |
| `/room?identity=NAME&roomName=ROOM` | Video call room |

---

## 🔌 API Endpoints

### `POST /generate-token`

Generates a Twilio Video access token.

**Request body:**
```json
{
  "identity": "john-doe",
  "roomName": "team-standup"
}
```

**Response:**
```json
{
  "token": "eyJ...",
  "identity": "john-doe",
  "roomName": "team-standup",
  "expiresIn": 3600
}
```

**Error responses:**
- `400` — Validation failed (identity/roomName invalid)
- `429` — Rate limited (max 20 requests/min per IP)
- `500` — Token generation failed

### `GET /health`

Health check endpoint. Returns `{ "status": "ok" }`.

---

## ✅ Features

- 🎥 Local and remote video streams
- 🎙 Mute / unmute microphone
- 📷 Toggle camera on/off
- 🖥 Screen sharing
- 👥 Multiple participants (grid layout adapts)
- 🔄 Auto-reconnect on network drop
- ⌨️ Keyboard shortcuts (M = mute, V = video, Esc = leave)
- 🔒 Secure token generation (credentials never exposed to frontend)
- 🛡 Input validation on both frontend and backend
- ⚡ Rate limiting (20 req/min per IP)
- 🌐 CORS protection with allowed origins whitelist
- 📊 Connection status indicators
- 🧹 Proper resource cleanup on disconnect/page close

---

## 🐛 Edge Cases Handled

| Scenario | Handling |
|----------|----------|
| Camera/mic permission denied | Clear error message with instructions |
| No camera/mic found | Device not found error |
| Device already in use | NotReadableError caught |
| Network timeout to backend | 10s AbortController timeout |
| Server not running | Friendly "check backend" message |
| Rate limit hit | User-friendly 429 message |
| Token expired mid-call | Error code 20104 handled |
| Connection lost | Auto-reconnect + status indicator |
| Room full | Error code 53105 handled |
| User closes tab | `beforeunload` disconnect |
| Component unmount | All tracks stopped, room disconnected |
| Screen share cancelled by user | No error shown (user intent) |
| Missing URL params | Auto-redirect to home |
| XSS / large payloads | `express.json({ limit: '10kb' })` |
| Server crash | Graceful shutdown with SIGTERM/SIGINT |

---

## 🔐 Security Practices

- Twilio credentials stored only in server `.env` — never sent to frontend
- Input sanitized with Joi schema validation
- CORS restricted to allowed origins list
- Rate limiting on token endpoint
- Helmet.js for HTTP security headers
- No sensitive data logged

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript |
| Backend | Node.js, Express 4 |
| Video API | Twilio Video JS SDK v2 |
| Validation | Joi |
| Security | Helmet, cors, express-rate-limit |
| Styling | Pure CSS with CSS Variables |

---

## 📦 Deployment

### Backend (e.g. Railway / Render / Fly.io)
1. Set environment variables in your platform dashboard
2. Set `ALLOWED_ORIGINS` to your frontend's production URL
3. Deploy the `server/` folder

### Frontend (e.g. Vercel)
1. Set `next_public_server_url` to your deployed backend URL
2. Deploy the `client/` folder
3. Configure Vercel to run `npm run build` in the `client/` directory
