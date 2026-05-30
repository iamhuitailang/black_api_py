const AdminBorrowsPage = {
  render() {
    return `
      <div class="page-container">
        <div class="page-header">
          <h2>借用记录管理</h2>
          <div class="header-actions">
            <button class="btn btn-outline btn-sm" id="export-btn">导出记录</button>
            <button class="btn btn-primary btn-sm" id="check-overdue-btn">检查逾期</button>
          </div>
        </div>

        <div class="filter-tabs">
          <button class="filter-btn active" data-status="all">全部</button>
          <button class="filter-btn" data-status="pending">待审核</button>
          <button class="filter-btn" data-status="borrowing">借用中</button>
          <button class="filter-btn" data-status="returned">已归还</button>
          <button class="filter-btn" data-status="overdue">已逾期</button>
          <button class="filter-btn" data-status="rejected">已拒绝</button>
        </div>

        <div class="table-toolbar">
          <input type="text" id="keyword-search" placeholder="搜索物品名称/用户...">
          <select id="item-filter">
            <option value="">全部物品</option>
          </select>
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
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody id="borrows-tbody">
              <tr><td colspan="7" class="text-center">加载中...</td></tr>
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
      items: [],
      page: 1,
      pageSize: 10,
      total: 0,
      status: 'all',
      keyword: '',
      itemId: ''
    };
  },

  async mount() {
    await this.loadItems();
    await this.loadBorrows();
    this.bindEvents();
  },

  bindEvents() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.status = btn.dataset.status;
        this.page = 1;
        this.loadBorrows();
      });
    });

    document.getElementById('item-filter').addEventListener('change', (e) => {
      this.itemId = e.target.value;
      this.page = 1;
      this.loadBorrows();
    });

    document.getElementById('search-btn').addEventListener('click', () => {
      this.keyword = document.getElementById('keyword-search').value;
      this.page = 1;
      this.loadBorrows();
    });

    document.getElementById('keyword-search').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.keyword = e.target.value;
        this.page = 1;
        this.loadBorrows();
      }
    });

    document.getElementById('check-overdue-btn').addEventListener('click', async () => {
      if (confirm('确认检查所有逾期记录？这将标记逾期记录并发送提醒。')) {
        const result = await BorrowService.checkOverdue();
        if (result.code === 0) {
          Toast.success(`检查完成，共处理 ${result.data?.count || 0} 条逾期记录`);
          this.loadBorrows();
        } else {
          Toast.error(result.msg);
        }
      }
    });

    document.getElementById('export-btn').addEventListener('click', async () => {
      const result = await StatisticsService.exportRecords({ status: this.status });
      if (result.code === 0 && result.data) {
        const csvContent = this.convertToCSV(result.data);
        this.downloadCSV(csvContent, `借用记录_${new Date().toISOString().slice(0, 10)}.csv`);
        Toast.success('导出成功');
      } else {
        Toast.error(result.msg);
      }
    });
  },

  async loadItems() {
    const result = await ItemService.getList({ page: 1, page_size: 1000 });
    if (result.code === 0 && result.data) {
      this.items = result.data.items;
      const select = document.getElementById('item-filter');
      this.items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.name;
        select.appendChild(option);
      });
    }
  },

  async loadBorrows() {
    const params = {
      page: this.page,
      page_size: this.pageSize
    };
    if (this.status !== 'all') params.status = this.status;
    if (this.keyword) params.keyword = this.keyword;
    if (this.itemId) params.item_id = this.itemId;

    const result = await BorrowService.getList(params);
    if (result.code === 0 && result.data) {
      this.borrows = result.data.items;
      this.total = result.data.total;
      this.renderBorrows();
      this.renderPagination();
    }
  },

  renderBorrows() {
    const tbody = document.getElementById('borrows-tbody');
    
    if (this.borrows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center empty-state">暂无数据</td></tr>';
      return;
    }

    const statusMap = {
      pending: { text: '待审核', class: 'status-pending' },
      approved: { text: '已通过', class: 'status-approved' },
      borrowing: { text: '借用中', class: 'status-borrowing' },
      returned: { text: '已归还', class: 'status-returned' },
      overdue: { text: '已逾期', class: 'status-overdue' },
      rejected: { text: '已拒绝', class: 'status-rejected' }
    };

    tbody.innerHTML = this.borrows.map(borrow => {
      const status = statusMap[borrow.status] || { text: borrow.status, class: '' };
      const itemImage = borrow.item_image || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(borrow.item_name + ' 物品插图 白色背景')}&image_size=square`;
      const canApprove = borrow.status === 'pending';
      const canReturn = ['borrowing', 'overdue'].includes(borrow.status);

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
          <td>${borrow.expected_return_date}<br>${borrow.overdue_days > 0 ? `<small class="text-danger">逾期${borrow.overdue_days}天</small>` : ''}</td>
          <td><span class="status-badge ${status.class}">${status.text}</span></td>
          <td>
            ${canApprove ? `
              <button class="btn-link success approve-btn" data-id="${borrow.id}">通过</button>
              <button class="btn-link danger reject-btn" data-id="${borrow.id}">拒绝</button>
            ` : ''}
            ${canReturn ? `<button class="btn-link return-btn" data-id="${borrow.id}">归还</button>` : ''}
            <button class="btn-link detail-btn" data-id="${borrow.id}">详情</button>
          </td>
        </tr>
      `;
    }).join('');

    this.bindRowEvents();
  },

  bindRowEvents() {
    document.querySelectorAll('.approve-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (confirm('确认通过该借用申请？')) {
          const result = await BorrowService.approve(id);
          if (result.code === 0) {
            Toast.success('审核通过');
            this.loadBorrows();
          } else {
            Toast.error(result.msg);
          }
        }
      });
    });

    document.querySelectorAll('.reject-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const reason = prompt('请输入拒绝原因：');
        if (reason !== null) {
          const result = await BorrowService.reject(id, reason);
          if (result.code === 0) {
            Toast.success('已拒绝');
            this.loadBorrows();
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
        let fineAmount = 0;
        if (borrow && borrow.status === 'overdue') {
          fineAmount = borrow.overdue_days * 1;
        }
        if (confirm(`确认代用户归还？${fineAmount > 0 ? `（逾期罚款：${fineAmount}元）` : ''}`)) {
          const result = await BorrowService.returnItem(id, fineAmount);
          if (result.code === 0) {
            Toast.success('归还成功');
            this.loadBorrows();
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

  convertToCSV(data) {
    const headers = ['ID', '物品名称', '用户', '手机号', '数量', '借用日期', '预计归还', '实际归还', '状态', '逾期天数', '罚款金额'];
    const statusMap = { pending: '待审核', approved: '已通过', borrowing: '借用中', returned: '已归还', overdue: '已逾期', rejected: '已拒绝' };
    
    const rows = data.map(row => [
      row.id,
      row.item_name,
      row.user_nickname || '',
      row.user_phone,
      row.quantity,
      row.borrow_date,
      row.expected_return_date,
      row.return_date || '',
      statusMap[row.status] || row.status,
      row.overdue_days || 0,
      row.fine_amount || 0
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  },

  downloadCSV(content, filename) {
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
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
        this.loadBorrows();
      });
    });
  }
};

window.AdminBorrowsPage = AdminBorrowsPage;
