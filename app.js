import express from "express";
import mongoose from "mongoose";
import 'dotenv/config';
import userRoutes from './Routes/userRoutes.js';
import cors from 'cors';
import adminRoutes from './Routes/adminRoutes.js';
import bodyParser from 'body-parser'

const app = express()
app.use(bodyParser.json({ limit: '25mb' }));
app.use(bodyParser.urlencoded({ limit: '25mb', extended: true }));
app.use(cors())
app.use('/api/v1/user',userRoutes)
app.use('/api/v1/admin',adminRoutes)
const URL = process.env.MONGO_URL

mongoose.connect(URL).then(()=>{
    app.listen(7000,()=> console.log('server running in port 7000'))
}).catch((err)=>console.log(err.message))

app.all('/',(req,res)=> res.send('api working'))

