const ShopPage = {
    props: [],
    loading: true,

    render() {
        const app = document.getElementById('app')
        app.innerHTML = `
            <div class="page has-header">
                <div class="header">
                    <div class="header-title">🛒 道具商店</div>
                </div>
                <div class="shop-notice">
                    💡 道具可以在游戏中使用，助你轻松通关！
                </div>
                <div class="shop-list" id="shopList">
                    <div class="loading-state"><div class="loading-spinner"></div></div>
                </div>
                <div class="tabbar">
                    <div class="tabbar-item" onclick="Router.navigate('home')">
                        <div class="tabbar-icon">🏠</div>
                        <div class="tabbar-text">首页</div>
                    </div>
                    <div class="tabbar-item" onclick="Router.navigate('leaderboard')">
                        <div class="tabbar-icon">🏆</div>
                        <div class="tabbar-text">排行</div>
                    </div>
                    <div class="tabbar-item active" onclick="Router.navigate('shop')">
                        <div class="tabbar-icon">🛒</div>
                        <div class="tabbar-text">商店</div>
                    </div>
                    <div class="tabbar-item" onclick="Router.navigate('profile')">
                        <div class="tabbar-icon">👤</div>
                        <div class="tabbar-text">我的</div>
                    </div>
                </div>
            </div>
        `
        this.loadProps()
    },

    async loadProps() {
        try {
            const result = await GameService.getProps()
            if (result.code === 0 && result.data) {
                this.props = result.data
                this.renderProps()
            } else {
                document.getElementById('shopList').innerHTML =
                    '<div class="empty-state"><div class="empty-state-icon">🎒</div><div class="empty-state-text">暂无道具</div></div>'
            }
        } catch (error) {
            document.getElementById('shopList').innerHTML =
                '<div class="empty-state"><div class="empty-state-icon">😢</div><div class="empty-state-text">加载失败</div></div>'
        }
    },

    renderProps() {
        const list = document.getElementById('shopList')
        if (this.props.length === 0) {
            list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎒</div><div class="empty-state-text">暂无道具</div></div>'
            return
        }
        list.innerHTML = this.props.map(prop => `
            <div class="shop-item">
                <div class="shop-icon">${prop.icon}</div>
                <div class="shop-info">
                    <div class="shop-name">${prop.name}</div>
                    <div class="shop-desc">${prop.description}</div>
                </div>
                <div class="shop-price">
                    <div class="price-value">🪙 ${prop.price || '免费'}</div>
                    <button class="btn btn-sm btn-primary" onclick="ShopPage.buyProp(${prop.id})">购买</button>
                </div>
            </div>
        `).join('')
    },

    async buyProp(propId) {
        const btn = event.target
        btn.disabled = true
        btn.textContent = '购买中...'
        try {
            const result = await GameService.buyProp(propId, 1)
            if (result.code === 0) {
                Toast.success('购买成功！')
            } else {
                Toast.error(result.msg || '购买失败')
            }
        } catch (error) {
            Toast.error('购买失败')
        } finally {
            btn.disabled = false
            btn.textContent = '购买'
        }
    }
}
