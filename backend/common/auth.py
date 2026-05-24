import time
import hashlib
import hmac
import functools
from .errors import ErrorCode
from .response import error


SECRET_KEY = 'trainer-toolbox-secret-key-change-in-production'


def generate_token(user_id, timestamp=None):
    if timestamp is None:
        timestamp = int(time.time())
    message = f'{user_id}:{timestamp}'
    signature = hmac.new(
        SECRET_KEY.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    return f'{user_id}:{timestamp}:{signature}'


def verify_token(token):
    if not token or ':' not in token:
        return None
    parts = token.split(':')
    if len(parts) != 3:
        return None
    user_id, timestamp, signature = parts
    try:
        ts = int(timestamp)
    except ValueError:
        return None
    if time.time() - ts > 86400 * 30:
        return None
    expected = hmac.new(
        SECRET_KEY.encode(),
        f'{user_id}:{timestamp}'.encode(),
        hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(signature, expected):
        return None
    return user_id


def require_auth(handler):
    @functools.wraps(handler)
    def wrapper(event, context):
        headers = event.get('headers', {})
        auth_header = headers.get('Authorization', '') or headers.get('authorization', '')
        if not auth_header.startswith('Bearer '):
            return error('未授权，请先登录', ErrorCode.AUTH_ERROR, 401)
        token = auth_header[7:]
        user_id = verify_token(token)
        if not user_id:
            return error('Token无效或已过期', ErrorCode.TOKEN_EXPIRED, 401)
        event['userId'] = user_id
        return handler(event, context)
    return wrapper
