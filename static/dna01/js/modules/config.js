const DEFAULT_CONFIG = {
    radius: 1.0,
    height: 8.0,
    turns: 2.0,
    basePairs: 20,
    speed: 1.0,
    strandThickness: 0.1,
    
    colors: {
        strandA: '#00ff88',
        strandB: '#00aaff',
        atBase: '#ff4444',
        cgBase: '#4444ff',
        background: '#0a0a1a',
        light: '#ffffff'
    },
    
    display: {
        showLabels: true,
        autoRotate: true,
        showGlow: true
    },
    
    camera: {
        rotationX: 0.4,
        rotationY: 0,
        zoom: 1.0
    },
    
    viewMode: '3d'
};

const BASE_PAIRS = ['A-T', 'T-A', 'C-G', 'G-C'];

const CONFIG_KEY = 'dna_generator_config';
