const express = require('express')
const router = express.Router()

const teacherController = require('./teacher.controller')
const {authRequired, requireRole} = require('../../shared/middleware/authRequired')
const validate = require('../../shared/middleware/validate')
const {ROLES} = require('../../shared/config/constants')
const {initProfileSchema} = require('./teacher. validator')

router.use(authRequired, requireRole(ROLES.TEACHER))

router.post('/init', validate(initProfileSchema), teacherController.initProfile)
router.get('/state', teacherController.gerState)
router.get('/dashboard', teacherController.getDashboard)
router.get('/:teacherId/subject', teacherController.getMySubjects)
router.get('/:teacherId/groups/:subjectId', teacherController.getGroups)

module.exports = router