import pytest
from models.participant import Participant


class TestParticipant:
    def test_create_participant(self):
        data = {
            'sessionId': 'session_001',
            'openid': 'wx_openid_001',
            'name': '张三',
            'avatar': 'https://example.com/avatar.jpg'
        }
        participant = Participant.create(data)
        assert participant['sessionId'] == 'session_001'
        assert participant['openid'] == 'wx_openid_001'
        assert participant['name'] == '张三'
        assert participant['checkedIn'] is False
        assert participant['checkinTime'] is None

    def test_to_dict(self):
        data = {'sessionId': 'session_001', 'name': '张三'}
        participant = Participant.create(data)
        result = Participant.to_dict(participant)
        assert 'id' in result
        assert '_id' not in result
        assert result['name'] == '张三'

    def test_to_dict_none(self):
        assert Participant.to_dict(None) is None
