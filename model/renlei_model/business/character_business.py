from sqlalchemy.orm import Session
from ..models import Character


class CharacterBusiness:
    @staticmethod
    def create_character(db: Session, name: str, description: str = None, color: str = "#FFB6C1",
                        head_color: str = "#FFE4E1", body_color: str = "#FFB6C1",
                        unlock_condition: str = None, is_default: bool = False):
        character = Character(
            name=name,
            description=description,
            color=color,
            head_color=head_color,
            body_color=body_color,
            unlock_condition=unlock_condition,
            is_default=is_default
        )
        db.add(character)
        db.commit()
        db.refresh(character)
        return character

    @staticmethod
    def get_character_by_id(db: Session, character_id: int):
        return db.query(Character).filter(Character.id == character_id).first()

    @staticmethod
    def list_characters(db: Session):
        return db.query(Character).all()

    @staticmethod
    def get_default_characters(db: Session):
        return db.query(Character).filter(Character.is_default == True).all()

    @staticmethod
    def update_character(db: Session, character_id: int, **kwargs):
        character = CharacterBusiness.get_character_by_id(db, character_id)
        if not character:
            return None
        for key, value in kwargs.items():
            if hasattr(character, key) and value is not None:
                setattr(character, key, value)
        db.commit()
        db.refresh(character)
        return character

    @staticmethod
    def delete_character(db: Session, character_id: int):
        character = CharacterBusiness.get_character_by_id(db, character_id)
        if not character:
            return False
        db.delete(character)
        db.commit()
        return True

    @staticmethod
    def init_default_characters(db: Session):
        default_characters = [
            {
                "name": "粉色布偶",
                "description": "可爱的粉色布偶小人，软绵绵的很萌",
                "color": "#FFB6C1",
                "head_color": "#FFE4E1",
                "body_color": "#FFB6C1",
                "is_default": True
            },
            {
                "name": "蓝色精灵",
                "description": "活泼的蓝色布偶，跳跃力超强",
                "color": "#87CEEB",
                "head_color": "#E0F7FF",
                "body_color": "#87CEEB",
                "is_default": True
            },
            {
                "name": "绿色萌宠",
                "description": "清新的绿色布偶，平衡力极佳",
                "color": "#90EE90",
                "head_color": "#F0FFF0",
                "body_color": "#90EE90",
                "is_default": True
            },
            {
                "name": "橙色小丑",
                "description": "搞怪的橙色布偶，自带滑稽属性",
                "color": "#FFA500",
                "head_color": "#FFEFD5",
                "body_color": "#FFA500",
                "is_default": True
            }
        ]

        existing = db.query(Character).filter(Character.is_default == True).count()
        if existing > 0:
            return

        for char_data in default_characters:
            CharacterBusiness.create_character(db, **char_data)
