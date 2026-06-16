const GameState = {
    IDLE: 'idle',
    PLAYING: 'playing',
    THROWING: 'throwing',
    WIN: 'win',
    LOSE: 'lose'
};

class Particle {
    constructor(x, y, color, angle, speed, size) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.angle = angle;
        this.speed = speed;
        this.size = size;
        this.life = 1;
        this.decay = 0.02 + Math.random() * 0.02;
        this.gravity = 0.1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.life -= this.decay;
        this.size *= 0.97;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 1.5);
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

class Knife {
    constructor(x, y, angle, skin) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.skin = skin || {
            skin_key: 'default',
            color_primary: '#8B4513',
            color_secondary: '#D2691E',
            effect_type: null
        };
        this.isFlying = false;
        this.flySpeed = 18;
        this.isStuck = false;
        this.stuckAngle = 0;
        this.stuckDepth = 0;
        this.length = 70;
        this.width = 14;
    }

    fly() {
        this.isFlying = true;
    }

    update(targetCenterY) {
        if (this.isFlying && !this.isStuck) {
            this.y -= this.flySpeed;
            if (this.y <= targetCenterY) {
                return true;
            }
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const primary = this.skin.color_primary;
        const secondary = this.skin.color_secondary || '#D2691E';
        const effectType = this.skin.effect_type;

        if (effectType === 'fire' && this.isFlying) {
            const gradient = ctx.createLinearGradient(0, 0, 0, this.length);
            gradient.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 200, 0, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.ellipse(0, this.length / 2 + 15, 8, 25, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        if (effectType === 'ice' && this.isFlying) {
            const gradient = ctx.createLinearGradient(0, 0, 0, this.length);
            gradient.addColorStop(0, 'rgba(0, 200, 255, 0.6)');
            gradient.addColorStop(1, 'rgba(200, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.ellipse(0, this.length / 2 + 10, 6, 20, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        if (effectType === 'rainbow') {
            const hue = (Date.now() / 5) % 360;
            ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
            ctx.shadowBlur = 15;
        } else if (effectType === 'fire') {
            ctx.shadowColor = '#FF4500';
            ctx.shadowBlur = this.isFlying ? 12 : 6;
        } else if (effectType === 'ice') {
            ctx.shadowColor = '#00CED1';
            ctx.shadowBlur = this.isFlying ? 12 : 6;
        }

        ctx.fillStyle = '#4A4A4A';
        ctx.fillRect(-this.width / 2, 0, this.width, this.length * 0.55);

        const bladeGradient = ctx.createLinearGradient(-this.width / 2, 0, this.width / 2, 0);
        bladeGradient.addColorStop(0, '#666');
        bladeGradient.addColorStop(0.3, '#C0C0C0');
        bladeGradient.addColorStop(0.5, '#F5F5F5');
        bladeGradient.addColorStop(0.7, '#C0C0C0');
        bladeGradient.addColorStop(1, '#666');
        ctx.fillStyle = bladeGradient;
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, 0);
        ctx.lineTo(-this.width / 3, -this.length * 0.35);
        ctx.lineTo(0, -this.length * 0.45);
        ctx.lineTo(this.width / 3, -this.length * 0.35);
        ctx.lineTo(this.width / 2, 0);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = effectType === 'rainbow' 
            ? `hsl(${(Date.now() / 5) % 360}, 70%, 50%)` 
            : primary;
        ctx.fillRect(-this.width / 2 - 2, this.length * 0.5, this.width + 4, this.length * 0.1);

        const handleGradient = ctx.createLinearGradient(-this.width / 2, 0, this.width / 2, 0);
        handleGradient.addColorStop(0, primary);
        handleGradient.addColorStop(0.5, secondary);
        handleGradient.addColorStop(1, primary);
        ctx.fillStyle = handleGradient;
        ctx.fillRect(-this.width / 2 + 2, this.length * 0.6, this.width - 4, this.length * 0.4);

        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const yPos = this.length * (0.65 + i * 0.1);
            ctx.beginPath();
            ctx.moveTo(-this.width / 2 + 3, yPos);
            ctx.lineTo(this.width / 2 - 3, yPos);
            ctx.stroke();
        }

        ctx.restore();
    }
}

class Target {
    constructor(x, y, radius, speed, directionChange) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speed = speed;
        this.baseSpeed = speed;
        this.angle = 0;
        this.angularVelocity = speed * 0.02;
        this.knives = [];
        this.directionChange = directionChange;
        this.lastDirectionChange = 0;
        this.nextChangeTime = 0;
        this.particles = [];
        this.rings = 5;
    }

    update() {
        this.angle += this.angularVelocity;

        if (this.directionChange) {
            const now = Date.now();
            if (now > this.nextChangeTime) {
                this.angularVelocity *= -1;
                this.nextChangeTime = now + 2000 + Math.random() * 3000;
            }
        }

        this.particles = this.particles.filter(p => {
            p.update();
            return !p.isDead();
        });
    }

    addParticles(x, y, count) {
        const colors = ['#8B4513', '#A0522D', '#654321', '#D2691E', '#CD853F', '#DEB887'];
        for (let i = 0; i < count; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
            const speed = 2 + Math.random() * 5;
            const size = 2 + Math.random() * 5;
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push(new Particle(x, y, color, angle, speed, size));
        }
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        for (let i = this.rings; i >= 1; i--) {
            const r = (this.radius * i) / this.rings;
            const isEven = i % 2 === 0;
            
            const gradient = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
            if (isEven) {
                gradient.addColorStop(0, '#D2B48C');
                gradient.addColorStop(0.5, '#C4A574');
                gradient.addColorStop(1, '#A08060');
            } else {
                gradient.addColorStop(0, '#DEB887');
                gradient.addColorStop(0.5, '#CD9B6F');
                gradient.addColorStop(1, '#A0522D');
            }

            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            ctx.lineWidth = 1;
            for (let j = 0; j < 12; j++) {
                const ringAngle = (j / 12) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(ringAngle) * r, Math.sin(ringAngle) * r);
                ctx.stroke();
            }

            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.stroke();
        }

        const centerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 0.15);
        centerGradient.addColorStop(0, '#FF6B6B');
        centerGradient.addColorStop(1, '#CC4444');
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = centerGradient;
        ctx.fill();
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 2;
        ctx.stroke();

        this.knives.forEach(knife => {
            const knifeAngle = knife.stuckAngle;
            const knifeX = Math.cos(knifeAngle - Math.PI / 2) * (this.radius - 10);
            const knifeY = Math.sin(knifeAngle - Math.PI / 2) * (this.radius - 10);
            
            ctx.save();
            ctx.translate(knifeX, knifeY);
            ctx.rotate(knifeAngle);
            knife.draw(ctx);
            ctx.restore();
        });

        ctx.restore();
    }

    checkCollision(newKnifeAngle) {
        const collisionThreshold = 0.12;
        for (const knife of this.knives) {
            let diff = Math.abs(newKnifeAngle - knife.stuckAngle);
            while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
            if (diff < collisionThreshold) {
                return true;
            }
        }
        return false;
    }
}

class KnifeGame {
    constructor() {
        try {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.state = GameState.IDLE;
            this.currentLevel = 1;
            this.maxLevel = 1;
            this.levelConfig = null;
            this.currentSkin = {
                skin_key: 'default',
                color_primary: '#8B4513',
                color_secondary: '#D2691E',
                effect_type: null
            };
            this.target = null;
            this.flyingKnife = null;
            this.knivesLeft = 0;
            this.knivesTotal = 0;
            this.lastTime = 0;
            this.isGuest = false;
            this.canvasSize = 400;

            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
            this.canvas.addEventListener('click', () => this.throwKnife());
            this.canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.throwKnife();
            }, { passive: false });

            this.bindUI();

            setTimeout(() => this.init(), 10);
        } catch (e) {
            console.error('游戏初始化失败:', e);
            alert('游戏初始化失败: ' + e.message);
        }
    }

    async init() {
        const savedGuest = localStorage.getItem('knife_guest');
        const savedLevel = localStorage.getItem('knife_level');
        const savedSkin = localStorage.getItem('knife_skin');
        const savedMaxLevel = localStorage.getItem('knife_max_level');

        if (API.token) {
            try {
                const result = await API.getCurrentUser();
                if (result.code === 0 && result.data) {
                    await this.loadProgress();
                    this.startLevel(this.currentLevel);
                    this.showScreen('game-screen');
                    return;
                }
            } catch (e) {
                console.log('自动登录失败:', e);
            }
            API.clearToken();
        }

        if (savedGuest === 'true' && savedLevel) {
            this.isGuest = true;
            this.currentLevel = parseInt(savedLevel) || 1;
            this.maxLevel = parseInt(savedMaxLevel) || this.currentLevel;
            if (savedSkin) {
                try {
                    this.currentSkin = JSON.parse(savedSkin);
                } catch (e) {}
            }
            this.startLevel(this.currentLevel);
            this.showScreen('game-screen');
            return;
        }

        this.showScreen('login-screen');
    }

    resizeCanvas() {
        try {
            const container = this.canvas.parentElement;
            if (!container) return;

            const containerWidth = container.clientWidth || 400;
            const containerHeight = container.clientHeight || 400;
            const maxWidth = Math.min(containerWidth, 500);
            const maxHeight = Math.min(containerHeight, 700);
            
            const size = Math.min(maxWidth, maxHeight);
            const dpr = window.devicePixelRatio || 1;
            
            if (size > 0) {
                this.canvas.style.width = size + 'px';
                this.canvas.style.height = size + 'px';
                this.canvas.width = size * dpr;
                this.canvas.height = size * dpr;
                this.ctx.scale(dpr, dpr);
                this.canvasSize = size;
            }

            if (this.target) {
                this.target.x = this.canvasSize / 2;
                this.target.y = this.canvasSize * 0.35;
            }
        } catch (e) {
            console.warn('Canvas resize failed:', e);
        }
    }

    bindUI() {
        document.getElementById('login-btn').addEventListener('click', () => this.handleLogin());
        document.getElementById('register-btn').addEventListener('click', () => this.handleRegister());
        document.getElementById('guest-btn').addEventListener('click', () => this.startGuest());
        
        document.getElementById('back-btn').addEventListener('click', () => this.goToLogin());
        document.getElementById('skin-btn').addEventListener('click', () => this.showSkins());
        document.getElementById('level-btn').addEventListener('click', () => this.showLevels());
        
        document.getElementById('skin-back-btn').addEventListener('click', () => this.showScreen('game-screen'));
        document.getElementById('level-back-btn').addEventListener('click', () => this.showScreen('game-screen'));
        
        document.getElementById('retry-btn').addEventListener('click', () => this.retryLevel());
        document.getElementById('next-btn').addEventListener('click', () => this.nextLevel());

        ['username', 'password'].forEach(id => {
            document.getElementById(id).addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin();
            });
        });
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    }

    saveState() {
        if (this.isGuest) {
            localStorage.setItem('knife_guest', 'true');
            localStorage.setItem('knife_level', this.currentLevel.toString());
            localStorage.setItem('knife_max_level', this.maxLevel.toString());
            localStorage.setItem('knife_skin', JSON.stringify(this.currentSkin));
        } else {
            localStorage.removeItem('knife_guest');
            localStorage.removeItem('knife_level');
            localStorage.removeItem('knife_max_level');
            localStorage.removeItem('knife_skin');
        }
    }

    async handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username || !password) {
            alert('请输入用户名和密码');
            return;
        }

        const result = await API.login(username, password);
        if (result.code === 0) {
            API.setToken(result.data.token);
            this.isGuest = false;
            await this.loadProgress();
            this.startLevel(this.currentLevel);
            this.showScreen('game-screen');
        } else {
            alert(result.message);
        }
    }

    async handleRegister() {
        alert('注册功能暂未开放，请使用默认账号 admin / admin123 登录');
    }

    async startGuest() {
        this.isGuest = true;
        API.clearToken();
        this.currentLevel = 1;
        this.maxLevel = 1;
        this.currentSkin = {
            skin_key: 'default',
            color_primary: '#8B4513',
            color_secondary: '#D2691E',
            effect_type: null
        };
        await this.loadLevelConfig(1);
        this.startLevel(1);
        this.showScreen('game-screen');
    }

    async goToLogin() {
        if (!this.isGuest) {
            await API.logout();
        }
        API.clearToken();
        this.state = GameState.IDLE;
        this.showScreen('login-screen');
    }

    async loadProgress() {
        const result = await API.getProgress();
        if (result.code === 0) {
            this.currentLevel = result.data.current_level;
            this.maxLevel = result.data.max_unlocked_level;
            if (result.data.current_skin) {
                this.currentSkin = result.data.current_skin;
            }
        }
    }

    async loadLevelConfig(levelNum) {
        if (this.isGuest) {
            const baseSpeed = 1.0 + Math.floor((levelNum - 1) / 5) * 0.3;
            const baseRadius = 120 * Math.pow(0.9, Math.floor((levelNum - 1) / 10));
            this.levelConfig = {
                level_num: levelNum,
                target_speed: baseSpeed,
                target_radius: Math.max(50, baseRadius),
                knife_count: 5 + Math.floor((levelNum - 1) / 3),
                direction_change: levelNum > 1 && levelNum % 5 === 0
            };
        } else {
            const result = await API.getLevel(levelNum);
            if (result.code === 0) {
                this.levelConfig = result.data;
            }
        }
    }

    startLevel(levelNum) {
        this.showScreen('game-screen');
        
        setTimeout(() => {
            this.resizeCanvas();
            this.loadLevelConfig(levelNum).then(() => {
                this.currentLevel = levelNum;
                this.knivesTotal = this.levelConfig.knife_count;
                this.knivesLeft = this.knivesTotal;

                const targetRadius = Math.min(this.levelConfig.target_radius, this.canvasSize * 0.28);
                this.target = new Target(
                    this.canvasSize / 2,
                    this.canvasSize * 0.35,
                    targetRadius,
                    this.levelConfig.target_speed,
                    this.levelConfig.direction_change
                );
                this.flyingKnife = null;
                this.state = GameState.PLAYING;
                this.hideOverlay();
                this.updateUI();
                this.saveState();
                this.startLoop();
            }).catch(err => {
                console.error('加载关卡失败:', err);
                alert('加载关卡失败: ' + err.message);
            });
        }, 50);
    }

    startLoop() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        
        const loop = (timestamp) => {
            if (!this.lastTime) this.lastTime = timestamp;
            this.lastTime = timestamp;

            this.update();
            this.render();

            if (this.state === GameState.PLAYING || this.state === GameState.THROWING) {
                this.animationId = requestAnimationFrame(loop);
            }
        };
        this.animationId = requestAnimationFrame(loop);
    }

    update() {
        if (this.state === GameState.IDLE) return;

        this.target.update();

        if (this.flyingKnife && this.flyingKnife.isFlying) {
            const reached = this.flyingKnife.update(this.target.y);
            if (reached) {
                this.handleKnifeHit();
            }
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvasSize, this.canvasSize);

        this.target.draw(this.ctx);

        if (this.flyingKnife) {
            this.flyingKnife.draw(this.ctx);
        }

        this.drawKnifeQueue();
    }

    drawKnifeQueue() {
        const startX = this.canvasSize / 2;
        const startY = this.canvasSize * 0.85;
        const spacing = 25;

        for (let i = 0; i < this.knivesLeft - 1; i++) {
            const y = startY + i * spacing;
            if (y > this.canvasSize - 30) break;

            const dummyKnife = new Knife(startX, y, 0, this.currentSkin);
            dummyKnife.length = 50;
            dummyKnife.width = 10;
            dummyKnife.draw(this.ctx);
        }
    }

    throwKnife() {
        if (this.state !== GameState.PLAYING) return;
        if (this.flyingKnife && this.flyingKnife.isFlying) return;
        if (this.knivesLeft <= 0) return;

        const startX = this.canvasSize / 2;
        const startY = this.canvasSize * 0.8;

        this.flyingKnife = new Knife(startX, startY, 0, this.currentSkin);
        this.flyingKnife.fly();
        this.knivesLeft--;
        this.state = GameState.THROWING;
        this.updateUI();
    }

    handleKnifeHit() {
        const knife = this.flyingKnife;
        const target = this.target;

        let angle = target.angle;
        if (angle < 0) angle += Math.PI * 2;
        angle = angle % (Math.PI * 2);

        const hitX = target.x;
        const hitY = target.y + target.radius * 0.85;
        target.addParticles(hitX, hitY, 20);

        if (target.checkCollision(angle)) {
            this.state = GameState.LOSE;
            this.flyingKnife = null;
            this.onLose();
            return;
        }

        knife.isStuck = true;
        knife.isFlying = false;
        knife.stuckAngle = angle;
        target.knives.push(knife);
        this.flyingKnife = null;

        if (!this.isGuest) {
            API.completeLevel(this.currentLevel).catch(() => {});
        }

        if (this.knivesLeft <= 0) {
            this.state = GameState.WIN;
            this.onWin();
        } else {
            this.state = GameState.PLAYING;
        }

        this.updateUI();
    }

    async onWin() {
        if (!this.isGuest) {
            const result = await API.completeLevel(this.currentLevel);
            if (result.code === 0) {
                this.maxLevel = Math.max(this.maxLevel, result.data.max_unlocked_level);
                this.showWinOverlay(result.data.newly_unlocked_skins || []);
                return;
            }
        }
        this.showWinOverlay([]);
    }

    async onLose() {
        if (!this.isGuest) {
            await API.failLevel();
        }
        this.showLoseOverlay();
    }

    showWinOverlay(newSkins) {
        document.getElementById('overlay-title').textContent = '🎉 关卡完成！';
        document.getElementById('overlay-message').textContent = `太棒了！你通过了第 ${this.currentLevel} 关`;
        document.getElementById('retry-btn').style.display = 'none';
        document.getElementById('next-btn').style.display = 'block';

        const skinsDiv = document.getElementById('unlocked-skins');
        const skinsList = document.getElementById('new-skins-list');
        
        if (newSkins && newSkins.length > 0) {
            skinsDiv.classList.remove('hidden');
            skinsList.innerHTML = '';
            newSkins.forEach(skin => {
                const item = document.createElement('div');
                item.className = 'skin-item-mini';
                item.innerHTML = `
                    <div class="skin-color-preview" style="background: linear-gradient(135deg, ${skin.color_primary}, ${skin.color_secondary || skin.color_primary})"></div>
                    <span class="skin-name-mini">${skin.skin_name}</span>
                `;
                skinsList.appendChild(item);
            });
        } else {
            skinsDiv.classList.add('hidden');
        }

        document.getElementById('game-overlay').classList.remove('hidden');
    }

    showLoseOverlay() {
        document.getElementById('overlay-title').textContent = '💥 游戏结束';
        document.getElementById('overlay-message').textContent = '飞刀碰到了！再试一次吧';
        document.getElementById('retry-btn').style.display = 'block';
        document.getElementById('next-btn').style.display = 'none';
        document.getElementById('unlocked-skins').classList.add('hidden');
        document.getElementById('game-overlay').classList.remove('hidden');
    }

    hideOverlay() {
        document.getElementById('game-overlay').classList.add('hidden');
    }

    retryLevel() {
        this.startLevel(this.currentLevel);
    }

    nextLevel() {
        const next = this.currentLevel + 1;
        if (!this.isGuest && next > this.maxLevel) {
            this.maxLevel = next;
        }
        this.startLevel(next);
    }

    async showSkins() {
        const result = await API.getSkins();
        let skins = [];
        if (result.code === 0) {
            skins = result.data;
        } else {
            skins = [
                { skin_key: 'default', skin_name: '普通刀', description: '基础飞刀', unlock_level: 1, color_primary: '#8B4513', color_secondary: '#D2691E', effect_type: null, unlocked: true },
                { skin_key: 'fire', skin_name: '火焰刀', description: '通关第10关解锁', unlock_level: 10, color_primary: '#FF4500', color_secondary: '#FFD700', effect_type: 'fire', unlocked: this.maxLevel >= 10 },
                { skin_key: 'ice', skin_name: '冰霜刀', description: '通关第20关解锁', unlock_level: 20, color_primary: '#00CED1', color_secondary: '#E0FFFF', effect_type: 'ice', unlocked: this.maxLevel >= 20 },
                { skin_key: 'rainbow', skin_name: '彩虹刀', description: '通关第30关解锁', unlock_level: 30, color_primary: '#FF00FF', color_secondary: '#00FFFF', effect_type: 'rainbow', unlocked: this.maxLevel >= 30 }
            ];
        }

        const container = document.getElementById('skin-list');
        container.innerHTML = '';

        skins.forEach(skin => {
            const isSelected = this.currentSkin.skin_key === skin.skin_key;
            const card = document.createElement('div');
            card.className = `skin-card ${isSelected ? 'selected' : ''} ${!skin.unlocked ? 'locked' : ''}`;
            
            const effectClass = skin.effect_type || 'default';
            card.innerHTML = `
                <div class="skin-preview ${effectClass}"></div>
                <div class="skin-name">${skin.skin_name}</div>
                <div class="skin-desc">${skin.description || ''}</div>
                ${!skin.unlocked ? `<div class="skin-lock-info">🔒 通关第${skin.unlock_level}关解锁</div>` : ''}
                ${isSelected ? '<div style="color:#8B4513;font-size:12px;margin-top:4px;">✓ 已选中</div>' : ''}
            `;

            if (skin.unlocked) {
                card.addEventListener('click', async () => {
                    if (!this.isGuest) {
                        const selectResult = await API.selectSkin(skin.skin_key);
                        if (selectResult.code !== 0) {
                            alert(selectResult.message);
                            return;
                        }
                    }
                    this.currentSkin = {
                        skin_key: skin.skin_key,
                        color_primary: skin.color_primary,
                        color_secondary: skin.color_secondary,
                        effect_type: skin.effect_type
                    };
                    this.saveState();
                    this.showSkins();
                });
            }

            container.appendChild(card);
        });

        this.showScreen('skin-screen');
    }

    async showLevels() {
        let levels = [];
        if (!this.isGuest) {
            const result = await API.getAllLevels();
            if (result.code === 0) {
                levels = result.data.slice(0, 100);
            }
        } else {
            for (let i = 1; i <= 50; i++) {
                levels.push({ level_num: i });
            }
        }

        const container = document.getElementById('level-list');
        container.innerHTML = '';

        levels.forEach(level => {
            const isUnlocked = level.level_num <= this.maxLevel;
            const isCurrent = level.level_num === this.currentLevel;
            const card = document.createElement('div');
            card.className = `level-card ${isCurrent ? 'current' : ''} ${!isUnlocked ? 'locked' : ''}`;
            card.innerHTML = `
                <span class="level-num">${level.level_num}</span>
                ${!isUnlocked ? '<span style="font-size:12px;">🔒</span>' : ''}
            `;

            if (isUnlocked) {
                card.addEventListener('click', async () => {
                    if (!this.isGuest) {
                        await API.selectLevel(level.level_num);
                    }
                    this.startLevel(level.level_num);
                    this.showScreen('game-screen');
                });
            }

            container.appendChild(card);
        });

        this.showScreen('level-screen');
    }

    updateUI() {
        document.getElementById('level-num').textContent = this.currentLevel;
        document.getElementById('knife-left').textContent = this.knivesLeft;
        document.getElementById('knife-total').textContent = this.knivesTotal;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new KnifeGame();
});
