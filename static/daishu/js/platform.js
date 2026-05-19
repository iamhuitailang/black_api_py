class Platform {
    constructor(x, y, width, height, type = 'solid', options = {}) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.originalX = x;
        this.originalY = y;
        this.vx = 0;
        this.vy = 0;
        
        const typeConfig = CONFIG.platform.types[type];
        this.color = options.color || typeConfig.color;
        this.borderColor = options.borderColor || typeConfig.borderColor;
        
        if (type === 'moving') {
            this.moveX = options.moveX || 0;
            this.moveY = options.moveY || 0;
            this.speed = options.speed || 2;
            this.moveTimer = 0;
        }
        
        if (type === 'fragile') {
            this.breakTime = options.breakTime || typeConfig.breakTime;
            this.breaking = false;
            this.breakTimer = 0;
            this.broken = false;
            this.respawnTime = 3000;
            this.respawnTimer = 0;
        }
        
        if (type === 'invisible') {
            this.triggerDistance = options.triggerDistance || typeConfig.triggerDistance;
            this.currentAlpha = 0;
            this.visible = false;
        }
    }
    
    update(deltaTime, playerX, playerY) {
        if (this.type === 'moving') {
            this.moveTimer += deltaTime / 1000;
            const prevX = this.x;
            const prevY = this.y;
            
            if (this.moveX !== 0) {
                this.x = this.originalX + Math.sin(this.moveTimer * this.speed) * this.moveX;
            }
            if (this.moveY !== 0) {
                this.y = this.originalY + Math.sin(this.moveTimer * this.speed) * this.moveY;
            }
            
            this.vx = this.x - prevX;
            this.vy = this.y - prevY;
        }
        
        if (this.type === 'fragile') {
            if (this.breaking) {
                this.breakTimer += deltaTime;
                if (this.breakTimer >= this.breakTime) {
                    this.broken = true;
                    this.breaking = false;
                    this.respawnTimer = 0;
                }
            }
            if (this.broken) {
                this.respawnTimer += deltaTime;
                if (this.respawnTimer >= this.respawnTime) {
                    this.broken = false;
                    this.breakTimer = 0;
                }
            }
        }
        
        if (this.type === 'invisible') {
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            const dx = playerX - centerX;
            const dy = playerY - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const targetAlpha = distance < this.triggerDistance ? 1 : 0;
            this.currentAlpha += (targetAlpha - this.currentAlpha) * 0.1;
            this.visible = this.currentAlpha > 0.3;
        }
    }
    
    startBreaking() {
        if (this.type === 'fragile' && !this.breaking && !this.broken) {
            this.breaking = true;
            this.breakTimer = 0;
        }
    }
    
    render(ctx, particleSystem) {
        if (this.broken) return;
        
        ctx.save();
        
        if (this.type === 'invisible') {
            ctx.globalAlpha = this.currentAlpha * 0.8;
        }
        
        if (this.type === 'fragile' && this.breaking) {
            const shake = Math.sin(this.breakTimer / 50) * 2;
            ctx.translate(shake, 0);
        }
        
        const gradient = ctx.createLinearGradient(
            this.x, this.y,
            this.x, this.y + this.height
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, this.adjustColor(this.color, -30));
        
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.borderColor;
        
        const radius = 8;
        ctx.beginPath();
        ctx.moveTo(this.x + radius, this.y);
        ctx.lineTo(this.x + this.width - radius, this.y);
        ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + radius);
        ctx.lineTo(this.x + this.width, this.y + this.height - radius);
        ctx.quadraticCurveTo(this.x + this.width, this.y + this.height, this.x + this.width - radius, this.y + this.height);
        ctx.lineTo(this.x + radius, this.y + this.height);
        ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - radius);
        ctx.lineTo(this.x, this.y + radius);
        ctx.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = this.borderColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(this.x + 5, this.y + 3, this.width - 10, 3);
        
        if (this.type === 'fragile' && this.breaking) {
            for (let i = 0; i < 2; i++) {
                particleSystem.emit(
                    this.x + Math.random() * this.width,
                    this.y + this.height,
                    1,
                    {
                        color: this.borderColor,
                        vy: 1,
                        life: 0.3,
                        size: 2,
                        gravity: 0.1
                    }
                );
            }
        }
        
        ctx.restore();
    }
    
    adjustColor(color, amount) {
        if (color.startsWith('rgba')) {
            const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (match) {
                const r = Math.max(0, Math.min(255, parseInt(match[1]) + amount));
                const g = Math.max(0, Math.min(255, parseInt(match[2]) + amount));
                const b = Math.max(0, Math.min(255, parseInt(match[3]) + amount));
                return `rgba(${r}, ${g}, ${b}, 0.8)`;
            }
        }
        return color;
    }
    
    serialize() {
        return {
            x: this.x,
            y: this.y,
            originalX: this.originalX,
            originalY: this.originalY,
            width: this.width,
            height: this.height,
            type: this.type,
            broken: this.broken,
            breaking: this.breaking,
            breakTimer: this.breakTimer,
            respawnTimer: this.respawnTimer,
            moveTimer: this.type === 'moving' ? this.moveTimer : 0
        };
    }
    
    static deserialize(data) {
        const platform = new Platform(data.originalX, data.originalY, data.width, data.height, data.type);
        platform.x = data.x;
        platform.y = data.y;
        platform.broken = data.broken;
        platform.breaking = data.breaking;
        platform.breakTimer = data.breakTimer;
        platform.respawnTimer = data.respawnTimer;
        if (data.type === 'moving') {
            platform.moveTimer = data.moveTimer;
        }
        return platform;
    }
}
