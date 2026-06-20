const { createApp, ref, computed, onMounted, onUnmounted } = Vue;

const API_BASE = '/api';

const UPGRADE_COSTS = {
    1: 0, 2: 100, 3: 250, 4: 500, 5: 1000,
    6: 2000, 7: 4000, 8: 8000, 9: 16000, 10: 32000
};

createApp({
    setup() {
        const gameStarted = ref(false);
        const gameOver = ref(false);
        const gameOverReason = ref('');
        
        const distance = ref(0);
        const speed = ref(10);
        const fuel = ref(100);
        const maxFuel = ref(100);
        const cargoCapacity = ref(50);
        
        const carriages = ref([]);
        const currentEvent = ref(null);
        const bandits = ref([]);
        const roadblockCost = ref(20);
        const bridgeCountdown = ref(5);
        const trackSwitched = ref(false);
        
        const recentEvents = ref([]);
        const message = ref(null);
        
        const isShaking = ref(false);
        let gameLoop = null;
        let eventPollTimer = null;

        const fuelPercent = computed(() => {
            return maxFuel.value > 0 ? (fuel.value / maxFuel.value * 100) : 0;
        });

        const getUpgradeCost = (level) => {
            return UPGRADE_COSTS[level + 1] || 999999;
        };

        const formatTime = (isoString) => {
            const date = new Date(isoString);
            return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        };

        const showMessage = (code, msg) => {
            message.value = { code, message: msg };
            setTimeout(() => {
                message.value = null;
            }, 2000);
        };

        const apiCall = async (endpoint, method = 'GET', data = null) => {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                }
            };
            if (data) {
                options.body = JSON.stringify(data);
            }
            
            try {
                const response = await fetch(`${API_BASE}${endpoint}`, options);
                const result = await response.json();
                return result;
            } catch (error) {
                console.error('API Error:', error);
                return { code: 1, message: '网络错误', data: null };
            }
        };

        const updateGameState = (data) => {
            if (!data) return;
            
            const state = data.game_state;
            if (state) {
                distance.value = state.distance;
                speed.value = state.speed;
                fuel.value = state.fuel;
                maxFuel.value = state.max_fuel;
            }
            
            if (data.carriages) {
                carriages.value = data.carriages;
                const cargoCarriage = data.carriages.find(c => c.carriage_type === 'cargo');
                if (cargoCarriage) {
                    cargoCapacity.value = cargoCarriage.cargo_capacity;
                }
            }
            
            currentEvent.value = data.current_event;
            
            if (data.current_event_data) {
                const ed = data.current_event_data;
                if (ed.bandits) bandits.value = ed.bandits;
                if (ed.clear_cost) roadblockCost.value = ed.clear_cost;
                if (ed.countdown !== undefined) bridgeCountdown.value = ed.countdown;
                if (ed.track_switched !== undefined) trackSwitched.value = ed.track_switched;
            } else {
                bandits.value = [];
                trackSwitched.value = false;
            }
            
            if (data.event_result && data.event_result.message) {
                showMessage(0, data.event_result.message);
                if (data.event_result.message.includes('伤害')) {
                    triggerShake();
                }
            }
        };

        const triggerShake = () => {
            isShaking.value = true;
            setTimeout(() => {
                isShaking.value = false;
            }, 300);
        };

        const startGame = async () => {
            const result = await apiCall('/train/start', 'POST');
            if (result.code === 0) {
                gameStarted.value = true;
                gameOver.value = false;
                updateGameState(result.data);
                startGameLoop();
                loadEvents();
                showMessage(0, '列车启动！');
            } else {
                showMessage(1, result.message);
            }
        };

        const restartGame = async () => {
            gameOver.value = false;
            gameOverReason.value = '';
            await startGame();
        };

        const startGameLoop = () => {
            if (gameLoop) clearInterval(gameLoop);
            gameLoop = setInterval(async () => {
                if (gameOver.value) {
                    clearInterval(gameLoop);
                    return;
                }
                
                const result = await apiCall('/train/tick', 'POST', { delta_seconds: 0.5 });
                if (result.code === 0) {
                    updateGameState(result.data);
                } else {
                    gameOver.value = true;
                    gameOverReason.value = result.message;
                    clearInterval(gameLoop);
                }
            }, 500);
        };

        const loadEvents = async () => {
            if (eventPollTimer) clearInterval(eventPollTimer);
            eventPollTimer = setInterval(async () => {
                const result = await apiCall('/train/events/get?limit=20', 'GET');
                if (result.code === 0 && result.data) {
                    recentEvents.value = result.data;
                }
            }, 2000);
        };

        const fireWeapon = async () => {
            const result = await apiCall('/train/fire', 'POST');
            showMessage(result.code, result.message);
            if (result.code === 0) {
                const state = await apiCall('/train/state/get', 'GET');
                if (state.code === 0) {
                    updateGameState(state.data);
                }
            }
        };

        const clearRoadblock = async () => {
            const result = await apiCall('/train/clearroadblock', 'POST');
            showMessage(result.code, result.message);
            if (result.code === 0) {
                const state = await apiCall('/train/state/get', 'GET');
                if (state.code === 0) {
                    updateGameState(state.data);
                }
            }
        };

        const switchTrack = async () => {
            const result = await apiCall('/train/switchtrack', 'POST');
            showMessage(result.code, result.message);
            if (result.code === 0) {
                trackSwitched.value = true;
            }
        };

        const refuel = async () => {
            const result = await apiCall('/train/refuel', 'POST');
            showMessage(result.code, result.message);
            if (result.code === 0) {
                const state = await apiCall('/train/state/get', 'GET');
                if (state.code === 0) {
                    updateGameState(state.data);
                }
            }
        };

        const upgradeCarriage = async (carriageType) => {
            const result = await apiCall('/train/upgrade', 'POST', { carriage_type: carriageType });
            showMessage(result.code, result.message);
            if (result.code === 0) {
                const state = await apiCall('/train/state/get', 'GET');
                if (state.code === 0) {
                    updateGameState(state.data);
                }
            }
        };

        const repairCarriage = async (carriageType) => {
            const result = await apiCall('/train/repair', 'POST', { carriage_type: carriageType, amount: 20 });
            showMessage(result.code, result.message);
            if (result.code === 0) {
                const state = await apiCall('/train/state/get', 'GET');
                if (state.code === 0) {
                    updateGameState(state.data);
                }
            }
        };

        const checkExistingGame = async () => {
            const result = await apiCall('/train/state/get', 'GET');
            if (result.code === 0 && result.data && result.data.game_state && result.data.game_state.is_running === 1) {
                gameStarted.value = true;
                updateGameState(result.data);
                startGameLoop();
                loadEvents();
            }
        };

        onMounted(() => {
            checkExistingGame();
        });

        onUnmounted(() => {
            if (gameLoop) clearInterval(gameLoop);
            if (eventPollTimer) clearInterval(eventPollTimer);
        });

        return {
            gameStarted,
            gameOver,
            gameOverReason,
            distance,
            speed,
            fuel,
            maxFuel,
            cargoCapacity,
            carriages,
            currentEvent,
            bandits,
            roadblockCost,
            bridgeCountdown,
            trackSwitched,
            recentEvents,
            message,
            isShaking,
            fuelPercent,
            getUpgradeCost,
            formatTime,
            startGame,
            restartGame,
            fireWeapon,
            clearRoadblock,
            switchTrack,
            refuel,
            upgradeCarriage,
            repairCarriage,
        };
    }
}).mount('#app');
