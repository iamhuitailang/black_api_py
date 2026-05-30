import os
import sqlite3
from datetime import datetime

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, "zashua02.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_database():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tb_zashua02_model_user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            nickname TEXT DEFAULT '',
            character_type TEXT DEFAULT 'clown',
            created_at TEXT DEFAULT '',
            updated_at TEXT DEFAULT ''
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tb_zashua02_model_game_state (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            level INTEGER DEFAULT 1,
            score INTEGER DEFAULT 0,
            hp INTEGER DEFAULT 100,
            max_hp INTEGER DEFAULT 100,
            combo INTEGER DEFAULT 0,
            max_combo INTEGER DEFAULT 0,
            difficulty TEXT DEFAULT 'normal',
            theme TEXT DEFAULT 'circus',
            character_type TEXT DEFAULT 'clown',
            props_data TEXT DEFAULT '',
            teammates_data TEXT DEFAULT '',
            created_at TEXT DEFAULT '',
            updated_at TEXT DEFAULT '',
            FOREIGN KEY (user_id) REFERENCES tb_zashua02_model_user(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tb_zashua02_model_theme (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            bg_color TEXT DEFAULT '',
            accent_color TEXT DEFAULT '',
            text_color TEXT DEFAULT '',
            config TEXT DEFAULT '',
            created_at TEXT DEFAULT ''
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tb_zashua02_model_record (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            level INTEGER DEFAULT 1,
            score INTEGER DEFAULT 0,
            combo INTEGER DEFAULT 0,
            max_combo INTEGER DEFAULT 0,
            character_type TEXT DEFAULT 'clown',
            difficulty TEXT DEFAULT 'normal',
            passed INTEGER DEFAULT 0,
            created_at TEXT DEFAULT '',
            FOREIGN KEY (user_id) REFERENCES tb_zashua02_model_user(id)
        )
    """)

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("SELECT COUNT(*) as cnt FROM tb_zashua02_model_theme")
    if cursor.fetchone()["cnt"] == 0:
        themes = [
            ("马戏团之夜", "circus", "#1a0a2e", "#ff6b35", "#ffffff", '{"stage_bg":"#2d1b4e","floor_color":"#8b4513","spotlight":"#ffd700"}', now),
            ("街头嘉年华", "carnival", "#0d1b2a", "#00b4d8", "#e0e1dd", '{"stage_bg":"#1b263b","floor_color":"#415a77","spotlight":"#90e0ef"}', now),
            ("宫廷盛宴", "palace", "#2b1a0e", "#d4af37", "#f5f0e8", '{"stage_bg":"#3d2b1f","floor_color":"#8b6914","spotlight":"#f0e68c"}', now),
        ]
        cursor.executemany(
            "INSERT INTO tb_zashua02_model_theme (name, type, bg_color, accent_color, text_color, config, created_at) VALUES (?,?,?,?,?,?,?)",
            themes,
        )

    conn.commit()
    conn.close()
