const studentService = require('./student.service');

/**
 * GET /student/:studentId/tests
 */
async function getTests(req, res, next) {
  try {
    const { studentId } = req.params;
    const tests = await studentService.getTests(studentId);
    res.json({ success: true, data: { tests } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /student/:studentId/tests/:testId
 */
async function getTestById(req, res, next) {
  try {
    const { studentId, testId } = req.params;
    const test = await studentService.getTestById(studentId, testId);
    res.json({ success: true, data: { test } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /student/:studentId/tests/:testId/submit
 */
async function submitTest(req, res, next) {
  try {
    const { studentId, testId } = req.params;
    const { answers } = req.body;
    const result = await studentService.submitTest(studentId, testId, answers);
    res.json({ success: true, message: 'Тест завершён', data: { result } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /student/:studentId/journal?month=6&year=2026
 */
async function getJournal(req, res, next) {
  try {
    const { studentId } = req.params;
    const { month, year } = req.query;
    const journal = await studentService.getJournal(
      studentId,
      Number(month),
      Number(year)
    );
    res.json({ success: true, data: { journal } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /student/:studentId/join-group
 */
async function joinGroup(req, res, next) {
  try {
    const { studentId } = req.params;
    const { groupCode } = req.body;
    if (!groupCode) {
      return res.status(400).json({ success: false, message: 'Код группы обязателен' });
    }
    const result = await studentService.joinGroup(studentId, groupCode);
    res.json({ success: true, message: `Вы вступили в группу ${result.groupTitle}`, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTests, getTestById, submitTest, getJournal, joinGroup };
