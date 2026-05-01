export const imageTemplates = {
    simple: {
        name: '简约经典',
        bgGradient: ['#667eea', '#764ba2'],
        textColor: '#ffffff',
        accentColor: '#ffd93d',
        font: 'PingFang SC, Microsoft YaHei, sans-serif',
        decorations: true
    },
    warm: {
        name: '温馨暖阳',
        bgGradient: ['#ff9a9e', '#fecfef'],
        textColor: '#333333',
        accentColor: '#e74c3c',
        font: 'PingFang SC, Microsoft YaHei, sans-serif',
        decorations: true
    },
    dark: {
        name: '深邃夜空',
        bgGradient: ['#2c3e50', '#4a69bd'],
        textColor: '#ffffff',
        accentColor: '#f39c12',
        font: 'PingFang SC, Microsoft YaHei, sans-serif',
        decorations: true
    },
    nature: {
        name: '自然清新',
        bgGradient: ['#11998e', '#38ef7d'],
        textColor: '#ffffff',
        accentColor: '#ffeb3b',
        font: 'PingFang SC, Microsoft YaHei, sans-serif',
        decorations: true
    },
    ocean: {
        name: '碧海蓝天',
        bgGradient: ['#00c6ff', '#0072ff'],
        textColor: '#ffffff',
        accentColor: '#ff6b6b',
        font: 'PingFang SC, Microsoft YaHei, sans-serif',
        decorations: true
    },
    sunset: {
        name: '落日余晖',
        bgGradient: ['#fa709a', '#fee140'],
        textColor: '#333333',
        accentColor: '#e74c3c',
        font: 'PingFang SC, Microsoft YaHei, sans-serif',
        decorations: true
    }
};

class ImageGenerator {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = 800;
        this.height = 600;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }
    
    drawBackground(template) {
        const ctx = this.ctx;
        const { bgGradient } = template;
        
        const gradient = ctx.createLinearGradient(0, 0, this.width, this.height);
        gradient.addColorStop(0, bgGradient[0]);
        gradient.addColorStop(1, bgGradient[1]);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
        
        if (template.decorations) {
            this.drawDecorations(template);
        }
    }
    
    drawDecorations(template) {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#ffffff';
        
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            const radius = Math.random() * 80 + 20;
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
        
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            const startX = Math.random() * this.width;
            const startY = Math.random() * this.height;
            const endX = startX + (Math.random() - 0.5) * 200;
            const endY = startY + (Math.random() - 0.5) * 200;
            
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    wrapText(text, maxWidth, lineHeight) {
        const words = text.split('');
        const lines = [];
        let currentLine = '';
        
        for (let i = 0; i < words.length; i++) {
            const testLine = currentLine + words[i];
            const metrics = this.ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && i > 0) {
                lines.push(currentLine);
                currentLine = words[i];
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines;
    }
    
    drawText(slogan, keywords, styleName, template) {
        const ctx = this.ctx;
        const { textColor, accentColor, font } = template;
        
        ctx.textAlign = 'center';
        
        const contentMaxWidth = this.width * 0.8;
        
        ctx.font = `bold 48px ${font}`;
        const lines = this.wrapText(slogan, contentMaxWidth, 70);
        const lineHeight = 70;
        const totalTextHeight = lines.length * lineHeight;
        
        const startY = (this.height - totalTextHeight - 100) / 2;
        
        lines.forEach((line, index) => {
            const y = startY + index * lineHeight;
            
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            
            ctx.fillStyle = textColor;
            ctx.fillText(line, this.width / 2, y);
            
            ctx.restore();
        });
        
        ctx.save();
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        const quoteY = startY - 60;
        
        ctx.font = `bold 80px ${font}`;
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = 0.3;
        ctx.fillText('"', this.width / 2 - 300, quoteY);
        ctx.fillText('"', this.width / 2 + 300, quoteY);
        
        ctx.restore();
        
        const infoY = startY + totalTextHeight + 40;
        
        ctx.save();
        ctx.font = `20px ${font}`;
        ctx.fillStyle = textColor;
        ctx.globalAlpha = 0.7;
        
        if (keywords) {
            ctx.fillText(`关键词: ${keywords}`, this.width / 2, infoY);
        }
        
        if (styleName) {
            ctx.fillText(`风格: ${styleName}`, this.width / 2, infoY + 35);
        }
        
        ctx.restore();
        
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.font = `16px ${font}`;
        ctx.fillStyle = textColor;
        ctx.fillText('名言生成器 | Created with ❤️', this.width / 2, this.height - 40);
        ctx.restore();
    }
    
    generate(slogan, options = {}) {
        const {
            keywords = '',
            styleName = '',
            templateKey = 'simple'
        } = options;
        
        const template = imageTemplates[templateKey] || imageTemplates.simple;
        
        this.drawBackground(template);
        
        this.drawText(slogan, keywords, styleName, template);
        
        return this.canvas.toDataURL('image/png');
    }
    
    generateMultiple(slogans, options = {}) {
        const images = [];
        
        slogans.forEach(slogan => {
            const dataUrl = this.generate(slogan.text, {
                keywords: slogan.keywords || '',
                styleName: slogan.style || '',
                templateKey: options.templateKey || 'simple'
            });
            
            images.push({
                text: slogan.text,
                keywords: slogan.keywords,
                style: slogan.style,
                dataUrl: dataUrl
            });
        });
        
        return images;
    }
    
    download(dataUrl, filename = 'slogan.png') {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

export const imageGenerator = new ImageGenerator();
