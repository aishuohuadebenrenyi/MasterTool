import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.errors import ErrorCode
from common.validators import validate_object_id


@require_auth
def main(event, context):
    user_id = event.get('userId')
    path_params = event.get('pathParameters', {})
    activity_id = path_params.get('activityId', '')

    if not activity_id:
        return error('缺少活动ID', ErrorCode.PARAM_ERROR, 400)

    valid, msg = validate_object_id(activity_id, '活动ID')
    if not valid:
        return error(msg, ErrorCode.PARAM_ERROR, 400)

    db = get_db()
    from bson import ObjectId
    activity = db.activities.find_one({'_id': ObjectId(activity_id), 'userId': user_id})

    if not activity:
        return error('活动不存在', ErrorCode.NOT_FOUND, 404)

    if not activity.get('isCustom', True):
        return error('预设活动不允许删除', ErrorCode.PERMISSION_DENIED, 403)

    try:
        db.activities.delete_one({'_id': ObjectId(activity_id)})
        return success(message='删除成功')
    except Exception as e:
        return error(f'删除活动失败: {str(e)}', ErrorCode.DB_ERROR, 500)
