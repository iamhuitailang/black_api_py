from typing import Dict, Any, List, Optional
from app.business.icesled.track_engine import TrackEngine
from app.business.icesled.race_engine import RaceSimulator
from app.model.icesled import TrackTemplateModel, RaceRecordModel, RaceDetailModel


class IceSledBusiness:
    def __init__(self):
        self.track_model = TrackTemplateModel()
        self.race_model = RaceRecordModel()
        self.detail_model = RaceDetailModel()

    def generate_new_track(self, difficulty: str = 'normal') -> Dict[str, Any]:
        try:
            track = TrackEngine.generate_track(difficulty)
            track_id = TrackEngine.save_track(track)
            track['id'] = track_id
            return {
                'code': 0,
                'message': '赛道生成成功',
                'data': track
            }
        except Exception as e:
            return {
                'code': 1,
                'message': f'生成赛道失败: {str(e)}',
                'data': None
            }

    def get_track_list(self) -> Dict[str, Any]:
        try:
            tracks = TrackEngine.get_all_tracks()
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': tracks,
                    'total': len(tracks)
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_track(self, track_id: Optional[int] = None) -> Dict[str, Any]:
        try:
            if track_id:
                track = TrackEngine.get_track_by_id(track_id)
                if not track:
                    return {
                        'code': 1,
                        'message': '赛道不存在',
                        'data': None
                    }
            else:
                track = TrackEngine.get_random_track()
            return {
                'code': 0,
                'message': 'success',
                'data': track
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def start_race(self, track_id: Optional[int] = None,
                    player_name: str = '玩家',
                    player_actions: Optional[List[Dict[str, Any]]] = None,
                    auto_simulate: bool = True) -> Dict[str, Any]:
        try:
            if track_id:
                track_resp = self.get_track(track_id)
                if track_resp['code'] != 0 or not track_resp.get('data'):
                    return {
                        'code': 1,
                        'message': '获取赛道失败',
                        'data': None
                    }
                track = track_resp['data']
            else:
                track_resp = self.generate_new_track('normal')
                track = track_resp['data']

            if not track:
                return {
                    'code': 1,
                    'message': '赛道数据无效',
                    'data': None
                }

            simulator = RaceSimulator(track, player_name, player_actions)
            race_result = simulator.simulate()

            self._save_race_result(track, player_name, race_result)

            output_frames = []
            max_output_frames = 800
            total_frames = len(race_result['frames'])
            if total_frames > max_output_frames:
                step = max(1, total_frames // max_output_frames)
                output_frames = race_result['frames'][::step]
            else:
                output_frames = race_result['frames']

            return {
                'code': 0,
                'message': '比赛完成',
                'data': {
                    'track': race_result['track'],
                    'total_time': race_result['total_time'],
                    'winner_name': race_result['winner_name'],
                    'winner_type': race_result['winner_type'],
                    'results': race_result['results'],
                    'frames': output_frames,
                    'frame_count': len(output_frames),
                    'total_frame_count': total_frames,
                    'tick_interval': race_result['tick_interval'],
                    'track_id': track.get('id')
                }
            }
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {
                'code': 1,
                'message': f'比赛模拟失败: {str(e)}',
                'data': None
            }

    def _save_race_result(self, track: Dict[str, Any], player_name: str,
                            race_result: Dict[str, Any]):
        try:
            track_id = track.get('id')
            record_id = self.race_model.create(
                track_template_id=track_id,
                track_name=track.get('name', '未知赛道'),
                player_name=player_name,
                total_time=race_result['total_time'],
                winner_name=race_result['winner_name'],
                winner_type=race_result['winner_type']
            )

            for r in race_result['results']:
                self.detail_model.create(
                    race_record_id=record_id,
                    racer_name=r['name'],
                    racer_type=r['racer_type'],
                    final_speed=r['speed'],
                    total_time=r['total_time'],
                    rank=r['rank'],
                    score=r['score'],
                    wall_hit_count=r['wall_hit_count'],
                    crack_fall_count=r['crack_fall_count'],
                    boost_count=r['boost_count'],
                    event_log=r.get('event_log', [])
                )
            return record_id
        except Exception as e:
            print(f"保存比赛记录失败: {e}")
            return None

    def get_race_history(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        try:
            result = self.race_model.paginate(page, page_size)
            items = []
            for record in result['items']:
                details = self.detail_model.get_by_race_id(record['id'])
                record['racers'] = details
                items.append(record)

            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': items,
                    'total': result['total'],
                    'page': result['page'],
                    'page_size': result['page_size'],
                    'total_pages': result['total_pages']
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_race_detail(self, race_id: int) -> Dict[str, Any]:
        try:
            record = self.race_model.get_by_id(race_id)
            if not record:
                return {
                    'code': 1,
                    'message': '比赛记录不存在',
                    'data': None
                }
            details = self.detail_model.get_by_race_id(race_id)
            record['racers'] = details
            return {
                'code': 0,
                'message': 'success',
                'data': record
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_player_stats(self, player_name: str = '玩家') -> Dict[str, Any]:
        try:
            db = self.race_model
            all_records = db.get_all(limit=1000)
            player_races = [r for r in all_records if r.get('player_name') == player_name]

            total_races = len(player_races)
            wins = sum(1 for r in player_races if r.get('winner_type') == 'player')
            total_score = 0
            total_time = 0.0
            best_time = None

            for race in player_races:
                total_time += race.get('total_time', 0)
                details = self.detail_model.get_by_race_id(race['id'])
                for d in details:
                    if d.get('racer_type') == 'player':
                        total_score += d.get('score', 0)
                        bt = d.get('total_time')
                        if best_time is None or (bt and bt < best_time):
                            best_time = bt

            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'player_name': player_name,
                    'total_races': total_races,
                    'wins': wins,
                    'win_rate': round(wins / total_races * 100, 1) if total_races > 0 else 0,
                    'total_score': total_score,
                    'average_time': round(total_time / total_races, 3) if total_races > 0 else 0,
                    'best_time': round(best_time, 3) if best_time else None
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_leaderboard(self, limit: int = 10) -> Dict[str, Any]:
        try:
            all_details = []
            all_records = self.race_model.get_all(limit=500)
            for r in all_records:
                details = self.detail_model.get_by_race_id(r['id'])
                for d in details:
                    d['track_name'] = r.get('track_name', '')
                    d['race_date'] = r.get('created_at', '')
                    all_details.append(d)

            player_details = [d for d in all_details if d.get('racer_type') == 'player']
            player_details.sort(key=lambda x: x['total_time'])
            fastest = player_details[:limit]

            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': fastest,
                    'total': len(player_details)
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }
