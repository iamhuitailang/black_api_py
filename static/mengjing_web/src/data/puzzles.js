export const puzzles = {
  patient_005: [
    {
      id: 'm5_puzzle_puzzle',
      title: '散落的拼图',
      description: '拼图碎片散落在地，每一块都承载着一段记忆。',
      type: 'gather',
      hint: '记忆不会真正消失，只是暂时被遗忘...',
      solution: 'collect',
      choices: [
        { id: 'a', text: '让它们散落吧', result: 'abandon', effect: { fear: 5, trust: -5 } },
        { id: 'b', text: '把拼图一块一块捡起来', result: 'collect', effect: { fear: -5, trust: 10 }, unlocks: null }
      ],
      solvedMessage: '你捡起了第一块拼图，上面是一个年轻女孩的微笑。记忆开始苏醒。'
    },
    {
      id: 'm5_puzzle_radio',
      title: '老式收音机',
      description: '收音机在播放他们的定情曲。他记不清这首歌的名字了。',
      type: 'recall',
      hint: '有些旋律会永远留在心底...',
      solution: 'remember',
      choices: [
        { id: 'a', text: '关掉收音机', result: 'avoid', effect: { fear: 10, trust: -10 } },
        { id: 'b', text: '跟着旋律轻轻哼', result: 'remember', effect: { fear: -10, trust: 15 }, unlocks: 'wedding_day' }
      ],
      solvedMessage: '他想起来了——《月亮代表我的心》。那年在弄堂口，他就是用这首歌向她表白的。'
    },
    {
      id: 'm5_puzzle_book',
      title: '《红楼梦》',
      description: '书里夹着那张改变命运的纸条。他想不起她写了什么回复。',
      type: 'memory',
      hint: '答案就在书页之间...',
      solution: 'find',
      choices: [
        { id: 'a', text: '把纸条扔掉', result: 'lose', effect: { fear: 10, trust: -10 } },
        { id: 'b', text: '翻开书的第23页', result: 'find', effect: { fear: -10, trust: 15 }, unlocks: 'proposal' }
      ],
      solvedMessage: '第23页的空白处，有她清秀的字迹："好呀，我正好也有问题想请教你。"'
    },
    {
      id: 'm5_puzzle_photo',
      title: '结婚照',
      description: '照片上的她笑得很幸福。他努力想记住她此刻的样子。',
      type: 'hold',
      hint: '记住她的样子，她就不会真的离开...',
      solution: 'cherish',
      choices: [
        { id: 'a', text: '把照片收起来，不忍心看', result: 'hide', effect: { fear: 10, trust: -5 } },
        { id: 'b', text: '轻轻抚摸照片上她的脸', result: 'cherish', effect: { fear: -15, trust: 20 }, unlocks: null }
      ],
      solvedMessage: '他轻轻抚摸着照片，泪水模糊了视线。但他记住了她的笑容，刻在了心里。'
    },
    {
      id: 'm5_puzzle_ring',
      title: '银戒指',
      description: '这枚廉价的银戒指，她戴了一辈子。',
      type: 'promise',
      hint: '真正的承诺从来不是用金钱衡量的...',
      solution: 'keep',
      choices: [
        { id: 'a', text: '把戒指收进盒子里', result: 'store', effect: { fear: 5, trust: 5 } },
        { id: 'b', text: '把戒指戴在自己手上', result: 'keep', effect: { fear: -15, trust: 25 }, unlocks: 'hospital' }
      ],
      solvedMessage: '他把戒指戴在左手无名指上——和她戴的位置一样。他们从未真正分开。'
    },
    {
      id: 'm5_puzzle_hand',
      title: '紧握的手',
      description: '她的手已经凉了，但还是紧紧握着他的手。',
      type: 'goodbye',
      hint: '真正的告别，是带着她的爱继续前行...',
      solution: 'let_go',
      choices: [
        { id: 'a', text: '我不会让你走的！', result: 'hold_on', effect: { fear: 20, trust: -15 } },
        { id: 'b', text: '轻轻吻她的手背，说"再见"', result: 'let_go', effect: { fear: -25, trust: 35 }, unlocks: 'final_room' }
      ],
      solvedMessage: '他轻轻吻了吻她的手背，在她耳边说："再见了，我的爱人。我会好好活下去的。" 她的手似乎轻轻握了握他，然后松开了。'
    }
  ],
  patient_004: [
    {
      id: 'm4_puzzle_calculator',
      title: '摔坏的计算器',
      description: '计算器永远显示0.01。这个数字像梦魇一样缠着他。',
      type: 'accept',
      hint: '一分钱，真的那么重要吗？',
      solution: 'transcend',
      choices: [
        { id: 'a', text: '摔碎这个计算器', result: 'destroy', effect: { fear: 5, trust: -5 } },
        { id: 'b', text: '接受这个0.01', result: 'transcend', effect: { fear: -5, trust: 10 }, unlocks: null }
      ],
      solvedMessage: '0.01只是一个数字。比数字更重要的，是数字背后的东西。'
    },
    {
      id: 'm4_puzzle_balance',
      title: '不平衡的报表',
      description: '借贷相差一分钱。为什么配不平？',
      type: 'balance',
      hint: '人生不是报表，不需要完美平衡...',
      solution: 'accept_imperfection',
      choices: [
        { id: 'a', text: '伪造一个数字让它平衡', result: 'fake', effect: { fear: 15, trust: -15 } },
        { id: 'b', text: '保留这一分钱的差异，如实上报', result: 'accept_imperfection', effect: { fear: -10, trust: 20 }, unlocks: 'balance_room' }
      ],
      solvedMessage: '真实的不平衡，胜过虚假的完美。报表可以重算，但诚信只有一次。'
    },
    {
      id: 'm4_puzzle_password',
      title: '七次检查',
      description: '他已经检查了七次密码了。还是想检查第八次。',
      type: 'control',
      hint: '真正的安全感，不是控制一切...',
      solution: 'stop',
      choices: [
        { id: 'a', text: '再检查一次，就一次', result: 'continue', effect: { fear: 10, trust: -10 } },
        { id: 'b', text: '停下来，相信自己', result: 'stop', effect: { fear: -15, trust: 15 }, unlocks: 'mistake_room' }
      ],
      solvedMessage: '他放下了手中的密码本。七次已经足够了。他选择相信自己。'
    },
    {
      id: 'm4_puzzle_scale',
      title: '精密天平',
      description: '左边是一分钱，右边是他的职业生涯。天平在剧烈摇摆。',
      type: 'values',
      hint: '有些东西，无法用数字衡量...',
      solution: 'choose_human',
      choices: [
        { id: 'a', text: '职业生涯更重要', result: 'choose_career', effect: { fear: 15, trust: -10 } },
        { id: 'b', text: '把女儿的画放到天平上', result: 'choose_human', effect: { fear: -20, trust: 25 }, unlocks: null }
      ],
      solvedMessage: '他把女儿的画放到了天平上。天平瞬间平衡了。原来，他一直忽略了生命中最重要的东西。'
    },
    {
      id: 'm4_puzzle_choice',
      title: '那一页报告',
      description: '那0.01元的错误就在眼前。是掩盖还是坦白？',
      type: 'truth',
      hint: '真正的强大，是有勇气面对自己的错误...',
      solution: 'confess',
      choices: [
        { id: 'a', text: '悄悄改掉那个数字', result: 'hide', effect: { fear: 25, trust: -25 } },
        { id: 'b', text: '签下自己的名字，如实上报', result: 'confess', effect: { fear: -30, trust: 40 }, unlocks: 'final_choice' }
      ],
      solvedMessage: '他签下了自己的名字。不管结果如何，他终于可以睡一个安稳觉了。因为他选择了诚实。'
    }
  ],
  patient_003: [
    {
      id: 'm3_puzzle_clock',
      title: '摇摆的时钟',
      description: '钟面上的两个名字在争抢同一个位置。这意味着什么？',
      type: 'symbol',
      hint: '时间不会为任何人停下...',
      solution: 'merge',
      choices: [
        { id: 'a', text: '把指针停在白天', result: 'day', effect: { fear: 5, trust: -5 } },
        { id: 'b', text: '让钟摆自己停下', result: 'merge', effect: { fear: -5, trust: 10 }, unlocks: null }
      ],
      solvedMessage: '钟摆停在了白天与黑夜的交界处。也许...不需要选择。'
    },
    {
      id: 'm3_puzzle_diary',
      title: '上锁的日记',
      description: '粉色的封面，黑色的钥匙。两个世界在同一本日记里相遇。',
      type: 'unlock',
      hint: '每个锁都有它存在的理由...',
      solution: 'read_both',
      choices: [
        { id: 'a', text: '只看粉色的那些页', result: 'only_day', effect: { fear: 5, trust: -5 } },
        { id: 'b', text: '用黑色钥匙打开全部', result: 'read_both', effect: { fear: -10, trust: 15 }, unlocks: 'rooftop' }
      ],
      solvedMessage: '日记里写着两个不同的人生——同一个人的。'
    },
    {
      id: 'm3_puzzle_microphone',
      title: '闪亮的麦克风',
      description: '麦克风上挂着的学生证，和舞台上的女孩是同一个人吗？',
      type: 'identity',
      hint: '面具戴久了，会忘记自己真正的样子...',
      solution: 'recognize_both',
      choices: [
        { id: 'a', text: '告诉她："你不是夜星"', result: 'deny', effect: { fear: 10, trust: -10 } },
        { id: 'b', text: '对她说："唱得很好，晚星"', result: 'recognize_both', effect: { fear: -15, trust: 20 }, unlocks: 'alley' }
      ],
      solvedMessage: '舞台上的女孩愣住了，然后露出了一个真正的笑容。'
    },
    {
      id: 'm3_puzzle_papers',
      title: '试卷与歌词',
      description: '满分试卷下面压着揉碎的歌词草稿。哪一个才是真实的她？',
      type: 'acceptance',
      hint: '人不是非黑即白的...',
      solution: 'accept_both',
      choices: [
        { id: 'a', text: '把歌词草稿扔掉', result: 'suppress', effect: { fear: 15, trust: -10 } },
        { id: 'b', text: '把试卷和歌词叠在一起', result: 'accept_both', effect: { fear: -15, trust: 20 }, unlocks: null }
      ],
      solvedMessage: '她可以是年级第一，也可以是地下歌手。这并不矛盾。'
    },
    {
      id: 'm3_puzzle_guitar',
      title: '白色吉他',
      description: '吉他上写着两个名字，一黑一粉，互相覆盖又重叠。',
      type: 'reconciliation',
      hint: '名字只是标签...',
      solution: 'erase',
      choices: [
        { id: 'a', text: '把"晚星"擦掉', result: 'erase_day', effect: { fear: 10, trust: -5 } },
        { id: 'b', text: '在中间写下"苏晚星"三个字', result: 'erase', effect: { fear: -20, trust: 25 }, unlocks: null }
      ],
      solvedMessage: '吉他上多了一行字："苏晚星，喜欢学习，也喜欢唱歌。"'
    },
    {
      id: 'm3_puzzle_letter',
      title: '撕碎的信件',
      description: '"我好累...我不想再演了..." 她在向谁求救？',
      type: 'comfort',
      hint: '脆弱的时候需要的不是建议，是陪伴...',
      solution: 'listen',
      choices: [
        { id: 'a', text: '告诉她要坚强', result: 'advice', effect: { fear: 15, trust: -15 } },
        { id: 'b', text: '坐下来，听她把话说完', result: 'listen', effect: { fear: -25, trust: 30 }, unlocks: null }
      ],
      solvedMessage: '你坐到她身边，她靠在你肩上，哭了很久很久。这是她第一次允许自己脆弱。'
    },
    {
      id: 'm3_puzzle_mirror',
      title: '镜中的两个她',
      description: '两面镜子里映出两个截然不同的女孩。她们在对视，在对抗，也在渴望。',
      type: 'integration',
      hint: '她们不是敌人，她们从未分开过...',
      solution: 'unite',
      choices: [
        { id: 'a', text: '打碎其中一面镜子', result: 'destroy', effect: { fear: 25, trust: -20 } },
        { id: 'b', text: '让两个女孩握手', result: 'unite', effect: { fear: -30, trust: 40 }, unlocks: 'final_choice' }
      ],
      solvedMessage: '镜中的两个女孩伸出手，触碰的瞬间，镜子碎裂了。一个全新的她站在你面前——既不是晚星，也不是夜星，她只是苏晚星。'
    }
  ],
  patient_001: [
    {
      id: 'puzzle_umbrella',
      title: '残破的雨伞',
      description: '这把伞为什么会断？试着理解它的含义。',
      type: 'symbol',
      hint: '它曾试图抵挡命运的洪流...',
      solution: 'acceptance',
      choices: [
        { id: 'a', text: '修好坏掉的伞骨', result: 'denial', effect: { fear: 5, trust: -5 } },
        { id: 'b', text: '放下雨伞，接受雨水', result: 'acceptance', effect: { fear: -5, trust: 10 }, unlocks: null }
      ],
      solvedMessage: '你明白了：有些事情是无法抵挡的，接受才是治愈的开始。'
    },
    {
      id: 'puzzle_roses',
      title: '枯萎的誓言',
      description: '这些白玫瑰被摆成心形，却已经枯萎。它们在诉说什么？',
      type: 'arrangement',
      hint: '爱不会因为凋零而消失...',
      solution: 'rearrange',
      choices: [
        { id: 'a', text: '把枯萎的玫瑰扔掉', result: 'avoid', effect: { fear: 10, trust: -10 } },
        { id: 'b', text: '将玫瑰重新排列成新的形状', result: 'rearrange', effect: { fear: -10, trust: 15 }, unlocks: 'greenhouse' }
      ],
      solvedMessage: '你重新排列了玫瑰，它们变成了凤凰的形状。逝去的爱可以重生。'
    },
    {
      id: 'puzzle_piano',
      title: '沉默的琴键',
      description: '钢琴上有一个手印，是谁的？试着弹奏。',
      type: 'sequence',
      hint: '按照记忆的顺序弹奏...',
      solution: 'play',
      sequence: ['C', 'E', 'G', 'B', 'C'],
      choices: [
        { id: 'a', text: '弹奏《婚礼进行曲》', result: 'pain', effect: { fear: 15, trust: -5 } },
        { id: 'b', text: '弹奏《月光奏鸣曲》', result: 'play', effect: { fear: -15, trust: 20 }, unlocks: 'backstage' }
      ],
      solvedMessage: '熟悉的旋律响起，空气中似乎出现了他的幻影，在对你微笑。'
    },
    {
      id: 'puzzle_rose_bloom',
      title: '最后的玫瑰',
      description: '这是唯一一朵还活着的玫瑰，它在等待什么？',
      type: 'choice',
      hint: '玫瑰需要的不是雨水，是...',
      solution: 'confession',
      choices: [
        { id: 'a', text: '给玫瑰浇水', result: 'water', effect: { fear: -5, trust: 5 } },
        { id: 'b', text: '对玫瑰说出心里话', result: 'confession', effect: { fear: -20, trust: 25 }, unlocks: null }
      ],
      solvedMessage: '你对着玫瑰说出了藏在心底的话。玫瑰绽放得更加灿烂，它听到了。'
    },
    {
      id: 'puzzle_mirror',
      title: '破碎的倒影',
      description: '镜中的人是谁？为什么不敢面对？',
      type: 'confrontation',
      hint: '面对镜子就是面对自己...',
      solution: 'face',
      choices: [
        { id: 'a', text: '把镜子盖住', result: 'avoid', effect: { fear: 20, trust: -15 } },
        { id: 'b', text: '直视镜中的身影', result: 'face', effect: { fear: -20, trust: 30 }, unlocks: 'accident_scene' }
      ],
      solvedMessage: '镜中的身影逐渐清晰——那是她自己，在痛苦中挣扎的自己。'
    },
    {
      id: 'puzzle_final',
      title: '雨夜的真相',
      description: '一切的答案都在这里...你准备好面对了吗？',
      type: 'acceptance',
      hint: '有些痛苦必须经历才能解脱...',
      solution: 'understand',
      choices: [
        { id: 'a', text: '阻止那场车祸', result: 'denial', effect: { fear: 30, trust: -20 } },
        { id: 'b', text: '理解他的选择', result: 'understand', effect: { fear: -30, trust: 40 }, unlocks: 'ending_choice' }
      ],
      solvedMessage: '原来，他是为了救一个小女孩才...这不是任何人的错。这是他的选择。'
    }
  ],
  patient_002: [
    {
      id: 'puzzle_canvas',
      title: '空白的画布',
      description: '为什么画布是空白的？上面应该画着什么？',
      type: 'reveal',
      hint: '真相藏在表层之下...',
      solution: 'uncover',
      choices: [
        { id: 'a', text: '在画布上作画', result: 'cover', effect: { fear: 5, trust: -5 } },
        { id: 'b', text: '刮去画布表层', result: 'uncover', effect: { fear: -5, trust: 10 }, unlocks: null }
      ],
      solvedMessage: '画布下藏着另一幅画——两个微笑的男人。被掩盖的真相开始浮现。'
    },
    {
      id: 'puzzle_faces',
      title: '模糊的面孔',
      description: '这些脸为什么看不清？是记忆在抗拒什么？',
      type: 'recognition',
      hint: '有些记忆即使模糊，情感依然真实...',
      solution: 'recognize',
      choices: [
        { id: 'a', text: '给画中人画上脸', result: 'invent', effect: { fear: 10, trust: -10 } },
        { id: 'b', text: '感受画中的情感', result: 'recognize', effect: { fear: -15, trust: 20 }, unlocks: 'secret_studio' }
      ],
      solvedMessage: '你感受到了——那是爱、是痛苦、是愧疚。这些面孔的主人，是他深爱过的人。'
    },
    {
      id: 'puzzle_landscape',
      title: '山中小屋',
      description: '画中的小屋在发光，烟囱里冒着的是烟吗？',
      type: 'investigation',
      hint: '美丽的风景下可能藏着黑暗...',
      solution: 'look_deeper',
      choices: [
        { id: 'a', text: '欣赏风景', result: 'superficial', effect: { fear: 5, trust: 0 } },
        { id: 'b', text: '深入画中查看', result: 'look_deeper', effect: { fear: -10, trust: 15 }, unlocks: 'dark_canvas' }
      ],
      solvedMessage: '你"进入"了画中。小屋的地下室里藏着一个可怕的秘密...'
    },
    {
      id: 'puzzle_blood',
      title: '深红颜料',
      description: '这真的是颜料吗？它散发着铁锈的味道...',
      type: 'realization',
      hint: '有些事情一旦知道就无法回头...',
      solution: 'accept_truth',
      choices: [
        { id: 'a', text: '相信这只是颜料', result: 'denial', effect: { fear: 25, trust: -15 } },
        { id: 'b', text: '承认这是什么', result: 'accept_truth', effect: { fear: -25, trust: 30 }, unlocks: 'final_reveal' }
      ],
      solvedMessage: '你明白了——这是他的血。为了留住爱人的灵魂，他用自己的生命作画...'
    }
  ]
}

export const getPuzzlesByPatient = (patientId) => puzzles[patientId] || []
export const getPuzzleById = (patientId, puzzleId) => {
  return puzzles[patientId]?.find(p => p.id === puzzleId) || null
}
