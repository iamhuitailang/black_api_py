
const GameStatus = Vue.defineComponent({
    name: 'GameStatus',
    props: {
        game: {
            type: Object,
            required: true
        },
        players: {
            type: Array,
            default: () => []
        },
        currentRound: {
            type: Number,
            default: 1
        },
        totalRounds: {
            type: Number,
            default: 5
        }
    },
    setup(props) {
        const activePlayers = Vue.computed(() => {
            return props.players.filter(p => p.status !== 'eliminated');
        });

        const eliminatedPlayers = Vue.computed(() => {
            return props.players.filter(p => p.status === 'eliminated');
        });

        const kingPlayer = Vue.computed(() => {
            return props.players.find(p => p.role === 'king' && p.status !== 'eliminated');
        });

        const statusText = Vue.computed(() => {
            const statusMap = {
                'waiting': '等待开始',
                'playing': '游戏中',
                'paused': '已暂停',
                'finished': '已结束'
            };
            return statusMap[props.game.status] || props.game.status;
        });

        return {
            activePlayers,
            eliminatedPlayers,
            kingPlayer,
            statusText
        };
    },
    template: `
        <div class="status-bar">
            <div class="status-item">
                <span class="status-label">🏆 游戏状态:</span>
                <span class="status-value">{{ statusText }}</span>
            </div>
            <div class="status-item">
                <span class="status-label">🔄 回合:</span>
                <span class="status-value">{{ currentRound }} / {{ totalRounds }}</span>
            </div>
            <div class="status-item">
                <span class="status-label">👥 存活人数:</span>
                <span class="status-value" style="color: var(--success-color);">
                    {{ activePlayers.length }}
                </span>
            </div>
            <div class="status-item">
                <span class="status-label">💀 淘汰人数:</span>
                <span class="status-value" style="color: var(--danger-color);">
                    {{ eliminatedPlayers.length }}
                </span>
            </div>
            <div class="status-item" v-if="kingPlayer">
                <span class="status-label">👑 当前国王:</span>
                <span class="status-value" style="color: var(--king-color);">
                    {{ kingPlayer.nickname || kingPlayer.username }}
                </span>
            </div>
            <div class="status-item">
                <span class="status-label">🎮 房间号:</span>
                <span class="status-value" style="font-family: monospace;">
                    {{ game.room_code }}
                </span>
            </div>
        </div>
    `
});

window.GameStatus = GameStatus;
