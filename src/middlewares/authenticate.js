const jwtProvider = require('../configs/jwtProvider')
const userServices = require('../services/userServices')

const authenticate = async (req, res, next) =>{
    try {

        const token = req.headers.authorization?.split(" ")[1]
        if(!token) return res.status(400).send("Token not found")

        const user = await userServices.getUserByToken(token)
        req.user = user

    } catch (error) {
        return res.status(500).send({error: error.message})
    }

    next()
}

module.exports = authenticate