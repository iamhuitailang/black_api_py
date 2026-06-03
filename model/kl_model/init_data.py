from sqlalchemy.orm import Session
from model.kl_model.database.db import SessionLocal
from model.kl_model.models import DinosaurSpecies, GeneModification
from model.kl_model.business.gene_business import GeneBusiness


def init_dinosaur_species(db: Session):
    species_list = [
        {
            "name": "霸王龙",
            "type": "carnivore",
            "era": "白垩纪",
            "diet": "肉食",
            "height": 6.0,
            "length": 12.0,
            "weight": 7000.0,
            "aggression": 90,
            "intelligence": 70,
            "speed": 60,
            "rarity": "legendary",
            "fossil_cost": 500,
            "clone_cost": 5000.0,
            "habitat_type": "forest",
            "description": "白垩纪最强大的食肉恐龙之一，拥有强大的咬合力。"
        },
        {
            "name": "三角龙",
            "type": "herbivore",
            "era": "白垩纪",
            "diet": "草食",
            "height": 3.0,
            "length": 8.0,
            "weight": 6000.0,
            "aggression": 40,
            "intelligence": 50,
            "speed": 35,
            "rarity": "rare",
            "fossil_cost": 200,
            "clone_cost": 2000.0,
            "habitat_type": "grassland",
            "description": "著名的角龙类恐龙，头部有三只角和颈盾。"
        },
        {
            "name": "迅猛龙",
            "type": "carnivore",
            "era": "白垩纪",
            "diet": "肉食",
            "height": 1.5,
            "length": 2.0,
            "weight": 150.0,
            "aggression": 85,
            "intelligence": 80,
            "speed": 90,
            "rarity": "rare",
            "fossil_cost": 250,
            "clone_cost": 2500.0,
            "habitat_type": "desert",
            "description": "聪明且敏捷的小型食肉恐龙，常群体捕猎。"
        },
        {
            "name": "腕龙",
            "type": "herbivore",
            "era": "侏罗纪",
            "diet": "草食",
            "height": 13.0,
            "length": 25.0,
            "weight": 50000.0,
            "aggression": 20,
            "intelligence": 40,
            "speed": 20,
            "rarity": "legendary",
            "fossil_cost": 450,
            "clone_cost": 4500.0,
            "habitat_type": "forest",
            "description": "体型巨大的长颈蜥脚类恐龙，以高处的树叶为食。"
        },
        {
            "name": "剑龙",
            "type": "herbivore",
            "era": "侏罗纪",
            "diet": "草食",
            "height": 4.0,
            "length": 7.0,
            "weight": 3000.0,
            "aggression": 35,
            "intelligence": 35,
            "speed": 30,
            "rarity": "common",
            "fossil_cost": 100,
            "clone_cost": 1000.0,
            "habitat_type": "grassland",
            "description": "背部有标志性的骨板，尾部有尖刺用于防御。"
        },
        {
            "name": "副栉龙",
            "type": "herbivore",
            "era": "白垩纪",
            "diet": "草食",
            "height": 2.5,
            "length": 10.0,
            "weight": 2500.0,
            "aggression": 25,
            "intelligence": 45,
            "speed": 40,
            "rarity": "common",
            "fossil_cost": 120,
            "clone_cost": 1200.0,
            "habitat_type": "forest",
            "description": "具有独特冠饰的鸭嘴龙类，可以发出响亮的叫声。"
        },
        {
            "name": "棘龙",
            "type": "carnivore",
            "era": "白垩纪",
            "diet": "肉食",
            "height": 5.0,
            "length": 15.0,
            "weight": 7500.0,
            "aggression": 85,
            "intelligence": 65,
            "speed": 55,
            "rarity": "legendary",
            "fossil_cost": 550,
            "clone_cost": 5500.0,
            "habitat_type": "aquatic",
            "description": "背上有巨大帆状物的大型食肉恐龙，擅长捕鱼。"
        },
        {
            "name": "肿头龙",
            "type": "herbivore",
            "era": "白垩纪",
            "diet": "草食",
            "height": 2.0,
            "length": 4.5,
            "weight": 450.0,
            "aggression": 50,
            "intelligence": 40,
            "speed": 50,
            "rarity": "common",
            "fossil_cost": 80,
            "clone_cost": 800.0,
            "habitat_type": "mountain",
            "description": "头部有厚实骨盔的恐龙，可能用头部进行撞击。"
        }
    ]

    for species_data in species_list:
        existing = db.query(DinosaurSpecies).filter(DinosaurSpecies.name == species_data["name"]).first()
        if not existing:
            species = DinosaurSpecies(**species_data)
            db.add(species)
    
    db.commit()


def init_gene_modifications(db: Session):
    gene_list = [
        {
            "name": "超级肌肉",
            "code": "super_muscle",
            "type": "physical",
            "description": "增强恐龙的肌肉力量，提升攻击力和速度",
            "effect_aggression": 15,
            "effect_intelligence": 0,
            "effect_speed": 10,
            "effect_health": 5,
            "effect_size": 0.1,
            "rarity": "rare",
            "cost_coins": 5000.0,
            "cost_diamonds": 50.0,
            "success_rate": 0.8,
            "unlock_level": 5
        },
        {
            "name": "强化骨骼",
            "code": "strong_bones",
            "type": "physical",
            "description": "增强恐龙的骨骼结构，提升生命值和防御力",
            "effect_aggression": 0,
            "effect_intelligence": 0,
            "effect_speed": -5,
            "effect_health": 25,
            "effect_size": 0.05,
            "rarity": "common",
            "cost_coins": 2000.0,
            "cost_diamonds": 20.0,
            "success_rate": 0.9,
            "unlock_level": 3
        },
        {
            "name": "智慧基因",
            "code": "smart_gene",
            "type": "mental",
            "description": "提升恐龙的智力，使其更容易训练",
            "effect_aggression": -5,
            "effect_intelligence": 25,
            "effect_speed": 0,
            "effect_health": 0,
            "effect_size": 0.0,
            "rarity": "rare",
            "cost_coins": 4000.0,
            "cost_diamonds": 40.0,
            "success_rate": 0.75,
            "unlock_level": 6
        },
        {
            "name": "急速代谢",
            "code": "fast_metabolism",
            "type": "physical",
            "description": "加快恐龙的新陈代谢，提升速度但增加食量",
            "effect_aggression": 5,
            "effect_intelligence": 0,
            "effect_speed": 20,
            "effect_health": -5,
            "effect_size": -0.05,
            "rarity": "common",
            "cost_coins": 1500.0,
            "cost_diamonds": 15.0,
            "success_rate": 0.85,
            "unlock_level": 2
        },
        {
            "name": "巨型化",
            "code": "gigantism",
            "type": "physical",
            "description": "使恐龙体型变得巨大，提升各项属性但需要更多食物",
            "effect_aggression": 10,
            "effect_intelligence": -10,
            "effect_speed": -10,
            "effect_health": 20,
            "effect_size": 0.3,
            "rarity": "legendary",
            "cost_coins": 10000.0,
            "cost_diamonds": 100.0,
            "success_rate": 0.5,
            "unlock_level": 10
        },
        {
            "name": "迷彩伪装",
            "code": "camouflage",
            "type": "appearance",
            "description": "让恐龙拥有伪装能力，降低攻击性但提升隐蔽性",
            "effect_aggression": -15,
            "effect_intelligence": 10,
            "effect_speed": 5,
            "effect_health": 0,
            "effect_size": 0.0,
            "rarity": "rare",
            "cost_coins": 3500.0,
            "cost_diamonds": 35.0,
            "success_rate": 0.7,
            "unlock_level": 7
        },
        {
            "name": "夜视能力",
            "code": "night_vision",
            "type": "sensory",
            "description": "赋予恐龙夜视能力，在黑暗中也能活动",
            "effect_aggression": 5,
            "effect_intelligence": 10,
            "effect_speed": 5,
            "effect_health": 0,
            "effect_size": 0.0,
            "rarity": "rare",
            "cost_coins": 3000.0,
            "cost_diamonds": 30.0,
            "success_rate": 0.8,
            "unlock_level": 4
        },
        {
            "name": "再生基因",
            "code": "regeneration",
            "type": "physical",
            "description": "让恐龙拥有更强的自愈能力",
            "effect_aggression": 0,
            "effect_intelligence": 0,
            "effect_speed": 0,
            "effect_health": 30,
            "effect_size": 0.0,
            "rarity": "legendary",
            "cost_coins": 8000.0,
            "cost_diamonds": 80.0,
            "success_rate": 0.6,
            "unlock_level": 8
        }
    ]

    for gene_data in gene_list:
        existing = db.query(GeneModification).filter(GeneModification.code == gene_data["code"]).first()
        if not existing:
            gene = GeneModification(**gene_data)
            db.add(gene)
    
    db.commit()


def init_all_data():
    db = SessionLocal()
    try:
        init_dinosaur_species(db)
        init_gene_modifications(db)
        print("初始化数据完成！")
    except Exception as e:
        print(f"初始化数据失败: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_all_data()
