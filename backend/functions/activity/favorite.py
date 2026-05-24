import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.errors import ErrorCode
from common.validators import validate_object_id
from models.activity import Activity


@require_auth
def main(event, context):
    user_id = event.get('userId')
    path_params = event.get('pathParameters', {})
    activity_id = path_params.get('activityId', '')

    valid, msg = validate_object_id(activity_id, '活动ID')
    if not valid:
        return error(msg, ErrorCode.PARAM_ERROR, 400)

    db = get_db()
    from bson import ObjectId

    activity = db.activities.find_one({'_id': ObjectId(activity_id), 'userId': user_id})
    if not activity:
        return error('活动不存在', ErrorCode.NOT_FOUND, 404)

    new_status = not activity.get('isFavorite', False)
    db.activities.update_one(
        {'_id': ObjectId(activity_id)},
        {'$set': {'isFavorite': new_status, 'updatedAt': __import__('datetime').datetime.utcnow()}}
    )

    return success({'id': activity_id, 'isFavorite': new_status})
