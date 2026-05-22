const Competition = {
  mode: 'preliminary',
  opponentLevel: 'junior',
  environment: null,
  currentRound: 1,
  totalRounds: 6,
  
  player: {
    name: '你',
    scores: [],
    totalScore: 0,
    currentRank: 1,
    isCurrent: true
  },
  
  opponents: [],
  
  init(mode, opponentLevel) {
    this.mode = mode;
    this.opponentLevel = opponentLevel;
    this.currentRound = 1;
    this.totalRounds = GameData.TOTAL_ROUNDS;
    
    this.player = {
      name: '你',
      scores: [],
      totalScore: 0,
      currentRank: 1,
      isCurrent: true
    };
    
    this.opponents = this.generateOpponents();
    this.environment = this.selectEnvironment();
    
    this.opponents.forEach(opp => {
      opp.selectedActions = this.generateOpponentActions();
    });
    
    this.saveState();
  },

  generateOpponents() {
    const count = this.mode === 'preliminary' ? GameData.PRELIMINARY_COUNT : GameData.FINAL_COUNT;
    const levelConfig = GameData.OPPONENT_LEVELS[this.opponentLevel];
    const names = [...GameData.OPPONENT_NAMES].sort(() => Math.random() - 0.5);
    
    const opponents = [];
    
    for (let i = 0; i < count; i++) {
      const baseScore = levelConfig.avgScore + (Math.random() - 0.5) * 1.5;
      opponents.push({
        name: names[i % names.length],
        level: this.opponentLevel,
        avgScore: Math.max(3, Math.min(10, baseScore)),
        diffMultiplier: levelConfig.diffMultiplier,
        color: levelConfig.color,
        scores: [],
        totalScore: 0,
        currentRank: i + 1,
        selectedActions: [],
        isCurrent: false
      });
    }
    
    return opponents;
  },
  
  generateOpponentActions() {
    const actions = [];
    const availableActions = [...GameData.DIVING_ACTIONS].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < this.totalRounds; i++) {
      actions.push(availableActions[i % availableActions.length]);
    }
    
    return actions;
  },
  
  selectEnvironment() {
    const rand = Math.random();
    let cumulative = 0;
    
    for (const env of GameData.ENVIRONMENTS) {
      cumulative += env.probability;
      if (rand <= cumulative) {
        return { ...env };
      }
    }
    
    return { ...GameData.ENVIRONMENTS[0] };
  },
  
  calculatePlayerScore(entryQuality, action) {
    const difficulty = action.difficulty;
    const entryScore = entryQuality.overallScore;
    
    let baseScore = entryScore;
    
    if (this.environment) {
      baseScore *= (1 + this.environment.effectValue);
    }
    
    baseScore = Math.max(0, Math.min(10, baseScore));
    
    const judgeScores = this.generateJudgeScores(baseScore);
    
    const sortedScores = [...judgeScores].sort((a, b) => a - b);
    const trimmedScores = sortedScores.slice(1, -1);
    const avgScore = trimmedScores.reduce((a, b) => a + b, 0) / trimmedScores.length;
    
    let rating = null;
    for (const r of GameData.SCORE_RATINGS) {
      if (avgScore >= r.min) {
        rating = r;
        break;
      }
    }
    
    const finalScore = rating.score * difficulty;
    
    return {
      judgeScores,
      avgScore: avgScore.toFixed(1),
      difficulty,
      finalScore: finalScore.toFixed(1),
      rating
    };
  },
  
  generateJudgeScores(baseScore) {
    const judges = [];
    const variance = 0.5;
    
    for (let i = 0; i < 7; i++) {
      let score = baseScore + (Math.random() - 0.5) * variance * 2;
      score = Math.max(0, Math.min(10, Math.round(score * 10) / 10));
      judges.push(score);
    }
    
    return judges;
  },
  
  calculateOpponentScore(opponent, round) {
    const action = opponent.selectedActions[round - 1];
    const difficulty = action.difficulty;
    
    const baseScore = opponent.avgScore + (Math.random() - 0.5) * 2;
    const adjustedScore = Math.max(0, Math.min(10, baseScore * opponent.diffMultiplier));
    
    const judgeScores = this.generateJudgeScores(adjustedScore);
    
    const sortedScores = [...judgeScores].sort((a, b) => a - b);
    const trimmedScores = sortedScores.slice(1, -1);
    const avgScore = trimmedScores.reduce((a, b) => a + b, 0) / trimmedScores.length;
    
    let rating = null;
    for (const r of GameData.SCORE_RATINGS) {
      if (avgScore >= r.min) {
        rating = r;
        break;
      }
    }
    
    const finalScore = rating.score * difficulty;
    
    return {
      judgeScores,
      avgScore: avgScore.toFixed(1),
      difficulty,
      finalScore: finalScore.toFixed(1),
      rating
    };
  },
  
  recordPlayerScore(scoreResult) {
    this.player.scores.push(scoreResult);
    this.player.totalScore = this.player.scores.reduce((sum, s) => sum + parseFloat(s.finalScore), 0);
    
    this.updateOpponentScores();
    this.updateRanks();
    this.saveState();
  },
  
  updateOpponentScores() {
    this.opponents.forEach(opp => {
      while (opp.scores.length < this.currentRound) {
        const score = this.calculateOpponentScore(opp, opp.scores.length + 1);
        opp.scores.push(score);
      }
      opp.totalScore = opp.scores.reduce((sum, s) => sum + parseFloat(s.finalScore), 0);
    });
  },
  
  updateRanks() {
    const allCompetitors = [this.player, ...this.opponents];
    const sorted = [...allCompetitors].sort((a, b) => b.totalScore - a.totalScore);
    
    sorted.forEach((comp, index) => {
      comp.currentRank = index + 1;
    });
    
    this.opponents.sort((a, b) => b.totalScore - a.totalScore);
  },
  
  nextRound() {
    if (this.currentRound < this.totalRounds) {
      this.currentRound++;
      this.saveState();
      return true;
    }
    return false;
  },
  
  isCompetitionComplete() {
    return this.currentRound > this.totalRounds;
  },
  
  getRank() {
    return this.player.currentRank;
  },
  
  getTotalScore() {
    return this.player.totalScore.toFixed(1);
  },
  
  getCurrentScore() {
    if (this.player.scores.length > 0) {
      return this.player.scores[this.player.scores.length - 1].finalScore;
    }
    return '-';
  },
  
  getCurrentRankList() {
    const allCompetitors = [this.player, ...this.opponents];
    return allCompetitors
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((comp, index) => ({
        rank: index + 1,
        name: comp.name,
        score: comp.totalScore,
        isCurrent: comp.isCurrent
      }));
  },
  
  saveState() {
    const state = {
      mode: this.mode,
      opponentLevel: this.opponentLevel,
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
      player: JSON.parse(JSON.stringify(this.player)),
      opponents: JSON.parse(JSON.stringify(this.opponents)),
      environment: this.environment ? JSON.parse(JSON.stringify(this.environment)) : null,
      savedAt: Date.now()
    };
    const result = Storage.saveGameState(state);
    console.log('[Competition] 状态已保存:', {
      round: state.currentRound,
      totalRounds: state.totalRounds,
      playerScore: state.player.totalScore,
      opponentCount: state.opponents.length
    });
    return result;
  },
  
  loadState() {
    const state = Storage.loadGameState();
    if (state) {
      console.log('[Competition] 正在恢复状态:', {
        round: state.currentRound,
        totalRounds: state.totalRounds,
        playerScore: state.player ? state.player.totalScore : 'N/A'
      });
      
      this.mode = state.mode || 'preliminary';
      this.opponentLevel = state.opponentLevel || 'junior';
      this.currentRound = state.currentRound || 1;
      this.totalRounds = state.totalRounds || GameData.TOTAL_ROUNDS;
      this.player = JSON.parse(JSON.stringify(state.player));
      this.opponents = JSON.parse(JSON.stringify(state.opponents || []));
      this.environment = state.environment ? JSON.parse(JSON.stringify(state.environment)) : this.selectEnvironment();
      
      this.opponents.forEach(opp => {
        if (!opp.selectedActions || opp.selectedActions.length === 0) {
          opp.selectedActions = this.generateOpponentActions();
        }
      });
      
      console.log('[Competition] 状态恢复成功');
      return true;
    }
    console.log('[Competition] 没有找到保存的状态');
    return false;
  },
  
  clearState() {
    Storage.clearGameState();
  },
  
  reset() {
    this.currentRound = 1;
    this.player = {
      name: '你',
      scores: [],
      totalScore: 0,
      currentRank: 1,
      isCurrent: true
    };
    this.opponents = [];
    this.environment = null;
  }
};
