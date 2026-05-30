
const ActionButtons = Vue.defineComponent({
    name: 'ActionButtons',
    props: {
        disabled: {
            type: Boolean,
            default: false
        },
        playerRole: {
            type: String,
            default: ''
        },
        selectedAction: {
            type: String,
            default: ''
        }
    },
    emits: ['action'],
    setup(props, { emit }) {
        const actions = [
            { id: 'obey', name: '服从', emoji: '👍', desc: '服从国王指令' },
            { id: 'refuse', name: '拒绝', emoji: '✋', desc: '拒绝执行指令' },
            { id: 'sabotage', name: '捣乱', emoji: '🎭', desc: '暗中捣乱搅局' }
        ];

        const canSabotage = Vue.computed(() => {
            return props.playerRole === 'clown';
        });

        const handleAction = (actionId) => {
            if (actionId === 'sabotage' && !canSabotage.value) {
                Utils.warning('只有小丑才能捣乱哦！');
                return;
            }
            emit('action', actionId);
        };

        return {
            actions,
            canSabotage,
            handleAction
        };
    },
    template: `
        <div class="action-buttons">
            <button
                v-for="action in actions"
                :key="action.id"
                :class="['action-btn', action.id, { active: selectedAction === action.id }]"
                :disabled="disabled || (action.id === 'sabotage' && !canSabotage)"
                :title="action.desc"
                @click="handleAction(action.id)"
            >
                {{ action.emoji }} {{ action.name }}
            </button>
        </div>
        <div style="text-align: center; margin-top: 12px; color: var(--text-light); font-size: 14px;">
            <template v-if="playerRole === 'clown'">
                🤡 你是小丑，可以选择捣乱来破坏游戏！
            </template>
            <template v-else-if="playerRole === 'civilian'">
                🤵 你是平民，服从指令获得积分！
            </template>
            <template v-else-if="playerRole === 'king'">
                👑 你是国王，等待玩家执行指令！
            </template>
        </div>
    `
});

window.ActionButtons = ActionButtons;
