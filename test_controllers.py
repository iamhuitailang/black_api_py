import os
import importlib.util
import inspect
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

controller_dir = os.path.dirname(os.path.abspath(__file__))
controller_path = os.path.join(controller_dir, 'app', 'controller')
print(f'Controller path: {controller_path}')
print(f'Exists: {os.path.exists(controller_path)}')

for root, dirs, files in os.walk(controller_path):
    print(f'\nRoot: {root}')
    print(f'Files: {files}')
    for file in files:
        if file.endswith('_controller.py') and file != '__init__.py':
            module_path = os.path.join(root, file)
            relative_path = os.path.relpath(module_path, controller_path)
            module_name = relative_path.replace(os.sep, '.')[:-3]
            full_module_name = f'app.controller.{module_name}'
            print(f'\nLoading: {full_module_name}')
            print(f'  From: {module_path}')
            try:
                spec = importlib.util.spec_from_file_location(full_module_name, module_path)
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                for name, obj in inspect.getmembers(module, inspect.isclass):
                    if name.endswith('Controller'):
                        print(f'  ✓ Found Controller: {name}')
            except Exception as e:
                print(f'  ✗ Error: {e}')
                import traceback
                traceback.print_exc()
