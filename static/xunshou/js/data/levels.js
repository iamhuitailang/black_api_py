const LevelData = {
    areas: [
        {
            id: 'meadow',
            name: '翠绿草原',
            description: '阳光明媚的草原，适合新手驯兽师探索',
            level: 1,
            unlocked: true,
            completed: false,
            background: '#90EE90',
            monsters: ['fire_fox', 'grass_bunny', 'water_turtle', 'thunder_mouse'],
            bossLevel: 5,
            bossMonster: 'grass_bunny_ii',
            stages: 5,
            rewards: {
                exp: 50,
                coins: 100,
                items: ['poke_ball', 'potion']
            }
        },
        {
            id: 'forest',
            name: '神秘森林',
            description: '茂密的森林中隐藏着许多异兽',
            level: 3,
            unlocked: false,
            completed: false,
            background: '#228B22',
            monsters: ['grass_bunny_ii', 'fire_fox_ii', 'water_turtle_ii', 'thunder_mouse_ii'],
            bossLevel: 8,
            bossMonster: 'grass_giant',
            stages: 6,
            rewards: {
                exp: 100,
                coins: 200,
                items: ['great_ball', 'super_potion']
            }
        },
        {
            id: 'lake',
            name: '碧蓝湖泊',
            description: '清澈的湖泊旁栖息着水系异兽',
            level: 5,
            unlocked: false,
            completed: false,
            background: '#4169E1',
            monsters: ['water_turtle_ii', 'fire_fox_ii', 'grass_bunny_ii', 'thunder_mouse_ii'],
            bossLevel: 12,
            bossMonster: 'water_serpent',
            stages: 7,
            rewards: {
                exp: 150,
                coins: 300,
                items: ['ultra_ball', 'hyper_potion']
            }
        },
        {
            id: 'volcano',
            name: '炎热火山',
            description: '炽热的火山区域，火系异兽的乐园',
            level: 8,
            unlocked: false,
            completed: false,
            background: '#FF4500',
            monsters: ['fire_fox_ii', 'thunder_mouse_ii', 'water_turtle_ii', 'grass_bunny_ii'],
            bossLevel: 15,
            bossMonster: 'fire_dragon',
            stages: 8,
            rewards: {
                exp: 200,
                coins: 400,
                items: ['master_ball', 'max_potion']
            }
        },
        {
            id: 'thunder_peak',
            name: '雷霆之巅',
            description: '电闪雷鸣的高峰，雷系异兽聚集',
            level: 12,
            unlocked: false,
            completed: false,
            background: '#FFD700',
            monsters: ['thunder_mouse_ii', 'fire_fox_ii', 'water_turtle_ii', 'grass_bunny_ii'],
            bossLevel: 20,
            bossMonster: 'thunder_eagle',
            stages: 9,
            rewards: {
                exp: 300,
                coins: 500,
                items: ['master_ball', 'elixir']
            }
        },
        {
            id: 'legendary_island',
            name: '传说之岛',
            description: '只有顶级驯兽师才能到达的神秘岛屿',
            level: 20,
            unlocked: false,
            completed: false,
            background: '#9400D3',
            monsters: ['fire_dragon', 'water_serpent', 'grass_giant', 'thunder_eagle'],
            bossLevel: 30,
            bossMonster: 'phoenix',
            stages: 10,
            rewards: {
                exp: 500,
                coins: 1000,
                items: ['master_ball', 'rare_candy']
            }
        }
    ],

    items: {
        poke_ball: {
            id: 'poke_ball',
            name: '精灵球',
            description: '基础的捕捉道具',
            catchBonus: 0,
            type: 'ball'
        },
        great_ball: {
            id: 'great_ball',
            name: '超级球',
            description: '比精灵球更容易捕捉异兽',
            catchBonus: 0.15,
            type: 'ball'
        },
        ultra_ball: {
            id: 'ultra_ball',
            name: '高级球',
            description: '捕捉率大幅提升',
            catchBonus: 0.25,
            type: 'ball'
        },
        master_ball: {
            id: 'master_ball',
            name: '大师球',
            description: '必定捕捉成功',
            catchBonus: 1.0,
            type: 'ball'
        },
        potion: {
            id: 'potion',
            name: '药水',
            description: '恢复50点生命值',
            healAmount: 50,
            type: 'heal'
        },
        super_potion: {
            id: 'super_potion',
            name: '高级药水',
            description: '恢复100点生命值',
            healAmount: 100,
            type: 'heal'
        },
        hyper_potion: {
            id: 'hyper_potion',
            name: '超级药水',
            description: '恢复200点生命值',
            healAmount: 200,
            type: 'heal'
        },
        max_potion: {
            id: 'max_potion',
            name: '全满药水',
            description: '完全恢复生命值',
            healAmount: 999,
            type: 'heal'
        },
        elixir: {
            id: 'elixir',
            name: '灵药',
            description: '完全恢复所有异兽的生命值',
            healAmount: 999,
            type: 'full_heal'
        },
        rare_candy: {
            id: 'rare_candy',
            name: '神奇糖果',
            description: '提升异兽一级',
            type: 'level_up'
        }
    },

    getAreaById(id) {
        return this.areas.find(a => a.id === id);
    },

    getItemById(id) {
        return this.items[id];
    },

    getStageMonsters(areaId, stageIndex) {
        const area = this.getAreaById(areaId);
        if (!area) return [];

        const level = area.level + Math.floor(stageIndex / 2);
        const monsters = [];
        const count = Math.min(1 + Math.floor(stageIndex / 3), 3);

        for (let i = 0; i < count; i++) {
            const monsterId = area.monsters[Math.floor(Math.random() * area.monsters.length)];
            const monster = MonsterData.createMonsterInstance(monsterId, level);
            monsters.push(monster);
        }

        return monsters;
    },

    getBossMonster(areaId) {
        const area = this.getAreaById(areaId);
        if (!area) return null;

        return MonsterData.createMonsterInstance(area.bossMonster, area.bossLevel);
    },

    calculateCatchRate(ball, monster) {
        const rarity = MonsterData.rarities[monster.rarity.toUpperCase()];
        const baseRate = rarity.catchRate;
        const hpRatio = monster.currentHp / monster.maxHp;
        const hpBonus = (1 - hpRatio) * 0.5;

        return Math.min(0.95, baseRate + hpBonus + ball.catchBonus);
    }
};
