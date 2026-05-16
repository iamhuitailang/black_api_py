document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);
    
    console.log('🐱 猫猫拆家大战已加载完成！');
    console.log('📖 操作说明：');
    console.log('   ← → 或 A D：左右移动');
    console.log('   ↑ 或 W：跳跃');
    console.log('   ↓ 或 S：趴下躲藏');
    console.log('   Z：抓挠');
    console.log('   X：推倒');
    console.log('   C：啃咬');
    console.log('   V：必杀技');
    console.log('   ESC：暂停游戏');
    console.log('💾 游戏自动保存，刷新页面状态不丢失！');
});