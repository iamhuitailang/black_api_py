const EventService = {
  triggerRandomEvent(gameState) {
    const roll = Math.random();
    let cumulative = 0;
    const probs = CONSTANTS.EVENT_PROBABILITIES;

    for (const [type, probability] of Object.entries(probs)) {
      cumulative += probability;
      if (roll < cumulative) {
        const event = this.getEventByType(type);
        if (event) {
          eventBus.emit(CONSTANTS.EVENTS.RANDOM_EVENT_TRIGGER, { event });
          return event;
        }
        break;
      }
    }

    return null;
  },

  getEventByType(type) {
    const events = RANDOM_EVENTS.filter(e => e.type === type);
    if (events.length === 0) return null;
    return Helpers.deepClone(Helpers.randomChoice(events));
  },

  resolveEvent(gameState, event, choiceIndex) {
    if (!event || !event.choices || !event.choices[choiceIndex]) {
      return { success: false, message: '无效的选择' };
    }

    const choice = event.choices[choiceIndex];
    let outcome = choice.outcome;

    if (outcome.type) {
      outcome = this.resolveConditionalOutcome(gameState, outcome);
    }

    this.applyOutcome(gameState, outcome);

    gameState.addEventLog({
      eventId: event.id,
      title: event.title,
      choice: choice.text,
      result: outcome.message
    });

    eventBus.emit(CONSTANTS.EVENTS.RANDOM_EVENT_RESOLVE, {
      event,
      choice,
      outcome
    });

    return {
      success: true,
      message: outcome.message,
      data: { event, choice, outcome }
    };
  },

  resolveConditionalOutcome(gameState, outcome) {
    switch (outcome.type) {
      case 'combat':
        return this.resolveCombat(gameState, outcome);
      case 'escape':
        return this.resolveEscape(gameState, outcome);
      case 'explore':
      case 'collect':
        return this.resolveSkillCheck(gameState, outcome, 0.6);
      case 'repair':
      case 'smuggle':
        return this.resolveSkillCheck(gameState, outcome, 0.5);
      case 'rescue':
        return this.resolveSkillCheck(gameState, outcome, 0.7);
      default:
        return outcome.success || outcome;
    }
  },

  resolveCombat(gameState, outcome) {
    const playerPower = gameState.ship.weaponDamage + gameState.ship.upgrades.weapon * 10;
    const enemyPower = Helpers.randomInt(30, 80);
    const winChance = playerPower / (playerPower + enemyPower);

    if (Math.random() < winChance) {
      return outcome.win;
    } else {
      return outcome.lose;
    }
  },

  resolveEscape(gameState, outcome) {
    const escapeChance = 0.3 + gameState.ship.upgrades.engine * 0.07;
    if (Math.random() < escapeChance) {
      return outcome.success;
    } else {
      return outcome.fail;
    }
  },

  resolveSkillCheck(gameState, outcome, baseChance) {
    const luckBonus = gameState.player.reputation * 0.05;
    const successChance = Math.min(0.95, baseChance + luckBonus);

    if (Math.random() < successChance) {
      return outcome.success;
    } else {
      return outcome.fail;
    }
  },

  applyOutcome(gameState, outcome) {
    if (outcome.credits !== undefined) {
      gameState.player.addCredits(outcome.credits);
    }

    if (outcome.hull !== undefined) {
      if (outcome.hull > 0) {
        gameState.ship.repair(outcome.hull);
      } else {
        gameState.ship.takeDamage(-outcome.hull);
      }
    }

    if (outcome.shield !== undefined) {
      if (outcome.shield > 0) {
        gameState.ship.rechargeShield(outcome.shield);
      } else {
        gameState.ship.shield = Math.max(0, gameState.ship.shield + outcome.shield);
      }
    }

    if (outcome.fuel !== undefined) {
      if (outcome.fuel > 0) {
        gameState.ship.refuel(outcome.fuel);
      } else {
        gameState.ship.consumeFuel(-outcome.fuel);
      }
    }

    if (outcome.loseCargoPercent !== undefined) {
      gameState.ship.loseCargoPercent(outcome.loseCargoPercent);
    }

    if (outcome.loseCargoValuePercent !== undefined) {
      const loseValue = gameState.ship.calculateCargoValue() * outcome.loseCargoValuePercent;
      gameState.player.addCredits(-loseValue);
    }

    if (outcome.goods) {
      const good = GOODS[outcome.goods.goodId];
      if (good && gameState.ship.getAvailableCargo() >= outcome.goods.quantity) {
        gameState.ship.addCargo(outcome.goods.goodId, outcome.goods.quantity, 0);
      }
    }

    if (outcome.randomGoods) {
      const availableGoods = GOOD_IDS.filter(id => GOODS[id].rarity !== 'legendary');
      const randomGood = Helpers.randomChoice(availableGoods);
      const quantity = Helpers.randomInt(5, 20);
      if (gameState.ship.getAvailableCargo() >= quantity) {
        gameState.ship.addCargo(randomGood, quantity, 0);
        outcome.message += ` 获得 ${quantity} 单位 ${GOODS[randomGood].name}！`;
      }
    }

    if (outcome.tradeBan !== undefined) {
      const currentSystem = gameState.getCurrentSystem();
      if (currentSystem) {
        currentSystem.tradeBan = true;
        currentSystem.banEndTime = gameState.gameTime + outcome.tradeBan;
      }
    }

    if (outcome.marketCrash !== undefined) {
      gameState.marketCrashEndTime = gameState.gameTime + outcome.marketCrash;
      gameState.systems.forEach(system => {
        system.goods.forEach(g => {
          g.price = Math.floor(g.price * 0.6);
        });
      });
    }

    if (outcome.reputation !== undefined) {
      gameState.player.reputation += outcome.reputation;
    }
  },

  createNotification(type, message) {
    return {
      id: Helpers.generateId(),
      type,
      message,
      timestamp: Date.now()
    };
  }
};
