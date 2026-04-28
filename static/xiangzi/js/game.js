class Game {
    constructor() {
        this.currentLevel = 0;
        this.map = [];
        this.originalMap = [];
        this.playerPos = { x: 0, y: 0 };
        this.boxes = [];
        this.targets = [];
        this.moves = 0;
        this.timeLeft = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.timerInterval = null;
        this.moveHistory = [];
        this.isAnimating = false;
    }

    initLevel(levelIndex) {
        const level = LEVELS[levelIndex];
        if (!level) return false;

        this.currentLevel = levelIndex;
        this.map = this.cloneMap(level.map);
        this.originalMap = this.cloneMap(level.map);
        this.moves = 0;
        this.timeLeft = level.timeLimit;
        this.moveHistory = [];
        this.boxes = [];
        this.targets = [];

        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                const cell = this.map[y][x];
                if (cell === CELL.PLAYER || cell === CELL.PLAYER_ON_TARGET) {
                    this.playerPos = { x, y };
                }
                if (cell === CELL.BOX || cell === CELL.BOX_ON_TARGET) {
                    this.boxes.push({ x, y });
                }
                if (cell === CELL.TARGET || cell === CELL.BOX_ON_TARGET || cell === CELL.PLAYER_ON_TARGET) {
                    this.targets.push({ x, y });
                }
            }
        }

        return true;
    }

    cloneMap(map) {
        return map.map(row => [...row]);
    }

    canMove(dx, dy) {
        const newX = this.playerPos.x + dx;
        const newY = this.playerPos.y + dy;

        if (newY < 0 || newY >= this.map.length || newX < 0 || newX >= this.map[0].length) {
            return false;
        }

        const targetCell = this.map[newY][newX];

        if (targetCell === CELL.WALL) {
            return false;
        }

        if (targetCell === CELL.BOX || targetCell === CELL.BOX_ON_TARGET) {
            const boxNewX = newX + dx;
            const boxNewY = newY + dy;

            if (boxNewY < 0 || boxNewY >= this.map.length || boxNewX < 0 || boxNewX >= this.map[0].length) {
                return false;
            }

            const boxTargetCell = this.map[boxNewY][boxNewX];
            if (boxTargetCell === CELL.WALL || boxTargetCell === CELL.BOX || boxTargetCell === CELL.BOX_ON_TARGET) {
                return false;
            }
        }

        return true;
    }

    move(dx, dy) {
        if (!this.isPlaying || this.isPaused || this.isAnimating) return false;
        if (!this.canMove(dx, dy)) return false;

        const prevState = {
            playerPos: { ...this.playerPos },
            map: this.cloneMap(this.map),
            boxes: this.boxes.map(b => ({ ...b })),
            moves: this.moves
        };
        this.moveHistory.push(prevState);

        const newX = this.playerPos.x + dx;
        const newY = this.playerPos.y + dy;
        const currentCell = this.map[this.playerPos.y][this.playerPos.x];
        const targetCell = this.map[newY][newX];

        if (targetCell === CELL.BOX || targetCell === CELL.BOX_ON_TARGET) {
            const boxNewX = newX + dx;
            const boxNewY = newY + dy;
            const boxTargetCell = this.map[boxNewY][boxNewX];

            if (boxTargetCell === CELL.TARGET) {
                this.map[boxNewY][boxNewX] = CELL.BOX_ON_TARGET;
                SoundManager.play('boxOnTarget');
            } else {
                this.map[boxNewY][boxNewX] = CELL.BOX;
            }

            if (targetCell === CELL.BOX_ON_TARGET) {
                this.map[newY][newX] = CELL.TARGET;
            } else {
                this.map[newY][newX] = CELL.FLOOR;
            }

            const boxIndex = this.boxes.findIndex(b => b.x === newX && b.y === newY);
            if (boxIndex !== -1) {
                this.boxes[boxIndex] = { x: boxNewX, y: boxNewY };
            }

            SoundManager.play('push');
        }

        if (currentCell === CELL.PLAYER_ON_TARGET) {
            this.map[this.playerPos.y][this.playerPos.x] = CELL.TARGET;
        } else {
            this.map[this.playerPos.y][this.playerPos.x] = CELL.FLOOR;
        }

        if (targetCell === CELL.TARGET || targetCell === CELL.BOX_ON_TARGET) {
            this.map[newY][newX] = CELL.PLAYER_ON_TARGET;
        } else {
            this.map[newY][newX] = CELL.PLAYER;
        }

        this.playerPos = { x: newX, y: newY };
        this.moves++;

        return true;
    }

    undo() {
        if (this.moveHistory.length === 0) return false;

        const prevState = this.moveHistory.pop();
        this.playerPos = prevState.playerPos;
        this.map = prevState.map;
        this.boxes = prevState.boxes;
        this.moves = prevState.moves;

        return true;
    }

    checkWin() {
        for (const target of this.targets) {
            const cell = this.map[target.y][target.x];
            if (cell !== CELL.BOX_ON_TARGET) {
                return false;
            }
        }
        return true;
    }

    isBoxStuck(boxX, boxY) {
        const directions = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 }
        ];

        let blockedCount = 0;
        const blockedDirections = [];

        for (const dir of directions) {
            const newX = boxX + dir.dx;
            const newY = boxY + dir.dy;

            if (newY < 0 || newY >= this.map.length || newX < 0 || newX >= this.map[0].length) {
                blockedCount++;
                blockedDirections.push(dir);
                continue;
            }

            const cell = this.map[newY][newX];
            if (cell === CELL.WALL || cell === CELL.BOX || cell === CELL.BOX_ON_TARGET) {
                blockedCount++;
                blockedDirections.push(dir);
            }
        }

        if (blockedCount >= 2) {
            const isHorizontal = blockedDirections.some(d => d.dx !== 0);
            const isVertical = blockedDirections.some(d => d.dy !== 0);
            
            if (isHorizontal && isVertical) {
                const cell = this.map[boxY][boxX];
                if (cell !== CELL.BOX_ON_TARGET) {
                    return true;
                }
            }
        }

        return false;
    }

    checkAnyBoxStuck() {
        for (const box of this.boxes) {
            if (this.isBoxStuck(box.x, box.y)) {
                return true;
            }
        }
        return false;
    }

    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.timerInterval = setInterval(() => {
            if (!this.isPaused && this.isPlaying) {
                this.timeLeft--;
                if (this.timeLeft <= 0) {
                    this.timeLeft = 0;
                    this.stopTimer();
                    this.gameOver();
                }
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    gameOver() {
        this.isPlaying = false;
        SoundManager.play('lose');
        if (typeof onGameLose === 'function') {
            onGameLose();
        }
    }

    win() {
        this.isPlaying = false;
        this.stopTimer();
        SoundManager.play('win');
        if (typeof onGameWin === 'function') {
            onGameWin();
        }
    }

    reset() {
        this.stopTimer();
        this.initLevel(this.currentLevel);
    }

    getLevelTime() {
        return LEVELS[this.currentLevel]?.timeLimit || 60;
    }

    getBoxesOnTargetCount() {
        let count = 0;
        for (const target of this.targets) {
            const cell = this.map[target.y][target.x];
            if (cell === CELL.BOX_ON_TARGET) {
                count++;
            }
        }
        return count;
    }
}
