import userModel from "../Model/userModel.js";

async function createUser(req, res) {
    try {
      let {name, email, password } = req.body;
      const user = await userModel.findOne({ email });
      if (user) {
        return res.status(400).send("email already exist");
      } else {
        if (!name) {
          name = email.split("@")[0]
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await userModel.create({name, email, password: hashedPassword });
        return res.send("user created" );
      }
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Internal Server Error");
     
    }
  }
  
  
  async function allUser(req,res){
    try{
      const allUsers = await userModel.find()
      return res.send(allUsers)
    }catch(err){
      console.log(err.message);
      return res.status(500).send("Internal Server Error")
    }
  }
  
  async function getUser(req,res) {
    try{
    const id = req.params.id
    const user = await userModel.findById(id)
    return res.send(user)
    }catch(err){
      console.log(err.message);
      return res.status(500).send("Internal Server Error")
    }
  }
  
  async function editUser(req,res) {
    try{
    const { id, name, email, password } = req.body
    const user = await userModel.findById(id)
    if(name) user.name = name 
    if(email) user.email = email
    if(password) user.password = await bcrypt.hash(password,10)
    await user.save()
    return res.send(user)
    }catch(err){
      console.log(err.message);
      return res.status(500).send("Internal Server Error")
    }
  }
  
  async function deleteUser(req,res) {
    try{
    const id = req.params.id
    await userModel.findByIdAndDelete(id)
    return res.send("User Deleted Successfully")
    }catch(err){
      console.log(err.message);
      return res.status(500).send("Internal Server Error")
    }
  }
  
  
  export default {
    createUser,
    allUser,
    getUser,
    editUser,
    deleteUser
  }