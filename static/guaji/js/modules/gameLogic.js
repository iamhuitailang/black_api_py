const GameLogic = {
    createInitialState() {
        return {
            money: 0,
            prestigePoints: 0,
            totalEarnings: 0,
            totalPrestige: 0,
            clickMultiplier: 1,
            isPaused: false,
            gameStarted: false,
            lastSaveTime: Date.now(),
            offlineTime: 0,
            offlineEarnings: 0,
            
            businesses: GameConfig.businesses.map(business => ({
                id: business.id,
                level: business.id === 1 ? 1 : 0,
                owned: business.id === 1,
                unlocked: business.id === 1,
                lastCycleTime: 0,
                cycleProgress: 0,
                managers: [],
                currentIncome: business.baseIncome,
                currentCost: business.baseCost
            })),
            
            managers: GameConfig.managers.map(manager => ({
                id: manager.id,
                hired: false,
                assignedBusinesses: []
            })),
            
            upgrades: [],
            stats: {
                totalClicks: 0,
                totalBusinessBought: 0,
                totalManagersHired: 0,
                totalPrestigeCount: 0,
                totalOfflineEarnings: 0
            }
        };
    },

    getBusinessById(businesses, id) {
        return businesses.find(b => b.id === id);
    },

    getManagerById(managers, id) {
        return managers.find(m => m.id === id);
    },

    getBusinessConfig(id) {
        return GameConfig.businesses.find(b => b.id === id);
    },

    getManagerConfig(id) {
        return GameConfig.managers.find(m => m.id === id);
    },

    calculateBusinessCost(businessState, businessConfig) {
        if (businessState.level === 0) {
            return businessConfig.baseCost;
        }
        
        let costMultiplier = 1;
        for (let i = 1; i <= businessState.level; i++) {
            const upgrade = GameConfig.upgrades.find(u => u.level === i);
            if (upgrade) {
                costMultiplier *= upgrade.costMultiplier;
            } else {
                costMultiplier *= 2;
            }
        }
        
        return Math.floor(businessConfig.baseCost * costMultiplier);
    },

    calculateBusinessIncome(businessState, businessConfig, prestigePoints) {
        if (businessState.level === 0) {
            return 0;
        }
        
        let incomeMultiplier = 1;
        for (let i = 1; i <= businessState.level; i++) {
            const upgrade = GameConfig.upgrades.find(u => u.level === i);
            if (upgrade) {
                incomeMultiplier *= upgrade.incomeMultiplier;
            }
        }
        
        const prestigeBonus = 1 + (prestigePoints * GameConfig.prestige.incomeBonusPerPoint);
        
        let managerBonus = 1;
        if (businessState.managers && businessState.managers.length > 0) {
            businessState.managers.forEach(managerId => {
                const managerConfig = this.getManagerConfig(managerId);
                if (managerConfig && managerConfig.effect === 'doubleIncome') {
                    managerBonus *= 2;
                }
            });
        }
        
        return Math.floor(businessConfig.baseIncome * incomeMultiplier * prestigeBonus * managerBonus);
    },

    buyBusiness(state, businessId) {
        const business = this.getBusinessById(state.businesses, businessId);
        const config = this.getBusinessConfig(businessId);
        
        if (!business || !config) {
            return { success: false, message: '业务不存在' };
        }
        
        if (!business.unlocked && businessId !== 1) {
            return { success: false, message: '业务未解锁' };
        }
        
        const cost = this.calculateBusinessCost(business, config);
        
        if (state.money < cost) {
            return { success: false, message: '现金不足' };
        }
        
        state.money -= cost;
        business.level++;
        business.owned = true;
        business.currentCost = this.calculateBusinessCost(business, config);
        business.currentIncome = this.calculateBusinessIncome(business, config, state.prestigePoints);
        
        state.stats.totalBusinessBought++;
        
        return { 
            success: true, 
            message: `购买 ${config.name} 成功！`,
            business: business,
            cost: cost
        };
    },

    upgradeBusiness(state, businessId) {
        return this.buyBusiness(state, businessId);
    },

    hireManager(state, managerId, businessId) {
        const manager = this.getManagerById(state.managers, managerId);
        const managerConfig = this.getManagerConfig(managerId);
        const business = this.getBusinessById(state.businesses, businessId);
        
        if (!manager || !managerConfig || !business) {
            return { success: false, message: '经理或业务不存在' };
        }
        
        if (business.level < managerConfig.requirement.businessLevel) {
            return { 
                success: false, 
                message: `业务等级需要达到 ${managerConfig.requirement.businessLevel} 级` 
            };
        }
        
        if (business.managers && business.managers.includes(managerId)) {
            return { success: false, message: '该业务已雇佣此经理' };
        }
        
        if (state.money < managerConfig.cost) {
            return { success: false, message: '现金不足' };
        }
        
        state.money -= managerConfig.cost;
        manager.hired = true;
        
        if (!manager.assignedBusinesses) {
            manager.assignedBusinesses = [];
        }
        manager.assignedBusinesses.push(businessId);
        
        if (!business.managers) {
            business.managers = [];
        }
        business.managers.push(managerId);
        
        business.currentIncome = this.calculateBusinessIncome(
            business, 
            this.getBusinessConfig(businessId), 
            state.prestigePoints
        );
        
        state.stats.totalManagersHired++;
        
        return { 
            success: true, 
            message: `雇佣 ${managerConfig.name} 成功！`,
            manager: managerConfig,
            business: business
        };
    },

    click(state) {
        const baseIncome = GameConfig.click.baseClickIncome;
        const prestigeBonus = 1 + (state.prestigePoints * GameConfig.prestige.incomeBonusPerPoint);
        const clickIncome = Math.floor(baseIncome * state.clickMultiplier * prestigeBonus);
        
        state.money += clickIncome;
        state.totalEarnings += clickIncome;
        state.stats.totalClicks++;
        
        this.checkBusinessUnlocks(state);
        
        return {
            success: true,
            income: clickIncome,
            money: state.money
        };
    },

    collectBusiness(state, businessId) {
        const business = this.getBusinessById(state.businesses, businessId);
        const config = this.getBusinessConfig(businessId);
        
        if (!business || !config || !business.owned) {
            return { success: false, message: '业务不存在或未拥有' };
        }
        
        const income = business.currentIncome;
        state.money += income;
        state.totalEarnings += income;
        business.lastCycleTime = Date.now();
        business.cycleProgress = 0;
        
        this.checkBusinessUnlocks(state);
        
        return {
            success: true,
            income: income,
            money: state.money
        };
    },

    checkBusinessUnlocks(state) {
        state.businesses.forEach(business => {
            if (business.unlocked) return;
            
            const config = this.getBusinessConfig(business.id);
            if (!config || !config.unlockCondition) return;
            
            if (config.unlockCondition.type === 'income') {
                if (state.totalEarnings >= config.unlockCondition.value) {
                    business.unlocked = true;
                }
            }
        });
    },

    canPrestige(state) {
        return state.totalEarnings >= GameConfig.prestige.unlockCondition.value;
    },

    calculatePrestigePoints(state) {
        if (!this.canPrestige(state)) {
            return 0;
        }
        
        const basePoints = GameConfig.prestige.basePrestigePoints;
        const multiplier = GameConfig.prestige.prestigeMultiplier;
        
        const earningsRatio = state.totalEarnings / GameConfig.prestige.unlockCondition.value;
        const logRatio = Math.log10(earningsRatio);
        
        return Math.floor(basePoints * Math.pow(multiplier, logRatio));
    },

    prestige(state) {
        if (!this.canPrestige(state)) {
            return { success: false, message: '未达到转生条件' };
        }
        
        const earnedPoints = this.calculatePrestigePoints(state);
        state.prestigePoints += earnedPoints;
        state.totalPrestige += earnedPoints;
        state.stats.totalPrestigeCount++;
        
        const savedPrestigePoints = state.prestigePoints;
        const savedTotalPrestige = state.totalPrestige;
        const savedStats = { ...state.stats };
        
        const newState = this.createInitialState();
        newState.prestigePoints = savedPrestigePoints;
        newState.totalPrestige = savedTotalPrestige;
        newState.stats = savedStats;
        newState.gameStarted = true;
        newState.totalEarnings = 0;
        
        newState.businesses.forEach(business => {
            const config = this.getBusinessConfig(business.id);
            if (config) {
                business.currentIncome = this.calculateBusinessIncome(
                    business, 
                    config, 
                    newState.prestigePoints
                );
                business.currentCost = this.calculateBusinessCost(business, config);
            }
        });
        
        Object.assign(state, newState);
        
        return {
            success: true,
            points: earnedPoints,
            totalPoints: state.prestigePoints,
            message: `转生成功！获得 ${earnedPoints} 点声望`
        };
    },

    calculateTotalIncomePerSecond(state) {
        let total = 0;
        
        state.businesses.forEach(business => {
            if (business.owned && business.level > 0) {
                const config = this.getBusinessConfig(business.id);
                if (config) {
                    const cyclesPerSecond = 1000 / config.cycleTime;
                    total += business.currentIncome * cyclesPerSecond;
                }
            }
        });
        
        return total;
    },

    updateCycleProgress(state, deltaTime) {
        const now = Date.now();
        
        state.businesses.forEach(business => {
            if (!business.owned || business.level === 0) return;
            
            const config = this.getBusinessConfig(business.id);
            if (!config) return;
            
            const hasAutoCollect = business.managers && business.managers.some(m => {
                const managerConfig = this.getManagerConfig(m);
                return managerConfig && managerConfig.effect === 'autoCollect';
            });
            
            if (hasAutoCollect) {
                const cycles = Math.floor(deltaTime / config.cycleTime);
                if (cycles > 0) {
                    const income = business.currentIncome * cycles;
                    state.money += income;
                    state.totalEarnings += income;
                    business.lastCycleTime = now;
                    business.cycleProgress = 0;
                }
            } else {
                if (business.lastCycleTime === 0) {
                    business.lastCycleTime = now;
                }
                
                const elapsed = now - business.lastCycleTime;
                business.cycleProgress = Math.min(1, elapsed / config.cycleTime);
            }
        });
        
        this.checkBusinessUnlocks(state);
    },

    processAutoUpgrades(state) {
        state.businesses.forEach(business => {
            if (!business.owned) return;
            
            const hasAutoUpgrade = business.managers && business.managers.some(m => {
                const managerConfig = this.getManagerConfig(m);
                return managerConfig && managerConfig.effect === 'autoUpgrade';
            });
            
            if (!hasAutoUpgrade) return;
            
            const config = this.getBusinessConfig(business.id);
            if (!config) return;
            
            const cost = this.calculateBusinessCost(business, config);
            if (state.money >= cost) {
                this.upgradeBusiness(state, business.id);
            }
        });
    },

    getBusinessUnlockProgress(state, businessId) {
        const business = this.getBusinessById(state.businesses, businessId);
        const config = this.getBusinessConfig(businessId);
        
        if (!business || !config) {
            return { unlocked: false, progress: 0, required: 0 };
        }
        
        if (business.unlocked) {
            return { unlocked: true, progress: 1, required: config.unlockCondition?.value || 0 };
        }
        
        if (!config.unlockCondition) {
            return { unlocked: true, progress: 1, required: 0 };
        }
        
        const required = config.unlockCondition.value;
        const progress = Math.min(1, state.totalEarnings / required);
        
        return {
            unlocked: false,
            progress: progress,
            required: required,
            current: state.totalEarnings
        };
    },

    getManagerHireInfo(state, managerId, businessId) {
        const managerConfig = this.getManagerConfig(managerId);
        const business = this.getBusinessById(state.businesses, businessId);
        
        if (!managerConfig || !business) {
            return { canHire: false, reason: '无效参数' };
        }
        
        if (business.managers && business.managers.includes(managerId)) {
            return { canHire: false, reason: '已雇佣', alreadyHired: true };
        }
        
        if (business.level < managerConfig.requirement.businessLevel) {
            return { 
                canHire: false, 
                reason: '等级不足',
                requiredLevel: managerConfig.requirement.businessLevel,
                currentLevel: business.level
            };
        }
        
        if (state.money < managerConfig.cost) {
            return { 
                canHire: false, 
                reason: '现金不足',
                cost: managerConfig.cost,
                currentMoney: state.money
            };
        }
        
        return {
            canHire: true,
            cost: managerConfig.cost,
            manager: managerConfig
        };
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameLogic;
}
