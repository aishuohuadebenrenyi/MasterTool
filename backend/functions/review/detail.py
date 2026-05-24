import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.errors import ErrorCode
from common.validators import validate_object_id
from models.review import Review


@require_auth
def main(event, context):
    user_id = event.get('userId')
    path_params = event.get('pathParameters', {})
    review_id = path_params.get('reviewId', '')

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

    return success(Review.to_dict(review))
