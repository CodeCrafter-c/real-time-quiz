import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";

import connectToDb from "./db/connection.js";
import userRouter from "./routes/user.js";

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

io.on("connection", (socket) => {
  console.log("user connected:", socket.id);
});

const port = 3000;

async function startServer() {
  await connectToDb();

  server.listen(port, () => {
    console.log(`server running on port ${port}`);
  });
}

startServer();