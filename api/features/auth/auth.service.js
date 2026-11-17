const bcrypt = require('bcryptjs')
const jwt = require("jsonwebtoken")
const prisma =require('../../prisma/prismaClient')
const ApiError = require("../../shared/utils/ApiError")
const {ROLES, ROLE_NAMES} = require('../../shared/config/constants')

const SALT_ROUNDS = 10

/**
 * Генерация уникального кода организации в формате XXXXX-YYYYY1
 * Пример: ORGRT-ARTTY1
 */
async function generateUniqueOrgCode() {
  const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // без I и O — чтоб не путались с 1 и 0
  const DIGITS = '0123456789';

  function randomChars(len) {
    let result = '';
    for (let i = 0; i < len; i++) {
      result += CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    return result;
  }

  let code;
  let attempts = 0;
  do {
    // Формат: 5 букв - 4 буквы + 1 цифра  (напр. ORGRT-ARTY1)
    const part1 = randomChars(5);
    const part2 = randomChars(4);
    const digit = DIGITS[Math.floor(Math.random() * DIGITS.length)];
    code = `${part1}-${part2}${digit}`;
    attempts++;
    if (attempts > 100) throw new Error('Не удалось сгенерировать уникальный код организации');
    const existing = await prisma.organization.findUnique({ where: { code } });
    if (!existing) break;
  } while (true);

  return code;
}

async function register({login, password, role, name, last_name, patronymic, orgCode, orgName, orgDescription}) {

  // Проверяем существование
  const existing = await prisma.user.findUnique({ where: { login } });
  if (existing) {
    throw ApiError.conflict('Пользователь с таким логином уже существует');
  }

  // Получаем роль
  const roleRecord = await prisma.role.findFirst({ where: { title: role } });
  if (!roleRecord) {
    throw ApiError.badRequest('Роль не найдена');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      login,
      password_hash: passwordHash,
      role_id: roleRecord.id,
      date: new Date(),
    },
    select: {
      id: true,
      login: true,
      role_id: true,
      date: true,
    },
  });

  // Для студента и учителя — создаём профиль и привязываем к организации
  if (roleRecord.id === ROLES.STUDENT || roleRecord.id === ROLES.TEACHER) {
    // Найти организацию по коду, если передан
    let organization = null;
    if (orgCode) {
      organization = await prisma.organization.findUnique({ where: { code: orgCode } });
      if (!organization) {
        await prisma.user.delete({ where: { id: user.id } });
        throw ApiError.badRequest('Организация с таким кодом не найдена');
      }
    }

    if (roleRecord.id === ROLES.STUDENT) {
      await prisma.student.create({
        data: {
          user_id: user.id,
          name: name || '',
          last_name: last_name || '',
          patronymic: patronymic || '',
        },
      });
    } else if (roleRecord.id === ROLES.TEACHER) {
      const teacher = await prisma.teacher.create({
        data: {
          user_id: user.id,
          name: name || '',
          last_name: last_name || '',
          patronymic: patronymic || '',
        },
      });
      if (organization) {
        await prisma.organizationTeacher.create({
          data: {
            teacher_id: teacher.id,
            organization_id: organization.id,
          },
        });
      }
    }
  }

  // Для администратора — создаём организацию с уникальным кодом
  if (roleRecord.id === ROLES.ADMIN) {
    const code = await generateUniqueOrgCode();
    await prisma.organization.create({
      data: {
        code,
        name: orgName || login,
        description: orgDescription || '',
        owner_id: user.id,
      },
    });
  }

  return user;

}

async function login({login, password}) {
    const user = await prisma.user.findUnique({where: {login}})

    if(!user) {
        throw ApiError.unauthorized('Неверный логин или пароль')
    }

    const isMatch = await bcrypt.compare(password, user.password_hash)
    if (!isMatch) {
        throw ApiError.unauthorized('Неверный логин или пароль')
    }

    const payload = {id: user.id, role_id: user.role_id}
    const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: '24h'})

    const {password_hash, ...userSafe} = user

    return {user: userSafe, token}
}
 async function getUser(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
        id: true,
        login: true,
        role_id: true,
        date: true,
        },
    })

    if (!user) {
        throw ApiError.notFound('Пользователь не найден')
    }

    return user;
 }

 module.exports = { register, login, getUser}