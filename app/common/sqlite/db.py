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
            self._connection = None
            self._initialized = True
            self._ensure_data_directory()
            self._init_connection()

    def _ensure_data_directory(self):
        data_dir = os.path.dirname(self.db_path)
        if data_dir and not os.path.exists(data_dir):
            os.makedirs(data_dir, exist_ok=True)

    def _init_connection(self):
        if self._connection is None:
            self._connection = sqlite3.connect(
                self.db_path,
                check_same_thread=False,
                timeout=30,
                isolation_level=None
            )
            self._connection.row_factory = sqlite3.Row
            self._cursor = self._connection.cursor()
            self._cursor.execute("PRAGMA journal_mode=WAL")
            self._cursor.execute("PRAGMA synchronous=FULL")
            self._cursor.execute("PRAGMA busy_timeout=30000")

    def _get_connection(self):
        if self._connection is None:
            self._init_connection()
        return self._connection, self._cursor

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
        with self._lock:
            try:
                cursor.execute("BEGIN IMMEDIATE")
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
        with self._lock:
            try:
                cursor.execute("BEGIN IMMEDIATE")
                cursor.executemany(sql, params_list)
                conn.commit()
                return cursor
            except Exception as e:
                conn.rollback()
                raise e

    def fetch_one(self, sql: str, params: tuple = None):
        conn, cursor = self._get_connection()
        with self._lock:
            if params:
                cursor.execute(sql, params)
            else:
                cursor.execute(sql)
            row = cursor.fetchone()
            return dict(row) if row else None

    def fetch_all(self, sql: str, params: tuple = None):
        conn, cursor = self._get_connection()
        with self._lock:
            if params:
                cursor.execute(sql, params)
            else:
                cursor.execute(sql)
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

    def last_insert_id(self):
        conn, cursor = self._get_connection()
        with self._lock:
            return cursor.lastrowid

    def close(self):
        if self._connection is not None:
            try:
                self._connection.commit()
                self._connection.close()
            except Exception:
                pass
            self._connection = None


def get_db():
    return SQLiteDB()
