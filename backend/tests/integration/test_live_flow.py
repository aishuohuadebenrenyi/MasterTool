import pytest
import copy
from models.live_session import LiveSession
from models.plan import Plan


class TestLiveFlow:
    def test_start_session_with_plan_snapshot(self, mock_db, sample_plan_data):
        plan = Plan.create('test_user', sample_plan_data)
        plan['status'] = Plan.STATUS_CONFIRMED
        mock_db.plans.insert_one(plan)

        snapshot = copy.deepcopy(Plan.to_dict(plan))

        session_data = {
            'planId': str(plan['_id']),
            'planName': plan['name'],
            'planSnapshot': snapshot
        }
        session = LiveSession.create('test_user', session_data)
        mock_db.live_sessions.insert_one(session)

        assert session['phase'] == LiveSession.PHASE_IN_PROGRESS
        assert session['planSnapshot']['name'] == '测试方案'

    def test_end_session(self, mock_db, sample_plan_data):
        plan = Plan.create('test_user', sample_plan_data)
        session_data = {'planId': 'p1', 'planName': plan['name'], 'planSnapshot': {}}
        session = LiveSession.create('test_user', session_data)
        mock_db.live_sessions.insert_one(session)

        mock_db.live_sessions.update_one(
            {'_id': session['_id']},
            {'$set': {'phase': LiveSession.PHASE_ENDED, 'duration': 60}}
        )

        updated = mock_db.live_sessions.find_one({'_id': session['_id']})
        assert updated['phase'] == LiveSession.PHASE_ENDED
        assert updated['duration'] == 60

    def test_snapshot_isolation(self, mock_db, sample_plan_data):
        plan = Plan.create('test_user', sample_plan_data)
        mock_db.plans.insert_one(plan)

        snapshot = copy.deepcopy(Plan.to_dict(plan))

        session_data = {'planId': str(plan['_id']), 'planName': plan['name'], 'planSnapshot': snapshot}
        session = LiveSession.create('test_user', session_data)
        mock_db.live_sessions.insert_one(session)

        mock_db.plans.update_one(
            {'_id': plan['_id']},
            {'$set': {'name': '修改后的方案名'}}
        )

        updated_session = mock_db.live_sessions.find_one({'_id': session['_id']})
        assert updated_session['planSnapshot']['name'] == '测试方案'

        updated_plan = mock_db.plans.find_one({'_id': plan['_id']})
        assert updated_plan['name'] == '修改后的方案名'
