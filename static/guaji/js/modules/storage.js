const Storage = {
    getKey() {
        return GameConfig.storage.key;
    },

    getVersion() {
        return GameConfig.storage.version;
    },

    save(gameState) {
        try {
            const saveData = {
                version: this.getVersion(),
                timestamp: Date.now(),
                state: JSON.parse(JSON.stringify(gameState))
            };
            localStorage.setItem(this.getKey(), JSON.stringify(saveData));
            return true;
        } catch (e) {
            console.error('保存游戏失败:', e);
            return false;
        }
    },

    load() {
        try {
            const rawData = localStorage.getItem(this.getKey());
            if (!rawData) {
                return null;
            }

            const saveData = JSON.parse(rawData);
            
            if (saveData.version !== this.getVersion()) {
                console.warn('存档版本不匹配，尝试迁移...');
                const migratedData = this.migrate(saveData);
                if (migratedData) {
                    return migratedData;
                }
                return null;
            }

            return {
                timestamp: saveData.timestamp,
                state: saveData.state
            };
        } catch (e) {
            console.error('加载游戏失败:', e);
            return null;
        }
    },

    migrate(saveData) {
        try {
            if (!saveData || !saveData.state) {
                return null;
            }

            const currentState = saveData.state;
            
            if (saveData.version === '0.9.0' && this.getVersion() === '1.0.0') {
                if (!currentState.offlineTime) {
                    currentState.offlineTime = 0;
                }
                if (!currentState.clickMultiplier) {
                    currentState.clickMultiplier = 1;
                }
                if (!currentState.isPaused) {
                    currentState.isPaused = false;
                }
            }

            return {
                timestamp: saveData.timestamp || Date.now(),
                state: currentState
            };
        } catch (e) {
            console.error('迁移存档失败:', e);
            return null;
        }
    },

    clear() {
        try {
            localStorage.removeItem(this.getKey());
            return true;
        } catch (e) {
            console.error('清除存档失败:', e);
            return false;
        }
    },

    exists() {
        return localStorage.getItem(this.getKey()) !== null;
    },

    getLastSaveTime() {
        try {
            const rawData = localStorage.getItem(this.getKey());
            if (!rawData) {
                return null;
            }
            const saveData = JSON.parse(rawData);
            return saveData.timestamp;
        } catch (e) {
            return null;
        }
    },

    autoSave(gameState, interval = 30000) {
        setInterval(() => {
            this.save(gameState);
        }, interval);
    },

    createBackup() {
        try {
            const rawData = localStorage.getItem(this.getKey());
            if (!rawData) {
                return false;
            }
            
            const backupKey = this.getKey() + '_backup_' + Date.now();
            localStorage.setItem(backupKey, rawData);
            return true;
        } catch (e) {
            console.error('创建备份失败:', e);
            return false;
        }
    },

    listBackups() {
        const backups = [];
        const prefix = this.getKey() + '_backup_';
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                try {
                    const timestamp = parseInt(key.replace(prefix, ''), 10);
                    backups.push({
                        key,
                        timestamp,
                        date: new Date(timestamp).toLocaleString()
                    });
                } catch (e) {
                    console.error('解析备份时间失败:', e);
                }
            }
        }
        
        return backups.sort((a, b) => b.timestamp - a.timestamp);
    },

    restoreBackup(backupKey) {
        try {
            const backupData = localStorage.getItem(backupKey);
            if (!backupData) {
                return false;
            }
            
            localStorage.setItem(this.getKey(), backupData);
            return true;
        } catch (e) {
            console.error('恢复备份失败:', e);
            return false;
        }
    },

    deleteOldBackups(maxAgeDays = 7) {
        const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
        const now = Date.now();
        const prefix = this.getKey() + '_backup_';
        let deleted = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                try {
                    const timestamp = parseInt(key.replace(prefix, ''), 10);
                    if (now - timestamp > maxAgeMs) {
                        localStorage.removeItem(key);
                        deleted++;
                    }
                } catch (e) {
                    console.error('删除旧备份失败:', e);
                }
            }
        }
        
        return deleted;
    },

    exportSave() {
        try {
            const rawData = localStorage.getItem(this.getKey());
            if (!rawData) {
                return null;
            }
            return btoa(rawData);
        } catch (e) {
            console.error('导出存档失败:', e);
            return null;
        }
    },

    importSave(encodedData) {
        try {
            const rawData = atob(encodedData);
            const saveData = JSON.parse(rawData);
            
            if (!saveData.version || !saveData.state) {
                return false;
            }
            
            localStorage.setItem(this.getKey(), rawData);
            return true;
        } catch (e) {
            console.error('导入存档失败:', e);
            return false;
        }
    },

    getStorageInfo() {
        let totalSize = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                const value = localStorage.getItem(key);
                if (value) {
                    totalSize += (key.length + value.length) * 2;
                }
            }
        }
        
        const gameData = localStorage.getItem(this.getKey());
        const gameSize = gameData ? (this.getKey().length + gameData.length) * 2 : 0;
        
        return {
            totalBytes: totalSize,
            gameBytes: gameSize,
            totalKB: (totalSize / 1024).toFixed(2),
            gameKB: (gameSize / 1024).toFixed(2),
            itemCount: localStorage.length
        };
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}
