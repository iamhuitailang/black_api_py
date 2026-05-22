const App = {
  init() {
    Game.init();
    this.bindGlobalEvents();
  },

  bindGlobalEvents() {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        Game.pause();
      }
      
      if (e.code === 'Enter' && Game.state === GameData.GAME_STATE.ACTION_SELECT) {
        if (Game.selectedAction) {
          Game.startDive();
        }
      }
    });

    window.addEventListener('beforeunload', () => {
      if (Competition && Competition.currentRound && Competition.currentRound <= GameData.TOTAL_ROUNDS) {
        Competition.saveState();
        console.log('[App] 页面关闭前保存状态');
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && Game.state === GameData.GAME_STATE.DIVING) {
        Game.pause();
      }
    });

    let touchStartX = 0;
    let touchStartY = 0;
    
    const actionSelect = document.getElementById('action-select');
    if (actionSelect) {
      actionSelect.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      actionSelect.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        if (Math.abs(deltaY) > 50 && Math.abs(deltaY) > Math.abs(deltaX)) {
          const actionButtons = document.querySelectorAll('.action-btn');
          let currentIndex = -1;
          
          actionButtons.forEach((btn, index) => {
            if (btn.classList.contains('selected')) {
              currentIndex = index;
            }
          });
          
          if (deltaY > 0 && currentIndex > 0) {
            currentIndex--;
          } else if (deltaY < 0 && currentIndex < actionButtons.length - 1) {
            currentIndex++;
          }
          
          if (currentIndex >= 0 && currentIndex < actionButtons.length) {
            actionButtons[currentIndex].click();
          }
        }
      }, { passive: true });
    }
  }
};

window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
