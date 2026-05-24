import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.response import paginate
from common.errors import ErrorCode
from models.review import Review


@require_auth
def main(event, context):
    user_id = event.get('userId')
    query = event.get('queryStringParameters', {})

    page = int(query.get('page', 1))
    page_size = int(query.get('pageSize', 20))
    plan_id = query.get('planId', '')

    skip = (page - 1) * page_size

    filter_query = {'userId': user_id}
    if plan_id:
        filter_query['planId'] = plan_id

    db = get_db()

    try:
        total = db.reviews.count_documents(filter_query)
        reviews = db.reviews.find(filter_query).sort('createdAt', -1).skip(skip).limit(page_size)
        result = [Review.to_dict(r) for r in reviews]
        return success(paginate(result, total, page, page_size))
    except Exception as e:
        return error(f'获取复盘列表失败: {str(e)}', ErrorCode.DB_ERROR, 500)
