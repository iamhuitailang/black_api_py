const Storage = {
    save(config) {
        try {
            localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
            return true;
        } catch (error) {
            console.error('保存配置失败:', error);
            return false;
        }
    },
    
    load() {
        try {
            const saved = localStorage.getItem(CONFIG_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return this.mergeDefaults(parsed);
            }
        } catch (error) {
            console.error('加载配置失败:', error);
        }
        return this.getDefaults();
    },
    
    getDefaults() {
        return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    },
    
    mergeDefaults(savedConfig) {
        const defaults = this.getDefaults();
        
        return {
            ...defaults,
            ...savedConfig,
            colors: {
                ...defaults.colors,
                ...(savedConfig.colors || {})
            },
            display: {
                ...defaults.display,
                ...(savedConfig.display || {})
            },
            camera: {
                ...defaults.camera,
                ...(savedConfig.camera || {})
            }
        };
    },
    
    clear() {
        try {
            localStorage.removeItem(CONFIG_KEY);
            return true;
        } catch (error) {
            console.error('清除配置失败:', error);
            return false;
        }
    }
};
