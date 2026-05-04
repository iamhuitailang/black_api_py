const ShareUtils = {
    encodeForShare(data) {
        try {
            const jsonStr = JSON.stringify(data);
            const compressed = this.compressString(jsonStr);
            return btoa(encodeURIComponent(compressed));
        } catch (e) {
            console.error('编码分享数据失败:', e);
            return null;
        }
    },

    decodeFromShare(encoded) {
        try {
            const decoded = decodeURIComponent(atob(encoded));
            const decompressed = this.decompressString(decoded);
            return JSON.parse(decompressed);
        } catch (e) {
            console.error('解码分享数据失败:', e);
            return null;
        }
    },

    compressString(str) {
        if (typeof CompressionStream !== 'undefined') {
            return this.compressWithStream(str);
        }
        return str;
    },

    decompressString(str) {
        if (typeof DecompressionStream !== 'undefined') {
            return this.decompressWithStream(str);
        }
        return str;
    },

    async compressWithStream(str) {
        try {
            const blob = new Blob([str], { type: 'text/plain' });
            const stream = blob.stream().pipeThrough(new CompressionStream('gzip'));
            const reader = stream.getReader();
            const chunks = [];
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
            }
            
            const uint8Array = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
            let offset = 0;
            for (const chunk of chunks) {
                uint8Array.set(chunk, offset);
                offset += chunk.length;
            }
            
            return String.fromCharCode(...uint8Array);
        } catch (e) {
            return str;
        }
    },

    async decompressWithStream(str) {
        try {
            const uint8Array = new Uint8Array(str.length);
            for (let i = 0; i < str.length; i++) {
                uint8Array[i] = str.charCodeAt(i);
            }
            
            const blob = new Blob([uint8Array], { type: 'application/gzip' });
            const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
            const reader = stream.getReader();
            const chunks = [];
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
            }
            
            const decoder = new TextDecoder();
            return decoder.decode(Blob(chunks).arrayBuffer());
        } catch (e) {
            return str;
        }
    },

    generateBankShareLink(bankId) {
        const bank = BankModel.getById(bankId);
        if (!bank) return null;

        const questions = QuestionModel.getByBankId(bankId);
        const shareData = {
            type: 'bank',
            version: '1.0',
            name: bank.name,
            icon: bank.icon,
            description: bank.description || '',
            questions: questions.map(q => ({
                content: q.content,
                type: q.type,
                options: q.options,
                answer: q.answer,
                explanation: q.explanation,
                tags: q.tags,
                difficulty: q.difficulty
            }))
        };

        const encoded = this.encodeForShare(shareData);
        if (!encoded) return null;

        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}#share=${encoded}`;
    },

    generateSimpleShareLink(bankId) {
        const bank = BankModel.getById(bankId);
        if (!bank) return null;

        const questions = QuestionModel.getByBankId(bankId);
        const shareData = {
            type: 'bank',
            version: '1.0',
            name: bank.name,
            icon: bank.icon,
            description: bank.description || '',
            questions: questions.map(q => ({
                content: q.content,
                type: q.type,
                options: q.options,
                answer: q.answer,
                explanation: q.explanation,
                tags: q.tags,
                difficulty: q.difficulty
            }))
        };

        const jsonStr = JSON.stringify(shareData);
        const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}#share=${encoded}`;
    },

    parseShareLink(hash) {
        if (!hash) return null;

        let shareData = null;
        const shareMatch = hash.match(/share=([^&]+)/);
        
        if (shareMatch) {
            const encoded = shareMatch[1];
            try {
                const jsonStr = decodeURIComponent(escape(atob(encoded)));
                shareData = JSON.parse(jsonStr);
            } catch (e) {
                try {
                    const decoded = this.decodeFromShare(encoded);
                    if (decoded) {
                        shareData = decoded;
                    }
                } catch (e2) {
                    console.error('解析分享链接失败:', e2);
                    return null;
                }
            }
        }

        return shareData;
    },

    async importShareData(shareData) {
        if (!shareData || shareData.type !== 'bank') {
            return { success: false, message: '无效的分享数据' };
        }

        try {
            const bank = BankModel.create({
                name: shareData.name || '分享的题库',
                icon: shareData.icon || '📚',
                description: shareData.description || ''
            });

            if (shareData.questions && Array.isArray(shareData.questions)) {
                shareData.questions.forEach(q => {
                    QuestionModel.create(bank.id, {
                        content: q.content,
                        type: q.type || 'single',
                        options: q.options || [],
                        answer: q.answer || [],
                        explanation: q.explanation || '',
                        tags: q.tags || [],
                        difficulty: q.difficulty || 1
                    });
                });
            }

            return {
                success: true,
                bankId: bank.id,
                bankName: bank.name,
                questionCount: shareData.questions?.length || 0
            };
        } catch (e) {
            return { success: false, message: e.message };
        }
    },

    drawShareCard(canvas, options = {}) {
        const ctx = canvas.getContext('2d');
        const {
            width = 800,
            height = 600,
            title = '背题神器',
            subtitle = '科学记忆，高效学习',
            stats = {},
            icon = '📚',
            theme = 'default'
        } = options;

        canvas.width = width;
        canvas.height = height;

        const gradient = ctx.createLinearGradient(0, 0, width, height);
        if (theme === 'dark') {
            gradient.addColorStop(0, '#1e293b');
            gradient.addColorStop(1, '#334155');
        } else {
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#764ba2');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const radius = Math.random() * 50 + 10;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        const cardX = 60;
        const cardY = 60;
        const cardWidth = width - 120;
        const cardHeight = height - 120;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 20);
        ctx.fill();

        ctx.fillStyle = '#667eea';
        this.roundRect(ctx, cardX, cardY, cardWidth, 80, [20, 20, 0, 0]);
        ctx.fill();

        ctx.font = '48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(icon, cardX + cardWidth / 2, cardY + 55);

        ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.fillText(title, cardX + cardWidth / 2, cardY + 130);

        ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText(subtitle, cardX + cardWidth / 2, cardY + 160);

        if (stats && Object.keys(stats).length > 0) {
            const statsArray = [
                { label: '总题目', value: stats.totalQuestions || 0, icon: '📝' },
                { label: '已掌握', value: stats.mastered || 0, icon: '✅' },
                { label: '正确率', value: (stats.accuracy || 0) + '%', icon: '📊' },
                { label: '连续天数', value: stats.streak || 0, icon: '🔥' }
            ];

            const statWidth = (cardWidth - 80) / 4;
            const startY = cardY + 200;

            statsArray.forEach((stat, i) => {
                const x = cardX + 40 + i * statWidth + statWidth / 2;

                ctx.font = '32px sans-serif';
                ctx.fillText(stat.icon, x, startY + 30);

                ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
                ctx.fillStyle = '#1e293b';
                ctx.fillText(stat.value, x, startY + 75);

                ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
                ctx.fillStyle = '#64748b';
                ctx.fillText(stat.label, x, startY + 98);
            });
        }

        ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText(`生成于 ${new Date().toLocaleDateString('zh-CN')}`, cardX + cardWidth / 2, cardY + cardHeight - 40);

        ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = '#667eea';
        ctx.fillText('背题神器', cardX + cardWidth / 2, cardY + cardHeight - 20);
    },

    drawBankShareCard(canvas, bank, options = {}) {
        const ctx = canvas.getContext('2d');
        const {
            width = 800,
            height = 600
        } = options;

        canvas.width = width;
        canvas.height = height;

        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.roundRect(ctx, 60, 60, width - 120, height - 120, 20);
        ctx.fill();

        ctx.fillStyle = '#667eea';
        this.roundRect(ctx, 60, 60, width - 120, 100, [20, 20, 0, 0]);
        ctx.fill();

        ctx.font = '48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(bank.icon || '📚', width / 2, 125);

        ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.fillText(bank.name, width / 2, 200);

        if (bank.description) {
            ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.fillText(bank.description, width / 2, 230);
        }

        const questions = QuestionModel.getByBankId(bank.id);
        const mastery = MemoryAlgorithm.getBankMastery(bank.id);

        const stats = [
            { label: '题目数量', value: questions.length, icon: '📝' },
            { label: '已掌握', value: mastery.mastered, icon: '✅' },
            { label: '学习中', value: mastery.learning, icon: '📖' },
            { label: '掌握度', value: mastery.averageMastery + '%', icon: '📊' }
        ];

        const statWidth = (width - 200) / 4;
        const startY = 280;

        stats.forEach((stat, i) => {
            const x = 100 + i * statWidth + statWidth / 2;

            ctx.font = '32px sans-serif';
            ctx.fillText(stat.icon, x, startY + 30);

            ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.fillStyle = '#1e293b';
            ctx.fillText(stat.value, x, startY + 80);

            ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.fillText(stat.label, x, startY + 105);
        });

        ctx.fillStyle = '#f1f5f9';
        this.roundRect(ctx, 100, startY + 140, width - 200, 80, 10);
        ctx.fill();

        ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText('💡 扫描二维码或使用分享链接导入此题库', width / 2, startY + 175);
        ctx.fillText(`生成于 ${new Date().toLocaleDateString('zh-CN')} | 背题神器`, width / 2, startY + 200);
    },

    roundRect(ctx, x, y, width, height, radius) {
        const r = typeof radius === 'number' ? [radius, radius, radius, radius] : radius;
        
        ctx.beginPath();
        ctx.moveTo(x + r[0], y);
        ctx.lineTo(x + width - r[1], y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r[1]);
        ctx.lineTo(x + width, y + height - r[2]);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r[2], y + height);
        ctx.lineTo(x + r[3], y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r[3]);
        ctx.lineTo(x, y + r[0]);
        ctx.quadraticCurveTo(x, y, x + r[0], y);
        ctx.closePath();
    },

    downloadCanvasAsImage(canvas, filename = 'share-card.png') {
        const dataURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (e) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                document.body.removeChild(textarea);
                return true;
            } catch (e2) {
                document.body.removeChild(textarea);
                return false;
            }
        }
    },

    async shareNative(title, text, url) {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: text,
                    url: url
                });
                return true;
            } catch (e) {
                return false;
            }
        }
        return false;
    },

    getShareStats() {
        const banks = BankModel.getAll();
        const questions = QuestionModel.getAll();
        const streak = DailyPlanModel.getStreakDays();

        let correctCount = 0;
        let totalCount = 0;
        let masteredCount = 0;

        questions.forEach(q => {
            if (q.studyStats) {
                correctCount += q.studyStats.correctCount || 0;
                totalCount += q.studyStats.totalCount || 0;
            }
            const mastery = MemoryAlgorithm.calculateMasteryScore(q);
            if (mastery >= 80) {
                masteredCount++;
            }
        });

        return {
            totalQuestions: questions.length,
            totalBanks: banks.length,
            mastered: masteredCount,
            accuracy: totalCount > 0 ? Math.round(correctCount / totalCount * 100) : 0,
            streak: streak
        };
    }
};

window.ShareUtils = ShareUtils;
