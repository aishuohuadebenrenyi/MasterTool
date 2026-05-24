import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.errors import ErrorCode


@require_auth
def main(event, context):
    user_id = event.get('userId')
    db = get_db()
    from bson import ObjectId

    user = db.users.find_one({'_id': ObjectId(user_id)})
    if not user:
        return error('用户不存在', ErrorCode.NOT_FOUND, 404)

    total_sessions = db.live_sessions.count_documents({'userId': user_id})
    total_participants = db.participants.count_documents({
        'sessionId': {'$in': [str(s['_id']) for s in db.live_sessions.find({'userId': user_id}, {'_id': 1})]}
    })

    sessions = list(db.live_sessions.find({'userId': user_id}))
    total_hours = sum(s.get('duration', 0) for s in sessions) / 60

    feedbacks = list(db.feedback.find({
        'sessionId': {'$in': [str(s['_id']) for s in sessions]}
    }))
    ratings = [f.get('rating', 0) for f in feedbacks if f.get('rating')]
    avg_satisfaction = sum(ratings) / len(ratings) if ratings else 0

    stats = {
        'totalSessions': total_sessions,
        'totalParticipants': total_participants,
        'totalHours': round(total_hours, 1),
        'avgSatisfaction': round(avg_satisfaction, 1)
    }

    db.users.update_one(
        {'_id': ObjectId(user_id)},
        {'$set': {'stats': stats}}
    )

    return success(stats)
