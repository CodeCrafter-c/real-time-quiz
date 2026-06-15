import { User } from "../db/Schemas/userSchema.js";
import jwt from "jsonwebtoken"
const authenticate=async(req,res,next)=>{
  try {
    const token=req.cookies.token;

    if(!token){
      return res.status(400).json({
        message:"not logged in"
      })
    }
    const decoded=jwt.verify(token,process.env.JWT_SECRET);
    const isUser=await User.findById(decoded.user_id);
    if(!isUser){
      return res.status(400).json({
        message:"user not found"
      })
    }

    req.user_id=decoded.user_id;
    next();
    
  } catch (error) {
    console.log("here",error);
    return res.status(500).json({
      message:"internal server error"
    })
  }
}
export default authenticate