import pytest
from models.live_session import LiveSession


class TestLiveSession:
    def test_create_session(self):
        data = {
            'planId': 'plan_001',
            'planName': '测试方案',
            'planSnapshot': {'name': '测试方案', 'phases': []}
        }
        session = LiveSession.create('user_001', data)
        assert session['userId'] == 'user_001'
        assert session['planId'] == 'plan_001'
        assert session['planName'] == '测试方案'
        assert session['phase'] == LiveSession.PHASE_IN_PROGRESS
        assert session['currentPhaseIndex'] == 0
        assert 'planSnapshot' in session
        assert session['participants'] == []
        assert session['notes'] == []

    def test_to_dict(self):
        data = {'planId': 'plan_001', 'planName': '测试'}
        session = LiveSession.create('user_001', data)
        result = LiveSession.to_dict(session)
        assert 'id' in result
        assert '_id' not in result
        assert result['sessionId'] == result['id']
        assert result['planName'] == '测试'

    def test_to_dict_none(self):
        assert LiveSession.to_dict(None) is None

    def test_phase_constants(self):
        assert LiveSession.PHASE_NOT_STARTED == 'not_started'
        assert LiveSession.PHASE_IN_PROGRESS == 'in_progress'
        assert LiveSession.PHASE_PAUSED == 'paused'
        assert LiveSession.PHASE_ENDED == 'ended'
