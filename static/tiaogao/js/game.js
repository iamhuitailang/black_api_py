console.log('Loading game.js...');

const Game = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    
    state: null,
    isRunning: false,
    isPaused: false,
    animationId: null,
    lastTime: 0,
    
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    
    init: function() {
        console.log('Game.init called');
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('Game canvas not found!');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        
        var self = this;
        window.addEventListener('resize', function() {
            self.resize();
        });
        
        console.log('Game.init complete');
    },
    
    resize: function() {
        var container = document.getElementById('gameContainer');
        if (!container) return;
        
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        
        var dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.scale = Math.min(this.width / 800, this.height / 600);
        this.offsetX = (this.width - 800 * this.scale) / 2;
        this.offsetY = (this.height - 600 * this.scale) / 2;
    },
    
    createDefaultState: function() {
        return {
            gameState: 'menu',
            mode: null,
            currentHeight: 1.70,
            bestHeight: 0,
            successfulJumps: 0,
            totalJumps: 0,
            score: 0,
            rank: null,
            weather: { name: '晴天', icon: '☀️', effect: 1.0, landingStrict: false },
            opponents: [],
            playerState: {
                x: 0.15,
                y: 0.82,
                vx: 0,
                vy: 0,
                posture: 0,
                isCharging: false,
                chargeTime: 0,
                chargeStartTime: 0,
                phase: 'idle',
                maxHeight: 0,
                hitBar: false,
                perfectJump: false,
                bodyAngle: 0,
                legAngle: 0,
                armAngle: 0
            }
        };
    },
    
    startGame: function(mode) {
        console.log('Game.startGame called with mode:', mode);
        
        var modeConfig = CONFIG.MODES[mode];
        if (!modeConfig) {
            console.error('Invalid mode:', mode);
            return;
        }
        
        this.state = this.createDefaultState();
        this.state.gameState = 'ready';
        this.state.mode = mode;
        this.state.currentHeight = modeConfig.heightStart;
        this.state.weather = WeatherSystem.randomize();
        
        OpponentSystem.opponents = [];
        if (modeConfig.opponents > 0) {
            OpponentSystem.generateOpponents(modeConfig.opponents, mode);
            this.state.opponents = OpponentSystem.opponents;
        }
        
        this.resetPlayerPosition();
        this.startAutoSave();
        
        console.log('Game.startGame complete, state:', this.state.gameState);
    },
    
    resetPlayerPosition: function() {
        if (!this.state) return;
        this.state.playerState = {
            x: 0.15,
            y: 0.82,
            vx: 0,
            vy: 0,
            posture: 0,
            isCharging: false,
            chargeTime: 0,
            chargeStartTime: 0,
            phase: 'idle',
            maxHeight: 0,
            hitBar: false,
            perfectJump: false,
            bodyAngle: 0,
            legAngle: 0,
            armAngle: 0
        };
    },
    
    startLoop: function() {
        if (this.isRunning) {
            console.log('Game loop already running');
            return;
        }
        console.log('Starting game loop');
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        this.gameLoop();
    },
    
    startAutoSave: function() {
        var self = this;
        setInterval(function() {
            self.save();
        }, 3000);
    },
    
    togglePause: function() {
        this.isPaused = !this.isPaused;
        if (!this.isPaused) {
            this.lastTime = performance.now();
        }
        return this.isPaused;
    },
    
    gameLoop: function() {
        if (!this.isRunning) return;
        
        var currentTime = performance.now();
        
        if (!this.isPaused) {
            var deltaTime = Math.min(currentTime - this.lastTime, 50);
            this.lastTime = currentTime;
            try {
                this.update(deltaTime);
            } catch (e) {
                console.error('Update error:', e);
            }
        }
        
        try {
            this.render();
        } catch (e) {
            console.error('Render error:', e);
        }
        
        var self = this;
        this.animationId = requestAnimationFrame(function() {
            self.gameLoop();
        });
    },
    
    update: function(deltaTime) {
        if (!this.state || !deltaTime) return;
        
        var player = this.state.playerState;
        
        WeatherSystem.update(deltaTime);
        EffectSystem.update(deltaTime);
        
        for (var i = 0; i < OpponentSystem.opponents.length; i++) {
            var opp = OpponentSystem.opponents[i];
            if (opp.isJumping) {
                OpponentSystem.updateOpponentJump(opp, deltaTime);
            }
        }
        
        switch (this.state.gameState) {
            case 'ready':
                this.updateReady(deltaTime);
                break;
            case 'charging':
                this.updateCharging(deltaTime);
                break;
            case 'running':
                this.updateRunning(deltaTime);
                break;
            case 'jumping':
                this.updateJumping(deltaTime);
                break;
            case 'landing':
                this.updateLanding(deltaTime);
                break;
        }
    },
    
    updateReady: function(deltaTime) {
        var player = this.state.playerState;
        player.phase = 'idle';
        
        if (player.isCharging) {
            this.state.gameState = 'charging';
            player.chargeStartTime = Date.now();
            UISystem.showChargeBar(true);
        }
    },
    
    updateCharging: function(deltaTime) {
        var player = this.state.playerState;
        var now = Date.now();
        player.chargeTime = now - player.chargeStartTime;
        
        var chargePercent = Math.min(100, (player.chargeTime / CONFIG.GAME.MAX_CHARGE_TIME) * 100);
        UISystem.updateChargeBar(chargePercent);
        
        if (chargePercent >= 100) {
            UISystem.updateChargeText('力量最大!');
        } else if (chargePercent >= 70) {
            UISystem.updateChargeText('继续蓄力...');
        } else {
            UISystem.updateChargeText('蓄力中...');
        }
        
        if (!player.isCharging) {
            this.releaseJump();
        }
    },
    
    releaseJump: function() {
        var player = this.state.playerState;
        var chargePercent = Math.min(1, player.chargeTime / CONFIG.GAME.MAX_CHARGE_TIME);
        
        var basePower = CONFIG.GAME.MIN_JUMP_POWER + 
            (CONFIG.GAME.MAX_JUMP_POWER - CONFIG.GAME.MIN_JUMP_POWER) * chargePercent;
        
        var weatherMod = WeatherSystem.getJumpModifier();
        var jumpPower = basePower * weatherMod;
        
        player.vx = 0.00015;
        player.vy = -jumpPower * 0.0008;
        player.phase = 'running';
        player.maxHeight = 0;
        player.hitBar = false;
        player.perfectJump = false;
        
        this.state.gameState = 'running';
        this.state.totalJumps++;
        
        UISystem.updateInfo({
            successfulJumps: this.state.successfulJumps,
            totalJumps: this.state.totalJumps
        });
        
        UISystem.showChargeBar(false);
        UISystem.hideHint();
        
        EffectSystem.addEffect('dust', player.x, player.y);
    },
    
    updateRunning: function(deltaTime) {
        var player = this.state.playerState;
        
        player.x += player.vx * deltaTime;
        player.phase = 'running';
        
        player.bodyAngle = Math.sin(Date.now() * 0.02) * 0.1;
        player.legAngle = Math.sin(Date.now() * 0.015) * 0.5;
        player.armAngle = Math.sin(Date.now() * 0.015 + Math.PI) * 0.4;
        
        player.x = Math.min(0.9, player.x);
        
        if (player.x >= CONFIG.GAME.BAR_X - 0.06) {
            this.state.gameState = 'jumping';
            player.phase = 'jumping';
        }
    },
    
    updateJumping: function(deltaTime) {
        var player = this.state.playerState;
        
        player.vy += CONFIG.GAME.GRAVITY * deltaTime * 0.00002;
        player.x += player.vx * deltaTime * 0.8;
        player.y += player.vy * deltaTime;
        
        player.x = Math.min(0.95, Math.max(0.05, player.x));
        player.y = Math.max(0.15, player.y);
        
        var currentHeight = (0.82 - player.y) * 3;
        if (currentHeight > player.maxHeight) {
            player.maxHeight = currentHeight;
        }
        
        var barHeightInCanvas = 0.82 - this.state.currentHeight / 2.5;
        var barX = CONFIG.GAME.BAR_X;
        var barWidth = 0.12;
        
        if (Math.abs(player.x - barX) < barWidth / 2 && player.y < barHeightInCanvas + 0.03) {
            var postureEffect = Math.abs(player.posture) * 0.015;
            var effectiveHeight = player.y + postureEffect;
            
            if (effectiveHeight < barHeightInCanvas - 0.02) {
                player.perfectJump = true;
            } else if (effectiveHeight < barHeightInCanvas + 0.008) {
                if (!player.hitBar) {
                    player.hitBar = true;
                    EffectSystem.addEffect('barShake', barX, barHeightInCanvas);
                }
            } else {
                player.hitBar = true;
            }
        }
        
        var targetPosture = Math.max(-1, Math.min(1, player.posture));
        player.bodyAngle = targetPosture * 0.6;
        player.legAngle = -targetPosture * 0.4;
        player.armAngle = targetPosture * 0.5;
        
        if (player.vy > 0 && player.y >= 0.82 - 0.03) {
            this.state.gameState = 'landing';
            player.phase = 'landing';
            player.y = 0.82;
            player.vy = 0;
        }
    },
    
    updateLanding: function(deltaTime) {
        var player = this.state.playerState;
        
        player.y = 0.82;
        player.vx *= 0.96;
        player.vy = 0;
        
        player.bodyAngle *= 0.92;
        player.legAngle *= 0.92;
        player.armAngle *= 0.92;
        
        if (Math.abs(player.vx) < 0.000001) {
            this.processJumpResult();
        }
    },
    
    processJumpResult: function() {
        if (this.state.gameState !== 'landing') return;
        
        var player = this.state.playerState;
        var success = !player.hitBar;
        var score = 0;
        
        if (success) {
            this.state.successfulJumps++;
            
            var scoreEntry = CONFIG.SCORE_TABLE[0];
            for (var i = CONFIG.SCORE_TABLE.length - 1; i >= 0; i--) {
                if (CONFIG.SCORE_TABLE[i].height <= this.state.currentHeight) {
                    scoreEntry = CONFIG.SCORE_TABLE[i];
                    break;
                }
            }
            score = scoreEntry.base;
            
            if (player.perfectJump) {
                score += scoreEntry.perfect;
                UISystem.showHint('完美过杆! +' + scoreEntry.perfect + '分', 2000);
            } else {
                UISystem.showHint('成功!', 1500);
            }
            
            if (this.state.currentHeight > this.state.bestHeight) {
                this.state.bestHeight = this.state.currentHeight;
            }
            
            if (this.state.currentHeight >= CONFIG.GAME.RECORD_HEIGHT) {
                score += CONFIG.RECORD_BONUS;
                EffectSystem.addEffect('fireworks', 0.5, 0.3);
                UISystem.showHint('破纪录! +' + CONFIG.RECORD_BONUS + '分', 3000);
            } else {
                EffectSystem.addEffect('cheer', 0.5, 0.5);
            }
            
            this.state.score += score;
            EffectSystem.addEffect('dust', player.x, player.y);
            
        } else {
            UISystem.showHint('失败!', 1500);
            EffectSystem.addEffect('redFlag', 0.1, 0.5);
        }
        
        UISystem.updateInfo({
            successfulJumps: this.state.successfulJumps,
            bestHeight: this.state.bestHeight
        });
        
        this.simulateOpponents();
        
        var self = this;
        setTimeout(function() {
            self.showJumpResult(success, score);
        }, 1200);
    },
    
    simulateOpponents: function() {
        for (var i = 0; i < OpponentSystem.opponents.length; i++) {
            var opp = OpponentSystem.opponents[i];
            if (!opp.hasJumped) {
                var result = OpponentSystem.simulateJump(opp, this.state.currentHeight);
                opp.jumpResult = result;
                
                if (result.success) {
                    opp.successfulJumps++;
                    opp.currentHeight = this.state.currentHeight;
                    
                    var scoreEntry = CONFIG.SCORE_TABLE[0];
                    for (var j = CONFIG.SCORE_TABLE.length - 1; j >= 0; j--) {
                        if (CONFIG.SCORE_TABLE[j].height <= this.state.currentHeight) {
                            scoreEntry = CONFIG.SCORE_TABLE[j];
                            break;
                        }
                    }
                    var oppScore = scoreEntry.base;
                    if (result.isPerfect) oppScore += scoreEntry.perfect;
                    opp.score += oppScore;
                }
                
                opp.totalJumps++;
            }
        }
        
        this.state.rank = OpponentSystem.getPlayerRank(this.state.bestHeight, this.state.score);
        UISystem.updateInfo({ rank: this.state.rank });
    },
    
    showJumpResult: function(success, score) {
        this.state.gameState = 'result';
        
        var rows = [
            { label: '本次高度', value: this.state.currentHeight.toFixed(2) + 'm' },
            { label: '结果', value: success ? '成功' : '失败' },
            { label: '本次得分', value: '+' + score + '分' },
            { label: '总分', value: this.state.score + '分' },
            { label: '最好成绩', value: this.state.bestHeight.toFixed(2) + 'm' }
        ];
        
        if (this.state.mode !== 'training') {
            rows.push({ label: '当前排名', value: '第' + this.state.rank + '名' });
        }
        
        UISystem.showResultScreen({
            title: success ? '试跳成功!' : '试跳失败',
            rows: rows
        });
        
        this.save();
    },
    
    continueGame: function() {
        UISystem.hideResultScreen();
        
        var modeConfig = CONFIG.MODES[this.state.mode];
        this.state.currentHeight += modeConfig.heightStep;
        this.state.weather = WeatherSystem.randomize();
        WeatherSystem.current = this.state.weather;
        UISystem.updateInfo({
            currentHeight: this.state.currentHeight,
            weather: WeatherSystem.getIcon()
        });
        
        OpponentSystem.resetForNewHeight();
        this.resetPlayerPosition();
        this.state.gameState = 'ready';
        
        UISystem.showHint('当前高度: ' + this.state.currentHeight.toFixed(2) + 'm', 2000);
        this.save();
    },
    
    restartGame: function() {
        UISystem.hideResultScreen();
        this.startGame(this.state.mode);
        UISystem.showHint('重新开始', 1500);
    },
    
    backToMenu: function() {
        UISystem.hideResultScreen();
        UISystem.showStartScreen(true);
        UISystem.showPauseButton(false);
        this.state.gameState = 'menu';
        this.resetPlayerPosition();
        EffectSystem.clear();
        Storage.clear();
    },
    
    resetAttempt: function() {
        if (!this.state || this.state.gameState === 'ready' || this.state.gameState === 'result' || this.state.gameState === 'menu') return;
        
        this.resetPlayerPosition();
        this.state.gameState = 'ready';
        UISystem.showChargeBar(false);
        UISystem.showHint('已重置', 1000);
        this.save();
    },
    
    adjustPosture: function(direction) {
        if (!this.state) return;
        var player = this.state.playerState;
        if (this.state.gameState === 'jumping') {
            player.posture += direction * CONFIG.GAME.AIR_CONTROL;
            player.posture = Math.max(-CONFIG.GAME.MAX_POSTURE_CHANGE, 
                Math.min(CONFIG.GAME.MAX_POSTURE_CHANGE, player.posture));
        }
    },
    
    render: function() {
        if (!this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale, this.scale);
        
        this.renderBackground();
        this.renderStadium();
        this.renderTrack();
        this.renderBar();
        this.renderLandingPad();
        
        for (var i = 0; i < OpponentSystem.opponents.length; i++) {
            var opp = OpponentSystem.opponents[i];
            if (opp.isJumping || opp.hasJumped) {
                this.renderOpponent(opp);
            }
        }
        
        if (this.state) {
            this.renderPlayer();
        }
        
        EffectSystem.render(this.ctx, 800, 600);
        WeatherSystem.render(this.ctx, 800, 600);
        
        this.ctx.restore();
    },
    
    renderBackground: function() {
        var gradient = this.ctx.createLinearGradient(0, 0, 0, 600);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, 800, 600);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.drawCloud(100, 80, 60);
        this.drawCloud(300, 60, 80);
        this.drawCloud(600, 100, 70);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(700, 80, 50, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        this.ctx.lineWidth = 3;
        for (var i = 0; i < 12; i++) {
            var angle = (i / 12) * Math.PI * 2;
            this.ctx.beginPath();
            this.ctx.moveTo(700 + Math.cos(angle) * 60, 80 + Math.sin(angle) * 60);
            this.ctx.lineTo(700 + Math.cos(angle) * 80, 80 + Math.sin(angle) * 80);
            this.ctx.stroke();
        }
    },
    
    drawCloud: function(x, y, size) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.4, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.8, y, size * 0.45, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.4, y + size * 0.2, size * 0.35, 0, Math.PI * 2);
        this.ctx.fill();
    },
    
    renderStadium: function() {
        this.ctx.fillStyle = '#8B7355';
        this.ctx.fillRect(0, 500, 800, 100);
        
        this.ctx.fillStyle = '#654321';
        for (var i = 0; i < 20; i++) {
            this.ctx.fillRect(0, 500 + i * 5, 800, 2);
        }
        
        this.ctx.fillStyle = '#A0522D';
        this.ctx.fillRect(0, 470, 800, 30);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('OLYMPIC STADIUM', 400, 490);
    },
    
    renderTrack: function() {
        this.ctx.fillStyle = '#c41e3a';
        this.ctx.fillRect(0, 440, 800, 60);
        
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([20, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, 470);
        this.ctx.lineTo(800, 470);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(120, 440);
        this.ctx.lineTo(120, 500);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(440, 440);
        this.ctx.lineTo(440, 500);
        this.ctx.stroke();
    },
    
    renderBar: function() {
        if (!this.state) return;
        
        var barHeight = this.state.currentHeight;
        var barY = 490 - barHeight * 90;
        var barX = 440;
        var barWidth = 120;
        
        var shake = EffectSystem.getBarShake();
        
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(barX - barWidth / 2 - 8, barY - 160, 8, 160);
        this.ctx.fillRect(barX + barWidth / 2, barY - 160, 8, 160);
        
        this.ctx.fillStyle = '#ffd700';
        this.ctx.fillRect(barX - barWidth / 2, barY + shake, barWidth, 6);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 16px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(barHeight.toFixed(2) + 'm', barX, barY - 10);
    },
    
    renderLandingPad: function() {
        var padX = 620;
        var padY = 440;
        var padWidth = 160;
        var padHeight = 60;
        
        this.ctx.fillStyle = '#4169E1';
        this.ctx.fillRect(padX - padWidth / 2, padY, padWidth, padHeight);
        
        this.ctx.strokeStyle = '#1E3A8A';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(padX - padWidth / 2, padY, padWidth, padHeight);
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        for (var i = 0; i < 4; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(padX - padWidth / 2 + 20, padY + 10 + i * 12);
            this.ctx.lineTo(padX + padWidth / 2 - 20, padY + 10 + i * 12);
            this.ctx.stroke();
        }
    },
    
    renderPlayer: function() {
        var player = this.state.playerState;
        var x = player.x * 800;
        var y = player.y * 600;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(player.bodyAngle || 0);
        
        var scale = 1.3;
        this.ctx.scale(scale, scale);
        
        this.drawPlayer(
            player.legAngle || 0,
            player.armAngle || 0,
            player.phase
        );
        
        this.ctx.restore();
    },
    
    drawPlayer: function(legAngle, armAngle, phase) {
        var ctx = this.ctx;
        
        ctx.fillStyle = '#E8D4C4';
        ctx.beginPath();
        ctx.ellipse(0, -35, 14, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#C4A484';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.fillStyle = '#D4B896';
        ctx.beginPath();
        ctx.arc(0, -58, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#B8956E';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.fillStyle = '#4A3728';
        ctx.beginPath();
        ctx.ellipse(0, -64, 11, 8, 0, Math.PI, 0);
        ctx.fill();
        
        ctx.fillStyle = '#6B4423';
        ctx.beginPath();
        ctx.ellipse(0, -62, 9, 5, 0, Math.PI, 0);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-4, -58, 2.5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(4, -58, 2.5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2C1810';
        ctx.beginPath();
        ctx.ellipse(-4, -58, 1.2, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(4, -58, 1.2, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-4.5, -58.5, 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(3.5, -58.5, 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -54, 3, 0.2, Math.PI - 0.2);
        ctx.stroke();
        
        ctx.fillStyle = '#D4A574';
        ctx.beginPath();
        ctx.ellipse(-10, -56, 1.5, 2, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(10, -56, 1.5, 2, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#E53935';
        ctx.beginPath();
        ctx.moveTo(-12, -45);
        ctx.lineTo(12, -45);
        ctx.lineTo(14, -25);
        ctx.lineTo(-14, -25);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#B71C1C';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(-12, -32, 24, 2);
        ctx.fillRect(-12, -28, 24, 2);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CHN', 0, -31);
        
        ctx.save();
        ctx.translate(-12, -40);
        ctx.rotate(armAngle);
        ctx.fillStyle = '#E8D4C4';
        ctx.beginPath();
        ctx.ellipse(-3, 12, 4, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#C4A484';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.restore();
        
        ctx.save();
        ctx.translate(12, -40);
        ctx.rotate(-armAngle);
        ctx.fillStyle = '#E8D4C4';
        ctx.beginPath();
        ctx.ellipse(3, 12, 4, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#C4A484';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.restore();
        
        ctx.fillStyle = '#1565C0';
        ctx.fillRect(-10, -22, 20, 12);
        ctx.strokeStyle = '#0D47A1';
        ctx.lineWidth = 1;
        ctx.strokeRect(-10, -22, 20, 12);
        
        ctx.save();
        ctx.translate(-6, -12);
        ctx.rotate(legAngle);
        ctx.fillStyle = '#E8D4C4';
        ctx.beginPath();
        ctx.ellipse(-2, 12, 5, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#C4A484';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        
        ctx.fillStyle = '#424242';
        ctx.beginPath();
        ctx.ellipse(-2, 26, 6, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(-2, 25, 5, 3, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFA000';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.restore();
        
        ctx.save();
        ctx.translate(6, -12);
        ctx.rotate(-legAngle);
        ctx.fillStyle = '#E8D4C4';
        ctx.beginPath();
        ctx.ellipse(2, 12, 5, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#C4A484';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        
        ctx.fillStyle = '#424242';
        ctx.beginPath();
        ctx.ellipse(2, 26, 6, 4, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(2, 25, 5, 3, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFA000';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.restore();
    },
    
    renderOpponent: function(opp) {
        var oppX = 0.2 + opp.id * 0.05;
        var oppY = 0.82;
        
        var displayX = oppX * 800;
        var displayY = oppY * 600;
        
        if (opp.isJumping) {
            var progress = opp.jumpProgress;
            displayY = oppY * 600 - Math.sin(progress * Math.PI) * 70;
            displayX = oppX * 800 + progress * 180;
        }
        
        this.ctx.save();
        this.ctx.globalAlpha = 0.7;
        this.ctx.fillStyle = opp.type.color;
        this.ctx.beginPath();
        this.ctx.arc(displayX, displayY - 30, 12, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '10px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(opp.name, displayX, displayY - 48);
        
        this.ctx.globalAlpha = 1;
        this.ctx.restore();
    },
    
    save: function() {
        if (this.state && this.state.gameState !== 'menu') {
            this.state.timestamp = Date.now();
            this.state.opponents = OpponentSystem.opponents;
            Storage.save(this.state);
        }
    }
};

console.log('game.js loaded successfully');
