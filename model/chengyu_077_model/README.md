# 成语接龙游戏 - 后端

基于 FastAPI + SQLite 的成语接龙游戏后端服务

## 功能特性

- 用户注册/登录/修改密码
- 成语库管理
- 单人游戏模式
- 排行榜系统
- 成就系统
- JWT 认证

## 数据库表结构

所有表名以 `tb_chengyu_077_model_` 开头：

- `tb_chengyu_077_model_user` - 用户表
- `tb_chengyu_077_model_idiom` - 成语表
- `tb_chengyu_077_model_game` - 游戏记录表
- `tb_chengyu_077_model_score` - 成绩表
- `tb_chengyu_077_model_achievement` - 成就表
- `tb_chengyu_077_model_user_achievement` - 用户成就关联表

## 目录结构

```
chengyu_077_model/
├── main.py              # FastAPI 主应用
├── requirements.txt     # 依赖包
├── database/            # 数据库配置
│   └── __init__.py
├── models/              # SQLAlchemy 模型
│   └── __init__.py
├── schemas/             # Pydantic 模型
│   └── __init__.py
├── business/            # 业务逻辑层
│   ├── user_business.py
│   ├── idiom_business.py
│   ├── game_business.py
│   └── achievement_business.py
├── controller/          # 控制器层
│   ├── user_controller.py
│   ├── idiom_controller.py
│   ├── game_controller.py
│   └── achievement_controller.py
└── utils/               # 工具函数
    └── response.py
```

## 安装运行

### 1. 安装依赖

```bash
cd model/chengyu_077_model
pip install -r requirements.txt
```

### 2. 启动服务

```bash
python main.py
```

服务将在 `http://localhost:8000` 启动

### 3. API 文档

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API 接口

### 用户接口

- `POST /api/user/register` - 用户注册
- `POST /api/user/login` - 用户登录
- `GET /api/user/me` - 获取当前用户信息
- `PUT /api/user/me` - 更新用户信息
- `POST /api/user/change-password` - 修改密码

### 成语库接口

- `GET /api/idiom/` - 获取成语列表
- `GET /api/idiom/{id}` - 获取成语详情
- `POST /api/idiom/` - 添加成语
- `GET /api/idiom/search/{keyword}` - 搜索成语
- `GET /api/idiom/random/one` - 随机获取一个成语

### 游戏接口

- `POST /api/game/start` - 开始游戏
- `POST /api/game/play` - 提交成语
- `POST /api/game/end/{game_id}` - 结束游戏
- `GET /api/game/active` - 获取活跃游戏
- `GET /api/game/leaderboard` - 获取排行榜

### 成就接口

- `GET /api/achievement/` - 获取所有成就
- `GET /api/achievement/user/my` - 获取我的成就
- `POST /api/achievement/check-and-unlock` - 检查并解锁成就

## 统一返回格式

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```
