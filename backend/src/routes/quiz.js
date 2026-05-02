import { Router } from "express";
import Quiz from "../db/Schemas/quiz.js"
import authenticate from "../middleware/auth.js"

const quizRouter = Router();

quizRouter.get("/:id", authenticate, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: "q uiz not found" });
    }

    if (quiz.host.toString() !== req.user_id.toString()) {
      return res.status(403).json({ message: "not authorized" });
    }

    return res.status(200).json({
      id: quiz._id,
      title: quiz.title,
      questions: quiz.questions
    });
  } catch (err) {
    return res.status(500).json({ message: "internal server error" });
  }
});


export default quizRouter;