var GameState = (function() {
  var SCREENS = {
    MENU: 'menu',
    OPPONENT_SELECT: 'opponent_select',
    TOURNAMENT: 'tournament',
    LIFTING: 'lifting',
    RESULT: 'result',
    GAME_OVER: 'game_over',
    PAUSED: 'paused'
  };

  var state = {
    screen: SCREENS.MENU,
    previousScreen: null,
    selectedOpponent: null,
    tournament: null,
    currentLift: null,
    liftResult: null,
    records: null,
    settings: null,
    isDirty: false
  };

  var saveTimer = null;
  var SAVE_INTERVAL = 500;

  function init() {
    state.records = Storage.loadRecords();
    state.settings = Storage.loadSettings();

    var saved = Storage.loadGameState();
    if (saved && saved.screen) {
      state.screen = saved.screen;
      state.selectedOpponent = saved.selectedOpponent;
      state.tournament = saved.tournament;
      state.currentLift = saved.currentLift;
      state.liftResult = saved.liftResult;
    }

    startAutoSave();
  }

  function startAutoSave() {
    if (saveTimer) clearInterval(saveTimer);
    saveTimer = setInterval(function() {
      if (state.isDirty) {
        save();
      }
    }, SAVE_INTERVAL);
  }

  function save() {
    Storage.saveGameState({
      screen: state.screen,
      selectedOpponent: state.selectedOpponent,
      tournament: state.tournament,
      currentLift: state.currentLift,
      liftResult: state.liftResult
    });
    state.isDirty = false;
  }

  function setScreen(screen) {
    state.previousScreen = state.screen;
    state.screen = screen;
    state.isDirty = true;
    save();
  }

  function getScreen() {
    return state.screen;
  }

  function getPreviousScreen() {
    return state.previousScreen;
  }

  function setSelectedOpponent(opponent) {
    state.selectedOpponent = opponent;
    state.isDirty = true;
    save();
  }

  function getSelectedOpponent() {
    return state.selectedOpponent;
  }

  function setTournament(tournament) {
    state.tournament = tournament;
    state.isDirty = true;
    save();
  }

  function getTournament() {
    return state.tournament;
  }

  function setCurrentLift(lift) {
    state.currentLift = lift;
    state.isDirty = true;
    save();
  }

  function getCurrentLift() {
    return state.currentLift;
  }

  function setLiftResult(result) {
    state.liftResult = result;
    state.isDirty = true;
    save();
  }

  function getLiftResult() {
    return state.liftResult;
  }

  function getRecords() {
    return state.records;
  }

  function getSettings() {
    return state.settings;
  }

  function clearGameState() {
    Storage.clearGameState();
    state.screen = SCREENS.MENU;
    state.selectedOpponent = null;
    state.tournament = null;
    state.currentLift = null;
    state.liftResult = null;
    state.isDirty = false;
  }

  function destroy() {
    if (saveTimer) {
      clearInterval(saveTimer);
      saveTimer = null;
    }
  }

  return {
    SCREENS: SCREENS,
    init: init,
    save: save,
    setScreen: setScreen,
    getScreen: getScreen,
    getPreviousScreen: getPreviousScreen,
    setSelectedOpponent: setSelectedOpponent,
    getSelectedOpponent: getSelectedOpponent,
    setTournament: setTournament,
    getTournament: getTournament,
    setCurrentLift: setCurrentLift,
    getCurrentLift: getCurrentLift,
    setLiftResult: setLiftResult,
    getLiftResult: getLiftResult,
    getRecords: getRecords,
    getSettings: getSettings,
    clearGameState: clearGameState,
    destroy: destroy
  };
})();
