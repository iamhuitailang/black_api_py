const DateFilter = {
    container: null,
    modal: null,
    activeRange: 'today',

    init() {
        this.container = document.getElementById('dateFilter');
        this.modal = document.getElementById('customDateModal');
        
        if (!this.container) return this;

        this.activeRange = StateManager.get('dateRange') || 'today';
        this.bindEvents();
        this.updateActiveButton();

        return this;
    },

    bindEvents() {
        this.container.querySelectorAll('.date-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const range = e.target.dataset.range;
                if (range === 'custom') {
                    this.showCustomModal();
                } else {
                    this.setRange(range);
                }
            });
        });

        this.bindModalEvents();
    },

    bindModalEvents() {
        if (!this.modal) return;

        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        const confirmBtn = document.getElementById('confirmDate');
        const cancelBtn = document.getElementById('cancelDate');
        const closeBtn = document.getElementById('closeDateModal');
        const overlay = this.modal.querySelector('.modal-overlay');

        const today = DateUtils.format(new Date(), 'YYYY-MM-DD');
        if (startDate) {
            startDate.max = today;
            const savedStart = StateManager.get('customStartDate');
            if (savedStart) {
                startDate.value = savedStart;
            } else {
                startDate.value = today;
            }
        }
        
        if (endDate) {
            endDate.max = today;
            const savedEnd = StateManager.get('customEndDate');
            if (savedEnd) {
                endDate.value = savedEnd;
            } else {
                endDate.value = today;
            }
        }

        confirmBtn?.addEventListener('click', () => this.confirmCustomDate());
        cancelBtn?.addEventListener('click', () => this.hideModal());
        closeBtn?.addEventListener('click', () => this.hideModal());
        overlay?.addEventListener('click', () => this.hideModal());
    },

    setRange(range) {
        this.activeRange = range;
        StateManager.set('dateRange', range);
        this.updateActiveButton();
        this.refreshCharts();
    },

    updateActiveButton() {
        this.container.querySelectorAll('.date-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.range === this.activeRange);
        });
    },

    showCustomModal() {
        if (!this.modal) return;
        this.modal.classList.add('active');
    },

    hideModal() {
        if (!this.modal) return;
        this.modal.classList.remove('active');
    },

    confirmCustomDate() {
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');

        if (!startDate?.value || !endDate?.value) {
            this.showToast('请选择完整的日期范围', 'warning');
            return;
        }

        const start = new Date(startDate.value);
        const end = new Date(endDate.value);

        if (start > end) {
            this.showToast('开始日期不能晚于结束日期', 'error');
            return;
        }

        StateManager.setCustomDateRange(startDate.value, endDate.value);
        this.activeRange = 'custom';
        this.updateActiveButton();
        this.hideModal();
        this.refreshCharts();
    },

    refreshCharts() {
        ChartEngine.resizeAll();
        this.showToast('日期范围已更新', 'success');
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

window.DateFilter = DateFilter;
