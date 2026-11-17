const ApiError = require('../utils/ApiError');
/**
 * Middleware для валидации через Zod
 * @param {ZodSchema} schema - Zod схема
 * @param {string} source - Откуда брать данные: 'body', 'query', 'params'
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[source];
      const parsed = schema.parse(data);
      
      // Заменяем оригинальные данные на провалидированные
      req[source] = parsed;
      
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        const errors = (error.errors || error.issues).map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        
        throw ApiError.validation(errors);
      }
      
      throw error;
    }
  };
};
module.exports = validate;