const TeamSystem = {
    onTeamChange: null,

    addToTeam(monster) {
        const result = GameState.addMonsterToTeam(monster);
        if (result && this.onTeamChange) {
            this.onTeamChange();
        }
        return result;
    },

    removeFromTeam(monster) {
        if (GameState.getTeamMonsters().length <= 1) {
            GameState.showNotification('队伍至少需要一只异兽!');
            return false;
        }
        GameState.removeMonsterFromTeam(monster);
        if (this.onTeamChange) {
            this.onTeamChange();
        }
        return true;
    },

    moveInTeam(fromIndex, toIndex) {
        const team = GameState.state.player.team;
        if (fromIndex < 0 || fromIndex >= team.length || toIndex < 0 || toIndex >= team.length) {
            return false;
        }
        
        const [removed] = team.splice(fromIndex, 1);
        team.splice(toIndex, 0, removed);
        GameState.save();
        
        if (this.onTeamChange) {
            this.onTeamChange();
        }
        return true;
    },

    getTeam() {
        return GameState.getTeamMonsters();
    },

    getCollection() {
        return GameState.state.player.collection;
    },

    getCollectionStats() {
        const collection = GameState.state.player.collection;
        const stats = {
            total: MonsterData.monsters.length,
            collected: collection.length,
            byType: {
                fire: 0,
                water: 0,
                grass: 0,
                thunder: 0
            },
            byRarity: {
                common: 0,
                rare: 0,
                epic: 0,
                legendary: 0
            }
        };
        
        collection.forEach(monster => {
            stats.byType[monster.type]++;
            stats.byRarity[monster.rarity]++;
        });
        
        return stats;
    },

    getBestTeamForBattle() {
        const team = this.getTeam();
        return team.sort((a, b) => b.spd - a.spd);
    },

    getTypeCoverage() {
        const team = this.getTeam();
        const types = new Set();
        team.forEach(m => types.add(m.type));
        return types;
    },

    recommendTeamForArea(areaId) {
        const area = LevelData.getAreaById(areaId);
        const collection = this.getCollection();
        
        const teamTypes = new Set();
        const recommended = [];
        
        area.monsters.forEach(monsterId => {
            const template = MonsterData.getMonsterById(monsterId);
            if (template) {
                const advantageType = Object.keys(MonsterData.typeAdvantage).find(
                    type => MonsterData.typeAdvantage[type] === template.type
                );
                if (advantageType && !teamTypes.has(advantageType)) {
                    const matchingMonster = collection.find(m => 
                        m.type === advantageType && m.currentHp > 0
                    );
                    if (matchingMonster) {
                        teamTypes.add(advantageType);
                        recommended.push(matchingMonster);
                    }
                }
            }
        });
        
        return recommended.slice(0, 6);
    }
};
