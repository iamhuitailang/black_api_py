from typing import Dict, Any
from app.model.siwei_077_model.template import TemplateModel


class SiweiTemplateBusiness:
    def __init__(self):
        self.template_model = TemplateModel()

    def get_template_list(self, page: int = 1, page_size: int = 10, category: str = None) -> Dict[str, Any]:
        result = self.template_model.get_list(page, page_size, category)
        items = [self.template_model.to_dict(item) for item in result.get('items', [])]
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

    def get_template_detail(self, template_id: int) -> Dict[str, Any]:
        template = self.template_model.get_by_id(template_id)
        if not template:
            return {'code': 1, 'msg': '模板不存在', 'data': None}
        return {'code': 0, 'msg': 'success', 'data': self.template_model.to_dict(template)}

    def get_categories(self) -> Dict[str, Any]:
        return {'code': 0, 'msg': 'success', 'data': TemplateModel.CATEGORIES}
