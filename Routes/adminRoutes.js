import express from 'express'
import adminController from '../Controller/adminController.js'
const route = express.Router()

route.post('/newuser',adminController.createUser) 
route.get('/viewuser/:id',adminController.getUser)
route.post('/edituser',adminController.editUser)
route.post('/deleteuser/:id',adminController.deleteUser)
route.get('/alluser',adminController.allUser)

export default route
