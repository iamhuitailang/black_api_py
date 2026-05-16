const GameData = {
    characters: {
        programmer: {
            id: 'programmer',
            name: '程序猿',
            icon: '🧑‍💻',
            type: '均衡型',
            maxBlame: 100,
            attackDamage: 12,
            defense: 5,
            moveSpeed: 5,
            ultimateDamage: 25,
            skills: ['终极甩锅术', '代码报错攻击']
        },
        product: {
            id: 'product',
            name: '产品经理',
            icon: '👩‍💼',
            type: '控制型',
            maxBlame: 110,
            attackDamage: 10,
            defense: 7,
            moveSpeed: 3.5,
            ultimateDamage: 22,
            skills: ['需求变更', '无限甩锅大法']
        },
        designer: {
            id: 'designer',
            name: '设计狮',
            icon: '📝',
            type: '速度型',
            maxBlame: 90,
            attackDamage: 14,
            defense: 4,
            moveSpeed: 6.5,
            ultimateDamage: 28,
            skills: ['改稿暴击', '灵魂画手攻击']
        }
    },

    attacks: {
        lightThrow: {
            id: 'lightThrow',
            name: '轻甩锅',
            damage: 8,
            startup: 0.05,
            recovery: 0.15,
            range: 80,
            cooldown: 0.3,
            color: '#3498db'
        },
        heavyThrow: {
            id: 'heavyThrow',
            name: '重甩锅',
            damage: 14,
            startup: 0.12,
            recovery: 0.25,
            range: 120,
            cooldown: 0.5,
            color: '#e74c3c'
        },
        roast: {
            id: 'roast',
            name: '吐槽攻击',
            damage: 7,
            startup: 0.07,
            recovery: 0.18,
            range: 150,
            cooldown: 0.4,
            color: '#9b59b6'
        },
        deskSlap: {
            id: 'deskSlap',
            name: '拍桌警告',
            damage: 15,
            startup: 0.15,
            recovery: 0.28,
            range: 200,
            cooldown: 0.8,
            color: '#f39c12'
        },
        ultimate: {
            id: 'ultimate',
            name: '文件飞砸',
            damage: 25,
            startup: 0.2,
            recovery: 0.4,
            range: 300,
            cooldown: 2,
            color: '#e91e63',
            isUltimate: true
        }
    },

    attackTexts: {
        lightThrow: ['这锅我不背！', '找别人去！', '不是我的问题！'],
        heavyThrow: ['这锅绝对不是我的！', '明明是你搞砸的！', '你自己看着办！'],
        roast: ['这代码写的什么玩意儿？', '需求又改了？', '设计稿能看吗？', '你是猪吗？'],
        deskSlap: ['啪！！！', '够了！', '闭嘴！'],
        ultimate: ['文件飞砸！', '看招！', '终极甩锅术！']
    },

    gameConfig: {
        gameDuration: 120,
        groundY: 0.75,
        gravity: 0.8,
        jumpForce: 15,
        playerStartX: 0.15,
        enemyStartX: 0.85,
        characterWidth: 70,
        characterHeight: 100
    },

    aiConfig: {
        reactionTime: 0.2,
        attackChance: 0.15,
        defendChance: 0.4,
        moveChance: 0.1
    }
};