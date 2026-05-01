const PricePage = {
    categories: [],

    async render() {
        if (!Auth.checkAuth()) return;

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header no-tabbar">
                <div class="header">
                    <div class="header-back" id="backBtn">←</div>
                    <span class="header-title">回收价格</span>
                </div>

                <div class="section" style="margin-top: 12px;">
                    <div class="price-list" id="priceList">
                        ${this.renderLoading()}
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
        await this.loadCategories();
    },

    renderLoading() {
        return Array(5).fill(0).map(() => `
            <div class="price-item" style="opacity: 0.5;">
                <div class="price-item-icon" style="background: #e5e7eb;"></div>
                <div class="price-item-info">
                    <div style="width: 80px; height: 16px; background: #e5e7eb; border-radius: 4px;"></div>
                    <div style="width: 120px; height: 12px; background: #e5e7eb; border-radius: 4px; margin-top: 6px;"></div>
                </div>
            </div>
        `).join('');
    },

    async loadCategories() {
        try {
            const result = await API.get('/category/tree/get');
            if (result.code === 200) {
                this.categories = result.data || [];
                this.renderPriceList();
            }
        } catch (e) {
            console.error('Load categories error:', e);
            this.renderDefaultList();
        }
    },

    renderPriceList() {
        const listEl = document.getElementById('priceList');
        if (!listEl) return;

        if (this.categories.length === 0) {
            this.renderDefaultList();
            return;
        }

        const icons = ['📦', '🧴', '⚙️', '📱', '👕', '📺', '🪑', '➕'];
        
        listEl.innerHTML = this.categories.map((cat, index) => {
            const subCategories = cat.children || [];
            const price = cat.price ? cat.price.toFixed(2) : '0.00';
            
            return `
                <div class="price-item">
                    <div class="price-item-icon">${icons[index % icons.length]}</div>
                    <div class="price-item-info">
                        <div class="price-item-name">${cat.name}</div>
                        <div class="price-item-desc">
                            ${subCategories.length > 0 ? 
                                subCategories.slice(0, 3).map(s => s.name).join('、') : 
                                '上门回收'}
                        </div>
                    </div>
                    <div class="price-item-price">
                        <div class="price-item-amount">¥${price}</div>
                        <div class="price-item-unit">元/公斤</div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderDefaultList() {
        const listEl = document.getElementById('priceList');
        if (!listEl) return;

        const defaultPrices = [
            { name: '纸类', icon: '📦', price: '1.00', desc: '纸箱、报纸、书本' },
            { name: '塑料', icon: '🧴', price: '2.00', desc: 'PET、PE、泡沫' },
            { name: '金属', icon: '⚙️', price: '3.50', desc: '铁、铜、铝' },
            { name: '电子', icon: '📱', price: '按件', desc: '手机、电脑、家电' },
            { name: '旧衣服', icon: '👕', price: '0.80', desc: '衣服、床单' }
        ];

        listEl.innerHTML = defaultPrices.map(p => `
            <div class="price-item">
                <div class="price-item-icon">${p.icon}</div>
                <div class="price-item-info">
                    <div class="price-item-name">${p.name}</div>
                    <div class="price-item-desc">${p.desc}</div>
                </div>
                <div class="price-item-price">
                    <div class="price-item-amount">${p.price === '按件' ? '面议' : '¥' + p.price}</div>
                    <div class="price-item-unit">${p.price === '按件' ? '' : '元/公斤'}</div>
                </div>
            </div>
        `).join('');
    },

    bindEvents() {
        document.getElementById('backBtn').addEventListener('click', () => {
            Router.navigate('home');
        });
    }
};
