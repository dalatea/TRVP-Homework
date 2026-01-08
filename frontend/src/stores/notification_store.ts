import { reactive } from 'vue'

const state = reactive({
    shown: false,
    text: ''
})

function show(text: string, show = !state.shown) {
    state.shown = show
    state.text = text
}

export function use_notification() {
    return {
        state,
        show
    }
}