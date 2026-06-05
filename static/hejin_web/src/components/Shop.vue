<template>
  <div class="shop">
    <div class="shop-bg"></div>
    <div class="shop-content">
      <div class="shop-header">
        <h1>🛒 武器商店</h1>
        <div class="coins-display">
          <span class="coin-icon">💰</span>
          <span class="coins">{{ coins }}</span>
        </div>
      </div>
      
      <div class="shop-sections">
        <div class="shop-section">
          <h2>⚔️ 武器装备</h2>
          <div class="items-grid">
            <div 
              v-for="item in weapons" 
              :key="item.id"
              class="shop-item"
              :class="{ owned: inventory[item.id], disabled: !canBuy(item) }"
            >
              <div class="item-icon">{{ item.icon }}</div>
              <div class="item-info">
                <h3>{{ item.name }}</h3>
                <p class="item-desc">{{ item.description }}</p>
                <div class="item-stats">
                  <span>伤害: {{ item.damage }}</span>
                  <span>射速: {{ item.fireRate }}ms</span>
                </div>
              </div>
              <button 
                v-if="!inventory[item.id]"
                class="buy-btn"
                :disabled="!canBuy(item)"
                @click="buy(item)"
              >
                💰 {{ item.price }}
              </button>
              <span v-else class="owned-tag">已拥有</span>
            </div>
          </div>
        </div>

        <div class="shop-section">
          <h2>💊 生命强化</h2>
          <div class="items-grid">
            <div 
              v-for="item in healthItems" 
              :key="item.id"
              class="shop-item"
              :class="{ disabled: !canBuy(item) }"
            >
              <div class="item-icon">{{ item.icon }}</div>
              <div class="item-info">
                <h3>{{ item.name }}</h3>
                <p class="item-desc">{{ item.description }}</p>
              </div>
              <button 
                class="buy-btn"
                :disabled="!canBuy(item)"
                @click="buy(item)"
              >
                💰 {{ item.price }}
              </button>
            </div>
          </div>
        </div>

        <div class="shop-section">
          <h2>💣 投掷武器</h2>
          <div class="items-grid">
            <div 
              v-for="item in grenadeItems" 
              :key="item.id"
              class="shop-item"
              :class="{ disabled: !canBuy(item) }"
            >
              <div class="item-icon">{{ item.icon }}</div>
              <div class="item-info">
                <h3>{{ item.name }}</h3>
                <p class="item-desc">{{ item.description }}</p>
                <p class="current-count">当前: {{ inventory.grenades }} 个</p>
              </div>
              <button 
                class="buy-btn"
                :disabled="!canBuy(item)"
                @click="buy(item)"
              >
                💰 {{ item.price }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <button class="btn btn-secondary back-btn" @click="$emit('back')">
        ← 返回主菜单
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  coins: { type: Number, required: true },
  inventory: { type: Object, required: true }
})

const emit = defineEmits(['back', 'buy'])

const weapons = [
  {
    id: 'shotgun',
    name: '散弹枪',
    icon: '🔫',
    description: '近距离高伤害，一发多弹',
    damage: 60,
    fireRate: 500,
    price: 300,
    type: 'weapon'
  }
]

const healthItems = [
  {
    id: 'health_small',
    name: '生命强化 I',
    icon: '❤️',
    description: '永久增加 25 点最大生命值',
    value: 25,
    price: 200,
    type: 'health'
  },
  {
    id: 'health_medium',
    name: '生命强化 II',
    icon: '💖',
    description: '永久增加 50 点最大生命值',
    value: 50,
    price: 400,
    type: 'health'
  }
]

const grenadeItems = [
  {
    id: 'grenade_5',
    name: '手榴弹 x5',
    icon: '💣',
    description: '补充 5 颗手榴弹',
    value: 5,
    price: 150,
    type: 'grenade'
  }
]

const canBuy = (item) => {
  return props.coins >= item.price
}

const buy = (item) => {
  if (canBuy(item)) {
    emit('buy', item)
  }
}
</script>

<style scoped>
.shop {
  width: 100%;
  height: 100%;
  position: relative;
  overflow-y: auto;
}

.shop-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #2d3436 0%, #636e72 100%);
  z-index: 0;
}

.shop-content {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
}

.shop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.shop-header h1 {
  font-size: 36px;
  color: #fdcb6e;
}

.coins-display {
  background: rgba(0, 0, 0, 0.5);
  padding: 12px 24px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.coin-icon {
  font-size: 24px;
}

.coins {
  font-size: 24px;
  font-weight: bold;
  color: #fdcb6e;
}

.shop-sections {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.shop-section h2 {
  font-size: 24px;
  color: #81ecec;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(129, 236, 236, 0.3);
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.shop-item {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.shop-item:hover:not(.disabled) {
  border-color: #0984e3;
  transform: translateY(-2px);
}

.shop-item.owned {
  border-color: #00b894;
  opacity: 0.8;
}

.shop-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.item-icon {
  font-size: 48px;
  min-width: 60px;
  text-align: center;
}

.item-info {
  flex: 1;
}

.item-info h3 {
  font-size: 18px;
  color: #fff;
  margin-bottom: 4px;
}

.item-desc {
  font-size: 12px;
  color: #b2bec3;
  margin-bottom: 8px;
}

.item-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #fdcb6e;
}

.current-count {
  font-size: 12px;
  color: #81ecec;
  margin-top: 4px;
}

.buy-btn {
  background: linear-gradient(180deg, #00b894 0%, #00a085 100%);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.buy-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.buy-btn:disabled {
  background: #636e72;
  cursor: not-allowed;
}

.owned-tag {
  color: #00b894;
  font-weight: bold;
  padding: 10px;
}

.back-btn {
  margin-top: 30px;
  display: block;
  margin-left: auto;
  margin-right: auto;
}
</style>
