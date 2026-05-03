const OfflineManager = {
    calculateOfflineEarnings(state, lastSaveTime, currentTime) {
        if (!lastSaveTime || lastSaveTime >= currentTime) {
            return { earnings: 0, offlineTime: 0 };
        }
        
        const offlineTime = currentTime - lastSaveTime;
        
        const maxOfflineTime = 7 * 24 * 60 * 60 * 1000;
        const effectiveOfflineTime = Math.min(offlineTime, maxOfflineTime);
        
        let totalEarnings = 0;
        
        state.businesses.forEach(business => {
            if (!business.owned || business.level === 0) return;
            
            const config = GameLogic.getBusinessConfig(business.id);
            if (!config) return;
            
            const hasAutoCollect = business.managers && business.managers.some(m => {
                const managerConfig = GameLogic.getManagerConfig(m);
                return managerConfig && managerConfig.effect === 'autoCollect';
            });
            
            if (!hasAutoCollect) return;
            
            const cycles = Math.floor(effectiveOfflineTime / config.cycleTime);
            const earnings = business.currentIncome * cycles;
            
            totalEarnings += earnings;
        });
        
        return {
            earnings: totalEarnings,
            offlineTime: offlineTime,
            effectiveOfflineTime: effectiveOfflineTime,
            capped: offlineTime > maxOfflineTime
        };
    },

    collectOfflineEarnings(state, earnings) {
        if (earnings <= 0) {
            return { success: false, message: '没有离线收益' };
        }
        
        state.money += earnings;
        state.totalEarnings += earnings;
        state.stats.totalOfflineEarnings += earnings;
        state.offlineEarnings = 0;
        
        return {
            success: true,
            earnings: earnings,
            newMoney: state.money
        };
    },

    calculateCycleProgressDuringOffline(state, offlineTime) {
        state.businesses.forEach(business => {
            if (!business.owned || business.level === 0) return;
            
            const config = GameLogic.getBusinessConfig(business.id);
            if (!config) return;
            
            const hasAutoCollect = business.managers && business.managers.some(m => {
                const managerConfig = GameLogic.getManagerConfig(m);
                return managerConfig && managerConfig.effect === 'autoCollect';
            });
            
            if (hasAutoCollect) return;
            
            const elapsed = offlineTime;
            business.cycleProgress = Math.min(1, elapsed / config.cycleTime);
        });
    },

    getOfflineTimeDisplay(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            const remainingHours = hours % 24;
            return remainingHours > 0 ? `${days}天 ${remainingHours}小时` : `${days}天`;
        } else if (hours > 0) {
            const remainingMinutes = minutes % 60;
            return remainingMinutes > 0 ? `${hours}小时 ${remainingMinutes}分钟` : `${hours}小时`;
        } else if (minutes > 0) {
            const remainingSeconds = seconds % 60;
            return remainingSeconds > 0 ? `${minutes}分钟 ${remainingSeconds}秒` : `${minutes}分钟`;
        } else {
            return `${seconds}秒`;
        }
    },

    formatOfflineEarnings(earnings) {
        if (earnings <= 0) {
            return '0';
        }
        return GameConfig.formatNumber(earnings);
    },

    checkAndProcessOffline(state, lastSaveTime) {
        const currentTime = Date.now();
        
        if (!lastSaveTime) {
            return { hasOffline: false };
        }
        
        const result = this.calculateOfflineEarnings(state, lastSaveTime, currentTime);
        
        if (result.earnings > 0) {
            state.offlineTime = result.offlineTime;
            state.offlineEarnings = result.earnings;
            
            this.calculateCycleProgressDuringOffline(state, result.offlineTime);
            
            return {
                hasOffline: true,
                earnings: result.earnings,
                offlineTime: result.offlineTime,
                formattedTime: this.getOfflineTimeDisplay(result.offlineTime),
                formattedEarnings: this.formatOfflineEarnings(result.earnings),
                capped: result.capped
            };
        }
        
        return { hasOffline: false };
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = OfflineManager;
}
