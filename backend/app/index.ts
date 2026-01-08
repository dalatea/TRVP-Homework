import express from 'express'
import { properties } from './const'
import { sequelize } from './database'
import routes from './routes'

import cors from 'cors'

(async () => {
    try {
        await sequelize.authenticate()
        console.log('Connected to database')
        await sequelize.sync()
    } catch (ex) {
        console.error(`Cannot connect to database: ${ex}`)
    }
})()

const app = express()

app.use(express.json())
app.use(cors())
app.options('*', cors())

routes(app)

app.listen(properties.port, properties.host, () => {
})