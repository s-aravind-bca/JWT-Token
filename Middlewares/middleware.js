import jsonwebtoken from 'jsonwebtoken'
import userModel from '../Model/userModel.js';

//To Check The JWT Token is valid or not
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
       return res.status(401).send("missing token")
    }

    const token = authHeader.split(" ")[1];

    jsonwebtoken.verify(token, process.env.SECRET_KEY,async (err,decode)=>{
        if(err){
            return res.status(403).send("Session Expired, Login to Continue")
        }
        const user = await userModel.findById(decode.id)

        if(!user){
           return res.status(404).send("user not found")
        }

        req.user = user;
        next();
    })
}

//To Generate Token
async function authenticate(req, res) {
    try {
      const { email, password } = req.body;
      const user = await model.findOne({ email });
      if (user) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).json({ message: "Incorrect Password" });
        }
  
        const token = utils.generateToken(user);
        //console.log(token);
        res.json({ token });
      } else {
        res.status(400).send("user not found");
      }
    } catch (err) {
      res.status(500).send("Internal Server Error");
      console.error(err.message);
    }
  }
  
export default {
    verifyToken,
    authenticate
}