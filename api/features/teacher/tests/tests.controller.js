const testsService = require('./tests.service');

/**
 * POST /teacher/:teacherId/tests
 * Создание нового теста (с вопросами, ответами, назначением группам)
 */
async function createTest(req, res, next) {
  try {
    const { teacherId } = req.params;
    const test = await testsService.createTest(teacherId, req.body, req.files);

    res.status(201).json({
      success: true,
      message: 'Тест успешно создан',
      data: { test },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createTest };
