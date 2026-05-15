const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 620;
const GROUND_Y = 520;
const GRAVITY = 0.5;
const JUMP_FORCE = -12;

const GAME_STATES = {
    MENU: 'menu',
    CHARACTER_SELECT: 'character_select',
    PLAYING: 'playing',
    PAUSED: 'paused',
    RESULT: 'result'
};

const CHARACTERS = {
    ragdoll: {
        id: 'ragdoll',
        name: '布偶猫',
        emoji: '🐱',
        type: '均衡型',
        maxHealth: 1000,
        speed: 5,
        attackPower: 1,
        skills: ['棉花糖扑击', '爱心光波'],
        colors: {
            body: '#FAF3E0',
            ear: '#E8D4C4',
            eye: '#4A90D9',
            nose: '#FFB6C1',
            cheek: '#FFD1DC',
            tail: '#FAF3E0'
        }
    },
    orange: {
        id: 'orange',
        name: '橘猫',
        emoji: '😺',
        type: '攻击型',
        maxHealth: 900,
        speed: 4.5,
        attackPower: 1.2,
        skills: ['干饭猛扑', '火焰尾击'],
        colors: {
            body: '#FFB347',
            ear: '#FF8C00',
            eye: '#228B22',
            nose: '#FF6347',
            cheek: '#FFA07A',
            tail: '#FFB347'
        }
    },
    british: {
        id: 'british',
        name: '英短猫',
        emoji: '🐈',
        type: '速度型',
        maxHealth: 850,
        speed: 6,
        attackPower: 0.9,
        skills: ['闪电爪击', '毛球弹幕'],
        colors: {
            body: '#708090',
            ear: '#4A5568',
            eye: '#FFD700',
            nose: '#A0AEC0',
            cheek: '#B8C5D6',
            tail: '#708090'
        }
    }
};

const ATTACK_DAMAGE = {
    light_paw: 25,
    heavy_paw: 50,
    light_tail: 30,
    heavy_tail: 60,
    special: 100
};

const ATTACK_DURATION = {
    light_paw: 20,
    heavy_paw: 35,
    light_tail: 25,
    heavy_tail: 45,
    special: 60
};

const ATTACK_COOLDOWN = {
    light_paw: 25,
    heavy_paw: 50,
    light_tail: 30,
    heavy_tail: 60,
    special: 150
};

const Storage = {
    save(state) {
        try {
            localStorage.setItem('maomao_game_state', JSON.stringify(state));
        } catch (e) {}
    },
    load() {
        try {
            const data = localStorage.getItem('maomao_game_state');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    },
    clear() {
        localStorage.removeItem('maomao_game_state');
    }
};

const keys = {};
let keySequence = [];
let sequenceTimeout = null;

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    keySequence.push({ key: e.key, time: Date.now() });
    keySequence = keySequence.filter(k => Date.now() - k.time < 500);
    if (sequenceTimeout) clearTimeout(sequenceTimeout);
    sequenceTimeout = setTimeout(() => { keySequence = []; }, 500);
    e.preventDefault();
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function checkSpecialMove() {
    if (keySequence.length < 3) return false;
    const recentKeys = keySequence.slice(-3);
    const ks = recentKeys.map(k => k.key);
    const patterns = [
        ['ArrowDown', 'ArrowRight', 'j'], ['ArrowDown', 'ArrowRight', 'J'],
        ['ArrowDown', 'ArrowLeft', 'j'], ['ArrowDown', 'ArrowLeft', 'J']
    ];
    return patterns.some(pattern => 
        pattern.every((k, i) => ks[i] === k)
    );
}

function getAttackKey() {
    if (keys['j'] || keys['J']) return 'light_paw';
    if (keys['k'] || keys['K']) return 'heavy_paw';
    if (keys['u'] || keys['U']) return 'light_tail';
    if (keys['i'] || keys['I']) return 'heavy_tail';
    return null;
}

const particles = [];

function drawBackground(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#B0E0E6');
    gradient.addColorStop(1, '#98FB98');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    [[100, 80, 0.8], [400, 50, 1], [700, 100, 0.7], [1000, 60, 0.9]].forEach(([x, y, scale]) => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.arc(x, y, 30 * scale, 0, Math.PI * 2);
        ctx.arc(x + 35 * scale, y - 10 * scale, 35 * scale, 0, Math.PI * 2);
        ctx.arc(x + 70 * scale, y, 30 * scale, 0, Math.PI * 2);
        ctx.arc(x + 35 * scale, y + 10 * scale, 25 * scale, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.fillStyle = '#90EE90';
    ctx.beginPath();
    ctx.ellipse(CANVAS_WIDTH/2, GROUND_Y + 50, CANVAS_WIDTH/2 + 100, 100, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#7CCD7C';
    for (let i = 0; i < CANVAS_WIDTH; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, GROUND_Y + 30);
        ctx.quadraticCurveTo(i + 20, GROUND_Y + 5, i + 40, GROUND_Y + 30);
        ctx.fill();
    }
}

function drawCuteCat(ctx, cat) {
    const x = cat.x;
    const y = cat.y;
    const facing = cat.facing;
    const crouchScale = cat.isCrouching ? 0.6 : 1;
    const jumpOffset = cat.isJumping ? -5 : 0;

    ctx.save();
    ctx.translate(x + 50, y + jumpOffset);
    ctx.scale(facing, crouchScale);

    if (cat.isHurt && Math.floor(cat.hurtFrame / 3) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }

    const colors = cat.colors;

    ctx.fillStyle = colors.body;
    ctx.beginPath();
    ctx.ellipse(0, -25, 45, 35, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(-10, -35, 20, 15, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colors.body;
    ctx.beginPath();
    ctx.arc(40, -45, 35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colors.ear;
    ctx.beginPath();
    ctx.moveTo(15, -70);
    ctx.lineTo(22, -95);
    ctx.lineTo(45, -70);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(35, -70);
    ctx.lineTo(55, -95);
    ctx.lineTo(65, -70);
    ctx.fill();

    ctx.fillStyle = colors.eye;
    ctx.beginPath();
    ctx.ellipse(28, -48, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(52, -48, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(30, -51, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(54, -51, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(29, -48, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(53, -48, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colors.cheek;
    ctx.beginPath();
    ctx.ellipse(18, -38, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(62, -38, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colors.nose;
    ctx.beginPath();
    ctx.moveTo(40, -38);
    ctx.quadraticCurveTo(36, -32, 40, -30);
    ctx.quadraticCurveTo(44, -32, 40, -38);
    ctx.fill();

    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(40, -30);
    ctx.quadraticCurveTo(32, -22, 25, -25);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(40, -30);
    ctx.quadraticCurveTo(48, -22, 55, -25);
    ctx.stroke();

    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(12, -42);
    ctx.lineTo(-8, -45);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(12, -36);
    ctx.lineTo(-5, -35);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(68, -42);
    ctx.lineTo(88, -45);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(68, -36);
    ctx.lineTo(85, -35);
    ctx.stroke();

    const legBob = Math.sin(cat.animationFrame * 0.15) * 2;
    ctx.fillStyle = colors.body;
    [[-25, -5 + legBob, 0.2], [-5, -5 - legBob, -0.2], 
     [15, -3 - legBob, 0.2], [35, -3 + legBob, -0.2]].forEach(([lx, ly, rot]) => {
        ctx.beginPath();
        ctx.ellipse(lx, ly, 10, 15, rot, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.fillStyle = 'rgba(255, 182, 193, 0.5)';
    [-25, -5, 15, 35].forEach(lx => {
        ctx.beginPath();
        ctx.ellipse(lx, 8, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
    });

    const wag = Math.sin(cat.animationFrame * 0.08) * 8;
    ctx.strokeStyle = colors.tail;
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-40, -25);
    ctx.quadraticCurveTo(-65, -40 + wag, -75, -60 + wag * 1.5);
    ctx.stroke();
    ctx.fillStyle = colors.tail;
    ctx.beginPath();
    ctx.arc(-75, -60 + wag * 1.5, 12, 0, Math.PI * 2);
    ctx.fill();

    if (cat.isAttacking) {
        const attackProgress = cat.attackFrame / ATTACK_DURATION[cat.currentAttack];
        const effectAlpha = Math.sin(attackProgress * Math.PI);
        ctx.globalAlpha = effectAlpha * 0.8;

        switch (cat.currentAttack) {
            case 'light_paw':
                drawPawSwipe(ctx, 70, -35, 30, '#FF69B4');
                break;
            case 'heavy_paw':
                drawPawSwipe(ctx, 80, -40, 50, '#FF1493');
                break;
            case 'light_tail':
                drawTailSwipe(ctx, -60, -50 + wag, 35, '#87CEEB');
                break;
            case 'heavy_tail':
                drawTailSwipe(ctx, -70, -55 + wag, 55, '#4169E1');
                break;
            case 'special':
                drawSpecialAttack(ctx);
                break;
        }
        ctx.globalAlpha = 1;
    }

    ctx.restore();
}

function drawPawSwipe(ctx, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x - size * 0.3, y - size * 0.15, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + size * 0.3, y - size * 0.15, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x - 10 + i * 10, y - size * 0.8);
        ctx.lineTo(x - 10 + i * 10, y - size * 1.2);
        ctx.stroke();
    }
}

function drawTailSwipe(ctx, x, y, size, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y, size, 0.5, 2.5);
    ctx.stroke();
}

function drawSpecialAttack(ctx) {
    const time = Date.now() * 0.01;
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + time;
        const dist = 50 + Math.sin(time * 2 + i) * 25;
        const x = Math.cos(angle) * dist + 60;
        const y = Math.sin(angle) * dist - 40;
        ctx.fillStyle = ['#FF69B4', '#FFD700', '#87CEEB', '#98FB98'][i % 4];
        ctx.beginPath();
        drawStar(ctx, x, y, 15, 5, 0.5);
        ctx.fill();
    }
}

function drawStar(ctx, cx, cy, outerRadius, points, innerRatio) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : outerRadius * innerRatio;
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life--;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles(ctx) {
    particles.forEach(p => {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function addDamageEffect(x, y, damage) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8 - 3,
            size: Math.random() * 6 + 3,
            color: ['#FF6B6B', '#FFB6C1', '#FF69B4'][Math.floor(Math.random() * 3)],
            life: 35, maxLife: 35
        });
    }
}

function addSpecialEffect(x, y) {
    for (let i = 0; i < 25; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12,
            size: Math.random() * 10 + 5,
            color: ['#FF69B4', '#FFD700', '#87CEEB', '#98FB98'][Math.floor(Math.random() * 4)],
            life: 50, maxLife: 50
        });
    }
}

class Cat {
    constructor(characterData, x, isPlayer = true) {
        this.character = characterData;
        this.x = x;
        this.y = GROUND_Y;
        this.vx = 0;
        this.vy = 0;
        this.width = 100;
        this.height = 80;
        this.isPlayer = isPlayer;
        this.facing = isPlayer ? 1 : -1;

        this.health = characterData.maxHealth;
        this.maxHealth = characterData.maxHealth;
        this.speed = characterData.speed;
        this.attackPower = characterData.attackPower;
        this.colors = characterData.colors;

        this.isJumping = false;
        this.isCrouching = false;
        this.isAttacking = false;
        this.currentAttack = null;
        this.attackFrame = 0;
        this.attackCooldowns = {};
        this.isHurt = false;
        this.hurtFrame = 0;
        this.animationFrame = 0;
    }

    update(opponent) {
        this.animationFrame++;

        if (this.isHurt) {
            this.hurtFrame--;
            if (this.hurtFrame <= 0) this.isHurt = false;
        }

        if (this.isAttacking) {
            this.attackFrame++;
            if (this.attackFrame >= ATTACK_DURATION[this.currentAttack]) {
                this.isAttacking = false;
                this.currentAttack = null;
            }
            return;
        }

        for (let attack in this.attackCooldowns) {
            if (this.attackCooldowns[attack] > 0) this.attackCooldowns[attack]--;
        }

        if (this.isPlayer) {
            this.handlePlayerInput();
        } else {
            this.handleAI(opponent);
        }

        this.x += this.vx;
        this.y += this.vy;

        if (this.y > GROUND_Y) {
            this.y = GROUND_Y;
            this.vy = 0;
            this.isJumping = false;
        }

        if (this.x < 30) this.x = 30;
        if (this.x > CANVAS_WIDTH - 130) this.x = CANVAS_WIDTH - 130;

        this.vx *= 0.85;
        if (this.y < GROUND_Y) this.vy += GRAVITY;
    }

    handlePlayerInput() {
        if (keys['ArrowLeft']) {
            this.vx = -this.speed;
            this.facing = -1;
        }
        if (keys['ArrowRight']) {
            this.vx = this.speed;
            this.facing = 1;
        }
        if (keys['ArrowUp'] && !this.isJumping && !this.isCrouching) {
            this.vy = JUMP_FORCE;
            this.isJumping = true;
        }
        this.isCrouching = keys['ArrowDown'] && !this.isJumping;
    }

    handleAI(opponent) {
        const distance = opponent.x - this.x;
        const absDistance = Math.abs(distance);

        if (!opponent.isAttacking) {
            if (absDistance > 200) {
                this.vx = distance > 0 ? this.speed * 0.6 : -this.speed * 0.6;
                this.facing = distance > 0 ? 1 : -1;
            } else if (absDistance < 130) {
                this.vx = distance > 0 ? -this.speed * 0.4 : this.speed * 0.4;
            }
        }

        if (absDistance < 220 && Math.random() < 0.012 && !this.isJumping && this.y >= GROUND_Y) {
            this.vy = JUMP_FORCE * 0.75;
            this.isJumping = true;
        }

        if (absDistance < 170 && Math.random() < 0.022) {
            const attacks = ['light_paw', 'heavy_paw', 'light_tail'];
            this.attack(attacks[Math.floor(Math.random() * attacks.length)]);
        }
    }

    attack(type) {
        if (this.isAttacking) return false;
        if (this.attackCooldowns[type] && this.attackCooldowns[type] > 0) return false;
        this.isAttacking = true;
        this.currentAttack = type;
        this.attackFrame = 0;
        this.attackCooldowns[type] = ATTACK_COOLDOWN[type];
        return true;
    }

    getAttackHitbox() {
        if (!this.isAttacking) return null;
        const attackProgress = this.attackFrame / ATTACK_DURATION[this.currentAttack];
        if (attackProgress < 0.35 || attackProgress > 0.65) return null;

        let hitboxWidth, hitboxHeight, offsetX;
        switch (this.currentAttack) {
            case 'light_paw':
                hitboxWidth = 50; hitboxHeight = 35; offsetX = 65; break;
            case 'heavy_paw':
                hitboxWidth = 70; hitboxHeight = 45; offsetX = 75; break;
            case 'light_tail':
                hitboxWidth = 60; hitboxHeight = 30; offsetX = -55; break;
            case 'heavy_tail':
                hitboxWidth = 80; hitboxHeight = 40; offsetX = -70; break;
            case 'special':
                hitboxWidth = 180; hitboxHeight = 90; offsetX = 90; break;
            default: return null;
        }

        return {
            x: this.x + (this.facing > 0 ? offsetX : -offsetX - hitboxWidth + this.width),
            y: this.y - this.height - hitboxHeight / 2,
            width: hitboxWidth,
            height: hitboxHeight
        };
    }

    takeDamage(attackType, attackPower) {
        const baseDamage = ATTACK_DAMAGE[attackType];
        const damage = Math.floor(baseDamage * attackPower);
        this.health = Math.max(0, this.health - damage);
        this.isHurt = true;
        this.hurtFrame = 20;
        return damage;
    }

    getState() {
        return {
            characterId: this.character.id,
            x: this.x, y: this.y, health: this.health, facing: this.facing,
            isJumping: this.isJumping, isCrouching: this.isCrouching,
            isAttacking: this.isAttacking, currentAttack: this.currentAttack,
            attackFrame: this.attackFrame, attackCooldowns: this.attackCooldowns,
            isHurt: this.isHurt, hurtFrame: this.hurtFrame
        };
    }

    loadState(state) {
        this.x = state.x; this.y = state.y; this.health = state.health;
        this.facing = state.facing; this.isJumping = state.isJumping;
        this.isCrouching = state.isCrouching; this.isAttacking = state.isAttacking;
        this.currentAttack = state.currentAttack; this.attackFrame = state.attackFrame;
        this.attackCooldowns = state.attackCooldowns || {};
        this.isHurt = state.isHurt; this.hurtFrame = state.hurtFrame || 0;
    }
}

class Game {
    constructor(canvas, uiElements) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        this.ui = uiElements;
        this.state = GAME_STATES.MENU;
        this.playerCat = null;
        this.enemyCat = null;
        this.selectedCharacterId = 'ragdoll';
        this.comboTimer = 0;
        this.lastPlayerHitbox = null;
        this.lastEnemyHitbox = null;
        this.gameRunning = false;
        this.setupUIListeners();
    }

    setupUIListeners() {
        this.ui.startBtn.addEventListener('click', () => this.startGame());
        this.ui.characterBtn.addEventListener('click', () => this.showCharacterSelect());
        this.ui.confirmCharacter.addEventListener('click', () => this.confirmCharacterSelect());
        this.ui.backToStart.addEventListener('click', () => this.showMenu());
        this.ui.pauseBtn.addEventListener('click', () => this.pauseGame());
        this.ui.resumeBtn.addEventListener('click', () => this.resumeGame());
        this.ui.restartBtn.addEventListener('click', () => this.restartGame());
        this.ui.exitBtn.addEventListener('click', () => this.exitToMenu());
        this.ui.playAgainBtn.addEventListener('click', () => this.restartGame());
        this.ui.backToMenuBtn.addEventListener('click', () => this.exitToMenu());
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state === GAME_STATES.PLAYING) {
                this.pauseGame();
            }
        });
    }

    showMenu() {
        this.state = GAME_STATES.MENU;
        this.ui.startScreen.style.display = 'flex';
        this.ui.characterScreen.style.display = 'none';
        this.ui.gameScreen.style.display = 'none';
        this.ui.pauseMenu.style.display = 'none';
        this.ui.resultScreen.style.display = 'none';
    }

    showCharacterSelect() {
        this.state = GAME_STATES.CHARACTER_SELECT;
        this.ui.startScreen.style.display = 'none';
        this.ui.characterScreen.style.display = 'flex';
        this.renderCharacterList();
    }

    renderCharacterList() {
        this.ui.characterList.innerHTML = '';
        Object.values(CHARACTERS).forEach(char => {
            const card = document.createElement('div');
            card.className = `character-card${char.id === this.selectedCharacterId ? ' selected' : ''}`;
            card.innerHTML = `
                <div class="character-emoji">${char.emoji}</div>
                <h3>${char.name}</h3>
                <div class="character-type">${char.type}</div>
                <div class="character-stats">
                    生命: ${char.maxHealth} | 速度: ${char.speed} | 攻击: ${char.attackPower}
                </div>
                <div class="character-skill">特技: ${char.skills.join(', ')}</div>
            `;
            card.addEventListener('click', () => {
                this.selectedCharacterId = char.id;
                this.renderCharacterList();
            });
            this.ui.characterList.appendChild(card);
        });
    }

    confirmCharacterSelect() {
        this.startGame();
    }

    startGame() {
        this.state = GAME_STATES.PLAYING;
        this.ui.startScreen.style.display = 'none';
        this.ui.characterScreen.style.display = 'none';
        this.ui.gameScreen.style.display = 'block';

        const savedState = Storage.load();
        const playerChar = CHARACTERS[this.selectedCharacterId];
        const enemyCharId = this.getRandomEnemyId(this.selectedCharacterId);
        const enemyChar = CHARACTERS[enemyCharId];

        this.playerCat = new Cat(playerChar, 150, true);
        this.enemyCat = new Cat(enemyChar, 900, false);

        if (savedState && savedState.player && savedState.enemy) {
            this.playerCat.loadState(savedState.player);
            this.enemyCat.loadState(savedState.enemy);
        }

        this.updateUI();
        this.gameRunning = true;
        this.gameLoop();
    }

    getRandomEnemyId(playerId) {
        const ids = Object.keys(CHARACTERS).filter(id => id !== playerId);
        return ids[Math.floor(Math.random() * ids.length)];
    }

    pauseGame() {
        if (this.state !== GAME_STATES.PLAYING) return;
        this.state = GAME_STATES.PAUSED;
        this.gameRunning = false;
        this.ui.pauseMenu.style.display = 'flex';
        this.saveState();
    }

    resumeGame() {
        this.state = GAME_STATES.PLAYING;
        this.ui.pauseMenu.style.display = 'none';
        this.gameRunning = true;
        this.gameLoop();
    }

    restartGame() {
        Storage.clear();
        this.ui.pauseMenu.style.display = 'none';
        this.ui.resultScreen.style.display = 'none';
        particles.length = 0;
        this.startGame();
    }

    exitToMenu() {
        this.state = GAME_STATES.MENU;
        this.gameRunning = false;
        this.ui.pauseMenu.style.display = 'none';
        this.ui.resultScreen.style.display = 'none';
        this.ui.gameScreen.style.display = 'none';
        particles.length = 0;
        this.showMenu();
    }

    showResult(playerWon) {
        this.state = GAME_STATES.RESULT;
        this.gameRunning = false;
        this.ui.resultScreen.style.display = 'flex';
        this.ui.resultTitle.textContent = playerWon ? '🎉 胜利！' : '😿 失败...';
        this.ui.resultMessage.textContent = playerWon ? '你成为了喵界霸主！' : '再接再厉，下次一定能赢！';
        Storage.clear();
    }

    gameLoop() {
        if (!this.gameRunning || this.state !== GAME_STATES.PLAYING) return;
        this.update();
        this.render();
        this.saveState();
        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        if (!this.playerCat || !this.enemyCat) return;
        
        this.playerCat.update(this.enemyCat);
        this.enemyCat.update(this.playerCat);

        const attackKey = getAttackKey();
        if (attackKey) this.playerCat.attack(attackKey);

        if (checkSpecialMove()) {
            if (this.playerCat.attack('special')) {
                this.showCombo('必杀技！');
                addSpecialEffect(this.playerCat.x + 50, this.playerCat.y - 40);
            }
        }

        this.checkCollisions();
        updateParticles();
        this.updateUI();

        if (this.playerCat.health <= 0) this.showResult(false);
        else if (this.enemyCat.health <= 0) this.showResult(true);

        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer <= 0) this.ui.comboDisplay.classList.remove('show');
        }
    }

    checkCollisions() {
        if (!this.playerCat || !this.enemyCat) return;
        
        const playerHitbox = this.playerCat.getAttackHitbox();
        const enemyHitbox = this.enemyCat.getAttackHitbox();

        if (playerHitbox && this.hitboxChanged(playerHitbox, this.lastPlayerHitbox)) {
            if (this.checkHit(playerHitbox, this.enemyCat)) {
                const damage = this.enemyCat.takeDamage(this.playerCat.currentAttack, this.playerCat.attackPower);
                addDamageEffect(this.enemyCat.x + 50, this.enemyCat.y - 40, damage);
                this.showCombo(`-${damage}`);
            }
        }

        if (enemyHitbox && this.hitboxChanged(enemyHitbox, this.lastEnemyHitbox)) {
            if (this.checkHit(enemyHitbox, this.playerCat)) {
                const damage = this.playerCat.takeDamage(this.enemyCat.currentAttack, this.enemyCat.attackPower);
                addDamageEffect(this.playerCat.x + 50, this.playerCat.y - 40, damage);
            }
        }

        this.lastPlayerHitbox = playerHitbox ? { ...playerHitbox } : null;
        this.lastEnemyHitbox = enemyHitbox ? { ...enemyHitbox } : null;
    }

    hitboxChanged(hitbox, lastHitbox) {
        if (!hitbox || !lastHitbox) return true;
        return hitbox.x !== lastHitbox.x || hitbox.y !== lastHitbox.y ||
               hitbox.width !== lastHitbox.width || hitbox.height !== lastHitbox.height;
    }

    checkHit(hitbox, target) {
        const targetBox = {
            x: target.x,
            y: target.y - target.height,
            width: target.width,
            height: target.height
        };
        return hitbox.x < targetBox.x + targetBox.width &&
               hitbox.x + hitbox.width > targetBox.x &&
               hitbox.y < targetBox.y + targetBox.height &&
               hitbox.y + hitbox.height > targetBox.y;
    }

    showCombo(text) {
        this.ui.comboDisplay.textContent = text;
        this.ui.comboDisplay.classList.remove('show');
        void this.ui.comboDisplay.offsetWidth;
        this.ui.comboDisplay.classList.add('show');
        this.comboTimer = 35;
    }

    updateUI() {
        if (!this.playerCat || !this.enemyCat) return;
        this.ui.player1Name.textContent = this.playerCat.character.name;
        this.ui.player2Name.textContent = this.enemyCat.character.name;
        const playerHealthPercent = (this.playerCat.health / this.playerCat.maxHealth) * 100;
        const enemyHealthPercent = (this.enemyCat.health / this.enemyCat.maxHealth) * 100;
        this.ui.player1Health.style.width = `${playerHealthPercent}%`;
        this.ui.player2Health.style.width = `${enemyHealthPercent}%`;
    }

    render() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        drawBackground(this.ctx);
        if (this.playerCat) drawCuteCat(this.ctx, this.playerCat);
        if (this.enemyCat) drawCuteCat(this.ctx, this.enemyCat);
        drawParticles(this.ctx);
    }

    saveState() {
        if (!this.playerCat || !this.enemyCat) return;
        const state = {
            player: this.playerCat.getState(),
            enemy: this.enemyCat.getState()
        };
        Storage.save(state);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const uiElements = {
        startScreen: document.getElementById('startScreen'),
        characterScreen: document.getElementById('characterScreen'),
        gameScreen: document.getElementById('gameScreen'),
        pauseMenu: document.getElementById('pauseMenu'),
        resultScreen: document.getElementById('resultScreen'),
        controlsHint: document.getElementById('controlsHint'),
        startBtn: document.getElementById('startBtn'),
        characterBtn: document.getElementById('characterBtn'),
        confirmCharacter: document.getElementById('confirmCharacter'),
        backToStart: document.getElementById('backToStart'),
        pauseBtn: document.getElementById('pauseBtn'),
        resumeBtn: document.getElementById('resumeBtn'),
        restartBtn: document.getElementById('restartBtn'),
        exitBtn: document.getElementById('exitBtn'),
        playAgainBtn: document.getElementById('playAgainBtn'),
        backToMenuBtn: document.getElementById('backToMenuBtn'),
        characterList: document.getElementById('characterList'),
        player1Name: document.getElementById('player1Name'),
        player2Name: document.getElementById('player2Name'),
        player1Health: document.getElementById('player1Health'),
        player2Health: document.getElementById('player2Health'),
        comboDisplay: document.getElementById('comboDisplay'),
        resultTitle: document.getElementById('resultTitle'),
        resultMessage: document.getElementById('resultMessage')
    };
    const game = new Game(canvas, uiElements);
});
