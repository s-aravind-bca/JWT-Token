import mongoose from "mongoose";

const gptSchema = new mongoose.Schema({
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
