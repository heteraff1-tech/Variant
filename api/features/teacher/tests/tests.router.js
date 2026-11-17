const express = require('express');
const router = express.Router();
const multer = require('multer');

const testsController = require('./tests.controller');
const { authRequired, requireRole } = require('../../../shared/middleware/authRequired');
const { ROLES } = require('../../../shared/config/constants');

// Multer: храним файлы в памяти, сервис сам сохраняет на диск
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 МБ
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Разрешены только изображения'), false);
    }
  },
});

// Все маршруты требуют авторизации учителя
router.use(authRequired, requireRole(ROLES.TEACHER));

// Создать тест
router.post(
  '/:teacherId/tests',
  upload.fields([
    { name: 'img', maxCount: 1 },
    ...Array.from({ length: 50 }, (_, i) => ({ name: `questionImage_${i}`, maxCount: 1 })),
  ]),
  testsController.createTest
);

module.exports = router;
