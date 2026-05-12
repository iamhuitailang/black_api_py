import requests
import json
from datetime import datetime, timedelta

BASE = "http://localhost:8000/api"

# 创建菜品
print("=== 创建菜品 ===")
for i in range(1, 6):
    dish_data = {
        "category_id": 1,
        "name": f"测试菜品{i}",
        "price": 10.0 + i,
        "cost": 5.0 + i/2,
        "stock": 100,
        "image_url": "",
        "description": f"这是测试菜品{i}",
        "sort_order": i
    }
    r = requests.post(f"{BASE}/order/dish/create", json=dish_data)
    result = r.json()
    print(f"  菜品{i}: {result['msg']}")

# 获取菜品列表
r = requests.get(f"{BASE}/order/dish/list")
dishes = r.json()['data']['items']
dish_ids = [d['id'] for d in dishes]
print(f"\n共找到 {len(dish_ids)} 个菜品")

# 创建今日菜单
today = datetime.now().strftime("%Y-%m-%d")
print(f"\n=== 创建 {today} 的菜单 ===")

for meal_type in ['breakfast', 'lunch', 'dinner']:
    menu_data = {
        "menu_date": today,
        "meal_type": meal_type,
        "dish_list": [{"dish_id": did, "max_quantity": 5} for did in dish_ids[:3]]
    }
    r = requests.post(f"{BASE}/order/daily-menu/create", json=menu_data)
    result = r.json()
    print(f"  {meal_type}: {result['msg']}")

# 创建明天的菜单
tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
print(f"\n=== 创建 {tomorrow} 的菜单 ===")

for meal_type in ['breakfast', 'lunch', 'dinner']:
    menu_data = {
        "menu_date": tomorrow,
        "meal_type": meal_type,
        "dish_list": [{"dish_id": did, "max_quantity": 5} for did in dish_ids[2:5]]
    }
    r = requests.post(f"{BASE}/order/daily-menu/create", json=menu_data)
    result = r.json()
    print(f"  {meal_type}: {result['msg']}")

# 测试下单
print("\n=== 测试下单 ===")
for i in range(1, 4):
    order_data = {
        "user_id": 2,
        "menu_date": today,
        "meal_type": "lunch",
        "items": [
            {"dish_id": dish_ids[0], "quantity": 1},
            {"dish_id": dish_ids[1], "quantity": 1}
        ],
        "remark": f"测试订单{i}"
    }
    r = requests.post(f"{BASE}/order/order/create", json=order_data)
    result = r.json()
    print(f"  订单{i}: {result['msg']}")

print("\n=== 测试数据创建完成！===")

# 查看餐段配置
print("\n=== 餐段配置 ===")
r = requests.get(f"{BASE}/order/meal-type/list")
print(json.dumps(r.json(), indent=2, ensure_ascii=False))

# 查看今日午餐菜单
print("\n=== 今日午餐菜单 ===")
r = requests.get(f"{BASE}/order/daily-menu/list", params={"menu_date": today, "meal_type": "lunch"})
print(json.dumps(r.json(), indent=2, ensure_ascii=False))

# 查看用户订单
print("\n=== 用户订单 ===")
r = requests.get(f"{BASE}/order/order/user", params={"user_id": 2, "page": 1, "page_size": 10})
print(json.dumps(r.json(), indent=2, ensure_ascii=False))

# 测试核销
print("\n=== 测试核销 ===")
r = requests.get(f"{BASE}/order/order/user", params={"user_id": 2, "page": 1, "page_size": 1})
orders = r.json()['data']['items']
if orders:
    qrcode = orders[0]['qrcode']
    verify_data = {
        "qrcode": qrcode,
        "verified_by": 1
    }
    r = requests.post(f"{BASE}/order/order/verify", json=verify_data)
    result = r.json()
    print(f"  核销订单 {orders[0]['order_no']}: {result['msg']}")