import sessionStore from "../sessionStore.js";
import { EVENTS } from "../events.js";
import revealOptions from "./revealOptions.js";
import timeUp from "./timeup.js";

export default function startQuestion(io, socket, data) {

  try {

    const { sessionId } = data;

    // only host can start
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

    if (
      store.phase === "question" ||
      store.phase === "options"
    ) {

      socket.emit(EVENTS.ERROR, {
        message: "question already running"
      });

      return;
    }

    const {
      questions,
      currentQuestionIndex,
      title
    } = store;

    // no more questions
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
    store.phase = "question";

    store.currentQuestionId =
      currentQuestion._id.toString();

    store.revealAt = revealAt;

    store.answerEndAt = answerEndAt;

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

    // cleanup old timers if somehow present
    if (store.revealTimeout) {
      clearTimeout(store.revealTimeout);
    }

    if (store.timeUpTimeout) {
      clearTimeout(store.timeUpTimeout);
    }

    // reveal options timer
    const revealTimeout = setTimeout(() => {

      revealOptions(
        io,
        sessionId,
        currentQuestion._id
      );

      store.phase = "options";

      // time up timer
      const timeUpTimeout = setTimeout(() => {

        timeUp(
          io,
          sessionId,
          currentQuestion._id
        );

        // store.phase = "results";
        store.currentQuestionIndex++;
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