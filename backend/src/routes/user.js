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

const userRouter = Router();


userRouter.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "both fields mandatory"
    });
  }

  const user = new User({ email, password });
  const savedUser = await user.save();

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

  if (!user || user.password !== password) {
    return res.status(400).json({
      message: "email or password is invalid"
    });
  }

  const token = jwt.sign(
    { user_id: String(user._id) },
    "secret"
  );

  res.cookie("token", token);

  return res.status(200).json({
    message: "login successful"
  });
});


userRouter.post("/quiz", authenticate, async (req, res) => {
  const { quizData } = req.body;

  const valid = quizValidation.safeParse({ questions: quizData });

  if (!valid.success) {
    return res.status(400).json({
      message: valid.error.issues[0].message
    });
  }

  const quiz = new Quiz({
    host: req.user_id,
    questions: quizData
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
      message: parsed.error.issues[0].message
    });
  }

  const { type, id } = parsed.data;

  let contentExists = null;

  if (type === "quiz") {
    contentExists = await Quiz.findById(id);
  } else if (type === "poll") {
    contentExists = await Poll.findById(id);
  }

  if (!contentExists) {
    return res.status(400).json({
      message: `${type} not found`
    });
  }

  const IsSameUser= contentExists.host?.toString() === req.user_id.toString();

  if(!IsSameUser){
    return res.status(400).json({
      message:`you are not authorized to create session for this ${type}`
    })
  }

  const joinCode = customAlphabet("1234567890", 6)();

  const session = new Session({
    type,
    contentId: id,         
    hostId: req.user_id,  
    joinCode,
    status: "lobby",
    participants: [],
    currentQuestionIndex: 0
  });

  const savedSession = await session.save();

  return res.status(201).json({
    message: "session created successfully",
    session_id: String(savedSession._id),
    joinCode
  });
});


userRouter.post("/join-session",async(req,res)=>{
  const {joinCode}=req.body;
   
  const session=await Session.findOne({joinCode});
  if(!session){
    return res.status(400).json({
      message:"session not found"
    })
  }

  session.participants.push(req.user_id);
  await session.save();

  return res.status(200).json({
    message:"joined session successfully",
    session_id:String(session._id)
  })
})

export default userRouter;