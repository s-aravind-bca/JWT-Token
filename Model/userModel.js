import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{
        type:String
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    resetPasswordToken:{
        type:Number
    },
    tokenExpires:{
        type:Number
    },

},{
    timestamps:true
})


export default mongoose.model('user',userSchema)
