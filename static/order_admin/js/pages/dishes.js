class DishesPage {
    constructor() {
        this.categories = [];
        this.dishes = [];
        this.init();
    }

    init() {
        document.addEventListener('pageChanged', (e) => {
            if (e.detail === 'dishes') {
                this.loadData();
            }
        });

        this.bindEvents();
    }

    async loadData() {
        await this.loadCategories();
        await this.loadDishes();
    }

    async loadCategories() {
        const result = await OrderAdminAPI.categories.list();
        if (result.code === 0) {
            this.categories = result.data.items || [];
            this.renderCategoryFilters();
            this.renderCategorySelects();
        }
    }

    async loadDishes() {
        const categoryId = document.getElementById('dish-category-filter').value;
        const status = document.getElementById('dish-status-filter').value;

        const result = await OrderAdminAPI.dishes.all(1, 100,
            categoryId || null,
            status ? parseInt(status) : null
        );

        if (result.code === 0) {
            this.dishes = result.data.items || [];
            this.renderDishesTable();
        }
    }

    renderCategoryFilters() {
        const select = document.getElementById('dish-category-filter');
        select.innerHTML = '<option value="">全部分类</option>';
        this.categories.forEach(cat => {
            select.innerHTML += `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`;
        });
    }

    renderCategorySelects() {
        const select = document.getElementById('dish-category');
        select.innerHTML = '';
        this.categories.forEach(cat => {
            select.innerHTML += `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`;
        });
    }

    renderDishesTable() {
        const tbody = document.querySelector('#dishes-table tbody');
        tbody.innerHTML = '';

        this.dishes.forEach(dish => {
            const category = this.categories.find(c => c.id === dish.category_id);
            const categoryName = category ? `${category.icon} ${category.name}` : '-';
            const statusClass = dish.status === 1 ? 'status-active' : 'status-inactive';
            const statusText = dish.status === 1 ? '上架' : '下架';

            tbody.innerHTML += `
                <tr>
                    <td>${dish.id}</td>
                    <td><img src="${dish.image_url || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22><rect fill=%22%23ddd%22 width=%2250%22 height=%2250%22/></svg>'}" class="dish-img" alt="${dish.name}"></td>
                    <td>${dish.name}</td>
                    <td>${categoryName}</td>
                    <td>${formatPrice(dish.price)}</td>
                    <td>${dish.stock}</td>
                    <td>${dish.sold_count}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td class="actions">
                        <button class="btn btn-small btn-secondary" onclick="dishesPage.editDish(${dish.id})">编辑</button>
                        <button class="btn btn-small btn-danger" onclick="dishesPage.deleteDish(${dish.id})">删除</button>
                    </td>
                </tr>
            `;
        });
    }

    bindEvents() {
        document.getElementById('add-dish-btn').addEventListener('click', () => {
            this.openModal();
        });

        document.getElementById('dish-category-filter').addEventListener('change', () => {
            this.loadDishes();
        });

        document.getElementById('dish-status-filter').addEventListener('change', () => {
            this.loadDishes();
        });

        document.getElementById('dish-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveDish();
        });
    }

    openModal(dish = null) {
        document.getElementById('dish-modal-title').textContent = dish ? '编辑菜品' : '添加菜品';
        document.getElementById('dish-id').value = dish ? dish.id : '';
        document.getElementById('dish-name').value = dish ? dish.name : '';
        document.getElementById('dish-price').value = dish ? dish.price : '';
        document.getElementById('dish-cost').value = dish ? dish.cost : '';
        document.getElementById('dish-stock').value = dish ? dish.stock : 999;
        document.getElementById('dish-image').value = dish ? dish.image_url : '';
        document.getElementById('dish-description').value = dish ? dish.description : '';
        document.getElementById('dish-sort').value = dish ? dish.sort_order : 0;
        document.getElementById('dish-status').value = dish ? dish.status : 1;

        if (dish) {
            document.getElementById('dish-category').value = dish.category_id;
        }

        document.getElementById('modal-overlay').classList.add('active');
        document.getElementById('dish-modal').style.display = 'block';
        document.getElementById('category-modal').style.display = 'none';
    }

    async editDish(id) {
        const result = await OrderAdminAPI.dishes.get(id);
        if (result.code === 0) {
            this.openModal(result.data);
        }
    }

    async deleteDish(id) {
        if (confirm('确定要删除这个菜品吗？')) {
            const result = await OrderAdminAPI.dishes.delete(id);
            if (result.code === 0) {
                showToast('删除成功');
                this.loadDishes();
            } else {
                showToast(result.msg || '删除失败', 'error');
            }
        }
    }

    async saveDish() {
        const id = document.getElementById('dish-id').value;
        const data = {
            category_id: parseInt(document.getElementById('dish-category').value),
            name: document.getElementById('dish-name').value,
            price: parseFloat(document.getElementById('dish-price').value),
            cost: parseFloat(document.getElementById('dish-cost').value) || 0,
            stock: parseInt(document.getElementById('dish-stock').value),
            image_url: document.getElementById('dish-image').value,
            description: document.getElementById('dish-description').value,
            sort_order: parseInt(document.getElementById('dish-sort').value),
            status: parseInt(document.getElementById('dish-status').value)
        };

        let result;
        if (id) {
            result = await OrderAdminAPI.dishes.update(parseInt(id), data);
        } else {
            result = await OrderAdminAPI.dishes.create(data);
        }

        if (result.code === 0) {
            showToast(id ? '更新成功' : '创建成功');
            document.getElementById('modal-overlay').classList.remove('active');
            this.loadDishes();
        } else {
            showToast(result.msg || '操作失败', 'error');
        }
    }
}

let dishesPage;
document.addEventListener('DOMContentLoaded', () => {
    dishesPage = new DishesPage();
});