import api from '@/http-common'

export default {
    // Получить предметы учителя
    async getSubjects(teacherId) {
        const response = await api.get(`/teacher/${teacherId}/subjects`)
        return response.data
    },

    // Получить группы по предмету
    async getGroups(teacherId, subjectId) {
        const response = await api.get(`/teacher/${teacherId}/groups/${subjectId}`)
        return response.data
    },

    // Получить студентов группы
    async getStudents(teacherId, groupId, subjectId) {
        const response = await api.get(`/teacher/${teacherId}/students/${groupId}/${subjectId}`)
        return response.data
    },

    // Получить оценки за месяц
    async getGrades(teacherId, groupId, subjectId, month, year) {
        const response = await api.get(`/teacher/${teacherId}/grades/${groupId}/${subjectId}/${month}/${year}`)
        return response.data
    },

    // Сохранить оценку
    async saveGrade(teacherId, data) {
        const response = await api.post(`/teacher/${teacherId}/grades`, data)
        return response.data
    }
}