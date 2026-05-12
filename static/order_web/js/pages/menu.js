class MenuPage {
    constructor() {
        this.mealTypes = [];
        this.menuItems = [];
        this.cart = {};
        this.init();
    }

    init() {
        document.addEventListener('pageChanged', (e) => {
            if (e.detail === 'menu') {
                this.loadData();
            }
        });

        this.bindEvents();
        this.updateDateDisplay();
        
        setTimeout(() => {
            this.loadData();
        }, 200);
    }

    async loadData() {
        await this.loadMealTypes();
        await this.loadMenu();
    }

    async loadMealTypes() {
        const result = await OrderWebAPI.dailyMenu.mealTypes();
        if (result.code === 0) {
            this.mealTypes = result.data.items || [];
            this.renderMealTypeSelect();
        }
    }

    async loadMenu() {
        const date = formatDate(app.selectedDate);
        const mealTypeEl = document.getElementById('meal-type');
        const mealType = mealTypeEl ? mealTypeEl.value : 'lunch';

        try {
            const result = await OrderWebAPI.dailyMenu.get(date, mealType);
            if (result.code === 0) {
                this.menuItems = result.data.items || [];
                this.renderMenu();
            } else {
                this.menuItems = [];
                this.renderMenu();
            }
        } catch (e) {
            console.error('Load menu failed:', e);
            this.menuItems = [];
            this.renderMenu();
        }
    }

    renderMealTypeSelect() {
        const select = document.getElementById('meal-type');
        select.innerHTML = '';
        this.mealTypes.forEach(meal => {
            select.innerHTML += `<option value="${meal.meal_type}">${meal.name}</option>`;
        });
    }

    renderMenu() {
        const container = document.getElementById('menu-list');

        if (this.menuItems.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📭</div>
                    <p>该时段暂无菜品</p>
                </div>
            `;
            this.updateCartBar();
            return;
        }

        container.innerHTML = '';
        this.menuItems.forEach(item => {
            const quantity = this.cart[item.dish_id] || 0;
            container.innerHTML += `
                <div class="dish-card">
                    <div class="dish-image">${item.icon || '🍽️'}</div>
                    <div class="dish-info">
                        <div class="dish-name">${item.name}</div>
                        <div class="dish-desc">${item.description || ''}</div>
                        <div class="dish-bottom">
                            <span class="dish-price">${formatPrice(item.price_override || item.price)}</span>
                            <div class="quantity-control" data-dish-id="${item.dish_id}">
                                ${quantity > 0 ? `
                                    <button class="quantity-btn minus" onclick="menuPage.updateQuantity(${item.dish_id}, -1)">-</button>
                                    <span class="quantity-value">${quantity}</span>
                                ` : ''}
                                <button class="quantity-btn plus" onclick="menuPage.updateQuantity(${item.dish_id}, 1)">+</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        this.updateCartBar();
    }

    updateQuantity(dishId, delta) {
        const current = this.cart[dishId] || 0;
        const newVal = Math.max(0, current + delta);
        if (newVal > 0) {
            this.cart[dishId] = newVal;
        } else {
            delete this.cart[dishId];
        }
        this.renderMenu();
    }

    updateCartBar() {
        const cartBar = document.getElementById('cart-bar');
        const totalItems = Object.values(this.cart).reduce((a, b) => a + b, 0);
        const totalAmount = Object.entries(this.cart).reduce((total, [dishId, quantity]) => {
            const item = this.menuItems.find(i => i.dish_id === parseInt(dishId));
            if (item) {
                return total + (item.price_override || item.price) * quantity;
            }
            return total;
        }, 0);

        if (totalItems > 0) {
            cartBar.style.display = 'flex';
            document.querySelector('.cart-count').textContent = totalItems;
            document.querySelector('.cart-amount').textContent = formatPrice(totalAmount);
        } else {
            cartBar.style.display = 'none';
        }
    }

    updateDateDisplay() {
        document.getElementById('selected-date').textContent = formatDateDisplay(app.selectedDate);
    }

    bindEvents() {
        document.getElementById('prev-day').addEventListener('click', () => {
            app.selectedDate.setDate(app.selectedDate.getDate() - 1);
            this.updateDateDisplay();
            this.loadMenu();
        });

        document.getElementById('next-day').addEventListener('click', () => {
            app.selectedDate.setDate(app.selectedDate.getDate() + 1);
            this.updateDateDisplay();
            this.loadMenu();
        });

        document.getElementById('meal-type').addEventListener('change', () => {
            this.loadMenu();
        });

        document.getElementById('checkout-btn').addEventListener('click', () => {
            this.showCheckout();
        });

        document.getElementById('submit-order-btn').addEventListener('click', async () => {
            await this.submitOrder();
        });
    }

    showCheckout() {
        const itemsContainer = document.getElementById('checkout-items');
        let totalAmount = 0;
        itemsContainer.innerHTML = '';

        Object.entries(this.cart).forEach(([dishId, quantity]) => {
            const item = this.menuItems.find(i => i.dish_id === parseInt(dishId));
            if (item) {
                const price = item.price_override || item.price;
                const amount = price * quantity;
                totalAmount += amount;

                itemsContainer.innerHTML += `
                    <div class="checkout-item">
                        <span>${item.name} x ${quantity}</span>
                        <span>${formatPrice(amount)}</span>
                    </div>
                `;
            }
        });

        document.getElementById('checkout-amount').textContent = formatPrice(totalAmount);
        document.getElementById('checkout-modal').classList.add('active');
    }

    async submitOrder() {
        const date = formatDate(app.selectedDate);
        const mealType = document.getElementById('meal-type').value;

        const items = Object.entries(this.cart).map(([dishId, quantity]) => ({
            dish_id: parseInt(dishId),
            quantity: quantity
        }));

        const result = await OrderWebAPI.orders.create({
            user_id: app.currentUser.id,
            menu_date: date,
            meal_type: mealType,
            items: items,
            remark: ''
        });

        if (result.code === 0) {
            showToast('下单成功');
            this.cart = {};
            document.getElementById('checkout-modal').classList.remove('active');

            const qrcode = result.data.order.qrcode;
            this.showQrcode(qrcode);

            this.loadMenu();
            app.navigateTo('orders');
        } else {
            showToast(result.msg || '下单失败', 'error');
        }
    }

    showQrcode(qrcode) {
        document.getElementById('qrcode-text').textContent = qrcode;

        const canvas = document.getElementById('qrcode-canvas');
        canvas.innerHTML = '';

        const size = 200;
        const cellSize = size / 8;
        const colors = ['#667eea', '#764ba2'];

        let html = '<div style="display:grid;grid-template-columns:repeat(8,1fr);gap:1px;width:' + size + 'px;height:' + size + 'px;background:#fff;padding:8px;border-radius:8px;">';

        for (let i = 0; i < 64; i++) {
            const hash = qrcode.charCodeAt(i % qrcode.length) + i;
            const color = colors[hash % 2];
            html += '<div style="background:' + color + ';"></div>';
        }
        html += '</div>';

        canvas.innerHTML = html;
        document.getElementById('qrcode-modal').classList.add('active');
    }
}

let menuPage;
document.addEventListener('DOMContentLoaded', () => {
    menuPage = new MenuPage();
});