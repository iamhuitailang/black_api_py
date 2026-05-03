const LayoutService = {
    init() {
        this.bindEvents();
        return this;
    },

    bindEvents() {
        const saveBtn = document.getElementById('saveLayoutBtn');
        const themeToggle = document.getElementById('themeToggle');
        const dataSourceSelect = document.getElementById('dataSourceSelect');

        saveBtn?.addEventListener('click', () => this.saveLayout());
        themeToggle?.addEventListener('click', () => this.toggleTheme());

        if (dataSourceSelect) {
            const currentSource = DataStore.getCurrentSource();
            dataSourceSelect.value = currentSource;
            
            dataSourceSelect.addEventListener('change', (e) => {
                const source = e.target.value;
                DataStore.setSource(source);
                this.showToast(`已切换到 ${this.getSourceName(source)}`, 'success');
            });
        }
    },

    getSourceName(source) {
        const names = {
            'default': '默认数据',
            'sales': '销售数据',
            'user': '用户数据'
        };
        return names[source] || source;
    },

    saveLayout() {
        const appState = StateManager.get();
        const theme = ThemeManager.getTheme();
        const dataSource = DataStore.getCurrentSource();

        const layoutConfig = {
            savedAt: new Date().toISOString(),
            appState,
            theme,
            dataSource
        };

        Storage.set('layoutConfig', layoutConfig);
        this.showToast('布局配置已保存', 'success');
    },

    loadLayout() {
        const savedConfig = Storage.get('layoutConfig');
        if (!savedConfig) return false;

        if (savedConfig.appState) {
            Object.keys(savedConfig.appState).forEach(key => {
                StateManager.set(key, savedConfig.appState[key]);
            });
        }

        if (savedConfig.theme) {
            ThemeManager.setTheme(savedConfig.theme);
        }

        if (savedConfig.dataSource) {
            DataStore.setSource(savedConfig.dataSource);
            const dataSourceSelect = document.getElementById('dataSourceSelect');
            if (dataSourceSelect) {
                dataSourceSelect.value = savedConfig.dataSource;
            }
        }

        return true;
    },

    toggleTheme() {
        ThemeManager.toggleTheme();
        const theme = ThemeManager.getTheme();
        this.showToast(`已切换到${theme === 'dark' ? '暗色' : '亮色'}主题`, 'info');
    },

    exportConfig() {
        const config = {
            state: StateManager.get(),
            theme: ThemeManager.getTheme(),
            dataSource: DataStore.getCurrentSource(),
            exportedAt: new Date().toISOString()
        };

        const jsonStr = JSON.stringify(config, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `dashboard_config_${DateUtils.format(new Date(), 'YYYYMMDD')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.showToast('配置已导出', 'success');
    },

    importConfig(config) {
        try {
            if (typeof config === 'string') {
                config = JSON.parse(config);
            }

            if (config.state) {
                Object.keys(config.state).forEach(key => {
                    StateManager.set(key, config.state[key]);
                });
            }

            if (config.theme) {
                ThemeManager.setTheme(config.theme);
            }

            if (config.dataSource) {
                DataStore.setSource(config.dataSource);
            }

            this.showToast('配置已导入', 'success');
            return true;
        } catch (e) {
            this.showToast('配置解析失败', 'error');
            return false;
        }
    },

    resetToDefault() {
        StateManager.reset();
        ThemeManager.setTheme('dark');
        DataStore.setSource('default');

        const dataSourceSelect = document.getElementById('dataSourceSelect');
        if (dataSourceSelect) {
            dataSourceSelect.value = 'default';
        }

        this.showToast('已重置为默认配置', 'info');
    },

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastText = document.getElementById('toastText');
        const toastIcon = document.getElementById('toastIcon');

        if (!toast || !toastText) return;

        const icons = {
            success: '✓',
            warning: '⚠',
            error: '✗',
            info: 'ℹ'
        };

        toastText.textContent = message;
        toastIcon.textContent = icons[type] || icons.info;
        
        toast.classList.add('active');

        setTimeout(() => {
            toast.classList.remove('active');
        }, 3000);
    }
};

window.LayoutService = LayoutService;
