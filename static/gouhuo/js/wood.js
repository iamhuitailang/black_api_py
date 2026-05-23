var Wood = (function () {
  var STATUS = {
    PENDING: 'pending',
    BURNING: 'burning',
    COMPLETED: 'completed'
  };

  var WOOD_TYPES = {
    pine: {
      name: '松木',
      icon: '🌲',
      multiplier: 1.0,
      baseColor: '#8B4513',
      burnColor: '#FF6B35',
      emberColor: '#FF4500',
      ashColor: '#2F2F2F',
      flameColor: '#FF8C32',
      particleColor: '#FFA500'
    },
    oak: {
      name: '橡木',
      icon: '🌳',
      multiplier: 1.2,
      baseColor: '#6B4423',
      burnColor: '#D2691E',
      emberColor: '#FF4500',
      ashColor: '#3D3D3D',
      flameColor: '#FF7F24',
      particleColor: '#FF8C00'
    },
    cherry: {
      name: '樱桃木',
      icon: '🌸',
      multiplier: 1.0,
      baseColor: '#9B3B3B',
      burnColor: '#FF69B4',
      emberColor: '#FF1493',
      ashColor: '#4A2020',
      flameColor: '#FF69B4',
      particleColor: '#FFB6C1'
    },
    magic: {
      name: '魔法蓝焰',
      icon: '🔮',
      multiplier: 1.0,
      baseColor: '#4B0082',
      burnColor: '#00BFFF',
      emberColor: '#1E90FF',
      ashColor: '#1A1A3E',
      flameColor: '#00BFFF',
      particleColor: '#87CEEB'
    }
  };

  function create(task, woodType, durationMinutes) {
    var type = WOOD_TYPES[woodType] || WOOD_TYPES.pine;
    var actualDuration = Math.floor(durationMinutes * 60 * 1000 * type.multiplier);

    return {
      id: Storage.generateWoodId(),
      task: task || '未命名任务',
      woodType: woodType || 'pine',
      duration: actualDuration,
      remaining: actualDuration,
      elapsed: 0,
      status: STATUS.PENDING,
      startTime: null,
      lastTick: null,
      boostCount: 0,
      createdAt: Date.now(),
      position: null
    };
  }

  function getTypeConfig(woodType) {
    return WOOD_TYPES[woodType] || WOOD_TYPES.pine;
  }

  function getBurnProgress(wood) {
    if (wood.duration <= 0) return 1;
    return Math.min(1, wood.elapsed / wood.duration);
  }

  function getRemainingTime(wood) {
    return Math.max(0, wood.duration - wood.elapsed);
  }

  function formatTime(ms) {
    if (ms <= 0) return '00:00';
    var totalSeconds = Math.ceil(ms / 1000);
    var hours = Math.floor(totalSeconds / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;

    if (hours > 0) {
      return hours + ':' +
        (minutes < 10 ? '0' : '') + minutes + ':' +
        (seconds < 10 ? '0' : '') + seconds;
    }
    return (minutes < 10 ? '0' : '') + minutes + ':' +
      (seconds < 10 ? '0' : '') + seconds;
  }

  function formatTimeShort(ms) {
    if (ms <= 0) return '已完成';
    var totalSeconds = Math.ceil(ms / 1000);
    var hours = Math.floor(totalSeconds / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;

    if (hours > 0) {
      return hours + '时' + minutes + '分';
    }
    if (minutes > 0) {
      return minutes + '分' + seconds + '秒';
    }
    return seconds + '秒';
  }

  function boost(wood) {
    var boostAmount = Math.floor(wood.duration * 0.05);
    wood.duration += boostAmount;
    wood.boostCount++;
    return wood;
  }

  return {
    STATUS: STATUS,
    TYPES: WOOD_TYPES,
    create: create,
    getTypeConfig: getTypeConfig,
    getBurnProgress: getBurnProgress,
    getRemainingTime: getRemainingTime,
    formatTime: formatTime,
    formatTimeShort: formatTimeShort,
    boost: boost
  };
})();
