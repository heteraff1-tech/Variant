const prisma = require('../../prisma/prismaClient')
const ApiError = require('../../shared/utils/ApiError')
const {ROLES} = require('../../shared/config/constants')

async function initProfile(userId, data) {
    const {name, lastName, patronymic, organizationCode} = data;
    
    const user = await prisma.user.findUnique({
        where: {id: userId},
        select: {role_id: true}
    })

    if (user.role_id !== ROLES.TEACHER) {
        throw ApiError.forbidden('Только для учителей')
    }

    const exitingTeacher = await prisma.teacher.findFirst({
        where: {user_id: userId}
    })

    if (exitingTeacher) {
        throw ApiError.conflict('Профиль учителя уже создан')
    }

    const organization = await prisma.organization.findFirst({
        where: {code: organizationCode}
    })
    
    if (!organization) {
        throw ApiError.notFound('Организация с таким кодом не найдена')
    }

    const teacher = await prisma.$transaction(async (tx) => {
        const newTeacher = await tx.teacher.create({
            data: {
                user_id: userId,
                name,
                last_name: lastName,
                patronymic
            }
        })

        await tx.organizationTeacher.create({
            data: {
                teacher_id: newTeacher.id,
                organization_id: organization.id
            }
        })
        return newTeacher
    })
    return teacher
}

async function getTeacherState(userId) {
    const teacher = await prisma.teacher.findFirst({
        where: {user_id: userId}
    })
    
    return {
        isInitialized: !!teacher,
        teacherId: teacher?.id || null,
        profile: teacher || null
    }
}

async function getSubjects(teacherId) {
    const subjects = await prisma.teacherSubject.findMany({
        where: {teacher_id: teacherId},
        include: {subject: true}
    })

    return subjects.map(ts => ts.subject)
}

async function getGroupsBySubject(teacherId, subjectId) {
    const links = await prisma.teacherGroupsSubject.findMany({
        where: {
            teacher_id: teacherId,
            subject_id: subjectId,
        },
        include: {group: true}
    })
    
    return links.map(link => link.group)
}


async function getDashboard(userId) {
    const teacher = await prisma.teacher.findFirst({
        where: { user_id: userId },
        include: {
            organization_teachers: {
                include: { organization: true }
            }
        }
    });

    if (!teacher) {
        throw ApiError.notFound('Профиль учителя не найден');
    }

    // Организации учителя
    const organizations = teacher.organization_teachers.map(ot => ot.organization);

    // Уникальные группы учителя (через TeacherGroupsSubject)
    const teacherGroups = await prisma.teacherGroupsSubject.findMany({
        where: { teacher_id: teacher.id },
        select: { group_id: true },
        distinct: ['group_id']
    });
    const groupsCount = teacherGroups.length;

    const now = new Date();

    // Активные тесты (сейчас идут: beginning_date <= now <= end_date)
    const activeTests = await prisma.testTask.findMany({
        where: {
            teacher_id: teacher.id,
            beginning_date: { lte: now },
            end_date: { gte: now }
        },
        select: {
            id: true,
            title: true,
            beginning_date: true,
            end_date: true,
            time: true,
        },
        orderBy: { end_date: 'asc' }
    });

    // Последние тесты (все, сортировка по id desc)
    const latestTests = await prisma.testTask.findMany({
        where: { teacher_id: teacher.id },
        select: {
            id: true,
            title: true,
            beginning_date: true,
            end_date: true,
            time: true,
        },
        orderBy: { id: 'desc' },
        take: 5
    });

    // Средняя оценка по всем предметам
    const gradesData = await prisma.grade.aggregate({
        where: { teacher_id: teacher.id },
        _avg: { grade: true },
        _count: { grade: true }
    });

    return {
        teacher: {
            id: teacher.id,
            name: teacher.name,
            last_name: teacher.last_name,
            patronymic: teacher.patronymic,
        },
        organizations,
        groupsCount,
        activeTests,
        activeTestsCount: activeTests.length,
        latestTests,
        averageGrade: gradesData._avg.grade ? Math.round(gradesData._avg.grade * 10) / 10 : null,
    };
}

module.exports = {
  initProfile,
  getTeacherState,
  getSubjects,
  getGroupsBySubject,
  getDashboard,
};