class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new GameRenderer(canvas);
        this.particles = new ParticleSystem();
        this.elements = new ElementSystem();
        this.lightBeam = null;
        this.beamResult = null;
        this.prisms = [];
        this.selectedPrism = null;
        this.hoveredPrism = null;
        this.currentLevel = 1;
        this.rotationCount = 0;
        this.parRotations = 5;
        this.lightSource = { x: 50, y: 300, angle: 0 };
        this.target = { x: 750, y: 300, radius: 35 };
        this.isWon = false;
        this.animationId = null;
        this.lastTime = 0;
        this.winScore = 0;

        this._setupEventListeners();
    }

    _setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this._handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this._handleMouseMove(e));
        document.addEventListener('keydown', (e) => this._handleKeyDown(e));
    }

    _handleClick(e) {
        if (this.isWon) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        let clickedPrism = null;
        for (const prism of this.prisms) {
            if (prism.containsPoint(x, y)) {
                clickedPrism = prism;
                break;
            }
        }

        if (this.selectedPrism) {
            this.selectedPrism.selected = false;
        }

        this.selectedPrism = clickedPrism;
        if (clickedPrism) {
            clickedPrism.selected = true;
        }

        this._updateSelectedInfo();
    }

    _handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.hoveredPrism) {
            this.hoveredPrism.hovered = false;
        }

        this.hoveredPrism = null;
        for (const prism of this.prisms) {
            if (prism.containsPoint(x, y)) {
                prism.hovered = true;
                this.hoveredPrism = prism;
                this.canvas.style.cursor = prism.isRotatable && !prism.melted ? 'pointer' : 'default';
                break;
            }
        }

        if (!this.hoveredPrism) {
            this.canvas.style.cursor = 'default';
        }
    }

    _handleKeyDown(e) {
        if (this.isWon) return;

        if (e.key === 'q' || e.key === 'Q') {
            this.rotateSelected(-15);
        } else if (e.key === 'e' || e.key === 'E') {
            this.rotateSelected(15);
        } else if (e.key === 'r' || e.key === 'R') {
            this.resetLevel();
        }
    }

    rotateSelected(angle) {
        if (!this.selectedPrism || !this.selectedPrism.isRotatable) return;
        if (this.selectedPrism.melted || this.selectedPrism.frozen) return;

        const rotated = this.selectedPrism.rotate(angle);
        if (rotated) {
            this.rotationCount++;
            this._updateStats();
            this._traceLight();
            this._updateSelectedInfo();

            for (const prism of this.prisms) {
                if (prism.id !== this.selectedPrism.id) {
                    prism.resetHits();
                }
            }
        }
    }

    loadLevel(levelData) {
        this.initialLevelData = JSON.parse(JSON.stringify(levelData));
        this.prisms = [];
        this.selectedPrism = null;
        this.hoveredPrism = null;
        this.rotationCount = 0;
        this.isWon = false;
        this.winScore = 0;
        this.elements.reset();
        this.particles.clear();

        this.currentLevel = levelData.level_number || 1;
        this.parRotations = levelData.par_rotations || 5;
        this.lightSource = {
            x: levelData.light_source_x,
            y: levelData.light_source_y,
            angle: levelData.light_source_angle
        };
        this.target = {
            x: levelData.target_x,
            y: levelData.target_y,
            radius: levelData.target_radius || 35
        };

        if (levelData.prisms) {
            for (const prismData of levelData.prisms) {
                this.prisms.push(new Prism(prismData));
            }
        }

        this._traceLight();
        this._updateStats();
    }

    resetLevel() {
        if (this.initialLevelData) {
            this.loadLevel(this.initialLevelData);
        }
    }

    _traceLight() {
        this.lightBeam = new LightBeam(
            this.lightSource.x,
            this.lightSource.y,
            this.lightSource.angle,
            1.0
        );

        this.beamResult = this.lightBeam.trace(
            this.prisms,
            this.target,
            this.canvas.width,
            this.canvas.height
        );

        if (this.beamResult.path) {
            const colors = this.beamResult.colors || { red: 1, green: 1, blue: 1 };
            const avgColor = `rgb(${Math.floor(colors.red * 255)}, ${Math.floor(colors.green * 255)}, ${Math.floor(colors.blue * 255)})`;
            this.particles.emitAlongPath(this.beamResult.path, {
                density: 3,
                color: avgColor,
                size: 2,
                life: 0.3
            });
        }

        if (this.beamResult.hitTarget && !this.isWon) {
            this._handleWin();
        }

        for (const prism of this.prisms) {
            if (this.beamResult.path) {
                for (const point of this.beamResult.path) {
                    if (point.type === 'prism' && point.prismId === prism.id) {
                        prism.registerHit();
                    }
                }
            }
        }

        if (this.beamResult.elementEffects && this.beamResult.elementEffects.includes('freeze')) {
            for (const prism of this.prisms) {
                if (this.beamResult.path) {
                    for (const point of this.beamResult.path) {
                        if (point.type === 'prism' && point.prismId === prism.id) {
                            this.elements.applyFreezeEffect(prism);
                        }
                    }
                }
            }
        }
    }

    _handleWin() {
        this.isWon = true;
        
        const baseScore = 1000;
        const rotationBonus = Math.max(0, (this.parRotations - this.rotationCount)) * 100;
        const intensityBonus = Math.floor(this.beamResult.intensity * 500);
        this.winScore = baseScore + rotationBonus + intensityBonus;

        const targetPoint = this.beamResult.path.find(p => p.type === 'target');
        if (targetPoint) {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    this.particles.emit(targetPoint.x, targetPoint.y, {
                        count: 30,
                        color: '#ffd700',
                        speed: 100,
                        size: 4,
                        life: 1
                    });
                }, i * 150);
            }
        }

        const event = new CustomEvent('gameWin', {
            detail: {
                level: this.currentLevel,
                rotations: this.rotationCount,
                intensity: this.beamResult.intensity,
                score: this.winScore
            }
        });
        document.dispatchEvent(event);
    }

    _updateStats() {
        document.getElementById('currentLevel').textContent = this.currentLevel;
        document.getElementById('rotationCount').textContent = this.rotationCount;
        document.getElementById('parRotations').textContent = this.parRotations;
        
        const intensity = this.beamResult ? this.beamResult.intensity : 1;
        document.getElementById('lightIntensity').textContent = Math.round(intensity * 100) + '%';
    }

    _updateSelectedInfo() {
        const infoEl = document.getElementById('selectedPrismInfo');
        
        if (!this.selectedPrism) {
            infoEl.innerHTML = '<p class="no-selection">未选中棱镜</p>';
            return;
        }

        const p = this.selectedPrism;
        infoEl.innerHTML = `
            <div class="prism-details">
                <p>面数: <span>${p.sides}</span></p>
                <p>大小: <span>${Math.round(p.size)}</span></p>
                <p>旋转角度: <span>${Math.round(p.rotation)}°</span></p>
                <p>可旋转: <span>${p.isRotatable ? '是' : '否'}</span></p>
                ${p.colorFilter ? `<p>滤镜: <span>${p.colorFilter}</span></p>` : ''}
                ${p.frozen ? `<p style="color: #3366ff;">❄️ 冷冻中</p>` : ''}
                ${p.melted ? `<p style="color: #ff6600;">🔥 已熔毁</p>` : ''}
                ${p.hitCount > 0 ? `<p>命中次数: <span>${p.hitCount}/5</span></p>` : ''}
            </div>
        `;
    }

    update(deltaTime) {
        this.particles.update(deltaTime);
        this.elements.update(deltaTime, this.particles);
    }

    render() {
        this.renderer.drawBackground();

        this.renderer.drawLightSource(
            this.lightSource.x,
            this.lightSource.y,
            this.lightSource.angle
        );

        this.renderer.drawTarget(
            this.target.x,
            this.target.y,
            this.target.radius,
            this.beamResult && this.beamResult.hitTarget
        );

        if (this.beamResult) {
            this.renderer.drawLightBeam(this.beamResult);
            
            if (this.beamResult.splitBeams) {
                this.renderer.drawSplitBeams(this.beamResult.splitBeams);
            }
        }

        for (const prism of this.prisms) {
            this.renderer.drawPrism(prism);
        }

        this.renderer.drawParticles(this.particles);

        if (this.isWon && this.beamResult && this.beamResult.path) {
            const targetPoint = this.beamResult.path.find(p => p.type === 'target');
            if (targetPoint) {
                this.renderer.drawWinEffect(targetPoint.x, targetPoint.y);
            }
        }
    }

    start() {
        const loop = (timestamp) => {
            const deltaTime = (timestamp - this.lastTime) / 1000;
            this.lastTime = timestamp;

            if (deltaTime < 0.1) {
                this.update(deltaTime);
            }
            this.render();

            this.animationId = requestAnimationFrame(loop);
        };

        this.lastTime = performance.now();
        this.animationId = requestAnimationFrame(loop);
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    saveState() {
        try {
            const state = {
                currentLevel: this.currentLevel,
                rotationCount: this.rotationCount,
                parRotations: this.parRotations,
                lightSource: { ...this.lightSource },
                target: { ...this.target },
                isWon: this.isWon,
                winScore: this.winScore,
                prisms: this.prisms.map(p => ({
                    id: p.id,
                    x: p.x,
                    y: p.y,
                    sides: p.sides,
                    size: p.size,
                    rotation: p.rotation,
                    isRotatable: p.isRotatable,
                    colorFilter: p.colorFilter,
                    hitCount: p.hitCount,
                    melted: p.melted,
                    meltTurns: p.meltTurns,
                    frozen: p.frozen,
                    freezeTurns: p.freezeTurns
                })),
                selectedPrismId: this.selectedPrism ? this.selectedPrism.id : null
            };
            localStorage.setItem('prismGameState', JSON.stringify(state));
            return true;
        } catch (e) {
            console.warn('保存游戏状态失败:', e);
            return false;
        }
    }

    loadState() {
        try {
            const raw = localStorage.getItem('prismGameState');
            if (!raw) return false;

            const state = JSON.parse(raw);
            this.currentLevel = state.currentLevel;
            this.rotationCount = state.rotationCount;
            this.parRotations = state.parRotations;
            this.lightSource = { ...state.lightSource };
            this.target = { ...state.target };
            this.isWon = state.isWon;
            this.winScore = state.winScore;

            if (state.prisms) {
                this.prisms = [];
                for (const prismData of state.prisms) {
                    const prism = new Prism({
                        x: prismData.x,
                        y: prismData.y,
                        sides: prismData.sides,
                        size: prismData.size,
                        is_rotatable: prismData.isRotatable,
                        rotation: prismData.rotation,
                        color_filter: prismData.colorFilter
                    });
                    prism.id = prismData.id;
                    prism.hitCount = prismData.hitCount || 0;
                    prism.melted = prismData.melted || false;
                    prism.meltTurns = prismData.meltTurns || 0;
                    prism.frozen = prismData.frozen || false;
                    prism.freezeTurns = prismData.freezeTurns || 0;
                    this.prisms.push(prism);
                }
            }

            if (state.selectedPrismId) {
                for (const prism of this.prisms) {
                    if (prism.id === state.selectedPrismId) {
                        this.selectedPrism = prism;
                        prism.selected = true;
                        break;
                    }
                }
            }

            this._traceLight();
            this._updateStats();
            this._updateSelectedInfo();
            return true;
        } catch (e) {
            console.warn('恢复游戏状态失败:', e);
            return false;
        }
    }

    clearSavedState() {
        try {
            localStorage.removeItem('prismGameState');
        } catch (e) {}
    }
}
