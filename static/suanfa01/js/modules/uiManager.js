/**
 * UI 管理模块
 * 负责界面交互、按钮事件等
 */

const UIManager = {
    /**
     * 初始化 UI
     */
    init: function() {
        this.setupToolbarEvents();
        this.setupSettingsEvents();
    },

    /**
     * 设置工具栏事件
     */
    setupToolbarEvents: function() {
        // 导出 PNG
        const exportPngBtn = document.getElementById('exportPngBtn');
        if (exportPngBtn) {
            exportPngBtn.addEventListener('click', () => {
                ExportManager.exportAsPNG();
            });
        }

        // 保存 JSON
        const saveJsonBtn = document.getElementById('saveJsonBtn');
        if (saveJsonBtn) {
            saveJsonBtn.addEventListener('click', () => {
                ExportManager.saveAsJSON();
            });
        }

        // 加载 JSON
        const loadJsonBtn = document.getElementById('loadJsonBtn');
        const fileInput = document.getElementById('fileInput');
        
        if (loadJsonBtn && fileInput) {
            loadJsonBtn.addEventListener('click', () => {
                fileInput.click();
            });

            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    ExportManager.loadFromJSON(file);
                }
                fileInput.value = '';
            });
        }

        // 清空画布
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('确定要清空画布吗？此操作不可撤销。')) {
                    CanvasManager.clearCanvas();
                    this.showToast('画布已清空', 'info');
                }
            });
        }
    },

    /**
     * 设置设置面板事件
     */
    setupSettingsEvents: function() {
        // 网格对齐
        const gridSnap = document.getElementById('gridSnap');
        if (gridSnap) {
            gridSnap.addEventListener('change', (e) => {
                CanvasManager.state.gridSnap = e.target.checked;
                CanvasManager.saveState();
            });
        }

        // 显示网格
        const showGrid = document.getElementById('showGrid');
        if (showGrid) {
            showGrid.addEventListener('change', (e) => {
                CanvasManager.state.showGrid = e.target.checked;
                CanvasManager.render();
                CanvasManager.saveState();
            });
        }

        // 缩放按钮
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');

        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                const newScale = Utils.clamp(CanvasManager.state.scale * 1.2, 0.1, 3);
                CanvasManager.state.scale = newScale;
                CanvasManager.updateZoomUI();
                CanvasManager.render();
                CanvasManager.saveState();
            });
        }

        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                const newScale = Utils.clamp(CanvasManager.state.scale / 1.2, 0.1, 3);
                CanvasManager.state.scale = newScale;
                CanvasManager.updateZoomUI();
                CanvasManager.render();
                CanvasManager.saveState();
            });
        }
    },

    /**
     * 显示提示信息
     */
    showToast: function(message, type = 'info') {
        ExportManager.showToast(message, type);
    },

    /**
     * 检查浏览器兼容性
     */
    checkCompatibility: function() {
        const issues = [];

        // 检查 Canvas 支持
        const canvas = document.createElement('canvas');
        if (!canvas.getContext || !canvas.getContext('2d')) {
            issues.push('您的浏览器不支持 Canvas，无法使用此应用');
        }

        // 检查 localStorage 支持
        if (!Storage.isSupported()) {
            issues.push('您的浏览器不支持 localStorage，数据将无法保存');
        }

        // 检查 File API 支持
        if (!window.FileReader) {
            issues.push('您的浏览器不支持 File API，无法加载 JSON 文件');
        }

        return issues;
    },

    /**
     * 显示兼容性警告
     */
    showCompatibilityWarning: function(issues) {
        if (issues.length > 0) {
            const warning = document.createElement('div');
            warning.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background-color: #fff3cd;
                color: #856404;
                padding: 12px 20px;
                z-index: 9999;
                border-bottom: 1px solid #ffeaa7;
                font-size: 14px;
            `;
            warning.innerHTML = `
                <strong>⚠️ 兼容性警告：</strong>
                ${issues.join('；')}
                <button style="margin-left: 15px; padding: 4px 12px; background: #ffeaa7; border: 1px solid #fdcb6e; border-radius: 4px; cursor: pointer;">关闭</button>
            `;

            document.body.appendChild(warning);

            warning.querySelector('button').addEventListener('click', () => {
                warning.remove();
            });
        }
    }
};

// 暴露到全局
window.UIManager = UIManager;