console.log('=== 超市抢购王调试模式 ===');

function debugGame() {
    console.log('1. 检查localStorage:');
    const rawData = localStorage.getItem('chaoshi_game_state');
    console.log('   原始数据:', rawData);
    
    if (rawData) {
        try {
            const data = JSON.parse(rawData);
            console.log('   解析后:', data);
            console.log('   timeRemaining类型:', typeof data.timeRemaining, '值:', data.timeRemaining);
        } catch(e) {
            console.log('   解析失败!', e);
        }
    } else {
        console.log('   没有存档');
    }
    
    console.log('2. 检查常量:');
    console.log('   GAME_DURATION:', CONSTANTS.GAME_DURATION);
    console.log('   类型:', typeof CONSTANTS.GAME_DURATION);
}

function forceClearSave() {
    console.log('强制清空存档...');
    localStorage.removeItem('chaoshi_game_state');
    console.log('存档已清空!');
}

window.addEventListener('load', () => {
    console.log('页面加载完成!');
    debugGame();
    
    console.log('3秒后自动清空坏存档...');
    setTimeout(() => {
        const raw = localStorage.getItem('chaoshi_game_state');
        if (raw) {
            try {
                const data = JSON.parse(raw);
                if (data.timeRemaining < 10 || isNaN(data.timeRemaining)) {
                    console.log('检测到坏存档，自动清空!');
                    forceClearSave();
                }
            } catch(e) {
                forceClearSave();
            }
        }
    }, 3000);
});