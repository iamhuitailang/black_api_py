const App = {
    init: function() {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('街头热血篮球 - 游戏初始化中...');
            
            try {
                Game.init();
                console.log('游戏初始化成功！');
                console.log('操作说明:');
                console.log('  - 鼠标拖动瞄准，向后拉蓄力，向前推投篮');
                console.log('  - 空格键释放必中技能（需攒满能量）');
                console.log('  - 空心入网获得额外加分和时间奖励');
                console.log('  - 连续命中获得连击加成');
            } catch (error) {
                console.error('游戏初始化失败:', error);
            }
        });
    }
};

App.init();
