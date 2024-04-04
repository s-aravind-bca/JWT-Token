import express from 'express'
import adminController from '../Controller/adminController.js'
import middleware from '../Middlewares/middleware.js'
const route = express.Router()

route.post('/newuser',middleware.verifyAdminToken,adminController.createUser) 
route.get('/viewuser/:id',middleware.verifyAdminToken,adminController.getUser)
route.put('/edituser',middleware.verifyAdminToken,adminController.editUser)
route.delete('/deleteuser/:id',middleware.verifyAdminToken,adminController.deleteUser)
route.get('/alluser',middleware.verifyAdminToken,adminController.allUser)
route.post('/login',adminController.login)
route.post('/signup',adminController.signup)
route.post('/verify-token',adminController.verifyToken)

export default route
