const ExportService = {
    modal: null,

    init() {
        this.modal = document.getElementById('exportModal');
        this.bindEvents();
        return this;
    },

    bindEvents() {
        const exportBtn = document.getElementById('exportBtn');
        const chartActionBtns = document.querySelectorAll('.chart-action-btn[data-action="export"]');
        
        exportBtn?.addEventListener('click', () => this.showModal());
        
        chartActionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.chart-card');
                const canvas = card?.querySelector('.chart-canvas');
                if (canvas?.id) {
                    this.exportChart(canvas.id);
                }
            });
        });

        this.bindModalEvents();
    },

    bindModalEvents() {
        if (!this.modal) return;

        const closeBtn = document.getElementById('closeExportModal');
        const cancelBtn = document.getElementById('cancelExport');
        const confirmBtn = document.getElementById('confirmExport');
        const overlay = this.modal.querySelector('.modal-overlay');

        closeBtn?.addEventListener('click', () => this.hideModal());
        cancelBtn?.addEventListener('click', () => this.hideModal());
        overlay?.addEventListener('click', () => this.hideModal());
        confirmBtn?.addEventListener('click', () => this.handleConfirmExport());
    },

    showModal() {
        if (!this.modal) return;
        this.modal.classList.add('active');
    },

    hideModal() {
        if (!this.modal) return;
        this.modal.classList.remove('active');
    },

    handleConfirmExport() {
        const exportType = document.querySelector('input[name="exportType"]:checked')?.value;
        const chartSelect = document.getElementById('exportChartSelect');
        const selectedChart = chartSelect?.value;

        if (!exportType) {
            this.showToast('请选择导出类型', 'warning');
            return;
        }

        if (exportType === 'image') {
            if (selectedChart === 'all') {
                this.exportAllImages();
            } else {
                this.exportChart(selectedChart);
            }
        } else {
            if (selectedChart === 'all') {
                this.exportAllCSV();
            } else {
                this.exportChartCSV(selectedChart);
            }
        }

        this.hideModal();
    },

    exportChart(chartId) {
        const chartComponents = {
            lineChart: LineChart,
            barChart: BarChart,
            pieChart: PieChart,
            areaChart: AreaChart,
            funnelChart: FunnelChart
        };

        const chart = chartComponents[chartId];
        if (chart && chart.exportImage) {
            const dataUrl = chart.exportImage();
            this.downloadImage(dataUrl, `${chartId}_${DateUtils.format(new Date(), 'YYYYMMDD')}.png`);
            this.showToast('图表导出成功', 'success');
        }
    },

    exportAllImages() {
        const chartComponents = {
            lineChart: LineChart,
            barChart: BarChart,
            pieChart: PieChart,
            areaChart: AreaChart,
            funnelChart: FunnelChart
        };

        const dateStr = DateUtils.format(new Date(), 'YYYYMMDD');
        Object.entries(chartComponents).forEach(([id, chart], index) => {
            if (chart && chart.exportImage) {
                setTimeout(() => {
                    const dataUrl = chart.exportImage();
                    this.downloadImage(dataUrl, `${id}_${dateStr}.png`);
                }, index * 500);
            }
        });

        this.showToast('正在导出所有图表...', 'info');
    },

    downloadImage(dataUrl, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    exportChartCSV(chartId) {
        const chartComponents = {
            lineChart: LineChart,
            barChart: BarChart,
            pieChart: PieChart,
            areaChart: AreaChart,
            funnelChart: FunnelChart
        };

        const chart = chartComponents[chartId];
        if (chart && chart.getCSVData) {
            const csvData = chart.getCSVData();
            if (csvData) {
                const csv = this.generateCSV(csvData);
                const filename = `${chartId}_${DateUtils.format(new Date(), 'YYYYMMDD')}.csv`;
                this.downloadCSV(csv, filename);
                this.showToast('数据导出成功', 'success');
            }
        }
    },

    exportAllCSV() {
        const chartComponents = {
            lineChart: LineChart,
            barChart: BarChart,
            pieChart: PieChart,
            areaChart: AreaChart,
            funnelChart: FunnelChart
        };

        let allCSV = '';
        const dateStr = DateUtils.format(new Date(), 'YYYYMMDD');

        Object.entries(chartComponents).forEach(([id, chart]) => {
            if (chart && chart.getCSVData) {
                const csvData = chart.getCSVData();
                if (csvData) {
                    allCSV += `\n${csvData.title}\n`;
                    allCSV += this.generateCSV(csvData);
                    allCSV += '\n';
                }
            }
        });

        if (allCSV) {
            this.downloadCSV(allCSV, `dashboard_data_${dateStr}.csv`);
            this.showToast('所有数据导出成功', 'success');
        }
    },

    generateCSV(data) {
        const { headers, rows } = data;
        let csv = '';

        if (headers) {
            csv += headers.map(h => `"${h}"`).join(',') + '\n';
        }

        rows.forEach(row => {
            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        return csv;
    },

    downloadCSV(csv, filename) {
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

window.ExportService = ExportService;
