var GameData = (function() {
    var characters = {
        explorer: {
            name: '少年探险家',
            icon: '🧑‍🌾',
            balance: 1.0,
            powerMax: 1.0,
            maxPower: 1.0,
            airControl: 1.0,
            landingTolerance: 1.0,
            color: '#4a90d9',
            hairColor: '#4a3728',
            skinColor: '#FFCC80',
            description: '综合能力均衡，适配各类常规关卡'
        },
        girl: {
            name: '轻盈少女',
            icon: '👧',
            balance: 1.3,
            powerMax: 0.85,
            maxPower: 0.85,
            airControl: 1.5,
            landingTolerance: 1.4,
            color: '#e91e63',
            hairColor: '#8D6E63',
            skinColor: '#FFE0B2',
            description: '摆动操控灵活，窄小桥面落点把控更轻松'
        },
        warrior: {
            name: '健壮勇士',
            icon: '💪',
            balance: 0.7,
            powerMax: 1.4,
            maxPower: 1.4,
            airControl: 0.7,
            landingTolerance: 0.7,
            color: '#ff6b35',
            hairColor: '#212121',
            skinColor: '#FFAB91',
            description: '蓄力爆发强劲，擅长远距离跨跃通行'
        }
    };

    var levels = [
        {
            id: 1,
            name: '入门之桥',
            difficulty: 1,
            platforms: [
                { x: 50, y: 450, width: 120, height: 25, type: 'start' },
                { x: 280, y: 420, width: 100, height: 25, type: 'normal' },
                { x: 490, y: 450, width: 100, height: 25, type: 'normal' },
                { x: 700, y: 420, width: 120, height: 25, type: 'end' }
            ],
            ropes: [
                { x: 200, y: 150, length: 180 },
                { x: 410, y: 180, length: 160 },
                { x: 620, y: 150, length: 180 }
            ],
            obstacles: [
                { type: 'rock', baseX: 340, baseY: 280, radius: 18, range: 25, speed: 0.0015, phase: 0 }
            ],
            wind: { enabled: false, force: 0, direction: 1 },
            deathY: 700
        },
        {
            id: 2,
            name: '高低起伏',
            difficulty: 1,
            platforms: [
                { x: 50, y: 480, width: 120, height: 25, type: 'start' },
                { x: 260, y: 380, width: 90, height: 25, type: 'normal' },
                { x: 440, y: 460, width: 90, height: 25, type: 'normal' },
                { x: 620, y: 350, width: 90, height: 25, type: 'normal' },
                { x: 820, y: 420, width: 120, height: 25, type: 'end' }
            ],
            ropes: [
                { x: 190, y: 120, length: 220 },
                { x: 370, y: 200, length: 160 },
                { x: 550, y: 120, length: 220 },
                { x: 750, y: 180, length: 180 }
            ],
            obstacles: [
                { type: 'rock', baseX: 340, baseY: 280, radius: 20, range: 30, speed: 0.002, phase: 0 },
                { type: 'wood', baseX: 500, baseY: 260, width: 50, height: 18, range: 50, speed: 0.0018, phase: 1 }
            ],
            wind: { enabled: false, force: 0, direction: 1 },
            deathY: 750
        },
        {
            id: 3,
            name: '摇荡进阶',
            difficulty: 2,
            platforms: [
                { x: 30, y: 500, width: 110, height: 25, type: 'start' },
                { x: 220, y: 350, width: 80, height: 25, type: 'normal' },
                { x: 400, y: 480, width: 80, height: 25, type: 'normal' },
                { x: 580, y: 330, width: 80, height: 25, type: 'normal' },
                { x: 770, y: 450, width: 80, height: 25, type: 'normal' },
                { x: 950, y: 380, width: 110, height: 25, type: 'end' }
            ],
            ropes: [
                { x: 155, y: 100, length: 260 },
                { x: 320, y: 200, length: 160 },
                { x: 500, y: 100, length: 260 },
                { x: 680, y: 180, length: 180 },
                { x: 870, y: 150, length: 220 }
            ],
            obstacles: [
                { type: 'wood', baseX: 290, baseY: 230, width: 50, height: 18, range: 60, speed: 0.0025, phase: 0 },
                { type: 'rock', baseX: 480, baseY: 300, radius: 18, range: 35, speed: 0.003, phase: 1 },
                { type: 'rock', baseX: 640, baseY: 220, radius: 20, range: 40, speed: 0.0028, phase: 2 }
            ],
            wind: { enabled: false, force: 0, direction: 1 },
            deathY: 750
        },
        {
            id: 4,
            name: '风林险境',
            difficulty: 2,
            platforms: [
                { x: 20, y: 450, width: 100, height: 25, type: 'start' },
                { x: 200, y: 320, width: 70, height: 25, type: 'normal' },
                { x: 360, y: 450, width: 70, height: 25, type: 'normal' },
                { x: 520, y: 300, width: 70, height: 25, type: 'normal' },
                { x: 680, y: 420, width: 70, height: 25, type: 'normal' },
                { x: 840, y: 320, width: 70, height: 25, type: 'normal' },
                { x: 1000, y: 400, width: 100, height: 25, type: 'end' }
            ],
            ropes: [
                { x: 140, y: 80, length: 280 },
                { x: 295, y: 180, length: 200 },
                { x: 455, y: 80, length: 280 },
                { x: 615, y: 180, length: 200 },
                { x: 775, y: 80, length: 260 },
                { x: 935, y: 160, length: 200 }
            ],
            obstacles: [
                { type: 'rock', baseX: 250, baseY: 200, radius: 18, range: 40, speed: 0.0035, phase: 0 },
                { type: 'wood', baseX: 420, baseY: 280, width: 55, height: 18, range: 50, speed: 0.003, phase: 1 },
                { type: 'rock', baseX: 590, baseY: 180, radius: 18, range: 40, speed: 0.004, phase: 2 }
            ],
            wind: { enabled: true, force: 0.08, direction: 1 },
            deathY: 700
        },
        {
            id: 5,
            name: '断口险渡',
            difficulty: 3,
            platforms: [
                { x: 20, y: 480, width: 90, height: 25, type: 'start' },
                { x: 180, y: 330, width: 60, height: 25, type: 'normal' },
                { x: 340, y: 450, width: 60, height: 25, type: 'opening', phase: 0, period: 3.5, openDuration: 2 },
                { x: 500, y: 300, width: 60, height: 25, type: 'normal' },
                { x: 660, y: 450, width: 60, height: 25, type: 'opening', phase: 1.5, period: 3, openDuration: 1.8 },
                { x: 820, y: 320, width: 60, height: 25, type: 'normal' },
                { x: 980, y: 420, width: 90, height: 25, type: 'end' }
            ],
            ropes: [
                { x: 125, y: 70, length: 300 },
                { x: 275, y: 130, length: 240 },
                { x: 435, y: 70, length: 300 },
                { x: 595, y: 130, length: 240 },
                { x: 755, y: 70, length: 280 },
                { x: 915, y: 150, length: 220 }
            ],
            obstacles: [
                { type: 'wood', baseX: 230, baseY: 180, width: 50, height: 18, range: 80, speed: 0.003, phase: 0 },
                { type: 'rock', baseX: 400, baseY: 250, radius: 20, range: 50, speed: 0.004, phase: 1 },
                { type: 'wood', baseX: 570, baseY: 180, width: 50, height: 18, range: 80, speed: 0.0035, phase: 2 },
                { type: 'rock', baseX: 730, baseY: 250, radius: 20, range: 50, speed: 0.0045, phase: 3 }
            ],
            wind: { enabled: true, force: 0.1, direction: -1 },
            deathY: 750
        },
        {
            id: 6,
            name: '高空挑战',
            difficulty: 3,
            platforms: [
                { x: 10, y: 400, width: 80, height: 25, type: 'start' },
                { x: 160, y: 260, width: 55, height: 25, type: 'normal' },
                { x: 300, y: 380, width: 55, height: 25, type: 'normal' },
                { x: 440, y: 250, width: 55, height: 25, type: 'opening', phase: 0, period: 2.5, openDuration: 1.5 },
                { x: 580, y: 380, width: 55, height: 25, type: 'normal' },
                { x: 720, y: 250, width: 55, height: 25, type: 'normal' },
                { x: 860, y: 350, width: 55, height: 25, type: 'normal' },
                { x: 1000, y: 300, width: 80, height: 25, type: 'end' }
            ],
            ropes: [
                { x: 105, y: 50, length: 320 },
                { x: 240, y: 100, length: 260 },
                { x: 385, y: 50, length: 320 },
                { x: 525, y: 100, length: 260 },
                { x: 665, y: 50, length: 300 },
                { x: 805, y: 100, length: 240 },
                { x: 945, y: 80, length: 260 }
            ],
            obstacles: [
                { type: 'rock', baseX: 210, baseY: 150, radius: 18, range: 60, speed: 0.004, phase: 0 },
                { type: 'wood', baseX: 360, baseY: 200, width: 55, height: 18, range: 70, speed: 0.0035, phase: 1 },
                { type: 'rock', baseX: 510, baseY: 150, radius: 18, range: 60, speed: 0.0045, phase: 2 },
                { type: 'wood', baseX: 650, baseY: 200, width: 55, height: 18, range: 70, speed: 0.004, phase: 3 },
                { type: 'rock', baseX: 790, baseY: 150, radius: 18, range: 60, speed: 0.005, phase: 4 }
            ],
            wind: { enabled: true, force: 0.12, direction: 1 },
            deathY: 700
        },
        {
            id: 7,
            name: '极致考验',
            difficulty: 3,
            platforms: [
                { x: 10, y: 380, width: 70, height: 25, type: 'start' },
                { x: 150, y: 240, width: 50, height: 25, type: 'normal' },
                { x: 290, y: 370, width: 50, height: 25, type: 'opening', phase: 0, period: 2, openDuration: 1.2 },
                { x: 430, y: 230, width: 50, height: 25, type: 'normal' },
                { x: 570, y: 370, width: 50, height: 25, type: 'opening', phase: 1, period: 2, openDuration: 1.2 },
                { x: 710, y: 230, width: 50, height: 25, type: 'normal' },
                { x: 850, y: 330, width: 50, height: 25, type: 'normal' },
                { x: 990, y: 280, width: 70, height: 25, type: 'end' }
            ],
            ropes: [
                { x: 95, y: 30, length: 340 },
                { x: 230, y: 80, length: 280 },
                { x: 370, y: 30, length: 340 },
                { x: 510, y: 80, length: 280 },
                { x: 650, y: 30, length: 320 },
                { x: 790, y: 80, length: 260 },
                { x: 930, y: 50, length: 280 }
            ],
            obstacles: [
                { type: 'wood', baseX: 195, baseY: 140, width: 50, height: 18, range: 90, speed: 0.004, phase: 0 },
                { type: 'rock', baseX: 340, baseY: 190, radius: 20, range: 60, speed: 0.005, phase: 1 },
                { type: 'wood', baseX: 490, baseY: 140, width: 50, height: 18, range: 90, speed: 0.0045, phase: 2 },
                { type: 'rock', baseX: 630, baseY: 190, radius: 20, range: 60, speed: 0.0055, phase: 3 },
                { type: 'wood', baseX: 770, baseY: 140, width: 50, height: 18, range: 90, speed: 0.005, phase: 4 }
            ],
            wind: { enabled: true, force: 0.15, direction: -1 },
            deathY: 700
        },
        {
            id: 8,
            name: '终极试炼',
            difficulty: 3,
            platforms: [
                { x: 10, y: 360, width: 60, height: 25, type: 'start' },
                { x: 130, y: 220, width: 45, height: 25, type: 'normal' },
                { x: 250, y: 350, width: 45, height: 25, type: 'opening', phase: 0, period: 1.7, openDuration: 1 },
                { x: 370, y: 210, width: 45, height: 25, type: 'normal' },
                { x: 490, y: 350, width: 45, height: 25, type: 'opening', phase: 0.8, period: 1.7, openDuration: 1 },
                { x: 610, y: 210, width: 45, height: 25, type: 'normal' },
                { x: 730, y: 330, width: 45, height: 25, type: 'opening', phase: 1.6, period: 1.7, openDuration: 1 },
                { x: 850, y: 220, width: 45, height: 25, type: 'normal' },
                { x: 970, y: 300, width: 60, height: 25, type: 'end' }
            ],
            ropes: [
                { x: 85, y: 20, length: 360 },
                { x: 205, y: 60, length: 300 },
                { x: 335, y: 20, length: 360 },
                { x: 455, y: 60, length: 300 },
                { x: 575, y: 20, length: 340 },
                { x: 695, y: 60, length: 280 },
                { x: 815, y: 30, length: 300 },
                { x: 935, y: 60, length: 240 }
            ],
            obstacles: [
                { type: 'rock', baseX: 175, baseY: 120, radius: 22, range: 70, speed: 0.005, phase: 0 },
                { type: 'wood', baseX: 300, baseY: 170, width: 55, height: 18, range: 100, speed: 0.0045, phase: 1 },
                { type: 'rock', baseX: 430, baseY: 120, radius: 22, range: 70, speed: 0.0055, phase: 2 },
                { type: 'wood', baseX: 555, baseY: 170, width: 55, height: 18, range: 100, speed: 0.005, phase: 3 },
                { type: 'rock', baseX: 675, baseY: 120, radius: 22, range: 70, speed: 0.006, phase: 4 },
                { type: 'wood', baseX: 795, baseY: 170, width: 55, height: 18, range: 100, speed: 0.0055, phase: 5 }
            ],
            wind: { enabled: true, force: 0.18, direction: 1 },
            deathY: 700
        }
    ];

    return {
        characters: characters,
        levels: levels,
        getCharacters: function() {
            return characters;
        },
        getCharacter: function(type) {
            return characters[type] || characters.explorer;
        },
        getLevels: function() {
            return levels;
        },
        getLevel: function(index) {
            return levels[Math.min(index, levels.length - 1)];
        },
        getTotalLevels: function() {
            return levels.length;
        }
    };
})();
