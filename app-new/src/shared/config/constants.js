export const ROLES = {
  STUDENT: 1,
  ADMIN: 2,
  TEACHER: 3,
};
export const ROLE_NAMES = {
  [ROLES.STUDENT]: 'Студент',
  [ROLES.ADMIN]: 'Администратор',
  [ROLES.TEACHER]: 'Преподаватель',
};
export const GRADE_CODES = {
  ABSENT: -1,   // Н
  SICK: -2,     // Б
  EXCUSED: -3,  // У
};
export const GRADE_SYMBOLS = {
  [GRADE_CODES.ABSENT]: 'Н',
  [GRADE_CODES.SICK]: 'Б',
  [GRADE_CODES.EXCUSED]: 'У',
};
/**
 * Маршруты приложения
 */
export const APP_ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  STUDENT: (id) => `/student/${id}/tests`,
TEACHER: (id) => `/teacher/${id}`,
  ADMIN: (id) => `/admin/${id}`,
};