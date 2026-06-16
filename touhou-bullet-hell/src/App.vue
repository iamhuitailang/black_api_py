<template>
  <div class="game-container" ref="gameContainer">
    <div class="game-wrapper" :style="{ position: 'relative' }">
      <canvas 
        ref="gameCanvas" 
        class="game-canvas"
        @click="onCanvasClick"
      ></canvas>
      
      <div v-if="gameState === 'menu'" class="menu-screen">
        <h1 class="menu-title">东方弹幕游戏</h1>
        <p class="menu-subtitle">Touhou Bullet Hell</p>
        
        <div class="character-select">
          <div 
            v-for="char in characterList" 
            :key="char.id"
            :class="['character-card', 
              { selected: selectedCharacter === char.id },
              { locked: !unlockedCharacters.includes(char.id) }
            ]"
            @click="selectCharacter(char.id)"
          >
            <div class="character-avatar" :style="{ 
              background: `radial-gradient(circle, ${char.color} 0%, ${char.secondaryColor} 100%)` 
            }">
              {{ char.emoji }}
            </div>
            <div class="character-name" :style="{ color: char.color }">{{ char.name }}</div>
            <div class="character-desc">{{ char.description }}</div>
            <div class="character-stats">
              <div class="stat-row">
                <span>伤害</span>
                <span>{{ char.damage }}</span>
              </div>
              <div class="stat-row">
                <span>速度</span>
                <span>{{ char.speed }}</span>
              </div>
              <div class="stat-row">
                <span>Bomb</span>
                <span>{{ getBombName(char.bombType) }}</span>
              </div>
            </div>
            <div v-if="!unlockedCharacters.includes(char.id)" style="color: #ff6666; margin-top: 10px; font-size: 12px;">
              🔒 通关后解锁
            </div>
          </div>
        </div>
        
        <button 
          class="btn" 
          @click="startGame"
          :disabled="!selectedCharacter || !unlockedCharacters.includes(selectedCharacter)"
        >
          开始游戏
        </button>
        
        <button 
          v-if="hasQuickSave" 
          class="btn btn-secondary" 
          @click="continueGame"
        >
          继续游戏
        </button>
        
        <div class="instructions">
          <h3>操作说明</h3>
          <p><span class="key">↑↓←→</span> 或 <span class="key">WASD</span> 移动</p>
          <p><span class="key">Z</span> 射击（按住连射）</p>
          <p><span class="key">X</span> 使用Bomb</p>
          <p><span class="key">Shift</span> 低速模式（显示判定点）</p>
          <p><span class="key">ESC</span> 暂停</p>
          <p style="color: #ffd700; margin-top: 10px;">💡 擦弹：敌弹距中心8px内未命中时+500分，连续10次+0.1倍得分</p>
        </div>
        
        <div v-if="highScore > 0" style="margin-top: 20px; color: #ffd700;">
          最高分: {{ formatNumber(highScore) }}
        </div>
      </div>
      
      <div v-if="gameState === 'playing'" class="hud-overlay">
        <div v-if="engine?.bossPhase && engine?.boss" class="boss-ui">
          <div class="boss-name">{{ BOSS.name }}</div>
          <div class="boss-hp-bar">
            <div 
              class="boss-hp-fill" 
              :style="{ width: (engine.boss.hp / BOSS.maxHp * 100) + '%' }"
            ></div>
          </div>
        </div>
        
        <div v-if="engine?.stageClear && !engine?.gameOver" class="stage-clear-screen">
          <h2 class="result-title win">关卡通过!</h2>
          <div class="result-stats">
            <div class="result-stat-row">
              <span class="result-stat-label">当前得分</span>
              <span class="result-stat-value">{{ formatNumber(engine.score) }}</span>
            </div>
          </div>
          <p style="color: #a0a0c0;">准备下一关...</p>
        </div>
      </div>
      
      <div v-if="gameState === 'paused'" class="menu-screen">
        <h1 class="menu-title">暂停</h1>
        <button class="btn" @click="resumeGame">继续游戏</button>
        <button class="btn btn-secondary" @click="quitToMenu">返回菜单</button>
      </div>
      
      <div v-if="gameState === 'gameOver'" class="game-over-screen">
        <h1 :class="['result-title', engine?.allClear ? 'win' : 'lose']">
          {{ engine?.allClear ? '🎉 全部通关！' : '💀 游戏结束' }}
        </h1>
        <div class="result-stats">
          <div class="result-stat-row">
            <span class="result-stat-label">最终得分</span>
            <span class="result-stat-value">
              {{ formatNumber(engine?.score || 0) }}
              <span v-if="isNewHighScore" class="high-score-badge">新纪录!</span>
            </span>
          </div>
          <div class="result-stat-row">
            <span class="result-stat-label">擦弹次数</span>
            <span class="result-stat-value">{{ engine?.grazeCount || 0 }}</span>
          </div>
          <div class="result-stat-row">
            <span class="result-stat-label">最高倍率</span>
            <span class="result-stat-value">x{{ (engine?.scoreMultiplier || 1).toFixed(1) }}</span>
          </div>
          <div class="result-stat-row">
            <span class="result-stat-label">到达关卡</span>
            <span class="result-stat-value">{{ engine?.bossPhase ? 'Boss战' : `第${engine?.currentStage || 1}关` }}</span>
          </div>
        </div>
        <button class="btn" @click="restartGame">再来一局</button>
        <button class="btn btn-secondary" @click="quitToMenu">返回菜单</button>
      </div>
    </div>
    
    <div v-if="gameState === 'playing' && engine" class="sidebar">
      <div class="hud-item">
        <div class="hud-label">得分</div>
        <div class="hud-value">{{ formatNumber(engine.score) }}</div>
      </div>
      
      <div class="hud-item">
        <div class="hud-label">倍率</div>
        <div class="hud-value" style="color: #ff6b9d;">x{{ engine.scoreMultiplier.toFixed(1) }}</div>
      </div>
      
      <div class="hud-item">
        <div class="hud-label">关卡</div>
        <div class="hud-value" style="color: #6366f1;">
          {{ engine.bossPhase ? 'BOSS' : `${engine.currentStage}/${STAGES.length}` }}
        </div>
      </div>
      
      <div class="hud-item">
        <div class="hud-label">擦弹</div>
        <div class="hud-value" style="color: #44ffff;">{{ engine.grazeCount }}</div>
      </div>
      
      <div class="hud-item">
        <div class="hud-label">连续擦弹</div>
        <div class="hud-value" style="color: #ff66ff;">
          {{ engine.consecutiveGraze }}/10
          <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.2); margin-top: 5px; border-radius: 2px;">
            <div 
              style="height: 100%; background: linear-gradient(90deg, #ff66ff, #ff6b9d); border-radius: 2px; transition: width 0.2s;"
              :style="{ width: (engine.consecutiveGraze / 10 * 100) + '%' }"
            ></div>
          </div>
        </div>
      </div>
      
      <div class="hud-item">
        <div class="hud-label">Bomb</div>
        <div class="hud-value" style="color: #ffd700;">
          {{ '💣'.repeat(engine.player.bombs) }}{{ '⚫'.repeat(engine.player.maxBombs - engine.player.bombs) }}
        </div>
      </div>
      
      <div class="hud-item">
        <div class="hud-label">生命</div>
        <div class="hud-value" style="color: #ff4444;">
          {{ '❤️'.repeat(Math.max(0, engine.player.lives)) }}
        </div>
      </div>
      
      <div class="hud-item">
        <div class="hud-label">最高分</div>
        <div class="hud-value" style="font-size: 16px;">{{ formatNumber(highScore) }}</div>
      </div>
      
      <div v-if="!engine.bossPhase" class="hud-item">
        <div class="hud-label">关卡进度</div>
        <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.2); border-radius: 4px;">
          <div 
            style="height: 100%; background: linear-gradient(90deg, #6366f1, #ff6b9d); border-radius: 4px; transition: width 0.3s;"
            :style="{ width: getStageProgress() + '%' }"
          ></div>
        </div>
      </div>
      
      <button class="btn btn-secondary" @click="togglePause" style="margin-top: 20px;">
        暂停
      </button>
      
      <button class="btn" @click="quitToMenu" style="background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);">
        放弃
      </button>
    </div>
  </div>
</template>

<script setup>import { ref, onMounted, onUnmounted, computed } from 'vue';
import { GameEngine } from './game/engine.js';
import { CHARACTERS, STAGES, BOSS } from './game/constants.js';
import { audioManager } from './game/audio.js';
import { loadSave, loadGameState, clearQuickSave } from './game/storage.js';
const gameCanvas = ref(null);
const gameContainer = ref(null);
const engine = ref(null);
const gameState = ref('menu');
const selectedCharacter = ref('reimu');
const highScore = ref(0);
const unlockedCharacters = ref(['reimu', 'marisa']);
const hasQuickSave = ref(false);
const isNewHighScore = ref(false);
const characterList = Object.values(CHARACTERS);
function formatNumber(num) {
 return num.toLocaleString();
}
function getBombName(type) {
 const names = {
 screenClear: '全屏消弹',
 laser: '激光贯穿',
 slowField: '减速力场'
 };
 return names[type] || type;
}
function selectCharacter(id) {
 if (unlockedCharacters.value.includes(id)) {
 selectedCharacter.value = id;
 audioManager.playSelect();
 }
}
function onCanvasClick() {
 audioManager.resume();
}
function startGame() {
 if (!selectedCharacter.value)
 return;
 audioManager.init();
 audioManager.resume();
 isNewHighScore.value = false;
 engine.value = new GameEngine(gameCanvas.value);
 engine.value.start(selectedCharacter.value);
 gameState.value = 'playing';
 startUpdateLoop();
}
function continueGame() {
 const saveData = loadGameState();
 if (!saveData)
 return;
 audioManager.init();
 audioManager.resume();
 isNewHighScore.value = false;
 selectedCharacter.value = saveData.characterId;
 engine.value = new GameEngine(gameCanvas.value);
 engine.value.startFromSave(saveData);
 gameState.value = 'playing';
 startUpdateLoop();
}
function restartGame() {
 clearQuickSave();
 startGame();
}
function togglePause() {
 if (!engine.value)
 return;
 engine.value.togglePause();
 gameState.value = engine.value.paused ? 'paused' : 'playing';
}
function resumeGame() {
 if (!engine.value)
 return;
 engine.value.togglePause();
 gameState.value = 'playing';
}
function quitToMenu() {
 if (engine.value) {
 engine.value.destroy();
 engine.value = null;
 }
 stopUpdateLoop();
 gameState.value = 'menu';
 loadSaveData();
}
let updateInterval = null;
function startUpdateLoop() {
 stopUpdateLoop();
 updateInterval = setInterval(() => {
 if (!engine.value)
 return;
 if (engine.value.gameOver) {
 isNewHighScore.value = engine.value.isNewHighScore;
 gameState.value = 'gameOver';
 stopUpdateLoop();
 }
 else if (engine.value.paused) {
 gameState.value = 'paused';
 }
 else if (gameState.value === 'paused' && !engine.value.paused) {
 gameState.value = 'playing';
 }
 }, 100);
}
function stopUpdateLoop() {
 if (updateInterval) {
 clearInterval(updateInterval);
 updateInterval = null;
 }
}
function getStageProgress() {
 if (!engine.value || engine.value.bossPhase)
 return 100;
 const stage = STAGES[engine.value.currentStage - 1];
 if (!stage)
 return 100;
 return Math.min(100, (engine.value.stageElapsed / stage.duration) * 100);
}
function loadSaveData() {
 const save = loadSave();
 highScore.value = save.highScore;
 unlockedCharacters.value = save.unlockedCharacters;
 const quickSave = loadGameState();
 hasQuickSave.value = quickSave !== null;
}
onMounted(() => {
 loadSaveData();
 window.addEventListener('keydown', handleGlobalKeydown);
});
onUnmounted(() => {
 stopUpdateLoop();
 if (engine.value) {
 engine.value.destroy();
 }
 window.removeEventListener('keydown', handleGlobalKeydown);
});
function handleGlobalKeydown(e) {
 if (e.code === 'Escape' && gameState.value === 'playing') {
 e.preventDefault();
 togglePause();
 }
}
</script>
