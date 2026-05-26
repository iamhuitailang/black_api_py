from typing import Dict, Any, Optional
from app.model.manhua import ComicModel, ChapterModel


class ManhuaComicBusiness:
    def __init__(self):
        self.comic_model = ComicModel()
        self.chapter_model = ChapterModel()

    def get_comic_list(self, page: int = 1, page_size: int = 20,
                       category: str = None, status: str = None,
                       keyword: str = None) -> Dict[str, Any]:
        result = self.comic_model.get_list(page, page_size, category, status, keyword)
        items = [self.comic_model.to_dict(item) for item in result.get('items', [])]

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_comic_detail(self, comic_id: int) -> Dict[str, Any]:
        comic = self.comic_model.get_by_id(comic_id)
        if not comic:
            return {
                'code': 1,
                'msg': '漫画不存在',
                'data': None
            }

        self.comic_model.increment_views(comic_id)
        comic = self.comic_model.get_by_id(comic_id)

        chapters = self.chapter_model.get_by_comic_id(comic_id, page=1, page_size=1000)
        chapter_list = [self.chapter_model.to_dict(ch) for ch in chapters.get('items', [])]

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'comic': self.comic_model.to_dict(comic),
                'chapters': chapter_list,
                'total_chapters': chapters.get('total', 0)
            }
        }

    def get_recommend_list(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.comic_model.get_recommend_list(page, page_size)
        items = [self.comic_model.to_dict(item) for item in result.get('items', [])]

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_hot_list(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.comic_model.get_hot_list(page, page_size)
        items = [self.comic_model.to_dict(item) for item in result.get('items', [])]

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def search_comics(self, keyword: str, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        if not keyword:
            return self.get_comic_list(page, page_size)

        result = self.comic_model.search(keyword, page, page_size)
        items = [self.comic_model.to_dict(item) for item in result.get('items', [])]

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages'),
                'keyword': keyword
            }
        }

    def get_chapter(self, comic_id: int, chapter_no: int) -> Dict[str, Any]:
        chapter = self.chapter_model.get_by_comic_and_chapter(comic_id, chapter_no)
        if not chapter:
            return {
                'code': 1,
                'msg': '章节不存在',
                'data': None
            }

        comic = self.comic_model.get_by_id(comic_id)
        prev_chapter = self.chapter_model.get_by_comic_and_chapter(comic_id, chapter_no - 1)
        next_chapter = self.chapter_model.get_by_comic_and_chapter(comic_id, chapter_no + 1)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'chapter': self.chapter_model.to_dict(chapter),
                'comic': self.comic_model.to_dict(comic) if comic else None,
                'prev_chapter': self.chapter_model.to_dict(prev_chapter) if prev_chapter else None,
                'next_chapter': self.chapter_model.to_dict(next_chapter) if next_chapter else None
            }
        }

    def get_categories(self) -> Dict[str, Any]:
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'categories': ComicModel.CATEGORIES,
                'statuses': [
                    {'value': 'ongoing', 'label': '连载中'},
                    {'value': 'completed', 'label': '已完结'}
                ]
            }
        }