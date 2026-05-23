const SkillData = {
    skillCategories: {
        NORMAL: 'normal',
        ELEMENT: 'element',
        DEFENSE: 'defense',
        HEAL: 'heal',
        ULTIMATE: 'ultimate'
    },

    statusEffects: {
        BURN: {
            id: 'burn',
            name: '灼烧',
            description: '每回合损失生命值',
            color: '#FF5722',
            duration: 3,
            damagePerTurn: 5
        },
        STUN: {
            id: 'stun',
            name: '禁锢',
            description: '无法行动',
            color: '#9C27B0',
            duration: 1
        },
        SHIELD: {
            id: 'shield',
            name: '护盾',
            description: '减少受到的伤害',
            color: '#2196F3',
            duration: 2,
            damageReduction: 0.5
        },
        ATK_UP: {
            id: 'atk_up',
            name: '攻击强化',
            description: '攻击力提升',
            color: '#FF9800',
            duration: 3,
            multiplier: 1.5
        },
        DEF_UP: {
            id: 'def_up',
            name: '防御强化',
            description: '防御力提升',
            color: '#4CAF50',
            duration: 3,
            multiplier: 1.5
        },
        POISON: {
            id: 'poison',
            name: '中毒',
            description: '每回合损失生命值',
            color: '#8BC34A',
            duration: 3,
            damagePerTurn: 8
        },
        REGEN: {
            id: 'regen',
            name: '再生',
            description: '每回合恢复生命值',
            color: '#00BCD4',
            duration: 3,
            healPerTurn: 10
        }
    },

    skills: {
        tackle: {
            id: 'tackle',
            name: '撞击',
            category: 'normal',
            type: 'normal',
            power: 1.0,
            description: '普通的物理攻击',
            cost: 0,
            effect: null
        },
        defense: {
            id: 'defense',
            name: '防御',
            category: 'defense',
            type: 'normal',
            power: 0,
            description: '蓄力防御，减少受到的伤害',
            cost: 0,
            effect: {
                status: 'def_up',
                self: true
            }
        },
        heal: {
            id: 'heal',
            name: '治愈',
            category: 'heal',
            type: 'normal',
            power: 0,
            description: '恢复自身生命值',
            cost: 0,
            healAmount: 30,
            effect: {
                status: 'regen',
                self: true
            }
        },
        fire_ball: {
            id: 'fire_ball',
            name: '火球',
            category: 'element',
            type: 'fire',
            power: 1.3,
            description: '释放火球攻击敌人',
            cost: 0,
            effect: {
                status: 'burn',
                chance: 0.3
            }
        },
        flame_wave: {
            id: 'flame_wave',
            name: '烈焰波',
            category: 'element',
            type: 'fire',
            power: 1.5,
            description: '释放强力火焰波浪',
            cost: 0,
            effect: {
                status: 'burn',
                chance: 0.5
            }
        },
        water_gun: {
            id: 'water_gun',
            name: '水枪',
            category: 'element',
            type: 'water',
            power: 1.2,
            description: '喷射水流攻击',
            cost: 0,
            effect: null
        },
        tsunami: {
            id: 'tsunami',
            name: '海啸',
            category: 'element',
            type: 'water',
            power: 1.6,
            description: '召唤海啸冲击敌人',
            cost: 0,
            effect: {
                status: 'stun',
                chance: 0.2
            }
        },
        leaf_blade: {
            id: 'leaf_blade',
            name: '叶刃',
            category: 'element',
            type: 'grass',
            power: 1.2,
            description: '锋利的叶片攻击',
            cost: 0,
            effect: {
                status: 'poison',
                chance: 0.3
            }
        },
        vine_whip: {
            id: 'vine_whip',
            name: '藤蔓鞭',
            category: 'element',
            type: 'grass',
            power: 1.5,
            description: '藤蔓缠绕攻击',
            cost: 0,
            effect: {
                status: 'poison',
                chance: 0.5
            }
        },
        thunder_shock: {
            id: 'thunder_shock',
            name: '电击',
            category: 'element',
            type: 'thunder',
            power: 1.2,
            description: '释放电流攻击',
            cost: 0,
            effect: {
                status: 'stun',
                chance: 0.2
            }
        },
        thunder_bolt: {
            id: 'thunder_bolt',
            name: '雷电',
            category: 'element',
            type: 'thunder',
            power: 1.6,
            description: '召唤雷电劈向敌人',
            cost: 0,
            effect: {
                status: 'stun',
                chance: 0.4
            }
        },
        flame_burst: {
            id: 'flame_burst',
            name: '爆焰',
            category: 'ultimate',
            type: 'fire',
            power: 2.0,
            description: '火狐的奥义技能，释放强大火焰',
            cost: 0,
            effect: {
                status: 'burn',
                chance: 1.0
            }
        },
        inferno: {
            id: 'inferno',
            name: '地狱业火',
            category: 'ultimate',
            type: 'fire',
            power: 2.5,
            description: '烈焰狐的奥义，召唤地狱之火',
            cost: 0,
            effect: {
                status: 'burn',
                chance: 1.0
            }
        },
        aqua_shield: {
            id: 'aqua_shield',
            name: '水之护盾',
            category: 'ultimate',
            type: 'water',
            power: 1.8,
            description: '水龟的奥义，水盾护体',
            cost: 0,
            effect: {
                status: 'shield',
                self: true
            }
        },
        tidal_wave: {
            id: 'tidal_wave',
            name: '潮汐波涛',
            category: 'ultimate',
            type: 'water',
            power: 2.5,
            description: '深海龟的奥义，巨浪冲击',
            cost: 0,
            effect: {
                status: 'stun',
                chance: 0.5
            }
        },
        nature_blessing: {
            id: 'nature_blessing',
            name: '自然祝福',
            category: 'ultimate',
            type: 'grass',
            power: 1.5,
            description: '草兔的奥义，获得自然之力',
            cost: 0,
            healAmount: 50,
            effect: {
                status: 'regen',
                self: true
            }
        },
        forest_wrath: {
            id: 'forest_wrath',
            name: '森林之怒',
            category: 'ultimate',
            type: 'grass',
            power: 2.5,
            description: '森灵兔的奥义，森林的愤怒',
            cost: 0,
            effect: {
                status: 'poison',
                chance: 1.0
            }
        },
        thunder_storm: {
            id: 'thunder_storm',
            name: '雷暴',
            category: 'ultimate',
            type: 'thunder',
            power: 2.0,
            description: '雷鼠的奥义，召唤雷暴',
            cost: 0,
            effect: {
                status: 'stun',
                chance: 0.5
            }
        },
        lightning_strike: {
            id: 'lightning_strike',
            name: '雷霆一击',
            category: 'ultimate',
            type: 'thunder',
            power: 2.5,
            description: '雷霆鼠的奥义，毁灭性雷击',
            cost: 0,
            effect: {
                status: 'stun',
                chance: 1.0
            }
        },
        dragon_breath: {
            id: 'dragon_breath',
            name: '龙息',
            category: 'ultimate',
            type: 'fire',
            power: 3.0,
            description: '炎龙的奥义，炽热龙息',
            cost: 0,
            effect: {
                status: 'burn',
                chance: 1.0
            }
        },
        sea_dragon_roar: {
            id: 'sea_dragon_roar',
            name: '海龙怒吼',
            category: 'ultimate',
            type: 'water',
            power: 3.0,
            description: '海蛇的奥义，震耳欲聋的咆哮',
            cost: 0,
            effect: {
                status: 'stun',
                chance: 0.8
            }
        },
        world_tree: {
            id: 'world_tree',
            name: '世界树',
            category: 'ultimate',
            type: 'grass',
            power: 2.8,
            description: '巨树精灵的奥义，世界树的力量',
            cost: 0,
            healAmount: 80,
            effect: {
                status: 'regen',
                self: true,
                chance: 1.0
            }
        },
        sky_thunder: {
            id: 'sky_thunder',
            name: '天际雷霆',
            category: 'ultimate',
            type: 'thunder',
            power: 3.0,
            description: '雷鹰的奥义，天降神雷',
            cost: 0,
            effect: {
                status: 'stun',
                chance: 0.7
            }
        },
        rebirth_flame: {
            id: 'rebirth_flame',
            name: '重生之炎',
            category: 'ultimate',
            type: 'fire',
            power: 3.5,
            description: '凤凰的奥义，浴火重生',
            cost: 0,
            healAmount: 100,
            effect: {
                status: 'burn',
                chance: 1.0
            }
        },
        ocean_domination: {
            id: 'ocean_domination',
            name: '海洋主宰',
            category: 'ultimate',
            type: 'water',
            power: 3.5,
            description: '海皇的奥义，绝对的控水能力',
            cost: 0,
            effect: {
                status: 'shield',
                self: true,
                chance: 1.0
            }
        },
        nature_will: {
            id: 'nature_will',
            name: '自然意志',
            category: 'ultimate',
            type: 'grass',
            power: 3.2,
            description: '世界树灵的奥义，自然的意志',
            cost: 0,
            healAmount: 120,
            effect: {
                status: 'regen',
                self: true,
                chance: 1.0
            }
        },
        divine_thunder: {
            id: 'divine_thunder',
            name: '神圣天罚',
            category: 'ultimate',
            type: 'thunder',
            power: 3.5,
            description: '雷神的奥义，神圣的审判',
            cost: 0,
            effect: {
                status: 'stun',
                chance: 1.0
            }
        }
    },

    getSkillById(id) {
        return this.skills[id];
    },

    getSkillsByCategory(category) {
        return Object.values(this.skills).filter(s => s.category === category);
    },

    getSkillsByType(type) {
        return Object.values(this.skills).filter(s => s.type === type);
    },

    applyStatusEffect(monster, effectId) {
        const effect = this.statusEffects[effectId.toUpperCase()];
        if (!effect) return;

        const existingEffect = monster.statusEffects.find(e => e.id === effectId);
        if (existingEffect) {
            existingEffect.duration = effect.duration;
        } else {
            monster.statusEffects.push({
                id: effectId,
                name: effect.name,
                color: effect.color,
                duration: effect.duration,
                damagePerTurn: effect.damagePerTurn || 0,
                healPerTurn: effect.healPerTurn || 0,
                damageReduction: effect.damageReduction || 0,
                multiplier: effect.multiplier || 1
            });
        }
    },

    processStatusEffects(monster) {
        const results = {
            damage: 0,
            heal: 0,
            skipTurn: false,
            messages: []
        };

        monster.statusEffects = monster.statusEffects.filter(effect => {
            if (effect.damagePerTurn) {
                results.damage += effect.damagePerTurn;
                results.messages.push(`${monster.name} 受到 ${effect.damagePerTurn} 点 ${effect.name} 伤害`);
            }
            if (effect.healPerTurn) {
                results.heal += effect.healPerTurn;
                results.messages.push(`${monster.name} 恢复 ${effect.healPerTurn} 点生命`);
            }
            if (effect.id === 'stun') {
                results.skipTurn = true;
                results.messages.push(`${monster.name} 被禁锢，无法行动`);
            }

            effect.duration--;
            return effect.duration > 0;
        });

        return results;
    },

    getDamageMultiplier(monster) {
        let multiplier = 1;
        monster.statusEffects.forEach(effect => {
            if (effect.multiplier && effect.id === 'atk_up') {
                multiplier *= effect.multiplier;
            }
        });
        return multiplier;
    },

    getDefenseMultiplier(monster) {
        let multiplier = 1;
        monster.statusEffects.forEach(effect => {
            if (effect.id === 'def_up') {
                multiplier *= effect.multiplier;
            }
            if (effect.damageReduction) {
                multiplier *= (1 - effect.damageReduction);
            }
        });
        return multiplier;
    },

    calculateDamage(attacker, defender, skill) {
        const baseDamage = Math.floor(attacker.atk * skill.power * this.getDamageMultiplier(attacker));
        const typeAdv = MonsterData.getTypeAdvantage(skill.type, defender.type);
        const defense = defender.def * this.getDefenseMultiplier(defender);
        const damage = Math.max(1, Math.floor(baseDamage * typeAdv - defense * 0.5));
        return {
            damage,
            typeAdvantage: typeAdv,
            isCritical: typeAdv > 1
        };
    }
};
