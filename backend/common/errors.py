class ErrorCode:
    SUCCESS = 0
    UNKNOWN_ERROR = -1
    PARAM_ERROR = 1001
    AUTH_ERROR = 2001
    TOKEN_EXPIRED = 2002
    TOKEN_INVALID = 2003
    NOT_FOUND = 3001
    ALREADY_EXISTS = 3002
    STATUS_ERROR = 4001
    PERMISSION_DENIED = 5001
    DB_ERROR = 6001
    INTERNAL_ERROR = 9999


ERROR_MESSAGES = {
    ErrorCode.SUCCESS: '成功',
    ErrorCode.UNKNOWN_ERROR: '未知错误',
    ErrorCode.PARAM_ERROR: '参数错误',
    ErrorCode.AUTH_ERROR: '认证失败',
    ErrorCode.TOKEN_EXPIRED: 'Token已过期',
    ErrorCode.TOKEN_INVALID: 'Token无效',
    ErrorCode.NOT_FOUND: '资源不存在',
    ErrorCode.ALREADY_EXISTS: '资源已存在',
    ErrorCode.STATUS_ERROR: '状态不允许此操作',
    ErrorCode.PERMISSION_DENIED: '无权限操作',
    ErrorCode.DB_ERROR: '数据库错误',
    ErrorCode.INTERNAL_ERROR: '内部错误',
}


def get_error_message(code):
    return ERROR_MESSAGES.get(code, '未知错误')
