const pool = require('../configs/db.js')
const { v4: uuidv4 } = require('uuid');
const { Resend } = require('resend')
require("dotenv").config();

const resend = new Resend(process.env.RESEND);

// Client Services...
const getAllCourses = async () =>{
    try {
        
        const courses = await pool.query(`SELECT * FROM courses`)
        return courses.rows

    } catch (error) {
        console.log("service Error")
        throw new Error(error.message)
    }
}

const getCourseById = async (courseId) =>{
    try {
        
        const course = await pool.query(`SELECT * FROM courses WHERE id = $1`, [courseId])
        const reviews = await pool.query(
            `SELECT u.name, uc.review, uc.ratings 
            FROM user_courses uc 
            JOIN users u ON uc.user_id = u.id 
            WHERE uc.course_id = $1`, 
            [courseId]
        )
        if(course.rows.length === 0) throw new Error('Invalid course Id')
        else return {course: course.rows, reviews: reviews.rows}

    } catch (error) {
        console.log("service Error")
        throw new Error(error.message)
    }
}

const getCoursesByUser = async (userId) =>{
    try {
        
        const courses = await pool.query(`
        SELECT c.title, c.img, c.instructor, c.level, c.category, uc.review, uc.ratings AS my_ratings, c.ratings AS average_ratings, uc.enrolled_on, uc.progress 
        FROM user_courses uc 
        JOIN courses c ON uc.course_id = c.id 
        WHERE uc.user_id = $1`, [userId])
        return courses.rows

    } catch (error) {
        console.log("service Error")
        throw new Error(error.message)
    }
}

const getCoursesByQuery = async (page, limit, category, level, nameString, sortBy, sortOrder) =>{
     try {
        
        const values = []
        let query = `SELECT * FROM courses WHERE 1=1 `
        
        if(nameString){
            query += `AND title LIKE $${values.length + 1} `
            values.push('%'+nameString+"%") 
        }

        if(level){
            query += `AND level = $${values.length +1} `
            values.push(level)
        }

        if(category){ 
            query += `AND category = $${values.length + 1} `
            values.push(category)
        }

        if(sortBy){
            query += `ORDER BY ${sortBy} ${sortOrder} `
        }   

        const offset = (page - 1) * limit
        query += `OFFSET $${values.length + 1} LIMIT $${values.length + 2}` 
        values.push(offset, limit)

        const courses = await pool.query(query, values)
        return courses.rows

     } catch (error) {
        console.log("service Error")
        throw new Error(error.message)
     }
}

const enrollUser = async (userId, courseId) =>{
    try {
        
        let userCourse = await pool.query(`INSERT INTO user_courses (course_id, user_id) VALUES ($1, $2) RETURNING *`, [courseId, userId])
        userCourse = userCourse.rows[0]

        let course = await pool.query(`SELECT title FROM courses WHERE id = $1`, [courseId])
        course = course.rows[0]

        let userEmail = await pool.query(`SELECT email FROM users WHERE id = $1`, [userId])
        userEmail = userEmail.rows[0].email

        const { data, error } = await resend.emails.send({
            from: 'Varun Parihar <onboarding@resend.dev>',
            to: [`${userEmail}`],
            subject: 'Enrollment confirmation',
            html: `Hello, You have successfully enrolled in course <strong>${course.title}</strong> on ${userCourse.enrolled_on}`,
          })

        if(error) throw new Error(error.message)
        return userCourse

    } catch (error) {
        console.log("service Error")
        throw new Error(error.message)    
    }
}

const addCourseReview = async (userId, courseId, review, rating) =>{
    try {
        
        const updatedCourseReview = await pool.query(
            `UPDATE user_courses SET review = $1, ratings = $2 WHERE user_id = $3 AND course_id = $4 RETURNING *`,
            [review, rating, userId, courseId]
        )
        let avgRating = await pool.query(`SELECT AVG(ratings) FROM user_courses WHERE course_id = $1`, [courseId])
        avgRating = avgRating.rows[0]
        avgRating = avgRating.avg 

        const updateCourseRating = await pool.query(`UPDATE courses SET ratings = $1 WHERE id = $2 RETURNING *`, [avgRating, courseId])
        return {user_courses: updatedCourseReview.rows, courses: updateCourseRating.rows}

    } catch (error) {
        console.log("service Error", error.message)
        throw new Error(error.message)        
    }
}

// Admin Services...
const createCourse = async (courseInfo) =>{

    const {title, instructor, category, level, price, img} = courseInfo
    const id = uuidv4()

    try {
        
        const newCourse = await pool.query(
            `INSERT INTO courses (id, title, instructor, category, level, price, img) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [id, title, instructor, category, level, price, img]
        )
        return newCourse.rows[0]

    } catch (error) {
        console.log("service Error")
        throw new Error(error.message)
    }
}

const updateCourse = async (courseId, courseInfo) =>{
    try {

        let course = await pool.query(`SELECT * FROM courses WHERE id = $1`, [courseId])
        course = course.rows[0]
        course = {...course, ...courseInfo}
        
        const updatedCourse = await pool.query(
            `UPDATE courses SET title = $1, instructor = $2, category = $3, level = $4, price = $5, img = $6 WHERE id = $7 RETURNING * `,
            [course.title, course.instructor, course.category, course.level, course.price, course.img, courseId]
        )
        return updatedCourse.rows[0]
    } catch (error) {
        console.log("service Error")
        throw new Error(error.message)
    }
}

const deleteCourse = async (courseId) =>{
    try {
        
        const deletedFromUserCourses = await pool.query(`DELETE FROM user_courses WHERE course_id = $1 RETURNING *`, [courseId])
        // console.log(deletedFromUserCourses.rows)
        const detetedCourse = await pool.query(`DELETE FROM courses WHERE id = $1 RETURNING *`, [courseId])

        return (detetedCourse.rows[0])

    } catch (error) {
        console.log("service Error")
        throw new Error(error.message)
    }
}

module.exports = { getAllCourses, getCourseById, getCoursesByUser, getCoursesByQuery, enrollUser, addCourseReview, createCourse, updateCourse, deleteCourse }