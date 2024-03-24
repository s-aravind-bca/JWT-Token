import mongoose from 'mongoose'

const historySchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    title:{
        type: String,
        required: true,
    },
    action:{
        type: String,
        required: true,
    },
    time:{
        type: String,
        default: Date.now()
    }
},
{
    timestamps:true
})

export default mongoose.model('history',historySchema)