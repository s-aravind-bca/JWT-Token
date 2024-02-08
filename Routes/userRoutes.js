import express from "express";
import controller from '../Controller/userController.js'
const route = express.Router()

route.get('/',(req,res)=>res.send('inside user'))
route.post('/new',(req,res)=>controller.createUser(req,res))
route.post('/auth',(req,res)=>controller.authenticate(req,res))

export default route