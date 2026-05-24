import pytest
from models.feedback import Feedback


class TestFeedback:
    def test_create_feedback(self):
        data = {
            'sessionId': 'session_001',
            'stars': 5,
            'nps': 9,
            'text': '非常好的培训',
            'keywords': ['有趣', '实用'],
            'isAnonymous': True,
            'anonymousId': 'anon_001'
        }
        feedback = Feedback.create(data)
        assert feedback['sessionId'] == 'session_001'
        assert feedback['stars'] == 5
        assert feedback['text'] == '非常好的培训'
        assert feedback['isAnonymous'] is True
        assert feedback['anonymousId'] == 'anon_001'

    def test_create_non_anonymous(self):
        data = {
            'sessionId': 'session_001',
            'participantId': 'part_001',
            'isAnonymous': False
        }
        feedback = Feedback.create(data)
        assert feedback['isAnonymous'] is False
        assert feedback['participantId'] == 'part_001'

    def test_to_dict(self):
        data = {'sessionId': 'session_001'}
        feedback = Feedback.create(data)
        result = Feedback.to_dict(feedback)
        assert 'id' in result
        assert '_id' not in result

    def test_to_dict_none(self):
        assert Feedback.to_dict(None) is None
