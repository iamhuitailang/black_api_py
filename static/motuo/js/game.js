const MotoRaceGame = (function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const CONFIG = {
        canvasWidth: 480,
        canvasHeight: 800,
        lanes: 4,
        trackLength: 1000,
        startSpeed: 70,
        maxSpeed: 170,
        speedIncreaseRate: 8,
        laneChangeSpeed: 6,
        collisionSlowdown: 0.5,
        collisionDuration: 700,
        metersToPixels: 1.5,
        playerScreenY: 650,
        roadLeft: 30,
        roadRight: 450
    };

    const ENEMY_CONFIG = [
        { name: '蓝车', color: '#4477ff', speedMultiplier: 0.88, type: 'follower' },
        { name: '红车', color: '#ff4444', speedMultiplier: 0.82, type: 'stable' },
        { name: '绿车', color: '#44cc44', speedMultiplier: 0.76, type: 'slow' }
    ];

    let gameState = {
        status: 'menu',
        countdown: 0,
        playerDistance: 0,
        speed: CONFIG.startSpeed,
        maxSpeed: CONFIG.startSpeed,
        baseSpeed: CONFIG.startSpeed,
        overtakes: 0,
        rank: 1,
        startTime: 0,
        elapsedTime: 0,
        player: null,
        enemies: [],
        traffic: [],
        background: null,
        isPaused: false,
        lastTrafficSpawn: 0
    };

    let keys = {
        left: false,
        right: false
    };

    let lastTime = 0;
    let animationId = null;
    let autoSaveInterval = null;

    const UI = {
        startScreen: document.getElementById('startScreen'),
        countdownScreen: document.getElementById('countdownScreen'),
        pauseScreen: document.getElementById('pauseScreen'),
        gameOverScreen: document.getElementById('gameOverScreen'),
        startBtn: document.getElementById('startBtn'),
        pauseBtn: document.getElementById('pauseBtn'),
        restartBtn: document.getElementById('restartBtn'),
        resumeBtn: document.getElementById('resumeBtn'),
        pauseRestartBtn: document.getElementById('pauseRestartBtn'),
        playAgainBtn: document.getElementById('playAgainBtn'),
        countdownText: document.getElementById('countdownText'),
        distanceDisplay: document.getElementById('distance'),
        speedDisplay: document.getElementById('speed'),
        overtakesDisplay: document.getElementById('overtakes'),
        rankDisplay: document.getElementById('rank'),
        resultTitle: document.getElementById('resultTitle'),
        finalRank: document.getElementById('finalRank'),
        finalTime: document.getElementById('finalTime'),
        finalOvertakes: document.getElementById('finalOvertakes'),
        finalMaxSpeed: document.getElementById('finalMaxSpeed'),
        bestRank: document.getElementById('bestRank'),
        bestTime: document.getElementById('bestTime'),
        bestOvertakes: document.getElementById('bestOvertakes'),
        totalRaces: document.getElementById('totalRaces')
    };

    function getLaneX(lane) {
        const roadWidth = CONFIG.roadRight - CONFIG.roadLeft;
        const laneWidth = roadWidth / CONFIG.lanes;
        return CONFIG.roadLeft + laneWidth * lane + laneWidth / 2;
    }

    function distanceToScreenY(distance, playerDistance) {
        const diff = distance - playerDistance;
        return CONFIG.playerScreenY - diff * CONFIG.metersToPixels;
    }

    class Player {
        constructor() {
            this.lane = Math.floor(CONFIG.lanes / 2);
            this.targetLane = this.lane;
            this.x = getLaneX(this.lane);
            this.screenY = CONFIG.playerScreenY;
            this.width = 40;
            this.height = 70;
            this.isSlowed = false;
            this.slowEndTime = 0;
            this.exhaustParticles = [];
            this.speed = CONFIG.startSpeed;
        }

        update(deltaTime, gameSpeed, isSlowed) {
            this.isSlowed = isSlowed;
            if (this.isSlowed && Date.now() > this.slowEndTime) {
                this.isSlowed = false;
            }

            if (this.lane !== this.targetLane) {
                const targetX = getLaneX(this.targetLane);
                const diff = targetX - this.x;
                const moveSpeed = CONFIG.laneChangeSpeed * (deltaTime / 16);
                
                if (Math.abs(diff) < moveSpeed) {
                    this.x = targetX;
                    this.lane = this.targetLane;
                } else {
                    this.x += Math.sign(diff) * moveSpeed;
                }
            }

            this.updateExhaust(deltaTime, gameSpeed);
        }

        updateExhaust(deltaTime, speed) {
            const intensity = speed / 100;
            if (Math.random() < 0.4 * intensity) {
                this.exhaustParticles.push({
                    x: this.x + (Math.random() - 0.5) * 12,
                    y: this.screenY + this.height / 2 + 5,
                    size: 3 + Math.random() * 4,
                    alpha: 0.7 + Math.random() * 0.3,
                    life: 1
                });
            }

            for (let i = this.exhaustParticles.length - 1; i >= 0; i--) {
                const p = this.exhaustParticles[i];
                p.y += 2.5 * (deltaTime / 16);
                p.alpha -= 0.025 * (deltaTime / 16);
                p.life -= 0.02 * (deltaTime / 16);
                p.size += 0.08 * (deltaTime / 16);
                
                if (p.life <= 0 || p.alpha <= 0) {
                    this.exhaustParticles.splice(i, 1);
                }
            }
        }

        applySlowdown() {
            if (!this.isSlowed) {
                this.isSlowed = true;
                this.slowEndTime = Date.now() + CONFIG.collisionDuration;
            }
        }

        draw(ctx) {
            for (const p of this.exhaustParticles) {
                if (p.y < CONFIG.canvasHeight) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(160, 160, 160, ${p.alpha})`;
                    ctx.fill();
                }
            }

            ctx.save();
            ctx.translate(this.x, this.screenY);

            const wobble = Math.sin(Date.now() / 80) * 1.5;
            ctx.rotate(wobble * Math.PI / 180);

            ctx.fillStyle = '#ff6b6b';
            ctx.beginPath();
            ctx.ellipse(0, 8, 16, 22, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ff8787';
            ctx.beginPath();
            ctx.ellipse(-4, 3, 7, 10, -0.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ff4757';
            ctx.beginPath();
            ctx.ellipse(0, -18, 13, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ff3333';
            ctx.beginPath();
            ctx.ellipse(0, 22, 10, 12, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#2c3e50';
            ctx.beginPath();
            ctx.arc(0, -28, 12, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(0, -33, 8, Math.PI, 0);
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.ellipse(-4, -30, 5, 4, -0.3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#2c3e50';
            ctx.beginPath();
            ctx.arc(-8, 32, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(8, 32, 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#555';
            ctx.beginPath();
            ctx.arc(-8, 32, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(8, 32, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#f39c12';
            ctx.beginPath();
            ctx.ellipse(0, -42, 5, 7, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(-18, 0, 7, 13);
            ctx.fillRect(11, 0, 7, 13);

            if (this.isSlowed) {
                const pulse = Math.sin(Date.now() / 50) * 0.3 + 0.7;
                ctx.strokeStyle = `rgba(255, 0, 0, ${pulse})`;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(0, 5, 32, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();
        }
    }

    class Enemy {
        constructor(config, lane, startDistance) {
            this.name = config.name;
            this.color = config.color;
            this.speedMultiplier = config.speedMultiplier;
            this.type = config.type;
            this.lane = lane;
            this.targetLane = lane;
            this.x = getLaneX(lane);
            this.distance = startDistance;
            this.width = 36;
            this.height = 65;
            this.laneChangeTimer = 0;
            this.lastLaneChange = 0;
            this.wasPassed = false;
        }

        update(deltaTime, playerSpeed, playerDistance, playerLane) {
            const effectiveSpeed = playerSpeed * this.speedMultiplier;
            this.distance += effectiveSpeed * (deltaTime / 1000);

            this.laneChangeTimer += deltaTime;
            if (this.laneChangeTimer - this.lastLaneChange > 2500 + Math.random() * 2000) {
                this.decideLaneChange(playerLane, playerDistance);
                this.lastLaneChange = this.laneChangeTimer;
            }

            if (this.lane !== this.targetLane) {
                const targetX = getLaneX(this.targetLane);
                const diff = targetX - this.x;
                const moveSpeed = 3.5 * (deltaTime / 16);
                
                if (Math.abs(diff) < moveSpeed) {
                    this.x = targetX;
                    this.lane = this.targetLane;
                } else {
                    this.x += Math.sign(diff) * moveSpeed;
                }
            }
        }

        decideLaneChange(playerLane, playerDistance) {
            const directions = [];
            if (this.lane > 0) directions.push(-1);
            if (this.lane < CONFIG.lanes - 1) directions.push(1);
            
            if (directions.length === 0) return;

            const distDiff = this.distance - playerDistance;
            
            if (this.type === 'follower' && Math.abs(distDiff) < 80) {
                if (playerLane > this.lane && this.lane < CONFIG.lanes - 1) {
                    this.targetLane = this.lane + 1;
                } else if (playerLane < this.lane && this.lane > 0) {
                    this.targetLane = this.lane - 1;
                } else {
                    const direction = directions[Math.floor(Math.random() * directions.length)];
                    this.targetLane = this.lane + direction;
                }
            } else {
                const direction = directions[Math.floor(Math.random() * directions.length)];
                this.targetLane = this.lane + direction;
            }
        }

        getScreenY(playerDistance) {
            return distanceToScreenY(this.distance, playerDistance);
        }

        draw(ctx, playerDistance) {
            const screenY = this.getScreenY(playerDistance);
            
            if (screenY < -80 || screenY > CONFIG.canvasHeight + 80) {
                return;
            }

            ctx.save();
            ctx.translate(this.x, screenY);

            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.ellipse(0, 8, 14, 20, 0, 0, Math.PI * 2);
            ctx.fill();

            const lightColor = this.lightenColor(this.color, 25);
            ctx.fillStyle = lightColor;
            ctx.beginPath();
            ctx.ellipse(-3, 3, 6, 9, -0.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = this.darkenColor(this.color, 15);
            ctx.beginPath();
            ctx.ellipse(0, -16, 11, 9, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = this.darkenColor(this.color, 25);
            ctx.beginPath();
            ctx.ellipse(0, 20, 9, 11, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#2c3e50';
            ctx.beginPath();
            ctx.arc(-7, 28, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(7, 28, 7, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#555';
            ctx.beginPath();
            ctx.arc(-7, 28, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(7, 28, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.name, 0, -28);

            ctx.restore();
        }

        lightenColor(color, percent) {
            const num = parseInt(color.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = Math.min(255, (num >> 16) + amt);
            const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
            const B = Math.min(255, (num & 0x0000FF) + amt);
            return `rgb(${R}, ${G}, ${B})`;
        }

        darkenColor(color, percent) {
            const num = parseInt(color.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = Math.max(0, (num >> 16) - amt);
            const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
            const B = Math.max(0, (num & 0x0000FF) - amt);
            return `rgb(${R}, ${G}, ${B})`;
        }
    }

    class Traffic {
        constructor(lane, startDistance) {
            this.lane = lane;
            this.x = getLaneX(lane);
            this.distance = startDistance;
            this.width = 44;
            this.height = 80;
            this.oncomingSpeed = 70;
            this.headlightOn = true;
            this.headlightTimer = 0;
        }

        update(deltaTime, playerSpeed, playerDistance) {
            const relativeSpeed = playerSpeed + this.oncomingSpeed;
            this.distance -= relativeSpeed * (deltaTime / 1000);

            this.headlightTimer += deltaTime;
            if (this.headlightTimer > 400) {
                this.headlightOn = !this.headlightOn;
                this.headlightTimer = 0;
            }
        }

        getScreenY(playerDistance) {
            return distanceToScreenY(this.distance, playerDistance);
        }

        reset(playerDistance) {
            const visibleMin = playerDistance + 150;
            const visibleMax = playerDistance + 700;
            this.distance = visibleMin + Math.random() * (visibleMax - visibleMin);
            this.lane = Math.floor(Math.random() * CONFIG.lanes);
            this.x = getLaneX(this.lane);
        }

        draw(ctx, playerDistance) {
            const screenY = this.getScreenY(playerDistance);
            
            if (screenY < -120 || screenY > CONFIG.canvasHeight + 120) {
                return;
            }

            ctx.save();
            ctx.translate(this.x, screenY);

            ctx.fillStyle = '#7f8c8d';
            ctx.fillRect(-18, -36, 36, 72);

            ctx.fillStyle = '#95a5a6';
            ctx.fillRect(-16, -32, 32, 32);

            ctx.fillStyle = '#5d6d7e';
            ctx.fillRect(-13, -40, 26, 12);

            ctx.fillStyle = '#34495e';
            ctx.fillRect(-10, -38, 20, 8);

            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(-22, -28, 7, 18);
            ctx.fillRect(15, -28, 7, 18);
            ctx.fillRect(-22, 14, 7, 18);
            ctx.fillRect(15, 14, 7, 18);

            ctx.fillStyle = '#1a252f';
            ctx.fillRect(-20, -26, 4, 14);
            ctx.fillRect(16, -26, 4, 14);
            ctx.fillRect(-20, 16, 4, 14);
            ctx.fillRect(16, 16, 4, 14);

            if (this.headlightOn) {
                const gradient = ctx.createRadialGradient(0, -42, 0, 0, -42, 35);
                gradient.addColorStop(0, 'rgba(255, 255, 200, 0.5)');
                gradient.addColorStop(0.6, 'rgba(255, 255, 150, 0.2)');
                gradient.addColorStop(1, 'rgba(255, 255, 100, 0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.moveTo(-8, -42);
                ctx.lineTo(-22, -82);
                ctx.lineTo(22, -82);
                ctx.lineTo(8, -42);
                ctx.closePath();
                ctx.fill();
            }

            ctx.fillStyle = this.headlightOn ? '#ffffcc' : '#cc9';
            ctx.beginPath();
            ctx.arc(-8, -40, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(8, -40, 3.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(-8, 36, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(8, 36, 3.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    class Background {
        constructor() {
            this.roadOffset = 0;
            this.treePositions = [];
            this.lightPositions = [];
            
            for (let i = 0; i < 25; i++) {
                this.treePositions.push({
                    side: Math.random() > 0.5 ? 'left' : 'right',
                    distance: i * 50,
                    type: Math.floor(Math.random() * 3)
                });
            }
            for (let i = 0; i < 15; i++) {
                this.lightPositions.push({
                    side: Math.random() > 0.5 ? 'left' : 'right',
                    distance: i * 80 + 25
                });
            }
        }

        update(deltaTime, speed) {
            this.roadOffset += speed * (deltaTime / 1000) * 8;
            if (this.roadOffset > 50) {
                this.roadOffset -= 50;
            }
        }

        draw(ctx, playerDistance) {
            ctx.fillStyle = '#27ae60';
            ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

            ctx.fillStyle = '#34495e';
            ctx.fillRect(CONFIG.roadLeft, 0, CONFIG.roadRight - CONFIG.roadLeft, CONFIG.canvasHeight);

            ctx.fillStyle = '#fff';
            ctx.fillRect(CONFIG.roadLeft - 5, 0, 5, CONFIG.canvasHeight);
            ctx.fillRect(CONFIG.roadRight, 0, 5, CONFIG.canvasHeight);

            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.setLineDash([25, 18]);
            
            const roadWidth = CONFIG.roadRight - CONFIG.roadLeft;
            const laneWidth = roadWidth / CONFIG.lanes;
            for (let i = 1; i < CONFIG.lanes; i++) {
                const x = CONFIG.roadLeft + laneWidth * i;
                ctx.beginPath();
                ctx.moveTo(x, -this.roadOffset);
                ctx.lineTo(x, CONFIG.canvasHeight);
                ctx.stroke();
            }
            
            ctx.setLineDash([]);

            for (const tree of this.treePositions) {
                this.drawTree(ctx, tree, playerDistance);
            }

            for (const light of this.lightPositions) {
                this.drawStreetLight(ctx, light, playerDistance);
            }
        }

        drawTree(ctx, tree, playerDistance) {
            const screenY = distanceToScreenY(tree.distance, playerDistance);
            
            if (screenY < -60 || screenY > CONFIG.canvasHeight + 60) {
                return;
            }

            const x = tree.side === 'left' ? 8 : CONFIG.roadRight + 8;

            ctx.fillStyle = '#5d4037';
            ctx.fillRect(x + 6, screenY + 22, 6, 32);

            const colors = ['#27ae60', '#2ecc71', '#1abc9c'];
            ctx.fillStyle = colors[tree.type];
            
            ctx.beginPath();
            ctx.moveTo(x + 9, screenY);
            ctx.lineTo(x, screenY + 28);
            ctx.lineTo(x + 18, screenY + 28);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(x + 9, screenY + 12);
            ctx.lineTo(x - 3, screenY + 40);
            ctx.lineTo(x + 21, screenY + 40);
            ctx.closePath();
            ctx.fill();
        }

        drawStreetLight(ctx, light, playerDistance) {
            const screenY = distanceToScreenY(light.distance, playerDistance);
            
            if (screenY < -80 || screenY > CONFIG.canvasHeight + 80) {
                return;
            }

            const x = light.side === 'left' ? 3 : CONFIG.roadRight + 2;
            const direction = light.side === 'left' ? 1 : -1;

            ctx.fillStyle = '#555';
            ctx.fillRect(x, screenY + 16, 5, 64);

            ctx.fillRect(x + direction * 2, screenY + 6, Math.abs(direction) * 20, 4);

            const lightGradient = ctx.createRadialGradient(
                x + direction * 20, screenY + 16, 0,
                x + direction * 20, screenY + 16, 16
            );
            lightGradient.addColorStop(0, 'rgba(255, 255, 200, 0.7)');
            lightGradient.addColorStop(1, 'rgba(255, 255, 150, 0)');
            ctx.fillStyle = lightGradient;
            ctx.beginPath();
            ctx.arc(x + direction * 20, screenY + 16, 12, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x + direction * 20, screenY + 16, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initGame() {
        gameState.player = new Player();
        gameState.enemies = [];
        gameState.traffic = [];
        gameState.background = new Background();
        gameState.playerDistance = 0;
        gameState.speed = CONFIG.startSpeed;
        gameState.baseSpeed = CONFIG.startSpeed;
        gameState.maxSpeed = CONFIG.startSpeed;
        gameState.overtakes = 0;
        gameState.rank = 1;
        gameState.startTime = 0;
        gameState.elapsedTime = 0;
        gameState.isPaused = false;
        gameState.countdown = 3;
        gameState.lastTrafficSpawn = 0;

        const usedLanes = new Set([gameState.player.lane]);
        
        const enemyStartDistances = [
            35 + Math.random() * 15,
            18 + Math.random() * 12,
            5 + Math.random() * 10
        ];
        
        for (let i = 0; i < ENEMY_CONFIG.length; i++) {
            let lane;
            do {
                lane = Math.floor(Math.random() * CONFIG.lanes);
            } while (usedLanes.has(lane) && usedLanes.size < CONFIG.lanes);
            usedLanes.add(lane);
            
            gameState.enemies.push(new Enemy(ENEMY_CONFIG[i], lane, enemyStartDistances[i]));
        }

        for (let i = 0; i < 4; i++) {
            const lane = Math.floor(Math.random() * CONFIG.lanes);
            const startDistance = 150 + i * 120 + Math.random() * 80;
            gameState.traffic.push(new Traffic(lane, startDistance));
        }
    }

    function startGame() {
        initGame();
        hideAllOverlays();
        UI.countdownScreen.style.display = 'flex';
        gameState.status = 'countdown';
        
        const countdownInterval = setInterval(() => {
            gameState.countdown--;
            if (gameState.countdown > 0) {
                UI.countdownText.textContent = gameState.countdown;
            } else if (gameState.countdown === 0) {
                UI.countdownText.textContent = 'GO!';
            } else {
                clearInterval(countdownInterval);
                hideAllOverlays();
                gameState.status = 'playing';
                gameState.startTime = Date.now();
                UI.pauseBtn.style.display = 'inline-block';
                UI.restartBtn.style.display = 'inline-block';
                lastTime = performance.now();
                gameLoop();
                startAutoSave();
            }
        }, 1000);
    }

    function pauseGame() {
        if (gameState.status !== 'playing') return;
        gameState.isPaused = true;
        gameState.status = 'paused';
        UI.pauseScreen.style.display = 'flex';
    }

    function resumeGame() {
        gameState.isPaused = false;
        gameState.status = 'playing';
        hideAllOverlays();
        lastTime = performance.now();
        gameLoop();
    }

    function endGame(won) {
        gameState.status = 'gameover';
        cancelAnimationFrame(animationId);
        stopAutoSave();
        
        const rank = calculateRank();
        const timeSeconds = gameState.elapsedTime / 1000;
        
        GameData.updateRaceResult(rank, timeSeconds, gameState.overtakes);
        
        UI.resultTitle.textContent = won ? '🏆 恭喜胜利！' : '😢 比赛失败';
        UI.resultTitle.style.color = won ? '#ffd700' : '#ff6b6b';
        
        UI.finalRank.textContent = rank;
        UI.finalTime.textContent = GameData.formatTime(timeSeconds);
        UI.finalOvertakes.textContent = gameState.overtakes;
        UI.finalMaxSpeed.textContent = Math.round(gameState.maxSpeed);
        
        const stats = GameData.getStats();
        UI.bestRank.textContent = stats.bestRank !== null ? stats.bestRank : '-';
        UI.bestTime.textContent = GameData.formatTime(stats.bestTime);
        UI.bestOvertakes.textContent = stats.bestOvertakes || '-';
        UI.totalRaces.textContent = stats.totalRaces;
        
        hideAllOverlays();
        UI.gameOverScreen.style.display = 'flex';
        UI.pauseBtn.style.display = 'none';
        UI.restartBtn.style.display = 'none';
        
        GameData.clearGameState();
    }

    function calculateRank() {
        let rank = 1;
        const playerDist = gameState.playerDistance;
        for (const enemy of gameState.enemies) {
            if (enemy.distance > playerDist) {
                rank++;
            }
        }
        return rank;
    }

    function hideAllOverlays() {
        UI.startScreen.style.display = 'none';
        UI.countdownScreen.style.display = 'none';
        UI.pauseScreen.style.display = 'none';
        UI.gameOverScreen.style.display = 'none';
    }

    function gameLoop(currentTime = performance.now()) {
        if (gameState.status !== 'playing') return;

        const deltaTime = Math.min(currentTime - lastTime, 50);
        lastTime = currentTime;

        update(deltaTime);
        render();
        updateUI();

        animationId = requestAnimationFrame(gameLoop);
    }

    function update(deltaTime) {
        if (gameState.baseSpeed < CONFIG.maxSpeed) {
            gameState.baseSpeed += CONFIG.speedIncreaseRate * (deltaTime / 1000);
            if (gameState.baseSpeed > CONFIG.maxSpeed) {
                gameState.baseSpeed = CONFIG.maxSpeed;
            }
        }

        const isSlowed = gameState.player.isSlowed;
        if (isSlowed) {
            gameState.speed = gameState.baseSpeed * CONFIG.collisionSlowdown;
        } else {
            gameState.speed = gameState.baseSpeed;
        }
        
        if (gameState.speed > gameState.maxSpeed) {
            gameState.maxSpeed = gameState.speed;
        }

        gameState.elapsedTime = Date.now() - gameState.startTime;
        gameState.playerDistance += gameState.speed * (deltaTime / 1000);

        if (keys.left) {
            if (gameState.player.targetLane > 0) {
                gameState.player.targetLane--;
            }
            keys.left = false;
        }
        if (keys.right) {
            if (gameState.player.targetLane < CONFIG.lanes - 1) {
                gameState.player.targetLane++;
            }
            keys.right = false;
        }

        gameState.player.update(deltaTime, gameState.speed, isSlowed);
        gameState.background.update(deltaTime, gameState.speed);

        for (const enemy of gameState.enemies) {
            const wasAhead = enemy.distance > gameState.playerDistance;
            enemy.update(deltaTime, gameState.baseSpeed, gameState.playerDistance, gameState.player.lane);
            
            if (wasAhead && enemy.distance < gameState.playerDistance && !enemy.wasPassed) {
                gameState.overtakes++;
                enemy.wasPassed = true;
            }
            if (!wasAhead && enemy.distance > gameState.playerDistance) {
                enemy.wasPassed = false;
            }
        }

        for (const traffic of gameState.traffic) {
            traffic.update(deltaTime, gameState.baseSpeed, gameState.playerDistance);
            
            const screenY = traffic.getScreenY(gameState.playerDistance);
            if (screenY > CONFIG.canvasHeight + 150) {
                traffic.reset(gameState.playerDistance);
            }
            
            if (checkCollision(gameState.player, traffic)) {
                gameState.player.applySlowdown();
            }
        }

        gameState.rank = calculateRank();

        if (gameState.playerDistance >= CONFIG.trackLength) {
            endGame(gameState.rank === 1);
            return;
        }

        for (const enemy of gameState.enemies) {
            if (enemy.distance >= CONFIG.trackLength) {
                endGame(false);
                return;
            }
        }
    }

    function checkCollision(player, traffic) {
        const trafficScreenY = traffic.getScreenY(gameState.playerDistance);
        
        if (trafficScreenY < -50 || trafficScreenY > CONFIG.canvasHeight + 50) {
            return false;
        }

        const dx = Math.abs(player.x - traffic.x);
        const dy = Math.abs(player.screenY - trafficScreenY);
        
        const minDistX = (player.width + traffic.width) / 2 - 8;
        const minDistY = (player.height + traffic.height) / 2 - 8;
        
        return dx < minDistX && dy < minDistY;
    }

    function render() {
        ctx.clearRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

        gameState.background.draw(ctx, gameState.playerDistance);

        drawFinishLine(ctx);

        for (const traffic of gameState.traffic) {
            traffic.draw(ctx, gameState.playerDistance);
        }

        const renderList = [...gameState.enemies];
        renderList.sort((a, b) => {
            return b.distance - a.distance;
        });

        for (const enemy of renderList) {
            enemy.draw(ctx, gameState.playerDistance);
        }

        gameState.player.draw(ctx);

        drawProgressBar(ctx);
    }

    function drawFinishLine(ctx) {
        const finishDistance = CONFIG.trackLength;
        const finishScreenY = distanceToScreenY(finishDistance, gameState.playerDistance);
        
        if (finishScreenY < -80 || finishScreenY > CONFIG.canvasHeight + 80) {
            return;
        }

        ctx.save();
        ctx.translate(CONFIG.roadLeft, finishScreenY);
        
        const squareSize = 14;
        const roadWidth = CONFIG.roadRight - CONFIG.roadLeft;
        const cols = Math.floor(roadWidth / squareSize);
        
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < 2; j++) {
                ctx.fillStyle = (i + j) % 2 === 0 ? '#000' : '#fff';
                ctx.fillRect(i * squareSize, j * squareSize, squareSize, squareSize);
            }
        }
        
        ctx.fillStyle = '#ff0';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🏁 终点线', roadWidth / 2, -12);
        
        ctx.restore();
    }

    function drawProgressBar(ctx) {
        const barWidth = 220;
        const barHeight = 14;
        const x = (CONFIG.canvasWidth - barWidth) / 2;
        const y = CONFIG.canvasHeight - 28;
        const progress = Math.min(1, gameState.playerDistance / CONFIG.trackLength);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(x, y, barWidth, barHeight);

        const gradient = ctx.createLinearGradient(x, y, x + barWidth * progress, y);
        gradient.addColorStop(0, '#4CAF50');
        gradient.addColorStop(1, '#8BC34A');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth * progress, barHeight);

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth, barHeight);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(gameState.playerDistance)}m / ${CONFIG.trackLength}m`, x + barWidth / 2, y + barHeight - 2);

        const positions = [
            { distance: gameState.playerDistance, color: '#ff6b6b', label: '你' }
        ];
        for (const enemy of gameState.enemies) {
            positions.push({ distance: enemy.distance, color: enemy.color, label: enemy.name });
        }

        for (const pos of positions) {
            const posProgress = Math.min(1, Math.max(0, pos.distance / CONFIG.trackLength));
            const posX = x + barWidth * posProgress;
            
            ctx.fillStyle = pos.color;
            ctx.beginPath();
            ctx.moveTo(posX, y - 7);
            ctx.lineTo(posX - 5, y - 1);
            ctx.lineTo(posX + 5, y - 1);
            ctx.closePath();
            ctx.fill();
        }
    }

    function updateUI() {
        UI.distanceDisplay.textContent = Math.round(gameState.playerDistance);
        UI.speedDisplay.textContent = Math.round(gameState.speed);
        UI.overtakesDisplay.textContent = gameState.overtakes;
        UI.rankDisplay.textContent = gameState.rank;
    }

    function startAutoSave() {
        autoSaveInterval = setInterval(() => {
            if (gameState.status === 'playing') {
                saveCurrentState();
            }
        }, 5000);
    }

    function stopAutoSave() {
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
            autoSaveInterval = null;
        }
    }

    function saveCurrentState() {
        const state = {
            status: gameState.status,
            playerDistance: gameState.playerDistance,
            speed: gameState.speed,
            baseSpeed: gameState.baseSpeed,
            maxSpeed: gameState.maxSpeed,
            overtakes: gameState.overtakes,
            rank: gameState.rank,
            startTime: gameState.startTime,
            elapsedTime: gameState.elapsedTime,
            player: {
                lane: gameState.player.lane,
                targetLane: gameState.player.targetLane,
                x: gameState.player.x,
                isSlowed: gameState.player.isSlowed,
                slowEndTime: gameState.player.slowEndTime
            },
            enemies: gameState.enemies.map(e => ({
                name: e.name,
                color: e.color,
                speedMultiplier: e.speedMultiplier,
                type: e.type,
                lane: e.lane,
                targetLane: e.targetLane,
                x: e.x,
                distance: e.distance,
                wasPassed: e.wasPassed
            })),
            traffic: gameState.traffic.map(t => ({
                lane: t.lane,
                x: t.x,
                distance: t.distance
            })),
            background: {
                roadOffset: gameState.background.roadOffset
            }
        };
        GameData.saveGameState(state);
    }

    function loadSavedState() {
        const saved = GameData.loadGameState();
        if (!saved) return false;

        try {
            gameState.background = new Background();
            gameState.background.roadOffset = saved.background.roadOffset;

            gameState.player = new Player();
            gameState.player.lane = saved.player.lane;
            gameState.player.targetLane = saved.player.targetLane;
            gameState.player.x = saved.player.x;
            gameState.player.isSlowed = saved.player.isSlowed;
            gameState.player.slowEndTime = saved.player.slowEndTime;

            gameState.enemies = saved.enemies.map(e => {
                const config = ENEMY_CONFIG.find(c => c.name === e.name) || ENEMY_CONFIG[0];
                const enemy = new Enemy(config, e.lane, e.distance);
                enemy.targetLane = e.targetLane;
                enemy.x = e.x;
                enemy.wasPassed = e.wasPassed;
                return enemy;
            });

            gameState.traffic = saved.traffic.map(t => {
                return new Traffic(t.lane, t.distance);
            });

            gameState.status = 'playing';
            gameState.playerDistance = saved.playerDistance;
            gameState.speed = saved.speed;
            gameState.baseSpeed = saved.baseSpeed;
            gameState.maxSpeed = saved.maxSpeed;
            gameState.overtakes = saved.overtakes;
            gameState.rank = saved.rank;
            gameState.startTime = Date.now() - saved.elapsedTime;
            gameState.elapsedTime = saved.elapsedTime;

            return true;
        } catch (e) {
            console.error('Failed to load saved state:', e);
            return false;
        }
    }

    function setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                keys.left = true;
                e.preventDefault();
            }
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                keys.right = true;
                e.preventDefault();
            }
            if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
                if (gameState.status === 'playing') {
                    pauseGame();
                } else if (gameState.status === 'paused') {
                    resumeGame();
                }
            }
        });

        UI.startBtn.addEventListener('click', startGame);
        UI.pauseBtn.addEventListener('click', pauseGame);
        UI.restartBtn.addEventListener('click', () => {
            cancelAnimationFrame(animationId);
            stopAutoSave();
            GameData.clearGameState();
            hideAllOverlays();
            UI.pauseBtn.style.display = 'none';
            UI.restartBtn.style.display = 'none';
            UI.startScreen.style.display = 'flex';
            gameState.status = 'menu';
        });
        UI.resumeBtn.addEventListener('click', resumeGame);
        UI.pauseRestartBtn.addEventListener('click', () => {
            cancelAnimationFrame(animationId);
            stopAutoSave();
            GameData.clearGameState();
            hideAllOverlays();
            UI.pauseBtn.style.display = 'none';
            UI.restartBtn.style.display = 'none';
            UI.startScreen.style.display = 'flex';
            gameState.status = 'menu';
        });
        UI.playAgainBtn.addEventListener('click', () => {
            hideAllOverlays();
            UI.startScreen.style.display = 'flex';
            gameState.status = 'menu';
        });

        window.addEventListener('beforeunload', (e) => {
            if (gameState.status === 'playing' || gameState.status === 'paused') {
                saveCurrentState();
            }
        });
    }

    function init() {
        setupEventListeners();
        
        const stats = GameData.getStats();
        UI.bestRank.textContent = stats.bestRank !== null ? stats.bestRank : '-';
        UI.bestTime.textContent = GameData.formatTime(stats.bestTime);
        UI.bestOvertakes.textContent = stats.bestOvertakes || '-';
        UI.totalRaces.textContent = stats.totalRaces;
    }

    return {
        init,
        startGame,
        pauseGame,
        resumeGame
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    MotoRaceGame.init();
});
