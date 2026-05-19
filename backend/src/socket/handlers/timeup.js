import sessionStore from "../sessionStore.js";
import { EVENTS } from "../events.js";

export default function timeUp(io, socket, data) {

  try {

    const {
      sessionId,
      questionId
    } = data;

    if (socket.data.role !== "host") {

      socket.emit(EVENTS.ERROR, {
        message: "only host can trigger time up"
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

    const answers =
      store.answers[questionId] || {};

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

    io.to(sessionId).emit(
      EVENTS.SHOW_RESULTS,
      {
        counts,
        correctAnswer: question.correctAnswer,
        totalAnswered,
        totalCorrect
      }
    );

  } catch (err) {

    console.error("timeUp error:", err);

    socket.emit(EVENTS.ERROR, {
      message: "something went wrong"
    });
  }
}