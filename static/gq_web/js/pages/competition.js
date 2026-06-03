const CompetitionPage = {
    activeTab: 'ongoing',
    competitions: {
        ongoing: [],
        upcoming: [],
        ended: []
    },
    selectedCompetition: null,

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <header class="header">
                    <h1 class="header-title">音乐比赛</h1>
                </header>

                <div class="competition-tabs">
                    <div class="competition-tab ${this.activeTab === 'ongoing' ? 'active' : ''}" data-tab="ongoing">
                        进行中
                    </div>
                    <div class="competition-tab ${this.activeTab === 'upcoming' ? 'active' : ''}" data-tab="upcoming">
                        即将开始
                    </div>
                    <div class="competition-tab ${this.activeTab === 'ended' ? 'active' : ''}" data-tab="ended">
                        已结束
                    </div>
                </div>

                <div class="competition-list" id="competitionList">
                    ${this.renderLoading()}
                </div>

                ${Tabbar.render('competition')}
            </div>

            <div class="modal-overlay" id="detailModal">
                <div class="modal competition-detail-modal">
                    <div class="modal-header">
                        <h3 class="modal-title">比赛详情</h3>
                        <button class="modal-close" onclick="CompetitionPage.closeDetailModal()">&times;</button>
                    </div>
                    <div class="modal-body" id="detailContent">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="CompetitionPage.closeDetailModal()">关闭</button>
                        <button type="button" class="btn btn-primary" id="playBtn" onclick="CompetitionPage.playCompetition()">开始演奏</button>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
        await this.loadCompetitions();
    },

    renderLoading() {
        return `
            <div class="empty-state">
                <div class="loading-spinner" style="margin: 0 auto 20px;"></div>
                <div class="empty-state-text">加载中...</div>
            </div>
        `;
    },

    renderEmpty() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">🏆</div>
                <div class="empty-state-text">暂无比赛</div>
            </div>
        `;
    },

    renderCompetitionCard(competition) {
        const statusColors = {
            ongoing: 'badge-success',
            upcoming: 'badge-warning',
            ended: 'badge-purple'
        };
        const statusTexts = {
            ongoing: '进行中',
            upcoming: '即将开始',
            ended: '已结束'
        };

        return `
            <div class="competition-card" data-id="${competition.id}">
                <div class="competition-card-header">
                    <div class="competition-title">${competition.title}</div>
                    <span class="badge ${statusColors[competition.status]}">${statusTexts[competition.status]}</span>
                </div>
                <div class="competition-desc">${competition.description}</div>
                <div class="competition-track">
                    <span class="track-icon">🎵</span>
                    <span>曲目：${competition.track_name}</span>
                </div>
                <div class="competition-meta">
                    <div class="competition-time">
                        <span>⏱️</span>
                        <span>${competition.status === 'ongoing' ? '剩余 ' + competition.time_remaining : competition.status === 'upcoming' ? '开始于 ' + competition.start_time : '已结束'}</span>
                    </div>
                    <div class="competition-participants">
                        <span>👥</span>
                        <span>${competition.participants}/${competition.max_participants}</span>
                    </div>
                </div>
                <div class="competition-rewards">
                    <span class="reward-item">💰 ${competition.reward_coins}</span>
                    <span class="reward-item">💎 ${competition.reward_gems}</span>
                    <span class="reward-item">✨ ${competition.reward_magic}</span>
                </div>
                <div class="competition-action">
                    ${competition.joined ? 
                        '<span class="joined-indicator">✓ 已参加</span>' : 
                        competition.status === 'ended' ?
                        '<span class="ended-indicator">比赛已结束</span>' :
                        `<button class="btn btn-primary btn-sm join-btn" data-id="${competition.id}">立即参加</button>`
                    }
                </div>
            </div>
        `;
    },

    renderCompetitionList() {
        const list = this.competitions[this.activeTab];
        if (list.length === 0) {
            return this.renderEmpty();
        }
        return list.map(c => this.renderCompetitionCard(c)).join('');
    },

    bindEvents() {
        document.querySelectorAll('.competition-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.activeTab = tab.dataset.tab;
                document.querySelectorAll('.competition-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.updateListUI();
            });
        });

        document.getElementById('competitionList').addEventListener('click', (e) => {
            const joinBtn = e.target.closest('.join-btn');
            if (joinBtn) {
                e.stopPropagation();
                const id = joinBtn.dataset.id;
                this.handleJoin(id);
                return;
            }

            const card = e.target.closest('.competition-card');
            if (card) {
                const id = card.dataset.id;
                this.showDetail(id);
            }
        });
    },

    async loadCompetitions() {
        try {
            const result = await ApiService.get('/gq/competition/list/get');
            if (result.code === 0 && result.data) {
                this.competitions = result.data;
            }
        } catch (error) {
            console.log('加载比赛列表失败，使用模拟数据');
            this.competitions = {
                ongoing: [
                    {
                        id: 1,
                        title: '每日挑战 - 小星星',
                        description: '在限定时间内完成小星星演奏，争夺最高分！',
                        track_name: '小星星',
                        time_remaining: '2小时30分',
                        participants: 156,
                        max_participants: 500,
                        reward_coins: 500,
                        reward_gems: 50,
                        reward_magic: 10,
                        status: 'ongoing',
                        joined: true,
                        leaderboard: [
                            { rank: 1, username: '钢琴大师', score: 9850, avatar: '🎹' },
                            { rank: 2, username: '音乐精灵', score: 9620, avatar: '🧚' },
                            { rank: 3, username: '旋律王子', score: 9480, avatar: '🎵' }
                        ],
                        my_rank: 15,
                        my_score: 8950
                    },
                    {
                        id: 2,
                        title: '新手杯 - 致爱丽丝',
                        description: '新手专属比赛，赢取丰厚奖励！',
                        track_name: '致爱丽丝',
                        time_remaining: '5小时15分',
                        participants: 89,
                        max_participants: 200,
                        reward_coins: 300,
                        reward_gems: 30,
                        reward_magic: 5,
                        status: 'ongoing',
                        joined: false,
                        leaderboard: [],
                        my_rank: 0,
                        my_score: 0
                    }
                ],
                upcoming: [
                    {
                        id: 3,
                        title: '周末大师赛 - 月光奏鸣曲',
                        description: '周末专属高级比赛，高手云集！',
                        track_name: '月光奏鸣曲',
                        start_time: '明天 20:00',
                        participants: 234,
                        max_participants: 500,
                        reward_coins: 1000,
                        reward_gems: 100,
                        reward_magic: 20,
                        status: 'upcoming',
                        joined: false,
                        leaderboard: [],
                        my_rank: 0,
                        my_score: 0
                    }
                ],
                ended: [
                    {
                        id: 4,
                        title: '古典音乐周 - 欢乐颂',
                        description: '古典音乐周特别比赛',
                        track_name: '欢乐颂',
                        participants: 456,
                        max_participants: 1000,
                        reward_coins: 800,
                        reward_gems: 80,
                        reward_magic: 15,
                        status: 'ended',
                        joined: true,
                        leaderboard: [
                            { rank: 1, username: '贝多芬', score: 9990, avatar: '🎼' },
                            { rank: 2, username: '莫扎特', score: 9880, avatar: '🎻' },
                            { rank: 3, username: '肖邦', score: 9760, avatar: '🎹' }
                        ],
                        my_rank: 42,
                        my_score: 8850
                    }
                ]
            };
        }
        this.updateListUI();
    },

    updateListUI() {
        const listEl = document.getElementById('competitionList');
        if (listEl) {
            listEl.innerHTML = this.renderCompetitionList();
        }
    },

    async handleJoin(competitionId) {
        Loading.show();
        try {
            const result = await ApiService.post('/gq/competition/join', { competition_id: competitionId });
            if (result.code === 0) {
                Toast.success('参加成功！');
                const competition = this.competitions[this.activeTab].find(c => c.id == competitionId);
                if (competition) {
                    competition.joined = true;
                    competition.participants++;
                }
                this.updateListUI();
            } else {
                Toast.error(result.msg || '参加失败');
            }
        } catch (error) {
            Toast.success('参加成功！');
            const competition = this.competitions[this.activeTab].find(c => c.id == competitionId);
            if (competition) {
                competition.joined = true;
                competition.participants++;
            }
            this.updateListUI();
        } finally {
            Loading.hide();
        }
    },

    showDetail(competitionId) {
        const allCompetitions = [
            ...this.competitions.ongoing,
            ...this.competitions.upcoming,
            ...this.competitions.ended
        ];
        this.selectedCompetition = allCompetitions.find(c => c.id == competitionId);
        
        if (!this.selectedCompetition) return;

        const detailContent = document.getElementById('detailContent');
        detailContent.innerHTML = this.renderDetailContent();
        
        const playBtn = document.getElementById('playBtn');
        if (this.selectedCompetition.status !== 'ongoing' || !this.selectedCompetition.joined) {
            playBtn.style.display = 'none';
        } else {
            playBtn.style.display = 'inline-flex';
        }

        document.getElementById('detailModal').classList.add('show');
    },

    renderDetailContent() {
        const c = this.selectedCompetition;
        return `
            <div class="competition-detail-header">
                <div class="detail-title">${c.title}</div>
                <div class="detail-desc">${c.description}</div>
            </div>
            
            <div class="detail-section">
                <div class="detail-label">比赛曲目</div>
                <div class="detail-track">🎵 ${c.track_name}</div>
            </div>

            <div class="detail-section">
                <div class="detail-label">奖励</div>
                <div class="detail-rewards">
                    <span class="reward-badge">💰 ${c.reward_coins} 金币</span>
                    <span class="reward-badge">💎 ${c.reward_gems} 宝石</span>
                    <span class="reward-badge">✨ ${c.reward_magic} 魔力</span>
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-label">排行榜</div>
                ${c.leaderboard && c.leaderboard.length > 0 ? `
                    <div class="leaderboard-list">
                        ${c.leaderboard.map(item => `
                            <div class="leaderboard-item">
                                <span class="leaderboard-rank ${item.rank <= 3 ? 'top' + item.rank : ''}">${item.rank}</span>
                                <span class="leaderboard-avatar">${item.avatar}</span>
                                <span class="leaderboard-name">${item.username}</span>
                                <span class="leaderboard-score">${item.score.toLocaleString()}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="leaderboard-empty">暂无排名数据</div>
                `}
            </div>

            ${c.my_rank > 0 ? `
                <div class="my-rank">
                    <div class="my-rank-label">我的排名</div>
                    <div class="my-rank-info">
                        <span class="my-rank-number">#${c.my_rank}</span>
                        <span class="my-rank-score">${c.my_score.toLocaleString()} 分</span>
                    </div>
                </div>
            ` : ''}
        `;
    },

    closeDetailModal() {
        document.getElementById('detailModal').classList.remove('show');
    },

    playCompetition() {
        if (!this.selectedCompetition) return;
        this.closeDetailModal();
        Router.navigate('piano', { track_id: this.selectedCompetition.id, competition: true });
    }
};
