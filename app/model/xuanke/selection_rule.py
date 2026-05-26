from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class SelectionRuleModel:
    TABLE_NAME = 'tb_xuanke_selection_rules'

    PHASE_PRESELECTION = 'preselection'
    PHASE_LOTTERY = 'lottery'
    PHASE_REGULAR = 'regular'
    PHASE_ADD_DROP = 'add_drop'
    PHASE_CLOSED = 'closed'

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
                rule_key TEXT NOT NULL UNIQUE,
                rule_value TEXT NOT NULL,
                rule_name TEXT NOT NULL,
                description TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_rule_key ON {cls.TABLE_NAME}(rule_key)"
        db.execute(index_sql)

    @classmethod
    def init_default_rules(cls):
        model = cls()
        count = model.query.count()
        if count > 0:
            return

        default_rules = [
            {'rule_key': 'min_credits', 'rule_value': '12', 'rule_name': '最低学分', 'description': '每学期最少选修学分'},
            {'rule_key': 'max_credits', 'rule_value': '28', 'rule_name': '最高学分', 'description': '每学期最多选修学分'},
            {'rule_key': 'required_courses_mandatory', 'rule_value': 'true', 'rule_name': '必修课必选', 'description': '是否必须选择所有必修课'},
            {'rule_key': 'general_courses_required', 'rule_value': '4', 'rule_name': '通识课要求', 'description': '毕业前需修满通识课门数'},
            {'rule_key': 'current_phase', 'rule_value': 'regular', 'rule_name': '当前选课阶段', 'description': 'preselection-预选, lottery-抽签, regular-正选, add_drop-补退选, closed-结束'},
            {'rule_key': 'current_semester', 'rule_value': '2025-2026学年第二学期', 'rule_name': '当前学期', 'description': '当前选课学期'},
            {'rule_key': 'enable_time_conflict_check', 'rule_value': 'true', 'rule_name': '时间冲突检测', 'description': '是否检测上课时间冲突'},
            {'rule_key': 'enable_prerequisite_check', 'rule_value': 'false', 'rule_name': '先修课检测', 'description': '是否检测先修课程要求'},
        ]

        now = datetime.now().isoformat()
        for rule in default_rules:
            rule['created_at'] = now
            rule['updated_at'] = now

        model.exec.insert_many(default_rules)
        print(f"  - Inserted {len(default_rules)} default selection rules")

    def create(self, rule_key: str, rule_value: str, rule_name: str, description: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'rule_key': rule_key,
            'rule_value': rule_value,
            'rule_name': rule_name,
            'description': description,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.upsert(data, ['rule_key'])

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_key(self, rule_key: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'rule_key': rule_key})

    def get_value(self, rule_key: str, default: Any = None) -> Any:
        rule = self.get_by_key(rule_key)
        if not rule:
            return default
        value = rule.get('rule_value', '')
        if value.lower() in ['true', 'false']:
            return value.lower() == 'true'
        try:
            return int(value)
        except ValueError:
            try:
                return float(value)
            except ValueError:
                return value

    def set_value(self, rule_key: str, rule_value: Any) -> int:
        rule = self.get_by_key(rule_key)
        if not rule:
            return 0
        now = datetime.now().isoformat()
        if isinstance(rule_value, bool):
            value_str = 'true' if rule_value else 'false'
        elif isinstance(rule_value, (int, float)):
            value_str = str(rule_value)
        else:
            value_str = str(rule_value)
        data = {
            'rule_value': value_str,
            'updated_at': now
        }
        return self.exec.update_by_id(rule.get('id'), data)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'rule_key', 'rule_value', 'rule_name', 'description'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id ASC')

    def get_current_phase(self) -> str:
        return self.get_value('current_phase', self.PHASE_REGULAR)

    def get_phase_text(self, phase: str) -> str:
        phase_map = {
            self.PHASE_PRESELECTION: '预选阶段',
            self.PHASE_LOTTERY: '抽签阶段',
            self.PHASE_REGULAR: '正选阶段',
            self.PHASE_ADD_DROP: '补退选阶段',
            self.PHASE_CLOSED: '选课结束'
        }
        return phase_map.get(phase, '未知阶段')

    def can_enroll(self) -> bool:
        phase = self.get_current_phase()
        return phase in [self.PHASE_PRESELECTION, self.PHASE_REGULAR, self.PHASE_ADD_DROP]

    def can_drop(self) -> bool:
        phase = self.get_current_phase()
        return phase in [self.PHASE_REGULAR, self.PHASE_ADD_DROP]

    def to_public_dict(self, rule: Dict[str, Any]) -> Dict[str, Any]:
        value = rule.get('rule_value', '')
        parsed_value = value
        if value.lower() in ['true', 'false']:
            parsed_value = value.lower() == 'true'
        else:
            try:
                parsed_value = int(value)
            except ValueError:
                try:
                    parsed_value = float(value)
                except ValueError:
                    parsed_value = value

        return {
            'id': rule.get('id'),
            'rule_key': rule.get('rule_key'),
            'rule_value': parsed_value,
            'rule_name': rule.get('rule_name'),
            'description': rule.get('description'),
            'created_at': rule.get('created_at')
        }
