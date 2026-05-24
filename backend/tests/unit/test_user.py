import pytest
from models.user import User


class TestUser:
    def test_create_user(self):
        data = {
            'openid': 'wx_openid_001',
            'nickname': '培训师A',
            'avatar': 'https://example.com/avatar.jpg',
            'phone': '13800138000',
            'company': '测试公司'
        }
        user = User.create(data)
        assert user['openid'] == 'wx_openid_001'
        assert user['nickname'] == '培训师A'
        assert user['role'] == 'trainer'
        assert 'stats' in user
        assert user['stats']['totalSessions'] == 0

    def test_to_dict(self):
        data = {'openid': 'wx_001', 'nickname': '测试'}
        user = User.create(data)
        result = User.to_dict(user)
        assert 'id' in result
        assert '_id' not in result
        assert result['nickname'] == '测试'

    def test_to_dict_none(self):
        assert User.to_dict(None) is None
