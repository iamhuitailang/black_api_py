from typing import Dict, Any, List
from app.model.parkour import ParkourScoreModel, LetterFragmentModel


LETTER_STORIES = {
    1: {"title": "旧城记忆·壹", "content": "这座城市曾经没有霓虹。老人们说，那时候的天空是真正的橙色，不是灯管的颜色..."},
    2: {"title": "旧城记忆·贰", "content": "第七区的屋顶花园是最后一片绿地。他们把它拆了，建了信号塔。那天晚上，整个城市都听到了花的声音..."},
    3: {"title": "旧城记忆·叁", "content": "废弃的地铁站里还有旧时代的广告牌。上面写着'欢迎回家'。没人记得家是什么样子了..."},
    4: {"title": "旧城记忆·肆", "content": "档案馆的地下室里保存着最后一张纸质照片。照片上是一条河，河上还有船。现在那条河是光缆通道..."},
    5: {"title": "霓虹之下·壹", "content": "跑者们之间流传着一个传说：在天际线的尽头，有一扇还亮着暖光的窗。那是唯一不用霓虹管发出的光..."},
    6: {"title": "霓虹之下·贰", "content": "你在屋顶发现的第一个信封里只有一行字：'如果你在跑，就还没放弃。' 你不知道是谁写的，但你一直在跑..."},
    7: {"title": "霓虹之下·叁", "content": "每个跑者的鞋底都刻着同样的符号。没人知道是谁先刻的，但所有在屋顶奔跑的人都知道那个记号的意思——继续..."},
    8: {"title": "霓虹之下·肆", "content": "第三区的信号塔每晚都会广播同一句话。有人说那是故障，有人说那是密码。跑者们觉得那是一句问候：'你还好吗？'..."},
    9: {"title": "天际线彼端·壹", "content": "传说在天际线的另一边，天空还是天空，不是屏幕。跑者们管那个地方叫'外面'..."},
    10: {"title": "天际线彼端·贰", "content": "你找到的最后一封信里夹着一张地图。上面标注的不是街道，是屋顶。每条路线的终点都写着同一个字：'走'..."},
    11: {"title": "天际线彼端·叁", "content": "最高的那栋楼顶上，霓虹终于够不着了。在那里你第一次看到了星星。它们不是LED的，是真的..."},
    12: {"title": "天际线彼端·肆", "content": "你站在城市的最高点，风从'外面'吹来。你把所有信封撕碎，让碎片飞向远方。也许有人会捡到，也许不会。但你自由了。"},
}


class ParkourBusiness:
    def __init__(self):
        self.score_model = ParkourScoreModel()
        self.letter_model = LetterFragmentModel()

    def submit_score(self, player_name: str, distance: float, letters_collected: int) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {'code': 1, 'message': 'Player name cannot be empty', 'data': None}

        player_name = player_name.strip()

        best_record = self.score_model.get_best_by_player(player_name)
        is_new_record = False
        if best_record is None or distance > best_record['distance']:
            is_new_record = True

        best_distance = best_record['distance'] if best_record else 0
        self.score_model.create(player_name, distance, letters_collected)
        rank = self.score_model.get_rank(distance)

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'rank': rank,
                'is_new_record': is_new_record,
                'best_distance': best_distance,
                'distance': distance,
                'letters_collected': letters_collected
            }
        }

    def get_leaderboard(self) -> Dict[str, Any]:
        records = self.score_model.get_leaderboard(limit=20)
        items = []
        for idx, record in enumerate(records):
            items.append({
                'rank': idx + 1,
                'player_name': record.get('player_name'),
                'distance': record.get('distance'),
                'letters_collected': record.get('letters_collected'),
                'created_at': record.get('created_at')
            })
        return {
            'code': 0,
            'message': 'success',
            'data': items
        }

    def get_best_score(self, player_name: str) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {'code': 1, 'message': 'Player name cannot be empty', 'data': None}

        player_name = player_name.strip()

        best_record = self.score_model.get_best_by_player(player_name)
        total_runs = self.score_model.count_by_player(player_name)

        if best_record:
            total_letters = sum(
                r['letters_collected'] for r in
                self.score_model.query.find_all(
                    conditions={'player_name': player_name},
                    fields=['letters_collected']
                )
            )
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'best_distance': best_record['distance'],
                    'total_letters': total_letters,
                    'total_runs': total_runs
                }
            }

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'best_distance': 0,
                'total_letters': 0,
                'total_runs': 0
            }
        }

    def get_letter_status(self, player_name: str) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {'code': 1, 'message': 'Player name cannot be empty', 'data': None}

        player_name = player_name.strip()

        fragments = self.letter_model.get_by_player(player_name)

        fragment_map = {}
        for frag in fragments:
            lid = frag['letter_id']
            if lid not in fragment_map:
                fragment_map[lid] = {}
            fragment_map[lid][frag['fragment_index']] = frag['collected']

        flat_fragments = []
        unlocked_stories = []

        for letter_id in range(1, 13):
            all_collected = True
            for fi in range(1, 4):
                collected = bool(fragment_map.get(letter_id, {}).get(fi, 0))
                flat_fragments.append({
                    'letter_id': letter_id,
                    'fragment_index': fi,
                    'collected': collected
                })
                if not collected:
                    all_collected = False

            if all_collected:
                unlocked_stories.append({
                    'letter_id': letter_id,
                    'title': LETTER_STORIES[letter_id]['title'],
                    'content': LETTER_STORIES[letter_id]['content']
                })

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'fragments': flat_fragments,
                'unlocked_stories': unlocked_stories
            }
        }

    def collect_letter(self, player_name: str, letter_id: int, fragment_index: int) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {'code': 1, 'message': 'Player name cannot be empty', 'data': None}

        player_name = player_name.strip()

        if letter_id < 1 or letter_id > 12:
            return {'code': 1, 'message': 'Letter id must be between 1 and 12', 'data': None}

        if fragment_index < 1 or fragment_index > 3:
            return {'code': 1, 'message': 'Fragment index must be between 1 and 3', 'data': None}

        success = self.letter_model.collect_fragment(player_name, letter_id, fragment_index)

        if not success:
            return {
                'code': 0,
                'message': 'Fragment already collected',
                'data': {
                    'letter_id': letter_id,
                    'fragment_index': fragment_index,
                    'newly_collected': False,
                    'all_collected': False,
                    'unlocked_content': None
                }
            }

        all_collected = self.letter_model.check_all_collected(player_name, letter_id)

        unlocked_content = None
        if all_collected:
            unlocked_content = {
                'letter_id': letter_id,
                'title': LETTER_STORIES[letter_id]['title'],
                'content': LETTER_STORIES[letter_id]['content']
            }

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'letter_id': letter_id,
                'fragment_index': fragment_index,
                'newly_collected': True,
                'all_collected': all_collected,
                'unlocked_content': unlocked_content
            }
        }
