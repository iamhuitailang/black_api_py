#!/bin/bash

cd "$(dirname "$0")"

echo "🚀 正在启动幽灵猎人后端服务..."

if ! command -v python3 &> /dev/null; then
    echo "❌ 请先安装 Python 3"
    exit 1
fi

echo "📦 检查依赖..."
pip3 install -q fastapi uvicorn sqlalchemy pydantic python-jose passlib bcrypt python-multipart

echo "🗄️  初始化数据库..."
python3 -c "
import sys
sys.path.insert(0, '.')
from database import engine, Base
from models import *
Base.metadata.create_all(bind=engine)
print('✅ 数据库表创建完成')
"

echo "📝 导入初始数据..."
python3 -c "
import sys
sys.path.insert(0, '.')
from init_data import init_all
init_all()
"

echo "🌐 启动服务器..."
echo "📄 API文档: http://localhost:8000/docs"
python3 -c "
import sys
sys.path.insert(0, '.')
import uvicorn
from main import app
uvicorn.run(app, host='0.0.0.0', port=8000)
"
