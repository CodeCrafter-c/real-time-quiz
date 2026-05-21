import sessionStore from "../sessionStore.js";
import { EVENTS } from "../events.js";

export default async function getLeaderboard(io, socket, data) {

  try {

    console.log("getLeaderboard",data);
    const { sessionId } = data;

    const store = sessionStore.get(sessionId);

    if (!store) {

      socket.emit(EVENTS.ERROR, {
        message: "session not found"
      });

      return;
    }
    store.phase = "review";
    const isHost =
      store.hostId.toString() ===
      socket.user.userId.toString();
    console.log("isHost",isHost)
    if (!isHost) {

      socket.emit(EVENTS.ERROR, {
        message: "unauthorized"
      });

      return;
    }
    console.log("store.phase",store.phase)

    if (store.phase !== "review") {

      socket.emit(EVENTS.ERROR, {
        message: "leaderboard not available yet"
      });

      return;
    }

    const leaderboard =
      Object.entries(store.leaderboard)

        .sort(([, a], [, b]) => b - a)

        .slice(0, 10)

        .map(([userId, score], index) => ({

          rank: index + 1,

          userId,

          score

        }));

    store.phase = "leaderboard";

    io.to(sessionId).emit(
      EVENTS.LEADERBOARD_DATA,
      {
        leaderboard,
        totalParticipants: store.participantsCount
      }
    );

  } catch (error) {

    console.error(
      "getLeaderboard error:",
      error
    );

    socket.emit(EVENTS.ERROR, {
      message: "failed to fetch leaderboard"
    });
  }
}