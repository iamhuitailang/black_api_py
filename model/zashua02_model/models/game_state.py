from datetime import datetime
from ..database import get_connection


class GameStateModel:
    TABLE = "tb_zashua02_model_game_state"

    @staticmethod
    def create(user_id, **kwargs):
        conn = get_connection()
        cursor = conn.cursor()
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        defaults = {
            "level": 1,
            "score": 0,
            "hp": 100,
            "max_hp": 100,
            "combo": 0,
            "max_combo": 0,
            "difficulty": "normal",
            "theme": "circus",
            "character_type": "clown",
            "props_data": "",
            "teammates_data": "",
        }
        data = {**defaults, **kwargs, "user_id": user_id, "created_at": now, "updated_at": now}
        cols = ", ".join(data.keys())
        placeholders = ", ".join(["?" for _ in data])
        cursor.execute(f"INSERT INTO {GameStateModel.TABLE} ({cols}) VALUES ({placeholders})", list(data.values()))
        conn.commit()
        state_id = cursor.lastrowid
        state = GameStateModel.get_by_id(state_id)
        conn.close()
        return state

    @staticmethod
    def get_by_id(state_id):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM {GameStateModel.TABLE} WHERE id = ?", (state_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return dict(row)
        return None

    @staticmethod
    def get_by_user_id(user_id):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM {GameStateModel.TABLE} WHERE user_id = ? ORDER BY id DESC LIMIT 1", (user_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return dict(row)
        return None

    @staticmethod
    def update(state_id, **kwargs):
        if not kwargs:
            return GameStateModel.get_by_id(state_id)
        conn = get_connection()
        cursor = conn.cursor()
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        kwargs["updated_at"] = now
        sets = ", ".join([f"{k} = ?" for k in kwargs.keys()])
        values = list(kwargs.values()) + [state_id]
        cursor.execute(f"UPDATE {GameStateModel.TABLE} SET {sets} WHERE id = ?", values)
        conn.commit()
        state = GameStateModel.get_by_id(state_id)
        conn.close()
        return state

    @staticmethod
    def delete(state_id):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(f"DELETE FROM {GameStateModel.TABLE} WHERE id = ?", (state_id,))
        conn.commit()
        conn.close()
        return cursor.rowcount > 0

    @staticmethod
    def list_all(page=1, page_size=20):
        conn = get_connection()
        cursor = conn.cursor()
        offset = (page - 1) * page_size
        cursor.execute(f"SELECT COUNT(*) as cnt FROM {GameStateModel.TABLE}")
        total = cursor.fetchone()["cnt"]
        cursor.execute(
            f"SELECT * FROM {GameStateModel.TABLE} ORDER BY updated_at DESC LIMIT ? OFFSET ?",
            (page_size, offset),
        )
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return {"total": total, "page": page, "page_size": page_size, "list": rows}
