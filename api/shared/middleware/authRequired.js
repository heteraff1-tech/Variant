const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
/**
 * Middleware проверки авторизации
 */
const authRequired = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Токен отсутствует');
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Токен истёк');
    }
    throw ApiError.unauthorized('Недействительный токен');
  }
};
/**
 * Middleware проверки роли
 * @param  {...number} allowedRoles - ID допустимых ролей
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('Не авторизован');
    }
    
    if (!allowedRoles.includes(req.user.role_id)) {
      throw ApiError.forbidden('Недостаточно прав');
    }
    
    next();
  };
};
module.exports = { authRequired, requireRole };