/**
 * 游戏对象模块
 * 包含水果、炸弹等游戏对象的定义
 */

// 水果类型定义
const FRUIT_TYPES = {
    apple: {
        name: '苹果',
        color: '#ff4444',
        innerColor: '#fffacd',
        score: 10,
        radius: 30,
        shape: 'circle'
    },
    watermelon: {
        name: '西瓜',
        color: '#228b22',
        innerColor: '#ff4444',
        seedColor: '#000000',
        score: 15,
        radius: 45,
        shape: 'ellipse',
        widthRatio: 1.3,
        heightRatio: 0.8
    },
    banana: {
        name: '香蕉',
        color: '#ffd700',
        innerColor: '#fffacd',
        score: 10,
        radius: 35,
        shape: 'banana'
    },
    orange: {
        name: '橙子',
        color: '#ff8c00',
        innerColor: '#ffa500',
        score: 10,
        radius: 32,
        shape: 'circle'
    },
    pineapple: {
        name: '菠萝',
        color: '#daa520',
        innerColor: '#ffd700',
        score: 20,
        radius: 38,
        shape: 'oval',
        widthRatio: 0.8,
        heightRatio: 1.2
    }
};

// 炸弹类型
const BOMB_TYPE = {
    name: '炸弹',
    color: '#1a1a1a',
    outlineColor: '#333333',
    radius: 35,
    damage: 1
};

/**
 * 游戏对象基类
 */
class GameObject {
    constructor(x, y, vx, vy, radius) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.rotation = 0;
        this.rotationSpeed = Utils.randomFloat(-0.05, 0.05);
        this.active = true;
        this.hasEnteredScreen = false; // 标记是否已经进入过屏幕
    }
    
    /**
     * 更新位置
     * @param {number} gravity - 重力加速度
     * @param {number} dt - 时间增量
     * @param {number} screenWidth - 屏幕宽度
     * @param {number} screenHeight - 屏幕高度
     */
    update(gravity, dt, screenWidth, screenHeight) {
        // 应用重力
        this.vy += gravity * dt;
        
        // 更新位置
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // 更新旋转
        this.rotation += this.rotationSpeed;
        
        // 检查是否进入屏幕
        if (!this.hasEnteredScreen && screenWidth && screenHeight) {
            // 检查对象是否在屏幕范围内
            const isInScreen = this.y <= screenHeight + this.radius &&
                              this.y >= -this.radius &&
                              this.x >= -this.radius &&
                              this.x <= screenWidth + this.radius;
            
            if (isInScreen) {
                this.hasEnteredScreen = true;
            }
        }
    }
    
    /**
     * 检查是否超出屏幕(应该被移除)
     * 只有当对象已经进入过屏幕,然后又离开时,才返回true
     * @param {number} screenWidth - 屏幕宽度
     * @param {number} screenHeight - 屏幕高度
     * @returns {boolean} 是否应该被移除
     */
    shouldBeRemoved(screenWidth, screenHeight) {
        // 如果还没有进入过屏幕,不应该被移除
        if (!this.hasEnteredScreen) {
            return false;
        }
        
        // 检查是否完全离开屏幕
        return this.isOffScreen(screenWidth, screenHeight);
    }
    
    /**
     * 检查是否超出屏幕
     * @param {number} screenWidth - 屏幕宽度
     * @param {number} screenHeight - 屏幕高度
     * @returns {boolean} 是否超出
     */
    isOffScreen(screenWidth, screenHeight) {
        return this.y > screenHeight + this.radius * 2 || // 在屏幕底部外更远
               this.y < -this.radius * 2 || // 在屏幕顶部外更远
               this.x < -this.radius * 2 || 
               this.x > screenWidth + this.radius * 2;
    }
}

/**
 * 水果类
 */
class Fruit extends GameObject {
    constructor(x, y, vx, vy, type) {
        const fruitType = FRUIT_TYPES[type];
        super(x, y, vx, vy, fruitType.radius);
        
        this.type = type;
        this.fruitType = fruitType;
        this.color = fruitType.color;
        this.innerColor = fruitType.innerColor;
        this.score = fruitType.score;
        this.shape = fruitType.shape;
        
        // 西瓜特有的属性
        if (type === 'watermelon') {
            this.widthRatio = fruitType.widthRatio;
            this.heightRatio = fruitType.heightRatio;
            this.seedColor = fruitType.seedColor;
        }
        
        // 菠萝特有的属性
        if (type === 'pineapple') {
            this.widthRatio = fruitType.widthRatio;
            this.heightRatio = fruitType.heightRatio;
        }
        
        // 切割相关
        this.sliced = false;
        this.sliceAngle = 0;
    }
    
    /**
     * 绘制水果
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        switch (this.shape) {
            case 'circle':
                this.drawCircle(ctx);
                break;
            case 'ellipse':
                this.drawEllipse(ctx);
                break;
            case 'banana':
                this.drawBanana(ctx);
                break;
            default:
                this.drawCircle(ctx);
        }
        
        ctx.restore();
    }
    
    /**
     * 绘制圆形水果
     */
    drawCircle(ctx) {
        // 外发光
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        
        // 外皮
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // 内发光
        ctx.shadowBlur = 0;
        const gradient = ctx.createRadialGradient(
            -this.radius * 0.3, -this.radius * 0.3, 0,
            0, 0, this.radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
        
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }
    
    /**
     * 绘制椭圆形水果(西瓜、菠萝)
     */
    drawEllipse(ctx) {
        const width = this.radius * this.widthRatio;
        const height = this.radius * this.heightRatio;
        
        // 外发光
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        
        // 外皮
        ctx.beginPath();
        ctx.ellipse(0, 0, width, height, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // 西瓜特殊处理 - 深绿外皮上的浅色条纹
        if (this.type === 'watermelon') {
            ctx.shadowBlur = 0;
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const stripeWidth = Utils.randomFloat(3, 6);
                ctx.save();
                ctx.rotate(angle);
                ctx.beginPath();
                ctx.ellipse(0, 0, width + 2, height + 2, 0, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(144, 238, 144, 0.3)';
                ctx.lineWidth = stripeWidth;
                ctx.stroke();
                ctx.restore();
            }
        }
        
        // 菠萝特殊处理 - 菱形纹理
        if (this.type === 'pineapple') {
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(139, 69, 19, 0.4)';
            ctx.lineWidth = 1;
            
            const gridSize = 12;
            for (let i = -3; i <= 3; i++) {
                for (let j = -2; j <= 2; j++) {
                    const x = i * gridSize;
                    const y = j * gridSize;
                    
                    // 检查是否在椭圆内
                    const normalizedX = x / width;
                    const normalizedY = y / height;
                    if (normalizedX * normalizedX + normalizedY * normalizedY <= 1) {
                        ctx.beginPath();
                        ctx.moveTo(x, y - gridSize / 2);
                        ctx.lineTo(x + gridSize / 2, y);
                        ctx.lineTo(x, y + gridSize / 2);
                        ctx.lineTo(x - gridSize / 2, y);
                        ctx.closePath();
                        ctx.stroke();
                    }
                }
            }
        }
    }
    
    /**
     * 绘制香蕉
     */
    drawBanana(ctx) {
        // 外发光
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        // 香蕉形状 - 使用贝塞尔曲线
        ctx.moveTo(-this.radius, 0);
        
        // 外侧曲线
        ctx.bezierCurveTo(
            -this.radius * 0.5, -this.radius * 0.8,
            this.radius * 0.5, -this.radius * 0.8,
            this.radius, 0
        );
        
        // 内侧曲线
        ctx.bezierCurveTo(
            this.radius * 0.5, this.radius * 0.3,
            -this.radius * 0.5, this.radius * 0.3,
            -this.radius, 0
        );
        
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // 高光
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(-this.radius * 0.8, 0);
        ctx.bezierCurveTo(
            -this.radius * 0.4, -this.radius * 0.5,
            this.radius * 0.4, -this.radius * 0.5,
            this.radius * 0.8, 0
        );
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
}

/**
 * 水果切片类
 */
class FruitSlice extends GameObject {
    constructor(fruit, isLeft) {
        super(fruit.x, fruit.y, fruit.vx, fruit.vy, fruit.radius);
        
        this.fruitType = fruit.fruitType;
        this.color = fruit.color;
        this.innerColor = fruit.innerColor;
        this.shape = fruit.shape;
        this.sliceAngle = fruit.sliceAngle;
        this.isLeft = isLeft;
        
        // 切片分离速度
        const angle = this.sliceAngle + (isLeft ? -Math.PI / 2 : Math.PI / 2);
        const splitSpeed = Utils.randomFloat(2, 4);
        this.vx += Math.cos(angle) * splitSpeed;
        this.vy += Math.sin(angle) * splitSpeed;
        
        // 旋转
        this.rotationSpeed = (isLeft ? -1 : 1) * Utils.randomFloat(0.1, 0.3);
    }
    
    /**
     * 绘制切片
     */
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // 根据形状绘制不同的切片
        switch (this.shape) {
            case 'circle':
            case 'ellipse':
                this.drawCircleSlice(ctx);
                break;
            case 'banana':
                this.drawBananaSlice(ctx);
                break;
            default:
                this.drawCircleSlice(ctx);
        }
        
        ctx.restore();
    }
    
    /**
     * 绘制圆形切片
     */
    drawCircleSlice(ctx) {
        const radius = this.radius;
        const isWatermelon = this.fruitType.name === '西瓜';
        
        // 保存当前变换
        ctx.save();
        
        // 旋转切片角度
        ctx.rotate(this.sliceAngle);
        
        // 绘制半片
        ctx.beginPath();
        if (this.isLeft) {
            ctx.arc(0, 0, radius, Math.PI / 2, -Math.PI / 2, false);
        } else {
            ctx.arc(0, 0, radius, -Math.PI / 2, Math.PI / 2, false);
        }
        ctx.closePath();
        
        // 填充外皮颜色
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // 西瓜特殊处理 - 显示红色果肉和黑籽
        if (isWatermelon) {
            // 红色果肉
            ctx.beginPath();
            if (this.isLeft) {
                ctx.arc(0, 0, radius * 0.8, Math.PI / 2, -Math.PI / 2, false);
            } else {
                ctx.arc(0, 0, radius * 0.8, -Math.PI / 2, Math.PI / 2, false);
            }
            ctx.closePath();
            ctx.fillStyle = this.innerColor;
            ctx.fill();
            
            // 黑籽
            ctx.fillStyle = '#000';
            const seedPositions = [
                { x: radius * 0.3, y: -radius * 0.2 },
                { x: radius * 0.4, y: radius * 0.1 },
                { x: radius * 0.2, y: radius * 0.3 }
            ];
            
            seedPositions.forEach(pos => {
                if (this.isLeft && pos.x > 0) return;
                if (!this.isLeft && pos.x < 0) return;
                
                ctx.beginPath();
                ctx.ellipse(pos.x, pos.y, 3, 2, 0, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        
        // 绘制切割面
        ctx.beginPath();
        ctx.moveTo(0, -radius);
        ctx.lineTo(0, radius);
        ctx.strokeStyle = this.innerColor;
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // 切割面的光泽
        ctx.beginPath();
        ctx.moveTo(0, -radius * 0.8);
        ctx.lineTo(0, radius * 0.8);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }
    
    /**
     * 绘制香蕉切片
     */
    drawBananaSlice(ctx) {
        // 简化为椭圆形切片
        ctx.save();
        ctx.rotate(this.sliceAngle);
        
        const width = this.radius * 0.6;
        const height = this.radius;
        
        ctx.beginPath();
        ctx.ellipse(0, 0, width, height, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // 切割面
        ctx.beginPath();
        ctx.moveTo(-width, 0);
        ctx.lineTo(width, 0);
        ctx.strokeStyle = this.innerColor;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.restore();
    }
}

/**
 * 炸弹类
 */
class Bomb extends GameObject {
    constructor(x, y, vx, vy) {
        super(x, y, vx, vy, BOMB_TYPE.radius);
        
        this.color = BOMB_TYPE.color;
        this.outlineColor = BOMB_TYPE.outlineColor;
        this.damage = BOMB_TYPE.damage;
        
        // 引线和烟雾
        this.fuseLength = 20;
        this.fuseAngle = -Math.PI / 4;
        this.smokeParticles = [];
        this.smokeTimer = 0;
        
        // 发光闪烁
        this.glowIntensity = 0;
        this.glowDirection = 1;
    }
    
    /**
     * 更新炸弹
     */
    update(gravity, dt) {
        super.update(gravity, dt);
        
        // 更新发光闪烁
        this.glowIntensity += this.glowDirection * 0.05;
        if (this.glowIntensity >= 1) {
            this.glowIntensity = 1;
            this.glowDirection = -1;
        } else if (this.glowIntensity <= 0) {
            this.glowIntensity = 0;
            this.glowDirection = 1;
        }
        
        // 更新烟雾粒子
        this.smokeTimer += dt;
        if (this.smokeTimer >= 0.1) {
            this.smokeTimer = 0;
            this.addSmokeParticle();
        }
        
        // 更新现有烟雾
        this.smokeParticles = this.smokeParticles.filter(p => {
            p.life -= dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.size += dt * 5;
            return p.life > 0;
        });
    }
    
    /**
     * 添加烟雾粒子
     */
    addSmokeParticle() {
        const fuseEndX = this.x + Math.cos(this.fuseAngle + this.rotation) * this.fuseLength;
        const fuseEndY = this.y + Math.sin(this.fuseAngle + this.rotation) * this.fuseLength;
        
        this.smokeParticles.push({
            x: fuseEndX + Utils.randomFloat(-5, 5),
            y: fuseEndY + Utils.randomFloat(-5, 5),
            vx: Utils.randomFloat(-10, 10),
            vy: Utils.randomFloat(-30, -10),
            size: Utils.randomFloat(3, 6),
            life: Utils.randomFloat(0.5, 1.0),
            maxLife: 1.0
        });
    }
    
    /**
     * 绘制炸弹
     */
    draw(ctx) {
        // 先绘制烟雾
        this.smokeParticles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life / p.maxLife * 0.6;
            ctx.fillStyle = '#666';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // 外发光(红色闪烁)
        const glowColor = `rgba(255, 0, 0, ${this.glowIntensity * 0.5})`;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 20 + this.glowIntensity * 10;
        
        // 炸弹主体
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        
        // 径向渐变 - 黑色球体带有高光
        const gradient = ctx.createRadialGradient(
            -this.radius * 0.3, -this.radius * 0.3, 0,
            0, 0, this.radius
        );
        gradient.addColorStop(0, '#444');
        gradient.addColorStop(0.5, '#222');
        gradient.addColorStop(1, '#111');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 外边框
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 高光
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(-this.radius * 0.3, -this.radius * 0.3, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fill();
        
        // 红色骷髅标记
        ctx.shadowBlur = 0;
        this.drawSkull(ctx);
        
        // 引线
        this.drawFuse(ctx);
        
        ctx.restore();
    }
    
    /**
     * 绘制骷髅标记
     */
    drawSkull(ctx) {
        const size = this.radius * 0.5;
        ctx.fillStyle = '#ff0000';
        
        // 头骨
        ctx.beginPath();
        ctx.arc(0, -size * 0.2, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // 下颌
        ctx.beginPath();
        ctx.moveTo(-size * 0.3, size * 0.1);
        ctx.lineTo(-size * 0.25, size * 0.4);
        ctx.lineTo(-size * 0.1, size * 0.35);
        ctx.lineTo(0, size * 0.45);
        ctx.lineTo(size * 0.1, size * 0.35);
        ctx.lineTo(size * 0.25, size * 0.4);
        ctx.lineTo(size * 0.3, size * 0.1);
        ctx.closePath();
        ctx.fill();
        
        // 眼窝
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.ellipse(-size * 0.2, -size * 0.25, size * 0.12, size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(size * 0.2, -size * 0.25, size * 0.12, size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 鼻腔
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.05);
        ctx.lineTo(-size * 0.05, size * 0.05);
        ctx.lineTo(size * 0.05, size * 0.05);
        ctx.closePath();
        ctx.fill();
    }
    
    /**
     * 绘制引线
     */
    drawFuse(ctx) {
        // 引线
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        const fuseEndX = Math.cos(this.fuseAngle) * this.fuseLength;
        const fuseEndY = -this.radius + Math.sin(this.fuseAngle) * this.fuseLength;
        ctx.lineTo(fuseEndX, fuseEndY);
        ctx.stroke();
        
        // 引线火花
        const sparkSize = 5 + this.glowIntensity * 3;
        ctx.fillStyle = '#ffaa00';
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 10 + this.glowIntensity * 5;
        
        ctx.beginPath();
        ctx.arc(fuseEndX, fuseEndY, sparkSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 火花中心
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(fuseEndX, fuseEndY, sparkSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 导出到全局对象
window.FRUIT_TYPES = FRUIT_TYPES;
window.BOMB_TYPE = BOMB_TYPE;
window.GameObject = GameObject;
window.Fruit = Fruit;
window.FruitSlice = FruitSlice;
window.Bomb = Bomb;
