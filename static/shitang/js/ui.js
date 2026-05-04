/**
 * UI 交互模块
 * 负责处理用户界面的交互和面板管理
 */

const UI = {
    // 当前打开的面板
    currentPanel: null,
    
    // 自动保存定时器
    autoSaveTimer: null,

    /**
     * 初始化 UI
     */
    init() {
        this.setupEventListeners();
        this.updateStatusBar();
        
        // 启动自动保存（每30秒）
        this.autoSaveTimer = Storage.autoSave(GameState, 30000);
        
        console.log('UI 初始化完成');
    },

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 底部导航按钮
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const panel = btn.dataset.panel;
                this.handleNavClick(panel, btn);
            });
        });
        
        // 面板关闭按钮
        const closeBtns = document.querySelectorAll('.close-btn');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllPanels();
            });
        });
        
        // 点击面板外部关闭
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('panel')) {
                this.closeAllPanels();
            }
        });
    },

    /**
     * 处理导航点击
     * @param {string} panel - 面板名称
     * @param {HTMLElement} btn - 按钮元素
     */
    handleNavClick(panel, btn) {
        // 更新导航按钮状态
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // 关闭所有面板
        this.closeAllPanels();
        
        // 如果是游戏面板，不需要显示其他面板
        if (panel === 'game') {
            this.currentPanel = null;
            return;
        }
        
        // 打开对应面板
        this.openPanel(panel);
    },

    /**
     * 打开面板
     * @param {string} panelName - 面板名称
     */
    openPanel(panelName) {
        const panel = document.getElementById(`${panelName}-panel`);
        if (!panel) {
            console.error(`找不到面板: ${panelName}`);
            return;
        }
        
        // 更新面板内容
        this.updatePanelContent(panelName);
        
        // 显示面板
        panel.classList.remove('hidden');
        this.currentPanel = panelName;
    },

    /**
     * 关闭所有面板
     */
    closeAllPanels() {
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.add('hidden');
        });
        this.currentPanel = null;
        
        // 重置导航按钮
        document.querySelectorAll('.nav-btn').forEach(btn => {
            if (btn.dataset.panel === 'game') {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    },

    /**
     * 更新面板内容
     * @param {string} panelName - 面板名称
     */
    updatePanelContent(panelName) {
        switch (panelName) {
            case 'recipes':
                this.updateRecipesPanel();
                break;
            case 'employees':
                this.updateEmployeesPanel();
                break;
            case 'kitchenware':
                this.updateKitchenwarePanel();
                break;
            case 'upgrade':
                this.updateUpgradePanel();
                break;
        }
    },

    /**
     * 更新菜谱面板
     */
    updateRecipesPanel() {
        const container = document.getElementById('recipes-content');
        if (!container) return;
        
        let html = '';
        
        for (const recipe of GameState.recipes) {
            const isUnlocked = recipe.unlockLevel <= GameState.restaurantLevel;
            const price = RecipeSystem.getRecipePrice(recipe);
            const nextUpgradePrice = RecipeSystem.getNextUpgradePrice(recipe);
            const starsDisplay = RecipeSystem.getStarsDisplay(recipe.stars);
            
            html += `<div class="item-card ${recipe.owned ? '' : 'locked'}">
                <div class="item-header">
                    <span class="item-name">${recipe.name}</span>
                    <span class="item-stars">${starsDisplay}</span>
                </div>
                <div class="item-details">
                    <p>💰 售价: ${recipe.owned ? price : '?'} 金币</p>
                    <p>⏱️ 做菜时间: ${recipe.cookTime / 1000} 秒</p>
                    <p>🔓 解锁等级: ${recipe.unlockLevel} 级</p>
                </div>
                <div class="item-actions">`;
            
            if (!recipe.owned) {
                if (isUnlocked) {
                    const buyPrice = recipe.upgradePrices[1];
                    html += `<button class="btn btn-buy" data-recipe="${recipe.id}" data-action="buy">
                        购买 (${buyPrice} 金币)
                    </button>`;
                } else {
                    html += `<span class="locked-text">需要 ${recipe.unlockLevel} 级解锁</span>`;
                }
            } else if (nextUpgradePrice) {
                html += `<button class="btn btn-upgrade" data-recipe="${recipe.id}" data-action="upgrade">
                    升级 (${nextUpgradePrice} 金币)
                </button>`;
            } else {
                html += `<span class="max-text">已满级</span>`;
            }
            
            html += `</div></div>`;
        }
        
        container.innerHTML = html;
        
        // 绑定按钮事件
        this.bindRecipeButtons();
    },

    /**
     * 绑定菜谱按钮事件
     */
    bindRecipeButtons() {
        const buttons = document.querySelectorAll('#recipes-content .btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const recipeId = btn.dataset.recipe;
                const action = btn.dataset.action;
                
                let success = false;
                if (action === 'buy') {
                    success = RecipeSystem.buyRecipe(recipeId);
                    if (success) {
                        this.showToast(`购买菜谱成功！`);
                    } else {
                        this.showToast('金币不足！', 'error');
                    }
                } else if (action === 'upgrade') {
                    success = RecipeSystem.upgradeRecipe(recipeId);
                    if (success) {
                        this.showToast(`升级菜谱成功！`);
                    } else {
                        this.showToast('金币不足或已满级！', 'error');
                    }
                }
                
                if (success) {
                    this.updateRecipesPanel();
                    this.updateStatusBar();
                    GameState.save();
                }
            });
        });
    },

    /**
     * 更新员工面板
     */
    updateEmployeesPanel() {
        const container = document.getElementById('employees-content');
        if (!container) return;
        
        const restaurantInfo = RestaurantSystem.getRestaurantInfo();
        
        let html = `<div class="section-header">
            <h3>📊 当前员工 (${restaurantInfo.currentEmployees}/${restaurantInfo.maxEmployees})</h3>
        </div>`;
        
        // 显示已雇佣的员工
        if (GameState.employees.length > 0) {
            html += `<div class="current-employees">`;
            
            for (const emp of GameState.employees) {
                const empDetails = EmployeeSystem.getEmployeeDetails(emp);
                if (!empDetails) continue;
                
                html += `<div class="item-card">
                    <div class="item-header">
                        <span class="item-name">${empDetails.name}</span>
                        <span class="level-badge">Lv.${emp.level}</span>
                    </div>
                    <div class="item-details">
                        <p>💼 类型: ${this.getEmployeeTypeText(empDetails.type)}</p>
                        <p>💰 日薪: ${empDetails.dailyWage} 金币</p>`;
                
                if (empDetails.cookSpeedBonus > 0) {
                    html += `<p>⚡ 做菜速度: +${Math.floor(empDetails.cookSpeedBonus * 100)}%</p>`;
                }
                if (empDetails.satisfactionBonus > 0) {
                    html += `<p>😊 满意度: +${Math.floor(empDetails.satisfactionBonus * 100)}%</p>`;
                }
                if (empDetails.serveSpeedBonus > 0) {
                    html += `<p>🏃 上菜速度: +${Math.floor(empDetails.serveSpeedBonus * 100)}%</p>`;
                }
                
                html += `</div><div class="item-actions">`;
                
                if (empDetails.nextUpgradePrice) {
                    html += `<button class="btn btn-upgrade" data-employee="${emp.id}" data-action="upgrade">
                        升级 (${empDetails.nextUpgradePrice} 金币)
                    </button>`;
                } else {
                    html += `<span class="max-text">已满级</span>`;
                }
                
                html += `<button class="btn btn-danger" data-employee="${emp.id}" data-action="fire">
                    解雇
                </button></div></div>`;
            }
            
            html += `</div>`;
        } else {
            html += `<div class="empty-text">暂无员工，快去雇佣吧！</div>`;
        }
        
        // 显示可雇佣的员工类型
        html += `<div class="section-header">
            <h3>👥 可雇佣员工</h3>
        </div><div class="available-employees">`;
        
        for (const empType of CONFIG.EMPLOYEE_TYPES) {
            html += `<div class="item-card">
                <div class="item-header">
                    <span class="item-name">${empType.name}</span>
                </div>
                <div class="item-details">
                    <p>💼 类型: ${this.getEmployeeTypeText(empType.type)}</p>
                    <p>💰 日薪: ${empType.dailyWage} 金币</p>`;
            
            if (empType.cookSpeedBonus > 0) {
                html += `<p>⚡ 做菜速度: +${Math.floor(empType.cookSpeedBonus * 100)}%</p>`;
            }
            if (empType.satisfactionBonus > 0) {
                html += `<p>😊 满意度: +${Math.floor(empType.satisfactionBonus * 100)}%</p>`;
            }
            if (empType.serveSpeedBonus > 0) {
                html += `<p>🏃 上菜速度: +${Math.floor(empType.serveSpeedBonus * 100)}%</p>`;
            }
            
            html += `</div><div class="item-actions">
                <button class="btn btn-hire" data-emp-type="${empType.id}">
                    雇佣 (${empType.basePrice} 金币)
                </button>
            </div></div>`;
        }
        
        html += `</div>`;
        container.innerHTML = html;
        
        // 绑定按钮事件
        this.bindEmployeeButtons();
    },

    /**
     * 获取员工类型文本
     * @param {string} type - 类型
     * @returns {string} 文本
     */
    getEmployeeTypeText(type) {
        const typeMap = {
            'chef': '厨师',
            'waiter': '服务员',
            'cleaner': '清洁工'
        };
        return typeMap[type] || type;
    },

    /**
     * 绑定员工按钮事件
     */
    bindEmployeeButtons() {
        // 雇佣按钮
        const hireBtns = document.querySelectorAll('#employees-content .btn-hire');
        hireBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const empTypeId = btn.dataset.empType;
                const success = EmployeeSystem.hireEmployee(empTypeId);
                
                if (success) {
                    this.showToast('雇佣员工成功！');
                } else {
                    this.showToast('金币不足或员工数量已满！', 'error');
                }
                
                if (success) {
                    this.updateEmployeesPanel();
                    this.updateStatusBar();
                    GameState.save();
                }
            });
        });
        
        // 升级和解雇按钮
        const actionBtns = document.querySelectorAll('#employees-content .btn-upgrade, #employees-content .btn-danger');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const empId = parseInt(btn.dataset.employee);
                const action = btn.dataset.action;
                
                let success = false;
                if (action === 'upgrade') {
                    success = EmployeeSystem.upgradeEmployee(empId);
                    if (success) {
                        this.showToast('升级员工成功！');
                    } else {
                        this.showToast('金币不足或已满级！', 'error');
                    }
                } else if (action === 'fire') {
                    success = EmployeeSystem.fireEmployee(empId);
                    if (success) {
                        this.showToast('解雇员工成功！');
                    }
                }
                
                if (success) {
                    this.updateEmployeesPanel();
                    this.updateStatusBar();
                    GameState.save();
                }
            });
        });
    },

    /**
     * 更新厨具面板
     */
    updateKitchenwarePanel() {
        const container = document.getElementById('kitchenware-content');
        if (!container) return;
        
        const bestKitchenware = KitchenwareSystem.getBestKitchenware();
        
        let html = `<div class="section-header">
            <h3>🍳 当前使用: ${bestKitchenware.name}</h3>
            <p>效果: 做菜时间 -${Math.floor(bestKitchenware.cookTimeReduction * 100)}%</p>
        </div>`;
        
        html += `<div class="kitchenware-list">`;
        
        for (const kw of GameState.kitchenwares) {
            const isUnlocked = kw.unlockLevel <= GameState.restaurantLevel;
            
            html += `<div class="item-card ${kw.owned ? '' : 'locked'}">
                <div class="item-header">
                    <span class="item-name">${kw.name}</span>
                    ${kw.owned ? '<span class="owned-badge">已拥有</span>' : ''}
                </div>
                <div class="item-details">
                    <p>⚡ 效果: 做菜时间 -${Math.floor(kw.cookTimeReduction * 100)}%</p>
                    <p>🔓 解锁等级: ${kw.unlockLevel} 级</p>
                </div>
                <div class="item-actions">`;
            
            if (!kw.owned) {
                if (isUnlocked) {
                    html += `<button class="btn btn-buy" data-kitchenware="${kw.id}">
                        购买 (${kw.price} 金币)
                    </button>`;
                } else {
                    html += `<span class="locked-text">需要 ${kw.unlockLevel} 级解锁</span>`;
                }
            } else {
                html += `<span class="owned-text">已装备</span>`;
            }
            
            html += `</div></div>`;
        }
        
        html += `</div>`;
        container.innerHTML = html;
        
        // 绑定按钮事件
        this.bindKitchenwareButtons();
    },

    /**
     * 绑定厨具按钮事件
     */
    bindKitchenwareButtons() {
        const buttons = document.querySelectorAll('#kitchenware-content .btn-buy');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const kwId = btn.dataset.kitchenware;
                const success = KitchenwareSystem.buyKitchenware(kwId);
                
                if (success) {
                    this.showToast('购买厨具成功！');
                } else {
                    this.showToast('金币不足！', 'error');
                }
                
                if (success) {
                    this.updateKitchenwarePanel();
                    this.updateStatusBar();
                    GameState.save();
                }
            });
        });
    },

    /**
     * 更新升级面板
     */
    updateUpgradePanel() {
        const container = document.getElementById('upgrade-content');
        if (!container) return;
        
        const restaurantInfo = RestaurantSystem.getRestaurantInfo();
        const nextUpgradePrice = RestaurantSystem.getNextUpgradePrice();
        
        let html = `<div class="restaurant-info">
            <h2>${restaurantInfo.name}</h2>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">当前等级</span>
                    <span class="info-value">${restaurantInfo.level} 级</span>
                </div>
                <div class="info-item">
                    <span class="info-label">座位数</span>
                    <span class="info-value">${restaurantInfo.seats} 个</span>
                </div>
                <div class="info-item">
                    <span class="info-label">员工上限</span>
                    <span class="info-value">${restaurantInfo.maxEmployees} 人</span>
                </div>
            </div>
        </div>`;
        
        // 显示下一级信息
        if (nextUpgradePrice) {
            const nextLevelConfig = CONFIG.RESTAURANT_LEVELS[GameState.restaurantLevel];
            
            html += `<div class="upgrade-preview">
                <h3>⬆️ 升级预览</h3>
                <div class="preview-content">
                    <p>下一级: <strong>${nextLevelConfig.name}</strong></p>
                    <p>座位数: ${restaurantInfo.seats} → ${nextLevelConfig.seats}</p>
                    <p>员工上限: ${restaurantInfo.maxEmployees} → ${nextLevelConfig.maxEmployees}</p>
                    <p>解锁菜谱: ${nextLevelConfig.unlockedRecipes.join(', ')}</p>
                </div>
                <button class="btn btn-upgrade btn-large" id="upgrade-restaurant-btn">
                    升级餐厅 (${nextUpgradePrice} 金币)
                </button>
            </div>`;
        } else {
            html += `<div class="max-level">
                <h3>🎉 恭喜！已达最高等级</h3>
                <p>你的餐厅已经是米其林星级餐厅了！</p>
            </div>`;
        }
        
        // 显示当前属性加成
        const currentConfig = GameState.getRestaurantConfig();
        html += `<div class="stats-section">
            <h3>📊 当前属性加成</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-icon">👥</span>
                    <span class="stat-label">客流量</span>
                    <span class="stat-value">+${Math.floor(currentConfig.customerFlowBonus * 100)}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">⏰</span>
                    <span class="stat-label">客人耐心</span>
                    <span class="stat-value">+${currentConfig.patienceBonus / 1000}秒</span>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">😊</span>
                    <span class="stat-label">基础满意度</span>
                    <span class="stat-value">+${Math.floor(currentConfig.satisfactionBonus * 100)}%</span>
                </div>
            </div>
        </div>`;
        
        container.innerHTML = html;
        
        // 绑定升级按钮
        const upgradeBtn = document.getElementById('upgrade-restaurant-btn');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => {
                const success = RestaurantSystem.upgradeRestaurant();
                if (success) {
                    this.showToast('餐厅升级成功！');
                    this.updateUpgradePanel();
                    this.updateStatusBar();
                    // 重新初始化位置
                    Renderer.updatePositions();
                    GameState.save();
                } else {
                    this.showToast('金币不足或已达最高等级！', 'error');
                }
            });
        }
    },

    /**
     * 更新状态栏
     */
    updateStatusBar() {
        const goldDisplay = document.getElementById('gold-display');
        const repDisplay = document.getElementById('reputation-display');
        const satDisplay = document.getElementById('satisfaction-display');
        const levelDisplay = document.getElementById('level-display');
        
        if (goldDisplay) goldDisplay.textContent = Math.floor(GameState.gold);
        if (repDisplay) repDisplay.textContent = GameState.reputation;
        if (satDisplay) satDisplay.textContent = `${Math.floor(GameState.satisfaction * 100)}%`;
        if (levelDisplay) levelDisplay.textContent = GameState.restaurantLevel;
    },

    /**
     * 显示提示框
     * @param {string} message - 消息
     * @param {string} type - 类型 (success, error)
     */
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        toast.textContent = message;
        toast.className = `toast toast-${type}`;
        
        // 显示
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // 3秒后隐藏
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
};

// 导出 UI 对象
window.UI = UI;