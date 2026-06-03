# 幽灵猎人 - Ghost Hunter

## 项目简介
一个灵异主题的探险游戏，玩家作为幽灵猎人调查闹鬼地点，收集证据，驱逐鬼魂。

## 技术栈
- 前端: Vue 3 + Vite + Pinia + Vue Router
- 后端: FastAPI + SQLAlchemy + SQLite
- 数据库: SQLite

## 项目结构

### 后端 (model/gh_model)
```
gh_model/
├── models/          # 数据库模型
├── schemas/         # Pydantic schemas
├── controllers/     # API控制器
├── business/        # 业务逻辑层
├── database/        # 数据库连接
├── utils/           # 工具函数
├── main.py          # FastAPI主入口
├── server.py        # 启动脚本（含数据初始化）
├── init_data.py     # 初始化数据
└── requirements.txt # Python依赖
```

### 前端 (static/gh_web)
```
gh_web/
├── src/
│   ├── components/   # 公共组件
│   ├── views/        # 页面组件
│   ├── router/       # 路由配置
│   ├── store/        # Pinia状态管理
│   ├── services/     # API服务
│   ├── assets/       # 静态资源
│   ├── App.vue       # 根组件
│   └── main.js       # 入口文件
├── index.html
├── package.json
└── vite.config.js
```

## 启动方式

### 后端启动
```bash
cd model/gh_model
pip install -r requirements.txt
python server.py
```
后端服务将在 http://localhost:8000 启动

API文档: http://localhost:8000/docs

### 前端启动
```bash
cd static/gh_web
npm install
npm run dev
```
前端服务将在 http://localhost:3000 启动

## 游戏功能

### 核心玩法
1. 🔍 **探测鬼魂** - 使用EMF探测器、温度计等设备寻找鬼魂
2. 📝 **收集证据** - 记录灵异现象，分析鬼魂类型
3. ⚔️ **驱魔法器** - 使用圣水、十字架等法器驱逐鬼魂
4. 📖 **解开故事** - 完成任务解锁鬼魂背后的故事
5. 📋 **委托任务** - 接受并完成各种猎鬼委托
6. 💾 **状态保持** - 刷新页面保持游戏进度

### 特色系统
1. 📚 **灵异事件档案** - 记录已发现的鬼魂种类和信息
2. 👻 **多种鬼魂类型** - 怨灵、幻影、寒灵、影魔等
3. 🔧 **法器升级系统** - 升级装备提升能力
4. 🌙 **夜间探索机制** - 夜间模式更危险但奖励更丰富

## 数据库表结构

所有表名均以 `tb_gh_model_` 开头:
- `tb_gh_model_users` - 用户表
- `tb_gh_model_ghost_types` - 鬼魂类型表
- `tb_gh_model_locations` - 地点表
- `tb_gh_model_equipments` - 装备表
- `tb_gh_model_tasks` - 任务表
- `tb_gh_model_evidence_types` - 证据类型表
- `tb_gh_model_user_game_states` - 用户游戏状态
- `tb_gh_model_user_tasks` - 用户任务关联
- `tb_gh_model_user_evidences` - 用户收集的证据
- `tb_gh_model_user_inventories` - 用户背包
- `tb_gh_model_ghost_archives` - 鬼魂档案

## API接口

### 认证接口
- POST `/api/auth/register` - 注册
- POST `/api/auth/login` - 登录
- GET `/api/auth/me` - 获取当前用户信息

### 游戏接口
- GET `/api/game/state` - 获取游戏状态
- POST `/api/game/explore/start` - 开始探索
- POST `/api/game/explore/stop` - 停止探索
- POST `/api/game/evidence/collect` - 收集证据
- POST `/api/game/exorcism` - 进行驱魔
- GET `/api/game/tasks` - 获取我的任务
- POST `/api/game/tasks/{id}/accept` - 接受任务
- GET `/api/game/inventory` - 获取背包
- POST `/api/game/inventory/upgrade` - 升级装备
- POST `/api/game/inventory/buy/{id}` - 购买装备
- GET `/api/game/archive` - 获取鬼魂档案

## 统一返回格式
```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```
