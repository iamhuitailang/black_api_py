# 背叛大炮飞人 - 后端服务

## 项目简介
背叛大炮飞人游戏的后端API服务，使用FastAPI + SQLAlchemy + SQLite开发。

## 技术栈
- FastAPI 0.104.1
- SQLAlchemy 2.0.23
- Pydantic 2.5.2
- SQLite 数据库

## 数据库表结构
所有表名以 `tb_bet_model_` 开头：

### tb_bet_model_player - 玩家表
存储玩家基本信息

### tb_bet_model_game_record - 游戏记录表
存储游戏对战记录

### tb_bet_model_game_save - 游戏存档表
存储游戏进度存档

### tb_bet_model_scene - 场景表
存储游戏场景配置

### tb_bet_model_bullet - 炮弹表
存储炮弹类型配置

### tb_bet_model_skill - 技能表
存储游戏技能配置

## 安装依赖
```bash
cd model/bet_model
pip install -r requirements.txt
```

## 启动服务
```bash
# 方式1：直接运行
python main.py

# 方式2：使用uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API文档
启动服务后访问：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 接口列表

### 玩家接口
- POST /api/player - 创建玩家
- GET /api/player/{id} - 获取玩家信息
- GET /api/player - 获取所有玩家
- PUT /api/player/{id} - 更新玩家信息
- DELETE /api/player/{id} - 删除玩家
- POST /api/player/{id}/win - 增加胜利场次
- POST /api/player/{id}/loss - 增加失败场次

### 游戏记录接口
- POST /api/game-record - 创建游戏记录
- GET /api/game-record/{id} - 获取游戏记录
- GET /api/game-record - 获取所有游戏记录
- GET /api/game-record/player/{player_id} - 获取玩家游戏记录
- DELETE /api/game-record/{id} - 删除游戏记录

### 游戏存档接口
- POST /api/game-save - 创建游戏存档
- GET /api/game-save/{id} - 获取游戏存档
- GET /api/game-save/player/{player_id}/active - 获取玩家活跃存档
- GET /api/game-save/player/{player_id} - 获取玩家所有存档
- GET /api/game-save - 获取所有存档
- PUT /api/game-save/{id} - 更新游戏存档
- DELETE /api/game-save/{id} - 删除游戏存档

### 场景接口
- GET /api/scene/{id} - 获取场景信息
- GET /api/scene/name/{name} - 按名称获取场景
- GET /api/scene - 获取所有场景
- GET /api/scene/active/all - 获取所有启用场景
- POST /api/scene/init/defaults - 初始化默认场景

### 炮弹接口
- GET /api/bullet/{id} - 获取炮弹信息
- GET /api/bullet/name/{name} - 按名称获取炮弹
- GET /api/bullet - 获取所有炮弹
- GET /api/bullet/type/{type} - 按类型获取炮弹
- POST /api/bullet/init/defaults - 初始化默认炮弹

### 技能接口
- GET /api/skill/{id} - 获取技能信息
- GET /api/skill/name/{name} - 按名称获取技能
- GET /api/skill - 获取所有技能
- GET /api/skill/active/all - 获取所有启用技能
- POST /api/skill/init/defaults - 初始化默认技能

## 统一响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

- code: 状态码，200表示成功
- message: 响应消息
- data: 响应数据
