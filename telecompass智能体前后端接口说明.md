telecompass智能体前后端接口说明

一、客群分析
1.客群分析-输入框

接口：POST /audience/nl2sql
后端测试方式：curl -X POST http://localhost:8000/api/v1/audience/nl2sql \
  -H "Content-Type: application/json" \
  -d '{"question":"查询用户数量","user_id":"demo"}'
后端测试结果：成功

用途：用户输入自然语言问题，后端生成 SQL 语句（不执行），供运营者查看或修改。
请求参数：
{
"question": "上个月流量超套用户有多少？按地市拆分",
"user_id": "demo"
}
请求示例：
curl -X POST http://localhost:8000/api/v1/audience/nl2sql \
  -H "Content-Type: application/json" \
  -d '{"question":"查询用户数量","user_id":"demo"}'
后端调用链：
routes.py -> simple_agents.run_nl2sql() -> services/audience_analysis.nl2sql()-> services/vanna_service.generate_sql() -> (Vanna + Ollama)
响应示例：
{"sql":"SELECT COUNT(*) AS user_count\nFROM user_behavior;"}
前端使用：
将返回的 sql 填充到 SQL 编辑区，如下：

 
用户可修改 SQL 后点击“确定统计”执行。
2.客群分析-执行SQL查询

接口：POST /audience/execute
后端测试方式：
curl -X POST http://localhost:8000/api/v1/audience/execute \
  -H "Content-Type: application/json" \
  -d '{"sql":"SELECT user_id, arpu FROM user_behavior LIMIT 5","user_id":"demo"}'
后端测试结果：成功

用途：执行用户编写的 SQL 语句，返回查询结果（表格数据，已脱敏）。
请求参数：
{
  "sql": "SELECT user_id, arpu FROM user_behavior WHERE arpu > 100 LIMIT 10",
  "user_id": "demo"
}
后端调用链：
routes.py -> simple_agents.run_execute_sql() -> services/audience_analysis.execute_analysis()
    -> services/clickhouse_service.execute_sql() (带重试装饰器)
响应示例：
{
  "columns": ["user_id", "arpu"],
  "data": [["user_abc", 120.5], ["user_def", 135.0]],
  "total": 2
}
前端数据存放：columns 用于表格列头，data 用于表格行数据，total 用于分页显示。显示位置如下：

3.客群分析-保存客群（条件 SQL）

接口：POST /audience/save
后端测试方法：
curl -X POST http://localhost:8000/api/v1/audience/save \
  -H "Content-Type: application/json" \
  -d '{"name":"测试客群","condition_sql":"SELECT user_id FROM user_behavior WHERE arpu > 100","user_id":"demo"}'
后端测试结果：

用途：将满足条件的用户 ID 列表保存到 ClickHouse 的 audience_groups 表中。前端需要将“执行SQL查询”文本框中的sql语句进行加工，先判断是否为user_behavior，不是做前端提醒此客群不能保存，是此表则加工语句 只保留SELECT user_id  from user_behavior where…  （where 来源“执行SQL查询”文本框中的sql语句）
请求参数：
{
  "name": "高价值用户客群",
  "condition_sql": "SELECT user_id FROM user_behavior WHERE arpu > 150",
  "user_id": "demo"
}
后端调用链：
routes.py -> simple_agents.run_save_audience() -> services/audience_analysis.save_audience()
    -> 解析 SQL，提取 user_id 列表 -> 批量插入 ClickHouse audience_groups 表
响应示例：
{
  "status": "success",
  "audience_id": "aud_1713600000_abc123"
}
或失败时：
{
  "status": "error",
  "message": "数据库写入失败:…"
}
前端数据存放：保存成功后，将返回的 audience_id 和 name值存入前端状态（如 Pinia），用于后续产品运营页快速加载客群。或者在产品运营、客群运营的口径方式圈选客群方法中直接去后端数据库表查询去重后的name数据用于前端选择使用
4.多维分析（刷新右侧图表）
用途：根据客群基础 SQL，刷新客群分析页右侧的生命周期卡片、高/低价值分布图、雷达图、诊断表格。
前端直接写SQL调用后端数据表查询数据

示例1：生命周期卡片（入网期、成长期、成熟期、异动期、离网期的人数）
前端调用：
javascript
const response = await axios.post('/api/v1/audience/execute', {
  sql: `SELECT
          countIf(user_online < 6) AS 入网期,
          countIf(user_online >= 6 AND user_online < 18) AS 成长期,
          countIf(user_online >= 18 AND user_online < 36) AS 成熟期,
          countIf(user_online >= 36 AND user_online < 60) AS 异动期,
          countIf(user_online >= 60) AS 离网期
        FROM user_behavior
        WHERE arpu > 100`,
  user_id: 'demo'
});
const data = response.data.data[0]; // 一行数据，例如 [351800, 421600, 352100, 168200, 237800]
const lifecycleStages = ['入网期', '成长期', '成熟期', '异动期', '离网期'];

示例2：高/低价值分布（按生命周期阶段）
SQL：

SELECT
    CASE
        WHEN user_online < 6 THEN '入网期'
        WHEN user_online >= 6 AND user_online < 18 THEN '成长期'
        WHEN user_online >= 18 AND user_online < 36 THEN '成熟期'
        WHEN user_online >= 36 AND user_online < 60 THEN '异动期'
        ELSE '离网期'
    END AS stage,
    countIf(arpu > 80) AS high,
    countIf(arpu <= 80) AS low
FROM user_behavior
WHERE arpu > 100
GROUP BY stage

雷达图（需要六个维度的聚合值）
前端调用：
javascript
const response = await axios.post('/api/v1/audience/execute', { sql: ' SELECT
    sum(is_rhtc) AS 粘性,
    avg(arpu) AS 价值,
    sum(is_ywsk) AS 竞抢,
    sum(is_ts) AS 感知,
    sum(active_mark) AS 活跃,
    avg(call_opp_counts1) AS 传播
FROM user_behavior
WHERE arpu > 100
' });
const row = response.data.data[0]; // [粘性, 价值, 竞抢, 感知, 活跃, 传播]
const radarData = {
  粘性: row[0],
  价值: row[1],
  竞抢: row[2],
  感知: row[3],
  活跃: row[4],
  传播: row[5]
};

二、产品运营、客群运营
2.客群圈选模块
2.1种子扩散法
产品运营和客群运营相同
接口：POST /audience/seed
后端测试方式：
curl -X POST http://localhost:8000/api/v1/audience/seed \
  -H "Content-Type: application/json" \
  -d '{"seed_users": ["15920261137", "13699339034", "15760275517", "15058816216", "18610560861", "15358611248", "15841997554", "13185860072", "15057110343", "18847632788", "15289751741", "18217221999", "14518078062", "18136629918", "13331611711", "15188281246", "15577691888", "18046209267", "13401996855", "13600909572", "15501236834", "18182467956", "18569456782", "15251440387", "13345553301", "13808772628", "15285105216", "13957365267", "18606963778", "14542054568", "18866562347", "18527647631"],"target_count":100,"user_id":"demo"}'
后端测试结果：

用途：根据种子用户列表（user_id 或手机号），扩散出相似用户。
请求参数：
{
  "seed_users": ["15920261137", "13699339034", "15760275517", "15058816216", "18610560861", "15358611248", "15841997554", "13185860072", "15057110343", "18847632788", "15289751741", "18217221999", "14518078062", "18136629918", "13331611711", "15188281246", "15577691888", "18046209267", "13401996855", "13600909572", "15501236834", "18182467956", "18569456782", "15251440387", "13345553301", "13808772628", "15285105216", "13957365267", "18606963778", "14542054568", "18866562347", "18527647631"],
  "target_count": 100,
  "user_id": "demo"
}
后端调用链：
routes.py -> simple_agents.run_seed_expansion() -> services/audience_selection.seed_expansion()
    -> 调用 _batch_resolve_user_ids()、_get_user_feature_vector()、余弦相似度计算
响应示例：
{
  "audience_ids": ["user_001", "user_002", ...],
  "total": 1000
}
前端数据存放：将 audience_ids 保存到全局 store（如 Pinia）中，作为当前客群 ID 列表，供后续策略生成等使用。total 用于显示圈选用户数。

2.2 特征组合法（仅圈选，不返回表格）
产品运营和客群运营相同，
接口：POST /audience/feature
后端测试方法：
curl -X POST http://localhost:8000/api/v1/audience/feature \
  -H "Content-Type: application/json" \
  -d '{"condition":"测试客群","user_id":"demo"}
后端测试结果：
后端测试结果：

用途：根据自然语言条件圈选客群，或从已保存的客群名称读取用户清单。只返回 audience_ids 和总数，不返回表格数据（表格数据通过预览接口获取）。
请求参数：
// 使用已保存客群
{
  "audience_name": "高价值客群",
  "user_id": "demo"
}
后端调用链：
routes.py → simple_agents.run_feature_selection() → services/audience_selection.feature_selection()
响应示例：
{
  "audience_ids": ["user_001", "user_002", ...],
  "total": 5234
}
前端存放：将 audience_ids 存入全局 store，total 用于显示。
2.3 特征组合法预览（返回表格数据），展示前端没设计，可以忽略，留的口子以后可能会用
接口：POST /audience/feature/preview
用途：在圈选前预览部分用户数据（前 limit 条），用于运营者确认。表格中的 user_id 和 phone_num 已脱敏。
后端测试内容：
curl -X POST "http://localhost:8000/api/v1/audience/feature/preview?limit=10" \
  -H "Content-Type: application/json" \
  -d '{"audience_name":"测试客群","user_id":"demo"}'
测试结果：

请求参数（limit 为 query 参数）：
后端调用链：
routes.py -> simple_agents.run_feature_selection(need_preview=True) -> services/audience_selection.feature_selection()
    -> 执行预览 SQL，并对敏感字段脱敏
响应示例：
{
  "fields": ["user_id", "arpu", "city_id"],
  "data": [
    ["use****001", 120.5, "南京"],
    ["use****002", 135.0, "苏州"]
  ]
}
前端数据存放：用于预览表格（el-table），不需要长期存储。

2.4 产品适配客群法

接口：POST /audience/product
用途：根据产品 ID，圈选符合该产品目标用户类型的客群。
后端测试方法：
curl -X POST http://localhost:8000/api/v1/audience/product \
  -H "Content-Type: application/json" \
  -d '{"product_id":"600000416038","target_count":100,"user_id":"demo"}'
后端测试结果：

请求参数：
{
  "product_id": "P001",
  "target_count": 5000,
  "user_id": "demo"
}
后端调用链：
routes.py -> simple_agents.run_product_audience() -> services/audience_selection.product_audience()
    -> 查询产品表获取 target_user_type -> 映射为 SQL 条件 -> 执行查询
响应示例：
{
  "audience_ids": ["user_001", ...],
  "total": 5000
}
前端数据存放：同 2.1。

2.5 导入用户清单法

接口：POST /audience/import
用途：上传 CSV 文件（base64 编码），每行一个 user_id 或手机号，后端匹配数据库中存在的用户。
注释：function readFileAsBase64(file, fileType, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result.split(',')[1]; // 去掉 data:...;base64, 前缀
        callback(base64);
    };
    reader.readAsDataURL(file);
}
请求参数：
{
  "file_content": "base64编码的文件内容",
  "file_type": "xlsx",   // 或 "csv", "txt"
  "user_id": "demo"
}后端调用链：
routes.py -> simple_agents.run_import_audience() -> services/audience_selection.import_audience()
    -> base64 解码 -> 调用 _batch_resolve_user_ids() 匹配数据库
响应示例：
{
  "audience_ids": ["user_001", "user_002", ...],
  "total": 1200
}
前端数据存放：同 2.1。

3.产品推荐模块
3.1 基于文本推荐产品

接口：POST /product/recommend_by_text
用途：根据用户输入的文本（运营目标、产品描述等），推荐 TOP4 产品。
后端接口测试：
curl -X POST http://localhost:8000/api/v1/product/recommend_by_text \
  -H "Content-Type: application/json" \
  -d '{"user_input":"推广5G流量包","user_id":"demo"}'
后端接口测试结果：

请求参数：
{
  "user_input": "我想推广5G流量包给高流量用户",
  "user_id": "demo"
}
后端调用链：
routes.py -> simple_agents.run_recommend_by_text() -> services/product_recommend.recommend_by_text()
    -> LLM 生成候选产品名 -> 向量检索产品库 -> 返回产品详情
响应示例：
{
  "products": [
    {
      "id": "P001",
      "name": "5G尊享流量包(50G)",
      "category": "流量包",
      "price": "29.00",
      "description": "5G高速流量50GB",
      "applicable_scope": "全国通用"
    },
    ...
  ]
}
前端数据存放：存入组件状态，用于渲染产品卡片列表，放在下方

3.2 基于客群推荐产品—只涉及客群运营页面
客群运营页圈选客群后点击“产品推荐”则调用此接口
接口：POST /product/recommend_by_audience
用途：根据已圈选的客群 ID 列表，推荐 TOP4 产品。
后端接口测试：
curl -X POST http://localhost:8000/api/v1/product/recommend_by_audience \
  -H "Content-Type: application/json" \
  -d '{"audience_ids":["15920261137", "13699339034", "15760275517", "15058816216", "18610560861", "15358611248", "15841997554", "13185860072", "15057110343", "18847632788", "15289751741", "18217221999", "14518078062", "18136629918", "13331611711", "15188281246", "15577691888", "18046209267", "13401996855", "13600909572", "15501236834", "18182467956", "18569456782", "15251440387", "13345553301", "13808772628", "15285105216", "13957365267", "18606963778", "14542054568", "18866562347", "18527647631"],"user_input":"希望提升ARPU","user_id":"demo"}'
后端接口测试结果：

请求参数：
{
  "audience_ids": ["user_001", "user_002", ...],
  "user_input": "希望提升ARPU",
  "user_id": "demo"
}
后端调用链：
routes.py -> simple_agents.run_recommend_by_audience() -> services/product_recommend.recommend_by_audience()
    -> 聚合客群特征 -> LLM 生成候选产品名 -> 向量检索匹配产品库
响应示例：同 3.1。
前端数据存放：同 3.1。
3.3 前端搜索推荐产品

模糊搜索数据库产品部的名称，选择后替换第一个产品。
接口：POST  /products/search
参数名	类型	必填	默认值	说明
keyword	string	是	无	搜索关键词，至少2个字符（少于2个字符时返回空列表）。
limit	integer	否	20	返回的最大产品数量。
用途：前端模糊选择产品到下方产品卡片
后端接口测试：curl http://localhost:8000/api/v1/products/search?keyword=5G&limit=3
测试结果：
{
  "products": [
    {
      "id": "P001",
      "name": "5G尊享流量包(50G)",
      "category": "流量包",
      "price": "29.00",
      "description": "5G高速流量50GB",
      "applicable_scope": "全国通用"
    }
  ]
}

四、策略生成模块
4.1 生成策略

此处用户输入补充信息后点击“生成策略”调用下方接口获取返回值。分为有客群和无客群两种接口调用，参数不同，若用户上方选择了客群则要传入客群参数，若无客群则传入无客群的接口参数
接口：POST /strategy/generate
用途：根据产品 ID、客群 ID（可选）、用户输入，生成营销策略（包含名称、类别、活动说明、活动政策、扣费方式、有效期、权益内容、适用条件等）。
后端测试：
二者区别是参数差一个audience_ids
无客群接口
curl -X POST http://localhost:8000/api/v1/strategy/generate \
  -H "Content-Type: application/json" \
  -d '{"product_ids":["600000416038"],"goal":"提升5G流量包订购率","user_id":"demo"}'
有客群
curl -X POST http://localhost:8000/api/v1/strategy/generate \
  -H "Content-Type: application/json" \
  -d '{
    "product_ids": ["600000416038"],
    "audience_ids": ["15920261137", "13699339034", "15760275517", "15058816216", "18610560861", "15358611248", "15841997554", "13185860072"],
    "goal": "提升5G流量包订购率",
    "user_id": "demo"
  }'
后端你测试结果：
无客群

有客群

请求参数：
{
  "product_ids": ["P001"],
  "audience_ids": ["user_001", "user_002", ...],
  "goal": "提升5G流量包订购率",
  "user_id": "demo"
}
后端调用链：
routes.py -> simple_agents.run_generate_strategy() -> services/strategy_generation.generate_strategy()
-> 查询产品信息 -> 检索历史相似策略 -> LLM 生成策略 JSON -> 保存到 PostgreSQL -> 向量化存储
字段说明：
字段	类型	说明	前端对应位置
name	string	策略名称	显示在策略名称输入框，可编辑。
category	string	策略类别（如“升级”、“挽留”、“激活”、“交叉销售”）	显示在下拉框或只读标签，可编辑。
description	string	策略摘要描述（与 activity_desc 相同）	可用于卡片预览。
activity_desc	string	活动详细说明（如“充值100元送20元”）	显示在“活动说明”文本域，可编辑。
activity_policy	string	活动政策（如“优惠力度：8折”）	显示在“活动政策”输入框，可编辑。
charge_method	string	扣费方式（如“一次性扣费”、“按月扣费”）	显示在“扣费方式”输入框，可编辑。
valid_period	string	有效期（如“30天”、“当月有效”）	显示在“有效期”输入框，可编辑。
rights_content	string	权益内容（如“赠送10GB定向流量”、“天翼云盘2个月会员”）	显示在“权益内容”输入框，可编辑。
conditions	string	适用条件（客群特征总结，如“1. 客群年轻化，平均年龄30岁；2. ……”）	显示在“适用条件”文本域，可编辑。
audience_scale	int (或 null)	客群规模（用户数量），仅当请求中传入了 audience_ids 时才有值，否则为 null	显示在“客群规模”只读字段，让运营者了解运营范围。

响应示例：
{
  "strategy_id": "STR_abc123",
  "detail": {
    "name": "5G流量包推广策略",
    "category": "升级",
    "description": "活动说明：充值100元送20元",
    "activity_desc": "活动说明：充值100元送20元",
    "activity_policy": "优惠力度：8折",
    "charge_method": "一次性扣费",
    "valid_period": "30天",
    "rights_content": "赠送10GB定向流量",
    "conditions": "1. 客群年轻化，平均年龄30岁；2. 客群高端化，平均ARPU 150元；...",
    "audience_scale": 5234
  }
}

前端数据存放：

strategy_id 存储用于后续执行优化和评估。
detail 中的各字段分别绑定到策略配置表单的对应输入框（如策略名称、类别、描述、政策、扣费方式等），供用户二次修改。

五、策略执行优化模块
5.1 执行优化

此处用户输入补充信息后点击“生成策略”调用下方接口获取返回值，strategy_id参数为上方生成的错略编码
接口：POST /execution/optimize
后端接口测试：
curl -X POST http://localhost:8000/api/v1/execution/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "user_input": "希望提高转化率",
    "product_ids": ["600000416038"],
    "strategy_id": "STR_34f97129",
    "user_id": "demo"
  }'
后端接口测试结果：

用途：根据策略 ID、产品 ID、客群 ID，生成推荐渠道（2个）、每个渠道2套话术、波次数量、间隔、最佳营销时刻。
请求参数：
{
  "user_input": "希望提高转化率",
  "product_ids": ["P001"],
  "strategy_id": "STR_abc123",
  "user_id": "demo"
}
后端调用链：
routes.py -> simple_agents.run_optimize_execution() -> services/execution_optimization.optimize_execution()
    -> 查询策略、产品 -> 检索历史相似策略 -> LLM 生成执行方案 -> 保存话术和执行计划到数据库
响应示例：会生成2个推荐渠道，每个渠道2套话术
{
  "channels": [
    {
      "channel": "短信",
      "scripts": [
        "尊敬的用户，您专属的流量优惠已上线，点击领取30GB免费流量，限时7天有效！",
        "亲爱的用户，您的5G流量包限时8折，回复“LL”立即办理，畅享高速网络！"
      ]
    },
    {
      "channel": "APP推送",
      "scripts": [
        "打开APP首页，领取您的5G专享流量包，最高50GB，立即体验！",
        "APP会员日特惠：5G流量包直降20元，仅限今日！"
      ]
    }
  ],
  "wave_count": 3,
  "wave_interval_hours": 48,
  "time_preference": {
    "weekdays": ["一", "三", "五"],
    "times": ["18:00", "20:00"]
  },
  "plan_id": "PLAN_8a3f2b1c",
  "script_ids": ["SCR_6e7f2a3b", "SCR_9c8d4e5f", "SCR_1a2b3c4d", "SCR_5e6f7g8h"]
字段说明：
字段	类型	说明
channels	数组	两个推荐渠道，每个渠道包含 channel（渠道名称）和 scripts（2套话术）。
wave_count	整型	营销波次数量（1-5）。
wave_interval_hours	整型	波次间隔时间（小时）。
time_preference	对象	最佳营销时刻，包含 weekdays（星期偏好，使用中文数字）和 times（具体时刻列表）。
plan_id	字符串	执行计划ID，存储在数据库中的唯一标识。
script_ids	字符串数组	生成的四套话术对应的ID，每套话术一条记录。
}前端数据存放：
channels → 渲染两个渠道卡片，支持单选主推渠道。每个渠道下的 scripts 数组用于展示对应的话术卡片（2个），支持单选主推话术。
wave_count 和 wave_interval_hours → 用于展示波次配置（如条形图或选择器）。
time_preference → 用于展示星期多选和时刻多选。
plan_id、script_ids 用于后续发布接口。

六、效果评估模块
6.1 评估策略效果

此处用户输入补充信息后点击“生成策略”调用下方接口获取返回值

接口：POST /evaluation
用途：根据策略 ID，预测转化率、ROI、接通率（基于历史相似策略加权平均）。
后端接口测试：
curl -X POST http://localhost:8000/api/v1/evaluation \
  -H "Content-Type: application/json" \
  -d '{"strategy_id":"STR_34f97129","user_id":"demo"}'
后端接口测试结果：

请求参数：
{
  "strategy_id": "STR_abc123",
  "user_id": "demo"
}

后端测试结果：

后端调用链：
routes.py -> simple_agents.run_evaluate_strategy() -> services/evaluation.evaluate_strategy()
    -> 向量检索相似策略 -> 加权平均计算
响应示例：

{
  "predicted_conversion_rate": 0.1832,
  "predicted_roi": 2.15,
  "predicted_click_rate": 0.52
}
前端数据存放：用于显示三个指标卡片（预测转化率、ROI、接通率），可配合趋势箭头（上升/下降）展示。

七、策略发布模块
7.1 发布策略
这里前端直接调用SQL向数据库插入数据，目前此处可以先不往里插入数据，因为插入数据用于后面运营评估所需：涉及运营清单更新、策略表状态更新、产品表状态更新
接口：POST /publish
用途：将本次运营的客群清单、策略、产品、执行计划等信息写入 ClickHouse 运营用户清单表（user_strategies），实现运营记录持久化。
请求参数：这
{
  "strategy_id": "STR_abc123",
  "product_ids": ["P001"],
  "audience_ids": ["user_001", "user_002", ...],
  "plan_id": "PLAN_xyz",
  "script_ids": ["SCR_111", "SCR_222", "SCR_333", "SCR_444"],
  "user_id": "demo"
}
后端调用链：
routes.py -> 直接执行 ClickHouse INSERT，不使用智能体。
响应示例：
{
  "message": "发布成功，已写入 5234 条用户记录"
}
前端数据存放：显示成功提示，无需存储。
十、辅助接口
10.1 获取 ClickHouse 可用字段(过滤敏感字段您使用)
接口：GET /clickhouse/fields
后端测试方式：curl http://localhost:8000/api/v1/clickhouse/fields
用途：获取 user_behavior 表的所有字段（已过滤敏感字段），用于前端字段选择。
响应：
{
  "fields": ["user_id", "arpu", "city_id", "age", "dou", ...]
}
10.2 获取产品列表
接口：GET /products
后端测试方式：curl http://localhost:8000/api/v1/products
后端测试结果：
用途：获取所有上架产品。
响应：
{
"products":[
{
"id":"1",
"name":"畅享套餐88元",
"category":"个人套餐",
"price":"88.0",
"description":"包含20GB流量+500分钟通话",
"applicable_scope":"全国"
  ]
}
10.3 获取策略列表
接口：GET /strategies
后端测试方式：curl http://localhost:8000/api/v1/strategies
后端测试结果：

用途：获取所有已保存的策略。
响应：
{
  "strategies": [
    {
      "id": "STR_abc123",
      "name": "5G流量包推广策略",
      "category": "升级",
      "description": "推出6个月轻合约流量包，月费21元享5GB国内通用流量"
    }
  ]
}
10.4 健康检查
接口：GET /health
后端测试方法：curl http://localhost:8000/api/v1/health
结果：root@iZ2ze0upv30g53cdxbv7pmZ:~# curl http://localhost:8000/api/v1/health
{"status":"ok"}root@iZ2ze0upv30g53cdxbv7pmZ:~#
响应：{"status":"ok"}

十一、异步任务结果轮询
接口：GET /result/{task_id}

用途：轮询全流程异步任务的执行结果。
响应：
进行中：{"status": "pending"}
成功：{"status": "completed", "data": {...}}
失败：{"status": "failed", "data": {"error": "..."}}
十二、错误处理
所有接口在发生错误时返回 HTTP 4xx/5xx，响应体格式：
{
  "detail": "具体错误描述"
}
前端应捕获并显示错误提示（如 ElMessage.error）。
