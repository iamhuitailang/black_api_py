from typing import Dict, Any, List, Optional
from app.model.bq import BqNoteModel, BqTagModel
import json


class BqNoteBusiness:
    def __init__(self):
        self.note_model = BqNoteModel()
        self.tag_model = BqTagModel()

    def create(self, user_id: int, title: str = '', content: str = '',
               color: str = None, category: str = '', tags: List[str] = None,
               is_pinned: bool = False, is_completed: bool = False,
               remind_at: str = None) -> Dict[str, Any]:
        note_id = self.note_model.create(
            user_id=user_id,
            title=title,
            content=content,
            color=color,
            category=category,
            tags=tags or [],
            is_pinned=is_pinned,
            is_completed=is_completed,
            remind_at=remind_at
        )

        if note_id > 0:
            if tags and len(tags) > 0:
                for tag_name in tags:
                    self.tag_model.get_or_create(user_id, tag_name)
                    tag = self.tag_model.get_by_name_and_user(tag_name, user_id)
                    if tag:
                        self.tag_model.increment_count(tag.get('id'))

            note = self.note_model.get_by_id(note_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.note_model.to_dict(note)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def get_by_id(self, user_id: int, note_id: int) -> Dict[str, Any]:
        note = self.note_model.get_by_id_and_user(note_id, user_id)
        if not note:
            return {
                'code': 1,
                'msg': '便签不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.note_model.to_dict(note)
        }

    def update(self, user_id: int, note_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        note = self.note_model.get_by_id_and_user(note_id, user_id)
        if not note:
            return {
                'code': 1,
                'msg': '便签不存在',
                'data': None
            }

        old_tags = self.note_model._deserialize_tags(note.get('tags', '[]'))
        new_tags = data.get('tags', old_tags)

        if 'tags' in data:
            self.tag_model.update_note_tags(user_id, old_tags, new_tags)

        affected = self.note_model.update(note_id, data)
        if affected >= 0:
            updated_note = self.note_model.get_by_id(note_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.note_model.to_dict(updated_note)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def soft_delete(self, user_id: int, note_id: int) -> Dict[str, Any]:
        note = self.note_model.get_by_id_and_user(note_id, user_id)
        if not note:
            return {
                'code': 1,
                'msg': '便签不存在',
                'data': None
            }

        affected = self.note_model.soft_delete(note_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '删除成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '删除失败',
            'data': None
        }

    def restore(self, user_id: int, note_id: int) -> Dict[str, Any]:
        note = self.note_model.get_by_id_and_user(note_id, user_id)
        if not note:
            return {
                'code': 1,
                'msg': '便签不存在',
                'data': None
            }

        affected = self.note_model.restore(note_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '恢复成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '恢复失败',
            'data': None
        }

    def delete_permanently(self, user_id: int, note_id: int) -> Dict[str, Any]:
        note = self.note_model.get_by_id_and_user(note_id, user_id)
        if not note:
            return {
                'code': 1,
                'msg': '便签不存在',
                'data': None
            }

        old_tags = self.note_model._deserialize_tags(note.get('tags', '[]'))
        if old_tags and len(old_tags) > 0:
            self.tag_model.update_note_tags(user_id, old_tags, [])

        affected = self.note_model.delete_permanently(note_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '永久删除成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '删除失败',
            'data': None
        }

    def toggle_pin(self, user_id: int, note_id: int, is_pinned: bool) -> Dict[str, Any]:
        note = self.note_model.get_by_id_and_user(note_id, user_id)
        if not note:
            return {
                'code': 1,
                'msg': '便签不存在',
                'data': None
            }

        affected = self.note_model.toggle_pin(note_id, is_pinned)
        if affected > 0:
            updated_note = self.note_model.get_by_id(note_id)
            return {
                'code': 0,
                'msg': 'success',
                'data': self.note_model.to_dict(updated_note)
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def toggle_complete(self, user_id: int, note_id: int, is_completed: bool) -> Dict[str, Any]:
        note = self.note_model.get_by_id_and_user(note_id, user_id)
        if not note:
            return {
                'code': 1,
                'msg': '便签不存在',
                'data': None
            }

        affected = self.note_model.toggle_complete(note_id, is_completed)
        if affected > 0:
            updated_note = self.note_model.get_by_id(note_id)
            return {
                'code': 0,
                'msg': 'success',
                'data': self.note_model.to_dict(updated_note)
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def get_list(self, user_id: int, page: int = 1, page_size: int = 20,
                 status: str = 'normal', category: str = None,
                 is_pinned: bool = None, keyword: str = None,
                 tags: List[str] = None) -> Dict[str, Any]:
        result = self.note_model.get_user_notes(
            user_id=user_id,
            page=page,
            page_size=page_size,
            status=status,
            category=category,
            is_pinned=is_pinned,
            keyword=keyword,
            tags=tags
        )

        items = [self.note_model.to_dict(item) for item in result.get('items', [])]

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

    def get_statistics(self, user_id: int) -> Dict[str, Any]:
        stats = self.note_model.get_statistics(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': stats
        }

    def get_color_options(self) -> Dict[str, Any]:
        return {
            'code': 0,
            'msg': 'success',
            'data': BqNoteModel.COLOR_OPTIONS
        }

    def get_categories(self) -> Dict[str, Any]:
        return {
            'code': 0,
            'msg': 'success',
            'data': BqNoteModel.CATEGORIES
        }

    def export_json(self, user_id: int) -> Dict[str, Any]:
        notes = self.note_model.get_all_for_export(user_id)
        export_data = {
            'version': '1.0',
            'export_at': '',
            'notes': [self.note_model.to_dict(note) for note in notes]
        }
        return {
            'code': 0,
            'msg': 'success',
            'data': export_data
        }

    def export_markdown(self, user_id: int) -> Dict[str, Any]:
        notes = self.note_model.get_all_for_export(user_id)
        md_lines = ['# 便签导出', '']
        
        for note in notes:
            note_dict = self.note_model.to_dict(note)
            md_lines.append(f'## {note_dict.get("title", "无标题")}')
            md_lines.append('')
            if note_dict.get('category'):
                md_lines.append(f'- 分类: {note_dict.get("category_name", note_dict.get("category"))}')
            if note_dict.get('tags'):
                md_lines.append(f'- 标签: {", ".join(note_dict.get("tags", []))}')
            md_lines.append(f'- 创建时间: {note_dict.get("created_at", "")}')
            md_lines.append('')
            md_lines.append(note_dict.get('content', ''))
            md_lines.append('')
            md_lines.append('---')
            md_lines.append('')
        
        return {
            'code': 0,
            'msg': 'success',
            'data': '\n'.join(md_lines)
        }

    def import_notes(self, user_id: int, import_data: Dict[str, Any]) -> Dict[str, Any]:
        notes = import_data.get('notes', [])
        count = 0

        for note_data in notes:
            try:
                note_id = self.note_model.create(
                    user_id=user_id,
                    title=note_data.get('title', ''),
                    content=note_data.get('content', ''),
                    color=note_data.get('color', BqNoteModel.DEFAULT_COLOR),
                    category=note_data.get('category', ''),
                    tags=note_data.get('tags', []),
                    is_pinned=note_data.get('is_pinned', False),
                    is_completed=note_data.get('is_completed', False),
                    remind_at=note_data.get('remind_at')
                )
                if note_id > 0:
                    count += 1
                    tags = note_data.get('tags', [])
                    if tags and len(tags) > 0:
                        for tag_name in tags:
                            self.tag_model.get_or_create(user_id, tag_name)
                            tag = self.tag_model.get_by_name_and_user(tag_name, user_id)
                            if tag:
                                self.tag_model.increment_count(tag.get('id'))
            except Exception:
                continue

        return {
            'code': 0,
            'msg': f'成功导入 {count} 条便签',
            'data': {'imported': count}
        }

    def batch_restore(self, user_id: int) -> Dict[str, Any]:
        affected = self.note_model.batch_restore(user_id)
        return {
            'code': 0,
            'msg': f'成功恢复 {affected} 条便签',
            'data': {'restored': affected}
        }

    def empty_trash(self, user_id: int) -> Dict[str, Any]:
        trash_notes = self.note_model.get_user_notes(
            user_id=user_id,
            page=1,
            page_size=1000,
            status=BqNoteModel.STATUS_DELETED
        )
        
        for note in trash_notes.get('items', []):
            old_tags = self.note_model._deserialize_tags(note.get('tags', '[]'))
            if old_tags and len(old_tags) > 0:
                self.tag_model.update_note_tags(user_id, old_tags, [])

        affected = self.note_model.empty_trash(user_id)
        return {
            'code': 0,
            'msg': f'成功清空回收站，删除 {affected} 条便签',
            'data': {'deleted': affected}
        }
