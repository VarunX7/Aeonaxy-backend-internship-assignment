const jwt = require('jsonwebtoken')

const generateToken = (userId) =>{
    const token = jwt.sign({userId}, process.env.JWT_SECRET, { expiresIn: '7d' })
    return token
}

const getUserIdByToken = (token) =>{
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET)
    return decodedToken.userId
}

module.exports = {generateToken, getUserIdByToken}