import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.errors import ErrorCode


@require_auth
def main(event, context):
    user_id = event.get('userId')
    query = event.get('queryStringParameters', {})
    session_id = query.get('sessionId', '')

    if not session_id:
        return error('缺少sessionId', ErrorCode.PARAM_ERROR, 400)

    db = get_db()
    notes = list(db.notes.find({'userId': user_id, 'sessionId': session_id}).sort('createdAt', -1))

    result = []
    for note in notes:
        note['id'] = str(note.pop('_id', ''))
        if 'createdAt' in note and hasattr(note['createdAt'], 'isoformat'):
            note['createdAt'] = note['createdAt'].isoformat()
        result.append(note)

    return success(result)
