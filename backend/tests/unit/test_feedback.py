import pytest
from common.auth import generate_token
from functions.feedback import stats as feedback_stats
from models.feedback import Feedback
from models.live_session import LiveSession
from models.participant import Participant


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


def test_feedback_stats_returns_current_session_participant_total(monkeypatch, mock_db):
    monkeypatch.setattr(feedback_stats, 'get_db', lambda: mock_db)
    session = LiveSession.create('test_user', {'planName': '企业培训'})
    mock_db.live_sessions.insert_one(session)
    session_id = str(session['_id'])
    mock_db.participants.insert_many([
        Participant.create({'sessionId': session_id, 'openid': 'o1', 'name': '学员1', 'checkedIn': True}),
        Participant.create({'sessionId': session_id, 'openid': 'o2', 'name': '学员2', 'checkedIn': True}),
        Participant.create({'sessionId': session_id, 'openid': 'o3', 'name': '学员3', 'checkedIn': False})
    ])
    mock_db.feedback.insert_one(Feedback.create({
        'sessionId': session_id,
        'rating': 5,
        'nps': 9,
        'text': '很好'
    }))

    response = feedback_stats.main({
        'headers': {'Authorization': f'Bearer {generate_token("test_user")}'},
        'queryStringParameters': {'sessionId': session_id}
    }, None)

    assert response['data']['count'] == 1
    assert response['data']['participantsTotal'] == 2
    assert response['data']['participantCount'] == 2
    assert response['data']['responseRate'] == '50%'
