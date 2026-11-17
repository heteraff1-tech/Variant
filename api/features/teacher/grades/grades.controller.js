const asyncHandler = require('../../../shared/middleware/asyncHandler')
const ApiResponse = require('../../../shared/utils/ApiResponse')
const gradesService = require('../grades/grades.service')

//Получение студентов группы
// Получить студентов группы
exports.getStudents = asyncHandler(async (req, res) => {
  const { teacherId, groupId, subjectId } = req.params;
  const students = await gradesService.getStudents(
    Number(teacherId),
    Number(groupId),
    Number(subjectId)
  );
  ApiResponse.ok(res, 'Список студентов получен', { students });
});
// Получить оценки за месяц
exports.getGrades = asyncHandler(async (req, res) => {
  const { teacherId, groupId, subjectId, month, year } = req.params;
  const grades = await gradesService.getGradesMonth(
    Number(teacherId),
    Number(groupId),
    Number(subjectId),
    Number(month),
    Number(year)
  );
  ApiResponse.ok(res, 'Оценки получены', { grades });
});
// Сохранить оценку
exports.saveGrade = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;
  // req.body уже провалидирован
  const result = await gradesService.saveGrade(Number(teacherId), req.body);
  if (result.action === 'created') {
    ApiResponse.created(res, 'Оценка добавлена', result);
  } else {
    ApiResponse.ok(res, 'Оценка обновлена', result);
  }
});
// Удалить оценку (опционально)
exports.deleteGrade = asyncHandler(async (req, res) => {
  const { teacherId, gradeId } = req.params;
  await gradesService.deleteGrade(Number(teacherId), Number(gradeId));
  ApiResponse.ok(res, 'Оценка удалена');
});
// Получить средний балл по предмету за всё время
exports.getAverages = asyncHandler(async (req, res) => {
  const { teacherId, groupId, subjectId } = req.params;
  const averages = await gradesService.getAverages(
    Number(teacherId),
    Number(groupId),
    Number(subjectId)
  );
  ApiResponse.ok(res, 'Средние баллы получены', { averages });
});

// Пересдача теста — удалить оценку для повторного прохождения
exports.resetTestGrade = asyncHandler(async (req, res) => {
  const { teacherId, gradeId } = req.params;
  const result = await gradesService.resetTestGrade(
    Number(teacherId),
    Number(gradeId)
  );
  ApiResponse.ok(res, 'Пересдача открыта', result);
});