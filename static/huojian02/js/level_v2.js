import { CONFIG, FLOOR_THEMES } from './config_v2.js';

export class Fragment {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.collected = false;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.sparkles = [];
    }

    update() {
        this.bobOffset += 0.05;
        
        if (Math.random() < 0.2) {
            this.sparkles.push({
                x: this.x + this.width / 2 + (Math.random() - 0.5) * 20,
                y: this.y + this.height / 2 + (Math.random() - 0.5) * 20,
                life: 1,
                size: Math.random() * 3 + 1,
            });
        }
        
        this.sparkles = this.sparkles.filter(s => {
            s.life -= 0.02;
            s.y -= 0.5;
            return s.life > 0;
        });
    }

    checkCollision(player) {
        const bounds = player.getBounds();
        return this.x < bounds.x + bounds.width &&
               this.x + this.width > bounds.x &&
               this.y < bounds.y + bounds.height &&
               this.y + this.height > bounds.y;
    }

    getBounds() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }

    serialize() {
        return { x: this.x, y: this.y, collected: this.collected };
    }

    static deserialize(data) {
        const fragment = new Fragment(data.x, data.y);
        fragment.collected = data.collected;
        return fragment;
    }
}

export class Portal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 80;
        this.active = false;
        this.animFrame = 0;
        this.particles = [];
    }

    update() {
        this.animFrame += 0.05;
        
        if (Math.random() < 0.3) {
            this.particles.push({
                x: this.x + Math.random() * this.width,
                y: this.y + this.height,
                vy: -Math.random() * 2 - 1,
                vx: (Math.random() - 0.5) * 2,
                life: 1,
                size: Math.random() * 4 + 2,
            });
        }
        
        this.particles = this.particles.filter(p => {
            p.life -= 0.02;
            p.y += p.vy;
            p.x += p.vx;
            return p.life > 0;
        });
    }

    checkCollision(player) {
        if (!this.active) return false;
        const bounds = player.getBounds();
        return this.x < bounds.x + bounds.width &&
               this.x + this.width > bounds.x &&
               this.y < bounds.y + bounds.height &&
               this.y + this.height > bounds.y;
    }

    serialize() {
        return { x: this.x, y: this.y, active: this.active };
    }

    static deserialize(data) {
        const portal = new Portal(data.x, data.y);
        portal.active = data.active;
        return portal;
    }
}

export class Level {
    constructor(floorNumber) {
        this.floorNumber = floorNumber;
        this.theme = FLOOR_THEMES[Math.min(floorNumber - 1, FLOOR_THEMES.length - 1)];
        this.platforms = [];
        this.fragments = [];
        this.monsters = [];
        this.portal = null;
        this.totalFragments = 0;
        this.collectedFragments = 0;
    }

    generate(width, height, MonsterClass) {
        this.platforms = [];
        this.fragments = [];
        this.monsters = [];
        
        const groundY = height - 60;
        
        this.platforms.push({ x: 0, y: groundY, width: width, height: 60, isGround: true });
        
        const platformWidth = 100;
        const platformCount = 5 + Math.min(this.floorNumber, 2);
        const verticalGap = 90;
        const horizontalPositions = [80, 280, 480, 680];
        
        let currentY = groundY - verticalGap;
        let lastX = 100;
        
        for (let i = 0; i < platformCount; i++) {
            const direction = i % 2 === 0 ? 1 : -1;
            let platformX;
            
            if (i === 0) {
                platformX = horizontalPositions[0];
            } else if (i === 1) {
                platformX = horizontalPositions[2];
            } else if (i % 3 === 0) {
                platformX = horizontalPositions[1];
            } else if (i % 3 === 1) {
                platformX = horizontalPositions[3];
            } else {
                platformX = horizontalPositions[0];
            }
            
            if (platformX + platformWidth > width - 20) {
                platformX = width - platformWidth - 30;
            }
            
            const platformY = currentY;
            
            if (platformY < 120) break;
            
            const platform = { 
                x: platformX, 
                y: platformY, 
                width: platformWidth, 
                height: 20 
            };
            this.platforms.push(platform);
            
            if (Math.random() < 0.8) {
                const frag = new Fragment(
                    platformX + platformWidth / 2 - 12,
                    platformY - 40
                );
                this.fragments.push(frag);
            }
            
            if (i >= 2 && Math.random() < 0.4) {
                const monsterType = Math.random() < 0.7 ? 'patrol' : 'chaser';
                const monster = new MonsterClass(
                    monsterType,
                    platformX + platformWidth / 2 - 20,
                    platformY - 50,
                    platform
                );
                this.monsters.push(monster);
            }
            
            lastX = platformX;
            currentY -= verticalGap;
        }
        
        while (this.fragments.length < CONFIG.FRAGMENTS_PER_FLOOR && this.platforms.length > 1) {
            const idx = Math.floor(Math.random() * (this.platforms.length - 1)) + 1;
            const randomPlatform = this.platforms[idx];
            const hasFragment = this.fragments.some(f => 
                Math.abs(f.x - (randomPlatform.x + randomPlatform.width / 2 - 12)) < 30 &&
                Math.abs(f.y - (randomPlatform.y - 40)) < 30
            );
            
            if (!hasFragment) {
                const frag = new Fragment(
                    randomPlatform.x + randomPlatform.width / 2 - 12,
                    randomPlatform.y - 40
                );
                this.fragments.push(frag);
            }
        }
        
        this.totalFragments = this.fragments.length;
        this.collectedFragments = 0;
        
        const highestPlatform = this.platforms.reduce((highest, p) => 
            p.y < highest.y ? p : highest, this.platforms[0]);
        this.portal = new Portal(
            highestPlatform.x + highestPlatform.width / 2 - 30,
            highestPlatform.y - 80
        );
        
        return this;
    }

    update(player) {
        this.fragments.forEach(fragment => {
            if (!fragment.collected) {
                fragment.update();
                if (fragment.checkCollision(player)) {
                    fragment.collected = true;
                    this.collectedFragments++;
                }
            }
        });
        
        if (this.collectedFragments >= this.totalFragments) {
            this.portal.active = true;
        }
        
        this.portal.update();
        
        this.monsters.forEach(monster => {
            monster.update(player, this.platforms);
        });
        
        this.monsters = this.monsters.filter(m => m.health > 0);
    }

    getPlayerStart() {
        return { x: 100, y: this.platforms[0].y - 50 };
    }

    serialize() {
        return {
            floorNumber: this.floorNumber,
            platforms: this.platforms,
            fragments: this.fragments.map(f => f.serialize()),
            monsters: this.monsters.map(m => m.serialize()),
            portal: this.portal.serialize(),
            totalFragments: this.totalFragments,
            collectedFragments: this.collectedFragments,
        };
    }

    static deserialize(data, MonsterClass) {
        const level = new Level(data.floorNumber);
        level.platforms = data.platforms;
        level.fragments = data.fragments.map(f => Fragment.deserialize(f));
        level.monsters = data.monsters.map((m, i) => {
            const platform = level.platforms.find(p => 
                m.x >= p.x && m.x <= p.x + p.width &&
                Math.abs(m.y + 50 - p.y) < 10
            ) || null;
            return MonsterClass.deserialize(m, platform);
        });
        level.portal = Portal.deserialize(data.portal);
        level.totalFragments = data.totalFragments;
        level.collectedFragments = data.collectedFragments;
        return level;
    }
}
