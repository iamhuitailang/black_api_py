class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.camera = { x: 0, y: 0 };
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    setCamera(camera) {
        this.camera = { ...camera };
    }

    clear() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0a0515');
        gradient.addColorStop(0.5, '#150a25');
        gradient.addColorStop(1, '#0a0510');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBackground(elements) {
        this.ctx.save();
        this.ctx.translate(-this.camera.x * 0.3, -this.camera.y * 0.3);
        
        for (const elem of elements) {
            if (elem.type === 'particle') {
                elem.phase += 0.02;
                const alpha = 0.3 + Math.sin(elem.phase) * 0.2;
                this.ctx.fillStyle = `rgba(150, 100, 200, ${alpha})`;
                this.ctx.beginPath();
                this.ctx.arc(elem.x, elem.y + Math.sin(elem.phase) * 10, elem.size, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (elem.type === 'vine') {
                this.ctx.strokeStyle = 'rgba(50, 30, 60, 0.5)';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(elem.x, elem.y);
                this.ctx.bezierCurveTo(
                    elem.x + elem.curve, elem.y + elem.length * 0.3,
                    elem.x - elem.curve, elem.y + elem.length * 0.6,
                    elem.x + elem.curve * 0.5, elem.y + elem.length
                );
                this.ctx.stroke();
            }
        }
        
        this.ctx.restore();
    }

    drawPlatforms(platforms) {
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        for (const platform of platforms) {
            platform.draw(this.ctx);
        }
        
        this.ctx.restore();
    }

    drawWalls(walls) {
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        for (const wall of walls) {
            wall.draw(this.ctx);
        }
        
        this.ctx.restore();
    }

    drawBenches(benches, player) {
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        for (const bench of benches) {
            bench.update(player);
            bench.draw(this.ctx);
        }
        
        this.ctx.restore();
    }

    drawCollectibles(collectibles) {
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        for (const item of collectibles) {
            item.update();
            item.draw(this.ctx);
        }
        
        this.ctx.restore();
    }

    drawAbilityPickups(abilityPickups) {
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        for (const pickup of abilityPickups) {
            pickup.update();
            pickup.draw(this.ctx);
        }
        
        this.ctx.restore();
    }

    drawExits(exits) {
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        for (const exit of exits) {
            const gradient = this.ctx.createRadialGradient(
                exit.x + exit.width / 2, exit.y + exit.height / 2, 0,
                exit.x + exit.width / 2, exit.y + exit.height / 2, 50
            );
            gradient.addColorStop(0, 'rgba(100, 200, 255, 0.4)');
            gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(exit.x - 20, exit.y - 20, exit.width + 40, exit.height + 40);
            
            this.ctx.fillStyle = 'rgba(100, 200, 255, 0.6)';
            this.ctx.fillRect(exit.x, exit.y, exit.width, exit.height);
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '14px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('→', exit.x + exit.width / 2, exit.y + exit.height / 2 + 5);
        }
        
        this.ctx.restore();
    }

    drawEnemies(enemies) {
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        for (const enemy of enemies) {
            enemy.draw(this.ctx);
        }
        
        this.ctx.restore();
    }

    drawBoss(boss) {
        if (!boss || !boss.isActive) return;
        
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        boss.draw(this.ctx);
        
        this.ctx.restore();
    }

    drawPlayer(player) {
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        player.draw(this.ctx);
        
        this.ctx.restore();
    }

    drawParticles(particleSystem) {
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        particleSystem.draw(this.ctx);
        
        this.ctx.restore();
    }

    showAbilityUnlock(abilityName) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(10, 5, 20, 0.9);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            animation: fadeIn 0.5s ease;
        `;
        
        const icon = document.createElement('div');
        icon.style.cssText = `
            font-size: 80px;
            margin-bottom: 20px;
            animation: pulse 1s ease infinite;
        `;
        
        let iconChar = '🗡️';
        switch (abilityName) {
            case 'dash': iconChar = '💨'; break;
            case 'wallClimb': iconChar = '🧗'; break;
            case 'spell': iconChar = '🎯'; break;
            case 'shadowDash': iconChar = '✨'; break;
        }
        icon.textContent = iconChar;
        
        const title = document.createElement('h2');
        title.style.cssText = `
            color: #e0c0ff;
            font-size: 32px;
            margin-bottom: 10px;
            letter-spacing: 3px;
        `;
        title.textContent = '获得新能力！';
        
        const name = document.createElement('p');
        name.style.cssText = `
            color: #c0a0e0;
            font-size: 24px;
            letter-spacing: 2px;
        `;
        
        let abilityTitle = '';
        let abilityHint = '';
        switch (abilityName) {
            case 'dash':
                abilityTitle = '螳螂爪 - 冲刺';
                abilityHint = '按 Shift 进行水平冲刺';
                break;
            case 'wallClimb':
                abilityTitle = '蛾翼披风 - 爬墙';
                abilityHint = '靠近墙壁时可以贴墙并跳跃';
                break;
            case 'spell':
                abilityTitle = '灵魂法术';
                abilityHint = '按 K 消耗灵魂释放法术';
                break;
            case 'shadowDash':
                abilityTitle = '暗影冲刺';
                abilityHint = '冲刺时处于无敌状态';
                break;
        }
        name.textContent = abilityTitle;
        
        const hint = document.createElement('p');
        hint.style.cssText = `
            color: #807090;
            font-size: 16px;
            margin-top: 20px;
        `;
        hint.textContent = abilityHint;
        
        const closeBtn = document.createElement('button');
        closeBtn.style.cssText = `
            margin-top: 40px;
            padding: 12px 40px;
            background: transparent;
            border: 2px solid #604080;
            color: #c0a0e0;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        closeBtn.textContent = '继续探索';
        closeBtn.onmouseover = () => {
            closeBtn.style.background = 'rgba(100, 60, 130, 0.3)';
            closeBtn.style.borderColor = '#a080c0';
        };
        closeBtn.onmouseout = () => {
            closeBtn.style.background = 'transparent';
            closeBtn.style.borderColor = '#604080';
        };
        closeBtn.onclick = () => {
            overlay.remove();
        };
        
        overlay.appendChild(icon);
        overlay.appendChild(title);
        overlay.appendChild(name);
        overlay.appendChild(hint);
        overlay.appendChild(closeBtn);
        document.body.appendChild(overlay);
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
        `;
        document.head.appendChild(style);
    }
}