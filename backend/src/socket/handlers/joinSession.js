import Session from "../../db/Schemas/sessions.js";
import sessionStore from "../sessionStore.js";
import { EVENTS } from "../events.js";
import { ObjectId } from "mongodb";
import redis from "../../config/redis.js";

export default async function joinSession(io, socket, data) {

  try {

    const { sessionId } = data;
    
    const checkSessionInRedis = await redis.exists(`session:${sessionId}:meta`);
    
    let session;
    if(checkSessionInRedis){
      session = await redis.get(`session:${sessionId}:meta`);
      session = JSON.parse(session);
      console.log("served from redis",session)
    }
    else{
      session = await Session.findById(new ObjectId(sessionId));
      console.log("served from mongodb",session)
      if (!session) {
      socket.emit(EVENTS.ERROR, {
        message: "session not found"
      });
      return;
    }
      const data = {
        hostId:session.hostId,
        joinCode:session.joinCode,
        status:session.status,
        type:session.type,
        currentQuestionIndex:session.currentQuestionIndex,
      }
      await redis.set(`session:${sessionId}:meta`,JSON.stringify(data));
      session=await redis.get(`session:${sessionId}:meta`);
      session = JSON.parse(session);
    }

  
    const userId = socket.user.userId;

    const isHost =
      session.hostId.toString() === userId;

    const isParticipant=await redis.sismember(`session:${sessionId}:participants`,userId);
   

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
        quesStartTime: null,
        hostSocketId: socket.id,
        hostId:session.hostId,
        participantsCount:0,
        userSockets:{}
      });
    }

    if(!isHost){
      sessionStore.get(sessionId).userSockets[userId] = socket.id;
    }

    socket.join(sessionId);

    if(!isHost){
      sessionStore.get(sessionId).participantsCount++;
    }

    socket.data = {
      sessionId,
      role: isHost ? "host" : "participant",
      userId
    };

    socket.to(sessionId).emit(
      "user_joined",
      {
        userId,
        participantsCount: sessionStore.get(sessionId).participantsCount,
      }
    );
    
    console.log("participants: ",sessionStore.get(sessionId).participantsCount)
    socket.emit(EVENTS.SESSION_JOINED, {
      data:{
        role: socket.data.role,
        sessionId,
        joinCode: session.joinCode,
        participantsCount: sessionStore.get(sessionId).participantsCount,
      }
    });

  } catch (err) {

    console.error(err);

    socket.emit(EVENTS.ERROR, {
      message: "something went wrong"
    });
  }
}