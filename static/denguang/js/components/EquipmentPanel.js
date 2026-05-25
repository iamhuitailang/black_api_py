const EquipmentPanel = {
  name: 'EquipmentPanel',
  template: `
    <div class="equipment-panel">
      <h2 class="section-title">
        <span class="title-icon">🎛️</span>
        设备库
      </h2>
      
      <div class="category-tabs">
        <div 
          v-for="(category, key) in equipmentCategories" 
          :key="key"
          class="category-tab"
          :class="{ active: activeCategory === key }"
          @click="activeCategory = key"
        >
          <span class="cat-icon">{{ category.icon }}</span>
          <span class="cat-name">{{ category.name }}</span>
        </div>
      </div>

      <div class="equipment-list">
        <div 
          v-for="item in currentCategoryItems" 
          :key="item.id"
          class="equipment-item"
          :class="{ 
            unlocked: isUnlocked(item), 
            locked: !isUnlocked(item),
            selected: isSelected(item)
          }"
          @click="handleItemClick(item)"
        >
          <div class="item-icon">{{ item.icon }}</div>
          <div class="item-info">
            <h4 class="item-name">{{ item.name }}</h4>
            <p class="item-desc">{{ item.description }}</p>
            <div class="item-stats">
              <span v-if="item.power" class="stat">🔊 {{ item.power }}</span>
              <span v-if="item.quality" class="stat">✨ {{ item.quality }}</span>
              <span v-if="item.brightness" class="stat">💡 {{ item.brightness }}</span>
              <span class="stat level">Lv.{{ item.level }}</span>
            </div>
          </div>
          <div v-if="!isUnlocked(item)" class="lock-overlay">
            <span class="lock-icon">🔒</span>
            <span class="unlock-req">需要{{ item.unlockScore }}分</span>
          </div>
          <div v-else-if="isSelected(item)" class="selected-indicator">✓</div>
        </div>
      </div>

      <div class="equipment-tips" v-if="showTips">
        <p class="tip-text">💡 点击设备添加到舞台，拖拽调整位置</p>
      </div>
    </div>
  `,
  props: {
    selectedEquipment: {
      type: Array,
      default: () => []
    },
    unlockedIds: {
      type: Array,
      default: () => []
    },
    highScore: {
      type: Number,
      default: 0
    }
  },
  emits: ['add-equipment', 'remove-equipment'],
  data() {
    return {
      activeCategory: 'audio',
      equipmentCategories: window.GAME_DATA.EQUIPMENT_CATEGORIES,
      showTips: true
    }
  },
  computed: {
    currentCategoryItems() {
      return this.equipmentCategories[this.activeCategory]?.items || []
    },
    currentCategoryName() {
      return this.equipmentCategories[this.activeCategory]?.name || ''
    }
  },
  methods: {
    isUnlocked(item) {
      if (item.unlocked) return true
      return this.unlockedIds.includes(item.id) || this.highScore >= (item.unlockScore || 99999)
    },
    isSelected(item) {
      return this.selectedEquipment.some(eq => eq.id === item.id)
    },
    handleItemClick(item) {
      if (!this.isUnlocked(item)) return

      if (this.isSelected(item)) {
        this.$emit('remove-equipment', item)
      } else {
        this.$emit('add-equipment', item)
      }
    },
    addEquipment(item) {
      if (!this.isUnlocked(item)) return
      this.$emit('add-equipment', item)
    },
    removeEquipment(item) {
      this.$emit('remove-equipment', item)
    }
  }
}

window.EquipmentPanel = EquipmentPanel
