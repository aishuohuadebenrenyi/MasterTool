import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.errors import ErrorCode
from common.validators import validate_object_id
from models.plan import Plan


@require_auth
def main(event, context):
    user_id = event.get('userId')
    path_params = event.get('pathParameters', {})
    plan_id = path_params.get('planId', '')

    if not plan_id:
        return error('缺少方案ID', ErrorCode.PARAM_ERROR, 400)

    valid, msg = validate_object_id(plan_id, '方案ID')
    if not valid:
        return error(msg, ErrorCode.PARAM_ERROR, 400)

    db = get_db()
    from bson import ObjectId
    plan = db.plans.find_one({'_id': ObjectId(plan_id), 'userId': user_id})

    if not plan:
        return error('方案不存在', ErrorCode.NOT_FOUND, 404)

    return success(Plan.to_dict(plan))
