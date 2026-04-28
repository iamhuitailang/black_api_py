var MessagePage = {
    render: function() {
        if (!Auth.checkAuth()) return;
        
        var app = document.getElementById('app');
        
        app.innerHTML = `
            <div class="page-container with-tabbar">
                <div class="header">
                    <div class="header-left"></div>
                    <div class="header-title">消息中心</div>
                    <div class="header-right">
                        <button class="header-btn" onclick="MessagePage.markAllRead()">
                            全部已读
                        </button>
                    </div>
                </div>
                <div class="page-content" id="messageContent" style="padding: 0;">
                    <div class="text-center" style="padding: 40px;">
                        <span class="loading"></span> 加载中...
                    </div>
                </div>
                ` + this.renderTabBar('message') + `
            </div>
        `;
        
        this.loadMessages();
    },
    
    loadMessages: function() {
        var self = this;
        
        API.get('/ex/message/list/get')
            .then(function(response) {
                var data = response.data;
                var messages = data.list || data;
                
                var container = document.getElementById('messageContent');
                
                if (messages.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state" style="padding-top: 80px;">
                            <div class="icon">💬</div>
                            <p>暂无消息</p>
                        </div>
                    `;
                } else {
                    container.innerHTML = '';
                    messages.forEach(function(msg) {
                        container.innerHTML += self.renderMessageItem(msg);
                    });
                }
            })
            .catch(function(error) {
                var container = document.getElementById('messageContent');
                container.innerHTML = `
                    <div class="empty-state" style="padding-top: 80px;">
                        <div class="icon">❌</div>
                        <p>加载失败: ` + (error.message || '未知错误') + `</p>
                        <button class="btn btn-primary btn-sm" onclick="MessagePage.loadMessages()">重试</button>
                    </div>
                `;
            });
    },
    
    renderMessageItem: function(msg) {
        var unreadClass = msg.is_read === 0 ? 'unread-dot' : '';
        var isNew = msg.is_read === 0;
        
        return `
            <div class="message-card" onclick="MessagePage.readMessage(` + msg.id + `)">
                <div class="message-avatar">
                    🔔
                    ` + (unreadClass ? '<span class="' + unreadClass + '"></span>' : '') + `
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-title" style="` + (isNew ? 'font-weight: 600;' : '') + `">系统通知</span>
                        <span class="message-time">` + (msg.created_at || '') + `</span>
                    </div>
                    <div class="message-preview">` + (msg.content || '-') + `</div>
                </div>
            </div>
        `;
    },
    
    readMessage: function(messageId) {
        var self = this;
        
        API.post('/ex/message/read', { message_id: messageId })
            .then(function() {
            })
            .catch(function() {});
    },
    
    markAllRead: function() {
        var self = this;
        
        API.post('/ex/message/read/all', {})
            .then(function() {
                Toast.success('已全部标记为已读');
                self.loadMessages();
            })
            .catch(function(error) {
                Toast.error(error.message || '操作失败');
            });
    },
    
    renderTabBar: function(active) {
        return `
            <div class="tab-bar safe-bottom">
                <div class="tab-item ` + (active === 'home' ? 'active' : '') + `" onclick="Router.navigate('/')">
                    <div class="icon">🏠</div>
                    <div class="label">首页</div>
                </div>
                <div class="tab-item ` + (active === 'exchange' ? 'active' : '') + `" onclick="Router.navigate('/exchange')">
                    <div class="icon">🔄</div>
                    <div class="label">交换</div>
                </div>
                <div class="tab-item ` + (active === 'publish' ? 'active' : '') + `" onclick="Router.navigate('/publish')">
                    <div class="icon">➕</div>
                    <div class="label">发布</div>
                </div>
                <div class="tab-item ` + (active === 'message' ? 'active' : '') + `" onclick="Router.navigate('/message')">
                    <div class="icon">💬</div>
                    <div class="label">消息</div>
                </div>
                <div class="tab-item ` + (active === 'profile' ? 'active' : '') + `" onclick="Router.navigate('/profile')">
                    <div class="icon">👤</div>
                    <div class="label">我的</div>
                </div>
            </div>
        `;
    }
};
