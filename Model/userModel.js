import mongoose, { mongo } from "mongoose";

const userSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    resetPasswordToken:String,
    tokenExpires:String
},{
    timestamps:true
})


export default mongoose.model('user',userSchema)
