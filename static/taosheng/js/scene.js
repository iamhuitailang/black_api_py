class Scene {
    constructor(sceneIndex) {
        this.sceneIndex = sceneIndex;
        this.config = GameConfig.SCENES[sceneIndex];
        this.obstacles = [];
        this.collapseZones = [];
        this.currentPhase = 1;
        this.phaseProgress = 0;
        this.shakeAmount = 0;
        this.shakeTimer = 0;
        this.collapseAnimation = 0;
        
        this.initObstacles();
    }
    
    initObstacles() {
        this.obstacles = this.config.obstacles.map(obs => ({
            x: obs.x,
            y: obs.y,
            w: obs.w,
            h: obs.h,
            collapsed: false,
            collapseTimer: 0
        }));
    }
    
    get name() {
        return this.config.name;
    }
    
    get colors() {
        return this.config.colors;
    }
    
    setPhase(phase, progress) {
        this.currentPhase = phase;
        this.phaseProgress = progress;
        this.updateCollapseZones();
    }
    
    updateCollapseZones() {
        this.collapseZones = [];
        
        let sideZoneWidth, topZoneHeight, bottomZoneHeight;
        
        if (this.currentPhase === 1) {
            sideZoneWidth = 80 + this.phaseProgress * 170;
            topZoneHeight = 30;
            bottomZoneHeight = 30;
        } else if (this.currentPhase === 2) {
            sideZoneWidth = 250 + this.phaseProgress * 180;
            topZoneHeight = 30 + this.phaseProgress * 150;
            bottomZoneHeight = 30 + this.phaseProgress * 150;
        } else {
            sideZoneWidth = 430 + this.phaseProgress * 200;
            topZoneHeight = 180 + this.phaseProgress * 150;
            bottomZoneHeight = 180 + this.phaseProgress * 150;
        }
        
        const maxSideWidth = GameConfig.CANVAS_WIDTH * 0.42;
        sideZoneWidth = Math.min(sideZoneWidth, maxSideWidth);
        const maxTopHeight = GameConfig.CANVAS_HEIGHT * 0.38;
        topZoneHeight = Math.min(topZoneHeight, maxTopHeight);
        bottomZoneHeight = Math.min(bottomZoneHeight, maxTopHeight);
        
        this.collapseZones.push({
            x: 0,
            y: 0,
            w: sideZoneWidth,
            h: GameConfig.CANVAS_HEIGHT,
            phase: this.currentPhase,
            isSide: true,
            isLeft: true
        });
        
        this.collapseZones.push({
            x: GameConfig.CANVAS_WIDTH - sideZoneWidth,
            y: 0,
            w: sideZoneWidth,
            h: GameConfig.CANVAS_HEIGHT,
            phase: this.currentPhase,
            isSide: true,
            isLeft: false
        });
        
        if (this.currentPhase >= 2) {
            this.collapseZones.push({
                x: 0,
                y: 0,
                w: GameConfig.CANVAS_WIDTH,
                h: topZoneHeight,
                phase: this.currentPhase,
                isTop: true
            });
            
            this.collapseZones.push({
                x: 0,
                y: GameConfig.CANVAS_HEIGHT - bottomZoneHeight,
                w: GameConfig.CANVAS_WIDTH,
                h: bottomZoneHeight,
                phase: this.currentPhase,
                isBottom: true
            });
        }
    }
    
    update(deltaTime) {
        if (this.shakeTimer > 0) {
            this.shakeTimer -= deltaTime;
            if (this.shakeTimer <= 0) {
                this.shakeAmount = 0;
            }
        }
        
        this.collapseAnimation += deltaTime;
        
        if (this.currentPhase >= 2 && Math.random() < 0.01) {
            this.triggerShake(5, 500);
        }
        if (this.currentPhase >= 3 && Math.random() < 0.02) {
            this.triggerShake(10, 300);
        }
        
        this.updateObstacleCollapse();
    }
    
    updateObstacleCollapse() {
        if (this.currentPhase < 2) return;
        
        this.obstacles.forEach(obs => {
            if (!obs.collapsed && this.isInCollapseZone(obs)) {
                obs.collapseTimer += 16;
                const collapseDelay = this.currentPhase === 2 ? 2000 : 1000;
                if (obs.collapseTimer > collapseDelay && Math.random() < 0.01) {
                    obs.collapsed = true;
                }
            }
        });
    }
    
    triggerShake(amount, duration) {
        this.shakeAmount = amount;
        this.shakeTimer = duration;
    }
    
    checkObstacleCollision(rect) {
        for (const obs of this.obstacles) {
            if (!obs.collapsed && Utils.rectCollision(rect, obs)) {
                return true;
            }
        }
        return false;
    }
    
    isInCollapseZone(rect) {
        for (const zone of this.collapseZones) {
            if (Utils.rectCollision(rect, zone)) {
                return true;
            }
        }
        return false;
    }
    
    getCrowdSlowFactor(x, y) {
        if (this.isInCollapseZone({ x: x - 30, y: y - 30, w: 60, h: 60 })) {
            return 0.5;
        }
        return 1;
    }
    
    isAtExit(player) {
        const exitRect = {
            x: GameConfig.EXIT.X,
            y: GameConfig.EXIT.Y,
            w: GameConfig.EXIT.WIDTH,
            h: GameConfig.EXIT.HEIGHT
        };
        return Utils.rectCollision(player.getRect(), exitRect);
    }
    
    render(ctx) {
        const colors = this.config.colors;
        
        ctx.save();
        
        if (this.shakeAmount > 0) {
            ctx.translate(
                (Math.random() - 0.5) * this.shakeAmount * 2,
                (Math.random() - 0.5) * this.shakeAmount * 2
            );
        }
        
        this.renderBackground(ctx, colors);
        this.renderFloor(ctx, colors);
        this.renderCollapseZones(ctx, colors);
        this.renderObstacles(ctx, colors);
        this.renderExit(ctx, colors);
        
        ctx.restore();
    }
    
    renderBackground(ctx, colors) {
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);
        
        for (let i = 0; i < 10; i++) {
            const x = (i / 10) * GameConfig.CANVAS_WIDTH;
            ctx.fillStyle = colors.wall + '44';
            ctx.fillRect(x, 0, 3, 60);
        }
        
        for (let i = 0; i < 5; i++) {
            const y = 60 + i * 120;
            ctx.strokeStyle = colors.wall + '22';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(GameConfig.CANVAS_WIDTH, y);
            ctx.stroke();
        }
    }
    
    renderFloor(ctx, colors) {
        ctx.fillStyle = colors.floor;
        ctx.fillRect(0, GameConfig.CANVAS_HEIGHT - 50, GameConfig.CANVAS_WIDTH, 50);
        
        for (let i = 0; i < 30; i++) {
            const x = i * 45 + 10;
            const y = GameConfig.CANVAS_HEIGHT - 30;
            ctx.fillStyle = colors.accent + '33';
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderCollapseZones(ctx, colors) {
        this.collapseZones.forEach((zone, zoneIndex) => {
            const phase = zone.phase || this.currentPhase;
            
            let gradient;
            
            if (zone.isSide && zone.isLeft) {
                gradient = ctx.createLinearGradient(zone.x, zone.y, zone.x + zone.w, zone.y);
                gradient.addColorStop(0, `rgba(60, 15, 15, ${0.4 + phase * 0.15})`);
                gradient.addColorStop(0.7, `rgba(60, 15, 15, ${0.2 + phase * 0.1})`);
                gradient.addColorStop(1, `rgba(60, 15, 15, 0)`);
            } else if (zone.isSide && !zone.isLeft) {
                gradient = ctx.createLinearGradient(zone.x, zone.y, zone.x + zone.w, zone.y);
                gradient.addColorStop(0, `rgba(60, 15, 15, 0)`);
                gradient.addColorStop(0.3, `rgba(60, 15, 15, ${0.2 + phase * 0.1})`);
                gradient.addColorStop(1, `rgba(60, 15, 15, ${0.4 + phase * 0.15})`);
            } else if (zone.isTop) {
                gradient = ctx.createLinearGradient(zone.x, zone.y, zone.x, zone.y + zone.h);
                gradient.addColorStop(0, `rgba(60, 15, 15, ${0.4 + phase * 0.15})`);
                gradient.addColorStop(0.7, `rgba(60, 15, 15, ${0.2 + phase * 0.1})`);
                gradient.addColorStop(1, `rgba(60, 15, 15, 0)`);
            } else if (zone.isBottom) {
                gradient = ctx.createLinearGradient(zone.x, zone.y, zone.x, zone.y + zone.h);
                gradient.addColorStop(0, `rgba(60, 15, 15, 0)`);
                gradient.addColorStop(0.3, `rgba(60, 15, 15, ${0.2 + phase * 0.1})`);
                gradient.addColorStop(1, `rgba(60, 15, 15, ${0.4 + phase * 0.15})`);
            }
            
            ctx.fillStyle = gradient;
            ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
            
            ctx.fillStyle = `rgba(80, 50, 40, ${0.15 + phase * 0.1})`;
            for (let i = 0; i < 15; i++) {
                const seed = zoneIndex * 31 + i * 17;
                const px = zone.x + ((Math.sin(seed) + 1) / 2) * zone.w;
                const py = zone.y + ((Math.cos(seed * 2.3) + 1) / 2) * zone.h;
                const size = 4 + ((seed % 8));
                ctx.fillRect(px, py, size, size);
            }
            
            if (phase >= 2) {
                ctx.strokeStyle = `rgba(231, 76, 60, ${0.3 + phase * 0.15})`;
                ctx.lineWidth = 2 + phase;
                
                if (zone.isSide) {
                    const edgeX = zone.isLeft ? zone.x + zone.w : zone.x;
                    ctx.beginPath();
                    ctx.moveTo(edgeX, zone.y);
                    const wobble = Math.sin(this.collapseAnimation / 150 + zoneIndex) * 15;
                    for (let y = zone.y; y < zone.y + zone.h; y += 15) {
                        const offset = Math.sin(y / 25 + this.collapseAnimation / 80) * 12 + wobble;
                        ctx.lineTo(edgeX + offset, y);
                    }
                    ctx.stroke();
                } else if (zone.isTop || zone.isBottom) {
                    const edgeY = zone.isTop ? zone.y + zone.h : zone.y;
                    ctx.beginPath();
                    ctx.moveTo(zone.x, edgeY);
                    const wobble = Math.sin(this.collapseAnimation / 150 + zoneIndex) * 15;
                    for (let x = zone.x; x < zone.x + zone.w; x += 15) {
                        const offset = Math.sin(x / 25 + this.collapseAnimation / 80) * 12 + wobble;
                        ctx.lineTo(x, edgeY + offset);
                    }
                    ctx.stroke();
                }
            }
            
            if (phase >= 2) {
                const debrisCount = Math.floor(zone.w / 35) + Math.floor(zone.h / 35);
                for (let i = 0; i < debrisCount; i++) {
                    const seed = zoneIndex * 53 + i * 29;
                    const dx = zone.x + ((Math.sin(seed * 1.7) + 1) / 2) * zone.w;
                    const dy = zone.y + ((Math.cos(seed * 2.1) + 1) / 2) * zone.h;
                    const ds = 3 + ((seed % 6));
                    
                    ctx.fillStyle = `rgba(70, 50, 40, ${0.4 + phase * 0.1})`;
                    ctx.fillRect(dx, dy, ds, ds);
                    
                    ctx.strokeStyle = `rgba(40, 20, 20, ${0.3 + phase * 0.1})`;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(dx, dy, ds, ds);
                }
            }
            
            if (phase >= 3) {
                const dustCount = Math.floor(zone.w / 50) + Math.floor(zone.h / 50);
                for (let i = 0; i < dustCount; i++) {
                    const seed = zoneIndex * 71 + i * 41;
                    const dx = zone.x + ((Math.sin(seed * 1.3) + 1) / 2) * zone.w;
                    const dy = zone.y + ((Math.cos(seed * 1.9) + 1) / 2) * zone.h;
                    const dustSize = 8 + ((seed % 12));
                    
                    const dustAlpha = 0.15 + Math.sin(this.collapseAnimation / 200 + seed) * 0.1;
                    ctx.fillStyle = `rgba(100, 80, 70, ${dustAlpha})`;
                    ctx.beginPath();
                    ctx.arc(dx, dy, dustSize, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        });
    }
    
    renderObstacles(ctx, colors) {
        this.obstacles.forEach(obs => {
            if (obs.collapsed) {
                ctx.fillStyle = 'rgba(50, 50, 50, 0.5)';
                Utils.drawRoundedRect(ctx, obs.x + 5, obs.y + obs.h - 15, obs.w - 10, 15, 3);
                ctx.fill();
                return;
            }
            
            const wobble = Math.sin(this.collapseAnimation / 500 + obs.x) * 0.02;
            const isInZone = this.isInCollapseZone(obs);
            const collapseProgress = obs.collapseTimer / (this.currentPhase === 3 ? 1000 : 2000);
            
            ctx.save();
            ctx.translate(obs.x + obs.w / 2, obs.y + obs.h / 2);
            
            if (isInZone) {
                ctx.rotate(wobble * 2 + Math.sin(this.collapseAnimation / 100) * 0.01);
            } else {
                ctx.rotate(wobble);
            }
            
            let obsColor = colors.wall;
            if (isInZone && this.currentPhase >= 2) {
                const shake = Math.sin(this.collapseAnimation / 50) * 0.5;
                ctx.translate(shake, 0);
                
                if (collapseProgress > 0.3) {
                    obsColor = '#6b4444';
                }
            }
            
            ctx.fillStyle = obsColor;
            Utils.drawRoundedRect(ctx, -obs.w / 2, -obs.h / 2, obs.w, obs.h, 5);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(-obs.w / 2 + 5, -obs.h / 2 + 5, obs.w - 10, 3);
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(-obs.w / 2 + 5, obs.h / 2 - 8, obs.w - 10, 5);
            
            if (this.currentPhase >= 2) {
                ctx.strokeStyle = `rgba(231, 76, 60, ${0.3 + collapseProgress * 0.4})`;
                ctx.lineWidth = 1 + collapseProgress * 2;
                
                const crackCount = Math.floor(1 + collapseProgress * 4);
                for (let i = 0; i < crackCount; i++) {
                    ctx.beginPath();
                    const startX = Utils.randomRange(-obs.w / 3, obs.w / 3);
                    const startY = Utils.randomRange(-obs.h / 3, obs.h / 3);
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(startX + Utils.randomRange(-15, 15), startY + Utils.randomRange(-15, 15));
                    ctx.stroke();
                }
            }
            
            ctx.restore();
        });
    }
    
    renderExit(ctx, colors) {
        const exitX = GameConfig.EXIT.X;
        const exitY = GameConfig.EXIT.Y;
        const exitW = GameConfig.EXIT.WIDTH;
        const exitH = GameConfig.EXIT.HEIGHT;
        
        const pulse = Math.sin(this.collapseAnimation / 300) * 0.2 + 0.8;
        
        ctx.fillStyle = colors.exit;
        ctx.globalAlpha = pulse;
        Utils.drawRoundedRect(ctx, exitX, exitY, exitW, exitH, 8);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        Utils.drawRoundedRect(ctx, exitX, exitY, exitW, exitH, 8);
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('安全出口', exitX + exitW / 2, exitY + exitH / 2 - 5);
        ctx.font = '12px Arial';
        ctx.fillText('EXIT', exitX + exitW / 2, exitY + exitH / 2 + 15);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.moveTo(exitX + exitW / 2, exitY - 30);
        ctx.lineTo(exitX + exitW / 2 - 15, exitY - 15);
        ctx.lineTo(exitX + exitW / 2 + 15, exitY - 15);
        ctx.closePath();
        ctx.fill();
    }
    
    getState() {
        return {
            sceneIndex: this.sceneIndex,
            currentPhase: this.currentPhase,
            phaseProgress: this.phaseProgress,
            obstacles: this.obstacles.map(obs => ({
                x: obs.x,
                y: obs.y,
                w: obs.w,
                h: obs.h,
                collapsed: obs.collapsed,
                collapseTimer: obs.collapseTimer
            }))
        };
    }
    
    loadState(state) {
        if (!state) return;
        
        this.currentPhase = state.currentPhase;
        this.phaseProgress = state.phaseProgress;
        this.obstacles = state.obstacles.map(obs => ({
            x: obs.x,
            y: obs.y,
            w: obs.w,
            h: obs.h,
            collapsed: obs.collapsed,
            collapseTimer: obs.collapseTimer || 0
        }));
        this.updateCollapseZones();
    }
}
