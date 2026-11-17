const { z } = require('zod');
// Схема для обновления преподавателя
const updateTeacherSchema = z.object({
  subjects: z.array(
    z.object({
      subject_id: z.number().int().positive('ID предмета обязателен'),
      group_ids: z.array(z.number().int().positive()).min(1, 'Выберите хотя бы одну группу'),
    })
  ),
});
// Схема для создания группы
const createGroupSchema = z.object({
  title: z.string().min(2, 'Название группы минимум 2 символа').trim(),
  course: z.number().int().min(1).max(6, 'Курс должен быть от 1 до 6'),
  courseCode: z.string().optional(), // Опционально
});
// Схема для создания предмета
const createSubjectSchema = z.object({
  title: z.string().min(2, 'Название предмета минимум 2 символа').trim(),
});
// Схема для обновления предметов
const updateSubjectsSchema = z.object({
  subjects: z.array(
    z.object({
      id: z.number().int().positive().optional(), // Если есть id - обновляем, нет - создаем
      title: z.string().min(2, 'Название минимум 2 символа').trim(),
      _action: z.enum(['create', 'update', 'delete']).optional(),
    })
  ),
});
module.exports = {
  updateTeacherSchema,
  createGroupSchema,
  createSubjectSchema,
  updateSubjectsSchema,
};