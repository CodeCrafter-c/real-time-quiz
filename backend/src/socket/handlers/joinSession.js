import Session from "../../db/Schemas/sessions.js";
import sessionStore from "../sessionStore.js";
import { EVENTS } from "../events.js";

export default async function joinSession(io, socket, data) {

  try {

    const { sessionId } = data;

    const session = await Session.findById(sessionId);

    if (!session) {
      socket.emit(EVENTS.ERROR, {
        message: "session not found"
      });
      return;
    }

    const userId = socket.user.userId;

    const isHost =
      session.hostId.toString() === userId;

    const isParticipant =
      session.participants
        .map(p => p.toString())
        .includes(userId);

    if (!isHost && !isParticipant) {

      socket.emit(EVENTS.ERROR, {
        message: "not authorized"
      });

      return;
    }

    if (isHost && !sessionStore.has(sessionId)) {

      const populated =
        await Session.findById(sessionId)
          .populate("contentId");

      sessionStore.set(sessionId, {
        title: populated.contentId.title,
        questions: populated.contentId.questions,
        currentQuestionIndex: 0,
        answers: {},
        leaderboard: {},
        quesStartTime: null
      });
    }

    socket.join(sessionId);

    socket.data = {
      sessionId,
      role: isHost ? "host" : "participant",
      userId
    };

    socket.to(sessionId).emit(
      "user_joined",
      {
        userId
      }
    );

    socket.emit(EVENTS.SESSION_JOINED, {
      data:{
        role: socket.data.role,
        sessionId,
        joinCode: session.joinCode,
        participants: session.participants.length,
      }
    });

  } catch (err) {

    console.error(err);

    socket.emit(EVENTS.ERROR, {
      message: "something went wrong"
    });
  }
}