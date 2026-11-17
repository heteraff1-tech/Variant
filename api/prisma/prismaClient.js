const {PrismaClient} = require('@prisma/client')

const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
})

async function checkDbConnection() {
    try {
        await prisma.$connect()
        console.log('База данных успешно подключена (Prisma)')
    } catch(err) {
        console.error('Ошибка в подключении к БД: ', err.message)
        process.exit(1)
    }
    
}
if(process.env.NODE_ENV !=='test') {
    checkDbConnection()
}
module.exports = prisma