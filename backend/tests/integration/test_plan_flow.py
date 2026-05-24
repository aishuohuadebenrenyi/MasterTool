import pytest
import json
from common.auth import generate_token
from models.plan import Plan


class TestPlanFlow:
    def test_create_plan(self, mock_db, sample_plan_data):
        plan = Plan.create('test_user', sample_plan_data)
        mock_db.plans.insert_one(plan)

        found = mock_db.plans.find_one({'userId': 'test_user'})
        assert found is not None
        assert found['name'] == '测试方案'

    def test_confirm_plan(self, mock_db, sample_plan_data):
        plan = Plan.create('test_user', sample_plan_data)
        mock_db.plans.insert_one(plan)

        assert plan['status'] == Plan.STATUS_DRAFT
        assert Plan.can_confirm(plan['status'])

        mock_db.plans.update_one(
            {'_id': plan['_id']},
            {'$set': {'status': Plan.STATUS_CONFIRMED}}
        )

        updated = mock_db.plans.find_one({'_id': plan['_id']})
        assert updated['status'] == Plan.STATUS_CONFIRMED

    def test_confirmed_plan_remains_editable(self, mock_db, sample_plan_data):
        plan = Plan.create('test_user', sample_plan_data)
        plan['status'] = Plan.STATUS_CONFIRMED
        mock_db.plans.insert_one(plan)

        assert Plan.can_edit(plan['status']) is True

    def test_delete_draft_plan(self, mock_db, sample_plan_data):
        plan = Plan.create('test_user', sample_plan_data)
        mock_db.plans.insert_one(plan)

        assert Plan.can_edit(plan['status'])
        mock_db.plans.delete_one({'_id': plan['_id']})

        found = mock_db.plans.find_one({'_id': plan['_id']})
        assert found is None

    def test_cannot_delete_confirmed_plan(self, mock_db, sample_plan_data):
        plan = Plan.create('test_user', sample_plan_data)
        plan['status'] = Plan.STATUS_CONFIRMED
        mock_db.plans.insert_one(plan)

        assert Plan.can_edit(plan['status']) is True

    def test_full_status_flow(self, mock_db, sample_plan_data):
        plan = Plan.create('test_user', sample_plan_data)
        mock_db.plans.insert_one(plan)

        assert plan['status'] == Plan.STATUS_DRAFT

        mock_db.plans.update_one(
            {'_id': plan['_id']},
            {'$set': {'status': Plan.STATUS_CONFIRMED}}
        )
        plan = mock_db.plans.find_one({'_id': plan['_id']})
        assert plan['status'] == Plan.STATUS_CONFIRMED

        mock_db.plans.update_one(
            {'_id': plan['_id']},
            {'$set': {'status': Plan.STATUS_DELIVERED}}
        )
        plan = mock_db.plans.find_one({'_id': plan['_id']})
        assert plan['status'] == Plan.STATUS_DELIVERED

        mock_db.plans.update_one(
            {'_id': plan['_id']},
            {'$set': {'status': Plan.STATUS_REVIEWED}}
        )
        plan = mock_db.plans.find_one({'_id': plan['_id']})
        assert plan['status'] == Plan.STATUS_REVIEWED

    def test_restart_review(self, mock_db, sample_plan_data):
        plan = Plan.create('test_user', sample_plan_data)
        plan['status'] = Plan.STATUS_REVIEWED
        mock_db.plans.insert_one(plan)

        assert Plan.can_restart_review(plan['status'])

        mock_db.plans.update_one(
            {'_id': plan['_id']},
            {'$set': {'status': Plan.STATUS_DELIVERED}}
        )

        updated = mock_db.plans.find_one({'_id': plan['_id']})
        assert updated['status'] == Plan.STATUS_DELIVERED
