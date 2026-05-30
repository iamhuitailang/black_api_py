from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import math
from app.model.chefei_model import VehicleTypeModel, ParkingRecordModel


class ParkingBusiness:
    def __init__(self):
        self.vehicle_type_model = VehicleTypeModel()
        self.parking_record_model = ParkingRecordModel()

    def _calculate_fee(self, entry_time: str, exit_time: str, rate_per_hour: float,
                       free_minutes: int, daily_cap: float) -> Dict[str, Any]:
        entry_dt = datetime.fromisoformat(entry_time)
        exit_dt = datetime.fromisoformat(exit_time)

        total_seconds = (exit_dt - entry_dt).total_seconds()
        parking_duration = int(total_seconds // 60)

        if parking_duration <= free_minutes:
            return {
                'parking_duration': parking_duration,
                'billable_minutes': 0,
                'total_fee': 0.0,
                'free': True
            }

        billable_minutes = parking_duration - free_minutes
        billable_hours = math.ceil(billable_minutes / 60)

        hours_24 = 24
        if billable_hours >= hours_24:
            days = math.ceil(billable_hours / hours_24)
            total_fee = days * daily_cap
        else:
            total_fee = billable_hours * rate_per_hour
            if total_fee > daily_cap:
                total_fee = daily_cap

        total_fee = round(total_fee, 2)

        return {
            'parking_duration': parking_duration,
            'billable_minutes': billable_minutes,
            'total_fee': total_fee,
            'free': False
        }

    def _format_record(self, item: Dict[str, Any], include_calc: bool = False) -> Dict[str, Any]:
        result = {
            'id': item.get('id'),
            'plate_number': item.get('plate_number'),
            'vehicle_type_id': item.get('vehicle_type_id'),
            'vehicle_type_code': item.get('vehicle_type_code'),
            'vehicle_type_name': item.get('vehicle_type_name'),
            'rate_per_hour': item.get('rate_per_hour'),
            'free_minutes': item.get('free_minutes'),
            'daily_cap': item.get('daily_cap'),
            'entry_time': item.get('entry_time'),
            'exit_time': item.get('exit_time'),
            'parking_duration': item.get('parking_duration'),
            'billable_minutes': item.get('billable_minutes'),
            'total_fee': item.get('total_fee'),
            'status': item.get('status'),
            'created_at': item.get('created_at'),
            'updated_at': item.get('updated_at')
        }

        if include_calc and item.get('status') == 'parking':
            now = datetime.now().isoformat()
            calc_result = self._calculate_fee(
                item.get('entry_time'),
                now,
                item.get('rate_per_hour'),
                item.get('free_minutes'),
                item.get('daily_cap')
            )
            result['current_duration'] = calc_result['parking_duration']
            result['current_fee'] = calc_result['total_fee']

        return result

    def calculate_fee_preview(self, plate_number: str = None, record_id: int = None,
                              vehicle_type_code: str = None, entry_time: str = None) -> Dict[str, Any]:
        try:
            record = None
            if record_id:
                record = self.parking_record_model.get_by_id(record_id)
            elif plate_number:
                record = self.parking_record_model.get_parking_by_plate(plate_number)

            if not record and entry_time and vehicle_type_code:
                vehicle_type = self.vehicle_type_model.get_by_code(vehicle_type_code)
                if not vehicle_type:
                    return {'code': 1, 'message': '车型不存在', 'data': None}

                now = datetime.now().isoformat()
                calc_result = self._calculate_fee(
                    entry_time,
                    now,
                    vehicle_type.get('rate_per_hour'),
                    vehicle_type.get('free_minutes'),
                    vehicle_type.get('daily_cap')
                )

                return {
                    'code': 0,
                    'message': 'success',
                    'data': {
                        'plate_number': plate_number,
                        'vehicle_type': vehicle_type.get('name'),
                        'entry_time': entry_time,
                        'exit_time': now,
                        'parking_duration': calc_result['parking_duration'],
                        'billable_minutes': calc_result['billable_minutes'],
                        'total_fee': calc_result['total_fee'],
                        'free': calc_result['free']
                    }
                }

            if not record:
                return {'code': 1, 'message': '未找到停车记录', 'data': None}

            if record.get('status') != 'parking':
                return {'code': 1, 'message': '该车辆已出场', 'data': None}

            now = datetime.now().isoformat()
            calc_result = self._calculate_fee(
                record.get('entry_time'),
                now,
                record.get('rate_per_hour'),
                record.get('free_minutes'),
                record.get('daily_cap')
            )

            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'id': record.get('id'),
                    'plate_number': record.get('plate_number'),
                    'vehicle_type': record.get('vehicle_type_name'),
                    'entry_time': record.get('entry_time'),
                    'exit_time': now,
                    'parking_duration': calc_result['parking_duration'],
                    'billable_minutes': calc_result['billable_minutes'],
                    'total_fee': calc_result['total_fee'],
                    'free': calc_result['free']
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def _validate_plate_number(self, plate_number: str) -> tuple:
        import re
        plate_number = plate_number.strip().upper()
        
        if len(plate_number) < 5 or len(plate_number) > 10:
            return False, '车牌号长度不正确'
        
        patterns = [
            r'^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]?$',
            r'^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{4,6}$',
            r'^WJ[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领]?[0-9]{4,5}[0-9A-Z]$',
            r'^[A-Z]{2}[0-9]{5}$',
            r'^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z0-9]{5,6}$'
        ]
        
        for pattern in patterns:
            if re.match(pattern, plate_number):
                return True, plate_number
        
        return False, '请输入正确的车牌号格式'

    def vehicle_entry(self, plate_number: str, vehicle_type_code: str) -> Dict[str, Any]:
        try:
            if not plate_number or not plate_number.strip():
                return {'code': 1, 'message': '车牌号不能为空', 'data': None}

            is_valid, result = self._validate_plate_number(plate_number)
            if not is_valid:
                return {'code': 1, 'message': result or '车牌号格式不正确', 'data': None}
            plate_number = result

            is_parking = self.parking_record_model.check_plate_parking(plate_number)
            if is_parking:
                return {'code': 1, 'message': '该车辆已在场', 'data': None}

            vehicle_type = self.vehicle_type_model.get_by_code(vehicle_type_code)
            if not vehicle_type:
                return {'code': 1, 'message': '车型不存在', 'data': None}

            entry_time = datetime.now().isoformat()
            new_id = self.parking_record_model.create(
                plate_number=plate_number,
                vehicle_type_id=vehicle_type.get('id'),
                vehicle_type_code=vehicle_type.get('code'),
                vehicle_type_name=vehicle_type.get('name'),
                rate_per_hour=vehicle_type.get('rate_per_hour'),
                free_minutes=vehicle_type.get('free_minutes'),
                daily_cap=vehicle_type.get('daily_cap'),
                entry_time=entry_time
            )

            record = self.parking_record_model.get_by_id(new_id)
            return {
                'code': 0,
                'message': '入场成功',
                'data': self._format_record(record)
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def vehicle_exit(self, record_id: int = None, plate_number: str = None) -> Dict[str, Any]:
        try:
            record = None
            if record_id:
                record = self.parking_record_model.get_by_id(record_id)
            elif plate_number:
                plate_number = plate_number.strip().upper()
                record = self.parking_record_model.get_parking_by_plate(plate_number)

            if not record:
                return {'code': 1, 'message': '未找到停车记录', 'data': None}

            if record.get('status') != 'parking':
                return {'code': 1, 'message': '该车辆已出场', 'data': None}

            exit_time = datetime.now().isoformat()
            calc_result = self._calculate_fee(
                record.get('entry_time'),
                exit_time,
                record.get('rate_per_hour'),
                record.get('free_minutes'),
                record.get('daily_cap')
            )

            affected = self.parking_record_model.update_exit(
                record_id=record.get('id'),
                exit_time=exit_time,
                parking_duration=calc_result['parking_duration'],
                billable_minutes=calc_result['billable_minutes'],
                total_fee=calc_result['total_fee']
            )

            if affected > 0:
                updated_record = self.parking_record_model.get_by_id(record.get('id'))
                return {
                    'code': 0,
                    'message': '出场成功',
                    'data': self._format_record(updated_record)
                }

            return {'code': 1, 'message': '出场失败', 'data': None}
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_parking_list(self) -> Dict[str, Any]:
        try:
            items = self.parking_record_model.get_all_parking()
            result = [self._format_record(item, include_calc=True) for item in items]
            return {
                'code': 0,
                'message': 'success',
                'data': result
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_history_list(self, start_date: str = None, end_date: str = None,
                         plate_number: str = None, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        try:
            result = self.parking_record_model.get_all_completed(
                start_date=start_date,
                end_date=end_date,
                plate_number=plate_number,
                page=page,
                page_size=page_size
            )

            items = [self._format_record(item) for item in result.get('items', [])]
            result['items'] = items

            return {
                'code': 0,
                'message': 'success',
                'data': result
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_statistics(self) -> Dict[str, Any]:
        try:
            stats = self.parking_record_model.get_today_statistics()
            return {
                'code': 0,
                'message': 'success',
                'data': stats
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_record_by_id(self, record_id: int) -> Dict[str, Any]:
        try:
            record = self.parking_record_model.get_by_id(record_id)
            if not record:
                return {'code': 1, 'message': '记录不存在', 'data': None}
            return {
                'code': 0,
                'message': 'success',
                'data': self._format_record(record, include_calc=True)
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def delete_record(self, record_id: int) -> Dict[str, Any]:
        try:
            existing = self.parking_record_model.get_by_id(record_id)
            if not existing:
                return {'code': 1, 'message': '记录不存在', 'data': None}

            affected = self.parking_record_model.delete(record_id)
            if affected > 0:
                return {'code': 0, 'message': '删除成功', 'data': None}

            return {'code': 1, 'message': '删除失败', 'data': None}
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def update_record(self, record_id: int, plate_number: str = None,
                      entry_time: str = None, exit_time: str = None) -> Dict[str, Any]:
        try:
            existing = self.parking_record_model.get_by_id(record_id)
            if not existing:
                return {'code': 1, 'message': '记录不存在', 'data': None}

            update_data = {}
            if plate_number:
                update_data['plate_number'] = plate_number.strip().upper()
            if entry_time:
                update_data['entry_time'] = entry_time
            if exit_time:
                update_data['exit_time'] = exit_time

            if not update_data:
                return {'code': 1, 'message': '没有需要更新的字段', 'data': None}

            affected = self.parking_record_model.update(record_id, **update_data)
            if affected > 0:
                return self.get_record_by_id(record_id)

            return {'code': 1, 'message': '更新失败', 'data': None}
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }
