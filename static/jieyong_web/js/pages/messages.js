const MessagesPage = {
  render() {
    return `
      <div class="page-container">
        <div class="page-header">
          <h2>消息中心</h2>
          <div class="header-actions">
            <button class="btn btn-outline btn-sm" id="mark-all-read">全部标为已读</button>
          </div>
        </div>

        <div class="message-list" id="message-list">
          <div class="loading">加载中...</div>
        </div>

        <div class="pagination" id="pagination"></div>
      </div>
    `;
  },

  data() {
    return {
      messages: [],
      page: 1,
      pageSize: 10,
      total: 0
    };
  },

  async mount() {
    await this.loadMessages();
    document.getElementById('mark-all-read').addEventListener('click', async () => {
      if (confirm('确认将所有消息标为已读？')) {
        const result = await MessageService.markAllAsRead();
        if (result.code === 0) {
          Toast.success('操作成功');
          this.loadMessages();
        }
      }
    });
  },

  async loadMessages() {
    const params = {
      page: this.page,
      page_size: this.pageSize
    };

    const result = await MessageService.getMyMessages(params);
    if (result.code === 0 && result.data) {
      this.messages = result.data.items;
      this.total = result.data.total;
      this.renderMessages();
      this.renderPagination();
    } else {
      document.getElementById('message-list').innerHTML = '<div class="empty-state">暂无消息</div>';
    }
  },

  renderMessages() {
    const list = document.getElementById('message-list');
    
    if (this.messages.length === 0) {
      list.innerHTML = '<div class="empty-state">暂无消息</div>';
      return;
    }

    const typeMap = {
      borrow: { icon: '📦', text: '借用通知' },
      return: { icon: '✅', text: '归还通知' },
      overdue: { icon: '⚠️', text: '逾期提醒' },
      system: { icon: '📢', text: '系统通知' },
      approval: { icon: '📋', text: '审核通知' }
    };

    list.innerHTML = this.messages.map(msg => {
      const type = typeMap[msg.type] || { icon: '📩', text: '消息' };
      return `
        <div class="message-card ${msg.is_read ? 'read' : 'unread'}" data-id="${msg.id}">
          <div class="message-icon">${type.icon}</div>
          <div class="message-content">
            <div class="message-header">
              <span class="message-type">${type.text}</span>
              <span class="message-time">${msg.created_at}</span>
            </div>
            <h4 class="message-title">${msg.title}</h4>
            <p class="message-body">${msg.content}</p>
          </div>
          ${!msg.is_read ? '<div class="unread-dot"></div>' : ''}
        </div>
      `;
    }).join('');

    this.bindMessageEvents();
  },

  bindMessageEvents() {
    document.querySelectorAll('.message-card').forEach(card => {
      card.addEventListener('click', async () => {
        const msgId = card.dataset.id;
        const msg = this.messages.find(m => m.id == msgId);
        
        if (msg && !msg.is_read) {
          await MessageService.markAsRead(msgId);
          card.classList.remove('unread');
          card.classList.add('read');
          const dot = card.querySelector('.unread-dot');
          if (dot) dot.remove();
        }

        this.showMessageDetail(msg);
      });
    });
  },

  showMessageDetail(msg) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${msg.title}</h3>
          <button class="modal-close" id="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <p class="message-time">${msg.created_at}</p>
          <div class="message-detail-content">${msg.content}</div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  },

  renderPagination() {
    const totalPages = Math.ceil(this.total / this.pageSize);
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
      pagination.innerHTML = '';
      return;
    }

    let html = '';
    if (this.page > 1) {
      html += `<button class="page-btn" data-page="${this.page - 1}">上一页</button>`;
    }
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= this.page - 2 && i <= this.page + 2)) {
        html += `<button class="page-btn ${i === this.page ? 'active' : ''}" data-page="${i}">${i}</button>`;
      } else if (i === this.page - 3 || i === this.page + 3) {
        html += '<span class="page-ellipsis">...</span>';
      }
    }
    if (this.page < totalPages) {
      html += `<button class="page-btn" data-page="${this.page + 1}">下一页</button>`;
    }

    pagination.innerHTML = html;

    pagination.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.page = parseInt(btn.dataset.page);
        this.loadMessages();
      });
    });
  }
};

window.MessagesPage = MessagesPage;
