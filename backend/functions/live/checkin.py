import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, get_db
from common.errors import ErrorCode
from common.validators import validate_object_id
from models.participant import Participant
from datetime import datetime


def main(event, context):
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
    session = db.live_sessions.find_one({'_id': ObjectId(session_id)})
    if not session:
        return error('场次不存在', ErrorCode.NOT_FOUND, 404)

    if session.get('phase') == 'ended':
        return error('场次已结束', ErrorCode.STATUS_ERROR, 400)

    openid = data.get('openid', '')
    existing = db.participants.find_one({'sessionId': session_id, 'openid': openid})
    if existing:
        return error('已签到', ErrorCode.ALREADY_EXISTS, 400)

    participant_data = {
        'sessionId': session_id,
        'openid': openid,
        'name': data.get('name', ''),
        'avatar': data.get('avatar', ''),
        'checkedIn': True,
        'groupId': data.get('groupId', ''),
        'score': 0
    }
    participant = Participant.create(participant_data)
    participant['checkinTime'] = datetime.utcnow()

    try:
        db.participants.insert_one(participant)
        db.live_sessions.update_one(
            {'_id': ObjectId(session_id)},
            {'$push': {'participants': str(participant['_id'])}, '$set': {'updatedAt': datetime.utcnow()}}
        )
        return success(Participant.to_dict(participant))
    except Exception as e:
        return error(f'签到失败: {str(e)}', ErrorCode.DB_ERROR, 500)
