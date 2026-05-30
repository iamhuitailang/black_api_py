
const CommandCard = Vue.defineComponent({
    name: 'CommandCard',
    props: {
        command: {
            type: Object,
            default: null
        },
        timer: {
            type: Number,
            default: 0
        },
        isKing: {
            type: Boolean,
            default: false
        }
    },
    setup(props) {
        const commandTypeNames = {
            'fun': '趣味互动',
            'position': '位置互动',
            'speech': '言语互动',
            'performance': '整活互动',
            'special': '特殊指令'
        };

        const typeName = Vue.computed(() => {
            if (!props.command) return '';
            return commandTypeNames[props.command.command_type] || props.command.command_type;
        });

        const timerDisplay = Vue.computed(() => {
            return Utils.formatTime(props.timer);
        });

        const timerColor = Vue.computed(() => {
            if (props.timer <= 5) return 'var(--danger-color)';
            if (props.timer <= 10) return 'var(--warning-color)';
            return 'var(--success-color)';
        });

        return {
            typeName,
            timerDisplay,
            timerColor
        };
    },
    template: `
        <div class="command-area">
            <template v-if="command">
                <div class="command-title">
                    👑 国王指令 - {{ typeName }}
                </div>
                <div class="command-content">
                    {{ command.content }}
                </div>
                <div class="command-duration">
                    ⏱️ 执行时长: {{ command.duration }}秒
                </div>
                <div v-if="timer > 0" class="timer" :style="{ color: timerColor }">
                    {{ timerDisplay }}
                </div>
                <div v-if="command.penalty" style="margin-top: 12px; color: var(--danger-color);">
                    ⚠️ 惩罚分值: {{ command.penalty }}分
                </div>
            </template>
            <template v-else>
                <div v-if="isKing" style="font-size: 18px; color: var(--text-light);">
                    请发布你的指令 🎪
                </div>
                <div v-else style="font-size: 18px; color: var(--text-light);">
                    等待国王发布指令... 👑
                </div>
            </template>
        </div>
    `
});

window.CommandCard = CommandCard;
