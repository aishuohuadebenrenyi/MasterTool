import pytest
from models.plan import Plan


class TestPlan:
    def test_create_plan(self):
        data = {
            'name': '测试方案',
            'type': 'improv_training',
            'people': 20,
            'clientName': '测试客户',
            'phases': [{'name': '破冰', 'duration': 15}]
        }
        plan = Plan.create('user_001', data)
        assert plan['userId'] == 'user_001'
        assert plan['name'] == '测试方案'
        assert plan['status'] == Plan.STATUS_DRAFT
        assert plan['type'] == 'improv_training'
        assert plan['people'] == 20

    def test_to_dict(self):
        data = {'name': '测试'}
        plan = Plan.create('user_001', data)
        result = Plan.to_dict(plan)
        assert 'id' in result
        assert '_id' not in result
        assert result['name'] == '测试'

    def test_to_dict_none(self):
        assert Plan.to_dict(None) is None

    def test_can_edit(self):
        assert Plan.can_edit(Plan.STATUS_DRAFT) is True
        assert Plan.can_edit(Plan.STATUS_CONFIRMED) is True
        assert Plan.can_edit(Plan.STATUS_DELIVERED) is False
        assert Plan.can_edit(Plan.STATUS_REVIEWED) is False

    def test_can_confirm(self):
        assert Plan.can_confirm(Plan.STATUS_DRAFT) is True
        assert Plan.can_confirm(Plan.STATUS_CONFIRMED) is False

    def test_can_deliver(self):
        assert Plan.can_deliver(Plan.STATUS_CONFIRMED) is True
        assert Plan.can_deliver(Plan.STATUS_DRAFT) is False

    def test_can_review(self):
        assert Plan.can_review(Plan.STATUS_DELIVERED) is True
        assert Plan.can_review(Plan.STATUS_DRAFT) is False

    def test_status_flow(self):
        assert Plan.can_confirm(Plan.STATUS_DRAFT)
        assert Plan.can_deliver(Plan.STATUS_CONFIRMED)
        assert Plan.can_review(Plan.STATUS_DELIVERED)

    def test_can_restart_review(self):
        assert Plan.can_restart_review(Plan.STATUS_REVIEWED) is True
        assert Plan.can_restart_review(Plan.STATUS_DELIVERED) is False
        assert Plan.can_restart_review(Plan.STATUS_DRAFT) is False

    def test_lecture_type(self):
        assert Plan.TYPE_LECTURE == 'lecture'

    def test_normalize_type_accepts_chinese_label(self):
        assert Plan.normalize_type('即兴训练') == Plan.TYPE_IMPROV_TRAINING
        assert Plan.normalize_type('团队建设') == Plan.TYPE_TEAMBUILDING

    def test_to_dict_includes_type_label(self):
        plan = Plan.create('user_001', {'name': '测试', 'type': '即兴训练'})
        result = Plan.to_dict(plan)
        assert result['type'] == Plan.TYPE_IMPROV_TRAINING
        assert result['typeLabel'] == '即兴培训'
