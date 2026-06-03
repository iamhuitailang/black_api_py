#!/bin/bash

cd "$(dirname "$0")"

echo "🚀 正在启动幽灵猎人前端服务..."

if ! command -v node &> /dev/null; then
    echo "❌ 请先安装 Node.js"
    exit 1
fi

echo "📦 安装依赖..."
npm install

echo "🌐 启动开发服务器..."
echo "📄 访问: http://localhost:3000"
npm run dev
