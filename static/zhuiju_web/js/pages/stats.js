const StatsPage = {
    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            ${AppHeader.render()}
            <div class="page-section">
                <h1 class="page-title">📊 追剧统计</h1>
                <p class="page-subtitle">用数据记录你看过的世界</p>
                <div id="stats-content"><p style="color:var(--text-muted)">加载中...</p></div>
            </div>
            ${BottomNav.render('stats')}
        `;
        AppHeader.bindEvents();
        BottomNav.bindEvents();

        const [statsRes, annualRes, topRes] = await Promise.all([
            ApiService.statistics(),
            ApiService.annualSummary(),
            ApiService.listDramas({ status: 'finished', sort_by: 'rating', order: 'desc' })
        ]);

        const s = statsRes.data || {};
        const annual = annualRes.data || {};
        const topList = (topRes.data?.items || []).filter(d => d.rating > 0).slice(0, 5);

        document.getElementById('stats-content').innerHTML = `
            <div class="stats-grid">
                <div class="stat-card accent">
                    <div class="stat-label">总剧集数</div>
                    <div class="stat-value">${s.total_dramas || 0}</div>
                    <div class="stat-sub">剧库规模</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">已看完</div>
                    <div class="stat-value">${s.finished_count || 0}</div>
                    <div class="stat-sub">完整的故事</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">正在追</div>
                    <div class="stat-value">${s.watching_count || 0}</div>
                    <div class="stat-sub">追更中</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">想看</div>
                    <div class="stat-value">${s.want_count || 0}</div>
                    <div class="stat-sub">待解锁</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">总观看集数</div>
                    <div class="stat-value">${s.total_watched_episodes || 0}</div>
                    <div class="stat-sub">集</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">总观看时长</div>
                    <div class="stat-value">${s.total_watch_hours || 0}</div>
                    <div class="stat-sub">小时 ${s.total_watch_minutes_only || 0} 分钟</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">平均评分</div>
                    <div class="stat-value">${s.avg_rating ? s.avg_rating.toFixed(1) : '-'}</div>
                    <div class="stat-sub">满分5.0</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">本月完成</div>
                    <div class="stat-value">${s.finished_this_month || 0}</div>
                    <div class="stat-sub">部</div>
                </div>
            </div>

            <div class="detail-progress-section">
                <div class="section-title">🏆 ${annual.year} 年度总结</div>
                <div class="stats-grid" style="grid-template-columns:repeat(4,1fr)">
                    <div class="stat-card" style="padding:12px">
                        <div class="stat-label" style="font-size:11px">完成</div>
                        <div class="stat-value" style="font-size:18px">${annual.finished_count || 0}</div>
                        <div class="stat-sub">部</div>
                    </div>
                    <div class="stat-card" style="padding:12px">
                        <div class="stat-label" style="font-size:11px">总集数</div>
                        <div class="stat-value" style="font-size:18px">${annual.total_episodes || 0}</div>
                    </div>
                    <div class="stat-card" style="padding:12px">
                        <div class="stat-label" style="font-size:11px">时长</div>
                        <div class="stat-value" style="font-size:18px">${annual.total_watch_hours || 0}h</div>
                    </div>
                    <div class="stat-card" style="padding:12px">
                        <div class="stat-label" style="font-size:11px">均分</div>
                        <div class="stat-value" style="font-size:18px">${annual.avg_rating ? annual.avg_rating.toFixed(1) : '-'}</div>
                    </div>
                </div>
                ${topList.length ? `
                    <div style="margin-top:16px">
                        <div style="color:var(--text-secondary);font-size:13px;margin-bottom:10px">⭐ 年度高分 Top 5</div>
                        ${topList.map((d, i) => `
                            <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
                                <span style="color:var(--accent);font-weight:700;width:24px">#${i + 1}</span>
                                <span style="font-size:24px">${d.cover || '🎬'}</span>
                                <div style="flex:1">
                                    <div style="font-weight:500">${Utils.escapeHtml(d.name)}</div>
                                    <div style="font-size:12px;color:var(--text-muted)">${Utils.escapeHtml(d.genre || '')}</div>
                                </div>
                                <div style="color:#fbbf24">★ ${d.rating}.0</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>

            <div class="detail-progress-section">
                <div class="section-title">📈 观看进度</div>
                <div style="display:flex;gap:16px;flex-wrap:wrap">
                    <div style="flex:1;min-width:120px;text-align:center;padding:12px;background:var(--bg-card);border-radius:10px">
                        <div style="font-size:22px;font-weight:700">${s.total_dramas || 0}</div>
                        <div style="color:var(--text-muted);font-size:12px">全部</div>
                    </div>
                    <div style="flex:1;min-width:120px;text-align:center;padding:12px;background:var(--bg-card);border-radius:10px">
                        <div style="font-size:22px;font-weight:700;color:var(--accent)">${s.finished_count || 0}</div>
                        <div style="color:var(--text-muted);font-size:12px">已完成</div>
                    </div>
                    <div style="flex:1;min-width:120px;text-align:center;padding:12px;background:var(--bg-card);border-radius:10px">
                        <div style="font-size:22px;font-weight:700;color:var(--warning)">${s.watching_count || 0}</div>
                        <div style="color:var(--text-muted);font-size:12px">进行中</div>
                    </div>
                </div>
                ${s.total_dramas > 0 ? `
                    <div style="margin-top:14px">
                        <div class="card-progress-bar" style="height:10px">
                            <div class="card-progress-fill" style="width:${(s.finished_count / s.total_dramas * 100).toFixed(0)}%"></div>
                        </div>
                        <div style="color:var(--text-muted);font-size:12px;margin-top:6px">
                            整体完成度 ${((s.finished_count || 0) / (s.total_dramas || 1) * 100).toFixed(0)}%
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
};

window.StatsPage = StatsPage;
