import pytest
import time
from common.auth import generate_token, verify_token, require_auth
from common.errors import ErrorCode


class TestAuth:
    def test_generate_token(self):
        token = generate_token('user_001')
        assert token is not None
        assert 'user_001' in token

    def test_verify_valid_token(self):
        token = generate_token('user_001')
        user_id = verify_token(token)
        assert user_id == 'user_001'

    def test_verify_invalid_token(self):
        user_id = verify_token('invalid_token')
        assert user_id is None

    def test_verify_empty_token(self):
        user_id = verify_token('')
        assert user_id is None

    def test_verify_none_token(self):
        user_id = verify_token(None)
        assert user_id is None

    def test_verify_expired_token(self):
        token = generate_token('user_001', int(time.time()) - 86400 * 31)
        user_id = verify_token(token)
        assert user_id is None

    def test_verify_tampered_token(self):
        token = generate_token('user_001')
        tampered = token[:-5] + 'xxxxx'
        user_id = verify_token(tampered)
        assert user_id is None

    def test_require_auth_valid(self):
        token = generate_token('user_001')

        @require_auth
        def handler(event, context):
            return {'code': 0, 'data': event.get('userId')}

        event = {'headers': {'Authorization': f'Bearer {token}'}}
        result = handler(event, {})
        assert result['code'] == 0
        assert result['data'] == 'user_001'

    def test_require_auth_missing_header(self):
        @require_auth
        def handler(event, context):
            return {'code': 0}

        event = {'headers': {}}
        result = handler(event, {})
        assert isinstance(result, tuple)
        assert result[1] == 401

    def test_require_auth_invalid_token(self):
        @require_auth
        def handler(event, context):
            return {'code': 0}

        event = {'headers': {'Authorization': 'Bearer invalid_token'}}
        result = handler(event, {})
        assert isinstance(result, tuple)
        assert result[1] == 401
