<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import { useGameStore } from '../stores/gameStore';
import { useUiStore } from '../stores/uiStore';
import { BUILDING_TYPES, MAP_SIZE, LANDMARKS, INITIAL_MAP_SIZE } from '../utils/constants';
const gameStore = useGameStore();
const uiStore = useUiStore();
const mapContainer = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const lastMousePos = ref({ x: 0, y: 0 });
const TILE_SIZE = 36;

function fitMapToView() {
  if (!mapContainer.value) return;
  const containerW = mapContainer.value.clientWidth;
  const containerH = mapContainer.value.clientHeight;
  const gridW = gameStore.mapSize * TILE_SIZE;
  const gridH = gameStore.mapSize * TILE_SIZE;
  const scaleX = containerW / gridW;
  const scaleY = containerH / gridH;
  const scale = Math.min(scaleX, scaleY, 1) * 0.92;
  uiStore.setMapScale(scale);
  const offsetX = (containerW - gridW * scale) / 2 / scale;
  const offsetY = (containerH - gridH * scale) / 2 / scale;
  uiStore.setMapOffset(offsetX, offsetY);
}

function handleTileClick(x: number, y: number) {
  if (isDragging.value) return;
  if (uiStore.selectedTool) {
    if (uiStore.selectedTool === 'demolish') {
      gameStore.demolishBuilding(x, y);
    } else {
      gameStore.placeBuilding(x, y, uiStore.selectedTool);
    }
  } else {
    uiStore.selectTile(x, y);
  }
}

function handleMouseDown(e: MouseEvent) {
  if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
    isDragging.value = true;
    lastMousePos.value = { x: e.clientX, y: e.clientY };
  }
}

function handleMouseMove(e: MouseEvent) {
  if (isDragging.value) {
    const dx = e.clientX - lastMousePos.value.x;
    const dy = e.clientY - lastMousePos.value.y;
    uiStore.setMapOffset(uiStore.mapOffset.x + dx / uiStore.mapScale, uiStore.mapOffset.y + dy / uiStore.mapScale);
    lastMousePos.value = { x: e.clientX, y: e.clientY };
  }
}

function handleMouseUp() {
  isDragging.value = false;
}

function handleWheel(e: WheelEvent) {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  uiStore.setMapScale(uiStore.mapScale + delta);
}

watch(() => gameStore.mapSize, () => {
  nextTick(() => {
    fitMapToView();
  });
});

watch(() => gameStore.requestFitMap, () => {
  nextTick(() => {
    fitMapToView();
  });
});

onMounted(() => {
  nextTick(() => {
    fitMapToView();
  });
  window.addEventListener('resize', fitMapToView);
});

function getTileContent(tile: {
  type: string;
  building: string | null;
}) {
  if (tile.building) {
    const building = BUILDING_TYPES[tile.building];
    if (building) return building.icon;
    const landmark = LANDMARKS[tile.building];
    if (landmark) return landmark.icon;
  }
  return '';
}

function getTileClass(tile: {
  type: string;
  building: string | null;
  zone: string | null;
}, x: number, y: number) {
  const classes = ['tile'];
  if (tile.building) {
    classes.push(`building-${tile.building}`);
  }
  if (tile.type === 'landmark') {
    classes.push('tile-landmark');
  }
  if (tile.zone) {
    classes.push(`zone-${tile.zone}`);
  }
  if (uiStore.selectedTile?.x === x && uiStore.selectedTile?.y === y) {
    classes.push('selected');
  }
  if (uiStore.selectedTool && tile.type === 'grass') {
    classes.push('hoverable');
  }
  return classes.join(' ');
}

function getTileBg(tile: {
  type: string;
  zone: string | null;
  building: string | null;
}) {
  if (tile.type === 'landmark') return 'bg-amber-200';
  if (tile.zone === 'residential') return 'bg-blue-200';
  if (tile.zone === 'commercial') return 'bg-yellow-200';
  if (tile.zone === 'industrial') return 'bg-gray-300';
  if (tile.building === 'road') return 'bg-gray-400';
  return 'bg-green-300';
}
</script>

<template>
  <div
    ref="mapContainer"
    class="map-container"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
    @wheel="handleWheel"
  >
    <div
      class="map-grid"
      :style="{
        transform: `translate(${uiStore.mapOffset.x}px, ${uiStore.mapOffset.y}px) scale(${uiStore.mapScale})`,
        transformOrigin: '0 0'
      }"
    >
      <div
        v-for="y in gameStore.mapSize"
        :key="y"
        class="map-row"
      >
        <div
          v-for="x in gameStore.mapSize"
          :key="x"
          :class="[getTileClass(gameStore.map[y-1][x-1], x-1, y-1), getTileBg(gameStore.map[y-1][x-1])]"
          @click="handleTileClick(x-1, y-1)"
        >
          <span class="tile-icon">
            {{ getTileContent(gameStore.map[y-1][x-1]) }}
          </span>
        </div>
      </div>
    </div>
    <div v-if="gameStore.landmarks.length > 0" class="landmarks-display">
      <div class="landmarks-label">🏛️ 地标</div>
      <div class="landmarks-icons">
        <span v-for="key in gameStore.landmarks" :key="key" class="landmark-item" :title="LANDMARKS[key]?.name">
          {{ LANDMARKS[key]?.icon }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  cursor: grab;
  background: linear-gradient(135deg, #87CEEB 0%, #98D8C8 100%);
  position: relative;
}

.map-container:active {
  cursor: grabbing;
}

.map-grid {
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease-out;
}

.tile-landmark {
  box-shadow: inset 0 0 8px rgba(251, 191, 36, 0.5);
  z-index: 2;
}

.map-row {
  display: flex;
}

.tile {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.tile.hoverable:hover {
  filter: brightness(1.1);
  box-shadow: inset 0 0 0 2px rgba(74, 144, 217, 0.6);
  cursor: pointer;
}

.tile.selected {
  box-shadow: inset 0 0 0 3px #4A90D9;
  z-index: 1;
}

.tile-icon {
  font-size: 20px;
  pointer-events: none;
}

.building-road {
  background: #6B7280 !important;
}

.zone-residential {
  background: linear-gradient(135deg, #93C5FD, #60A5FA) !important;
}

.zone-commercial {
  background: linear-gradient(135deg, #FDE68A, #FBBF24) !important;
}

.zone-industrial {
  background: linear-gradient(135deg, #D1D5DB, #9CA3AF) !important;
}

.landmarks-display {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.6);
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  z-index: 10;
}
.landmarks-label {
  font-size: 12px;
  color: #fbbf24;
  font-weight: 600;
  white-space: nowrap;
}
.landmarks-icons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.landmark-item {
  font-size: 28px;
  cursor: default;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}
</style>
