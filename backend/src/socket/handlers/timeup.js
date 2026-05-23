import { EVENTS } from "../events.js";
import redis from "../../config/redis.js";

export default async function timeUp(io, sessionId, questionId) {
  console.log("timeUp",sessionId,questionId)
  try {

    const session=await redis.hgetall(`session:${sessionId}:meta`);
    if(!session){
      return;
    }
    const hostSocketId=await redis.get(`session:${sessionId}:hostSocketId`);
    await redis.hset(`session:${sessionId}:meta`,`status`,"review");
    

    let questionsData = await redis.get(`session:${sessionId}:questions`);
    if(!questionsData){
      return;
    }
    questionsData=JSON.parse(questionsData);
    const question =questionsData.questions.find(
      q => q._id.toString() === questionId.toString()
    );
    console.log("question",question)
    if (!question) {
      return;
    }
    

    const answers =await redis.hgetall(`session:${sessionId}:answers:${questionId}`);
    console.log("answers",answers)

    const parsedAnswers = Object.fromEntries(
    Object.entries(answers).map(([uid, val]) => [uid, JSON.parse(val)])
  ) ;



    const counts =
    question.options.map((option, i) => ({
      
      option,
      
      count: Object.values(parsedAnswers)
      .filter(a => a.answer === i)
      .length
      
    }));
    
    const totalAnswered =
    Object.keys(parsedAnswers).length;
    
    const totalCorrect =
    Object.values(parsedAnswers)
    .filter(a => a.isCorrect)
    .length;
    
    await redis.hset(`session:${sessionId}:meta`,`status`,"review");
    io.to(hostSocketId).emit(
      EVENTS.SHOW_RESULTS,
      {
        counts,
        correctAnswer: question.correctAnswer,
        totalAnswered,
        totalCorrect
      }
    );
    
    
    
   for (const [userId, result] of Object.entries(parsedAnswers)) {
      const socketId = await redis.hget(`session:${sessionId}:sockets`, userId);

      if (!socketId) continue;

      const resultData=result;

      io.to(socketId).emit(
        EVENTS.SHOW_RESULTS,
        {
          counts,
          correctAnswer: question.correctAnswer,

          yourAnswer: resultData.answer,
          isCorrect: resultData.isCorrect,
          points: resultData.points
        }
      );
    }

  } catch (err) {

    console.error("timeUp error:", err);

  }
}