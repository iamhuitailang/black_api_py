(function () {
  var appInitialized = false;

  function init() {
    if (appInitialized) return;
    appInitialized = true;

    try {
      var room = Storage.getRoom();
      var initialWoods = Storage.getWoods();

      if (!Array.isArray(initialWoods)) {
        initialWoods = [];
      }

      Timer.init(
        initialWoods,
        onTimerUpdate,
        onWoodComplete
      );

      CanvasRenderer.init(onWoodClick);
      CanvasRenderer.updateWoods(Timer.getWoods());

      UI.init({
        onAddWood: handleAddWood,
        onLightWood: handleLightWood,
        onBoostWood: handleBoostWood,
        onDeleteWood: handleDeleteWood,
        onCreateRoom: handleCreateRoom,
        onJoinRoom: handleJoinRoom,
        onRoomNameChange: handleRoomNameChange
      });

      UI.updateActiveCount(Timer.getActiveCount());

      window.addEventListener('beforeunload', function () {
        try {
          Timer.forceSave();
          CanvasRenderer.forceSaveAnimationState();
        } catch (e) {
          console.warn('Failed to save on unload:', e);
        }
      });

      document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
          try {
            Timer.forceSave();
            CanvasRenderer.forceSaveAnimationState();
          } catch (e) {
            console.warn('Failed to save on visibility change:', e);
          }
        }
      });

      window.addEventListener('pagehide', function () {
        try {
          Timer.forceSave();
          CanvasRenderer.forceSaveAnimationState();
        } catch (e) {
          console.warn('Failed to save on pagehide:', e);
        }
      });

    } catch (e) {
      console.error('Failed to initialize app:', e);
    }
  }

  function onTimerUpdate(woods) {
    try {
      CanvasRenderer.updateWoods(woods);
      UI.updateActiveCount(Timer.getActiveCount());
    } catch (e) {
      console.warn('Timer update error:', e);
    }
  }

  function onWoodComplete(wood) {
    try {
      UI.showToast('✨ 任务完成：' + wood.task);
      UI.showCelebration(wood.task);

      if (wood.position) {
        CanvasRenderer.celebrateAt(wood.position.x, wood.position.y);
      }
    } catch (e) {
      console.warn('Wood complete error:', e);
    }
  }

  function onWoodClick(wood, position) {
    try {
      UI.showWoodPopup(wood);
    } catch (e) {
      console.warn('Wood click error:', e);
    }
  }

  function handleAddWood(wood) {
    try {
      Timer.addWood(wood);
      CanvasRenderer.updateWoods(Timer.getWoods());
      UI.updateActiveCount(Timer.getActiveCount());
    } catch (e) {
      console.warn('Add wood error:', e);
      UI.showToast('添加木柴失败');
    }
  }

  function handleLightWood(woodId) {
    try {
      var wood = Timer.lightWood(woodId);
      if (wood) {
        CanvasRenderer.updateWoods(Timer.getWoods());
        UI.updateActiveCount(Timer.getActiveCount());
        UI.showToast('🔥 开始燃烧：' + wood.task);

        if (wood.position) {
          CanvasRenderer.celebrateAt(wood.position.x, wood.position.y);
        }
      }
    } catch (e) {
      console.warn('Light wood error:', e);
      UI.showToast('点燃木柴失败');
    }
  }

  function handleBoostWood(woodId) {
    try {
      var wood = Timer.boostWood(woodId);
      if (wood) {
        CanvasRenderer.updateWoods(Timer.getWoods());
        UI.updateWoodPopup(wood);
        UI.showToast('👏 添柴成功！时间增加5%');
      }
    } catch (e) {
      console.warn('Boost wood error:', e);
      UI.showToast('添柴失败');
    }
  }

  function handleDeleteWood(woodId) {
    try {
      Timer.removeWood(woodId);
      CanvasRenderer.updateWoods(Timer.getWoods());
      UI.updateActiveCount(Timer.getActiveCount());
      UI.showToast('木柴已移除');
    } catch (e) {
      console.warn('Delete wood error:', e);
      UI.showToast('删除失败');
    }
  }

  function handleCreateRoom(name) {
    try {
      var room = Storage.createNewRoom(name);
      Timer.setWoods([]);
      CanvasRenderer.updateWoods([]);
      UI.updateRoomInfo();
      UI.updateActiveCount(0);
      UI.showToast('新篝火已点燃！🔥');
    } catch (e) {
      console.warn('Create room error:', e);
      UI.showToast('创建房间失败');
    }
  }

  function handleJoinRoom(roomId) {
    try {
      var room = Storage.joinRoom(roomId);
      CanvasRenderer.updateWoods(Timer.getWoods());
      UI.updateRoomInfo();
      UI.updateActiveCount(Timer.getActiveCount());
      UI.showToast('已加入房间：' + roomId);
    } catch (e) {
      console.warn('Join room error:', e);
      UI.showToast('加入房间失败');
    }
  }

  function handleRoomNameChange(name) {
    try {
      var room = Storage.getRoom();
      room.name = name;
      Storage.saveRoom(room);
      UI.updateRoomInfo();
    } catch (e) {
      console.warn('Room name change error:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
