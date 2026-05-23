import { EVENTS } from "../events.js";
import redis from "../../config/redis.js";
import Result from "../../db/Schemas/result.js";
export default async function getLeaderboard(io, socket, data) {
  try {
    const { sessionId } = data;

    const session = await redis.hgetall(`session:${sessionId}:meta`);
    if (!session || Object.keys(session).length === 0) {
      socket.emit(EVENTS.ERROR, { message: "session not found" });
      return;
    }

    if (session.hostId.toString() !== socket.user.userId.toString()) {
      socket.emit(EVENTS.ERROR, { message: "unauthorized" });
      return;
    }

    if (session.status !== "review") {
      socket.emit(EVENTS.ERROR, { message: "leaderboard not available yet" });
      return;
    }

    // ZRANGE with REV and WITHSCORES gives top scores in descending order
    const raw = await redis.zrange(
      `session:${sessionId}:leaderboard`,
      0, 9,
      "REV", "WITHSCORES"
    );

    // raw comes back as [userId, score, userId, score, ...]
    const leaderboard = [];
    for (let i = 0; i < raw.length; i += 2) {
      leaderboard.push({
        rank: Math.floor(i / 2) + 1,
        userId: raw[i],
        score: Number(raw[i + 1])
      });
    }

    const totalParticipants = await redis.scard(`session:${sessionId}:participants`);

    await redis.hset(`session:${sessionId}:meta`, "status", "leaderboard");

    const questionsData = await redis.get(`session:${sessionId}:questions`);
    const totalQuestions = questionsData ? JSON.parse(questionsData).questions.length : 0;

    io.to(sessionId).emit(EVENTS.LEADERBOARD_DATA, {
      leaderboard,
      totalParticipants,
      totalQuestions
    });

    const currentQuestionIndex = parseInt(session.currentQuestionIndex);
    const { title, questions } = JSON.parse(await redis.get(`session:${sessionId}:questions`));
    const isLastQuestion = currentQuestionIndex >= questions.length - 1;

    if (isLastQuestion) {
      const allRaw = await redis.zrange(`session:${sessionId}:leaderboard`, 0, -1, "REV", "WITHSCORES");
      const allResults = [];
      for (let i = 0; i < allRaw.length; i += 2) {
        allResults.push({
          userId: allRaw[i],
          score: Number(allRaw[i + 1]),
          rank: Math.floor(i / 2) + 1
        });
      }

      await Result.create({
        sessionId,
        hostId: session.hostId,
        title,
        totalParticipants,
        totalQuestions: questions.length,
        results: allResults
  });
}    

  } catch (error) {
    console.error("getLeaderboard error:", error);
    socket.emit(EVENTS.ERROR, { message: "failed to fetch leaderboard" });
  }
}