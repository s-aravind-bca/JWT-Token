import express from "express";
import controller from '../Controller/userController.js'
import middleware from "../Middlewares/middleware.js";
const route = express.Router()


route.post('/reset-password',controller.resetPassword) 
route.post('/reset-password/:token',controller.resetPasswordConfirm)
route.post('/mail',controller.sendMail)
route.post('/chat',controller.chatgpt)

//route.post('/auth-token',controller.authenticate) // To get jwt token
//route.post('/verify-token',controller.verifyToken) // To verify jwt token

export default route