from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from app.model.kpi import (
    EmployeeModel,
    AssessmentCycleModel,
    AssessmentDimensionModel,
    AssessmentRecordModel,
    AssessmentScoreModel
)


class KPIBusiness:
    def __init__(self):
        self.employee_model = EmployeeModel()
        self.cycle_model = AssessmentCycleModel()
        self.dimension_model = AssessmentDimensionModel()
        self.record_model = AssessmentRecordModel()
        self.score_model = AssessmentScoreModel()

    def calculate_grade(self, score: float) -> str:
        if score >= 9.0:
            return 'S'
        elif score >= 8.0:
            return 'A'
        elif score >= 7.0:
            return 'B'
        elif score >= 6.0:
            return 'C'
        else:
            return 'D'

    def calculate_weighted_score(self, scores: List[Dict[str, Any]], is_self: bool = True) -> float:
        total = 0.0
        total_weight = 0
        for s in scores:
            score_key = 'self_score' if is_self else 'supervisor_score'
            score = s.get(score_key) or 0
            weight = s.get('weight', 0)
            total += score * weight
            total_weight += weight
        if total_weight == 0:
            return 0.0
        return round(total / total_weight, 2)

    def get_employee_by_user_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.employee_model.get_by_user_id(user_id)

    def get_all_employees(self) -> List[Dict[str, Any]]:
        return self.employee_model.get_all()

    def get_all_departments(self) -> List[str]:
        return self.employee_model.get_all_departments()

    def get_subordinates(self, supervisor_id: int) -> List[Dict[str, Any]]:
        return self.employee_model.get_subordinates(supervisor_id)

    def create_cycle(self, data: Dict[str, Any]) -> int:
        cycle_id = self.cycle_model.create({
            'name': data['name'],
            'year': data['year'],
            'quarter': data['quarter'],
            'start_date': data['start_date'],
            'end_date': data['end_date'],
            'status': data.get('status', 'draft')
        })

        dimensions = data.get('dimensions', [])
        for idx, dim in enumerate(dimensions):
            self.dimension_model.create({
                'cycle_id': cycle_id,
                'name': dim['name'],
                'description': dim.get('description', ''),
                'weight': dim['weight'],
                'sort_order': idx
            })

        return cycle_id

    def update_cycle(self, cycle_id: int, data: Dict[str, Any]) -> bool:
        self.cycle_model.update(cycle_id, {
            'name': data.get('name'),
            'year': data.get('year'),
            'quarter': data.get('quarter'),
            'start_date': data.get('start_date'),
            'end_date': data.get('end_date'),
            'status': data.get('status')
        })

        if 'dimensions' in data:
            self.dimension_model.delete_by_cycle_id(cycle_id)
            for idx, dim in enumerate(data['dimensions']):
                self.dimension_model.create({
                    'cycle_id': cycle_id,
                    'name': dim['name'],
                    'description': dim.get('description', ''),
                    'weight': dim['weight'],
                    'sort_order': idx
                })

        return True

    def delete_cycle(self, cycle_id: int) -> bool:
        self.dimension_model.delete_by_cycle_id(cycle_id)
        records = self.record_model.get_by_cycle_id(cycle_id)
        for r in records:
            self.score_model.delete_by_record_id(r['id'])
        self.cycle_model.delete(cycle_id)
        return True

    def get_all_cycles(self) -> List[Dict[str, Any]]:
        cycles = self.cycle_model.get_all()
        for c in cycles:
            c['dimensions'] = self.dimension_model.get_by_cycle_id(c['id'])
        return cycles

    def get_cycle_by_id(self, cycle_id: int) -> Optional[Dict[str, Any]]:
        cycle = self.cycle_model.get_by_id(cycle_id)
        if cycle:
            cycle['dimensions'] = self.dimension_model.get_by_cycle_id(cycle_id)
        return cycle

    def publish_cycle(self, cycle_id: int) -> bool:
        self.cycle_model.update(cycle_id, {'status': 'active'})

        employees = self.employee_model.get_all()
        dimensions = self.dimension_model.get_by_cycle_id(cycle_id)

        for emp in employees:
            existing = self.record_model.get_by_cycle_and_employee(cycle_id, emp['id'])
            if existing:
                continue

            record_id = self.record_model.create({
                'cycle_id': cycle_id,
                'employee_id': emp['id'],
                'status': 'pending'
            })

            for dim in dimensions:
                self.score_model.create({
                    'record_id': record_id,
                    'dimension_id': dim['id']
                })

        return True

    def get_assessment_records_by_employee(self, employee_id: int) -> List[Dict[str, Any]]:
        records = self.record_model.get_by_employee_id(employee_id)
        return records

    def get_assessment_record_detail(self, record_id: int) -> Optional[Dict[str, Any]]:
        record = self.record_model.get_by_id(record_id)
        if not record:
            return None
        record['scores'] = self.score_model.get_by_record_id(record_id)
        employee = self.employee_model.get_by_id(record['employee_id'])
        if employee:
            record['employee'] = employee
        cycle = self.cycle_model.get_by_id(record['cycle_id'])
        if cycle:
            record['cycle'] = cycle
        return record

    def submit_self_review(self, record_id: int, data: Dict[str, Any]) -> bool:
        scores = data.get('scores', [])
        for s in scores:
            score_id = s.get('id')
            if score_id:
                self.score_model.update(score_id, {
                    'self_score': s.get('self_score'),
                    'self_comment': s.get('self_comment', '')
                })

        updated_scores = self.score_model.get_by_record_id(record_id)
        self_total = self.calculate_weighted_score(updated_scores, is_self=True)

        self.record_model.update(record_id, {
            'self_review_comment': data.get('self_review_comment', ''),
            'self_total_score': self_total,
            'self_reviewed_at': datetime.now().isoformat(),
            'status': 'self_reviewed'
        })

        return True

    def get_pending_reviews_by_supervisor(self, supervisor_id: int, cycle_id: Optional[int] = None) -> List[Dict[str, Any]]:
        return self.record_model.get_by_supervisor_id(supervisor_id, cycle_id)

    def submit_supervisor_review(self, record_id: int, data: Dict[str, Any]) -> bool:
        scores = data.get('scores', [])
        for s in scores:
            score_id = s.get('id')
            if score_id:
                self.score_model.update(score_id, {
                    'supervisor_score': s.get('supervisor_score'),
                    'supervisor_comment': s.get('supervisor_comment', '')
                })

        updated_scores = self.score_model.get_by_record_id(record_id)
        supervisor_total = self.calculate_weighted_score(updated_scores, is_self=False)

        record = self.record_model.get_by_id(record_id)
        self_total = record.get('self_total_score', 0)
        final_score = round((self_total * 0.4 + supervisor_total * 0.6), 2)
        grade = self.calculate_grade(final_score)

        self.record_model.update(record_id, {
            'supervisor_comment': data.get('supervisor_comment', ''),
            'supervisor_total_score': supervisor_total,
            'final_score': final_score,
            'grade': grade,
            'supervisor_reviewed_at': datetime.now().isoformat(),
            'status': 'completed'
        })

        return True

    def get_records_by_cycle(self, cycle_id: int) -> List[Dict[str, Any]]:
        return self.record_model.get_by_cycle_id(cycle_id)

    def get_statistics(self, cycle_id: int, department: Optional[str] = None) -> Dict[str, Any]:
        stats = self.record_model.get_statistics_by_cycle_and_department(cycle_id, department)

        grade_distribution = {'S': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0}
        for g in stats.get('grade_stats', []):
            if g.get('grade') in grade_distribution:
                grade_distribution[g['grade']] = g['count']

        score_list = stats.get('score_list', [])
        score_ranges = {
            '0-5.9': 0,
            '6-6.9': 0,
            '7-7.9': 0,
            '8-8.9': 0,
            '9-10': 0
        }
        for s in score_list:
            if s < 6:
                score_ranges['0-5.9'] += 1
            elif s < 7:
                score_ranges['6-6.9'] += 1
            elif s < 8:
                score_ranges['7-7.9'] += 1
            elif s < 9:
                score_ranges['8-8.9'] += 1
            else:
                score_ranges['9-10'] += 1

        return {
            'grade_distribution': grade_distribution,
            'score_ranges': score_ranges,
            'total_count': len(score_list),
            'avg_score': round(sum(score_list) / len(score_list), 2) if score_list else 0
        }

    def get_employee_trend(self, employee_id: int) -> Dict[str, Any]:
        records = self.record_model.get_by_employee_id(employee_id)
        x_labels = []
        scores = []
        grades = []
        for r in records:
            if r.get('final_score') is not None:
                year = r.get('year', '')
                quarter = r.get('quarter', '')
                x_labels.append(f"{year}Q{quarter}")
                scores.append(r['final_score'])
                grades.append(r.get('grade', ''))
        return {
            'x_labels': x_labels,
            'scores': scores,
            'grades': grades
        }

    def get_records_by_department(self, department: str, cycle_id: Optional[int] = None) -> List[Dict[str, Any]]:
        return self.record_model.get_by_department(department, cycle_id)


kpi_business = KPIBusiness()
