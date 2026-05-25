const DramaCard = {
    render(drama, { onEpisodePlus, onStatusChange, onDelete } = {}) {
        const cover = drama.cover || '🎬';
        const statusBadge = `<span class="card-badge ${Utils.statusBadgeClass(drama.status)}">${Utils.statusLabel(drama.status)}</span>`;
        const rating = drama.rating > 0
            ? `<span class="card-rating-float">★ ${drama.rating}.0</span>`
            : '';
        const progress = drama.progress || 0;
        const total = drama.total_episodes || 0;
        const watched = drama.watched_episodes || 0;
        const genre = drama.genre ? `<span class="genre-tag">${Utils.escapeHtml(drama.genre)}</span>` : '';
        const seasonText = drama.seasons > 1 ? `${drama.seasons}季` : '';
        const epText = total > 0 ? `${watched}/${total}集` : (watched > 0 ? `${watched}集` : '');

        let actionBtn = '';
        if (drama.status === 'want') {
            actionBtn = `<button class="btn btn-primary" data-action="start">开始追</button>`;
        } else if (drama.status === 'watching') {
            actionBtn = `<button class="btn btn-primary" data-action="plus">+1 集</button>
                         <button class="btn btn-secondary" data-action="detail">详情</button>`;
        } else if (drama.status === 'finished') {
            actionBtn = `<button class="btn btn-secondary" data-action="detail">详情</button>`;
        } else {
            actionBtn = `<button class="btn btn-ghost" data-action="detail">查看</button>`;
        }

        const rewatchTag = drama.is_rewatch ? `<span class="genre-tag" style="background: rgba(229,9,20,0.15); color: #ff6b6b;">二刷</span>` : '';

        return `
            <div class="drama-card" data-id="${drama.id}">
                <div class="card-cover">
                    ${statusBadge}
                    ${rating}
                    <span>${cover}</span>
                </div>
                <div class="card-body">
                    <div class="card-title">${Utils.escapeHtml(drama.name)}</div>
                    <div class="card-meta">
                        ${genre}
                        ${rewatchTag}
                        ${seasonText ? `<span>${seasonText}</span><span class="dot"></span>` : ''}
                        ${epText ? `<span>${epText}</span>` : ''}
                    </div>
                    ${total > 0 ? `
                        <div class="card-progress-bar">
                            <div class="card-progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="card-progress-text">进度 ${progress.toFixed(0)}%</div>
                    ` : ''}
                    <div class="card-actions">
                        ${actionBtn}
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents(container, callbacks = {}) {
        container.querySelectorAll('.drama-card').forEach(card => {
            const id = parseInt(card.dataset.id);
            card.addEventListener('click', (e) => {
                const actionEl = e.target.closest('[data-action]');
                if (actionEl) {
                    const action = actionEl.dataset.action;
                    e.stopPropagation();
                    if (action === 'plus') {
                        callbacks.onEpisodePlus && callbacks.onEpisodePlus(id);
                    } else if (action === 'start') {
                        callbacks.onStatusChange && callbacks.onStatusChange(id, 'watching');
                    } else if (action === 'detail') {
                        Router.navigate('detail', { id });
                    }
                    return;
                }
                Router.navigate('detail', { id });
            });
        });
    }
};

window.DramaCard = DramaCard;
