class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false });
        this.width = canvas.width;
        this.height = canvas.height;
        
        this.pathPointsCache = null;
        this.towerSlotsCache = null;
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        this.pathPointsCache = null;
        this.towerSlotsCache = null;
    }

    clear() {
        const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
        gradient.addColorStop(0, '#3d6b2e');
        gradient.addColorStop(0.5, '#4a7c3f');
        gradient.addColorStop(1, '#3d6b2e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.drawGrass();
    }

    drawGrass() {
        this.ctx.fillStyle = 'rgba(60, 100, 40, 0.3)';
        for (let i = 0; i < 100; i++) {
            const x = (i * 137.5) % this.width;
            const y = (i * 73.3) % this.height;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 15 + (i % 10), 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawPath(pathPoints) {
        this.ctx.beginPath();
        this.ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
        
        for (let i = 1; i < pathPoints.length; i++) {
            this.ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
        }
        
        this.ctx.strokeStyle = '#8B7355';
        this.ctx.lineWidth = 40;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();

        this.ctx.strokeStyle = '#6B5344';
        this.ctx.lineWidth = 44;
        this.ctx.stroke();

        this.ctx.strokeStyle = '#A08060';
        this.ctx.lineWidth = 35;
        this.ctx.stroke();
    }

    drawTowerSlots(slots, selectedTower, gold) {
        for (const slot of slots) {
            this.ctx.beginPath();
            this.ctx.arc(slot.x, slot.y, slot.size / 2, 0, Math.PI * 2);
            
            if (slot.occupied) {
                this.ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
            } else if (selectedTower && gold >= CONFIG.TOWERS[selectedTower].levels[0].cost) {
                this.ctx.fillStyle = 'rgba(100, 200, 100, 0.5)';
                this.ctx.strokeStyle = '#4CAF50';
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
            } else {
                this.ctx.fillStyle = 'rgba(150, 150, 150, 0.4)';
            }
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#5D4037';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }

    drawTowers(towers, hoveredTower, selectedTowerForUpgrade) {
        for (const tower of towers) {
            const config = tower.config;
            const isSelected = hoveredTower === tower || selectedTowerForUpgrade === tower;

            if (isSelected) {
                this.ctx.beginPath();
                this.ctx.arc(tower.x, tower.y, config.range, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(100, 150, 255, 0.15)';
                this.ctx.fill();
                this.ctx.strokeStyle = 'rgba(100, 150, 255, 0.5)';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }

            this.ctx.fillStyle = '#5D4037';
            this.ctx.beginPath();
            this.ctx.arc(tower.x, tower.y, 22, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = config.color || '#8D6E63';
            this.ctx.beginPath();
            this.ctx.arc(tower.x, tower.y, 18, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#FFD700';
            for (let i = 0; i < tower.level; i++) {
                this.ctx.beginPath();
                this.ctx.arc(tower.x - 12 + i * 8, tower.y - 25, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }

            if (tower.type === 'arrow') {
                this.drawArrowTower(tower);
            } else if (tower.type === 'barracks') {
                this.drawBarracksTower(tower);
            } else if (tower.type === 'magic') {
                this.drawMagicTower(tower);
            } else if (tower.type === 'cannon') {
                this.drawCannonTower(tower);
            }

            if (isSelected) {
                this.ctx.strokeStyle = '#FFD700';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(tower.x, tower.y, 24, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        }
    }

    drawArrowTower(tower) {
        this.ctx.strokeStyle = '#4A2C0A';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(tower.x - 8, tower.y - 12);
        this.ctx.lineTo(tower.x, tower.y - 20);
        this.ctx.lineTo(tower.x + 8, tower.y - 12);
        this.ctx.stroke();
    }

    drawBarracksTower(tower) {
        this.ctx.fillStyle = '#6B8E23';
        this.ctx.fillRect(tower.x - 10, tower.y - 15, 20, 15);
        this.ctx.fillStyle = '#556B2F';
        this.ctx.fillRect(tower.x - 8, tower.y - 20, 16, 8);
        
        for (const soldier of tower.soldiers) {
            this.ctx.fillStyle = '#8B4513';
            this.ctx.beginPath();
            this.ctx.arc(soldier.x, soldier.y, 8, 0, Math.PI * 2);
            this.ctx.fill();
            
            const hpPercent = soldier.hp / soldier.maxHp;
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(soldier.x - 10, soldier.y - 15, 20, 4);
            this.ctx.fillStyle = hpPercent > 0.5 ? '#4CAF50' : hpPercent > 0.25 ? '#FFC107' : '#F44336';
            this.ctx.fillRect(soldier.x - 10, soldier.y - 15, 20 * hpPercent, 4);
        }
    }

    drawMagicTower(tower) {
        this.ctx.fillStyle = '#4B0082';
        this.ctx.beginPath();
        this.ctx.moveTo(tower.x, tower.y - 25);
        this.ctx.lineTo(tower.x - 12, tower.y + 5);
        this.ctx.lineTo(tower.x + 12, tower.y + 5);
        this.ctx.closePath();
        this.ctx.fill();

        const glow = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        this.ctx.fillStyle = `rgba(138, 43, 226, ${glow})`;
        this.ctx.beginPath();
        this.ctx.arc(tower.x, tower.y - 15, 6, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawCannonTower(tower) {
        this.ctx.fillStyle = '#696969';
        this.ctx.beginPath();
        this.ctx.arc(tower.x, tower.y - 5, 12, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#505050';
        this.ctx.fillRect(tower.x - 3, tower.y - 20, 6, 15);
    }

    drawEnemies(enemies) {
        for (const enemy of enemies) {
            if (enemy.dead) continue;

            const size = enemy.getSize();
            const color = enemy.getColor();

            if (enemy.flying) {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.beginPath();
                this.ctx.ellipse(enemy.x, enemy.y + size + 10, size * 0.8, size * 0.4, 0, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(enemy.x, enemy.y - (enemy.flying ? 15 : 0), size, 0, Math.PI * 2);
            this.ctx.fill();

            if (enemy.isBoss) {
                this.ctx.strokeStyle = '#FFD700';
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
                
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('👑', enemy.x, enemy.y - size - 10);
            }

            const hpPercent = enemy.hp / enemy.maxHp;
            const barWidth = size * 2;
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(enemy.x - barWidth / 2, enemy.y - size - 8, barWidth, 5);
            this.ctx.fillStyle = hpPercent > 0.5 ? '#4CAF50' : hpPercent > 0.25 ? '#FFC107' : '#F44336';
            this.ctx.fillRect(enemy.x - barWidth / 2, enemy.y - size - 8, barWidth * hpPercent, 5);

            if (enemy.burning) {
                this.ctx.fillStyle = 'rgba(255, 100, 0, 0.6)';
                this.ctx.beginPath();
                this.ctx.arc(enemy.x, enemy.y - size / 2, size * 0.5, 0, Math.PI * 2);
                this.ctx.fill();
            }

            if (enemy.stunned) {
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = '14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('💫', enemy.x, enemy.y - size - 15);
            }
        }
    }

    drawHero(hero) {
        if (!hero) return;

        this.ctx.fillStyle = hero.color;
        this.ctx.beginPath();
        this.ctx.arc(hero.x, hero.y, 20, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        let icon = '⚔️';
        if (hero.type === 'alleria') icon = '🏹';
        else if (hero.type === 'magnus') icon = '🔮';
        else if (hero.type === 'ingvar') icon = '🪓';
        else if (hero.type === 'orlok') icon = '💀';
        
        this.ctx.fillText(icon, hero.x, hero.y);

        const hpPercent = hero.hp / hero.maxHp;
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(hero.x - 20, hero.y - 30, 40, 5);
        this.ctx.fillStyle = hpPercent > 0.5 ? '#4CAF50' : hpPercent > 0.25 ? '#FFC107' : '#F44336';
        this.ctx.fillRect(hero.x - 20, hero.y - 30, 40 * hpPercent, 5);

        const skillPercent = hero.getSkillReadyPercent();
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(hero.x - 20, hero.y - 36, 40, 3);
        this.ctx.fillStyle = skillPercent >= 100 ? '#2196F3' : '#90CAF9';
        this.ctx.fillRect(hero.x - 20, hero.y - 36, 40 * (skillPercent / 100), 3);

        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '10px Arial';
        this.ctx.fillText(`Lv${hero.level}`, hero.x, hero.y + 30);
    }

    drawProjectiles(projectiles) {
        for (const p of projectiles) {
            if (p.type === 'arrow') {
                this.ctx.fillStyle = '#8B4513';
                this.ctx.beginPath();
                const angle = Math.atan2(p.targetY - p.y, p.targetX - p.x);
                this.ctx.save();
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(angle);
                this.ctx.fillRect(-8, -2, 16, 4);
                this.ctx.beginPath();
                this.ctx.moveTo(8, 0);
                this.ctx.lineTo(12, -4);
                this.ctx.lineTo(12, 4);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.restore();
            } else if (p.type === 'magic') {
                const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 8);
                gradient.addColorStop(0, '#FF00FF');
                gradient.addColorStop(0.5, '#9932CC');
                gradient.addColorStop(1, 'transparent');
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                this.ctx.fillStyle = '#333';
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }

    drawEffects(effects) {
        for (const effect of effects) {
            const progress = 1 - effect.duration / effect.maxDuration;
            
            switch (effect.type) {
                case 'explosion':
                    const explosionRadius = effect.radius * (0.5 + progress * 0.5);
                    const explosionGradient = this.ctx.createRadialGradient(
                        effect.x, effect.y, 0,
                        effect.x, effect.y, explosionRadius
                    );
                    explosionGradient.addColorStop(0, `rgba(255, 200, 100, ${1 - progress})`);
                    explosionGradient.addColorStop(0.5, `rgba(255, 100, 0, ${0.5 - progress * 0.5})`);
                    explosionGradient.addColorStop(1, 'transparent');
                    this.ctx.fillStyle = explosionGradient;
                    this.ctx.beginPath();
                    this.ctx.arc(effect.x, effect.y, explosionRadius, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;

                case 'lightning':
                    this.ctx.strokeStyle = `rgba(150, 200, 255, ${1 - progress})`;
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(effect.x1, effect.y1);
                    if (effect.points) {
                        for (const point of effect.points) {
                            this.ctx.lineTo(point.x, point.y);
                        }
                    } else {
                        this.ctx.lineTo(effect.x2, effect.y2);
                    }
                    this.ctx.stroke();
                    break;

                case 'hit':
                    this.ctx.fillStyle = `rgba(255, 255, 255, ${1 - progress})`;
                    this.ctx.beginPath();
                    this.ctx.arc(effect.x, effect.y, 8 * (1 + progress), 0, Math.PI * 2);
                    this.ctx.fill();
                    break;

                case 'fireball':
                    const fireGradient = this.ctx.createRadialGradient(
                        effect.x, effect.y, 0,
                        effect.x, effect.y, effect.radius
                    );
                    fireGradient.addColorStop(0, `rgba(255, 200, 50, ${0.8 - progress * 0.8})`);
                    fireGradient.addColorStop(0.5, `rgba(255, 100, 0, ${0.5 - progress * 0.5})`);
                    fireGradient.addColorStop(1, 'transparent');
                    this.ctx.fillStyle = fireGradient;
                    this.ctx.beginPath();
                    this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;

                case 'rain':
                    const rainPoints = effect.rainPoints || [];
                    for (let i = 0; i < rainPoints.length; i++) {
                        const point = rainPoints[i];
                        const angle = (i / 15) * Math.PI * 2 + progress * Math.PI;
                        const x = effect.x + Math.cos(angle) * point.r;
                        const y = effect.y + Math.sin(angle) * point.r;
                        
                        this.ctx.fillStyle = `rgba(255, 255, 255, ${1 - progress})`;
                        this.ctx.fillRect(x - 2, y - 4, 4, 8);
                    }
                    break;

                case 'whirlwind':
                    this.ctx.strokeStyle = `rgba(200, 100, 50, ${1 - progress})`;
                    this.ctx.lineWidth = 3;
                    for (let i = 0; i < 3; i++) {
                        this.ctx.beginPath();
                        const startAngle = i * (Math.PI * 2 / 3) + progress * Math.PI * 4;
                        this.ctx.arc(effect.x, effect.y, effect.radius * (0.3 + i * 0.25), startAngle, startAngle + Math.PI);
                        this.ctx.stroke();
                    }
                    break;

                case 'summon':
                    const summonGradient = this.ctx.createRadialGradient(
                        effect.x, effect.y, 0,
                        effect.x, effect.y, 40
                    );
                    summonGradient.addColorStop(0, `rgba(128, 0, 128, ${1 - progress})`);
                    summonGradient.addColorStop(1, 'transparent');
                    this.ctx.fillStyle = summonGradient;
                    this.ctx.beginPath();
                    this.ctx.arc(effect.x, effect.y, 40, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;

                case 'charge':
                    this.ctx.strokeStyle = `rgba(100, 150, 255, ${1 - progress})`;
                    this.ctx.lineWidth = 5;
                    this.ctx.beginPath();
                    this.ctx.arc(effect.x, effect.y, 30 + progress * 20, 0, Math.PI * 2);
                    this.ctx.stroke();
                    break;

                case 'crit':
                    this.ctx.fillStyle = `rgba(255, 50, 50, ${1 - progress})`;
                    this.ctx.font = 'bold 16px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('暴击!', effect.x, effect.y - progress * 20);
                    break;

                case 'shieldWall':
                    this.ctx.strokeStyle = `rgba(100, 200, 255, ${1 - progress})`;
                    this.ctx.lineWidth = 4;
                    this.ctx.beginPath();
                    this.ctx.arc(effect.x, effect.y, 50, 0, Math.PI * 2);
                    this.ctx.stroke();
                    break;
            }
        }
    }

    drawUI(gold, lives, wave, totalWaves, isPaused) {
    }
}
