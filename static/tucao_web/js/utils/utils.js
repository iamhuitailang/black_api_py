const Utils = {
    formatTime(time) {
        if (!time) return '';
        const date = new Date(time);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) {
            return '刚刚';
        } else if (diff < 3600000) {
            return Math.floor(diff / 60000) + '分钟前';
        } else if (diff < 86400000) {
            return Math.floor(diff / 3600000) + '小时前';
        } else if (diff < 604800000) {
            return Math.floor(diff / 86400000) + '天前';
        } else {
            return `${date.getMonth() + 1}/${date.getDate()}`;
        }
    },

    maskAnonymousId(id) {
        if (!id || id.length <= 4) return id;
        return id.substr(0, 2) + '***' + id.substr(-2);
    },

    playTypeSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'square';
            gainNode.gain.value = 0.1;
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.05);
        } catch (e) {
            console.log('Type sound not supported');
        }
    },

    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                Toast.success('已复制到剪贴板');
            }).catch(() => {
                this.fallbackCopy(text);
            });
        } else {
            this.fallbackCopy(text);
        }
    },

    fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            Toast.success('已复制到剪贴板');
        } catch (e) {
            Toast.error('复制失败');
        }
        
        document.body.removeChild(textarea);
    },

    generateShareCard(post) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const width = 400;
        const height = 650;
        canvas.width = width;
        canvas.height = height;
        
        const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
        bgGradient.addColorStop(0, '#0a0a12');
        bgGradient.addColorStop(0.5, '#0f0f1a');
        bgGradient.addColorStop(1, '#050508');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);
        
        const radialGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
        radialGradient.addColorStop(0, 'rgba(0, 255, 163, 0.03)');
        radialGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radialGradient;
        ctx.fillRect(0, 0, width, height);
        
        const topBarGradient = ctx.createLinearGradient(0, 0, width, 0);
        topBarGradient.addColorStop(0, 'rgba(255, 0, 255, 0.3)');
        topBarGradient.addColorStop(0.25, 'rgba(184, 41, 221, 0.25)');
        topBarGradient.addColorStop(0.5, 'rgba(0, 229, 255, 0.3)');
        topBarGradient.addColorStop(0.75, 'rgba(0, 255, 163, 0.3)');
        topBarGradient.addColorStop(1, 'rgba(0, 229, 255, 0.3)');
        ctx.fillStyle = topBarGradient;
        ctx.fillRect(0, 0, width, 3);
        
        const bottomGradient = ctx.createLinearGradient(0, height - 80, 0, height);
        bottomGradient.addColorStop(0, 'rgba(0, 255, 163, 0)');
        bottomGradient.addColorStop(1, 'rgba(0, 255, 163, 0.06)');
        ctx.fillStyle = bottomGradient;
        ctx.fillRect(0, height - 80, width, 80);
        
        ctx.shadowColor = '#00ffa3';
        ctx.shadowBlur = 30;
        ctx.strokeStyle = 'rgba(0, 255, 163, 0.5)';
        ctx.lineWidth = 2;
        this.roundRect(ctx, 20, 20, width - 40, height - 40, 16);
        ctx.stroke();
        
        ctx.shadowColor = 'rgba(0, 229, 255, 0.3)';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.2)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, 24, 24, width - 48, height - 48, 14);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        ctx.font = 'bold 32px "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
        ctx.textAlign = 'center';
        
        ctx.shadowColor = '#00ffa3';
        ctx.shadowBlur = 25;
        ctx.fillStyle = '#00ffa3';
        ctx.fillText('📮 匿名吐槽箱', width / 2, 85);
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#888';
        ctx.font = '14px Arial';
        ctx.fillText('— 释放你的秘密 —', width / 2, 115);
        
        ctx.shadowColor = '#b829dd';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = 'rgba(184, 41, 221, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(60, 135);
        ctx.lineTo(width - 60, 135);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#888';
        ctx.font = 'bold 13px Arial';
        ctx.fillText(Utils.maskAnonymousId(post.anonymous_id) + ' 说：', width / 2, 165);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '17px "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
        ctx.textAlign = 'left';
        
        const content = post.content || '';
        const maxChars = 180;
        const displayContent = content.length > maxChars ? content.substr(0, maxChars) + '...' : content;
        
        const lineHeight = 30;
        const maxWidth = width - 80;
        const lines = [];
        let currentLine = '';
        
        for (let char of displayContent) {
            const testLine = currentLine + char;
            if (ctx.measureText(testLine).width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = char;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
        
        const maxLines = 6;
        const startY = 200;
        lines.slice(0, maxLines).forEach((line, index) => {
            const alpha = index === 0 ? 1 : Math.max(0.7, 1 - index * 0.05);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillText(line, 40, startY + index * lineHeight);
        });
        
        const contentHeight = Math.min(lines.length, maxLines) * lineHeight;
        const bottomY = startY + contentHeight + 25;
        
        ctx.shadowColor = '#00ffa3';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = 'rgba(0, 255, 163, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(60, bottomY);
        ctx.lineTo(width - 60, bottomY);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        ctx.textAlign = 'center';
        
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ff00ff';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`❤️ ${post.like_count || 0}`, width / 2 - 50, bottomY + 40);
        
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#00e5ff';
        ctx.fillText(`💬 ${post.reply_count || 0}`, width / 2 + 50, bottomY + 40);
        
        if (post.category) {
            const categoryColors = {
                'love': '#ff6b6b',
                'work': '#4ecdc4', 
                'study': '#45b7d1',
                'life': '#96ceb4',
                'family': '#ffeaa7',
                'friend': '#dda0dd',
                'secret': '#9b59b6',
                'other': '#95a5a6'
            };
            
            const categoryNames = {
                'love': '爱情',
                'work': '工作', 
                'study': '学习',
                'life': '生活',
                'family': '家庭',
                'friend': '友情',
                'secret': '秘密',
                'other': '其他'
            };
            
            const color = categoryColors[post.category] || '#666';
            const name = categoryNames[post.category] || post.category;
            
            ctx.shadowBlur = 0;
            ctx.font = 'bold 13px Arial';
            
            const textWidth = ctx.measureText('#' + name).width + 24;
            const tagX = width / 2 - textWidth / 2;
            const tagY = bottomY + 65;
            
            ctx.fillStyle = color + '30';
            this.roundRect(ctx, tagX, tagY - 18, textWidth, 26, 13);
            ctx.fill();
            
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            this.roundRect(ctx, tagX, tagY - 18, textWidth, 26, 13);
            ctx.stroke();
            
            ctx.fillStyle = color;
            ctx.fillText('#' + name, width / 2, tagY);
        }
        
        ctx.shadowColor = '#00ffa3';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#00ffa3';
        ctx.font = 'bold 15px Arial';
        ctx.fillText('🔗 扫码查看详情', width / 2, height - 60);
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#555';
        ctx.font = '12px Arial';
        ctx.fillText('匿名吐槽箱 · 说出你的秘密', width / 2, height - 35);
        
        return canvas.toDataURL('image/png');
    },
    
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
};

window.Utils = Utils;
