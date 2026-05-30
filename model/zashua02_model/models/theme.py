from datetime import datetime
from ..database import get_connection


class ThemeModel:
    TABLE = "tb_zashua02_model_theme"

    @staticmethod
    def create(name, type, bg_color="", accent_color="", text_color="", config=""):
        conn = get_connection()
        cursor = conn.cursor()
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute(
            f"INSERT INTO {ThemeModel.TABLE} (name, type, bg_color, accent_color, text_color, config, created_at) VALUES (?,?,?,?,?,?,?)",
            (name, type, bg_color, accent_color, text_color, config, now),
        )
        conn.commit()
        theme_id = cursor.lastrowid
        theme = ThemeModel.get_by_id(theme_id)
        conn.close()
        return theme

    @staticmethod
    def get_by_id(theme_id):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM {ThemeModel.TABLE} WHERE id = ?", (theme_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return dict(row)
        return None

    @staticmethod
    def get_by_type(type):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM {ThemeModel.TABLE} WHERE type = ?", (type,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return dict(row)
        return None

    @staticmethod
    def get_all():
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM {ThemeModel.TABLE} ORDER BY id")
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    @staticmethod
    def update(theme_id, **kwargs):
        if not kwargs:
            return ThemeModel.get_by_id(theme_id)
        conn = get_connection()
        cursor = conn.cursor()
        sets = ", ".join([f"{k} = ?" for k in kwargs.keys()])
        values = list(kwargs.values()) + [theme_id]
        cursor.execute(f"UPDATE {ThemeModel.TABLE} SET {sets} WHERE id = ?", values)
        conn.commit()
        theme = ThemeModel.get_by_id(theme_id)
        conn.close()
        return theme

    @staticmethod
    def delete(theme_id):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(f"DELETE FROM {ThemeModel.TABLE} WHERE id = ?", (theme_id,))
        conn.commit()
        conn.close()
        return cursor.rowcount > 0
