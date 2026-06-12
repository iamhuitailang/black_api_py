const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;
const GROUND_Y = GAME_HEIGHT - 50;
const GRAVITY = 0.5;
const JUMP_FORCE = -10;
const MAX_JUMP_HOLD = 20;
const INITIAL_SPEED = 4;
const SPEED_INCREMENT = 0.5;
const SPEED_INCREMENT_DISTANCE = 500;

const DOG_COLORS = {
    brown: { body: '#8B4513', ear: '#654321', belly: '#DEB887', unlockDistance: 0 },
    white: { body: '#F5F5F5', ear: '#E0E0E0', belly: '#FFFFFF', unlockDistance: 500 },
    black: { body: '#2a2a2a', ear: '#1a1a1a', belly: '#4a4a4a', unlockDistance: 1500 },
    spotted: { body: '#F5F5F5', ear: '#2a2a2a', belly: '#FFFFFF', spots: true, unlockDistance: 3000 }
};

let gameState = {
    running: false,
    paused: false,
    distance: 0,
    score: 0,
    lives: 3,
    speed: INITIAL_SPEED,
    bestDistance: 0,
    unlockedColors: ['brown'],
    selectedColor: 'brown',
    lastSpeedIncrease: 0,
    gameOver: false
};

let dog = {
    x: 100,
    y: GROUND_Y - 40,
    width: 50,
    height: 40,
    velocityY: 0,
    isJumping: false,
    jumpHoldFrames: 0,
    isHoldingJump: false,
    canDoubleJump: true,
    doubleJumped: false,
    animFrame: 0,
    animTimer: 0,
    squash: 1,
    stretch: 1,
    tailWag: 0,
    isHit: false,
    hitTimer: 0,
    stars: []
};

let obstacles = [];
let collectibles = [];
let clouds = [];
let trees = [];
let particles = [];
let nextObstacleX = GAME_WIDTH + 200;
let frameCount = 0;

let audioContext = null;

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

function playSound(type) {
    if (!audioContext) return;
    
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch(type) {
        case 'jump':
            oscillator.frequency.setValueAtTime(440, now);
            oscillator.frequency.linearRampToValueAtTime(660, now + 0.1);
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            oscillator.type = 'sine';
            oscillator.start(now);
            oscillator.stop(now + 0.1);
            break;
            
        case 'doubleJump':
            oscillator.frequency.setValueAtTime(660, now);
            oscillator.frequency.linearRampToValueAtTime(990, now + 0.08);
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            oscillator.type = 'sine';
            oscillator.start(now);
            oscillator.stop(now + 0.08);
            break;
            
        case 'collect':
            oscillator.frequency.setValueAtTime(600, now);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
            oscillator.type = 'square';
            oscillator.start(now);
            oscillator.stop(now + 0.06);
            break;
            
        case 'goldCollect':
            const osc2 = audioContext.createOscillator();
            const gain2 = audioContext.createGain();
            osc2.connect(gain2);
            gain2.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(880, now);
            osc2.frequency.setValueAtTime(1320, now);
            gainNode.gain.setValueAtTime(0.2, now);
            gain2.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            oscillator.type = 'sine';
            osc2.type = 'sine';
            oscillator.start(now);
            osc2.start(now);
            oscillator.stop(now + 0.15);
            osc2.stop(now + 0.15);
            break;
            
        case 'hit':
            const noise = audioContext.createBufferSource();
            const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.3, audioContext.sampleRate);
            const noiseData = noiseBuffer.getChannelData(0);
            for (let i = 0; i < noiseData.length; i++) {
                noiseData[i] = Math.random() * 2 - 1;
            }
            noise.buffer = noiseBuffer;
            
            const noiseGain = audioContext.createGain();
            noise.connect(noiseGain);
            noiseGain.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(220, now);
            oscillator.frequency.linearRampToValueAtTime(110, now + 0.3);
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            noiseGain.gain.setValueAtTime(0.1, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            oscillator.type = 'sawtooth';
            
            oscillator.start(now);
            noise.start(now);
            oscillator.stop(now + 0.3);
            noise.stop(now + 0.3);
            break;
            
        case 'speedUp':
            oscillator.frequency.setValueAtTime(440, now);
            oscillator.frequency.linearRampToValueAtTime(880, now + 0.2);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            oscillator.type = 'triangle';
            oscillator.start(now);
            oscillator.stop(now + 0.2);
            break;
    }
}

function loadGameData() {
    const saved = localStorage.getItem('dogRunnerSave');
    if (saved) {
        const data = JSON.parse(saved);
        gameState.bestDistance = data.bestDistance || 0;
        gameState.unlockedColors = data.unlockedColors || ['brown'];
        gameState.selectedColor = data.selectedColor || 'brown';
        gameState.gameOver = data.gameOver !== undefined ? data.gameOver : true;
        
        if (data.savedGame && !data.gameOver) {
            gameState.distance = data.savedGame.distance || 0;
            gameState.score = data.savedGame.score || 0;
            gameState.lives = data.savedGame.lives || 3;
            gameState.speed = data.savedGame.speed || INITIAL_SPEED;
            gameState.lastSpeedIncrease = data.savedGame.lastSpeedIncrease || 0;
        }
    }
    updateUI();
    updateColorButtons();
}

function saveGameData() {
    const data = {
        bestDistance: gameState.bestDistance,
        unlockedColors: gameState.unlockedColors,
        selectedColor: gameState.selectedColor,
        gameOver: gameState.gameOver,
        savedGame: {
            distance: gameState.distance,
            score: gameState.score,
            lives: gameState.lives,
            speed: gameState.speed,
            lastSpeedIncrease: gameState.lastSpeedIncrease
        }
    };
    localStorage.setItem('dogRunnerSave', JSON.stringify(data));
}

function updateUI() {
    document.getElementById('distance').textContent = Math.floor(gameState.distance);
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('speed').textContent = gameState.speed.toFixed(1);
    document.getElementById('bestDistance').textContent = gameState.bestDistance;
    
    let hearts = '';
    for (let i = 0; i < gameState.lives; i++) hearts += '❤️';
    for (let i = gameState.lives; i < 3; i++) hearts += '🖤';
    document.getElementById('lives').textContent = hearts;
}

function updateColorButtons() {
    const container = document.getElementById('colorButtons');
    container.innerHTML = '';
    
    Object.entries(DOG_COLORS).forEach(([name, data]) => {
        const btn = document.createElement('div');
        btn.className = `color-btn ${name}`;
        
        const isUnlocked = gameState.unlockedColors.includes(name);
        if (!isUnlocked) {
            btn.classList.add('locked');
            btn.title = `跑${data.unlockDistance}米解锁`;
        }
        
        if (gameState.selectedColor === name && isUnlocked) {
            btn.classList.add('selected');
        }
        
        if (isUnlocked) {
            btn.addEventListener('click', () => {
                gameState.selectedColor = name;
                saveGameData();
                updateColorButtons();
            });
        }
        
        container.appendChild(btn);
    });
}

function initBackground() {
    clouds = [];
    for (let i = 0; i < 5; i++) {
        clouds.push({
            x: Math.random() * GAME_WIDTH,
            y: 30 + Math.random() * 80,
            size: 30 + Math.random() * 40,
            speed: 0.5
        });
    }
    
    trees = [];
    for (let i = 0; i < 8; i++) {
        const size = 40 + Math.random() * 30;
        trees.push({
            x: Math.random() * GAME_WIDTH,
            y: GROUND_Y,
            size: size,
            speed: 1
        });
    }
}

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.6, '#B0E0E6');
    gradient.addColorStop(1, '#90EE90');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    clouds.forEach(cloud => {
        drawCloud(cloud.x, cloud.y, cloud.size);
        cloud.x -= gameState.speed * cloud.speed * 0.3;
        if (cloud.x < -cloud.size) {
            cloud.x = GAME_WIDTH + cloud.size;
            cloud.y = 30 + Math.random() * 80;
        }
    });
    
    trees.forEach(tree => {
        drawTree(tree.x, tree.y, tree.size);
        tree.x -= gameState.speed * tree.speed * 0.5;
        if (tree.x < -tree.size) {
            tree.x = GAME_WIDTH + tree.size + Math.random() * 100;
            tree.size = 40 + Math.random() * 30;
        }
    });
}

function drawCloud(x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y, size * 0.45, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y + size * 0.1, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
}

function drawTree(x, y, size) {
    const trunkHeight = size * 0.5;
    const trunkWidth = size * 0.15;
    const trunkX = x + size * 0.4;
    
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(trunkX, y - trunkHeight, trunkWidth, trunkHeight);
    
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.moveTo(x, y - trunkHeight + size * 0.15);
    ctx.lineTo(x + size * 0.5, y - trunkHeight - size * 0.25);
    ctx.lineTo(x + size, y - trunkHeight + size * 0.15);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#2E8B57';
    ctx.beginPath();
    ctx.moveTo(x + size * 0.1, y - trunkHeight - size * 0.05);
    ctx.lineTo(x + size * 0.5, y - trunkHeight - size * 0.45);
    ctx.lineTo(x + size * 0.9, y - trunkHeight - size * 0.05);
    ctx.closePath();
    ctx.fill();
}

function drawGround() {
    const groundOffset = (frameCount * gameState.speed * 1.5) % 40;
    
    const pits = obstacles.filter(obs => obs.type === 'pit');
    
    function isInPit(x) {
        for (const pit of pits) {
            if (x >= pit.x && x <= pit.x + pit.width) {
                return true;
            }
        }
        return false;
    }
    
    function drawSegmentWithPits(drawFunc) {
        let currentX = 0;
        const segments = [];
        
        segments.push({ start: 0, end: GAME_WIDTH });
        
        pits.forEach(pit => {
            const newSegments = [];
            segments.forEach(seg => {
                if (pit.x > seg.start && pit.x < seg.end) {
                    newSegments.push({ start: seg.start, end: pit.x });
                }
                if (pit.x + pit.width > seg.start && pit.x + pit.width < seg.end) {
                    newSegments.push({ start: pit.x + pit.width, end: seg.end });
                }
                if (pit.x <= seg.start && pit.x + pit.width >= seg.end) {
                } else if (pit.x >= seg.start && pit.x + pit.width <= seg.end) {
                } else if (pit.x < seg.start && pit.x + pit.width > seg.start) {
                    newSegments.push({ start: pit.x + pit.width, end: seg.end });
                } else if (pit.x < seg.end && pit.x + pit.width > seg.end) {
                    newSegments.push({ start: seg.start, end: pit.x });
                } else {
                    newSegments.push(seg);
                }
            });
            segments.length = 0;
            segments.push(...newSegments);
        });
        
        segments.forEach(seg => {
            if (seg.end > seg.start) {
                drawFunc(seg.start, seg.end - seg.start);
            }
        });
    }
    
    drawSegmentWithPits((x, w) => {
        ctx.fillStyle = '#7CFC00';
        ctx.fillRect(x, GROUND_Y, w, 10);
    });
    
    ctx.fillStyle = '#228B22';
    for (let i = -groundOffset; i < GAME_WIDTH; i += 40) {
        if (!isInPit(i) && !isInPit(i + 30)) {
            ctx.beginPath();
            ctx.moveTo(i, GROUND_Y);
            ctx.lineTo(i + 5, GROUND_Y - 8);
            ctx.lineTo(i + 10, GROUND_Y);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(i + 20, GROUND_Y);
            ctx.lineTo(i + 25, GROUND_Y - 10);
            ctx.lineTo(i + 30, GROUND_Y);
            ctx.fill();
        }
    }
    
    drawSegmentWithPits((x, w) => {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x, GROUND_Y + 10, w, GAME_HEIGHT - GROUND_Y - 10);
    });
    
    ctx.fillStyle = '#654321';
    for (let i = -groundOffset * 2; i < GAME_WIDTH; i += 30) {
        if (!isInPit(i) && !isInPit(i + 15)) {
            ctx.fillRect(i, GROUND_Y + 20, 15, 3);
            ctx.fillRect(i + 10, GROUND_Y + 35, 12, 3);
        }
    }
    
    pits.forEach(pit => {
        const gradient = ctx.createLinearGradient(pit.x, GROUND_Y, pit.x, GAME_HEIGHT);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#0a0a15');
        ctx.fillStyle = gradient;
        ctx.fillRect(pit.x, GROUND_Y, pit.width, GAME_HEIGHT - GROUND_Y);
        
        ctx.fillStyle = '#0f0f1a';
        ctx.fillRect(pit.x, GROUND_Y, pit.width, 3);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(pit.x, GROUND_Y, 5, GAME_HEIGHT - GROUND_Y);
        ctx.fillRect(pit.x + pit.width - 5, GROUND_Y, 5, GAME_HEIGHT - GROUND_Y);
    });
}

function drawDog() {
    const color = DOG_COLORS[gameState.selectedColor];
    const centerX = dog.x + dog.width / 2;
    const centerY = dog.y + dog.height / 2;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(dog.stretch, dog.squash);
    
    if (dog.isHit && Math.floor(dog.hitTimer / 3) % 2 === 0) {
        ctx.fillStyle = '#ff4444';
    } else {
        ctx.fillStyle = color.body;
    }
    
    ctx.beginPath();
    ctx.ellipse(0, 0, 25, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    
    if (color.spots) {
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.arc(-8, -5, 4, 0, Math.PI * 2);
        ctx.arc(10, 3, 5, 0, Math.PI * 2);
        ctx.arc(0, 8, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.fillStyle = color.belly;
    ctx.beginPath();
    ctx.ellipse(5, 5, 15, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const legOffset = dog.isJumping ? 0 : Math.sin(dog.animFrame * Math.PI / 2) * 5;
    
    ctx.fillStyle = color.body;
    ctx.fillRect(-18, 12, 8, 12 + legOffset);
    ctx.fillRect(8, 12, 8, 12 - legOffset);
    ctx.fillRect(-12, 12, 8, 12 - legOffset);
    ctx.fillRect(2, 12, 8, 12 + legOffset);
    
    ctx.beginPath();
    ctx.ellipse(22, -8, 14, 12, 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = color.ear;
    ctx.beginPath();
    ctx.ellipse(18, -18, 5, 8, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(28, -16, 5, 8, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(28, -10, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(29, -11, 1, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(36, -6, 3, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = color.body;
    ctx.beginPath();
    const tailY = Math.sin(dog.tailWag) * 8;
    ctx.moveTo(-22, 0);
    ctx.quadraticCurveTo(-35, -10 + tailY, -38, 5 + tailY);
    ctx.quadraticCurveTo(-32, 5, -22, 5);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
    
    if (dog.isHit) {
        dog.stars.forEach(star => {
            drawStar(star.x, star.y, star.size, star.rotation);
            star.x += star.vx;
            star.y += star.vy;
            star.vy += 0.3;
            star.rotation += 0.2;
            star.life--;
        });
        dog.stars = dog.stars.filter(s => s.life > 0);
    }
}

function drawStar(x, y, size, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const px = Math.cos(angle) * size;
        const py = Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawObstacle(obs) {
    if (obs.type === 'hurdle') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(obs.x + obs.width / 2, GROUND_Y + 2, obs.width / 2 + 5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(obs.x + 5, GROUND_Y - obs.height, 5, obs.height);
        ctx.fillRect(obs.x + obs.width - 10, GROUND_Y - obs.height, 5, obs.height);
        
        ctx.fillStyle = '#FFE66D';
        for (let i = 0; i < obs.height; i += 10) {
            ctx.fillRect(obs.x, GROUND_Y - obs.height + i, obs.width, 5);
        }
        
        ctx.fillStyle = '#4ECDC4';
        ctx.fillRect(obs.x, GROUND_Y - obs.height, obs.width, 8);
    } else if (obs.type === 'doubleHurdle') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(obs.x + obs.width / 2, GROUND_Y + 2, obs.width / 2 + 5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(obs.x + 5, GROUND_Y - obs.height1, 5, obs.height1);
        ctx.fillRect(obs.x + obs.width - 10, GROUND_Y - obs.height2, 5, obs.height2);
        
        ctx.fillStyle = '#9B59B6';
        for (let i = 0; i < obs.height1; i += 10) {
            ctx.fillRect(obs.x, GROUND_Y - obs.height1 + i, obs.width / 2 - 2, 5);
        }
        
        ctx.fillStyle = '#3498DB';
        for (let i = 0; i < obs.height2; i += 10) {
            ctx.fillRect(obs.x + obs.width / 2 + 2, GROUND_Y - obs.height2 + i, obs.width / 2 - 2, 5);
        }
        
        ctx.fillStyle = '#E74C3C';
        ctx.fillRect(obs.x, GROUND_Y - obs.height1, obs.width / 2 - 2, 8);
        ctx.fillRect(obs.x + obs.width / 2 + 2, GROUND_Y - obs.height2, obs.width / 2 - 2, 8);
    }
}

function drawCollectible(col) {
    ctx.save();
    ctx.translate(col.x, col.y);
    ctx.rotate(col.rotation);
    
    if (col.isGolden) {
        const glowSize = 20 + Math.sin(frameCount * 0.2) * 5;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
        gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#FFA500';
    } else {
        ctx.fillStyle = '#F4A460';
        ctx.strokeStyle = '#8B4513';
    }
    
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.arc(-8, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(8, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillRect(-8, -4, 16, 8);
    ctx.strokeRect(-8, -4, 16, 8);
    
    ctx.fillStyle = col.isGolden ? '#FFEC8B' : '#DEB887';
    ctx.beginPath();
    ctx.arc(-10, -2, 2, 0, Math.PI * 2);
    ctx.arc(-6, -2, 2, 0, Math.PI * 2);
    ctx.arc(6, -2, 2, 0, Math.PI * 2);
    ctx.arc(10, -2, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    col.rotation += 0.05;
}

function spawnObstacle() {
    const types = ['hurdle', 'doubleHurdle', 'pit'];
    const weights = [0.5, 0.3, 0.2];
    
    let random = Math.random();
    let type;
    if (random < weights[0]) type = 'hurdle';
    else if (random < weights[0] + weights[1]) type = 'doubleHurdle';
    else type = 'pit';
    
    let obstacle = {
        x: nextObstacleX,
        type: type
    };
    
    if (type === 'hurdle') {
        obstacle.width = 40;
        obstacle.height = 30;
    } else if (type === 'doubleHurdle') {
        obstacle.width = 80;
        obstacle.height1 = 30;
        obstacle.height2 = 50;
    } else if (type === 'pit') {
        obstacle.width = 60;
    }
    
    obstacles.push(obstacle);
    
    const gap = 150 + Math.random() * 150;
    nextObstacleX = GAME_WIDTH + gap;
}

function spawnCollectible() {
    if (Math.random() < 0.3) {
        const isGolden = Math.random() < 0.05;
        const yPos = Math.random() < 0.6 
            ? GROUND_Y - 30 - Math.random() * 50 
            : GROUND_Y - 80 - Math.random() * 40;
        
        collectibles.push({
            x: GAME_WIDTH + 50,
            y: yPos,
            isGolden: isGolden,
            rotation: 0,
            collected: false
        });
    }
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function checkCircleCollision(x1, y1, r1, x2, y2, r2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy) < r1 + r2;
}

function handleCollisions() {
    if (dog.isHit) return;
    
    const dogRect = {
        x: dog.x + 5,
        y: dog.y + 5,
        width: dog.width - 10,
        height: dog.height - 10
    };
    
    obstacles.forEach(obs => {
        if (obs.hit) return;
        
        let obsRect;
        if (obs.type === 'hurdle') {
            obsRect = { x: obs.x, y: GROUND_Y - obs.height, width: obs.width, height: obs.height };
        } else if (obs.type === 'doubleHurdle') {
            const h1Rect = { x: obs.x, y: GROUND_Y - obs.height1, width: obs.width / 2 - 2, height: obs.height1 };
            const h2Rect = { x: obs.x + obs.width / 2 + 2, y: GROUND_Y - obs.height2, width: obs.width / 2 - 2, height: obs.height2 };
            
            if (checkCollision(dogRect, h1Rect) || checkCollision(dogRect, h2Rect)) {
                takeDamage();
                obs.hit = true;
            }
            return;
        } else if (obs.type === 'pit') {
            if (dog.y + dog.height >= GROUND_Y - 5 &&
                dog.x + dog.width > obs.x + 10 &&
                dog.x < obs.x + obs.width - 10) {
                takeDamage();
                obs.hit = true;
            }
            return;
        }
        
        if (obsRect && checkCollision(dogRect, obsRect)) {
            takeDamage();
            obs.hit = true;
        }
    });
    
    collectibles.forEach(col => {
        if (col.collected) return;
        
        const dogCenterX = dog.x + dog.width / 2;
        const dogCenterY = dog.y + dog.height / 2;
        
        if (checkCircleCollision(dogCenterX, dogCenterY, 20, col.x, col.y, 15)) {
            col.collected = true;
            gameState.score += col.isGolden ? 50 : 10;
            playSound(col.isGolden ? 'goldCollect' : 'collect');
            
            for (let i = 0; i < 10; i++) {
                particles.push({
                    x: col.x,
                    y: col.y,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8,
                    life: 30,
                    color: col.isGolden ? '#FFD700' : '#F4A460',
                    size: 3 + Math.random() * 3
                });
            }
            
            updateUI();
        }
    });
}

function takeDamage() {
    dog.isHit = true;
    dog.hitTimer = 60;
    gameState.lives--;
    playSound('hit');
    
    for (let i = 0; i < 8; i++) {
        dog.stars.push({
            x: dog.x + dog.width / 2,
            y: dog.y + dog.height / 2,
            vx: (Math.random() - 0.5) * 10,
            vy: -5 - Math.random() * 5,
            size: 5 + Math.random() * 5,
            rotation: Math.random() * Math.PI * 2,
            life: 40
        });
    }
    
    updateUI();
    
    if (gameState.lives <= 0) {
        gameOver();
    }
}

function gameOver() {
    gameState.running = false;
    gameState.gameOver = true;
    
    let newUnlock = null;
    Object.entries(DOG_COLORS).forEach(([name, data]) => {
        if (gameState.distance >= data.unlockDistance && !gameState.unlockedColors.includes(name)) {
            gameState.unlockedColors.push(name);
            newUnlock = name;
        }
    });
    
    if (gameState.distance > gameState.bestDistance) {
        gameState.bestDistance = Math.floor(gameState.distance);
    }
    
    saveGameData();
    
    document.getElementById('finalDistance').textContent = Math.floor(gameState.distance);
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('finalBest').textContent = gameState.bestDistance;
    
    const unlockMsg = document.getElementById('unlockMessage');
    if (newUnlock) {
        unlockMsg.classList.remove('hidden');
        unlockMsg.textContent = `🎉 恭喜解锁新皮肤：${getColorName(newUnlock)}！`;
    } else {
        unlockMsg.classList.add('hidden');
    }
    
    document.getElementById('gameOverScreen').classList.remove('hidden');
    updateColorButtons();
}

function getColorName(color) {
    const names = { brown: '棕色', white: '白色', black: '黑色', spotted: '斑点' };
    return names[color] || color;
}

function resetGame() {
    gameState.distance = 0;
    gameState.score = 0;
    gameState.lives = 3;
    gameState.speed = INITIAL_SPEED;
    gameState.lastSpeedIncrease = 0;
    gameState.gameOver = false;
    
    dog.y = GROUND_Y - 40;
    dog.velocityY = 0;
    dog.isJumping = false;
    dog.jumpHoldFrames = 0;
    dog.isHoldingJump = false;
    dog.canDoubleJump = true;
    dog.doubleJumped = false;
    dog.squash = 1;
    dog.stretch = 1;
    dog.isHit = false;
    dog.hitTimer = 0;
    dog.stars = [];
    
    obstacles = [];
    collectibles = [];
    particles = [];
    nextObstacleX = GAME_WIDTH + 200;
    frameCount = 0;
    
    initBackground();
    updateUI();
}

function jump() {
    if (!gameState.running || gameState.paused) return;
    
    if (!dog.isJumping) {
        dog.velocityY = JUMP_FORCE;
        dog.isJumping = true;
        dog.jumpHoldFrames = 0;
        dog.isHoldingJump = true;
        dog.canDoubleJump = true;
        dog.doubleJumped = false;
        dog.stretch = 1.3;
        dog.squash = 0.7;
        playSound('jump');
    } else if (dog.canDoubleJump && !dog.doubleJumped) {
        dog.velocityY = JUMP_FORCE * 0.7;
        dog.doubleJumped = true;
        dog.stretch = 1.3;
        dog.squash = 0.7;
        playSound('doubleJump');
        
        for (let i = 0; i < 8; i++) {
            particles.push({
                x: dog.x + dog.width / 2,
                y: dog.y + dog.height,
                vx: (Math.random() - 0.5) * 6,
                vy: Math.random() * 4,
                life: 20,
                color: '#87CEEB',
                size: 4 + Math.random() * 4
            });
        }
    }
}

function update() {
    if (!gameState.running || gameState.paused) return;
    
    frameCount++;
    
    gameState.distance += gameState.speed * 0.1;
    
    const speedLevel = Math.floor(gameState.distance / SPEED_INCREMENT_DISTANCE);
    if (speedLevel > gameState.lastSpeedIncrease) {
        gameState.speed += SPEED_INCREMENT;
        gameState.lastSpeedIncrease = speedLevel;
        playSound('speedUp');
    }
    
    if (dog.isHoldingJump && dog.jumpHoldFrames < MAX_JUMP_HOLD) {
        dog.velocityY -= 0.2;
        dog.jumpHoldFrames++;
    }
    
    dog.velocityY += GRAVITY;
    dog.y += dog.velocityY;
    
    if (dog.y >= GROUND_Y - dog.height) {
        if (dog.isJumping) {
            dog.squash = 1.3;
            dog.stretch = 0.7;
            
            for (let i = 0; i < 6; i++) {
                particles.push({
                    x: dog.x + dog.width / 2,
                    y: GROUND_Y,
                    vx: (Math.random() - 0.5) * 8,
                    vy: -Math.random() * 3,
                    life: 15,
                    color: '#8B4513',
                    size: 3 + Math.random() * 3
                });
            }
        }
        
        dog.y = GROUND_Y - dog.height;
        dog.velocityY = 0;
        dog.isJumping = false;
        dog.canDoubleJump = true;
        dog.doubleJumped = false;
    }
    
    dog.squash += (1 - dog.squash) * 0.2;
    dog.stretch += (1 - dog.stretch) * 0.2;
    
    dog.animTimer++;
    if (dog.animTimer >= 5) {
        dog.animTimer = 0;
        dog.animFrame = (dog.animFrame + 1) % 4;
    }
    dog.tailWag += 0.3;
    
    if (dog.isHit) {
        dog.hitTimer--;
        if (dog.hitTimer <= 0) {
            dog.isHit = false;
        }
    }
    
    if (frameCount % 90 === 0) {
        spawnCollectible();
    }
    
    obstacles.forEach(obs => {
        obs.x -= gameState.speed;
    });
    obstacles = obstacles.filter(obs => obs.x + obs.width > -50);
    
    nextObstacleX -= gameState.speed;
    if (nextObstacleX < GAME_WIDTH - 100) {
        spawnObstacle();
    }
    
    collectibles.forEach(col => {
        col.x -= gameState.speed;
    });
    collectibles = collectibles.filter(col => col.x > -30 && !col.collected);
    
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life--;
    });
    particles = particles.filter(p => p.life > 0);
    
    handleCollisions();
    updateUI();
    autoSave();
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life / 30;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function draw() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    drawBackground();
    drawGround();
    
    obstacles.forEach(drawObstacle);
    collectibles.forEach(drawCollectible);
    drawDog();
    drawParticles();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        initAudio();
        
        if (!gameState.running && !document.getElementById('startScreen').classList.contains('hidden')) {
            if (!gameState.gameOver && gameState.distance > 0) {
                continueGame();
            } else {
                startGame();
            }
        } else if (!gameState.running && !document.getElementById('gameOverScreen').classList.contains('hidden')) {
            startGame();
        } else if (gameState.running && !gameState.paused) {
            jump();
        }
    }
    
    if (e.code === 'KeyP' && gameState.running) {
        gameState.paused = !gameState.paused;
        document.getElementById('pauseScreen').classList.toggle('hidden', !gameState.paused);
    }
    
    if (e.code === 'KeyR') {
        if (!gameState.running) {
            startGame();
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
        dog.isHoldingJump = false;
    }
});

function initTouchControls() {
    const touchBtn = document.getElementById('touchJumpBtn');
    
    function handleTouchStart(e) {
        e.preventDefault();
        initAudio();
        
        if (!gameState.running && !document.getElementById('startScreen').classList.contains('hidden')) {
            continueGame();
        } else if (!gameState.running && !document.getElementById('gameOverScreen').classList.contains('hidden')) {
            startGame();
        } else if (gameState.running && !gameState.paused) {
            jump();
        }
    }
    
    function handleTouchEnd(e) {
        e.preventDefault();
        dog.isHoldingJump = false;
    }
    
    touchBtn.addEventListener('touchstart', handleTouchStart, { passive: false });
    touchBtn.addEventListener('touchend', handleTouchEnd, { passive: false });
    touchBtn.addEventListener('mousedown', handleTouchStart);
    touchBtn.addEventListener('mouseup', handleTouchEnd);
    touchBtn.addEventListener('mouseleave', handleTouchEnd);
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        initAudio();
        if (gameState.running && !gameState.paused) {
            jump();
        }
    }, { passive: false });
    
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        dog.isHoldingJump = false;
    }, { passive: false });
}

function updateStartScreen() {
    const hasSavedGame = !gameState.gameOver && gameState.distance > 0;
    
    document.getElementById('continueBtn').classList.toggle('hidden', !hasSavedGame);
    document.getElementById('currentProgress').classList.toggle('hidden', !hasSavedGame);
    document.getElementById('currentDistance').textContent = Math.floor(gameState.distance);
    
    if (hasSavedGame) {
        document.getElementById('startBtn').textContent = '重新开始';
        document.getElementById('startBtn').classList.add('secondary');
    } else {
        document.getElementById('startBtn').textContent = '开始游戏';
        document.getElementById('startBtn').classList.remove('secondary');
    }
}

function continueGame() {
    if (gameState.gameOver || gameState.distance <= 0) {
        startGame();
        return;
    }
    
    initAudio();
    gameState.running = true;
    gameState.paused = false;
    gameState.gameOver = false;
    
    dog.y = GROUND_Y - 40;
    dog.velocityY = 0;
    dog.isJumping = false;
    dog.isHit = false;
    dog.hitTimer = 0;
    
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('pauseScreen').classList.add('hidden');
    
    saveGameData();
}

function startGame() {
    initAudio();
    resetGame();
    gameState.running = true;
    gameState.paused = false;
    gameState.gameOver = false;
    
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('pauseScreen').classList.add('hidden');
    
    saveGameData();
}

let saveCounter = 0;
function autoSave() {
    if (gameState.running && !gameState.paused) {
        saveCounter++;
        if (saveCounter >= 60) {
            saveCounter = 0;
            saveGameData();
        }
    }
}

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('continueBtn').addEventListener('click', continueGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

window.addEventListener('beforeunload', () => {
    if (gameState.running) {
        gameState.paused = true;
        saveGameData();
    }
});

window.addEventListener('pagehide', () => {
    saveGameData();
});

loadGameData();
initBackground();
initTouchControls();
updateStartScreen();
draw();
gameLoop();
