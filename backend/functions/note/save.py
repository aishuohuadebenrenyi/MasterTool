import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.errors import ErrorCode


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

    session_id = data.get('sessionId')
    content = data.get('content', '')
    phase = data.get('phase', '')

    if not session_id:
        return error('缺少sessionId', ErrorCode.PARAM_ERROR, 400)

    db = get_db()
    note = {
        'userId': user_id,
        'sessionId': session_id,
        'content': content,
        'phase': phase,
        'createdAt': __import__('datetime').datetime.utcnow()
    }

    try:
        db.notes.insert_one(note)
        note['id'] = str(note.pop('_id', ''))
        note['createdAt'] = note['createdAt'].isoformat()
        return success(note)
    except Exception as e:
        return error(f'保存笔记失败: {str(e)}', ErrorCode.DB_ERROR, 500)
