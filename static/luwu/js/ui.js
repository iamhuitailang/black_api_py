const UI = {
    currentTab: 'recommend',
    selections: {
        relationship: '',
        gender: 'any',
        age: '',
        budget: '',
        interests: [],
        occasion: ''
    },
    currentRecommendations: [],
    filterPrice: 'all',
    filterCategory: 'all',

    init() {
        this.bindEvents();
        this.renderOptions();
        this.loadSavedSelections();
    },

    bindEvents() {
        Utils.$$('.tab-item').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });

        Utils.$('#recommend-btn')?.addEventListener('click', () => {
            this.doRecommend();
        });

        Utils.$('#refresh-btn')?.addEventListener('click', () => {
            this.refreshRecommendations();
        });

        Utils.$('#back-form-btn')?.addEventListener('click', () => {
            this.showForm();
        });

        Utils.$('#filter-price')?.addEventListener('change', (e) => {
            this.filterPrice = e.target.value;
            this.renderGiftList();
        });

        Utils.$('#filter-category')?.addEventListener('change', (e) => {
            this.filterCategory = e.target.value;
            this.renderGiftList();
        });

        Utils.$('#favorites-btn')?.addEventListener('click', () => {
            this.switchTab('favorites');
        });

        Utils.$('#manage-btn')?.addEventListener('click', () => {
            this.switchTab('library');
        });

        Utils.$('#clear-favorites-btn')?.addEventListener('click', () => {
            this.clearFavorites();
        });

        Utils.$('#add-gift-btn')?.addEventListener('click', () => {
            this.showAddGiftModal();
        });

        Utils.$('#modal-close')?.addEventListener('click', () => {
            this.hideModal('gift-detail-modal');
        });

        Utils.$('#add-modal-close')?.addEventListener('click', () => {
            this.hideModal('add-gift-modal');
        });

        Utils.$('#cancel-add-btn')?.addEventListener('click', () => {
            this.hideModal('add-gift-modal');
        });

        Utils.$('#save-gift-btn')?.addEventListener('click', () => {
            this.saveCustomGift();
        });

        Utils.$$('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('show');
                }
            });
        });
    },

    renderOptions() {
        this.renderRelationshipOptions();
        this.renderGenderOptions();
        this.renderAgeOptions();
        this.renderBudgetOptions();
        this.renderInterestOptions();
        this.renderOccasionOptions();
    },

    renderRelationshipOptions() {
        const container = Utils.$('#relationship-options');
        if (!container) return;

        container.innerHTML = Config.RELATIONSHIPS.map(rel => `
            <div class="option-item" data-value="${rel.value}">
                <span class="option-icon">${rel.icon}</span>
                <span class="option-text">${rel.label}</span>
            </div>
        `).join('');

        Utils.$$('.option-item', container).forEach(item => {
            item.addEventListener('click', () => {
                this.toggleSelection('relationship', item.dataset.value, container);
            });
        });
    },

    renderGenderOptions() {
        const container = Utils.$('#gender-options');
        if (!container) return;

        container.innerHTML = Config.GENDERS.map(g => `
            <div class="option-item ${g.value === this.selections.gender ? 'selected' : ''}" data-value="${g.value}">
                <span class="option-icon">${g.icon}</span>
                <span class="option-text">${g.label}</span>
            </div>
        `).join('');

        Utils.$$('.option-item', container).forEach(item => {
            item.addEventListener('click', () => {
                this.setSelection('gender', item.dataset.value, container);
            });
        });
    },

    renderAgeOptions() {
        const container = Utils.$('#age-options');
        if (!container) return;

        container.innerHTML = Config.AGE_GROUPS.map(age => `
            <div class="option-item" data-value="${age.value}">
                <span class="option-icon">${age.icon}</span>
                <span class="option-text">${age.label}</span>
                <span class="option-sub">${age.sub}</span>
            </div>
        `).join('');

        Utils.$$('.option-item', container).forEach(item => {
            item.addEventListener('click', () => {
                this.toggleSelection('age', item.dataset.value, container);
            });
        });
    },

    renderBudgetOptions() {
        const container = Utils.$('#budget-options');
        if (!container) return;

        container.innerHTML = Config.BUDGETS.map(b => `
            <div class="option-item" data-value="${b.value}">
                <span class="option-icon">${b.icon}</span>
                <span class="option-text">${b.label}</span>
            </div>
        `).join('');

        Utils.$$('.option-item', container).forEach(item => {
            item.addEventListener('click', () => {
                this.toggleSelection('budget', item.dataset.value, container);
            });
        });
    },

    renderInterestOptions() {
        const container = Utils.$('#interest-options');
        if (!container) return;

        container.innerHTML = Config.INTERESTS.map(int => `
            <div class="option-item" data-value="${int.value}">
                <span class="option-icon">${int.icon}</span>
                <span class="option-text">${int.label}</span>
            </div>
        `).join('');

        Utils.$$('.option-item', container).forEach(item => {
            item.addEventListener('click', () => {
                this.toggleMultiSelection('interests', item.dataset.value, item);
            });
        });
    },

    renderOccasionOptions() {
        const container = Utils.$('#occasion-options');
        if (!container) return;

        container.innerHTML = Config.OCCASIONS.map(oc => `
            <div class="option-item" data-value="${oc.value}">
                <span class="option-icon">${oc.icon}</span>
                <span class="option-text">${oc.label}</span>
            </div>
        `).join('');

        Utils.$$('.option-item', container).forEach(item => {
            item.addEventListener('click', () => {
                this.toggleSelection('occasion', item.dataset.value, container);
            });
        });
    },

    toggleSelection(type, value, container) {
        if (this.selections[type] === value) {
            this.selections[type] = '';
            Utils.$$('.option-item', container).forEach(item => {
                item.classList.remove('selected');
            });
        } else {
            this.selections[type] = value;
            Utils.$$('.option-item', container).forEach(item => {
                item.classList.toggle('selected', item.dataset.value === value);
            });
        }
        this.saveSelections();
    },

    setSelection(type, value, container) {
        this.selections[type] = value;
        Utils.$$('.option-item', container).forEach(item => {
            item.classList.toggle('selected', item.dataset.value === value);
        });
        this.saveSelections();
    },

    toggleMultiSelection(type, value, element) {
        const index = this.selections[type].indexOf(value);
        if (index > -1) {
            this.selections[type].splice(index, 1);
            element.classList.remove('selected');
        } else {
            this.selections[type].push(value);
            element.classList.add('selected');
        }
        this.saveSelections();
    },

    saveSelections() {
        localStorage.setItem('luwu_selections', JSON.stringify(this.selections));
    },

    loadSavedSelections() {
        const saved = localStorage.getItem('luwu_selections');
        if (saved) {
            try {
                const selections = JSON.parse(saved);
                this.selections = { ...this.selections, ...selections };
                this.applySelections();
            } catch (e) {
                console.warn('Failed to load saved selections:', e);
            }
        }
    },

    applySelections() {
        const relContainer = Utils.$('#relationship-options');
        if (relContainer && this.selections.relationship) {
            Utils.$$('.option-item', relContainer).forEach(item => {
                item.classList.toggle('selected', item.dataset.value === this.selections.relationship);
            });
        }

        const genderContainer = Utils.$('#gender-options');
        if (genderContainer && this.selections.gender) {
            Utils.$$('.option-item', genderContainer).forEach(item => {
                item.classList.toggle('selected', item.dataset.value === this.selections.gender);
            });
        }

        const ageContainer = Utils.$('#age-options');
        if (ageContainer && this.selections.age) {
            Utils.$$('.option-item', ageContainer).forEach(item => {
                item.classList.toggle('selected', item.dataset.value === this.selections.age);
            });
        }

        const budgetContainer = Utils.$('#budget-options');
        if (budgetContainer && this.selections.budget) {
            Utils.$$('.option-item', budgetContainer).forEach(item => {
                item.classList.toggle('selected', item.dataset.value === this.selections.budget);
            });
        }

        const interestContainer = Utils.$('#interest-options');
        if (interestContainer && this.selections.interests.length > 0) {
            Utils.$$('.option-item', interestContainer).forEach(item => {
                item.classList.toggle('selected', this.selections.interests.includes(item.dataset.value));
            });
        }

        const occasionContainer = Utils.$('#occasion-options');
        if (occasionContainer && this.selections.occasion) {
            Utils.$$('.option-item', occasionContainer).forEach(item => {
                item.classList.toggle('selected', item.dataset.value === this.selections.occasion);
            });
        }
    },

    switchTab(tabName) {
        this.currentTab = tabName;

        Utils.$$('.tab-item').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        Utils.$$('.tab-content').forEach(content => {
            const isActive = content.id === `${tabName}-tab`;
            content.classList.toggle('active', isActive);
        });

        if (tabName === 'favorites') {
            this.renderFavorites();
        } else if (tabName === 'library') {
            this.renderLibrary();
        }
    },

    async doRecommend() {
        const btn = Utils.$('#recommend-btn');
        btn.disabled = true;
        btn.innerHTML = '<span class="btn-icon">⏳</span> 推荐中...';

        await Utils.sleep(500);

        const result = Recommendation.recommend(this.selections);
        this.currentRecommendations = result.gifts;

        Recommendation.saveRecommendationsToStorage(
            this.selections,
            this.currentRecommendations.slice(0, 16).map(g => g.id)
        );

        this.showResults();

        btn.disabled = false;
        btn.innerHTML = '<span class="btn-icon">🎁</span> 开始推荐';
    },

    async refreshRecommendations() {
        const btn = Utils.$('#refresh-btn');
        btn.disabled = true;
        btn.textContent = '加载中...';

        await Utils.sleep(300);

        const result = Recommendation.refresh();
        if (result && result.gifts.length > 0) {
            this.currentRecommendations = result.gifts;
            this.renderGiftList();
        } else {
            this.showToast('已经换完所有礼物啦', 'info');
        }

        btn.disabled = false;
        btn.textContent = '🔄 换一批';
    },

    showResults() {
        Utils.$('.form-section')?.classList.add('hidden');
        Utils.$('#results-section')?.classList.remove('hidden');

        this.updateFilterOptions();
        this.renderGiftList();
    },

    showForm() {
        Utils.$('.form-section')?.classList.remove('hidden');
        Utils.$('#results-section')?.classList.add('hidden');
    },

    updateFilterOptions() {
        const categories = [...new Set(this.currentRecommendations.map(g => g.category))].sort();
        const categorySelect = Utils.$('#filter-category');
        
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="all">全部类型</option>' +
                categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        }
    },

    renderGiftList() {
        const container = Utils.$('#gift-list');
        const emptyState = Utils.$('#empty-results');
        
        if (!container) return;

        const filtered = Recommendation.filterGifts(
            this.currentRecommendations,
            this.filterPrice,
            this.filterCategory
        );

        if (filtered.length === 0) {
            container.innerHTML = '';
            emptyState?.classList.remove('hidden');
            return;
        }

        emptyState?.classList.add('hidden');

        container.innerHTML = filtered.slice(0, 12).map((gift, index) => {
            const isFavorite = Storage.isFavorite(gift.id);
            const icon = Config.CATEGORY_ICONS[gift.category] || '🎁';
            
            return `
                <div class="gift-card" style="animation-delay: ${index * 0.05}s" data-id="${gift.id}">
                    <div class="gift-card-image">
                        ${gift.image ? `<img src="${gift.image}" alt="${gift.name}" loading="lazy">` : icon}
                        <button class="gift-card-favorite ${isFavorite ? 'active' : ''}" data-id="${gift.id}" title="${isFavorite ? '取消收藏' : '收藏'}"></button>
                    </div>
                    <div class="gift-card-content">
                        <div class="gift-card-header">
                            <span class="gift-card-name">${gift.name}</span>
                            <span class="gift-card-category">${gift.category}</span>
                        </div>
                        <span class="gift-card-price">${Utils.formatPrice(gift.price)}</span>
                        ${gift.brand ? `<span style="font-size:11px;color:var(--text-light)">${gift.brand}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        Utils.$$('.gift-card-favorite', container).forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(btn.dataset.id, btn);
            });
        });

        Utils.$$('.gift-card', container).forEach(card => {
            card.addEventListener('click', () => {
                this.showGiftDetail(card.dataset.id);
            });
        });
    },

    renderFavorites() {
        const container = Utils.$('#favorites-list');
        const emptyState = Utils.$('#empty-favorites');
        
        if (!container) return;

        const favoriteIds = Storage.getFavorites();
        const gifts = GiftData.getGiftsByIds(favoriteIds);

        if (gifts.length === 0) {
            container.innerHTML = '';
            emptyState?.classList.remove('hidden');
            return;
        }

        emptyState?.classList.add('hidden');

        container.innerHTML = gifts.map((gift, index) => {
            const icon = Config.CATEGORY_ICONS[gift.category] || '🎁';
            
            return `
                <div class="gift-card" style="animation-delay: ${index * 0.05}s" data-id="${gift.id}">
                    <div class="gift-card-image">
                        ${gift.image ? `<img src="${gift.image}" alt="${gift.name}" loading="lazy">` : icon}
                        <button class="gift-card-favorite active" data-id="${gift.id}" title="取消收藏"></button>
                    </div>
                    <div class="gift-card-content">
                        <div class="gift-card-header">
                            <span class="gift-card-name">${gift.name}</span>
                            <span class="gift-card-category">${gift.category}</span>
                        </div>
                        <span class="gift-card-price">${Utils.formatPrice(gift.price)}</span>
                    </div>
                </div>
            `;
        }).join('');

        Utils.$$('.gift-card-favorite', container).forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(btn.dataset.id, btn);
                setTimeout(() => this.renderFavorites(), 300);
            });
        });

        Utils.$$('.gift-card', container).forEach(card => {
            card.addEventListener('click', () => {
                this.showGiftDetail(card.dataset.id);
            });
        });
    },

    renderLibrary() {
        this.renderLibraryStats();
    },

    renderLibraryStats() {
        const stats = GiftData.getStats();
        const container = Utils.$('.library-stats');
        
        if (!container) return;

        container.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${stats.builtIn}</div>
                <div class="stat-label">内置礼物</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.custom}</div>
                <div class="stat-label">自定义礼物</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.favorites}</div>
                <div class="stat-label">已收藏</div>
            </div>
        `;
    },

    toggleFavorite(giftId, button) {
        const isActive = button.classList.contains('active');
        
        if (isActive) {
            Storage.removeFavorite(giftId);
            button.classList.remove('active');
            this.showToast('已取消收藏', 'info');
        } else {
            Storage.addFavorite(giftId);
            button.classList.add('active');
            button.classList.add('animate-favorite-toggle');
            setTimeout(() => button.classList.remove('animate-favorite-toggle'), 300);
            this.showToast('已添加到收藏', 'success');
        }
    },

    clearFavorites() {
        const favorites = Storage.getFavorites();
        if (favorites.length === 0) {
            this.showToast('暂无收藏可清空', 'info');
            return;
        }

        Storage.setFavorites([]);
        this.renderFavorites();
        this.showToast('已清空收藏', 'success');
    },

    showGiftDetail(giftId) {
        const gift = GiftData.getGiftById(giftId);
        if (!gift) return;

        const isFavorite = Storage.isFavorite(giftId);
        const icon = Config.CATEGORY_ICONS[gift.category] || '🎁';

        const modalBody = Utils.$('#modal-body');
        const modalTitle = Utils.$('#modal-title');
        
        if (modalTitle) modalTitle.textContent = gift.name;
        
        if (modalBody) {
            const relationships = gift.relationships?.map(r => Config.getLabel('relationship', r)).filter(Boolean).join('、') || '通用';
            const genders = gift.genders?.map(g => Config.getLabel('gender', g)).filter(Boolean).join('、') || '不限';
            const ages = gift.ages?.map(a => Config.getLabel('age', a)).filter(Boolean).join('、') || '不限';
            const occasions = gift.occasions?.map(o => Config.getLabel('occasion', o)).filter(Boolean).join('、') || '不限';

            modalBody.innerHTML = `
                <div class="gift-detail">
                    <div class="gift-detail-header">
                        <div class="gift-detail-image">
                            ${gift.image ? `<img src="${gift.image}" alt="${gift.name}">` : icon}
                        </div>
                        <div class="gift-detail-name">${gift.name}</div>
                        <div class="gift-detail-price">${Utils.formatPrice(gift.price)}</div>
                    </div>
                    
                    <div class="gift-detail-info">
                        <div class="gift-detail-row">
                            <span class="gift-detail-label">分类</span>
                            <span class="gift-detail-value">${gift.category}</span>
                        </div>
                        ${gift.brand ? `
                        <div class="gift-detail-row">
                            <span class="gift-detail-label">品牌</span>
                            <span class="gift-detail-value">${gift.brand}</span>
                        </div>
                        ` : ''}
                        <div class="gift-detail-row">
                            <span class="gift-detail-label">适合关系</span>
                            <div class="gift-detail-tags">
                                ${relationships.split('、').map(t => `<span class="gift-detail-tag">${t}</span>`).join('')}
                            </div>
                        </div>
                        <div class="gift-detail-row">
                            <span class="gift-detail-label">适合性别</span>
                            <span class="gift-detail-value">${genders}</span>
                        </div>
                        <div class="gift-detail-row">
                            <span class="gift-detail-label">适合年龄</span>
                            <span class="gift-detail-value">${ages}</span>
                        </div>
                        <div class="gift-detail-row">
                            <span class="gift-detail-label">适用场合</span>
                            <span class="gift-detail-value">${occasions}</span>
                        </div>
                        ${gift.interests && gift.interests.length > 0 ? `
                        <div class="gift-detail-row">
                            <span class="gift-detail-label">兴趣标签</span>
                            <div class="gift-detail-tags">
                                ${gift.interests.map(i => `<span class="gift-detail-tag">${Config.getLabel('interest', i) || i}</span>`).join('')}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    
                    ${gift.description ? `
                    <div class="gift-detail-description">
                        <h4>💡 购买建议</h4>
                        <p>${gift.description}</p>
                    </div>
                    ` : ''}
                    
                    <div class="gift-detail-actions">
                        <button class="btn ${isFavorite ? 'btn-secondary' : 'btn-primary'}" id="detail-favorite-btn">
                            ${isFavorite ? '❤️ 已收藏' : '🤍 收藏'}
                        </button>
                        ${gift.isCustom ? `
                        <button class="btn btn-outline" id="detail-edit-btn">✏️ 编辑</button>
                        <button class="btn btn-secondary" id="detail-delete-btn">🗑️ 删除</button>
                        ` : ''}
                    </div>
                </div>
            `;

            Utils.$('#detail-favorite-btn')?.addEventListener('click', () => {
                const btn = Utils.$('#detail-favorite-btn');
                const isActive = btn.textContent.includes('已收藏');
                
                if (isActive) {
                    Storage.removeFavorite(giftId);
                    btn.textContent = '🤍 收藏';
                    btn.classList.remove('btn-secondary');
                    btn.classList.add('btn-primary');
                    this.showToast('已取消收藏', 'info');
                } else {
                    Storage.addFavorite(giftId);
                    btn.textContent = '❤️ 已收藏';
                    btn.classList.remove('btn-primary');
                    btn.classList.add('btn-secondary');
                    this.showToast('已添加到收藏', 'success');
                }
            });

            if (gift.isCustom) {
                Utils.$('#detail-edit-btn')?.addEventListener('click', () => {
                    this.hideModal('gift-detail-modal');
                    this.showEditGiftModal(gift);
                });

                Utils.$('#detail-delete-btn')?.addEventListener('click', () => {
                    if (confirm('确定要删除这个礼物吗？')) {
                        Storage.deleteCustomGift(giftId);
                        this.hideModal('gift-detail-modal');
                        this.showToast('已删除礼物', 'success');
                        if (this.currentTab === 'library') {
                            this.renderLibrary();
                        }
                    }
                });
            }
        }

        this.showModal('gift-detail-modal');
    },

    showAddGiftModal() {
        this.resetGiftForm();
        this.renderCheckboxGroups();
        this.showModal('add-gift-modal');
    },

    showEditGiftModal(gift) {
        this.resetGiftForm();
        this.fillGiftForm(gift);
        this.renderCheckboxGroups();
        Utils.$('#gift-form').dataset.editId = gift.id;
        this.showModal('add-gift-modal');
    },

    resetGiftForm() {
        Utils.$('#gift-form').reset();
        Utils.$('#gift-form').dataset.editId = '';
    },

    fillGiftForm(gift) {
        Utils.$('#gift-name').value = gift.name || '';
        Utils.$('#gift-category').value = gift.category || '其他';
        Utils.$('#gift-price').value = gift.price || '';
        Utils.$('#gift-brand').value = gift.brand || '';
        Utils.$('#gift-image').value = gift.image || '';
        Utils.$('#gift-description').value = gift.description || '';
        
        this.editingGift = gift;
    },

    renderCheckboxGroups() {
        const relationships = Utils.$('#gift-relationship');
        if (relationships) {
            relationships.innerHTML = Config.RELATIONSHIPS.map(r => `
                <label class="checkbox-item ${this.editingGift?.relationships?.includes(r.value) ? 'checked' : ''}">
                    <input type="checkbox" value="${r.value}" ${this.editingGift?.relationships?.includes(r.value) ? 'checked' : ''}>
                    ${r.label}
                </label>
            `).join('');
        }

        const genders = Utils.$('#gift-gender');
        if (genders) {
            genders.innerHTML = Config.GENDERS.map(g => `
                <label class="checkbox-item ${this.editingGift?.genders?.includes(g.value) ? 'checked' : ''}">
                    <input type="checkbox" value="${g.value}" ${this.editingGift?.genders?.includes(g.value) ? 'checked' : ''}>
                    ${g.label}
                </label>
            `).join('');
        }

        const ages = Utils.$('#gift-age');
        if (ages) {
            ages.innerHTML = Config.AGE_GROUPS.map(a => `
                <label class="checkbox-item ${this.editingGift?.ages?.includes(a.value) ? 'checked' : ''}">
                    <input type="checkbox" value="${a.value}" ${this.editingGift?.ages?.includes(a.value) ? 'checked' : ''}>
                    ${a.label}
                </label>
            `).join('');
        }

        const interests = Utils.$('#gift-interest');
        if (interests) {
            interests.innerHTML = Config.INTERESTS.map(i => `
                <label class="checkbox-item ${this.editingGift?.interests?.includes(i.value) ? 'checked' : ''}">
                    <input type="checkbox" value="${i.value}" ${this.editingGift?.interests?.includes(i.value) ? 'checked' : ''}>
                    ${i.label}
                </label>
            `).join('');
        }

        const occasions = Utils.$('#gift-occasion');
        if (occasions) {
            occasions.innerHTML = Config.OCCASIONS.map(o => `
                <label class="checkbox-item ${this.editingGift?.occasions?.includes(o.value) ? 'checked' : ''}">
                    <input type="checkbox" value="${o.value}" ${this.editingGift?.occasions?.includes(o.value) ? 'checked' : ''}>
                    ${o.label}
                </label>
            `).join('');
        }

        Utils.$$('.checkbox-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const checkbox = item.querySelector('input[type="checkbox"]');
                if (e.target !== checkbox) {
                    checkbox.checked = !checkbox.checked;
                }
                item.classList.toggle('checked', checkbox.checked);
            });
        });
    },

    saveCustomGift() {
        const form = Utils.$('#gift-form');
        const editId = form.dataset.editId;

        const name = Utils.$('#gift-name').value.trim();
        const price = parseFloat(Utils.$('#gift-price').value);
        const category = Utils.$('#gift-category').value;
        const brand = Utils.$('#gift-brand').value.trim();
        const image = Utils.$('#gift-image').value.trim();
        const description = Utils.$('#gift-description').value.trim();

        if (!name) {
            this.showToast('请输入礼物名称', 'error');
            return;
        }
        if (isNaN(price) || price <= 0) {
            this.showToast('请输入有效的价格', 'error');
            return;
        }

        const relationships = Utils.$$('#gift-relationship input:checked').map(i => i.value);
        const genders = Utils.$$('#gift-gender input:checked').map(i => i.value);
        const ages = Utils.$$('#gift-age input:checked').map(i => i.value);
        const interests = Utils.$$('#gift-interest input:checked').map(i => i.value);
        const occasions = Utils.$$('#gift-occasion input:checked').map(i => i.value);

        const gift = {
            name,
            price,
            category,
            brand,
            image,
            description,
            relationships,
            genders,
            ages,
            interests,
            occasions
        };

        if (editId) {
            Storage.updateCustomGift(editId, gift);
            this.showToast('已更新礼物', 'success');
        } else {
            Storage.addCustomGift(gift);
            this.showToast('已添加礼物', 'success');
        }

        this.editingGift = null;
        this.hideModal('add-gift-modal');
        
        if (this.currentTab === 'library') {
            this.renderLibrary();
        }
    },

    showModal(modalId) {
        Utils.$(`#${modalId}`)?.classList.add('show');
        document.body.style.overflow = 'hidden';
    },

    hideModal(modalId) {
        Utils.$(`#${modalId}`)?.classList.remove('show');
        document.body.style.overflow = '';
    },

    showToast(message, type = 'info') {
        const container = Utils.$('#toast-container');
        if (!container) return;

        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };

        const toast = Utils.createElement('div', {
            className: `toast ${type}`
        }, [
            Utils.createElement('span', { className: 'toast-icon' }, [icons[type] || icons.info]),
            Utils.createElement('span', { className: 'toast-message' }, [message])
        ]);

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

window.UI = UI;
