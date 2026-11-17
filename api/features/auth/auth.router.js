const express = require('express')
router = express.Router()

const authController = require('./auth.controller')
const validate = require('../../shared/middleware/validate')
const {authRequired} = require('../../shared/middleware/authRequired')
const {registerSchema, loginSchema} = require('./auth.validator')

router.post('/register', validate(registerSchema), authController.register)
router.post('/login', validate(loginSchema), authController.login)
router.get('/infoUser', authRequired, authController.info)

module.exports = router