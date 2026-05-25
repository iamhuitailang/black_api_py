const PetDetailPage = {
    petId: null,
    profileData: null,

    render() {
        this.petId = Storage.getCurrentPetId();
        if (!this.petId) {
            Router.navigate('home');
            return;
        }

        this.loadProfile();
    },

    async loadProfile() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="paw-bg"></div>
            <div class="page has-header no-tabbar">
                <div class="header">
                    <div class="header-back" id="back-btn">←</div>
                    <div class="header-title">宠物档案</div>
                    <div class="header-action" id="edit-btn">✏️</div>
                </div>
                <div class="loading"><div class="spinner"></div><span>加载中...</span></div>
            </div>
        `;

        document.getElementById('back-btn').addEventListener('click', () => Router.back());
        document.getElementById('edit-btn').addEventListener('click', () => {
            Router.navigate('pet_form', { petId: this.petId });
        });

        try {
            const result = await ChongwuApi.getPetProfile(this.petId);
            if (result.code === 0) {
                this.profileData = result.data;
                this.renderProfile();
            } else {
                Toast.error(result.msg || '加载失败');
            }
        } catch (e) {
            console.error(e);
            Toast.error('加载失败');
        }
    },

    renderProfile() {
        const data = this.profileData;
        const pet = data.pet;

        const app = document.getElementById('app');
        const speciesClass = pet.species || 'other';
        const avatarContent = pet.avatar
            ? `<img src="${pet.avatar}" alt="${pet.nickname}">`
            : this.getVirtualPetHtml(speciesClass);

        app.innerHTML = `
            <div class="paw-bg"></div>
            <div class="page has-header no-tabbar">
                <div class="header">
                    <div class="header-back" id="back-btn">←</div>
                    <div class="header-title">
                        <span class="paw-icon">🐾</span>
                        ${pet.nickname}的档案
                        <span class="paw-icon">🐾</span>
                    </div>
                    <div class="header-action" id="edit-btn">✏️</div>
                </div>

                <div class="card" style="text-align:center">
                    <div class="pet-avatar">
                        ${avatarContent}
                    </div>
                    <div style="font-size:20px; font-weight:600; margin-bottom:4px">${pet.nickname}</div>
                    <div style="color:var(--text-secondary); font-size:14px; margin-bottom:12px">
                        ${pet.species_text || pet.species}
                        ${pet.breed ? ` · ${pet.breed}` : ''}
                        ${pet.gender_text ? ` · ${pet.gender_text}` : ''}
                    </div>
                    ${(pet.personality_tags && pet.personality_tags.length > 0) ? `
                        <div style="display:flex; gap:6px; justify-content:center; flex-wrap:wrap">
                            ${pet.personality_tags.map(tag => `<span class="pet-tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div style="margin-top:12px; font-size:13px; color:var(--text-secondary)">
                        ${pet.birthday ? `🎂 ${pet.birthday}` : ''}
                        ${pet.estimated_age ? ` · ${pet.estimated_age}` : ''}
                        ${pet.weight ? ` · ⚖️ ${pet.weight}${pet.weight_unit}` : ''}
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-card" onclick="PetDetailPage.goTo('diary')">
                        <div class="stat-value">${data.diaries ? data.diaries.length : 0}</div>
                        <div class="stat-label">📝 成长日记</div>
                    </div>
                    <div class="stat-card blue" onclick="PetDetailPage.goTo('vaccine')">
                        <div class="stat-value">${data.vaccines ? data.vaccines.length : 0}</div>
                        <div class="stat-label">💉 疫苗记录</div>
                    </div>
                    <div class="stat-card green" onclick="PetDetailPage.goTo('medical')">
                        <div class="stat-value">${data.medical ? data.medical.length : 0}</div>
                        <div class="stat-label">🏥 就医记录</div>
                    </div>
                    <div class="stat-card orange" onclick="PetDetailPage.goTo('weight')">
                        <div class="stat-value">${data.weights ? data.weights.length : 0}</div>
                        <div class="stat-label">⚖️ 体重记录</div>
                    </div>
                </div>

                ${data.weight_chart && data.weight_chart.length > 0 ? `
                    <div class="weight-chart-container">
                        <div class="card-title"><span class="title-icon">📈</span>体重趋势</div>
                        <canvas id="weight-chart"></canvas>
                    </div>
                ` : ''}

                <div class="section-header">
                    <div class="section-title"><span class="section-icon">💊</span>健康档案</div>
                    <div class="section-action" onclick="PetDetailPage.goTo('health')">管理</div>
                </div>
                <div class="card" id="health-section">
                    ${this.renderHealthSection(data.health)}
                </div>

                <div class="section-header">
                    <div class="section-title"><span class="section-icon">📝</span>最近日记</div>
                    <div class="section-action" onclick="PetDetailPage.goTo('diary')">全部</div>
                </div>
                <div id="diary-list">
                    ${this.renderRecentDiaries(data.diaries)}
                </div>

                <div class="section-header">
                    <div class="section-title"><span class="section-icon">⏰</span>提醒事项</div>
                    <div class="section-action" onclick="PetDetailPage.goTo('reminder')">管理</div>
                </div>
                <div id="reminder-list">
                    ${this.renderRecentReminders(data.reminders)}
                </div>

                <div class="section-header">
                    <div class="section-title"><span class="section-icon">📷</span>宠物萌照</div>
                    <div class="section-action" onclick="PetDetailPage.goTo('photo')">全部</div>
                </div>
                <div class="photo-grid">
                    ${this.renderRecentPhotos(data.photos)}
                </div>

                <div style="padding: 16px; display: flex; gap: 12px;">
                    <button class="btn btn-primary btn-block" id="share-btn" onclick="PetDetailPage.shareProfile()">
                        📤 分享档案
                    </button>
                </div>
            </div>
        `;

        document.getElementById('back-btn').addEventListener('click', () => Router.back());
        document.getElementById('edit-btn').addEventListener('click', () => {
            Router.navigate('pet_form', { petId: this.petId });
        });

        if (data.weight_chart && data.weight_chart.length > 0) {
            setTimeout(() => {
                const canvas = document.getElementById('weight-chart');
                if (canvas) {
                    ChartUtil.drawLineChart(canvas, data.weight_chart, {
                        lineColor: '#FF8FA3',
                        fillColor: 'rgba(255, 143, 163, 0.15)',
                        pointColor: '#FF8FA3',
                        unit: data.weight_chart[0]?.unit || 'kg'
                    });
                }
            }, 100);
        }
    },

    getVirtualPetHtml(species) {
        return `
            <div class="virtual-pet ${species}">
                <div class="pet-face">
                    <div class="pet-ears">
                        <div class="pet-ear left"></div>
                        <div class="pet-ear right"></div>
                    </div>
                    <div class="pet-head">
                        <div class="pet-eyes">
                            <div class="pet-eye"></div>
                            <div class="pet-eye"></div>
                        </div>
                        <div class="pet-nose"></div>
                        <div class="pet-mouth"></div>
                    </div>
                </div>
            </div>
        `;
    },

    renderHealthSection(health) {
        if (!health) {
            return `
                <div style="text-align:center; color:var(--text-light); padding: 20px;">
                    暂无健康档案
                    <div style="margin-top:8px;">
                        <button class="btn btn-secondary" onclick="PetDetailPage.goTo('health')">添加健康记录</button>
                    </div>
                </div>
            `;
        }

        return `
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                ${health.vaccines && health.vaccines.length > 0 ? `
                    <div style="flex: 1; min-width: 120px;">
                        <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 4px;">💉 疫苗接种</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                            ${health.vaccines.map(v => `<span class="pet-tag">${v}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                ${health.deworming && health.deworming.length > 0 ? `
                    <div style="flex: 1; min-width: 120px;">
                        <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 4px;">🪱 驱虫记录</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                            ${health.deworming.map(d => `<span class="pet-tag blue">${d}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
            ${health.other_issues ? `
                <div style="margin-top: 12px; padding: 12px; background: var(--primary-beige); border-radius: var(--radius-sm); font-size: 13px;">
                    <strong>其他健康问题：</strong>${health.other_issues}
                </div>
            ` : ''}
        `;
    },

    renderRecentDiaries(diaries) {
        if (!diaries || diaries.length === 0) {
            return `
                <div class="empty-state" style="padding: 20px;">
                    <div class="empty-icon" style="font-size:32px">📝</div>
                    <div class="empty-text">还没有日记</div>
                    <div style="margin-top:8px;">
                        <button class="btn btn-secondary" onclick="PetDetailPage.goTo('diary')">写第一篇日记</button>
                    </div>
                </div>
            `;
        }

        return diaries.slice(0, 3).map(d => `
            <div class="list-item" onclick="PetDetailPage.goTo('diary')">
                <div class="list-item-icon">📝</div>
                <div class="list-item-content">
                    <div class="list-item-title">${d.diary_date}</div>
                    <div class="list-item-desc" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap">${d.content || '（无内容）'}</div>
                </div>
                <div class="list-item-arrow">›</div>
            </div>
        `).join('');
    },

    renderRecentReminders(reminders) {
        if (!reminders || reminders.length === 0) {
            return `
                <div class="empty-state" style="padding: 20px;">
                    <div class="empty-icon" style="font-size:32px">⏰</div>
                    <div class="empty-text">暂无提醒</div>
                    <div style="margin-top:8px;">
                        <button class="btn btn-secondary" onclick="PetDetailPage.goTo('reminder')">添加提醒</button>
                    </div>
                </div>
            `;
        }

        return reminders.slice(0, 3).map(r => `
            <div class="list-item" onclick="PetDetailPage.goTo('reminder')">
                <div class="list-item-icon">⏰</div>
                <div class="list-item-content">
                    <div class="list-item-title">${r.title}</div>
                    <div class="list-item-desc">${r.reminder_time} · ${r.repeat_text}</div>
                </div>
                <div class="list-item-arrow">›</div>
            </div>
        `).join('');
    },

    renderRecentPhotos(photos) {
        if (!photos || photos.length === 0) {
            return `
                <div style="grid-column: span 3; text-align: center; color: var(--text-light); padding: 20px;">
                    📷 还没有照片
                    <div style="margin-top:8px;">
                        <button class="btn btn-secondary" onclick="PetDetailPage.goTo('photo')">上传照片</button>
                    </div>
                </div>
            `;
        }

        return photos.slice(0, 9).map(p => `
            <div class="photo-item" onclick="PetDetailPage.viewPhoto('${p.photo_url}', '${p.description || ''}')">
                <img src="${p.photo_url}" alt="photo">
            </div>
        `).join('');
    },

    goTo(page) {
        Storage.setCurrentPetId(this.petId);
        const pageMap = {
            health: 'health',
            diary: 'diary',
            reminder: 'reminder',
            photo: 'photo',
            medical: 'medical',
            vaccine: 'vaccine',
            weight: 'weight'
        };
        Router.navigate(pageMap[page] || page);
    },

    viewPhoto(url, desc) {
        const modal = document.createElement('div');
        modal.className = 'modal-mask';
        modal.innerHTML = `
            <div class="modal-content" style="text-align:center">
                <div class="modal-header">
                    <div class="modal-title">照片预览</div>
                    <div class="modal-close" onclick="this.closest('.modal-mask').remove()">×</div>
                </div>
                <img src="${url}" style="max-width:100%; border-radius:var(--radius-md); margin-bottom:12px">
                ${desc ? `<p style="color:var(--text-secondary)">${desc}</p>` : ''}
            </div>
        `;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        document.body.appendChild(modal);
    },

    shareProfile() {
        const data = this.profileData;
        const pet = data.pet;
        const photos = data.photos || [];
        const recentPhotos = photos.slice(0, 3);

        const modal = document.createElement('div');
        modal.className = 'modal-mask';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">📤 分享 ${pet.nickname}</div>
                    <div class="modal-close" onclick="this.closest('.modal-mask').remove()">×</div>
                </div>
                <div class="share-card">
                    ${recentPhotos.length > 0 ? `
                        <div style="margin-bottom:16px; border-radius:var(--radius-md); overflow:hidden;">
                            <img src="${recentPhotos[0].photo_url}" style="width:100%; max-height:200px; object-fit:cover; display:block;">
                            ${recentPhotos.length > 1 ? `
                                <div style="display:flex; gap:4px; margin-top:4px;">
                                    ${recentPhotos.slice(1).map(p => `<img src="${p.photo_url}" style="width:50%; height:60px; object-fit:cover; border-radius:4px; cursor:pointer;" onclick="PetDetailPage.viewPhoto('${p.photo_url}', '${p.description || ''}')">`).join('')}
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                    <div class="share-card-header">
                        <div class="share-title">${pet.nickname}的档案</div>
                        <div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">
                            ${pet.species_text || pet.species}${pet.breed ? ' · ' + pet.breed : ''}${pet.gender_text ? ' · ' + pet.gender_text : ''}
                        </div>
                    </div>
                    <div class="share-card-body">
                        ${pet.birthday ? `🎂 ${pet.birthday}  ` : ''}${pet.weight ? `⚖️ ${pet.weight}${pet.weight_unit}` : ''}
                        ${pet.personality_tags && pet.personality_tags.length > 0 ? `<br>${pet.personality_tags.map(t => `<span class="pet-tag">${t}</span>`).join(' ')}` : ''}
                        <br><br>
                        💉 疫苗 ${data.vaccines ? data.vaccines.length : 0} 条 · 🏥 就医 ${data.medical ? data.medical.length : 0} 条 · 📝 日记 ${data.diaries ? data.diaries.length : 0} 篇
                    </div>
                    <div class="share-card-footer">🐾 来自我的宠物档案</div>
                </div>
                <div style="display:flex; gap:12px; margin-top:16px;">
                    ${recentPhotos.length > 0 ? `<button class="btn btn-primary btn-block" onclick="PetDetailPage.shareLatestPhoto()">📷 分享萌照</button>` : ''}
                    <button class="btn btn-secondary btn-block" onclick="PetDetailPage.copyShareText()">📋 复制文本</button>
                    <button class="btn btn-secondary btn-block" onclick="PetDetailPage.closeShareModal()">关闭</button>
                </div>
            </div>
        `;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        document.body.appendChild(modal);
        this._shareModal = modal;
    },

    copyShareText() {
        const data = this.profileData;
        const pet = data.pet;
        const text = `🐾 ${pet.nickname}的档案\n${pet.species_text || pet.species}${pet.breed ? ' · ' + pet.breed : ''}\n${pet.gender_text || ''}${pet.birthday ? ' · ' + pet.birthday : ''}${pet.weight ? ' · ' + pet.weight + pet.weight_unit : ''}\n💉 疫苗: ${data.vaccines ? data.vaccines.length : 0} 条\n🏥 就医: ${data.medical ? data.medical.length : 0} 条\n📝 日记: ${data.diaries ? data.diaries.length : 0} 篇\n🐾 来自宠物档案`;

        navigator.clipboard.writeText(text).then(() => {
            Toast.success('已复制到剪贴板');
        }).catch(() => {
            Toast.error('复制失败');
        });
    },

    closeShareModal() {
        if (this._shareModal) {
            this._shareModal.remove();
            this._shareModal = null;
        }
    },

    shareLatestPhoto() {
        const photos = this.profileData?.photos || [];
        if (photos.length === 0) {
            Toast.error('还没有萌照可以分享');
            return;
        }
        const photo = photos[0];
        PhotoPage.sharePhoto(photo.photo_url, photo.description || '');
    }
};