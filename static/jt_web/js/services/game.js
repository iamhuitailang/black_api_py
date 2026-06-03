const GameService = {
    state: null,
    simulationInterval: null,
    audioContext: null,

    async loadGame() {
        try {
            const result = await ApiService.get('/jt/game/load/get');
            if (result.code === 0 && result.data) {
                this.state = result.data;
            }
            return result;
        } catch (e) {
            const cached = Storage.getGameState();
            if (cached && cached.gameState) {
                this.state = cached.gameState;
                return { code: 0, data: cached.gameState };
            }
            return this.initNewGame();
        }
    },

    async saveGame() {
        if (!this.state) return { code: 1, msg: '无游戏状态' };
        
        try {
            return await ApiService.post('/jt/game/save', this.state);
        } catch (e) {
            return { code: 0, data: this.state, msg: '本地保存成功' };
        }
    },

    async initNewGame() {
        this.state = {
            cityName: '交通新城',
            day: 1,
            hour: 8,
            trafficFlow: 100,
            satisfaction: 75,
            roadCount: 8,
            signalCount: 4,
            budget: 10000,
            population: 50000
        };
        return { code: 0, data: this.state };
    },

    getState() {
        return this.state;
    },

    async getCity() {
        try {
            return await ApiService.get('/jt/city/detail/get');
        } catch (e) {
            return { code: 0, data: { name: this.state?.cityName || '交通新城' } };
        }
    },

    async getRoads() {
        try {
            return await ApiService.get('/jt/road/list/get');
        } catch (e) {
            return { code: 1, data: [] };
        }
    },

    async getSignals() {
        try {
            return await ApiService.get('/jt/signal/list/get');
        } catch (e) {
            return { code: 1, data: [] };
        }
    },

    async getAccidents() {
        try {
            return await ApiService.get('/jt/accident/list/get');
        } catch (e) {
            return { code: 1, data: [] };
        }
    },

    async getTransits() {
        try {
            return await ApiService.get('/jt/transit/list/get');
        } catch (e) {
            return { code: 1, data: [] };
        }
    },

    advanceTime(hours = 1) {
        if (!this.state) return;
        
        this.state.hour += hours;
        while (this.state.hour >= 24) {
            this.state.hour -= 24;
            this.state.day++;
        }
        
        this.simulateTraffic();
        return this.state;
    },

    simulateTraffic() {
        if (!this.state) return;

        const hour = this.state.hour;
        const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
        
        if (isRushHour) {
            this.state.trafficFlow = Math.min(500, this.state.trafficFlow + Math.random() * 50);
            this.state.satisfaction = Math.max(30, this.state.satisfaction - Math.random() * 5);
        } else {
            this.state.trafficFlow = Math.max(50, this.state.trafficFlow - Math.random() * 20);
            this.state.satisfaction = Math.min(100, this.state.satisfaction + Math.random() * 2);
        }

        this.state.trafficFlow = Math.round(this.state.trafficFlow);
        this.state.satisfaction = Math.round(this.state.satisfaction);
    },

    simulateSignals(signals) {
        return signals.map(signal => {
            if (signal.timer === undefined || signal.timer === null) {
                signal.timer = signal.current_state === 'green' ? (signal.green_duration || 30) :
                              signal.current_state === 'yellow' ? (signal.yellow_duration || 5) :
                              (signal.red_duration || 30);
            }
            signal.timer--;
            if (signal.timer <= 0) {
                const stateField = signal.current_state || signal.state;
                if (stateField === 'green') {
                    signal.current_state = 'yellow';
                    signal.state = 'yellow';
                    signal.timer = signal.yellow_duration || 5;
                } else if (stateField === 'yellow') {
                    signal.current_state = 'red';
                    signal.state = 'red';
                    signal.timer = signal.red_duration || 30;
                } else {
                    signal.current_state = 'green';
                    signal.state = 'green';
                    signal.timer = signal.green_duration || 30;
                }
            }
            return signal;
        });
    },

    startSimulation(callback, speed = 1) {
        this.stopSimulation();
        const interval = Math.max(50, 1000 / speed);
        this.simulationInterval = setInterval(() => {
            if (callback) callback();
        }, interval);
    },

    stopSimulation() {
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
        }
    },

    isSimulating() {
        return !!this.simulationInterval;
    },

    initAudio() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    },

    playMusic(type = 'background') {
        this.initAudio();
    },

    stopMusic() {
    },

    setVolume(volume) {
    }
};

window.GameService = GameService;
