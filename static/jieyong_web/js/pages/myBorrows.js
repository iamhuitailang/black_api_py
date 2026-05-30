const MyBorrowsPage = {
  render() {
    return `
      <div class="page-container">
        <div class="page-header">
          <h2>我的借用</h2>
          <div class="filter-tabs">
            <button class="filter-btn active" data-status="all">全部</button>
            <button class="filter-btn" data-status="borrowing">借用中</button>
            <button class="filter-btn" data-status="pending">待审核</button>
            <button class="filter-btn" data-status="returned">已归还</button>
            <button class="filter-btn" data-status="overdue">已逾期</button>
          </div>
        </div>

        <div class="borrow-list" id="borrow-list">
          <div class="loading">加载中...</div>
        </div>

        <div class="pagination" id="pagination"></div>
      </div>
    `;
  },

  data() {
    return {
      borrows: [],
      page: 1,
      pageSize: 10,
      total: 0,
      status: 'all'
    };
  },

  async mount() {
    const self = this;
    await this.loadBorrows();
    this.bindFilterEvents(self);
  },

  bindFilterEvents(self) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        self.status = btn.dataset.status;
        self.page = 1;
        self.loadBorrows();
      });
    });
  },

  async loadBorrows() {
    const self = this;
    const statusMap = {
      'pending': 0,
      'borrowing': 1,
      'returned': 2,
      'overdue': 3,
      'rejected': 4
    };
    const params = {
      page: this.page,
      page_size: this.pageSize
    };
    if (this.status !== 'all' && statusMap[this.status] !== undefined) {
      params.status = statusMap[this.status];
    }

    const result = await BorrowService.getMyBorrows(params);
    if (result.code === 0 && result.data) {
      this.borrows = result.data.items;
      this.total = result.data.total;
      this.renderBorrows(self);
      this.renderPagination(self);
    } else {
      document.getElementById('borrow-list').innerHTML = '<div class="empty-state">暂无借用记录</div>';
    }
  },

  renderBorrows(self) {
    const list = document.getElementById('borrow-list');
    
    if (this.borrows.length === 0) {
      list.innerHTML = '<div class="empty-state">暂无借用记录</div>';
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

    list.innerHTML = this.borrows.map(borrow => {
      const status = statusMap[borrow.status] || { text: borrow.status, class: '' };
      const itemImage = borrow.item_image || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(borrow.item_name + ' 物品插图 白色背景')}&image_size=square`;
      
      const canReturn = ['borrowing', 'overdue'].includes(borrow.status);
      const isOverdue = borrow.status === 'overdue';

      return `
        <div class="borrow-card" data-id="${borrow.id}">
          <div class="borrow-item-image">
            <img src="${itemImage}" alt="${borrow.item_name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 80 80%22><rect fill=%22%23f0f0f0%22 width=%2280%22 height=%2280%22/></svg>'">
          </div>
          <div class="borrow-info">
            <div class="borrow-header">
              <h4 class="borrow-item-name">${borrow.item_name}</h4>
              <span class="status-badge ${status.class}">${status.text}</span>
            </div>
            <div class="borrow-details">
              <span>数量：${borrow.quantity} 件</span>
              <span>借用日期：${borrow.borrow_date || borrow.created_at ? (borrow.created_at || '').slice(0, 10) : ''}</span>
              <span>预计归还：${borrow.expected_return_date}</span>
              ${borrow.return_date ? `<span>实际归还：${borrow.return_date}</span>` : ''}
            </div>
            ${isOverdue ? `<div class="overdue-warning">⚠️ 已逾期 ${borrow.overdue_days || 0} 天</div>` : ''}
            ${borrow.remark ? `<div class="borrow-remark">备注：${borrow.remark}</div>` : ''}
            ${borrow.reject_reason ? `<div class="reject-reason">拒绝原因：${borrow.reject_reason}</div>` : ''}
          </div>
          <div class="borrow-actions">
            ${canReturn ? `<button class="btn btn-primary btn-sm return-btn" data-id="${borrow.id}">归还</button>` : ''}
            <button class="btn btn-outline btn-sm detail-btn" data-id="${borrow.id}">查看详情</button>
          </div>
        </div>
      `;
    }).join('');

    this.bindCardEvents(self);
  },

  bindCardEvents(self) {
    document.querySelectorAll('.return-btn').forEach(function(btn) {
      btn.addEventListener('click', async function(e) {
        e.stopPropagation();
        const borrowId = btn.dataset.id;
        const borrow = self.borrows.find(b => b.id == borrowId);
        
        let fineAmount = 0;
        if (borrow && borrow.status === 'overdue') {
          fineAmount = borrow.overdue_days * 1;
          if (!confirm(`该物品已逾期 ${borrow.overdue_days} 天，需支付逾期罚款 ${fineAmount} 元。是否确认归还？`)) {
            return;
          }
        } else {
          if (!confirm('确认归还该物品？')) {
            return;
          }
        }

        const result = await BorrowService.returnItem(borrowId, fineAmount);
        if (result.code === 0) {
          Toast.success('归还成功');
          self.loadBorrows();
        } else {
          Toast.error(result.msg);
        }
      });
    });

    document.querySelectorAll('.detail-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        Router.navigate(`borrow-detail/${btn.dataset.id}`);
      });
    });

    document.querySelectorAll('.borrow-card').forEach(function(card) {
      card.addEventListener('click', function() {
        Router.navigate(`borrow-detail/${card.dataset.id}`);
      });
    });
  },

  renderPagination(self) {
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

    pagination.querySelectorAll('.page-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        self.page = parseInt(btn.dataset.page);
        self.loadBorrows();
      });
    });
  }
};

window.MyBorrowsPage = MyBorrowsPage;
