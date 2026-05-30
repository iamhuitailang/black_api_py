from app.model.zashua02 import UserModel, TokenModel


class Zashua02UserBusiness:
    def __init__(self):
        self.user_model = UserModel()
        self.token_model = TokenModel()

    def register(self, username: str, password: str, nickname: str = "") -> dict:
        if not username or not password:
            return {"code": 1, "msg": "用户名和密码不能为空", "data": None}
        if len(username) < 3 or len(username) > 20:
            return {"code": 1, "msg": "用户名长度应为3-20个字符", "data": None}
        if len(password) < 6:
            return {"code": 1, "msg": "密码长度至少6位", "data": None}
        existing = self.user_model.get_by_username(username)
        if existing:
            return {"code": 1, "msg": "用户名已存在", "data": None}
        try:
            user_id = self.user_model.create(username, password, nickname)
            user = self.user_model.get_by_id(user_id)
            user.pop("password_hash", None)
            user.pop("salt", None)
            return {"code": 0, "msg": "注册成功", "data": {"user": user}}
        except Exception as e:
            return {"code": 1, "msg": f"注册失败: {str(e)}", "data": None}

    def login(self, username: str, password: str) -> dict:
        if not username or not password:
            return {"code": 1, "msg": "用户名和密码不能为空", "data": None}
        user = self.user_model.verify_password(username, password)
        if not user:
            return {"code": 1, "msg": "用户名或密码错误", "data": None}
        token = self.token_model.create(user["id"])
        return {"code": 0, "msg": "登录成功", "data": {"user": user, "token": token}}

    def logout(self, token: str) -> dict:
        if token:
            self.token_model.delete_by_token(token)
        return {"code": 0, "msg": "退出成功", "data": None}

    def change_password(self, user_id: int, old_password: str, new_password: str) -> dict:
        if not old_password or not new_password:
            return {"code": 1, "msg": "密码不能为空", "data": None}
        if len(new_password) < 6:
            return {"code": 1, "msg": "新密码长度至少6位", "data": None}
        success = self.user_model.change_password(user_id, old_password, new_password)
        if success:
            return {"code": 0, "msg": "密码修改成功", "data": None}
        return {"code": 1, "msg": "原密码错误", "data": None}

    def get_user(self, user_id: int) -> dict:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {"code": 1, "msg": "用户不存在", "data": None}
        user.pop("password_hash", None)
        user.pop("salt", None)
        return {"code": 0, "msg": "获取成功", "data": {"user": user}}

    def update_user(self, user_id: int, **kwargs) -> dict:
        if "password" in kwargs:
            kwargs.pop("password")
        user = self.user_model.update_profile(user_id, kwargs)
        if not user:
            return {"code": 1, "msg": "更新失败", "data": None}
        user_data = self.user_model.get_by_id(user_id)
        user_data.pop("password_hash", None)
        user_data.pop("salt", None)
        return {"code": 0, "msg": "更新成功", "data": {"user": user_data}}

    def verify_token(self, token: str) -> int:
        return self.token_model.verify_token(token)

    def list_users(self, page: int = 1, page_size: int = 20) -> dict:
        result = self.user_model.list_all(page, page_size)
        for u in result.get("items", []):
            u.pop("password_hash", None)
            u.pop("salt", None)
        return {"code": 0, "msg": "获取成功", "data": result}

    def delete_user(self, user_id: int) -> dict:
        success = self.user_model.delete(user_id)
        return {"code": 0 if success else 1, "msg": "删除成功" if success else "删除失败", "data": None}
