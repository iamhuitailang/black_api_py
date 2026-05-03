const DrillService = {
    modal: null,
    currentData: null,
    currentChartType: null,
    currentDataIndex: null,

    init() {
        this.modal = document.getElementById('drillModal');
        this.bindEvents();
        return this;
    },

    bindEvents() {
        const chartActionBtns = document.querySelectorAll('.chart-action-btn[data-action="drill"]');
        
        chartActionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.chart-card');
                const chartType = this.getChartTypeFromCard(card);
                if (chartType) {
                    this.show(chartType, 0);
                }
            });
        });

        this.bindModalEvents();
    },

    getChartTypeFromCard(card) {
        if (!card) return null;
        
        const cardId = card.id;
        const mapping = {
            'lineChartCard': 'lineChart',
            'barChartCard': 'barChart',
            'pieChartCard': 'pieChart',
            'areaChartCard': 'areaChart',
            'funnelChartCard': 'funnelChart'
        };

        return mapping[cardId];
    },

    bindModalEvents() {
        if (!this.modal) return;

        const closeBtn = document.getElementById('closeDrillModal');
        const closeDrillBtn = document.getElementById('closeDrill');
        const exportBtn = document.getElementById('exportDrillCSV');
        const overlay = this.modal.querySelector('.modal-overlay');

        closeBtn?.addEventListener('click', () => this.hide());
        closeDrillBtn?.addEventListener('click', () => this.hide());
        overlay?.addEventListener('click', () => this.hide());
        exportBtn?.addEventListener('click', () => this.exportCSV());
    },

    show(chartType, dataIndex) {
        this.currentChartType = chartType;
        this.currentDataIndex = dataIndex;

        const drillData = DataStore.getDrillData(chartType, dataIndex);
        if (!drillData) {
            this.showToast('暂无详细数据', 'info');
            return;
        }

        this.currentData = drillData;
        this.render(drillData);
        
        if (this.modal) {
            const title = document.getElementById('drillModalTitle');
            if (title) {
                title.textContent = drillData.title;
            }
            this.modal.classList.add('active');
        }
    },

    hide() {
        if (this.modal) {
            this.modal.classList.remove('active');
        }
    },

    render(data) {
        const container = document.getElementById('drillContent');
        if (!container) return;

        let html = '';

        if (data.summary && data.summary.length > 0) {
            html += `
                <div class="drill-summary">
                    ${data.summary.map(item => `
                        <div class="drill-summary-item">
                            <div class="drill-summary-value">${item.value}</div>
                            <div class="drill-summary-label">${item.label}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (data.tableData) {
            html += `
                <div class="drill-table-container">
                    <table class="drill-table">
                        <thead>
                            <tr>
                                ${data.tableData.headers.map(h => `<th>${h}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${data.tableData.rows.map(row => `
                                <tr>
                                    ${row.map(cell => `<td>${cell}</td>`).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        container.innerHTML = html;
    },

    exportCSV() {
        if (!this.currentData || !this.currentData.tableData) {
            this.showToast('没有可导出的数据', 'warning');
            return;
        }

        const { tableData, title } = this.currentData;
        let csv = '';

        if (title) {
            csv += `${title}\n\n`;
        }

        csv += tableData.headers.map(h => `"${h}"`).join(',') + '\n';
        tableData.rows.forEach(row => {
            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        const filename = `drill_${this.currentChartType}_${DateUtils.format(new Date(), 'YYYYMMDD')}.csv`;
        
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.showToast('数据导出成功', 'success');
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

window.DrillService = DrillService;
