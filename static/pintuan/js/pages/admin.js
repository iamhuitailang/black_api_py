var AdminPage = {
  template: `
    <div class="page-content admin-page">
      <div class="admin-section">
        <div class="section-title">数据统计</div>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ stats.productCount }}</div>
            <div class="stat-label">商品总数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.ongoingCount }}</div>
            <div class="stat-label">进行中团</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.successCount }}</div>
            <div class="stat-label">已成功团</div>
          </div>
        </div>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ stats.failedCount }}</div>
            <div class="stat-label">已失败团</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.myCreatedCount }}</div>
            <div class="stat-label">我开的团</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.myJoinedCount }}</div>
            <div class="stat-label">我参与的团</div>
          </div>
        </div>
      </div>

      <div class="admin-section">
        <div class="section-title">测试数据</div>
        <button class="admin-btn primary" @click="generateTestData">
          生成示例拼团数据
        </button>
        <p style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
          点击后会生成几个示例拼团，方便演示各种状态效果
        </p>
      </div>

      <div class="admin-section">
        <div class="section-title">数据管理</div>
        <button class="admin-btn" @click="resetProducts">
          重置商品库
        </button>
        <p style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
          恢复默认的8个商品数据
        </p>
      </div>

      <div class="admin-section">
        <div class="section-title">危险操作</div>
        <button class="admin-btn danger" @click="clearAllGroups">
          清除所有拼团
        </button>
        <p style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
          删除所有进行中和已结束的拼团记录
        </p>
      </div>

      <div class="admin-section">
        <div class="section-title">商品列表</div>
        <div v-for="product in products" :key="product.id" style="padding: 12px 0; border-bottom: 1px solid var(--border-color);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 32px;">{{ product.emoji }}</span>
            <div style="flex: 1;">
              <div style="font-weight: 500;">{{ product.name }}</div>
              <div style="font-size: 12px; color: var(--text-secondary);">
                原价 ¥{{ product.originalPrice }} · 拼团价 ¥{{ product.groupPrice }} · {{ product.groupSize }}人成团
              </div>
            </div>
            <div style="font-size: 12px; color: var(--text-light);">
              销量 {{ product.sales }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  data: function() {
    return {
      products: [],
      stats: {
        productCount: 0,
        ongoingCount: 0,
        successCount: 0,
        failedCount: 0,
        myCreatedCount: 0,
        myJoinedCount: 0
      }
    };
  },
  methods: {
    loadData: function() {
      this.products = PinTuanData.getProducts();
      PinTuanData.updateGroupStatus();
      var groups = PinTuanData.getGroups();
      var myGroups = PinTuanData.getMyGroups();

      this.stats = {
        productCount: this.products.length,
        ongoingCount: groups.filter(function(g) { return g.status === 'ongoing'; }).length,
        successCount: groups.filter(function(g) { return g.status === 'success'; }).length,
        failedCount: groups.filter(function(g) { return g.status === 'failed'; }).length,
        myCreatedCount: myGroups.created.length,
        myJoinedCount: myGroups.joined.length
      };
    },
    generateTestData: function() {
      var self = this;
      ElementPlus.ElMessageBox.confirm(
        '将生成示例拼团数据，确定继续吗？',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(function() {
        PinTuanData.generateTestData();
        self.loadData();
        ElementPlus.ElMessage.success('测试数据已生成！');
      }).catch(function() {});
    },
    resetProducts: function() {
      var self = this;
      ElementPlus.ElMessageBox.confirm(
        '将重置商品库为默认数据，确定继续吗？',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(function() {
        PinTuanData.resetProducts();
        self.loadData();
        ElementPlus.ElMessage.success('商品库已重置！');
      }).catch(function() {});
    },
    clearAllGroups: function() {
      var self = this;
      ElementPlus.ElMessageBox.confirm(
        '将删除所有拼团记录，此操作不可恢复，确定继续吗？',
        '危险操作',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'error'
        }
      ).then(function() {
        PinTuanData.clearAllGroups();
        self.loadData();
        ElementPlus.ElMessage.success('所有拼团已清除！');
      }).catch(function() {});
    }
  },
  mounted: function() {
    this.loadData();
  }
};
