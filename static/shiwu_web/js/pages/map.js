const MapPage = {
    posts: [],
    currentType: 'all',

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                ${Header.render('地图标记', false)}
                <main class="container">
                    <div class="map-container">
                        <div class="map-placeholder">
                            <div class="icon">🗺️</div>
                            <h3 style="font-size: 18px; font-weight: 600; color: var(--primary-blue);">校园失物地图</h3>
                            <p style="font-size: 13px; color: var(--text-secondary); text-align: center; max-width: 300px;">
                                地图功能需要接入地图服务<br>
                                以下是物品丢失/拾到地点列表
                            </p>
                        </div>
                    </div>

                    <div class="tabs">
                        <div class="tab-item active" data-type="all">全部地点</div>
                        <div class="tab-item" data-type="lost">🔍 寻物地点</div>
                        <div class="tab-item" data-type="found">🫴 招领地点</div>
                    </div>

                    <div class="markers-list" id="markersList">
                        <div class="loading">
                            <div class="loading-spinner"></div>
                        </div>
                    </div>
                </main>

                ${Tabbar.render('map')}
            </div>
        `;

        this.bindEvents();
        await this.loadMarkers();
    },

    bindEvents() {
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentType = tab.dataset.type;
                this.loadMarkers();
            });
        });
    },

    async loadMarkers() {
        const list = document.getElementById('markersList');
        try {
            const params = { page_size: 50 };
            if (this.currentType && this.currentType !== 'all') {
                params.post_type = this.currentType;
            }

            const result = await ApiService.get('/shiwu/post/list/get', params);
            if (result.code === 0) {
                this.posts = result.data.items || [];
                this.renderMarkers();
            } else {
                Toast.error(result.msg || '加载失败');
            }
        } catch (error) {
            console.error('加载地图标记失败:', error);
            list.innerHTML = `
                <div class="empty">
                    <div class="empty-icon">❌</div>
                    <div class="empty-text">加载失败，点击重试</div>
                </div>
            `;
            list.querySelector('.empty').onclick = () => this.loadMarkers();
        }
    },

    renderMarkers() {
        const list = document.getElementById('markersList');
        
        if (this.posts.length === 0) {
            list.innerHTML = `
                <div class="empty">
                    <div class="empty-icon">📍</div>
                    <div class="empty-text">暂无地点标记</div>
                </div>
            `;
            return;
        }

        const locationGroups = {};
        this.posts.forEach(post => {
            const location = post.lost_location || '未知地点';
            if (!locationGroups[location]) {
                locationGroups[location] = [];
            }
            locationGroups[location].push(post);
        });

        list.innerHTML = Object.entries(locationGroups).map(([location, posts]) => {
            const lostCount = posts.filter(p => p.post_type === 'lost').length;
            const foundCount = posts.filter(p => p.post_type === 'found').length;
            
            return `
                <div class="marker-item" onclick="MapPage.showLocationPosts('${location.replace(/'/g, "\\'")}')">
                    <div class="marker-dot ${posts[0].post_type}"></div>
                    <div style="flex: 1;">
                        <div style="font-size: 14px; font-weight: 500; color: var(--text-primary); margin-bottom: 4px;">
                            📍 ${location}
                        </div>
                        <div style="display: flex; gap: 12px; font-size: 12px; color: var(--text-secondary);">
                            ${lostCount > 0 ? `<span>🔍 寻物 ${lostCount}件</span>` : ''}
                            ${foundCount > 0 ? `<span>🫴 招领 ${foundCount}件</span>` : ''}
                        </div>
                    </div>
                    <span style="color: var(--text-light);">›</span>
                </div>
            `;
        }).join('');
    },

    showLocationPosts(location) {
        const posts = this.posts.filter(p => (p.lost_location || '未知地点') === location);
        if (posts.length === 0) {
            Toast.info('暂无该地点的物品信息');
            return;
        }
        if (posts.length === 1) {
            Router.navigate('detail', { post_id: posts[0].id });
            return;
        }
        const list = document.getElementById('markersList');
        list.innerHTML = `
            <div style="margin-bottom: 12px;">
                <a href="javascript:;" onclick="MapPage.loadMarkers()" style="color: var(--primary-blue); font-size: 13px;">← 返回地点列表</a>
                <span style="margin-left: 8px; font-size: 14px; font-weight: 500;">📍 ${location}</span>
            </div>
            ${posts.map(post => `
                <div class="card ${post.post_type}" onclick="Router.navigate('detail', { post_id: ${post.id} })" style="cursor: pointer; margin-bottom: 12px;">
                    <div class="card-header">
                        <span class="card-type-badge ${post.post_type}">
                            ${post.post_type === 'lost' ? '🔍' : '🫴'} ${post.post_type === 'lost' ? '寻物' : '招领'}
                        </span>
                    </div>
                    <h3 class="card-title">${post.title}</h3>
                    <div class="card-meta">
                        <span class="card-meta-item"><span class="icon">⏰</span>${Utils.formatTime(post.created_at)}</span>
                    </div>
                </div>
            `).join('')}
        `;
    }
};

window.MapPage = MapPage;
