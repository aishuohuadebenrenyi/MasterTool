import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.errors import ErrorCode
from common.validators import validate_object_id
from models.plan import Plan
from bson import ObjectId
from datetime import datetime


@require_auth
def main(event, context):
    user_id = event.get('userId')
    path_params = event.get('pathParameters', {})
    plan_id = path_params.get('planId', '')

    valid, msg = validate_object_id(plan_id, '方案ID')
    if not valid:
        return error(msg, ErrorCode.PARAM_ERROR, 400)

    db = get_db()
    source_plan = db.plans.find_one({'_id': ObjectId(plan_id), 'userId': user_id})
    if not source_plan:
        return error('方案不存在', ErrorCode.NOT_FOUND, 404)

    now = datetime.utcnow()
    template = dict(source_plan)
    template['_id'] = ObjectId()
    template['name'] = build_template_name(source_plan.get('name', '未命名方案'))
    template['status'] = Plan.STATUS_DRAFT
    template['source'] = 'personal_template'
    template['isPersonalTemplate'] = True
    template['isTemplateInstance'] = False
    template['templateId'] = ''
    template['templateName'] = ''
    template['templateSourcePlanId'] = plan_id
    template['sessionId'] = ''
    template['createdAt'] = now
    template['updatedAt'] = now

    try:
        db.plans.insert_one(template)
        return success(Plan.to_dict(template))
    except Exception as exc:
        return error(f'保存个人模板失败: {str(exc)}', ErrorCode.DB_ERROR, 500)


def build_template_name(name):
    if name.endswith('模板'):
        return name
    return f'{name}模板'
