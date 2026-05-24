import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.response import paginate
from common.errors import ErrorCode
from models.feedback import Feedback


@require_auth
def main(event, context):
    user_id = event.get('userId')
    query = event.get('queryStringParameters', {})

    session_id = query.get('sessionId', '')
    page = int(query.get('page', 1))
    page_size = int(query.get('pageSize', 20))

    if not session_id:
        return error('缺少场次ID', ErrorCode.PARAM_ERROR, 400)

    skip = (page - 1) * page_size

    db = get_db()
    filter_query = {'sessionId': session_id}

    try:
        total = db.feedback.count_documents(filter_query)
        feedbacks = db.feedback.find(filter_query).sort('createdAt', -1).skip(skip).limit(page_size)
        result = [Feedback.to_dict(f) for f in feedbacks]
        return success(paginate(result, total, page, page_size))
    except Exception as e:
        return error(f'获取反馈列表失败: {str(e)}', ErrorCode.DB_ERROR, 500)
