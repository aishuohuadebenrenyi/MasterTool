import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.errors import ErrorCode
from common.validators import validate_object_id, validate_enum, validate_max_length
from datetime import datetime
from bson import ObjectId
import uuid


INTERACTION_TYPES = ['wordcloud', 'vote', 'promise']


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
    interaction_type = data.get('type', '')
    title = data.get('title', '')

    valid, msg = validate_object_id(session_id, '会话ID')
    if not valid:
        return error(msg, ErrorCode.PARAM_ERROR, 400)
    valid, msg = validate_enum(interaction_type, INTERACTION_TYPES, '互动类型')
    if not valid:
        return error(msg, ErrorCode.PARAM_ERROR, 400)
    valid, msg = validate_max_length(title, 60, '互动标题')
    if not valid:
        return error(msg, ErrorCode.PARAM_ERROR, 400)

    db = get_db()
    session = db.live_sessions.find_one({'_id': ObjectId(session_id), 'userId': user_id})
    if not session:
        return error('场次不存在', ErrorCode.NOT_FOUND, 404)

    existing = db.interactions.find_one({
        'sessionId': session_id,
        'userId': user_id,
        'type': interaction_type,
        'status': 'open'
    })
    if existing:
        return success(to_response(existing))

    now = datetime.utcnow()
    join_code = uuid.uuid4().hex[:8]
    interaction = {
        '_id': ObjectId(),
        'sessionId': session_id,
        'userId': user_id,
        'type': interaction_type,
        'title': title or default_title(interaction_type),
        'joinCode': join_code,
        'status': 'open',
        'options': data.get('options', default_options(interaction_type)),
        'submissions': [],
        'createdAt': now,
        'updatedAt': now
    }

    try:
        db.interactions.insert_one(interaction)
        return success(to_response(interaction))
    except Exception as exc:
        return error(f'创建互动失败: {str(exc)}', ErrorCode.DB_ERROR, 500)


def default_title(interaction_type):
    if interaction_type == 'wordcloud':
        return '词云互动'
    if interaction_type == 'vote':
        return '投票互动'
    return '承诺互动'


def default_options(interaction_type):
    if interaction_type == 'vote':
        return [{'label': '选项 A', 'count': 0}, {'label': '选项 B', 'count': 0}]
    return []


def to_response(interaction):
    interaction_id = str(interaction['_id'])
    path = f'/pages/participant/InteractionSubmit?interactionId={interaction_id}&code={interaction["joinCode"]}&type={interaction["type"]}'
    return {
        'id': interaction_id,
        'interactionId': interaction_id,
        'sessionId': interaction['sessionId'],
        'type': interaction['type'],
        'title': interaction.get('title', ''),
        'joinCode': interaction['joinCode'],
        'path': path,
        'qrPayload': path,
        'status': interaction.get('status', 'open'),
        'options': interaction.get('options', []),
        'submissions': interaction.get('submissions', []),
    }
