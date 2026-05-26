from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class SongModel:
    TABLE_NAME = 'tb_audio_songs'

    PRESET_SONGS = [
        {'title': '起风了', 'artist': '买辣椒也用券', 'album': '起风了', 'duration': '5:23', 'genre': '流行', 'cover': '🎸', 'popularity': 5, 'source_url': ''},
        {'title': '夜曲', 'artist': '周杰伦', 'album': '十一月的萧邦', 'duration': '3:48', 'genre': '流行', 'cover': '🌙', 'popularity': 5, 'source_url': ''},
        {'title': '说谎', 'artist': '林宥嘉', 'album': '感官/世界', 'duration': '4:23', 'genre': '情歌', 'cover': '💔', 'popularity': 5, 'source_url': ''},
        {'title': '山海', 'artist': '草东没有派对', 'album': '丑奴儿', 'duration': '3:52', 'genre': '摇滚', 'cover': '🏔️', 'popularity': 4, 'source_url': ''},
        {'title': '咖啡店', 'artist': '余佳运', 'album': '幸福三部曲', 'duration': '4:12', 'genre': 'R&B', 'cover': '☕', 'popularity': 4, 'source_url': ''},
        {'title': '等你下课', 'artist': '周杰伦', 'album': '单曲', 'duration': '4:30', 'genre': '流行', 'cover': '🎹', 'popularity': 5, 'source_url': ''},
        {'title': '想去海边', 'artist': '夏日入侵企画', 'album': '想去海边', 'duration': '3:35', 'genre': '摇滚', 'cover': '🌊', 'popularity': 4, 'source_url': ''},
        {'title': '倒数', 'artist': '邓紫棋', 'album': '另一个童话', 'duration': '3:55', 'genre': '流行', 'cover': '💿', 'popularity': 5, 'source_url': ''},
        {'title': '夜空中最亮的星', 'artist': '逃跑计划', 'album': '世界', 'duration': '4:27', 'genre': '摇滚', 'cover': '🚀', 'popularity': 5, 'source_url': ''},
        {'title': '送你一朵小红花', 'artist': '赵英俊', 'album': '单曲', 'duration': '4:12', 'genre': '治愈', 'cover': '💐', 'popularity': 4, 'source_url': ''},
        {'title': '演员', 'artist': '薛之谦', 'album': '绅士', 'duration': '4:25', 'genre': '情歌', 'cover': '🎭', 'popularity': 5, 'source_url': ''},
        {'title': '樱花树下', 'artist': '张敬轩', 'album': 'Urban Emotions', 'duration': '4:12', 'genre': '粤语', 'cover': '🌸', 'popularity': 4, 'source_url': ''},
        {'title': '平凡之路', 'artist': '朴树', 'album': '猎户星座', 'duration': '5:03', 'genre': '民谣', 'cover': '🎸', 'popularity': 5, 'source_url': ''},
        {'title': '恋爱ing', 'artist': '五月天', 'album': '知足', 'duration': '2:45', 'genre': '摇滚', 'cover': '💘', 'popularity': 4, 'source_url': ''},
        {'title': '下雨天', 'artist': '南拳妈妈', 'album': '藏宝图', 'duration': '4:12', 'genre': '情歌', 'cover': '🌧️', 'popularity': 4, 'source_url': ''},
        {'title': '光年之外', 'artist': '邓紫棋', 'album': '光年之外', 'duration': '3:55', 'genre': '流行', 'cover': '🎵', 'popularity': 5, 'source_url': ''},
        {'title': '蝴蝶', 'artist': '陶喆', 'album': '黑色柳丁', 'duration': '4:43', 'genre': 'R&B', 'cover': '🦋', 'popularity': 4, 'source_url': ''},
        {'title': '城市傍晚', 'artist': '毛不易', 'album': '幼鸟指南', 'duration': '4:00', 'genre': '民谣', 'cover': '🏙️', 'popularity': 4, 'source_url': ''},
        {'title': '唯一', 'artist': '告五人', 'album': '运气来得若有似无', 'duration': '4:28', 'genre': '流行', 'cover': '💎', 'popularity': 5, 'source_url': ''},
        {'title': '马戏团', 'artist': '徐佳莹', 'album': '心里学', 'duration': '4:08', 'genre': '流行', 'cover': '🎪', 'popularity': 3, 'source_url': ''},
        {'title': '晴天', 'artist': '周杰伦', 'album': '叶惠美', 'duration': '4:29', 'genre': '流行', 'cover': '☀️', 'popularity': 5, 'source_url': ''},
        {'title': '稻香', 'artist': '周杰伦', 'album': '魔杰座', 'duration': '3:43', 'genre': '流行', 'cover': '🌾', 'popularity': 5, 'source_url': ''},
        {'title': '青花瓷', 'artist': '周杰伦', 'album': '我很忙', 'duration': '3:58', 'genre': '流行', 'cover': '🏺', 'popularity': 5, 'source_url': ''},
        {'title': '告白气球', 'artist': '周杰伦', 'album': '周杰伦的床边故事', 'duration': '3:35', 'genre': '流行', 'cover': '🎈', 'popularity': 5, 'source_url': ''},
        {'title': '七里香', 'artist': '周杰伦', 'album': '七里香', 'duration': '4:59', 'genre': '流行', 'cover': '🌺', 'popularity': 5, 'source_url': ''},
        {'title': '搁浅', 'artist': '周杰伦', 'album': '七里香', 'duration': '3:35', 'genre': '流行', 'cover': '🌊', 'popularity': 4, 'source_url': ''},
        {'title': '菊花台', 'artist': '周杰伦', 'album': '依然范特西', 'duration': '4:55', 'genre': '流行', 'cover': '🌼', 'popularity': 4, 'source_url': ''},
        {'title': '发如雪', 'artist': '周杰伦', 'album': '十一月的萧邦', 'duration': '4:35', 'genre': '流行', 'cover': '❄️', 'popularity': 4, 'source_url': ''},
        {'title': '东风破', 'artist': '周杰伦', 'album': '叶惠美', 'duration': '5:13', 'genre': '流行', 'cover': '🍃', 'popularity': 4, 'source_url': ''},
        {'title': '龙卷风', 'artist': '周杰伦', 'album': 'Jay', 'duration': '4:07', 'genre': '流行', 'cover': '🌪️', 'popularity': 4, 'source_url': ''},
        {'title': '简单爱', 'artist': '周杰伦', 'album': '范特西', 'duration': '4:30', 'genre': '流行', 'cover': '❤️', 'popularity': 4, 'source_url': ''},
        {'title': '安静', 'artist': '周杰伦', 'album': '范特西', 'duration': '5:03', 'genre': '流行', 'cover': '🤫', 'popularity': 4, 'source_url': ''},
        {'title': '可惜没如果', 'artist': '林俊杰', 'album': '新地球', 'duration': '4:59', 'genre': '流行', 'cover': '🌙', 'popularity': 5, 'source_url': ''},
        {'title': '江南', 'artist': '林俊杰', 'album': '第二天堂', 'duration': '4:27', 'genre': '流行', 'cover': '🏯', 'popularity': 5, 'source_url': ''},
        {'title': '小幸运', 'artist': '田馥甄', 'album': '我的少女时代', 'duration': '4:49', 'genre': '流行', 'cover': '🍀', 'popularity': 5, 'source_url': ''},
        {'title': '后来', 'artist': '刘若英', 'album': '我等你', 'duration': '5:40', 'genre': '流行', 'cover': '💐', 'popularity': 5, 'source_url': ''},
        {'title': '突然好想你', 'artist': '五月天', 'album': '后青春期的诗', 'duration': '5:11', 'genre': '摇滚', 'cover': '💭', 'popularity': 5, 'source_url': ''},
        {'title': '倔强', 'artist': '五月天', 'album': '知足', 'duration': '4:07', 'genre': '摇滚', 'cover': '💪', 'popularity': 5, 'source_url': ''},
        {'title': '知足', 'artist': '五月天', 'album': '知足', 'duration': '4:16', 'genre': '摇滚', 'cover': '🌟', 'popularity': 4, 'source_url': ''},
        {'title': '童话', 'artist': '光良', 'album': '童话', 'duration': '4:13', 'genre': '流行', 'cover': '📖', 'popularity': 5, 'source_url': ''},
        {'title': '红玫瑰', 'artist': '陈奕迅', 'album': '认了吧', 'duration': '4:33', 'genre': '粤语', 'cover': '🌹', 'popularity': 5, 'source_url': ''},
        {'title': '富士山下', 'artist': '陈奕迅', 'album': 'What\'s Going On...?', 'duration': '4:21', 'genre': '粤语', 'cover': '🗻', 'popularity': 5, 'source_url': ''},
        {'title': '十年', 'artist': '陈奕迅', 'album': '黑白灰', 'duration': '3:25', 'genre': '粤语', 'cover': '⏳', 'popularity': 5, 'source_url': ''},
        {'title': '爱情转移', 'artist': '陈奕迅', 'album': '认了吧', 'duration': '4:33', 'genre': '流行', 'cover': '💔', 'popularity': 5, 'source_url': ''},
        {'title': '因为爱情', 'artist': '陈奕迅,王菲', 'album': 'Stranger Under My Skin', 'duration': '3:37', 'genre': '流行', 'cover': '💕', 'popularity': 5, 'source_url': ''},
        {'title': '成都', 'artist': '赵雷', 'album': '无法长大', 'duration': '5:28', 'genre': '民谣', 'cover': '🏙️', 'popularity': 5, 'source_url': ''},
        {'title': '南山南', 'artist': '马頔', 'album': '孤岛', 'duration': '5:25', 'genre': '民谣', 'cover': '🏔️', 'popularity': 4, 'source_url': ''},
        {'title': '董小姐', 'artist': '宋冬野', 'album': '安和桥北', 'duration': '5:12', 'genre': '民谣', 'cover': '👩', 'popularity': 4, 'source_url': ''},
        {'title': '安河桥', 'artist': '宋冬野', 'album': '安和桥北', 'duration': '5:37', 'genre': '民谣', 'cover': '🌉', 'popularity': 5, 'source_url': ''},
        {'title': '斑马斑马', 'artist': '宋冬野', 'album': '安和桥北', 'duration': '4:28', 'genre': '民谣', 'cover': '🦓', 'popularity': 4, 'source_url': ''},
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
                artist TEXT NOT NULL,
                album TEXT DEFAULT '',
                duration TEXT DEFAULT '0:00',
                genre TEXT DEFAULT '',
                cover TEXT DEFAULT '',
                popularity INTEGER DEFAULT 3,
                source_url TEXT DEFAULT '',
                is_preset INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_title ON {cls.TABLE_NAME}(title)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_artist ON {cls.TABLE_NAME}(artist)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_album ON {cls.TABLE_NAME}(album)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_genre ON {cls.TABLE_NAME}(genre)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_popularity ON {cls.TABLE_NAME}(popularity)"
        db.execute(index_sql)

    @classmethod
    def init_preset_songs(cls):
        model = cls()
        count = model.query.count({})
        if count == 0:
            now = datetime.now().isoformat()
            for song in cls.PRESET_SONGS:
                data = {
                    **song,
                    'is_preset': 1,
                    'created_at': now
                }
                model.exec.insert(data)

    def create(self, title: str, artist: str, album: str = '',
               duration: str = '0:00', genre: str = '',
               cover: str = '', popularity: int = 3,
               source_url: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'title': title,
            'artist': artist,
            'album': album,
            'duration': duration,
            'genre': genre,
            'cover': cover,
            'popularity': popularity,
            'source_url': source_url,
            'is_preset': 0,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, keyword: str = '', genre: str = '',
                page: int = 1, page_size: int = 50) -> Dict[str, Any]:
        conditions = {}
        if genre:
            conditions['genre'] = genre
        result = self.query.paginate(page=page, page_size=page_size,
                                     conditions=conditions if conditions else None,
                                     order_by='popularity DESC, id ASC')
        if keyword:
            like = f'%{keyword}%'
            sql = f"""
                SELECT * FROM {self.TABLE_NAME}
                WHERE title LIKE ? OR artist LIKE ? OR album LIKE ?
                ORDER BY popularity DESC, id ASC
                LIMIT ? OFFSET ?
            """
            items = self.db.fetch_all(sql, (like, like, like, page_size, (page - 1) * page_size))
            count_sql = f"""
                SELECT COUNT(*) as total FROM {self.TABLE_NAME}
                WHERE title LIKE ? OR artist LIKE ? OR album LIKE ?
            """
            total_result = self.db.fetch_one(count_sql, (like, like, like))
            total = total_result['total'] if total_result else 0
            result = {
                'items': items,
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size
            }
        return result

    def search(self, keyword: str, search_type: str = 'song',
               page: int = 1, page_size: int = 50) -> Dict[str, Any]:
        like = f'%{keyword}%'
        if search_type == 'artist':
            sql = f"""
                SELECT * FROM {self.TABLE_NAME}
                WHERE artist LIKE ?
                ORDER BY popularity DESC, id ASC
                LIMIT ? OFFSET ?
            """
            items = self.db.fetch_all(sql, (like, page_size, (page - 1) * page_size))
            count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE artist LIKE ?"
            total_result = self.db.fetch_one(count_sql, (like,))
        elif search_type == 'album':
            sql = f"""
                SELECT * FROM {self.TABLE_NAME}
                WHERE album LIKE ?
                ORDER BY popularity DESC, id ASC
                LIMIT ? OFFSET ?
            """
            items = self.db.fetch_all(sql, (like, page_size, (page - 1) * page_size))
            count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE album LIKE ?"
            total_result = self.db.fetch_one(count_sql, (like,))
        else:
            sql = f"""
                SELECT * FROM {self.TABLE_NAME}
                WHERE title LIKE ? OR artist LIKE ? OR album LIKE ?
                ORDER BY popularity DESC, id ASC
                LIMIT ? OFFSET ?
            """
            items = self.db.fetch_all(sql, (like, like, like, page_size, (page - 1) * page_size))
            count_sql = f"""
                SELECT COUNT(*) as total FROM {self.TABLE_NAME}
                WHERE title LIKE ? OR artist LIKE ? OR album LIKE ?
            """
            total_result = self.db.fetch_one(count_sql, (like, like, like))

        total = total_result['total'] if total_result else 0
        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_genres(self) -> List[str]:
        sql = f"SELECT DISTINCT genre FROM {self.TABLE_NAME} WHERE genre != '' ORDER BY genre"
        rows = self.db.fetch_all(sql)
        return [row['genre'] for row in rows]

    def get_hot_searches(self) -> List[str]:
        return ['周杰伦', '邓紫棋', '五月天', '陈奕迅', '林俊杰', '流行', '摇滚', '民谣']

    def update(self, song_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'title', 'artist', 'album', 'duration', 'genre', 'cover', 'popularity', 'source_url'
        ]}
        return self.exec.update_by_id(song_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_by_ids(self, ids: List[int]) -> List[Dict[str, Any]]:
        if not ids:
            return []
        placeholders = ','.join(['?' for _ in ids])
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE id IN ({placeholders})"
        return self.db.fetch_all(sql, tuple(ids))

    def to_dict(self, song: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': song.get('id'),
            'title': song.get('title'),
            'artist': song.get('artist'),
            'album': song.get('album'),
            'duration': song.get('duration'),
            'genre': song.get('genre'),
            'cover': song.get('cover'),
            'popularity': song.get('popularity'),
            'source_url': song.get('source_url'),
            'is_preset': song.get('is_preset'),
            'created_at': song.get('created_at')
        }