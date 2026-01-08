<script setup lang="ts">
import { use_database } from '../stores/database_store'
import { use_notification } from '../stores/notification_store'
import type { Request } from '../models/request'
import { onMounted, ref } from 'vue'
import type { Employee } from '../models/employee'
import bulmaCalendar from 'bulma-calendar'
import { Facility } from '../models/facility'
import { overlaps } from '../utils'
import type { PropType } from 'vue'

type State = 'button' | 'editing'
type Event = 'add' | 'save' | 'cancel'

const db = use_database()
const { show } = use_notification()

const props = defineProps({
  employee: { type: Object as PropType<Employee>, required: true }
})

const emit = defineEmits<{ (e: 'saved', value: Request): void, (e: 'invalid'): void }>()
const state = ref<State>('button')
const facilities = ref<Facility[]>([])
const requests = ref([])
const object = ref(default_object())

onMounted(() => {
    db.get_facilities().then(f => facilities.value = f)
    db.get_all_requests().then(r => requests.value = r)

    const calendar = bulmaCalendar.attach('input[type = date]', {
        isRange: true,
        startDate: object.value.start_booking,
        endDate: object.value.end_booking
    })[0]
    calendar.on('select', args => {
        object.value.start_booking = args.data.startDate
        object.value.end_booking = args.data.endDate
    })
})

function validate(): [false, string] | true {
    if (object.value.end_booking === undefined || object.value.start_booking === undefined)
        return [false, 'Не выбран промежуток времени для бронирования']
    if (object.value.end_booking <= object.value.start_booking)
        return [false, 'Конец бронирования оборудования не должен быть раньше начала']
    if (object.value.facility.id === undefined)
        return [false, 'Выберите оборудование']
    // if (object.value.facility.amount === 0)
    //     return [false, 'Оборудования не осталось']
    const d = (x: any) => (x instanceof Date ? x : new Date(x + 'T00:00:00'))

    const facilityId = object.value.facility?.id

    if (facilityId === undefined) return [false, 'Выберите оборудование']

    const sameFacility = requests.value.filter((r: any) => r.FacilityId === facilityId)

    for (const r of sameFacility) {
    if (overlaps(
        { from: d(r.start_booking), to: d(r.end_booking) },
        { from: d(object.value.start_booking), to: d(object.value.end_booking) }
    )) {
        return [false, 'Бронирования пересекаются']
    }
    }
    return true
}

function default_object(): Omit<Request, 'id'> {
    return {
        facility: {
            id: undefined,
            name: undefined,
            amount: undefined
        },
        end_booking: undefined,
        start_booking: undefined
    }
}

function send(event: Event) {
    switch (event) {
        case 'add':
            state.value = 'editing'
            break
        case 'save':
            (async () => {
                const validated = validate()
                if (validated !== true) {
                emit('invalid')
                show(validated[1], true)
                return
                }

                try {
                const request = await db.add_request(
                    props.employee.id,
                    object.value.facility,
                    object.value.start_booking,
                    object.value.end_booking
                )

                emit('saved', request)
                state.value = 'button'
                object.value = default_object()

                facilities.value = await db.get_facilities()
                requests.value = await db.get_all_requests() 
                } catch (e: any) {
                console.error(e)
                show(e?.message ?? 'Ошибка при сохранении', true) 
                }
            })()
            break
        case 'cancel':
            object.value = default_object()
            state.value = 'button'
            break
    }
}
</script>

<template>
    <div class="card">
        <div class="card-header has-background-info-dark" style="background-color: #3fddebff;">
            <div class="card-header-title has-text-white" style="background-color: #3fddebff;">Добавление</div>
            <img class="card-header-icon" style="background-color: #3fddebff;"
                 src="../assets/icons/icons8-plus-24.png"
                 alt="plus"
                 v-show="state === 'button' && props.employee.requests.length <= 4"
                 @click="send('add')"
            >
        </div>
        <div class="card-content" v-show="state === 'editing'">
            <div class="columns is-mobile is-align-items-center">
                <div class="column is-4">
                    <p>Оборудование:</p>
                </div>
                <div class="column">
                    <div class="is-flex is-align-items-center">
                        <div class="select">
                            <select v-model="object.facility">
                                <option disabled :value="default_object().facility">Выбрать</option>
                                <option v-for="facility in facilities" :key="facility.id" :value="facility">
                                    {{ facility.name }}
                                </option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="columns is-mobile">
                <div class="column is-4">
                    <p>Бронирование:</p>
                </div>
                <div class="column">
                    <input type="date">
                </div>
            </div>
        </div>
        <div class="card-footer" v-show="state === 'editing'">
            <a @click="send('save')" class="card-footer-item">Сохранить</a>
            <a @click="send('cancel')" class="card-footer-item">Отменить</a>
        </div>
    </div>
</template>
