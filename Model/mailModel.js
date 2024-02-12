import mongoose, { mongo } from "mongoose";

const mailSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,  
    },
    to:{
        type:String,
        required:true
    }
},{
    timestamps:true
})


export default mongoose.model('mails',mailSchema)
