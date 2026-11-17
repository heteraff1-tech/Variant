const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { authRequired, requireRole } = require('../../shared/middleware/authRequired');
const validate = require('../../shared/middleware/validate');
const { ROLES } = require('../../shared/config/constants');
const {
  updateTeacherSchema,
  createGroupSchema,
  createSubjectSchema,
  updateSubjectsSchema,
} = require('./admin.validator');
// Все маршруты требуют роли админа
router.use(authRequired, requireRole(ROLES.ADMIN));
// --- ОРГАНИЗАЦИЯ ---
router.get('/:adminId/organization', adminController.getOrganizationInfo);
// --- ПРЕПОДАВАТЕЛИ ---
router.get('/:adminId/teachers', adminController.getTeachers);
router.get(
  '/:adminId/teacher/:teacherId/edit',
  adminController.getTeacherEditData
);
router.put(
  '/:adminId/teacher/:teacherId',
  validate(updateTeacherSchema),
  adminController.updateTeacher
);
// --- ПРЕДМЕТЫ ---
router.get('/:adminId/subjects', adminController.getSubjects);
router.post(
  '/:adminId/subjects',
  validate(createSubjectSchema),
  adminController.createSubject
);
router.put(
  '/:adminId/subjects',
  validate(updateSubjectsSchema),
  adminController.updateSubjects
);
// --- ГРУППЫ ---
router.get('/:adminId/groups', adminController.getGroups);
router.post(
  '/:adminId/groups',
  validate(createGroupSchema),
  adminController.createGroup
);
// --- ГРУППЫ: расширенные операции ---
router.delete('/:adminId/groups/:groupId', adminController.deleteGroup);
router.post('/:adminId/groups/clear', adminController.clearGroups);
router.post('/:adminId/groups/migrate', adminController.migrateGroups);

// --- СТУДЕНТЫ ---
router.delete(
  '/:adminId/groups/:groupId/students/:studentId',
  adminController.removeStudentFromGroup
);
router.put('/:adminId/students/:studentId/move', adminController.moveStudent);

module.exports = router;