class BlackHoleSimulator {
    constructor() {
        this.canvas = document.getElementById('simulator');
        this.ctx = this.canvas.getContext('2d');
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        this.state = this.loadState();
        this.stars = [];
        this.particles = [];
        this.markers = [];
        
        this.init();
    }
    
    loadState() {
        const savedState = localStorage.getItem('blackHoleSimulatorState');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                return {
                    rotationX: parsed.rotationX || 0.4,
                    rotationY: parsed.rotationY || 0,
                    zoom: parsed.zoom || 1,
                    autoRotate: parsed.autoRotate !== false,
                    rotateSpeed: parsed.rotateSpeed || 0.3,
                    showJets: parsed.showJets !== false,
                    showParticles: parsed.showParticles !== false,
                    accretionSpeed: parsed.accretionSpeed || 1,
                    accretionRotation: parsed.accretionRotation || 0,
                    photonSpherePulse: parsed.photonSpherePulse || 0,
                    markers: parsed.markers || []
                };
            } catch (e) {
                console.error('Failed to load state:', e);
            }
        }
        return this.getDefaultState();
    }
    
    getDefaultState() {
        return {
            rotationX: 0.4,
            rotationY: 0,
            zoom: 1,
            autoRotate: true,
            rotateSpeed: 0.3,
            showJets: true,
            showParticles: true,
            accretionSpeed: 1,
            accretionRotation: 0,
            photonSpherePulse: 0,
            markers: []
        };
    }
    
    saveState() {
        const stateToSave = {
            rotationX: this.state.rotationX,
            rotationY: this.state.rotationY,
            zoom: this.state.zoom,
            autoRotate: this.state.autoRotate,
            rotateSpeed: this.state.rotateSpeed,
            showJets: this.state.showJets,
            showParticles: this.state.showParticles,
            accretionSpeed: this.state.accretionSpeed,
            accretionRotation: this.state.accretionRotation,
            photonSpherePulse: this.state.photonSpherePulse,
            markers: this.markers
        };
        localStorage.setItem('blackHoleSimulatorState', JSON.stringify(stateToSave));
    }
    
    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.initStars();
        this.initParticles();
        this.markers = this.state.markers || [];
        
        this.setupEventListeners();
        this.updateUI();
        
        this.animate();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }
    
    initStars() {
        this.stars = [];
        const starCount = 600;
        for (let i = 0; i < starCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = 500 + Math.random() * 500;
            
            this.stars.push({
                x: radius * Math.sin(phi) * Math.cos(theta),
                y: radius * Math.sin(phi) * Math.sin(theta),
                z: radius * Math.cos(phi),
                size: Math.random() * 1.5 + 0.3,
                brightness: Math.random(),
                twinkleSpeed: Math.random() * 0.01 + 0.002,
                twinkleOffset: Math.random() * Math.PI * 2
            });
        }
    }
    
    initParticles() {
        this.particles = [];
        const particleCount = 40;
        for (let i = 0; i < particleCount; i++) {
            this.spawnParticle();
        }
    }
    
    spawnParticle() {
        const angle = Math.random() * Math.PI * 2;
        const radius = 180 + Math.random() * 250;
        const height = (Math.random() - 0.5) * 60;
        
        const isRed = Math.random() > 0.5;
        
        this.particles.push({
            x: Math.cos(angle) * radius,
            y: height,
            z: Math.sin(angle) * radius,
            vx: -Math.sin(angle) * (0.2 + Math.random() * 0.3),
            vy: (Math.random() - 0.5) * 0.1,
            vz: Math.cos(angle) * (0.2 + Math.random() * 0.3),
            size: 1.5 + Math.random() * 2,
            life: 1,
            r: isRed ? 255 : 168,
            g: isRed ? 120 : 100,
            b: isRed ? 100 : 247,
            trail: []
        });
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;
                
                this.state.rotationY += deltaX * 0.005;
                this.state.rotationX += deltaY * 0.005;
                
                this.state.rotationX = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.state.rotationX));
                
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                this.saveState();
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
        });
        
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.95 : 1.05;
            this.state.zoom *= zoomFactor;
            this.state.zoom = Math.max(0.3, Math.min(4, this.state.zoom));
            document.getElementById('zoom-level').value = this.state.zoom;
            this.saveState();
        });
        
        this.canvas.addEventListener('dblclick', (e) => {
            this.addMarkerAtScreenPosition(e.clientX, e.clientY);
        });
        
        document.getElementById('auto-rotate').addEventListener('change', (e) => {
            this.state.autoRotate = e.target.checked;
            this.saveState();
        });
        
        document.getElementById('rotate-speed').addEventListener('input', (e) => {
            this.state.rotateSpeed = parseFloat(e.target.value);
            this.saveState();
        });
        
        document.getElementById('zoom-level').addEventListener('input', (e) => {
            this.state.zoom = parseFloat(e.target.value);
            this.saveState();
        });
        
        document.getElementById('show-jets').addEventListener('change', (e) => {
            this.state.showJets = e.target.checked;
            this.saveState();
        });
        
        document.getElementById('show-particles').addEventListener('change', (e) => {
            this.state.showParticles = e.target.checked;
            this.saveState();
        });
        
        document.getElementById('accretion-speed').addEventListener('input', (e) => {
            this.state.accretionSpeed = parseFloat(e.target.value);
            this.saveState();
        });
        
        document.getElementById('add-marker').addEventListener('click', () => {
            this.addMarkerAtCenter();
        });
        
        document.getElementById('clear-markers').addEventListener('click', () => {
            this.markers = [];
            this.saveState();
            this.updateMarkersList();
        });
        
        document.getElementById('reset-view').addEventListener('click', () => {
            this.state.rotationX = 0.4;
            this.state.rotationY = 0;
            this.state.zoom = 1;
            this.saveState();
            this.updateUI();
        });
        
        document.getElementById('toggle-panel').addEventListener('click', () => {
            const panel = document.querySelector('.control-panel');
            panel.classList.toggle('collapsed');
        });
    }
    
    updateUI() {
        document.getElementById('auto-rotate').checked = this.state.autoRotate;
        document.getElementById('rotate-speed').value = this.state.rotateSpeed;
        document.getElementById('zoom-level').value = this.state.zoom;
        document.getElementById('show-jets').checked = this.state.showJets;
        document.getElementById('show-particles').checked = this.state.showParticles;
        document.getElementById('accretion-speed').value = this.state.accretionSpeed;
        this.updateMarkersList();
    }
    
    screenToDirection(screenX, screenY) {
        const dx = screenX - this.centerX;
        const dy = screenY - this.centerY;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const theta = Math.atan2(dx, dy);
        
        return {
            offsetX: dx,
            offsetY: dy,
            distance: distance,
            theta: theta,
            baseZoom: this.state.zoom,
            baseRotationX: this.state.rotationX,
            baseRotationY: this.state.rotationY
        };
    }
    
    addMarkerAtScreenPosition(screenX, screenY) {
        const direction = this.screenToDirection(screenX, screenY);
        const name = prompt('请输入标记名称:', `标记 ${this.markers.length + 1}`);
        if (name) {
            this.markers.push({
                id: Date.now(),
                name: name,
                offsetX: direction.offsetX,
                offsetY: direction.offsetY,
                distance: direction.distance,
                theta: direction.theta,
                baseZoom: direction.baseZoom,
                baseRotationX: direction.baseRotationX,
                baseRotationY: direction.baseRotationY,
                createdAt: new Date().toISOString()
            });
            this.saveState();
            this.updateMarkersList();
        }
    }
    
    addMarkerAtCenter() {
        const name = prompt('请输入标记名称:', `标记 ${this.markers.length + 1}`);
        if (name) {
            this.markers.push({
                id: Date.now(),
                name: name,
                offsetX: 0,
                offsetY: 0,
                distance: 0,
                theta: 0,
                baseZoom: this.state.zoom,
                baseRotationX: this.state.rotationX,
                baseRotationY: this.state.rotationY,
                createdAt: new Date().toISOString()
            });
            this.saveState();
            this.updateMarkersList();
        }
    }
    
    updateMarkersList() {
        const list = document.getElementById('markers-list');
        list.innerHTML = '';
        
        this.markers.forEach(marker => {
            const item = document.createElement('div');
            item.className = 'marker-item';
            item.innerHTML = `
                <span class="marker-name" data-id="${marker.id}">${marker.name}</span>
                <span class="marker-delete" data-id="${marker.id}">删除</span>
            `;
            list.appendChild(item);
        });
        
        list.querySelectorAll('.marker-name').forEach(el => {
            el.addEventListener('click', () => {
                const id = parseInt(el.dataset.id);
                const marker = this.markers.find(m => m.id === id);
                if (marker) {
                    this.centerOnMarker(marker);
                }
            });
        });
        
        list.querySelectorAll('.marker-delete').forEach(el => {
            el.addEventListener('click', () => {
                const id = parseInt(el.dataset.id);
                this.markers = this.markers.filter(m => m.id !== id);
                this.saveState();
                this.updateMarkersList();
            });
        });
    }
    
    centerOnMarker(marker) {
        const scaleFactor = this.state.zoom / marker.baseZoom;
        const targetOffsetX = marker.offsetX * scaleFactor;
        const targetOffsetY = marker.offsetY * scaleFactor;
        
        this.state.rotationY += targetOffsetX * 0.001;
        this.state.rotationX -= targetOffsetY * 0.001;
        this.state.rotationX = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.state.rotationX));
        this.saveState();
        this.updateUI();
    }
    
    rotatePoint(x, y, z) {
        let rx = x;
        let ry = y;
        let rz = z;
        
        let tempY = ry * Math.cos(this.state.rotationX) - rz * Math.sin(this.state.rotationX);
        let tempZ = ry * Math.sin(this.state.rotationX) + rz * Math.cos(this.state.rotationX);
        ry = tempY;
        rz = tempZ;
        
        let tempX = rx * Math.cos(this.state.rotationY) + rz * Math.sin(this.state.rotationY);
        tempZ = -rx * Math.sin(this.state.rotationY) + rz * Math.cos(this.state.rotationY);
        rx = tempX;
        rz = tempZ;
        
        return { x: rx, y: ry, z: rz };
    }
    
    project(x, y, z) {
        const perspective = 1000;
        const scale = perspective / (perspective + z);
        return {
            x: this.centerX + x * scale * this.state.zoom,
            y: this.centerY + y * scale * this.state.zoom,
            scale: scale * this.state.zoom,
            z: z
        };
    }
    
    gravitationalDistortion(x, y, z) {
        const distFromCenter = Math.sqrt(x * x + y * y + z * z);
        const blackHoleRadius = 40;
        
        if (distFromCenter < blackHoleRadius * 5) {
            const distortion = Math.pow(blackHoleRadius / (distFromCenter + blackHoleRadius), 1.5) * 6;
            const dirX = x / distFromCenter || 0;
            const dirY = y / distFromCenter || 0;
            const dirZ = z / distFromCenter || 0;
            
            return {
                x: x - dirX * distortion * 25,
                y: y - dirY * distortion * 25,
                z: z - dirZ * distortion * 25
            };
        }
        return { x, y, z };
    }
    
    updateStars(time) {
        this.stars.forEach(star => {
            star.brightness = 0.5 + Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.3;
        });
    }
    
    updateParticles() {
        if (!this.state.showParticles) return;
        
        this.particles.forEach((particle, index) => {
            const distFromCenter = Math.sqrt(
                particle.x * particle.x + 
                particle.y * particle.y + 
                particle.z * particle.z
            );
            
            const gravity = 1200 / (distFromCenter * distFromCenter + 50);
            particle.vx -= (particle.x / distFromCenter) * gravity * 0.006;
            particle.vy -= (particle.y / distFromCenter) * gravity * 0.006;
            particle.vz -= (particle.z / distFromCenter) * gravity * 0.006;
            
            particle.trail.push({ x: particle.x, y: particle.y, z: particle.z });
            if (particle.trail.length > 10) {
                particle.trail.shift();
            }
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.z += particle.vz;
            
            if (distFromCenter < 60) {
                particle.life -= 0.01;
                particle.size *= 0.995;
            }
            
            if (particle.life <= 0 || distFromCenter < 35) {
                this.particles.splice(index, 1);
                if (this.particles.length < 40) {
                    this.spawnParticle();
                }
            }
        });
    }
    
    renderStars(time) {
        const sortedStars = this.stars.map(star => {
            const distorted = this.gravitationalDistortion(star.x, star.y, star.z);
            const rotated = this.rotatePoint(distorted.x, distorted.y, distorted.z);
            const projected = this.project(rotated.x, rotated.y, rotated.z);
            
            return { ...star, projected, rotated };
        }).sort((a, b) => b.projected.z - a.projected.z);
        
        sortedStars.forEach(star => {
            const { projected, rotated } = star;
            
            if (projected.z < -600) return;
            
            const distFromCenter = Math.sqrt(rotated.x * rotated.x + rotated.y * rotated.y + rotated.z * rotated.z);
            const lensingEffect = Math.max(0, 1 - (distFromCenter / 600));
            
            const size = star.size * projected.scale * (1 + lensingEffect * 2);
            const alpha = star.brightness * Math.min(1, (projected.z + 800) / 1000);
            
            if (lensingEffect > 0.2) {
                const stretchX = 1 + lensingEffect * 0.6;
                const stretchY = 1 / (1 + lensingEffect * 0.6);
                
                this.ctx.save();
                this.ctx.translate(projected.x, projected.y);
                this.ctx.scale(stretchX, stretchY);
                
                const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.5);
                gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
                gradient.addColorStop(0.5, `rgba(230, 220, 255, ${alpha * 0.4})`);
                gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
                
                this.ctx.beginPath();
                this.ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
                this.ctx.fillStyle = gradient;
                this.ctx.fill();
                this.ctx.restore();
            } else {
                const gradient = this.ctx.createRadialGradient(
                    projected.x, projected.y, 0,
                    projected.x, projected.y, size
                );
                gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
                gradient.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 0.3})`);
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                this.ctx.beginPath();
                this.ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
                this.ctx.fillStyle = gradient;
                this.ctx.fill();
            }
        });
    }
    
    renderJets() {
        if (!this.state.showJets) return;
        
        const jetLength = 350 * this.state.zoom;
        const jetWidth = 25 * this.state.zoom;
        
        const topStart = this.project(0, -45, 0);
        const topEnd = this.project(0, -jetLength / this.state.zoom, 0);
        
        const bottomStart = this.project(0, 45, 0);
        const bottomEnd = this.project(0, jetLength / this.state.zoom, 0);
        
        const topGradient = this.ctx.createLinearGradient(
            topStart.x, topStart.y,
            topEnd.x, topEnd.y
        );
        topGradient.addColorStop(0, 'rgba(120, 180, 255, 0.6)');
        topGradient.addColorStop(0.3, 'rgba(180, 220, 255, 0.35)');
        topGradient.addColorStop(0.6, 'rgba(200, 235, 255, 0.15)');
        topGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.beginPath();
        this.ctx.moveTo(topStart.x - jetWidth * 0.35, topStart.y);
        this.ctx.lineTo(topEnd.x - jetWidth * 0.12, topEnd.y);
        this.ctx.lineTo(topEnd.x + jetWidth * 0.12, topEnd.y);
        this.ctx.lineTo(topStart.x + jetWidth * 0.35, topStart.y);
        this.ctx.closePath();
        this.ctx.fillStyle = topGradient;
        this.ctx.fill();
        
        const bottomGradient = this.ctx.createLinearGradient(
            bottomStart.x, bottomStart.y,
            bottomEnd.x, bottomEnd.y
        );
        bottomGradient.addColorStop(0, 'rgba(120, 180, 255, 0.6)');
        bottomGradient.addColorStop(0.3, 'rgba(180, 220, 255, 0.35)');
        bottomGradient.addColorStop(0.6, 'rgba(200, 235, 255, 0.15)');
        bottomGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.beginPath();
        this.ctx.moveTo(bottomStart.x - jetWidth * 0.35, bottomStart.y);
        this.ctx.lineTo(bottomEnd.x - jetWidth * 0.12, bottomEnd.y);
        this.ctx.lineTo(bottomEnd.x + jetWidth * 0.12, bottomEnd.y);
        this.ctx.lineTo(bottomStart.x + jetWidth * 0.35, bottomStart.y);
        this.ctx.closePath();
        this.ctx.fillStyle = bottomGradient;
        this.ctx.fill();
    }
    
    renderAccretionDisk() {
        const innerRadius = 50;
        const outerRadius = 140;
        const segments = 180;
        
        const backPoints = [];
        const frontPoints = [];
        
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2 + this.state.accretionRotation;
            
            const x = Math.cos(angle) * outerRadius;
            const y = Math.sin(angle * 2) * 2;
            const z = Math.sin(angle) * outerRadius;
            
            const rotated = this.rotatePoint(x, y, z);
            const projected = this.project(rotated.x, rotated.y, rotated.z);
            
            const point = {
                angle: angle,
                x: x,
                y: y,
                z: z,
                rotated: rotated,
                projected: projected,
                radius: outerRadius
            };
            
            if (rotated.y > 0) {
                backPoints.push(point);
            } else {
                frontPoints.push(point);
            }
        }
        
        this.renderDiskRings(backPoints, innerRadius, outerRadius, true);
        
        this.renderDiskRings(frontPoints, innerRadius, outerRadius, false);
    }
    
    renderDiskRings(points, innerRadius, outerRadius, isBack) {
        const ringCount = 8;
        
        for (let ring = ringCount - 1; ring >= 0; ring--) {
            const t = ring / (ringCount - 1);
            const ringRadius = innerRadius + (outerRadius - innerRadius) * t;
            
            let r, g, b;
            if (t < 0.3) {
                r = 255;
                g = 100 + t * 400;
                b = 20;
            } else if (t < 0.6) {
                r = 255 - (t - 0.3) * 500;
                g = 220 - (t - 0.3) * 300;
                b = (t - 0.3) * 600;
            } else {
                r = 100 + (t - 0.6) * 120;
                g = 40 + (t - 0.6) * 60;
                b = 180 + (t - 0.6) * 75;
            }
            
            const brightness = 0.5 + Math.sin(this.state.accretionRotation * 2 + t * Math.PI * 4) * 0.2;
            const alpha = (0.6 - t * 0.35) * brightness;
            
            this.ctx.beginPath();
            const segments = 120;
            
            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2 + this.state.accretionRotation;
                
                const x = Math.cos(angle) * ringRadius;
                const y = Math.sin(angle * 2 + this.state.accretionRotation) * 3;
                const z = Math.sin(angle) * ringRadius;
                
                const rotated = this.rotatePoint(x, y, z);
                
                if (isBack && rotated.y <= 0) continue;
                if (!isBack && rotated.y > 0) continue;
                
                const projected = this.project(rotated.x, rotated.y, rotated.z);
                
                if (i === 0 || 
                    (isBack && rotated.y > 0 && this.ctx.isPointInPath === undefined) ||
                    (!isBack && rotated.y <= 0)) {
                    this.ctx.moveTo(projected.x, projected.y);
                } else {
                    this.ctx.lineTo(projected.x, projected.y);
                }
            }
            
            const lineWidth = (12 - ring * 1.2) * this.state.zoom;
            
            this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            this.ctx.lineWidth = lineWidth;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.stroke();
            
            this.ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.3)`;
            this.ctx.shadowBlur = 8;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        }
        
        this.renderAccretionParticles(points, innerRadius, outerRadius, isBack);
    }
    
    renderAccretionParticles(points, innerRadius, outerRadius, isBack) {
        const particleCount = 30;
        
        for (let i = 0; i < particleCount; i++) {
            const t = (i / particleCount);
            const angle = t * Math.PI * 2 + this.state.accretionRotation * (1 + t * 0.5);
            const radius = innerRadius + (outerRadius - innerRadius) * (0.2 + t * 0.6);
            
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle * 3) * 4;
            const z = Math.sin(angle) * radius;
            
            const rotated = this.rotatePoint(x, y, z);
            
            if (isBack && rotated.y <= 0) continue;
            if (!isBack && rotated.y > 0) continue;
            
            const projected = this.project(rotated.x, rotated.y, rotated.z);
            
            const colorT = (radius - innerRadius) / (outerRadius - innerRadius);
            let r, g, b;
            if (colorT < 0.3) {
                r = 255;
                g = 150 + colorT * 300;
                b = 50;
            } else if (colorT < 0.6) {
                r = 255 - (colorT - 0.3) * 400;
                g = 240 - (colorT - 0.3) * 200;
                b = (colorT - 0.3) * 500;
            } else {
                r = 130;
                g = 80;
                b = 220;
            }
            
            const size = (2 + Math.sin(angle * 2 + this.state.accretionRotation) * 0.5) * projected.scale;
            const alpha = 0.4 + Math.sin(this.state.accretionRotation + angle * 3) * 0.2;
            
            const gradient = this.ctx.createRadialGradient(
                projected.x, projected.y, 0,
                projected.x, projected.y, size * 2
            );
            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
            gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.4})`);
            gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            
            this.ctx.beginPath();
            this.ctx.arc(projected.x, projected.y, size * 2, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
        }
    }
    
    renderPhotonSphere(time) {
        const baseRadius = 48;
        const pulse = 0.75 + Math.sin(this.state.photonSpherePulse) * 0.25;
        const radius = baseRadius * this.state.zoom;
        
        const center = this.project(0, 0, 0);
        
        for (let i = 2; i >= 0; i--) {
            const layerRadius = radius * (1 + i * 0.12);
            const layerAlpha = (0.25 - i * 0.06) * pulse;
            
            const gradient = this.ctx.createRadialGradient(
                center.x, center.y, layerRadius * 0.88,
                center.x, center.y, layerRadius * 1.12
            );
            
            gradient.addColorStop(0, `rgba(255, 180, 80, 0)`);
            gradient.addColorStop(0.5, `rgba(255, 200, 100, ${layerAlpha})`);
            gradient.addColorStop(0.7, `rgba(255, 220, 150, ${layerAlpha * 1.1})`);
            gradient.addColorStop(1, `rgba(255, 200, 100, 0)`);
            
            this.ctx.beginPath();
            this.ctx.arc(center.x, center.y, layerRadius * 1.12, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
        }
        
        this.ctx.beginPath();
        this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(255, 230, 180, ${0.7 * pulse})`;
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }
    
    renderBlackHole() {
        const radius = 40 * this.state.zoom;
        const center = this.project(0, 0, 0);
        
        for (let i = 4; i >= 0; i--) {
            const layerRadius = radius * (1 + i * 0.35);
            const layerAlpha = 0.9 - i * 0.15;
            
            const gradient = this.ctx.createRadialGradient(
                center.x, center.y, radius * 0.6,
                center.x, center.y, layerRadius
            );
            gradient.addColorStop(0, `rgba(0, 0, 0, ${layerAlpha})`);
            gradient.addColorStop(0.5, `rgba(0, 0, 0, ${layerAlpha * 0.5})`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            this.ctx.beginPath();
            this.ctx.arc(center.x, center.y, layerRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
        }
        
        const innerGradient = this.ctx.createRadialGradient(
            center.x, center.y, 0,
            center.x, center.y, radius
        );
        innerGradient.addColorStop(0, '#000000');
        innerGradient.addColorStop(1, '#000000');
        
        this.ctx.beginPath();
        this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = innerGradient;
        this.ctx.fill();
    }
    
    renderParticles() {
        if (!this.state.showParticles) return;
        
        const sortedParticles = this.particles.map(particle => {
            const rotated = this.rotatePoint(particle.x, particle.y, particle.z);
            const projected = this.project(rotated.x, rotated.y, rotated.z);
            
            const trailProjected = particle.trail.map(t => {
                const tr = this.rotatePoint(t.x, t.y, t.z);
                return this.project(tr.x, tr.y, tr.z);
            });
            
            return { ...particle, rotated, projected, trailProjected };
        }).sort((a, b) => b.projected.z - a.projected.z);
        
        sortedParticles.forEach(particle => {
            const { projected, trailProjected } = particle;
            const size = particle.size * projected.scale * particle.life;
            
            if (trailProjected.length > 2) {
                this.ctx.beginPath();
                this.ctx.moveTo(trailProjected[0].x, trailProjected[0].y);
                
                for (let i = 1; i < trailProjected.length; i++) {
                    this.ctx.lineTo(trailProjected[i].x, trailProjected[i].y);
                }
                this.ctx.lineTo(projected.x, projected.y);
                
                const trailAlpha = particle.life * 0.25;
                this.ctx.strokeStyle = `rgba(${particle.r}, ${particle.g}, ${particle.b}, ${trailAlpha})`;
                this.ctx.lineWidth = size * 0.4;
                this.ctx.lineCap = 'round';
                this.ctx.stroke();
            }
            
            const gradient = this.ctx.createRadialGradient(
                projected.x, projected.y, 0,
                projected.x, projected.y, size * 2.5
            );
            gradient.addColorStop(0, `rgba(${particle.r}, ${particle.g}, ${particle.b}, ${particle.life * 0.6})`);
            gradient.addColorStop(0.5, `rgba(${particle.r}, ${particle.g}, ${particle.b}, ${particle.life * 0.25})`);
            gradient.addColorStop(1, `rgba(${particle.r}, ${particle.g}, ${particle.b}, 0)`);
            
            this.ctx.beginPath();
            this.ctx.arc(projected.x, projected.y, size * 2.5, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
        });
    }
    
    renderMarkers() {
        this.markers.forEach(marker => {
            let screenX, screenY;
            
            if (marker.worldX !== undefined) {
                const rotated = this.rotatePoint(marker.worldX, marker.worldY, marker.worldZ);
                const projected = this.project(rotated.x, rotated.y, rotated.z);
                screenX = projected.x;
                screenY = projected.y;
            }
            else if (marker.offsetX !== undefined) {
                const scaleFactor = this.state.zoom / marker.baseZoom;
                screenX = this.centerX + marker.offsetX * scaleFactor;
                screenY = this.centerY + marker.offsetY * scaleFactor;
            }
            else {
                return;
            }
            
            const markerSize = 15 * this.state.zoom;
            const innerSize = 4 * this.state.zoom;
            
            const gradient = this.ctx.createRadialGradient(
                screenX, screenY, 0,
                screenX, screenY, markerSize
            );
            gradient.addColorStop(0, 'rgba(168, 85, 247, 0.7)');
            gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.35)');
            gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
            
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, markerSize, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, innerSize, 0, Math.PI * 2);
            this.ctx.fillStyle = '#a855f7';
            this.ctx.fill();
            
            this.ctx.font = `bold ${10 * this.state.zoom}px Arial`;
            this.ctx.fillStyle = '#fff';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(marker.name, screenX, screenY - markerSize - 3);
        });
    }
    
    animate(currentTime = 0) {
        requestAnimationFrame((time) => this.animate(time));
        
        if (this.state.autoRotate) {
            this.state.rotationY += 0.0012 * this.state.rotateSpeed;
        }
        
        this.state.accretionRotation += 0.006 * this.state.accretionSpeed;
        this.state.photonSpherePulse += 0.02;
        
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.updateStars(currentTime);
        this.updateParticles();
        
        this.renderStars(currentTime);
        
        this.renderJets();
        this.renderAccretionDisk();
        this.renderPhotonSphere(currentTime);
        this.renderBlackHole();
        this.renderParticles();
        this.renderMarkers();
        
        this.saveState();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new BlackHoleSimulator();
});
