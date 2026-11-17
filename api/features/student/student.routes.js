const express = require('express');
const router = express.Router();

const studentController = require('./student.controller');
const { authRequired, requireRole } = require('../../shared/middleware/authRequired');
const { ROLES } = require('../../shared/config/constants');

// Все маршруты требуют авторизации студента
router.use(authRequired, requireRole(ROLES.STUDENT));

// Получить список назначенных тестов
router.get('/:studentId/tests', studentController.getTests);

// Получить тест для прохождения (без правильных ответов)
router.get('/:studentId/tests/:testId', studentController.getTestById);

// Отправить ответы на тест
router.post('/:studentId/tests/:testId/submit', studentController.submitTest);

// Дневник студента — оценки за месяц по предметам
router.get('/:studentId/journal', studentController.getJournal);

// Вступить в группу по коду
router.post('/:studentId/join-group', studentController.joinGroup);

module.exports = router;
