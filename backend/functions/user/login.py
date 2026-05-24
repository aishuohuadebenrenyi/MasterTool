import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, get_db
from common.errors import ErrorCode
from common.auth import generate_token
from models.user import User


def main(event, context):
    data = event.get('body', {})

    if isinstance(data, str):
        import json
        try:
            data = json.loads(data)
        except json.JSONDecodeError:
            return error('无效的请求数据', ErrorCode.PARAM_ERROR, 400)

    code = data.get('code', '')
    if not code:
        return error('缺少登录code', ErrorCode.PARAM_ERROR, 400)

    openid = f'wx_{code}_openid'

    db = get_db()
    user = db.users.find_one({'openid': openid})

    if not user:
        user_data = {
            'openid': openid,
            'nickname': data.get('nickname', ''),
            'avatar': data.get('avatar', ''),
            'phone': data.get('phone', ''),
            'company': data.get('company', ''),
            'role': 'trainer'
        }
        user = User.create(user_data)
        try:
            db.users.insert_one(user)
        except Exception as e:
            return error(f'创建用户失败: {str(e)}', ErrorCode.DB_ERROR, 500)

    token = generate_token(str(user['_id']))

    return success({
        'token': token,
        'user': User.to_dict(user)
    })
