const Farm = {
  plant(plotId, cropId) {
    const plot = GameState.plots.find(p => p.id === plotId);
    const crop = GameState.crops[cropId];

    if (!plot || !plot.unlocked) {
      GameState.showMessage('❌ 地块未解锁');
      return false;
    }
    if (plot.crop) {
      GameState.showMessage('❌ 该地块已有作物');
      return false;
    }
    if (!crop || !crop.unlocked) {
      GameState.showMessage('❌ 该作物未解锁');
      return false;
    }
    if (!GameState.useSeed(cropId)) {
      GameState.showMessage('❌ 种子不足，请先购买');
      return false;
    }

    plot.crop = cropId;
    plot.plantedAt = Date.now();
    plot.watered = false;
    plot.fertilized = false;
    plot.growthProgress = 0;

    GameState.showMessage(`🌱 种下了${crop.name}！`);
    GameState.notify();
    GameState.save();
    return true;
  },

  harvest(plotId) {
    const plot = GameState.plots.find(p => p.id === plotId);
    if (!plot || !plot.crop) {
      GameState.showMessage('❌ 没有可收获的作物');
      return false;
    }

    const crop = GameState.crops[plot.crop];
    const growth = this.getGrowthProgress(plot);

    if (growth < 1) {
      GameState.showMessage('⏳ 作物还未成熟');
      return false;
    }

    const plotType = Config.PLOT_TYPES[plot.type];
    const baseYield = 1 + plotType.yieldBonus;

    GameState.addHarvested(plot.crop, baseYield);
    GameState.addExp(Math.floor(crop.sellPrice / 5));

    plot.crop = null;
    plot.plantedAt = 0;
    plot.watered = false;
    plot.fertilized = false;
    plot.growthProgress = 0;

    GameState.showMessage(`🎉 收获了 ${baseYield} 个${crop.name}！已存入背包 ${baseYield > 1 ? '(产量加成)' : ''}`);
    GameState.notify();
    GameState.save();
    return true;
  },

  clearPlot(plotId) {
    const plot = GameState.plots.find(p => p.id === plotId);
    if (!plot || !plot.unlocked) return false;

    if (plot.crop) {
      const crop = GameState.crops[plot.crop];
      const growth = this.getGrowthProgress(plot);
      if (growth < 1) {
        if (!confirm('确定要清除未成熟的作物吗？')) {
          return false;
        }
      }
    }

    plot.crop = null;
    plot.plantedAt = 0;
    plot.watered = false;
    plot.fertilized = false;
    plot.growthProgress = 0;

    GameState.showMessage('🔄 地块已清理');
    GameState.notify();
    GameState.save();
    return true;
  },

  getGrowthProgress(plot) {
    if (!plot.crop || plot.plantedAt === 0) return 0;

    const crop = GameState.crops[plot.crop];
    const plotType = Config.PLOT_TYPES[plot.type];
    const now = Date.now();
    const elapsed = now - plot.plantedAt;

    let totalBoost = plotType.speedBonus;
    if (plot.watered) totalBoost += Config.TOOLS.water.speedBoost;
    if (plot.fertilized) totalBoost += Config.TOOLS.fertilizer.speedBoost;

    const effectiveGrowTime = crop.growTime * (1 - totalBoost);
    const progress = Math.min(1, elapsed / effectiveGrowTime);

    return progress;
  },

  getGrowthStage(plot) {
    const progress = this.getGrowthProgress(plot);
    if (!plot.crop) return -1;
    const crop = GameState.crops[plot.crop];
    const stageCount = crop.stages.length;
    return Math.min(stageCount - 1, Math.floor(progress * stageCount));
  },

  getRemainingTime(plot) {
    if (!plot.crop || plot.plantedAt === 0) return 0;

    const crop = GameState.crops[plot.crop];
    const plotType = Config.PLOT_TYPES[plot.type];
    const now = Date.now();
    const elapsed = now - plot.plantedAt;

    let totalBoost = plotType.speedBonus;
    if (plot.watered) totalBoost += Config.TOOLS.water.speedBoost;
    if (plot.fertilized) totalBoost += Config.TOOLS.fertilizer.speedBoost;

    const effectiveGrowTime = crop.growTime * (1 - totalBoost);
    const remaining = Math.max(0, effectiveGrowTime - elapsed);

    return Math.ceil(remaining / 1000);
  },

  water(plotId) {
    const plot = GameState.plots.find(p => p.id === plotId);
    if (!plot || !plot.unlocked || !plot.crop) {
      GameState.showMessage('❌ 无法浇水');
      return false;
    }
    if (this.getGrowthProgress(plot) >= 1) {
      GameState.showMessage('❌ 作物已成熟，无需浇水');
      return false;
    }
    if (plot.watered) {
      GameState.showMessage('💧 已经浇过水了');
      return false;
    }
    if (!GameState.useItem('water')) {
      GameState.showMessage('❌ 浇水壶用完了');
      return false;
    }

    plot.watered = true;
    GameState.showMessage('💧 浇水成功！生长加速10%');
    GameState.notify();
    GameState.save();
    return true;
  },

  fertilize(plotId) {
    const plot = GameState.plots.find(p => p.id === plotId);
    if (!plot || !plot.unlocked || !plot.crop) {
      GameState.showMessage('❌ 无法施肥');
      return false;
    }
    if (this.getGrowthProgress(plot) >= 1) {
      GameState.showMessage('❌ 作物已成熟，无需施肥');
      return false;
    }
    if (plot.fertilized) {
      GameState.showMessage('🌿 已经施过肥了');
      return false;
    }
    if (!GameState.useItem('fertilizer')) {
      GameState.showMessage('❌ 肥料不足');
      return false;
    }

    plot.fertilized = true;
    GameState.showMessage('🌿 施肥成功！生长加速25%');
    GameState.notify();
    GameState.save();
    return true;
  },

  useRipening(plotId) {
    const plot = GameState.plots.find(p => p.id === plotId);
    if (!plot || !plot.unlocked || !plot.crop) {
      GameState.showMessage('❌ 无法使用催熟剂');
      return false;
    }
    if (this.getGrowthProgress(plot) >= 1) {
      GameState.showMessage('❌ 作物已成熟');
      return false;
    }
    if (!GameState.useItem('ripening')) {
      GameState.showMessage('❌ 催熟剂不足');
      return false;
    }

    plot.plantedAt = Math.max(plot.plantedAt - Config.TOOLS.ripening.timeReduce, Date.now() - 1000);
    GameState.showMessage('⚡ 使用催熟剂！生长时间-30秒');
    GameState.notify();
    GameState.save();
    return true;
  },

  handlePlotClick(plotId) {
    const plot = GameState.plots.find(p => p.id === plotId);
    if (!plot) return;

    const tool = GameState.state.selectedTool;
    const selectedSeed = GameState.state.selectedSeed;

    if (!plot.unlocked) {
      if (tool === 'shovel') {
        GameState.unlockPlot(plotId);
      } else {
        GameState.showMessage(`💰 解锁需要 ${plot.unlockCost} 金币，切换到铲子点击解锁`);
      }
      return;
    }

    if (tool === 'shovel') {
      this.clearPlot(plotId);
      return;
    }

    if (tool === 'water') {
      this.water(plotId);
      return;
    }

    if (tool === 'fertilizer') {
      this.fertilize(plotId);
      return;
    }

    if (tool === 'ripening') {
      this.useRipening(plotId);
      return;
    }

    if (tool === 'hand') {
      if (selectedSeed && !plot.crop) {
        this.plant(plotId, selectedSeed);
      } else if (plot.crop && this.getGrowthProgress(plot) >= 1) {
        this.harvest(plotId);
      } else if (!plot.crop) {
        GameState.showMessage('👆 请先选择种子或工具');
      } else {
        const crop = GameState.crops[plot.crop];
        const remaining = this.getRemainingTime(plot);
        const stage = this.getGrowthStage(plot);
        GameState.showMessage(`🌱 ${crop.name} - ${crop.stages[stage]}，还需 ${remaining} 秒`);
      }
    }
  },

  update(deltaTime) {
    GameState.plots.forEach(plot => {
      if (plot.crop) {
        plot.growthProgress = this.getGrowthProgress(plot);
      }
    });

    if (GameState.state.messageTimer > 0) {
      GameState.state.messageTimer -= deltaTime;
      if (GameState.state.messageTimer <= 0) {
        GameState.state.showMessage = null;
        GameState.notify();
      }
    }
  }
};

window.Farm = Farm;
