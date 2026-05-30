const AdminOverduePage = {
  render() {
    return `
      <div class="page-container">
        <div class="page-header">
          <h2>逾期管理</h2>
          <div class="header-actions">
            <button class="btn btn-primary btn-sm" id="check-overdue-btn">检查逾期</button>
          </div>
        </div>

        <div class="overdue-stats" id="overdue-stats">
          <div class="loading">加载中...</div>
        </div>

        <div class="table-toolbar">
          <input type="text" id="keyword-search" placeholder="搜索物品名称/用户...">
          <button class="btn btn-primary btn-sm" id="search-btn">搜索</button>
        </div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>物品</th>
                <th>用户</th>
                <th>数量</th>
                <th>借用日期</th>
                <th>预计归还</th>
                <th>逾期天数</th>
                <th>预计罚款</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody id="overdue-tbody">
              <tr><td colspan="8" class="text-center">加载中...</td></tr>
            </tbody>
          </table>
        </div>

        <div class="pagination" id="pagination"></div>
      </div>
    `;
  },

  data() {
    return {
      borrows: [],
      stats: null,
      page: 1,
      pageSize: 10,
      total: 0,
      keyword: ''
    };
  },

  async mount() {
    await this.loadStats();
    await this.loadOverdueList();
    this.bindEvents();
  },

  bindEvents() {
    document.getElementById('search-btn').addEventListener('click', () => {
      this.keyword = document.getElementById('keyword-search').value;
      this.page = 1;
      this.loadOverdueList();
    });

    document.getElementById('keyword-search').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.keyword = e.target.value;
        this.page = 1;
        this.loadOverdueList();
      }
    });

    document.getElementById('check-overdue-btn').addEventListener('click', async () => {
      if (confirm('确认检查所有逾期记录？')) {
        const result = await BorrowService.checkOverdue();
        if (result.code === 0) {
          Toast.success(`检查完成，共处理 ${result.data?.count || 0} 条逾期记录`);
          this.loadStats();
          this.loadOverdueList();
        } else {
          Toast.error(result.msg);
        }
      }
    });
  },

  async loadStats() {
    const result = await StatisticsService.getOverdueStats();
    if (result.code === 0 && result.data) {
      this.stats = result.data;
      this.renderStats();
    }
  },

  renderStats() {
    const container = document.getElementById('overdue-stats');
    const stats = this.stats;
    
    container.innerHTML = `
      <div class="stat-card-large">
        <div class="stat-icon-large red">⚠️</div>
        <div>
          <div class="stat-value-large">${stats.total_overdue}</div>
          <div class="stat-label">逾期总数量</div>
        </div>
      </div>
      <div class="stat-card-large">
        <div class="stat-icon-large orange">📅</div>
        <div>
          <div class="stat-value-large">${stats.total_days}</div>
          <div class="stat-label">累计逾期天数</div>
        </div>
      </div>
      <div class="stat-card-large">
        <div class="stat-icon-large purple">👥</div>
        <div>
          <div class="stat-value-large">${stats.user_count}</div>
          <div class="stat-label">涉及用户数</div>
        </div>
      </div>
      <div class="stat-card-large">
        <div class="stat-icon-large yellow">💰</div>
        <div>
          <div class="stat-value-large">¥${stats.total_fine}</div>
          <div class="stat-label">预计罚款总额</div>
        </div>
      </div>
    `;
  },

  async loadOverdueList() {
    const params = {
      page: this.page,
      page_size: this.pageSize
    };
    if (this.keyword) params.keyword = this.keyword;

    const result = await BorrowService.getOverdueList(params);
    if (result.code === 0 && result.data) {
      this.borrows = result.data.items;
      this.total = result.data.total;
      this.renderBorrows();
      this.renderPagination();
    } else {
      document.getElementById('overdue-tbody').innerHTML = '<tr><td colspan="8" class="text-center empty-state">暂无逾期记录</td></tr>';
    }
  },

  renderBorrows() {
    const tbody = document.getElementById('overdue-tbody');
    
    if (this.borrows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center empty-state">暂无逾期记录</td></tr>';
      return;
    }

    tbody.innerHTML = this.borrows.map(borrow => {
      const itemImage = borrow.item_image || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(borrow.item_name + ' 物品插图 白色背景')}&image_size=square`;
      const fineAmount = borrow.overdue_days * 1;

      return `
        <tr>
          <td>
            <div class="item-cell">
              <img src="${itemImage}" alt="${borrow.item_name}" class="table-image" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><rect fill=%22%23f0f0f0%22 width=%2240%22 height=%2240%22/></svg>'">
              <span>${borrow.item_name}</span>
            </div>
          </td>
          <td>${borrow.user_nickname || borrow.user_phone}<br><small>${borrow.user_phone}</small></td>
          <td>${borrow.quantity} 件</td>
          <td>${borrow.borrow_date}</td>
          <td>${borrow.expected_return_date}</td>
          <td><span class="text-danger font-bold">${borrow.overdue_days} 天</span></td>
          <td><span class="text-danger">¥${fineAmount}</span></td>
          <td>
            <button class="btn-link remind-btn" data-id="${borrow.id}" data-phone="${borrow.user_phone}">发送提醒</button>
            <button class="btn-link return-btn" data-id="${borrow.id}">归还</button>
            <button class="btn-link detail-btn" data-id="${borrow.id}">详情</button>
          </td>
        </tr>
      `;
    }).join('');

    this.bindRowEvents();
  },

  bindRowEvents() {
    document.querySelectorAll('.remind-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const phone = btn.dataset.phone;
        if (confirm(`确认向用户 ${phone} 发送逾期提醒？`)) {
          const result = await MessageService.send({
            user_id: this.borrows.find(b => b.id == id)?.user_id,
            type: 'overdue',
            title: '逾期提醒',
            content: '您借用的物品已逾期，请尽快归还，否则将产生更多逾期费用。'
          });
          if (result.code === 0) {
            Toast.success('提醒已发送');
          } else {
            Toast.error(result.msg);
          }
        }
      });
    });

    document.querySelectorAll('.return-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const borrow = this.borrows.find(b => b.id == id);
        const fineAmount = borrow ? borrow.overdue_days * 1 : 0;
        if (confirm(`确认代用户归还？逾期罚款：${fineAmount}元`)) {
          const result = await BorrowService.returnItem(id, fineAmount);
          if (result.code === 0) {
            Toast.success('归还成功');
            this.loadStats();
            this.loadOverdueList();
          } else {
            Toast.error(result.msg);
          }
        }
      });
    });

    document.querySelectorAll('.detail-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Router.navigate(`borrow-detail/${btn.dataset.id}`);
      });
    });
  },

  renderPagination() {
    const totalPages = Math.ceil(this.total / this.pageSize);
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
      pagination.innerHTML = '';
      return;
    }

    let html = '';
    if (this.page > 1) {
      html += `<button class="page-btn" data-page="${this.page - 1}">上一页</button>`;
    }
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= this.page - 2 && i <= this.page + 2)) {
        html += `<button class="page-btn ${i === this.page ? 'active' : ''}" data-page="${i}">${i}</button>`;
      } else if (i === this.page - 3 || i === this.page + 3) {
        html += '<span class="page-ellipsis">...</span>';
      }
    }
    if (this.page < totalPages) {
      html += `<button class="page-btn" data-page="${this.page + 1}">下一页</button>`;
    }

    pagination.innerHTML = html;

    pagination.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.page = parseInt(btn.dataset.page);
        this.loadOverdueList();
      });
    });
  }
};

window.AdminOverduePage = AdminOverduePage;
