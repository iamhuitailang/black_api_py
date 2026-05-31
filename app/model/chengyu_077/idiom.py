from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class IdiomModel:
    TABLE_NAME = 'tb_chengyu_077_model_idiom'

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
                word TEXT NOT NULL UNIQUE,
                pinyin TEXT DEFAULT '',
                meaning TEXT DEFAULT '',
                first_char TEXT NOT NULL,
                last_char TEXT NOT NULL,
                usage_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        idx1 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_word ON {cls.TABLE_NAME}(word)"
        db.execute(idx1)
        idx2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_first_char ON {cls.TABLE_NAME}(first_char)"
        db.execute(idx2)
        idx3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_last_char ON {cls.TABLE_NAME}(last_char)"
        db.execute(idx3)

    @classmethod
    def init_default_data(cls):
        db = get_db()
        count = db.fetch_one(f"SELECT COUNT(*) as total FROM {cls.TABLE_NAME}")
        if count and count['total'] > 0:
            return
        idioms = [
            ('一心一意', 'yī xīn yī yì', '做事专心致志，一点都不马虎'),
            ('意气风发', 'yì qì fēng fā', '形容精神振奋，气概昂扬'),
            ('发愤图强', 'fā fèn tú qiáng', '下定决心，努力谋求强盛'),
            ('强词夺理', 'qiǎng cí duó lǐ', '本来没有理，硬说得似乎有理'),
            ('理直气壮', 'lǐ zhí qì zhuàng', '理由充分，说话气势就壮'),
            ('壮志凌云', 'zhuàng zhì líng yún', '形容理想宏伟远大'),
            ('云开见日', 'yún kāi jiàn rì', '比喻黑暗过去，光明到来'),
            ('日新月异', 'rì xīn yuè yì', '每天每月都有新的变化，形容进步很快'),
            ('异曲同工', 'yì qǔ tóng gōng', '不同的曲调演得同样好，比喻做法不同但效果一样'),
            ('功成名就', 'gōng chéng míng jiù', '功绩建立了，名声也有了'),
            ('就事论事', 'jiù shì lùn shì', '按照事物本身的性质来评定是非得失'),
            ('事半功倍', 'shì bàn gōng bèi', '只用一半的功夫，而收到加倍的功效'),
            ('背道而驰', 'bèi dào ér chí', '方向和目的完全相反'),
            ('驰名中外', 'chí míng zhōng wài', '名声传播到国内外'),
            ('外强中干', 'wài qiáng zhōng gān', '外表上好像很强大，实际上很空虚'),
            ('干柴烈火', 'gān chái liè huǒ', '比喻情欲冲动，易于引发事端'),
            ('火冒三丈', 'huǒ mào sān zhàng', '形容极度愤怒'),
            ('丈二和尚', 'zhàng èr hé shàng', '比喻弄不清楚的事情'),
            ('尚方宝剑', 'shàng fāng bǎo jiàn', '比喻上级特许的权力'),
            ('剑拔弩张', 'jiàn bá nǔ zhāng', '形容形势紧张，一触即发'),
            ('张冠李戴', 'zhāng guān lǐ dài', '把姓张的帽子戴到姓李的头上，比喻弄错了对象'),
            ('戴月披星', 'dài yuè pī xīng', '形容早出晚归，辛勤劳动'),
            ('星罗棋布', 'xīng luó qí bù', '像星星和棋子那样分布，形容数量很多，分布很广'),
            ('步步为营', 'bù bù wéi yíng', '比喻行动谨慎，防备严密'),
            ('营私舞弊', 'yíng sī wǔ bì', '为私利而玩弄手段干违法乱纪的事'),
            ('必由之路', 'bì yóu zhī lù', '必定要经过的道路，泛指事物必须遵循的规律'),
            ('路不拾遗', 'lù bù shí yí', '路上有失物无人捡走，形容社会风气好'),
            ('一马当先', 'yī mǎ dāng xiān', '比喻走在前列，带头'),
            ('先发制人', 'xiān fā zhì rén', '先下手取得主动权，以制服对方'),
            ('人山人海', 'rén shān rén hǎi', '形容人聚集得非常多'),
            ('海阔天空', 'hǎi kuò tiān kōng', '形容大自然的广阔，也比喻想象或说话毫无拘束'),
            ('空前绝后', 'kōng qián jué hòu', '以前没有过，以后也不会有'),
            ('后来居上', 'hòu lái jū shàng', '后来的超过先前的'),
            ('上善若水', 'shàng shàn ruò shuǐ', '最高境界的善行就像水的品性一样'),
            ('水落石出', 'shuǐ luò shí chū', '比喻事情真相大白'),
            ('出人头地', 'chū rén tóu dì', '超出一般人，高于别人一头'),
            ('地大物博', 'dì dà wù bó', '土地广大，物产丰富'),
            ('博古通今', 'bó gǔ tōng jīn', '对古代的事知道很多，又通晓现代的事情'),
            ('今非昔比', 'jīn fēi xī bǐ', '现在不是过去所能比得上的'),
            ('比比皆是', 'bǐ bǐ jiē shì', '到处都是，形容极其常见'),
        ]
        for word, pinyin, meaning in idioms:
            now = datetime.now().isoformat()
            db.execute(
                f"INSERT OR IGNORE INTO {cls.TABLE_NAME} (word, pinyin, meaning, first_char, last_char, usage_count, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)",
                (word, pinyin, meaning, word[0], word[-1], now)
            )

    def create(self, word: str, pinyin: str = '', meaning: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'word': word,
            'pinyin': pinyin,
            'meaning': meaning,
            'first_char': word[0] if word else '',
            'last_char': word[-1] if word else '',
            'usage_count': 0,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_word(self, word: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'word': word})

    def find_by_first_char(self, char: str, limit: int = 20) -> List[Dict[str, Any]]:
        return self.query.find_all({'first_char': char}, order_by='usage_count DESC', limit=limit)

    def get_random(self, limit: int = 1) -> List[Dict[str, Any]]:
        return self.db.fetch_all(f"SELECT * FROM {self.TABLE_NAME} ORDER BY RANDOM() LIMIT {limit}")

    def increment_usage(self, idiom_id: int) -> int:
        return self.exec.execute_raw(
            f"UPDATE {self.TABLE_NAME} SET usage_count = usage_count + 1 WHERE id = ?",
            (idiom_id,)
        )

    def get_all(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        sql_count = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE word LIKE ?"
        sql_data = f"SELECT * FROM {self.TABLE_NAME} WHERE word LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?"
        params = (f'%{keyword}%',)
        count_result = self.db.fetch_one(sql_count, params)
        total = count_result['total'] if count_result else 0
        offset = (page - 1) * page_size
        items = self.db.fetch_all(sql_data, (f'%{keyword}%', page_size, offset))
        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
