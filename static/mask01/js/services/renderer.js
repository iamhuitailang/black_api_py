(function(global) {
    'use strict';
    
    const Renderer = {
        canvas: null,
        ctx: null,
        width: 500,
        height: 600,
        
        init: function(canvasId) {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) {
                console.error('Canvas not found:', canvasId);
                return false;
            }
            this.ctx = this.canvas.getContext('2d');
            this.width = this.canvas.width;
            this.height = this.canvas.height;
            return true;
        },
        
        clear: function() {
            this.ctx.clearRect(0, 0, this.width, this.height);
        },
        
        render: function(state) {
            this.clear();
            this.drawBackground();
            this.drawMask(state);
            this.drawEyes(state);
        },
        
        drawBackground: function() {
            const gradient = this.ctx.createRadialGradient(
                this.width / 2, this.height / 2, 50,
                this.width / 2, this.height / 2, this.width / 2
            );
            gradient.addColorStop(0, '#f5f5f5');
            gradient.addColorStop(1, '#e0e0e0');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.width, this.height);
        },
        
        drawMask: function(state) {
            const cx = this.width / 2;
            const cy = this.height / 2 - 20;
            
            this.ctx.save();
            this.ctx.beginPath();
            
            switch (state.maskShape) {
                case 'half':
                    this.drawHalfMask(cx, cy);
                    break;
                case 'full':
                    this.drawFullMask(cx, cy);
                    break;
                case 'eye':
                    this.drawEyeMask(cx, cy);
                    break;
                case 'animal':
                    this.drawAnimalMask(cx, cy);
                    break;
                case 'skull':
                    this.drawSkullMask(cx, cy);
                    break;
                case 'geo':
                    this.drawGeoMask(cx, cy);
                    break;
                default:
                    this.drawHalfMask(cx, cy);
            }
            
            this.ctx.closePath();
            
            this.applyTexture(state);
            this.ctx.fill();
            
            this.ctx.strokeStyle = state.secondaryColor;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            this.ctx.restore();
        },
        
        drawHalfMask: function(cx, cy) {
            const w = 180;
            const h = 110;
            
            this.ctx.moveTo(cx - w, cy - 10);
            this.ctx.bezierCurveTo(cx - w, cy - h, cx - w/2, cy - h, cx, cy - h + 10);
            this.ctx.bezierCurveTo(cx + w/2, cy - h, cx + w, cy - h, cx + w, cy - 10);
            this.ctx.bezierCurveTo(cx + w, cy + h/2, cx + w/2, cy + h, cx, cy + h/2);
            this.ctx.bezierCurveTo(cx - w/2, cy + h, cx - w, cy + h/2, cx - w, cy - 10);
        },
        
        drawFullMask: function(cx, cy) {
            const w = 140;
            const h = 200;
            
            this.ctx.ellipse(cx, cy, w, h, 0, 0, Math.PI * 2);
        },
        
        drawEyeMask: function(cx, cy) {
            this.ctx.moveTo(cx - 160, cy - 30);
            this.ctx.lineTo(cx - 100, cy - 60);
            this.ctx.lineTo(cx - 40, cy - 40);
            this.ctx.lineTo(cx, cy - 35);
            this.ctx.lineTo(cx + 40, cy - 40);
            this.ctx.lineTo(cx + 100, cy - 60);
            this.ctx.lineTo(cx + 160, cy - 30);
            this.ctx.lineTo(cx + 140, cy + 30);
            this.ctx.lineTo(cx + 80, cy + 10);
            this.ctx.lineTo(cx + 20, cy + 20);
            this.ctx.lineTo(cx, cy + 25);
            this.ctx.lineTo(cx - 20, cy + 20);
            this.ctx.lineTo(cx - 80, cy + 10);
            this.ctx.lineTo(cx - 140, cy + 30);
            this.ctx.closePath();
        },
        
        drawAnimalMask: function(cx, cy) {
            const w = 150;
            const h = 180;
            
            this.ctx.ellipse(cx, cy, w, h, 0, 0, Math.PI * 2);
            
            this.ctx.moveTo(cx - 100, cy - 160);
            this.ctx.lineTo(cx - 70, cy - 220);
            this.ctx.lineTo(cx - 40, cy - 150);
            
            this.ctx.moveTo(cx + 100, cy - 160);
            this.ctx.lineTo(cx + 70, cy - 220);
            this.ctx.lineTo(cx + 40, cy - 150);
        },
        
        drawSkullMask: function(cx, cy) {
            const w = 120;
            const h = 160;
            
            this.ctx.ellipse(cx, cy - 20, w, h, 0, 0, Math.PI * 2);
            
            this.ctx.moveTo(cx - 50, cy + 120);
            this.ctx.lineTo(cx - 40, cy + 140);
            this.ctx.lineTo(cx - 30, cy + 125);
            this.ctx.lineTo(cx - 20, cy + 140);
            this.ctx.lineTo(cx - 10, cy + 125);
            this.ctx.lineTo(cx, cy + 140);
            this.ctx.lineTo(cx + 10, cy + 125);
            this.ctx.lineTo(cx + 20, cy + 140);
            this.ctx.lineTo(cx + 30, cy + 125);
            this.ctx.lineTo(cx + 40, cy + 140);
            this.ctx.lineTo(cx + 50, cy + 120);
        },
        
        drawGeoMask: function(cx, cy) {
            const size = 180;
            
            this.ctx.moveTo(cx, cy - size);
            this.ctx.lineTo(cx + size * 0.866, cy - size * 0.5);
            this.ctx.lineTo(cx + size * 0.866, cy + size * 0.5);
            this.ctx.lineTo(cx, cy + size);
            this.ctx.lineTo(cx - size * 0.866, cy + size * 0.5);
            this.ctx.lineTo(cx - size * 0.866, cy - size * 0.5);
            this.ctx.closePath();
            
            this.ctx.moveTo(cx - size * 0.5, cy);
            this.ctx.lineTo(cx + size * 0.5, cy);
        },
        
        drawEyes: function(state) {
            if (state.eyeShape === 'none') return;
            
            const cx = this.width / 2;
            const cy = this.height / 2 - 20;
            const eyeSpacing = 60;
            const leftX = cx - eyeSpacing;
            const rightX = cx + eyeSpacing;
            const eyeY = cy - 10;
            
            this.ctx.save();
            
            this.drawEye(leftX, eyeY, state.eyeShape, true);
            this.ctx.fillStyle = '#000';
            this.ctx.fill();
            
            this.drawEye(rightX, eyeY, state.eyeShape, false);
            this.ctx.fillStyle = '#000';
            this.ctx.fill();
            
            this.applyLensColor(state, leftX, eyeY);
            this.applyLensColor(state, rightX, eyeY);
            
            this.ctx.restore();
        },
        
        drawEye: function(x, y, shape, isLeft) {
            this.ctx.beginPath();
            const w = 35;
            const h = 25;
            
            switch (shape) {
                case 'round':
                    this.ctx.ellipse(x, y, w * 0.7, h * 0.8, 0, 0, Math.PI * 2);
                    break;
                case 'triangle':
                    this.ctx.moveTo(x - w * 0.8, y + h * 0.5);
                    this.ctx.lineTo(x, y - h * 0.8);
                    this.ctx.lineTo(x + w * 0.8, y + h * 0.5);
                    this.ctx.closePath();
                    break;
                case 'almond':
                default:
                    if (isLeft) {
                        this.ctx.moveTo(x - w, y);
                        this.ctx.bezierCurveTo(x - w * 0.5, y - h, x + w * 0.3, y - h, x + w, y);
                        this.ctx.bezierCurveTo(x + w * 0.3, y + h * 0.8, x - w * 0.5, y + h * 0.8, x - w, y);
                    } else {
                        this.ctx.moveTo(x - w, y);
                        this.ctx.bezierCurveTo(x - w * 0.3, y - h, x + w * 0.5, y - h, x + w, y);
                        this.ctx.bezierCurveTo(x + w * 0.5, y + h * 0.8, x - w * 0.3, y + h * 0.8, x - w, y);
                    }
                    break;
            }
        },
        
        applyLensColor: function(state, x, y) {
            const lensData = Data.lensColors.find(function(l) { return l.id === state.lensColor; });
            if (!lensData || lensData.id === 'transparent') return;
            
            this.ctx.save();
            
            if (lensData.id === 'gradient') {
                const gradient = this.ctx.createLinearGradient(x - 30, y - 25, x + 30, y + 25);
                gradient.addColorStop(0, 'rgba(239, 68, 68, 0.5)');
                gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.5)');
                gradient.addColorStop(1, 'rgba(59, 130, 246, 0.5)');
                this.ctx.fillStyle = gradient;
            } else {
                this.ctx.fillStyle = lensData.color;
            }
            
            this.drawEye(x, y, state.eyeShape, x < this.width / 2);
            this.ctx.fill();
            
            this.ctx.restore();
        },
        
        applyTexture: function(state) {
            const ctx = this.ctx;
            const primaryColor = state.primaryColor;
            
            switch (state.texture) {
                case 'metallic':
                    const metallicGradient = ctx.createLinearGradient(0, 0, this.width, this.height);
                    metallicGradient.addColorStop(0, this.lightenColor(primaryColor, 40));
                    metallicGradient.addColorStop(0.3, primaryColor);
                    metallicGradient.addColorStop(0.5, this.lightenColor(primaryColor, 20));
                    metallicGradient.addColorStop(0.7, primaryColor);
                    metallicGradient.addColorStop(1, this.darkenColor(primaryColor, 30));
                    ctx.fillStyle = metallicGradient;
                    break;
                    
                case 'matte':
                    ctx.fillStyle = this.darkenColor(primaryColor, 10);
                    break;
                    
                case 'leather':
                    ctx.fillStyle = primaryColor;
                    this.drawLeatherTexture();
                    break;
                    
                case 'wood':
                    ctx.fillStyle = primaryColor;
                    this.drawWoodTexture();
                    break;
                    
                case 'glow':
                    ctx.fillStyle = primaryColor;
                    ctx.shadowColor = primaryColor;
                    ctx.shadowBlur = 30;
                    break;
                    
                case 'solid':
                default:
                    ctx.fillStyle = primaryColor;
                    break;
            }
        },
        
        drawLeatherTexture: function() {
            const ctx = this.ctx;
            ctx.save();
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = '#000';
            
            for (let i = 0; i < 200; i++) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                const r = Math.random() * 3 + 1;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        },
        
        drawWoodTexture: function() {
            const ctx = this.ctx;
            ctx.save();
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = '#000';
            
            for (let i = 0; i < 30; i++) {
                const y = (this.height / 30) * i;
                ctx.beginPath();
                ctx.moveTo(0, y);
                for (let x = 0; x < this.width; x += 10) {
                    ctx.lineTo(x, y + Math.sin(x * 0.05 + i) * 3);
                }
                ctx.lineWidth = 1 + Math.random() * 2;
                ctx.stroke();
            }
            
            ctx.restore();
        },
        
        lightenColor: function(hex, percent) {
            const num = parseInt(hex.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = Math.min(255, (num >> 16) + amt);
            const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
            const B = Math.min(255, (num & 0x0000FF) + amt);
            return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
        },
        
        darkenColor: function(hex, percent) {
            const num = parseInt(hex.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = Math.max(0, (num >> 16) - amt);
            const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
            const B = Math.max(0, (num & 0x0000FF) - amt);
            return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
        },
        
        renderToCanvas: function(targetCanvas, state) {
            const targetCtx = targetCanvas.getContext('2d');
            const scaleX = targetCanvas.width / this.width;
            const scaleY = targetCanvas.height / this.height;
            
            targetCtx.fillStyle = '#ffffff';
            targetCtx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
            
            targetCtx.save();
            targetCtx.scale(scaleX, scaleY);
            
            const originalCtx = this.ctx;
            const originalCanvas = this.canvas;
            
            this.ctx = targetCtx;
            this.drawBackground();
            this.drawMask(state);
            this.drawEyes(state);
            
            this.ctx = originalCtx;
            this.canvas = originalCanvas;
            
            targetCtx.restore();
        }
    };
    
    global.Renderer = Renderer;
})(window);