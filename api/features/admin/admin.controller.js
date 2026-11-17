const asyncHandler = require('../../shared/middleware/asyncHandler');
const ApiResponse = require('../../shared/utils/ApiResponse');
const adminService = require('./admin.service');
// Получить список преподавателей
exports.getTeachers = asyncHandler(async (req, res) => {
  const { adminId } = req.params;
  const teachers = await adminService.getTeachers(Number(adminId));
  ApiResponse.ok(res, 'Список преподавателей получен', { teachers });
});
// Получить данные для редактирования преподавателя
exports.getTeacherEditData = asyncHandler(async (req, res) => {
  const { adminId, teacherId } = req.params;
  const data = await adminService.getTeacherEditData(
    Number(adminId),
    Number(teacherId)
  );
  ApiResponse.ok(res, 'Данные преподавателя получены', data);
});
// Обновить предметы и группы преподавателя
exports.updateTeacher = asyncHandler(async (req, res) => {
  const { adminId, teacherId } = req.params;
  await adminService.updateTeacher(
    Number(adminId),
    Number(teacherId),
    req.body
  );
  ApiResponse.ok(res, 'Данные преподавателя обновлены');
});
// Получить предметы организации
exports.getSubjects = asyncHandler(async (req, res) => {
  const { adminId } = req.params;
  const subjects = await adminService.getSubjects(Number(adminId));
  ApiResponse.ok(res, 'Список предметов получен', { subjects });
});
// Создать предмет
exports.createSubject = asyncHandler(async (req, res) => {
  const { adminId } = req.params;
  const subject = await adminService.createSubject(Number(adminId), req.body);
  ApiResponse.created(res, 'Предмет создан', { subject });
});
// Обновить предметы (массово)
exports.updateSubjects = asyncHandler(async (req, res) => {
  const { adminId } = req.params;
  const results = await adminService.updateSubjects(Number(adminId), req.body);
  ApiResponse.ok(res, 'Предметы обновлены', results);
});
// Получить группы
exports.getGroups = asyncHandler(async (req, res) => {
  const { adminId } = req.params;
  const groups = await adminService.getGroups(Number(adminId));
  ApiResponse.ok(res, 'Список групп получен', { groups });
});
// Создать группу
exports.createGroup = asyncHandler(async (req, res) => {
  const { adminId } = req.params;
  const group = await adminService.createGroup(Number(adminId), req.body);
  ApiResponse.created(res, 'Группа создана', { group });
});
// Удалить группу
exports.deleteGroup = asyncHandler(async (req, res) => {
  const { adminId, groupId } = req.params;
  await adminService.deleteGroup(Number(adminId), Number(groupId));
  ApiResponse.ok(res, 'Группа удалена');
});
// Убрать студента из группы
exports.removeStudentFromGroup = asyncHandler(async (req, res) => {
  const { adminId, groupId, studentId } = req.params;
  await adminService.removeStudentFromGroup(Number(adminId), Number(groupId), Number(studentId));
  ApiResponse.ok(res, 'Студент убран из группы');
});
// Переместить студента
exports.moveStudent = asyncHandler(async (req, res) => {
  const { adminId, studentId } = req.params;
  const { toGroupId } = req.body;
  await adminService.moveStudent(Number(adminId), Number(studentId), Number(toGroupId));
  ApiResponse.ok(res, 'Студент перемещён');
});
// Очистить группы
exports.clearGroups = asyncHandler(async (req, res) => {
  const { adminId } = req.params;
  const { groupIds } = req.body;
  const result = await adminService.clearGroups(Number(adminId), groupIds.map(Number));
  ApiResponse.ok(res, 'Группы очищены', result);
});
// Миграция студентов
exports.migrateGroups = asyncHandler(async (req, res) => {
  const { adminId } = req.params;
  const { migrations } = req.body;
  const result = await adminService.migrateGroups(Number(adminId), migrations);
  ApiResponse.ok(res, 'Миграция выполнена', result);
});
// Получить информацию об организации (название, код)
exports.getOrganizationInfo = asyncHandler(async (req, res) => {
  const { adminId } = req.params;
  const org = await adminService.getOrganizationInfo(Number(adminId));
  ApiResponse.ok(res, 'Информация об организации', { organization: org });
});