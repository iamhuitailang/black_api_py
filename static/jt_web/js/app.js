const { createApp, ref, reactive, computed, onMounted, onUnmounted, watch } = Vue;

const App = {
    setup() {
        const isLoggedIn = ref(false);
        const authMode = ref('login');
        const loading = ref(false);
        const currentRoute = ref('dashboard');
        
        const loginForm = reactive({
            username: '',
            password: ''
        });
        
        const registerForm = reactive({
            username: '',
            password: '',
            nickname: ''
        });
        
        const showToast = ref(false);
        const toastMessage = ref('');
        const toastType = ref('info');
        
        const gameState = reactive({
            trafficFlow: 0,
            satisfaction: 0,
            roadCount: 0,
            signalCount: 0,
            day: 1,
            hour: 8
        });
        
        const roads = ref([]);
        const signals = ref([]);
        const accidents = ref([]);
        const transits = ref([]);
        
        const vehicles = ref([]);
        
        const isSimulating = ref(false);
        const showAddRoad = ref(false);
        const showAddSignal = ref(false);
        const showAddAccident = ref(false);
        const showAddTransit = ref(false);
        
        const settings = reactive({
            soundEnabled: true,
            musicEnabled: false,
            volume: 70,
            simulationSpeed: 1,
            autoSave: true
        });
        
        const cityFunds = ref(50000);
        
        const newRoad = reactive({
            road_type: 'normal',
            name: '',
            lanes: 2,
            speed_limit: 60
        });
        
        const newSignal = reactive({
            signal_type: 'fixed',
            red_duration: 30,
            green_duration: 30
        });
        
        const newAccident = reactive({
            accident_type: 'collision',
            severity: 1,
            description: ''
        });
        
        const newTransit = reactive({
            transit_type: 'bus',
            name: '',
            capacity: 50,
            frequency: 10,
            fare: 2.0
        });
        
        let autoSaveInterval = null;
        
        const pageTitle = computed(() => {
            const titles = {
                dashboard: '仪表盘',
                roads: '道路管理',
                signals: '信号灯',
                accidents: '事故处理',
                transit: '公共交通',
                settings: '设置'
            };
            return titles[currentRoute.value] || '城市交通指挥官';
        });
        
        const gameTime = computed(() => {
            const hour = String(Math.floor(gameState.hour)).padStart(2, '0');
            const minute = String(Math.floor((gameState.hour % 1) * 60)).padStart(2, '0');
            return `第${gameState.day}天 ${hour}:${minute}`;
        });
        
        const activeAccidents = computed(() => {
            return accidents.value.filter(a => a.status !== 'resolved');
        });
        
        const cityInfo = computed(() => {
            const saved = Storage.getGameState();
            return {
                name: saved?.cityInfo?.name || '交通新城',
                level: saved?.cityInfo?.level || 1,
                funds: cityFunds.value,
                population: saved?.cityInfo?.population || 10000,
                satisfaction: saved?.cityInfo?.satisfaction || 70
            };
        });
        
        const initVehicle = (id) => {
            const types = ['car', 'bus', 'truck', 'taxi'];
            const colors = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'];
            const directions = [0, 1, 2, 3];
            const dir = directions[Math.floor(Math.random() * 4)];
            let x, y;
            if (dir === 0 || dir === 2) {
                x = 10 + Math.random() * 80;
                y = dir === 0 ? 85 + Math.random() * 10 : 5 + Math.random() * 10;
            } else {
                y = 10 + Math.random() * 80;
                x = dir === 1 ? 5 + Math.random() * 10 : 85 + Math.random() * 10;
            }
            return {
                id,
                type: types[Math.floor(Math.random() * types.length)],
                color: colors[Math.floor(Math.random() * colors.length)],
                x,
                y,
                speed: 0.8 + Math.random() * 1.2,
                direction: dir,
                active: true
            };
        };
        
        const initVehicles = (count = 20) => {
            vehicles.value = [];
            for (let i = 0; i < count; i++) {
                vehicles.value.push(initVehicle(i));
            }
        };
        
        let simulationTickInterval = null;
        let simulationTickCount = 0;
        
        const updateVehicles = () => {
            vehicles.value.forEach(vehicle => {
                if (!vehicle.active) return;
                
                const congestionFactor = 1 - Math.min(1, (gameState.trafficFlow || 100) / 500);
                const actualSpeed = vehicle.speed * Math.max(0.3, congestionFactor) * 0.5;
                
                switch (vehicle.direction) {
                    case 0:
                        vehicle.y -= actualSpeed;
                        if (vehicle.y < 5) {
                            vehicle.y = 5;
                            vehicle.direction = 2;
                        }
                        break;
                    case 1:
                        vehicle.x += actualSpeed;
                        if (vehicle.x > 95) {
                            vehicle.x = 95;
                            vehicle.direction = 3;
                        }
                        break;
                    case 2:
                        vehicle.y += actualSpeed;
                        if (vehicle.y > 95) {
                            vehicle.y = 95;
                            vehicle.direction = 0;
                        }
                        break;
                    case 3:
                        vehicle.x -= actualSpeed;
                        if (vehicle.x < 5) {
                            vehicle.x = 5;
                            vehicle.direction = 1;
                        }
                        break;
                }
                
                if (Math.random() < 0.003) {
                    vehicle.direction = Math.floor(Math.random() * 4);
                }
            });
        };
        
        const showToastFn = (message, type = 'info') => {
            if (typeof message !== 'string') return;
            toastMessage.value = message;
            toastType.value = type;
            showToast.value = true;
            setTimeout(() => {
                showToast.value = false;
            }, 2500);
        };
        
        const hideToast = () => {
            showToast.value = false;
        };
        
        const checkAuth = () => {
            const loggedIn = AuthService.isLoggedIn();
            isLoggedIn.value = loggedIn;
            return loggedIn;
        };
        
        const navigateTo = (route) => {
            currentRoute.value = route;
            window.location.hash = route;
        };
        
        const mergeGameState = (serverState, localState) => {
            if (!localState) return serverState;
            const merged = { ...serverState };
            if (localState.gameState) {
                Object.assign(merged, localState.gameState);
            }
            if (localState.roads && localState.roads.length > 0) {
                merged.roads = localState.roads;
            }
            if (localState.signals && localState.signals.length > 0) {
                merged.signals = localState.signals;
            }
            if (localState.accidents && localState.accidents.length > 0) {
                merged.accidents = localState.accidents;
            }
            if (localState.transits && localState.transits.length > 0) {
                merged.transits = localState.transits;
            }
            if (localState.vehicles && localState.vehicles.length > 0) {
                merged.vehicles = localState.vehicles;
            }
            if (localState.cityInfo) {
                merged.cityInfo = localState.cityInfo;
            }
            return merged;
        };
        
        const saveFullState = () => {
            const saved = Storage.getGameState() || {};
            const fullState = {
                gameState: { ...gameState },
                roads: roads.value,
                signals: signals.value,
                accidents: accidents.value,
                transits: transits.value,
                vehicles: vehicles.value,
                cityInfo: {
                    name: saved.cityInfo?.name || '交通新城',
                    level: saved.cityInfo?.level || 1,
                    funds: cityFunds.value,
                    population: saved.cityInfo?.population || 10000,
                    satisfaction: saved.cityInfo?.satisfaction || 70
                }
            };
            Storage.setGameState(fullState);
            
            if (GameService.state) {
                Object.assign(GameService.state, gameState);
            } else {
                GameService.state = { ...gameState };
            }
        };
        
        const startAutoSave = () => {
            if (autoSaveInterval) {
                clearInterval(autoSaveInterval);
            }
            autoSaveInterval = setInterval(() => {
                if (settings.autoSave && isLoggedIn.value) {
                    saveFullState();
                }
            }, 5000);
        };
        
        const loadGameData = async () => {
            const localState = Storage.getGameState();
            
            if (localState) {
                if (localState.gameState) {
                    Object.assign(gameState, localState.gameState);
                }
                if (localState.roads && localState.roads.length > 0) {
                    roads.value = localState.roads;
                }
                if (localState.signals && localState.signals.length > 0) {
                    signals.value = localState.signals;
                }
                if (localState.accidents) {
                    accidents.value = localState.accidents;
                }
                if (localState.transits && localState.transits.length > 0) {
                    transits.value = localState.transits;
                }
                if (localState.vehicles && localState.vehicles.length > 0) {
                    vehicles.value = localState.vehicles;
                }
                if (localState.cityInfo?.funds !== undefined) {
                    cityFunds.value = localState.cityInfo.funds;
                }
                gameState.roadCount = roads.value.length;
                gameState.signalCount = signals.value.length;
            }
            
            try {
                const [cityResult, gameResult, roadsResult, signalsResult, accidentsResult, transitsResult] = await Promise.all([
                    GameService.getCity(),
                    GameService.loadGame(),
                    GameService.getRoads(),
                    GameService.getSignals(),
                    GameService.getAccidents(),
                    GameService.getTransits()
                ]);
                
                if (gameResult.code === 0 && gameResult.data) {
                    if (gameResult.data.game_data) {
                        try {
                            const parsed = JSON.parse(gameResult.data.game_data);
                            if (!localState || !localState.gameState) {
                                Object.assign(gameState, parsed);
                            }
                        } catch (e) {}
                    } else if (!localState || !localState.gameState) {
                        Object.assign(gameState, gameResult.data);
                    }
                    
                    if (!GameService.state) {
                        GameService.state = { ...gameState };
                    }
                }
                
                if (roadsResult.code === 0 && roadsResult.data && roadsResult.data.length > 0) {
                    if (roads.value.length === 0) {
                        roads.value = roadsResult.data;
                    }
                    gameState.roadCount = roads.value.length;
                }
                
                if (signalsResult.code === 0 && signalsResult.data && signalsResult.data.length > 0) {
                    if (signals.value.length === 0) {
                        signals.value = signalsResult.data;
                    }
                    gameState.signalCount = signals.value.length;
                }
                
                if (accidentsResult.code === 0 && accidentsResult.data && accidentsResult.data.length > 0) {
                    if (accidents.value.length === 0) {
                        accidents.value = accidentsResult.data;
                    }
                }
                
                if (transitsResult.code === 0 && transitsResult.data && transitsResult.data.length > 0) {
                    if (transits.value.length === 0) {
                        transits.value = transitsResult.data;
                    }
                }
            } catch (e) {
                console.error('Load game from API error:', e);
            }
            
            if (roads.value.length === 0 && signals.value.length === 0) {
                roads.value = [
                    { id: 1, name: '中心大道', road_type: 'normal', lanes: 4, status: 1, current_flow: 120, congestion_level: 3 },
                    { id: 2, name: '建设路', road_type: 'normal', lanes: 2, status: 1, current_flow: 60, congestion_level: 1 },
                    { id: 3, name: '环城快速路', road_type: 'highway', lanes: 6, status: 1, current_flow: 200, congestion_level: 4 },
                    { id: 4, name: '公园路', road_type: 'normal', lanes: 2, status: 1, current_flow: 40, congestion_level: 1 }
                ];
                signals.value = [
                    { id: 1, position_x: 50, position_y: 50, signal_type: 'fixed', current_state: 'green', is_active: 1, timer: 25, red_duration: 30, green_duration: 30, yellow_duration: 5 },
                    { id: 2, position_x: 30, position_y: 70, signal_type: 'adaptive', current_state: 'red', is_active: 1, timer: 15, red_duration: 25, green_duration: 35, yellow_duration: 5 },
                    { id: 3, position_x: 70, position_y: 30, signal_type: 'fixed', current_state: 'green', is_active: 1, timer: 30, red_duration: 20, green_duration: 40, yellow_duration: 5 },
                    { id: 4, position_x: 50, position_y: 30, signal_type: 'pedestrian', current_state: 'red', is_active: 1, timer: 10, red_duration: 45, green_duration: 15, yellow_duration: 5 }
                ];
                transits.value = [
                    { id: 1, transit_type: 'bus', name: '1路公交', capacity: 50, frequency: 10, fare: 2, ridership: 120, status: 1 },
                    { id: 2, transit_type: 'bus', name: '2路公交', capacity: 50, frequency: 12, fare: 2, ridership: 80, status: 1 },
                    { id: 3, transit_type: 'subway', name: '地铁1号线', capacity: 200, frequency: 5, fare: 3, ridership: 500, status: 1 }
                ];
                gameState.roadCount = roads.value.length;
                gameState.signalCount = signals.value.length;
            }
            
            if (vehicles.value.length === 0) {
                initVehicles(Math.max(20, 15 + roads.value.length * 3));
            }
            
            if (!gameState.trafficFlow) {
                gameState.trafficFlow = 100;
                gameState.satisfaction = 70;
            }
            
            if (!GameService.state) {
                GameService.state = { ...gameState };
            } else {
                Object.assign(GameService.state, gameState);
            }
            
            saveFullState();
        };
        
        const initGameData = async () => {
            await loadGameData();
        };
        
        const handleLogin = async () => {
            if (!loginForm.username || !loginForm.password) {
                showToastFn('请填写用户名和密码', 'warning');
                return;
            }
            
            loading.value = true;
            try {
                const result = await AuthService.login(loginForm.username, loginForm.password);
                if (result.code === 0) {
                    isLoggedIn.value = true;
                    showToastFn('登录成功', 'success');
                    await initGameData();
                    navigateTo('dashboard');
                } else {
                    showToastFn(result.msg || '登录失败', 'error');
                }
            } catch (e) {
                showToastFn('登录失败，请重试', 'error');
            } finally {
                loading.value = false;
            }
        };
        
        const handleRegister = async () => {
            if (!registerForm.username || !registerForm.password) {
                showToastFn('请填写用户名和密码', 'warning');
                return;
            }
            
            loading.value = true;
            try {
                const result = await AuthService.register(
                    registerForm.username,
                    registerForm.password,
                    registerForm.nickname
                );
                if (result.code === 0) {
                    isLoggedIn.value = true;
                    showToastFn('注册成功', 'success');
                    await initGameData();
                    navigateTo('dashboard');
                } else {
                    showToastFn(result.msg || '注册失败', 'error');
                }
            } catch (e) {
                showToastFn('注册失败，请重试', 'error');
            } finally {
                loading.value = false;
            }
        };
        
        const handleLogout = async () => {
            stopSimulation();
            if (autoSaveInterval) {
                clearInterval(autoSaveInterval);
                autoSaveInterval = null;
            }
            saveFullState();
            await AuthService.logout();
            isLoggedIn.value = false;
            roads.value = [];
            signals.value = [];
            accidents.value = [];
            transits.value = [];
            vehicles.value = [];
            showToastFn('已退出登录', 'info');
            navigateTo('login');
        };
        
        const toggleSimulation = () => {
            if (isSimulating.value) {
                stopSimulation();
            } else {
                startSimulation();
            }
        };
        
        const startSimulation = () => {
            isSimulating.value = true;
            simulationTickCount = 0;
            if (simulationTickInterval) clearInterval(simulationTickInterval);
            
            simulationTickInterval = setInterval(() => {
                simulationTickCount++;
                
                updateVehicles();
                
                if (simulationTickCount % 3 === 0) {
                    signals.value = GameService.simulateSignals(signals.value);
                }
                
                if (simulationTickCount % 10 === 0) {
                    GameService.advanceTime(0.1 * settings.simulationSpeed);
                    const state = GameService.getState();
                    if (state) {
                        Object.assign(gameState, state);
                    }
                }
                
                if (simulationTickCount % 500 === 0 && settings.autoSave) {
                    saveFullState();
                }
            }, 100);
        };
        
        const stopSimulation = () => {
            isSimulating.value = false;
            if (simulationTickInterval) {
                clearInterval(simulationTickInterval);
                simulationTickInterval = null;
            }
            GameService.stopSimulation();
            saveFullState();
        };
        
        const advanceTime = () => {
            GameService.advanceTime(1);
            const state = GameService.getState();
            if (state) {
                Object.assign(gameState, state);
            }
            saveFullState();
            showToastFn('时间已推进1小时', 'info');
        };
        
        const saveGame = async () => {
            saveFullState();
            
            const saveData = {
                game_data: JSON.stringify(gameState),
                current_music: 'default',
                game_speed: settings.simulationSpeed,
                day_count: gameState.day,
                time_of_day: Math.floor(gameState.hour * 60),
                is_peak_hour: (gameState.hour >= 7 && gameState.hour < 9) || (gameState.hour >= 17 && gameState.hour < 19) ? 1 : 0,
                auto_save: settings.autoSave ? 1 : 0
            };
            
            try {
                const result = await ApiService.post('/jt/game/save', saveData);
                if (result.code === 0) {
                    showToastFn('游戏保存成功', 'success');
                } else {
                    showToastFn(String(result.msg || '保存失败'), 'error');
                }
            } catch (e) {
                showToastFn('游戏已保存到本地', 'success');
            }
        };
        
        const toggleSignal = async (signal) => {
            try {
                const result = await ApiService.post('/jt/signal/toggle', {}, { signal_id: signal.id });
                if (result.code === 0) {
                    Object.assign(signal, result.data);
                    saveFullState();
                    showToastFn('信号灯状态已切换', 'success');
                } else {
                    const states = ['green', 'yellow', 'red'];
                    const currentIndex = states.indexOf(signal.current_state);
                    signal.current_state = states[(currentIndex + 1) % 3];
                    signal.timer = signal.current_state === 'green' ? signal.green_duration : 
                                  signal.current_state === 'yellow' ? signal.yellow_duration : signal.red_duration;
                    saveFullState();
                    showToastFn('信号灯已切换', 'success');
                }
            } catch (e) {
                const states = ['green', 'yellow', 'red'];
                const currentIndex = states.indexOf(signal.current_state);
                signal.current_state = states[(currentIndex + 1) % 3];
                signal.timer = signal.current_state === 'green' ? signal.green_duration : 
                              signal.current_state === 'yellow' ? signal.yellow_duration : signal.red_duration;
                saveFullState();
                showToastFn('信号灯已切换', 'success');
            }
        };
        
        const respondAccident = async (accident) => {
            try {
                const result = await ApiService.post('/jt/accident/respond', {}, { accident_id: accident.id });
                if (result.code === 0) {
                    Object.assign(accident, result.data);
                    saveFullState();
                    showToastFn('已响应事故，正在处理中', 'success');
                }
            } catch (e) {
                accident.status = 'responding';
                accident.response_time = Math.floor(Date.now() / 1000);
                saveFullState();
                showToastFn('已响应事故', 'success');
            }
        };
        
        const resolveAccident = async (accident) => {
            try {
                const result = await ApiService.post('/jt/accident/resolve', {}, { accident_id: accident.id });
                if (result.code === 0) {
                    Object.assign(accident, result.data);
                    const reward = (accident.severity || 1) * 50;
                    cityFunds.value += reward;
                    saveFullState();
                    showToastFn(`事故已处理完成，获得${reward}金币奖励`, 'success');
                }
            } catch (e) {
                accident.status = 'resolved';
                accident.resolved_at = new Date().toISOString();
                const reward = (accident.severity || 1) * 50;
                cityFunds.value += reward;
                saveFullState();
                showToastFn(`事故已处理完成，获得${reward}金币奖励`, 'success');
            }
        };
        
        const createRoad = async () => {
            try {
                if (!newRoad.name) {
                    showToastFn('请输入道路名称', 'warning');
                    return;
                }
                
                const cityResult = await GameService.getCity();
                const cityId = cityResult.data?.id || 1;
                
                const roadData = {
                    city_id: cityId,
                    road_type: newRoad.road_type,
                    name: newRoad.name,
                    start_x: Math.random() * 20,
                    start_y: Math.random() * 100,
                    end_x: 80 + Math.random() * 20,
                    end_y: Math.random() * 100,
                    lanes: parseInt(newRoad.lanes),
                    speed_limit: parseInt(newRoad.speed_limit)
                };
                
                const costs = { normal: 500, highway: 2000, express: 1000 };
                const cost = costs[newRoad.road_type] || 500;
                
                const result = await ApiService.post('/jt/road/create', roadData);
                if (result.code === 0) {
                    roads.value.push(result.data);
                    gameState.roadCount = roads.value.length;
                    cityFunds.value = Math.max(0, cityFunds.value - cost);
                    saveFullState();
                    showAddRoad.value = false;
                    newRoad.name = '';
                    newRoad.road_type = 'normal';
                    newRoad.lanes = 2;
                    newRoad.speed_limit = 60;
                    showToastFn(`道路创建成功，花费${cost}金币`, 'success');
                } else {
                    roads.value.push({
                        id: Date.now(),
                        ...roadData,
                        status: 1,
                        current_flow: 0,
                        congestion_level: 0
                    });
                    gameState.roadCount = roads.value.length;
                    cityFunds.value = Math.max(0, cityFunds.value - cost);
                    saveFullState();
                    showAddRoad.value = false;
                    newRoad.name = '';
                    showToastFn(`道路创建成功，花费${cost}金币`, 'success');
                }
            } catch (e) {
                const costs = { normal: 500, highway: 2000, express: 1000 };
                const cost = costs[newRoad.road_type] || 500;
                roads.value.push({
                    id: Date.now(),
                    name: newRoad.name,
                    road_type: newRoad.road_type,
                    lanes: parseInt(newRoad.lanes),
                    speed_limit: parseInt(newRoad.speed_limit),
                    status: 1,
                    current_flow: 0,
                    congestion_level: 0
                });
                gameState.roadCount = roads.value.length;
                cityFunds.value = Math.max(0, cityFunds.value - cost);
                saveFullState();
                showAddRoad.value = false;
                newRoad.name = '';
                showToastFn(`道路创建成功，花费${cost}金币`, 'success');
            }
        };
        
        const createSignal = async () => {
            try {
                const cityResult = await GameService.getCity();
                const cityId = cityResult.data?.id || 1;
                
                const signalData = {
                    city_id: cityId,
                    signal_type: newSignal.signal_type,
                    position_x: 20 + Math.random() * 60,
                    position_y: 20 + Math.random() * 60,
                    red_duration: parseInt(newSignal.red_duration),
                    green_duration: parseInt(newSignal.green_duration),
                    yellow_duration: 5
                };
                
                const costs = { fixed: 300, adaptive: 800, pedestrian: 500 };
                const cost = costs[newSignal.signal_type] || 300;
                
                const result = await ApiService.post('/jt/signal/create', signalData);
                if (result.code === 0) {
                    signals.value.push({ ...result.data, timer: result.data.red_duration });
                    gameState.signalCount = signals.value.length;
                } else {
                    signals.value.push({
                        id: Date.now(),
                        ...signalData,
                        current_state: 'red',
                        is_active: 1,
                        timer: signalData.red_duration
                    });
                    gameState.signalCount = signals.value.length;
                }
                
                cityFunds.value = Math.max(0, cityFunds.value - cost);
                saveFullState();
                showAddSignal.value = false;
                newSignal.signal_type = 'fixed';
                newSignal.red_duration = 30;
                newSignal.green_duration = 30;
                showToastFn(`信号灯创建成功，花费${cost}金币`, 'success');
            } catch (e) {
                const costs = { fixed: 300, adaptive: 800, pedestrian: 500 };
                const cost = costs[newSignal.signal_type] || 300;
                
                signals.value.push({
                    id: Date.now(),
                    signal_type: newSignal.signal_type,
                    position_x: 20 + Math.random() * 60,
                    position_y: 20 + Math.random() * 60,
                    red_duration: parseInt(newSignal.red_duration),
                    green_duration: parseInt(newSignal.green_duration),
                    yellow_duration: 5,
                    current_state: 'red',
                    is_active: 1,
                    timer: parseInt(newSignal.red_duration)
                });
                gameState.signalCount = signals.value.length;
                
                cityFunds.value = Math.max(0, cityFunds.value - cost);
                saveFullState();
                showAddSignal.value = false;
                showToastFn(`信号灯创建成功，花费${cost}金币`, 'success');
            }
        };
        
        const createTransit = async () => {
            try {
                if (!newTransit.name) {
                    showToastFn('请输入线路名称', 'warning');
                    return;
                }
                
                const cityResult = await GameService.getCity();
                const cityId = cityResult.data?.id || 1;
                
                const transitData = {
                    city_id: cityId,
                    transit_type: newTransit.transit_type,
                    name: newTransit.name,
                    route_data: '{}',
                    capacity: parseInt(newTransit.capacity),
                    frequency: parseInt(newTransit.frequency),
                    fare: parseFloat(newTransit.fare)
                };
                
                const costs = { bus: 3000, subway: 10000, tram: 5000, bike: 1000 };
                const cost = costs[newTransit.transit_type] || 3000;
                
                const result = await ApiService.post('/jt/transit/create', transitData);
                if (result.code === 0) {
                    transits.value.push(result.data);
                } else {
                    transits.value.push({
                        id: Date.now(),
                        ...transitData,
                        ridership: 0,
                        status: 1
                    });
                }
                
                cityFunds.value = Math.max(0, cityFunds.value - cost);
                saveFullState();
                showAddTransit.value = false;
                newTransit.name = '';
                newTransit.transit_type = 'bus';
                newTransit.capacity = 50;
                newTransit.frequency = 10;
                newTransit.fare = 2.0;
                showToastFn(`公共交通线路创建成功，花费${cost}金币`, 'success');
            } catch (e) {
                const costs = { bus: 3000, subway: 10000, tram: 5000, bike: 1000 };
                const cost = costs[newTransit.transit_type] || 3000;
                
                transits.value.push({
                    id: Date.now(),
                    transit_type: newTransit.transit_type,
                    name: newTransit.name,
                    capacity: parseInt(newTransit.capacity),
                    frequency: parseInt(newTransit.frequency),
                    fare: parseFloat(newTransit.fare),
                    ridership: 0,
                    status: 1
                });
                
                cityFunds.value = Math.max(0, cityFunds.value - cost);
                saveFullState();
                showAddTransit.value = false;
                showToastFn(`公共交通线路创建成功，花费${cost}金币`, 'success');
            }
        };
        
        const triggerRandomAccident = async () => {
            try {
                const cityResult = await GameService.getCity();
                const cityId = cityResult.data?.id || 1;
                const result = await ApiService.post('/jt/accident/generate', {}, { city_id: cityId });
                if (result.code === 0 && result.data) {
                    accidents.value.push(result.data);
                    saveFullState();
                    showToastFn('⚠️ 新的交通事故已发生！', 'warning');
                } else {
                    const types = ['collision', 'breakdown', 'spill', 'construction'];
                    const severities = [1, 2, 3];
                    const descriptions = ['两车追尾，占用一条车道', '车辆抛锚', '路面有遗撒物', '道路施工'];
                    const typeIndex = Math.floor(Math.random() * types.length);
                    const newAccidentItem = {
                        id: Date.now(),
                        accident_type: types[typeIndex],
                        severity: severities[Math.floor(Math.random() * severities.length)],
                        position_x: 20 + Math.random() * 60,
                        position_y: 20 + Math.random() * 60,
                        description: descriptions[typeIndex],
                        status: 'active',
                        response_time: 0,
                        created_at: new Date().toISOString()
                    };
                    accidents.value.push(newAccidentItem);
                    saveFullState();
                    showToastFn('⚠️ 新的交通事故已发生！', 'warning');
                }
            } catch (e) {
                const types = ['collision', 'breakdown', 'spill', 'construction'];
                const severities = [1, 2, 3];
                const descriptions = ['两车追尾，占用一条车道', '车辆抛锚', '路面有遗撒物', '道路施工'];
                const typeIndex = Math.floor(Math.random() * types.length);
                const newAccidentItem = {
                    id: Date.now(),
                    accident_type: types[typeIndex],
                    severity: severities[Math.floor(Math.random() * severities.length)],
                    position_x: 20 + Math.random() * 60,
                    position_y: 20 + Math.random() * 60,
                    description: descriptions[typeIndex],
                    status: 'active',
                    response_time: 0,
                    created_at: new Date().toISOString()
                };
                accidents.value.push(newAccidentItem);
                saveFullState();
                showToastFn('⚠️ 新的交通事故已发生！', 'warning');
            }
        };
        
        const toggleSettings = () => {
            navigateTo('settings');
        };
        
        const getCellClass = (index) => {
            const isRoadCell = [3, 8, 11, 12, 13, 14, 15, 16, 17, 18, 23].includes(index);
            const isIntersection = [13].includes(index);
            
            if (isIntersection) return 'intersection signal';
            if (isRoadCell) {
                if ([3, 8, 18, 23].includes(index)) return 'road-vertical';
                return 'road-horizontal';
            }
            if ([1, 5, 19, 21, 25].includes(index)) return 'building';
            if ([7, 19].includes(index)) return 'park';
            return '';
        };
        
        const getCellIcon = (index) => {
            const icons = {
                1: '🏢',
                5: '🏪',
                7: '🌳',
                13: '🚦',
                19: '🌳',
                21: '🏠',
                25: '🏛️'
            };
            return icons[index] || '';
        };
        
        const getRoadTypeText = (type) => {
            const map = { normal: '普通道路', highway: '高速公路', express: '快速路' };
            return map[type] || type;
        };
        
        const getSignalTypeText = (type) => {
            const map = { fixed: '固定时序', adaptive: '自适应', pedestrian: '行人过街' };
            return map[type] || type;
        };
        
        const getAccidentTypeText = (type) => {
            const map = { collision: '交通事故', breakdown: '车辆故障', spill: '路面遗撒', construction: '道路施工' };
            return map[type] || type;
        };
        
        const getSeverityText = (severity) => {
            const map = { 1: '轻微', 2: '一般', 3: '严重' };
            return map[severity] || '未知';
        };
        
        const getStatusText = (status) => {
            const map = { active: '待处理', responding: '处理中', resolved: '已解决' };
            return map[status] || status;
        };
        
        const getTransitTypeText = (type) => {
            const map = { bus: '公交车', subway: '地铁', tram: '有轨电车', bike: '共享单车' };
            return map[type] || type;
        };
        
        const getStatusBadgeClass = (status) => {
            if (status === 'resolved') return 'status-badge resolved';
            if (status === 'responding') return 'status-badge responding';
            return 'status-badge active';
        };
        
        const getSignalStateColor = (state) => {
            if (state === 'green') return 'bg-green-500';
            if (state === 'yellow') return 'bg-yellow-500';
            return 'bg-red-500';
        };
        
        const getVehicleEmoji = (type) => {
            const map = { car: '🚗', bus: '🚌', truck: '🚚', taxi: '🚕' };
            return map[type] || '🚗';
        };
        
        const getTransitEmoji = (type) => {
            const map = { bus: '🚌', subway: '🚇', tram: '🚋', bike: '🚲' };
            return map[type] || '🚌';
        };
        
        onMounted(async () => {
            window.addEventListener('hashchange', () => {
                const hash = window.location.hash.slice(1) || 'dashboard';
                if (hash !== currentRoute.value) {
                    currentRoute.value = hash;
                }
            });
            
            checkAuth();
            
            if (isLoggedIn.value) {
                await initGameData();
                startAutoSave();
            }
            
            const hash = window.location.hash.slice(1);
            if (hash && hash !== 'login' && hash !== 'register') {
                currentRoute.value = hash;
            } else if (isLoggedIn.value) {
                currentRoute.value = 'dashboard';
            }
            
            setInterval(() => {
                if (isSimulating.value && Math.random() < 0.01 * settings.simulationSpeed) {
                    triggerRandomAccident();
                }
            }, 3000);
        });
        
        onUnmounted(() => {
            stopSimulation();
            if (autoSaveInterval) {
                clearInterval(autoSaveInterval);
            }
        });
        
        return {
            isLoggedIn,
            authMode,
            loading,
            currentRoute,
            loginForm,
            registerForm,
            showToast,
            toastMessage,
            toastType,
            gameState,
            roads,
            signals,
            accidents,
            transits,
            vehicles,
            isSimulating,
            showAddRoad,
            showAddSignal,
            showAddAccident,
            showAddTransit,
            settings,
            newRoad,
            newSignal,
            newAccident,
            newTransit,
            pageTitle,
            gameTime,
            activeAccidents,
            cityInfo,
            handleLogin,
            handleRegister,
            handleLogout,
            navigateTo,
            toggleSimulation,
            advanceTime,
            saveGame,
            toggleSignal,
            respondAccident,
            resolveAccident,
            createRoad,
            createSignal,
            createTransit,
            triggerRandomAccident,
            toggleSettings,
            getCellClass,
            getCellIcon,
            getRoadTypeText,
            getSignalTypeText,
            getAccidentTypeText,
            getSeverityText,
            getStatusText,
            getTransitTypeText,
            getStatusBadgeClass,
            getSignalStateColor,
            getVehicleEmoji,
            getTransitEmoji,
            showToastFn,
            hideToast
        };
    }
};

const app = createApp(App);
app.mount('#app');
