import os
import importlib
import inspect
import re
from typing import Dict, List, Any, Callable, Tuple
from fastapi import APIRouter, Request
from enum import Enum


class HTTPMethod(Enum):
    GET = "get"
    POST = "post"
    PUT = "put"
    DELETE = "delete"
    PATCH = "patch"


class RouterRegistry:
    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.routers: Dict[str, APIRouter] = {}
        self.controller_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        self._initialized = True

    def _parse_action_name(self, method_name: str) -> Tuple[str, str]:
        """
        解析Action方法名，返回路由路径和HTTP方法
        命名规则: Action{Module}{ActionName}{MethodSuffix}
        - 方法后缀(Get/Set/Post/Put/Delete/Patch)决定HTTP方法
        - 方法后缀同时作为路径的最后一部分
        - 例如: 
            ActionHelloworldGet -> /helloworld/get, GET
            ActionHelloworldSet -> /helloworld/set, POST
            ActionHelloworldDelete -> /helloworld/delete, DELETE
            ActionHelloworldGetList -> /helloworld/get/list, GET
        """
        if not method_name.startswith('Action'):
            return None, None
        
        action_part = method_name[6:]
        
        method_suffixes = {
            'Get': HTTPMethod.GET,
            'Set': HTTPMethod.POST,
            'Post': HTTPMethod.POST,
            'Put': HTTPMethod.PUT,
            'Delete': HTTPMethod.DELETE,
            'Patch': HTTPMethod.PATCH,
        }
        
        http_method = HTTPMethod.GET
        matched_suffix = None
        action_path_suffix = ''
        
        for suffix in sorted(method_suffixes.keys(), key=len, reverse=True):
            if action_part.endswith(suffix):
                http_method = method_suffixes[suffix]
                matched_suffix = suffix
                if suffix in ['Get', 'Post']:
                    action_path_suffix = ''
                else:
                    action_path_suffix = suffix.lower()
                action_part = action_part[:-len(suffix)]
                break
        
        if matched_suffix is None:
            http_method = HTTPMethod.GET
        
        all_parts = re.findall('[A-Z][^A-Z]*', action_part)
        
        if not all_parts:
            if not action_part:
                return None, None
            all_parts = [action_part]
        
        all_parts_lower = [p.lower() for p in all_parts]
        
        if action_path_suffix:
            all_parts_lower.append(action_path_suffix)
        
        route_path = '/' + '/'.join(all_parts_lower)
        
        return route_path, http_method.value

    def _is_action_method(self, method: Callable) -> bool:
        if not callable(method):
            return False
        method_name = getattr(method, '__name__', '')
        return method_name.startswith('Action')

    def _create_wrapper(self, controller_instance: Any, method: Callable):
        """
        创建一个包装函数，保持原始方法的签名
        """
        import functools
        
        @functools.wraps(method)
        async def wrapper(*args, **kwargs):
            if inspect.iscoroutinefunction(method):
                return await method(controller_instance, *args, **kwargs)
            else:
                return method(controller_instance, *args, **kwargs)
        
        sig = inspect.signature(method)
        params = list(sig.parameters.values())
        if params and params[0].name == 'self':
            params = params[1:]
        
        wrapper.__signature__ = sig.replace(parameters=params)
        
        return wrapper

    def _register_controller_routes(self, router: APIRouter, controller_class: type):
        """
        注册单个Controller类中的所有Action方法
        """
        controller_instance = controller_class()
        
        for name, method in inspect.getmembers(controller_class, predicate=self._is_action_method):
            route_path, http_method = self._parse_action_name(name)
            
            if not route_path or not http_method:
                continue
            
            wrapper = self._create_wrapper(controller_instance, method)
            
            route_kwargs = {
                'path': route_path,
                'methods': [http_method.upper()],
                'summary': method.__doc__.split('\n')[0].strip() if method.__doc__ else name,
                'description': method.__doc__ if method.__doc__ else None,
            }
            
            router.add_api_route(endpoint=wrapper, **route_kwargs)

    def _scan_controllers(self) -> List[Tuple[str, type]]:
        """
        扫描controller目录下的所有Controller类
        """
        controllers = []
        controller_path = os.path.join(self.controller_dir, 'app', 'controller')
        
        if not os.path.exists(controller_path):
            return controllers
        
        for root, dirs, files in os.walk(controller_path):
            for file in files:
                if file.endswith('_controller.py') and file != '__init__.py':
                    module_path = os.path.join(root, file)
                    relative_path = os.path.relpath(module_path, controller_path)
                    module_name = relative_path.replace(os.sep, '.')[:-3]
                    
                    full_module_name = f"app.controller.{module_name}"
                    
                    try:
                        spec = importlib.util.spec_from_file_location(full_module_name, module_path)
                        module = importlib.util.module_from_spec(spec)
                        spec.loader.exec_module(module)
                        
                        for name, obj in inspect.getmembers(module, inspect.isclass):
                            if name.endswith('Controller'):
                                controllers.append((module_name, obj))
                    except Exception as e:
                        print(f"Error loading module {full_module_name}: {e}")
        
        return controllers

    def register_all(self, prefix: str = "/api") -> APIRouter:
        """
        注册所有Controller的路由
        返回主APIRouter
        """
        main_router = APIRouter(prefix=prefix)
        
        controllers = self._scan_controllers()
        
        for module_name, controller_class in controllers:
            module_parts = module_name.split('.')
            if len(module_parts) >= 2:
                tag = module_parts[-2]
            else:
                tag = module_parts[0] if module_parts else "default"
            
            router = APIRouter(tags=[tag])
            self._register_controller_routes(router, controller_class)
            main_router.include_router(router)
        
        return main_router

    def get_registered_routes(self) -> List[Dict[str, Any]]:
        """
        获取所有已注册的路由信息
        """
        routes = []
        for router_name, router in self.routers.items():
            for route in router.routes:
                if hasattr(route, 'methods') and hasattr(route, 'path'):
                    routes.append({
                        'path': route.path,
                        'methods': list(route.methods) if route.methods else [],
                        'name': route.name,
                        'router': router_name
                    })
        return routes


def get_router_registry():
    return RouterRegistry()
