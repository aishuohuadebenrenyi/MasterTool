import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from common import success, error, require_auth, get_db
from common.errors import ErrorCode
from common.validators import validate_object_id


@require_auth
def main(event, context):
    query = event.get('queryStringParameters', {})
    session_id = query.get('sessionId', '')

    if not session_id:
        return error('缺少场次ID', ErrorCode.PARAM_ERROR, 400)
    valid, msg = validate_object_id(session_id, '场次ID')
    if not valid:
        return error(msg, ErrorCode.PARAM_ERROR, 400)

    db = get_db()
    from bson import ObjectId
    session = db.live_sessions.find_one({'_id': ObjectId(session_id), 'userId': event.get('userId')})
    if not session:
        return error('场次不存在', ErrorCode.NOT_FOUND, 404)
    feedbacks = list(db.feedback.find({'sessionId': session_id}))
    participants_total = db.participants.count_documents({'sessionId': session_id, 'checkedIn': True})

    if not feedbacks:
        empty_distribution = [{'star': star, 'count': 0} for star in range(1, 6)]
        return success({
            'count': 0,
            'participantsTotal': participants_total,
            'participantCount': participants_total,
            'avgSatisfaction': 0,
            'nps': 0,
            'responseRate': '0%',
            'fiveStarRate': 0,
            'satisfactionDistribution': empty_distribution,
            'totalResponses': 0,
            'avgRating': 0,
            'avgNps': 0,
            'keywordCloud': [],
            'ratingDistribution': {str(star): 0 for star in range(1, 6)}
        })

    total = len(feedbacks)
    ratings = [int(f.get('rating', f.get('stars', 0)) or 0) for f in feedbacks if f.get('rating', f.get('stars', 0))]
    nps_scores = [int(f.get('nps', 0) or 0) for f in feedbacks]

    avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0
    avg_nps = round(sum(nps_scores) / len(nps_scores), 1) if nps_scores else 0
    five_star_count = sum(1 for rating in ratings if rating == 5)
    five_star_rate = round(five_star_count / total, 2) if total else 0
    response_rate = f"{round((total / participants_total) * 100)}%" if participants_total else '0%'

    rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for r in ratings:
        r_int = int(r)
        if r_int in rating_distribution:
            rating_distribution[r_int] += 1

    keyword_count = {}
    for f in feedbacks:
        for kw in f.get('keywords', []):
            keyword_count[kw] = keyword_count.get(kw, 0) + 1
    keyword_cloud = sorted(keyword_count.items(), key=lambda x: x[1], reverse=True)[:20]

    return success({
        'count': total,
        'participantsTotal': participants_total,
        'participantCount': participants_total,
        'avgSatisfaction': avg_rating,
        'nps': avg_nps,
        'responseRate': response_rate,
        'fiveStarRate': five_star_rate,
        'satisfactionDistribution': [{'star': star, 'count': rating_distribution[star]} for star in range(1, 6)],
        'totalResponses': total,
        'avgRating': avg_rating,
        'avgNps': avg_nps,
        'keywordCloud': [{'keyword': k, 'count': c} for k, c in keyword_cloud],
        'ratingDistribution': {str(star): count for star, count in rating_distribution.items()}
    })
