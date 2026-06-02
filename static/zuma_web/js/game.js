export const BALL_COLORS = [
    '#ef4444',
    '#f59e0b',
    '#10b981',
    '#3b82f6',
    '#8b5cf6',
    '#ec4899'
];

export class ZumaGame {
    constructor(canvas, onGameOver, onScoreUpdate, onComboUpdate) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.onGameOver = onGameOver;
        this.onScoreUpdate = onScoreUpdate;
        this.onComboUpdate = onComboUpdate;

        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        this.ballRadius = 18;
        this.ballSpacing = this.ballRadius * 2.1;
        this.pathPoints = [];
        this.balls = [];
        this.frogAngle = 0;
        this.currentBall = null;
        this.nextBall = null;
        this.flyingBalls = [];
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.gameRunning = false;
        this.paused = false;
        this.speed = 0.8;
        this.ballsFired = 0;
        this.ballsMatched = 0;
        this.startTime = 0;

        this.slowTimeActive = false;
        this.slowTimeEnd = 0;
        this.aimActive = false;

        this.initPath();
        this.initBalls();
        this.spawnCurrentBall();

        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.swapBalls();
        });
    }

    initPath() {
        const centerX = this.centerX;
        const centerY = this.centerY;
        
        this.pathPoints = [];
        const totalPoints = 800;
        
        for (let i = 0; i < totalPoints; i++) {
            const t = i / totalPoints;
            const angle = t * Math.PI * 6;
            const radius = 60 + t * 200;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            this.pathPoints.push({ x, y, t, index: i });
        }
    }

    initBalls() {
        this.balls = [];
        const initialBalls = 15;
        const startPosition = this.pathPoints.length - 100;
        
        for (let i = 0; i < initialBalls; i++) {
            const colorIndex = Math.floor(Math.random() * BALL_COLORS.length);
            const position = startPosition + i * this.ballSpacing;
            this.balls.push({
                color: BALL_COLORS[colorIndex],
                colorIndex,
                position,
                matched: false
            });
        }
    }

    spawnCurrentBall() {
        const colorIndex = Math.floor(Math.random() * BALL_COLORS.length);
        this.currentBall = {
            color: BALL_COLORS[colorIndex],
            colorIndex
        };
        
        if (!this.nextBall) {
            const nextColorIndex = Math.floor(Math.random() * BALL_COLORS.length);
            this.nextBall = {
                color: BALL_COLORS[nextColorIndex],
                colorIndex: nextColorIndex
            };
        }
    }

    swapBalls() {
        if (this.currentBall && this.nextBall) {
            const temp = this.currentBall;
            this.currentBall = this.nextBall;
            this.nextBall = temp;
        }
    }

    handleMouseMove(e) {
        if (!this.gameRunning || this.paused) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.frogAngle = Math.atan2(y - this.centerY, x - this.centerX);
    }

    handleClick(e) {
        if (!this.gameRunning || this.paused) return;
        this.fireBall();
    }

    fireBall() {
        if (!this.currentBall) return;

        this.ballsFired++;
        
        const speed = 15;
        const vx = Math.cos(this.frogAngle) * speed;
        const vy = Math.sin(this.frogAngle) * speed;

        this.flyingBalls.push({
            x: this.centerX,
            y: this.centerY,
            vx,
            vy,
            color: this.currentBall.color,
            colorIndex: this.currentBall.colorIndex
        });

        this.currentBall = this.nextBall;
        const nextColorIndex = Math.floor(Math.random() * BALL_COLORS.length);
        this.nextBall = {
            color: BALL_COLORS[nextColorIndex],
            colorIndex: nextColorIndex
        };
    }

    getBallPosition(ball) {
        const index = Math.floor(ball.position);
        const clampedIndex = Math.max(0, Math.min(this.pathPoints.length - 1, index));
        return this.pathPoints[clampedIndex];
    }

    update() {
        if (!this.gameRunning || this.paused) return;

        let currentSpeed = this.speed;
        if (this.slowTimeActive && Date.now() < this.slowTimeEnd) {
            currentSpeed *= 0.5;
        } else {
            this.slowTimeActive = false;
        }

        for (let i = 0; i < this.balls.length; i++) {
            this.balls[i].position -= currentSpeed;
        }

        const lastBall = this.balls[this.balls.length - 1];
        if (lastBall && lastBall.position < this.pathPoints.length - 50) {
            if (Math.random() < 0.015) {
                const colorIndex = Math.floor(Math.random() * BALL_COLORS.length);
                this.balls.push({
                    color: BALL_COLORS[colorIndex],
                    colorIndex,
                    position: lastBall.position + this.ballSpacing,
                    matched: false
                });
            }
        }

        for (let i = this.flyingBalls.length - 1; i >= 0; i--) {
            const ball = this.flyingBalls[i];
            ball.x += ball.vx;
            ball.y += ball.vy;

            if (ball.x < -50 || ball.x > this.width + 50 || 
                ball.y < -50 || ball.y > this.height + 50) {
                this.flyingBalls.splice(i, 1);
                continue;
            }

            let collided = false;
            let insertIndex = -1;
            let minDist = Infinity;

            for (let j = 0; j < this.balls.length; j++) {
                const targetBall = this.balls[j];
                const pos = this.getBallPosition(targetBall);
                
                const dx = ball.x - pos.x;
                const dy = ball.y - pos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < this.ballRadius * 2.2 && dist < minDist) {
                    minDist = dist;
                    insertIndex = j;
                    collided = true;
                }
            }

            if (collided && insertIndex >= 0) {
                this.insertBall(insertIndex, ball);
                this.flyingBalls.splice(i, 1);
                this.checkMatches();
            }
        }

        const dangerBall = this.balls.find(b => b.position <= 50);
        if (dangerBall) {
            this.gameOver();
        }
    }

    insertBall(index, ball) {
        const targetBall = this.balls[index];
        const newBall = {
            color: ball.color,
            colorIndex: ball.colorIndex,
            position: targetBall.position,
            matched: false
        };

        this.balls.splice(index, 0, newBall);
        
        for (let i = index + 1; i < this.balls.length; i++) {
            this.balls[i].position += this.ballSpacing;
        }
    }

    checkMatches() {
        let matched = false;
        let ballsToRemove = new Set();

        for (let i = 0; i < this.balls.length - 2; i++) {
            const color = this.balls[i].color;
            let matchCount = 1;
            let matchStart = i;

            for (let j = i + 1; j < this.balls.length; j++) {
                if (this.balls[j].color === color) {
                    matchCount++;
                } else {
                    break;
                }
            }

            if (matchCount >= 3) {
                matched = true;
                for (let k = matchStart; k < matchStart + matchCount; k++) {
                    ballsToRemove.add(k);
                }
                this.ballsMatched += matchCount;
                this.score += matchCount * 10 * (this.combo + 1);
            }

            i += matchCount - 1;
        }

        if (matched) {
            this.combo++;
            this.maxCombo = Math.max(this.maxCombo, this.combo);
            
            const sortedIndices = Array.from(ballsToRemove).sort((a, b) => b - a);
            for (const idx of sortedIndices) {
                this.balls.splice(idx, 1);
            }

            this.onScoreUpdate(this.score);
            this.onComboUpdate(this.combo);

            setTimeout(() => this.checkChainReaction(), 150);
        } else {
            this.combo = 0;
            this.onComboUpdate(0);
        }
    }

    checkChainReaction() {
        if (this.balls.length < 3) return;

        let chainMatch = false;
        for (let i = 0; i < this.balls.length - 2; i++) {
            if (this.balls[i].color === this.balls[i + 1].color &&
                this.balls[i].color === this.balls[i + 2].color) {
                chainMatch = true;
                break;
            }
        }

        if (chainMatch) {
            this.checkMatches();
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.drawPath();
        this.drawBalls();
        this.drawFlyingBalls();
        this.drawFrog();
        
        if (this.aimActive) {
            this.drawAimLine();
        }
    }

    drawPath() {
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.lineWidth = this.ballRadius * 2.5;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        for (let i = 0; i < this.pathPoints.length; i++) {
            const point = this.pathPoints[i];
            if (i === 0) {
                this.ctx.moveTo(point.x, point.y);
            } else {
                this.ctx.lineTo(point.x, point.y);
            }
        }
        this.ctx.stroke();

        const dangerPoint = this.pathPoints[50];
        if (dangerPoint) {
            this.ctx.beginPath();
            this.ctx.arc(dangerPoint.x, dangerPoint.y, 25, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
            this.ctx.fill();
            this.ctx.strokeStyle = '#ef4444';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        const startPoint = this.pathPoints[this.pathPoints.length - 100];
        if (startPoint) {
            this.ctx.beginPath();
            this.ctx.arc(startPoint.x, startPoint.y, 15, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
            this.ctx.fill();
            this.ctx.strokeStyle = '#10b981';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }

    drawBalls() {
        for (const ball of this.balls) {
            const pos = this.getBallPosition(ball);
            
            this.ctx.beginPath();
            this.ctx.arc(pos.x + 2, pos.y + 2, this.ballRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, this.ballRadius, 0, Math.PI * 2);
            
            const gradient = this.ctx.createRadialGradient(
                pos.x - 5, pos.y - 5, 0,
                pos.x, pos.y, this.ballRadius
            );
            gradient.addColorStop(0, this.lightenColor(ball.color, 30));
            gradient.addColorStop(0.7, ball.color);
            gradient.addColorStop(1, this.darkenColor(ball.color, 30));
            
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.arc(pos.x - 5, pos.y - 5, this.ballRadius * 0.3, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.fill();
        }
    }

    drawFlyingBalls() {
        for (const ball of this.flyingBalls) {
            this.ctx.beginPath();
            this.ctx.arc(ball.x + 2, ball.y + 2, this.ballRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.arc(ball.x, ball.y, this.ballRadius, 0, Math.PI * 2);
            
            const gradient = this.ctx.createRadialGradient(
                ball.x - 5, ball.y - 5, 0,
                ball.x, ball.y, this.ballRadius
            );
            gradient.addColorStop(0, this.lightenColor(ball.color, 30));
            gradient.addColorStop(0.7, ball.color);
            gradient.addColorStop(1, this.darkenColor(ball.color, 30));
            
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.arc(ball.x - 5, ball.y - 5, this.ballRadius * 0.3, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.fill();
        }
    }

    drawFrog() {
        const frogRadius = 35;
        
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, frogRadius + 5, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, frogRadius, 0, Math.PI * 2);
        const frogGradient = this.ctx.createRadialGradient(
            this.centerX - 10, this.centerY - 10, 0,
            this.centerX, this.centerY, frogRadius
        );
        frogGradient.addColorStop(0, '#4ade80');
        frogGradient.addColorStop(0.7, '#22c55e');
        frogGradient.addColorStop(1, '#16a34a');
        this.ctx.fillStyle = frogGradient;
        this.ctx.fill();

        const mouthLength = 45;
        const mouthX = this.centerX + Math.cos(this.frogAngle) * mouthLength;
        const mouthY = this.centerY + Math.sin(this.frogAngle) * mouthLength;

        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, this.centerY);
        this.ctx.lineTo(mouthX, mouthY);
        this.ctx.lineWidth = 12;
        this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = '#15803d';
        this.ctx.stroke();

        if (this.currentBall) {
            this.ctx.beginPath();
            this.ctx.arc(mouthX, mouthY, this.ballRadius * 0.8, 0, Math.PI * 2);
            const gradient = this.ctx.createRadialGradient(
                mouthX - 3, mouthY - 3, 0,
                mouthX, mouthY, this.ballRadius * 0.8
            );
            gradient.addColorStop(0, this.lightenColor(this.currentBall.color, 30));
            gradient.addColorStop(0.7, this.currentBall.color);
            gradient.addColorStop(1, this.darkenColor(this.currentBall.color, 30));
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
        }

        if (this.nextBall) {
            const nextX = this.centerX - Math.cos(this.frogAngle) * 30;
            const nextY = this.centerY - Math.sin(this.frogAngle) * 30;
            this.ctx.beginPath();
            this.ctx.arc(nextX, nextY, this.ballRadius * 0.5, 0, Math.PI * 2);
            const nextGradient = this.ctx.createRadialGradient(
                nextX - 2, nextY - 2, 0,
                nextX, nextY, this.ballRadius * 0.5
            );
            nextGradient.addColorStop(0, this.lightenColor(this.nextBall.color, 30));
            nextGradient.addColorStop(0.7, this.nextBall.color);
            nextGradient.addColorStop(1, this.darkenColor(this.nextBall.color, 30));
            this.ctx.fillStyle = nextGradient;
            this.ctx.fill();
        }
    }

    drawAimLine() {
        const length = 300;
        const endX = this.centerX + Math.cos(this.frogAngle) * length;
        const endY = this.centerY + Math.sin(this.frogAngle) * length;

        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, this.centerY);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    darkenColor(color, percent) {
        return this.lightenColor(color, -percent);
    }

    start() {
        this.gameRunning = true;
        this.paused = false;
        this.startTime = Date.now();
        this.gameLoop();
    }

    pause() {
        this.paused = true;
    }

    resume() {
        this.paused = false;
    }

    gameLoop() {
        if (!this.gameRunning) return;

        this.update();
        this.draw();

        requestAnimationFrame(() => this.gameLoop());
    }

    gameOver() {
        this.gameRunning = false;
        const duration = Math.floor((Date.now() - this.startTime) / 1000);
        this.onGameOver({
            score: this.score,
            maxCombo: this.maxCombo,
            duration,
            ballsFired: this.ballsFired,
            ballsMatched: this.ballsMatched
        });
    }

    useSlowTime() {
        this.slowTimeActive = true;
        this.slowTimeEnd = Date.now() + 5000;
    }

    useBackward() {
        for (const ball of this.balls) {
            ball.position = Math.min(this.pathPoints.length - 1, ball.position + 150);
        }
    }

    useAim() {
        this.aimActive = true;
        setTimeout(() => {
            this.aimActive = false;
        }, 10000);
    }

    useBomb() {
        if (this.balls.length > 0) {
            const centerIdx = Math.floor(this.balls.length / 2);
            const startIdx = Math.max(0, centerIdx - 5);
            const endIdx = Math.min(this.balls.length, centerIdx + 5);
            const removeCount = endIdx - startIdx;
            this.balls.splice(startIdx, removeCount);
            this.score += removeCount * 5;
            this.onScoreUpdate(this.score);
        }
    }

    useColorChange() {
        if (this.currentBall) {
            const newColorIndex = Math.floor(Math.random() * BALL_COLORS.length);
            this.currentBall.color = BALL_COLORS[newColorIndex];
            this.currentBall.colorIndex = newColorIndex;
        }
    }

    getState() {
        return {
            score: this.score,
            combo: this.combo,
            maxCombo: this.maxCombo,
            balls: this.balls.map(b => ({
                color: b.color,
                colorIndex: b.colorIndex,
                position: b.position
            })),
            currentBall: this.currentBall,
            nextBall: this.nextBall,
            speed: this.speed,
            ballsFired: this.ballsFired,
            ballsMatched: this.ballsMatched
        };
    }

    restoreState(state) {
        this.score = state.score || 0;
        this.combo = state.combo || 0;
        this.maxCombo = state.maxCombo || 0;
        this.speed = state.speed || 0.8;
        this.ballsFired = state.ballsFired || 0;
        this.ballsMatched = state.ballsMatched || 0;
        
        if (state.balls) {
            this.balls = state.balls.map(b => ({
                ...b,
                matched: false
            }));
        }
        
        if (state.currentBall) {
            this.currentBall = state.currentBall;
        }
        
        if (state.nextBall) {
            this.nextBall = state.nextBall;
        }
    }
}
