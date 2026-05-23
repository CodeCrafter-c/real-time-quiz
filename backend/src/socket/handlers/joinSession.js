import Session from "../../db/Schemas/sessions.js";
import { EVENTS } from "../events.js";
import { ObjectId } from "mongodb";
import redis from "../../config/redis.js";
import timeStore from "../timeStore.js";

export default async function joinSession(io, socket, data) {
  try {
    const { sessionId } = data;

    const checkSessionInRedis = await redis.exists(`session:${sessionId}:meta`);

    let session;
    if (checkSessionInRedis) {
      session = await redis.hgetall(`session:${sessionId}:meta`);
    } else {
      const dbSession = await Session.findById(new ObjectId(sessionId));
      if (!dbSession) {
        socket.emit(EVENTS.ERROR, { message: "session not found" });
        return;
      }
      await redis.hset(
        `session:${sessionId}:meta`,
        "sessionId", sessionId,
        "hostId", String(dbSession.hostId),
        "joinCode", dbSession.joinCode,
        "status", dbSession.status,
        "type", dbSession.type,
        "currentQuestionIndex", dbSession.currentQuestionIndex
      );
      await redis.expire(`session:${sessionId}:meta`, 86400);
      session = await redis.hgetall(`session:${sessionId}:meta`);
    }

    const userId = socket.user.userId;
    const isHost = session.hostId.toString() === userId;
    const isParticipant = await redis.sismember(`session:${sessionId}:participants`, userId);

    if (!isHost && !isParticipant) {
      socket.emit(EVENTS.ERROR, { message: "not authorized" });
      return;
    }

    if (isHost) {
      let questionData = await redis.get(`session:${sessionId}:questions`);
      if (!questionData) {
        const populated = await Session.findById(new ObjectId(sessionId)).populate("contentId");
        questionData = JSON.stringify({
          questions: populated.contentId.questions,
          title: populated.contentId.title
        });
        await redis.set(`session:${sessionId}:questions`, questionData);
        await redis.expire(`session:${sessionId}:questions`, 86400);
      }

      await redis.set(`session:${sessionId}:hostSocketId`, socket.id);
      await redis.expire(`session:${sessionId}:hostSocketId`, 86400);

      if (!timeStore.has(sessionId)) {
        timeStore.set(sessionId, { revealTimeout: null, timeUpTimeout: null });
      }
    }

    if (!isHost) {
      await redis.hset(`session:${sessionId}:sockets`, userId, socket.id);
      await redis.expire(`session:${sessionId}:sockets`, 86400);
    }

    socket.join(sessionId);

    socket.data = {
      sessionId,
      role: isHost ? "host" : "participant",
      userId
    };

    const participantsCount = await redis.scard(`session:${sessionId}:participants`);

    socket.to(sessionId).emit("user_joined", { userId, participantsCount });

    socket.emit(EVENTS.SESSION_JOINED, {
      data: {
        role: socket.data.role,
        sessionId,
        joinCode: session.joinCode,
        participantsCount
      }
    });

    const status = session.status;
    const questionsRaw = await redis.get(`session:${sessionId}:questions`);
    const { questions, title } = questionsRaw
      ? JSON.parse(questionsRaw)
      : { questions: [], title: "" };

    const currentQuestionIndex = parseInt(session.currentQuestionIndex);
    const currentQuestion = questions?.[currentQuestionIndex];
    const timingsRaw = await redis.get(`session:${sessionId}:timings`);
    const timings = timingsRaw ? JSON.parse(timingsRaw) : {};

    if (status === "question" && currentQuestion) {
      socket.emit(EVENTS.QUESTION_STARTED, {
        question: currentQuestion.question,
        questionId: currentQuestion._id,
        currentQuestionIndex,
        totalQuestions: questions.length,
        title,
        revealAt: Number(timings.revealAt),
        answerEndAt: Number(timings.answerEndAt)
      });
    }

    if (status === "options" && currentQuestion) {
      socket.emit(EVENTS.QUESTION_STARTED, {
        question: currentQuestion.question,
        questionId: currentQuestion._id,
        currentQuestionIndex,
        totalQuestions: questions.length,
        title,
        revealAt: Number(timings.revealAt),
        answerEndAt: Number(timings.answerEndAt)
      });
      socket.emit(EVENTS.OPTIONS_REVEALED, {
        questionId: currentQuestion._id,
        options: currentQuestion.options
      });

        const totalResponses = await redis.hlen(`session:${sessionId}:answers:${session.currentQuestionId}`);
        const totalParticipants = await redis.scard(`session:${sessionId}:participants`);
        socket.emit(EVENTS.ANSWER_STATS_UPDATED, {
        totalResponses,
        totalParticipants,
        questionId: session.currentQuestionId
      });
    }

    if (status === "leaderboard") {
      const raw = await redis.zrange(
        `session:${sessionId}:leaderboard`,
        0, 9,
        "REV", "WITHSCORES"
      );
      const leaderboard = [];
      for (let i = 0; i < raw.length; i += 2) {
        leaderboard.push({
          rank: Math.floor(i / 2) + 1,
          userId: raw[i],
          score: Number(raw[i + 1])
        });
      }
      socket.emit(EVENTS.LEADERBOARD_DATA, {
        leaderboard,
        totalParticipants: participantsCount,
        totalQuestions: questions.length
      });
    }

  } catch (err) {
    console.error(err);
    socket.emit(EVENTS.ERROR, { message: "something went wrong" });
  }
}