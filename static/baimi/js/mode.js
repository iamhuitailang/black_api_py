const Mode = (() => {
    const modes = [
        {
            id: 'solo',
            name: '单人计时',
            description: '挑战个人最好成绩',
            opponents: 0,
            features: ['无干扰', '专注个人发挥', '刷新个人记录'],
            isTournament: false
        },
        {
            id: 'friendly',
            name: '友谊赛',
            description: '与随机对手竞技',
            opponents: 3,
            features: ['3名随机对手', '休闲娱乐', '低压力竞技'],
            isTournament: false
        },
        {
            id: 'tournament',
            name: '锦标赛',
            description: '淘汰赛制，层层晋级',
            opponents: 7,
            features: ['8人淘汰赛', '多轮竞技', '8→4→2→1'],
            isTournament: true,
            rounds: ['1/4决赛', '半决赛', '决赛']
        },
        {
            id: 'olympic',
            name: '奥运决赛',
            description: '与最强对手争夺金牌',
            opponents: 7,
            features: ['8名顶级选手', '最高难度', '冲击金牌'],
            isTournament: false
        }
    ];

    const getModeById = (id) => {
        return modes.find(m => m.id === id) || modes[0];
    };

    const getAllModes = () => {
        return [...modes];
    };

    const getOpponentCount = (modeId) => {
        const mode = getModeById(modeId);
        return mode.opponents;
    };

    return {
        getModeById,
        getAllModes,
        getOpponentCount
    };
})();
