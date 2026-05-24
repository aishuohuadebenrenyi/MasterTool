import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.response import paginate
from common.errors import ErrorCode
from models.plan import Plan


@require_auth
def main(event, context):
    user_id = event.get('userId')
    query = event.get('queryStringParameters', {})

    page = int(query.get('page', 1))
    page_size = int(query.get('pageSize', 20))
    status = query.get('status', '')
    plan_type = query.get('type', '')

    skip = (page - 1) * page_size

    filter_query = {'userId': user_id}
    if status:
        filter_query['status'] = status
    if plan_type:
        filter_query['type'] = plan_type

    db = get_db()

    try:
        total = db.plans.count_documents(filter_query)
        plans = db.plans.find(filter_query).sort('createdAt', -1).skip(skip).limit(page_size)
        result = [Plan.to_dict(p) for p in plans]
        return success(paginate(result, total, page, page_size))
    except Exception as e:
        return error(f'获取方案列表失败: {str(e)}', ErrorCode.DB_ERROR, 500)
