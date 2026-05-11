const Translator = (function() {
    console.log('Translator module loaded');

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function getRandomFromArray(arr) {
        if (!arr || arr.length === 0) return '';
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function isChinese(text) {
        return /[\u4e00-\u9fa5]/.test(text);
    }

    function translate(text) {
        console.log('Translating:', text);
        
        if (!text || text.trim() === '') {
            return '';
        }

        const chineseDict = PirateDictionary.getChineseTranslations();
        const englishDict = PirateDictionary.getWordTranslations();
        
        console.log('Chinese dict loaded:', Object.keys(chineseDict).length, 'entries');
        console.log('Is Chinese text:', isChinese(text));

        let result = text;

        if (isChinese(text)) {
            console.log('Using Chinese translator');
            const sortedPhrases = Object.keys(chineseDict)
                .sort((a, b) => b.length - a.length);

            console.log('Sorted phrases (first 10):', sortedPhrases.slice(0, 10));

            sortedPhrases.forEach(phrase => {
                const translations = chineseDict[phrase];
                if (translations && translations.length > 0) {
                    const regex = new RegExp(escapeRegExp(phrase), 'g');
                    const matches = result.match(regex);
                    if (matches) {
                        console.log('Found match:', phrase, '->', translations);
                        result = result.replace(regex, () => {
                            const translation = getRandomFromArray(translations);
                            return translation || '';
                        });
                    }
                }
            });

            result = result.replace(/\s+/g, ' ').trim();
        } else {
            console.log('Using English translator');
            const sortedPhrases = Object.keys(englishDict)
                .filter(phrase => phrase.includes(' '))
                .sort((a, b) => b.length - a.length);

            sortedPhrases.forEach(phrase => {
                const regex = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, 'gi');
                result = result.replace(regex, match => {
                    const translations = englishDict[match.toLowerCase()];
                    if (translations) {
                        const translation = getRandomFromArray(translations);
                        return match[0] === match[0].toUpperCase() 
                            ? translation.charAt(0).toUpperCase() + translation.slice(1)
                            : translation;
                    }
                    return match;
                });
            });

            result = result.replace(/\b\w+\b/g, match => {
                const translations = englishDict[match.toLowerCase()];
                if (translations) {
                    const translation = getRandomFromArray(translations);
                    return match[0] === match[0].toUpperCase() 
                        ? translation.charAt(0).toUpperCase() + translation.slice(1)
                        : translation;
                }
                return match;
            });

            result = result.replace(/\bI am\b/gi, 'I be');
            result = result.replace(/\bI'm\b/gi, 'I be');
            result = result.replace(/\bYou are\b/gi, 'Ye be');
            result = result.replace(/\bYou're\b/gi, 'Ye be');
            result = result.replace(/\byou are\b/g, 'ye be');
            result = result.replace(/\byou're\b/g, 'ye be');
            result = result.replace(/\bWe are\b/gi, 'We be');
            result = result.replace(/\bWe're\b/gi, 'We be');
            result = result.replace(/\bwe are\b/g, 'we be');
            result = result.replace(/\bwe're\b/g, 'we be');
            result = result.replace(/ing\b/g, 'in\'');
        }

        const interjections = PirateDictionary.getPirateInterjections();
        if (interjections && interjections.length > 0 && Math.random() > 0.3 && result.trim().length > 0) {
            const randomInterjection = getRandomFromArray(interjections);
            if (randomInterjection && randomInterjection.phrase) {
                result = randomInterjection.phrase + ' ' + result;
            }
        }

        console.log('Translation result:', result);
        return result;
    }

    function getRandomQuote() {
        return PirateDictionary.getRandomQuote();
    }

    let voicesLoaded = false;

    function loadVoices() {
        return new Promise((resolve) => {
            if (!('speechSynthesis' in window)) {
                console.warn('Speech synthesis not supported');
                resolve([]);
                return;
            }

            let voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                voicesLoaded = true;
                console.log('Voices loaded immediately:', voices.length);
                resolve(voices);
                return;
            }

            const timeoutId = setTimeout(() => {
                voices = window.speechSynthesis.getVoices();
                voicesLoaded = true;
                console.log('Voices loaded after timeout:', voices.length);
                resolve(voices);
            }, 3000);

            window.speechSynthesis.onvoiceschanged = () => {
                clearTimeout(timeoutId);
                voices = window.speechSynthesis.getVoices();
                voicesLoaded = true;
                console.log('Voices loaded via event:', voices.length);
                resolve(voices);
            };
        });
    }

    async function speak(text) {
        console.log('Speaking:', text);
        
        if (!('speechSynthesis' in window)) {
            throw new Error('Speech synthesis not supported in this browser');
        }

        if (!text || text.trim() === '') {
            throw new Error('No text to speak');
        }

        window.speechSynthesis.cancel();

        const voices = await loadVoices();
        console.log('Available voices:', voices.length);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 0.8;
        utterance.volume = 1;

        const hasChinese = isChinese(text);
        console.log('Text has Chinese:', hasChinese);

        let selectedVoice = null;

        if (voices.length > 0) {
            if (hasChinese) {
                utterance.lang = 'zh-CN';
                selectedVoice = voices.find(v => v.lang && v.lang.startsWith('zh'));
                if (!selectedVoice) {
                    selectedVoice = voices.find(v => v.lang && (v.lang.includes('CN') || v.lang.includes('ZH')));
                }
            } else {
                utterance.lang = 'en-US';
                selectedVoice = voices.find(v => v.lang && v.lang.startsWith('en'));
            }
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log('Using voice:', selectedVoice.name, selectedVoice.lang);
        } else {
            console.log('No specific voice found, using default');
        }

        return new Promise((resolve, reject) => {
            utterance.onstart = () => console.log('Speech started');
            utterance.onend = () => {
                console.log('Speech ended');
                resolve();
            };
            utterance.onerror = (event) => {
                console.error('Speech error:', event);
                reject(event.error || new Error('Speech synthesis error'));
            };

            try {
                window.speechSynthesis.speak(utterance);
            } catch (e) {
                console.error('Speak exception:', e);
                reject(e);
            }
        });
    }

    function stopSpeaking() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }

    function copyToClipboard(text) {
        return new Promise((resolve, reject) => {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text)
                    .then(resolve)
                    .catch(reject);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.select();
                
                try {
                    const successful = document.execCommand('copy');
                    if (successful) {
                        resolve();
                    } else {
                        reject(new Error('Copy command failed'));
                    }
                } catch (e) {
                    reject(e);
                } finally {
                    document.body.removeChild(textarea);
                }
            }
        });
    }

    function generateShareImage(text, originalText, theme) {
        console.log('Generating share image...');
        
        return new Promise((resolve, reject) => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const width = 800;
                const height = 600;
                canvas.width = width;
                canvas.height = height;

                const themeColors = {
                    pirate: {
                        bg: ['#1a0f0a', '#2d1810'],
                        accent: '#c9a86c',
                        text: '#f4e4c1',
                        emoji: '🏴‍☠️'
                    },
                    deepsea: {
                        bg: ['#0a1628', '#1a2a4a'],
                        accent: '#4ecdc4',
                        text: '#a8e6cf',
                        emoji: '🧜‍♀️'
                    },
                    steampunk: {
                        bg: ['#1c140d', '#2d2015'],
                        accent: '#cd7f32',
                        text: '#f0e6d2',
                        emoji: '🤖'
                    }
                };

                const colors = themeColors[theme] || themeColors.pirate;

                const gradient = ctx.createLinearGradient(0, 0, width, height);
                gradient.addColorStop(0, colors.bg[0]);
                gradient.addColorStop(1, colors.bg[1]);
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);

                ctx.fillStyle = colors.accent;
                ctx.globalAlpha = 0.1;
                for (let i = 0; i < 30; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    const size = Math.random() * 40 + 10;
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;

                ctx.strokeStyle = colors.accent;
                ctx.lineWidth = 4;
                ctx.strokeRect(30, 30, width - 60, height - 60);

                ctx.fillStyle = colors.accent;
                ctx.font = 'bold 70px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(colors.emoji, width / 2, 110);

                ctx.fillStyle = colors.accent;
                ctx.font = 'bold 28px Georgia, serif';
                ctx.textAlign = 'center';
                ctx.fillText('🏴‍☠️ 海盗语翻译器', width / 2, 160);

                let currentY = 210;

                if (originalText && originalText.trim()) {
                    ctx.fillStyle = colors.text;
                    ctx.font = '18px Georgia, serif';
                    ctx.textAlign = 'center';
                    
                    const displayOriginal = originalText.length > 50 
                        ? originalText.substring(0, 50) + '...' 
                        : originalText;
                    
                    const originalLines = wrapText(ctx, '📝 原文: ' + displayOriginal, width - 100);
                    originalLines.forEach(line => {
                        ctx.fillText(line, width / 2, currentY);
                        currentY += 26;
                    });
                    currentY += 10;
                }

                ctx.fillStyle = colors.accent;
                ctx.font = 'bold 22px Georgia, serif';
                ctx.textAlign = 'center';
                ctx.fillText('⚓ 海盗语:', width / 2, currentY);
                currentY += 35;

                ctx.fillStyle = colors.text;
                ctx.font = 'bold 26px Georgia, serif';
                ctx.textAlign = 'center';
                
                const displayText = text.length > 80 
                    ? text.substring(0, 80) + '...' 
                    : text;
                
                const lines = wrapText(ctx, displayText, width - 100);
                lines.forEach((line, index) => {
                    ctx.fillText(line, width / 2, currentY + (index * 38));
                });

                ctx.fillStyle = colors.accent;
                ctx.font = 'italic 16px Georgia, serif';
                ctx.textAlign = 'center';
                ctx.fillText('— Arrr! Ye be speakin\' pirate now! —', width / 2, height - 40);

                const dataUrl = canvas.toDataURL('image/png');
                console.log('Image generated successfully');
                resolve(dataUrl);
            } catch (error) {
                console.error('Image generation error:', error);
                reject(error);
            }
        });
    }

    function wrapText(ctx, text, maxWidth) {
        const lines = [];
        let currentLine = '';
        const chars = text.split('');

        for (let i = 0; i < chars.length; i++) {
            const testLine = currentLine + chars[i];
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine !== '') {
                lines.push(currentLine);
                currentLine = chars[i];
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }

        return lines.slice(0, 5);
    }

    function dataURLToBlob(dataURL) {
        const parts = dataURL.split(';base64,');
        const contentType = parts[0].split(':')[1];
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        
        for (let i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
        }
        
        return new Blob([uInt8Array], { type: contentType });
    }

    function downloadImage(dataUrl, filename) {
        return new Promise((resolve, reject) => {
            try {
                const link = document.createElement('a');
                link.download = filename;
                link.href = dataUrl;
                link.style.display = 'none';
                document.body.appendChild(link);
                
                setTimeout(() => {
                    link.click();
                    setTimeout(() => {
                        document.body.removeChild(link);
                        resolve(true);
                    }, 100);
                }, 50);
            } catch (error) {
                reject(error);
            }
        });
    }

    async function share(text, originalText, theme) {
        console.log('Sharing:', text);
        
        try {
            const imageDataUrl = await generateShareImage(text, originalText, theme);
            console.log('Image generated, starting download...');
            
            const blob = dataURLToBlob(imageDataUrl);
            const file = new File([blob], 'pirate-translation.png', { type: 'image/png' });
            console.log('File created:', file.name, file.size, 'bytes');

            if (navigator.share && navigator.canShare) {
                try {
                    const shareData = {
                        title: '🏴‍☠️ 海盗语翻译器',
                        text: text,
                        files: [file]
                    };

                    if (navigator.canShare(shareData)) {
                        console.log('Using native share API');
                        await navigator.share(shareData);
                        return { shared: true, type: 'native' };
                    }
                } catch (shareError) {
                    if (shareError.name !== 'AbortError') {
                        console.log('Native share failed, falling back to download:', shareError);
                    } else {
                        throw shareError;
                    }
                }
            }

            console.log('Downloading image directly');
            await downloadImage(imageDataUrl, 'pirate-translation.png');
            console.log('Download initiated');

            return { shared: true, type: 'download' };
        } catch (error) {
            console.error('Share error:', error);
            
            if (error.name !== 'AbortError') {
                try {
                    await copyToClipboard(text);
                    return { shared: true, type: 'copied' };
                } catch (copyError) {
                    throw error;
                }
            }
            throw error;
        }
    }

    return {
        translate,
        getRandomQuote,
        speak,
        stopSpeaking,
        copyToClipboard,
        share,
        generateShareImage
    };
})();
