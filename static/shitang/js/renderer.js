/**
 * Canvas 渲染模块
 * 负责游戏画面的绘制
 */

const Renderer = {
    // Canvas 元素和上下文
    canvas: null,
    ctx: null,
    
    // Canvas 尺寸
    width: 0,
    height: 0,
    
    // 动画帧ID
    animationFrameId: null,
    
    // 上次渲染时间
    lastRenderTime: 0,

    /**
     * 初始化渲染器
     * @param {string} canvasId - Canvas 元素 ID
     */
    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`找不到 Canvas 元素: ${canvasId}`);
            return false;
        }
        
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('无法获取 Canvas 上下文');
            return false;
        }
        
        // 设置 Canvas 尺寸
        this.resize();
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => this.resize());
        
        console.log('渲染器初始化完成');
        return true;
    },

    /**
     * 调整 Canvas 尺寸
     */
    resize() {
        const container = this.canvas.parentElement;
        if (container) {
            this.width = Math.min(container.clientWidth - 20, CONFIG.CANVAS.width);
            this.height = Math.min(container.clientHeight - 20, CONFIG.CANVAS.height);
        } else {
            this.width = CONFIG.CANVAS.width;
            this.height = CONFIG.CANVAS.height;
        }
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // 更新桌子和灶台位置
        this.updatePositions();
    },

    /**
     * 更新桌子和灶台的位置
     */
    updatePositions() {
        // 计算桌子位置
        const tableCount = GameState.tables.length;
        const cols = Math.min(5, Math.ceil(Math.sqrt(tableCount)));
        const rows = Math.ceil(tableCount / cols);
        
        const tableWidth = 80;
        const tableHeight = 60;
        const tableSpacingX = 100;
        const tableSpacingY = 90;
        
        const startX = (this.width - (cols * tableSpacingX)) / 2 + tableSpacingX / 2 - tableWidth / 2;
        const startY = 80;
        
        for (let i = 0; i < tableCount; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            
            GameState.tables[i].x = startX + col * tableSpacingX;
            GameState.tables[i].y = startY + row * tableSpacingY;
        }
        
        // 计算灶台位置（在底部）
        const stoveCount = GameState.stoves.length;
        const stoveWidth = 60;
        const stoveHeight = 50;
        const stoveSpacing = 80;
        
        const stoveStartX = (this.width - (stoveCount * stoveSpacing)) / 2 + stoveSpacing / 2 - stoveWidth / 2;
        const stoveY = this.height - 80;
        
        for (let i = 0; i < stoveCount; i++) {
            GameState.stoves[i].x = stoveStartX + i * stoveSpacing;
            GameState.stoves[i].y = stoveY;
        }
    },

    /**
     * 开始渲染循环
     */
    start() {
        this.lastRenderTime = performance.now();
        this.animate();
    },

    /**
     * 停止渲染循环
     */
    stop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    },

    /**
     * 动画循环
     */
    animate() {
        this.animationFrameId = requestAnimationFrame(() => this.animate());
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastRenderTime;
        
        // 限制帧率
        if (deltaTime >= 1000 / CONFIG.FPS) {
            this.render(deltaTime);
            this.lastRenderTime = currentTime;
        }
    },

    /**
     * 渲染一帧
     * @param {number} deltaTime - 时间增量（毫秒）
     */
    render(deltaTime) {
        // 清空画布
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // 绘制背景
        this.drawBackground();
        
        // 绘制餐厅
        this.drawRestaurant();
        
        // 绘制桌子
        this.drawTables();
        
        // 绘制客人
        this.drawCustomers();
        
        // 绘制灶台
        this.drawStoves();
        
        // 绘制订单信息
        this.drawOrders();
        
        // 绘制UI元素
        this.drawUI();
    },

    /**
     * 绘制背景
     */
    drawBackground() {
        // 绘制地板
        this.ctx.fillStyle = CONFIG.COLORS.floor;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // 绘制墙壁（顶部）
        this.ctx.fillStyle = CONFIG.COLORS.wall;
        this.ctx.fillRect(0, 0, this.width, 40);
        
        // 绘制墙壁装饰
        this.ctx.fillStyle = '#8B7355';
        this.ctx.fillRect(0, 35, this.width, 5);
    },

    /**
     * 绘制餐厅
     */
    drawRestaurant() {
        const restaurantInfo = RestaurantSystem.getRestaurantInfo();
        
        // 绘制餐厅名称
        this.ctx.fillStyle = '#4A3728';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(restaurantInfo.name, this.width / 2, 25);
    },

    /**
     * 绘制桌子
     */
    drawTables() {
        for (const table of GameState.tables) {
            const tableWidth = 80;
            const tableHeight = 60;
            
            // 绘制桌子
            this.ctx.fillStyle = table.occupied ? CONFIG.COLORS.tableOccupied : CONFIG.COLORS.table;
            this.ctx.fillRect(table.x, table.y, tableWidth, tableHeight);
            
            // 绘制桌子边框
            this.ctx.strokeStyle = '#5D3A1A';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(table.x, table.y, tableWidth, tableHeight);
            
            // 绘制桌子编号
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${table.id}`, table.x + tableWidth / 2, table.y + tableHeight / 2 + 5);
            
            // 绘制椅子
            this.drawChairs(table.x, table.y, tableWidth, tableHeight);
        }
    },

    /**
     * 绘制椅子
     * @param {number} x - 桌子 X 坐标
     * @param {number} y - 桌子 Y 坐标
     * @param {number} width - 桌子宽度
     * @param {number} height - 桌子高度
     */
    drawChairs(x, y, width, height) {
        const chairWidth = 20;
        const chairHeight = 25;
        
        this.ctx.fillStyle = CONFIG.COLORS.chair;
        
        // 上面的椅子
        this.ctx.fillRect(x + width / 2 - chairWidth / 2, y - chairHeight - 5, chairWidth, chairHeight);
        
        // 下面的椅子
        this.ctx.fillRect(x + width / 2 - chairWidth / 2, y + height + 5, chairWidth, chairHeight);
    },

    /**
     * 绘制客人
     */
    drawCustomers() {
        for (const customer of GameState.customers) {
            const table = GameState.tables.find(t => t.id === customer.tableId);
            if (!table) continue;
            
            const customerRadius = 20;
            const centerX = table.x + 40;
            const centerY = table.y - 30; // 在桌子上方
            
            // 绘制客人身体
            const color = CustomerSystem.getCustomerColor(customer);
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, customerRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 绘制边框
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // 绘制客人表情
            this.drawCustomerEmoji(centerX, centerY, customer);
            
            // 绘制耐心条（如果在等待）
            if (customer.status === CONFIG.CUSTOMER_STATUS.WAITING || 
                customer.status === CONFIG.CUSTOMER_STATUS.ORDERING) {
                this.drawPatienceBar(centerX, centerY + customerRadius + 10, customer);
            }
            
            // 绘制订单状态
            if (customer.orderId) {
                const order = GameState.orders.find(o => o.id === customer.orderId);
                if (order && order.status !== CONFIG.ORDER_STATUS.COMPLETED) {
                    this.ctx.fillStyle = '#333';
                    this.ctx.font = '10px Arial';
                    this.ctx.textAlign = 'center';
                    
                    let statusText = '';
                    switch (order.status) {
                        case CONFIG.ORDER_STATUS.PENDING:
                            statusText = '等待做菜';
                            break;
                        case CONFIG.ORDER_STATUS.COOKING:
                            statusText = '正在做菜';
                            break;
                        case CONFIG.ORDER_STATUS.READY:
                            statusText = '等待上菜';
                            break;
                        case CONFIG.ORDER_STATUS.SERVED:
                            statusText = '用餐中';
                            break;
                    }
                    
                    this.ctx.fillText(statusText, centerX, centerY + customerRadius + 25);
                }
            }
        }
    },

    /**
     * 绘制客人表情
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     * @param {Object} customer - 客人对象
     */
    drawCustomerEmoji(x, y, customer) {
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        let emoji = '😊';
        
        if (customer.status === CONFIG.CUSTOMER_STATUS.ANGRY) {
            emoji = '😠';
        } else if (customer.status === CONFIG.CUSTOMER_STATUS.EATING) {
            emoji = '😋';
        } else if (customer.status === CONFIG.CUSTOMER_STATUS.WAITING) {
            const patienceRatio = customer.patience / customer.maxPatience;
            if (patienceRatio < 0.3) {
                emoji = '😰';
            } else if (patienceRatio < 0.6) {
                emoji = '😐';
            }
        }
        
        this.ctx.fillText(emoji, x, y);
    },

    /**
     * 绘制耐心条
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     * @param {Object} customer - 客人对象
     */
    drawPatienceBar(x, y, customer) {
        const barWidth = 40;
        const barHeight = 6;
        
        // 背景
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x - barWidth / 2, y, barWidth, barHeight);
        
        // 进度
        const patienceRatio = customer.patience / customer.maxPatience;
        const progressWidth = barWidth * patienceRatio;
        
        let progressColor = '#4CAF50';
        if (patienceRatio < 0.3) {
            progressColor = '#F44336';
        } else if (patienceRatio < 0.6) {
            progressColor = '#FF9800';
        }
        
        this.ctx.fillStyle = progressColor;
        this.ctx.fillRect(x - barWidth / 2, y, progressWidth, barHeight);
    },

    /**
     * 绘制灶台
     */
    drawStoves() {
        for (const stove of GameState.stoves) {
            const stoveWidth = 60;
            const stoveHeight = 50;
            
            // 绘制灶台
            this.ctx.fillStyle = stove.inUse ? CONFIG.COLORS.stoveActive : CONFIG.COLORS.stove;
            this.ctx.fillRect(stove.x, stove.y, stoveWidth, stoveHeight);
            
            // 绘制边框
            this.ctx.strokeStyle = '#444';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(stove.x, stove.y, stoveWidth, stoveHeight);
            
            // 绘制灶台编号
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`灶台 ${stove.id}`, stove.x + stoveWidth / 2, stove.y + stoveHeight / 2 + 3);
            
            // 如果在使用中，绘制火焰动画
            if (stove.inUse) {
                this.drawFlame(stove.x + stoveWidth / 2, stove.y - 10);
                
                // 绘制烹饪进度
                const order = GameState.orders.find(o => o.id === stove.orderId);
                if (order && order.cookEndTime) {
                    const currentTime = Date.now();
                    const totalTime = order.cookEndTime - order.cookStartTime;
                    const elapsed = currentTime - order.cookStartTime;
                    const progress = Math.min(elapsed / totalTime, 1);
                    
                    this.drawCookingProgress(stove.x, stove.y + stoveHeight + 5, stoveWidth, progress);
                }
            }
        }
    },

    /**
     * 绘制火焰动画
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     */
    drawFlame(x, y) {
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        
        // 简单的火焰动画效果
        const time = Date.now();
        const offset = Math.sin(time / 200) * 2;
        
        this.ctx.fillText('🔥', x, y + offset);
    },

    /**
     * 绘制烹饪进度条
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     * @param {number} width - 宽度
     * @param {number} progress - 进度 (0-1)
     */
    drawCookingProgress(x, y, width, progress) {
        const barHeight = 8;
        
        // 背景
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x, y, width, barHeight);
        
        // 进度
        this.ctx.fillStyle = '#FF9800';
        this.ctx.fillRect(x, y, width * progress, barHeight);
        
        // 百分比
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${Math.floor(progress * 100)}%`, x + width / 2, y + barHeight / 2 + 3);
    },

    /**
     * 绘制订单信息
     */
    drawOrders() {
        // 绘制待处理订单
        const pendingOrders = GameState.orders.filter(o => 
            o.status === CONFIG.ORDER_STATUS.PENDING || 
            o.status === CONFIG.ORDER_STATUS.COOKING
        );
        
        if (pendingOrders.length > 0) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(10, 50, 200, 30 + pendingOrders.length * 20);
            
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText('📋 待处理订单:', 20, 70);
            
            pendingOrders.forEach((order, index) => {
                const y = 90 + index * 20;
                let statusEmoji = order.status === CONFIG.ORDER_STATUS.COOKING ? '🍳' : '⏳';
                this.ctx.fillText(`${statusEmoji} #${order.id}: ${order.recipeName}`, 20, y);
            });
        }
    },

    /**
     * 绘制UI元素
     */
    drawUI() {
        // 绘制员工信息
        if (GameState.employees.length > 0) {
            const x = this.width - 120;
            const y = 50;
            
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(x - 10, y - 10, 130, 30 + GameState.employees.length * 20);
            
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText('👥 员工:', x, y + 10);
            
            GameState.employees.forEach((emp, index) => {
                const empY = y + 30 + index * 20;
                this.ctx.fillText(`${emp.name} Lv.${emp.level}`, x, empY);
            });
        }
    }
};

// 导出 Renderer 对象
window.Renderer = Renderer;