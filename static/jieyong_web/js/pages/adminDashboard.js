const AdminDashboardPage = {
  render() {
    return `
      <div class="page-container">
        <div class="page-header">
          <h2>管理仪表盘</h2>
        </div>

        <div class="stats-overview" id="stats-overview">
          <div class="loading">加载中...</div>
        </div>

        <div class="admin-dashboard-grid">
          <div class="dashboard-card">
            <h3>热门物品 TOP 10</h3>
            <div id="hot-items-chart" class="chart-container"></div>
          </div>
          <div class="dashboard-card">
            <h3>分类分布</h3>
            <div id="category-chart" class="chart-container"></div>
          </div>
        </div>

        <div class="dashboard-card">
          <h3>借用趋势（近30天）</h3>
          <div id="trend-chart" class="chart-container"></div>
        </div>
      </div>
    `;
  },

  data() {
    return {
      stats: null,
      trend: [],
      categories: [],
      hotItems: []
    };
  },

  async mount() {
    await Promise.all([
      this.loadDashboard(),
      this.loadTrend(),
      this.loadCategories(),
      this.loadHotItems()
    ]);
  },

  async loadDashboard() {
    const result = await StatisticsService.getDashboard();
    if (result.code === 0 && result.data) {
      this.stats = result.data;
      this.renderStats();
    }
  },

  async loadTrend() {
    const result = await StatisticsService.getTrend(30);
    if (result.code === 0 && result.data) {
      this.trend = result.data;
      this.renderTrendChart();
    }
  },

  async loadCategories() {
    const result = await StatisticsService.getCategoryDistribution();
    if (result.code === 0 && result.data) {
      this.categories = result.data;
      this.renderCategoryChart();
    }
  },

  async loadHotItems() {
    const result = await StatisticsService.getHotItems(10);
    if (result.code === 0 && result.data) {
      this.hotItems = result.data;
      this.renderHotItemsChart();
    }
  },

  renderStats() {
    const container = document.getElementById('stats-overview');
    const stats = this.stats;
    
    container.innerHTML = `
      <div class="stat-card-large">
        <div class="stat-icon-large blue">📦</div>
        <div>
          <div class="stat-value-large">${stats.total_items}</div>
          <div class="stat-label">物品总数</div>
        </div>
      </div>
      <div class="stat-card-large">
        <div class="stat-icon-large green">👥</div>
        <div>
          <div class="stat-value-large">${stats.total_users}</div>
          <div class="stat-label">用户总数</div>
        </div>
      </div>
      <div class="stat-card-large">
        <div class="stat-icon-large orange">🔄</div>
        <div>
          <div class="stat-value-large">${stats.total_borrows}</div>
          <div class="stat-label">借用总次数</div>
        </div>
      </div>
      <div class="stat-card-large">
        <div class="stat-icon-large red">⚠️</div>
        <div>
          <div class="stat-value-large">${stats.overdue_count}</div>
          <div class="stat-label">逾期未还</div>
        </div>
      </div>
      <div class="stat-card-large">
        <div class="stat-icon-large purple">📖</div>
        <div>
          <div class="stat-value-large">${stats.borrowing_count}</div>
          <div class="stat-label">借用中</div>
        </div>
      </div>
      <div class="stat-card-large">
        <div class="stat-icon-large cyan">✅</div>
        <div>
          <div class="stat-value-large">${stats.returned_count}</div>
          <div class="stat-label">已归还</div>
        </div>
      </div>
    `;
  },

  renderTrendChart() {
    const container = document.getElementById('trend-chart');
    if (this.trend.length === 0) {
      container.innerHTML = '<div class="empty-state">暂无数据</div>';
      return;
    }

    const maxCount = Math.max(...this.trend.map(d => d.count), 1);
    const chartHeight = 200;
    const barWidth = 100 / this.trend.length;

    container.innerHTML = `
      <div class="bar-chart" style="height: ${chartHeight}px;">
        ${this.trend.map((item, index) => {
          const height = (item.count / maxCount) * 100;
          return `
            <div class="bar-item" style="width: ${barWidth}%;">
              <div class="bar-tooltip">${item.date}: ${item.count}次</div>
              <div class="bar" style="height: ${height}%;">
                <span class="bar-value">${item.count}</span>
              </div>
              <span class="bar-label">${item.date.slice(5)}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderCategoryChart() {
    const container = document.getElementById('category-chart');
    if (this.categories.length === 0) {
      container.innerHTML = '<div class="empty-state">暂无数据</div>';
      return;
    }

    const total = this.categories.reduce((sum, c) => sum + c.count, 0) || 1;
    const colors = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'];

    container.innerHTML = `
      <div class="pie-chart-container">
        <div class="pie-chart">
          ${this.createPieChart(this.categories.map(c => c.count), colors)}
        </div>
        <div class="pie-legend">
          ${this.categories.map((cat, index) => `
            <div class="legend-item">
              <span class="legend-color" style="background: ${colors[index % colors.length]};"></span>
              <span class="legend-text">${cat.name}: ${cat.count}件 (${((cat.count / total) * 100).toFixed(1)}%)</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  createPieChart(values, colors) {
    const total = values.reduce((sum, v) => sum + v, 0) || 1;
    let cumulativePercent = 0;
    
    const gradients = values.map((value, index) => {
      const percent = (value / total) * 100;
      const start = cumulativePercent;
      cumulativePercent += percent;
      const end = cumulativePercent;
      return `${colors[index % colors.length]} ${start}% ${end}%`;
    });

    return `<div class="pie" style="background: conic-gradient(${gradients.join(', ')});"></div>`;
  },

  renderHotItemsChart() {
    const container = document.getElementById('hot-items-chart');
    if (this.hotItems.length === 0) {
      container.innerHTML = '<div class="empty-state">暂无数据</div>';
      return;
    }

    const maxCount = Math.max(...this.hotItems.map(i => i.borrow_count), 1);

    container.innerHTML = `
      <div class="horizontal-bar-chart">
        ${this.hotItems.map((item, index) => {
          const width = (item.borrow_count / maxCount) * 100;
          return `
            <div class="h-bar-item">
              <span class="h-bar-label">${item.name}</span>
              <div class="h-bar-track">
                <div class="h-bar-fill" style="width: ${width}%;"></div>
              </div>
              <span class="h-bar-value">${item.borrow_count}次</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
};

window.AdminDashboardPage = AdminDashboardPage;
