import jsonwebtoken from 'jsonwebtoken'

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
  

export default {
    generateToken,
    validateEmail
}
