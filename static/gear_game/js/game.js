const STORAGE_KEY = 'gear_game_save';

const LevelConfig = {
    getConfig(level) {
        return {
            target: 500 + level * 300,
            steps: Math.max(15, 25 - Math.floor(level / 3)),
            specialGearChance: Math.min(0.15 + level * 0.02, 0.35)
        };
    },
    getTheme(level) {
        const themes = [
            { name: '工业暗黑', bg: 'rgba(0, 0, 0, 0.4)' },
            { name: '暖红工厂', bg: 'rgba(52, 34, 36, 0.5)' },
            { name: '翠绿车间', bg: 'rgba(36, 52, 34, 0.5)' },
            { name: '深蓝机房', bg: 'rgba(34, 36, 52, 0.5)' },
            { name: '金色齿轮房', bg: 'rgba(52, 52, 34, 0.5)' }
        ];
        return themes[(level - 1) % themes.length];
    }
};

class Game {
    constructor() {
        this.level = 1;
        this.score = 0;
        this.target = 1000;
        this.steps = 20;
        this.combo = 0;
        this.maxCombo = 0;
        this.stepsUsed = 0;
        this.isGameOver = false;
        this.board = new Board(8, 8, this.level);
        this.particles = [];
        this.particleCanvas = null;
        this.particleCtx = null;
        this.gameBoardElement = null;
        this.highlightedCells = [];
        this.saveTimer = null;
        this.setupCallbacks();
    }

    setupCallbacks() {
        this.board.onScoreCallback = (points) => this.addScore(points);
        this.board.onComboCallback = (combo) => this.updateCombo(combo);
        this.board.onShakeCallback = (combo) => this.shakeBoard(combo);
        this.board.onParticlesCallback = (p) => this.spawnParticle(p);
        this.board.onMoveCallback = () => this.handleMoveMade();
    }

    handleMoveMade() {
        if (this.steps > 0) {
            this.steps--;
            this.stepsUsed++;
            this.resetCombo();
            this.updateUI();
            this.scheduleSave();
            this.checkGameOver();
        }
    }

    init(containerId) {
        this.gameBoardElement = document.getElementById(containerId);
        this.initParticleCanvas();
        this.animateParticles();

        if (!this.loadGame()) {
            this.applyTheme();
            this.newGame();
        }
    }

    initParticleCanvas() {
        const container = document.getElementById('particles-container');
        if (!container) return;

        this.particleCanvas = document.createElement('canvas');
        this.particleCanvas.style.position = 'absolute';
        this.particleCanvas.style.top = '0';
        this.particleCanvas.style.left = '0';
        this.particleCanvas.style.width = '100%';
        this.particleCanvas.style.height = '100%';
        this.particleCanvas.style.pointerEvents = 'none';
        this.particleCanvas.style.zIndex = '50';

        const rect = container.getBoundingClientRect();
        this.particleCanvas.width = rect.width || 565;
        this.particleCanvas.height = rect.height || 565;
        this.particleCtx = this.particleCanvas.getContext('2d');

        container.appendChild(this.particleCanvas);
    }

    applyTheme() {
        const themeIndex = ((this.level - 1) % 5) + 1;
        document.body.dataset.theme = themeIndex;
    }

    async newGame() {
        const config = LevelConfig.getConfig(this.level);
        this.target = config.target;
        this.steps = config.steps;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.stepsUsed = 0;
        this.isGameOver = false;

        this.board.setLevel(this.level);
        this.board.fillBoard();
        this.board.render(this.gameBoardElement);

        this.updateUI();
        this.hideModal();
        this.saveGameState();

        await this.board.processInitialMatches();
        this.saveGameState();
        this.loadHighScores();
    }

    addScore(points) {
        this.score += points;
        this.updateUI();
        this.scheduleSave();
        this.checkWinCondition();
    }

    updateCombo(combo) {
        this.combo = combo;
        if (combo > this.maxCombo) this.maxCombo = combo;
        this.updateUI();
    }

    resetCombo() {
        this.combo = 0;
        this.updateUI();
    }

    shakeBoard(combo) {
        if (!this.gameBoardElement) return;
        const intensity = Math.min(combo, 5);
        this.gameBoardElement.classList.remove('shake');
        void this.gameBoardElement.offsetWidth;
        this.gameBoardElement.style.animationDuration = `${0.2 + intensity * 0.1}s`;
        this.gameBoardElement.classList.add('shake');
        setTimeout(() => this.gameBoardElement.classList.remove('shake'), 300 + intensity * 100);
    }

    spawnParticle(particleData) {
        const { x, y, color, angle, speed, size } = particleData;
        this.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            life: 1,
            decay: 0.03 + Math.random() * 0.02,
            size,
            color
        });

        if (this.particles.length > 150) {
            this.particles.splice(0, this.particles.length - 150);
        }
    }

    animateParticles() {
        const loop = () => {
            if (this.particleCtx && this.particleCanvas) {
                this.particleCtx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);

                for (let i = this.particles.length - 1; i >= 0; i--) {
                    const p = this.particles[i];
                    p.vy += 0.15;
                    p.x += p.vx;
                    p.y += p.vy;
                    p.life -= p.decay;

                    if (p.life <= 0) {
                        this.particles.splice(i, 1);
                        continue;
                    }

                    this.particleCtx.globalAlpha = p.life;
                    this.particleCtx.fillStyle = p.color;
                    this.particleCtx.beginPath();
                    this.particleCtx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                    this.particleCtx.fill();
                }
                this.particleCtx.globalAlpha = 1;
            }
            requestAnimationFrame(loop);
        };
        loop();
    }

    checkWinCondition() {
        if (this.score >= this.target && !this.isGameOver) {
            this.isGameOver = true;
            this.saveGameState();
            setTimeout(() => this.showWinModal(), 500);
        }
    }

    checkGameOver() {
        if (this.steps <= 0 && this.score < this.target && !this.isGameOver) {
            this.isGameOver = true;
            this.saveGameState();
            setTimeout(() => this.showLoseModal(), 500);
        }
    }

    showWinModal() {
        this.saveGame(true);
        this.clearSavedState();

        const modal = document.getElementById('modal-overlay');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        const finalScore = document.getElementById('final-score');
        const finalCombo = document.getElementById('final-combo');
        const nextBtn = document.getElementById('next-level-btn');

        title.textContent = '🎉 恭喜过关！';
        message.textContent = `你已达到目标分数！准备好挑战下一关了吗？`;
        finalScore.textContent = this.score;
        finalCombo.textContent = this.maxCombo;
        nextBtn.style.display = 'inline-block';
        modal.classList.add('active');
    }

    showLoseModal() {
        this.saveGame(false);
        this.clearSavedState();

        const modal = document.getElementById('modal-overlay');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        const finalScore = document.getElementById('final-score');
        const finalCombo = document.getElementById('final-combo');
        const nextBtn = document.getElementById('next-level-btn');

        title.textContent = '😔 挑战失败';
        message.textContent = `步数用尽了！再试一次吧，你可以的！`;
        finalScore.textContent = this.score;
        finalCombo.textContent = this.maxCombo;
        nextBtn.style.display = 'none';
        modal.classList.add('active');
    }

    hideModal() {
        const modal = document.getElementById('modal-overlay');
        modal.classList.remove('active');
    }

    nextLevel() {
        this.level++;
        this.applyTheme();
        this.newGame();
    }

    retryLevel() {
        this.newGame();
    }

    async saveGame(isWin) {
        try {
            await GameAPI.saveGame(this.level, this.score, this.maxCombo, this.stepsUsed, isWin);
            this.loadHighScores();
        } catch (error) {
            console.error('保存游戏失败:', error);
        }
    }

    async loadHighScores() {
        try {
            const scoreData = await GameAPI.getHighestScore(this.level);
            const comboData = await GameAPI.getHighestCombo(this.level);
            if (scoreData && scoreData.data) document.getElementById('high-score').textContent = scoreData.data.score;
            if (comboData && comboData.data) document.getElementById('high-combo').textContent = comboData.data.max_combo;
        } catch (error) {
            console.error('加载最高分失败:', error);
        }
    }

    clearHintHighlight() {
        if (this.gameBoardElement) {
            const cells = this.gameBoardElement.querySelectorAll('.gear-cell.hint');
            cells.forEach(cell => cell.classList.remove('hint'));
        }
        this.highlightedCells = [];
    }

    showHint() {
        this.clearHintHighlight();
        const moves = this.board.findPossibleMoves();

        if (moves.length > 0 && this.gameBoardElement) {
            const [[r1, c1], [r2, c2]] = moves[0];
            const allCells = this.gameBoardElement.querySelectorAll('.gear-cell');
            allCells.forEach(cell => {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                if ((row === r1 && col === c1) || (row === r2 && col === c2)) {
                    cell.classList.add('hint');
                    this.highlightedCells.push(cell);
                }
            });
            setTimeout(() => this.clearHintHighlight(), 2500);
        }
    }

    updateUI() {
        document.getElementById('level').textContent = this.level;
        document.getElementById('score').textContent = this.score;
        document.getElementById('target').textContent = this.target;
        document.getElementById('steps').textContent = this.steps;
        document.getElementById('combo').textContent = this.combo;
        document.getElementById('max-combo').textContent = this.maxCombo;

        const scoreEl = document.getElementById('score');
        scoreEl.style.transform = 'scale(1.2)';
        setTimeout(() => { scoreEl.style.transform = 'scale(1)'; }, 150);
    }

    getBoard() { return this.board; }

    scheduleSave() {
        if (this.saveTimer) clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => this.saveGameState(), 300);
    }

    saveGameState() {
        try {
            const state = {
                level: this.level,
                score: this.score,
                target: this.target,
                steps: this.steps,
                maxCombo: this.maxCombo,
                stepsUsed: this.stepsUsed,
                isGameOver: this.isGameOver,
                grid: this.board.serialize()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.error('保存游戏状态失败:', error);
        }
    }

    async loadGame() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return false;

            const state = JSON.parse(saved);
            this.level = state.level;
            this.score = state.score;
            this.target = state.target;
            this.steps = state.steps;
            this.combo = 0;
            this.maxCombo = state.maxCombo;
            this.stepsUsed = state.stepsUsed;
            this.isGameOver = state.isGameOver;

            this.applyTheme();
            this.board.setLevel(this.level);
            this.board.deserialize(state.grid);
            this.board.render(this.gameBoardElement);

            this.updateUI();
            this.hideModal();

            await this.board.processInitialMatches();
            this.saveGameState();
            this.loadHighScores();
            return true;
        } catch (error) {
            console.error('加载游戏状态失败:', error);
            return false;
        }
    }

    clearSavedState() {
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    }
}
