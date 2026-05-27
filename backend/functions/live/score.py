import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.errors import ErrorCode
from common.validators import validate_object_id, validate_range
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
    group_id = data.get('groupId', '')
    score = data.get('score')

    if not session_id:
        return error('缺少场次ID', ErrorCode.PARAM_ERROR, 400)

    valid, msg = validate_object_id(session_id, '会话ID')
    if not valid:
        return error(msg, ErrorCode.PARAM_ERROR, 400)

    if not participant_id and not group_id:
        return error('缺少评分对象', ErrorCode.PARAM_ERROR, 400)
    if participant_id:
        valid, msg = validate_object_id(participant_id, '参与者ID')
        if not valid:
            return error(msg, ErrorCode.PARAM_ERROR, 400)
    if score is None:
        return error('缺少分数', ErrorCode.PARAM_ERROR, 400)
    valid, msg = validate_range(score, 0, 9999, '分数')
    if not valid:
        return error(msg, ErrorCode.PARAM_ERROR, 400)
    score = float(score)
    if score.is_integer():
        score = int(score)

    db = get_db()
    from bson import ObjectId
    session = db.live_sessions.find_one({'_id': ObjectId(session_id), 'userId': user_id})
    if not session:
        return error('场次不存在', ErrorCode.NOT_FOUND, 404)

    try:
        scores = session.get('scores', {})

        if participant_id:
            participant = db.participants.find_one({'_id': ObjectId(participant_id), 'sessionId': session_id})
            if not participant:
                return error('参与者不存在', ErrorCode.NOT_FOUND, 404)
            db.participants.update_one(
                {'_id': ObjectId(participant_id)},
                {'$set': {'score': score}}
            )
            scores[participant_id] = score
            db.live_sessions.update_one(
                {'_id': ObjectId(session_id)},
                {'$set': {'scores': scores, 'updatedAt': datetime.utcnow()}}
            )
            return success({'participantId': participant_id, 'score': score})

        groups = session.get('groups', [])
        found = False
        updated_groups = []
        for group in groups:
            next_group = dict(group)
            if next_group.get('groupId') == group_id:
                next_group['score'] = score
                found = True
            updated_groups.append(next_group)
        if not found:
            return error('分组不存在', ErrorCode.NOT_FOUND, 404)
        scores[group_id] = score
        db.live_sessions.update_one(
            {'_id': ObjectId(session_id)},
            {'$set': {'groups': updated_groups, 'scores': scores, 'updatedAt': datetime.utcnow()}}
        )
        return success({'groupId': group_id, 'score': score})
    except Exception as e:
        return error(f'评分失败: {str(e)}', ErrorCode.DB_ERROR, 500)
