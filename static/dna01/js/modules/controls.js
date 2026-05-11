const Controls = {
    config: null,
    onChangeCallback: null,
    
    elements: {},
    
    init(config, onChangeCallback) {
        this.config = config;
        this.onChangeCallback = onChangeCallback;
        
        this.cacheElements();
        this.bindEvents();
        this.updateUI();
    },
    
    cacheElements() {
        this.elements = {
            mode3dBtn: document.getElementById('mode-3d-btn'),
            mode2dBtn: document.getElementById('mode-2d-btn'),
            
            radius: document.getElementById('radius'),
            radiusValue: document.getElementById('radius-value'),
            
            height: document.getElementById('height'),
            heightValue: document.getElementById('height-value'),
            
            turns: document.getElementById('turns'),
            turnsValue: document.getElementById('turns-value'),
            
            basePairs: document.getElementById('base-pairs'),
            basePairsValue: document.getElementById('base-pairs-value'),
            
            speed: document.getElementById('speed'),
            speedValue: document.getElementById('speed-value'),
            
            strandThickness: document.getElementById('strand-thickness'),
            strandThicknessValue: document.getElementById('strand-thickness-value'),
            
            strandAColor: document.getElementById('strand-a-color'),
            strandAColorValue: document.getElementById('strand-a-color-value'),
            
            strandBColor: document.getElementById('strand-b-color'),
            strandBColorValue: document.getElementById('strand-b-color-value'),
            
            atBaseColor: document.getElementById('at-base-color'),
            atBaseColorValue: document.getElementById('at-base-color-value'),
            
            cgBaseColor: document.getElementById('cg-base-color'),
            cgBaseColorValue: document.getElementById('cg-base-color-value'),
            
            bgColor: document.getElementById('bg-color'),
            bgColorValue: document.getElementById('bg-color-value'),
            
            lightColor: document.getElementById('light-color'),
            lightColorValue: document.getElementById('light-color-value'),
            
            showLabels: document.getElementById('show-labels'),
            autoRotate: document.getElementById('auto-rotate'),
            showGlow: document.getElementById('show-glow'),
            
            resetBtn: document.getElementById('reset-btn'),
            randomizeBtn: document.getElementById('randomize-btn'),
            
            modeBadge: document.getElementById('mode-badge'),
            basePairCount: document.getElementById('base-pair-count')
        };
    },
    
    bindEvents() {
        this.elements.mode3dBtn.addEventListener('click', () => this.setMode('3d'));
        this.elements.mode2dBtn.addEventListener('click', () => this.setMode('2d'));
        
        this.elements.radius.addEventListener('input', (e) => {
            this.config.radius = parseFloat(e.target.value);
            this.elements.radiusValue.textContent = this.config.radius.toFixed(1);
            this.notifyChange();
        });
        
        this.elements.height.addEventListener('input', (e) => {
            this.config.height = parseFloat(e.target.value);
            this.elements.heightValue.textContent = this.config.height.toFixed(1);
            this.updateBasePairCount();
            this.notifyChange();
        });
        
        this.elements.turns.addEventListener('input', (e) => {
            this.config.turns = parseFloat(e.target.value);
            this.elements.turnsValue.textContent = this.config.turns.toFixed(1);
            this.notifyChange();
        });
        
        this.elements.basePairs.addEventListener('input', (e) => {
            this.config.basePairs = parseInt(e.target.value);
            this.elements.basePairsValue.textContent = this.config.basePairs;
            this.updateBasePairCount();
            this.notifyChange();
        });
        
        this.elements.speed.addEventListener('input', (e) => {
            this.config.speed = parseFloat(e.target.value);
            this.elements.speedValue.textContent = this.config.speed.toFixed(1);
            this.notifyChange();
        });
        
        this.elements.strandThickness.addEventListener('input', (e) => {
            this.config.strandThickness = parseFloat(e.target.value);
            this.elements.strandThicknessValue.textContent = this.config.strandThickness.toFixed(2);
            this.notifyChange();
        });
        
        this.elements.strandAColor.addEventListener('input', (e) => {
            this.config.colors.strandA = e.target.value;
            this.elements.strandAColorValue.textContent = e.target.value;
            this.notifyChange();
        });
        
        this.elements.strandBColor.addEventListener('input', (e) => {
            this.config.colors.strandB = e.target.value;
            this.elements.strandBColorValue.textContent = e.target.value;
            this.notifyChange();
        });
        
        this.elements.atBaseColor.addEventListener('input', (e) => {
            this.config.colors.atBase = e.target.value;
            this.elements.atBaseColorValue.textContent = e.target.value;
            this.notifyChange();
        });
        
        this.elements.cgBaseColor.addEventListener('input', (e) => {
            this.config.colors.cgBase = e.target.value;
            this.elements.cgBaseColorValue.textContent = e.target.value;
            this.notifyChange();
        });
        
        this.elements.bgColor.addEventListener('input', (e) => {
            this.config.colors.background = e.target.value;
            this.elements.bgColorValue.textContent = e.target.value;
            this.notifyChange();
        });
        
        this.elements.lightColor.addEventListener('input', (e) => {
            this.config.colors.light = e.target.value;
            this.elements.lightColorValue.textContent = e.target.value;
            this.notifyChange();
        });
        
        this.elements.showLabels.addEventListener('change', (e) => {
            this.config.display.showLabels = e.target.checked;
            this.notifyChange();
        });
        
        this.elements.autoRotate.addEventListener('change', (e) => {
            this.config.display.autoRotate = e.target.checked;
            this.notifyChange();
        });
        
        this.elements.showGlow.addEventListener('change', (e) => {
            this.config.display.showGlow = e.target.checked;
            this.notifyChange();
        });
        
        this.elements.resetBtn.addEventListener('click', () => this.resetToDefaults());
        this.elements.randomizeBtn.addEventListener('click', () => this.randomize());
    },
    
    setMode(mode) {
        this.config.viewMode = mode;
        
        if (mode === '3d') {
            this.elements.mode3dBtn.classList.add('active');
            this.elements.mode2dBtn.classList.remove('active');
            this.elements.modeBadge.textContent = '3D 模式';
        } else {
            this.elements.mode3dBtn.classList.remove('active');
            this.elements.mode2dBtn.classList.add('active');
            this.elements.modeBadge.textContent = '2D 模式';
        }
        
        this.notifyChange();
    },
    
    resetToDefaults() {
        const defaults = Storage.getDefaults();
        
        this.config.radius = defaults.radius;
        this.config.height = defaults.height;
        this.config.turns = defaults.turns;
        this.config.basePairs = defaults.basePairs;
        this.config.speed = defaults.speed;
        this.config.strandThickness = defaults.strandThickness;
        
        this.config.colors = { ...defaults.colors };
        this.config.display = { ...defaults.display };
        
        this.updateUI();
        this.updateBasePairCount();
        this.notifyChange();
    },
    
    randomize() {
        this.config.radius = Utils.rand(0.5, 2.5);
        this.config.height = Utils.rand(3, 15);
        this.config.turns = Utils.rand(0.5, 6);
        this.config.basePairs = Utils.randInt(8, 60);
        this.config.speed = Utils.rand(-3, 3);
        this.config.strandThickness = Utils.rand(0.05, 0.3);
        
        this.config.colors.strandA = this.randomColor();
        this.config.colors.strandB = this.randomColor();
        this.config.colors.atBase = this.randomColor();
        this.config.colors.cgBase = this.randomColor();
        
        this.updateUI();
        this.updateBasePairCount();
        this.notifyChange();
    },
    
    randomColor() {
        return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    },
    
    updateUI() {
        this.elements.radius.value = this.config.radius;
        this.elements.radiusValue.textContent = this.config.radius.toFixed(1);
        
        this.elements.height.value = this.config.height;
        this.elements.heightValue.textContent = this.config.height.toFixed(1);
        
        this.elements.turns.value = this.config.turns;
        this.elements.turnsValue.textContent = this.config.turns.toFixed(1);
        
        this.elements.basePairs.value = this.config.basePairs;
        this.elements.basePairsValue.textContent = this.config.basePairs;
        
        this.elements.speed.value = this.config.speed;
        this.elements.speedValue.textContent = this.config.speed.toFixed(1);
        
        this.elements.strandThickness.value = this.config.strandThickness;
        this.elements.strandThicknessValue.textContent = this.config.strandThickness.toFixed(2);
        
        this.elements.strandAColor.value = this.config.colors.strandA;
        this.elements.strandAColorValue.textContent = this.config.colors.strandA;
        
        this.elements.strandBColor.value = this.config.colors.strandB;
        this.elements.strandBColorValue.textContent = this.config.colors.strandB;
        
        this.elements.atBaseColor.value = this.config.colors.atBase;
        this.elements.atBaseColorValue.textContent = this.config.colors.atBase;
        
        this.elements.cgBaseColor.value = this.config.colors.cgBase;
        this.elements.cgBaseColorValue.textContent = this.config.colors.cgBase;
        
        this.elements.bgColor.value = this.config.colors.background;
        this.elements.bgColorValue.textContent = this.config.colors.background;
        
        this.elements.lightColor.value = this.config.colors.light;
        this.elements.lightColorValue.textContent = this.config.colors.light;
        
        this.elements.showLabels.checked = this.config.display.showLabels;
        this.elements.autoRotate.checked = this.config.display.autoRotate;
        this.elements.showGlow.checked = this.config.display.showGlow;
        
        this.setMode(this.config.viewMode);
        this.updateBasePairCount();
    },
    
    updateBasePairCount() {
        this.elements.basePairCount.textContent = `碱基对: ${this.config.basePairs}`;
    },
    
    notifyChange() {
        if (this.onChangeCallback) {
            this.onChangeCallback();
        }
    },
    
    updateConfig(config) {
        this.config = config;
        this.updateUI();
    }
};
