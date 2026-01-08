import { type Ref, ref } from 'vue'
import { Employee } from '../models/employee'
import { use_notification } from './notification_store'
import { Request } from '../models/request'
import { create, delete_, read, update } from '../utils'
import { Facility } from '../models/facility'

const employees_db: Ref<Set<number>> = ref(new Set())

const { show } = use_notification()

async function reload_store() {
    employees_db.value.clear()
    await read<number[]>('/api/employee/')
        .then(it => employees_db.value = new Set(it))
        .catch(e => show(`Невозможно подключиться к серверу: ${e}`, true))
}

reload_store().then()

export function use_database() {
    return {
        employees: employees_db,

        async add_employee(fullname: string) {
            const { id } = await create('/api/employee/', { fullname })
            employees_db.value.add(id)
            return new Employee(fullname, [], id)
        },
        async get_employee_by_id(id: number) {
            return await read<Employee>(`/api/employee/${id}`)
        },
        async remove_employee_by_id(id: number) {
            await delete_(`/api/employee/${id}`)
            employees_db.value.delete(id)
        },
        async update_employee({ fullname, id }: Employee) {
            await update(`/api/employee/${id}`, { fullname })
        },
        async add_request(mentor_id: number, facility: Facility, start_booking: Date, end_booking: Date) {
            const { id } = await create(`/api/employee/${mentor_id}/request`, {
                start_booking,
                end_booking,
                FacilityId: facility.id
            })
            return new Request(id, facility, start_booking, end_booking)
        },
        async remove_request_by_id(mentor_id: number, team_id: number) {
            await delete_(`/api/employee/${mentor_id}/request/${team_id}`)
        },
        async update_request(mentor_id: number, { id, facility, start_booking, end_booking }: Request) {
            await update(`/api/employee/${mentor_id}/request/${id}`, {
                start_booking,
                end_booking,
                FacilityId: facility.id
            })
        },
        async get_request_by_id(mentor_id: number, team_id: number) {
            const dto = await read<any>(`/api/employee/${mentor_id}/request/${team_id}`)

            const toDate = (v: any): Date => {
                if (v instanceof Date) return v

                if (typeof v === 'string') {

                    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
                        return new Date(`${v}T00:00:00`)
                    }

                    const d1 = new Date(v)
                    if (!Number.isNaN(d1.getTime())) return d1

                    const m = v.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
                    if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00`)
                }

                const d2 = new Date(v)
                return d2
            }

            const facility =
                dto.facility ??
                (dto.FacilityId
                    ? { id: dto.FacilityId, name: undefined, amount: undefined }
                    : { id: undefined, name: undefined, amount: undefined })

            return new Request(
                dto.id,
                facility,
                toDate(dto.start_booking),
                toDate(dto.end_booking)
            )
        },
        async get_facilities() {
            return await read<Facility[]>('/api/facilities')
        },
        async get_all_requests() {
            const requests = await read<{
                id: number,
                start_booking: string,
                end_booking: string
            }[]>(`/api/request`)
            return requests.map(r => {
                return { id: r.id, start_booking: new Date(r.start_booking), end_booking: new Date(r.end_booking) }
            })
        },
        reload_store
    }
}