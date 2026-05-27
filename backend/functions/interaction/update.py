import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.errors import ErrorCode
from common.validators import validate_object_id, validate_max_length
from bson import ObjectId
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

    interaction_id = data.get('interactionId', '')
    valid, msg = validate_object_id(interaction_id, '互动ID')
    if not valid:
        return error(msg, ErrorCode.PARAM_ERROR, 400)

    db = get_db()
    interaction = db.interactions.find_one({'_id': ObjectId(interaction_id), 'userId': user_id})
    if not interaction:
        return error('互动不存在', ErrorCode.NOT_FOUND, 404)
    if interaction.get('status') != 'open':
        return error('互动已结束', ErrorCode.STATUS_ERROR, 400)

    update_fields = {'updatedAt': datetime.utcnow()}
    if 'title' in data:
        title = data.get('title', '')
        valid, msg = validate_max_length(title, 60, '互动标题')
        if not valid:
            return error(msg, ErrorCode.PARAM_ERROR, 400)
        update_fields['title'] = title or interaction.get('title', '')

    if 'options' in data:
        options = normalize_options(data.get('options', []))
        if isinstance(options, tuple):
            return options
        update_fields['options'] = options

    db.interactions.update_one({'_id': ObjectId(interaction_id)}, {'$set': update_fields})
    updated = db.interactions.find_one({'_id': ObjectId(interaction_id)})
    return success(to_response(updated))


def normalize_options(options):
    if not isinstance(options, list) or len(options) < 2:
        return error('投票至少需要2个选项', ErrorCode.PARAM_ERROR, 400)
    if len(options) > 10:
        return error('投票选项不能超过10个', ErrorCode.PARAM_ERROR, 400)
    result = []
    for item in options:
        label = ''
        count = 0
        if isinstance(item, dict):
            label = str(item.get('label', '') or '').strip()
            try:
                count = max(0, int(item.get('count', 0) or 0))
            except (TypeError, ValueError):
                count = 0
        if not label:
            return error('投票选项不能为空', ErrorCode.PARAM_ERROR, 400)
        valid, msg = validate_max_length(label, 40, '投票选项')
        if not valid:
            return error(msg, ErrorCode.PARAM_ERROR, 400)
        result.append({'label': label, 'count': count})
    return result


def to_response(interaction):
    interaction_id = str(interaction['_id'])
    path = f'/pages/participant/InteractionSubmit?interactionId={interaction_id}&code={interaction["joinCode"]}&type={interaction["type"]}'
    return {
        'id': interaction_id,
        'interactionId': interaction_id,
        'sessionId': interaction.get('sessionId', ''),
        'type': interaction.get('type', ''),
        'title': interaction.get('title', ''),
        'joinCode': interaction.get('joinCode', ''),
        'path': path,
        'qrPayload': path,
        'status': interaction.get('status', 'open'),
        'options': interaction.get('options', []),
        'submissions': interaction.get('submissions', [])
    }
