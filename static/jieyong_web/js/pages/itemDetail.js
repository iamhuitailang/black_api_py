const ItemDetailPage = {
  render() {
    return `
      <div class="page-container">
        <button class="btn btn-back" onclick="Router.navigate('home')">← 返回列表</button>
        
        <div class="detail-container" id="detail-container">
          <div class="loading">加载中...</div>
        </div>
      </div>
    `;
  },

  data() {
    return {
      item: null,
      borrowForm: {
        quantity: 1,
        expected_return_date: '',
        remark: ''
      }
    };
  },

  async mount(itemId) {
    await this.loadItemDetail(itemId);
    this.itemId = itemId;
  },

  async loadItemDetail(itemId) {
    const result = await ItemService.getDetail(itemId);
    if (result.code === 0 && result.data) {
      this.item = result.data;
      this.renderDetail();
    } else {
      document.getElementById('detail-container').innerHTML = '<div class="error-state">物品不存在或已下架</div>';
    }
  },

  renderDetail() {
    const container = document.getElementById('detail-container');
    const item = this.item;
    const imageUrl = item.image || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(item.name + ' 物品插图 白色背景')}&image_size=square`;
    
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 1);

    container.innerHTML = `
      <div class="detail-header">
        <div class="detail-image">
          <img src="${imageUrl}" alt="${item.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22><rect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/><text x=%22100%22 y=%22100%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22>${item.name}</text></svg>'">
        </div>
        <div class="detail-info">
          <h1 class="detail-title">${item.name}</h1>
          <div class="detail-meta">
            <span class="tag">${item.category_name || '未分类'}</span>
            <span class="stock-badge ${item.available_quantity > 0 ? 'in-stock' : 'out-of-stock'}">
              ${item.available_quantity > 0 ? '可借' : '暂无库存'}
            </span>
          </div>
          <div class="detail-stats">
            <div class="stat-item">
              <span class="stat-value">${item.available_quantity}</span>
              <span class="stat-label">可借数量</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${item.total_quantity}</span>
              <span class="stat-label">总数量</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${item.borrow_count || 0}</span>
              <span class="stat-label">累计借用</span>
            </div>
          </div>
          <div class="detail-description">
            <h4>物品描述</h4>
            <p>${item.description || '暂无详细描述'}</p>
          </div>
          <div class="detail-rules">
            <h4>借用须知</h4>
            <p>${item.borrow_rules || '请爱护物品，按时归还。损坏或遗失需照价赔偿。'}</p>
          </div>
        </div>
      </div>

      <div class="borrow-form-section">
        <h3>申请借用</h3>
        <form id="borrow-form" class="borrow-form">
          <div class="form-row">
            <div class="form-group">
              <label>借用数量</label>
              <div class="quantity-selector">
                <button type="button" class="qty-btn" id="qty-minus">-</button>
                <input type="number" id="borrow-quantity" value="1" min="1" max="${item.available_quantity}" readonly>
                <button type="button" class="qty-btn" id="qty-plus">+</button>
              </div>
              <small class="form-hint">最多可借 ${item.available_quantity} 件</small>
            </div>
            <div class="form-group">
              <label>预计归还日期</label>
              <input type="date" id="return-date" required min="${minDate.toISOString().split('T')[0]}" max="${maxDate.toISOString().split('T')[0]}">
              <small class="form-hint">请选择预计归还日期</small>
            </div>
          </div>
          <div class="form-group">
            <label>备注（可选）</label>
            <textarea id="borrow-remark" rows="3" placeholder="请填写借用用途或其他说明..."></textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-lg" ${item.available_quantity <= 0 ? 'disabled' : ''}>
            ${item.available_quantity > 0 ? '立即申请借用' : '暂无库存'}
          </button>
        </form>
      </div>
    `;

    this.bindBorrowFormEvents();
  },

  bindBorrowFormEvents() {
    const minusBtn = document.getElementById('qty-minus');
    const plusBtn = document.getElementById('qty-plus');
    const qtyInput = document.getElementById('borrow-quantity');
    
    minusBtn.addEventListener('click', () => {
      const val = parseInt(qtyInput.value);
      if (val > 1) qtyInput.value = val - 1;
    });

    plusBtn.addEventListener('click', () => {
      const val = parseInt(qtyInput.value);
      if (val < this.item.available_quantity) qtyInput.value = val + 1;
    });

    document.getElementById('borrow-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!Storage.isLoggedIn()) {
        Toast.warning('请先登录');
        Router.navigate('login');
        return;
      }

      const quantity = parseInt(document.getElementById('borrow-quantity').value);
      const expected_return_date = document.getElementById('return-date').value;
      const remark = document.getElementById('borrow-remark').value;

      if (!expected_return_date) {
        Toast.error('请选择预计归还日期');
        return;
      }

      const result = await BorrowService.borrow({
        item_id: this.itemId,
        quantity,
        expected_return_date,
        remark
      });

      if (result.code === 0) {
        Toast.success('借用申请已提交');
        Router.navigate('my-borrows');
      } else {
        Toast.error(result.msg);
      }
    });
  }
};

window.ItemDetailPage = ItemDetailPage;
