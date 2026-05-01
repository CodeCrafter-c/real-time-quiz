import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["quiz", "poll", "open_ended"],
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
    enum: ["lobby", "active", "ended"],
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

export default mongoose.model("Session", sessionSchema);    