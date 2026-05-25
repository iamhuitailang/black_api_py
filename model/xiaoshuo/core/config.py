import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATABASE_URL = os.getenv(
    "XIAOSHUO_DATABASE_URL",
    f"sqlite:///{os.path.join(BASE_DIR, 'xiaoshuo.db')}",
)

API_PREFIX = "/api/xiaoshuo"

APP_NAME = "小说阅读器"
APP_VERSION = "1.0.0"
