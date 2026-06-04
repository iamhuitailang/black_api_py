class Player {
  constructor(name = '星际商人') {
    this.name = name;
    this.credits = CONSTANTS.INITIAL_CREDITS;
    this.totalAssets = CONSTANTS.INITIAL_CREDITS;
    this.marketShare = 0;
    this.dailyIncome = 0;
    this.reputation = 0;
  }

  updateTotalAssets(shipCargoValue, investmentsValue) {
    this.totalAssets = this.credits + shipCargoValue + investmentsValue;
  }

  addCredits(amount) {
    this.credits += amount;
    eventBus.emit(CONSTANTS.EVENTS.UI_NOTIFICATION, {
      type: amount > 0 ? 'success' : 'error',
      message: `${amount > 0 ? '+' : ''}${Helpers.formatCredits(amount)}`
    });
  }

  canAfford(amount) {
    return this.credits >= amount;
  }

  toJSON() {
    return {
      name: this.name,
      credits: this.credits,
      totalAssets: this.totalAssets,
      marketShare: this.marketShare,
      dailyIncome: this.dailyIncome,
      reputation: this.reputation
    };
  }

  static fromJSON(data) {
    const player = new Player(data.name);
    player.credits = data.credits;
    player.totalAssets = data.totalAssets;
    player.marketShare = data.marketShare;
    player.dailyIncome = data.dailyIncome;
    player.reputation = data.reputation || 0;
    return player;
  }
}
