<template>
  <div class="game-container" :class="{ 'night-mode': !isDay }">
    <div class="sky-layer" :style="skyStyle"></div>
    
    <div class="game-header">
      <div class="header-left">
        <h1 class="game-title">🏜️ 孤城守卫</h1>
        <span class="day-info">第 {{ gameState?.day || 1 }} 天 - {{ phaseText }}</span>
        <span v-if="gameState?.is_siege_day" class="siege-warning">⚠️ 攻城日</span>
      </div>
      <div class="header-center">
        <div class="time-progress-container">
          <span class="time-label">{{ isDay ? '☀️' : '🌙' }}</span>
          <div class="time-progress-bar">
            <div 
              class="time-progress-fill" 
              :class="{ 'day-fill': isDay, 'night-fill': !isDay }"
              :style="{ width: timeProgress + '%' }"
            ></div>
          </div>
          <span class="time-label">{{ isDay ? '🌙' : '☀️' }}</span>
        </div>
      </div>
      <div class="header-right">
        <button @click="skipTime" class="btn-skip" :disabled="isPaused || isGameOver">
          ⏩ 快进
        </button>
        <button @click="togglePause" class="btn-pause">
          {{ isPaused ? '▶ 继续' : '⏸ 暂停' }}
        </button>
      </div>
    </div>

    <div class="game-main">
      <div class="sidebar left-sidebar">
        <div class="resource-panel">
          <h3>📦 资源</h3>
          <div class="resource-item">
            <span class="resource-icon">💧</span>
            <div class="resource-info">
              <span class="resource-name">水源</span>
              <span class="resource-value">{{ gameState?.water || 0 }}</span>
            </div>
          </div>
          <div class="resource-item">
            <span class="resource-icon">🏹</span>
            <div class="resource-info">
              <span class="resource-name">箭矢</span>
              <span class="resource-value">{{ gameState?.arrows || 0 }}</span>
            </div>
          </div>
          <div class="resource-item">
            <span class="resource-icon">🛢️</span>
            <div class="resource-info">
              <span class="resource-name">油料</span>
              <span class="resource-value">{{ gameState?.oil || 0 }}</span>
            </div>
          </div>
          <div class="resource-item">
            <span class="resource-icon">⏱️</span>
            <div class="resource-info">
              <span class="resource-name">工时</span>
              <span class="resource-value">{{ gameState?.work_hours || 0 }} / {{ gameState?.max_work_hours || 100 }}</span>
            </div>
          </div>
        </div>

        <div class="fortress-hp-panel">
          <h3>🏰 要塞</h3>
          <div class="hp-bar">
            <div class="hp-fill" :style="{ width: hpPercent + '%' }"></div>
          </div>
          <span class="hp-text">{{ gameState?.fortress_hp || 0 }} / {{ gameState?.max_fortress_hp || 500 }}</span>
        </div>

        <div class="craft-panel" v-if="isDay">
          <h3>🔨 制作</h3>
          <button @click="craftArrows" class="btn-craft" :disabled="!canCraftArrows">
            制作箭矢 x5 (消耗10工时)
          </button>
          <button @click="craftOil" class="btn-craft" :disabled="!canCraftOil">
            炼制油料 x3 (消耗6工时)
          </button>
        </div>
      </div>

      <div class="battlefield-container">
        <canvas
          ref="canvasRef"
          :width="canvasWidth"
          :height="canvasHeight"
          class="battlefield-canvas"
          @click="handleCanvasClick"
          @mousemove="handleCanvasMouseMove"
        ></canvas>
        
        <div v-if="selectedBuildingType && isDay" class="build-hint">
          点击战场放置 {{ buildingConfig[selectedBuildingType]?.name }}
          <button @click="cancelBuild" class="btn-cancel">取消</button>
        </div>

        <div v-if="isNight && activeWave" class="wave-info">
          ⚔️ 敌军: {{ activeWave.enemies_remaining }} / {{ activeWave.total_enemies }}
          <span v-if="activeWave.is_siege" class="siege-tag">攻城</span>
        </div>
      </div>

      <div class="sidebar right-sidebar">
        <div class="build-panel" v-if="isDay">
          <h3>🏗️ 建造</h3>
          <div
            v-for="(config, type) in buildingConfig"
            :key="type"
            class="build-item"
            :class="{ 'selected': selectedBuildingType === type, 'disabled': !canBuild(type) }"
            @click="selectBuildType(type)"
          >
            <div class="build-icon" :style="{ backgroundColor: config.color }"></div>
            <div class="build-info">
              <span class="build-name">{{ config.name }}</span>
              <span class="build-desc">{{ config.description }}</span>
              <div class="build-cost">
                <span v-if="config.cost_work_hours">⏱️ {{ config.cost_work_hours }}</span>
                <span v-if="config.cost_water">💧 {{ config.cost_water }}</span>
                <span>⏳ {{ config.build_time }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="log-panel">
          <h3>📜 战报</h3>
          <div class="log-list">
            <div
              v-for="log in logs"
              :key="log.id"
              class="log-item"
              :class="'log-' + log.log_type"
            >
              {{ log.message }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isGameOver" class="game-over-overlay">
      <div class="game-over-content">
        <h2>💀 要塞陷落</h2>
        <p>你坚守了 {{ gameState?.day }} 天</p>
        <button @click="startNewGame" class="btn-restart">重新开始</button>
      </div>
    </div>

    <div v-if="showStartScreen" class="start-overlay">
      <div class="start-content">
        <h1>🏜️ 孤城守卫</h1>
        <p class="subtitle">烈日下的孤城，你是最后的守城将军</p>
        <div class="game-intro">
          <p>☀️ 白天：修建防御工事，收集绿洲水源</p>
          <p>🌙 夜晚：抵御沙虫和流寇的进攻</p>
          <p>⚔️ 每7天：大规模攻城，提前做好准备</p>
        </div>
        <button @click="startNewGame" class="btn-start">开始守城</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useGameStore } from '@/stores/gameStore';

const gameStore = useGameStore();
const {
  gameState,
  buildings,
  activeWave,
  logs,
  buildingConfig,
  selectedBuildingType,
  isPaused,
  isDay,
  isNight,
  isGameOver,
  wormPositions
} = storeToRefs(gameStore);

const {
  newGame,
  getGameState,
  autoLoadGame,
  buildStructure,
  togglePause,
  selectBuildingType: setSelectedBuildingType,
  getWormPositions,
  startGameLoop,
  stopGameLoop
} = gameStore;
const canvasRef = ref<HTMLCanvasElement | null>(null);
const canvasWidth = 800;
const canvasHeight = 500;
const showStartScreen = ref(true);
const mousePosition = ref({ x: -1, y: -1 });
const animationFrameId = ref<number | null>(null);
const enemies = ref<any[]>([]);
const projectiles = ref<any[]>([]);
const GRID_COLS = 10;
const GRID_ROWS = 5;
const CELL_WIDTH = canvasWidth / GRID_COLS;
const CELL_HEIGHT = canvasHeight / GRID_ROWS;
const FORTRESS_COLS = 2;
const hpPercent = computed(() => {
  if (!gameState.value) return 100;
  return (gameState.value.fortress_hp / gameState.value.max_fortress_hp) * 100;
});

const timeProgress = computed(() => {
  if (!gameState.value) return 0;
  return (gameState.value.time_of_day || 0) * 100;
});
const phaseText = computed(() => {
 if (!gameState.value)
 return '白天';
 return gameState.value.phase === 'day' ? '☀️ 白天' : '🌙 夜晚';
});
const skyStyle = computed(() => {
 if (!gameState.value) {
 return { background: 'linear-gradient(180deg, #f4a460 0%, #daa520 50%, #cd853f 100%)' };
 }
 const t = gameState.value.time_of_day || 0;
 if (gameState.value.phase === 'day') {
 const sunHeight = Math.sin(t * Math.PI);
 const r = Math.floor(244 - sunHeight * 20);
 const g = Math.floor(164 + sunHeight * 40);
 const b = Math.floor(96 + sunHeight * 60);
 return { background: `linear-gradient(180deg, rgb(${r},${g},${b}) 0%, #daa520 50%, #cd853f 100%)` };
 }
 else {
 const moonHeight = Math.sin(t * Math.PI);
 const r = Math.floor(30 + moonHeight * 20);
 const g = Math.floor(40 + moonHeight * 30);
 const b = Math.floor(80 + moonHeight * 40);
 return { background: `linear-gradient(180deg, rgb(${r},${g},${b}) 0%, #1a1a2e 50%, #16213e 100%)` };
 }
});
const canCraftArrows = computed(() => {
 return isDay.value && (gameState.value?.work_hours || 0) >= 10;
});
const canCraftOil = computed(() => {
 return isDay.value && (gameState.value?.work_hours || 0) >= 6;
});
function canBuild(type: string): boolean {
 if (!isDay.value || !gameState.value)
 return false;
 const config = buildingConfig.value[type];
 if (!config)
 return false;
 if (gameState.value.work_hours < config.cost_work_hours)
 return false;
 if (config.cost_water && gameState.value.water < config.cost_water)
 return false;
 return true;
}
function selectBuildType(type: string) {
 if (canBuild(type)) {
 setSelectedBuildingType(type);
 }
}
function cancelBuild() {
 setSelectedBuildingType(null);
}
async function craftArrows() {
 if (canCraftArrows.value) {
 await gameStore.collectResource('arrows', 5);
 }
}
async function craftOil() {
 if (canCraftOil.value) {
 await gameStore.collectResource('oil', 3);
 }
}
async function startNewGame() {
  showStartScreen.value = false;
  await newGame();
}

async function skipTime() {
  if (isPaused.value || isGameOver.value) return;
  await gameStore.advanceTime(0.2);
}
function handleCanvasClick(event: MouseEvent) {
 if (!selectedBuildingType.value || !isDay.value)
 return;
 const canvas = canvasRef.value;
 if (!canvas)
 return;
 const rect = canvas.getBoundingClientRect();
 const x = event.clientX - rect.left;
 const y = event.clientY - rect.top;
 const gridX = Math.floor(x / CELL_WIDTH);
 const gridY = Math.floor(y / CELL_HEIGHT);
 if (gridX >= FORTRESS_COLS && gridX < GRID_COLS && gridY >= 0 && gridY < GRID_ROWS) {
 const existing = buildings.value.find(b => b.position_x === gridX && b.position_y === gridY);
 if (!existing) {
 buildStructure(selectedBuildingType.value, gridX, gridY);
 setSelectedBuildingType(null);
 }
 }
}
function handleCanvasMouseMove(event: MouseEvent) {
 const canvas = canvasRef.value;
 if (!canvas)
 return;
 const rect = canvas.getBoundingClientRect();
 mousePosition.value = {
 x: event.clientX - rect.left,
 y: event.clientY - rect.top
 };
}
function draw() {
 const canvas = canvasRef.value;
 if (!canvas)
 return;
 const ctx = canvas.getContext('2d');
 if (!ctx)
 return;
 ctx.clearRect(0, 0, canvasWidth, canvasHeight);
 drawGround(ctx);
 drawFortress(ctx);
 drawGrid(ctx);
 drawBuildings(ctx);
 if (isNight.value) {
 drawEnemies(ctx);
 drawProjectiles(ctx);
 drawWormWarnings(ctx);
 }
 if (selectedBuildingType.value && isDay.value && mousePosition.value.x > 0) {
 drawBuildPreview(ctx);
 }
 drawLighting(ctx);
 animationFrameId.value = requestAnimationFrame(draw);
}
function drawGround(ctx: CanvasRenderingContext2D) {
 const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
 if (isDay.value) {
 gradient.addColorStop(0, '#d2691e');
 gradient.addColorStop(0.3, '#daa520');
 gradient.addColorStop(1, '#b8860b');
 }
 else {
 gradient.addColorStop(0, '#2d2d44');
 gradient.addColorStop(0.3, '#3d3d5c');
 gradient.addColorStop(1, '#2a2a40');
 }
 ctx.fillStyle = gradient;
 ctx.fillRect(0, canvasHeight * 0.6, canvasWidth, canvasHeight * 0.4);
 ctx.fillStyle = isDay.value ? '#c4a35a' : '#3a3a50';
 for (let i = 0; i < 5; i++) {
 const duneY = canvasHeight * 0.65 + i * 20;
 ctx.beginPath();
 ctx.moveTo(0, duneY);
 for (let x = 0; x <= canvasWidth; x += 50) {
 ctx.quadraticCurveTo(x + 25, duneY - 10 - (i % 2) * 5, x + 50, duneY);
 }
 ctx.lineTo(canvasWidth, canvasHeight);
 ctx.lineTo(0, canvasHeight);
 ctx.closePath();
 ctx.globalAlpha = 0.3;
 ctx.fill();
 ctx.globalAlpha = 1;
 }
}
function drawFortress(ctx: CanvasRenderingContext2D) {
 const fortressWidth = FORTRESS_COLS * CELL_WIDTH;
 const fortressHeight = canvasHeight;
 ctx.fillStyle = isDay.value ? '#8b7355' : '#4a3f35';
 ctx.fillRect(0, canvasHeight * 0.3, fortressWidth, fortressHeight * 0.7);
 ctx.fillStyle = isDay.value ? '#6b5344' : '#3a2f25';
 for (let i = 0; i < 4; i++) {
 const y = canvasHeight * 0.35 + i * (fortressHeight * 0.15);
 ctx.fillRect(0, y, fortressWidth * 0.1, 20);
 ctx.fillRect(fortressWidth * 0.6, y, fortressWidth * 0.4, 20);
 }
 ctx.fillStyle = isDay.value ? '#a08060' : '#5a4f40';
 ctx.fillRect(0, canvasHeight * 0.25, fortressWidth, 15);
 for (let i = 0; i < 6; i++) {
 const x = i * (fortressWidth / 6);
 ctx.fillRect(x, canvasHeight * 0.2, fortressWidth / 12, 10);
 }
 const flagX = fortressWidth * 0.7;
 const flagY = canvasHeight * 0.15;
 ctx.strokeStyle = '#4a3728';
 ctx.lineWidth = 3;
 ctx.beginPath();
 ctx.moveTo(flagX, flagY);
 ctx.lineTo(flagX, canvasHeight * 0.25);
 ctx.stroke();
 ctx.fillStyle = '#8b0000';
 ctx.beginPath();
 ctx.moveTo(flagX, flagY);
 ctx.lineTo(flagX + 30, flagY + 10);
 ctx.lineTo(flagX, flagY + 20);
 ctx.closePath();
 ctx.fill();
 const hpRatio = hpPercent.value / 100;
 ctx.fillStyle = '#333';
 ctx.fillRect(10, canvasHeight * 0.9, fortressWidth - 20, 15);
 ctx.fillStyle = hpRatio > 0.5 ? '#4caf50' : hpRatio > 0.25 ? '#ff9800' : '#f44336';
 ctx.fillRect(10, canvasHeight * 0.9, (fortressWidth - 20) * hpRatio, 15);
}
function drawGrid(ctx: CanvasRenderingContext2D) {
 if (!isDay.value)
 return;
 ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
 ctx.lineWidth = 1;
 for (let x = FORTRESS_COLS; x <= GRID_COLS; x++) {
 ctx.beginPath();
 ctx.moveTo(x * CELL_WIDTH, 0);
 ctx.lineTo(x * CELL_WIDTH, canvasHeight);
 ctx.stroke();
 }
 for (let y = 0; y <= GRID_ROWS; y++) {
 ctx.beginPath();
 ctx.moveTo(FORTRESS_COLS * CELL_WIDTH, y * CELL_HEIGHT);
 ctx.lineTo(canvasWidth, y * CELL_HEIGHT);
 ctx.stroke();
 }
}
function drawBuildings(ctx: CanvasRenderingContext2D) {
 buildings.value.forEach(building => {
 const x = building.position_x * CELL_WIDTH;
 const y = building.position_y * CELL_HEIGHT;
 const config = buildingConfig.value[building.building_type];
 if (!config)
 return;
 if (building.is_building) {
 ctx.globalAlpha = 0.5;
 ctx.fillStyle = '#888';
 ctx.fillRect(x + 5, y + 5, CELL_WIDTH - 10, CELL_HEIGHT - 10);
 const progress = building.build_progress / building.build_time;
 ctx.fillStyle = '#4caf50';
 ctx.fillRect(x + 5, y + CELL_HEIGHT - 15, (CELL_WIDTH - 10) * progress, 10);
 ctx.globalAlpha = 1;
 }
 else {
 drawBuilding(ctx, building.building_type, x, y, config);
 const hpRatio = building.hp / building.max_hp;
 if (hpRatio < 1) {
 ctx.fillStyle = '#333';
 ctx.fillRect(x + 5, y - 8, CELL_WIDTH - 10, 5);
 ctx.fillStyle = hpRatio > 0.5 ? '#4caf50' : hpRatio > 0.25 ? '#ff9800' : '#f44336';
 ctx.fillRect(x + 5, y - 8, (CELL_WIDTH - 10) * hpRatio, 5);
 }
 }
 });
}
function drawBuilding(ctx: CanvasRenderingContext2D, type: string, x: number, y: number, config: any) {
 const w = CELL_WIDTH - 10;
 const h = CELL_HEIGHT - 10;
 const cx = x + CELL_WIDTH / 2;
 const cy = y + CELL_HEIGHT / 2;
 switch (type) {
 case 'sandbag_wall':
 ctx.fillStyle = config.color;
 for (let row = 0; row < 3; row++) {
 for (let col = 0; col < 2; col++) {
 const bagX = x + 8 + col * (w / 2);
 const bagY = y + 10 + row * (h / 3);
 ctx.beginPath();
 ctx.ellipse(bagX + w / 4, bagY + h / 6, w / 4 - 2, h / 6 - 2, 0, 0, Math.PI * 2);
 ctx.fill();
 }
 }
 ctx.strokeStyle = '#8b6914';
 ctx.lineWidth = 1;
 ctx.strokeRect(x + 6, y + 8, w - 2, h - 6);
 break;
 case 'arrow_tower':
 ctx.fillStyle = '#8b4513';
 ctx.fillRect(cx - 15, y + 15, 30, h - 20);
 ctx.fillStyle = '#654321';
 ctx.beginPath();
 ctx.moveTo(cx - 20, y + 15);
 ctx.lineTo(cx, y + 5);
 ctx.lineTo(cx + 20, y + 15);
 ctx.closePath();
 ctx.fill();
 ctx.fillStyle = '#2f1810';
 ctx.fillRect(cx - 5, cy - 5, 10, 15);
 if (isNight.value) {
 ctx.strokeStyle = 'rgba(255, 200, 100, 0.3)';
 ctx.lineWidth = 2;
 ctx.beginPath();
 ctx.arc(cx, cy, config.range * CELL_WIDTH, 0, Math.PI * 2);
 ctx.stroke();
 }
 break;
 case 'oil_trough':
 ctx.fillStyle = '#2f1810';
 ctx.fillRect(x + 10, cy - 10, w - 20, 25);
 ctx.fillStyle = '#4a3728';
 ctx.fillRect(x + 8, cy - 15, w - 16, 8);
 ctx.fillStyle = '#8b4513';
 ctx.beginPath();
 ctx.arc(cx, cy + 2, 12, 0, Math.PI * 2);
 ctx.fill();
 if (isNight.value) {
 ctx.fillStyle = 'rgba(255, 100, 50, 0.2)';
 ctx.beginPath();
 ctx.arc(cx, cy, config.range * CELL_WIDTH, 0, Math.PI * 2);
 ctx.fill();
 }
 break;
 case 'seismic_drum':
 ctx.fillStyle = '#654321';
 ctx.beginPath();
 ctx.ellipse(cx, cy + 10, 20, 8, 0, 0, Math.PI * 2);
 ctx.fill();
 ctx.fillStyle = config.color;
 ctx.beginPath();
 ctx.ellipse(cx, cy, 18, 22, 0, 0, Math.PI * 2);
 ctx.fill();
 ctx.fillStyle = '#8b6914';
 ctx.beginPath();
 ctx.ellipse(cx, cy - 5, 12, 5, 0, 0, Math.PI * 2);
 ctx.fill();
 if (isNight.value) {
 const time = Date.now() / 500;
 for (let i = 0; i < 3; i++) {
 const radius = ((time + i * 0.3) % 1) * config.range * CELL_WIDTH;
 ctx.strokeStyle = `rgba(200, 150, 100, ${1 - radius / (config.range * CELL_WIDTH)})`;
 ctx.lineWidth = 2;
 ctx.beginPath();
 ctx.arc(cx, cy, radius, 0, Math.PI * 2);
 ctx.stroke();
 }
 }
 break;
 case 'oasis_well':
 ctx.fillStyle = '#6b8e23';
 ctx.beginPath();
 ctx.ellipse(cx, cy + 15, 25, 10, 0, 0, Math.PI * 2);
 ctx.fill();
 ctx.fillStyle = '#4a90a4';
 ctx.beginPath();
 ctx.ellipse(cx, cy + 5, 15, 8, 0, 0, Math.PI * 2);
 ctx.fill();
 ctx.fillStyle = '#8b7355';
 ctx.fillRect(cx - 3, cy - 20, 6, 30);
 ctx.fillStyle = '#a08060';
 ctx.fillRect(cx - 12, cy - 25, 24, 8);
 break;
 }
}
function drawEnemies(ctx: CanvasRenderingContext2D) {
 if (!activeWave.value || activeWave.value.enemies_remaining <= 0)
 return;
 const numEnemies = Math.min(activeWave.value.enemies_remaining, 8);
 const time = Date.now() / 1000;
 for (let i = 0; i < numEnemies; i++) {
 const row = i % 5;
 const progress = ((time * 0.3 + i * 0.5) % 1);
 const x = canvasWidth - progress * (canvasWidth - FORTRESS_COLS * CELL_WIDTH - 50);
 const y = row * CELL_HEIGHT + CELL_HEIGHT / 2 + Math.sin(time + i) * 5;
 ctx.fillStyle = '#4a3728';
 ctx.beginPath();
 ctx.arc(x, y, 15, 0, Math.PI * 2);
 ctx.fill();
 ctx.fillStyle = '#6b5344';
 ctx.beginPath();
 ctx.arc(x - 5, y - 8, 10, 0, Math.PI * 2);
 ctx.fill();
 ctx.fillStyle = '#ff4444';
 ctx.beginPath();
 ctx.arc(x - 8, y - 10, 2, 0, Math.PI * 2);
 ctx.arc(x - 2, y - 10, 2, 0, Math.PI * 2);
 ctx.fill();
 }
 if (wormPositions.value.length > 0) {
 wormPositions.value.forEach(worm => {
 const wx = FORTRESS_COLS * CELL_WIDTH + worm.x * CELL_WIDTH + CELL_WIDTH / 2;
 const wy = worm.y * CELL_HEIGHT + CELL_HEIGHT / 2;
 const pulse = Math.sin(time * 3) * 0.3 + 0.7;
 ctx.fillStyle = `rgba(255, 100, 100, ${pulse * 0.5})`;
 ctx.beginPath();
 ctx.arc(wx, wy, 30, 0, Math.PI * 2);
 ctx.fill();
 ctx.strokeStyle = '#ff4444';
 ctx.lineWidth = 2;
 ctx.setLineDash([5, 5]);
 ctx.stroke();
 ctx.setLineDash([]);
 });
 }
}
function drawProjectiles(ctx: CanvasRenderingContext2D) {
 const time = Date.now() / 100;
 const arrowTowers = buildings.value.filter(b => b.building_type === 'arrow_tower' && !b.is_building);
 arrowTowers.forEach((tower, idx) => {
 const tx = tower.position_x * CELL_WIDTH + CELL_WIDTH / 2;
 const ty = tower.position_y * CELL_HEIGHT + CELL_HEIGHT / 2;
 if (isNight.value && activeWave.value && activeWave.value.enemies_remaining > 0 && (gameState.value?.arrows || 0) > 0) {
 const arrowX = tx + Math.cos(time * 0.5 + idx) * 30;
 const arrowY = ty + Math.sin(time * 0.5 + idx) * 20 - 10;
 ctx.strokeStyle = '#8b4513';
 ctx.lineWidth = 2;
 ctx.beginPath();
 ctx.moveTo(tx, ty - 15);
 ctx.lineTo(arrowX, arrowY);
 ctx.stroke();
 ctx.fillStyle = '#666';
 ctx.beginPath();
 ctx.moveTo(arrowX, arrowY);
 ctx.lineTo(arrowX + 5, arrowY - 3);
 ctx.lineTo(arrowX + 5, arrowY + 3);
 ctx.closePath();
 ctx.fill();
 }
 });
 const oilTroughs = buildings.value.filter(b => b.building_type === 'oil_trough' && !b.is_building);
 oilTroughs.forEach((trough, idx) => {
 const tx = trough.position_x * CELL_WIDTH + CELL_WIDTH / 2;
 const ty = trough.position_y * CELL_HEIGHT + CELL_HEIGHT / 2;
 if (isNight.value && activeWave.value && activeWave.value.enemies_remaining > 0 && (gameState.value?.oil || 0) > 0) {
 const flicker = Math.sin(time * 0.3 + idx) * 0.2 + 0.8;
 ctx.fillStyle = `rgba(255, 100, 0, ${flicker * 0.3})`;
 ctx.beginPath();
 ctx.arc(tx, ty, 50 + Math.sin(time * 0.5) * 5, 0, Math.PI * 2);
 ctx.fill();
 for (let i = 0; i < 5; i++) {
 const angle = (time * 0.1 + i * Math.PI * 0.4) % (Math.PI * 2);
 const fx = tx + Math.cos(angle) * 35;
 const fy = ty + Math.sin(angle) * 25 - 10;
 ctx.fillStyle = '#ff6600';
 ctx.beginPath();
 ctx.ellipse(fx, fy, 4, 8, angle, 0, Math.PI * 2);
 ctx.fill();
 }
 }
 });
}
function drawWormWarnings(ctx: CanvasRenderingContext2D) {
}
function drawBuildPreview(ctx: CanvasRenderingContext2D) {
 if (!selectedBuildingType.value)
 return;
 const gridX = Math.floor(mousePosition.value.x / CELL_WIDTH);
 const gridY = Math.floor(mousePosition.value.y / CELL_HEIGHT);
 if (gridX >= FORTRESS_COLS && gridX < GRID_COLS && gridY >= 0 && gridY < GRID_ROWS) {
 const existing = buildings.value.find(b => b.position_x === gridX && b.position_y === gridY);
 const x = gridX * CELL_WIDTH;
 const y = gridY * CELL_HEIGHT;
 ctx.fillStyle = existing ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 255, 0, 0.3)';
 ctx.fillRect(x, y, CELL_WIDTH, CELL_HEIGHT);
 if (!existing) {
 const config = buildingConfig.value[selectedBuildingType.value];
 if (config) {
 ctx.globalAlpha = 0.7;
 drawBuilding(ctx, selectedBuildingType.value, x, y, config);
 ctx.globalAlpha = 1;
 }
 }
 }
}
function drawLighting(ctx: CanvasRenderingContext2D) {
 if (!gameState.value)
 return;
 const t = gameState.value.time_of_day || 0;
 if (gameState.value.phase === 'day') {
 const sunX = canvasWidth * 0.7;
 const sunY = 80 - Math.sin(t * Math.PI) * 50;
 const gradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 150);
 gradient.addColorStop(0, 'rgba(255, 255, 200, 0.4)');
 gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
 ctx.fillStyle = gradient;
 ctx.fillRect(0, 0, canvasWidth, canvasHeight);
 ctx.fillStyle = '#fff8dc';
 ctx.beginPath();
 ctx.arc(sunX, sunY, 30, 0, Math.PI * 2);
 ctx.fill();
 }
 else {
 const moonX = canvasWidth * 0.7;
 const moonY = 80 - Math.sin(t * Math.PI) * 40;
 const gradient = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 200);
 gradient.addColorStop(0, 'rgba(200, 200, 255, 0.15)');
 gradient.addColorStop(1, 'rgba(200, 200, 255, 0)');
 ctx.fillStyle = gradient;
 ctx.fillRect(0, 0, canvasWidth, canvasHeight);
 ctx.fillStyle = '#f0f0ff';
 ctx.beginPath();
 ctx.arc(moonX, moonY, 25, 0, Math.PI * 2);
 ctx.fill();
 ctx.fillStyle = '#1a1a2e';
 ctx.beginPath();
 ctx.arc(moonX + 8, moonY - 5, 20, 0, Math.PI * 2);
 ctx.fill();
 ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
 for (let i = 0; i < 20; i++) {
 const sx = (i * 137) % canvasWidth;
 const sy = (i * 73) % (canvasHeight * 0.5);
 const size = (i % 3) * 0.5 + 0.5;
 ctx.beginPath();
 ctx.arc(sx, sy, size, 0, Math.PI * 2);
 ctx.fill();
 }
 ctx.fillStyle = 'rgba(0, 0, 30, 0.3)';
 ctx.fillRect(0, 0, canvasWidth, canvasHeight);
 }
}
let wormCheckInterval: number | null = null;
let isLoading = ref(true);

onMounted(async () => {
  await nextTick();
  draw();
  
  const loaded = await autoLoadGame();
  if (loaded) {
    showStartScreen.value = false;
  }
  
  isLoading.value = false;
  
  wormCheckInterval = window.setInterval(() => {
    if (isNight.value && gameState.value) {
      getWormPositions();
    }
  }, 2000);
});

onUnmounted(() => {
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value);
  }
  if (wormCheckInterval) {
    clearInterval(wormCheckInterval);
  }
  stopGameLoop();
});
watch(() => gameState.value?.id, (newId) => {
 if (newId) {
 getWormPositions();
 }
});
</script>

<style scoped>
.game-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  font-family: 'Microsoft YaHei', sans-serif;
  transition: all 0.5s ease;
}

.sky-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.game-header {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.game-title {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  margin: 0;
}

.day-info {
  color: #ffd700;
  font-size: 16px;
}

.siege-warning {
  background: #ff4444;
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 14px;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.time-progress-container {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 300px;
}

.time-label {
  font-size: 20px;
}

.time-progress-bar {
  flex: 1;
  height: 10px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  overflow: hidden;
}

.time-progress-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 5px;
}

.day-fill {
  background: linear-gradient(90deg, #ffa500, #ffd700);
}

.night-fill {
  background: linear-gradient(90deg, #4a5568, #9f7aea);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-skip {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 215, 0, 0.3);
  color: #ffd700;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-skip:hover:not(:disabled) {
  background: rgba(255, 215, 0, 0.5);
}

.btn-skip:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-pause {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-pause:hover {
  background: rgba(255, 255, 255, 0.3);
}

.game-main {
  position: relative;
  z-index: 5;
  display: flex;
  height: calc(100vh - 60px);
  padding: 20px;
  gap: 20px;
}

.sidebar {
  width: 240px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.resource-panel,
.fortress-hp-panel,
.craft-panel,
.build-panel,
.log-panel {
  background: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  padding: 15px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.resource-panel h3,
.fortress-hp-panel h3,
.craft-panel h3,
.build-panel h3,
.log-panel h3 {
  margin: 0 0 12px 0;
  color: #ffd700;
  font-size: 16px;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.resource-icon {
  font-size: 20px;
  width: 30px;
  text-align: center;
}

.resource-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  color: #fff;
}

.resource-name {
  font-size: 13px;
}

.resource-value {
  font-weight: bold;
}

.hp-bar {
  width: 100%;
  height: 16px;
  background: #333;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 5px;
}

.hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: width 0.3s;
}

.hp-text {
  color: #fff;
  font-size: 12px;
}

.btn-craft {
  width: 100%;
  padding: 8px;
  margin-bottom: 8px;
  border: none;
  border-radius: 6px;
  background: #daa520;
  color: #333;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-craft:hover:not(:disabled) {
  background: #ffd700;
}

.btn-craft:disabled {
  background: #666;
  cursor: not-allowed;
  opacity: 0.5;
}

.build-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.build-item:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.build-item.selected {
  border-color: #ffd700;
  background: rgba(255, 215, 0, 0.2);
}

.build-item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.build-icon {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  flex-shrink: 0;
}

.build-info {
  flex: 1;
  min-width: 0;
}

.build-name {
  display: block;
  color: #fff;
  font-weight: bold;
  font-size: 13px;
  margin-bottom: 2px;
}

.build-desc {
  display: block;
  color: #aaa;
  font-size: 11px;
  margin-bottom: 4px;
}

.build-cost {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: #ffd700;
}

.battlefield-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.battlefield-canvas {
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  cursor: crosshair;
}

.build-hint {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.btn-cancel {
  padding: 5px 12px;
  border: none;
  border-radius: 4px;
  background: #ff4444;
  color: white;
  font-size: 12px;
  cursor: pointer;
}

.wave-info {
  position: absolute;
  top: 30px;
  right: 30px;
  background: rgba(255, 0, 0, 0.7);
  color: #fff;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
}

.siege-tag {
  background: #ffd700;
  color: #333;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-left: 8px;
}

.log-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 200px;
}

.log-list {
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
}

.log-item {
  padding: 6px 8px;
  margin-bottom: 4px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
}

.log-info {
  background: rgba(100, 150, 255, 0.2);
  color: #a0c0ff;
}

.log-warning {
  background: rgba(255, 200, 0, 0.2);
  color: #ffd700;
}

.log-danger {
  background: rgba(255, 50, 50, 0.2);
  color: #ff6666;
}

.log-build {
  background: rgba(100, 255, 100, 0.2);
  color: #90ee90;
}

.log-resource {
  background: rgba(0, 200, 200, 0.2);
  color: #00ced1;
}

.log-craft {
  background: rgba(200, 150, 100, 0.2);
  color: #deb887;
}

.log-victory {
  background: rgba(255, 215, 0, 0.3);
  color: #ffd700;
}

.log-damage {
  background: rgba(255, 100, 0, 0.2);
  color: #ff8c00;
}

.game-over-overlay,
.start-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.game-over-content,
.start-content {
  text-align: center;
  color: #fff;
}

.start-content h1 {
  font-size: 48px;
  margin-bottom: 10px;
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.5);
}

.subtitle {
  font-size: 18px;
  color: #ffd700;
  margin-bottom: 30px;
}

.game-intro {
  text-align: left;
  background: rgba(255, 255, 255, 0.1);
  padding: 20px 30px;
  border-radius: 10px;
  margin-bottom: 30px;
}

.game-intro p {
  margin: 10px 0;
  font-size: 16px;
}

.btn-start,
.btn-restart {
  padding: 15px 40px;
  font-size: 20px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #daa520, #ffd700);
  color: #333;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-start:hover,
.btn-restart:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(255, 215, 0, 0.4);
}

.game-over-content h2 {
  font-size: 36px;
  margin-bottom: 15px;
  color: #ff4444;
}

.game-over-content p {
  font-size: 18px;
  margin-bottom: 25px;
}

.night-mode {
  filter: brightness(0.9);
}
</style>
