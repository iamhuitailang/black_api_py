var UI = (function () {
  var selectedWoodType = 'pine';
  var selectedDuration = 15;
  var currentWood = null;
  var callbacks = {};

  function init(cb) {
    callbacks = cb || {};
    bindEvents();
    updateRoomInfo();
  }

  function bindEvents() {
    document.getElementById('add-wood-btn').addEventListener('click', showFireModal);
    document.getElementById('cancel-wood').addEventListener('click', hideFireModal);
    document.getElementById('confirm-wood').addEventListener('click', confirmAddWood);

    var woodTypes = document.querySelectorAll('.wood-type');
    woodTypes.forEach(function (el) {
      el.addEventListener('click', function () {
        woodTypes.forEach(function (t) { t.classList.remove('selected'); });
        el.classList.add('selected');
        selectedWoodType = el.dataset.type;
      });
    });

    var durBtns = document.querySelectorAll('.dur-btn');
    durBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        durBtns.forEach(function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        selectedDuration = parseInt(btn.dataset.min);
      });
    });

    document.getElementById('room-btn').addEventListener('click', showRoomModal);
    document.getElementById('close-room-modal').addEventListener('click', hideRoomModal);
    document.getElementById('new-room-btn').addEventListener('click', createNewRoom);
    document.getElementById('copy-room-id').addEventListener('click', copyRoomId);
    document.getElementById('join-room-btn').addEventListener('click', joinRoom);

    document.getElementById('room-name-input').addEventListener('input', function (e) {
      var name = e.target.value.trim();
      if (name && callbacks.onRoomNameChange) {
        callbacks.onRoomNameChange(name);
      }
    });

    document.getElementById('close-celebration').addEventListener('click', hideCelebration);

    document.getElementById('popup-light').addEventListener('click', function () {
      if (currentWood && callbacks.onLightWood) {
        callbacks.onLightWood(currentWood.id);
        hideWoodPopup();
      }
    });

    document.getElementById('popup-boost-btn').addEventListener('click', function () {
      if (currentWood && callbacks.onBoostWood) {
        callbacks.onBoostWood(currentWood.id);
      }
    });

    document.getElementById('popup-delete').addEventListener('click', function () {
      if (currentWood && callbacks.onDeleteWood) {
        if (confirm('确定要删除这根木柴吗？')) {
          callbacks.onDeleteWood(currentWood.id);
          hideWoodPopup();
        }
      }
    });

    document.getElementById('wood-popup').addEventListener('click', function (e) {
      if (e.target.id === 'wood-popup') {
        hideWoodPopup();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        hideAllModals();
      }
    });
  }

  function showFireModal() {
    document.getElementById('task-name').value = '';
    document.getElementById('fire-modal').classList.remove('hidden');
    setTimeout(function () {
      document.getElementById('task-name').focus();
    }, 100);
  }

  function hideFireModal() {
    document.getElementById('fire-modal').classList.add('hidden');
  }

  function confirmAddWood() {
    var taskName = document.getElementById('task-name').value.trim();
    if (!taskName) {
      showToast('请输入任务名称');
      return;
    }

    var wood = Wood.create(taskName, selectedWoodType, selectedDuration);
    if (callbacks.onAddWood) {
      callbacks.onAddWood(wood);
    }
    hideFireModal();
    showToast('木柴已添加，点击点燃它吧！🔥');
  }

  function showRoomModal() {
    var room = Storage.getRoom();
    document.getElementById('room-name-input').value = room.name || '';
    document.getElementById('room-id-display-text').textContent = room.id || '--';
    document.getElementById('join-room-id').value = '';
    document.getElementById('room-modal').classList.remove('hidden');
  }

  function hideRoomModal() {
    document.getElementById('room-modal').classList.add('hidden');
  }

  function createNewRoom() {
    var name = document.getElementById('room-name-input').value.trim() || '我的篝火';
    if (callbacks.onCreateRoom) {
      callbacks.onCreateRoom(name);
    }
    hideRoomModal();
    showToast('新篝火已点燃！🔥');
  }

  function copyRoomId() {
    var roomId = document.getElementById('room-id-display-text').textContent;
    if (roomId && roomId !== '--') {
      var textarea = document.createElement('textarea');
      textarea.value = roomId;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        showToast('房间ID已复制：' + roomId);
      } catch (e) {
        showToast('复制失败，请手动复制');
      }
      document.body.removeChild(textarea);
    }
  }

  function joinRoom() {
    var roomId = document.getElementById('join-room-id').value.trim().toUpperCase();
    if (!roomId) {
      showToast('请输入房间ID');
      return;
    }
    if (callbacks.onJoinRoom) {
      callbacks.onJoinRoom(roomId);
    }
    hideRoomModal();
  }

  function updateRoomInfo() {
    var room = Storage.getRoom();
    document.getElementById('room-name').textContent = room.name || '我的篝火';
  }

  function updateActiveCount(count) {
    document.getElementById('active-count').textContent = count;
  }

  function showWoodPopup(wood) {
    currentWood = wood;
    document.getElementById('popup-task-name').textContent = wood.task;

    var statusText = '未点燃';
    if (wood.status === Wood.STATUS.BURNING) {
      statusText = '🔥 燃烧中';
    } else if (wood.status === Wood.STATUS.COMPLETED) {
      statusText = '✓ 已完成';
    }
    document.getElementById('popup-status').textContent = statusText;

    if (wood.status === Wood.STATUS.COMPLETED) {
      document.getElementById('popup-remaining').textContent = '任务完成';
    } else {
      document.getElementById('popup-remaining').textContent = Wood.formatTimeShort(Wood.getRemainingTime(wood));
    }

    document.getElementById('popup-boost').textContent = wood.boostCount + ' 次';

    var lightBtn = document.getElementById('popup-light');
    var boostBtn = document.getElementById('popup-boost-btn');

    if (wood.status === Wood.STATUS.PENDING) {
      lightBtn.style.display = '';
      lightBtn.textContent = '🔥 点燃';
      boostBtn.style.display = 'none';
    } else if (wood.status === Wood.STATUS.BURNING) {
      lightBtn.style.display = 'none';
      boostBtn.style.display = '';
    } else {
      lightBtn.style.display = 'none';
      boostBtn.style.display = 'none';
    }

    document.getElementById('wood-popup').classList.remove('hidden');
  }

  function updateWoodPopup(wood) {
    if (!currentWood || currentWood.id !== wood.id) return;

    currentWood = wood;
    document.getElementById('popup-status').textContent = '🔥 燃烧中';
    document.getElementById('popup-remaining').textContent = Wood.formatTimeShort(Wood.getRemainingTime(wood));
    document.getElementById('popup-boost').textContent = wood.boostCount + ' 次';

    document.getElementById('popup-light').style.display = 'none';
    document.getElementById('popup-boost-btn').style.display = '';
  }

  function hideWoodPopup() {
    currentWood = null;
    document.getElementById('wood-popup').classList.add('hidden');
  }

  function showCelebration(task) {
    document.getElementById('celebration-task').textContent = '「' + task + '」已完成！';
    document.getElementById('celebration').classList.remove('hidden');
  }

  function hideCelebration() {
    document.getElementById('celebration').classList.add('hidden');
  }

  function showToast(message) {
    var toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(function () {
      toast.classList.add('hidden');
    }, 2000);
  }

  function hideAllModals() {
    hideFireModal();
    hideRoomModal();
    hideWoodPopup();
    hideCelebration();
  }

  return {
    init: init,
    showFireModal: showFireModal,
    hideFireModal: hideFireModal,
    showRoomModal: showRoomModal,
    hideRoomModal: hideRoomModal,
    showWoodPopup: showWoodPopup,
    updateWoodPopup: updateWoodPopup,
    hideWoodPopup: hideWoodPopup,
    showCelebration: showCelebration,
    hideCelebration: hideCelebration,
    showToast: showToast,
    updateRoomInfo: updateRoomInfo,
    updateActiveCount: updateActiveCount
  };
})();
