import mongoose, { Schema } from "mongoose";

const pollSchema = new Schema({
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  question: {
    type: String,
    required: true
  },
  options: {
    type: [String],
    required: true,
    validate: v => v.length >= 2
  },
  joinCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  active: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Poll = mongoose.model("Poll", pollSchema);

export default Poll;