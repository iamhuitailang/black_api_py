import { CONFIG } from './config_v2.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.stars = this.generateStars(100);
    }

    generateStars(count) {
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 0.5,
                twinkle: Math.random() * Math.PI * 2,
                speed: Math.random() * 0.02 + 0.01,
            });
        }
        return stars;
    }

    clear() {
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
        this.ctx.shadowColor = 'transparent';
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    drawBackground(theme) {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, theme.bgGradient[0]);
        gradient.addColorStop(1, theme.bgGradient[1]);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.stars.forEach(star => {
            star.twinkle += star.speed;
            const alpha = 0.3 + Math.sin(star.twinkle) * 0.3 + 0.2;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.drawClouds();
    }

    drawClouds() {
        const time = Date.now() * 0.0001;
        for (let i = 0; i < 5; i++) {
            const x = ((time * 50 + i * 200) % (this.width + 200)) - 100;
            const y = 100 + i * 80;
            this.ctx.fillStyle = `rgba(100, 120, 180, ${0.05 + i * 0.02})`;
            this.ctx.beginPath();
            this.ctx.ellipse(x, y, 80 + i * 20, 30 + i * 5, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawPlatforms(platforms, theme) {
        platforms.forEach(platform => {
            const gradient = this.ctx.createLinearGradient(
                platform.x, platform.y,
                platform.x, platform.y + platform.height
            );
            
            if (platform.isGround) {
                gradient.addColorStop(0, '#405080');
                gradient.addColorStop(1, '#203050');
            } else {
                gradient.addColorStop(0, theme.platformColor);
                gradient.addColorStop(1, this.adjustColor(theme.platformColor, -30));
            }
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.roundRect(platform.x, platform.y, platform.width, platform.height, 5);
            this.ctx.fill();
            
            this.ctx.shadowColor = 'rgba(100, 150, 255, 0.5)';
            this.ctx.shadowBlur = 10;
            this.ctx.strokeStyle = 'rgba(150, 180, 255, 0.6)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.fillRect(platform.x + 5, platform.y + 2, platform.width - 10, 3);
        });
    }

    drawPlayer(player) {
        const ctx = this.ctx;
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        
        const cx = player.x + player.width / 2;
        const cy = player.y + player.height / 2;
        
        if (player.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        player.trail.forEach((t, i) => {
            ctx.fillStyle = `rgba(160, 200, 255, ${t.alpha * 0.3})`;
            ctx.beginPath();
            ctx.arc(t.x, t.y, 8, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.fillStyle = player.stats.glowColor;
        ctx.shadowColor = player.stats.color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.ellipse(cx, cy, player.width / 2 + 5, player.height / 2 + 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        const bodyGradient = ctx.createRadialGradient(cx, cy - player.height * 0.2, 0, cx, cy, player.height / 2);
        bodyGradient.addColorStop(0, player.stats.color);
        bodyGradient.addColorStop(1, this.adjustColor(player.stats.color, -40));
        ctx.fillStyle = bodyGradient;
        
        ctx.beginPath();
        ctx.roundRect(player.x, player.y, player.width, player.height, 8);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        const eyeOffset = player.facingRight ? 4 : -4;
        const eyeY = cy - player.height * 0.15;
        ctx.beginPath();
        ctx.arc(cx + eyeOffset - 5, eyeY, 4, 0, Math.PI * 2);
        ctx.arc(cx + eyeOffset + 5, eyeY, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#1a1a3a';
        ctx.beginPath();
        ctx.arc(cx + eyeOffset - 4, eyeY, 2, 0, Math.PI * 2);
        ctx.arc(cx + eyeOffset + 6, eyeY, 2, 0, Math.PI * 2);
        ctx.fill();
        
        if (player.shieldActive) {
            const shieldAlpha = 0.3 + Math.sin(Date.now() * 0.01) * 0.1;
            ctx.strokeStyle = `rgba(100, 200, 255, ${shieldAlpha})`;
            ctx.lineWidth = 3;
            ctx.shadowColor = 'rgba(100, 200, 255, 0.8)';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(cx, cy, Math.max(player.width, player.height) / 2 + 15, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    drawMonsters(monsters) {
        monsters.forEach(monster => {
            const ctx = this.ctx;
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
            
            const cx = monster.x + monster.width / 2;
            const cy = monster.y + monster.height / 2;
            
            if (monster.hitFlash > 0) {
                ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.05) * 0.3;
            }
            
            ctx.fillStyle = monster.stats.color;
            ctx.shadowColor = monster.stats.color;
            ctx.shadowBlur = 15;
            
            ctx.beginPath();
            ctx.roundRect(monster.x, monster.y, monster.width, monster.height, 8);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            ctx.fillStyle = '#fff';
            const eyeOffset = monster.facingRight ? 3 : -3;
            ctx.beginPath();
            ctx.arc(cx + eyeOffset - 6, cy - 5, 5, 0, Math.PI * 2);
            ctx.arc(cx + eyeOffset + 6, cy - 5, 5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(cx + eyeOffset - 5, cy - 5, 2.5, 0, Math.PI * 2);
            ctx.arc(cx + eyeOffset + 7, cy - 5, 2.5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#800000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy + 8, 6, 0, Math.PI);
            ctx.stroke();
            
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        });
    }

    drawFragments(fragments) {
        fragments.forEach(fragment => {
            if (fragment.collected) return;
            
            const ctx = this.ctx;
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
            
            const bobY = Math.sin(fragment.bobOffset) * 5;
            const cx = fragment.x + fragment.width / 2;
            const cy = fragment.y + fragment.height / 2 + bobY;
            
            fragment.sparkles.forEach(s => {
                ctx.fillStyle = `rgba(200, 180, 255, ${s.life})`;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
            });
            
            ctx.shadowColor = 'rgba(200, 180, 255, 0.8)';
            ctx.shadowBlur = 20;
            
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 15);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.5, '#c8b4ff');
            gradient.addColorStop(1, '#a080ff');
            ctx.fillStyle = gradient;
            
            ctx.beginPath();
            ctx.moveTo(cx, cy - 12);
            ctx.lineTo(cx + 10, cy);
            ctx.lineTo(cx, cy + 12);
            ctx.lineTo(cx - 10, cy);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        });
    }

    drawPortal(portal) {
        const ctx = this.ctx;
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        
        const cx = portal.x + portal.width / 2;
        const cy = portal.y + portal.height / 2;
        
        portal.particles.forEach(p => {
            ctx.fillStyle = `rgba(150, 200, 255, ${p.life})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        if (portal.active) {
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 50);
            gradient.addColorStop(0, 'rgba(150, 200, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(100, 150, 255, 0.4)');
            gradient.addColorStop(1, 'rgba(80, 120, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.ellipse(cx, cy, 35, 45, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(150, 200, 255, 0.6)';
            ctx.lineWidth = 3;
            ctx.shadowColor = 'rgba(100, 150, 255, 0.8)';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.ellipse(cx, cy, 35, 45, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
            
            for (let i = 0; i < 3; i++) {
                const angle = portal.animFrame + i * Math.PI * 2 / 3;
                const rx = 25 + Math.sin(angle) * 5;
                const ry = 35 + Math.sin(angle) * 5;
                ctx.strokeStyle = `rgba(180, 220, 255, ${0.4 - i * 0.1})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(cx, cy, rx, ry, angle, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else {
            ctx.fillStyle = 'rgba(100, 100, 150, 0.3)';
            ctx.beginPath();
            ctx.ellipse(cx, cy, 35, 45, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(150, 150, 200, 0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `rgb(${r}, ${g}, ${b})`;
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        this.stars = this.generateStars(100);
    }
}
