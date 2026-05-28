import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.errors import ErrorCode
from common.validators import validate_object_id
from models.activity import Activity
from datetime import datetime


@require_auth
def main(event, context):
    user_id = event.get('userId')
    path_params = event.get('pathParameters', {})
    activity_id = path_params.get('activityId', '')
    data = event.get('body', {})

    if isinstance(data, str):
        import json
        try:
            data = json.loads(data)
        except json.JSONDecodeError:
            return error('无效的请求数据', ErrorCode.PARAM_ERROR, 400)

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
        return error('预设活动不允许编辑', ErrorCode.PERMISSION_DENIED, 403)

    update_fields = {}
    allowed_fields = [
        'name', 'duration', 'description', 'rules', 'materials',
        'difficulty', 'intensity', 'people', 'participants', 'minPeople', 'maxPeople',
        'learningGoal', 'objective', 'steps', 'tips', 'leaderTips',
        'reviewGuide', 'reviewQuestions', 'isHighRisk', 'isFavorite', 'isPinned'
    ]
    for field in allowed_fields:
        if field in data:
            update_fields[field] = data[field]

    if 'category' in data or 'scene' in data or 'scenes' in data:
        scenes = Activity.normalize_scenes(data)
        update_fields['scenes'] = scenes
        update_fields['category'] = Activity.normalize_scene_value(data.get('category') or scenes[0])
        update_fields['scene'] = update_fields['category']

    if 'people' in data or 'participants' in data:
        people = data.get('people') or data.get('participants') or ''
        min_people, max_people = Activity.parse_people_range(people)
        update_fields['people'] = people
        update_fields['participants'] = people
        update_fields['minPeople'] = min_people
        update_fields['maxPeople'] = max_people

    if 'difficulty' in data and 'intensity' not in data:
        update_fields['intensity'] = Activity.difficulty_to_intensity(data.get('difficulty'))

    if not update_fields:
        return error('没有需要更新的字段', ErrorCode.PARAM_ERROR, 400)

    update_fields['updatedAt'] = datetime.utcnow()

    try:
        db.activities.update_one(
            {'_id': ObjectId(activity_id)},
            {'$set': update_fields}
        )
        updated_activity = db.activities.find_one({'_id': ObjectId(activity_id)})
        return success(Activity.to_dict(updated_activity))
    except Exception as e:
        return error(f'更新活动失败: {str(e)}', ErrorCode.DB_ERROR, 500)
