import { EVENTS } from "../events.js";
import redis from "../../config/redis.js";


export default async function submitAnswer(io, socket, data) {


  try {

    const {
      sessionId,
      questionId,
      answer
    } = data;
    
    const sessionData=await redis.hgetall(`session:${sessionId}:meta`);

    if (!sessionData || Object.keys(sessionData).length === 0) {
      socket.emit(EVENTS.ERROR, {
        message: "session not found"
      });
      return;
    }

    let timings=await redis.get(`session:${sessionId}:timings`);
    timings=JSON.parse(timings);

    let questionsData=await redis.get(`session:${sessionId}:questions`);
    questionsData=JSON.parse(questionsData);

    const userId = socket.user.userId;

    if(sessionData.hostId.toString()===userId.toString()){
      socket.emit(EVENTS.ERROR, {
        message: "host cannot submit answer"
      });
      return;
    }
    

    const answeredAt = Date.now();

    if(answeredAt>Number(timings.answerEndAt)){
      socket.emit(EVENTS.ERROR, {
        message: "time limit exceeded"
      });
      return;
    }
    
    if (sessionData.status !== "options") {
      socket.emit(EVENTS.ERROR, {
        message: "answering phase is closed"
      });
      return;
    }
    if(questionId.toString()!=sessionData.currentQuestionId.toString()){
      socket.emit(EVENTS.ERROR, {
        message: "this question is not active"
      });
      return;
    }

    
    const hasAnswered=await redis.hexists(`session:${sessionId}:answers:${questionId}`,userId);
    console

    if (hasAnswered) {

      socket.emit(EVENTS.ERROR, {
        message: "already answered"
      });

      return;
    }

    const question =questionsData.questions.find(
        q => q._id.toString() === questionId.toString()
      );

    if (!question) {

      socket.emit(EVENTS.ERROR, {
        message: "question not found"
      });

      return;
    }

    const correctAnswer =
      Number(question.correctAnswer);

    const isCorrect =
      Number(answer) === correctAnswer;

    let points = 0;

    if (isCorrect) {

      const timeLimit = 20000;

      const timeTaken =
        answeredAt - Number(timings.revealAt);

      const timeRatio = Math.max(
        0,
        1 - timeTaken / timeLimit
      );

      points = Math.round(
        500 + 500 * timeRatio
      );
    }

    await redis.hset(
      `session:${sessionId}:answers:${questionId}`,
      userId,
      JSON.stringify({ answer, isCorrect, points })
    );
    await redis.expire(`session:${sessionId}:answers:${questionId}`, 86400);

    const leaderboardKey=`session:${sessionId}:leaderboard`;
    await redis.zincrby(leaderboardKey, points, userId);
    await redis.expire(leaderboardKey, 86400);
 
    
    const hostSocketId = await redis.get(`session:${sessionId}:hostSocketId`);
    const totalResponses = await redis.hlen(`session:${sessionId}:answers:${questionId}`);
    const totalParticipants = await redis.scard(`session:${sessionId}:participants`);

    io.to(hostSocketId).emit(EVENTS.ANSWER_STATS_UPDATED, {
      totalResponses,
      totalParticipants,
      questionId: questionId.toString(),
    });

  
    socket.emit(EVENTS.SUBMITTED_ANSWER,{
      questionId:questionId.toString(),
      success:true,
      message:"answer submitted successfully"
    })

  } catch (err) {

    console.error("submitAnswer error:", err);

    socket.emit(EVENTS.ERROR, {
      message: "something went wrong"
    });
  }
}