from typing import Dict, Any, List, Optional
from app.model.parking import ParkingSpotModel


class ParkingSpotBusiness:
    def __init__(self):
        self.model = ParkingSpotModel()

    def get_spot_list(self, page: int = 1, page_size: int = 10, status: str = None, spot_type: str = None) -> Dict[str, Any]:
        result = self.model.paginate(page, page_size, status, spot_type)
        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def get_all_spots(self, status: str = None, spot_type: str = None) -> Dict[str, Any]:
        items = self.model.get_all(status, spot_type)
        return {
            'code': 0,
            'message': 'success',
            'data': items
        }

    def get_spot_detail(self, spot_id: int) -> Dict[str, Any]:
        spot = self.model.get_by_id(spot_id)
        if not spot:
            return {
                'code': 1,
                'message': '车位不存在',
                'data': None
            }
        return {
            'code': 0,
            'message': 'success',
            'data': spot
        }

    def create_spot(self, spot_number: str, spot_type: str, location: str = None, monthly_fee: float = 300) -> Dict[str, Any]:
        if not spot_number or not spot_number.strip():
            return {
                'code': 1,
                'message': '车位编号不能为空',
                'data': None
            }

        existing = self.model.get_by_number(spot_number.strip())
        if existing:
            return {
                'code': 1,
                'message': '车位编号已存在',
                'data': None
            }

        spot_id = self.model.create(spot_number.strip(), spot_type, location, monthly_fee)
        spot = self.model.get_by_id(spot_id)
        return {
            'code': 0,
            'message': '创建成功',
            'data': spot
        }

    def update_spot(self, spot_id: int, spot_number: str = None, spot_type: str = None,
                    location: str = None, monthly_fee: float = None, status: str = None) -> Dict[str, Any]:
        existing = self.model.get_by_id(spot_id)
        if not existing:
            return {
                'code': 1,
                'message': '车位不存在',
                'data': None
            }

        if spot_number and spot_number.strip() and spot_number != existing['spot_number']:
            same_number = self.model.get_by_number(spot_number.strip())
            if same_number:
                return {
                    'code': 1,
                    'message': '车位编号已存在',
                    'data': None
                }

        updates = {}
        if spot_number is not None:
            updates['spot_number'] = spot_number.strip()
        if spot_type is not None:
            updates['spot_type'] = spot_type
        if location is not None:
            updates['location'] = location
        if monthly_fee is not None:
            updates['monthly_fee'] = monthly_fee
        if status is not None:
            updates['status'] = status

        if not updates:
            return {
                'code': 1,
                'message': '没有需要更新的内容',
                'data': None
            }

        affected = self.model.update(spot_id, **updates)
        if affected > 0:
            spot = self.model.get_by_id(spot_id)
            return {
                'code': 0,
                'message': '更新成功',
                'data': spot
            }
        return {
            'code': 1,
            'message': '更新失败',
            'data': None
        }

    def delete_spot(self, spot_id: int) -> Dict[str, Any]:
        existing = self.model.get_by_id(spot_id)
        if not existing:
            return {
                'code': 1,
                'message': '车位不存在',
                'data': None
            }

        if existing['status'] == ParkingSpotModel.STATUS_OCCUPIED:
            return {
                'code': 1,
                'message': '车位已被占用，无法删除',
                'data': None
            }

        affected = self.model.delete(spot_id)
        if affected > 0:
            return {
                'code': 0,
                'message': '删除成功',
                'data': None
            }
        return {
            'code': 1,
            'message': '删除失败',
            'data': None
        }

    def get_statistics(self) -> Dict[str, Any]:
        total = self.model.count()
        available = self.model.count(status=ParkingSpotModel.STATUS_AVAILABLE)
        occupied = self.model.count(status=ParkingSpotModel.STATUS_OCCUPIED)
        maintenance = self.model.count(status=ParkingSpotModel.STATUS_MAINTENANCE)

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'total': total,
                'available': available,
                'occupied': occupied,
                'maintenance': maintenance
            }
        }
