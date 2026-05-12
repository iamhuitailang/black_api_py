const App = {
    data: {},
    currentTheme: 'thermal',
    
    init() {
        this.loadData();
        this.bindEvents();
        this.render();
        this.updateUI();
    },
    
    loadData() {
        this.data = Storage.load();
        Cart.init(
            this.data.items || [],
            this.data.taxRate || 0,
            this.data.cashReceived || 0
        );
        this.currentTheme = this.data.theme || 'thermal';
    },
    
    saveData() {
        const cartData = Cart.getData();
        const dataToSave = {
            shopName: this.data.shopName,
            shopPhone: this.data.shopPhone,
            shopAddress: this.data.shopAddress,
            cashier: this.data.cashier,
            items: cartData.items,
            taxRate: cartData.taxRate,
            cashReceived: cartData.cashReceived,
            theme: this.currentTheme
        };
        Storage.save(dataToSave);
        this.data = dataToSave;
    },
    
    bindEvents() {
        document.getElementById('addItemBtn').addEventListener('click', () => this.addItem());
        document.getElementById('itemName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addItem();
        });
        
        document.getElementById('taxRate').addEventListener('input', (e) => {
            Cart.setTaxRate(e.target.value);
            this.saveData();
            this.updateUI();
            this.render();
        });
        
        document.getElementById('cashReceived').addEventListener('input', (e) => {
            Cart.setCashReceived(e.target.value);
            this.saveData();
            this.updateUI();
            this.render();
        });
        
        ['shopName', 'shopPhone', 'shopAddress', 'cashier'].forEach(id => {
            document.getElementById(id).addEventListener('input', (e) => {
                this.data[id] = e.target.value;
                this.saveData();
                this.render();
            });
        });
        
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                this.setTheme(option.dataset.theme);
            });
        });
        
        document.getElementById('printBtn').addEventListener('click', () => this.print());
        document.getElementById('downloadBtn').addEventListener('click', () => this.download());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        
        document.getElementById('historyBtn').addEventListener('click', () => this.showHistory());
        document.getElementById('shareBtn').addEventListener('click', () => this.showShare());
        
        document.querySelectorAll('.modal .close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('show');
            });
        });
        
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        });
        
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const shareType = btn.dataset.share;
                if (shareType === 'copy') {
                    this.copyLink();
                } else if (shareType === 'download') {
                    this.download();
                }
                document.getElementById('shareModal').classList.remove('show');
            });
        });
    },
    
    addItem() {
        const nameInput = document.getElementById('itemName');
        const priceInput = document.getElementById('itemPrice');
        const qtyInput = document.getElementById('itemQty');
        
        const name = nameInput.value.trim();
        const price = parseFloat(priceInput.value);
        const quantity = parseInt(qtyInput.value) || 1;
        
        if (Cart.addItem(name, price, quantity)) {
            nameInput.value = '';
            priceInput.value = '';
            qtyInput.value = '1';
            nameInput.focus();
            
            this.saveData();
            this.updateUI();
            this.render();
        } else {
            alert('请输入有效的商品名称和单价！');
        }
    },
    
    removeItem(id) {
        Cart.removeItem(id);
        this.saveData();
        this.updateUI();
        this.render();
    },
    
    setTheme(theme) {
        this.currentTheme = theme;
        this.saveData();
        
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.toggle('active', option.dataset.theme === theme);
        });
        
        this.render();
    },
    
    updateUI() {
        document.getElementById('shopName').value = this.data.shopName || '';
        document.getElementById('shopPhone').value = this.data.shopPhone || '';
        document.getElementById('shopAddress').value = this.data.shopAddress || '';
        document.getElementById('cashier').value = this.data.cashier || '';
        document.getElementById('taxRate').value = Cart.taxRate;
        document.getElementById('cashReceived').value = Cart.cashReceived || '';
        
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.toggle('active', option.dataset.theme === this.currentTheme);
        });
        
        this.renderCartList();
        this.updateTotals();
    },
    
    renderCartList() {
        const cartList = document.getElementById('cartList');
        const items = Cart.getItems();
        
        if (items.length === 0) {
            cartList.innerHTML = '<div class="empty-cart">购物车为空</div>';
            return;
        }
        
        cartList.innerHTML = items.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-details">¥${item.price.toFixed(2)} × ${item.quantity}</div>
                </div>
                <div class="cart-item-price">¥${(item.price * item.quantity).toFixed(2)}</div>
                <button class="delete-btn" onclick="App.removeItem(${item.id})">×</button>
            </div>
        `).join('');
    },
    
    updateTotals() {
        const cartData = Cart.getData();
        document.getElementById('subtotal').textContent = `¥${cartData.subtotal.toFixed(2)}`;
        document.getElementById('taxAmount').textContent = `¥${cartData.taxAmount.toFixed(2)}`;
        document.getElementById('totalAmount').textContent = `¥${cartData.total.toFixed(2)}`;
        document.getElementById('changeAmount').textContent = `¥${cartData.change.toFixed(2)}`;
    },
    
    render() {
        const cartData = Cart.getData();
        const renderData = {
            shopName: this.data.shopName,
            shopPhone: this.data.shopPhone,
            shopAddress: this.data.shopAddress,
            cashier: this.data.cashier,
            items: cartData.items,
            subtotal: cartData.subtotal,
            taxRate: cartData.taxRate,
            taxAmount: cartData.taxAmount,
            total: cartData.total,
            cashReceived: cartData.cashReceived,
            change: cartData.change
        };
        
        Renderer.render(renderData, this.currentTheme);
    },
    
    print() {
        this.saveToHistory();
        
        const printWindow = window.open('', '_blank');
        const dataUrl = Renderer.toDataURL();
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>打印小票</title>
                <style>
                    body {
                        margin: 0;
                        padding: 20px;
                        display: flex;
                        justify-content: center;
                    }
                    img {
                        max-width: 100%;
                    }
                    @media print {
                        body {
                            padding: 0;
                        }
                    }
                </style>
            </head>
            <body>
                <img src="${dataUrl}" />
                <script>
                    window.onload = function() {
                        window.print();
                    };
                <\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
    },
    
    download() {
        this.saveToHistory();
        
        const link = document.createElement('a');
        link.download = `小票_${new Date().toLocaleDateString('zh-CN')}.png`;
        link.href = Renderer.toDataURL();
        link.click();
    },
    
    saveToHistory() {
        const cartData = Cart.getData();
        const historyData = {
            shopName: this.data.shopName,
            shopPhone: this.data.shopPhone,
            shopAddress: this.data.shopAddress,
            cashier: this.data.cashier,
            items: cartData.items,
            total: cartData.total
        };
        Storage.saveToHistory(historyData);
    },
    
    showHistory() {
        const history = Storage.getHistory();
        const historyList = document.getElementById('historyList');
        
        if (history.length === 0) {
            historyList.innerHTML = '<div class="empty-cart">暂无历史记录</div>';
        } else {
            historyList.innerHTML = history.map(item => `
                <div class="history-item" onclick="App.loadFromHistory(${item.id})">
                    <div class="history-item-header">
                        <span class="history-item-shop">${item.shopName}</span>
                        <span class="history-item-date">${item.date}</span>
                    </div>
                    <div class="history-item-total">总计: ¥${item.total.toFixed(2)}</div>
                </div>
            `).join('');
        }
        
        document.getElementById('historyModal').classList.add('show');
    },
    
    loadFromHistory(id) {
        const history = Storage.getHistory();
        const item = history.find(h => h.id === id);
        
        if (item) {
            this.data.shopName = item.shopName;
            this.data.shopPhone = item.shopPhone;
            this.data.shopAddress = item.shopAddress;
            this.data.cashier = item.cashier;
            Cart.init(item.items, 0, 0);
            
            this.saveData();
            this.updateUI();
            this.render();
            
            document.getElementById('historyModal').classList.remove('show');
        }
    },
    
    showShare() {
        document.getElementById('shareModal').classList.add('show');
    },
    
    copyLink() {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            alert('链接已复制到剪贴板！');
        }).catch(() => {
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('链接已复制到剪贴板！');
        });
    },
    
    clearAll() {
        if (confirm('确定要清空所有数据吗？')) {
            Cart.clear();
            this.saveData();
            this.updateUI();
            this.render();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Renderer.init('receiptCanvas');
    App.init();
});