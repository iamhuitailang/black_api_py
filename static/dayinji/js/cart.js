const Cart = {
    items: [],
    taxRate: 0,
    cashReceived: 0,
    
    init(items = [], taxRate = 0, cashReceived = 0) {
        this.items = items;
        this.taxRate = parseFloat(taxRate) || 0;
        this.cashReceived = parseFloat(cashReceived) || 0;
    },
    
    addItem(name, price, quantity = 1) {
        if (!name || !price || price <= 0) {
            return false;
        }
        
        const item = {
            id: Date.now(),
            name: String(name).trim(),
            price: parseFloat(price),
            quantity: parseInt(quantity) || 1
        };
        
        this.items.push(item);
        return item;
    },
    
    removeItem(id) {
        const index = this.items.findIndex(item => item.id === id);
        if (index > -1) {
            this.items.splice(index, 1);
            return true;
        }
        return false;
    },
    
    clear() {
        this.items = [];
        this.taxRate = 0;
        this.cashReceived = 0;
    },
    
    getSubtotal() {
        return this.items.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);
    },
    
    getTaxAmount() {
        const subtotal = this.getSubtotal();
        return subtotal * (this.taxRate / 100);
    },
    
    getTotal() {
        return this.getSubtotal() + this.getTaxAmount();
    },
    
    getChange() {
        const total = this.getTotal();
        if (this.cashReceived >= total) {
            return this.cashReceived - total;
        }
        return 0;
    },
    
    setTaxRate(rate) {
        this.taxRate = Math.max(0, Math.min(100, parseFloat(rate) || 0));
    },
    
    setCashReceived(amount) {
        this.cashReceived = Math.max(0, parseFloat(amount) || 0);
    },
    
    getItems() {
        return [...this.items];
    },
    
    formatPrice(price) {
        return '¥' + price.toFixed(2);
    },
    
    getData() {
        return {
            items: [...this.items],
            taxRate: this.taxRate,
            cashReceived: this.cashReceived,
            subtotal: this.getSubtotal(),
            taxAmount: this.getTaxAmount(),
            total: this.getTotal(),
            change: this.getChange()
        };
    }
};