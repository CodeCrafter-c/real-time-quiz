import "dotenv/config";
import express from "express";
import cors from "cors";
import connectToDb from "./db/connection.js";
import userRouter from "./routes/user.js";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());
app.use(cors());
app.use(cookieParser());

const port = 3000;

async function startServer() {
  await connectToDb();

  app.listen(port, () => {
    console.log(`server running on port ${port}`);
  });
}


app.use("/api/v1/users",userRouter);
startServer();
