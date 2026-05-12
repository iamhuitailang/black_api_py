class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.width = canvas.width;
        this.height = canvas.height;
        
        this.currentLevel = 1;
        this.candy = null;
        this.monster = null;
        this.ropes = [];
        this.anchors = [];
        this.stars = [];
        this.bubbles = [];
        this.magnets = [];
        this.spiderwebs = [];
        this.balloons = [];
        
        this.isPaused = false;
        this.isGameOver = false;
        this.isWin = false;
        this.animationId = null;
        this.lastTime = 0;
        this.saveTimer = 0;
        this.saveInterval = 1000;
        
        this.setupEventListeners();
    }

    setCanvasSize(width, height) {
        this.width = width;
        this.height = height;
        if (this.renderer) {
            this.renderer.width = width;
            this.renderer.height = height;
        }
    }

    setupEventListeners() {
        console.log('设置事件监听器到Canvas:', this.canvas);
        
        const handleMouseDown = (e) => {
            console.log('全局点击事件:', e.target);
            const rect = this.canvas.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom) {
                console.log('点击在Canvas范围内!');
                this.handleClick(e);
            }
        };
        
        document.addEventListener('mousedown', handleMouseDown);
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleClick(touch);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleMove(touch);
        });
    }

    getCanvasCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        console.log('点击坐标:', { clientX: e.clientX, clientY: e.clientY, x, y, rect });
        return { x, y };
    }

    handleClick(e) {
        if (this.isPaused || this.isGameOver || this.isWin) return;

        const { x, y } = this.getCanvasCoords(e);
        this.tryCutRope(x, y);
    }

    handleMove(e) {
        if (this.isPaused || this.isGameOver || this.isWin) return;

        const { x, y } = this.getCanvasCoords(e);
        this.tryCutRope(x, y);
    }

    tryCutRope(x, y) {
        console.log('尝试切割绳索，点击坐标:', x, y);
        this.ropes.forEach((rope, index) => {
            console.log(`绳索 ${index}: cut=${rope.cut}, 段数=${rope.segments.length}, start=(${rope.start.x}, ${rope.start.y}), end=(${rope.end.x}, ${rope.end.y})`);
            if (rope.segments.length > 0) {
                const midSeg = rope.segments[Math.floor(rope.segments.length / 2)];
                const midEnd = midSeg.getEnd();
                console.log(`  中间段位置: (${midSeg.anchor.x}, ${midSeg.anchor.y}) -> (${midEnd.x}, ${midEnd.y})`);
            }
            if (!rope.cut) {
                const wasCutBefore = rope.cut;
                const result = rope.cutAtPoint(x, y);
                console.log(`切割结果: ${result}, rope.cut=${rope.cut}`);
                if (rope.cut && !wasCutBefore) {
                    console.log('绳索被切断! 释放糖果');
                    this.candy.released = true;
                    this.candy.velocity = new Vector(0, 3);
                }
            }
        });
    }

    loadLevel(levelNumber, useSavedState = true) {
        this.currentLevel = levelNumber;
        this.isGameOver = false;
        this.isWin = false;
        this.isPaused = false;
        this.saveTimer = 0;

        const levelData = LevelManager.getLevel(levelNumber);
        const objects = LevelManager.createLevelObjects(levelData);
        
        this.candy = new Candy(levelData.candy.x, levelData.candy.y);
        this.monster = new Monster(levelData.monster.x, levelData.monster.y);
        this.ropes = objects.ropes;
        this.anchors = objects.anchors;
        this.stars = objects.stars;
        this.bubbles = objects.bubbles;
        this.magnets = objects.magnets;
        this.spiderwebs = objects.spiderwebs;
        this.balloons = objects.balloons;

        if (useSavedState) {
            const savedState = storageManager.getGameState(levelNumber);
            console.log('加载存档:', savedState);
            if (savedState && !savedState.isGameOver && !savedState.isWin) {
                try {
                    const savedObjects = LevelManager.deserializeGameState(savedState, this.width, this.height);
                    this.candy = savedObjects.candy;
                    this.monster = savedObjects.monster;
                    this.stars = savedObjects.stars;
                    this.bubbles = savedObjects.bubbles;
                    this.magnets = savedObjects.magnets;
                    this.spiderwebs = savedObjects.spiderwebs;
                    this.balloons = savedObjects.balloons;
                    this.ropes = savedObjects.ropes;
                    this.anchors = savedObjects.anchors;
                    
                    let anyRopeWasCut = false;
                    this.ropes.forEach(rope => {
                        if (rope.wasCut || rope.cut) {
                            anyRopeWasCut = true;
                        }
                    });
                    if (anyRopeWasCut && !this.candy.released) {
                        console.log('恢复已切断绳索的状态，释放糖果');
                        this.candy.released = true;
                    }
                    
                    console.log('存档加载成功，糖果released状态:', this.candy.released);
                    return true;
                } catch (e) {
                    console.error('加载存档失败，使用新关卡:', e);
                }
            }
        }

        return true;
    }

    start() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.lastTime = performance.now();
        this.gameLoop();
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    gameLoop(currentTime = 0) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        if (!this.isPaused && !this.isGameOver && !this.isWin) {
            if (this.candy) {
                this.update(deltaTime);
            }
        }

        if (this.candy && this.monster) {
            this.render();
        }
        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(deltaTime) {
        this.saveTimer += deltaTime * 1000;
        if (this.saveTimer >= 500) {
            this.saveGameState();
            this.saveTimer = 0;
        }

        this.ropes.forEach(rope => {
            rope.update(CONFIG.GRAVITY, this.candy.position);
        });

        let attachedToRope = false;
        if (!this.candy.released) {
            this.ropes.forEach(rope => {
                if (!rope.cut) {
                    const endPos = rope.getEndPosition();
                    if (endPos) {
                        const dist = endPos.distance(this.candy.position);
                        if (dist < this.candy.radius * 3) {
                            attachedToRope = true;
                            this.candy.position = endPos.clone();
                            this.candy.velocity = new Vector(0, 0);
                        }
                    }
                }
            });
        }

        if (!attachedToRope) {
            this.magnets.forEach(magnet => magnet.applyForce(this.candy));
            this.candy.update(this.width, this.height);
        } else {
            this.candy.velocity = new Vector(0, 0);
        }

        this.stars.forEach(star => {
            star.checkCollision(this.candy);
        });

        this.bubbles.forEach(bubble => {
            bubble.checkCollision(this.candy);
        });

        this.spiderwebs.forEach(spiderweb => {
            spiderweb.checkCollision(this.candy);
        });

        this.balloons.forEach(balloon => {
            balloon.checkCollision(this.candy);
        });

        this.stars.forEach(s => s.update());
        this.bubbles.forEach(b => b.update());
        this.magnets.forEach(m => m.update());
        this.spiderwebs.forEach(s => s.update());
        this.balloons.forEach(b => b.update());
        this.monster.update(this.candy.position);

        if (this.monster.canEat(this.candy)) {
            this.win();
        }

        if (CollisionDetector.isOutOfBounds(this.candy, this.width, this.height)) {
            this.lose();
        }
    }

    render() {
        this.renderer.render(this);
    }

    pause() {
        this.isPaused = true;
        this.saveGameState();
    }

    resume() {
        this.isPaused = false;
    }

    win() {
        this.isWin = true;
        const starsCollected = this.stars.filter(s => s.collected).length;
        storageManager.saveLevelProgress(this.currentLevel, starsCollected);
    }

    lose() {
        this.isGameOver = true;
    }

    restart() {
        storageManager.clearGameState(this.currentLevel);
        this.loadLevel(this.currentLevel, false);
    }

    saveGameState() {
        const state = LevelManager.serializeGameState(this);
        console.log('保存游戏状态:', state);
        storageManager.saveGameState(this.currentLevel, state);
    }

    getStarsCollected() {
        return this.stars.filter(s => s.collected).length;
    }

    getTotalStars() {
        return this.stars.length;
    }

    hasNextLevel() {
        return this.currentLevel < LevelManager.getTotalLevels();
    }

    nextLevel() {
        if (this.hasNextLevel()) {
            this.loadLevel(this.currentLevel + 1, true);
        }
    }
}
