const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Проверяем все constraint'ы на таблице student_groups
  const constraints = await prisma.$queryRaw`
    SELECT constraint_name, constraint_type 
    FROM information_schema.table_constraints 
    WHERE table_name = 'student_groups'
  `;
  console.log('=== CONSTRAINTS ===');
  console.log(JSON.stringify(constraints, null, 2));

  // Смотрим столбцы уникальных индексов
  const indexes = await prisma.$queryRaw`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'student_groups'
  `;
  console.log('=== INDEXES ===');
  console.log(JSON.stringify(indexes, null, 2));

  // Смотрим реальные записи для student_id=103
  const rows = await prisma.$queryRaw`
    SELECT * FROM student_groups WHERE student_id = 103
  `;
  console.log('=== ROWS for student_id=103 ===');
  console.log(JSON.stringify(rows, null, 2));
}

main().finally(() => prisma.$disconnect());
