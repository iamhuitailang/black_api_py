from sqlalchemy.orm import Session
from model.feixingqi_model.models.item import Item
from model.feixingqi_model.models.user_item import UserItem
from typing import List, Optional, Tuple

class ItemBusiness:
    @staticmethod
    def create_item(db: Session, item_name: str, item_type: str, description: str, effect: str, price: int = 0, rarity: str = "common", item_icon: str = None) -> Item:
        item = Item(
            item_name=item_name,
            item_type=item_type,
            item_icon=item_icon,
            description=description,
            effect=effect,
            price=price,
            rarity=rarity
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def get_item_by_id(db: Session, item_id: int) -> Optional[Item]:
        return db.query(Item).filter(Item.id == item_id).first()

    @staticmethod
    def get_item_list(db: Session, page: int = 1, page_size: int = 10, item_type: str = None, rarity: str = None) -> Tuple[List[Item], int]:
        query = db.query(Item).filter(Item.status == 1)
        if item_type:
            query = query.filter(Item.item_type == item_type)
        if rarity:
            query = query.filter(Item.rarity == rarity)
        total = query.count()
        items = query.order_by(Item.id).offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    @staticmethod
    def update_item(db: Session, item_id: int, **kwargs) -> Optional[Item]:
        item = db.query(Item).filter(Item.id == item_id).first()
        if item:
            for key, value in kwargs.items():
                if hasattr(item, key) and value is not None:
                    setattr(item, key, value)
            db.commit()
            db.refresh(item)
        return item

    @staticmethod
    def delete_item(db: Session, item_id: int) -> bool:
        item = db.query(Item).filter(Item.id == item_id).first()
        if item:
            item.status = 0
            db.commit()
            return True
        return False

    @staticmethod
    def get_user_items(db: Session, user_id: int) -> List[dict]:
        user_items = db.query(UserItem).filter(UserItem.user_id == user_id).all()
        result = []
        for ui in user_items:
            item = db.query(Item).filter(Item.id == ui.item_id).first()
            if item and item.status == 1 and ui.quantity > 0:
                result.append({
                    "id": item.id,
                    "item_name": item.item_name,
                    "item_type": item.item_type,
                    "item_icon": item.item_icon,
                    "description": item.description,
                    "effect": item.effect,
                    "rarity": item.rarity,
                    "quantity": ui.quantity
                })
        return result

    @staticmethod
    def add_user_item(db: Session, user_id: int, item_id: int, quantity: int = 1) -> Optional[UserItem]:
        user_item = db.query(UserItem).filter(UserItem.user_id == user_id, UserItem.item_id == item_id).first()
        if user_item:
            user_item.quantity += quantity
        else:
            user_item = UserItem(user_id=user_id, item_id=item_id, quantity=quantity)
            db.add(user_item)
        db.commit()
        db.refresh(user_item)
        return user_item

    @staticmethod
    def use_user_item(db: Session, user_id: int, item_id: int, quantity: int = 1) -> bool:
        user_item = db.query(UserItem).filter(UserItem.user_id == user_id, UserItem.item_id == item_id).first()
        if user_item and user_item.quantity >= quantity:
            user_item.quantity -= quantity
            db.commit()
            return True
        return False

    @staticmethod
    def init_default_items(db: Session):
        if db.query(Item).count() == 0:
            default_items = [
                {"item_name": "双倍骰子", "item_type": "dice", "description": "下一次掷骰子点数翻倍", "effect": '{"type": "double_dice"}', "price": 50, "rarity": "common", "item_icon": "🎲"},
                {"item_name": "传送门", "item_type": "move", "description": "传送到任意已方棋子位置", "effect": '{"type": "teleport"}', "price": 80, "rarity": "rare", "item_icon": "🌀"},
                {"item_name": "保护罩", "item_type": "defense", "description": "免疫一次被攻击", "effect": '{"type": "shield"}', "price": 60, "rarity": "common", "item_icon": "🛡️"},
                {"item_name": "导弹", "item_type": "attack", "description": "将任意敌方棋子送回起点", "effect": '{"type": "missile"}', "price": 100, "rarity": "epic", "item_icon": "🚀"},
                {"item_name": "幸运符", "item_type": "luck", "description": "下一次必掷出6点", "effect": '{"type": "lucky_six"}', "price": 120, "rarity": "legendary", "item_icon": "🍀"},
                {"item_name": "时间回溯", "item_type": "special", "description": "撤销上一步操作", "effect": '{"type": "rewind"}', "price": 150, "rarity": "legendary", "item_icon": "⏪"},
            ]
            for item_data in default_items:
                ItemBusiness.create_item(db, **item_data)
