import json
import random
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.model.mxt import DailyHotModel, JobModel


class DailyHotBusiness:
    def __init__(self):
        self.model = DailyHotModel()
        self.job_model = JobModel()

    def _select_random_jobs(self, count: int = 3) -> List[int]:
        active_jobs = self.job_model.get_active()
        if not active_jobs:
            return []
        
        job_ids = [job.get('id') for job in active_jobs]
        if len(job_ids) <= count:
            return job_ids
        
        return random.sample(job_ids, count)

    def get_today_hot(self) -> Dict[str, Any]:
        today = datetime.now().strftime('%Y-%m-%d')
        hot_record = self.model.get_by_date(today)
        
        if not hot_record:
            job_ids = self._select_random_jobs(3)
            self.model.create(date=today, job_ids=json.dumps(job_ids))
            hot_record = self.model.get_by_date(today)
        
        job_ids = json.loads(hot_record.get('job_ids', '[]')) if hot_record else []
        
        jobs = []
        for job_id in job_ids:
            job = self.job_model.get_by_id(job_id)
            if job:
                jobs.append({
                    'id': job.get('id'),
                    'name': job.get('name'),
                    'icon': job.get('icon'),
                    'description': job.get('description'),
                    'requirements': job.get('requirements')
                })
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'date': today,
                'job_ids': job_ids,
                'jobs': jobs
            }
        }

    def refresh_hot(self) -> Dict[str, Any]:
        today = datetime.now().strftime('%Y-%m-%d')
        existing = self.model.get_by_date(today)
        
        job_ids = self._select_random_jobs(3)
        
        if existing:
            self.model.delete(existing.get('id'))
        
        self.model.create(date=today, job_ids=json.dumps(job_ids))
        
        jobs = []
        for job_id in job_ids:
            job = self.job_model.get_by_id(job_id)
            if job:
                jobs.append({
                    'id': job.get('id'),
                    'name': job.get('name'),
                    'icon': job.get('icon'),
                    'description': job.get('description'),
                    'requirements': job.get('requirements')
                })
        
        return {
            'code': 0,
            'message': '刷新成功',
            'data': {
                'date': today,
                'job_ids': job_ids,
                'jobs': jobs
            }
        }

    def get_all_hot_records(self) -> Dict[str, Any]:
        records = self.model.get_all()
        
        result = []
        for record in records:
            result.append({
                'id': record.get('id'),
                'date': record.get('date'),
                'job_ids': json.loads(record.get('job_ids', '[]')),
                'created_at': record.get('created_at')
            })
        
        return {
            'code': 0,
            'message': 'success',
            'data': result
        }
