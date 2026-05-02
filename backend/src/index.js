import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import connectToDb from "./db/connection.js";
import userRouter from "./routes/user.js";
import Session from "./db/Schemas/sessions.js";
import quizRouter from "./routes/quiz.js";

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true
  }
});

app.use(cookieParser());
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use("/api/v1/users", userRouter);
app.use("/api/v1/quiz", quizRouter);

function extractTokenFromCookie(cookieHeader) {
  const match = cookieHeader.match(/token=([^;]+)/);
  return match ? match[1] : null;
}

function verifyJWT(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

// Socket auth middleware
io.use((socket, next) => {
  const cookieHeader = socket.handshake.headers.cookie;
  // console.log("socket auth check", cookieHeader) 
  if (!cookieHeader) {
    console.log("socket rejected: no cookies")  // ← add these
    return next(new Error("No cookies"));
  }

  const token = extractTokenFromCookie(cookieHeader);

  if (!token) {
    console.log("socket rejected: no token")
    return next(new Error("No token found"));
  }

  try {
    const decoded = verifyJWT(token);
    // console.log("decoded",decoded)
    socket.user = { userId: decoded.user_id };
    next();
  } catch (err) {
    console.log("socket rejected: jwt error", err.message)  // ← this will tell you
    next(new Error("Unauthorized"));
  }
});
io.on("connection", (socket) => {
  console.log("user connected:", socket.id);

  socket.on("join_session", async ({ sessionId }) => {
    try {
      const session = await Session.findById(sessionId);

      if (!session) {
        socket.emit("error", { message: "session not found" });
        return;
      }

      const userId = socket.user.userId;
      const isHost = session.hostId.toString() === userId;
      const isParticipant = session.participants
        .map(p => p.toString())
        .includes(userId);
        console.log("userId",userId)
      console.log("isHost ",isHost)
      console.log("isParticipant",isParticipant)
      if (!isHost && !isParticipant) {
        socket.emit("error", { message: "not authorized" });
        return;
      }

      socket.join(sessionId);

      socket.data = {
        sessionId,
        role: isHost ? "host" : "participant",
        userId
      };

      // Tell everyone else someone joined
      socket.to(sessionId).emit("user_joined", {
        userId,
        socketId: socket.id
      });

      // Tell the joiner their own context
      socket.emit("session_joined", {
        role: socket.data.role,
        sessionId
      });

    } catch (err) {
      console.error("join_session error:", err);
      socket.emit("error", { message: "something went wrong" });
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id);
  });
});

const port = process.env.PORT || 3000;

async function startServer() {
  await connectToDb();
  server.listen(port, () => {
    console.log(`server running on port ${port}`);
  });
}

startServer();