import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, get_db
from common.errors import ErrorCode
from common.validators import validate_object_id, validate_range
from models.feedback import Feedback


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
    valid, msg = validate_object_id(session_id, '场次ID')
    if not valid:
        return error(msg, ErrorCode.PARAM_ERROR, 400)
    rating = data.get('rating', data.get('stars'))
    if rating is not None:
        valid, msg = validate_range(rating, 1, 5, '满意度')
        if not valid:
            return error(msg, ErrorCode.PARAM_ERROR, 400)
    nps = data.get('nps')
    if nps is not None:
        valid, msg = validate_range(nps, 0, 10, 'NPS')
        if not valid:
            return error(msg, ErrorCode.PARAM_ERROR, 400)

    db = get_db()
    from bson import ObjectId
    session = db.live_sessions.find_one({'_id': ObjectId(session_id)})
    if not session:
        return error('场次不存在', ErrorCode.NOT_FOUND, 404)

    if data.get('isAnonymous', True):
        import uuid
        data['anonymousId'] = data.get('anonymousId', str(uuid.uuid4())[:8])
        data['participantId'] = ''

    feedback = Feedback.create(data)

    try:
        db.feedback.insert_one(feedback)
        return success(Feedback.to_dict(feedback))
    except Exception as e:
        return error(f'提交反馈失败: {str(e)}', ErrorCode.DB_ERROR, 500)
