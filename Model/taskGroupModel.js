import mongoose, { Mongoose } from 'mongoose'

const taskGroupSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    groupName:{
        type: String,
        required: true,
        unique: true
    },
    tasks:[{
        name:{
            type: String
        },
        emails:{
            type:[String]
        }
    }]
},
{
    timestamps:true
})

export default mongoose.model('taskgroup',taskGroupSchema)