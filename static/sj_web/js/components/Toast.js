const Toast = {
    name: 'Toast',
    template: `
        <div class="toast-container">
            <transition-group name="toast">
                <div v-for="toast in toasts" :key="toast.id"
                     :class="['toast-item', 'toast-' + toast.type]"
                     @click="remove(toast.id)">
                    {{ toast.msg }}
                </div>
            </transition-group>
        </div>
    `,
    setup() {
        const toasts = Vue.computed(() => SjStore.toasts)
        const remove = (id) => SjStore.removeToast(id)
        return { toasts, remove }
    }
}
