
const GameView = Vue.defineComponent({
    name: 'GameView',
    setup() {
        const router = window.ChouchouRouter;
        const route = router.currentRoute.value;
        const gameId = route.params.id;

        const game = Vue.ref(null);
        const players = Vue.ref([]);
        const currentCommand = Vue.ref(null);
        const timer = Vue.ref(0);
        const selectedAction = Vue.ref('');
        const hasSubmitted = Vue.ref(false);
        const gamePhase = Vue.ref('waiting');
        const countdown = Vue.ref(0);
        const showCommandModal = Vue.ref(false);
        const showResultModal = Vue.ref(false);
        const roundResults = Vue.ref([]);
        const winner = Vue.ref(null);
        const loading = Vue.ref(false);
        let timerInterval = null;
        let pollInterval = null;

        const commandForm = Vue.reactive({
            command_type: 'fun',
            content: '',
            duration: 3
        });

        const baseCommands = [
            { type: 'fun', name: '趣味互动', content: '模仿马戏动物动作', duration: 3, penalty: 5 },
            { type: 'position', name: '位置互动', content: '赛场指定站位集结', duration: 2, penalty: 4 },
            { type: 'speech', name: '言语互动', content: '说出马戏趣味台词', duration: 2, penalty: 3 },
            { type: 'performance', name: '整活互动', content: '即兴马戏小表演', duration: 5, penalty: 7 }
        ];

        const specialCommands = [
            { type: 'parade', name: '全员马戏巡游', desc: '全体统一移动站位', cooldown: 1 },
            { type: 'confuse', name: '小丑迷惑术', desc: '混淆国王指令', cooldown: 2 },
            { type: 'protect', name: '平民组团护驾', desc: '抵消轻度惩罚', cooldown: 1 }
        ];

        const currentPlayer = Vue.computed(() => {
            if (!game.value || !Store.user) return null;
            return players.value.find(p => p.user_id === Store.user.id && !p.is_ai);
        });

        const isKing = Vue.computed(() => {
            return currentPlayer.value && currentPlayer.value.role === 'king';
        });

        const isHost = Vue.computed(() => {
            return game.value && game.value.host_id === Store.user?.id;
        });

        const canStartGame = Vue.computed(() => {
            return isHost.value &&
                   game.value?.status === 'waiting' &&
                   (players.value?.length || 0) >= (game.value?.min_players || 3);
        });

        const loadGame = async () => {
            const result = await API.game.get(gameId);
            if (result) {
                game.value = result.game;
                players.value = result.players || [];
                currentCommand.value = result.current_command || null;

                if (result.game.status === 'finished') {
                    gamePhase.value = 'finished';
                    winner.value = result.winner;
                    showResultModal.value = true;
                } else if (result.current_command && result.current_command.status === 'active') {
                    gamePhase.value = 'executing';
                } else if (result.game.status === 'playing') {
                    gamePhase.value = 'playing';
                } else {
                    gamePhase.value = 'waiting';
                }
            }
        };

        const startGame = async () => {
            if (!canStartGame.value) return;

            loading.value = true;
            try {
                const result = await API.game.start(gameId);
                if (result) {
                    game.value = result.game;
                    players.value = result.players || [];
                    currentCommand.value = result.current_command || null;
                    gamePhase.value = 'playing';
                    Utils.success('游戏开始！身份已分配！');
                    if (result.current_command && result.current_command.status === 'active') {
                        gamePhase.value = 'executing';
                    } else if (isKing.value) {
                        showCommandModal.value = true;
                    }
                }
            } finally {
                loading.value = false;
            }
        };

        const selectCommand = (cmd) => {
            commandForm.command_type = cmd.type;
            commandForm.content = cmd.content;
            commandForm.duration = cmd.duration;
        };

        const issueCommand = async () => {
            if (!commandForm.content.trim()) {
                Utils.warning('请输入或选择指令内容');
                return;
            }

            loading.value = true;
            try {
                const result = await API.game.issueCommand(
                    gameId,
                    commandForm.command_type,
                    commandForm.content,
                    commandForm.duration
                );
                if (result) {
                    currentCommand.value = result.command;
                    showCommandModal.value = false;
                    gamePhase.value = 'executing';
                    hasSubmitted.value = false;
                    selectedAction.value = '';
                    startTimer(commandForm.duration);
                    Utils.success('指令已发布！');
                }
            } finally {
                loading.value = false;
            }
        };

        const startTimer = (seconds) => {
            clearInterval(timerInterval);
            timer.value = seconds;

            timerInterval = setInterval(() => {
                timer.value--;
                if (timer.value <= 0) {
                    clearInterval(timerInterval);
                    resolveCurrentCommand();
                }
            }, 1000);
        };

        const submitAction = async (action) => {
            if (hasSubmitted.value || !currentCommand.value) return;
            if (currentPlayer.value?.status === 'eliminated') {
                Utils.warning('你已被淘汰，无法参与本轮');
                return;
            }

            selectedAction.value = action;
            hasSubmitted.value = true;

            try {
                const result = await API.game.submitAction(
                    gameId,
                    currentCommand.value.id,
                    currentPlayer.value.id,
                    action
                );
                if (result) {
                    Utils.success(`已选择${Utils.getActionName(action)}`);
                    setTimeout(() => {
                        loadGame();
                    }, 500);
                }
            } catch (e) {
                hasSubmitted.value = false;
                selectedAction.value = '';
            }
        };

        const resolveCurrentCommand = async () => {
            clearInterval(timerInterval);
            loading.value = true;

            try {
                const result = await API.game.resolveCommand(gameId, currentCommand.value?.id);
                if (result) {
                    roundResults.value = result.results || [];
                    gamePhase.value = 'result';
                    showResultModal.value = true;

                    if (result.game) {
                        game.value = result.game;
                    }
                    if (result.eliminated && result.eliminated.length > 0) {
                        const loadResult = await API.game.get(gameId);
                        if (loadResult) {
                            players.value = loadResult.players || [];
                            game.value = loadResult.game;
                        }
                    }

                    if (game.value?.status === 'finished') {
                        gamePhase.value = 'finished';
                        winner.value = result.winner;
                    }

                    currentCommand.value = null;
                }
            } finally {
                loading.value = false;
            }
        };

        const nextRound = async () => {
            showResultModal.value = false;
            roundResults.value = [];
            hasSubmitted.value = false;
            selectedAction.value = '';

            if (gamePhase.value === 'finished') {
                router.push('/lobby');
                return;
            }

            loading.value = true;
            try {
                const result = await API.game.nextRound(gameId);
                if (result) {
                    game.value = result.game || game.value;
                    players.value = result.players || players.value;
                }
            } finally {
                loading.value = false;
            }

            gamePhase.value = 'playing';
            if (isKing.value) {
                showCommandModal.value = true;
            }
        };

        const leaveGame = async () => {
            if (confirm('确定要离开游戏吗？')) {
                await API.game.leave(gameId);
                Store.clearCurrentGame();
                router.push('/lobby');
            }
        };

        const startPolling = () => {
            pollInterval = setInterval(() => {
                if (gamePhase.value === 'playing' || gamePhase.value === 'waiting' || gamePhase.value === 'executing') {
                    loadGame();
                }
            }, 3000);
        };

        const stopPolling = () => {
            if (pollInterval) {
                clearInterval(pollInterval);
                pollInterval = null;
            }
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
        };

        Vue.onMounted(() => {
            loadGame();
            startPolling();
        });

        Vue.onUnmounted(() => {
            stopPolling();
        });

        return {
            Store,
            Utils,
            game,
            players,
            currentCommand,
            timer,
            selectedAction,
            hasSubmitted,
            gamePhase,
            countdown,
            showCommandModal,
            showResultModal,
            roundResults,
            winner,
            loading,
            commandForm,
            baseCommands,
            specialCommands,
            currentPlayer,
            isKing,
            isHost,
            canStartGame,
            startGame,
            selectCommand,
            issueCommand,
            submitAction,
            nextRound,
            leaveGame
        };
    },
    template: `
        <div>
            <header class="header">
                <h1>🎪 {{ game?.name || '游戏中' }}</h1>
                <nav>
                    <button @click="leaveGame">🚪 离开</button>
                    <ThemeSwitcher />
                </nav>
            </header>

            <div class="container">
                <div v-if="!game" class="loading">
                    <div class="spinner"></div>
                </div>

                <template v-else>
                    <GameStatus
                        :game="game"
                        :players="players"
                        :current-round="game.current_round || 1"
                        :total-rounds="game.total_rounds || 5"
                    />

                    <div v-if="gamePhase === 'waiting'" class="game-arena">
                        <div style="text-align: center; margin-bottom: 32px;">
                            <h2 style="color: var(--primary-color); margin-bottom: 16px;">⏳ 等待游戏开始</h2>
                            <p style="color: var(--text-light);">
                                当前 {{ players.length }}/{{ game.min_players }} 人，{{ game.max_players }}人满员
                            </p>

                            <div v-if="isHost" style="margin-top: 24px;">
                                <button
                                    class="btn btn-primary btn-lg"
                                    :disabled="!canStartGame || loading"
                                    @click="startGame"
                                >
                                    {{ loading ? '准备中...' : '🎮 开始游戏' }}
                                </button>
                                <p v-if="!canStartGame" style="margin-top: 12px; color: var(--warning-color);">
                                    需要至少 {{ game.min_players }} 名玩家才能开始
                                </p>
                            </div>
                            <div v-else style="margin-top: 24px;">
                                <p style="color: var(--text-light);">等待房主开始游戏...</p>
                            </div>
                        </div>

                        <div class="seats-container">
                            <PlayerSeat
                                v-for="player in players"
                                :key="player.id"
                                :player="player"
                                :is-current-user="player.user_id === Store.user?.id && !player.is_ai"
                                :show-role="false"
                                :show-score="false"
                            />
                        </div>
                    </div>

                    <div v-else class="game-arena">
                        <div class="seats-container">
                            <PlayerSeat
                                v-for="player in players"
                                :key="player.id"
                                :player="player"
                                :is-current-user="player.user_id === Store.user?.id && !player.is_ai"
                            />
                        </div>

                        <div v-if="currentPlayer && currentPlayer.status === 'eliminated'"
                             style="text-align: center; padding: 20px; margin: 20px 0; background: rgba(231, 76, 60, 0.1); border-radius: 12px;">
                            <p style="color: var(--danger-color); font-size: 18px;">💀 你已被淘汰，观看其他玩家对决吧！</p>
                        </div>

                        <CommandCard
                            :command="currentCommand"
                            :timer="timer"
                            :is-king="isKing"
                        />

                        <div v-if="gamePhase === 'executing' && currentCommand && currentPlayer?.status !== 'eliminated'">
                            <ActionButtons
                                :disabled="hasSubmitted"
                                :player-role="currentPlayer?.role"
                                :selected-action="selectedAction"
                                @action="submitAction"
                            />
                            <div v-if="hasSubmitted" style="text-align: center; margin-top: 16px; color: var(--success-color); font-size: 18px;">
                                ✅ 已选择 {{ Utils.getActionName(selectedAction) }}，等待其他玩家...
                            </div>
                        </div>

                        <div v-if="isKing && gamePhase === 'playing'" style="text-align: center; margin-top: 24px;">
                            <button class="btn btn-primary btn-lg" @click="showCommandModal = true">
                                📢 发布指令
                            </button>
                        </div>
                    </div>
                </template>
            </div>

            <div v-if="showCommandModal" class="modal-overlay" @click.self="showCommandModal = false">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>📢 发布国王指令</h3>
                        <button class="close-btn" @click="showCommandModal = false">&times;</button>
                    </div>

                    <div class="form-group">
                        <label>选择指令类型</label>
                        <div class="grid grid-2">
                            <button
                                v-for="cmd in baseCommands"
                                :key="cmd.type"
                                :class="['btn', commandForm.command_type === cmd.type ? 'btn-primary' : 'btn-outline']"
                                style="text-align: left; padding: 16px;"
                                @click="selectCommand(cmd)"
                            >
                                <div style="font-weight: bold;">{{ cmd.name }}</div>
                                <div style="font-size: 12px; opacity: 0.8;">{{ cmd.content }}</div>
                                <div style="font-size: 12px; margin-top: 4px;">
                                    ⏱️ {{ cmd.duration }}秒 | ⚠️ 惩罚: {{ cmd.penalty }}分
                                </div>
                            </button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>指令内容</label>
                        <textarea
                            v-model="commandForm.content"
                            rows="3"
                            placeholder="输入你想要发布的指令..."
                            style="width: 100%; padding: 12px; border: 2px solid var(--border-color); border-radius: 8px; font-family: inherit; font-size: 16px; resize: vertical;"
                        ></textarea>
                    </div>

                    <div class="form-group">
                        <label>执行时长: {{ commandForm.duration }}秒</label>
                        <input
                            type="range"
                            v-model="commandForm.duration"
                            min="2"
                            max="15"
                            step="1"
                        />
                    </div>

                    <div style="display: flex; gap: 12px; margin-top: 24px;">
                        <button class="btn btn-outline" style="flex: 1;" @click="showCommandModal = false">
                            取消
                        </button>
                        <button class="btn btn-primary" style="flex: 1;" :disabled="loading || !commandForm.content.trim()" @click="issueCommand">
                            {{ loading ? '发布中...' : '📢 发布指令' }}
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="showResultModal" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>{{ gamePhase === 'finished' ? '🏆 游戏结束' : '📊 回合结果' }}</h3>
                    </div>

                    <div v-if="gamePhase === 'finished' && winner" class="winner-banner">
                        <h2>🎉 恭喜获胜！</h2>
                        <div class="winner-name">
                            {{ Utils.getRoleEmoji(winner.role) }} {{ winner.nickname || '未知' }}
                        </div>
                        <div class="winner-score">
                            {{ Utils.getRoleName(winner.role) }} | {{ winner.score || 0 }} 分
                        </div>
                    </div>

                    <div v-else>
                        <h4 style="margin-bottom: 16px; color: var(--primary-color);">
                            第 {{ game?.current_round || 1 }} 回合结果
                        </h4>
                    </div>

                    <div class="results-list">
                        <div
                            v-for="(result, index) in roundResults"
                            :key="index"
                            :class="['result-item', result.result === 'success' || result.is_punished === false ? 'success' : 'failed']"
                        >
                            <div>
                                <span style="font-weight: bold;">
                                    {{ Utils.getRoleEmoji(result.role) }}
                                    {{ result.nickname || '未知' }}
                                </span>
                                <span style="margin-left: 8px; color: var(--text-light);">
                                    ({{ Utils.getRoleName(result.role) }})
                                </span>
                                <span style="margin-left: 8px; font-size: 12px;">
                                    → {{ Utils.getActionName(result.action) }}
                                </span>
                            </div>
                            <div :class="result.score_change >= 0 ? 'score-positive' : 'score-negative'">
                                {{ result.score_change >= 0 ? '+' : '' }}{{ result.score_change || 0 }} 分
                            </div>
                        </div>
                    </div>

                    <div v-if="roundResults.length === 0" class="empty-state" style="padding: 20px;">
                        <div class="empty-state-icon">📊</div>
                        <div class="empty-state-text">暂无结果</div>
                    </div>

                    <button
                        class="btn btn-primary btn-lg"
                        style="width: 100%; margin-top: 24px;"
                        @click="nextRound"
                    >
                        {{ gamePhase === 'finished' ? '🏠 返回大厅' : '➡️ 下一回合' }}
                    </button>
                </div>
            </div>
        </div>
    `
});

window.GameView = GameView;
