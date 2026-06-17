(function() {
    'use strict';

    var C = {
        GRAVITY: 0.6,
        JUMP_FORCE: -13,
        BASE_SPEED: 6,
        MAX_SPEED: 12,
        SPEED_INCR: 0.0004,
        SLIDE_DURATION: 36,
        SKYLIGHT_BREAK_DELAY: 18,
        NIGHT_DISTANCE: 1500,
        NIGHT_TRANSITION: 500,
        LETTER_PROB: 0.15,
        MIN_GAP: 220,
        MAX_GAP: 400,
        ROOF_MIN_W: 200,
        ROOF_MAX_W: 500,
        ROOF_GAP_MIN: 60,
        ROOF_GAP_MAX: 120,
        PLAYER_W: 30,
        PLAYER_H: 50,
        SLIDE_H: 18,
        CHIMNEY_W: 35,
        CHIMNEY_H: 45,
        CLOTHESLINE_H: 25,
        SKYLIGHT_W: 50,
        SKYLIGHT_H: 10,
        LETTER_SIZE: 24,
        JUMP_HOLD_MIN: 100,
        JUMP_HOLD_MAX: 400,
        JUMP_EXTRA_FORCE_MIN: 0,
        JUMP_EXTRA_FORCE_MAX: 3.5
    };

    var STORIES = [
        { id: 1, title: '旧城记忆·壹', content: '这座城市曾经没有霓虹。老人们说，那时候的天空是真正的橙色，不是灯管的颜色...' },
        { id: 2, title: '旧城记忆·贰', content: '第七区的屋顶花园是最后一片绿地。他们把它拆了，建了信号塔。那天晚上，整个城市都听到了花的声音...' },
        { id: 3, title: '旧城记忆·叁', content: '废弃的地铁站里还有旧时代的广告牌。上面写着"欢迎回家"。没人记得家是什么样子了...' },
        { id: 4, title: '旧城记忆·肆', content: '档案馆的地下室里保存着最后一张纸质照片。照片上是一条河，河上还有船。现在那条河是光缆通道...' },
        { id: 5, title: '霓虹之下·壹', content: '跑者们之间流传着一个传说：在天际线的尽头，有一扇还亮着暖光的窗。那是唯一不用霓虹管发出的光...' },
        { id: 6, title: '霓虹之下·贰', content: '你在屋顶发现的第一个信封里只有一行字："如果你在跑，就还没放弃。" 你不知道是谁写的，但你一直在跑...' },
        { id: 7, title: '霓虹之下·叁', content: '每个跑者的鞋底都刻着同样的符号。没人知道是谁先刻的，但所有在屋顶奔跑的人都知道那个记号的意思——继续...' },
        { id: 8, title: '霓虹之下·肆', content: '第三区的信号塔每晚都会广播同一句话。有人说那是故障，有人说那是密码。跑者们觉得那是一句问候："你还好吗？"...' },
        { id: 9, title: '天际线彼端·壹', content: '传说在天际线的另一边，天空还是天空，不是屏幕。跑者们管那个地方叫"外面"...' },
        { id: 10, title: '天际线彼端·贰', content: '你找到的最后一封信里夹着一张地图。上面标注的不是街道，是屋顶。每条路线的终点都写着同一个字："走"...' },
        { id: 11, title: '天际线彼端·叁', content: '最高的那栋楼顶上，霓虹终于够不着了。在那里你第一次看到了星星。它们不是LED的，是真的...' },
        { id: 12, title: '天际线彼端·肆', content: '你站在城市的最高点，风从"外面"吹来。你把所有信封撕碎，让碎片飞向远方。也许有人会捡到，也许不会。但你自由了。' }
    ];

    var STATE = { MENU: 0, COUNTDOWN: 1, PLAYING: 2, GAMEOVER: 3 };
    var OBSTACLE = { CHIMNEY: 0, CLOTHESLINE: 1, SKYLIGHT: 2 };

    var canvas, ctx;
    var W, H;
    var gameState = STATE.MENU;
    var playerName = '';
    var distance = 0;
    var speed = C.BASE_SPEED;
    var nightProgress = 0;
    var frameCount = 0;
    var collectedLettersThisRun = [];
    var pendingLetterSaves = [];

    var player = {};
    var roofs = [];
    var obstacles = [];
    var letterPickups = [];
    var particles = [];
    var bgLayers = [];
    var neonSigns = [];

    var keys = {};
    var jumpPressTime = 0;
    var jumpHeld = false;
    var cachedEls = {};

    var STORAGE_KEY = 'skyline_runner_save';

    function saveToStorage(key, value) {
        try {
            var data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            data[key] = value;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {}
    }

    function loadFromStorage(key) {
        try {
            var data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            return data[key];
        } catch (e) { return null; }
    }

    function $(id) {
        if (!cachedEls[id]) {
            cachedEls[id] = document.getElementById(id);
        }
        return cachedEls[id];
    }

    function init() {
        canvas = document.getElementById('game-canvas');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }
        ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Canvas 2D context not supported');
            return;
        }
        resize();
        window.addEventListener('resize', function() {
            resize();
            initBgLayers();
            initNeonSigns();
            if (gameState === STATE.MENU) {
                resetGame();
            }
        });
        setupInput();
        setupUI();
        initBgLayers();
        initNeonSigns();
        resetGame();

        var savedName = loadFromStorage('playerName');
        if (savedName) {
            playerName = savedName;
            var nameInput = $('player-name');
            if (nameInput) nameInput.value = savedName;
        }

        showOverlay('main-menu');
        requestAnimationFrame(loop);
    }

    function resize() {
        if (!canvas) return;
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    function setupInput() {
        document.addEventListener('keydown', function(e) {
            if (e.code === 'Space') {
                e.preventDefault();
                if (!keys.space) {
                    keys.space = true;
                    jumpPressTime = Date.now();
                    jumpHeld = true;
                }
            }
            if (e.code === 'KeyS') {
                e.preventDefault();
                keys.s = true;
            }
        });
        document.addEventListener('keyup', function(e) {
            if (e.code === 'Space') {
                e.preventDefault();
                keys.space = false;
                if (jumpHeld && gameState === STATE.PLAYING) {
                    var holdTime = Date.now() - jumpPressTime;
                    playerJump(holdTime);
                    jumpHeld = false;
                }
            }
            if (e.code === 'KeyS') {
                keys.s = false;
            }
        });

        var btnJump = document.getElementById('btn-jump');
        var btnSlide = document.getElementById('btn-slide');
        if (btnJump) {
            btnJump.addEventListener('touchstart', function(e) {
                e.preventDefault();
                keys.space = true;
                jumpPressTime = Date.now();
                jumpHeld = true;
            }, { passive: false });
            btnJump.addEventListener('touchend', function(e) {
                e.preventDefault();
                keys.space = false;
                if (jumpHeld && gameState === STATE.PLAYING) {
                    var holdTime = Date.now() - jumpPressTime;
                    playerJump(holdTime);
                    jumpHeld = false;
                }
            }, { passive: false });
        }
        if (btnSlide) {
            btnSlide.addEventListener('touchstart', function(e) {
                e.preventDefault();
                keys.s = true;
            }, { passive: false });
            btnSlide.addEventListener('touchend', function(e) {
                e.preventDefault();
                keys.s = false;
            }, { passive: false });
        }
    }

    function playerJump(holdTime) {
        if (player.jumping || player.sliding || player.falling) return;
        player.jumping = true;
        player.vy = C.JUMP_FORCE;
        var t = Math.min(Math.max(holdTime, C.JUMP_HOLD_MIN), C.JUMP_HOLD_MAX);
        var ratio = (t - C.JUMP_HOLD_MIN) / (C.JUMP_HOLD_MAX - C.JUMP_HOLD_MIN);
        player.extraVx = C.JUMP_EXTRA_FORCE_MIN + ratio * (C.JUMP_EXTRA_FORCE_MAX - C.JUMP_EXTRA_FORCE_MIN);
        player.jumpFrame = 0;
    }

    function setupUI() {
        var btn;
        btn = document.getElementById('btn-start');
        if (btn) btn.addEventListener('click', startGame);
        btn = document.getElementById('btn-leaderboard');
        if (btn) btn.addEventListener('click', showLeaderboard);
        btn = document.getElementById('btn-letters');
        if (btn) btn.addEventListener('click', showLetters);
        btn = document.getElementById('btn-restart');
        if (btn) btn.addEventListener('click', startGame);
        btn = document.getElementById('btn-back-menu');
        if (btn) btn.addEventListener('click', showMenu);
        btn = document.getElementById('btn-lb-back');
        if (btn) btn.addEventListener('click', function() {
            showOverlay('main-menu');
        });
        btn = document.getElementById('btn-let-back');
        if (btn) btn.addEventListener('click', function() {
            showOverlay('main-menu');
        });
        btn = document.getElementById('btn-letter-close');
        if (btn) btn.addEventListener('click', function() {
            var popup = document.getElementById('letter-popup');
            if (popup) popup.classList.remove('active');
        });
    }

    function showOverlay(id) {
        var overlays = document.querySelectorAll('.overlay');
        overlays.forEach(function(o) { o.classList.remove('active'); });
        var mobileControls = $('mobile-controls');
        if (mobileControls) {
            if (id === 'hud') {
                mobileControls.style.zIndex = '15';
                mobileControls.style.opacity = '1';
            } else {
                mobileControls.style.zIndex = '5';
                mobileControls.style.opacity = '0';
            }
        }
        if (id) {
            var el = $(id);
            if (el) el.classList.add('active');
        }
    }

    function showMenu() {
        gameState = STATE.MENU;
        showOverlay('main-menu');
    }

    function startGame() {
        var nameInput = $('player-name');
        playerName = (nameInput && nameInput.value.trim()) || '';
        if (!playerName) {
            alert('请先输入昵称再开始游戏！');
            if (nameInput) nameInput.focus();
            return;
        }
        if (nameInput) nameInput.value = playerName;
        saveToStorage('playerName', playerName);

        resetGame();
        gameState = STATE.COUNTDOWN;
        showOverlay('countdown-overlay');
        runCountdown(3);
    }

    function runCountdown(n) {
        var el = $('countdown-text');
        if (!el) return;
        if (n <= 0) {
            el.textContent = 'GO!';
            setTimeout(function() {
                gameState = STATE.PLAYING;
                showOverlay('hud');
            }, 400);
            return;
        }
        el.textContent = n;
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = 'countPulse 0.5s ease-out';
        setTimeout(function() { runCountdown(n - 1); }, 800);
    }

    function resetGame() {
        distance = 0;
        speed = C.BASE_SPEED;
        nightProgress = 0;
        frameCount = 0;
        collectedLettersThisRun = [];
        pendingLetterSaves = [];
        obstacles = [];
        letterPickups = [];
        particles = [];

        player = {
            x: 100,
            y: 0,
            vy: 0,
            vx: 0,
            extraVx: 0,
            w: C.PLAYER_W,
            h: C.PLAYER_H,
            jumping: false,
            sliding: false,
            slideTimer: 0,
            falling: false,
            fallSpeed: 0,
            onGround: true,
            currentRoof: null,
            jumpFrame: 0,
            runFrame: 0,
            slideFrame: 0
        };

        roofs = [];
        var startX = 0;
        var firstRoofY = H * 0.72;
        var firstRoofW = Math.max(W * 0.4, 500);
        roofs.push({
            x: startX,
            y: firstRoofY,
            w: firstRoofW,
            h: 35,
            roofY: firstRoofY
        });
        startX += firstRoofW + C.ROOF_GAP_MIN;

        var prevRoofY = firstRoofY;
        var safeCount = 3;
        while (startX < W + 800) {
            var rw = C.ROOF_MIN_W + Math.random() * (C.ROOF_MAX_W - C.ROOF_MIN_W);
            var yVariation = safeCount > 0 ? 0.03 : 0.08;
            var roofY = prevRoofY + (Math.random() - 0.5) * H * yVariation;
            roofY = Math.max(H * 0.5, Math.min(H * 0.82, roofY));
            roofs.push({
                x: startX,
                y: roofY,
                w: rw,
                h: 30 + Math.random() * 20,
                roofY: roofY
            });
            var gap = C.ROOF_GAP_MIN + Math.random() * (C.ROOF_GAP_MAX - C.ROOF_GAP_MIN);
            if (safeCount > 0) gap = C.ROOF_GAP_MIN + 10;
            startX += rw + gap;
            prevRoofY = roofY;
            safeCount--;
        }

        player.y = roofs[0].y - C.PLAYER_H;
        player.currentRoof = roofs[0];
    }

    function initBgLayers() {
        bgLayers = [];
        for (var i = 0; i < 4; i++) {
            var buildings = [];
            var bx = 0;
            while (bx < W + 400) {
                var bw = 40 + Math.random() * 80;
                var bh = 80 + Math.random() * 250;
                buildings.push({ x: bx, w: bw, h: bh });
                bx += bw + Math.random() * 20;
            }
            bgLayers.push({
                buildings: buildings,
                speed: 0.2 + i * 0.3,
                y: H,
                color: i,
                offset: 0
            });
        }
    }

    function initNeonSigns() {
        neonSigns = [];
        var colors = ['#FF1493', '#00FFFF', '#39FF14', '#FF6B35', '#FFA62F', '#FF00FF'];
        for (var i = 0; i < 15; i++) {
            neonSigns.push({
                x: Math.random() * W * 3,
                y: H * 0.2 + Math.random() * H * 0.4,
                w: 30 + Math.random() * 60,
                h: 10 + Math.random() * 20,
                color: colors[Math.floor(Math.random() * colors.length)],
                flickerSpeed: 0.02 + Math.random() * 0.04,
                flickerPhase: Math.random() * Math.PI * 2,
                text: ['酒', '宿', '食', 'BAR', 'OPEN', '24H', '電', '薬', '24H', 'HOTEL', 'NEON', '舞', '福', '龍', '光'][i]
            });
        }
    }

    function loop() {
        if (gameState === STATE.PLAYING) {
            update();
        }
        render();
        frameCount++;
        requestAnimationFrame(loop);
    }

    function update() {
        speed = Math.min(C.BASE_SPEED + distance * C.SPEED_INCR, C.MAX_SPEED);
        distance += speed * 0.1;

        if (distance > C.NIGHT_DISTANCE) {
            var t = Math.min((distance - C.NIGHT_DISTANCE) / C.NIGHT_TRANSITION, 1);
            nightProgress = t;
        }

        updatePlayer();
        updateRoofs();
        updateObstacles();
        updateLetterPickups();
        updateParticles();

        if (keys.s && !player.sliding && !player.jumping && !player.falling) {
            player.sliding = true;
            player.slideTimer = C.SLIDE_DURATION;
            player.h = C.SLIDE_H;
            player.y = player.currentRoof.y - C.SLIDE_H;
        }

        if (player.sliding) {
            player.slideTimer--;
            if (player.slideTimer <= 0) {
                player.sliding = false;
                player.h = C.PLAYER_H;
                player.y = player.currentRoof.y - C.PLAYER_H;
            }
        }

        player.runFrame += 0.15;

        var hudDist = $('hud-dist');
        var hudLetters = $('hud-letters');
        if (hudDist) hudDist.textContent = Math.floor(distance);
        if (hudLetters) hudLetters.textContent = collectedLettersThisRun.length;
    }

    function updatePlayer() {
        if (player.falling) {
            player.fallSpeed += C.GRAVITY;
            player.y += player.fallSpeed;

            for (var i = 0; i < roofs.length; i++) {
                var r = roofs[i];
                if (player.fallSpeed > 0 &&
                    player.x + player.w > r.x + 5 &&
                    player.x < r.x + r.w - 5 &&
                    player.y + player.h >= r.y &&
                    player.y + player.h <= r.y + player.fallSpeed + 5) {
                    player.y = r.y - player.h;
                    player.falling = false;
                    player.fallSpeed = 0;
                    player.onGround = true;
                    player.currentRoof = r;
                    break;
                }
            }

            if (player.y > H + 100) {
                gameOver();
            }
            return;
        }

        if (player.jumping) {
            player.vy += C.GRAVITY;
            player.y += player.vy;
            player.x += player.extraVx;
            player.jumpFrame++;
            if (player.extraVx > 0) {
                player.extraVx *= 0.95;
            }

            if (player.vy > 0) {
                for (var j = 0; j < roofs.length; j++) {
                    var jr = roofs[j];
                    if (player.x + player.w > jr.x + 5 &&
                        player.x < jr.x + jr.w - 5 &&
                        player.y + player.h >= jr.y &&
                        player.y + player.h <= jr.y + player.vy + 5) {
                        player.y = jr.y - player.h;
                        player.vy = 0;
                        player.jumping = false;
                        player.extraVx = 0;
                        player.onGround = true;
                        player.currentRoof = jr;
                        break;
                    }
                }
            }

            if (player.y > H + 50) {
                gameOver();
            }
            return;
        }

        if (player.currentRoof) {
            var cr = player.currentRoof;
            if (player.x + player.w < cr.x || player.x > cr.x + cr.w) {
                player.falling = true;
                player.fallSpeed = 2;
                player.onGround = false;
                player.currentRoof = null;
            } else {
                player.y = cr.y - player.h;
            }
        }
    }

    function updateRoofs() {
        for (var i = roofs.length - 1; i >= 0; i--) {
            roofs[i].x -= speed;
        }

        roofs = roofs.filter(function(r) { return r.x + r.w > -100; });

        var lastRoof = roofs[roofs.length - 1];
        while (lastRoof && lastRoof.x + lastRoof.w < W + 800) {
            var gap = C.ROOF_GAP_MIN + Math.random() * (C.ROOF_GAP_MAX - C.ROOF_GAP_MIN);
            var rw = C.ROOF_MIN_W + Math.random() * (C.ROOF_MAX_W - C.ROOF_MIN_W);
            var ry = H * 0.6 + Math.random() * H * 0.15;
            var newRoof = {
                x: lastRoof.x + lastRoof.w + gap,
                y: ry,
                w: rw,
                h: 30 + Math.random() * 20,
                roofY: ry
            };
            roofs.push(newRoof);
            generateObstaclesForRoof(newRoof);
            lastRoof = newRoof;
        }
    }

    function generateObstaclesForRoof(roof) {
        var numObs = Math.floor(Math.random() * 3) + 1;
        var positions = [];
        for (var i = 0; i < numObs; i++) {
            var ox = roof.x + 60 + Math.random() * (roof.w - 120);
            positions.push(ox);
        }
        positions.sort(function(a, b) { return a - b; });

        for (var j = 0; j < positions.length; j++) {
            var type;
            if (j === 0) {
                type = Math.random() < 0.4 ? OBSTACLE.CHIMNEY : (Math.random() < 0.5 ? OBSTACLE.CLOTHESLINE : OBSTACLE.SKYLIGHT);
            } else {
                var r = Math.random();
                type = r < 0.33 ? OBSTACLE.CHIMNEY : (r < 0.66 ? OBSTACLE.CLOTHESLINE : OBSTACLE.SKYLIGHT);
            }

            var obs = { x: positions[j], type: type, roof: roof, broken: false, breakTimer: 0 };
            if (type === OBSTACLE.CHIMNEY) {
                obs.w = C.CHIMNEY_W;
                obs.h = C.CHIMNEY_H;
                obs.y = roof.y - C.CHIMNEY_H;
            } else if (type === OBSTACLE.CLOTHESLINE) {
                obs.w = 70;
                obs.h = C.CLOTHESLINE_H;
                obs.y = roof.y - C.PLAYER_H + 5;
            } else if (type === OBSTACLE.SKYLIGHT) {
                obs.w = C.SKYLIGHT_W;
                obs.h = C.SKYLIGHT_H;
                obs.y = roof.y - C.SKYLIGHT_H;
            }

            var valid = true;
            for (var k = 0; k < obstacles.length; k++) {
                var existing = obstacles[k];
                if (existing.roof === roof && Math.abs(existing.x - obs.x) < 80) {
                    valid = false;
                    break;
                }
            }
            if (valid) {
                obstacles.push(obs);
            }
        }

        if (Math.random() < C.LETTER_PROB) {
            var lx = roof.x + 40 + Math.random() * (roof.w - 80);
            letterPickups.push({
                x: lx,
                y: roof.y - 40,
                w: C.LETTER_SIZE,
                h: C.LETTER_SIZE,
                roof: roof,
                letterId: Math.floor(Math.random() * 12) + 1,
                fragmentIndex: Math.floor(Math.random() * 3) + 1,
                bobPhase: Math.random() * Math.PI * 2
            });
        }
    }

    function updateObstacles() {
        for (var i = obstacles.length - 1; i >= 0; i--) {
            var obs = obstacles[i];
            obs.x -= speed;

            if (obs.type === OBSTACLE.SKYLIGHT && obs.breakTimer > 0) {
                obs.breakTimer--;
                if (obs.breakTimer <= 0) {
                    obs.broken = true;
                    spawnParticles(obs.x + obs.w / 2, obs.y, '#88ccff', 8);
                    player.falling = true;
                    player.fallSpeed = 3;
                    player.onGround = false;
                    player.currentRoof = null;
                }
            }

            if (!obs.broken && checkCollision(player, obs)) {
                if (obs.type === OBSTACLE.CHIMNEY) {
                    if (!player.sliding) {
                        gameOver();
                    }
                } else if (obs.type === OBSTACLE.CLOTHESLINE) {
                    if (!player.sliding) {
                        gameOver();
                    }
                } else if (obs.type === OBSTACLE.SKYLIGHT) {
                    if (obs.breakTimer === 0) {
                        obs.breakTimer = C.SKYLIGHT_BREAK_DELAY;
                    }
                }
            }
        }

        obstacles = obstacles.filter(function(o) { return o.x + o.w > -100; });
    }

    function updateLetterPickups() {
        for (var i = letterPickups.length - 1; i >= 0; i--) {
            var lp = letterPickups[i];
            lp.x -= speed;
            lp.bobPhase += 0.05;

            if (!lp.collected && checkCollision(player, { x: lp.x, y: lp.y + Math.sin(lp.bobPhase) * 5, w: lp.w, h: lp.h })) {
                lp.collected = true;
                collectedLettersThisRun.push({ letterId: lp.letterId, fragmentIndex: lp.fragmentIndex });
                pendingLetterSaves.push({ letterId: lp.letterId, fragmentIndex: lp.fragmentIndex });
                showCollectToast();
                spawnParticles(lp.x + lp.w / 2, lp.y, '#FF1493', 12);
            }
        }

        letterPickups = letterPickups.filter(function(l) { return l.x + l.w > -100; });
    }

    function checkCollision(a, b) {
        return a.x < b.x + b.w &&
               a.x + a.w > b.x &&
               a.y < b.y + b.h &&
               a.y + a.h > b.y;
    }

    function updateParticles() {
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life--;
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    function spawnParticles(x, y, color, count) {
        for (var i = 0; i < count; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4 - 2,
                life: 30 + Math.random() * 20,
                color: color,
                size: 2 + Math.random() * 3
            });
        }
    }

    function showCollectToast() {
        var toast = $('collect-toast');
        if (!toast) return;
        toast.classList.remove('show');
        toast.offsetHeight;
        toast.classList.add('show');
    }

    function gameOver() {
        if (gameState === STATE.GAMEOVER) return;
        gameState = STATE.GAMEOVER;

        var dist = Math.floor(distance);
        var el;
        el = $('result-distance');
        if (el) el.textContent = dist + 'm';
        el = $('result-letters');
        if (el) el.textContent = collectedLettersThisRun.length;

        submitScore(dist, collectedLettersThisRun.length).then(function(data) {
            if (data) {
                el = $('result-best');
                if (el) el.textContent = (data.best_distance || 0) + 'm';
                var isNewRecord = data.is_new_record;
                el = $('new-record');
                if (el) el.classList.toggle('show', isNewRecord);
            }
        });

        saveCollectedLetters();

        showOverlay('game-over');
    }

    function render() {
        ctx.clearRect(0, 0, W, H);

        renderSky();
        renderBgLayers();
        renderNeonSigns();
        renderRoofs();
        renderObstacles();
        renderLetterPickups();
        renderPlayer();
        renderParticles();
        renderNightOverlay();
    }

    function renderSky() {
        var grad = ctx.createLinearGradient(0, 0, 0, H);
        if (nightProgress === 0) {
            grad.addColorStop(0, '#1a0a3e');
            grad.addColorStop(0.3, '#4a1942');
            grad.addColorStop(0.5, '#8B3A62');
            grad.addColorStop(0.7, '#FF6B35');
            grad.addColorStop(0.85, '#FFA62F');
            grad.addColorStop(1, '#FFD700');
        } else {
            var t = nightProgress;
            grad.addColorStop(0, lerpColor('#1a0a3e', '#050510', t));
            grad.addColorStop(0.3, lerpColor('#4a1942', '#0a0a20', t));
            grad.addColorStop(0.5, lerpColor('#8B3A62', '#0f0a25', t));
            grad.addColorStop(0.7, lerpColor('#FF6B35', '#15082d', t));
            grad.addColorStop(0.85, lerpColor('#FFA62F', '#1a0a2e', t));
            grad.addColorStop(1, lerpColor('#FFD700', '#1a0a2e', t));
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        var sunY = H * 0.55;
        var sunGrad = ctx.createRadialGradient(W * 0.75, sunY, 0, W * 0.75, sunY, 150);
        sunGrad.addColorStop(0, 'rgba(255, 200, 50, ' + (0.6 * (1 - nightProgress)) + ')');
        sunGrad.addColorStop(0.3, 'rgba(255, 130, 50, ' + (0.3 * (1 - nightProgress)) + ')');
        sunGrad.addColorStop(1, 'rgba(255, 80, 30, 0)');
        ctx.fillStyle = sunGrad;
        ctx.fillRect(0, 0, W, H);
    }

    function renderBgLayers() {
        var layerAlphas = [0.15, 0.25, 0.4, 0.6];
        var layerBaseColors = [
            [20, 10, 45],
            [30, 15, 55],
            [40, 20, 60],
            [50, 25, 65]
        ];

        for (var l = 0; l < bgLayers.length; l++) {
            var layer = bgLayers[l];
            if (gameState === STATE.PLAYING || gameState === STATE.GAMEOVER) {
                layer.offset += layer.speed * speed;
            }
            var bc = layerBaseColors[l];
            var nightR = Math.floor(bc[0] * (1 - nightProgress * 0.6));
            var nightG = Math.floor(bc[1] * (1 - nightProgress * 0.6));
            var nightB = Math.floor(bc[2] * (1 - nightProgress * 0.3));
            ctx.fillStyle = 'rgba(' + nightR + ',' + nightG + ',' + nightB + ',' + layerAlphas[l] + ')';

            for (var b = 0; b < layer.buildings.length; b++) {
                var bld = layer.buildings[b];
                var bx = bld.x - (layer.offset % (W + 400));
                if (bx < -bld.w) bx += W + 400;
                if (bx > W + 100) continue;
                ctx.fillRect(bx, layer.y - bld.h, bld.w, bld.h);

                if (nightProgress > 0.3 && l >= 2) {
                    var windowAlpha = nightProgress * 0.5 * (0.5 + 0.5 * Math.sin(frameCount * 0.01 + b));
                    ctx.fillStyle = 'rgba(255, 200, 100, ' + windowAlpha + ')';
                    for (var wy = layer.y - bld.h + 10; wy < layer.y - 5; wy += 15) {
                        for (var wx = bx + 5; wx < bx + bld.w - 5; wx += 12) {
                            if (Math.random() > 0.3) {
                                ctx.fillRect(wx, wy, 5, 7);
                            }
                        }
                    }
                    ctx.fillStyle = 'rgba(' + nightR + ',' + nightG + ',' + nightB + ',' + layerAlphas[l] + ')';
                }
            }
        }
    }

    function renderNeonSigns() {
        for (var i = 0; i < neonSigns.length; i++) {
            var ns = neonSigns[i];
            var nx = ns.x - (speed * 0.3 * frameCount * 0.01) % (W * 3);
            if (nx < -ns.w) ns.x += W * 3;
            if (nx > W + 50 || nx < -ns.w - 50) continue;

            var flicker = 0.5 + 0.5 * Math.sin(frameCount * ns.flickerSpeed + ns.flickerPhase);
            var baseAlpha = 0.3 + nightProgress * 0.7;
            var alpha = baseAlpha * flicker;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.shadowColor = ns.color;
            ctx.shadowBlur = 15 + nightProgress * 25;
            ctx.fillStyle = ns.color;
            ctx.fillRect(nx, ns.y, ns.w, ns.h);

            if (nightProgress > 0.3) {
                ctx.globalAlpha = alpha * 0.4;
                ctx.font = 'bold 10px sans-serif';
                ctx.fillStyle = ns.color;
                ctx.fillText(ns.text, nx + 3, ns.y + ns.h - 3);
            }

            ctx.restore();
        }
    }

    function renderRoofs() {
        for (var i = 0; i < roofs.length; i++) {
            var r = roofs[i];
            if (r.x + r.w < 0 || r.x > W) continue;

            var roofGrad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h + 30);
            roofGrad.addColorStop(0, '#1a1225');
            roofGrad.addColorStop(0.3, '#120e1a');
            roofGrad.addColorStop(1, '#0a0810');
            ctx.fillStyle = roofGrad;
            ctx.fillRect(r.x, r.y, r.w, H - r.y);

            ctx.fillStyle = '#2a1f35';
            ctx.fillRect(r.x, r.y, r.w, 4);

            ctx.fillStyle = 'rgba(255, 107, 53, 0.15)';
            ctx.fillRect(r.x, r.y, r.w, 2);

            if (nightProgress > 0.2) {
                ctx.fillStyle = 'rgba(255, 166, 47, ' + nightProgress * 0.1 + ')';
                ctx.fillRect(r.x, r.y, r.w, 1);
            }
        }
    }

    function renderObstacles() {
        for (var i = 0; i < obstacles.length; i++) {
            var obs = obstacles[i];
            if (obs.x + obs.w < 0 || obs.x > W) continue;

            if (obs.type === OBSTACLE.CHIMNEY) {
                ctx.fillStyle = '#2a2035';
                ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
                ctx.fillStyle = '#3a2845';
                ctx.fillRect(obs.x - 3, obs.y, obs.w + 6, 6);

                var smokeAlpha = 0.15 + 0.1 * Math.sin(frameCount * 0.03 + obs.x);
                ctx.fillStyle = 'rgba(200, 200, 220, ' + smokeAlpha + ')';
                for (var s = 0; s < 3; s++) {
                    var sx = obs.x + obs.w / 2 - 8 + s * 8 + Math.sin(frameCount * 0.02 + s) * 3;
                    var sy = obs.y - 10 - s * 8 - Math.abs(Math.sin(frameCount * 0.03)) * 5;
                    ctx.beginPath();
                    ctx.arc(sx, sy, 4 + s * 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else if (obs.type === OBSTACLE.CLOTHESLINE) {
                ctx.strokeStyle = '#666';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(obs.x, obs.y);
                ctx.lineTo(obs.x + obs.w, obs.y);
                ctx.stroke();

                var clothColors = ['#cc4444', '#4488cc', '#44cc88', '#cccc44'];
                for (var c = 0; c < 3; c++) {
                    var cx = obs.x + 10 + c * 20;
                    var cy = obs.y + 2;
                    ctx.fillStyle = clothColors[c % clothColors.length];
                    ctx.fillRect(cx, cy, 8, 12);
                }

                ctx.fillStyle = '#555';
                ctx.fillRect(obs.x - 2, obs.y - 15, 3, 15);
                ctx.fillRect(obs.x + obs.w - 1, obs.y - 15, 3, 15);
            } else if (obs.type === OBSTACLE.SKYLIGHT) {
                if (obs.broken) continue;
                var skAlpha = 0.3 + 0.1 * Math.sin(frameCount * 0.05);
                if (obs.breakTimer > 0) {
                    skAlpha *= obs.breakTimer / C.SKYLIGHT_BREAK_DELAY;
                    ctx.save();
                    ctx.translate(obs.x + obs.w / 2, obs.y + obs.h / 2);
                    ctx.rotate((Math.random() - 0.5) * 0.1);
                    ctx.translate(-(obs.x + obs.w / 2), -(obs.y + obs.h / 2));
                }
                ctx.fillStyle = 'rgba(100, 180, 220, ' + skAlpha + ')';
                ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
                ctx.strokeStyle = 'rgba(150, 210, 240, ' + (skAlpha + 0.2) + ')';
                ctx.lineWidth = 1;
                ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
                ctx.beginPath();
                ctx.moveTo(obs.x, obs.y);
                ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
                ctx.moveTo(obs.x + obs.w, obs.y);
                ctx.lineTo(obs.x, obs.y + obs.h);
                ctx.stroke();

                if (obs.breakTimer > 0) {
                    ctx.restore();
                }
            }
        }
    }

    function renderLetterPickups() {
        for (var i = 0; i < letterPickups.length; i++) {
            var lp = letterPickups[i];
            if (lp.collected || lp.x + lp.w < 0 || lp.x > W) continue;

            var by = lp.y + Math.sin(lp.bobPhase) * 5;

            ctx.save();
            ctx.shadowColor = '#FF1493';
            ctx.shadowBlur = 10 + 5 * Math.sin(frameCount * 0.08);

            ctx.fillStyle = '#FF1493';
            ctx.fillRect(lp.x + 4, by + 2, lp.w - 8, lp.h - 4);

            ctx.fillStyle = '#FFA62F';
            ctx.beginPath();
            ctx.moveTo(lp.x, by + 2);
            ctx.lineTo(lp.x + lp.w / 2, by + 10);
            ctx.lineTo(lp.x + lp.w, by + 2);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(lp.x, by + lp.h - 2);
            ctx.lineTo(lp.x + lp.w / 2, by + lp.h - 10);
            ctx.lineTo(lp.x + lp.w, by + lp.h - 2);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }
    }

    function renderPlayer() {
        if (gameState === STATE.MENU || gameState === STATE.COUNTDOWN) return;

        ctx.save();
        var px = player.x;
        var py = player.y;
        var pw = player.w;
        var ph = player.h;

        ctx.fillStyle = '#1a0a2e';

        if (player.sliding) {
            ctx.fillRect(px, py, pw + 10, ph);
            ctx.fillStyle = '#FF6B35';
            ctx.fillRect(px + pw + 2, py + 3, 8, 6);
            ctx.fillRect(px + pw + 5, py + 3, 3, 10);
        } else {
            var bodyX = px + 5;
            var bodyW = pw - 10;
            ctx.fillRect(bodyX, py + 8, bodyW, ph - 18);

            ctx.fillRect(px + 2, py + 8, pw - 4, 14);

            if (player.jumping) {
                var legOffset = Math.min(player.jumpFrame * 0.5, 10);
                ctx.fillRect(px + 6, py + ph - 14, 7, 14);
                ctx.fillRect(px + pw - 13, py + ph - 10, 7, 10);
            } else {
                var runCycle = Math.sin(player.runFrame * 2);
                var leg1Y = py + ph - 10 + runCycle * 4;
                var leg2Y = py + ph - 10 - runCycle * 4;
                ctx.fillRect(px + 6, py + ph - 14, 7, Math.max(leg1Y - (py + ph - 14), 4));
                ctx.fillRect(px + pw - 13, py + ph - 14, 7, Math.max(leg2Y - (py + ph - 14), 4));
            }

            ctx.fillStyle = '#FF6B35';
            ctx.fillRect(px + pw - 2, py + 10, 8, 4);
            ctx.fillRect(px + pw + 4, py + 8, 4, 8);

            ctx.fillStyle = '#00FFFF';
            ctx.fillRect(px + pw - 10, py + 10, 4, 4);

            ctx.fillStyle = 'rgba(255, 107, 53, 0.4)';
            ctx.fillRect(px - 2, py + ph - 2, pw + 4, 2);
        }

        ctx.restore();
    }

    function renderParticles() {
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            var alpha = p.life / 50;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.min(alpha, 1);
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        ctx.globalAlpha = 1;
    }

    function renderNightOverlay() {
        if (nightProgress <= 0) return;

        var vignetteAlpha = nightProgress * 0.7;
        var cx = player.x + player.w / 2;
        var cy = player.y + player.h / 2;
        var innerR = 80 + (1 - nightProgress) * 60;
        var outerR = 200 + (1 - nightProgress) * 100;

        var grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
        grad.addColorStop(0, 'rgba(5, 5, 16, 0)');
        grad.addColorStop(0.6, 'rgba(5, 5, 16, ' + vignetteAlpha * 0.5 + ')');
        grad.addColorStop(1, 'rgba(5, 5, 16, ' + vignetteAlpha + ')');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
    }

    function lerpColor(c1, c2, t) {
        var r1 = parseInt(c1.substr(1, 2), 16);
        var g1 = parseInt(c1.substr(3, 2), 16);
        var b1 = parseInt(c1.substr(5, 2), 16);
        var r2 = parseInt(c2.substr(1, 2), 16);
        var g2 = parseInt(c2.substr(3, 2), 16);
        var b2 = parseInt(c2.substr(5, 2), 16);
        var r = Math.floor(r1 + (r2 - r1) * t);
        var g = Math.floor(g1 + (g2 - g1) * t);
        var b = Math.floor(b1 + (b2 - b1) * t);
        return 'rgb(' + r + ',' + g + ',' + b + ')';
    }

    function submitScore(dist, letters) {
        return fetch('/api/parkour/score/set', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player_name: playerName,
                distance: dist,
                letters_collected: letters
            })
        })
        .then(function(r) { return r.json(); })
        .then(function(d) {
            if (d.code === 0) return d.data;
            return null;
        })
        .catch(function() { return null; });
    }

    function saveCollectedLetters() {
        for (var i = 0; i < pendingLetterSaves.length; i++) {
            var ls = pendingLetterSaves[i];
            fetch('/api/parkour/letter/collect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_name: playerName,
                    letter_id: ls.letterId,
                    fragment_index: ls.fragmentIndex
                })
            }).catch(function() {});
        }
        pendingLetterSaves = [];
    }

    function showLeaderboard() {
        fetch('/api/parkour/score/getleaderboard')
        .then(function(r) { return r.json(); })
        .then(function(d) {
            var list = $('leaderboard-list');
            if (!list) return;
            list.innerHTML = '';
            if (d.code === 0 && d.data && d.data.length > 0) {
                d.data.forEach(function(item, idx) {
                    var div = document.createElement('div');
                    div.className = 'lb-item';
                    div.innerHTML = '<span class="lb-rank">' + (idx + 1) + '</span>' +
                        '<span class="lb-name">' + escapeHtml(item.player_name) + '</span>' +
                        '<span class="lb-distance">' + Math.floor(item.distance) + 'm</span>' +
                        '<span class="lb-letters">✉' + item.letters_collected + '</span>';
                    list.appendChild(div);
                });
            } else {
                list.innerHTML = '<p style="color:#888;text-align:center;padding:2rem;">暂无记录</p>';
            }
            showOverlay('leaderboard-panel');
        })
        .catch(function() {
            var list = $('leaderboard-list');
            if (list) list.innerHTML = '<p style="color:#888;text-align:center;padding:2rem;">无法连接服务器</p>';
            showOverlay('leaderboard-panel');
        });
    }

    function showLetters() {
        var nameInput = $('player-name');
        var name = (nameInput && nameInput.value.trim()) || '';
        if (!name) {
            var grid = $('letters-grid');
            if (grid) grid.innerHTML = '<p style="color:#888;text-align:center;padding:2rem;grid-column:1/-1;">请先输入昵称</p>';
            showOverlay('letters-panel');
            return;
        }

        fetch('/api/parkour/letter/getstatus?player_name=' + encodeURIComponent(name))
        .then(function(r) { return r.json(); })
        .then(function(d) {
            var grid = $('letters-grid');
            if (!grid) return;
            grid.innerHTML = '';

            var collectedMap = {};
            if (d.code === 0 && d.data) {
                (d.data.fragments || []).forEach(function(f) {
                    var key = f.letter_id + '_' + f.fragment_index;
                    collectedMap[key] = f.collected;
                });
            }

            var unlockedIds = {};
            if (d.code === 0 && d.data) {
                (d.data.unlocked_stories || []).forEach(function(s) {
                    unlockedIds[s.letter_id] = s;
                });
            }

            STORIES.forEach(function(story) {
                var card = document.createElement('div');
                var fragCount = 0;
                var dotsHtml = '';
                for (var fi = 1; fi <= 3; fi++) {
                    var key = story.id + '_' + fi;
                    if (collectedMap[key]) fragCount++;
                    dotsHtml += '<span class="letter-fragment-dot ' + (collectedMap[key] ? 'collected' : '') + '"></span>';
                }

                var isUnlocked = fragCount === 3 || unlockedIds[story.id];
                card.className = 'letter-card' + (isUnlocked ? ' unlocked' : (fragCount > 0 ? '' : ' locked'));
                card.innerHTML = '<div class="letter-card-title">' + story.id + '. ' + story.title + '</div>' +
                    '<div class="letter-card-fragments">' + dotsHtml + '</div>';

                if (isUnlocked) {
                    card.addEventListener('click', function() {
                        var titleEl = $('letter-popup-title');
                        var contentEl = $('letter-popup-content');
                        var popup = $('letter-popup');
                        var content = unlockedIds[story.id] ? unlockedIds[story.id].content : story.content;
                        if (titleEl) titleEl.textContent = story.title;
                        if (contentEl) contentEl.textContent = content;
                        if (popup) popup.classList.add('active');
                    });
                }

                grid.appendChild(card);
            });

            showOverlay('letters-panel');
        })
        .catch(function() {
            var grid = $('letters-grid');
            if (grid) grid.innerHTML = '<p style="color:#888;text-align:center;padding:2rem;grid-column:1/-1;">无法连接服务器</p>';
            showOverlay('letters-panel');
        });
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
