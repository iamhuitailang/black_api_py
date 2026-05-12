class Enemy {
    constructor(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.type = type;
        this.defeated = false;
        this.vx = 0;
        this.vy = 0;
        this.direction = 1;
        this.animFrame = 0;
        this.animTimer = 0;
        this.setupType();
    }

    setupType() {
        switch (this.type) {
            case 'crawler':
                this.vx = 2;
                this.color = '#ff6b6b';
                break;
            case 'flyer':
                this.baseY = this.y;
                this.floatOffset = 0;
                this.color = '#9b59b6';
                break;
            case 'turret':
                this.shootTimer = 0;
                this.color = '#e74c3c';
                this.width = 50;
                this.height = 50;
                break;
            case 'drill':
                this.underground = true;
                this.surfaceTimer = 0;
                this.color = '#7f8c8d';
                break;
            case 'boss':
                this.width = 100;
                this.height = 100;
                this.health = 10;
                this.maxHealth = 10;
                this.phase = 1;
                this.attackTimer = 0;
                this.color = '#c0392b';
                break;
            default:
                this.vx = 1.5;
                this.color = '#e74c3c';
        }
    }

    update(player, platforms) {
        if (this.defeated) return;

        this.animTimer++;
        if (this.animTimer > 10) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }

        switch (this.type) {
            case 'crawler':
                this.x += this.vx * this.direction;
                break;
            
            case 'flyer':
                this.floatOffset += 0.05;
                this.y = this.baseY + Math.sin(this.floatOffset) * 30;
                const dx = player.x - this.x;
                if (Math.abs(dx) < 300 && Math.random() < 0.02) {
                    this.vx = Math.sign(dx) * 3;
                }
                this.x += this.vx;
                this.vx *= 0.98;
                break;
            
            case 'turret':
                this.shootTimer++;
                break;
            
            case 'drill':
                if (this.underground) {
                    if (Math.abs(player.x - this.x) < 100 && Math.random() < 0.01) {
                        this.underground = false;
                        this.vy = -15;
                    }
                } else {
                    this.vy += 0.5;
                    this.y += this.vy;
                    this.surfaceTimer++;
                    if (this.surfaceTimer > 120) {
                        this.underground = true;
                        this.surfaceTimer = 0;
                        this.y = player.y + 100;
                    }
                }
                break;
            
            case 'boss':
                this.updateBoss(player);
                break;
        }
    }

    updateBoss(player) {
        this.attackTimer++;

        if (this.phase === 1) {
            this.x += Math.sin(this.attackTimer * 0.02) * 3;
            if (this.attackTimer % 60 === 0) {
                this.vy = -10;
            }
        } else if (this.phase === 2) {
            const targetX = player.x;
            this.x += (targetX - this.x) * 0.02;
            if (this.attackTimer % 40 === 0) {
                this.vy = -12;
            }
        } else {
            this.x += Math.sin(this.attackTimer * 0.05) * 5;
            if (this.attackTimer % 30 === 0) {
                this.vy = -15;
            }
        }

        this.vy += 0.5;
        this.y += this.vy;

        if (this.y > 500) {
            this.y = 500;
            this.vy = 0;
        }

        if (this.health <= this.maxHealth * 0.66 && this.phase === 1) {
            this.phase = 2;
        } else if (this.health <= this.maxHealth * 0.33 && this.phase === 2) {
            this.phase = 3;
        }
    }

    takeDamage() {
        if (this.type === 'boss') {
            this.health--;
            if (this.health <= 0) {
                this.defeated = true;
                return true;
            }
            return false;
        }
        this.defeated = true;
        return true;
    }

    draw(ctx, cameraX, player = null) {
        if (this.defeated) return;

        const drawX = this.x - cameraX;

        ctx.fillStyle = this.color;

        switch (this.type) {
            case 'crawler':
                ctx.beginPath();
                ctx.ellipse(drawX + this.width / 2, this.y + this.height / 2, 
                           this.width / 2, this.height / 2.5, 0, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(drawX + this.width / 2 - 8, this.y + this.height / 3, 6, 0, Math.PI * 2);
                ctx.arc(drawX + this.width / 2 + 8, this.y + this.height / 3, 6, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(drawX + this.width / 2 - 8 + this.direction * 2, this.y + this.height / 3, 3, 0, Math.PI * 2);
                ctx.arc(drawX + this.width / 2 + 8 + this.direction * 2, this.y + this.height / 3, 3, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'flyer':
                ctx.beginPath();
                ctx.arc(drawX + this.width / 2, this.y + this.height / 2, this.width / 2.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(drawX + this.width / 2, this.y + this.height / 2);
                ctx.lineTo(drawX - 10, this.y + this.height / 2 - 20 + Math.sin(this.animFrame) * 10);
                ctx.lineTo(drawX + this.width / 2, this.y + this.height / 2 - 10);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(drawX + this.width / 2, this.y + this.height / 2);
                ctx.lineTo(drawX + this.width + 10, this.y + this.height / 2 - 20 + Math.sin(this.animFrame) * 10);
                ctx.lineTo(drawX + this.width / 2, this.y + this.height / 2 - 10);
                ctx.fill();

                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(drawX + this.width / 2, this.y + this.height / 2, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(drawX + this.width / 2, this.y + this.height / 2, 4, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'turret':
                ctx.fillRect(drawX, this.y + this.height / 2, this.width, this.height / 2);
                
                ctx.fillStyle = '#555';
                ctx.fillRect(drawX + 5, this.y, this.width - 10, this.height / 2);
                
                ctx.fillStyle = '#333';
                const angle = player ? Math.atan2(player.y - this.y, player.x - this.x) : 0;
                ctx.save();
                ctx.translate(drawX + this.width / 2, this.y + this.height / 3);
                ctx.rotate(angle);
                ctx.fillRect(0, -5, 30, 10);
                ctx.restore();
                break;

            case 'drill':
                if (!this.underground) {
                    ctx.beginPath();
                    ctx.moveTo(drawX + this.width / 2, this.y);
                    ctx.lineTo(drawX, this.y + this.height);
                    ctx.lineTo(drawX + this.width, this.y + this.height);
                    ctx.closePath();
                    ctx.fill();

                    ctx.strokeStyle = '#555';
                    ctx.lineWidth = 3;
                    for (let i = 0; i < 3; i++) {
                        ctx.beginPath();
                        ctx.arc(drawX + this.width / 2, this.y + this.height - 10 - i * 10, 
                               15 - i * 3, 0, Math.PI);
                        ctx.stroke();
                    }
                }
                break;

            case 'boss':
                ctx.fillStyle = this.phase === 3 ? '#ff0000' : this.color;
                
                ctx.beginPath();
                ctx.ellipse(drawX + this.width / 2, this.y + this.height * 0.6, 
                           this.width / 2, this.height * 0.4, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.beginPath();
                ctx.arc(drawX + this.width / 2, this.y + this.height * 0.3, 
                       this.width * 0.35, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.moveTo(drawX + this.width * 0.2, this.y + this.height * 0.2);
                ctx.lineTo(drawX + this.width * 0.1, this.y);
                ctx.lineTo(drawX + this.width * 0.3, this.y + this.height * 0.15);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(drawX + this.width * 0.8, this.y + this.height * 0.2);
                ctx.lineTo(drawX + this.width * 0.9, this.y);
                ctx.lineTo(drawX + this.width * 0.7, this.y + this.height * 0.15);
                ctx.fill();

                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(drawX + this.width * 0.35, this.y + this.height * 0.3, 10, 0, Math.PI * 2);
                ctx.arc(drawX + this.width * 0.65, this.y + this.height * 0.3, 10, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = this.phase >= 2 ? '#ff0000' : '#000';
                ctx.beginPath();
                ctx.arc(drawX + this.width * 0.35, this.y + this.height * 0.3, 5, 0, Math.PI * 2);
                ctx.arc(drawX + this.width * 0.65, this.y + this.height * 0.3, 5, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#333';
                ctx.fillRect(drawX, this.y - 20, this.width, 10);
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(drawX, this.y - 20, this.width * (this.health / this.maxHealth), 10);
                break;
        }
    }
}
