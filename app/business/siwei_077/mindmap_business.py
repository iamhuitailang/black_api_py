from typing import Dict, Any, Optional, List
from app.model.siwei_077_model import MindMapModel, MindMapNodeModel, MindMapEdgeModel
import json


class SiweiMindmapBusiness:
    def __init__(self):
        self.map_model = MindMapModel()
        self.node_model = MindMapNodeModel()
        self.edge_model = MindMapEdgeModel()

    def create_map(self, user_id: int, title: str = '未命名思维导图',
                   description: str = '', theme: str = 'classic', layout: str = 'right') -> Dict[str, Any]:
        if not title or len(title.strip()) == 0:
            title = '未命名思维导图'

        map_id = self.map_model.create(
            user_id=user_id,
            title=title.strip(),
            description=description,
            theme=theme,
            layout=layout
        )

        if map_id > 0:
            root_node_id = self.node_model.create(
                map_id=map_id,
                text=title.strip(),
                x=400,
                y=300,
                bg_color='#409eff',
                text_color='#ffffff',
                font_size=16
            )
            mind_map = self.map_model.get_by_id(map_id)
            result = self.map_model.to_dict(mind_map)
            result['nodes'] = [self.node_model.to_dict(self.node_model.get_by_id(root_node_id))]
            result['edges'] = []
            return {'code': 0, 'msg': '创建成功', 'data': result}

        return {'code': 1, 'msg': '创建失败', 'data': None}

    def create_map_from_template(self, user_id: int, template_id: int, title: str = '') -> Dict[str, Any]:
        from app.model.siwei_077_model.template import TemplateModel
        template_model = TemplateModel()
        template = template_model.get_by_id(template_id)
        if not template:
            return {'code': 1, 'msg': '模板不存在', 'data': None}

        map_title = title.strip() if title.strip() else template.get('name', '未命名思维导图')

        map_id = self.map_model.create(
            user_id=user_id,
            title=map_title,
            description=template.get('description', ''),
            theme=template.get('theme', 'classic'),
            layout=template.get('layout', 'right')
        )

        if map_id <= 0:
            return {'code': 1, 'msg': '创建失败', 'data': None}

        try:
            nodes_data = json.loads(template.get('nodes_json', '[]'))
        except (json.JSONDecodeError, TypeError):
            nodes_data = []

        try:
            edges_data = json.loads(template.get('edges_json', '[]'))
        except (json.JSONDecodeError, TypeError):
            edges_data = []

        node_id_map = {}
        for i, node in enumerate(nodes_data):
            old_id = node.get('id', i + 1)
            old_parent_id = node.get('parent_id', 0)
            new_node_id = self.node_model.create(
                map_id=map_id,
                text=node.get('text', ''),
                parent_id=0,
                x=node.get('x', 0),
                y=node.get('y', 0),
                bg_color=node.get('bg_color', '#409eff'),
                text_color=node.get('text_color', '#ffffff'),
                font_size=node.get('font_size', 14),
                shape=node.get('shape', 'rect'),
                note=node.get('note', ''),
                width=node.get('width', 120),
                height=node.get('height', 40)
            )
            node_id_map[old_id] = new_node_id

        root_node_id = None
        for old_id, new_id in node_id_map.items():
            for node in nodes_data:
                node_old_id = node.get('id', nodes_data.index(node) + 1)
                if node_old_id == old_id:
                    old_parent = node.get('parent_id', 0)
                    if old_parent == 0:
                        root_node_id = new_id
                        self.node_model.update(new_id, {'parent_id': 0})
                    elif old_parent in node_id_map:
                        self.node_model.update(new_id, {'parent_id': node_id_map[old_parent]})
                    break

        for edge in edges_data:
            old_source = edge.get('source_id')
            old_target = edge.get('target_id')
            if old_source in node_id_map and old_target in node_id_map:
                self.edge_model.create(
                    map_id=map_id,
                    source_id=node_id_map[old_source],
                    target_id=node_id_map[old_target],
                    label=edge.get('label', ''),
                    line_type=edge.get('line_type', 'curve'),
                    line_color=edge.get('line_color', '#909399'),
                    line_width=edge.get('line_width', 2)
                )

        template_model.increment_use_count(template_id)

        return self.get_map_detail(map_id, user_id)

    def get_map_detail(self, map_id: int, user_id: int = None) -> Dict[str, Any]:
        mind_map = self.map_model.get_by_id(map_id)
        if not mind_map:
            return {'code': 1, 'msg': '思维导图不存在', 'data': None}

        result = self.map_model.to_dict(mind_map)
        nodes = self.node_model.get_by_map(map_id)
        edges = self.edge_model.get_by_map(map_id)
        result['nodes'] = [self.node_model.to_dict(n) for n in nodes]
        result['edges'] = [self.edge_model.to_dict(e) for e in edges]

        if user_id:
            result['is_owner'] = mind_map.get('user_id') == user_id

        return {'code': 0, 'msg': 'success', 'data': result}

    def update_map(self, user_id: int, map_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        mind_map = self.map_model.get_by_id(map_id)
        if not mind_map:
            return {'code': 1, 'msg': '思维导图不存在', 'data': None}

        if mind_map.get('user_id') != user_id:
            return {'code': 1, 'msg': '无权限修改', 'data': None}

        affected = self.map_model.update(map_id, data)
        if affected >= 0:
            updated_map = self.map_model.get_by_id(map_id)
            return {'code': 0, 'msg': '更新成功', 'data': self.map_model.to_dict(updated_map)}
        return {'code': 1, 'msg': '更新失败', 'data': None}

    def delete_map(self, user_id: int, map_id: int) -> Dict[str, Any]:
        mind_map = self.map_model.get_by_id(map_id)
        if not mind_map:
            return {'code': 1, 'msg': '思维导图不存在', 'data': None}

        if mind_map.get('user_id') != user_id:
            return {'code': 1, 'msg': '无权限删除', 'data': None}

        self.node_model.delete_by_map(map_id)
        self.edge_model.delete_by_map(map_id)

        from app.model.siwei_077_model.collaboration import CollaborationModel
        collab_model = CollaborationModel()
        collab_model.delete_by_map(map_id)

        affected = self.map_model.delete(map_id)
        if affected > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}
        return {'code': 1, 'msg': '删除失败', 'data': None}

    def get_my_maps(self, user_id: int, page: int = 1, page_size: int = 10, keyword: str = None) -> Dict[str, Any]:
        result = self.map_model.get_by_user(user_id, page, page_size, keyword)
        items = [self.map_model.to_dict(item) for item in result.get('items', [])]
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

    def get_shared_maps(self, page: int = 1, page_size: int = 10, keyword: str = None) -> Dict[str, Any]:
        result = self.map_model.get_public_list(page, page_size, keyword)
        items = [self.map_model.to_dict(item) for item in result.get('items', [])]
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

    def create_node(self, user_id: int, map_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        mind_map = self.map_model.get_by_id(map_id)
        if not mind_map:
            return {'code': 1, 'msg': '思维导图不存在', 'data': None}

        if not self._check_edit_permission(map_id, user_id):
            return {'code': 1, 'msg': '无编辑权限', 'data': None}

        data = self._sanitize_node_data(data)

        node_id = self.node_model.create(
            map_id=map_id,
            text=data.get('text', ''),
            parent_id=data.get('parent_id', 0),
            x=data.get('x', 0),
            y=data.get('y', 0),
            bg_color=data.get('bg_color', '#409eff'),
            text_color=data.get('text_color', '#ffffff'),
            font_size=data.get('font_size', 14),
            shape=data.get('shape', 'rect'),
            note=data.get('note', ''),
            width=data.get('width', 120),
            height=data.get('height', 40)
        )

        if node_id > 0:
            if data.get('parent_id', 0) > 0:
                self.edge_model.create(
                    map_id=map_id,
                    source_id=data.get('parent_id'),
                    target_id=node_id,
                    line_type='curve',
                    line_color='#909399'
                )

            self.map_model.update(map_id, {})
            node = self.node_model.get_by_id(node_id)
            return {'code': 0, 'msg': '创建成功', 'data': self.node_model.to_dict(node)}

        return {'code': 1, 'msg': '创建节点失败', 'data': None}

    def update_node(self, user_id: int, map_id: int, node_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        mind_map = self.map_model.get_by_id(map_id)
        if not mind_map:
            return {'code': 1, 'msg': '思维导图不存在', 'data': None}

        if not self._check_edit_permission(map_id, user_id):
            return {'code': 1, 'msg': '无编辑权限', 'data': None}

        node = self.node_model.get_by_id(node_id)
        if not node or node.get('map_id') != map_id:
            return {'code': 1, 'msg': '节点不存在', 'data': None}

        data = self._sanitize_node_data(data)

        affected = self.node_model.update(node_id, data)
        if affected >= 0:
            updated_node = self.node_model.get_by_id(node_id)
            self.map_model.update(map_id, {})
            return {'code': 0, 'msg': '更新成功', 'data': self.node_model.to_dict(updated_node)}
        return {'code': 1, 'msg': '更新失败', 'data': None}

    def delete_node(self, user_id: int, map_id: int, node_id: int) -> Dict[str, Any]:
        mind_map = self.map_model.get_by_id(map_id)
        if not mind_map:
            return {'code': 1, 'msg': '思维导图不存在', 'data': None}

        if not self._check_edit_permission(map_id, user_id):
            return {'code': 1, 'msg': '无编辑权限', 'data': None}

        node = self.node_model.get_by_id(node_id)
        if not node or node.get('map_id') != map_id:
            return {'code': 1, 'msg': '节点不存在', 'data': None}

        nodes = self.node_model.get_by_map(map_id)
        child_ids = self._get_all_children(nodes, node_id)
        for child_id in child_ids:
            self.edge_model.delete_by_node(map_id, child_id)
            self.node_model.delete(child_id)

        self.edge_model.delete_by_node(map_id, node_id)
        affected = self.node_model.delete(node_id)

        if affected > 0:
            self.map_model.update(map_id, {})
            return {'code': 0, 'msg': '删除成功', 'data': None}
        return {'code': 1, 'msg': '删除失败', 'data': None}

    def _get_all_children(self, nodes: List[Dict], parent_id: int) -> List[int]:
        children = []
        for node in nodes:
            if node.get('parent_id') == parent_id:
                children.append(node.get('id'))
                children.extend(self._get_all_children(nodes, node.get('id')))
        return children

    def batch_update_nodes(self, user_id: int, map_id: int, nodes: List[Dict[str, Any]]) -> Dict[str, Any]:
        mind_map = self.map_model.get_by_id(map_id)
        if not mind_map:
            return {'code': 1, 'msg': '思维导图不存在', 'data': None}

        if not self._check_edit_permission(map_id, user_id):
            return {'code': 1, 'msg': '无编辑权限', 'data': None}

        updated_nodes = []
        for node_data in nodes:
            node_id = node_data.get('id')
            if node_id:
                self.node_model.update(node_id, node_data)
                updated_node = self.node_model.get_by_id(node_id)
                if updated_node:
                    updated_nodes.append(self.node_model.to_dict(updated_node))

        self.map_model.update(map_id, {})
        return {'code': 0, 'msg': '批量更新成功', 'data': updated_nodes}

    def create_edge(self, user_id: int, map_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        mind_map = self.map_model.get_by_id(map_id)
        if not mind_map:
            return {'code': 1, 'msg': '思维导图不存在', 'data': None}

        if not self._check_edit_permission(map_id, user_id):
            return {'code': 1, 'msg': '无编辑权限', 'data': None}

        source_id = data.get('source_id')
        target_id = data.get('target_id')
        if not source_id or not target_id:
            return {'code': 1, 'msg': '缺少节点ID', 'data': None}

        source = self.node_model.get_by_id(source_id)
        target = self.node_model.get_by_id(target_id)
        if not source or source.get('map_id') != map_id:
            return {'code': 1, 'msg': '源节点不存在', 'data': None}
        if not target or target.get('map_id') != map_id:
            return {'code': 1, 'msg': '目标节点不存在', 'data': None}

        edge_id = self.edge_model.create(
            map_id=map_id,
            source_id=source_id,
            target_id=target_id,
            label=data.get('label', ''),
            line_type=data.get('line_type', 'curve'),
            line_color=data.get('line_color', '#909399'),
            line_width=data.get('line_width', 2)
        )

        if edge_id > 0:
            self.node_model.update(target_id, {'parent_id': source_id})
            self.map_model.update(map_id, {})
            edge = self.edge_model.get_by_id(edge_id)
            return {'code': 0, 'msg': '创建成功', 'data': self.edge_model.to_dict(edge)}
        return {'code': 1, 'msg': '创建连线失败', 'data': None}

    def update_edge(self, user_id: int, map_id: int, edge_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        mind_map = self.map_model.get_by_id(map_id)
        if not mind_map:
            return {'code': 1, 'msg': '思维导图不存在', 'data': None}

        if not self._check_edit_permission(map_id, user_id):
            return {'code': 1, 'msg': '无编辑权限', 'data': None}

        edge = self.edge_model.get_by_id(edge_id)
        if not edge or edge.get('map_id') != map_id:
            return {'code': 1, 'msg': '连线不存在', 'data': None}

        affected = self.edge_model.update(edge_id, data)
        if affected >= 0:
            updated_edge = self.edge_model.get_by_id(edge_id)
            self.map_model.update(map_id, {})
            return {'code': 0, 'msg': '更新成功', 'data': self.edge_model.to_dict(updated_edge)}
        return {'code': 1, 'msg': '更新失败', 'data': None}

    def delete_edge(self, user_id: int, map_id: int, edge_id: int) -> Dict[str, Any]:
        mind_map = self.map_model.get_by_id(map_id)
        if not mind_map:
            return {'code': 1, 'msg': '思维导图不存在', 'data': None}

        if not self._check_edit_permission(map_id, user_id):
            return {'code': 1, 'msg': '无编辑权限', 'data': None}

        edge = self.edge_model.get_by_id(edge_id)
        if not edge or edge.get('map_id') != map_id:
            return {'code': 1, 'msg': '连线不存在', 'data': None}

        target_id = edge.get('target_id')
        affected = self.edge_model.delete(edge_id)
        if affected > 0:
            self.node_model.update(target_id, {'parent_id': 0})
            self.map_model.update(map_id, {})
            return {'code': 0, 'msg': '删除成功', 'data': None}
        return {'code': 1, 'msg': '删除失败', 'data': None}

    def _sanitize_node_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        if 'font_size' in data:
            try:
                fs = int(data['font_size'])
                data['font_size'] = max(10, min(72, fs))
            except (ValueError, TypeError):
                data['font_size'] = 14

        if 'width' in data:
            try:
                w = float(data['width'])
                data['width'] = max(40, min(600, w))
            except (ValueError, TypeError):
                data['width'] = 120

        if 'height' in data:
            try:
                h = float(data['height'])
                data['height'] = max(20, min(300, h))
            except (ValueError, TypeError):
                data['height'] = 40

        return data

    def _check_edit_permission(self, map_id: int, user_id: int) -> bool:
        mind_map = self.map_model.get_by_id(map_id)
        if not mind_map:
            return False
        if mind_map.get('user_id') == user_id:
            return True

        from app.model.siwei_077_model.collaboration import CollaborationModel
        collab_model = CollaborationModel()
        collab = collab_model.get_by_map_and_user(map_id, user_id)
        if collab and collab.get('role') in ['owner', 'editor'] and collab.get('status') == 1:
            return True
        return False

    def get_themes(self) -> Dict[str, Any]:
        return {'code': 0, 'msg': 'success', 'data': MindMapModel.THEMES}

    def get_layouts(self) -> Dict[str, Any]:
        return {'code': 0, 'msg': 'success', 'data': MindMapModel.LAYOUTS}
