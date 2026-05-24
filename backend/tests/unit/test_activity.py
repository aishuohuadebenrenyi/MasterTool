import pytest
from models.activity import Activity


class TestActivity:
    def test_create_activity(self):
        data = {
            'name': '破冰游戏',
            'category': 'icebreaker',
            'duration': 15,
            'description': '经典破冰活动'
        }
        activity = Activity.create('user_001', data)
        assert activity['userId'] == 'user_001'
        assert activity['name'] == '破冰游戏'
        assert activity['category'] == 'icebreaker'
        assert activity['isCustom'] is True

    def test_to_dict(self):
        data = {'name': '测试活动'}
        activity = Activity.create('user_001', data)
        result = Activity.to_dict(activity)
        assert 'id' in result
        assert '_id' not in result
        assert result['name'] == '测试活动'

    def test_to_dict_none(self):
        assert Activity.to_dict(None) is None
