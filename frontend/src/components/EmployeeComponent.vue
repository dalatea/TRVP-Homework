<script lang="ts">
import type { Employee } from '../models/employee'
import { defineComponent } from 'vue'
import { use_database } from '../stores/database_store'

type State = 'unloaded' | 'loaded' | 'editing'
type Event = 'load' | 'edit' | 'save' | 'cancel' | 'select'

const db = use_database()

export default defineComponent({
    props: {
        employee_id: { type: Number, required: true }
    },
    emits: ['selected', 'deleted'],
    async mounted() {
        this.employee = await db.get_employee_by_id(this.employee_id)
        this.send('load')
    },
    methods: {
        send(event: Event) {
            switch (event) {
                case 'load':
                    this.state = 'loaded'
                    break
                case 'edit':
                    this.state = 'editing'
                    break
                case 'save':
                    db.update_employee(this.employee)
                        .then(_ => this.state = 'loaded')
                    break
                case 'cancel':
                    db.get_employee_by_id(this.employee_id)
                        .then(m => this.mentor = m)
                        .then(_ => this.state = 'loaded')
                    break
                case 'select':
                    this.$emit('selected', this.employee)
                    break
            }
        }
    },
    data() {
        return {
            employee: undefined as Employee | undefined,
            state: 'unloaded' as State
        }
    }
})
</script>

<template>
    <progress class="progress" v-if="state === 'unloaded'" />
    <div class="card" v-else>
        <div class="card-header has-background-light">
            <div class="card-header-title has-text-dark" v-if="state !== 'editing'">
            <strong class="mr-2">{{ employee.id }}.</strong>
            {{ employee.fullname }}
            </div>
            <div class="card-header-title has-text-dark" v-else>
                <input class="input" type="text" v-model="employee.fullname" />
            </div>
        </div>
        <div class="card-footer" v-if="state == 'loaded'">
            <a @click="send('select')" class="card-footer-item">Выбрать</a>
            <a @click="send('edit')" class="card-footer-item">Изменить</a>
            <a @click="$emit('deleted', employee)" class="card-footer-item">Удалить</a>
        </div>
        <div class="card-footer" v-else-if="state == 'editing'">
            <a @click="send('save')" class="card-footer-item">Сохранить</a>
            <a @click="send('cancel')" class="card-footer-item">Отменить</a>
        </div>
    </div>
</template>
