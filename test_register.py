import os
import importlib.util
import inspect
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

controller_dir = os.path.dirname(os.path.abspath(__file__))
controller_path = os.path.join(controller_dir, 'app', 'controller')

print(f'Controller path: {controller_path}')
print(f'Exists: {os.path.exists(controller_path)}')

import re
from enum import Enum
from fastapi import APIRouter

class HTTPMethod(Enum):
    GET = 'get'
    POST = 'post'
    PUT = 'put'
    DELETE = 'delete'
    PATCH = 'patch'

def _parse_action_name(method_name):
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
            if suffix != 'Post':
                action_path_suffix = suffix.lower()
            else:
                action_path_suffix = ''
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

for root, dirs, files in os.walk(controller_path):
    for file in files:
        if file.endswith('_controller.py') and file != '__init__.py':
            module_path = os.path.join(root, file)
            relative_path = os.path.relpath(module_path, controller_path)
            module_name = relative_path.replace(os.sep, '.')[:-3]
            full_module_name = f'app.controller.{module_name}'
            print(f'\nLoading: {full_module_name}')
            try:
                spec = importlib.util.spec_from_file_location(full_module_name, module_path)
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                for name, obj in inspect.getmembers(module, inspect.isclass):
                    if name.endswith('Controller'):
                        print(f'  ✓ Found Controller: {name}')
                        instance = obj()
                        for method_name, method in inspect.getmembers(obj):
                            if method_name.startswith('Action'):
                                route_path, http_method = _parse_action_name(method_name)
                                if route_path:
                                    print(f'    → {http_method.upper()} {route_path}')
            except Exception as e:
                print(f'  ✗ Error: {e}')
                import traceback
                traceback.print_exc()
