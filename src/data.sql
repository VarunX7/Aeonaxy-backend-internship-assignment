-- Users table...
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    password VARCHAR(255),
    img VARCHAR(255),
    is_admin BOOLEAN DEFAULT FALSE
);

-- Courses table...
CREATE TABLE courses (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) UNIQUE,
    img: VARCHAR(255),
    instructor VARCHAR(255),
    date_created DATE DEFAULT CURRENT_DATE,
    category VARCHAR(255),
    level VARCHAR(20),
    ratings NUMERIC DEFAULT 0,
    price NUMERIC
);

-- Users and Courses Mapped...
CREATE TABLE user_courses (
    course_id VARCHAR(255) REFERENCES courses(id),
    user_id VARCHAR(255) REFERENCES users(id),
    enrolled_on DATE DEFAULT CURRENT_DATE,
    progress VARCHAR(100) DEFAULT '0%',
    review TEXT,
    ratings INTEGER CHECK (ratings >= 0 AND ratings <= 5) DEFAULT 0,
    PRIMARY KEY (user_id, course_id)
);

