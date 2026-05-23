class Platform {
    constructor(type, x, y, canvasWidth) {
        const config = GameConfig.platformTypes[type];
        this.type = type;
        this.config = config;
        this.originalX = x;
        this.x = x;
        this.y = y;
        this.width = config.width;
        this.height = config.height;
        this.durability = config.durability;
        this.maxDurability = config.durability;
        this.swingAngle = 0;
        this.swingAmplitude = config.swingAmplitude;
        this.swingSpeed = config.swingSpeed;
        this.swingOffset = Math.random() * Math.PI * 2;
        this.ropeLength = Utils.random(80, 150);
        this.anchorY = y - this.ropeLength;
        this.velocityX = 0;
        this.isBroken = false;
        this.breakTimer = 0;
        this.crumbleParts = [];
        this.hitFlash = 0;
        
        if (type === 'floating') {
            this.moveDirection = Math.random() > 0.5 ? 1 : -1;
            this.moveRange = config.moveRange;
            this.moveSpeed = config.moveSpeed;
            this.moveStartX = x;
        }
        
        this.canvasWidth = canvasWidth;
    }
    
    update() {
        if (this.isBroken) {
            this.breakTimer++;
            this.crumbleParts.forEach(part => {
                part.velocityY += 0.5;
                part.x += part.velocityX;
                part.y += part.velocityY;
                part.rotation += part.rotSpeed;
            });
            return;
        }
        
        const time = Date.now() * this.swingSpeed + this.swingOffset;
        this.swingAngle = Math.sin(time) * this.swingAmplitude;
        
        const swingX = Math.sin(this.swingAngle) * this.ropeLength;
        const swingY = Math.cos(this.swingAngle) * this.ropeLength;
        const targetX = this.originalX + swingX;
        this.velocityX = targetX - this.x;
        this.x = targetX;
        
        if (this.type === 'floating') {
            this.x += this.moveDirection * this.moveSpeed;
            if (this.x > this.moveStartX + this.moveRange || 
                this.x < this.moveStartX - this.moveRange) {
                this.moveDirection *= -1;
            }
            this.originalX = this.x - swingX;
        }
        
        if (this.hitFlash > 0) {
            this.hitFlash--;
        }
        
        this.x = Utils.clamp(this.x, 10, this.canvasWidth - this.width - 10);
    }
    
    takeDamage(amount) {
        if (this.isBroken) return false;
        
        this.durability -= amount;
        this.hitFlash = 10;
        
        if (this.durability <= 0) {
            this.break();
            return true;
        }
        return false;
    }
    
    break() {
        this.isBroken = true;
        this.breakTimer = 0;
        
        const partCount = Utils.randomInt(6, 10);
        for (let i = 0; i < partCount; i++) {
            this.crumbleParts.push({
                x: this.x + Math.random() * this.width,
                y: this.y + Math.random() * this.height,
                width: Utils.random(8, 20),
                height: Utils.random(4, 12),
                velocityX: Utils.random(-3, 3),
                velocityY: Utils.random(-5, -2),
                rotation: 0,
                rotSpeed: Utils.random(-0.2, 0.2),
                color: this.config.color
            });
        }
    }
    
    shouldRemove() {
        return this.isBroken && this.breakTimer > 60;
    }
    
    getSwingEndY() {
        return this.anchorY + Math.cos(this.swingAngle) * this.ropeLength;
    }
    
    draw(ctx) {
        if (this.isBroken) {
            this.crumbleParts.forEach(part => {
                ctx.save();
                ctx.translate(part.x, part.y);
                ctx.rotate(part.rotation);
                ctx.fillStyle = part.color;
                ctx.globalAlpha = Math.max(0, 1 - this.breakTimer / 60);
                ctx.fillRect(-part.width / 2, -part.height / 2, part.width, part.height);
                ctx.restore();
            });
            return;
        }
        
        const endX = this.x + this.width / 2;
        const endY = this.y;
        const anchorX = this.originalX + this.width / 2;
        
        ctx.strokeStyle = this.config.ropeColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(anchorX, this.anchorY);
        ctx.lineTo(this.x + 10, endY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(anchorX + this.width - 20, this.anchorY);
        ctx.lineTo(this.x + this.width - 10, endY);
        ctx.stroke();
        
        ctx.fillStyle = this.config.ropeColor;
        ctx.beginPath();
        ctx.arc(anchorX, this.anchorY, 5, 0, Math.PI * 2);
        ctx.fill();
        
        let color = this.config.color;
        if (this.hitFlash > 0 && this.hitFlash % 4 < 2) {
            color = '#FFF';
        }
        
        const durabilityRatio = this.durability / this.maxDurability;
        ctx.fillStyle = color;
        Utils.drawRoundedRect(ctx, this.x, this.y, this.width, this.height, 4);
        ctx.fill();
        
        ctx.strokeStyle = this.darkenColor(color, 30);
        ctx.lineWidth = 2;
        if (durabilityRatio < 0.66) {
            ctx.beginPath();
            ctx.moveTo(this.x + this.width * 0.3, this.y);
            ctx.lineTo(this.x + this.width * 0.4, this.y + this.height);
            ctx.stroke();
        }
        if (durabilityRatio < 0.33) {
            ctx.beginPath();
            ctx.moveTo(this.x + this.width * 0.6, this.y);
            ctx.lineTo(this.x + this.width * 0.7, this.y + this.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(this.x + this.width * 0.5, this.y + this.height * 0.5);
            ctx.lineTo(this.x + this.width * 0.8, this.y + this.height * 0.3);
            ctx.stroke();
        }
        
        if (this.type === 'iron') {
            ctx.fillStyle = '#AABBCC';
            for (let i = 0; i < 3; i++) {
                const boltX = this.x + 15 + i * (this.width - 30) / 2;
                ctx.beginPath();
                ctx.arc(boltX, this.y + this.height / 2, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.type === 'floating') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, 
                       this.width / 2, this.height / 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    darkenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - amount);
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - amount);
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - amount);
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    toJSON() {
        return {
            type: this.type,
            originalX: this.originalX,
            x: this.x,
            y: this.y,
            durability: this.durability,
            isBroken: this.isBroken,
            swingOffset: this.swingOffset,
            moveDirection: this.moveDirection,
            moveStartX: this.moveStartX
        };
    }
    
    fromJSON(data) {
        this.type = data.type;
        this.originalX = data.originalX;
        this.x = data.x;
        this.y = data.y;
        this.durability = data.durability;
        this.isBroken = data.isBroken;
        this.swingOffset = data.swingOffset;
        if (data.moveDirection !== undefined) {
            this.moveDirection = data.moveDirection;
        }
        if (data.moveStartX !== undefined) {
            this.moveStartX = data.moveStartX;
        }
    }
}

window.Platform = Platform;
