from ..models import UserModel


class UserBusiness:
    @staticmethod
    def register(username, password, nickname=""):
        if not username or not password:
            return {"code": 1, "msg": "用户名和密码不能为空", "data": None}
        if len(username) < 3 or len(username) > 20:
            return {"code": 1, "msg": "用户名长度应为3-20个字符", "data": None}
        if len(password) < 6:
            return {"code": 1, "msg": "密码长度至少6位", "data": None}
        existing = UserModel.get_by_username(username)
        if existing:
            return {"code": 1, "msg": "用户名已存在", "data": None}
        try:
            user = UserModel.create(username, password, nickname)
            user.pop("password", None)
            return {"code": 0, "msg": "注册成功", "data": {"user": user}}
        except Exception as e:
            return {"code": 1, "msg": f"注册失败: {str(e)}", "data": None}

    @staticmethod
    def login(username, password):
        if not username or not password:
            return {"code": 1, "msg": "用户名和密码不能为空", "data": None}
        user = UserModel.verify_password(username, password)
        if not user:
            return {"code": 1, "msg": "用户名或密码错误", "data": None}
        import time
        token = f"{user['id']}_{int(time.time() * 1000)}"
        user.pop("password", None)
        return {"code": 0, "msg": "登录成功", "data": {"user": user, "token": token}}

    @staticmethod
    def change_password(user_id, old_password, new_password):
        if not old_password or not new_password:
            return {"code": 1, "msg": "密码不能为空", "data": None}
        if len(new_password) < 6:
            return {"code": 1, "msg": "新密码长度至少6位", "data": None}
        success, msg = UserModel.change_password(user_id, old_password, new_password)
        return {"code": 0 if success else 1, "msg": msg, "data": None}

    @staticmethod
    def get_user(user_id):
        user = UserModel.get_by_id(user_id)
        if not user:
            return {"code": 1, "msg": "用户不存在", "data": None}
        user.pop("password", None)
        return {"code": 0, "msg": "获取成功", "data": {"user": user}}

    @staticmethod
    def update_user(user_id, **kwargs):
        if "password" in kwargs:
            kwargs.pop("password")
        user = UserModel.update(user_id, **kwargs)
        if not user:
            return {"code": 1, "msg": "更新失败", "data": None}
        user.pop("password", None)
        return {"code": 0, "msg": "更新成功", "data": {"user": user}}

    @staticmethod
    def list_users(page=1, page_size=20):
        result = UserModel.list_all(page, page_size)
        for u in result["list"]:
            u.pop("password", None)
        return {"code": 0, "msg": "获取成功", "data": result}

    @staticmethod
    def delete_user(user_id):
        success = UserModel.delete(user_id)
        return {"code": 0 if success else 1, "msg": "删除成功" if success else "删除失败", "data": None}
