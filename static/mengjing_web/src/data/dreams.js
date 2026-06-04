export const dreams = {
  patient_005: {
    title: '记忆拼图',
    patientId: 'patient_005',
    entrance: {
      description: '你站在一个空荡荡的房间里，拼图碎片散落一地...',
      ambientSound: 'wind_chime',
      color: '#fef3c7'
    },
    rooms: {
      entrance: {
        id: 'entrance',
        name: '拼图大厅',
        description: '巨大的拼图板立在房间中央，上面缺了很多块。',
        phase: 1,
        ambientEffect: 'floating_pieces',
        bgColor: 'rgba(254, 243, 199, 0.4)',
        exits: [
          { to: 'old_house', label: '走进老房子', requires: null },
          { to: 'university', label: '进入大学校园', requires: null }
        ],
        symbols: [
          {
            id: 'symbol_puzzle',
            name: '散落的拼图',
            description: '每一块拼图上都有一张模糊的脸。',
            meaning: '正在消失的记忆',
            interactable: true,
            onInteract: 'm5_puzzle_puzzle'
          }
        ],
        memories: ['m5_memory_1'],
        puzzles: ['m5_puzzle_puzzle']
      },
      old_house: {
        id: 'old_house',
        name: '弄堂里的家',
        description: '狭窄的弄堂，煤球炉的味道，一个年轻女人在门口摘菜。',
        phase: 1,
        ambientEffect: 'old_sounds',
        bgColor: 'rgba(253, 230, 138, 0.4)',
        exits: [
          { to: 'entrance', label: '返回拼图大厅', requires: null },
          { to: 'wedding_day', label: '婚礼那天', requires: 'm5_puzzle_radio' }
        ],
        symbols: [
          {
            id: 'symbol_radio',
            name: '老式收音机',
            description: '收音机在播放《月亮代表我的心》，这是他们的定情曲。',
            meaning: '浪漫的岁月',
            interactable: true,
            onInteract: 'm5_puzzle_radio'
          }
        ],
        memories: ['m5_memory_2'],
        puzzles: ['m5_puzzle_radio']
      },
      university: {
        id: 'university',
        name: '图书馆',
        description: '阳光透过高大的窗户，他在书架间看到了一个熟悉的身影。',
        phase: 1,
        ambientEffect: 'page_turning',
        bgColor: 'rgba(221, 214, 254, 0.3)',
        exits: [
          { to: 'entrance', label: '返回拼图大厅', requires: null },
          { to: 'proposal', label: '求婚的那天', requires: 'm5_puzzle_book' }
        ],
        symbols: [
          {
            id: 'symbol_book',
            name: '《红楼梦》',
            description: '书的第23页夹着一张纸条："这位同学，可以请教一下吗？"',
            meaning: '最初的相遇',
            interactable: true,
            onInteract: 'm5_puzzle_book'
          }
        ],
        memories: ['m5_memory_3'],
        puzzles: ['m5_puzzle_book']
      },
      wedding_day: {
        id: 'wedding_day',
        name: '喜宴',
        description: '简陋但热闹的婚礼，她穿着红色的旗袍，笑得很甜。',
        phase: 2,
        ambientEffect: 'wedding_music',
        bgColor: 'rgba(254, 202, 202, 0.3)',
        exits: [
          { to: 'old_house', label: '返回老房子', requires: null }
        ],
        symbols: [
          {
            id: 'symbol_photo',
            name: '结婚照',
            description: '照片上的他们很年轻，也很幸福。他努力想记住她此刻的样子。',
            meaning: '永恒的承诺',
            interactable: true,
            onInteract: 'm5_puzzle_photo'
          }
        ],
        memories: ['m5_memory_4'],
        puzzles: ['m5_puzzle_photo']
      },
      proposal: {
        id: 'proposal',
        name: '荷塘边',
        description: '夏天的荷塘，荷花盛开。他紧张地从口袋里掏出一个小盒子。',
        phase: 2,
        ambientEffect: 'cricket_sounds',
        bgColor: 'rgba(187, 247, 208, 0.3)',
        exits: [
          { to: 'university', label: '返回图书馆', requires: null }
        ],
        symbols: [
          {
            id: 'symbol_ring',
            name: '银戒指',
            description: '戒指很便宜，但她却哭了。她说这是她收到的最好的礼物。',
            meaning: '一生的约定',
            interactable: true,
            onInteract: 'm5_puzzle_ring'
          }
        ],
        memories: ['m5_memory_5'],
        puzzles: ['m5_puzzle_ring']
      },
      hospital: {
        id: 'hospital',
        name: '医院病房',
        description: '她躺在床上，已经很虚弱了，但还是笑着对他说："别忘了我。"',
        phase: 3,
        ambientEffect: 'heart_monitor',
        bgColor: 'rgba(209, 213, 219, 0.4)',
        exits: [
          { to: 'final_room', label: '最后的告别', requires: 'm5_puzzle_hand' }
        ],
        symbols: [
          {
            id: 'symbol_hand',
            name: '紧握的手',
            description: '她的手已经很凉了，但还是紧紧握着他的手。',
            meaning: '无法割舍的爱',
            interactable: true,
            onInteract: 'm5_puzzle_hand'
          }
        ],
        memories: ['m5_memory_6'],
        puzzles: ['m5_puzzle_hand']
      },
      final_room: {
        id: 'final_room',
        name: '记忆深处',
        description: '所有的拼图都找到了，只剩下最后一块——她的脸。',
        phase: 4,
        ambientEffect: 'light_shining',
        bgColor: 'rgba(254, 249, 195, 0.5)',
        exits: [
          { to: 'entrance', label: '← 返回拼图大厅', requires: null }
        ],
        endings: ['m5_ending_1', 'm5_ending_2', 'm5_ending_3']
      }
    }
  },
  patient_004: {
    title: '数字迷宫',
    patientId: 'patient_004',
    entrance: {
      description: '你站在一个由数字组成的迷宫前，每一步都必须正确...',
      ambientSound: 'keyboard_typing',
      color: '#1e3a5f'
    },
    rooms: {
      entrance: {
        id: 'entrance',
        name: '审计大厅',
        description: '巨大的电子屏上显示着跳动的数字，每一个都必须精确无误。',
        phase: 1,
        ambientEffect: 'numbers_floating',
        bgColor: 'rgba(30, 58, 95, 0.8)',
        exits: [
          { to: 'spreadsheet_room', label: '进入表格室', requires: null },
          { to: 'safe_room', label: '进入保险库', requires: null }
        ],
        symbols: [
          {
            id: 'symbol_calculator',
            name: '摔坏的计算器',
            description: '计算器的屏幕上永远显示着一个错误的数字：0.01',
            meaning: '那一分钱的失误',
            interactable: true,
            onInteract: 'm4_puzzle_calculator'
          }
        ],
        memories: ['m4_memory_1'],
        puzzles: ['m4_puzzle_calculator']
      },
      spreadsheet_room: {
        id: 'spreadsheet_room',
        name: '表格之海',
        description: '无数的Excel表格飘浮在空中，每一个单元格都在等着你输入。',
        phase: 1,
        ambientEffect: 'cell_beeping',
        bgColor: 'rgba(30, 64, 175, 0.7)',
        exits: [
          { to: 'entrance', label: '返回审计大厅', requires: null },
          { to: 'balance_room', label: '平衡室', requires: 'm4_puzzle_balance' }
        ],
        symbols: [
          {
            id: 'symbol_balance',
            name: '不平衡的报表',
            description: '借贷相差一分钱，无论如何都配不平。',
            meaning: '无法原谅的差错',
            interactable: true,
            onInteract: 'm4_puzzle_balance'
          }
        ],
        memories: ['m4_memory_2'],
        puzzles: ['m4_puzzle_balance']
      },
      safe_room: {
        id: 'safe_room',
        name: '密码保险库',
        description: '巨大的保险箱需要七位数密码，必须检查七次才能确认。',
        phase: 1,
        ambientEffect: 'lock_clicking',
        bgColor: 'rgba(30, 41, 59, 0.8)',
        exits: [
          { to: 'entrance', label: '返回审计大厅', requires: null },
          { to: 'mistake_room', label: '错误现场', requires: 'm4_puzzle_password' }
        ],
        symbols: [
          {
            id: 'symbol_password',
            name: '七次检查',
            description: '他正在第七次检查密码。一次，两次，三次...',
            meaning: '不受控制的执念',
            interactable: true,
            onInteract: 'm4_puzzle_password'
          }
        ],
        memories: ['m4_memory_3'],
        puzzles: ['m4_puzzle_password']
      },
      balance_room: {
        id: 'balance_room',
        name: '天平之间',
        description: '巨大的天平两端放着数字，差之毫厘就会天翻地覆。',
        phase: 2,
        ambientEffect: 'scale_swinging',
        bgColor: 'rgba(55, 65, 81, 0.7)',
        exits: [
          { to: 'spreadsheet_room', label: '返回表格室', requires: null }
        ],
        symbols: [
          {
            id: 'symbol_scale',
            name: '精密天平',
            description: '左边放着一分钱，右边放着他的职业生涯。',
            meaning: '价值的衡量',
            interactable: true,
            onInteract: 'm4_puzzle_scale'
          }
        ],
        memories: ['m4_memory_4'],
        puzzles: ['m4_puzzle_scale']
      },
      mistake_room: {
        id: 'mistake_room',
        name: '事故现场',
        description: '时间回到了那一天。审计报告即将提交，那个错误就在眼前。',
        phase: 3,
        ambientEffect: 'clock_ticking_fast',
        bgColor: 'rgba(153, 27, 27, 0.6)',
        exits: [
          { to: 'safe_room', label: '返回保险库', requires: null },
          { to: 'final_choice', label: '面对真相', requires: 'm4_puzzle_choice' }
        ],
        symbols: [
          {
            id: 'symbol_report',
            name: '那一页报告',
            description: '只差一个签名，报告就会被提交。那0.01元的错误无人察觉...除了他。',
            meaning: '诚实与后果',
            interactable: true,
            onInteract: 'm4_puzzle_choice'
          }
        ],
        memories: ['m4_memory_5', 'm4_memory_6'],
        puzzles: ['m4_puzzle_choice']
      },
      final_choice: {
        id: 'final_choice',
        name: '数字尽头',
        description: '所有的数字都消失了，只剩下一个问题：你是谁？',
        phase: 4,
        ambientEffect: 'silence',
        bgColor: 'rgba(30, 41, 59, 0.9)',
        exits: [
          { to: 'entrance', label: '← 返回审计大厅', requires: null }
        ],
        endings: ['m4_ending_1', 'm4_ending_2', 'm4_ending_3']
      }
    }
  },
  patient_003: {
    title: '双子星空',
    patientId: 'patient_003',
    entrance: {
      description: '你站在一个巨大的时钟下面，指针在白天与黑夜之间摇摆不定...',
      ambientSound: 'tick_tock',
      color: '#1e1b4b'
    },
    rooms: {
      entrance: {
        id: 'entrance',
        name: '时间之门',
        description: '巨大的钟摆左右摇摆，左边是阳光明媚的校园，右边是霓虹闪烁的城市。',
        phase: 1,
        ambientEffect: 'clock_ticking',
        bgColor: 'rgba(30, 27, 75, 0.8)',
        exits: [
          { to: 'day_school', label: '→ 进入白天', requires: null },
          { to: 'night_city', label: '→ 进入黑夜', requires: null }
        ],
        symbols: [
          {
            id: 'symbol_clock',
            name: '巨大的摆钟',
            description: '钟面上刻着两个名字："晚星"和"夜星"，它们在争抢同一个位置。',
            meaning: '分裂的自我',
            interactable: true,
            onInteract: 'm3_puzzle_clock'
          }
        ],
        memories: ['m3_memory_1'],
        puzzles: ['m3_puzzle_clock']
      },
      day_school: {
        id: 'day_school',
        name: '阳光校园',
        description: '明亮的教室，阳光透过窗户洒在课桌上。一切都是那么"正常"。',
        phase: 1,
        ambientEffect: 'day_birds',
        bgColor: 'rgba(255, 251, 235, 0.3)',
        exits: [
          { to: 'entrance', label: '返回时间之门', requires: null },
          { to: 'classroom', label: '进入教室', requires: null },
          { to: 'rooftop', label: '通往天台', requires: 'm3_puzzle_diary' }
        ],
        symbols: [
          {
            id: 'symbol_diary',
            name: '上锁的日记本',
            description: '封面是粉色的，但锁孔里插着一把黑色的钥匙。',
            meaning: '被禁锢的真实自我',
            interactable: true,
            onInteract: 'm3_puzzle_diary'
          }
        ],
        memories: ['m3_memory_2'],
        puzzles: ['m3_puzzle_diary']
      },
      night_city: {
        id: 'night_city',
        name: '霓虹都市',
        description: '绚烂的霓虹灯，喧闹的街道。一个女孩正在舞台中央唱歌。',
        phase: 1,
        ambientEffect: 'neon_glow',
        bgColor: 'rgba(30, 10, 60, 0.7)',
        exits: [
          { to: 'entrance', label: '返回时间之门', requires: null },
          { to: 'club', label: '进入俱乐部', requires: null },
          { to: 'alley', label: '进入暗巷', requires: 'm3_puzzle_microphone' }
        ],
        symbols: [
          {
            id: 'symbol_microphone',
            name: '闪亮的麦克风',
            description: '麦克风上挂着一个学生证，照片上的女孩和舞台上的长得一样，但表情完全不同。',
            meaning: '双重生活',
            interactable: true,
            onInteract: 'm3_puzzle_microphone'
          }
        ],
        memories: ['m3_memory_3'],
        puzzles: ['m3_puzzle_microphone']
      },
      classroom: {
        id: 'classroom',
        name: '初三二班',
        description: '黑板上写着"距离中考还有100天"。课桌上堆满了复习资料。',
        phase: 2,
        ambientEffect: 'silence_pressure',
        bgColor: 'rgba(245, 240, 220, 0.4)',
        exits: [
          { to: 'day_school', label: '返回校园', requires: null }
        ],
        symbols: [
          {
            id: 'symbol_papers',
            name: '散落的试卷',
            description: '满分的数学试卷下面，压着一张被揉碎的歌词草稿。',
            meaning: '被压抑的梦想',
            interactable: true,
            onInteract: 'm3_puzzle_papers'
          },
          {
            id: 'symbol_photo',
            name: '全班合影',
            description: '照片里的"苏晚星"笑得很标准，但眼睛里没有光。',
            meaning: '完美的面具',
            interactable: false
          }
        ],
        memories: ['m3_memory_4'],
        puzzles: ['m3_puzzle_papers']
      },
      club: {
        id: 'club',
        name: '地下俱乐部',
        description: '震耳欲聋的音乐，疯狂舞动的人群。舞台上的女孩在发光。',
        phase: 2,
        ambientEffect: 'music_pulse',
        bgColor: 'rgba(40, 20, 80, 0.7)',
        exits: [
          { to: 'night_city', label: '返回街道', requires: null }
        ],
        symbols: [
          {
            id: 'symbol_guitar',
            name: '白色的吉他',
            description: '吉他上用马克笔写着"夜星"两个字，下面又被人用铅笔写了"晚星"。',
            meaning: '身份的争夺',
            interactable: true,
            onInteract: 'm3_puzzle_guitar'
          }
        ],
        memories: ['m3_memory_5'],
        puzzles: ['m3_puzzle_guitar']
      },
      rooftop: {
        id: 'rooftop',
        name: '学校天台',
        description: '这里是她的秘密基地。墙上画满了涂鸦，写着歌词和梦想。',
        phase: 3,
        ambientEffect: 'wind_whisper',
        bgColor: 'rgba(100, 100, 150, 0.6)',
        exits: [
          { to: 'day_school', label: '返回校园', requires: null },
          { to: 'mirror_room', label: '进入镜像空间', requires: 'm3_memory_6' }
        ],
        symbols: [
          {
            id: 'symbol_graffiti',
            name: '墙上的涂鸦',
            description: '"晚星是给别人看的，夜星才是真正的我。" 这句话被划掉了。',
            meaning: '内心的挣扎',
            interactable: true,
            onInteract: 'm3_memory_6'
          }
        ],
        memories: ['m3_memory_6', 'm3_memory_7']
      },
      alley: {
        id: 'alley',
        name: '暗巷深处',
        description: '黑暗的巷子里，一个女孩蜷缩在角落。她在哭。',
        phase: 3,
        ambientEffect: 'silent_cry',
        bgColor: 'rgba(20, 10, 30, 0.8)',
        exits: [
          { to: 'night_city', label: '返回街道', requires: null }
        ],
        symbols: [
          {
            id: 'symbol_letter',
            name: '撕碎的信件',
            description: '"我好累...我不想再演了..." 信纸被泪水打湿，字迹模糊。',
            meaning: '崩溃的边缘',
            interactable: true,
            onInteract: 'm3_puzzle_letter'
          }
        ],
        memories: ['m3_memory_8'],
        puzzles: ['m3_puzzle_letter']
      },
      mirror_room: {
        id: 'mirror_room',
        name: '镜像空间',
        description: '无数面镜子排列在四周，每面镜子里都有一个不同的她。',
        phase: 4,
        ambientEffect: 'mirror_shatter',
        bgColor: 'rgba(60, 50, 100, 0.7)',
        exits: [
          { to: 'final_choice', label: '最终抉择', requires: 'm3_puzzle_mirror' }
        ],
        symbols: [
          {
            id: 'symbol_two_mirrors',
            name: '相对的两面镜子',
            description: '左边镜子里是穿着校服的乖学生，右边是染着头发的歌手。她们隔着镜子对视。',
            meaning: '无法调和的两面',
            interactable: true,
            onInteract: 'm3_puzzle_mirror'
          }
        ],
        memories: ['m3_memory_9'],
        puzzles: ['m3_puzzle_mirror']
      },
      final_choice: {
        id: 'final_choice',
        name: '星辰之境',
        description: '繁星满天，两个女孩站在你面前。你必须做出选择...',
        phase: 4,
        ambientEffect: 'starlight',
        bgColor: 'rgba(20, 20, 60, 0.9)',
        exits: [
          { to: 'entrance', label: '← 返回时间之门', requires: null }
        ],
        endings: ['m3_ending_1', 'm3_ending_2', 'm3_ending_3']
      }
    }
  },
  patient_001: {
    title: '雨中的钢琴',
    patientId: 'patient_001',
    entrance: {
      description: '你站在一片朦胧的雨幕中，远处隐约传来断断续续的钢琴声...',
      ambientSound: 'rain',
      color: '#1a365d'
    },
    rooms: {
      entrance: {
        id: 'entrance',
        name: '雨幕入口',
        description: '细密的雨丝环绕着你，前方有三条模糊的路径。',
        phase: 1,
        ambientEffect: 'rain_light',
        bgColor: 'rgba(26, 54, 93, 0.8)',
        exits: [
          { to: 'garden', label: '通往废弃花园', requires: null },
          { to: 'concert_hall', label: '通往音乐厅', requires: null },
          { to: 'memory_room', label: '回忆房间', requires: 'memory_1' }
        ],
        symbols: [
          {
            id: 'symbol_umbrella',
            name: '一把破旧的黑伞',
            description: '伞骨折断了几根，似乎曾经被用来抵挡过什么。',
            meaning: '试图保护自己却徒劳无功',
            interactable: true,
            onInteract: 'puzzle_umbrella'
          }
        ],
        memories: ['memory_1']
      },
      garden: {
        id: 'garden',
        name: '枯萎的玫瑰园',
        description: '曾经繁茂的花园如今只剩下枯萎的玫瑰，雨水打落在焦黄的花瓣上。',
        phase: 1,
        ambientEffect: 'rain_medium',
        bgColor: 'rgba(60, 40, 60, 0.8)',
        exits: [
          { to: 'entrance', label: '返回雨幕入口', requires: null },
          { to: 'greenhouse', label: '进入温室', requires: 'puzzle_roses' }
        ],
        symbols: [
          {
            id: 'symbol_roses',
            name: '枯萎的白玫瑰',
            description: '每一朵玫瑰都被精心摆放成心形，但已经完全枯萎。',
            meaning: '逝去的爱情与未完成的承诺',
            interactable: true,
            onInteract: 'puzzle_roses'
          }
        ],
        memories: ['memory_2'],
        puzzles: ['puzzle_roses']
      },
      concert_hall: {
        id: 'concert_hall',
        name: '废弃音乐厅',
        description: '巨大的音乐厅空无一人，中央的三角钢琴蒙着厚厚的灰尘。',
        phase: 2,
        ambientEffect: 'echo_piano',
        bgColor: 'rgba(40, 35, 60, 0.85)',
        exits: [
          { to: 'entrance', label: '返回雨幕入口', requires: null },
          { to: 'backstage', label: '后台通道', requires: 'puzzle_piano' }
        ],
        symbols: [
          {
            id: 'symbol_piano',
            name: '蒙尘的钢琴',
            description: '琴键上有一个清晰的手印，仿佛有人刚刚离开。',
            meaning: '被遗弃的才华与梦想',
            interactable: true,
            onInteract: 'puzzle_piano'
          },
          {
            id: 'symbol_music_sheet',
            name: '浸湿的乐谱',
            description: '《婚礼进行曲》的乐谱被雨水浸湿，音符模糊不清。',
            meaning: '被打断的幸福',
            interactable: false
          }
        ],
        memories: ['memory_3'],
        puzzles: ['puzzle_piano']
      },
      memory_room: {
        id: 'memory_room',
        name: '记忆回廊',
        description: '墙壁上挂满了照片，每张照片都在微微发光。',
        phase: 3,
        ambientEffect: 'glow_warm',
        bgColor: 'rgba(80, 60, 50, 0.7)',
        exits: [
          { to: 'entrance', label: '返回雨幕入口', requires: null },
          { to: 'deep_memory', label: '深入记忆', requires: 'memory_4' }
        ],
        symbols: [
          {
            id: 'symbol_photos',
            name: '发光的照片',
            description: '照片记录了一对恋人的甜蜜时光，每张都标注着日期。',
            meaning: '珍贵的回忆',
            interactable: true,
            onInteract: 'memory_4'
          }
        ],
        memories: ['memory_4', 'memory_5']
      },
      greenhouse: {
        id: 'greenhouse',
        name: '秘密温室',
        description: '这里是唯一没有下雨的地方，一朵玫瑰正在奇迹般地绽放。',
        phase: 3,
        ambientEffect: 'warm_light',
        bgColor: 'rgba(50, 70, 50, 0.7)',
        exits: [
          { to: 'garden', label: '返回花园', requires: null }
        ],
        symbols: [
          {
            id: 'symbol_living_rose',
            name: '绽放的红玫瑰',
            description: '唯一一朵还活着的玫瑰，花瓣上有一滴晶莹的水珠。',
            meaning: '心中残存的希望',
            interactable: true,
            onInteract: 'puzzle_rose_bloom'
          }
        ],
        memories: ['memory_6'],
        puzzles: ['puzzle_rose_bloom']
      },
      backstage: {
        id: 'backstage',
        name: '后台化妆间',
        description: '镜子碎了一地，婚纱被撕得粉碎。',
        phase: 3,
        ambientEffect: 'broken_mirror',
        bgColor: 'rgba(70, 40, 50, 0.8)',
        exits: [
          { to: 'concert_hall', label: '返回音乐厅', requires: null },
          { to: 'accident_scene', label: '车祸现场', requires: 'puzzle_mirror' }
        ],
        symbols: [
          {
            id: 'symbol_mirror',
            name: '破碎的镜子',
            description: '镜中映照出的不是你的倒影，而是一个模糊的男性身影。',
            meaning: '无法面对的现实',
            interactable: true,
            onInteract: 'puzzle_mirror'
          }
        ],
        memories: ['memory_7'],
        puzzles: ['puzzle_mirror']
      },
      deep_memory: {
        id: 'deep_memory',
        name: '意识深渊',
        description: '这里是记忆的最深处，真相即将揭晓...',
        phase: 4,
        ambientEffect: 'truth_reveal',
        bgColor: 'rgba(30, 30, 50, 0.9)',
        exits: [
          { to: 'ending_choice', label: '面对真相', requires: 'puzzle_final' }
        ],
        symbols: [
          {
            id: 'symbol_accident',
            name: '车祸的记忆',
            description: '雨夜、刹车声、尖叫声...一切都在这里重演。',
            meaning: '被压抑的创伤',
            interactable: true,
            onInteract: 'puzzle_final'
          }
        ],
        memories: ['memory_8'],
        puzzles: ['puzzle_final']
      },
      ending_choice: {
        id: 'ending_choice',
        name: '抉择之门',
        description: '三扇门出现在你面前，每一扇都通向不同的结局...',
        phase: 4,
        ambientEffect: 'choice_moment',
        bgColor: 'rgba(50, 50, 80, 0.8)',
        exits: [
          { to: 'entrance', label: '← 返回雨幕入口', requires: null }
        ],
        endings: ['ending_1', 'ending_2', 'ending_3']
      }
    }
  },
  patient_002: {
    title: '无声的画布',
    patientId: 'patient_002',
    entrance: {
      description: '你置身于一个巨大的画廊，四周是无尽的黑暗，只有画布在微微发光...',
      ambientSound: 'silence',
      color: '#1a1a2e'
    },
    rooms: {
      entrance: {
        id: 'entrance',
        name: '画廊入口',
        description: '空旷的画廊中，只有你的脚步声在回响。',
        phase: 1,
        ambientEffect: 'silence',
        bgColor: 'rgba(26, 26, 46, 0.9)',
        exits: [
          { to: 'portrait_gallery', label: '肖像画廊', requires: null },
          { to: 'landscape_gallery', label: '风景展厅', requires: null }
        ],
        symbols: [
          {
            id: 'symbol_empty_canvas',
            name: '空白画布',
            description: '画架上放着一张纯白的画布，却有颜料的痕迹。',
            meaning: '被抹去的真相',
            interactable: true,
            onInteract: 'puzzle_canvas'
          }
        ],
        memories: ['m2_memory_1']
      },
      portrait_gallery: {
        id: 'portrait_gallery',
        name: '肖像画廊',
        description: '墙上挂满了肖像画，但每张脸都是模糊的。',
        phase: 1,
        ambientEffect: 'watching',
        bgColor: 'rgba(40, 30, 50, 0.85)',
        exits: [
          { to: 'entrance', label: '返回入口', requires: null },
          { to: 'secret_studio', label: '画家的工作室', requires: 'puzzle_faces' }
        ],
        symbols: [
          {
            id: 'symbol_faces',
            name: '模糊的面孔',
            description: '画中人的五官似乎在蠕动，却始终无法看清。',
            meaning: '不愿面对的人',
            interactable: true,
            onInteract: 'puzzle_faces'
          }
        ],
        memories: ['m2_memory_2'],
        puzzles: ['puzzle_faces']
      },
      landscape_gallery: {
        id: 'landscape_gallery',
        name: '风景展厅',
        description: '美丽的风景画中似乎隐藏着什么秘密。',
        phase: 2,
        ambientEffect: 'nature_sounds',
        bgColor: 'rgba(30, 50, 40, 0.8)',
        exits: [
          { to: 'entrance', label: '返回入口', requires: null },
          { to: 'dark_canvas', label: '黑暗画布室', requires: 'puzzle_landscape' }
        ],
        symbols: [
          {
            id: 'symbol_landscape',
            name: '山间小屋',
            description: '画中的小屋似乎在微微发光，烟囱冒着奇怪的黑烟。',
            meaning: '被掩盖的罪恶',
            interactable: true,
            onInteract: 'puzzle_landscape'
          }
        ],
        memories: ['m2_memory_3'],
        puzzles: ['puzzle_landscape']
      },
      secret_studio: {
        id: 'secret_studio',
        name: '秘密工作室',
        description: '这里是画家真正创作的地方，空气中弥漫着颜料和...血腥味？',
        phase: 3,
        ambientEffect: 'tension',
        bgColor: 'rgba(50, 30, 30, 0.85)',
        exits: [
          { to: 'portrait_gallery', label: '返回肖像画廊', requires: null },
          { to: 'final_reveal', label: '揭开真相', requires: 'puzzle_blood' }
        ],
        symbols: [
          {
            id: 'symbol_blood',
            name: '红色颜料',
            description: '颜料管上的标签写着"深红"，但颜色太像...血了。',
            meaning: '以血为墨',
            interactable: true,
            onInteract: 'puzzle_blood'
          }
        ],
        memories: ['m2_memory_4', 'm2_memory_5'],
        puzzles: ['puzzle_blood']
      },
      dark_canvas: {
        id: 'dark_canvas',
        name: '黑暗画布室',
        description: '这里存放着画家从未展出过的作品，每一幅都漆黑如夜。',
        phase: 3,
        ambientEffect: 'darkness',
        bgColor: 'rgba(10, 10, 20, 0.95)',
        exits: [
          { to: 'landscape_gallery', label: '返回风景展厅', requires: null }
        ],
        symbols: [
          {
            id: 'symbol_dark_painting',
            name: '最后的画作',
            description: '在完全的黑暗中，似乎有什么东西在注视着你。',
            meaning: '内心的恶魔',
            interactable: true,
            onInteract: 'memory_6'
          }
        ],
        memories: ['m2_memory_6']
      },
      final_reveal: {
        id: 'final_reveal',
        name: '真相之境',
        description: '所有的画作汇聚在一起，形成了一幅完整的画面...',
        phase: 4,
        ambientEffect: 'truth',
        bgColor: 'rgba(40, 40, 60, 0.8)',
        exits: [
          { to: 'entrance', label: '← 返回画廊入口', requires: null }
        ],
        endings: ['m2_ending_1', 'm2_ending_2', 'm2_ending_3']
      }
    }
  }
}

export const getDreamByPatientId = (patientId) => dreams[patientId] || null
