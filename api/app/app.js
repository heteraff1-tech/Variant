const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const path = require('path')

const errorHandler = require('../shared/middleware/errorHandler')
const requestLogger = require('../shared/middleware/requestLogger')

const authRouter = require('../features/auth/auth.router')
const teacherRouter = require('../features/teacher/teacher.routes')
const gradesRouter = require('../features/teacher/grades/grades.router')
const testsRouter = require('../features/teacher/tests/tests.router')
const adminRoutes = require('../features/admin/admin.routes');
const studentRouter = require('../features/student/student.routes');

const app = express()

app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type' , 'Authorization']
}))

//Парсинг
app.use(express.json({limit: '10mb'}))
app.use(express.urlencoded({extended: true}))

//Статические файлы
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')))

// Logging (development)
if (process.env.NODE_ENV === 'development') {
  app.use(requestLogger);
}

//Лимит токена
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: {success: false, message: 'Слишком много запросов'}
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // TODO: уменьшить до 10 в продакшене
  message: { success: false, message: 'Слишком много попыток входа' },
})

//роутер
app.use('/api/auth', authLimiter, authRouter)
app.use('/api/teacher',apiLimiter, teacherRouter)
app.use('/api/teacher', apiLimiter, gradesRouter);
app.use('/api/teacher', apiLimiter, testsRouter);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/student', apiLimiter, studentRouter);
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API работает',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toDateString(),
    })
})

app.use('{*path}', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Марширут ${req.originalUrl} не найден`
    })
})

app.use(errorHandler)
module.exports = app