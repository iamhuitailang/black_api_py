const MBTIData = (function() {
    const questions = [
        {
            id: 1,
            text: "周末你更喜欢？",
            dimension: "EI",
            options: [
                { text: "和朋友聚会", score: 2, type: "E" },
                { text: "独自看书/追剧", score: -2, type: "I" }
            ]
        },
        {
            id: 2,
            text: "你更相信？",
            dimension: "SN",
            options: [
                { text: "实际经验", score: 2, type: "S" },
                { text: "直觉和灵感", score: -2, type: "N" }
            ]
        },
        {
            id: 3,
            text: "做决定时更看重？",
            dimension: "TF",
            options: [
                { text: "逻辑和原则", score: 2, type: "T" },
                { text: "人情和感受", score: -2, type: "F" }
            ]
        },
        {
            id: 4,
            text: "你更喜欢？",
            dimension: "JP",
            options: [
                { text: "按计划行事", score: 2, type: "J" },
                { text: "随性灵活", score: -2, type: "P" }
            ]
        },
        {
            id: 5,
            text: "社交后你感觉？",
            dimension: "EI",
            options: [
                { text: "充满能量", score: 2, type: "E" },
                { text: "需要独处充电", score: -2, type: "I" }
            ]
        },
        {
            id: 6,
            text: "你更擅长？",
            dimension: "SN",
            options: [
                { text: "关注细节", score: 2, type: "S" },
                { text: "把握大局", score: -2, type: "N" }
            ]
        },
        {
            id: 7,
            text: "批评别人时你？",
            dimension: "TF",
            options: [
                { text: "直接指出问题", score: 2, type: "T" },
                { text: "委婉照顾感受", score: -2, type: "F" }
            ]
        },
        {
            id: 8,
            text: "旅行时你更喜欢？",
            dimension: "JP",
            options: [
                { text: "提前做好攻略", score: 2, type: "J" },
                { text: "边走边看", score: -2, type: "P" }
            ]
        },
        {
            id: 9,
            text: "你更愿意成为？",
            dimension: "EI",
            options: [
                { text: "团队焦点", score: 2, type: "E" },
                { text: "幕后支持者", score: -2, type: "I" }
            ]
        },
        {
            id: 10,
            text: "你更倾向于？",
            dimension: "SN",
            options: [
                { text: "传统可靠的方法", score: 2, type: "S" },
                { text: "新奇的尝试", score: -2, type: "N" }
            ]
        },
        {
            id: 11,
            text: "别人评价你？",
            dimension: "TF",
            options: [
                { text: "理性冷静", score: 2, type: "T" },
                { text: "温暖体贴", score: -2, type: "F" }
            ]
        },
        {
            id: 12,
            text: "对截止日期你？",
            dimension: "JP",
            options: [
                { text: "提前完成", score: 2, type: "J" },
                { text: "最后冲刺", score: -2, type: "P" }
            ]
        }
    ];

    const types = {
        "INTJ": {
            name: "建筑师",
            nickname: "战略家",
            traits: ["富有想象力", "果断", "有远大理想", "独立思考", "追求完美"],
            careers: ["科学家", "系统分析师", "战略规划师", "投资分析师", "建筑师"],
            advice: "学会放松，不必事事追求完美；多表达情感，让他人更容易接近你。",
            description: "INTJ是独立的战略思考者，他们有着宏大的愿景和极强的分析能力。他们善于看到事物的深层规律，制定长期计划并坚定执行。"
        },
        "INTP": {
            name: "逻辑学家",
            nickname: "思想家",
            traits: ["创新", "好奇", "追求理论", "逻辑严密", "善于分析"],
            careers: ["程序员", "数学家", "哲学家", "研究员", "系统设计师"],
            advice: "将你的理论付诸实践，不要停留在思考阶段；多关注他人的感受，提升社交能力。",
            description: "INTP是充满好奇心的逻辑学家，他们对复杂的概念和理论有着天生的兴趣。他们善于发现逻辑漏洞，追求知识的纯粹性。"
        },
        "ENTJ": {
            name: "指挥官",
            nickname: "领导者",
            traits: ["果断", "有魅力", "善于策略", "目标导向", "自信"],
            careers: ["CEO", "律师", "企业家", "项目经理", "投资银行家"],
            advice: "学会倾听，不要过于强势；关注团队成员的情感需求，做一个更有温度的领导者。",
            description: "ENTJ是天生的领导者，他们有着强大的意志力和战略眼光。他们善于组织协调，能够带领团队实现宏大目标。"
        },
        "ENTP": {
            name: "辩论家",
            nickname: "创新者",
            traits: ["机智", "善辩", "头脑灵活", "创新思维", "喜欢挑战"],
            careers: ["创业者", "营销策划", "律师", "产品经理", "记者"],
            advice: "专注于一个目标，不要过于分散精力；学会完成你开始的事情，不要轻易放弃。",
            description: "ENTP是充满创意的辩论家，他们喜欢挑战传统，提出新观点。他们反应敏捷，善于在争论中发现新的可能性。"
        },
        "INFJ": {
            name: "提倡者",
            nickname: "理想主义者",
            traits: ["有原则", "有洞察力", "利他", "富有同情心", "坚持信念"],
            careers: ["心理咨询师", "作家", "非营利组织工作者", "教师", "人力资源专家"],
            advice: "学会自我保护，不要过度消耗自己；接受不完美，不必对自己和他人过于苛刻。",
            description: "INFJ是富有洞察力的理想主义者，他们有着强烈的价值观和使命感。他们善于理解他人的内心世界，致力于帮助他人成长。"
        },
        "INFP": {
            name: "调停者",
            nickname: "Mediator",
            traits: ["理想主义", "善良", "忠诚", "富有创造力", "追求和谐"],
            careers: ["作家", "艺术家", "心理咨询师", "社会工作者", "设计师"],
            advice: "从理想世界走向现实，学会处理实际问题；不要害怕冲突，学会表达自己的立场。",
            description: "INFP是温柔的理想主义者，他们有着丰富的内心世界和强烈的价值观。他们追求真实和意义，致力于创造美好的事物。"
        },
        "ENFJ": {
            name: "主人公",
            nickname: "教师",
            traits: ["热情", "有感染力", "善于沟通", "有魅力", "乐于助人"],
            careers: ["教师", "人力资源经理", "销售经理", "公关专员", "团队教练"],
            advice: "学会说不，不要过度承担他人的问题；关注自己的需求，不要总是牺牲自己。",
            description: "ENFJ是充满魅力的领导者和教师，他们有着强大的共情能力和沟通技巧。他们善于激励他人，帮助他人发挥潜能。"
        },
        "ENFP": {
            name: "竞选者",
            nickname: "激励者",
            traits: ["热情", "创造力", "善于社交", "乐观", "充满活力"],
            careers: ["市场专员", "演员", "公关顾问", "创业者", "活动策划"],
            advice: "学会专注，不要被太多想法分散注意力；培养耐心，学会坚持完成长期项目。",
            description: "ENFP是充满热情的激励者，他们有着无穷的创造力和社交能量。他们善于发现可能性，能够激励周围的人一起追求梦想。"
        },
        "ISTJ": {
            name: "物流师",
            nickname: "检查员",
            traits: ["务实", "负责", "有条理", "可靠", "注重细节"],
            careers: ["会计师", "审计师", "项目经理", "质量检查员", "军人"],
            advice: "学会接受变化，不要过于固执；尝试新事物，走出舒适区。",
            description: "ISTJ是可靠的物流师，他们注重实际，做事有条理。他们有着强烈的责任感，是团队中值得信赖的成员。"
        },
        "ISFJ": {
            name: "守卫者",
            nickname: "保护者",
            traits: ["细心", "忠诚", "默默奉献", "有责任心", "善解人意"],
            careers: ["护士", "教师", "行政助理", "客户服务", "图书管理员"],
            advice: "学会表达自己的需求，不要总是默默承受；适当自私一点，关爱自己。",
            description: "ISFJ是细心的守卫者，他们有着强烈的责任感和奉献精神。他们善于照顾他人的需求，是温暖可靠的支持者。"
        },
        "ESTJ": {
            name: "管理者",
            nickname: "监督者",
            traits: ["高效", "务实", "有领导力", "组织能力强", "直接"],
            careers: ["经理", "法官", "军官", "财务总监", "项目经理"],
            advice: "学会灵活变通，不要过于强硬；多考虑他人的感受，做一个更有人情味的管理者。",
            description: "ESTJ是高效的管理者，他们善于组织和协调。他们注重效率和秩序，能够让团队高效运转。"
        },
        "ESFJ": {
            name: "执政官",
            nickname: "大使",
            traits: ["热心", "善于合作", "注重和谐", "有同理心", "受欢迎"],
            careers: ["销售", "人力资源", "护士", "活动策划", "客户关系"],
            advice: "不要过于在意他人的评价，做真实的自己；学会独立思考，不要总是迎合他人。",
            description: "ESFJ是热心的执政官，他们善于社交，注重和谐。他们有着强烈的服务意识，是团队中的黏合剂。"
        },
        "ISTP": {
            name: "鉴赏家",
            nickname: "手艺人",
            traits: ["大胆", "务实", "喜欢探索", "动手能力强", "冷静"],
            careers: ["工程师", "飞行员", "机械师", "运动员", "程序员"],
            advice: "学会表达情感，不要总是保持冷漠；考虑长期规划，不要只关注当下。",
            description: "ISTP是务实的鉴赏家，他们善于用双手创造和解决问题。他们喜欢探索，享受动手实践的乐趣。"
        },
        "ISFP": {
            name: "探险家",
            nickname: "艺术家",
            traits: ["敏感", "温和", "热爱美", "有艺术天赋", "活在当下"],
            careers: ["艺术家", "设计师", "厨师", "摄影师", "音乐家"],
            advice: "学会表达自己的想法和感受，不要总是隐藏；尝试制定长期计划，不要总是随遇而安。",
            description: "ISFP是温和的艺术家，他们对美有着敏锐的感知力。他们活在当下，享受生活中的每一刻美好。"
        },
        "ESTP": {
            name: "企业家",
            nickname: "实干家",
            traits: ["充满活力", "善于应变", "喜欢冒险", "务实", "善于交际"],
            careers: ["销售", "企业家", "运动员", "股票交易员", "警察"],
            advice: "学会三思而后行，不要过于冲动；考虑他人的感受，不要只追求自己的快乐。",
            description: "ESTP是充满活力的实干家，他们喜欢冒险和刺激。他们善于应变，能够在压力下做出快速反应。"
        },
        "ESFP": {
            name: "表演者",
            nickname: "娱乐者",
            traits: ["自发", "热情", "享受当下", "善于表演", "乐观"],
            careers: ["演员", "活动策划", "销售", "导游", "健身教练"],
            advice: "学会专注，不要过于浮躁；考虑长期后果，不要只追求眼前的快乐。",
            description: "ESFP是天生的表演者，他们热爱生活，喜欢成为焦点。他们总能给周围的人带来欢乐和活力。"
        }
    };

    const dimensions = {
        "EI": { left: "E", leftName: "外向", right: "I", rightName: "内向" },
        "SN": { left: "S", leftName: "实感", right: "N", rightName: "直觉" },
        "TF": { left: "T", leftName: "思考", right: "F", rightName: "情感" },
        "JP": { left: "J", leftName: "判断", right: "P", rightName: "感知" }
    };

    const config = {
        questionCount: 12,
        historyLimit: 3,
        anonymousMode: false
    };

    return {
        questions,
        types,
        dimensions,
        config
    };
})();
