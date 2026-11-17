
export const API_ROUTES = {

    auth: {
        login: '/auth/login',
        register: '/auth/register',
        infoUser: '/auth/infoUser'
    },
    teacher: {
        init: '/teacher/init',
        state: '/teacher/state',
        dashboard: '/teacher/dashboard',
        subjects: (teacherId) => `/teacher/${teacherId}/subject`,
        groups: (teacherId, subjectId) => `/teacher/${teacherId}/groups/${subjectId}`,
        createTest: (teacherId) => `/teacher/${teacherId}/tests`,
    },

  grades: {
    students: (teacherId, groupId, subjectId) => 
      `/teacher/${teacherId}/students/${groupId}/${subjectId}`,
    get: (teacherId, groupId, subjectId, month, year) =>
      `/teacher/${teacherId}/grades/${groupId}/${subjectId}/${month}/${year}`,
    save: (teacherId) => `/teacher/${teacherId}/grades`,
    averages: (teacherId, groupId, subjectId) =>
      `/teacher/${teacherId}/averages/${groupId}/${subjectId}`,
    resetTest: (teacherId, gradeId) =>
      `/teacher/${teacherId}/grades/${gradeId}/reset-test`,
  },

    admin: {
    organization: (adminId) => `/admin/${adminId}/organization`,
    teachers: (adminId) => `/admin/${adminId}/teachers`,
    teacherEdit: (adminId, teacherId) => `/admin/${adminId}/teacher/${teacherId}/edit`,
    teacherUpdate: (adminId, teacherId) => `/admin/${adminId}/teacher/${teacherId}`,
    subjects: (adminId) => `/admin/${adminId}/subjects`,
    groups: (adminId) => `/admin/${adminId}/groups`,
    groupCreate: (adminId) => `/admin/${adminId}/groups`,
    groupDelete: (adminId, groupId) => `/admin/${adminId}/groups/${groupId}`,
    groupClear: (adminId) => `/admin/${adminId}/groups/clear`,
    groupMigrate: (adminId) => `/admin/${adminId}/groups/migrate`,
    studentMove: (adminId, studentId) => `/admin/${adminId}/students/${studentId}/move`,
    studentRemove: (adminId, groupId, studentId) => `/admin/${adminId}/groups/${groupId}/students/${studentId}`,
  },

  student: {
    tests: (studentId) => `/student/${studentId}/tests`,
    testById: (studentId, testId) => `/student/${studentId}/tests/${testId}`,
    submitTest: (studentId, testId) => `/student/${studentId}/tests/${testId}/submit`,
    journal: (studentId) => `/student/${studentId}/journal`,
  },
}