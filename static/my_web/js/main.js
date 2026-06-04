(function() {
  'use strict';

  window.addEventListener('DOMContentLoaded', function() {
    console.log('🌌 星际贸易商启动中...');

    try {
      const gameState = GameController.init();
      UIController.init(gameState);

      console.log('✅ 游戏初始化完成');
      console.log('📍 当前位置:', gameState.getCurrentSystem()?.name);
      console.log('💰 初始资金:', Helpers.formatCredits(gameState.player.credits));

      if (StorageService.hasSave()) {
        console.log('📂 已读取存档');
      } else {
        console.log('🎮 新游戏开始');
      }
    } catch (error) {
      console.error('❌ 游戏初始化失败:', error);
      
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #1a1410;
        color: #ef4444;
        padding: 30px 50px;
        border-radius: 8px;
        border: 2px solid #ef4444;
        font-family: monospace;
        z-index: 9999;
        text-align: center;
      `;
      errorDiv.innerHTML = `
        <h2>❌ 游戏启动失败</h2>
        <p>${error.message}</p>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 10px;">
          ${error.stack?.split('\n')[0] || ''}
        </p>
        <button onclick="location.reload()" style="
          margin-top: 20px;
          padding: 10px 20px;
          background: #b45309;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        ">重新加载</button>
      `;
      document.body.appendChild(errorDiv);
    }
  });

  window.addEventListener('error', function(e) {
    console.error('🌐 全局错误:', e.error || e.message);
  });

  window.addEventListener('unload', function() {
    if (typeof GameController !== 'undefined') {
      GameController.destroy();
    }
    if (typeof UIController !== 'undefined') {
      UIController.destroy();
    }
  });
})();
