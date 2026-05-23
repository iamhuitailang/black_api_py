var Timer = (function () {
  var woods = [];
  var onUpdate = null;
  var onComplete = null;
  var intervalId = null;
  var lastUpdate = 0;
  var lastSaveTime = 0;

  function init(initialWoods, updateCallback, completeCallback) {
    woods = initialWoods ? JSON.parse(JSON.stringify(initialWoods)) : [];
    onUpdate = updateCallback;
    onComplete = completeCallback;
    lastUpdate = Date.now();

    validateAllWoods();
    syncWithRealTime();
    save();
    if (onUpdate) {
      onUpdate(woods);
    }
    start();
  }

  function validateAllWoods() {
    for (var i = 0; i < woods.length; i++) {
      var wood = woods[i];
      if (!wood.id) {
        wood.id = 'w_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      }
      if (!wood.status || (wood.status !== 'pending' && wood.status !== 'burning' && wood.status !== 'completed')) {
        wood.status = 'pending';
      }
      if (typeof wood.elapsed !== 'number' || wood.elapsed < 0) {
        wood.elapsed = 0;
      }
      if (typeof wood.duration !== 'number' || wood.duration <= 0) {
        wood.duration = 5 * 60 * 1000;
      }
      if (typeof wood.remaining !== 'number' || wood.remaining < 0) {
        wood.remaining = wood.duration;
      }
      if (wood.status === 'completed') {
        wood.elapsed = wood.duration;
        wood.lastTick = null;
      }
    }
  }

  function syncWithRealTime() {
    var now = Date.now();
    for (var i = 0; i < woods.length; i++) {
      var wood = woods[i];
      if (wood.status === 'burning') {
        if (wood.lastTick && wood.lastTick > 0) {
          var elapsed = now - wood.lastTick;
          if (elapsed > 0) {
            wood.elapsed = Math.min(wood.duration, (wood.elapsed || 0) + elapsed);
          }
        } else if (wood.startTime && wood.startTime > 0) {
          var elapsedFromStart = now - wood.startTime;
          if (elapsedFromStart > 0) {
            wood.elapsed = Math.min(wood.duration, elapsedFromStart);
          }
        }
        wood.lastTick = now;

        if (wood.elapsed >= wood.duration) {
          completeWood(wood);
        }
      }
    }
  }

  function start() {
    if (intervalId) return;
    intervalId = setInterval(tick, 100);
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function tick() {
    var now = Date.now();
    var dt = now - lastUpdate;
    lastUpdate = now;
    var changed = false;

    for (var i = 0; i < woods.length; i++) {
      var wood = woods[i];
      if (wood.status === 'burning') {
        wood.elapsed = Math.min(wood.duration, (wood.elapsed || 0) + dt);
        wood.remaining = Math.max(0, wood.duration - wood.elapsed);
        wood.lastTick = now;

        if (wood.elapsed >= wood.duration) {
          completeWood(wood);
        }
        changed = true;
      }
    }

    if (changed) {
      save();
      if (onUpdate) {
        onUpdate(woods);
      }
    }

    var now2 = Date.now();
    if (now2 - lastSaveTime > 500) {
      save();
      lastSaveTime = now2;
    }
  }

  function forceSave() {
    syncWithRealTime();
    save();
    if (onUpdate) {
      onUpdate(woods);
    }
  }

  function completeWood(wood) {
    wood.status = 'completed';
    wood.elapsed = wood.duration;
    wood.lastTick = null;

    try {
      Storage.addToHistory(wood);
    } catch (e) {
      console.warn('Failed to add to history:', e);
    }

    if (onComplete) {
      onComplete(wood);
    }
  }

  function lightWood(woodId) {
    var wood = findWood(woodId);
    if (wood && wood.status === 'pending') {
      wood.status = 'burning';
      wood.startTime = Date.now();
      wood.lastTick = Date.now();
      if (!wood.elapsed) {
        wood.elapsed = 0;
      }
      save();
      if (onUpdate) {
        onUpdate(woods);
      }
      return wood;
    }
    return null;
  }

  function addWood(wood) {
    woods.push(wood);
    save();
    if (onUpdate) {
      onUpdate(woods);
    }
    return woods;
  }

  function removeWood(woodId) {
    var index = woods.findIndex(function (w) { return w.id === woodId; });
    if (index !== -1) {
      woods.splice(index, 1);
      save();
      if (onUpdate) {
        onUpdate(woods);
      }
      return true;
    }
    return false;
  }

  function boostWood(woodId) {
    var wood = findWood(woodId);
    if (wood && wood.status === 'burning') {
      Wood.boost(wood);
      save();
      if (onUpdate) {
        onUpdate(woods);
      }
      return wood;
    }
    return null;
  }

  function findWood(woodId) {
    return woods.find(function (w) { return w.id === woodId; });
  }

  function getWoods() {
    return woods;
  }

  function setWoods(newWoods) {
    woods = newWoods ? JSON.parse(JSON.stringify(newWoods)) : [];
    save();
    if (onUpdate) {
      onUpdate(woods);
    }
  }

  function getActiveCount() {
    return woods.filter(function (w) { return w.status === 'burning'; }).length;
  }

  function save() {
    try {
      Storage.saveWoods(woods);
    } catch (e) {
      console.warn('Failed to save woods:', e);
    }
  }

  return {
    init: init,
    start: start,
    stop: stop,
    lightWood: lightWood,
    addWood: addWood,
    removeWood: removeWood,
    boostWood: boostWood,
    findWood: findWood,
    getWoods: getWoods,
    setWoods: setWoods,
    getActiveCount: getActiveCount,
    forceSave: forceSave
  };
})();
