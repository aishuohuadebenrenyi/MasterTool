import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.errors import ErrorCode
from common.validators import validate_object_id


@require_auth
def main(event, context):
    user_id = event.get('userId')
    query = event.get('queryStringParameters', {})
    session_id = query.get('sessionId', '')

    if not session_id:
        return error('缺少sessionId', ErrorCode.PARAM_ERROR, 400)

    valid, msg = validate_object_id(session_id, '会话ID')
    if not valid:
        return error(msg, ErrorCode.PARAM_ERROR, 400)

    db = get_db()
    from bson import ObjectId

    session = db.live_sessions.find_one({'_id': ObjectId(session_id), 'userId': user_id})
    if not session:
        return error('场次不存在', ErrorCode.NOT_FOUND, 404)

    participants = list(db.participants.find({'sessionId': session_id}).sort('checkinTime', -1))

    from models.participant import Participant
    result = [Participant.to_dict(p) for p in participants]

    return success(result)
