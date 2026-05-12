class CategoriesPage {
    constructor() {
        this.categories = [];
        this.init();
    }

    init() {
        document.addEventListener('pageChanged', (e) => {
            if (e.detail === 'categories') {
                this.loadData();
            }
        });

        this.bindEvents();
    }

    async loadData() {
        const result = await OrderAdminAPI.categories.list();
        if (result.code === 0) {
            this.categories = result.data.items || [];
            this.renderCategories();
        }
    }

    renderCategories() {
        const container = document.getElementById('category-list');
        container.innerHTML = '';

        this.categories.forEach(cat => {
            container.innerHTML += `
                <div class="category-card">
                    <div class="category-info">
                        <span class="icon">${cat.icon || '📁'}</span>
                        <h3>${cat.name}</h3>
                    </div>
                    <div class="actions">
                        <button class="btn btn-small btn-secondary" onclick="categoriesPage.editCategory(${cat.id})">编辑</button>
                        <button class="btn btn-small btn-danger" onclick="categoriesPage.deleteCategory(${cat.id})">删除</button>
                    </div>
                </div>
            `;
        });
    }

    bindEvents() {
        document.getElementById('add-category-btn').addEventListener('click', () => {
            this.openModal();
        });

        document.getElementById('category-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveCategory();
        });
    }

    openModal(category = null) {
        document.getElementById('category-modal-title').textContent = category ? '编辑分类' : '添加分类';
        document.getElementById('category-id').value = category ? category.id : '';
        document.getElementById('category-name').value = category ? category.name : '';
        document.getElementById('category-icon').value = category ? category.icon : '';
        document.getElementById('category-sort').value = category ? category.sort_order : 0;

        document.getElementById('modal-overlay').classList.add('active');
        document.getElementById('dish-modal').style.display = 'none';
        document.getElementById('category-modal').style.display = 'block';
    }

    async editCategory(id) {
        const result = await OrderAdminAPI.categories.get(id);
        if (result.code === 0) {
            this.openModal(result.data);
        }
    }

    async deleteCategory(id) {
        if (confirm('确定要删除这个分类吗？')) {
            const result = await OrderAdminAPI.categories.delete(id);
            if (result.code === 0) {
                showToast('删除成功');
                this.loadData();
            } else {
                showToast(result.msg || '删除失败', 'error');
            }
        }
    }

    async saveCategory() {
        const id = document.getElementById('category-id').value;
        const data = {
            name: document.getElementById('category-name').value,
            icon: document.getElementById('category-icon').value,
            sort_order: parseInt(document.getElementById('category-sort').value)
        };

        let result;
        if (id) {
            result = await OrderAdminAPI.categories.update(parseInt(id), data);
        } else {
            result = await OrderAdminAPI.categories.create(data);
        }

        if (result.code === 0) {
            showToast(id ? '更新成功' : '创建成功');
            document.getElementById('modal-overlay').classList.remove('active');
            this.loadData();
        } else {
            showToast(result.msg || '操作失败', 'error');
        }
    }
}

let categoriesPage;
document.addEventListener('DOMContentLoaded', () => {
    categoriesPage = new CategoriesPage();
});