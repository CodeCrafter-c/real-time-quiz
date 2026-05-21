import sessionStore from "../sessionStore.js";
import { EVENTS } from "../events.js";

export default function timeUp(io, sessionId, questionId) {
  console.log("timeUp",sessionId,questionId)
  try {
    
    const store = sessionStore.get(sessionId);
    console.log("USER SOCKETS", store.userSockets);
    if (!store) {
      return;
    }
    store.phase = "review";
    
    const hostSocketId = store.hostSocketId;
    
    const question =
    store.questions.find(
      q => q._id.toString() === questionId.toString()
    );
    console.log("question",question)
    if (!question) {
      return;
    }
    
    console.log("answers",store.answers[questionId])
    const answers =
    store.answers[questionId] || {};
    console.log("answers",answers)
    const counts =
    question.options.map((option, i) => ({
      
      option,
      
      count: Object.values(answers)
      .filter(a => a.answer === i)
      .length
      
    }));
    
    const totalAnswered =
    Object.keys(answers).length;
    
    const totalCorrect =
    Object.values(answers)
    .filter(a => a.isCorrect)
    .length;
    
    store.phase = "review";
    io.to(hostSocketId).emit(
      EVENTS.SHOW_RESULTS,
      {
        counts,
        correctAnswer: question.correctAnswer,
        totalAnswered,
        totalCorrect
      }
    );
    
    
    
   for (const [userId, result] of Object.entries(answers)) {
      const socketId =
        store.userSockets[userId];

      if (!socketId) continue;

      io.to(socketId).emit(
        EVENTS.SHOW_RESULTS,
        {
          counts,
          correctAnswer: question.correctAnswer,

          yourAnswer: result.answer,
          isCorrect: result.isCorrect,
          points: result.points
        }
      );
    }

    store.currentQuestionId = null;
    store.answerEndAt = null;
    store.revealAt = null;
  } catch (err) {

    console.error("timeUp error:", err);

  }
}