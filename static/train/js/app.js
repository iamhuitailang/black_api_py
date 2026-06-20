(function() {
    'use strict';

    const API_BASE = '/api';

    const UPGRADE_COSTS = {
        1: 0, 2: 100, 3: 250, 4: 500, 5: 1000,
        6: 2000, 7: 4000, 8: 8000, 9: 16000, 10: 32000
    };

    const safeNum = function(v, def) {
        const n = Number(v);
        return isNaN(n) ? (def !== undefined ? def : 0) : n;
    };

    const safeStr = function(v, def) {
        return v === null || v === undefined ? (def || '') : String(v);
    };

    const Vue = window.Vue;
    if (!Vue) {
        document.getElementById('app').innerHTML = '<div style="color:red;padding:20px;text-align:center;">Vue加载失败，请刷新页面重试</div>';
        return;
    }

    const { createApp, ref, computed, onMounted, onUnmounted } = Vue;

    createApp({
        setup() {
            const apiError = ref('');
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

            const displayDistance = computed(function() {
                try {
                    return safeNum(distance.value).toFixed(1);
                } catch(e) { return '0.0'; }
            });

            const displaySpeed = computed(function() {
                try {
                    return safeNum(speed.value).toFixed(1);
                } catch(e) { return '10.0'; }
            });

            const displayFuel = computed(function() {
                try {
                    return safeNum(fuel.value).toFixed(1);
                } catch(e) { return '100.0'; }
            });

            const fuelPercent = computed(function() {
                try {
                    const mf = safeNum(maxFuel.value, 100);
                    if (mf <= 0) return 0;
                    const p = (safeNum(fuel.value) / mf) * 100;
                    return Math.max(0, Math.min(100, p));
                } catch(e) { return 0; }
            });

            const displayBridgeCountdown = computed(function() {
                try {
                    return safeNum(bridgeCountdown.value, 5).toFixed(1);
                } catch(e) { return '5.0'; }
            });

            const getUpgradeCost = function(level) {
                const lv = safeNum(level, 1);
                return UPGRADE_COSTS[lv + 1] || 999999;
            };

            const formatTime = function(isoString) {
                try {
                    if (!isoString) return '--:--:--';
                    const date = new Date(isoString);
                    if (isNaN(date.getTime())) return '--:--:--';
                    return date.toLocaleTimeString('zh-CN', { hour12: false });
                } catch(e) { return '--:--:--'; }
            };

            const showMessage = function(code, msg) {
                try {
                    message.value = { code: safeNum(code, 1), message: safeStr(msg, '操作完成') };
                    setTimeout(function() {
                        message.value = null;
                    }, 2500);
                } catch(e) {}
            };

            const carriageDamaged = function(c) {
                try {
                    const hp = safeNum(c.hp);
                    const max = safeNum(c.max_hp, 1);
                    return max > 0 && hp < max * 0.5;
                } catch(e) { return false; }
            };

            const carriageDestroyed = function(c) {
                try {
                    return safeNum(c.hp) <= 0;
                } catch(e) { return false; }
            };

            const carriageHpPercent = function(c) {
                try {
                    const hp = safeNum(c.hp);
                    const max = safeNum(c.max_hp, 1);
                    if (max <= 0) return 0;
                    return Math.max(0, Math.min(100, (hp / max) * 100));
                } catch(e) { return 0; }
            };

            const carriageHpLow = function(c) {
                try {
                    const hp = safeNum(c.hp);
                    const max = safeNum(c.max_hp, 1);
                    return max > 0 && hp < max * 0.3;
                } catch(e) { return false; }
            };

            const banditHpPercent = function(b) {
                try {
                    const hp = safeNum(b.hp);
                    const max = safeNum(b.max_hp, 60);
                    if (max <= 0) return 0;
                    return Math.max(0, Math.min(100, (hp / max) * 100));
                } catch(e) { return 0; }
            };

            const apiCall = async function(endpoint, method, data) {
                const m = method || 'GET';
                const options = {
                    method: m,
                    headers: {
                        'Content-Type': 'application/json',
                    }
                };
                if (data) {
                    try {
                        options.body = JSON.stringify(data);
                    } catch(e) {
                        return { code: 1, message: '数据错误', data: null };
                    }
                }
                
                try {
                    const response = await fetch(API_BASE + endpoint, options);
                    const result = await response.json();
                    return result;
                } catch (error) {
                    console.error('API Error:', endpoint, error);
                    return { code: 1, message: '网络错误: ' + (error.message || '请检查服务器'), data: null };
                }
            };

            const updateGameState = function(data) {
                if (!data) return;
                
                try {
                    const state = data.game_state;
                    if (state) {
                        distance.value = safeNum(state.distance);
                        speed.value = safeNum(state.speed);
                        fuel.value = safeNum(state.fuel);
                        maxFuel.value = safeNum(state.max_fuel, 100);
                    }
                    
                    if (Array.isArray(data.carriages)) {
                        carriages.value = data.carriages;
                        for (let i = 0; i < data.carriages.length; i++) {
                            const c = data.carriages[i];
                            if (c && c.carriage_type === 'cargo') {
                                cargoCapacity.value = safeNum(c.cargo_capacity, 50);
                                break;
                            }
                        }
                    }
                    
                    currentEvent.value = data.current_event || null;
                    
                    if (data.current_event_data) {
                        const ed = data.current_event_data;
                        if (Array.isArray(ed.bandits)) {
                            bandits.value = ed.bandits;
                        }
                        if (ed.clear_cost !== undefined) {
                            roadblockCost.value = safeNum(ed.clear_cost, 20);
                        }
                        if (ed.countdown !== undefined) {
                            bridgeCountdown.value = safeNum(ed.countdown, 5);
                        }
                        if (ed.track_switched !== undefined) {
                            trackSwitched.value = !!ed.track_switched;
                        }
                    } else {
                        bandits.value = [];
                        trackSwitched.value = false;
                    }
                    
                    if (data.event_result && data.event_result.message) {
                        showMessage(0, data.event_result.message);
                        if (data.event_result.message && data.event_result.message.indexOf('伤害') >= 0) {
                            triggerShake();
                        }
                    }
                } catch(e) {
                    console.error('updateGameState error:', e);
                }
            };

            const triggerShake = function() {
                isShaking.value = true;
                setTimeout(function() {
                    isShaking.value = false;
                }, 350);
            };

            const startGame = async function() {
                try {
                    apiError.value = '';
                    const result = await apiCall('/train/start', 'POST', {});
                    if (result.code === 0) {
                        gameStarted.value = true;
                        gameOver.value = false;
                        gameOverReason.value = '';
                        updateGameState(result.data);
                        startGameLoop();
                        loadEvents();
                        showMessage(0, '列车启动！');
                    } else {
                        showMessage(1, result.message || '启动失败');
                        apiError.value = result.message || '启动失败';
                    }
                } catch(e) {
                    showMessage(1, '启动异常: ' + e.message);
                    apiError.value = '启动异常: ' + e.message;
                }
            };

            const restartGame = async function() {
                gameOver.value = false;
                gameOverReason.value = '';
                await startGame();
            };

            const startGameLoop = function() {
                if (gameLoop) {
                    clearInterval(gameLoop);
                    gameLoop = null;
                }
                gameLoop = setInterval(async function() {
                    if (gameOver.value) {
                        if (gameLoop) {
                            clearInterval(gameLoop);
                            gameLoop = null;
                        }
                        return;
                    }
                    
                    try {
                        const result = await apiCall('/train/tick', 'POST', { delta_seconds: 0.5 });
                        if (result.code === 0) {
                            updateGameState(result.data);
                        } else {
                            gameOver.value = true;
                            gameOverReason.value = result.message || '游戏结束';
                            if (gameLoop) {
                                clearInterval(gameLoop);
                                gameLoop = null;
                            }
                        }
                    } catch(e) {
                        console.error('Tick error:', e);
                    }
                }, 500);
            };

            const loadEvents = function() {
                if (eventPollTimer) {
                    clearInterval(eventPollTimer);
                    eventPollTimer = null;
                }
                const fetchEvents = async function() {
                    try {
                        const result = await apiCall('/train/events/get?limit=20', 'GET');
                        if (result.code === 0 && Array.isArray(result.data)) {
                            recentEvents.value = result.data;
                        }
                    } catch(e) {}
                };
                fetchEvents();
                eventPollTimer = setInterval(fetchEvents, 2000);
            };

            const refreshState = async function() {
                try {
                    const state = await apiCall('/train/state/get', 'GET');
                    if (state.code === 0 && state.data) {
                        updateGameState(state.data);
                    }
                } catch(e) {}
            };

            const fireWeapon = async function() {
                const result = await apiCall('/train/fire', 'POST');
                showMessage(result.code, result.message || '操作完成');
                if (result.code === 0) {
                    await refreshState();
                }
            };

            const clearRoadblock = async function() {
                const result = await apiCall('/train/clearroadblock', 'POST');
                showMessage(result.code, result.message || '操作完成');
                if (result.code === 0) {
                    await refreshState();
                }
            };

            const switchTrack = async function() {
                const result = await apiCall('/train/switchtrack', 'POST');
                showMessage(result.code, result.message || '操作完成');
                if (result.code === 0) {
                    trackSwitched.value = true;
                }
            };

            const refuel = async function() {
                const result = await apiCall('/train/refuel', 'POST');
                showMessage(result.code, result.message || '操作完成');
                if (result.code === 0) {
                    await refreshState();
                }
            };

            const upgradeCarriage = async function(carriageType) {
                const result = await apiCall('/train/upgrade', 'POST', { carriage_type: carriageType });
                showMessage(result.code, result.message || '操作完成');
                if (result.code === 0) {
                    await refreshState();
                }
            };

            const repairCarriage = async function(carriageType) {
                const result = await apiCall('/train/repair', 'POST', { carriage_type: carriageType, amount: 20 });
                showMessage(result.code, result.message || '操作完成');
                if (result.code === 0) {
                    await refreshState();
                }
            };

            const checkExistingGame = async function() {
                try {
                    const result = await apiCall('/train/state/get', 'GET');
                    if (result.code === 0 && result.data && result.data.game_state && result.data.game_state.is_running === 1) {
                        gameStarted.value = true;
                        gameOver.value = false;
                        updateGameState(result.data);
                        startGameLoop();
                        loadEvents();
                    }
                } catch(e) {
                    console.error('checkExistingGame error:', e);
                }
            };

            onMounted(function() {
                try {
                    checkExistingGame();
                } catch(e) {
                    console.error('onMounted error:', e);
                }
            });

            onUnmounted(function() {
                if (gameLoop) {
                    clearInterval(gameLoop);
                    gameLoop = null;
                }
                if (eventPollTimer) {
                    clearInterval(eventPollTimer);
                    eventPollTimer = null;
                }
            });

            return {
                apiError,
                gameStarted,
                gameOver,
                gameOverReason,
                cargoCapacity,
                maxFuel,
                carriages,
                currentEvent,
                bandits,
                roadblockCost,
                trackSwitched,
                recentEvents,
                message,
                isShaking,
                displayDistance,
                displaySpeed,
                displayFuel,
                fuelPercent,
                displayBridgeCountdown,
                getUpgradeCost,
                formatTime,
                carriageDamaged,
                carriageDestroyed,
                carriageHpPercent,
                carriageHpLow,
                banditHpPercent,
                startGame,
                restartGame,
                fireWeapon,
                clearRoadblock,
                switchTrack,
                refuel,
                upgradeCarriage,
                repairCarriage,
            };
        },
        errorHandler: function(err, vm, info) {
            console.error('Vue Error:', err, info);
        }
    }).mount('#app');
})();
