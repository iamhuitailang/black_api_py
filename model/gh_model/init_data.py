from sqlalchemy.orm import Session
from database import SessionLocal
from models import GhostType, Location, Equipment, Task, EvidenceType


def init_ghost_types(db: Session):
    ghosts = [
        {
            "name": "怨灵",
            "description": "因强烈怨恨而无法安息的灵魂，攻击性强",
            "difficulty": 1,
            "weakness": "圣水",
            "evidence_required": 3,
            "behavior": "喜欢在暗处袭击人，会发出凄厉的哭声"
        },
        {
            "name": "幻影",
            "description": "能够模仿人类形态的狡猾鬼魂",
            "difficulty": 2,
            "weakness": "紫外线灯",
            "evidence_required": 3,
            "behavior": "会变成你认识的人的样子来迷惑你"
        },
        {
            "name": "寒灵",
            "description": "能大幅降低周围温度的鬼魂",
            "difficulty": 2,
            "weakness": "火焰法器",
            "evidence_required": 3,
            "behavior": "出现时周围温度会骤降，可以看到呼出的白气"
        },
        {
            "name": "影魔",
            "description": "隐藏在阴影中的强大恶灵",
            "difficulty": 3,
            "weakness": "强光",
            "evidence_required": 4,
            "behavior": "只在完全黑暗的环境中出现，怕光"
        },
        {
            "name": "残念",
            "description": "因未完成的心愿而徘徊的鬼魂",
            "difficulty": 1,
            "weakness": "帮助其完成心愿",
            "evidence_required": 2,
            "behavior": "通常比较温和，会用各种方式传达信息"
        },
        {
            "name": "骚灵",
            "description": "喜欢移动物体制造噪音的淘气鬼魂",
            "difficulty": 2,
            "weakness": "盐阵",
            "evidence_required": 3,
            "behavior": "会投掷物体、制造噪音、开关电器"
        }
    ]
    
    for ghost in ghosts:
        existing = db.query(GhostType).filter(GhostType.name == ghost["name"]).first()
        if not existing:
            db.add(GhostType(**ghost))
    db.commit()


def init_locations(db: Session):
    locations = [
        {
            "name": "废弃学校",
            "description": "传说中跳楼自杀的女学生至今仍在走廊徘徊",
            "difficulty": 1,
            "is_night": False,
            "ghost_count": 1,
            "unlocked_level": 1
        },
        {
            "name": "古老公寓",
            "description": "建于1920年的老公寓，住户离奇死亡后被废弃",
            "difficulty": 2,
            "is_night": False,
            "ghost_count": 2,
            "unlocked_level": 2
        },
        {
            "name": "阴森医院",
            "description": "废弃的精神病院，夜晚传来奇怪的声音",
            "difficulty": 3,
            "is_night": True,
            "ghost_count": 3,
            "unlocked_level": 3
        },
        {
            "name": "诅咒庄园",
            "description": "百年前被灭门的贵族宅邸，据说被下了诅咒",
            "difficulty": 4,
            "is_night": True,
            "ghost_count": 4,
            "unlocked_level": 5
        },
        {
            "name": "闹鬼墓地",
            "description": "传说中盗墓者亵渎了古墓，释放了诅咒",
            "difficulty": 2,
            "is_night": True,
            "ghost_count": 2,
            "unlocked_level": 2
        }
    ]
    
    for location in locations:
        existing = db.query(Location).filter(Location.name == location["name"]).first()
        if not existing:
            db.add(Location(**location))
    db.commit()


def init_equipments(db: Session):
    equipments = [
        {
            "name": "EMF探测器",
            "type": "detector",
            "description": "检测电磁场异常，鬼魂出现时数值会飙升",
            "level": 1,
            "max_level": 5,
            "power": 10,
            "price": 0,
            "upgrade_cost": 50,
            "effect": "探测范围+1米"
        },
        {
            "name": "通灵盒",
            "type": "detector",
            "description": "通过无线电波与鬼魂交流",
            "level": 1,
            "max_level": 5,
            "power": 15,
            "price": 50,
            "upgrade_cost": 80,
            "effect": "提高回应概率"
        },
        {
            "name": "紫外线手电筒",
            "type": "detector",
            "description": "可以看到鬼魂留下的荧光指纹",
            "level": 1,
            "max_level": 5,
            "power": 12,
            "price": 30,
            "upgrade_cost": 60,
            "effect": "照射范围扩大"
        },
        {
            "name": "温度计",
            "type": "detector",
            "description": "检测温度骤降，寒灵出现时会大幅下降",
            "level": 1,
            "max_level": 5,
            "power": 8,
            "price": 20,
            "upgrade_cost": 40,
            "effect": "精度提升"
        },
        {
            "name": "圣水",
            "type": "weapon",
            "description": "经过祝福的圣水，对恶灵有伤害",
            "level": 1,
            "max_level": 3,
            "power": 30,
            "price": 80,
            "upgrade_cost": 100,
            "effect": "伤害+20%"
        },
        {
            "name": "十字架",
            "type": "weapon",
            "description": "神圣的十字架，可以驱逐邪灵",
            "level": 1,
            "max_level": 5,
            "power": 25,
            "price": 100,
            "upgrade_cost": 120,
            "effect": "驱魔成功率+10%"
        },
        {
            "name": "盐阵",
            "type": "trap",
            "description": "布置盐阵可以困住鬼魂",
            "level": 1,
            "max_level": 3,
            "power": 20,
            "price": 40,
            "upgrade_cost": 60,
            "effect": "持续时间+30秒"
        },
        {
            "name": "摄魂铃",
            "type": "weapon",
            "description": "铃声可以驱散鬼魂",
            "level": 1,
            "max_level": 5,
            "power": 35,
            "price": 150,
            "upgrade_cost": 150,
            "effect": "范围+2米"
        }
    ]
    
    for equipment in equipments:
        existing = db.query(Equipment).filter(Equipment.name == equipment["name"]).first()
        if not existing:
            db.add(Equipment(**equipment))
    db.commit()


def init_evidence_types(db: Session):
    evidences = [
        {
            "name": "EMF异常",
            "description": "电磁场出现异常波动",
            "icon": "⚡"
        },
        {
            "name": "鬼魂笔迹",
            "description": "鬼魂在书本上留下的文字",
            "icon": "📝"
        },
        {
            "name": "指纹",
            "description": "紫外线下显现的荧光指纹",
            "icon": "👆"
        },
        {
            "name": "灵球",
            "description": "漂浮的光球，只有摄像机能捕捉",
            "icon": "🔮"
        },
        {
            "name": "温度骤降",
            "description": "温度突然大幅下降",
            "icon": "❄️"
        },
        {
            "name": "通灵回应",
            "description": "通过通灵盒收到的回应",
            "icon": "📻"
        },
        {
            "name": "移动物体",
            "description": "物体自己移动",
            "icon": "🪑"
        }
    ]
    
    for evidence in evidences:
        existing = db.query(EvidenceType).filter(EvidenceType.name == evidence["name"]).first()
        if not existing:
            db.add(EvidenceType(**evidence))
    db.commit()


def init_tasks(db: Session):
    tasks = [
        {
            "title": "废弃学校的怨灵",
            "description": "调查废弃学校三楼女厕所的闹鬼事件",
            "location_id": 1,
            "ghost_type_id": 1,
            "reward_coins": 50,
            "reward_exp": 30,
            "difficulty": 1,
            "story": "这个女孩当年因为被霸凌而跳楼自杀，她的怨念至今无法消散..."
        },
        {
            "title": "公寓里的幻影",
            "description": "有住户声称看到了已故丈夫的身影",
            "location_id": 2,
            "ghost_type_id": 2,
            "reward_coins": 80,
            "reward_exp": 50,
            "difficulty": 2,
            "story": "老夫妻在此居住了50年，丈夫去世后，妻子坚持说能看到他..."
        },
        {
            "title": "医院的寒灵",
            "description": "医院走廊的温度总是异常的低",
            "location_id": 3,
            "ghost_type_id": 3,
            "reward_coins": 120,
            "reward_exp": 80,
            "difficulty": 3,
            "story": "这里曾经是冻伤治疗中心，有病人在极寒中死去..."
        },
        {
            "title": "墓地的残念",
            "description": "有盗墓者在墓地看到了奇怪的身影",
            "location_id": 5,
            "ghost_type_id": 5,
            "reward_coins": 70,
            "reward_exp": 40,
            "difficulty": 2,
            "story": "墓主人的陪葬品被盗，她只是想找回母亲留给她的项链..."
        },
        {
            "title": "庄园的影魔",
            "description": "入夜后，庄园里会传来奇怪的脚步声",
            "location_id": 4,
            "ghost_type_id": 4,
            "reward_coins": 200,
            "reward_exp": 150,
            "difficulty": 4,
            "story": "百年前的灭门惨案，凶手至今逍遥法外，亡灵在等待正义..."
        }
    ]
    
    for task in tasks:
        existing = db.query(Task).filter(Task.title == task["title"]).first()
        if not existing:
            db.add(Task(**task))
    db.commit()


def init_all():
    db = SessionLocal()
    try:
        init_ghost_types(db)
        init_locations(db)
        init_equipments(db)
        init_evidence_types(db)
        init_tasks(db)
        print("数据初始化完成！")
    except Exception as e:
        print(f"初始化失败: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    init_all()
