const Renderer = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    pixelRatio: 1,
    theme: null,
    currentPage: 'main',
    clickEffects: [],
    notifications: [],
    
    init(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.theme = GameConfig.themes.light;
        this.pixelRatio = window.devicePixelRatio || 1;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    },
    
    resize() {
        const container = this.canvas.parentElement;
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        
        this.canvas.width = this.width * this.pixelRatio;
        this.canvas.height = this.height * this.pixelRatio;
        
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        
        this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
        
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        this.ctx.textBaseline = 'alphabetic';
    },
    
    setTheme(themeName) {
        if (GameConfig.themes[themeName]) {
            this.theme = GameConfig.themes[themeName];
        }
    },
    
    clear() {
        this.ctx.fillStyle = this.theme.background;
        this.ctx.fillRect(0, 0, this.width, this.height);
    },
    
    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    },
    
    drawButton(x, y, width, height, text, isDisabled = false, isActive = false) {
        this.ctx.save();
        
        if (isDisabled) {
            this.ctx.globalAlpha = 0.5;
            this.ctx.fillStyle = this.theme.secondary;
        } else if (isActive) {
            this.ctx.fillStyle = this.theme.accent;
        } else {
            this.ctx.fillStyle = this.theme.primary;
        }
        
        this.drawRoundedRect(x, y, width, height, 8);
        this.ctx.fill();
        
        this.ctx.strokeStyle = isActive ? this.theme.accent : this.theme.secondary;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.fillStyle = this.theme.text;
        this.ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x + width / 2, y + height / 2);
        
        this.ctx.restore();
    },
    
    drawStartScreen(state) {
        this.clear();
        
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        this.ctx.fillStyle = this.theme.text;
        this.ctx.font = 'bold 48px "Microsoft YaHei", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🏪 闲置大亨', centerX, centerY - 120);
        
        this.ctx.font = 'bold 28px "Microsoft YaHei", sans-serif';
        this.ctx.fillText('挂机赚钱', centerX, centerY - 70);
        
        this.ctx.font = '16px "Microsoft YaHei", sans-serif';
        this.ctx.fillStyle = this.theme.primary;
        this.ctx.fillText('从小摊位开始，成为商业大亨', centerX, centerY - 20);
        
        const buttonWidth = 200;
        const buttonHeight = 60;
        const buttonX = centerX - buttonWidth / 2;
        const buttonY = centerY + 40;
        
        this.drawButton(buttonX, buttonY, buttonWidth, buttonHeight, '开始游戏', false, true);
        
        if (Storage.exists()) {
            const continueButtonY = buttonY + buttonHeight + 20;
            this.drawButton(buttonX, continueButtonY, buttonWidth, buttonHeight, '继续游戏', false, false);
        }
        
        return {
            startButton: { x: buttonX, y: buttonY, width: buttonWidth, height: buttonHeight },
            continueButton: Storage.exists() ? 
                { x: buttonX, y: buttonY + buttonHeight + 20, width: buttonWidth, height: buttonHeight } : null
        };
    },
    
    drawHeader(state) {
        const headerHeight = 80;
        const padding = 20;
        
        this.ctx.fillStyle = this.theme.primary;
        this.ctx.fillRect(0, 0, this.width, headerHeight);
        
        this.ctx.fillStyle = this.theme.highlight;
        this.ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
        this.ctx.textAlign = 'left';
        
        this.ctx.fillText(`💰 现金: ${GameConfig.formatNumber(state.money)}`, padding, 30);
        
        const incomePerSecond = GameLogic.calculateTotalIncomePerSecond(state);
        this.ctx.fillText(`📈 每秒收益: ${GameConfig.formatNumber(incomePerSecond)}/s`, padding, 55);
        
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`⭐ 声望: ${GameConfig.formatNumber(state.prestigePoints)}`, this.width - padding, 30);
        
        this.ctx.textAlign = 'center';
        this.ctx.font = 'bold 18px "Microsoft YaHei", sans-serif';
        this.ctx.fillText('闲置大亨', this.width / 2, 45);
        
        const buttonWidth = 80;
        const buttonHeight = 30;
        
        if (state.isPaused) {
            this.drawButton(this.width - buttonWidth - padding, headerHeight - buttonHeight - 5, buttonWidth, buttonHeight, '▶ 继续');
        } else {
            this.drawButton(this.width - buttonWidth - padding, headerHeight - buttonHeight - 5, buttonWidth, buttonHeight, '⏸ 暂停');
        }
        
        this.drawButton(this.width - (buttonWidth * 2) - padding - 10, headerHeight - buttonHeight - 5, buttonWidth, buttonHeight, '🔄 重置');
        
        return headerHeight;
    },
    
    drawNavigation(headerHeight) {
        const navHeight = 50;
        const navY = headerHeight;
        const buttonWidth = this.width / 4;
        
        const pages = ['main', 'shop', 'managers', 'prestige'];
        const labels = ['🏠 主页', '🏪 商店', '👨‍💼 经理', '⭐ 转生'];
        
        pages.forEach((page, index) => {
            const x = index * buttonWidth;
            const isActive = this.currentPage === page;
            
            this.drawButton(x, navY, buttonWidth, navHeight, labels[index], false, isActive);
        });
        
        return navY + navHeight;
    },
    
    drawClickArea(state, startY) {
        const areaHeight = 120;
        const padding = 20;
        const areaY = startY + 10;
        
        this.ctx.fillStyle = this.theme.secondary;
        this.drawRoundedRect(padding, areaY, this.width - padding * 2, areaHeight, 10);
        this.ctx.fill();
        
        this.ctx.strokeStyle = this.theme.accent;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        const baseIncome = GameConfig.click.baseClickIncome;
        const prestigeBonus = 1 + (state.prestigePoints * GameConfig.prestige.incomeBonusPerPoint);
        const clickIncome = Math.floor(baseIncome * state.clickMultiplier * prestigeBonus);
        
        this.ctx.fillStyle = this.theme.text;
        this.ctx.font = 'bold 20px "Microsoft YaHei", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('👆 点击赚钱', this.width / 2, areaY + 35);
        
        this.ctx.font = 'bold 24px "Microsoft YaHei", sans-serif';
        this.ctx.fillStyle = this.theme.accent;
        this.ctx.fillText(`+${GameConfig.formatNumber(clickIncome)} 💰`, this.width / 2, areaY + 70);
        
        this.ctx.font = '12px "Microsoft YaHei", sans-serif';
        this.ctx.fillStyle = this.theme.primary;
        this.ctx.fillText(`总点击: ${GameConfig.formatNumber(state.stats.totalClicks)}`, this.width / 2, areaY + 100);
        
        this.drawClickEffects();
        
        return {
            area: { 
                x: padding, 
                y: areaY, 
                width: this.width - padding * 2, 
                height: areaHeight 
            },
            nextY: areaY + areaHeight + 10
        };
    },
    
    addClickEffect(x, y, income) {
        this.clickEffects.push({
            x, y,
            text: `+${GameConfig.formatNumber(income)}`,
            alpha: 1,
            offsetY: 0,
            createdAt: Date.now()
        });
    },
    
    drawClickEffects() {
        const now = Date.now();
        
        this.clickEffects = this.clickEffects.filter(effect => {
            const age = now - effect.createdAt;
            if (age > 1000) return false;
            
            effect.alpha = 1 - (age / 1000);
            effect.offsetY = (age / 1000) * 50;
            
            this.ctx.save();
            this.ctx.globalAlpha = effect.alpha;
            this.ctx.fillStyle = this.theme.accent;
            this.ctx.font = 'bold 18px "Microsoft YaHei", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(effect.text, effect.x, effect.y - effect.offsetY);
            this.ctx.restore();
            
            return true;
        });
    },
    
    drawBusinessCard(business, index, startY, state) {
        const config = GameLogic.getBusinessConfig(business.id);
        if (!config) return startY;
        
        const cardHeight = 100;
        const padding = 20;
        const cardY = startY;
        const cardWidth = this.width - padding * 2;
        
        const isUnlocked = business.unlocked;
        const isOwned = business.owned;
        
        this.ctx.fillStyle = isUnlocked ? this.theme.highlight : this.theme.secondary;
        this.drawRoundedRect(padding, cardY, cardWidth, cardHeight, 8);
        this.ctx.fill();
        
        if (!isUnlocked) {
            this.ctx.globalAlpha = 0.6;
        }
        
        this.ctx.fillStyle = this.theme.text;
        this.ctx.font = 'bold 24px "Microsoft YaHei", sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(config.emoji, padding + 15, cardY + 35);
        
        this.ctx.font = 'bold 16px "Microsoft YaHei", sans-serif';
        this.ctx.fillText(config.name, padding + 55, cardY + 35);
        
        if (isOwned) {
            this.ctx.font = '14px "Microsoft YaHei", sans-serif';
            this.ctx.fillText(`Lv.${business.level}`, padding + 55, cardY + 55);
            
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`收入: ${GameConfig.formatNumber(business.currentIncome)}/次`, cardWidth - padding, cardY + 35);
            this.ctx.fillText(`升级: ${GameConfig.formatNumber(business.currentCost)} 💰`, cardWidth - padding, cardY + 55);
            
            const progressBarY = cardY + 65;
            const progressBarHeight = 10;
            const progressBarWidth = cardWidth - padding * 2 - 110;
            
            this.ctx.fillStyle = this.theme.secondary;
            this.drawRoundedRect(padding + 10, progressBarY, progressBarWidth, progressBarHeight, 5);
            this.ctx.fill();
            
            const progress = business.cycleProgress || 0;
            this.ctx.fillStyle = this.theme.accent;
            this.drawRoundedRect(padding + 10, progressBarY, progressBarWidth * progress, progressBarHeight, 5);
            this.ctx.fill();
            
            const buttonWidth = 90;
            const buttonHeight = 30;
            const canAfford = state.money >= business.currentCost;
            
            this.drawButton(cardWidth - padding - buttonWidth, progressBarY - 2, buttonWidth, buttonHeight, '升级', !canAfford, false);
            
            if (business.managers && business.managers.length > 0) {
                this.ctx.textAlign = 'left';
                this.ctx.font = '12px "Microsoft YaHei", sans-serif';
                this.ctx.fillStyle = this.theme.accent;
                
                const managerEmojis = business.managers.map(mId => {
                    const mConfig = GameLogic.getManagerConfig(mId);
                    return mConfig ? mConfig.emoji : '';
                }).join(' ');
                
                this.ctx.fillText(`经理: ${managerEmojis}`, padding + 10, cardY + 90);
            }
        } else if (isUnlocked) {
            this.ctx.font = '14px "Microsoft YaHei", sans-serif';
            this.ctx.fillText(`价格: ${GameConfig.formatNumber(business.currentCost)} 💰`, padding + 55, cardY + 55);
            
            const buttonWidth = 100;
            const buttonHeight = 35;
            const canAfford = state.money >= business.currentCost;
            
            this.drawButton(cardWidth - padding - buttonWidth, cardY + (cardHeight - buttonHeight) / 2, buttonWidth, buttonHeight, '购买', !canAfford, false);
        } else {
            this.ctx.font = '14px "Microsoft YaHei", sans-serif';
            this.ctx.fillStyle = this.theme.primary;
            this.ctx.fillText(config.description, padding + 55, cardY + 55);
            
            const unlockProgress = GameLogic.getBusinessUnlockProgress(state, business.id);
            if (unlockProgress.progress > 0) {
                const progressBarY = cardY + 65;
                const progressBarHeight = 8;
                const progressBarWidth = cardWidth - padding * 2 - 55;
                
                this.ctx.fillStyle = this.theme.secondary;
                this.drawRoundedRect(padding + 55, progressBarY, progressBarWidth, progressBarHeight, 4);
                this.ctx.fill();
                
                this.ctx.fillStyle = this.theme.accent;
                this.drawRoundedRect(padding + 55, progressBarY, progressBarWidth * unlockProgress.progress, progressBarHeight, 4);
                this.ctx.fill();
                
                this.ctx.font = '10px "Microsoft YaHei", sans-serif';
                this.ctx.fillStyle = this.theme.primary;
                this.ctx.textAlign = 'right';
                this.ctx.fillText(
                    `${GameConfig.formatNumber(unlockProgress.current)}/${GameConfig.formatNumber(unlockProgress.required)}`,
                    cardWidth - padding,
                    progressBarY + progressBarHeight + 12
                );
            }
        }
        
        this.ctx.globalAlpha = 1;
        
        return cardY + cardHeight + 10;
    },
    
    drawMainPage(state, startY) {
        const clickResult = this.drawClickArea(state, startY);
        let currentY = clickResult.nextY;
        
        this.ctx.fillStyle = this.theme.text;
        this.ctx.font = 'bold 18px "Microsoft YaHei", sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('📊 我的业务', 20, currentY + 20);
        currentY += 35;
        
        state.businesses.forEach((business, index) => {
            currentY = this.drawBusinessCard(business, index, currentY, state);
        });
        
        return clickResult.area;
    },
    
    drawShopPage(state, startY) {
        const padding = 20;
        let currentY = startY + 10;
        
        this.ctx.fillStyle = this.theme.text;
        this.ctx.font = 'bold 18px "Microsoft YaHei", sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('🏪 商店 - 购买业务', padding, currentY + 20);
        currentY += 35;
        
        state.businesses.forEach((business, index) => {
            currentY = this.drawBusinessCard(business, index, currentY, state);
        });
    },
    
    drawManagersPage(state, startY) {
        const padding = 20;
        let currentY = startY + 10;
        
        this.ctx.fillStyle = this.theme.text;
        this.ctx.font = 'bold 18px "Microsoft YaHei", sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('👨‍💼 经理 - 雇佣管理', padding, currentY + 20);
        currentY += 35;
        
        GameConfig.managers.forEach((managerConfig, index) => {
            const cardHeight = 90;
            const cardY = currentY;
            const cardWidth = this.width - padding * 2;
            
            this.ctx.fillStyle = this.theme.highlight;
            this.drawRoundedRect(padding, cardY, cardWidth, cardHeight, 8);
            this.ctx.fill();
            
            this.ctx.fillStyle = this.theme.text;
            this.ctx.font = 'bold 20px "Microsoft YaHei", sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(managerConfig.emoji, padding + 15, cardY + 30);
            
            this.ctx.font = 'bold 16px "Microsoft YaHei", sans-serif';
            this.ctx.fillText(managerConfig.name, padding + 55, cardY + 30);
            
            this.ctx.font = '12px "Microsoft YaHei", sans-serif';
            this.ctx.fillStyle = this.theme.primary;
            this.ctx.fillText(managerConfig.description, padding + 55, cardY + 50);
            
            this.ctx.font = '14px "Microsoft YaHei", sans-serif';
            this.ctx.fillText(`价格: ${GameConfig.formatNumber(managerConfig.cost)} 💰`, padding + 55, cardY + 70);
            
            currentY = cardY + cardHeight + 10;
        });
        
        this.ctx.fillStyle = this.theme.text;
        this.ctx.font = 'bold 16px "Microsoft YaHei", sans-serif';
        this.ctx.fillText('选择业务雇佣经理:', padding, currentY + 20);
        currentY += 30;
        
        state.businesses.forEach((business, index) => {
            if (!business.owned) return;
            
            const config = GameLogic.getBusinessConfig(business.id);
            if (!config) return;
            
            const rowHeight = 60;
            const rowY = currentY;
            
            this.ctx.fillStyle = this.theme.secondary;
            this.drawRoundedRect(padding, rowY, this.width - padding * 2, rowHeight, 6);
            this.ctx.fill();
            
            this.ctx.fillStyle = this.theme.text;
            this.ctx.font = '14px "Microsoft YaHei", sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`${config.emoji} ${config.name} (Lv.${business.level})`, padding + 15, rowY + 25);
            
            if (business.managers && business.managers.length > 0) {
                const managerEmojis = business.managers.map(mId => {
                    const mConfig = GameLogic.getManagerConfig(mId);
                    return mConfig ? mConfig.emoji : '';
                }).join(' ');
                this.ctx.fillStyle = this.theme.accent;
                this.ctx.fillText(`已雇佣: ${managerEmojis}`, padding + 15, rowY + 45);
            } else {
                this.ctx.fillStyle = this.theme.primary;
                this.ctx.fillText('未雇佣经理', padding + 15, rowY + 45);
            }
            
            GameConfig.managers.forEach((managerConfig, mIndex) => {
                const buttonWidth = 70;
                const buttonHeight = 30;
                const buttonX = this.width - padding - (buttonWidth + 10) * (mIndex + 1);
                
                const hireInfo = GameLogic.getManagerHireInfo(state, managerConfig.id, business.id);
                const isDisabled = !hireInfo.canHire && !hireInfo.alreadyHired;
                
                this.drawButton(buttonX, rowY + 15, buttonWidth, buttonHeight, managerConfig.emoji, isDisabled, hireInfo.alreadyHired);
            });
            
            currentY = rowY + rowHeight + 8;
        });
    },
    
    drawPrestigePage(state, startY) {
        const padding = 20;
        let currentY = startY + 10;
        
        this.ctx.fillStyle = this.theme.text;
        this.ctx.font = 'bold 18px "Microsoft YaHei", sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('⭐ 转生 - 获得永久加成', padding, currentY + 20);
        currentY += 35;
        
        const cardHeight = 180;
        this.ctx.fillStyle = this.theme.highlight;
        this.drawRoundedRect(padding, currentY, this.width - padding * 2, cardHeight, 10);
        this.ctx.fill();
        
        this.ctx.strokeStyle = this.theme.accent;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.fillStyle = this.theme.text;
        this.ctx.font = 'bold 20px "Microsoft YaHei", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('转生系统', this.width / 2, currentY + 35);
        
        this.ctx.font = '14px "Microsoft YaHei", sans-serif';
        this.ctx.fillStyle = this.theme.primary;
        this.ctx.fillText(`当前声望: ${GameConfig.formatNumber(state.prestigePoints)} ⭐`, this.width / 2, currentY + 65);
        this.ctx.fillText(`加成效果: +${(state.prestigePoints * GameConfig.prestige.incomeBonusPerPoint * 100).toFixed(1)}% 收入`, this.width / 2, currentY + 90);
        
        const canPrestige = GameLogic.canPrestige(state);
        const prestigePoints = GameLogic.calculatePrestigePoints(state);
        
        this.ctx.font = 'bold 16px "Microsoft YaHei", sans-serif';
        if (canPrestige) {
            this.ctx.fillStyle = this.theme.accent;
            this.ctx.fillText(`转生可获得: ${GameConfig.formatNumber(prestigePoints)} ⭐`, this.width / 2, currentY + 120);
        } else {
            this.ctx.fillStyle = this.theme.primary;
            this.ctx.fillText(`转生条件: 总收益达到 ${GameConfig.formatNumber(GameConfig.prestige.unlockCondition.value)}`, this.width / 2, currentY + 120);
            this.ctx.font = '14px "Microsoft YaHei", sans-serif';
            this.ctx.fillText(`当前: ${GameConfig.formatNumber(state.totalEarnings)} / ${GameConfig.formatNumber(GameConfig.prestige.unlockCondition.value)}`, this.width / 2, currentY + 145);
        }
        
        const buttonWidth = 150;
        const buttonHeight = 45;
        this.drawButton(this.width / 2 - buttonWidth / 2, currentY + cardHeight - buttonHeight - 15, buttonWidth, buttonHeight, '⭐ 转生', !canPrestige, canPrestige);
        
        currentY += cardHeight + 20;
        
        this.ctx.fillStyle = this.theme.text;
        this.ctx.font = 'bold 16px "Microsoft YaHei", sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('📊 统计数据', padding, currentY + 20);
        currentY += 35;
        
        const stats = [
            { label: '总点击次数', value: GameConfig.formatNumber(state.stats.totalClicks) },
            { label: '总购买业务', value: GameConfig.formatNumber(state.stats.totalBusinessBought) },
            { label: '总雇佣经理', value: GameConfig.formatNumber(state.stats.totalManagersHired) },
            { label: '总转生次数', value: GameConfig.formatNumber(state.stats.totalPrestigeCount) },
            { label: '总离线收益', value: GameConfig.formatNumber(state.stats.totalOfflineEarnings) },
            { label: '历史总声望', value: GameConfig.formatNumber(state.totalPrestige) }
        ];
        
        stats.forEach((stat, index) => {
            const rowHeight = 35;
            const rowY = currentY;
            
            this.ctx.fillStyle = this.theme.secondary;
            this.drawRoundedRect(padding, rowY, this.width - padding * 2, rowHeight, 4);
            this.ctx.fill();
            
            this.ctx.fillStyle = this.theme.text;
            this.ctx.font = '14px "Microsoft YaHei", sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(stat.label, padding + 15, rowY + 22);
            
            this.ctx.textAlign = 'right';
            this.ctx.fillText(stat.value, this.width - padding - 15, rowY + 22);
            
            currentY = rowY + rowHeight + 5;
        });
    },
    
    drawOfflineNotification(offlineData) {
        if (!offlineData || !offlineData.hasOffline) return;
        
        const padding = 20;
        const notificationWidth = 350;
        const notificationHeight = 150;
        const x = (this.width - notificationWidth) / 2;
        const y = (this.height - notificationHeight) / 2;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = this.theme.highlight;
        this.drawRoundedRect(x, y, notificationWidth, notificationHeight, 15);
        this.ctx.fill();
        
        this.ctx.strokeStyle = this.theme.accent;
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        this.ctx.fillStyle = this.theme.text;
        this.ctx.font = 'bold 20px "Microsoft YaHei", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎁 离线收益', x + notificationWidth / 2, y + 35);
        
        this.ctx.font = '14px "Microsoft YaHei", sans-serif';
        this.ctx.fillStyle = this.theme.primary;
        this.ctx.fillText(`离线时间: ${offlineData.formattedTime}`, x + notificationWidth / 2, y + 65);
        
        this.ctx.font = 'bold 24px "Microsoft YaHei", sans-serif';
        this.ctx.fillStyle = this.theme.accent;
        this.ctx.fillText(`+${offlineData.formattedEarnings} 💰`, x + notificationWidth / 2, y + 100);
        
        const buttonWidth = 120;
        const buttonHeight = 35;
        this.drawButton(x + notificationWidth / 2 - buttonWidth / 2, y + notificationHeight - buttonHeight - 15, buttonWidth, buttonHeight, '领取收益', false, true);
        
        return {
            area: { x, y, width: notificationWidth, height: notificationHeight },
            button: { 
                x: x + notificationWidth / 2 - buttonWidth / 2, 
                y: y + notificationHeight - buttonHeight - 15, 
                width: buttonWidth, 
                height: buttonHeight 
            }
        };
    },
    
    draw(state, offlineData = null) {
        this.clear();
        
        if (!state.gameStarted) {
            return this.drawStartScreen(state);
        }
        
        if (offlineData && offlineData.hasOffline) {
            const headerHeight = this.drawHeader(state);
            const navHeight = this.drawNavigation(headerHeight);
            
            switch (this.currentPage) {
                case 'main':
                    this.drawMainPage(state, navHeight);
                    break;
                case 'shop':
                    this.drawShopPage(state, navHeight);
                    break;
                case 'managers':
                    this.drawManagersPage(state, navHeight);
                    break;
                case 'prestige':
                    this.drawPrestigePage(state, navHeight);
                    break;
            }
            
            return this.drawOfflineNotification(offlineData);
        }
        
        const headerHeight = this.drawHeader(state);
        const navHeight = this.drawNavigation(headerHeight);
        
        let clickArea = null;
        
        switch (this.currentPage) {
            case 'main':
                clickArea = this.drawMainPage(state, navHeight);
                break;
            case 'shop':
                this.drawShopPage(state, navHeight);
                break;
            case 'managers':
                this.drawManagersPage(state, navHeight);
                break;
            case 'prestige':
                this.drawPrestigePage(state, navHeight);
                break;
        }
        
        return {
            headerHeight,
            navHeight,
            clickArea
        };
    },
    
    isPointInRect(x, y, rect) {
        if (!rect) return false;
        return x >= rect.x && x <= rect.x + rect.width && 
               y >= rect.y && y <= rect.y + rect.height;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Renderer;
}
