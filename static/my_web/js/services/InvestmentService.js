const InvestmentService = {
  canInvest(gameState, investment) {
    if (investment.ownerId !== null) return false;
    return gameState.player.canAfford(investment.cost);
  },

  startInvestment(gameState, system, investment) {
    if (!this.canInvest(gameState, investment)) {
      return { success: false, message: '无法投资该项目' };
    }

    gameState.player.addCredits(-investment.cost);
    investment.ownerId = 'player';
    investment.startTime = gameState.gameTime;
    investment.progress = investment.cost;

    eventBus.emit(CONSTANTS.EVENTS.INVESTMENT_START, {
      investment,
      system
    });

    return {
      success: true,
      message: `成功投资 ${investment.name}`,
      data: { investment, system }
    };
  },

  getInvestmentProgress(investment, currentGameTime) {
    if (investment.startTime === null || investment.ownerId === null) {
      return 0;
    }
    const elapsed = currentGameTime - investment.startTime;
    return Math.min(1, elapsed / investment.duration);
  },

  getInvestmentRemainingTime(investment, currentGameTime) {
    if (investment.startTime === null || investment.ownerId === null) {
      return 0;
    }
    const elapsed = currentGameTime - investment.startTime;
    return Math.max(0, investment.duration - elapsed);
  },

  getExpectedReturns(investment) {
    return Math.floor(investment.cost * (1 + investment.returnRate));
  },

  getRiskColor(risk) {
    return Helpers.getRiskColor(risk);
  },

  getRiskText(risk) {
    return Helpers.getRiskText(risk);
  },

  calculateInvestmentValue(gameState) {
    return gameState.systems.reduce((sum, system) => {
      return sum + system.investments
        .filter(inv => inv.ownerId === 'player')
        .reduce((s, inv) => s + inv.progress, 0);
    }, 0);
  },

  getPlayerInvestments(gameState) {
    const investments = [];
    gameState.systems.forEach(system => {
      system.investments.forEach(inv => {
        if (inv.ownerId === 'player') {
          investments.push({
            ...inv,
            systemName: system.name,
            progress: this.getInvestmentProgress(inv, gameState.gameTime),
            remainingTime: this.getInvestmentRemainingTime(inv, gameState.gameTime),
            expectedReturns: this.getExpectedReturns(inv)
          });
        }
      });
    });
    return investments;
  },

  getAvailableInvestments(gameState) {
    const system = gameState.getCurrentSystem();
    if (!system) return [];
    
    return system.investments.filter(inv => inv.ownerId === null);
  }
};
