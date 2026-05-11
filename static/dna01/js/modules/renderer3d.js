const Renderer3D = {
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
    
    generateDNA(config, basePairsSequence) {
        const points = {
            strandA: [],
            strandB: [],
            bases: []
        };
        
        const { radius, height, turns, basePairs } = config;
        
        const segments = Math.max(basePairs * 16, 200);
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const y = (t - 0.5) * height;
            const angle = t * turns * Math.PI * 2;
            
            const xA = Math.cos(angle) * radius;
            const zA = Math.sin(angle) * radius;
            
            const xB = Math.cos(angle + Math.PI) * radius;
            const zB = Math.sin(angle + Math.PI) * radius;
            
            points.strandA.push({ x: xA, y, z: zA, index: i, t: t });
            points.strandB.push({ x: xB, y, z: zB, index: i, t: t });
        }
        
        for (let i = 0; i < basePairs; i++) {
            const t = (i + 0.5) / basePairs;
            const baseY = (t - 0.5) * height;
            const baseAngle = t * turns * Math.PI * 2;
            
            const baseXA = Math.cos(baseAngle) * radius;
            const baseZA = Math.sin(baseAngle) * radius;
            
            const baseXB = Math.cos(baseAngle + Math.PI) * radius;
            const baseZB = Math.sin(baseAngle + Math.PI) * radius;
            
            const basePair = basePairsSequence && basePairsSequence[i] ? basePairsSequence[i] : 'A-T';
            
            points.bases.push({
                pointA: { x: baseXA, y: baseY, z: baseZA },
                pointB: { x: baseXB, y: baseY, z: baseZB },
                basePair: basePair,
                index: i,
                t: t
            });
        }
        
        return points;
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
            this.drawGrid(config);
            this.drawEnergyField(config, elapsedTime);
        }
        
        if (particles && particles.length > 0) {
            this.drawParticles(particles, config, elapsedTime);
        }
    },
    
    drawEnergyField(config, elapsedTime) {
        const ctx = this.ctx;
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const maxRadius = Math.min(this.width, this.height) * 0.5;
        
        for (let i = 0; i < 2; i++) {
            const pulse = (Math.sin(elapsedTime * 0.5 + i * 2) + 1) / 2;
            const radius = maxRadius * (0.45 + pulse * 0.1);
            
            const gradient = ctx.createRadialGradient(
                centerX, centerY, radius * 0.4,
                centerX, centerY, radius
            );
            
            const rgb = this.hexToRgb(config.colors.strandA);
            gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
            gradient.addColorStop(0.8, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.02 + pulse * 0.015})`);
            gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        }
    },
    
    drawGrid(config) {
        const ctx = this.ctx;
        const gridSize = 50;
        
        ctx.save();
        ctx.globalAlpha = 0.05;
        
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
            } else if (p.type === 'glow') {
                const pulse = (Math.sin(elapsedTime * p.pulseSpeed + p.pulseOffset) + 1) / 2;
                const size = p.size * 0.6 * (0.8 + pulse * 0.4);
                const opacity = p.opacity * 0.5 * (0.7 + pulse * 0.3);
                
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
    
    render(config, camera, basePairsSequence, particles, elapsedTime = 0) {
        this.drawBackground(config, particles, elapsedTime);
        
        const points = this.generateDNA(config, basePairsSequence);
        const { rotationX, rotationY, zoom } = camera;
        
        const scale = Math.min(this.width, this.height) / (config.height * 1.5);
        
        const projectedStrandA = points.strandA.map(p => {
            const rotated = Utils.rotatePoint3D(p.x, p.y, p.z, rotationX, rotationY);
            const projected = Utils.project3D(
                rotated.x * scale,
                rotated.y * scale,
                rotated.z * scale,
                this.width,
                this.height,
                zoom
            );
            return { 
                ...projected, 
                originalZ: rotated.z,
                originalPoint: p
            };
        });
        
        const projectedStrandB = points.strandB.map(p => {
            const rotated = Utils.rotatePoint3D(p.x, p.y, p.z, rotationX, rotationY);
            const projected = Utils.project3D(
                rotated.x * scale,
                rotated.y * scale,
                rotated.z * scale,
                this.width,
                this.height,
                zoom
            );
            return { 
                ...projected, 
                originalZ: rotated.z,
                originalPoint: p
            };
        });
        
        const allObjects = [];
        
        this.addStrandSegments(allObjects, projectedStrandA, config.colors.strandA, scale, zoom);
        this.addStrandSegments(allObjects, projectedStrandB, config.colors.strandB, scale, zoom);
        
        points.bases.forEach(base => {
            const rotatedA = Utils.rotatePoint3D(
                base.pointA.x,
                base.pointA.y,
                base.pointA.z,
                rotationX,
                rotationY
            );
            const projectedA = Utils.project3D(
                rotatedA.x * scale,
                rotatedA.y * scale,
                rotatedA.z * scale,
                this.width,
                this.height,
                zoom
            );
            
            const rotatedB = Utils.rotatePoint3D(
                base.pointB.x,
                base.pointB.y,
                base.pointB.z,
                rotationX,
                rotationY
            );
            const projectedB = Utils.project3D(
                rotatedB.x * scale,
                rotatedB.y * scale,
                rotatedB.z * scale,
                this.width,
                this.height,
                zoom
            );
            
            const isAT = base.basePair === 'A-T' || base.basePair === 'T-A';
            const baseColor = isAT ? config.colors.atBase : config.colors.cgBase;
            const basePairParts = base.basePair.split('-');
            
            allObjects.push({
                type: 'baseConnector',
                pointA: projectedA,
                pointB: projectedB,
                color: baseColor,
                z: Math.min(rotatedA.z, rotatedB.z),
                scale: scale,
                zoom: zoom,
                baseIndex: base.index
            });
            
            allObjects.push({
                type: 'baseSphere',
                x: projectedA.x,
                y: projectedA.y,
                z: rotatedA.z,
                color: baseColor,
                label: basePairParts[0],
                scale: scale,
                zoom: zoom,
                baseIndex: base.index
            });
            
            allObjects.push({
                type: 'baseSphere',
                x: projectedB.x,
                y: projectedB.y,
                z: rotatedB.z,
                color: baseColor,
                label: basePairParts[1],
                scale: scale,
                zoom: zoom,
                baseIndex: base.index
            });
        });
        
        allObjects.sort((a, b) => a.z - b.z);
        
        allObjects.forEach(obj => {
            if (obj.type === 'strandSegment') {
                this.drawStrandSegment(
                    obj.p1,
                    obj.p2,
                    obj.color,
                    obj.thickness,
                    config.display.showGlow,
                    elapsedTime
                );
            } else if (obj.type === 'baseConnector') {
                this.drawBaseConnector(
                    obj.pointA,
                    obj.pointB,
                    obj.color,
                    obj.scale,
                    obj.zoom,
                    config.display.showGlow,
                    elapsedTime,
                    obj.baseIndex
                );
            } else if (obj.type === 'baseSphere') {
                this.drawBaseSphere(
                    obj.x,
                    obj.y,
                    obj.color,
                    obj.scale,
                    obj.zoom,
                    config.display.showGlow,
                    elapsedTime,
                    obj.baseIndex
                );
                if (config.display.showLabels) {
                    this.drawBaseLabel(obj.x, obj.y, obj.label, obj.color, obj.scale, obj.zoom);
                }
            }
        });
    },
    
    addStrandSegments(allObjects, points, color, scale, zoom) {
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            
            allObjects.push({
                type: 'strandSegment',
                p1: p1,
                p2: p2,
                color: color,
                thickness: 0,
                z: Math.min(p1.originalZ, p2.originalZ)
            });
        }
    },
    
    drawStrandSegment(p1, p2, color, thickness, showGlow, elapsedTime) {
        const ctx = this.ctx;
        const rgb = this.hexToRgb(color);
        const actualThickness = Math.max(5, 8);
        
        if (showGlow) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`;
            ctx.lineWidth = actualThickness * 2.2;
            ctx.lineCap = 'round';
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;
            ctx.lineWidth = actualThickness * 1.6;
            ctx.stroke();
        }
        
        const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
        gradient.addColorStop(0, this.darkenColor(color, 10));
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, this.darkenColor(color, 10));
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = actualThickness * 1.5;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        const innerColor1 = `rgba(${Math.min(rgb.r + 80, 255)}, ${Math.min(rgb.g + 80, 255)}, ${Math.min(rgb.b + 80, 255)}, 0.95)`;
        const innerColor2 = `rgba(255, 255, 255, 0.9)`;
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = innerColor1;
        ctx.lineWidth = actualThickness * 0.8;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = innerColor2;
        ctx.lineWidth = actualThickness * 0.35;
        ctx.stroke();
    },
    
    drawBaseConnector(pointA, pointB, color, scale, zoom, showGlow, elapsedTime, baseIndex) {
        const ctx = this.ctx;
        const rgb = this.hexToRgb(color);
        const pulse = (Math.sin(elapsedTime * 2 + baseIndex * 0.3) + 1) / 2;
        const thickness = Math.max(scale * 0.25 * zoom, 4);
        
        if (showGlow) {
            ctx.beginPath();
            ctx.moveTo(pointA.x, pointA.y);
            ctx.lineTo(pointB.x, pointB.y);
            ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.12 + pulse * 0.08})`;
            ctx.lineWidth = thickness * 2.2;
            ctx.lineCap = 'round';
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(pointA.x, pointA.y);
            ctx.lineTo(pointB.x, pointB.y);
            ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.28)`;
            ctx.lineWidth = thickness * 1.6;
            ctx.stroke();
        }
        
        const gradient = ctx.createLinearGradient(pointA.x, pointA.y, pointB.x, pointB.y);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, this.lightenColor(color, 25));
        gradient.addColorStop(1, color);
        
        ctx.beginPath();
        ctx.moveTo(pointA.x, pointA.y);
        ctx.lineTo(pointB.x, pointB.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = thickness * 1.3;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        const innerColor = `rgba(${Math.min(rgb.r + 100, 255)}, ${Math.min(rgb.g + 100, 255)}, ${Math.min(rgb.b + 100, 255)}, 0.95)`;
        ctx.beginPath();
        ctx.moveTo(pointA.x, pointA.y);
        ctx.lineTo(pointB.x, pointB.y);
        ctx.strokeStyle = innerColor;
        ctx.lineWidth = thickness * 0.5;
        ctx.stroke();
    },
    
    drawBaseSphere(x, y, color, scale, zoom, showGlow, elapsedTime, baseIndex) {
        const ctx = this.ctx;
        const rgb = this.hexToRgb(color);
        const radius = Math.max(scale * 0.35 * zoom, 14);
        const pulse = (Math.sin(elapsedTime * 2 + baseIndex * 0.3) + 1) / 2;
        
        if (showGlow) {
            const glowRadius1 = radius * 2;
            const gradient1 = ctx.createRadialGradient(x, y, 0, x, y, glowRadius1);
            gradient1.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.15 + pulse * 0.1})`);
            gradient1.addColorStop(0.4, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.08 + pulse * 0.05})`);
            gradient1.addColorStop(1, 'transparent');
            
            ctx.beginPath();
            ctx.arc(x, y, glowRadius1, 0, Math.PI * 2);
            ctx.fillStyle = gradient1;
            ctx.fill();
            
            const glowRadius2 = radius * 1.4;
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
            x - radius * 0.55, y - radius * 0.55, 0,
            x, y, radius
        );
        mainGradient.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
        mainGradient.addColorStop(0.12, `rgba(${Math.min(rgb.r + 130, 255)}, ${Math.min(rgb.g + 130, 255)}, ${Math.min(rgb.b + 130, 255)}, 1)`);
        mainGradient.addColorStop(0.35, color);
        mainGradient.addColorStop(0.7, this.darkenColor(color, 12));
        mainGradient.addColorStop(1, this.darkenColor(color, 38));
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = mainGradient;
        ctx.fill();
        
        const highlightGradient = ctx.createRadialGradient(
            x - radius * 0.4, y - radius * 0.4, 0,
            x - radius * 0.15, y - radius * 0.15, radius * 0.55
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        highlightGradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.35)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.beginPath();
        ctx.arc(x - radius * 0.15, y - radius * 0.15, radius * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = highlightGradient;
        ctx.fill();
        
        const rimGradient = ctx.createRadialGradient(
            x, y, radius * 0.65,
            x, y, radius
        );
        rimGradient.addColorStop(0, 'transparent');
        rimGradient.addColorStop(0.75, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
        rimGradient.addColorStop(1, `rgba(${Math.min(rgb.r + 60, 255)}, ${Math.min(rgb.g + 60, 255)}, ${Math.min(rgb.b + 60, 255)}, 0.7)`);
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = rimGradient;
        ctx.fill();
    },
    
    drawBaseLabel(x, y, label, color, scale, zoom) {
        const ctx = this.ctx;
        const baseSize = Math.max(scale * 0.35 * zoom, 14);
        const fontSize = Math.max(baseSize * 0.55, 11);
        
        ctx.font = `bold ${fontSize}px 'SF Mono', 'Monaco', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillText(label, x + 1.5, y + 1.5);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillText(label, x + 0.8, y + 0.8);
        
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, x, y);
    }
};
