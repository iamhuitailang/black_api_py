var ItemPage = {
    itemId: null,
    item: null,
    
    render: function(params) {
        this.itemId = params.id;
        
        var app = document.getElementById('app');
        app.innerHTML = `
            <div class="page-container">
                <div class="item-detail-header">
                    <div class="item-detail-images" id="itemImages">
                        <img src="" class="item-detail-image" alt="">
                    </div>
                    <div class="header" style="position: absolute; top: 0; left: 0; right: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.4), transparent);">
                        <div class="header-left">
                            <button class="header-btn" style="color: white;" onclick="Router.navigate(-1)">
                                <span>←</span>
                            </button>
                        </div>
                        <div class="header-right"></div>
                    </div>
                </div>
                <div class="page-content" id="itemContent">
                    <div class="text-center" style="padding: 40px;">
                        <span class="loading"></span> 加载中...
                    </div>
                </div>
                <div class="item-detail-bottom-bar safe-bottom">
                    <button class="btn btn-outline" onclick="ItemPage.report()">举报</button>
                    <button class="btn btn-primary" onclick="ItemPage.initExchange()">发起交换</button>
                </div>
            </div>
        `;
        
        this.loadItem();
    },
    
    loadItem: function() {
        var self = this;
        
        API.get('/ex/item/detail/get?id=' + this.itemId)
            .then(function(response) {
                self.item = response.data;
                self.renderContent();
            })
            .catch(function(error) {
                var container = document.getElementById('itemContent');
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">❌</div>
                        <p>加载失败: ` + (error.message || '未知错误') + `</p>
                        <button class="btn btn-primary btn-sm" onclick="Router.navigate(-1)">返回</button>
                    </div>
                `;
            });
    },
    
    renderContent: function() {
        var item = this.item;
        var conditionMap = { 1: '全新', 2: '几乎全新', 3: '轻微使用', 4: '明显使用' };
        var condition = conditionMap[item.condition] || '-';
        
        var imagesHtml = '';
        if (item.images && item.images.length > 0) {
            item.images.forEach(function(img) {
                imagesHtml += '<img src="' + img + '" class="item-detail-image" alt="" onerror="this.style.display=\'none\';">';
            });
        } else {
            imagesHtml = '<img src="" class="item-detail-image" style="background-color: var(--bg-color);">';
        }
        
        var imagesContainer = document.getElementById('itemImages');
        imagesContainer.innerHTML = imagesHtml;
        
        var creditStars = this.renderStars(item.publisher_credit_score || 0);
        
        var container = document.getElementById('itemContent');
        container.innerHTML = `
            <div class="item-detail-info">
                <div class="item-detail-title">` + (item.title || '-') + `</div>
                <div class="item-detail-tags">
                    ` + (item.category ? '<span class="item-detail-tag">' + item.category + '</span>' : '') + `
                    <span class="item-detail-tag">` + condition + `</span>
                    ` + (item.exchange_category ? '<span class="item-detail-tag">期望: ' + item.exchange_category + '</span>' : '') + `
                </div>
                <div class="item-detail-meta">
                    <div class="item-detail-meta-item">
                        <span class="label">发布时间</span>
                        <span>` + (item.created_at || '-') + `</span>
                    </div>
                    ` + (item.location ? `
                    <div class="item-detail-meta-item">
                        <span class="label">所在地区</span>
                        <span>` + item.location + `</span>
                    </div>
                    ` : '') + `
                </div>
            </div>
            
            ` + (item.description ? `
            <div class="item-detail-desc">
                <div class="item-detail-desc-title">物品描述</div>
                <div class="item-detail-desc-content">` + item.description + `</div>
            </div>
            ` : '') + `
            
            <div class="item-detail-user">
                <div class="item-detail-user-info" onclick="ItemPage.goToUserProfile()">
                    <div class="item-detail-user-avatar">
                        ` + (item.publisher_avatar 
                            ? '<img src="' + item.publisher_avatar + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">'
                            : (item.publisher_nickname ? item.publisher_nickname.charAt(0).toUpperCase() : '?')) + `
                    </div>
                    <div class="item-detail-user-text">
                        <div class="item-detail-user-name">` + (item.publisher_nickname || item.publisher_phone || '-') + `</div>
                        <div class="item-detail-user-credit">
                            <span class="stars">` + creditStars + `</span>
                            <span style="margin-left: 4px; font-size: 12px; color: var(--text-secondary);">信用 ` + (item.publisher_credit_score || 0) + `分</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    renderStars: function(score) {
        var stars = Math.round(score / 20);
        var html = '';
        for (var i = 1; i <= 5; i++) {
            html += i <= stars ? '★' : '☆';
        }
        return html;
    },
    
    initExchange: function() {
        if (!Auth.checkAuth()) return;
        
        var item = this.item;
        var currentUser = Auth.getCurrentUser();
        
        if (currentUser && item.publisher_id === currentUser.id) {
            Toast.warning('不能交换自己的物品');
            return;
        }
        
        this.showExchangeModal();
    },
    
    showExchangeModal: function() {
        var self = this;
        
        var modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.innerHTML = `
            <div class="modal" style="max-width: 90%;">
                <div class="modal-header">
                    <h3 class="modal-title">发起交换</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').classList.remove('show'); this.closest('.modal-overlay').remove();">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">选择我的物品 <span class="required">*</span></label>
                        <div class="select-wrapper">
                            <select id="myItemSelect" class="form-control">
                                <option value="">加载中...</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">交换附言</label>
                        <textarea class="form-control" id="exchangeMessage" placeholder="可以说明一下物品情况或交换意向..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').classList.remove('show'); this.closest('.modal-overlay').remove();">取消</button>
                    <button class="btn btn-primary" id="submitExchange">确认发起</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        API.get('/ex/item/my/list/get?status=1')
            .then(function(response) {
                var items = response.data.list || response.data;
                var select = document.getElementById('myItemSelect');
                
                if (!items || items.length === 0) {
                    select.innerHTML = '<option value="">您还没有上架的物品</option>';
                } else {
                    select.innerHTML = '<option value="">请选择物品</option>';
                    items.forEach(function(item) {
                        select.innerHTML += '<option value="' + item.id + '">' + item.title + '</option>';
                    });
                }
            })
            .catch(function() {
                var select = document.getElementById('myItemSelect');
                select.innerHTML = '<option value="">加载失败，请重试</option>';
            });
        
        document.getElementById('submitExchange').addEventListener('click', function() {
            var myItemId = document.getElementById('myItemSelect').value;
            var message = document.getElementById('exchangeMessage').value.trim();
            
            if (!myItemId) {
                Toast.error('请选择您要交换的物品');
                return;
            }
            
            var submitBtn = this;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading-small"></span> 提交中...';
            
            API.post('/ex/exchange/create', {
                receiver_item_id: parseInt(self.itemId),
                sender_item_id: parseInt(myItemId),
                message: message
            })
                .then(function() {
                    Toast.success('交换请求已发送');
                    modal.classList.remove('show');
                    setTimeout(function() {
                        modal.remove();
                    }, 300);
                })
                .catch(function(error) {
                    Toast.error(error.message || '发送失败');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '确认发起';
                });
        });
    },
    
    goToUserProfile: function() {
        if (this.item && this.item.publisher_id) {
            Router.navigate('/profile/' + this.item.publisher_id);
        }
    },
    
    report: function() {
        if (!Auth.checkAuth()) return;
        
        var self = this;
        
        var modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.innerHTML = `
            <div class="modal" style="max-width: 90%;">
                <div class="modal-header">
                    <h3 class="modal-title">举报物品</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').classList.remove('show'); this.closest('.modal-overlay').remove();">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">举报类型 <span class="required">*</span></label>
                        <div class="select-wrapper">
                            <select id="reportType" class="form-control">
                                <option value="">请选择</option>
                                <option value="1">违规物品</option>
                                <option value="2">虚假信息</option>
                                <option value="3">恶意行为</option>
                                <option value="4">其他问题</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">举报原因 <span class="required">*</span></label>
                        <textarea class="form-control" id="reportReason" placeholder="请详细描述举报原因..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').classList.remove('show'); this.closest('.modal-overlay').remove();">取消</button>
                    <button class="btn btn-primary" id="submitReport">提交举报</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('submitReport').addEventListener('click', function() {
            var type = document.getElementById('reportType').value;
            var reason = document.getElementById('reportReason').value.trim();
            
            if (!type) {
                Toast.error('请选择举报类型');
                return;
            }
            
            if (!reason) {
                Toast.error('请填写举报原因');
                return;
            }
            
            var submitBtn = this;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading-small"></span> 提交中...';
            
            API.post('/ex/report/create', {
                type: parseInt(type),
                target_type: 1,
                target_id: parseInt(self.itemId),
                reason: reason
            })
                .then(function() {
                    Toast.success('举报已提交');
                    modal.classList.remove('show');
                    setTimeout(function() {
                        modal.remove();
                    }, 300);
                })
                .catch(function(error) {
                    Toast.error(error.message || '提交失败');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '提交举报';
                });
        });
    }
};
