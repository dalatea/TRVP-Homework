export const properties = {
    port: Number(process.env.PORT) || 3000,
    host: process.env.HOST || 'localhost',
    database: {
        source: process.env.DATABASE_SOURCE || 'database.sqlite',
        password: process.env.DATABASE_PASSWORD || ''
    }
}