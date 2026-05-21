class Track {
    constructor(theme = 'countryside') {
        this.length = CONFIG.GAME.TRACK_LENGTH;
        this.lanes = CONFIG.GAME.LANES;
        this.laneWidth = CONFIG.GAME.LANE_WIDTH;
        this.theme = theme;
        
        this.decorations = this.generateDecorations();
        this.leaves = this.generateLeaves();
    }

    generateDecorations() {
        const decorations = [];
        const colors = ['#FF69B4', '#FFD700', '#FF6347', '#9370DB', '#FF69B4', '#DDA0DD'];
        
        for (let i = 0; i < 50; i++) {
            const deco = {
                type: Utils.randomChoice(['flower', 'tree', 'rock', 'bush']),
                side: Math.random() > 0.5 ? 'left' : 'right',
                distance: Utils.random(0, this.length),
                offset: Utils.random(200, 400),
                scale: Utils.random(0.7, 1.2)
            };
            if (deco.type === 'flower') {
                deco.color = Utils.randomChoice(colors);
            }
            decorations.push(deco);
        }
        return decorations.sort((a, b) => a.distance - b.distance);
    }

    generateLeaves() {
        const leaves = [];
        for (let i = 0; i < 20; i++) {
            const side = Math.random() > 0.5 ? 'left' : 'right';
            leaves.push({
                x: side === 'left' ? Utils.random(-200, -50) : Utils.random(450, 600),
                y: Utils.random(-50, 400),
                rotation: Utils.random(0, Math.PI * 2),
                speed: Utils.random(0.3, 0.8),
                rotationSpeed: Utils.random(-0.02, 0.02),
                size: Utils.random(8, 15),
                side: side
            });
        }
        return leaves;
    }

    update(deltaTime) {
        for (const leaf of this.leaves) {
            leaf.x -= leaf.speed;
            leaf.y += Math.sin(leaf.x * 0.01) * 0.3;
            leaf.rotation += leaf.rotationSpeed;
            
            if (leaf.x < -200) {
                leaf.side = Math.random() > 0.5 ? 'left' : 'right';
                leaf.x = leaf.side === 'left' ? Utils.random(-100, -50) : Utils.random(450, 600);
                leaf.y = Utils.random(-50, 400);
            }
        }
    }

    getFinishLinePosition() {
        return this.length - 50;
    }

    getState() {
        return {
            decorations: this.decorations,
            length: this.length,
            theme: this.theme
        };
    }

    loadState(state) {
        this.length = state.length || CONFIG.GAME.TRACK_LENGTH;
        this.decorations = state.decorations || this.decorations;
        this.theme = state.theme || this.theme;
    }
}
