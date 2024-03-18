import mongoose from "mongoose";

const gptSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId
    },
    requestType:{
        type:String
    },
    prompt:{
        type:String
    },
    result:{
        type:String,  
    },
    message:{
        type:String
    }
},{
    timestamps:true
})


export default mongoose.model('chat',gptSchema)
