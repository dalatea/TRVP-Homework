import { Express } from 'express'
import { Employee, Facility, Request } from './database'
import { Op } from 'sequelize'

const not_found_msg = {
    message: 'Not Found'
}

const ok_msg = {
    message: 'Ok'
}

const created = (id: number) => {
    return { message: 'Ok', id }
}

export default function routes(app: Express) {
    app.get('/api/employee', async (_, res) => {
        const employees = await Employee.findAll({
            attributes: { include: ['id'] }
        })
        res.json(employees.map(it => it.id))
    })

    app.delete('/api/employee/:id', async (req, res) => {
        const employeeId = Number(req.params.id)

        await Request.destroy({ where: { EmployeeId: employeeId } })

        const deleted = await Employee.destroy({ where: { id: employeeId } })
        if (!deleted) return res.status(404).json(not_found_msg)

        return res.json(ok_msg)
    })

    app.get('/api/employee/:id', async (req, res) => {
        const employee = await Employee.findByPk(req.params.id, {
            include: [Request]
        })
        if (employee === null)
            return res.status(404).json(not_found_msg)

        employee.requests?.sort(
            (a, b) => new Date(a.start_booking).getTime() - new Date(b.start_booking).getTime()
        )

        res.json(employee)
    })

    app.get('/api/employee/:id/request/:req_id', async (req, res) => {
        const employeeId = Number(req.params.id)
        const reqId = Number(req.params.req_id)

        const request = await Request.findOne({
            where: { id: reqId, EmployeeId: employeeId }
        })

        if (!request) return res.status(404).json({ message: 'Not Found' })

        const facility = await Facility.findByPk(request.FacilityId)
        if (!facility) return res.status(404).json({ message: 'Facility not found' })

        return res.json({
            ...request.get(),
            facility: facility.get()
        })
    })

    app.post('/api/employee/:id/request', async (req, res) => {
        try {
            const employeeId = Number(req.params.id)
            const { FacilityId, start_booking, end_booking } = req.body

            if (!FacilityId || !start_booking || !end_booking) {
                return res.status(400).json({ message: 'Некорректные данные' })
            }

            const facility = await Facility.findByPk(FacilityId)
            if (!facility) return res.status(400).json({ message: 'Оборудование не найдено' })

            const busyCount = await Request.count({
                where: {
                    FacilityId,
                    start_booking: { [Op.lte]: end_booking },
                    end_booking: { [Op.gte]: start_booking }
                }
            })

            if (busyCount >= facility.amount) {
                return res.status(409).json({ message: 'Оборудование недоступно на выбранные даты' })
            }

            const request = await Request.create({
                EmployeeId: employeeId,
                FacilityId,
                start_booking,
                end_booking
            } as any)

            return res.status(201).json({ message: 'Ok', id: request.id })
        } catch (ex) {
            return res.status(400).json({ message: String(ex) })
        }
    })

    app.patch('/api/employee/:id/request/:req_id', async (req, res) => {
        try {
            const request = await Request.findByPk(req.params.req_id)
            if (!request) return res.status(404).json(not_found_msg)

            const FacilityId = req.body.FacilityId ?? request.FacilityId
            const start_booking = req.body.start_booking ?? request.start_booking
            const end_booking = req.body.end_booking ?? request.end_booking

            const facility = await Facility.findByPk(FacilityId)
            if (!facility) return res.status(400).json({ message: 'Оборудование не найдено' })

            const busyCount = await Request.count({
                where: {
                    id: { [Op.ne]: request.id },
                    FacilityId,
                    start_booking: { [Op.lte]: end_booking },
                    end_booking: { [Op.gte]: start_booking }
                }
            })

            if (busyCount >= facility.amount) {
                return res.status(409).json({ message: 'Оборудование недоступно на выбранные даты' })
            }

            await request.update({ FacilityId, start_booking, end_booking })
            return res.json(ok_msg)
        } catch (ex) {
            return res.status(400).json({ message: String(ex) })
        }
    })

    app.delete('/api/employee/:id/request/:req_id', async (req, res) => {
        await Request.destroy({ where: { id: req.params.req_id } })
        return res.json(ok_msg)
    })

    app.post('/api/employee', async (req, res) => {
        try {
            const mentor = await Employee.create(req.body)
            return res.json(created(mentor.id))
        } catch (ex) {
            return res.status(400).json({ message: ex })
        }
    })

    app.patch('/api/employee/:id', async (req, res) => {
        try {
            const mentor = await Employee.findByPk(req.params.id)
            await mentor?.update(req.body)
            await mentor?.save()
            res.json(ok_msg)
        } catch (ex) {
            res.status(400).json({ message: ex })
        }
    })

    app.get('/api/facilities', async (req, res) => {
        res.json(await Facility.findAll())
    })

    app.get('/api/request', async (req, res) => {
        return res.json(await Request.findAll())
    })
}
