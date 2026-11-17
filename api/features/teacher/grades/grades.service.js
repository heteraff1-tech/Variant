const prisma = require('../../../prisma/prismaClient')
const ApiError = require('../../../shared/utils/ApiError')

//Список студентов
async function getStudents(teacherId, groupId, subjectId) {
    
    const hasAccess = await prisma.teacherGroupsSubject.findFirst({
        where: {
            teacher_id: teacherId,
            group_id: groupId,
            subject_id: subjectId
        }
    })

    if (!hasAccess) {
        throw ApiError.forbidden('У вас не доступа к этой группе по данному предмету')
    }

    const studentGroups = await prisma.studentGroup.findMany({
        where: {group_id: groupId},
        include: {
            student: {
                select: {
                    id: true,
                    last_name: true,
                    name: true,
                    patronymic: true
                },
            }
        },
        orderBy: {
            student: {
                last_name: 'asc'
            }
        }
    })
  return studentGroups.map((sg, index) => ({
    id: sg.student.id,
    number: index + 1, // Порядковый номер
    name: sg.student.name,
    lastName: sg.student.last_name,
    patronymic: sg.student.patronymic,
    fullName: `${sg.student.last_name} ${sg.student.name} ${sg.student.patronymic || ''}`.trim(),
  }));
}

// Получение оценок за месяц
async function getGradesMonth(teacherId, groupId, subjectId, month, year) {

    //Границы месяца
    const starDate = new Date(year, month -1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    //Получаем ID студентов группы
    const studentGroup = await prisma.studentGroup.findMany({
        where: {group_id: groupId},
        select: {student_id: true}
    })

    const studentIds = studentGroup.map((sg) => sg.student_id)

    //Все оценки за месяц (включая данные теста)
    const grades = await prisma.grade.findMany({
        where: {
            teacher_id: teacherId,
            subject_id: subjectId,
            student_id: {in: studentIds},
            date: {
                gte: starDate,
                lte: endDate
            }
        },
        include: {
            test_task: {
                select: {
                    id: true,
                    title: true,
                    questions: { select: { id: true } }
                }
            }
        }
    })

  // Преобразуем в формат: { studentId: { "2026-01-15": { grade, gradeId, testId, testTitle, totalQuestions } } }
  const gradesMap = {};
  
  grades.forEach((grade) => {
    if (!gradesMap[grade.student_id]) {
      gradesMap[grade.student_id] = {};
    }
    
    const dateKey = grade.date.toISOString().split('T')[0]; // YYYY-MM-DD
    gradesMap[grade.student_id][dateKey] = {
      grade: grade.grade,
      gradeId: grade.id,
      testId: grade.test_id || null,
      testTitle: grade.test_task?.title || null,
      totalQuestions: grade.test_task?.questions?.length || null,
    };
  });
  return gradesMap;
    
}

// Пересдача теста — удаляем оценку, чтобы студент мог пройти тест заново
async function resetTestGrade(teacherId, gradeId) {
    const grade = await prisma.grade.findUnique({
        where: { id: gradeId },
    })

    if (!grade) {
        throw ApiError.notFound('Оценка не найдена')
    }

    if (grade.teacher_id !== teacherId) {
        throw ApiError.forbidden('Вы не можете сбросить чужую оценку')
    }

    if (!grade.test_id) {
        throw ApiError.badRequest('Эта оценка не связана с тестом')
    }

    await prisma.grade.delete({
        where: { id: gradeId },
    })

    return { reset: true, testId: grade.test_id }
}

//Сохранение или обновление оценки
async function saveGrade(teacherId, data) {

    const {studentId, subjectId, date, grade} = data

    //Парсим дату
    const gradeDate = new Date(date)

    if(isNaN(gradeDate.getTime())) {
        throw ApiError.badRequest('Неверный формат даты')
    }

    const existing = await prisma.grade.findFirst({
        where: {
            teacher_id: teacherId,
            student_id: studentId,
            subject_id: subjectId,
            date: gradeDate,
        }
    })

    if(existing) {
        const updated = await prisma.grade.update({
            where: {id: existing.id},
            data: {grade},
        })

        return {action: 'updated', grade: updated}
    } else {
        const created = await prisma.grade.create({
            data: {
                teacher_id: teacherId,
                student_id: studentId,
                subject_id: subjectId,
                date: gradeDate,
                grade,
            }
        })

        return { action: 'created', grade: created}
    }
    
}

async function deleteGrade(teacherId, gradeId) {
    const grade = await prisma.grade.findUnique({
        where: {id: gradeId},
    })

    if(!grade) {
        throw ApiError.notFound('Оценка не найдена')
    }
    
    if(grade.teacher_id !== teacherId) {
        throw ApiError.forbidden('Вы не можете удалить чужую оценку')
    }

    await prisma.grade.delete({
        where: {id: gradeId},
    })

    return {deleted: true}
}

// Средний балл по предмету за всё время для каждого студента группы
async function getAverages(teacherId, groupId, subjectId) {
    // Получаем ID студентов группы
    const studentGroups = await prisma.studentGroup.findMany({
        where: { group_id: groupId },
        select: { student_id: true }
    })

    const studentIds = studentGroups.map((sg) => sg.student_id)

    // Все оценки по предмету за всё время (только числовые, > 0)
    const grades = await prisma.grade.findMany({
        where: {
            teacher_id: teacherId,
            subject_id: subjectId,
            student_id: { in: studentIds },
            grade: { gt: 0 } // Исключаем Н(-1), Б(-2), У(-3)
        },
        select: {
            student_id: true,
            grade: true
        }
    })

    // Считаем средний балл для каждого студента
    const sumMap = {}
    const countMap = {}

    grades.forEach((g) => {
        if (!sumMap[g.student_id]) {
            sumMap[g.student_id] = 0
            countMap[g.student_id] = 0
        }
        sumMap[g.student_id] += g.grade
        countMap[g.student_id] += 1
    })

    const averages = {}
    studentIds.forEach((id) => {
        if (countMap[id] && countMap[id] > 0) {
            averages[id] = Math.round((sumMap[id] / countMap[id]) * 100) / 100
        } else {
            averages[id] = null
        }
    })

    return averages
}

module.exports = {
  getStudents,
  getGradesMonth,
  saveGrade,
  deleteGrade,
  getAverages,
  resetTestGrade,
};