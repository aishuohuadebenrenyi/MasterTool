import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.response import paginate
from common.errors import ErrorCode
from models.activity import Activity


@require_auth
def main(event, context):
    user_id = event.get('userId')
    query = event.get('queryStringParameters', {})

    page = int(query.get('page', 1))
    page_size = int(query.get('pageSize', 20))
    category = query.get('category', '') or query.get('scene', '')
    search = query.get('search', '') or query.get('keyword', '')
    is_favorite = str(query.get('isFavorite', '')).lower()

    skip = (page - 1) * page_size

    filter_query = {
        '$or': [
            {'userId': user_id},
            {'source': {'$in': ['system', 'public']}}
        ]
    }
    if category:
        category_values = Activity.scene_query_values(category)
        filter_query.setdefault('$and', []).append({
            '$or': [
                {'scenes': {'$in': category_values}},
                {'category': {'$in': category_values}}
            ]
        })
    if search:
        filter_query['$and'] = [{
            '$or': [
                {'name': {'$regex': search, '$options': 'i'}},
                {'learningGoal': {'$regex': search, '$options': 'i'}},
                {'reviewGuide': {'$regex': search, '$options': 'i'}}
            ]
        }]
    if is_favorite == 'true':
        filter_query['isFavorite'] = True

    db = get_db()

    try:
        total = db.activities.count_documents(filter_query)
        activities = db.activities.find(filter_query).sort([('isPinned', -1), ('createdAt', -1)]).skip(skip).limit(page_size)
        result = [Activity.to_dict(a) for a in activities]
        return success(paginate(result, total, page, page_size))
    except Exception as e:
        return error(f'获取活动列表失败: {str(e)}', ErrorCode.DB_ERROR, 500)
