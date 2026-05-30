from datetime import datetime
from ..database import get_connection


class RecordModel:
    TABLE = "tb_zashua02_model_record"

    @staticmethod
    def create(user_id, **kwargs):
        conn = get_connection()
        cursor = conn.cursor()
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        defaults = {
            "level": 1,
            "score": 0,
            "combo": 0,
            "max_combo": 0,
            "character_type": "clown",
            "difficulty": "normal",
            "passed": 0,
        }
        data = {**defaults, **kwargs, "user_id": user_id, "created_at": now}
        cols = ", ".join(data.keys())
        placeholders = ", ".join(["?" for _ in data])
        cursor.execute(f"INSERT INTO {RecordModel.TABLE} ({cols}) VALUES ({placeholders})", list(data.values()))
        conn.commit()
        record_id = cursor.lastrowid
        record = RecordModel.get_by_id(record_id)
        conn.close()
        return record

    @staticmethod
    def get_by_id(record_id):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM {RecordModel.TABLE} WHERE id = ?", (record_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return dict(row)
        return None

    @staticmethod
    def get_by_user_id(user_id, page=1, page_size=20):
        conn = get_connection()
        cursor = conn.cursor()
        offset = (page - 1) * page_size
        cursor.execute(f"SELECT COUNT(*) as cnt FROM {RecordModel.TABLE} WHERE user_id = ?", (user_id,))
        total = cursor.fetchone()["cnt"]
        cursor.execute(
            f"SELECT * FROM {RecordModel.TABLE} WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (user_id, page_size, offset),
        )
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return {"total": total, "page": page, "page_size": page_size, "list": rows}

    @staticmethod
    def get_high_scores(limit=10):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT r.*, u.username 
            FROM {RecordModel.TABLE} r 
            LEFT JOIN tb_zashua02_model_user u ON r.user_id = u.id 
            ORDER BY r.score DESC, r.max_combo DESC 
            LIMIT ?
        """, (limit,))
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    @staticmethod
    def delete(record_id):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(f"DELETE FROM {RecordModel.TABLE} WHERE id = ?", (record_id,))
        conn.commit()
        conn.close()
        return cursor.rowcount > 0

    @staticmethod
    def list_all(page=1, page_size=20):
        conn = get_connection()
        cursor = conn.cursor()
        offset = (page - 1) * page_size
        cursor.execute(f"SELECT COUNT(*) as cnt FROM {RecordModel.TABLE}")
        total = cursor.fetchone()["cnt"]
        cursor.execute(
            f"SELECT * FROM {RecordModel.TABLE} ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (page_size, offset),
        )
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return {"total": total, "page": page, "page_size": page_size, "list": rows}
