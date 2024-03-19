import express from "express";
import controller from '../Controller/userController.js'
import middleware from "../Middlewares/middleware.js";
const route = express.Router()


route.post('/reset-password',controller.resetPassword) 
route.post('/reset-password/:otp',controller.resetPasswordConfirm)
route.post('/new-password/',middleware.verifyToken,controller.newPassword)
route.post('/mail',middleware.verifyToken,controller.sendMail)
route.post('/chat',middleware.verifyToken,controller.chatgpt)
route.post('/signup',controller.signup)
route.post('/login',controller.login)
route.post('/translate',middleware.verifyToken,controller.translate)
//route.post('/auth-token',controller.authenticate) // To get jwt token
route.post('/verify-token',controller.verifyToken) // To verify jwt token

export default route