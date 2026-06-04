const GamePage = {
    props: ['user', 'userGame'],
    emits: ['refresh'],
    setup(props, { emit }) {
        const gameData = ref(null);
        const train = ref(null);
        const route = ref(null);
        const stations = ref([]);
        
        const gamePhase = ref('checklist');
        const currentStationIndex = ref(0);
        const speed = ref(0);
        const throttle = ref(0);
        const braking = ref(false);
        const distanceTraveled = ref(0);
        const timeElapsed = ref(0);
        const maxSpeed = ref(0);
        const signalStatus = ref('green');
        const weather = ref('clear');
        const passengerSatisfaction = ref(100);
        const cargoCondition = ref(100);
        const signalViolations = ref(0);
        const stationStops = ref(0);
        const perfectStops = ref(0);
        const breakdowns = ref(0);
        
        const checklist = reactive({
            engine: false,
            brakes: false,
            doors: false,
            signals: false,
            fuel: false
        });
        
        const showResult = ref(false);
        const gameResult = ref(null);
        
        let gameLoop = null;
        let signalTimer = null;
        
        const weatherInfo = {
            clear: { icon: '☀️', name: '晴朗', effect: 1 },
            cloudy: { icon: '⛅', name: '多云', effect: 1 },
            rain: { icon: '🌧️', name: '下雨', effect: 0.8 },
            fog: { icon: '🌫️', name: '大雾', effect: 0.6 },
            snow: { icon: '❄️', name: '下雪', effect: 0.5 }
        };

        const initGame = () => {
            const params = Router.getParams() || {};
            gameData.value = params.gameData;
            train.value = params.train;
            route.value = params.route;
            stations.value = params.gameData?.stations || [];
            weather.value = params.gameData?.weather || 'clear';
            maxSpeed.value = train.value?.max_speed || 100;
            
            if (!gameData.value || !train.value || !route.value) {
                setTimeout(() => {
                    Router.navigate('route_select');
                }, 100);
            }
        };

        const allChecksComplete = computed(() => {
            return checklist.engine && checklist.brakes && checklist.doors && checklist.signals && checklist.fuel;
        });

        const trainPosition = computed(() => {
            const totalDistance = route.value?.distance || 100;
            const progress = Math.min(1, distanceTraveled.value / totalDistance);
            const leftPercent = 10 + (progress * 80);
            return `${leftPercent}%`;
        });

        const toggleCheck = (item) => {
            checklist[item] = !checklist[item];
        };

        const startDriving = () => {
            if (!allChecksComplete.value) {
                alert('请完成所有检查项！');
                return;
            }
            gamePhase.value = 'driving';
            startGameLoop();
            startSignalSystem();
        };

        const startGameLoop = () => {
            gameLoop = setInterval(() => {
                timeElapsed.value++;
                
                const targetSpeed = (throttle.value / 100) * maxSpeed.value;
                
                if (braking.value) {
                    speed.value = Math.max(0, speed.value - 5);
                } else {
                    const weatherFactor = weatherInfo[weather.value]?.effect || 1;
                    const acceleration = (targetSpeed - speed.value) * 0.05 * weatherFactor;
                    speed.value = Math.min(maxSpeed.value, speed.value + acceleration);
                }
                
                const distanceIncrement = (speed.value / 3600) * 10;
                distanceTraveled.value += distanceIncrement;
                
                if (speed.value > 0) {
                    const totalDistance = route.value?.distance || 100;
                    const progress = distanceTraveled.value / totalDistance;
                    const nextStation = stations.value[currentStationIndex.value + 1];
                    
                    if (nextStation && distanceTraveled.value >= nextStation.distance_from_start - 2) {
                        if (speed.value <= 10) {
                            arriveAtStation();
                        } else if (signalStatus.value !== 'red') {
                            signalStatus.value = 'red';
                        }
                    }
                }
                
                if (signalStatus.value === 'red' && speed.value > 10) {
                    signalViolations.value++;
                    passengerSatisfaction.value = Math.max(0, passengerSatisfaction.value - 0.5);
                }
                
                if (currentStationIndex.value < stations.value.length - 1) {
                    const nextStation = stations.value[currentStationIndex.value + 1];
                    if (nextStation && distanceTraveled.value < nextStation.distance_from_start) {
                        const distanceToStation = nextStation.distance_from_start - distanceTraveled.value;
                        if (distanceToStation < 5 && speed.value > 30) {
                            passengerSatisfaction.value = Math.max(0, passengerSatisfaction.value - 0.1);
                        }
                    }
                }
                
                if (currentStationIndex.value >= stations.value.length - 1 && 
                    distanceTraveled.value >= (route.value?.distance || 100) - 0.5) {
                    endGame();
                }
            }, 100);
        };

        const startSignalSystem = () => {
            signalTimer = setInterval(() => {
                if (Math.random() < 0.1 && signalStatus.value === 'green') {
                    signalStatus.value = 'yellow';
                    setTimeout(() => {
                        if (signalStatus.value === 'yellow') {
                            signalStatus.value = 'red';
                            setTimeout(() => {
                                if (signalStatus.value === 'red') {
                                    signalStatus.value = 'green';
                                }
                            }, 5000);
                        }
                    }, 3000);
                }
            }, 10000);
        };

        const arriveAtStation = () => {
            currentStationIndex.value++;
            stationStops.value++;
            
            const stopDistance = Math.abs(
                distanceTraveled.value - stations.value[currentStationIndex.value].distance_from_start
            );
            
            if (stopDistance < 0.5) {
                perfectStops.value++;
                passengerSatisfaction.value = Math.min(100, passengerSatisfaction.value + 5);
            } else {
                passengerSatisfaction.value = Math.max(0, passengerSatisfaction.value - 3);
            }
            
            speed.value = 0;
            throttle.value = 0;
            gamePhase.value = 'stopped';
            
            setTimeout(() => {
                if (gamePhase.value === 'stopped') {
                    gamePhase.value = 'driving';
                }
            }, 3000);
        };

        const continueDriving = () => {
            gamePhase.value = 'driving';
        };

        const toggleBrake = () => {
            braking.value = !braking.value;
        };

        const endGame = async () => {
            clearInterval(gameLoop);
            clearInterval(signalTimer);
            
            speed.value = 0;
            throttle.value = 0;
            
            const baseCoins = route.value?.base_reward || 100;
            const baseExp = route.value?.base_exp || 50;
            
            const satisfactionBonus = Math.floor(passengerSatisfaction.value / 100 * baseCoins);
            const perfectStopBonus = perfectStops.value * 50;
            const violationPenalty = signalViolations.value * 30;
            
            const coinsEarned = Math.max(0, baseCoins + satisfactionBonus + perfectStopBonus - violationPenalty);
            const expEarned = Math.max(0, baseExp + perfectStops.value * 10 - signalViolations.value * 5);
            
            const isPerfect = signalViolations.value === 0 && 
                            perfectStops.value === stationStops.value && 
                            passengerSatisfaction.value >= 90;
            
            const result = await API.huoche.completeGame({
                game_record_id: gameData.value.game_record_id,
                actual_duration: Math.floor(timeElapsed.value / 10),
                distance: distanceTraveled.value,
                avg_speed: distanceTraveled.value / (timeElapsed.value / 600) || 0,
                max_speed: maxSpeed.value,
                passengers_transported: gameData.value?.passenger_count || 0,
                cargo_transported: gameData.value?.cargo_count || 0,
                signal_violations: signalViolations.value,
                station_stops: stationStops.value,
                perfect_stops: perfectStops.value,
                weather_condition: weather.value,
                breakdowns: breakdowns.value,
                passenger_satisfaction: passengerSatisfaction.value,
                cargo_condition: cargoCondition.value,
                coins_earned: coinsEarned,
                exp_earned: expEarned,
                is_perfect: isPerfect
            });
            
            gameResult.value = {
                score: 0,
                grade: 'C',
                coins_earned: coinsEarned,
                exp_earned: expEarned,
                ...result.data?.game_record
            };
            
            showResult.value = true;
            emit('refresh');
        };

        const goToDashboard = () => {
            Router.navigate('dashboard');
        };

        const playAgain = () => {
            Router.navigate('route_select');
        };

        onMounted(() => {
            initGame();
        });

        onUnmounted(() => {
            if (gameLoop) clearInterval(gameLoop);
            if (signalTimer) clearInterval(signalTimer);
        });

        return {
            gameData,
            train,
            route,
            stations,
            gamePhase,
            currentStationIndex,
            speed,
            throttle,
            braking,
            distanceTraveled,
            timeElapsed,
            maxSpeed,
            signalStatus,
            weather,
            passengerSatisfaction,
            cargoCondition,
            signalViolations,
            stationStops,
            perfectStops,
            breakdowns,
            checklist,
            allChecksComplete,
            trainPosition,
            showResult,
            gameResult,
            weatherInfo,
            toggleCheck,
            startDriving,
            continueDriving,
            toggleBrake,
            goToDashboard,
            playAgain
        };
    },
    template: `
        <div class="game-container">
            <div v-if="gamePhase === 'checklist'" class="page" style="padding-top: 80px;">
                <div class="page-container">
                    <div class="shop-header">
                        <h1>🚂 发车前检查</h1>
                        <p>请在发车前检查所有设备</p>
                    </div>

                    <div class="checklist" style="max-width: 600px; margin: 0 auto;">
                        <h3 class="checklist-title">
                            <span>✅</span> 设备检查清单
                        </h3>
                        <div class="checklist-items">
                            <div 
                                :class="['checklist-item', { completed: checklist.engine }]"
                                @click="toggleCheck('engine')"
                            >
                                <div class="checklist-checkbox">{{ checklist.engine ? '✓' : '' }}</div>
                                <div class="checklist-text">检查发动机状态</div>
                            </div>
                            <div 
                                :class="['checklist-item', { completed: checklist.brakes }]"
                                @click="toggleCheck('brakes')"
                            >
                                <div class="checklist-checkbox">{{ checklist.brakes ? '✓' : '' }}</div>
                                <div class="checklist-text">测试制动系统</div>
                            </div>
                            <div 
                                :class="['checklist-item', { completed: checklist.doors }]"
                                @click="toggleCheck('doors')"
                            >
                                <div class="checklist-checkbox">{{ checklist.doors ? '✓' : '' }}</div>
                                <div class="checklist-text">检查车门状态</div>
                            </div>
                            <div 
                                :class="['checklist-item', { completed: checklist.signals }]"
                                @click="toggleCheck('signals')"
                            >
                                <div class="checklist-checkbox">{{ checklist.signals ? '✓' : '' }}</div>
                                <div class="checklist-text">确认信号灯系统</div>
                            </div>
                            <div 
                                :class="['checklist-item', { completed: checklist.fuel }]"
                                @click="toggleCheck('fuel')"
                            >
                                <div class="checklist-checkbox">{{ checklist.fuel ? '✓' : '' }}</div>
                                <div class="checklist-text">检查燃料/电力供应</div>
                            </div>
                        </div>
                    </div>

                    <div style="text-align: center; margin-top: 30px;">
                        <button 
                            class="btn btn-success" 
                            style="width: auto; padding: 15px 50px; font-size: 18px;"
                            :disabled="!allChecksComplete"
                            @click="startDriving"
                        >
                            🚀 开始驾驶
                        </button>
                    </div>
                </div>
            </div>

            <div v-else>
                <div class="game-header">
                    <div class="game-info">
                        <div class="game-info-item">
                            <div class="game-info-label">线路</div>
                            <div class="game-info-value">{{ route?.name }}</div>
                        </div>
                        <div class="game-info-item">
                            <div class="game-info-label">火车</div>
                            <div class="game-info-value">{{ train?.name }}</div>
                        </div>
                        <div class="game-info-item">
                            <div class="game-info-label">时间</div>
                            <div class="game-info-value">{{ Math.floor(timeElapsed / 10) }}s</div>
                        </div>
                        <div class="game-info-item">
                            <div class="game-info-label">距离</div>
                            <div class="game-info-value">{{ distanceTraveled.toFixed(1) }} km</div>
                        </div>
                    </div>
                    <div class="speedometer">
                        <div class="speedometer-circle">
                            <div class="speedometer-inner">
                                <div class="speed-value">{{ Math.round(speed) }}</div>
                                <div class="speed-unit">km/h</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="weather-display">
                    <div class="weather-icon">{{ weatherInfo[weather]?.icon }}</div>
                    <div class="weather-info">
                        <div class="weather-name">{{ weatherInfo[weather]?.name }}</div>
                        <div class="weather-effect">效率 {{ (weatherInfo[weather]?.effect * 100).toFixed(0) }}%</div>
                    </div>
                </div>

                <div class="game-track">
                    <div class="track-visual">
                        <div :class="['track-lines', { moving: speed > 0 }]"></div>
                        <div :class="['train-sprite', { moving: speed > 0 }]" :style="{ left: trainPosition }">
                            {{ train?.type_code === 'steam' ? '🚂' : train?.type_code === 'electric' ? '🚆' : '🚄' }}
                        </div>
                    </div>

                    <div class="stations-bar">
                        <div 
                            v-for="(station, index) in stations" 
                            :key="station.id"
                            :class="[
                                'station-marker', 
                                { passed: index < currentStationIndex },
                                { current: index === currentStationIndex }
                            ]"
                        >
                            <div class="station-dot"></div>
                            <div class="station-name">{{ station.name }}</div>
                        </div>
                    </div>

                    <div class="status-panel">
                        <div class="status-card">
                            <div class="status-label">乘客满意度</div>
                            <div :class="['status-value', passengerSatisfaction >= 70 ? 'good' : passengerSatisfaction >= 40 ? 'warning' : 'danger']">
                                {{ passengerSatisfaction.toFixed(0) }}%
                            </div>
                        </div>
                        <div class="status-card">
                            <div class="status-label">货物完好度</div>
                            <div :class="['status-value', cargoCondition >= 70 ? 'good' : cargoCondition >= 40 ? 'warning' : 'danger']">
                                {{ cargoCondition.toFixed(0) }}%
                            </div>
                        </div>
                        <div class="status-card">
                            <div class="status-label">完美停靠</div>
                            <div class="status-value good">{{ perfectStops }}/{{ stationStops }}</div>
                        </div>
                        <div class="status-card">
                            <div class="status-label">信号违规</div>
                            <div :class="['status-value', signalViolations === 0 ? 'good' : 'danger']">
                                {{ signalViolations }}
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="gamePhase === 'stopped'" class="modal-overlay">
                    <div class="modal-content">
                        <h2 class="modal-title">🚉 到达站点</h2>
                        <p>{{ stations[currentStationIndex]?.name }}</p>
                        <p style="margin-top: 20px;">正在上下乘客和货物...</p>
                        <button class="btn btn-primary" style="margin-top: 20px;" @click="continueDriving">
                            继续行驶
                        </button>
                    </div>
                </div>

                <div class="game-controls">
                    <div class="control-panel">
                        <div class="signal-panel">
                            <div class="signal-light">
                                <div :class="['signal-color', signalStatus]"></div>
                                <div class="signal-text">
                                    {{ signalStatus === 'green' ? '可以通行' : signalStatus === 'yellow' ? '注意减速' : '必须停车' }}
                                </div>
                            </div>
                        </div>

                        <div class="throttle-control">
                            <div class="throttle-label">油门: {{ throttle }}%</div>
                            <input 
                                type="range" 
                                class="throttle-slider" 
                                min="0" 
                                max="100" 
                                v-model.number="throttle"
                            />
                        </div>

                        <div class="brake-control">
                            <div class="throttle-label">刹车</div>
                            <button 
                                :class="['brake-btn', { active: braking }]"
                                @mousedown="braking = true"
                                @mouseup="braking = false"
                                @mouseleave="braking = false"
                                @touchstart="braking = true"
                                @touchend="braking = false"
                            >
                                刹
                            </button>
                        </div>
                    </div>
                </div>

                <div v-if="showResult" class="modal-overlay">
                    <div class="modal-content">
                        <h2 class="modal-title">🎉 任务完成！</h2>
                        <div :class="['grade-display', gameResult?.grade]">{{ gameResult?.grade }}</div>
                        
                        <div class="result-stats">
                            <div class="result-stat">
                                <div class="result-stat-label">得分</div>
                                <div class="result-stat-value">{{ gameResult?.score || 0 }}</div>
                            </div>
                            <div class="result-stat">
                                <div class="result-stat-label">用时</div>
                                <div class="result-stat-value">{{ Math.floor(timeElapsed / 10) }}秒</div>
                            </div>
                            <div class="result-stat">
                                <div class="result-stat-label">行驶距离</div>
                                <div class="result-stat-value">{{ distanceTraveled.toFixed(1) }} km</div>
                            </div>
                            <div class="result-stat">
                                <div class="result-stat-label">完美停靠</div>
                                <div class="result-stat-value">{{ perfectStops }}/{{ stationStops }}</div>
                            </div>
                        </div>

                        <div class="rewards-earned">
                            <h4>🏆 获得奖励</h4>
                            <div class="reward-items">
                                <div class="reward-display coin">
                                    💰 {{ gameResult?.coins_earned || 0 }}
                                </div>
                                <div class="reward-display exp">
                                    ✨ {{ gameResult?.exp_earned || 0 }} EXP
                                </div>
                            </div>
                        </div>

                        <div class="modal-actions">
                            <button class="btn btn-secondary" @click="goToDashboard">返回首页</button>
                            <button class="btn btn-primary" @click="playAgain">再玩一次</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};
