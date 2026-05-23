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
    if(checkSessionInRedis){
      session = await redis.hgetall(`session:${sessionId}:meta`);
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
      await redis.hset(`session:${sessionId}:meta`,
      "sessionId",sessionId,
      "hostId",String(session.hostId),
      "joinCode",session.joinCode,
      "status",session.status,
      "type",session.type,
      "currentQuestionIndex",session.currentQuestionIndex);
      await redis.expire(`session:${sessionId}:meta`, 86400);
      session=data
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

    if (isHost) {

      let questionData = await redis.get(`session:${sessionId}:questions`);
      if(!questionData){
        const session = await Session.findById(new ObjectId(sessionId)).populate("contentId");
        questionData = {questions:session.contentId.questions,title:session.contentId.title};
        await redis.set(`session:${sessionId}:questions`,JSON.stringify(questionData));
        await redis.expire(`session:${sessionId}:questions`, 86400);
      }
      questionData=JSON.parse(questionData);

     await redis.set(`session:${sessionId}:hostSocketId`,socket.id); 
     await redis.expire(`session:${sessionId}:hostSocketId`, 86400);

     timeStore.set(sessionId,{
      revealTimeout:null,
      timeUpTimeout:null,
     });
    }
      

    if(!isHost){
      await redis.hset(`session:${sessionId}:sockets`,`${userId}`,socket.id);
      await redis.expire(`session:${sessionId}:sockets`, 86400);
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
        userId,
        participantsCount: (await redis.scard(`session:${sessionId}:participants`)),
      }
    );
    
    socket.emit(EVENTS.SESSION_JOINED, {
      data:{
        role: socket.data.role,
        sessionId,
        joinCode: session.joinCode,
        participantsCount: (await redis.scard(`session:${sessionId}:participants`)),
      }
    });

  } catch (err) {

    console.error(err);

    socket.emit(EVENTS.ERROR, {
      message: "something went wrong"
    });
  }
}