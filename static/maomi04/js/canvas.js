/**
 * Canvas渲染引擎模块
 * 负责游戏画面的渲染，包括背景、道具、猫咪动画
 */

const CanvasRenderer = {
    /**
     * Canvas元素和上下文
     */
    canvas: null,
    ctx: null,
    
    /**
     * 画布尺寸
     */
    width: 800,
    height: 500,
    
    /**
     * 动画帧ID
     */
    animationFrameId: null,
    
    /**
     * 游戏状态引用
     */
    gameState: null,
    
    /**
     * 初始化Canvas渲染器
     * @param {string} canvasId - Canvas元素ID
     * @param {Object} gameState - 游戏状态
     */
    init(canvasId, gameState) {
        console.log('Canvas渲染器初始化...');
        
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`找不到Canvas元素: ${canvasId}`);
            return false;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.gameState = gameState;
        
        // 设置Canvas尺寸
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // 绑定鼠标事件
        this.bindEvents();
        
        // 开始渲染循环
        this.startRenderLoop();
        
        console.log('Canvas渲染器初始化完成');
        return true;
    },

    /**
     * 绑定鼠标事件
     */
    bindEvents() {
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));
    },

    /**
     * 处理鼠标移动事件
     * @param {Event} e - 事件对象
     */
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.width / rect.width;
        const scaleY = this.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        // 检查是否悬停在某个元素上
        const hoveredElement = this.getHoveredElement(x, y);
        
        if (hoveredElement) {
            this.showTooltip(hoveredElement, e.clientX, e.clientY);
        } else {
            this.hideTooltip();
        }
    },

    /**
     * 处理点击事件
     * @param {Event} e - 事件对象
     */
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.width / rect.width;
        const scaleY = this.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        // 检查点击的是哪个元素
        const clickedElement = this.getClickedElement(x, y);
        
        if (clickedElement) {
            this.handleElementClick(clickedElement);
        }
    },

    /**
     * 处理鼠标离开事件
     */
    handleMouseLeave() {
        this.hideTooltip();
    },

    /**
     * 获取悬停的元素
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {Object|null} 元素对象
     */
    getHoveredElement(x, y) {
        // 首先检查猫咪（优先，因为猫咪在前面）
        const cats = CatSystem.getCurrentCats();
        for (let i = cats.length - 1; i >= 0; i--) {
            const catInstance = cats[i];
            const cat = GameData.getCatById(catInstance.catId);
            
            if (this.isPointInCat(x, y, catInstance.position)) {
                return {
                    type: 'cat',
                    catInstance: catInstance,
                    cat: cat
                };
            }
        }
        
        // 然后检查道具
        const placedItems = ItemSystem.getPlacedItems(this.gameState);
        for (let i = placedItems.length - 1; i >= 0; i--) {
            const item = placedItems[i];
            if (this.isPointInItem(x, y, item)) {
                return {
                    type: 'item',
                    item: item
                };
            }
        }
        
        return null;
    },

    /**
     * 获取点击的元素
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {Object|null} 元素对象
     */
    getClickedElement(x, y) {
        return this.getHoveredElement(x, y);
    },

    /**
     * 检查点是否在猫咪范围内
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {Object} pos - 猫咪位置 {x, y}
     * @returns {boolean} 是否在范围内
     */
    isPointInCat(x, y, pos) {
        const catRadius = 35;
        const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
        return distance <= catRadius;
    },

    /**
     * 检查点是否在道具范围内
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {Object} item - 道具对象
     * @returns {boolean} 是否在范围内
     */
    isPointInItem(x, y, item) {
        if (!item.canvasPosition || !item.size) {
            return false;
        }
        
        const pos = item.canvasPosition;
        const size = item.size;
        
        return x >= pos.x && x <= pos.x + size.width &&
               y >= pos.y && y <= pos.y + size.height;
    },

    /**
     * 处理元素点击
     * @param {Object} element - 元素对象
     */
    handleElementClick(element) {
        if (element.type === 'cat') {
            // 点击猫咪
            const cat = element.cat;
            const catInstance = element.catInstance;
            
            // 显示猫咪详情
            UI.showCatDetail(cat.id);
            
            console.log(`点击了猫咪: ${cat.name}, 剩余时间: ${Utils.formatTime(catInstance.remainingTime)}`);
        } else if (element.type === 'item') {
            // 点击道具
            const item = element.item;
            console.log(`点击了道具: ${item.name}`);
            
            // 可以添加道具交互
        }
    },

    /**
     * 显示提示框
     * @param {Object} element - 元素对象
     * @param {number} screenX - 屏幕X坐标
     * @param {number} screenY - 屏幕Y坐标
     */
    showTooltip(element, screenX, screenY) {
        const tooltip = document.getElementById('game-tooltip');
        if (!tooltip) return;
        
        let content = '';
        
        if (element.type === 'cat') {
            const cat = element.cat;
            const catInstance = element.catInstance;
            const remainingTime = Utils.formatTime(catInstance.remainingTime);
            
            content = `
                <div style="font-weight: bold; margin-bottom: 4px;">${cat.emoji} ${cat.name}</div>
                <div style="font-size: 12px; color: #666;">
                    ${this.getBehaviorText(catInstance.behavior)}<br>
                    剩余时间: ${remainingTime}
                </div>
            `;
        } else if (element.type === 'item') {
            const item = element.item;
            content = `
                <div style="font-weight: bold;">${item.emoji} ${item.name}</div>
                <div style="font-size: 12px; color: #666;">${item.description}</div>
            `;
        }
        
        tooltip.innerHTML = content;
        tooltip.style.left = (screenX + 15) + 'px';
        tooltip.style.top = (screenY + 15) + 'px';
        tooltip.classList.remove('hidden');
    },

    /**
     * 隐藏提示框
     */
    hideTooltip() {
        const tooltip = document.getElementById('game-tooltip');
        if (tooltip) {
            tooltip.classList.add('hidden');
        }
    },

    /**
     * 获取行为描述文本
     * @param {string} behavior - 行为类型
     * @returns {string} 描述文本
     */
    getBehaviorText(behavior) {
        const behaviorTexts = {
            'eating': '正在进食',
            'playing': '正在玩耍',
            'sleeping': '正在睡觉',
            'leaving': '准备离开',
            'idle': '正在闲逛'
        };
        return behaviorTexts[behavior] || '未知状态';
    },

    /**
     * 开始渲染循环
     */
    startRenderLoop() {
        const render = () => {
            this.render();
            this.animationFrameId = requestAnimationFrame(render);
        };
        render();
    },

    /**
     * 停止渲染循环
     */
    stopRenderLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    },

    /**
     * 主渲染函数
     */
    render() {
        if (!this.ctx) return;
        
        // 清空画布
        this.clear();
        
        // 绘制背景
        this.drawBackground();
        
        // 绘制道具
        this.drawItems();
        
        // 绘制猫咪
        this.drawCats();
        
        // 绘制装饰元素
        this.drawDecorations();
    },

    /**
     * 清空画布
     */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    },

    /**
     * 绘制背景
     */
    drawBackground() {
        // 绘制草地背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#90EE90');
        gradient.addColorStop(0.5, '#7CCD7C');
        gradient.addColorStop(1, '#6B8E23');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // 绘制草地图案
        this.drawGrassPattern();
        
        // 绘制围栏
        this.drawFence();
    },

    /**
     * 绘制草地图案
     */
    drawGrassPattern() {
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = '#556B2F';
        
        // 随机草叶
        for (let i = 0; i < 100; i++) {
            const x = (i * 37) % this.width;
            const y = this.height - 50 + Math.sin(i) * 20;
            const height = 10 + Math.random() * 15;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + 3, y - height);
            this.ctx.lineTo(x + 6, y);
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        this.ctx.restore();
    },

    /**
     * 绘制围栏
     */
    drawFence() {
        this.ctx.save();
        
        // 围栏颜色
        const fenceColor = '#8B4513';
        const fenceLight = '#A0522D';
        
        // 绘制围栏柱子
        const postWidth = 15;
        const postHeight = 60;
        const postSpacing = 60;
        
        this.ctx.fillStyle = fenceColor;
        
        for (let x = -10; x < this.width + postSpacing; x += postSpacing) {
            // 柱子
            this.ctx.fillRect(x, this.height - postHeight - 20, postWidth, postHeight);
            
            // 柱子顶部
            this.ctx.beginPath();
            this.ctx.arc(x + postWidth / 2, this.height - postHeight - 20, postWidth / 2 + 3, Math.PI, 0, false);
            this.ctx.fillStyle = fenceLight;
            this.ctx.fill();
        }
        
        // 绘制横杆
        this.ctx.fillStyle = fenceLight;
        this.ctx.fillRect(-10, this.height - postHeight + 10, this.width + 20, 8);
        this.ctx.fillRect(-10, this.height - postHeight + 30, this.width + 20, 8);
        
        this.ctx.restore();
    },

    /**
     * 绘制道具
     */
    drawItems() {
        const placedItems = ItemSystem.getPlacedItems(this.gameState);
        
        placedItems.forEach(item => {
            this.drawItem(item);
        });
    },

    /**
     * 绘制单个道具
     * @param {Object} item - 道具对象
     */
    drawItem(item) {
        if (!item.canvasPosition || !item.size) {
            return;
        }
        
        const pos = item.canvasPosition;
        const size = item.size;
        
        this.ctx.save();
        
        // 根据道具类型绘制不同样式
        switch (item.id) {
            case 'food_bowl':
                this.drawFoodBowl(pos.x, pos.y, size.width, size.height);
                break;
            case 'yarn_ball':
                this.drawYarnBall(pos.x, pos.y, size.width, size.height);
                break;
            case 'premium_food':
                this.drawPremiumFood(pos.x, pos.y, size.width, size.height);
                break;
            case 'cat_tree':
                this.drawCatTree(pos.x, pos.y, size.width, size.height);
                break;
            case 'cat_teaser':
                this.drawCatTeaser(pos.x, pos.y, size.width, size.height);
                break;
            case 'cat_bed':
                this.drawCatBed(pos.x, pos.y, size.width, size.height);
                break;
            case 'fish_board':
                this.drawFishBoard(pos.x, pos.y, size.width, size.height);
                break;
            case 'catnip':
                this.drawCatnip(pos.x, pos.y, size.width, size.height);
                break;
            default:
                this.drawDefaultItem(pos.x, pos.y, size.width, size.height, item);
        }
        
        this.ctx.restore();
    },

    /**
     * 绘制普通食盆
     */
    drawFoodBowl(x, y, width, height) {
        // 食盆阴影
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(x + width / 2, y + height + 5, width / 2, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        
        // 食盆主体
        const gradient = this.ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, '#DEB887');
        gradient.addColorStop(1, '#D2691E');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 食盆内圈
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.ellipse(x + width / 2, y + height / 2 - 3, width / 2 - 5, height / 2 - 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 食物（米饭）
        this.ctx.fillStyle = '#FFFAF0';
        this.ctx.beginPath();
        this.ctx.ellipse(x + width / 2, y + height / 2 - 5, width / 3, height / 3, 0, 0, Math.PI * 2);
        this.ctx.fill();
    },

    /**
     * 绘制毛线球
     */
    drawYarnBall(x, y, width, height) {
        const radius = width / 2;
        const centerX = x + radius;
        const centerY = y + radius;
        
        // 阴影
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, y + height + 5, radius, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        
        // 毛线球主体
        const gradient = this.ctx.createRadialGradient(centerX - 10, centerY - 10, 0, centerX, centerY, radius);
        gradient.addColorStop(0, '#FF69B4');
        gradient.addColorStop(1, '#FF1493');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 毛线纹理
        this.ctx.strokeStyle = '#FF69B4';
        this.ctx.lineWidth = 2;
        
        // 绘制螺旋线
        this.ctx.beginPath();
        for (let i = 0; i < 360; i += 5) {
            const angle = (i * Math.PI) / 180;
            const r = (i / 360) * (radius - 5);
            const px = centerX + Math.cos(angle * 3) * r;
            const py = centerY + Math.sin(angle * 3) * r;
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.stroke();
        
        // 伸出来的毛线
        this.ctx.strokeStyle = '#FF69B4';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX + radius - 5, centerY + radius - 5);
        this.ctx.quadraticCurveTo(centerX + radius + 10, centerY + radius, centerX + radius + 5, centerY + radius - 15);
        this.ctx.stroke();
    },

    /**
     * 绘制高级猫粮
     */
    drawPremiumFood(x, y, width, height) {
        // 阴影
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(x + width / 2, y + height + 5, width / 2, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        
        // 高级食盆（金色边框）
        const gradient = this.ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(1, '#DAA520');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 内圈
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.ellipse(x + width / 2, y + height / 2 - 3, width / 2 - 5, height / 2 - 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 高级猫粮（混合颜色）
        const colors = ['#8B4513', '#D2691E', '#A0522D', '#CD853F'];
        const foodRadius = width / 4;
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const r = foodRadius * 0.7;
            const fx = x + width / 2 + Math.cos(angle) * r;
            const fy = y + height / 2 - 5 + Math.sin(angle) * r;
            
            this.ctx.fillStyle = colors[i % colors.length];
            this.ctx.beginPath();
            this.ctx.arc(fx, fy, 5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    },

    /**
     * 绘制猫爬架
     */
    drawCatTree(x, y, width, height) {
        // 底座
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x + 10, y + height - 30, width - 20, 30);
        
        // 柱子
        const postWidth = 20;
        const postX = x + (width - postWidth) / 2;
        
        // 缠绕麻绳效果
        this.ctx.fillStyle = '#D2B48C';
        this.ctx.fillRect(postX, y + 50, postWidth, height - 80);
        
        // 麻绳纹理
        this.ctx.strokeStyle = '#A0522D';
        this.ctx.lineWidth = 1;
        for (let hy = y + 50; hy < y + height - 30; hy += 8) {
            this.ctx.beginPath();
            this.ctx.moveTo(postX, hy);
            this.ctx.lineTo(postX + postWidth, hy);
            this.ctx.stroke();
        }
        
        // 平台1
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x + 5, y + 80, width - 10, 15);
        
        // 平台2
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x + 15, y + 20, width - 30, 15);
        
        // 顶部装饰（小球）
        this.ctx.fillStyle = '#FF69B4';
        this.ctx.beginPath();
        this.ctx.arc(x + width / 2, y + 10, 10, 0, Math.PI * 2);
        this.ctx.fill();
    },

    /**
     * 绘制逗猫棒
     */
    drawCatTeaser(x, y, width, height) {
        // 杆子
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(x + width / 2, y + height);
        this.ctx.lineTo(x + width / 2, y + 10);
        this.ctx.stroke();
        
        // 羽毛/装饰
        this.ctx.fillStyle = '#FF69B4';
        this.ctx.beginPath();
        this.ctx.moveTo(x + width / 2, y + 10);
        this.ctx.quadraticCurveTo(x + width / 2 - 15, y + 25, x + width / 2 - 10, y + 40);
        this.ctx.quadraticCurveTo(x + width / 2, y + 30, x + width / 2 + 10, y + 40);
        this.ctx.quadraticCurveTo(x + width / 2 + 15, y + 25, x + width / 2, y + 10);
        this.ctx.fill();
        
        // 铃铛
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(x + width / 2, y + 50, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 铃铛轮廓
        this.ctx.strokeStyle = '#DAA520';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    },

    /**
     * 绘制猫窝
     */
    drawCatBed(x, y, width, height) {
        // 阴影
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(x + width / 2, y + height + 3, width / 2 + 5, 10, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        
        // 外框
        const gradient = this.ctx.createRadialGradient(
            x + width / 2, y + height / 2, 0,
            x + width / 2, y + height / 2, width / 2
        );
        gradient.addColorStop(0, '#FFE4B5');
        gradient.addColorStop(1, '#DEB887');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 内圈
        this.ctx.fillStyle = '#FFF8DC';
        this.ctx.beginPath();
        this.ctx.ellipse(x + width / 2, y + height / 2 - 5, width / 2 - 15, height / 2 - 15, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 垫子纹理
        this.ctx.strokeStyle = '#F5DEB3';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([4, 4]);
        this.ctx.beginPath();
        this.ctx.ellipse(x + width / 2, y + height / 2 - 5, width / 3, height / 3, 0, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    },

    /**
     * 绘制鱼形板
     */
    drawFishBoard(x, y, width, height) {
        // 鱼形
        this.ctx.fillStyle = '#FFD700';
        
        // 鱼身
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + height / 2);
        this.ctx.quadraticCurveTo(x + width / 3, y, x + width / 2, y + height / 2);
        this.ctx.quadraticCurveTo(x + width / 3, y + height, x, y + height / 2);
        this.ctx.fill();
        
        // 鱼头
        this.ctx.beginPath();
        this.ctx.ellipse(x + width * 0.7, y + height / 2, width * 0.3, height / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 鱼尾
        this.ctx.fillStyle = '#FFA500';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + height / 2);
        this.ctx.lineTo(x - 15, y + height / 4);
        this.ctx.lineTo(x - 15, y + height * 3 / 4);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 鱼眼睛
        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.arc(x + width * 0.8, y + height * 0.35, 3, 0, Math.PI * 2);
        this.ctx.fill();
    },

    /**
     * 绘制猫薄荷
     */
    drawCatnip(x, y, width, height) {
        // 花盆
        this.ctx.fillStyle = '#D2691E';
        this.ctx.beginPath();
        this.ctx.moveTo(x + 5, y + height);
        this.ctx.lineTo(x + width - 5, y + height);
        this.ctx.lineTo(x + width - 10, y + height - 20);
        this.ctx.lineTo(x + 10, y + height - 20);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 泥土
        this.ctx.fillStyle = '#5D4037';
        this.ctx.fillRect(x + 10, y + height - 20, width - 20, 5);
        
        // 叶子
        this.ctx.fillStyle = '#228B22';
        
        // 主茎
        this.ctx.strokeStyle = '#2E8B57';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(x + width / 2, y + height - 15);
        this.ctx.lineTo(x + width / 2, y + 10);
        this.ctx.stroke();
        
        // 叶子
        this.ctx.fillStyle = '#32CD32';
        
        // 左侧叶子
        this.ctx.beginPath();
        this.ctx.ellipse(x + width / 2 - 15, y + 25, 12, 6, -Math.PI / 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 右侧叶子
        this.ctx.beginPath();
        this.ctx.ellipse(x + width / 2 + 15, y + 35, 12, 6, Math.PI / 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 顶部叶子
        this.ctx.beginPath();
        this.ctx.ellipse(x + width / 2, y + 8, 8, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
    },

    /**
     * 绘制默认道具
     */
    drawDefaultItem(x, y, width, height, item) {
        // 简单的矩形加文字
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.strokeStyle = '#CCCCCC';
        this.ctx.lineWidth = 2;
        
        this.ctx.fillRect(x, y, width, height);
        this.ctx.strokeRect(x, y, width, height);
        
        this.ctx.fillStyle = '#333';
        this.ctx.font = '12px Microsoft YaHei';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(item.name, x + width / 2, y + height / 2 + 4);
    },

    /**
     * 绘制猫咪
     */
    drawCats() {
        const cats = CatSystem.getCurrentCats();
        
        cats.forEach(catInstance => {
            const cat = GameData.getCatById(catInstance.catId);
            if (cat) {
                this.drawCat(cat, catInstance);
            }
        });
    },

    /**
     * 绘制单个猫咪
     * @param {Object} cat - 猫咪数据
     * @param {Object} catInstance - 猫咪实例
     */
    drawCat(cat, catInstance) {
        const pos = catInstance.position;
        const behavior = catInstance.behavior;
        const animState = catInstance.animationState;
        
        this.ctx.save();
        
        // 移动到猫咪位置
        this.ctx.translate(pos.x, pos.y);
        
        // 计算动画偏移
        const animOffset = Math.sin(animState.frame * 0.5) * 2;
        
        // 根据行为绘制不同姿态
        switch (behavior) {
            case 'eating':
                this.drawCatEating(cat, animOffset);
                break;
            case 'playing':
                this.drawCatPlaying(cat, animOffset);
                break;
            case 'sleeping':
                this.drawCatSleeping(cat, animOffset);
                break;
            case 'leaving':
                this.drawCatLeaving(cat, animOffset);
                break;
            default:
                this.drawCatIdle(cat, animOffset);
        }
        
        // 显示剩余时间（如果是普通状态）
        if (behavior !== 'leaving') {
            this.drawCatTimeIndicator(catInstance);
        }
        
        this.ctx.restore();
    },

    /**
     * 绘制猫咪休息状态
     */
    drawCatIdle(cat, animOffset) {
        const colors = cat.colors || { body: '#FFA500', accent: '#FF8C00', eyes: '#333333' };
        
        // 身体
        this.ctx.fillStyle = colors.body;
        this.ctx.beginPath();
        this.ctx.ellipse(0, animOffset, 25, 20, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 头
        this.ctx.beginPath();
        this.ctx.arc(-15 + animOffset, -15, 18, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 耳朵
        this.ctx.beginPath();
        this.ctx.moveTo(-28, -30);
        this.ctx.lineTo(-20, -40);
        this.ctx.lineTo(-10, -30);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(-5, -30);
        this.ctx.lineTo(0, -40);
        this.ctx.lineTo(8, -30);
        this.ctx.fill();
        
        // 耳朵内部
        this.ctx.fillStyle = '#FFB6C1';
        this.ctx.beginPath();
        this.ctx.moveTo(-24, -30);
        this.ctx.lineTo(-19, -36);
        this.ctx.lineTo(-14, -30);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(-2, -30);
        this.ctx.lineTo(2, -36);
        this.ctx.lineTo(6, -30);
        this.ctx.fill();
        
        // 眼睛
        this.ctx.fillStyle = colors.eyes;
        this.ctx.beginPath();
        this.ctx.ellipse(-20, -18, 4, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.ellipse(-10, -18, 4, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 眼睛高光
        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(-19, -20, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(-9, -20, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 鼻子
        this.ctx.fillStyle = '#FFB6C1';
        this.ctx.beginPath();
        this.ctx.moveTo(-15, -10);
        this.ctx.lineTo(-12, -7);
        this.ctx.lineTo(-18, -7);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 嘴巴
        this.ctx.strokeStyle = colors.accent;
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(-15, -7);
        this.ctx.lineTo(-15, -4);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.arc(-12, -4, 3, 0, Math.PI);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.arc(-18, -4, 3, 0, Math.PI);
        this.ctx.stroke();
        
        // 胡须
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        
        // 左侧
        this.ctx.beginPath();
        this.ctx.moveTo(-25, -8);
        this.ctx.lineTo(-35, -10);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(-25, -5);
        this.ctx.lineTo(-35, -5);
        this.ctx.stroke();
        
        // 右侧
        this.ctx.beginPath();
        this.ctx.moveTo(-5, -8);
        this.ctx.lineTo(5, -10);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(-5, -5);
        this.ctx.lineTo(5, -5);
        this.ctx.stroke();
        
        // 尾巴
        this.ctx.strokeStyle = colors.accent;
        this.ctx.lineWidth = 6;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(20, -5);
        this.ctx.quadraticCurveTo(30 + animOffset, -20, 25, -30);
        this.ctx.stroke();
    },

    /**
     * 绘制猫咪进食状态
     */
    drawCatEating(cat, animOffset) {
        const colors = cat.colors || { body: '#FFA500', accent: '#FF8C00', eyes: '#333333' };
        
        // 身体（稍微压缩）
        this.ctx.fillStyle = colors.body;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 5, 25, 18, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 头（低下）
        this.ctx.beginPath();
        this.ctx.arc(-15, 10 + animOffset, 18, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 眼睛（半闭）
        this.ctx.strokeStyle = colors.eyes;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(-20, 8, 4, Math.PI, 0);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.arc(-10, 8, 4, Math.PI, 0);
        this.ctx.stroke();
        
        // 嘴巴（咀嚼动画）
        this.ctx.fillStyle = colors.accent;
        this.ctx.beginPath();
        this.ctx.ellipse(-15, 18 + Math.abs(Math.sin(animOffset)) * 2, 6, 4, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 耳朵
        this.ctx.fillStyle = colors.body;
        this.ctx.beginPath();
        this.ctx.moveTo(-28, -5);
        this.ctx.lineTo(-20, -15);
        this.ctx.lineTo(-10, -5);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(-5, -5);
        this.ctx.lineTo(0, -15);
        this.ctx.lineTo(8, -5);
        this.ctx.fill();
        
        // 尾巴（轻微摆动）
        this.ctx.strokeStyle = colors.accent;
        this.ctx.lineWidth = 6;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(20, 0);
        this.ctx.quadraticCurveTo(28 + animOffset, -8, 22, -15);
        this.ctx.stroke();
    },

    /**
     * 绘制猫咪玩耍状态
     */
    drawCatPlaying(cat, animOffset) {
        const colors = cat.colors || { body: '#FFA500', accent: '#FF8C00', eyes: '#333333' };
        
        // 身体（跳跃姿态）
        this.ctx.fillStyle = colors.body;
        this.ctx.beginPath();
        this.ctx.ellipse(0, -5 + animOffset, 25, 18, 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 头（抬起）
        this.ctx.beginPath();
        this.ctx.arc(-15, -25 + animOffset, 18, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 眼睛（圆睁）
        this.ctx.fillStyle = colors.eyes;
        this.ctx.beginPath();
        this.ctx.arc(-20, -28, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(-10, -28, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 眼睛高光
        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(-18, -30, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(-8, -30, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 嘴巴（开心）
        this.ctx.strokeStyle = colors.accent;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(-15, -18, 5, 0.2, Math.PI - 0.2);
        this.ctx.stroke();
        
        // 耳朵（竖起）
        this.ctx.fillStyle = colors.body;
        this.ctx.beginPath();
        this.ctx.moveTo(-28, -40);
        this.ctx.lineTo(-20, -55);
        this.ctx.lineTo(-10, -40);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(-5, -40);
        this.ctx.lineTo(0, -55);
        this.ctx.lineTo(8, -40);
        this.ctx.fill();
        
        // 尾巴（快速摆动）
        this.ctx.strokeStyle = colors.accent;
        this.ctx.lineWidth = 6;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(20, -10);
        this.ctx.quadraticCurveTo(35 + animOffset * 3, -25, 30, -40);
        this.ctx.stroke();
        
        // 前爪（抬起）
        this.ctx.fillStyle = colors.body;
        this.ctx.beginPath();
        this.ctx.ellipse(-20, 10 + animOffset, 8, 10, 0.5, 0, Math.PI * 2);
        this.ctx.fill();
    },

    /**
     * 绘制猫咪睡觉状态
     */
    drawCatSleeping(cat, animOffset) {
        const colors = cat.colors || { body: '#FFA500', accent: '#FF8C00', eyes: '#333333' };
        
        // 身体（蜷缩）
        this.ctx.fillStyle = colors.body;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 28, 22, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 头（靠在身上）
        this.ctx.beginPath();
        this.ctx.arc(-10, -10, 16, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 眼睛（闭着）
        this.ctx.strokeStyle = colors.eyes;
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(-18, -12);
        this.ctx.lineTo(-12, -12);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(-10, -12);
        this.ctx.lineTo(-4, -12);
        this.ctx.stroke();
        
        // 鼻子
        this.ctx.fillStyle = '#FFB6C1';
        this.ctx.beginPath();
        this.ctx.moveTo(-11, -6);
        this.ctx.lineTo(-9, -4);
        this.ctx.lineTo(-13, -4);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Zzz符号
        this.ctx.fillStyle = '#666';
        this.ctx.font = 'bold 14px Arial';
        const zOffset = animOffset * 0.5;
        this.ctx.globalAlpha = 1 - (zOffset % 3) / 3;
        this.ctx.fillText('Z', 20, -30 - zOffset * 5);
        this.ctx.fillText('z', 28, -40 - zOffset * 3);
        this.ctx.globalAlpha = 1;
        
        // 耳朵（塌下）
        this.ctx.fillStyle = colors.body;
        this.ctx.beginPath();
        this.ctx.moveTo(-22, -22);
        this.ctx.lineTo(-15, -30);
        this.ctx.lineTo(-8, -22);
        this.ctx.fill();
        
        // 尾巴（卷在身上）
        this.ctx.strokeStyle = colors.accent;
        this.ctx.lineWidth = 6;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.arc(10, 5, 15, 0, Math.PI);
        this.ctx.stroke();
    },

    /**
     * 绘制猫咪离开状态
     */
    drawCatLeaving(cat, animOffset) {
        const colors = cat.colors || { body: '#FFA500', accent: '#FF8C00', eyes: '#333333' };
        
        // 渐隐效果
        this.ctx.globalAlpha = Math.max(0, 1 - animOffset * 0.1);
        
        // 身体（向右侧移动）
        this.ctx.translate(animOffset * 5, 0);
        
        // 身体
        this.ctx.fillStyle = colors.body;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 25, 20, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 头
        this.ctx.beginPath();
        this.ctx.arc(15, -10, 18, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 眼睛
        this.ctx.fillStyle = colors.eyes;
        this.ctx.beginPath();
        this.ctx.ellipse(10, -13, 4, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.ellipse(20, -13, 4, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 尾巴（向后）
        this.ctx.strokeStyle = colors.accent;
        this.ctx.lineWidth = 6;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(-20, 0);
        this.ctx.quadraticCurveTo(-35, -10, -30, -20);
        this.ctx.stroke();
        
        this.ctx.globalAlpha = 1;
    },

    /**
     * 绘制猫咪时间指示器
     */
    drawCatTimeIndicator(catInstance) {
        const remainingSeconds = catInstance.remainingTime;
        const totalSeconds = catInstance.stayDuration;
        
        if (totalSeconds <= 0) return;
        
        const progress = remainingSeconds / totalSeconds;
        const barWidth = 50;
        const barHeight = 4;
        
        // 背景条
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(-barWidth / 2, -45, barWidth, barHeight);
        
        // 进度条
        let progressColor = '#4CAF50';
        if (progress < 0.2) {
            progressColor = '#F44336';
        } else if (progress < 0.4) {
            progressColor = '#FF9800';
        }
        
        this.ctx.fillStyle = progressColor;
        this.ctx.fillRect(-barWidth / 2, -45, barWidth * progress, barHeight);
    },

    /**
     * 绘制装饰元素
     */
    drawDecorations() {
        // 可以添加一些装饰性元素，如蝴蝶、飘落的花瓣等
        this.ctx.save();
        this.ctx.globalAlpha = 0.6;
        
        // 绘制一些飞舞的小花
        const time = Date.now() / 1000;
        
        for (let i = 0; i < 5; i++) {
            const x = ((time * 20 + i * 200) % (this.width + 100)) - 50;
            const y = 50 + Math.sin(time + i) * 30 + i * 20;
            
            this.ctx.fillStyle = i % 2 === 0 ? '#FFB6C1' : '#FFC0CB';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    },

    /**
     * 调整Canvas尺寸
     * @param {number} width - 新宽度
     * @param {number} height - 新高度
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
    },

    /**
     * 清理资源
     */
    dispose() {
        this.stopRenderLoop();
        this.ctx = null;
        this.canvas = null;
    }
};

// 导出到全局
window.CanvasRenderer = CanvasRenderer;
