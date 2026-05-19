import sessionStore from "../sessionStore.js";
import { EVENTS } from "../events.js";

export default function revealOptions(io, socket, data) {

  try {

    const {
      sessionId,
      questionId
    } = data;

    if (socket.data.role !== "host") {

      socket.emit(EVENTS.ERROR, {
        message: "only host can reveal options"
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

    const questionData =
      store.questions.find(
        q => q._id.toString() === questionId
      );

    if (!questionData) {

      socket.emit(EVENTS.ERROR, {
        message: "question not found"
      });

      return;
    }

    store.answers[questionId] = {};
    store.quesStartTime = Date.now();

    io.to(sessionId).emit(
      EVENTS.OPTIONS_REVEALED,
      {
        questionId,
        options: questionData.options
      }
    );

  } catch (err) {

    console.error("revealOptions error:", err);

    socket.emit(EVENTS.ERROR, {
      message: "something went wrong"
    });
  }
}