from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import Submarine, Creature, Treasure, Equipment, Music, Ruin


def init_submarines(db: Session):
    submarines = [
        {
            "name": "探索者号",
            "description": "基础潜水艇，适合初级探险者使用",
            "max_depth": 100.0,
            "speed": 1.0,
            "capacity": 10,
            "pressure_resistance": 100.0,
            "durability": 100,
            "price": 0,
            "currency_type": "coins",
            "unlock_level": 1,
            "is_default": 1
        },
        {
            "name": "深渊号",
            "description": "升级型潜水艇，可下潜至更深的海域",
            "max_depth": 300.0,
            "speed": 1.5,
            "capacity": 15,
            "pressure_resistance": 300.0,
            "durability": 150,
            "price": 5000,
            "currency_type": "coins",
            "unlock_level": 5,
            "is_default": 0
        },
        {
            "name": "海皇号",
            "description": "顶级潜水艇，探索深海的终极利器",
            "max_depth": 1000.0,
            "speed": 2.0,
            "capacity": 25,
            "pressure_resistance": 1000.0,
            "durability": 200,
            "price": 50,
            "currency_type": "gems",
            "unlock_level": 10,
            "is_default": 0
        }
    ]
    for s in submarines:
        db.add(Submarine(**s))
    db.commit()


def init_creatures(db: Session):
    creatures = [
        {
            "name": "小丑鱼",
            "scientific_name": "Amphiprioninae",
            "description": "可爱的热带海水鱼，喜欢躲在海葵中",
            "rarity": "common",
            "category": "fish",
            "min_depth": 0.0,
            "max_depth": 50.0,
            "coins_value": 10,
            "exp_value": 5,
            "is_dangerous": 0,
            "damage": 0,
            "speed": 1.0,
            "behavior": "passive"
        },
        {
            "name": "蓝唐王鱼",
            "scientific_name": "Paracanthurus hepatus",
            "description": "美丽的蓝色热带鱼",
            "rarity": "common",
            "category": "fish",
            "min_depth": 0.0,
            "max_depth": 80.0,
            "coins_value": 15,
            "exp_value": 8,
            "is_dangerous": 0,
            "damage": 0,
            "speed": 1.2,
            "behavior": "passive"
        },
        {
            "name": "狮子鱼",
            "scientific_name": "Pterois",
            "description": "拥有美丽的鳍，但刺有毒",
            "rarity": "uncommon",
            "category": "fish",
            "min_depth": 20.0,
            "max_depth": 150.0,
            "coins_value": 30,
            "exp_value": 15,
            "is_dangerous": 1,
            "damage": 10,
            "speed": 0.8,
            "behavior": "aggressive"
        },
        {
            "name": "水母",
            "scientific_name": "Scyphozoa",
            "description": "透明的浮游生物，触手带有毒素",
            "rarity": "common",
            "category": "invertebrate",
            "min_depth": 0.0,
            "max_depth": 200.0,
            "coins_value": 20,
            "exp_value": 10,
            "is_dangerous": 1,
            "damage": 5,
            "speed": 0.5,
            "behavior": "passive"
        },
        {
            "name": "巨型章鱼",
            "scientific_name": "Enteroctopus",
            "description": "深海中的智慧生物",
            "rarity": "rare",
            "category": "invertebrate",
            "min_depth": 200.0,
            "max_depth": 500.0,
            "coins_value": 100,
            "exp_value": 50,
            "is_dangerous": 1,
            "damage": 25,
            "speed": 1.5,
            "behavior": "defensive"
        },
        {
            "name": "大王乌贼",
            "scientific_name": "Architeuthis",
            "description": "传说中的深海巨怪",
            "rarity": "legendary",
            "category": "invertebrate",
            "min_depth": 500.0,
            "max_depth": 1000.0,
            "coins_value": 500,
            "exp_value": 200,
            "is_dangerous": 1,
            "damage": 50,
            "speed": 2.0,
            "behavior": "aggressive"
        },
        {
            "name": "灯笼鱼",
            "scientific_name": "Myctophidae",
            "description": "会发光的深海小鱼",
            "rarity": "uncommon",
            "category": "fish",
            "min_depth": 100.0,
            "max_depth": 400.0,
            "coins_value": 40,
            "exp_value": 20,
            "is_dangerous": 0,
            "damage": 0,
            "speed": 1.0,
            "behavior": "passive"
        },
        {
            "name": "吞噬鳗",
            "scientific_name": "Eurypharynx pelecanoides",
            "description": "拥有巨大嘴巴的深海怪鱼",
            "rarity": "rare",
            "category": "fish",
            "min_depth": 300.0,
            "max_depth": 800.0,
            "coins_value": 150,
            "exp_value": 75,
            "is_dangerous": 1,
            "damage": 30,
            "speed": 1.2,
            "behavior": "aggressive"
        }
    ]
    for c in creatures:
        db.add(Creature(**c))
    db.commit()


def init_treasures(db: Session):
    treasures = [
        {
            "name": "金币袋",
            "description": "装满金币的小袋子",
            "rarity": "common",
            "category": "coin",
            "min_depth": 0.0,
            "max_depth": 100.0,
            "coins_value": 50,
            "gems_value": 0,
            "exp_value": 10,
            "weight": 1.0
        },
        {
            "name": "珍珠",
            "description": "美丽的天然珍珠",
            "rarity": "uncommon",
            "category": "gem",
            "min_depth": 20.0,
            "max_depth": 200.0,
            "coins_value": 100,
            "gems_value": 0,
            "exp_value": 25,
            "weight": 0.5
        },
        {
            "name": "海盗宝箱",
            "description": "古老海盗留下的宝箱",
            "rarity": "rare",
            "category": "chest",
            "min_depth": 100.0,
            "max_depth": 500.0,
            "coins_value": 500,
            "gems_value": 5,
            "exp_value": 100,
            "weight": 5.0
        },
        {
            "name": "古代金币",
            "description": "来自失落文明的金币",
            "rarity": "rare",
            "category": "coin",
            "min_depth": 200.0,
            "max_depth": 600.0,
            "coins_value": 200,
            "gems_value": 0,
            "exp_value": 50,
            "weight": 0.1
        },
        {
            "name": "海洋之心",
            "description": "传说中的蓝色宝石",
            "rarity": "legendary",
            "category": "gem",
            "min_depth": 500.0,
            "max_depth": 1000.0,
            "coins_value": 0,
            "gems_value": 50,
            "exp_value": 500,
            "weight": 0.2
        },
        {
            "name": "沉船遗骸",
            "description": "古代沉船的残骸",
            "rarity": "epic",
            "category": "relic",
            "min_depth": 300.0,
            "max_depth": 800.0,
            "coins_value": 1000,
            "gems_value": 20,
            "exp_value": 300,
            "weight": 10.0
        }
    ]
    for t in treasures:
        db.add(Treasure(**t))
    db.commit()


def init_equipment(db: Session):
    equipments = [
        {
            "name": "抗压外壳 I",
            "description": "增强潜水艇的抗压能力",
            "type": "pressure",
            "rarity": "common",
            "level": 1,
            "effect_type": "pressure_resistance",
            "effect_value": 50.0,
            "price": 500,
            "currency_type": "coins",
            "unlock_level": 1,
            "upgrade_cost": 250,
            "max_level": 5
        },
        {
            "name": "推进器升级 I",
            "description": "提升潜水艇的移动速度",
            "type": "speed",
            "rarity": "common",
            "level": 1,
            "effect_type": "speed",
            "effect_value": 0.2,
            "price": 300,
            "currency_type": "coins",
            "unlock_level": 2,
            "upgrade_cost": 150,
            "max_level": 5
        },
        {
            "name": "货舱扩展 I",
            "description": "增加潜水艇的存储空间",
            "type": "capacity",
            "rarity": "common",
            "level": 1,
            "effect_type": "capacity",
            "effect_value": 5.0,
            "price": 400,
            "currency_type": "coins",
            "unlock_level": 3,
            "upgrade_cost": 200,
            "max_level": 5
        },
        {
            "name": "声纳系统",
            "description": "探测附近的宝藏和生物",
            "type": "scanner",
            "rarity": "uncommon",
            "level": 1,
            "effect_type": "scan_range",
            "effect_value": 50.0,
            "price": 1000,
            "currency_type": "coins",
            "unlock_level": 5,
            "upgrade_cost": 500,
            "max_level": 3
        },
        {
            "name": "护盾发生器",
            "description": "抵御危险生物的攻击",
            "type": "defense",
            "rarity": "rare",
            "level": 1,
            "effect_type": "defense",
            "effect_value": 20.0,
            "price": 2000,
            "currency_type": "coins",
            "unlock_level": 7,
            "upgrade_cost": 1000,
            "max_level": 3
        }
    ]
    for e in equipments:
        db.add(Equipment(**e))
    db.commit()


def init_music(db: Session):
    musics = [
        {
            "name": "海洋晨曦",
            "description": "轻柔的钢琴曲，适合浅海探索",
            "genre": "ambient",
            "bpm": 80,
            "mood": "calm",
            "duration": 240,
            "unlock_level": 1,
            "price": 0,
            "currency_type": "coins",
            "is_default": 1
        },
        {
            "name": "深海漫游",
            "description": "神秘的合成器音乐",
            "genre": "ambient",
            "bpm": 90,
            "mood": "mysterious",
            "duration": 300,
            "unlock_level": 3,
            "price": 500,
            "currency_type": "coins",
            "is_default": 0
        },
        {
            "name": "珊瑚礁舞曲",
            "description": "欢快的节奏，适合收集宝藏",
            "genre": "electronic",
            "bpm": 120,
            "mood": "upbeat",
            "duration": 200,
            "unlock_level": 5,
            "price": 800,
            "currency_type": "coins",
            "is_default": 0
        },
        {
            "name": "深渊之音",
            "description": "低沉的音效，挑战极限深度",
            "genre": "dark_ambient",
            "bpm": 60,
            "mood": "tense",
            "duration": 360,
            "unlock_level": 8,
            "price": 1500,
            "currency_type": "coins",
            "is_default": 0
        },
        {
            "name": "海底史诗",
            "description": "壮丽的管弦乐，探索遗迹专用",
            "genre": "orchestral",
            "bpm": 100,
            "mood": "epic",
            "duration": 280,
            "unlock_level": 10,
            "price": 10,
            "currency_type": "gems",
            "is_default": 0
        }
    ]
    for m in musics:
        db.add(Music(**m))
    db.commit()


def init_ruins(db: Session):
    ruins = [
        {
            "name": "沉没的货轮",
            "description": "一艘近代沉没的货轮，可能有些物资",
            "depth": 100.0,
            "difficulty": "easy",
            "treasure_reward": 200,
            "exp_reward": 100,
            "required_level": 2,
            "is_discovered": 0,
            "story": "这艘货轮在一次暴风雨中沉没，据说装载了大量的货物。"
        },
        {
            "name": "古代神殿",
            "description": "传说中沉入海底的神秘神殿",
            "depth": 300.0,
            "difficulty": "medium",
            "treasure_reward": 1000,
            "exp_reward": 500,
            "required_level": 5,
            "is_discovered": 0,
            "story": "一座来自失落文明的神殿，据说守护着无价的宝藏。"
        },
        {
            "name": "海底火山口",
            "description": "危险的活火山区域，但有着稀有的矿物",
            "depth": 500.0,
            "difficulty": "hard",
            "treasure_reward": 3000,
            "exp_reward": 1500,
            "required_level": 8,
            "is_discovered": 0,
            "story": "海底火山周围孕育着稀有的宝石，但也充满了危险。"
        },
        {
            "name": "亚特兰蒂斯遗迹",
            "description": "传说中的亚特兰蒂斯城遗迹",
            "depth": 800.0,
            "difficulty": "extreme",
            "treasure_reward": 10000,
            "exp_reward": 5000,
            "required_level": 12,
            "is_discovered": 0,
            "story": "传说中高度文明的亚特兰蒂斯城在一夜之间沉入海底，这里可能隐藏着改变世界的秘密。"
        }
    ]
    for r in ruins:
        db.add(Ruin(**r))
    db.commit()


def init_all_data():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        init_submarines(db)
        init_creatures(db)
        init_treasures(db)
        init_equipment(db)
        init_music(db)
        init_ruins(db)
        print("数据初始化完成！")
    finally:
        db.close()


if __name__ == "__main__":
    init_all_data()
