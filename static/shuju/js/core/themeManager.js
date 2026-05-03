const ThemeManager = {
    currentTheme: 'dark',
    listeners: [],

    init() {
        this.currentTheme = Storage.get('theme', 'dark');
        this.applyTheme();
        return this;
    },

    getTheme() {
        return this.currentTheme;
    },

    setTheme(theme) {
        if (theme !== 'light' && theme !== 'dark') {
            theme = 'dark';
        }
        
        this.currentTheme = theme;
        Storage.set('theme', theme);
        this.applyTheme();
        this.notifyListeners(theme);
    },

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    },

    applyTheme() {
        const body = document.body;
        
        if (this.currentTheme === 'dark') {
            body.classList.remove('theme-light');
            body.classList.add('theme-dark');
        } else {
            body.classList.remove('theme-dark');
            body.classList.add('theme-light');
        }
    },

    getChartColors() {
        if (this.currentTheme === 'dark') {
            return {
                primary: '#00f5ff',
                secondary: '#8b5cf6',
                accent: '#f472b6',
                success: '#10b981',
                warning: '#f59e0b',
                error: '#ef4444',
                text: '#e2e8f0',
                grid: 'rgba(0, 245, 255, 0.1)',
                background: 'rgba(26, 26, 58, 0.8)'
            };
        } else {
            return {
                primary: '#7c3aed',
                secondary: '#8b5cf6',
                accent: '#ec4899',
                success: '#059669',
                warning: '#d97706',
                error: '#dc2626',
                text: '#1e293b',
                grid: 'rgba(124, 58, 237, 0.1)',
                background: 'rgba(255, 255, 255, 0.95)'
            };
        }
    },

    getGradientColors(chartType) {
        const colors = this.getChartColors();
        
        const gradients = {
            lineChart: [
                Helpers.hexToRgba(colors.primary, 0.8),
                Helpers.hexToRgba(colors.primary, 0.2)
            ],
            areaChart: [
                Helpers.hexToRgba(colors.primary, 0.4),
                Helpers.hexToRgba(colors.primary, 0.05)
            ],
            barChart: [
                colors.primary,
                colors.secondary,
                colors.accent,
                colors.success,
                colors.warning,
                colors.error
            ],
            pieChart: [
                colors.primary,
                colors.secondary,
                colors.accent,
                colors.success,
                colors.warning
            ]
        };

        return gradients[chartType] || gradients.lineChart;
    },

    subscribe(listener) {
        this.listeners.push(listener);
    },

    unsubscribe(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    },

    notifyListeners(theme) {
        this.listeners.forEach(listener => listener(theme));
    }
};

window.ThemeManager = ThemeManager;
