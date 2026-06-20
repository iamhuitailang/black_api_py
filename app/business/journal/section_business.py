from typing import Dict, Any, List
from app.model.journal import SectionModel


class SectionBusiness:
    def __init__(self):
        self.section_model = SectionModel()

    def get_all_sections(self) -> Dict[str, Any]:
        sections = self.section_model.get_all()
        return {
            'code': 0,
            'message': 'success',
            'data': sections
        }

    def get_section(self, section_id: int) -> Dict[str, Any]:
        section = self.section_model.get_by_id(section_id)
        if section:
            return {
                'code': 0,
                'message': 'success',
                'data': section
            }
        return {
            'code': 1,
            'message': '栏目不存在',
            'data': None
        }

    def add_section(self, name: str, description: str = '', sort_order: int = 0) -> Dict[str, Any]:
        if not name or not name.strip():
            return {
                'code': 1,
                'message': '栏目名称不能为空',
                'data': None
            }
        section_id = self.section_model.create(name.strip(), description, sort_order)
        return {
            'code': 0,
            'message': '添加成功',
            'data': {'id': section_id}
        }

    def update_section(self, section_id: int, name: str = None, description: str = None,
                       sort_order: int = None, status: int = None) -> Dict[str, Any]:
        affected = self.section_model.update(section_id, name, description, sort_order, status)
        if affected > 0:
            return {
                'code': 0,
                'message': '更新成功',
                'data': None
            }
        return {
            'code': 1,
            'message': '更新失败',
            'data': None
        }

    def delete_section(self, section_id: int) -> Dict[str, Any]:
        affected = self.section_model.delete(section_id)
        if affected > 0:
            return {
                'code': 0,
                'message': '删除成功',
                'data': None
            }
        return {
            'code': 1,
            'message': '删除失败',
            'data': None
        }
