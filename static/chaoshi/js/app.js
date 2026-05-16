let game;

document.addEventListener('DOMContentLoaded', () => {
    console.log('页面加载，先清除所有存档!');
    Storage.clearState();
    
    game = new Game();
    
    console.log('🛒 超市抢购王 已加载完成！');
    console.log('📖 操作说明：');
    console.log('   ← → / A D : 移动');
    console.log('   ↑ / W : 跳跃');
    console.log('   ↓ / S : 下蹲');
    console.log('   空格 : 拾取（配合方向键使用技能）');
    console.log('   ESC : 暂停');
    console.log('');
    console.log('⚡ 技能出招表：');
    console.log('   连按两次方向键 : 冲刺');
    console.log('   ↓→↓ + 空格 : 购物车（大范围拾取）');
    console.log('   ↑↓↑ + 空格 : 护盾（免疫抓捕）');
});

window.addEventListener('beforeunload', () => {
    if (game && game.isRunning && !game.isGameOver) {
        console.log('页面关闭，不保存存档');
    }
});