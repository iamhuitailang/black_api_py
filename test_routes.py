import re
from enum import Enum

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

# 测试登录方法
test_methods = [
    'ActionJianliUserLoginPost',
    'ActionJianliUserRegisterPost',
    'ActionJianliTemplateListGet',
    'ActionJianliResumeCreatePost',
    'ActionJianliSettingsListGet',
]

print("Testing route parsing:")
for method in test_methods:
    path, http_method = _parse_action_name(method)
    print(f'  {method} -> {http_method.upper()} {path}')
