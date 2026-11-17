require('dotenv').config();
const app = require('./app');
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Сервер запущен!
📍 Порт: ${PORT}
🌍 Окружение: ${process.env.NODE_ENV}
⏰ Время: ${new Date().toISOString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});