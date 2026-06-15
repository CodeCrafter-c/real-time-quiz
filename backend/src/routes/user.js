import { Router } from "express";
import { User } from "../db/Schemas/userSchema.js";
import jwt from "jsonwebtoken";
import authenticate from "../middleware/auth.js";
import quizValidation from "../validation/quiz.js";
import Quiz from "../db/Schemas/quiz.js";
import sessionValidation from "../validation/session.js";
import { customAlphabet } from "nanoid";
import Poll from "../db/Schemas/poll.js";
import Session from "../db/Schemas/sessions.js";
import redis from "../config/redis.js";
import Result from "../db/Schemas/result.js";
import bcrypt from 'bcrypt'

const userRouter = Router();


userRouter.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "both fields mandatory"
    });
  }
  const salt=await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = new User({ email, password:hashedPassword });
  const savedUser = await user.save();

  const token=jwt.sign({user_id:String(savedUser._id)},process.env.JWT_SECRET);
  res.cookie("token",token,cookieOptions);
  return res.status(201).json({
    message: "user created successfully",
    user_id: String(savedUser._id)
  });
});


userRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      message: "both fields mandatory"
    });
  }

  const user = await User.findOne({ email });

  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(400).json({
      message: "email or password is invalid"
    });
  }

  const token = jwt.sign(
    { user_id: String(user._id) },
    process.env.JWT_SECRET
  );

  res.cookie("token", token,cookieOptions);

  return res.status(200).json({
    message: "login successful"
  });
});


userRouter.post("/quiz", authenticate, async (req, res) => {
  const { questions,title } = req.body;

  const valid = quizValidation.safeParse({ title,questions });

  if (!valid.success) {
    return res.status(400).json({
      message: valid.error.issues[0].message
    });
  }

  const quiz = new Quiz({
    host: req.user_id,
    title:title,
    questions: questions
  });

  const savedQuiz = await quiz.save();

  return res.status(201).json({
    message: "quiz created successfully",
    quiz_id: String(savedQuiz._id)
  });
});


userRouter.post("/create-session/:type/:id", authenticate, async (req, res) => {
  const parsed = sessionValidation.safeParse(req.params);

  if (!parsed.success) {
    return res.status(400).json({
      message: parsed.error.issues[0].message,
    });
  }

  const { type, id } = parsed.data;

  let contentExists = null;

  if (type.toLowerCase() === "quiz") {
    contentExists = await Quiz.findById(id);
  } else if (type.toLowerCase() === "poll") {
    contentExists = await Poll.findById(id);
  }

  if (!contentExists) {
    return res.status(400).json({
      message: `${type} not found`,
    });
  }

  const isSameUser =
    contentExists.host?.toString() === req.user_id.toString();

  if (!isSameUser) {
    return res.status(400).json({
      message: `you are not authorized to create session for this ${type}`,
    });
  }

  

  const joinCode = customAlphabet("1234567890", 6)();

  const session = new Session({
    type,
    contentId: id,
    hostId: req.user_id,
    joinCode,
    status: "lobby",
    participants: [],
    currentQuestionIndex: 0,
  });

  const savedSession = await session.save();

  const sessionId = String(savedSession._id);

  await redis.set(`session:${sessionId}:questions`,JSON.stringify({
    questions:contentExists.questions,
    title:contentExists.title
  }));

  await redis.hset(
    `session:${sessionId}:meta`,
      "sessionId",sessionId,
      "hostId",String(savedSession.hostId),
      "joinCode",savedSession.joinCode,
      "status",savedSession.status,
      "type",savedSession.type,
      "currentQuestionIndex",0,
  );

  await redis.set(
    `session:joinCode:${joinCode}`,
    sessionId
  );
  await redis.expire(`session:${sessionId}:meta`, 86400);
  await redis.expire(`session:joinCode:${joinCode}`, 86400);
  await redis.del(`session:${sessionId}:participants`); 
  await redis.expire(`session:${sessionId}:questions`, 86400);

 return res.status(201).json({
    message: "session created successfully",
    sessionId,
    joinCode,
  });
});

userRouter.post("/join-session", authenticate, async (req, res) => {
  const { joinCode } = req.body;

  if (!joinCode) {
    return res.status(400).json({
      message: "joinCode is mandatory",
    });
  }

  let sessionId = await redis.get(`session:joinCode:${joinCode}`);

  let session;

  if (!sessionId) {
    console.log("joined from mongodb")
    session = await Session.findOne({ joinCode });

    if (!session) {
      return res.status(400).json({
        message: "session not found",
      });
    }

    sessionId = String(session._id);

    await redis.hset(
      `session:${sessionId}:meta`,
        "sessionId",sessionId,
        "hostId",String(session.hostId),
        "joinCode",session.joinCode,
        "status",session.status,
        "type",session.type,
        "currentQuestionIndex",session.currentQuestionIndex,
    );

    await redis.set(`session:joinCode:${joinCode}`, sessionId);
  } else {
    console.log("joined from redis")
    const raw = await redis.hgetall(`session:${sessionId}:meta`);

    if (!raw || Object.keys(raw).length === 0) {
      session = await Session.findOne({ joinCode });

      if (!session) {
        return res.status(400).json({
          message: "session not found",
        });
      }

      sessionId = String(session._id);

      await redis.hset(
        `session:${sessionId}:meta`,
        "sessionId",sessionId,
        "hostId",String(session.hostId),
        "joinCode",session.joinCode,
        "status",session.status,
        "type",session.type,
        "currentQuestionIndex",session.currentQuestionIndex,
      );
    }
  }

  const sessionMeta =await redis.hgetall(`session:${sessionId}:meta`);

  if (sessionMeta.status !== "lobby") {
    return res.status(400).json({
      message: "session is not in lobby",
    });
  }

  if (sessionMeta.hostId === String(req.user_id)) {
    return res.status(400).json({
      message: "host cannot join session",
    });
  }

  const participantsKey = `session:${sessionId}:participants`;
  const isAlreadyParticipant = await redis.sismember(
    participantsKey,
    String(req.user_id)
  );
  
  if (isAlreadyParticipant) {
    return res.status(400).json({
      message: "already joined session",
    });
  }
  
  await redis.sadd(participantsKey, String(req.user_id));
  await redis.expire(participantsKey, 86400);

  return res.status(200).json({
    message: "joined session successfully",
    sessionId,
    role: "participant",
  });
});


userRouter.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user_id);  
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    const [quizzes, polls,hostedSessions,participatedSessions] = await Promise.all([
      Quiz.find({ host: req.user_id }, { title: 1 }).lean(),
      Poll.find({ host: req.user_id }, { title: 1 }).lean(),
      Result.find({ hostId: req.user_id }).lean(),
      Result.find({ "results.userId": req.user_id }).lean(),
    ]);

    const participated = participatedSessions.map(session => {
      const myResult = session.results.find(r => r.userId.toString() === req.user_id.toString());
      return {
        sessionId: session.sessionId,
        title: session.title,
        completedAt: session.completedAt,
        totalParticipants: session.totalParticipants,
        totalQuestions: session.totalQuestions,
        score: myResult?.score ?? 0,
        rank: myResult?.rank ?? null
  };
});

const hosted = hostedSessions.map(s => ({
  sessionId: s.sessionId,
  title: s.title,
  completedAt: s.completedAt,
  totalParticipants: s.totalParticipants,
  totalQuestions: s.totalQuestions,
}));

const content = [
  ...quizzes.map(q => ({ id: q._id, title: q.title, type: "quiz" })),
  ...polls.map(p => ({ id: p._id, title: p.title, type: "poll" }))
];

return res.status(200).json({
  message: "content fetched successfully",
  content,
  hostedSessions: hosted,
  participatedSessions: participated
});
  } catch (err) {
    return res.status(500).json({ message: "something went wrong" });
  }
});
export default userRouter;