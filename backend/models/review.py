from datetime import datetime
from bson import ObjectId


class Review:
    METHOD_ORID = 'orid'
    METHOD_FOUR_F = '4f'
    METHOD_SSC = 'ssc'

    @staticmethod
    def normalize_method(value):
        raw = str(value or Review.METHOD_ORID).strip().lower()
        mapping = {
            'orid': Review.METHOD_ORID,
            '4f': Review.METHOD_FOUR_F,
            'four_f': Review.METHOD_FOUR_F,
            'ssc': Review.METHOD_SSC
        }
        return mapping.get(raw, Review.METHOD_ORID)

    @staticmethod
    def normalize_notes(value):
        if isinstance(value, list):
            return [str(item) for item in value]
        if isinstance(value, str) and value:
            return [value]
        return []

    @staticmethod
    def create(user_id, data):
        now = datetime.utcnow()
        return {
            '_id': ObjectId(),
            'userId': user_id,
            'planId': data.get('planId', ''),
            'planName': data.get('planName', ''),
            'sessionId': data.get('sessionId', ''),
            'method': Review.normalize_method(data.get('method')),
            'reviewNotes': Review.normalize_notes(data.get('reviewNotes', data.get('notes'))),
            'feedbackSummary': data.get('feedbackSummary', {}),
            'completedAt': None,
            'createdAt': now,
            'updatedAt': now
        }

    @staticmethod
    def to_dict(review):
        if review is None:
            return None
        result = dict(review)
        result['id'] = str(result.pop('_id', ''))
        result['method'] = Review.normalize_method(result.get('method'))
        result['reviewNotes'] = Review.normalize_notes(result.get('reviewNotes', result.get('notes')))
        result['notes'] = list(result['reviewNotes'])
        if 'completedAt' in result and result['completedAt']:
            result['completedAt'] = result['completedAt'].isoformat() if isinstance(result['completedAt'], datetime) else result['completedAt']
        if 'createdAt' in result:
            result['createdAt'] = result['createdAt'].isoformat() if isinstance(result['createdAt'], datetime) else result['createdAt']
        if 'updatedAt' in result:
            result['updatedAt'] = result['updatedAt'].isoformat() if isinstance(result['updatedAt'], datetime) else result['updatedAt']
        return result
