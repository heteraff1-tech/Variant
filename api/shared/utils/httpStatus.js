const HTTP_STATUS = {
    // 2xx - Успех
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,

    // 4xx - Ошибки клиента
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,

    // 5xx - Ошибки сервера
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
};

const STATUS_MESSAGES = {
    [HTTP_STATUS.OK]: 'Успешно',
    [HTTP_STATUS.CREATED]: 'Создано',
    [HTTP_STATUS.BAD_REQUEST]: 'Неверный запрос',
    [HTTP_STATUS.UNAUTHORIZED]: 'Не авторизован',
    [HTTP_STATUS.FORBIDDEN]: 'Доступ запрещён',
    [HTTP_STATUS.NOT_FOUND]: 'Не найдено',
    [HTTP_STATUS.CONFLICT]: 'Конфликт данных',
    [HTTP_STATUS.UNPROCESSABLE_ENTITY]: 'Ошибка валидации',
    [HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'Внутренняя ошибка сервера',
}
module.exports = {HTTP_STATUS, STATUS_MESSAGES}