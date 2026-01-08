import { DATEONLY, INTEGER, STRING } from 'sequelize'
import { properties } from './const'
import { Column, ForeignKey, HasMany, Model, Sequelize, Table } from 'sequelize-typescript'

export const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: properties.database.source,
    password: properties.database.password
})

@Table({ timestamps: false })
export class Employee extends Model<Employee> {
    @Column({
        allowNull: false,
        type: STRING(64)
    })
    declare fullname: string

    @HasMany(() => Request)
    declare requests: Request[]
}

@Table({ timestamps: false })
export class Request extends Model<Request> {
    @ForeignKey(() => Facility)
    @Column({
        allowNull: false,
        type: INTEGER
    })
    declare FacilityId: number

    @Column({
        allowNull: false,
        type: DATEONLY
    })
    declare start_booking: Date

    @Column({
        allowNull: false,
        type: DATEONLY
    })
    declare end_booking: Date

    @ForeignKey(() => Employee)
    @Column({
        allowNull: false,
        type: INTEGER
    })
    declare EmployeeId: number
}

@Table({ timestamps: false })
export class Facility extends Model<Facility> {
    @Column({
        allowNull: false,
        type: STRING(10),
        unique: true
    })
    declare name: string

    @Column({
        allowNull: false,
        type: INTEGER
    })
    declare amount: number

    @HasMany(() => Request)
    declare requests: Request[]
}

sequelize.addModels([Employee, Request, Facility])