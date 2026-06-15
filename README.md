# Realtime Quiz Platform

A real-time multiplayer quiz platform inspired by Kahoot — hosts run timed quiz sessions, participants join via a 6-digit code, answer questions under a countdown, and see a live leaderboard. Built with Node.js, Socket.IO, Redis, and MongoDB.

---

## Tech Stack

**Backend:** Node.js, Express.js, Socket.IO, MongoDB, Redis, Docker  
**Frontend:** React.js, Vite, Tailwind CSS, Socket.IO Client  
**Auth:** JWT via httpOnly cookies  
**Validation:** Zod  

---

## Architecture

Redis is the single source of truth for all live session state. MongoDB handles persistence only — storing quizzes, users, and final results. Socket.IO manages real-time communication between host and participants.

```
Client (React)
    ↕ HTTP (REST)       → Auth, session creation, joining
    ↕ WebSocket (WS)    → Live quiz events

Server (Node.js + Express + Socket.IO)
    ↕ Redis             → Live session state (meta, answers, leaderboard, timings)
    ↕ MongoDB           → Persistent storage (users, quizzes, final results)
```

---

## Quiz Flow

```
lobby → question (15s) → options (20s) → results → review → leaderboard
```

1. Host creates a quiz and starts a session — gets a 6-digit join code
2. Participants join via join code
3. Both connect via WebSocket
4. Host fires `start_question` → question text sent to all, 15s timer starts
5. After 15s → options revealed automatically (server-driven)
6. Participants submit answers — validated server-side against `answerEndAt` timestamp
7. After 20s → `timeUp` fires, personalised results sent to each participant, aggregate stats to host
8. Host triggers leaderboard → top 10 shown to room
9. On last question → final results persisted to MongoDB

---

## Scoring

```
points = round(500 + 500 * (1 - timeTaken / 20000))
```

- Correct answer instantly → 1000 points
- Correct answer at last second → ~500 points  
- Wrong answer → 0 points

---

## Redis Key Structure

| Key | Type | Purpose |
|-----|------|---------|
| `session:{id}:meta` | Hash | Session state, status, currentQuestionIndex |
| `session:{id}:questions` | String | JSON blob of all questions |
| `session:{id}:timings` | String | `{revealAt, answerEndAt}` timestamps |
| `session:{id}:participants` | Set | UserIds of all participants |
| `session:{id}:sockets` | Hash | userId → socketId mapping |
| `session:{id}:hostSocketId` | String | Host's current socketId |
| `session:{id}:answers:{questionId}` | Hash | userId → `{answer, isCorrect, points}` |
| `session:{id}:leaderboard` | Sorted Set | userId → cumulative score |
| `session:joinCode:{code}` | String | joinCode → sessionId lookup |

All keys expire in 24 hours.

---

## Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join_session` | Client → Server | Join a session room |
| `session_joined` | Server → Client | Confirmed join + current state |
| `start_question` | Host → Server | Start next question |
| `question_started` | Server → Room | Question text + timings |
| `options_revealed` | Server → Room | Answer options (after 15s) |
| `submit_answer` | Participant → Server | Submit answer |
| `submitted_answer` | Server → Participant | Submission confirmed |
| `answer_stats_updated` | Server → Host | Live X/Y answered count |
| `show_results` | Server → All | Personalised results after timeup |
| `get_leaderboard` | Host → Server | Trigger leaderboard |
| `leaderboard_data` | Server → Room | Top 10 scores |

---

## Key Design Decisions

**Why Redis for live state?**  
MongoDB isn't designed for high-frequency reads/writes with millisecond latency. Redis is in-memory and perfect for ephemeral session data that changes every few seconds.

**Why server-driven timers?**  
Timers run on the server, not the client. This prevents cheating and ensures all participants experience the same timing regardless of network latency.

**Why two-phase join (REST + Socket)?**  
HTTP handles validation — is the user authenticated, does the session exist, is the join code valid. Only after all checks pass does the WebSocket connection open. Cleaner separation of concerns.

**Late joiner catch-up:**  
If a participant joins mid-session, `joinSession` checks the current status and immediately emits the relevant catch-up events so they're never stuck on a blank screen.

**Personalised results:**  
`SHOW_RESULTS` sends different payloads to host (aggregate stats, option counts) and each participant (their own answer, correctness, points earned) — without anyone seeing others' answers.

---

## Running Locally

**Prerequisites:** Node.js, Docker

```bash
# Start Redis via Docker
cd backend
docker-compose up -d

# Install and run backend
npm install
npm run dev

# Install and run frontend
cd ../frontend
npm install
npm run dev
```

**Environment variables (backend):**
```
PORT=3000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
REDIS_HOST=localhost
REDIS_PORT=6379
NODE_ENV=development
```

---

## Known Limitations

- Timers use in-memory `setTimeout` — a server restart mid-session will lose active timers. Would replace with BullMQ (Redis-backed job queue) in production.
