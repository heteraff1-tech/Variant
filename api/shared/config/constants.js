const ROLES = {
    STUDENT: 1,
    ADMIN: 2,
    TEACHER: 3,
}

const ROLE_NAMES = {
    [ROLES.STUDENT]: 'студент',
    [ROLES.ADMIN]: 'администратор',
    [ROLES.TEACHER]: 'учитель',
}

const GRADE_CODES = {
  ABSENT: -1,    // Н - отсутствовал  
  SICK: -2,      // Б - болел
  EXCUSED: -3,   // У - уважительная причина
};
module.exports = { ROLES, ROLE_NAMES, GRADE_CODES };