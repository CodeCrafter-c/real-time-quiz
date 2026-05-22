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
import redis from "./config/redis.js";

const app = express();
const server = createServer(app);

initializeSocket(server);

app.use(cookieParser());
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// save to redis
(async function saveToRedis(){
  try{
    const returnDataOnSave=await redis.set("hello","world");
    console.log("return Data",returnDataOnSave);
    getFromRedis();
  }
  catch(error){
    console.error("redis error",error);
  }
})()
// get from redis
async function getFromRedis(){
  try{
    const value = await redis.get("hello");
    console.log("return Data",value);
  }
  catch(error){
    console.error("redis error",error);
  }
}


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