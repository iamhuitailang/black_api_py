
const PlayerSeat = Vue.defineComponent({
    name: 'PlayerSeat',
    props: {
        player: {
            type: Object,
            required: true
        },
        isCurrentUser: {
            type: Boolean,
            default: false
        },
        showRole: {
            type: Boolean,
            default: true
        },
        showScore: {
            type: Boolean,
            default: true
        }
    },
    emits: ['click'],
    setup(props, { emit }) {
        const seatClass = Vue.computed(() => {
            const classes = ['player-seat'];
            if (props.player.role) {
                classes.push(props.player.role);
            }
            if (props.player.status === 'eliminated') {
                classes.push('eliminated');
            }
            if (props.isCurrentUser) {
                classes.push('current-user');
            }
            return classes;
        });

        const avatarText = Vue.computed(() => {
            const name = props.player.nickname || props.player.username || '?';
            return Utils.getInitials(name);
        });

        const roleDisplay = Vue.computed(() => {
            if (!props.showRole || !props.player.role) return '';
            return props.player.is_ai ? '🤖' : Utils.getRoleEmoji(props.player.role);
        });

        const handleClick = () => {
            emit('click', props.player);
        };

        return {
            Utils,
            seatClass,
            avatarText,
            roleDisplay,
            handleClick
        };
    },
    template: `
        <div :class="seatClass" @click="handleClick">
            <div class="player-avatar">
                {{ avatarText }}
            </div>
            <div class="player-name">
                {{ player.nickname || player.username || '未知玩家' }}
                <span v-if="player.is_ai" style="font-size: 12px;">(AI)</span>
            </div>
            <div v-if="showRole && player.role" class="player-role">
                {{ roleDisplay }} {{ Utils.getRoleName(player.role) }}
            </div>
            <div v-if="showScore" class="player-score">
                {{ player.score || 0 }} 分
            </div>
            <div v-if="player.status === 'eliminated'" class="eliminated-badge" style="margin-top: 4px;">
                已淘汰
            </div>
        </div>
    `
});

window.PlayerSeat = PlayerSeat;
