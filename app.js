import express from "express";
import mongoose from "mongoose";
import 'dotenv/config'
import userRoutes from './Routes/userRoutes.js'

const app = express()
app.use(express.json())
app.use('/api/v1/user',userRoutes)

const PORT = process.env.PORT || 7000
const URL = process.env.MONGO_URL

mongoose.connect(URL).then(()=>{
    app.listen(PORT,()=> console.log(`server running in port ${PORT}`))
}).catch((err)=>console.log(err.message))

app.all('/',(req,res)=> res.send('api working'))