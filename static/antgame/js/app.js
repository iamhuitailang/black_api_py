const { createApp, ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } = Vue;

const STORAGE_KEY_CURRENT_SAVE = 'antgame_current_save';
const STORAGE_KEY_TUTORIAL_SHOWN = 'antgame_tutorial_shown';
const STORAGE_KEY_GAME_SPEED = 'antgame_game_speed';

const App = {
    setup() {
        const saves = ref([]);
        const currentSave = ref(null);
        const newSaveName = ref('');
        const showTutorial = ref(false);
        const showFirstTip = ref(false);
        const gameState = reactive({
            save: null,
            ants: [],
            cells: [],
            ant_counts: {},
            cell_counts: {},
        });
        const selectedTool = ref(null);
        const gameSpeed = ref(1);
        const message = ref('');
        const messageType = ref('info');
        const renderer = ref(null);
        const isLoading = ref(false);
        
        let gameLoopTimer = null;
        let messageTimer = null;
        let lastTickTime = 0;
        const TICK_INTERVAL = 1000;

        const antCounts = computed(() => gameState.ant_counts || {});

        const seasonNames = {
            spring: '春季',
            summer: '夏季',
            autumn: '秋季',
            winter: '冬季',
        };

        const toolNames = {
            dig: '挖掘',
            chamber: '小室',
            farm: '真菌农场',
            storage: '储藏室',
            queen_chamber: '蚁后室',
        };

        function getSeasonName(season) {
            return seasonNames[season] || season;
        }

        function getToolName(tool) {
            return toolNames[tool] || tool;
        }

        function showMessage(msg, type = 'info') {
            message.value = msg;
            messageType.value = type;
            
            if (messageTimer) {
                clearTimeout(messageTimer);
            }
            
            messageTimer = setTimeout(() => {
                message.value = '';
            }, 2500);
        }

        async function loadSaveList() {
            try {
                const result = await api.getSaveList();
                if (result.code === 0) {
                    saves.value = result.data.saves || [];
                    return true;
                }
            } catch (e) {
                console.error('加载存档列表失败:', e);
            }
            return false;
        }

        async function loadSave(saveId) {
            if (isLoading.value) return;
            isLoading.value = true;
            
            try {
                const result = await api.getGameState(saveId);
                if (result.code === 0) {
                    currentSave.value = saveId;
                    updateGameState(result.data);
                    
                    try {
                        localStorage.setItem(STORAGE_KEY_CURRENT_SAVE, saveId.toString());
                    } catch (e) {
                        console.warn('无法保存到localStorage:', e);
                    }
                    
                    await nextTick();
                    if (!renderer.value) {
                        renderer.value = new GameRenderer('gameCanvas');
                    }
                    renderer.value.setGameData(result.data);
                    renderer.value.start();
                    
                    startGameLoop();
                    
                    try {
                        const tutorialShown = localStorage.getItem(STORAGE_KEY_TUTORIAL_SHOWN);
                        if (!tutorialShown) {
                            setTimeout(() => {
                                showTutorial.value = true;
                            }, 500);
                        }
                    } catch (e) {
                        showTutorial.value = true;
                    }
                    
                    isLoading.value = false;
                    return true;
                } else {
                    showMessage(result.message, 'error');
                }
            } catch (e) {
                console.error('加载存档失败:', e);
                showMessage('加载存档失败', 'error');
            }
            
            isLoading.value = false;
            return false;
        }

        function closeTutorial() {
            showTutorial.value = false;
            try {
                localStorage.setItem(STORAGE_KEY_TUTORIAL_SHOWN, '1');
            } catch (e) {}
            
            showFirstTip.value = true;
            setTimeout(() => {
                showFirstTip.value = false;
            }, 5000);
        }

        function openTutorial() {
            showTutorial.value = true;
        }

        function updateGameState(data) {
            if (data.save) {
                gameState.save = data.save;
            }
            if (data.ants) {
                gameState.ants = data.ants;
            }
            if (data.cells) {
                gameState.cells = data.cells;
            }
            if (data.ant_counts) {
                gameState.ant_counts = data.ant_counts;
            }
            if (data.cell_counts) {
                gameState.cell_counts = data.cell_counts;
            }
        }

        async function createNewGame() {
            const name = newSaveName.value.trim();
            
            if (!name) {
                showMessage('请输入存档名称！', 'error');
                return;
            }
            
            if (name.length < 2) {
                showMessage('存档名称至少2个字符', 'error');
                return;
            }
            
            if (isLoading.value) return;
            isLoading.value = true;
            
            try {
                const result = await api.createNewGame(name);
                if (result.code === 0) {
                    showMessage('游戏创建成功！');
                    
                    try {
                        localStorage.removeItem(STORAGE_KEY_TUTORIAL_SHOWN);
                    } catch (e) {}
                    
                    isLoading.value = false;
                    loadSave(result.data.save.id);
                } else {
                    showMessage(result.message, 'error');
                    isLoading.value = false;
                }
            } catch (e) {
                console.error('创建游戏失败:', e);
                showMessage('创建游戏失败', 'error');
                isLoading.value = false;
            }
        }

        async function deleteSave(saveId) {
            if (!confirm('确定要删除这个存档吗？')) return;
            
            try {
                const result = await api.deleteSave(saveId);
                if (result.code === 0) {
                    showMessage('存档已删除');
                    
                    try {
                        const currentId = localStorage.getItem(STORAGE_KEY_CURRENT_SAVE);
                        if (currentId && parseInt(currentId) === saveId) {
                            localStorage.removeItem(STORAGE_KEY_CURRENT_SAVE);
                        }
                    } catch (e) {}
                    
                    loadSaveList();
                } else {
                    showMessage(result.message, 'error');
                }
            } catch (e) {
                console.error('删除存档失败:', e);
                showMessage('删除存档失败', 'error');
            }
        }

        function backToMenu() {
            stopGameLoop();
            if (renderer.value) {
                renderer.value.stop();
            }
            currentSave.value = null;
            selectedTool.value = null;
            showTutorial.value = false;
            showFirstTip.value = false;
            
            try {
                localStorage.removeItem(STORAGE_KEY_CURRENT_SAVE);
            } catch (e) {}
            
            loadSaveList();
        }

        function startGameLoop() {
            stopGameLoop();
            
            const tickMs = TICK_INTERVAL / gameSpeed.value;
            
            async function gameTick() {
                if (!currentSave.value) return;
                if (gameState.save?.is_paused) {
                    gameLoopTimer = setTimeout(gameTick, tickMs);
                    return;
                }
                
                try {
                    const result = await api.tick(currentSave.value);
                    if (result.code === 0) {
                        updateGameState(result.data);
                        if (renderer.value) {
                            renderer.value.setGameData(result.data);
                        }
                    }
                } catch (e) {
                    console.error('游戏推进失败:', e);
                }
                
                gameLoopTimer = setTimeout(gameTick, tickMs);
            }
            
            gameLoopTimer = setTimeout(gameTick, tickMs);
        }

        function stopGameLoop() {
            if (gameLoopTimer) {
                clearTimeout(gameLoopTimer);
                gameLoopTimer = null;
            }
        }

        function changeSpeed() {
            const speeds = [1, 2, 3, 5];
            const currentIndex = speeds.indexOf(gameSpeed.value);
            gameSpeed.value = speeds[(currentIndex + 1) % speeds.length];
            
            try {
                localStorage.setItem(STORAGE_KEY_GAME_SPEED, gameSpeed.value.toString());
            } catch (e) {}
            
            if (currentSave.value && !gameState.save?.is_paused) {
                startGameLoop();
            }
        }

        async function togglePause() {
            if (!currentSave.value) return;
            
            try {
                const result = await api.togglePause(currentSave.value);
                if (result.code === 0) {
                    updateGameState(result.data);
                    if (renderer.value) {
                        renderer.value.setGameData(result.data);
                    }
                }
            } catch (e) {
                console.error('切换暂停失败:', e);
            }
        }

        function selectTool(tool) {
            if (selectedTool.value === tool) {
                selectedTool.value = null;
            } else {
                selectedTool.value = tool;
                showMessage(`已选择${getToolName(tool)}工具，点击地图使用`);
            }
        }

        async function onCanvasClick(event) {
            if (!currentSave.value || !renderer.value) return;
            
            const pos = renderer.value.getGridPosition(event.clientX, event.clientY);
            if (!pos) return;
            
            const cell = renderer.value.getCellAt(pos.gridX, pos.gridY);
            if (!cell) return;
            
            if (selectedTool.value === 'dig') {
                await digCell(pos.gridX, pos.gridY);
            } else if (['chamber', 'farm', 'storage', 'queen_chamber'].includes(selectedTool.value)) {
                await buildRoom(pos.gridX, pos.gridY, selectedTool.value);
            }
        }

        async function digCell(gridX, gridY) {
            try {
                const result = await api.dig(currentSave.value, gridX, gridY);
                if (result.code === 0) {
                    updateGameState(result.data);
                    if (renderer.value) {
                        renderer.value.setGameData(result.data);
                    }
                } else {
                    showMessage(result.message, 'error');
                }
            } catch (e) {
                console.error('挖掘失败:', e);
                showMessage('挖掘失败', 'error');
            }
        }

        async function buildRoom(gridX, gridY, roomType) {
            try {
                const result = await api.build(currentSave.value, gridX, gridY, roomType);
                if (result.code === 0) {
                    updateGameState(result.data);
                    if (renderer.value) {
                        renderer.value.setGameData(result.data);
                    }
                } else {
                    showMessage(result.message, 'error');
                }
            } catch (e) {
                console.error('建造失败:', e);
                showMessage('建造失败', 'error');
            }
        }

        async function spawnAnt(antType) {
            if (!currentSave.value) return;
            
            try {
                const result = await api.spawnAnt(currentSave.value, antType);
                if (result.code === 0) {
                    updateGameState(result.data);
                    if (renderer.value) {
                        renderer.value.setGameData(result.data);
                    }
                    const antNames = { worker: '工蚁', soldier: '兵蚁', scout: '侦查蚁' };
                    showMessage(`孵化了一只${antNames[antType] || antType}！`);
                } else {
                    showMessage(result.message, 'error');
                }
            } catch (e) {
                console.error('孵化蚂蚁失败:', e);
                showMessage('孵化蚂蚁失败', 'error');
            }
        }

        async function tryRestoreSave() {
            try {
                const savedId = localStorage.getItem(STORAGE_KEY_CURRENT_SAVE);
                if (!savedId) return false;
                
                const saveId = parseInt(savedId);
                if (!saveId) return false;
                
                await loadSaveList();
                
                const saveExists = saves.value.some(s => s.id === saveId);
                if (saveExists) {
                    const savedSpeed = localStorage.getItem(STORAGE_KEY_GAME_SPEED);
                    if (savedSpeed) {
                        const speed = parseInt(savedSpeed);
                        if ([1, 2, 3, 5].includes(speed)) {
                            gameSpeed.value = speed;
                        }
                    }
                    
                    await loadSave(saveId);
                    return true;
                } else {
                    localStorage.removeItem(STORAGE_KEY_CURRENT_SAVE);
                }
            } catch (e) {
                console.warn('恢复存档失败:', e);
            }
            return false;
        }

        onMounted(async () => {
            const restored = await tryRestoreSave();
            if (!restored) {
                loadSaveList();
            }
        });

        onUnmounted(() => {
            stopGameLoop();
            if (renderer.value) {
                renderer.value.stop();
            }
            if (messageTimer) {
                clearTimeout(messageTimer);
            }
        });

        watch(gameSpeed, () => {
            if (currentSave.value && !gameState.save?.is_paused) {
                startGameLoop();
            }
        });

        return {
            saves,
            currentSave,
            newSaveName,
            showTutorial,
            showFirstTip,
            gameState,
            selectedTool,
            gameSpeed,
            message,
            messageType,
            isLoading,
            antCounts,
            getSeasonName,
            getToolName,
            loadSave,
            createNewGame,
            deleteSave,
            backToMenu,
            togglePause,
            changeSpeed,
            selectTool,
            onCanvasClick,
            spawnAnt,
            closeTutorial,
            openTutorial,
        };
    },
};

const app = createApp(App);
app.mount('#app');
