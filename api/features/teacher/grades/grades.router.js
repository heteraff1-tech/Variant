const express = require('express')
const router= express.Router()

const gradesController = require('./grades.controller')
const {authRequired, requireRole} = require('../../../shared/middleware/authRequired')
const validate = require('../../../shared/middleware/validate')
const {ROLES} = require('../../../shared/config/constants')
const {saveGradeSchema, getStudentsSchema} = require('./grades.validator')

//Все маршируты требуют авторизации учителя
router.use(authRequired, requireRole(ROLES.TEACHER))

//Студенты группы для журнала
router.get('/:teacherId/students/:groupId/:subjectId',
    validate(getStudentsSchema, 'params'),
    gradesController.getStudents
)

//Получить оценки за месяц
router.get('/:teacherId/grades/:groupId/:subjectId/:month/:year',
    gradesController.getGrades
)
// Сохранить оценку
router.post('/:teacherId/grades', validate(saveGradeSchema, 'body'),
gradesController.saveGrade)

// Средний балл по предмету за всё время
router.get('/:teacherId/averages/:groupId/:subjectId',
    gradesController.getAverages
)

// Пересдача теста — удалить оценку
router.delete('/:teacherId/grades/:gradeId/reset-test',
    gradesController.resetTestGrade
)

module.exports = router