import type { StoryNode, Ending } from '../types'

export const ENDINGS: Ending[] = [
  {
    id: 'ending-aaa',
    title: '天下第一',
    description: '你以正道之姿登顶武林，惩恶扬善，四海升平。江湖人称"天下第一侠"，传为千古佳话。',
    branchKey: '1-1-1'
  },
  {
    id: 'ending-aab',
    title: '归隐山林',
    description: '你看透江湖纷争，携心爱之人隐居深山，不问世事。每日耕读习武，逍遥自在。',
    branchKey: '1-1-2'
  },
  {
    id: 'ending-aac',
    title: '悲情英雄',
    description: '你为救天下苍生，与魔教教主同归于尽。后人立碑纪念，香火绵延不绝。',
    branchKey: '1-1-3'
  },
  {
    id: 'ending-aba',
    title: '正道盟主',
    description: '你以武功和仁德服众，被推举为正道盟主。武林各派和谐共处，再无纷争。',
    branchKey: '1-2-1'
  },
  {
    id: 'ending-abb',
    title: '亦正亦邪',
    description: '你游走正邪之间，随心所欲。世人评说纷纭，而你只在乎心中那片江湖。',
    branchKey: '1-2-2'
  },
  {
    id: 'ending-abc',
    title: '孤独剑客',
    description: '你武功盖世却孑然一身，常年与长剑为伴。最后一次被人看见，是在雪山之巅。',
    branchKey: '1-2-3'
  },
  {
    id: 'ending-aca',
    title: '魔道至尊',
    description: '你一统魔教，威压天下。正道敢怒不敢言，江湖在你的铁腕之下瑟瑟发抖。',
    branchKey: '1-3-1'
  },
  {
    id: 'ending-acb',
    title: '功败垂成',
    description: '你离那无上宝座仅一步之遥，却因心腹背叛而功亏一篑。从此隐姓埋名，再无音讯。',
    branchKey: '1-3-2'
  },
  {
    id: 'ending-acc',
    title: '轮回转世',
    description: '你参悟天地至理，勘破生死。一道金光过后，不知所踪，只留下满地传说。',
    branchKey: '1-3-3'
  }
]

export function getEndingByBranch(branch: string): Ending | undefined {
  return ENDINGS.find(e => e.branchKey === branch)
}

export const STORY_NODES: Record<string, StoryNode> = {
  'start': {
    id: 'start',
    chapter: 1,
    speaker: '旁白',
    dialogue: '话说前朝末年，天下大乱，群魔并起。你是一位初入江湖的少年侠客，自幼在深山学艺，今日终于艺成下山，欲闯荡一番事业。',
    nextNodeId: 'c1-n1'
  },
  'c1-n1': {
    id: 'c1-n1',
    chapter: 1,
    speaker: '旁白',
    dialogue: '你走到一处山道，忽闻前方有女子呼救之声。只见三个山贼正围着一位年轻姑娘，欲行不轨。',
    choices: [
      { id: 'c1-c1a', text: '路见不平，拔刀相助！', nextNodeId: 'c1-n2a' },
      { id: 'c1-c1b', text: '暗中观察，伺机而动', nextNodeId: 'c1-n2b' },
      { id: 'c1-c1c', text: '事不关己，绕道而行', nextNodeId: 'c1-n2c' }
    ]
  },
  'c1-n2a': {
    id: 'c1-n2a',
    chapter: 1,
    speaker: '山贼小喽啰',
    dialogue: '哪来的毛头小子，敢管爷爷的闲事？弟兄们，给我上！',
    nextBattleId: 'xiao-luo-luo',
    nextNodeId: 'c1-n3a'
  },
  'c1-n2b': {
    id: 'c1-n2b',
    chapter: 1,
    speaker: '旁白',
    dialogue: '你藏身树后，只见那山贼头目对姑娘上下其手。你悄悄摸近，准备一击制敌。',
    nextBattleId: 'shan-zei-tou-mu',
    nextNodeId: 'c1-n3b'
  },
  'c1-n2c': {
    id: 'c1-n2c',
    chapter: 1,
    speaker: '旁白',
    dialogue: '你转身欲走，却被一个山贼眼尖发现。"想跑？没那么容易！"',
    nextBattleId: 'shan-zei-tou-mu',
    nextNodeId: 'c1-n3c'
  },
  'c1-n3a': {
    id: 'c1-n3a',
    chapter: 1,
    speaker: '年轻姑娘',
    dialogue: '多谢少侠救命之恩！小女子林婉儿，乃是洛阳林家之人。家父嘱咐我前往清风镇投奔亲友，不想路遇此劫。少侠若不嫌弃，可愿与我同行？',
    choices: [
      { id: 'c1-c2a1', text: '姑娘客气了，在下护送你便是', nextNodeId: 'c1-n4a1' },
      { id: 'c1-c2a2', text: '举手之劳，何足挂齿，姑娘自行保重', nextNodeId: 'c1-n4a2' },
      { id: 'c1-c2a3', text: '看姑娘衣着华贵，莫非有什么值钱之物？', nextNodeId: 'c1-n4a3' }
    ]
  },
  'c1-n3b': {
    id: 'c1-n3b',
    chapter: 1,
    speaker: '年轻姑娘',
    dialogue: '少侠好功夫！若不是你出手，小女子今日恐怕……不知少侠高姓大名？',
    choices: [
      { id: 'c1-c2b1', text: '区区贱名，不足挂齿。姑娘要往何处去？', nextNodeId: 'c1-n4b1' },
      { id: 'c1-c2b2', text: '我叫无名，姑娘请便', nextNodeId: 'c1-n4b2' },
      { id: 'c1-c2b3', text: '（沉默不语，转身欲走）', nextNodeId: 'c1-n4b3' }
    ]
  },
  'c1-n3c': {
    id: 'c1-n3c',
    chapter: 1,
    speaker: '旁白',
    dialogue: '你击退山贼，但那姑娘早已趁乱逃去。你摇了摇头，继续赶路。前方不远处便是清风镇。',
    nextNodeId: 'c1-n4c'
  },
  'c1-n4a1': {
    id: 'c1-n4a1',
    chapter: 1,
    speaker: '林婉儿',
    dialogue: '少侠真是宅心仁厚。实不相瞒，小女子此番出行，乃是因为家中遭遇大变，父亲被魔教之人所害……',
    nextNodeId: 'c1-n5a'
  },
  'c1-n4a2': {
    id: 'c1-n4a2',
    chapter: 1,
    speaker: '林婉儿',
    dialogue: '少侠真乃高人也。这是一点薄礼，还望收下。（她塞给你一包银子）',
    nextNodeId: 'c1-n5b'
  },
  'c1-n4a3': {
    id: 'c1-n4a3',
    chapter: 1,
    speaker: '林婉儿',
    dialogue: '你……你这人怎么如此无礼！亏我还当你是好人！（她气冲冲地转身离去）',
    nextNodeId: 'c1-n5c'
  },
  'c1-n4b1': {
    id: 'c1-n4b1',
    chapter: 1,
    speaker: '林婉儿',
    dialogue: '小女子要往清风镇去。听说那里近来有魔教出没，少侠若有空闲，可愿同行？也好有个照应。',
    nextNodeId: 'c1-n5a'
  },
  'c1-n4b2': {
    id: 'c1-n4b2',
    chapter: 1,
    speaker: '林婉儿',
    dialogue: '无名少侠……好奇怪的名字。也罢，小女子先告辞了。',
    nextNodeId: 'c1-n5b'
  },
  'c1-n4b3': {
    id: 'c1-n4b3',
    chapter: 1,
    speaker: '林婉儿',
    dialogue: '哎，少侠请留步……（你头也不回地走远了）',
    nextNodeId: 'c1-n5c'
  },
  'c1-n4c': {
    id: 'c1-n4c',
    chapter: 1,
    speaker: '旁白',
    dialogue: '你行至清风镇外，忽遇一人挡路。此人面露凶光，浑身散发着阴寒之气。',
    choices: [
      { id: 'c1-c3c1', text: '在下路过此处，敢问阁下有何见教？', nextNodeId: 'c1-n5a' },
      { id: 'c1-c3c2', text: '（不答话，暗自戒备）', nextNodeId: 'c1-n5b' },
      { id: 'c1-c3c3', text: '让开！否则别怪我不客气！', nextNodeId: 'c1-n5c' }
    ]
  },
  'c1-n5a': {
    id: 'c1-n5a',
    chapter: 1,
    speaker: '黑风客',
    dialogue: '嘿嘿，天堂有路你不走，地狱无门你偏来。小子，把身上值钱的东西都交出来，或许爷爷可以留你个全尸！',
    nextBattleId: 'hei-feng-ke',
    nextNodeId: 'c1-n6a'
  },
  'c1-n5b': {
    id: 'c1-n5b',
    chapter: 1,
    speaker: '毒门弟子',
    dialogue: '哦？倒是有点意思。小子，听说你身手不错，可敢接我三招？',
    nextBattleId: 'du-men-di-zi',
    nextNodeId: 'c1-n6b'
  },
  'c1-n5c': {
    id: 'c1-n5c',
    chapter: 1,
    speaker: '铁布衫武夫',
    dialogue: '好狂的小子！让爷爷我来教训教训你！',
    nextBattleId: 'tie-bu-shan',
    nextNodeId: 'c1-n6c'
  },
  'c1-n6a': {
    id: 'c1-n6a',
    chapter: 1,
    speaker: '旁白',
    dialogue: '你击退了黑风客。林婉儿对你更是感激不尽，言道清风镇上有位正道高手正在招募帮手，对抗魔教。',
    nextNodeId: 'c1-branch1'
  },
  'c1-n6b': {
    id: 'c1-n6b',
    chapter: 1,
    speaker: '旁白',
    dialogue: '你击退了毒门弟子。此人临走前阴恻恻地笑道："好小子，咱们后会有期！"',
    nextNodeId: 'c1-branch2'
  },
  'c1-n6c': {
    id: 'c1-n6c',
    chapter: 1,
    speaker: '旁白',
    dialogue: '你击败了那武夫。不远处，一位神秘黑衣人默默注视着这一切，随即悄然离去。',
    nextNodeId: 'c1-branch3'
  },
  'c1-branch1': {
    id: 'c1-branch1',
    chapter: 1,
    speaker: '旁白',
    dialogue: '第一章 · 初入江湖 已完结。你的选择决定了江湖之路的走向——正道坦途。',
    nextNodeId: 'c2-start-1'
  },
  'c1-branch2': {
    id: 'c1-branch2',
    chapter: 1,
    speaker: '旁白',
    dialogue: '第一章 · 初入江湖 已完结。你的选择决定了江湖之路的走向——亦正亦邪。',
    nextNodeId: 'c2-start-2'
  },
  'c1-branch3': {
    id: 'c1-branch3',
    chapter: 1,
    speaker: '旁白',
    dialogue: '第一章 · 初入江湖 已完结。你的选择决定了江湖之路的走向——魔道暗流。',
    nextNodeId: 'c2-start-3'
  },

  'c2-start-1': {
    id: 'c2-start-1',
    chapter: 2,
    speaker: '旁白',
    dialogue: '第二章 · 风云际会。你跟随林婉儿来到清风镇，只见镇上一位白袍剑客正在召集各路豪杰，商议讨伐魔教之事。',
    nextNodeId: 'c2-1-n1'
  },
  'c2-start-2': {
    id: 'c2-start-2',
    chapter: 2,
    speaker: '旁白',
    dialogue: '第二章 · 风云际会。你独自来到清风镇，这里正邪两派势力交错，暗流涌动。一位神秘人暗中约你在镇外破庙相见。',
    nextNodeId: 'c2-2-n1'
  },
  'c2-start-3': {
    id: 'c2-start-3',
    chapter: 2,
    speaker: '旁白',
    dialogue: '第二章 · 风云际会。你独自来到清风镇，那黑衣人尾随之后来见你，言道魔教教主赏识你的身手，欲邀你入教。',
    nextNodeId: 'c2-3-n1'
  },

  'c2-1-n1': {
    id: 'c2-1-n1',
    chapter: 2,
    speaker: '白袍剑客',
    dialogue: '在下剑无极，乃正道盟主座下弟子。近日魔教蠢蠢欲动，欲对各大门派不利。少侠武艺高强，可愿与我等并肩作战？',
    choices: [
      { id: 'c2-1-c1a', text: '晚辈愿效犬马之劳，斩妖除魔！', nextNodeId: 'c2-1-n2a' },
      { id: 'c2-1-c1b', text: '此事干系重大，容我考虑考虑', nextNodeId: 'c2-1-n2b' },
      { id: 'c2-1-c1c', text: '正道魔教之争，与我何干？', nextNodeId: 'c2-1-n2c' }
    ]
  },
  'c2-1-n2a': {
    id: 'c2-1-n2a',
    chapter: 2,
    speaker: '剑无极',
    dialogue: '好！少侠果然是忠义之士！前方魔教分舵正有几个爪牙为非作歹，就劳烦少侠前去清理。',
    nextBattleId: 'mo-jiao-zhang-lao',
    nextNodeId: 'c2-1-n3a'
  },
  'c2-1-n2b': {
    id: 'c2-1-n2b',
    chapter: 2,
    speaker: '剑无极',
    dialogue: '也好。不过在下有一事相求——镇外有一流浪剑客行迹可疑，少侠可否替我去会会他？',
    nextBattleId: 'jian-ke',
    nextNodeId: 'c2-1-n3b'
  },
  'c2-1-n2c': {
    id: 'c2-1-n2c',
    chapter: 2,
    speaker: '剑无极',
    dialogue: '哼！敬酒不吃吃罚酒！你既不愿相助，休怪我剑下无情！',
    nextBattleId: 'zheng-pai-gao-shou',
    nextNodeId: 'c2-1-n3c'
  },
  'c2-1-n3a': {
    id: 'c2-1-n3a',
    chapter: 2,
    speaker: '剑无极',
    dialogue: '少侠好身手！盟主大人果然没有看错人。眼下有一要事——三日后，盟主将在华山召开英雄大会，请少侠务必到场。',
    choices: [
      { id: 'c2-1-c2a1', text: '晚辈定当赴约！', nextNodeId: 'c2-end-a' },
      { id: 'c2-1-c2a2', text: '英雄大会？怕是暗藏玄机……', nextNodeId: 'c2-end-b' },
      { id: 'c2-1-c2a3', text: '我先去办些私事，再做打算', nextNodeId: 'c2-end-c' }
    ]
  },
  'c2-1-n3b': {
    id: 'c2-1-n3b',
    chapter: 2,
    speaker: '流浪剑客',
    dialogue: '好功夫！好功夫！小兄弟，你是被剑无极那厮派来的吧？实不相瞒，我乃是……（他凑近你耳边低语了几句）',
    choices: [
      { id: 'c2-1-c2b1', text: '原来如此，我明白了！', nextNodeId: 'c2-end-a' },
      { id: 'c2-1-c2b2', text: '你这番话，我凭什么信你？', nextNodeId: 'c2-end-b' },
      { id: 'c2-1-c2b3', text: '我不管你们谁对谁错，别再来烦我', nextNodeId: 'c2-end-c' }
    ]
  },
  'c2-1-n3c': {
    id: 'c2-1-n3c',
    chapter: 2,
    speaker: '旁白',
    dialogue: '你击败了那位正派高手。此事传开，正道视你为眼中钉，而魔教却暗中派人来招揽。',
    choices: [
      { id: 'c2-1-c2c1', text: '哼，正派人等不过如此！', nextNodeId: 'c2-end-a' },
      { id: 'c2-1-c2c2', text: '我只是自卫而已，不想与任何一方为伍', nextNodeId: 'c2-end-b' },
      { id: 'c2-1-c2c3', text: '（沉默不语，转身离开）', nextNodeId: 'c2-end-c' }
    ]
  },

  'c2-2-n1': {
    id: 'c2-2-n1',
    chapter: 2,
    speaker: '神秘人',
    dialogue: '（破庙之中，一个黑影立于梁柱之上）小兄弟，你想不想知道这江湖最大的秘密？',
    choices: [
      { id: 'c2-2-c1a', text: '什么秘密？你到底是谁？', nextNodeId: 'c2-2-n2a' },
      { id: 'c2-2-c1b', text: '我对秘密没兴趣，你找错人了', nextNodeId: 'c2-2-n2b' },
      { id: 'c2-2-c1c', text: '（暗自凝神戒备）', nextNodeId: 'c2-2-n2c' }
    ]
  },
  'c2-2-n2a': {
    id: 'c2-2-n2a',
    chapter: 2,
    speaker: '神秘人',
    dialogue: '嘿嘿，有胆识。那我便告诉你——正道盟主，与魔教教主，乃是一母同胞的亲兄弟！你说，这江湖是不是很好玩？',
    nextBattleId: 'jiang-hu-bai-xiao',
    nextNodeId: 'c2-2-n3a'
  },
  'c2-2-n2b': {
    id: 'c2-2-n2b',
    chapter: 2,
    speaker: '神秘人',
    dialogue: '哦？当真没兴趣？那如果我说，这个秘密关系到你父母的死因呢？',
    nextBattleId: 'gui-ying-shou',
    nextNodeId: 'c2-2-n3b'
  },
  'c2-2-n2c': {
    id: 'c2-2-n2c',
    chapter: 2,
    speaker: '神秘人',
    dialogue: '（黑衣人冷笑一声）小心驶得万年船，倒是个好习惯。不过，你以为凭你这点微末道行，能防得住我？',
    nextBattleId: 'hei-feng-ke',
    nextNodeId: 'c2-2-n3c'
  },
  'c2-2-n3a': {
    id: 'c2-2-n3a',
    chapter: 2,
    speaker: '江湖百晓生',
    dialogue: '（神秘人摘下面罩，竟是江湖百晓生）好小子，果然有两下子。我这话说出去，恐怕没几个人信。但小兄弟你，我信得过。',
    choices: [
      { id: 'c2-2-c2a1', text: '多谢先生告知，晚辈定当查明真相！', nextNodeId: 'c2-end-a' },
      { id: 'c2-2-c2a2', text: '此事太过荒诞，容我核实', nextNodeId: 'c2-end-b' },
      { id: 'c2-2-c2a3', text: '不管真假，这浑水我不蹚', nextNodeId: 'c2-end-c' }
    ]
  },
  'c2-2-n3b': {
    id: 'c2-2-n3b',
    chapter: 2,
    speaker: '鬼影子',
    dialogue: '（那黑衣人惨笑一声）你父母……当年就是因为撞见了不该见的事，才被那兄弟二人联手灭口。我……我是你父亲的旧部！',
    choices: [
      { id: 'c2-2-c2b1', text: '什么！此仇不报，誓不为人！', nextNodeId: 'c2-end-a' },
      { id: 'c2-2-c2b2', text: '空口无凭，我如何信你？', nextNodeId: 'c2-end-b' },
      { id: 'c2-2-c2b3', text: '我不想再听这些谎言！', nextNodeId: 'c2-end-c' }
    ]
  },
  'c2-2-n3c': {
    id: 'c2-2-n3c',
    chapter: 2,
    speaker: '神秘人',
    dialogue: '好！好身手！看来我没看错人。小兄弟，这江湖之中，正邪之分本就虚妄。你若想走自己的路，三日后华山之巅，必有一场好戏。',
    choices: [
      { id: 'c2-2-c2c1', text: '华山之巅？我倒要去看看！', nextNodeId: 'c2-end-a' },
      { id: 'c2-2-c2c2', text: '你的好意我心领了，但我有自己的打算', nextNodeId: 'c2-end-b' },
      { id: 'c2-2-c2c3', text: '（不置可否，转身离去）', nextNodeId: 'c2-end-c' }
    ]
  },

  'c2-3-n1': {
    id: 'c2-3-n1',
    chapter: 2,
    speaker: '黑衣使者',
    dialogue: '少侠，我家教主说了，你是难得一见的武学奇才。若肯入我魔教，荣华富贵、绝世武功，应有尽有。不知少侠意下如何？',
    choices: [
      { id: 'c2-3-c1a', text: '好！我入魔教！', nextNodeId: 'c2-3-n2a' },
      { id: 'c2-3-c1b', text: '此事……容我三思', nextNodeId: 'c2-3-n2b' },
      { id: 'c2-3-c1c', text: '魔教？哼，一群乌合之众！', nextNodeId: 'c2-3-n2c' }
    ]
  },
  'c2-3-n2a': {
    id: 'c2-3-n2a',
    chapter: 2,
    speaker: '黑衣使者',
    dialogue: '很好！识时务者为俊杰。不过入我魔教，需先立下投名状——镇外正道据点，你去替我平了。',
    nextBattleId: 'zheng-pai-gao-shou',
    nextNodeId: 'c2-3-n3a'
  },
  'c2-3-n2b': {
    id: 'c2-3-n2b',
    chapter: 2,
    speaker: '黑衣使者',
    dialogue: '犹豫？哼，你可知多少人求都求不来这个机会？也罢，我给你个考验——杀了这个叛徒，我便信你。',
    nextBattleId: 'mo-jiao-zhang-lao',
    nextNodeId: 'c2-3-n3b'
  },
  'c2-3-n2c': {
    id: 'c2-3-n2c',
    chapter: 2,
    speaker: '黑衣使者',
    dialogue: '好个不知好歹的小子！既然敬酒不吃，那就别怪我不客气了！',
    nextBattleId: 'mo-jiao-zhang-lao',
    nextNodeId: 'c2-3-n3c'
  },
  'c2-3-n3a': {
    id: 'c2-3-n3a',
    chapter: 2,
    speaker: '黑衣使者',
    dialogue: '干得漂亮！从今日起，你便是我魔教副使。三日后，随我一同上华山，办一件惊天动地的大事！',
    choices: [
      { id: 'c2-3-c2a1', text: '属下遵命！', nextNodeId: 'c2-end-a' },
      { id: 'c2-3-c2a2', text: '华山？那是什么地方？', nextNodeId: 'c2-end-b' },
      { id: 'c2-3-c2a3', text: '我突然觉得，入教之事还是算了……', nextNodeId: 'c2-end-c' }
    ]
  },
  'c2-3-n3b': {
    id: 'c2-3-n3b',
    chapter: 2,
    speaker: '黑衣使者',
    dialogue: '嗯，下手够狠，是个可造之材。小子，我实话跟你说——教中有人不服教主，你若跟着我好好干，将来……',
    choices: [
      { id: 'c2-3-c2b1', text: '属下唯大人马首是瞻！', nextNodeId: 'c2-end-a' },
      { id: 'c2-3-c2b2', text: '你们内部的事，我不想掺和', nextNodeId: 'c2-end-b' },
      { id: 'c2-3-c2b3', text: '我先走一步，改日再议', nextNodeId: 'c2-end-c' }
    ]
  },
  'c2-3-n3c': {
    id: 'c2-3-n3c',
    chapter: 2,
    speaker: '旁白',
    dialogue: '你击败了魔教使者。此人逃走前留下狠话："小子，你得罪了圣教，天下虽大，恐无你容身之地！"',
    choices: [
      { id: 'c2-3-c2c1', text: '来者不拒，我等着！', nextNodeId: 'c2-end-a' },
      { id: 'c2-3-c2c2', text: '（叹息）这下麻烦大了……', nextNodeId: 'c2-end-b' },
      { id: 'c2-3-c2c3', text: '此地不宜久留，我得赶紧走', nextNodeId: 'c2-end-c' }
    ]
  },

  'c2-end-a': {
    id: 'c2-end-a',
    chapter: 2,
    speaker: '旁白',
    dialogue: '第二章 · 风云际会 已完结。你选择了坚定前行，三日后的华山之巅，等待你的将是什么？',
    nextNodeId: 'c3-start-a'
  },
  'c2-end-b': {
    id: 'c2-end-b',
    chapter: 2,
    speaker: '旁白',
    dialogue: '第二章 · 风云际会 已完结。你选择了静观其变，三日后的华山之巅，谜底终将揭晓。',
    nextNodeId: 'c3-start-b'
  },
  'c2-end-c': {
    id: 'c2-end-c',
    chapter: 2,
    speaker: '旁白',
    dialogue: '第二章 · 风云际会 已完结。你选择了独善其身，但江湖风云，又岂是你想避开就能避开的？',
    nextNodeId: 'c3-start-c'
  },

  'c3-start-a': {
    id: 'c3-start-a',
    chapter: 3,
    speaker: '旁白',
    dialogue: '第三章 · 华山论剑。你如约来到华山之巅，只见正邪两派高手云集，气氛凝重如山雨欲来。',
    nextNodeId: 'c3-a-n1'
  },
  'c3-start-b': {
    id: 'c3-start-b',
    chapter: 3,
    speaker: '旁白',
    dialogue: '第三章 · 华山论剑。你悄然来到华山脚下，遥望着山顶的刀光剑影。你知道，今日之后，江湖将彻底改变。',
    nextNodeId: 'c3-b-n1'
  },
  'c3-start-c': {
    id: 'c3-start-c',
    chapter: 3,
    speaker: '旁白',
    dialogue: '第三章 · 华山论剑。你本欲远离这场纷争，但在山脚下遇到了重伤的林婉儿。她用尽最后的力气告诉你一个惊天秘密。',
    nextNodeId: 'c3-c-n1'
  },

  'c3-a-n1': {
    id: 'c3-a-n1',
    chapter: 3,
    speaker: '正道盟主',
    dialogue: '诸位英雄！魔教妖人祸乱江湖，今日我正道各派齐聚华山，誓要将魔教一网打尽！诸位，随我杀！',
    choices: [
      { id: 'c3-a-c1a', text: '斩妖除魔，在此一举！杀！', nextNodeId: 'c3-a-n2a' },
      { id: 'c3-a-c1b', text: '等等！此事恐怕另有隐情！', nextNodeId: 'c3-a-n2b' },
      { id: 'c3-a-c1c', text: '（冷眼旁观，按兵不动）', nextNodeId: 'c3-a-n2c' }
    ]
  },
  'c3-a-n2a': {
    id: 'c3-a-n2a',
    chapter: 3,
    speaker: '魔教教主',
    dialogue: '哈哈哈哈！正道？一群伪君子罢了！小子，你敢挡我的路？那就纳命来！',
    nextBattleId: 'mo-jiao-jiao-zhu',
    nextNodeId: 'c3-a-n3a'
  },
  'c3-a-n2b': {
    id: 'c3-a-n2b',
    chapter: 3,
    speaker: '正道盟主',
    dialogue: '你说什么？胡言乱语！我看你就是魔教的奸细！来人，给我拿下！',
    nextBattleId: 'zheng-pai-meng-zhu',
    nextNodeId: 'c3-a-n3b'
  },
  'c3-a-n2c': {
    id: 'c3-a-n2c',
    chapter: 3,
    speaker: '魔教教主',
    dialogue: '哦？倒是个有意思的小子。怎么，你觉得哪边会赢？不如来我教中，共谋大事如何？',
    nextBattleId: 'yin-xiong-xia',
    nextNodeId: 'c3-a-n3c'
  },
  'c3-a-n3a': {
    id: 'c3-a-n3a',
    chapter: 3,
    speaker: '旁白',
    dialogue: '你与魔教教主战得天昏地暗，最终一剑将其击败。正道群雄欢声雷动。',
    choices: [
      { id: 'c3-a-c2a1', text: '魔教已灭，从此江湖太平！', nextNodeId: 'ending-a' },
      { id: 'c3-a-c2a2', text: '大仇得报，我也该退隐了……', nextNodeId: 'ending-b' },
      { id: 'c3-a-c2a3', text: '（望着盟主的背影，若有所思……）', nextNodeId: 'ending-c' }
    ]
  },
  'c3-a-n3b': {
    id: 'c3-a-n3b',
    chapter: 3,
    speaker: '旁白',
    dialogue: '激战之中，盟主袖口滑落，露出与魔教教主一模一样的胎记。群雄哗然。',
    choices: [
      { id: 'c3-a-c2b1', text: '原来如此！你这欺世盗名之辈！', nextNodeId: 'ending-a' },
      { id: 'c3-a-c2b2', text: '（长叹一声）这江湖……真是可笑。', nextNodeId: 'ending-b' },
      { id: 'c3-a-c2b3', text: '此事……不如就让它石沉大海吧。', nextNodeId: 'ending-c' }
    ]
  },
  'c3-a-n3c': {
    id: 'c3-a-n3c',
    chapter: 3,
    speaker: '隐世奇侠',
    dialogue: '好小子！好身手！老夫隐居多年，今日终于见着一个像样的年轻人。这天下……以后就看你的了。',
    choices: [
      { id: 'c3-a-c2c1', text: '前辈过奖，晚辈定当不负所托！', nextNodeId: 'ending-a' },
      { id: 'c3-a-c2c2', text: '前辈，这江湖太累，我只想做个普通人……', nextNodeId: 'ending-b' },
      { id: 'c3-a-c2c3', text: '（望着远方，久久无言）', nextNodeId: 'ending-c' }
    ]
  },

  'c3-b-n1': {
    id: 'c3-b-n1',
    chapter: 3,
    speaker: '旁白',
    dialogue: '山脚下，你遇到一位白须老者，他正是多年前销声匿迹的隐世奇侠。',
    choices: [
      { id: 'c3-b-c1a', text: '晚辈见过前辈！', nextNodeId: 'c3-b-n2a' },
      { id: 'c3-b-c1b', text: '（远远打量，不主动搭话）', nextNodeId: 'c3-b-n2b' },
      { id: 'c3-b-c1c', text: '你是谁？为何在此？', nextNodeId: 'c3-b-n2c' }
    ]
  },
  'c3-b-n2a': {
    id: 'c3-b-n2a',
    chapter: 3,
    speaker: '隐世奇侠',
    dialogue: '好！好！小子，老夫看你根骨奇佳，这世上最后一本绝世武功秘籍，便传给你吧！但你要先接我三招。',
    nextBattleId: 'yin-xiong-xia',
    nextNodeId: 'c3-b-n3a'
  },
  'c3-b-n2b': {
    id: 'c3-b-n2b',
    chapter: 3,
    speaker: '隐世奇侠',
    dialogue: '（老者哈哈大笑）有意思，有意思！小子，你不觉得上面那群人打得很无聊吗？不如你我来比划比划？',
    nextBattleId: 'yin-xiong-xia',
    nextNodeId: 'c3-b-n3b'
  },
  'c3-b-n2c': {
    id: 'c3-b-n2c',
    chapter: 3,
    speaker: '隐世奇侠',
    dialogue: '我是谁？我是这江湖最后的明白人。小子，你若能赢我，我便告诉你一切真相。',
    nextBattleId: 'yin-xiong-xia',
    nextNodeId: 'c3-b-n3c'
  },
  'c3-b-n3a': {
    id: 'c3-b-n3a',
    chapter: 3,
    speaker: '隐世奇侠',
    dialogue: '好小子！果然没让我失望！这秘籍你拿去，这天下……就交给你了！（老者化作一道青烟，消散于天地之间）',
    choices: [
      { id: 'c3-b-c2a1', text: '前辈走好！晚辈定当拯救苍生！', nextNodeId: 'ending-a' },
      { id: 'c3-b-c2a2', text: '绝世武功？倒不如归隐山林来得自在……', nextNodeId: 'ending-b' },
      { id: 'c3-b-c2a3', text: '（手捧秘籍，陷入沉思）', nextNodeId: 'ending-c' }
    ]
  },
  'c3-b-n3b': {
    id: 'c3-b-n3b',
    chapter: 3,
    speaker: '隐世奇侠',
    dialogue: '痛快！痛快！多少年没打得这么开心了！小子，你比山上那帮人强多了。怎么样，要不要跟我云游四海去？',
    choices: [
      { id: 'c3-b-c2b1', text: '不了，这江湖的事，我得去做个了断。', nextNodeId: 'ending-a' },
      { id: 'c3-b-c2b2', text: '前辈愿带挈，晚辈求之不得！', nextNodeId: 'ending-b' },
      { id: 'c3-b-c2b3', text: '（沉默良久，摇头苦笑）', nextNodeId: 'ending-c' }
    ]
  },
  'c3-b-n3c': {
    id: 'c3-b-n3c',
    chapter: 3,
    speaker: '隐世奇侠',
    dialogue: '真相？真相就是——这正邪之争，从头到尾都是一场骗局。那兄弟二人，不过是为了引出你这样的绝世高手罢了。',
    choices: [
      { id: 'c3-b-c2c1', text: '我这就上山，揭穿他们的阴谋！', nextNodeId: 'ending-a' },
      { id: 'c3-b-c2c2', text: '既然如此，我又何必趟这浑水？', nextNodeId: 'ending-b' },
      { id: 'c3-b-c2c3', text: '（抬头望着华山顶，久久无语）', nextNodeId: 'ending-c' }
    ]
  },

  'c3-c-n1': {
    id: 'c3-c-n1',
    chapter: 3,
    speaker: '林婉儿',
    dialogue: '（奄奄一息）少侠……魔教教主和正道盟主……他们……他们都想得到那本上古秘籍……你父母……就是被他们……（她闭上了双眼）',
    choices: [
      { id: 'c3-c-c1a', text: '婉儿！我会为你报仇的！！', nextNodeId: 'c3-c-n2a' },
      { id: 'c3-c-c1b', text: '（咬牙，将她安葬后，向华山而去）', nextNodeId: 'c3-c-n2b' },
      { id: 'c3-c-c1c', text: '（仰天大笑）好一个江湖！好一个正邪！', nextNodeId: 'c3-c-n2c' }
    ]
  },
  'c3-c-n2a': {
    id: 'c3-c-n2a',
    chapter: 3,
    speaker: '旁白',
    dialogue: '你怒火中烧，提剑冲上华山。正邪两派之人正打得不可开交，无人注意到你的到来。',
    nextBattleId: 'mo-jiao-jiao-zhu',
    nextNodeId: 'c3-c-n3a'
  },
  'c3-c-n2b': {
    id: 'c3-c-n2b',
    chapter: 3,
    speaker: '旁白',
    dialogue: '你埋葬了林婉儿，一步步走向华山。你的脚步很慢，却很稳。每一步，都带着一份决心。',
    nextBattleId: 'zheng-pai-meng-zhu',
    nextNodeId: 'c3-c-n3b'
  },
  'c3-c-n2c': {
    id: 'c3-c-n2c',
    chapter: 3,
    speaker: '旁白',
    dialogue: '你疯笑着抽出兵器，目光扫过这满目疮痍的江湖。今日，你要让整个武林为你的怒火陪葬。',
    nextBattleId: 'yin-xiong-xia',
    nextNodeId: 'c3-c-n3c'
  },
  'c3-c-n3a': {
    id: 'c3-c-n3a',
    chapter: 3,
    speaker: '旁白',
    dialogue: '你血战到底，终将魔教教主斩于剑下。而正道盟主在乱军中不知所踪。从此，你被武林中人称为"剑魔"。',
    choices: [
      { id: 'c3-c-c2a1', text: '（提剑而立）下一个是谁？', nextNodeId: 'ending-a' },
      { id: 'c3-c-c2a2', text: '（放下长剑）婉儿，我为你报仇了……', nextNodeId: 'ending-b' },
      { id: 'c3-c-c2a3', text: '（转身离去，再不回头）', nextNodeId: 'ending-c' }
    ]
  },
  'c3-c-n3b': {
    id: 'c3-c-n3b',
    chapter: 3,
    speaker: '旁白',
    dialogue: '你与盟主决战华山之巅。那一战，日月无光。最后，二人同归于尽，后世只留下无尽传说。',
    choices: [
      { id: 'c3-c-c2b1', text: '（二人倒下，天空飘落飞雪）', nextNodeId: 'ending-a' },
      { id: 'c3-c-c2b2', text: '（弥留之际，你仿佛看见了婉儿的笑容）', nextNodeId: 'ending-b' },
      { id: 'c3-c-c2b3', text: '（一切归于寂静）', nextNodeId: 'ending-c' }
    ]
  },
  'c3-c-n3c': {
    id: 'c3-c-n3c',
    chapter: 3,
    speaker: '旁白',
    dialogue: '你击败了那位神秘的隐世奇侠，从此武功天下第一。但你心中的那团火，却再也没有熄灭过。',
    choices: [
      { id: 'c3-c-c2c1', text: '从此，我就是魔！', nextNodeId: 'ending-a' },
      { id: 'c3-c-c2c2', text: '（望着怀中婉儿的遗物，泪流满面）', nextNodeId: 'ending-b' },
      { id: 'c3-c-c2c3', text: '（你闭上眼，似在等待什么）', nextNodeId: 'ending-c' }
    ]
  },

  'ending-a': {
    id: 'ending-a',
    chapter: 3,
    speaker: '旁白',
    dialogue: '（全剧终 · 结局一）',
    isEnding: true,
    endingId: 'ending-first'
  },
  'ending-b': {
    id: 'ending-b',
    chapter: 3,
    speaker: '旁白',
    dialogue: '（全剧终 · 结局二）',
    isEnding: true,
    endingId: 'ending-second'
  },
  'ending-c': {
    id: 'ending-c',
    chapter: 3,
    speaker: '旁白',
    dialogue: '（全剧终 · 结局三）',
    isEnding: true,
    endingId: 'ending-third'
  }
}

export function getStoryNode(id: string): StoryNode | undefined {
  return STORY_NODES[id]
}

export const INITIAL_STORY_NODE = 'start'
