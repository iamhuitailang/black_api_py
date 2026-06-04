<script setup lang="ts">
import { ref, computed } from 'vue';
import { Utensils, Package } from 'lucide-vue-next';
import { useGameStore } from '../stores/gameStore';
import { foods } from '../data/foods';
import AnimalCard from '../components/AnimalCard.vue';
import type { Animal, Food } from '../types';

const store = useGameStore();
const selectedFood = ref<string | null>(null);

const foodCategories = [
  { id: 'all', name: '全部', emoji: '🍽️' },
  { id: 'fruit', name: '水果', emoji: '🍎' },
  { id: 'vegetable', name: '蔬菜', emoji: '🥕' },
  { id: 'dairy', name: '奶制品', emoji: '🥛' },
  { id: 'meat', name: '肉类', emoji: '🍖' },
  { id: 'snack', name: '零食', emoji: '🍪' },
];

const activeCategory = ref('all');

const filteredFoods = computed(() => {
  if (activeCategory.value === 'all') return foods;
  return foods.filter(f => f.category === activeCategory.value);
});

function selectFood(foodId: string) {
  selectedFood.value = selectedFood.value === foodId ? null : foodId;
}

function feedAnimal(animal: Animal) {
  if (!selectedFood.value) return;
  store.feedAnimal(animal.id, selectedFood.value);
}

function getFoodById(id: string): Food | undefined {
  return foods.find(f => f.id === id);
}
</script>

<template>
  <div class="feeding-room">
    <div class="page-header">
      <h1>🍽️ 喂食餐厅</h1>
      <p class="subtitle">给可爱的小动物们准备美味的食物~</p>
    </div>

    <div class="food-section">
      <h2 class="section-title">
        <Utensils :size="20" />
        选择食物
      </h2>
      
      <div class="category-tabs">
        <button 
          v-for="cat in foodCategories" 
          :key="cat.id"
          class="tab-btn"
          :class="{ active: activeCategory === cat.id }"
          @click="activeCategory = cat.id"
        >
          <span>{{ cat.emoji }}</span>
          <span>{{ cat.name }}</span>
        </button>
      </div>

      <div class="foods-grid">
        <div 
          v-for="food in filteredFoods" 
          :key="food.id"
          class="food-card"
          :class="{ 
            selected: selectedFood === food.id,
            favorite: store.selectedAnimal?.favoriteFood === food.id
          }"
          @click="selectFood(food.id)"
        >
          <div class="food-emoji">{{ food.emoji }}</div>
          <h3 class="food-name">{{ food.name }}</h3>
          <div class="food-stats">
            <div class="stat">
              <span>🍖 +{{ food.hungerRestore }}</span>
            </div>
            <div class="stat">
              <span>😊 +{{ food.happinessBonus }}</span>
            </div>
          </div>
          <div class="food-inventory">
            <Package :size="14" />
            <span>{{ store.inventory[food.id] || 0 }}</span>
          </div>
          <div v-if="store.selectedAnimal?.favoriteFood === food.id" class="favorite-badge">
            💖 最爱
          </div>
        </div>
      </div>
    </div>

    <div class="animals-section">
      <h2 class="section-title">🐾 选择小动物喂食</h2>
      <p v-if="!selectedFood" class="hint">👆 请先选择一种食物</p>
      
      <div v-else class="animals-grid">
        <div 
          v-for="animal in store.activeAnimals" 
          :key="animal.id"
          class="animal-wrapper"
          :class="{ disabled: animal.isSleeping }"
        >
          <AnimalCard :animal="animal" :selectable="false" />
          <button 
            v-if="!animal.isGraduated"
            class="feed-btn"
            :disabled="animal.isSleeping || (store.inventory[selectedFood!] || 0) <= 0"
            @click="feedAnimal(animal)"
          >
            {{ animal.isSleeping ? '😴 睡觉中' : `喂食 ${getFoodById(selectedFood!)?.emoji}` }}
          </button>
          <div v-if="animal.favoriteFood === selectedFood" class="favorite-tip">
            💖 这是{{ animal.name }}最爱的食物！
          </div>
        </div>
      </div>
    </div>

    <div class="tips-section">
      <h3>💡 喂食小贴士</h3>
      <ul>
        <li>喂食小动物最喜欢的食物可以获得双倍心情加成！</li>
        <li>吃饱的小动物会更开心，家长也会给更多小费~</li>
        <li>记得定时喂食，不要让小动物饿肚子哦！</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.feeding-room {
  padding: 20px 0;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #2D3436;
  margin: 0 0 4px 0;
}

.subtitle {
  font-size: 14px;
  color: #636E72;
  margin: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  color: #2D3436;
  margin: 0 0 16px 0;
}

.food-section {
  margin-bottom: 32px;
}

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  background: #F1F2F6;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: #636E72;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: #E5E7EB;
}

.tab-btn.active {
  background: linear-gradient(135deg, #FF9F43 0%, #FFB347 100%);
  color: white;
}

.foods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.food-card {
  position: relative;
  background: white;
  border-radius: 16px;
  padding: 16px 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 3px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
}

.food-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.food-card.selected {
  border-color: #FF9F43;
  transform: translateY(-3px);
  box-shadow: 0 6px 24px rgba(255, 159, 67, 0.2);
}

.food-card.favorite {
  border-color: #FF9FF3;
}

.food-emoji {
  font-size: 40px;
  margin-bottom: 8px;
}

.food-name {
  font-size: 14px;
  font-weight: 600;
  color: #2D3436;
  margin: 0 0 8px 0;
}

.food-stats {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 8px;
}

.food-stats .stat {
  font-size: 11px;
  color: #636E72;
}

.food-inventory {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #5FCD9C;
}

.favorite-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 10px;
  background: linear-gradient(135deg, #FF9FF3 0%, #F368E0 100%);
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
}

.hint {
  padding: 16px;
  background: #F8F9FA;
  border-radius: 12px;
  text-align: center;
  color: #636E72;
  font-size: 14px;
}

.animals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.animal-wrapper {
  position: relative;
  transition: all 0.3s ease;
}

.animal-wrapper.disabled {
  opacity: 0.6;
}

.feed-btn {
  width: 100%;
  margin-top: 10px;
  padding: 12px;
  background: linear-gradient(135deg, #FF9F43 0%, #FFB347 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.feed-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 159, 67, 0.4);
}

.feed-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.favorite-tip {
  margin-top: 6px;
  padding: 6px 10px;
  background: linear-gradient(135deg, #FFF0F9 0%, #FFE3F7 100%);
  border-radius: 8px;
  font-size: 12px;
  color: #E84393;
  text-align: center;
  font-weight: 500;
}

.tips-section {
  margin-top: 32px;
  padding: 20px;
  background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%);
  border-radius: 16px;
}

.tips-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #FF8F00;
  margin: 0 0 12px 0;
}

.tips-section ul {
  margin: 0;
  padding-left: 20px;
}

.tips-section li {
  font-size: 13px;
  color: #E65100;
  margin-bottom: 6px;
}

.tips-section li:last-child {
  margin-bottom: 0;
}
</style>
