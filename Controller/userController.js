import model from '../Model/userModel.js'
import mail from '../Model/mailModel.js'
import gpt from '../Model/gptModel.js'
import bcrypt from 'bcryptjs'
import utils from '../utils/utils.js'
import nodemailer from 'nodemailer'
import jsonwebtoken from 'jsonwebtoken'
import OpenAI from 'openai';

console.log(process.env.OPENAI_KEY2);
const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY2
});
async function createUser(req, res) {
    try {
        const { email, password } = req.body
        const user = await model.findOne({ email })
        if (user) {
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
        const user = await model.findOne({ email })
        if (user) {
            const isMatch = await bcrypt.compare(password, user.password)
            if (!isMatch) {
                return res.status(401).json({ "message": "Incorrect Password" })
            }

            const token = utils.generateToken(user)
            console.log(token);
            res.json({ token })
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

async function tokenUser(req, res) {
    try {
        const result = await model.findById(req.user.id)
        return res.json({ "data": [`hello ${req.user.email}`, result] })
    }
    catch (err) {
        res.status(500).send('Internal Server Error')
        console.error(err.message)
    }
}


async function resetPassword(req, res) {
    try {
        const { email } = req.body
        const user = await model.findOne({ email })
        if (user) {
            const token = Math.random().toString(36).slice(-8);
            console.log(token);
            user.resetPasswordToken = token
            user.tokenExpires = Date.now() + 600000;
            await user.save()
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.MAIL_USER,
                    pass: process.env.MAIL_PASSWORD
                }
            })
            const message = {
                from: process.env.MAIL_USER,
                to: user.email,
                subject: "Password reset request",
                text: `Dear ${user.email},

                We've received a request to reset the password for your account.
                Below is your unique reset code. Please copy and paste it into the designated field on the password reset page:
                Reset Code: ${token} 
                This token only valid for 10 minutes
                If you did not request this password reset, please disregard this email. Your account security is important to us, and we recommend contacting our support team immediately if you suspect any unauthorized activity.
                
                `
            }
            transporter.sendMail(message, (err, info) => {
                if (err) {
                    return res.status(400).send("Somthing went wrong, try again")
                }
                return res.status(200).send(`Email sent to reset your password ${info.response}`)

            })
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

async function resetPasswordConfirm(req, res) {
    try {
        const { token } = req.params;
        const { password } = req.body;
        const user = await model.findOne({
            resetPasswordToken: token,
            tokenExpires: { $gt: Date.now() }
        })
        if(!user){
            return res.status(400).json({"message":"Invalid or Expired Token"})
        }

        const hashedPassword  = await bcrypt.hash(password,10);
        user.password = hashedPassword;
        user.resetPasswordToken = null;
        user.tokenExpires = null;
        await user.save()

        res.json({"message":"Password reset successfully"})
    }
    catch (err) {
        res.status(500).send('Internal Server Error')
        console.error(err.message)
    }
}

const verifyToken = async(req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
       return res.status(401).json({ "message": "missing token" })
    }

    const token = authHeader.split(" ")[1];

    jsonwebtoken.verify(token, process.env.SECRET_KEY,async (err,decode)=>{
        if(err){
            return res.status(403).json({"message":"Invalid Token"})
        }
        console.log("decoded :",decode);
        const user = await model.findById(decode.id)

        if(!user){
           return res.status(404).json({"message":"user not found"})
        }

        return res.status(200).json({"message":"Token is valid"})
    })
}

async function sendMail(req,res) {
    try {
        const { email,content } = req.body
        
         const result = await mail.create({ "email":content,"to":email })
         const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASSWORD
            }
        })
        const message = {
            from: process.env.MAIL_USER,
            to: email,
            subject: "Sample Mail",
            html: content
        }
        transporter.sendMail(message, (err, info) => {
            if (err) {
                return res.status(400).send("Somthing went wrong, try again")
            }
            return res.ststus(200).json({ "success": "mail sent" })

        })
           
        
    }
    catch (err) {
        console.error(err.message)
       return res.status(500).send('Internal Server Error')
        
    }
}

async function chatgpt(req,res){
    try{

    const {prompt} = req.body;
    const result = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-3.5-turbo',
    })
    const resultString = JSON.stringify(result)
    const message = result.choices[0].message.content
    await gpt.create({prompt,"result":resultString,message})
    
    return res.send(message)
}
catch(err){
    console.error(err.message)
    return res.status(500).send('Internal Server Error')
   
}
}

export default {
    createUser,
    authenticate,
    resetPassword,
    tokenUser,
    resetPasswordConfirm,
    verifyToken,
    sendMail,
    chatgpt
}