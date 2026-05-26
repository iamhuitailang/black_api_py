from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ComicModel:
    TABLE_NAME = 'tb_manhua_comics'

    STATUS_ONGOING = 'ongoing'
    STATUS_COMPLETED = 'completed'

    CATEGORIES = [
        '热血', '搞笑', '动作', '奇幻', '冒险', '治愈', '音乐',
        '格斗', '科幻', '悬疑', '爱情', '校园', '魔法', '美食', '异能'
    ]

    def __init__(self):
        self.db = get_db()
        self.query = ORMQuery(self.TABLE_NAME)
        self.exec = ORMExec(self.TABLE_NAME)

    @classmethod
    def create_table(cls):
        db = get_db()
        sql = f"""
            CREATE TABLE IF NOT EXISTS {cls.TABLE_NAME} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                author_original TEXT DEFAULT '',
                cover TEXT DEFAULT '',
                banner TEXT DEFAULT '',
                description TEXT DEFAULT '',
                category TEXT DEFAULT '',
                tags TEXT DEFAULT '',
                status TEXT DEFAULT 'ongoing',
                total_chapters INTEGER DEFAULT 0,
                latest_chapter TEXT DEFAULT '',
                latest_chapter_no INTEGER DEFAULT 0,
                latest_update_time TEXT DEFAULT '',
                hot INTEGER DEFAULT 0,
                views INTEGER DEFAULT 0,
                favorites_count INTEGER DEFAULT 0,
                rating REAL DEFAULT 0,
                sort_order INTEGER DEFAULT 0,
                is_recommend INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_title ON {cls.TABLE_NAME}(title)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_author ON {cls.TABLE_NAME}(author)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category ON {cls.TABLE_NAME}(category)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_hot ON {cls.TABLE_NAME}(hot)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_recommend ON {cls.TABLE_NAME}(is_recommend)"
        db.execute(index_sql)

    @classmethod
    def init_default_comics(cls):
        from app.model.manhua import ComicModel
        model = ComicModel()
        count = model.query.count()
        if count > 0:
            return

        comics = [
            {
                'title': '间谍过家家', 'author': '远藤达哉', 'author_original': '遠藤達哉',
                'cover': 'https://img.manhuadb.com/cover/jiandieguojiajia.jpg',
                'banner': '',
                'description': '为了潜入名校，西国能力最强的间谍<黄昏>被下令组建家庭。但是，他的“女儿”是能读心的超能力者！“妻子”是暗杀者！互相隐瞒真实身份的临时家庭，挺身对抗动乱世界的家庭喜剧！',
                'category': '搞笑,动作', 'tags': '搞笑,动作,日常,间谍',
                'status': cls.STATUS_ONGOING,
                'total_chapters': 85,
                'latest_chapter': '第85话', 'latest_chapter_no': 85,
                'latest_update_time': '2024-01-15',
                'hot': 3, 'views': 999999, 'favorites_count': 888888, 'rating': 9.5,
                'sort_order': 1, 'is_recommend': 1
            },
            {
                'title': '咒术回战', 'author': '芥见下下', 'author_original': '芥見下々',
                'cover': 'https://img.manhuadb.com/cover/zhoushuhuizhan.jpg',
                'banner': '',
                'description': '少年虎杖悠仁为了救人而吞食了「两面宿傩」的手指，从此与诅咒共生。为了祓除宿傩，他进入了东京都立咒术高等专门学校，与咒术师们一起战斗！',
                'category': '热血,奇幻', 'tags': '热血,奇幻,战斗,诅咒',
                'status': cls.STATUS_ONGOING,
                'total_chapters': 250,
                'latest_chapter': '第250话', 'latest_chapter_no': 250,
                'latest_update_time': '2024-01-20',
                'hot': 3, 'views': 1200000, 'favorites_count': 950000, 'rating': 9.6,
                'sort_order': 2, 'is_recommend': 1
            },
            {
                'title': '海贼王', 'author': '尾田荣一郎', 'author_original': '尾田栄一郎',
                'cover': 'https://img.manhuadb.com/cover/onepiece.jpg',
                'banner': '',
                'description': '拥有财富、名声、势力，拥有整个世界的海贼王——哥尔·D·罗杰，他在临刑前的一句话，让人们趋之若鹜奔向大海。「想要我的财宝吗？想要的话可以全部给你，去找吧！我把所有财宝都放在那里！」',
                'category': '热血,冒险', 'tags': '热血,冒险,海贼,冒险',
                'status': cls.STATUS_ONGOING,
                'total_chapters': 1100,
                'latest_chapter': '第1100话', 'latest_chapter_no': 1100,
                'latest_update_time': '2024-01-22',
                'hot': 3, 'views': 5000000, 'favorites_count': 3000000, 'rating': 9.8,
                'sort_order': 3, 'is_recommend': 1
            },
            {
                'title': '火影忍者', 'author': '岸本齐史', 'author_original': '岸本斉史',
                'cover': 'https://img.manhuadb.com/cover/naruto.jpg',
                'banner': '',
                'description': '十多年前，一只拥有巨大威力的妖兽"九尾妖狐"袭击了木叶忍者村。为了保护村子，四代目火影牺牲了自己的生命封印了九尾。',
                'category': '热血', 'tags': '热血,忍者,战斗,少年',
                'status': cls.STATUS_COMPLETED,
                'total_chapters': 700,
                'latest_chapter': '第700话', 'latest_chapter_no': 700,
                'latest_update_time': '2014-11-10',
                'hot': 3, 'views': 8000000, 'favorites_count': 5000000, 'rating': 9.7,
                'sort_order': 4, 'is_recommend': 1
            },
            {
                'title': '鬼灭之刃', 'author': '吾峠呼世晴', 'author_original': '吾峠呼世晴',
                'cover': 'https://img.manhuadb.com/cover/guimiezhiren.jpg',
                'banner': '',
                'description': '大正时期，灶门炭治郎一家惨遭鬼的袭击，只有妹妹祢豆子变成了鬼。为了把妹妹变回人类，炭治郎踏上了成为"猎鬼人"的道路！',
                'category': '热血', 'tags': '热血,鬼,猎鬼,大正',
                'status': cls.STATUS_COMPLETED,
                'total_chapters': 205,
                'latest_chapter': '第205话', 'latest_chapter_no': 205,
                'latest_update_time': '2020-05-18',
                'hot': 3, 'views': 3000000, 'favorites_count': 2000000, 'rating': 9.4,
                'sort_order': 5, 'is_recommend': 1
            },
            {
                'title': '一拳超人', 'author': 'ONE/村田雄介', 'author_original': 'ONE/村田雄介',
                'cover': 'https://img.manhuadb.com/cover/yiquanchaoren.jpg',
                'banner': '',
                'description': '主人公埼玉是一名秃头披风侠，拥有一拳秒杀任何敌人的超强实力。他因为兴趣使然成为英雄，但也因此过于强大而感到无聊。',
                'category': '搞笑,热血', 'tags': '搞笑,热血,英雄,战斗',
                'status': cls.STATUS_ONGOING,
                'total_chapters': 250,
                'latest_chapter': '第250话', 'latest_chapter_no': 250,
                'latest_update_time': '2024-01-10',
                'hot': 2, 'views': 4500000, 'favorites_count': 2500000, 'rating': 9.3,
                'sort_order': 6, 'is_recommend': 1
            },
            {
                'title': '葬送的芙莉莲', 'author': '山田钟人', 'author_original': '山田鐘人',
                'cover': 'https://img.manhuadb.com/cover/zangsongdefulian.jpg',
                'banner': '',
                'description': '勇者一行击败魔王后，精灵魔法使芙莉莲与勇者们告别。她是一个精灵族的魔法使，已经活了超过千年。',
                'category': '奇幻,治愈', 'tags': '奇幻,治愈,冒险,魔法',
                'status': cls.STATUS_ONGOING,
                'total_chapters': 130,
                'latest_chapter': '第130话', 'latest_chapter_no': 130,
                'latest_update_time': '2024-01-18',
                'hot': 3, 'views': 2000000, 'favorites_count': 1500000, 'rating': 9.7,
                'sort_order': 7, 'is_recommend': 1
            },
            {
                'title': '孤独摇滚', 'author': 'はまじあき', 'author_original': 'はまじあき',
                'cover': 'https://img.manhuadb.com/cover/guduyaogun.jpg',
                'banner': '',
                'description': '极度认生的少女后藤一里，为了改变自己而开始弹吉他，却因为没有朋友一起组乐队。直到某一天，她被邀请加入了"纽带乐队"！',
                'category': '搞笑,音乐', 'tags': '搞笑,音乐,校园,乐队',
                'status': cls.STATUS_ONGOING,
                'total_chapters': 80,
                'latest_chapter': '第80话', 'latest_chapter_no': 80,
                'latest_update_time': '2024-01-05',
                'hot': 2, 'views': 1800000, 'favorites_count': 1200000, 'rating': 9.2,
                'sort_order': 8, 'is_recommend': 1
            },
            {
                'title': '刃牙', 'author': '范马刃牙', 'author_original': '板垣恵介',
                'cover': 'https://img.manhuadb.com/cover/renjia.jpg',
                'banner': '',
                'description': '少年范马刃牙为了超越父亲范马勇次郎，在地下斗技场展开激烈战斗的故事。',
                'category': '格斗', 'tags': '格斗,热血,战斗',
                'status': cls.STATUS_ONGOING,
                'total_chapters': 500,
                'latest_chapter': '第500话', 'latest_chapter_no': 500,
                'latest_update_time': '2024-01-12',
                'hot': 1, 'views': 1500000, 'favorites_count': 800000, 'rating': 8.9,
                'sort_order': 9, 'is_recommend': 0
            },
            {
                'title': '石纪元', 'author': '石神千空', 'author_original': '稲垣理一郎',
                'cover': 'https://img.manhuadb.com/cover/shijiyuan.jpg',
                'banner': '',
                'description': '全人类被石化，数千年后，少年千空复活，要用科学重建文明！',
                'category': '科幻', 'tags': '科幻,科学,冒险,冒险',
                'status': cls.STATUS_COMPLETED,
                'total_chapters': 232,
                'latest_chapter': '第232话', 'latest_chapter_no': 232,
                'latest_update_time': '2022-03-07',
                'hot': 2, 'views': 2500000, 'favorites_count': 1500000, 'rating': 9.1,
                'sort_order': 10, 'is_recommend': 1
            },
            {
                'title': '东京复仇者', 'author': '和久井健', 'author_original': '和久井健',
                'cover': 'https://img.manhuadb.com/cover/dongjingfuchouzhe.jpg',
                'banner': '',
                'description': '花垣武道穿越回12年前，为了拯救被不良组织杀害的恋人，决定改变未来！',
                'category': '悬疑', 'tags': '悬疑,穿越,不良',
                'status': cls.STATUS_COMPLETED,
                'total_chapters': 278,
                'latest_chapter': '第278话', 'latest_chapter_no': 278,
                'latest_update_time': '2022-11-16',
                'hot': 2, 'views': 3000000, 'favorites_count': 1800000, 'rating': 9.0,
                'sort_order': 11, 'is_recommend': 1
            },
            {
                'title': '大正处女御伽话', 'author': '桐丘さな', 'author_original': '桐丘さな',
                'cover': 'https://img.manhuadb.com/cover/dazhengchunyuguhua.jpg',
                'banner': '',
                'description': '大正时代，失去双臂的青年与未婚妻的纯爱故事。',
                'category': '爱情', 'tags': '爱情,大正,纯爱',
                'status': cls.STATUS_COMPLETED,
                'total_chapters': 45,
                'latest_chapter': '第45话', 'latest_chapter_no': 45,
                'latest_update_time': '2023-12-01',
                'hot': 1, 'views': 800000, 'favorites_count': 500000, 'rating': 8.8,
                'sort_order': 12, 'is_recommend': 0
            },
            {
                'title': '七龙珠', 'author': '鸟山明', 'author_original': '鳥山明',
                'cover': 'https://img.manhuadb.com/cover/qilongzhu.jpg',
                'banner': '',
                'description': '集齐七颗龙珠可以实现愿望！悟空的冒险开始了！',
                'category': '热血', 'tags': '热血,格斗,冒险',
                'status': cls.STATUS_COMPLETED,
                'total_chapters': 519,
                'latest_chapter': '第519话', 'latest_chapter_no': 519,
                'latest_update_time': '1995-06-05',
                'hot': 3, 'views': 10000000, 'favorites_count': 8000000, 'rating': 9.9,
                'sort_order': 13, 'is_recommend': 1
            },
            {
                'title': '暗杀教室', 'author': '松井优征', 'author_original': '松井優征',
                'cover': 'https://img.manhuadb.com/cover/anshajiaoshi.jpg',
                'banner': '',
                'description': '3年E班的学生们要在一年内暗杀他们的老师——一个超生物！',
                'category': '搞笑', 'tags': '搞笑,校园,暗杀',
                'status': cls.STATUS_COMPLETED,
                'total_chapters': 180,
                'latest_chapter': '第180话', 'latest_chapter_no': 180,
                'latest_update_time': '2016-03-25',
                'hot': 2, 'views': 3500000, 'favorites_count': 2200000, 'rating': 9.2,
                'sort_order': 14, 'is_recommend': 1
            },
            {
                'title': '天使的心跳', 'author': '麻枝准', 'author_original': '麻枝准',
                'cover': 'https://img.manhuadb.com/cover/tianshidexintiao.jpg',
                'banner': '',
                'description': '死后的世界里，少年少女们与天使的战斗与治愈故事。',
                'category': '治愈', 'tags': '治愈,死后世界,战斗',
                'status': cls.STATUS_COMPLETED,
                'total_chapters': 50,
                'latest_chapter': '第50话', 'latest_chapter_no': 50,
                'latest_update_time': '2014-12-01',
                'hot': 1, 'views': 1200000, 'favorites_count': 700000, 'rating': 9.0,
                'sort_order': 15, 'is_recommend': 0
            },
            {
                'title': '跃动青春', 'author': '高松美咲', 'author_original': '高松美咲',
                'cover': 'https://img.manhuadb.com/cover/yuedongqingchun.jpg',
                'banner': '',
                'description': '从乡下到东京上学的少女岩仓美津未，在高中里与帅气的男生志摩聪介相遇的青春校园故事。',
                'category': '校园', 'tags': '校园,青春,恋爱',
                'status': cls.STATUS_ONGOING,
                'total_chapters': 60,
                'latest_chapter': '第60话', 'latest_chapter_no': 60,
                'latest_update_time': '2024-01-08',
                'hot': 2, 'views': 1000000, 'favorites_count': 600000, 'rating': 9.1,
                'sort_order': 16, 'is_recommend': 1
            },
            {
                'title': '魔卡少女樱', 'author': 'CLAMP', 'author_original': 'CLAMP',
                'cover': 'https://img.manhuadb.com/cover/mokashaonvying.jpg',
                'banner': '',
                'description': '木之本樱偶然打开了封印库洛牌的书，从此成为魔卡少女！',
                'category': '魔法', 'tags': '魔法,少女,校园',
                'status': cls.STATUS_COMPLETED,
                'total_chapters': 70,
                'latest_chapter': '第70话', 'latest_chapter_no': 70,
                'latest_update_time': '2000-07-31',
                'hot': 2, 'views': 4000000, 'favorites_count': 2500000, 'rating': 9.3,
                'sort_order': 17, 'is_recommend': 1
            },
            {
                'title': '美食的俘虏', 'author': '岛袋光年', 'author_original': '岛袋光年',
                'cover': 'https://img.manhuadb.com/cover/meishidelufu.jpg',
                'banner': '',
                'description': '美食猎人阿虏寻找传说中的食材，展开美食冒险！',
                'category': '美食', 'tags': '美食,冒险,战斗',
                'status': cls.STATUS_COMPLETED,
                'total_chapters': 396,
                'latest_chapter': '第396话', 'latest_chapter_no': 396,
                'latest_update_time': '2016-11-21',
                'hot': 1, 'views': 2000000, 'favorites_count': 1000000, 'rating': 8.7,
                'sort_order': 18, 'is_recommend': 0
            },
            {
                'title': '僵尸百分百', 'author': '麻生羽吕', 'author_original': '麻生羽呂',
                'cover': 'https://img.manhuadb.com/cover/jiangshibaifenbai.jpg',
                'banner': '',
                'description': '僵尸末日中，少年天道辉实现"僵尸百分百"的遗愿清单！',
                'category': '搞笑', 'tags': '搞笑,僵尸,末日',
                'status': cls.STATUS_ONGOING,
                'total_chapters': 65,
                'latest_chapter': '第65话', 'latest_chapter_no': 65,
                'latest_update_time': '2024-01-16',
                'hot': 2, 'views': 1500000, 'favorites_count': 900000, 'rating': 8.9,
                'sort_order': 19, 'is_recommend': 1
            },
            {
                'title': '文豪野犬', 'author': '朝雾卡夫卡', 'author_original': '朝霧カフカ',
                'cover': 'https://img.manhuadb.com/cover/wenhaoyequan.jpg',
                'banner': '',
                'description': '拥有异能的文豪们组成武装侦探社，展开异能战斗！',
                'category': '异能', 'tags': '异能,战斗,悬疑',
                'status': cls.STATUS_ONGOING,
                'total_chapters': 115,
                'latest_chapter': '第115话', 'latest_chapter_no': 115,
                'latest_update_time': '2024-01-21',
                'hot': 2, 'views': 2800000, 'favorites_count': 1600000, 'rating': 9.2,
                'sort_order': 20, 'is_recommend': 1
            }
        ]

        now = datetime.now().isoformat()
        for comic in comics:
            comic['created_at'] = now
            comic['updated_at'] = now
            model.exec.insert(comic)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        data['updated_at'] = now
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, comic_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['updated_at'] = now
        return self.exec.update_by_id(comic_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def increment_views(self, comic_id: int) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET views = views + 1 WHERE id = ?"
        cursor = self.db.execute(sql, (comic_id,))
        return cursor.rowcount

    def increment_favorites(self, comic_id: int, delta: int = 1) -> int:
        sql = f"UPDATE {self.TABLE_NAME} SET favorites_count = favorites_count + ? WHERE id = ?"
        cursor = self.db.execute(sql, (delta, comic_id))
        return cursor.rowcount

    def get_list(self, page: int = 1, page_size: int = 20,
                  category: str = None, status: str = None,
                  keyword: str = None,
                  order_by: str = 'hot DESC, views DESC') -> Dict[str, Any]:
        conditions = {}
        if category:
            conditions['category'] = category
        if status:
            conditions['status'] = status

        if keyword:
            return self.search(keyword, page, page_size, category, status)

        return self.query.paginate(page, page_size, conditions, order_by=order_by)

    def get_recommend_list(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        conditions = {'is_recommend': 1}
        return self.query.paginate(page, page_size, conditions, order_by='sort_order ASC, hot DESC')

    def get_hot_list(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='hot DESC, views DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 20,
               category: str = None, status: str = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if category:
            where_clauses.append("category = ?")
            params.append(category)

        if status:
            where_clauses.append("status = ?")
            params.append(status)

        where_clauses.append("(title LIKE ? OR author LIKE ? OR description LIKE ? OR tags LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern, like_pattern, like_pattern])

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY hot DESC, views DESC
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, tuple(params))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def update_latest_chapter(self, comic_id: int, chapter_no: int, chapter_title: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'latest_chapter': chapter_title,
            'latest_chapter_no': chapter_no,
            'latest_update_time': now.split('T')[0],
            'total_chapters': chapter_no,
            'updated_at': now
        }
        return self.exec.update_by_id(comic_id, data)

    def to_dict(self, comic: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': comic.get('id'),
            'title': comic.get('title'),
            'author': comic.get('author'),
            'author_original': comic.get('author_original'),
            'cover': comic.get('cover'),
            'banner': comic.get('banner'),
            'description': comic.get('description'),
            'category': comic.get('category'),
            'tags': comic.get('tags'),
            'status': comic.get('status'),
            'status_text': '连载中' if comic.get('status') == self.STATUS_ONGOING else '已完结',
            'total_chapters': comic.get('total_chapters'),
            'latest_chapter': comic.get('latest_chapter'),
            'latest_chapter_no': comic.get('latest_chapter_no'),
            'latest_update_time': comic.get('latest_update_time'),
            'hot': comic.get('hot'),
            'views': comic.get('views'),
            'favorites_count': comic.get('favorites_count'),
            'rating': comic.get('rating'),
            'is_recommend': comic.get('is_recommend'),
            'created_at': comic.get('created_at')
        }