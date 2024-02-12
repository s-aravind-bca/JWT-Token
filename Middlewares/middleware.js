import jsonwebtoken from 'jsonwebtoken'
import userModel from '../Model/userModel.js';

const verifyToken = (req, res, next) => {
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
        const user = await userModel.findById(decode.id)

        if(!user){
           return res.status(404).json({"message":"user not found"})
        }

        req.user = user;
        next();
    })
}

export default {
    verifyToken
}