import express from "express";
import controller from '../Controller/userController.js'
import middleware from "../Middlewares/middleware.js";
const route = express.Router()

route.post('/new',(req,res)=>controller.createUser(req,res))
route.post('/auth-token',(req,res)=>controller.authenticate(req,res))// To get jwt token
route.post('/verify-token',(req,res)=>controller.verifyToken(req,res))// To verify jwt token
route.post('/reset-password',(req,res)=>controller.resetPassword(req,res)) 
route.post('/reset-password/:token',(req,res)=>controller.resetPasswordConfirm(req,res))
route.post('/mail',(req,res)=>controller.sendMail(req,res))
route.get('/secret',middleware.verifyToken,(req,res)=>controller.tokenUser(req,res))
route.post('/chat',(req,res)=>controller.chatgpt(req,res))
export default route 