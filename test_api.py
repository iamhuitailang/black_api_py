import urllib.request
import json

def api_call(method, path, data=None, token=None):
    url = 'http://localhost:8001/api/jiudian077' + path
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(req)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {'code': e.code, 'msg': e.read().decode(), 'data': None}
    except Exception as e:
        return {'code': -1, 'msg': str(e), 'data': None}

print('=== Test 1: Login ===')
result = api_call('POST', '/user/login', {'account': 'testuser1', 'password': 'test123'})
print('Code:', result.get('code'), 'Msg:', result.get('msg'))
if result.get('code') != 0:
    print('Login failed, trying to register...')
    result = api_call('POST', '/user/register', {'username': 'testuser2', 'phone': '13900002222', 'password': 'test123', 'nickname': 'Test'})
    print('Register:', result.get('code'), result.get('msg'))
    result = api_call('POST', '/user/login', {'account': 'testuser2', 'password': 'test123'})
    print('Login:', result.get('code'), result.get('msg'))
token = result['data']['token']
user = result['data']['user']
print('User:', user.get('username'), 'Nickname:', user.get('nickname'))

print('\n=== Test 2: Get Room Detail ===')
result = api_call('GET', '/room/detail/get?room_id=3', token=token)
print('Code:', result.get('code'))
if result.get('code') == 0:
    room = result['data']
    print('Room:', room.get('room_number'), 'Type:', room.get('type'), 'Status:', room.get('status'), type(room.get('status')))

print('\n=== Test 3: Create Booking ===')
booking_data = {
    'room_id': 3,
    'check_in_date': '2026-06-10',
    'check_out_date': '2026-06-12',
    'guest_name': user.get('nickname') or user.get('username'),
    'guest_phone': user.get('phone'),
    'guests_count': 1,
    'remark': ''
}
print('Sending:', json.dumps(booking_data, ensure_ascii=False))
result = api_call('POST', '/booking/create', booking_data, token)
print('Code:', result.get('code'), 'Msg:', result.get('msg'))
if result.get('code') == 0:
    print('Booking ID:', result['data'].get('id'), 'Booking No:', result['data'].get('booking_no'))

print('\n=== Test 4: Room Update ===')
admin_result = api_call('POST', '/user/login', {'account': 'admin', 'password': 'admin123'})
admin_token = admin_result['data']['token']
update_data = {
    'room_number': '101',
    'type': 'single',
    'floor': 1,
    'price': 399,
    'area': 25,
    'bed_count': 1,
    'max_guests': 2,
    'facilities': ['WiFi', '空调'],
    'description': '舒适单人间',
    'status': 0
}
print('Sending update:', json.dumps(update_data, ensure_ascii=False))
result = api_call('POST', '/room/update?room_id=3', update_data, admin_token)
print('Code:', result.get('code'), 'Msg:', result.get('msg'))

print('\n=== Test 5: Room Delete ===')
result = api_call('POST', '/room/delete?room_id=999', None, admin_token)
print('Code:', result.get('code'), 'Msg:', result.get('msg'))

print('\n=== Test 6: Dashboard Stats ===')
result = api_call('GET', '/admin/dashboard/get', token=admin_token)
print('Code:', result.get('code'))
if result.get('code') == 0:
    d = result['data']
    print('total_bookings:', d.get('total_bookings'))
    print('today_check_ins:', d.get('today_check_ins'))
    print('today_check_outs:', d.get('today_check_outs'))
    print('occupied_rooms:', d.get('occupied_rooms'))
    print('confirmed_bookings:', d.get('confirmed_bookings'))

print('\n=== Test 7: Booking List ===')
result = api_call('GET', '/booking/list/get?page=1&page_size=10', token=admin_token)
print('Code:', result.get('code'))
if result.get('code') == 0:
    items = result['data']['items']
    print('Total bookings:', result['data']['total'])
    if items:
        b = items[0]
        print('First booking:', b.get('booking_no'), 'status:', b.get('status'), type(b.get('status')))
        print('  room:', b.get('room', {}).get('room_number') if b.get('room') else 'None')
        print('  user:', b.get('user', {}).get('username') if b.get('user') else 'None')
