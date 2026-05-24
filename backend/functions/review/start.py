import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.errors import ErrorCode
from models.review import Review
from models.plan import Plan


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

    plan_id = data.get('planId', '')
    if not plan_id:
        return error('缺少方案ID', ErrorCode.PARAM_ERROR, 400)

    db = get_db()
    from bson import ObjectId
    plan = db.plans.find_one({'_id': ObjectId(plan_id), 'userId': user_id})

    if not plan:
        return error('方案不存在', ErrorCode.NOT_FOUND, 404)

    if not (Plan.can_review(plan['status']) or Plan.can_restart_review(plan['status'])):
        return error('当前方案状态不允许复盘', ErrorCode.STATUS_ERROR, 400)

    existing = db.reviews.find_one({'planId': plan_id, 'userId': user_id})
    if existing:
        return success(Review.to_dict(existing))

    payload = {
        **data,
        'planName': data.get('planName') or plan.get('name', ''),
        'sessionId': data.get('sessionId') or plan.get('sessionId', '')
    }
    review = Review.create(user_id, payload)

    try:
        db.reviews.insert_one(review)
        return success(Review.to_dict(review))
    except Exception as e:
        return error(f'开始复盘失败: {str(e)}', ErrorCode.DB_ERROR, 500)
