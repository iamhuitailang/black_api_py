export const patients = [
  {
    id: 'patient_001',
    name: '林小雨',
    age: 28,
    avatar: '🌧️',
    title: '被困在雨天的女孩',
    symptom: '创伤后应激障碍',
    description: '一场意外让她永远停留在了那个下雨的日子...',
    background: '林小雨是一名钢琴家，三年前的一场车祸夺走了她未婚夫的生命，从此她再也无法弹奏钢琴，每到雨天就会陷入深深的恐惧。',
    status: 'untreated',
    difficulty: 1,
    estimatedTime: '30-45分钟'
  },
  {
    id: 'patient_002',
    name: '陈默',
    age: 35,
    avatar: '🔇',
    title: '沉默的画家',
    symptom: '选择性缄默症',
    description: '他选择用画笔代替语言，却画不出心中的秘密...',
    background: '陈默是一位小有名气的画家，但在一年前突然停止说话。他的画作越来越黑暗，仿佛有什么东西在吞噬他的内心。',
    status: 'untreated',
    difficulty: 2,
    estimatedTime: '45-60分钟'
  },
  {
    id: 'patient_003',
    name: '苏晚星',
    age: 16,
    avatar: '⭐',
    title: '追逐星星的少女',
    symptom: '解离性身份障碍',
    description: '她的身体里住着另一个"她"，一个只在夜晚出现的她...',
    background: '苏晚星是一名高中生，最近经常出现"断片"的情况。她的日记中出现了另一种笔迹，自称是"夜星"。',
    status: 'untreated',
    difficulty: 3,
    estimatedTime: '60-90分钟'
  },
  {
    id: 'patient_004',
    name: '方正',
    age: 42,
    avatar: '🧮',
    title: '数字囚徒',
    symptom: '强迫症',
    description: '他被困在了自己构建的数字迷宫中...',
    background: '方正是一名顶级会计师，一年前的一次审计失误让他开始陷入对数字的执念。现在他做任何事都要数三遍，门锁要检查七次，否则就会陷入极度恐慌。',
    status: 'untreated',
    difficulty: 2,
    estimatedTime: '45-60分钟'
  },
  {
    id: 'patient_005',
    name: '沈念',
    age: 72,
    avatar: '🧩',
    title: '被时间遗忘的人',
    symptom: '阿尔茨海默症',
    description: '他的记忆像拼图一样散落，正在慢慢消失...',
    background: '沈念是一位退休教授，被诊断出阿尔茨海默症早期。他经常忘记自己是谁，但有时又会清晰地记得几十年前的事。他最害怕的是——忘记他已故的妻子。',
    status: 'untreated',
    difficulty: 2,
    estimatedTime: '45-60分钟'
  }
]

export const getPatientById = (id) => patients.find(p => p.id === id)
