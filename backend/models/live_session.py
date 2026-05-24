from datetime import datetime
from bson import ObjectId


class LiveSession:
    PHASE_NOT_STARTED = 'not_started'
    PHASE_IN_PROGRESS = 'in_progress'
    PHASE_PAUSED = 'paused'
    PHASE_ENDED = 'ended'

    @staticmethod
    def create(user_id, data):
        now = datetime.utcnow()
        return {
            '_id': ObjectId(),
            'userId': user_id,
            'planId': data.get('planId', ''),
            'planName': data.get('planName', ''),
            'planSnapshot': data.get('planSnapshot', {}),
            'phase': LiveSession.PHASE_IN_PROGRESS,
            'currentPhaseIndex': 0,
            'startTime': now,
            'duration': 0,
            'participants': [],
            'groups': [],
            'scores': {},
            'notes': [],
            'createdAt': now,
            'updatedAt': now
        }

    @staticmethod
    def to_dict(session):
        if session is None:
            return None
        result = dict(session)
        result['id'] = str(result.pop('_id', ''))
        result['sessionId'] = result['id']
        if 'startTime' in result:
            result['startTime'] = result['startTime'].isoformat() if isinstance(result['startTime'], datetime) else result['startTime']
        if 'createdAt' in result:
            result['createdAt'] = result['createdAt'].isoformat() if isinstance(result['createdAt'], datetime) else result['createdAt']
        if 'updatedAt' in result:
            result['updatedAt'] = result['updatedAt'].isoformat() if isinstance(result['updatedAt'], datetime) else result['updatedAt']
        return result
