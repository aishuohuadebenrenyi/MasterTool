from datetime import datetime
from bson import ObjectId


class User:
    @staticmethod
    def create(data):
        now = datetime.utcnow()
        return {
            '_id': ObjectId(),
            'openid': data.get('openid', ''),
            'nickname': data.get('nickname', ''),
            'avatar': data.get('avatar', ''),
            'phone': data.get('phone', ''),
            'company': data.get('company', ''),
            'role': data.get('role', 'trainer'),
            'stats': {
                'totalSessions': 0,
                'totalParticipants': 0,
                'totalHours': 0,
                'avgSatisfaction': 0
            },
            'createdAt': now,
            'updatedAt': now
        }

    @staticmethod
    def to_dict(user):
        if user is None:
            return None
        result = dict(user)
        result['id'] = str(result.pop('_id', ''))
        if 'createdAt' in result:
            result['createdAt'] = result['createdAt'].isoformat() if isinstance(result['createdAt'], datetime) else result['createdAt']
        if 'updatedAt' in result:
            result['updatedAt'] = result['updatedAt'].isoformat() if isinstance(result['updatedAt'], datetime) else result['updatedAt']
        return result
