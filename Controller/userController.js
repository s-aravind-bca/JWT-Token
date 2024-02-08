import model from '../Model/userModel.js'
import bcrypt from 'bcryptjs'

async function createUser(req, res) {
    try {
        const { email, password } = req.body
        const query = await model.findOne({ email })
        if (query) {
            res.status(400).send('email already exist')
        }
        else {
            const hashedPassword = await bcrypt.hash(password, 10)
            const result = await model.create({ email, "password": hashedPassword })
            res.json({ "success": "user created" })
        }
    }
    catch (err) {
        res.status(500).send('Internal Server Error')
        console.error(err.message)
    }
}

async function authenticate(req, res) {
    try {
        const { email, password } = req.body
        const query = await model.findOne({ email })
        if (query) {
            const isMatch = await bcrypt.compare(password, query.password)
            if (!isMatch) {
                return res.status(401).json({ "message": "Incorrect Password" })
            }
        }
        else {
            res.status(400).send('user not found')
        }
    }
    catch (err) {
        res.status(500).send('Internal Server Error')
        console.error(err.message)
    }
}

export default {
    createUser,
    authenticate
}