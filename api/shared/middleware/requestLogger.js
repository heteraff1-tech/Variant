const requestLogger = (req, res, next) => {
  const start = Date.now();
  const { method, url, ip } = req;
  // Слушаем событие завершения ответа
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    
    // Выбираем иконку в зависимости от статуса
    let statusIcon = '✅';
    if (status >= 400 && status < 500) statusIcon = '⚠️';
    if (status >= 500) statusIcon = '🔥';
    console.log(
      `${statusIcon} [${new Date().toISOString()}] ${method} ${url} - ${status} (${duration}ms) - IP: ${ip}`
    );
  });
  next();
};
module.exports = requestLogger;