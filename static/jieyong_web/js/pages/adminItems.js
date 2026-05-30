const AdminItemsPage = {
  render() {
    return `
      <div class="page-container">
        <div class="page-header">
          <h2>物品管理</h2>
          <div class="header-actions">
            <button class="btn btn-primary" id="add-item-btn">+ 新增物品</button>
          </div>
        </div>

        <div class="table-toolbar">
          <select id="category-filter">
            <option value="">全部分类</option>
          </select>
          <input type="text" id="keyword-search" placeholder="搜索物品名称...">
          <button class="btn btn-primary btn-sm" id="search-btn">搜索</button>
        </div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>图片</th>
                <th>物品名称</th>
                <th>分类</th>
                <th>总数量</th>
                <th>可借数量</th>
                <th>累计借用</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody id="items-tbody">
              <tr><td colspan="8" class="text-center">加载中...</td></tr>
            </tbody>
          </table>
        </div>

        <div class="pagination" id="pagination"></div>
      </div>

      <div id="item-modal" class="modal-overlay hidden">
        <div class="modal-content large">
          <div class="modal-header">
            <h3 id="modal-title">新增物品</h3>
            <button class="modal-close" id="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <form id="item-form">
              <div class="form-row">
                <div class="form-group">
                  <label>物品名称 *</label>
                  <input type="text" id="item-name" required placeholder="请输入物品名称">
                </div>
                <div class="form-group">
                  <label>分类 *</label>
                  <select id="item-category" required></select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>总数量 *</label>
                  <input type="number" id="item-total" required min="1" placeholder="请输入总数量">
                </div>
                <div class="form-group">
                  <label>状态</label>
                  <select id="item-status">
                    <option value="active">上架</option>
                    <option value="inactive">下架</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>图片URL</label>
                <input type="text" id="item-image" placeholder="请输入图片URL（可选）">
              </div>
              <div class="form-group">
                <label>物品描述</label>
                <textarea id="item-description" rows="3" placeholder="请输入物品描述（可选）"></textarea>
              </div>
              <div class="form-group">
                <label>借用规则</label>
                <textarea id="item-rules" rows="3" placeholder="请输入借用规则（可选）"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" id="modal-cancel">取消</button>
            <button class="btn btn-primary" id="modal-submit">保存</button>
          </div>
        </div>
      </div>
    `;
  },

  data() {
    return {
      items: [],
      categories: [],
      page: 1,
      pageSize: 10,
      total: 0,
      categoryId: '',
      keyword: '',
      editingId: null
    };
  },

  async mount() {
    await this.loadCategories();
    await this.loadItems();
    this.bindEvents();
  },

  bindEvents() {
    document.getElementById('add-item-btn').addEventListener('click', () => this.showModal());
    document.getElementById('modal-close').addEventListener('click', () => this.hideModal());
    document.getElementById('modal-cancel').addEventListener('click', () => this.hideModal());
    document.getElementById('modal-submit').addEventListener('click', () => this.submitForm());

    document.getElementById('category-filter').addEventListener('change', (e) => {
      this.categoryId = e.target.value;
      this.page = 1;
      this.loadItems();
    });

    document.getElementById('search-btn').addEventListener('click', () => {
      this.keyword = document.getElementById('keyword-search').value;
      this.page = 1;
      this.loadItems();
    });

    document.getElementById('keyword-search').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.keyword = e.target.value;
        this.page = 1;
        this.loadItems();
      }
    });

    document.getElementById('item-modal').addEventListener('click', (e) => {
      if (e.target.id === 'item-modal') this.hideModal();
    });
  },

  async loadCategories() {
    const result = await ItemService.getCategories();
    if (result.code === 0 && result.data) {
      this.categories = result.data;
      const filterSelect = document.getElementById('category-filter');
      const formSelect = document.getElementById('item-category');
      
      this.categories.forEach(cat => {
        const option1 = document.createElement('option');
        option1.value = cat.id;
        option1.textContent = cat.name;
        filterSelect.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = cat.id;
        option2.textContent = cat.name;
        formSelect.appendChild(option2);
      });
    }
  },

  async loadItems() {
    const params = {
      page: this.page,
      page_size: this.pageSize
    };
    if (this.categoryId) params.category_id = this.categoryId;
    if (this.keyword) params.keyword = this.keyword;

    const result = await ItemService.getList(params);
    if (result.code === 0 && result.data) {
      this.items = result.data.items;
      this.total = result.data.total;
      this.renderItems();
      this.renderPagination();
    }
  },

  renderItems() {
    const tbody = document.getElementById('items-tbody');
    
    if (this.items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center empty-state">暂无数据</td></tr>';
      return;
    }

    tbody.innerHTML = this.items.map(item => {
      const imageUrl = item.image || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(item.name + ' 物品插图 白色背景')}&image_size=square`;
      const statusClass = item.status === 'active' ? 'status-active' : 'status-inactive';
      const statusText = item.status === 'active' ? '上架' : '下架';
      
      return `
        <tr>
          <td><img src="${imageUrl}" alt="${item.name}" class="table-image" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><rect fill=%22%23f0f0f0%22 width=%2240%22 height=%2240%22/></svg>'"></td>
          <td>${item.name}</td>
          <td>${item.category_name || '-'}</td>
          <td>${item.total_quantity}</td>
          <td>${item.available_quantity}</td>
          <td>${item.borrow_count || 0}</td>
          <td><span class="status-badge ${statusClass}">${statusText}</span></td>
          <td>
            <button class="btn-link edit-btn" data-id="${item.id}">编辑</button>
            <button class="btn-link danger delete-btn" data-id="${item.id}">删除</button>
          </td>
        </tr>
      `;
    }).join('');

    this.bindRowEvents();
  },

  bindRowEvents() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const item = this.items.find(i => i.id == id);
        if (item) this.showModal(item);
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (confirm('确认删除该物品？')) {
          const result = await ItemService.delete(id);
          if (result.code === 0) {
            Toast.success('删除成功');
            this.loadItems();
          } else {
            Toast.error(result.msg);
          }
        }
      });
    });
  },

  showModal(item = null) {
    this.editingId = item ? item.id : null;
    document.getElementById('modal-title').textContent = item ? '编辑物品' : '新增物品';
    
    if (item) {
      document.getElementById('item-name').value = item.name;
      document.getElementById('item-category').value = item.category_id;
      document.getElementById('item-total').value = item.total_quantity;
      document.getElementById('item-status').value = item.status;
      document.getElementById('item-image').value = item.image || '';
      document.getElementById('item-description').value = item.description || '';
      document.getElementById('item-rules').value = item.borrow_rules || '';
    } else {
      document.getElementById('item-form').reset();
    }
    
    document.getElementById('item-modal').classList.remove('hidden');
  },

  hideModal() {
    document.getElementById('item-modal').classList.add('hidden');
    this.editingId = null;
  },

  async submitForm() {
    const data = {
      name: document.getElementById('item-name').value,
      category_id: document.getElementById('item-category').value,
      total_quantity: parseInt(document.getElementById('item-total').value),
      status: document.getElementById('item-status').value,
      image: document.getElementById('item-image').value,
      description: document.getElementById('item-description').value,
      borrow_rules: document.getElementById('item-rules').value
    };

    if (!data.name || !data.category_id || !data.total_quantity) {
      Toast.error('请填写必填项');
      return;
    }

    let result;
    if (this.editingId) {
      data.item_id = this.editingId;
      result = await ItemService.update(data);
    } else {
      result = await ItemService.create(data);
    }

    if (result.code === 0) {
      Toast.success(this.editingId ? '更新成功' : '创建成功');
      this.hideModal();
      this.loadItems();
    } else {
      Toast.error(result.msg);
    }
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
        this.loadItems();
      });
    });
  }
};

window.AdminItemsPage = AdminItemsPage;
