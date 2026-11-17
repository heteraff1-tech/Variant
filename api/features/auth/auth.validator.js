const {z} = require('zod')
const {ROLE_NAMES} = require('../../shared/config/constants')

const validRoles = Object.values(ROLE_NAMES)

const registerSchema = z.object({
    login: z
    .string({required_error: 'Логин обязателен'})
    .min(3, 'Логин минимум 3 символа')
    .max(30, 'Логин максимум 30 символов')
    .regex(/^[a-zA-Z0-9_]+$/, 'Логин может содержать только буквы, цифры и _')
    .transform(s => s.trim().toLowerCase()),

    password: z
    .string({required_error: 'Пароль обязателен'})
    .min(8, 'Пароль минимум 8 символов')
    .max(100, 'Пароль максимум 100 символов'),

    role: z
    .string({required_error: 'Роль обязательна'})
    .transform(s => s.trim().toLowerCase())
    .refine(r => validRoles.includes(r), {
        message: `Роль должна быть: ${validRoles.join(', ')}`,
    }),

    // Поля профиля — необязательные (для студентов и учителей)
    name: z.string().max(25, 'Имя максимум 25 символов').optional(),
    last_name: z.string().max(40, 'Фамилия максимум 40 символов').optional(),
    patronymic: z.string().max(40, 'Отчество максимум 40 символов').optional(),

    // Код организации — необязательный (для студентов/учителей)
    orgCode: z.string().max(20, 'Код организации максимум 20 символов').optional(),

    // Для администратора — название и описание организации (необязательные)
    orgName: z.string().max(25, 'Название организации максимум 25 символов').optional(),
    orgDescription: z.string().max(40, 'Описание организации максимум 40 символов').optional(),
})

const loginSchema = z.object({
  login: z
    .string({ required_error: 'Логин обязателен' })
    .min(1, 'Введите логин')
    .transform(s => s.trim().toLowerCase()),
    
  password: z
    .string({ required_error: 'Пароль обязателен' })
    .min(1, 'Введите пароль'),
});
module.exports = { registerSchema, loginSchema };