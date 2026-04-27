// 客群分析接口 Mock 数据

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const mockSegment = {
  textToSql({ text } = {}) {
    const keyword = (text || '').trim()
    let sql = 'select city_id,user_online,sex_id,count(*) from user_behavior where arpu=80;'
    if (keyword.includes('ARPU>89') || keyword.includes('arpu>89')) {
      sql = 'select city_id, sex_id, age, count(*) from user_behavior where arpu>89 group by city_id, sex_id, age;'
    } else if (keyword.includes('高价值')) {
      sql = 'select city_id, sex_id, count(*) from user_behavior where arpu>120 and is_rhtc=1 group by city_id, sex_id;'
    } else if (keyword) {
      sql = `select city_id, user_online, sex_id, count(*) from user_behavior where /* ${keyword} */ arpu=80 group by city_id, user_online, sex_id;`
    }
    return { sql }
  },

  query({ sql } = {}) {
    const norm = (sql || '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()

    // 口径下拉拉取客群名：与真实接口 { columns, data, total } 在 queryBySql 中已转为 rows
    if (norm.includes('from audience_groups') && norm.includes('group by name')) {
      const names = ['测试', '高ARPU城市白领', '潜力新用户', '流失预警用户']
      return {
        columns: [{ prop: 'name', label: 'name' }],
        rows: names.map((name) => ({ name })),
        total: 11,
        sql
      }
    }

    // 圈选：按客群名取 user_id
    if (/from\s+audience_groups/.test(norm) && norm.includes('user_id') && norm.includes('where') && norm.includes('name')) {
      const n = 5
      return {
        columns: [{ prop: 'user_id', label: 'user_id' }],
        rows: Array.from({ length: n }, (_, i) => ({ user_id: `U${String(100001 + i)}` })),
        total: n,
        sql
      }
    }

    const rows = []
    //const cities = ['北京', '上海', '广州', '深圳', '成都', '武汉', '南京', '杭州', '西安', '郑州']
    const cities = ['北京']
    const sexMap = ['未知', '男', '女']
    for (let i = 0; i < 100; i++) {
      rows.push({
        city_id: cities[i % cities.length],
        user_online: rand(1, 120),
        sex_id: sexMap[rand(1, 2)],
        'count(*)': rand(50, 5000)
      })
    }
    return {
      columns: [
        { prop: 'city_id', label: '城市' },
        { prop: 'user_online', label: '在网时长(月)' },
        { prop: 'sex_id', label: '性别' },
        { prop: 'count(*)', label: '用户数' }
      ],
      rows,
      total: 658,
      sql
    }
  },

  save({ name, condition } = {}) {
    return { id: Date.now(), name, condition }
  },

  multiAnalysis({ sql } = {}) {
    return {
      lifecycle: [
        { key: 'inflow', label: '入网期', desc: '在网时长<6个月', value: 35.18 },
        { key: 'growth', label: '成长期', desc: '在网时长<18个月', value: 42.16 },
        { key: 'mature', label: '成熟期', desc: '在网时长<36个月', value: 35.21 },
        { key: 'churn', label: '异动期', desc: '在网时长<60个月', value: 16.82 },
        { key: 'leave', label: '离网期', desc: '在网时长>60个月', value: 23.78 }
      ],
      valueBar: {
        categories: ['入网期', '成长期', '成熟期', '异动期', '离网期'],
        high: [345, 758, 234, 112, 34],
        low: [278, 432, 189, 76, 22]
      },
      radar: {
        indicator: [
          { name: '粘性', max: 100 },
          { name: '价值', max: 100 },
          { name: '竞抢', max: 100 },
          { name: '感知', max: 100 },
          { name: '活跃', max: 100 },
          { name: '传播', max: 100 }
        ],
        value: [85, 70, 62, 78, 92, 45],
        value2: [45, 23, 9, 67, 21, 11],
        value3: [85, 70, 32, 43, 87, 32]

      },
      diagnosisTable: [
        { period: '入网期', sticky: 100, value: 140, compete: 230, sense: 100, active: 130, spread: 148 },
        { period: '成长期', sticky: 150, value: 100, compete: 200, sense: 140, active: 100, spread: 140 },
        { period: '成熟期', sticky: 194, value: 120, compete: 132, sense: 165, active: 220, spread: 152 }
      ],
      sql
    }
  },

  list() {
    return [
      { id: 1, name: '高ARPU城市白领', condition: "FROM user_behavior WHERE arpu>89 AND user_online>=18" },
      { id: 2, name: '潜力新用户', condition: "FROM user_behavior WHERE user_online<6 AND prepay_bal>40" },
      { id: 3, name: '流失预警用户', condition: "FROM user_behavior WHERE user_online>=36 AND is_ywsk=1" }
    ]
  }
}
