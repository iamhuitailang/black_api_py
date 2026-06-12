const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;

const STORAGE_KEY = 'star_shooter_save';

const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver',
    BOSS_WARNING: 'bossWarning'
};

const WeaponType = {
    SCATTER: 'scatter',
    LASER: 'laser',
    MISSILE: 'missile'
};

const EnemyType = {
    SCOUT: 'scout',
    FIGHTER: 'fighter',
    HEAVY: 'heavy',
    KAMIKAZE: 'kamikaze',
    BOSS: 'boss'
};

const PowerUpType = {
    SHIELD: 'shield',
    SPEED: 'speed',
    WEAPON: 'weapon'
};

let audioContext = null;

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

const SoundEffects = {
    playScatterShot() {
        if (!audioContext) return;
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.value = 1200;
                osc.type = 'square';
                gain.gain.setValueAtTime(0.3, audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.03);
                osc.start(audioContext.currentTime);
                osc.stop(audioContext.currentTime + 0.03);
            }, i * 50);
        }
    },

    playLaser(active) {
        if (!audioContext) return;
        if (!this.laserOsc && active) {
            this.laserOsc = audioContext.createOscillator();
            this.laserGain = audioContext.createGain();
            this.laserOsc.connect(this.laserGain);
            this.laserGain.connect(audioContext.destination);
            this.laserOsc.frequency.value = 1000;
            this.laserOsc.type = 'sawtooth';
            this.laserGain.gain.setValueAtTime(0, audioContext.currentTime);
            this.laserGain.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.1);
            this.laserOsc.start();
        } else if (this.laserOsc && !active) {
            this.laserGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
            setTimeout(() => {
                if (this.laserOsc) {
                    this.laserOsc.stop();
                    this.laserOsc = null;
                }
            }, 100);
        }
    },

    playMissileLaunch() {
        if (!audioContext) return;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.setValueAtTime(400, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        osc.start();
        osc.stop(audioContext.currentTime + 0.1);
    },

    playMissileHit() {
        if (!audioContext) return;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const noise = audioContext.createBufferSource();
        const noiseGain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.value = 200;
        osc.type = 'square';
        gain.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        osc.start();
        osc.stop(audioContext.currentTime + 0.15);
        
        const bufferSize = audioContext.sampleRate * 0.15;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        noise.buffer = buffer;
        noise.connect(noiseGain);
        noiseGain.connect(audioContext.destination);
        noiseGain.gain.setValueAtTime(0.2, audioContext.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        noise.start();
        noise.stop(audioContext.currentTime + 0.15);
    },

    playExplosion(size) {
        if (!audioContext) return;
        const freqs = { small: 100, medium: 80, large: 60, boss: 40 };
        const freq = freqs[size] || 80;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.4, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        osc.start();
        osc.stop(audioContext.currentTime + 0.2);
    },

    playPowerUp() {
        if (!audioContext) return;
        const notes = [440, 554, 659, 880];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.3, audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                osc.start();
                osc.stop(audioContext.currentTime + 0.15);
            }, i * 50);
        });
    },

    playBossWarning() {
        if (!audioContext) return;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.value = 80;
        osc.type = 'sine';
        
        const duration = 2;
        const pulseTime = 0.15;
        for (let t = 0; t < duration; t += pulseTime * 2) {
            gain.gain.setValueAtTime(0.4, audioContext.currentTime + t);
            gain.gain.setValueAtTime(0, audioContext.currentTime + t + pulseTime);
        }
        gain.gain.setValueAtTime(0, audioContext.currentTime + duration);
        
        osc.start();
        osc.stop(audioContext.currentTime + duration);
    }
};

class Starfield {
    constructor() {
        this.stars = [];
        this.initStars();
    }

    initStars() {
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * GAME_WIDTH,
                y: Math.random() * GAME_HEIGHT,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 2 + 1
            });
        }
    }

    update() {
        this.stars.forEach(star => {
            star.y += star.speed;
            if (star.y > GAME_HEIGHT) {
                star.y = 0;
                star.x = Math.random() * GAME_WIDTH;
            }
        });
    }

    draw(ctx) {
        this.stars.forEach(star => {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + star.size * 0.3})`;
            ctx.fillRect(star.x, star.y, star.size, star.size);
        });
    }
}

class Player {
    constructor() {
        this.width = 40;
        this.height = 50;
        this.x = GAME_WIDTH / 2 - this.width / 2;
        this.y = GAME_HEIGHT - this.height - 20;
        this.speed = 5;
        this.maxHp = 100;
        this.hp = this.maxHp;
        this.currentWeapon = WeaponType.SCATTER;
        this.weapons = {
            [WeaponType.SCATTER]: {
                lastFire: 0,
                fireRate: 300,
                damage: 8,
                charging: false,
                chargeTime: 0,
                active: false,
                activeTime: 0
            },
            [WeaponType.LASER]: {
                lastFire: 0,
                fireRate: 100,
                damage: 15,
                chargeTime: 0,
                chargeNeeded: 2000,
                active: false,
                activeTime: 0,
                activeDuration: 3000
            },
            [WeaponType.MISSILE]: {
                lastFire: 0,
                fireRate: 1500,
                damage: 30,
                speed: 4
            }
        };
        this.buffs = {
            shield: { active: false, duration: 0, value: 50 },
            speed: { active: false, duration: 0, multiplier: 1.5 },
            weapon: { active: false, duration: 0, multiplier: 2 }
        };
        this.invincibleTime = 0;
        this.screenShake = 0;
    }

    switchWeapon() {
        const weapons = [WeaponType.SCATTER, WeaponType.LASER, WeaponType.MISSILE];
        const currentIndex = weapons.indexOf(this.currentWeapon);
        this.currentWeapon = weapons[(currentIndex + 1) % weapons.length];
        SoundEffects.playLaser(false);
        this.weapons[WeaponType.LASER].active = false;
        this.weapons[WeaponType.LASER].chargeTime = 0;
        this.updateWeaponUI();
    }

    updateWeaponUI() {
        const weaponNames = {
            [WeaponType.SCATTER]: '散射',
            [WeaponType.LASER]: '激光',
            [WeaponType.MISSILE]: '导弹'
        };
        document.getElementById('weapon').textContent = weaponNames[this.currentWeapon];
        
        document.querySelectorAll('.skin-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.weapon === this.currentWeapon) {
                item.classList.add('active');
            }
        });
    }

    update(keys, bullets, enemies, deltaTime, game) {
        let speed = this.speed;
        if (this.buffs.speed.active) {
            speed *= this.buffs.speed.multiplier;
        }

        if (keys.ArrowLeft || keys.a) {
            this.x -= speed;
        }
        if (keys.ArrowRight || keys.d) {
            this.x += speed;
        }
        if (keys.ArrowUp || keys.w) {
            this.y -= speed;
        }
        if (keys.ArrowDown || keys.s) {
            this.y += speed;
        }

        this.x = Math.max(0, Math.min(GAME_WIDTH - this.width, this.x));
        this.y = Math.max(GAME_HEIGHT * 0.3, Math.min(GAME_HEIGHT - this.height - 20, this.y));

        const weapon = this.weapons[this.currentWeapon];
        
        if (this.currentWeapon === WeaponType.LASER) {
            if (!weapon.active) {
                weapon.chargeTime += deltaTime;
                if (weapon.chargeTime >= weapon.chargeNeeded) {
                    weapon.active = true;
                    weapon.activeTime = weapon.activeDuration;
                    weapon.chargeTime = 0;
                    SoundEffects.playLaser(true);
                }
            } else {
                weapon.activeTime -= deltaTime;
                if (weapon.activeTime <= 0) {
                    weapon.active = false;
                    SoundEffects.playLaser(false);
                }
            }
        }

        const now = Date.now();
        if (this.currentWeapon !== WeaponType.LASER && now - weapon.lastFire >= weapon.fireRate) {
            this.fire(bullets, enemies, game);
            weapon.lastFire = now;
        } else if (this.currentWeapon === WeaponType.LASER && weapon.active) {
            this.fire(bullets, enemies, game);
        }

        Object.keys(this.buffs).forEach(key => {
            if (this.buffs[key].active) {
                this.buffs[key].duration -= deltaTime;
                if (this.buffs[key].duration <= 0) {
                    this.buffs[key].active = false;
                }
            }
        });

        if (this.invincibleTime > 0) {
            this.invincibleTime -= deltaTime;
        }

        if (this.screenShake > 0) {
            this.screenShake -= deltaTime;
        }

        this.updateBuffUI();
    }

    fire(bullets, enemies, game) {
        const weapon = this.weapons[this.currentWeapon];
        let damage = weapon.damage;
        if (this.buffs.weapon.active) {
            damage *= this.buffs.weapon.multiplier;
        }

        const weaponSkins = game.skins || {};

        if (this.currentWeapon === WeaponType.SCATTER) {
            SoundEffects.playScatterShot();
            const colors = weaponSkins.scatter === 'red' 
                ? ['#ff4444', '#ff6644', '#ff2222']
                : ['#ffff00', '#ffcc00', '#ffaa00'];
            const angles = [-15, 0, 15];
            angles.forEach((angle, i) => {
                const rad = angle * Math.PI / 180;
                bullets.push(new Bullet(
                    this.x + this.width / 2 - 3,
                    this.y,
                    Math.sin(rad) * 8,
                    -Math.cos(rad) * 10,
                    damage,
                    'player',
                    'scatter',
                    colors[i]
                ));
            });
        } else if (this.currentWeapon === WeaponType.LASER) {
            const color = weaponSkins.laser === 'purple' ? '#aa44ff' : '#88ddff';
            bullets.push(new LaserBeam(
                this.x + this.width / 2 - 4,
                0,
                8,
                this.y,
                damage,
                color
            ));
        } else if (this.currentWeapon === WeaponType.MISSILE) {
            SoundEffects.playMissileLaunch();
            const color = weaponSkins.missile === 'gold' ? '#ffdd00' : '#ff6600';
            bullets.push(new Missile(
                this.x + this.width / 2 - 5,
                this.y - 10,
                damage,
                weapon.speed,
                enemies,
                color
            ));
        }
    }

    takeDamage(amount) {
        if (this.invincibleTime > 0) return false;
        
        if (this.buffs.shield.active) {
            this.buffs.shield.value -= amount;
            if (this.buffs.shield.value <= 0) {
                this.buffs.shield.active = false;
            }
            return false;
        }

        this.hp -= amount;
        this.invincibleTime = 1000;
        
        document.getElementById('hpFill').style.width = Math.max(0, (this.hp / this.maxHp) * 100) + '%';
        
        return this.hp <= 0;
    }

    applyBuff(type) {
        const buff = this.buffs[type];
        buff.active = true;
        if (type === 'shield') {
            buff.duration = 10000;
            buff.value = 50;
        } else if (type === 'speed') {
            buff.duration = 8000;
        } else if (type === 'weapon') {
            buff.duration = 15000;
        }
        SoundEffects.playPowerUp();
    }

    updateBuffUI() {
        const buffsDiv = document.getElementById('buffs');
        buffsDiv.innerHTML = '';
        
        const buffIcons = {
            shield: '🛡️',
            speed: '⚡',
            weapon: '🔥'
        };

        Object.keys(this.buffs).forEach(key => {
            if (this.buffs[key].active) {
                const div = document.createElement('div');
                div.className = `buff-icon ${key}`;
                div.innerHTML = `${buffIcons[key]}<span class="buff-timer">${Math.ceil(this.buffs[key].duration / 1000)}</span>`;
                buffsDiv.appendChild(div);
            }
        });
    }

    draw(ctx) {
        ctx.save();
        
        if (this.invincibleTime > 0 && Math.floor(this.invincibleTime / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        if (this.buffs.shield.active) {
            const gradient = ctx.createRadialGradient(
                this.x + this.width / 2, this.y + this.height / 2, 0,
                this.x + this.width / 2, this.y + this.height / 2, this.width
            );
            gradient.addColorStop(0, 'rgba(100, 150, 255, 0.1)');
            gradient.addColorStop(0.7, 'rgba(100, 150, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(100, 150, 255, 0.6)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width * 0.8, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#4488ff';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x + this.width * 0.7, this.y + this.height * 0.7);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height * 0.9);
        ctx.lineTo(this.x + this.width * 0.3, this.y + this.height * 0.7);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#88ccff';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height * 0.4, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        const flameColor = this.buffs.speed.active ? '#44ff44' : '#ff8800';
        ctx.fillStyle = flameColor;
        const flameHeight = 15 + Math.random() * 10;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.3, this.y + this.height);
        ctx.lineTo(this.x + this.width * 0.5, this.y + this.height + flameHeight);
        ctx.lineTo(this.x + this.width * 0.7, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        if (this.currentWeapon === WeaponType.LASER) {
            const weapon = this.weapons[WeaponType.LASER];
            if (!weapon.active) {
                const chargePercent = weapon.chargeTime / weapon.chargeNeeded;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(this.x, this.y - 15, this.width, 8);
                ctx.fillStyle = chargePercent >= 1 ? '#44ff44' : '#4488ff';
                ctx.fillRect(this.x, this.y - 15, this.width * chargePercent, 8);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.strokeRect(this.x, this.y - 15, this.width, 8);
            }
        }

        ctx.restore();
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

class Bullet {
    constructor(x, y, vx, vy, damage, owner, type, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.owner = owner;
        this.type = type;
        this.color = color;
        this.width = 6;
        this.height = 12;
        this.trail = [];
        this.active = true;
    }

    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 8) {
            this.trail.shift();
        }

        this.x += this.vx;
        this.y += this.vy;

        if (this.y < -20 || this.y > GAME_HEIGHT + 20 ||
            this.x < -20 || this.x > GAME_WIDTH + 20) {
            this.active = false;
        }
    }

    draw(ctx) {
        this.trail.forEach((pos, i) => {
            const alpha = i / this.trail.length * 0.5;
            let r, g, b;
            if (this.color.startsWith('#')) {
                r = parseInt(this.color.slice(1, 3), 16);
                g = parseInt(this.color.slice(3, 5), 16);
                b = parseInt(this.color.slice(5, 7), 16);
            } else if (this.color.startsWith('rgb')) {
                const match = this.color.match(/\d+/g);
                r = parseInt(match[0]);
                g = parseInt(match[1]);
                b = parseInt(match[2]);
            } else {
                r = 255; g = 255; b = 255;
            }
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            const size = (i / this.trail.length) * this.width;
            ctx.fillRect(pos.x + (this.width - size) / 2, pos.y, size, size);
        });

        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

class LaserBeam {
    constructor(x, y, width, height, damage, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.damage = damage;
        this.color = color;
        this.owner = 'player';
        this.type = 'laser';
        this.active = true;
        this.timer = 0;
    }

    update(player) {
        this.x = player.x + player.width / 2 - this.width / 2;
        this.timer++;
        if (this.timer > 2) {
            this.active = false;
        }
    }

    draw(ctx) {
        const gradient = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(0.3, this.color);
        gradient.addColorStop(0.5, '#ffffff');
        gradient.addColorStop(0.7, this.color);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');

        ctx.fillStyle = gradient;
        ctx.fillRect(this.x - 2, this.y, this.width + 4, this.height);
        
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }

    getBounds() {
        return {
            x: this.x - 2,
            y: this.y,
            width: this.width + 4,
            height: this.height
        };
    }
}

class Missile {
    constructor(x, y, damage, speed, enemies, color) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.speed = speed;
        this.enemies = enemies;
        this.color = color;
        this.owner = 'player';
        this.type = 'missile';
        this.width = 10;
        this.height = 18;
        this.target = null;
        this.angle = -Math.PI / 2;
        this.trail = [];
        this.active = true;
        this.exploding = false;
        this.explosionTimer = 0;
    }

    findTarget() {
        let closest = null;
        let closestDist = Infinity;
        
        this.enemies.forEach(enemy => {
            if (enemy.active && enemy.type !== EnemyType.BOSS) {
                const dx = enemy.x + enemy.width / 2 - this.x;
                const dy = enemy.y + enemy.height / 2 - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < closestDist) {
                    closestDist = dist;
                    closest = enemy;
                }
            }
        });

        const boss = this.enemies.find(e => e.type === EnemyType.BOSS && e.active);
        if (boss) {
            const dx = boss.x + boss.width / 2 - this.x;
            const dy = boss.y + boss.height / 2 - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (!closest || dist < closestDist * 0.5) {
                closest = boss;
            }
        }

        return closest;
    }

    update() {
        if (this.exploding) {
            this.explosionTimer++;
            if (this.explosionTimer > 10) {
                this.active = false;
            }
            return;
        }

        this.trail.push({ x: this.x + this.width / 2, y: this.y + this.height / 2 });
        if (this.trail.length > 12) {
            this.trail.shift();
        }

        if (!this.target || !this.target.active) {
            this.target = this.findTarget();
        }

        if (this.target) {
            const targetX = this.target.x + this.target.width / 2;
            const targetY = this.target.y + this.target.height / 2;
            const desiredAngle = Math.atan2(targetY - this.y, targetX - this.x);
            
            let angleDiff = desiredAngle - this.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            
            this.angle += angleDiff * 0.08;
        }

        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        if (this.y < -50 || this.y > GAME_HEIGHT + 50 ||
            this.x < -50 || this.x > GAME_WIDTH + 50) {
            this.active = false;
        }
    }

    hit() {
        this.exploding = true;
        SoundEffects.playMissileHit();
    }

    draw(ctx) {
        if (this.exploding) {
            const radius = this.explosionTimer * 3;
            const gradient = ctx.createRadialGradient(
                this.x + this.width / 2, this.y + this.height / 2, 0,
                this.x + this.width / 2, this.y + this.height / 2, radius
            );
            gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
            gradient.addColorStop(0.5, 'rgba(255, 150, 50, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, radius, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        this.trail.forEach((pos, i) => {
            const alpha = i / this.trail.length * 0.6;
            const size = (i / this.trail.length) * 8;
            const r = parseInt(this.color.slice(1, 3), 16);
            const g = parseInt(this.color.slice(3, 5), 16);
            const b = parseInt(this.color.slice(5, 7), 16);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.angle + Math.PI / 2);

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(this.width / 2, this.height / 2);
        ctx.lineTo(0, this.height / 3);
        ctx.lineTo(-this.width / 2, this.height / 2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ff4400';
        const flameSize = 5 + Math.random() * 5;
        ctx.beginPath();
        ctx.moveTo(-3, this.height / 2);
        ctx.lineTo(0, this.height / 2 + flameSize);
        ctx.lineTo(3, this.height / 2);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

class Enemy {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.active = true;
        this.shootTimer = 0;
        
        const configs = {
            [EnemyType.SCOUT]: {
                width: 30,
                height: 30,
                hp: 20,
                speed: 3,
                score: 50,
                color: '#44ff44',
                size: 'small'
            },
            [EnemyType.FIGHTER]: {
                width: 40,
                height: 40,
                hp: 40,
                speed: 2,
                score: 100,
                color: '#4488ff',
                shootInterval: 2000,
                size: 'medium'
            },
            [EnemyType.HEAVY]: {
                width: 60,
                height: 55,
                hp: 100,
                speed: 1,
                score: 200,
                color: '#ff4444',
                shootInterval: 3000,
                size: 'large'
            },
            [EnemyType.KAMIKAZE]: {
                width: 28,
                height: 35,
                hp: 15,
                speed: 4,
                score: 80,
                color: '#ff8800',
                size: 'small'
            },
            [EnemyType.BOSS]: {
                width: 180,
                height: 120,
                hp: 800,
                speed: 1,
                score: 1000,
                color: '#aa00aa',
                shootInterval: 1500,
                size: 'boss'
            }
        };

        const config = configs[type];
        Object.assign(this, config);
        this.maxHp = this.hp;

        if (type === EnemyType.BOSS) {
            this.attackMode = 'A';
            this.attackTimer = 0;
            this.attackDuration = 5000;
            this.direction = 1;
        }
    }

    update(player, enemyBullets, deltaTime, game) {
        if (!this.active) return;

        if (this.type === EnemyType.BOSS) {
            this.x += this.speed * this.direction;
            if (this.x <= 20 || this.x >= GAME_WIDTH - this.width - 20) {
                this.direction *= -1;
            }
            if (this.y < 50) {
                this.y += 0.5;
            }

            this.attackTimer += deltaTime;
            if (this.attackTimer >= this.attackDuration) {
                this.attackTimer = 0;
                this.attackMode = this.attackMode === 'A' ? 'B' : 'A';
            }

            this.shootTimer += deltaTime;
            if (this.shootTimer >= this.shootInterval) {
                this.shootTimer = 0;
                this.bossAttack(enemyBullets, player);
            }
        } else {
            this.y += this.speed;

            if (this.type === EnemyType.KAMIKAZE) {
                const dx = player.x + player.width / 2 - (this.x + this.width / 2);
                this.x += Math.sign(dx) * 1.5;
            }

            if (this.shootInterval) {
                this.shootTimer += deltaTime;
                if (this.shootTimer >= this.shootInterval) {
                    this.shootTimer = 0;
                    this.shoot(enemyBullets, player);
                }
            }

            if (this.type === EnemyType.KAMIKAZE) {
                const dx = player.x + player.width / 2 - (this.x + this.width / 2);
                const dy = player.y + player.height / 2 - (this.y + this.height / 2);
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    this.active = false;
                    player.takeDamage(30);
                    game.addExplosion(this.x + this.width / 2, this.y + this.height / 2, 'medium');
                    SoundEffects.playExplosion('medium');
                }
            }
        }

        if (this.y > GAME_HEIGHT + 50) {
            this.active = false;
        }
    }

    shoot(enemyBullets, player) {
        if (this.type === EnemyType.FIGHTER) {
            const dx = player.x + player.width / 2 - (this.x + this.width / 2);
            const dy = player.y + player.height / 2 - (this.y + this.height / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            const speed = 5;
            enemyBullets.push(new Bullet(
                this.x + this.width / 2 - 3,
                this.y + this.height,
                (dx / dist) * speed,
                (dy / dist) * speed,
                10,
                'enemy',
                'normal',
                '#ff4444'
            ));
        } else if (this.type === EnemyType.HEAVY) {
            const angles = [-15, 0, 15];
            angles.forEach(angle => {
                const rad = angle * Math.PI / 180 + Math.PI / 2;
                enemyBullets.push(new Bullet(
                    this.x + this.width / 2 - 3,
                    this.y + this.height,
                    Math.cos(rad) * 4,
                    Math.sin(rad) * 4,
                    15,
                    'enemy',
                    'normal',
                    '#ff0000'
                ));
            });
        }
    }

    bossAttack(enemyBullets, player) {
        if (this.attackMode === 'A') {
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                enemyBullets.push(new Bullet(
                    this.x + this.width / 2 - 4,
                    this.y + this.height / 2,
                    Math.cos(angle) * 3,
                    Math.sin(angle) * 3,
                    20,
                    'enemy',
                    'normal',
                    '#ff00ff'
                ));
            }
        } else {
            for (let i = 0; i < 4; i++) {
                const dx = player.x + player.width / 2 - (this.x + this.width / 2);
                const dy = player.y + player.height / 2 - (this.y + this.height / 2);
                const dist = Math.sqrt(dx * dx + dy * dy);
                const spread = (i - 1.5) * 0.2;
                const angle = Math.atan2(dy, dx) + spread;
                enemyBullets.push(new Bullet(
                    this.x + this.width / 2 - 4,
                    this.y + this.height,
                    Math.cos(angle) * 4,
                    Math.sin(angle) * 4,
                    15,
                    'enemy',
                    'normal',
                    '#ff44ff'
                ));
            }
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.active = false;
            return true;
        }
        return false;
    }

    draw(ctx) {
        if (this.type === EnemyType.BOSS) {
            this.drawBoss(ctx);
        } else {
            this.drawNormal(ctx);
        }
    }

    drawNormal(ctx) {
        ctx.fillStyle = this.color;
        
        if (this.type === EnemyType.SCOUT) {
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y + this.height);
            ctx.lineTo(this.x + this.width, this.y);
            ctx.lineTo(this.x, this.y);
            ctx.closePath();
            ctx.fill();
        } else if (this.type === EnemyType.FIGHTER) {
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y + this.height);
            ctx.lineTo(this.x + this.width, this.y + this.height * 0.3);
            ctx.lineTo(this.x + this.width * 0.7, this.y);
            ctx.lineTo(this.x + this.width * 0.3, this.y);
            ctx.lineTo(this.x, this.y + this.height * 0.3);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#88ccff';
            ctx.beginPath();
            ctx.ellipse(this.x + this.width / 2, this.y + this.height * 0.4, 6, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === EnemyType.HEAVY) {
            ctx.fillRect(this.x + 10, this.y, this.width - 20, this.height);
            ctx.fillRect(this.x, this.y + 15, this.width, this.height - 25);
            
            ctx.fillStyle = '#aa4444';
            ctx.fillRect(this.x + 5, this.y + 5, 10, this.height - 10);
            ctx.fillRect(this.x + this.width - 15, this.y + 5, 10, this.height - 10);
            
            ctx.fillStyle = '#ffff88';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height * 0.5, 8, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === EnemyType.KAMIKAZE) {
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y + this.height);
            ctx.lineTo(this.x + this.width, this.y);
            ctx.lineTo(this.x + this.width / 2, this.y + 10);
            ctx.lineTo(this.x, this.y);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#ffff00';
            const pulse = Math.sin(Date.now() / 100) * 0.5 + 0.5;
            ctx.globalAlpha = pulse;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + 10, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        if (this.hp < this.maxHp) {
            const barWidth = this.width;
            const barHeight = 4;
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x, this.y - 8, barWidth, barHeight);
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(this.x, this.y - 8, barWidth * (this.hp / this.maxHp), barHeight);
        }
    }

    drawBoss(ctx) {
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, '#aa00aa');
        gradient.addColorStop(0.5, '#660066');
        gradient.addColorStop(1, '#aa00aa');
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.5, this.y);
        ctx.lineTo(this.x + this.width * 0.8, this.y + this.height * 0.3);
        ctx.lineTo(this.x + this.width, this.y + this.height * 0.5);
        ctx.lineTo(this.x + this.width * 0.9, this.y + this.height);
        ctx.lineTo(this.x + this.width * 0.1, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height * 0.5);
        ctx.lineTo(this.x + this.width * 0.2, this.y + this.height * 0.3);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ff00ff';
        const corePulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        ctx.globalAlpha = corePulse;
        ctx.beginPath();
        ctx.arc(this.x + this.width * 0.5, this.y + this.height * 0.4, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.fillStyle = '#440044';
        ctx.fillRect(this.x + 20, this.y + this.height * 0.7, 25, 25);
        ctx.fillRect(this.x + this.width - 45, this.y + this.height * 0.7, 25, 25);
        ctx.fillRect(this.x + this.width * 0.4, this.y + this.height - 15, 35, 15);

        const barWidth = this.width;
        const barHeight = 10;
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x, this.y - 20, barWidth, barHeight);
        
        const hpGradient = ctx.createLinearGradient(this.x, 0, this.x + barWidth, 0);
        hpGradient.addColorStop(0, '#ff0000');
        hpGradient.addColorStop(0.5, '#ffff00');
        hpGradient.addColorStop(1, '#00ff00');
        ctx.fillStyle = hpGradient;
        ctx.fillRect(this.x, this.y - 20, barWidth * (this.hp / this.maxHp), barHeight);
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y - 20, barWidth, barHeight);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`BOSS ${this.hp}/${this.maxHp}`, this.x + this.width / 2, this.y - 25);
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 30;
        this.height = 30;
        this.speed = 2;
        this.active = true;
        this.bobOffset = 0;
        
        const configs = {
            [PowerUpType.SHIELD]: { color: '#4488ff', icon: '🛡️' },
            [PowerUpType.SPEED]: { color: '#44ff44', icon: '⚡' },
            [PowerUpType.WEAPON]: { color: '#ff8800', icon: '🔥' }
        };
        Object.assign(this, configs[type]);
    }

    update() {
        this.y += this.speed;
        this.bobOffset = Math.sin(Date.now() / 200) * 3;
        
        if (this.y > GAME_HEIGHT + 50) {
            this.active = false;
        }
    }

    draw(ctx) {
        const drawY = this.y + this.bobOffset;
        
        const gradient = ctx.createRadialGradient(
            this.x + this.width / 2, drawY + this.height / 2, 0,
            this.x + this.width / 2, drawY + this.height / 2, this.width
        );
        gradient.addColorStop(0, this.color + '88');
        gradient.addColorStop(0.7, this.color + '44');
        gradient.addColorStop(1, this.color + '00');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, drawY + this.height / 2, this.width, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, drawY + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, this.x + this.width / 2, drawY + this.height / 2);
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

class Particle {
    constructor(x, y, color, type) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 1;
        this.decay = 0.02 + Math.random() * 0.02;
        this.size = 3 + Math.random() * 4;
        this.active = true;

        if (type === 'fire') {
            this.color = ['#ff4400', '#ff8800', '#ffcc00', '#ffff00'][Math.floor(Math.random() * 4)];
            this.decay = 0.015;
            this.size = 5 + Math.random() * 5;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1;
        this.life -= this.decay;
        this.size *= 0.98;
        
        if (this.life <= 0 || this.size < 0.5) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        
        if (this.type === 'fire') {
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.size
            );
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        }
        
        ctx.globalAlpha = 1;
    }
}

class Game {
    constructor() {
        this.state = GameState.MENU;
        this.score = 0;
        this.wave = 1;
        this.enemiesSpawned = 0;
        this.enemiesPerWave = 8;
        this.waveComplete = false;
        this.spawnTimer = 0;
        this.spawnInterval = 1500;
        this.bossSpawned = false;
        
        this.player = new Player();
        this.starfield = new Starfield();
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.powerUps = [];
        this.particles = [];
        
        this.keys = {};
        this.lastTime = 0;
        
        this.skins = {
            scatter: 'default',
            laser: 'default',
            missile: 'default'
        };
        this.unlockedSkins = {
            scatter: ['default'],
            laser: ['default'],
            missile: ['default']
        };
        this.highScore = 0;
        
        this.loadSave();
        this.bindEvents();
        this.updateUI();
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            if (e.key === 'q' || e.key === 'Q') {
                if (this.state === GameState.PLAYING) {
                    this.player.switchWeapon();
                }
            }
            
            if (e.key === ' ' || e.code === 'Space') {
                e.preventDefault();
                if (this.state === GameState.PLAYING) {
                    this.pause();
                } else if (this.state === GameState.PAUSED) {
                    this.resume();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        document.getElementById('startBtn').addEventListener('click', () => {
            initAudio();
            this.startNewGame();
        });

        document.getElementById('continueBtn').addEventListener('click', () => {
            initAudio();
            this.continueGame();
        });

        document.getElementById('restartBtn').addEventListener('click', () => {
            initAudio();
            this.startNewGame();
        });

        document.getElementById('continueFromWaveBtn').addEventListener('click', () => {
            initAudio();
            this.continueGame();
        });

        window.addEventListener('beforeunload', () => {
            try {
                this.saveGame();
            } catch (e) {
                console.error('Save on unload failed:', e);
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.state === GameState.PLAYING) {
                this.saveGame();
            }
        });
    }

    loadSave() {
        try {
            const save = localStorage.getItem(STORAGE_KEY);
            if (save) {
                const data = JSON.parse(save);
                this.score = data.score || 0;
                this.wave = data.wave || 1;
                this.highScore = data.highScore || 0;
                this.unlockedSkins = data.unlockedSkins || {
                    scatter: ['default'],
                    laser: ['default'],
                    missile: ['default']
                };
                
                this.checkSkinUnlocks();
                
                const hasProgress = this.score > 0 || this.wave > 1;
                const continueBtn = document.getElementById('continueBtn');
                const savedInfo = document.getElementById('savedInfo');
                
                if (hasProgress) {
                    continueBtn.style.display = 'block';
                    if (savedInfo) {
                        savedInfo.style.display = 'block';
                        savedInfo.textContent = `已保存进度：第 ${this.wave} 波 · ${this.score} 分`;
                    }
                } else {
                    continueBtn.style.display = 'none';
                    if (savedInfo) {
                        savedInfo.style.display = 'none';
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load save:', e);
        }
        this.updateSkinUI();
    }

    saveGame() {
        try {
            const data = {
                score: this.score,
                wave: this.wave,
                highScore: Math.max(this.highScore, this.score),
                unlockedSkins: this.unlockedSkins
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save game:', e);
        }
    }

    checkSkinUnlocks() {
        const totalScore = Math.max(this.score, this.highScore);
        
        if (totalScore >= 1000 && !this.unlockedSkins.scatter.includes('red')) {
            this.unlockedSkins.scatter.push('red');
        }
        if (totalScore >= 3000 && !this.unlockedSkins.laser.includes('purple')) {
            this.unlockedSkins.laser.push('purple');
        }
        if (totalScore >= 5000 && !this.unlockedSkins.missile.includes('gold')) {
            this.unlockedSkins.missile.push('gold');
        }
        
        this.skins.scatter = this.unlockedSkins.scatter.includes('red') ? 'red' : 'default';
        this.skins.laser = this.unlockedSkins.laser.includes('purple') ? 'purple' : 'default';
        this.skins.missile = this.unlockedSkins.missile.includes('gold') ? 'gold' : 'default';
    }

    updateSkinUI() {
        const skinNames = {
            default: '默认',
            red: '红焰',
            purple: '紫电',
            gold: '金光'
        };
        
        document.getElementById('skin-scatter').textContent = skinNames[this.skins.scatter] || '默认';
        document.getElementById('skin-laser').textContent = skinNames[this.skins.laser] || '默认';
        document.getElementById('skin-missile').textContent = skinNames[this.skins.missile] || '默认';
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('wave').textContent = this.wave;
        document.getElementById('hpFill').style.width = (this.player.hp / this.player.maxHp * 100) + '%';
        this.player.updateWeaponUI();
        this.updateSkinUI();
    }

    startNewGame() {
        this.score = 0;
        this.wave = 1;
        this.resetWave();
        this.player = new Player();
        this.player.updateWeaponUI();
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.powerUps = [];
        this.particles = [];
        this.checkSkinUnlocks();
        
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameOverScreen').style.display = 'none';
        this.state = GameState.PLAYING;
        this.updateUI();
    }

    continueGame() {
        this.loadSave();
        this.resetWave();
        this.player = new Player();
        this.player.updateWeaponUI();
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.powerUps = [];
        this.particles = [];
        this.checkSkinUnlocks();
        
        document.getElementById('startScreen').style.display = 'none';
        this.state = GameState.PLAYING;
        this.updateUI();
    }

    resetWave() {
        this.enemiesSpawned = 0;
        this.enemiesPerWave = 6 + this.wave * 2;
        this.waveComplete = false;
        this.spawnTimer = 0;
        this.bossSpawned = false;
        this.spawnInterval = Math.max(500, 1500 - this.wave * 50);
    }

    pause() {
        this.state = GameState.PAUSED;
        document.getElementById('pauseScreen').style.display = 'flex';
        SoundEffects.playLaser(false);
    }

    resume() {
        this.state = GameState.PLAYING;
        document.getElementById('pauseScreen').style.display = 'none';
    }

    gameOver() {
        this.state = GameState.GAME_OVER;
        this.highScore = Math.max(this.highScore, this.score);
        this.saveGame();
        
        SoundEffects.playLaser(false);
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalWave').textContent = this.wave;
        document.getElementById('continueWaveNum').textContent = this.wave;
        document.getElementById('gameOverScreen').style.display = 'flex';
        
        this.loadSave();
    }

    spawnEnemy() {
        if (this.wave % 5 === 0 && !this.bossSpawned && this.enemiesSpawned >= this.enemiesPerWave) {
            this.showBossWarning();
            return;
        }

        if (this.enemiesSpawned >= this.enemiesPerWave) return;

        const types = [EnemyType.SCOUT, EnemyType.SCOUT, EnemyType.FIGHTER];
        if (this.wave >= 2) types.push(EnemyType.KAMIKAZE, EnemyType.KAMIKAZE);
        if (this.wave >= 3) types.push(EnemyType.FIGHTER, EnemyType.HEAVY);
        if (this.wave >= 5) types.push(EnemyType.HEAVY, EnemyType.HEAVY);

        const type = types[Math.floor(Math.random() * types.length)];
        let width = 30;
        
        if (type === EnemyType.SCOUT) width = 30;
        else if (type === EnemyType.FIGHTER) width = 40;
        else if (type === EnemyType.HEAVY) width = 60;
        else if (type === EnemyType.KAMIKAZE) width = 28;

        const x = Math.random() * (GAME_WIDTH - width - 40) + 20;
        const y = -60;
        
        this.enemies.push(new Enemy(type, x, y));
        this.enemiesSpawned++;
    }

    showBossWarning() {
        this.state = GameState.BOSS_WARNING;
        this.bossSpawned = true;
        SoundEffects.playBossWarning();
        
        const warning = document.getElementById('bossWarning');
        warning.style.display = 'block';
        
        this.player.screenShake = 300;
        
        setTimeout(() => {
            warning.style.display = 'none';
            this.spawnBoss();
            this.state = GameState.PLAYING;
        }, 2000);
    }

    spawnBoss() {
        const boss = new Enemy(EnemyType.BOSS, GAME_WIDTH / 2 - 90, -120);
        this.enemies.push(boss);
        this.enemiesSpawned++;
    }

    spawnPowerUp(x, y) {
        if (Math.random() < 0.15) {
            const types = [PowerUpType.SHIELD, PowerUpType.SPEED, PowerUpType.WEAPON];
            const type = types[Math.floor(Math.random() * types.length)];
            this.powerUps.push(new PowerUp(x, y, type));
        }
    }

    addExplosion(x, y, size) {
        const counts = { small: 5, medium: 10, large: 20, boss: 40 };
        const count = counts[size] || 10;
        const type = size === 'boss' ? 'fire' : 'normal';
        const colors = size === 'boss' 
            ? ['#ff4400', '#ff8800', '#ffcc00']
            : ['#ff6644', '#ffaa44', '#ffff44'];

        for (let i = 0; i < count; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push(new Particle(x, y, color, type));
        }
    }

    checkCollision(a, b) {
        if (!a || !b || !a.getBounds || !b.getBounds) {
            return false;
        }
        const boundsA = a.getBounds();
        const boundsB = b.getBounds();
        
        if (!boundsA || !boundsB) {
            return false;
        }
        
        return boundsA.x < boundsB.x + boundsB.width &&
               boundsA.x + boundsA.width > boundsB.x &&
               boundsA.y < boundsB.y + boundsB.height &&
               boundsA.y + boundsA.height > boundsB.y;
    }

    update(deltaTime) {
        if (this.state !== GameState.PLAYING) return;

        this.starfield.update();
        this.player.update(this.keys, this.bullets, this.enemies, deltaTime, this);

        this.bullets = this.bullets.filter(bullet => {
            if (bullet.update) {
                if (bullet instanceof LaserBeam) {
                    bullet.update(this.player);
                } else {
                    bullet.update();
                }
            }
            return bullet.active;
        });

        this.enemyBullets = this.enemyBullets.filter(bullet => {
            bullet.update();
            return bullet.active;
        });

        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval && !this.bossSpawned) {
            this.spawnTimer = 0;
            this.spawnEnemy();
        }

        this.enemies = this.enemies.filter(enemy => {
            enemy.update(this.player, this.enemyBullets, deltaTime, this);
            return enemy.active;
        });

        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.update();
            return powerUp.active;
        });

        this.particles = this.particles.filter(particle => {
            particle.update();
            return particle.active;
        });

        this.bullets.forEach(bullet => {
            if (bullet.owner !== 'player') return;
            if (!bullet.active) return;
            if (bullet instanceof Missile && bullet.exploding) return;
            
            this.enemies.forEach(enemy => {
                if (!enemy.active) return;
                
                if (this.checkCollision(bullet, enemy)) {
                    if (bullet instanceof Missile) {
                        bullet.hit();
                    } else if (!(bullet instanceof LaserBeam)) {
                        bullet.active = false;
                    }
                    
                    if (enemy.takeDamage(bullet.damage)) {
                        this.score += enemy.score;
                        this.addExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.size);
                        SoundEffects.playExplosion(enemy.size);
                        this.spawnPowerUp(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                        
                        if (enemy.type === EnemyType.BOSS) {
                            this.player.screenShake = 500;
                        }
                        
                        this.checkSkinUnlocks();
                        this.updateUI();
                    }
                }
            });
        });

        this.enemyBullets.forEach(bullet => {
            if (bullet.owner !== 'enemy') return;
            
            if (this.checkCollision(bullet, this.player)) {
                bullet.active = false;
                if (this.player.takeDamage(bullet.damage)) {
                    this.gameOver();
                }
                this.updateUI();
            }
        });

        this.enemies.forEach(enemy => {
            if (this.checkCollision(enemy, this.player)) {
                if (this.player.takeDamage(20)) {
                    this.gameOver();
                }
                enemy.hp = 0;
                enemy.active = false;
                this.addExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.size);
                SoundEffects.playExplosion(enemy.size);
                this.updateUI();
            }
        });

        this.powerUps.forEach(powerUp => {
            if (this.checkCollision(powerUp, this.player)) {
                powerUp.active = false;
                this.player.applyBuff(powerUp.type);
            }
        });

        if (this.enemiesSpawned >= this.enemiesPerWave && this.enemies.length === 0 && !this.waveComplete) {
            this.waveComplete = true;
            this.wave++;
            this.resetWave();
            this.saveGame();
            this.updateUI();
        }
    }

    draw() {
        ctx.fillStyle = '#000011';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        if (this.player.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * 6;
            const shakeY = (Math.random() - 0.5) * 6;
            ctx.save();
            ctx.translate(shakeX, shakeY);
        }

        this.starfield.draw(ctx);

        this.powerUps.forEach(powerUp => powerUp.draw(ctx));

        this.enemies.forEach(enemy => enemy.draw(ctx));

        this.player.draw(ctx);

        this.bullets.forEach(bullet => bullet.draw(ctx));
        this.enemyBullets.forEach(bullet => bullet.draw(ctx));

        this.particles.forEach(particle => particle.draw(ctx));

        if (this.player.screenShake > 0) {
            ctx.restore();
        }
    }

    gameLoop(timestamp) {
        try {
            const deltaTime = timestamp - this.lastTime;
            this.lastTime = timestamp;

            if (deltaTime < 500) {
                this.update(deltaTime);
            }
            this.draw();

            this.autoSaveTimer = (this.autoSaveTimer || 0) + deltaTime;
            if (this.autoSaveTimer >= 2000) {
                this.autoSaveTimer = 0;
                if (this.state === GameState.PLAYING) {
                    this.saveGame();
                }
            }
        } catch (error) {
            console.error('Game error:', error);
        }

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    start() {
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

const game = new Game();
game.start();
