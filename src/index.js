const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
dotenv.config()

const app = express()

// middlewares...
app.use(express.json())
app.use(cors())

// Routes...
app.get('/', (req, res)=>{
    res.send('Welcome to backend')
})

const authRoutes = require('./routes/authRoutes')
app.use('/api/auth', authRoutes)

const courseRoutes = require('./routes/courseRoutes')
app.use('/api/courses', courseRoutes)

const userRoutes = require('./routes/userRoutes')
app.use('/api/user', userRoutes)


// Server starter...
const PORT = 4000
app.listen(PORT, ()=>{
    console.log(`Server started on http://localhost:${PORT}`)
})