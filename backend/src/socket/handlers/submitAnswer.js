import sessionStore from "../sessionStore.js";
import { EVENTS } from "../events.js";

export default function submitAnswer(io, socket, data) {

  try {

    const {
      sessionId,
      questionId,
      answer
    } = data;

    const store = sessionStore.get(sessionId);

    if (!store) {

      socket.emit(EVENTS.ERROR, {
        message: "session not found"
      });

      return;
    }

    const userId = socket.user.userId;

    const answeredAt = Date.now();

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
        q => q._id.toString() === questionId
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
        answeredAt - store.quesStartTime;

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

    socket.emit(
      EVENTS.ANSWER_RESULT,
      {
        isCorrect,
        points,
        correctAnswer
      }
    );

  } catch (err) {

    console.error("submitAnswer error:", err);

    socket.emit(EVENTS.ERROR, {
      message: "something went wrong"
    });
  }
}