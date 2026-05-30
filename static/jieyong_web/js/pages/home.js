const HomePage = {
  render() {
    return `
      <div class="page-container">
        <div class="page-header">
          <h2>物品列表</h2>
          <div class="search-bar">
            <select id="category-filter">
              <option value="">全部分类</option>
            </select>
            <input type="text" id="keyword-search" placeholder="搜索物品名称...">
            <button class="btn btn-primary" id="search-btn">搜索</button>
          </div>
        </div>

        <div class="hot-items" id="hot-items">
          <h3>热门物品</h3>
          <div class="item-grid" id="hot-items-grid"></div>
        </div>

        <div class="item-list">
          <h3>全部物品</h3>
          <div class="item-grid" id="items-grid"></div>
          <div class="pagination" id="pagination"></div>
        </div>
      </div>
    `;
  },

  data() {
    return {
      categories: [],
      items: [],
      hotItems: [],
      page: 1,
      pageSize: 12,
      total: 0,
      categoryId: '',
      keyword: ''
    };
  },

  async mount() {
    await this.loadCategories();
    await this.loadHotItems();
    await this.loadItems();

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
  },

  async loadCategories() {
    const result = await ItemService.getCategories();
    if (result.code === 0 && result.data) {
      this.categories = result.data;
      const select = document.getElementById('category-filter');
      this.categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        select.appendChild(option);
      });
    }
  },

  async loadHotItems() {
    const result = await ItemService.getHot(6);
    if (result.code === 0 && result.data) {
      this.hotItems = result.data;
      this.renderHotItems();
    }
  },

  async loadItems() {
    const params = {
      page: this.page,
      page_size: this.pageSize,
      only_available: true
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

  renderHotItems() {
    const grid = document.getElementById('hot-items-grid');
    grid.innerHTML = this.hotItems.map(item => this.renderItemCard(item, true)).join('');
    this.bindCardEvents();
  },

  renderItems() {
    const grid = document.getElementById('items-grid');
    if (this.items.length === 0) {
      grid.innerHTML = '<div class="empty-state">暂无物品数据</div>';
      return;
    }
    grid.innerHTML = this.items.map(item => this.renderItemCard(item)).join('');
    this.bindCardEvents();
  },

  renderItemCard(item, isHot = false) {
    const imageUrl = item.image || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(item.name + ' 物品插图 白色背景')}&image_size=square`;
    const stockClass = item.available_quantity > 0 ? 'in-stock' : 'out-of-stock';
    const stockText = item.available_quantity > 0 ? `可借 ${item.available_quantity} 件` : '暂无库存';
    
    return `
      <div class="item-card" data-id="${item.id}">
        <div class="item-image">
          <img src="${imageUrl}" alt="${item.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23f0f0f0%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2250%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2212%22>${item.name}</text></svg>'">
          ${isHot ? '<span class="hot-badge">热门</span>' : ''}
        </div>
        <div class="item-info">
          <h4 class="item-name">${item.name}</h4>
          <p class="item-category">${item.category_name || '未分类'}</p>
          <p class="item-desc">${item.description || '暂无描述'}</p>
          <div class="item-footer">
            <span class="stock-status ${stockClass}">${stockText}</span>
            <span class="borrow-count">已借 ${item.borrow_count || 0} 次</span>
          </div>
        </div>
      </div>
    `;
  },

  bindCardEvents() {
    document.querySelectorAll('.item-card').forEach(card => {
      card.addEventListener('click', () => {
        const itemId = card.dataset.id;
        Router.navigate(`item/${itemId}`);
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
        this.loadItems();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }
};

window.HomePage = HomePage;
