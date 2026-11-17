const prisma = require('../../../prisma/prismaClient');
const ApiError = require('../../../shared/utils/ApiError');
const path = require('path');
const fs = require('fs');

/**
 * Сохранить загруженный файл в public/uploads и вернуть путь
 */
function saveUploadedFile(file) {
  if (!file) return null;

  const uploadDir = path.join(__dirname, '../../../public/uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const ext = path.extname(file.originalname);
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
  const destPath = path.join(uploadDir, filename);

  fs.writeFileSync(destPath, file.buffer);
  return `/uploads/${filename}`;
}

/**
 * Создать тест с вопросами, ответами и назначением группам
 * Поддерживаемые типы вопросов:
 *  - single_choice / multiple_choice (варианты ответов с is_correct)
 *  - open_answer (эталонный ответ)
 *  - matching (пары left/right)
 *  - ordering (элементы в правильном порядке)
 *  - fill_blanks (текст с {пропусками})
 */
async function createTest(teacherId, data, files) {
  const { title, description, beginning_date, end_date, time, subject_id, group_ids, questions, shuffle_questions } = data;

  // Проверяем, что учитель существует
  const teacher = await prisma.teacher.findUnique({
    where: { id: Number(teacherId) },
  });
  if (!teacher) {
    throw ApiError.notFound('Учитель не найден');
  }

  // Проверяем, что предмет назначен этому учителю
  const teacherSubject = await prisma.teacherSubject.findFirst({
    where: { teacher_id: Number(teacherId), subject_id: Number(subject_id) },
  });
  if (!teacherSubject) {
    throw ApiError.forbidden('Этот предмет не назначен данному учителю');
  }

  // Сохраняем обложку теста (обязательна)
  const coverFile = files?.img?.[0];
  if (!coverFile) {
    throw ApiError.badRequest('Обложка теста обязательна');
  }
  const imgPath = saveUploadedFile(coverFile);

  // Парсим вопросы из JSON-строки
  let parsedQuestions = [];
  try {
    parsedQuestions = typeof questions === 'string' ? JSON.parse(questions) : questions;
  } catch {
    throw ApiError.badRequest('Некорректный формат вопросов');
  }

  // Парсим group_ids
  let parsedGroupIds = [];
  try {
    parsedGroupIds = typeof group_ids === 'string' ? JSON.parse(group_ids) : group_ids;
  } catch {
    throw ApiError.badRequest('Некорректный формат групп');
  }

  if (!parsedGroupIds || parsedGroupIds.length === 0) {
    throw ApiError.badRequest('Выберите хотя бы одну группу');
  }

  if (!parsedQuestions || parsedQuestions.length === 0) {
    throw ApiError.badRequest('Добавьте хотя бы один вопрос');
  }

  // Парсим shuffle_questions
  const shouldShuffle = shuffle_questions === true || shuffle_questions === 'true';

  // Создаём всё в транзакции
  const test = await prisma.$transaction(async (tx) => {
    // 1. Создаём тест
    const newTest = await tx.testTask.create({
      data: {
        teacher_id: Number(teacherId),
        subject_id: Number(subject_id),
        title,
        description: description || null,
        img: imgPath,
        beginning_date: beginning_date ? new Date(beginning_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        time: Number(time),
        shuffle_questions: shouldShuffle,
      },
    });

    // 2. Назначаем группам
    for (const groupId of parsedGroupIds) {
      await tx.testAssignedGroup.create({
        data: {
          test_id: newTest.id,
          group_id: Number(groupId),
        },
      });
    }

    // 3. Создаём вопросы и ответы
    for (let qIdx = 0; qIdx < parsedQuestions.length; qIdx++) {
      const q = parsedQuestions[qIdx];
      const questionType = q.question_type || 'single_choice';

      // Изображение к вопросу (если есть)
      const questionImageFile = files?.[`questionImage_${qIdx}`]?.[0];
      const questionImgPath = saveUploadedFile(questionImageFile);

      const newQuestion = await tx.question.create({
        data: {
          test_task_id: newTest.id,
          description: q.description,
          img: questionImgPath,
          order_index: qIdx,
          question_type: questionType,
        },
      });

      // Создаём ответы в зависимости от типа вопроса
      switch (questionType) {
        case 'single_choice':
        case 'multiple_choice': {
          // Стандартные варианты ответов
          for (let aIdx = 0; aIdx < q.answers.length; aIdx++) {
            const a = q.answers[aIdx];
            await tx.answer.create({
              data: {
                question_id: newQuestion.id,
                text: a.text,
                is_correct: Boolean(a.isCorrect),
                order_index: aIdx,
              },
            });
          }
          break;
        }

        case 'open_answer': {
          // Один эталонный ответ
          await tx.answer.create({
            data: {
              question_id: newQuestion.id,
              text: q.correctAnswer || '',
              is_correct: true,
              order_index: 0,
            },
          });
          break;
        }

        case 'matching': {
          // Пары: left -> right
          for (let pIdx = 0; pIdx < q.pairs.length; pIdx++) {
            const pair = q.pairs[pIdx];
            await tx.answer.create({
              data: {
                question_id: newQuestion.id,
                text: pair.left,
                match_text: pair.right,
                is_correct: true,
                order_index: pIdx,
              },
            });
          }
          break;
        }

        case 'ordering': {
          // Элементы в правильном порядке
          for (let iIdx = 0; iIdx < q.items.length; iIdx++) {
            const item = q.items[iIdx];
            await tx.answer.create({
              data: {
                question_id: newQuestion.id,
                text: item.text,
                is_correct: true,
                order_index: iIdx,
                correct_position: iIdx,
              },
            });
          }
          break;
        }

        case 'fill_blanks': {
          // Парсим {ответ} из description
          const blanks = [];
          const regex = /\{([^}]+)\}/g;
          let match;
          while ((match = regex.exec(q.description)) !== null) {
            blanks.push(match[1]);
          }

          for (let bIdx = 0; bIdx < blanks.length; bIdx++) {
            await tx.answer.create({
              data: {
                question_id: newQuestion.id,
                text: blanks[bIdx],
                is_correct: true,
                order_index: bIdx,
                correct_position: bIdx,
              },
            });
          }
          break;
        }

        default:
          throw ApiError.badRequest(`Неизвестный тип вопроса: ${questionType}`);
      }
    }

    return newTest;
  });

  return test;
}

module.exports = { createTest };
