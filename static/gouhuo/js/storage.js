var Storage = (function () {
  var KEY_PREFIX = 'gouhuo_';
  var KEYS = {
    ROOM: KEY_PREFIX + 'room',
    WOODS: KEY_PREFIX + 'woods',
    SETTINGS: KEY_PREFIX + 'settings',
    HISTORY: KEY_PREFIX + 'history'
  };

  function get(key) {
    try {
      var data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('Storage get error:', e);
      return null;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('Storage set error:', e);
      return false;
    }
  }

  function remove(key) {
    localStorage.removeItem(key);
  }

  function getRoom() {
    var room = get(KEYS.ROOM);
    if (!room) {
      room = {
        id: generateRoomId(),
        name: '我的篝火',
        createdAt: Date.now()
      };
      set(KEYS.ROOM, room);
    }
    return room;
  }

  function saveRoom(room) {
    set(KEYS.ROOM, room);
  }

  function createNewRoom(name) {
    var room = {
      id: generateRoomId(),
      name: name || '我的篝火',
      createdAt: Date.now()
    };
    set(KEYS.ROOM, room);
    set(KEYS.WOODS, []);
    return room;
  }

  function joinRoom(roomId, roomName) {
    var room = {
      id: roomId,
      name: roomName || '篝火 ' + roomId.substr(0, 4),
      joinedAt: Date.now()
    };
    set(KEYS.ROOM, room);
    return room;
  }

  function getWoods() {
    var woods = get(KEYS.WOODS);
    return woods || [];
  }

  function saveWoods(woods) {
    set(KEYS.WOODS, woods);
  }

  function addWood(wood) {
    var woods = getWoods();
    woods.push(wood);
    saveWoods(woods);
    return woods;
  }

  function updateWood(woodId, updates) {
    var woods = getWoods();
    var index = woods.findIndex(function (w) { return w.id === woodId; });
    if (index !== -1) {
      woods[index] = Object.assign({}, woods[index], updates);
      saveWoods(woods);
      return woods[index];
    }
    return null;
  }

  function removeWood(woodId) {
    var woods = getWoods();
    woods = woods.filter(function (w) { return w.id !== woodId; });
    saveWoods(woods);
    return woods;
  }

  function getHistory() {
    var history = get(KEYS.HISTORY);
    return history || [];
  }

  function addToHistory(wood) {
    var history = getHistory();
    history.unshift({
      id: wood.id,
      task: wood.task,
      woodType: wood.woodType,
      duration: wood.duration,
      completedAt: Date.now(),
      boosted: wood.boostCount || 0
    });
    if (history.length > 50) {
      history = history.slice(0, 50);
    }
    set(KEYS.HISTORY, history);
  }

  function generateRoomId() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var result = '';
    for (var i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  function generateWoodId() {
    return 'w_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  }

  return {
    KEYS: KEYS,
    getRoom: getRoom,
    saveRoom: saveRoom,
    createNewRoom: createNewRoom,
    joinRoom: joinRoom,
    getWoods: getWoods,
    saveWoods: saveWoods,
    addWood: addWood,
    updateWood: updateWood,
    removeWood: removeWood,
    getHistory: getHistory,
    addToHistory: addToHistory,
    generateWoodId: generateWoodId
  };
})();
