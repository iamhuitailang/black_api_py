var HomePage = {
  template: `
    <div class="page-content">
      <div class="filter-bar">
        <div
          v-for="filter in filters"
          :key="filter.value"
          :class="['filter-item', { active: currentFilter === filter.value }]"
          @click="setFilter(filter.value)"
        >
          {{ filter.label }}
        </div>
      </div>

      <div class="product-grid">
        <div
          v-for="product in filteredProducts"
          :key="product.id"
          class="product-card"
          @click="goDetail(product.id)"
        >
          <div class="product-image">{{ product.emoji }}</div>
          <div class="product-info">
            <div class="product-name">{{ product.name }}</div>
            <div class="price-row">
              <span class="group-price">¥{{ product.groupPrice }}</span>
              <span class="original-price">¥{{ product.originalPrice }}</span>
            </div>
            <div class="group-tag">
              {{ product.groupSize }}人成团 · 省¥{{ product.originalPrice - product.groupPrice }}
            </div>
            <div class="group-status" v-if="getProductStatus(product.id).totalMembers > 0">
              <template v-if="getProductStatus(product.id).nearlyFullCount > 0">
                🔥 即将成团，还差1人
              </template>
              <template v-else>
                已有{{ getProductStatus(product.id).totalMembers }}人拼团中
              </template>
            </div>
            <button
              class="action-btn"
              @click.stop="openGroup(product)"
              :disabled="false"
            >
              {{ getProductStatus(product.id).hasAvailable ? '去拼单' : '我要开团' }}
            </button>
          </div>
        </div>
      </div>

      <div class="empty-state" v-if="filteredProducts.length === 0">
        <div class="empty-icon">🛒</div>
        <div class="empty-text">暂无商品</div>
      </div>
    </div>
  `,
  data: function() {
    return {
      products: [],
      currentFilter: 'all',
      filters: [
        { label: '全部', value: 'all' },
        { label: '即将成团', value: 'nearlyFull' },
        { label: '热销排序', value: 'hot' }
      ],
      timer: null
    };
  },
  computed: {
    filteredProducts: function() {
      var products = this.products.slice();
      if (this.currentFilter === 'nearlyFull') {
        var self = this;
        return products.filter(function(p) {
          return self.getProductStatus(p.id).nearlyFullCount > 0;
        });
      } else if (this.currentFilter === 'hot') {
        return products.sort(function(a, b) {
          return b.sales - a.sales;
        });
      }
      return products;
    }
  },
  methods: {
    loadProducts: function() {
      this.products = PinTuanData.getProducts();
    },
    setFilter: function(filter) {
      this.currentFilter = filter;
    },
    getProductStatus: function(productId) {
      return PinTuanData.getProductGroupStatus(productId);
    },
    goDetail: function(productId) {
      this.$router.push({ path: '/detail', query: { id: productId } });
    },
    openGroup: function(product) {
      var status = this.getProductStatus(product.id);
      if (status.hasAvailable) {
        var groups = PinTuanData.getGroups();
        var availableGroup = groups.find(function(g) {
          return g.productId === product.id &&
                 g.status === 'ongoing' &&
                 g.members.length < g.groupSize;
        });
        if (availableGroup) {
          this.$router.push({ path: '/detail', query: { id: product.id, group: availableGroup.id } });
          return;
        }
      }
      this.$router.push({ path: '/detail', query: { id: product.id } });
    },
    refreshStatus: function() {
      PinTuanData.updateGroupStatus();
    }
  },
  mounted: function() {
    this.loadProducts();
    this.refreshStatus();
    this.timer = setInterval(this.refreshStatus, 1000);
  },
  beforeUnmount: function() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
  activated: function() {
    this.loadProducts();
  }
};
