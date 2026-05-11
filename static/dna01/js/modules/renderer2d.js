const Renderer2D = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
    },
    
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        this.canvas.width = this.width * window.devicePixelRatio;
        this.canvas.height = this.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    },
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    },
    
    lightenColor(hex, percent) {
        const rgb = this.hexToRgb(hex);
        const amount = Math.round(2.55 * percent);
        return `rgb(${Math.min(rgb.r + amount, 255)}, ${Math.min(rgb.g + amount, 255)}, ${Math.min(rgb.b + amount, 255)})`;
    },
    
    darkenColor(hex, percent) {
        const rgb = this.hexToRgb(hex);
        const amount = Math.round(2.55 * percent);
        return `rgb(${Math.max(rgb.r - amount, 0)}, ${Math.max(rgb.g - amount, 0)}, ${Math.max(rgb.b - amount, 0)})`;
    },
    
    drawBackground(config, particles, elapsedTime) {
        const ctx = this.ctx;
        
        const bgGradient = ctx.createRadialGradient(
            this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, Math.max(this.width, this.height) * 0.8
        );
        bgGradient.addColorStop(0, this.lightenColor(config.colors.background, 20));
        bgGradient.addColorStop(0.5, config.colors.background);
        bgGradient.addColorStop(1, this.darkenColor(config.colors.background, 20));
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, this.width, this.height);
        
        if (config.display.showGlow) {
            this.drawEnergyField(config, elapsedTime);
            this.drawGrid(config);
            this.drawScanlines(config, elapsedTime);
        }
        
        if (particles && particles.length > 0) {
            this.drawParticles(particles, config, elapsedTime);
        }
    },
    
    drawEnergyField(config, elapsedTime) {
        const ctx = this.ctx;
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const maxRadius = Math.min(this.width, this.height) * 0.6;
        
        for (let i = 0; i < 3; i++) {
            const pulse = (Math.sin(elapsedTime * 0.5 + i * 2) + 1) / 2;
            const radius = maxRadius * (0.4 + pulse * 0.15);
            
            const gradient = ctx.createRadialGradient(
                centerX, centerY, radius * 0.3,
                centerX, centerY, radius
            );
            
            const rgb = this.hexToRgb(config.colors.strandA);
            gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
            gradient.addColorStop(0.7, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.02 + pulse * 0.02})`);
            gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        }
    },
    
    drawGrid(config) {
        const ctx = this.ctx;
        const gridSize = 40;
        
        ctx.save();
        ctx.globalAlpha = 0.08;
        
        ctx.strokeStyle = config.colors.strandA;
        ctx.lineWidth = 0.5;
        
        for (let x = 0; x <= this.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }
        
        for (let y = 0; y <= this.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }
        
        ctx.strokeStyle = config.colors.strandA;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.15;
        
        ctx.beginPath();
        ctx.moveTo(this.width / 2, 0);
        ctx.lineTo(this.width / 2, this.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, this.height / 2);
        ctx.lineTo(this.width, this.height / 2);
        ctx.stroke();
        
        ctx.restore();
    },
    
    drawScanlines(config, elapsedTime) {
        const ctx = this.ctx;
        const scanlineOffset = (elapsedTime * 50) % 20;
        
        ctx.save();
        ctx.globalAlpha = 0.03;
        
        for (let y = -20 + scanlineOffset; y < this.height; y += 20) {
            const gradient = ctx.createLinearGradient(0, y, 0, y + 4);
            gradient.addColorStop(0, 'transparent');
            gradient.addColorStop(0.5, config.colors.strandA);
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, y, this.width, 4);
        }
        
        ctx.restore();
    },
    
    drawParticles(particles, config, elapsedTime) {
        const ctx = this.ctx;
        
        particles.forEach(p => {
            const x = p.x * this.width;
            const y = p.y * this.height;
            
            if (p.type === 'star') {
                const twinkle = (Math.sin(elapsedTime * p.twinkleSpeed + p.twinkleOffset) + 1) / 2;
                const opacity = p.opacity * (0.5 + twinkle * 0.5);
                
                ctx.beginPath();
                ctx.arc(x, y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `${config.colors.strandA}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
                ctx.fill();
                
                if (p.size > 1) {
                    ctx.beginPath();
                    ctx.arc(x, y, p.size * 3, 0, Math.PI * 2);
                    ctx.fillStyle = `${config.colors.strandA}${Math.round(opacity * 0.3 * 255).toString(16).padStart(2, '0')}`;
                    ctx.fill();
                }
            } else if (p.type === 'streak') {
                const length = p.length * Math.min(this.width, this.height);
                const endX = x + Math.cos(p.angle) * length;
                const endY = y + Math.sin(p.angle) * length;
                
                const gradient = ctx.createLinearGradient(x, y, endX, endY);
                gradient.addColorStop(0, 'transparent');
                gradient.addColorStop(0.5, `${config.colors.strandA}${Math.round(p.opacity * 255).toString(16).padStart(2, '0')}`);
                gradient.addColorStop(1, 'transparent');
                
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(endX, endY);
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 1;
                ctx.stroke();
            } else if (p.type === 'glow') {
                const pulse = (Math.sin(elapsedTime * p.pulseSpeed + p.pulseOffset) + 1) / 2;
                const size = p.size * (0.8 + pulse * 0.4);
                const opacity = p.opacity * (0.7 + pulse * 0.3);
                
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
                gradient.addColorStop(0, `${config.colors.strandA}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`);
                gradient.addColorStop(1, 'transparent');
                
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
            }
        });
    },
    
    render(config, rotationAngle = 0, basePairsSequence = null, particles = null, elapsedTime = 0) {
        this.drawBackground(config, particles, elapsedTime);
        
        const { radius, height, turns, basePairs, strandThickness } = config;
        
        const padding = 80;
        const maxWidth = this.width - padding * 2;
        const maxHeight = this.height - padding * 2;
        
        const scaleX = maxWidth / (radius * 4);
        const scaleY = maxHeight / height;
        const scale = Math.min(scaleX, scaleY);
        
        const centerX = this.width / 2;
        const startY = padding + (maxHeight - height * scale) / 2;
        
        this.drawBackbone(
            centerX,
            startY,
            radius * scale,
            height * scale,
            turns,
            strandThickness * scale,
            config.colors.strandA,
            config.colors.strandB,
            config.display.showGlow,
            rotationAngle,
            elapsedTime
        );
        
        this.drawBasePairs(
            centerX,
            startY,
            radius * scale,
            height * scale,
            turns,
            basePairs,
            config,
            rotationAngle,
            basePairsSequence,
            elapsedTime
        );
    },
    
    drawBackbone(centerX, startY, radius, height, turns, thickness, colorA, colorB, showGlow, rotationAngle, elapsedTime) {
        const ctx = this.ctx;
        const segments = 200;
        
        const drawStrand = (phaseOffset, color) => {
            const points = [];
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const angle = t * turns * Math.PI * 2 + phaseOffset + rotationAngle;
                const x = centerX + Math.sin(angle) * radius;
                const y = startY + t * height;
                points.push({ x, y });
            }
            
            if (showGlow) {
                const rgb = this.hexToRgb(color);
                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
                ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`;
                ctx.lineWidth = Math.max(thickness * 2.2, 4);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
                ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;
                ctx.lineWidth = Math.max(thickness * 1.6, 2.5);
                ctx.stroke();
            }
            
            const rgb = this.hexToRgb(color);
            
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = Math.max(thickness * 1.8, 2);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
            
            const innerColor1 = `rgba(${Math.min(rgb.r + 80, 255)}, ${Math.min(rgb.g + 80, 255)}, ${Math.min(rgb.b + 80, 255)}, 0.95)`;
            const innerColor2 = `rgba(255, 255, 255, 0.9)`;
            
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.strokeStyle = innerColor1;
            ctx.lineWidth = Math.max(thickness * 1, 1.2);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.strokeStyle = innerColor2;
            ctx.lineWidth = Math.max(thickness * 0.4, 0.6);
            ctx.stroke();
        };
        
        drawStrand(0, colorA);
        drawStrand(Math.PI, colorB);
    },
    
    drawBasePairs(centerX, startY, radius, height, turns, basePairs, config, rotationAngle, basePairsSequence, elapsedTime) {
        const ctx = this.ctx;
        
        for (let i = 0; i < basePairs; i++) {
            const t = (i + 0.5) / basePairs;
            const yPos = startY + t * height;
            const angle = t * turns * Math.PI * 2 + rotationAngle;
            
            const xA = centerX + Math.sin(angle) * radius * 0.85;
            const xB = centerX + Math.sin(angle + Math.PI) * radius * 0.85;
            
            const basePair = basePairsSequence && basePairsSequence[i] ? basePairsSequence[i] : 'A-T';
            const isAT = basePair === 'A-T' || basePair === 'T-A';
            const baseColor = isAT ? config.colors.atBase : config.colors.cgBase;
            const rgb = this.hexToRgb(baseColor);
            
            const pulse = (Math.sin(elapsedTime * 2 + i * 0.3) + 1) / 2;
            
            if (config.display.showGlow) {
                ctx.beginPath();
                ctx.moveTo(xA, yPos);
                ctx.lineTo(xB, yPos);
                ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.12 + pulse * 0.08})`;
                ctx.lineWidth = Math.max(radius * 0.6, 6);
                ctx.lineCap = 'round';
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(xA, yPos);
                ctx.lineTo(xB, yPos);
                ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.28)`;
                ctx.lineWidth = Math.max(radius * 0.35, 3.5);
                ctx.stroke();
            }
            
            const gradient = ctx.createLinearGradient(xA, yPos, xB, yPos);
            gradient.addColorStop(0, baseColor);
            gradient.addColorStop(0.5, this.lightenColor(baseColor, 20));
            gradient.addColorStop(1, baseColor);
            
            ctx.beginPath();
            ctx.moveTo(xA, yPos);
            ctx.lineTo(xB, yPos);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = Math.max(radius * 0.25, 3);
            ctx.lineCap = 'round';
            ctx.stroke();
            
            const innerColor = `rgba(${Math.min(rgb.r + 100, 255)}, ${Math.min(rgb.g + 100, 255)}, ${Math.min(rgb.b + 100, 255)}, 0.95)`;
            ctx.beginPath();
            ctx.moveTo(xA, yPos);
            ctx.lineTo(xB, yPos);
            ctx.strokeStyle = innerColor;
            ctx.lineWidth = Math.max(radius * 0.1, 1.2);
            ctx.stroke();
            
            const baseSize = Math.max(radius * 0.35, 12);
            
            this.drawBaseNode(xA, yPos, baseSize, baseColor, config.display.showGlow, pulse, elapsedTime);
            this.drawBaseNode(xB, yPos, baseSize, baseColor, config.display.showGlow, pulse, elapsedTime);
            
            if (config.display.showLabels) {
                const bases = basePair.split('-');
                this.drawBaseLabel(xA, yPos, bases[0], baseColor, baseSize);
                this.drawBaseLabel(xB, yPos, bases[1], baseColor, baseSize);
            }
        }
    },
    
    drawBaseNode(x, y, size, color, showGlow, pulse = 0, elapsedTime = 0) {
        const ctx = this.ctx;
        const rgb = this.hexToRgb(color);
        
        if (showGlow) {
            const glowRadius1 = size * 2;
            const gradient1 = ctx.createRadialGradient(x, y, 0, x, y, glowRadius1);
            gradient1.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.15 + pulse * 0.1})`);
            gradient1.addColorStop(0.4, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.08 + pulse * 0.05})`);
            gradient1.addColorStop(1, 'transparent');
            
            ctx.beginPath();
            ctx.arc(x, y, glowRadius1, 0, Math.PI * 2);
            ctx.fillStyle = gradient1;
            ctx.fill();
            
            const glowRadius2 = size * 1.4;
            const gradient2 = ctx.createRadialGradient(x, y, 0, x, y, glowRadius2);
            gradient2.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.25 + pulse * 0.15})`);
            gradient2.addColorStop(0.6, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.12 + pulse * 0.08})`);
            gradient2.addColorStop(1, 'transparent');
            
            ctx.beginPath();
            ctx.arc(x, y, glowRadius2, 0, Math.PI * 2);
            ctx.fillStyle = gradient2;
            ctx.fill();
        }
        
        const mainGradient = ctx.createRadialGradient(
            x - size * 0.5, y - size * 0.5, 0,
            x, y, size
        );
        mainGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        mainGradient.addColorStop(0.15, `rgba(${Math.min(rgb.r + 120, 255)}, ${Math.min(rgb.g + 120, 255)}, ${Math.min(rgb.b + 120, 255)}, 1)`);
        mainGradient.addColorStop(0.4, color);
        mainGradient.addColorStop(0.75, this.darkenColor(color, 15));
        mainGradient.addColorStop(1, this.darkenColor(color, 35));
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = mainGradient;
        ctx.fill();
        
        const highlightGradient = ctx.createRadialGradient(
            x - size * 0.35, y - size * 0.35, 0,
            x - size * 0.15, y - size * 0.15, size * 0.5
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.beginPath();
        ctx.arc(x - size * 0.15, y - size * 0.15, size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = highlightGradient;
        ctx.fill();
        
        const rimGradient = ctx.createRadialGradient(
            x, y, size * 0.7,
            x, y, size
        );
        rimGradient.addColorStop(0, 'transparent');
        rimGradient.addColorStop(0.8, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
        rimGradient.addColorStop(1, `rgba(${Math.min(rgb.r + 50, 255)}, ${Math.min(rgb.g + 50, 255)}, ${Math.min(rgb.b + 50, 255)}, 0.6)`);
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = rimGradient;
        ctx.fill();
    },
    
    drawBaseLabel(x, y, label, color, baseSize) {
        const ctx = this.ctx;
        const fontSize = Math.max(baseSize * 0.55, 10);
        
        ctx.font = `bold ${fontSize}px 'SF Mono', 'Monaco', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillText(label, x + 1, y + 1);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillText(label, x + 0.5, y + 0.5);
        
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, x, y);
    }
};
