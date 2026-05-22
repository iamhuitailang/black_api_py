const Handoff = (function() {
  function getWindowResult(position, weather) {
    const dropChanceBonus = weather ? weather.dropChance : 0;

    if (position >= CONFIG.HANDOFF_PERFECT_MIN && position <= CONFIG.HANDOFF_PERFECT_MAX) {
      const dropRoll = Math.random();
      if (dropRoll < dropChanceBonus) {
        return { result: CONFIG.HANDOFF_RESULT.DROP, timePenalty: 1.0, score: 0 };
      }
      return { result: CONFIG.HANDOFF_RESULT.PERFECT, timePenalty: 0, score: 100 };
    }

    if (position >= CONFIG.HANDOFF_GOOD_MIN && position <= CONFIG.HANDOFF_GOOD_MAX) {
      const dropRoll = Math.random();
      if (dropRoll < dropChanceBonus * 0.5) {
        return { result: CONFIG.HANDOFF_RESULT.DROP, timePenalty: 1.0, score: 0 };
      }
      return { result: CONFIG.HANDOFF_RESULT.GOOD, timePenalty: 0.2, score: 50 };
    }

    if (position >= CONFIG.HANDOFF_ZONE_START && position <= CONFIG.HANDOFF_ZONE_END) {
      return { result: CONFIG.HANDOFF_RESULT.GOOD, timePenalty: 0.5, score: 25 };
    }

    return null;
  }

  function isInHandoffZone(position) {
    return position >= CONFIG.HANDOFF_ZONE_START && position <= CONFIG.HANDOFF_ZONE_END;
  }

  function isInPerfectZone(position) {
    return position >= CONFIG.HANDOFF_PERFECT_MIN && position <= CONFIG.HANDOFF_PERFECT_MAX;
  }

  function isInGoodZone(position) {
    return position >= CONFIG.HANDOFF_GOOD_MIN && position <= CONFIG.HANDOFF_GOOD_MAX;
  }

  function getResultText(result) {
    switch (result) {
      case CONFIG.HANDOFF_RESULT.PERFECT: return '完美交接!';
      case CONFIG.HANDOFF_RESULT.GOOD: return '良好交接';
      case CONFIG.HANDOFF_RESULT.DROP: return '掉棒!';
      default: return '';
    }
  }

  return { getWindowResult, isInHandoffZone, isInPerfectZone, isInGoodZone, getResultText };
})();