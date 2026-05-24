import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.errors import ErrorCode
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

    db = get_db()
    from bson import ObjectId
    plan = db.plans.find_one({'_id': ObjectId(plan_id), 'userId': user_id})

    if not plan:
        return error('方案不存在', ErrorCode.NOT_FOUND, 404)

    if not Plan.can_deliver(plan['status']):
        return error('当前方案状态不允许开始实施', ErrorCode.STATUS_ERROR, 400)

    existing = db.live_sessions.find_one({
        'planId': plan_id,
        'userId': user_id,
        'phase': {'$ne': LiveSession.PHASE_ENDED}
    })
    if existing:
        return success(LiveSession.to_dict(existing))

    plan_snapshot = Plan.to_dict(plan)

    session_data = {
        'planId': plan_id,
        'planName': plan.get('name', ''),
        'planSnapshot': plan_snapshot
    }
    session = LiveSession.create(user_id, session_data)

    try:
        db.live_sessions.insert_one(session)
        db.plans.update_one(
            {'_id': ObjectId(plan_id)},
            {'$set': {'sessionId': str(session['_id']), 'updatedAt': datetime.utcnow()}}
        )
        return success(LiveSession.to_dict(session))
    except Exception as e:
        return error(f'开始实施失败: {str(e)}', ErrorCode.DB_ERROR, 500)
