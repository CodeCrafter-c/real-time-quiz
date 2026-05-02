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
      message: parsed.error.issues[0].message
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


userRouter.post("/join-session",authenticate,async(req,res)=>{
  const {joinCode}=req.body;
  if(!joinCode){
    return res.status(400).json({
      message:"joinCode is mandatory"
    })
  }
  const session=await Session.findOne({joinCode});
  if(!session){
    return res.status(400).json({
      message:"session not found"
    })
  }
  
  if(session.status!=="lobby"){
    return res.status(400).json({
      message:"session is not in lobby"
    })
  }
  
  if(session.hostId.toString() === req.user_id.toString()){
    return res.status(400).json({
      message:"host cannot join session"
    })
  }
  
  if(session.participants.includes(req.user_id.toString())){
    return res.status(400).json({
      message:"already joined session"
    })
  }
  const newParticipant=req.user_id.toString();
  session.participants.push(newParticipant);
  await session.save();
  
  return res.status(200).json({
    message:"joined session successfully",
    session_id:String(session._id),
    role:"participant"
  })
})


userRouter.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user_id);  
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    const [quizzes, polls] = await Promise.all([
      Quiz.find({ host: req.user_id }, { title: 1 }).lean(),
      Poll.find({ host: req.user_id }, { title: 1 }).lean()
    ]);

    const content = [
      ...quizzes.map(q => ({ id: q._id, title: q.title, type: "quiz" })),
      ...polls.map(p => ({ id: p._id, title: p.title, type: "poll" }))
    ];

    return res.status(200).json({
      message: "content fetched successfully",
      content
    });
  } catch (err) {
    return res.status(500).json({ message: "something went wrong" });
  }
});
export default userRouter;