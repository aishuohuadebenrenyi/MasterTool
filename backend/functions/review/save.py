import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.errors import ErrorCode
from common.validators import validate_object_id
from models.review import Review
from models.plan import Plan
from datetime import datetime


@require_auth
def main(event, context):
    user_id = event.get('userId')
    path_params = event.get('pathParameters', {})
    review_id = path_params.get('reviewId', '')
    data = event.get('body', {})

    if isinstance(data, str):
        import json
        try:
            data = json.loads(data)
        except json.JSONDecodeError:
            return error('无效的请求数据', ErrorCode.PARAM_ERROR, 400)

    if not review_id:
        return error('缺少复盘ID', ErrorCode.PARAM_ERROR, 400)

    valid, msg = validate_object_id(review_id, '复盘ID')
    if not valid:
        return error(msg, ErrorCode.PARAM_ERROR, 400)

    db = get_db()
    from bson import ObjectId
    review = db.reviews.find_one({'_id': ObjectId(review_id), 'userId': user_id})

    if not review:
        return error('复盘不存在', ErrorCode.NOT_FOUND, 404)

    update_fields = {}
    if 'method' in data:
        update_fields['method'] = Review.normalize_method(data.get('method'))
    if 'feedbackSummary' in data:
        update_fields['feedbackSummary'] = data.get('feedbackSummary', {})
    if 'reviewNotes' in data or 'notes' in data:
        update_fields['reviewNotes'] = Review.normalize_notes(data.get('reviewNotes', data.get('notes')))

    is_completed = bool(data.get('isCompleted') or data.get('status') == Plan.STATUS_REVIEWED)
    if is_completed:
        update_fields['completedAt'] = datetime.utcnow()

    update_fields['updatedAt'] = datetime.utcnow()

    try:
        db.reviews.update_one(
            {'_id': ObjectId(review_id)},
            {'$set': update_fields}
        )
        updated_review = db.reviews.find_one({'_id': ObjectId(review_id)})

        if review.get('planId'):
            # 复盘结果会反写回方案，保证首页/列表直接读取 plan 时也能看到最新复盘摘要和状态。
            plan_update = {'updatedAt': datetime.utcnow()}
            if 'method' in update_fields:
                plan_update['reviewMethod'] = update_fields['method']
            if 'reviewNotes' in update_fields:
                plan_update['reviewNotes'] = update_fields['reviewNotes']
            if is_completed:
                plan_update['status'] = Plan.STATUS_REVIEWED
            db.plans.update_one({'_id': ObjectId(review['planId'])}, {'$set': plan_update})

        return success(Review.to_dict(updated_review))
    except Exception as e:
        return error(f'保存复盘失败: {str(e)}', ErrorCode.DB_ERROR, 500)
