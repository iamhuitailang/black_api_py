/**
 * 主应用模块
 * 整合所有模块，处理用户交互
 */

const App = {
    searchKeyword: '',
    selectedCategory: '全部',
    isModalOpen: false,
    editingItem: null,
    
    /**
     * 初始化应用
     */
    init() {
        // 初始化UI
        UI.init();
        
        // 绑定事件
        this.bindEvents();
        
        // 渲染界面
        this.render();
        
        // 检查今日过期食材并发送通知
        NotificationManager.checkAndNotifyExpiringToday();
    },
    
    /**
     * 绑定事件监听
     */
    bindEvents() {
        const canvas = UI.canvas;
        
        // 点击事件
        canvas.addEventListener('click', (e) => this.handleClick(e));
        
        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // 阻止默认右键菜单
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    },
    
    /**
     * 处理点击事件
     * @param {MouseEvent} e - 鼠标事件
     */
    handleClick(e) {
        if (this.isModalOpen) return;
        
        const rect = UI.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const element = UI.checkClick(x, y);
        
        if (!element) return;
        
        switch (element.type) {
            case 'addButton':
                this.openAddModal();
                break;
                
            case 'consume':
                this.consumeItem(element.itemId);
                break;
                
            case 'add':
                this.addQuantity(element.itemId);
                break;
                
            case 'edit':
                this.openEditModal(element.itemId);
                break;
                
            case 'delete':
                this.deleteItem(element.itemId);
                break;
        }
    },
    
    /**
     * 处理键盘事件
     * @param {KeyboardEvent} e - 键盘事件
     */
    handleKeyDown(e) {
        if (e.key === 'Escape' && this.isModalOpen) {
            this.closeModal();
        }
    },
    
    /**
     * 渲染界面
     */
    render() {
        UI.render(this.searchKeyword, this.selectedCategory);
        
        // 更新标题栏警告
        if (window.updateHeaderWarning) {
            window.updateHeaderWarning();
        }
    },
    
    /**
     * 打开添加食材弹窗
     */
    openAddModal() {
        this.editingItem = null;
        this.showModal('添加食材');
    },
    
    /**
     * 打开编辑食材弹窗
     * @param {string} itemId - 食材ID
     */
    openEditModal(itemId) {
        const item = Storage.getById(itemId);
        if (!item) return;
        
        this.editingItem = item;
        this.showModal('编辑食材', item);
    },
    
    /**
     * 显示表单弹窗
     * @param {string} title - 标题
     * @param {Object|null} editData - 编辑数据（可选）
     */
    showModal(title, editData = null) {
        this.isModalOpen = true;
        
        // 创建遮罩
        const overlay = document.createElement('div');
        overlay.id = 'modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            padding: 20px;
            overflow-y: auto;
        `;
        
        // 创建弹窗
        const modal = document.createElement('div');
        modal.id = 'modal-content';
        modal.style.cssText = `
            background: #FFFFFF;
            padding: 30px;
            border-radius: 24px;
            max-width: 500px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        `;
        
        const today = Utils.getTodayString();
        const defaultExpiry = editData ? editData.expiryDate : today;
        
        modal.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <h2 style="font-size: 20px; color: #4A4A4A; margin: 0;">${title}</h2>
                <button id="modal-close" style="
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #9B9B9B;
                    padding: 5px;
                    line-height: 1;
                ">×</button>
            </div>
            
            <form id="food-form" style="display: flex; flex-direction: column; gap: 18px;">
                <div>
                    <label style="display: block; font-size: 14px; color: #4A4A4A; margin-bottom: 8px; font-weight: 600;">
                        🥗 食材名称 <span style="color: #FF6B6B;">*</span>
                    </label>
                    <input type="text" id="food-name" required
                        value="${editData ? editData.name : ''}"
                        placeholder="例如：苹果、牛奶、鸡肉"
                        style="
                            width: 100%;
                            padding: 12px 16px;
                            border: 2px solid #E8E8E8;
                            border-radius: 12px;
                            font-size: 15px;
                            box-sizing: border-box;
                            outline: none;
                            transition: border-color 0.2s;
                        "
                        onfocus="this.style.borderColor='#6BBF59'"
                        onblur="this.style.borderColor='#E8E8E8'"
                    >
                </div>
                
                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <label style="display: block; font-size: 14px; color: #4A4A4A; margin-bottom: 8px; font-weight: 600;">
                            🔢 数量 <span style="color: #FF6B6B;">*</span>
                        </label>
                        <input type="number" id="food-quantity" required min="0"
                            value="${editData ? editData.quantity : 1}"
                            style="
                                width: 100%;
                                padding: 12px 16px;
                                border: 2px solid #E8E8E8;
                                border-radius: 12px;
                                font-size: 15px;
                                box-sizing: border-box;
                                outline: none;
                                transition: border-color 0.2s;
                            "
                            onfocus="this.style.borderColor='#6BBF59'"
                            onblur="this.style.borderColor='#E8E8E8'"
                        >
                    </div>
                    
                    <div style="flex: 1;">
                        <label style="display: block; font-size: 14px; color: #4A4A4A; margin-bottom: 8px; font-weight: 600;">
                            📏 单位
                        </label>
                        <input type="text" id="food-unit"
                            value="${editData ? editData.unit : '个'}"
                            placeholder="个、斤、盒、瓶..."
                            style="
                                width: 100%;
                                padding: 12px 16px;
                                border: 2px solid #E8E8E8;
                                border-radius: 12px;
                                font-size: 15px;
                                box-sizing: border-box;
                                outline: none;
                                transition: border-color 0.2s;
                            "
                            onfocus="this.style.borderColor='#6BBF59'"
                            onblur="this.style.borderColor='#E8E8E8'"
                        >
                    </div>
                </div>
                
                <div>
                    <label style="display: block; font-size: 14px; color: #4A4A4A; margin-bottom: 8px; font-weight: 600;">
                        📅 过期日期 <span style="color: #FF6B6B;">*</span>
                    </label>
                    <input type="date" id="food-expiry" required
                        value="${defaultExpiry}"
                        style="
                            width: 100%;
                            padding: 12px 16px;
                            border: 2px solid #E8E8E8;
                            border-radius: 12px;
                            font-size: 15px;
                            box-sizing: border-box;
                            outline: none;
                            transition: border-color 0.2s;
                        "
                        onfocus="this.style.borderColor='#6BBF59'"
                        onblur="this.style.borderColor='#E8E8E8'"
                    >
                </div>
                
                <div>
                    <label style="display: block; font-size: 14px; color: #4A4A4A; margin-bottom: 8px; font-weight: 600;">
                        🏷️ 分类
                    </label>
                    <select id="food-category"
                        style="
                            width: 100%;
                            padding: 12px 16px;
                            border: 2px solid #E8E8E8;
                            border-radius: 12px;
                            font-size: 15px;
                            box-sizing: border-box;
                            outline: none;
                            background: #FFFFFF;
                            cursor: pointer;
                            transition: border-color 0.2s;
                        "
                        onfocus="this.style.borderColor='#6BBF59'"
                        onblur="this.style.borderColor='#E8E8E8'"
                    >
                        ${Utils.CATEGORIES.map(cat => 
                            `<option value="${cat}" ${editData && editData.category === cat ? 'selected' : ''}>
                                ${Utils.CATEGORY_ICONS[cat]} ${cat}
                            </option>`
                        ).join('')}
                    </select>
                </div>
                
                <div style="display: flex; gap: 15px; margin-top: 10px;">
                    <button type="button" id="modal-cancel"
                        style="
                            flex: 1;
                            padding: 14px;
                            border: 2px solid #E8E8E8;
                            border-radius: 25px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            background: #FFFFFF;
                            color: #4A4A4A;
                            transition: all 0.2s;
                        "
                        onmouseover="this.style.background='#F5F5F5'"
                        onmouseout="this.style.background='#FFFFFF'"
                    >取消</button>
                    <button type="submit"
                        style="
                            flex: 1;
                            padding: 14px;
                            border: none;
                            border-radius: 25px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            background: linear-gradient(135deg, #6BBF59, #A8D5BA);
                            color: #FFFFFF;
                            transition: transform 0.2s;
                        "
                        onmouseover="this.style.transform='scale(1.02)'"
                        onmouseout="this.style.transform='scale(1)'"
                    >${editData ? '保存修改' : '添加食材'}</button>
                </div>
            </form>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // 绑定事件
        const closeBtn = document.getElementById('modal-close');
        const cancelBtn = document.getElementById('modal-cancel');
        const form = document.getElementById('food-form');
        
        closeBtn.addEventListener('click', () => this.closeModal());
        cancelBtn.addEventListener('click', () => this.closeModal());
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeModal();
            }
        });
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });
        
        // 聚焦到第一个输入框
        document.getElementById('food-name').focus();
    },
    
    /**
     * 处理表单提交
     */
    handleFormSubmit() {
        const name = document.getElementById('food-name').value.trim();
        const quantity = parseInt(document.getElementById('food-quantity').value);
        const unit = document.getElementById('food-unit').value.trim() || '个';
        const expiryDate = document.getElementById('food-expiry').value;
        const category = document.getElementById('food-category').value;
        
        if (!name) {
            NotificationManager.showToast('请输入食材名称', 'warning');
            return;
        }
        
        if (isNaN(quantity) || quantity < 0) {
            NotificationManager.showToast('请输入有效的数量', 'warning');
            return;
        }
        
        if (!expiryDate) {
            NotificationManager.showToast('请选择过期日期', 'warning');
            return;
        }
        
        const foodData = {
            name,
            quantity,
            unit,
            expiryDate,
            category
        };
        
        if (this.editingItem) {
            // 编辑模式
            Storage.update(this.editingItem.id, foodData);
            NotificationManager.showToast('修改成功！', 'success');
        } else {
            // 添加模式
            Storage.add(foodData);
            NotificationManager.showToast('添加成功！', 'success');
        }
        
        this.closeModal();
        this.render();
    },
    
    /**
     * 关闭弹窗
     */
    closeModal() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.remove();
        }
        this.isModalOpen = false;
        this.editingItem = null;
    },
    
    /**
     * 消耗食材（数量减1）
     * @param {string} itemId - 食材ID
     */
    consumeItem(itemId) {
        const item = Storage.getById(itemId);
        if (!item) return;
        
        if (item.quantity <= 0) {
            NotificationManager.showToast('数量已经为0了', 'warning');
            return;
        }
        
        const newQuantity = item.quantity - 1;
        
        if (newQuantity === 0) {
            NotificationManager.showConfirm(`"${item.name}" 消耗完了，是否删除？`)
                .then((shouldDelete) => {
                    if (shouldDelete) {
                        Storage.remove(itemId);
                        NotificationManager.showToast(`已删除 "${item.name}"`, 'success');
                    } else {
                        Storage.update(itemId, { quantity: 0 });
                        NotificationManager.showToast(`"${item.name}" 数量已归零`, 'info');
                    }
                    this.render();
                });
        } else {
            Storage.update(itemId, { quantity: newQuantity });
            NotificationManager.showToast(`消耗了 1 ${item.unit} ${item.name}`, 'success');
            this.render();
        }
    },
    
    /**
     * 补充食材（数量加1）
     * @param {string} itemId - 食材ID
     */
    addQuantity(itemId) {
        const item = Storage.getById(itemId);
        if (!item) return;
        
        const newQuantity = item.quantity + 1;
        Storage.update(itemId, { quantity: newQuantity });
        NotificationManager.showToast(`补充了 1 ${item.unit} ${item.name}`, 'success');
        this.render();
    },
    
    /**
     * 删除食材
     * @param {string} itemId - 食材ID
     */
    deleteItem(itemId) {
        const item = Storage.getById(itemId);
        if (!item) return;
        
        NotificationManager.showConfirm(`确定要删除 "${item.name}" 吗？`)
            .then((confirmed) => {
                if (confirmed) {
                    Storage.remove(itemId);
                    NotificationManager.showToast(`已删除 "${item.name}"`, 'success');
                    this.render();
                }
            });
    },
    
    /**
     * 设置搜索关键词
     * @param {string} keyword - 搜索关键词
     */
    setSearchKeyword(keyword) {
        this.searchKeyword = keyword;
        this.render();
    },
    
    /**
     * 设置选中的分类
     * @param {string} category - 分类名称
     */
    setSelectedCategory(category) {
        this.selectedCategory = category;
        this.render();
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// 导出模块
window.App = App;
