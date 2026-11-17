const {z} = require('zod')

const saveGradeSchema = z.object({
    studentId: z.number().int().positive('ID студент обязателен'),
    subjectId: z.number().int().positive('ID предмета обязателен'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Дата должна быть в формате YYYY-MM-DD'),
    grade: z.number().refine(
      (val) => (val >= 1 && val <= 5) || (val >= -3 && val <= -1),
      'Оценка должна быть от 1 до 5 или кодом -1 (Н), -2 (Б), -3 (У)'
    ),
})

const getGradesSchema = z.object({
  groupId: z.preprocess(Number, z.number().int().positive()),
  subjectId: z.preprocess(Number, z.number().int().positive()),
  month: z.preprocess(Number, z.number().int().min(1).max(12)),
  year: z.preprocess(Number, z.number().int().min(2020).max(2100)),
})

const getStudentsSchema= z.object({
  teacherId: z.preprocess(Number, z.number().int().positive()),
  groupId: z.preprocess(Number, z.number().int().positive()),
  subjectId: z.preprocess(Number, z.number().int().positive()),
});
module.exports={
    saveGradeSchema,
    getGradesSchema,
    getStudentsSchema
}