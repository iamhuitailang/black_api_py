import sqlite3
import threading
import os
from typing import Optional
from contextlib import contextmanager


class SQLiteDB:
    _instance: Optional['SQLiteDB'] = None
    _lock: threading.Lock = threading.Lock()
    _initialized: bool = False

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, db_path: str = None):
        if self._initialized:
            return
        with self._lock:
            if self._initialized:
                return
            self.db_path = db_path or os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
                'data', 'app.db'
            )
            self._local = threading.local()
            self._initialized = True
            self._ensure_data_directory()

    def _ensure_data_directory(self):
        data_dir = os.path.dirname(self.db_path)
        if data_dir and not os.path.exists(data_dir):
            os.makedirs(data_dir, exist_ok=True)

    def _get_connection(self):
        if not hasattr(self._local, 'connection'):
            self._local.connection = sqlite3.connect(
                self.db_path,
                check_same_thread=False,
                isolation_level=None
            )
            self._local.connection.row_factory = sqlite3.Row
            self._local.cursor = self._local.connection.cursor()
        return self._local.connection, self._local.cursor

    @contextmanager
    def get_cursor(self):
        conn, cursor = self._get_connection()
        try:
            yield cursor
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            pass

    def execute(self, sql: str, params: tuple = None):
        conn, cursor = self._get_connection()
        try:
            if params:
                cursor.execute(sql, params)
            else:
                cursor.execute(sql)
            conn.commit()
            return cursor
        except Exception as e:
            conn.rollback()
            raise e

    def execute_many(self, sql: str, params_list: list):
        conn, cursor = self._get_connection()
        try:
            cursor.executemany(sql, params_list)
            conn.commit()
            return cursor
        except Exception as e:
            conn.rollback()
            raise e

    def fetch_one(self, sql: str, params: tuple = None):
        conn, cursor = self._get_connection()
        if params:
            cursor.execute(sql, params)
        else:
            cursor.execute(sql)
        row = cursor.fetchone()
        return dict(row) if row else None

    def fetch_all(self, sql: str, params: tuple = None):
        conn, cursor = self._get_connection()
        if params:
            cursor.execute(sql, params)
        else:
            cursor.execute(sql)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

    def last_insert_id(self):
        conn, cursor = self._get_connection()
        return cursor.lastrowid

    def close(self):
        if hasattr(self._local, 'connection'):
            self._local.connection.close()
            del self._local.connection
            del self._local.cursor


def get_db():
    return SQLiteDB()
