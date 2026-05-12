class MapManager {
    constructor() {
        this.scenes = {};
        this.currentScene = null;
        this.camera = { x: 0, y: 0 };
        this.canvasWidth = 0;
        this.canvasHeight = 0;
    }

    init(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.createScenes();
    }

    createScenes() {
        this.scenes['nest_entrance'] = this.createNestEntrance();
        this.scenes['crossroads'] = this.createCrossroads();
        this.scenes['green_path'] = this.createGreenPath();
        this.scenes['boss_arena'] = this.createBossArena();
    }

    createNestEntrance() {
        return {
            name: 'nest_entrance',
            width: 1600,
            height: 900,
            platforms: [
                new Platform(0, 750, 1600, 50, 'stone'),
                new Platform(200, 600, 200, 25),
                new Platform(500, 500, 150, 25),
                new Platform(750, 400, 200, 25),
                new Platform(1050, 500, 150, 25),
                new Platform(1300, 600, 200, 25),
                new Platform(100, 400, 100, 25, 'bone'),
                new Platform(400, 300, 100, 25, 'bone'),
            ],
            walls: [
                new Wall(0, 0, 30, 900),
                new Wall(1570, 0, 30, 900),
            ],
            enemies: [
                { type: 'beetle', x: 400, y: 700 },
                { type: 'beetle', x: 800, y: 700 },
                { type: 'moth', x: 600, y: 400 },
                { type: 'moth', x: 1000, y: 350 },
            ],
            collectibles: [
                new Collectible(550, 460, 'essence', 10),
                new Collectible(800, 360, 'essence', 10),
                new Collectible(300, 560, 'health', 1),
                new Collectible(1100, 460, 'soul', 20),
            ],
            benches: [
                new Bench(100, 700, 'nest_entrance'),
            ],
            abilityPickups: [],
            exits: [
                { x: 1500, y: 700, width: 70, height: 50, target: 'crossroads', spawnX: 100, spawnY: 700 },
            ],
            boss: null,
            background: this.createBackground('nest'),
        };
    }

    createCrossroads() {
        return {
            name: 'crossroads',
            width: 2000,
            height: 1000,
            platforms: [
                new Platform(0, 850, 2000, 50, 'stone'),
                new Platform(150, 700, 150, 25),
                new Platform(400, 600, 200, 25),
                new Platform(700, 500, 150, 25),
                new Platform(950, 400, 200, 25),
                new Platform(1200, 500, 150, 25),
                new Platform(1450, 600, 200, 25),
                new Platform(1700, 700, 150, 25),
                new Platform(300, 350, 100, 25, 'bone'),
                new Platform(600, 250, 120, 25, 'bone'),
                new Platform(1000, 200, 150, 25),
            ],
            walls: [
                new Wall(0, 0, 30, 1000),
                new Wall(1970, 0, 30, 1000),
            ],
            enemies: [
                { type: 'beetle', x: 300, y: 800 },
                { type: 'beetle', x: 700, y: 800 },
                { type: 'beetle', x: 1200, y: 800 },
                { type: 'spider', x: 500, y: 550 },
                { type: 'spider', x: 1000, y: 350 },
                { type: 'moth', x: 800, y: 300 },
                { type: 'shell', x: 1500, y: 800 },
            ],
            collectibles: [
                new Collectible(450, 560, 'essence', 15),
                new Collectible(750, 460, 'essence', 15),
                new Collectible(1000, 360, 'essence', 15),
                new Collectible(200, 660, 'health', 1),
                new Collectible(1300, 560, 'health', 1),
                new Collectible(650, 210, 'soul', 30),
            ],
            benches: [
                new Bench(900, 800, 'crossroads'),
            ],
            abilityPickups: [
                new AbilityPickup(1050, 150, 'dash'),
            ],
            exits: [
                { x: 0, y: 800, width: 70, height: 50, target: 'nest_entrance', spawnX: 1450, spawnY: 700 },
                { x: 1930, y: 800, width: 70, height: 50, target: 'green_path', spawnX: 100, spawnY: 700 },
            ],
            boss: null,
            background: this.createBackground('crossroads'),
        };
    }

    createGreenPath() {
        return {
            name: 'green_path',
            width: 1800,
            height: 1000,
            platforms: [
                new Platform(0, 850, 1800, 50, 'stone'),
                new Platform(100, 700, 150, 25),
                new Platform(350, 600, 200, 25),
                new Platform(650, 500, 150, 25),
                new Platform(900, 400, 200, 25),
                new Platform(1150, 300, 150, 25),
                new Platform(1400, 400, 200, 25),
                new Platform(200, 450, 100, 25, 'bone'),
                new Platform(500, 350, 100, 25, 'bone'),
                new Platform(800, 250, 100, 25, 'bone'),
            ],
            walls: [
                new Wall(0, 0, 30, 1000),
                new Wall(1770, 0, 30, 1000),
            ],
            enemies: [
                { type: 'moth', x: 300, y: 500 },
                { type: 'moth', x: 600, y: 400 },
                { type: 'moth', x: 900, y: 300 },
                { type: 'spider', x: 400, y: 550 },
                { type: 'spider', x: 800, y: 350 },
                { type: 'shell', x: 1200, y: 800 },
                { type: 'beetle', x: 1500, y: 800 },
            ],
            collectibles: [
                new Collectible(400, 560, 'essence', 20),
                new Collectible(700, 460, 'essence', 20),
                new Collectible(950, 360, 'essence', 20),
                new Collectible(250, 410, 'health', 1),
                new Collectible(550, 310, 'soul', 30),
                new Collectible(850, 210, 'soul', 30),
            ],
            benches: [
                new Bench(100, 800, 'green_path'),
            ],
            abilityPickups: [
                new AbilityPickup(1200, 250, 'wallClimb'),
            ],
            exits: [
                { x: 0, y: 800, width: 70, height: 50, target: 'crossroads', spawnX: 1850, spawnY: 800 },
                { x: 1730, y: 800, width: 70, height: 50, target: 'boss_arena', spawnX: 100, spawnY: 700 },
            ],
            boss: null,
            background: this.createBackground('green'),
        };
    }

    createBossArena() {
        return {
            name: 'boss_arena',
            width: 1400,
            height: 900,
            platforms: [
                new Platform(0, 800, 1400, 50, 'stone'),
                new Platform(150, 680, 120, 25),
                new Platform(350, 580, 120, 25),
                new Platform(550, 500, 150, 25),
                new Platform(800, 500, 150, 25),
                new Platform(1000, 580, 120, 25),
                new Platform(1200, 680, 120, 25),
                new Platform(650, 400, 100, 25),
            ],
            walls: [
                new Wall(0, 0, 30, 900),
                new Wall(1370, 0, 30, 900),
            ],
            enemies: [],
            collectibles: [
                new Collectible(675, 350, 'essence', 100),
            ],
            benches: [
                new Bench(600, 750, 'boss_arena'),
            ],
            abilityPickups: [
                new AbilityPickup(680, 350, 'spell'),
            ],
            exits: [
                { x: 0, y: 750, width: 70, height: 50, target: 'green_path', spawnX: 1650, spawnY: 800 },
            ],
            boss: { type: 'beeQueen', x: 700, y: 700 },
            background: this.createBackground('boss'),
        };
    }

    createBackground(type) {
        const elements = [];
        
        for (let i = 0; i < 20; i++) {
            elements.push({
                type: 'particle',
                x: Math.random() * 2000,
                y: Math.random() * 1000,
                size: 2 + Math.random() * 3,
                speed: 0.2 + Math.random() * 0.3,
                phase: Math.random() * Math.PI * 2,
            });
        }
        
        for (let i = 0; i < 15; i++) {
            elements.push({
                type: 'vine',
                x: Math.random() * 2000,
                y: 0,
                length: 100 + Math.random() * 200,
                curve: (Math.random() - 0.5) * 50,
            });
        }
        
        return elements;
    }

    loadScene(sceneName) {
        if (this.scenes[sceneName]) {
            this.currentScene = this.scenes[sceneName];
            return true;
        }
        return false;
    }

    getScene() {
        return this.currentScene;
    }

    updateCamera(playerX, playerY) {
        const scene = this.currentScene;
        if (!scene) return;
        
        const targetX = playerX - this.canvasWidth / 2;
        const targetY = playerY - this.canvasHeight / 2;
        
        this.camera.x += (targetX - this.camera.x) * 0.08;
        this.camera.y += (targetY - this.camera.y) * 0.08;
        
        this.camera.x = Math.max(0, Math.min(this.camera.x, scene.width - this.canvasWidth));
        this.camera.y = Math.max(0, Math.min(this.camera.y, scene.height - this.canvasHeight));
    }

    getCamera() {
        return this.camera;
    }

    checkExit(player) {
        const scene = this.currentScene;
        if (!scene) return null;
        
        for (const exit of scene.exits) {
            if (player.x < exit.x + exit.width &&
                player.x + player.width > exit.x &&
                player.y < exit.y + exit.height &&
                player.y + player.height > exit.y) {
                return exit;
            }
        }
        return null;
    }
}