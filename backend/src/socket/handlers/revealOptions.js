import sessionStore from "../sessionStore.js";
import { EVENTS } from "../events.js";
// import Session from "../../db/Schemas/sessions.js";

export default function revealOptions(io, sessionId, questionId) {

  const store = sessionStore.get(sessionId);
  if (!store) return;

  const questionData = store.questions.find(
    q => q._id.toString() === questionId.toString()
  );

  if (!questionData) return;

  store.answers[questionId] = {};

  store.quesStartTime = Date.now();
  io.to(sessionId).emit(
    EVENTS.OPTIONS_REVEALED,
    {
      questionId,
      options: questionData.options
    }
  );
}