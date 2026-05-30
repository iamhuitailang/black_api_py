import hashlib
from datetime import datetime
from ..database import get_connection


class UserModel:
    TABLE = "tb_zashua02_model_user"

    @staticmethod
    def _hash_password(password):
        return hashlib.sha256(password.encode("utf-8")).hexdigest()

    @staticmethod
    def create(username, password, nickname="", character_type="clown"):
        conn = get_connection()
        cursor = conn.cursor()
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        hashed = UserModel._hash_password(password)
        try:
            cursor.execute(
                f"INSERT INTO {UserModel.TABLE} (username, password, nickname, character_type, created_at, updated_at) VALUES (?,?,?,?,?,?)",
                (username, hashed, nickname, character_type, now, now),
            )
            conn.commit()
            user_id = cursor.lastrowid
            user = UserModel.get_by_id(user_id)
            conn.close()
            return user
        except Exception as e:
            conn.close()
            raise e

    @staticmethod
    def get_by_id(user_id):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM {UserModel.TABLE} WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return dict(row)
        return None

    @staticmethod
    def get_by_username(username):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM {UserModel.TABLE} WHERE username = ?", (username,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return dict(row)
        return None

    @staticmethod
    def update(user_id, **kwargs):
        if not kwargs:
            return UserModel.get_by_id(user_id)
        conn = get_connection()
        cursor = conn.cursor()
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        kwargs["updated_at"] = now
        sets = ", ".join([f"{k} = ?" for k in kwargs.keys()])
        values = list(kwargs.values()) + [user_id]
        cursor.execute(f"UPDATE {UserModel.TABLE} SET {sets} WHERE id = ?", values)
        conn.commit()
        user = UserModel.get_by_id(user_id)
        conn.close()
        return user

    @staticmethod
    def delete(user_id):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(f"DELETE FROM {UserModel.TABLE} WHERE id = ?", (user_id,))
        conn.commit()
        conn.close()
        return cursor.rowcount > 0

    @staticmethod
    def verify_password(username, password):
        user = UserModel.get_by_username(username)
        if not user:
            return None
        hashed = UserModel._hash_password(password)
        if user["password"] == hashed:
            return user
        return None

    @staticmethod
    def change_password(user_id, old_password, new_password):
        user = UserModel.get_by_id(user_id)
        if not user:
            return False, "用户不存在"
        hashed_old = UserModel._hash_password(old_password)
        if user["password"] != hashed_old:
            return False, "原密码错误"
        hashed_new = UserModel._hash_password(new_password)
        UserModel.update(user_id, password=hashed_new)
        return True, "密码修改成功"

    @staticmethod
    def list_all(page=1, page_size=20):
        conn = get_connection()
        cursor = conn.cursor()
        offset = (page - 1) * page_size
        cursor.execute(f"SELECT COUNT(*) as cnt FROM {UserModel.TABLE}")
        total = cursor.fetchone()["cnt"]
        cursor.execute(
            f"SELECT * FROM {UserModel.TABLE} ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (page_size, offset),
        )
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return {"total": total, "page": page, "page_size": page_size, "list": rows}
