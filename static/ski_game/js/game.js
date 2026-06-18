(() => {
    'use strict';

    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const rankingScreen = document.getElementById('ranking-screen');
    const avalancheWarning = document.getElementById('avalanche-warning');
    const avalancheProgress = document.getElementById('avalanche-progress');
    
    const scoreValue = document.getElementById('score-value');
    const speedValue = document.getElementById('speed-value');
    const distanceValue = document.getElementById('distance-value');
    const slopeValue = document.getElementById('slope-value');
    
    const finalScore = document.getElementById('final-score');
    const finalDistance = document.getElementById('final-distance');
    const finalMaxSpeed = document.getElementById('final-max-speed');
    const finalGates = document.getElementById('final-gates');
    const submitResult = document.getElementById('submit-result');
    
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const backMenuBtn = document.getElementById('back-menu-btn');
    const backFromRankingBtn = document.getElementById('back-from-ranking-btn');
    const showRankingBtn = document.getElementById('show-ranking-btn');
    const submitScoreBtn = document.getElementById('submit-score-btn');
    const playerNameInput = document.getElementById('player-name');

    let gameState = 'menu';
    let animationId = null;

    let width = 0;
    let height = 0;

    const game = {
        score: 0,
        distance: 0,
        speed: 0,
        maxSpeed: 0,
        baseSpeed: 120,
        playerX: 0,
        playerLane: 0,
        targetPlayerX: 0,
        gatesPassed: 0,
        slopeLevel: 1,
        slopeZ: 0,
        slopeLength: 800,
        isTurning: false,
        turnTimer: 0,
        boostTimer: 0,
        slowTimer: 0,
        avalanche: {
            active: false,
            distance: 50,
            speed: 80,
            timer: 0,
            nextAvalanche: 2000
        }
    };

    const keys = {
        left: false,
        right: false,
        space: false
    };

    const ROAD_WIDTH = 160;
    const LANE_COUNT = 5;
    const LANE_WIDTH = ROAD_WIDTH / LANE_COUNT;

    const snowflakes = [];
    const snowTrail = [];
    const trees = [];
    const rocks = [];
    const gates = [];
    const snowShakes = [];

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }

    function project(x, z) {
        const fov = 300;
        const scale = fov / (fov + z);
        const screenX = width / 2 + x * scale;
        const screenY = height * 0.65 - scale * 100 + (height * 0.35);
        return { x: screenX, y: screenY, scale: scale };
    }

    function initSnowflakes() {
        snowflakes.length = 0;
        for (let i = 0; i < 200; i++) {
            snowflakes.push({
                x: (Math.random() - 0.5) * width * 1.5,
                y: Math.random() * height,
                z: Math.random() * 500 + 50,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 2 + 1
            });
        }
    }

    function updateSnowflakes() {
        const dt = 1 / 60;
        for (let i = 0; i < snowflakes.length; i++) {
            const flake = snowflakes[i];
            flake.z -= (game.speed * 0.5 + flake.speed * 20) * dt;
            flake.y += flake.speed * 30 * dt;
            flake.x += Math.sin(flake.y * 0.01 + flake.z * 0.01) * 10 * dt;
            
            if (flake.z < 1) {
                flake.z = 500 + Math.random() * 200;
                flake.y = Math.random() * height * 0.3;
                flake.x = (Math.random() - 0.5) * width * 1.5;
            }
            if (flake.y > height) {
                flake.y = 0;
                flake.x = (Math.random() - 0.5) * width * 1.5;
            }
        }
    }

    function drawSnowflakes() {
        ctx.fillStyle = 'white';
        for (let i = 0; i < snowflakes.length; i++) {
            const flake = snowflakes[i];
            const proj = project(flake.x, flake.z);
            const size = flake.size * proj.scale;
            if (size > 0.5 && proj.y > 0 && proj.y < height) {
                ctx.globalAlpha = Math.min(1, proj.scale * 2);
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }

    function spawnEnvironment() {
        const spawnZ = 600;
        const spawnChance = game.speed * 0.002 * (game.slopeLevel === 2 ? 1.8 : 1);
        
        if (Math.random() < spawnChance * 0.3) {
            const side = Math.random() < 0.5 ? -1 : 1;
            const offset = ROAD_WIDTH * 0.5 + 20 + Math.random() * 40;
            trees.push({
                x: side * offset,
                z: spawnZ,
                type: Math.floor(Math.random() * 3),
                height: 30 + Math.random() * 20,
                shaking: false,
                shakeTimer: 0
            });
        }
        
        if (Math.random() < spawnChance * 0.15) {
            const lane = Math.floor(Math.random() * LANE_COUNT);
            const x = (lane - (LANE_COUNT - 1) / 2) * LANE_WIDTH;
            rocks.push({
                x: x + (Math.random() - 0.5) * LANE_WIDTH * 0.4,
                z: spawnZ,
                size: 8 + Math.random() * 8
            });
        }
        
        if (Math.random() < spawnChance * 0.08) {
            const lane = Math.floor(Math.random() * LANE_COUNT);
            const x = (lane - (LANE_COUNT - 1) / 2) * LANE_WIDTH;
            gates.push({
                x: x,
                z: spawnZ,
                width: LANE_WIDTH * 0.7,
                passed: false,
                missed: false
            });
        }
    }

    function updateEnvironment() {
        const dt = 1 / 60;
        const moveSpeed = game.speed * dt;
        
        for (let i = trees.length - 1; i >= 0; i--) {
            const tree = trees[i];
            tree.z -= moveSpeed;
            
            if (tree.shaking) {
                tree.shakeTimer -= dt;
                if (tree.shakeTimer <= 0) {
                    tree.shaking = false;
                }
            }
            
            if (tree.z < -50) {
                trees.splice(i, 1);
            }
        }
        
        for (let i = rocks.length - 1; i >= 0; i--) {
            rocks[i].z -= moveSpeed;
            if (rocks[i].z < -30) {
                rocks.splice(i, 1);
            }
        }
        
        for (let i = gates.length - 1; i >= 0; i--) {
            const gate = gates[i];
            gate.z -= moveSpeed;
            
            if (!gate.passed && !gate.missed && gate.z < 20 && gate.z > -10) {
                const playerLeft = game.playerX - 8;
                const playerRight = game.playerX + 8;
                const gateLeft = gate.x - gate.width / 2;
                const gateRight = gate.x + gate.width / 2;
                
                if (playerRight > gateLeft && playerLeft < gateRight) {
                    gate.passed = true;
                    game.gatesPassed++;
                    game.score += 50;
                    game.boostTimer = 2;
                    addGateEffect(gate.x);
                }
            }
            
            if (!gate.passed && !gate.missed && gate.z < -10) {
                gate.missed = true;
                game.slowTimer = 1;
            }
            
            if (gate.z < -50) {
                gates.splice(i, 1);
            }
        }
    }

    function addGateEffect(x) {
        for (let i = 0; i < 10; i++) {
            snowShakes.push({
                x: x + (Math.random() - 0.5) * 30,
                y: 0,
                z: 10,
                vy: Math.random() * 50 + 30,
                vx: (Math.random() - 0.5) * 30,
                life: 1,
                size: 3 + Math.random() * 3
            });
        }
    }

    function triggerTreeShake(tree) {
        if (!tree.shaking) {
            tree.shaking = true;
            tree.shakeTimer = 0.5;
            
            for (let i = 0; i < 15; i++) {
                snowShakes.push({
                    x: tree.x + (Math.random() - 0.5) * 20,
                    y: tree.height * 0.5,
                    z: tree.z + 5,
                    vy: Math.random() * 30 + 20,
                    vx: (Math.random() - 0.5) * 20,
                    life: 1.5,
                    size: 2 + Math.random() * 3
                });
            }
        }
    }

    function updateSnowShakes() {
        const dt = 1 / 60;
        for (let i = snowShakes.length - 1; i >= 0; i--) {
            const s = snowShakes[i];
            s.y += s.vy * dt;
            s.x += s.vx * dt;
            s.vy -= 50 * dt;
            s.life -= dt;
            s.z -= game.speed * dt * 0.3;
            
            if (s.life <= 0 || s.y < 0) {
                snowShakes.splice(i, 1);
            }
        }
    }

    function checkCollisions() {
        const playerZ = 0;
        const playerWidth = 12;
        
        for (let i = 0; i < rocks.length; i++) {
            const rock = rocks[i];
            if (Math.abs(rock.z - playerZ) < 15) {
                const dx = Math.abs(rock.x - game.playerX);
                if (dx < rock.size + playerWidth * 0.5) {
                    return true;
                }
            }
        }
        
        for (let i = 0; i < trees.length; i++) {
            const tree = trees[i];
            if (Math.abs(tree.z - playerZ) < 15) {
                const dx = Math.abs(tree.x - game.playerX);
                if (dx < 15 + playerWidth * 0.5) {
                    triggerTreeShake(tree);
                    if (dx < 10) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    function drawSkyAndMountains() {
        const gradient = ctx.createLinearGradient(0, 0, 0, height * 0.6);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.5, '#B0E0E6');
        gradient.addColorStop(1, '#E0F0FF');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height * 0.6);
        
        ctx.fillStyle = '#C8D8E8';
        ctx.beginPath();
        ctx.moveTo(0, height * 0.5);
        for (let x = 0; x <= width; x += 50) {
            const y = height * 0.5 - Math.sin(x * 0.01 + game.distance * 0.001) * 30 - Math.sin(x * 0.005) * 20;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height * 0.6);
        ctx.lineTo(0, height * 0.6);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#D8E8F0';
        ctx.beginPath();
        ctx.moveTo(0, height * 0.55);
        for (let x = 0; x <= width; x += 30) {
            const y = height * 0.55 - Math.sin(x * 0.015 + game.distance * 0.002 + 2) * 20 - Math.abs(Math.sin(x * 0.008)) * 15;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height * 0.6);
        ctx.lineTo(0, height * 0.6);
        ctx.closePath();
        ctx.fill();
    }

    function drawSlope() {
        const bottomY = height;
        const topY = height * 0.6;
        
        const slopeColor = game.slopeLevel === 2 ? '#E8EEF2' : '#F0F5F8';
        ctx.fillStyle = slopeColor;
        
        ctx.beginPath();
        const leftTop = project(-ROAD_WIDTH * 0.6, 500);
        const rightTop = project(ROAD_WIDTH * 0.6, 500);
        const leftBottom = project(-ROAD_WIDTH * 0.8, -20);
        const rightBottom = project(ROAD_WIDTH * 0.8, -20);
        
        ctx.moveTo(leftBottom.x, bottomY);
        ctx.lineTo(leftTop.x, leftTop.y);
        ctx.lineTo(rightTop.x, rightTop.y);
        ctx.lineTo(rightBottom.x, bottomY);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(200, 210, 220, 0.5)';
        ctx.lineWidth = 1;
        
        const stripeOffset = (game.distance * 0.5) % 50;
        for (let z = 500 - stripeOffset; z > -50; z -= 50) {
            const left = project(-ROAD_WIDTH * 0.6, z);
            const right = project(ROAD_WIDTH * 0.6, z);
            ctx.beginPath();
            ctx.moveTo(left.x, left.y);
            ctx.lineTo(right.x, right.y);
            ctx.stroke();
        }
        
        for (let i = -2; i <= 2; i++) {
            const x = i * LANE_WIDTH;
            ctx.strokeStyle = 'rgba(180, 190, 200, 0.3)';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 10]);
            
            ctx.beginPath();
            const top = project(x, 500);
            const bottom = project(x, -20);
            ctx.moveTo(top.x, top.y);
            ctx.lineTo(bottom.x, bottom.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        const edgeLeftTop = project(-ROAD_WIDTH * 0.6, 500);
        const edgeLeftBottom = project(-ROAD_WIDTH * 0.6, -20);
        const edgeRightTop = project(ROAD_WIDTH * 0.6, 500);
        const edgeRightBottom = project(ROAD_WIDTH * 0.6, -20);
        
        ctx.strokeStyle = 'rgba(150, 160, 170, 0.6)';
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.moveTo(edgeLeftTop.x, edgeLeftTop.y);
        ctx.lineTo(edgeLeftBottom.x, edgeLeftBottom.y);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(edgeRightTop.x, edgeRightTop.y);
        ctx.lineTo(edgeRightBottom.x, edgeRightBottom.y);
        ctx.stroke();
    }

    function drawTrees() {
        const sortedTrees = [...trees].sort((a, b) => b.z - a.z);
        
        for (const tree of sortedTrees) {
            if (tree.z < -20 || tree.z > 600) continue;
            
            const base = project(tree.x, tree.z);
            const top = project(tree.x, tree.z + tree.height);
            
            if (base.y < 0 || top.y > height) continue;
            
            const baseWidth = 12 * base.scale;
            const topWidth = 2 * top.scale;
            const treeHeight = base.y - top.y;
            
            let offsetX = 0;
            if (tree.shaking) {
                offsetX = Math.sin(tree.shakeTimer * 30) * 5 * base.scale;
            }
            
            ctx.fillStyle = '#654321';
            ctx.fillRect(base.x - baseWidth * 0.15 + offsetX * 0.3, base.y - treeHeight * 0.15, baseWidth * 0.3, treeHeight * 0.15);
            
            const layers = 3;
            for (let i = 0; i < layers; i++) {
                const layerTopY = top.y + (treeHeight * 0.1) + (treeHeight * 0.25) * i;
                const layerBottomY = top.y + (treeHeight * 0.35) + (treeHeight * 0.22) * i;
                const layerTopWidth = topWidth * (1 + i * 0.5);
                const layerBottomWidth = baseWidth * (0.5 + i * 0.25);
                const layerOffset = offsetX * (1 - i * 0.2);
                
                ctx.fillStyle = `rgb(${30 + i * 10}, ${80 + i * 15}, ${40 + i * 10})`;
                ctx.beginPath();
                ctx.moveTo(base.x - layerTopWidth + layerOffset, layerTopY);
                ctx.lineTo(base.x + layerTopWidth + layerOffset, layerTopY);
                ctx.lineTo(base.x + layerBottomWidth + layerOffset * 0.5, layerBottomY);
                ctx.lineTo(base.x - layerBottomWidth + layerOffset * 0.5, layerBottomY);
                ctx.closePath();
                ctx.fill();
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.beginPath();
                ctx.moveTo(base.x - layerTopWidth + layerOffset, layerTopY);
                ctx.lineTo(base.x + layerTopWidth + layerOffset, layerTopY);
                ctx.lineTo(base.x + layerBottomWidth * 0.5 + layerOffset, layerTopY + (layerBottomY - layerTopY) * 0.3);
                ctx.lineTo(base.x - layerBottomWidth * 0.5 + layerOffset, layerTopY + (layerBottomY - layerTopY) * 0.3);
                ctx.closePath();
                ctx.fill();
            }
        }
    }

    function drawRocks() {
        const sortedRocks = [...rocks].sort((a, b) => b.z - a.z);
        
        for (const rock of sortedRocks) {
            if (rock.z < -20 || rock.z > 600) continue;
            
            const proj = project(rock.x, rock.z);
            const size = rock.size * proj.scale;
            
            if (size < 2) continue;
            
            ctx.fillStyle = '#696969';
            ctx.beginPath();
            ctx.ellipse(proj.x, proj.y, size, size * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#808080';
            ctx.beginPath();
            ctx.ellipse(proj.x - size * 0.2, proj.y - size * 0.2, size * 0.4, size * 0.2, -0.3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.ellipse(proj.x, proj.y - size * 0.45, size * 0.6, size * 0.15, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawGates() {
        const sortedGates = [...gates].sort((a, b) => b.z - a.z);
        
        for (const gate of sortedGates) {
            if (gate.z < -30 || gate.z > 600) continue;
            
            const leftPost = project(gate.x - gate.width / 2, gate.z);
            const rightPost = project(gate.x + gate.width / 2, gate.z);
            const top = project(gate.x, gate.z + 20);
            
            const postWidth = 3 * leftPost.scale;
            
            let color = '#FF4444';
            if (gate.passed) color = '#44FF44';
            if (gate.missed) color = '#888888';
            
            ctx.fillStyle = color;
            ctx.fillRect(leftPost.x - postWidth / 2, leftPost.y, postWidth, top.y - leftPost.y);
            ctx.fillRect(rightPost.x - postWidth / 2, rightPost.y, postWidth, top.y - rightPost.y);
            
            ctx.fillStyle = '#FFFFFF';
            const flagSize = 10 * leftPost.scale;
            ctx.fillRect(leftPost.x, leftPost.y + flagSize, flagSize * 1.5, flagSize);
            ctx.fillRect(rightPost.x - flagSize * 1.5, rightPost.y + flagSize * 2, flagSize * 1.5, flagSize);
            
            ctx.strokeStyle = color;
            ctx.lineWidth = 2 * leftPost.scale;
            ctx.beginPath();
            ctx.moveTo(leftPost.x, top.y);
            ctx.lineTo(rightPost.x, top.y);
            ctx.stroke();
            
            if (gate.passed && gate.z > -10 && gate.z < 30) {
                const glowIntensity = (30 - Math.abs(gate.z - 10)) / 30;
                ctx.strokeStyle = `rgba(100, 255, 100, ${glowIntensity * 0.5})`;
                ctx.lineWidth = 10 * leftPost.scale;
                ctx.beginPath();
                ctx.moveTo(leftPost.x, top.y);
                ctx.lineTo(rightPost.x, top.y);
                ctx.stroke();
            }
        }
    }

    function drawSnowShakes() {
        ctx.fillStyle = 'white';
        for (const s of snowShakes) {
            const proj = project(s.x, s.z);
            const size = s.size * proj.scale;
            const alpha = Math.min(1, s.life);
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y - s.y * proj.scale, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    function drawPlayer() {
        const playerZ = 0;
        const proj = project(game.playerX, playerZ);
        const scale = proj.scale;
        
        if (game.boostTimer > 0) {
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.ellipse(proj.x, proj.y + 20 * scale, 30 * scale, 10 * scale, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        const tilt = game.isTurning ? (game.turnTimer > 0 ? 0.3 : -0.3) * (keys.left ? -1 : 1) : 0;
        
        ctx.save();
        ctx.translate(proj.x, proj.y);
        ctx.rotate(tilt);
        
        ctx.fillStyle = '#FF6B35';
        ctx.beginPath();
        ctx.ellipse(0, 0, 15 * scale, 25 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF8C5A';
        ctx.beginPath();
        ctx.ellipse(0, -5 * scale, 10 * scale, 15 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(0, -25 * scale, 10 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#87CEEB';
        ctx.beginPath();
        ctx.arc(0, -23 * scale, 6 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2F4F4F';
        const skiLength = 40 * scale;
        const skiWidth = 4 * scale;
        
        ctx.fillRect(-12 * scale, 20 * scale, skiWidth, skiLength);
        ctx.fillRect(8 * scale, 20 * scale, skiWidth, skiLength);
        
        ctx.fillStyle = '#DDD';
        ctx.fillRect(-12 * scale, 20 * scale + skiLength * 0.3, skiWidth, 2 * scale);
        ctx.fillRect(8 * scale, 20 * scale + skiLength * 0.3, skiWidth, 2 * scale);
        
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.moveTo(-15 * scale, -10 * scale);
        ctx.lineTo(-25 * scale, 15 * scale);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(15 * scale, -10 * scale);
        ctx.lineTo(25 * scale, 15 * scale);
        ctx.stroke();
        
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(-25 * scale, 15 * scale, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(25 * scale, 15 * scale, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    function drawSnowTrail() {
        const dt = 1 / 60;
        
        if (game.speed > 10) {
            snowTrail.push({
                x: game.playerX,
                z: 5,
                alpha: 0.6,
                width: 20 + game.speed * 0.1
            });
        }
        
        for (let i = snowTrail.length - 1; i >= 0; i--) {
            const trail = snowTrail[i];
            trail.z -= game.speed * dt;
            trail.alpha -= 0.02;
            
            if (trail.alpha <= 0 || trail.z > 300) {
                snowTrail.splice(i, 1);
            }
        }
        
        for (let i = 0; i < snowTrail.length - 1; i++) {
            const t1 = snowTrail[i];
            const t2 = snowTrail[i + 1];
            
            const p1 = project(t1.x, t1.z);
            const p2 = project(t2.x, t2.z);
            
            ctx.strokeStyle = `rgba(200, 210, 220, ${t1.alpha * 0.5})`;
            ctx.lineWidth = t1.width * p1.scale * 0.5;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }
    }

    function drawAvalanche() {
        if (!game.avalanche.active) return;
        
        const avalancheZ = game.avalanche.distance;
        const proj = project(0, avalancheZ);
        
        const gradient = ctx.createLinearGradient(0, proj.y - 100, 0, proj.y + 100);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.3, 'rgba(200, 210, 220, 0.6)');
        gradient.addColorStop(0.7, 'rgba(180, 190, 200, 0.8)');
        gradient.addColorStop(1, 'rgba(150, 160, 170, 0.9)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, proj.y - 100);
        ctx.quadraticCurveTo(width * 0.3, proj.y - 80, width * 0.5, proj.y - 100);
        ctx.quadraticCurveTo(width * 0.7, proj.y - 120, width, proj.y - 80);
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();
        
        for (let i = 0; i < 5; i++) {
            const x = (Math.sin(Date.now() * 0.001 + i) * 0.3 + 0.5) * width;
            const y = proj.y + Math.random() * 50;
            const size = 30 + Math.random() * 50;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.random() * 0.3})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function updatePlayer() {
        const dt = 1 / 60;
        const moveSpeed = 250;
        
        if (game.isTurning) {
            game.turnTimer -= dt;
            if (game.turnTimer <= 0) {
                game.isTurning = false;
            }
        }
        
        if (keys.space && !game.isTurning && game.speed > 50) {
            game.isTurning = true;
            game.turnTimer = 0.5;
            game.speed *= 0.7;
            
            if (keys.left) {
                game.targetPlayerX -= 30;
            } else if (keys.right) {
                game.targetPlayerX += 30;
            }
        }
        
        let dir = 0;
        if (keys.left) dir -= 1;
        if (keys.right) dir += 1;
        
        const speedMultiplier = game.isTurning ? 0.3 : 1;
        game.targetPlayerX += dir * moveSpeed * dt * speedMultiplier;
        
        const maxX = ROAD_WIDTH * 0.55;
        game.targetPlayerX = Math.max(-maxX, Math.min(maxX, game.targetPlayerX));
        
        game.playerX += (game.targetPlayerX - game.playerX) * 10 * dt;
    }

    function updateSpeed() {
        const dt = 1 / 60;
        
        let targetSpeed = game.baseSpeed * (game.slopeLevel === 2 ? 2 : 1);
        
        if (game.boostTimer > 0) {
            game.boostTimer -= dt;
            targetSpeed *= 1.5;
        }
        
        if (game.slowTimer > 0) {
            game.slowTimer -= dt;
            targetSpeed *= 0.6;
        }
        
        if (game.isTurning) {
            targetSpeed *= 0.7;
        }
        
        const accel = game.slopeLevel === 2 ? 80 : 40;
        if (game.speed < targetSpeed) {
            game.speed += accel * dt;
        } else {
            game.speed -= accel * 2 * dt;
        }
        
        game.speed = Math.max(30, game.speed);
        
        if (game.speed > game.maxSpeed) {
            game.maxSpeed = game.speed;
        }
    }

    function updateSlope() {
        const dt = 1 / 60;
        game.slopeZ += game.speed * dt;
        game.distance += game.speed * dt * 0.1;
        
        if (game.slopeZ > game.slopeLength) {
            game.slopeZ = 0;
            game.slopeLevel = game.slopeLevel === 1 ? 2 : 1;
        }
        
        if (game.slopeLevel === 1 && game.slopeZ > game.slopeLength * 0.7) {
            slopeValue.textContent = '变陡中...';
            slopeValue.style.color = '#FFB74D';
        } else if (game.slopeLevel === 2 && game.slopeZ > game.slopeLength * 0.7) {
            slopeValue.textContent = '变缓中...';
            slopeValue.style.color = '#81C784';
        } else {
            slopeValue.textContent = game.slopeLevel === 2 ? '陡坡' : '缓坡';
            slopeValue.style.color = game.slopeLevel === 2 ? '#FF6B6B' : '#4CAF50';
        }
        
        game.score += Math.floor(game.speed * dt * 0.1);
    }

    function updateAvalanche() {
        const dt = 1 / 60;
        const av = game.avalanche;
        
        if (!av.active) {
            av.timer += dt;
            if (av.timer >= av.nextAvalanche) {
                av.active = true;
                av.distance = 80;
                av.timer = 0;
                avalancheWarning.classList.remove('hidden');
            }
        } else {
            av.distance += (av.speed - game.speed) * dt * 0.5;
            
            if (av.distance > 200) {
                av.distance = 200;
            }
            
            if (av.distance < 10) {
                gameOver();
                return;
            }
            
            const progress = (av.distance / 100) * 100;
            avalancheProgress.style.width = Math.max(0, Math.min(100, progress)) + '%';
            
            if (game.speed > av.speed * 1.2 && av.distance > 150) {
                av.active = false;
                av.nextAvalanche = 1500 + Math.random() * 1000;
                avalancheWarning.classList.add('hidden');
                game.score += 200;
            }
        }
    }

    function updateHUD() {
        scoreValue.textContent = Math.floor(game.score);
        speedValue.textContent = Math.floor(game.speed * 0.36);
        distanceValue.textContent = Math.floor(game.distance);
    }

    function resetGame() {
        game.score = 0;
        game.distance = 0;
        game.speed = game.baseSpeed;
        game.maxSpeed = game.baseSpeed;
        game.playerX = 0;
        game.targetPlayerX = 0;
        game.playerLane = 2;
        game.gatesPassed = 0;
        game.slopeLevel = 1;
        game.slopeZ = 0;
        game.isTurning = false;
        game.turnTimer = 0;
        game.boostTimer = 0;
        game.slowTimer = 0;
        game.avalanche.active = false;
        game.avalanche.distance = 50;
        game.avalanche.timer = 0;
        game.avalanche.nextAvalanche = 2000 + Math.random() * 1000;
        
        trees.length = 0;
        rocks.length = 0;
        gates.length = 0;
        snowShakes.length = 0;
        snowTrail.length = 0;
        
        avalancheWarning.classList.add('hidden');
        
        initSnowflakes();
        
        for (let i = 0; i < 15; i++) {
            const side = Math.random() < 0.5 ? -1 : 1;
            const offset = ROAD_WIDTH * 0.5 + 20 + Math.random() * 40;
            trees.push({
                x: side * offset,
                z: 100 + i * 40 + Math.random() * 20,
                type: Math.floor(Math.random() * 3),
                height: 30 + Math.random() * 20,
                shaking: false,
                shakeTimer: 0
            });
        }
    }

    function gameOver() {
        gameState = 'gameover';
        cancelAnimationFrame(animationId);
        
        finalScore.textContent = Math.floor(game.score);
        finalDistance.textContent = Math.floor(game.distance) + ' m';
        finalMaxSpeed.textContent = Math.floor(game.maxSpeed * 0.36) + ' km/h';
        finalGates.textContent = game.gatesPassed + ' 个';
        
        avalancheWarning.classList.add('hidden');
        gameOverScreen.classList.remove('hidden');
        submitResult.classList.add('hidden');
        submitScoreBtn.disabled = false;
        submitScoreBtn.textContent = '提交成绩';
    }

    function startGame() {
        const playerName = playerNameInput.value.trim() || '匿名玩家';
        localStorage.setItem('skiPlayerName', playerName);
        
        resetGame();
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        rankingScreen.classList.add('hidden');
        gameState = 'playing';
        
        gameLoop();
    }

    function gameLoop() {
        if (gameState !== 'playing') return;
        
        updatePlayer();
        updateSpeed();
        updateSlope();
        updateSnowflakes();
        updateSnowShakes();
        updateSnowTrail();
        spawnEnvironment();
        updateEnvironment();
        updateAvalanche();
        updateHUD();
        
        if (checkCollisions()) {
            gameOver();
            return;
        }
        
        render();
        
        animationId = requestAnimationFrame(gameLoop);
    }

    function render() {
        ctx.clearRect(0, 0, width, height);
        
        drawSkyAndMountains();
        drawSlope();
        drawSnowTrail();
        drawTrees();
        drawRocks();
        drawGates();
        drawSnowShakes();
        drawAvalanche();
        drawSnowflakes();
        drawPlayer();
    }

    async function submitScore() {
        const playerName = playerNameInput.value.trim() || '匿名玩家';
        
        submitScoreBtn.disabled = true;
        submitScoreBtn.textContent = '提交中...';
        
        try {
            const response = await fetch('/api/skigame/score/set', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    player_name: playerName,
                    score: Math.floor(game.score),
                    distance: Math.floor(game.distance),
                    max_speed: Math.floor(game.maxSpeed * 0.36),
                    gates_passed: game.gatesPassed,
                    slope_level: game.slopeLevel
                })
            });
            
            const result = await response.json();
            
            if (result.code === 0) {
                submitResult.textContent = '✓ 成绩提交成功！';
                submitResult.className = 'submit-result success';
            } else {
                submitResult.textContent = '✗ 提交失败: ' + result.message;
                submitResult.className = 'submit-result error';
            }
        } catch (e) {
            submitResult.textContent = '✗ 网络错误，请稍后重试';
            submitResult.className = 'submit-result error';
        }
        
        submitResult.classList.remove('hidden');
    }

    async function showRanking() {
        rankingScreen.classList.remove('hidden');
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        
        const rankingList = document.getElementById('ranking-list');
        rankingList.innerHTML = '<div class="ranking-empty">加载中...</div>';
        
        try {
            const response = await fetch('/api/skigame/score/toplist?limit=20');
            const result = await response.json();
            
            if (result.code === 0 && result.data.items.length > 0) {
                let html = '';
                result.data.items.forEach((item, index) => {
                    let rankClass = '';
                    if (index === 0) rankClass = 'gold';
                    else if (index === 1) rankClass = 'silver';
                    else if (index === 2) rankClass = 'bronze';
                    
                    html += `
                        <div class="ranking-item">
                            <span class="ranking-rank ${rankClass}">${index + 1}</span>
                            <span class="ranking-name">${escapeHtml(item.player_name)}</span>
                            <span class="ranking-score">${item.score}分</span>
                            <span class="ranking-distance">${item.distance}m</span>
                        </div>
                    `;
                });
                rankingList.innerHTML = html;
            } else {
                rankingList.innerHTML = '<div class="ranking-empty">暂无记录，快来创造第一个记录吧！</div>';
            }
        } catch (e) {
            rankingList.innerHTML = '<div class="ranking-empty">加载失败，请稍后重试</div>';
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function handleKeyDown(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            keys.left = true;
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            keys.right = true;
        }
        if (e.key === ' ') {
            keys.space = true;
            e.preventDefault();
        }
        if (e.key === 'Enter' && gameState === 'menu') {
            startGame();
        }
    }

    function handleKeyUp(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            keys.left = false;
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            keys.right = false;
        }
        if (e.key === ' ') {
            keys.space = false;
        }
    }

    function handleTouchStart(e) {
        const touch = e.touches[0];
        const x = touch.clientX;
        
        if (x < width / 2) {
            keys.left = true;
            keys.right = false;
        } else {
            keys.right = true;
            keys.left = false;
        }
    }

    function handleTouchEnd() {
        keys.left = false;
        keys.right = false;
    }

    function init() {
        resize();
        window.addEventListener('resize', resize);
        
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        
        canvas.addEventListener('touchstart', handleTouchStart);
        canvas.addEventListener('touchend', handleTouchEnd);
        
        startBtn.addEventListener('click', startGame);
        restartBtn.addEventListener('click', startGame);
        backMenuBtn.addEventListener('click', () => {
            gameOverScreen.classList.add('hidden');
            startScreen.classList.remove('hidden');
            gameState = 'menu';
        });
        showRankingBtn.addEventListener('click', showRanking);
        backFromRankingBtn.addEventListener('click', () => {
            rankingScreen.classList.add('hidden');
            startScreen.classList.remove('hidden');
        });
        submitScoreBtn.addEventListener('click', submitScore);
        
        const savedName = localStorage.getItem('skiPlayerName');
        if (savedName) {
            playerNameInput.value = savedName;
        }
        
        initSnowflakes();
        gameState = 'menu';
        
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, width, height);
    }

    init();
})();
