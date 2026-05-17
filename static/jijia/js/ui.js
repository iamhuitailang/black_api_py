class UI {
    constructor(game) {
        this.game = game;
        this.elements = {};
        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        this.elements.startScreen = document.getElementById('start-screen');
        this.elements.gameScreen = document.getElementById('game-screen');
        this.elements.pauseMenu = document.getElementById('pause-menu');
        this.elements.gameOver = document.getElementById('game-over');
        
        this.elements.playerIcon = document.getElementById('player-icon');
        this.elements.playerHealth = document.getElementById('player-health');
        this.elements.playerHealthText = document.getElementById('player-health-text');
        this.elements.timer = document.getElementById('timer');
        this.elements.ammoCount = document.getElementById('ammo-count');
        this.elements.ultimateCharge = document.getElementById('ultimate-charge');
        this.elements.defenseModules = document.getElementById('defense-modules');
        
        this.elements.gameResult = document.getElementById('game-result');
        this.elements.gameMessage = document.getElementById('game-message');
        
        this.elements.startBtn = document.getElementById('start-btn');
        this.elements.pauseBtn = document.getElementById('pause-btn');
        this.elements.resumeBtn = document.getElementById('resume-btn');
        this.elements.restartBtn = document.getElementById('restart-btn');
        this.elements.quitBtn = document.getElementById('quit-btn');
        this.elements.playAgainBtn = document.getElementById('play-again-btn');
        this.elements.backToMenuBtn = document.getElementById('back-to-menu-btn');
        
        this.elements.mechaOptions = document.querySelectorAll('.mecha-option');
        this.elements.skillItems = document.querySelectorAll('.skill-item');
        
        this.elements.canvas = document.getElementById('game-canvas');
    }

    initEventListeners() {
        this.elements.mechaOptions.forEach(option => {
            option.addEventListener('click', () => {
                this.elements.mechaOptions.forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                this.game.selectedMecha = option.dataset.mecha;
            });
        });

        this.elements.skillItems.forEach(item => {
            item.addEventListener('click', () => {
                if (!this.game.player) return;
                const skill = item.dataset.skill;
                if (skill === 'ultimate' && !this.game.player.canUseUltimate()) {
                    return;
                }
                this.elements.skillItems.forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                this.game.player.selectedSkill = skill;
            });
        });

        this.elements.startBtn.addEventListener('click', () => this.game.startGame());
        this.elements.pauseBtn.addEventListener('click', () => this.game.pauseGame());
        this.elements.resumeBtn.addEventListener('click', () => this.game.resumeGame());
        this.elements.restartBtn.addEventListener('click', () => this.game.restartGame());
        this.elements.quitBtn.addEventListener('click', () => this.game.quitToMenu());
        this.elements.playAgainBtn.addEventListener('click', () => this.game.restartGame());
        this.elements.backToMenuBtn.addEventListener('click', () => this.game.quitToMenu());

        this.initCanvasEvents();
    }

    bindCanvasEvents() {
        const canvas = this.elements.canvas;
        if (!canvas) {
            console.error('Canvas element not found!');
            return;
        }
        
        console.log('Binding canvas events...');
        
        let isDragging = false;
        let startX, startY;

        document.addEventListener('mousedown', (e) => {
            if (e.target !== canvas) return;
            if (this.game.state !== 'playing') return;
            console.log('mousedown on canvas');
            
            const rect = canvas.getBoundingClientRect();
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;
            this.game.aimX = startX;
            this.game.aimY = startY;
            this.game.isAiming = true;
            isDragging = true;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging || this.game.state !== 'playing') return;
            
            const rect = canvas.getBoundingClientRect();
            this.game.aimX = e.clientX - rect.left;
            this.game.aimY = e.clientY - rect.top;
        });

        document.addEventListener('mouseup', (e) => {
            if (!isDragging || this.game.state !== 'playing') return;
            console.log('mouseup, isDragging:', isDragging);
            
            const rect = canvas.getBoundingClientRect();
            const endX = e.clientX - rect.left;
            const endY = e.clientY - rect.top;
            
            this.game.shoot(endX, endY);
            
            isDragging = false;
            this.game.isAiming = false;
        });

        document.addEventListener('click', (e) => {
            if (e.target !== canvas) return;
            if (this.game.state !== 'playing') return;
            console.log('click on canvas');
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.game.shoot(x, y);
        });

        document.addEventListener('touchstart', (e) => {
            if (e.target !== canvas) return;
            e.preventDefault();
            if (this.game.state !== 'playing') return;
            
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            startX = touch.clientX - rect.left;
            startY = touch.clientY - rect.top;
            this.game.aimX = startX;
            this.game.aimY = startY;
            this.game.isAiming = true;
            isDragging = true;
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (!isDragging || this.game.state !== 'playing') return;
            e.preventDefault();
            
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            this.game.aimX = touch.clientX - rect.left;
            this.game.aimY = touch.clientY - rect.top;
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            if (!isDragging || this.game.state !== 'playing') return;
            
            const rect = canvas.getBoundingClientRect();
            const touch = e.changedTouches[0];
            const endX = touch.clientX - rect.left;
            const endY = touch.clientY - rect.top;
            
            this.game.shoot(endX, endY);
            
            isDragging = false;
            this.game.isAiming = false;
        });
        
        console.log('Canvas events bound successfully!');
    }
    
    initCanvasEvents() {
        console.log('initCanvasEvents called - will bind when game starts');
    }

    update() {
        if (!this.game.player) return;

        const player = this.game.player;
        const healthPercent = (player.health / player.maxHealth) * 100;
        this.elements.playerHealth.style.width = `${healthPercent}%`;
        this.elements.playerHealthText.textContent = `${Math.ceil(player.health)}/${player.maxHealth}`;
        
        this.elements.playerIcon.textContent = CONFIG.MECHAS[player.type].icon;

        this.elements.ammoCount.textContent = player.ammo;

        const chargePercent = (player.ultimateCharge / player.maxUltimateCharge) * 100;
        this.elements.ultimateCharge.style.width = `${chargePercent}%`;

        this.updateDefenseModules();
        this.updateTimer();
        this.updateSkillSelection();
    }

    updateDefenseModules() {
        const container = this.elements.defenseModules;
        container.innerHTML = '';
        
        this.game.player.defenseModules.forEach((module, index) => {
            const div = document.createElement('div');
            div.className = `module ${module.destroyed ? 'destroyed' : ''}`;
            container.appendChild(div);
        });
    }

    updateTimer() {
        const remaining = Math.max(0, this.game.timeRemaining);
        const minutes = Math.floor(remaining / 60);
        const seconds = Math.floor(remaining % 60);
        this.elements.timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (remaining <= 10) {
            this.elements.timer.style.color = '#ff4444';
        } else {
            this.elements.timer.style.color = '#ffff00';
        }
    }

    updateSkillSelection() {
        this.elements.skillItems.forEach(item => {
            const skill = item.dataset.skill;
            if (skill === this.game.player.selectedSkill) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
            
            if (skill === 'ultimate') {
                if (this.game.player.canUseUltimate()) {
                    item.style.opacity = '1';
                } else {
                    item.style.opacity = '0.5';
                }
            }
        });
    }

    showScreen(screenName) {
        this.elements.startScreen.classList.add('hidden');
        this.elements.gameScreen.classList.add('hidden');
        this.elements.pauseMenu.classList.add('hidden');
        this.elements.gameOver.classList.add('hidden');

        switch (screenName) {
            case 'start':
                this.elements.startScreen.classList.remove('hidden');
                break;
            case 'game':
                this.elements.gameScreen.classList.remove('hidden');
                break;
            case 'pause':
                this.elements.gameScreen.classList.remove('hidden');
                this.elements.pauseMenu.classList.remove('hidden');
                break;
            case 'gameOver':
                this.elements.gameScreen.classList.remove('hidden');
                this.elements.gameOver.classList.remove('hidden');
                break;
        }
    }

    showGameOver(isWin) {
        if (isWin) {
            this.elements.gameResult.textContent = '🎉 胜利！';
            this.elements.gameResult.style.color = '#00ff00';
            this.elements.gameMessage.textContent = '你成功击败了敌方机甲！';
        } else {
            this.elements.gameResult.textContent = '💀 失败';
            this.elements.gameResult.style.color = '#ff4444';
            this.elements.gameMessage.textContent = '你的机甲被摧毁了...';
        }
        this.showScreen('gameOver');
    }

    drawAimLine(ctx) {
        if (!this.game.player) return;
        
        const player = this.game.player;
        const startX = player.x;
        const startY = player.y - player.height / 2;
        
        if (this.game.isAiming) {
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(this.game.aimX, this.game.aimY);
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.beginPath();
            ctx.arc(this.game.aimX, this.game.aimY, 8, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        ctx.beginPath();
        ctx.arc(startX, startY, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.fill();
    }

    drawEnemyHealthBar(ctx, enemy) {
        const barWidth = 80;
        const barHeight = 8;
        const barX = enemy.x - barWidth / 2;
        const barY = enemy.y - enemy.height / 2 - 20;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const healthPercent = enemy.health / enemy.maxHealth;
        const healthColor = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    drawExplosion(ctx, x, y, radius) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, 'rgba(255, 200, 0, 1)');
        gradient.addColorStop(0.3, 'rgba(255, 100, 0, 0.8)');
        gradient.addColorStop(0.6, 'rgba(255, 50, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }
}