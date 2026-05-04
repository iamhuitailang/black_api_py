/**
 * 流程图编辑器主应用
 * 整合所有模块，初始化并运行应用
 */

const FlowchartEditor = {
    /**
     * 初始化应用
     */
    init: function() {
        console.log('流程图编辑器初始化中...');

        // 检查浏览器兼容性
        const compatibilityIssues = UIManager.checkCompatibility();
        if (compatibilityIssues.length > 0) {
            UIManager.showCompatibilityWarning(compatibilityIssues);
        }

        // 初始化各个模块
        NodeManager.init();
        ConnectionManager.init();

        // 加载保存的数据
        this.loadSavedData();

        // 初始化画布
        CanvasManager.init('mainCanvas');

        // 初始化 UI
        UIManager.init();

        // 初始渲染
        CanvasManager.render();

        // 监听窗口关闭前保存
        window.addEventListener('beforeunload', () => {
            CanvasManager.saveState();
        });

        console.log('流程图编辑器初始化完成！');
    },

    /**
     * 加载保存的数据
     */
    loadSavedData: function() {
        const savedData = Storage.load();
        
        if (savedData) {
            console.log('检测到保存的数据，正在加载...');

            // 加载节点
            if (savedData.nodes && Array.isArray(savedData.nodes)) {
                NodeManager.setNodes(savedData.nodes);
            }

            // 加载连线
            if (savedData.connections && Array.isArray(savedData.connections)) {
                ConnectionManager.setConnections(savedData.connections);
            }

            console.log('数据加载完成！');
        } else {
            console.log('未找到保存的数据，使用空画布');
        }
    },

    /**
     * 导出应用数据（供外部调用）
     */
    exportData: function() {
        return CanvasManager.exportData();
    },

    /**
     * 导入数据（供外部调用）
     */
    importData: function(data) {
        return CanvasManager.importData(data);
    },

    /**
     * 清空画布（供外部调用）
     */
    clear: function() {
        if (confirm('确定要清空画布吗？')) {
            CanvasManager.clearCanvas();
        }
    },

    /**
     * 导出为 PNG（供外部调用）
     */
    exportPNG: function(filename) {
        ExportManager.exportAsPNG(filename);
    },

    /**
     * 保存为 JSON（供外部调用）
     */
    saveJSON: function() {
        ExportManager.saveAsJSON();
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    FlowchartEditor.init();
});

// 暴露到全局
window.FlowchartEditor = FlowchartEditor;