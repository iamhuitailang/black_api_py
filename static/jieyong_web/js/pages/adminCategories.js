const AdminCategoriesPage = {
  render() {
    return `
      <div class="page-container">
        <div class="page-header">
          <h2>分类管理</h2>
          <div class="header-actions">
            <button class="btn btn-primary" id="add-category-btn">+ 新增分类</button>
          </div>
        </div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>分类名称</th>
                <th>分类描述</th>
                <th>物品数量</th>
                <th>排序</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody id="categories-tbody">
              <tr><td colspan="6" class="text-center">加载中...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div id="category-modal" class="modal-overlay hidden">
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="modal-title">新增分类</h3>
            <button class="modal-close" id="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <form id="category-form">
              <div class="form-group">
                <label>分类名称 *</label>
                <input type="text" id="category-name" required placeholder="请输入分类名称">
              </div>
              <div class="form-group">
                <label>分类描述</label>
                <textarea id="category-description" rows="3" placeholder="请输入分类描述（可选）"></textarea>
              </div>
              <div class="form-group">
                <label>排序</label>
                <input type="number" id="category-sort" value="0" placeholder="数字越小越靠前">
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
      categories: [],
      editingId: null
    };
  },

  async mount() {
    await this.loadCategories();
    this.bindEvents();
  },

  bindEvents() {
    document.getElementById('add-category-btn').addEventListener('click', () => this.showModal());
    document.getElementById('modal-close').addEventListener('click', () => this.hideModal());
    document.getElementById('modal-cancel').addEventListener('click', () => this.hideModal());
    document.getElementById('modal-submit').addEventListener('click', () => this.submitForm());
    document.getElementById('category-modal').addEventListener('click', (e) => {
      if (e.target.id === 'category-modal') this.hideModal();
    });
  },

  async loadCategories() {
    const result = await ItemService.getCategoryList({ page: 1, page_size: 1000 });
    if (result.code === 0 && result.data) {
      this.categories = result.data.items || result.data;
      this.renderCategories();
    }
  },

  renderCategories() {
    const tbody = document.getElementById('categories-tbody');
    
    if (this.categories.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center empty-state">暂无数据</td></tr>';
      return;
    }

    tbody.innerHTML = this.categories.map(cat => `
      <tr>
        <td>${cat.id}</td>
        <td>${cat.name}</td>
        <td>${cat.description || '-'}</td>
        <td>${cat.item_count || 0}</td>
        <td>${cat.sort_order || 0}</td>
        <td>
          <button class="btn-link edit-btn" data-id="${cat.id}">编辑</button>
          <button class="btn-link danger delete-btn" data-id="${cat.id}">删除</button>
        </td>
      </tr>
    `).join('');

    this.bindRowEvents();
  },

  bindRowEvents() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const cat = this.categories.find(c => c.id == id);
        if (cat) this.showModal(cat);
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (confirm('确认删除该分类？分类下的物品将变为未分类。')) {
          const result = await ItemService.deleteCategory(id);
          if (result.code === 0) {
            Toast.success('删除成功');
            this.loadCategories();
          } else {
            Toast.error(result.msg);
          }
        }
      });
    });
  },

  showModal(cat = null) {
    this.editingId = cat ? cat.id : null;
    document.getElementById('modal-title').textContent = cat ? '编辑分类' : '新增分类';
    
    if (cat) {
      document.getElementById('category-name').value = cat.name;
      document.getElementById('category-description').value = cat.description || '';
      document.getElementById('category-sort').value = cat.sort_order || 0;
    } else {
      document.getElementById('category-form').reset();
      document.getElementById('category-sort').value = 0;
    }
    
    document.getElementById('category-modal').classList.remove('hidden');
  },

  hideModal() {
    document.getElementById('category-modal').classList.add('hidden');
    this.editingId = null;
  },

  async submitForm() {
    const data = {
      name: document.getElementById('category-name').value,
      description: document.getElementById('category-description').value,
      sort_order: parseInt(document.getElementById('category-sort').value) || 0
    };

    if (!data.name) {
      Toast.error('请填写分类名称');
      return;
    }

    let result;
    if (this.editingId) {
      data.category_id = this.editingId;
      result = await ItemService.updateCategory(data);
    } else {
      result = await ItemService.createCategory(data);
    }

    if (result.code === 0) {
      Toast.success(this.editingId ? '更新成功' : '创建成功');
      this.hideModal();
      this.loadCategories();
    } else {
      Toast.error(result.msg);
    }
  }
};

window.AdminCategoriesPage = AdminCategoriesPage;
