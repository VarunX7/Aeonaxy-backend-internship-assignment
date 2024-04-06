const courseServices = require('../services/courseServices')
const jwtProvider = require('../configs/jwtProvider')
const Upload = require('../configs/cloudinary')

// Get Courses...

const getAllCourses = async (req, res) =>{
    try {
        
        const courses = await courseServices.getAllCourses()
        return res.status(200).send(courses)

    } catch (error) {
        console.log("controller error")
        return res.status(500).send({error: error.message})
    }
}

const getCourseById = async (req, res) =>{
    try {
        
        const courseId = req.params.id
        const course = await courseServices.getCourseById(courseId) 
        return res.status(200).send(course)

    } catch (error) {   
        console.log("controller error")
        return res.status(500).send({error: error.message})
    }

}

const getCoursesByUser = async (req, res) =>{
    try {
        
        const token = req.headers.authorization?.split(" ")[1]
        if(!token) return res.status(400).send("Token not found")

        const userId = await jwtProvider.getUserIdByToken(token)

        const userCourses = await courseServices.getCoursesByUser(userId)
        return res.status(200).send(userCourses)

    } catch (error) {
        console.log("controller error")
        return res.status(500).send({error: error.message})
    }
}

const getCoursesByQuery = async (req, res) =>{
    try {
        
        const {page = 1, limit = 10, sortOrder = 'ASC', category, level, nameString, sortBy} = req.query 
        const courses = await courseServices.getCoursesByQuery(page, limit, category, level, nameString, sortBy, sortOrder)
        return res.status(200).send(courses)

    } catch (error) {    
        console.log("controller error")
        return res.status(500).send({error: error.message})
    }
}

const enrollUser = async (req, res) =>{
    try {
        const courseId = req.params.id

        const token = req.headers.authorization?.split(" ")[1]
        if(!token) return res.status(400).send("Token not found")
        
        const userId = await jwtProvider.getUserIdByToken(token)

        const newUserCourse = await courseServices.enrollUser(userId, courseId)
        return res.status(200).send(newUserCourse)

    } catch (error) {
        console.log("controller error")
        return res.status(500).send({error: error.message})
    }
}

const addCourseReview = async (req, res) =>{
    try {
        const {review, rating} = req.body
        const courseId = req.params.id

        const token = req.headers.authorization?.split(" ")[1]
        if(!token) return res.status(400).send("Token not found")

        const userId = await jwtProvider.getUserIdByToken(token)

        const addedReview = await courseServices.addCourseReview(userId, courseId, review, rating)
        return res.status(200).send(addedReview)

    } catch (error) {
        console.log("controller error")
        return res.status(500).send({error: error.message})
    }
}

// Admin CRUD Ops...
const createCourse = async (req, res) =>{
    try {
        
        if(req.user.is_admin === true){
            
            const course = await courseServices.createCourse(req.body)
            return res.status(200).send(course)
        }
        else{
            throw new Error("You are not authorised to create a course")
        }

    } catch (error) {
        console.log("controller error")
        return res.status(500).send({error: error.message})
    }
}

const updateCourse = async (req, res) =>{
    try {
        
        const courseId = req.params.id
        const course = await courseServices.updateCourse(courseId, req.body)
        return res.status(200).send(course)

    } catch (error) {
        console.log("controller error")
        return res.status(500).send({error: error.message})
    }
}

const uploadImg = async (req, res) =>{
    try {
        
        const courseId = req.params.id
        
        // get image url..
        const uploadedFile = await Upload.uploadFile(req.file.path)
        const courseImg = { img: uploadedFile.secure_url }

        const course = await courseServices.updateCourse(courseId, courseImg)
        return res.status(200).send(course)

    } catch (error) {
        console.log("controller error")
        return res.status(500).send({error: error.message})
    }
}

const deleteCourse = async (req, res) =>{
    try {
        
        const courseId = req.params.id
        const delCourse = await courseServices.deleteCourse(courseId)
        return res.status(200).send(delCourse)

    } catch (error) {
        console.log("controller error")
        return res.status(500).send({error: error.message})
    }
}

module.exports = {getAllCourses, getCourseById, getCoursesByUser, getCoursesByQuery, enrollUser, addCourseReview, createCourse, updateCourse, uploadImg, deleteCourse}