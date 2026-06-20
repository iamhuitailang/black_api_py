from typing import Dict, Any, List, Optional
from app.model.skate import TrackModel


class TrackBusiness:
    def __init__(self):
        self.track_model = TrackModel()

    def get_tracks(self) -> Dict[str, Any]:
        tracks = self.track_model.get_all_simple()
        return {
            'code': 0,
            'message': 'success',
            'data': tracks
        }

    def get_track_detail(self, track_id: int) -> Dict[str, Any]:
        track = self.track_model.get_by_id(track_id)
        if not track:
            return {
                'code': 404,
                'message': 'Track not found',
                'data': None
            }
        return {
            'code': 0,
            'message': 'success',
            'data': track
        }

    def add_track(self, name: str, description: str, length: int, difficulty: int,
                  terrain_data: List[Dict], obstacle_data: List[Dict], rail_data: List[Dict] = None) -> Dict[str, Any]:
        track_id = self.track_model.create(
            name=name,
            description=description,
            length=length,
            difficulty=difficulty,
            terrain_data=terrain_data,
            obstacle_data=obstacle_data,
            rail_data=rail_data
        )
        return {
            'code': 0,
            'message': 'success',
            'data': {'id': track_id}
        }

    def init_default_tracks(self) -> bool:
        count = self.track_model.count()
        if count > 0:
            return False

        track1_terrain = [
            {'type': 'flat', 'start': 0, 'end': 800, 'speed': 40},
            {'type': 'downhill', 'start': 800, 'end': 1600, 'speed': 70},
            {'type': 'flat', 'start': 1600, 'end': 2400, 'speed': 40},
            {'type': 'curve', 'start': 2400, 'end': 2700, 'speed': 40, 'direction': 'left'},
            {'type': 'flat', 'start': 2700, 'end': 3500, 'speed': 40},
            {'type': 'uphill', 'start': 3500, 'end': 4200, 'speed': 25},
            {'type': 'flat', 'start': 4200, 'end': 5000, 'speed': 40},
        ]

        track1_obstacles = [
            {'type': 'cone', 'position': 600, 'lane': 1},
            {'type': 'cone', 'position': 650, 'lane': 2},
            {'type': 'pedestrian', 'position': 1200, 'lane': 0},
            {'type': 'skater', 'position': 1900, 'lane': 2},
            {'type': 'cone', 'position': 2500, 'lane': 1},
            {'type': 'pedestrian', 'position': 2900, 'lane': 1},
            {'type': 'skater', 'position': 3300, 'lane': 0},
            {'type': 'cone', 'position': 3700, 'lane': 2},
            {'type': 'pedestrian', 'position': 4500, 'lane': 0},
            {'type': 'cone', 'position': 4700, 'lane': 1},
        ]

        track1_rails = [
            {'start': 1000, 'end': 1150, 'lane': 2, 'height': 30},
            {'start': 2800, 'end': 2950, 'lane': 0, 'height': 30},
            {'start': 4300, 'end': 4450, 'lane': 1, 'height': 30},
        ]

        self.track_model.create(
            name='城市街道 - 初级赛道',
            description='适合新手的初级赛道，有基本的地形变化和少量障碍物',
            length=5000,
            difficulty=1,
            terrain_data=track1_terrain,
            obstacle_data=track1_obstacles,
            rail_data=track1_rails
        )

        track2_terrain = [
            {'type': 'flat', 'start': 0, 'end': 600, 'speed': 40},
            {'type': 'downhill', 'start': 600, 'end': 1400, 'speed': 70},
            {'type': 'curve', 'start': 1400, 'end': 1700, 'speed': 40, 'direction': 'right'},
            {'type': 'flat', 'start': 1700, 'end': 2500, 'speed': 40},
            {'type': 'uphill', 'start': 2500, 'end': 3300, 'speed': 25},
            {'type': 'flat', 'start': 3300, 'end': 4100, 'speed': 40},
            {'type': 'curve', 'start': 4100, 'end': 4400, 'speed': 40, 'direction': 'left'},
            {'type': 'downhill', 'start': 4400, 'end': 5200, 'speed': 70},
            {'type': 'flat', 'start': 5200, 'end': 6000, 'speed': 40},
            {'type': 'uphill', 'start': 6000, 'end': 6800, 'speed': 25},
            {'type': 'flat', 'start': 6800, 'end': 7500, 'speed': 40},
        ]

        track2_obstacles = [
            {'type': 'cone', 'position': 400, 'lane': 1},
            {'type': 'pedestrian', 'position': 900, 'lane': 2},
            {'type': 'cone', 'position': 1100, 'lane': 0},
            {'type': 'skater', 'position': 1500, 'lane': 1},
            {'type': 'cone', 'position': 1900, 'lane': 2},
            {'type': 'pedestrian', 'position': 2100, 'lane': 0},
            {'type': 'skater', 'position': 2700, 'lane': 1},
            {'type': 'cone', 'position': 3100, 'lane': 2},
            {'type': 'pedestrian', 'position': 3600, 'lane': 0},
            {'type': 'cone', 'position': 3900, 'lane': 1},
            {'type': 'skater', 'position': 4200, 'lane': 2},
            {'type': 'pedestrian', 'position': 4800, 'lane': 0},
            {'type': 'cone', 'position': 5100, 'lane': 1},
            {'type': 'skater', 'position': 5500, 'lane': 2},
            {'type': 'cone', 'position': 5800, 'lane': 0},
            {'type': 'pedestrian', 'position': 6300, 'lane': 1},
            {'type': 'skater', 'position': 6600, 'lane': 2},
            {'type': 'cone', 'position': 7100, 'lane': 0},
        ]

        track2_rails = [
            {'start': 800, 'end': 950, 'lane': 1, 'height': 30},
            {'start': 1800, 'end': 1950, 'lane': 0, 'height': 30},
            {'start': 3700, 'end': 3850, 'lane': 2, 'height': 30},
            {'start': 5300, 'end': 5450, 'lane': 1, 'height': 30},
            {'start': 7000, 'end': 7150, 'lane': 2, 'height': 30},
        ]

        self.track_model.create(
            name='滨海大道 - 中级赛道',
            description='中级难度赛道，包含更多弯道和丰富障碍物分布',
            length=7500,
            difficulty=2,
            terrain_data=track2_terrain,
            obstacle_data=track2_obstacles,
            rail_data=track2_rails
        )

        track3_terrain = [
            {'type': 'flat', 'start': 0, 'end': 500, 'speed': 40},
            {'type': 'downhill', 'start': 500, 'end': 1200, 'speed': 70},
            {'type': 'curve', 'start': 1200, 'end': 1500, 'speed': 40, 'direction': 'left'},
            {'type': 'curve', 'start': 1500, 'end': 1800, 'speed': 40, 'direction': 'right'},
            {'type': 'flat', 'start': 1800, 'end': 2500, 'speed': 40},
            {'type': 'uphill', 'start': 2500, 'end': 3200, 'speed': 25},
            {'type': 'downhill', 'start': 3200, 'end': 4000, 'speed': 70},
            {'type': 'flat', 'start': 4000, 'end': 4700, 'speed': 40},
            {'type': 'curve', 'start': 4700, 'end': 5000, 'speed': 40, 'direction': 'left'},
            {'type': 'flat', 'start': 5000, 'end': 5700, 'speed': 40},
            {'type': 'uphill', 'start': 5700, 'end': 6400, 'speed': 25},
            {'type': 'downhill', 'start': 6400, 'end': 7200, 'speed': 70},
            {'type': 'curve', 'start': 7200, 'end': 7500, 'speed': 40, 'direction': 'right'},
            {'type': 'flat', 'start': 7500, 'end': 8200, 'speed': 40},
            {'type': 'uphill', 'start': 8200, 'end': 9000, 'speed': 25},
            {'type': 'flat', 'start': 9000, 'end': 10000, 'speed': 40},
        ]

        track3_obstacles = [
            {'type': 'cone', 'position': 300, 'lane': 1},
            {'type': 'cone', 'position': 400, 'lane': 2},
            {'type': 'pedestrian', 'position': 700, 'lane': 0},
            {'type': 'skater', 'position': 1000, 'lane': 2},
            {'type': 'cone', 'position': 1350, 'lane': 1},
            {'type': 'pedestrian', 'position': 1650, 'lane': 0},
            {'type': 'cone', 'position': 1900, 'lane': 2},
            {'type': 'skater', 'position': 2200, 'lane': 0},
            {'type': 'cone', 'position': 2700, 'lane': 1},
            {'type': 'pedestrian', 'position': 2900, 'lane': 2},
            {'type': 'skater', 'position': 3400, 'lane': 0},
            {'type': 'cone', 'position': 3600, 'lane': 1},
            {'type': 'pedestrian', 'position': 3850, 'lane': 2},
            {'type': 'cone', 'position': 4150, 'lane': 0},
            {'type': 'skater', 'position': 4400, 'lane': 1},
            {'type': 'cone', 'position': 4850, 'lane': 2},
            {'type': 'pedestrian', 'position': 5200, 'lane': 0},
            {'type': 'skater', 'position': 5500, 'lane': 2},
            {'type': 'cone', 'position': 5900, 'lane': 1},
            {'type': 'cone', 'position': 6150, 'lane': 0},
            {'type': 'pedestrian', 'position': 6600, 'lane': 1},
            {'type': 'skater', 'position': 6900, 'lane': 2},
            {'type': 'cone', 'position': 7350, 'lane': 1},
            {'type': 'pedestrian', 'position': 7700, 'lane': 0},
            {'type': 'cone', 'position': 8000, 'lane': 2},
            {'type': 'skater', 'position': 8400, 'lane': 1},
            {'type': 'pedestrian', 'position': 8700, 'lane': 0},
            {'type': 'cone', 'position': 9200, 'lane': 2},
            {'type': 'skater', 'position': 9500, 'lane': 1},
            {'type': 'cone', 'position': 9800, 'lane': 0},
        ]

        track3_rails = [
            {'start': 600, 'end': 750, 'lane': 2, 'height': 30},
            {'start': 1900, 'end': 2050, 'lane': 1, 'height': 30},
            {'start': 3500, 'end': 3650, 'lane': 0, 'height': 30},
            {'start': 4400, 'end': 4550, 'lane': 2, 'height': 30},
            {'start': 5300, 'end': 5450, 'lane': 1, 'height': 30},
            {'start': 6700, 'end': 6850, 'lane': 0, 'height': 30},
            {'start': 7800, 'end': 7950, 'lane': 2, 'height': 30},
            {'start': 9300, 'end': 9450, 'lane': 1, 'height': 30},
        ]

        self.track_model.create(
            name='山地速降 - 高级赛道',
            description='高难度赛道，大量地形变化和密集障碍物，专业玩家首选',
            length=10000,
            difficulty=3,
            terrain_data=track3_terrain,
            obstacle_data=track3_obstacles,
            rail_data=track3_rails
        )

        return True

    def delete_track(self, track_id: int) -> Dict[str, Any]:
        rows = self.track_model.delete(track_id)
        return {
            'code': 0,
            'message': 'success',
            'data': {'deleted': rows}
        }
