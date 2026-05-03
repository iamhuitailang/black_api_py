const ImportService = {
    modal: null,
    currentData: null,
    importType: 'config',

    init() {
        this.modal = document.getElementById('importModal');
        this.bindEvents();
        return this;
    },

    bindEvents() {
        const importBtn = document.getElementById('importBtn');
        const closeBtn = document.getElementById('closeImportModal');
        const cancelBtn = document.getElementById('cancelImport');
        const confirmBtn = document.getElementById('confirmImport');
        const overlay = this.modal?.querySelector('.modal-overlay');
        const templateBtn = document.getElementById('downloadTemplate');

        importBtn?.addEventListener('click', () => this.show());
        closeBtn?.addEventListener('click', () => this.hide());
        cancelBtn?.addEventListener('click', () => this.hide());
        overlay?.addEventListener('click', () => this.hide());
        confirmBtn?.addEventListener('click', () => this.handleConfirmImport());
        templateBtn?.addEventListener('click', () => this.downloadTemplate());

        this.bindFileInput();
        this.bindTypeSelector();
    },

    bindTypeSelector() {
        const typeRadios = document.querySelectorAll('input[name="importType"]');
        typeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.importType = e.target.value;
                this.clearPreview();
            });
        });
    },

    bindFileInput() {
        const fileInput = document.getElementById('importFileInput');
        const textInput = document.getElementById('importJsonText');

        fileInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.readFile(file);
            }
        });

        textInput?.addEventListener('input', Helpers.debounce((e) => {
            const text = e.target.value.trim();
            if (text) {
                this.parseJson(text);
            } else {
                this.clearPreview();
            }
        }, 500));
    },

    show() {
        if (this.modal) {
            this.clearForm();
            this.modal.classList.add('active');
        }
    },

    hide() {
        if (this.modal) {
            this.modal.classList.remove('active');
        }
    },

    clearForm() {
        const fileInput = document.getElementById('importFileInput');
        const textInput = document.getElementById('importJsonText');
        
        if (fileInput) fileInput.value = '';
        if (textInput) textInput.value = '';
        
        this.currentData = null;
        this.clearPreview();
    },

    clearPreview() {
        const preview = document.getElementById('importPreview');
        if (preview) {
            preview.innerHTML = '<div class="preview-empty">选择文件或粘贴JSON数据后预览</div>';
        }
        this.currentData = null;
    },

    readFile(file) {
        if (!file.name.endsWith('.json')) {
            this.showToast('请选择JSON格式的文件', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            this.parseJson(text);
        };
        reader.onerror = () => {
            this.showToast('文件读取失败', 'error');
        };
        reader.readAsText(file);
    },

    parseJson(text) {
        try {
            const data = JSON.parse(text);
            this.currentData = data;
            this.showPreview(data);
        } catch (e) {
            this.showPreviewError('JSON格式错误: ' + e.message);
        }
    },

    showPreview(data) {
        const preview = document.getElementById('importPreview');
        if (!preview) return;

        const isValid = this.validateData(data);
        
        if (isValid.valid) {
            const previewHtml = this.formatPreview(data);
            preview.innerHTML = previewHtml;
        } else {
            this.showPreviewError(isValid.message);
        }
    },

    showPreviewError(message) {
        const preview = document.getElementById('importPreview');
        if (preview) {
            preview.innerHTML = `<div class="preview-empty" style="color: var(--red-error);">${message}</div>`;
        }
        this.currentData = null;
    },

    validateData(data) {
        if (!data || typeof data !== 'object') {
            return { valid: false, message: '数据格式无效' };
        }

        if (this.importType === 'config') {
            if (data.state || data.theme || data.dataSource) {
                return { valid: true, type: 'config' };
            }
            if (data.kpi || data.lineChart || data.barChart || data.pieChart) {
                return { valid: true, type: 'data' };
            }
        }

        if (this.importType === 'data') {
            if (data.kpi || data.lineChart || data.barChart || data.pieChart) {
                return { valid: true, type: 'data' };
            }
            if (data.state || data.theme || data.dataSource) {
                return { valid: true, type: 'config' };
            }
        }

        return { 
            valid: false, 
            message: '无法识别的数据格式。请确保JSON包含有效的配置或数据字段。' 
        };
    },

    formatPreview(data) {
        let html = '<div class="preview-content">';
        
        html += this.generatePreviewSection('配置/数据摘要', [
            { key: '检测到的类型', value: data.kpi ? '数据源' : '配置布局' },
            { key: '包含KPI数据', value: !!data.kpi ? '是 (' + (data.kpi?.length || 0) + '个)' : '否' },
            { key: '包含图表数据', value: this.getChartTypes(data) },
            { key: '包含主题设置', value: !!data.theme ? '是' : '否' }
        ]);

        html += `<div style="margin-top: ${this.spacing('md')}; padding-top: ${this.spacing('md')}; border-top: 1px solid var(--border-secondary);">`;
        html += '<strong>原始JSON预览:</strong><br><pre style="font-size: 10px; overflow-x: auto; margin-top: 8px;">';
        html += this.syntaxHighlight(JSON.stringify(data, null, 2).substring(0, 1500));
        if (JSON.stringify(data).length > 1500) {
            html += '\n... (数据已截断)';
        }
        html += '</pre></div>';

        html += '</div>';
        return html;
    },

    spacing(size) {
        const sizes = { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem' };
        return sizes[size] || sizes.md;
    },

    getChartTypes(data) {
        const types = [];
        if (data.lineChart) types.push('折线图');
        if (data.barChart) types.push('柱状图');
        if (data.pieChart) types.push('饼图');
        if (data.areaChart) types.push('面积图');
        if (data.funnelChart) types.push('漏斗图');
        return types.length > 0 ? types.join(', ') : '无';
    },

    generatePreviewSection(title, items) {
        let html = `<div style="font-weight: 600; margin-bottom: ${this.spacing('sm')}; color: var(--text-cyan);">${title}</div>`;
        html += '<div style="display: grid; gap: 4px;">';
        
        items.forEach(item => {
            html += `<div style="display: flex; gap: 8px;">
                <span class="preview-key">${item.key}:</span>
                <span style="color: var(--text-primary);">${item.value}</span>
            </div>`;
        });
        
        html += '</div>';
        return html;
    },

    syntaxHighlight(json) {
        return json.replace(/"([^"]+)":/g, '<span class="preview-key">"$1"</span>:')
                   .replace(/: "([^"]+)"/g, ': <span class="preview-string">"$1"</span>')
                   .replace(/: (\d+\.?\d*)/g, ': <span class="preview-number">$1</span>')
                   .replace(/: (true|false)/g, ': <span class="preview-number">$1</span>')
                   .replace(/: (null)/g, ': <span class="preview-number">$1</span>');
    },

    handleConfirmImport() {
        if (!this.currentData) {
            this.showToast('请先选择或输入有效的JSON数据', 'warning');
            return;
        }

        const validation = this.validateData(this.currentData);
        if (!validation.valid) {
            this.showToast(validation.message, 'error');
            return;
        }

        try {
            if (validation.type === 'config') {
                this.importConfig(this.currentData);
            } else {
                this.importData(this.currentData);
            }
            
            this.hide();
            this.showToast('数据导入成功！', 'success');
        } catch (e) {
            this.showToast('导入失败: ' + e.message, 'error');
        }
    },

    importConfig(config) {
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
            const select = document.getElementById('dataSourceSelect');
            if (select) select.value = config.dataSource;
        }

        if (config.appState) {
            Object.keys(config.appState).forEach(key => {
                StateManager.set(key, config.appState[key]);
            });
        }

        App.refreshAll();
    },

    importData(data) {
        if (data.kpi) {
            DataStore.defaultData.kpi = data.kpi;
        }
        if (data.lineChart) {
            DataStore.defaultData.lineChart = data.lineChart;
        }
        if (data.barChart) {
            DataStore.defaultData.barChart = data.barChart;
        }
        if (data.pieChart) {
            DataStore.defaultData.pieChart = data.pieChart;
        }
        if (data.areaChart) {
            DataStore.defaultData.areaChart = data.areaChart;
        }
        if (data.funnelChart) {
            DataStore.defaultData.funnelChart = data.funnelChart;
        }

        const currentSource = DataStore.getCurrentSource();
        if (currentSource === 'default') {
            DataStore.notifyListeners();
        } else {
            DataStore.setSource('default');
            const select = document.getElementById('dataSourceSelect');
            if (select) select.value = 'default';
        }

        App.refreshAll();
    },

    downloadTemplate() {
        const template = {
            _comment: '数据导入模板 - 根据需要修改或删除不需要的字段',
            kpi: [
                {
                    id: 'kpi_1',
                    title: '自定义指标1',
                    value: 100000,
                    change: 5.2,
                    changeType: 'positive',
                    icon: '📊',
                    trend: [5000, 6000, 5500, 7000, 8000, 7500, 8500, 9000, 8800, 9200, 9500, 100000]
                }
            ],
            lineChart: {
                title: '趋势分析',
                labels: ['1月', '2月', '3月'],
                datasets: [
                    { label: '数据系列1', data: [100, 150, 120], color: '#00f5ff' },
                    { label: '数据系列2', data: [80, 120, 140], color: '#8b5cf6' }
                ]
            },
            barChart: {
                title: '对比分析',
                labels: ['分类A', '分类B', '分类C'],
                datasets: [{
                    label: '数值',
                    data: [100, 200, 150],
                    colors: ['#00f5ff', '#8b5cf6', '#f472b6']
                }]
            },
            pieChart: {
                title: '占比分析',
                data: [
                    { label: '分类1', value: 40, color: '#00f5ff' },
                    { label: '分类2', value: 35, color: '#8b5cf6' },
                    { label: '分类3', value: 25, color: '#f472b6' }
                ]
            },
            areaChart: {
                title: '面积趋势',
                labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                datasets: [{
                    label: '系列',
                    data: [50, 80, 120, 200],
                    color: '#00f5ff'
                }]
            },
            funnelChart: {
                title: '转化漏斗',
                stages: [
                    { name: '阶段1', value: 10000, rate: 100 },
                    { name: '阶段2', value: 6000, rate: 60 },
                    { name: '阶段3', value: 3000, rate: 50 },
                    { name: '阶段4', value: 1000, rate: 33.3 }
                ]
            }
        };

        const jsonStr = JSON.stringify(template, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'dashboard_data_template.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.showToast('模板已下载', 'success');
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

window.ImportService = ImportService;
