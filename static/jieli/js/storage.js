const Storage = (function() {
  const KEY = CONFIG.STORAGE_KEY;

  function save(state) {
    try {
      const serializable = {
        gameState: state.gameState,
        mode: state.mode,
        weather: state.weather,
        playerTeam: state.playerTeam ? state.playerTeam.serialize() : null,
        opponentTeams: state.opponentTeams ? state.opponentTeams.map(t => t.serialize()) : [],
        currentLeg: state.currentLeg,
        totalTime: state.totalTime,
        handoffResults: state.handoffResults || [],
        rankings: state.rankings || [],
        score: state.score,
        finished: state.finished,
        countdownValue: state.countdownValue,
        handoffWindowActive: state.handoffWindowActive,
        handoffPressed: state.handoffPressed,
        tournamentRound: state.tournamentRound,
        tournamentMatches: state.tournamentMatches || [],
        playerAdvanced: state.playerAdvanced || false,
        lastSaveTime: Date.now()
      };
      localStorage.setItem(KEY, JSON.stringify(serializable));
      return true;
    } catch (e) {
      console.error('Save failed:', e);
      return false;
    }
  }

  function load() {
    try {
      const data = localStorage.getItem(KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch (e) {
      console.error('Load failed:', e);
      return null;
    }
  }

  function clear() {
    localStorage.removeItem(KEY);
  }

  function hasSavedState() {
    return localStorage.getItem(KEY) !== null;
  }

  return { save, load, clear, hasSavedState };
})();