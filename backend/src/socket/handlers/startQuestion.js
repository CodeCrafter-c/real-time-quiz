import sessionStore from "../sessionStore.js";
import { EVENTS } from "../events.js";

export default function startQuestion(io, socket, data) {

  try {

    const { sessionId } = data;

    if (socket.data.role !== "host") {

      socket.emit(EVENTS.ERROR, {
        message: "only host can start questions"
      });

      return;
    }

    const store = sessionStore.get(sessionId);

    if (!store) {

      socket.emit(EVENTS.ERROR, {
        message: "session not found"
      });

      return;
    }

    const {
      questions,
      currentQuestionIndex,
      title
    } = store;

    if (currentQuestionIndex >= questions.length) {

      socket.emit(EVENTS.ERROR, {
        message: "no more questions"
      });

      return;
    }

    const currentQuestion =
      questions[currentQuestionIndex];

    io.to(sessionId).emit(
      EVENTS.QUESTION_STARTED,
      {
        question: currentQuestion.question,
        questionId: currentQuestion._id,
        currentQuestionIndex,
        totalQuestions: questions.length,
        title,
        revealAt: Date.now() + 15000,
        answerEndAt: Date.now() + 35000
      }
    );

    store.currentQuestionIndex++;

  } catch (err) {

    console.error("startQuestion error:", err);

    socket.emit(EVENTS.ERROR, {
      message: "something went wrong"
    });
  }
}