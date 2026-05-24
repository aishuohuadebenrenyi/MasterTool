import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.errors import ErrorCode
from models.user import User
from datetime import datetime


@require_auth
def main(event, context):
    user_id = event.get('userId')
    db = get_db()
    from bson import ObjectId

    if event.get('httpMethod', '').upper() in {'POST', 'PUT'}:
        data = event.get('body', {})
        if isinstance(data, str):
            import json
            try:
                data = json.loads(data)
            except json.JSONDecodeError:
                return error('无效的请求数据', ErrorCode.PARAM_ERROR, 400)

        update_fields = {}
        allowed_fields = ['nickname', 'avatar', 'phone', 'company', 'title']
        for field in allowed_fields:
            if field in data:
                update_fields[field] = data[field]

        if update_fields:
            update_fields['updatedAt'] = datetime.utcnow()
            try:
                db.users.update_one(
                    {'_id': ObjectId(user_id)},
                    {'$set': update_fields}
                )
            except Exception as e:
                return error(f'更新用户信息失败: {str(e)}', ErrorCode.DB_ERROR, 500)

    user = db.users.find_one({'_id': ObjectId(user_id)})
    if not user:
        return error('用户不存在', ErrorCode.NOT_FOUND, 404)

    return success(User.to_dict(user))
