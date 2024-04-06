const bcrypt = require('bcrypt')
const userServices = require('../services/userServices')
const jwtProvider = require('../configs/jwtProvider')

const signup = async(req, res) =>{
    try {

        const user = await userServices.createUser(req.body)

        const jwt = jwtProvider.generateToken(user.id)
        return res.status(200).send({user, jwt})

    } catch (error) {
        return res.status(500).send({error: error.message})
    }
}

const login = async(req, res) =>{
    try {
        
        const userArr = await userServices.getUserByEmail(req.body.email)
        const user = userArr[0]

        const passwordMatch = await bcrypt.compare(req.body.password, user.password)
        if(!passwordMatch) return res.send("Invalid credentials")
        
        const jwt = jwtProvider.generateToken(user.id)
        return res.status(200).send({user, jwt})

    } catch (error) {
        console.log(error.message)
        return res.status(500).send({error: error.message})
    }
}

module.exports = {login, signup}