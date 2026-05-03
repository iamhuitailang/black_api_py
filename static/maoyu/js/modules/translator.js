import { catSounds, humanPhrases, chatResponses, randomCatQuotes } from './data.js';
import { Storage } from './storage.js';

export const Translator = {
    translateCatToHuman(catSoundId) {
        const sound = catSounds.find(s => s.id === catSoundId);
        if (sound) {
            Storage.addHistory({
                type: 'cat-to-human',
                from: sound.soundText,
                to: sound.translation,
                soundName: sound.name
            });
            Storage.incrementTranslateCount();
            return {
                soundText: sound.soundText,
                translation: sound.translation,
                soundName: sound.name,
                emoji: sound.emoji,
                audioType: sound.audioType
            };
        }
        return null;
    },

    translateHumanToCat(phrase) {
        const matchedPhrase = humanPhrases.find(p => 
            p.phrase === phrase || phrase.includes(p.phrase)
        );

        let result;
        if (matchedPhrase) {
            result = {
                original: phrase,
                catTranslation: matchedPhrase.catTranslation,
                audioType: matchedPhrase.audioType,
                isLoveYou: phrase.includes('我爱你')
            };
        } else {
            result = this.generateRandomCatTranslation(phrase);
        }

        Storage.addHistory({
            type: 'human-to-cat',
            from: phrase,
            to: result.catTranslation
        });
        Storage.incrementTranslateCount();

        if (result.isLoveYou) {
            Storage.incrementLoveYouCount();
        }

        return result;
    },

    generateRandomCatTranslation(phrase) {
        const patterns = [
            { text: '喵～喵～（歪头看着你）', audioType: 'playful' },
            { text: '喵喵喵！（兴奋地跑过来）', audioType: 'rapid' },
            { text: '呼噜呼噜～（躺倒在你面前）', audioType: 'purr' },
            { text: '喵呜？（疑惑地眨眼睛）', audioType: 'long' },
            { text: '喵喵～（蹭蹭你的手）', audioType: 'short' },
            { text: '喵～～（伸个懒腰）', audioType: 'long' },
            { text: '呼噜呼噜～喵～', audioType: 'purr' },
            { text: '喵！喵！（到处闻闻）', audioType: 'rapid' }
        ];

        const randomIndex = Math.floor(Math.random() * patterns.length);
        const pattern = patterns[randomIndex];

        return {
            original: phrase,
            catTranslation: pattern.text,
            audioType: pattern.audioType,
            isLoveYou: phrase.includes('我爱你')
        };
    },

    getRandomCatSound() {
        const randomIndex = Math.floor(Math.random() * catSounds.length);
        return this.translateCatToHuman(catSounds[randomIndex].id);
    },

    getRandomHumanPhrase() {
        const randomIndex = Math.floor(Math.random() * humanPhrases.length);
        const phrase = humanPhrases[randomIndex];
        return this.translateHumanToCat(phrase.phrase);
    },

    getChatResponse(userMessage) {
        const message = userMessage.toLowerCase();
        
        let responseCategory = 'default';

        if (message.includes('你好') || message.includes('hi') || message.includes('哈喽') || message.includes('hello')) {
            responseCategory = 'greetings';
        } else if (message.includes('饿') || message.includes('吃') || message.includes('饭')) {
            responseCategory = 'hungry';
        } else if (message.includes('玩') || message.includes('游戏') || message.includes('逗')) {
            responseCategory = 'playful';
        } else if (message.includes('睡') || message.includes('困') || message.includes('累')) {
            responseCategory = 'sleepy';
        } else if (message.includes('爱') || message.includes('喜欢') || message.includes('亲') || message.includes('抱')) {
            responseCategory = 'affectionate';
        } else if (message.includes('生气') || message.includes('滚') || message.includes('走开')) {
            responseCategory = 'angry';
        } else if (message.includes('什么') || message.includes('？') || message.includes('?') || message.includes('为啥') || message.includes('为什么')) {
            responseCategory = 'confused';
        }

        const responses = chatResponses[responseCategory];
        const randomIndex = Math.floor(Math.random() * responses.length);
        
        const response = {
            sender: 'cat',
            text: responses[randomIndex],
            type: responseCategory
        };

        Storage.addChatMessage({
            sender: 'user',
            text: userMessage
        });
        Storage.addChatMessage(response);

        return response;
    },

    getRandomQuote() {
        const randomIndex = Math.floor(Math.random() * randomCatQuotes.length);
        return randomCatQuotes[randomIndex];
    },

    isNightTime() {
        const hour = new Date().getHours();
        return hour >= 0 && hour < 5;
    },

    getEasterEggTriggers() {
        const easterState = Storage.getEasterEggState();
        const triggers = [];

        if (easterState.translateCount >= 5 && !easterState.videoCallTriggered) {
            triggers.push({
                type: 'video_call',
                message: '喵星人请求视频通话'
            });
        }

        if (easterState.loveYouCount >= 3 && !easterState.heartAnimationTriggered) {
            triggers.push({
                type: 'heart_animation',
                message: '猫咪送爱心'
            });
        }

        if (this.isNightTime()) {
            triggers.push({
                type: 'sleeping',
                message: '猫咪在睡觉，别吵它 Zzz'
            });
        }

        return triggers;
    },

    markEasterTriggered(type) {
        const state = Storage.getEasterEggState();
        if (type === 'video_call') {
            state.videoCallTriggered = true;
        } else if (type === 'heart_animation') {
            state.heartAnimationTriggered = true;
        }
        Storage.saveEasterEggState(state);
    }
};

export default Translator;
