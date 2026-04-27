const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAMEOVER: 'gameover'
};

const STORAGE_KEY = 'happy_runner_save';

let game = {
    state: GameState.MENU,
    score: 0,
    highScore: 0,
    distance: 0,
    speed: 5,
    maxSpeed: 12,
    lastTime: 0,
    deltaTime: 0
};

const GROUND_HEIGHT_RATIO = 0.2;

function getGroundY() {
    return canvas.height * (1 - GROUND_HEIGHT_RATIO);
}

const player = {
    x: 100,
    y: 0,
    width: 75,
    height: 85,
    velocityY: 0,
    isJumping: false,
    jumpCount: 0,
    maxJumps: 2,
    jumpForce: -13,
    gravity: 0.65,
    isHoldingJump: false,
    holdTime: 0,
    maxHoldTime: 10,
    animationFrame: 0,
    animationTimer: 0,
    maxJumpHeight: -320,
    blinkTimer: 0,
    isBlinking: false,
    expressionTimer: 0,
    currentExpression: 'happy'
};

const clouds = [];
const mountains = [];
const trees = [];

function initBackground() {
    clouds.length = 0;
    for (let i = 0; i < 6; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: 30 + Math.random() * (canvas.height * 0.3),
            width: 100 + Math.random() * 80,
            speed: 0.3 + Math.random() * 0.3,
            opacity: 0.7 + Math.random() * 0.3
        });
    }
    
    mountains.length = 0;
    for (let i = 0; i < 5; i++) {
        mountains.push({
            x: i * (canvas.width / 3),
            width: 250 + Math.random() * 100,
            height: 120 + Math.random() * 80,
            color: `hsl(${200 + Math.random() * 20}, ${30 + Math.random() * 20}%, ${50 + Math.random() * 10}%)`
        });
    }
    
    trees.length = 0;
    for (let i = 0; i < 8; i++) {
        trees.push({
            x: Math.random() * canvas.width * 2,
            width: 40 + Math.random() * 30,
            height: 80 + Math.random() * 60,
            speed: 0.8 + Math.random() * 0.5
        });
    }
}

const obstacles = [];
const obstacleTypes = [
    { type: 'cactus', width: 45, height: 70, color: '#2d5016' },
    { type: 'rock', width: 55, height: 45, color: '#6b6b6b' },
    { type: 'pit', width: 70, height: 35, color: '#1a1a1a' }
];

let obstacleSpawnTimer = 0;
const minSpawnInterval = 90;
const maxSpawnInterval = 160;

const particles = [];

class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.life = 1;
        this.maxLife = 1;
        
        if (type === 'dust') {
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = -Math.random() * 3 - 1;
            this.size = 4 + Math.random() * 5;
            this.maxSize = this.size;
            this.decay = 0.03 + Math.random() * 0.02;
            this.color = `rgba(139, 119, 101, ${this.life})`;
            this.gravity = 0.05;
        } else if (type === 'explosion') {
            const angle = Math.random() * Math.PI * 2;
            const speed = 4 + Math.random() * 6;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.size = 5 + Math.random() * 8;
            this.maxSize = this.size;
            this.decay = 0.02 + Math.random() * 0.02;
            this.gravity = 0.15;
            const colors = ['#ff6b6b', '#ffa502', '#ff4757', '#ff6348', '#ffd93d', '#ff9f43'];
            this.baseColor = colors[Math.floor(Math.random() * colors.length)];
        } else if (type === 'spark') {
            const angle = Math.random() * Math.PI * 2;
            const speed = 6 + Math.random() * 8;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.size = 2 + Math.random() * 4;
            this.decay = 0.04 + Math.random() * 0.03;
            this.gravity = 0.1;
            this.baseColor = '#ffd700';
        }
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.type === 'explosion' || this.type === 'spark') {
            this.vy += this.gravity;
        }
        
        if (this.type === 'dust') {
            this.vy += this.gravity;
            this.size = this.maxSize * (0.3 + 0.7 * this.life);
        }
        
        this.life -= this.decay;
        
        if (this.type === 'dust') {
            this.color = `rgba(139, 119, 101, ${this.life})`;
        }
    }
    
    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        
        if (this.type === 'dust') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'explosion') {
            const currentSize = this.size * this.life;
            
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, currentSize
            );
            gradient.addColorStop(0, this.baseColor);
            gradient.addColorStop(1, 'rgba(255, 100, 100, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'spark') {
            ctx.fillStyle = this.baseColor;
            ctx.shadowColor = this.baseColor;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        ctx.restore();
    }
    
    isDead() {
        return this.life <= 0;
    }
}

function createDustParticles() {
    for (let i = 0; i < 12; i++) {
        particles.push(new Particle(
            player.x + player.width / 2 + (Math.random() - 0.5) * 20,
            getGroundY() - 5,
            'dust'
        ));
    }
}

function createExplosionParticles(x, y) {
    for (let i = 0; i < 25; i++) {
        particles.push(new Particle(x, y, 'explosion'));
    }
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, 'spark'));
    }
}

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#4facfe');
    gradient.addColorStop(0.4, '#00f2fe');
    gradient.addColorStop(0.7, '#a8e6cf');
    gradient.addColorStop(1, '#ffd93d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const sunX = canvas.width - 120;
    const sunY = 100;
    const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 80);
    sunGradient.addColorStop(0, '#fff9c4');
    sunGradient.addColorStop(0.5, '#ffd54f');
    sunGradient.addColorStop(1, 'rgba(255, 213, 79, 0)');
    ctx.fillStyle = sunGradient;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 80, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 35, 0, Math.PI * 2);
    ctx.fill();
}

function drawMountains() {
    const groundY = getGroundY();
    
    mountains.forEach((m, index) => {
        const offset = (game.distance * 0.3 + m.x) % (canvas.width * 1.5);
        const x = offset - m.width;
        
        const gradient = ctx.createLinearGradient(x, groundY - m.height, x, groundY);
        gradient.addColorStop(0, m.color);
        gradient.addColorStop(1, `hsl(${180 + index * 10}, 40%, 35%)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x + m.width * 0.5, groundY - m.height);
        ctx.lineTo(x + m.width, groundY);
        ctx.closePath();
        ctx.fill();
    });
}

function drawClouds() {
    clouds.forEach(cloud => {
        drawCloud(cloud.x, cloud.y, cloud.width, cloud.opacity);
    });
}

function drawCloud(x, y, width, opacity) {
    ctx.save();
    ctx.globalAlpha = opacity;
    
    const gradient = ctx.createRadialGradient(
        x + width * 0.3, y, 0,
        x + width * 0.3, y, width * 0.4
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
    
    ctx.fillStyle = gradient;
    
    ctx.beginPath();
    ctx.arc(x, y, width * 0.25, 0, Math.PI * 2);
    ctx.arc(x + width * 0.25, y - width * 0.12, width * 0.32, 0, Math.PI * 2);
    ctx.arc(x + width * 0.5, y - width * 0.05, width * 0.28, 0, Math.PI * 2);
    ctx.arc(x + width * 0.7, y, width * 0.22, 0, Math.PI * 2);
    ctx.arc(x + width * 0.35, y + width * 0.08, width * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawTrees() {
    const groundY = getGroundY();
    
    trees.forEach(tree => {
        const x = (tree.x - game.distance * tree.speed) % (canvas.width * 2 + tree.width);
        
        ctx.fillStyle = '#5d4e37';
        ctx.fillRect(x + tree.width * 0.35, groundY - tree.height * 0.6, tree.width * 0.3, tree.height * 0.6);
        
        const leafGradient = ctx.createRadialGradient(
            x + tree.width * 0.5, groundY - tree.height * 0.7, 0,
            x + tree.width * 0.5, groundY - tree.height * 0.7, tree.width * 0.6
        );
        leafGradient.addColorStop(0, '#4caf50');
        leafGradient.addColorStop(1, '#2e7d32');
        
        ctx.fillStyle = leafGradient;
        ctx.beginPath();
        ctx.moveTo(x + tree.width * 0.1, groundY - tree.height * 0.55);
        ctx.lineTo(x + tree.width * 0.5, groundY - tree.height);
        ctx.lineTo(x + tree.width * 0.9, groundY - tree.height * 0.55);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(x + tree.width * 0.2, groundY - tree.height * 0.4);
        ctx.lineTo(x + tree.width * 0.5, groundY - tree.height * 0.75);
        ctx.lineTo(x + tree.width * 0.8, groundY - tree.height * 0.4);
        ctx.closePath();
        ctx.fill();
    });
}

function updateClouds() {
    const speedMultiplier = game.state === GameState.PLAYING ? game.speed * 0.15 : 0.5;
    
    clouds.forEach(cloud => {
        cloud.x -= cloud.speed * speedMultiplier;
        
        if (cloud.x + cloud.width < 0) {
            cloud.x = canvas.width + Math.random() * 150;
            cloud.y = 30 + Math.random() * (canvas.height * 0.3);
            cloud.width = 100 + Math.random() * 80;
            cloud.opacity = 0.7 + Math.random() * 0.3;
        }
    });
}

function drawGround() {
    const groundY = getGroundY();
    
    const groundGradient = ctx.createLinearGradient(0, groundY, 0, canvas.height);
    groundGradient.addColorStop(0, '#8bc34a');
    groundGradient.addColorStop(0.05, '#7cb342');
    groundGradient.addColorStop(0.15, '#689f38');
    groundGradient.addColorStop(0.4, '#558b2f');
    groundGradient.addColorStop(1, '#33691e');
    
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
    
    ctx.strokeStyle = '#7cb342';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(104, 159, 56, 0.5)';
    const stripeWidth = 40;
    const stripeOffset = (game.distance * 2) % (stripeWidth * 2);
    
    for (let x = -stripeOffset; x < canvas.width; x += stripeWidth * 2) {
        ctx.fillRect(x, groundY + 5, stripeWidth, canvas.height - groundY - 5);
    }
    
    ctx.fillStyle = '#558b2f';
    for (let x = -stripeOffset; x < canvas.width; x += 25) {
        const grassHeight = 5 + Math.sin(x * 0.1 + game.distance * 0.1) * 3;
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x + 3, groundY - grassHeight);
        ctx.lineTo(x + 6, groundY);
        ctx.fill();
    }
}

function drawPlayer() {
    const groundY = getGroundY();
    const playerY = player.y + groundY - player.height;
    
    ctx.save();
    ctx.translate(player.x + player.width / 2, playerY + player.height / 2);
    
    if (game.state === GameState.PLAYING) {
        player.animationTimer++;
        player.blinkTimer++;
        
        if (player.animationTimer > 2) {
            player.animationTimer = 0;
            player.animationFrame = (player.animationFrame + 1) % 10;
        }
        
        if (player.blinkTimer > 250) {
            player.isBlinking = true;
            if (player.blinkTimer > 265) {
                player.isBlinking = false;
                player.blinkTimer = 0;
            }
        }
    }
    
    let legOffset = 0;
    let bodyBob = 0;
    let earWiggle = 0;
    let armSwing = 0;
    let tailWag = 0;
    let headTilt = 0;
    
    if (!player.isJumping && game.state === GameState.PLAYING) {
        const phase = player.animationFrame * Math.PI / 5;
        legOffset = Math.sin(phase) * 12;
        bodyBob = Math.abs(Math.sin(phase)) * 5;
        earWiggle = Math.sin(phase * 2) * 0.12;
        armSwing = Math.sin(phase) * 0.25;
        tailWag = Math.sin(phase * 2.5) * 0.35;
        headTilt = Math.sin(phase) * 0.05;
    }
    
    if (player.isJumping) {
        headTilt = player.velocityY > 0 ? 0.1 : -0.1;
    }
    
    ctx.translate(0, -bodyBob);
    ctx.rotate(headTilt);
    
    const bodyColor = '#FFB6C1';
    const bodyColorLight = '#FFE4E9';
    const bodyColorDark = '#FF69B4';
    const faceWhite = '#FFF5F7';
    const eyeColor = '#E91E63';
    const eyeColorDark = '#880E4F';
    
    ctx.save();
    ctx.rotate(-0.25 + tailWag);
    
    const tailOuter = ctx.createRadialGradient(-28, 8, 0, -28, 8, 20);
    tailOuter.addColorStop(0, bodyColorLight);
    tailOuter.addColorStop(0.5, bodyColor);
    tailOuter.addColorStop(1, bodyColorDark);
    ctx.fillStyle = tailOuter;
    ctx.beginPath();
    ctx.arc(-28, 8, 16, 0, Math.PI * 2);
    ctx.fill();
    
    const tailInner = ctx.createRadialGradient(-32, 5, 0, -32, 5, 10);
    tailInner.addColorStop(0, '#FFF');
    tailInner.addColorStop(1, bodyColorLight);
    ctx.fillStyle = tailInner;
    ctx.beginPath();
    ctx.arc(-32, 5, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    ctx.save();
    ctx.rotate(-0.35 + earWiggle);
    
    const leftEarBase = ctx.createRadialGradient(-18, -42, 0, -18, -42, 35);
    leftEarBase.addColorStop(0, bodyColorLight);
    leftEarBase.addColorStop(0.6, bodyColor);
    leftEarBase.addColorStop(1, bodyColorDark);
    ctx.fillStyle = leftEarBase;
    ctx.beginPath();
    ctx.ellipse(-18, -42, 12, 32, -0.15, 0, Math.PI * 2);
    ctx.fill();
    
    const leftEarPink = ctx.createRadialGradient(-18, -45, 0, -18, -45, 20);
    leftEarPink.addColorStop(0, '#FF85A2');
    leftEarPink.addColorStop(1, '#FF4081');
    ctx.fillStyle = leftEarPink;
    ctx.beginPath();
    ctx.ellipse(-18, -45, 6, 20, -0.15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(255, 64, 129, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
        const yBase = -50 + i * 8;
        ctx.beginPath();
        ctx.moveTo(-22, yBase);
        ctx.quadraticCurveTo(-28, yBase - 3, -30, yBase - 5);
        ctx.stroke();
    }
    ctx.restore();
    
    ctx.save();
    ctx.rotate(0.35 - earWiggle);
    
    const rightEarBase = ctx.createRadialGradient(18, -42, 0, 18, -42, 35);
    rightEarBase.addColorStop(0, bodyColorLight);
    rightEarBase.addColorStop(0.6, bodyColor);
    rightEarBase.addColorStop(1, bodyColorDark);
    ctx.fillStyle = rightEarBase;
    ctx.beginPath();
    ctx.ellipse(18, -42, 12, 32, 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    const rightEarPink = ctx.createRadialGradient(18, -45, 0, 18, -45, 20);
    rightEarPink.addColorStop(0, '#FF85A2');
    rightEarPink.addColorStop(1, '#FF4081');
    ctx.fillStyle = rightEarPink;
    ctx.beginPath();
    ctx.ellipse(18, -45, 6, 20, 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    for (let i = 0; i < 4; i++) {
        const yBase = -50 + i * 8;
        ctx.beginPath();
        ctx.moveTo(22, yBase);
        ctx.quadraticCurveTo(28, yBase - 3, 30, yBase - 5);
        ctx.stroke();
    }
    ctx.restore();
    
    ctx.save();
    ctx.rotate(-0.35 + armSwing);
    
    const leftArmGrad = ctx.createRadialGradient(-25, 5, 0, -25, 5, 18);
    leftArmGrad.addColorStop(0, bodyColorLight);
    leftArmGrad.addColorStop(0.7, bodyColor);
    leftArmGrad.addColorStop(1, bodyColorDark);
    ctx.fillStyle = leftArmGrad;
    ctx.beginPath();
    ctx.ellipse(-25, 5, 8, 15, -0.25, 0, Math.PI * 2);
    ctx.fill();
    
    const leftPawGrad = ctx.createRadialGradient(-28, 18, 0, -28, 18, 10);
    leftPawGrad.addColorStop(0, '#FFF');
    leftPawGrad.addColorStop(1, '#FFE4E9');
    ctx.fillStyle = leftPawGrad;
    ctx.beginPath();
    ctx.ellipse(-28, 18, 8, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    ctx.save();
    ctx.rotate(0.35 - armSwing);
    ctx.fillStyle = leftArmGrad;
    ctx.beginPath();
    ctx.ellipse(25, 5, 8, 15, 0.25, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = leftPawGrad;
    ctx.beginPath();
    ctx.ellipse(28, 18, 8, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    const leftLegGrad = ctx.createRadialGradient(-12, 28, 0, -12, 28, 15);
    leftLegGrad.addColorStop(0, bodyColorLight);
    leftLegGrad.addColorStop(0.6, bodyColor);
    leftLegGrad.addColorStop(1, bodyColorDark);
    ctx.fillStyle = leftLegGrad;
    ctx.beginPath();
    ctx.ellipse(-12, 28 + legOffset * 0.35, 10, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.ellipse(12, 28 - legOffset * 0.35, 10, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const footGrad = ctx.createRadialGradient(-12, 40, 0, -12, 40, 15);
    footGrad.addColorStop(0, '#FFF');
    footGrad.addColorStop(1, '#FFE4E9');
    
    ctx.fillStyle = footGrad;
    ctx.beginPath();
    ctx.ellipse(-12, 40 + legOffset * 0.35, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.ellipse(12, 40 - legOffset * 0.35, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFB6C1';
    for (let side = -1; side <= 1; side += 2) {
        const baseX = 12 * side;
        const offset = side === -1 ? legOffset * 0.35 : -legOffset * 0.35;
        
        ctx.beginPath();
        ctx.ellipse(baseX - 5, 37 + offset, 2.5, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(baseX, 36 + offset, 2.5, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(baseX + 5, 37 + offset, 2.5, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(baseX, 39 + offset, 3.5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    const bodyMainGrad = ctx.createRadialGradient(-5, -2, 0, 0, 2, 40);
    bodyMainGrad.addColorStop(0, bodyColorLight);
    bodyMainGrad.addColorStop(0.5, bodyColor);
    bodyMainGrad.addColorStop(1, bodyColorDark);
    ctx.fillStyle = bodyMainGrad;
    ctx.beginPath();
    ctx.ellipse(0, 2, 30, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const bellyGrad = ctx.createRadialGradient(0, 8, 0, 0, 8, 25);
    bellyGrad.addColorStop(0, '#FFF');
    bellyGrad.addColorStop(0.7, faceWhite);
    bellyGrad.addColorStop(1, '#FFE4E9');
    ctx.fillStyle = bellyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 8, 20, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const headMainGrad = ctx.createRadialGradient(-10, -45, 0, 0, -38, 45);
    headMainGrad.addColorStop(0, bodyColorLight);
    headMainGrad.addColorStop(0.4, bodyColor);
    headMainGrad.addColorStop(1, bodyColorDark);
    ctx.fillStyle = headMainGrad;
    ctx.beginPath();
    ctx.ellipse(0, -38, 42, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.ellipse(-15, -55, 15, 10, -0.3, 0, Math.PI * 2);
    ctx.fill();
    
    const faceAreaGrad = ctx.createRadialGradient(0, -32, 0, 0, -32, 35);
    faceAreaGrad.addColorStop(0, '#FFF');
    faceAreaGrad.addColorStop(0.5, faceWhite);
    faceAreaGrad.addColorStop(1, '#FFE4E9');
    ctx.fillStyle = faceAreaGrad;
    ctx.beginPath();
    ctx.ellipse(0, -32, 34, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const blushGrad1 = ctx.createRadialGradient(-25, -26, 0, -25, -26, 14);
    blushGrad1.addColorStop(0, 'rgba(255, 64, 129, 0.5)');
    blushGrad1.addColorStop(1, 'rgba(255, 64, 129, 0)');
    ctx.fillStyle = blushGrad1;
    ctx.beginPath();
    ctx.ellipse(-25, -26, 12, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const blushGrad2 = ctx.createRadialGradient(25, -26, 0, 25, -26, 14);
    blushGrad2.addColorStop(0, 'rgba(255, 64, 129, 0.5)');
    blushGrad2.addColorStop(1, 'rgba(255, 64, 129, 0)');
    ctx.fillStyle = blushGrad2;
    ctx.beginPath();
    ctx.ellipse(25, -26, 12, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const eyeWhiteGrad1 = ctx.createRadialGradient(-14, -40, 0, -14, -40, 15);
    eyeWhiteGrad1.addColorStop(0, '#FFF');
    eyeWhiteGrad1.addColorStop(0.8, '#FFF');
    eyeWhiteGrad1.addColorStop(1, '#FCE4EC');
    ctx.fillStyle = eyeWhiteGrad1;
    ctx.beginPath();
    ctx.ellipse(-14, -40, 13, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const eyeWhiteGrad2 = ctx.createRadialGradient(14, -40, 0, 14, -40, 15);
    eyeWhiteGrad2.addColorStop(0, '#FFF');
    eyeWhiteGrad2.addColorStop(0.8, '#FFF');
    eyeWhiteGrad2.addColorStop(1, '#FCE4EC');
    ctx.fillStyle = eyeWhiteGrad2;
    ctx.beginPath();
    ctx.ellipse(14, -40, 13, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    
    if (!player.isBlinking) {
        const irisGrad1 = ctx.createRadialGradient(-14, -39, 0, -14, -39, 9);
        irisGrad1.addColorStop(0, '#F06292');
        irisGrad1.addColorStop(0.5, eyeColor);
        irisGrad1.addColorStop(1, eyeColorDark);
        ctx.fillStyle = irisGrad1;
        ctx.beginPath();
        ctx.ellipse(-14, -39, 9, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const irisGrad2 = ctx.createRadialGradient(14, -39, 0, 14, -39, 9);
        irisGrad2.addColorStop(0, '#F06292');
        irisGrad2.addColorStop(0.5, eyeColor);
        irisGrad2.addColorStop(1, eyeColorDark);
        ctx.fillStyle = irisGrad2;
        ctx.beginPath();
        ctx.ellipse(14, -39, 9, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(-14, -39, 5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(14, -39, 5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.ellipse(-11, -43, 3.5, 3, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-17, -41, 2, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(17, -43, 3.5, 3, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(11, -41, 2, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.strokeStyle = '#C2185B';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-24, -40);
        ctx.quadraticCurveTo(-14, -36, -4, -40);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(4, -40);
        ctx.quadraticCurveTo(14, -36, 24, -40);
        ctx.stroke();
    }
    
    ctx.strokeStyle = '#FF4081';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-26, -52);
    ctx.quadraticCurveTo(-14, -58, -12, -50);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(26, -52);
    ctx.quadraticCurveTo(14, -58, 12, -50);
    ctx.stroke();
    
    const noseGrad = ctx.createRadialGradient(0, -28, 0, 0, -28, 8);
    noseGrad.addColorStop(0, '#FF4081');
    noseGrad.addColorStop(1, '#C2185B');
    ctx.fillStyle = noseGrad;
    ctx.beginPath();
    ctx.moveTo(0, -31);
    ctx.quadraticCurveTo(-6, -28, -5, -25);
    ctx.quadraticCurveTo(0, -22, 5, -25);
    ctx.quadraticCurveTo(6, -28, 0, -31);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(-2, -29, 2.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#880E4F';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.quadraticCurveTo(-8, -18, -9, -14);
    ctx.quadraticCurveTo(-8, -9, 0, -6);
    ctx.quadraticCurveTo(8, -9, 9, -14);
    ctx.quadraticCurveTo(8, -18, 0, -22);
    ctx.stroke();
    
    ctx.strokeStyle = 'rgba(255, 64, 129, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-5, -14);
    ctx.quadraticCurveTo(0, -12, 5, -14);
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(255, 64, 129, 0.3)';
    for (let i = 0; i < 3; i++) {
        const heartX = -22 + i * 22;
        const heartY = -62 + Math.sin(i * 1.2) * 3;
        
        ctx.beginPath();
        ctx.moveTo(heartX, heartY - 2);
        ctx.bezierCurveTo(
            heartX, heartY - 5,
            heartX - 4, heartY - 5,
            heartX - 4, heartY - 2
        );
        ctx.bezierCurveTo(
            heartX - 4, heartY + 1,
            heartX, heartY + 5,
            heartX, heartY + 5
        );
        ctx.bezierCurveTo(
            heartX, heartY + 5,
            heartX + 4, heartY + 1,
            heartX + 4, heartY - 2
        );
        ctx.bezierCurveTo(
            heartX + 4, heartY - 5,
            heartX, heartY - 5,
            heartX, heartY - 2
        );
        ctx.fill();
    }
    
    ctx.save();
    ctx.translate(-5, -65);
    ctx.rotate(-0.2);
    
    const ribbonGrad = ctx.createLinearGradient(-15, 0, 15, 0);
    ribbonGrad.addColorStop(0, '#FF1744');
    ribbonGrad.addColorStop(0.5, '#FF5252');
    ribbonGrad.addColorStop(1, '#FF1744');
    ctx.fillStyle = ribbonGrad;
    
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.quadraticCurveTo(-12, -8, -20, 0);
    ctx.quadraticCurveTo(-12, 8, 0, 5);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.quadraticCurveTo(12, -8, 20, 0);
    ctx.quadraticCurveTo(12, 8, 0, 5);
    ctx.fill();
    
    const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 8);
    centerGrad.addColorStop(0, '#FF8A80');
    centerGrad.addColorStop(1, '#FF1744');
    ctx.fillStyle = centerGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.ellipse(-2, -2, 2, 1.5, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    ctx.restore();
}

function updatePlayer() {
    if (player.isJumping) {
        player.velocityY += player.gravity;
        player.y += player.velocityY;
        
        if (player.isHoldingJump && player.holdTime < player.maxHoldTime && player.velocityY < 0) {
            player.holdTime++;
            player.velocityY -= 0.25;
        }
        
        if (player.y < player.maxJumpHeight) {
            player.y = player.maxJumpHeight;
            player.velocityY = Math.max(player.velocityY, 0);
        }
        
        if (player.y >= 0) {
            player.y = 0;
            player.velocityY = 0;
            player.isJumping = false;
            player.jumpCount = 0;
            createDustParticles();
        }
    }
}

function jump() {
    if (game.state !== GameState.PLAYING) return;
    
    if (player.jumpCount < player.maxJumps) {
        if (player.jumpCount === 0) {
            player.velocityY = player.jumpForce;
        } else {
            player.velocityY = player.jumpForce * 0.85;
        }
        player.isJumping = true;
        player.isHoldingJump = true;
        player.holdTime = 0;
        player.jumpCount++;
        
        createDustParticles();
    }
}

function releaseJump() {
    player.isHoldingJump = false;
}

function drawObstacles() {
    const groundY = getGroundY();
    
    obstacles.forEach(obs => {
        const type = obstacleTypes.find(t => t.type === obs.type);
        
        if (obs.type === 'cactus') {
            drawCactus(obs.x, groundY - type.height, type.width, type.height);
        } else if (obs.type === 'rock') {
            drawRock(obs.x, groundY - type.height, type.width, type.height);
        } else if (obs.type === 'pit') {
            drawPit(obs.x, groundY, type.width, type.height);
        }
    });
}

function drawCactus(x, y, width, height) {
    const mainStemWidth = width * 0.35;
    const mainStemX = x + (width - mainStemWidth) / 2;
    
    const stemGradient = ctx.createLinearGradient(mainStemX, y, mainStemX + mainStemWidth, y);
    stemGradient.addColorStop(0, '#1b5e20');
    stemGradient.addColorStop(0.3, '#2e7d32');
    stemGradient.addColorStop(0.7, '#388e3c');
    stemGradient.addColorStop(1, '#1b5e20');
    
    ctx.fillStyle = stemGradient;
    ctx.beginPath();
    ctx.roundRect(mainStemX, y, mainStemWidth, height, 8);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.roundRect(mainStemX + 3, y + 3, mainStemWidth * 0.3, height - 6, 5);
    ctx.fill();
    
    const leftArmY = y + height * 0.25;
    const leftArmWidth = width * 0.35;
    const leftArmHeight = height * 0.35;
    
    ctx.fillStyle = stemGradient;
    ctx.beginPath();
    ctx.roundRect(x, leftArmY + leftArmHeight * 0.5, leftArmWidth, leftArmHeight * 0.25, 5);
    ctx.fill();
    
    ctx.beginPath();
    ctx.roundRect(x, leftArmY, leftArmWidth * 0.35, leftArmHeight * 0.6, 5);
    ctx.fill();
    
    const rightArmY = y + height * 0.45;
    const rightArmWidth = width * 0.35;
    const rightArmHeight = height * 0.3;
    
    ctx.beginPath();
    ctx.roundRect(x + width - rightArmWidth, rightArmY + rightArmHeight * 0.5, rightArmWidth, rightArmHeight * 0.25, 5);
    ctx.fill();
    
    ctx.beginPath();
    ctx.roundRect(x + width - rightArmWidth * 0.35, rightArmY, rightArmWidth * 0.35, rightArmHeight * 0.6, 5);
    ctx.fill();
    
    ctx.fillStyle = '#0d3318';
    const spineLength = 6;
    
    for (let i = 0; i < 6; i++) {
        const spineY = y + 10 + i * (height - 20) / 6;
        
        ctx.beginPath();
        ctx.moveTo(mainStemX - 2, spineY);
        ctx.lineTo(mainStemX - 2 - spineLength, spineY - 3);
        ctx.lineTo(mainStemX - 2 - spineLength, spineY + 3);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(mainStemX + mainStemWidth + 2, spineY);
        ctx.lineTo(mainStemX + mainStemWidth + 2 + spineLength, spineY - 3);
        ctx.lineTo(mainStemX + mainStemWidth + 2 + spineLength, spineY + 3);
        ctx.closePath();
        ctx.fill();
    }
}

function drawRock(x, y, width, height) {
    const rockGradient = ctx.createLinearGradient(x, y, x + width, y + height);
    rockGradient.addColorStop(0, '#9e9e9e');
    rockGradient.addColorStop(0.3, '#757575');
    rockGradient.addColorStop(0.7, '#616161');
    rockGradient.addColorStop(1, '#424242');
    
    ctx.fillStyle = rockGradient;
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.quadraticCurveTo(x + width * 0.1, y + height * 0.4, x + width * 0.3, y + height * 0.15);
    ctx.quadraticCurveTo(x + width * 0.5, y, x + width * 0.7, y + height * 0.1);
    ctx.quadraticCurveTo(x + width * 0.9, y + height * 0.3, x + width, y + height);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(x + width * 0.35, y + height * 0.25);
    ctx.quadraticCurveTo(x + width * 0.5, y + height * 0.1, x + width * 0.65, y + height * 0.3);
    ctx.quadraticCurveTo(x + width * 0.5, y + height * 0.2, x + width * 0.35, y + height * 0.25);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.moveTo(x + width * 0.1, y + height);
    ctx.lineTo(x + width * 0.3, y + height * 0.5);
    ctx.lineTo(x + width * 0.5, y + height);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#bdbdbd';
    ctx.beginPath();
    ctx.arc(x + width * 0.35, y + height * 0.45, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + width * 0.6, y + height * 0.55, 3, 0, Math.PI * 2);
    ctx.fill();
}

function drawPit(x, y, width, height) {
    const depth = height * 1.5;
    
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(x, y, width, 5);
    
    const pitGradient = ctx.createLinearGradient(x, y, x, y + depth);
    pitGradient.addColorStop(0, 'rgba(30, 30, 30, 0.9)');
    pitGradient.addColorStop(0.5, 'rgba(15, 15, 15, 0.95)');
    pitGradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
    
    ctx.fillStyle = pitGradient;
    ctx.beginPath();
    ctx.moveTo(x + 3, y);
    ctx.lineTo(x + width * 0.15, y + depth);
    ctx.lineTo(x + width * 0.85, y + depth);
    ctx.lineTo(x + width - 3, y);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x + 3, y);
    ctx.lineTo(x + width * 0.15, y + depth * 0.3);
    ctx.lineTo(x - 5, y + depth * 0.1);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.moveTo(x + width + 10, y);
    ctx.lineTo(x + width - 3, y);
    ctx.lineTo(x + width * 0.85, y + depth * 0.3);
    ctx.lineTo(x + width + 5, y + depth * 0.1);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    const warningWidth = 10;
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(x + 5 + i * (width - 20) / 3, y - 8, warningWidth, 5);
    }
}

function spawnObstacle() {
    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    
    obstacles.push({
        x: canvas.width + 50,
        type: type.type,
        width: type.width,
        height: type.height,
        passed: false
    });
}

function updateObstacles() {
    obstacles.forEach(obs => {
        obs.x -= game.speed;
    });
    
    obstacles.forEach(obs => {
        if (!obs.passed && obs.x + obs.width < player.x) {
            obs.passed = true;
            game.score += 10;
            updateScoreDisplay();
        }
    });
    
    obstacles.splice(0, obstacles.findIndex(obs => obs.x + obs.width > 0));
    
    obstacleSpawnTimer++;
    const spawnInterval = Math.max(minSpawnInterval, maxSpawnInterval - game.speed * 5);
    
    if (obstacleSpawnTimer >= spawnInterval) {
        obstacleSpawnTimer = 0;
        spawnObstacle();
    }
}

function checkCollision() {
    const groundY = getGroundY();
    const playerRect = {
        x: player.x + 12,
        y: player.y + groundY - player.height + 15,
        width: player.width - 24,
        height: player.height - 20
    };
    
    for (const obs of obstacles) {
        const type = obstacleTypes.find(t => t.type === obs.type);
        let obsRect;
        
        if (obs.type === 'pit') {
            const playerBottomY = player.y + groundY;
            if (playerBottomY >= groundY - 20) {
                obsRect = {
                    x: obs.x + 8,
                    y: groundY - 15,
                    width: obs.width - 16,
                    height: type.height + 20
                };
            } else {
                continue;
            }
        } else {
            obsRect = {
                x: obs.x + 8,
                y: groundY - type.height + 8,
                width: obs.width - 16,
                height: type.height - 10
            };
        }
        
        if (rectsIntersect(playerRect, obsRect)) {
            return true;
        }
    }
    
    return false;
}

function rectsIntersect(r1, r2) {
    return r1.x < r2.x + r2.width &&
           r1.x + r1.width > r2.x &&
           r1.y < r2.y + r2.height &&
           r1.y + r1.height > r2.y;
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].isDead()) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(p => p.draw());
}

function updateGameSpeed() {
    if (game.speed < game.maxSpeed) {
        game.speed += 0.001;
    }
}

function updateDistance() {
    game.distance += game.speed * 0.1;
    game.score = Math.floor(game.distance);
    updateScoreDisplay();
}

function updateScoreDisplay() {
    document.getElementById('currentScore').textContent = game.score;
}

function updateHighScoreDisplay() {
    document.getElementById('highScore').textContent = game.highScore;
}

function saveGameState() {
    const state = {
        score: game.score,
        highScore: game.highScore,
        distance: game.distance,
        speed: game.speed,
        state: game.state,
        player: {
            x: player.x,
            y: player.y,
            velocityY: player.velocityY,
            isJumping: player.isJumping,
            jumpCount: player.jumpCount
        },
        obstacles: obstacles.map(obs => ({
            x: obs.x,
            type: obs.type,
            width: obs.width,
            height: obs.height,
            passed: obs.passed
        })),
        clouds: clouds.map(c => ({
            x: c.x,
            y: c.y,
            width: c.width,
            speed: c.speed,
            opacity: c.opacity
        }))
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadGameState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    
    if (saved) {
        try {
            const state = JSON.parse(saved);
            
            game.highScore = state.highScore || 0;
            
            if (state.state === GameState.PLAYING || state.state === GameState.PAUSED) {
                game.score = state.score || 0;
                game.distance = state.distance || 0;
                game.speed = state.speed || 5;
                
                if (state.player) {
                    player.x = state.player.x || 100;
                    player.y = state.player.y || 0;
                    player.velocityY = state.player.velocityY || 0;
                    player.isJumping = state.player.isJumping || false;
                    player.jumpCount = state.player.jumpCount || 0;
                }
                
                if (state.obstacles) {
                    obstacles.length = 0;
                    state.obstacles.forEach(obs => {
                        obstacles.push({
                            x: obs.x,
                            type: obs.type,
                            width: obs.width,
                            height: obs.height,
                            passed: obs.passed
                        });
                    });
                }
                
                if (state.clouds) {
                    clouds.length = 0;
                    state.clouds.forEach(c => {
                        clouds.push({
                            x: c.x,
                            y: c.y,
                            width: c.width,
                            speed: c.speed,
                            opacity: c.opacity
                        });
                    });
                }
                
                updateScoreDisplay();
                updateHighScoreDisplay();
                
                if (state.state === GameState.PAUSED) {
                    return GameState.PAUSED;
                }
                return GameState.PLAYING;
            }
        } catch (e) {
            console.error('Failed to load game state:', e);
        }
    }
    
    return GameState.MENU;
}

function clearGameState() {
    localStorage.removeItem(STORAGE_KEY);
}

function resetGame() {
    game.score = 0;
    game.distance = 0;
    game.speed = 5;
    
    player.y = 0;
    player.velocityY = 0;
    player.isJumping = false;
    player.jumpCount = 0;
    player.isHoldingJump = false;
    player.holdTime = 0;
    
    obstacles.length = 0;
    obstacleSpawnTimer = 0;
    
    particles.length = 0;
    
    initBackground();
    
    updateScoreDisplay();
}

function startGame() {
    const savedState = loadGameState();
    
    if (savedState === GameState.PLAYING) {
        game.state = GameState.PLAYING;
        hideAllOverlays();
        document.getElementById('pauseBtn').style.display = 'block';
    } else if (savedState === GameState.PAUSED) {
        game.state = GameState.PAUSED;
        showPauseScreen();
    } else {
        resetGame();
        game.state = GameState.PLAYING;
        hideAllOverlays();
        document.getElementById('pauseBtn').style.display = 'block';
    }
    
    saveGameState();
}

function pauseGame() {
    if (game.state === GameState.PLAYING) {
        game.state = GameState.PAUSED;
        showPauseScreen();
        saveGameState();
    }
}

function resumeGame() {
    if (game.state === GameState.PAUSED) {
        game.state = GameState.PLAYING;
        hideAllOverlays();
        document.getElementById('pauseBtn').style.display = 'block';
        saveGameState();
    }
}

function gameOver() {
    game.state = GameState.GAMEOVER;
    
    createExplosionParticles(player.x + player.width / 2, getGroundY() - player.height / 2);
    
    if (game.score > game.highScore) {
        game.highScore = game.score;
        document.getElementById('newRecord').style.display = 'block';
    } else {
        document.getElementById('newRecord').style.display = 'none';
    }
    
    document.getElementById('finalScore').textContent = game.score;
    updateHighScoreDisplay();
    
    showGameOverScreen();
    clearGameState();
}

function hideAllOverlays() {
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('pauseScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
}

function showStartScreen() {
    hideAllOverlays();
    document.getElementById('startScreen').style.display = 'flex';
    document.getElementById('pauseBtn').style.display = 'none';
}

function showPauseScreen() {
    hideAllOverlays();
    document.getElementById('pauseScreen').style.display = 'flex';
    document.getElementById('pauseBtn').style.display = 'none';
}

function showGameOverScreen() {
    hideAllOverlays();
    document.getElementById('gameOverScreen').style.display = 'flex';
    document.getElementById('pauseBtn').style.display = 'none';
}

function gameLoop(currentTime) {
    if (!game.lastTime) game.lastTime = currentTime;
    game.deltaTime = (currentTime - game.lastTime) / 16.67;
    game.lastTime = currentTime;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBackground();
    drawMountains();
    drawClouds();
    drawTrees();
    drawGround();
    
    if (game.state === GameState.PLAYING) {
        updatePlayer();
        updateObstacles();
        updateGameSpeed();
        updateDistance();
        updateParticles();
        updateClouds();
        
        if (checkCollision()) {
            gameOver();
        }
        
        if (Math.floor(currentTime / 1000) % 2 === 0) {
            saveGameState();
        }
    }
    
    drawObstacles();
    drawPlayer();
    drawParticles();
    
    requestAnimationFrame(gameLoop);
}

function init() {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
        document.getElementById('startBtn').textContent = '继续游戏';
    }
    
    initBackground();
    loadGameState();
    updateHighScoreDisplay();
    
    document.getElementById('startBtn').addEventListener('click', () => {
        if (document.getElementById('startBtn').textContent === '继续游戏') {
            startGame();
        } else {
            resetGame();
            game.state = GameState.PLAYING;
            hideAllOverlays();
            document.getElementById('pauseBtn').style.display = 'block';
        }
    });
    
    document.getElementById('pauseBtn').addEventListener('click', pauseGame);
    
    document.getElementById('resumeBtn').addEventListener('click', resumeGame);
    
    document.getElementById('restartBtn').addEventListener('click', () => {
        resetGame();
        game.state = GameState.PLAYING;
        hideAllOverlays();
        document.getElementById('pauseBtn').style.display = 'block';
        saveGameState();
    });
    
    document.getElementById('restartFromPauseBtn').addEventListener('click', () => {
        resetGame();
        game.state = GameState.PLAYING;
        hideAllOverlays();
        document.getElementById('pauseBtn').style.display = 'block';
        saveGameState();
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            if (game.state === GameState.PLAYING) {
                if (!player.isHoldingJump) {
                    jump();
                }
            } else if (game.state === GameState.MENU) {
                startGame();
            } else if (game.state === GameState.GAMEOVER) {
                resetGame();
                game.state = GameState.PLAYING;
                hideAllOverlays();
                document.getElementById('pauseBtn').style.display = 'block';
            }
        } else if (e.code === 'Escape') {
            if (game.state === GameState.PLAYING) {
                pauseGame();
            } else if (game.state === GameState.PAUSED) {
                resumeGame();
            }
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            releaseJump();
        }
    });
    
    canvas.addEventListener('mousedown', (e) => {
        if (game.state === GameState.PLAYING) {
            jump();
        }
    });
    
    canvas.addEventListener('mouseup', (e) => {
        releaseJump();
    });
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (game.state === GameState.PLAYING) {
            jump();
        }
    });
    
    canvas.addEventListener('touchend', (e) => {
        releaseJump();
    });
    
    window.addEventListener('beforeunload', () => {
        if (game.state === GameState.PLAYING || game.state === GameState.PAUSED) {
            saveGameState();
        }
    });
    
    requestAnimationFrame(gameLoop);
}

init();
