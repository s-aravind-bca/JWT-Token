import jsonwebtoken from 'jsonwebtoken'
import userModel from '../Model/userModel.js'

const generateToken = (user) => {
    //console.log(user.id,"         ",user._id);
    return jsonwebtoken.sign(
        {
            "id": user.id
        },
        process.env.SECRET_KEY,
        {
            "expiresIn": "10m"
        }
    )
}

const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)*[a-zA-Z]{2,}))$/
      );
  };
  
  const verifyToken =async (tokenString) => {
    const token = tokenString.split(" ")[1];

    const result = jsonwebtoken.verify(token, process.env.SECRET_KEY,async (err,decode)=>{
        if(err){
            if(err.name === "TokenExpiredError") return {"valid":false,"message":"Session Expired"}
            else return {"valid":false,"message":"Invalid Access"}

        }
        const user = await userModel.findById(decode.id)

        if(!user){
           return {"valid":false,"message":"User Not Found"}
        }

        //console.log(user);
        return {"valid":true,"message":{"email":user.email}}
    })
    return result
}



export default {
    generateToken,
    validateEmail,
    verifyToken
}
