import { EVENTS } from "../events.js";
import revealOptions from "./revealOptions.js";
import timeUp from "./timeup.js";
import redis from "../../config/redis.js";
import Session from "../../db/Schemas/sessions.js";
import { ObjectId } from "mongodb";
import timeStore from "../timeStore.js";

export default async function startQuestion(io, socket, data) {

  try {

    const { sessionId } = data;

    // only host can start
    if (socket.data.role !== "host") {

      socket.emit(EVENTS.ERROR, {
        message: "only host can start questions"
      });

      return;
    }

    const checkSessionInRedis = await redis.exists(`session:${sessionId}:meta`);
    
    let session;
    if(checkSessionInRedis){
      session = await redis.hgetall(`session:${sessionId}:meta`);
      console.log("served from redis",session)
    }
    else{
      session = await Session.findOne({_id:new ObjectId(sessionId)});
      console.log("served from mongodb",session)
      if (!session) {
      socket.emit(EVENTS.ERROR, {
        message: "session not found"
      });
      return;
    }
      const data = {
        hostId:session.hostId,
        joinCode:session.joinCode,
        status:session.status,
        type:session.type,
        currentQuestionIndex:session.currentQuestionIndex,
      }
      await redis.hset(`session:${sessionId}:meta`,
      "sessionId",sessionId,
      "hostId",String(session.hostId),
      "joinCode",session.joinCode,
      "status",session.status,
      "type",session.type,
      "currentQuestionIndex",session.currentQuestionIndex);
      await redis.expire(`session:${sessionId}:meta`, 86400);
      session=data
    }

    let questionsData = await redis.get(`session:${sessionId}:questions`);
    
    const currentQuestionIndex = parseInt(await redis.hget(`session:${sessionId}:meta`, `currentQuestionIndex`));
    
    const status= await redis.hget(`session:${sessionId}:meta`,`status`);
    
    if (status === "question" || status === "options") {
    socket.emit(EVENTS.ERROR, { message: "question already running" });
    return;
    }
    questionsData=JSON.parse(questionsData);


    const questions=questionsData.questions;
    
    const title=questionsData.title;
    
    if (currentQuestionIndex >= questions.length) {

      socket.emit(EVENTS.ERROR, {
        message: "no more questions"
      });

      return;
    }

    const currentQuestion =
      questions[currentQuestionIndex];

    // timings
    const now = Date.now();

    const revealAt = now + 15000;

    const answerEndAt = revealAt + 20000;

    
    // store state
    await redis.hset(`session:${sessionId}:meta`,`currentQuestionId`,currentQuestion._id.toString());
    await redis.hset(`session:${sessionId}:meta`,`status`,`question`);
    await redis.set(`session:${sessionId}:timings`,JSON.stringify({revealAt,answerEndAt}));
    await redis.expire(`session:${sessionId}:timings`, 86400);
    
    
    // emit question
    io.to(sessionId).emit(
      EVENTS.QUESTION_STARTED,
      {
        question: currentQuestion.question,
        questionId: currentQuestion._id,
        currentQuestionIndex,
        totalQuestions: questions.length,
        title,
        revealAt,
        answerEndAt
      }
    );
    
    const store = timeStore.get(sessionId) || { revealTimeout: null, timeUpTimeout: null };
    timeStore.set(sessionId, store);
    
    // cleanup old timers if somehow present
    if (store.revealTimeout) {
      clearTimeout(store.revealTimeout);
    }

    if (store.timeUpTimeout) {
      clearTimeout(store.timeUpTimeout);
    }

    // reveal options timer
    const revealTimeout = setTimeout(async() => {

      revealOptions(
        io,
        sessionId,
        currentQuestion._id
      );

      await redis.hset(`session:${sessionId}:meta`,`status`,`options`);

      // time up timer
      const timeUpTimeout = setTimeout(async() => {

        timeUp(
          io,
          sessionId,
          currentQuestion._id
        );

        // store.phase = "results";
        await redis.hset(`session:${sessionId}:meta`,`status`,`results`);
        await redis.hincrby(`session:${sessionId}:meta`, `currentQuestionIndex`, 1); 
      }, 20000);

      store.timeUpTimeout = timeUpTimeout;

    }, 15000);

    store.revealTimeout = revealTimeout;

  } catch (err) {

    console.error("startQuestion error:", err);

    socket.emit(EVENTS.ERROR, {
      message: "something went wrong"
    });
  }
}