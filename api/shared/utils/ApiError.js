const { HTTP_STATUS, STATUS_MESSAGES } = require('./httpStatus');

class ApiError extends Error {
    constructor(statusCode, message, errors = null, isOperational = true) {
        super(message)

        this.statusCode = statusCode
        this.message = message;
        this.errors = errors;           // Массив ошибок валидации
        this.isOperational = isOperational; // true = ожидаемая ошибка, false = баг
        this.timestamp = new Date().toISOString();

        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message = 'Неверный запрос', errors = null) {
        return new ApiError(HTTP_STATUS.BAD_REQUEST, message, errors)
    }

    static unauthorized(message = 'Не авторизован') {
        return new ApiError(HTTP_STATUS.UNAUTHORIZED, message);
    }
    
    static forbidden(message = 'Доступ запрещён') {
        return new ApiError(HTTP_STATUS.FORBIDDEN, message);
    }
    
    static notFound(message = 'Ресурс не найден') {
        return new ApiError(HTTP_STATUS.NOT_FOUND, message);
    }
    
    static conflict(message = 'Конфликт данных') {
        return new ApiError(HTTP_STATUS.CONFLICT, message);
    }
    
    static validation(errors) {
        return new ApiError(
        HTTP_STATUS.UNPROCESSABLE_ENTITY, 
        'Ошибка валидации', 
        errors
        );
    }
    
    static internal(message = 'Внутренняя ошибка сервера') {
        return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, message, null, false);
    }
}

module.exports = ApiError

