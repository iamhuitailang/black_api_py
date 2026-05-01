/**
 * UI渲染模块
 * 负责Canvas绘制界面
 */

const UI = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    scrollY: 0,
    hoveredElement: null,
    interactiveElements: [],
    
    /**
     * 初始化Canvas
     */
    init() {
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
    },
    
    /**
     * 调整Canvas大小
     */
    resize() {
        const container = document.getElementById('app');
        const dpr = window.devicePixelRatio || 1;
        
        this.width = container.clientWidth;
        this.height = window.innerHeight;
        
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        
        this.ctx.scale(dpr, dpr);
    },
    
    /**
     * 清空画布
     */
    clear() {
        this.ctx.fillStyle = Utils.COLORS.background;
        this.ctx.fillRect(0, 0, this.width, this.height);
    },
    
    /**
     * 绘制顶部标题栏
     * @param {number} y - Y坐标
     * @returns {number} 结束Y坐标
     */
    drawHeader(y) {
        const ctx = this.ctx;
        const padding = 20;
        
        // 背景
        const headerHeight = 80;
        ctx.fillStyle = Utils.COLORS.primary;
        Utils.drawRoundRect(ctx, padding, y + padding, this.width - padding * 2, headerHeight, 20);
        ctx.fill();
        
        // 标题
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('🧊 冰箱小助手', padding + 30, y + padding + headerHeight / 2);
        
        // 今日提示
        const expiryStats = Storage.getExpiryStats();
        if (expiryStats.warning > 0 || expiryStats.expired > 0) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'right';
            const warningText = `⚠️ ${expiryStats.warning + expiryStats.expired} 项需要关注`;
            ctx.fillText(warningText, this.width - padding - 30, y + padding + headerHeight / 2);
        }
        
        return y + padding + headerHeight + 10;
    },
    
    /**
     * 绘制搜索和筛选栏
     * @param {number} y - Y坐标
     * @param {string} searchKeyword - 搜索关键词
     * @param {string} selectedCategory - 选中的分类
     * @returns {number} 结束Y坐标
     */
    drawSearchBar(y, searchKeyword, selectedCategory) {
        const ctx = this.ctx;
        const padding = 20;
        const barHeight = 60;
        
        // 只绘制背景，搜索框和分类按钮用DOM元素实现
        ctx.fillStyle = Utils.COLORS.cardBackground;
        Utils.drawRoundRect(ctx, padding, y, this.width - padding * 2, barHeight, 15);
        ctx.fill();
        
        return y + barHeight + 15;
    },
    
    /**
     * 绘制统计卡片
     * @param {number} y - Y坐标
     * @returns {number} 结束Y坐标
     */
    drawStatsCards(y) {
        const ctx = this.ctx;
        const padding = 20;
        const cardWidth = (this.width - padding * 2 - 20) / 3;
        const cardHeight = 90;
        
        const expiryStats = Storage.getExpiryStats();
        const categoryStats = Storage.getCategoryStats();
        const totalItems = Storage.getAll().reduce((sum, item) => sum + item.quantity, 0);
        
        const stats = [
            {
                label: '总食材数量',
                value: totalItems,
                icon: '🥦',
                color: Utils.COLORS.primary,
                bgColor: '#E8F5E9'
            },
            {
                label: '正常状态',
                value: expiryStats.normal,
                icon: '✅',
                color: Utils.COLORS.primary,
                bgColor: '#E8F5E9'
            },
            {
                label: '需要关注',
                value: expiryStats.warning + expiryStats.expired,
                icon: '⚠️',
                color: Utils.COLORS.warning,
                bgColor: Utils.COLORS.warningLight
            }
        ];
        
        stats.forEach((stat, index) => {
            const cardX = padding + index * (cardWidth + 10);
            
            // 卡片背景
            ctx.fillStyle = stat.bgColor;
            Utils.drawRoundRect(ctx, cardX, y, cardWidth, cardHeight, 16);
            ctx.fill();
            
            // 图标
            ctx.font = '28px sans-serif';
            ctx.fillText(stat.icon, cardX + 20, y + 35);
            
            // 数值
            ctx.fillStyle = stat.color;
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(stat.value, cardX + cardWidth - 20, y + 40);
            
            // 标签
            ctx.fillStyle = Utils.COLORS.text;
            ctx.font = '13px sans-serif';
            ctx.fillText(stat.label, cardX + cardWidth - 20, y + 65);
        });
        
        return y + cardHeight + 20;
    },
    
    /**
     * 绘制分类统计
     * @param {number} y - Y坐标
     * @returns {number} 结束Y坐标
     */
    drawCategoryStats(y) {
        const ctx = this.ctx;
        const padding = 20;
        const categoryStats = Storage.getCategoryStats();
        
        // 标题
        ctx.fillStyle = Utils.COLORS.text;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('📊 分类统计', padding, y + 5);
        
        let currentX = padding;
        const barHeight = 20;
        const maxWidth = this.width - padding * 2;
        
        // 计算最大值
        const total = Object.values(categoryStats).reduce((a, b) => a + b, 0);
        
        // 绘制彩色条形图
        let colorX = padding;
        Utils.CATEGORIES.forEach(category => {
            if (categoryStats[category]) {
                const ratio = categoryStats[category] / total;
                const barWidth = ratio * maxWidth;
                
                ctx.fillStyle = Utils.CATEGORY_COLORS[category];
                Utils.drawRoundRect(ctx, colorX, y + 25, barWidth, barHeight, 5);
                ctx.fill();
                
                // 图例
                ctx.fillStyle = Utils.CATEGORY_COLORS[category];
                ctx.beginPath();
                ctx.arc(colorX + 8, y + 65, 6, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = Utils.COLORS.text;
                ctx.font = '12px sans-serif';
                ctx.fillText(`${Utils.CATEGORY_ICONS[category]} ${category} (${categoryStats[category]})`, colorX + 20, y + 68);
                
                colorX += 120;
            }
        });
        
        if (total === 0) {
            ctx.fillStyle = Utils.COLORS.textLight;
            ctx.font = '14px sans-serif';
            ctx.fillText('还没有添加食材哦~', padding, y + 45);
        }
        
        return y + 90;
    },
    
    /**
     * 绘制添加按钮
     * @param {number} y - Y坐标
     * @returns {number} 结束Y坐标
     */
    drawAddButton(y) {
        const ctx = this.ctx;
        const padding = 20;
        const btnWidth = this.width - padding * 2;
        const btnHeight = 50;
        
        // 按钮背景
        const gradient = ctx.createLinearGradient(padding, y, this.width - padding, y);
        gradient.addColorStop(0, Utils.COLORS.primary);
        gradient.addColorStop(1, Utils.COLORS.primaryLight);
        
        ctx.fillStyle = gradient;
        Utils.drawRoundRect(ctx, padding, y, btnWidth, btnHeight, 25);
        ctx.fill();
        
        // 按钮文字
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('➕ 添加食材', this.width / 2, y + btnHeight / 2 + 2);
        
        // 记录交互区域
        this.interactiveElements.push({
            type: 'addButton',
            x: padding,
            y: y,
            width: btnWidth,
            height: btnHeight
        });
        
        return y + btnHeight + 20;
    },
    
    /**
     * 绘制食材卡片
     * @param {Object} item - 食材对象
     * @param {number} y - Y坐标
     * @param {number} index - 索引
     * @returns {number} 结束Y坐标
     */
    drawFoodCard(item, y, index) {
        const ctx = this.ctx;
        const padding = 20;
        const cardWidth = this.width - padding * 2;
        const cardHeight = 130;
        
        const status = Utils.getExpiryStatus(item.expiryDate);
        const statusColors = Utils.getStatusColors(status);
        const daysLeft = Utils.getDaysUntilExpiry(item.expiryDate);
        
        // 卡片背景
        ctx.fillStyle = Utils.COLORS.cardBackground;
        Utils.drawRoundRect(ctx, padding, y, cardWidth, cardHeight, 16);
        ctx.fill();
        
        // 状态边框
        ctx.strokeStyle = statusColors.border;
        ctx.lineWidth = 2;
        Utils.drawRoundRect(ctx, padding, y, cardWidth, cardHeight, 16);
        ctx.stroke();
        
        // 左侧图标区域
        const iconSize = 60;
        const iconX = padding + 20;
        const iconY = y + 25;
        
        // 圆形背景
        ctx.fillStyle = Utils.CATEGORY_COLORS[item.category] || Utils.COLORS.primary;
        ctx.beginPath();
        ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 图标
        ctx.font = '32px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            Utils.CATEGORY_ICONS[item.category] || '📦',
            iconX + iconSize / 2,
            iconY + iconSize / 2 + 2
        );
        
        // 名称和分类
        const infoX = iconX + iconSize + 20;
        
        ctx.fillStyle = Utils.COLORS.text;
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(item.name, infoX, y + 30);
        
        ctx.fillStyle = Utils.COLORS.textLight;
        ctx.font = '13px sans-serif';
        ctx.fillText(
            `${Utils.CATEGORY_ICONS[item.category] || ''} ${item.category} · ${item.quantity} ${item.unit}`,
            infoX,
            y + 52
        );
        
        // 过期日期和状态
        const expiryText = Utils.formatDate(item.expiryDate);
        let statusText = '';
        let statusColor = statusColors.text;
        
        if (status === 'expired') {
            statusText = `🔴 已过期 ${Math.abs(daysLeft)} 天`;
        } else if (status === 'warning') {
            if (daysLeft === 0) {
                statusText = '🟡 今天过期！';
            } else {
                statusText = `🟡 还剩 ${daysLeft} 天`;
            }
        } else {
            statusText = `🟢 还剩 ${daysLeft} 天`;
            statusColor = Utils.COLORS.primary;
        }
        
        ctx.fillStyle = statusColor;
        ctx.font = '14px sans-serif';
        ctx.fillText(`${expiryText} | ${statusText}`, infoX, y + 75);
        
        // 操作按钮
        const btnY = y + cardHeight - 45;
        const btnHeight = 32;
        
        // 消耗按钮
        const consumeBtnX = padding + cardWidth - 280;
        ctx.fillStyle = Utils.COLORS.accent;
        Utils.drawRoundRect(ctx, consumeBtnX, btnY, 70, btnHeight, 16);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🍽️ 消耗', consumeBtnX + 35, btnY + btnHeight / 2 + 2);
        
        // 补充按钮
        const addBtnX = consumeBtnX + 75;
        ctx.fillStyle = Utils.COLORS.primary;
        Utils.drawRoundRect(ctx, addBtnX, btnY, 70, btnHeight, 16);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('➕ 补充', addBtnX + 35, btnY + btnHeight / 2 + 2);
        
        // 编辑按钮
        const editBtnX = addBtnX + 75;
        ctx.fillStyle = '#9B9B9B';
        Utils.drawRoundRect(ctx, editBtnX, btnY, 50, btnHeight, 16);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('✏️', editBtnX + 25, btnY + btnHeight / 2 + 2);
        
        // 删除按钮
        const deleteBtnX = editBtnX + 55;
        ctx.fillStyle = Utils.COLORS.danger;
        Utils.drawRoundRect(ctx, deleteBtnX, btnY, 50, btnHeight, 16);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('🗑️', deleteBtnX + 25, btnY + btnHeight / 2 + 2);
        
        // 记录交互区域
        this.interactiveElements.push({
            type: 'consume',
            itemId: item.id,
            x: consumeBtnX,
            y: btnY,
            width: 70,
            height: btnHeight
        });
        
        this.interactiveElements.push({
            type: 'add',
            itemId: item.id,
            x: addBtnX,
            y: btnY,
            width: 70,
            height: btnHeight
        });
        
        this.interactiveElements.push({
            type: 'edit',
            itemId: item.id,
            x: editBtnX,
            y: btnY,
            width: 50,
            height: btnHeight
        });
        
        this.interactiveElements.push({
            type: 'delete',
            itemId: item.id,
            x: deleteBtnX,
            y: btnY,
            width: 50,
            height: btnHeight
        });
        
        return y + cardHeight + 15;
    },
    
    /**
     * 绘制空状态
     * @param {number} y - Y坐标
     * @returns {number} 结束Y坐标
     */
    drawEmptyState(y) {
        const ctx = this.ctx;
        const centerX = this.width / 2;
        
        ctx.fillStyle = Utils.COLORS.textLight;
        ctx.font = '48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🧊', centerX, y + 80);
        
        ctx.fillStyle = Utils.COLORS.text;
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('冰箱空空如也', centerX, y + 120);
        
        ctx.fillStyle = Utils.COLORS.textLight;
        ctx.font = '14px sans-serif';
        ctx.fillText('点击上方按钮添加食材吧~', centerX, y + 145);
        
        return y + 180;
    },
    
    /**
     * 绘制整个界面
     * @param {string} searchKeyword - 搜索关键词
     * @param {string} selectedCategory - 选中的分类
     */
    render(searchKeyword, selectedCategory) {
        this.clear();
        this.interactiveElements = [];
        
        let currentY = 20;
        
        // 统计卡片
        currentY = this.drawStatsCards(currentY);
        
        // 分类统计
        currentY = this.drawCategoryStats(currentY);
        
        // 添加按钮
        currentY = this.drawAddButton(currentY);
        
        // 获取筛选和搜索后的食材
        let items = Storage.getAll();
        
        // 按分类筛选
        if (selectedCategory && selectedCategory !== '全部') {
            items = items.filter(item => item.category === selectedCategory);
        }
        
        // 按名称搜索
        if (searchKeyword && searchKeyword.trim()) {
            const keyword = searchKeyword.toLowerCase().trim();
            items = items.filter(item => item.name.toLowerCase().includes(keyword));
        }
        
        // 按过期日期排序
        items = Utils.sortByExpiry(items);
        
        // 食材列表标题
        const ctx = this.ctx;
        const padding = 20;
        ctx.fillStyle = Utils.COLORS.text;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`📋 食材列表 (${items.length}项)`, padding, currentY + 5);
        currentY += 30;
        
        if (items.length === 0) {
            // 空状态
            currentY = this.drawEmptyState(currentY);
        } else {
            // 绘制食材卡片
            items.forEach((item, index) => {
                currentY = this.drawFoodCard(item, currentY, index);
            });
        }
        
        // 底部留白
        currentY += 40;
        
        // 更新canvas高度
        if (currentY > this.height) {
            this.canvas.style.height = currentY + 'px';
        }
    },
    
    /**
     * 检查点击位置
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {Object|null} 点击的元素信息
     */
    checkClick(x, y) {
        for (const element of this.interactiveElements) {
            if (x >= element.x && x <= element.x + element.width &&
                y >= element.y && y <= element.y + element.height) {
                return element;
            }
        }
        return null;
    }
};

// 导出模块
window.UI = UI;
