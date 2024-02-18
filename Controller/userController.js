import userModel from "../Model/userModel.js";
import mailModel from "../Model/mailModel.js";
import gptModel from "../Model/gptModel.js";
import utils from "../utils/utils.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY2,
});

async function signup(req,res){
  try {
    let {name, email, password } = req.body;
    if(email && password){
    if(!(utils.validateEmail(email))) return res.status(400).send("Invalid Email")
    const user = await userModel.findOne({ email });
    if (user) {
      return res.status(400).send("email already exist");
    } else {
      if (!name) {
        name = email.split("@")[0]
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await userModel.create({name, email, password: hashedPassword });
      const token = utils.generateToken(result)
      return res.json({"message":"user created","token":token});
    }
  }else{
    res.status(404).send("No data given")
  }
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Internal Server Error");
   
  }
}

async function login(req,res){
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).send("Incorrect Password");
      }
      const token = utils.generateToken(user);
      //console.log(token);
      res.json({"message":"logged in successfully", token });
    } else {
      res.status(400).send("user not found");
    }
  } catch (err) {
    res.status(500).send("Internal Server Error");
    console.error(err.message);
  }
}

async function resetPassword(req, res) {
  try {
    const { email } = req.body;
    if(!(email && utils.validateEmail(email))) return res.status(400).send("Invalid Email")
    const user = await userModel.findOne({ email });
    if (user) {
      const token = Math.random().toString(36).slice(-8);
      console.log(token);
      user.resetPasswordToken = token;
      user.tokenExpires = Date.now() + 600000;
      await user.save();
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD,
        },
      });
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
                `,
      };
      transporter.sendMail(message, (err, info) => {
        if (err) {
          return res.status(400).send("Somthing went wrong, try again");
        }
        return res
          .status(200)
          .send(`Email sent to reset your password ${info.response}`);
      });
    } else {
      res.status(400).send("user not found");
    }
  } catch (err) {
    res.status(500).send("Internal Server Error");
    console.error(err.message);
  }
}

async function resetPasswordConfirm(req, res) {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const user = await userModel.findOne({
      resetPasswordToken: token,
      tokenExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid or Expired Token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.tokenExpires = null;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(500).send("Internal Server Error");
    console.error(err.message);
  }
}


async function sendMail(req, res) {
  try {
    const { email, subject, content } = req.body;

    if (email && content && subject) {
      if(!(utils.validateEmail(email))) return res.status(400).send("Invalid Email")
      
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD,
        },
      });
      const message = {
        from: process.env.MAIL_USER,
        to: email,
        subject: subject,
        html: content,
      };
      transporter.sendMail(message, async (err, info) => {
        if (err) {
          const result = await mailModel.create({
            email: content,
            to: email,
            sent: false,
          });
          return res.status(400).send("Somthing went wrong, try again");
        }
        const result = await mailModel.create({
          email: content,
          to: email,
          sent: true,
        });
        return res.status(400).send("Email Sent");
      });
    } else {
      return res.status(404).send("No data given");
    }
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Internal Server Error");
  }
}

async function chatgpt(req, res) {
  try {
    const { prompt } = req.body;
    if(!prompt) return res.status(404).send("No prompt given")

      const query = `Answer the question based on the context below or if no context, then answer based on the question.
      The response should be in HTML format.
      The response should preserve any HTML formatting, links, and styles in the context or Add yourself required formatting.
      
      Context: ${prompt.context}
      
      Question: ${prompt.query}
      `
     // console.log("Query = ",query);
    const result = await openai.chat.completions.create({
      messages: [{ role: "user", content: query }],
      model: "gpt-3.5-turbo",
    });
    const resultString = JSON.stringify(result);
    const message = result.choices[0].message.content;
    await gptModel.create({ "prompt":query, result: resultString, message });

    return res.send(message);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Internal Server Error");
  }
}

export default {
  resetPassword,
  resetPasswordConfirm,
  sendMail,
  chatgpt,
  signup,
  login
};
