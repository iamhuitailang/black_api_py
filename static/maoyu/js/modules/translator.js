const Translator = {
    CAT_TO_HUMAN: [
        {
            id: 'short',
            sound: '喵',
            soundType: 'short',
            description: '短促"喵" - 一声短暂',
            humanTranslation: '你好呀！',
            emoji: '👋',
            mood: 'friendly'
        },
        {
            id: 'long',
            sound: '喵～',
            soundType: 'long',
            description: '长音"喵～" - 拖长音',
            humanTranslation: '我好想你～',
            emoji: '💕',
            mood: 'loving'
        },
        {
            id: 'low',
            sound: '呜喵',
            soundType: 'low',
            description: '低沉"呜喵" - 低沉短促',
            humanTranslation: '我有点不开心',
            emoji: '😿',
            mood: 'sad'
        },
        {
            id: 'fast',
            sound: '喵喵喵',
            soundType: 'fast',
            description: '急促"喵喵喵" - 连续短促',
            humanTranslation: '快喂我！饿啦！',
            emoji: '😺',
            mood: 'hungry'
        },
        {
            id: 'high',
            sound: '喵呜！',
            soundType: 'high',
            description: '高音"喵呜！" - 尖锐',
            humanTranslation: '别烦我！走开！',
            emoji: '😾',
            mood: 'angry'
        },
        {
            id: 'purr',
            sound: '呼噜～',
            soundType: 'purr',
            description: '呼噜声 - 低频震动',
            humanTranslation: '好舒服～继续摸',
            emoji: '😻',
            mood: 'content'
        },
        {
            id: 'hiss',
            sound: '嘶嘶嘶',
            soundType: 'hiss',
            description: '嘶嘶嘶声 - 警告声',
            humanTranslation: '别靠近！我要打架了',
            emoji: '🙀',
            mood: 'threatened'
        }
    ],

    HUMAN_TO_CAT: [
        {
            id: 'love',
            human: '我爱你',
            catSound: '呼噜呼噜～喵～',
            soundType: 'purr',
            description: '呼噜呼噜～喵～',
            emoji: '💕'
        },
        {
            id: 'hungry',
            human: '我饿了',
            catSound: '喵喵喵喵喵！',
            soundType: 'fast',
            description: '喵喵喵喵喵！（急促）',
            emoji: '😸'
        },
        {
            id: 'play',
            human: '陪我玩',
            catSound: '喵～呜～喵～',
            soundType: 'long',
            description: '喵～呜～喵～（跳跃音）',
            emoji: '🎾'
        },
        {
            id: 'quiet',
            human: '别吵我',
            catSound: '嘶……',
            soundType: 'hiss',
            description: '嘶……（低沉）',
            emoji: '😾'
        },
        {
            id: 'comfortable',
            human: '好舒服',
            catSound: '咕噜咕噜～',
            soundType: 'purr',
            description: '咕噜咕噜～',
            emoji: '😻'
        },
        {
            id: 'sad',
            human: '我好伤心',
            catSound: '呜……喵……',
            soundType: 'low',
            description: '呜……喵……（低沉长音）',
            emoji: '😿'
        }
    ],

    RANDOM_TRANSLATIONS: [
        '喵星人说：今天天气真好，适合晒太阳～',
        '猫咪眨眨眼：刚才的小鱼干真好吃！',
        '猫咪歪头：你在说什么呀？我听不懂喵～',
        '呼噜呼噜～：主人的手真舒服喵～',
        '喵～：我又发现了一只小虫子！',
        '喵喵！：快开门！我要出去巡视领地！',
        '猫咪舔爪：今天的毛梳得真漂亮喵～',
        '喵呜～：我困了，让我睡一会儿喵～',
        '呼噜～：主人真懂我，这个位置刚好！',
        '喵喵喵：那边有好玩的！快跟我来！'
    ],

    getCatToHumanList() {
        return [...this.CAT_TO_HUMAN];
    },

    getHumanToCatList() {
        return [...this.HUMAN_TO_CAT];
    },

    translateCatToHuman(catSoundId) {
        const entry = this.CAT_TO_HUMAN.find(c => c.id === catSoundId);
        if (entry) {
            return {
                success: true,
                input: entry.sound,
                output: entry.humanTranslation,
                emoji: entry.emoji,
                description: entry.description,
                soundType: entry.soundType,
                mood: entry.mood,
                direction: 'cat-to-human'
            };
        }
        return {
            success: false,
            error: '找不到对应的翻译'
        };
    },

    translateHumanToCat(humanText) {
        const normalizedText = humanText.trim();
        
        const exactMatch = this.HUMAN_TO_CAT.find(h => h.human === normalizedText);
        if (exactMatch) {
            return {
                success: true,
                input: exactMatch.human,
                output: exactMatch.catSound,
                emoji: exactMatch.emoji,
                description: exactMatch.description,
                soundType: exactMatch.soundType,
                direction: 'human-to-cat',
                isLoveYou: exactMatch.id === 'love'
            };
        }

        const keywordMatch = this.findKeywordMatch(normalizedText);
        if (keywordMatch) {
            return keywordMatch;
        }

        const fallback = this.getFallbackTranslation(normalizedText);
        return {
            success: true,
            input: normalizedText,
            output: fallback.sound,
            emoji: fallback.emoji,
            description: fallback.description,
            soundType: fallback.soundType,
            direction: 'human-to-cat',
            isLoveYou: false,
            isFallback: true
        };
    },

    findKeywordMatch(text) {
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('爱') || lowerText.includes('love') || lowerText.includes('喜欢')) {
            return {
                success: true,
                input: text,
                output: '呼噜呼噜～喵～',
                emoji: '💕',
                description: '呼噜呼噜～喵～',
                soundType: 'purr',
                direction: 'human-to-cat',
                isLoveYou: true
            };
        }
        
        if (lowerText.includes('饿') || lowerText.includes('吃')) {
            return {
                success: true,
                input: text,
                output: '喵喵喵喵喵！',
                emoji: '😸',
                description: '喵喵喵喵喵！（急促）',
                soundType: 'fast',
                direction: 'human-to-cat',
                isLoveYou: false
            };
        }
        
        if (lowerText.includes('玩') || lowerText.includes('游戏')) {
            return {
                success: true,
                input: text,
                output: '喵～呜～喵～',
                emoji: '🎾',
                description: '喵～呜～喵～（跳跃音）',
                soundType: 'long',
                direction: 'human-to-cat',
                isLoveYou: false
            };
        }
        
        if (lowerText.includes('烦') || lowerText.includes('安静') || lowerText.includes('别闹')) {
            return {
                success: true,
                input: text,
                output: '嘶……',
                emoji: '😾',
                description: '嘶……（低沉）',
                soundType: 'hiss',
                direction: 'human-to-cat',
                isLoveYou: false
            };
        }
        
        if (lowerText.includes('舒服') || lowerText.includes('爽') || lowerText.includes('摸')) {
            return {
                success: true,
                input: text,
                output: '咕噜咕噜～',
                emoji: '😻',
                description: '咕噜咕噜～',
                soundType: 'purr',
                direction: 'human-to-cat',
                isLoveYou: false
            };
        }
        
        if (lowerText.includes('伤心') || lowerText.includes('难过') || lowerText.includes('哭')) {
            return {
                success: true,
                input: text,
                output: '呜……喵……',
                emoji: '😿',
                description: '呜……喵……（低沉长音）',
                soundType: 'low',
                direction: 'human-to-cat',
                isLoveYou: false
            };
        }

        return null;
    },

    getFallbackTranslation(text) {
        const hash = this.simpleHash(text);
        const options = [
            { sound: '喵～', emoji: '😺', description: '喵～', soundType: 'short' },
            { sound: '喵喵～', emoji: '😸', description: '喵喵～', soundType: 'fast' },
            { sound: '呼噜～', emoji: '😻', description: '呼噜～', soundType: 'purr' },
            { sound: '喵呜～', emoji: '🙀', description: '喵呜～', soundType: 'long' }
        ];
        return options[hash % options.length];
    },

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash);
    },

    getRandomTranslation() {
        const index = Math.floor(Math.random() * this.RANDOM_TRANSLATIONS.length);
        const text = this.RANDOM_TRANSLATIONS[index];
        
        const soundTypes = ['short', 'long', 'purr', 'fast'];
        const soundType = soundTypes[Math.floor(Math.random() * soundTypes.length)];
        
        return {
            success: true,
            input: '随机猫语',
            output: text,
            emoji: '🎲',
            soundType: soundType,
            direction: 'random',
            isRandom: true
        };
    },

    getRandomCatSound() {
        const index = Math.floor(Math.random() * this.CAT_TO_HUMAN.length);
        return this.translateCatToHuman(this.CAT_TO_HUMAN[index].id);
    },

    isLateNight() {
        const hour = new Date().getHours();
        return hour >= 0 && hour < 5;
    },

    getSleepingMessage() {
        return {
            success: true,
            input: '猫咪在睡觉',
            output: '猫咪在睡觉，别吵它 Zzz',
            emoji: '😴',
            soundType: 'purr',
            direction: 'sleeping',
            isSleeping: true
        };
    },

    checkTranslationMilestone(count) {
        if (count >= 5 && count % 5 === 0) {
            return {
                showVideoCall: true,
                message: '喵星人请求视频通话 📞'
            };
        }
        return null;
    },

    checkLoveYouMilestone(count) {
        if (count >= 3 && count % 3 === 0) {
            return {
                showHearts: true,
                message: '猫咪收到你的爱意啦！💕'
            };
        }
        return null;
    }
};
