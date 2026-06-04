const NavigationService = {
  calculateDistance(fromSystem, toSystem) {
    return Helpers.calculateDistance(fromSystem, toSystem);
  },

  calculateFuelCost(distance, speed) {
    return (distance * CONSTANTS.FUEL_PER_DISTANCE) / speed;
  },

  calculateTravelTime(distance, speed) {
    return (distance * 1000) / speed;
  },

  canNavigate(gameState, targetSystemId) {
    if (gameState.isNavigating) return false;

    const currentSystem = gameState.getCurrentSystem();
    const targetSystem = gameState.getSystemById(targetSystemId);

    if (!currentSystem || !targetSystem) return false;
    if (currentSystem.id === targetSystemId) return false;

    const distance = this.calculateDistance(currentSystem, targetSystem);
    const fuelCost = this.calculateFuelCost(distance, gameState.ship.speed);

    return gameState.ship.fuel >= fuelCost;
  },

  navigate(gameState, targetSystemId) {
    return gameState.startNavigation(targetSystemId);
  },

  getAvailableSystems(gameState) {
    const currentSystem = gameState.getCurrentSystem();
    if (!currentSystem) return [];

    return gameState.systems
      .filter(s => s.id !== currentSystem.id)
      .map(s => {
        const distance = this.calculateDistance(currentSystem, s);
        const fuelCost = this.calculateFuelCost(distance, gameState.ship.speed);
        const travelTime = this.calculateTravelTime(distance, gameState.ship.speed);
        return {
          ...s,
          distance,
          fuelCost,
          travelTime,
          canNavigate: gameState.ship.fuel >= fuelCost,
          discovered: gameState.discoveredSystems.includes(s.id)
        };
      });
  },

  getSystemRouteInfo(gameState, systemId) {
    const currentSystem = gameState.getCurrentSystem();
    const targetSystem = gameState.getSystemById(systemId);

    if (!currentSystem || !targetSystem) return null;

    const distance = this.calculateDistance(currentSystem, targetSystem);
    const fuelCost = this.calculateFuelCost(distance, gameState.ship.speed);
    const travelTime = this.calculateTravelTime(distance, gameState.ship.speed);

    return {
      from: currentSystem,
      to: targetSystem,
      distance,
      fuelCost,
      travelTime,
      canNavigate: gameState.ship.fuel >= fuelCost
    };
  }
};
