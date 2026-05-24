import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.errors import ErrorCode
from common.validators import validate_object_id
from models.plan import Plan
from datetime import datetime


@require_auth
def main(event, context):
    user_id = event.get('userId')
    path_params = event.get('pathParameters', {})
    plan_id = path_params.get('planId', '')
    data = event.get('body', {})

    if isinstance(data, str):
        import json
        try:
            data = json.loads(data)
        except json.JSONDecodeError:
            return error('无效的请求数据', ErrorCode.PARAM_ERROR, 400)

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

    target_status = data.get('status')
    if target_status is not None:
        target_status = str(target_status)
        if target_status == Plan.STATUS_DELIVERED and not Plan.can_restart_review(plan.get('status')):
            return error('当前状态不允许重新复盘', ErrorCode.STATUS_ERROR, 400)
        if target_status == Plan.STATUS_REVIEWED and not Plan.can_review(plan.get('status')):
            return error('当前状态不允许标记为已复盘', ErrorCode.STATUS_ERROR, 400)
        if target_status in {Plan.STATUS_DRAFT, Plan.STATUS_CONFIRMED} and plan.get('status') in Plan.READONLY_STATUSES:
            return error('已交付方案不允许回退到可编辑状态', ErrorCode.STATUS_ERROR, 400)

    if target_status is None and not Plan.can_edit(plan['status']):
        return error('当前状态不允许编辑', ErrorCode.STATUS_ERROR, 400)

    update_fields = {}
    field_mapping = {
        'name': 'name',
        'type': 'type',
        'people': 'people',
        'client': 'client',
        'clientName': 'client',
        'phases': 'phases',
        'date': 'date',
        'duration': 'duration',
        'reviewMethod': 'reviewMethod',
        'reviewNotes': 'reviewNotes',
        'prepConfig': 'prepConfig',
        'sessionId': 'sessionId'
    }
    for source, target in field_mapping.items():
        if source in data:
            value = data[source]
            if target == 'type':
                value = Plan.normalize_type(value)
            elif target == 'reviewMethod':
                value = str(value or '').lower()
            elif target == 'reviewNotes':
                value = Plan.normalize_review_notes(value)
            update_fields[target] = value

    if 'scenes' in data or 'scene' in data or 'tags' in data:
        update_fields['scenes'] = Plan.normalize_scenes(data)

    if target_status is not None:
        update_fields['status'] = target_status

    if not update_fields:
        return error('没有需要更新的字段', ErrorCode.PARAM_ERROR, 400)

    update_fields['updatedAt'] = datetime.utcnow()

    try:
        db.plans.update_one(
            {'_id': ObjectId(plan_id)},
            {'$set': update_fields}
        )
        updated_plan = db.plans.find_one({'_id': ObjectId(plan_id)})
        return success(Plan.to_dict(updated_plan))
    except Exception as e:
        return error(f'更新方案失败: {str(e)}', ErrorCode.DB_ERROR, 500)
