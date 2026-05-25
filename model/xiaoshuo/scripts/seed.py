import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy.orm import Session
from model.xiaoshuo.core.database import Base, engine, SessionLocal
from model.xiaoshuo.models.novel import (
    Novel,
    Chapter,
    Category,
    Banner,
    ShelfItem,
    Comment,
)

CATEGORIES = [
    {"name": "玄幻", "icon": "⚔️", "sort": 1},
    {"name": "都市", "icon": "🏙️", "sort": 2},
    {"name": "言情", "icon": "💕", "sort": 3},
    {"name": "历史", "icon": "📜", "sort": 4},
    {"name": "科幻", "icon": "🚀", "sort": 5},
    {"name": "悬疑", "icon": "🔍", "sort": 6},
    {"name": "军事", "icon": "🎖️", "sort": 7},
]

NOVELS = [
    {
        "title": "九天玄尊",
        "author": "云天之巅",
        "cover": "https://picsum.photos/seed/x1/300/400",
        "category_idx": 0,
        "status": "连载中",
        "word_count": 1250000,
        "rating": 9.2,
        "is_hot": True,
        "is_recommend": True,
        "is_finished": False,
        "click_count": 1580000,
        "description": "少年意外获得上古传承，从此踏上修仙之路，一剑破万法，九天之上唯我独尊！从凡间到仙界，从默默无名到名动天下，这是一个关于成长、友情与热血的故事。",
    },
    {
        "title": "都市之至尊归来",
        "author": "南风不竞",
        "cover": "https://picsum.photos/seed/x2/300/400",
        "category_idx": 1,
        "status": "连载中",
        "word_count": 980000,
        "rating": 8.8,
        "is_hot": True,
        "is_recommend": False,
        "is_finished": False,
        "click_count": 1250000,
        "description": "三年前，他是家族弃子，流落街头；三年后，他以王者之姿归来，搅动风云。都市沉浮，谁主沉浮？且看至尊如何在这繁华都市书写传奇。",
    },
    {
        "title": "情深不知处",
        "author": "墨染青衣",
        "cover": "https://picsum.photos/seed/x3/300/400",
        "category_idx": 2,
        "status": "已完结",
        "word_count": 650000,
        "rating": 9.5,
        "is_hot": True,
        "is_recommend": True,
        "is_finished": True,
        "click_count": 2100000,
        "description": "她以为他不爱她，直到那场意外之后…… 有些深情，藏在岁月里，不声不响，却刻骨铭心。这是一个关于等待与重逢的故事。",
    },
    {
        "title": "大明文魁",
        "author": "幸福来敲门",
        "cover": "https://picsum.photos/seed/x4/300/400",
        "category_idx": 3,
        "status": "连载中",
        "word_count": 1560000,
        "rating": 9.0,
        "is_hot": True,
        "is_recommend": True,
        "is_finished": False,
        "click_count": 980000,
        "description": "穿越到明朝，成为一名寒门学子。凭借着超前的学识和智慧，在这大明朝科举场上一路高歌，最终成为一代文魁！",
    },
    {
        "title": "星际之最强指挥官",
        "author": "星海漫游者",
        "cover": "https://picsum.photos/seed/x5/300/400",
        "category_idx": 4,
        "status": "连载中",
        "word_count": 2100000,
        "rating": 8.9,
        "is_hot": True,
        "is_recommend": False,
        "is_finished": False,
        "click_count": 760000,
        "description": "地球毁灭后，人类在星际中漂泊求生。林默穿越而来，凭借未来科技，带领人类文明在浩瀚宇宙中建立新的家园。",
    },
    {
        "title": "深夜图书馆",
        "author": "夜行者",
        "cover": "https://picsum.photos/seed/x6/300/400",
        "category_idx": 5,
        "status": "已完结",
        "word_count": 480000,
        "rating": 9.3,
        "is_hot": False,
        "is_recommend": True,
        "is_finished": True,
        "click_count": 520000,
        "description": "午夜十二点的图书馆，每一本书都藏着一个秘密。当你翻开那本不属于你的书时，命运的齿轮已经开始转动……",
    },
    {
        "title": "铁血兵王",
        "author": "狼牙",
        "cover": "https://picsum.photos/seed/x7/300/400",
        "category_idx": 6,
        "status": "连载中",
        "word_count": 1350000,
        "rating": 8.7,
        "is_hot": False,
        "is_recommend": False,
        "is_finished": False,
        "click_count": 450000,
        "description": "从特种兵王到雇佣兵传奇，他用铁血与荣誉书写了一部战争史诗。每一次任务都是生与死的较量，每一次战斗都是对极限的挑战。",
    },
    {
        "title": "万古第一神",
        "author": "风青阳",
        "cover": "https://picsum.photos/seed/x8/300/400",
        "category_idx": 0,
        "status": "连载中",
        "word_count": 2800000,
        "rating": 9.1,
        "is_hot": True,
        "is_recommend": True,
        "is_finished": False,
        "click_count": 1890000,
        "description": "天下第一的修炼天才，却被家族视为废物。直到那一天，他觉醒了万古第一神的血脉，从此逆天改命，傲视群雄！",
    },
    {
        "title": "重生之我是豪门千金",
        "author": "珠光宝气",
        "cover": "https://picsum.photos/seed/x9/300/400",
        "category_idx": 2,
        "status": "连载中",
        "word_count": 780000,
        "rating": 8.5,
        "is_hot": False,
        "is_recommend": True,
        "is_finished": False,
        "click_count": 680000,
        "description": "前世被渣男贱女害死，重生归来，她要让那些人付出代价！豪门恩怨、商战风云、爱恨情仇，这一世，她要活得精彩！",
    },
    {
        "title": "赛博纪元2077",
        "author": "未来观察",
        "cover": "https://picsum.photos/seed/x10/300/400",
        "category_idx": 4,
        "status": "已完结",
        "word_count": 560000,
        "rating": 9.4,
        "is_hot": True,
        "is_recommend": False,
        "is_finished": True,
        "click_count": 890000,
        "description": "2077年，人类与AI共存的时代。当人工智能拥有了自我意识，是文明的延续还是终结？一个关于人性与科技的思考。",
    },
]

CHAPTER_TITLES = [
    "第一章 初入凡尘",
    "第二章 意外觉醒",
    "第三章 神秘传承",
    "第四章 初试身手",
    "第五章 初遇强敌",
    "第六章 突破境界",
    "第七章 隐秘之地",
    "第八章 故友重逢",
    "第九章 惊天秘密",
    "第十章 大战前夕",
]

CHAPTER_CONTENT_TEMPLATE = """
　　夜幕降临，{title}的故事从这里开始。

　　{content}

　　月光如水，洒落大地。主角站在窗前，望着远处的山峦，心中涌起万千思绪。这是一个新的开始，也是一场未知的冒险。

　　他深吸一口气，转身离开房间，脚步坚定地走向那未知的命运。在这个充满变数的世界里，只有不断变强，才能守护自己珍视的一切。

　　夜色渐深，而属于他的传奇，才刚刚拉开序幕……
"""


def seed():
    db = SessionLocal()
    try:
        existing = db.query(Category).count()
        if existing > 0:
            print("数据库已有数据，跳过种子数据插入")
            return

        for cat in CATEGORIES:
            db.add(Category(**cat))
        db.flush()

        categories = db.query(Category).all()
        cat_map = {c.name: c for c in categories}

        novels = []
        for n in NOVELS:
            cat_name = CATEGORIES[n["category_idx"]]["name"]
            cat = cat_map[cat_name]
            novel = Novel(
                title=n["title"],
                author=n["author"],
                cover=n["cover"],
                category_id=cat.id,
                status=n["status"],
                word_count=n["word_count"],
                rating=n["rating"],
                is_hot=n["is_hot"],
                is_recommend=n["is_recommend"],
                is_finished=n["is_finished"],
                click_count=n["click_count"],
                description=n["description"],
            )
            db.add(novel)
            novels.append(novel)
        db.flush()

        for novel in novels:
            total_words = 0
            for i, title in enumerate(CHAPTER_TITLES, 1):
                content = CHAPTER_CONTENT_TEMPLATE.format(
                    title=novel.title,
                    content=f"这是《{novel.title}》的{title}。{novel.description}",
                )
                chapter = Chapter(
                    novel_id=novel.id,
                    chapter_no=i,
                    title=title,
                    content=content,
                    word_count=len(content),
                )
                db.add(chapter)
                total_words += len(content)
            novel.word_count = total_words

        for i, banner in enumerate(
            [
                {"title": "玄幻大作推荐", "image": "https://picsum.photos/seed/b1/800/300", "novel_idx": 0, "sort": 1},
                {"title": "都市传奇热读", "image": "https://picsum.photos/seed/b2/800/300", "novel_idx": 1, "sort": 2},
                {"title": "言情佳作", "image": "https://picsum.photos/seed/b3/800/300", "novel_idx": 2, "sort": 3},
                {"title": "历史架空推荐", "image": "https://picsum.photos/seed/b4/800/300", "novel_idx": 3, "sort": 4},
                {"title": "科幻神作", "image": "https://picsum.photos/seed/b5/800/300", "novel_idx": 4, "sort": 5},
            ]
        ):
            db.add(
                Banner(
                    title=banner["title"],
                    image=banner["image"],
                    novel_id=novels[banner["novel_idx"]].id,
                    sort=banner["sort"],
                )
            )

        for novel in novels[:3]:
            db.add(ShelfItem(user_id=1, novel_id=novel.id, group_name="默认分组"))

        comments = [
            {"user_name": "书虫一号", "content": "文笔细腻，情节紧凑，引人入胜！", "rating": 5},
            {"user_name": "夜读人", "content": "看了一章就停不下来，强烈推荐！", "rating": 5},
            {"user_name": "老书迷", "content": "主角塑造很成功，有血有肉。", "rating": 4},
            {"user_name": "清风明月", "content": "期待后续剧情，作者加油！", "rating": 5},
        ]
        for novel in novels:
            for c in comments:
                db.add(
                    Comment(
                        user_id=1,
                        user_name=c["user_name"],
                        novel_id=novel.id,
                        content=c["content"],
                        rating=c["rating"],
                        user_avatar=f"https://picsum.photos/seed/u{c['user_name']}/80/80",
                    )
                )

        db.commit()
        print(f"种子数据插入成功！")
        print(f"  分类: {db.query(Category).count()} 条")
        print(f"  小说: {db.query(Novel).count()} 本")
        print(f"  章节: {db.query(Chapter).count()} 章")
        print(f"  轮播: {db.query(Banner).count()} 条")
        print(f"  书架: {db.query(ShelfItem).count()} 条")
        print(f"  评论: {db.query(Comment).count()} 条")

    except Exception as e:
        db.rollback()
        print(f"种子数据插入失败: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    seed()
