/**
 * 员工系统模块
 * 负责员工的雇佣、升级和管理
 */

const EmployeeSystem = {
    /**
     * 雇佣员工
     * @param {string} employeeTypeId - 员工类型ID
     * @returns {boolean} 是否雇佣成功
     */
    hireEmployee(employeeTypeId) {
        const employeeType = CONFIG.EMPLOYEE_TYPES.find(t => t.id === employeeTypeId);
        
        if (!employeeType) {
            console.error(`找不到员工类型: ${employeeTypeId}`);
            return false;
        }
        
        // 检查员工数量上限
        const restaurantConfig = GameState.getRestaurantConfig();
        if (GameState.employees.length >= restaurantConfig.maxEmployees) {
            console.log(`员工数量已达上限: ${restaurantConfig.maxEmployees}`);
            return false;
        }
        
        // 检查金币
        if (GameState.gold < employeeType.basePrice) {
            console.log(`金币不足，需要 ${employeeType.basePrice} 金币`);
            return false;
        }
        
        // 扣除金币
        GameState.gold -= employeeType.basePrice;
        
        // 创建员工
        const employee = {
            id: GameState.nextEmployeeId++,
            type: employeeType.id,
            name: employeeType.name,
            level: 1,
            hireTime: Date.now()
        };
        
        GameState.employees.push(employee);
        
        console.log(`雇佣员工 ${employee.name} 成功，花费 ${employeeType.basePrice} 金币`);
        return true;
    },

    /**
     * 升级员工
     * @param {number} employeeId - 员工ID
     * @returns {boolean} 是否升级成功
     */
    upgradeEmployee(employeeId) {
        const employee = GameState.employees.find(e => e.id === employeeId);
        
        if (!employee) {
            console.error(`找不到员工: ${employeeId}`);
            return false;
        }
        
        const employeeType = CONFIG.EMPLOYEE_TYPES.find(t => t.id === employee.type);
        if (!employeeType) {
            console.error(`找不到员工类型: ${employee.type}`);
            return false;
        }
        
        if (employee.level >= employeeType.maxLevel) {
            console.log(`员工已达最高等级`);
            return false;
        }
        
        // 计算升级价格
        const levelConfig = CONFIG.EMPLOYEE_LEVELS[employee.level];
        const upgradePrice = Math.floor(employeeType.basePrice * levelConfig.priceMultiplier);
        
        if (GameState.gold < upgradePrice) {
            console.log(`金币不足，需要 ${upgradePrice} 金币`);
            return false;
        }
        
        // 扣除金币
        GameState.gold -= upgradePrice;
        employee.level++;
        
        console.log(`升级员工 ${employee.name} 到 ${employee.level} 级成功，花费 ${upgradePrice} 金币`);
        return true;
    },

    /**
     * 解雇员工
     * @param {number} employeeId - 员工ID
     * @returns {boolean} 是否解雇成功
     */
    fireEmployee(employeeId) {
        const employeeIndex = GameState.employees.findIndex(e => e.id === employeeId);
        
        if (employeeIndex === -1) {
            console.error(`找不到员工: ${employeeId}`);
            return false;
        }
        
        const employee = GameState.employees[employeeIndex];
        
        // 解雇没有补偿
        GameState.employees.splice(employeeIndex, 1);
        
        console.log(`解雇员工 ${employee.name} 成功`);
        return true;
    },

    /**
     * 获取员工的详细信息
     * @param {Object} employee - 员工对象
     * @returns {Object} 员工详细信息
     */
    getEmployeeDetails(employee) {
        const employeeType = CONFIG.EMPLOYEE_TYPES.find(t => t.id === employee.type);
        if (!employeeType) {
            return null;
        }
        
        const levelBonus = CONFIG.EMPLOYEE_LEVELS[employee.level - 1].effectBonus;
        
        return {
            ...employee,
            typeName: employeeType.name,
            type: employeeType.type,
            dailyWage: employeeType.dailyWage,
            cookSpeedBonus: employeeType.cookSpeedBonus + levelBonus * (employeeType.cookSpeedBonus > 0 ? 1 : 0),
            satisfactionBonus: employeeType.satisfactionBonus + levelBonus * (employeeType.satisfactionBonus > 0 ? 1 : 0),
            serveSpeedBonus: employeeType.serveSpeedBonus + levelBonus * (employeeType.serveSpeedBonus > 0 ? 1 : 0),
            nextUpgradePrice: this.getNextUpgradePrice(employee, employeeType)
        };
    },

    /**
     * 获取员工下一次升级价格
     * @param {Object} employee - 员工对象
     * @param {Object} employeeType - 员工类型配置
     * @returns {number|null} 升级价格
     */
    getNextUpgradePrice(employee, employeeType) {
        if (employee.level >= employeeType.maxLevel) {
            return null;
        }
        const levelConfig = CONFIG.EMPLOYEE_LEVELS[employee.level];
        return Math.floor(employeeType.basePrice * levelConfig.priceMultiplier);
    },

    /**
     * 获取所有员工的详细信息
     * @returns {Array} 员工详细信息列表
     */
    getAllEmployeesDetails() {
        return GameState.employees.map(e => this.getEmployeeDetails(e)).filter(e => e !== null);
    }
};

// 导出 EmployeeSystem 对象
window.EmployeeSystem = EmployeeSystem;