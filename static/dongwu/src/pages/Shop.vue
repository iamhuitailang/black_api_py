<script setup lang="ts">
import { ref } from 'vue';
import { ShoppingBag, Coins } from 'lucide-vue-next';
import { useGameStore } from '../stores/gameStore';
import { foods } from '../data/foods';
import { decorations, toys } from '../data/decorations';

const store = useGameStore();

const categories = [
  { id: 'food', name: '食物', emoji: '🍎' },
  { id: 'toy', name: '玩具', emoji: '🧸' },
  { id: 'decoration', name: '装饰', emoji: '🌸' },
];

const activeCategory = ref('food');

function buyFood(foodId: string, price: number) {
  store.buyItem('food', foodId, price);
}

function buyToy(toyId: string, price: number) {
  if (store.toys.includes(toyId)) return;
  store.buyItem('toy', toyId, price);
}

function buyDecoration(decId: string, price: number) {
  if (store.decorations.includes(decId)) return;
  store.buyItem('decoration', decId, price);
}
</script>

<template>
  <div class="shop">
    <div class="page-header">
      <div class="header-left">
        <h1>🛒 欢乐商店</h1>
        <p class="subtitle">购买食物、玩具和装饰品来丰富幼儿园~</p>
      </div>
      <div class="coins-display">
        <Coins :size="24" color="#FFD700" />
        <span class="coins-amount">{{ store.coins }}</span>
      </div>
    </div>

    <div class="category-tabs">
      <button 
        v-for="cat in categories" 
        :key="cat.id"
        class="tab-btn"
        :class="{ active: activeCategory === cat.id }"
        @click="activeCategory = cat.id"
      >
        <span class="tab-emoji">{{ cat.emoji }}</span>
        <span>{{ cat.name }}</span>
      </button>
    </div>

    <div v-if="activeCategory === 'food'" class="shop-section">
      <h2 class="section-title">🍎 食物商店</h2>
      <div class="items-grid">
        <div 
          v-for="food in foods" 
          :key="food.id"
          class="item-card"
        >
          <div class="item-emoji">{{ food.emoji }}</div>
          <h3 class="item-name">{{ food.name }}</h3>
          <div class="item-effects">
            <span>饱腹 +{{ food.hungerRestore }}</span>
            <span>心情 +{{ food.happinessBonus }}</span>
          </div>
          <div class="item-stock">
            库存: {{ store.inventory[food.id] || 0 }}
          </div>
          <button 
            class="buy-btn"
            :disabled="store.coins < food.price"
            @click="buyFood(food.id, food.price)"
          >
            <Coins :size="16" />
            {{ food.price }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="activeCategory === 'toy'" class="shop-section">
      <h2 class="section-title">🧸 玩具商店</h2>
      <div class="items-grid">
        <div 
          v-for="toy in toys" 
          :key="toy.id"
          class="item-card"
          :class="{ owned: store.toys.includes(toy.id) }"
        >
          <div class="item-emoji">{{ toy.emoji }}</div>
          <h3 class="item-name">{{ toy.name }}</h3>
          <div class="item-effects">
            <span>心情 +{{ toy.happinessBonus }}</span>
          </div>
          <div v-if="store.toys.includes(toy.id)" class="owned-badge">
            ✨ 已拥有
          </div>
          <button 
            v-else
            class="buy-btn"
            :disabled="store.coins < toy.price"
            @click="buyToy(toy.id, toy.price)"
          >
            <Coins :size="16" />
            {{ toy.price }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="activeCategory === 'decoration'" class="shop-section">
      <h2 class="section-title">🌸 装饰商店</h2>
      <div class="items-grid">
        <div 
          v-for="dec in decorations" 
          :key="dec.id"
          class="item-card decoration-card"
          :class="{ owned: store.decorations.includes(dec.id) }"
        >
          <div class="item-emoji">{{ dec.emoji }}</div>
          <h3 class="item-name">{{ dec.name }}</h3>
          <p class="item-desc">{{ dec.description }}</p>
          <div v-if="store.decorations.includes(dec.id)" class="owned-badge">
            ✨ 已拥有
          </div>
          <button 
            v-else
            class="buy-btn"
            :disabled="store.coins < dec.price"
            @click="buyDecoration(dec.id, dec.price)"
          >
            <Coins :size="16" />
            {{ dec.price }}
          </button>
        </div>
      </div>
    </div>

    <div class="tips-section">
      <h3>💡 经营小贴士</h3>
      <ul>
        <li>多储备一些食物，避免小动物饿肚子~</li>
        <li>购买装饰品可以让幼儿园更漂亮哦！</li>
        <li>小动物开心了，家长给的小费也会更多~</li>
        <li>毕业的小动物会给你丰厚的奖励！</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.shop {
  padding: 20px 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
}

.header-left h1 {
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

.coins-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%);
  border-radius: 20px;
}

.coins-amount {
  font-size: 20px;
  font-weight: 700;
  color: #FF8F00;
}

.category-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: #F1F2F6;
  border: none;
  border-radius: 24px;
  font-size: 15px;
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

.tab-emoji {
  font-size: 18px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #2D3436;
  margin: 0 0 16px 0;
}

.shop-section {
  margin-bottom: 32px;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.item-card {
  position: relative;
  background: white;
  border-radius: 16px;
  padding: 20px 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 3px solid transparent;
  transition: all 0.3s ease;
}

.item-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.item-card.owned {
  opacity: 0.8;
  background: linear-gradient(135deg, #F0FFF4 0%, #C6F6D5 100%);
}

.item-emoji {
  font-size: 48px;
  margin-bottom: 12px;
}

.item-name {
  font-size: 16px;
  font-weight: 600;
  color: #2D3436;
  margin: 0 0 8px 0;
}

.item-effects {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #636E72;
}

.item-desc {
  font-size: 12px;
  color: #636E72;
  margin: 0 0 12px 0;
  min-height: 32px;
}

.item-stock {
  font-size: 12px;
  color: #5FCD9C;
  font-weight: 500;
  margin-bottom: 12px;
}

.owned-badge {
  padding: 8px;
  background: #5FCD9C;
  color: white;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
}

.buy-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  background: linear-gradient(135deg, #5FCD9C 0%, #4ECDC4 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.buy-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(95, 205, 156, 0.4);
}

.buy-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tips-section {
  margin-top: 32px;
  padding: 20px;
  background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
  border-radius: 16px;
}

.tips-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1565C0;
  margin: 0 0 12px 0;
}

.tips-section ul {
  margin: 0;
  padding-left: 20px;
}

.tips-section li {
  font-size: 13px;
  color: #0D47A1;
  margin-bottom: 6px;
}

.tips-section li:last-child {
  margin-bottom: 0;
}
</style>
