import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import connectToDb from "./db/connection.js";
import userRouter from "./routes/user.js";
import quizRouter from "./routes/quiz.js";
import initializeSocket from "./socket/index.js";

const app = express();
const server = createServer(app);

initializeSocket(server);

app.use(cookieParser());
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use("/api/v1/users", userRouter);
app.use("/api/v1/quiz", quizRouter);

const port = process.env.PORT || 3000;

async function startServer() {
  await connectToDb();
  server.listen(port, () => {
    console.log(`server running on port ${port}`);
  });
}

startServer();