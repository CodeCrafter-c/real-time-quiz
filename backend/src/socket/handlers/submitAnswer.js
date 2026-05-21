import sessionStore from "../sessionStore.js";
import { EVENTS } from "../events.js";
export default async function submitAnswer(io, socket, data) {

  try {

    const {
      sessionId,
      questionId,
      answer
    } = data;
    // console.log("submitAnswer",data)
    const store = sessionStore.get(sessionId);


    if (!store) {
      socket.emit(EVENTS.ERROR, {
        message: "session not found"
      });
      return;
    }

    const userId = socket.user.userId;

    if(store.hostId.toString()===userId){
      socket.emit(EVENTS.ERROR, {
        message: "host cannot submit answer"
      });
      return;
    }
    

    const answeredAt = Date.now();

    if(answeredAt>store.answerEndAt){
      socket.emit(EVENTS.ERROR, {
        message: "time limit exceeded"
      });
      return;
    }
    
    if (store.phase !== "options") {
      socket.emit(EVENTS.ERROR, {
        message: "answering phase is closed"
      });
      return;
    }
    if(questionId!=store.currentQuestionId){
      socket.emit(EVENTS.ERROR, {
        message: "this question is not active"
      });
      return;
    }
    if (!store.answers[questionId]) {
      store.answers[questionId] = {};
    }

    if (store.answers[questionId][userId]) {

      socket.emit(EVENTS.ERROR, {
        message: "already answered"
      });

      return;
    }

    const question =
      store.questions.find(
        q => q._id.toString() === questionId.toString()
      );

    if (!question) {

      socket.emit(EVENTS.ERROR, {
        message: "question not found"
      });

      return;
    }

    const correctAnswer =
      question.correctAnswer;

    const isCorrect =
      answer === correctAnswer;

    let points = 0;

    if (isCorrect) {

      const timeLimit = 20000;

      const timeTaken =
        answeredAt - store.revealAt;

      const timeRatio = Math.max(
        0,
        1 - timeTaken / timeLimit
      );

      points = Math.round(
        500 + 500 * timeRatio
      );
    }

    store.answers[questionId][userId] = {
      answer,
      isCorrect,
      points
    };

    if (!store.leaderboard[userId]) {
      store.leaderboard[userId] = 0;
    }

    store.leaderboard[userId] += points;

    io.to(store.hostSocketId).emit(
      EVENTS.ANSWER_STATS_UPDATED,
      {
        totalResponses:Object.keys(store.answers[questionId]).length,
        totalParticipants:store.participantsCount,
        questionId:questionId.toString(),
      }
    );

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