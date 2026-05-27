import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.errors import ErrorCode
from common.validators import validate_object_id
from models.live_session import LiveSession
from models.plan import Plan
from datetime import datetime


@require_auth
def main(event, context):
    user_id = event.get('userId')
    data = event.get('body', {})

    if isinstance(data, str):
        import json
        try:
            data = json.loads(data)
        except json.JSONDecodeError:
            return error('无效的请求数据', ErrorCode.PARAM_ERROR, 400)

    plan_id = data.get('planId', '')
    if not plan_id:
        return error('缺少方案ID', ErrorCode.PARAM_ERROR, 400)
    valid, msg = validate_object_id(plan_id, '方案ID')
    if not valid:
        return error(msg, ErrorCode.PARAM_ERROR, 400)

    db = get_db()
    from bson import ObjectId
    plan = db.plans.find_one({'_id': ObjectId(plan_id), 'userId': user_id})

    if not plan:
        return error('方案不存在', ErrorCode.NOT_FOUND, 404)

    if not Plan.can_deliver(plan['status']):
        return error('当前方案状态不允许开始实施', ErrorCode.STATUS_ERROR, 400)

    # 同一方案在未结束前只保留一个活跃 session，重复开课直接返回现有场次，避免并发创建脏数据。
    existing = db.live_sessions.find_one({
        'planId': plan_id,
        'userId': user_id,
        'phase': {'$ne': LiveSession.PHASE_ENDED}
    })
    if existing:
        return success(LiveSession.to_dict(existing))

    # 开课时复制一份方案快照到 session，后续即使方案详情被调整，现场仍按当次开课版本执行。
    plan_snapshot = Plan.to_dict(plan)

    session_data = {
        'planId': plan_id,
        'planName': plan.get('name', ''),
        'planSnapshot': plan_snapshot
    }
    session = LiveSession.create(user_id, session_data)

    try:
        db.live_sessions.insert_one(session)
        # 这里只回写 sessionId 建立链路，不把方案直接改成 delivered。
        # 交付完成的业务语义发生在 live/end，避免“刚开始就算已交付”。
        db.plans.update_one(
            {'_id': ObjectId(plan_id)},
            {'$set': {'sessionId': str(session['_id']), 'updatedAt': datetime.utcnow()}}
        )
        return success(LiveSession.to_dict(session))
    except Exception as e:
        return error(f'开始实施失败: {str(e)}', ErrorCode.DB_ERROR, 500)
