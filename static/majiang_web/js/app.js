const { createApp, ref, reactive, computed, onMounted, watch } = Vue;

createApp({
    setup() {
        const isLoggedIn = ref(AuthService.isLoggedIn());
        const currentPage = ref('home');
        const authMode = ref('login');
        const userInfo = reactive(AuthService.getCurrentUser());
        const userStats = reactive({});
        const gameHistory = ref([]);

        const loginForm = reactive({
            username: '',
            password: ''
        });

        const registerForm = reactive({
            username: '',
            nickname: '',
            password: '',
            confirmPassword: ''
        });

        const toast = reactive({
            show: false,
            message: '',
            type: 'success'
        });

        const gameState = reactive({
            game_record_id: null,
            my_hand: { tiles: [] },
            ai_players: [],
            discards: [],
            tiles_remaining: 0,
            current_player: '',
            is_my_turn: false,
            is_ready: false,
            waiting_tiles: [],
            last_discard: null,
            game_over: false,
            winner: null,
            can_hu: false,
            turn_count: 0
        });

        const selectedTile = ref(null);
        const hasDrawn = ref(false);
        const huResult = reactive({});
        const aiList = ref([]);

        const rankingTabs = [
            { type: 1, name: '日榜' },
            { type: 2, name: '周榜' },
            { type: 3, name: '月榜' },
            { type: 4, name: '总榜' }
        ];
        const currentRankingType = ref(4);
        const rankingList = ref([]);
        const myRanking = ref(null);

        const achievements = ref([]);

        const profileForm = reactive({
            nickname: '',
            avatar: ''
        });

        const passwordForm = reactive({
            oldPassword: '',
            newPassword: '',
            confirmPassword: ''
        });

        const winRate = computed(() => {
            const total = userStats.total_games || 0;
            const wins = userStats.wins || 0;
            return total > 0 ? Math.round(wins / total * 100) : 0;
        });

        const sortedHand = computed(() => {
            const tiles = gameState.my_hand?.tiles || [];
            return [...tiles].sort((a, b) => {
                const typeOrder = { wan: 0, tiao: 1, tong: 2, feng: 3, jian: 4 };
                const typeDiff = typeOrder[a.type] - typeOrder[b.type];
                if (typeDiff !== 0) return typeDiff;
                return a.value - b.value;
            });
        });

        const unlockedCount = computed(() => {
            return achievements.value.filter(a => a.unlocked).length;
        });

        const progressPercent = computed(() => {
            if (achievements.value.length === 0) return 0;
            return Math.round(unlockedCount.value / achievements.value.length * 100);
        });

        function showToast(message, type = 'success') {
            toast.message = message;
            toast.type = type;
            toast.show = true;
            setTimeout(() => {
                toast.show = false;
            }, 3000);
        }

        function navigate(page) {
            currentPage.value = page;
            if (page === 'home') {
                loadUserStats();
                loadGameHistory();
            } else if (page === 'game') {
                loadAiList();
                loadGameState();
            } else if (page === 'ranking') {
                loadRanking();
            } else if (page === 'achievement') {
                loadAchievements();
            } else if (page === 'profile') {
                loadProfile();
            }
        }

        async function handleLogin() {
            if (!loginForm.username || !loginForm.password) {
                showToast('请输入用户名和密码', 'error');
                return;
            }

            const result = await AuthService.login(loginForm.username, loginForm.password);
            if (result.code === 0) {
                Object.assign(userInfo, result.data.user);
                isLoggedIn.value = true;
                showToast('登录成功');
                navigate('home');
            } else {
                showToast(result.msg || '登录失败', 'error');
            }
        }

        async function handleRegister() {
            if (!registerForm.username || !registerForm.nickname || !registerForm.password) {
                showToast('请填写完整信息', 'error');
                return;
            }

            if (registerForm.password !== registerForm.confirmPassword) {
                showToast('两次密码输入不一致', 'error');
                return;
            }

            const result = await AuthService.register(
                registerForm.username,
                registerForm.nickname,
                registerForm.password
            );

            if (result.code === 0) {
                showToast('注册成功，请登录');
                authMode.value = 'login';
            } else {
                showToast(result.msg || '注册失败', 'error');
            }
        }

        async function logout() {
            await AuthService.logout();
            isLoggedIn.value = false;
            showToast('已退出登录');
        }

        async function loadUserStats() {
            const result = await api.user.getStatistics();
            if (result.code === 0 && result.data) {
                Object.assign(userStats, result.data.game_stats || {});
                Object.assign(userInfo, result.data.user || {});
            }
        }

        async function loadGameHistory() {
            const result = await api.user.getGameHistory({ page: 1, page_size: 10 });
            if (result.code === 0 && result.data) {
                gameHistory.value = result.data.items || [];
            }
        }

        async function loadAiList() {
            const result = await api.ai.getAll();
            if (result.code === 0) {
                aiList.value = result.data || [];
            }
        }

        async function loadGameState() {
            const result = await api.game.getState();
            if (result.code === 0 && result.data) {
                Object.assign(gameState, result.data);
                hasDrawn.value = false;
                selectedTile.value = null;
            } else {
                resetGameState();
            }
        }

        function resetGameState() {
            Object.assign(gameState, {
                game_record_id: null,
                my_hand: { tiles: [] },
                ai_players: [],
                discards: [],
                tiles_remaining: 0,
                current_player: '',
                is_my_turn: false,
                is_ready: false,
                waiting_tiles: [],
                last_discard: null,
                game_over: false,
                winner: null,
                can_hu: false,
                turn_count: 0
            });
            hasDrawn.value = false;
            selectedTile.value = null;
        }

        async function startGame(difficulty) {
            const result = await api.game.create(difficulty);
            if (result.code === 0) {
                Object.assign(gameState, result.data);
                hasDrawn.value = false;
                selectedTile.value = null;
                showToast('游戏开始！');
            } else {
                showToast(result.msg || '创建游戏失败', 'error');
            }
        }

        async function startTestGame(testType) {
            const result = await api.game.createTest(testType);
            if (result.code === 0) {
                Object.assign(gameState, result.data);
                hasDrawn.value = false;
                selectedTile.value = null;
                showToast(`测试游戏开始！${result.data.is_ready ? '已听牌' : ''}`);
                if (result.data.is_ready) {
                    setTimeout(() => {
                        showToast(`听牌！等待 ${result.data.waiting_tiles?.length || 0} 张`, 'info');
                    }, 800);
                }
            } else {
                showToast(result.msg || '创建游戏失败', 'error');
            }
        }

        function selectTile(idx) {
            if (!gameState.is_my_turn || !hasDrawn.value) return;
            selectedTile.value = selectedTile.value === idx ? null : idx;
        }

        async function handleDraw() {
            if (!gameState.is_my_turn || hasDrawn.value) return;

            const result = await api.game.draw();
            if (result.code === 0) {
                gameState.my_hand = result.data.my_hand;
                gameState.tiles_remaining = result.data.tiles_remaining;
                gameState.is_ready = result.data.is_ready;
                gameState.waiting_tiles = result.data.waiting_tiles;
                gameState.can_hu = result.data.can_hu;
                hasDrawn.value = true;
                selectedTile.value = null;

                if (result.data.can_hu) {
                    showToast('可以胡牌了！', 'success');
                }
            } else {
                showToast(result.msg || '摸牌失败', 'error');
            }
        }

        async function handleDiscard() {
            if (selectedTile.value === null) {
                showToast('请选择要打出的牌', 'error');
                return;
            }

            const tile = sortedHand.value[selectedTile.value];
            const result = await api.game.discard({
                tile_type: tile.type,
                value: tile.value
            });

            if (result.code === 0) {
                gameState.my_hand = result.data.my_hand;
                gameState.discards.push(result.data.discarded_tile);
                gameState.last_discard = {
                    tile: result.data.discarded_tile,
                    player: 'player'
                };
                gameState.is_my_turn = false;
                gameState.is_ready = result.data.is_ready || false;
                gameState.waiting_tiles = result.data.waiting_tiles || [];
                gameState.can_hu = false;
                hasDrawn.value = false;
                selectedTile.value = null;

                if (result.data.is_ready) {
                    showToast('听牌！等待 ' + result.data.waiting_tiles.length + ' 张', 'info');
                }
            } else {
                showToast(result.msg || '出牌失败', 'error');
            }
        }

        async function handleAiPlay() {
            const result = await api.game.aiPlay();
            if (result.code === 0) {
                if (result.data.game_over) {
                    gameState.game_over = true;
                    gameState.winner = result.data.winner;
                    showToast(result.data.winner === 'player' ? '你赢了！' : 'AI赢了', result.data.winner === 'player' ? 'success' : 'error');
                } else {
                    gameState.discards.push(result.data.discarded_tile);
                    gameState.last_discard = {
                        tile: result.data.discarded_tile,
                        player: result.data.ai_player
                    };
                    gameState.is_my_turn = true;
                    hasDrawn.value = false;
                    selectedTile.value = null;
                }
                loadGameState();
            } else {
                showToast(result.msg || 'AI出牌失败', 'error');
            }
        }

        async function handleHu() {
            const result = await api.game.hu();
            if (result.code === 0) {
                gameState.game_over = true;
                gameState.winner = 'player';
                Object.assign(huResult, result.data);
                showToast('恭喜胡牌！', 'success');
                loadUserStats();
            } else {
                showToast(result.msg || '胡牌失败', 'error');
            }
        }

        async function handleCancelGame() {
            await api.game.cancel();
            resetGameState();
            showToast('游戏已取消');
        }

        function startNewGame() {
            resetGameState();
            Object.assign(huResult, {});
        }

        function getTileDisplay(tile) {
            if (!tile) return '';
            const typeMap = {
                wan: '万',
                tiao: '条',
                tong: '筒',
                feng: '',
                jian: ''
            };
            const valueMap = {
                1: '一', 2: '二', 3: '三', 4: '四', 5: '五',
                6: '六', 7: '七', 8: '八', 9: '九'
            };
            const fengMap = {
                1: '东', 2: '南', 3: '西', 4: '北'
            };
            const jianMap = {
                1: '中', 2: '发', 3: '白'
            };

            if (tile.type === 'feng') {
                return fengMap[tile.value] || tile.value;
            }
            if (tile.type === 'jian') {
                return jianMap[tile.value] || tile.value;
            }
            return (valueMap[tile.value] || tile.value) + typeMap[tile.type];
        }

        async function loadRanking() {
            const result = await api.ranking.get({ ranking_type: currentRankingType.value, limit: 20 });
            if (result.code === 0 && result.data) {
                rankingList.value = result.data.items || [];
            }

            const myResult = await api.ranking.getUser(currentRankingType.value);
            if (myResult.code === 0) {
                myRanking.value = myResult.data;
            }
        }

        watch(currentRankingType, () => {
            loadRanking();
        });

        async function loadAchievements() {
            const result = await api.achievement.getUser();
            if (result.code === 0) {
                achievements.value = result.data || [];
            }
        }

        async function claimReward(achievementId) {
            const result = await api.achievement.claim(achievementId);
            if (result.code === 0) {
                showToast('奖励领取成功！');
                loadAchievements();
                loadUserStats();
            } else {
                showToast(result.msg || '领取失败', 'error');
            }
        }

        function loadProfile() {
            profileForm.nickname = userInfo.nickname || '';
            profileForm.avatar = userInfo.avatar || '';
        }

        async function updateProfile() {
            const data = {};
            if (profileForm.nickname) data.nickname = profileForm.nickname;
            if (profileForm.avatar) data.avatar = profileForm.avatar;

            const result = await api.user.updateProfile(data);
            if (result.code === 0) {
                Object.assign(userInfo, result.data);
                AuthService.updateUser(result.data);
                showToast('资料更新成功');
            } else {
                showToast(result.msg || '更新失败', 'error');
            }
        }

        async function changePassword() {
            if (!passwordForm.oldPassword || !passwordForm.newPassword) {
                showToast('请填写完整信息', 'error');
                return;
            }

            if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                showToast('两次密码输入不一致', 'error');
                return;
            }

            const result = await api.user.changePassword({
                old_password: passwordForm.oldPassword,
                new_password: passwordForm.newPassword
            });

            if (result.code === 0) {
                showToast('密码修改成功');
                passwordForm.oldPassword = '';
                passwordForm.newPassword = '';
                passwordForm.confirmPassword = '';
            } else {
                showToast(result.msg || '修改失败', 'error');
            }
        }

        async function checkAuthAndRestore() {
            if (!isLoggedIn.value) return;
            
            try {
                const result = await api.user.getCurrent();
                if (result.code === 0 && result.data) {
                    Object.assign(userInfo, result.data);
                    AuthService.updateUser(result.data);
                    loadUserStats();

                    const stateResult = await api.game.getState();
                    if (stateResult.code === 0 && stateResult.data && !stateResult.data.game_over) {
                        Object.assign(gameState, stateResult.data);
                        hasDrawn.value = false;
                        selectedTile.value = null;
                        currentPage.value = 'game';
                    }
                } else {
                    isLoggedIn.value = false;
                    api.clearToken();
                    Storage.removeUser();
                }
            } catch (e) {
                console.error('Auth check failed:', e);
            }
        }

        onMounted(() => {
            checkAuthAndRestore();
        });

        return {
            isLoggedIn,
            currentPage,
            authMode,
            userInfo,
            userStats,
            gameHistory,
            loginForm,
            registerForm,
            toast,
            gameState,
            selectedTile,
            hasDrawn,
            huResult,
            aiList,
            rankingTabs,
            currentRankingType,
            rankingList,
            myRanking,
            achievements,
            profileForm,
            passwordForm,
            winRate,
            sortedHand,
            unlockedCount,
            progressPercent,
            navigate,
            handleLogin,
            handleRegister,
            logout,
            selectTile,
            handleDraw,
            handleDiscard,
            handleAiPlay,
            handleHu,
            handleCancelGame,
            startNewGame,
            startGame,
            startTestGame,
            getTileDisplay,
            claimReward,
            updateProfile,
            changePassword
        };
    }
}).mount('#app');
