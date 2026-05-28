import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.errors import ErrorCode
from common.validators import validate_object_id
from models.plan import Plan
from bson import ObjectId


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
    if source_plan.get('contentKind') == Plan.CONTENT_KIND_TEMPLATE:
        return error('模板无需另存为模板', ErrorCode.STATUS_ERROR, 400)

    template = dict(source_plan)
    template['name'] = build_template_name(source_plan.get('name', '未命名方案'))
    template['contentKind'] = Plan.CONTENT_KIND_TEMPLATE
    template['status'] = ''
    template['source'] = 'personal_template'
    template['isPersonalTemplate'] = True
    template['isTemplateInstance'] = False
    template['templateId'] = ''
    template['templateName'] = ''
    template['templateSourcePlanId'] = plan_id
    template['sessionId'] = ''
    template['client'] = ''
    template['clientName'] = ''
    template['date'] = ''
    template['isPinned'] = False
    template['isFavorite'] = False

    template = Plan.create(user_id, template)
    template['templateSourcePlanId'] = plan_id

    try:
        db.plans.insert_one(template)
        return success(Plan.to_dict(template))
    except Exception as exc:
        return error(f'保存个人模板失败: {str(exc)}', ErrorCode.DB_ERROR, 500)


def build_template_name(name):
    if name.endswith('模板'):
        return name
    return f'{name}模板'
