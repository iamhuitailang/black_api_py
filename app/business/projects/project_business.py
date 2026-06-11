from typing import Dict, Any, List, Optional
import re
import httpx
from app.model.projects import ProjectModel


class ProjectBusiness:
    GITHUB_API_BASE = "https://api.github.com"

    def __init__(self):
        self.model = ProjectModel()

    def _extract_github_info(self, github_url: str) -> Optional[str]:
        pattern = r'github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$'
        match = re.search(pattern, github_url)
        if match:
            owner = match.group(1)
            repo = match.group(2)
            return f"{owner}/{repo}"
        return None

    async def _fetch_github_repo(self, full_name: str) -> Optional[Dict[str, Any]]:
        url = f"{self.GITHUB_API_BASE}/repos/{full_name}"
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "GitHub-Star-Favorites-App"
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    return response.json()
                return None
        except Exception:
            return None

    async def add_project(self, github_url: str, tags: Optional[List[str]] = None,
                          priority: str = 'want_to_read', note: Optional[str] = None) -> Dict[str, Any]:
        github_url = github_url.strip()
        if not github_url:
            return {
                'code': 1,
                'message': 'GitHub URL cannot be empty',
                'data': None
            }

        if 'github.com' not in github_url:
            return {
                'code': 1,
                'message': 'Please enter a valid GitHub URL',
                'data': None
            }

        full_name = self._extract_github_info(github_url)
        if not full_name:
            return {
                'code': 1,
                'message': 'Invalid GitHub URL format',
                'data': None
            }

        existing = self.model.get_by_github_url(github_url)
        if existing:
            return {
                'code': 1,
                'message': 'Project already exists in favorites',
                'data': existing
            }

        repo_info = await self._fetch_github_repo(full_name)
        if not repo_info:
            return {
                'code': 1,
                'message': 'Failed to fetch GitHub repository info. Please check the URL or try again later.',
                'data': None
            }

        project_id = self.model.create(
            github_url=github_url,
            name=repo_info.get('name', full_name.split('/')[-1]),
            description=repo_info.get('description'),
            language=repo_info.get('language'),
            stars=repo_info.get('stargazers_count', 0),
            tags=tags or [],
            priority=priority,
            note=note
        )

        project = self.model.get_by_id(project_id)
        return {
            'code': 0,
            'message': 'Project added successfully',
            'data': project
        }

    def get_projects(self, search: Optional[str] = None, language: Optional[str] = None,
                     priority: Optional[str] = None, tag: Optional[str] = None) -> Dict[str, Any]:
        projects = self.model.get_all(
            search=search,
            language=language,
            priority=priority,
            tag=tag
        )
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': projects,
                'total': len(projects)
            }
        }

    def get_languages(self) -> Dict[str, Any]:
        languages = self.model.get_distinct_languages()
        return {
            'code': 0,
            'message': 'success',
            'data': languages
        }

    def get_random_project(self) -> Dict[str, Any]:
        project = self.model.get_random_want_to_read()
        if not project:
            return {
                'code': 1,
                'message': 'No "want to read" projects found. Add some projects first!',
                'data': None
            }
        return {
            'code': 0,
            'message': 'success',
            'data': project
        }

    def update_project(self, project_id: int, tags: Optional[List[str]] = None,
                       priority: Optional[str] = None, note: Optional[str] = None) -> Dict[str, Any]:
        existing = self.model.get_by_id(project_id)
        if not existing:
            return {
                'code': 1,
                'message': 'Project not found',
                'data': None
            }

        affected = self.model.update(
            project_id=project_id,
            tags=tags,
            priority=priority,
            note=note
        )

        if affected > 0:
            updated = self.model.get_by_id(project_id)
            return {
                'code': 0,
                'message': 'Update successful',
                'data': updated
            }

        return {
            'code': 1,
            'message': 'No changes made',
            'data': None
        }

    def delete_project(self, project_id: int) -> Dict[str, Any]:
        existing = self.model.get_by_id(project_id)
        if not existing:
            return {
                'code': 1,
                'message': 'Project not found',
                'data': None
            }

        affected = self.model.delete(project_id)
        if affected > 0:
            return {
                'code': 0,
                'message': 'Delete successful',
                'data': None
            }

        return {
            'code': 1,
            'message': 'Delete failed',
            'data': None
        }

    def batch_delete_projects(self, ids: List[int]) -> Dict[str, Any]:
        if not ids:
            return {
                'code': 1,
                'message': 'No project IDs provided',
                'data': None
            }

        deleted_count = self.model.batch_delete(ids)
        if deleted_count > 0:
            return {
                'code': 0,
                'message': f'Successfully deleted {deleted_count} projects',
                'data': {'deleted_count': deleted_count}
            }

        return {
            'code': 1,
            'message': 'No projects deleted',
            'data': None
        }
