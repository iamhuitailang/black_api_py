from typing import Dict, Any, List
from app.model.chengyu_077.idiom import IdiomModel


class IdiomBusiness:
    def __init__(self):
        self.idiom_model = IdiomModel()

    def get_list(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.idiom_model.get_all(page, page_size)
        return {'code': 0, 'message': 'success', 'data': result}

    def search(self, keyword: str, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        if not keyword or not keyword.strip():
            return self.get_list(page, page_size)
        result = self.idiom_model.search(keyword.strip(), page, page_size)
        return {'code': 0, 'message': 'success', 'data': result}

    def get_by_word(self, word: str) -> Dict[str, Any]:
        if not word:
            return {'code': 1, 'message': '成语不能为空', 'data': None}
        idiom = self.idiom_model.get_by_word(word.strip())
        if not idiom:
            return {'code': 1, 'message': '成语不存在', 'data': None}
        return {'code': 0, 'message': 'success', 'data': idiom}

    def add_idiom(self, word: str, pinyin: str = '', meaning: str = '') -> Dict[str, Any]:
        if not word or len(word.strip()) < 2:
            return {'code': 1, 'message': '成语至少2个字', 'data': None}
        word = word.strip()
        existing = self.idiom_model.get_by_word(word)
        if existing:
            return {'code': 1, 'message': '成语已存在', 'data': None}
        new_id = self.idiom_model.create(word, pinyin, meaning)
        idiom = self.idiom_model.get_by_id(new_id)
        return {'code': 0, 'message': '添加成功', 'data': idiom}

    def delete_idiom(self, idiom_id: int) -> Dict[str, Any]:
        idiom = self.idiom_model.get_by_id(idiom_id)
        if not idiom:
            return {'code': 1, 'message': '成语不存在', 'data': None}
        self.idiom_model.delete(idiom_id)
        return {'code': 0, 'message': '删除成功', 'data': None}

    def find_by_first_char(self, char: str) -> Dict[str, Any]:
        if not char:
            return {'code': 1, 'message': '请指定首字', 'data': None}
        idioms = self.idiom_model.find_by_first_char(char.strip())
        return {'code': 0, 'message': 'success', 'data': idioms}
