const App = {
    config: null,
    camera: null,
    canvas: null,
    
    animationId: null,
    lastTime: 0,
    elapsedTime: 0,
    
    autoRotateAngle: 0,
    saveTimer: null,
    
    basePairsSequence: [],
    lastBasePairCount: 0,
    particles: [],
    particleCount: 100,
    
    init() {
        this.canvas = document.getElementById('dna-canvas');
        
        this.config = Storage.load();
        this.camera = { ...this.config.camera };
        
        this.generateBasePairsSequence();
        this.initParticles();
        
        Renderer3D.init(this.canvas);
        Renderer2D.init(this.canvas);
        
        Controls.init(this.config, () => this.onConfigChange());
        
        Interaction.init(
            this.canvas,
            this.camera,
            this.config,
            () => this.onConfigChange()
        );
        
        window.addEventListener('resize', () => this.onResize());
        
        this.canvas.style.cursor = 'grab';
        
        this.lastTime = performance.now();
        this.animate();
        
        this.savePeriodically();
    },
    
    generateBasePairsSequence() {
        this.basePairsSequence = Utils.generateBasePairs(this.config.basePairs);
        this.lastBasePairCount = this.config.basePairs;
    },
    
    initParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            const type = Math.random();
            if (type < 0.6) {
                this.particles.push({
                    type: 'star',
                    x: Math.random(),
                    y: Math.random(),
                    size: Math.random() * 1.5 + 0.5,
                    speed: Math.random() * 0.0002 + 0.00005,
                    opacity: Math.random() * 0.6 + 0.2,
                    twinkleSpeed: Math.random() * 2 + 1,
                    twinkleOffset: Math.random() * Math.PI * 2
                });
            } else if (type < 0.85) {
                this.particles.push({
                    type: 'streak',
                    x: Math.random(),
                    y: Math.random(),
                    length: Math.random() * 0.05 + 0.02,
                    speed: Math.random() * 0.001 + 0.0005,
                    opacity: Math.random() * 0.4 + 0.1,
                    angle: Math.random() * Math.PI - Math.PI / 2
                });
            } else {
                this.particles.push({
                    type: 'glow',
                    x: Math.random(),
                    y: Math.random(),
                    size: Math.random() * 30 + 15,
                    speed: Math.random() * 0.0001 + 0.00005,
                    opacity: Math.random() * 0.15 + 0.05,
                    pulseSpeed: Math.random() * 1 + 0.5,
                    pulseOffset: Math.random() * Math.PI * 2
                });
            }
        }
    },
    
    updateParticles() {
        this.particles.forEach(p => {
            p.y -= p.speed;
            if (p.y < -0.1) {
                p.y = 1.1;
                p.x = Math.random();
            }
        });
    },
    
    animate(currentTime = 0) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        this.elapsedTime += deltaTime;
        
        if (this.config.display.autoRotate) {
            this.autoRotateAngle += deltaTime * this.config.speed * 0.5;
        }
        
        this.updateParticles();
        
        this.render();
        
        this.animationId = requestAnimationFrame((t) => this.animate(t));
    },
    
    render() {
        if (this.config.viewMode === '3d') {
            const renderCamera = {
                rotationX: this.camera.rotationX,
                rotationY: this.camera.rotationY + this.autoRotateAngle,
                zoom: this.camera.zoom
            };
            Renderer3D.render(this.config, renderCamera, this.basePairsSequence, this.particles, this.elapsedTime);
        } else {
            Renderer2D.render(this.config, this.autoRotateAngle, this.basePairsSequence, this.particles, this.elapsedTime);
        }
    },
    
    onConfigChange() {
        if (this.config.basePairs !== this.lastBasePairCount) {
            this.generateBasePairsSequence();
        }
        
        this.config.camera = { ...this.camera };
        
        Controls.elements.autoRotate.checked = this.config.display.autoRotate;
        
        this.scheduleSave();
    },
    
    onResize() {
        Renderer3D.resize();
        Renderer2D.resize();
    },
    
    scheduleSave() {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }
        
        this.saveTimer = setTimeout(() => {
            this.saveConfig();
        }, 500);
    },
    
    savePeriodically() {
        setInterval(() => {
            this.saveConfig();
        }, 5000);
    },
    
    saveConfig() {
        this.config.camera = { ...this.camera };
        Storage.save(this.config);
    },
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }
        
        this.saveConfig();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

window.addEventListener('beforeunload', () => {
    App.destroy();
});
