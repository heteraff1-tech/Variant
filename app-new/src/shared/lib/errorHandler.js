import { useToast } from 'vue-toastification'

// Типы ошибок для различной обработки
export const ErrorType = {
    NETWORK: 'network',
    AUTH: 'auth',
    VALIDATION: 'validation',
    SERVER: 'server',
    UNKNOWN: 'unknown',
}

// Определяет тип ошибки

function getErrorType(error) {
    if (!error.response) return ErrorType.NETWORK

    const status = error.response.status
    if (status === 401 || status === 403) return ErrorType.AUTH
    if (status === 400 || status === 422) return ErrorType.VALIDATION
    if (status >= 500) return ErrorType.SERVER

    return ErrorType.UNKNOWN

}

//Извлечение сообщение об ошибки
function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    'Произошла неизвестная ошибка'
  );
}

//Получение массив ошибок валидации
function getValidationErrors(error) {
    return error.response?.data?.errors || null;
}

//Универсальная обработка ошибок
export function handleError(error, options = {}) {
    const {
        showToast = true,
        logToConsole=true,
        fallbackMessage = 'Произошла ошибка',
        onerror = null,
    } = options

    const type = getErrorType(error)
    const message = getErrorMessage(error) || fallbackMessage
    const validationErrors = getValidationErrors(error)

    //Логирование
    if (logToConsole) {
        console.group(`🔥 ОШИБКА: [${type}]`);
        console.error('СООБЩЕНИЕ:', message);
        console.error('СТАТУС:', error.response?.status);
        if (validationErrors) {
        console.error('ОШИБКИ В ВАЛИДАЦИИ:', validationErrors);
        }
        console.error('ПОЛНАЯ ОШИБКА:', error);
        console.groupEnd();
    }

    //Toast уведомления
    if (showToast) {
        const toast =  useToast();

        switch (type) {
            case ErrorType.VALIDATION:
                toast.warning(message)
                break
            case ErrorType.AUTH:
                toast.error(message)
                break
            case ErrorType.NETWORK:
                toast.error('Проблемы с подключением к серверу')
                break
            case ErrorType.SERVER:
                toast.error('Ошибка сервера. Попробуйте позже')
                break
            default:
                toast.error(message)
        }
    }

    //Кастомный обраотчик
    if(onerror) {
        onerror({type, message, validationErrors})
    }

    return {type, message, validationErrors}
}