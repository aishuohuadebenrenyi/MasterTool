from datetime import datetime
from bson import ObjectId


class Participant:
    @staticmethod
    def create(data):
        now = datetime.utcnow()
        return {
            '_id': ObjectId(),
            'sessionId': data.get('sessionId', ''),
            'openid': data.get('openid', ''),
            'name': data.get('name', ''),
            'avatar': data.get('avatar', ''),
            'checkedIn': data.get('checkedIn', False),
            'checkinTime': None,
            'groupId': data.get('groupId', ''),
            'score': data.get('score', 0),
            'createdAt': now
        }

    @staticmethod
    def to_dict(participant):
        if participant is None:
            return None
        result = dict(participant)
        result['id'] = str(result.pop('_id', ''))
        if 'checkinTime' in result and result['checkinTime']:
            result['checkinTime'] = result['checkinTime'].isoformat() if isinstance(result['checkinTime'], datetime) else result['checkinTime']
        if 'createdAt' in result:
            result['createdAt'] = result['createdAt'].isoformat() if isinstance(result['createdAt'], datetime) else result['createdAt']
        return result
