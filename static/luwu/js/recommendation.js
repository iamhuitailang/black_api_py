const Recommendation = {
    lastCriteria: null,
    lastResults: [],
    excludeIds: [],

    recommend(criteria, excludeIds = []) {
        this.lastCriteria = criteria;
        this.excludeIds = [...excludeIds];
        
        const allGifts = GiftData.getAllGifts();
        let candidates = allGifts.filter(gift => !excludeIds.includes(gift.id));
        
        const scored = candidates.map(gift => {
            const score = this.calculateScore(gift, criteria);
            return { gift, score };
        });
        
        scored.sort((a, b) => b.score - a.score);
        
        this.lastResults = scored.map(s => s.gift);
        
        return {
            gifts: this.lastResults,
            criteria: { ...criteria }
        };
    },

    calculateScore(gift, criteria) {
        let score = 0;
        const { relationship, gender, age, budget, interests, occasion } = criteria;
        
        if (relationship && relationship.length > 0) {
            if (gift.relationships && gift.relationships.length > 0) {
                if (gift.relationships.includes(relationship)) {
                    score += 30;
                } else if (gift.relationships.includes('any') || gift.relationships.includes('通用')) {
                    score += 15;
                }
            }
        }
        
        if (gender && gender !== 'any') {
            if (gift.genders && gift.genders.length > 0) {
                if (gift.genders.includes(gender)) {
                    score += 25;
                } else if (gift.genders.includes('any')) {
                    score += 12;
                }
            }
        }
        
        if (age && age.length > 0) {
            if (gift.ages && gift.ages.length > 0) {
                if (gift.ages.includes(age)) {
                    score += 20;
                }
            }
        }
        
        if (budget && budget.length > 0) {
            const range = Config.getBudgetRange(budget);
            if (Utils.isInPriceRange(gift.price, range.min, range.max)) {
                score += 20;
            } else {
                const diff = Math.abs(gift.price - (range.min + range.max) / 2);
                if (diff < 500) {
                    score += 10;
                }
            }
        }
        
        if (interests && interests.length > 0) {
            if (gift.interests && gift.interests.length > 0) {
                const matches = Utils.arrayIntersect(interests, gift.interests);
                score += matches.length * 15;
            }
        }
        
        if (occasion && occasion.length > 0) {
            if (gift.occasions && gift.occasions.length > 0) {
                if (gift.occasions.includes(occasion)) {
                    score += 25;
                }
            }
        }
        
        if (gift.relationships && gift.relationships.length === 0) {
            score += 5;
        }
        if (gift.genders && gift.genders.length === 0) {
            score += 5;
        }
        if (gift.ages && gift.ages.length === 0) {
            score += 5;
        }
        
        score += Math.random() * 10;
        
        return score;
    },

    refresh() {
        if (!this.lastCriteria) return null;
        
        this.excludeIds = [
            ...this.excludeIds,
            ...this.lastResults.slice(0, 8).map(g => g.id)
        ];
        
        return this.recommend(this.lastCriteria, this.excludeIds);
    },

    filterGifts(gifts, filterPrice, filterCategory) {
        let filtered = [...gifts];
        
        if (filterPrice && filterPrice !== 'all') {
            const ranges = GiftData.getPriceRanges();
            const range = ranges.find(r => r.value === filterPrice);
            if (range) {
                filtered = filtered.filter(g => 
                    Utils.isInPriceRange(g.price, range.min, range.max)
                );
            }
        }
        
        if (filterCategory && filterCategory !== 'all') {
            filtered = filtered.filter(g => g.category === filterCategory);
        }
        
        return filtered;
    },

    getRecommendationsFromStorage() {
        const saved = Storage.getLastRecommend();
        if (saved && saved.timestamp) {
            const age = Date.now() - saved.timestamp;
            if (age < 24 * 60 * 60 * 1000) {
                return saved;
            }
        }
        return null;
    },

    saveRecommendationsToStorage(criteria, giftIds) {
        Storage.setLastRecommend({
            criteria,
            giftIds,
            timestamp: Date.now()
        });
    },

    matchRelationship(giftRels, userRel) {
        if (!giftRels || giftRels.length === 0) return true;
        if (!userRel) return true;
        return giftRels.includes(userRel);
    },

    matchGender(giftGenders, userGender) {
        if (!giftGenders || giftGenders.length === 0) return true;
        if (!userGender || userGender === 'any') return true;
        if (giftGenders.includes('any')) return true;
        return giftGenders.includes(userGender);
    },

    matchAge(giftAges, userAge) {
        if (!giftAges || giftAges.length === 0) return true;
        if (!userAge) return true;
        return giftAges.includes(userAge);
    },

    matchInterests(giftInterests, userInterests) {
        if (!giftInterests || giftInterests.length === 0) return 0;
        if (!userInterests || userInterests.length === 0) return 0;
        return Utils.arrayIntersect(giftInterests, userInterests).length;
    },

    matchOccasion(giftOccasions, userOccasion) {
        if (!giftOccasions || giftOccasions.length === 0) return true;
        if (!userOccasion) return true;
        return giftOccasions.includes(userOccasion);
    }
};

window.Recommendation = Recommendation;
