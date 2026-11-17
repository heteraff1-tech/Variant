const asyncHandler = require('../../shared/middleware/asyncHandler')
const ApiResponse = require('../../shared/utils/ApiResponse')
const authService = require('./auth.service')

exports.register = asyncHandler(async(req, res) => {
    const user = await authService.register(req.body)

    ApiResponse.created(res, 'Пользователь успешно зарегистрирован', {user})
})

exports.login = asyncHandler(async (req, res) => {
    const {user, token} = await authService.login(req.body)

    ApiResponse.ok(res, 'Успешный вход', {user, token})
})

exports.info = asyncHandler(async (req, res) => {
    const user = await authService.getUser(req.user.id);

    ApiResponse.ok(res, 'Профиль пользователя', {user})
})