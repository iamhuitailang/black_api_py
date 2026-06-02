from typing import Dict, Any, List
from app.model.poan_model import (
    CaseModel, ClueModel, CharacterModel,
    TimelineEventModel, QuizModel, EndingModel,
    EvidenceModel, DialogueModel
)


class PoanCaseBusiness:
    def __init__(self):
        self.case_model = CaseModel()
        self.clue_model = ClueModel()
        self.character_model = CharacterModel()
        self.timeline_model = TimelineEventModel()
        self.quiz_model = QuizModel()
        self.ending_model = EndingModel()
        self.evidence_model = EvidenceModel()
        self.dialogue_model = DialogueModel()

    def _validate_era(self, era: str) -> bool:
        return era in CaseModel.ERAS

    def create_case(self, data: Dict[str, Any]) -> Dict[str, Any]:
        title = data.get('title', '').strip()
        era = data.get('era', '')

        if not title or len(title) < 2:
            return {
                'code': 1,
                'msg': '案件标题至少2个字符',
                'data': None
            }

        if not self._validate_era(era):
            return {
                'code': 1,
                'msg': '时代参数不正确',
                'data': None
            }

        case_id = self.case_model.create(
            title=title,
            era=era,
            year=data.get('year', ''),
            description=data.get('description', ''),
            background_story=data.get('background_story', ''),
            difficulty=data.get('difficulty', 1),
            cover_image=data.get('cover_image', ''),
            status=data.get('status', CaseModel.STATUS_DRAFT),
            order_num=data.get('order_num', 0)
        )

        if case_id > 0:
            case = self.case_model.get_by_id(case_id)
            return {
                'code': 0,
                'msg': '案件创建成功',
                'data': self.case_model.to_dict(case)
            }

        return {
            'code': 1,
            'msg': '案件创建失败',
            'data': None
        }

    def update_case(self, case_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        case = self.case_model.get_by_id(case_id)
        if not case:
            return {
                'code': 1,
                'msg': '案件不存在',
                'data': None
            }

        if 'era' in data and not self._validate_era(data['era']):
            return {
                'code': 1,
                'msg': '时代参数不正确',
                'data': None
            }

        affected = self.case_model.update(case_id, data)
        if affected >= 0:
            updated_case = self.case_model.get_by_id(case_id)
            return {
                'code': 0,
                'msg': '案件更新成功',
                'data': self.case_model.to_dict(updated_case)
            }

        return {
            'code': 1,
            'msg': '案件更新失败',
            'data': None
        }

    def delete_case(self, case_id: int) -> Dict[str, Any]:
        case = self.case_model.get_by_id(case_id)
        if not case:
            return {
                'code': 1,
                'msg': '案件不存在',
                'data': None
            }

        affected = self.case_model.delete(case_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '案件删除成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '案件删除失败',
            'data': None
        }

    def get_case_detail(self, case_id: int) -> Dict[str, Any]:
        case = self.case_model.get_by_id(case_id)
        if not case:
            return {
                'code': 1,
                'msg': '案件不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.case_model.to_dict(case)
        }

    def get_case_list(self, page: int = 1, page_size: int = 10,
                      era: str = None, difficulty: int = None,
                      keyword: str = None, status: int = None) -> Dict[str, Any]:
        result = self.case_model.get_list(page, page_size, era, difficulty, status, keyword)
        items = [self.case_model.to_dict(item) for item in result.get('items', [])]

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_online_cases(self, page: int = 1, page_size: int = 10,
                         era: str = None, difficulty: int = None,
                         keyword: str = None) -> Dict[str, Any]:
        result = self.case_model.get_list(page, page_size, era, difficulty, CaseModel.STATUS_ONLINE, keyword)
        items = [self.case_model.to_dict(item) for item in result.get('items', [])]

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_eras(self) -> Dict[str, Any]:
        eras = []
        for code, name in CaseModel.ERAS.items():
            eras.append({
                'code': code,
                'name': name
            })
        return {
            'code': 0,
            'msg': 'success',
            'data': eras
        }

    def init_default_cases(self) -> Dict[str, Any]:
        existing = self.case_model.get_list(page=1, page_size=100)
        if existing.get('total', 0) > 0:
            return {
                'code': 1,
                'msg': '已有案件数据，无需初始化',
                'data': None
            }

        tang_case_id = self._create_tang_case()
        song_case_id = self._create_song_case()
        minguo_case_id = self._create_minguo_case()

        if tang_case_id > 0 and song_case_id > 0 and minguo_case_id > 0:
            return {
                'code': 0,
                'msg': '示例案件初始化成功，共创建3个案件',
                'data': {
                    'tang_case_id': tang_case_id,
                    'song_case_id': song_case_id,
                    'minguo_case_id': minguo_case_id
                }
            }

        return {
            'code': 1,
            'msg': '示例案件初始化失败',
            'data': None
        }

    def _create_tang_case(self) -> int:
        case_id = self.case_model.create(
            title='长安夜明珠失窃案',
            era=CaseModel.TANG,
            year='贞观十三年',
            description='唐太宗年间，长安皇宫内珍藏的夜明珠离奇失踪。这颗夜明珠乃西域进贡之物，价值连城。案发当晚，守卫森严，无人进出，夜明珠却不翼而飞。',
            background_story='贞观十三年，长安城一片繁荣。唐太宗李世民命人将西域进贡的夜明珠珍藏于大明宫偏殿。这颗夜明珠在黑夜中能发出柔和的光芒，乃是稀世珍宝。然而，在一个月黑风高的夜晚，负责守卫的禁军士兵发现，原本放置夜明珠的锦盒空空如也。偏殿门窗完好，锁具无损，夜明珠却神秘消失。皇上龙颜大怒，下令大理寺限期破案。',
            difficulty=2,
            cover_image='',
            status=CaseModel.STATUS_ONLINE,
            order_num=1
        )

        if case_id <= 0:
            return 0

        self._create_tang_clues(case_id)
        self._create_tang_characters(case_id)
        self._create_tang_timeline(case_id)
        self._create_tang_evidence(case_id)
        self._create_tang_quiz(case_id)
        self._create_tang_endings(case_id)

        return case_id

    def _create_tang_clues(self, case_id: int):
        clues = [
            {'name': '空锦盒', 'type': ClueModel.PHYSICAL, 'description': '原本放置夜明珠的金丝楠木锦盒，锁具完好，但内部空空如也。', 'location': '大明宫偏殿', 'content': '锦盒由金丝楠木制成，上有精美的龙凤雕刻。锁具为宫廷特制，没有撬动痕迹。', 'is_critical': 1, 'order_num': 1},
            {'name': '窗台上的脚印', 'type': ClueModel.PHYSICAL, 'description': '偏殿外侧窗台上发现了一对奇特的脚印，脚印很小，似是女子所留。', 'location': '大明宫偏殿窗外', 'content': '脚印长约六寸，鞋底有莲花纹路，朝向屋顶方向。', 'is_critical': 1, 'order_num': 2},
            {'name': '半块糕点', 'type': ClueModel.PHYSICAL, 'description': '在偏殿角落发现了半块吃剩的桂花糕，上面还有牙印。', 'location': '大明宫偏殿角落', 'content': '桂花糕是御膳房特制的，表面有芝麻。牙印细小整齐。', 'is_critical': 0, 'order_num': 3},
            {'name': '守卫证词', 'type': ClueModel.TESTIMONY, 'description': '当晚值守的禁军统领的证词。', 'location': '禁军值守处', 'content': "当晚风很大，大约三更时分，听到屋顶有瓦片响动，以为是野猫，并未在意。整晚未见有人进出偏殿。", 'is_critical': 1, 'order_num': 4},
            {'name': '宫女名单', 'type': ClueModel.DOCUMENT, 'description': '近日在偏殿当差的宫女名单。', 'location': '内务府', 'content': '名单上有三名宫女：灵儿、月儿、婉儿。其中灵儿近日因手脚麻利被提拔。', 'is_critical': 0, 'order_num': 5},
            {'name': '西域进贡记录', 'type': ClueModel.DOCUMENT, 'description': '关于夜明珠的详细记载。', 'location': '礼部', 'content': '夜明珠直径约一寸五分，重三两二钱，夜间能照亮整个房间。据说还有防虫之效。', 'is_critical': 0, 'order_num': 6},
            {'name': '夜行衣残片', 'type': ClueModel.PHYSICAL, 'description': '在宫墙角落发现的黑色布料残片。', 'location': '宫墙下', 'content': '布料是江南织锦，上面绣着一朵小小的梅花。', 'is_critical': 1, 'order_num': 7}
        ]

        for clue in clues:
            self.clue_model.create(
                case_id=case_id,
                name=clue['name'],
                type=clue['type'],
                description=clue['description'],
                location=clue['location'],
                content=clue['content'],
                is_critical=clue['is_critical'],
                order_num=clue['order_num']
            )

    def _create_tang_characters(self, case_id: int):
        characters = [
            {'name': '李统领', 'title': '禁军统领', 'description': '当晚值守的禁军统领，负责偏殿安全。', 'personality': '正直严谨，对失职之事耿耿于怀。', 'dialogue_style': '说话有力，条理清晰。', 'order_num': 1},
            {'name': '灵儿', 'title': '宫女', 'description': '近日在偏殿当差的宫女，手脚麻利。', 'personality': '机灵活泼，但眼神中似乎藏着秘密。', 'dialogue_style': '语速较快，有时会闪烁其词。', 'order_num': 2},
            {'name': '王公公', 'title': '内务府总管', 'description': '负责管理宫中事务的老太监。', 'personality': '世故圆滑，见多识广。', 'dialogue_style': '说话慢条斯理，喜欢打官腔。', 'order_num': 3},
            {'name': '张画师', 'title': '宫廷画师', 'description': '曾为夜明珠作画的画师。', 'personality': '痴迷艺术，对珍宝有独到见解。', 'dialogue_style': '说话文雅，喜欢用比喻。', 'order_num': 4}
        ]

        for char in characters:
            self.character_model.create(
                case_id=case_id,
                name=char['name'],
                title=char['title'],
                description=char['description'],
                personality=char['personality'],
                dialogue_style=char['dialogue_style'],
                order_num=char['order_num']
            )

        char_ids = {}
        chars = self.character_model.get_by_case(case_id)
        for c in chars:
            char_ids[c['name']] = c['id']

        dialogues = [
            {'character_id': char_ids['李统领'], 'trigger_type': DialogueModel.TRIGGER_AUTO, 'question': '案发当晚你看到了什么？', 'answer': "当晚风很大，大约三更时分，听到屋顶有瓦片响动，以为是野猫，并未在意。整晚未见有人进出偏殿。", 'order_num': 1},
            {'character_id': char_ids['李统领'], 'trigger_type': DialogueModel.TRIGGER_CLUE, 'question': '这脚印你怎么看？', 'answer': '这脚印...太小了，像是女子的。但宫中女子怎会有此轻功？除非是...', 'unlock_condition': '2', 'order_num': 2},
            {'character_id': char_ids['灵儿'], 'trigger_type': DialogueModel.TRIGGER_AUTO, 'question': '案发当晚你在哪里？', 'answer': '我...我当晚在自己房间休息。这几天当差太累了，很早就睡了。', 'order_num': 1},
            {'character_id': char_ids['灵儿'], 'trigger_type': DialogueModel.TRIGGER_CLUE, 'question': '这块桂花糕是你落下的吗？', 'answer': '我...我只是...那天我确实去过偏殿，但我没有偷东西！', 'unlock_condition': '3', 'order_num': 2},
            {'character_id': char_ids['灵儿'], 'trigger_type': DialogueModel.TRIGGER_CLUE, 'question': '这块布料你认识吗？', 'answer': '这...这是我的！但我真的不是故意的...我只是想看看那颗珠子...', 'unlock_condition': '7', 'order_num': 3},
            {'character_id': char_ids['王公公'], 'trigger_type': DialogueModel.TRIGGER_AUTO, 'question': '你对这个案子有什么看法？', 'answer': '这宫里啊，什么怪事都有。依我看，多半是家贼难防。', 'order_num': 1},
            {'character_id': char_ids['王公公'], 'trigger_type': DialogueModel.TRIGGER_KEYWORD, 'question': '灵儿最近表现如何？', 'answer': '灵儿？这丫头最近有点奇怪，经常一个人发呆，好像有什么心事。', 'unlock_condition': '5', 'order_num': 2},
            {'character_id': char_ids['张画师'], 'trigger_type': DialogueModel.TRIGGER_AUTO, 'question': '那颗夜明珠有什么特别之处？', 'answer': '那颗珠子啊，不仅仅是亮。据西域使者说，它还有一个奇特的地方——遇热会变得更亮，遇冷则光芒收敛。', 'order_num': 1}
        ]

        for d in dialogues:
            self.dialogue_model.create(
                character_id=d['character_id'],
                case_id=case_id,
                trigger_type=d['trigger_type'],
                question=d['question'],
                answer=d['answer'],
                unlock_condition=d.get('unlock_condition', ''),
                order_num=d['order_num']
            )

    def _create_tang_timeline(self, case_id: int):
        events = [
            {'event_name': '夜明珠入藏偏殿', 'event_time': '酉时（17:00-19:00）', 'description': '夜明珠由王公公亲自送入偏殿，放置于锦盒之中。', 'order_num': 1, 'is_hidden': 0},
            {'event_name': '灵儿送点心', 'event_time': '戌时（19:00-21:00）', 'description': '宫女灵儿为值守人员送点心，曾进入偏殿。', 'order_num': 2, 'is_hidden': 0},
            {'event_name': '开始起风', 'event_time': '亥时（21:00-23:00）', 'description': '窗外开始刮起大风，风声呼啸。', 'order_num': 3, 'is_hidden': 0},
            {'event_name': '神秘人影', 'event_time': '子时（23:00-01:00）', 'description': '有巡逻士兵看到一个黑影在屋顶移动，但以为是野猫。', 'order_num': 4, 'is_hidden': 1},
            {'event_name': '瓦片响动', 'event_time': '丑时（01:00-03:00）', 'description': '李统领听到屋顶有瓦片响动的声音。', 'order_num': 5, 'is_hidden': 0},
            {'event_name': '发现失窃', 'event_time': '寅时（03:00-05:00）', 'description': '换岗时发现夜明珠不翼而飞，立即上报。', 'order_num': 6, 'is_hidden': 0}
        ]

        for event in events:
            self.timeline_model.create(
                case_id=case_id,
                event_name=event['event_name'],
                event_time=event['event_time'],
                description=event['description'],
                order_num=event['order_num'],
                is_hidden=event['is_hidden']
            )

    def _create_tang_evidence(self, case_id: int):
        clue_ids = []
        clues = self.clue_model.get_by_case(case_id)
        for clue in clues:
            if clue['name'] in ['窗台上的脚印', '守卫证词', '夜行衣残片']:
                clue_ids.append(clue['id'])

        self.evidence_model.create(
            case_id=case_id,
            clue_ids=clue_ids,
            conclusion='宫女灵儿趁夜潜入偏殿，用轻功从窗户进入，盗走了夜明珠。',
            is_correct=1,
            explanation='灵儿因为家中老母病重，无钱医治，一时糊涂偷走了夜明珠。她本想变卖后救母亲，没想到事情闹得这么大。脚印是她留下的，夜行衣也是她的。'
        )

    def _create_tang_quiz(self, case_id: int):
        quizzes = [
            {'question': '夜明珠在什么情况下会变得更亮？', 'options': ['遇热', '遇冷', '遇水', '遇火'], 'correct_answer': '遇热', 'explanation': '据张画师所说，夜明珠遇热会变得更亮，遇冷则光芒收敛。', 'reward_exp': 20, 'order_num': 1},
            {'question': '案发当晚大约什么时间听到了瓦片响动？', 'options': ['子时', '丑时', '寅时', '卯时'], 'correct_answer': '丑时', 'explanation': '李统领在丑时（01:00-03:00）听到了屋顶有瓦片响动的声音。', 'reward_exp': 20, 'order_num': 2},
            {'question': '宫女灵儿为什么要偷夜明珠？', 'options': ['贪图富贵', '母亲病重无钱医治', '受人指使', '好奇把玩'], 'correct_answer': '母亲病重无钱医治', 'explanation': '灵儿的母亲病重，无钱医治，一时糊涂才犯下大错。', 'reward_exp': 30, 'order_num': 3}
        ]

        for quiz in quizzes:
            self.quiz_model.create(
                case_id=case_id,
                question=quiz['question'],
                options=quiz['options'],
                correct_answer=quiz['correct_answer'],
                explanation=quiz['explanation'],
                reward_exp=quiz['reward_exp'],
                order_num=quiz['order_num']
            )

    def _create_tang_endings(self, case_id: int):
        endings = [
            {'ending_type': EndingModel.TRUTH, 'title': '真相大白', 'description': '你查明了真相，原来是宫女灵儿为了给母亲治病，一时糊涂偷走了夜明珠。太宗皇帝感念其孝心，又念及她平日勤勉，特赦其罪，并派太医为其母亲治病。灵儿归还了夜明珠，对皇帝感恩戴德。', 'condition_desc': '提交正确的证据链和结论', 'order_num': 1},
            {'ending_type': EndingModel.PARTIAL, 'title': '疑团未解', 'description': '你找到了一些线索，但未能完全还原真相。案件暂时搁置，夜明珠的下落成了一个谜。', 'condition_desc': '提交部分正确的证据链', 'order_num': 2},
            {'ending_type': EndingModel.WRONG, 'title': '冤枉无辜', 'description': '你错误地指控了李统领，导致他被革职查办。数月后真凶落网，李统领已在狱中病逝。你为自己的错误深感愧疚。', 'condition_desc': '提交错误的证据链和结论', 'order_num': 3}
        ]

        for ending in endings:
            self.ending_model.create(
                case_id=case_id,
                ending_type=ending['ending_type'],
                title=ending['title'],
                description=ending['description'],
                condition_desc=ending['condition_desc'],
                order_num=ending['order_num']
            )

    def _create_song_case(self) -> int:
        case_id = self.case_model.create(
            title='清明上河图杀人案',
            era=CaseModel.SONG,
            year='宣和二年',
            description='汴京城内，繁华似锦。在清明上河图所描绘的虹桥附近，一名富商在酒楼中被人毒杀。凶手作案手法隐蔽，在场众人都有嫌疑。',
            background_story='宣和二年，清明时节，汴京城内热闹非凡。虹桥边的"悦来酒楼"里，富商周员外正在宴请宾朋。酒过三巡，周员外突然脸色发青，倒地身亡。经过仵作检验，确认是砒霜中毒。酒楼当时宾客满座，谁是凶手？开封府尹命你彻查此案。',
            difficulty=3,
            cover_image='',
            status=CaseModel.STATUS_ONLINE,
            order_num=2
        )

        if case_id <= 0:
            return 0

        self._create_song_clues(case_id)
        self._create_song_characters(case_id)
        self._create_song_timeline(case_id)
        self._create_song_evidence(case_id)
        self._create_song_quiz(case_id)
        self._create_song_endings(case_id)

        return case_id

    def _create_song_clues(self, case_id: int):
        clues = [
            {'name': '毒酒壶', 'type': ClueModel.PHYSICAL, 'description': '周员外所用的酒壶，里面的残酒检验出砒霜。', 'location': '悦来酒楼二楼雅间', 'content': '这是一把银质酒壶，造型精美。壶中剩余的酒含有剧毒。', 'is_critical': 1, 'order_num': 1},
            {'name': '可疑粉末', 'type': ClueModel.PHYSICAL, 'description': '在酒楼后院的花丛中发现的白色粉末。', 'location': '悦来酒楼后院', 'content': '经仵作辨认，这正是砒霜。旁边还有一个空的油纸包。', 'is_critical': 1, 'order_num': 2},
            {'name': '借据', 'type': ClueModel.DOCUMENT, 'description': '周员外的账房先生与他的借据。', 'location': '周员外怀中', 'content': '账房李先生欠周员外纹银三千两，已逾期三个月。', 'is_critical': 1, 'order_num': 3},
            {'name': '小二证词', 'type': ClueModel.TESTIMONY, 'description': '酒楼伙计的证词。', 'location': '悦来酒楼', 'content': "李账房今天来得特别早，一直在雅间门口徘徊。后来张老板也来了，两人在角落里窃窃私语。", 'is_critical': 1, 'order_num': 4},
            {'name': '张记当铺玉佩', 'type': ClueModel.PHYSICAL, 'description': '张老板腰间佩戴的玉佩，上面有周家的家徽。', 'location': '张老板身上', 'content': '玉佩质地温润，刻有周字。据说是当年周员外欠张老板钱，抵押给他的。', 'is_critical': 0, 'order_num': 5},
            {'name': '菜单', 'type': ClueModel.DOCUMENT, 'description': '当天酒席的菜单。', 'location': '酒楼柜台', 'content': '菜品有：红烧鲤鱼、东坡肉、清蒸蟹、炒时蔬等。酒是十年陈的花雕。', 'is_critical': 0, 'order_num': 6},
            {'name': '匿名信件', 'type': ClueModel.DOCUMENT, 'description': '在周员外书房发现的匿名威胁信。', 'location': '周府书房', 'content': '信上写着："若不还钱，小心狗命"，字迹潦草。', 'is_critical': 0, 'order_num': 7},
            {'name': '银簪', 'type': ClueModel.PHYSICAL, 'description': '在雅间角落发现的一支银簪，簪头刻着一个"李"字。', 'location': '悦来酒楼雅间', 'content': '银簪样式普通，是民间常用的款式。', 'is_critical': 1, 'order_num': 8}
        ]

        for clue in clues:
            self.clue_model.create(
                case_id=case_id,
                name=clue['name'],
                type=clue['type'],
                description=clue['description'],
                location=clue['location'],
                content=clue['content'],
                is_critical=clue['is_critical'],
                order_num=clue['order_num']
            )

    def _create_song_characters(self, case_id: int):
        characters = [
            {'name': '李账房', 'title': '周府账房', 'description': '在周家做了十年账房，最近欠了周员外很多钱。', 'personality': '看起来老实本分，但眼神闪烁。', 'dialogue_style': '说话小心翼翼，经常吞吞吐吐。', 'order_num': 1},
            {'name': '张老板', 'title': '当铺老板', 'description': '张记当铺的老板，与周员外表里不一。', 'personality': '油滑世故，老谋深算。', 'dialogue_style': '说话滴水不漏，善于打太极。', 'order_num': 2},
            {'name': '王二', 'title': '酒楼伙计', 'description': '悦来酒楼的伙计，当天负责雅间。', 'personality': '机灵活泼，观察力强。', 'dialogue_style': '语速快，喜欢添油加醋。', 'order_num': 3},
            {'name': '柳娘子', 'title': '周员外小妾', 'description': '周员外新纳的小妾，据说以前是青楼女子。', 'personality': '千娇百媚，心机深沉。', 'dialogue_style': '说话娇滴滴的，眼神却很锐利。', 'order_num': 4},
            {'name': '陈大夫', 'title': '郎中', 'description': '周府的私人医生。', 'personality': '医者仁心，实事求是。', 'dialogue_style': '说话严谨，有条不紊。', 'order_num': 5}
        ]

        for char in characters:
            self.character_model.create(
                case_id=case_id,
                name=char['name'],
                title=char['title'],
                description=char['description'],
                personality=char['personality'],
                dialogue_style=char['dialogue_style'],
                order_num=char['order_num']
            )

        char_ids = {}
        chars = self.character_model.get_by_case(case_id)
        for c in chars:
            char_ids[c['name']] = c['id']

        dialogues = [
            {'character_id': char_ids['李账房'], 'trigger_type': DialogueModel.TRIGGER_AUTO, 'question': '案发时你在哪里？', 'answer': '我...我一直在雅间伺候员外。后来去了一趟茅房，回来就...', 'order_num': 1},
            {'character_id': char_ids['李账房'], 'trigger_type': DialogueModel.TRIGGER_CLUE, 'question': '这张借据是怎么回事？', 'answer': '我...我只是最近手气不好，欠了员外一些钱。但我绝对没有害他！', 'unlock_condition': '3', 'order_num': 2},
            {'character_id': char_ids['李账房'], 'trigger_type': DialogueModel.TRIGGER_CLUE, 'question': '这支银簪是你的吗？', 'answer': '这...这是我给我娘子买的。怎么会在这里？哦，我知道了！一定是我家娘子...不，不可能！', 'unlock_condition': '8', 'order_num': 3},
            {'character_id': char_ids['张老板'], 'trigger_type': DialogueModel.TRIGGER_AUTO, 'question': '你和周员外关系如何？', 'answer': '我和周员外是多年的老朋友了。虽然有些生意上的往来，但那都是正常的。', 'order_num': 1},
            {'character_id': char_ids['张老板'], 'trigger_type': DialogueModel.TRIGGER_CLUE, 'question': '这块玉佩你怎么解释？', 'answer': '这玉佩啊，是周员外三年前欠我钱押给我的。说好去年还的，到现在也没消息。', 'unlock_condition': '5', 'order_num': 2},
            {'character_id': char_ids['王二'], 'trigger_type': DialogueModel.TRIGGER_AUTO, 'question': '案发当天你看到了什么？', 'answer': '那天可热闹了！李账房来得最早，在雅间门口转来转去。后来张老板也来了，和李账房在角落里嘀咕了半天。', 'order_num': 1},
            {'character_id': char_ids['柳娘子'], 'trigger_type': DialogueModel.TRIGGER_AUTO, 'question': '周员外最近有什么异常吗？', 'answer': '员外最近因为账上的事，经常发脾气。尤其是对李先生，好像很不满意的样子。', 'order_num': 1},
            {'character_id': char_ids['陈大夫'], 'trigger_type': DialogueModel.TRIGGER_AUTO, 'question': '周员外的身体怎么样？', 'answer': '周员外身体一向硬朗，只是最近肝火有些旺。我给他开了一些疏肝理气的药。', 'order_num': 1}
        ]

        for d in dialogues:
            self.dialogue_model.create(
                character_id=d['character_id'],
                case_id=case_id,
                trigger_type=d['trigger_type'],
                question=d['question'],
                answer=d['answer'],
                unlock_condition=d.get('unlock_condition', ''),
                order_num=d['order_num']
            )

    def _create_song_timeline(self, case_id: int):
        events = [
            {'event_name': '酒楼布置', 'event_time': '巳时（09:00-11:00）', 'description': '李账房来到酒楼，安排酒席事宜。', 'order_num': 1, 'is_hidden': 0},
            {'event_name': '张老板到访', 'event_time': '午时（11:00-13:00）', 'description': '张老板来到酒楼，与李账房在角落谈话。', 'order_num': 2, 'is_hidden': 0},
            {'event_name': '宾客入席', 'event_time': '未时（13:00-15:00）', 'description': '周员外携柳娘子及众宾客入席。', 'order_num': 3, 'is_hidden': 0},
            {'event_name': '李账房离席', 'event_time': '申时初（15:00左右）', 'description': '李账房称去茅房，离开了雅间约一炷香时间。', 'order_num': 4, 'is_hidden': 0},
            {'event_name': '神秘女子', 'event_time': '申时中（15:30左右）', 'description': '小二看到一个穿蓝衫的女子在雅间外徘徊。', 'order_num': 5, 'is_hidden': 1},
            {'event_name': '周员外中毒', 'event_time': '申时末（16:00左右）', 'description': '周员外饮下一杯酒后，倒地身亡。', 'order_num': 6, 'is_hidden': 0}
        ]

        for event in events:
            self.timeline_model.create(
                case_id=case_id,
                event_name=event['event_name'],
                event_time=event['event_time'],
                description=event['description'],
                order_num=event['order_num'],
                is_hidden=event['is_hidden']
            )

    def _create_song_evidence(self, case_id: int):
        clue_ids = []
        clues = self.clue_model.get_by_case(case_id)
        for clue in clues:
            if clue['name'] in ['毒酒壶', '可疑粉末', '借据', '银簪']:
                clue_ids.append(clue['id'])

        self.evidence_model.create(
            case_id=case_id,
            clue_ids=clue_ids,
            conclusion='李账房的妻子得知丈夫欠下周家巨款，担心周家会报官，便偷偷在酒中下了砒霜。她利用与李账房见面的机会，将毒投入酒壶。',
            is_correct=1,
            explanation='李账房的妻子李氏得知丈夫欠了周员外三千两银子，又听说周员外要报官，情急之下决定铤而走险。她伪装成送饭的，趁李账房去茅房的机会，将砒霜投入酒壶。银簪是她作案时不小心遗落的。'
        )

    def _create_song_quiz(self, case_id: int):
        quizzes = [
            {'question': '周员外中的是什么毒？', 'options': ['鹤顶红', '砒霜', '断肠草', '乌头'], 'correct_answer': '砒霜', 'explanation': '经过仵作检验，确认是砒霜中毒。', 'reward_exp': 20, 'order_num': 1},
            {'question': '李账房欠了周员外多少钱？', 'options': ['一千两', '二千两', '三千两', '五千两'], 'correct_answer': '三千两', 'explanation': '借据上写着纹银三千两，已逾期三个月。', 'reward_exp': 20, 'order_num': 2},
            {'question': '真正的凶手是谁？', 'options': ['李账房', '张老板', '柳娘子', '李账房的妻子'], 'correct_answer': '李账房的妻子', 'explanation': '李账房的妻子李氏担心丈夫被告官，铤而走险下了毒。', 'reward_exp': 30, 'order_num': 3}
        ]

        for quiz in quizzes:
            self.quiz_model.create(
                case_id=case_id,
                question=quiz['question'],
                options=quiz['options'],
                correct_answer=quiz['correct_answer'],
                explanation=quiz['explanation'],
                reward_exp=quiz['reward_exp'],
                order_num=quiz['order_num']
            )

    def _create_song_endings(self, case_id: int):
        endings = [
            {'ending_type': EndingModel.TRUTH, 'title': '水落石出', 'description': '你查明了真相，凶手是李账房的妻子李氏。她担心丈夫欠账被告官，情急之下投毒。李氏供认不讳，被判处流放三千里。李账房因知情不报，被杖责五十。张老板与柳娘子虽与周员外在钱财上有纠葛，但与此案无关。', 'condition_desc': '提交正确的证据链和结论', 'order_num': 1},
            {'ending_type': EndingModel.PARTIAL, 'title': '真相朦胧', 'description': '你找到了李账房是凶手的证据，但忽略了他妻子的参与。李账房被判斩刑，临刑前他大呼冤枉。你总觉得哪里不对，但案子已经结了。', 'condition_desc': '提交部分正确的证据链', 'order_num': 2},
            {'ending_type': EndingModel.WRONG, 'title': '草菅人命', 'description': '你错误地指控了张老板。张老板在严刑拷打下屈打成招，被判死刑。半年后，另一桩案子牵连出真凶，张老板已被处决。你因此被革职查办。', 'condition_desc': '提交错误的证据链和结论', 'order_num': 3},
            {'ending_type': EndingModel.HIDDEN, 'title': '案中有案', 'description': '在调查过程中，你意外发现周员外多年前曾害张老板家破人亡，张老板本想在酒中下慢性药报复，但没想到有人先下了毒手。你决定隐瞒这个秘密，只公布了李氏下毒的真相。', 'condition_desc': '收集所有线索后选择隐藏部分真相', 'order_num': 4}
        ]

        for ending in endings:
            self.ending_model.create(
                case_id=case_id,
                ending_type=ending['ending_type'],
                title=ending['title'],
                description=ending['description'],
                condition_desc=ending['condition_desc'],
                order_num=ending['order_num']
            )

    def _create_minguo_case(self) -> int:
        case_id = self.case_model.create(
            title='列车密室杀人案',
            era=CaseModel.MINGUO,
            year='民国二十三年',
            description='京沪特快列车上，富商王德福在封闭的软卧包厢内被人杀害。包厢从内反锁，车窗紧闭，凶手是如何作案的？',
            background_story='民国二十三年，一列从上海开往北平的特快列车正在夜色中疾驰。富商王德福包下了3号软卧包厢。第二天清晨，列车员敲门无人应答，从门缝中看到里面似乎有血迹。乘警赶来撬开门，发现王德福倒在血泊中，胸口插着一把匕首。包厢门从内反锁，窗户也从内紧闭，这是一个完美的密室。车上乘客身份各异，谁是凶手？',
            difficulty=4,
            cover_image='',
            status=CaseModel.STATUS_ONLINE,
            order_num=3
        )

        if case_id <= 0:
            return 0

        self._create_minguo_clues(case_id)
        self._create_minguo_characters(case_id)
        self._create_minguo_timeline(case_id)
        self._create_minguo_evidence(case_id)
        self._create_minguo_quiz(case_id)
        self._create_minguo_endings(case_id)

        return case_id

    def _create_minguo_clues(self, case_id: int):
        clues = [
            {'name': '匕首', 'type': ClueModel.PHYSICAL, 'description': '插在死者胸口的匕首，刀柄上有复杂的花纹。', 'location': '死者胸口', 'content': '匕首约七寸长，锋利无比。刀柄刻着"赠吾爱"三个字，下方有一行小字：民国二十二年秋。', 'is_critical': 1, 'order_num': 1},
            {'name': '反锁的门', 'type': ClueModel.PHYSICAL, 'description': '包厢门从内部反锁，是那种老式的插销锁。', 'location': '包厢门', 'content': '插销还插在锁孔里，门板上有一个小小的猫洞，平时用于递送餐食。', 'is_critical': 1, 'order_num': 2},
            {'name': '紧闭的窗户', 'type': ClueModel.PHYSICAL, 'description': '窗户从内紧闭，窗台上有一层薄灰。', 'location': '包厢窗户', 'content': '窗户是上下推拉式的，插销完好。窗台上的灰尘没有被触碰的痕迹。', 'is_critical': 0, 'order_num': 3},
            {'name': '烟头', 'type': ClueModel.PHYSICAL, 'description': '包厢角落的两个烟头，牌子是"大前门"。', 'location': '包厢角落', 'content': '一个烟蒂较长，一个较短。过滤嘴上有淡淡的口红印。', 'is_critical': 1, 'order_num': 4},
            {'name': '撕碎的照片', 'type': ClueModel.PHYSICAL, 'description': '在垃圾桶里发现的撕碎的照片，勉强能拼出一个女子的身影。', 'location': '包厢垃圾桶', 'content': '照片中的女子穿着旗袍，面容姣好。背面写着"我的婉清"。', 'is_critical': 1, 'order_num': 5},
            {'name': '车票', 'type': ClueModel.DOCUMENT, 'description': '死者的车票，显示从上海到北平。', 'location': '死者上衣口袋', 'content': '车票是一等座，3号包厢。购票人是王德福。', 'is_critical': 0, 'order_num': 6},
            {'name': '遗嘱草稿', 'type': ClueModel.DOCUMENT, 'description': '在死者行李箱中发现的遗嘱草稿。', 'location': '死者行李箱', 'content': '遗嘱草稿中提到，要将大部分财产留给一个叫"婉清"的人。', 'is_critical': 1, 'order_num': 7},
            {'name': '乘客证词', 'type': ClueModel.TESTIMONY, 'description': '隔壁包厢乘客的证词。', 'location': '4号包厢', 'content': "昨晚十点多，听到隔壁有争吵声，好像是一男一女。后来听到一声闷响，然后就安静了。", 'is_critical': 1, 'order_num': 8},
            {'name': '细铁丝', 'type': ClueModel.PHYSICAL, 'description': '在走廊地毯上发现的一根细铁丝，一端弯成了小钩。', 'location': '3号包厢外走廊', 'content': '铁丝很细，但很坚韧。弯钩的形状很特别。', 'is_critical': 1, 'order_num': 9}
        ]

        for clue in clues:
            self.clue_model.create(
                case_id=case_id,
                name=clue['name'],
                type=clue['type'],
                description=clue['description'],
                location=clue['location'],
                content=clue['content'],
                is_critical=clue['is_critical'],
                order_num=clue['order_num']
            )

    def _create_minguo_characters(self, case_id: int):
        characters = [
            {'name': '林婉清', 'title': '神秘女子', 'description': '坐在2号包厢的年轻女子，容貌清丽，气质忧郁。', 'personality': '沉默寡言，眼神中带着悲伤。', 'dialogue_style': '说话轻声细语，似乎有难言之隐。', 'order_num': 1},
            {'name': '王大富', 'title': '死者侄子', 'description': '王德福的侄子，一同在头等车厢。', 'personality': '油头粉面，看起来不务正业。', 'dialogue_style': '说话油腔滑调，眼神闪烁。', 'order_num': 2},
            {'name': '李教授', 'title': '大学教授', 'description': '5号包厢的乘客，研究物理学的教授。', 'personality': '温文尔雅，观察入微。', 'dialogue_style': '说话有条理，喜欢分析问题。', 'order_num': 3},
            {'name': '张列车员', 'title': '列车员', 'description': '负责头等车厢的列车员，昨晚当值。', 'personality': '老实本分，有些紧张。', 'dialogue_style': '说话有些结巴，似乎在害怕什么。', 'order_num': 4},
            {'name': '赵副官', 'title': '军人', 'description': '6号包厢的乘客，穿着军装，气度不凡。', 'personality': '刚正不阿，有军人气质。', 'dialogue_style': '说话干脆利落，简明扼要。', 'order_num': 5}
        ]

        for char in characters:
            self.character_model.create(
                case_id=case_id,
                name=char['name'],
                title=char['title'],
                description=char['description'],
                personality=char['personality'],
                dialogue_style=char['dialogue_style'],
                order_num=char['order_num']
            )

        char_ids = {}
        chars = self.character_model.get_by_case(case_id)
        for c in chars:
            char_ids[c['name']] = c['id']

        dialogues = [
            {'character_id': char_ids['林婉清'], 'trigger_type': DialogueModel.TRIGGER_AUTO, 'question': '你认识死者吗？', 'answer': '我...我不认识他。只是...只是觉得他有些面熟。', 'order_num': 1},
            {'character_id': char_ids['林婉清'], 'trigger_type': DialogueModel.TRIGGER_CLUE, 'question': '这张照片上的人是你吗？', 'answer': '是...是我。王德福他...他是我的养父。我从小被他养大，但他...他不是人！', 'unlock_condition': '5', 'order_num': 2},
            {'character_id': char_ids['林婉清'], 'trigger_type': DialogueModel.TRIGGER_CLUE, 'question': '这把匕首你认识吗？', 'answer': '这是...这是他送给我的十八岁生日礼物。我一直带在身边。但我昨晚没有去过他的包厢！', 'unlock_condition': '1', 'order_num': 3},
            {'character_id': char_ids['王大富'], 'trigger_type': DialogueModel.TRIGGER_AUTO, 'question': '你和你叔叔关系怎么样？', 'answer': '我们叔侄关系很好啊！叔叔从小就疼我。这次是带我去北平见见世面。', 'order_num': 1},
            {'character_id': char_ids['王大富'], 'trigger_type': DialogueModel.TRIGGER_CLUE, 'question': '你知道你叔叔要改遗嘱吗？', 'answer': '什么？改遗嘱？不可能！叔叔怎么会把财产给外人...哦，我是说，我什么都不知道。', 'unlock_condition': '7', 'order_num': 2},
            {'character_id': char_ids['李教授'], 'trigger_type': DialogueModel.TRIGGER_AUTO, 'question': '你对这个密室案有什么看法？', 'answer': '密室杀人？从物理学角度来说，只要利用得当，反锁一个门并不难。比如，利用那扇门上的猫洞...', 'order_num': 1},
            {'character_id': char_ids['李教授'], 'trigger_type': DialogueModel.TRIGGER_CLUE, 'question': '这根铁丝能做什么？', 'answer': '你看，这弯钩的形状。如果从猫洞伸进去，利用杠杆原理，完全可以从外面把插销顶上。这是最简单的密室手法。', 'unlock_condition': '9', 'order_num': 2},
            {'character_id': char_ids['张列车员'], 'trigger_type': DialogueModel.TRIGGER_AUTO, 'question': '昨晚你看到了什么？', 'answer': '我...我昨晚正常巡车。十点多的时候，看到王少爷从3号包厢出来，神色有些慌张。', 'order_num': 1},
            {'character_id': char_ids['赵副官'], 'trigger_type': DialogueModel.TRIGGER_AUTO, 'question': '昨晚你注意到什么异常吗？', 'answer': '大约十点半的时候，我去车厢连接处抽烟，看到一个穿旗袍的女人在3号包厢门口徘徊。', 'order_num': 1}
        ]

        for d in dialogues:
            self.dialogue_model.create(
                character_id=d['character_id'],
                case_id=case_id,
                trigger_type=d['trigger_type'],
                question=d['question'],
                answer=d['answer'],
                unlock_condition=d.get('unlock_condition', ''),
                order_num=d['order_num']
            )

    def _create_minguo_timeline(self, case_id: int):
        events = [
            {'event_name': '列车从上海出发', 'event_time': '18:00', 'description': '京沪特快列车准时从上海站出发。', 'order_num': 1, 'is_hidden': 0},
            {'event_name': '王大富进入叔叔包厢', 'event_time': '21:30', 'description': '王大富进入3号包厢，与叔叔谈事情。', 'order_num': 2, 'is_hidden': 0},
            {'event_name': '争吵声', 'event_time': '22:00', 'description': '隔壁乘客听到3号包厢传来争吵声，一男一女。', 'order_num': 3, 'is_hidden': 0},
            {'event_name': '神秘女子徘徊', 'event_time': '22:30', 'description': '赵副官看到穿旗袍的女子在3号包厢门口徘徊。', 'order_num': 4, 'is_hidden': 1},
            {'event_name': '一声闷响', 'event_time': '22:45', 'description': '隔壁乘客听到一声闷响，然后包厢安静了。', 'order_num': 5, 'is_hidden': 0},
            {'event_name': '王大富离开包厢', 'event_time': '22:50', 'description': '张列车员看到王大富从3号包厢出来，神色慌张。', 'order_num': 6, 'is_hidden': 0},
            {'event_name': '发现尸体', 'event_time': '次日07:00', 'description': '列车员送餐时发现异常，乘警撬开门发现尸体。', 'order_num': 7, 'is_hidden': 0}
        ]

        for event in events:
            self.timeline_model.create(
                case_id=case_id,
                event_name=event['event_name'],
                event_time=event['event_time'],
                description=event['description'],
                order_num=event['order_num'],
                is_hidden=event['is_hidden']
            )

    def _create_minguo_evidence(self, case_id: int):
        clue_ids = []
        clues = self.clue_model.get_by_case(case_id)
        for clue in clues:
            if clue['name'] in ['匕首', '反锁的门', '烟头', '撕碎的照片', '遗嘱草稿', '乘客证词', '细铁丝']:
                clue_ids.append(clue['id'])

        self.evidence_model.create(
            case_id=case_id,
            clue_ids=clue_ids,
            conclusion='王大富得知叔叔要改遗嘱，将财产留给林婉清，心生歹意。他趁林婉清与叔叔争吵后离开，进入包厢用匕首杀害了叔叔，然后利用细铁丝和门上的猫洞制造了密室。',
            is_correct=1,
            explanation='王大富偷听到叔叔要将大部分财产留给养女林婉清，而自己一分钱都得不到。当晚，林婉清与王德福发生激烈争吵后离开。王大富趁机进入包厢，用林婉清遗失的匕首杀害了叔叔。然后他用细铁丝通过猫洞从外面将插销顶上，制造了密室。他还故意留下烟头和照片，企图嫁祸给林婉清。'
        )

    def _create_minguo_quiz(self, case_id: int):
        quizzes = [
            {'question': '包厢的门是从哪里反锁的？', 'options': ['外面', '里面', '两边都锁了', '没有反锁'], 'correct_answer': '里面', 'explanation': '包厢的门是从内部用插销反锁的。', 'reward_exp': 20, 'order_num': 1},
            {'question': '王德福要把财产留给谁？', 'options': ['侄子王大富', '养女林婉清', '慈善机构', '他的弟弟'], 'correct_answer': '养女林婉清', 'explanation': '遗嘱草稿中提到，要将大部分财产留给一个叫"婉清"的人。', 'reward_exp': 20, 'order_num': 2},
            {'question': '凶手是如何制造密室的？', 'options': ['从窗户逃走', '一直躲在包厢里', '用细铁丝通过猫洞反锁', '用钥匙从外面反锁'], 'correct_answer': '用细铁丝通过猫洞反锁', 'explanation': '王大富利用细铁丝和杠杆原理，通过门上的猫洞从外面将插销顶上。', 'reward_exp': 30, 'order_num': 3},
            {'question': '真正的凶手是谁？', 'options': ['林婉清', '王大富', '李教授', '张列车员'], 'correct_answer': '王大富', 'explanation': '王大富为了独吞叔叔的遗产，杀人并嫁祸给林婉清。', 'reward_exp': 30, 'order_num': 4}
        ]

        for quiz in quizzes:
            self.quiz_model.create(
                case_id=case_id,
                question=quiz['question'],
                options=quiz['options'],
                correct_answer=quiz['correct_answer'],
                explanation=quiz['explanation'],
                reward_exp=quiz['reward_exp'],
                order_num=quiz['order_num']
            )

    def _create_minguo_endings(self, case_id: int):
        endings = [
            {'ending_type': EndingModel.TRUTH, 'title': '天网恢恢', 'description': '你查明了真相，凶手是王大富。他为了独吞叔叔的遗产，残忍地杀害了自己的亲叔叔，并企图嫁祸给林婉清。王大富被判处死刑。林婉清虽然继承了遗产，但经历了这场变故，她将大部分财产捐给了慈善机构，自己去了国外。李教授对你的推理能力赞赏有加，邀请你去他的大学做演讲。', 'condition_desc': '提交正确的证据链和结论', 'order_num': 1},
            {'ending_type': EndingModel.PARTIAL, 'title': '遗憾收场', 'description': '你找到了林婉清是凶手的证据，但忽略了王大富栽赃嫁祸的证据。林婉清被判无期徒刑。三年后，王大富酒后失言吐露真相，案件重审，但林婉清已在狱中病逝。你为此深感自责。', 'condition_desc': '提交部分正确的证据链', 'order_num': 2},
            {'ending_type': EndingModel.WRONG, 'title': '千古奇冤', 'description': '你错误地指控了张列车员。张列车员在严刑逼供下"承认"了罪行，被判处无期徒刑。十年后，真凶王大富在另一起案件中落网，才交代了当年的罪行。张列车员被释放时已精神失常。', 'condition_desc': '提交错误的证据链和结论', 'order_num': 3},
            {'ending_type': EndingModel.HIDDEN, 'title': '法外容情', 'description': '你查明了真相，但也了解到王德福生前不仅控制着林婉清，还做了许多伤天害理的事情。王大富虽然贪婪，但也有苦衷。你最终选择了一个折中的方案，对外公布王德福是被仇家所杀，让王大富主动放弃继承权，远走他乡。', 'condition_desc': '收集所有线索后选择不同的处理方式', 'order_num': 4}
        ]

        for ending in endings:
            self.ending_model.create(
                case_id=case_id,
                ending_type=ending['ending_type'],
                title=ending['title'],
                description=ending['description'],
                condition_desc=ending['condition_desc'],
                order_num=ending['order_num']
            )
