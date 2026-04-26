/**
 * 特效模块
 * 包含粒子效果、飘字、光剑等特效
 */

/**
 * 果汁粒子类
 * 喷射方向与切割轨迹垂直
 */
class JuiceParticle {
    constructor(x, y, angle, color) {
        this.x = x;
        this.y = y;
        
        // 速度 - 与切割轨迹垂直方向喷射
        const speed = Utils.randomFloat(200, 400);
        const perpendicularAngle = angle + Math.PI / 2;
        
        // 随机选择两个垂直方向之一
        const direction = Math.random() > 0.5 ? 1 : -1;
        const finalAngle = perpendicularAngle * direction;
        
        // 添加一些随机散布
        const spread = Utils.randomFloat(-0.3, 0.3);
        
        this.vx = Math.cos(finalAngle + spread) * speed;
        this.vy = Math.sin(finalAngle + spread) * speed;
        
        this.color = color;
        this.size = Utils.randomFloat(3, 8);
        this.life = Utils.randomFloat(0.5, 1.0);
        this.maxLife = this.life;
        this.gravity = 500;
        
        // 不透明度
        this.alpha = 1;
    }
    
    /**
     * 更新粒子
     */
    update(dt) {
        this.life -= dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += this.gravity * dt;
        
        // 逐渐变小和透明
        this.alpha = this.life / this.maxLife;
        this.size *= (1 - dt * 2);
    }
    
    /**
     * 绘制粒子
     */
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        // 外发光
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    /**
     * 检查是否存活
     */
    isAlive() {
        return this.life > 0 && this.size > 0.5;
    }
}

/**
 * 分数飘字类
 * 向上飘动逐渐透明消失
 */
class ScoreFloat {
    constructor(x, y, score, combo = 0) {
        this.x = x;
        this.y = y;
        this.score = score;
        this.combo = combo;
        
        this.vy = -80; // 向上飘动速度
        this.life = 1.5;
        this.maxLife = this.life;
        
        this.fontSize = combo > 0 ? 28 : 24;
        this.color = combo > 0 ? '#ffff00' : '#ffffff';
        
        // 连击文字
        this.comboText = combo >= 3 ? `${combo}连击!` : '';
    }
    
    /**
     * 更新飘字
     */
    update(dt) {
        this.life -= dt;
        this.y += this.vy * dt;
        
        // 轻微左右飘动
        this.x += Math.sin(this.life * 5) * 20 * dt;
    }
    
    /**
     * 绘制飘字
     */
    draw(ctx) {
        const alpha = this.life / this.maxLife;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 主分数文字
        ctx.font = `bold ${this.fontSize}px Arial`;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        
        ctx.fillText(`+${this.score}`, this.x, this.y);
        
        // 连击文字
        if (this.comboText) {
            ctx.font = `bold ${this.fontSize * 0.8}px Arial`;
            ctx.fillStyle = '#ff6600';
            ctx.shadowColor = '#ff6600';
            ctx.fillText(this.comboText, this.x, this.y + this.fontSize);
        }
        
        ctx.restore();
    }
    
    /**
     * 检查是否存活
     */
    isAlive() {
        return this.life > 0;
    }
}

/**
 * 光剑拖尾粒子类
 */
class LightsaberParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Utils.randomFloat(5, 10);
        this.life = Utils.randomFloat(0.3, 0.6);
        this.maxLife = this.life;
    }
    
    /**
     * 更新粒子
     */
    update(dt) {
        this.life -= dt;
        this.size *= (1 - dt * 3);
    }
    
    /**
     * 绘制粒子
     */
    draw(ctx) {
        const alpha = this.life / this.maxLife;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    /**
     * 检查是否存活
     */
    isAlive() {
        return this.life > 0 && this.size > 0.5;
    }
}

/**
 * 切割轨迹类
 * 每次滑动显示一条半透明的弧线轨迹
 */
class SliceTrail {
    constructor() {
        this.points = [];
        this.maxPoints = 30;
        this.life = 0.5;
    }
    
    /**
     * 添加点
     */
    addPoint(x, y) {
        this.points.push({
            x: x,
            y: y,
            timestamp: Date.now()
        });
        
        // 限制点数
        if (this.points.length > this.maxPoints) {
            this.points.shift();
        }
    }
    
    /**
     * 更新轨迹
     */
    update(dt) {
        const now = Date.now();
        this.points = this.points.filter(p => {
            return (now - p.timestamp) < this.life * 1000;
        });
    }
    
    /**
     * 绘制轨迹
     */
    draw(ctx) {
        if (this.points.length < 2) return;
        
        const now = Date.now();
        
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // 绘制平滑曲线
        for (let i = 1; i < this.points.length; i++) {
            const prev = this.points[i - 1];
            const current = this.points[i];
            
            // 计算不透明度
            const age = (now - current.timestamp) / 1000;
            const alpha = Math.max(0, 1 - age / this.life);
            
            ctx.globalAlpha = alpha * 0.6;
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 10;
            
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(current.x, current.y);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    /**
     * 清除轨迹
     */
    clear() {
        this.points = [];
    }
}

/**
 * 光剑类
 * 剑刃长度约60-80像素,呈细长圆柱形
 * 发光效果:剑刃带有内发光和外发光模糊
 */
class Lightsaber {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.prevX = 0;
        this.prevY = 0;
        this.angle = 0;
        this.length = 70;
        this.width = 6;
        
        // 颜色(霓虹光剑色)
        this.colors = ['#00ffff', '#ff00ff', '#00ff00', '#ffff00', '#ff0000'];
        this.currentColor = this.colors[0];
        this.colorIndex = 0;
        
        // 状态
        this.isActive = false;
        this.trailParticles = [];
        this.particleTimer = 0;
    }
    
    /**
     * 设置位置
     */
    setPosition(x, y) {
        this.prevX = this.x;
        this.prevY = this.y;
        this.x = x;
        this.y = y;
        
        // 计算角度
        if (this.prevX !== this.x || this.prevY !== this.y) {
            this.angle = Utils.angle(this.prevX, this.prevY, this.x, this.y);
        }
    }
    
    /**
     * 激活光剑
     */
    activate() {
        this.isActive = true;
        // 随机切换颜色
        this.colorIndex = (this.colorIndex + 1) % this.colors.length;
        this.currentColor = this.colors[this.colorIndex];
    }
    
    /**
     * 停用光剑
     */
    deactivate() {
        this.isActive = false;
    }
    
    /**
     * 更新光剑
     */
    update(dt) {
        // 更新拖尾粒子
        this.trailParticles = this.trailParticles.filter(p => p.isAlive());
        this.trailParticles.forEach(p => p.update(dt));
        
        // 激活时生成拖尾粒子
        if (this.isActive) {
            this.particleTimer += dt;
            if (this.particleTimer >= 0.02) {
                this.particleTimer = 0;
                this.addTrailParticle();
            }
        }
    }
    
    /**
     * 添加拖尾粒子
     */
    addTrailParticle() {
        // 计算剑刃端点
        const endX = this.x + Math.cos(this.angle) * this.length;
        const endY = this.y + Math.sin(this.angle) * this.length;
        
        // 沿剑刃生成多个粒子
        const particleCount = 3;
        for (let i = 0; i < particleCount; i++) {
            const t = i / (particleCount - 1);
            const px = this.x + (endX - this.x) * t;
            const py = this.y + (endY - this.y) * t;
            
            // 添加一些随机偏移
            const offsetX = Utils.randomFloat(-5, 5);
            const offsetY = Utils.randomFloat(-5, 5);
            
            this.trailParticles.push(new LightsaberParticle(
                px + offsetX,
                py + offsetY,
                this.currentColor
            ));
        }
    }
    
    /**
     * 绘制光剑
     */
    draw(ctx) {
        // 先绘制拖尾粒子
        this.trailParticles.forEach(p => p.draw(ctx));
        
        // 如果不激活,不绘制剑刃
        if (!this.isActive) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // 外发光(最外层)
        ctx.shadowColor = this.currentColor;
        ctx.shadowBlur = 30;
        
        // 外发光层
        ctx.beginPath();
        ctx.rect(0, -this.width * 2, this.length, this.width * 4);
        ctx.fillStyle = this.currentColor + '33'; // 20%不透明度
        ctx.fill();
        
        // 中层发光
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.rect(0, -this.width * 1.5, this.length, this.width * 3);
        ctx.fillStyle = this.currentColor + '66'; // 40%不透明度
        ctx.fill();
        
        // 剑刃主体
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.rect(0, -this.width, this.length, this.width * 2);
        ctx.fillStyle = this.currentColor;
        ctx.fill();
        
        // 内发光(高光)
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.rect(0, -this.width * 0.5, this.length, this.width);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        
        // 剑刃末端渐变
        const gradient = ctx.createLinearGradient(this.length - 20, 0, this.length, 0);
        gradient.addColorStop(0, this.currentColor);
        gradient.addColorStop(1, this.currentColor + '00');
        
        ctx.beginPath();
        ctx.rect(this.length - 20, -this.width, 20, this.width * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.restore();
    }
}

/**
 * 连击特效类
 * 屏幕边缘闪烁金光
 */
class ComboEffect {
    constructor() {
        this.isActive = false;
        this.duration = 0.5;
        this.timer = 0;
        this.comboCount = 0;
    }
    
    /**
     * 触发连击特效
     */
    trigger(combo) {
        if (combo >= 3) {
            this.isActive = true;
            this.timer = this.duration;
            this.comboCount = combo;
        }
    }
    
    /**
     * 更新特效
     */
    update(dt) {
        if (!this.isActive) return;
        
        this.timer -= dt;
        if (this.timer <= 0) {
            this.isActive = false;
        }
    }
    
    /**
     * 绘制特效
     */
    draw(ctx, width, height) {
        if (!this.isActive) return;
        
        const alpha = this.timer / this.duration;
        const pulseIntensity = Math.sin(this.timer * 10) * 0.3 + 0.7;
        
        ctx.save();
        ctx.globalAlpha = alpha * pulseIntensity;
        
        // 边缘宽度
        const edgeWidth = 15;
        
        // 创建径向渐变 - 金色
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, Math.min(width, height) * 0.3,
            width / 2, height / 2, Math.max(width, height) * 0.7
        );
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
        gradient.addColorStop(1, `rgba(255, 215, 0, ${0.5 * pulseIntensity})`);
        
        // 填充整个屏幕
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // 边缘发光线条
        ctx.strokeStyle = `rgba(255, 215, 0, ${0.8 * alpha})`;
        ctx.lineWidth = edgeWidth;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 20;
        
        // 上边缘
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(width, 0);
        ctx.stroke();
        
        // 下边缘
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(width, height);
        ctx.stroke();
        
        // 左边缘
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, height);
        ctx.stroke();
        
        // 右边缘
        ctx.beginPath();
        ctx.moveTo(width, 0);
        ctx.lineTo(width, height);
        ctx.stroke();
        
        ctx.restore();
    }
}

/**
 * 爆炸效果类
 */
class ExplosionEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.particles = [];
        this.life = 0.8;
        this.maxLife = this.life;
        
        // 创建爆炸粒子
        this.createParticles();
    }
    
    /**
     * 创建爆炸粒子
     */
    createParticles() {
        const particleCount = 30;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2 + Utils.randomFloat(-0.2, 0.2);
            const speed = Utils.randomFloat(200, 500);
            
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Utils.randomFloat(4, 10),
                color: Utils.randomChoice(['#ff4444', '#ff8800', '#ffff00', '#ffffff']),
                life: Utils.randomFloat(0.4, 0.8),
                maxLife: 0.8
            });
        }
    }
    
    /**
     * 更新爆炸效果
     */
    update(dt) {
        this.life -= dt;
        
        this.particles = this.particles.filter(p => p.life > 0);
        this.particles.forEach(p => {
            p.life -= dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 200 * dt; // 重力
            p.size *= (1 - dt * 3);
        });
    }
    
    /**
     * 绘制爆炸效果
     */
    draw(ctx) {
        const alpha = this.life / this.maxLife;
        
        // 绘制闪光
        if (this.life > 0.6) {
            ctx.save();
            ctx.globalAlpha = alpha;
            
            // 径向渐变闪光
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, 100
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 200, 0, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 100, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
        
        // 绘制粒子
        this.particles.forEach(p => {
            const pAlpha = p.life / p.maxLife;
            
            ctx.save();
            ctx.globalAlpha = pAlpha;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }
    
    /**
     * 检查是否存活
     */
    isAlive() {
        return this.life > 0 || this.particles.length > 0;
    }
}

/**
 * 背景管理器
 * 深空/星空背景,或日式道场竹帘背景(随机)
 */
class BackgroundManager {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 随机选择背景类型
        this.backgroundType = Math.random() > 0.5 ? 'space' : 'dojo';
        
        // 星空背景相关
        this.stars = [];
        this.shootingStars = [];
        
        // 道场背景相关
        this.bambooPatterns = [];
        
        this.init();
    }
    
    /**
     * 初始化背景
     */
    init() {
        if (this.backgroundType === 'space') {
            this.initSpaceBackground();
        } else {
            this.initDojoBackground();
        }
    }
    
    /**
     * 初始化星空背景
     */
    initSpaceBackground() {
        // 创建星星
        const starCount = 200;
        for (let i = 0; i < starCount; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 0.5,
                brightness: Math.random(),
                twinkleSpeed: Math.random() * 2 + 1
            });
        }
    }
    
    /**
     * 初始化道场背景
     */
    initDojoBackground() {
        // 创建竹帘纹理
        const bambooCount = 30;
        for (let i = 0; i < bambooCount; i++) {
            this.bambooPatterns.push({
                x: (i / bambooCount) * this.width,
                width: Utils.randomFloat(15, 25),
                gap: Utils.randomFloat(5, 10)
            });
        }
    }
    
    /**
     * 更新背景
     */
    update(dt) {
        if (this.backgroundType === 'space') {
            this.updateSpaceBackground(dt);
        }
    }
    
    /**
     * 更新星空背景
     */
    updateSpaceBackground(dt) {
        // 星星闪烁
        this.stars.forEach(star => {
            star.brightness = 0.5 + Math.sin(Date.now() * 0.001 * star.twinkleSpeed) * 0.5;
        });
        
        // 随机生成流星
        if (Math.random() < 0.005) {
            this.shootingStars.push({
                x: Math.random() * this.width,
                y: -20,
                vx: Utils.randomFloat(200, 400),
                vy: Utils.randomFloat(300, 500),
                length: Utils.randomFloat(50, 100),
                life: 1.0
            });
        }
        
        // 更新流星
        this.shootingStars = this.shootingStars.filter(ss => ss.life > 0);
        this.shootingStars.forEach(ss => {
            ss.life -= dt;
            ss.x += ss.vx * dt;
            ss.y += ss.vy * dt;
        });
    }
    
    /**
     * 绘制背景
     */
    draw(ctx) {
        if (this.backgroundType === 'space') {
            this.drawSpaceBackground(ctx);
        } else {
            this.drawDojoBackground(ctx);
        }
    }
    
    /**
     * 绘制星空背景
     */
    drawSpaceBackground(ctx) {
        // 深空背景渐变
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#0a0a2e');
        gradient.addColorStop(0.3, '#1a1a4a');
        gradient.addColorStop(0.7, '#0f0f3a');
        gradient.addColorStop(1, '#05051a');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // 绘制星星
        this.stars.forEach(star => {
            ctx.save();
            ctx.globalAlpha = star.brightness;
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = star.size * 2;
            
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        // 绘制流星
        this.shootingStars.forEach(ss => {
            ctx.save();
            ctx.globalAlpha = ss.life;
            
            const angle = Math.atan2(ss.vy, ss.vx);
            
            // 流星拖尾
            const tailGradient = ctx.createLinearGradient(
                ss.x, ss.y,
                ss.x - Math.cos(angle) * ss.length,
                ss.y - Math.sin(angle) * ss.length
            );
            tailGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            tailGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.strokeStyle = tailGradient;
            ctx.lineWidth = 2;
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 10;
            
            ctx.beginPath();
            ctx.moveTo(ss.x, ss.y);
            ctx.lineTo(
                ss.x - Math.cos(angle) * ss.length,
                ss.y - Math.sin(angle) * ss.length
            );
            ctx.stroke();
            
            ctx.restore();
        });
    }
    
    /**
     * 绘制道场背景
     */
    drawDojoBackground(ctx) {
        // 深色背景
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, this.width, this.height);
        
        // 竹帘纹理
        ctx.save();
        ctx.globalAlpha = 0.3;
        
        // 垂直线条
        this.bambooPatterns.forEach(bamboo => {
            const gradient = ctx.createLinearGradient(
                bamboo.x, 0,
                bamboo.x + bamboo.width, 0
            );
            gradient.addColorStop(0, '#3d2914');
            gradient.addColorStop(0.3, '#5c4a2a');
            gradient.addColorStop(0.7, '#5c4a2a');
            gradient.addColorStop(1, '#3d2914');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(bamboo.x, 0, bamboo.width, this.height);
        });
        
        // 水平线条
        ctx.strokeStyle = '#2a1a0a';
        ctx.lineWidth = 2;
        
        for (let y = 0; y < this.height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }
        
        ctx.restore();
        
        // 添加一些装饰性的光晕
        const centerGradient = ctx.createRadialGradient(
            this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, this.height * 0.6
        );
        centerGradient.addColorStop(0, 'rgba(255, 200, 100, 0.1)');
        centerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = centerGradient;
        ctx.fillRect(0, 0, this.width, this.height);
    }
    
    /**
     * 重置背景(随机切换)
     */
    reset() {
        this.backgroundType = Math.random() > 0.5 ? 'space' : 'dojo';
        this.stars = [];
        this.shootingStars = [];
        this.bambooPatterns = [];
        this.init();
    }
}

// 导出到全局对象
window.JuiceParticle = JuiceParticle;
window.ScoreFloat = ScoreFloat;
window.LightsaberParticle = LightsaberParticle;
window.SliceTrail = SliceTrail;
window.Lightsaber = Lightsaber;
window.ComboEffect = ComboEffect;
window.ExplosionEffect = ExplosionEffect;
window.BackgroundManager = BackgroundManager;
