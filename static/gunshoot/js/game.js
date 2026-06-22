(function () {
    'use strict';

    const CONFIG = {
        GRID_COLS: 30,
        GRID_ROWS: 20,
        CELL_SIZE: 30,
        PLAYER_MAX_HP: 80,
        PLAYER_SPEED: 3.5,
        PLAYER_RADIUS: 12,
        LEFT_GUN: {
            damage: 8,
            magazine: 18,
            fireRate: 120,
            bulletSpeed: 11,
            reloadTime: 3000,
            spread: 0.05,
            color: '#4ecdc4'
        },
        RIGHT_GUN: {
            damage: 25,
            magazine: 6,
            fireRate: 550,
            bulletSpeed: 9,
            reloadTime: 4000,
            spread: 0.02,
            color: '#ff6b6b'
        },
        DUAL_RELOAD_TIME: 5000,
        DUAL_STATIONARY_TIME: 2000,
        WAVES: 5,
        ENEMY_LIGHT: {
            hp: 20,
            speed: 1.8,
            damage: 8,
            radius: 10,
            color: '#a8e6cf',
            shootRange: 0,
            attackInterval: 700,
            type: 'light'
        },
        ENEMY_HEAVY: {
            hp: 60,
            speed: 0.9,
            damage: 15,
            radius: 15,
            color: '#ff8b94',
            frontReduction: 0.4,
            shootRange: 0,
            attackInterval: 1000,
            type: 'heavy'
        },
        WAVE_ENEMIES: [
            { light: 5, heavy: 1 },
            { light: 7, heavy: 2 },
            { light: 8, heavy: 3 },
            { light: 10, heavy: 4 },
            { light: 12, heavy: 6 }
        ]
    };

    const canvas = document.getElementById('battlefield');
    const ctx = canvas.getContext('2d');
    canvas.width = CONFIG.GRID_COLS * CONFIG.CELL_SIZE;
    canvas.height = CONFIG.GRID_ROWS * CONFIG.CELL_SIZE;

    const GameState = {
        MENU: 'menu',
        PLAYING: 'playing',
        PAUSED: 'paused',
        WAVE_BREAK: 'wave_break',
        GAME_OVER: 'game_over',
        VICTORY: 'victory'
    };

    const SAVE_KEY = 'gunshoot_save_v1';
    const AUTOSAVE_INTERVAL = 500;

    const game = {
        state: GameState.MENU,
        level: 1,
        wave: 0,
        waveBreakTimer: 0,
        totalTime: 0,
        stationaryTime: 0,
        keys: {},
        player: null,
        enemies: [],
        bullets: [],
        effects: [],
        spawnQueue: [],
        spawnTimer: 0,
        stats: {
            dualGunShots: 0,
            dualGunHits: 0,
            singleGunShots: 0,
            singleGunHits: 0,
            enemiesKilled: 0,
            totalEnemies: 0,
            damageDealt: 0,
            damageTaken: 0,
            reloadCount: 0
        }
    };

    let lastAutosave = 0;
    let saveCounter = 0;

    function deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    function saveGame(now, reason) {
        if (!game.player) return false;
        if (game.state === GameState.MENU) return false;
        if (game.state === GameState.GAME_OVER) return false;
        if (game.state === GameState.VICTORY) return false;
        if (!now) now = performance.now();

        const aliveEnemies = game.enemies.filter(function (e) { return !e.dead; });
        const enemyData = aliveEnemies.map(function (e) {
            return {
                type: e.type,
                hp: e.hp,
                maxHp: e.maxHp,
                x: e.x,
                y: e.y,
                lastAttack: Math.max(0, e.lastAttack - now)
            };
        });

        const saveData = {
            version: 1,
            timestamp: now,
            savedAt: new Date().toISOString(),
            state: game.state,
            level: game.level,
            wave: game.wave,
            waveBreakTimerElapsed: game.waveBreakTimer > 0 ? Math.max(0, now - game.waveBreakTimer) : 0,
            spawnTimerElapsed: Math.max(0, now - game.spawnTimer),
            totalTime: game.totalTime,
            stationaryTime: game.stationaryTime,
            stats: deepClone(game.stats),
            spawnQueue: deepClone(game.spawnQueue),
            player: {
                x: game.player.x,
                y: game.player.y,
                hp: game.player.hp,
                aimDir: { x: game.player.aimDir.x, y: game.player.aimDir.y },
                leftGun: {
                    ammo: game.player.leftGun.ammo,
                    maxAmmo: game.player.leftGun.maxAmmo,
                    lastFireOffset: Math.max(0, now - game.player.leftGun.lastFire),
                    reloading: game.player.leftGun.reloading,
                    reloadStartOffset: game.player.leftGun.reloading ? Math.max(0, now - game.player.leftGun.reloadStart) : 0,
                    reloadDuration: game.player.leftGun.reloadDuration
                },
                rightGun: {
                    ammo: game.player.rightGun.ammo,
                    maxAmmo: game.player.rightGun.maxAmmo,
                    lastFireOffset: Math.max(0, now - game.player.rightGun.lastFire),
                    reloading: game.player.rightGun.reloading,
                    reloadStartOffset: game.player.rightGun.reloading ? Math.max(0, now - game.player.rightGun.reloadStart) : 0,
                    reloadDuration: game.player.rightGun.reloadDuration
                },
                dualStationaryUntil: Math.max(0, game.player.dualStationaryUntil - now),
                moveLockedUntil: Math.max(0, game.player.moveLockedUntil - now),
                invincibleUntil: Math.max(0, game.player.invincibleUntil - now)
            },
            enemies: enemyData
        };

        try {
            const json = JSON.stringify(saveData);
            localStorage.setItem(SAVE_KEY, json);
            saveCounter++;
            if (saveCounter % 20 === 0 || reason) {
                const enemyPosPreview = aliveEnemies.slice(0, 3).map(function (e) {
                    return e.type + '(' + Math.round(e.x) + ',' + Math.round(e.y) + ')';
                }).join(' ');
                console.log(
                    '[存档#' + saveCounter + ']' +
                    (reason ? ' [' + reason + ']' : '') +
                    ' 波次=' + saveData.wave +
                    ' HP=' + saveData.player.hp +
                    ' 左弹=' + saveData.player.leftGun.ammo +
                    ' 右弹=' + saveData.player.rightGun.ammo +
                    ' 待生成=' + saveData.spawnQueue.length +
                    ' 存活敌人=' + saveData.enemies.length +
                    ' [' + enemyPosPreview + ']' +
                    ' 大小=' + (json.length / 1024).toFixed(1) + 'KB'
                );
            }
            return true;
        } catch (e) {
            console.error('[存档失败]', e);
            return false;
        }
    }

    function hasSavedGame() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return false;
            const data = JSON.parse(raw);
            return !!(data && data.player && typeof data.player.hp === 'number' && data.player.hp > 0);
        } catch (e) {
            return false;
        }
    }

    function getSavedGameInfo() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return null;
            const data = JSON.parse(raw);
            return {
                wave: data.wave || 0,
                hp: data.player ? data.player.hp : 0,
                leftAmmo: data.player ? data.player.leftGun.ammo : 0,
                rightAmmo: data.player ? data.player.rightGun.ammo : 0,
                enemies: data.enemies ? data.enemies.length : 0,
                totalTime: data.totalTime || 0,
                savedAt: data.savedAt || ''
            };
        } catch (e) {
            return null;
        }
    }

    function clearSavedGame() {
        localStorage.removeItem(SAVE_KEY);
        console.log('[存档] 已清除');
    }

    function loadGame() {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) {
            console.error('[读档] 没有存档数据');
            return false;
        }

        let data;
        try {
            data = JSON.parse(raw);
        } catch (e) {
            console.error('[读档] JSON 解析失败:', e);
            clearSavedGame();
            return false;
        }

        if (!data || !data.player) {
            console.error('[读档] 存档数据损坏: 缺少 player');
            clearSavedGame();
            return false;
        }

        const now = performance.now();
        const timeOffset = now - (data.timestamp || now);
        const hasNewFormat = typeof data.player.leftGun.lastFireOffset !== 'undefined' ||
                             typeof data.spawnTimerElapsed !== 'undefined';

        console.log('[读档] 存档格式=' + (hasNewFormat ? '新(相对时间)' : '旧(绝对时间,兼容)'));
        console.log('[读档] 原始存档 enemies 数量=' + (data.enemies ? data.enemies.length : 'undefined'));
        if (data.enemies && data.enemies.length > 0) {
            console.log('[读档] 前3个敌人位置: ' +
                data.enemies.slice(0, 3).map(function (e) {
                    return e.type + '(' + Math.round(e.x) + ',' + Math.round(e.y) + ')';
                }).join(' ')
            );
        }

        try {
            game.state = data.state || GameState.PAUSED;
            game.level = data.level || 1;
            game.wave = data.wave || 0;

            if (hasNewFormat) {
                game.waveBreakTimer = (data.waveBreakTimerElapsed || 0) > 0
                    ? now - (data.waveBreakTimerElapsed || 0) : 0;
                game.spawnTimer = now - (data.spawnTimerElapsed || 0);
            } else {
                game.waveBreakTimer = (data.waveBreakTimer || 0) > 0
                    ? (data.waveBreakTimer || 0) + timeOffset : 0;
                game.spawnTimer = (data.spawnTimer || 0) + timeOffset;
            }

            game.totalTime = data.totalTime || 0;
            game.stationaryTime = data.stationaryTime || 0;
            game.stats = Object.assign({
                dualGunShots: 0,
                dualGunHits: 0,
                singleGunShots: 0,
                singleGunHits: 0,
                enemiesKilled: 0,
                totalEnemies: 0,
                damageDealt: 0,
                damageTaken: 0,
                reloadCount: 0
            }, data.stats || {});
            game.spawnQueue = (data.spawnQueue || []).map(function (item) {
                return {
                    type: item.type,
                    delay: Math.max(0, (item.delay || 0) - timeOffset)
                };
            });

            game.player = new Player();
            game.player.x = data.player.x;
            game.player.y = data.player.y;
            game.player.hp = data.player.hp;
            game.player.aimDir = {
                x: (data.player.aimDir && data.player.aimDir.x) || 1,
                y: (data.player.aimDir && data.player.aimDir.y) || 0
            };

            var lg = data.player.leftGun || {};
            game.player.leftGun = {
                ammo: typeof lg.ammo === 'number' ? lg.ammo : CONFIG.LEFT_GUN.magazine,
                maxAmmo: typeof lg.maxAmmo === 'number' ? lg.maxAmmo : CONFIG.LEFT_GUN.magazine,
                reloading: !!lg.reloading,
                reloadDuration: typeof lg.reloadDuration === 'number' ? lg.reloadDuration : CONFIG.LEFT_GUN.reloadTime,
                lastFire: hasNewFormat
                    ? now - (lg.lastFireOffset || 0)
                    : (typeof lg.lastFire === 'number' ? lg.lastFire + timeOffset : 0),
                reloadStart: hasNewFormat
                    ? (lg.reloading ? now - (lg.reloadStartOffset || 0) : 0)
                    : (typeof lg.reloadStart === 'number' ? lg.reloadStart + timeOffset : 0)
            };

            var rg = data.player.rightGun || {};
            game.player.rightGun = {
                ammo: typeof rg.ammo === 'number' ? rg.ammo : CONFIG.RIGHT_GUN.magazine,
                maxAmmo: typeof rg.maxAmmo === 'number' ? rg.maxAmmo : CONFIG.RIGHT_GUN.magazine,
                reloading: !!rg.reloading,
                reloadDuration: typeof rg.reloadDuration === 'number' ? rg.reloadDuration : CONFIG.RIGHT_GUN.reloadTime,
                lastFire: hasNewFormat
                    ? now - (rg.lastFireOffset || 0)
                    : (typeof rg.lastFire === 'number' ? rg.lastFire + timeOffset : 0),
                reloadStart: hasNewFormat
                    ? (rg.reloading ? now - (rg.reloadStartOffset || 0) : 0)
                    : (typeof rg.reloadStart === 'number' ? rg.reloadStart + timeOffset : 0)
            };

            game.player.dualStationaryUntil = now + (data.player.dualStationaryUntil || 0);
            game.player.moveLockedUntil = now + (data.player.moveLockedUntil || 0);
            game.player.invincibleUntil = now + (data.player.invincibleUntil || 0);

            game.enemies = (data.enemies || []).map(function (eData) {
                var config = eData.type === 'light' ? CONFIG.ENEMY_LIGHT : CONFIG.ENEMY_HEAVY;
                var enemy = new Enemy(config, eData.x, eData.y);
                enemy.hp = eData.hp;
                enemy.maxHp = eData.maxHp || (eData.type === 'light' ? 20 : 60);
                enemy.lastAttack = now + (eData.lastAttack || 0);
                return enemy;
            });

            game.bullets = [];
            game.effects = [];

        } catch (e) {
            console.error('[读档] 数据恢复阶段失败:', e);
            console.error(e.stack);
            clearSavedGame();
            return false;
        }

        console.log('[读档] 数据恢复成功, game.enemies.length=' + game.enemies.length);
        if (game.enemies.length > 0) {
            console.log('[读档] 恢复后前3个敌人: ' +
                game.enemies.slice(0, 3).map(function (e) {
                    return e.type + '(' + Math.round(e.x) + ',' + Math.round(e.y) + ')';
                }).join(' ')
            );
        }

        try {
            updateHUD(now);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawGrid();
            game.enemies.forEach(function (enemy) { enemy.draw(ctx); });
            if (game.player) { game.player.draw(ctx, now); }
        } catch (e) {
            console.warn('[读档] UI 刷新阶段出错 (不影响游戏数据):', e);
        }

        console.log(
            '[读档成功] ' +
            '波次=' + game.wave +
            ' HP=' + game.player.hp +
            ' 左弹=' + game.player.leftGun.ammo +
            ' 右弹=' + game.player.rightGun.ammo +
            ' 待生成=' + game.spawnQueue.length +
            ' 存活敌人=' + game.enemies.length +
            ' 左枪可射=' + (now - game.player.leftGun.lastFire >= CONFIG.LEFT_GUN.fireRate) +
            ' 右枪可射=' + (now - game.player.rightGun.lastFire >= CONFIG.RIGHT_GUN.fireRate)
        );
        return true;
    }

    class Player {
        constructor() {
            this.x = canvas.width / 2;
            this.y = canvas.height / 2;
            this.hp = CONFIG.PLAYER_MAX_HP;
            this.radius = CONFIG.PLAYER_RADIUS;
            this.speed = CONFIG.PLAYER_SPEED;
            this.aimDir = { x: 1, y: 0 };
            this.leftGun = {
                ammo: CONFIG.LEFT_GUN.magazine,
                maxAmmo: CONFIG.LEFT_GUN.magazine,
                lastFire: 0,
                reloading: false,
                reloadStart: 0,
                reloadDuration: CONFIG.LEFT_GUN.reloadTime
            };
            this.rightGun = {
                ammo: CONFIG.RIGHT_GUN.magazine,
                maxAmmo: CONFIG.RIGHT_GUN.magazine,
                lastFire: 0,
                reloading: false,
                reloadStart: 0,
                reloadDuration: CONFIG.RIGHT_GUN.reloadTime
            };
            this.dualFiring = false;
            this.dualStationaryUntil = 0;
            this.moveLockedUntil = 0;
            this.invincibleUntil = 0;
        }

        update(dt, now) {
            if (this.hp <= 0) return;

            this.updateAim();
            this.updateReloading(now);

            const isStationary = now < this.dualStationaryUntil;
            const moveLocked = now < this.moveLockedUntil;

            if (isStationary) {
                game.stationaryTime += dt;
            }

            if (!moveLocked && !isStationary) {
                this.handleMovement(dt);
            }

            this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));

            this.processFiring(now);
        }

        updateAim() {
            let dx = 0, dy = 0;
            if (game.keys['ArrowLeft']) dx -= 1;
            if (game.keys['ArrowRight']) dx += 1;
            if (game.keys['ArrowUp']) dy -= 1;
            if (game.keys['ArrowDown']) dy += 1;

            if (dx !== 0 || dy !== 0) {
                const len = Math.sqrt(dx * dx + dy * dy);
                this.aimDir.x = dx / len;
                this.aimDir.y = dy / len;
            }
        }

        handleMovement(dt) {
            let dx = 0, dy = 0;
            if (game.keys['w'] || game.keys['W']) dy -= 1;
            if (game.keys['s'] || game.keys['S']) dy += 1;
            if (game.keys['a'] || game.keys['A']) dx -= 1;
            if (game.keys['d'] || game.keys['D']) dx += 1;

            const firingSingle = (game.keys['j'] || game.keys['J'] || game.keys['l'] || game.keys['L'])
                && !this.dualFiring;

            if (firingSingle && (dx !== 0 || dy !== 0)) {
                const aimAngle = Math.atan2(this.aimDir.y, this.aimDir.x);
                const moveAngle = Math.atan2(dy, dx);
                const angleDiff = Math.abs(normalizeAngle(moveAngle - aimAngle));
                if (angleDiff > Math.PI / 2) {
                    return;
                }
            }

            if (dx !== 0 || dy !== 0) {
                const len = Math.sqrt(dx * dx + dy * dy);
                this.x += (dx / len) * this.speed * dt * 60;
                this.y += (dy / len) * this.speed * dt * 60;
            }
        }

        updateReloading(now) {
            const self = this;
            [this.leftGun, this.rightGun].forEach(function (gun) {
                if (gun.reloading && now >= gun.reloadStart + gun.reloadDuration) {
                    gun.ammo = gun.maxAmmo;
                    gun.reloading = false;
                    saveGame(now, '换弹完成');
                }
            });
        }

        processFiring(now) {
            const leftPressed = game.keys['j'] || game.keys['J'];
            const rightPressed = game.keys['l'] || game.keys['L'];
            const dualPressed = game.keys['k'] || game.keys['K'];

            if (dualPressed && this.canDualFire(now)) {
                this.fireDual(now);
                return;
            }

            if (leftPressed && !dualPressed && this.canFire(this.leftGun, CONFIG.LEFT_GUN.fireRate, now)) {
                this.fireSingle('left', now);
            }
            if (rightPressed && !dualPressed && this.canFire(this.rightGun, CONFIG.RIGHT_GUN.fireRate, now)) {
                this.fireSingle('right', now);
            }
        }

        canFire(gun, fireRate, now) {
            return gun.ammo > 0 && !gun.reloading && (now - gun.lastFire) >= fireRate;
        }

        canDualFire(now) {
            return this.leftGun.ammo > 0 && this.rightGun.ammo > 0
                && !this.leftGun.reloading && !this.rightGun.reloading
                && (now - this.leftGun.lastFire) >= CONFIG.LEFT_GUN.fireRate
                && (now - this.rightGun.lastFire) >= CONFIG.RIGHT_GUN.fireRate;
        }

        fireSingle(side, now) {
            const gun = side === 'left' ? this.leftGun : this.rightGun;
            const config = side === 'left' ? CONFIG.LEFT_GUN : CONFIG.RIGHT_GUN;
            gun.ammo--;
            gun.lastFire = now;

            const spread = (Math.random() - 0.5) * config.spread * 2;
            const angle = Math.atan2(this.aimDir.y, this.aimDir.x) + spread;
            this.spawnBullet(angle, config, side);
            game.stats.singleGunShots++;

            addMuzzleFlash(this.x, this.y, angle, config.color);
            saveGame(now, '单枪射击');
        }

        fireDual(now) {
            this.leftGun.ammo--;
            this.rightGun.ammo--;
            this.leftGun.lastFire = now;
            this.rightGun.lastFire = now;

            const baseAngle = Math.atan2(this.aimDir.y, this.aimDir.x);

            const leftAngle = baseAngle + (Math.random() - 0.5) * CONFIG.LEFT_GUN.spread * 2 - 0.15;
            this.spawnBullet(leftAngle, CONFIG.LEFT_GUN, 'left');

            const rightAngle = baseAngle + (Math.random() - 0.5) * CONFIG.RIGHT_GUN.spread * 2 + 0.15;
            this.spawnBullet(rightAngle, CONFIG.RIGHT_GUN, 'right');

            game.stats.dualGunShots++;
            game.stats.dualGunShots++;

            this.dualStationaryUntil = now + CONFIG.DUAL_STATIONARY_TIME;
            this.moveLockedUntil = now + 200;

            addMuzzleFlash(this.x, this.y, baseAngle - 0.3, CONFIG.LEFT_GUN.color);
            addMuzzleFlash(this.x, this.y, baseAngle + 0.3, CONFIG.RIGHT_GUN.color);
            saveGame(now, '双枪射击');
        }

        spawnBullet(angle, config, side) {
            game.bullets.push({
                x: this.x + Math.cos(angle) * (this.radius + 5),
                y: this.y + Math.sin(angle) * (this.radius + 5),
                vx: Math.cos(angle) * config.bulletSpeed,
                vy: Math.sin(angle) * config.bulletSpeed,
                damage: config.damage,
                color: config.color,
                side: side,
                dual: side === 'dual',
                radius: side === 'right' ? 4 : 3,
                life: 0,
                maxLife: 60
            });
        }

        takeDamage(amount, now) {
            if (now < this.invincibleUntil) return;
            this.hp -= amount;
            game.stats.damageTaken += amount;
            this.invincibleUntil = now + 300;
            addDamageFlash();
            saveGame(now, '受到伤害');
            if (this.hp <= 0) {
                this.hp = 0;
                game.state = GameState.GAME_OVER;
                showGameEnd(false);
            }
        }

        draw(ctx, now) {
            const isStationary = now < this.dualStationaryUntil;
            const isInvincible = now < this.invincibleUntil;

            if (isStationary) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius + 8, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 107, 107, 0.2)';
                ctx.fill();
            }

            ctx.save();
            ctx.translate(this.x, this.y);

            if (isInvincible && Math.floor(now / 50) % 2 === 0) {
                ctx.globalAlpha = 0.5;
            }

            const angle = Math.atan2(this.aimDir.y, this.aimDir.x);
            ctx.rotate(angle);

            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            const gradient = ctx.createRadialGradient(0, 0, 2, 0, 0, this.radius);
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(0.5, '#667eea');
            gradient.addColorStop(1, '#3d3d8c');
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.strokeStyle = '#feca57';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = CONFIG.LEFT_GUN.color;
            ctx.fillRect(this.radius - 2, -this.radius + 2, 14, 5);

            ctx.fillStyle = CONFIG.RIGHT_GUN.color;
            ctx.fillRect(this.radius - 2, this.radius - 7, 14, 5);

            ctx.beginPath();
            ctx.moveTo(this.radius + 2, 0);
            ctx.lineTo(this.radius + 12, 0);
            ctx.strokeStyle = '#feca57';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.restore();
        }

        startReload(now) {
            const leftEmpty = this.leftGun.ammo < this.leftGun.maxAmmo;
            const rightEmpty = this.rightGun.ammo < this.rightGun.maxAmmo;

            if (!leftEmpty && !rightEmpty) return;

            if (leftEmpty && rightEmpty) {
                this.leftGun.reloading = true;
                this.leftGun.reloadStart = now;
                this.leftGun.reloadDuration = CONFIG.DUAL_RELOAD_TIME;
                this.rightGun.reloading = true;
                this.rightGun.reloadStart = now;
                this.rightGun.reloadDuration = CONFIG.DUAL_RELOAD_TIME;
                game.stats.reloadCount++;
            } else {
                if (leftEmpty && !this.leftGun.reloading) {
                    this.leftGun.reloading = true;
                    this.leftGun.reloadStart = now;
                    this.leftGun.reloadDuration = CONFIG.LEFT_GUN.reloadTime;
                    game.stats.reloadCount++;
                }
                if (rightEmpty && !this.rightGun.reloading) {
                    this.rightGun.reloading = true;
                    this.rightGun.reloadStart = now;
                    this.rightGun.reloadDuration = CONFIG.RIGHT_GUN.reloadTime;
                    game.stats.reloadCount++;
                }
            }
            saveGame(now, '开始换弹');
        }
    }

    class Enemy {
        constructor(config, x, y) {
            this.type = config.type;
            this.hp = config.hp;
            this.maxHp = config.hp;
            this.speed = config.speed;
            this.damage = config.damage;
            this.radius = config.radius;
            this.color = config.color;
            this.frontReduction = config.frontReduction || 0;
            this.attackInterval = config.attackInterval;
            this.lastAttack = 0;
            this.x = x;
            this.y = y;
            this.dead = false;
            this.hitFlash = 0;
        }

        update(dt, player, now) {
            if (this.dead) return;

            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > this.radius + player.radius + 2) {
                this.x += (dx / dist) * this.speed * dt * 60;
                this.y += (dy / dist) * this.speed * dt * 60;
            } else if (now - this.lastAttack >= this.attackInterval) {
                player.takeDamage(this.damage, now);
                this.lastAttack = now;
            }

            if (this.hitFlash > 0) {
                this.hitFlash -= dt;
            }
        }

        takeDamage(bullet, player, now) {
            let damage = bullet.damage;

            if (this.type === 'heavy' && this.frontReduction > 0) {
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const angleToPlayer = Math.atan2(dy, dx);
                const bulletAngle = Math.atan2(bullet.vy, bullet.vx);
                const angleDiff = Math.abs(normalizeAngle(bulletAngle - angleToPlayer + Math.PI));

                if (angleDiff < Math.PI / 3) {
                    damage = Math.ceil(damage * (1 - this.frontReduction));
                }
            }

            this.hp -= damage;
            game.stats.damageDealt += damage;
            this.hitFlash = 0.1;

            addHitEffect(bullet.x, bullet.y, bullet.color);

            if (this.hp <= 0) {
                this.dead = true;
                game.stats.enemiesKilled++;
                addDeathEffect(this.x, this.y, this.color);
                saveGame(now, '击杀敌人');
            }
        }

        draw(ctx) {
            if (this.dead) return;

            ctx.save();
            ctx.translate(this.x, this.y);

            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            const gradient = ctx.createRadialGradient(0, 0, 2, 0, 0, this.radius);
            const baseColor = this.hitFlash > 0 ? '#ffffff' : this.color;
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(0.6, baseColor);
            gradient.addColorStop(1, this.darkenColor(baseColor, 40));
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.strokeStyle = this.hitFlash > 0 ? '#ffffff' : '#333';
            ctx.lineWidth = 2;
            ctx.stroke();

            if (this.type === 'heavy') {
                ctx.strokeStyle = '#ff3333';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius - 3, -Math.PI / 4, Math.PI / 4);
                ctx.stroke();
            }

            ctx.restore();

            if (this.hp < this.maxHp) {
                const barWidth = this.radius * 2;
                const barHeight = 4;
                const barX = this.x - barWidth / 2;
                const barY = this.y - this.radius - 10;

                ctx.fillStyle = '#333';
                ctx.fillRect(barX, barY, barWidth, barHeight);

                const hpRatio = this.hp / this.maxHp;
                ctx.fillStyle = hpRatio > 0.5 ? '#51cf66' : hpRatio > 0.25 ? '#feca57' : '#ff6b6b';
                ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.strokeRect(barX, barY, barWidth, barHeight);
            }
        }

        darkenColor(color, percent) {
            const num = parseInt(color.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = Math.max(0, (num >> 16) - amt);
            const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
            const B = Math.max(0, (num & 0x0000FF) - amt);
            return 'rgb(' + R + ',' + G + ',' + B + ')';
        }
    }

    function normalizeAngle(angle) {
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        return angle;
    }

    function addMuzzleFlash(x, y, angle, color) {
        game.effects.push({
            type: 'muzzle',
            x: x + Math.cos(angle) * 15,
            y: y + Math.sin(angle) * 15,
            angle: angle,
            color: color,
            life: 0.1,
            maxLife: 0.1
        });
    }

    function addHitEffect(x, y, color) {
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            game.effects.push({
                type: 'particle',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: 2 + Math.random() * 2,
                life: 0.3,
                maxLife: 0.3
            });
        }
    }

    function addDeathEffect(x, y, color) {
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            game.effects.push({
                type: 'particle',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: 3 + Math.random() * 3,
                life: 0.5,
                maxLife: 0.5
            });
        }
    }

    let damageFlashAlpha = 0;
    function addDamageFlash() {
        damageFlashAlpha = 0.4;
    }

    function drawGrid() {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;

        for (let x = 0; x <= CONFIG.GRID_COLS; x++) {
            ctx.beginPath();
            ctx.moveTo(x * CONFIG.CELL_SIZE, 0);
            ctx.lineTo(x * CONFIG.CELL_SIZE, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= CONFIG.GRID_ROWS; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * CONFIG.CELL_SIZE);
            ctx.lineTo(canvas.width, y * CONFIG.CELL_SIZE);
            ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(255, 107, 107, 0.3)';
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    }

    function drawBullets() {
        game.bullets.forEach(function (bullet) {
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
            ctx.fillStyle = bullet.color;
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(bullet.x, bullet.y);
            ctx.lineTo(bullet.x - bullet.vx * 2, bullet.y - bullet.vy * 2);
            ctx.strokeStyle = bullet.color;
            ctx.globalAlpha = 0.5;
            ctx.lineWidth = bullet.radius;
            ctx.stroke();
            ctx.globalAlpha = 1;
        });
    }

    function drawEffects(dt) {
        game.effects = game.effects.filter(function (effect) {
            effect.life -= dt;
            if (effect.life <= 0) return false;

            const alpha = effect.life / effect.maxLife;

            if (effect.type === 'muzzle') {
                ctx.save();
                ctx.translate(effect.x, effect.y);
                ctx.rotate(effect.angle);
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(15, -6);
                ctx.lineTo(20, 0);
                ctx.lineTo(15, 6);
                ctx.closePath();
                ctx.fillStyle = effect.color;
                ctx.fill();
                ctx.restore();
                ctx.globalAlpha = 1;
            } else if (effect.type === 'particle') {
                effect.x += effect.vx;
                effect.y += effect.vy;
                effect.vx *= 0.95;
                effect.vy *= 0.95;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.size * alpha, 0, Math.PI * 2);
                ctx.fillStyle = effect.color;
                ctx.fill();
                ctx.globalAlpha = 1;
            }
            return true;
        });
    }

    function updateBullets(dt) {
        const now = performance.now();
        game.bullets = game.bullets.filter(function (bullet) {
            bullet.x += bullet.vx * dt * 60;
            bullet.y += bullet.vy * dt * 60;
            bullet.life++;

            if (bullet.life > bullet.maxLife) return false;
            if (bullet.x < -10 || bullet.x > canvas.width + 10 ||
                bullet.y < -10 || bullet.y > canvas.height + 10) {
                return false;
            }

            for (let i = 0; i < game.enemies.length; i++) {
                const enemy = game.enemies[i];
                if (enemy.dead) continue;
                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < bullet.radius + enemy.radius) {
                    enemy.takeDamage(bullet, game.player, now);
                    if (bullet.side === 'dual') {
                        game.stats.dualGunHits++;
                    } else {
                        game.stats.singleGunHits++;
                    }
                    return false;
                }
            }
            return true;
        });
    }

    function spawnWaveEnemies() {
        const waveConfig = CONFIG.WAVE_ENEMIES[game.wave - 1];
        game.spawnQueue = [];

        for (let i = 0; i < waveConfig.light; i++) {
            game.spawnQueue.push({ type: 'light', delay: i * 200 });
        }
        for (let i = 0; i < waveConfig.heavy; i++) {
            game.spawnQueue.push({ type: 'heavy', delay: waveConfig.light * 200 + i * 400 });
        }

        game.stats.totalEnemies += waveConfig.light + waveConfig.heavy;
        game.spawnTimer = performance.now();
        saveGame(performance.now(), '波次生成');
    }

    function getSpawnPosition() {
        const side = Math.floor(Math.random() * 4);
        const margin = 30;

        switch (side) {
            case 0:
                return { x: Math.random() * canvas.width, y: margin };
            case 1:
                return { x: canvas.width - margin, y: Math.random() * canvas.height };
            case 2:
                return { x: Math.random() * canvas.width, y: canvas.height - margin };
            case 3:
                return { x: margin, y: Math.random() * canvas.height };
        }
    }

    function updateSpawns(now) {
        const elapsed = now - game.spawnTimer;
        const beforeLen = game.spawnQueue.length;
        game.spawnQueue = game.spawnQueue.filter(function (item) {
            if (elapsed >= item.delay) {
                const config = item.type === 'light' ? CONFIG.ENEMY_LIGHT : CONFIG.ENEMY_HEAVY;
                const pos = getSpawnPosition();
                game.enemies.push(new Enemy(config, pos.x, pos.y));
                return false;
            }
            return true;
        });
        if (beforeLen !== game.spawnQueue.length) {
            saveGame(now, '敌人生成');
        }
    }

    function updateEnemies(dt, now) {
        game.enemies.forEach(function (enemy) { enemy.update(dt, game.player, now); });
        const beforeLen = game.enemies.length;
        game.enemies = game.enemies.filter(function (enemy) { return !enemy.dead; });
        if (beforeLen !== game.enemies.length) {
            saveGame(now, '敌人清理');
        }
    }

    function checkWaveProgress(now) {
        if (game.state !== GameState.PLAYING) return;

        if (game.wave === 0) {
            game.wave = 1;
            spawnWaveEnemies();
            return;
        }

        if (game.spawnQueue.length === 0 && game.enemies.length === 0) {
            if (game.wave >= CONFIG.WAVES) {
                game.state = GameState.VICTORY;
                showGameEnd(true);
            } else {
                game.state = GameState.WAVE_BREAK;
                game.waveBreakTimer = now;
                showWaveBreak();
                saveGame(now, '波次间隙');
            }
        }
    }

    function updateWaveBreak(now) {
        if (game.state !== GameState.WAVE_BREAK) return;

        if (now - game.waveBreakTimer >= 3000) {
            game.wave++;
            spawnWaveEnemies();
            game.state = GameState.PLAYING;
            hideWaveBreak();
        }
    }

    function showWaveBreak() {
        const overlay = document.getElementById('status-overlay');
        const title = document.getElementById('overlay-title');
        const msg = document.getElementById('overlay-message');
        title.textContent = '第 ' + game.wave + ' 波清除!';
        msg.textContent = '准备第 ' + (game.wave + 1) + ' 波...';
        overlay.classList.remove('hidden');
        document.getElementById('overlay-btn').classList.add('hidden');
        document.getElementById('result-stats').classList.add('hidden');
    }

    function hideWaveBreak() {
        document.getElementById('status-overlay').classList.add('hidden');
    }

    function showGameEnd(victory) {
        clearSavedGame();
        submitStats(victory);
        const overlay = document.getElementById('status-overlay');
        const title = document.getElementById('overlay-title');
        const msg = document.getElementById('overlay-message');
        const resultDiv = document.getElementById('result-stats');
        const btn = document.getElementById('overlay-btn');

        title.textContent = victory ? '🎉 胜利！' : '💀 失败！';
        msg.textContent = victory ? '你成功抵御了所有敌人！' : '你倒下了...下次再来！';

        const dualRate = game.stats.dualGunShots > 0
            ? ((game.stats.dualGunHits / game.stats.dualGunShots) * 100).toFixed(1) + '%'
            : '0%';
        const singleRate = game.stats.singleGunShots > 0
            ? ((game.stats.singleGunHits / game.stats.singleGunShots) * 100).toFixed(1) + '%'
            : '0%';
        const stationaryRatio = game.totalTime > 0
            ? ((game.stationaryTime / game.totalTime) * 100).toFixed(1) + '%'
            : '0%';

        resultDiv.innerHTML =
            '<div class="result-grade">评分计算中...</div>' +
            '<div class="result-row"><span class="result-label">关卡</span><span class="result-value">' + game.level + '</span></div>' +
            '<div class="result-row"><span class="result-label">波次</span><span class="result-value">' + game.wave + '/' + CONFIG.WAVES + '</span></div>' +
            '<div class="result-row"><span class="result-label">剩余HP</span><span class="result-value">' + game.player.hp + '/' + CONFIG.PLAYER_MAX_HP + '</span></div>' +
            '<div class="result-row"><span class="result-label">总时长</span><span class="result-value">' + game.totalTime.toFixed(1) + 's</span></div>' +
            '<div class="result-row"><span class="result-label">击杀敌人</span><span class="result-value">' + game.stats.enemiesKilled + '/' + game.stats.totalEnemies + '</span></div>' +
            '<div class="result-row"><span class="result-label">双枪命中率</span><span class="result-value">' + dualRate + '</span></div>' +
            '<div class="result-row"><span class="result-label">单枪命中率</span><span class="result-value">' + singleRate + '</span></div>' +
            '<div class="result-row"><span class="result-label">站桩占比</span><span class="result-value">' + stationaryRatio + '</span></div>' +
            '<div class="result-row"><span class="result-label">造成伤害</span><span class="result-value">' + game.stats.damageDealt + '</span></div>' +
            '<div class="result-row"><span class="result-label">受到伤害</span><span class="result-value">' + game.stats.damageTaken + '</span></div>' +
            '<div class="result-row"><span class="result-label">换弹次数</span><span class="result-value">' + game.stats.reloadCount + '</span></div>';

        resultDiv.classList.remove('hidden');
        btn.textContent = '再来一局';
        btn.classList.remove('hidden');
        const newBtn = document.getElementById('new-game-btn');
        if (newBtn) newBtn.remove();
        overlay.classList.remove('hidden');
    }

    async function submitStats(victory) {
        const payload = {
            level_id: game.level,
            cleared: victory,
            remaining_hp: game.player.hp,
            total_time: game.totalTime,
            dual_gun_shots: game.stats.dualGunShots,
            dual_gun_hits: game.stats.dualGunHits,
            single_gun_shots: game.stats.singleGunShots,
            single_gun_hits: game.stats.singleGunHits,
            stationary_time: game.stationaryTime,
            enemies_killed: game.stats.enemiesKilled,
            total_enemies: game.stats.totalEnemies,
            damage_dealt: game.stats.damageDealt,
            damage_taken: game.stats.damageTaken,
            reload_count: game.stats.reloadCount
        };

        try {
            const response = await fetch('/api/gunshoot/stats/set', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (result.code === 0 && result.data) {
                const gradeEl = document.querySelector('.result-grade');
                if (gradeEl) {
                    gradeEl.textContent = '评级: ' + result.data.grade + ' | 分数: ' + result.data.score;
                }
            }
        } catch (e) {
            console.error('提交统计失败', e);
            const gradeEl = document.querySelector('.result-grade');
            if (gradeEl) {
                gradeEl.textContent = '已完成（离线）';
            }
        }
    }

    function updateHUD(now) {
        document.getElementById('stat-level').textContent = game.level;
        document.getElementById('stat-wave').textContent = game.wave + '/' + CONFIG.WAVES;
        document.getElementById('stat-enemies').textContent = game.enemies.length + game.spawnQueue.length;
        document.getElementById('stat-time').textContent = game.totalTime.toFixed(1) + 's';

        const hpRatio = game.player.hp / CONFIG.PLAYER_MAX_HP;
        document.getElementById('hp-fill').style.width = (hpRatio * 100) + '%';
        document.getElementById('hp-text').textContent = game.player.hp + '/' + CONFIG.PLAYER_MAX_HP;

        updateMagazineDisplay(game.player.leftGun, 'left', now);
        updateMagazineDisplay(game.player.rightGun, 'right', now);

        const stationaryIndicator = document.getElementById('stationary-indicator');
        if (now < game.player.dualStationaryUntil) {
            stationaryIndicator.classList.add('active');
        } else {
            stationaryIndicator.classList.remove('active');
        }

        const moveLockIndicator = document.getElementById('move-lock-indicator');
        if (now < game.player.moveLockedUntil) {
            moveLockIndicator.classList.add('active');
        } else {
            moveLockIndicator.classList.remove('active');
        }

        const dualRate = game.stats.dualGunShots > 0
            ? ((game.stats.dualGunHits / game.stats.dualGunShots) * 100).toFixed(1) + '%'
            : '0%';
        const singleRate = game.stats.singleGunShots > 0
            ? ((game.stats.singleGunHits / game.stats.singleGunShots) * 100).toFixed(1) + '%'
            : '0%';
        const stationaryRatio = game.totalTime > 0
            ? ((game.stationaryTime / game.totalTime) * 100).toFixed(1) + '%'
            : '0%';

        document.getElementById('stat-dual-rate').textContent = dualRate;
        document.getElementById('stat-single-rate').textContent = singleRate;
        document.getElementById('stat-stationary').textContent = stationaryRatio;
        document.getElementById('stat-kills').textContent = game.stats.enemiesKilled;
        document.getElementById('stat-dmg-dealt').textContent = game.stats.damageDealt;
        document.getElementById('stat-dmg-taken').textContent = game.stats.damageTaken;
        document.getElementById('stat-reloads').textContent = game.stats.reloadCount;
    }

    function updateMagazineDisplay(gun, side, now) {
        const sideL = side === 'left';
        const fill = document.getElementById(sideL ? 'left-mag-fill' : 'right-mag-fill');
        const text = document.getElementById(sideL ? 'left-mag-text' : 'right-mag-text');
        const reloadBar = document.getElementById(sideL ? 'left-reload-bar' : 'right-reload-bar');
        const reloadFill = document.getElementById(sideL ? 'left-reload-fill' : 'right-reload-fill');

        if (gun.reloading) {
            fill.style.width = '0%';
            text.textContent = '换弹中';
            reloadBar.classList.remove('hidden');
            const elapsed = now - gun.reloadStart;
            const ratio = Math.min(1, elapsed / gun.reloadDuration);
            reloadFill.style.width = (ratio * 100) + '%';
        } else {
            reloadBar.classList.add('hidden');
            const ratio = gun.ammo / gun.maxAmmo;
            fill.style.width = (ratio * 100) + '%';
            text.textContent = gun.ammo + '/' + gun.maxAmmo;
        }
    }

    function showStartScreen() {
        const overlay = document.getElementById('status-overlay');
        const title = document.getElementById('overlay-title');
        const msg = document.getElementById('overlay-message');
        title.textContent = '🎯 双枪战场';
        msg.textContent = '按 空格键 开始游戏';
        overlay.classList.remove('hidden');
        document.getElementById('overlay-btn').classList.add('hidden');
        document.getElementById('result-stats').classList.add('hidden');
        const newBtn = document.getElementById('new-game-btn');
        if (newBtn) newBtn.remove();
    }

    function showLoadDialog() {
        const overlay = document.getElementById('status-overlay');
        const title = document.getElementById('overlay-title');
        const msg = document.getElementById('overlay-message');
        const resultDiv = document.getElementById('result-stats');
        const btn = document.getElementById('overlay-btn');

        const info = getSavedGameInfo();
        title.textContent = '📂 发现未完成的存档';
        if (info) {
            msg.innerHTML =
                '检测到上次游戏进度：<br>' +
                '<b>波次 ' + info.wave + '/5 | HP ' + info.hp + '/80 | 左弹 ' + info.leftAmmo + ' | 右弹 ' + info.rightAmmo + ' | 敌 ' + info.enemies + '</b><br>' +
                '选择是否继续上次进度？';
        } else {
            msg.innerHTML = '检测到上次未完成的游戏记录<br>选择是否继续上次进度？';
        }

        resultDiv.classList.add('hidden');
        overlay.classList.remove('hidden');

        btn.textContent = '继续游戏';
        btn.classList.remove('hidden');
        btn.onclick = function () {
            if (loadGame()) {
                const newBtn = document.getElementById('new-game-btn');
                if (newBtn) newBtn.remove();
                document.getElementById('overlay-title').textContent = '⏸ 已恢复存档';
                document.getElementById('overlay-message').textContent = '按 空格键 继续游戏';
                document.getElementById('result-stats').classList.add('hidden');
                btn.textContent = '重新开始';
                btn.onclick = function () { startGame(); };
                game.state = GameState.PAUSED;
            } else {
                document.getElementById('overlay-title').textContent = '⚠ 读档失败';
                document.getElementById('overlay-message').textContent = '存档已损坏或无法读取，请选择新游戏';
            }
        };

        const oldNewBtn = document.getElementById('new-game-btn');
        if (oldNewBtn) oldNewBtn.remove();

        const newBtn = document.createElement('button');
        newBtn.className = 'btn-primary';
        newBtn.style.marginLeft = '10px';
        newBtn.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
        newBtn.textContent = '新游戏';
        newBtn.id = 'new-game-btn';
        newBtn.onclick = function () {
            clearSavedGame();
            const toRemove = document.getElementById('new-game-btn');
            if (toRemove) toRemove.remove();
            btn.onclick = function () { startGame(); };
            startGame();
        };
        btn.parentNode.insertBefore(newBtn, btn.nextSibling);
    }

    function startGame() {
        clearSavedGame();
        const newBtn = document.getElementById('new-game-btn');
        if (newBtn) newBtn.remove();
        const btn = document.getElementById('overlay-btn');
        btn.onclick = function () { startGame(); };

        game.state = GameState.PLAYING;
        game.level = 1;
        game.wave = 0;
        game.totalTime = 0;
        game.stationaryTime = 0;
        game.enemies = [];
        game.bullets = [];
        game.effects = [];
        game.spawnQueue = [];
        game.stats = {
            dualGunShots: 0,
            dualGunHits: 0,
            singleGunShots: 0,
            singleGunHits: 0,
            enemiesKilled: 0,
            totalEnemies: 0,
            damageDealt: 0,
            damageTaken: 0,
            reloadCount: 0
        };
        game.player = new Player();

        document.getElementById('status-overlay').classList.add('hidden');
    }

    function togglePause() {
        const overlay = document.getElementById('status-overlay');
        const title = document.getElementById('overlay-title');
        const msg = document.getElementById('overlay-message');
        const btn = document.getElementById('overlay-btn');

        if (game.state === GameState.PLAYING) {
            game.state = GameState.PAUSED;
            saveGame(performance.now(), '暂停');
            title.textContent = '⏸ 暂停';
            msg.textContent = '按 空格键 继续';
            overlay.classList.remove('hidden');
            btn.classList.add('hidden');
            document.getElementById('result-stats').classList.add('hidden');
            const newBtn = document.getElementById('new-game-btn');
            if (newBtn) newBtn.remove();
        } else if (game.state === GameState.PAUSED) {
            game.state = GameState.PLAYING;
            overlay.classList.add('hidden');
            btn.onclick = function () { startGame(); };
            const newBtn = document.getElementById('new-game-btn');
            if (newBtn) newBtn.remove();
        }
    }

    let lastTime = 0;
    function gameLoop(timestamp) {
        if (!lastTime) lastTime = timestamp;
        let dt = (timestamp - lastTime) / 1000;
        dt = Math.min(dt, 0.05);
        lastTime = timestamp;

        const now = timestamp;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawGrid();

        if (damageFlashAlpha > 0) {
            ctx.fillStyle = 'rgba(255, 0, 0, ' + damageFlashAlpha + ')';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            damageFlashAlpha -= dt * 2;
        }

        if (game.state === GameState.PLAYING) {
            game.totalTime += dt;
            game.player.update(dt, now);
            updateBullets(dt);
            updateEnemies(dt, now);
            updateSpawns(now);
            checkWaveProgress(now);
        } else if (game.state === GameState.WAVE_BREAK) {
            updateWaveBreak(now);
            if (game.player) game.player.update(dt, now);
        }

        drawBullets();
        game.enemies.forEach(function (enemy) { enemy.draw(ctx); });
        if (game.player) {
            game.player.draw(ctx, now);
        }
        drawEffects(dt);

        if (game.player) {
            updateHUD(now);
        }

        if (now - lastAutosave > AUTOSAVE_INTERVAL) {
            saveGame(now);
            lastAutosave = now;
        }

        requestAnimationFrame(gameLoop);
    }

    document.addEventListener('keydown', function (e) {
        const key = e.key;
        game.keys[key] = true;

        if (key === ' ') {
            e.preventDefault();
            if (game.state === GameState.MENU) {
                const overlayTitle = document.getElementById('overlay-title').textContent;
                if (hasSavedGame() && overlayTitle.includes('存档')) {
                    if (loadGame()) {
                        const newBtn = document.getElementById('new-game-btn');
                        if (newBtn) newBtn.remove();
                        document.getElementById('overlay-title').textContent = '⏸ 已恢复存档';
                        document.getElementById('overlay-message').textContent = '按 空格键 继续游戏';
                        const btn = document.getElementById('overlay-btn');
                        btn.textContent = '重新开始';
                        btn.onclick = function () { startGame(); };
                        game.state = GameState.PAUSED;
                    } else {
                        document.getElementById('overlay-title').textContent = '⚠ 读档失败';
                        document.getElementById('overlay-message').textContent = '存档已损坏，请点击按钮开始新游戏';
                    }
                } else {
                    startGame();
                }
            } else if (game.state === GameState.GAME_OVER || game.state === GameState.VICTORY) {
                startGame();
            } else {
                togglePause();
            }
        }

        if ((key === 'r' || key === 'R') && game.player && game.state === GameState.PLAYING) {
            game.player.startReload(performance.now());
        }

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(key) !== -1) {
            e.preventDefault();
        }
    });

    document.addEventListener('keyup', function (e) {
        game.keys[e.key] = false;
    });

    document.getElementById('overlay-btn').addEventListener('click', function () {
        startGame();
    });

    window.addEventListener('beforeunload', function (e) {
        const saved = saveGame(performance.now(), '页面关闭');
        console.log('[页面关闭前存档] ' + (saved ? '成功' : '跳过'));
    });

    window.addEventListener('pagehide', function () {
        saveGame(performance.now(), '页面隐藏');
    });

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            saveGame(performance.now(), '页面切后台');
        }
    });

    function init() {
        console.log('=== 双枪战场 初始化 ===');
        console.log('localStorage 可用: ' + (typeof localStorage !== 'undefined'));
        const existing = hasSavedGame();
        console.log('是否存在存档: ' + existing);
        if (existing) {
            const info = getSavedGameInfo();
            if (info) {
                console.log('存档内容: 波次=' + info.wave + ' HP=' + info.hp + ' 左弹=' + info.leftAmmo + ' 右弹=' + info.rightAmmo + ' 敌人=' + info.enemies);
            }
        }

        game.state = GameState.MENU;
        game.player = new Player();

        if (hasSavedGame()) {
            showLoadDialog();
        } else {
            showStartScreen();
        }
        requestAnimationFrame(gameLoop);
    }

    init();
})();
