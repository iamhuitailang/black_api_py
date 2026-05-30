const GamePage = {
  template: `
    <div class="game-container">
      <button class="back-btn" @click="goBack">← 返回首页</button>
      
      <div class="game-stage">
        <div class="stage-bg-particles">
          <div 
            v-for="i in 20" 
            :key="i" 
            class="particle"
            :style="{ 
              left: (Math.random() * 100) + '%', 
              top: (Math.random() * 100) + '%',
              animationDelay: (Math.random() * 6) + 's'
            }"
          ></div>
        </div>
        
        <div class="stage-lights"></div>
        <div class="stage-floor"></div>
        
        <div class="game-ui-top">
          <div class="cheer-bars">
            <div class="cheer-bar-container">
              <div class="cheer-bar-label">🎤 你</div>
              <div class="cheer-bar">
                <div class="cheer-bar-fill player" :style="{ width: gameState.playerCheer + '%' }"></div>
              </div>
              <div class="cheer-value" style="color: #00d2ff;">{{ Math.round(gameState.playerCheer) }}</div>
            </div>
            <div class="cheer-bar-container">
              <div class="cheer-bar-label">🎭 对手</div>
              <div class="cheer-bar">
                <div class="cheer-bar-fill opponent" :style="{ width: gameState.opponentCheer + '%' }"></div>
              </div>
              <div class="cheer-value" style="color: #f5576c;">{{ Math.round(gameState.opponentCheer) }}</div>
            </div>
          </div>
          
          <div class="emotion-container">
            <div class="emotion-label">⚡ 情绪值</div>
            <div class="emotion-bar">
              <div class="emotion-bar-inner">
                <div class="emotion-bar-fill" :style="{ width: gameState.playerEmotion + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="combo-display" :class="{ show: gameState.combo > 1 }">
          🔥 {{ gameState.combo }} COMBO!
        </div>
        
        <div class="performers">
          <div class="performer" :style="{ transform: 'translateX(' + (gameState.playerPosition * 40) + 'px)' }">
            <div 
              class="performer-character player"
              :class="[gameState.playerState, gameState.currentAction]"
            >
              <div class="performer-head">
                <div class="performer-eyes">
                  <div class="performer-eye"></div>
                  <div class="performer-eye"></div>
                </div>
                <div class="performer-mouth"></div>
              </div>
              <div class="performer-body">
                <div class="performer-arms">
                  <div class="performer-arm"></div>
                  <div class="performer-arm"></div>
                </div>
              </div>
            </div>
            <div class="performer-name" style="color: #00d2ff;">选手蓝</div>
          </div>
          
          <div class="performer">
            <div 
              class="performer-character opponent"
              :class="gameState.opponentState"
            >
              <div class="performer-head">
                <div class="performer-eyes">
                  <div class="performer-eye"></div>
                  <div class="performer-eye"></div>
                </div>
                <div class="performer-mouth"></div>
              </div>
              <div class="performer-body">
                <div class="performer-arms">
                  <div class="performer-arm"></div>
                  <div class="performer-arm"></div>
                </div>
              </div>
            </div>
            <div class="performer-name" style="color: #f5576c;">选手粉</div>
          </div>
        </div>
        
        <div 
          v-for="effect in gameState.actionEffects" 
          :key="effect.id"
          class="action-effect"
          :class="'action-effect-' + effect.actionType"
          :style="{ 
            left: effect.isPlayer ? '28%' : '72%', 
            top: '45%'
          }"
        >
          +{{ effect.text }}
        </div>
        
        <div 
          v-if="gameState.specialEffect" 
          class="special-effect"
          :class="gameState.currentSkillClass"
        ></div>
        
        <div class="audience">
          <div 
            v-for="member in gameState.audience" 
            :key="member.id"
            class="audience-member"
            :class="[member.side + '-side', { cheering: member.cheering }]"
          ></div>
        </div>
        
        <div class="tips">
          💡 方向键: 移动/气场 &nbsp;|&nbsp; J/K/L/U: 基础动作 &nbsp;|&nbsp; I/O/P: 专属技能
        </div>
        
        <div class="skill-bar">
          <button 
            class="skill-btn basic-j"
            @click="performAction('quickMove')"
            :disabled="gameState.gameOver || gameState.isPerforming"
          >
            <span class="skill-icon">💨</span>
            <span class="key">J</span>
            <span class="name">轻快走位</span>
          </button>
          <button 
            class="skill-btn basic-k"
            @click="performAction('strongPose')"
            :disabled="gameState.gameOver || gameState.isPerforming"
          >
            <span class="skill-icon">💪</span>
            <span class="key">K</span>
            <span class="name">强势定格</span>
          </button>
          <button 
            class="skill-btn basic-l"
            @click="performAction('lightDance')"
            :disabled="gameState.gameOver || gameState.isPerforming"
          >
            <span class="skill-icon">💃</span>
            <span class="key">L</span>
            <span class="name">轻快舞步</span>
          </button>
          <button 
            class="skill-btn basic-u"
            @click="performAction('explosiveMove')"
            :disabled="gameState.gameOver || gameState.isPerforming"
          >
            <span class="skill-icon">💥</span>
            <span class="key">U</span>
            <span class="name">炸裂舞步</span>
          </button>
          
          <div class="skill-separator"></div>
          
          <button 
            class="skill-btn special-i"
            @click="useSkill('remoteSupport')"
            :disabled="isSkillOnCooldown('remoteSupport') || gameState.gameOver || gameState.isPerforming"
          >
            <span class="skill-icon">💜</span>
            <span class="key">I</span>
            <span class="name">隔空应援</span>
            <span v-if="isSkillOnCooldown('remoteSupport')" style="font-size: 9px; opacity: 0.7;">
              {{ getCooldownTime('remoteSupport') }}s
            </span>
          </button>
          <button 
            class="skill-btn special-o"
            @click="useSkill('stageSpotlight')"
            :disabled="isSkillOnCooldown('stageSpotlight') || gameState.gameOver || gameState.isPerforming"
          >
            <span class="skill-icon">✨</span>
            <span class="key">O</span>
            <span class="name">舞台高光</span>
            <span v-if="isSkillOnCooldown('stageSpotlight')" style="font-size: 9px; opacity: 0.7;">
              {{ getCooldownTime('stageSpotlight') }}s
            </span>
          </button>
          <button 
            class="skill-btn special-p"
            @click="useSkill('beatJump')"
            :disabled="isSkillOnCooldown('beatJump') || gameState.gameOver || gameState.isPerforming"
          >
            <span class="skill-icon">💗</span>
            <span class="key">P</span>
            <span class="name">拍动连跳</span>
            <span v-if="isSkillOnCooldown('beatJump')" style="font-size: 9px; opacity: 0.7;">
              {{ getCooldownTime('beatJump') }}s
            </span>
          </button>
        </div>
        
        <div v-if="gameState.gameOver" class="game-over-overlay">
          <h1 class="game-over-title">{{ gameState.winner === 'player' ? '🎉 全场喝彩!' : '😢 惜败...' }}</h1>
          <div class="game-over-stats">
            <p>你的喝彩值: <span>{{ Math.round(gameState.playerCheer) }}</span></p>
            <p>对手喝彩值: <span>{{ Math.round(gameState.opponentCheer) }}</span></p>
            <p>最大连击: <span>{{ gameState.maxCombo }}</span></p>
            <p>游戏时长: <span>{{ gameState.duration }}秒</span></p>
          </div>
          <div class="game-over-buttons">
            <button class="btn-game-over primary" @click="restartGame">🔄 再来一局</button>
            <button class="btn-game-over secondary" @click="goBack">🏠 返回首页</button>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const gameLogic = new GameLogic();
    const gameState = Vue.reactive({
      ...gameLogic.getState(),
      isPerforming: false,
      currentSkillClass: '',
      currentAction: ''
    });
    
    let opponentInterval = null;
    let saveInterval = null;
    
    const updateState = () => {
      const state = gameLogic.getState();
      Object.assign(gameState, state);
    };
    
    const performAction = (actionType) => {
      if (gameState.gameOver || gameState.isPerforming) return;
      
      gameState.isPerforming = true;
      gameState.currentAction = actionType;
      gameLogic.performAction(actionType, true);
      gameLogic.triggerAudienceCheer(true);
      updateState();
      
      setTimeout(() => {
        gameState.isPerforming = false;
        gameState.currentAction = '';
      }, 700);
    };
    
    const useSkill = (skillType) => {
      if (gameState.gameOver || gameState.isPerforming) return false;
      if (isSkillOnCooldown(skillType)) return false;
      
      const skillClassMap = {
        remoteSupport: 'remote',
        stageSpotlight: 'spotlight',
        beatJump: 'beat'
      };
      
      gameState.isPerforming = true;
      gameState.currentSkillClass = skillClassMap[skillType] || '';
      gameState.currentAction = skillType;
      
      const success = gameLogic.useSkill(skillType);
      if (success) {
        gameLogic.triggerAudienceCheer(true);
      }
      updateState();
      
      setTimeout(() => {
        gameState.isPerforming = false;
        gameState.currentSkillClass = '';
        gameState.currentAction = '';
      }, 1000);
      
      return success;
    };
    
    const isSkillOnCooldown = (skillType) => {
      const now = Date.now();
      return gameState.skillCooldowns[skillType] && now < gameState.skillCooldowns[skillType];
    };
    
    const getCooldownTime = (skillType) => {
      const now = Date.now();
      const cooldownEnd = gameState.skillCooldowns[skillType];
      if (!cooldownEnd || now >= cooldownEnd) return 0;
      return Math.ceil((cooldownEnd - now) / 1000);
    };
    
    const handleKeyDown = (e) => {
      if (gameState.gameOver) return;
      
      const keyMap = {
        'ArrowLeft': () => { gameLogic.moveLeft(); updateState(); },
        'ArrowRight': () => { gameLogic.moveRight(); updateState(); },
        'ArrowDown': () => { gameLogic.crouch(); updateState(); },
        'ArrowUp': () => { gameLogic.raiseEmotion(); updateState(); },
        'j': () => performAction('quickMove'),
        'J': () => performAction('quickMove'),
        'k': () => performAction('strongPose'),
        'K': () => performAction('strongPose'),
        'l': () => performAction('lightDance'),
        'L': () => performAction('lightDance'),
        'u': () => performAction('explosiveMove'),
        'U': () => performAction('explosiveMove'),
        'i': () => useSkill('remoteSupport'),
        'I': () => useSkill('remoteSupport'),
        'o': () => useSkill('stageSpotlight'),
        'O': () => useSkill('stageSpotlight'),
        'p': () => useSkill('beatJump'),
        'P': () => useSkill('beatJump')
      };
      
      if (keyMap[e.key]) {
        e.preventDefault();
        keyMap[e.key]();
      }
    };
    
    const startOpponentAI = () => {
      opponentInterval = setInterval(() => {
        if (!gameState.gameOver) {
          gameLogic.opponentAI();
          updateState();
        }
      }, GAME_CONFIG.OPPONENT_ACTION_INTERVAL);
    };
    
    const saveGameState = () => {
      if (!gameState.gameOver) {
        store.setGameState(gameLogic.getState());
      }
    };
    
    const saveGameRecord = async () => {
      if (store.isLoggedIn()) {
        await api.saveGameRecord(
          gameState.playerCheer,
          gameState.opponentCheer,
          gameState.winner === 'player',
          gameState.duration,
          Math.max(gameState.playerCheer, gameState.opponentCheer),
          gameState.maxCombo
        );
      }
    };
    
    const restartGame = () => {
      gameLogic.reset();
      gameState.isPerforming = false;
      gameState.currentSkillClass = '';
      updateState();
      store.clearGameState();
    };
    
    const goBack = () => {
      if (gameState.gameOver) {
        saveGameRecord();
        store.clearGameState();
      }
      window.location.hash = '#/home';
    };
    
    Vue.onMounted(() => {
      if (!store.isLoggedIn()) {
        window.location.hash = '#/login';
        return;
      }
      
      if (store.gameState && !store.gameState.gameOver) {
        gameLogic.loadState(store.gameState);
        updateState();
      }
      
      window.addEventListener('keydown', handleKeyDown);
      startOpponentAI();
      
      saveInterval = setInterval(() => {
        updateState();
        saveGameState();
      }, 100);
    });
    
    Vue.onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyDown);
      if (opponentInterval) clearInterval(opponentInterval);
      if (saveInterval) clearInterval(saveInterval);
    });
    
    return {
      gameState,
      BASIC_ACTIONS,
      SPECIAL_SKILLS,
      performAction,
      useSkill,
      isSkillOnCooldown,
      getCooldownTime,
      restartGame,
      goBack,
      Math
    };
  }
};
