import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session" },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: String,
  completedAt: { type: Date, default: Date.now },
  totalParticipants: Number,
  totalQuestions: Number,
  results: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      score: Number,
      rank: Number
    }
  ]
});

const Result = mongoose.model("Result", resultSchema);

export default Result;
