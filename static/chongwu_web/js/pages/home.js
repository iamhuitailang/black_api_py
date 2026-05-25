const HomePage = {
    pets: [],
    loading: true,

    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="paw-bg"></div>
            <div class="page has-header">
                <div class="header">
                    <div class="header-title">
                        <span class="paw-icon">🐾</span>
                        宠物档案
                        <span class="paw-icon">🐾</span>
                    </div>
                </div>

                <div class="quick-stats">
                    <div class="quick-stat">
                        <div class="qs-icon">🐕</div>
                        <div class="qs-label">宠物总数</div>
                        <div class="qs-value" id="stat-total">0</div>
                    </div>
                    <div class="quick-stat">
                        <div class="qs-icon">💉</div>
                        <div class="qs-label">待接种</div>
                        <div class="qs-value" id="stat-vaccine">-</div>
                    </div>
                    <div class="quick-stat">
                        <div class="qs-icon">⏰</div>
                        <div class="qs-label">今日提醒</div>
                        <div class="qs-value" id="stat-reminder">-</div>
                    </div>
                    <div class="quick-stat">
                        <div class="qs-icon">📝</div>
                        <div class="qs-label">日记数</div>
                        <div class="qs-value" id="stat-diary">-</div>
                    </div>
                </div>

                <div class="section-header">
                    <div class="section-title">
                        <span class="section-icon">🐾</span>
                        我的爱宠
                    </div>
                </div>

                <div id="pet-list"></div>

                <div class="fab" id="add-pet-btn">+</div>

                <div class="tabbar">
                    <div class="tabbar-item active" data-page="home">
                        <div class="tab-icon">🏠</div>
                        <div class="tab-label">首页</div>
                    </div>
                    <div class="tabbar-item" data-page="photos">
                        <div class="tab-icon">📷</div>
                        <div class="tab-label">萌照</div>
                    </div>
                    <div class="tabbar-item" data-page="reminders">
                        <div class="tab-icon">⏰</div>
                        <div class="tab-label">提醒</div>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
        this.loadPets();
    },

    bindEvents() {
        document.getElementById('add-pet-btn').addEventListener('click', () => {
            Router.navigate('pet_form');
        });

        document.querySelectorAll('.tabbar-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                if (page === Router.getCurrentRoute()) return;
                Router.navigate(page);
            });
        });
    },

    async loadPets() {
        this.loading = true;
        this.showLoading();

        try {
            const result = await ChongwuApi.getPetList({ page: 1, page_size: 50 });
            if (result.code === 0) {
                this.pets = result.data.items || [];
                this.renderPets();
            } else {
                Toast.error(result.msg || '加载失败');
                this.renderPets();
            }
        } catch (e) {
            console.error(e);
            this.renderPets();
        }

        this.loading = false;
    },

    showLoading() {
        const list = document.getElementById('pet-list');
        list.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <span>加载中...</span>
            </div>
        `;
    },

    renderPets() {
        const list = document.getElementById('pet-list');
        const totalEl = document.getElementById('stat-total');
        if (totalEl) totalEl.textContent = this.pets.length;

        if (this.pets.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🐾</div>
                    <div class="empty-text">还没有添加宠物哦</div>
                    <div class="empty-hint">点击下方按钮添加你的第一个爱宠吧~</div>
                </div>
            `;
            return;
        }

        list.innerHTML = this.pets.map(pet => this.renderPetCard(pet)).join('');

        list.querySelectorAll('.pet-card').forEach(card => {
            card.addEventListener('click', () => {
                const petId = parseInt(card.dataset.petId);
                Storage.setCurrentPetId(petId);
                Router.navigate('pet_detail');
            });
        });

        list.querySelectorAll('.swipe-btn.delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const petId = parseInt(btn.dataset.petId);
                if (confirm('确定要删除这只宠物吗？相关记录也会被删除。')) {
                    const result = await ChongwuApi.deletePet(petId);
                    if (result.code === 0) {
                        Toast.success('删除成功');
                        this.pets = this.pets.filter(p => p.id !== petId);
                        this.renderPets();
                    } else {
                        Toast.error(result.msg || '删除失败');
                    }
                }
            });
        });
    },

    renderPetCard(pet) {
        const tags = (pet.personality_tags || []).slice(0, 3).map(tag =>
            `<span class="pet-tag">${tag}</span>`
        ).join('');

        const speciesIcons = {
            dog: '🐕', cat: '🐱', hamster: '🐹',
            rabbit: '🐰', bird: '🐦', fish: '🐠', other: '🐾'
        };

        const icon = speciesIcons[pet.species] || '🐾';

        return `
            <div class="pet-card" data-pet-id="${pet.id}">
                <div class="pet-card-avatar">
                    ${pet.avatar ? `<img src="${pet.avatar}" alt="${pet.nickname}">` : icon}
                </div>
                <div class="pet-card-info">
                    <div class="pet-card-name">${pet.nickname}</div>
                    <div class="pet-card-meta">
                        <span>${pet.species_text || pet.species}</span>
                        ${pet.breed ? `<span>· ${pet.breed}</span>` : ''}
                        ${pet.gender_text ? `<span>· ${pet.gender_text}</span>` : ''}
                    </div>
                    ${tags ? `<div class="pet-card-tags">${tags}</div>` : ''}
                </div>
                <div class="swipe-actions">
                    <div class="swipe-btn delete" data-pet-id="${pet.id}">🗑️</div>
                </div>
            </div>
        `;
    }
};