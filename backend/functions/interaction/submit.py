import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, get_db
from common.errors import ErrorCode
from common.validators import validate_object_id, validate_max_length
from datetime import datetime
from bson import ObjectId


def main(event, context):
    data = event.get('body', {})

    if isinstance(data, str):
        import json
        try:
            data = json.loads(data)
        except json.JSONDecodeError:
            return error('无效的请求数据', ErrorCode.PARAM_ERROR, 400)

    interaction_id = data.get('interactionId', '')
    join_code = data.get('code', '')
    content = (data.get('content', '') or '').strip()

    valid, msg = validate_object_id(interaction_id, '互动ID')
    if not valid:
        return error(msg, ErrorCode.PARAM_ERROR, 400)
    if not join_code:
        return error('缺少互动口令', ErrorCode.PARAM_ERROR, 400)

    db = get_db()
    interaction = db.interactions.find_one({'_id': ObjectId(interaction_id), 'joinCode': join_code, 'status': 'open'})
    if not interaction:
        return error('互动不存在或已结束', ErrorCode.NOT_FOUND, 404)

    interaction_type = interaction.get('type')
    now = datetime.utcnow()
    submission = {
        'content': content,
        'name': data.get('name', ''),
        'anonymous': bool(data.get('anonymous', True)),
        'createdAt': now
    }

    if interaction_type in ['wordcloud', 'promise']:
        valid, msg = validate_max_length(content, 80 if interaction_type == 'wordcloud' else 200, '提交内容')
        if not valid:
            return error(msg, ErrorCode.PARAM_ERROR, 400)
        if not content:
            return error('提交内容不能为空', ErrorCode.PARAM_ERROR, 400)
        update = {
            '$push': {'submissions': submission},
            '$set': {'updatedAt': now}
        }
    elif interaction_type == 'vote':
        option_index = data.get('optionIndex')
        try:
            option_index = int(option_index)
        except (TypeError, ValueError):
            return error('投票选项无效', ErrorCode.PARAM_ERROR, 400)
        options = interaction.get('options', [])
        if option_index < 0 or option_index >= len(options):
            return error('投票选项不存在', ErrorCode.PARAM_ERROR, 400)
        options[option_index]['count'] = int(options[option_index].get('count', 0)) + 1
        submission['optionIndex'] = option_index
        submission['content'] = options[option_index].get('label', '')
        update = {
            '$set': {'options': options, 'updatedAt': now},
            '$push': {'submissions': submission}
        }
    else:
        return error('不支持的互动类型', ErrorCode.PARAM_ERROR, 400)

    try:
        db.interactions.update_one({'_id': ObjectId(interaction_id)}, update)
        return success({'submitted': True})
    except Exception as exc:
        return error(f'提交互动失败: {str(exc)}', ErrorCode.DB_ERROR, 500)
