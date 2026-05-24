import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.errors import ErrorCode
from common.validators import validate_object_id
import random


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

    participants = list(db.participants.find({'sessionId': session_id, 'checkedIn': True}))
    if not participants:
        return error('没有已签到的参与者', ErrorCode.NOT_FOUND, 404)

    group_id = data.get('groupId', '')
    if group_id:
        participants = [p for p in participants if p.get('groupId') == group_id]
        if not participants:
            return error('该分组没有已签到的参与者', ErrorCode.NOT_FOUND, 404)

    picked = random.choice(participants)

    from models.participant import Participant
    return success(Participant.to_dict(picked))
