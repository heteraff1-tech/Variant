const prisma = require('../../prisma/prismaClient');
const ApiError = require('../../shared/utils/ApiError');
const { ROLES } = require('../../shared/config/constants');
/**
 * Проверка, что пользователь - администратор организации
 */
async function verifyAdminAccess(userId, organizationId = null) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role_id: true },
  });
  if (user.role_id !== ROLES.ADMIN) {
    throw ApiError.forbidden('Только для администраторов');
  }
  // Если нужна проверка принадлежности к организации
  if (organizationId) {
    const org = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        owner_id: userId,
      },
    });
    if (!org) {
      throw ApiError.forbidden('У вас нет доступа к этой организации');
    }
    return org;
  }
  return true;
}
/**
 * Получение организации администратора
 */
async function getAdminOrganization(userId) {
  const organization = await prisma.organization.findFirst({
    where: { owner_id: userId },
  });
  if (!organization) {
    throw ApiError.notFound('Организация не найдена');
  }
  return organization;
}
/**
 * Получение публичной информации об организации (код, название и т.д.)
 */
async function getOrganizationInfo(adminId) {
  const org = await getAdminOrganization(adminId);
  return {
    id: org.id,
    name: org.name,
    code: org.code,
    description: org.description,
    created_at: org.created_at,
  };
}
/**
 * Получение списка преподавателей организации
 */
async function getTeachers(adminId) {
  // Получаем организацию админа
  const organization = await getAdminOrganization(adminId);
  // Получаем связи преподавателей с организацией
  const orgTeachers = await prisma.organizationTeacher.findMany({
    where: { organization_id: organization.id },
    include: {
      teacher: {
        include: {
          user: {
            select: {
              id: true,
              login: true,
              role: true,
            },
          },
        },
      },
    },
  });
  // Для каждого преподавателя получаем его предметы и группы
  const teachers = await Promise.all(
    orgTeachers.map(async (ot) => {
      const teacher = ot.teacher;
      const teacherSubjects = await prisma.teacherGroupsSubject.findMany({
        where: { teacher_id: teacher.id },
        include: {
          subject: true,
          group: true,
        },
      });
      // Группируем по предметам
      const subjectsMap = new Map();
      teacherSubjects.forEach((tgs) => {
        const subjectId = tgs.subject.id;
        if (!subjectsMap.has(subjectId)) {
          subjectsMap.set(subjectId, {
            id: tgs.subject.id,
            title: tgs.subject.title,
            groups: [],
          });
        }
        subjectsMap.get(subjectId).groups.push(tgs.group.title);
      });
      return {
        id: teacher.id,
        name: teacher.name,
        lastName: teacher.last_name,
        patronymic: teacher.patronymic,
        role: teacher.user.role.title,
        subjects: Array.from(subjectsMap.values()),
      };
    })
  );
  return teachers;
}
/**
 * Получение данных для редактирования преподавателя
 */
async function getTeacherEditData(adminId, teacherId) {
  const organization = await getAdminOrganization(adminId);
  // Проверяем, что преподаватель принадлежит организации
  const orgTeacher = await prisma.organizationTeacher.findFirst({
    where: {
      organization_id: organization.id,
      teacher_id: teacherId,
    },
  });
  if (!orgTeacher) {
    throw ApiError.notFound('Преподаватель не найден в вашей организации');
  }
  // Получаем данные преподавателя
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
  });
  // Получаем предметы и группы преподавателя
  const teacherSubjects = await prisma.teacherGroupsSubject.findMany({
    where: { teacher_id: teacherId },
    include: {
      subject: true,
      group: true,
    },
  });
  // Группируем по предметам
  const subjectsMap = new Map();
  teacherSubjects.forEach((tgs) => {
    const subjectId = tgs.subject.id;
    if (!subjectsMap.has(subjectId)) {
      subjectsMap.set(subjectId, {
        id: tgs.subject.id,
        title: tgs.subject.title,
        groups: [],
      });
    }
    subjectsMap.get(subjectId).groups.push({
      id: tgs.group.id,
      title: tgs.group.title,
    });
  });
  const subjects = Array.from(subjectsMap.values());
  // Получаем все предметы и группы организации для селектов
 const allSubjects = await prisma.subject.findMany({
  where: { id_organization: organization.id },
  orderBy: { title: 'asc' },
});
const allGroups = await prisma.group.findMany({
  where: { organization_id: organization.id },
  orderBy: [{ course: 'asc' }, { title: 'asc' }],
});

  return {
    teacher,
    subjects,
    allSubjects,
    allGroups,
  };
}
/**
 * Обновление предметов и групп преподавателя
 */
async function updateTeacher(adminId, teacherId, data) {
  const organization = await getAdminOrganization(adminId);
  // Проверяем доступ
  const orgTeacher = await prisma.organizationTeacher.findFirst({
    where: {
      organization_id: organization.id,
      teacher_id: teacherId,
    },
  });
  if (!orgTeacher) {
    throw ApiError.notFound('Преподаватель не найден');
  }
  // Удаляем старые связи
  await prisma.teacherGroupsSubject.deleteMany({
    where: { teacher_id: teacherId },
  });
  await prisma.teacherSubject.deleteMany({
    where: { teacher_id: teacherId },
  });
  // Создаём новые связи
  const { subjects } = data;
  for (const subj of subjects) {
    // Создаем связь с предметом
    await prisma.teacherSubject.create({
      data: {
        teacher_id: teacherId,
        subject_id: subj.subject_id,
      },
    });
    // Создаем связи с группами
    for (const groupId of subj.group_ids) {
      await prisma.teacherGroupsSubject.create({
        data: {
          teacher_id: teacherId,
          subject_id: subj.subject_id,
          group_id: groupId,
        },
      });
    }
  }
  return { updated: true };
}
/**
 * Получение предметов организации
 */
async function getSubjects(adminId) {
  const organization = await getAdminOrganization(adminId);
  const subjects = await prisma.subject.findMany({
    where: { id_organization: organization.id },
    orderBy: { title: 'asc' },
  });
  return subjects;
}
/**
 * Создание предмета
 */
async function createSubject(adminId, data) {
  const organization = await getAdminOrganization(adminId);
  // Проверяем дубликат
const existing = await prisma.subject.findFirst({
  where: {
    id_organization: organization.id,
    title: data.title,
  },
});
  if (existing) {
    throw ApiError.conflict('Предмет с таким названием уже существует');
  }
const subject = await prisma.subject.create({
  data: {
    title: data.title,
    id_organization: organization.id,
  },
});
  return subject;
}
/**
 * Обновление предметов (массовое)
 */
async function updateSubjects(adminId, data) {
  const organization = await getAdminOrganization(adminId);
  const results = {
    created: [],
    updated: [],
    deleted: [],
  };
  for (const subj of data.subjects) {
    if (subj._action === 'delete' && subj.id) {
      await prisma.subject.delete({
        where: { id: subj.id },
      });
      results.deleted.push(subj.id);
    } else if (subj.id) {
      // Update
      const updated = await prisma.subject.update({
        where: { id: subj.id },
        data: { title: subj.title },
      });
      results.updated.push(updated);
    } else {
      // Create
    const created = await prisma.subject.create({
      data: {
        title: subj.title,
        id_organization: organization.id,
      },
    });
      results.created.push(created);
    }
  }
  return results;
}
/**
 * Получение групп организации
 */
async function getGroups(adminId) {
  const organization = await getAdminOrganization(adminId);

  // Получаем все группы с их студентами
  const groups = await prisma.group.findMany({
    where: { organization_id: organization.id },
    include: {
      student_groups: {
        include: {
          student: true,
        },
      },
    },
    orderBy: [{ course: 'asc' }, { title: 'asc' }],
  });

  // Получаем все предметы организации
const allSubjects = await prisma.subject.findMany({
  where: { id_organization: organization.id },
  orderBy: { title: 'asc' },
});

  // Формируем плоский список всех групп (для фильтров и селектов)
  const allGroups = groups.map((g) => ({
    id: g.id,
    title: g.title,
    code: g.course_code,
  }));

  // Группируем по курсам, добавляем список студентов
  const coursesMap = new Map();
  groups.forEach((g) => {
    const course = g.course ?? 0;
    if (!coursesMap.has(course)) {
      coursesMap.set(course, { course, groups: [] });
    }
    coursesMap.get(course).groups.push({
      id: g.id,
      title: g.title,
      code: g.course_code,
      students: g.student_groups.map((sg) => ({
        id: sg.student.id,
        fio: `${sg.student.last_name} ${sg.student.name} ${sg.student.patronymic ?? ''}`.trim(),
      })),
    });
  });

  const courses = Array.from(coursesMap.values()).sort((a, b) => a.course - b.course);

  return { courses, allGroups, allSubjects };
}

/**
 * Создание группы
 */
async function createGroup(adminId, data) {
  const organization = await getAdminOrganization(adminId);

  // Валидация: title не более 6 символов (VarChar(6) в БД)
  const title = String(data.title || '').trim();
  if (!title) {
    throw ApiError.badRequest('Название группы обязательно');
  }
  if (title.length > 6) {
    throw ApiError.badRequest('Название группы не должно превышать 6 символов');
  }

  // Проверяем дубликат по title внутри организации
  const existing = await prisma.group.findFirst({
    where: { organization_id: organization.id, title },
  });
  if (existing) {
    throw ApiError.conflict('Группа с таким названием уже существует в вашей организации');
  }

  // Генерируем уникальный случайный код для группы (как у организаций)
  let courseCode = data.courseCode ? String(data.courseCode).trim().slice(0, 16) : null;
  if (!courseCode) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let attempts = 0;
    do {
      courseCode = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      const taken = await prisma.group.findFirst({ where: { course_code: courseCode } });
      if (!taken) break;
      attempts++;
    } while (attempts < 10);
  }

  const group = await prisma.group.create({
    data: {
      title,
      course: data.course ?? null,
      course_code: courseCode,
      organization_id: organization.id,
    },
  });
  return group;
}

async function deleteGroup(adminId, groupId) {
  const organization = await getAdminOrganization(adminId);
  const group = await prisma.group.findFirst({
    where: { id: groupId, organization_id: organization.id },
  });
  if (!group) throw ApiError.notFound('Группа не найдена');

  // Удаляем все связанные записи перед удалением группы
  await prisma.studentGroup.deleteMany({ where: { group_id: groupId } });
  await prisma.teacherGroupsSubject.deleteMany({ where: { group_id: groupId } });
  await prisma.testAssignedGroup.deleteMany({ where: { group_id: groupId } });
  await prisma.group.delete({ where: { id: groupId } });
  return { deleted: true };
}
/**
 * Убрать студента из группы
 */
async function removeStudentFromGroup(adminId, groupId, studentId) {
  await getAdminOrganization(adminId); // проверка доступа
  await prisma.studentGroup.deleteMany({
    where: { group_id: groupId, student_id: studentId },
  });
  return { removed: true };
}
/**
 * Переместить студента в другую группу
 */
async function moveStudent(adminId, studentId, toGroupId) {
  const organization = await getAdminOrganization(adminId);
  // Проверяем, что целевая группа принадлежит организации
  const toGroup = await prisma.group.findFirst({
    where: { id: toGroupId, organization_id: organization.id },
  });
  if (!toGroup) throw ApiError.notFound('Группа назначения не найдена');
  // Находим текущую группу студента в этой организации
  const currentSg = await prisma.studentGroup.findFirst({
    where: {
      student_id: studentId,
      group: { organization_id: organization.id },
    },
  });
  if (currentSg) {
    // Обновляем существующую связь
    await prisma.studentGroup.update({
      where: { id: currentSg.id },
      data: { group_id: toGroupId },
    });
  } else {
    await prisma.studentGroup.create({
      data: { student_id: studentId, group_id: toGroupId },
    });
  }
  return { moved: true };
}
/**
 * Очистка групп (убрать всех студентов)
 */
async function clearGroups(adminId, groupIds) {
  await getAdminOrganization(adminId);
  const result = await prisma.studentGroup.deleteMany({
    where: { group_id: { in: groupIds } },
  });
  return { cleared: result.count };
}
/**
 * Миграция студентов между группами
 */
async function migrateGroups(adminId, migrations) {
  await getAdminOrganization(adminId);
  const results = [];
  for (const { fromGroupId, toGroupId } of migrations) {
    const students = await prisma.studentGroup.findMany({
      where: { group_id: fromGroupId },
    });
    // Перемещаем каждого студента
    for (const sg of students) {
      await prisma.studentGroup.update({
        where: { id: sg.id },
        data: { group_id: toGroupId },
      });
    }
    results.push({ from: fromGroupId, to: toGroupId, migrated: students.length });
  }
  return { results };
}
module.exports = {
  getTeachers,
  getTeacherEditData,
  updateTeacher,
  getSubjects,
  createSubject,
  deleteGroup,
  updateSubjects,
  getGroups,
  createGroup,
  removeStudentFromGroup,
  moveStudent,
  clearGroups,
  migrateGroups,
  getOrganizationInfo,
};