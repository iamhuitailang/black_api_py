const BorrowDetailPage = {
  render() {
    return `
      <div class="page-container">
        <button class="btn btn-back" onclick="Router.navigate('my-borrows')">← 返回</button>
        
        <div class="detail-container" id="detail-container">
          <div class="loading">加载中...</div>
        </div>
      </div>
    `;
  },

  data() {
    return {
      borrow: null
    };
  },

  async mount(borrowId) {
    const self = this;
    this.borrowId = borrowId;
    await this.loadBorrowDetail(self);
  },

  async loadBorrowDetail(self) {
    const result = await BorrowService.getDetail(this.borrowId);
    if (result.code === 0 && result.data) {
      this.borrow = result.data;
      this.renderDetail(self);
    } else {
      document.getElementById('detail-container').innerHTML = '<div class="error-state">借用记录不存在</div>';
    }
  },

  renderDetail(self) {
    const container = document.getElementById('detail-container');
    const borrow = this.borrow;
    
    const statusMap = {
      pending: { text: '待审核', class: 'status-pending' },
      approved: { text: '已通过', class: 'status-approved' },
      borrowing: { text: '借用中', class: 'status-borrowing' },
      returned: { text: '已归还', class: 'status-returned' },
      overdue: { text: '已逾期', class: 'status-overdue' },
      rejected: { text: '已拒绝', class: 'status-rejected' }
    };
    
    const status = statusMap[borrow.status] || { text: borrow.status, class: '' };
    const itemImage = borrow.item_image || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(borrow.item_name + ' 物品插图 白色背景')}&image_size=square`;
    const canReturn = ['borrowing', 'overdue'].includes(borrow.status) && Storage.getUser().id == borrow.user_id;
    const canApprove = Storage.isAdmin() && borrow.status === 'pending';
    const canManualReturn = Storage.isAdmin() && ['borrowing', 'overdue'].includes(borrow.status);
    
    const borrowDate = borrow.borrow_date || (borrow.created_at ? borrow.created_at.slice(0, 10) : '');
    const overdueDays = borrow.overdue_days || 0;
    const fineAmount = borrow.fine_amount || 0;

    container.innerHTML = `
      <div class="borrow-detail">
        <div class="detail-header">
          <div class="item-image-large">
            <img src="${itemImage}" alt="${borrow.item_name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22><rect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/></svg>'">
          </div>
          <div class="detail-main">
            <div class="detail-title-row">
              <h1 class="detail-title">${borrow.item_name}</h1>
              <span class="status-badge large ${status.class}">${status.text}</span>
            </div>
            <p class="item-category">${borrow.category_name || '未分类'}</p>
            
            <div class="detail-info-grid">
              <div class="info-item">
                <span class="info-label">借用数量</span>
                <span class="info-value">${borrow.quantity} 件</span>
              </div>
              <div class="info-item">
                <span class="info-label">借用日期</span>
                <span class="info-value">${borrowDate}</span>
              </div>
              <div class="info-item">
                <span class="info-label">预计归还</span>
                <span class="info-value">${borrow.expected_return_date}</span>
              </div>
              ${borrow.return_date ? `
              <div class="info-item">
                <span class="info-label">实际归还</span>
                <span class="info-value">${borrow.return_date}</span>
              </div>
              ` : ''}
              ${overdueDays > 0 ? `
              <div class="info-item">
                <span class="info-label">逾期天数</span>
                <span class="info-value text-danger">${overdueDays} 天</span>
              </div>
              ` : ''}
              ${fineAmount > 0 ? `
              <div class="info-item">
                <span class="info-label">逾期罚款</span>
                <span class="info-value text-danger">¥${fineAmount}</span>
              </div>
              ` : ''}
            </div>

            <div class="detail-actions" id="detail-actions">
              ${canReturn ? `<button class="btn btn-primary" id="return-btn">归还物品</button>` : ''}
              ${canApprove ? `
                <button class="btn btn-success" id="approve-btn">通过</button>
                <button class="btn btn-danger" id="reject-btn">拒绝</button>
              ` : ''}
              ${canManualReturn ? `<button class="btn btn-warning" id="manual-return-btn">代用户归还</button>` : ''}
            </div>
          </div>
        </div>

        <div class="detail-sections">
          <div class="detail-section">
            <h3>借用用户</h3>
            <div class="user-info-card">
              <div class="user-avatar">${borrow.user_nickname ? borrow.user_nickname.charAt(0).toUpperCase() : 'U'}</div>
              <div>
                <p class="user-name">${borrow.user_nickname || '未设置昵称'}</p>
                <p class="user-phone">${borrow.user_phone}</p>
              </div>
            </div>
          </div>

          ${borrow.remark ? `
          <div class="detail-section">
            <h3>借用备注</h3>
            <p class="section-content">${borrow.remark}</p>
          </div>
          ` : ''}

          ${borrow.reject_reason ? `
          <div class="detail-section">
            <h3>拒绝原因</h3>
            <p class="section-content text-danger">${borrow.reject_reason}</p>
          </div>
          ` : ''}

          ${borrow.item_description ? `
          <div class="detail-section">
            <h3>物品描述</h3>
            <p class="section-content">${borrow.item_description}</p>
          </div>
          ` : ''}
        </div>
      </div>
    `;

    this.bindActionEvents(self);
  },

  bindActionEvents(self) {
    const returnBtn = document.getElementById('return-btn');
    if (returnBtn) {
      returnBtn.addEventListener('click', async function() {
        let fineAmount = 0;
        if (self.borrow.status === 'overdue') {
          fineAmount = self.borrow.overdue_days * 1;
          if (!confirm(`该物品已逾期 ${self.borrow.overdue_days} 天，需支付逾期罚款 ${fineAmount} 元。是否确认归还？`)) {
            return;
          }
        } else {
          if (!confirm('确认归还该物品？')) {
            return;
          }
        }

        const result = await BorrowService.returnItem(self.borrowId, fineAmount);
        if (result.code === 0) {
          Toast.success('归还成功');
          self.loadBorrowDetail(self);
        } else {
          Toast.error(result.msg);
        }
      });
    }

    const manualReturnBtn = document.getElementById('manual-return-btn');
    if (manualReturnBtn) {
      manualReturnBtn.addEventListener('click', async function() {
        let fineAmount = 0;
        if (self.borrow.status === 'overdue') {
          fineAmount = self.borrow.overdue_days * 1;
        }
        if (confirm(`确认代用户归还该物品？${fineAmount > 0 ? `（逾期罚款：${fineAmount}元）` : ''}`)) {
          const result = await BorrowService.returnItem(self.borrowId, fineAmount);
          if (result.code === 0) {
            Toast.success('归还成功');
            self.loadBorrowDetail(self);
          } else {
            Toast.error(result.msg);
          }
        }
      });
    }

    const approveBtn = document.getElementById('approve-btn');
    if (approveBtn) {
      approveBtn.addEventListener('click', async function() {
        if (confirm('确认通过该借用申请？')) {
          const result = await BorrowService.approve(self.borrowId);
          if (result.code === 0) {
            Toast.success('审核通过');
            self.loadBorrowDetail(self);
          } else {
            Toast.error(result.msg);
          }
        }
      });
    }

    const rejectBtn = document.getElementById('reject-btn');
    if (rejectBtn) {
      rejectBtn.addEventListener('click', async function() {
        const reason = prompt('请输入拒绝原因：');
        if (reason !== null) {
          const result = await BorrowService.reject(self.borrowId, reason);
          if (result.code === 0) {
            Toast.success('已拒绝');
            self.loadBorrowDetail(self);
          } else {
            Toast.error(result.msg);
          }
        }
      });
    }
  }
};

window.BorrowDetailPage = BorrowDetailPage;
