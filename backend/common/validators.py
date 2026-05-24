from .errors import ErrorCode
from .response import error as error_response


def validate_required(value, field_name):
    if value is None or value == '':
        return False, f'{field_name}不能为空'
    return True, ''


def validate_range(value, min_val, max_val, field_name):
    try:
        num = float(value)
    except (TypeError, ValueError):
        return False, f'{field_name}必须是数字'
    if num < min_val or num > max_val:
        return False, f'{field_name}必须在{min_val}-{max_val}之间'
    return True, ''


def validate_max_length(value, max_len, field_name):
    if value and len(str(value)) > max_len:
        return False, f'{field_name}不能超过{max_len}个字符'
    return True, ''


def validate_enum(value, allowed_values, field_name):
    if value not in allowed_values:
        return False, f'{field_name}必须是{allowed_values}之一'
    return True, ''


def validate_plan_data(data):
    errors = []
    valid, msg = validate_required(data.get('name'), '方案名称')
    if not valid:
        errors.append(msg)
    if 'people' in data and data['people'] is not None:
        valid, msg = validate_range(data['people'], 1, 999, '参与人数')
        if not valid:
            errors.append(msg)
    if 'phases' in data and not data['phases']:
        errors.append('方案至少需要一个环节')
    return errors


def validate_object_id(oid, field_name='ID'):
    try:
        from bson import ObjectId
        ObjectId(oid)
        return True, ''
    except Exception:
        return False, f'{field_name}格式无效'


def validate_activity_data(data):
    errors = []
    valid, msg = validate_required(data.get('name'), '活动名称')
    if not valid:
        errors.append(msg)
    if 'duration' in data and data['duration'] is not None:
        valid, msg = validate_range(data['duration'], 1, 480, '活动时长')
        if not valid:
            errors.append(msg)
    return errors
