import mongoose from "mongoose"

export default async function connectToDb(){
    try{
        const connection= await mongoose.connect(process.env.MONGO_URI);
        if(connection){
            console.log("connected to db")
        }
    }
    catch(e){
        console.log("Failed to connect to db")
        console.log("error: ",e.message)
    }
}
