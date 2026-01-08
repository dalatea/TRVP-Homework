<script lang="ts">
import { defineComponent } from 'vue'
import { use_database } from '../stores/database_store'
import { use_notification } from '../stores/notification_store'
import { Request } from '../models/request'
import bulmaCalendar from 'bulma-calendar'
import { overlaps } from '../utils'

type State = 'loading' | 'viewing' | 'editing'
type Event = 'edit' | 'save' | 'cancel' | 'load' | 'remove'

const db = use_database()
const { show } = use_notification()

export default defineComponent({
    props: {
        employee_id: { type: Number, required: true },
        request_id: { type: Number, required: true }
    },
    emits: ['saved', 'invalid', 'deleted', 'moved'],
    async mounted() {
        this.request = await db.get_request_by_id(this.employee_id, this.request_id)
        for (const id of db.employees.value) {
            this.names.push([id, (await db.get_employee_by_id(id)).fullname])
        }

         await this.$nextTick()

        const input = this.$refs.dateInput as HTMLInputElement | undefined
        if (input) {
        const calendar = bulmaCalendar.attach(input, {
            startDate: this.request.start_booking,
            endDate: this.request.end_booking,
            isRange: true
        })[0]

        if (!calendar) return

        calendar.on('select', (args: any) => {
            this.request!.start_booking = /^\d{4}-\d{2}-\d{2}$/.test(String(args.data.startDate))
                ? new Date(`${args.data.startDate}T00:00:00`)
                : new Date(args.data.startDate)

            this.request!.end_booking = /^\d{4}-\d{2}-\d{2}$/.test(String(args.data.endDate))
                ? new Date(`${args.data.endDate}T00:00:00`)
                : new Date(args.data.endDate)
            })

        this.send('load')
    }
    },
    data() {
        return {
            state: 'viewing' as State,
            request: undefined as Request | undefined,
            target_employee_id: this.employee_id,
            names: [] as [number, string][]
        }
    },
    methods: {
        async validate(): Promise<true | [false, string]> {
            if (!this.request) return [false, 'Заявка не загружена']

            const start = this.request.start_booking
            const end = this.request.end_booking

            if (!(start instanceof Date) || Number.isNaN(start.getTime())) return [false, 'Некорректная дата начала']
            if (!(end instanceof Date) || Number.isNaN(end.getTime())) return [false, 'Некорректная дата окончания']
            if (start >= end) return [false, 'Дата начала должна быть раньше даты окончания']

            return true
        },
        send(event: any) {
            switch (event) {
                case 'edit':
                    this.state = 'editing'
                    break
                case 'save':
                    (async () => {
                        const validation = await this.validate()
                        if (validation === true) {
                            if (this.target_employee_id !== this.employee_id) {
                                await db.remove_request_by_id(this.employee_id, this.request_id)
                                await db.add_request(this.target_employee_id, this.request.facility, this.request.start_booking, this.request.end_booking)
                                this.$emit('moved')
                            } else {
                                console.log(this.request)
                                await db.update_request(this.employee_id, this.request)
                                this.$emit('saved')
                            }
                            this.state = 'viewing'
                        } else {
                            show(validation[1], true)
                            this.$emit('invalid')
                        }
                    })()
                    break
                case 'cancel':
                    db.get_request_by_id(this.employee_id, this.request_id)
                        .then(t => this.request = t)
                        .then(_ => this.state = 'viewing')
                    break
                case 'load':
                    this.state = 'viewing'
                    break
                case 'remove':
                    db.remove_request_by_id(this.employee_id, this.request_id)
                        .then(_ => this.$emit('deleted'))
                    break
            }
        },
        formatDate(v: any) {
            if (v === null || v === undefined || v === '') return ''

            let d: Date

            if (v instanceof Date) {
                d = v
            } else if (typeof v === 'string') {
                // DATEONLY: "YYYY-MM-DD"
                if (/^\d{4}-\d{2}-\d{2}$/.test(v)) d = new Date(`${v}T00:00:00`)
                else d = new Date(v) 
            } else {
                // timestamp / прочие типы
                d = new Date(v)
            }

            if (Number.isNaN(d.getTime())) return '' 

            return d.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })
            }
    }
})
</script>

<template>
    <div class="card" draggable="true" v-if="request !== undefined">
        <div class="card-header has-background-light">
            <div class="card-header-title has-text-dark">
                ID заявки: {{ request.id }}.
                Оборудование: «{{ request.facility.name }}»
            </div>
        </div>
        <div class="card-content">
            <div>
                <div class="columns is-mobile">
                    <div class="column is-4">
                        <p>Бронирование:</p>
                    </div>
                    <div class="column is-8" v-if="state === 'viewing'">
                        C <strong>{{ formatDate(request.start_booking) }}</strong>
                        по <strong>{{ formatDate(request.end_booking) }}</strong>
                    </div>
                    <div v-show="state === 'editing'" class="column">
                        <input ref="dateInput" type="date">
                    </div>
                </div>
            </div>
            <div>
                <div class="columns is-mobile is-align-items-center" v-if="state === 'editing'">
                    <div class="column">Переместить к:</div>
                    <div class="column">
                        <div class="select">
                            <select v-model="target_employee_id">
                                <option selected disabled>Выбрать</option>
                                <option v-for="name in names" :key="name[0]" :value="name[0]">{{ name[1] }}</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="card-footer" v-if="state === 'viewing'">
            <a @click="send('edit')" class="card-footer-item">Изменить</a>
            <a @click="send('remove')" class="card-footer-item">Удалить</a>
        </div>
        <div class="card-footer" v-else>
            <a @click="send('save')" class="card-footer-item">Сохранить</a>
            <a @click="send('cancel')" class="card-footer-item">Отменить</a>
        </div>
    </div>
</template>

<style scoped>
.w-100 {
    max-width: 100%;
    min-width: 100%;
    width: 100%;
    resize: vertical;
    height: auto;
}
</style>