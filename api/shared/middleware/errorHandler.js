const  ApiError = require('../utils/ApiError')
const {HTTP_STATUS} = require('../utils/httpStatus')

const errorHandler = (err, req, res, next) => {
    console.error('___________ НАЙДЕНА ОШИБКА ___________')
    console.error(`ОШИБКА: [${new Date().toISOString()}]`)
    console.error(`МЕСТО ПОЛОЖЕНИЕ: ${req.method} ${req.originalUrl}`)
    console.error(`${err.message}`)
    if (process.env.NODE_ENV === 'development') {
        console.error(`ИНФОРМАЦИЯ: ${err.stack}`)
    }
    console.error('_______________________________________')

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(err.errors && {errors: err.errors}),
            ...(process.env.NODE_ENV=== 'development' && {stack: err.stack}),
            timestamp: err.timestamp
        })
    }

    if (err.code === 'P2002') {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: 'Запись с такими данными уже существует',
            timestamp: new Date().toISOString(),
        })
    }

    if (err.code === 'P2025') {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: 'Запись не найдена',
            timestamp: new Date().toISOString(),
        })
    }

    if (err.name === 'ZodError') {
        const errors = (err.errors || err.issues).map(e => ({
            field: e.path.join('.'),
            message: e.message
        }))

        return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
            success:false,
            message: `Ошибка валидации`,
            errors,
            timestamp: new Date().toISOString()
        })
    }

    // Ошибка JWT
    if (err.name === 'JsonWebTokenError') {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Недействительный токен',
            timestamp: new Date().toDateString()
        })
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Токен истек',
            timestamp: new Date().toDateString()
        })
    }

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: process.env.NODE_ENV === 'development' ? err.message : 'Внутреняя ошибка сервера',
        ...(process.env.NODE_ENV === 'development' && {stack: err.stack}),
        timestamp: new Date().toDateString()
    })
}
module.exports = errorHandler;