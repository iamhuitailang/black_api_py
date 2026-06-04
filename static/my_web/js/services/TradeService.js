const TradeService = {
  buyGood(gameState, goodId, quantity) {
    const currentSystem = gameState.getCurrentSystem();
    if (!currentSystem) {
      return { success: false, message: '不在任何星系' };
    }

    if (currentSystem.tradeBan) {
      return { success: false, message: '该星系处于贸易禁令中' };
    }

    const stationGood = currentSystem.getGood(goodId);
    if (!stationGood) {
      return { success: false, message: '商品不存在' };
    }

    if (stationGood.quantity < quantity) {
      return { success: false, message: '库存不足' };
    }

    const good = GOODS[goodId];
    if (good && good.illegal && currentSystem.type !== 'frontier') {
      const risk = Math.random();
      if (risk < 0.3) {
        return { success: false, message: '非法商品被海关查获！' };
      }
    }

    const unitPrice = stationGood.price;
    let totalCost = unitPrice * quantity;
    const fee = totalCost * CONSTANTS.TRADE_FEE_RATE;
    totalCost += fee;

    if (!gameState.player.canAfford(totalCost)) {
      return { success: false, message: '信用点不足' };
    }

    if (gameState.ship.getAvailableCargo() < quantity) {
      return { success: false, message: '货舱空间不足' };
    }

    currentSystem.buyGood(goodId, quantity);
    gameState.player.addCredits(-totalCost);
    gameState.ship.addCargo(goodId, quantity, unitPrice);

    if (stationGood.quantity > 0) {
      stationGood.price = Math.floor(stationGood.price * 1.02);
    }

    eventBus.emit(CONSTANTS.EVENTS.TRADE_BUY, {
      goodId,
      quantity,
      price: unitPrice,
      totalCost
    });

    return {
      success: true,
      message: `成功购买 ${quantity} 单位 ${GOODS[goodId]?.name || goodId}`,
      data: { quantity, price: unitPrice, totalCost }
    };
  },

  sellGood(gameState, goodId, quantity) {
    const currentSystem = gameState.getCurrentSystem();
    if (!currentSystem) {
      return { success: false, message: '不在任何星系' };
    }

    if (currentSystem.tradeBan) {
      return { success: false, message: '该星系处于贸易禁令中' };
    }

    const cargoQuantity = gameState.ship.getCargoQuantity(goodId);
    if (cargoQuantity < quantity) {
      return { success: false, message: '货物数量不足' };
    }

    const good = GOODS[goodId];
    if (good && good.illegal && currentSystem.type !== 'frontier') {
      const risk = Math.random();
      if (risk < 0.3) {
        gameState.ship.removeCargo(goodId, quantity);
        return { success: false, message: '非法商品被海关没收！' };
      }
    }

    const stationGood = currentSystem.getGood(goodId);
    const unitPrice = stationGood ? stationGood.price : (GOODS[goodId]?.basePrice || 0);
    let totalRevenue = unitPrice * quantity;
    const fee = totalRevenue * CONSTANTS.TRADE_FEE_RATE;
    totalRevenue -= fee;

    const cargoItem = gameState.ship.cargoItems.find(i => i.goodId === goodId);
    const profit = cargoItem ? (unitPrice - cargoItem.buyPrice) * quantity - fee : 0;

    gameState.ship.removeCargo(goodId, quantity);
    currentSystem.sellGood(goodId, quantity);
    gameState.player.addCredits(totalRevenue);

    if (stationGood && stationGood.quantity > 10) {
      stationGood.price = Math.floor(stationGood.price * 0.98);
    }

    eventBus.emit(CONSTANTS.EVENTS.TRADE_SELL, {
      goodId,
      quantity,
      price: unitPrice,
      totalRevenue,
      profit
    });

    return {
      success: true,
      message: `成功出售 ${quantity} 单位 ${good?.name || goodId}，${profit >= 0 ? '盈利' : '亏损'} ${Helpers.formatCredits(Math.abs(profit))}`,
      data: { quantity, price: unitPrice, totalRevenue, profit }
    };
  },

  canBuy(gameState, goodId, quantity) {
    const currentSystem = gameState.getCurrentSystem();
    if (!currentSystem || currentSystem.tradeBan) return false;

    const stationGood = currentSystem.getGood(goodId);
    if (!stationGood || stationGood.quantity < quantity) return false;

    const totalCost = stationGood.price * quantity * (1 + CONSTANTS.TRADE_FEE_RATE);
    if (!gameState.player.canAfford(totalCost)) return false;

    if (gameState.ship.getAvailableCargo() < quantity) return false;

    return true;
  },

  canSell(gameState, goodId, quantity) {
    const currentSystem = gameState.getCurrentSystem();
    if (!currentSystem || currentSystem.tradeBan) return false;

    return gameState.ship.getCargoQuantity(goodId) >= quantity;
  },

  getMaxBuyQuantity(gameState, goodId) {
    const currentSystem = gameState.getCurrentSystem();
    if (!currentSystem) return 0;

    const stationGood = currentSystem.getGood(goodId);
    if (!stationGood) return 0;

    const price = stationGood.price * (1 + CONSTANTS.TRADE_FEE_RATE);
    const maxByCredits = Math.floor(gameState.player.credits / price);
    const maxByStock = stationGood.quantity;
    const maxByCargo = gameState.ship.getAvailableCargo();

    return Math.min(maxByCredits, maxByStock, maxByCargo);
  },

  getMaxSellQuantity(gameState, goodId) {
    return gameState.ship.getCargoQuantity(goodId);
  }
};
