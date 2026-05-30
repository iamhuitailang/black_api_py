class GameLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.playerCheer = 50;
    this.opponentCheer = 50;
    this.playerEmotion = 50;
    this.combo = 0;
    this.maxCombo = 0;
    this.gameOver = false;
    this.winner = null;
    this.playerPosition = 0;
    this.playerState = 'normal';
    this.opponentState = 'normal';
    this.skillCooldowns = {};
    this.actionEffects = [];
    this.audience = this.initAudience();
    this.gameStartTime = Date.now();
    this.lastComboTime = 0;
    this.isPerforming = false;
    this.specialEffect = false;
  }

  initAudience() {
    const audience = [];
    for (let i = 0; i < 20; i++) {
      audience.push({
        id: i,
        side: Math.random() > 0.5 ? 'player' : 'opponent',
        cheering: false
      });
    }
    return audience;
  }

  performAction(actionType, isPlayer = true) {
    if (this.gameOver || this.isPerforming) return;

    const action = BASIC_ACTIONS[actionType];
    if (!action) return;

    this.isPerforming = true;

    setTimeout(() => {
      if (isPlayer) {
        this.playerState = 'performing';
      } else {
        this.opponentState = 'performing';
      }

      const baseGain = action.cheerGain;
      const comboBonus = Math.floor(this.combo * 0.5);
      const emotionBonus = Math.floor(this.playerEmotion / 20);
      const totalGain = baseGain + comboBonus + emotionBonus;

      if (isPlayer) {
        this.addCheer(totalGain, true);
        this.showEffect(totalGain, true, actionType);
        this.increaseCombo();
      } else {
        this.addCheer(totalGain, false);
        this.showEffect(totalGain, false, actionType);
      }

      setTimeout(() => {
        this.isPerforming = false;
        if (isPlayer) {
          this.playerState = 'normal';
        } else {
          this.opponentState = 'normal';
        }
      }, action.recoveryTime);

    }, action.castTime);
  }

  useSkill(skillType) {
    if (this.gameOver || this.isPerforming) return false;

    const skill = SPECIAL_SKILLS[skillType];
    if (!skill) return false;

    const now = Date.now();
    if (this.skillCooldowns[skillType] && now < this.skillCooldowns[skillType]) {
      return false;
    }

    this.skillCooldowns[skillType] = now + skill.cooldown;
    this.isPerforming = true;
    this.specialEffect = true;

    setTimeout(() => {
      this.specialEffect = false;
    }, 800);

    if (skillType === 'beatJump' && skill.hits) {
      for (let i = 0; i < skill.hits; i++) {
        setTimeout(() => {
          this.addCheer(Math.floor(skill.cheerGain / skill.hits), true);
          this.showEffect(Math.floor(skill.cheerGain / skill.hits), true, skillType);
        }, i * 200);
      }
      this.increaseCombo();
    } else {
      this.addCheer(skill.cheerGain, true);
      this.showEffect(skill.cheerGain, true, skillType);
      this.increaseCombo();
    }

    setTimeout(() => {
      this.isPerforming = false;
    }, 500);

    return true;
  }

  addCheer(amount, isPlayer) {
    if (isPlayer) {
      this.playerCheer = Math.min(GAME_CONFIG.MAX_CHEER, this.playerCheer + amount);
      this.opponentCheer = Math.max(0, this.opponentCheer - Math.floor(amount / 2));
    } else {
      this.opponentCheer = Math.min(GAME_CONFIG.MAX_CHEER, this.opponentCheer + amount);
      this.playerCheer = Math.max(0, this.playerCheer - Math.floor(amount / 2));
    }

    this.adjustAudience();
    this.checkWinCondition();
  }

  increaseCombo() {
    const now = Date.now();
    if (now - this.lastComboTime < GAME_CONFIG.COMBO_TIMEOUT) {
      this.combo++;
    } else {
      this.combo = 1;
    }
    this.lastComboTime = now;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
  }

  adjustAudience() {
    const totalCheer = this.playerCheer + this.opponentCheer;
    const playerRatio = this.playerCheer / totalCheer;

    this.audience.forEach(member => {
      if (Math.random() < 0.3) {
        member.side = Math.random() < playerRatio ? 'player' : 'opponent';
      }
    });
  }

  triggerAudienceCheer(isPlayer) {
    const sideAudience = this.audience.filter(m => m.side === (isPlayer ? 'player' : 'opponent'));
    sideAudience.forEach(member => {
      member.cheering = true;
      setTimeout(() => {
        member.cheering = false;
      }, 500);
    });
  }

  showEffect(text, isPlayer, actionType = '') {
    const effect = {
      id: Date.now() + Math.random(),
      text,
      isPlayer,
      actionType
    };
    this.actionEffects.push(effect);
    setTimeout(() => {
      this.actionEffects = this.actionEffects.filter(e => e.id !== effect.id);
    }, 1200);
  }

  checkWinCondition() {
    if (this.playerCheer >= GAME_CONFIG.MAX_CHEER) {
      this.gameOver = true;
      this.winner = 'player';
    } else if (this.opponentCheer >= GAME_CONFIG.MAX_CHEER) {
      this.gameOver = true;
      this.winner = 'opponent';
    }
  }

  moveLeft() {
    this.playerPosition = Math.max(-2, this.playerPosition - 1);
  }

  moveRight() {
    this.playerPosition = Math.min(2, this.playerPosition + 1);
  }

  crouch() {
    this.playerState = 'crouch';
    this.playerEmotion = Math.max(0, this.playerEmotion - 5);
    setTimeout(() => {
      if (this.playerState === 'crouch') {
        this.playerState = 'normal';
      }
    }, 300);
  }

  raiseEmotion() {
    this.playerState = 'high';
    this.playerEmotion = Math.min(GAME_CONFIG.MAX_EMOTION, this.playerEmotion + 10);
    setTimeout(() => {
      if (this.playerState === 'high') {
        this.playerState = 'normal';
      }
    }, 300);
  }

  opponentAI() {
    if (this.gameOver) return;

    const actions = Object.keys(BASIC_ACTIONS);
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    this.performAction(randomAction, false);
    this.triggerAudienceCheer(false);
  }

  getGameDuration() {
    return Math.floor((Date.now() - this.gameStartTime) / 1000);
  }

  getState() {
    return {
      playerCheer: this.playerCheer,
      opponentCheer: this.opponentCheer,
      playerEmotion: this.playerEmotion,
      combo: this.combo,
      maxCombo: this.maxCombo,
      gameOver: this.gameOver,
      winner: this.winner,
      playerPosition: this.playerPosition,
      playerState: this.playerState,
      opponentState: this.opponentState,
      skillCooldowns: this.skillCooldowns,
      actionEffects: this.actionEffects,
      audience: this.audience,
      specialEffect: this.specialEffect,
      duration: this.getGameDuration()
    };
  }

  loadState(state) {
    this.playerCheer = state.playerCheer || 50;
    this.opponentCheer = state.opponentCheer || 50;
    this.playerEmotion = state.playerEmotion || 50;
    this.combo = state.combo || 0;
    this.maxCombo = state.maxCombo || 0;
    this.gameOver = state.gameOver || false;
    this.winner = state.winner || null;
    this.playerPosition = state.playerPosition || 0;
    this.playerState = state.playerState || 'normal';
    this.opponentState = state.opponentState || 'normal';
    this.skillCooldowns = state.skillCooldowns || {};
    this.audience = state.audience || this.initAudience();
    this.gameStartTime = Date.now() - (state.duration || 0) * 1000;
  }
}
