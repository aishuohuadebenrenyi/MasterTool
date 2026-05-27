import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.errors import ErrorCode
from common.validators import validate_object_id
from bson import ObjectId
from datetime import datetime


@require_auth
def main(event, context):
    user_id = event.get('userId')
    query = event.get('queryStringParameters', {})
    interaction_id = query.get('interactionId', '')

    valid, msg = validate_object_id(interaction_id, '互动ID')
    if not valid:
        return error(msg, ErrorCode.PARAM_ERROR, 400)

    db = get_db()
    interaction = db.interactions.find_one({'_id': ObjectId(interaction_id), 'userId': user_id})
    if not interaction:
        return error('互动不存在', ErrorCode.NOT_FOUND, 404)

    return success(to_response(interaction))


def to_response(interaction):
    submissions = interaction.get('submissions', [])
    word_counts = {}
    if interaction.get('type') == 'wordcloud':
        for item in submissions:
            word = item.get('content', '')
            if word:
                word_counts[word] = word_counts.get(word, 0) + 1

    return {
        'id': str(interaction['_id']),
        'interactionId': str(interaction['_id']),
        'sessionId': interaction.get('sessionId', ''),
        'type': interaction.get('type', ''),
        'title': interaction.get('title', ''),
        'joinCode': interaction.get('joinCode', ''),
        'status': interaction.get('status', 'open'),
        'options': interaction.get('options', []),
        'submissions': [
            {
                **item,
                'createdAt': item.get('createdAt').isoformat() if isinstance(item.get('createdAt'), datetime) else item.get('createdAt')
            }
            for item in submissions
        ],
        'wordcloud': [{'word': word, 'count': count} for word, count in sorted(word_counts.items(), key=lambda kv: kv[1], reverse=True)]
    }
