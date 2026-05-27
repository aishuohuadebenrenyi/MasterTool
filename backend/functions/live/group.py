import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.errors import ErrorCode
from common.validators import validate_object_id, validate_range
from datetime import datetime
import random


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

    session_id = data.get('sessionId', '')
    if not session_id:
        return error('缺少场次ID', ErrorCode.PARAM_ERROR, 400)

    valid, msg = validate_object_id(session_id, '会话ID')
    if not valid:
        return error(msg, ErrorCode.PARAM_ERROR, 400)

    action = data.get('action', 'create')
    db = get_db()
    from bson import ObjectId
    session = db.live_sessions.find_one({'_id': ObjectId(session_id), 'userId': user_id})

    if not session:
        return error('场次不存在', ErrorCode.NOT_FOUND, 404)

    if action == 'create':
        group_count = data.get('groupCount', 2)
        valid, msg = validate_range(group_count, 2, 20, '分组数量')
        if not valid:
            return error(msg, ErrorCode.PARAM_ERROR, 400)
        group_count = int(float(group_count))
        if group_count < 2:
            return error('分组数量至少为2', ErrorCode.PARAM_ERROR, 400)

        participants = list(db.participants.find({'sessionId': session_id, 'checkedIn': True}))
        if len(participants) < group_count:
            return error('参与人数不足以分组', ErrorCode.PARAM_ERROR, 400)

        random.shuffle(participants)
        groups = []
        for i in range(group_count):
            groups.append({
                'groupId': f'group_{i + 1}',
                'groupName': f'第{i + 1}组',
                'members': [],
                'score': 0
            })

        for idx, p in enumerate(participants):
            group_idx = idx % group_count
            groups[group_idx]['members'].append(str(p['_id']))
            db.participants.update_one(
                {'_id': p['_id']},
                {'$set': {'groupId': groups[group_idx]['groupId']}}
            )

        try:
            db.live_sessions.update_one(
                {'_id': ObjectId(session_id)},
                {'$set': {'groups': groups, 'updatedAt': datetime.utcnow()}}
            )
            return success({'groups': groups})
        except Exception as e:
            return error(f'分组失败: {str(e)}', ErrorCode.DB_ERROR, 500)

    elif action == 'update':
        groups = data.get('groups', [])
        if not groups:
            return error('缺少分组数据', ErrorCode.PARAM_ERROR, 400)

        try:
            db.live_sessions.update_one(
                {'_id': ObjectId(session_id)},
                {'$set': {'groups': groups, 'updatedAt': datetime.utcnow()}}
            )
            return success({'groups': groups})
        except Exception as e:
            return error(f'更新分组失败: {str(e)}', ErrorCode.DB_ERROR, 500)

    else:
        return error('不支持的操作', ErrorCode.PARAM_ERROR, 400)
