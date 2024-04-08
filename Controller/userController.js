import userModel from "../Model/userModel.js";
import mailModel from "../Model/mailModel.js";
import gptModel from "../Model/gptModel.js";
import historyModel from "../Model/historyModel.js";
import taskGroupModel from "../Model/taskGroupModel.js";
import utils from "../utils/utils.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import OpenAI from "openai";
import middleware from "../Middlewares/middleware.js";
import validateAsymmetricKey from "jsonwebtoken/lib/validateAsymmetricKey.js";

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
    if(!(email && password)) return res.status(404).send("Missing values")
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
      //const token = Math.random().toString(36).slice(-8);
      const token = Math.floor(Math.random() * 9000) + 1000;
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
        text: `Dear ${user.email},\n\nWe've received a request to reset the password for your account.\nBelow is your unique reset code. Please copy and paste it into the designated field on the password reset page:\nReset Code: ${token} \nThis token only valid for 10 minutes\n\nIf you did not request this password reset, please disregard this email. Your account security is important to us, and we recommend contacting our support team immediately if you suspect any unauthorized activity.`,
      };
      transporter.sendMail(message, (err, info) => {
        if (err) {
          return res.status(400).send("Somthing went wrong, try again");
        }
        return res
          .status(200)
          .send(`Email sent to reset your password`);
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
    const { otp } = req.params;
    const { email } = req.body;
    const value = +otp
    console.log(value);
    if(!(value && email)) return res.status(400).send("Invalid data");
    //const { password } = req.body;
    const user = await userModel.findOne({
      email: email,
      resetPasswordToken: value,
      tokenExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).send("Invalid OTP");
    }

    const resetToken = utils.generateToken(user)

    /* const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.tokenExpires = null;
    await user.save(); */

    res.json({"message":"OTP verified successfully",resetToken});
  } catch (err) {
    res.status(500).send("Internal Server Error");
    console.error(err.message);
  }
}

async function newPassword(req, res) {
  try {
    const { password } = req.body;
    const user = req.user;

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.tokenExpires = null;
    await user.save(); 

    res.send("Password changed successfully");
  } catch (err) {
    res.status(500).send("Internal Server Error");
    console.error(err.message);
  }
}


async function sendMail(req, res) {
  const { email, subject, content, attachments, attachName} = req.body;
  try {
    console.log(`Mail Request : ${req.user}`);
    if (email && content && subject) {
      if(email.length <= 0) return res.status(400).send("No Email Specified")
      if(email.some(e=>!(utils.validateEmail(e)))) return res.status(400).send("Invalid Email Detected")
      if(attachments) var attachment = Buffer.from(attachments,'base64')
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD,
        },
      });
      //Ans
      const message = {
        from: process.env.MAIL_USER,
        to: email,
        subject: subject,
        html: content,
      };
      if(attachment){
        message.attachments = [
          {
            filename: attachName,
            content: attachment
          }
        ]
      }
      transporter.sendMail(message, async (err, info) => {
        if (err) {
          const result = await mailModel.create({
            user: req.user.id,
            email: content,
            to: email,
            sent: false,
          });
          const history = await historyModel.create({
            user: req.user.id,
            window: "Mail Sender",
            action: `Sent ${email.length === 1 ? "a mail" : "Bulk Mail"} \nReceiptents: ${email.join(", ")} .`,
            status: "Failed",
            time: Date.now()
          })
          return res.status(400).send("Somthing went wrong, try again");
        }
        const result = await mailModel.create({
          user: req.user.id,
          email: content,
          to: email,
          sent: true,
        });
        const history = await historyModel.create({
          user: req.user.id,
          window: "Mail Sender",
          action: `Sent ${email.length === 1 ? "a mail" : "Bulk Mail"} \nReceiptents: ${email.join(", ")} .`,
          status: "Success",
          time: Date.now()
        })
        return res.status(200).send("Email Sent");
      });
    } else {
      return res.status(404).send("Missing Required Data");
    }
  } catch (err) {
    console.error(err.message);
    const history = await historyModel.create({
      user: req.user.id,
      window: "Mail Sender",
      action: `Try to Sent ${email.length === 1 ? "a mail" : "Bulk Mail"} \nReceiptents: ${email.join(", ")} .`,
      status: "Failed. Internal server error accured.",
      time: Date.now()
    })
    return res.status(500).send("Internal Server Error");
  }
}

async function chatgpt(req, res) {
  const { prompt } = req.body;
  try {
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
    await gptModel.create({ "prompt":query, result: resultString, message ,user: req.user.id,requestType:"query"});
    const history = await historyModel.create({
      user: req.user.id,
      window: "Mail Sender",
      action: `Asked "${prompt.query}" to AI and received result:\n${message}`,
      status: "Success",
      time: Date.now()
    })
    return res.send(message);
  } catch (err) {
    console.error(err.message);
    const history = await historyModel.create({
      user: req.user.id,
      window: "Mail Sender",
      action: `Asked "${prompt.query}" to AI`,
      status: "Failed. An Internal server error accured",
      time: Date.now()
    })
    return res.status(500).send("Internal Server Error");
  }
}

async function aicreator(req, res) {
  const { prompt, tone, format, length, language } = req.body;
  try {
    if(!prompt) return res.status(404).send("No prompt given")

      const query = `Answer the question.
      The response should be in ${tone? tone: "suitable"} tone and the response format should be as ${format? format: "suitable format"}.your response length must be ${length? length : "suitable for the question"} 
      The response language is ${language}.
      Question: ${prompt}
      `
     // console.log("Query = ",query);
    const result = await openai.chat.completions.create({
      messages: [{ role: "user", content: query }],
      model: "gpt-3.5-turbo",
    });
    const resultString = JSON.stringify(result);
    const message = result.choices[0].message.content;
    await gptModel.create({ "prompt":query, result: resultString, message ,user: req.user.id,requestType:"query"});
    const history = await historyModel.create({
      user: req.user.id,
      window: "AI Creator",
      action: `Asked "${prompt}" to AI and received result:\n${message}`,
      status: "Success",
      time: Date.now()
    })
    return res.send(message);
  } catch (err) {
    console.error(err.message);
    const history = await historyModel.create({
      user: req.user.id,
      window: "AI Creator",
      action: `Asked "${prompt}" to AI `,
      status: "Failed.Internal server error accured",
      time: Date.now()
    })
    return res.status(500).send("Internal Server Error");
  }
}


async function translate(req, res) {
  const { from, to, text } = req.body;
  try {
    if(!(from && to && text)) return res.status(404).send("All values required")

      const query = `Translate the given text from ${from} to ${to}. Only reply the translated text.   
      Text: ${text}`
     // console.log("Query = ",query);
    const result = await openai.chat.completions.create({
      messages: [{ role: "user", content: query }],
      model: "gpt-3.5-turbo",
    });
    const resultString = JSON.stringify(result);
    const message = result.choices[0].message.content;
    await gptModel.create({ "prompt":query, result: resultString, message,user: req.user.id,requestType:"translate" });
    const history = await historyModel.create({
      user: req.user.id,
      window: "Translate",
      action: `Translate from ${from} language to ${to} language for the text:\n${text}\n Received result:\n${message}`,
      status: "Success",
      time: Date.now()
    })
    return res.send(message);
  } catch (err) {
    console.error(err.message);
    const history = await historyModel.create({
      user: req.user.id,
      window: "Translate",
      action: `Translate from ${from} language to ${to} language for the text:\n${text}`,
      status: "Failed.Internal server error accured",
      time: Date.now()
    })
    return res.status(500).send("Internal Server Error");
  }
}


async function createGroup(req, res) {
    const { name } = req.body;
  try {
    if(!name) return res.status(404).send("Name is required")
    const isExists = await taskGroupModel.find({groupName: name})
    if(isExists.length > 0 ) return res.status(400).send("Taskgroup already exists")
    await taskGroupModel.create({ user: req.user.id, groupName: name });
    const history = await historyModel.create({
      user: req.user.id,
      window: "Task Groups",
      action: `Created Task Group named "${name}"`,
      status: "Success",
      time: Date.now()
    })
    return res.send("Task Group Created Successfully");
  } catch (err) {
    console.error(err.message);
    const history = await historyModel.create({
      user: req.user.id,
      window: "Task Groups",
      action: `Try to create Task Group named "${name}"`,
      status: "Failed.Internal server error accured",
      time: Date.now()
    })
    return res.status(500).send("Internal Server Error");
  }
}

async function getGroup(req, res) {
  try {
    const result = await taskGroupModel.find({ user: req.user.id});
    return res.send(result.reverse());
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Internal Server Error");
  }
}

async function getTasks(req, res) {
  try {
    const {id} = req.params
    const result = await taskGroupModel.findById(id);
    if(!result) res.status(404).send("Task Group Not Found")
    return res.json({tasks:result.tasks.reverse(), groupName: result.groupName});
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Internal Server Error");
  }
}

async function createTask(req, res) {
    const { groupName, name, emails } = req.body; 
   try {
    if(!(groupName && name && emails.length > 0)) return res.status(404).send("All fields required")
    const group = await taskGroupModel.findOne({user: req.user.id ,groupName})
    if(!group) return res.status(404).send("Group Not Found")
    const taskExists = group.tasks.some(task => task.name === name);
    if(taskExists) return res.status(400).send("Task already exists")
    group.tasks.push({name, emails})
    await group.save()
    const history = await historyModel.create({
      user: req.user.id,
      window: "Task Groups",
      action: `Created Task named "${name}" under Group "${groupName} with Emails:\n${emails.join(", ")}"`,
      status: "Success",
      time: Date.now()
    })
    return res.send("Task Created Successfully");
  } catch (err) {
    console.error(err.message);
    const history = await historyModel.create({
      user: req.user.id,
      window: "Task Groups",
      action: `Try to Create Task named "${name}" under Group "${groupName} with Emails:\n${emails.join(", ")}"`,
      status: "Failed.Internal Server Error accured",
      time: Date.now()
    })
    return res.status(500).send("Internal Server Error");
  }
}

async function verifyToken(req,res) {
    const token = req.headers.authorization
    if(!token) return res.status(404).send("Missing Token")
    const check = await utils.verifyToken(token)
    if(check.valid) return res.send(check.message)
    return res.status(403).send(check.message)
}

async function userHistory(req,res){
  try {
    const history = await historyModel.find({user:req.user.id},{_id:0,window:1,action:1,status:1,time:1})
    res.send(history.reverse())
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Internal Server Error");
  }
    
}

async function deleteSingleHistory(req,res){
  try {
    const { id } = req.params
    const history = await historyModel.findOneAndDelete({user:req.user.id,_id:id})
    res.send("history deleted successfully")
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Internal Server Error");
  }
    
}

export default {
  getTasks,
  getGroup,
  createTask,
  createGroup,
  resetPassword,
  resetPasswordConfirm,
  sendMail,
  chatgpt,
  aicreator,
  signup,
  login,
  translate,
  newPassword,
  verifyToken,
  userHistory,
  deleteSingleHistory
};
