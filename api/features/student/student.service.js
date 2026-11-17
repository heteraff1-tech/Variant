const prisma = require('../../prisma/prismaClient');
const ApiError = require('../../shared/utils/ApiError');

/**
 * Перемешать массив (Fisher-Yates shuffle)
 */
function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Нормализовать строку для сравнения (trim, lowercase, убрать двойные пробелы)
 */
function normalizeText(str) {
  return (str || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Получить список тестов, назначенных группам студента
 */
async function getTests(studentId) {
  // Находим студента по user_id
  const student = await prisma.student.findUnique({
    where: { user_id: Number(studentId) },
    include: {
      student_groups: {
        select: { group_id: true },
      },
    },
  });

  if (!student) {
    throw ApiError.notFound('Студент не найден');
  }

  const groupIds = student.student_groups.map((sg) => sg.group_id);

  if (groupIds.length === 0) {
    return [];
  }

  // Находим тесты, назначенные этим группам
  const assignedTests = await prisma.testAssignedGroup.findMany({
    where: { group_id: { in: groupIds } },
    select: { test_id: true },
  });

  const testIds = [...new Set(assignedTests.map((at) => at.test_id))];

  if (testIds.length === 0) {
    return [];
  }

  // Загружаем тесты с количеством вопросов
  const tests = await prisma.testTask.findMany({
    where: { id: { in: testIds } },
    include: {
      subject: { select: { title: true } },
      questions: { select: { id: true } },
      teacher: {
        select: {
          name: true,
          last_name: true,
          patronymic: true,
        },
      },
    },
    orderBy: { id: 'desc' },
  });

  // Проверим, какие тесты уже пройдены этим студентом
  const completedGrades = await prisma.grade.findMany({
    where: {
      student_id: student.id,
      test_id: { in: testIds },
    },
    select: { test_id: true, grade: true },
  });

  const completedMap = {};
  for (const g of completedGrades) {
    completedMap[g.test_id] = g.grade;
  }

  return tests.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    img: t.img,
    time: t.time,
    subject: t.subject.title,
    teacher: `${t.teacher.last_name} ${t.teacher.name[0]}.${t.teacher.patronymic[0]}.`,
    questionCount: t.questions.length,
    beginning_date: t.beginning_date,
    end_date: t.end_date,
    completed: completedMap[t.id] !== undefined,
    grade: completedMap[t.id] ?? null,
  }));
}

/**
 * Получить тест по ID (вопросы БЕЗ правильных ответов)
 * Поддерживает новые типы вопросов и перемешивание
 */
async function getTestById(studentId, testId) {
  // Проверяем студента
  const student = await prisma.student.findUnique({
    where: { user_id: Number(studentId) },
    include: {
      student_groups: { select: { group_id: true } },
    },
  });

  if (!student) {
    throw ApiError.notFound('Студент не найден');
  }

  // Проверяем, не пройден ли уже тест
  const existingGrade = await prisma.grade.findFirst({
    where: {
      student_id: student.id,
      test_id: Number(testId),
    },
  });

  if (existingGrade) {
    throw ApiError.badRequest('Вы уже прошли этот тест');
  }

  // Проверяем, назначен ли тест
  const groupIds = student.student_groups.map((sg) => sg.group_id);
  const assigned = await prisma.testAssignedGroup.findFirst({
    where: {
      test_id: Number(testId),
      group_id: { in: groupIds },
    },
  });

  if (!assigned) {
    throw ApiError.forbidden('Этот тест вам не назначен');
  }

  // Загружаем тест с вопросами и ответами
  const test = await prisma.testTask.findUnique({
    where: { id: Number(testId) },
    include: {
      subject: { select: { title: true } },
      questions: {
        orderBy: { order_index: 'asc' },
        include: {
          answers: {
            orderBy: { order_index: 'asc' },
          },
        },
      },
    },
  });

  if (!test) {
    throw ApiError.notFound('Тест не найден');
  }

  // Формируем вопросы для клиента
  let clientQuestions = test.questions.map((q) => {
    switch (q.question_type) {
      case 'single_choice':
      case 'multiple_choice': {
        return {
          id: q.id,
          description: q.description,
          img: q.img,
          question_type: q.question_type,
          order_index: q.order_index,
          // Ответы БЕЗ is_correct
          answers: q.answers.map((a) => ({
            id: a.id,
            text: a.text,
            order_index: a.order_index,
          })),
        };
      }

      case 'open_answer': {
        return {
          id: q.id,
          description: q.description,
          img: q.img,
          question_type: q.question_type,
          order_index: q.order_index,
          // Не отправляем эталонный ответ
        };
      }

      case 'matching': {
        // Отправляем левые и правые стороны отдельно, правые перемешиваем
        const leftSide = q.answers.map((a) => ({
          id: a.id,
          text: a.text,
        }));
        const rightSide = shuffleArray(
          q.answers.map((a) => ({
            id: a.id,
            text: a.match_text,
          }))
        );

        return {
          id: q.id,
          description: q.description,
          img: q.img,
          question_type: q.question_type,
          order_index: q.order_index,
          leftSide,
          rightSide,
        };
      }

      case 'ordering': {
        // Отправляем элементы в перемешанном порядке
        const items = shuffleArray(
          q.answers.map((a) => ({
            id: a.id,
            text: a.text,
          }))
        );

        return {
          id: q.id,
          description: q.description,
          img: q.img,
          question_type: q.question_type,
          order_index: q.order_index,
          items,
        };
      }

      case 'fill_blanks': {
        // Отправляем текст с placeholder'ами (заменяем {ответ} на {blank_N})
        const blanksCount = q.answers.length;
        let displayText = q.description;
        let blankIdx = 0;
        displayText = displayText.replace(/\{[^}]+\}/g, () => {
          return `{blank_${blankIdx++}}`;
        });

        return {
          id: q.id,
          description: displayText,
          img: q.img,
          question_type: q.question_type,
          order_index: q.order_index,
          blanksCount,
        };
      }

      default: {
        return {
          id: q.id,
          description: q.description,
          img: q.img,
          question_type: q.question_type,
          order_index: q.order_index,
          answers: q.answers.map((a) => ({
            id: a.id,
            text: a.text,
            order_index: a.order_index,
          })),
        };
      }
    }
  });

  // Перемешиваем вопросы если включено
  if (test.shuffle_questions) {
    clientQuestions = shuffleArray(clientQuestions);
  }

  return {
    id: test.id,
    title: test.title,
    description: test.description,
    img: test.img,
    time: test.time,
    subject: test.subject.title,
    shuffle_questions: test.shuffle_questions,
    questions: clientQuestions,
  };
}

/**
 * Отправить ответы на тест. Рассчитать оценку.
 * Формат ответов (расширенный):
 *  - single_choice / multiple_choice: { questionId, answerIds: [] }
 *  - open_answer: { questionId, openAnswer: "текст" }
 *  - matching: { questionId, matchPairs: [{ leftId, rightId }] }
 *  - ordering: { questionId, orderedIds: [id1, id2, ...] }
 *  - fill_blanks: { questionId, blanks: ["ответ1", "ответ2"] }
 */
async function submitTest(studentId, testId, answers) {
  const student = await prisma.student.findUnique({
    where: { user_id: Number(studentId) },
  });

  if (!student) {
    throw ApiError.notFound('Студент не найден');
  }

  // Проверяем, не пройден ли уже
  const existingGrade = await prisma.grade.findFirst({
    where: {
      student_id: student.id,
      test_id: Number(testId),
    },
  });

  if (existingGrade) {
    throw ApiError.badRequest('Вы уже прошли этот тест');
  }

  // Загружаем тест с правильными ответами
  const test = await prisma.testTask.findUnique({
    where: { id: Number(testId) },
    include: {
      questions: {
        orderBy: { order_index: 'asc' },
        include: {
          answers: {
            orderBy: { order_index: 'asc' },
          },
        },
      },
    },
  });

  if (!test) {
    throw ApiError.notFound('Тест не найден');
  }

  // Создаём map ответов студента по questionId
  const answersMap = {};
  if (Array.isArray(answers)) {
    for (const a of answers) {
      answersMap[a.questionId] = a;
    }
  }

  // Подсчитываем правильные ответы
  const totalQuestions = test.questions.length;
  let correctCount = 0;

  for (const question of test.questions) {
    const studentAnswer = answersMap[question.id];
    if (!studentAnswer) continue;

    switch (question.question_type) {
      case 'single_choice':
      case 'multiple_choice': {
        const correctAnswerIds = question.answers
          .filter((a) => a.is_correct)
          .map((a) => a.id)
          .sort();

        const studentAnswerIds = (studentAnswer.answerIds || [])
          .map((id) => Number(id))
          .sort();

        const isCorrect =
          correctAnswerIds.length === studentAnswerIds.length &&
          correctAnswerIds.every((id, idx) => id === studentAnswerIds[idx]);

        if (isCorrect) correctCount++;
        break;
      }

      case 'open_answer': {
        // Сравниваем с эталоном (без учёта регистра и лишних пробелов)
        const correctAnswer = question.answers[0];
        if (correctAnswer) {
          const normalized = normalizeText(studentAnswer.openAnswer);
          const expected = normalizeText(correctAnswer.text);
          if (normalized === expected) correctCount++;
        }
        break;
      }

      case 'matching': {
        // Проверяем, что каждая пара совпадает
        const pairs = studentAnswer.matchPairs || [];
        let allCorrect = true;

        if (pairs.length !== question.answers.length) {
          allCorrect = false;
        } else {
          for (const pair of pairs) {
            const leftId = Number(pair.leftId);
            const rightId = Number(pair.rightId);
            // Находим answer с leftId, проверяем что rightId совпадает
            const correctPair = question.answers.find((a) => a.id === leftId);
            if (!correctPair || correctPair.id !== rightId) {
              // rightId должен быть id того же answer (т.к. match_text принадлежит тому же answer)
              // Проверяем: студент для leftId выбрал rightId, а rightId — это id answer чей match_text = правильный
              const rightAnswer = question.answers.find((a) => a.id === rightId);
              if (!correctPair || !rightAnswer || correctPair.match_text !== rightAnswer.match_text) {
                // Более корректная проверка: leftId и rightId должны указывать на один и тот же answer
                if (leftId !== rightId) {
                  allCorrect = false;
                  break;
                }
              }
            }
          }
        }

        if (allCorrect) correctCount++;
        break;
      }

      case 'ordering': {
        // Проверяем, что порядок совпадает с correct_position
        const orderedIds = (studentAnswer.orderedIds || []).map((id) => Number(id));
        let allCorrect = true;

        if (orderedIds.length !== question.answers.length) {
          allCorrect = false;
        } else {
          for (let i = 0; i < orderedIds.length; i++) {
            const answer = question.answers.find((a) => a.id === orderedIds[i]);
            if (!answer || answer.correct_position !== i) {
              allCorrect = false;
              break;
            }
          }
        }

        if (allCorrect) correctCount++;
        break;
      }

      case 'fill_blanks': {
        // Проверяем каждый пропуск
        const blanks = studentAnswer.blanks || [];
        let allCorrect = true;

        // Сортируем ответы по correct_position (номер пропуска)
        const sortedAnswers = [...question.answers].sort(
          (a, b) => (a.correct_position || 0) - (b.correct_position || 0)
        );

        if (blanks.length !== sortedAnswers.length) {
          allCorrect = false;
        } else {
          for (let i = 0; i < sortedAnswers.length; i++) {
            if (normalizeText(blanks[i]) !== normalizeText(sortedAnswers[i].text)) {
              allCorrect = false;
              break;
            }
          }
        }

        if (allCorrect) correctCount++;
        break;
      }
    }
  }

  // Расчёт процента и оценки
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  let grade;
  if (percentage >= 90) {
    grade = 5;
  } else if (percentage >= 75) {
    grade = 4;
  } else if (percentage >= 50) {
    grade = 3;
  } else {
    grade = 2;
  }

  // Сохраняем оценку в БД
  await prisma.grade.create({
    data: {
      student_id: student.id,
      teacher_id: test.teacher_id,
      subject_id: test.subject_id,
      test_id: test.id,
      grade,
      date: new Date(),
    },
  });

  return {
    correctCount,
    totalQuestions,
    percentage,
    grade,
  };
}

/**
 * Получить дневник студента — оценки за месяц, сгруппированные по предметам
 */
async function getJournal(studentId, month, year) {
  const student = await prisma.student.findUnique({
    where: { user_id: Number(studentId) },
    include: {
      student_groups: { select: { group_id: true } },
    },
  });

  if (!student) {
    throw ApiError.notFound('Студент не найден');
  }

  // Границы месяца
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Получаем все оценки студента за месяц с данными теста и предмета
  const grades = await prisma.grade.findMany({
    where: {
      student_id: student.id,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      subject: { select: { id: true, title: true } },
      test_task: {
        select: {
          id: true,
          title: true,
          questions: { select: { id: true } },
        },
      },
    },
    orderBy: { date: 'asc' },
  });

  // Получаем все оценки студента за всё время для среднего балла по предмету
  const allGrades = await prisma.grade.findMany({
    where: {
      student_id: student.id,
      grade: { gt: 0 },
    },
    select: { subject_id: true, grade: true },
  });

  // Считаем средний балл по каждому предмету
  const avgSumMap = {};
  const avgCountMap = {};
  for (const g of allGrades) {
    if (!avgSumMap[g.subject_id]) {
      avgSumMap[g.subject_id] = 0;
      avgCountMap[g.subject_id] = 0;
    }
    avgSumMap[g.subject_id] += g.grade;
    avgCountMap[g.subject_id]++;
  }

  // Получаем ВСЕ предметы студента через его группы (независимо от наличия оценок в месяце)
  const groupIds = student.student_groups.map((sg) => sg.group_id);
  const teacherGroupSubjects = await prisma.teacherGroupsSubject.findMany({
    where: { group_id: { in: groupIds } },
    include: { subject: { select: { id: true, title: true } } },
  });

  // Строим карту уникальных предметов — они всегда показываются, даже без оценок
  const subjectsMap = {};
  for (const tgs of teacherGroupSubjects) {
    const subjectId = tgs.subject.id;
    if (!subjectsMap[subjectId]) {
      subjectsMap[subjectId] = {
        subjectId,
        subjectTitle: tgs.subject.title,
        grades: {},
        average: null,
      };
    }
  }

  // Заполняем оценки за текущий месяц
  for (const grade of grades) {
    const subjectId = grade.subject.id;

    // Страховка: если предмет есть в оценках, но не попал через teacherGroupsSubject
    if (!subjectsMap[subjectId]) {
      subjectsMap[subjectId] = {
        subjectId,
        subjectTitle: grade.subject.title,
        grades: {},
        average: null,
      };
    }

    const dateKey = grade.date.toISOString().split('T')[0]; // YYYY-MM-DD
    subjectsMap[subjectId].grades[dateKey] = {
      grade: grade.grade,
      gradeId: grade.id,
      testId: grade.test_id || null,
      testTitle: grade.test_task?.title || null,
      totalQuestions: grade.test_task?.questions?.length || null,
    };
  }

  // Добавляем средний балл
  for (const subjectId of Object.keys(subjectsMap)) {
    const id = Number(subjectId);
    if (avgCountMap[id] && avgCountMap[id] > 0) {
      subjectsMap[subjectId].average = Math.round((avgSumMap[id] / avgCountMap[id]) * 100) / 100;
    }
  }

  // Сортируем по названию предмета для стабильного порядка
  return Object.values(subjectsMap).sort((a, b) =>
    a.subjectTitle.localeCompare(b.subjectTitle, 'ru')
  );
}

/**
 * Войти в группу по коду группы (course_code)
 */
async function joinGroup(studentId, groupCode) {
  const student = await prisma.student.findUnique({
    where: { user_id: Number(studentId) },
  });

  if (!student) {
    throw ApiError.notFound('Студент не найден');
  }

  const group = await prisma.group.findFirst({
    where: { course_code: groupCode.trim() },
    include: { organization: true },
  });

  if (!group) {
    throw ApiError.notFound('Группа с таким кодом не найдена');
  }

  console.log('[joinGroup] student.id:', student.id, '| group.id:', group.id, '| group.title:', group.title);

  // Проверяем, не состоит ли уже студент в этой группе
  const existing = await prisma.studentGroup.findFirst({
    where: {
      student_id: student.id,
      group_id: group.id,
    },
  });

  console.log('[joinGroup] existing record:', existing);

  if (existing) {
    throw ApiError.badRequest('Вы уже состоите в этой группе');
  }

  try {
    // Raw-check прямо перед INSERT
    const rawCheck = await prisma.$queryRaw`
      SELECT * FROM student_groups 
      WHERE student_id = ${student.id} AND group_id = ${group.id}
    `;
    console.log('[joinGroup] raw SQL check before insert:', JSON.stringify(rawCheck));
    console.log('[joinGroup] values for insert:', {
      student_id: student.id,
      group_id: group.id,
      type_student_id: typeof student.id,
      type_group_id: typeof group.id,
    });

    // Raw INSERT вместо Prisma ORM create
    const inserted = await prisma.$queryRaw`
      INSERT INTO student_groups (student_id, group_id)
      VALUES (${student.id}, ${group.id})
      ON CONFLICT DO NOTHING
      RETURNING id, student_id, group_id
    `;
    console.log('[joinGroup] inserted rows:', JSON.stringify(inserted));

    if (!inserted || inserted.length === 0) {
      // ON CONFLICT DO NOTHING — значит уже был в группе
      throw ApiError.badRequest('Вы уже состоите в этой группе');
    }
  } catch (err) {
    if (err.code === 'P2002' || (err.message && err.message.toLowerCase().includes('unique'))) {
      console.warn('[joinGroup] unique constraint hit:', err.message);
      throw ApiError.badRequest('Вы уже состоите в этой группе');
    }
    // Если это ApiError — пробрасываем дальше
    throw err;
  }

  return {
    groupId: group.id,
    groupTitle: group.title,
    organization: group.organization.name,
  };
}

module.exports = { getTests, getTestById, submitTest, getJournal, joinGroup };
