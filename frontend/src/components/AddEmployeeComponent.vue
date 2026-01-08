<script setup lang="ts">
import { reactive, ref } from 'vue'
import { use_database } from '../stores/database_store'
import { use_notification } from '../stores/notification_store'
import { Employee } from '../models/employee'

type State = 'button' | 'editing'
type Event = 'add' | 'save' | 'cancel'

const db = use_database()
const { show } = use_notification()

const emit = defineEmits<{ (e: 'saved', value: Employee): void, (e: 'invalid'): void }>()
const state = ref<State>('button')
let object = reactive({
    fullname: ''
})

function send(event: Event) {
    switch (event) {
        case 'add':
            state.value = 'editing'
            break
        case 'save':
            (async () => {
                const validation = validate()
                if (validation === true) {
                    const employee = await db.add_employee(object.fullname)
                    object = { fullname: '' }
                    emit('saved', employee)
                    state.value = 'button'
                } else {
                    emit('invalid')
                    show(validation[1], true)
                }
            })()
            break
        case 'cancel':
            object = {
                fullname: ''
            }
            state.value = 'button'
            break
    }
}

function validate(): [false, string] | true {
    if (object.fullname.trim() === '')
        return [false, 'Имя рабочего не должно быть пустым']
    return true
}
</script>

<template>
    <div class="card">
        <div class="card-header" style="background-color: #3fddebff;">
            <div class="card-header-title has-text-light">Добавление</div>
            <img class="card-header-icon"
                 src="../assets/icons/icons8-plus-24.png"
                 alt="plus"
                 v-show="state === 'button'"
                 @click="send('add')"
            />
        </div>
        <div class="card-content" v-show="state === 'editing'">
            <div>
                <div class="columns is-mobile is-align-items-center">
                    <div class="column">
                        <p>Имя:</p>
                    </div>
                    <div class="column">
                        <input class="input" v-model="object.fullname">
                    </div>
                </div>
            </div>
        </div>
        <div class="card-footer" v-show="state === 'editing'">
            <a @click="send('save')" class="card-footer-item">Сохранить</a>
            <a @click="send('cancel')" class="card-footer-item">Отменить</a>
        </div>
    </div>
</template>
