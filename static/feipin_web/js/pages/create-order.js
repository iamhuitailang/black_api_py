const CreateOrderPage = {
    selectedCategory: null,
    selectedWeight: 0,
    selectedSchedule: null,
    photos: [],
    categories: [],

    async render() {
        if (!Auth.checkAuth()) return;

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header no-tabbar" style="padding-bottom: 80px;">
                <div class="header">
                    <div class="header-back" id="backBtn">←</div>
                    <span class="header-title">发布回收</span>
                </div>

                <form id="orderForm">
                    <div class="create-order-section">
                        <div class="create-order-section-title">选择废品种类</div>
                        <div class="create-order-form">
                            <div class="category-picker" id="categoryPicker">
                                ${this.renderCategoryPicker()}
                            </div>
                        </div>
                    </div>

                    <div class="divider"></div>

                    <div class="create-order-section">
                        <div class="create-order-section-title">预估重量</div>
                        <div class="create-order-form">
                            <div class="form-group">
                                <div class="weight-input-row">
                                    <div class="weight-input-wrapper">
                                        <input type="number" class="form-control" id="weight" 
                                            placeholder="请输入预估重量" min="0.5" step="0.5" value="5">
                                    </div>
                                    <span class="weight-unit">公斤</span>
                                </div>
                            </div>
                            <div class="price-estimate" id="priceEstimate">
                                <div class="price-estimate-label">预估回收价格</div>
                                <div class="price-estimate-value">
                                    ¥<span id="estimatedPrice">0.00</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="divider"></div>

                    <div class="create-order-section">
                        <div class="create-order-section-title">上传照片 (可选)</div>
                        <div class="create-order-form">
                            <div class="photo-upload" id="photoUpload">
                                ${this.renderPhotoUpload()}
                            </div>
                            <p style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
                                上传照片可让回收员提前了解物品情况
                            </p>
                        </div>
                    </div>

                    <div class="divider"></div>

                    <div class="create-order-section">
                        <div class="create-order-section-title">回收地址</div>
                        <div class="create-order-form">
                            <div class="form-group">
                                <input type="text" class="form-control" id="address" 
                                    placeholder="请输入详细地址，如：XX小区XX栋XX室">
                            </div>
                            <div class="form-group">
                                <input type="text" class="form-control" id="contactName" 
                                    placeholder="联系人姓名">
                            </div>
                            <div class="form-group">
                                <input type="tel" class="form-control" id="contactPhone" 
                                    placeholder="联系电话" maxlength="11">
                            </div>
                        </div>
                    </div>

                    <div class="divider"></div>

                    <div class="create-order-section">
                        <div class="create-order-section-title">预约时间 (可选)</div>
                        <div class="create-order-form">
                            <div class="schedule-picker" id="schedulePicker">
                                ${this.renderSchedulePicker()}
                            </div>
                        </div>
                    </div>

                    <div style="height: 20px;"></div>
                </form>

                <div style="position: fixed; bottom: 0; left: 0; right: 0; 
                    padding: 12px 16px; padding-bottom: calc(12px + var(--safe-area-bottom));
                    background-color: var(--card-bg); border-top: 1px solid var(--border-color);">
                    <button type="button" class="btn btn-primary btn-block btn-lg" id="submitOrderBtn">
                        确认下单
                    </button>
                </div>
            </div>
        `;

        this.bindEvents();
        await this.loadCategories();
        this.updatePriceEstimate();
    },

    renderCategoryPicker() {
        const defaultCategories = [
            { id: 1, name: '纸类', icon: '📦' },
            { id: 2, name: '塑料', icon: '🧴' },
            { id: 3, name: '金属', icon: '⚙️' },
            { id: 4, name: '电子', icon: '📱' },
            { id: 5, name: '织物', icon: '👕' },
            { id: 6, name: '家电', icon: '📺' }
        ];

        const categories = this.categories.length > 0 ? 
            this.categories.slice(0, 6).map((c, i) => ({
                id: c.id,
                name: c.name,
                icon: ['📦', '🧴', '⚙️', '📱', '👕', '📺'][i % 6]
            })) : defaultCategories;

        this.selectedCategory = categories[0].id;

        return categories.map(cat => `
            <div class="category-picker-item ${cat.id === this.selectedCategory ? 'active' : ''}" 
                data-id="${cat.id}">
                <span class="category-picker-icon">${cat.icon}</span>
                <span class="category-picker-name">${cat.name}</span>
            </div>
        `).join('');
    },

    renderPhotoUpload() {
        let html = this.photos.map((photo, index) => `
            <div class="photo-item">
                <img src="${photo}" alt="照片${index + 1}">
                <div class="photo-delete" data-index="${index}">×</div>
            </div>
        `).join('');

        if (this.photos.length < 9) {
            html += `
                <div class="photo-add" id="addPhotoBtn">
                    <span class="photo-add-icon">+</span>
                    <span class="photo-add-text">添加照片</span>
                </div>
            `;
        }

        return html;
    },

    renderSchedulePicker() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const options = [
            { value: 'today_morning', label: '今天上午' },
            { value: 'today_afternoon', label: '今天下午' },
            { value: 'tomorrow_morning', label: '明天上午' },
            { value: 'tomorrow_afternoon', label: '明天下午' },
            { value: 'custom', label: '其他时间' }
        ];

        return options.map(opt => `
            <div class="schedule-item" data-value="${opt.value}">
                ${opt.label}
            </div>
        `).join('');
    },

    async loadCategories() {
        try {
            const result = await API.get('/category/tree/get');
            if (result.code === 200) {
                this.categories = result.data || [];
                const picker = document.getElementById('categoryPicker');
                if (picker) {
                    picker.innerHTML = this.renderCategoryPicker();
                    this.bindCategoryEvents();
                }
            }
        } catch (e) {
            console.error('Load categories error:', e);
        }
    },

    bindEvents() {
        document.getElementById('backBtn').addEventListener('click', () => {
            Router.navigate('home');
        });

        this.bindCategoryEvents();

        const weightInput = document.getElementById('weight');
        if (weightInput) {
            weightInput.addEventListener('input', () => {
                this.selectedWeight = parseFloat(weightInput.value) || 0;
                this.updatePriceEstimate();
            });
        }

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('photo-delete')) {
                const index = parseInt(e.target.dataset.index);
                this.photos.splice(index, 1);
                document.getElementById('photoUpload').innerHTML = this.renderPhotoUpload();
            }

            if (e.target.classList.contains('schedule-item')) {
                document.querySelectorAll('.schedule-item').forEach(item => {
                    item.classList.remove('active');
                });
                e.target.classList.add('active');
                this.selectedSchedule = e.target.dataset.value;
            }
        });

        document.getElementById('submitOrderBtn').addEventListener('click', () => {
            this.submitOrder();
        });
    },

    bindCategoryEvents() {
        const categoryItems = document.querySelectorAll('.category-picker-item');
        categoryItems.forEach(item => {
            item.addEventListener('click', () => {
                categoryItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.selectedCategory = parseInt(item.dataset.id);
                this.updatePriceEstimate();
            });
        });
    },

    updatePriceEstimate() {
        const category = this.categories.find(c => c.id === this.selectedCategory);
        const pricePerKg = category && category.price ? category.price : 1.0;
        
        this.selectedWeight = parseFloat(document.getElementById('weight')?.value) || 5;
        
        const estimatedPrice = (this.selectedWeight * pricePerKg).toFixed(2);
        
        const priceEl = document.getElementById('estimatedPrice');
        if (priceEl) {
            priceEl.textContent = estimatedPrice;
        }
    },

    async submitOrder() {
        const weight = parseFloat(document.getElementById('weight').value) || 0;
        const address = document.getElementById('address').value.trim();
        const contactName = document.getElementById('contactName').value.trim();
        const contactPhone = document.getElementById('contactPhone').value.trim();

        if (!this.selectedCategory) {
            Toast.error('请选择废品种类');
            return;
        }

        if (weight <= 0) {
            Toast.error('请输入预估重量');
            return;
        }

        if (!address) {
            Toast.error('请输入回收地址');
            return;
        }

        if (!contactName) {
            Toast.error('请输入联系人姓名');
            return;
        }

        if (!contactPhone) {
            Toast.error('请输入联系电话');
            return;
        }

        if (!/^1[3-9]\d{9}$/.test(contactPhone)) {
            Toast.error('请输入正确的手机号');
            return;
        }

        const category = this.categories.find(c => c.id === this.selectedCategory);
        const pricePerKg = category && category.price ? category.price : 1.0;
        const totalPrice = weight * pricePerKg;

        try {
            const result = await API.post('/order/create', {
                category_id: this.selectedCategory,
                weight: weight,
                address: address,
                contact_name: contactName,
                contact_phone: contactPhone,
                photos: JSON.stringify(this.photos)
            });

            if (result.code === 200) {
                Toast.success('下单成功');
                setTimeout(() => {
                    Router.navigate('order');
                }, 1000);
            } else {
                Toast.error(result.msg || '下单失败');
            }
        } catch (e) {
            Toast.error('下单失败，请稍后重试');
        }
    }
};
