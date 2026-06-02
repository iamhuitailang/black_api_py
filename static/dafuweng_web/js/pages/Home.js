import { computed } from 'vue'
import Store from '../store.js'

export default {
  setup() {
    const isLoggedIn = computed(() => Store.isLoggedIn)
    return { isLoggedIn }
  },
  template: `
    <div class="home-page">
      <div class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">🏰 大富翁</h1>
          <p class="hero-subtitle">经典地产大亨游戏 · 策略与运气的较量</p>
          <div class="hero-actions">
            <router-link v-if="isLoggedIn" to="/game/list" class="btn btn-primary btn-lg">进入游戏</router-link>
            <router-link v-else to="/login" class="btn btn-primary btn-lg">开始冒险</router-link>
            <router-link to="/rank" class="btn btn-outline btn-lg">排行榜</router-link>
          </div>
        </div>
      </div>
      <div class="features-section">
        <h2 class="section-title">游戏特色</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🏘️</div>
            <h3>购买地产</h3>
            <p>购买土地、建造房屋、收取租金，成为地产大亨</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🎲</div>
            <h3>随机事件</h3>
            <p>运气与策略并存，随机事件让每局游戏都充满惊喜</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🎒</div>
            <h3>道具系统</h3>
            <p>使用道具干扰对手或保护自己，增加策略深度</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🏆</div>
            <h3>成就系统</h3>
            <p>解锁各种成就，展示你的游戏实力</p>
          </div>
        </div>
      </div>
    </div>
  `
}
