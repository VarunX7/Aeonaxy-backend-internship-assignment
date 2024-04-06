const express = require('express')
const upload = require('../middlewares/multer')
const router = express.Router()
const authenticate = require('../middlewares/authenticate')
const userController = require('../controllers/userController')

router.get('/profile', userController.getUser)
router.put('/profile', userController.updateUser)
router.put('/profile/upload', upload.single('image'), userController.uploadProfilePic)

// change password
router.put('/send-password-req', userController.sendPasswordRequest)
router.put('/reset-password', userController.setNewPassword)

// Admin routes...
router.get('/all', authenticate, userController.getAllUsers)

module.exports = router