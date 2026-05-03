const App = {
    isInitialized: false,

    init() {
        if (this.isInitialized) return;

        this.showLoader();

        StateManager.init();
        ThemeManager.init();
        DataStore.init();
        ChartEngine.init();

        const hasSavedLayout = LayoutService.loadLayout();

        KPICard.init();
        LineChart.init();
        BarChart.init();
        PieChart.init();
        AreaChart.init();
        FunnelChart.init();

        DateFilter.init();
        ExportService.init();
        ImportService.init();
        DrillService.init();
        LayoutService.init();

        this.bindGlobalEvents();

        setTimeout(() => {
            this.hideLoader();
            this.isInitialized = true;
            
            if (hasSavedLayout) {
                this.showToast('已加载保存的布局配置', 'info');
            }
        }, 800);
    },

    showLoader() {
        const loader = document.getElementById('loader');
        const app = document.getElementById('app');
        
        if (loader) {
            loader.style.display = 'flex';
        }
        if (app) {
            app.classList.add('hidden');
        }
    },

    hideLoader() {
        const loader = document.getElementById('loader');
        const app = document.getElementById('app');
        
        if (loader) {
            loader.style.display = 'none';
        }
        if (app) {
            app.classList.remove('hidden');
        }

        window.dispatchEvent(new Event('resize'));
    },

    bindGlobalEvents() {
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 's':
                        e.preventDefault();
                        LayoutService.saveLayout();
                        break;
                    case 'e':
                        e.preventDefault();
                        ExportService.showModal();
                        break;
                    case 'i':
                        e.preventDefault();
                        ImportService.show();
                        break;
                    case 't':
                        e.preventDefault();
                        LayoutService.toggleTheme();
                        break;
                }
            }
        });

        window.addEventListener('beforeunload', () => {
            LayoutService.saveLayout();
        });

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                ChartEngine.resizeAll();
            }, 150);
        });
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
    },

    refreshAll() {
        KPICard.render();
        LineChart.render();
        BarChart.render();
        PieChart.render();
        AreaChart.render();
        FunnelChart.render();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

window.App = App;
