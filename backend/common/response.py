import json
from datetime import datetime


class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


def success(data=None, message='success', code=0):
    return {
        'code': code,
        'message': message,
        'data': data
    }


def error(message='error', code=-1, status_code=400):
    return {
        'code': code,
        'message': message,
        'data': None
    }, status_code


def paginate(data, total, page=1, page_size=20):
    return {
        'list': data,
        'total': total,
        'page': page,
        'pageSize': page_size,
        'hasMore': page * page_size < total
    }
