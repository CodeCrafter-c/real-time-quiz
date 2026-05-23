import { EVENTS } from "../events.js";
import redis from "../../config/redis.js";

export default async function revealOptions(io, sessionId, questionId) {

  const questionData = JSON.parse(await redis.get(`session:${sessionId}:questions`));
  const question = questionData.questions.find(
    q => q._id.toString() === questionId.toString()
  );

  if (!question) return;
    
  io.to(sessionId).emit(
    EVENTS.OPTIONS_REVEALED,
    {
      questionId,
      options: question.options
    }
  );
}