import jsonwebtoken from 'jsonwebtoken'

const generateToken = (user) => {
    return jsonwebtoken.sign(
        {
            "id": user.id
        },
        process.env.SECRET_KEY,
        {
            "expiresIn": "2m"
        }
    )
}

export default {
    generateToken
}
