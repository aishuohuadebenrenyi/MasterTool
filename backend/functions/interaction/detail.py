import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, get_db
from common.errors import ErrorCode
from common.validators import validate_object_id
from bson import ObjectId


def main(event, context):
    query = event.get('queryStringParameters', {})
    interaction_id = query.get('interactionId', '')
    join_code = query.get('code', '')

    valid, msg = validate_object_id(interaction_id, '互动ID')
    if not valid:
        return error(msg, ErrorCode.PARAM_ERROR, 400)
    if not join_code:
        return error('缺少互动口令', ErrorCode.PARAM_ERROR, 400)

    db = get_db()
    interaction = db.interactions.find_one({'_id': ObjectId(interaction_id), 'joinCode': join_code})
    if not interaction:
        return error('互动不存在', ErrorCode.NOT_FOUND, 404)

    return success({
        'id': str(interaction['_id']),
        'interactionId': str(interaction['_id']),
        'type': interaction.get('type', ''),
        'title': interaction.get('title', ''),
        'status': interaction.get('status', 'open'),
        'options': interaction.get('options', [])
    })
