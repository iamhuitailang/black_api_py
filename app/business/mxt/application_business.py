import random
from typing import Dict, Any, List, Optional, Tuple
from app.model.mxt import ApplicationModel, JobModel


JOB_SPECIFIC_REPLIES = {
    1: {
        'name': '狮子驯兽师助理',
        'hired': [
            '🎉 恭喜！狮子说它很喜欢你的指甲钳，决定录用你！明天来上班，记得带创可贴！',
            '🏆 太棒了！狮子看到你的简历后咆哮了一声，我们理解为"同意"！欢迎加入！',
            '⭐ 恭喜被录用！狮子说它正好需要一个不怕被吼的助理，就是你了！',
            '🎊 好消息！狮子看了你的简历后打了个盹，这是它表示满意的方式！',
            '✨ 你被录用了！狮子托梦给我说："这个人不错，让他来给我梳毛！"'
        ],
        'rejected': [
            '😅 抱歉，狮子说它暂时不需要助理，它自己会梳毛...',
            '🙈 不好意思，狮子看到你的指甲钳后后退了三步，我们尊重它的选择...',
            '💔 遗憾通知你，狮子觉得你的嗓门还不够大，它听不到你的指令...',
            '🦁 狮子说它目前只想一个人静一静，下次招聘再联系你！',
            '🎈 抱歉，狮子说它不喜欢被人碰它的鬃毛，你下次早点来...'
        ],
        'backup': [
            '🤔 嗯...狮子说它需要再考虑考虑，把你放进备胎名单了！',
            '📋 你的简历已存入"狮子喜欢的人"人才库，等待被翻牌子！',
            '� 抽奖没中，但没关系，狮子说下次招助理优先考虑你！',
            '🔄 狮子现在有点忙（在睡觉），有需要会联系你！',
            '📮 狮子已经记住你的名字了（真的记住了吗？）'
        ]
    },
    2: {
        'name': '小丑化妆师',
        'hired': [
            '🎉 恭喜！我们的小丑说他终于可以不用自己画笑脸了！欢迎加入！',
            '�🏆 太棒了！你的画技让我们的小丑感动得哭了（他本来就会哭）！',
            '⭐ 恭喜被录用！小丑说他需要一个能画出更夸张笑脸的人！',
            '🎊 好消息！我们的小丑看了你的画后笑了，这是他难得的反应！',
            '✨ 你被录用了！HR说你的画让整个马戏团都开心起来了！'
        ],
        'rejected': [
            '😅 抱歉，我们的小丑说你的笑脸画得还不够悲伤...',
            '🙈 不好意思，小丑说他已经会画自己的脸了，暂时不需要你...',
            '💔 遗憾通知你，我们需要一个绘画水平超过幼儿园大班的候选人...',
            '🤡 小丑看了你的画后哭得更厉害了，这不是我们想要的效果...',
            '🎈 抱歉，你的画笔太粗了，小丑的脸画不下...'
        ],
        'backup': [
            '🤔 嗯...我们需要再看看你的画，先把你放进备胎名单！',
            '📋 你的画已存入马戏团艺术收藏库，等待被欣赏！',
            '🎲 抽奖没中，但没关系，下次招化妆师优先考虑你！',
            '🔄 小丑现在有点忙（在哭），有需要会联系你！',
            '📮 我们会记住你的画笔的！'
        ]
    },
    3: {
        'name': '高空秋千测试员',
        'hired': [
            '� 恭喜！我们的秋千说它需要一个勇敢的测试员！欢迎加入！',
            '🏆 太棒了！你的勇气让我们的绳子都颤抖了！欢迎加入！',
            '⭐ 恭喜被录用！秋千说它很久没遇到这么不怕高的人了！',
            '🎊 好消息！我们的安全网说它很乐意为你服务！',
            '✨ 你被录用了！HR说你的体重在秋千的承重范围内！'
        ],
        'rejected': [
            '😅 抱歉，秋千说它承受不了你的重量...',
            '🙈 不好意思，我们发现你有点恐高，站在椅子上都发抖...',
            '💔 遗憾通知你，我们需要一个不害怕被绳子吊着的候选人...',
            '🎪 秋千说它今天想休息，不想测试任何人...',
            '🎈 抱歉，你太轻了，秋千荡不起来...'
        ],
        'backup': [
            '🤔 嗯...秋千需要再测试测试你，先把你放进备胎名单！',
            '📋 你的简历已存入"勇敢者"人才库，等待被吊起来！',
            '🎲 抽奖没中，但没关系，下次招测试员优先考虑你！',
            '🔄 秋千现在有点忙（在荡），有需要会联系你！',
            '📮 我们会记住你的勇气的！'
        ]
    },
    4: {
        'name': '大象便便清理员',
        'hired': [
            '🎉 恭喜！大象说它正好需要一个能处理它"礼物"的人！欢迎加入！',
            '🏆 太棒了！你的铲子使用技巧让大象都为之震撼！',
            '⭐ 恭喜被录用！大象说它的便便需要一个专业的清理员！',
            '🎊 好消息！我们的嗅觉测试显示你完全合格！',
            '✨ 你被录用了！大象说它会尽量"产出"均匀的！'
        ],
        'rejected': [
            '😅 抱歉，大象说你跑得太慢，它的便便会先落地...',
            '� 不好意思，我们发现你的嗅觉太灵敏了，这不适合这份工作...',
            '�💔 遗憾通知你，我们需要一个能接受"惊喜"的候选人...',
            '🐘 大象说它已经有自己的清理员了，你下次早点来！',
            '🎈 抱歉，你的铲子太小了，大象的"礼物"太大...'
        ],
        'backup': [
            '🤔 嗯...大象需要再观察观察你，先把你放进备胎名单！',
            '📋 你的简历已存入"嗅觉迟钝者"人才库，等待被召唤！',
            '🎲 抽奖没中，但没关系，下次招清理员优先考虑你！',
            '🔄 大象现在有点忙（在"产出"），有需要会联系你！',
            '📮 我们会记住你的铲子的！'
        ]
    },
    5: {
        'name': '吞剑表演者学徒',
        'hired': [
            '🎉 恭喜！我们的剑说它需要一个不害怕它的人！欢迎加入！',
            '🏆 太棒了！你的喉咙让勺子都为之颤抖！欢迎加入！',
            '⭐ 恭喜被录用！吞剑大师说他需要一个能继承衣钵的人！',
            '🎊 好消息！我们的勺子说它很期待被你吞下去！',
            '✨ 你被录用了！HR说你的咽反射测试完全合格！'
        ],
        'rejected': [
            '😅 抱歉，剑说它不想被你吞下去...',
            '🙈 不好意思，我们发现你的咽反射太强了，连吞口水都困难...',
            '💔 遗憾通知你，我们需要一个不挑食的候选人...',
            '⚔️ 剑说它今天不想上班，不想被任何人吞...',
            '🎈 抱歉，你连勺子都吞不下去，吞剑就更难了...'
        ],
        'backup': [
            '🤔 嗯...剑需要再考虑考虑，先把你放进备胎名单！',
            '📋 你的简历已存入"不怕疼"人才库，等待被吞剑！',
            '🎲 抽奖没中，但没关系，下次招学徒优先考虑你！',
            '🔄 剑现在有点忙（在被磨），有需要会联系你！',
            '📮 我们会记住你的喉咙的！'
        ]
    },
    6: {
        'name': '炮弹人（被发射的那种）',
        'hired': [
            '🎉 恭喜！我们的大炮说它需要一个有弹性的人！欢迎加入！',
            '🏆 太棒了！你的弹性让海绵垫都为之兴奋！欢迎加入！',
            '⭐ 恭喜被录用！大炮说它很久没遇到这么不怕摔的人了！',
            '🎊 好消息！我们的海绵垫说它很乐意为你服务！',
            '✨ 你被录用了！HR说你的体重在大炮的射程范围内！'
        ],
        'rejected': [
            '😅 抱歉，大炮说它不想发射你...',
            '🙈 不好意思，我们发现你太害怕了，钻进大炮前就晕了...',
            '💔 遗憾通知你，我们需要一个不害怕被发射的候选人...',
            '🎯 大炮说它今天想休息，不想发射任何人...',
            '🎈 抱歉，你太轻了，大炮发射不准...'
        ],
        'backup': [
            '🤔 嗯...大炮需要再测试测试你，先把你放进备胎名单！',
            '📋 你的简历已存入"不怕摔"人才库，等待被发射！',
            '🎲 抽奖没中，但没关系，下次招炮弹人优先考虑你！',
            '🔄 大炮现在有点忙（在装药），有需要会联系你！',
            '📮 我们会记住你的弹性的！'
        ]
    },
    7: {
        'name': '独轮车维修工',
        'hired': [
            '🎉 恭喜！我们的独轮车说它需要一个会修理的人！欢迎加入！',
            '🏆 太棒了！你的平衡感让独轮车都为之倾倒！欢迎加入！',
            '⭐ 恭喜被录用！独轮车说它很久没遇到这样的维修工了！',
            '🎊 好消息！我们的轮子说它们很期待被你修理！',
            '✨ 你被录用了！HR说你的修理技术完全合格！'
        ],
        'rejected': [
            '😅 抱歉，独轮车说它不需要修理，它很好...',
            '🙈 不好意思，我们发现你连自行车都不会骑，独轮车就更难了...',
            '💔 遗憾通知你，我们需要一个有耐心的候选人...',
            '🚲 独轮车说它今天想休息，不想被任何人修理...',
            '🎈 抱歉，你的平衡感太差，站都站不稳...'
        ],
        'backup': [
            '🤔 嗯...独轮车需要再考虑考虑，先把你放进备胎名单！',
            '📋 你的简历已存入"会修东西"人才库，等待被召唤！',
            '🎲 抽奖没中，但没关系，下次招维修工优先考虑你！',
            '🔄 独轮车现在有点忙（在转），有需要会联系你！',
            '📮 我们会记住你的扳手的！'
        ]
    },
    8: {
        'name': '魔术师助手',
        'hired': [
            '🎉 恭喜！我们的魔术师说他需要一个能被锯成两半的人！欢迎加入！',
            '🏆 太棒了！你的身体柔软度让魔术师都为之惊叹！欢迎加入！',
            '⭐ 恭喜被录用！魔术师说他需要一个不怕黑的助手！',
            '🎊 好消息！我们的魔术帽说它很期待藏你进去！',
            '✨ 你被录用了！HR说你的身体完全符合"被切割"的要求！'
        ],
        'rejected': [
            '😅 抱歉，魔术师说他不想把你锯成两半...',
            '🙈 不好意思，我们发现你太害怕了，钻进魔术箱前就哭了...',
            '💔 遗憾通知你，我们需要一个不怕黑的候选人...',
            '🎩 魔术师说他今天想休息，不想表演锯人...',
            '🎈 抱歉，你的身体太硬了，锯不动...'
        ],
        'backup': [
            '🤔 嗯...魔术师需要再考虑考虑，先把你放进备胎名单！',
            '📋 你的简历已存入"不怕被切"人才库，等待被锯！',
            '🎲 抽奖没中，但没关系，下次招助手优先考虑你！',
            '🔄 魔术师现在有点忙（在变魔术），有需要会联系你！',
            '📮 我们会记住你的勇气的！'
        ]
    },
    9: {
        'name': '马戏团门票撕票员',
        'hired': [
            '🎉 恭喜！我们的门票说它们需要一个手劲大的人！欢迎加入！',
            '🏆 太棒了！你的嗓门让门票都为之颤抖！欢迎加入！',
            '⭐ 恭喜被录用！门票说它们很久没遇到这样的撕票员了！',
            '🎊 好消息！我们的观众说他们很期待被你撕票！',
            '✨ 你被录用了！HR说你的手劲完全合格！'
        ],
        'rejected': [
            '😅 抱歉，门票说它们不想被你撕掉...',
            '🙈 不好意思，我们发现你的嗓门太小了，观众听不到你喊"进来看看"...',
            '💔 遗憾通知你，我们需要一个手劲足的候选人...',
            '🎫 门票说它们今天想休息，不想被任何人撕...',
            '🎈 抱歉，你撕票的动作太温柔了，门票都没感觉到...'
        ],
        'backup': [
            '🤔 嗯...门票需要再考虑考虑，先把你放进备胎名单！',
            '📋 你的简历已存入"嗓门大"人才库，等待被撕票！',
            '🎲 抽奖没中，但没关系，下次招撕票员优先考虑你！',
            '🔄 门票现在有点忙（在被卖），有需要会联系你！',
            '📮 我们会记住你的嗓门的！'
        ]
    },
    10: {
        'name': '动物喂食专员',
        'hired': [
            '🎉 恭喜！我们的动物说它们需要一个不被抢饭的人！欢迎加入！',
            '🏆 太棒了！你的喂食技巧让猴子都为之鼓掌！欢迎加入！',
            '⭐ 恭喜被录用！动物说它们很久没遇到这样的喂食专员了！',
            '🎊 好消息！我们的香蕉说它很期待被你喂给猴子！',
            '✨ 你被录用了！HR说你不被动物抢饭的能力完全合格！'
        ],
        'rejected': [
            '😅 抱歉，动物说它们不想吃你喂的饭...',
            '🙈 不好意思，我们发现你被猴子抢走了自己的饭...',
            '💔 遗憾通知你，我们需要一个不被动物抢走饭的候选人...',
            '🍎 动物说它们今天想休息，不想被任何人喂...',
            '🎈 抱歉，你喂的食物太难吃了，动物都不吃...'
        ],
        'backup': [
            '🤔 嗯...动物需要再考虑考虑，先把你放进备胎名单！',
            '📋 你的简历已存入"不被抢饭"人才库，等待被喂食！',
            '🎲 抽奖没中，但没关系，下次招喂食专员优先考虑你！',
            '🔄 动物现在有点忙（在吃饭），有需要会联系你！',
            '📮 我们会记住你的食物的！'
        ]
    },
    11: {
        'name': '帐篷搭建工',
        'hired': [
            '🎉 恭喜！我们的帐篷说它们需要一个会打结的人！欢迎加入！',
            '🏆 太棒了！你的力气让钉子都为之颤抖！欢迎加入！',
            '⭐ 恭喜被录用！帐篷说它们很久没遇到这样的搭建工了！',
            '🎊 好消息！我们的绳子说它们很期待被你打结！',
            '✨ 你被录用了！HR说你找钉子的能力完全合格！'
        ],
        'rejected': [
            '� 抱歉，帐篷说它们不需要搭建，它们想躺着...',
            '🙈 不好意思，我们发现你连个结都打不好...',
            '💔 遗憾通知你，我们需要一个力气大的候选人...',
            '⛺ 帐篷说它今天想休息，不想被任何人搭建...',
            '🎈 抱歉，你找钉子的速度太慢了，帐篷都等凉了...'
        ],
        'backup': [
            '🤔 嗯...帐篷需要再考虑考虑，先把你放进备胎名单！',
            '📋 你的简历已存入"会打结"人才库，等待被搭建！',
            '🎲 抽奖没中，但没关系，下次招搭建工优先考虑你！',
            '🔄 帐篷现在有点忙（在被搭），有需要会联系你！',
            '📮 我们会记住你的锤子的！'
        ]
    },
    12: {
        'name': '杂耍球捡球童',
        'hired': [
            '🎉 恭喜！我们的球说它们需要一个跑得快的人！欢迎加入！',
            '🏆 太棒了！你的速度让球都为之惊叹！欢迎加入！',
            '⭐ 恭喜被录用！球说它们很久没遇到这样的捡球童了！',
            '🎊 好消息！我们的杂耍演员说他很期待你捡球！',
            '✨ 你被录用了！HR说你眼疾手快的能力完全合格！'
        ],
        'rejected': [
            '😅 抱歉，球说它们不想被你捡...',
            '🙈 不好意思，我们发现你跑得太慢了，球都滚远了...',
            '💔 遗憾通知你，我们需要一个眼疾手快的候选人...',
            '🎾 球说它们今天想休息，不想被任何人捡...',
            '🎈 抱歉，你总是踩到球，球都被你踩扁了...'
        ],
        'backup': [
            '🤔 嗯...球需要再考虑考虑，先把你放进备胎名单！',
            '📋 你的简历已存入"跑得快"人才库，等待被捡球！',
            '🎲 抽奖没中，但没关系，下次招捡球童优先考虑你！',
            '🔄 球现在有点忙（在被扔），有需要会联系你！',
            '📮 我们会记住你的速度的！'
        ]
    }
}


class ApplicationBusiness:
    def __init__(self):
        self.model = ApplicationModel()
        self.job_model = JobModel()

    def _generate_hr_reply(self, applicant_name: str, job_id: int, job_name: str) -> Tuple[str, str]:
        rand = random.random()
        if rand < 0.3:
            status = 'hired'
        elif rand < 0.7:
            status = 'rejected'
        else:
            status = 'backup'
        
        job_replies = JOB_SPECIFIC_REPLIES.get(job_id)
        
        if job_replies and status in job_replies:
            reply = random.choice(job_replies[status])
        else:
            generic_replies = {
                'hired': [
                    '🎉 恭喜你！你被录用了！欢迎加入马戏团大家庭！',
                    '🏆 棒极了！我们决定录用你！明天来上班！',
                    '⭐ 太有才了！欢迎加入马戏团大家庭！',
                    '🎊 恭喜被录用！记得来上班！',
                    '✨ 你的简历太精彩了！我们决定录用你！'
                ],
                'rejected': [
                    '😅 抱歉，我们觉得你还需要再练练...',
                    '🙈 不好意思，这个职位暂时不需要人了...',
                    '💔 遗憾通知你，我们需要更合适的候选人...',
                    '🎈 气球破了...不对，是你的简历被气球带走了...',
                    '😢 很遗憾，你没有被录用，下次再投吧！'
                ],
                'backup': [
                    '🤔 嗯...我们决定把你放在"备胎"名单里！',
                    '📋 你的简历已存入马戏团人才库，等待被翻牌子！',
                    '🎲 抽奖没中，但没关系，我们把你放进备用池了！',
                    '🔄 这个职位暂时满了，但我们会记住你的名字！',
                    '📮 我们已经把你的简历存档了，有需要会联系你！'
                ]
            }
            replies = generic_replies.get(status, ['嗯...我们需要再想想'])
            reply = random.choice(replies)
        
        formatted_reply = f"【{applicant_name}】申请【{job_name}】的回复：{reply}"
        
        return status, formatted_reply

    def submit_application(self, job_id: int, applicant_name: str, age: int = 18,
                           has_experience: int = 0, specialties: str = '',
                           reason: str = '', is_urgent: int = 0) -> Dict[str, Any]:
        job = self.job_model.get_by_id(job_id)
        if not job:
            return {
                'code': 1,
                'message': '职位不存在',
                'data': None
            }
        
        if not applicant_name or not applicant_name.strip():
            return {
                'code': 1,
                'message': '请填写你的名字',
                'data': None
            }
        
        if not job.get('is_active'):
            return {
                'code': 1,
                'message': '该职位暂不招聘',
                'data': None
            }
        
        try:
            status, hr_reply = self._generate_hr_reply(
                applicant_name.strip(), 
                job_id, 
                job.get('name', '')
            )
            
            new_id = self.model.create(
                job_id=job_id,
                applicant_name=applicant_name.strip(),
                age=age,
                has_experience=has_experience,
                specialties=specialties,
                reason=reason,
                status=status,
                hr_reply=hr_reply,
                is_urgent=is_urgent
            )
            
            return self.get_application_by_id(new_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_application_by_id(self, record_id: int) -> Dict[str, Any]:
        application = self.model.get_by_id(record_id)
        
        if application:
            job = self.job_model.get_by_id(application.get('job_id'))
            job_name = job.get('name', '') if job else ''
            job_icon = job.get('icon', '') if job else ''
            
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'id': application.get('id'),
                    'job_id': application.get('job_id'),
                    'job_name': job_name,
                    'job_icon': job_icon,
                    'applicant_name': application.get('applicant_name'),
                    'age': application.get('age'),
                    'has_experience': application.get('has_experience'),
                    'specialties': application.get('specialties'),
                    'reason': application.get('reason'),
                    'status': application.get('status'),
                    'hr_reply': application.get('hr_reply'),
                    'is_urgent': application.get('is_urgent'),
                    'created_at': application.get('created_at'),
                    'updated_at': application.get('updated_at')
                }
            }
        
        return {
            'code': 1,
            'message': '投递记录不存在',
            'data': None
        }

    def get_applications_by_job(self, job_id: int) -> Dict[str, Any]:
        applications = self.model.get_by_job_id(job_id)
        
        result = []
        for app in applications:
            job = self.job_model.get_by_id(app.get('job_id'))
            result.append({
                'id': app.get('id'),
                'job_id': app.get('job_id'),
                'job_name': job.get('name', '') if job else '',
                'job_icon': job.get('icon', '') if job else '',
                'applicant_name': app.get('applicant_name'),
                'age': app.get('age'),
                'has_experience': app.get('has_experience'),
                'specialties': app.get('specialties'),
                'reason': app.get('reason'),
                'status': app.get('status'),
                'hr_reply': app.get('hr_reply'),
                'is_urgent': app.get('is_urgent'),
                'created_at': app.get('created_at'),
                'updated_at': app.get('updated_at')
            })
        
        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def get_all_applications(self) -> Dict[str, Any]:
        applications = self.model.get_all()
        
        result = []
        for app in applications:
            job = self.job_model.get_by_id(app.get('job_id'))
            result.append({
                'id': app.get('id'),
                'job_id': app.get('job_id'),
                'job_name': job.get('name', '') if job else '',
                'job_icon': job.get('icon', '') if job else '',
                'applicant_name': app.get('applicant_name'),
                'age': app.get('age'),
                'has_experience': app.get('has_experience'),
                'specialties': app.get('specialties'),
                'reason': app.get('reason'),
                'status': app.get('status'),
                'hr_reply': app.get('hr_reply'),
                'is_urgent': app.get('is_urgent'),
                'created_at': app.get('created_at'),
                'updated_at': app.get('updated_at')
            })
        
        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def get_applications_by_status(self, status: str) -> Dict[str, Any]:
        applications = self.model.get_by_status(status)
        
        result = []
        for app in applications:
            job = self.job_model.get_by_id(app.get('job_id'))
            result.append({
                'id': app.get('id'),
                'job_id': app.get('job_id'),
                'job_name': job.get('name', '') if job else '',
                'applicant_name': app.get('applicant_name'),
                'status': app.get('status'),
                'created_at': app.get('created_at')
            })
        
        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def delete_application(self, record_id: int) -> Dict[str, Any]:
        existing = self.model.get_by_id(record_id)
        if not existing:
            return {
                'code': 1,
                'message': f'投递记录ID {record_id} 不存在',
                'data': None
            }
        
        affected = self.model.delete(record_id)
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
