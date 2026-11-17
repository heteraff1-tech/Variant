const asyncHandler = require('../../shared/middleware/asyncHandler')
const ApiResponse = require('../../shared/utils/ApiResponse')
const teacherService = require('./teacher.service')

exports.initProfile = asyncHandler(async(req, res) => {

    const teacher = await teacherService.initProfile(req.user.id, req.body)
    
    ApiResponse.created(res, 'Профиль преподавателя успешно создан', {teacher})

})

exports.gerState = asyncHandler(async (req, res) => {
    const state = await teacherService.getTeacherState(req.user.id)
    ApiResponse.ok(res, 'Статус получен', state)
})

exports.getMySubjects = asyncHandler(async (req, res) => {
    const {teacherId} = req.params

    const subjects = await teacherService.getSubjects(Number(teacherId))
    ApiResponse.ok(res, 'Список предметов', {subjects})
})

exports.getGroups = asyncHandler(async (req, res) => {
    const {teacherId, subjectId } = req.params
    const group= await teacherService.getGroupsBySubject(
        Number(teacherId),
        Number(subjectId)
    )

ApiResponse.ok(res, 'Список групп', {groups: group})
})

exports.getDashboard = asyncHandler(async (req, res) => {
    const data = await teacherService.getDashboard(req.user.id)
    ApiResponse.ok(res, 'Данные дашборда', data)
})