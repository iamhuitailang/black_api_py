class DailyMenuPage {
    constructor() {
        this.mealTypes = [];
        this.dishes = [];
        this.currentMenu = [];
        this.init();
    }

    init() {
        document.addEventListener('pageChanged', (e) => {
            if (e.detail === 'daily-menu') {
                this.loadData();
            }
        });

        this.setDefaultDate();
        this.bindEvents();
    }

    setDefaultDate() {
        document.getElementById('menu-date').value = formatDate(new Date());
    }

    async loadData() {
        await this.loadMealTypes();
        await this.loadDishes();
        await this.loadMenu();
    }

    async loadMealTypes() {
        const result = await OrderAdminAPI.dailyMenu.mealTypes();
        if (result.code === 0) {
            this.mealTypes = result.data.items || [];
            this.renderMealTypeSelect();
        }
    }

    async loadDishes() {
        const result = await OrderAdminAPI.dishes.list(null, 1);
        if (result.code === 0) {
            this.dishes = result.data.items || [];
            this.renderDishCheckboxes();
        }
    }

    async loadMenu() {
        const date = document.getElementById('menu-date').value;
        const mealType = document.getElementById('menu-meal-type').value;

        if (!date || !mealType) return;

        const result = await OrderAdminAPI.dailyMenu.get(date, mealType);
        if (result.code === 0) {
            this.currentMenu = result.data.items || [];
            this.checkSelectedDishes();
        }
    }

    renderMealTypeSelect() {
        const select = document.getElementById('menu-meal-type');
        select.innerHTML = '';
        this.mealTypes.forEach(meal => {
            select.innerHTML += `<option value="${meal.meal_type}">${meal.name}</option>`;
        });
    }

    renderDishCheckboxes() {
        const container = document.getElementById('dish-checkboxes');
        container.innerHTML = '';

        this.dishes.forEach(dish => {
            container.innerHTML += `
                <label class="dish-checkbox">
                    <input type="checkbox" value="${dish.id}" data-price="${dish.price}">
                    <span>${dish.name} - ${formatPrice(dish.price)}</span>
                </label>
            `;
        });
    }

    checkSelectedDishes() {
        const checkboxes = document.querySelectorAll('#dish-checkboxes input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = this.currentMenu.some(m => m.dish_id === parseInt(cb.value));
        });
    }

    bindEvents() {
        document.getElementById('load-menu-btn').addEventListener('click', () => {
            this.loadMenu();
        });

        document.getElementById('publish-menu-btn').addEventListener('click', async () => {
            await this.publishMenu();
        });

        document.getElementById('menu-date').addEventListener('change', () => {
            this.loadMenu();
        });

        document.getElementById('menu-meal-type').addEventListener('change', () => {
            this.loadMenu();
        });
    }

    async publishMenu() {
        const date = document.getElementById('menu-date').value;
        const mealType = document.getElementById('menu-meal-type').value;

        if (!date || !mealType) {
            showToast('请选择日期和餐段', 'error');
            return;
        }

        const selectedDishes = [];
        document.querySelectorAll('#dish-checkboxes input:checked').forEach(cb => {
            selectedDishes.push({
                dish_id: parseInt(cb.value),
                price_override: parseFloat(cb.dataset.price),
                max_quantity: 10
            });
        });

        if (selectedDishes.length === 0) {
            showToast('请至少选择一道菜品', 'error');
            return;
        }

        const data = {
            menu_date: date,
            meal_type: mealType,
            dish_list: selectedDishes
        };

        const result = await OrderAdminAPI.dailyMenu.create(data);
        if (result.code === 0) {
            showToast('菜单发布成功');
            this.loadMenu();
        } else {
            showToast(result.msg || '发布失败', 'error');
        }
    }
}

let dailyMenuPage;
document.addEventListener('DOMContentLoaded', () => {
    dailyMenuPage = new DailyMenuPage();
});