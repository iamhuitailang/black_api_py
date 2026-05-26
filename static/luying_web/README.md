# 野外露营管理系统

一款野外露营管理与记录系统，帮助露营爱好者规划行程、记录装备、追踪营地信息、分享露营经验。

## 功能特性

### 用户端
- 用户注册登录（普通用户、管理员）
- 露营计划（创建、编辑、删除、模板使用）
- 装备管理（装备库、添加/编辑/删除装备）
- 营地探索（浏览营地、营地详情、发布评价、收藏营地、分享）
- 社区互动（发布帖子、点赞、评论、关注）
- 个人中心（个人信息管理、我的帖子、我的收藏）

### 管理后台
- 数据统计（用户数、计划数、装备数、营地数、7天趋势折线图）
- 用户管理
- 装备管理
- 营地管理（添加/删除营地）
- 计划管理
- 帖子管理

## 技术栈

### 前端
- Vue 3
- TypeScript
- Element Plus
- Pinia
- Vue Router
- Axios
- ECharts

### 后端
- FastAPI
- SQLAlchemy
- SQLite

## 项目结构

```
static/luying_web/          # 前端项目
├── src/
│   ├── api/                # API接口
│   ├── assets/             # 静态资源
│   ├── components/         # 公共组件
│   ├── layouts/            # 布局组件
│   ├── router/             # 路由配置
│   ├── stores/             # 状态管理
│   ├── types/              # TypeScript类型
│   ├── utils/              # 工具函数
│   └── views/              # 页面组件
│       ├── admin/          # 管理后台页面
│       └── ...             # 用户端页面
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts

model/luying/               # 后端项目
├── business/               # 业务层
├── controllers/            # 控制器层
├── database.py             # 数据库配置
├── models.py               # 数据模型
├── schemas.py              # Pydantic模型
├── main.py                 # 入口文件
└── requirements.txt        # 依赖列表
```

## 快速开始

### 后端启动

```bash
cd model/luying

# 安装依赖
pip install -r requirements.txt

# 启动服务
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

后端接口文档: http://localhost:8000/docs

### 前端启动

```bash
cd static/luying_web

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端访问: http://localhost:3000

## 数据库表

所有表名以 `tb_luying_` 开头：

- tb_luying_user - 用户表
- tb_luying_plan - 露营计划表
- tb_luying_plan_item - 计划物品表
- tb_luying_equipment - 装备表
- tb_luying_campsite - 营地表
- tb_luying_review - 营地评价表
- tb_luying_favorite - 收藏表
- tb_luying_post - 帖子表
- tb_luying_comment - 评论表
- tb_luying_like - 点赞表
- tb_luying_follow - 关注表

## 默认管理员

系统首次启动后，可通过接口注册管理员账号，或直接在数据库中修改用户角色为 admin。
