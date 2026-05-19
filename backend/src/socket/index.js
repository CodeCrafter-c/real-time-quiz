import { Server } from "socket.io";

import authSocket from "./authSocket.js";

import joinSession from "./handlers/joinSession.js";
import startQuestion from "./handlers/startQuestion.js";
import revealOptions from "./handlers/revealOptions.js";
import submitAnswer from "./handlers/submitAnswer.js";
import timeUp from "./handlers/timeup.js";

import { EVENTS } from "./events.js";

export default function initializeSocket(server) {

  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true
    }
  });

  io.use(authSocket);

  io.on("connection", (socket) => {

    console.log("connected", socket.id);

    socket.on(EVENTS.JOIN_SESSION, (data) =>
      joinSession(io, socket, data)
    );

    socket.on(EVENTS.START_QUESTION, (data) =>
      startQuestion(io, socket, data)
    );

    socket.on(EVENTS.REVEAL_OPTIONS, (data) =>
      revealOptions(io, socket, data)
    );

    socket.on(EVENTS.SUBMIT_ANSWER, (data) =>
      submitAnswer(io, socket, data)
    );

    socket.on(EVENTS.TIME_UP, (data) =>
      timeUp(io, socket, data)
    );

    socket.on("disconnect", () => {
      console.log("disconnected", socket.id);
    });

  });

  return io;
}