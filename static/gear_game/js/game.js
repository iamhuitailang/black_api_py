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
        this.particleContainer = null;
        this.gameBoardElement = null;
        this.setupCallbacks();
    }

    setupCallbacks() {
        this.board.onScoreCallback = (points) => this.addScore(points);
        this.board.onComboCallback = (combo) => this.updateCombo(combo);
        this.board.onShakeCallback = (combo) => this.shakeBoard(combo);
        this.board.onParticlesCallback = (particle) => this.spawnParticle(particle);
    }

    init(containerId) {
        this.gameBoardElement = document.getElementById(containerId);
        this.particleContainer = document.getElementById('particles-container');
        this.applyTheme();
        this.newGame();
        this.animateParticles();
    }

    applyTheme() {
        const themeIndex = ((this.level - 1) % 5) + 1;
        document.body.dataset.theme = themeIndex;
    }

    newGame() {
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
    }

    addScore(points) {
        this.score += points;
        this.updateUI();
        this.checkWinCondition();
    }

    updateCombo(combo) {
        this.combo = combo;
        if (combo > this.maxCombo) {
            this.maxCombo = combo;
        }
        this.updateUI();
    }

    resetCombo() {
        this.combo = 0;
        this.updateUI();
    }

    async makeMove(gear1, gear2) {
        if (this.isGameOver || this.steps <= 0) return false;

        const success = await this.board.trySwap(gear1, gear2);
        
        if (success) {
            this.steps--;
            this.stepsUsed++;
            this.resetCombo();
            this.updateUI();
            this.checkGameOver();
        }

        return success;
    }

    shakeBoard(combo) {
        if (!this.gameBoardElement) return;

        const intensity = Math.min(combo, 5);
        this.gameBoardElement.classList.remove('shake');
        
        void this.gameBoardElement.offsetWidth;
        
        this.gameBoardElement.style.animationDuration = `${0.2 + intensity * 0.1}s`;
        this.gameBoardElement.classList.add('shake');

        setTimeout(() => {
            this.gameBoardElement.classList.remove('shake');
        }, 300 + intensity * 100);
    }

    spawnParticle(particleData) {
        if (!this.particleContainer) return;

        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const { x, y, color, angle, speed, size, combo } = particleData;
        
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.backgroundColor = color;
        particle.style.boxShadow = `0 0 ${10 + combo * 5}px ${color}`;

        this.particleContainer.appendChild(particle);

        const velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed - 2
        };

        this.particles.push({
            element: particle,
            x,
            y,
            velocity,
            life: 1,
            decay: 0.02 + Math.random() * 0.02,
            gravity: 0.2
        });
    }

    animateParticles() {
        const animate = () => {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                
                p.velocity.y += p.gravity;
                p.x += p.velocity.x;
                p.y += p.velocity.y;
                p.life -= p.decay;

                p.element.style.left = `${p.x}px`;
                p.element.style.top = `${p.y}px`;
                p.element.style.opacity = p.life;
                p.element.style.transform = `scale(${p.life})`;

                if (p.life <= 0) {
                    p.element.remove();
                    this.particles.splice(i, 1);
                }
            }

            requestAnimationFrame(animate);
        };

        animate();
    }

    checkWinCondition() {
        if (this.score >= this.target && !this.isGameOver) {
            this.isGameOver = true;
            setTimeout(() => this.showWinModal(), 500);
        }
    }

    checkGameOver() {
        if (this.steps <= 0 && this.score < this.target && !this.isGameOver) {
            this.isGameOver = true;
            setTimeout(() => this.showLoseModal(), 500);
        }
    }

    showWinModal() {
        this.saveGame(true);
        
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
            await GameAPI.saveGame(
                this.level,
                this.score,
                this.maxCombo,
                this.stepsUsed,
                isWin
            );
            this.loadHighScores();
        } catch (error) {
            console.error('保存游戏失败:', error);
        }
    }

    async loadHighScores() {
        try {
            const scoreData = await GameAPI.getHighestScore(this.level);
            const comboData = await GameAPI.getHighestCombo(this.level);

            if (scoreData && scoreData.data) {
                document.getElementById('high-score').textContent = scoreData.data.score;
            }
            if (comboData && comboData.data) {
                document.getElementById('high-combo').textContent = comboData.data.max_combo;
            }
        } catch (error) {
            console.error('加载最高分失败:', error);
        }
    }

    showHint() {
        const moves = this.board.findPossibleMoves();
        if (moves.length > 0) {
            const [[r1, c1], [r2, c2]] = moves[0];
            
            const gear1 = this.board.getGearAt(r1, c1);
            const gear2 = this.board.getGearAt(r2, c2);
            
            if (gear1 && gear1.element) {
                gear1.element.classList.add('hint');
            }
            if (gear2 && gear2.element) {
                gear2.element.classList.add('hint');
            }

            setTimeout(() => {
                if (gear1 && gear1.element) {
                    gear1.element.classList.remove('hint');
                }
                if (gear2 && gear2.element) {
                    gear2.element.classList.remove('hint');
                }
            }, 2000);
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
        setTimeout(() => {
            scoreEl.style.transform = 'scale(1)';
        }, 150);
    }

    getBoard() {
        return this.board;
    }
}
