import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from datetime import datetime

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

    content = str(data.get('content', '') or '').strip()
    if not content:
        return error('反馈内容不能为空', ErrorCode.PARAM_ERROR, 400)

    db = get_db()
    payload = {
        'userId': user_id,
        'content': content,
        'contact': str(data.get('contact', '') or '').strip(),
        'category': str(data.get('category', 'general') or 'general'),
        'createdAt': datetime.utcnow()
    }

    try:
        result = db.user_feedback.insert_one(payload)
        payload['id'] = str(result.inserted_id)
        payload['createdAt'] = payload['createdAt'].isoformat()
        return success(payload)
    except Exception as exc:
        return error(f'提交反馈失败: {str(exc)}', ErrorCode.DB_ERROR, 500)
