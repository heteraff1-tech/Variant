const {z} = require('zod')

const initProfileSchema = z.object({
    name: z.string().min(2, 'Имя должно быть не короче 2 символов').trim(),
    lastName: z.string().min(2, 'Фамилия должна быть не короче 2 символов').trim(),
    patronymic: z.string().optional().or(z.literal('')),
    organizationCode: z.string().min(10, 'Код организации не меньше 10 символов')
})

const addGradeSchema = z.object({
    studentId: z.number().int().positive(),
    subjectId: z.number().int().positive(),
    date: z.string().datetime(),
    grade: z.union([
        z.number().min(1).max(5),
        z.number().min(-3).max(-1)
    ])
})

const getGradesSchema = z.object({
  groupId: z.preprocess((val) => Number(val), z.number().int().positive()),
  subjectId: z.preprocess((val) => Number(val), z.number().int().positive()),
  month: z.preprocess((val) => Number(val), z.number().min(1).max(12)),
  year: z.preprocess((val) => Number(val), z.number().min(2020).max(2100)),
});

module.exports = {
  initProfileSchema,
  addGradeSchema,
  getGradesSchema
};