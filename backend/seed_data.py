import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from common.database import get_db
from common.auth import generate_token
from models.user import User
from models.plan import Plan
from models.activity import Activity
from models.live_session import LiveSession
from models.review import Review
from models.feedback import Feedback
from models.participant import Participant


def seed():
    db = get_db()

    db.users.drop()
    db.plans.drop()
    db.activities.drop()
    db.live_sessions.drop()
    db.reviews.drop()
    db.feedbacks.drop()
    db.participants.drop()

    print('已清空所有集合')

    user_data = {
        'openid': 'dev_test_openid',
        'nickname': '张培训',
        'avatar': '',
        'phone': '13800138000',
        'company': '示例培训公司',
        'role': 'trainer'
    }
    user = User.create(user_data)
    db.users.insert_one(user)
    user_id = str(user['_id'])
    token = generate_token(user_id)
    print(f'用户已创建: {user_data["nickname"]} (ID: {user_id})')
    print(f'Token: {token}')

    plans_data = [
        {
            'name': '新员工融入培训',
            'type': Plan.TYPE_IMPROV_TRAINING,
            'status': Plan.STATUS_DRAFT,
            'people': 20,
            'clientName': 'ABC科技',
            'phases': [
                {'name': '破冰环节', 'duration': 15, 'activities': []},
                {'name': '团队协作', 'duration': 30, 'activities': []},
                {'name': '创意激发', 'duration': 20, 'activities': []},
                {'name': '总结反思', 'duration': 15, 'activities': []}
            ],
            'date': '2026-06-01',
            'duration': 80,
            'tags': ['新员工', '融入', '团队']
        },
        {
            'name': '团队协作工作坊',
            'type': Plan.TYPE_WORKSHOP,
            'status': Plan.STATUS_CONFIRMED,
            'people': 15,
            'clientName': 'XYZ集团',
            'phases': [
                {'name': '热身活动', 'duration': 10, 'activities': []},
                {'name': '协作挑战', 'duration': 40, 'activities': []},
                {'name': '复盘分享', 'duration': 20, 'activities': []}
            ],
            'date': '2026-05-28',
            'duration': 70,
            'tags': ['协作', '工作坊', '沟通']
        },
        {
            'name': '领导力发展训练',
            'type': Plan.TYPE_TEAM_BUILDING,
            'status': Plan.STATUS_DELIVERED,
            'people': 12,
            'clientName': 'MNC公司',
            'phases': [
                {'name': '能量激活', 'duration': 10, 'activities': []},
                {'name': '领导力模拟', 'duration': 35, 'activities': []},
                {'name': '反思总结', 'duration': 15, 'activities': []}
            ],
            'date': '2026-05-20',
            'duration': 60,
            'tags': ['领导力', '发展', '管理']
        }
    ]

    plan_ids = []
    for pd in plans_data:
        plan = Plan.create(user_id, pd)
        plan['status'] = pd['status']
        db.plans.insert_one(plan)
        plan_ids.append(plan['_id'])
        print(f'方案已创建: {pd["name"]} ({pd["status"]})')

    activities_data = [
        {
            'name': '名字接龙',
            'category': Activity.CATEGORY_ICEBREAKER,
            'duration': 15,
            'description': '参与者围成一圈，依次说出自己的名字并加上一个动作，下一个人需要重复前一个人的名字和动作，再加上自己的。',
            'rules': '1. 围成一圈站立\n2. 第一个人说名字+做动作\n3. 下一个人重复前面所有人的名字和动作\n4. 说错或做错的人表演小节目',
            'materials': ['无特殊材料'],
            'steps': ['围圈站立', '示范规则', '开始接龙', '逐渐加速', '总结分享'],
            'tips': ['控制人数在15人以内', '可以分组进行', '鼓励夸张动作'],
            'variations': ['加入职业描述', '加入爱好描述'],
            'minPeople': 5,
            'maxPeople': 15,
            'intensity': 'low',
            'source': 'builtin',
            'isFavorite': True,
            'isCustom': False
        },
        {
            'name': '能量传递',
            'category': Activity.CATEGORY_ENERGY,
            'duration': 10,
            'description': '通过快速传递物品和喊名字来激活团队能量，提升反应速度和团队默契。',
            'rules': '1. 围成一圈\n2. 传递球的同时喊出接球人的名字\n3. 逐渐增加球的数量\n4. 掉球则重新开始',
            'materials': ['软球3-5个'],
            'steps': ['围圈站立', '单人传球练习', '增加球数', '计时挑战', '庆祝成功'],
            'tips': ['使用软球避免受伤', '先从1个球开始', '注意安全距离'],
            'variations': ['反向传球', '闭眼传球'],
            'minPeople': 6,
            'maxPeople': 20,
            'intensity': 'medium',
            'source': 'builtin',
            'isFavorite': False,
            'isCustom': False
        },
        {
            'name': '盲画合作',
            'category': Activity.CATEGORY_COLLABORATION,
            'duration': 20,
            'description': '两人一组，一人描述一人画，但不能看到对方的画。锻炼沟通能力和换位思考。',
            'rules': '1. 两人一组背对背坐\n2. 描述者看图描述\n3. 画者根据描述作画\n4. 不能说出图中物体的名称\n5. 5分钟后对比原图和画作',
            'materials': ['图片卡', '画纸', '彩笔'],
            'steps': ['分组配对', '发放材料', '说明规则', '开始描述绘画', '展示对比', '分享感受'],
            'tips': ['选择简单但有趣的图片', '提醒不能说名称', '鼓励创造性描述'],
            'variations': ['三轮递进（简单→中等→复杂）', '团队版（多人描述一人画）'],
            'minPeople': 4,
            'maxPeople': 20,
            'intensity': 'low',
            'source': 'builtin',
            'isFavorite': True,
            'isCustom': False
        },
        {
            'name': '即兴故事接龙',
            'category': Activity.CATEGORY_CREATIVITY,
            'duration': 15,
            'description': '每人一句话接龙编故事，锻炼即兴表达和创意思维。',
            'rules': '1. 给出故事开头\n2. 每人接一句话\n3. 必须承接上一句的逻辑\n4. 不能否定前人的设定\n5. 故事要有起承转合',
            'materials': ['计时器', '主题卡'],
            'steps': ['说明规则', '抽取主题', '开始接龙', '故事收尾', '评选最有趣情节'],
            'tips': ['提供有趣的主题', '控制每人思考时间5秒', '鼓励大胆创意'],
            'variations': ['加入关键词限制', '指定情感基调'],
            'minPeople': 4,
            'maxPeople': 12,
            'intensity': 'medium',
            'source': 'builtin',
            'isFavorite': False,
            'isCustom': False
        },
        {
            'name': '一分钟复盘',
            'category': Activity.CATEGORY_REFLECTION,
            'duration': 10,
            'description': '快速反思活动，每人用一分钟分享一个关键词和感受，帮助团队沉淀经验。',
            'rules': '1. 每人1分钟时间\n2. 必须说出一个关键词\n3. 围绕关键词分享感受\n4. 其他人只听不评论\n5. 所有人分享完后自由讨论',
            'materials': ['计时器'],
            'steps': ['说明规则', '示范分享', '轮流分享', '关键词汇总', '自由讨论'],
            'tips': ['营造安全氛围', '不评判他人分享', '记录关键词用于后续复盘'],
            'variations': ['写关键词贴墙上', '用图画代替语言'],
            'minPeople': 3,
            'maxPeople': 20,
            'intensity': 'low',
            'source': 'builtin',
            'isFavorite': False,
            'isCustom': False
        }
    ]

    for ad in activities_data:
        activity = Activity.create(user_id, ad)
        db.activities.insert_one(activity)
        print(f'活动已创建: {ad["name"]} ({ad["category"]})')

    session = LiveSession.create(user_id, {
        'planId': str(plan_ids[2]),
        'planName': '领导力发展训练',
        'planSnapshot': {}
    })
    session['phase'] = LiveSession.PHASE_ENDED
    session['startTime'] = datetime.utcnow() - timedelta(days=4)
    session['duration'] = 3600
    db.live_sessions.insert_one(session)
    print(f'现场会话已创建: 领导力发展训练 (已结束)')

    review = Review.create(user_id, {
        'planId': str(plan_ids[2]),
        'planName': '领导力发展训练',
        'sessionId': str(session['_id']),
        'method': Review.METHOD_ORID,
        'reviewNotes': 'O: 参与者普遍反馈活动节奏紧凑，领导力模拟环节印象深刻\nR: 多数人感到兴奋和挑战，部分人觉得时间不够\nI: 团队意识到领导力不仅是决策，更是倾听和引导\nD: 下次增加反思环节时间，减少热身环节',
        'feedbackSummary': {
            'avgStars': 4.5,
            'nps': 80,
            'keywords': ['挑战', '收获', '紧凑', '倾听']
        }
    })
    review['completedAt'] = datetime.utcnow() - timedelta(days=4)
    db.reviews.insert_one(review)
    print(f'复盘已创建: ORID 方法')

    feedbacks_data = [
        {
            'sessionId': str(session['_id']),
            'anonymousId': 'anon_001',
            'isAnonymous': True,
            'stars': 5,
            'nps': 9,
            'keywords': ['挑战', '收获大'],
            'text': '非常有收获的培训，领导力模拟环节让我深刻理解了倾听的重要性。'
        },
        {
            'sessionId': str(session['_id']),
            'anonymousId': 'anon_002',
            'isAnonymous': True,
            'stars': 4,
            'nps': 7,
            'keywords': ['紧凑', '时间短'],
            'text': '整体不错，但反思环节时间太短了，希望能多留一些时间讨论。'
        }
    ]

    for fd in feedbacks_data:
        feedback = Feedback.create(fd)
        db.feedbacks.insert_one(feedback)
    print(f'反馈已创建: {len(feedbacks_data)} 条')

    print('\n========== 数据填充完成 ==========')
    print(f'用户: 1 个')
    print(f'方案: {len(plans_data)} 个')
    print(f'活动: {len(activities_data)} 个')
    print(f'现场会话: 1 个')
    print(f'复盘: 1 个')
    print(f'反馈: {len(feedbacks_data)} 条')
    print(f'\n测试 Token:\n{token}')
    print(f'\n使用方式: 在请求头添加 Authorization: Bearer {token}')


if __name__ == '__main__':
    seed()
