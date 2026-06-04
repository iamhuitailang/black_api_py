const RANDOM_EVENTS = [
  {
    id: 'pirate_attack',
    type: 'pirate',
    title: '⚠️ 海盗袭击！',
    description: '一群星际海盗拦截了你的飞船，他们要求你交出货物，否则就要开火。',
    choices: [
      {
        text: '战斗！',
        outcome: {
          type: 'combat',
          win: {
            hull: -20,
            credits: 2000,
            message: '你击退了海盗，还缴获了一些战利品！'
          },
          lose: {
            hull: -50,
            loseCargoPercent: 0.3,
            message: '战斗失败，你损失了部分货物和船体。'
          }
        }
      },
      {
        text: '交出货物',
        outcome: {
          loseCargoPercent: 0.5,
          message: '你交出了一半的货物，海盗放你离开了。'
        }
      },
      {
        text: '尝试逃跑',
        outcome: {
          type: 'escape',
          success: {
            fuel: -20,
            message: '你全速逃离，消耗了大量燃料，但成功摆脱了海盗。'
          },
          fail: {
            hull: -30,
            loseCargoPercent: 0.4,
            message: '逃跑失败，海盗追上并洗劫了你的飞船。'
          }
        }
      }
    ]
  },
  {
    id: 'ancient_ruins',
    type: 'ruins',
    title: '🏺 发现古代遗迹！',
    description: '你的探测器在附近发现了一处古代文明遗迹，里面可能藏有珍宝，但也可能有危险。',
    choices: [
      {
        text: '派人探索',
        outcome: {
          type: 'explore',
          success: {
            goods: { goodId: 'artifacts', quantity: 2 },
            message: '探险队发现了珍贵的古代遗物！'
          },
          fail: {
            hull: -15,
            message: '遗迹中有陷阱，你的飞船受到了损伤。'
          }
        }
      },
      {
        text: '出售坐标',
        outcome: {
          credits: 3000,
          message: '你将遗迹坐标卖给了考古学家，获得了一笔报酬。'
        }
      },
      {
        text: '忽略离开',
        outcome: {
          message: '你谨慎地选择离开，继续你的旅程。'
        }
      }
    ]
  },
  {
    id: 'trade_ban',
    type: 'trade_ban',
    title: '🚫 贸易禁令',
    description: '目的地星系刚刚发布了临时贸易禁令，某些商品将被禁止交易。',
    choices: [
      {
        text: '接受禁令',
        outcome: {
          tradeBan: 10,
          message: '你遵守了禁令，虽然交易受限但避免了麻烦。'
        }
      },
      {
        text: '尝试走私',
        outcome: {
          type: 'smuggle',
          success: {
            credits: 5000,
            message: '你成功走私了货物，获得了巨额利润！'
          },
          fail: {
            credits: -3000,
            tradeBan: 20,
            message: '走私被发现，你被罚款并被禁止交易更长时间。'
          }
        }
      }
    ]
  },
  {
    id: 'market_crash',
    type: 'market',
    title: '📉 市场崩盘',
    description: '银河金融市场出现剧烈波动，商品价格大幅下跌！',
    choices: [
      {
        text: '低价买入',
        outcome: {
          marketCrash: 5,
          message: '你决定在低点买入，等待市场复苏。'
        }
      },
      {
        text: '抛售所有',
        outcome: {
          loseCargoValuePercent: 0.2,
          message: '你恐慌性抛售，损失了部分货物价值。'
        }
      },
      {
        text: '按兵不动',
        outcome: {
          message: '你决定观望，市场可能很快就会恢复。'
        }
      }
    ]
  },
  {
    id: 'lucky_find',
    type: 'lucky',
    title: '🍀 意外收获',
    description: '你在太空中发现了一个废弃的货运舱，里面似乎有些东西。',
    choices: [
      {
        text: '回收货物',
        outcome: {
          randomGoods: true,
          message: '你成功回收了货舱，获得了一批商品！'
        }
      },
      {
        text: '拆解零件',
        outcome: {
          credits: 1500,
          hull: 10,
          message: '你拆解了货舱，获得了一些有用的零件和信用点。'
        }
      }
    ]
  },
  {
    id: 'fuel_leak',
    type: 'mechanical',
    title: '⚠️ 燃料泄漏',
    description: '警报！飞船燃料系统出现泄漏，必须立即处理！',
    choices: [
      {
        text: '紧急维修',
        outcome: {
          credits: -500,
          fuel: -10,
          message: '你支付了维修费用，修复了泄漏，但损失了一些燃料。'
        }
      },
      {
        text: '临时封堵',
        outcome: {
          type: 'repair',
          success: {
            fuel: -20,
            message: '你临时封堵了泄漏，损失了一些燃料但节省了维修费。'
          },
          fail: {
            fuel: -40,
            hull: -10,
            message: '封堵失败，泄漏加剧，你损失了大量燃料和船体。'
          }
        }
      }
    ]
  },
  {
    id: 'distress_signal',
    type: 'lucky',
    title: '📡 求救信号',
    description: '你收到了一艘商船的求救信号，他们的引擎出了故障。',
    choices: [
      {
        text: '前去救援',
        outcome: {
          type: 'rescue',
          success: {
            credits: 3000,
            reputation: 1,
            message: '你成功救援了商船，船长给了你丰厚的报酬！'
          },
          fail: {
            fuel: -15,
            message: '当你到达时，他们已经被其他人救援了。'
          }
        }
      },
      {
        text: '忽略信号',
        outcome: {
          reputation: -1,
          message: '你选择忽略求救信号，继续你的旅程。'
        }
      }
    ]
  },
  {
    id: 'nebula_discovery',
    type: 'ruins',
    title: '✨ 神秘星云',
    description: '你发现了一片美丽的星云，探测器显示其中含有稀有能量水晶。',
    choices: [
      {
        text: '进入采集',
        outcome: {
          type: 'collect',
          success: {
            goods: { goodId: 'crystals', quantity: 3 },
            message: '你成功采集到了珍贵的能量水晶！'
          },
          fail: {
            shield: -30,
            message: '星云中的能量风暴损坏了你的护盾系统。'
          }
        }
      },
      {
        text: '绕道而行',
        outcome: {
          fuel: -5,
          message: '你选择绕道，安全但多消耗了一些燃料。'
        }
      }
    ]
  }
];
