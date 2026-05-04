/**
 * 渲染模块
 * 负责游戏画面的渲染
 */

// 颜色配置（19世纪欧洲风格）
const Colors = {
    background: '#1a1a1a',
    grid: '#2a2a2a',
    track: '#8B4513',
    trackHighlight: '#A0522D',
    switch: '#DAA520',
    switchActive: '#FFD700',
    signalRed: '#8B0000',
    signalGreen: '#228B22',
    platform: '#4682B4',
    entrance: '#32CD32',
    trainFreight: '#8B4513',
    trainHighSpeed: '#1E90FF',
    trainSubway: '#228B22',
    trainCar: '#654321',
    explosion: '#FF4500',
    smoke: '#808080'
};

/**
 * Renderer类 - 渲染器
 */
class Renderer {
    /**
     * 构造函数
     * @param {HTMLCanvasElement} canvas - Canvas元素
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 网格大小
        this.gridSize = 40;
        
        // 偏移量（用于居中显示）
        this.offsetX = 0;
        this.offsetY = 0;
        
        // 动画时间
        this.animationTime = 0;
        
        // 特效列表
        this.effects = [];
    }

    /**
     * 设置画布尺寸
     * @param {number} width - 宽度
     * @param {number} height - 高度
     */
    setSize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    /**
     * 计算偏移量以居中显示地图
     * @param {number} mapWidth - 地图宽度（格数）
     * @param {number} mapHeight - 地图高度（格数）
     */
    calculateOffset(mapWidth, mapHeight) {
        const totalWidth = mapWidth * this.gridSize;
        const totalHeight = mapHeight * this.gridSize;
        
        this.offsetX = (this.canvas.width - totalWidth) / 2;
        this.offsetY = (this.canvas.height - totalHeight) / 2;
    }

    /**
     * 清除画布
     */
    clear() {
        this.ctx.fillStyle = Colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 绘制网格
     * @param {number} mapWidth - 地图宽度
     * @param {number} mapHeight - 地图高度
     */
    drawGrid(mapWidth, mapHeight) {
        this.ctx.strokeStyle = Colors.grid;
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= mapWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(
                this.offsetX + x * this.gridSize,
                this.offsetY
            );
            this.ctx.lineTo(
                this.offsetX + x * this.gridSize,
                this.offsetY + mapHeight * this.gridSize
            );
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= mapHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(
                this.offsetX,
                this.offsetY + y * this.gridSize
            );
            this.ctx.lineTo(
                this.offsetX + mapWidth * this.gridSize,
                this.offsetY + y * this.gridSize
            );
            this.ctx.stroke();
        }
    }

    /**
     * 绘制轨道
     * @param {Array} trackMap - 轨道地图
     */
    drawTracks(trackMap) {
        if (!trackMap || !trackMap.length) {
            return;
        }
        
        for (let y = 0; y < trackMap.length; y++) {
            const row = trackMap[y];
            if (!row) continue;
            
            for (let x = 0; x < row.length; x++) {
                const track = row[x];
                if (!track || track.type === ' ') continue;
                
                this.drawTrack(x, y, track.type);
            }
        }
    }

    /**
     * 绘制单个轨道
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {string} type - 轨道类型
     */
    drawTrack(x, y, type) {
        const centerX = this.offsetX + x * this.gridSize + this.gridSize / 2;
        const centerY = this.offsetY + y * this.gridSize + this.gridSize / 2;
        const halfSize = this.gridSize / 2 - 5;
        
        this.ctx.strokeStyle = Colors.track;
        this.ctx.lineWidth = 6;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        
        switch (type) {
            case '─': // 水平直轨
                this.ctx.moveTo(centerX - halfSize, centerY);
                this.ctx.lineTo(centerX + halfSize, centerY);
                break;
                
            case '│': // 垂直直轨
                this.ctx.moveTo(centerX, centerY - halfSize);
                this.ctx.lineTo(centerX, centerY + halfSize);
                break;
                
            case '┌': // 左上弯轨
                this.ctx.moveTo(centerX, centerY - halfSize);
                this.ctx.arc(centerX, centerY, halfSize, -Math.PI / 2, Math.PI / 2, false);
                break;
                
            case '┐': // 右上弯轨
                this.ctx.moveTo(centerX, centerY - halfSize);
                this.ctx.arc(centerX, centerY, halfSize, -Math.PI / 2, Math.PI / 2, true);
                break;
                
            case '└': // 左下弯轨
                this.ctx.moveTo(centerX, centerY + halfSize);
                this.ctx.arc(centerX, centerY, halfSize, Math.PI / 2, -Math.PI / 2, true);
                break;
                
            case '┘': // 右下弯轨
                this.ctx.moveTo(centerX, centerY + halfSize);
                this.ctx.arc(centerX, centerY, halfSize, Math.PI / 2, -Math.PI / 2, false);
                break;
                
            case '┬': // 上道岔
                this.ctx.moveTo(centerX - halfSize, centerY);
                this.ctx.lineTo(centerX + halfSize, centerY);
                this.ctx.moveTo(centerX, centerY);
                this.ctx.lineTo(centerX, centerY + halfSize);
                break;
                
            case '┴': // 下道岔
                this.ctx.moveTo(centerX - halfSize, centerY);
                this.ctx.lineTo(centerX + halfSize, centerY);
                this.ctx.moveTo(centerX, centerY);
                this.ctx.lineTo(centerX, centerY - halfSize);
                break;
                
            case '├': // 左道岔
                this.ctx.moveTo(centerX, centerY - halfSize);
                this.ctx.lineTo(centerX, centerY + halfSize);
                this.ctx.moveTo(centerX, centerY);
                this.ctx.lineTo(centerX + halfSize, centerY);
                break;
                
            case '┤': // 右道岔
                this.ctx.moveTo(centerX, centerY - halfSize);
                this.ctx.lineTo(centerX, centerY + halfSize);
                this.ctx.moveTo(centerX, centerY);
                this.ctx.lineTo(centerX - halfSize, centerY);
                break;
                
            case '⚪': // 信号灯
                this.ctx.moveTo(centerX - halfSize, centerY);
                this.ctx.lineTo(centerX + halfSize, centerY);
                break;
                
            case '🚉': // 站台
                this.ctx.moveTo(centerX - halfSize, centerY);
                this.ctx.lineTo(centerX + halfSize, centerY);
                break;
                
            case '🟢': // 入口
                this.ctx.moveTo(centerX - halfSize, centerY);
                this.ctx.lineTo(centerX + halfSize, centerY);
                break;
        }
        
        this.ctx.stroke();
        
        // 绘制轨道高光
        this.ctx.strokeStyle = Colors.trackHighlight;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    /**
     * 绘制道岔
     * @param {Array} switches - 道岔列表
     */
    drawSwitches(switches) {
        switches.forEach(sw => {
            const centerX = this.offsetX + sw.x * this.gridSize + this.gridSize / 2;
            const centerY = this.offsetY + sw.y * this.gridSize + this.gridSize / 2;
            
            // 绘制道岔指示器
            this.ctx.fillStyle = sw.isAnimating ? Colors.switchActive : Colors.switch;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 绘制方向指示
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            
            const arrowSize = 6;
            const directions = sw.getAvailableDirections ? sw.getAvailableDirections() : ['left', 'right'];
            const currentDir = sw.getCurrentDirection ? sw.getCurrentDirection() : directions[sw.state || 0];
            
            // 绘制箭头指示当前选择的方向
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            
            switch (currentDir) {
                case 'left':
                    this.ctx.rotate(Math.PI);
                    break;
                case 'up':
                    this.ctx.rotate(-Math.PI / 2);
                    break;
                case 'down':
                    this.ctx.rotate(Math.PI / 2);
                    break;
            }
            
            this.ctx.moveTo(-arrowSize, -arrowSize);
            this.ctx.lineTo(0, 0);
            this.ctx.lineTo(-arrowSize, arrowSize);
            this.ctx.stroke();
            this.ctx.restore();
        });
    }

    /**
     * 绘制信号灯
     * @param {Array} signals - 信号灯列表
     */
    drawSignals(signals) {
        signals.forEach(sig => {
            const centerX = this.offsetX + sig.x * this.gridSize + this.gridSize / 2;
            const centerY = this.offsetY + sig.y * this.gridSize + this.gridSize / 2;
            
            // 绘制信号灯底座
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(centerX - 10, centerY - 15, 20, 30);
            
            // 绘制信号灯
            const blinkIntensity = sig.isAnimating ? 
                0.5 + 0.5 * Math.sin(sig.blinkPhase || 0) : 1;
            
            this.ctx.fillStyle = sig.isRed ? 
                `rgba(139, 0, 0, ${blinkIntensity})` : 
                `rgba(34, 139, 34, ${blinkIntensity})`;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 绘制光晕效果
            if (!sig.isRed) {
                const gradient = this.ctx.createRadialGradient(
                    centerX, centerY, 0,
                    centerX, centerY, 15
                );
                gradient.addColorStop(0, 'rgba(34, 139, 34, 0.5)');
                gradient.addColorStop(1, 'rgba(34, 139, 34, 0)');
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }

    /**
     * 绘制站台
     * @param {Array} platforms - 站台列表
     */
    drawPlatforms(platforms) {
        platforms.forEach(platform => {
            const centerX = this.offsetX + platform.x * this.gridSize + this.gridSize / 2;
            const centerY = this.offsetY + platform.y * this.gridSize + this.gridSize / 2;
            
            // 绘制站台
            this.ctx.fillStyle = Colors.platform;
            this.ctx.fillRect(
                centerX - this.gridSize / 2 + 5,
                centerY - this.gridSize / 2 + 5,
                this.gridSize - 10,
                this.gridSize - 10
            );
            
            // 绘制站台边框
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
                centerX - this.gridSize / 2 + 5,
                centerY - this.gridSize / 2 + 5,
                this.gridSize - 10,
                this.gridSize - 10
            );
            
            // 绘制站台编号
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(`P${platform.id || 1}`, centerX, centerY);
        });
    }

    /**
     * 绘制入口
     * @param {Array} entrances - 入口列表
     */
    drawEntrances(entrances) {
        entrances.forEach(entrance => {
            const centerX = this.offsetX + entrance.x * this.gridSize + this.gridSize / 2;
            const centerY = this.offsetY + entrance.y * this.gridSize + this.gridSize / 2;
            
            // 绘制入口
            this.ctx.fillStyle = Colors.entrance;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 绘制入口边框
            this.ctx.strokeStyle = '#228B22';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // 绘制入口指示
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('入口', centerX, centerY);
        });
    }

    /**
     * 绘制火车
     * @param {Array} trains - 火车列表
     */
    drawTrains(trains) {
        trains.forEach(train => {
            this.drawTrain(train);
        });
    }

    /**
     * 绘制单个火车
     * @param {Object} train - 火车对象
     */
    drawTrain(train) {
        // 获取火车颜色
        let trainColor = Colors.trainFreight;
        if (train.type) {
            if (train.type.name === '高铁') {
                trainColor = Colors.trainHighSpeed;
            } else if (train.type.name === '地铁') {
                trainColor = Colors.trainSubway;
            }
        }
        
        // 使用动画位置
        const headX = this.offsetX + (train.animX || train.x) * this.gridSize + this.gridSize / 2;
        const headY = this.offsetY + (train.animY || train.y) * this.gridSize + this.gridSize / 2;
        
        // 绘制车厢
        if (train.cars) {
            train.cars.forEach((car, index) => {
                const carX = this.offsetX + (car.animX || car.x) * this.gridSize + this.gridSize / 2;
                const carY = this.offsetY + (car.animY || car.y) * this.gridSize + this.gridSize / 2;
                
                this.drawCar(carX, carY, Colors.trainCar, train.status === 'crashed');
            });
        }
        
        // 绘制车头
        this.drawLocomotive(headX, headY, trainColor, train.direction, train.status);
    }

    /**
     * 绘制车头
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {string} color - 颜色
     * @param {string} direction - 方向
     * @param {string} status - 状态
     */
    drawLocomotive(x, y, color, direction, status) {
        this.ctx.save();
        this.ctx.translate(x, y);
        
        // 根据方向旋转
        switch (direction) {
            case 'up':
                this.ctx.rotate(-Math.PI / 2);
                break;
            case 'down':
                this.ctx.rotate(Math.PI / 2);
                break;
            case 'left':
                this.ctx.rotate(Math.PI);
                break;
        }
        
        // 绘制车头主体
        this.ctx.fillStyle = status === 'crashed' ? Colors.explosion : color;
        this.ctx.fillRect(-15, -12, 30, 24);
        
        // 绘制车头前窗
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(8, -8, 5, 16);
        
        // 绘制车灯
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(13, -5, 3, 0, Math.PI * 2);
        this.ctx.arc(13, 5, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制车轮
        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.arc(-10, -12, 4, 0, Math.PI * 2);
        this.ctx.arc(10, -12, 4, 0, Math.PI * 2);
        this.ctx.arc(-10, 12, 4, 0, Math.PI * 2);
        this.ctx.arc(10, 12, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }

    /**
     * 绘制车厢
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {string} color - 颜色
     * @param {boolean} isCrashed - 是否相撞
     */
    drawCar(x, y, color, isCrashed = false) {
        this.ctx.fillStyle = isCrashed ? Colors.explosion : color;
        this.ctx.fillRect(x - 12, y - 10, 24, 20);
        
        // 绘制车厢窗户
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(x - 8, y - 6, 6, 12);
        this.ctx.fillRect(x + 2, y - 6, 6, 12);
        
        // 绘制车轮
        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.arc(x - 8, y - 10, 3, 0, Math.PI * 2);
        this.ctx.arc(x + 8, y - 10, 3, 0, Math.PI * 2);
        this.ctx.arc(x - 8, y + 10, 3, 0, Math.PI * 2);
        this.ctx.arc(x + 8, y + 10, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * 添加爆炸特效
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    addExplosionEffect(x, y) {
        this.effects.push({
            type: 'explosion',
            x: this.offsetX + x * this.gridSize + this.gridSize / 2,
            y: this.offsetY + y * this.gridSize + this.gridSize / 2,
            progress: 0,
            maxProgress: 1
        });
    }

    /**
     * 添加烟花特效
     */
    addFireworkEffect() {
        for (let i = 0; i < 5; i++) {
            this.effects.push({
                type: 'firework',
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height * 0.5,
                progress: 0,
                maxProgress: 1,
                color: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'][i]
            });
        }
    }

    /**
     * 更新特效
     * @param {number} deltaTime - 时间增量
     */
    updateEffects(deltaTime) {
        this.effects = this.effects.filter(effect => {
            effect.progress += deltaTime * 2;
            return effect.progress < effect.maxProgress;
        });
    }

    /**
     * 绘制特效
     */
    drawEffects() {
        this.effects.forEach(effect => {
            if (effect.type === 'explosion') {
                this.drawExplosion(effect);
            } else if (effect.type === 'firework') {
                this.drawFirework(effect);
            }
        });
    }

    /**
     * 绘制爆炸特效
     * @param {Object} effect - 特效对象
     */
    drawExplosion(effect) {
        const alpha = 1 - effect.progress;
        const radius = 30 * effect.progress;
        
        // 爆炸外圈
        this.ctx.fillStyle = `rgba(255, 69, 0, ${alpha})`;
        this.ctx.beginPath();
        this.ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 爆炸内圈
        this.ctx.fillStyle = `rgba(255, 255, 0, ${alpha * 0.8})`;
        this.ctx.beginPath();
        this.ctx.arc(effect.x, effect.y, radius * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * 绘制烟花特效
     * @param {Object} effect - 特效对象
     */
    drawFirework(effect) {
        const alpha = 1 - effect.progress;
        const radius = 40 * effect.progress;
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        // 绘制放射状烟花
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const endX = effect.x + Math.cos(angle) * radius;
            const endY = effect.y + Math.sin(angle) * radius;
            
            this.ctx.strokeStyle = effect.color;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(effect.x, effect.y);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
            
            // 绘制火花
            this.ctx.fillStyle = '#FFF';
            this.ctx.beginPath();
            this.ctx.arc(endX, endY, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }

    /**
     * 绘制暂停遮罩
     */
    drawPauseOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 48px Georgia';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('已暂停', this.canvas.width / 2, this.canvas.height / 2);
    }

    /**
     * 更新动画时间
     * @param {number} deltaTime - 时间增量
     */
    update(deltaTime) {
        this.animationTime += deltaTime;
        this.updateEffects(deltaTime);
    }

    /**
     * 主渲染函数
     * @param {Object} gameState - 游戏状态
     */
    render(gameState) {
        this.clear();
        
        if (!gameState) {
            return;
        }
        
        // 计算偏移量
        this.calculateOffset(gameState.mapWidth, gameState.mapHeight);
        
        // 绘制网格
        this.drawGrid(gameState.mapWidth, gameState.mapHeight);
        
        // 绘制轨道
        this.drawTracks(gameState.trackMap);
        
        // 绘制站台
        this.drawPlatforms(gameState.platforms);
        
        // 绘制入口
        this.drawEntrances(gameState.entrances);
        
        // 绘制道岔
        this.drawSwitches(gameState.switches);
        
        // 绘制信号灯
        this.drawSignals(gameState.signals);
        
        // 绘制火车
        this.drawTrains(gameState.trains);
        
        // 绘制特效
        this.drawEffects();
        
        // 绘制暂停遮罩
        if (gameState.isPaused && gameState.isPaused()) {
            this.drawPauseOverlay();
        }
    }
}

export default Renderer;
