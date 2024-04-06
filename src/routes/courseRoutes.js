const express = require('express')
const router = express.Router()
const authenticate = require('../middlewares/authenticate.js')
const courseController = require('../controllers/courseController.js') 
const upload = require('../middlewares/multer')

// get courses...
router.get('/', courseController.getAllCourses)
router.get('/:id', courseController.getCourseById)
router.get('/users-courses/find', courseController.getCoursesByUser)
router.get('/search/:query', courseController.getCoursesByQuery)  

// update user course relationship...
router.post('/enroll/:id', courseController.enrollUser)
router.put('/review/:id', courseController.addCourseReview)

// Admin Routes... 
router.post('/admin/create',authenticate, courseController.createCourse )

router.put('/admin/:id', authenticate, courseController.updateCourse)

router.put('/admin/upload-img/:id', authenticate, upload.single('image'), courseController.uploadImg)

router.delete('/admin/:id', authenticate, courseController.deleteCourse)

module.exports = router