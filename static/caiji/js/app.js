import { Game } from './game.js';

window.addEventListener('load', () => {
    console.log('📄 页面完全加载完成！');
    
    const canvas = document.getElementById('game-canvas');
    console.log('🎨 Canvas元素:', canvas);
    
    const startBtn = document.getElementById('start-btn');
    console.log('🔘 开始按钮:', startBtn);
    
    const selectCharBtn = document.getElementById('select-char-btn');
    console.log('🔘 选择角色按钮:', selectCharBtn);
    
    if (startBtn) {
        startBtn.style.backgroundColor = '#FF0000';
        setTimeout(() => {
            startBtn.style.backgroundColor = '';
        }, 500);
        console.log('✅ 开始按钮闪烁测试完成');
    }
    
    const game = new Game(canvas);
    window.game = game;
    
    console.log('🐔 菜鸡互啄游戏已加载！');
    console.log('操作说明：');
    console.log('  - 方向键/WASD：移动');
    console.log('  - J：轻啄');
    console.log('  - K：重啄');
    console.log('  - U：轻拍');
    console.log('  - I：重拍');
    console.log('  - 方向键 + 攻击：必杀技');
    console.log('  - ESC：暂停/继续');
    console.log('💡 提示：打开控制台(F12)查看调试信息');
});