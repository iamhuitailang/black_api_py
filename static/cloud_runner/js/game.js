const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const API_BASE = '/api/cloud/runner';

let gameState = 'start';
let score = 0;
let distance = 0;
let essenceCount = 0;
let playerName = '';
let cameraX = 0;

const GRAVITY = 0.5;
const JUMP_POWER_MIN = 8;
const JUMP_POWER_MAX = 18;
const CHARGE_SPEED = 0.3;
const MOVE_SPEED = 4;
const FLY_DURATION = 3000;
const FLY_GRAVITY = 0.1;
const STUN_DURATION = 2000;

let isCharging = false;
let chargePower = 0;
let isFlying = false;
let flyEndTime = 0;
let isStunned = false;
let stunEndTime = 0;

const player = {
    x: 200,
    y: 300,
    width: 40,
    height: 50,
    vx: 0,
    vy: 0,
    onCloud: false,
    squash: 1,
    stretch: 1,
    cloudSquish: 0
};

let clouds = [];
let essences = [];
let thunderClouds = [];
let particles = [];

const skyColors = {
    dawn: { top: '#ff9a9e', bottom: '#fecfef', mid: '#ffecd2' },
    morning: { top: '#a8edea', bottom: '#fed6e3', mid: '#d299c2' },
    noon: { top: '#89f7fe', bottom: '#66a6ff', mid: '#89f7fe' },
    afternoon: { top: '#ffecd2', bottom: '#fcb69f', mid: '#ffd89b' },
    sunset: { top: '#fa709a', bottom: '#fee140', mid: '#ff9a9e' },
    night: { top: '#0f0c29', bottom: '#302b63', mid: '#24243e' }
};

let currentSky = 'dawn';
let skyProgress = 0;

function lerpColor(color1, color2, t) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    const r = Math.round(c1.r + (c2.r - c1.r) * t);
    const g = Math.round(c1.g + (c2.g - c1.g) * t);
    const b = Math.round(c1.b + (c2.b - c1.b) * t);
    return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
}

function getSkyGradient() {
    const phases = ['dawn', 'morning', 'noon', 'afternoon', 'sunset', 'night'];
    const phaseIndex = Math.floor(skyProgress * (phases.length - 1));
    const phaseT = (skyProgress * (phases.length - 1)) % 1;
    
    const current = skyColors[phases[phaseIndex]];
    const next = skyColors[phases[Math.min(phaseIndex + 1, phases.length - 1)]];
    
    const topColor = lerpColor(current.top, next.top, phaseT);
    const bottomColor = lerpColor(current.bottom, next.bottom, phaseT);
    
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(0.5, lerpColor(current.top, current.bottom, 0.5));
    gradient.addColorStop(1, bottomColor);
    
    return gradient;
}

function drawWatercolorCloud(x, y, width, height, opacity = 1, isThunder = false) {
    ctx.save();
    ctx.globalAlpha = opacity;
    
    const baseColor = isThunder ? '#4a4a6a' : '#ffffff';
    const shadowColor = isThunder ? '#2a2a4a' : '#e8e8f0';
    const glowColor = isThunder ? '#7b68ee' : '#ffe4e1';
    
    const blobs = [
        { ox: -width * 0.35, oy: 0, r: width * 0.3 },
        { ox: -width * 0.1, oy: -height * 0.3, r: width * 0.35 },
        { ox: width * 0.2, oy: -height * 0.2, r: width * 0.3 },
        { ox: width * 0.4, oy: 0, r: width * 0.28 },
        { ox: 0, oy: height * 0.1, r: width * 0.32 },
        { ox: width * 0.15, oy: height * 0.15, r: width * 0.25 }
    ];
    
    for (let i = 0; i < blobs.length; i++) {
        const blob = blobs[i];
        const gradient = ctx.createRadialGradient(
            x + blob.ox, y + blob.oy, 0,
            x + blob.ox, y + blob.oy, blob.r
        );
        gradient.addColorStop(0, baseColor);
        gradient.addColorStop(0.6, shadowColor);
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x + blob.ox, y + blob.oy, blob.r, 0, Math.PI * 2);
        ctx.fill();
    }
    
    if (!isThunder) {
        ctx.globalAlpha = opacity * 0.3;
        for (let i = 0; i < blobs.length; i++) {
            const blob = blobs[i];
            const glowGradient = ctx.createRadialGradient(
                x + blob.ox - 5, y + blob.oy - 5, 0,
                x + blob.ox - 5, y + blob.oy - 5, blob.r * 0.8
            );
            glowGradient.addColorStop(0, glowColor);
            glowGradient.addColorStop(1, 'rgba(255,228,225,0)');
            
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(x + blob.ox - 5, y + blob.oy - 5, blob.r * 0.8, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    if (isThunder) {
        ctx.globalAlpha = opacity * 0.5;
        ctx.fillStyle = '#ffd700';
        for (let i = 0; i < 3; i++) {
            const lx = x + (Math.random() - 0.5) * width;
            const ly = y + (Math.random() - 0.5) * height * 0.5;
            drawLightning(lx, ly, 15 + Math.random() * 10);
        }
    }
    
    ctx.restore();
}

function drawLightning(x, y, size) {
    ctx.save();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    let currentY = y - size;
    let currentX = x;
    const segments = 5;
    for (let i = 0; i < segments; i++) {
        currentY += size / segments;
        currentX += (Math.random() - 0.5) * size * 0.4;
        ctx.lineTo(currentX, currentY);
    }
    ctx.stroke();
    ctx.restore();
}

function drawPlayer() {
    const px = player.x - cameraX;
    const py = player.y;
    const w = player.width * player.stretch;
    const h = player.height * player.squash;
    
    ctx.save();
    ctx.translate(px, py);
    
    if (isFlying) {
        ctx.shadowColor = '#87ceeb';
        ctx.shadowBlur = 20;
    }
    
    if (isStunned) {
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 15;
    }
    
    const bodyGradient = ctx.createLinearGradient(-w/2, -h, w/2, 0);
    bodyGradient.addColorStop(0, '#ff9a9e');
    bodyGradient.addColorStop(0.5, '#fecfef');
    bodyGradient.addColorStop(1, '#ffecd2');
    
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.ellipse(0, -h/2, w/2, h/2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#fff5f5';
    ctx.beginPath();
    ctx.ellipse(-w/6, -h/2 - h/6, w/4, h/4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const eyeOffsetX = isStunned ? 2 : 0;
    ctx.fillStyle = '#5c4033';
    ctx.beginPath();
    ctx.arc(-w/5 - eyeOffsetX, -h/2 - h/10, 3, 0, Math.PI * 2);
    ctx.arc(w/5 + eyeOffsetX, -h/2 - h/10, 3, 0, Math.PI * 2);
    ctx.fill();
    
    if (isStunned) {
        ctx.strokeStyle = '#5c4033';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-w/5 - 4, -h/2 - h/10 - 2);
        ctx.lineTo(-w/5 + 4, -h/2 - h/10 + 2);
        ctx.moveTo(-w/5 + 4, -h/2 - h/10 - 2);
        ctx.lineTo(-w/5 - 4, -h/2 - h/10 + 2);
        ctx.moveTo(w/5 - 4, -h/2 - h/10 - 2);
        ctx.lineTo(w/5 + 4, -h/2 - h/10 + 2);
        ctx.moveTo(w/5 + 4, -h/2 - h/10 - 2);
        ctx.lineTo(w/5 - 4, -h/2 - h/10 + 2);
        ctx.stroke();
    }
    
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (isStunned) {
        ctx.arc(0, -h/2 + h/6, w/6, 0.2 * Math.PI, 0.8 * Math.PI);
    } else {
        ctx.arc(0, -h/2 + h/8, w/5, 0.1 * Math.PI, 0.9 * Math.PI);
    }
    ctx.stroke();
    
    if (isFlying) {
        ctx.globalAlpha = 0.6;
        const wingFlap = Math.sin(Date.now() * 0.02) * 10;
        
        ctx.fillStyle = '#87ceeb';
        ctx.beginPath();
        ctx.moveTo(-w/2, -h/3);
        ctx.quadraticCurveTo(-w/2 - 20, -h/2 + wingFlap, -w/2 - 15, -h/4);
        ctx.quadraticCurveTo(-w/2 - 25, -h/6 + wingFlap, -w/2, 0);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(w/2, -h/3);
        ctx.quadraticCurveTo(w/2 + 20, -h/2 + wingFlap, w/2 + 15, -h/4);
        ctx.quadraticCurveTo(w/2 + 25, -h/6 + wingFlap, w/2, 0);
        ctx.closePath();
        ctx.fill();
    }
    
    if (isStunned) {
        ctx.fillStyle = '#ffd700';
        const starAngle = Date.now() * 0.003;
        for (let i = 0; i < 3; i++) {
            const angle = starAngle + (i * Math.PI * 2) / 3;
            const sx = Math.cos(angle) * (w/2 + 10);
            const sy = -h + Math.sin(angle) * 10;
            drawStar(sx, sy, 5, 6, 3);
        }
    }
    
    ctx.restore();
}

function drawStar(x, y, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;
    
    ctx.beginPath();
    ctx.moveTo(x, y - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
        let xOuter = x + Math.cos(rot) * outerRadius;
        let yOuter = y + Math.sin(rot) * outerRadius;
        ctx.lineTo(xOuter, yOuter);
        rot += step;
        
        let xInner = x + Math.cos(rot) * innerRadius;
        let yInner = y + Math.sin(rot) * innerRadius;
        ctx.lineTo(xInner, yInner);
        rot += step;
    }
    
    ctx.lineTo(x, y - outerRadius);
    ctx.closePath();
    ctx.fill();
}

function drawEssence(x, y) {
    ctx.save();
    ctx.translate(x, y);
    
    const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
    
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 20 * pulse);
    gradient.addColorStop(0, 'rgba(135, 206, 250, 1)');
    gradient.addColorStop(0.4, 'rgba(100, 149, 237, 0.8)');
    gradient.addColorStop(0.7, 'rgba(70, 130, 180, 0.4)');
    gradient.addColorStop(1, 'rgba(135, 206, 250, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, 20 * pulse, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-3, -3, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#e0f7ff';
    drawStar(0, 0, 4, 10 * pulse, 5 * pulse);
    
    ctx.restore();
}

function drawParticle(p) {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x - cameraX, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function initGame() {
    player.x = 200;
    player.y = 300;
    player.vx = 0;
    player.vy = 0;
    player.onCloud = false;
    player.squash = 1;
    player.stretch = 1;
    player.cloudSquish = 0;
    
    score = 0;
    distance = 0;
    essenceCount = 0;
    cameraX = 0;
    skyProgress = 0;
    
    isCharging = false;
    chargePower = 0;
    isFlying = false;
    flyEndTime = 0;
    isStunned = false;
    stunEndTime = 0;
    
    clouds = [];
    essences = [];
    thunderClouds = [];
    particles = [];
    
    generateInitialClouds();
    updateUI();
}

function generateInitialClouds() {
    clouds.push({
        x: 100,
        y: 400,
        width: 200,
        height: 60,
        life: 1,
        maxLife: 1,
        fadeSpeed: 0.001,
        squish: 0
    });
    
    let lastX = 250;
    for (let i = 0; i < 10; i++) {
        lastX += 150 + Math.random() * 100;
        const cloudY = 300 + Math.random() * 200;
        addCloud(lastX, cloudY);
    }
}

function addCloud(x, y) {
    const width = 120 + Math.random() * 100;
    const height = 40 + Math.random() * 30;
    const life = 0.8 + Math.random() * 0.4;
    
    clouds.push({
        x: x,
        y: y,
        width: width,
        height: height,
        life: life,
        maxLife: life,
        fadeSpeed: 0.0005 + Math.random() * 0.0005,
        squish: 0
    });
    
    if (Math.random() < 0.3) {
        essences.push({
            x: x + width / 2,
            y: y - 40 - Math.random() * 30,
            collected: false,
            bobOffset: Math.random() * Math.PI * 2
        });
    }
    
    if (Math.random() < 0.15 && distance > 500) {
        thunderClouds.push({
            x: x + width / 2,
            y: y - 60,
            width: width * 0.8,
            height: height * 1.2,
            active: true,
            pulsePhase: Math.random() * Math.PI * 2
        });
    }
}

function generateClouds() {
    const rightmostCloud = clouds.reduce((max, c) => Math.max(max, c.x + c.width), 0);
    const generateDistance = player.x + canvas.width + 300;
    
    if (rightmostCloud < generateDistance) {
        const gap = 120 + Math.random() * 80 + Math.min(distance / 500, 60);
        const newX = rightmostCloud + gap;
        const newY = 250 + Math.random() * 250;
        addCloud(newX, newY);
    }
}

function update() {
    if (gameState !== 'playing') return;
    
    const now = Date.now();
    
    if (isStunned && now >= stunEndTime) {
        isStunned = false;
        document.getElementById('stunIndicator').style.display = 'none';
    }
    
    if (isFlying) {
        if (now >= flyEndTime) {
            isFlying = false;
            document.getElementById('flyIndicator').style.display = 'none';
        } else {
            const remaining = flyEndTime - now;
            const fillPercent = (remaining / FLY_DURATION) * 100;
            document.getElementById('flyFill').style.width = fillPercent + '%';
        }
    }
    
    if (isCharging && !isStunned) {
        chargePower = Math.min(chargePower + CHARGE_SPEED, 1);
        document.getElementById('powerFill').style.width = (chargePower * 100) + '%';
    }
    
    const gravity = isFlying ? FLY_GRAVITY : GRAVITY;
    player.vy += gravity;
    
    if (isStunned) {
        player.vx *= 0.95;
    } else {
        const targetVx = MOVE_SPEED;
        player.vx += (targetVx - player.vx) * 0.1;
    }
    
    player.x += player.vx;
    player.y += player.vy;
    
    cameraX = player.x - 300;
    if (cameraX < 0) cameraX = 0;
    
    distance = Math.max(distance, Math.floor(player.x / 10));
    skyProgress = Math.min(distance / 10000, 1);
    
    score = distance + essenceCount * 100;
    
    player.onCloud = false;
    for (let cloud of clouds) {
        if (cloud.life <= 0.1) continue;
        
        const cloudTop = cloud.y - cloud.height / 2 + cloud.squish;
        const cloudLeft = cloud.x - cloud.width / 2;
        const cloudRight = cloud.x + cloud.width / 2;
        
        if (player.vy >= 0 &&
            player.x + player.width / 3 > cloudLeft &&
            player.x - player.width / 3 < cloudRight &&
            player.y >= cloudTop - 10 &&
            player.y <= cloudTop + 20) {
            
            player.y = cloudTop;
            player.vy = 0;
            player.onCloud = true;
            
            if (player.squash < 1.3) {
                player.squash = 1.3;
                player.stretch = 0.7;
                cloud.squish = 15;
                createLandingParticles(player.x, player.y);
            }
        }
    }
    
    for (let cloud of clouds) {
        if (player.onCloud && cloud === clouds.find(c => 
            player.x > c.x - c.width / 2 && 
            player.x < c.x + c.width / 2 &&
            Math.abs(player.y - (c.y - c.height / 2 + c.squish)) < 5
        )) {
            cloud.life -= cloud.fadeSpeed * 1.5;
        } else {
            cloud.life -= cloud.fadeSpeed * 0.3;
        }
        
        if (cloud.squish > 0) {
            cloud.squish *= 0.9;
            if (cloud.squish < 0.5) cloud.squish = 0;
        }
    }
    
    clouds = clouds.filter(c => c.life > 0.05 && c.x > cameraX - 200);
    
    for (let essence of essences) {
        if (essence.collected) continue;
        
        const dx = player.x - essence.x;
        const dy = player.y - player.height / 2 - essence.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 30) {
            essence.collected = true;
            essenceCount++;
            activateFly();
            createCollectParticles(essence.x, essence.y);
        }
    }
    
    essences = essences.filter(e => !e.collected && e.x > cameraX - 200);
    
    for (let tc of thunderClouds) {
        if (!tc.active) continue;
        
        const dx = player.x - tc.x;
        const dy = player.y - player.height / 2 - tc.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < tc.width / 2 + player.width / 2) {
            if (!isStunned) {
                triggerStun();
            }
        }
        
        tc.pulsePhase += 0.05;
    }
    
    thunderClouds = thunderClouds.filter(tc => tc.x > cameraX - 200);
    
    if (player.squash > 1) {
        player.squash -= 0.03;
        if (player.squash < 1) player.squash = 1;
    }
    if (player.stretch < 1) {
        player.stretch += 0.03;
        if (player.stretch > 1) player.stretch = 1;
    }
    
    if (player.vy < -5 && player.stretch < 1.3) {
        player.stretch = 1.2;
        player.squash = 0.85;
    }
    
    for (let p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life -= 0.02;
        p.size *= 0.98;
    }
    particles = particles.filter(p => p.life > 0);
    
    generateClouds();
    
    if (player.y > canvas.height + 100) {
        gameOver();
    }
    
    updateUI();
}

function activateFly() {
    isFlying = true;
    flyEndTime = Date.now() + FLY_DURATION;
    player.vy = -5;
    document.getElementById('flyIndicator').style.display = 'flex';
}

function triggerStun() {
    isStunned = true;
    stunEndTime = Date.now() + STUN_DURATION;
    player.vy = -3;
    player.vx *= 0.5;
    document.getElementById('stunIndicator').style.display = 'block';
    
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: player.x,
            y: player.y - player.height / 2,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8 - 3,
            size: 4 + Math.random() * 4,
            life: 1,
            color: '#ffd700'
        });
    }
}

function createLandingParticles(x, y) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x + (Math.random() - 0.5) * 30,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: -Math.random() * 3 - 1,
            size: 3 + Math.random() * 3,
            life: 0.8,
            color: '#ffffff'
        });
    }
}

function createCollectParticles(x, y) {
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * 4,
            vy: Math.sin(angle) * 4,
            size: 4 + Math.random() * 3,
            life: 1,
            color: '#87ceeb'
        });
    }
}

function draw() {
    const skyGradient = getSkyGradient();
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawFarBackground();
    
    for (let cloud of thunderClouds) {
        const screenX = cloud.x - cameraX;
        if (screenX > -200 && screenX < canvas.width + 200) {
            const pulse = Math.sin(cloud.pulsePhase) * 0.1 + 0.9;
            drawWatercolorCloud(
                screenX, cloud.y,
                cloud.width * pulse, cloud.height * pulse,
                0.9, true
            );
        }
    }
    
    for (let cloud of clouds) {
        const screenX = cloud.x - cameraX;
        if (screenX > -200 && screenX < canvas.width + 200) {
            const y = cloud.y + cloud.squish;
            drawWatercolorCloud(screenX, y, cloud.width, cloud.height, cloud.life);
        }
    }
    
    for (let essence of essences) {
        if (essence.collected) continue;
        const screenX = essence.x - cameraX;
        if (screenX > -50 && screenX < canvas.width + 50) {
            const bobY = essence.y + Math.sin(Date.now() * 0.003 + essence.bobOffset) * 5;
            drawEssence(screenX, bobY);
        }
    }
    
    for (let p of particles) {
        drawParticle(p);
    }
    
    drawPlayer();
}

function drawFarBackground() {
    ctx.save();
    ctx.globalAlpha = 0.3;
    
    const parallax1 = cameraX * 0.1;
    for (let i = 0; i < 5; i++) {
        const x = (i * 300 - parallax1 % 300 + canvas.width) % (canvas.width + 300) - 150;
        const y = 150 + Math.sin(i * 1.5) * 50;
        drawWatercolorCloud(x, y, 150, 50, 0.5);
    }
    
    ctx.globalAlpha = 0.2;
    const parallax2 = cameraX * 0.05;
    for (let i = 0; i < 4; i++) {
        const x = (i * 400 - parallax2 % 400 + canvas.width) % (canvas.width + 400) - 200;
        const y = 100 + Math.cos(i * 2) * 40;
        drawWatercolorCloud(x, y, 200, 60, 0.4);
    }
    
    ctx.restore();
}

function updateUI() {
    document.getElementById('distance').textContent = Math.floor(distance) + ' m';
    document.getElementById('score').textContent = Math.floor(score);
    document.getElementById('essence').textContent = essenceCount;
}

function jump() {
    if (!player.onCloud || isStunned) return;
    
    const power = JUMP_POWER_MIN + (JUMP_POWER_MAX - JUMP_POWER_MIN) * chargePower;
    player.vy = -power;
    player.onCloud = false;
    
    player.stretch = 1.3;
    player.squash = 0.7;
    
    isCharging = false;
    chargePower = 0;
    document.getElementById('powerBarContainer').style.display = 'none';
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function startGame() {
    const nameInput = document.getElementById('playerName');
    playerName = nameInput.value.trim() || '匿名玩家';
    
    initGame();
    gameState = 'playing';
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
}

function gameOver() {
    gameState = 'gameover';
    document.getElementById('finalDistance').textContent = Math.floor(distance) + ' m';
    document.getElementById('finalScore').textContent = Math.floor(score);
    document.getElementById('gameOverScreen').style.display = 'flex';
    
    submitScore();
    loadLeaderboard();
}

async function submitScore() {
    try {
        const response = await fetch(`${API_BASE}/score/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player_name: playerName,
                score: Math.floor(score),
                distance: Math.floor(distance)
            })
        });
        
        const result = await response.json();
        if (result.code === 0 && result.data) {
            document.getElementById('rankItem').style.display = 'flex';
            document.getElementById('playerRank').textContent = '#' + result.data.rank;
        }
    } catch (e) {
        console.error('Failed to submit score:', e);
    }
}

async function loadLeaderboard() {
    try {
        const response = await fetch(`${API_BASE}/leaderboard/get?limit=10`);
        const result = await response.json();
        
        if (result.code === 0 && result.data && result.data.items) {
            const list = document.getElementById('leaderboardList');
            list.innerHTML = '';
            
            result.data.items.forEach((item, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span class="player-info">${item.player_name}</span>
                    <span class="player-score">${item.score}分</span>
                `;
                list.appendChild(li);
            });
        }
    } catch (e) {
        console.error('Failed to load leaderboard:', e);
    }
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && gameState === 'playing') {
        e.preventDefault();
        if (!isCharging && player.onCloud && !isStunned) {
            isCharging = true;
            chargePower = 0;
            document.getElementById('powerBarContainer').style.display = 'flex';
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'Space' && gameState === 'playing') {
        e.preventDefault();
        if (isCharging) {
            jump();
        }
    }
});

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

loadLeaderboard();
gameLoop();
