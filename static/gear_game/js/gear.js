const GearType = {
    NORMAL: 'normal',
    COPPER: 'copper',
    GOLD: 'gold',
    RUST: 'rust'
};

const GearColor = {
    RED: 'red',
    BLUE: 'blue',
    GREEN: 'green',
    PURPLE: 'purple',
    ORANGE: 'orange'
};

class Gear {
    constructor(row, col, color, type = GearType.NORMAL) {
        this.row = row;
        this.col = col;
        this.color = color;
        this.type = type;
        this.rustLayers = type === GearType.RUST ? 2 : 0;
        this.id = `gear-${row}-${col}-${Date.now()}-${Math.random()}`;
        this.element = null;
    }

    static getRandomColor() {
        const colors = Object.values(GearColor);
        return colors[Math.floor(Math.random() * colors.length)];
    }

    static getRandomType(level = 1) {
        const rand = Math.random();
        const specialChance = Math.min(0.15 + level * 0.02, 0.35);
        
        if (rand < specialChance) {
            const typeRand = Math.random();
            if (typeRand < 0.4) return GearType.COPPER;
            if (typeRand < 0.7) return GearType.GOLD;
            return GearType.RUST;
        }
        return GearType.NORMAL;
    }

    createElement() {
        const cell = document.createElement('div');
        cell.className = 'gear-cell';
        cell.dataset.row = this.row;
        cell.dataset.col = this.col;
        cell.dataset.id = this.id;

        const gear = document.createElement('div');
        gear.className = `gear gear-${this.color}`;
        
        if (this.type === GearType.COPPER) {
            gear.classList.add('gear-copper');
        } else if (this.type === GearType.GOLD) {
            gear.classList.add('gear-gold');
        } else if (this.type === GearType.RUST) {
            gear.classList.add('gear-rust');
            gear.classList.add(`rust-layer-${this.rustLayers}`);
        }

        const spokes = document.createElement('div');
        spokes.className = 'gear-spokes';
        for (let i = 0; i < 4; i++) {
            const spoke = document.createElement('span');
            spokes.appendChild(spoke);
        }

        gear.appendChild(spokes);
        cell.appendChild(gear);
        this.element = cell;
        
        return cell;
    }

    updatePosition(row, col) {
        this.row = row;
        this.col = col;
        if (this.element) {
            this.element.dataset.row = row;
            this.element.dataset.col = col;
        }
    }

    hitRust() {
        if (this.type === GearType.RUST && this.rustLayers > 0) {
            this.rustLayers--;
            if (this.element) {
                const gearEl = this.element.querySelector('.gear');
                gearEl.classList.remove('rust-layer-1', 'rust-layer-2');
                if (this.rustLayers > 0) {
                    gearEl.classList.add(`rust-layer-${this.rustLayers}`);
                }
            }
            return this.rustLayers;
        }
        return 0;
    }

    isDestroyed() {
        if (this.type === GearType.RUST) {
            return this.rustLayers <= 0;
        }
        return true;
    }

    matches(other) {
        if (!other) return false;
        
        if (this.type === GearType.GOLD || other.type === GearType.GOLD) {
            return true;
        }
        
        if (this.type === GearType.COPPER && other.type === GearType.COPPER) {
            return true;
        }
        
        if (this.type === GearType.COPPER) {
            return this.color === other.color;
        }
        
        if (other.type === GearType.COPPER) {
            return this.color === other.color;
        }
        
        return this.color === other.color;
    }

    getColor() {
        if (this.type === GearType.COPPER) return '#cd7f32';
        if (this.type === GearType.GOLD) return '#ffd700';
        if (this.type === GearType.RUST) return '#8b4513';
        
        const colorMap = {
            [GearColor.RED]: '#e74c3c',
            [GearColor.BLUE]: '#3498db',
            [GearColor.GREEN]: '#2ecc71',
            [GearColor.PURPLE]: '#9b59b6',
            [GearColor.ORANGE]: '#e67e22'
        };
        return colorMap[this.color] || '#fff';
    }

    getScoreValue() {
        const baseScore = 10;
        let multiplier = 1;
        
        if (this.type === GearType.COPPER) multiplier = 2;
        if (this.type === GearType.GOLD) multiplier = 3;
        if (this.type === GearType.RUST) multiplier = 2;
        
        return baseScore * multiplier;
    }
}
