import mongoose from 'mongoose'

const historySchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    window:{
        type: String,
        required: true,
    },
    action:{
        type: String,
        required: true,
    },
    status:{
        type:String,
        required:true
    },
    time:{
        type: Date,
        default: Date.now()
    }
},
{
    timestamps:true
})

export default mongoose.model('history',historySchema)