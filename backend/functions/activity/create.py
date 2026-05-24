import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.validators import validate_activity_data
from common.errors import ErrorCode
from models.activity import Activity


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

    errors = validate_activity_data(data)
    if errors:
        return error('; '.join(errors), ErrorCode.PARAM_ERROR, 400)

    db = get_db()
    activity = Activity.create(user_id, data)

    try:
        db.activities.insert_one(activity)
        return success(Activity.to_dict(activity))
    except Exception as e:
        return error(f'创建活动失败: {str(e)}', ErrorCode.DB_ERROR, 500)
