from typing import Optional, Dict, Any
from app.model.chouchou_model import TokenModel, UserModel


class AuthBusiness:
    def __init__(self):
        self.token_model = TokenModel()
        self.user_model = UserModel()

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        if not token:
            return None
        return self.token_model.get_user_by_token(token)

    def create_token(self, user_id: int, hours: int = 24) -> str:
        return self.token_model.create_token(user_id, hours)

    def delete_token(self, token: str) -> int:
        return self.token_model.delete_token(token)

    def delete_by_user_id(self, user_id: int) -> int:
        return self.token_model.delete_by_user_id(user_id)

    def is_admin(self, user_id: int) -> bool:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return False
        return user.get('role') == UserModel.ROLE_ADMIN

    def is_banned(self, user_id: int) -> bool:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return True
        return user.get('status') == UserModel.STATUS_BANNED
