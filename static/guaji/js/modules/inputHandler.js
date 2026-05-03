const InputHandler = {
    canvas: null,
    gameState: null,
    offlineData: null,
    renderInfo: null,
    onStateChange: null,
    
    init(canvasElement, gameState, onStateChangeCallback) {
        this.canvas = canvasElement;
        this.gameState = gameState;
        this.onStateChange = onStateChangeCallback;
        
        this.bindEvents();
    },
    
    bindEvents() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    },
    
    setGameState(gameState) {
        this.gameState = gameState;
    },
    
    setOfflineData(offlineData) {
        this.offlineData = offlineData;
    },
    
    setRenderInfo(renderInfo) {
        this.renderInfo = renderInfo;
    },
    
    getCanvasCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        
        return {
            x: (e.clientX - rect.left),
            y: (e.clientY - rect.top)
        };
    },
    
    handleClick(e) {
        const coords = this.getCanvasCoordinates(e);
        
        if (this.offlineData && this.offlineData.hasOffline && this.renderInfo) {
            if (this.renderInfo.button && Renderer.isPointInRect(coords.x, coords.y, this.renderInfo.button)) {
                this.collectOfflineEarnings();
                return;
            }
        }
        
        if (!this.gameState.gameStarted) {
            this.handleStartScreenClick(coords);
            return;
        }
        
        this.handleGameClick(coords);
    },
    
    handleStartScreenClick(coords) {
        if (!this.renderInfo) return;
        
        if (this.renderInfo.startButton && Renderer.isPointInRect(coords.x, coords.y, this.renderInfo.startButton)) {
            this.startNewGame();
            return;
        }
        
        if (this.renderInfo.continueButton && Renderer.isPointInRect(coords.x, coords.y, this.renderInfo.continueButton)) {
            this.continueGame();
            return;
        }
    },
    
    handleGameClick(coords) {
        if (!this.renderInfo) return;
        
        this.handleNavigationClick(coords);
        
        this.handleHeaderButtonsClick(coords);
        
        if (Renderer.currentPage === 'main' && this.renderInfo.clickArea) {
            if (Renderer.isPointInRect(coords.x, coords.y, this.renderInfo.clickArea)) {
                this.handleClickArea(coords);
                return;
            }
        }
        
        this.handleBusinessCardsClick(coords);
        
        if (Renderer.currentPage === 'managers') {
            this.handleManagerHireClick(coords);
        }
        
        if (Renderer.currentPage === 'prestige') {
            this.handlePrestigeClick(coords);
        }
    },
    
    handleNavigationClick(coords) {
        if (!this.renderInfo || !this.renderInfo.navHeight) return;
        
        const headerHeight = this.renderInfo.headerHeight || 80;
        const navY = headerHeight;
        const navHeight = 50;
        const buttonWidth = this.canvas.width / 4;
        
        if (coords.y >= navY && coords.y <= navY + navHeight) {
            const buttonIndex = Math.floor(coords.x / buttonWidth);
            const pages = ['main', 'shop', 'managers', 'prestige'];
            
            if (buttonIndex >= 0 && buttonIndex < pages.length) {
                Renderer.currentPage = pages[buttonIndex];
                this.notifyStateChange();
            }
        }
    },
    
    handleHeaderButtonsClick(coords) {
        const headerHeight = 80;
        const padding = 20;
        const buttonWidth = 80;
        const buttonHeight = 30;
        
        const pauseButtonX = this.canvas.width - buttonWidth - padding;
        const pauseButtonY = headerHeight - buttonHeight - 5;
        
        if (coords.x >= pauseButtonX && coords.x <= pauseButtonX + buttonWidth &&
            coords.y >= pauseButtonY && coords.y <= pauseButtonY + buttonHeight) {
            this.togglePause();
            return;
        }
        
        const resetButtonX = this.canvas.width - (buttonWidth * 2) - padding - 10;
        if (coords.x >= resetButtonX && coords.x <= resetButtonX + buttonWidth &&
            coords.y >= pauseButtonY && coords.y <= pauseButtonY + buttonHeight) {
            this.confirmReset();
            return;
        }
    },
    
    handleClickArea(coords) {
        const result = GameLogic.click(this.gameState);
        Renderer.addClickEffect(coords.x, coords.y, result.income);
        this.notifyStateChange();
    },
    
    handleBusinessCardsClick(coords) {
        const padding = 20;
        const cardHeight = 100;
        const cardSpacing = 10;
        
        let startY;
        if (Renderer.currentPage === 'main') {
            startY = (this.renderInfo.navHeight || 130) + 10 + 120 + 10 + 35;
        } else {
            startY = (this.renderInfo.navHeight || 130) + 10 + 35;
        }
        
        this.gameState.businesses.forEach((business, index) => {
            const cardY = startY + (cardHeight + cardSpacing) * index;
            const cardWidth = this.canvas.width - padding * 2;
            
            if (coords.x >= padding && coords.x <= padding + cardWidth &&
                coords.y >= cardY && coords.y <= cardY + cardHeight) {
                
                this.handleBusinessCardClick(business, index, coords, cardY, cardWidth, padding);
            }
        });
    },
    
    handleBusinessCardClick(business, index, coords, cardY, cardWidth, padding) {
        const config = GameLogic.getBusinessConfig(business.id);
        if (!config) return;
        
        if (!business.unlocked) {
            return;
        }
        
        if (business.owned && business.cycleProgress >= 1) {
            const hasAutoCollect = business.managers && business.managers.some(m => {
                const managerConfig = GameLogic.getManagerConfig(m);
                return managerConfig && managerConfig.effect === 'autoCollect';
            });
            
            if (!hasAutoCollect) {
                GameLogic.collectBusiness(this.gameState, business.id);
                this.notifyStateChange();
                return;
            }
        }
        
        const buttonWidth = 90;
        const buttonHeight = 30;
        const progressBarY = cardY + 65;
        
        const buttonX = cardWidth - padding - buttonWidth;
        const buttonY = progressBarY - 2;
        
        if (coords.x >= buttonX && coords.x <= buttonX + buttonWidth &&
            coords.y >= buttonY && coords.y <= buttonY + buttonHeight) {
            
            if (business.owned) {
                GameLogic.upgradeBusiness(this.gameState, business.id);
            } else {
                GameLogic.buyBusiness(this.gameState, business.id);
            }
            this.notifyStateChange();
        }
    },
    
    handleManagerHireClick(coords) {
        const padding = 20;
        const navHeight = this.renderInfo.navHeight || 130;
        
        const managerSectionStartY = navHeight + 10 + 35;
        const managerCardHeight = 90;
        const managerCardSpacing = 10;
        
        let ownedBusinessStartY = managerSectionStartY + (GameConfig.managers.length * (managerCardHeight + managerCardSpacing)) + 20 + 30;
        
        const rowHeight = 60;
        const rowSpacing = 8;
        
        let currentRowIndex = 0;
        this.gameState.businesses.forEach((business, index) => {
            if (!business.owned) return;
            
            const rowY = ownedBusinessStartY + (rowHeight + rowSpacing) * currentRowIndex;
            
            if (coords.x >= padding && coords.x <= this.canvas.width - padding &&
                coords.y >= rowY && coords.y <= rowY + rowHeight) {
                
                GameConfig.managers.forEach((managerConfig, mIndex) => {
                    const buttonWidth = 70;
                    const buttonHeight = 30;
                    const buttonX = this.canvas.width - padding - (buttonWidth + 10) * (mIndex + 1);
                    const buttonY = rowY + 15;
                    
                    if (coords.x >= buttonX && coords.x <= buttonX + buttonWidth &&
                        coords.y >= buttonY && coords.y <= buttonY + buttonHeight) {
                        
                        const hireInfo = GameLogic.getManagerHireInfo(this.gameState, managerConfig.id, business.id);
                        
                        if (hireInfo.canHire && !hireInfo.alreadyHired) {
                            GameLogic.hireManager(this.gameState, managerConfig.id, business.id);
                            this.notifyStateChange();
                        }
                    }
                });
            }
            
            currentRowIndex++;
        });
    },
    
    handlePrestigeClick(coords) {
        const padding = 20;
        const navHeight = this.renderInfo.navHeight || 130;
        
        const cardHeight = 180;
        const cardY = navHeight + 10 + 35;
        
        const buttonWidth = 150;
        const buttonHeight = 45;
        const buttonX = this.canvas.width / 2 - buttonWidth / 2;
        const buttonY = cardY + cardHeight - buttonHeight - 15;
        
        if (coords.x >= buttonX && coords.x <= buttonX + buttonWidth &&
            coords.y >= buttonY && coords.y <= buttonY + buttonHeight) {
            
            if (GameLogic.canPrestige(this.gameState)) {
                this.confirmPrestige();
            }
        }
    },
    
    startNewGame() {
        const newState = GameLogic.createInitialState();
        newState.gameStarted = true;
        Object.assign(this.gameState, newState);
        Storage.clear();
        this.notifyStateChange();
    },
    
    continueGame() {
        const savedData = Storage.load();
        if (savedData && savedData.state) {
            Object.assign(this.gameState, savedData.state);
            this.gameState.gameStarted = true;
            
            const currentTime = Date.now();
            this.offlineData = OfflineManager.checkAndProcessOffline(this.gameState, savedData.timestamp);
            
            this.notifyStateChange();
        }
    },
    
    collectOfflineEarnings() {
        if (this.offlineData && this.offlineData.earnings > 0) {
            OfflineManager.collectOfflineEarnings(this.gameState, this.offlineData.earnings);
            this.offlineData = null;
            this.notifyStateChange();
        }
    },
    
    togglePause() {
        this.gameState.isPaused = !this.gameState.isPaused;
        this.notifyStateChange();
    },
    
    confirmReset() {
        if (confirm('确定要重置游戏吗？所有进度将丢失！')) {
            const newState = GameLogic.createInitialState();
            newState.gameStarted = true;
            Object.assign(this.gameState, newState);
            Storage.clear();
            this.notifyStateChange();
        }
    },
    
    confirmPrestige() {
        const points = GameLogic.calculatePrestigePoints(this.gameState);
        if (confirm(`确定要转生吗？\n将获得 ${GameConfig.formatNumber(points)} 点声望\n所有业务将重置，但声望加成永久保留！`)) {
            GameLogic.prestige(this.gameState);
            this.notifyStateChange();
        }
    },
    
    handleMouseDown(e) {
    },
    
    handleMouseUp(e) {
    },
    
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const coords = this.getCanvasCoordinates({ clientX: touch.clientX, clientY: touch.clientY });
        
        this.handleTouchClick(coords);
    },
    
    handleTouchEnd(e) {
        e.preventDefault();
    },
    
    handleTouchClick(coords) {
        if (this.offlineData && this.offlineData.hasOffline && this.renderInfo) {
            if (this.renderInfo.button && Renderer.isPointInRect(coords.x, coords.y, this.renderInfo.button)) {
                this.collectOfflineEarnings();
                return;
            }
        }
        
        if (!this.gameState.gameStarted) {
            this.handleStartScreenClick(coords);
            return;
        }
        
        this.handleGameClick(coords);
    },
    
    notifyStateChange() {
        if (this.onStateChange) {
            this.onStateChange(this.gameState);
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputHandler;
}
