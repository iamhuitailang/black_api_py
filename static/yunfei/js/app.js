const App = {
    init() {
        console.log('🚀 快递运费计算器启动中...');
        
        UI.init();
        
        console.log('✅ 快递运费计算器已启动！');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});