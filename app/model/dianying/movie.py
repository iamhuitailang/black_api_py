from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DianyingMovieModel:
    TABLE_NAME = 'tb_dianying_model_movie'

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
                poster TEXT DEFAULT '',
                rating REAL DEFAULT 0.0,
                rating_count INTEGER DEFAULT 0,
                year INTEGER,
                genre TEXT DEFAULT '',
                director TEXT DEFAULT '',
                actors TEXT DEFAULT '',
                description TEXT DEFAULT '',
                trailer TEXT DEFAULT '',
                duration INTEGER DEFAULT 0,
                country TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_genre ON {cls.TABLE_NAME}(genre)"
        db.execute(index_sql)

    def create(self, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {
            'title': kwargs.get('title', ''),
            'poster': kwargs.get('poster', ''),
            'year': kwargs.get('year'),
            'genre': kwargs.get('genre', ''),
            'director': kwargs.get('director', ''),
            'actors': kwargs.get('actors', ''),
            'description': kwargs.get('description', ''),
            'trailer': kwargs.get('trailer', ''),
            'duration': kwargs.get('duration', 0),
            'country': kwargs.get('country', ''),
            'rating': 0.0,
            'rating_count': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, genre: str = None, year: int = None, min_rating: float = None,
               search: str = None, limit: int = 20, offset: int = 0) -> tuple:
        sql = f"SELECT * FROM {self.TABLE_NAME}"
        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME}"
        params = []
        where_clauses = []

        if genre:
            where_clauses.append("genre LIKE ?")
            params.append(f"%{genre}%")
        if year:
            where_clauses.append("year = ?")
            params.append(year)
        if min_rating:
            where_clauses.append("rating >= ?")
            params.append(min_rating)
        if search:
            where_clauses.append("(title LIKE ? OR actors LIKE ? OR director LIKE ?)")
            params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])

        where_str = ''
        if where_clauses:
            where_str = " WHERE " + " AND ".join(where_clauses)

        total_result = self.db.fetch_one(count_sql + where_str, tuple(params) if params else None)
        total = total_result['total'] if total_result else 0

        sql += where_str + " ORDER BY rating DESC, created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        items = self.db.fetch_all(sql, tuple(params))

        return items, total

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        for key in ['title', 'poster', 'year', 'genre', 'director', 'actors', 'description', 'trailer', 'duration', 'country']:
            if key in kwargs and kwargs[key] is not None:
                data[key] = kwargs[key]
        return self.exec.update_by_id(record_id, data)

    def update_rating(self, movie_id: int) -> None:
        from app.model.dianying.rating import DianyingRatingModel
        rating_model = DianyingRatingModel()
        ratings = rating_model.get_all_by_movie(movie_id)
        if ratings:
            avg = sum(r.get('score', 0) for r in ratings) / len(ratings)
            count = len(ratings)
            self.exec.update_by_id(movie_id, {'rating': round(avg, 1), 'rating_count': count})
        else:
            self.exec.update_by_id(movie_id, {'rating': 0.0, 'rating_count': 0})

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all_genres(self) -> List[str]:
        movies = self.query.find_all()
        genres = set()
        for m in movies:
            if m.get('genre'):
                for g in m['genre'].split(','):
                    genres.add(g.strip())
        return sorted(list(genres))

    def get_all_years(self) -> List[int]:
        sql = f"SELECT DISTINCT year FROM {self.TABLE_NAME} WHERE year IS NOT NULL ORDER BY year DESC"
        rows = self.db.fetch_all(sql)
        return [r['year'] for r in rows if r['year']]

    def get_recommended(self, user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        from app.model.dianying.rating import DianyingRatingModel
        rating_model = DianyingRatingModel()
        user_ratings = rating_model.get_all_by_user(user_id)

        if not user_ratings:
            return self.query.find_all(order_by='rating DESC, rating_count DESC', limit=limit) or []

        high_rated = [r for r in user_ratings if r.get('score', 0) >= 7]
        if not high_rated:
            high_rated = user_ratings

        movie_ids = [r['movie_id'] for r in high_rated]
        placeholders = ','.join(['?' for _ in movie_ids])
        rated_movies = self.db.fetch_all(
            f"SELECT genre FROM {self.TABLE_NAME} WHERE id IN ({placeholders})",
            tuple(movie_ids)
        )

        genres = set()
        for m in rated_movies:
            if m.get('genre'):
                for g in m['genre'].split(','):
                    genres.add(g.strip())

        rated_movie_ids = [r['movie_id'] for r in user_ratings]
        rated_placeholders = ','.join(['?' for _ in rated_movie_ids])

        genre_conditions = ' OR '.join(['genre LIKE ?' for _ in genres])
        genre_params = [f"%{g}%" for g in genres]

        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE id NOT IN ({rated_placeholders})"
        params = list(rated_movie_ids)
        if genre_conditions:
            sql += f" AND ({genre_conditions})"
            params.extend(genre_params)
        sql += " ORDER BY rating DESC, rating_count DESC LIMIT ?"
        params.append(limit)

        return self.db.fetch_all(sql, tuple(params))

    def init_default_data(self):
        db = get_db()
        existing = db.fetch_one(f"SELECT COUNT(*) as total FROM {self.TABLE_NAME}")
        if existing and existing['total'] > 0:
            return

        movies = [
            {"title": "肖申克的救赎", "year": 1994, "genre": "剧情,犯罪", "director": "弗兰克·德拉邦特", "actors": "蒂姆·罗宾斯,摩根·弗里曼", "description": "一场谋杀案使银行家安迪蒙冤入狱，在肖申克监狱中结识瑞德，两人渐成患难之交。", "duration": 142, "country": "美国"},
            {"title": "霸王别姬", "year": 1993, "genre": "剧情,爱情", "director": "陈凯歌", "actors": "张国荣,张丰毅,巩俐", "description": "段小楼与程蝶衣是一对打小一起长大的师兄弟，两人约定合演一辈子《霸王别姬》。", "duration": 171, "country": "中国大陆"},
            {"title": "阿甘正传", "year": 1994, "genre": "剧情,爱情", "director": "罗伯特·泽米吉斯", "actors": "汤姆·汉克斯,罗宾·怀特", "description": "阿甘是个智商只有75的低能儿，但他用奔跑创造了无数奇迹。", "duration": 142, "country": "美国"},
            {"title": "这个杀手不太冷", "year": 1994, "genre": "剧情,动作,犯罪", "director": "吕克·贝松", "actors": "让·雷诺,娜塔莉·波特曼", "description": "里昂是名孤独的职业杀手，邻居家小姑娘马蒂尔达敲开他的房门寻求庇护。", "duration": 110, "country": "法国"},
            {"title": "泰坦尼克号", "year": 1997, "genre": "剧情,爱情,灾难", "director": "詹姆斯·卡梅隆", "actors": "莱昂纳多·迪卡普里奥,凯特·温斯莱特", "description": "豪华客轮泰坦尼克号处女航中，穷画家杰克与贵族少女罗丝的爱情故事。", "duration": 194, "country": "美国"},
            {"title": "千与千寻", "year": 2001, "genre": "剧情,动画,奇幻", "director": "宫崎骏", "actors": "柊瑠美,入野自由", "description": "千寻误入神秘小镇，为救变成猪的父母踏上奇幻冒险之旅。", "duration": 125, "country": "日本"},
            {"title": "星际穿越", "year": 2014, "genre": "剧情,科幻,冒险", "director": "克里斯托弗·诺兰", "actors": "马修·麦康纳,安妮·海瑟薇", "description": "地球面临末日，宇航员穿越虫洞寻找人类新家园。", "duration": 169, "country": "美国"},
            {"title": "盗梦空间", "year": 2010, "genre": "剧情,科幻,悬疑", "director": "克里斯托弗·诺兰", "actors": "莱昂纳多·迪卡普里奥,约瑟夫·高登-莱维特", "description": "柯布能潜入梦境窃取秘密，这次他需要植入一个想法。", "duration": 148, "country": "美国"},
            {"title": "楚门的世界", "year": 1998, "genre": "剧情,科幻", "director": "彼得·威尔", "actors": "金·凯瑞,艾德·哈里斯", "description": "楚门三十年来一直是一档肥皂剧的主角，他决定逃离这个虚假的世界。", "duration": 103, "country": "美国"},
            {"title": "美丽人生", "year": 1997, "genre": "剧情,喜剧,爱情", "director": "罗伯托·贝尼尼", "actors": "罗伯托·贝尼尼,尼可莱塔·布拉斯基", "description": "犹太青年圭多在集中营中用幽默保护儿子的童心。", "duration": 116, "country": "意大利"},
            {"title": "忠犬八公的故事", "year": 2009, "genre": "剧情", "director": "拉斯·霍尔斯道姆", "actors": "理查·基尔,萨拉·罗默尔", "description": "秋田犬八公在主人去世后，依然每天到车站等待主人归来。", "duration": 93, "country": "美国"},
            {"title": "海上钢琴师", "year": 1998, "genre": "剧情,音乐", "director": "朱塞佩·托纳多雷", "actors": "蒂姆·罗斯,普路特·泰勒·文斯", "description": "1900年在邮轮上出生的孤儿，拥有非凡钢琴天赋，一生未曾离开过那艘船。", "duration": 165, "country": "意大利"},
        ]
        for m in movies:
            now = datetime.now().isoformat()
            poster = f"https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=movie%20poster%20{m['title']}&image_size=portrait_4_3"
            db.execute(
                f"INSERT INTO {self.TABLE_NAME} (title, poster, year, genre, director, actors, description, duration, country, rating, rating_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (m['title'], poster, m.get('year'), m.get('genre', ''), m.get('director', ''), m.get('actors', ''), m.get('description', ''), m.get('duration', 0), m.get('country', ''), 0.0, 0, now, now)
            )
