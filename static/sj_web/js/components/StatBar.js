const StatBar = {
    name: 'StatBar',
    props: {
        current: { type: Number, default: 0 },
        max: { type: Number, default: 100 },
        color: { type: String, default: '#4ade80' },
        label: { type: String, default: '' },
        showText: { type: Boolean, default: true }
    },
    template: `
        <div class="stat-bar">
            <div class="stat-bar-label" v-if="label">{{ label }}</div>
            <div class="stat-bar-track">
                <div class="stat-bar-fill" :style="{ width: percentage + '%', backgroundColor: color }"></div>
            </div>
            <div class="stat-bar-text" v-if="showText">{{ current }}/{{ max }}</div>
        </div>
    `,
    setup(props) {
        const percentage = Vue.computed(() => {
            if (props.max <= 0) return 0
            return Math.min(100, Math.max(0, (props.current / props.max) * 100))
        })
        return { percentage }
    }
}
