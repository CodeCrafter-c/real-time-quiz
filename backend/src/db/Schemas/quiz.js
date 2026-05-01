import mongoose, { Schema } from "mongoose";

const QuestionSchema = new Schema({
  question: {
    type: String,
    required: true
  },
  options: {
    type: [String],
    required: true,
    validate: v => v.length >= 2
  },
  correctAnswer: {
    type: Number, // index
    required: true
  }
});

const quizSchema = new Schema({
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  questions: {
    type: [QuestionSchema],
    required: true
  },
}, {
  timestamps: true
});

const Quiz = mongoose.model("Quiz", quizSchema);

export default Quiz;