import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.errors import ErrorCode
from common.validators import validate_object_id
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
    participant_id = data.get('participantId', '')
    score = data.get('score')

    if not session_id:
        return error('缺少场次ID', ErrorCode.PARAM_ERROR, 400)

    valid, msg = validate_object_id(session_id, '会话ID')
    if not valid:
        return error(msg, ErrorCode.PARAM_ERROR, 400)

    if not participant_id:
        return error('缺少参与者ID', ErrorCode.PARAM_ERROR, 400)
    if score is None:
        return error('缺少分数', ErrorCode.PARAM_ERROR, 400)

    db = get_db()
    from bson import ObjectId
    session = db.live_sessions.find_one({'_id': ObjectId(session_id), 'userId': user_id})
    if not session:
        return error('场次不存在', ErrorCode.NOT_FOUND, 404)

    participant = db.participants.find_one({'_id': ObjectId(participant_id), 'sessionId': session_id})
    if not participant:
        return error('参与者不存在', ErrorCode.NOT_FOUND, 404)

    try:
        db.participants.update_one(
            {'_id': ObjectId(participant_id)},
            {'$set': {'score': score}}
        )
        scores = session.get('scores', {})
        scores[participant_id] = score
        db.live_sessions.update_one(
            {'_id': ObjectId(session_id)},
            {'$set': {'scores': scores, 'updatedAt': datetime.utcnow()}}
        )
        return success({'participantId': participant_id, 'score': score})
    except Exception as e:
        return error(f'评分失败: {str(e)}', ErrorCode.DB_ERROR, 500)
