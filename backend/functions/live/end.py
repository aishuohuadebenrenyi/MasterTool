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

    session_id = data.get('sessionId', '')
    if not session_id:
        return error('缺少场次ID', ErrorCode.PARAM_ERROR, 400)

    valid, msg = validate_object_id(session_id, '会话ID')
    if not valid:
        return error(msg, ErrorCode.PARAM_ERROR, 400)

    db = get_db()
    from bson import ObjectId
    session = db.live_sessions.find_one({'_id': ObjectId(session_id), 'userId': user_id})

    if not session:
        return error('场次不存在', ErrorCode.NOT_FOUND, 404)

    if session['phase'] == LiveSession.PHASE_ENDED:
        return error('场次已结束', ErrorCode.STATUS_ERROR, 400)

    now = datetime.utcnow()
    start_time = session.get('startTime', now)
    if isinstance(start_time, datetime):
        duration = int((now - start_time).total_seconds() / 60)
    else:
        duration = 0

    try:
        db.live_sessions.update_one(
            {'_id': ObjectId(session_id)},
            {'$set': {
                'phase': LiveSession.PHASE_ENDED,
                'duration': duration,
                'updatedAt': now
            }}
        )
        if session.get('planId'):
            # 方案在这里才正式进入 delivered，表示本次现场已经完整结束并可进入反馈/复盘环节。
            db.plans.update_one(
                {'_id': ObjectId(session['planId']), 'userId': user_id},
                {'$set': {'status': Plan.STATUS_DELIVERED, 'sessionId': session_id, 'updatedAt': now}}
            )
        updated_session = db.live_sessions.find_one({'_id': ObjectId(session_id)})
        return success(LiveSession.to_dict(updated_session))
    except Exception as e:
        return error(f'结束场次失败: {str(e)}', ErrorCode.DB_ERROR, 500)
