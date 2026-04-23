const ContactPage = {
    contact: null,
    
    render() {
        const content = `
            <div class="page-header">
                <h1 class="page-title">联系方式配置</h1>
                <p class="page-subtitle">管理商业服务模块中的联系方式信息</p>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">联系方式设置</h3>
                </div>
                <div class="card-body">
                    <form id="contactForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">
                                    联系电话
                                </label>
                                <input type="text" id="contactPhone" class="form-control" placeholder="请输入联系电话">
                                <div class="form-error" id="contactPhoneError"></div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">
                                    微信联系方式
                                </label>
                                <input type="text" id="contactWechat" class="form-control" placeholder="请输入微信号或微信二维码链接">
                            </div>
                        </div>
                        
                        <div class="form-group mt-2">
                            <div class="flex-between">
                                <div>
                                    <h4 style="font-size: 14px; font-weight: 500; margin-bottom: 8px;">使用说明</h4>
                                    <ul style="color: var(--text-secondary); font-size: 13px; line-height: 1.8; padding-left: 20px;">
                                        <li>联系电话：将在"与我联系"模块中显示，支持点击拨打电话</li>
                                        <li>微信联系方式：可以是微信号、微信二维码图片链接等</li>
                                        <li>所有字段均为可选，留空则不显示对应内容</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        
                        <div class="text-right mt-2">
                            <button type="submit" class="btn btn-primary">
                                保存设置
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <div class="card mt-2">
                <div class="card-header">
                    <h3 class="card-title">预览效果</h3>
                </div>
                <div class="card-body">
                    <div style="max-width: 360px; margin: 0 auto; background: var(--card-bg); border-radius: var(--radius-md); border: 1px solid var(--border-color); overflow: hidden;">
                        <div style="padding: 16px; background: var(--primary-light);">
                            <h4 style="color: var(--primary-color); font-size: 16px; font-weight: 500;">与我联系</h4>
                        </div>
                        <div style="padding: 20px;">
                            <div id="previewPhone" style="display: none; margin-bottom: 16px;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div style="width: 40px; height: 40px; background: var(--primary-light); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" stroke-width="2">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <div style="font-size: 12px; color: var(--text-secondary);">联系电话</div>
                                        <div id="previewPhoneValue" style="font-weight: 500; color: var(--primary-color);">-</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div id="previewWechat" style="display: none;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div style="width: 40px; height: 40px; background: #e6f4ea; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#188038" stroke-width="2">
                                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <div style="font-size: 12px; color: var(--text-secondary);">微信联系</div>
                                        <div id="previewWechatValue" style="font-weight: 500; color: var(--success-color);">-</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div id="previewEmpty" style="text-align: center; padding: 20px 0; color: var(--text-light);">
                                暂无联系方式
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        Layout.render(content);
        this.bindEvents();
        this.loadData();
    },
    
    bindEvents() {
        const form = document.getElementById('contactForm');
        const phoneInput = document.getElementById('contactPhone');
        const wechatInput = document.getElementById('contactWechat');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveContact();
        });
        
        phoneInput.addEventListener('input', () => this.updatePreview());
        wechatInput.addEventListener('input', () => this.updatePreview());
    },
    
    async loadData() {
        try {
            const result = await ContactService.get();
            if (result.code === 0 && result.data) {
                this.contact = result.data;
                const phoneInput = document.getElementById('contactPhone');
                const wechatInput = document.getElementById('contactWechat');
                
                if (phoneInput) phoneInput.value = this.contact.phone || '';
                if (wechatInput) wechatInput.value = this.contact.wechat || '';
                
                this.updatePreview();
            }
        } catch (error) {
            Toast.error('加载数据失败');
            console.error(error);
        }
    },
    
    updatePreview() {
        const phone = document.getElementById('contactPhone')?.value || '';
        const wechat = document.getElementById('contactWechat')?.value || '';
        
        const previewPhone = document.getElementById('previewPhone');
        const previewPhoneValue = document.getElementById('previewPhoneValue');
        const previewWechat = document.getElementById('previewWechat');
        const previewWechatValue = document.getElementById('previewWechatValue');
        const previewEmpty = document.getElementById('previewEmpty');
        
        const hasPhone = phone.trim() !== '';
        const hasWechat = wechat.trim() !== '';
        
        if (hasPhone) {
            previewPhone.style.display = 'block';
            previewPhoneValue.textContent = phone;
        } else {
            previewPhone.style.display = 'none';
        }
        
        if (hasWechat) {
            previewWechat.style.display = 'block';
            previewWechatValue.textContent = wechat;
        } else {
            previewWechat.style.display = 'none';
        }
        
        previewEmpty.style.display = (!hasPhone && !hasWechat) ? 'block' : 'none';
    },
    
    async saveContact() {
        const phone = document.getElementById('contactPhone').value.trim();
        const wechat = document.getElementById('contactWechat').value.trim();
        
        const phoneError = document.getElementById('contactPhoneError');
        const phoneInput = document.getElementById('contactPhone');
        
        if (phone && !/^[\d\-+()\s]+$/.test(phone)) {
            phoneError.textContent = '请输入有效的电话号码';
            phoneInput.style.borderColor = 'var(--danger-color)';
            return;
        }
        
        phoneError.textContent = '';
        phoneInput.style.borderColor = '';
        
        try {
            const result = await ContactService.set(phone, wechat);
            
            if (result.code === 0) {
                Toast.success('保存成功');
                this.contact = result.data;
            } else {
                Toast.error(result.message || '保存失败');
            }
        } catch (error) {
            Toast.error('网络错误');
        }
    }
};
