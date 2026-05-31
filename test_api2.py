import urllib.request
import json

def api(method, path, data=None, token=None):
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
        body_text = e.read().decode()
        try:
            return json.loads(body_text)
        except:
            return {'code': e.code, 'msg': body_text, 'data': None}
    except Exception as e:
        return {'code': -1, 'msg': str(e), 'data': None}

# Register a fresh user
print('=== Register fresh user ===')
r = api('POST', '/user/register', {'username':'buyer1','phone':'13700001001','password':'test123','nickname':'Buyer1'})
print('Register:', r.get('code'), r.get('msg'))
token = r['data']['token'] if r.get('code') == 0 else None
user = r['data']['user'] if r.get('code') == 0 else None

if not token:
    r = api('POST', '/user/login', {'account':'buyer1','password':'test123'})
    token = r['data']['token']
    user = r['data']['user']

print('User:', user.get('username'), 'Phone:', user.get('phone'))

# Get room list
print('\n=== Available Rooms ===')
r = api('GET', '/room/available/get?page=1&page_size=10', token=token)
rooms = r['data']['items'] if r.get('code') == 0 else []
for room in rooms:
    print(f"  Room {room['id']}: {room['room_number']} ({room['type_text']}) - ¥{room['price']}/night - status={room['status']} ({type(room['status']).__name__})")

# Try booking first available room
if rooms:
    room = rooms[0]
    print(f'\n=== Booking Room {room["id"]} ===')
    booking_data = {
        'room_id': room['id'],
        'check_in_date': '2026-07-10',
        'check_out_date': '2026-07-12',
        'guest_name': user.get('nickname') or user.get('username'),
        'guest_phone': user.get('phone'),
        'guests_count': 1,
        'remark': 'test booking'
    }
    r = api('POST', '/booking/create', booking_data, token)
    print('Booking result:', r.get('code'), r.get('msg'))
    if r.get('code') == 0:
        print('  Booking ID:', r['data'].get('id'))
        print('  Booking No:', r['data'].get('booking_no'))
        print('  Status:', r['data'].get('status'), r['data'].get('status_text'))
else:
    print('No rooms available!')

# Test room update (admin)
print('\n=== Admin: Room Update ===')
admin_r = api('POST', '/user/login', {'account': 'admin', 'password': 'admin123'})
admin_token = admin_r['data']['token']

# Try updating room 4
update_data = {
    'room_number': '201',
    'type': 'double',
    'floor': 2,
    'price': 359,
    'area': 35,
    'bed_count': 1,
    'max_guests': 2,
    'facilities': ['WiFi', '空调', '独立卫浴'],
    'description': '舒适双人间-已更新',
    'status': 0
}
r = api('POST', '/room/update?room_id=4', update_data, admin_token)
print('Update room 4:', r.get('code'), r.get('msg'))
if r.get('code') == 0:
    print('  Updated price:', r['data'].get('price'))

# Test room delete (admin) - try deleting a room without active bookings
print('\n=== Admin: Room Delete ===')
# First find a room without bookings
all_rooms_r = api('GET', '/room/list/get?page=1&page_size=10', token=admin_token)
if all_rooms_r.get('code') == 0:
    for rm in all_rooms_r['data']['items']:
        print(f"  Room {rm['id']}: {rm['room_number']} status={rm['status']}")
    # Try deleting room 5
    r = api('POST', '/room/delete?room_id=5', None, admin_token)
    print('Delete room 5:', r.get('code'), r.get('msg'))

# Dashboard stats
print('\n=== Dashboard Stats ===')
r = api('GET', '/admin/dashboard/get', token=admin_token)
if r.get('code') == 0:
    d = r['data']
    print('total_bookings:', d.get('total_bookings'))
    print('confirmed_bookings:', d.get('confirmed_bookings'))
    print('total_rooms:', d.get('total_rooms'))
    print('available_rooms:', d.get('available_rooms'))
    print('occupied_rooms:', d.get('occupied_rooms'))
    print('today_check_ins:', d.get('today_check_ins'))
    print('today_check_outs:', d.get('today_check_outs'))

# Booking list (admin)
print('\n=== Booking List (Admin) ===')
r = api('GET', '/booking/list/get?page=1&page_size=10', token=admin_token)
if r.get('code') == 0:
    print('Total:', r['data']['total'])
    for b in r['data']['items']:
        room_info = b.get('room') or {}
        user_info = b.get('user') or {}
        print(f"  {b['booking_no']} | status={b['status']}({b.get('status_text')}) | room={room_info.get('room_number','-')} | user={user_info.get('username','-')} | phone={b.get('guest_phone','-')}")
