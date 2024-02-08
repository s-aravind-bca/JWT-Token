import express from "express";
import controller from '../Controller/userController.js'
import middleware from "../Middlewares/middleware.js";
const route = express.Router()

route.get('/',(req,res)=>res.send('inside user'))
route.post('/new',(req,res)=>controller.createUser(req,res))
route.post('/auth',(req,res)=>controller.authenticate(req,res))
route.post('/reset-password',(req,res)=>controller.resetPassword(req,res))
route.post('/reset-password/:token',(req,res)=>controller.resetPasswordConfirm(req,res))
route.get('/secret',middleware.verifyToken,(req,res)=>controller.allUser(req,res))
export default route