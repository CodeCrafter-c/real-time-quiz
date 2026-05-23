import mongoose from "mongoose";
import Quiz from "./quiz.js";
import Poll from "./poll.js";
// import OpenEnded from "./openEnded";

const sessionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Quiz", "Poll", "OpenEnded"],
    required: true
  },
  contentId: {
  type: mongoose.Schema.Types.ObjectId,
  required: true,
  refPath: "type"
},
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true      
  },

  joinCode: {
    type: String,   
    required: true,
    unique: true    
  },

  status: {
    type: String,   
    enum: ["lobby", "active", "question", "options","timeup","results", "ended"],
    default: "lobby"    
  },

  participants: [
    {   
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"               
    }
  ],        

  currentQuestionIndex: {       
    type: Number,
    default: 0      
  }
}, { timestamps: true });       

const Session = mongoose.model("Session", sessionSchema);    

export default Session;