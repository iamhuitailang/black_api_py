<script setup lang="ts">
import { computed } from 'vue';
import { Heart, Brain, Zap, Cookie, Smile, Star } from 'lucide-vue-next';
import type { Animal } from '../types';
import ProgressBar from './ProgressBar.vue';
import { useGameStore } from '../stores/gameStore';

const props = defineProps<{
  animal: Animal;
  selectable?: boolean;
}>();

const emit = defineEmits<{
  select: [animal: Animal];
}>();

const store = useGameStore();

const isSelected = computed(() => store.selectedAnimalId === props.animal.id);

const statusEmoji = computed(() => {
  if (props.animal.isSleeping) return '😴';
  if (props.animal.isGraduated) return '🎓';
  if (props.animal.hunger < 30) return '😢';
  if (props.animal.energy < 30) return '😫';
  if (props.animal.happiness >= 80) return '😄';
  if (props.animal.happiness >= 50) return '😊';
  return '😐';
});

function handleClick() {
  if (props.selectable) {
    emit('select', props.animal);
  } else {
    store.selectAnimal(isSelected.value ? null : props.animal.id);
  }
}
</script>

<template>
  <div 
    class="animal-card" 
    :class="{ 
      selected: isSelected, 
      selectable: selectable,
      sleeping: animal.isSleeping,
      graduated: animal.isGraduated
    }"
    @click="handleClick"
  >
    <div class="card-header">
      <div class="animal-emoji">
        <span class="emoji-main">{{ animal.emoji }}</span>
        <span class="emoji-status">{{ statusEmoji }}</span>
      </div>
      <div class="level-badge">
        <Star :size="12" />
        <span>Lv.{{ animal.level }}</span>
      </div>
    </div>
    
    <div class="card-body">
      <h3 class="animal-name">{{ animal.name }}</h3>
      <div class="animal-tags">
        <span class="tag personality">{{ animal.personality }}</span>
        <span class="tag talent">{{ animal.talent }}天赋</span>
      </div>
      
      <div class="stats-grid">
        <div class="stat-item">
          <Heart :size="14" color="#FF6B6B" />
          <ProgressBar :value="animal.happiness" color="#FF6B6B" size="sm" />
        </div>
        <div class="stat-item">
          <Brain :size="14" color="#74B9FF" />
          <ProgressBar :value="animal.intelligence" color="#74B9FF" size="sm" />
        </div>
        <div class="stat-item">
          <Zap :size="14" color="#FDCB6E" />
          <ProgressBar :value="animal.energy" color="#FDCB6E" size="sm" />
        </div>
        <div class="stat-item">
          <Cookie :size="14" color="#A29BFE" />
          <ProgressBar :value="animal.hunger" color="#A29BFE" size="sm" />
        </div>
      </div>
      
      <div class="affection-bar">
        <Smile :size="14" color="#FF9FF3" />
        <span class="affection-label">好感度</span>
        <ProgressBar :value="animal.affection" color="#FF9FF3" size="sm" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.animal-card {
  background: white;
  border-radius: 20px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 3px solid transparent;
}

.animal-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.animal-card.selectable:hover {
  border-color: #5FCD9C;
}

.animal-card.selected {
  border-color: #FF9F43;
  box-shadow: 0 8px 24px rgba(255, 159, 67, 0.3);
}

.animal-card.sleeping {
  opacity: 0.8;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.animal-card.graduated {
  background: linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.animal-emoji {
  position: relative;
  font-size: 48px;
  line-height: 1;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.sleeping .animal-emoji {
  animation: none;
}

.emoji-status {
  position: absolute;
  bottom: -5px;
  right: -10px;
  font-size: 20px;
}

.level-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.animal-name {
  font-size: 18px;
  font-weight: 700;
  color: #2D3436;
  margin: 0 0 8px 0;
}

.animal-tags {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}

.tag {
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.tag.personality {
  background: #E8F5E9;
  color: #4CAF50;
}

.tag.talent {
  background: #FFF3E0;
  color: #FF9800;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 10px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-item .progress-bar {
  flex: 1;
}

.affection-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px dashed #E5E7EB;
}

.affection-label {
  font-size: 11px;
  color: #636E72;
}

.affection-bar .progress-bar {
  flex: 1;
}
</style>
