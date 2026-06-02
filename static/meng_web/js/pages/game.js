const GamePage = {
    data: {
        dreamId: null,
        dream: null,
        user: null,
        blocks: [],
        selectedBlockType: 'grass',
        buildMode: 'place',
        camera: {
            rotation: { x: -55, y: 45 },
            zoom: 1,
            target: { x: 0, y: 0, z: 0 }
        },
        gridSize: 16,
        blockSize: 50,
        isDragging: false,
        lastMousePos: { x: 0, y: 0 },
        fps: 0,
        frameCount: 0,
        lastFpsUpdate: 0,
        weather: 'sunny',
        timeOfDay: 'day',
        gravity: 1.0,
        rightPanelTab: 'build',
        longPressTimer: null,
        hoveredGrid: null,
        selectedBlockId: null
    },

    render() {
        this.data.user = AuthService.getCurrentUser();
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="game-page page no-tabbar">
                ${this.renderTopBar()}
                <div class="game-container">
                    ${this.renderLeftToolbar()}
                    ${this.renderGameCanvas()}
                    ${this.renderRightPanel()}
                </div>
                ${this.renderBottomHotbar()}
                ${this.renderWeatherOverlay()}
            </div>
        `;

        this.bindEvents();
        this.loadGameState();
        this.initGame();
        this.startFpsCounter();
    },

    renderTopBar() {
        const user = this.data.user || {};
        const dream = this.data.dream || {};
        const cam = this.data.camera.target;

        return `
            <div class="game-top-bar">
                <div class="top-bar-left">
                    <button class="top-bar-btn" onclick="GamePage.goBack()">
                        <span class="btn-icon">←</span>
                    </button>
                    <div class="dream-info">
                        <span class="dream-icon">🌙</span>
                        <span class="dream-name">${dream.name || '加载中...'}</span>
                    </div>
                </div>
                <div class="top-bar-center">
                    <div class="status-item">
                        <span class="status-icon">💎</span>
                        <span class="status-value">${user.dream_fragments || 0}</span>
                    </div>
                    <div class="status-item">
                        <span class="status-icon">📍</span>
                        <span class="status-value">(${Math.round(cam.x)}, ${Math.round(cam.y)}, ${Math.round(cam.z)})</span>
                    </div>
                    <div class="status-item">
                        <span class="status-icon">⚡</span>
                        <span class="status-value" id="fpsDisplay">-- FPS</span>
                    </div>
                </div>
                <div class="top-bar-right">
                    <button class="top-bar-btn" onclick="GamePage.saveGameState()">
                        <span class="btn-icon">💾</span>
                    </button>
                    <button class="top-bar-btn" onclick="GamePage.toggleRightPanel()">
                        <span class="btn-icon">⚙️</span>
                    </button>
                </div>
            </div>
        `;
    },

    renderLeftToolbar() {
        const blockTypes = Block3D.getAllBlockTypes();
        const selected = this.data.selectedBlockType;

        return `
            <div class="game-left-toolbar">
                <div class="toolbar-title">方块</div>
                <div class="block-tool-list">
                    ${blockTypes.map(block => `
                        <div class="block-tool-item ${selected === block.type ? 'selected' : ''}" 
                             data-block-type="${block.type}"
                             onclick="GamePage.selectBlockType('${block.type}')">
                        <span class="block-icon">${block.icon}</span>
                        <span class="block-name">${block.name}</span>
                    `).join('')}
                </div>
            </div>
        `;
    },

    renderGameCanvas() {
        const gridSize = this.data.gridSize;
        const halfGrid = Math.floor(gridSize / 2);

        return `
            <div class="game-canvas-wrapper">
                <div class="game-canvas" id="gameCanvas">
                    <div class="game-scene" id="gameScene" style="transform: perspective(1000px) rotateX(${this.data.camera.rotation.x}deg) rotateY(${this.data.camera.rotation.y}deg) scale(${this.data.camera.zoom})">
                        <div class="ground-grid" id="groundGrid">
                            ${this.renderGroundGrid()}
                        </div>
                        <div class="blocks-container" id="blocksContainer">
                        </div>
                        <div class="grid-highlight" id="gridHighlight" style="display: none;"></div>
                    </div>
                </div>
            </div>
            <div class="canvas-controls">
                <button class="control-btn" onclick="GamePage.handleZoom(0.1)">+</button>
                <button class="control-btn" onclick="GamePage.handleZoom(-0.1)">-</button>
                <button class="control-btn" onclick="GamePage.resetCamera()">↺</button>
            </div>
        `;
    },

    renderGroundGrid() {
        const gridSize = this.data.gridSize;
        const blockSize = this.data.blockSize;
        const halfGrid = Math.floor(gridSize / 2);
        let html = '';

        for (let x = -halfGrid; x < halfGrid; x++) {
            for (let z = -halfGrid; z < halfGrid; z++) {
                const isEven = (x + z) % 2 === 0;

                html += `
                    <div class="grid-cell" 
                         data-x="${x}" 
                         data-z="${z}"
                         style="
                            transform: translate3d(${x * blockSize}px, 0, ${z * blockSize}px);
                            width: ${blockSize}px;
                            height: ${blockSize}px;
                            background: ${isEven ? 'rgba(124, 179, 66, 0.3)' : 'rgba(139, 195, 74, 0.3)'};
                        ">
                    </div>
                `;
            }
        }

        return html;
    },

    renderRightPanel() {
        const tabs = [
            { id: 'build', name: '建造', icon: '🔨' },
            { id: 'creature', name: '生物', icon: '🐾' },
            { id: 'level', name: '关卡', icon: '🎯' },
            { id: 'env', name: '环境', icon: '🌤️' }
        ];

        return `
            <div class="game-right-panel" id="rightPanel">
                <div class="panel-tabs">
                    ${tabs.map(tab => `
                        <div class="panel-tab ${this.data.rightPanelTab === tab.id ? 'active' : ''}"
                             onclick="GamePage.switchRightTab('${tab.id}')">
                            <span class="tab-icon">${tab.icon}</span>
                            <span class="tab-name">${tab.name}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="panel-content">
                    ${this.renderRightPanelContent()}
                </div>
            </div>
        `;
    },

    renderRightPanelContent() {
        const tab = this.data.rightPanelTab;

        switch (tab) {
            case 'build':
                return this.renderBuildPanel();
            case 'creature':
                return this.renderCreaturePanel();
            case 'level':
                return this.renderLevelPanel();
            case 'env':
                return this.renderEnvPanel();
            default:
                return '';
        }
    },

    renderBuildPanel() {
        const modes = [
            { id: 'place', name: '放置', icon: '➕' },
            { id: 'remove', name: '删除', icon: '🗑️' },
            { id: 'select', name: '选择', icon: '👆' }
        ];

        return `
            <div class="build-panel">
                <div class="panel-section">
                    <div class="section-title">建造模式</div>
                    <div class="mode-buttons">
                        ${modes.map(mode => `
                            <div class="mode-btn ${this.data.buildMode === mode.id ? 'active' : ''}"
                                 onclick="GamePage.setBuildMode('${mode.id}')">
                                <span class="mode-icon">${mode.icon}</span>
                                <span class="mode-name">${mode.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="panel-section">
                    <div class="section-title">快速操作</div>
                    <button class="action-btn" onclick="GamePage.clearAllBlocks()">
                        <span>🧹</span> 清除所有方块
                    </button>
                    <button class="action-btn" onclick="GamePage.exportBlueprint()">
                        <span>📤</span> 导出蓝图
                    </button>
                    <button class="action-btn" onclick="GamePage.importBlueprint()">
                        <span>📥</span> 导入蓝图
                    </button>
                </div>
            </div>
        `;
    },

    renderCreaturePanel() {
        const creatures = [
            { type: 'human', name: '人类', icon: '👤' },
            { type: 'animal', name: '动物', icon: '🐕' },
            { type: 'monster', name: '怪物', icon: '👹' },
            { type: 'npc', name: 'NPC', icon: '🧙' }
        ];

        return `
            <div class="creature-panel">
                <div class="panel-section">
                    <div class="section-title">放置生物</div>
                    <div class="creature-list">
                        ${creatures.map(c => `
                            <div class="creature-item" onclick="GamePage.placeCreature('${c.type}')">
                                <span class="creature-icon">${c.icon}</span>
                                <span class="creature-name">${c.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="panel-section">
                    <div class="section-title">AI编辑</div>
                    <button class="action-btn" onclick="GamePage.editCreatureAI()">
                        <span>🤖</span> 编辑AI行为
                    </button>
                    <button class="action-btn" onclick="GamePage.clearAllCreatures()">
                        <span>🗑️</span> 清除所有生物
                    </button>
                </div>
            </div>
        `;
    },

    renderLevelPanel() {
        return `
            <div class="level-panel">
                <div class="panel-section">
                    <div class="section-title">创建关卡</div>
                    <div class="form-group">
                        <label class="form-label">关卡名称</label>
                        <input type="text" class="form-control" id="levelName" placeholder="输入关卡名称">
                    </div>
                    <div class="form-group">
                        <label class="form-label">难度</label>
                        <select class="form-control" id="levelDifficulty">
                            <option value="easy">简单</option>
                            <option value="normal">普通</option>
                            <option value="hard">困难</option>
                            <option value="extreme">极限</option>
                        </select>
                    </div>
                    <button class="btn btn-primary btn-block" onclick="GamePage.createLevel()">
                        <span>🎯</span> 创建关卡
                    </button>
                </div>
                <div class="panel-section">
                    <div class="section-title">目标点</div>
                    <button class="action-btn" onclick="GamePage.setTargetPoint()">
                        <span>📍</span> 设置目标点
                    </button>
                    <button class="action-btn" onclick="GamePage.showLevelList()">
                        <span>📋</span> 关卡列表
                    </button>
                </div>
            </div>
        `;
    },

    renderEnvPanel() {
        const weathers = [
            { id: 'sunny', name: '晴天', icon: '☀️' },
            { id: 'cloudy', name: '多云', icon: '⛅' },
            { id: 'rain', name: '雨天', icon: '🌧️' },
            { id: 'snow', name: '雪天', icon: '❄️' },
            { id: 'fog', name: '雾天', icon: '🌫️' }
        ];

        const times = [
            { id: 'dawn', name: '黎明', icon: '🌅' },
            { id: 'day', name: '白天', icon: '🌞' },
            { id: 'dusk', name: '黄昏', icon: '🌇' },
            { id: 'sunset', name: '日落', icon: '🌅' },
            { id: 'night', name: '夜晚', icon: '🌙' }
        ];

        return `
            <div class="env-panel">
                <div class="panel-section">
                    <div class="section-title">天气</div>
                    <div class="weather-buttons">
                        ${weathers.map(w => `
                            <div class="weather-btn ${this.data.weather === w.id ? 'active' : ''}"
                                 onclick="GamePage.toggleWeather('${w.id}')">
                                <span class="weather-icon">${w.icon}</span>
                                <span class="weather-name">${w.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="panel-section">
                    <div class="section-title">昼夜</div>
                    <div class="time-buttons">
                        ${times.map(t => `
                            <div class="time-btn ${this.data.timeOfDay === t.id ? 'active' : ''}"
                                 onclick="GamePage.toggleTimeOfDay('${t.id}')">
                                <span class="time-icon">${t.icon}</span>
                                <span class="time-name">${t.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="panel-section">
                    <div class="section-title">重力</div>
                    <div class="gravity-slider">
                        <input type="range" min="0" max="2" step="0.1" value="${this.data.gravity}" 
                               id="gravitySlider" oninput="GamePage.setGravity(this.value)">
                        <div class="gravity-value">${this.data.gravity}g</div>
                    </div>
                </div>
            </div>
        `;
    },

    renderBottomHotbar() {
        const hotbarBlocks = ['grass', 'stone', 'wood', 'glass', 'light', 'dream_block'];
        const selected = this.data.selectedBlockType;

        return `
            <div class="game-bottom-hotbar">
                ${hotbarBlocks.map((type, index) => {
                    const block = Block3D.getBlockType(type);
                    return `
                        <div class="hotbar-slot ${selected === type ? 'selected' : ''}"
                             data-slot="${index}"
                             onclick="GamePage.selectBlockType('${type}')">
                            <span class="hotbar-icon">${block.icon}</span>
                            <span class="hotbar-key">${index + 1}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    renderWeatherOverlay() {
        const classes = ['weather-overlay'];
        if (this.data.weather === 'rain') classes.push('weather-rain');
        if (this.data.weather === 'snow') classes.push('weather-snow');
        if (this.data.weather === 'fog') classes.push('weather-fog');
        if (this.data.timeOfDay === 'night') classes.push('time-night');

        return `<div class="${classes.join(' ')}" id="weatherOverlay"></div>`;
    },

    bindEvents() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;

        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        canvas.addEventListener('mouseleave', (e) => this.onMouseUp(e));
        canvas.addEventListener('wheel', (e) => this.onWheel(e));
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        document.addEventListener('keydown', (e) => this.onKeyDown(e));

        const gridCells = document.querySelectorAll('.grid-cell');
        gridCells.forEach(cell => {
            cell.addEventListener('click', (e) => this.onGridClick(e));
            cell.addEventListener('mouseenter', (e) => this.onGridHover(e));
            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.onGridRightClick(e);
            });
            cell.addEventListener('mousedown', (e) => this.startLongPress(e, cell));
            cell.addEventListener('mouseup', () => this.cancelLongPress());
            cell.addEventListener('mouseleave', () => this.cancelLongPress());
        });
    },

    onMouseDown(e) {
        if (e.button === 0 && e.target.classList.contains('grid-cell')) return;
        if (e.button === 0 && e.target.closest('.block-3d')) return;

        this.data.isDragging = true;
        this.data.lastMousePos = { x: e.clientX, y: e.clientY };
        document.body.style.cursor = 'grabbing';
    },

    onMouseMove(e) {
        if (this.data.isDragging) {
            const dx = e.clientX - this.data.lastMousePos.x;
            const dy = e.clientY - this.data.lastMousePos.y;

            this.data.camera.rotation.y += dx * 0.3;
            this.data.camera.rotation.x -= dy * 0.3;
            this.data.camera.rotation.x = Math.max(-85, Math.min(0, this.data.camera.rotation.x));

            this.data.lastMousePos = { x: e.clientX, y: e.clientY };
            this.handleCameraRotate();
        }

        this.updateGridHighlight(e);
    },

    onMouseUp() {
        this.data.isDragging = false;
        document.body.style.cursor = 'default';
        this.cancelLongPress();
    },

    onWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        this.handleZoom(delta);
    },

    onKeyDown(e) {
        const keyMap = { '1': 'grass', '2': 'stone', '3': 'wood', '4': 'glass', '5': 'light', '6': 'dream_block' };
        if (keyMap[e.key]) {
            this.selectBlockType(keyMap[e.key]);
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (this.data.selectedBlockId) {
                this.handleBlockRemove(this.data.selectedBlockId);
            }
        }

        if (e.key === 'Escape') {
            this.data.selectedBlockId = null;
            this.updateSelectedBlock();
        }
    },

    onGridClick(e) {
        if (this.data.isDragging) return;

        const cell = e.currentTarget;
        const x = parseInt(cell.dataset.x);
        const z = parseInt(cell.dataset.z);

        this.data.hoveredGrid = { x, z };

        if (this.data.buildMode === 'place') {
            this.handleBlockPlace(x, 0, z);
        } else if (this.data.buildMode === 'remove') {
            const block = this.findBlockAt(x, 0, z);
            if (block) {
                this.handleBlockRemove(block.id);
            }
        } else if (this.data.buildMode === 'select') {
            const block = this.findBlockAt(x, 0, z);
            if (block) {
                this.data.selectedBlockId = block.id;
                this.updateSelectedBlock();
            }
        }
    },

    onGridRightClick(e) {
        const cell = e.currentTarget;
        const x = parseInt(cell.dataset.x);
        const z = parseInt(cell.dataset.z);
        const block = this.findBlockAt(x, 0, z);
        if (block) {
            this.handleBlockRemove(block.id);
        }
    },

    onGridHover(e) {
        const cell = e.currentTarget;
        const x = parseInt(cell.dataset.x);
        const z = parseInt(cell.dataset.z);
        this.data.hoveredGrid = { x, z };
        this.updateGridHighlightPosition(x, z);
    },

    startLongPress(e, cell) {
        this.cancelLongPress();
        this.data.longPressTimer = setTimeout(() => {
            const x = parseInt(cell.dataset.x);
            const z = parseInt(cell.dataset.z);
            const block = this.findBlockAt(x, 0, z);
            if (block) {
                this.handleBlockRemove(block.id);
            }
        }, 500);
    },

    cancelLongPress() {
        if (this.data.longPressTimer) {
            clearTimeout(this.data.longPressTimer);
            this.data.longPressTimer = null;
        }
    },

    updateGridHighlight(e) {
        const highlight = document.getElementById('gridHighlight');
        if (!highlight || this.data.isDragging) {
            if (highlight) highlight.style.display = 'none';
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const scene = document.getElementById('gameScene');
        const cells = document.elementsFromPoint(e.clientX, e.clientY);
        const gridCell = cells.find(el => el.classList.contains('grid-cell'));

        if (gridCell) {
            const gx = parseInt(gridCell.dataset.x);
            const gz = parseInt(gridCell.dataset.z);
            this.updateGridHighlightPosition(gx, gz);
        }
    },

    updateGridHighlightPosition(x, z) {
        const highlight = document.getElementById('gridHighlight');
        if (!highlight) return;

        const blockSize = this.data.blockSize;

        highlight.style.display = 'block';
        highlight.style.width = blockSize + 'px';
        highlight.style.height = blockSize + 'px';
        highlight.style.transform = `translate3d(${x * blockSize}px, 0, ${z * blockSize}px)`;
    },

    findBlockAt(x, y, z) {
        return this.data.blocks.find(b => b.x === x && b.y === y && b.z === z);
    },

    async initGame(dreamId = null) {
        try {
            Loading.show();

            if (!dreamId) {
                const routerParams = Router.getParams ? Router.getParams() : {};
                const queryParams = Utils.getQueryParams();
                dreamId = routerParams.dream_id || queryParams.dream_id || this.data.dreamId;
            }

            if (!dreamId) {
                const userResult = await AuthService.getCurrentUserInfo();
                if (userResult.code === 0 && userResult.data) {
                    this.data.user = userResult.data;
                }
                const dreamsResult = await DreamService.getMyDreams(1, 1);
                if (dreamsResult.code === 0 && dreamsResult.data && dreamsResult.data.items && dreamsResult.data.items.length > 0) {
                    dreamId = dreamsResult.data.items[0].id;
                }
            }

            if (!dreamId) {
                Toast.error('未找到梦境，请先创建梦境');
                Router.navigate('home');
                return;
            }

            this.data.dreamId = dreamId;

            const [dreamResult, blocksResult] = await Promise.all([
                DreamService.getDreamDetail(dreamId),
                GameService.block.list(dreamId)
            ]);

            if (dreamResult.code === 0 && dreamResult.data) {
                this.data.dream = dreamResult.data;
                this.data.weather = dreamResult.data.weather || 'sunny';
                this.data.timeOfDay = dreamResult.data.time_of_day || 'day';
                this.data.gravity = dreamResult.data.gravity || 1.0;
            }

            if (blocksResult.code === 0 && blocksResult.data) {
                this.data.blocks = blocksResult.data || [];
            }

            this.renderBlocks();
            this.updateTopBar();
            this.updateWeatherOverlay();

        } catch (error) {
            console.error('初始化游戏失败:', error);
            Toast.error('初始化游戏失败');
        } finally {
            Loading.hide();
        }
    },

    renderBlocks() {
        const container = document.getElementById('blocksContainer');
        if (!container) return;

        container.innerHTML = '';

        const sortedBlocks = [...this.data.blocks].sort((a, b) => {
            return a.y - b.y;
        });

        sortedBlocks.forEach(blockData => {
            const block = Block3D.create(blockData, this.data.blockSize);
            block.addEventListener('click', (e) => {
                if (!this.data.isDragging) {
                    e.stopPropagation();
                    if (this.data.buildMode === 'remove') {
                        this.handleBlockRemove(blockData.id);
                    } else if (this.data.buildMode === 'select') {
                        this.data.selectedBlockId = blockData.id;
                        this.updateSelectedBlock();
                    }
                }
            });
            block.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleBlockRemove(blockData.id);
            });
            container.appendChild(block);
        });

        this.updateSelectedBlock();
    },

    async handleBlockPlace(x, y, z) {
        try {
            const existing = this.findBlockAt(x, y, z);
            if (existing) {
                Toast.info('该位置已有方块');
                return;
            }

            const result = await GameService.block.place(
                this.data.dreamId,
                x, y, z,
                this.data.selectedBlockType
            );

            if (result.code === 0 && result.data) {
                this.data.blocks.push(result.data);
                this.renderBlocks();
                this.saveGameState();
                Toast.success('方块放置成功');
            } else {
                Toast.error(result.msg || '放置失败');
            }
        } catch (error) {
            console.error('放置方块失败:', error);
            Toast.error('放置方块失败');
        }
    },

    async handleBlockRemove(blockId) {
        try {
            const result = await GameService.block.remove(this.data.dreamId, blockId);

            if (result.code === 0) {
                this.data.blocks = this.data.blocks.filter(b => b.id !== blockId);
                if (this.data.selectedBlockId === blockId) {
                    this.data.selectedBlockId = null;
                }
                this.renderBlocks();
                this.saveGameState();
                Toast.success('方块删除成功');
            } else {
                Toast.error(result.msg || '删除失败');
            }
        } catch (error) {
            console.error('删除方块失败:', error);
            Toast.error('删除方块失败');
        }
    },

    handleCameraRotate() {
        const scene = document.getElementById('gameScene');
        if (!scene) return;

        scene.style.transform = `perspective(1000px) rotateX(${this.data.camera.rotation.x}deg) rotateY(${this.data.camera.rotation.y}deg) scale(${this.data.camera.zoom})`;

        this.updateTopBar();
        this.saveGameState();
    },

    handleZoom(delta) {
        this.data.camera.zoom = Math.max(0.5, Math.min(2, this.data.camera.zoom + delta));
        this.handleCameraRotate();
    },

    resetCamera() {
        this.data.camera.rotation = { x: -30, y: 45 };
        this.data.camera.zoom = 1;
        this.handleCameraRotate();
    },

    saveGameState() {
        const state = {
            dreamId: this.data.dreamId,
            camera: this.data.camera,
            selectedBlockType: this.data.selectedBlockType,
            buildMode: this.data.buildMode,
            weather: this.data.weather,
            timeOfDay: this.data.timeOfDay,
            gravity: this.data.gravity,
            rightPanelTab: this.data.rightPanelTab,
            savedAt: Date.now()
        };
        Storage.setGameState(state);
    },

    loadGameState() {
        const state = Storage.getGameState();
        if (!state) return;

        if (state.camera) {
            this.data.camera = { ...this.data.camera, ...state.camera };
        }
        if (state.selectedBlockType) {
            this.data.selectedBlockType = state.selectedBlockType;
        }
        if (state.buildMode) {
            this.data.buildMode = state.buildMode;
        }
        if (state.weather) {
            this.data.weather = state.weather;
        }
        if (state.timeOfDay) {
            this.data.timeOfDay = state.timeOfDay;
        }
        if (state.gravity) {
            this.data.gravity = state.gravity;
        }
        if (state.rightPanelTab) {
            this.data.rightPanelTab = state.rightPanelTab;
        }
        if (state.dreamId) {
            this.data.dreamId = state.dreamId;
        }
    },

    async toggleWeather(weather) {
        this.data.weather = weather;
        this.updateWeatherOverlay();
        this.saveGameState();

        try {
            await DreamService.updateSettings(this.data.dreamId, { weather });
        } catch (e) {
            console.error('更新天气失败:', e);
        }

        const rightPanel = document.getElementById('rightPanel');
        if (rightPanel) {
            rightPanel.querySelector('.panel-content').innerHTML = this.renderRightPanelContent();
        }
    },

    async toggleTimeOfDay(time) {
        this.data.timeOfDay = time;
        this.updateWeatherOverlay();
        this.saveGameState();

        try {
            await DreamService.updateSettings(this.data.dreamId, { time_of_day: time });
        } catch (e) {
            console.error('更新时间失败:', e);
        }

        const rightPanel = document.getElementById('rightPanel');
        if (rightPanel) {
            rightPanel.querySelector('.panel-content').innerHTML = this.renderRightPanelContent();
        }
    },

    async setGravity(gravity) {
        this.data.gravity = parseFloat(gravity);
        this.saveGameState();

        const valueDisplay = document.querySelector('.gravity-value');
        if (valueDisplay) {
            valueDisplay.textContent = this.data.gravity + 'g';
        }

        try {
            await DreamService.updateSettings(this.data.dreamId, { gravity: this.data.gravity });
        } catch (e) {
            console.error('更新重力失败:', e);
        }
    },

    updateWeatherOverlay() {
        const overlay = document.getElementById('weatherOverlay');
        if (!overlay) return;

        overlay.className = 'weather-overlay';
        if (this.data.weather === 'rain') overlay.classList.add('weather-rain');
        if (this.data.weather === 'snow') overlay.classList.add('weather-snow');
        if (this.data.weather === 'fog') overlay.classList.add('weather-fog');
        if (this.data.timeOfDay === 'night') overlay.classList.add('time-night');
    },

    selectBlockType(type) {
        this.data.selectedBlockType = type;
        this.data.buildMode = 'place';

        document.querySelectorAll('.block-tool-item').forEach(el => {
            el.classList.toggle('selected', el.dataset.blockType === type);
        });

        document.querySelectorAll('.hotbar-slot').forEach(el => {
            el.classList.toggle('selected', el.querySelector('.hotbar-icon').textContent === Block3D.getBlockType(type).icon);
        });

        this.saveGameState();
    },

    setBuildMode(mode) {
        this.data.buildMode = mode;
        const rightPanel = document.getElementById('rightPanel');
        if (rightPanel) {
            rightPanel.querySelector('.panel-content').innerHTML = this.renderRightPanelContent();
        }
        this.saveGameState();
    },

    switchRightTab(tab) {
        this.data.rightPanelTab = tab;
        const rightPanel = document.getElementById('rightPanel');
        if (rightPanel) {
            rightPanel.querySelector('.panel-tabs').innerHTML = this.renderRightPanel().match(/<div class="panel-tabs">[\s\S]*?<\/div>/)[0];
            rightPanel.querySelector('.panel-content').innerHTML = this.renderRightPanelContent();
        }
        this.saveGameState();
    },

    updateTopBar() {
        const fpsDisplay = document.getElementById('fpsDisplay');
        if (fpsDisplay) {
            fpsDisplay.textContent = `${this.data.fps} FPS`;
        }

        const statusItems = document.querySelectorAll('.status-item');
        if (statusItems.length >= 2) {
            const cam = this.data.camera.target;
            statusItems[1].querySelector('.status-value').textContent = 
                `(${Math.round(cam.x)}, ${Math.round(cam.y)}, ${Math.round(cam.z)})`;
        }
    },

    updateSelectedBlock() {
        document.querySelectorAll('.block-3d').forEach(block => {
            const blockId = parseInt(block.dataset.blockId);
            block.classList.toggle('selected', blockId === this.data.selectedBlockId);
        });
    },

    startFpsCounter() {
        const updateFps = () => {
            const now = performance.now();
            this.data.frameCount++;

            if (now - this.data.lastFpsUpdate >= 1000) {
                this.data.fps = Math.round(this.data.frameCount * 1000 / (now - this.data.lastFpsUpdate));
                this.data.frameCount = 0;
                this.data.lastFpsUpdate = now;
                this.updateTopBar();
            }

            requestAnimationFrame(updateFps);
        };

        this.data.lastFpsUpdate = performance.now();
        requestAnimationFrame(updateFps);
    },

    toggleRightPanel() {
        const panel = document.getElementById('rightPanel');
        if (panel) {
            panel.classList.toggle('collapsed');
        }
    },

    goBack() {
        this.saveGameState();
        Router.navigate('home');
    },

    placeCreature(type) {
        Toast.info(`放置${type}生物`);
    },

    editCreatureAI() {
        Toast.info('编辑AI行为');
    },

    clearAllCreatures() {
        Toast.info('清除所有生物');
    },

    async clearAllBlocks() {
        if (!confirm('确定要清除所有方块吗？')) return;

        try {
            const result = await GameService.block.clear(this.data.dreamId);
            if (result.code === 0) {
                this.data.blocks = [];
                this.renderBlocks();
                Toast.success('已清除所有方块');
            }
        } catch (e) {
            console.error('清除方块失败:', e);
            Toast.error('清除失败');
        }
    },

    exportBlueprint() {
        const blueprint = {
            dreamId: this.data.dreamId,
            blocks: this.data.blocks,
            exportedAt: new Date().toISOString()
        };
        Utils.downloadFile(JSON.stringify(blueprint, null, 2), 'blueprint.json', 'application/json');
        Toast.success('蓝图已导出');
    },

    importBlueprint() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (ev) => {
                try {
                    const blueprint = JSON.parse(ev.target.result);
                    if (blueprint.blocks && blueprint.blocks.length > 0) {
                        const result = await GameService.block.batchPlace(this.data.dreamId, blueprint.blocks.map(b => ({
                            x: b.x, y: b.y, z: b.z, block_type: b.block_type, color: b.color, properties: b.properties })));
                        if (result.code === 0) {
                            this.data.blocks = [...this.data.blocks, ...blueprint.blocks];
                            this.renderBlocks();
                            Toast.success('蓝图导入成功');
                        }
                    }
                } catch (err) {
                    Toast.error('蓝图格式错误');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    },

    async createLevel() {
        const name = document.getElementById('levelName').value;
        const difficulty = document.getElementById('levelDifficulty').value;

        if (!name) {
            Toast.warning('请输入关卡名称');
            return;
        }

        try {
            const result = await GameService.level.create(
                this.data.dreamId,
                name,
                '',
                'build',
                difficulty,
                0, 0, 0,
                100
            );

            if (result.code === 0) {
                Toast.success('关卡创建成功');
            } else {
                Toast.error(result.msg || '创建失败');
            }
        } catch (e) {
            console.error('创建关卡失败:', e);
            Toast.error('创建关卡失败');
        }
    },

    setTargetPoint() {
        Toast.info('点击地图设置目标点');
    },

    showLevelList() {
        Toast.info('关卡列表');
    }
};

window.GamePage = GamePage;
