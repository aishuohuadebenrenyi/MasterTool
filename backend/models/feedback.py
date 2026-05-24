from datetime import datetime
from bson import ObjectId


class Feedback:
    @staticmethod
    def create(data):
        now = datetime.utcnow()
        anonymous = bool(data.get('anonymous', data.get('isAnonymous', True)))
        comment = data.get('comment') or data.get('text', '')
        rating = int(data.get('rating', data.get('stars', 0)) or 0)
        author = data.get('author') or ('匿名用户' if anonymous else data.get('name', '参与者'))
        return {
            '_id': ObjectId(),
            'sessionId': data.get('sessionId', ''),
            'participantId': data.get('participantId', ''),
            'anonymousId': data.get('anonymousId', ''),
            'anonymous': anonymous,
            'isAnonymous': anonymous,
            'rating': rating,
            'stars': rating,
            'nps': int(data.get('nps', 0) or 0),
            'keywords': data.get('keywords', []),
            'comment': comment,
            'text': comment,
            'author': author,
            'submittedAt': now,
            'createdAt': now
        }

    @staticmethod
    def to_dict(feedback):
        if feedback is None:
            return None
        result = dict(feedback)
        result['id'] = str(result.pop('_id', ''))
        result['anonymous'] = bool(result.get('anonymous', result.get('isAnonymous', True)))
        result['isAnonymous'] = result['anonymous']
        result['rating'] = int(result.get('rating', result.get('stars', 0)) or 0)
        result['stars'] = result['rating']
        result['star'] = result['rating']
        result['comment'] = result.get('comment', result.get('text', ''))
        result['text'] = result['comment']
        result['author'] = result.get('author') or ('匿名用户' if result['anonymous'] else '参与者')
        result['submittedAt'] = result.get('submittedAt') or result.get('createdAt')
        if 'submittedAt' in result:
            result['submittedAt'] = result['submittedAt'].isoformat() if isinstance(result['submittedAt'], datetime) else result['submittedAt']
        if 'createdAt' in result:
            result['createdAt'] = result['createdAt'].isoformat() if isinstance(result['createdAt'], datetime) else result['createdAt']
        return result
