const userServices = require('../services/userServices')
const jwtProvider = require('../configs/jwtProvider')
const Upload = require('../configs/cloudinary')

const getUser = async (req, res) =>{
    try {

        const token = req.headers.authorization?.split(" ")[1]
        if(!token) return res.status(400).send("Token not found")
        
        const user = await userServices.getUserByToken(token)
        return res.status(200).send(user)

    } catch (error) {
        console.log("Controller Error")
        return res.status(500).send({error: error.message})
    }
}

const updateUser = async (req, res) =>{
    try {
        
        const token = req.headers.authorization?.split(" ")[1]
        if(!token) return res.status(400).send("Token not found")
        
        const userId = await jwtProvider.getUserIdByToken(token)

        const updatedUser = await userServices.updateUser(userId, req.body)
        return res.status(200).send(updatedUser)

    } catch (error) {
        console.log("Controller Error")
        return res.status(500).send({error: error.message})
    }
}

const uploadProfilePic = async (req, res) =>{
    try {
        
        const token = req.headers.authorization?.split(" ")[1]
        if(!token) return res.status(400).send("Token not found")
        
        const userId = await jwtProvider.getUserIdByToken(token)

        const uploadedFile = await Upload.uploadFile(req.file.path)
        const profilePic = { img: uploadedFile.secure_url }

        const updatedUser = await userServices.updateUser(userId, profilePic)
        return res.status(200).send(updatedUser)
        
    } catch (error) {
        console.log("Controller Error")
        return res.status(500).send({error: error.message})
    }
}
// Change Password request...
/*
  ->> Making the change password request hits the 'api/users/send-password-req' endpoint which triggers the sendPasswordRequest function in the userController as well as the userServices.
  ->> The user's token (which contains their user id) will then be sent to the user via email.
  ->> When the user clicks on the button which contains the link to the frontend url it should then take them to the page where they type in their new password.
  ->> After inputing the new password and hitting save they will hit the 'api/users/reset-password' endpoint in our backend.
  ->> This will trigger the setNewPassword functions which would verify their token and use it to get the user's id which would then be used to find them in the database table change their password  
*/
const sendPasswordRequest = async (req, res) =>{
    try {

        const token = req.headers.authorization?.split(" ")[1]
        if(!token) return res.status(400).send("Token not found")

        const userId = await jwtProvider.getUserIdByToken(token)

        const result = await userServices.sendPasswordRequest(userId, token)
        return res.status(200).send(result)
        
    } catch (error) {
        console.log("Controller Error")
        return res.status(500).send({error: error.message})
    }
}

const setNewPassword = async (req, res) =>{
    try {
        
        const newPassword = req.body.password

        const token = req.headers.authorization?.split(" ")[1]
        if(!token) return res.status(400).send("Token not found")

        const userId = await jwtProvider.getUserIdByToken(token)

        const user = await userServices.setNewPassword(userId, newPassword)
        return res.status(200).send(user)

    } catch (error) {
        console.log("Controller Error")
        return res.status(500).send({error: error.message})
    }
}

// Admin route...
const getAllUsers = async (req, res)=>{
    try {
        
        if(req.user.is_admin === true){
            const allUsers = await userServices.getAllUsers()
            return res.status(200).send(allUsers)
        }
        else {
            throw new Error("You are not authorised to view all users' information")
        }
    } catch (error) {
        console.log("Controller Error")
        return res.status(500).send({error: error.message})
    }
}


module.exports = {getUser, getAllUsers, updateUser, uploadProfilePic, sendPasswordRequest, setNewPassword}