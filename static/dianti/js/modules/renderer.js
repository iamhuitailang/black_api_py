const Renderer = (() => {
    let canvas, ctx;
    let width, height;
    let buildings = [];
    
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    };
    
    const rgbToHex = (r, g, b) => {
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };
    
    const lightenColor = (hex, percent) => {
        const rgb = hexToRgb(hex);
        const amount = Math.round(2.55 * percent);
        return rgbToHex(
            Math.min(255, rgb.r + amount),
            Math.min(255, rgb.g + amount),
            Math.min(255, rgb.b + amount)
        );
    };
    
    const darkenColor = (hex, percent) => {
        const rgb = hexToRgb(hex);
        const amount = Math.round(2.55 * percent);
        return rgbToHex(
            Math.max(0, rgb.r - amount),
            Math.max(0, rgb.g - amount),
            Math.max(0, rgb.b - amount)
        );
    };
    
    const init = (canvasElement) => {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        generateBuildings();
        resize();
        window.addEventListener('resize', () => {
            resize();
            generateBuildings();
        });
    };
    
    const generateBuildings = () => {
        buildings = [];
        for (let i = 0; i < 8; i++) {
            const buildingWidth = 80 + Math.random() * 120;
            const buildingHeight = 200 + Math.random() * 400;
            const x = (i * 150) + 50;
            const y = height - buildingHeight;
            
            const windows = [];
            for (let wy = y + 20; wy < height - 20; wy += 30) {
                for (let wx = x + 10; wx < x + buildingWidth - 10; wx += 25) {
                    if (Math.random() > 0.3) {
                        windows.push({ x: wx, y: wy });
                    }
                }
            }
            
            buildings.push({
                x, y, width: buildingWidth, height: buildingHeight, windows
            });
        }
    };
    
    const resize = () => {
        const container = canvas.parentElement;
        const rect = container.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        canvas.width = width;
        canvas.height = height;
    };
    
    const clear = () => {
        ctx.clearRect(0, 0, width, height);
    };
    
    const drawBackground = (currentFloor) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f0f23');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = 'rgba(30, 41, 59, 0.3)';
        buildings.forEach(building => {
            ctx.fillRect(building.x, building.y, building.width, building.height);
            
            ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
            building.windows.forEach(window => {
                ctx.fillRect(window.x, window.y, 15, 20);
            });
            ctx.fillStyle = 'rgba(30, 41, 59, 0.3)';
        });
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(currentFloor)}F`, width / 2, height / 2);
    };
    
    const drawElevator = (elevator, shakeAmount = 0) => {
        const shakeX = (Math.random() - 0.5) * shakeAmount;
        const shakeY = (Math.random() - 0.5) * shakeAmount;
        const x = elevator.x + shakeX;
        const y = elevator.y + shakeY;
        const w = elevator.width;
        const h = elevator.height;
        
        ctx.fillStyle = '#374151';
        ctx.fillRect(x - 10, y - 10, w + 20, h + 20);
        
        const elevatorGradient = ctx.createLinearGradient(x, y, x + w, y + h);
        elevatorGradient.addColorStop(0, '#1f2937');
        elevatorGradient.addColorStop(0.5, '#374151');
        elevatorGradient.addColorStop(1, '#1f2937');
        ctx.fillStyle = elevatorGradient;
        ctx.fillRect(x, y, w, h);
        
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);
        
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(x + 10, y + 10, w - 20, 50);
        
        ctx.fillStyle = '#374151';
        ctx.fillRect(x + 15, y + 15, 40, 40);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(x + 35, y + 35, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(x + 35, y + 35, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('▲', x + 60, y + 35);
        ctx.fillText('▼', x + 85, y + 35);
        
        ctx.fillStyle = '#6b7280';
        ctx.fillRect(x + 20, y + h - 30, w - 40, 20);
        
        ctx.fillStyle = '#9ca3af';
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(x + 50 + i * 80, y + h - 20, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(x - 5, y - 60, 10, 70);
        ctx.fillRect(x + w - 5, y - 60, 10, 70);
        
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x + i * 60 + 20, y);
            ctx.lineTo(x + i * 60 + 20, y - 50);
            ctx.stroke();
        }
    };
    
    const drawModernCharacter = (x, y, width, height, color, isPlayer = true, isHit = false) => {
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        
        if (isHit) {
            ctx.globalAlpha = 0.7;
        }
        
        const centerX = x + width / 2;
        const shadowY = y + height;
        
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(centerX, shadowY + 3, width * 0.35, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const headRadius = width * 0.35;
        const headY = y + headRadius + 5;
        
        const neckY = headY + headRadius * 0.85;
        const shoulderY = neckY + height * 0.04;
        const chestY = shoulderY + height * 0.08;
        const waistY = y + height * 0.52;
        const hipY = y + height * 0.58;
        const kneeY = y + height * 0.76;
        const ankleY = y + height * 0.94;
        const footY = y + height;
        
        ctx.fillStyle = '#f5f5f4';
        ctx.beginPath();
        ctx.moveTo(centerX - width * 0.12, neckY);
        ctx.lineTo(centerX + width * 0.12, neckY);
        ctx.lineTo(centerX + width * 0.1, shoulderY + 3);
        ctx.lineTo(centerX - width * 0.1, shoulderY + 3);
        ctx.closePath();
        ctx.fill();
        
        const bodyGradient = ctx.createLinearGradient(centerX - width * 0.45, shoulderY, centerX + width * 0.45, hipY);
        bodyGradient.addColorStop(0, lightenColor(color, 25));
        bodyGradient.addColorStop(0.25, color);
        bodyGradient.addColorStop(0.5, lightenColor(color, 10));
        bodyGradient.addColorStop(0.75, color);
        bodyGradient.addColorStop(1, darkenColor(color, 30));
        ctx.fillStyle = bodyGradient;
        
        ctx.beginPath();
        ctx.moveTo(centerX - width * 0.45, shoulderY);
        ctx.quadraticCurveTo(centerX - width * 0.5, chestY, centerX - width * 0.38, hipY);
        ctx.lineTo(centerX + width * 0.38, hipY);
        ctx.quadraticCurveTo(centerX + width * 0.5, chestY, centerX + width * 0.45, shoulderY);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.ellipse(centerX - width * 0.2, chestY - 5, width * 0.08, height * 0.06, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.ellipse(centerX + width * 0.15, chestY + 15, width * 0.1, height * 0.05, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        const pantColor = isPlayer ? '#1e3a5f' : '#3d1a1a';
        const pantGradient = ctx.createLinearGradient(centerX - width * 0.32, hipY, centerX + width * 0.32, kneeY);
        pantGradient.addColorStop(0, pantColor);
        pantGradient.addColorStop(0.5, darkenColor(pantColor, 10));
        pantGradient.addColorStop(1, darkenColor(pantColor, 35));
        ctx.fillStyle = pantGradient;
        
        ctx.beginPath();
        ctx.moveTo(centerX - width * 0.32, hipY);
        ctx.quadraticCurveTo(centerX - width * 0.28, kneeY - 10, centerX - width * 0.22, kneeY);
        ctx.lineTo(centerX - width * 0.03, kneeY);
        ctx.lineTo(centerX - width * 0.07, hipY);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(centerX + width * 0.32, hipY);
        ctx.quadraticCurveTo(centerX + width * 0.28, kneeY - 10, centerX + width * 0.22, kneeY);
        ctx.lineTo(centerX + width * 0.03, kneeY);
        ctx.lineTo(centerX + width * 0.07, hipY);
        ctx.closePath();
        ctx.fill();
        
        const calfGradient = ctx.createLinearGradient(centerX - width * 0.22, kneeY, centerX - width * 0.22, ankleY);
        calfGradient.addColorStop(0, darkenColor(pantColor, 20));
        calfGradient.addColorStop(1, darkenColor(pantColor, 45));
        ctx.fillStyle = calfGradient;
        
        ctx.beginPath();
        ctx.moveTo(centerX - width * 0.22, kneeY);
        ctx.quadraticCurveTo(centerX - width * 0.25, ankleY - 15, centerX - width * 0.2, ankleY);
        ctx.lineTo(centerX - width * 0.03, ankleY);
        ctx.lineTo(centerX - width * 0.03, kneeY);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(centerX + width * 0.22, kneeY);
        ctx.quadraticCurveTo(centerX + width * 0.25, ankleY - 15, centerX + width * 0.2, ankleY);
        ctx.lineTo(centerX + width * 0.03, ankleY);
        ctx.lineTo(centerX + width * 0.03, kneeY);
        ctx.closePath();
        ctx.fill();
        
        const shoeGradient = ctx.createLinearGradient(centerX - width * 0.15, footY - 8, centerX - width * 0.15, footY);
        shoeGradient.addColorStop(0, '#374151');
        shoeGradient.addColorStop(1, '#111827');
        ctx.fillStyle = shoeGradient;
        
        ctx.beginPath();
        ctx.ellipse(centerX - width * 0.14, footY - 4, width * 0.14, 7, 0.15, 0, Math.PI * 2);
        ctx.ellipse(centerX + width * 0.14, footY - 4, width * 0.14, 7, -0.15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#1f2937';
        ctx.beginPath();
        ctx.ellipse(centerX - width * 0.14, footY - 2, width * 0.08, 3, 0.15, 0, Math.PI * 2);
        ctx.ellipse(centerX + width * 0.14, footY - 2, width * 0.08, 3, -0.15, 0, Math.PI * 2);
        ctx.fill();
        
        const headGradient = ctx.createRadialGradient(
            centerX - headRadius * 0.35, headY - headRadius * 0.4, headRadius * 0.1,
            centerX, headY, headRadius
        );
        headGradient.addColorStop(0, '#fef9c3');
        headGradient.addColorStop(0.3, '#fde68a');
        headGradient.addColorStop(0.6, '#fcd34d');
        headGradient.addColorStop(1, '#b45309');
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.arc(centerX, headY, headRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
        ctx.beginPath();
        ctx.ellipse(centerX - headRadius * 0.55, headY + headRadius * 0.35, 5, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(centerX + headRadius * 0.55, headY + headRadius * 0.35, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(centerX - 9, headY - 5);
        ctx.quadraticCurveTo(centerX - 5, headY - 8, centerX - 2, headY - 5);
        ctx.moveTo(centerX + 9, headY - 5);
        ctx.quadraticCurveTo(centerX + 5, headY - 8, centerX + 2, headY - 5);
        ctx.stroke();
        
        ctx.fillStyle = '#1f2937';
        ctx.beginPath();
        ctx.ellipse(centerX - 7, headY + 2, 4.5, 5.5, 0, 0, Math.PI * 2);
        ctx.ellipse(centerX + 7, headY + 2, 4.5, 5.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = isPlayer ? '#3b82f6' : '#ef4444';
        ctx.beginPath();
        ctx.arc(centerX - 6, headY + 1.5, 2, 0, Math.PI * 2);
        ctx.arc(centerX + 8, headY + 1.5, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX - 8, headY - 0.5, 1.2, 0, Math.PI * 2);
        ctx.arc(centerX + 6, headY - 0.5, 1.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(centerX, headY + headRadius * 0.28, 2.5, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, headY + headRadius * 0.42, 6, 0.15, Math.PI - 0.15);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 100, 100, 0.3)';
        ctx.beginPath();
        ctx.arc(centerX, headY + headRadius * 0.45, 2, 0, Math.PI * 2);
        ctx.fill();
        
        if (isPlayer) {
            const hairColor = '#1f2937';
            ctx.fillStyle = hairColor;
            ctx.beginPath();
            ctx.arc(centerX, headY - headRadius * 0.25, headRadius * 0.75, Math.PI * 1.05, Math.PI * -0.05);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(centerX - headRadius * 0.72, headY - headRadius * 0.05);
            ctx.quadraticCurveTo(centerX - headRadius * 0.82, headY + headRadius * 0.25, centerX - headRadius * 0.52, headY + headRadius * 0.45);
            ctx.lineTo(centerX - headRadius * 0.28, headY);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(centerX + headRadius * 0.72, headY - headRadius * 0.05);
            ctx.quadraticCurveTo(centerX + headRadius * 0.82, headY + headRadius * 0.25, centerX + headRadius * 0.52, headY + headRadius * 0.45);
            ctx.lineTo(centerX + headRadius * 0.28, headY);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.moveTo(centerX - width * 0.35, shoulderY + 8);
            ctx.lineTo(centerX - width * 0.35, shoulderY + 22);
            ctx.lineTo(centerX - width * 0.28, shoulderY + 15);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillStyle = '#7f1d1d';
            ctx.beginPath();
            ctx.arc(centerX, headY - headRadius * 0.15, headRadius * 0.65, Math.PI * 1.1, Math.PI * -0.1);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(centerX - headRadius * 0.55, headY + headRadius * 0.15);
            ctx.lineTo(centerX - headRadius * 0.7, headY + headRadius * 0.6);
            ctx.lineTo(centerX - headRadius * 0.35, headY + headRadius * 0.38);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(centerX + headRadius * 0.55, headY + headRadius * 0.15);
            ctx.lineTo(centerX + headRadius * 0.7, headY + headRadius * 0.6);
            ctx.lineTo(centerX + headRadius * 0.35, headY + headRadius * 0.38);
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = '#450a0a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(centerX - headRadius * 0.25, headY - headRadius * 0.15);
            ctx.lineTo(centerX + headRadius * 0.1, headY - headRadius * 0.08);
            ctx.moveTo(centerX - headRadius * 0.1, headY - headRadius * 0.08);
            ctx.lineTo(centerX + headRadius * 0.25, headY - headRadius * 0.15);
            ctx.stroke();
        }
        
        ctx.restore();
    };
    
    const drawPlayer = (player) => {
        const x = player.x;
        const y = player.y;
        const w = player.width;
        const h = player.height;
        
        if (player.invincible && Math.floor(player.invincibleTime / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        if (player.isShielded) {
            const shieldGradient = ctx.createRadialGradient(
                x + w / 2, y + h / 2, 0,
                x + w / 2, y + h / 2, 50
            );
            shieldGradient.addColorStop(0, 'rgba(96, 165, 250, 0.1)');
            shieldGradient.addColorStop(0.7, 'rgba(96, 165, 250, 0.3)');
            shieldGradient.addColorStop(1, 'rgba(96, 165, 250, 0.6)');
            
            ctx.fillStyle = shieldGradient;
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h / 2, 50, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(96, 165, 250, 0.8)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h / 2, 50, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        drawModernCharacter(x, y, w, h, player.color, true, false);
        
        if (player.isAttacking) {
            const attackRadius = 30 + (player.attackFrame / 300) * 30;
            const attackGradient = ctx.createRadialGradient(
                x + w / 2, y + h / 2, 0,
                x + w / 2, y + h / 2, attackRadius
            );
            attackGradient.addColorStop(0, 'rgba(251, 191, 36, 0)');
            attackGradient.addColorStop(0.5, 'rgba(251, 191, 36, 0.3)');
            attackGradient.addColorStop(1, 'rgba(251, 191, 36, 0.6)');
            
            ctx.fillStyle = attackGradient;
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h / 2, attackRadius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h / 2, attackRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
    };
    
    const drawEnemy = (enemy) => {
        const x = enemy.x;
        const y = enemy.y;
        const w = enemy.width;
        const h = enemy.height;
        
        drawModernCharacter(x, y, w, h, enemy.color, false, enemy.isHit);
        
        const healthPercent = enemy.health / enemy.maxHealth;
        const barWidth = w;
        const barHeight = 6;
        const barX = x;
        const barY = y - 15;
        
        ctx.fillStyle = '#1f2937';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth, barHeight, 3);
        ctx.fill();
        
        const healthColor = healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#f59e0b' : '#ef4444';
        ctx.fillStyle = healthColor;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth * healthPercent, barHeight, 3);
        ctx.fill();
    };
    
    const drawTrap = (trap) => {
        if (!trap.active) return;
        
        const x = trap.x;
        const y = trap.y;
        const w = trap.width;
        const h = trap.height;
        
        const pulse = Math.sin(trap.animationFrame / 200) * 0.3 + 0.7;
        
        switch (trap.type) {
            case 'electric':
                ctx.fillStyle = `rgba(251, 191, 36, ${pulse * 0.6})`;
                ctx.beginPath();
                ctx.roundRect(x, y, w, h, 4);
                ctx.fill();
                
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x + 5, y);
                ctx.lineTo(x + 15, y + h * 0.3);
                ctx.lineTo(x + 10, y + h * 0.5);
                ctx.lineTo(x + 20, y + h * 0.7);
                ctx.lineTo(x + 8, y + h);
                ctx.stroke();
                break;
                
            case 'falling':
                const rockGradient = ctx.createLinearGradient(x, y, x + w, y + h);
                rockGradient.addColorStop(0, '#6b7280');
                rockGradient.addColorStop(0.5, '#4b5563');
                rockGradient.addColorStop(1, '#374151');
                
                ctx.fillStyle = rockGradient;
                ctx.beginPath();
                ctx.moveTo(x + w / 2, y);
                ctx.lineTo(x + w, y + h * 0.7);
                ctx.lineTo(x + w * 0.8, y + h);
                ctx.lineTo(x + w * 0.2, y + h);
                ctx.lineTo(x, y + h * 0.7);
                ctx.closePath();
                ctx.fill();
                
                ctx.fillStyle = '#9ca3af';
                ctx.beginPath();
                ctx.arc(x + w * 0.3, y + h * 0.3, 5, 0, Math.PI * 2);
                ctx.arc(x + w * 0.6, y + h * 0.5, 4, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'laser':
                ctx.fillStyle = `rgba(239, 68, 68, ${pulse})`;
                ctx.beginPath();
                ctx.roundRect(x, y, w, h, 2);
                ctx.fill();
                
                ctx.shadowColor = '#ef4444';
                ctx.shadowBlur = 15;
                ctx.fillRect(x, y, w, h);
                ctx.shadowBlur = 0;
                break;
                
            case 'malfunction':
                ctx.fillStyle = `rgba(139, 92, 246, ${pulse * 0.4})`;
                ctx.beginPath();
                ctx.roundRect(x, y, w, h, 6);
                ctx.fill();
                
                ctx.strokeStyle = '#8b5cf6';
                ctx.lineWidth = 2;
                for (let i = 0; i < 3; i++) {
                    const startX = x + w * (0.2 + i * 0.3);
                    const startY = y + h * (0.3 + i * 0.2);
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(startX + 10, startY + 15);
                    ctx.lineTo(startX - 5, startY + 25);
                    ctx.stroke();
                }
                break;
        }
    };
    
    const drawItem = (item) => {
        if (item.collected) return;
        
        const x = item.x;
        const y = item.y + Math.sin(item.animationFrame / 300) * 5;
        const w = item.width;
        const h = item.height;
        
        ctx.shadowColor = item.color;
        ctx.shadowBlur = 15;
        
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 8);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(item.icon, x + w / 2, y + h / 2 + 6);
    };
    
    const drawSkillEffect = (effect) => {
        if (!effect) return;
        
        const x = effect.x;
        const y = effect.y;
        const radius = effect.radius;
        
        if (effect.type === 'shield') {
            ctx.strokeStyle = 'rgba(96, 165, 250, 0.8)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.stroke();
        } else if (effect.type === 'dash') {
            ctx.fillStyle = 'rgba(52, 211, 153, 0.5)';
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        } else if (effect.type === 'knockback') {
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    };
    
    return {
        init,
        resize,
        clear,
        drawBackground,
        drawElevator,
        drawPlayer,
        drawEnemy,
        drawTrap,
        drawItem,
        drawSkillEffect
    };
})();