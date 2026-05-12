const Renderer = {
    canvas: null,
    ctx: null,
    width: 320,
    lineHeight: 20,
    padding: 20,
    
    themes: {
        thermal: {
            bgColor: '#f5f5dc',
            bgGradient: ['#f5f5dc', '#faf0e6', '#f5deb3'],
            textColor: '#1a1a1a',
            borderColor: '#8b7355',
            accentColor: '#8b4513'
        },
        supermarket: {
            bgColor: '#e6f3ff',
            bgGradient: ['#e6f3ff', '#b3d9ff', '#99ccff'],
            textColor: '#1a3a5c',
            borderColor: '#4a90d9',
            accentColor: '#2c5aa0'
        },
        cafe: {
            bgColor: '#fff5e6',
            bgGradient: ['#fff5e6', '#e6ccb3', '#d9b38c'],
            textColor: '#4a3728',
            borderColor: '#8b5a2b',
            accentColor: '#654321'
        }
    },
    
    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.ctx.textBaseline = 'top';
    },
    
    render(data, theme = 'thermal') {
        const themeConfig = this.themes[theme] || this.themes.thermal;
        const contentHeight = this.calculateHeight(data);
        
        this.canvas.width = this.width;
        this.canvas.height = contentHeight;
        
        this.ctx = this.canvas.getContext('2d');
        this.ctx.textBaseline = 'top';
        
        this.drawBackground(themeConfig);
        this.drawPaperTexture();
        this.drawContent(data, themeConfig);
        this.drawDashedBorder(themeConfig);
        this.drawScissors(themeConfig);
    },
    
    calculateHeight(data) {
        let height = this.padding * 2;
        
        height += this.lineHeight * 1.5;
        height += this.lineHeight;
        height += this.lineHeight;
        height += this.lineHeight;
        height += this.lineHeight * 1.5;
        
        height += this.lineHeight * 0.5;
        
        height += this.lineHeight * 0.8;
        
        data.items.forEach(() => {
            height += this.lineHeight * 0.9;
        });
        
        height += this.lineHeight * 0.5;
        
        height += this.lineHeight * 0.8;
        height += this.lineHeight * 0.8;
        height += this.lineHeight * 1.1;
        
        height += this.lineHeight * 0.5;
        
        if (data.cashReceived > 0) {
            height += this.lineHeight * 0.8;
            height += this.lineHeight * 0.8;
        }
        
        height += this.lineHeight * 1.5;
        height += this.lineHeight;
        height += this.lineHeight * 1.5;
        height += this.lineHeight;
        height += this.padding;
        
        return height;
    },
    
    drawBackground(theme) {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        theme.bgGradient.forEach((color, index) => {
            gradient.addColorStop(index / (theme.bgGradient.length - 1), color);
        });
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },
    
    drawPaperTexture() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 10;
            data[i] = Math.min(255, Math.max(0, data[i] + noise));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        }
        
        this.ctx.putImageData(imageData, 0, 0);
        
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const radius = Math.random() * 2;
            const opacity = Math.random() * 0.05;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(139, 115, 85, ${opacity})`;
            this.ctx.fill();
        }
    },
    
    drawContent(data, theme) {
        let y = this.padding;
        
        this.ctx.fillStyle = theme.textColor;
        this.ctx.font = 'bold 20px "Courier New", monospace';
        this.drawCenteredText(data.shopName || '', y);
        y += this.lineHeight * 1.5;
        
        this.ctx.font = '12px "Courier New", monospace';
        this.drawCenteredText(`电话: ${data.shopPhone || ''}`, y);
        y += this.lineHeight;
        this.drawCenteredText(`地址: ${data.shopAddress || ''}`, y);
        y += this.lineHeight;
        this.drawCenteredText(`收银员: ${data.cashier || ''}`, y);
        y += this.lineHeight;
        this.drawCenteredText(new Date().toLocaleString('zh-CN'), y);
        y += this.lineHeight * 1.5;
        
        this.drawStarLine(y, theme);
        y += this.lineHeight * 0.5;
        
        this.ctx.font = 'bold 13px "Courier New", monospace';
        this.drawHeaderLine(y, theme);
        y += this.lineHeight * 0.8;
        
        this.ctx.font = '12px "Courier New", monospace';
        data.items.forEach(item => {
            const itemTotal = (item.price * item.quantity).toFixed(2);
            this.drawItemLine(item.name, item.price.toFixed(2), item.quantity, itemTotal, y, theme);
            y += this.lineHeight * 0.9;
        });
        
        y += this.lineHeight * 0.5;
        this.drawDashedLine(y, theme);
        y += this.lineHeight * 0.5;
        
        this.ctx.font = '12px "Courier New", monospace';
        this.drawTwoColumnText('小计:', `¥${data.subtotal.toFixed(2)}`, y, theme);
        y += this.lineHeight * 0.8;
        
        if (data.taxRate > 0) {
            this.drawTwoColumnText(`税费(${data.taxRate}%):`, `¥${data.taxAmount.toFixed(2)}`, y, theme);
            y += this.lineHeight * 0.8;
        }
        
        this.ctx.font = 'bold 16px "Courier New", monospace';
        this.ctx.fillStyle = theme.accentColor;
        this.drawTwoColumnText('总计:', `¥${data.total.toFixed(2)}`, y, theme);
        this.ctx.fillStyle = theme.textColor;
        y += this.lineHeight * 1.2;
        
        if (data.cashReceived > 0) {
            this.ctx.font = '12px "Courier New", monospace';
            this.drawTwoColumnText('收款:', `¥${data.cashReceived.toFixed(2)}`, y, theme);
            y += this.lineHeight * 0.8;
            this.drawTwoColumnText('找零:', `¥${data.change.toFixed(2)}`, y, theme);
            y += this.lineHeight * 0.8;
        }
        
        y += this.lineHeight * 0.5;
        this.drawStarLine(y, theme);
        y += this.lineHeight * 1.5;
        
        this.ctx.font = '14px "Courier New", monospace';
        this.drawCenteredText('谢谢惠顾，欢迎下次光临！', y);
        y += this.lineHeight;
        this.drawCenteredText('★ 复古收银系统 ★', y);
    },
    
    drawCenteredText(text, y) {
        const maxWidth = this.canvas.width - this.padding * 2;
        let displayText = text;
        let textWidth = this.ctx.measureText(text).width;
        
        if (textWidth > maxWidth) {
            let maxChars = text.length;
            while (maxChars > 0 && this.ctx.measureText(text.substring(0, maxChars) + '...').width > maxWidth) {
                maxChars--;
            }
            displayText = text.substring(0, maxChars) + '...';
            textWidth = this.ctx.measureText(displayText).width;
        }
        
        const x = (this.canvas.width - textWidth) / 2;
        this.ctx.fillText(displayText, x, y);
    },
    
    drawTwoColumnText(leftText, rightText, y, theme) {
        const leftX = this.padding;
        const rightX = this.canvas.width - this.padding - this.ctx.measureText(rightText).width;
        this.ctx.fillText(leftText, leftX, y);
        this.ctx.fillText(rightText, rightX, y);
    },
    
    drawHeaderLine(y, theme) {
        const leftX = this.padding;
        const canvasWidth = this.canvas.width;
        
        const totalStr = '小计';
        const qtyStr = '数量';
        const priceStr = '单价';
        
        const totalWidth = this.ctx.measureText(totalStr).width;
        const qtyWidth = this.ctx.measureText(qtyStr).width;
        const priceWidth = this.ctx.measureText(priceStr).width;
        const spacing = 6;
        
        const totalX = canvasWidth - this.padding - totalWidth;
        const qtyX = totalX - spacing - qtyWidth;
        const priceX = qtyX - spacing - priceWidth;
        
        this.ctx.fillText('商品', leftX, y);
        this.ctx.fillText(priceStr, priceX, y);
        this.ctx.fillText(qtyStr, qtyX, y);
        this.ctx.fillText(totalStr, totalX, y);
    },
    
    drawItemLine(name, price, quantity, total, y, theme) {
        const leftX = this.padding;
        const canvasWidth = this.canvas.width;
        
        const totalStr = total;
        const qtyStr = String(quantity);
        const priceStr = price;
        
        const totalWidth = this.ctx.measureText(totalStr).width;
        const qtyWidth = this.ctx.measureText(qtyStr).width;
        const priceWidth = this.ctx.measureText(priceStr).width;
        const spacing = 6;
        
        const totalX = canvasWidth - this.padding - totalWidth;
        const qtyX = totalX - spacing - qtyWidth;
        const priceX = qtyX - spacing - priceWidth;
        const nameEndX = priceX - spacing;
        
        const maxNameWidth = nameEndX - leftX;
        
        let displayName = name;
        let charCount = name.length;
        
        while (this.ctx.measureText(displayName).width > maxNameWidth && charCount > 2) {
            charCount--;
            displayName = name.substring(0, charCount) + '...';
        }
        
        this.ctx.fillText(displayName, leftX, y);
        this.ctx.fillText(priceStr, priceX, y);
        this.ctx.fillText(qtyStr, qtyX, y);
        this.ctx.fillText(totalStr, totalX, y);
    },
    
    drawStarLine(y, theme) {
        this.ctx.fillStyle = theme.accentColor;
        this.ctx.font = '12px "Courier New", monospace';
        const stars = '★'.repeat(18);
        this.drawCenteredText(stars, y);
        this.ctx.fillStyle = theme.textColor;
    },
    
    drawDashedLine(y, theme) {
        this.ctx.strokeStyle = theme.borderColor;
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 3]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.padding, y);
        this.ctx.lineTo(this.canvas.width - this.padding, y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    },
    
    drawDashedBorder(theme) {
        this.ctx.strokeStyle = theme.borderColor;
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 3]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(5, 10);
        this.ctx.lineTo(this.canvas.width - 5, 10);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(5, this.canvas.height - 10);
        this.ctx.lineTo(this.canvas.width - 5, this.canvas.height - 10);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
    },
    
    drawScissors(theme) {
        const y = this.canvas.height - 25;
        const x = this.canvas.width / 2;
        
        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = theme.accentColor;
        this.ctx.fillText('✂', x - 8, y);
        
        this.ctx.strokeStyle = theme.borderColor;
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([3, 2]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.padding, y + 8);
        this.ctx.lineTo(x - 15, y + 8);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(x + 15, y + 8);
        this.ctx.lineTo(this.canvas.width - this.padding, y + 8);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
    },
    
    toDataURL() {
        return this.canvas.toDataURL('image/png');
    }
};