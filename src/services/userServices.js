const bcrypt = require('bcrypt')
const { v4: uuidv4 } = require('uuid');
const jwtProvider = require('../configs/jwtProvider.js')
const pool = require('../configs/db.js')
const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND);

// Auth Services...
const createUser = async(userData)=>{

    let {name, email, password} = userData
    const id = uuidv4()

    try {

        const userExists = await pool.query(`SELECT * FROM users WHERE email = $1`, [email])
        if(userExists.rows.length > 0) {
            throw new Error("user already exists with this email")
        }
        else{
            password = await bcrypt.hash(password, 8)
            const user = await pool.query(`INSERT INTO users (id, name, email, password) VALUES ($1, $2, $3, $4) RETURNING *`, [id, name, email, password])
            return user.rows[0]
        }
    } catch(error) {
        console.log("service Error")
        throw new Error(error.message)
    }
}

const getUserByEmail = async(email) =>{
    try {
        
        const user = await pool.query(`SELECT * FROM users WHERE email = $1`, [email])
        if(user.rows.length === 0) throw new Error("No user exists with email ", email)
        else return user.rows

    } catch (error) {
        console.log("service Error")
        throw new Error(error.message)
    }
}

// User profile services...
const getUserByToken = async(token) =>{
    try {
     
        const userId = jwtProvider.getUserIdByToken(token)
        const user = await pool.query(`
            SELECT u.id AS user_id, u.name AS user_name, u.email, u.img, u.is_admin,
            json_agg(json_build_object(
                'course_id', uc.course_id,
                'enrolled_on', uc.enrolled_on,
                'progress', uc.progress,
                'course_title', c.title,   
                'instructor', c.instructor,  
                'category', c.category,  
                'level', c.level,        
                'ratings', c.ratings   
            )) AS enrolled_courses
            FROM users u
            LEFT JOIN user_courses uc ON u.id = uc.user_id
            LEFT JOIN courses c ON uc.course_id = c.id  -- Join with courses table
            WHERE u.id = $1
            GROUP BY u.id, u.name, u.email, u.img, u.is_admin
            ORDER BY u.name;`, [userId]
        )
        return user.rows[0]

    } catch (error) {
        console.log("service Error")
        throw new Error(error.message)   
    }
}   

const updateUser = async(userId, userInfo) =>{
    try {

        let user = await pool.query(`SELECT * FROM users WHERE id = $1`, [userId])
        user = user.rows[0]       
        user = {...user, ...userInfo}
        
        const updatedUser = await pool.query(`
            UPDATE users SET name = $1, email = $2, img = $3, is_admin = $4 WHERE id = $5 RETURNING *`, 
            [user.name, user.email, user.img, user.is_admin, user.id] // not updating the password here even if it is sent 
        )
        return updatedUser.rows[0]

    } catch (error) {
        console.log("service Error")
        throw new Error(error.message)
    }
}

// Change Password request...
/*
  -> Making the change password request hits the 'api/users/send-password-req' endpoint which triggers the sendPasswordRequest function in the userController as well as the userServices.
  -> The user's token (which contains their user id) will then be sent to the user via email.
  -> When the user clicks on the button which contains the link to the frontend url it should then take them to the page where they type in their new password.
  -> After inputing the new password and hitting save they will hit the 'api/users/reset-password' endpoint in our backend.
  -> This will trigger the setNewPassword functions which would verify their token and use it to get the user's id which would then be used to find them in the database table change their password  
*/
const sendPasswordRequest = async(userId, token) =>{
    try {
        
        let userEmail = await pool.query(`SELECT email FROM users WHERE id = $1`, [userId])
        userEmail = userEmail.rows[0].email

        const { data, error } = await resend.emails.send({
            from: 'Varun Parihar <onboarding@resend.dev>',
            to: [`${userEmail}`],
            subject: 'Reset Password Request',
            html: `<style>
                    body{
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                }

                div{
                  border: 2px solid black;
                  border-radius: 5px;
                  padding: 20px;
                }

                button{
                  width: 100%;
                  height: 50px;
                  background-color: blue;
                  margin: auto;
                }

                a{
                  color: white;
                  text-decoration: none;
                }
                </style>
                <body>
                    <h1>Reset Password Request</h1>
                    <h3>It seems you have made request to reset your password. If this isn't you just ignore this email</h3>
                    <div>
                      <h4>Click the button below to reset your password</h4>
                      <button><a href="http://frontend-url/reset-password/${token}">Reset my password</a></button>
                    </div>      
                </body>`,
          })

          console.log(data, error)
          if(error) throw new Error(error.message)
          else return data

    } catch (error) {
        console.log("service Error")
        throw new Error(error.message)
    }
}

const setNewPassword = async (userId, password) =>{
    try {
        
        password = await bcrypt.hash(password, 8)
        const user = await pool.query(`UPDATE users SET password = $1 where id = $2 RETURNING *`, [password, userId])

        const { data, error } = await resend.emails.send({
            from: 'Varun Parihar <onboarding@resend.dev>',
            to: [`${user.rows[0].email}`],
            subject: 'Password change successfully',
            html: `<h3>Hello, Your password was succesfully reset</h3>`,
          })
        
        if(error) throw new Error(error.message)
        else return {user: user.rows[0], resendMailId: data}

    } catch (error) {
        console.log("service Error", error.message)
        throw new Error(error.message)
    }
}

// Admin services...
const getAllUsers = async() =>{
    try {
        
        const users = await pool.query(`
            SELECT u.id AS user_id, u.name AS user_name, u.email, u.img, u.is_admin,
            json_agg(json_build_object(
                'course_id', uc.course_id,
                'enrolled_on', uc.enrolled_on,
                'progress', uc.progress,
                'course_title', c.title,   
                'instructor', c.instructor,  
                'category', c.category,  
                'level', c.level,        
                'ratings', c.ratings   
            )) AS enrolled_courses
            FROM users u
            LEFT JOIN user_courses uc ON u.id = uc.user_id
            LEFT JOIN courses c ON uc.course_id = c.id  -- Join with courses table
            GROUP BY u.id, u.name, u.email, u.img, u.is_admin
            ORDER BY u.name;
       `)
        return users.rows

    } catch (error) {
        console.log("service Error")
        throw new Error(error.message)
    }
}

module.exports = {createUser, getUserByEmail, getUserByToken, updateUser, sendPasswordRequest, setNewPassword, getAllUsers}