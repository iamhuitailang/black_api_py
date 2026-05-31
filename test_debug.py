import requests
import json

BASE = 'http://localhost:8001/api/jiudian077'

r = requests.post(f'{BASE}/user/login', json={'account': 'admin', 'password': 'admin123'})
admin_data = r.json()
admin_token = admin_data['data']['token']
admin_headers = {'Authorization': f'Bearer {admin_token}'}

r = requests.get(f'{BASE}/booking/list/get', headers=admin_headers, params={'page_size': 20})
bookings = r.json()
print('All bookings with dates:')
for b in bookings['data']['items']:
    room_info = b.get('room') or {}
    print(f'  Booking {b["id"]}: room_id={b["room_id"]} room={room_info.get("room_number","?")} status={b["status"]} check_in={b["check_in_date"]} check_out={b["check_out_date"]}')

print()
print('=== Test booking room 3 (101, status=0 after update) for far future dates ===')
r = requests.post(f'{BASE}/user/login', json={'account': 'testuser1', 'password': 'test123'})
user_data = r.json()
if user_data['code'] == 0:
    user_token = user_data['data']['token']
    user_headers = {'Authorization': f'Bearer {user_token}'}
    
    booking_data = {
        'room_id': 3,
        'check_in_date': '2026-08-01',
        'check_out_date': '2026-08-02',
        'guest_name': '测试用户',
        'guest_phone': '13900009999',
        'guests_count': 1,
        'remark': 'test'
    }
    r = requests.post(f'{BASE}/booking/create', json=booking_data, headers=user_headers)
    result = r.json()
    print(f'Booking room 3: code={result["code"]} msg={result["msg"]}')
    if result['code'] == 0:
        print(f'  Booking ID: {result["data"]["id"]}')
    
    booking_data2 = {
        'room_id': 4,
        'check_in_date': '2026-08-01',
        'check_out_date': '2026-08-02',
        'guest_name': '测试用户',
        'guest_phone': '13900009999',
        'guests_count': 1,
        'remark': 'test'
    }
    r = requests.post(f'{BASE}/booking/create', json=booking_data2, headers=user_headers)
    result = r.json()
    print(f'Booking room 4: code={result["code"]} msg={result["msg"]}')
    if result['code'] == 0:
        print(f'  Booking ID: {result["data"]["id"]}')

print()
print('=== Test room update via API ===')
r = requests.post(f'{BASE}/room/update?room_id=3', json={
    'room_number': '101',
    'type': 'single',
    'floor': 1,
    'area': 25,
    'price': 399,
    'max_guests': 2,
    'bed_count': 1,
    'facilities': ['WiFi', '空调'],
    'description': '舒适单人间',
    'status': 0
}, headers=admin_headers)
print(f'Room 3 update: code={r.json()["code"]} msg={r.json()["msg"]}')

r = requests.post(f'{BASE}/room/update?room_id=4', json={
    'room_number': '201',
    'type': 'double',
    'floor': 2,
    'area': 35,
    'price': 359,
    'max_guests': 2,
    'bed_count': 1,
    'facilities': ['WiFi', '空调', '独立卫浴'],
    'description': '舒适双人间-已更新',
    'status': 0
}, headers=admin_headers)
print(f'Room 4 update: code={r.json()["code"]} msg={r.json()["msg"]}')

print()
print('=== Test room delete (room with no active bookings) ===')
r = requests.post(f'{BASE}/room/create', json={
    'room_number': '301',
    'type': 'suite',
    'floor': 3,
    'price': 699,
    'area': 50,
    'bed_count': 2,
    'max_guests': 4,
    'facilities': ['WiFi', '空调', '电视', '独立卫浴', '浴缸'],
    'description': '豪华套房'
}, headers=admin_headers)
create_result = r.json()
print(f'Create room: code={create_result["code"]} msg={create_result["msg"]}')
if create_result['code'] == 0:
    new_room_id = create_result['data']['id']
    r = requests.post(f'{BASE}/room/delete?room_id={new_room_id}', headers=admin_headers)
    print(f'Delete room {new_room_id}: code={r.json()["code"]} msg={r.json()["msg"]}')

print()
print('=== Check dashboard stats ===')
r = requests.get(f'{BASE}/admin/dashboard/get', headers=admin_headers)
d = r.json()['data']
print(f'  total_rooms={d["total_rooms"]}, available={d["available_rooms"]}, occupied={d["occupied_rooms"]}')
print(f'  total_bookings={d["total_bookings"]}, confirmed_bookings={d["confirmed_bookings"]}')
print(f'  today_check_ins={d["today_check_ins"]}, today_check_outs={d["today_check_outs"]}')
print(f'  currentGuests(occupied)={d["occupied_rooms"]}, pendingCheckin(confirmed)={d["confirmed_bookings"]}')
